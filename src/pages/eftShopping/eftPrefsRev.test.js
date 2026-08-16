import { describe, it, expect, beforeEach } from 'vitest';

// The suite runs in a node environment (see vitest.config.js) and jsdom is not
// a dependency, so this is the smallest thing that makes a storage layer
// testable at all.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

import { read, write, STORE_KEYS, DEFAULTS } from './eftStorage';
import { MapStore, DEFAULT_PREFS } from './map/eftMapStorage';

// A default only ever reaches someone with nothing saved, so changing one has
// silently done nothing for anyone who had already used the tool. These cover
// the one-time re-apply that fixes that, and — just as importantly — that it
// stops after firing once.

const MAP_KEY = 'eftmap_prefs_v2';

beforeEach(() => localStorage.clear());

describe('map prefs revision', () => {
  it('re-applies a moved default over a stale stored value', () => {
    localStorage.setItem(MAP_KEY, JSON.stringify({ markerSize: 'small', detailZoom: 14 }));
    const prefs = MapStore.getPrefs();
    expect(prefs.markerSize).toBe(DEFAULT_PREFS.markerSize);
    expect(prefs.detailZoom).toBe(DEFAULT_PREFS.detailZoom);
  });

  it('writes the migration back so it only happens once', () => {
    localStorage.setItem(MAP_KEY, JSON.stringify({ markerSize: 'small' }));
    MapStore.getPrefs();
    expect(JSON.parse(localStorage.getItem(MAP_KEY)).__rev).toBeGreaterThan(0);
  });

  it('leaves a deliberate choice alone once the migration has run', () => {
    MapStore.getPrefs();
    MapStore.setPrefs({ ...MapStore.getPrefs(), markerSize: 'small' });
    // This is the case the whole thing has to get right: after migrating, the
    // user picking 'small' on purpose must survive every later read.
    expect(MapStore.getPrefs().markerSize).toBe('small');
    expect(MapStore.getPrefs().markerSize).toBe('small');
  });

  it('does not disturb keys that are not in the reset list', () => {
    localStorage.setItem(MAP_KEY, JSON.stringify({ markerSize: 'small', lastMap: 'reserve', showStats: true }));
    const prefs = MapStore.getPrefs();
    expect(prefs.lastMap).toBe('reserve');
    expect(prefs.showStats).toBe(true);
  });

  it('gives a first-time visitor the defaults with no migration needed', () => {
    expect(MapStore.getPrefs().markerSize).toBe(DEFAULT_PREFS.markerSize);
  });
});

describe('tool prefs revision', () => {
  it('moves a stored listMode onto the new default', () => {
    write('prefs', { listMode: 'grid', scope: 'next' });
    const prefs = read('prefs');
    expect(prefs.listMode).toBe(DEFAULTS.prefs.listMode);
    // Everything else the user set is untouched.
    expect(prefs.scope).toBe('next');
  });

  it('lets the user go back to grid afterwards and keeps it', () => {
    write('prefs', { listMode: 'grid' });
    read('prefs');
    write('prefs', { ...read('prefs'), listMode: 'grid' });
    expect(read('prefs').listMode).toBe('grid');
    expect(read('prefs').listMode).toBe('grid');
  });

  it('persists the stamp to the real storage key', () => {
    write('prefs', { listMode: 'grid' });
    read('prefs');
    expect(JSON.parse(localStorage.getItem(STORE_KEYS.prefs)).__rev).toBeGreaterThan(0);
  });
});
