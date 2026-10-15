"""Find items by the NAME the game prints on them.

Every item in the inventory has its short name printed in its top-right corner ("Salewa", "Zarya",
"TP-200"). An icon's picture can look different from the catalogue picture - a different tile colour,
a see-through gear-panel slot, a coloured pouch on a dark background - but the printed name does not.
So the order is:

  1. OCR the scanned area once (RapidOCR, the same engine that reads stack counts).
  2. Every piece of text that is a plausible item name is looked up: exact short name, a truncated
     one ("Flash driv"), or a near miss from an OCR slip ("Zary a").
  3. For each candidate item, its icon is matched in a small window anchored to where that label
     sits (the label is right-aligned to the item's top-right corner). That finds the item's real
     rectangle and says which of several items sharing a short name ("Fuel", "Pass") it is - and
     rejects UI text that merely looks like a name.

An empty slot has no label, so it cannot become an item. That was the source of the phantom matches
on empty rig slots. The picture-only scan stays as a back-up for anything the OCR misses, but it now
has to be very sure of itself on its own.
"""
import difflib
import re

import cv2
import numpy as np

import matcher

CELL_SCALES = (63.0, 64.5)
_OCR = None


def ocr_engine():
    """RapidOCR, loaded once and shared (stack counts use the same instance)."""
    global _OCR
    if _OCR is None:
        from rapidocr_onnxruntime import RapidOCR
        _OCR = RapidOCR()
    return _OCR


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


# Section headings and page chrome the game prints in ALL CAPS. An item's own label is mixed case ("Items",
# "Salewa") or a short code ("AFAK"), so only an ALL-CAPS match against this list is treated as a heading -
# "BODY ARMOR" above an empty slot must not become a body armour, nor "DOGTAG" a dog tag.
HEADINGS = {norm(h) for h in (
    "TACTICAL RIG POCKETS SPECIAL SLOTS BACKPACK BODY ARMOR EARPIECE HEADWEAR FACE COVER EYEWEAR ARMBAND DOGTAG "
    "ON SLING HOLSTER ON BACK SHEATH QUICK USE SEARCH SORT TABLE OVERALL GEAR HEALTH CUSTOMIZATION SKILLS MAP TASKS "
    "ACHIEVEMENTS BACK MAIN MENU HIDEOUT CHARACTER TRADERS FLEA MARKET BUILDS HANDBOOK MESSENGER SURVEY EXPANSIONS "
    "NEW PRESET").split() + ["SPECIAL SLOTS", "TACTICAL RIG", "BODY ARMOR", "FACE COVER", "ON SLING", "ON BACK",
                           "QUICK USE", "SORT TABLE", "MAIN MENU", "FLEA MARKET"]}
# The "SPEC" watermark of the special-slot area. A locked, built-in slot (the Camera) carries it; it is not
# an item you own.
SPEC_MARKS = {"spec", "5pec", "5pe0", "spe0", "sp3c", "5pec"}


def is_heading(text):
    letters = re.sub(r"[^A-Za-z]", "", text or "")
    return bool(letters) and letters.isupper() and norm(text) in HEADINGS


NOT_A_NAME = re.compile(r"^[\d\s/.,:x%+-]*$")   # 148/163, 400/400, 976461, 20/20 ...


class NameIndex:
    """Short name -> item ids, for exact / truncated / fuzzy lookup."""

    def __init__(self, catalog):
        self.exact = {}
        for iid, m in catalog.meta.items():
            if iid not in catalog.icon_ids:
                continue
            for nm in {m["short"], m["name"]}:
                k = norm(nm)
                if k:
                    self.exact.setdefault(k, set()).add(iid)
        self.keys = list(self.exact)

    def lookup(self, text):
        """-> {item id: strength}. 1.0 exact, 0.9 truncated label, 0.85 fuzzy."""
        t = norm(text)
        if len(t) < 2 or NOT_A_NAME.match(text or ""):
            return {}
        out = {}
        for i in self.exact.get(t, ()):
            out[i] = 1.0
        if out:
            return out
        if len(t) >= 5:
            for k in self.keys:   # the game cuts long names short to fit the icon ("Flash driv")
                if k.startswith(t) and len(k) > len(t) and len(t) >= 0.6 * len(k):
                    for i in self.exact[k]:
                        out.setdefault(i, 0.9)
        if len(t) >= 4:           # a slot's number tag covers the start of the name: "CALOK-B" reads "ALOK-B"
            for k in self.keys:
                if k.endswith(t) and len(k) - len(t) <= 3:
                    for i in self.exact[k]:
                        out.setdefault(i, 0.88)
        if out:
            return out
        if len(t) >= 4:           # an OCR slip: a letter wrong, dropped or doubled
            for k in self.keys:
                if abs(len(k) - len(t)) <= 2 and k[0] == t[0] and \
                        difflib.SequenceMatcher(None, t, k).ratio() >= 0.84:
                    for i in self.exact[k]:
                        out.setdefault(i, 0.85)
        return out


