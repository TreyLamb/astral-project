import { describe, it, expect } from 'vitest';
import { solve, paceSecPerMeter, paceIn, evenSplits, parseStructuredWorkout, distancePreset } from './pace';
import { M_PER_MILE } from '../units';

describe('pace solver', () => {
  it('solves pace from distance + time (5000m in 1200s)', () => {
    const r = solve({ distanceM: 5000, timeSec: 1200 });
    expect(r.secPerM).toBeCloseTo(0.24, 6);
    expect(paceIn(r.secPerM, 'km')).toBeCloseTo(240, 3);   // 4:00/km
    expect(paceIn(r.secPerM, 'mi')).toBeCloseTo(386.24, 1); // ~6:26/mi
    expect(r.complete).toBe(true);
  });
  it('solves distance from time + pace', () => {
    const r = solve({ timeSec: 1200, secPerM: 240 / 1000 });
    expect(r.distanceM).toBeCloseTo(5000, 3);
  });
  it('solves time from distance + pace', () => {
    const r = solve({ distanceM: 5000, secPerM: 386.24 / M_PER_MILE });
    expect(r.timeSec).toBeCloseTo(1200, 0);
  });
  it('turns a 500m split at 90s into a mile pace', () => {
    const secPerM = paceSecPerMeter(500, 90);
    expect(paceIn(secPerM, 'mi')).toBeCloseTo(289.68, 1); // ~4:49.7/mi
  });
  it('needs two knowns', () => {
    expect(solve({ distanceM: 5000 }).complete).toBe(false);
  });
  it('has track distance presets', () => {
    expect(distancePreset('800m').m).toBe(800);
    expect(distancePreset('marathon').m).toBe(42195);
  });
});

describe('even splits', () => {
  it('splits 5000m/1200s into 5 even km', () => {
    const s = evenSplits(5000, 1200, 'km');
    expect(s).toHaveLength(5);
    expect(s[0].timeSec).toBeCloseTo(240, 3);
    expect(s[4].cumulativeSec).toBeCloseTo(1200, 3);
  });
  it('carries a partial final mile', () => {
    const s = evenSplits(1.5 * M_PER_MILE, 900, 'mi');
    expect(s).toHaveLength(2);
    expect(s[0].full).toBe(true);
    expect(s[1].full).toBe(false);
  });
});

describe('structured workout parser', () => {
  it('parses "6x800m w/ 400m jog"', () => {
    const w = parseStructuredWorkout('6x800m w/ 400m jog');
    expect(w.reps).toBe(6);
    expect(w.work.distanceM).toBe(800);
    expect(w.recovery.kind).toBe('distance');
    expect(w.recovery.distanceM).toBe(400);
    expect(w.totalWorkM).toBe(4800);
  });
  it('parses "10x100 @ 1:30" rest', () => {
    const w = parseStructuredWorkout('10x100 @ 1:30');
    expect(w.reps).toBe(10);
    expect(w.recovery.kind).toBe('time');
    expect(w.recovery.restSec).toBe(90);
  });
  it('returns null on non-rep text', () => {
    expect(parseStructuredWorkout('easy run')).toBeNull();
  });
});
