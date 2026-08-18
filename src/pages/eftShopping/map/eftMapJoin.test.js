import { describe, it, expect } from 'vitest';

import {
  routeEnds, joinRoutes, bestJoin, overlapRun,
} from './eftMapGeometry';

const wp = (y, x, bulge = 0) => ({ y, x, bulge });

const route = (id, pts, extra = {}) => ({
  id,
  name: id,
  waypoints: pts,
  closed: false,
  closeBulge: 0,
  radius: 40,
  color: '#ff2fa0',
  hidden: false,
  ...extra,
});

describe('routeEnds', () => {
  it('gives the first and last point', () => {
    expect(routeEnds(route('a', [wp(0, 0), wp(1, 1), wp(2, 2)])))
      .toEqual({ start: [0, 0], end: [2, 2] });
  });

  it('has none for a closed loop — it is already joined to itself', () => {
    expect(routeEnds(route('a', [wp(0, 0), wp(1, 1), wp(2, 2)], { closed: true }))).toBeNull();
  });

  it('has none for a route too short to have two ends', () => {
    expect(routeEnds(route('a', [wp(0, 0)]))).toBeNull();
    expect(routeEnds(route('a', []))).toBeNull();
  });
});

describe('joinRoutes', () => {
  const a = route('a', [wp(0, 0), wp(5, 0), wp(10, 0)], { name: 'North run', color: '#ff2fa0', radius: 60 });
  const b = route('b', [wp(10, 0), wp(15, 5), wp(20, 10)], { name: 'South run', color: '#00e0ff', radius: 20 });

  it('makes one route out of two', () => {
    const out = joinRoutes([a, b], 'a', 'end', 'b', 'start');
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a');
  });

  it('drops the shared vertex instead of duplicating it', () => {
    const out = joinRoutes([a, b], 'a', 'end', 'b', 'start');
    // 3 + 3 with one shared = 5, not 6.
    expect(out[0].waypoints).toHaveLength(5);
    const coords = out[0].waypoints.map((w) => [w.y, w.x]);
    expect(coords).toEqual([[0, 0], [5, 0], [10, 0], [15, 5], [20, 10]]);
  });

  it('keeps the absorbing route’s own name, colour and corridor', () => {
    const out = joinRoutes([a, b], 'a', 'end', 'b', 'start');
    expect(out[0].name).toBe('North run');
    expect(out[0].color).toBe('#ff2fa0');
    expect(out[0].radius).toBe(60);
  });

  it('reverses B when it is B’s END that meets A', () => {
    const bFlipped = route('b', [wp(20, 10), wp(15, 5), wp(10, 0)]);
    const out = joinRoutes([a, bFlipped], 'a', 'end', 'b', 'end');
    expect(out[0].waypoints.map((w) => [w.y, w.x]))
      .toEqual([[0, 0], [5, 0], [10, 0], [15, 5], [20, 10]]);
  });

  it('reverses A when it is A’s START that meets B', () => {
    const bBefore = route('b', [wp(-10, 0), wp(-5, 0), wp(0, 0)]);
    const out = joinRoutes([a, bBefore], 'a', 'start', 'b', 'end');
    // A is flipped so its start becomes the join, then B runs on from there.
    expect(out[0].waypoints[0]).toMatchObject({ y: 10, x: 0 });
    expect(out[0].waypoints).toHaveLength(5);
  });

  it('flips the sign of a bulge on the reversed half, so curves do not invert', () => {
    const curvedB = route('b', [wp(20, 10), wp(15, 5, 0.8), wp(10, 0, 0.4)]);
    const out = joinRoutes([a, curvedB], 'a', 'end', 'b', 'end');
    const bulges = out[0].waypoints.map((w) => w.bulge);
    // The two curved hops survive, negated, rather than bending the other way.
    expect(bulges).toContain(-0.8);
  });

  it('opens a loop it just extended, since it is no longer closed', () => {
    const closedA = route('a', [wp(0, 0), wp(5, 0), wp(10, 0)], { closed: true });
    expect(joinRoutes([closedA, b], 'a', 'end', 'b', 'start')[0].closed).toBe(false);
  });

  it('leaves everything alone when either id is unknown', () => {
    expect(joinRoutes([a, b], 'a', 'end', 'nope', 'start')).toHaveLength(2);
    expect(joinRoutes([a, b], 'nope', 'end', 'b', 'start')).toHaveLength(2);
  });

  it('refuses to join a route to itself', () => {
    expect(joinRoutes([a, b], 'a', 'end', 'a', 'start')).toHaveLength(2);
  });

  it('does not disturb a third route', () => {
    const c = route('c', [wp(99, 99), wp(98, 98)]);
    const out = joinRoutes([a, b, c], 'a', 'end', 'b', 'start');
    expect(out.map((r) => r.id)).toEqual(['a', 'c']);
  });
});

