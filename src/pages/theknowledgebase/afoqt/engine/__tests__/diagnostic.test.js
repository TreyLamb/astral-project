import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTIC_QUESTIONS_PER_SUBTEST, DIAGNOSTIC_SUBTESTS, weakestSubtests,
  diagnosticSubtestAccuracy, diagnosticCompositeAccuracy,
  subtestTier, tierRank, STRONG_ACCURACY, WEAK_ACCURACY,
  EXPEDITED_TEST_OUT_COUNT, EXPEDITED_MASTERY_COUNT,
} from '../diagnostic.js';
import { DRILLABLE, SUBTESTS } from '../afoqtSpec.js';
import { MASTERY_THRESHOLD } from '../../afoqtStorage.js';

describe('DIAGNOSTIC_SUBTESTS', () => {
  it('is exactly DRILLABLE - every studyable subtest, SD excluded', () => {
    expect(DIAGNOSTIC_SUBTESTS).toBe(DRILLABLE);
    expect(DIAGNOSTIC_SUBTESTS.some((s) => s.code === 'SD')).toBe(false);
    expect(DIAGNOSTIC_SUBTESTS.length).toBe(SUBTESTS.length - 1);
  });
});

describe('DIAGNOSTIC_QUESTIONS_PER_SUBTEST', () => {
  it('clears the 5-question floor this project treats as a meaningful sample', () => {
    expect(DIAGNOSTIC_QUESTIONS_PER_SUBTEST).toBeGreaterThanOrEqual(5);
  });

  it('keeps the whole diagnostic well under an hour at real pace', () => {
    const totalSec = DIAGNOSTIC_SUBTESTS.reduce(
      (n, s) => n + (s.minutes * 60 / s.questions) * DIAGNOSTIC_QUESTIONS_PER_SUBTEST,
      0,
    );
    expect(totalSec).toBeLessThan(60 * 60);
  });
});

describe('weakestSubtests', () => {
  it('returns an empty list when nothing was reached', () => {
    expect(weakestSubtests({})).toEqual([]);
  });

  it('ranks ascending by accuracy, weakest first', () => {
    const results = {
      MK: { correct: 5, answered: 6 },   // 0.833
      TR: { correct: 1, answered: 6 },   // 0.167
      WK: { correct: 3, answered: 6 },   // 0.5
    };
    const ranked = weakestSubtests(results, 3);
    expect(ranked.map((r) => r.code)).toEqual(['TR', 'WK', 'MK']);
  });

  it('excludes a never-reached subtest rather than treating it as a 0', () => {
    const results = { MK: { correct: 0, answered: 0 }, TR: { correct: 3, answered: 6 } };
    const ranked = weakestSubtests(results, 5);
    expect(ranked.map((r) => r.code)).toEqual(['TR']);
  });

  it('respects the requested count', () => {
    const results = {
      MK: { correct: 5, answered: 6 }, TR: { correct: 1, answered: 6 },
      WK: { correct: 3, answered: 6 }, AR: { correct: 2, answered: 6 },
    };
    expect(weakestSubtests(results, 2)).toHaveLength(2);
  });
});

describe('subtestTier', () => {
  it('is null for a subtest the diagnostic never reached', () => {
    expect(subtestTier({}, 'MK')).toBeNull();
  });

  it('is strong at 5/6 and 6/6, matching STRONG_ACCURACY', () => {
    expect(subtestTier({ MK: { correct: 5, answered: 6 } }, 'MK')).toBe('strong');
    expect(subtestTier({ MK: { correct: 6, answered: 6 } }, 'MK')).toBe('strong');
    expect(5 / 6).toBeGreaterThanOrEqual(STRONG_ACCURACY);
  });

  it('is weak at 3/6 or worse, matching WEAK_ACCURACY', () => {
    expect(subtestTier({ MK: { correct: 3, answered: 6 } }, 'MK')).toBe('weak');
    expect(subtestTier({ MK: { correct: 0, answered: 6 } }, 'MK')).toBe('weak');
    expect(3 / 6).toBeLessThanOrEqual(WEAK_ACCURACY);
  });

  it('is moderate at 4/6 - one miss should not read as mastery either way', () => {
    expect(subtestTier({ MK: { correct: 4, answered: 6 } }, 'MK')).toBe('moderate');
  });
});

describe('tierRank', () => {
  it('orders weak before moderate/missing before strong', () => {
    expect(tierRank('weak')).toBeLessThan(tierRank('moderate'));
    expect(tierRank('moderate')).toBeLessThan(tierRank('strong'));
    expect(tierRank(null)).toBe(tierRank('moderate'));
  });
});

describe('expedited gate sizing', () => {
  it('EXPEDITED_TEST_OUT_COUNT still requires a full sweep (no lowered bar, just a shorter one)', () => {
    expect(EXPEDITED_TEST_OUT_COUNT).toBeGreaterThanOrEqual(3);
    expect(EXPEDITED_TEST_OUT_COUNT).toBeLessThan(5);
  });

  it('EXPEDITED_MASTERY_COUNT still allows exactly one miss under MASTERY_THRESHOLD', () => {
    const oneMiss = (EXPEDITED_MASTERY_COUNT - 1) / EXPEDITED_MASTERY_COUNT;
    const twoMisses = (EXPEDITED_MASTERY_COUNT - 2) / EXPEDITED_MASTERY_COUNT;
    expect(oneMiss).toBeGreaterThanOrEqual(MASTERY_THRESHOLD);
    expect(twoMisses).toBeLessThan(MASTERY_THRESHOLD);
  });
});

describe('re-exported accuracy math matches engine/exam.js exactly', () => {
  it('diagnosticSubtestAccuracy is the same function as examSubtestAccuracy', () => {
    const results = { MK: { correct: 4, answered: 6 } };
    expect(diagnosticSubtestAccuracy(results, 'MK')).toBeCloseTo(4 / 6, 5);
  });

  it('diagnosticCompositeAccuracy weights by real question count, same as the exam version', () => {
    const results = { AR: { correct: 6, answered: 6 }, MK: { correct: 0, answered: 6 } };
    const r = diagnosticCompositeAccuracy(results, 'QUANT');
    // AR and MK are both weighted by their real 25-question count, so an even split -> 0.5.
    expect(r.accuracy).toBeCloseTo(0.5, 5);
  });
});
