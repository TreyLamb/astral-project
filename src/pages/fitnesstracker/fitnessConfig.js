// FitnessTracker config — activity types, workout-record schema, units defaults.
//
// Two ground rules from FT_ProjectDoc.md live here:
//   1. Activity types are DATA, not code. Built-ins are defined below; user-added
//      custom types live in settings.customTypes — so adding a type needs no code change.
//   2. All measurements are stored CANONICAL: distance in meters, weight in
//      kilograms, duration in seconds. units.js converts to the display preference.

export const DEFAULT_UNITS = { distance: 'mi', pool: 'yd', weight: 'lb' }; // US-based default

// `kind` selects which rich metric set a type gets in later phases (run/swim/lift
// are built out in Phases 2–3); 'generic' is the extensible fallback. `color`
// drives the calendar colour-coding.
export const DEFAULT_ACTIVITY_TYPES = [
  { id: 'run',  name: 'Run',  kind: 'run',     color: '#f97316', icon: '🏃' },
  { id: 'swim', name: 'Swim', kind: 'swim',    color: '#38bdf8', icon: '🏊' },
  { id: 'lift', name: 'Lift', kind: 'lift',    color: '#a3e635', icon: '🏋️' },
  { id: 'bike', name: 'Bike', kind: 'generic', color: '#f43f5e', icon: '🚴' },
  { id: 'walk', name: 'Walk', kind: 'generic', color: '#22c55e', icon: '🚶' },
  { id: 'yoga', name: 'Yoga', kind: 'generic', color: '#a78bfa', icon: '🧘' },
  { id: 'event', name: 'Event', kind: 'event', color: '#c084fc', icon: '📅' }, // non-workout calendar drops ("POGO raichu day")
  { id: 'other', name: 'Other', kind: 'generic', color: '#94a3b8', icon: '⭐' },
];

// Meal types — same "data, not code" rule as activity types: built-ins below,
// user-added custom types live in settings.mealCustomTypes.
export const DEFAULT_MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', color: '#fbbf24', icon: '🍳' },
  { id: 'lunch',     name: 'Lunch',     color: '#34d399', icon: '🥪' },
  { id: 'dinner',    name: 'Dinner',    color: '#60a5fa', icon: '🍽️' },
  { id: 'snack',     name: 'Snack',     color: '#f472b6', icon: '🍎' },
];

export function resolveMealTypes(settings) {
  const map = new Map();
  for (const t of DEFAULT_MEAL_TYPES) map.set(t.id, t);
  for (const t of (settings?.mealCustomTypes || [])) map.set(t.id, { icon: '•', ...t });
  return [...map.values()];
}

export function mealType(types, id) {
  return types.find((t) => t.id === id)
    || { id, name: id, color: '#94a3b8', icon: '•' };
}

export const RPE_MIN = 1;
export const RPE_MAX = 10;

// One-line description per RPE number, shown under the intensity toggle on
// hover/focus (falls back to the selected number when nothing is hovered).
// Edit freely per number.
export const RPE_LEGEND = {
  1: 'Barely felt it — could do this all day',
  2: 'Very easy — warm-up pace',
  3: 'Easy — comfortable, chatting the whole time',
  4: 'Moderate — steady effort, still talking fine',
  5: 'Getting real — breathing harder, shorter sentences',
  6: 'Hard — one-word answers only',
  7: 'Very hard — no talking, just breathing',
  8: 'Brutal — everything is burning',
  9: "Near max — don't know how much longer",
  10: 'Almost died — the workout was so hard',
};

export function defaultSettings() {
  // profile.maxHr/restHr feed the Karvonen HR zones (real measured values, not
  // 220-age). calendar holds the Phase-5 Google Calendar link state. groups are
  // numbered+coloured workout groupings (see resolveGroups); lastGroupId is the
  // sticky default a new QuickAdd entry starts with. calendarPrefs are the two
  // meal-schedule calendar toggles (sticky across sessions). nutritionTarget is
  // an optional daily calorie/macro target shown as a progress reference in the
  // Meals tab — left null until the user sets one, never assumed.
  return {
    units: { ...DEFAULT_UNITS },
    customTypes: [],
    mealCustomTypes: [],
    profile: { maxHr: null, restHr: null },
    calendar: { connected: false, calendarId: null, lastSync: null },
    calendarPrefs: { mealDayView: false, showMealsOnCalendar: false },
    nutritionTarget: { calories: null, proteinG: null, carbsG: null, fatG: null },
    groups: [],
    lastGroupId: null,
  };
}