describe('bestJoin', () => {
  const a = route('a', [wp(0, 0), wp(10, 0)]);

  it('takes the pair of ends that are actually closest', () => {
    // B runs back toward A, so it is B's END that meets A's end.
    const b = route('b', [wp(40, 0), wp(10.2, 0)]);
    expect(bestJoin(a, b)).toMatchObject({ aEnd: 'end', bEnd: 'end' });
  });

  it('will flip A when B sits before it', () => {
    const b = route('b', [wp(-40, 0), wp(-0.2, 0)]);
    expect(bestJoin(a, b)).toMatchObject({ aEnd: 'start', bEnd: 'end' });
  });

  it('reports the gap so the caller can decide whether to weld', () => {
    const b = route('b', [wp(13, 0), wp(40, 0)]);
    expect(bestJoin(a, b).distance).toBeCloseTo(3, 6);
  });

  it('prefers end→start on a tie — the natural carry-straight-on reading', () => {
    const b = route('b', [wp(10, 0), wp(20, 0), wp(10, 0)]);
    expect(bestJoin(a, b)).toMatchObject({ aEnd: 'end', bEnd: 'start', distance: 0 });
  });

  it('is null when either route has no loose ends', () => {
    expect(bestJoin(a, route('b', [wp(0, 0)]))).toBeNull();
    expect(bestJoin(a, route('b', [wp(0, 0), wp(1, 1), wp(2, 2)], { closed: true }))).toBeNull();
  });
});

describe('joinRoutes merge count', () => {
  const a = route('a', [wp(0, 0), wp(10, 0)]);

  it('keeps both vertices when nothing is merged', () => {
    const b = route('b', [wp(30, 0), wp(40, 0)]);
    const out = joinRoutes([a, b], 'a', 'end', 'b', 'start', { merge: 0 });
    expect(out[0].waypoints.map((w) => [w.y, w.x]))
      .toEqual([[0, 0], [10, 0], [30, 0], [40, 0]]);
  });

  it('gives a brand new connecting hop no curve of its own', () => {
    const b = route('b', [wp(30, 0, 0.9), wp(40, 0, 0.5)]);
    const out = joinRoutes([a, b], 'a', 'end', 'b', 'start', { merge: 0 });
    expect(out[0].waypoints[2].bulge).toBe(0);
    expect(out[0].waypoints[3].bulge).toBe(0.5);
  });

  it('drops as many of B’s points as the two routes share', () => {
    // A and B both end on the same three-point tail, B arriving from elsewhere.
    const tailA = route('a', [wp(0, 0), wp(5, 0), wp(6, 0), wp(7, 0)]);
    const tailB = route('b', [wp(0, 9), wp(5, 0), wp(6, 0), wp(7, 0)]);
    const pick = bestJoin(tailA, tailB, 0.01);
    expect(pick).toMatchObject({ aEnd: 'end', bEnd: 'end', overlap: 3 });
    const out = joinRoutes([tailA, tailB], 'a', pick.aEnd, 'b', pick.bEnd, { merge: pick.overlap });
    // 4 + 4 sharing 3 = 5, and the shared tail appears exactly once.
    expect(out[0].waypoints.map((w) => [w.y, w.x]))
      .toEqual([[0, 0], [5, 0], [6, 0], [7, 0], [0, 9]]);
  });

  it('merges a long overlap in full rather than capping it', () => {
    const long = (id, lead) => route(id, [lead, ...Array.from({ length: 30 }, (_, i) => wp(i, 0))]);
    const la = long('a', wp(-100, -100));
    const lb = long('b', wp(-200, -200));
    const pick = bestJoin(la, lb, 0.01);
    expect(pick.overlap).toBe(30);
    const out = joinRoutes([la, lb], 'a', pick.aEnd, 'b', pick.bEnd, { merge: pick.overlap });
    expect(out[0].waypoints).toHaveLength(32);
    expect(out[0].waypoints[31]).toMatchObject({ y: -200, x: -200 });
  });

  it('never drops more than B has', () => {
    const b = route('b', [wp(10, 0), wp(20, 0)]);
    expect(joinRoutes([a, b], 'a', 'end', 'b', 'start', { merge: 99 })[0].waypoints)
      .toHaveLength(2);
  });

  it('still merges one point by default, for callers that pass no count', () => {
    const b = route('b', [wp(10, 0), wp(20, 0)]);
    expect(joinRoutes([a, b], 'a', 'end', 'b', 'start')[0].waypoints).toHaveLength(3);
  });
});

