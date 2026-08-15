// Regenerates src/pages/eftShopping/data/ammoSnapshot.json.
//
//   node scripts/fetchEftAmmo.mjs          (or: npm run eft:ammo)
//
// SOURCE
// ------
// eft-ammo.com. Trey named it as the source of truth for how ammo should be
// presented, and it turns out to be the source of truth for the numbers too:
// the site is a Next.js app that embeds its whole dataset in the __NEXT_DATA__
// script tag, so one page fetch yields every round in every caliber.
//
// Why not the usual two:
//   * tarkov.dev  — its GraphQL worker has been down for days.
//   * SPT mirror  — templates/items.json carries real ballistics, but it is a
//                   Git-LFS pointer on the raw endpoint (18 MB behind
//                   media.githubusercontent.com) AND pinned to EFT 0.16.0 from
//                   March 2025, which is several wipes and several ammo
//                   rebalances stale.
//
// The thing that makes eft-ammo.com's table readable is the class1..class6
// grid: for each armour class, a 0-6 rating of how well the round does against
// it. That is a derived, hand-tuned judgement, not a raw game stat, and it is
// the reason the site is worth copying rather than recomputing from
// penetration values.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'ammoSnapshot.json');

const URL_SRC = 'https://www.eft-ammo.com/';

// eft-ammo.com's own legend, lifted from the key at the bottom of their page so
// our tooltips say exactly what theirs do.
const EFFECTIVENESS = [
  { value: 0, label: 'Pointless', shots: '20+' },
  { value: 1, label: 'It’s Possible, But…', shots: '13 to 20' },
  { value: 2, label: 'Magdump Only', shots: '9 to 13' },
  { value: 3, label: 'Slightly Effective', shots: '5 to 9' },
  { value: 4, label: 'Effective', shots: '3 to 5' },
  { value: 5, label: 'Very Effective', shots: '1 to 3' },
  { value: 6, label: 'Basically Ignores', shots: '<1' },
];

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const cheapest = (list) => {
  const rub = (list || []).filter((b) => b.priceRUB > 0);
  if (!rub.length) return null;
  const best = rub.reduce((lo, b) => (b.priceRUB < lo.priceRUB ? b : lo));
  return {
    price: best.priceRUB,
    vendor: best.vendor?.name || best.vendor?.trader?.name || 'Trader',
    level: best.vendor?.minTraderLevel ?? null,
  };
};

async function main() {
  console.log('→ eft-ammo.com …');
  const res = await fetch(URL_SRC, { headers: { 'User-Agent': 'astral-project-eftsh (personal ammo chart)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('no __NEXT_DATA__ block — the site changed shape');
  const results = JSON.parse(match[1])?.props?.pageProps?.results;
  if (!results || typeof results !== 'object') throw new Error('__NEXT_DATA__ had no results payload');

  const calibers = Object.entries(results)
    .map(([caliber, list]) => ({
      caliber,
      rounds: (list || []).map((r) => ({
        name: r.standard?.translations?.en?.name || r.name,
        shortName: r.name,
        note: r.standard?.translations?.en?.note || null,
        normalizedName: r.standard?.normalizedName || null,
        // "8x37" for buckshot stays as written; damageInt is the total.
        damage: r.damage ?? null,
        damageTotal: r.damageInt ?? num(r.damage),
        penetration: num(r.penValue),
        fragmentation: r.fragChange ?? null,
        recoil: num(r.recoil),
        accuracy: num(r.accuracy),
        velocity: num(r.initialSpeed),
        effectiveDistance: num(r.effDist),
        maxHeadshotDistance: num(r.maxHsDist),
        subsonic: !!r.subsonic,
        fleaBanned: !!r.notAvailableOnFleaMarket,
        // The 0-6 rating per armour class. This is the whole point.
        armor: [1, 2, 3, 4, 5, 6].map((n) => num(r[`class${n}`])),
        buy: cheapest(r.buyFor),
        wikiLink: r.wikiLink || null,
      })),
    }))
    .filter((g) => g.rounds.length);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: 'eft-ammo.com',
    sourceUrl: URL_SRC,
    sourceNote:
      'Ballistics and the per-armour-class effectiveness ratings are eft-ammo.com\'s, '
      + 'read from the dataset their page embeds. tarkov.dev was down and the SPT mirror\'s '
      + 'item table is pinned to EFT 0.16.0 (March 2025).',
    effectiveness: EFFECTIVENESS,
    calibers,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snapshot));
  const total = calibers.reduce((n, g) => n + g.rounds.length, 0);
  console.log(
    `\nwrote ${path.relative(path.join(HERE, '..'), OUT)}  (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)\n`
    + `  calibers  ${calibers.length}\n`
    + `  rounds    ${total}\n`
    + `  with pen  ${calibers.flatMap((g) => g.rounds).filter((r) => r.penetration != null).length}\n`
    + `  with buy  ${calibers.flatMap((g) => g.rounds).filter((r) => r.buy).length}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
