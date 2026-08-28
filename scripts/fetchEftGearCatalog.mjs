// Regenerates src/pages/eftShopping/data/gearCatalog.json.
//
//   node scripts/fetchEftGearCatalog.mjs          (or: npm run eft:gear)
//
// WHAT THIS IS FOR
// -----------------
// The Item Uses tab (eftItemUses.js) needs to tag wearable/protective gear
// (body armor, plates, backpacks, glasses, headphones, helmets, rigs) with an
// "Armor" use even when an item has zero quest/craft/barter/hideout ties —
// that's the whole point of the tab surfacing e.g. a pair of useless-looking
// sunglasses as "still armor". Nothing else in this codebase's committed data
// carries that classification: hideoutSnapshot.json's items are only ever the
// ~400 things some hideout requirement points at, and every one of them has
// `types: []` today (only a live tarkov.dev fetch ever populates that field).
// This is deliberately NOT a full item catalog — just these 7 gear types.
//
// SOURCE — tried in this order
// -----------------------------
//   1. tarkov.dev's `items(types: [...])` query (see gearQuery() in
//      eftNormalize.js) — the real shape, includes numeric armorClass. Down
//      as of this writing (same outage as everywhere else in this sub-app).
//   2. SPT mirror's templates/items.json — ATTEMPTED AND ABANDONED. It carries
//      real per-item slot data and would be a legitimate source (equipment
//      slot types don't reshuffle per wipe the way quests/barters do), but
//      it's an 18 MB Git LFS object and this repo's LFS bandwidth quota is
//      exhausted: both raw.githubusercontent.com (133-byte pointer, expected)
//      AND media.githubusercontent.com (404, not the expected pointer-bypass)
//      fail. Confirmed via direct probe, not assumed.
//   3. Fandom wiki categories (what this script actually uses offline) — one
//      categorymembers list per gear type, same MediaWiki API this sub-app
//      already uses for quests and barters. Item ids resolve through the same
//      SPT locale name table (locales/global/en.json — plain JSON, NOT the
//      LFS-blocked items.json, so this one path is unaffected by problem #2).
//
// ⚠ CATEGORY-NAME MAPPING IS PROVISIONAL. These were found by probing search
// results this session, not from an index of the wiki's real category tree —
// spot-check the printed per-type counts after every run (a type dropping to
// 0 means the wiki renamed/restructured the category, not that the gear
// disappeared from the game). No wiki category was found for the catch-all
// "wearable" ItemType (face covers, misc worn items) — it's left out rather
// than guessed at.
//
// armorClass is left null on every wiki-sourced row: getting it means opening
// every item's own infobox (300+ page fetches) and isn't needed for the tab's
// core "is this gear at all" tag. Wire it up once tarkov.dev is reachable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gearQuery, normalizeItem, GEAR_TYPES } from '../src/pages/eftShopping/eftNormalize.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data');
const OUT = path.join(DATA, 'gearCatalog.json');

const WIKI = 'https://escapefromtarkov.fandom.com/api.php';
const SPT = 'https://raw.githubusercontent.com/sp-tarkov/server/master/project/assets/database';
const GRAPHQL = 'https://api.tarkov.dev/graphql';

const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function getJson(url, opts = {}) {
  const res = await fetch(url, { headers: UA, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function gql(query) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...UA },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`tarkov.dev HTTP ${res.status}: ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`tarkov.dev GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);
  return json.data;
}

// Wiki Category: page per gear type — see the provisional-mapping warning above.
const CATEGORY_BY_TYPE = {
  armor: 'Armor_vests',
  armorPlate: 'Armor_plates',
  backpack: 'Backpacks',
  glasses: 'Eyewear',
  headphones: 'Earpieces',
  helmet: 'Headwear',
  rig: 'Chest_rigs',
};

