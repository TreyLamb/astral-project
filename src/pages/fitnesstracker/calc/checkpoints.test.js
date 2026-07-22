import { describe, it, expect } from 'vitest';
import {
  daysBetween, resolveCadenceDates, shiftForRestDay, buildCheckpoints,
  recomputeFrom, mostRecentTouchIndex, buildTaskSessions,
} from './checkpoints';

describe('resolveCadenceDates', () => {
  it('always includes start and deadline, even for a goal shorter than one cadence interval', () => {
    const dates = resolveCadenceDates('2026-01-01', '2026-01-03', { type: 'weekly' });
    expect(dates[0]).toBe('2026-01-01');
    expect(dates[dates.length - 1]).toBe('2026-01-03');
  });
  it('daily cadence produces one checkpoint per day', () => {
    const dates = resolveCadenceDates('2026-01-01', '2026-01-05', { type: 'daily' });
    expect(dates).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']);
  });
});

describe('shiftForRestDay', () => {
  it('never places two run checkpoints less than 2 days apart', () => {
    const shifted = shiftForRestDay(['2026-01-01', '2026-01-02', '2026-01-03'], 'run');
    for (let i = 1; i < shifted.length; i++) {
      expect(daysBetween(shifted[i - 1], shifted[i])).toBeGreaterThanOrEqual(2);
    }
  });
  it('leaves weight/generic goals untouched (no physiological rest constraint)', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03'];
    expect(shiftForRestDay(dates, 'weight')).toEqual(dates);
  });
});

describe('buildCheckpoints', () => {
  const goal = {
    kind: 'run', baselineValue: 40, targetValue: 50, direction: null,
    startDate: '2026-01-01', deadline: '2026-02-26', cadence: { type: 'weekly' },
  };
  it('produces a dated checkpoint set from baseline to target', () => {
    const cps = buildCheckpoints(goal, { hasRealBaseline: false });
    expect(cps.length).toBeGreaterThan(1);
    expect(cps[0].date).toBe('2026-01-01');
    expect(cps[cps.length - 1].date).toBe('2026-02-26');
    expect(cps[cps.length - 1].targetValue).toBeCloseTo(50, 6);
  });
  it('marks the whole curve provisional with no real baseline, and not provisional with one', () => {
    expect(buildCheckpoints(goal, { hasRealBaseline: false }).every((c) => c.provisional)).toBe(true);
    expect(buildCheckpoints(goal, { hasRealBaseline: true }).every((c) => !c.provisional)).toBe(true);
  });
  it('returns an empty set when baseline/target/dates are missing rather than throwing', () => {
    expect(buildCheckpoints({ ...goal, baselineValue: null }, { hasRealBaseline: false })).toEqual([]);
    expect(buildCheckpoints({ ...goal, deadline: null }, { hasRealBaseline: false })).toEqual([]);
  });
});

describe('mostRecentTouchIndex', () => {
  it('finds the last logged or overridden checkpoint', () => {
    const cps = [
      { source: 'computed', actualValue: null },
      { source: 'computed', actualValue: 45 },
      { source: 'computed', actualValue: null },
    ];
    expect(mostRecentTouchIndex(cps)).toBe(1);
  });
  it('returns -1 when nothing has been touched', () => {
    expect(mostRecentTouchIndex([{ source: 'computed', actualValue: null }])).toBe(-1);
  });
});

// The core invariant the whole checkpoint-editing feature hinges on
// (Guidelines_Forecast.md §6): everything after a touch point recomputes
// forward to the fixed end goal; everything at/before it never moves; a
// worse-than-projected result makes the remaining curve steeper, never softer.
describe('recomputeFrom — recompute-forward invariant', () => {
  const kind = 'run';
  const endGoal = { targetValue: 50, deadline: '2026-03-01', direction: null };
  const baseCheckpoints = [
    { date: '2026-01-01', targetValue: 40, source: 'computed', realism: null, provisional: true, actualValue: null, loggedAt: null, status: 'pending' },
    { date: '2026-01-15', targetValue: 43, source: 'computed', realism: null, provisional: true, actualValue: null, loggedAt: null, status: 'pending' },
    { date: '2026-02-01', targetValue: 46, source: 'computed', realism: null, provisional: true, actualValue: null, loggedAt: null, status: 'pending' },
    { date: '2026-02-15', targetValue: 48, source: 'computed', realism: null, provisional: true, actualValue: null, loggedAt: null, status: 'pending' },
    { date: '2026-03-01', targetValue: 50, source: 'computed', realism: null, provisional: true, actualValue: null, loggedAt: null, status: 'pending' },
  ];

  it('leaves everything at/before the touch point untouched, and steepens (never softens) the remainder on a worse result', () => {
    const touchIndex = 2; // logging a WORSE result (44 instead of the planned 46)
    const touched = { ...baseCheckpoints[touchIndex], actualValue: 44, loggedAt: 123, status: 'done' };
    const withTouch = [...baseCheckpoints.slice(0, touchIndex), touched, ...baseCheckpoints.slice(touchIndex + 1)];
    const next = recomputeFrom(kind, withTouch, touchIndex, 44, endGoal);

    expect(next.slice(0, touchIndex + 1)).toEqual(withTouch.slice(0, touchIndex + 1));

    const originalRemainingGain = baseCheckpoints[4].targetValue - baseCheckpoints[2].targetValue; // 50 - 46 = 4
    const recomputedRemainingGain = next[4].targetValue - 44; // from the worse anchor
    expect(recomputedRemainingGain).toBeGreaterThan(originalRemainingGain);
    expect(next[4].targetValue).toBeCloseTo(50, 6); // the fixed end goal itself never moves
  });

  it('chained edits: a later recompute never re-touches an earlier touch point', () => {
    const firstTouch = { ...baseCheckpoints[1], source: 'override', targetValue: 42 };
    const afterFirst = [baseCheckpoints[0], firstTouch, ...baseCheckpoints.slice(2)];
    const afterFirstRecompute = recomputeFrom(kind, afterFirst, 1, 42, endGoal);

    const secondTouchIndex = 3;
    const secondTouched = { ...afterFirstRecompute[secondTouchIndex], actualValue: 47, loggedAt: 456, status: 'done' };
    const withSecondTouch = [...afterFirstRecompute.slice(0, secondTouchIndex), secondTouched, ...afterFirstRecompute.slice(secondTouchIndex + 1)];
    const finalNext = recomputeFrom(kind, withSecondTouch, secondTouchIndex, 47, endGoal);

    expect(finalNext[0]).toEqual(withSecondTouch[0]);
    expect(finalNext[1]).toEqual(withSecondTouch[1]); // the FIRST (earlier) touch stays a historical waypoint
    expect(mostRecentTouchIndex(finalNext)).toBe(secondTouchIndex);
  });
});

describe('buildTaskSessions', () => {
  it('spreads plain training days across each week, skipping dates already covered by a checkpoint', () => {
    const sessions = buildTaskSessions('2026-01-01', '2026-01-14', { value: 3 }, ['2026-01-01']);
    expect(sessions).not.toContain('2026-01-01');
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((d) => d >= '2026-01-01' && d <= '2026-01-14')).toBe(true);
  });
});
