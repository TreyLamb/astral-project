"""Live flea + trader prices for the scanner. Same public upstream the site's Refresh button
uses (src/pages/eftShopping/PRICES.md); only the two numbers a scan needs are kept."""
import json
import pathlib
import re
import time

import requests

HERE = pathlib.Path(__file__).parent
BASE = "https://publicfleaapi.asoloproject.xyz/api/v2/flea-advanced"
GAME_TYPE = {"pve": "pve", "regular": "eft", "pvp": "eft"}
MAX_AGE_S = 5 * 60   # the upstream republishes about every 5 minutes (its own s-maxage); never sit on it longer
SCHEMA = 9  # bump when the cached shape changes so an old cache is not trusted
# Money is not in the price feed at all. Its value is its count times a derived exchange rate;
# the site's own price snapshot already carries the rates it derived from live trader offers.
MONEY = {"5449016a4bdc2d6f028b456f": "RUB", "5696686a4bdc2da3298b456a": "USD", "569668774bdc2da2298b4568": "EUR"}
FX_FALLBACK = {"RUB": 1, "USD": 170, "EUR": 195}
SITE_SNAPSHOT = HERE.parent.parent / "src" / "pages" / "eftShopping" / "data" / "prices"
UA = {"User-Agent": "astral-project-eftscan (personal item scanner)"}


def smart_price(ladder, avg, low, depth=8):
    """What an item really sells for, from the flea's own offers.

    The AVERAGE is dragged up by scam listings (a Toolset at 170k average beside a 35k cheapest) and the MINIMUM is
    often one silly lowball (an MRE at 21k when 38-40k is where the offers actually stack). Neither is the price.
    What is real is where the cheap offers CLUSTER: the `depth`-th cheapest unit for sale. Checked against prices
    read off the game for an MRE, a Tushonka and an FP-100 filter, that lands within ~3% (the minimum was 25% out
    and the average 30-90% out).

    `ladder` is the flea's cheapest offers as [(price, quantity), ...]. With only a few units, depth shrinks to
    40% of them; with no ladder at all it falls back to a point 30% of the way from the lowest listing to the
    average on a log scale. Never above the average and never below the lowest listing."""
    units = sorted(price for price, qty in (ladder or []) for _ in range(min(int(qty), 50)))[:400]
    if len(units) >= 3:
        k = min(depth, max(2, -(-len(units) * 4 // 10)))   # ceil(40%), but never more than `depth`
        est = units[k - 1]
    elif low and avg:
        est = round(low * (avg / low) ** 0.3)
    else:
        est = avg or low
    if est is None:
        return None
    if avg:
        est = min(est, avg)
    if low:
        est = max(est, low)
    return round(est)


def _path(mode):
    return HERE / "cache" / f"prices_{mode}.json"


def _fetch(mode):
    r = requests.get(f"{BASE}/{GAME_TYPE[mode]}/items-overview", headers=UA, timeout=60)
    r.raise_for_status()
    out = {}
    for it in r.json().get("items", []):
        names = [h.get("name") for h in it.get("handbook") or []]
        sample = it.get("latestPriceSample") or it.get("lastValid30dPriceSample") or {}
        best = None
        for tp in it.get("traderPrices") or []:
            for lo in tp.get("loyalties") or []:
                if (lo.get("price_rub") or 0) > 0 and (best is None or lo["price_rub"] > best[0]):
                    best = [round(lo["price_rub"]), tp.get("nickname")]
        out[it["tarkovId"]] = {
            "flea": round(sample["robustAvgPrice"]) if (sample.get("robustAvgPrice") or 0) > 0 else None,
            "low": round(sample.get("minPrice") or 0) or None,
            # the cheapest 25 price levels, kept so the estimate can be recomputed at any depth without a download
            "ladder": [[o["price"], sum(x.get("qty", 1) for x in o.get("offers", []))]
                       for o in sorted((sample.get("latestSupplyPressure") or []), key=lambda o: o["price"])[:25]],
            "est": smart_price(
                [(o["price"], sum(x.get("qty", 1) for x in o.get("offers", []))) for o in
                 (sample.get("latestSupplyPressure") or [])],
                sample.get("robustAvgPrice") or None, sample.get("minPrice") or None),
            "scanned": sample.get("sampleTimeEpoch"),
            "at": sample.get("sampleTimeEpoch"),      # when THIS item's flea sample was taken - not when we downloaded
            "n": sample.get("listingCount"),          # how many offers that sample actually saw
            "trader": best[0] if best else None,
            "traderName": best[1] if best else None,
            "stack": False,
            # FIREARMS only - grenades and knives are in the same root but have no mods to resize them
            "weapon": bool(names and names[0] == "Weapons" and (len(names) < 2 or names[1] not in (
                "Melee weapons", "Throwables", "Special weapons"))),
        }
    # Loose rounds are not in the feed at all - only "ammo pack (N pcs)" boxes are. A stack of loose
    # rounds is worth (pack price / N) per round, so derive that, keyed by the round's own name.
    per_round = {}
    for it in r.json().get("items", []):
        m = re.fullmatch(r"(.+) ammo pack \((\d+) pcs\)", it.get("localizedName") or "")
        if not m:
            continue
        rec = out.get(it["tarkovId"], {})
        price = rec.get("flea") or rec.get("trader")
        if price:
            n = int(m.group(2))
            if m.group(1) not in per_round or n > per_round[m.group(1)][1]:  # bigger pack = steadier price
                per_round[m.group(1)] = (price / n, n)
    fx = dict(FX_FALLBACK)
    try:
        snap = json.loads((SITE_SNAPSHOT / f"{'pve' if mode == 'pve' else 'regular'}.json").read_text(encoding="utf8"))
        fx.update({k: v for k, v in (snap.get("fx") or {}).items() if v})
    except Exception:  # noqa: BLE001
        pass
    for iid, code in MONEY.items():
        out[iid] = {"flea": fx[code], "low": None, "scanned": None, "trader": None, "traderName": None,
                    "stack": True, "money": code}
    return {"v": SCHEMA, "fetchedAt": time.time(), "mode": mode, "items": out,
            "rounds": {name: round(v[0], 2) for name, v in per_round.items()}}


def load(mode="pve", force=False):
    """Cached for 30 minutes; a failed refresh falls back to whatever is on disk."""
    p = _path(mode)
    p.parent.mkdir(parents=True, exist_ok=True)
    cached = json.loads(p.read_text(encoding="utf8")) if p.exists() else None
    if cached and cached.get("v") != SCHEMA:
        cached = None
    if cached and not force and time.time() - cached["fetchedAt"] < MAX_AGE_S:
        return cached
    try:
        fresh = _fetch(mode)
        p.write_text(json.dumps(fresh), encoding="utf8")
        return fresh
    except Exception as e:  # noqa: BLE001 - offline must not kill a scan
        if cached:
            print(f"  price refresh failed ({e}); using prices from {int((time.time()-cached['fetchedAt'])/60)} min ago")
            return cached
        raise


def lookup(book, item_id, name):
    """Price record for a scanned item ({} if the feed has none). Loose ammo is deliberately NOT
    priced - it is ranked by tier (see ammo.py)."""
    return book["items"].get(item_id) or {}
