import { describe, it, expect } from 'vitest';

import {
  routeSnapshot, saveRoute, overwriteSaved, renameSaved, removeSaved,
  savedForMap, routeFromSaved, mergeSaved,
} from './eftRouteLibrary';

const wp = (y, x, bulge = 0) => ({ y, x, bulge });

const live = (over = {}) => ({
  id: 'live-1',
  name: 'Loot loop',
  waypoints: [wp(0, 0), wp(5, 5, 0.3)],
  closed: false,
  closeBulge: 0,
  radius: 60,
  rule: { mode: 'only', categories: [1, 2] },
  color: '#ff2fa0',
  hidden: false,
  ...over,
});

let n = 0;
const makeId = () => `new-${++n}`;

describe('routeSnapshot', () => {
  it('keeps the geometry and drops what belongs to a live route', () => {
    const snap = routeSnapshot(live());
    expect(snap.waypoints).toHaveLength(2);
    expect(snap.radius).toBe(60);
    expect(snap).not.toHaveProperty('id');
    expect(snap).not.toHaveProperty('hidden');
  });

  it('deep-copies, so later edits to the live route do not rewrite history', () => {
    const route = live();
    const snap = routeSnapshot(route);
    route.waypoints[0].y = 999;
    route.rule.categories.push(3);
    expect(snap.waypoints[0].y).toBe(0);
    expect(snap.rule.categories).toEqual([1, 2]);
  });
});

describe('saveRoute', () => {
  it('adds an entry tagged with its map', () => {
    const lib = saveRoute([], live(), 'woods', 'Woods loot');
    expect(lib).toHaveLength(1);
    expect(lib[0].mapKey).toBe('woods');
    expect(lib[0].name).toBe('Woods loot');
  });

  it('falls back to the route name when none is given', () => {
    expect(saveRoute([], live(), 'woods', '  ')[0].name).toBe('Loot loop');
  });

  it('gives each save its own id, so saving twice keeps both', () => {
    let lib = saveRoute([], live(), 'woods', 'A');
    lib = saveRoute(lib, live(), 'woods', 'B');
    expect(lib).toHaveLength(2);
    expect(lib[0].id).not.toBe(lib[1].id);
  });
});

describe('overwriteSaved', () => {
  it('replaces the geometry but keeps the id and name', () => {
    const lib = saveRoute([], live(), 'woods', 'Woods loot');
    const changed = live({ waypoints: [wp(1, 1), wp(2, 2), wp(3, 3)], radius: 10 });
    const out = overwriteSaved(lib, lib[0].id, changed);
    expect(out[0].id).toBe(lib[0].id);
    expect(out[0].name).toBe('Woods loot');
    expect(out[0].waypoints).toHaveLength(3);
    expect(out[0].radius).toBe(10);
  });

  it('leaves other entries alone', () => {
    let lib = saveRoute([], live(), 'woods', 'A');
    lib = saveRoute(lib, live(), 'woods', 'B');
    const out = overwriteSaved(lib, lib[0].id, live({ waypoints: [wp(9, 9)] }));
    expect(out[1].waypoints).toHaveLength(2);
  });
});

describe('renameSaved / removeSaved', () => {
  it('renames', () => {
    const lib = saveRoute([], live(), 'woods', 'A');
    expect(renameSaved(lib, lib[0].id, 'Better name')[0].name).toBe('Better name');
  });

  it('refuses an empty name rather than blanking the entry', () => {
    const lib = saveRoute([], live(), 'woods', 'A');
    expect(renameSaved(lib, lib[0].id, '   ')[0].name).toBe('A');
  });

  it('removes only the one asked for', () => {
    let lib = saveRoute([], live(), 'woods', 'A');
    lib = saveRoute(lib, live(), 'woods', 'B');
    expect(removeSaved(lib, lib[0].id).map((s) => s.name)).toEqual(['B']);
  });
});

describe('savedForMap', () => {
  it('only offers routes drawn on the map you are looking at', () => {
    let lib = saveRoute([], live(), 'woods', 'W');
    lib = saveRoute(lib, live(), 'customs', 'C');
    expect(savedForMap(lib, 'woods').map((s) => s.name)).toEqual(['W']);
  });

  it('puts the most recently touched first', () => {
    const lib = [
      { id: 'a', mapKey: 'woods', name: 'old', updatedAt: 100 },
      { id: 'b', mapKey: 'woods', name: 'new', updatedAt: 900 },
    ];
    expect(savedForMap(lib, 'woods').map((s) => s.name)).toEqual(['new', 'old']);
  });
});

describe('routeFromSaved', () => {
  it('builds a live route with a fresh id', () => {
    const lib = saveRoute([], live(), 'woods', 'Woods loot');
    const route = routeFromSaved(lib[0], makeId);
    expect(route.id).toMatch(/^new-/);
    expect(route.name).toBe('Woods loot');
    expect(route.hidden).toBe(false);
    expect(route.waypoints).toHaveLength(2);
  });

  it('hands back a COPY, so editing the loaded route never rewrites the saved one', () => {
    const lib = saveRoute([], live(), 'woods', 'Woods loot');
    const route = routeFromSaved(lib[0], makeId);
    route.waypoints[0].y = 999;
    route.rule.categories.push(99);
    expect(lib[0].waypoints[0].y).toBe(0);
    expect(lib[0].rule.categories).toEqual([1, 2]);
  });

  it('loading the same saved route twice gives two independent routes', () => {
    const lib = saveRoute([], live(), 'woods', 'Woods loot');
    const a = routeFromSaved(lib[0], makeId);
    const b = routeFromSaved(lib[0], makeId);
    expect(a.id).not.toBe(b.id);
    a.waypoints[0].y = 42;
    expect(b.waypoints[0].y).toBe(0);
  });
});

describe('mergeSaved', () => {
  it('keeps entries made on either machine', () => {
    const localOnly = [{ id: 'a', updatedAt: 1 }];
    const remoteOnly = [{ id: 'b', updatedAt: 1 }];
    expect(mergeSaved(localOnly, remoteOnly).map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('takes the newer of two edits to the same entry', () => {
    const out = mergeSaved([{ id: 'a', name: 'old', updatedAt: 1 }], [{ id: 'a', name: 'new', updatedAt: 5 }]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('new');
  });

  it('survives either side being empty', () => {
    expect(mergeSaved(null, [{ id: 'a' }])).toHaveLength(1);
    expect(mergeSaved([{ id: 'a' }], undefined)).toHaveLength(1);
  });
});
