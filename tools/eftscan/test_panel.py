"""Drive the real panel without a game: fake the screen grab, fake the mouse drag. Settings are
redirected to a temp file so a test can never overwrite your real config."""
import json
import pathlib
import tempfile
import time

import cv2

import scanner
import panel
import nicknames

panel.TEST_ORIGIN = (30000, 30000)          # no window may appear in front of whoever is using the PC
scanner.OVERLAY_ORIGIN = (30000, 30000)
TMP = pathlib.Path(tempfile.mkdtemp())
nicknames.PATH = TMP / 'itemNicknames.json'     # never touch the real file
scanner.CONFIG = TMP / "config.json"
scanner.SCANS = TMP / "scans"
IMG = cv2.imread("../../src/pages/eftShopping/items_test_screenshots/fullscreen.png")
scanner.grab_screen = lambda monitor=0: IMG.copy()

cfg = scanner.load_config()
cfg["hotkey"], cfg["area_hotkey"] = "ctrl+alt+f19", "ctrl+alt+f18"      # keep clear of anything real
p = panel.Panel(cfg)


def pump(seconds):
    end = time.time() + seconds
    while time.time() < end:
        p.root.update()
        time.sleep(0.02)


def scan():
    def drag():
        top = [w for w in p.root.winfo_children() if isinstance(w, panel.tk.Toplevel)][0]
        c = top.winfo_children()[0]
        c.event_generate("<ButtonPress-1>", x=1262, y=78)
        c.event_generate("<B1-Motion>", x=1700, y=600)
        c.event_generate("<B1-Motion>", x=1910, y=958)
        c.event_generate("<ButtonRelease-1>", x=1910, y=958)
    p.root.after(900, drag)
    p.trigger("area")
    pump(9)


t = time.time()
while p.catalog is None and time.time() - t < 60:
    pump(0.2)
pump(0.5)
assert p.hotkeys is not None, "hotkeys should be registered"

# --- 1. a scan: table, numbering, screenshot tab -------------------------------------------------
scan()
rows = p.last["rows"]
kinds = [r["kind"] for r in rows]
print("rows:", len(rows), {k: kinds.count(k) for k in set(kinds)})
assert kinds == sorted(kinds, key=["item", "ammo", "unsure"].index), "items, then ammo, then unsure"
nums = [r["no"] for r in rows if r["kind"] == "item"]
assert nums == list(range(1, len(nums) + 1)), "priced rows are numbered 1..N in order"
vals = [r["perSlot"] or 0 for r in rows if r["kind"] == "item"]
assert vals == sorted(vals, reverse=True), "numbering follows value, highest first"
assert p.shot_bgr is not None and p.nb.select() == str(p.tab_scan)
p.root.update()
assert p.canvas.winfo_ismapped() and p.tree.winfo_ismapped(), "picture and list are visible together"
assert p.tree.winfo_rootx() < p.canvas.winfo_rootx(), "list on the left, picture on the right"
ids = [r["id"] for r in rows]; assert len(ids) == len(set(ids)), "one row per distinct item"
many = [r for r in rows if r["kind"] == "item" and r["qty"] > 1 and r["basis"] != "money"]
assert many and all(r["value"] == r["unit"] for r in many), "default shows what ONE is worth, not the pile"
assert list(p.tree["displaycolumns"]) == list(panel.ITEM_COLUMNS), "no quantity / total columns by default"
assert [p.tree.set(i, "no") for i in p.tree.get_children()] == [r["label"] for r in rows], "table == screenshot labels"

# --- 1b. bag mode is a toggle, off by default ----------------------------------------------------
assert p.cfg["bag_mode"] is False
p.bag_var.set(True); assert p.save_settings()
assert list(p.tree["displaycolumns"]) == list(panel.BAG_COLUMNS) and "BAG" not in p.total.cget("text")
bag_many = next(r for r in p.last["rows"] if r["id"] == many[0]["id"])
assert bag_many["value"] == bag_many["unit"] * bag_many["qty"], "bag mode counts the pile"
assert "RUB" in p.total.cget("text") and p.last["tot"]["total"] > 0
p.bag_var.set(False); assert p.save_settings()
assert list(p.tree["displaycolumns"]) == list(panel.ITEM_COLUMNS)

ammo_rows = [r for r in rows if r["kind"] == "ammo"]
assert ammo_rows and all(r["ammoTier"] in "SABCD" and r["total"] == 0 for r in ammo_rows), "ammo is tiered, not priced"

