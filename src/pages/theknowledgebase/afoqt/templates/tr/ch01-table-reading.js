// Table Reading - the whole subtest, which is one skill performed 40 times in 7 minutes.
//
// This is the highest-leverage generator in the project. It feeds ALL THREE rated composites
// (Pilot, CSO, ABM), it carries zero knowledge content, and it is the one subtest whose item
// space is genuinely unbounded. Nothing here can be out of date, mis-scoped or wrong about the
// world - the answer is defined by the grid the question ships with.
//
// The real difficulty is pace AND near-misses: 10.5 seconds per question, no straight edge, a
// 33x33 grid whose values change GRADUALLY, so the five options cluster within a few points of
// each other and a slipped row is undetectable. See engine/table.js for the official sample
// this is calibrated against.
//
// So difficulty here is NOT grid size. Every template below runs on the full-size real grid
// from question one, and the band is set by SCAN DISTANCE - how far the eye has to travel from
// an axis anchor to the cell, which is the thing that actually consumes the ten seconds.
// Shrinking the grid for the easy bands would have taught a layout the test does not use.
//
// Every template declares `sheet: true`, so a whole drill runs against ONE table - exactly as
// the real subtest does. See SHEET_BITS in engine/generator.js for how that survives the
// (templateId, seed) replay guarantee.

import { registerTemplate } from '../../engine/generator.js';
import {
  X_MIN, X_MAX, Y_TOP, Y_BOTTOM, X_VALUES, Y_VALUES,
  valueAt, errorChoices, tightChoices, hasFullRing, inGrid, signed,
} from '../../engine/table.js';

const ask = (x, y) => `What value is at X = ${signed(x)}, Y = ${signed(y)}?`;

/**
 * Walk a list from a seeded start until an entry is acceptable, wrapping once.
 *
 * `sweep()` in templates/util.js is the equivalent for numeric parameters, but its contract is
 * "the WHOLE slate must be distinct" and that is the wrong test here: a cell supplies eight
 * candidate mistakes and only needs to yield four distinct ones, so demanding a collision-free
 * eight would reject most of the grid for no reason.
 */
function sweepIndex(length, start, ok) {
  for (let i = 0; i < length; i++) {
    const idx = (start + i) % length;
    if (ok(idx)) return idx;
  }
  return start % length;
}

/**
 * Pick a cell whose error modes yield a full five-option slate.
 *
 * With 1,000 possible values and eight candidate mistakes, two of them landing on the same
 * printed value - or on the answer itself - happens often enough to matter, and either way the
 * result is a four-option question on a five-option subtest. Rather than inventing a filler
 * number, which would break the error-mode rule outright, sweep the cells the band allows.
 */
function pickCell(sheetSeed, cells, start, need = 5, distractors = errorChoices) {
  const idx = sweepIndex(cells.length, start, (i) => {
    const { x, y } = cells[i];
    const seen = new Set([valueAt(sheetSeed, x, y)]);
    for (const d of distractors(sheetSeed, x, y)) seen.add(d.value);
    return seen.size >= need;
  });
  return cells[idx];
}

/** Cells matching a predicate, in a stable order so a seeded sweep is reproducible. */
const cellsWhere = (fn) => {
  const out = [];
  for (const y of Y_VALUES) for (const x of X_VALUES) if (fn(x, y)) out.push({ x, y });
  return out;
};

// Precomputed once at module load - these are fixed geometry, not per-instance work.
const NEAR_ORIGIN = cellsWhere((x, y) => Math.abs(x) <= 3 && Math.abs(y) <= 3);
const NEAR_AXIS = cellsWhere((x, y) => (Math.abs(x) <= 4) !== (Math.abs(y) <= 4));
const ANYWHERE = cellsWhere(() => true);
const FAR = cellsWhere((x, y) => Math.abs(x) >= 9 && Math.abs(y) >= 9 && Math.sign(x) !== Math.sign(y));
const INTERIOR = cellsWhere((x, y) => y - 1 >= Y_BOTTOM && y + 1 <= Y_TOP && x - 1 >= X_MIN && x + 1 <= X_MAX);

const lookupTemplate = ({ id, band, name, concepts, cells, blurb, stemSpace, drillOnly, distractors = errorChoices, need = 5 }) =>
  registerTemplate({
    id,
    subtest: 'TR',
    band,
    name,
    concepts,
    sheet: true,
    stemSpace,
    drillOnly,
    calibratedAgainst: 'oatts',
    generate: (rng, h) => {
      const { x, y } = pickCell(h.sheetSeed, cells, h.int(0, cells.length - 1), need, distractors);
      const correct = valueAt(h.sheetSeed, x, y);
      const { choices, correctIndex, errors, whys } = h.choices(correct, distractors(h.sheetSeed, x, y));
      return {
        stem: ask(x, y),
        choices, correctIndex, errors, whys,
        render: { kind: 'table', sheetSeed: h.sheetSeed, x, y },
        tags: ['table-reading'],
        explanation: `${blurb} Find X = ${signed(x)} along the top, then run down to Y = ${signed(y)} on the left - remembering the Y axis DESCENDS, so ${signed(y)} sits ${Y_TOP - y} rows below the top. The two meet at ${correct}.`,
      };
    },
  });

// Band 1 - the anchor drill. Both coordinates within three of zero, so the answer is a short
// hop from the X=0 / Y=0 crosshair. This is where the method gets built: find the anchor
// first, count from it, never scan from the edge of the page.
lookupTemplate({
  id: 'tr-anchor',
  band: 1,
  name: 'Lookup near the origin',
  concepts: ['table-anchor-method'],
  cells: NEAR_ORIGIN,
  stemSpace: NEAR_ORIGIN.length,
  drillOnly: true,
  blurb: 'Anchor on the zero row and zero column first.',
});

