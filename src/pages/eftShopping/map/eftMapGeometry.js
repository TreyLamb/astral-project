// Pure 2D geometry for zones, routes and corridors.
//
// Everything works in Leaflet's CRS.Simple [y, x] map units. No Leaflet import,
// no React, no state — so the filter engine and the route manifest can be
// tested without a browser.

const EPS = 1e-9;

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Ray casting. Points exactly on an edge are unreliable either way and are not
 * worth special-casing: a marker sitting on a zone border is ambiguous to the
 * user too.
 */
export function pointInPolygon(p, ring) {
  if (!ring || ring.length < 3) return false;
  const [py, px] = p;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [iy, ix] = ring[i];
    const [jy, jx] = ring[j];
    const straddles = (iy > py) !== (jy > py);
    if (straddles && px < ((jx - ix) * (py - iy)) / (jy - iy + EPS) + ix) inside = !inside;
  }
  return inside;
}

export function polygonArea(ring) {
  if (!ring || ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][1] + ring[i][1]) * (ring[j][0] - ring[i][0]);
  }
  return Math.abs(sum / 2);
}

/** Perpendicular distance to a segment, plus how far along it the foot lands. */
export function distanceToSegment(p, a, b) {
  const vy = b[0] - a[0];
  const vx = b[1] - a[1];
  const len2 = vy * vy + vx * vx;
  if (len2 < EPS) return { distance: dist(p, a), t: 0 };
  let t = ((p[0] - a[0]) * vy + (p[1] - a[1]) * vx) / len2;
  t = Math.max(0, Math.min(1, t));
  const foot = [a[0] + t * vy, a[1] + t * vx];
  return { distance: dist(p, foot), t };
}

export function polylineLength(pts) {
  let total = 0;
  for (let i = 1; i < (pts?.length || 0); i++) total += dist(pts[i - 1], pts[i]);
  return total;
}

/**
 * Distance from a point to a polyline, and how far along the line the closest
 * approach happens.
 *
 * `along` is what orders the route manifest: it answers "when do I pass this?"
 * rather than "how near is it?", which is the question you actually have while
 * following a route.
 */
export function distanceToPolyline(p, pts) {
  if (!pts || pts.length === 0) return null;
  if (pts.length === 1) return { distance: dist(p, pts[0]), along: 0, index: 0 };

  let best = { distance: Infinity, along: 0, index: 0 };
  let travelled = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = distanceToSegment(p, a, b);
    if (seg.distance < best.distance) {
      best = { distance: seg.distance, along: travelled + seg.t * dist(a, b), index: i - 1 };
    }
    travelled += dist(a, b);
  }
  return best;
}

