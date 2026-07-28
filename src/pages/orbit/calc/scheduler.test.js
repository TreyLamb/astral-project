import { describe, it, expect } from 'vitest';
import {
  buildTimedPlan, freeIntervals, guardrailWindow, parseHM, minutesToHM,
  idealWindowMismatch, contextSwitchPenalty, placementSoftCost, violatesAdjacency,
  ruleAllows, ruleFloorMin, batchTravelMinutes, DEFAULT_SOFT_WEIGHTS,
} from './scheduler';

const GUARDRAILS = {
  awake: ['07:00', '22:00'],
  byCategory: {
    shopping: ['09:00', '20:00'],
    outdoor: ['07:00', '19:00'],
  },
};

// A minimal candidate task; only the fields the solver reads.
const task = (id, over = {}) => ({
  id,
  title: id,
  category: over.category ?? null,
  // intensity defaults to null so `energy` drives energyCost in these tests
  // (energy.js prefers intensity ?? energy ?? 3) — matches how a plain task
  // with no annotation yet is costed.
  intensity: over.intensity ?? null,
  energy: over.energy ?? 2,
  timeMin: over.timeMin ?? 60,
  estWorkMin: over.estWorkMin ?? null,
  estRecoveryMin: over.estRecoveryMin ?? 0, // keep tests focused on work placement
  indoorOutdoor: over.indoorOutdoor ?? 'indoor',
  weatherSensitive: over.weatherSensitive ?? false,
  locationId: over.locationId ?? null,
  dueDate: over.dueDate ?? null,
  ...over,
});

const base = (over = {}) => ({
  days: ['2026-07-27'],
  capacityFor: () => 100,
  guardrails: GUARDRAILS,
  fatigueCfg: { thresholdPct: 0.7, carryFactor: 0.5, maxCarryPct: 0.5 },
  defaultRecoveryMin: 0,
  ...over,
});

describe('time helpers', () => {
  it('parseHM / minutesToHM round-trip', () => {
    expect(parseHM('09:30')).toBe(570);
    expect(minutesToHM(570)).toBe('09:30');
    expect(minutesToHM(0)).toBe('00:00');
  });
});

describe('freeIntervals', () => {
  it('subtracts busy blocks and merges overlaps', () => {
    const free = freeIntervals(420, 1320, [
      { startMin: 600, endMin: 660 },
      { startMin: 640, endMin: 700 }, // overlaps previous
    ]);
    expect(free).toEqual([{ start: 420, end: 600 }, { start: 700, end: 1320 }]);
  });
  it('returns nothing for an inverted window', () => {
    expect(freeIntervals(600, 600, [])).toEqual([]);
  });
});

describe('guardrailWindow', () => {
  it('intersects awake hours with the category window', () => {
    expect(guardrailWindow(GUARDRAILS, 'shopping')).toEqual([parseHM('09:00'), parseHM('20:00')]);
  });
  it('falls back to awake hours for an unknown category', () => {
    expect(guardrailWindow(GUARDRAILS, 'deep-work')).toEqual([parseHM('07:00'), parseHM('22:00')]);
  });
});

describe('buildTimedPlan — basic placement', () => {
  it('places a single task at the start of the awake window', () => {
    const out = buildTimedPlan(base({ tasks: [task('a', { timeMin: 60 })] }));
    expect(out.unplaced).toEqual([]);
    expect(out.placements).toHaveLength(1);
    expect(out.placements[0]).toMatchObject({ taskId: 'a', date: '2026-07-27', startLabel: '07:00', endLabel: '08:00' });
  });

  it('packs a second task immediately after the first', () => {
    const out = buildTimedPlan(base({ tasks: [task('a', { timeMin: 60 }), task('b', { timeMin: 30 })] }));
    expect(out.placements.map((p) => p.startLabel)).toEqual(['07:00', '08:00']);
    expect(out.placements[1].endLabel).toBe('08:30');
  });

  it('respects a fixed event (busy block) and schedules around it', () => {
    const out = buildTimedPlan(base({
      tasks: [task('a', { timeMin: 60 })],
      busyFor: (d) => (d === '2026-07-27' ? [{ startMin: parseHM('07:00'), endMin: parseHM('09:00') }] : []),
    }));
    expect(out.placements[0].startLabel).toBe('09:00');
  });

  it('honors a category guardrail — shopping cannot start at 07:00', () => {
    const out = buildTimedPlan(base({ tasks: [task('s', { category: 'shopping', timeMin: 60 })] }));
    expect(out.placements[0].startLabel).toBe('09:00');
  });
});

