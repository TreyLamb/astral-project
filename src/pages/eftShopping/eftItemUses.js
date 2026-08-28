// Unified "what is this item used for" index.
//
// Before this, the answer was split across three places and one silent
// duplicate: quest-need lookup lives inside HideoutView (via QuestLookup.jsx,
// which isn't even its own route), craft usage lives on the separate Craft
// Tree tab, and FrugalView.jsx has its own hand-rolled reverse-craft index
// that re-derives exactly what eftCraftGraph's `byInput` already knows. There
// was also no barter data anywhere, and no way to tell a piece of gear
// (glasses, a helmet, a rig) has intrinsic armor value even with zero
// quest/craft/barter ties.
//
// This module answers all of it in one pass: hideout construction, crafting
// (as an ingredient OR a tool), quests (turn-in / found-in-raid), barter
// trades (the item you PAY — the reward side never gets a Barter tag from
// that same trade), and gear/armor classification. Same contract as
// eftQuestLogic.js / eftCraftGraph.js: plain data in, plain data out, no
// React, no storage — cheap inside a useMemo and testable without a DOM.

import { itemReqsOf } from './eftHideoutLogic';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Every item is keyed by its BSG template id when known, falling back to a
 * normalized-name key otherwise — same rule eftListLogic.js's item pool
 * already uses, so an id-bearing reference and a name-only reference to the
 * same item collapse onto one record regardless of which source saw it first.
 */
const keyFor = (itemId, name) => itemId || `name:${norm(name)}`;

function ensure(byKey, itemId, name, shortName, item) {
  if (!name && !itemId) return null;
  const key = keyFor(itemId, name);
  let rec = byKey.get(key);
  if (!rec) {
    rec = {
      key,
      itemId: itemId || null,
      name: name || item?.name || key,
      shortName: shortName || item?.shortName || '',
      item: item || null,
      uses: {
        hideout: [], craft: [], quest: [], barter: [], gear: null,
      },
      tags: [],
    };
    byKey.set(key, rec);
  }
  // A source seen later can fill in what an earlier, name-only sighting of
  // the same key couldn't provide.
  if (!rec.itemId && itemId) rec.itemId = itemId;
  if (!rec.item && item) rec.item = item;
  if (!rec.shortName && shortName) rec.shortName = shortName;
  return rec;
}

/**
 * @param {object} args
 * @param {object} args.hideoutData    the loaded hideout snapshot ({stations, items})
 * @param {object} args.questIndex     from buildQuestIndex() in eftQuestLogic.js
 * @param {object} args.craftIndex     from buildCraftIndex() in eftCraftGraph.js
 * @param {object} args.barterData     barterSnapshot.json shape ({barters: []})
 * @param {object} args.gearCatalog    gearCatalog.json shape ({items: {}})
 * @returns {{ byKey: Map, all: object[] }}
 */
