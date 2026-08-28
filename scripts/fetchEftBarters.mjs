// Regenerates src/pages/eftShopping/data/barterSnapshot.json.
//
//   node scripts/fetchEftBarters.mjs          (or: npm run eft:barters)
//
// WHY THE WIKI AND NOT tarkov.dev
// --------------------------------
// tarkov.dev's schema has a real `barters(gameMode): [Barter]` query — this
// is the nicest shape by far and worth switching to first once it's back. But
// as of this writing its GraphQL worker returns "GraphQL server unavailable"
// even for a trivial query. And barters are exactly the kind of data BSG
// reshuffles every wipe (same reason quests moved to the wiki — see
// fetchEftQuests.mjs) — so this needs periodic re-scraping REGARDLESS of
// whether the API comes back. Re-run this every wipe.
//
// The Fandom wiki's "Barter trades" page is one page, community-maintained,
// with one wikitable per trader. Every row is 5 cells once split on the
// table's own `!`-prefixed cell markers: input(s) -> arrow -> trader/loyalty
// -> arrow -> output. A barter can need more than one distinct item — those
// rows join their ingredient groups with `<br/>+<br/>` inside the input cell.
// A few rows are seasonal-availability notices (`|colspan=6|{{Seasonal
// change|...}}`) rather than real trades; those don't have 5 cells and are
// skipped rather than guessed at.
//
// Item ids come from the same SPT locale name table fetchEftQuests.mjs uses
// (BSG template ids, stable across wipes for anything that existed in
// 0.16.0). A barter naming a newer item ships name-only with itemId: null,
// same degrade-gracefully contract as quest items.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugName } from '../src/pages/eftShopping/eftNormalize.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data');
const OUT = path.join(DATA, 'barterSnapshot.json');

const WIKI = 'https://escapefromtarkov.fandom.com/api.php';
const SPT = 'https://raw.githubusercontent.com/sp-tarkov/server/master/project/assets/database';
const PAGE = 'Barter trades';

const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function getJson(url, opts = {}) {
  const res = await fetch(url, { headers: UA, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** All `[[Page]]` / `[[Page|label]]` targets inside a chunk of wikitext. */
function linkTargets(s) {
  const out = [];
  const re = /\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]*))?\]\]/g;
  let m = re.exec(s);
  while (m) {
    out.push({ target: m[1].trim(), label: (m[2] ?? m[1]).trim() });
    m = re.exec(s);
  }
  return out;
}

/** Strips the `[[File:...]]` icon link out of a cell, leaving the text link + count. */
const stripFileLink = (s) => s.replace(/\[\[File:[^\]]*\]\]/gi, '');

/** One `x2` / `×2` style count in a cell; defaults to 1 (no count shown = 1). */
function parseCount(s) {
  const m = s.match(/[x×]\s*(\d[\d,]*)/i);
  return m ? Number(m[1].replace(/,/g, '')) : 1;
}

/**
 * One `[[File:...]] xN<br/>[[Item]]` group -> {name, count}, or null if there's
 * no real link. The count MUST be read only from the text before the item's
 * own wikilink — plenty of item names embed an "xNN" themselves (calibers like
 * "5.45x39"), and matching the whole group misreads that as the barter count.
 */
function parseItemGroup(group, resolveId) {
  const stripped = stripFileLink(group);
  const linkStart = stripped.indexOf('[[');
  const countText = linkStart === -1 ? stripped : stripped.slice(0, linkStart);
  const links = linkTargets(stripped).filter((l) => !/^:?(category|file|image|template):/i.test(l.target));
  if (!links.length) return null;
  const { target, label } = links[0];
  // A pipe label sometimes carries a real barter condition the bare page name
  // doesn't ("Dogtag ≥ Lvl 39" vs "Dogtag ≥ Lvl 10, USEC" both link to the
  // same "Dogtag" page) — prefer it for display so two such rows don't render
  // as duplicates, but resolve the id from the actual page name.
  return { itemId: resolveId(target), name: label || target, count: parseCount(countText) };
}

/** The input cell: one or more ingredient groups joined by `<br/>+<br/>`. */
function parseInputCell(cell, resolveId) {
  return cell
    .split(/<br\s*\/?>\s*\+\s*<br\s*\/?>/i)
    .map((g) => parseItemGroup(g, resolveId))
    .filter(Boolean);
}

