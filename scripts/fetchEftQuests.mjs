// Regenerates src/pages/eftShopping/data/questSnapshot.json.
//
//   node scripts/fetchEftQuests.mjs          (or: npm run eft:quests)
//
// WHY THE WIKI AND NOT THE USUAL TWO SOURCES
// ------------------------------------------
// The hideout snapshot has two sources: BSG's own game files (via the SPT
// mirror) and tarkov.dev. Neither works for quests right now:
//
//   * tarkov.dev  — its GraphQL worker has been returning
//                   "GraphQL server unavailable" for days, and status.tarkov.dev
//                   itself 523s. It is the nicest shape by far; when it comes
//                   back it is worth adding as an enrichment layer here.
//   * SPT mirror  — templates/quests.json is complete and well-structured, but
//                   master last touched it 2025-03-17 for EFT 0.16.0. That is a
//                   whole year and several wipes stale. Quests are exactly the
//                   thing BSG reshuffles every wipe, so stale quest data is
//                   worse than none.
//
// The Fandom wiki is community-maintained, edited within minutes of a patch,
// and exposes wikitext through the MediaWiki API in 50-page batches. It is
// prose rather than a schema, so this file does the parsing. Every quest keeps
// its raw objective/requirement lines alongside the parsed fields, so a parse
// miss degrades to "shown verbatim" rather than to "silently absent".
//
// Item ids come from the SPT locale's name table. Those ids are BSG template
// ids and are stable across wipes, so an old locale still resolves any item
// that existed in 0.16.0 — which is every hideout item. Items added in a later
// wipe resolve to no id and are kept name-only with `unresolved: true`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'data');
// Two files on purpose. The index is what the hideout search needs on the very
// first keystroke, so it is imported eagerly; the prose (briefing, objectives,
// rewards, guide) is 4/5 of the bytes and is only ever read once you open a
// single quest, so it is fetched on demand. Shipping one 1.6 MB blob would put
// a megabyte of quest text in front of every page load for nothing.
const OUT_INDEX = path.join(DATA, 'questIndex.json');
const OUT_DETAIL = path.join(DATA, 'questDetail.json');

const WIKI = 'https://escapefromtarkov.fandom.com/api.php';
const SPT = 'https://raw.githubusercontent.com/sp-tarkov/server/master/project/assets/database';
const BATCH = 50;

const UA = { 'User-Agent': 'astral-project-eftsh (personal hideout planner)' };

// Wiki links that appear inside objective lines but are not items. Without this
// every "on [[Customs]]" would be read as a required item.
const NOT_ITEMS = new Set([
  'customs', 'woods', 'shoreline', 'interchange', 'reserve', 'factory', 'the lab',
  'lighthouse', 'streets of tarkov', 'ground zero', 'labyrinth', 'the labyrinth',
  'night factory', 'terminal', 'city',
  'prapor', 'therapist', 'fence', 'skier', 'peacekeeper', 'mechanic', 'ragman',
  'jaeger', 'lightkeeper', 'btr driver', 'ref',
  'scavs', 'scav', 'pmc', 'pmcs', 'raiders', 'rogues', 'cultists', 'bosses',
  'usec', 'bear', 'exp', 'found in raid', 'quests', 'hideout', 'skills',
  'level', 'roubles', 'dollars', 'euros', 'survived', 'extract', 'extraction',
  'the goons', 'boss', 'sniper scavs', 'bloodhounds', 'zryachiy', 'partisan',
  'escape from tarkov', 'trading', 'traders', 'flea market', 'stash',
  'kaban', 'kollontay', 'sanitar', 'shturman', 'reshala', 'killa', 'tagilla',
  'glukhar', 'birdeye', 'big pipe', 'knight', 'cultist priest',
  'black division', 'usd', 'drinks', 'medical', 'usec operative',
  'skill', 'quest', 'raid', 'labs', 'the lab access keycard holder',
]);

