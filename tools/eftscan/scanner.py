"""EFT bag scanner: press a hotkey, get the live value of every item on screen.

    python scanner.py run            # open the panel and leave it open while you play
    python scanner.py image FILE...  # scan screenshot files instead (testing, no game needed)

  Ctrl+Shift+Q      ShareX-style: the screen dims, drag a box round the items, release - it scans that
  Ctrl+Shift+Enter  scan the WHOLE screen (best effort: it has to find the inventory grids itself)
  (both can be changed in the panel's Settings tab)

The panel is a small always-on-top window that stays open and refreshes after every scan. It
only reads PIXELS of your own screen, like a screenshot tool - nothing touches the game's
process or memory. Between scans it is idle (no polling, no timer). A scan runs at
below-normal priority on two threads so it cannot take frames from the game.
"""
import os

# Cap the maths library BEFORE numpy loads: a scan is short, but there is no reason for it to fan
# out across every core while a game is running.
for _v in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ.setdefault(_v, "2")

import argparse
import ctypes
import json
import pathlib
import sys
import threading
import time
from ctypes import wintypes

import cv2
import numpy as np

import ammo
import flea
import labels
import learned
import matcher
import nicknames
import prices
import render

try:  # physical pixels everywhere, or a 125%-scaled display shifts every box
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:  # noqa: BLE001
    pass

HERE = pathlib.Path(__file__).parent
CONFIG = HERE / "config.local.json"
SCANS = HERE / "cache" / "scans"
DEFAULTS = {
    "mode": "pve",                 # which economy's prices: pve | regular
    "hotkey": "ctrl+shift+enter",  # whole screen. Swallowed by Windows, the game never sees it
    "area_hotkey": "ctrl+shift+q", # drag a box
    "cell": matcher.CELL,          # 63 at 1080p / 100% UI scale
    "min_score": 0.55,             # below this a cell is left unidentified
    "sure_score": 0.85,            # below this an identification is marked uncertain
    "monitor": 0,                  # 0 = primary monitor
    "panel_geometry": "820x700+30+60",
    "always_on_top": True,
    "grade_by": "perSlot",         # what the colours and the numbering rank by: perSlot | unit | total
    "tiers": render.DEFAULT_TIERS, # 5 colour levels, best first
    "stale_minutes": 60,           # a flea sample older than this is flagged in the list
    "smart_depth": 8,              # smart estimate = the Nth-cheapest unit on offer (lower = nearer the lowest listing)
    "flea_basis": "smart",         # which flea number to use: smart | low = cheapest listing | avg | mid = halfway
    "bag_mode": False,             # False: what ONE of each item is worth. True: counts, slots and a bag total
    "show_numbers": True,          # draw the number tags on the screenshot
    "manual": {},                  # {item id: {"price": n, "name": ...}} - prices you set by hand
    "ammo_tiers": {},              # {round name: "S".."D"} - ammo tiers you pinned by hand
}


def load_config():
    cfg = json.loads(json.dumps(DEFAULTS))  # deep copy: DEFAULTS must never be edited in place
    if CONFIG.exists():
        try:
            cfg.update(json.loads(CONFIG.read_text(encoding="utf8")))
        except ValueError:
            pass  # a corrupt settings file falls back to defaults rather than refusing to start
    if render.validate_tiers(cfg["tiers"]):
        cfg["tiers"] = json.loads(json.dumps(render.DEFAULT_TIERS))
    if cfg["grade_by"] not in render.GRADE_BY:
        cfg["grade_by"] = "perSlot"
    if cfg["flea_basis"] not in FLEA_BASIS:
        cfg["flea_basis"] = "smart"
    if not isinstance(cfg["smart_depth"], int) or not 2 <= cfg["smart_depth"] <= 25:
        cfg["smart_depth"] = 8
    if not isinstance(cfg["stale_minutes"], int) or not 5 <= cfg["stale_minutes"] <= 1440:
        cfg["stale_minutes"] = 60
    return cfg


def save_config(cfg):
    CONFIG.write_text(json.dumps(cfg, indent=2), encoding="utf8")


# --- priority ---------------------------------------------------------------------------------

def be_polite():
    """Below-normal CPU priority for this process, so a scan yields to the game."""
    try:
        BELOW_NORMAL = 0x00004000
        k32 = ctypes.windll.kernel32
        k32.SetPriorityClass(k32.GetCurrentProcess(), BELOW_NORMAL)
    except Exception:  # noqa: BLE001
        pass


# --- monitors -----------------------------------------------------------------------------------

