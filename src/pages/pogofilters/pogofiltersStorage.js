// PogoFilters localStorage layer — the always-on store, used when signed out.
// Mirrors pogofiltersFirestore.js's API exactly, minus the leading uid arg, so
// pogofiltersContext.js can swap between them with one adapter (same shape as
// fitnesstracker/pogoaccs).
import {
  withFilterDefaults, withLabelDefaults, withSpeciesDefaults,
  withGroupDefaults, withSettingsDefaults, uid,
} from './pogofiltersConfig';

const K = {
  filters: 'pogofilters_filters_v1',
  labels: 'pogofilters_labels_v1',
  species: 'pogofilters_species_v1',
  groups: 'pogofilters_groups_v1',
  settings: 'pogofilters_settings_v1',
  log: 'pogofilters_log_v1',
  sessions: 'pogofilters_sessions_v1',
  snapshots: 'pogofilters_snapshots_v1',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) ?? fallback);
  } catch {
    return fallback;
  }
}

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const PogoFiltersStorage = {
  // ---- filters ----
  getFilters() {
    return load(K.filters, []).map(withFilterDefaults);
  },
  saveFilter(f) {
    const next = withFilterDefaults({ ...f, updatedAt: Date.now() });
    const all = load(K.filters, []);
    const i = all.findIndex((x) => x.id === next.id);
    if (i === -1) all.push(next); else all[i] = next;
    store(K.filters, all);
    return next;
  },
  // Bulk write in one go — the apply engine and every bulk edit commit through
  // here so a multi-filter change is a single storage write, not N of them.
  replaceFilters(list) {
    const next = list.map(withFilterDefaults);
    store(K.filters, next);
    return next;
  },
  removeFilter(id) {
    store(K.filters, load(K.filters, []).filter((f) => f.id !== id));
  },

  // ---- labels ----
  getLabels() {
    return load(K.labels, []).map((l, i) => withLabelDefaults(l, i));
  },
  saveLabel(l) {
    const next = withLabelDefaults(l);
    const all = load(K.labels, []);
    const i = all.findIndex((x) => x.id === next.id);
    if (i === -1) all.push(next); else all[i] = next;
    store(K.labels, all);
    return next;
  },
  replaceLabels(list) {
    const next = list.map((l, i) => withLabelDefaults(l, i));
    store(K.labels, next);
    return next;
  },
  removeLabel(id) {
    store(K.labels, load(K.labels, []).filter((l) => l.id !== id));
  },

  // ---- species assignments ----
  // Keyed by dex. Only species the user has actually touched are stored; the
  // other ~880 are implied defaults, so this stays small.
  getSpecies() {
    const map = load(K.species, {});
    const out = {};
    for (const [dex, s] of Object.entries(map)) out[dex] = withSpeciesDefaults(s);
    return out;
  },
  saveSpecies(entry) {
    const map = load(K.species, {});
    map[entry.dex] = withSpeciesDefaults({ ...entry, updatedAt: Date.now() });
    store(K.species, map);
    return map[entry.dex];
  },
  saveSpeciesBulk(entries) {
    const map = load(K.species, {});
    for (const e of entries) map[e.dex] = withSpeciesDefaults({ ...e, updatedAt: Date.now() });
    store(K.species, map);
    return map;
  },

  // ---- groups ----
  getGroups() {
    return load(K.groups, []).map(withGroupDefaults);
  },
  saveGroup(g) {
    const next = withGroupDefaults(g);
    const all = load(K.groups, []);
    const i = all.findIndex((x) => x.id === next.id);
    if (i === -1) all.push(next); else all[i] = next;
    store(K.groups, all);
    return next;
  },
  removeGroup(id) {
    store(K.groups, load(K.groups, []).filter((g) => g.id !== id));
  },

  // ---- settings ----
  getSettings() {
    return withSettingsDefaults(load(K.settings, {}));
  },
  updateSettings(updates) {
    const next = withSettingsDefaults({ ...load(K.settings, {}), ...updates });
    store(K.settings, next);
    return next;
  },

  // ---- sort log (phase 6) ----
  getLog() {
    return load(K.log, []);
  },
  addLogEntry(entry) {
    const e = { ...entry, id: entry.id || uid(), ts: entry.ts || Date.now() };
    const all = load(K.log, []);
    all.unshift(e);
    store(K.log, all);
    return e;
  },
  saveLogEntry(entry) {
    const all = load(K.log, []);
    const i = all.findIndex((x) => x.id === entry.id);
    if (i === -1) all.unshift(entry); else all[i] = entry;
    store(K.log, all);
    return entry;
  },
  removeLogEntry(id) {
    store(K.log, load(K.log, []).filter((e) => e.id !== id));
  },
  getSessions() {
    return load(K.sessions, []);
  },
  saveSession(s) {
    const all = load(K.sessions, []);
    const i = all.findIndex((x) => x.id === s.id);
    if (i === -1) all.unshift(s); else all[i] = s;
    store(K.sessions, all);
    return s;
  },

  // ---- undo snapshots ----
  // Every bulk operation snapshots the full filter list first. Capped so this
  // can't grow without bound in localStorage.
  getSnapshots() {
    return load(K.snapshots, []);
  },
  pushSnapshot(snap) {
    const all = load(K.snapshots, []);
    all.unshift({ ...snap, id: snap.id || uid(), ts: snap.ts || Date.now() });
    store(K.snapshots, all.slice(0, 10));
    return all[0];
  },
  popSnapshot() {
    const all = load(K.snapshots, []);
    const top = all.shift();
    store(K.snapshots, all);
    return top || null;
  },
};
