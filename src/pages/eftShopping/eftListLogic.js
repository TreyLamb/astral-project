// The user's own shopping list — pure data in, pure data out, same contract as
// eftHideoutLogic and eftQuestLogic so it can run inside a useMemo and be
// tested without a DOM.
//
// This is a DIFFERENT thing from the generated hideout list. That one is
// derived: it answers "what do my station targets imply?" and the user cannot
// add to it. This one is hand-built and answers "what am I actually looking
// for this raid?", which is the question you have in your head standing in
// front of a loot pile.

import questIndexData from './data/questIndex.json';
import ammoSnapshot from './data/ammoSnapshot.json';

export const LIST_KEYS = ['ongoing', 'raid', 'value'];

const norm = (s) => String(s ?? '').trim().toLowerCase();

let seq = 0;
export const uid = () => `e${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * Everything the picker can suggest.
 *
 * The hideout snapshot only carries the ~400 items some station wants, which is
 * a poor search pool for a list whose whole point is that YOU decide what goes
 * on it — a Crickent lighter is not a hideout item and would be unfindable.
 * Quest items add the rest of the real, id-bearing table, and the ammo snapshot
 * adds rounds, which are the single most likely thing on a raid list.
 *
 * Ammo has no BSG template id (it comes from eft-ammo.com, not the game files),
 * so those entries carry a null itemId and simply render without an icon.
 */
export function buildItemPool(items, {
  questIndex = questIndexData,
  ammo = ammoSnapshot,
} = {}) {
  const byId = new Map();
  const seenName = new Set();

  const push = (itemId, name, shortName, kind) => {
    if (!name) return;
    const key = itemId || `name:${norm(name)}`;
    if (byId.has(key)) return;
    if (!itemId && seenName.has(norm(name))) return;
    seenName.add(norm(name));
    byId.set(key, { key, itemId: itemId || null, name, shortName: shortName || '', kind });
  };

  for (const [itemId, item] of Object.entries(items || {})) {
    push(itemId, item?.name, item?.shortName, 'hideout');
  }
  for (const quest of questIndex?.quests || []) {
    for (const need of quest.items || []) push(need.itemId, need.name, '', 'quest');
  }
  for (const caliber of ammo?.calibers || []) {
    for (const round of caliber.rounds || []) {
      push(null, round.name, round.shortName, 'ammo');
    }
  }

  return [...byId.values()];
}

/**
 * Prefix matches first, then substring — typing "sal" should put Salewa above
 * "Physical Bitcoin" just because the latter happens to contain the letters.
 */
export function searchPool(pool, query, { limit = 12 } = {}) {
  const q = norm(query);
  if (q.length < 2) return [];

  const hits = [];
  for (const entry of pool) {
    const name = norm(entry.name);
    const short = norm(entry.shortName);
    const at = name.indexOf(q);
    const shortAt = short ? short.indexOf(q) : -1;
    if (at === -1 && shortAt === -1) continue;
    hits.push({ entry, score: (at === 0 || shortAt === 0) ? 0 : 1 });
  }

  hits.sort((a, b) => a.score - b.score
    || a.entry.name.length - b.entry.name.length
    || a.entry.name.localeCompare(b.entry.name));

  return hits.slice(0, limit).map((h) => h.entry);
}

export function newEntry({ itemId = null, name, need = 1, have = 0, note = '', value = '' } = {}) {
  return { id: uid(), itemId: itemId || null, name: String(name || '').trim(), need, have, note, value };
}

/** Two rows for the same item is never what you meant, so adding again bumps
 *  the count instead. Free-text rows match on their name. */
export function addToList(list, entry) {
  const rows = list || [];
  const match = rows.findIndex((r) => (
    entry.itemId ? r.itemId === entry.itemId : (!r.itemId && norm(r.name) === norm(entry.name))
  ));
  if (match === -1) return [...rows, newEntry(entry)];
  return rows.map((r, i) => (i === match ? { ...r, need: (r.need || 0) + (entry.need ?? 1) } : r));
}

export function updateEntry(list, id, patch) {
  return (list || []).map((r) => (r.id === id ? { ...r, ...patch } : r));
}

export function removeEntry(list, id) {
  return (list || []).filter((r) => r.id !== id);
}

/** `have` is clamped at 0 but deliberately NOT at `need` — overshooting is
 *  real information ("I've got 3 of the 2 I wanted"), not an error. */
export function setHave(list, id, n) {
  return updateEntry(list, id, { have: Math.max(0, Math.floor(Number(n) || 0)) });
}

export function setNeed(list, id, n) {
  return updateEntry(list, id, { need: Math.max(1, Math.floor(Number(n) || 1)) });
}

export function listTotals(list) {
  const rows = list || [];
  const done = rows.filter((r) => (r.have || 0) >= (r.need || 1)).length;
  return {
    rows: rows.length,
    done,
    outstanding: rows.length - done,
    unitsShort: rows.reduce((n, r) => n + Math.max(0, (r.need || 1) - (r.have || 0)), 0),
  };
}

export function listAsText(title, list) {
  const lines = [title, ''];
  for (const r of list || []) {
    const short = Math.max(0, (r.need || 1) - (r.have || 0));
    lines.push(`${short ? String(short).padStart(3) : '  ✓'} x ${r.name}${r.note ? `   — ${r.note}` : ''}`);
  }
  return lines.join('\n');
}
