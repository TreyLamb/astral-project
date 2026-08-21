import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordError, readErrors, clearErrors, describeError, fingerprint, formatReport,
  CRASH, BACKGROUND, LOG_KEY, MAX_ENTRIES,
} from './errorLog';

// The storage seam exists so these run in plain node — no jsdom needed for the
// parts that are just arithmetic over a JSON blob.
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

let store;
beforeEach(() => { store = fakeStorage(); });

describe('describeError', () => {
  it('normalises a real Error', () => {
    const got = describeError(new TypeError('boom'));
    expect(got.name).toBe('TypeError');
    expect(got.message).toBe('boom');
    expect(got.stack).toContain('boom');
  });

  // JavaScript lets you throw anything. If this returned undefined for a
  // string throw, every consumer downstream would break while REPORTING a
  // break, which is the worst possible time.
  it('survives things that are not Errors at all', () => {
    expect(describeError('just a string').message).toBe('just a string');
    expect(describeError(null).message).toBe('null');
    expect(describeError(undefined).message).toBe('undefined');
    expect(describeError(42).message).toBe('42');
    expect(describeError({ message: 'from an object' }).message).toBe('from an object');
  });

  it('does not choke on a circular object', () => {
    const circular = { name: 'Weird' };
    circular.self = circular;
    expect(() => describeError(circular)).not.toThrow();
    expect(describeError(circular).message).toBe('[unserialisable object]');
  });

  it('clips a runaway stack rather than blowing the storage quota', () => {
    const err = new Error('x');
    err.stack = 'y'.repeat(50000);
    expect(describeError(err).stack.length).toBeLessThan(9000);
    expect(describeError(err).stack).toContain('more characters');
  });
});

describe('recordError', () => {
  it('writes an entry that reads back', () => {
    recordError({ error: new Error('one'), route: '/TT' }, store);
    const list = readErrors(store);
    expect(list).toHaveLength(1);
    expect(list[0].message).toBe('one');
    expect(list[0].route).toBe('/TT');
    expect(list[0].kind).toBe(CRASH);
  });

  // A component that throws on every render would otherwise fill the buffer
  // with 25 copies of itself and push out the entry that actually explains
  // what started it.
  it('counts a repeat instead of adding a row', () => {
    const err = new Error('same');
    recordError({ error: err }, store);
    recordError({ error: err }, store);
    recordError({ error: err }, store);
    const list = readErrors(store);
    expect(list).toHaveLength(1);
    expect(list[0].count).toBe(3);
  });

  it('keeps two different errors apart', () => {
    recordError({ error: new Error('a') }, store);
    recordError({ error: new Error('b') }, store);
    expect(readErrors(store)).toHaveLength(2);
  });

  it('treats the same message from a different kind as a different error', () => {
    recordError({ kind: CRASH, error: new Error('x') }, store);
    recordError({ kind: BACKGROUND, error: new Error('x') }, store);
    expect(readErrors(store)).toHaveLength(2);
  });

  it('caps the buffer, dropping oldest first', () => {
    for (let i = 0; i < MAX_ENTRIES + 10; i += 1) recordError({ error: new Error(`e${i}`) }, store);
    const list = readErrors(store);
    expect(list).toHaveLength(MAX_ENTRIES);
    expect(list[list.length - 1].message).toBe(`e${MAX_ENTRIES + 9}`);
  });

  it('reports whether it was a repeat and the running total', () => {
    // Built from one helper so both throws share a call frame — which is what
    // a component crashing on every render actually does.
    const make = () => new Error('q');
    expect(recordError({ error: make() }, store).repeat).toBe(false);
    const second = recordError({ error: make() }, store);
    expect(second.repeat).toBe(true);
    expect(second.total).toBe(2);
  });

  // The flip side, and the reason the frame is in the fingerprint at all: the
  // same message raised from two different places is two different bugs.
  it('keeps the same message apart when it comes from different call sites', () => {
    const fromHere = new Error('duplicate wording');
    const fromThere = new Error('duplicate wording');
    recordError({ error: fromHere }, store);
    recordError({ error: fromThere }, store);
    expect(readErrors(store)).toHaveLength(2);
  });
});

describe('readErrors resilience', () => {
  // The log must never be the thing that breaks error reporting.
  it('returns empty for corrupt JSON rather than throwing', () => {
    store.setItem(LOG_KEY, '{{{not json');
    expect(readErrors(store)).toEqual([]);
  });

  it('returns empty when the stored value is not an array', () => {
    store.setItem(LOG_KEY, '{"nope":1}');
    expect(readErrors(store)).toEqual([]);
  });

  it('returns empty when storage throws on access (privacy mode)', () => {
    const hostile = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    expect(readErrors(hostile)).toEqual([]);
    expect(() => recordError({ error: new Error('x') }, hostile)).not.toThrow();
    expect(() => clearErrors(hostile)).not.toThrow();
  });
});

describe('fingerprint', () => {
  it('separates the same message thrown from different places', () => {
    const a = { kind: CRASH, message: 'boom', stack: 'Error: boom\n  at alpha.js:1' };
    const b = { kind: CRASH, message: 'boom', stack: 'Error: boom\n  at beta.js:9' };
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('matches the same error twice', () => {
    const e = { kind: CRASH, message: 'boom', stack: 'Error: boom\n  at alpha.js:1' };
    expect(fingerprint(e)).toBe(fingerprint({ ...e }));
  });
});

describe('formatReport', () => {
  const meta = { now: 0, route: '/EFTsh/map', buildId: 'abc1234', userAgent: 'TestAgent/1.0' };

  it('says so plainly when there is nothing to report', () => {
    expect(formatReport([], meta)).toContain('No errors recorded.');
  });

  it('carries everything needed to diagnose without a follow-up question', () => {
    recordError({ error: new TypeError('nope'), route: '/EFTsh/map', componentStack: '\n  in MapView' }, store);
    const out = formatReport(readErrors(store), meta);
    expect(out).toContain('Astral error report');
    expect(out).toContain('/EFTsh/map');
    expect(out).toContain('abc1234');
    expect(out).toContain('TestAgent/1.0');
    expect(out).toContain('TypeError: nope');
    expect(out).toContain('in MapView');
  });

  it('labels the two kinds differently', () => {
    recordError({ kind: BACKGROUND, error: new Error('fetch died') }, store);
    expect(formatReport(readErrors(store), meta)).toContain('Background error');
  });

  it('shows a repeat count', () => {
    const err = new Error('loop');
    recordError({ error: err }, store);
    recordError({ error: err }, store);
    expect(formatReport(readErrors(store), meta)).toMatch(/×2/);
  });

  it('does not throw on junk input', () => {
    expect(() => formatReport(null, {})).not.toThrow();
    expect(() => formatReport(undefined, undefined)).not.toThrow();
  });
});
