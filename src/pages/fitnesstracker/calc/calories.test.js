import { describe, it, expect } from 'vitest';
import { estimateWorkoutCalories, latestBodyWeightKg, netCaloriesForDay, metForActivityType } from './calories';

describe('estimateWorkoutCalories', () => {
  it('a 30-min run at 80kg matches the MET formula exactly (9.8 MET x 80kg x 0.5h)', () => {
    const w = { status: 'completed', activityType: 'run', durationSec: 1800 };
    expect(estimateWorkoutCalories(w, 80)).toBeCloseTo(9.8 * 80 * 0.5, 6);
  });

  it('returns null for a planned (not yet completed) workout', () => {
    const w = { status: 'planned', activityType: 'run', durationSec: 1800 };
    expect(estimateWorkoutCalories(w, 80)).toBeNull();
  });

  it('returns null when durationSec is missing', () => {
    const w = { status: 'completed', activityType: 'run', durationSec: null };
    expect(estimateWorkoutCalories(w, 80)).toBeNull();
  });

  it('returns null when no body weight is available', () => {
    const w = { status: 'completed', activityType: 'run', durationSec: 1800 };
    expect(estimateWorkoutCalories(w, null)).toBeNull();
  });

  it('falls back to the moderate default MET for an unrecognized activity type', () => {
    expect(metForActivityType('rowing')).toBe(4.0);
  });
});

describe('latestBodyWeightKg', () => {
  it('picks the most recent entry by date+time', () => {
    const logs = [
      { date: '2026-07-01', time: '08:00', weightKg: 82 },
      { date: '2026-07-15', time: '07:30', weightKg: 80 },
      { date: '2026-07-15', time: '19:00', weightKg: 80.5 },
    ];
    expect(latestBodyWeightKg(logs)).toBe(80.5);
  });

  it('returns null when there are no logs', () => {
    expect(latestBodyWeightKg([])).toBeNull();
  });
});

describe('netCaloriesForDay', () => {
  it('sums food minus BMR minus workout burn for the day, ignoring other dates', () => {
    const meals = [
      { date: '2026-07-15', calories: 2000 },
      { date: '2026-07-16', calories: 9999 },
    ];
    const workouts = [
      { date: '2026-07-15', status: 'completed', activityType: 'run', durationSec: 1800 }, // 9.8*80*0.5 = 392
      { date: '2026-07-16', status: 'completed', activityType: 'run', durationSec: 3600 },
    ];
    const net = netCaloriesForDay(meals, workouts, '2026-07-15', 1600, 80);
    expect(net).toBe(Math.round(2000 - 1600 - 9.8 * 80 * 0.5));
  });

  it('treats missing bmr/bodyWeight as zero contribution instead of crashing', () => {
    const meals = [{ date: '2026-07-15', calories: 500 }];
    const workouts = [{ date: '2026-07-15', status: 'completed', activityType: 'run', durationSec: 1800 }];
    expect(netCaloriesForDay(meals, workouts, '2026-07-15', null, null)).toBe(500);
  });
});
