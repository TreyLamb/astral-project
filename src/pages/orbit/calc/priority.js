// Orbit priority scoring — the single source of truth for a task's rank.
// The data layer (later phase) always recomputes via computePriorityScore on
// write; the UI never supplies/edits a score directly.

// Mirrors Settings' importanceWeight/urgencyWeight/costWeight defaults —
// used whenever a real settings object isn't available yet (e.g. a factory
// call before settings has loaded).
export const DEFAULT_WEIGHTS = { importanceWeight: 2, urgencyWeight: 2, costWeight: 1 };

// An axis the user hasn't scored is null, NOT 3 (see AxisChips). Storing a
// fabricated 3 would make an unscored task indistinguishable from a deliberately
// mid-scored one, and it would sail through triage looking already-handled.
//
// For RANKING ONLY an unscored axis reads as the neutral midpoint, so a task
// that hasn't been scored yet sorts sanely instead of falling to the bottom
// (bare `null` coerces to 0 in JS arithmetic — silently wrong, not an error).
// This value is never written back to the task.
const NEUTRAL_AXIS = 3;
const axis = (v) => (v == null ? NEUTRAL_AXIS : v);

// "Still needs triage" — any axis left unscored.
export function isUnscored(task) {
  return task.importance == null || task.urgency == null
    || task.difficulty == null || task.energy == null;
}

// timeMin is reserved for the Phase-2 capacity planner, NOT the base rank —
// cost here is purely the 1-5 difficulty/energy "how much of me does this cost" pair.
export function taskCost(task) {
  return (axis(task.difficulty) + axis(task.energy)) / 2;
}

export function computePriorityScore(task, settings) {
  const w = settings || DEFAULT_WEIGHTS;
  return w.importanceWeight * axis(task.importance)
    + w.urgencyWeight * axis(task.urgency)
    - w.costWeight * taskCost(task);
}

export function isOverdue(task, todayStr) {
  return task.dueDate != null && task.dueDate < todayStr && task.status !== 'done' && task.status !== 'killed';
}

function compareDueDateAsc(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulls last
  if (b == null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

// Today list ordering: overdue tasks first (ranked by priorityScore among
// themselves), then everyone else by priorityScore desc, ties broken by
// dueDate asc with nulls last. Reads a/b.priorityScore as already-computed
// (see file header) rather than recalculating it here.
export function compareForToday(a, b, todayStr) {
  const aOverdue = isOverdue(a, todayStr);
  const bOverdue = isOverdue(b, todayStr);
  if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  return compareDueDateAsc(a.dueDate, b.dueDate);
}
