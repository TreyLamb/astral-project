import { describe, it, expect } from 'vitest';
import { sessionLoad, acwrRolling, acwrStatus, weeklyDistance, distanceInRange } from './load';

const run = (date, distanceM, durationSec, rpe) => ({ date, distanceM, durationSec, rpe, status: 'completed', activityType: 'run' });
const iso = (dayOffset) => new Date(Date.UTC(2026, 5, 1) + dayOffset * 86400000).toISOString().slice(0, 10);

describe('training load', () => {
  it('session load = minutes * RPE (sRPE)', () => {
    expect(sessionLoad(run('2026-07-01', 5000, 1800, 5))).toBe(150); // 30min * 5
  });
  it('ignores planned (not-yet-completed) workouts', () => {
    expect(sessionLoad({ status: 'planned', durationSec: 1800, rpe: 5 })).toBe(0);
  });
  it('constant daily load => rolling ACWR = 1.0', () => {
    const ws = [];
    for (let d = 0; d < 28; d++) ws.push(run(iso(d), 5000, 1800, 5));
    const r = acwrRolling(ws, iso(27));
    expect(r.ratio).toBeCloseTo(1.0, 6);
  });
  it('a load spike pushes ACWR above the sweet spot', () => {
    const ws = [];
    for (let d = 0; d < 21; d++) ws.push(run(iso(d), 5000, 1800, 3)); // low chronic
    for (let d = 21; d < 28; d++) ws.push(run(iso(d), 5000, 3600, 8)); // big acute week
    const r = acwrRolling(ws, iso(27));
    expect(r.ratio).toBeGreaterThan(1.5);
  });
  it('status bands', () => {
    expect(acwrStatus(1.1).level).toBe('good');
    expect(acwrStatus(1.8).level).toBe('danger');
    expect(acwrStatus(0.5).level).toBe('low');
  });
});

describe('mileage rollups', () => {
  it('sums distance over a date range', () => {
    const ws = [run(iso(0), 5000), run(iso(1), 8000), run(iso(40), 10000)];
    expect(distanceInRange(ws, iso(0), iso(6))).toBe(13000);
  });
  it('weekly buckets return the requested count', () => {
    const ws = [run(iso(0), 5000), run(iso(3), 8000), run(iso(9), 6000)];
    const wk = weeklyDistance(ws, 4, iso(13));
    expect(wk).toHaveLength(4);
    expect(wk[wk.length - 1].distanceM).toBe(6000); // most recent 7d (days 7-13)
  });
});
