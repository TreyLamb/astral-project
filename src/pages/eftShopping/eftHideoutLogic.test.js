import { describe, it, expect } from 'vitest';

import snapshot from './data/hideoutSnapshot.json';
import {
  stationKey, maxLevelOf, currentLevelOf, targetLevelOf,
  pendingLevels, buildShoppingList, filterRows, groupRows,
  levelRequirements, upgradeCandidates, suggestedBuildOrder, stationProgress,
  unitCost, traderBeatsFlea,
} from './eftHideoutLogic';

const { stations, items } = snapshot;
const byName = (name) => stations.find((s) => s.name === name);

const base = {
  levels: {}, targets: {}, disabled: [], inventory: {}, profile: { traders: {}, skills: {} },
  items, stations,
};

describe('snapshot integrity', () => {
  it('has every hideout station with ascending levels', () => {
    expect(stations.length).toBeGreaterThan(20);
    for (const s of stations) {
      expect(s.levels.length).toBeGreaterThan(0);
      const nums = s.levels.map((l) => l.level);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('resolves every item requirement to a known item', () => {
    for (const s of stations) {
      for (const lv of s.levels) {
        for (const req of lv.itemRequirements) {
          expect(items[req.itemId], `${s.name} lv${lv.level} -> ${req.itemId}`).toBeTruthy();
        }
      }
    }
  });

  it('points every station prerequisite at a station that exists', () => {
    const keys = new Set(stations.map(stationKey));
    for (const s of stations) {
      for (const lv of s.levels) {
        for (const req of lv.stationLevelRequirements) {
          expect(keys.has(req.stationKey), `${s.name} lv${lv.level} -> ${req.stationName}`).toBe(true);
        }
      }
    }
  });
});

describe('pendingLevels', () => {
  it('returns every level of every station from a fresh account', () => {
    const pending = pendingLevels(stations, { ...base, scope: 'all' });
    const totalLevels = stations.reduce((n, s) => n + s.levels.length, 0);
    expect(pending).toHaveLength(totalLevels);
  });

  it('scope "next" returns at most one level per station', () => {
    const pending = pendingLevels(stations, { ...base, scope: 'next' });
    const perStation = new Map();
    for (const p of pending) {
      const k = stationKey(p.station);
      perStation.set(k, (perStation.get(k) || 0) + 1);
    }
    expect([...perStation.values()].every((n) => n === 1)).toBe(true);
    expect(pending.length).toBeLessThan(
      pendingLevels(stations, { ...base, scope: 'all' }).length,
    );
  });

  it('skips levels at or below the current level', () => {
    const wb = byName('Workbench');
    const levels = { [stationKey(wb)]: maxLevelOf(wb) };
    const pending = pendingLevels(stations, { ...base, levels, scope: 'all' });
    expect(pending.some((p) => p.station.name === 'Workbench')).toBe(false);
  });

  it('respects a target below max', () => {
    const wb = byName('Workbench');
    const key = stationKey(wb);
    const pending = pendingLevels(stations, { ...base, targets: { [key]: 1 }, scope: 'all' });
    const wbLevels = pending.filter((p) => stationKey(p.station) === key).map((p) => p.level.level);
    expect(wbLevels).toEqual([1]);
  });

  it('excludes disabled stations and honours solo', () => {
    const key = stationKey(byName('Workbench'));
    expect(pendingLevels(stations, { ...base, disabled: [key], scope: 'all' })
      .some((p) => stationKey(p.station) === key)).toBe(false);

    const solo = pendingLevels(stations, { ...base, soloStation: key, scope: 'all' });
    expect(solo.every((p) => stationKey(p.station) === key)).toBe(true);
    expect(solo.length).toBeGreaterThan(0);
  });

  it('solo overrides the disabled list rather than colliding with it', () => {
    const key = stationKey(byName('Workbench'));
    const solo = pendingLevels(stations, {
      ...base, disabled: [key], soloStation: key, scope: 'all',
    });
    expect(solo.length).toBeGreaterThan(0);
  });
});

describe('buildShoppingList', () => {
  const pending = pendingLevels(stations, { ...base, scope: 'all' });

  it('collapses duplicate requirements into one row per item', () => {
    const { rows } = buildShoppingList(pending, items, {});
    const ids = rows.map((r) => r.itemId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sums counts across every station that wants the item', () => {
    const { rows } = buildShoppingList(pending, items, {});
    for (const row of rows) {
      expect(row.needed).toBe(row.sources.reduce((n, s) => n + s.count, 0));
    }
  });

  it('nets inventory out of the shortfall without going negative', () => {
    const { rows } = buildShoppingList(pending, items, {});
    const target = rows.find((r) => r.needed > 3);
    const withStock = buildShoppingList(pending, items, { [target.itemId]: target.needed + 50 });
    const after = withStock.rows.find((r) => r.itemId === target.itemId);
    expect(after.short).toBe(0);
    expect(after.done).toBe(true);
    expect(after.remainingCost).toBe(0);
  });

  it('reports 100% only when nothing is short', () => {
    const empty = buildShoppingList(pending, items, {});
    expect(empty.totals.percent).toBeLessThan(100);

    const everything = Object.fromEntries(empty.rows.map((r) => [r.itemId, r.needed]));
    const full = buildShoppingList(pending, items, everything);
    expect(full.totals.unitsShort).toBe(0);
    expect(full.totals.percent).toBe(100);
  });

  it('produces an empty list when nothing is pending', () => {
    const { rows, totals } = buildShoppingList([], items, {});
    expect(rows).toHaveLength(0);
    expect(totals.percent).toBe(100);
  });
});

describe('filterRows / groupRows', () => {
  const pending = pendingLevels(stations, { ...base, scope: 'all' });
  const { rows } = buildShoppingList(pending, items, {});

  it('search matches on name', () => {
    const hit = filterRows(rows, { search: rows[0].name.slice(0, 6) });
    expect(hit.length).toBeGreaterThan(0);
    expect(filterRows(rows, { search: 'zzzzzznotathing' })).toHaveLength(0);
  });

  it('hideOwned drops completed rows', () => {
    const inventory = Object.fromEntries(rows.slice(0, 3).map((r) => [r.itemId, r.needed]));
    const netted = buildShoppingList(pending, items, inventory).rows;
    expect(filterRows(netted, { hideOwned: true }).every((r) => !r.done)).toBe(true);
  });

  it('grouping by station never loses an item', () => {
    const grouped = groupRows(rows, 'station');
    const seen = new Set();
    for (const [, groupItems] of grouped) for (const r of groupItems) seen.add(r.itemId);
    expect(seen.size).toBe(rows.length);
  });

  it('grouping by item yields a single group', () => {
    expect(groupRows(rows, 'item')).toHaveLength(1);
  });
});

describe('levelRequirements', () => {
  it('flags a prerequisite station level as unmet from scratch', () => {
    const bc = byName('Bitcoin Farm');
    const reqs = levelRequirements(bc, bc.levels[0], base);
    const stationReq = reqs.find((r) => r.kind === 'station');
    expect(stationReq).toBeTruthy();
    expect(stationReq.met).toBe(false);
  });

  it('treats an unset trader as loyalty 1, matching the game and the settings UI', () => {
    const solar = byName('Solar Power');
    const req = levelRequirements(solar, solar.levels[0], base).find((r) => r.kind === 'trader');
    expect(req.have).toBe(1);
  });

  it('marks a trader requirement met once the profile reaches it', () => {
    const solar = byName('Solar Power');
    const req = levelRequirements(solar, solar.levels[0], {
      ...base, profile: { traders: { peacekeeper: 4 }, skills: {} },
    }).find((r) => r.kind === 'trader');
    expect(req.met).toBe(true);
  });

  it('marks a skill requirement met once the profile reaches it', () => {
    const wc = byName('Water Collector');
    const lv2 = wc.levels.find((l) => l.level === 2);
    const req = levelRequirements(wc, lv2, {
      ...base, profile: { traders: {}, skills: { Attention: 5 } },
    }).find((r) => r.kind === 'skill');
    expect(req.met).toBe(true);
  });

  it('adds a sequence blocker when skipping a level', () => {
    const wb = byName('Workbench');
    const reqs = levelRequirements(wb, wb.levels[2], base);
    expect(reqs.some((r) => r.kind === 'sequence' && !r.met)).toBe(true);
  });
});

describe('upgradeCandidates', () => {
  it('offers exactly one candidate per unfinished station', () => {
    const candidates = upgradeCandidates(stations, base);
    expect(candidates).toHaveLength(stations.length);
    expect(candidates.every((c) => c.level.level === 1)).toBe(true);
  });

  it('separates hard gates from item shortfalls', () => {
    const candidates = upgradeCandidates(stations, base);
    for (const c of candidates) {
      const hasNonItem = c.blockers.some((b) => b.kind !== 'item');
      expect(c.hardBlocked).toBe(hasNonItem);
    }
  });

  it('reports ready once every requirement is satisfied', () => {
    const stash = byName('Stash');
    const lv1 = stash.levels[0];
    const inventory = Object.fromEntries(lv1.itemRequirements.map((r) => [r.itemId, r.count]));
    const candidate = upgradeCandidates(stations, { ...base, inventory })
      .find((c) => c.station.name === 'Stash');
    if (!candidate.hardBlocked) expect(candidate.ready).toBe(true);
  });
});

describe('suggestedBuildOrder', () => {
  const { order, stranded } = suggestedBuildOrder(stations, { ...base, disabled: [] }, { limit: 200 });

  it('never places a level before its own predecessor', () => {
    const seen = new Map();
    for (const step of order) {
      const key = stationKey(step.station);
      const prev = seen.get(key) ?? 0;
      expect(step.level.level).toBe(prev + 1);
      seen.set(key, step.level.level);
    }
  });

  it('never places a level before a prerequisite station reaches its level', () => {
    const built = {};
    for (const step of order) {
      for (const req of step.level.stationLevelRequirements) {
        expect(built[req.stationKey] ?? 0).toBeGreaterThanOrEqual(req.level);
      }
      built[stationKey(step.station)] = step.level.level;
    }
  });

  it('accounts for every pending level between the order and the stranded list', () => {
    const total = stations.reduce((n, s) => n + s.levels.length, 0);
    const strandedCount = stranded.reduce((n, s) => n + s.levels.length, 0);
    expect(order.length + strandedCount).toBe(total);
  });
});

describe('stationProgress', () => {
  it('is complete when current meets the target', () => {
    const wb = byName('Workbench');
    const p = stationProgress(wb, { levels: { [stationKey(wb)]: maxLevelOf(wb) }, targets: {}, inventory: {} });
    expect(p.complete).toBe(true);
    expect(p.percent).toBe(100);
  });

  it('scales with what is stocked', () => {
    const wb = byName('Workbench');
    const zero = stationProgress(wb, { levels: {}, targets: {}, inventory: {} });
    expect(zero.percent).toBe(0);
    expect(zero.itemsNeeded).toBeGreaterThan(0);
  });
});

describe('helpers', () => {
  it('targetLevelOf clamps to the levels that exist', () => {
    const wb = byName('Workbench');
    expect(targetLevelOf(wb, { [stationKey(wb)]: 99 })).toBe(maxLevelOf(wb));
    expect(targetLevelOf(wb, {})).toBe(maxLevelOf(wb));
  });

  it('currentLevelOf clamps out-of-range saved values', () => {
    const wb = byName('Workbench');
    expect(currentLevelOf(wb, { [stationKey(wb)]: -5 })).toBe(0);
    expect(currentLevelOf(wb, { [stationKey(wb)]: 99 })).toBe(maxLevelOf(wb));
  });

  it('unitCost falls back down the price chain and never returns null', () => {
    expect(unitCost(null)).toBe(0);
    expect(unitCost({ basePrice: 500 })).toBe(500);
    expect(unitCost({ basePrice: 500, avg24hPrice: 900 })).toBe(900);
    expect(unitCost({ basePrice: 500, avg24hPrice: 900, fleaBuy: { price: 700 } })).toBe(700);
  });

  it('traderBeatsFlea only fires when the trader is genuinely cheaper', () => {
    expect(traderBeatsFlea({ bestTraderBuy: { price: 900 }, avg24hPrice: 500 })).toBeNull();
    expect(traderBeatsFlea({ avg24hPrice: 500 })).toBeNull();
    const win = traderBeatsFlea({ bestTraderBuy: { price: 300, vendor: 'Prapor' }, avg24hPrice: 500 });
    expect(win.saving).toBe(200);
  });
});
