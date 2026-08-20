// Block Counting (Part B.4). Pure geometry - no React, no storage, no randomness except the
// seeded pile builder at the bottom.
//
// ---------------------------------------------------------------------------------------
// THE RULE, verbatim from the AFPC Form T pamphlet:
//
//   "Blocks are considered touching only if all or part of their faces touch. Blocks that
//    only touch corners do not count. All of the blocks in each pile are the same size and
//    shape."
//
// The pamphlet then works the corner exclusion out loud on sample S3, which is the single
// most useful sentence in the whole document:
//
//   "S3 touches the faces of the two blocks above it, the two blocks below it, and the
//    blocks directly to the right and left of it. It does not touch the faces of the two
//    blocks diagonally below it to the right or left. These blocks only touch the corners
//    of S3 and do not count. Therefore, S3 touches six blocks."
//
// Six, not eight. Encoded here as `contactArea`, which returns a POSITIVE AREA or zero:
// two boxes touch iff they are flush on exactly one axis and overlap with real extent on
// both of the others. Sharing only an edge (a line) or a corner (a point) gives zero.
//
// ---------------------------------------------------------------------------------------
// 🔴 A BLOCK CAN TOUCH MORE THAN SIX OTHERS. The piles are NOT a lattice of cubes.
//
// This is the property that decides whether the generator is the real subtest or a
// different exercise, and it is the same trap Table Reading fell into in Phase 4 - the
// research dossier was simply silent about it.
//
// In an axis-aligned lattice of cubes, a block has one neighbour per direction and at most
// six in total. But the Form S pamphlet keys its S3 at SEVEN ("three blocks above, three
// blocks below, and one block on the right"), and published explanations say "three above",
// "two below", "two to the left" as a matter of course. A cube-lattice generator cannot
// even represent the official worked example.
//
// The blocks are identical CUBOIDS laid in courses that cross from layer to layer, so one
// block's top face is shared with three of the blocks above it. That is reproduced here by
// alternating each layer's orientation - see `buildPile`.
// ---------------------------------------------------------------------------------------

import { mulberry32, shuffle } from '../../engine/rng.js';

/**
 * Long axis of a block, in grid units. Every block in a pile is len x 1 x 1, rotated to lie
 * along X or Y - "all of the blocks in each pile are the same size and shape".
 *
 * BOTH lengths are officially attested and a pile picks one:
 *   len 2 -> a block has TWO above and TWO below. This is the Form T pamphlet's sample S3,
 *            which totals 6.
 *   len 3 -> THREE above and three below. This is the Form S sample (7) and the phrasing
 *            used throughout afoqtguide's explanations.
 * The counting rule is identical either way; only the arithmetic moves.
 */
export const LENGTHS = [2, 3];
export const L = 3;

/**
 * How many blocks carry a printed number on one pile. The real test runs 5-13 questions off a
 * single figure, so a fixed six is authentic - and it is also the whole `stemSpace` of this
 * subtest, because the only thing that varies in the question TEXT is which number is named.
 * Everything else that makes one item differ from another lives in the picture.
 */
export const NUMBERED_PER_PILE = 6;

/** A block is an axis-aligned box: [x, x+dx) x [y, y+dy) x [z, z+dz), integer coordinates. */
export const makeBlock = (id, x, y, z, dx, dy, dz) => ({ id, x, y, z, dx, dy, dz });

const lo = (b, axis) => b[axis];
const hi = (b, axis) => b[axis] + b['d' + axis];

/** Signed overlap of two blocks on one axis: >0 interpenetrating extent, 0 flush, <0 apart. */
const overlap = (a, b, axis) => Math.min(hi(a, axis), hi(b, axis)) - Math.max(lo(a, axis), lo(b, axis));

/**
 * Shared FACE area between two blocks - the pamphlet's rule as a number.
 *
 * Flush on exactly one axis and genuinely overlapping on the other two => real face contact.
 * Flush on two axes is an edge (a line, zero area). Flush on three is a corner (a point).
 * Both correctly return 0, which is what "blocks that only touch corners do not count" means.
 */
export function contactArea(a, b) {
  if (a.id === b.id) return 0;
  const ov = { x: overlap(a, b, 'x'), y: overlap(a, b, 'y'), z: overlap(a, b, 'z') };
  if (ov.x < 0 || ov.y < 0 || ov.z < 0) return 0; // disjoint

  const flush = ['x', 'y', 'z'].filter((k) => ov[k] === 0);
  if (flush.length !== 1) return 0; // 0 = interpenetrating, 2 = edge, 3 = corner
  const rest = ['x', 'y', 'z'].filter((k) => k !== flush[0]);
  return ov[rest[0]] * ov[rest[1]];
}

