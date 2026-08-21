import { describe, it, expect } from 'vitest';
import {
  creditBreaks, clampCreditBlock, bandOf, DEFAULT_CREDIT_BLOCK,
  BAND_RETAKE, BAND_PROSPECTIVE, BAND_PLAIN,
} from './creditBlocks';

// Minimal course shapes — only the fields these functions read.
const c = (id, credits, extra = {}) => ({ id, credits, ...extra });
const pros = (id, credits, extra = {}) => c(id, credits, { isExtra: true, ...extra });

describe('bandOf', () => {
  it('sorts a course into one of the three sections', () => {
    expect(bandOf(c('a', 3), { a: 'A' })).toBe(BAND_RETAKE);
    expect(bandOf(c('a', 3), {})).toBe(BAND_PLAIN);
    expect(bandOf(pros('x', 3), {})).toBe(BAND_PROSPECTIVE);
  });

  it('keeps a prospective class prospective even once its assumed grade is edited', () => {
    expect(bandOf(pros('x', 3), { x: 'B' })).toBe(BAND_PROSPECTIVE);
  });
});

describe('clampCreditBlock', () => {
  it('falls back to the default rather than disabling the breaks', () => {
    expect(clampCreditBlock('')).toBe(DEFAULT_CREDIT_BLOCK);
    expect(clampCreditBlock(0)).toBe(DEFAULT_CREDIT_BLOCK);
    expect(clampCreditBlock(-4)).toBe(DEFAULT_CREDIT_BLOCK);
    expect(clampCreditBlock('abc')).toBe(DEFAULT_CREDIT_BLOCK);
  });

  it('snaps to half credits and caps the top end', () => {
    expect(clampCreditBlock('12.3')).toBe(12.5);
    expect(clampCreditBlock(12.1)).toBe(12);
    expect(clampCreditBlock(500)).toBe(99);
  });
});

describe('creditBreaks — retake band', () => {
  it("splits 16 changed credits into 12 + 4, Trey's own example", () => {
    const rows = [c('a', 3), c('b', 3), c('c', 3), c('d', 3), c('e', 4), c('z', 3)];
    const overrides = { a: 'A', b: 'A', c: 'A', d: 'A', e: 'A' };
    const marks = creditBreaks(rows, overrides, true, 12);

    expect(marks.get(3)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE });
    expect(marks.get(4)).toEqual({ block: 2, credits: 4, kind: BAND_RETAKE, boundary: 'rest' });
    expect(marks.size).toBe(2);
  });

  it('merges the closing block with the divider instead of drawing two rules', () => {
    const rows = [c('a', 6), c('b', 6), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE, boundary: 'rest' });
    expect(marks.size).toBe(1);
  });

  it('does not claim there is more below when every row is changed', () => {
    const marks = creditBreaks([c('a', 6), c('b', 6)], { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE });
  });

  it('leaves an untouched table completely alone', () => {
    expect(creditBreaks([c('a', 3), c('b', 3)], {}, true, 12).size).toBe(0);
  });

  it('closes a half-credit block instead of drifting past it', () => {
    // 24 x 0.5 sums to 11.999999999999998 in plain float arithmetic.
    const rows = Array.from({ length: 25 }, (_, i) => c(`h${i}`, 0.5));
    const overrides = Object.fromEntries(rows.map((r) => [r.id, 'A']));
    expect(creditBreaks(rows, overrides, true, 12).get(23)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE });
  });

  it('handles a single row bigger than a whole block', () => {
    const marks = creditBreaks([c('a', 20), c('z', 3)], { a: 'A' }, true, 12);
    expect(marks.get(0)).toEqual({ block: 1, credits: 20, kind: BAND_RETAKE, boundary: 'rest' });
  });

  it('draws nothing when the breaks are switched off', () => {
    expect(creditBreaks([c('a', 3)], { a: 'A' }, true, 0).size).toBe(0);
  });

  // Review mode off leaves the re-graded rows scattered among the untouched
  // ones. The band still gets exactly one closing rule, not one per row.
  it('closes a scattered band once, at its last row', () => {
    const rows = [c('a', 6), c('z1', 3), c('b', 6), c('z2', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(2)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE, boundary: 'rest' });
    expect(marks.size).toBe(1);
  });
});

describe('creditBreaks — the two bands count separately', () => {
  // Re-sitting a class you already took and signing up for a new one are
  // different commitments, and the header's Estimated readout splits them the
  // same way. Pooling them would make the block totals disagree with it.
  it('does not pool retake credits with prospective credits', () => {
    const rows = [c('a', 9), pros('x', 9), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A' }, true, 12);
    expect(marks.get(0)).toEqual({ block: 1, credits: 9, kind: BAND_RETAKE, boundary: 'extras' });
    expect(marks.get(1)).toEqual({ block: 1, credits: 9, kind: BAND_PROSPECTIVE, boundary: 'rest' });
  });

  it('numbers each band from 1', () => {
    const rows = [c('a', 12), c('b', 12), pros('x', 12), pros('y', 12), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(0).block).toBe(1);
    expect(marks.get(1).block).toBe(2);
    expect(marks.get(2).block).toBe(1);
    expect(marks.get(3).block).toBe(1 + 1);
  });

  it('points the retake band at the transcript when there are no prospective classes', () => {
    const marks = creditBreaks([c('a', 9), c('z', 3)], { a: 'A' }, true, 12);
    expect(marks.get(0).boundary).toBe('rest');
  });

  it('adds no divider at all when nothing follows the prospective band', () => {
    const marks = creditBreaks([c('a', 9), pros('x', 9)], { a: 'A' }, true, 12);
    expect(marks.get(0).boundary).toBe('extras');
    expect(marks.get(1)).toEqual({ block: 1, credits: 9, kind: BAND_PROSPECTIVE });
  });

  it('counts a prospective class with no override entry of its own', () => {
    const marks = creditBreaks([pros('x', 12), c('z', 3)], {}, true, 12);
    expect(marks.get(0)).toEqual({ block: 1, credits: 12, kind: BAND_PROSPECTIVE, boundary: 'rest' });
  });
});

describe('creditBreaks — superseded attempts', () => {
  // The block totals sit next to the header's Estimated readout, which skips
  // overrides on superseded attempts because they move nothing. If these
  // padded a block the two numbers would disagree.
  it('gives a superseded attempt zero weight while still ruling off after it', () => {
    const rows = [c('a', 6), c('b', 6, { repeatFlag: 'E' }), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 6, kind: BAND_RETAKE, boundary: 'rest' });
  });

  it('counts that same attempt once repeat exclusions are turned off', () => {
    const rows = [c('a', 6), c('b', 6, { repeatFlag: 'E' }), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, false, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE, boundary: 'rest' });
  });

  it('draws no empty rule when the last changed row is weightless and last overall', () => {
    // A block closes on row 0; row 1 is a superseded attempt that adds nothing
    // and has no rows after it, so there is no rule left to draw.
    const rows = [c('a', 12), c('b', 6, { repeatFlag: 'E' })];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(0)).toEqual({ block: 1, credits: 12, kind: BAND_RETAKE });
    expect(marks.has(1)).toBe(false);
  });
});
