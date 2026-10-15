"""Run: python test_pricing.py"""
import prices
import scanner


def test_a_lone_lowball_and_a_scam_tail_do_not_move_the_price():
    # MRE ration pack, read off the live flea: one 21k lowball, the real stack at 38-40k, a scam tail to 90k.
    ladder = [(21111, 1), (36665, 1), (36666, 2), (37777, 1), (37995, 1), (38000, 8), (38777, 2), (39000, 2),
              (40000, 4), (41999, 3), (43800, 6), (44000, 2), (45000, 3), (89999, 1)]
    est = prices.smart_price(ladder, avg=46758, low=21111)
    assert 37000 <= est <= 40500, est           # was 21,111 by the minimum and 46,758 by the average


def test_tushonka_ignores_the_cheap_clump_and_the_tail():
    ladder = [(19999, 4), (22220, 1), (22222, 1), (23000, 9), (24000, 6), (24999, 1), (25000, 21), (420420, 1)]
    assert 22000 <= prices.smart_price(ladder, avg=37106, low=19999) <= 25000


def test_fp100_stays_near_the_real_stack_not_the_scam_average():
    ladder = [(390000, 1), (400000, 1), (411111, 1), (440000, 4), (440269, 1), (444444, 9), (449999, 4), (1500000, 5)]
    assert 435000 <= prices.smart_price(ladder, avg=472764, low=390000) <= 450000


def test_never_outside_the_lowest_listing_and_the_average():
    est = prices.smart_price([(100, 3), (200, 3), (300, 3)], avg=150, low=100)
    assert 100 <= est <= 150, est


def test_few_units_and_no_ladder_degrade_sensibly():
    assert prices.smart_price([(22000, 1), (24000, 1)], avg=23971, low=22000) == 23971 or \
        22000 <= prices.smart_price([(22000, 1), (24000, 1)], avg=23971, low=22000) <= 23971
    est = prices.smart_price([], avg=169000, low=35000)      # no ladder: 30% of the way up on a log scale
    assert 35000 < est < 169000 and est < 90000, est
    assert prices.smart_price([], avg=None, low=None) is None


def test_depth_moves_the_estimate_toward_the_lowest_listing():
    # D Size battery: three units at ~12k, then the real stack at 15.5k and a long tail up to 22k+
    ladder = [(12000, 1), (12111, 1), (12222, 1), (15500, 8), (15999, 1), (16000, 1), (18000, 6), (18997, 1),
              (18998, 2), (18999, 2), (19998, 5), (19999, 1), (20000, 2), (21000, 9), (22100, 1), (22222, 2)]
    rec = {"flea": 22579, "low": 12000, "ladder": ladder}
    d3, d8, d15 = (scanner.pick_flea(rec, "smart", d) for d in (3, 8, 15))
    assert d3 < d8 <= d15, (d3, d8, d15)
    assert d3 == 12222 and d8 == 15500, (d3, d8)


def test_pick_flea_follows_the_setting():
    rec = {"flea": 169000, "low": 35000, "est": 52000}
    assert scanner.pick_flea(rec, "smart") == 52000
    assert scanner.pick_flea(rec, "low") == 35000
    assert scanner.pick_flea(rec, "avg") == 169000
    assert scanner.pick_flea(rec, "mid") == 102000
    assert scanner.pick_flea({"flea": 169000, "low": 35000}, "smart") == 169000   # old cache without an estimate


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok ", name)
