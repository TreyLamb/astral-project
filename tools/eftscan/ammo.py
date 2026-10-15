"""Ammo is ranked by TIER, not priced.

Loose rounds do not trade as single items and a stack's size does not matter for what you are
deciding (is this worth keeping?), so a scanned round is shown with its tier letter instead of a
rouble value. The ballistics are the ones already in the site (eft-ammo.com's per-armour-class
ratings, src/pages/eftShopping/data/ammoSnapshot.json).

⚠ PROVISIONAL RULE. The tier below is a placeholder formula - the average of a round's effectiveness
against armour classes 4, 5 and 6 - until the real per-caliber rules are given. Any round can be
pinned to a tier by hand: from the panel (double-click an ammo row) or in `ammo_tiers.json`.
"""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).parent
SNAPSHOT = HERE.parent.parent / "src" / "pages" / "eftShopping" / "data" / "ammoSnapshot.json"
TIERS = ["S", "A", "B", "C", "D"]  # best first; colours come from the panel's five colour levels

_K = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())  # noqa: E731

_rounds = None


def _load():
    global _rounds
    if _rounds is None:
        _rounds = []
        try:
            snap = json.loads(SNAPSHOT.read_text(encoding="utf8"))
            for cal in snap.get("calibers", []):
                for r in cal.get("rounds", []):
                    _rounds.append((cal["caliber"], r))
        except OSError:
            pass
    return _rounds


def default_tier(round_rec):
    """Provisional: how well it does against the armour you actually meet (classes 4-6)."""
    armor = round_rec.get("armor") or []
    top = armor[3:6]
    if not top:
        return "D"
    score = sum(top) / len(top)  # eft-ammo.com rates 0 (pointless) .. 6 (basically ignores)
    if score >= 5:
        return "S"
    if score >= 4:
        return "A"
    if score >= 3:
        return "B"
    if score >= 2:
        return "C"
    return "D"


# A loose round's name starts with its calibre: 9x19mm, 5.56x45mm, .300 AAC, 12/70, 23x75mm ... Without this
# a part whose name merely ENDS like a round ("M700 Magpul Pro 700 pistol grip") was ranked as ammo.
_CALIBRE_START = re.compile(r"^(\.\d{2,3}|\d+(\.\d+)?x\d+|\d{1,2}/\d{2})", re.I)


def find_round(item_name):
    """The ballistics record for a scanned round, or None if this is not (a known) ammo.

    The game's loose-round name is the caliber plus the round ('9x19mm Pst gzh'), the dataset keeps
    them apart, so the match is: the dataset's round name is the END of the item's name. Where two
    calibers share a round name ('"Poleva-3" slug' is 12 AND 20 gauge) the caliber breaks the tie."""
    if not _CALIBRE_START.match((item_name or "").strip()):
        return None
    key = _K(item_name)
    best = []
    for cal, r in _load():
        for nm in (r.get("name"), r.get("shortName")):
            k = _K(nm)
            if k and key.endswith(k):
                best.append((len(k), cal, r))
    if not best:
        return None
    top = max(b[0] for b in best)
    best = [b for b in best if b[0] == top]
    if len(best) > 1:
        gauge = [b for b in best if _K(b[1].split()[0]) in key]
        best = gauge or best
    return best[0][2]


def load_overrides():
    p = HERE / "ammo_tiers.json"
    try:
        return {_K(k): v.upper() for k, v in json.loads(p.read_text(encoding="utf8")).items() if v.upper() in TIERS}
    except (OSError, ValueError):
        return {}


def tier_for(item_name, user_overrides=None):
    """-> (tier letter, round record, how) or None if the item is not ammo.
    how: 'manual' (pinned by you) or 'formula' (the provisional rule)."""
    rec = find_round(item_name)
    if rec is None:
        return None
    for source in (user_overrides or {}, load_overrides()):
        pinned = {_K(k): v for k, v in source.items()}.get(_K(item_name))
        if pinned in TIERS:
            return pinned, rec, "manual"
    return default_tier(rec), rec, "formula"
