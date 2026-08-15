// Pure quest maths. Same contract as eftHideoutLogic: plain data in, plain data
// out, no React and no storage, so it is cheap enough to run inside a useMemo
// and testable without a DOM.
//
// The data behind it is scraped from the Fandom wiki rather than taken from
// tarkov.dev or the SPT mirror — see scripts/fetchEftQuests.mjs for why (short
// version: tarkov.dev is down, SPT's quest table is pinned to a 2025 build).
// Because it is parsed prose, every quest keeps its raw lines too, and anything
// the parser could not resolve to a BSG template id is flagged rather than
// dropped.

import questIndexData from './data/questIndex.json';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * @returns {{
 *   quests: object[], byId: Map, byName: Map, byItemId: Map,
 *   meta: { generatedAt: string, source: string, sourceNote: string, questCount: number },
 * }}
 */
export function buildQuestIndex(snapshot = questIndexData) {
  const quests = snapshot?.quests || [];
  const byId = new Map();
  const byName = new Map();
  const byItemId = new Map();

  for (const quest of quests) {
    byId.set(quest.id, quest);
    byName.set(norm(quest.name), quest);
  }

  for (const quest of quests) {
    for (const need of quest.items || []) {
      const row = { questId: quest.id, count: need.count, foundInRaid: !!need.foundInRaid };
      // Items added in a wipe after the locale dump resolve to no template id.
      // They are keyed by name instead so the lookup still works — the only
      // thing lost is the cross-link to the hideout, which by definition has no
      // requirement for an item it has never heard of.
      const key = need.itemId || `name:${String(need.name).toLowerCase()}`;
      if (!byItemId.has(key)) byItemId.set(key, []);
      byItemId.get(key).push(row);
    }
  }

  return {
    quests,
    byId,
    byName,
    byItemId,
    meta: {
      generatedAt: snapshot?.generatedAt ?? null,
      source: snapshot?.source ?? 'unknown',
      sourceNote: snapshot?.sourceNote ?? '',
      questCount: quests.length,
    },
  };
}

/** Resolves a wiki link target ("The Extortionist") to the quest it names. */
export const questByName = (index, name) => index.byName.get(norm(name)) ?? null;

export const isQuestDone = (done, questId) =>
  (done instanceof Set ? done.has(questId) : (done || []).includes(questId));

/** Toggles one quest in the persisted done-list, returning a new array. */
export function toggleQuestDone(done, questId) {
  const list = done || [];
  return list.includes(questId) ? list.filter((id) => id !== questId) : [...list, questId];
}

/**
 * Every quest that wants `itemId`, split by whether you have finished it.
 *
 * The counts are the point of the whole feature: `remaining` is how many of
 * your outstanding quests still want this item, which is the number that
 * decides whether it is safe to sell. `needRemaining` is how many of the item
 * those quests want between them.
 */
export function questNeedsForItem(index, itemId, done = []) {
  const doneSet = done instanceof Set ? done : new Set(done || []);
  const raw = index.byItemId.get(itemId) || [];

  const rows = raw
    .map(({ questId, count, foundInRaid }) => {
      const quest = index.byId.get(questId);
      if (!quest) return null;
      return { quest, count, foundInRaid, complete: doneSet.has(questId) };
    })
    .filter(Boolean)
    // Outstanding first, then the ones you can actually start soonest.
    .sort((a, b) => Number(a.complete) - Number(b.complete)
      || (a.quest.minLevel ?? 99) - (b.quest.minLevel ?? 99)
      || a.quest.name.localeCompare(b.quest.name));

  const doneRows = rows.filter((r) => r.complete);
  const openRows = rows.filter((r) => !r.complete);

  return {
    rows,
    total: rows.length,
    done: doneRows.length,
    remaining: openRows.length,
    needTotal: rows.reduce((n, r) => n + r.count, 0),
    needRemaining: openRows.reduce((n, r) => n + r.count, 0),
    firRemaining: openRows.some((r) => r.foundInRaid),
    // Lowest level gate among the quests still open — "you won't need this for
    // a while" is different information from "you need this now".
    nextLevel: openRows.reduce(
      (lo, r) => (r.quest.minLevel && (lo === null || r.quest.minLevel < lo) ? r.quest.minLevel : lo),
      null,
    ),
  };
}

