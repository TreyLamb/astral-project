import { describe, it, expect } from 'vitest';
import { haversineMiles, roadMinutes, rushHourMultiplier, travelMinutes, clusterByProximity } from './travel';

describe('haversineMiles', () => {
  it('matches the known ~69.09mi/degree-of-longitude distance at the equator', () => {
    const d = haversineMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    expect(Math.abs(d - 69.09)).toBeLessThan(0.5);
  });

  it('returns 0 for identical coordinates', () => {
    expect(haversineMiles({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBe(0);
  });

  it('returns null when either point is missing a numeric lat or lng', () => {
    expect(haversineMiles(null, { lat: 0, lng: 0 })).toBeNull();
    expect(haversineMiles({ lat: 0, lng: 0 }, undefined)).toBeNull();
    expect(haversineMiles({ lat: null, lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
    expect(haversineMiles({ lat: 0, lng: undefined }, { lat: 0, lng: 0 })).toBeNull();
    expect(haversineMiles({ lat: 'x', lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
  });
});

describe('roadMinutes', () => {
  it('applies the default speed/road-factor formula', () => {
    // 10mi * 1.3 roadFactor / 30mph * 60 = 26min
    expect(roadMinutes(10)).toBeCloseTo(26, 10);
  });

  it('honors custom avgSpeedMph/roadFactor', () => {
    expect(roadMinutes(60, { avgSpeedMph: 60, roadFactor: 1 })).toBeCloseTo(60, 10);
  });

  it('returns null when miles is null or undefined, instead of treating it as 0', () => {
    expect(roadMinutes(null)).toBeNull();
    expect(roadMinutes(undefined)).toBeNull();
  });
});

describe('rushHourMultiplier', () => {
  it('applies the factor at a window start (inclusive)', () => {
    expect(rushHourMultiplier(7)).toBe(1.35);
    expect(rushHourMultiplier(16)).toBe(1.35);
  });

  it('drops back to 1.0 at a window end (exclusive)', () => {
    expect(rushHourMultiplier(9)).toBe(1.0);
    expect(rushHourMultiplier(18)).toBe(1.0);
  });

  it('applies the factor mid-window and 1.0 outside any window', () => {
    expect(rushHourMultiplier(17)).toBe(1.35);
    expect(rushHourMultiplier(6)).toBe(1.0);
  });

  it('honors a custom windows/factor config', () => {
    const cfg = { windows: [[22, 23]], factor: 2 };
    expect(rushHourMultiplier(22, cfg)).toBe(2);
    expect(rushHourMultiplier(23, cfg)).toBe(1.0);
    expect(rushHourMultiplier(21, cfg)).toBe(1.0);
  });
});

describe('travelMinutes', () => {
  it('returns null when either place is missing coords, rather than guessing', () => {
    expect(travelMinutes({ lat: 0, lng: 0 }, { lat: null, lng: 5 }, 8)).toBeNull();
    expect(travelMinutes(null, { lat: 0, lng: 0 }, 8)).toBeNull();
  });

  it('scales roadMinutes by the rush-hour multiplier for the given hour', () => {
    const from = { lat: 0, lng: 0 };
    const to = { lat: 0, lng: 1 };
    const offPeak = travelMinutes(from, to, 12); // noon: outside default windows
    const rush = travelMinutes(from, to, 8); // inside default 7-9 window
    expect(rush).toBeCloseTo(offPeak * 1.35, 6);
  });

  it('composes haversineMiles + roadMinutes exactly under custom opts', () => {
    const from = { lat: 0, lng: 0 };
    const to = { lat: 0, lng: 1 };
    // avgSpeedMph 60 + roadFactor 1 collapses roadMinutes(miles) to just `miles`
    const got = travelMinutes(from, to, 12, { avgSpeedMph: 60, roadFactor: 1 });
    expect(got).toBeCloseTo(haversineMiles(from, to), 10);
  });
});

describe('clusterByProximity', () => {
  it('groups two near points and isolates one far point', () => {
    const a = { id: 'a', lat: 0, lng: 0 };
    const b = { id: 'b', lat: 0, lng: 0.02 }; // ~1.4mi from a
    const c = { id: 'c', lat: 0, lng: 5 }; // ~345mi from a
    expect(clusterByProximity([a, b, c], 10)).toEqual([['a', 'b'], ['c']]);
  });

  it('gives an item with missing coords its own singleton cluster, never merged', () => {
    const a = { id: 'a', lat: 0, lng: 0 };
    const x = { id: 'x', lat: null, lng: 5 };
    const b = { id: 'b', lat: 0, lng: 0.02 };
    expect(clusterByProximity([a, x, b], 10)).toEqual([['a', 'b'], ['x']]);
  });

  it('only compares new items against a cluster\'s original seed, not its latest member', () => {
    // p1-p2 near, p2-p3 near, but p1-p3 far: a naive "compare to last member"
    // implementation would chain all three together; seed-only should not.
    const p1 = { id: 'p1', lat: 0, lng: 0 };
    const p2 = { id: 'p2', lat: 0, lng: 0.05 }; // ~3.45mi from p1
    const p3 = { id: 'p3', lat: 0, lng: 0.1 }; // ~3.45mi from p2, ~6.9mi from p1 (seed)
    expect(clusterByProximity([p1, p2, p3], 5)).toEqual([['p1', 'p2'], ['p3']]);
  });

  it('is deterministic w.r.t. input order (reordering can change which item is the seed)', () => {
    const p1 = { id: 'p1', lat: 0, lng: 0 };
    const p2 = { id: 'p2', lat: 0, lng: 0.05 };
    const p3 = { id: 'p3', lat: 0, lng: 0.1 };
    // p3 first as seed: p1 is ~6.9mi away (out of radius) so it seeds its own
    // cluster; p2 then checks p3's cluster first (~3.45mi, joins) before ever
    // reaching p1's cluster.
    expect(clusterByProximity([p3, p1, p2], 5)).toEqual([['p3', 'p2'], ['p1']]);
  });
});
