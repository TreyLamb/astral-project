// npm run eft:items
//
// The COMPLETE item-name table: every item in the game, id -> name + short name.
//
// WHY THIS EXISTS. Trey, 2026-09-09, after the Aybolit mask returned nothing on /EFTsh/uses:
// "even if an item doesn't have a usage it needs to be in there or i'll just assume our data
// isn't complete." That is the right call and it is the whole point of this file. Before it,
// the Item Uses index was built ONLY from items some other snapshot happened to mention —
// hideout requirements, craft rows, quest needs, barter sides, the gear catalog — roughly 700
// of the game's ~4,100 items. Searching for any of the other 3,400 returned silence, which is
// indistinguishable from "our data is broken". An item with no known uses is a real, useful
// answer; an empty result is not.
//
// SOURCE: SPT's `locales/global/en.json`. This is the same file scripts/fetchEftGearCatalog.mjs
// already resolves wiki page titles through, and it is the one SPT path unaffected by the
// Git-LFS problem that blocks `templates/items.json` (see the root CLAUDE.md's EFT notes) —
// it is plain JSON on the raw endpoint, ~2.7 MB.
//
// ⚠ "IS IT AN ITEM" IS DECIDED BY WHETHER IT HAS A ShortName. The locale keys every localizable
// string by template id, so a bare `<id> Name` scan returns 4,760 entries and those include
// factions (BEAR, United Security), maps (Customs, Woods, Streets of Tarkov) and organisations
// (TERRAGROUP, TerraGroup Labs PLC) — none of which belong in an item search. Every one of those
// lacks a `<id> ShortName`, and every real inventory item has one, because the short name is what
// the game prints on the inventory tile. That cut leaves 4,137 and is exact, not a heuristic
// threshold. If a future wipe adds an item with no short name it will be missed — the printed
// count is the canary, same rule the gear catalog's per-type counts follow.
//
// FORMAT is a compact array of [id, name, shortName] triples rather than an object of objects:
// 285 KB against 354 KB, on a file the search needs on the first keystroke. shortName is omitted
// when it equals the name.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data', 'itemNames.json');

const SPT = 'https://raw.githubusercontent.com/sp-tarkov/server/master/project/assets/database';
const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

const NAME_KEY = /^([0-9a-f]{24}) Name$/;
const SHORT_KEY = /^([0-9a-f]{24}) ShortName$/;

async function main() {
  console.log('→ SPT locale (locales/global/en.json) …');
  const res = await fetch(`${SPT}/locales/global/en.json`, { headers: UA });
  if (!res.ok) throw new Error(`SPT locale HTTP ${res.status}`);
  const locale = await res.json();

  const names = new Map();
  const shorts = new Map();
  for (const [key, value] of Object.entries(locale)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const n = key.match(NAME_KEY);
    if (n) { names.set(n[1], value.trim()); continue; }
    const s = key.match(SHORT_KEY);
    if (s) shorts.set(s[1], value.trim());
  }
  console.log(`  ok — ${names.size} named template ids, ${shorts.size} with a short name`);

  const rows = [];
  let skipped = 0;
  for (const [id, name] of names) {
    const short = shorts.get(id);
    if (!short) { skipped += 1; continue; }   // a faction / map / org, not an item
    rows.push(short === name ? [id, name] : [id, name, short]);
  }
  rows.sort((a, b) => a[1].localeCompare(b[1]));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'sp-tarkov/server locales/global/en.json',
    sourceNote:
      'Every template id carrying both a Name and a ShortName. Entries without a ShortName are '
      + 'factions, maps and organisations rather than items, and are excluded — see the file '
      + 'header in scripts/fetchEftItemNames.mjs.',
    itemCount: rows.length,
    nonItemsSkipped: skipped,
    rows,
  };

  fs.writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`\nwrote ${path.relative(process.cwd(), OUT)} — ${rows.length} items, ${skipped} non-items skipped, ${kb} KB`);

  // Canary: this is the item the whole change came from. If SPT drops it, say so loudly rather
  // than silently shipping a table that cannot answer the question that prompted the file.
  const canary = rows.find(([, name]) => name === 'Aybolit mask');
  console.log(canary ? '  canary ok — "Aybolit mask" present' : '  ⚠ canary MISSING — "Aybolit mask" not in the locale');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
