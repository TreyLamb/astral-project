import { describe, it, expect } from 'vitest';
import { mondayOf, buildReview } from './review';

// See calc/trackers.test.js header — local-time ms fixtures avoid drift
// against the local-time isoDate() the app reads them back with.
const localMs = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

const task = (id, over = {}) => ({ id, status: 'todo', dueDate: null, completedAt: null, ...over });
const project = (id, over = {}) => ({ id, status: 'active', lastTouchedAt: localMs(2026, 7, 23), ...over });

describe('mondayOf', () => {
  it('returns the same date when already a Monday', () => {
    expect(mondayOf('2026-07-20')).toBe('2026-07-20');
  });

  it('walks a mid-week date back to its Monday', () => {
    expect(mondayOf('2026-07-23')).toBe('2026-07-20'); // Thursday
  });

  it('treats Sunday as the end of the prior Monday week, not its own', () => {
    expect(mondayOf('2026-07-19')).toBe('2026-07-13'); // Sunday
  });
});

describe('buildReview', () => {
  const today = '2026-07-23';
  const staleDays = 14;

  it('sets weekOf to the Monday of the current week', () => {
    const out = buildReview([], [], today, staleDays);
    expect(out.weekOf).toBe('2026-07-20');
  });

  it('includes tasks completed within the trailing 7-day window, including today', () => {
    const tasks = [
      task('a', { completedAt: localMs(2026, 7, 23) }), // today
      task('b', { completedAt: localMs(2026, 7, 17) }), // 6 days ago, edge of window
      task('c', { completedAt: localMs(2026, 7, 16) }), // 7 days ago, outside window
      task('d', { completedAt: null }),
    ];
    const out = buildReview(tasks, [], today, staleDays);
    expect(out.shippedTaskIds.sort()).toEqual(['a', 'b']);
  });

  it('flags active projects untouched for longer than staleDays', () => {
    const projects = [
      project('p1', { lastTouchedAt: localMs(2026, 7, 1) }), // 22 days ago -> stale
      project('p2', { lastTouchedAt: localMs(2026, 7, 20) }), // 3 days ago -> fresh
      project('p3', { status: 'paused', lastTouchedAt: localMs(2026, 7, 1) }), // not active, ignored
    ];
    const out = buildReview([], projects, today, staleDays);
    expect(out.staleProjectIds).toEqual(['p1']);
  });

  it('lists overdue open tasks and excludes done/killed/future/no-date ones', () => {
    const tasks = [
      task('a', { dueDate: '2026-07-20' }), // overdue, open
      task('b', { dueDate: '2026-07-20', status: 'done' }),
      task('c', { dueDate: '2026-07-20', status: 'killed' }),
      task('d', { dueDate: '2026-08-01' }),
      task('e'),
    ];
    const out = buildReview(tasks, [], today, staleDays);
    expect(out.overdueTaskIds).toEqual(['a']);
  });
});
