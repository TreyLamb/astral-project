// Turns the committed price snapshot into the item price fields the rest of the app already
// speaks.
//
// Every view here was written against tarkov.dev's shape — `avg24hPrice`, `lastLowPrice`,
// `fleaBuy`, `bestTraderBuy`, `bestTraderSell` — and has been showing em-dashes since that API
// went down. Rather than teach eight views a second vocabulary, this translates the new
// upstream into the old one, so `unitCost()`, `traderBeatsFlea()`, the watchlist, the food
// tiers, the shopping-list totals and the item detail modal all light up unchanged.
//
// WHAT MAPS TO WHAT, and why it is not obvious:
//
//   avg24hPrice   <- robustAvgPrice   the headline "what it goes for"
//   lastLowPrice  <- minPrice         the cheapest listing standing right now
//   fleaBuy       <- robustAvgPrice   NOT minPrice. `unitCost()` uses fleaBuy first and feeds
//                                     the shopping-list estimate, and the cheapest single
//                                     listing is a snipe, not a price you can plan a stack on.
//   bestTraderBuy <- cheapest CASH offer in the live assortment, converted at the derived FX
//   bestTraderSell<- the highest price any trader pays you (`traderPrices` in the upstream)
//
// 🔴 `fleaAvailable` IS ONLY EVER RAISED TO TRUE, NEVER LOWERED TO FALSE. 1,151 items have no
// flea sample, and "no sample" does not mean "flea-banned" — it also covers an item nobody
// happens to be listing. The "Flea-banned" / "No flea" chips are a claim about BSG's rules,
// and this data cannot make that claim. Absence of evidence is the whole trap the external-
// data rule in CLAUDE.md exists for, and the chips are truthy-checked in three views, so
// writing `false` on an unknown would print a confident lie in each of them.

const CURRENCIES = ['RUB', 'USD', 'EUR'];

const FLAG_STALE = 1;
const FLAG_LOW_CONFIDENCE = 2;
const FLAG_BUILD_PRICED = 4;

export const FLEA_VENDOR = 'Flea Market';

/**
 * Cheapest cash offer per item, in roubles.
 *
 * Cash only: a barter's true cost depends on how you get the give-item, which is a supply
 * question `eftCraftLoops.js` answers properly and a one-line "Trader buy: X" field cannot.
 * Quoting a barter here would put a number next to a trader who will not take your money.
 *
 * Stock limits are ignored on purpose — unlike a craft loop, buying one of something off a
 * limited offer is perfectly possible, so it belongs in "what does this cost".
 */
function cheapestCashOffers(prices) {
  const traders = prices?.traders || [];
  const fx = prices?.fx || { RUB: 1 };
  const best = new Map();

  for (const row of prices?.offers || []) {
    const [itemId, traderIdx, level, stack, , , pay] = row;
    let rub = 0;
    let cash = true;
    for (const [what, count] of pay || []) {
      if (!CURRENCIES.includes(what)) { cash = false; break; }
      const rate = fx[what];
      // No derived rate means we cannot price it honestly; skipping beats quoting dollars
      // as though they were roubles.
      if (rate == null) { cash = false; break; }
      rub += count * rate;
    }
    if (!cash) continue;

    const price = Math.round(rub / (stack || 1));
    const held = best.get(itemId);
    if (!held || price < held.price) {
      best.set(itemId, { price, vendor: traders[traderIdx] || String(traderIdx), level });
    }
  }
  return best;
}

/**
 * @param {object} prices the committed data/prices/<mode>.json
 * @returns {{byItem: Map<string, object>, meta: object}}
 */
export function priceFieldsFrom(prices) {
  const byItem = new Map();
  if (!prices) return { byItem, meta: null };

  const traderBuy = cheapestCashOffers(prices);

  for (const [id, row] of Object.entries(prices.flea || {})) {
    const [avg, min, listings, flags, levelReq] = row;
    byItem.set(id, {
      fleaAvailable: true,
      avg24hPrice: avg,
      lastLowPrice: min,
      fleaBuy: { price: avg, vendor: FLEA_VENDOR },
      fleaListings: listings,
      fleaLevelRequirement: levelReq || 0,
      fleaStale: !!(flags & FLAG_STALE),
      fleaLowConfidence: !!(flags & FLAG_LOW_CONFIDENCE),
      // A weapon's flea average is an average of modded builds, not of the bare item. Carried
      // through so a view can caveat it rather than quietly printing it as the gun's price.
      fleaBuildPriced: !!(flags & FLAG_BUILD_PRICED),
    });
  }

  for (const [id, row] of Object.entries(prices.vendor || {})) {
    const entry = byItem.get(id) || {};
    entry.bestTraderSell = { price: row[0], vendor: row[1], level: row[2] };
    byItem.set(id, entry);
  }

  for (const [id, offer] of traderBuy) {
    const entry = byItem.get(id) || {};
    entry.bestTraderBuy = offer;
    byItem.set(id, entry);
  }

  return {
    byItem,
    meta: {
      mode: prices.mode || null,
      source: prices.source || null,
      generatedAt: prices.generatedAt || null,
      scannedAt: prices.scannedAt || {},
      counts: prices.counts || {},
    },
  };
}

/**
 * Copies the price fields onto a snapshot's items.
 *
 * Returns a NEW object. The imported snapshot module is shared for the whole session, so
 * mutating it would leak one game mode's prices into the other — the same reason the live
 * overlay copies rather than assigns.
 *
 * Only items the snapshot already knows about are touched. This does not widen `items` with
 * the other ~3,700 priced ids: that map is the craft graph's own universe and the search pool
 * derived from it, and quietly tripling it would change what several unrelated views show.
 */
export function applyPrices(snapshot, prices) {
  const { byItem, meta } = priceFieldsFrom(prices);
  if (!byItem.size || !snapshot?.items) return snapshot;

  const items = {};
  let priced = 0;
  for (const [id, item] of Object.entries(snapshot.items)) {
    const fields = byItem.get(id);
    if (!fields) { items[id] = item; continue; }
    priced += 1;
    items[id] = { ...item, ...fields };
  }

  return {
    ...snapshot,
    items,
    prices: { ...meta, priced, known: byItem.size },
    // `gaps` is what the tool tells you it is missing. Prices are no longer one of them, and
    // leaving the entry in means the UI keeps apologising for data it now has.
    gaps: (snapshot.gaps || []).filter((g) => g !== 'prices'),
  };
}

/** How old the numbers actually are — the upstream's scan time, not when we fetched it. */
export function priceAge(meta) {
  const epoch = meta?.scannedAt?.flea;
  return epoch ? epoch * 1000 : null;
}
