import { describe, it, expect } from 'vitest';

import { makeResolver, resolveMarkers, routeManifest } from './eftMapFilters';
import {
  pointInPolygon, distanceToPolyline, nearestVertex, nearestSegment,
  arcBetween, routeToPolyline, boxRing, polylineLength,
} from './eftMapGeometry';
import { autoFit, solveFromPairs, project, calibrationError } from './eftMapProject';

// A..E as five categories, laid out along a horizontal line so a route drawn
// along it is easy to reason about.
const CATS = ['A', 'B', 'C', 'D', 'E'];
const ALL = new Set(CATS);

// One marker of each category at three x positions: inside the corridor,
// inside the zone but off the corridor, and out in open map.
const markers = [];
let id = 0;
for (const [label, y] of [['corridor', 0], ['zoneOnly', 60], ['outside', 500]]) {
  for (const cat of CATS) markers.push({ id: id++, cat, y, x: id * 10, where: label });
}

// Zone covers y in [-200, 200] and x in [-1000, 1000] — contains the corridor
// and zoneOnly rows, excludes the outside row.
const zone = {
  id: 'z1', name: 'SE corner', ring: boxRing([-200, -1000], [200, 1000]),
  rule: { mode: 'only', categories: new Set(['A', 'B', 'C']) },
};

// Route runs along y = 0 with a 40-unit corridor, so only the y=0 row is on it.
const route = {
  polyline: [[0, -1000], [0, 1000]],
  radius: 40,
  rule: { mode: 'only', categories: new Set(['A']) },
};

const visibleAt = (where, opts) => resolveMarkers(markers, opts).visible
  .filter((m) => m.where === where).map((m) => m.cat).sort();

