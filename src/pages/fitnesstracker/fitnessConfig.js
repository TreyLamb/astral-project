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
  { id: 'weighin', name: 'Weigh-in', kind: 'weight', color: '#fb923c', icon: '⚖️' }, // body-composition goal checkpoints resolve against BodyWeightLog, not a completed workout
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
  // 220-age). profile.bmr is the user's measured/estimated Basal Metabolic Rate
  // (kcal/day), used by calc/calories.js's netCaloriesForDay — left null until
  // set, never assumed. profile.heightCm/age/sex feed calc/bmr.js's
  // mifflinStJeorBmr() to auto-populate profile.bmr (see Settings.jsx); sex is
  // ONLY the BMR-formula constant, not stored/used anywhere else.
  // profile.bmrManual: true once the user has directly typed a BMR value —
  // "locks" it so the auto-calc effect stops overwriting it. profile.notes is
  // free-text (injuries/PRs/etc — deliberately not a preset dropdown per the
  // project's open-ended-value UI rule). calendar holds the Phase-5 Google
  // Calendar link state. groups are numbered+coloured workout groupings (see
  // resolveGroups); lastGroupId is the sticky default a new QuickAdd entry
  // starts with. calendarPrefs are the two meal-schedule calendar toggles
  // (sticky across sessions). nutritionTarget is an optional daily
  // calorie/macro target shown as a progress reference in the Meals tab and
  // the calendar day-header badge — left null until the user sets one, never
  // assumed. detailedView toggles whether Settings shows empty/unfilled
  // input rows (off) or the full form (on) — default off, see Settings.jsx.
  return {
    units: { ...DEFAULT_UNITS },
    customTypes: [],
    mealCustomTypes: [],
    profile: { maxHr: null, restHr: null, bmr: null, bmrManual: false, heightCm: null, age: null, sex: null, notes: '' },
    calendar: { connected: false, calendarId: null, lastSync: null },
    // chipFilter: 'all' | 'noEvents' | 'noWorkouts' — which calendar chips
    // render (display-only; never affects underlying data, drag/drop, weekly
    // totals, or Goals). 'noEvents' hides activityType kind:'event' items
    // (calendar drops like "POGO raichu day"); 'noWorkouts' hides everything
    // else. Cycled by the button in CalendarView's ft-cal-toggles row.
    calendarPrefs: { mealDayView: false, showMealsOnCalendar: false, chipFilter: 'all' },
    // proteinG/carbsG/fatG are canonical grams (as always); *Mode ('g' | 'pct')
    // + *Pct record which of grams/% the user's last edit for that macro
    // actually expressed, so Settings.jsx's calorie-goal-changed effect knows
    // which one to hold fixed while recomputing the other. Both grams and %
    // are always live editable fields, not a mode you switch between.
    nutritionTarget: {
      calories: null, proteinG: null, carbsG: null, fatG: null,
      proteinMode: 'g', carbsMode: 'g', fatMode: 'g',
      proteinPct: null, carbsPct: null, fatPct: null,
    },
    groups: [],
    lastGroupId: null,
    detailedView: false,
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
    detailedView: s?.detailedView ?? false,
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

// A training Goal: forecast-then-accept, checkpoint-tracked. Everything numeric
// is canonical (seconds for time targets, meters for distance, kg for weight)
// so it composes with the existing calculators (vdot.js / swim.js / lift.js /
// bodyComposition.js) without re-deriving unit handling. See calc/checkpoints.js
// for cadence/curve/recompute math, calc/curves.js for per-domain curve shape.
//   kind: 'run' | 'swim' | 'lift' | 'generic' | 'weight' — selects the curve +
//     realism model (calc/curves.js / calc/realism.js).
//   direction: 'loss' | 'gain' — required for kind:'weight' (energy-balance
//     math is direction-sensitive; irrelevant for other kinds).
//   deadline: real user input, 'YYYY-MM-DD' — Goal = target + deadline
//     (Guidelines_Forecast.md §1). durationWeeks is an alternate input form
//     ("deadline OR duration") resolved to `deadline` at save time by the editor.
//   taskFrequency: how often you train (separate from checkpoint cadence below
//     — Guidelines_Forecast.md §1's task-frequency-vs-checkpoint-frequency
//     split). `daysPerWeek` is kept as a plain mirror for old-goal back-compat
//     reads; new code should read taskFrequency.value instead.
//   cadence: how often the forecast re-benchmarks — independent of
//     taskFrequency. { type: 'auto' } lets calc/checkpoints.js suggest one
//     based on goal duration; other types are user-picked.
//   checkpoints: ordered array of { date, targetValue, source, realism,
//     provisional, actualValue, loggedAt, status } — the recompute source of
//     truth (calc/checkpoints.js). null on goals saved before this existed, or
//     not yet generated — see withGoalDefaults()/goalDeadline() below, which
//     let old goals keep rendering/editing exactly as they did without a
//     migration script (this app has none).
//   status: 'forecast' (previewed, not on calendar) | 'accepted' (checkpoints
//     generated onto the calendar) | 'paused' (frozen, not deleted) |
//     'closed_met' | 'closed_not_met' | 'abandoned'.
export function newGoal(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    activityType: partial.activityType || 'run',
    kind: partial.kind || 'generic',
    label: partial.label ?? '',           // e.g. "1 mile", "Bench press"
    targetDistanceM: partial.targetDistanceM ?? null,  // run/swim time-goals
    targetValue: partial.targetValue ?? null,          // seconds (run/swim), kg (lift/weight), or raw number (generic)
    baselineValue: partial.baselineValue ?? null,       // estimated/entered current performance, same unit as targetValue
    baselineDate: partial.baselineDate ?? null,         // when the baseline was true — anchors the with-data solve-backward curve
    direction: partial.direction ?? null,               // 'loss' | 'gain' — kind:'weight' only
    deadline: partial.deadline ?? null,
    durationWeeks: partial.durationWeeks ?? null,
    taskFrequency: partial.taskFrequency ?? { type: 'daysPerWeek', value: partial.daysPerWeek ?? 3 },
    daysPerWeek: partial.daysPerWeek ?? 3,               // kept for back-compat reads; see taskFrequency
    cadence: partial.cadence ?? { type: 'auto' },
    checkpoints: partial.checkpoints ?? null,
    startDate: partial.startDate || todayISO(),
    forecastWeeks: partial.forecastWeeks ?? null,
    targetDate: partial.targetDate ?? null,             // becomes an alias of `deadline` going forward — see goalDeadline()
    status: partial.status || 'forecast',
    pausedAt: partial.pausedAt ?? null,
    closedAt: partial.closedAt ?? null,
    note: partial.note ?? '',
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}

// Single accessor for "when is this goal due" — new goals set `deadline`
// directly; goals saved before this field existed only have the computed
// `targetDate`. Everywhere that needs a goal's due date should call this
// instead of reaching into either field directly.
export function goalDeadline(g) {
  return g?.deadline || g?.targetDate || null;
}

// Back-fills fields added after a goal may have already been saved, without
// rewriting localStorage/Firestore (this app has no migration tooling — see
// CLAUDE.md). Call once per goal on read (storage getGoals() and the
// fitnessContext load effect both do this) so every consumer can rely on
// these fields existing, even for a goal saved under the old Phase-9 shape.
export function withGoalDefaults(g) {
  return {
    ...g,
    taskFrequency: g.taskFrequency ?? { type: 'daysPerWeek', value: g.daysPerWeek ?? 3 },
    cadence: g.cadence ?? { type: 'auto' },
    checkpoints: g.checkpoints ?? null,
    status: g.status || 'forecast',
  };
}

// A single body-weight log ("weigh-in"). Canonical unit = kg, same rule as
// every other measurement in this file. bodyFatPct is captured for trend
// context only — it is not a forecast target (no per-person body-fat model
// is cited/researched; the 'weight' goal kind forecasts bodyweight only).
// goalId is optional — set when a weigh-in is logged close enough to a
// 'weight'-kind goal's scheduled checkpoint to auto-satisfy it (see
// fitnessContext.js's addBodyWeightLog).
export function newBodyWeightLog(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    date: partial.date || todayISO(),
    time: partial.time ?? '',
    weightKg: partial.weightKg ?? null,
    bodyFatPct: partial.bodyFatPct ?? null,
    note: partial.note ?? '',
    goalId: partial.goalId ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
}
