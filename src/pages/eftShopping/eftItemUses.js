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
//
// 🔴 EVERY ITEM IN THE GAME IS IN THE INDEX, INCLUDING ONES WITH NO USES AT ALL.
// Trey, 2026-09-09, after searching for the Aybolit mask and getting nothing:
// "even if an item doesn't have a usage it needs to be in there or i'll just
// assume our data isn't complete." He is right, and it is the difference
// between a tool that answers and a tool you stop trusting: "this item has no
// known uses" is a real answer, an empty result set is indistinguishable from
// a broken snapshot. The index used to END with
// `.filter(([, rec]) => rec.tags.length)`, so its universe was only whatever
// the other snapshots happened to mention — about 700 of the game's ~4,100
// items. `itemNames` (data/itemNames.json, npm run eft:items) now seeds the
// full table and nothing is dropped; `rec.hasUses` tells the two apart and
// searchItemUses ranks used items first so the answer you want stays on top.

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
 * @param {object} args.itemNames      itemNames.json shape ({rows: [[id, name, short?]]})
 * @returns {{ byKey: Map, all: object[] }}
 */
export function buildItemUsesIndex({
  hideoutData, questIndex, craftIndex, barterData, gearCatalog, itemNames,
} = {}) {
  const byKey = new Map();
  const items = hideoutData?.items || {};

  // A record is canonically keyed by template id, but four of the five sources can reference an
  // item by NAME ONLY (a quest line the wiki parser could not resolve, a barter row, a craft
  // row). `alias` maps every `name:<norm>` key onto the record that already exists under its id,
  // so those references land on the SAME record instead of forking a second, useless one. Look
  // records up through find(), never byKey.get(), for exactly that reason.
  const alias = new Map();
  const nameToId = new Map();
  for (const row of itemNames?.rows || []) nameToId.set(norm(row[1]), row[0]);

  const add = (itemId, name, shortName, item) => {
    const rec = ensure(byKey, itemId || nameToId.get(norm(name)) || null, name, shortName, item);
    if (rec && name) alias.set(`name:${norm(name)}`, rec);
    return rec;
  };
  const find = (itemId, name) => {
    const direct = byKey.get(keyFor(itemId || nameToId.get(norm(name)) || null, name));
    return direct ?? (name ? alias.get(`name:${norm(name)}`) : undefined);
  };

  // ---- 1. Build the item universe ----

  // The FULL item table first, so an item with no uses anywhere still exists to be found.
  for (const row of itemNames?.rows || []) {
    add(row[0], row[1], row[2] ?? '', items[row[0]] || null);
  }
  for (const [itemId, item] of Object.entries(items)) {
    add(itemId, item.name, item.shortName, item);
  }
  for (const quest of questIndex?.quests || []) {
    for (const need of quest.items || []) {
      add(need.itemId, need.name, '', need.itemId ? items[need.itemId] : null);
    }
  }
  for (const craft of craftIndex?.crafts || []) {
    for (const row of [...craft.inputs, ...craft.tools, ...craft.outputs]) {
      add(row.itemId, row.name, '', items[row.itemId]);
    }
  }
  for (const barter of barterData?.barters || []) {
    for (const g of barter.give || []) add(g.itemId, g.name, '', g.itemId ? items[g.itemId] : null);
    if (barter.get) add(barter.get.itemId, barter.get.name, '', barter.get.itemId ? items[barter.get.itemId] : null);
  }
  for (const [itemId, gear] of Object.entries(gearCatalog?.items || {})) {
    add(itemId, gear.name, gear.shortName, items[itemId]);
  }

  // ---- 2. Populate each bucket ----

  // Hideout: a flat "does the hideout ever want this" scan. Deliberately NOT
  // scope/target-aware like eftHideoutLogic's itemNeeds() — this tab answers
  // "is this connected to anything", not "what do my current targets imply".
  for (const station of hideoutData?.stations || []) {
    for (const level of station.levels || []) {
      for (const req of itemReqsOf(level)) {
        const rec = find(req.itemId, null);
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
      const rec = find(row.itemId, row.name);
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
      const rec = find(row.itemId, row.name);
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
    // byItemId is keyed id-or-name by eftQuestLogic; alias covers the name half.
    const rec = byKey.get(key) ?? alias.get(key);
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
      const rec = find(g.itemId, g.name);
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

  // ---- 3. Tags ----
  //
  // NOTHING IS DROPPED HERE. This block used to end by filtering the map down to records with at
  // least one tag; see the header for why that is now a bug rather than a tidy-up. `hasUses`
  // carries the distinction the filter used to make, so callers that genuinely want only
  // connected items can still ask for them.

  for (const rec of byKey.values()) {
    const tags = [];
    if (rec.uses.hideout.length) tags.push('Hideout');
    if (rec.uses.craft.length) tags.push('Craft');
    if (rec.uses.quest.length) tags.push('Quest');
    if (rec.uses.barter.length) tags.push('Barter');
    if (rec.uses.gear) tags.push('Armor');
    rec.tags = tags;
    rec.hasUses = tags.length > 0;
  }

  const all = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { byKey, all };
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

  // Items that are connected to SOMETHING sort above ones that are not. With the full ~4,100-item
  // table in the index, a bare relevance sort would bury "Bolts" (hideout + crafts) under a dozen
  // weapon parts that merely start with the same letters. The unused ones still appear - that is
  // the point of having them - just underneath.
  hits.sort((a, b) => (b.rec.hasUses ? 1 : 0) - (a.rec.hasUses ? 1 : 0)
    || a.score - b.score
    || a.pos - b.pos
    || a.rec.name.length - b.rec.name.length
    || a.rec.name.localeCompare(b.rec.name));

  return hits.slice(0, limit).map((h) => h.rec);
}
