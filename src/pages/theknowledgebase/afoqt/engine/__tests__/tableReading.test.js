// Table Reading (Phase 4).
//
// Three things are being defended here, in descending order of how badly they would hurt:
//
//   1. THE ANSWER IS RIGHT. Every generated item's correct choice is re-derived independently
//      from the grid rather than trusted from the generator. This is the "answer independently
//      recomputable" guarantee, and on a subtest where the answer is defined entirely by a
//      figure it is the only check that means anything.
//   2. THE Y AXIS DESCENDS. It is the whole subtest. A regression here would silently train the
//      exact misread the tool exists to remove, and every question would still look plausible.
//   3. ONE FIGURE PER RUN. The sheet mechanism is what keeps pace honest; if it broke, every
//      question would become question one and the 10.5s target would be measuring the wrong
//      thing while still reporting a number.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { templatesFor, generateInstance, buildDrill, composeSeed, sheetSeedOf, SHEET_BITS } from '../generator';
import { auditTemplate } from '../templateAudit';
import { assembleDrill, drawFromMissPool } from '../drill';
import { mulberry32 } from '../../../engine/rng';
import { getChapter } from '../../curriculum/chapters';
import { LESSONS } from '../../curriculum/lessons';
import {
  X_VALUES, Y_VALUES, X_MIN, X_MAX, Y_TOP, Y_BOTTOM, ROWS, COLS,
  cellValue, valueAt, rowIndex, colIndex, errorCells, tightChoices, hasFullRing, inGrid,
  sheetRows, sheetWidth,
} from '../table';
import { ERROR_LABELS } from '../errorModes';

const trTemplates = templatesFor('TR');

