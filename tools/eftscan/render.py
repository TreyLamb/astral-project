"""Colour-grading and the numbered screenshot.

Every table row gets a number (1 = highest value) and a colour tier. The screenshot is the area that
was scanned with each item boxed in its tier colour and tagged with its row's number, so a number on
the picture is a row in the table.
"""
import re

import cv2
import numpy as np

DEFAULT_TIERS = [  # best first; the last tier's threshold is always 0 = "everything else"
    {"min": 50000, "color": "#2ecc71"},   # green  - the money
    {"min": 20000, "color": "#f1c40f"},   # yellow
    {"min": 8000, "color": "#e67e22"},    # orange
    {"min": 2000, "color": "#e74c3c"},    # red
    {"min": 0, "color": "#1a1a1a"},       # black  - garbage
]
GRADE_BY = {"perSlot": "Per slot", "unit": "Each", "total": "Total"}
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def rank_value(row, grade_by):
    return row.get(grade_by) or 0


UNSURE_COLOR = "#ff2d3a"
AMMO_TIERS = ["S", "A", "B", "C", "D"]


def sort_and_number(rows, grade_by):
    """Order the table: priced items by value (numbered 1..N), then ammo by tier, then the unsure
    ones. Sorting here is what makes the table and the screenshot agree."""
    items = sorted((r for r in rows if r["kind"] == "item"), key=lambda r: -rank_value(r, grade_by))
    ammo = sorted((r for r in rows if r["kind"] == "ammo"), key=lambda r: (AMMO_TIERS.index(r["ammoTier"]), r["name"]))
    unsure = sorted((r for r in rows if r["kind"] == "unsure"), key=lambda r: r["name"])
    for n, r in enumerate(items, 1):
        r["no"] = n
    for r in ammo + unsure:
        r["no"] = None
    rows[:] = items + ammo + unsure
    return rows


def decorate(rows, tiers, grade_by):
    """Give every row its tier colour and its on-screen label. Called again whenever the colours or
    the ranking metric change, so nothing about colour is baked into a scan."""
    for r in rows:
        if r["kind"] == "item":
            idx = tier_index(rank_value(r, grade_by), tiers)
            r["tier"], r["color"], r["label"] = idx, tiers[idx]["color"], str(r["no"])
        elif r["kind"] == "ammo":
            idx = AMMO_TIERS.index(r["ammoTier"])
            r["tier"], r["color"], r["label"] = idx, tiers[idx]["color"], r["ammoTier"]
        else:
            r["tier"], r["color"], r["label"] = None, UNSURE_COLOR, "?"
    return rows


def tier_index(value, tiers):
    for i, t in enumerate(tiers):
        if value >= t["min"]:
            return i
    return len(tiers) - 1


def tier_color(value, tiers):
    return tiers[tier_index(value, tiers)]["color"]


def hex_to_bgr(h):
    h = h.lstrip("#")
    return int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16)


def luminance(h):
    r, g, b = (int(h.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def text_on(h):
    return "#ffffff" if luminance(h) < 0.55 else "#111111"


def blend(h, into, amount):
    """Mix colour h into colour `into` by `amount` (0..1) - used for the dim table-row tint."""
    a = [int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(into.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    return "#%02x%02x%02x" % tuple(round(b[k] + (a[k] - b[k]) * amount) for k in range(3))


def validate_tiers(tiers):
    """-> error string or None. Five tiers, thresholds strictly falling, last one 0, valid colours."""
    if len(tiers) != 5:
        return "There must be exactly 5 levels."
    last = None
    for n, t in enumerate(tiers, 1):
        if not HEX.match(str(t.get("color", ""))):
            return f"Level {n} has no valid colour."
        try:
            m = int(t["min"])
        except (TypeError, ValueError):
            return f"Level {n}: the value must be a whole number."
        if m < 0:
            return f"Level {n}: the value cannot be negative."
        if last is not None and m >= last:
            return f"Level {n} must be worth LESS than level {n - 1} ({last:,})."
        last = m
    if int(tiers[-1]["min"]) != 0:
        return "The last level is 'everything below', so its value must be 0."
    return None


def effective_grade(grade_by, bag_mode):
    """'Total' only means something when you are counting a bag; otherwise rank by what one is worth."""
    return grade_by if bag_mode or grade_by != "total" else "unit"


def numbered_screenshot(screen, items, rows, boxes, numbers=True):
    """The scanned area: each item gets a thin box in its row's colour and a bold coloured number in its
    top-left corner - the number is just coloured text, with no filled tag or highlight behind it. The
    number is its row's number (or an ammo tier letter, or ? for unsure). Rows must be decorate()d."""
    row_of = {r["id"]: r for r in rows}
    x0 = max(0, min(b[0] for b in boxes))
    y0 = max(0, min(b[1] for b in boxes))
    x1 = min(screen.shape[1], max(b[0] + b[2] for b in boxes))
    y1 = min(screen.shape[0], max(b[1] + b[3] for b in boxes))
    out = screen[y0:y1, x0:x1].copy()
    for it in sorted(items, key=lambda i: -i["wpx"] * i["hpx"]):
        row = row_of.get(it["id"])
        if not row:
            continue
        hexc = row["color"]
        col = hex_to_bgr(hexc)
        dark = luminance(hexc) < 0.18
        x, y = it["px"][0] - x0, it["px"][1] - y0
        w, h = it["wpx"], it["hpx"]
        if dark:  # a black line vanishes on this UI: give it a light edge underneath
            cv2.rectangle(out, (x, y), (x + w, y + h), (235, 235, 235), 3)
        cv2.rectangle(out, (x, y), (x + w, y + h), col, 1)
        if not numbers:
            continue
        label = row["label"]
        scale = 0.85 if min(w, h) > 40 else 0.7
        (tw, th), base = cv2.getTextSize(label, cv2.FONT_HERSHEY_DUPLEX, scale, 2)
        org = (x + 4, y + th + 4)
        # Bold text, nothing behind it. A thin dark (or, for black, light) edge on the GLYPHS only keeps it
        # readable over busy art; it is not a box or a highlight.
        edge = (235, 235, 235) if dark else (10, 10, 10)
        cv2.putText(out, label, org, cv2.FONT_HERSHEY_DUPLEX, scale, edge, 4, cv2.LINE_AA)
        cv2.putText(out, label, org, cv2.FONT_HERSHEY_DUPLEX, scale, col, 2, cv2.LINE_AA)
    return out
