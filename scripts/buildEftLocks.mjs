// Builds src/pages/eftShopping/data/lockIndex.json — every locked door on every map,
// parsed out of mapgenie's own `locked_door` markers and joined to the real key item.
//
// This derives rather than fetches: `npm run eft:markers` and `npm run eft:items` own the
// two inputs. Re-run it after either of those, which in practice means once a wipe.
//
//   node scripts/buildEftLocks.mjs            build + write + audit summary
//   node scripts/buildEftLocks.mjs --audit    print every lock and its match, write nothing
//   node scripts/buildEftLocks.mjs --misses   only the locks with no identified key
//
// The audit mode exists because the join is fuzzy, and the project's standing lesson on
// generated content is that a structural check proves a record is well FORMED, never that
// it is correct. 258 locks is small enough to read.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLockIndex, LOCK_KIND } from '../src/pages/eftShopping/eftLocks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const MARKER_DIR = path.join(repo, 'src/pages/eftShopping/map/data/markers');
const ITEM_NAMES = path.join(repo, 'src/pages/eftShopping/data/itemNames.json');
const OUT = path.join(repo, 'src/pages/eftShopping/data/lockIndex.json');

const args = new Set(process.argv.slice(2));
const auditOnly = args.has('--audit');
const missesOnly = args.has('--misses');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const rows = readJson(ITEM_NAMES).rows || [];
const files = fs.readdirSync(MARKER_DIR).filter((f) => f.endsWith('.json')).sort();

const byMap = {};
const all = [];
for (const file of files) {
  const slug = file.replace(/\.json$/, '');
  const data = readJson(path.join(MARKER_DIR, file));
  const locks = buildLockIndex(data, rows);
  if (!locks.length) continue;
  byMap[slug] = locks;
  for (const l of locks) all.push({ ...l, map: slug });
}

const withKey = all.filter((l) => l.keyName);
const identified = withKey.filter((l) => l.itemId);
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—');

if (auditOnly || missesOnly) {
  for (const [slug, locks] of Object.entries(byMap)) {
    const shown = missesOnly ? locks.filter((l) => l.keyName && !l.itemId) : locks;
    if (!shown.length) continue;
    console.log(`\n=== ${slug} (${shown.length}) ===`);
    for (const l of shown) {
      const mark = l.itemId ? ({ exact: '=', alias: 'A', fuzzy: '~' }[l.matchVia] || '?') : 'X';
      console.log(
        `${mark} [${(l.code || '').padEnd(14)}] ${l.room}`
        + `\n    kind=${l.kind}  key="${l.keyName || '—'}"`
        + (l.itemName ? `\n    item="${l.itemName}" (${l.matchVia} ${l.matchScore})` : '')
        + (l.keyHint ? `\n    found: ${l.keyHint}` : '')
        + (l.behind.length ? `\n    behind: ${l.behind.join(' | ')}` : ''),
      );
    }
  }
}

const kinds = {};
for (const l of all) kinds[l.kind] = (kinds[l.kind] || 0) + 1;

console.log('\n--- summary ---------------------------------------------');
console.log(`maps with locks      ${Object.keys(byMap).length}`);
console.log(`locked doors         ${all.length}`);
console.log(`  naming a key       ${withKey.length}`);
console.log(`  joined to an item  ${identified.length}  (${pct(identified.length, withKey.length)} of those naming one)`);
console.log(`  no key named       ${all.length - withKey.length}  (keypads, breachable, unknown)`);
console.log(`by kind              ${Object.entries(kinds).map(([k, n]) => `${k}=${n}`).join('  ')}`);
console.log(`with loot listed     ${all.filter((l) => l.behind.length).length}`);

const misses = withKey.filter((l) => !l.itemId);
if (misses.length) {
  console.log(`\nkeys named but not in itemNames.json (${misses.length}) — these are the honest gaps:`);
  const seen = new Set();
  for (const l of misses) {
    if (seen.has(l.keyName)) continue;
    seen.add(l.keyName);
    console.log(`  ${l.map.padEnd(20)} "${l.keyName}"${l.matchVia === 'ambiguous' ? '  (ambiguous)' : ''}`);
  }
}

for (const kind of Object.values(LOCK_KIND)) {
  if (!(kind in kinds)) kinds[kind] = 0;
}

if (!auditOnly && !missesOnly) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'mapgenie locked_door markers (npm run eft:markers) joined to itemNames.json (npm run eft:items)',
    sourceNote: 'Where a key is USED, not where it spawns. Re-run after either input is refreshed.',
    lockCount: all.length,
    identifiedKeyCount: identified.length,
    maps: byMap,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 1)}\n`);
  console.log(`\nwrote ${path.relative(repo, OUT)}  (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
}
