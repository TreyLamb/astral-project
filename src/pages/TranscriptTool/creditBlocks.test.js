import { describe, it, expect } from 'vitest';
import { creditBreaks, clampCreditBlock, DEFAULT_CREDIT_BLOCK } from './creditBlocks';

// Minimal course shapes — only the fields creditBreaks reads.
const c = (id, credits, extra = {}) => ({ id, credits, ...extra });

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

describe('creditBreaks', () => {
  it("splits 16 changed credits into 12 + 4, Trey's own example", () => {
    const rows = [c('a', 3), c('b', 3), c('c', 3), c('d', 3), c('e', 4), c('z', 3)];
    const overrides = { a: 'A', b: 'A', c: 'A', d: 'A', e: 'A' };
    const marks = creditBreaks(rows, overrides, true, 12);

    expect(marks.get(3)).toEqual({ block: 1, credits: 12 });
    expect(marks.get(4)).toEqual({ block: 2, credits: 4, rest: true });
    expect(marks.size).toBe(2);
  });

  it('marks the divider to the untouched rows without duplicating the rule', () => {
    // Exactly one full block, so the block break and the "rest below" divider
    // land on the same row and must merge into one mark.
    const rows = [c('a', 6), c('b', 6), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, rest: true });
    expect(marks.size).toBe(1);
  });

  it('does not claim there is more below when every row is changed', () => {
    const rows = [c('a', 6), c('b', 6)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, rest: false });
  });

  it('leaves an untouched table completely alone', () => {
    expect(creditBreaks([c('a', 3), c('b', 3)], {}, true, 12).size).toBe(0);
  });

  it('gives a lone under-sized block its own trailing mark', () => {
    const rows = [c('a', 3), c('z', 3)];
    expect(creditBreaks(rows, { a: 'A' }, true, 12).get(0)).toEqual({ block: 1, credits: 3, rest: true });
  });

  it('counts planned extras, which carry no override entry', () => {
    const rows = [c('a', 6), c('x', 6, { isExtra: true }), c('z', 3)];
    expect(creditBreaks(rows, { a: 'A' }, true, 12).get(1)).toEqual({ block: 1, credits: 12, rest: true });
  });

  // The block total is shown next to the header's Estimated readout, which
  // skips overrides on superseded attempts because they move nothing. If these
  // padded a block the two numbers would disagree.
  it('gives a superseded attempt zero weight while still ruling off after it', () => {
    const rows = [c('a', 6), c('b', 6, { repeatFlag: 'E' }), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 6, rest: true });
  });

  it('counts that same attempt once repeat exclusions are turned off', () => {
    const rows = [c('a', 6), c('b', 6, { repeatFlag: 'E' }), c('z', 3)];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, false, 12);
    expect(marks.get(1)).toEqual({ block: 1, credits: 12, rest: true });
  });

  it('closes a half-credit block instead of drifting past it', () => {
    // 24 x 0.5 sums to 11.999999999999998 in plain float arithmetic.
    const rows = Array.from({ length: 25 }, (_, i) => c(`h${i}`, 0.5));
    const overrides = Object.fromEntries(rows.map((r) => [r.id, 'A']));
    const marks = creditBreaks(rows, overrides, true, 12);
    expect(marks.get(23)).toEqual({ block: 1, credits: 12 });
  });

  it('draws no empty rule when the last changed row is weightless and last overall', () => {
    // A block closes on row 0; row 1 is a superseded attempt that adds nothing
    // and has no rows after it, so there is no rule left to draw.
    const rows = [c('a', 12), c('b', 6, { repeatFlag: 'E' })];
    const marks = creditBreaks(rows, { a: 'A', b: 'A' }, true, 12);
    expect(marks.get(0)).toEqual({ block: 1, credits: 12 });
    expect(marks.has(1)).toBe(false);
  });

  it('draws nothing when the breaks are switched off', () => {
    expect(creditBreaks([c('a', 3)], { a: 'A' }, true, 0).size).toBe(0);
  });

  it('handles a single row bigger than a whole block', () => {
    const rows = [c('a', 20), c('z', 3)];
    expect(creditBreaks(rows, { a: 'A' }, true, 12).get(0)).toEqual({ block: 1, credits: 20, rest: true });
  });
});