def monitors():
    """-> [(x, y, w, h, is_primary)] for every display, in virtual-desktop pixels. Left-most first."""
    out = []
    try:
        class RECT(ctypes.Structure):
            _fields_ = [("l", ctypes.c_long), ("t", ctypes.c_long), ("r", ctypes.c_long), ("b", ctypes.c_long)]

        class INFO(ctypes.Structure):
            _fields_ = [("size", wintypes.DWORD), ("mon", RECT), ("work", RECT), ("flags", wintypes.DWORD)]

        PROC = ctypes.WINFUNCTYPE(ctypes.c_int, wintypes.HANDLE, wintypes.HDC, ctypes.POINTER(RECT), wintypes.LPARAM)

        def cb(handle, _dc, _rect, _lp):
            info = INFO()
            info.size = ctypes.sizeof(INFO)
            if ctypes.windll.user32.GetMonitorInfoW(handle, ctypes.byref(info)):
                m = info.mon
                out.append((m.l, m.t, m.r - m.l, m.b - m.t, bool(info.flags & 1)))
            return 1

        ctypes.windll.user32.EnumDisplayMonitors(None, None, PROC(cb), 0)
    except Exception:  # noqa: BLE001
        return []
    return sorted(out)


def side_screen_origin(width, height):
    """Where to put a window so it is NOT on the main screen (the one the game is on): the left-most
    other monitor, inset a little. -> (x, y) or None if there is only one screen."""
    others = [m for m in monitors() if not m[4]]
    if not others:
        return None
    x, y, w, h, _ = others[0]
    return x + max(10, min(40, w - width)), y + max(10, min(40, h - height))


# Where the full-screen "drag a box" overlay is placed. Real use: the primary monitor's corner. Tests move it
# far off-screen so they can drive it without flashing a window over whatever you are doing.
OVERLAY_ORIGIN = (0, 0)


# --- capture ----------------------------------------------------------------------------------

def grab_screen(monitor=0):
    from PIL import ImageGrab
    img = ImageGrab.grab(all_screens=monitor != 0)
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


# --- the scan itself --------------------------------------------------------------------------

def scan_boxes(screen, boxes, cfg, catalog):
    """Scan each (x, y, w, h) box. Nothing about where a window sits is assumed or remembered, and
    nothing assumes one regular grid: the gear panel's containers are separate little grids.

    Items are found by the NAME the game prints on them (OCR), identified from their picture, and
    the picture-only scan is only a back-up - and only counts where the game printed a label, so an
    empty slot can never turn into an item (see labels.py)."""
    items = []
    try:   # which items are guns: a gun and its grip can share a printed name, and mods ruin the gun's picture
        catalog.weapon_ids = {i for i, r in prices.load(cfg["mode"])["items"].items() if r.get("weapon")}
    except Exception:  # noqa: BLE001
        catalog.weapon_ids = getattr(catalog, "weapon_ids", set())
    index = getattr(catalog, "name_index", None)
    if index is None:
        index = catalog.name_index = labels.NameIndex(catalog)
    captures = {}
    for n, (bx, by, bw, bh) in enumerate(boxes, 1):
        crop = screen[by:by + bh, bx:bx + bw]
        texts = labels.read_text(crop)
        if flea.looks_like_flea(texts):       # the flea market's offer list: read prices, not inventory items
            for iid, g in flea.group(flea.parse_offers(texts), index, catalog).items():
                captures.setdefault(iid, g)
            if captures:
                continue
        named, texts = labels.detect(crop, catalog, index, texts)
        labels.assign_counts(named, texts)
        found = list(named)
        big = bw * bh > 1100 * 800   # a whole screen: the picture-only back-up is slow and the labels suffice
        for it in ([] if big else matcher.scan_hybrid(crop, catalog, cfg["cell"], cfg["min_score"])):
            rect = (it["x"], it["y"], it["wpx"], it["hpx"])
            if any(matcher._overlap(rect, (k["x"], k["y"], k["wpx"], k["hpx"])) > 0.30 for k in named):
                continue                                    # already identified by its label
            if texts and not labels.has_label_near(it, texts):
                continue                                    # no printed name there: an empty slot
            if texts and it["score"] < 0.88:
                continue    # the name was not recognised AND the picture is not convincing: not worth a guess
            found.append(it)
        for it in found:
            it["region"] = n
            it["px"] = (bx + it["x"], by + it["y"])
            items.append(it)
    return items, captures


_ocr = labels.ocr_engine


