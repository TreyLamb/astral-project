// Pure hideout maths. No React, no storage, no fetching — every function here
// takes plain data and returns plain data, so the whole shopping-list
// derivation is testable and cheap enough to run inside a useMemo.

import { slugName } from './eftNormalize';

export const stationKey = (station) => station.normalizedName || slugName(station.name);

export const maxLevelOf = (station) =>
  station.levels.reduce((n, lv) => Math.max(n, lv.level), 0);

/** Level the user is aiming this station at — their target, clamped to what exists. */
export function targetLevelOf(station, targets) {
  const max = maxLevelOf(station);
  const raw = targets[stationKey(station)];
  if (raw === undefined || raw === null || raw === '') return max;
  return Math.max(0, Math.min(max, Number(raw)));
}

export const currentLevelOf = (station, levels) =>
  Math.max(0, Math.min(maxLevelOf(station), Number(levels[stationKey(station)] ?? 0)));

/**
 * Every station level still to be built, given the user's current levels and
 * the active scope/filters. This is the single input the shopping list, the
 * cost totals and the build order all derive from — they never re-decide what
 * counts as "remaining".
 *
 * @param scope 'all'  every level from current+1 up to the target
 *              'next' only the single next level of each station
 */
export function pendingLevels(stations, { levels, targets, disabled, scope, soloStation }) {
  const off = new Set(disabled || []);
  const out = [];
  for (const station of stations) {
    const key = stationKey(station);
    if (soloStation ? key !== soloStation : off.has(key)) continue;

    const current = currentLevelOf(station, levels);
    const target = targetLevelOf(station, targets);
    if (target <= current) continue;

    const ceiling = scope === 'next' ? Math.min(current + 1, target) : target;
    for (const lv of station.levels) {
      if (lv.level > current && lv.level <= ceiling) out.push({ station, level: lv });
    }
  }
  return out;
}

// --- Prices --------------------------------------------------------------

/**
 * What one unit realistically costs to acquire. Flea buy order first (that is
 * what you actually pay), then the 24h average, then the last low, then the
 * handbook base price as a floor so a flea-banned item is never priced at 0.
 */
export function unitCost(item) {
  if (!item) return 0;
  return item.fleaBuy?.price ?? item.avg24hPrice ?? item.lastLowPrice ?? item.basePrice ?? 0;
}

/** Trader price only if a trader genuinely undercuts the flea. */
export function traderBeatsFlea(item) {
  const trader = item?.bestTraderBuy;
  if (!trader?.price) return null;
  const flea = item.fleaBuy?.price ?? item.avg24hPrice;
  if (!flea || trader.price >= flea) return null;
  return { ...trader, saving: flea - trader.price };
}

// --- Shopping list -------------------------------------------------------

/**
 * Collapse every pending level's item requirements into one row per item,
 * netted against what is already on hand.
 *
 * Inventory is netted per ITEM, not per requirement: 5 screwdrivers cover the
 * first 5 needed regardless of which station wanted them, which is how a stash
 * actually works.
 */
export function buildShoppingList(pending, items, inventory) {
  const byItem = new Map();

  for (const { station, level } of pending) {
    for (const req of level.itemRequirements) {
      if (!req.itemId) continue;
      let row = byItem.get(req.itemId);
      if (!row) {
        row = {
          itemId: req.itemId,
          item: items[req.itemId] || null,
          needed: 0,
          fir: false,
          sources: [],
        };
        byItem.set(req.itemId, row);
      }
      row.needed += req.count;
      row.fir = row.fir || !!req.foundInRaid;
      row.sources.push({
        stationKey: stationKey(station),
        stationName: station.name,
        level: level.level,
        count: req.count,
        foundInRaid: !!req.foundInRaid,
      });
    }
  }

  const rows = [...byItem.values()].map((row) => {
    const have = Math.max(0, Number(inventory[row.itemId] ?? 0));
    const short = Math.max(0, row.needed - have);
    const each = unitCost(row.item);
    return {
      ...row,
      have,
      short,
      done: short === 0,
      unitCost: each,
      remainingCost: each * short,
      totalCost: each * row.needed,
      name: row.item?.name || row.itemId,
      category: row.item?.category || 'Uncategorised',
    };
  });

  rows.sort((a, b) => b.remainingCost - a.remainingCost || a.name.localeCompare(b.name));

  const totals = rows.reduce(
    (acc, r) => ({
      items: acc.items + 1,
      unitsNeeded: acc.unitsNeeded + r.needed,
      unitsShort: acc.unitsShort + r.short,
      cost: acc.cost + r.remainingCost,
      fullCost: acc.fullCost + r.totalCost,
      complete: acc.complete + (r.done ? 1 : 0),
    }),
    { items: 0, unitsNeeded: 0, unitsShort: 0, cost: 0, fullCost: 0, complete: 0 },
  );
  totals.percent = totals.unitsNeeded
    ? Math.round(((totals.unitsNeeded - totals.unitsShort) / totals.unitsNeeded) * 100)
    : 100;

  return { rows, totals };
}

