"""Read real, current prices off the in-game flea market.

The public flea feed is sampled by a third party about hourly and sometimes sees only a fraction of the
offers (a bloodset: 8 seen, 28888 live vs 47777 in the feed). The flea market screen itself is the truth, and
it already prints every offer: item name, "Total N", and the price per item. So when a scan lands on that
screen it does not look for inventory items at all - it reads the offers, builds the same cheapest-offers
ladder the feed has, and stores it (learned.py). Newer than the feed's sample, it wins.

For best results sort by Price (ascending) so the visible rows ARE the cheapest ones.
"""
import re

import labels

PURCHASE = "purchase"
TOTAL_RE = re.compile(r"^total\s*(\d+)$", re.I)
PRICE_RE = re.compile(r"^\D{0,2}(\d[\d\s.,]*\d|\d)\s*\D{0,2}$")   # "44 000 P", "44000₽", "5 000"


def looks_like_flea(texts):
    """The flea offer list: a PURCHASE button on every row, or its Offer / Price / Expires header."""
    buttons = sum(1 for t in texts if labels.norm(t[4]) == PURCHASE)
    header = {labels.norm(t[4]) for t in texts}
    return buttons >= 2 or {"offer", "expiresin"} <= header or {"offer", "price"} <= {h.rstrip("^") for h in header}


def _digits(text):
    d = re.sub(r"\D", "", text or "")
    return int(d) if d else None


def parse_offers(texts):
    """-> [{name, price, qty}] one per visible offer row, in screen order.

    Rows are anchored on their PURCHASE button; within the row's vertical band the price sits in the Price column,
    the quantity is "Total N" under the name, and the name is the top-most text in the Offer column."""
    W = max((t[2] for t in texts), default=1920)
    price_hdr = next((t for t in texts if labels.norm(t[4]).rstrip("^") == "price"), None)
    offer_hdr = next((t for t in texts if labels.norm(t[4]) == "offer"), None)
    px0, px1 = ((price_hdr[0] - 70, price_hdr[2] + 90) if price_hdr else (W * 0.69, W * 0.79))
    ox0 = (offer_hdr[0] - 260) if offer_hdr else W * 0.46
    buttons = sorted((t for t in texts if labels.norm(t[4]) == PURCHASE), key=lambda t: t[1])
    rows = []
    for b in buttons:
        yc = (b[1] + b[3]) / 2
        band = [t for t in texts if yc - 42 <= (t[1] + t[3]) / 2 <= yc + 42]
        price = next((_digits(t[4]) for t in band if px0 <= (t[0] + t[2]) / 2 <= px1
                      and PRICE_RE.match(t[4].strip()) and (_digits(t[4]) or 0) >= 10), None)
        qty = next((int(m.group(1)) for t in band if (m := TOTAL_RE.match(t[4].replace(" ", "")))), None)
        names = sorted((t for t in band if ox0 <= t[0] < px0 and not TOTAL_RE.match(t[4].replace(" ", ""))
                        and ">" not in t[4] and labels.norm(t[4]) not in ("", PURCHASE)), key=lambda t: t[1])
        if price and names:
            rows.append({"name": names[0][4].strip(), "price": price, "qty": qty or 1})
    return rows


def group(rows, index, catalog):
    """-> {item id: {"name", "ladder": [(price, qty)...]}} for rows whose name is a known item."""
    out = {}
    for r in rows:
        ids = index.lookup(r["name"])
        if not ids:
            continue
        iid = max(ids, key=lambda i: (ids[i], catalog.meta[i]["name"].lower() == r["name"].lower()))
        g = out.setdefault(iid, {"name": catalog.meta[iid]["name"], "prices": {}})
        g["prices"][r["price"]] = g["prices"].get(r["price"], 0) + r["qty"]
    for g in out.values():
        g["ladder"] = sorted(g.pop("prices").items())
    return out