/** Index of the first vertex within `threshold`, or -1. */
export function nearestVertex(p, pts, threshold) {
  let bestIdx = -1;
  let bestDist = threshold;
  for (let i = 0; i < (pts?.length || 0); i++) {
    const d = dist(p, pts[i]);
    if (d <= bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Which segment a click landed on, for drag-to-insert. */
export function nearestSegment(p, pts, threshold) {
  let bestIdx = -1;
  let bestDist = threshold;
  for (let i = 1; i < (pts?.length || 0); i++) {
    const { distance } = distanceToSegment(p, pts[i - 1], pts[i]);
    if (distance <= bestDist) {
      bestDist = distance;
      bestIdx = i - 1;
    }
  }
  return bestIdx;
}

/**
 * Circular arc from a to b, bulging perpendicular to the chord.
 *
 * Backs the hold-C curve mode: `bulge` is a signed fraction of the chord
 * length, so flipping its sign mirrors the curve to the other side and scaling
 * it opens or tightens the bend — which is exactly what a scroll wheel maps to.
 */
export function arcBetween(a, b, bulge, samples = 24) {
  if (!bulge) return [a, b];
  const chord = dist(a, b);
  if (chord < EPS) return [a, b];

  const my = (a[0] + b[0]) / 2;
  const mx = (a[1] + b[1]) / 2;
  // Unit normal to the chord, oriented so a positive bulge curves toward
  // increasing y — otherwise scrolling "up" would bend the line downward.
  const ny = (b[1] - a[1]) / chord;
  const nx = -(b[0] - a[0]) / chord;
  const h = bulge * chord;
  const control = [my + ny * h * 2, mx + nx * h * 2];

  // Quadratic Bézier through the offset control point approximates a circular
  // arc closely enough at these scales and stays cheap to re-evaluate on every
  // wheel tick.
  const out = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * control[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * control[1] + t * t * b[1],
    ]);
  }
  return out;
}

/**
 * Expands a route's waypoints into the drawn line.
 *
 * Each waypoint carries the bulge of the segment that arrives at it, so a
 * single route freely mixes straight and curved segments — the default is
 * straight, and holding C while placing gives that one segment a curve.
 */
export function routeToPolyline(waypoints, samplesPerArc = 24) {
  if (!waypoints?.length) return [];
  const pts = [[waypoints[0].y, waypoints[0].x]];
  for (let i = 1; i < waypoints.length; i++) {
    const a = [waypoints[i - 1].y, waypoints[i - 1].x];
    const b = [waypoints[i].y, waypoints[i].x];
    const bulge = waypoints[i].bulge || 0;
    if (!bulge) {
      pts.push(b);
    } else {
      // arcBetween repeats the start point; drop it to avoid a duplicate.
      pts.push(...arcBetween(a, b, bulge, samplesPerArc).slice(1));
    }
  }
  return pts;
}

/** Catmull-Rom through every waypoint, for the smooth-spline route mode. */
export function catmullRom(points, samplesPerSpan = 16) {
  if (!points || points.length < 3) return points ? [...points] : [];
  const pad = [points[0], ...points, points[points.length - 1]];
  const out = [points[0]];
  for (let i = 1; i < pad.length - 2; i++) {
    const [p0, p1, p2, p3] = [pad[i - 1], pad[i], pad[i + 1], pad[i + 2]];
    for (let s = 1; s <= samplesPerSpan; s++) {
      const t = s / samplesPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t
          + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
          + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t
          + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
          + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/** Axis-aligned box as a closed ring, for rectangle zones. */
export function boxRing(a, b) {
  const [y1, y2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [x1, x2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return [[y1, x1], [y1, x2], [y2, x2], [y2, x1]];
}

export function ringBounds(ring) {
  if (!ring?.length) return null;
  let yLo = Infinity;
  let yHi = -Infinity;
  let xLo = Infinity;
  let xHi = -Infinity;
  for (const [y, x] of ring) {
    if (y < yLo) yLo = y;
    if (y > yHi) yHi = y;
    if (x < xLo) xLo = x;
    if (x > xHi) xHi = x;
  }
  return { yLo, yHi, xLo, xHi };
}

/** Cheap reject before the real point-in-polygon test. */
export function inBounds(p, b) {
  return !!b && p[0] >= b.yLo && p[0] <= b.yHi && p[1] >= b.xLo && p[1] <= b.xHi;
}

/**
 * The two loose ends of a route, or null for one too short to have ends.
 * A closed loop has none — it is already joined to itself.
 */
export function routeEnds(route) {
  const wps = route?.waypoints || [];
  if (wps.length < 2 || route.closed) return null;
  return {
    start: [wps[0].y, wps[0].x],
    end: [wps[wps.length - 1].y, wps[wps.length - 1].x],
  };
}

/**
 * The nearest loose end belonging to some OTHER route.
 *
 * This is what makes two separately drawn routes joinable: you finish one near
 * where another began, and the tool can see that rather than leaving you with
 * two lines that merely look connected.
 */
export function nearestRouteEnd(routes, point, { exceptId = null, threshold = Infinity } = {}) {
  let best = null;
  for (const route of routes || []) {
    if (route.id === exceptId || route.hidden) continue;
    const ends = routeEnds(route);
    if (!ends) continue;
    for (const which of ['start', 'end']) {
      const d = dist(point, ends[which]);
      if (d <= threshold && (!best || d < best.distance)) {
        best = { routeId: route.id, end: which, point: ends[which], distance: d };
      }
    }
  }
  return best;
}

/**
 * Concatenate route B onto route A so the two named ends meet.
 *
 * The shared vertex is dropped rather than duplicated — the same rule the
 * loop-closing click follows, and the thing that makes the joined line one
 * route instead of one route with a stutter in it.
 *
 * A keeps its name, colour, corridor and rule: it is the route being extended,
 * not a new third thing. B is removed.
 *
 * Bulges belong to the segment ARRIVING at a waypoint, so reversing a run has
 * to shift them one place as well as flipping the order — otherwise every
 * curve in the reversed half bends the wrong way.
 */
export function joinRoutes(routes, aId, aEnd, bId, bEnd) {
  const a = routes.find((r) => r.id === aId);
  const b = routes.find((r) => r.id === bId);
  if (!a || !b || a === b) return routes;

  const reverse = (wps) => {
    const flipped = [...wps].reverse();
    return flipped.map((w, i) => ({
      ...w,
      bulge: i === 0 ? 0 : -(flipped[i - 1].bulge || 0),
    }));
  };

  // Orient both so A's joining end is last and B's is first.
  const headA = aEnd === 'end' ? a.waypoints : reverse(a.waypoints);
  const tailB = bEnd === 'start' ? b.waypoints : reverse(b.waypoints);

  const waypoints = [...headA, ...tailB.slice(1).map((w, i) => ({
    ...w,
    // The first surviving vertex of B now arrives from A's last, so it keeps
    // the bulge it already had for that hop.
    bulge: i === 0 ? (tailB[1]?.bulge || 0) : w.bulge,
  }))];

  return routes
    .map((r) => (r.id === aId ? { ...r, waypoints, closed: false } : r))
    .filter((r) => r.id !== bId);
}
