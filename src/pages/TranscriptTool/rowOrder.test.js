import { describe, it, expect } from 'vitest';
import {
  moveWithin, manualRank, cleanOrder, pruneOrder, hasManualOrder, manualCount,
} from './rowOrder';
import { BAND_RETAKE, BAND_PROSPECTIVE } from './creditBlocks';

describe('moveWithin', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('drops a row above the one it was released on', () => {
    expect(moveWithin(ids, 'd', 'b', false)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('drops a row below the one it was released on', () => {
    expect(moveWithin(ids, 'd', 'b', true)).toEqual(['a', 'b', 'd', 'c']);
  });

  // Dragging downward removes the row before the target is located, so a naive
  // splice at the target's original index lands one slot short.
  it('lands where it was dropped when dragging downward', () => {
    expect(moveWithin(ids, 'a', 'c', true)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveWithin(ids, 'a', 'c', false)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('moves a row to the very top and the very bottom', () => {
    expect(moveWithin(ids, 'c', 'a', false)).toEqual(['c', 'a', 'b', 'd']);
    expect(moveWithin(ids, 'a', 'd', true)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('is a no-op on itself or on an id that is not there', () => {
    expect(moveWithin(ids, 'b', 'b', true)).toEqual(ids);
    expect(moveWithin(ids, 'z', 'b', true)).toEqual(ids);
    expect(moveWithin(ids, 'b', 'z', true)).toEqual(ids);
  });

  it('returns a copy, never the array it was handed', () => {
    const out = moveWithin(ids, 'b', 'b', true);
    expect(out).not.toBe(ids);
  });
});

describe('manualRank', () => {
  const order = { [BAND_RETAKE]: ['b', 'a'], [BAND_PROSPECTIVE]: [] };

  it('ranks a placed row by its position', () => {
    expect(manualRank(order, BAND_RETAKE, 'b')).toBe(0);
    expect(manualRank(order, BAND_RETAKE, 'a')).toBe(1);
  });

  // This is what makes "take it out and put it back" reset a row: it comes
  // back unranked, sorts after every placed row, and falls through to the
  // column sort from there.
  it('sends an unplaced row to the bottom of its section', () => {
    expect(manualRank(order, BAND_RETAKE, 'c')).toBe(Infinity);
    expect(manualRank(order, BAND_PROSPECTIVE, 'b')).toBe(Infinity);
    expect(manualRank(undefined, BAND_RETAKE, 'b')).toBe(Infinity);
  });
});

describe('cleanOrder', () => {
  it('survives anything localStorage can hand back', () => {
    expect(cleanOrder(null)).toEqual({ [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] });
    expect(cleanOrder('nope')).toEqual({ [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] });
    expect(cleanOrder({ [BAND_RETAKE]: 'nope' })[BAND_RETAKE]).toEqual([]);
  });

  it('drops non-strings and duplicates, which would double-rank a row', () => {
    const got = cleanOrder({ [BAND_RETAKE]: ['a', 'a', 7, null, 'b'] });
    expect(got[BAND_RETAKE]).toEqual(['a', 'b']);
  });

  it('ignores a band that is not orderable', () => {
    expect(cleanOrder({ plain: ['a'] })).toEqual({ [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] });
  });
});

describe('pruneOrder', () => {
  it('forgets a course that has left the band', () => {
    const order = { [BAND_RETAKE]: ['a', 'b', 'c'], [BAND_PROSPECTIVE]: ['x'] };
    const got = pruneOrder(order, { [BAND_RETAKE]: new Set(['a', 'c']), [BAND_PROSPECTIVE]: new Set() });
    expect(got[BAND_RETAKE]).toEqual(['a', 'c']);
    expect(got[BAND_PROSPECTIVE]).toEqual([]);
  });

  it('takes a plain array as well as a Set', () => {
    const got = pruneOrder({ [BAND_RETAKE]: ['a', 'b'] }, { [BAND_RETAKE]: ['b'] });
    expect(got[BAND_RETAKE]).toEqual(['b']);
  });
});

describe('hasManualOrder / manualCount', () => {
  it('reports nothing for an untouched scenario', () => {
    expect(hasManualOrder({ [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] })).toBe(false);
    expect(hasManualOrder(undefined)).toBe(false);
    expect(manualCount(undefined)).toBe(0);
  });

  it('counts across both bands', () => {
    const order = { [BAND_RETAKE]: ['a', 'b'], [BAND_PROSPECTIVE]: ['x'] };
    expect(hasManualOrder(order)).toBe(true);
    expect(manualCount(order)).toBe(3);
  });
});
