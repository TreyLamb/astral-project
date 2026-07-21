// FitnessTracker Firestore layer — used when signed in (see fitnessContext).
// Mirrors FitnessStorage's API 1:1, persisted per-user under
//   users/{uid}/fitness_workouts/{workoutId}   (one doc per workout)
//   users/{uid}/fitness_meals/{mealId}         (one doc per meal)
//   users/{uid}/fitness_goals/{goalId}         (one doc per goal)
//   users/{uid}/fitness_meta/settings          (single settings doc)
// Same per-user collection pattern as medaldexFirestore.js / pogoaccsFirestore.js.
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { withSettingsDefaults } from './fitnessConfig';

function workoutsRef(uid) { return collection(db, 'users', uid, 'fitness_workouts'); }
function workoutDocRef(uid, id) { return doc(db, 'users', uid, 'fitness_workouts', id); }
function mealsRef(uid) { return collection(db, 'users', uid, 'fitness_meals'); }
function mealDocRef(uid, id) { return doc(db, 'users', uid, 'fitness_meals', id); }
function goalsRef(uid) { return collection(db, 'users', uid, 'fitness_goals'); }
function goalDocRef(uid, id) { return doc(db, 'users', uid, 'fitness_goals', id); }
function settingsDocRef(uid) { return doc(db, 'users', uid, 'fitness_meta', 'settings'); }

export const FitnessFirestore = {
  async getWorkouts(uid) {
    const snap = await getDocs(workoutsRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveWorkout(uid, w) {
    await setDoc(workoutDocRef(uid, w.id), w);
    return w;
  },

  async updateWorkout(uid, id, updates) {
    const snap = await getDoc(workoutDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates, updatedAt: Date.now() };
    await setDoc(workoutDocRef(uid, id), next);
    return next;
  },

  async removeWorkout(uid, id) {
    await deleteDoc(workoutDocRef(uid, id));
  },

  async getMeals(uid) {
    const snap = await getDocs(mealsRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveMeal(uid, m) {
    await setDoc(mealDocRef(uid, m.id), m);
    return m;
  },

  async updateMeal(uid, id, updates) {
    const snap = await getDoc(mealDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates, updatedAt: Date.now() };
    await setDoc(mealDocRef(uid, id), next);
    return next;
  },

  async removeMeal(uid, id) {
    await deleteDoc(mealDocRef(uid, id));
  },

  async getGoals(uid) {
    const snap = await getDocs(goalsRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveGoal(uid, g) {
    await setDoc(goalDocRef(uid, g.id), g);
    return g;
  },

  async updateGoal(uid, id, updates) {
    const snap = await getDoc(goalDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates, updatedAt: Date.now() };
    await setDoc(goalDocRef(uid, id), next);
    return next;
  },

  async removeGoal(uid, id) {
    await deleteDoc(goalDocRef(uid, id));
  },

  async getSettings(uid) {
    const snap = await getDoc(settingsDocRef(uid));
    return withSettingsDefaults(snap.exists() ? snap.data() : null);
  },

  async updateSettings(uid, updates) {
    const cur = await this.getSettings(uid);
    const next = withSettingsDefaults({ ...cur, ...updates });
    await setDoc(settingsDocRef(uid), next);
    return next;
  },
};