export function withSettingsDefaults(s) {
  const d = defaultSettings();
  return {
    units: { ...d.units, ...(s?.units || {}) },
    customTypes: Array.isArray(s?.customTypes) ? s.customTypes : [],
    mealCustomTypes: Array.isArray(s?.mealCustomTypes) ? s.mealCustomTypes : [],
    profile: { ...d.profile, ...(s?.profile || {}) },
    calendar: { ...d.calendar, ...(s?.calendar || {}) },
    calendarPrefs: { ...d.calendarPrefs, ...(s?.calendarPrefs || {}) },
    nutritionTarget: { ...d.nutritionTarget, ...(s?.nutritionTarget || {}) },
    groups: Array.isArray(s?.groups) ? s.groups : [],
    lastGroupId: s?.lastGroupId ?? null,
  };
}

// Numbered, coloured workout groups ("Group #3") — a lightweight tag so several
// related planned sessions (e.g. a taper week) can be moved together instead of
// blindly cascading everything chronologically after one date.
export const GROUP_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb7185', '#2dd4bf', '#facc15'];

export function resolveGroups(settings) {
  return Array.isArray(settings?.groups) ? settings.groups : [];
}

export function nextGroupNumber(settings) {
  return resolveGroups(settings).reduce((max, g) => Math.max(max, Number(g.number) || 0), 0) + 1;
}

export function colorForGroupIndex(i) {
  return GROUP_COLORS[i % GROUP_COLORS.length];
}

export function groupById(settings, id) {
  return id ? resolveGroups(settings).find((g) => g.id === id) || null : null;
}

// Built-ins + user custom types, de-duped by id (a custom type with a built-in's
// id overrides it — lets the user re-colour/rename a default).
export function resolveActivityTypes(settings) {
  const map = new Map();
  for (const t of DEFAULT_ACTIVITY_TYPES) map.set(t.id, t);
  for (const t of (settings?.customTypes || [])) map.set(t.id, { kind: 'generic', icon: '•', ...t });
  return [...map.values()];
}

export function activityType(types, id) {
  return types.find((t) => t.id === id)
    || { id, name: id, kind: 'generic', color: '#94a3b8', icon: '•' };
}

let idCounter = 0;
export function newId() {
  return `w_${Date.now().toString(36)}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return isoDate(new Date());
}

// A fresh workout record in canonical units. status: 'planned' | 'completed'.
// goalId links this session to a Goal's generated training plan (see calc/goals.js)
// — null for ordinary manually-logged/scheduled workouts.
export function newWorkout(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    date: partial.date || todayISO(), // 'YYYY-MM-DD' (the calendar's key)
    time: partial.time ?? '',         // 'HH:MM', optional
    activityType: partial.activityType || 'run',
    status: partial.status || 'completed',
    durationSec: partial.durationSec ?? null,
    distanceM: partial.distanceM ?? null,
    note: partial.note ?? '',
    rpe: partial.rpe ?? null,
    groupId: partial.groupId ?? null,
    goalId: partial.goalId ?? null,
    metrics: partial.metrics ?? {}, // per-activity extras, filled out in Phases 2–3
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

// A fresh meal record in canonical units (calories/macros are already unit-free
// counts, so unlike workouts there's no distance/weight-unit conversion here).
// status: 'planned' | 'logged' (meals use "logged" rather than workouts' "completed"
// — you log what you ate, you don't "complete" it).
export function newMeal(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    date: partial.date || todayISO(),
    time: partial.time ?? '',
    mealType: partial.mealType || 'breakfast',
    status: partial.status || 'logged',
    name: partial.name ?? '',
    calories: partial.calories ?? null,
    proteinG: partial.proteinG ?? null,
    carbsG: partial.carbsG ?? null,
    fatG: partial.fatG ?? null,
    note: partial.note ?? '',
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

// A training Goal: forecast-then-accept. Everything numeric is canonical
// (seconds for time targets, meters for distance, kg for weight) so it composes
// with the existing calculators (vdot.js / swim.js / lift.js) without re-deriving
// unit handling. See calc/goals.js for the forecast math and plan generation.
//   kind: 'run' | 'swim' | 'lift' | 'generic' — selects the forecast formula.
//   status: 'forecast' (previewed, not on the calendar yet) | 'accepted' (plan
//     generated onto the calendar) | 'abandoned'.
export function newGoal(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    activityType: partial.activityType || 'run',
    kind: partial.kind || 'generic',
    label: partial.label ?? '',           // e.g. "1 mile", "Bench press"
    targetDistanceM: partial.targetDistanceM ?? null,  // run/swim time-goals
    targetValue: partial.targetValue ?? null,          // seconds (run/swim) or kg (lift) or raw number (generic)
    baselineValue: partial.baselineValue ?? null,       // estimated current performance, same unit as targetValue
    daysPerWeek: partial.daysPerWeek ?? 3,
    startDate: partial.startDate || todayISO(),
    forecastWeeks: partial.forecastWeeks ?? null,
    targetDate: partial.targetDate ?? null,
    status: partial.status || 'forecast',
    note: partial.note ?? '',
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}
