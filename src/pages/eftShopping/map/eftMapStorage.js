// Per-map persisted state for the map tab.
//
// Everything is keyed by map (`woods`, `customs`, …) because zones, routes and
// found-markers are meaningless across maps. Calibration lives here too rather
// than in the committed config: it is a correction the user can improve at any
// time, and baking it into the repo would mean a rebuild to nudge a landmark.

const P = 'eftmap_';

const KEY = {
  calibration: (map) => `${P}cal_${map}_v1`,
  zones: (map) => `${P}zones_${map}_v1`,
  routes: (map) => `${P}routes_${map}_v1`,
  found: (map) => `${P}found_${map}_v1`,
  waypoints: (map) => `${P}waypoints_${map}_v1`,
  presets: (map) => `${P}presets_${map}_v1`,
  prefs: `${P}prefs_v2`,
  // Not per-map: each entry carries its own mapKey, and the common read is
  // "everything I have saved" on sign-in.
  savedRoutes: `${P}savedroutes_v1`,
};

// v2 reset the key deliberately: the v1 defaults (big markers, every category
// on, stat strip always visible) were the wrong starting point and merging new
// keys into an old object would have left them in place.
export const DEFAULT_PREFS = {
  lastMap: 'woods',
  routeMode: 'spline',
  corridorRadius: 40,
  showFound: true,
  markerSize: 'normal',
  // Zoom at which pins become an exact dot plus a name.
  detailZoom: 13,
  // Off entirely. The strip was permanent furniture on a page whose whole point
  // is the map; it lives behind this switch in case it is ever wanted.
  showStats: false,
  railOpen: true,
  leftOpen: true,
  // Per-panel collapse state, so a folded panel stays folded.
  panels: { filters: true, waypoints: false, zones: false, routes: false, manifest: true, presets: false },
};

/**
 * Changing a default is a no-op for anyone who has already used the page: every
 * one of these is persisted, and a stored value always beats a default. That
 * has now silently swallowed three separate default changes, and it is
 * per-origin, so localhost looks correct while the deployed site does not.
 *
 * Bumping PREFS_REV re-applies the listed keys from DEFAULT_PREFS exactly once.
 * Only list a key when the default genuinely moved — this overwrites whatever
 * the user had, which is right for "the default changed under them" and wrong
 * for anything they deliberately chose.
 */
const PREFS_REV = 1;
const REV_RESETS = {
  1: ['markerSize', 'detailZoom'],
};

function applyPrefsRev(prefs) {
  const from = Number(prefs.__rev) || 0;
  if (from >= PREFS_REV) return prefs;
  const next = { ...prefs };
  for (let rev = from + 1; rev <= PREFS_REV; rev++) {
    for (const key of REV_RESETS[rev] || []) next[key] = structuredClone(DEFAULT_PREFS[key]);
  }
  next.__rev = PREFS_REV;
  return next;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return structuredClone(fallback);
    if (!Array.isArray(fallback) && typeof fallback === 'object') {
      return { ...structuredClone(fallback), ...parsed };
    }
    return parsed;
  } catch {
    return structuredClone(fallback);
  }
}

/**
 * Routes AND zones live in sessionStorage, not localStorage, on purpose: both
 * are the plan for the raid you are about to do, not permanent fixtures, and
 * having last week's lines and boxes still draped over the map on every visit
 * was clutter. A reload still keeps them — losing work to a stray F5 would be
 * worse — but a new session starts clean.
 *
 * The saved library (below) is the durable home for a route worth keeping,
 * which is what makes Save mean something.
 */
function sessionRead(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    return parsed ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function sessionWrite(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the session still works in memory */
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the session still works, it just won't persist */
  }
}

export const MapStore = {
  getPrefs: () => {
    const stored = read(KEY.prefs, DEFAULT_PREFS);
    const migrated = applyPrefsRev(stored);
    if (migrated !== stored) write(KEY.prefs, migrated);
    return migrated;
  },
  setPrefs: (v) => write(KEY.prefs, { ...v, __rev: PREFS_REV }),

  // null means "never calibrated" — the UI must say so rather than silently
  // presenting an auto-fit as though it were accurate.
  getCalibration: (map) => read(KEY.calibration(map), null),
  setCalibration: (map, v) => write(KEY.calibration(map), v),
  clearCalibration: (map) => {
    try { localStorage.removeItem(KEY.calibration(map)); } catch { /* nothing to do */ }
  },

  // Session-scoped, like routes: a zone is part of the plan for a raid, not a
  // permanent fixture of the map. Save a route to keep its zones with it.
  getZones: (map) => sessionRead(KEY.zones(map), []),
  setZones: (map, v) => sessionWrite(KEY.zones(map), v),

  // Session-scoped — see sessionRead above. Save one to the library to keep it.
  getRoutes: (map) => sessionRead(KEY.routes(map), []),
  setRoutes: (map, v) => sessionWrite(KEY.routes(map), v),

  // { [markerId]: true }
  getFound: (map) => read(KEY.found(map), {}),
  setFound: (map, v) => write(KEY.found(map), v),

  // null means "never seeded", which is distinct from "the user deleted them
  // all" — only the first case gets the starter preset.
  getPresets: (map) => read(KEY.presets(map), null),
  setPresets: (map, v) => write(KEY.presets(map), v),

  // The user's own pins. Mirrored to Firestore when signed in (see
  // eftMapFirestore.js) — localStorage stays the offline copy so the map still
  // works signed out, exactly like every other slice here.
  getWaypoints: (map) => read(KEY.waypoints(map), []),
  setWaypoints: (map, v) => write(KEY.waypoints(map), v),

  // The saved-route library. Same deal as waypoints: localStorage is the
  // offline copy, Firestore carries it between machines.
  getSavedRoutes: () => read(KEY.savedRoutes, []),
  setSavedRoutes: (v) => write(KEY.savedRoutes, v),
};

export function exportMapData(mapKeys) {
  return JSON.stringify({
    format: 'eftmap-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    prefs: MapStore.getPrefs(),
    maps: Object.fromEntries(mapKeys.map((m) => [m, {
      calibration: MapStore.getCalibration(m),
      zones: MapStore.getZones(m),
      routes: MapStore.getRoutes(m),
      found: MapStore.getFound(m),
      presets: MapStore.getPresets(m),
      waypoints: MapStore.getWaypoints(m),
    }])),
    savedRoutes: MapStore.getSavedRoutes(),
  }, null, 2);
}

export function importMapData(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That is not valid JSON.' };
  }
  if (parsed?.format !== 'eftmap-backup' || !parsed.maps) {
    return { ok: false, error: 'Not an EFT map backup file.' };
  }
  if (parsed.prefs) MapStore.setPrefs(parsed.prefs);
  if (parsed.savedRoutes) MapStore.setSavedRoutes(parsed.savedRoutes);
  const restored = [];
  for (const [map, data] of Object.entries(parsed.maps)) {
    if (data.calibration) MapStore.setCalibration(map, data.calibration);
    if (data.zones) MapStore.setZones(map, data.zones);
    if (data.routes) MapStore.setRoutes(map, data.routes);
    if (data.found) MapStore.setFound(map, data.found);
    if (data.presets) MapStore.setPresets(map, data.presets);
    if (data.waypoints) MapStore.setWaypoints(map, data.waypoints);
    restored.push(map);
  }
  return { ok: true, maps: restored };
}
