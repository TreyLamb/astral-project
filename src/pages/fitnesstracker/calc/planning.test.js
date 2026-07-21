import { describe, it, expect } from 'vitest';
import { addDaysISO, shiftPlanFrom, shiftGroup, detectConflicts, upcomingPlanned } from './planning';

const planned = (id, date, groupId = null) => ({ id, date, status: 'planned', activityType: 'run', groupId });

describe('date math', () => {
  it('adds days across a month boundary', () => {
    expect(addDaysISO('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDaysISO('2026-08-01', -1)).toBe('2026-07-31');
  });
});

describe('cascade', () => {
  it('shifts this + all later planned sessions, not earlier ones', () => {
    const ws = [planned('a', '2026-07-10'), planned('b', '2026-07-12'), planned('c', '2026-07-15')];
    const updates = shiftPlanFrom(ws, '2026-07-12', 1);
    expect(updates.map((u) => u.id)).toEqual(['b', 'c']); // 'a' is earlier, untouched
    expect(updates[0].date).toBe('2026-07-13');
    expect(updates[1].date).toBe('2026-07-16');
  });
  it('ignores completed workouts', () => {
    const ws = [{ id: 'done', date: '2026-07-12', status: 'completed', activityType: 'run' }, planned('b', '2026-07-13')];
    expect(shiftPlanFrom(ws, '2026-07-10', 1).map((u) => u.id)).toEqual(['b']);
  });
});

describe('shiftGroup', () => {
  it('moves only workouts sharing the group id, ignoring what falls between them', () => {
    const ws = [
      planned('a', '2026-07-10', 'g1'),
      planned('unrelated', '2026-07-11'), // sits between a and c but not in the group
      planned('c', '2026-07-14', 'g1'),
      planned('other-group', '2026-07-12', 'g2'),
    ];
    const updates = shiftGroup(ws, 'g1', 2);
    expect(updates.map((u) => u.id)).toEqual(['a', 'c']);
    expect(updates[0].date).toBe('2026-07-12');
    expect(updates[1].date).toBe('2026-07-16');
  });
  it('returns nothing for a null groupId', () => {
    expect(shiftGroup([planned('a', '2026-07-10', 'g1')], null, 1)).toEqual([]);
  });
});

describe('conflicts', () => {
  it('flags days with more than one planned session', () => {
    const ws = [planned('a', '2026-07-12'), planned('b', '2026-07-12'), planned('c', '2026-07-13')];
    const c = detectConflicts(ws);
    expect(c).toHaveLength(1);
    expect(c[0].date).toBe('2026-07-12');
    expect(c[0].items).toHaveLength(2);
  });
  it('upcomingPlanned respects the window', () => {
    const ws = [planned('a', '2026-07-12'), planned('b', '2026-07-20')];
    expect(upcomingPlanned(ws, '2026-07-12', 7).map((w) => w.id)).toEqual(['a']);
  });
});
