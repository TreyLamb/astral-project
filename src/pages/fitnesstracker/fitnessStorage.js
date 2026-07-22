// FitnessTracker localStorage layer — the always-on working store (guest / offline
// / no Firebase env). When signed in, fitnessFirestore.js mirrors this same API;
// fitnessContext picks the backend. Shape mirrors medaldexStorage.js / pogoaccsStorage.js.
import { withSettingsDefaults } from './fitnessConfig';

const WORKOUTS_KEY = 'fitness_workouts_v1';
const SETTINGS_KEY = 'fitness_settings_v1';
const MEALS_KEY = 'fitness_meals_v1';
const GOALS_KEY = 'fitness_goals_v1';
const BODYWEIGHT_KEY = 'fitness_bodyweight_v1';

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

export const FitnessStorage = {
  getWorkouts() {
    const arr = load(WORKOUTS_KEY, []);
    return Array.isArray(arr) ? arr : [];
  },

  saveWorkout(w) {
    store(WORKOUTS_KEY, [w, ...this.getWorkouts()]);
    return w;
  },

  updateWorkout(id, updates) {
    const all = this.getWorkouts().map((w) =>
      (w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w));
    store(WORKOUTS_KEY, all);
    return all.find((w) => w.id === id) ?? null;
  },

  removeWorkout(id) {
    store(WORKOUTS_KEY, this.getWorkouts().filter((w) => w.id !== id));
  },

  getSettings() {
    return withSettingsDefaults(load(SETTINGS_KEY, null));
  },

  updateSettings(updates) {
    const next = withSettingsDefaults({ ...this.getSettings(), ...updates });
    store(SETTINGS_KEY, next);
    return next;
  },

  getMeals() {
    const arr = load(MEALS_KEY, []);
    return Array.isArray(arr) ? arr : [];
  },

  saveMeal(m) {
    store(MEALS_KEY, [m, ...this.getMeals()]);
    return m;
  },

  updateMeal(id, updates) {
    const all = this.getMeals().map((m) =>
      (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m));
    store(MEALS_KEY, all);
    return all.find((m) => m.id === id) ?? null;
  },

  removeMeal(id) {
    store(MEALS_KEY, this.getMeals().filter((m) => m.id !== id));
  },

  getGoals() {
    const arr = load(GOALS_KEY, []);
    return Array.isArray(arr) ? arr : [];
  },

  saveGoal(g) {
    store(GOALS_KEY, [g, ...this.getGoals()]);
    return g;
  },

  updateGoal(id, updates) {
    const all = this.getGoals().map((g) =>
      (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g));
    store(GOALS_KEY, all);
    return all.find((g) => g.id === id) ?? null;
  },

  removeGoal(id) {
    store(GOALS_KEY, this.getGoals().filter((g) => g.id !== id));
  },

  getBodyWeightLogs() {
    const arr = load(BODYWEIGHT_KEY, []);
    return Array.isArray(arr) ? arr : [];
  },

  saveBodyWeightLog(l) {
    store(BODYWEIGHT_KEY, [l, ...this.getBodyWeightLogs()]);
    return l;
  },

  updateBodyWeightLog(id, updates) {
    const all = this.getBodyWeightLogs().map((l) =>
      (l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l));
    store(BODYWEIGHT_KEY, all);
    return all.find((l) => l.id === id) ?? null;
  },

  removeBodyWeightLog(id) {
    store(BODYWEIGHT_KEY, this.getBodyWeightLogs().filter((l) => l.id !== id));
  },
};