/** The trader/loyalty cell: link target is the trader, `LLn` gives the level. */
function parseTraderCell(cell) {
  const links = linkTargets(stripFileLink(cell));
  const trader = links[0]?.target ?? null;
  const llText = links.map((l) => l.label).join(' ');
  const m = llText.match(/LL\s*(\d+)/i) || cell.match(/LL\s*(\d+)/i);
  return { trader, level: m ? Number(m[1]) : null };
}

/** Splits a `{|...|}` wikitable body into its `|-`-separated rows' raw text. */
function tableRows(tableBody) {
  return tableBody.split(/\n\|-/).slice(1);
}

/** A row's cells, using the table's own `!`-prefixed cell markers. */
function rowCells(row) {
  return (`!${row.trim()}`).split(/\n!/).map((c) => c.trim()).filter(Boolean);
}

function parseTraderSection(name, body, resolveId, failed) {
  const tableMatch = body.match(/\{\|[\s\S]*?\n\|\}/);
  if (!tableMatch) { failed.push(name); return []; }

  const out = [];
  let i = 0;
  for (const row of tableRows(tableMatch[0])) {
    const cells = rowCells(row);
    // A real trade row is exactly [input, arrow, trader, arrow, output]. A
    // handful of rows are seasonal-availability notices with one colspan
    // cell instead — not a trade, so they're skipped rather than guessed at.
    if (cells.length !== 5) continue;
    const give = parseInputCell(cells[0], resolveId);
    const { trader, level } = parseTraderCell(cells[2]);
    const get = parseItemGroup(cells[4], resolveId);
    if (!give.length || !trader || !level || !get) continue;
    out.push({
      id: slugName(`${name}-ll${level}-${get.name}-${i}`),
      trader,
      level,
      give,
      get,
    });
    i += 1;
  }
  return out;
}

async function main() {
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

  const unresolvedItemNames = new Set();
  const resolveId = (name) => {
    const id = byName.get(norm(name)) ?? null;
    if (!id) unresolvedItemNames.add(name);
    return id;
  };

  console.log(`→ "${PAGE}" (wiki) …`);
  const u = new URL(WIKI);
  u.searchParams.set('action', 'parse');
  u.searchParams.set('page', PAGE);
  u.searchParams.set('prop', 'wikitext');
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  const d = await getJson(u);
  const wikitext = d.parse?.wikitext;
  if (!wikitext) throw new Error('no wikitext returned for Barter trades page');
  console.log(`  ok — ${wikitext.length} chars`);

  const sections = wikitext.split(/^===\s*([^=]+?)\s*===$/m);
  const failed = [];
  const barters = [];
  // sections alternates [prefix, name1, body1, name2, body2, ...]
  for (let i = 1; i < sections.length; i += 2) {
    const name = sections[i].trim();
    const body = sections[i + 1];
    const rows = parseTraderSection(name, body, resolveId, failed);
    barters.push(...rows);
    console.log(`  ${name.padEnd(12)} ${rows.length} trades`);
  }

  const unresolved = barters.reduce(
    (n, b) => n + b.give.filter((g) => !g.itemId).length + (b.get.itemId ? 0 : 1),
    0,
  );

  const out = {
    generatedAt: new Date().toISOString(),
    source: 'fandom-wiki',
    sourceNote:
      "Parsed from escapefromtarkov.fandom.com/wiki/Barter_trades. tarkov.dev's own "
      + '`barters` query is down, and barters are wipe-shuffled trader data the same way '
      + 'quests are — this needs periodic re-scraping every wipe regardless of API status.',
    barterCount: barters.length,
    barters,
    unresolvedItemNames: [...unresolvedItemNames].sort(),
    failed,
  };

  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  const rel = path.relative(path.join(HERE, '..'), OUT);

  console.log(
    `\nwrote ${rel}  (${kb} KB)\n`
    + `  barters             ${barters.length}\n`
    + `  multi-input barters ${barters.filter((b) => b.give.length > 1).length}\n`
    + `  unresolved item refs ${unresolved} (${unresolvedItemNames.size} distinct names)\n`
    + `  failed sections      ${failed.length}${failed.length ? `: ${failed.join(', ')}` : ''}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