export function buildItemUsesIndex({
  hideoutData, questIndex, craftIndex, barterData, gearCatalog,
} = {}) {
  const byKey = new Map();
  const items = hideoutData?.items || {};

  // ---- 1. Build the item universe (every source contributes) ----

  for (const [itemId, item] of Object.entries(items)) {
    ensure(byKey, itemId, item.name, item.shortName, item);
  }
  for (const quest of questIndex?.quests || []) {
    for (const need of quest.items || []) {
      ensure(byKey, need.itemId, need.name, '', need.itemId ? items[need.itemId] : null);
    }
  }
  for (const craft of craftIndex?.crafts || []) {
    for (const row of [...craft.inputs, ...craft.tools, ...craft.outputs]) {
      ensure(byKey, row.itemId, row.name, '', items[row.itemId]);
    }
  }
  for (const barter of barterData?.barters || []) {
    for (const g of barter.give || []) ensure(byKey, g.itemId, g.name, '', g.itemId ? items[g.itemId] : null);
    if (barter.get) ensure(byKey, barter.get.itemId, barter.get.name, '', barter.get.itemId ? items[barter.get.itemId] : null);
  }
  // The only source that can add an item with zero other uses (a piece of
  // gear nothing else references) — see the sunglasses example in the
  // EFT Shopping plan doc.
  for (const [itemId, gear] of Object.entries(gearCatalog?.items || {})) {
    ensure(byKey, itemId, gear.name, gear.shortName, items[itemId]);
  }

  // ---- 2. Populate each bucket ----

  // Hideout: a flat "does the hideout ever want this" scan. Deliberately NOT
  // scope/target-aware like eftHideoutLogic's itemNeeds() — this tab answers
  // "is this connected to anything", not "what do my current targets imply".
  for (const station of hideoutData?.stations || []) {
    for (const level of station.levels || []) {
      for (const req of itemReqsOf(level)) {
        const rec = byKey.get(keyFor(req.itemId, null));
        if (!rec) continue;
        rec.uses.hideout.push({
          stationName: station.name,
          stationKey: station.normalizedName,
          level: level.level,
          count: req.count,
          foundInRaid: !!req.foundInRaid,
        });
      }
    }
  }

  // Craft: inputs AND tools both count as "used to craft"; role tells them
  // apart in the UI (a tool is required but not consumed).
  for (const craft of craftIndex?.crafts || []) {
    for (const row of craft.inputs) {
      const rec = byKey.get(keyFor(row.itemId, row.name));
      if (!rec) continue;
      for (const out of craft.outputs) {
        rec.uses.craft.push({
          stationName: craft.stationName, craftId: craft.id, level: craft.level,
          role: 'input', count: row.count ?? null,
          outputName: out.name, outputItemId: out.itemId,
        });
      }
    }
    for (const row of craft.tools) {
      const rec = byKey.get(keyFor(row.itemId, row.name));
      if (!rec) continue;
      for (const out of craft.outputs) {
        rec.uses.craft.push({
          stationName: craft.stationName, craftId: craft.id, level: craft.level,
          role: 'tool', count: row.count ?? null,
          outputName: out.name, outputItemId: out.itemId,
        });
      }
    }
  }

  // Quest: questIndex.byItemId is already keyed id-or-name, so this works
  // unmodified for both resolved and name-fallback quest items.
  for (const [key, rows] of questIndex?.byItemId || new Map()) {
    const rec = byKey.get(key);
    if (!rec) continue;
    for (const row of rows) {
      const quest = questIndex.byId.get(row.questId);
      if (!quest) continue;
      rec.uses.quest.push({
        questId: row.questId, questName: quest.name,
        count: row.count, foundInRaid: !!row.foundInRaid,
      });
    }
  }

  // Barter: the GIVE side only. Paying with an item is a "use" of it; getting
  // it back as a reward is not — the reward item's own uses come from
  // wherever else it's referenced.
  for (const barter of barterData?.barters || []) {
    for (const g of barter.give || []) {
      const rec = byKey.get(keyFor(g.itemId, g.name));
      if (!rec) continue;
      rec.uses.barter.push({
        barterId: barter.id, trader: barter.trader, level: barter.level,
        count: g.count, getName: barter.get?.name ?? null, getItemId: barter.get?.itemId ?? null,
      });
    }
  }

  // Gear: direct lookup — itemId-keyed only, so a name-fallback-key record
  // can never pick up a gear tag (the catalog has no name-only entries).
  for (const [itemId, gear] of Object.entries(gearCatalog?.items || {})) {
    const rec = byKey.get(itemId);
    if (!rec) continue;
    rec.uses.gear = { types: gear.types || [], armorClass: gear.armorClass ?? null };
  }

  // ---- 3. Tags + drop anything that isn't actually used for anything ----

  for (const rec of byKey.values()) {
    const tags = [];
    if (rec.uses.hideout.length) tags.push('Hideout');
    if (rec.uses.craft.length) tags.push('Craft');
    if (rec.uses.quest.length) tags.push('Quest');
    if (rec.uses.barter.length) tags.push('Barter');
    if (rec.uses.gear) tags.push('Armor');
    rec.tags = tags;
  }

  const finalByKey = new Map([...byKey].filter(([, rec]) => rec.tags.length));
  const all = [...finalByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { byKey: finalByKey, all };
}

/**
 * Comma-separated OR search over item name/shortName. "cracker, motor" finds
 * everything matching either term in one pass — the point being a quick
 * lookup over a whole loot pile, not one item at a time.
 */
export function searchItemUses(index, query, { limit = 40 } = {}) {
  const terms = String(query || '').split(',').map(norm).filter((t) => t.length >= 2);
  if (!terms.length) return [];

  const hits = [];
  for (const rec of index.all) {
    const name = norm(rec.name);
    const short = rec.shortName ? norm(rec.shortName) : '';
    let bestPos = -1;
    for (const term of terms) {
      const at = name.indexOf(term);
      const shortAt = short ? short.indexOf(term) : -1;
      const pos = at === -1 ? shortAt : (shortAt === -1 ? at : Math.min(at, shortAt));
      if (pos !== -1 && (bestPos === -1 || pos < bestPos)) bestPos = pos;
    }
    if (bestPos === -1) continue;
    hits.push({ rec, score: bestPos === 0 ? 0 : 1, pos: bestPos });
  }

  hits.sort((a, b) => a.score - b.score
    || a.pos - b.pos
    || a.rec.name.length - b.rec.name.length
    || a.rec.name.localeCompare(b.rec.name));

  return hits.slice(0, limit).map((h) => h.rec);
}
