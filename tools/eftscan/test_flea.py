"""Run: python test_flea.py  - the flea-screen reader, on a real screenshot of the in-game flea market if present."""
import pathlib
import tempfile

import cv2

import flea
import labels
import learned
import matcher
import prices
import scanner

SHOT = pathlib.Path(__file__).parent / "cache" / "scans" / "20261005-171343.png"   # Bundle of wires, sorted by price


def test_the_smart_price_from_a_screen_ladder_is_not_clamped_by_a_fake_average():
    ladder = [(44000, 3), (44444, 16), (44998, 1), (44999, 8), (45000, 2), (47000, 2), (47888, 53), (48000, 9)]
    rec = learned.record_from_ladder(ladder, 8)
    assert rec["est"] == 44444 and rec["low"] == 44000, rec


def test_a_newer_screen_reading_beats_the_feed_and_an_older_one_does_not():
    learned.PATH = pathlib.Path(tempfile.mkdtemp()) / "l.json"
    ladder = [(28888, 2), (29000, 5), (30000, 20)]
    learned.save("pve", "x", "Medical bloodset", ladder, at=1_000_000)
    stale_feed = {"flea": 52000, "low": 47777, "est": 50999, "at": 900_000}
    fresh_feed = {"flea": 52000, "low": 47777, "est": 50999, "at": 1_000_500}
    got = learned.apply(stale_feed, "pve", "x")
    assert got["est"] <= 30000 and got["source"] == "flea screen", got        # the screen is newer
    assert learned.apply(fresh_feed, "pve", "x")["est"] == 50999              # the feed caught up: feed wins again
    assert learned.apply(stale_feed, "regular", "x")["est"] == 50999          # another economy is untouched


def test_reads_every_visible_offer_off_a_real_flea_screenshot():
    if not SHOT.exists():
        print("   (skipped: no screenshot)")
        return
    cat = matcher.Catalog()
    texts = labels.read_text(cv2.imread(str(SHOT)))
    assert flea.looks_like_flea(texts)
    rows = flea.parse_offers(texts)
    assert len(rows) >= 12 and {r["name"].replace(" ", "") for r in rows} == {"Bundleofwires"}
    prices_seen = [r["price"] for r in rows]
    assert prices_seen[:3] == [44000, 44444, 44998] and prices_seen == sorted(prices_seen)
    assert (rows[1]["price"], rows[1]["qty"]) == (44444, 16) and (rows[6]["price"], rows[6]["qty"]) == (47888, 53)
    g = flea.group(rows, labels.NameIndex(cat), cat)
    assert len(g) == 1 and next(iter(g.values()))["name"] == "Bundle of wires"


def test_an_inventory_screen_is_not_mistaken_for_the_flea():
    p = pathlib.Path(__file__).parent / "cache" / "scans" / "20261005-160519.png"
    if p.exists():
        assert not flea.looks_like_flea(labels.read_text(cv2.imread(str(p))))


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok ", name)
