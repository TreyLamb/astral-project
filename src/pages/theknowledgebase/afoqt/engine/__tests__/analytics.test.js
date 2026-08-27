import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  dailyAccuracy, practiceDays, currentStreakDays, overallAccuracy, examSittingSummaries,
  diagnosticVsNow,
} from '../analytics.js';
import { _resetRegistry } from '../generator.js';

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const dayKeyDaysAgo = (n) => isoDaysAgo(n).slice(0, 10);

describe('dailyAccuracy', () => {
  it('returns `days` buckets, oldest first, ending today', () => {
    const out = dailyAccuracy([], 5);
    expect(out).toHaveLength(5);
    expect(out[4].date).toBe(dayKeyDaysAgo(0));
    expect(out[0].date).toBe(dayKeyDaysAgo(4));
  });

  it('a day with no runs is null, never 0 - "no practice" and "practiced badly" differ', () => {
    const out = dailyAccuracy([], 3);
    expect(out.every((b) => b.accuracy === null)).toBe(true);
  });

  it('sums multiple runs on the same day into one bucket', () => {
    const runs = [
      { startedAt: isoDaysAgo(0), correct: 3, answered: 5 },
      { startedAt: isoDaysAgo(0), correct: 2, answered: 5 },
    ];
    const out = dailyAccuracy(runs, 1);
    expect(out[0].correct).toBe(5);
    expect(out[0].answered).toBe(10);
    expect(out[0].accuracy).toBeCloseTo(0.5, 5);
  });

  it('ignores a run outside the requested window', () => {
    const runs = [{ startedAt: isoDaysAgo(30), correct: 5, answered: 5 }];
    const out = dailyAccuracy(runs, 7);
    expect(out.every((b) => b.accuracy === null)).toBe(true);
  });
});

describe('practiceDays / currentStreakDays', () => {
  it('practiceDays unions runs, examRuns and diagnosticRuns dates', () => {
    const progress = {
      runs: [{ startedAt: isoDaysAgo(2) }],
      examRuns: [{ startedAt: isoDaysAgo(1) }],
      diagnosticRuns: [{ takenAt: isoDaysAgo(0) }],
    };
    expect(practiceDays(progress).size).toBe(3);
  });

  it('streak is 0 with no practice history at all', () => {
    expect(currentStreakDays({ runs: [], examRuns: [], diagnosticRuns: [] })).toBe(0);
  });

  it('counts a consecutive run ending today', () => {
    const progress = {
      runs: [{ startedAt: isoDaysAgo(0) }, { startedAt: isoDaysAgo(1) }, { startedAt: isoDaysAgo(2) }],
      examRuns: [], diagnosticRuns: [],
    };
    expect(currentStreakDays(progress)).toBe(3);
  });

  it('still counts a streak that ended yesterday, not today, as live', () => {
    const progress = {
      runs: [{ startedAt: isoDaysAgo(1) }, { startedAt: isoDaysAgo(2) }],
      examRuns: [], diagnosticRuns: [],
    };
    expect(currentStreakDays(progress)).toBe(2);
  });

  it('a streak broken more than a day ago is 0, not a stale count', () => {
    const progress = {
      runs: [{ startedAt: isoDaysAgo(5) }, { startedAt: isoDaysAgo(6) }],
      examRuns: [], diagnosticRuns: [],
    };
    expect(currentStreakDays(progress)).toBe(0);
  });
});

describe('overallAccuracy', () => {
  it('returns null when nothing was reached', () => {
    expect(overallAccuracy({})).toBeNull();
  });

  it('weights by real question count, not an unweighted subtest average', () => {
    // TR has 40 real questions, IC has 25 - TR should pull the average toward its own accuracy.
    const results = { TR: { correct: 40, answered: 40 }, IC: { correct: 0, answered: 25 } };
    const acc = overallAccuracy(results);
    // weighted: (1*40 + 0*25) / 65 = 0.615..., clearly above the unweighted 0.5 midpoint.
    expect(acc).toBeGreaterThan(0.5);
    expect(acc).toBeCloseTo(40 / 65, 5);
  });

  it('ignores a subtest with 0 answered rather than treating it as a 0', () => {
    const results = { MK: { correct: 5, answered: 5 }, TR: { correct: 0, answered: 0 } };
    expect(overallAccuracy(results)).toBe(1);
  });
});

describe('examSittingSummaries', () => {
  it('reverses stored (most-recent-first) order to chronological (oldest-first)', () => {
    const examRuns = [
      { examId: 'b', startedAt: isoDaysAgo(0), results: {} },
      { examId: 'a', startedAt: isoDaysAgo(5), results: {} },
    ];
    const out = examSittingSummaries(examRuns);
    expect(out.map((s) => s.examId)).toEqual(['a', 'b']);
  });

  it('reports how many subtests were reached and each sitting\'s own overall accuracy', () => {
    const examRuns = [{
      examId: 'x', startedAt: isoDaysAgo(0), aborted: true,
      results: { VA: { correct: 20, answered: 25 }, MK: { correct: 25, answered: 25 } },
    }];
    const out = examSittingSummaries(examRuns);
    expect(out[0].reached).toBe(2);
    expect(out[0].aborted).toBe(true);
    expect(out[0].accuracy).toBeGreaterThan(0);
  });
});

describe('diagnosticVsNow', () => {
  beforeEach(() => _resetRegistry());
  afterEach(() => _resetRegistry());

  it('returns an empty list with no diagnostic', () => {
    expect(diagnosticVsNow(null, {})).toEqual([]);
  });

  it('reports `now: null` when nothing has been practiced since the diagnostic, never a 0', () => {
    const diagnostic = { results: { MK: { correct: 2, answered: 6 } } };
    const progress = { templateStats: {} };
    const out = diagnosticVsNow(diagnostic, progress);
    expect(out).toHaveLength(1);
    expect(out[0].then).toBeCloseTo(2 / 6, 5);
    expect(out[0].now).toBeNull();
    expect(out[0].delta).toBeNull();
  });

  it('computes a positive delta when lifetime accuracy has since improved', async () => {
    const { registerTemplate } = await import('../generator.js');
    registerTemplate({ id: 'mk-fake-1', subtest: 'MK', band: 2, concepts: [], generate: () => null });
    const diagnostic = { results: { MK: { correct: 1, answered: 6 } } }; // 17%
    const progress = { templateStats: { 'mk-fake-1': { seen: 10, correct: 8, totalMs: 0, lastSeen: null, correctDays: [] } } }; // 80%
    const out = diagnosticVsNow(diagnostic, progress);
    expect(out[0].now).toBeCloseTo(0.8, 5);
    expect(out[0].delta).toBeGreaterThan(0);
  });
});