# --- 1c. no Size column, per-slot first; click a name to nickname it ------------------------------
assert "size" not in p.tree["columns"] and list(p.tree["displaycolumns"]) == ["no", "item", "slot", "value"]
first = next(r for r in p.last["rows"] if r["kind"] == "item")
iid, official = first["id"], first["name"]
box = p.tree.bbox(iid, "item")
p.tree.event_generate("<ButtonRelease-1>", x=box[0] + 8, y=box[1] + box[3] // 2); p.root.update()
assert p.editor is not None, "clicking a name opens the editor"
p.editor.delete(0, "end"); p.editor.insert(0, "Cash stack"); p.editor.focus_force(); p.root.update(); p.editor.event_generate("<Return>"); p.root.update()
assert p.tree.item(iid, "values")[1].startswith("Cash stack") and p.editor is None
saved = json.loads(nicknames.PATH.read_text(encoding="utf8"))["nicknames"]
assert saved[iid] == {"nickname": "Cash stack", "name": official}, saved
assert next(r for r in p.last["rows"] if r["id"] == iid)["name"] == official, "the official name is untouched"
box2 = p.tree.bbox(iid, "slot")
p.tree.event_generate("<ButtonRelease-1>", x=box2[0] + 8, y=box2[1] + 4); p.root.update()
assert p.editor is None, "clicking a number only selects the row"
p._rename(iid); p.editor.delete(0, "end"); p.editor.focus_force(); p.root.update(); p.editor.event_generate("<Return>"); p.root.update()
assert official in p.tree.item(iid, "values")[1] and iid not in json.loads(nicknames.PATH.read_text(encoding="utf8"))["nicknames"]
p._rename(iid); p.editor.delete(0, "end"); p.editor.insert(0, "x" * 61); p.editor.focus_force(); p.root.update(); p.editor.event_generate("<Return>"); p.root.update()
assert "60 characters" in p.status.cget("text") and p.editor is None
assert not nicknames.validate("ab")[0] and nicknames.validate("  two   words ")[0] == "two words"

# --- 2. unsure rows are listed, red, and never in the total
# (labels make most matches certain now, so force some doubt by raising the confidence line)
p.cfg["sure_score"] = 0.995
p._recompute()
rows = p.last["rows"]
unsure = [r for r in rows if r["kind"] == "unsure"]
assert unsure and all("unsure" in p.tree.item(r["id"], "tags") for r in unsure)
assert p.last["tot"]["total"] == sum(r["total"] for r in p.last["rows"] if r["kind"] == "item")
assert p.last["tot"]["unsureRows"] == len(unsure)

# --- 3. pricing an unsure item by hand brings it into the total ----------------------------------
before = p.last["tot"]["total"]
target = unsure[0]
p.cfg["manual"][target["id"]] = {"price": 12345, "name": target["name"]}
p._recompute()
row = next(r for r in p.last["rows"] if r["id"] == target["id"])
assert row["kind"] == "item" and row["basis"] == "manual" and row["unit"] == 12345
assert p.last["tot"]["total"] == before + 12345 * row["qty"]
del p.cfg["manual"][target["id"]]
p._recompute()
assert next(r for r in p.last["rows"] if r["id"] == target["id"])["kind"] == "unsure"
p.cfg["sure_score"] = 0.85
p._recompute()

# --- 3b. WHY a price was set: a barter reason (and what it trades for) shows in the list ----------
tgt = next(r for r in p.last["rows"] if r["kind"] == "item" and r["basis"] != "money")
p.cfg["manual"][tgt["id"]] = {"price": 48000, "name": tgt["name"], "reason": "barter", "note": "Propital"}
p._recompute()
row = next(r for r in p.last["rows"] if r["id"] == tgt["id"])
assert row["reason"] == "barter" and row["reasonNote"] == "Propital" and row["basis"] == "manual"
assert "barter: Propital" in p.tree.item(tgt["id"], "values")[1], "the list says WHY"
p.cfg["manual"][tgt["id"]] = {"price": 48000, "name": tgt["name"]}          # no reason: just your price
p._recompute()
assert "barter" not in p.tree.item(tgt["id"], "values")[1] and "your price" in p.tree.item(tgt["id"], "values")[1]
del p.cfg["manual"][tgt["id"]]
p._recompute()

# --- 3c. you can say how many slots something really takes (modded guns are measured guesses) ------
tgt = next(r for r in p.last["rows"] if r["kind"] == "item" and r["basis"] != "money" and r["unit"])
p.cfg["manual"][tgt["id"]] = {"price": 40000, "name": tgt["name"], "slots": 8}
p._recompute()
row = next(r for r in p.last["rows"] if r["id"] == tgt["id"])
assert row["size"] == "8 sl" and row["perSlot"] == 5000, (row["size"], row["perSlot"])
del p.cfg["manual"][tgt["id"]]
p._recompute()

# --- 3d. flea basis: lowest listing / average / halfway --------------------------------------------
import prices as _prices
book = _prices.load(p.cfg["mode"])["items"]
pick = next(r for r in p.last["rows"] if r["kind"] == "item" and r["basis"] == "flea" and r["fleaAvg"] and r["fleaLow"]
            and r["fleaLow"] < r["fleaAvg"])
for basis, expect in (("smart", pick["fleaEst"]), ("low", pick["fleaLow"]), ("avg", pick["fleaAvg"]),
                      ("mid", round((pick["fleaLow"] + pick["fleaAvg"]) / 2))):
    p.cfg["flea_basis"] = basis
    p._recompute()
    got = next(r for r in p.last["rows"] if r["id"] == pick["id"])
    assert got["unit"] == expect, (basis, got["unit"], expect)
# the depth setting is validated like everything else
p.depth_var.set("1"); assert p.save_settings() is False and "2 to 25" in p.settings_msg.cget("text")
p.depth_var.set("x"); assert p.save_settings() is False
p.depth_var.set("8")
p.stale_var.set("2"); assert p.save_settings() is False and "5 to 1440" in p.settings_msg.cget("text")
p.stale_var.set("60")
p.cfg["flea_basis"] = "smart"
p._recompute()
assert scanner.pick_flea({"flea": 169000, "low": None}, "low") == 169000, "no lowest listing -> the average"
assert scanner.pick_flea({"flea": 169000, "low": 35000}, "low") == 35000

# --- 4. settings: bad input is refused and NOTHING is saved --------------------------------------
saved_before = scanner.CONFIG.read_text() if scanner.CONFIG.exists() else None


def attempt(**fields):
    p.hk_vars["hotkey"].set(fields.get("hotkey", p.cfg["hotkey"]))
    p.hk_vars["area_hotkey"].set(fields.get("area", p.cfg["area_hotkey"]))
    for i, v in enumerate(fields.get("tiers", [f"{t['min']:,}" for t in p.cfg["tiers"]])):
        p.tier_vars[i].set(v)
    p.sure_var.set(fields.get("sure", f"{p.cfg['sure_score']:.2f}"))
    return p.save_settings()


for label, kw in {
    "bare key": {"hotkey": "f9"},
    "windows combo": {"hotkey": "ctrl+c"},
    "same twice": {"hotkey": "ctrl+alt+f17", "area": "ctrl+alt+f17"},
    "unknown key": {"hotkey": "ctrl+banana"},
    "tiers not descending": {"tiers": ["1,000", "5,000", "100", "50", "0"]},
    "tier not a number": {"tiers": ["lots", "20,000", "8,000", "2,000", "0"]},
    "unsure line out of range": {"sure": "0.2"},
}.items():
    assert attempt(**kw) is False, f"{label} must be refused"
    assert p.settings_msg.cget("fg") == panel.BAD, label
    print(f"  refused ok: {label}  ->  {p.settings_msg.cget('text')}")
assert (scanner.CONFIG.read_text() if scanner.CONFIG.exists() else None) == saved_before, "nothing may be written"
assert (p.cfg["hotkey"], p.cfg["area_hotkey"]) == ("ctrl+alt+f19", "ctrl+alt+f18") and p.hotkeys is not None

# a combo another program owns: refused, old hotkeys restored
import ctypes, threading
user32 = ctypes.windll.user32
taken, release = threading.Event(), threading.Event()


def hog():
    user32.RegisterHotKey(None, 1, 0x2 | 0x1 | 0x4000, scanner.VK["f22"])
    taken.set(); release.wait(); user32.UnregisterHotKey(None, 1)


threading.Thread(target=hog, daemon=True).start(); taken.wait()
assert attempt(hotkey="ctrl+alt+f22") is False and "another program" in p.settings_msg.cget("text")
assert p.cfg["hotkey"] == "ctrl+alt+f19" and p.hotkeys is not None, "old hotkeys must be back"
release.set()

# --- 5. a valid change applies live and persists -------------------------------------------------
assert attempt(hotkey="ctrl+alt+f16", area="ctrl+alt+f15", tiers=["100,000", "40,000", "10,000", "1,000", "0"])
assert p.cfg["hotkey"] == "ctrl+alt+f16" and p.cfg["area_hotkey"] == "ctrl+alt+f15"
disk = json.loads(scanner.CONFIG.read_text())
assert disk["hotkey"] == "ctrl+alt+f16" and disk["tiers"][0]["min"] == 100000, "saved to disk"
assert p.area_btn.cget("text").endswith("(ctrl+alt+f15)")
assert [r["label"] for r in p.last["rows"]] == [p.tree.set(i, "no") for i in p.tree.get_children()]
tier_now = [r["tier"] for r in p.last["rows"] if r["kind"] == "item"]
print("tiers after regrade:", tier_now)

p.root.update()
p.close.__func__  # exists
p.hotkeys.stop()
p.root.destroy()
print("ALL OK")