describe('buildTimedPlan — energy tank', () => {
  it('overflows to the next day when today\'s tank is spent', () => {
    const out = buildTimedPlan(base({
      days: ['2026-07-27', '2026-07-28'],
      capacityFor: () => 5, // tank of 5
      tasks: [task('a', { energy: 4, timeMin: 30 }), task('b', { energy: 4, timeMin: 30 })],
    }));
    // a costs 4 (fits 5); b would push load to 8 > 5 → next day
    const byId = Object.fromEntries(out.placements.map((p) => [p.taskId, p.date]));
    expect(byId.a).toBe('2026-07-27');
    expect(byId.b).toBe('2026-07-28');
  });

  it('leaves a task unplaced when no day in the horizon has tank for it', () => {
    const out = buildTimedPlan(base({
      days: ['2026-07-27'],
      capacityFor: () => 3,
      tasks: [task('big', { energy: 5, timeMin: 30 })],
    }));
    expect(out.placements).toHaveLength(0);
    expect(out.unplaced).toEqual(['big']);
  });

  it('cross-day fatigue lowers the next day\'s tank', () => {
    // Day 1 fully loaded (tank 10, task energy 10) → day 2 starts at ~5.
    const out = buildTimedPlan(base({
      days: ['2026-07-27', '2026-07-28'],
      capacityFor: () => 10,
      tasks: [
        task('heavy', { energy: 10, timeMin: 60 }),
        task('m1', { energy: 4, timeMin: 30 }),
        task('m2', { energy: 3, timeMin: 30 }),
      ],
    }));
    const day2 = out.placements.filter((p) => p.date === '2026-07-28').map((p) => p.taskId);
    // heavy fills day1; day2 tank ~5 so m1(4) fits but m2(3) would exceed 5 → unplaced
    expect(day2).toContain('m1');
    expect(out.unplaced).toContain('m2');
  });
});

describe('buildTimedPlan — weather', () => {
  it('skips a rainy day for an outdoor task and lands it on a clear day', () => {
    const out = buildTimedPlan(base({
      days: ['2026-07-27', '2026-07-28'],
      tasks: [task('paint', { category: 'outdoor', indoorOutdoor: 'outdoor', weatherSensitive: true, timeMin: 60 })],
      weatherFor: (d) => (d === '2026-07-27'
        ? { hourly: [{ hour: 8, precipProb: 90, tempF: 70 }] }
        : { hourly: [{ hour: 8, precipProb: 0, tempF: 70 }] }),
    }));
    expect(out.placements[0].date).toBe('2026-07-28');
  });

  it('does NOT skip rain for an indoor task', () => {
    const out = buildTimedPlan(base({
      days: ['2026-07-27'],
      tasks: [task('desk', { category: 'admin', indoorOutdoor: 'indoor', timeMin: 60 })],
      weatherFor: () => ({ hourly: [{ hour: 8, precipProb: 90 }] }),
    }));
    expect(out.placements[0].date).toBe('2026-07-27');
  });
});

describe('buildTimedPlan — travel', () => {
  it('inserts travel time between two located tasks', () => {
    const places = new Map([
      ['home', { lat: 40.0, lng: -75.0 }],
      ['store', { lat: 40.2, lng: -75.0 }], // ~13.8 miles north
    ]);
    const out = buildTimedPlan(base({
      tasks: [task('shop', { category: 'shopping', locationId: 'store', timeMin: 30 })],
      placesById: places,
      homePlace: { lat: 40.0, lng: -75.0 },
    }));
    // starts at 09:00 (shopping window) + travel from home→store before work
    expect(out.placements[0].travelMinBefore).toBeGreaterThan(0);
    expect(parseHM(out.placements[0].startLabel)).toBeGreaterThan(parseHM('09:00'));
  });
});

