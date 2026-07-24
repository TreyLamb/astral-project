// Orbit localStorage layer. For guests/offline this IS the source of truth;
// when signed in (see orbitContext.js) it becomes an offline MIRROR that's
// kept in sync with Firestore via replaceAll() on load and every write —
// unlike FitnessStorage, which is always the primary store. Shape mirrors
// fitnessStorage.js otherwise.
import {
  withProjectDefaults, withTaskDefaults, withSettingsDefaults,
  withReferenceDefaults, withDayPlanDefaults,
} from './orbitConfig';

const AREAS_KEY = 'orbit_areas_v1';
const PROJECTS_KEY = 'orbit_projects_v1';
const TASKS_KEY = 'orbit_tasks_v1';
const INBOX_KEY = 'orbit_inbox_v1';
const SETTINGS_KEY = 'orbit_settings_v1';
const HOUSEKEEPING_KEY = 'orbit_housekeeping_v1';
const RECURRENCE_KEY = 'orbit_recurrence_v1';
const REFERENCES_KEY = 'orbit_references_v1';
const TRACKERS_KEY = 'orbit_trackers_v1';
const REVIEWS_KEY = 'orbit_reviews_v1';
const DAYPLANS_KEY = 'orbit_dayplans_v1';

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Storage can fail (quota, private mode) — the in-memory state the
    // caller already set is still correct, so there's nothing else to do.
  }
}

function loadArray(key) {
  const arr = load(key, []);
  return Array.isArray(arr) ? arr : [];
}