// Band 2 - one coordinate close to an axis, the other far out. A long scan in ONE direction,
// which is where a slipped row or column first starts to happen.
lookupTemplate({
  id: 'tr-lookup-near',
  band: 2,
  name: 'Lookup with one long axis',
  concepts: ['table-row-column-tracking'],
  cells: NEAR_AXIS,
  drillOnly: true,
  blurb: 'One coordinate is close in, one is far out.',
});

// Band 3 - THE REAL ITEM, and the ONLY template here without `drillOnly`. Cells are drawn
// uniformly from the whole grid, which is the real distribution, so a simulated 40-question
// subtest built from this template alone is the real subtest. Everything else in this file is
// a training aid: either a deliberately skewed slice of the grid (easy or hard on purpose) or
// a question shape the real test never uses.
lookupTemplate({
  id: 'tr-lookup',
  band: 3,
  name: 'Table lookup',
  concepts: ['table-row-column-tracking'],
  cells: ANYWHERE,
  blurb: 'This is the subtest exactly as it is asked.',
});

// Band 4 - opposite quadrants, both coordinates at least nine out. The longest diagonal scan
// the grid allows, which is where the clock actually gets lost.
lookupTemplate({
  id: 'tr-lookup-far',
  band: 4,
  name: 'Lookup across the diagonal',
  concepts: ['table-scan-distance'],
  cells: FAR,
  drillOnly: true,
  blurb: 'Opposite corners - the longest scan on the grid.',
});

/**
 * Band 2 - orientation, asked directly.
 *
 * Trains the one fact the subtest is built to punish: DOWN the table means Y gets SMALLER.
 * Asking for a neighbour rather than a coordinate forces the direction to be reasoned about
 * instead of read off a label, and the distractors are the three wrong directions plus the
 * cell you started from.
 */
const DIRECTIONS = [
  { word: 'directly below', dx: 0, dy: -1, wrong: { dx: 0, dy: 1 }, note: 'below means Y DECREASES' },
  { word: 'directly above', dx: 0, dy: 1, wrong: { dx: 0, dy: -1 }, note: 'above means Y INCREASES' },
  { word: 'immediately to the right of', dx: 1, dy: 0, wrong: { dx: -1, dy: 0 }, note: 'right means X increases' },
  { word: 'immediately to the left of', dx: -1, dy: 0, wrong: { dx: 1, dy: 0 }, note: 'left means X decreases' },
];

registerTemplate({
  id: 'tr-axis-read',
  subtest: 'TR',
  band: 2,
  name: 'Which way is down the Y axis',
  concepts: ['table-axis-orientation'],
  sheet: true,
  drillOnly: true,
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const dir = h.pick(DIRECTIONS);
    const cells = INTERIOR;
    const idx = sweepIndex(cells.length, h.int(0, cells.length - 1), (i) => {
      const { x, y } = cells[i];
      const at = (ddx, ddy) => (inGrid(x + ddx, y + ddy) ? valueAt(h.sheetSeed, x + ddx, y + ddy) : null);
      const slate = [
        at(dir.dx, dir.dy), at(dir.wrong.dx, dir.wrong.dy), at(0, 0),
        at(dir.dy, dir.dx), at(-dir.dy, -dir.dx),
      ];
      return !slate.some((v) => v === null) && new Set(slate).size === 5;
    });
    const { x, y } = cells[idx];
    const at = (ddx, ddy) => valueAt(h.sheetSeed, x + ddx, y + ddy);
    const correct = at(dir.dx, dir.dy);
    // Error modes: went the opposite way (the whole point); answered with the named cell
    // itself; moved along the wrong axis entirely, both ways.
    const { choices, correctIndex, errors, whys } = h.choices(correct, [
      { value: at(dir.wrong.dx, dir.wrong.dy), error: 'direction-flip', why: `moved the wrong way - ${dir.note}` },
      { value: at(0, 0), error: 'neighbour', why: 'answered with the cell named in the question' },
      { value: at(dir.dy, dir.dx), error: 'axes-swapped', why: 'moved along the wrong axis' },
      { value: at(-dir.dy, -dir.dx), error: 'axes-swapped', why: 'moved along the wrong axis, the other way' },
    ]);
    return {
      stem: `Which value is ${dir.word} the cell at X = ${signed(x)}, Y = ${signed(y)}?`,
      choices, correctIndex, errors, whys,
      render: { kind: 'table', sheetSeed: h.sheetSeed, x: x + dir.dx, y: y + dir.dy, from: { x, y } },
      tags: ['table-reading', 'orientation'],
      explanation: `X = ${signed(x)}, Y = ${signed(y)} holds ${at(0, 0)}. Because ${dir.note}, the cell ${dir.word} it is X = ${signed(x + dir.dx)}, Y = ${signed(y + dir.dy)} = ${correct}. The Y axis descends: the further down the page, the smaller Y gets.`,
    };
  },
});

// Band 4 - the near-miss item, and the hardest thing this subtest does.
//
// On a gradual field the four slip-by-one cells sit within a point or two of the answer, so the
// slate reads `088 089 090 091 092`. Nothing can be eliminated and nothing can be felt to be
// wrong - the only way through is to have tracked the row and column exactly. This is the
// authentic hard case, not an invented one: the official sample answers 33 against 30-36.
lookupTemplate({
  id: 'tr-lookup-tight',
  band: 4,
  name: 'Lookup with near-miss options',
  concepts: ['table-near-miss-discrimination'],
  cells: INTERIOR,
  drillOnly: true,
  distractors: tightChoices,
  blurb: 'Every option here is a neighbouring cell.',
});