describe('overlapRun', () => {
  const tol = 0.5;

  it('counts a shared tail from both routes’ ends', () => {
    const a = route('a', [wp(0, 0), wp(5, 0), wp(6, 0), wp(7, 0)]);
    const b = route('b', [wp(0, 9), wp(5, 0.1), wp(6, 0), wp(7, 0)]);
    expect(overlapRun(a, b, 'end', 'end', tol)).toBe(3);
  });

  it('counts a shared head when both routes start together', () => {
    const a = route('a', [wp(0, 0), wp(1, 0), wp(2, 0), wp(50, 50)]);
    const b = route('b', [wp(0, 0), wp(1, 0), wp(2, 0), wp(-50, -50)]);
    expect(overlapRun(a, b, 'start', 'start', tol)).toBe(3);
  });

  it('stops at the first pair that drifts apart — the run must be contiguous', () => {
    // Points 0 and 1 coincide, point 2 does not, point 3 does again.
    const a = route('a', [wp(9, 9), wp(3, 0), wp(2, 0), wp(1, 0), wp(0, 0)]);
    const b = route('b', [wp(8, 8), wp(3, 0), wp(2, 40), wp(1, 0), wp(0, 0)]);
    expect(overlapRun(a, b, 'end', 'end', tol)).toBe(2);
  });

  it('is 1 for two routes that merely touch end to end', () => {
    const a = route('a', [wp(0, 0), wp(10, 0)]);
    const b = route('b', [wp(10, 0), wp(20, 0)]);
    expect(overlapRun(a, b, 'end', 'start', tol)).toBe(1);
  });

  it('is 0 when the ends are nowhere near each other', () => {
    const a = route('a', [wp(0, 0), wp(10, 0)]);
    const b = route('b', [wp(90, 90), wp(99, 99)]);
    expect(overlapRun(a, b, 'end', 'start', tol)).toBe(0);
  });

  it('never runs past the shorter route', () => {
    const a = route('a', [wp(0, 0), wp(1, 0), wp(2, 0)]);
    const b = route('b', [wp(1, 0), wp(2, 0)]);
    expect(overlapRun(a, b, 'end', 'end', tol)).toBe(2);
  });
});

describe('bestJoin ranks by shared run, not by nearest ends', () => {
  it('prefers a real overlap over a closer pair of endpoints that shares nothing', () => {
    const a = route('a', [wp(0, 0), wp(1, 0), wp(2, 0), wp(3, 0)]);
    // b's START is a hair from a's start but heads straight off; b's END runs
    // back along a's tail for three points.
    const b = route('b', [wp(0, 0.01), wp(80, 80), wp(1, 0), wp(2, 0), wp(3, 0)]);
    const pick = bestJoin(a, b, 0.5);
    expect(pick).toMatchObject({ aEnd: 'end', bEnd: 'end', overlap: 3 });
  });

  it('falls back to the nearest ends when nothing overlaps', () => {
    const a = route('a', [wp(0, 0), wp(10, 0)]);
    const b = route('b', [wp(40, 0), wp(10.2, 0)]);
    expect(bestJoin(a, b, 0.05)).toMatchObject({ aEnd: 'end', bEnd: 'end', overlap: 0 });
  });
});