describe('buildTimedPlan — per-day home base (homePlaceFor)', () => {
  const near = { lat: 41.01, lng: -75.0 }; // ~0.7mi from the store
  const store = { lat: 41.0, lng: -75.0 }; // ~70mi from the global home
  const globalHome = { lat: 40.0, lng: -75.0 };
  const shopInput = (over = {}) => base({
    tasks: [task('shop', { category: 'shopping', locationId: 'store', timeMin: 30 })],
    placesById: new Map([['store', store]]),
    homePlace: globalHome,
    ...over,
  });

  it('starts travel from the day base instead of the global home', () => {
    const fromHome = buildTimedPlan(shopInput());
    const fromBase = buildTimedPlan(shopInput({ homePlaceFor: () => near }));
    expect(fromHome.placements[0].travelMinBefore).toBeGreaterThan(30); // ~70mi from home
    expect(fromBase.placements[0].travelMinBefore).toBeLessThan(5); // based right next door that day
  });

  it('falls back to the global home when the resolver returns null', () => {
    expect(buildTimedPlan(shopInput({ homePlaceFor: () => null })))
      .toEqual(buildTimedPlan(shopInput()));
  });
});

describe('buildTimedPlan — reasons', () => {
  it('emits human-readable reason chips including tank + hours', () => {
    const out = buildTimedPlan(base({ tasks: [task('a', { category: 'admin', timeMin: 60 })] }));
    const reasons = out.placements[0].reasons;
    expect(reasons.some((r) => r.includes('admin hours'))).toBe(true);
    expect(reasons.some((r) => r.includes('tank'))).toBe(true);
    expect(reasons[0]).toBe('fits today');
  });
});

// === Phase 7 — soft optimization (§7) =======================================

describe('idealWindowMismatch (A5)', () => {
  it('is 0 inside the band and grows outside it', () => {
    expect(idealWindowMismatch({ idealWindow: 'evening' }, 19)).toBe(0);
    expect(idealWindowMismatch({ idealWindow: 'evening' }, 7)).toBe(11); // 18 - 7
    expect(idealWindowMismatch({ idealWindow: 'morning' }, 9)).toBe(0);
  });
  it('never penalizes "any" or a missing window', () => {
    expect(idealWindowMismatch({ idealWindow: 'any' }, 3)).toBe(0);
    expect(idealWindowMismatch({}, 3)).toBe(0);
  });
});

describe('contextSwitchPenalty (A4)', () => {
  const placed = (cat, s, e) => ({ category: cat, blockStartMin: s, blockEndMin: e });
  it('penalizes a task wedged between two different-category blocks', () => {
    const cand = { blockStartMin: 500, blockEndMin: 560 };
    const day = [placed('errand', 420, 480), placed('errand', 570, 630)];
    expect(contextSwitchPenalty({ category: 'admin' }, cand, day)).toBe(2);
  });
  it('does not penalize same-category neighbors, or uncategorized tasks', () => {
    const cand = { blockStartMin: 500, blockEndMin: 560 };
    const day = [placed('admin', 420, 480), placed('admin', 570, 630)];
    expect(contextSwitchPenalty({ category: 'admin' }, cand, day)).toBe(0);
    expect(contextSwitchPenalty({ category: null }, cand, day)).toBe(0);
  });
});

describe('placementSoftCost', () => {
  it('is a weighted sum of the parts', () => {
    const cost = placementSoftCost(
      { travel: 10, contextSwitch: 2, idealWindow: 4, dayIndex: 3 },
      { travel: 1, contextSwitch: 0.5, idealWindow: 0.5, dayIndex: 0.1 },
    );
    expect(cost).toBeCloseTo(10 + 1 + 2 + 0.3, 6);
  });
  it('falls back to default weights', () => {
    expect(placementSoftCost({ travel: 5 })).toBeCloseTo(5 * DEFAULT_SOFT_WEIGHTS.travel, 6);
  });
});

describe('batchTravelMinutes (A2)', () => {
  const N = { lat: 41.01, lng: -75.0 };
  const F = { lat: 41.0, lng: -75.0 }; // ~0.7mi from N
  const H = { lat: 40.0, lng: -75.0 }; // ~70mi from N
  it('is 0 without a task place', () => {
    expect(batchTravelMinutes(null, 9, [{ place: F }], H)).toBe(0);
  });
  it('takes the cheapest hop from home or any placed stop', () => {
    const nearPlaced = batchTravelMinutes(N, 12, [{ place: F }], H);
    const homeOnly = batchTravelMinutes(N, 12, [], H);
    expect(nearPlaced).toBeLessThan(homeOnly); // clustering near F is far cheaper than driving from home
    expect(nearPlaced).toBeLessThan(10);
  });
});

