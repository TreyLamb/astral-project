// Orbit config — entity factories, defaults, and constants. Phase-1 data
// model only (no storage/context/UI here — see calc/priority.js and
// calc/readiness.js for the pure logic these factories lean on).
//
// Ground rule copied from FitnessTracker: timestamps are ms epoch
// (Date.now()), dates are 'YYYY-MM-DD' strings, and every entity gets a
// with*Defaults(raw) reader so older stored rows normalize on read — no
// migration script (this app has none, see fitnessConfig.js precedent).

import { computePriorityScore } from './calc/priority';

let idCounter = 0;
export function newId() {
  return `o_${Date.now().toString(36)}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
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

// --- Area ---------------------------------------------------------------

export function newArea(partial = {}) {
  return {
    id: newId(),
    name: partial.name ?? '',
    color: partial.color ?? '#94a3b8',
    sortOrder: partial.sortOrder ?? 0,
    archived: partial.archived ?? false,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// Muted starter palette, ready to seed a first run.
export const SEED_AREAS = [
  { name: 'Work', color: '#6e8fb0' },
  { name: 'Personal', color: '#b08a6e' },
  { name: 'Home', color: '#7c9473' },
  { name: 'Health', color: '#b0716e' },
  { name: 'Learning', color: '#9077ab' },
];

// --- Project --------------------------------------------------------------
// status: 'active' | 'paused' | 'done' | 'archived'

export function newProject(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    areaId: partial.areaId ?? null,
    name: partial.name ?? '',
    status: partial.status || 'active',
    notesMarkdown: partial.notesMarkdown ?? '',
    dueDate: partial.dueDate ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
    lastTouchedAt: partial.lastTouchedAt ?? now,
  };
}

export function withProjectDefaults(p) {
  return {
    ...p,
    status: p.status || 'active',
    notesMarkdown: p.notesMarkdown ?? '',
    dueDate: p.dueDate ?? null,
    updatedAt: p.updatedAt ?? p.createdAt ?? Date.now(),
    lastTouchedAt: p.lastTouchedAt ?? p.updatedAt ?? p.createdAt ?? Date.now(),
  };
}

// --- Task -------------------------------------------------------------
// status: 'todo' | 'doing' | 'done' | 'killed'
// importance/urgency/difficulty/energy: ints 1-5. timeMin: int minutes or
// null. lane: 'now' | 'next' | 'later' | null. parentTaskId enables nested
// subtasks (and sub-sub-tasks). NO `effort` field — intentionally replaced
// by timeMin+difficulty+energy (see calc/priority.js's taskCost).

export function newTask(partial = {}, settings) {
  const now = Date.now();
  const task = {
    id: newId(),
    title: partial.title ?? '',
    areaId: partial.areaId ?? null,
    projectId: partial.projectId ?? null,
    parentTaskId: partial.parentTaskId ?? null,
    status: partial.status || 'todo',
    importance: partial.importance ?? 3,
    urgency: partial.urgency ?? 3,
    timeMin: partial.timeMin ?? null,
    difficulty: partial.difficulty ?? 3,
    energy: partial.energy ?? 3,
    priorityScore: 0,
    taskType: partial.taskType ?? null,
    dueDate: partial.dueDate ?? null,
    scheduledDate: partial.scheduledDate ?? null,
    scheduledTime: partial.scheduledTime ?? null,
    pinnedToday: partial.pinnedToday ?? false,
    pinnedOn: partial.pinnedOn ?? null,
    blockedBy: partial.blockedBy ?? [],
    lane: partial.lane ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    createdAt: partial.createdAt ?? now,
    completedAt: partial.completedAt ?? null,
    lastTouchedAt: partial.lastTouchedAt ?? now,
  };
  task.priorityScore = computePriorityScore(task, settings);
  return task;
}

export function withTaskDefaults(t) {
  return {
    ...t,
    parentTaskId: t.parentTaskId ?? null,
    timeMin: t.timeMin ?? null,
    difficulty: t.difficulty ?? 3,
    energy: t.energy ?? 3,
    priorityScore: t.priorityScore ?? computePriorityScore(t),
    taskType: t.taskType ?? null,
    pinnedToday: t.pinnedToday ?? false,
    pinnedOn: t.pinnedOn ?? null,
    blockedBy: Array.isArray(t.blockedBy) ? t.blockedBy : [],
    lane: t.lane ?? null,
    recurrenceId: t.recurrenceId ?? null,
    completedAt: t.completedAt ?? null,
    lastTouchedAt: t.lastTouchedAt ?? t.createdAt ?? Date.now(),
  };
}

// --- InboxItem -----------------------------------------------------------
// outcome: null | 'task' | 'project' | 'reference' | 'discarded'

export function newInboxItem(partial = {}) {
  return {
    id: newId(),
    rawText: partial.rawText ?? '',
    createdAt: partial.createdAt ?? Date.now(),
    triaged: partial.triaged ?? false,
    outcome: partial.outcome ?? null,
    discardedAt: partial.discardedAt ?? null,
    resultId: partial.resultId ?? null,
    aiCleanedAt: partial.aiCleanedAt ?? null,
    aiCleanedFrom: partial.aiCleanedFrom ?? null,
  };
}

// --- Settings --------------------------------------------------------------
// taskTypes are NS-1 task-kind filters, user-extendable later — data, not code.

export const DEFAULT_TASK_TYPES = ['Deep Work', 'Admin', 'Errand', 'Chore', 'Call', 'Quick Win', 'Health'];

export function defaultSettings() {
  return {
    importanceWeight: 2,
    urgencyWeight: 2,
    costWeight: 1,
    staleDays: 14,
    discardRetentionDays: 30,
    defaultView: 'today',
    lanes: ['now', 'next', 'later'],
    taskTypes: [...DEFAULT_TASK_TYPES],
    capacityDefault: { timeMin: 480, energy: 15 },
  };
}

export function withSettingsDefaults(raw) {
  const d = defaultSettings();
  return {
    importanceWeight: raw?.importanceWeight ?? d.importanceWeight,
    urgencyWeight: raw?.urgencyWeight ?? d.urgencyWeight,
    costWeight: raw?.costWeight ?? d.costWeight,
    staleDays: raw?.staleDays ?? d.staleDays,
    discardRetentionDays: raw?.discardRetentionDays ?? d.discardRetentionDays,
    defaultView: raw?.defaultView ?? d.defaultView,
    lanes: Array.isArray(raw?.lanes) ? raw.lanes : d.lanes,
    taskTypes: Array.isArray(raw?.taskTypes) ? raw.taskTypes : d.taskTypes,
    capacityDefault: { ...d.capacityDefault, ...(raw?.capacityDefault || {}) },
  };
}
