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
import { PRICE_BASE as BASE, GAME_TYPE, CURRENCY, buildPriceSnapshot } from '../src/pages/eftShopping/eftPriceBuild.js';

// The transform itself lives in eftPriceBuild.js so the in-app Refresh button builds
// byte-identical snapshots. Its header carries the FX / weapon-price / un-rated-currency traps.

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'prices');
// One file per economy, named by OUR mode id, so the app can import the one the user has
// selected and nothing else. PVE and PVP really are different markets — Bolts is 42,872 RUB
// in PVE against 30,487 in PVP — so showing one under the other's toggle would be a lie the
// UI has no way to flag.
const outFor = (mode) => path.join(OUT_DIR, `${mode}.json`);
const SNAPSHOT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'hideoutSnapshot.json');

const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

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

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const traderName = new Map((snapshot.traders || []).map((t) => [t.id, t.name]));
  const out = buildPriceSnapshot({ mode, overview, assort, traderName, log: (m) => console.log(`  ${m}`) });
  const { fx, counts, traders, offers: rows } = out;
  console.log(`  FX (RUB per unit): ${Object.entries(fx).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const buildPriced = counts.buildPriced;
  const noSample = counts.noFleaSample;

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