describe('buildTimedPlan — idealWindow preference (A5)', () => {
  it('places an evening-preferred task in the evening even though the morning is free', () => {
    const out = buildTimedPlan(base({
      tasks: [task('dinner-prep', { idealWindow: 'evening', timeMin: 60 })],
    }));
    expect(parseHM(out.placements[0].startLabel)).toBeGreaterThanOrEqual(parseHM('18:00'));
    expect(out.placements[0].reasons).toContain('evening preferred');
  });
});

describe('buildTimedPlan — proximity batching (A2)', () => {
  const batchInput = () => base({
    days: ['2026-07-27', '2026-07-28'],
    capacityFor: () => 100,
    tasks: [
      task('anchor', { category: 'outdoor', indoorOutdoor: 'outdoor', weatherSensitive: true, locationId: 'F', timeMin: 60 }),
      task('near', { category: 'admin', indoorOutdoor: 'indoor', locationId: 'N', timeMin: 60 }),
    ],
    placesById: new Map([
      ['F', { lat: 41.0, lng: -75.0 }],
      ['N', { lat: 41.01, lng: -75.0 }], // ~0.7mi from F, ~70mi from home
    ]),
    homePlace: { lat: 40.0, lng: -75.0 },
    weatherFor: (d) => (d === '2026-07-27'
      ? { hourly: [{ hour: 8, precipProb: 90, tempF: 70 }] } // rains the outdoor anchor off day 0
      : { hourly: [{ hour: 8, precipProb: 0, tempF: 70 }] }),
  });

  it('pulls an indoor task onto a LATER day to cluster it near an outdoor anchor (beats the front-load bias)', () => {
    const out = buildTimedPlan(batchInput());
    const byId = Object.fromEntries(out.placements.map((p) => [p.taskId, p]));
    expect(byId.anchor.date).toBe('2026-07-28'); // rained off day 0
    expect(byId.near.date).toBe('2026-07-28'); // followed the anchor rather than taking empty day 0
    expect(byId.near.travelMinBefore).toBeLessThan(10); // arrived right next to the anchor
  });

  it('is deterministic — identical input yields identical output', () => {
    expect(buildTimedPlan(batchInput())).toEqual(buildTimedPlan(batchInput()));
  });
});

describe('buildTimedPlan — perishable/outdoor adjacency (A3)', () => {
  const adjInput = (perishable) => base({
    days: ['2026-07-27', '2026-07-28'],
    tasks: [
      task('mow', { category: 'outdoor', indoorOutdoor: 'outdoor', timeMin: 60 }),
      task('groceries', { perishable, timeMin: 60 }),
    ],
  });

  it('keeps a perishable task off the slot right after an outdoor task', () => {
    const out = buildTimedPlan(adjInput(true));
    const byId = Object.fromEntries(out.placements.map((p) => [p.taskId, p.date]));
    expect(byId.mow).toBe('2026-07-27');
    expect(byId.groceries).toBe('2026-07-28'); // bumped off the hot-car slot to the next day
  });

  it('a non-perishable task DOES pack right after the outdoor task (proves adjacency drove the bump)', () => {
    const out = buildTimedPlan(adjInput(false));
    const byId = Object.fromEntries(out.placements.map((p) => [p.taskId, p.date]));
    expect(byId.groceries).toBe('2026-07-27');
  });
});

// === Phase 7 — rulebook (§12) ===============================================

describe('violatesAdjacency', () => {
  const outdoorBlock = { isOutdoor: true, perishable: false, blockStartMin: 420, blockEndMin: 480 };
  it('forbids a perishable immediately after an outdoor block', () => {
    const cand = { blockStartMin: 480, blockEndMin: 540 };
    expect(violatesAdjacency({ perishable: true }, cand, [outdoorBlock])).toBe(true);
  });
  it('allows it when the gap is large (not a hot-car slot)', () => {
    const cand = { blockStartMin: 700, blockEndMin: 760 }; // >60min after the outdoor block
    expect(violatesAdjacency({ perishable: true }, cand, [outdoorBlock])).toBe(false);
  });
  it('allows a non-perishable task in the same slot', () => {
    const cand = { blockStartMin: 480, blockEndMin: 540 };
    expect(violatesAdjacency({ perishable: false }, cand, [outdoorBlock])).toBe(false);
  });
});