// Objective verbs that mean "you must physically hold this item".
const ITEM_VERB = /\b(find|hand over|handover|obtain|stash|deliver|locate and obtain|bring|provide|give|plant|place|mark)\b/i;

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function getJson(url, opts = {}) {
  const res = await fetch(url, { headers: UA, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// --------------------------------------------------------------------------
// Wiki plumbing
// --------------------------------------------------------------------------

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
  return out;
}

async function fetchWikitext(titles) {
  const u = new URL(WIKI);
  u.searchParams.set('action', 'query');
  u.searchParams.set('prop', 'revisions');
  u.searchParams.set('rvprop', 'content');
  u.searchParams.set('rvslots', 'main');
  u.searchParams.set('titles', titles.join('|'));
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  const d = await getJson(u);
  const out = new Map();
  for (const p of d.query.pages || []) {
    if (p.missing) continue;
    const text = p.revisions?.[0]?.slots?.main?.content;
    if (text) out.set(p.title, text);
  }
  return out;
}

// --------------------------------------------------------------------------
// Wikitext parsing
// --------------------------------------------------------------------------

/** Strips wiki/HTML markup down to readable text, keeping link *labels*. */
function plain(s) {
  return String(s)
    .replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[Ii]con\|[^}]*\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prose for the Guide section. The Guide is usually the LAST section on the
 * page, so everything the page ends with — the quest navbox, the category
 * footer, the interlanguage links, and the big "Related Quest Items" wikitable
 * — falls inside it and has to come back out before it reads as English.
 */
function cleanProse(s) {
  return plain(
    String(s)
      .replace(/^\{\|[\s\S]*?^\|\}/gm, '')      // wikitables
      .replace(/\{\{\s*Navbox[\s\S]*?\}\}/gi, '')
      .replace(/\[\[Category:[^\]]*\]\]/gi, '')
      .replace(/^\[\[[a-z-]{2,5}:[^\]]*\]\]$/gim, '') // interlanguage links
      .replace(/\{\{\s*(clear|stub|spoiler)\s*\}\}/gi, ''),
  );
}

/** The `{{Infobox quest|k = v|...}}` block, as a flat object. */
function parseInfobox(text) {
  const start = text.search(/\{\{\s*Infobox quest/i);
  if (start === -1) return {};
  let depth = 0;
  let end = start;
  for (let i = start; i < text.length; i += 1) {
    if (text.startsWith('{{', i)) { depth += 1; i += 1; } else if (text.startsWith('}}', i)) {
      depth -= 1; i += 1;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  const body = text.slice(start + 2, end - 2);
  const out = {};
  // Split on pipes that are not inside a nested template or a wiki link.
  let buf = '';
  let tpl = 0;
  let link = 0;
  const parts = [];
  for (let i = 0; i < body.length; i += 1) {
    if (body.startsWith('{{', i)) { tpl += 1; buf += '{{'; i += 1; continue; }
    if (body.startsWith('}}', i)) { tpl -= 1; buf += '}}'; i += 1; continue; }
    if (body.startsWith('[[', i)) { link += 1; buf += '[['; i += 1; continue; }
    if (body.startsWith(']]', i)) { link -= 1; buf += ']]'; i += 1; continue; }
    if (body[i] === '|' && tpl === 0 && link === 0) { parts.push(buf); buf = ''; continue; }
    buf += body[i];
  }
  parts.push(buf);
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    out[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
  }
  return out;
}

/** All `[[Page]]` / `[[Page|label]]` targets inside a chunk of wikitext. */
function linkTargets(s) {
  const out = [];
  const re = /\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]*))?\]\]/g;
  let m = re.exec(s);
  while (m) {
    out.push({ target: m[1].trim(), label: plain(m[2] ?? m[1]) });
    m = re.exec(s);
  }
  return out;
}

/**
 * Body of a `== Heading ==` section, up to the next heading of the same level.
 *
 * Done by index rather than one regex with a trailing lookahead: JavaScript has
 * no `\Z`, so the obvious `(?=^==[^=]|\Z)` silently degrades to "or a literal
 * Z" and truncates every section at its first capital Z. That cut "[[Ground
 * Zero]]" in half in the first run of this script.
 */
