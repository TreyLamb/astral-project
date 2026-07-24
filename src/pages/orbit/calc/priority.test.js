import { describe, it, expect } from 'vitest';
import { computePriorityScore, taskCost, isOverdue, compareForToday } from './priority';

const task = (over = {}) => ({
  id: 't1', status: 'todo', importance: 3, urgency: 3, difficulty: 3, energy: 3, dueDate: null, priorityScore: 0, ...over,
});

describe('taskCost', () => {
  it('averages difficulty and energy', () => {
    expect(taskCost(task({ difficulty: 1, energy: 5 }))).toBe(3);
  });
});

describe('computePriorityScore', () => {
  it('uses the default weights when no settings given', () => {
    const t = task({ importance: 4, urgency: 3, difficulty: 2, energy: 4 }); // cost = 3
    expect(computePriorityScore(t)).toBe(2 * 4 + 2 * 3 - 1 * 3);
  });
  it('honors custom weights from settings', () => {
    const t = task({ importance: 4, urgency: 3, difficulty: 2, energy: 4 }); // cost = 3
    const settings = { importanceWeight: 3, urgencyWeight: 1, costWeight: 2 };
    expect(computePriorityScore(t, settings)).toBe(3 * 4 + 1 * 3 - 2 * 3);
  });
});

describe('isOverdue', () => {
  it('is true for a past dueDate on an open task', () => {
    expect(isOverdue(task({ dueDate: '2026-07-01' }), '2026-07-23')).toBe(true);
  });
  it('is false for a future dueDate', () => {
    expect(isOverdue(task({ dueDate: '2026-08-01' }), '2026-07-23')).toBe(false);
  });
  it('is false with no dueDate', () => {
    expect(isOverdue(task({ dueDate: null }), '2026-07-23')).toBe(false);
  });
  it('is false once the task is done, even if the date is past', () => {
    expect(isOverdue(task({ dueDate: '2026-07-01', status: 'done' }), '2026-07-23')).toBe(false);
  });
  it('is false once the task is killed, even if the date is past', () => {
    expect(isOverdue(task({ dueDate: '2026-07-01', status: 'killed' }), '2026-07-23')).toBe(false);
  });
});

describe('compareForToday', () => {
  const today = '2026-07-23';

  it('puts an overdue low-score task above a non-overdue high-score task', () => {
    const a = task({ id: 'a', dueDate: '2026-07-01', priorityScore: 2 });
    const b = task({ id: 'b', dueDate: null, priorityScore: 20 });
    expect([a, b].sort((x, y) => compareForToday(x, y, today)).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('sorts by priorityScore desc when overdue-ness matches', () => {
    const a = task({ id: 'a', priorityScore: 5 });
    const b = task({ id: 'b', priorityScore: 9 });
    expect([a, b].sort((x, y) => compareForToday(x, y, today)).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('among overdue tasks, ranks the higher priorityScore first', () => {
    const a = task({ id: 'a', dueDate: '2026-07-01', priorityScore: 3 });
    const b = task({ id: 'b', dueDate: '2026-07-05', priorityScore: 8 });
    expect([a, b].sort((x, y) => compareForToday(x, y, today)).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('breaks priorityScore ties by dueDate asc, nulls last', () => {
    const a = task({ id: 'a', priorityScore: 5, dueDate: null });
    const b = task({ id: 'b', priorityScore: 5, dueDate: '2026-08-01' });
    const c = task({ id: 'c', priorityScore: 5, dueDate: '2026-07-25' });
    expect([a, b, c].sort((x, y) => compareForToday(x, y, today)).map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });
});
