// Two gates per section, at two ceilings. The rules worth pinning are the ones that would fail
// silently: a pass line that drifts when the question count changes, a gate offered with too few
// templates to fill it, and the "passed course, not ACS" state reading as done.

import { describe, it, expect } from 'vitest';
import {
  GATE_TIERS, GATE_TIER_IDS, gateSpec, templateInTier,
  eligibleTemplates, gateAvailability, gradeGate, sectionReadiness,
} from '../engine/gates.js';
import {
  defaultChemProgress, emptyGateState, chemSectionState, chemGateState,
  recordChemGate, chemSectionSummary,
} from '../chemStorage.js';

const T = (id, section, band) => ({ id, section, band });

describe('gate tiers', () => {
  it('has exactly the two tiers, covering bands 1-5 with no overlap and no gap', () => {
    expect(GATE_TIER_IDS.sort()).toEqual(['acs', 'course']);
    const all = [...GATE_TIERS.course.bands, ...GATE_TIERS.acs.bands];
    expect(new Set(all).size).toBe(all.length);          // no band in both tiers
    expect(all.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('marks only the ACS tier as stretch', () => {
    expect(GATE_TIERS.course.stretch).toBe(false);
    expect(GATE_TIERS.acs.stretch).toBe(true);
  });

  it('gateSpec returns null for a bogus tier rather than throwing', () => {
    expect(gateSpec('nope')).toBeNull();
  });
});

describe('template eligibility', () => {
  const templates = [
    T('a', '4-3', 1), T('b', '4-3', 3), T('c', '4-3', 4), T('d', '4-3', 5),
    T('e', '4-4', 1), T('f', '4-4', 4),
  ];

  it('splits templates by band into the right tier', () => {
    expect(eligibleTemplates(templates, '4-3', 'course').map((t) => t.id)).toEqual(['a', 'b']);
    expect(eligibleTemplates(templates, '4-3', 'acs').map((t) => t.id)).toEqual(['c', 'd']);
  });

  it('never leaks another section into a gate', () => {
    for (const tier of GATE_TIER_IDS) {
      for (const t of eligibleTemplates(templates, '4-3', tier)) expect(t.section).toBe('4-3');
    }
  });

  it('templateInTier is false for junk input rather than throwing', () => {
    expect(templateInTier(null, 'course')).toBe(false);
    expect(templateInTier(T('x', '1-2', 1), 'nope')).toBe(false);
  });
});

describe('gateAvailability', () => {
  const five = [1, 2, 3, 1, 2].map((b, i) => T(`t${i}`, '1-2', b));

  it('is ready when there are enough distinct templates', () => {
    const a = gateAvailability(five, '1-2', 'course');
    expect(a.ready).toBe(true);
    expect(a.reason).toBeNull();
  });

  it('explains WHY a gate is missing instead of just refusing', () => {
    // A greyed-out button with no reason is the thing this is here to prevent.
    const none = gateAvailability(five, '1-2', 'acs');
    expect(none.ready).toBe(false);
    expect(none.have).toBe(0);
    expect(none.reason).toMatch(/no acs check questions written/i);

    const partial = gateAvailability(five.slice(0, 2), '1-2', 'course');
    expect(partial.ready).toBe(false);
    expect(partial.reason).toMatch(/only 2 of 5/i);
  });
});

describe('gradeGate', () => {
  it('uses the tier pass COUNT, not a shared ratio', () => {
    // course is 4/5 = 0.80, acs is 5/6 = 0.833. A single ratio threshold would let 4/6 (0.667)
    // and 5/6 diverge from intent the moment a count changes.
    expect(gradeGate('course', 4, 5).passed).toBe(true);
    expect(gradeGate('course', 3, 5).passed).toBe(false);
    expect(gradeGate('acs', 5, 6).passed).toBe(true);
    expect(gradeGate('acs', 4, 6).passed).toBe(false);
  });

  it('reports the pass line so the UI can show "4 of 5 needed"', () => {
    expect(gradeGate('course', 0, 5).pass).toBe(5 - 1);
    expect(gradeGate('acs', 0, 6).pass).toBe(5);
  });

  it('does not divide by zero on an empty attempt', () => {
    expect(gradeGate('course', 0, 0).score).toBe(0);
  });
});

describe('sectionReadiness', () => {
  const on = { passed: true };
  const off = { passed: false };

  it('course-passed but ACS-failed does NOT read as done', () => {
    // The normal state for most of the term. It must be visibly distinct from exam-ready.
    const r = sectionReadiness(on, off);
    expect(r.level).toBe('quiz-ready');
    expect(r.level).not.toBe('exam-ready');
  });

  it('both passed is exam ready', () => {
    expect(sectionReadiness(on, on).level).toBe('exam-ready');
  });

  it('neither passed is not-started', () => {
    expect(sectionReadiness(off, off).level).toBe('not-started');
    expect(sectionReadiness(undefined, undefined).level).toBe('not-started');
  });

  it('flags the odd ACS-without-course case rather than calling it ready', () => {
    expect(sectionReadiness(off, on).level).toBe('odd');
  });
});

describe('per-section gate storage', () => {
  it('starts empty with both tiers present', () => {
    const s = chemSectionState(defaultChemProgress(), '4-3');
    expect(s.course).toEqual(emptyGateState());
    expect(s.acs).toEqual(emptyGateState());
  });

  it('records a pass on one tier without touching the other', () => {
    const p = recordChemGate(defaultChemProgress(), '4-3', 'course', { correct: 4, total: 5, passed: true });
    expect(chemGateState(p, '4-3', 'course').passed).toBe(true);
    expect(chemGateState(p, '4-3', 'acs').passed).toBe(false);
    expect(chemGateState(p, '4-3', 'acs').attempts).toBe(0);
  });

  it('keeps a pass after a later worse attempt', () => {
    // Re-drilling a passed section is practice, not a regression.
    let p = recordChemGate(defaultChemProgress(), '4-3', 'course', { correct: 5, total: 5, passed: true });
    p = recordChemGate(p, '4-3', 'course', { correct: 1, total: 5, passed: false });
    const st = chemGateState(p, '4-3', 'course');
    expect(st.passed).toBe(true);
    expect(st.attempts).toBe(2);
    expect(st.bestCorrect).toBe(5);
  });

  it('keeps the FIRST passedAt, not the latest', () => {
    let p = recordChemGate(defaultChemProgress(), '4-3', 'acs', { correct: 5, total: 6, passed: true });
    const first = chemGateState(p, '4-3', 'acs').passedAt;
    p = recordChemGate(p, '4-3', 'acs', { correct: 6, total: 6, passed: true });
    expect(chemGateState(p, '4-3', 'acs').passedAt).toBe(first);
  });

  it('tracks sections independently', () => {
    let p = recordChemGate(defaultChemProgress(), '4-3', 'course', { correct: 4, total: 5, passed: true });
    p = recordChemGate(p, '4-4', 'course', { correct: 2, total: 5, passed: false });
    expect(chemGateState(p, '4-3', 'course').passed).toBe(true);
    expect(chemGateState(p, '4-4', 'course').passed).toBe(false);
  });

  it('does not mutate the progress passed in', () => {
    const before = defaultChemProgress();
    recordChemGate(before, '4-3', 'course', { correct: 5, total: 5, passed: true });
    expect(before.sections).toEqual({});
  });

  it('summarises a chapter across both tiers', () => {
    let p = defaultChemProgress();
    p = recordChemGate(p, '4-2', 'course', { correct: 4, total: 5, passed: true });
    p = recordChemGate(p, '4-3', 'course', { correct: 4, total: 5, passed: true });
    p = recordChemGate(p, '4-3', 'acs', { correct: 5, total: 6, passed: true });
    const s = chemSectionSummary(p, ['4-2', '4-3', '4-4']);
    expect(s).toMatchObject({ total: 3, coursePassed: 2, acsPassed: 1, bothPassed: 1, untouched: 1 });
  });
});
