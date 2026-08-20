// The Table Reading grid: pure geometry and pure arithmetic, no React.
//
// Why this file exists separately from the renderer and from the templates: the grid has to be
// generated identically by three different consumers - the template (which needs cell values to
// build error-mode distractors), the renderer (which draws all 1089 cells), and the QC scripts
// (which run on plain Node). Keeping it pure is what lets `npm run afoqt:selftest` audit Table
// Reading without a browser.
//
// ---------------------------------------------------------------------------------------
// THE FIELD IS GRADUAL. This is the whole subtest, and getting it wrong makes the drill a
// different exercise from the test. Corrected 2026-08-20 against the AFPC pamphlet's own
// sample table, which is reproduced here verbatim:
//
//         -3  -2  -1   0  +1  +2  +3
//   +3    25  26  28  30  31  32  33
//   +2    26  28  30  32  33  34  35
//   +1    27  29  31  33  35  36  37
//    0    29  30  32  34  36  37  38
//   -1    30  32  33  35  37  38  40
//   -2    31  33  34  36  38  39  41
//   -3    32  34  35  37  39  40  42
//
// Every step right and every step DOWN adds one or two. Nothing jumps. Two consequences:
//
//   1. THE FIVE OPTIONS CLUSTER. The pamphlet's own first item answers 33 and offers
//      35 / 36 / 30 / 33 / 34. You cannot eliminate anything, and an off-by-one slip lands on a
//      number one away from the right one, so there is no way to feel the mistake. That is why
//      the subtest is hard, and a grid of unrelated numbers would not reproduce it.
//   2. IT IS NOT SEPARABLE. Row deltas differ from row to row (+3 runs 1,2,2,1,1,1 while +1
//      runs 2,2,2,2,1,1), so there is no formula to shortcut the lookup with. The construction
//      below reproduces both properties at once - see gridFor().
//
// ~ An earlier version of this file generated uniform random values in 0-999, on the strength
//   of a "non-monotone, 2-3 digits" line in RESEARCH.md that carried no citation, no quote and
//   no backing item. The official sample and an independent commercial source both say
//   gradual. See docs/afoqt/RESEARCH.md for the correction and its sources.
// ---------------------------------------------------------------------------------------
//
// The other spec points, all still standing:
//   - The real grid is about 33x33 (official items use X -16..+16, Y -17..+15). The 7x7 above
//     is a TEACHING sample, not the test.
//   - X ASCENDS left-to-right across the top.
//   - Y DESCENDS top-to-bottom down the left side. The single most common misread.
//   - Values carry LEADING ZEROS. A 33x33 gradual field spans roughly 010 to 130, so a grid is
//     printed at a fixed width and the small values pad - which is exactly how both `02` and
//     `090` end up in the record: a 7x7 teaching grid pads to two, a full-size one to three.
//   - Five options, all near-miss values drawn from the SAME table.
//   - No straight edge is permitted, which is why the skill being trained is scanning
//     discipline rather than arithmetic.

export const X_MIN = -16;
export const X_MAX = 16;
export const Y_TOP = 15;
export const Y_BOTTOM = -17;

export const COLS = X_MAX - X_MIN + 1; // 33
export const ROWS = Y_TOP - Y_BOTTOM + 1; // 33

export const X_VALUES = Array.from({ length: COLS }, (_, i) => X_MIN + i);
/** Descending on purpose. Reversing this line is the bug the whole subtest is about. */
export const Y_VALUES = Array.from({ length: ROWS }, (_, i) => Y_TOP - i);

export const colIndex = (x) => x - X_MIN;
export const rowIndex = (y) => Y_TOP - y;
export const inRangeX = (x) => x >= X_MIN && x <= X_MAX;
export const inRangeY = (y) => y >= Y_BOTTOM && y <= Y_TOP;
export const inGrid = (x, y) => inRangeX(x) && inRangeY(y);

/** murmur3 fmix32 over three inputs. Well-mixed, so the jitter shows no visible pattern. */
function hash32(a, b, c) {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b + 0x85ebca6b), 0xcc9e2d51);
  h = (h << 15) | (h >>> 17);
  h = Math.imul(h ^ (c + 0x27d4eb2f), 0x1b873593);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const BASE_TAG = 307;

/**
 * One whole grid, built once per sheet and cached.
 *
 * Two properties have to hold together, and they pull against each other:
 *
 *   STRICTLY INCREASING BY 1 OR 2 in both directions, matching the official sample exactly.
 *   Equal neighbours would be wrong (the real table never repeats side by side) and would also
 *   collapse a slip-by-one distractor onto the answer.
 *
 *   NOT SEPARABLE. `rowOffset + colOffset` would give every row identical deltas, which the
 *   official sample contradicts (row +3 runs 1,2,2,1,1,1 while row +1 runs 2,2,2,2,1,1) and
 *   which would hand a test-taker a formula instead of a lookup.
 *
 * The construction walks the grid once. Each cell takes the smallest value that is at least one
 * more than the cell to its left AND the cell above it, then optionally adds one more when a
 * seeded bit says so and doing it would not push either delta past two. That last clause is
 * what keeps both properties true at the same time.
 */
const GRID_CACHE = { seed: null, grid: null };