def read_text(img_bgr, scale=None):
    """-> [(x0, y0, x1, y1, text, conf)] in img_bgr's own pixels. Small areas are read at 2x for the
    tiny label font; a whole screen at 1.5x, which keeps it to a few seconds."""
    if scale is None:
        scale = 2 if img_bgr.shape[0] * img_bgr.shape[1] < 1100 * 800 else 1.5
    big = cv2.resize(img_bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    result, _ = ocr_engine()(big)
    out = []
    for box, text, conf in result or []:
        xs, ys = [p[0] for p in box], [p[1] for p in box]
        out.append((min(xs) / scale, min(ys) / scale, max(xs) / scale, max(ys) / scale, text, float(conf)))
    return out


def _match_in_window(img, tmpl, right, top):
    """Best normalised colour match of `tmpl` with its top-right corner near (right, top).
    -> (score, x, y) in img pixels, or None if the window falls off the image."""
    th, tw = tmpl.shape[:2]
    H, W = img.shape[:2]
    x0, y0 = int(right - tw - 5), int(top - 5)
    x1, y1 = int(right + 6), int(top + th + 6)
    x0c, y0c, x1c, y1c = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1c - x0c < tw or y1c - y0c < th:
        return None
    win = img[y0c:y1c, x0c:x1c]
    res = cv2.matchTemplate(win, tmpl, cv2.TM_CCOEFF_NORMED)
    _, mx, _, loc = cv2.minMaxLoc(res)
    return float(mx), x0c + loc[0], y0c + loc[1]


def _fit(tmpl, w, h, scale):
    return cv2.resize(tmpl, (max(8, int(round(w * scale))), max(8, int(round(h * scale)))),
                      interpolation=cv2.INTER_AREA)


SLOT_DIMS = (65, 130, 195, 260, 313)


def _slot_rect(lines, right, top):
    """The outlined rectangle whose top-right corner is at the label: pocket slots are 65 square, a rig or
    backpack slot 130 square, weapon slots wider. Chosen by which candidate is actually drawn (all four
    sides have a line), preferring the smaller one on a near tie. -> (x, y, w, h, outline strength)."""
    lv, lh = lines
    best = None
    for sw in SLOT_DIMS:
        for sh in SLOT_DIMS:
            for dx in (-2, -1, 0, 1, 2):
                for dy in (-2, -1, 0, 1, 2):
                    x, y = int(right - sw + dx), int(top + dy)
                    st = matcher._outline(lv, lh, x, y, sw, sh)
                    rank = st - 0.0002 * sw * sh   # near tie -> the smaller slot
                    if best is None or rank > best[0]:
                        best = (rank, x, y, sw, sh, st)
    return best[1:] if best else None


def _slot_fit(img, tmpl, rect):
    """Equipped slots draw an icon SCALED TO FIT the slot, not at its inventory size, so a 2x1 Surv12 sits
    squeezed into a 1x1 pocket. Try a few scales inside the slot rectangle. -> score."""
    x, y, sw, sh = rect[:4]
    H, W = img.shape[:2]
    win = img[max(0, y - 2):min(H, y + sh + 3), max(0, x - 2):min(W, x + sw + 3)]
    th, tw = tmpl.shape[:2]
    best = -1.0
    if win.shape[0] < 12 or win.shape[1] < 12:
        return None
    fit = min(sw / tw, sh / th)
    for k in (0.95, 0.85, 0.75, 0.65, 0.55):
        t = cv2.resize(tmpl, (max(8, int(tw * fit * k)), max(8, int(th * fit * k))), interpolation=cv2.INTER_AREA)
        if t.shape[0] > win.shape[0] or t.shape[1] > win.shape[1]:
            continue
        _, mx, _, _ = cv2.minMaxLoc(cv2.matchTemplate(win, t, cv2.TM_CCOEFF_NORMED))
        best = max(best, float(mx))
    return best if best > -1 else None


def _continues(img, texts, cand):
    """Does the tile run on past this 1x1 guess? The cell below (or to the left) is full of picture AND no
    label of its own is printed there - a separate item would carry its own name. -> (down, left) or None."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    x, y, W, H = cand["x"], cand["y"], cand["wpx"], cand["hpx"]
    out = [False, False]
    for k, (cx, cy) in enumerate(((x, y + H), (x - W, y))):          # below, then left
        if cx < 0 or cy < 0 or cx + W >= img.shape[1] or cy + H >= img.shape[0]:
            continue
        region = gray[cy + 4:cy + H - 4, cx + 6:cx + W - 6]
        if region.size == 0 or float(region.std()) < 10.0:
            continue
        if not has_label_near({"x": cx, "y": cy, "wpx": W, "hpx": H}, texts):
            out[k] = True
    return (out[0], out[1]) if any(out) else None


def _extent(img, texts, rect, limit=8):
    """How far does a tile run past its first cell? Walk down and to the left one cell at a time while the cell is
    full of picture, has no label of its own, and is not the bright blurred background beyond the panel.
    -> (cells_down, cells_left, clipped) where clipped means the walk stopped at the edge of what is visible,
    so the true size is AT LEAST this."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    x, y, W, H = rect
    res = []
    for dx, dy in ((0, 1), (-1, 0)):
        n, clipped = 0, False
        for k in range(1, limit + 1):
            cx, cy = x + dx * W * k, y + dy * H * k if dy else y
            if dy:
                cx = x
            if cx < 0 or cy < 0 or cx + W >= img.shape[1] or cy + H >= img.shape[0]:
                clipped = True
                break
            region = gray[cy + 4:cy + H - 4, cx + 6:cx + W - 6]
            if region.size == 0:
                break
            if float(region.mean()) > 85.0:      # the bright blurred floor: the panel has ended
                clipped = True
                break
            if float(region.std()) < 10.0 or has_label_near({"x": cx, "y": cy, "wpx": W, "hpx": H}, texts):
                break
            n += 1
        res.append((n, clipped))
    (down, cd), (left, cl) = res
    return down, left, (cd and down > 0) or (cl and left > 0)


def _sides(lines, x, y, W, H, m=5):
    """Line strength on each side of a rectangle - top, bottom, left, right - or None if it falls off the image."""
    lv, lh = lines
    Hh, Ww = lv.shape
    if x < 0 or y < 0 or x + W >= Ww or y + H >= Hh or W < 2 * m + 2 or H < 2 * m + 2:
        return None
    return {"top": float(lh[y, x + m:x + W - m].mean()), "bottom": float(lh[y + H, x + m:x + W - m].mean()),
            "left": float(lv[y + m:y + H - m, x].mean()), "right": float(lv[y + m:y + H - m, x + W].mean())}


def _measure_tile(lines, right, top, scales=CELL_SCALES, floor=6.0, max_w=10, max_h=8):
    """How big is the tile the game drew at this label? The SMALLEST whole-cell rectangle, anchored at the
    label's top-right corner, that is outlined on all four sides. A 1x1 guess inside a 3x1 tile fails
    (nothing is drawn where its left edge would be), so the first size that passes is the real one.
    -> (w_cells, h_cells, scale, x, y, strength) or None."""
    lv, lh = lines
    sizes = sorted(((w, h) for w in range(1, max_w + 1) for h in range(1, max_h + 1)),
                   key=lambda wh: (wh[0] * wh[1], wh[0] + wh[1]))
    for (w, h) in sizes:
        for scale in scales:
            W, H = int(round(w * scale)), int(round(h * scale))
            best = None
            for dx in (-3, -2, -1, 0, 1, 2):
                for dy in (-2, -1, 0, 1, 2):
                    x, y = int(right - W + dx), int(top + dy)
                    st = matcher._outline(lv, lh, x, y, W, H)
                    if best is None or st > best[0]:
                        best = (st, x, y)
            if best[0] >= floor:
                return w, h, scale, best[1], best[2], best[0]
    return None


def _confidence(strength, visual, equipped=False):
    """Name evidence is the strong part; the picture only has to agree a little. 0.85+ is 'sure'. An
    equipped slot shrinks the icon, so its picture score is naturally lower and is judged on a lower scale."""
    lo, span = (0.05, 0.30) if equipped else (0.25, 0.45)
    return round(min(0.98, strength * (0.80 + 0.2 * min(1.0, max(0.0, (visual - lo) / span)))), 3)


def detect(img_bgr, catalog, index=None, texts=None):
    """-> (items, texts). Items carry x, y, wpx, hpx like the other scanners, plus `viaLabel`."""
    index = index or NameIndex(catalog)
    texts = texts if texts is not None else read_text(img_bgr)
    lines = matcher._line_maps(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY))
    items = []
    # The Special Slots block has a built-in, locked "Camera" slot that is not an item you own. A real
    # WI-FI Camera in the stash prints the same label, so it is the PLACE that tells them apart.
    special = [t for t in texts if norm(t[4]) == "specialslots"]
    for (x0, y0, x1, y1, text, conf) in texts:
        if norm(text) == "camera" and any(sx0 - 12 <= x0 <= sx0 + 190 and sy1 <= y0 <= sy1 + 200
                                         for (sx0, sy0, sx1, sy1, _, _) in special):
            continue
        cands = index.lookup(text)
        if not cands or conf < 0.5 or is_heading(text):
            continue
        right, top = x1 + 2, y0 - 2          # the label is right-aligned to the item's top-right corner
        slot = _slot_rect(lines, right, top)
        if slot and slot[2] >= 250 and slot[4] >= 8.0 and any(is_weapon(catalog, i) for i in cands):
            # A weapon slot (ON SLING / ON BACK / HOLSTER). Several things share the short name ("RFB" is the rifle
            # and its handguard, flash hider, rail mount...) and the mods on the gun spoil the picture match, so
            # the gun is the biggest of them.
            iid = max(cands, key=lambda i: gun_first(catalog, i, cands[i]))
            w0, h0 = catalog_native(catalog, iid)
            m = catalog.meta[iid]
            items.append({"id": iid, "rot": 0, "w": max(1, round(slot[2] / 63)), "h": max(1, round(slot[3] / 63)),
                          "x": slot[0], "y": slot[1], "wpx": slot[2],
                          "hpx": slot[3], "visual": 0.5, "strength": cands[iid], "equipped": True, "slotWeapon": True, "name": m["name"],
                          "short": m["short"], "viaLabel": text, "alts": [], "byName": True,
                          "score": round(min(0.9, cands[iid] * 0.88), 3)})
            continue
        best = None
        evaluated = []
        for iid, strength in cands.items():
            for rot, tmpl in catalog.orientations(iid):
                h_px, w_px = tmpl.shape[:2]
                w, h = round((w_px - 1) / matcher.CELL), round((h_px - 1) / matcher.CELL)
                for scale in CELL_SCALES:
                    t = _fit(tmpl, w, h, scale)
                    hit = _match_in_window(img_bgr, t, right, top)
                    if not hit:
                        continue
                    score, x, y = hit
                    # The picture alone cannot tell a 1x1 grip from the 3x1 chassis with the same printed name
                    # when the tile is tinted (a red tile threw it). The outline can: a real item is boxed on
                    # all four sides at ITS size, and a too-small guess has no edge where its left side would be.
                    outline = matcher._outline(lines[0], lines[1], x, y, t.shape[1], t.shape[0])
                    rank = strength * (score + min(outline, 30.0) / 60.0)
                    cand = {"_rank": rank, "id": iid, "rot": rot, "w": w, "h": h, "x": x, "y": y,
                            "wpx": t.shape[1], "hpx": t.shape[0], "visual": score, "strength": strength}
                    evaluated.append(cand)
                    if best is None or rank > best["_rank"]:
                        best = cand
        # A gun with mods on it is drawn as a bigger tile than ANY catalogue picture of that name (the rifle, its
        # stock and its optics make it 4x2, but the catalogue knows it as 2x1), and its picture never matches.
        # So when the tile that was actually drawn is bigger than every candidate, the item is the biggest thing
        # that still fits inside the tile - the gun, not the grip that shares its short name.
        if best and best["h"] == 1 and best["visual"] < 0.65:
            sides = _sides(lines, best["x"], best["y"], best["wpx"], best["hpx"])
            if sides and sides["bottom"] < 3.5 and min(sides["left"], sides["right"], sides["top"]) >= 6.0:
                # Left, right and top are drawn but there is no bottom edge: the tile carries on below (or off
                # the bottom of the view). Prefer a candidate, in whatever orientation, that is taller.
                taller = [e for e in evaluated if e["w"] == best["w"] and e["h"] > 1]
                if taller:
                    best = max(taller, key=lambda e: e["_rank"])
        if best and best["w"] == 1 and best["h"] == 1 and not best.get("equipped") and best["visual"] < 0.70 \
                and any(is_weapon(catalog, i) for i in cands):
            ext = _continues(img_bgr, texts, best)
            if ext:
                down, left = ext
                pool = [e for e in evaluated if is_weapon(catalog, e["id"])
                        and (e["h"] > 1 if down else True) and (e["w"] > 1 if left else True)]
                if pool:   # the gun's picture never matches (mods), so it is accepted on its name and the tile
                    best = dict(max(pool, key=lambda e: (e["visual"] + min(e["w"] * e["h"], 8) * 0.01)), byName=True)

        tile = _measure_tile(lines, right, top) if evaluated else None
        if tile and tile[5] >= 15.0 and not any((e["w"], e["h"]) == (tile[0], tile[1]) for e in evaluated):
            mw, mh, mscale, mx, my, _st = tile
            fits = [(iid, strength) for iid, strength in cands.items()
                    if catalog_native(catalog, iid)[0] * catalog_native(catalog, iid)[1] <= mw * mh]
            if fits and max(catalog_native(catalog, i)[0] * catalog_native(catalog, i)[1] for i, _ in fits) < mw * mh:
                iid, strength = max(fits, key=lambda f: (is_weapon(catalog, f[0]),) + (
                    catalog_native(catalog, f[0])[0] * catalog_native(catalog, f[0])[1], f[1]))
                best = {"id": iid, "rot": 0, "w": mw, "h": mh, "x": mx, "y": my,
                        "wpx": int(round(mw * mscale)), "hpx": int(round(mh * mscale)), "visual": 0.5,
                        "strength": strength * 0.9, "byTile": True}
        if not best or best["visual"] < 0.40:   # grid placement is weak: maybe an equipped slot, scaled to fit
            slot = _slot_rect(lines, right, top)
            if slot and slot[4] >= 4.0:          # a rectangle really is drawn there
                for iid, strength in cands.items():
                    for rot, tmpl in catalog.orientations(iid)[:1]:
                        h_px, w_px = tmpl.shape[:2]
                        score = _slot_fit(img_bgr, tmpl, slot)
                        if score is not None and (best is None or score * strength > best["visual"] * best["strength"]):
                            best = {"id": iid, "rot": rot, "w": round((w_px - 1) / matcher.CELL),
                                    "h": round((h_px - 1) / matcher.CELL), "x": slot[0], "y": slot[1],
                                    "wpx": slot[2], "hpx": slot[3], "visual": score, "strength": strength,
                                    "equipped": True}
        if best:
            rect = (best["x"], best["y"], best["wpx"], best["hpx"])
            if any(norm(t[4]) in SPEC_MARKS and rect[0] - 4 <= (t[0] + t[2]) / 2 <= rect[0] + rect[2] + 4
                   and rect[1] <= (t[1] + t[3]) / 2 <= rect[1] + rect[3] + 8 for t in texts):
                continue    # a locked, built-in special slot (the Camera) - not an item you own
        if best and best.get("equipped"):
            if best["wpx"] >= 190 and len(cands) > 1:
                # A weapon slot: several things share the short name ("APB" is a pistol AND a stock) and the
                # mods on the gun spoil the picture match, so take the biggest - the gun, not the part.
                def native_area(i):
                    t = catalog.orientations(i)[0][1]
                    return t.shape[0] * t.shape[1]
                big = max(cands, key=lambda i: (cands[i], native_area(i)))
                t0 = catalog.orientations(big)[0][1]
                best.update(id=big, rot=0, w=round((t0.shape[1] - 1) / matcher.CELL),
                            h=round((t0.shape[0] - 1) / matcher.CELL))
        if best and is_weapon(catalog, best["id"]) and not best.get("slotWeapon"):
            # A gun's tile is however big its mods make it, so its size cannot come from the catalogue. Walk out
            # from the label's own cell - along the top row to the left, down the right-hand column - for as long
            # as the cells are full of picture and carry no label of their own.
            base = (int(right - 63), int(top), 63, 63)
            down, left, clipped = _extent(img_bgr, texts, base)
            if down or left:
                best.update(w=1 + left, h=1 + down, x=base[0] - left * 63, y=base[1], wpx=(1 + left) * 63,
                            hpx=(1 + down) * 63, clipped=clipped, byName=True)
        # A real name with weak picture evidence is still probably an item (a tag or highlight covers
        # part of the icon); a heading or button that merely LOOKS like a name has no picture at all.
        floor = 0.12 if best and best["strength"] >= 0.88 and len(norm(text)) >= 5 else 0.25
        if not best or (best["visual"] < floor and not best.get("byName")):
            continue
        m = catalog.meta[best["id"]]
        best.pop("_rank", None)
        strength = min(1.0, best["strength"] + 0.08) if len(cands) == 1 else best["strength"]  # nothing else it could be
        best.update(name=m["name"], short=m["short"], viaLabel=text, alts=[],
                    score=(round(min(0.9, strength * 0.88), 3) if best.get("byName")
                           else _confidence(strength, best["visual"], best.get("equipped", False))))
        items.append(best)
    return _dedupe(items), texts


