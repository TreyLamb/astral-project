import { describe, it, expect } from 'vitest';

import { routeEnds, nearestRouteEnd, joinRoutes } from './eftMapGeometry';

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

describe('nearestRouteEnd', () => {
  const routes = [
    route('a', [wp(0, 0), wp(10, 0)]),
    route('b', [wp(10, 1), wp(20, 5)]),
    route('c', [wp(100, 100), wp(200, 200)]),
  ];

  it('finds another route whose end is within reach', () => {
    const hit = nearestRouteEnd(routes, [10, 0], { exceptId: 'a', threshold: 3 });
    expect(hit.routeId).toBe('b');
    expect(hit.end).toBe('start');
  });

  it('ignores the route being dragged', () => {
    // Without exceptId this would happily match route a's own other end.
    expect(nearestRouteEnd(routes, [0, 0], { exceptId: 'a', threshold: 3 })).toBeNull();
  });

  it('respects the threshold', () => {
    expect(nearestRouteEnd(routes, [10, 0], { exceptId: 'a', threshold: 0.5 })).toBeNull();
  });

  it('picks the closest when two are in range', () => {
    const crowded = [...routes, route('d', [wp(10, 0.2), wp(30, 30)])];
    expect(nearestRouteEnd(crowded, [10, 0], { exceptId: 'a', threshold: 5 }).routeId).toBe('d');
  });

  it('skips hidden routes', () => {
    const hidden = [route('a', [wp(0, 0), wp(10, 0)]), route('b', [wp(10, 1), wp(20, 5)], { hidden: true })];
    expect(nearestRouteEnd(hidden, [10, 0], { exceptId: 'a', threshold: 3 })).toBeNull();
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