export const touching = (a, b) => contactArea(a, b) > 0;

/** Blocks that meet ONLY along an edge or at a corner - the ones that must not be counted. */
export const cornerTouching = (a, b) => {
  if (a.id === b.id || touching(a, b)) return false;
  const ov = ['x', 'y', 'z'].map((k) => overlap(a, b, k));
  return ov.every((v) => v >= 0) && ov.filter((v) => v === 0).length >= 2;
};

/** THE ANSWER: how many other blocks does this one touch, face to face. */
export function touchCount(pile, id) {
  const target = pile.find((b) => b.id === id);
  return pile.reduce((n, b) => n + (touching(target, b) ? 1 : 0), 0);
}

/**
 * The count broken out the way the pamphlet narrates its own samples - "the two blocks above
 * it, the two blocks below it, and the blocks directly to the right and left of it". An
 * explanation that names the parts teaches the scan order; one that just asserts "5" does not.
 */
export function touchBreakdown(pile, id) {
  const target = pile.find((b) => b.id === id);
  const out = { above: 0, below: 0, beside: 0, corner: 0, total: 0 };
  for (const b of pile) {
    if (b.id === id) continue;
    if (touching(target, b)) {
      out.total++;
      if (b.z >= target.z + target.dz) out.above++;
      else if (b.z + b.dz <= target.z) out.below++;
      else out.beside++;
    } else if (cornerTouching(target, b)) out.corner++;
  }
  return out;
}

/** Error mode: counted the diagonals too. The exact mistake the pamphlet warns about. */
export function cornerInclusiveCount(pile, id) {
  const target = pile.find((b) => b.id === id);
  return pile.reduce((n, b) => n + (touching(target, b) || cornerTouching(target, b) ? 1 : 0), 0);
}

/** Error mode: counted only what you could see, never "saw into" the pile. */
export function visibleOnlyCount(pile, id, visibleIds) {
  const target = pile.find((b) => b.id === id);
  return pile.reduce((n, b) => n + (touching(target, b) && visibleIds.has(b.id) ? 1 : 0), 0);
}

// ---------------------------------------------------------------------------------------
// Isometric projection.
//
// Camera looks down the (1,1,1) axis, so the visible faces are +x (screen right), +y (screen
// left) and +z (top) - the same three-faces-of-a-corner view the official figure uses.
// Depth is x+y+z: larger is nearer, so painter's algorithm draws ascending.
// ---------------------------------------------------------------------------------------

const COS30 = Math.cos(Math.PI / 6);

export const projectPoint = ([x, y, z]) => [(x - y) * COS30, (x + y) * 0.5 - z];

const depthOf = (b) => b.x + b.dx / 2 + b.y + b.dy / 2 + b.z + b.dz / 2;