describe('ruleAllows (B4)', () => {
  const rule = { subject: 'perishable', relation: 'notAfter', object: 'category:outdoor', action: 'forbid', active: true };
  const outdoorPlaced = { category: 'outdoor', isOutdoor: true, blockStartMin: 420, blockEndMin: 480 };

  it('enforces a perishable-notAfter-outdoor adjacency rule', () => {
    const cand = { startMin: 480, blockStartMin: 480, blockEndMin: 540 };
    expect(ruleAllows({ perishable: true }, cand, { placements: [outdoorPlaced] }, [rule])).toBe(false);
  });
  it('allows the task when nothing outdoor precedes it', () => {
    const cand = { startMin: 480, blockStartMin: 480, blockEndMin: 540 };
    expect(ruleAllows({ perishable: true }, cand, { placements: [] }, [rule])).toBe(true);
  });
  it('ignores unknown relations (forward-compatible)', () => {
    const future = { subject: 'perishable', relation: 'someFutureRelation', object: 'x', action: 'forbid', active: true };
    const cand = { startMin: 480, blockStartMin: 480, blockEndMin: 540 };
    expect(ruleAllows({ perishable: true }, cand, { placements: [outdoorPlaced] }, [future])).toBe(true);
  });
  it('enforces a time-window rule', () => {
    const win = { subject: 'category:shopping', relation: 'window', object: '09:00-20:00', action: 'forbid', active: true };
    const early = { startMin: parseHM('07:30'), blockStartMin: parseHM('07:30'), blockEndMin: parseHM('08:00') };
    const midday = { startMin: parseHM('10:00'), blockStartMin: parseHM('10:00'), blockEndMin: parseHM('10:30') };
    expect(ruleAllows({ category: 'shopping' }, early, { placements: [] }, [win])).toBe(false);
    expect(ruleAllows({ category: 'shopping' }, midday, { placements: [] }, [win])).toBe(true);
  });
  it('ignores inactive rules', () => {
    const off = { ...rule, active: false };
    const cand = { startMin: 480, blockStartMin: 480, blockEndMin: 540 };
    expect(ruleAllows({ perishable: true }, cand, { placements: [outdoorPlaced] }, [off])).toBe(true);
  });
});

describe('ruleFloorMin', () => {
  it('returns the highest notBefore/window-lo floor for a matching task', () => {
    const rules = [
      { subject: 'category:shopping', relation: 'notBefore', object: '10:00', active: true },
      { subject: 'category:shopping', relation: 'window', object: '11:00-20:00', active: true },
    ];
    expect(ruleFloorMin({ category: 'shopping' }, rules)).toBe(parseHM('11:00'));
  });
  it('is null when no rule matches', () => {
    const rules = [{ subject: 'category:call', relation: 'notBefore', object: '10:00', active: true }];
    expect(ruleFloorMin({ category: 'shopping' }, rules)).toBe(null);
  });
});

describe('buildTimedPlan — rules input', () => {
  it('honors a perishable-notAfter-outdoor rule passed in (independent of the built-in A3 filter)', () => {
    const rules = [{ subject: 'perishable', relation: 'notAfter', object: 'category:outdoor', action: 'forbid', active: true }];
    const out = buildTimedPlan(base({
      days: ['2026-07-27', '2026-07-28'],
      tasks: [
        task('mow', { category: 'outdoor', indoorOutdoor: 'outdoor', timeMin: 60 }),
        task('groceries', { perishable: true, timeMin: 60 }),
      ],
      rules,
    }));
    const byId = Object.fromEntries(out.placements.map((p) => [p.taskId, p.date]));
    expect(byId.groceries).toBe('2026-07-28');
  });

  it('defaults to no rules and does not crash on an empty rulebook', () => {
    const out = buildTimedPlan(base({ tasks: [task('a', { timeMin: 60 })], rules: [] }));
    expect(out.placements).toHaveLength(1);
  });
});
