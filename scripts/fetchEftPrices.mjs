// npm run eft:prices  [-- --mode=all|pve|regular|season]
//
// Flea prices, trader sell-back prices and the LIVE TRADER ASSORTMENT, from the public
// upstream documented in src/pages/eftShopping/PRICES.md.
//
// This is the first thing in the repo that gives the EFT sub-app real prices. Everything
// else — hideout recipes, quests, barters, gear — comes from game files or the wiki, and
// prices were the one gap (the snapshot's own `gaps` list has said "prices" since it was
// built). tarkov.dev's GraphQL, which `eftApi.js` still points at, has been down for weeks.
//
// WHY THE TRADER ASSORTMENT MATTERS AS MUCH AS THE PRICES. `traders/offers` is the actual
// live assort: every offer, what it costs (cash OR barter), which loyalty level it needs,
// whether its stock is `unlimitedCount`, and `buyRestrictionMax` — the per-restock purchase
// cap. That last pair is the entire definition of a "semi-infinite" craft loop: an input you
// can re-buy forever is what makes a craft repeatable, and the restriction is what makes it
// SEMI-infinite rather than infinite. eftCraftLoops.js is built directly on this.
//
// ⚠ THE SNAPSHOT IS A POINT IN TIME. Flea prices move hourly; trader assortments move every
// wipe. This is committed like every other snapshot in this folder so the app works with no
// network, and the file stamps its own scan times so the UI can say how stale it is. Re-run
// it when the numbers start looking wrong, and always after a wipe.
//
// ⚠ FX IS DERIVED, NOT HARDCODED. Each offer carries `requirementsCost`, the RUB value of
// its price side, so a single-requirement cash offer gives the rate directly
// (`requirementsCost / count`). Measured 2026-09-10: RUB 1, USD ~170.4, EUR ~200.5 — tight
// spreads across 759 and 58 offers. Note this is the BUY rate and it differs from the rate
// implied by `traderPrices` (~128 ₽/$), which is what Peacekeeper pays YOU. Using the wrong
// one misprices every Peacekeeper input by a third.
//
// ⚠ WEAPON FLEA PRICES ARE FOR BUILDS, NOT BARE GUNS. `robustAvgPrice` on a weapon averages
// listings that are mostly fully modded, so a craft that outputs a bare rifle looks like it
// prints millions. Outputs whose handbook root is Weapons are flagged `buildPriced` here and
// the loop engine refuses to value them off flea.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'prices');
// One file per economy, named by OUR mode id, so the app can import the one the user has
// selected and nothing else. PVE and PVP really are different markets — Bolts is 42,872 RUB
// in PVE against 30,487 in PVP — so showing one under the other's toggle would be a lie the
// UI has no way to flag.
const outFor = (mode) => path.join(OUT_DIR, `${mode}.json`);
const SNAPSHOT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'hideoutSnapshot.json');

const BASE = 'https://publicfleaapi.asoloproject.xyz/api/v2/flea-advanced';
const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

// Our GAME_MODES id -> the upstream's gameType. Copied from the-hideout/tarkov-data-manager's
// `modules/tarkov-data-sp.mjs` getGameType(), not guessed. See PRICES.md.
const GAME_TYPE = { regular: 'eft', pve: 'pve', 'pvp-season': 'season', season: 'season' };

const CURRENCY = {
  '5449016a4bdc2d6f028b456f': 'RUB',
  '5696686a4bdc2da3298b456a': 'USD',
  '569668774bdc2da2298b4568': 'EUR',
};

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

async function getJson(url) {
  const t0 = Date.now();
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  console.log(`  ${(text.length / 1e6).toFixed(1)} MB in ${Date.now() - t0} ms`);
  return JSON.parse(text);
}

/**
 * Median RUB value of one unit of each currency, read off the offers themselves.
 * A single-requirement cash offer states both the count and its RUB worth.
 */
function deriveFx(offers) {
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
    if (fx[code] == null) console.log(`  ⚠ no rate derived for ${code} — offers priced in it will be skipped`);
  }
  return fx;
}

// `pvp-season` is deliberately not in the default set: it is a third, separate economy
// (tarkov.dev's own game-modes.mjs declares regular/pve/pvp-season) that the app does not
// model yet. The upstream serves it for free with `--mode=season` whenever it matters.
const DEFAULT_MODES = ['pve', 'regular'];

async function main() {
  const requested = arg('mode', 'all');
  const modes = requested === 'all' ? DEFAULT_MODES : [requested];
  for (const mode of modes) {
    const gameType = GAME_TYPE[mode];
    if (!gameType) throw new Error(`unknown mode "${mode}" — one of all, ${Object.keys(GAME_TYPE).join(', ')}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const mode of modes) await run(mode, GAME_TYPE[mode]);
}

async function run(mode, gameType) {
  console.log(`→ ${gameType} items-overview …`);
  const overview = await getJson(`${BASE}/${gameType}/items-overview`);
  console.log(`→ ${gameType} traders/offers …`);
  const assort = await getJson(`${BASE}/${gameType}/traders/offers`);

  const items = overview.items || [];
  const offers = assort.data || [];
  if (!items.length || !offers.length) throw new Error('upstream returned an empty payload');

  const fx = deriveFx(offers);
  console.log(`  FX (RUB per unit): ${Object.entries(fx).map(([k, v]) => `${k} ${v}`).join(', ')}`);

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
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const traderName = new Map((snapshot.traders || []).map((t) => [t.id, t.name]));
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
  if (skippedFx) console.log(`  ⚠ skipped ${skippedFx} offers priced in a currency with no derived rate`);

  const out = {
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

  const target = outFor(mode);
  fs.writeFileSync(target, JSON.stringify(out));
  const kb = (fs.statSync(target).size / 1024).toFixed(0);
  console.log(`\n✓ ${path.relative(path.join(HERE, '..'), target)} — ${kb} KB`);
  console.log(`  mode ${mode} (${gameType})`);
  console.log(`  flea ${out.counts.flea} items (${buildPriced} weapon/build-priced, ${noSample} with no sample)`);
  console.log(`  vendor sell-back ${out.counts.vendor} items`);
  console.log(`  trader offers ${out.counts.offers} across ${traders.length} traders`);
  const cash = rows.filter((r) => r[6].every((p) => CURRENCY[p[0]] || ['RUB', 'USD', 'EUR'].includes(p[0])));
  console.log(`  of those: ${cash.length} cash, ${rows.length - cash.length} barter, ${rows.filter((r) => r[4]).length} with unlimited stock`);
  const stamp = (epoch) => (epoch ? `${Math.round((Date.now() / 1000 - epoch) / 60)} min old` : 'unknown');
  console.log(`  upstream scans: flea ${stamp(out.scannedAt.flea)}, traders ${stamp(out.scannedAt.traders)}`);
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