async function categoryMembers(category) {
  const out = [];
  let cont = null;
  do {
    const u = new URL(WIKI);
    u.searchParams.set('action', 'query');
    u.searchParams.set('list', 'categorymembers');
    u.searchParams.set('cmtitle', `Category:${category}`);
    u.searchParams.set('cmlimit', '500');
    u.searchParams.set('format', 'json');
    u.searchParams.set('formatversion', '2');
    if (cont) u.searchParams.set('cmcontinue', cont);
    const d = await getJson(u);
    out.push(...d.query.categorymembers.filter((m) => m.ns === 0).map((m) => m.title));
    cont = d.continue?.cmcontinue ?? null;
  } while (cont);
  // A category page sometimes lists itself (tagged with its own category) —
  // that's the taxonomy node, not an item.
  return out.filter((t) => norm(t) !== norm(category.replace(/_/g, ' ')));
}

async function fromTarkovDev() {
  console.log('→ tarkov.dev gearQuery …');
  const data = await gql(gearQuery('regular'));
  const rows = data.items || [];
  if (!rows.length) throw new Error('empty items list');
  const items = {};
  for (const raw of rows) {
    const n = normalizeItem(raw);
    const types = (raw.types || []).filter((t) => GEAR_TYPES.includes(t));
    if (!types.length) continue;
    items[n.id] = {
      id: n.id, name: n.name, shortName: n.shortName, types,
      armorClass: raw.properties?.class ?? null,
    };
  }
  return { items, note: 'tarkov.dev items(types: [...]) query, live.' };
}

async function fromWikiCategories() {
  console.log('→ item name table (SPT locale, for template ids) …');
  const locale = await getJson(`${SPT}/locales/global/en.json`);
  const byName = new Map();
  for (const [key, value] of Object.entries(locale)) {
    const m = key.match(/^([0-9a-f]{24}) Name$/);
    if (!m || typeof value !== 'string' || !value.trim()) continue;
    const k = norm(value);
    if (!byName.has(k)) byName.set(k, m[1]);
  }
  console.log(`  ok — ${byName.size} item names`);

  const items = {};
  const unresolvedNames = new Set();
  for (const [type, category] of Object.entries(CATEGORY_BY_TYPE)) {
    const titles = await categoryMembers(category);
    let resolved = 0;
    for (const title of titles) {
      const id = byName.get(norm(title));
      if (!id) { unresolvedNames.add(title); continue; }
      resolved += 1;
      if (!items[id]) items[id] = { id, name: title, shortName: null, types: [], armorClass: null };
      if (!items[id].types.includes(type)) items[id].types.push(type);
    }
    console.log(`  ${type.padEnd(11)} Category:${category.padEnd(14)} ${titles.length} pages, ${resolved} resolved`);
  }

  return {
    items,
    unresolvedNames: [...unresolvedNames].sort(),
    note:
      "Wiki categories (escapefromtarkov.fandom.com), because SPT's templates/items.json is "
      + "Git-LFS and this repo's LFS quota is exhausted, and tarkov.dev's own item-types query "
      + 'is down. Category-name-to-ItemType mapping is provisional — see the file header comment.',
  };
}

async function main() {
  let items;
  let source;
  let note;
  let unresolvedNames = [];
  try {
    ({ items, note } = await fromTarkovDev());
    source = 'tarkov.dev';
  } catch (err) {
    console.warn(`  tarkov.dev unavailable (${err.message}) — falling back to wiki categories`);
    ({ items, note, unresolvedNames } = await fromWikiCategories());
    source = 'fandom-wiki';
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source,
    sourceNote: note,
    itemCount: Object.keys(items).length,
    items,
    unresolvedNames,
  };

  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  const rel = path.relative(path.join(HERE, '..'), OUT);

  const byType = {};
  for (const it of Object.values(items)) for (const t of it.types) byType[t] = (byType[t] || 0) + 1;

  console.log(
    `\nwrote ${rel}  (${kb} KB, source: ${source})\n`
    + `  items          ${Object.keys(items).length}\n`
    + `  by type        ${JSON.stringify(byType)}\n`
    + `  unresolved     ${unresolvedNames.length}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
