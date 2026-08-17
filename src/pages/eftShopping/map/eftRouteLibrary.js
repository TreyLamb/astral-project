// Saved routes — the library, as opposed to what is currently drawn.
//
// Routes already persist per map, so this is not about not losing them. It is
// about keeping SEVERAL for the same map and picking one when you need it: a
// loot loop, a quest run and a straight dash to extract are three different
// answers to "what am I doing on Woods", and only one of them wants to be on
// screen at a time.
//
// A saved route keeps a full copy of the geometry rather than a reference to
// the live one. Loading it makes a fresh route you can hack about without
// touching the saved copy, which is the whole point of having saved it.

const norm = (s) => String(s ?? '').trim();

let seq = 0;
export const uid = () => `sr${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** The geometry worth keeping. Deliberately not `id` or `hidden` — those
 *  belong to a live route on a map, not to a saved plan. */
export function routeSnapshot(route) {
  return {
    waypoints: (route.waypoints || []).map((w) => ({ y: w.y, x: w.x, bulge: w.bulge || 0 })),
    closed: !!route.closed,
    closeBulge: route.closeBulge || 0,
    radius: route.radius ?? 40,
    rule: route.rule ? JSON.parse(JSON.stringify(route.rule)) : { mode: 'inherit', categories: [] },
    color: route.color,
  };
}

export function saveRoute(library, route, mapKey, name) {
  const entry = {
    id: uid(),
    mapKey,
    name: norm(name) || norm(route.name) || 'Saved route',
    savedAt: Date.now(),
    updatedAt: Date.now(),
    ...routeSnapshot(route),
  };
  return [...(library || []), entry];
}

/** Overwrite an existing entry in place, keeping its id and its name. */
export function overwriteSaved(library, savedId, route) {
  return (library || []).map((s) => (s.id === savedId
    ? { ...s, ...routeSnapshot(route), updatedAt: Date.now() }
    : s));
}

export function renameSaved(library, savedId, name) {
  const clean = norm(name);
  if (!clean) return library || [];
  return (library || []).map((s) => (s.id === savedId ? { ...s, name: clean, updatedAt: Date.now() } : s));
}

export function removeSaved(library, savedId) {
  return (library || []).filter((s) => s.id !== savedId);
}

/** Only ever offer routes drawn on the map you are looking at — the
 *  coordinates are meaningless anywhere else. Newest first. */
export function savedForMap(library, mapKey) {
  return (library || [])
    .filter((s) => s.mapKey === mapKey)
    .sort((a, b) => (b.updatedAt || b.savedAt || 0) - (a.updatedAt || a.savedAt || 0));
}

/**
 * A live route built from a saved one. `makeId` is injected so the caller's
 * own id scheme stays the single source of route ids.
 */
export function routeFromSaved(saved, makeId, { nameSuffix = '' } = {}) {
  return {
    id: makeId(),
    name: `${saved.name}${nameSuffix}`,
    waypoints: (saved.waypoints || []).map((w) => ({ ...w })),
    closed: !!saved.closed,
    closeBulge: saved.closeBulge || 0,
    radius: saved.radius ?? 40,
    rule: saved.rule ? JSON.parse(JSON.stringify(saved.rule)) : { mode: 'inherit', categories: [] },
    color: saved.color,
    hidden: false,
  };
}

/** Last edit wins per id, same rule as waypoints — one person, several
 *  machines, and a union so nothing made offline is stranded. */
export function mergeSaved(local, remote) {
  const byId = new Map();
  for (const s of [...(local || []), ...(remote || [])]) {
    const prev = byId.get(s.id);
    if (!prev || (s.updatedAt || 0) >= (prev.updatedAt || 0)) byId.set(s.id, s);
  }
  return [...byId.values()];
}
