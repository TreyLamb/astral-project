import { describe, it, expect } from 'vitest';
import { epley1RM, brzycki1RM, oneRepMax, setVolume, exercisesVolume, bestOneRepMax } from './lift';

describe('estimated 1RM', () => {
  it('Epley: 100kg x 10 = 133.3', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 2);
  });
  it('Brzycki: 100kg x 10 = 133.3', () => {
    expect(brzycki1RM(100, 10)).toBeCloseTo(133.33, 2);
  });
  it('reps=1 returns the weight', () => {
    expect(epley1RM(140, 1)).toBe(140);
    expect(brzycki1RM(140, 1)).toBe(140);
  });
  it('mean of both estimates', () => {
    expect(oneRepMax(100, 5).avg).toBeCloseTo((epley1RM(100, 5) + brzycki1RM(100, 5)) / 2, 6);
  });
});

describe('volume', () => {
  it('sums reps x weight across sets', () => {
    expect(setVolume([{ reps: 5, weightKg: 100 }, { reps: 5, weightKg: 100 }])).toBe(1000);
  });
  it('sums across exercises and finds the best 1RM', () => {
    const ex = [
      { name: 'Squat', sets: [{ reps: 5, weightKg: 140 }] },
      { name: 'Bench', sets: [{ reps: 8, weightKg: 80 }] },
    ];
    expect(exercisesVolume(ex)).toBe(5 * 140 + 8 * 80);
    expect(bestOneRepMax(ex).exercise).toBe('Squat');
  });
});
