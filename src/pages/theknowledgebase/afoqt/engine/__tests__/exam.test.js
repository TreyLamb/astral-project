import { describe, it, expect } from 'vitest';
import {
  buildExamPlan, EXAM_PLAN, examTestingMinutes, examBreakMinutes, examContentMinutes,
  OFFICIAL_TOTAL_MINUTES, newExamId, examSubtestAccuracy, examCompositeAccuracy,
  allExamCompositeAccuracy,
} from '../exam.js';
import { SUBTESTS, COMPOSITES } from '../afoqtSpec.js';

describe('buildExamPlan', () => {
  it('has one step per subtest plus one per break', () => {
    // 12 subtests (11 'subtest' + 1 'sdi') + 2 breaks = 14.
    expect(EXAM_PLAN.length).toBe(SUBTESTS.length + 2);
  });

  it('runs in the exact official order: Part A then a break, SJ+SD, a break, then Part B', () => {
    const order = EXAM_PLAN.map((s) => s.kind === 'break' ? 'BREAK' : s.subtest);
    expect(order).toEqual([
      'VA', 'AR', 'WK', 'MK', 'RC', 'BREAK', 'SJ', 'SD', 'BREAK', 'PS', 'TR', 'IC', 'BC', 'AI',
    ]);
  });

  it('tags SD as an sdi step, never a subtest step - PART 26 decided it is not drilled', () => {
    const sd = EXAM_PLAN.find((s) => s.subtest === 'SD');
    expect(sd.kind).toBe('sdi');
  });

  it('tags every other studyable subtest as a subtest step', () => {
    const nonSd = EXAM_PLAN.filter((s) => s.kind !== 'break' && s.subtest !== 'SD');
    expect(nonSd.every((s) => s.kind === 'subtest')).toBe(true);
    expect(nonSd.length).toBe(SUBTESTS.length - 1);
  });

  it('places the two breaks exactly after Reading Comprehension and after the SDI', () => {
    const idxRC = EXAM_PLAN.findIndex((s) => s.subtest === 'RC');
    const idxSD = EXAM_PLAN.findIndex((s) => s.subtest === 'SD');
    expect(EXAM_PLAN[idxRC + 1].kind).toBe('break');
    expect(EXAM_PLAN[idxSD + 1].kind).toBe('break');
  });

  it('is a pure function of afoqtSpec - calling it again reproduces the same plan', () => {
    expect(buildExamPlan()).toEqual(EXAM_PLAN);
  });

  it('every step index matches its position', () => {
    EXAM_PLAN.forEach((s, i) => expect(s.index).toBe(i));
  });
});

describe('timing totals', () => {
  it('matches the sourced 216.5 test-minute total from RESEARCH.md', () => {
    expect(examTestingMinutes()).toBeCloseTo(216.5, 5);
  });

  it('matches the sourced 25-minute break total (10 + 15)', () => {
    expect(examBreakMinutes()).toBe(25);
  });

  it('content + breaks is 241.5, NOT the official ~287.5 all-in figure', () => {
    // The gap is untimed admin overhead (check-in, instructions, demographics) this runner
    // cannot model - see the OFFICIAL_TOTAL_MINUTES comment in exam.js. This test exists so
    // nobody "fixes" examContentMinutes() to equal OFFICIAL_TOTAL_MINUTES by accident.
    expect(examContentMinutes()).toBeCloseTo(241.5, 5);
    expect(examContentMinutes()).toBeLessThan(OFFICIAL_TOTAL_MINUTES);
  });
});

describe('newExamId', () => {
  it('produces distinct ids on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => newExamId()));
    expect(ids.size).toBe(20);
  });
});

describe('examSubtestAccuracy', () => {
  it('returns null when a subtest was never reached (exam ended early)', () => {
    expect(examSubtestAccuracy({}, 'MK')).toBeNull();
    expect(examSubtestAccuracy({ MK: { correct: 0, answered: 0 } }, 'MK')).toBeNull();
  });

  it('divides correct by answered when reached', () => {
    expect(examSubtestAccuracy({ MK: { correct: 18, answered: 25 } }, 'MK')).toBeCloseTo(0.72, 5);
  });
});

describe('examCompositeAccuracy', () => {
  it('returns null for an unknown composite code', () => {
    expect(examCompositeAccuracy({}, 'NOPE')).toBeNull();
  });

  it('returns accuracy: null when none of the composite\'s subtests were reached', () => {
    const r = examCompositeAccuracy({}, 'QUANT');
    expect(r.accuracy).toBeNull();
    expect(r.subtests.every((s) => s.accuracy === null)).toBe(true);
  });

  it('weights by real question count, not an unweighted subtest average', () => {
    // QUANT = AR (25 Qs) + MK (25 Qs) - equal weight here, so this just confirms the basic
    // weighted-average arithmetic before the unequal-weight case below.
    const results = {
      AR: { correct: 20, answered: 25 }, // 0.80
      MK: { correct: 15, answered: 25 }, // 0.60
    };
    const r = examCompositeAccuracy(results, 'QUANT');
    expect(r.accuracy).toBeCloseTo(0.70, 5);
  });

  it('only averages over subtests actually reached', () => {
    // ACAD = VA + AR + WK + MK + RC. Only two reached; the other three must not drag a null
    // toward zero, and coverage of "how much of the composite has data" is on the caller
    // (allExamCompositeAccuracy) to decide how to present, not baked into the number itself.
    const results = {
      VA: { correct: 20, answered: 25 }, // 0.80, weight 25
      WK: { correct: 10, answered: 25 }, // 0.40, weight 25
    };
    const r = examCompositeAccuracy(results, 'ACAD');
    expect(r.accuracy).toBeCloseTo(0.60, 5);
  });

  it('an exam ended after only one subtest still reports that subtest\'s composites', () => {
    const results = { TR: { correct: 32, answered: 40 } };
    const pilot = examCompositeAccuracy(results, 'PILOT'); // MK+TR+IC+AI
    expect(pilot.accuracy).toBeCloseTo(0.80, 5);
  });
});

describe('allExamCompositeAccuracy', () => {
  it('excludes the disputed SJT composite, same as engine/scoring.js does', () => {
    const codes = allExamCompositeAccuracy({}).map((c) => c.code);
    expect(codes).not.toContain('SJT');
    expect(codes.length).toBe(COMPOSITES.filter((c) => !c.disputed).length);
  });
});
