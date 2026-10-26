// Geometry on the coordinate plane, as a small toolkit the shape templates draw from.
//
// The point of this file is that the SHAPE is data, not a sentence. A template picks a figure
// (rectangle, rhombus, kite, trapezoid, a right or isosceles triangle...), places it on the grid -
// squared to the axes or TILTED - hides one vertex, and asks for something about it. The same
// toolkit serves missing vertices, side lengths, areas, centers and transformations, so one figure
// produces many different questions instead of one question with different numbers.
//
// Everything here is whole-number geometry on purpose: a real item has an answer you can get with
// pencil and paper, so tilted figures are built from vectors whose LENGTHS are whole numbers too.

export const pt = (x, y) => ({ x, y });
export const P = (p) => `(${p.x}, ${p.y})`;
export const add = (a, b) => pt(a.x + b.x, a.y + b.y);
export const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
export const scale = (a, k) => pt(a.x * k, a.y * k);
export const rotCCW = (a) => pt(-a.y, a.x);
export const rotCW = (a) => pt(a.y, -a.x);
export const swap = (a) => pt(a.y, a.x);
export const same = (a, b) => a.x === b.x && a.y === b.y;
export const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const len = (a) => Math.hypot(a.x, a.y);
export const wholeMid = (a, b) => ((a.x + b.x) % 2 === 0 && (a.y + b.y) % 2 === 0 ? pt((a.x + b.x) / 2, (a.y + b.y) / 2) : null);
export const shoelace = (pts) => Math.abs(pts.reduce((s, p, i) => s + cross(p, pts[(i + 1) % pts.length]), 0)) / 2;
export const distinct = (list) => new Set(list).size === list.length;

/** Vertex labels. A figure is named by its corners in order around it. */
export const LABELS = [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['W', 'X', 'Y', 'Z'], ['J', 'K', 'L', 'M']];

/** Side vectors whose LENGTH is a whole number (3-4-5, 6-8-10, 5-12-13), so a tilted figure has clean sides. */
export const LATTICE = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]];

/** A random lattice vector with a random sign on each part, e.g. (-3, 4). */
export function latticeVec(h) {
  const [a, b] = h.pick(LATTICE);
  return pt(a * (h.int(0, 1) ? 1 : -1), b * (h.int(0, 1) ? 1 : -1));
}

/**
 * A parallelogram family by its two side vectors u (A to B) and v (A to D).
 * kind: 'parallelogram' | 'rectangle' | 'rhombus' | 'square'. `tilted` says whether the sides are slanted.
 * Returns { kind, u, v } with cross(u, v) !== 0.
 */
export function sideVectors(h, kind) {
  const sg = () => (h.int(0, 1) ? 1 : -1);
  const tilted = h.int(0, 1) === 1;
  if (kind === 'square') {
    const u = tilted ? latticeVec(h) : pt(h.int(2, 8) * sg(), 0);
    return { kind, u, v: rotCCW(u) };
  }
  if (kind === 'rectangle') {
    if (tilted) {
      const u = latticeVec(h);
      return { kind, u, v: scale(rotCCW(u), 2) };
    }
    return { kind, u: pt(h.int(2, 9) * sg(), 0), v: pt(0, (h.int(2, 9) + 0) * sg()) };
  }
  if (kind === 'rhombus') {
    const pairs = [[[3, 4], [4, 3]], [[5, 0], [3, 4]], [[0, 5], [4, 3]], [[5, 12], [12, 5]], [[13, 0], [5, 12]], [[0, 13], [12, 5]]];
    const [a, b] = h.pick(pairs);
    return { kind, u: pt(a[0] * sg(), a[1] * sg()), v: pt(b[0] * sg(), b[1] * sg()) };
  }
  return { kind: 'parallelogram', u: pt(h.int(2, 8) * sg(), h.int(-4, 4)), v: pt(h.int(-4, 4), h.int(2, 7) * sg()) };
}

export const KIND_NAME = { parallelogram: 'parallelogram', rectangle: 'rectangle', rhombus: 'rhombus', square: 'square' };
