import { describe, it, expect } from 'vitest';
import {
  estimateRunBaseline, estimateSwimBaseline, estimateLiftBaseline,
  weeksForPercentGain, forecastRunWeeks, forecastSwimWeeks, forecastLiftWeeks, forecastGenericWeeks,
  weekdayOffsets, extractRunResult, extractSwimResult, extractLiftResult,
} from './goals';

describe('estimateRunBaseline', () => {
  it('picks the highest VDOT across completed PR-bucket runs', () => {
    const workouts = [
      { activityType: 'run', status: 'completed', distanceM: 1609.344, durationSec: 420, date: '2026-01-01' }, // 7:00 mile
      { activityType: 'run', status: 'completed', distanceM: 5000, durationSec: 1200, date: '2026-01-02' },    // 20:00 5K, VDOT ~49.8
    ];
    const v = estimateRunBaseline(workouts);
    expect(v).toBeCloseTo(49.8, 0);
  });
  it('returns null with no completed runs', () => {
    expect(estimateRunBaseline([])).toBeNull();
  });
});

describe('estimateSwimBaseline', () => {
  it('returns the fastest pace/100m among completed swims', () => {
    const workouts = [
      { activityType: 'swim', status: 'completed', distanceM: 1000, durationSec: 1000 }, // 100s/100m
      { activityType: 'swim', status: 'completed', distanceM: 1000, durationSec: 900 },  // 90s/100m — faster
    ];
    expect(estimateSwimBaseline(workouts)).toBeCloseTo(90, 6);
  });
});

describe('estimateLiftBaseline', () => {
  it('finds the best 1RM for a named exercise, case-insensitively', () => {
    const workouts = [
      { activityType: 'lift', status: 'completed', metrics: { exercises: [{ name: 'Bench', sets: [{ reps: 5, weightKg: 80 }] }] } },
      { activityType: 'lift', status: 'completed', metrics: { exercises: [{ name: 'bench', sets: [{ reps: 1, weightKg: 100 }] }] } },
    ];
    expect(estimateLiftBaseline(workouts, 'Bench')).toBeCloseTo(100, 0);
  });
  it('returns null for an exercise never logged', () => {
    expect(estimateLiftBaseline([], 'Squat')).toBeNull();
  });
});

describe('weeksForPercentGain', () => {
  it('is zero for no gain needed', () => {
    expect(weeksForPercentGain(0, 4, 'run')).toBe(0);
  });
  it('never forecasts fewer than 2 weeks for a real gain', () => {
    expect(weeksForPercentGain(0.001, 7, 'lift')).toBeGreaterThanOrEqual(2);
  });
  it('more days/week shortens the forecast for the same gain', () => {
    const slow = weeksForPercentGain(0.1, 2, 'run');
    const fast = weeksForPercentGain(0.1, 6, 'run');
    expect(fast).toBeLessThan(slow);
  });
  it('a bigger ask takes longer than a smaller one', () => {
    const small = weeksForPercentGain(0.02, 4, 'run');
    const big = weeksForPercentGain(0.2, 4, 'run');
    expect(big).toBeGreaterThan(small);
  });
});

describe('forecast*Weeks direction handling', () => {
  it('run: 0 weeks if target VDOT already met', () => {
    expect(forecastRunWeeks(50, 48, 4)).toBe(0);
  });
  it('run: positive weeks if target is higher', () => {
    expect(forecastRunWeeks(45, 50, 4)).toBeGreaterThan(0);
  });
  it('swim: improvement means a LOWER target pace', () => {
    expect(forecastSwimWeeks(95, 100, 4)).toBe(0); // target slower than current -> already met
    expect(forecastSwimWeeks(95, 85, 4)).toBeGreaterThan(0);
  });
  it('lift: 0 weeks if target 1RM already met', () => {
    expect(forecastLiftWeeks(100, 90, 4)).toBe(0);
    expect(forecastLiftWeeks(100, 120, 4)).toBeGreaterThan(0);
  });
  it('generic respects higherIsBetter', () => {
    expect(forecastGenericWeeks(30, 25, 4, false)).toBeGreaterThan(0); // lower duration goal, e.g. a time-to-beat
    expect(forecastGenericWeeks(30, 25, 4, true)).toBe(0);
  });
});

describe('weekdayOffsets', () => {
  it('spreads sessions across the week, not bunched at day 0', () => {
    const offs = weekdayOffsets(3);
    expect(offs).toEqual([0, 2, 5]);
    expect(new Set(offs).size).toBe(3);
  });
  it('7 days/week covers every day', () => {
    expect(weekdayOffsets(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('extractRunResult / extractSwimResult / extractLiftResult', () => {
  it('extractRunResult returns the same VDOT estimateRunBaseline would from an equivalent workout', () => {
    const w = { activityType: 'run', distanceM: 5000, durationSec: 1200 }; // 20:00 5K
    expect(extractRunResult(w)).toBeCloseTo(49.8, 0);
  });
  it('extractRunResult is null for a non-run or incomplete workout', () => {
    expect(extractRunResult({ activityType: 'swim', distanceM: 5000, durationSec: 1200 })).toBeNull();
    expect(extractRunResult({ activityType: 'run', distanceM: 5000, durationSec: null })).toBeNull();
  });
  it('extractSwimResult returns pace/100m', () => {
    const w = { activityType: 'swim', distanceM: 1000, durationSec: 900 };
    expect(extractSwimResult(w)).toBeCloseTo(90, 6);
  });
  it('extractLiftResult finds the best 1RM for the named exercise, case-insensitively', () => {
    const w = { activityType: 'lift', metrics: { exercises: [{ name: 'bench', sets: [{ reps: 1, weightKg: 100 }] }] } };
    expect(extractLiftResult(w, 'Bench')).toBeCloseTo(100, 0);
  });
  it('extractLiftResult is null without a matching exercise name', () => {
    const w = { activityType: 'lift', metrics: { exercises: [{ name: 'Squat', sets: [{ reps: 5, weightKg: 100 }] }] } };
    expect(extractLiftResult(w, 'Bench')).toBeNull();
  });
});