def read_stacks(screen, items, book):
    """Read the stack count printed in the bottom-right of every MONEY stack. (Ammo is ranked by
    tier and its stack size does not matter.) All the little strips go through the OCR in one pass.
    A durability like 40/40 is not a count and is ignored. -> sets it["count"] where one was read."""
    todo = [it for it in items if prices.lookup(book, it["id"], it["name"]).get("stack") and "count" not in it]
    if not todo:
        return
    S, PAD, WIDTH = 3, 30, 95 * 3
    rows, spans, y = [], [], 0
    for it in todo:
        x0, y0 = it["px"]
        W, H = it["wpx"], it["hpx"]
        strip = screen[y0 + H - 24:y0 + H - 1, x0 + max(0, W - 95):x0 + W - 1]
        if strip.size == 0:
            rows.append(np.zeros((PAD, WIDTH, 3), np.uint8))
        else:
            strip = cv2.resize(strip, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
            canvas = np.zeros((strip.shape[0] + PAD, WIDTH, 3), np.uint8)
            canvas[:strip.shape[0], :strip.shape[1]] = strip
            rows.append(canvas)
        spans.append((y, y + rows[-1].shape[0]))
        y += rows[-1].shape[0]
    result, _ = _ocr()(np.vstack(rows))
    for box, text, conf in result or []:
        cy = float(np.mean([pt[1] for pt in box]))
        digits = text.replace(" ", "").replace(",", "").replace(".", "")
        if not digits.isdigit() or float(conf) < 0.6:
            continue  # "148/163" is durability, not a count
        for it, (a, b) in zip(todo, spans):
            if a <= cy < b:
                it["count"] = int(digits)
                break


FLEA_BASIS = {
    "smart": "Smart estimate - where the cheap offers cluster (recommended)",
    "low": "Lowest listing - can be one silly lowball",
    "avg": "Average of all listings (a few high listings drag it up)",
    "mid": "Halfway between the lowest and the average",
}


def pick_flea(rec, basis, depth=8):
    """The flea number to use for a price record.

    smart  where the cheapest offers cluster (prices.smart_price) - ignores a lone lowball AND the scam-priced tail
    low    the single cheapest listing
    avg    the average of all listings (scam listings drag it up)
    mid    halfway between low and avg
    Falls back to the average when a record lacks what the chosen basis needs."""
    avg, low, est = rec.get("flea"), rec.get("low"), rec.get("est")
    if basis == "smart":
        if rec.get("ladder"):      # recomputed at YOUR depth; the stored estimate is the depth-8 one
            return prices.smart_price([tuple(x) for x in rec["ladder"]], avg, low, depth) or est
        if est:
            return est
    if basis == "low" and low:
        return low
    if basis == "mid" and low and avg:
        return round((low + avg) / 2)
    return avg


def value_items(items, price_book, cfg):
    """Group identical items into table rows.

    kind 'item'   priced, counted in the totals (auto price, or a price you set by hand)
    kind 'ammo'   shown with its tier letter; no price, not in the totals
    kind 'unsure' the match is below the confidence line and you have not priced it yourself:
                  listed (bold red) but never added to anything

    By default a row is ONE item: two defibs are one row, twenty TNT bricks are one row, and the value is
    what a single one is worth (per slot = that / the slots one takes up: 2 slots worth 10k is 5k a slot).
    With `bag_mode` the row also carries the count, the slots they all take and the group total.
    Money is the exception: a stack's count IS its value, so its row is always the whole pile."""
    sure = cfg["sure_score"]
    manual = cfg.get("manual", {})
    pinned_ammo = cfg.get("ammo_tiers", {})
    groups = {}
    for it in items:
        g = groups.setdefault(it["id"], {"its": [], "name": it["name"], "short": it["short"], "id": it["id"]})
        g["its"].append(it)
    rows = []
    for gid, g in groups.items():
        its = g["its"]
        rec = learned.apply(prices.lookup(price_book, gid, g["name"]), cfg["mode"], gid, int(cfg.get("smart_depth", 8)))
        score = min(i["score"] for i in its)
        slots_one = its[0]["w"] * its[0]["h"]
        slots_all = sum(i["w"] * i["h"] for i in its)
        mine = manual.get(gid)
        if mine and mine.get("slots"):      # you said how many slots it really takes (a modded gun's size is a guess)
            slots_one = int(mine["slots"])
            slots_all = slots_one * len(its)
        row = {"id": gid, "name": g["name"], "short": g["short"], "slots": slots_all, "slotsOne": slots_one,
               "size": (f"{slots_one} sl" if mine and mine.get("slots") else
                        f"{its[0]['w']}x{its[0]['h']}" + ("+" if any(i.get("clipped") for i in its) else "")),
               "score": score,
               "unread": 0, "ammoTier": None, "manual": bool(mine), "unit": None, "basis": None,
               "fleaAvg": rec.get("flea"), "fleaLow": rec.get("low"), "fleaEst": rec.get("est"),
               "age": (round((time.time() - rec["at"]) / 60) if rec.get("at") else None),
               "listings": rec.get("n"), "source": rec.get("source"), "nick": nicknames.get(gid),
               "reason": (mine or {}).get("reason", ""), "reasonNote": (mine or {}).get("note", ""),
               "traderName": rec.get("traderName"), "qty": len(its)}
        tier = ammo.tier_for(g["name"], pinned_ammo)
        if score < sure and not mine and not (tier and tier[2] == "manual"):
            row.update(kind="unsure", uncertain=True)
        elif tier and not mine:
            row.update(kind="ammo", uncertain=False, ammoTier=tier[0], basis="ammo-" + tier[2])
        else:
            if mine:
                unit, basis = mine["price"], "manual"
            else:
                flea, trader = pick_flea(rec, cfg.get("flea_basis", "smart"), int(cfg.get("smart_depth", 8))), rec.get("trader")
                unit = flea if flea else trader
                basis = "money" if rec.get("money") else ("flea" if flea else ("trader" if trader else None))
            qty = 0
            for i in its:
                if rec.get("stack") and "count" in i:
                    qty += i["count"]
                else:
                    qty += 1
                    row["unread"] += 1 if rec.get("stack") else 0
            money = bool(rec.get("money"))
            # One of the thing, unless it is a pile of money or you asked for bag totals.
            counted = qty if (money or cfg.get("bag_mode")) else 1
            span = slots_all if (money or cfg.get("bag_mode")) else slots_one
            row.update(kind="item", uncertain=False, qty=qty, unit=unit, basis=basis,
                       total=round((unit or 0) * qty),
                       value=round((unit or 0) * counted) if unit is not None else None,
                       perSlot=round((unit or 0) * counted / span) if unit else None)
        row.setdefault("total", 0)
        row.setdefault("perSlot", None)
        rows.append(row)
    by = render.effective_grade(cfg["grade_by"], cfg.get("bag_mode"))
    render.sort_and_number(rows, by)
    return render.decorate(rows, cfg["tiers"], by)


def summarize(rows):
    """Bag totals count PRICED items only. Ammo (tiered) and unsure rows are never added in."""
    priced = [r for r in rows if r["kind"] == "item"]
    slots = sum(r["slots"] for r in priced)
    total = sum(r["total"] for r in priced)
    return {"items": len(priced), "slots": slots, "total": total,
            "perSlot": round(total / slots) if slots else 0,
            "ammoRows": sum(1 for r in rows if r["kind"] == "ammo"),
            "unsureRows": sum(1 for r in rows if r["kind"] == "unsure")}


def fmt(n):
    return "-" if n is None else f"{n:,}"


def print_table(rows, tot, mode, scanned, bag=False):
    print(f"\n{mode.upper()} prices  (flea market scanned {scanned})")
    head = (f"{'#':>3} {'ITEM':36} " + (f"{'QTY':>9} " if bag else "") +
            f"{'/SLOT':>9} {'VALUE':>10}" + (f" {'TOTAL':>11}" if bag else ""))
    print(head)
    for r in rows:
        no = "" if r["no"] is None else str(r["no"])
        if r["kind"] == "unsure":
            cells = ["-", "UNSURE", "-"]
        elif r["kind"] == "ammo":
            cells = ["-", f"tier {r['ammoTier']}", "-"]
        else:
            cells = [fmt(r["perSlot"]), fmt(r["value"]), fmt(r["total"])]
        qty = f"{r['qty']:>9,} " if bag else ""
        line = f"{no:>3} {(r['nick'] or r['name'])[:36]:36} {qty}{cells[0]:>9} {cells[1]:>10}"
        if bag:
            line += f" {cells[2]:>11}"
        print(line)
    if bag:
        print(f"\n  BAG TOTAL {tot['total']:,} RUB   {tot['items']} priced items, {tot['slots']} slots   "
              f"({tot['perSlot']:,} per slot)")
    if tot["ammoRows"] or tot["unsureRows"]:
        print(f"  not valued: {tot['ammoRows']} ammo (tiered), {tot['unsureRows']} unsure")


def age_text(price_book):
    ts = [v["scanned"] for v in price_book["items"].values() if v.get("scanned")]
    if not ts:
        return "unknown"
    mins = int((time.time() - max(ts)) / 60)
    return f"{mins} min ago" if mins < 90 else f"{mins // 60} h ago"


def run_scan(screen, cfg, catalog, boxes=None):
    """-> dict(rows, tot, scanned, items, took) or dict(error=...). No printing, no UI."""
    t0 = time.time()
    if boxes is None:  # whole screen: items are found by their printed names, so no grid-finding is needed
        boxes = [(0, 0, screen.shape[1], screen.shape[0])]
    items, captures = scan_boxes(screen, boxes, cfg, catalog)
    if captures:
        return learn_from_flea(screen, captures, cfg, boxes, t0)
    if not items:
        return {"error": "No items recognised in that area."}
    book = prices.load(cfg["mode"])
    try:
        read_stacks(screen, items, book)
    except Exception as e:  # noqa: BLE001 - a missing OCR must not cost the whole scan
        print("  stack counts unavailable:", e)
    rows = value_items(items, book, cfg)
    return {"rows": rows, "tot": summarize(rows), "scanned": age_text(book), "items": items,
            "took": time.time() - t0, "boxes": boxes}


def learn_from_flea(screen, captures, cfg, boxes, t0):
    """A flea-market screen: store what each item's offers say, and show those prices."""
    depth = int(cfg.get("smart_depth", 8))
    for iid, g in captures.items():
        learned.save(cfg["mode"], iid, g["name"], g["ladder"])
    book = prices.load(cfg["mode"])
    items = [{"id": iid, "name": g["name"], "short": "", "w": 1, "h": 1, "score": 1.0, "px": (0, 0), "wpx": 0, "hpx": 0}
             for iid, g in captures.items()]
    rows = value_items(items, book, cfg)
    for r in rows:
        r["size"] = "-"
    summary = []
    for iid, g in captures.items():
        rec = learned.record_from_ladder(g["ladder"], depth)
        summary.append({"name": g["name"], "smart": rec["est"], "low": rec["low"], "offers": rec["n"],
                        "ladder": g["ladder"]})
    return {"rows": rows, "tot": summarize(rows), "scanned": "just now (your flea screen)", "items": [],
            "took": time.time() - t0, "boxes": boxes, "learned": summary}


def save_scan(screen, result, cfg):
    """Keep the screenshot, the numbered copy and the raw result: a bad scan is a ready test case."""
    SCANS.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    cv2.imwrite(str(SCANS / f"{stamp}.png"), screen)
    marked = render.numbered_screenshot(screen, result["items"], result["rows"], result["boxes"], cfg["show_numbers"])
    cv2.imwrite(str(SCANS / f"{stamp}-marked.png"), marked)
    (SCANS / f"{stamp}.json").write_text(json.dumps({"rows": result["rows"], "total": result["tot"], "items": [
        {k: v for k, v in i.items() if k != "px"} for i in result["items"]]}, indent=1), encoding="utf8")


def do_scan(screen, cfg, catalog, boxes=None, save=True):
    """Scan and print (the command-line path)."""
    res = run_scan(screen, cfg, catalog, boxes)
    if "error" in res:
        print("  " + res["error"])
        return res
    print_table(res["rows"], res["tot"], cfg["mode"], res["scanned"], cfg.get("bag_mode"))
    print(f"  scan took {res['took']:.1f}s")
    if save:
        save_scan(screen, res, cfg)
    return res


# --- drag a box ---------------------------------------------------------------------------------

def pick_area(screen, parent=None):
    """Freeze the screen, let the user drag a box. -> (x, y, w, h) or None.

    With a `parent` Tk window the overlay is a Toplevel of it (the panel's own event loop keeps
    running); without one it makes its own root."""
    import tkinter as tk
    from PIL import Image, ImageTk

    H, W = screen.shape[:2]
    root = tk.Toplevel(parent) if parent is not None else tk.Tk()
    root.overrideredirect(True)
    root.geometry(f"{W}x{H}+{OVERLAY_ORIGIN[0]}+{OVERLAY_ORIGIN[1]}")
    root.attributes("-topmost", True)
    canvas = tk.Canvas(root, width=W, height=H, highlightthickness=0, cursor="crosshair")
    canvas.pack()
    photo = ImageTk.PhotoImage(Image.fromarray(cv2.cvtColor(screen, cv2.COLOR_BGR2RGB)))
    canvas.create_image(0, 0, image=photo, anchor="nw")

    # ShareX-style: the screen dims everywhere except the box you are dragging, with a crosshair
    # and a live size read-out. Four stippled panes cover the outside; they are just resized.
    def pane():
        return canvas.create_rectangle(0, 0, 0, 0, fill="black", stipple="gray50", outline="")
    panes = [pane() for _ in range(4)]

    def dim(x0, y0, x1, y1):
        canvas.coords(panes[0], 0, 0, W, y0)
        canvas.coords(panes[1], 0, y1, W, H)
        canvas.coords(panes[2], 0, y0, x0, y1)
        canvas.coords(panes[3], x1, y0, W, y1)

    dim(0, 0, 0, 0)  # nothing selected yet: dim the whole screen
    canvas.coords(panes[0], 0, 0, W, H)
    vline = canvas.create_line(0, 0, 0, H, fill="#4be37a")
    hline = canvas.create_line(0, 0, W, 0, fill="#4be37a")
    box = canvas.create_rectangle(0, 0, 0, 0, outline="#4be37a", width=2)
    label = canvas.create_text(0, 0, fill="#ffffff", font=("Segoe UI", 10, "bold"), anchor="nw", text="")
    hint = canvas.create_text(W // 2, 22, fill="#ffffff", font=("Segoe UI", 12, "bold"),
                              text="Drag a box round the items to scan   -   Esc cancels")
    state = {"start": None, "result": None}

    def move(e):
        canvas.coords(vline, e.x, 0, e.x, H)
        canvas.coords(hline, 0, e.y, W, e.y)

    def press(e):
        state["start"] = (e.x, e.y)
        canvas.delete(hint)

    def drag(e):
        move(e)
        if not state["start"]:
            return
        x0, y0 = state["start"]
        x0, x1, y0, y1 = min(x0, e.x), max(x0, e.x), min(y0, e.y), max(y0, e.y)
        dim(x0, y0, x1, y1)
        canvas.coords(box, x0, y0, x1, y1)
        canvas.coords(label, x0 + 4, max(0, y0 - 20))
        canvas.itemconfigure(label, text=f"{x1 - x0} x {y1 - y0}")

    def release(e):
        if state["start"]:
            x0, y0 = state["start"]
            x, y, w, h = min(x0, e.x), min(y0, e.y), abs(e.x - x0), abs(e.y - y0)
            if w >= 40 and h >= 40:
                state["result"] = (x, y, w, h)
        root.destroy()

    canvas.bind("<Motion>", move)
    canvas.bind("<ButtonPress-1>", press)
    canvas.bind("<B1-Motion>", drag)
    canvas.bind("<ButtonRelease-1>", release)
    root.bind("<Escape>", lambda _e: root.destroy())
    root.focus_force()
    root.after(80, root.focus_force)
    if parent is not None:
        root.grab_set()
        parent.wait_window(root)
    else:
        root.mainloop()
    return state["result"]


# --- hotkeys ------------------------------------------------------------------------------------

MOD = {"alt": 0x1, "ctrl": 0x2, "shift": 0x4, "win": 0x8}
VK = {**{f"f{i}": 0x6F + i for i in range(1, 25)},
      **{chr(c).lower(): c for c in range(ord("A"), ord("Z") + 1)},  # VK_A..VK_Z are UPPERCASE ASCII
      **{str(d): 0x30 + d for d in range(10)},
      "enter": 0x0D, "space": 0x20, "tab": 0x09, "pause": 0x13, "scrolllock": 0x91, "insert": 0x2D,
      "delete": 0x2E, "home": 0x24, "end": 0x23, "pageup": 0x21, "pagedown": 0x22,
      "up": 0x26, "down": 0x28, "left": 0x25, "right": 0x27}
MOD_VKS = {  # every virtual-key that counts as each modifier (left/right variants)
    "ctrl": {0x11, 0xA2, 0xA3}, "alt": {0x12, 0xA4, 0xA5}, "shift": {0x10, 0xA0, 0xA1}, "win": {0x5B, 0x5C},
}
MOD_ORDER = ["ctrl", "alt", "shift", "win"]

# Combinations that would break the rest of Windows (or are reserved by it). Refused outright.
FORBIDDEN = {
    "ctrl+c", "ctrl+v", "ctrl+x", "ctrl+z", "ctrl+y", "ctrl+a", "ctrl+s", "ctrl+w", "ctrl+f", "ctrl+p",
    "ctrl+n", "ctrl+o", "ctrl+t", "ctrl+r", "alt+f4", "alt+tab", "alt+space", "alt+enter", "ctrl+esc",
    "ctrl+alt+delete", "ctrl+shift+esc", "win+l", "win+d", "win+e", "win+r", "win+tab",
}


def parse_hotkey(text):
    """'ctrl+alt+f9' -> (modifier names, [key names]). More than one key = a chord like ctrl+q+e."""
    parts = [p.strip().lower() for p in text.split("+") if p.strip()]
    mods = [p for p in parts if p in MOD]
    keys = [p for p in parts if p not in MOD]
    for k in keys:
        if k not in VK:
            raise ValueError(f"'{k}' is not a key this tool can use")
    return mods, keys


def normalize_hotkey(text):
    mods, keys = parse_hotkey(text)
    return "+".join([m for m in MOD_ORDER if m in mods] + keys)


def check_hotkey(text):
    """-> (normalised text, None) if it is acceptable, else (None, reason). Pure: does not touch
    Windows. Whether Windows will actually hand the combo over is tested separately, by trying."""
    try:
        mods, keys = parse_hotkey(text)
    except ValueError as e:
        return None, str(e)
    if not keys:
        return None, "Pick a key as well as the modifier."
    if not mods:
        return None, "Add Ctrl, Alt or Shift - a bare key would be swallowed everywhere, game included."
    if mods == ["shift"] and (len(keys[0]) == 1 or keys[0] in ("space", "enter", "tab")):
        return None, "Shift on its own just types a capital letter - add Ctrl or Alt as well."
    norm = normalize_hotkey(text)
    if norm in FORBIDDEN:
        return None, f"{norm} is used by Windows itself - pick something else."
    return norm, None


class ChordDetector:
    """Pure state machine for 'hold ctrl, then press Q and E together'.

    Windows' RegisterHotKey only takes ONE key plus modifiers, so a two-key chord needs a
    low-level keyboard hook. While the modifier is held, the chord's keys are swallowed (the
    game never gets a lean-left/lean-right from them); with the modifier up they pass through
    untouched. Kept free of ctypes so it can be tested by feeding it key events.
    """

    def __init__(self, mods, keys, on_fire):
        self.mod_sets = [MOD_VKS[m] for m in mods]
        self.keys = {VK[k] for k in keys}
        self.on_fire = on_fire
        self.down = set()
        self.armed = set()
        self.latched = False

    def _mods_held(self):
        return all(self.down & s for s in self.mod_sets)

    def feed(self, vk, is_down):
        """-> True if the event must be swallowed (not delivered to the game)."""
        if is_down:
            self.down.add(vk)
        else:
            self.down.discard(vk)
        if vk not in self.keys:
            return False
        if is_down:
            if vk in self.armed:
                return True            # auto-repeat of a key we already swallowed
            if not self._mods_held():
                return False
            self.armed.add(vk)
            if self.armed == self.keys and not self.latched:
                self.latched = True
                self.on_fire()
            return True
        if vk in self.armed:           # release of a key whose press we swallowed
            self.armed.discard(vk)
            self.latched = False
            return True
        return False


class HotkeyService:
    """Owns the hotkeys on one thread. `start()` reports whether Windows really handed them over,
    and the whole service can be stopped and started again with different keys.

    One key + modifiers goes through RegisterHotKey, which makes Windows deliver the combo to us
    and NOT to the focused application. A chord of two keys goes through a low-level keyboard hook
    that swallows those keys while the modifier is held."""

    def __init__(self, handlers):
        self.handlers = handlers          # {hotkey text: callable}
        self.thread = None
        self.tid = None
        self.error = None
        self._ready = threading.Event()

    def start(self, timeout=3.0):
        """-> None on success, or a message saying what Windows refused."""
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        self._ready.wait(timeout)
        return self.error

    def stop(self):
        if self.thread and self.tid:
            ctypes.windll.user32.PostThreadMessageW(self.tid, 0x0012, 0, 0)  # WM_QUIT
            self.thread.join(2.0)
        self.thread = self.tid = None

    def _run(self):
        user32, k32 = ctypes.windll.user32, ctypes.windll.kernel32
        self.tid = k32.GetCurrentThreadId()
        ids, chords, hook = {}, [], None
        keep = []
        try:
            for n, (text, fn) in enumerate(self.handlers.items(), 1):
                mods, keys = parse_hotkey(text)
                if len(keys) == 1:
                    flags = 0x4000  # MOD_NOREPEAT
                    for m in mods:
                        flags |= MOD[m]
                    if not user32.RegisterHotKey(None, n, flags, VK[keys[0]]):
                        raise RuntimeError(f"Windows would not give us {text} - another program already owns "
                                           "that combination.")
                    ids[n] = fn
                else:
                    chords.append(ChordDetector(mods, keys, fn))
            if chords:
                HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_ssize_t, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

                class KBD(ctypes.Structure):
                    _fields_ = [("vk", wintypes.DWORD), ("scan", wintypes.DWORD), ("flags", wintypes.DWORD),
                                ("time", wintypes.DWORD), ("extra", ctypes.c_size_t)]

                user32.CallNextHookEx.argtypes = [wintypes.HHOOK, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM]
                user32.CallNextHookEx.restype = ctypes.c_ssize_t

                def proc(code, wparam, lparam):
                    if code == 0:
                        k = ctypes.cast(lparam, ctypes.POINTER(KBD)).contents
                        if not k.flags & 0x10:  # ignore events that other programs injected
                            down = wparam in (0x100, 0x104)
                            if wparam in (0x100, 0x101, 0x104, 0x105) and any([c.feed(k.vk, down) for c in chords]):
                                return 1
                    return user32.CallNextHookEx(None, code, wparam, lparam)

                keep.append(HOOKPROC(proc))  # a reference, or it is garbage collected and Windows crashes
                user32.SetWindowsHookExW.argtypes = [ctypes.c_int, HOOKPROC, wintypes.HINSTANCE, wintypes.DWORD]
                user32.SetWindowsHookExW.restype = wintypes.HHOOK
                k32.GetModuleHandleW.restype = wintypes.HMODULE  # default int return truncates a 64-bit handle
                k32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
                hook = user32.SetWindowsHookExW(13, keep[0], k32.GetModuleHandleW(None), 0)
                if not hook:
                    raise RuntimeError(f"Could not install the keyboard hook (Windows error {ctypes.GetLastError()}).")
        except Exception as e:  # noqa: BLE001
            self.error = str(e)
            self._cleanup(user32, ids, hook)
            self._ready.set()
            return
        self._ready.set()
        msg = wintypes.MSG()
        try:
            while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) > 0:
                if msg.message == 0x0312 and msg.wParam in ids:  # WM_HOTKEY
                    ids[msg.wParam]()
        finally:
            self._cleanup(user32, ids, hook)

    @staticmethod
    def _cleanup(user32, ids, hook):
        for n in ids:
            user32.UnregisterHotKey(None, n)
        if hook:
            user32.UnhookWindowsHookEx(hook)