/** The three camera-facing faces of one block, as projected polygons. */
export function blockFaces(b) {
  const [x0, y0, z0] = [b.x, b.y, b.z];
  const [x1, y1, z1] = [b.x + b.dx, b.y + b.dy, b.z + b.dz];
  return [
    { face: 'top',   points: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    { face: 'right', points: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] },
    { face: 'left',  points: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
  ].map((f) => ({ ...f, poly: f.points.map(projectPoint) }));
}

/** Far-to-near draw order. Same-size boxes on a grid never interleave, so this is exact. */
export const paintOrder = (pile) => [...pile].sort((a, b) => depthOf(a) - depthOf(b));

const polyArea = (poly) => Math.abs(poly.reduce((s, [x1, y1], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return s + x1 * y2 - x2 * y1;
}, 0)) / 2;

const centroid = (poly) => [
  poly.reduce((s, p) => s + p[0], 0) / poly.length,
  poly.reduce((s, p) => s + p[1], 0) / poly.length,
];

const pointInPoly = ([px, py], poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/**
 * Where to print a block's number, or null if the block cannot be seen at all.
 *
 * A question about a block nobody can find is unanswerable, so this is a correctness
 * concern rather than a cosmetic one: it is what guarantees every numbered block is
 * actually on the surface facing the viewer.
 */
/** Half-width of the clear disc a printed digit needs, in grid units. */
const LABEL_CLEARANCE = 0.34;

export function labelAnchor(pile, id) {
  const order = paintOrder(pile);
  const idx = order.findIndex((b) => b.id === id);
  const nearer = order.slice(idx + 1);
  const faces = blockFaces(order[idx]).sort((a, b) => polyArea(b.poly) - polyArea(a.poly));

  // Probing the centroid alone is not enough: a face can be four-fifths hidden behind a
  // nearer block and still have an exposed centre, which printed the digit half off the
  // edge of a sliver. Require a whole disc of clearance, inside the face and unoccluded.
  const ring = [[0, 0], ...Array.from({ length: 8 }, (_, i) => {
    const t = (i * Math.PI) / 4;
    return [Math.cos(t) * LABEL_CLEARANCE, Math.sin(t) * LABEL_CLEARANCE];
  })];

  for (const f of faces) {
    const c = centroid(f.poly);
    const probes = ring.map(([dx, dy]) => [c[0] + dx, c[1] + dy]);
    const clear = probes.every((p) => pointInPoly(p, f.poly)
      && !nearer.some((n) => blockFaces(n).some((nf) => pointInPoly(p, nf.poly))));
    if (clear) return { at: c, face: f.face, area: polyArea(f.poly) };
  }
  return null;
}

export const visibleBlocks = (pile) => pile.filter((b) => labelAnchor(pile, b.id) !== null);

// ---------------------------------------------------------------------------------------
// Pile construction.
//
// Layers alternate orientation, which is what produces "three blocks above" and the
// diagonal corner contacts that must not be counted.
//
// Two fairness rules, both deliberate:
//   1. NO ENCLOSED VOIDS. Every layer is solid within its footprint and blocks are only ever
//      removed from the top down, so a candidate can infer exactly what is underneath. A
//      hidden block you could not possibly deduce would make the question a coin flip.
//   2. NO FLOATING BLOCKS. A block is only removed when nothing rests on it.
// ---------------------------------------------------------------------------------------

function fullLayer(z, w, d, alongX, idFrom, len) {
  const out = [];
  let id = idFrom;
  if (alongX) {
    for (let y = 0; y < d; y++) for (let x = 0; x < w; x += len) out.push(makeBlock(id++, x, y, z, len, 1, 1));
  } else {
    for (let x = 0; x < w; x++) for (let y = 0; y < d; y += len) out.push(makeBlock(id++, x, y, z, 1, len, 1));
  }
  return out;
}

/** Blocks in the layer above that rest on this one. */
const supports = (pile, b) => pile.filter((o) => o.z === b.z + 1 && contactArea(b, o) > 0);

const connected = (pile) => {
  if (!pile.length) return false;
  const seen = new Set([pile[0].id]);
  const queue = [pile[0]];
  while (queue.length) {
    const cur = queue.pop();
    for (const o of pile) if (!seen.has(o.id) && touching(cur, o)) { seen.add(o.id); queue.push(o); }
  }
  return seen.size === pile.length;
};

/**
 * A pile for one figure. `sheetSeed` alone decides it, so a whole drill run shares one pile
 * exactly as the real subtest does - one image, many numbered questions.
 */
export function buildPile(sheetSeed) {
  const rng = mulberry32(sheetSeed >>> 0);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  for (let attempt = 0; attempt < 40; attempt++) {
    const len = pick(LENGTHS);
    const w = pick([len, len, len * 2]);
    const d = pick([len, len, len * 2]);
    const layers = pick([3, 4, 4, 5]);
    const startAlongX = rng() < 0.5;

    let pile = [];
    for (let z = 0; z < layers; z++) {
      pile = pile.concat(fullLayer(z, w, d, startAlongX ? z % 2 === 0 : z % 2 === 1, pile.length + 1, len));
    }
    if (pile.length > 26) continue; // legibility ceiling

    // Carve steps from the top down. Only ever remove a block with nothing resting on it.
    const target = Math.max(8, Math.round(pile.length * (0.55 + rng() * 0.25)));
    for (let pass = 0; pass < 4 && pile.length > target; pass++) {
      const exposed = shuffle(pile.filter((b) => supports(pile, b).length === 0), rng)
        .sort((a, b) => b.z - a.z);
      for (const b of exposed) {
        if (pile.length <= target) break;
        const rest = pile.filter((o) => o.id !== b.id);
        if (connected(rest)) pile = rest;
      }
    }

    if (pile.length < 8 || !connected(pile)) continue;

    const visible = visibleBlocks(pile);
    const answerable = visible.filter((b) => {
      const n = touchCount(pile, b.id);
      return n >= 2 && n <= 9;
    });
    if (answerable.length < NUMBERED_PER_PILE) continue;

    // The numbered blocks, in reading order down the page, like the real figure.
    const numbered = shuffle(answerable, rng)
      .slice(0, NUMBERED_PER_PILE)
      .sort((a, b) => {
        const [, ay] = labelAnchor(pile, a.id).at;
        const [, by] = labelAnchor(pile, b.id).at;
        return ay - by;
      })
      .map((b, i) => ({ blockId: b.id, label: i + 1 }));

    return { blocks: pile, numbered, visibleIds: new Set(visible.map((b) => b.id)) };
  }
  return null;
}