export const OrbitStorage = {
  getAreas() {
    return loadArray(AREAS_KEY);
  },

  saveArea(a) {
    store(AREAS_KEY, [a, ...this.getAreas()]);
    return a;
  },

  updateArea(id, updates) {
    const all = this.getAreas().map((a) => (a.id === id ? { ...a, ...updates } : a));
    store(AREAS_KEY, all);
    return all.find((a) => a.id === id) ?? null;
  },

  removeArea(id) {
    store(AREAS_KEY, this.getAreas().filter((a) => a.id !== id));
  },

  getProjects() {
    return loadArray(PROJECTS_KEY).map(withProjectDefaults);
  },

  saveProject(p) {
    store(PROJECTS_KEY, [p, ...loadArray(PROJECTS_KEY)]);
    return p;
  },

  updateProject(id, updates) {
    const all = loadArray(PROJECTS_KEY).map((p) =>
      (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p));
    store(PROJECTS_KEY, all);
    return all.find((p) => p.id === id) ?? null;
  },

  removeProject(id) {
    store(PROJECTS_KEY, loadArray(PROJECTS_KEY).filter((p) => p.id !== id));
  },

  getTasks() {
    return loadArray(TASKS_KEY).map(withTaskDefaults);
  },

  saveTask(t) {
    store(TASKS_KEY, [t, ...loadArray(TASKS_KEY)]);
    return t;
  },

  updateTask(id, updates) {
    const all = loadArray(TASKS_KEY).map((t) =>
      (t.id === id ? { ...t, ...updates } : t));
    store(TASKS_KEY, all);
    return all.find((t) => t.id === id) ?? null;
  },

  removeTask(id) {
    store(TASKS_KEY, loadArray(TASKS_KEY).filter((t) => t.id !== id));
  },

  getInbox() {
    return loadArray(INBOX_KEY);
  },

  saveInboxItem(i) {
    store(INBOX_KEY, [i, ...this.getInbox()]);
    return i;
  },

  updateInboxItem(id, updates) {
    const all = this.getInbox().map((i) => (i.id === id ? { ...i, ...updates } : i));
    store(INBOX_KEY, all);
    return all.find((i) => i.id === id) ?? null;
  },

  removeInboxItem(id) {
    store(INBOX_KEY, this.getInbox().filter((i) => i.id !== id));
  },

  getSettings() {
    return withSettingsDefaults(load(SETTINGS_KEY, null));
  },

  updateSettings(patch) {
    const next = withSettingsDefaults({ ...this.getSettings(), ...patch });
    store(SETTINGS_KEY, next);
    return next;
  },

  getHousekeepingDate() {
    return load(HOUSEKEEPING_KEY, null);
  },

  setHousekeepingDate(iso) {
    store(HOUSEKEEPING_KEY, iso);
  },

  getRecurrenceRules() {
    return loadArray(RECURRENCE_KEY);
  },

  saveRecurrenceRule(r) {
    store(RECURRENCE_KEY, [r, ...loadArray(RECURRENCE_KEY)]);
    return r;
  },

  updateRecurrenceRule(id, updates) {
    const all = loadArray(RECURRENCE_KEY).map((r) => (r.id === id ? { ...r, ...updates } : r));
    store(RECURRENCE_KEY, all);
    return all.find((r) => r.id === id) ?? null;
  },

  removeRecurrenceRule(id) {
    store(RECURRENCE_KEY, loadArray(RECURRENCE_KEY).filter((r) => r.id !== id));
  },

  getReferences() {
    return loadArray(REFERENCES_KEY).map(withReferenceDefaults);
  },

  saveReference(r) {
    store(REFERENCES_KEY, [r, ...loadArray(REFERENCES_KEY)]);
    return r;
  },

  updateReference(id, updates) {
    const all = loadArray(REFERENCES_KEY).map((r) =>
      (r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
    store(REFERENCES_KEY, all);
    return all.find((r) => r.id === id) ?? null;
  },

  removeReference(id) {
    store(REFERENCES_KEY, loadArray(REFERENCES_KEY).filter((r) => r.id !== id));
  },

  getTrackers() {
    return loadArray(TRACKERS_KEY);
  },

  saveTracker(t) {
    store(TRACKERS_KEY, [t, ...loadArray(TRACKERS_KEY)]);
    return t;
  },

  updateTracker(id, updates) {
    const all = loadArray(TRACKERS_KEY).map((t) => (t.id === id ? { ...t, ...updates } : t));
    store(TRACKERS_KEY, all);
    return all.find((t) => t.id === id) ?? null;
  },

  removeTracker(id) {
    store(TRACKERS_KEY, loadArray(TRACKERS_KEY).filter((t) => t.id !== id));
  },

  getReviewLogs() {
    return loadArray(REVIEWS_KEY);
  },

  saveReviewLog(r) {
    store(REVIEWS_KEY, [r, ...loadArray(REVIEWS_KEY)]);
    return r;
  },

  updateReviewLog(id, updates) {
    const all = loadArray(REVIEWS_KEY).map((r) => (r.id === id ? { ...r, ...updates } : r));
    store(REVIEWS_KEY, all);
    return all.find((r) => r.id === id) ?? null;
  },

  removeReviewLog(id) {
    store(REVIEWS_KEY, loadArray(REVIEWS_KEY).filter((r) => r.id !== id));
  },

  // DayPlans are keyed by `date` ('YYYY-MM-DD'), not `id` — see
  // orbitConfig.js's newDayPlan. save/update/remove all key off `date`.
  getDayPlans() {
    return loadArray(DAYPLANS_KEY).map(withDayPlanDefaults);
  },

  saveDayPlan(d) {
    store(DAYPLANS_KEY, [d, ...loadArray(DAYPLANS_KEY).filter((x) => x.date !== d.date)]);
    return d;
  },

  updateDayPlan(date, updates) {
    const all = loadArray(DAYPLANS_KEY).map((d) => (d.date === date ? { ...d, ...updates } : d));
    store(DAYPLANS_KEY, all);
    return all.find((d) => d.date === date) ?? null;
  },

  removeDayPlan(date) {
    store(DAYPLANS_KEY, loadArray(DAYPLANS_KEY).filter((d) => d.date !== date));
  },

  // Hydrates the local mirror from a cloud read (see orbitContext.js's
  // backend-swap load). `collection` picks the key + normalizer; for
  // 'settings' `arrayOrObj` is the settings object itself, not an array.
  replaceAll(collection, arrayOrObj) {
    switch (collection) {
      case 'areas':
        store(AREAS_KEY, arrayOrObj);
        break;
      case 'projects':
        store(PROJECTS_KEY, arrayOrObj);
        break;
      case 'tasks':
        store(TASKS_KEY, arrayOrObj);
        break;
      case 'inbox':
        store(INBOX_KEY, arrayOrObj);
        break;
      case 'settings':
        store(SETTINGS_KEY, withSettingsDefaults(arrayOrObj));
        break;
      case 'recurrenceRules':
        store(RECURRENCE_KEY, arrayOrObj);
        break;
      case 'references':
        store(REFERENCES_KEY, arrayOrObj);
        break;
      case 'trackers':
        store(TRACKERS_KEY, arrayOrObj);
        break;
      case 'reviewLogs':
        store(REVIEWS_KEY, arrayOrObj);
        break;
      case 'dayPlans':
        store(DAYPLANS_KEY, arrayOrObj);
        break;
      default:
        break;
    }
  },
};
