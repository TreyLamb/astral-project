import { describe, it, expect } from 'vitest';
import { planTasksAcrossDays } from './planner';

const task = (id, over = {}) => ({ id, title: id, timeMin: 30, energy: 1, ...over });

describe('planTasksAcrossDays', () => {
  it('fills a day to capacity then overflows the next task to the following day', () => {
    const tasks = [task('a'), task('b'), task('c')]; // each 30min, cap 60min/day
    const capacityFor = () => ({ timeMin: 60, energy: 100 });
    const out = planTasksAcrossDays(tasks, '2026-07-20', 5, capacityFor);
    expect(out.placements).toEqual([
      { taskId: 'a', date: '2026-07-20' },
      { taskId: 'b', date: '2026-07-20' },
      { taskId: 'c', date: '2026-07-21' },
    ]);
    expect(out.unplaced).toEqual([]);
  });

  it('gives an oversized task its own day rather than splitting or dropping it', () => {
    const tasks = [task('big', { timeMin: 200 }), task('small', { timeMin: 30 })];
    const capacityFor = () => ({ timeMin: 60, energy: 100 });
    const out = planTasksAcrossDays(tasks, '2026-07-20', 5, capacityFor);
    expect(out.placements).toEqual([
      { taskId: 'big', date: '2026-07-20' },
      { taskId: 'small', date: '2026-07-21' },
    ]);
  });

  it('respects an energy-only cap the same way as a time cap', () => {
    const tasks = [task('a', { timeMin: 10, energy: 3 }), task('b', { timeMin: 10, energy: 3 })];
    const capacityFor = () => ({ timeMin: 1000, energy: 4 }); // time is never the limiter
    const out = planTasksAcrossDays(tasks, '2026-07-20', 5, capacityFor);
    expect(out.placements).toEqual([
      { taskId: 'a', date: '2026-07-20' },
      { taskId: 'b', date: '2026-07-21' },
    ]);
  });

  it('leaves leftover tasks unplaced once the horizon is exhausted', () => {
    const tasks = [task('a'), task('b'), task('c')];
    const capacityFor = () => ({ timeMin: 40, energy: 100 }); // only one 30min task fits per day
    const out = planTasksAcrossDays(tasks, '2026-07-20', 1, capacityFor);
    expect(out.placements).toEqual([{ taskId: 'a', date: '2026-07-20' }]);
    expect(out.unplaced).toEqual(['b', 'c']);
  });

  it('treats a null timeMin as a small default cost rather than free', () => {
    const tasks = [task('a', { timeMin: null }), task('b', { timeMin: null }), task('c', { timeMin: null })];
    const capacityFor = () => ({ timeMin: 50, energy: 100 }); // default cost (30) means only 1 fits/day
    const out = planTasksAcrossDays(tasks, '2026-07-20', 5, capacityFor);
    expect(out.placements.filter((p) => p.date === '2026-07-20')).toHaveLength(1);
  });
});