def test_register(text):
    """Would Windows give us this combination? Tried for real, on this thread, and released again.
    -> None if free, else the reason."""
    mods, keys = parse_hotkey(text)
    if len(keys) != 1:
        return None  # chords go through the hook, which cannot collide
    flags = 0x4000
    for m in mods:
        flags |= MOD[m]
    user32 = ctypes.windll.user32
    if not user32.RegisterHotKey(None, 0x7A7A, flags, VK[keys[0]]):
        return "another program already owns that combination."
    user32.UnregisterHotKey(None, 0x7A7A)
    return None


# --- commands ---------------------------------------------------------------------------------

def cmd_image(args):
    cfg = load_config()
    catalog = matcher.Catalog()
    for f in args.files:
        img = cv2.imread(f)
        print(f"\n=== {f}")
        do_scan(img, cfg, catalog, boxes=[(0, 0, img.shape[1], img.shape[0])], save=False)


def _single_instance():
    """A second copy would fight the first one for the hotkeys. -> False if one is already running."""
    k32 = ctypes.windll.kernel32
    k32.CreateMutexW.restype = wintypes.HANDLE
    handle = k32.CreateMutexW(None, False, "Local\\eftscan-single-instance")
    cmd_run.mutex = handle  # keep it alive for the life of the process
    return ctypes.GetLastError() != 183  # ERROR_ALREADY_EXISTS


def _log_to_file():
    """pythonw has no console, so anything printed would vanish: keep it in cache/scanner.log."""
    if sys.stdout is None or sys.stderr is None or not sys.stdout.isatty():
        (HERE / "cache").mkdir(exist_ok=True)
        f = open(HERE / "cache" / "scanner.log", "a", buffering=1, encoding="utf8")
        sys.stdout = sys.stderr = f
        print(f"\n--- started {time.strftime('%Y-%m-%d %H:%M:%S')}")


def cmd_run(_args):
    _log_to_file()
    if not _single_instance():
        ctypes.windll.user32.MessageBoxW(None, "The EFT scanner is already running - look for it in the taskbar.",
                                         "EFT bag scan", 0x40)
        return
    import panel
    be_polite()
    panel.run(load_config())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("run").set_defaults(fn=cmd_run)
    im = sub.add_parser("image")
    im.add_argument("files", nargs="+")
    im.set_defaults(fn=cmd_image)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
