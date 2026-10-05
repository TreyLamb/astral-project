// Turns the upstream's two raw payloads into the compact price snapshot.
//
// Shared by `scripts/fetchEftPrices.mjs` (Node, writes the committed file) and the in-app
// Refresh button (browser, keeps the result locally), so a number means the same thing
// whichever one produced it. Pure and import-free on purpose — it must run in both. Every
// trap this encodes (FX derived not hardcoded, weapon flea averages being for builds, an
// offer in an un-rated currency being skipped rather than priced at 1) is written up in
// PRICES.md and in the header of the script.

export const PRICE_BASE = 'https://publicfleaapi.asoloproject.xyz/api/v2/flea-advanced';

// Our GAME_MODES id -> the upstream's gameType. Copied from the-hideout/tarkov-data-manager's
// `modules/tarkov-data-sp.mjs` getGameType(), not guessed. See PRICES.md.
export const GAME_TYPE = { regular: 'eft', pve: 'pve', 'pvp-season': 'season', season: 'season' };

export const CURRENCY = {
  '5449016a4bdc2d6f028b456f': 'RUB',
  '5696686a4bdc2da3298b456a': 'USD',
  '569668774bdc2da2298b4568': 'EUR',
};

/**
 * Median RUB value of one unit of each currency, read off the offers themselves.
 * A single-requirement cash offer states both the count and its RUB worth.
 */
export function deriveFx(offers, log = () => {}) {
  const samples = {};
  for (const offer of offers) {
    if (offer.requirements?.length !== 1 || !(offer.requirementsCost > 0)) continue;
    const code = CURRENCY[offer.requirements[0]._tpl];
    if (!code) continue;
    (samples[code] ||= []).push(offer.requirementsCost / offer.requirements[0].count);
  }
  const fx = {};
  for (const [code, list] of Object.entries(samples)) {
    list.sort((a, b) => a - b);
    fx[code] = Math.round(list[Math.floor(list.length / 2)] * 100) / 100;
  }
  // A currency with no cash offer this wipe would silently price at 1 RUB, which would make
  // everything bought with it look free. Better to have no rate than a wrong one — the loop
  // engine skips an offer it cannot price.
  for (const code of Object.values(CURRENCY)) {
    if (fx[code] == null) log(`⚠ no rate derived for ${code} — offers priced in it will be skipped`);
  }
  return fx;
}

/**
 * @param {object} args
 * @param {string} args.mode        our mode id (`pve` | `regular`)
 * @param {object} args.overview    parsed items-overview payload
 * @param {object} args.assort      parsed traders/offers payload
 * @param {Map<string,string>} args.traderName  trader id -> display name
 * @param {(msg:string)=>void} [args.log]
 * @returns the snapshot object written to data/prices/<mode>.json
 */
export function buildPriceSnapshot({ mode, overview, assort, traderName, log = () => {} }) {
  const gameType = GAME_TYPE[mode];
  const items = overview.items || [];
  const offers = assort.data || [];
  if (!items.length || !offers.length) throw new Error('upstream returned an empty payload');

  const fx = deriveFx(offers, log);

  // --- flea + vendor, per item ---------------------------------------------
  const flea = {};
  const vendor = {};
  let buildPriced = 0;
  let noSample = 0;

  for (const item of items) {
    const id = item.tarkovId;
    if (!id) continue;

    const sample = item.latestPriceSample || item.lastValid30dPriceSample;
    if (sample?.robustAvgPrice > 0) {
      // A weapon's flea listings are overwhelmingly modded builds, so its average is not the
      // price of the bare item a craft produces. Matched on the exact root: "Weapon parts &
      // mods" is a separate 2,244-item root whose prices ARE the bare part and must not be
      // caught by a loose /weapon/i (that mislabels 1,649 items instead of 433).
      const isWeapon = (item.handbook || [])[0]?.name === 'Weapons';
      if (isWeapon) buildPriced += 1;
      flea[id] = [
        Math.round(sample.robustAvgPrice),
        Math.round(sample.minPrice || 0),
        sample.listingCount || 0,
        (item.isStale ? 1 : 0) | (item.isLowConfidence ? 2 : 0) | (isWeapon ? 4 : 0),
        item.fleaLevelRequirement || 0,
      ];
    } else {
      noSample += 1;
    }

    // What a trader will PAY for it. The highest offer across every trader and loyalty
    // level, because that is the one you would actually take.
    let best = null;
    for (const tp of item.traderPrices || []) {
      for (const loyalty of tp.loyalties || []) {
        if (!(loyalty.price_rub > 0)) continue;
        if (!best || loyalty.price_rub > best[0]) best = [Math.round(loyalty.price_rub), tp.nickname, loyalty.level];
      }
    }
    if (best) vendor[id] = best;
  }

  // --- trader assortment ----------------------------------------------------
  const traders = [];
  const traderIndex = new Map();
  const traderSlot = (id) => {
    if (!traderIndex.has(id)) {
      traderIndex.set(id, traders.length);
      traders.push(traderName.get(id) || id);
    }
    return traderIndex.get(id);
  };

  const rows = [];
  let skippedFx = 0;
  for (const offer of offers) {
    const first = offer.items?.[0];
    if (!first?._tpl) continue;
    const pay = [];
    let priceable = true;
    for (const req of offer.requirements || []) {
      const code = CURRENCY[req._tpl];
      if (code && fx[code] == null) { priceable = false; break; }
      pay.push([code || req._tpl, req.count]);
    }
    if (!priceable) { skippedFx += 1; continue; }
    rows.push([
      first._tpl,
      traderSlot(offer.user?.id),
      offer.loyaltyLevel ?? 1,
      first.upd?.StackObjectsCount || 1,
      offer.unlimitedCount ? 1 : 0,
      offer.buyRestrictionMax ?? 0,
      pay,
    ]);
  }
  if (skippedFx) log(`⚠ skipped ${skippedFx} offers priced in a currency with no derived rate`);

  return {
    generatedAt: new Date().toISOString(),
    mode,
    gameType,
    source: 'publicfleaapi.asoloproject.xyz/api/v2/flea-advanced',
    sourceNote: 'Public, unauthenticated upstream — the same one tarkov.dev consumes. Full contract, freshness evidence and the graveyard of ruled-out alternatives: src/pages/eftShopping/PRICES.md.',
    scannedAt: {
      // The upstream stamps its own scan times. These are what "how fresh is this" should
      // be measured against — not generatedAt, which is only when we pulled it.
      flea: items.find((i) => i.latestPriceSample)?.latestPriceSample?.sampleTimeEpoch || null,
      traders: assort.lastScannedEpoch || null,
    },
    fx,
    currencyIds: CURRENCY,
    format: {
      flea: '[robustAvgPrice, minPrice, listingCount, flags, fleaLevelRequirement] — flags: 1=stale, 2=lowConfidence, 4=buildPriced (a weapon; its flea average is for modded builds, not the bare item)',
      vendor: '[rub, traderName, loyaltyLevel] — the BEST price any trader pays you',
      offers: '[itemId, traderIndex, loyaltyLevel, stackSize, unlimited, buyRestrictionMax, pay[]] — pay entries are ["RUB"|"USD"|"EUR"|<itemId>, count]',
    },
    counts: {
      flea: Object.keys(flea).length,
      vendor: Object.keys(vendor).length,
      offers: rows.length,
      buildPriced,
      noFleaSample: noSample,
    },
    traders,
    flea,
    vendor,
    offers: rows,
  };
}
