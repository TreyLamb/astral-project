"""Prices you have read off the game yourself (the flea market screen), kept with the time they were read.

A learned price is only used while it is NEWER than the feed's own sample for that item - the moment the feed
catches up, the feed wins again, so a stale screenshot can never quietly outlive fresh data.
"""
import json
import pathlib
import time

import prices

PATH = pathlib.Path(__file__).parent / "cache" / "learned_prices.json"


def _load():
    try:
        return json.loads(PATH.read_text(encoding="utf8"))
    except (OSError, ValueError):
        return {}


def save(mode, item_id, name, ladder, source="flea screen", at=None):
    data = _load()
    data.setdefault(mode, {})[item_id] = {"name": name, "ladder": [list(x) for x in ladder],
                                          "at": at or time.time(), "source": source}
    PATH.parent.mkdir(parents=True, exist_ok=True)
    PATH.write_text(json.dumps(data), encoding="utf8")


def record_from_ladder(ladder, depth=8):
    """A price record shaped like the feed's, built from a ladder read off the screen."""
    units = sorted(p for p, q in ladder for _ in range(min(int(q), 50)))
    if not units:
        return {}
    cheap = units[:20]
    avg = round(sum(cheap) / len(cheap))
    # No average to clamp against: the mean of the cheapest 20 is not "the average of all offers", and clamping the
    # estimate to it dragged a correct 44,444 down to 44,405.
    return {"flea": avg, "low": units[0], "est": prices.smart_price(ladder, None, units[0], depth),
            "ladder": [list(x) for x in ladder], "n": len(units)}


def apply(rec, mode, item_id, depth=8):
    """The feed's record, or - if you read a NEWER one off the flea screen - that one instead."""
    got = _load().get(mode, {}).get(item_id)
    if not got or got["at"] <= (rec.get("at") or 0):
        return rec
    merged = dict(rec)
    merged.update(record_from_ladder([tuple(x) for x in got["ladder"]], depth))
    merged.update(at=got["at"], source=got.get("source", "screen"))
    return merged
