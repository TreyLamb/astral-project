// Orbit priority scoring — the single source of truth for a task's rank.
// The data layer (later phase) always recomputes via computePriorityScore on
// write; the UI never supplies/edits a score directly.

// Mirrors Settings' importanceWeight/urgencyWeight/costWeight defaults —
// used whenever a real settings object isn't available yet (e.g. a factory
// call before settings has loaded).
export const DEFAULT_WEIGHTS = { importanceWeight: 2, urgencyWeight: 2, costWeight: 1 };

// timeMin is reserved for the Phase-2 capacity planner, NOT the base rank —
// cost here is purely the 1-5 difficulty/energy "how much of me does this cost" pair.
export function taskCost(task) {
  return (task.difficulty + task.energy) / 2;
}

export function computePriorityScore(task, settings) {
  const w = settings || DEFAULT_WEIGHTS;
  return w.importanceWeight * task.importance + w.urgencyWeight * task.urgency - w.costWeight * taskCost(task);
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