describe('the grid matches the real subtest', () => {
  it('is 33 x 33', () => {
    expect(X_VALUES).toHaveLength(33);
    expect(Y_VALUES).toHaveLength(33);
    expect(ROWS).toBe(33);
    expect(COLS).toBe(33);
  });

  it('X ascends left to right', () => {
    expect(X_VALUES[0]).toBe(X_MIN);
    expect(X_VALUES.at(-1)).toBe(X_MAX);
    for (let i = 1; i < X_VALUES.length; i++) expect(X_VALUES[i]).toBeGreaterThan(X_VALUES[i - 1]);
  });

  // The single most important assertion in this file. Y DESCENDS down the page - the top row is
  // the largest Y. Flip this and every question in the subtest is quietly wrong.
  it('Y DESCENDS top to bottom', () => {
    expect(Y_VALUES[0]).toBe(Y_TOP);
    expect(Y_VALUES.at(-1)).toBe(Y_BOTTOM);
    for (let i = 1; i < Y_VALUES.length; i++) expect(Y_VALUES[i]).toBeLessThan(Y_VALUES[i - 1]);
    expect(rowIndex(Y_TOP)).toBe(0);
    expect(rowIndex(0)).toBe(15);
    expect(rowIndex(Y_BOTTOM)).toBe(32);
    expect(colIndex(X_MIN)).toBe(0);
    expect(colIndex(0)).toBe(16);
  });

  it('prints every cell at one fixed width, with leading zeros', () => {
    for (const seed of [7, 99, 4242]) {
      const w = sheetWidth(seed);
      expect(w).toBeGreaterThanOrEqual(2);
      let padded = 0;
      for (const y of Y_VALUES) for (const x of X_VALUES) {
        const v = valueAt(seed, x, y);
        expect(v).toHaveLength(w);
        expect(v).toMatch(/^\d+$/);
        expect(Number(v)).toBe(cellValue(seed, x, y));
        if (v.startsWith('0')) padded++;
      }
      // Leading zeros are part of what makes the values hard to hold in mind, so a grid that
      // never padded anything would be missing a real property of the printed table.
      expect(padded, `sheet ${seed} has no padded values`).toBeGreaterThan(0);
    }
  });

  // THE CORRECTION OF 2026-08-20, and the most consequential assertion in the file after the
  // Y axis. The official AFPC sample table steps by exactly one or two in both directions - see
  // the transcription in engine/table.js. An earlier build generated uniform random values in
  // 0-999, which produced answer options spread across the whole range instead of clustered
  // within a point or two of each other. That is a different exercise from the real subtest:
  // when the options are 088/089/090/091/092 nothing can be eliminated and a slipped row cannot
  // be felt, and that is exactly what makes Table Reading hard.
  it('is gradual - every step right and every step DOWN adds one or two', () => {
    for (const seed of [0, 7, 99, 512, 4242]) {
      const rows = sheetRows(seed);
      for (const row of rows) {
        for (let i = 1; i < row.cells.length; i++) {
          const d = Number(row.cells[i].text) - Number(row.cells[i - 1].text);
          expect(d, `sheet ${seed} row ${row.y} step ${i}`).toBeGreaterThanOrEqual(1);
          expect(d).toBeLessThanOrEqual(2);
        }
      }
      for (let r = 1; r < rows.length; r++) {
        for (let c = 0; c < COLS; c++) {
          const d = Number(rows[r].cells[c].text) - Number(rows[r - 1].cells[c].text);
          expect(d, `sheet ${seed} col ${c} step ${r}`).toBeGreaterThanOrEqual(1);
          expect(d).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  // ...and yet it must not be `rowOffset + colOffset`, because a separable table has identical
  // deltas in every row and hands over a formula instead of a lookup. The official sample is not
  // separable (row +3 runs 1,2,2,1,1,1 while row +1 runs 2,2,2,2,1,1).
  it('is NOT separable - rows do not share a delta pattern', () => {
    const rows = sheetRows(7);
    const pattern = (row) => row.cells.slice(1).map((c, i) => Number(c.text) - Number(row.cells[i].text)).join('');
    expect(new Set(rows.map(pattern)).size, 'every row had the same deltas').toBeGreaterThan(20);
  });

  // The payoff of the gradual field: a cell and its four neighbours are within a couple of
  // points, so a five-option slate built from them cannot be narrowed by inspection.
  it('puts a cell and its slip-by-one neighbours within a few points of each other', () => {
    for (const seed of [3, 88]) {
      for (const [x, y] of [[0, 0], [-7, 6], [11, -9]]) {
        const answer = cellValue(seed, x, y);
        for (const c of tightChoices(seed, x, y)) {
          expect(Math.abs(Number(c.value) - answer)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('gives a different grid for a different sheet seed', () => {
    const a = sheetRows(1).flatMap((r) => r.cells.map((c) => c.text)).join();
    const b = sheetRows(2).flatMap((r) => r.cells.map((c) => c.text)).join();
    expect(a).not.toBe(b);
  });
});

describe('error modes are real mistakes on this grid', () => {
  it('never includes the target cell and never leaves the grid', () => {
    for (const y of [Y_TOP, 8, 0, -9, Y_BOTTOM]) for (const x of [X_MIN, -5, 0, 5, X_MAX]) {
      for (const c of errorCells(x, y)) {
        expect(inGrid(c.x, c.y)).toBe(true);
        expect(c.x === x && c.y === y).toBe(false);
      }
    }
  });

  // Reading the Y axis as if it climbed downward lands you on the mirrored row. That is what
  // makes it the headline distractor: it is a real value from the real table.
  it('the y-ascending mirror is the vertically mirrored row', () => {
    for (const y of Y_VALUES) {
      const mirror = errorCells(0, y).find((c) => c.error === 'y-ascending');
      if (!mirror) { expect(y).toBe(-1); continue; } // y = -1 is its own mirror
      expect(rowIndex(mirror.y)).toBe(ROWS - 1 - rowIndex(y));
    }
  });

  it('a cell with a full ring has all four slip-by-one neighbours', () => {
    expect(hasFullRing(0, 0)).toBe(true);
    expect(hasFullRing(X_MIN, 0)).toBe(false);
    expect(hasFullRing(0, Y_BOTTOM)).toBe(false);
  });

});

describe('every Table Reading template', () => {
  it('registered six of them, spread across bands 1-4', () => {
    expect(trTemplates).toHaveLength(6);
    expect([...new Set(trTemplates.map((t) => t.band))].sort()).toEqual([1, 2, 3, 4]);
  });

  it.each(trTemplates.map((t) => [t.id, t]))('%s holds the structural contract', (_id, t) => {
    expect(auditTemplate(t, { samples: 1200 }).problems).toEqual([]);
  });

  it.each(trTemplates.map((t) => [t.id, t]))('%s shares its figure across a run', (_id, t) => {
    expect(t.sheet).toBe(true);
  });

  // The one that matters: do not trust the generator's own answer, re-derive it from the grid.
  it.each(trTemplates.map((t) => [t.id, t]))(
    '%s marks the value that is actually in the cell', (_id, t) => {
      for (let i = 0; i < 300; i++) {
        const q = generateInstance(t.id, (Math.imul(i + 1, 2654435761) >>> 0));
        const { sheetSeed, x, y } = q.render;
        expect(q.choices[q.correctIndex]).toBe(valueAt(sheetSeed, x, y));
      }
    });

  // The hardest item the subtest has, and it has to actually be that: five options spanning
  // four points, every one of them a real neighbouring cell.
  it('tr-lookup-tight offers nothing but immediate neighbours', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateInstance('tr-lookup-tight', (Math.imul(i + 1, 2654435761) >>> 0));
      const answer = Number(q.choices[q.correctIndex]);
      const spread = q.choices.map(Number);
      expect(Math.max(...spread) - Math.min(...spread)).toBeLessThanOrEqual(4);
      for (const c of spread) expect(Math.abs(c - answer)).toBeLessThanOrEqual(2);
      for (const e of q.errors) expect(e === null || e === 'row-slip' || e === 'column-slip').toBe(true);
    }
  });

  it.each(trTemplates.map((t) => [t.id, t]))('%s labels every distractor with an error mode', (_id, t) => {
    for (let i = 0; i < 120; i++) {
      const q = generateInstance(t.id, (Math.imul(i + 3, 2654435761) >>> 0));
      expect(q.errors).toHaveLength(q.choices.length);
      expect(q.errors[q.correctIndex]).toBeNull();
      // Every wrong choice must name the mistake that produces it - that is the whole reason
      // the post-drill breakdown can say "you read Y as ascending four times".
      q.errors.forEach((e, i2) => { if (i2 !== q.correctIndex) expect(e).toBeTruthy(); });
      q.whys.forEach((w, i2) => { if (i2 !== q.correctIndex) expect(w).toBeTruthy(); });
    }
  });

  it('carries a table figure on every instance', () => {
    for (const t of trTemplates) {
      const q = generateInstance(t.id, 987654);
      expect(q.render.kind).toBe('table');
      expect(inGrid(q.render.x, q.render.y)).toBe(true);
    }
  });
});

describe('the shared figure', () => {
  it('splits a seed into figure and item', () => {
    const seed = composeSeed(0xabcde, 7);
    expect(sheetSeedOf(seed)).toBe(0xabcde);
    expect(seed & ((1 << SHEET_BITS) - 1)).toBe(7);
  });

  it('gives one table for a whole 40-question run, with nothing repeated', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const qs = buildDrill({ subtest: 'TR', count: 40, rng: mulberry32(seed), distinct: true });
      expect(qs).toHaveLength(40);
      expect(new Set(qs.map((q) => q.render.sheetSeed)).size, `run ${seed} changed table`).toBe(1);
      expect(new Set(qs.map((q) => q.stem)).size, `run ${seed} repeated a question`).toBe(40);
    }
  });

  it('regenerates a given (templateId, seed) byte-identically', () => {
    const a = generateInstance('tr-lookup', 0x1234567);
    const b = generateInstance('tr-lookup', 0x1234567);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('keeps the miss pool on the run figure, and always as a fresh sibling', () => {
    const progress = { missPool: { 'tr-lookup': { seeds: [7] }, 'tr-locate': { seeds: [9] } } };
    const drawn = drawFromMissPool(progress, 'TR', 8, mulberry32(5), 0x5aa5a);
    expect(drawn.length).toBe(8);
    for (const q of drawn) {
      expect(q.render.sheetSeed).toBe(0x5aa5a);
      // An exact replay would drop a second table into the middle of a drill built on one, and
      // remembering one cell of one grid is not the skill anyway.
      expect(q.missFlavour).toBe('sibling');
    }
  });

  it('assembles a whole drill - misses included - onto one table', () => {
    const progress = { missPool: { 'tr-lookup': { seeds: [7] } } };
    for (const seed of [2, 3, 4]) {
      const qs = assembleDrill({ subtest: 'TR', count: 20, rng: mulberry32(seed), progress });
      expect(qs).toHaveLength(20);
      expect(new Set(qs.map((q) => q.render.sheetSeed)).size).toBe(1);
      expect(qs.filter((q) => q.fromMissPool)).toHaveLength(2);
    }
  });

  // MK has no figure, so nothing about it should have changed when the sheet mechanism landed.
  it('leaves subtests without a figure alone', () => {
    const qs = buildDrill({ subtest: 'MK', count: 10, rng: mulberry32(1), distinct: true });
    expect(qs.every((q) => q.render === null)).toBe(true);
    expect(qs.every((q) => q.errors === null)).toBe(true);
    expect(new Set(qs.map((q) => q.seed)).size).toBe(10);
  });
});

// An exam run is a MEASUREMENT. Both of these were real bugs shipped in Phase 3 and found only
// when explaining the `drillOnly` flag to Trey, which is its own lesson: a flag nobody can read
// is a flag nobody checks.
describe('an exam run is the real subtest, not a practice mix', () => {
  it('draws ONLY the real item format - no training aids', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const qs = assembleDrill({ subtest: 'TR', count: 40, rng: mulberry32(seed), exam: true });
      expect(qs).toHaveLength(40);
      expect(new Set(qs.map((q) => q.templateId))).toEqual(new Set(['tr-lookup']));
      for (const q of qs) expect(q.stem).toMatch(/^What value is at X = /);
    }
  });

  it('still draws the training aids in an ordinary practice drill', () => {
    const qs = assembleDrill({ subtest: 'TR', count: 40, rng: mulberry32(1), distinct: true });
    expect(new Set(qs.map((q) => q.templateId)).size).toBeGreaterThan(1);
  });

  // The dashboard tells the user "exam runs ignore the pool, so a baseline is always honest".
  // It has to be true, or the number the simulator reports is biased toward known-weak material.
  it('never injects the miss pool, so the baseline is unbiased', () => {
    const progress = { missPool: { 'tr-lookup': { seeds: [7] }, 'tr-locate': { seeds: [9] } } };
    for (let seed = 1; seed <= 10; seed++) {
      const qs = assembleDrill({ subtest: 'TR', count: 40, rng: mulberry32(seed), progress, exam: true });
      expect(qs.filter((q) => q.fromMissPool)).toHaveLength(0);
    }
    // ...and the same for a subtest with no figure, so this is not a Table Reading special case.
    const mk = assembleDrill({
      subtest: 'MK', count: 25, rng: mulberry32(3), exam: true,
      progress: { missPool: { 'mk-factor-ac': { seeds: [1] } } },
    });
    expect(mk.filter((q) => q.fromMissPool)).toHaveLength(0);
  });

  it('exactly one Table Reading template is an exam item', () => {
    const exam = trTemplates.filter((t) => !t.drillOnly);
    expect(exam.map((t) => t.id)).toEqual(['tr-lookup']);
    // ...and it is the one that draws uniformly from the whole grid, which is the real spread.
    expect(exam[0].band).toBe(3);
  });
});

describe('the Table Reading chapter', () => {
  const ch = getChapter('tr-01-table-reading');

  it('exists, teaches five concepts and every one is tested', () => {
    expect(ch).toBeTruthy();
    expect(ch.subtest).toBe('TR');
    const tested = new Set(trTemplates.flatMap((t) => t.concepts));
    for (const c of ch.concepts) expect(tested.has(c), `${c} is taught but untested`).toBe(true);
  });

  it('can fill a five-question gate without repeating a template', () => {
    const pool = trTemplates.filter((t) => ch.bands.includes(t.band));
    expect(pool.length).toBeGreaterThanOrEqual(5);
    for (let seed = 1; seed < 20; seed++) {
      const qs = assembleDrill({
        subtest: 'TR', count: 5, rng: mulberry32(seed), concepts: ch.concepts, bands: ch.bands,
      });
      expect(new Set(qs.map((q) => q.templateId)).size, `seed ${seed} repeated a template`).toBe(5);
    }
  });

  it('has a lesson that teaches the descending Y axis explicitly', () => {
    const lesson = LESSONS['tr-01-table-reading'];
    expect(lesson.length).toBeGreaterThan(2000);
    expect(lesson).toMatch(/DESCEND/i);
    expect(lesson).toMatch(/anchor/i);
  });

  it('has no prerequisites - it shares nothing with the math track', () => {
    expect(ch.prereqs).toEqual([]);
  });
});
