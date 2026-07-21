// FitnessTracker shared state. Kept in a .js module with NO component export so
// Vite fast-refresh stays happy (react-refresh/only-export-components) — the
// FitnessTrackerApp shell consumes useFitnessState() and provides the context.
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { FitnessStorage } from './fitnessStorage';
import { FitnessFirestore } from './fitnessFirestore';
import { newWorkout, newMeal, newGoal, resolveActivityTypes, resolveMealTypes, withSettingsDefaults } from './fitnessConfig';

export const FitnessContext = createContext(null);
export function useFitness() { return useContext(FitnessContext); }

// One uid-agnostic async API over whichever backend is active: Firestore when
// signed in (cross-device / phone sync), localStorage otherwise (guest/offline).
function makeBackend(user) {
  if (user && firebaseReady) {
    const uid = user.uid;
    return {
      mode: 'cloud',
      getWorkouts: () => FitnessFirestore.getWorkouts(uid),
      saveWorkout: (w) => FitnessFirestore.saveWorkout(uid, w),
      updateWorkout: (id, u) => FitnessFirestore.updateWorkout(uid, id, u),
      removeWorkout: (id) => FitnessFirestore.removeWorkout(uid, id),
      getMeals: () => FitnessFirestore.getMeals(uid),
      saveMeal: (m) => FitnessFirestore.saveMeal(uid, m),
      updateMeal: (id, u) => FitnessFirestore.updateMeal(uid, id, u),
      removeMeal: (id) => FitnessFirestore.removeMeal(uid, id),
      getGoals: () => FitnessFirestore.getGoals(uid),
      saveGoal: (g) => FitnessFirestore.saveGoal(uid, g),
      updateGoal: (id, u) => FitnessFirestore.updateGoal(uid, id, u),
      removeGoal: (id) => FitnessFirestore.removeGoal(uid, id),
      getSettings: () => FitnessFirestore.getSettings(uid),
      updateSettings: (u) => FitnessFirestore.updateSettings(uid, u),
    };
  }
  return {
    mode: 'local',
    getWorkouts: async () => FitnessStorage.getWorkouts(),
    saveWorkout: async (w) => FitnessStorage.saveWorkout(w),
    updateWorkout: async (id, u) => FitnessStorage.updateWorkout(id, u),
    removeWorkout: async (id) => FitnessStorage.removeWorkout(id),
    getMeals: async () => FitnessStorage.getMeals(),
    saveMeal: async (m) => FitnessStorage.saveMeal(m),
    updateMeal: async (id, u) => FitnessStorage.updateMeal(id, u),
    removeMeal: async (id) => FitnessStorage.removeMeal(id),
    getGoals: async () => FitnessStorage.getGoals(),
    saveGoal: async (g) => FitnessStorage.saveGoal(g),
    updateGoal: async (id, u) => FitnessStorage.updateGoal(id, u),
    removeGoal: async (id) => FitnessStorage.removeGoal(id),
    getSettings: async () => FitnessStorage.getSettings(),
    updateSettings: async (u) => FitnessStorage.updateSettings(u),
  };
}

export function useFitnessState() {
  const { user } = useAuth(); // undefined (resolving) | null (guest) | object
  // While auth is still resolving, treat as guest so the UI never blocks; a
  // real sign-in swaps the backend and reloads once it resolves.
  const backend = useMemo(() => makeBackend(user || null), [user]);

  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState(() => withSettingsDefaults(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // No synchronous setLoading(true) here — `loading` starts true for the first
    // load; on a backend swap (sign in/out) we keep showing current data until
    // the new data resolves below, avoiding a cascading-render lint error.
    Promise.all([backend.getWorkouts(), backend.getMeals(), backend.getGoals(), backend.getSettings()])
      .then(([w, m, g, s]) => {
        if (!alive) return;
        setWorkouts(Array.isArray(w) ? w : []);
        setMeals(Array.isArray(m) ? m : []);
        setGoals(Array.isArray(g) ? g : []);
        setSettings(withSettingsDefaults(s));
        setLoading(false);
      })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [backend]);

  const addWorkout = useCallback(async (partial) => {
    const w = newWorkout(partial);
    setWorkouts((prev) => [w, ...prev]); // optimistic
    try { await backend.saveWorkout(w); } catch { /* localStorage can't fail; cloud retries next load */ }
    return w;
  }, [backend]);

  const updateWorkout = useCallback(async (id, updates) => {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w)));
    try { await backend.updateWorkout(id, updates); } catch { /* optimistic already applied */ }
  }, [backend]);

  // Drag-to-reschedule on the calendar is just a date change.
  const moveWorkout = useCallback((id, date) => updateWorkout(id, { date }), [updateWorkout]);

  const removeWorkout = useCallback(async (id) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    try { await backend.removeWorkout(id); } catch { /* optimistic already applied */ }
  }, [backend]);

  const updateSettings = useCallback(async (updates) => {
    setSettings((prev) => withSettingsDefaults({ ...prev, ...updates }));
    try { await backend.updateSettings(updates); } catch { /* optimistic already applied */ }
  }, [backend]);

  // ---- meals (mirrors the workout actions above 1:1) ----
  const addMeal = useCallback(async (partial) => {
    const m = newMeal(partial);
    setMeals((prev) => [m, ...prev]);
    try { await backend.saveMeal(m); } catch { /* localStorage can't fail; cloud retries next load */ }
    return m;
  }, [backend]);

  const updateMeal = useCallback(async (id, updates) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m)));
    try { await backend.updateMeal(id, updates); } catch { /* optimistic already applied */ }
  }, [backend]);

  const moveMeal = useCallback((id, date) => updateMeal(id, { date }), [updateMeal]);

  const removeMeal = useCallback(async (id) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    try { await backend.removeMeal(id); } catch { /* optimistic already applied */ }
  }, [backend]);

  const getMeal = useCallback((id) => meals.find((m) => m.id === id) ?? null, [meals]);
  const mealTypes = useMemo(() => resolveMealTypes(settings), [settings]);

  // ---- goals ----
  const addGoal = useCallback(async (partial) => {
    const g = newGoal(partial);
    setGoals((prev) => [g, ...prev]);
    try { await backend.saveGoal(g); } catch { /* localStorage can't fail; cloud retries next load */ }
    return g;
  }, [backend]);

  const updateGoal = useCallback(async (id, updates) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g)));
    try { await backend.updateGoal(id, updates); } catch { /* optimistic already applied */ }
  }, [backend]);

  const removeGoal = useCallback(async (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try { await backend.removeGoal(id); } catch { /* optimistic already applied */ }
  }, [backend]);

  const getGoal = useCallback((id) => goals.find((g) => g.id === id) ?? null, [goals]);

  const getWorkout = useCallback((id) => workouts.find((w) => w.id === id) ?? null, [workouts]);
  const activityTypes = useMemo(() => resolveActivityTypes(settings), [settings]);

  return {
    workouts, settings, activityTypes, loading, mode: backend.mode,
    addWorkout, updateWorkout, moveWorkout, removeWorkout, getWorkout, updateSettings,
    meals, mealTypes, addMeal, updateMeal, moveMeal, removeMeal, getMeal,
    goals, addGoal, updateGoal, removeGoal, getGoal,
  };
}