function section(text, name) {
  const open = new RegExp(`^==\\s*${name}\\s*==[ \\t]*$`, 'im');
  const m = text.match(open);
  if (!m) return '';
  const from = m.index + m[0].length;
  const rest = text.slice(from);
  const next = rest.search(/^==[^=]/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** Top-level `*` bullets of a section, markup stripped but links preserved. */
function bullets(body) {
  return body
    .split(/\r?\n/)
    .filter((l) => /^\*/.test(l.trim()))
    .map((l) => ({ depth: (l.match(/^\**/)[0] || '*').length, raw: l.replace(/^\**\s*/, '') }));
}

function parseMinLevel(reqBody, text) {
  const src = `${reqBody}\n${text.slice(0, 4000)}`;
  const m = src.match(/level\s+(\d+)\s+to (?:start|begin|unlock)/i)
    || src.match(/[Mm]ust be level\s+(\d+)/)
    || src.match(/[Rr]equires? level\s+(\d+)/);
  return m ? Number(m[1]) : null;
}

function parseLoyalty(reqBody) {
  const out = [];
  const re = /level\s+(\d+)\s+loyalty\s+with\s+\[\[([^|\]]+)/gi;
  let m = re.exec(reqBody);
  while (m) {
    out.push({ trader: m[2].trim(), level: Number(m[1]) });
    m = re.exec(reqBody);
  }
  return out;
}

/**
 * Item requirements from the Objectives section.
 *
 * "Find 3 X in raid" and "Hand over the 3 X" are the SAME three items written
 * twice, which is how the wiki phrases nearly every fetch quest — so counts are
 * taken as a max per item, never summed. Getting this wrong doubles the
 * requirement for roughly a third of all quests.
 */
function parseItems(objBody, resolveId, isQuestTitle) {
  const found = new Map();
  for (const { raw } of bullets(objBody)) {
    if (!ITEM_VERB.test(raw)) continue;
    const countMatch = raw.match(/\b(?:find|hand over|handover|obtain|stash|deliver|bring|provide|give)\b[^[\d]*(\d[\d,]*)/i);
    const count = countMatch ? Number(countMatch[1].replace(/,/g, '')) : 1;
    const fir = /found in raid|in raid/i.test(raw);
    for (const { target, label } of linkTargets(raw)) {
      const key = norm(target);
      if (!key || NOT_ITEMS.has(key)) continue;
      if (/^:?(category|file|image|template):/i.test(target)) continue;
      const id = resolveId(target) ?? resolveId(label);
      // Objective lines cross-link other quests ("as part of [[Setup]]") and
      // bosses. Neither is a thing you carry, and both otherwise survive the
      // verb test, so they are rejected by name.
      if (!id && isQuestTitle(target)) continue;
      // An unresolvable link on a line that also names a map/trader is usually
      // a place, not an item. Requiring the verb (above) plus a plausible name
      // keeps the false-positive rate low without dropping new-wipe items.
      if (!id && key.split(' ').length > 6) continue;
      const prev = found.get(key);
      if (prev) {
        prev.count = Math.max(prev.count, count);
        prev.foundInRaid = prev.foundInRaid || fir;
      } else {
        found.set(key, {
          itemId: id ?? null,
          name: target,
          count,
          foundInRaid: fir,
          unresolved: !id,
        });
      }
    }
  }
  return [...found.values()];
}

function splitLinkList(value) {
  if (!value) return [];
  return linkTargets(value).map((l) => l.target).filter(Boolean);
}

function parseQuest(title, text, resolveId, isQuestTitle) {
  const box = parseInfobox(text);
  const reqBody = section(text, 'Requirements');
  const objBody = section(text, 'Objectives');
  const rewBody = section(text, 'Rewards');
  const guide = section(text, 'Guide') || section(text, 'Notes');
  const dialogueBody = section(text, 'Dialogue');

  const quotes = [...dialogueBody.matchAll(/\{\{quote\|([\s\S]*?)\}\}/gi)].map((m) => plain(m[1]));

  return {
    id: norm(title).replace(/ /g, '-'),
    name: title,
    trader: splitLinkList(box['given by'])[0] ?? null,
    map: splitLinkList(box.location)[0] ?? null,
    minLevel: parseMinLevel(reqBody, text),
    loyalty: parseLoyalty(reqBody),
    previous: splitLinkList(box.previous),
    leadsTo: splitLinkList(box['leads to']),
    related: [...splitLinkList(box.related), ...splitLinkList(box.related2)],
    kappa: /yes/i.test(plain(box.reqkappa ?? '')),
    questNumber: box['quest number'] ? plain(box['quest number']) : null,
    // Raw lines are kept so a parse miss still shows the user the real text.
    requirements: bullets(reqBody).map((b) => plain(b.raw)).filter(Boolean),
    objectives: bullets(objBody).map((b) => ({ depth: b.depth, text: plain(b.raw) })).filter((o) => o.text),
    rewards: bullets(rewBody).map((b) => ({ depth: b.depth, text: plain(b.raw) })).filter((r) => r.text),
    items: parseItems(objBody, resolveId, isQuestTitle),
    guide: cleanProse(guide).slice(0, 2400) || null,
    briefing: quotes[0] ?? null,
    wikiUrl: `https://escapefromtarkov.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  };
}

// --------------------------------------------------------------------------

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
  const resolveId = (name) => byName.get(norm(name)) ?? null;
  console.log(`  ok — ${byName.size} item names`);

  console.log('→ quest list (wiki) …');
  const titles = await categoryMembers('Quests');
  console.log(`  ok — ${titles.length} quest pages`);

  const questTitles = new Set(titles.map(norm));
  const isQuestTitle = (name) => questTitles.has(norm(name));

  console.log('→ quest pages …');
  const quests = [];
  const failed = [];
  for (let i = 0; i < titles.length; i += BATCH) {
    const slice = titles.slice(i, i + BATCH);
    let pages;
    try {
      pages = await fetchWikitext(slice);
    } catch (err) {
      failed.push(...slice);
      console.warn(`  batch ${i / BATCH + 1} failed: ${err.message}`);
      continue;
    }
    for (const title of slice) {
      const text = pages.get(title);
      if (!text) { failed.push(title); continue; }
      try {
        quests.push(parseQuest(title, text, resolveId, isQuestTitle));
      } catch (err) {
        failed.push(title);
        console.warn(`  ${title}: ${err.message}`);
      }
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, titles.length)}/${titles.length}`);
  }
  process.stdout.write('\n');

  quests.sort((a, b) => a.name.localeCompare(b.name));

  const withItems = quests.filter((q) => q.items.length);
  const itemLinks = withItems.reduce((n, q) => n + q.items.length, 0);
  const unresolved = withItems.reduce((n, q) => n + q.items.filter((i) => i.unresolved).length, 0);

  const meta = {
    generatedAt: new Date().toISOString(),
    source: 'fandom-wiki',
    sourceNote:
      'Parsed from escapefromtarkov.fandom.com wikitext. tarkov.dev was down and the '
      + 'SPT mirror\'s quests.json is pinned to EFT 0.16.0 (2025-03-17), which is several wipes stale.',
    questCount: quests.length,
  };

  const INDEX_FIELDS = [
    'id', 'name', 'trader', 'map', 'minLevel', 'loyalty', 'previous', 'leadsTo',
    'related', 'kappa', 'questNumber', 'items', 'wikiUrl',
  ];
  const DETAIL_FIELDS = ['requirements', 'objectives', 'rewards', 'guide', 'briefing'];

  const pick = (q, fields) => Object.fromEntries(fields.map((f) => [f, q[f]]));

  const index = { ...meta, quests: quests.map((q) => pick(q, INDEX_FIELDS)), failed };
  const detail = {
    ...meta,
    // Keyed by quest id — the detail panel looks up exactly one at a time.
    quests: Object.fromEntries(quests.map((q) => [q.id, pick(q, DETAIL_FIELDS)])),
  };

  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(OUT_INDEX, JSON.stringify(index));
  fs.writeFileSync(OUT_DETAIL, JSON.stringify(detail));
  const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
  const rel = (f) => path.relative(path.join(HERE, '..'), f);

  console.log(
    `\nwrote ${rel(OUT_INDEX)}  (${kb(OUT_INDEX)} KB, eager)\n`
    + `      ${rel(OUT_DETAIL)}  (${kb(OUT_DETAIL)} KB, lazy)\n`
    + `  quests            ${quests.length}\n`
    + `  with item needs   ${withItems.length}\n`
    + `  item requirements ${itemLinks} (${unresolved} without a template id)\n`
    + `  with a min level  ${quests.filter((q) => q.minLevel).length}\n`
    + `  with a guide      ${quests.filter((q) => q.guide).length}\n`
    + `  failed pages      ${failed.length}${failed.length ? `: ${failed.slice(0, 5).join(', ')}` : ''}`,
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
