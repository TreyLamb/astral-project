import { describe, it, expect } from 'vitest';
import { dailyTotals, macroPercents, averageDaily } from './nutrition';

const meals = [
  { date: '2026-07-20', calories: 500, proteinG: 40, carbsG: 30, fatG: 20 },
  { date: '2026-07-20', calories: 300, proteinG: 20, carbsG: 40, fatG: 5 },
  { date: '2026-07-21', calories: 600, proteinG: 50, carbsG: 60, fatG: 10 },
];

describe('dailyTotals', () => {
  it('sums calories and macros for one date', () => {
    const t = dailyTotals(meals, '2026-07-20');
    expect(t.count).toBe(2);
    expect(t.calories).toBe(800);
    expect(t.proteinG).toBe(60);
    expect(t.carbsG).toBe(70);
    expect(t.fatG).toBe(25);
  });
  it('returns nulls (not zero) for a day with no meals', () => {
    const t = dailyTotals(meals, '2026-07-22');
    expect(t.count).toBe(0);
    expect(t.calories).toBeNull();
  });
});

describe('macroPercents', () => {
  it('splits by Atwater kcal contribution, not gram share', () => {
    // 60g protein (240kcal) + 70g carb (280kcal) + 25g fat (225kcal) = 745kcal
    const pct = macroPercents({ proteinG: 60, carbsG: 70, fatG: 25 });
    expect(pct.proteinPct + pct.carbsPct + pct.fatPct).toBe(100);
    expect(pct.proteinPct).toBe(32); // 240/745
    expect(pct.carbsPct).toBe(38);   // 280/745
    expect(pct.fatPct).toBe(30);     // 225/745
  });
  it('returns null with no macro data', () => {
    expect(macroPercents({ proteinG: null, carbsG: null, fatG: null })).toBeNull();
  });
});

describe('averageDaily', () => {
  it('averages only days that actually have logged meals', () => {
    // 3-day window starting 7/20: two days have meals (800, 600), one (7/22) has none
    const avg = averageDaily(meals, '2026-07-20', 3);
    expect(avg.days).toBe(2);
    expect(avg.calories).toBe(700); // (800+600)/2
  });
  it('handles an empty range', () => {
    const avg = averageDaily([], '2026-01-01', 7);
    expect(avg.days).toBe(0);
    expect(avg.calories).toBeNull();
  });
});