/** Item needs of one quest, with names resolved through the hideout item table. */
export function questItems(quest, items = {}) {
  return (quest.items || []).map((need) => ({
    ...need,
    name: (need.itemId && items[need.itemId]?.name) || need.name,
  }));
}

/**
 * The unlock chain above a quest and the quests it opens up below it.
 *
 * Walks `previous` recursively so the panel can show the whole path back to a
 * trader's first quest, not just the immediate parent. Guarded on a visited set
 * because the wiki's previous/leads-to links are hand-maintained and do
 * occasionally form a loop.
 */
export function questTree(index, questId, maxDepth = 6) {
  const root = index.byId.get(questId);
  if (!root) return null;

  const climb = (quest, depth, seen) => {
    if (depth >= maxDepth) return [];
    return (quest.previous || [])
      .map((name) => questByName(index, name))
      .filter((q) => q && !seen.has(q.id))
      .map((q) => {
        const next = new Set(seen).add(q.id);
        return { quest: q, previous: climb(q, depth + 1, next) };
      });
  };

  return {
    quest: root,
    previous: climb(root, 0, new Set([root.id])),
    leadsTo: (root.leadsTo || []).map((name) => questByName(index, name)).filter(Boolean),
    // Unresolvable link targets are kept so the panel can still name them.
    leadsToUnknown: (root.leadsTo || []).filter((name) => !questByName(index, name)),
    previousUnknown: (root.previous || []).filter((name) => !questByName(index, name)),
  };
}

/** Flat list of every prerequisite id above a quest, nearest first. */
export function prerequisiteIds(index, questId, maxDepth = 12) {
  const out = [];
  const seen = new Set([questId]);
  let frontier = [questId];
  for (let depth = 0; depth < maxDepth && frontier.length; depth += 1) {
    const next = [];
    for (const id of frontier) {
      const quest = index.byId.get(id);
      for (const name of quest?.previous || []) {
        const prev = questByName(index, name);
        if (!prev || seen.has(prev.id)) continue;
        seen.add(prev.id);
        out.push(prev.id);
        next.push(prev.id);
      }
    }
    frontier = next;
  }
  return out;
}

/**
 * How a quest is unlocked, as display-ready lines: player level, trader
 * loyalty, and the quests that must come first.
 */
export function questGate(index, quest) {
  const lines = [];
  if (quest.minLevel) lines.push({ kind: 'level', text: `Player level ${quest.minLevel}` });
  for (const l of quest.loyalty || []) {
    lines.push({ kind: 'loyalty', text: `${l.trader} LL${l.level}` });
  }
  for (const name of quest.previous || []) {
    lines.push({ kind: 'quest', text: name, quest: questByName(index, name) });
  }
  if (!lines.length) lines.push({ kind: 'none', text: 'Available from the start' });
  return lines;
}

/** Progress across every quest a trader gives. */
export function traderProgress(index, done = []) {
  const doneSet = done instanceof Set ? done : new Set(done || []);
  const out = new Map();
  for (const quest of index.quests) {
    const key = quest.trader || 'Unknown';
    if (!out.has(key)) out.set(key, { trader: key, total: 0, done: 0 });
    const row = out.get(key);
    row.total += 1;
    if (doneSet.has(quest.id)) row.done += 1;
  }
  return [...out.values()].sort((a, b) => a.trader.localeCompare(b.trader));
}

/** Name/short-name search over quests, for the quest browser. */
export function searchQuests(index, query, limit = 30) {
  const q = norm(query);
  if (q.length < 2) return [];
  return index.quests
    .filter((quest) => norm(quest.name).includes(q) || norm(quest.trader).includes(q))
    .sort((a, b) => norm(a.name).indexOf(q) - norm(b.name).indexOf(q)
      || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// Detail (objectives, rewards, guide, briefing) is 4/5 of the quest bytes and
// is only ever needed one quest at a time, so it is fetched on first use rather
// than bundled into the initial load.
let detailPromise = null;

export function loadQuestDetail() {
  if (!detailPromise) {
    detailPromise = import('./data/questDetail.json')
      .then((mod) => mod.default?.quests ?? mod.quests ?? {})
      .catch(() => ({}));
  }
  return detailPromise;
}
