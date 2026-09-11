import { describe, it, expect } from 'vitest';

import { isLiveMap, withMap } from './mapSafety';

// The three lifecycle states of a Leaflet map, as the fields it actually exposes. Both of the
// unsafe ones have shipped a production crash with the identical error message, so each gets
// its own case rather than one "falsy map" test.
const freshlyConstructed = { _loaded: false, _mapPane: {} };
const ready = { _loaded: true, _mapPane: { _leaflet_pos: { x: 0, y: 0 } } };
const removed = { _loaded: true }; // remove() deletes _mapPane and leaves _loaded alone

describe('isLiveMap', () => {
  it('accepts a map that has been given a view', () => {
    expect(isLiveMap(ready)).toBe(true);
  });

  it('rejects a map constructed but not yet given a view (the 2026-08-19 crash)', () => {
    expect(isLiveMap(freshlyConstructed)).toBe(false);
  });

  it('rejects a REMOVED map, which still reports _loaded true (the 2026-09-11 crash)', () => {
    // This is the case a bare `map._loaded` check passes, and it is why that check was not
    // enough. If this ever goes green for the wrong reason, the crash comes straight back.
    expect(removed._loaded).toBe(true);
    expect(isLiveMap(removed)).toBe(false);
  });

  it('rejects nothing at all', () => {
    expect(isLiveMap(null)).toBe(false);
    expect(isLiveMap(undefined)).toBe(false);
  });
});

describe('withMap', () => {
  it('runs the projection on a live map', () => {
    expect(withMap(ready, (m) => m._loaded)).toBe(true);
  });

  it('does not even call the function on a dead one', () => {
    let called = false;
    const out = withMap(removed, () => { called = true; return 'projected'; }, 'fallback');
    expect(called).toBe(false);
    expect(out).toBe('fallback');
  });

  it('returns undefined rather than throwing when no fallback is given', () => {
    expect(withMap(null, (m) => m.panTo([0, 0]))).toBeUndefined();
  });
});
