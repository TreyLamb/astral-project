// FitnessTracker shared state. Kept in a .js module with NO component export so
// Vite fast-refresh stays happy (react-refresh/only-export-components) — the
// FitnessTrackerApp shell consumes useFitnessState() and provides the context.
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { FitnessStorage } from './fitnessStorage';
import { FitnessFirestore } from './fitnessFirestore';
import {
  newWorkout, newMeal, newGoal, newBodyWeightLog, resolveActivityTypes, resolveMealTypes,
  withSettingsDefaults, withGoalDefaults, goalDeadline,
} from './fitnessConfig';
import { recomputeFrom, daysBetween } from './calc/checkpoints';

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
      getBodyWeightLogs: () => FitnessFirestore.getBodyWeightLogs(uid),
      saveBodyWeightLog: (l) => FitnessFirestore.saveBodyWeightLog(uid, l),
      updateBodyWeightLog: (id, u) => FitnessFirestore.updateBodyWeightLog(uid, id, u),
      removeBodyWeightLog: (id) => FitnessFirestore.removeBodyWeightLog(uid, id),
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
    getBodyWeightLogs: async () => FitnessStorage.getBodyWeightLogs(),
    saveBodyWeightLog: async (l) => FitnessStorage.saveBodyWeightLog(l),
    updateBodyWeightLog: async (id, u) => FitnessStorage.updateBodyWeightLog(id, u),
    removeBodyWeightLog: async (id) => FitnessStorage.removeBodyWeightLog(id),
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
  const [bodyWeightLogs, setBodyWeightLogs] = useState([]);
  const [settings, setSettings] = useState(() => withSettingsDefaults(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // No synchronous setLoading(true) here — `loading` starts true for the first
    // load; on a backend swap (sign in/out) we keep showing current data until
    // the new data resolves below, avoiding a cascading-render lint error.
    Promise.all([backend.getWorkouts(), backend.getMeals(), backend.getGoals(), backend.getBodyWeightLogs(), backend.getSettings()])
      .then(([w, m, g, bw, s]) => {
        if (!alive) return;
        setWorkouts(Array.isArray(w) ? w : []);
        setMeals(Array.isArray(m) ? m : []);
        // withGoalDefaults back-fills fields (taskFrequency/cadence/checkpoints/
        // status) on goals saved before this work existed — no migration script,
        // just a normalized read (see fitnessConfig.js).
        setGoals(Array.isArray(g) ? g.map(withGoalDefaults) : []);
        setBodyWeightLogs(Array.isArray(bw) ? bw : []);
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

  // "Logged actual" (action='logged' — becomes the new real baseline for
  // everything downstream) vs "Manual override" (action='override' — retarget
  // this point regardless of whether it's occurred) — the two distinct
  // actions Guidelines_Forecast.md §6 calls for. Centralized here (rather than
  // duplicated across EntryEditor/GoalEditorModal/the weigh-in flow) so the
  // recompute-from-here-forward invariant has one call site to get right.
  //
  // Only touches the GOAL record (goal.checkpoints), never the workout rows —
  // checkpoints are derived live from goal.checkpoints wherever they're
  // displayed (CalendarView/EntryEditor), not duplicated onto workouts. That
  // avoids a real stale-write race: a caller (e.g. EntryEditor.save()) is
  // often ALSO writing other fields to the same workout in the same action,
  // and a second, separately-timed write here based on a possibly-stale
  // `workouts` snapshot could clobber it.
  const logCheckpoint = useCallback(async (goalId, checkpointDate, value, action) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal?.checkpoints) return;
    let checkpoints = goal.checkpoints;
    let idx = checkpoints.findIndex((c) => c.date === checkpointDate);
    if (idx === -1) {
      // No checkpoint lands exactly on this date yet — e.g. overriding an
      // interpolated on-pace estimate (a plain task day, or a week-end
      // summary date) that was never a formal cadence checkpoint. Insert one,
      // in date order, so it becomes a real, recompute-anchoring touch point
      // instead of silently doing nothing.
      const newCp = { date: checkpointDate, targetValue: value, source: 'computed', realism: null, provisional: false, actualValue: null, loggedAt: null, status: 'pending' };
      const insertAt = checkpoints.findIndex((c) => c.date > checkpointDate);
      checkpoints = insertAt === -1 ? [...checkpoints, newCp] : [...checkpoints.slice(0, insertAt), newCp, ...checkpoints.slice(insertAt)];
      idx = insertAt === -1 ? checkpoints.length - 1 : insertAt;
    }
    const cp = checkpoints[idx];
    const touched = {
      ...cp,
      actualValue: action === 'logged' ? value : cp.actualValue,
      targetValue: action === 'override' ? value : cp.targetValue,
      source: action === 'override' ? 'override' : cp.source,
      loggedAt: action === 'logged' ? Date.now() : cp.loggedAt,
      status: action === 'logged' ? 'done' : cp.status,
    };
    const withTouch = [...checkpoints.slice(0, idx), touched, ...checkpoints.slice(idx + 1)];
    const anchor = action === 'override' ? touched.targetValue : value;
    const next = recomputeFrom(goal.kind, withTouch, idx, anchor, { targetValue: goal.targetValue, deadline: goalDeadline(goal), direction: goal.direction });
    await updateGoal(goalId, { checkpoints: next });
  }, [goals, updateGoal]);

  // ---- body-weight logs ----
  const addBodyWeightLog = useCallback(async (partial) => {
    const l = newBodyWeightLog(partial);
    setBodyWeightLogs((prev) => [l, ...prev]);
    try { await backend.saveBodyWeightLog(l); } catch { /* localStorage can't fail; cloud retries next load */ }
    // A weigh-in logged close to a 'weight'-kind goal's scheduled checkpoint IS
    // that checkpoint's result — no separate click needed, mirroring how
    // completing a tagged run/lift workout satisfies its own checkpoint.
    // "Close" = within 3 days either side of the checkpoint date, picking the
    // nearest not-yet-done one if several qualify.
    const weightGoals = goals.filter((g) => g.kind === 'weight' && g.status === 'accepted' && g.checkpoints?.length);
    for (const g of weightGoals) {
      let best = null;
      for (const cp of g.checkpoints) {
        if (cp.status === 'done') continue;
        const gap = Math.abs(daysBetween(cp.date, l.date));
        if (gap <= 3 && (!best || gap < best.gap)) best = { date: cp.date, gap };
      }
      if (best) await logCheckpoint(g.id, best.date, l.weightKg, 'logged');
    }
    return l;
  }, [backend, goals, logCheckpoint]);

  const updateBodyWeightLog = useCallback(async (id, updates) => {
    setBodyWeightLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l)));
    try { await backend.updateBodyWeightLog(id, updates); } catch { /* optimistic already applied */ }
  }, [backend]);

  const removeBodyWeightLog = useCallback(async (id) => {
    setBodyWeightLogs((prev) => prev.filter((l) => l.id !== id));
    try { await backend.removeBodyWeightLog(id); } catch { /* optimistic already applied */ }
  }, [backend]);

  const getBodyWeightLog = useCallback((id) => bodyWeightLogs.find((l) => l.id === id) ?? null, [bodyWeightLogs]);

  const getWorkout = useCallback((id) => workouts.find((w) => w.id === id) ?? null, [workouts]);
  const activityTypes = useMemo(() => resolveActivityTypes(settings), [settings]);

  return {
    workouts, settings, activityTypes, loading, mode: backend.mode,
    addWorkout, updateWorkout, moveWorkout, removeWorkout, getWorkout, updateSettings,
    meals, mealTypes, addMeal, updateMeal, moveMeal, removeMeal, getMeal,
    goals, addGoal, updateGoal, removeGoal, getGoal, logCheckpoint,
    bodyWeightLogs, addBodyWeightLog, updateBodyWeightLog, removeBodyWeightLog, getBodyWeightLog,
  };
}
