import { describe, it, expect, beforeEach } from 'vitest';
import { isChunkLoadError, tryChunkReload, hasReloaded, clearReloadGuard, RELOAD_KEY } from './chunkReload';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

let store;
let reloads;
const reload = () => { reloads += 1; };
beforeEach(() => { store = fakeStorage(); reloads = 0; });

describe('isChunkLoadError', () => {
  // Every engine words this differently and the wording has changed across
  // versions, which is exactly why this is a list and not one regex.
  it.each([
    ['Chrome/Edge', 'Failed to fetch dynamically imported module: https://x/assets/a-1.js'],
    ['Firefox', 'error loading dynamically imported module'],
    ['Safari', 'Importing a module script failed.'],
    ['webpack-era', 'Loading chunk 42 failed.'],
    ['vite css', 'Unable to preload CSS for /assets/a.css'],
    ['404 served as html', "Expected a JavaScript module script but the server responded with a MIME type of 'text/html'"],
  ])('recognises the %s wording', (_, message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it('recognises it by error name too', () => {
    const e = new Error('whatever');
    e.name = 'ChunkLoadError';
    expect(isChunkLoadError(e)).toBe(true);
  });

  // False positives here are expensive: a real bug would silently reload the
  // page instead of showing you the error.
  it('does not fire on ordinary errors', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading '_leaflet_pos')"))).toBe(false);
    expect(isChunkLoadError(new Error('band2 is not a function'))).toBe(false);
    expect(isChunkLoadError(new Error('Failed to fetch'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});

describe('tryChunkReload', () => {
  const chunkErr = () => new Error('Failed to fetch dynamically imported module: /assets/x.js');

  it('reloads once for a stale chunk', () => {
    expect(tryChunkReload(chunkErr(), { storage: store, reload })).toBe(true);
    expect(reloads).toBe(1);
    expect(hasReloaded(store)).toBe(true);
  });

  // The whole point of the guard. Without it a chunk that 404s on every load
  // is an infinite reload loop with no way to stop it but closing the tab.
  it('never reloads twice in the same session', () => {
    tryChunkReload(chunkErr(), { storage: store, reload });
    expect(tryChunkReload(chunkErr(), { storage: store, reload })).toBe(false);
    expect(tryChunkReload(chunkErr(), { storage: store, reload })).toBe(false);
    expect(reloads).toBe(1);
  });

  it('leaves ordinary errors alone', () => {
    expect(tryChunkReload(new Error('band2 is not a function'), { storage: store, reload })).toBe(false);
    expect(reloads).toBe(0);
  });

  // An unguarded reload is an infinite loop, which is far worse than showing
  // the raw error. No durable guard means no reload.
  it('refuses to reload when storage throws', () => {
    const hostile = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    expect(tryChunkReload(chunkErr(), { storage: hostile, reload })).toBe(false);
    expect(reloads).toBe(0);
  });

  // The nastier variant: setItem does not throw, it just does not persist.
  // Trusting it would reload on every single load, forever, with no error
  // anywhere to explain why.
  it('refuses to reload when the guard silently fails to persist', () => {
    const amnesiac = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    expect(tryChunkReload(chunkErr(), { storage: amnesiac, reload })).toBe(false);
    expect(reloads).toBe(0);
  });

  it('gives the next deploy its own retry once the guard is cleared', () => {
    tryChunkReload(chunkErr(), { storage: store, reload });
    clearReloadGuard(store);
    expect(store.getItem(RELOAD_KEY)).toBeNull();
    expect(tryChunkReload(chunkErr(), { storage: store, reload })).toBe(true);
    expect(reloads).toBe(2);
  });
});
