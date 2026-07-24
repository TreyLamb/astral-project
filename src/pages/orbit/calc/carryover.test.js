import { describe, it, expect } from 'vitest';
import { carryoverCandidates } from './carryover';

const task = (id, over = {}) => ({ id, title: id, status: 'todo', scheduledDate: null, dueDate: null, ...over });

describe('carryoverCandidates', () => {
  const today = '2026-07-23';

  it('picks an open task with an overdue scheduledDate, suggesting reschedule', () => {
    const t = task('a', { scheduledDate: '2026-07-20' });
    const out = carryoverCandidates([t], today);
    expect(out.map((c) => c.taskId)).toEqual(['a']);
    expect(out[0].suggestedAction).toBe('reschedule');
  });

  it('picks an open task with only an overdue dueDate, suggesting raiseUrgency', () => {
    const t = task('a', { dueDate: '2026-07-20' });
    const out = carryoverCandidates([t], today);
    expect(out.map((c) => c.taskId)).toEqual(['a']);
    expect(out[0].suggestedAction).toBe('raiseUrgency');
  });

  it('ignores a done task even with an overdue scheduledDate', () => {
    const t = task('a', { scheduledDate: '2026-07-20', status: 'done' });
    expect(carryoverCandidates([t], today)).toEqual([]);
  });

  it('ignores a killed task even with an overdue dueDate', () => {
    const t = task('a', { dueDate: '2026-07-20', status: 'killed' });
    expect(carryoverCandidates([t], today)).toEqual([]);
  });

  it('ignores a task scheduled for today itself', () => {
    const t = task('a', { scheduledDate: today });
    expect(carryoverCandidates([t], today)).toEqual([]);
  });

  it('ignores a task scheduled in the future', () => {
    const t = task('a', { scheduledDate: '2026-07-30' });
    expect(carryoverCandidates([t], today)).toEqual([]);
  });

  it('ignores an open task with no scheduledDate or dueDate at all', () => {
    expect(carryoverCandidates([task('a')], today)).toEqual([]);
  });
});