def is_weapon(catalog, iid):
    return iid in getattr(catalog, "weapon_ids", ())


def gun_first(catalog, iid, strength):
    """Sort key for ambiguous names: a gun beats a part, then the stronger name, then the bigger picture."""
    w, h = catalog_native(catalog, iid)
    return (is_weapon(catalog, iid), strength, w * h)


def catalog_native(catalog, iid):
    """(w, h) in cells of an item's catalogue picture, upright."""
    t = catalog.orientations(iid)[0][1]
    return round((t.shape[1] - 1) / matcher.CELL), round((t.shape[0] - 1) / matcher.CELL)


def _dedupe(items):
    """Two labels can land on the same rectangle (a case's own name and its tooltip); keep the better."""
    items.sort(key=lambda i: -i["score"])
    kept = []
    for it in items:
        rect = (it["x"], it["y"], it["wpx"], it["hpx"])
        if any(matcher._overlap(rect, (k["x"], k["y"], k["wpx"], k["hpx"])) > 0.5 for k in kept):
            continue
        kept.append(it)
    return kept


def assign_counts(items, texts):
    """Attach a printed stack count (money) to the item it sits in: a number in the bottom third of an
    item's rectangle. Durability like 148/163 is not a count and is ignored."""
    for it in items:
        best = None
        for (x0, y0, x1, y1, text, conf) in texts:
            digits = text.replace(" ", "").replace(",", "")
            if not digits.isdigit() or conf < 0.6:
                continue
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            if it["x"] <= cx <= it["x"] + it["wpx"] and it["y"] + it["hpx"] * 0.6 <= cy <= it["y"] + it["hpx"] + 4:
                best = int(digits)
        if best is not None:
            it["count"] = best


def has_label_near(item, texts):
    """True if the game printed some NAME-like text at this rectangle's top-right - i.e. something is
    really there. (Digits-only text is a stack count or durability, not a label.)"""
    for (x0, y0, x1, y1, text, conf) in texts:
        if conf < 0.5 or NOT_A_NAME.match(text) or len(norm(text)) < 2:
            continue
        right = item["x"] + item["wpx"]
        if right - 14 <= x1 <= right + 6 and item["y"] - 6 <= y0 <= item["y"] + 22:
            return True
    return False
