import { describe, it, expect } from 'vitest';
import { shouldUnpin, isPurgeableDiscard, runHousekeepingPlan } from './housekeeping';

const task = (id, over = {}) => ({ id, title: id, pinnedToday: false, pinnedOn: null, ...over });
const inboxItem = (id, over = {}) => ({ id, rawText: id, outcome: null, discardedAt: null, ...over });

describe('shouldUnpin', () => {
  it('is false when not pinned today', () => {
    expect(shouldUnpin(task('a'), '2026-07-23')).toBe(false);
  });

  it('is false when pinned on today itself', () => {
    const t = task('a', { pinnedToday: true, pinnedOn: '2026-07-23' });
    expect(shouldUnpin(t, '2026-07-23')).toBe(false);
  });

  it('is true when pinned on a prior day', () => {
    const t = task('a', { pinnedToday: true, pinnedOn: '2026-07-22' });
    expect(shouldUnpin(t, '2026-07-23')).toBe(true);
  });

  it('is true when pinnedToday is set but pinnedOn is null (stale/legacy row)', () => {
    const t = task('a', { pinnedToday: true, pinnedOn: null });
    expect(shouldUnpin(t, '2026-07-23')).toBe(true);
  });
});

describe('isPurgeableDiscard', () => {
  const retentionDays = 30;
  const now = new Date('2026-07-23T00:00:00Z').getTime();

  it('is false for a non-discarded item', () => {
    const i = inboxItem('a', { outcome: 'task', discardedAt: now - 40 * 24 * 60 * 60 * 1000 });
    expect(isPurgeableDiscard(i, now, retentionDays)).toBe(false);
  });

  it('is false for a discarded item with no discardedAt timestamp', () => {
    const i = inboxItem('a', { outcome: 'discarded', discardedAt: null });
    expect(isPurgeableDiscard(i, now, retentionDays)).toBe(false);
  });

  it('is false for a recently discarded item within the retention window', () => {
    const i = inboxItem('a', { outcome: 'discarded', discardedAt: now - 5 * 24 * 60 * 60 * 1000 });
    expect(isPurgeableDiscard(i, now, retentionDays)).toBe(false);
  });

  it('is true for a discarded item older than the retention window', () => {
    const i = inboxItem('a', { outcome: 'discarded', discardedAt: now - 40 * 24 * 60 * 60 * 1000 });
    expect(isPurgeableDiscard(i, now, retentionDays)).toBe(true);
  });

  it('is false exactly at the retention boundary', () => {
    const i = inboxItem('a', { outcome: 'discarded', discardedAt: now - retentionDays * 24 * 60 * 60 * 1000 });
    expect(isPurgeableDiscard(i, now, retentionDays)).toBe(false);
  });
});

describe('runHousekeepingPlan', () => {
  const today = '2026-07-23';
  const now = new Date('2026-07-23T00:00:00Z').getTime();
  const settings = { discardRetentionDays: 30 };

  it('collects unpin ids and purge ids together', () => {
    const tasks = [
      task('t1', { pinnedToday: true, pinnedOn: '2026-07-22' }), // unpin
      task('t2', { pinnedToday: true, pinnedOn: today }), // stays pinned
      task('t3'), // never pinned
    ];
    const inbox = [
      inboxItem('i1', { outcome: 'discarded', discardedAt: now - 40 * 24 * 60 * 60 * 1000 }), // purge
      inboxItem('i2', { outcome: 'discarded', discardedAt: now - 5 * 24 * 60 * 60 * 1000 }), // too recent
      inboxItem('i3', { outcome: 'task' }), // not discarded
    ];
    const plan = runHousekeepingPlan(tasks, inbox, today, now, settings);
    expect(plan.unpinIds).toEqual(['t1']);
    expect(plan.purgeInboxIds).toEqual(['i1']);
  });

  it('returns empty lists when nothing qualifies', () => {
    const tasks = [task('t1'), task('t2', { pinnedToday: true, pinnedOn: today })];
    const inbox = [inboxItem('i1', { outcome: 'task' })];
    const plan = runHousekeepingPlan(tasks, inbox, today, now, settings);
    expect(plan).toEqual({ unpinIds: [], purgeInboxIds: [] });
  });
});
