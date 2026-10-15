"""Identify the items in a screenshot of an EFT inventory grid.

Pure image work, no game access: it only ever looks at pixels you already have on screen.

How it works
  1. Find the cell lattice. The grid draws a thin dark line on every cell boundary (63 px at
     1080p, 100% UI scale). Counting pixels that are darker than their neighbours gives the
     offset; it is then nudged by a few pixels to wherever the icons match best.
  2. Every item's picture is known (assets.tarkov.dev's grid image is exactly what the inventory
     draws: 63*w+1 by 63*h+1). Each is shrunk to a small greyscale vector, in all four
     orientations, because the game rotates the ART when you rotate an item. A whole-screen
     shrink happens ONCE, then every footprint at every cell is a slice of it, and the
     comparison for one footprint size is a single matrix product.
  3. Greedy non-overlapping tiling, best score first. Flat patches are empty slots.

The label the game prints in the corner and the stack/durability numbers are noise on top of
the icon, so the comparison ignores the top strip and the bottom-right corner.
"""
import json
import pathlib
from collections import defaultdict

import cv2
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

HERE = pathlib.Path(__file__).parent
CACHE = HERE / "cache" / "grid"
NAMES = HERE.parent.parent / "src" / "pages" / "eftShopping" / "data" / "itemNames.json"

CELL = 63
G = 12            # comparison resolution, pixels per cell
EMPTY_STD = 9.0   # a footprint flatter than this is an empty slot, not an item
TEMPLATE_STD = 6.0


def _mask(w, h):
    m = np.ones((h * G, w * G), np.float32)
    m[: max(2, int(G * 0.30)), :] = 0                      # short-name label
    m[-int(G * 0.25):, :] = 0                              # stack count, durability, ✓ and tag icons
    m[-int(G * 0.30):, -int(G * 0.55):] = 0
    return m


def _prep(patches, w, h, min_std):
    """(n, h*G, w*G) greyscale -> (n, D) unit vectors, plus a keep-mask for non-flat patches."""
    m = _mask(w, h).ravel() > 0
    flat = patches.reshape(len(patches), -1)[:, m]
    std = flat.std(1)
    mean = flat.mean(1, keepdims=True)
    cen = flat - mean
    norm = np.linalg.norm(cen, axis=1, keepdims=True)
    vec = np.zeros((len(patches), int(m.sum())), np.float32)
    ok = (std >= min_std) & (norm[:, 0] > 1e-6)
    vec[ok] = cen[ok] / norm[ok]
    return vec, ok


def _small_grey(img_bgr, w_cells, h_cells):
    grey = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    return cv2.resize(grey, (w_cells * G, h_cells * G), interpolation=cv2.INTER_AREA).astype(np.float32)


def _orientations(raw):
    """(degrees clockwise, image). A square item's art differs per turn."""
    yield 0, raw
    yield 90, cv2.rotate(raw, cv2.ROTATE_90_CLOCKWISE)
    yield 180, cv2.rotate(raw, cv2.ROTATE_180)
    yield 270, cv2.rotate(raw, cv2.ROTATE_90_COUNTERCLOCKWISE)


class Catalog:
    def __init__(self):
        rows = json.loads(NAMES.read_text(encoding="utf8"))["rows"]
        self.meta = {r[0]: {"id": r[0], "name": r[1], "short": r[2] if len(r) > 2 else ""} for r in rows}
        self._tmpl = defaultdict(lambda: ([], []))  # (w,h) -> (keys, small greys)
        self.mats = {}
        self.icon_ids = set()
        self._orient_cache = {}
        self._load()

    def orientations(self, iid):
        """[(degrees clockwise, BGR image)] for one item, loaded on demand and cached."""
        if iid not in self._orient_cache:
            raw = cv2.imread(str(CACHE / f"{iid}.webp"), cv2.IMREAD_COLOR)
            if raw is None:
                from PIL import Image
                raw = cv2.cvtColor(np.array(Image.open(CACHE / f"{iid}.webp").convert("RGB")), cv2.COLOR_RGB2BGR)
            self._orient_cache[iid] = list(_orientations(raw))
        return self._orient_cache[iid]

    def _load(self):
        for p in CACHE.glob("*.webp"):
            iid = p.stem
            if iid not in self.meta:
                continue
            self.icon_ids.add(iid)
            raw = cv2.imread(str(p), cv2.IMREAD_COLOR)
            if raw is None:
                from PIL import Image
                raw = cv2.cvtColor(np.array(Image.open(p).convert("RGB")), cv2.COLOR_RGB2BGR)
            for rot, img in _orientations(raw):
                h_px, w_px = img.shape[:2]
                w, h = round((w_px - 1) / CELL), round((h_px - 1) / CELL)
                if w < 1 or h < 1:
                    continue
                keys, greys = self._tmpl[(w, h)]
                keys.append((iid, rot))
                greys.append(_small_grey(img, w, h))
        for (w, h), (keys, greys) in self._tmpl.items():
            vec, ok = _prep(np.stack(greys), w, h, TEMPLATE_STD)
            self.mats[(w, h)] = ([k for k, o in zip(keys, ok) if o], vec[ok])
        del self._tmpl

    def sizes(self):
        return sorted(self.mats)