function gridFor(sheetSeed) {
  if (GRID_CACHE.seed === sheetSeed) return GRID_CACHE.grid;
  const v = new Int32Array(ROWS * COLS);
  const base = 4 + (hash32(sheetSeed, BASE_TAG, 0) % 17);
  v[0] = base;
  for (let c = 1; c < COLS; c++) v[c] = v[c - 1] + 1 + (hash32(sheetSeed, 0, c) & 1);
  for (let r = 1; r < ROWS; r++) {
    v[r * COLS] = v[(r - 1) * COLS] + 1 + (hash32(sheetSeed, r, 0) & 1);
    for (let c = 1; c < COLS; c++) {
      const left = v[r * COLS + c - 1];
      const up = v[(r - 1) * COLS + c];
      const lo = Math.max(left, up) + 1;
      const bump = hash32(sheetSeed, r, c) & 1;
      v[r * COLS + c] = bump && lo + 1 - left <= 2 && lo + 1 - up <= 2 ? lo + 1 : lo;
    }
  }
  const max = v[ROWS * COLS - 1];
  // Padded to a fixed width per grid, so every cell is the same shape and the small ones carry
  // leading zeros. Never less than two - a single-digit column would be a visual anchor the
  // real table does not give you.
  const grid = { v, base, max, width: Math.max(2, String(max).length) };
  GRID_CACHE.seed = sheetSeed;
  GRID_CACHE.grid = grid;
  return grid;
}

/** The value in one cell. */
export function cellValue(sheetSeed, x, y) {
  return gridFor(sheetSeed).v[rowIndex(y) * COLS + colIndex(x)];
}

/** How many characters every cell in this grid is printed to. */
export const sheetWidth = (sheetSeed) => gridFor(sheetSeed).width;

/** The value at (x, y) as it is printed in the table, leading zeros and all. */
export const valueAt = (sheetSeed, x, y) =>
  String(cellValue(sheetSeed, x, y)).padStart(gridFor(sheetSeed).width, '0');

/** Whole grid, row-major top-to-bottom. Only the renderer needs this. */
export function sheetRows(sheetSeed) {
  return Y_VALUES.map((y) => ({
    y,
    cells: X_VALUES.map((x) => ({ x, text: valueAt(sheetSeed, x, y) })),
  }));
}

/**
 * Every wrong answer a real test-taker produces on this subtest, as a coordinate.
 *
 * These ARE the distractors - Doctrine says a wrong choice must be the result of a specific
 * plausible mistake, and on Table Reading the mistakes are all spatial. Ordered by how often
 * they actually happen, because `h.choices` takes the first distinct four.
 *
 * `y-ascending` is first for a reason: it is the mistake the subtest is built to punish. If you
 * assume the Y axis climbs downward like a normal chart, you count to the mirrored row, which
 * is y' = (Y_TOP + Y_BOTTOM) - y. On a gradual field that lands a long way from the answer -
 * which is exactly what makes it catchable, and exactly why the other four must not be.
 */
export function errorCells(x, y) {
  const mirroredY = Y_TOP + Y_BOTTOM - y;
  const candidates = [
    { x, y: mirroredY, error: 'y-ascending', why: 'read the Y axis as ascending - it descends' },
    { x, y: y - 1, error: 'row-slip', why: 'slipped one row while scanning across' },
    { x: x + 1, y, error: 'column-slip', why: 'slipped one column while scanning down' },
    { x: y, y: x, error: 'axes-swapped', why: 'looked up (Y, X) instead of (X, Y)' },
    { x, y: y + 1, error: 'row-slip', why: 'slipped one row the other way' },
    { x: x - 1, y, error: 'column-slip', why: 'slipped one column the other way' },
    { x: -x, y, error: 'sign-blind', why: 'dropped the minus sign on the X label' },
    { x, y: -y, error: 'sign-blind', why: 'dropped the minus sign on the Y label' },
  ];
  return candidates.filter((c) => inGrid(c.x, c.y) && !(c.x === x && c.y === y));
}

/** The same list, as ready-made `{ value, error }` distractors for `h.choices`. */
export function errorChoices(sheetSeed, x, y) {
  return errorCells(x, y).map((c) => ({
    value: valueAt(sheetSeed, c.x, c.y),
    error: c.error,
    why: c.why,
    x: c.x,
    y: c.y,
  }));
}

/**
 * Only the four slip-by-one cells, which on a gradual field are all within a point or two of
 * the answer. Used by the band-4 item: five options spanning `088 089 090 091 092` is the
 * hardest thing this subtest does, and it is entirely authentic - the pamphlet's own sample
 * answers 33 against options 30 to 36.
 */
export function tightChoices(sheetSeed, x, y) {
  return errorChoices(sheetSeed, x, y).filter((c) => c.error === 'row-slip' || c.error === 'column-slip');
}

// Error-mode wording lives in engine/errorModes.js, shared with every other subtest.
export { ERROR_LABELS } from './errorModes.js';

/** A cell with a full ring of neighbours, so all four slip-by-one error modes exist. */
export const hasFullRing = (x, y) =>
  inGrid(x - 1, y) && inGrid(x + 1, y) && inGrid(x, y - 1) && inGrid(x, y + 1);

export const coordLabel = (x, y) => `X = ${x >= 0 ? '+' : ''}${x}, Y = ${y >= 0 ? '+' : ''}${y}`;
export const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;
