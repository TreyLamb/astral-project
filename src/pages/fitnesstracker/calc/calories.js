// Workout calorie-burn estimate + daily net-calorie rollup.
//
// kcal = MET x bodyWeightKg x durationHours. 1 MET is defined as ~3.5 mL
// O2/kg/min, which converts to ~1 kcal/kg/hour — the universal MET-to-calorie
// formula. MET values below are single representative figures per this app's
// built-in activity type (not pace-adjusted), sourced from Ainsworth et al.,
// Compendium of Physical Activities (2024 Adult Compendium; original 2011
// update, Medicine & Science in Sports & Exercise) — same
// documented-approximation spirit as this codebase's other heuristic
// constants (see calc/bodyComposition.js).
import { dailyTotals } from './nutrition';

export const MET_BY_ACTIVITY_TYPE = {
  run: 9.8,      // running ~6mph / 10-min-mile pace — vigorous
  swim: 6.0,     // swimming, moderate/recreational
  lift: 5.0,     // resistance training, vigorous effort
  bike: 7.5,     // cycling, moderate 12-14mph
  walk: 3.5,     // walking, moderate pace 2.8-3.2mph — Compendium's own cited value
  yoga: 2.5,     // Hatha/general yoga
  other: 4.0,    // moderate-intensity catch-all
  weighin: 0,    // not physical activity
  event: 0,      // not physical activity
};
const MET_FALLBACK = 4.0; // moderate default for any custom/unrecognized type

export function metForActivityType(activityTypeId) {
  return MET_BY_ACTIVITY_TYPE[activityTypeId] ?? MET_FALLBACK;
}

// Most recent weigh-in's weightKg (sorted by date+time desc), or null if
// there are none logged — never fabricate a default body weight.
export function latestBodyWeightKg(bodyWeightLogs) {
  if (!bodyWeightLogs?.length) return null;
  const sorted = [...bodyWeightLogs].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  return sorted[0]?.weightKg ?? null;
}

// Only completed workouts with a logged duration can be estimated — a
// planned/future workout has no real effort to measure yet.
export function estimateWorkoutCalories(workout, bodyWeightKg) {
  if (!workout || workout.status !== 'completed' || !workout.durationSec) return null;
  if (bodyWeightKg == null) return null;
  const met = metForActivityType(workout.activityType);
  const hours = workout.durationSec / 3600;
  return met * bodyWeightKg * hours;
}

// net = food eaten that day - BMR - workout calories burned that day. Missing
// bmr/bodyWeightKg degrade to a 0 contribution (never NaN/crash) — a day with
// only meals logged still shows a meaningful (if partial) net.
export function netCaloriesForDay(meals, workouts, dateISO, bmr, bodyWeightKg) {
  const food = dailyTotals(meals, dateISO).calories || 0;
  const burned = workouts
    .filter((w) => w.date === dateISO)
    .reduce((sum, w) => sum + (estimateWorkoutCalories(w, bodyWeightKg) || 0), 0);
  return Math.round(food - (bmr || 0) - burned);
}
