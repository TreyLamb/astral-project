import { describe, it, expect } from 'vitest';
import { isReady, blockerTitles, wouldCreateCycle } from './readiness';

const task = (id, over = {}) => ({ id, title: id, status: 'todo', blockedBy: [], ...over });

function byId(tasks) {
  return new Map(tasks.map((t) => [t.id, t]));
}

describe('isReady', () => {
  it('is ready with no blockers', () => {
    const a = task('a');
    expect(isReady(a, byId([a]))).toBe(true);
  });

  it('is ready when every blocker is done or killed', () => {
    const b1 = task('b1', { status: 'done' });
    const b2 = task('b2', { status: 'killed' });
    const a = task('a', { blockedBy: ['b1', 'b2'] });
    expect(isReady(a, byId([a, b1, b2]))).toBe(true);
  });

  it('is blocked when a blocker is still todo', () => {
    const b1 = task('b1', { status: 'todo' });
    const a = task('a', { blockedBy: ['b1'] });
    expect(isReady(a, byId([a, b1]))).toBe(false);
  });

  it('ignores blocker ids that do not resolve to a task', () => {
    const a = task('a', { blockedBy: ['ghost'] });
    expect(isReady(a, byId([a]))).toBe(true);
  });

  it('flips ready once the blocking task completes', () => {
    const b1 = task('b1', { status: 'todo' });
    const a = task('a', { blockedBy: ['b1'] });
    const map = byId([a, b1]);
    expect(isReady(a, map)).toBe(false);
    b1.status = 'done';
    expect(isReady(a, map)).toBe(true);
  });
});

describe('blockerTitles', () => {
  it('lists only the still-open blockers', () => {
    const b1 = task('b1', { title: 'Buy parts', status: 'todo' });
    const b2 = task('b2', { title: 'Already done', status: 'done' });
    const a = task('a', { blockedBy: ['b1', 'b2'] });
    expect(blockerTitles(a, byId([a, b1, b2]))).toEqual(['Buy parts']);
  });

  it('returns an empty array when nothing is blocking', () => {
    const a = task('a');
    expect(blockerTitles(a, byId([a]))).toEqual([]);
  });
});

describe('wouldCreateCycle', () => {
  it('detects a direct cycle', () => {
    const a = task('a');
    const b = task('b', { blockedBy: ['a'] }); // b already depends on a
    expect(wouldCreateCycle('a', 'b', byId([a, b]))).toBe(true); // adding b to a.blockedBy closes a<->b
  });

  it('detects an indirect cycle', () => {
    const a = task('a');
    const b = task('b', { blockedBy: ['c'] });
    const c = task('c', { blockedBy: ['a'] }); // c -> a already exists
    expect(wouldCreateCycle('a', 'b', byId([a, b, c]))).toBe(true); // a -> b -> c -> a
  });

  it('allows a non-cyclic link', () => {
    const a = task('a');
    const b = task('b', { blockedBy: ['c'] });
    const c = task('c');
    expect(wouldCreateCycle('a', 'b', byId([a, b, c]))).toBe(false);
  });
});