def find_lattice(img_gray, cell=CELL, thr=5):
    """(ox, oy) from the thin dark lines on every cell boundary."""
    g = img_gray.astype(np.float32)
    dx = ((g[:, :-4] + g[:, 4:]) / 2 - g[:, 2:-2]) > thr
    dy = ((g[:-4, :] + g[4:, :]) / 2 - g[2:-2, :]) > thr

    def off(prof):
        scores = [prof[o::cell].sum() for o in range(cell)]
        return (int(np.argmax(scores)) + 2) % cell

    return off(dx.mean(0)), off(dy.mean(1))


def _candidates(small, catalog, rows, cols):
    """Best match for every footprint at every cell. -> list of (score, w, h, r, c, top3)."""
    out = []
    for (w, h) in catalog.sizes():
        if h > rows or w > cols:
            continue
        keys, mat = catalog.mats[(w, h)]
        win = sliding_window_view(small, (h * G, w * G))[::G, ::G]   # (R, C, h*G, w*G)
        R, C = win.shape[:2]
        vec, ok = _prep(win.reshape(R * C, h * G, w * G), w, h, EMPTY_STD)
        if not ok.any():
            continue
        sc = vec[ok] @ mat.T
        idx = np.flatnonzero(ok)
        top = np.argsort(-sc, axis=1)[:, :3]
        for n, i in enumerate(idx):
            t = [(keys[j][0], keys[j][1], float(sc[n, j])) for j in top[n]]
            out.append((t[0][2], w, h, int(i // C), int(i % C), t))
    return out


def _tile(cands, rows, cols, min_score):
    cands = sorted(cands, key=lambda t: -t[0])
    taken = np.zeros((rows, cols), bool)
    picked = []
    for cand in cands:
        score, w, h, r, c, _ = cand
        if score < min_score:
            break
        if taken[r:r + h, c:c + w].any():
            continue
        taken[r:r + h, c:c + w] = True
        picked.append(cand)
    return picked


def _evaluate(img_bgr, catalog, ox, oy, cell):
    H, W = img_bgr.shape[:2]
    cols, rows = (W - ox) // cell, (H - oy) // cell
    if cols < 1 or rows < 1:
        return None
    small = _small_grey(img_bgr[oy:oy + rows * cell, ox:ox + cols * cell], cols, rows)
    return _candidates(small, catalog, rows, cols), rows, cols


def refine_lattice(img_bgr, catalog, lattice, cell=CELL, min_score=0.55):
    """Coarse (step 2, +-4) then fine (+-1) search around the detected lattice, scoring a full
    tiling at each offset. The detected line sits on the boundary and the picture starts a
    pixel or two inside it, and that gap differs between windows (stash vs a container)."""
    cache = {}

    def value(ox, oy):
        if ox < 0 or oy < 0:
            return -1
        if (ox, oy) not in cache:
            ev = _evaluate(img_bgr, catalog, ox, oy, cell)
            cache[(ox, oy)] = -1 if not ev else sum(
                max(0.0, t[0] - 0.6) ** 2 * t[1] * t[2] for t in _tile(ev[0], ev[1], ev[2], min_score))
        return cache[(ox, oy)]

    ox0, oy0 = lattice
    best = max(((ox0 + dx, oy0 + dy) for dy in range(-4, 5, 2) for dx in range(-4, 5, 2)),
               key=lambda p: value(*p))
    return max(((best[0] + dx, best[1] + dy) for dy in (-1, 0, 1) for dx in (-1, 0, 1)),
               key=lambda p: value(*p))


def _richest_block(img_bgr, lattice, cell, span=5):
    """The span x span cell block with the most detail - where the lattice offset is best
    measured. Fitting it on the whole crop is what made big stashes take ten seconds."""
    ox, oy = lattice
    H, W = img_bgr.shape[:2]
    cols, rows = (W - ox) // cell, (H - oy) // cell
    if cols <= span and rows <= span:
        return 0, 0, W, H
    grey = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    best, where = -1.0, (0, 0)
    for r in range(0, max(1, rows - span + 1), max(1, span // 2)):
        for c in range(0, max(1, cols - span + 1), max(1, span // 2)):
            blk = grey[oy + r * cell: oy + (r + span) * cell, ox + c * cell: ox + (c + span) * cell]
            sc = float(blk.std())
            if sc > best:
                best, where = sc, (c, r)
    c, r = where
    x0, y0 = max(0, ox + c * cell - 6), max(0, oy + r * cell - 6)
    return x0, y0, min(W, x0 + span * cell + 12), min(H, y0 + span * cell + 12)


def scan(img_bgr, catalog, cell=CELL, min_score=0.55, lattice=None):
    """-> (items, (ox, oy), (rows, cols)); items in row-major order."""
    if lattice is None:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        det = find_lattice(gray, cell)
        x0, y0, x1, y1 = _richest_block(img_bgr, det, cell)
        block = img_bgr[y0:y1, x0:x1]
        lx, ly = refine_lattice(block, catalog, ((det[0] - x0) % cell, (det[1] - y0) % cell), cell, min_score)
        # back to full-crop coordinates, keeping the offset inside one cell
        lattice = ((lx + x0) % cell, (ly + y0) % cell)
    ox, oy = lattice
    cands, rows, cols = _evaluate(img_bgr, catalog, ox, oy, cell)
    out = []
    for score, w, h, r, c, top in _tile(cands, rows, cols, min_score):
        m = catalog.meta[top[0][0]]
        out.append({
            "id": m["id"], "name": m["name"], "short": m["short"], "w": w, "h": h,
            "rot": top[0][1], "row": r, "col": c, "score": round(score, 3),
            "alts": [{"id": i, "name": catalog.meta[i]["name"], "score": round(s, 3)} for i, _, s in top[1:]],
        })
    out.sort(key=lambda d: (d["row"], d["col"]))
    return out, (ox, oy), (rows, cols)


def detect_grids(screen_bgr, cell=CELL, thr=5, min_cells=2):
    """Find inventory grids anywhere on a full screenshot -> [(x, y, w, h)].

    The inventory draws a thin dark line on every cell boundary, so a grid is a block where
    LONG vertical and horizontal dark lines recur about `cell` pixels apart. Long runs only
    (opening with a 45 px kernel) so text, icons and window frames fall away; blocks are then
    kept only if they hold several lines in BOTH directions at the cell spacing.
    """
    g = cv2.cvtColor(screen_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    dx = np.zeros(g.shape, np.uint8)
    dy = np.zeros(g.shape, np.uint8)
    dx[:, 2:-2] = (((g[:, :-4] + g[:, 4:]) / 2 - g[:, 2:-2]) > thr)
    dy[2:-2, :] = (((g[:-4, :] + g[4:, :]) / 2 - g[2:-2, :]) > thr)
    k = 45
    vert = cv2.morphologyEx(dx, cv2.MORPH_OPEN, np.ones((k, 1), np.uint8))
    horz = cv2.morphologyEx(dy, cv2.MORPH_OPEN, np.ones((1, k), np.uint8))
    lines = cv2.dilate(vert | horz, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(lines, connectivity=8)

    def spaced(profile):
        """How many peaks sit roughly `cell` apart from some peak (a lattice, not clutter)."""
        xs = np.flatnonzero(profile > profile.max() * 0.35) if profile.max() > 0 else []
        if len(xs) == 0:
            return 0
        pk = [xs[0]]
        for x in xs[1:]:
            if x - pk[-1] > 6:
                pk.append(x)
        return max((sum(1 for q in pk if abs(((q - p) % cell)) <= 3 or abs(((q - p) % cell) - cell) <= 3)
                    for p in pk), default=0)

    boxes = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if w < cell * min_cells or h < cell * min_cells:
            continue
        v = vert[y:y + h, x:x + w].sum(0).astype(np.float32)
        hz = horz[y:y + h, x:x + w].sum(1).astype(np.float32)
        if spaced(v) >= 3 and spaced(hz) >= 3:
            boxes.append((int(x), int(y), int(w), int(h)))
    return boxes


# --- grid-free scanning -----------------------------------------------------------------------
#
# The stash is one regular 63 px grid, but the gear panel (rig, pockets, backpack) is not: its
# containers are separate little grids with ~5 px gaps between them, drawn about 2% larger. A
# lattice cannot describe that. So instead of a lattice, find every rectangle that is OUTLINED
# like an item (a thin line along all four sides), and identify each one by its picture.

CELL_SCALES = (63.0, 64.5)   # px per cell: stash, gear panel (measured on a 1080p capture)


def _line_maps(grey):
    """Thin-line strength, either polarity, for vertical and horizontal lines."""
    g = grey.astype(np.float32)
    lv = np.zeros_like(g)
    lh = np.zeros_like(g)
    lv[:, 2:-2] = np.abs(g[:, 2:-2] - (g[:, :-4] + g[:, 4:]) / 2)
    lh[2:-2, :] = np.abs(g[2:-2, :] - (g[:-4, :] + g[4:, :]) / 2)
    # a line a pixel off is still the line
    lv = cv2.dilate(lv, np.ones((1, 3), np.uint8))
    lh = cv2.dilate(lh, np.ones((3, 1), np.uint8))
    return lv, lh


def _perimeter_score(lv, lh, W, H):
    """Per top-left position: how strongly a W x H rectangle is outlined on its WEAKEST side."""
    Hh, Ww = lv.shape
    if W + 8 >= Ww or H + 8 >= Hh:
        return None
    m = 5  # ignore corners
    # mean of vertical-line strength down a column span, for every (y, x)
    col = cv2.boxFilter(lv, -1, (1, H - 2 * m), normalize=True, anchor=(0, 0))
    row = cv2.boxFilter(lh, -1, (W - 2 * m, 1), normalize=True, anchor=(0, 0))
    out_h, out_w = Hh - H, Ww - W
    ys, xs = np.mgrid[0:out_h, 0:out_w]
    left = col[ys + m, xs]
    right = col[ys + m, xs + W]
    top = row[ys, xs + m]
    bottom = row[ys + H, xs + m]
    return np.minimum(np.minimum(left, right), np.minimum(top, bottom))


def _outline(lv, lh, x, y, W, H, m=5):
    """Strength of the weakest side of the W x H rectangle at (x, y)."""
    Hh, Ww = lv.shape
    if x < 0 or y < 0 or x + W >= Ww or y + H >= Hh:
        return 0.0
    return float(min(lv[y + m:y + H - m, x].mean(), lv[y + m:y + H - m, x + W].mean(),
                     lh[y, x + m:x + W - m].mean(), lh[y + H, x + m:x + W - m].mean()))


def propose_rects(img_bgr, catalog, scales=CELL_SCALES, floor=7.0, per_size=60):
    """-> [(x, y, w_cells, h_cells, cell_px)] outlined rectangles, strongest first."""
    grey = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lv, lh = _line_maps(grey)
    props = []
    for cell in scales:
        for (w, h) in catalog.sizes():
            Wp, Hp = int(round(w * cell)), int(round(h * cell))
            sc = _perimeter_score(lv, lh, Wp, Hp)
            if sc is None:
                continue
            # local maxima only, above the floor
            mx = cv2.dilate(sc, np.ones((5, 5), np.uint8))
            ys, xs = np.nonzero((sc >= mx) & (sc > floor))
            if len(ys) > per_size:
                keep = np.argsort(-sc[ys, xs])[:per_size]
                ys, xs = ys[keep], xs[keep]
            props += [(float(sc[y, x]), int(x), int(y), w, h, Wp, Hp, cell) for y, x in zip(ys, xs)]
    props.sort(key=lambda t: -t[0])
    return props


def _overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    iw = min(ax + aw, bx + bw) - max(ax, bx)
    ih = min(ay + ah, by + bh) - max(ay, by)
    if iw <= 0 or ih <= 0:
        return 0.0
    return iw * ih / min(aw * ah, bw * bh)


def scan_free(img_bgr, catalog, min_score=0.55, max_props=900):
    """Grid-free scan. -> list of items with pixel positions (x, y) inside img_bgr."""
    grey = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    props = propose_rects(img_bgr, catalog)[:max_props]
    cands = []
    bysize = defaultdict(list)
    for k, (edge, x, y, w, h, Wp, Hp, cell) in enumerate(props):
        bysize[(w, h)].append((k, x, y, Wp, Hp))
    for (w, h), group in bysize.items():
        keys, mat = catalog.mats[(w, h)]
        patches = np.stack([cv2.resize(grey[y:y + Hp + 1, x:x + Wp + 1], (w * G, h * G),
                                       interpolation=cv2.INTER_AREA).astype(np.float32)
                            for _, x, y, Wp, Hp in group])
        vec, ok = _prep(patches, w, h, EMPTY_STD)
        if not ok.any():
            continue
        sc = vec[ok] @ mat.T
        idx = np.flatnonzero(ok)
        top = np.argsort(-sc, axis=1)[:, :3]
        for n, i in enumerate(idx):
            _, x, y, Wp, Hp = group[i]
            t = [(keys[j][0], keys[j][1], float(sc[n, j])) for j in top[n]]
            cands.append((t[0][2], x, y, w, h, Wp, Hp, t))
    cands.sort(key=lambda t: -t[0])

    taken, out = [], []
    for score, x, y, w, h, Wp, Hp, top in cands:
        if score < min_score:
            break
        rect = (x, y, Wp, Hp)
        if any(_overlap(rect, t) > 0.30 for t in taken):
            continue
        taken.append(rect)
        m = catalog.meta[top[0][0]]
        out.append({
            "id": m["id"], "name": m["name"], "short": m["short"], "w": w, "h": h,
            "rot": top[0][1], "x": x, "y": y, "wpx": Wp, "hpx": Hp, "score": round(score, 3),
            "alts": [{"id": i, "name": catalog.meta[i]["name"], "score": round(s, 3)} for i, _, s in top[1:]],
        })
    out.sort(key=lambda d: (d["y"] // 40, d["x"]))
    return out


def scan_hybrid(img_bgr, catalog, cell=CELL, min_score=0.55, lattice_min=0.80):
    """Grid-free scan plus the lattice scan, merged best-score-first.

    Grid-free handles the gear panel (separate little grids with gaps); the lattice catches the
    tight stash grid where outlines are weaker. The lattice is held to a stricter score because
    on a gear panel it is misaligned and only produces junk."""
    free = scan_free(img_bgr, catalog, min_score)
    lat, (ox, oy), _ = scan(img_bgr, catalog, cell, lattice_min)
    lv, lh = _line_maps(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY))
    kept = []
    for it in lat:
        it["x"], it["y"] = ox + it["col"] * cell, oy + it["row"] * cell
        it["wpx"], it["hpx"] = it["w"] * cell, it["h"] * cell
        # A real item sits inside drawn grid lines. A lattice "match" on empty panel background has
        # none (the misaligned lattice produced two confident SA58/FAL magazines out of nothing).
        if _outline(lv, lh, it["x"], it["y"], it["wpx"], it["hpx"]) >= 4.0:
            kept.append(it)
    lat = kept
    taken, out = [], []
    for it in sorted(free + lat, key=lambda i: -i["score"]):
        rect = (it["x"], it["y"], it["wpx"], it["hpx"])
        if any(_overlap(rect, t) > 0.30 for t in taken):
            continue
        taken.append(rect)
        out.append(it)
    out.sort(key=lambda d: (d["y"] // 40, d["x"]))
    return out