export function filterRows(rows, { search, hideOwned, showFirOnly, stationKey: onlyStation }) {
  const q = (search || '').trim().toLowerCase();
  return rows.filter((r) => {
    if (hideOwned && r.done) return false;
    if (showFirOnly && !r.fir) return false;
    if (onlyStation && !r.sources.some((s) => s.stationKey === onlyStation)) return false;
    if (q && !r.name.toLowerCase().includes(q)
        && !(r.item?.shortName || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

export function groupRows(rows, groupBy) {
  if (groupBy === 'station') {
    const groups = new Map();
    for (const row of rows) {
      for (const src of row.sources) {
        if (!groups.has(src.stationName)) groups.set(src.stationName, []);
        // One row per (item, station) so the count shown is what THAT station
        // wants, not the global total.
        groups.get(src.stationName).push({ ...row, needed: src.count, contextLevel: src.level });
      }
    }
    return [...groups.entries()]
      .map(([title, items]) => [title, mergeSameItem(items)])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }
  if (groupBy === 'category') {
    const groups = new Map();
    for (const row of rows) {
      const key = row.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  return [['All items', rows]];
}

// A station that wants the same item at two different levels produces two
// entries; the station view wants one line with the combined count.
function mergeSameItem(items) {
  const out = new Map();
  for (const it of items) {
    const prev = out.get(it.itemId);
    if (prev) prev.needed += it.needed;
    else out.set(it.itemId, { ...it });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// --- Requirement / blocker checking --------------------------------------

const norm = (s) => slugName(s);

/**
 * Why a given station level can't be started yet. Returns every requirement
 * with a met flag rather than just the failures, so the UI can show the whole
 * gate — a checklist where three of four lines are green is far more useful
 * than a bare "blocked".
 */
export function levelRequirements(station, level, { stations, levels, profile, inventory, items }) {
  const current = currentLevelOf(station, levels);
  const out = [];

  if (level.level > current + 1) {
    out.push({
      kind: 'sequence',
      label: `${station.name} level ${level.level - 1}`,
      need: level.level - 1,
      have: current,
      met: false,
    });
  }

  const byKey = new Map(stations.map((s) => [stationKey(s), s]));
  for (const req of level.stationLevelRequirements) {
    const key = req.stationKey || norm(req.stationName);
    const target = byKey.get(key);
    const have = target ? currentLevelOf(target, levels) : (levels[key] ?? 0);
    out.push({
      kind: 'station',
      label: `${req.stationName} level ${req.level}`,
      stationKey: key,
      need: req.level,
      have,
      met: have >= req.level,
    });
  }

  for (const req of level.traderRequirements) {
    const key = norm(req.traderName);
    // Every trader starts at loyalty 1, so an unset trader is LL1, not LL0 —
    // otherwise a fresh profile reports LL1 requirements as blocked while the
    // settings screen shows LL1 selected.
    const have = Number(profile.traders?.[key] ?? 1);
    out.push({
      kind: 'trader',
      label: `${req.traderName} LL${req.level}`,
      traderKey: key,
      need: req.level,
      have,
      met: have >= req.level,
    });
  }

  for (const req of level.skillRequirements) {
    const have = Number(profile.skills?.[req.name] ?? 0);
    out.push({
      kind: 'skill',
      label: `${req.name} ${req.level}`,
      skillName: req.name,
      need: req.level,
      have,
      met: have >= req.level,
    });
  }

  for (const req of level.itemRequirements) {
    const have = Number(inventory[req.itemId] ?? 0);
    out.push({
      kind: 'item',
      label: items[req.itemId]?.name || req.itemId,
      itemId: req.itemId,
      need: req.count,
      have,
      met: have >= req.count,
      foundInRaid: !!req.foundInRaid,
    });
  }

  return out;
}

/** The next level of every station, annotated with whether it can be started. */
export function upgradeCandidates(stations, ctx) {
  const out = [];
  for (const station of stations) {
    const current = currentLevelOf(station, ctx.levels);
    const next = station.levels.find((lv) => lv.level === current + 1);
    if (!next) continue;
    const reqs = levelRequirements(station, next, ctx);
    const missing = reqs.filter((r) => !r.met);
    const itemCost = next.itemRequirements.reduce(
      (n, r) => n + unitCost(ctx.items[r.itemId]) * Math.max(0, r.count - (ctx.inventory[r.itemId] ?? 0)),
      0,
    );
    out.push({
      station,
      level: next,
      requirements: reqs,
      blockers: missing,
      // "Ready" means only items are missing and you could buy them today.
      // Trader/skill/station gates cannot be solved by shopping, so they are
      // tracked apart from item shortfalls.
      hardBlocked: missing.some((m) => m.kind !== 'item'),
      ready: missing.length === 0,
      remainingCost: itemCost,
      constructionTime: next.constructionTime,
    });
  }
  return out;
}

/**
 * A build order that never suggests something before its prerequisites.
 *
 * Kahn-style: repeatedly take the cheapest upgrade whose station/sequence gates
 * are already satisfied by the simulated levels, apply it, and continue. Trader
 * and skill gates do NOT block ordering — they are surfaced as warnings on the
 * step instead, because you cannot reorder your way out of needing Ragman 3
 * and pretending otherwise would hide the real constraint.
 */
export function suggestedBuildOrder(stations, ctx, { limit = 60 } = {}) {
  const simulated = { ...ctx.levels };
  const order = [];
  const remaining = new Map();

  for (const station of stations) {
    const key = stationKey(station);
    if (ctx.disabled?.includes(key)) continue;
    const current = currentLevelOf(station, ctx.levels);
    const target = targetLevelOf(station, ctx.targets || {});
    const queue = station.levels.filter((lv) => lv.level > current && lv.level <= target);
    if (queue.length) remaining.set(key, { station, queue });
  }

  while (order.length < limit && remaining.size) {
    const options = [];
    for (const [key, entry] of remaining) {
      const level = entry.queue[0];
      const reqs = levelRequirements(entry.station, level, { ...ctx, levels: simulated });
      const structural = reqs.filter((r) => !r.met && (r.kind === 'station' || r.kind === 'sequence'));
      if (structural.length) continue;
      const soft = reqs.filter((r) => !r.met && r.kind !== 'item');
      const cost = level.itemRequirements.reduce(
        (n, r) => n + unitCost(ctx.items[r.itemId]) * r.count, 0,
      );
      options.push({ key, entry, level, cost, warnings: soft, requirements: reqs });
    }

    // Everything left is gated behind something we cannot simulate away.
    if (!options.length) break;

    options.sort((a, b) => a.cost - b.cost);
    const chosen = options[0];
    order.push({
      station: chosen.entry.station,
      level: chosen.level,
      cost: chosen.cost,
      warnings: chosen.warnings,
      constructionTime: chosen.level.constructionTime,
    });

    simulated[chosen.key] = chosen.level.level;
    chosen.entry.queue.shift();
    if (!chosen.entry.queue.length) remaining.delete(chosen.key);
  }

  // Anything the loop could not place is still owed — reporting it as
  // "unreachable" is honest, dropping it silently would not be.
  const stranded = [...remaining.values()].map((e) => ({
    station: e.station,
    levels: e.queue.map((l) => l.level),
  }));

  return { order, stranded };
}

// --- Station progress ----------------------------------------------------

export function stationProgress(station, { levels, targets, inventory }) {
  const current = currentLevelOf(station, levels);
  const target = targetLevelOf(station, targets);
  const max = maxLevelOf(station);

  let needed = 0;
  let have = 0;
  for (const lv of station.levels) {
    if (lv.level <= current || lv.level > target) continue;
    for (const req of lv.itemRequirements) {
      needed += req.count;
      have += Math.min(req.count, Number(inventory[req.itemId] ?? 0));
    }
  }

  return {
    current,
    target,
    max,
    complete: current >= target,
    itemsNeeded: needed,
    itemsHave: have,
    percent: needed ? Math.round((have / needed) * 100) : 100,
  };
}