describe("Trey's worked example — route > zone > map-wide", () => {
  const opts = { globalCategories: ALL, zones: [zone], route };

  it('shows only A inside the route corridor', () => {
    expect(visibleAt('corridor', opts)).toEqual(['A']);
  });

  it('shows A B C inside the zone but outside the corridor', () => {
    expect(visibleAt('zoneOnly', opts)).toEqual(['A', 'B', 'C']);
  });

  it('shows all of A B C D E everywhere else', () => {
    expect(visibleAt('outside', opts)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('reports which tier decided each marker', () => {
    const resolve = makeResolver(opts);
    expect(resolve([0, 0], 'A').scope).toBe('route');
    expect(resolve([60, 0], 'A').scope).toBe('zone');
    expect(resolve([500, 0], 'A').scope).toBe('global');
  });
});

describe('tier behaviour', () => {
  it('a maximal zone overrides a restrictive map-wide filter', () => {
    const opts = {
      globalCategories: new Set(['A']),
      zones: [{ ...zone, rule: { mode: 'all' } }],
      route: null,
    };
    expect(visibleAt('zoneOnly', opts)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(visibleAt('outside', opts)).toEqual(['A']);
  });

  it('an inherit zone changes nothing', () => {
    const base = { globalCategories: new Set(['A', 'B']), zones: [], route: null };
    const withZone = { ...base, zones: [{ ...zone, rule: { mode: 'inherit' } }] };
    expect(visibleAt('zoneOnly', withZone)).toEqual(visibleAt('zoneOnly', base));
  });

  it('the topmost overlapping zone wins', () => {
    const lower = { ...zone, id: 'lower', rule: { mode: 'only', categories: new Set(['A', 'B', 'C']) } };
    const upper = { ...zone, id: 'upper', rule: { mode: 'only', categories: new Set(['E']) } };
    const opts = { globalCategories: ALL, zones: [lower, upper], route: null };
    expect(visibleAt('zoneOnly', opts)).toEqual(['E']);
  });

  it('a hidden zone is ignored', () => {
    const opts = { globalCategories: ALL, zones: [{ ...zone, hidden: true }], route: null };
    expect(visibleAt('zoneOnly', opts)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('a zero-radius route falls through to the tiers below', () => {
    const opts = { globalCategories: ALL, zones: [zone], route: { ...route, radius: 0 } };
    expect(visibleAt('corridor', opts)).toEqual(['A', 'B', 'C']);
  });

  it('counts what each tier hid', () => {
    const { hidden } = resolveMarkers(markers, { globalCategories: ALL, zones: [zone], route });
    expect(hidden.byScope.route).toBe(4);
    expect(hidden.byScope.zone).toBe(2);
    expect(hidden.byScope.global).toBe(0);
    expect(hidden.total).toBe(6);
  });
});

describe('route manifest', () => {
  it('orders by distance along the route, not by proximity', () => {
    const spread = [
      { id: 1, cat: 'A', y: 0, x: 900 },
      { id: 2, cat: 'A', y: 0, x: -900 },
      { id: 3, cat: 'A', y: 10, x: 0 },
    ];
    const { rows } = routeManifest(spread, {
      globalCategories: ALL, zones: [], route,
    }, { metresPerUnit: 1 });
    expect(rows.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('reports metres and per-speed times when the map has a scale', () => {
    const m = routeManifest(markers, { globalCategories: ALL, zones: [], route },
      { metresPerUnit: 0.5, speeds: [{ name: 'Walking', speedMps: 2 }] });
    expect(m.totalMetres).toBe(1000);
    expect(m.times[0]).toEqual({ name: 'Walking', seconds: 500 });
  });

  it('leaves distances unitless rather than inventing metres', () => {
    const m = routeManifest(markers, { globalCategories: ALL, zones: [], route }, {});
    expect(m.totalMetres).toBeNull();
    expect(m.rows.every((r) => r.alongMetres === null)).toBe(true);
  });
});

describe('geometry', () => {
  it('point-in-polygon handles a simple box', () => {
    const ring = boxRing([0, 0], [10, 10]);
    expect(pointInPolygon([5, 5], ring)).toBe(true);
    expect(pointInPolygon([15, 5], ring)).toBe(false);
  });

  it('distanceToPolyline measures perpendicular distance and travel', () => {
    const line = [[0, 0], [0, 100]];
    const hit = distanceToPolyline([10, 50], line);
    expect(hit.distance).toBeCloseTo(10);
    expect(hit.along).toBeCloseTo(50);
  });

  it('nearestVertex finds a vertex to LINK to instead of duplicating it', () => {
    const pts = [[0, 0], [0, 50], [50, 50]];
    expect(nearestVertex([2, 1], pts, 10)).toBe(0);
    expect(nearestVertex([25, 25], pts, 10)).toBe(-1);
  });

  it('nearestSegment finds the segment to insert into', () => {
    const pts = [[0, 0], [0, 100]];
    expect(nearestSegment([3, 50], pts, 10)).toBe(0);
    expect(nearestSegment([80, 50], pts, 10)).toBe(-1);
  });

  it('arcBetween bulges to opposite sides for opposite signs', () => {
    const a = [0, 0];
    const b = [0, 100];
    const mid = (arc) => arc[Math.floor(arc.length / 2)];
    expect(mid(arcBetween(a, b, 0.25))[0]).toBeGreaterThan(0);
    expect(mid(arcBetween(a, b, -0.25))[0]).toBeLessThan(0);
  });

  it('a zero bulge is a straight segment', () => {
    expect(arcBetween([0, 0], [0, 10], 0)).toEqual([[0, 0], [0, 10]]);
  });

  it('routeToPolyline mixes straight and curved segments in one route', () => {
    const wps = [{ y: 0, x: 0 }, { y: 0, x: 50 }, { y: 0, x: 100, bulge: 0.3 }];
    const line = routeToPolyline(wps);
    expect(line[0]).toEqual([0, 0]);
    expect(line.length).toBeGreaterThan(3);
    // The curved tail makes the drawn line longer than the straight chord.
    expect(polylineLength(line)).toBeGreaterThan(100);
  });
});

describe('calibration', () => {
  const pts = [{ lat: 0, lng: 0 }, { lat: 1, lng: 2 }];

  it('autoFit maps the marker extent onto the image bounds', () => {
    const cal = autoFit(pts, [[100, 0], [200, 40]]);
    expect(project(cal, 0, 0)).toEqual([100, 0]);
    expect(project(cal, 1, 2)).toEqual([200, 40]);
  });

  it('solveFromPairs recovers an exact transform from two landmarks', () => {
    const truth = { sx: 3, tx: -7, sy: -2, ty: 11 };
    const pairs = pts.map((p) => {
      const [y, x] = project(truth, p.lat, p.lng);
      return { ...p, y, x };
    });
    const res = solveFromPairs(pairs);
    expect(res.ok).toBe(true);
    expect(res.calibration.sx).toBeCloseTo(3);
    expect(res.calibration.sy).toBeCloseTo(-2);
    expect(calibrationError(res.calibration, pairs).worst).toBeLessThan(1e-6);
  });

  it('refuses a degenerate landmark pair instead of returning nonsense', () => {
    const bad = solveFromPairs([{ lat: 1, lng: 5, y: 0, x: 0 }, { lat: 2, lng: 5, y: 9, x: 9 }]);
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/longitude/i);
  });

  it('needs at least two landmarks', () => {
    expect(solveFromPairs([{ lat: 0, lng: 0, y: 0, x: 0 }]).ok).toBe(false);
  });
});
