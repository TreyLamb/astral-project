// DLAB Trainer localStorage layer — the always-on working store (guest / offline
// / no Firebase env). When signed in, dlabFirestore.js mirrors this same API;
// dlabContext picks the backend.

const RESULTS_KEY = 'dlab_results_v1';
const SETTINGS_KEY = 'dlab_settings_v1';
const RECENT_PARAMS_KEY = 'dlab_recent_params_v1';

export const MAX_RESULTS = 100;
export const MAX_RECENT_PARAMS = 20;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const DEFAULT_SETTINGS = {
  voiceProvider: 'webspeech',
  voiceName: null,
  rate: 0.95,
  pitch: 1.0,
  gapSeconds: 8,
  replayLimit: 2,
  defaultPreset: 'dlabWeighted',
  strictGrading: false,
  showTimerBar: true,
};

export function withSettingsDefaults(s) {
  return { ...DEFAULT_SETTINGS, ...s };
}

export const DlabStorage = {
  getResults() {
    const arr = load(RESULTS_KEY, []);
    return (Array.isArray(arr) ? arr : []).slice().sort((a, b) => b.createdAt - a.createdAt);
  },

  getResult(id) {
    return this.getResults().find((r) => r.id === id) ?? null;
  },

  saveResult(result) {
    const record = { ...result, id: result.id ?? uid(), createdAt: result.createdAt ?? Date.now() };
    const all = [record, ...this.getResults()];
    if (all.length > MAX_RESULTS) all.length = MAX_RESULTS;
    store(RESULTS_KEY, all);
    return record;
  },

  updateResult(id, updates) {
    const all = this.getResults().map((r) =>
      (r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
    store(RESULTS_KEY, all);
    return all.find((r) => r.id === id) ?? null;
  },

  removeResult(id) {
    store(RESULTS_KEY, this.getResults().filter((r) => r.id !== id));
  },

  getSettings() {
    return withSettingsDefaults(load(SETTINGS_KEY, null));
  },

  updateSettings(updates) {
    const next = withSettingsDefaults({ ...this.getSettings(), ...updates });
    store(SETTINGS_KEY, next);
    return next;
  },

  getRecentParams() {
    const arr = load(RECENT_PARAMS_KEY, []);
    return Array.isArray(arr) ? arr : [];
  },

  pushRecentParams(vector) {
    const next = [...this.getRecentParams(), vector];
    if (next.length > MAX_RECENT_PARAMS) next.splice(0, next.length - MAX_RECENT_PARAMS);
    store(RECENT_PARAMS_KEY, next);
    return next;
  },

  // Results only — settings and recent-params (anti-staleness state) survive a history clear.
  clearHistory() {
    store(RESULTS_KEY, []);
  },
};
