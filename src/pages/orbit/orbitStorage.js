// Orbit localStorage layer. For guests/offline this IS the source of truth;
// when signed in (see orbitContext.js) it becomes an offline MIRROR that's
// kept in sync with Firestore via replaceAll() on load and every write —
// unlike FitnessStorage, which is always the primary store. Shape mirrors
// fitnessStorage.js otherwise.
import {
  withProjectDefaults, withTaskDefaults, withSettingsDefaults,
} from './orbitConfig';

const AREAS_KEY = 'orbit_areas_v1';
const PROJECTS_KEY = 'orbit_projects_v1';
const TASKS_KEY = 'orbit_tasks_v1';
const INBOX_KEY = 'orbit_inbox_v1';
const SETTINGS_KEY = 'orbit_settings_v1';
const HOUSEKEEPING_KEY = 'orbit_housekeeping_v1';

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
      default:
        break;
    }
  },
};
