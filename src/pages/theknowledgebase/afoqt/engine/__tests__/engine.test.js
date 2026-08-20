import { describe, it, expect, beforeEach } from 'vitest';
import { SUBTESTS, secPerQuestion, compositeReach, TOTAL_QUESTIONS, getSubtest } from '../afoqtSpec';
import { registerTemplate, generateInstance, buildDrill, _resetRegistry, seedFrom } from '../generator';
import { paceBudget, paceCheck, shouldNudgeAbandon, formatClock } from '../timing';
import { mulberry32 } from '../../../engine/rng';

describe('afoqtSpec', () => {
  it('matches the AFPC published totals', () => {
    expect(SUBTESTS).toHaveLength(12);
    expect(TOTAL_QUESTIONS).toBe(550);
  });

  it('keeps the four brutal subtests under 13 seconds per question', () => {
    const sec = Object.fromEntries(SUBTESTS.map((s) => [s.code, secPerQuestion(s)]));
    expect(sec.BC).toBeCloseTo(9.0, 1);
    expect(sec.TR).toBeCloseTo(10.5, 1);
    expect(sec.WK).toBeCloseTo(12.0, 1);
    expect(sec.IC).toBeCloseTo(12.0, 1);
  });

  it('puts Math Knowledge in five composites and Table Reading in all three rated ones', () => {
    expect(compositeReach('MK').sort()).toEqual(['ABM', 'ACAD', 'CSO', 'PILOT', 'QUANT']);
    expect(compositeReach('TR').sort()).toEqual(['ABM', 'CSO', 'PILOT']);
  });

  it('gives Instrument Comprehension four choices, everything else five', () => {
    expect(getSubtest('IC').choices).toBe(4);
    for (const s of SUBTESTS.filter((x) => x.code !== 'IC')) expect(s.choices).toBe(5);
  });
});

describe('generator', () => {
  beforeEach(() => {
    _resetRegistry();
    registerTemplate({
      id: 'test-add', subtest: 'MK', band: 1, name: 'one-digit addition', concepts: ['arith'],
      generate: (rng, h) => {
        const a = h.int(1, 9);
        const b = h.int(1, 9);
        // Distractors are error-modes: off-by-one, subtraction instead of addition, product.
        const { choices, correctIndex } = h.choices(a + b, [a + b + 1, Math.abs(a - b), a * b]);
        return { stem: a + ' + ' + b + ' = ?', choices, correctIndex };
      },
    });
  });

  it('is deterministic - same templateId and seed regenerate an identical question', () => {
    const a = generateInstance('test-add', 12345);
    const b = generateInstance('test-add', 12345);
    expect(a).toEqual(b);
    expect(generateInstance('test-add', 99).stem).not.toBe(a.stem);
  });

  it('never emits a duplicate choice and always marks exactly one correct', () => {
    for (let seed = 0; seed < 300; seed++) {
      const q = generateInstance('test-add', seed);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      const parts = q.stem.match(/(\d+) \+ (\d+)/);
      expect(q.choices[q.correctIndex]).toBe(String(Number(parts[1]) + Number(parts[2])));
    }
  });

  it('rejects a template whose band is out of range', () => {
    expect(() => registerTemplate({ id: 'bad', subtest: 'MK', band: 9, generate: () => ({}) }))
      .toThrow(/band/);
  });

  it('rejects a duplicate template id', () => {
    expect(() => registerTemplate({ id: 'test-add', subtest: 'MK', band: 1, generate: () => ({}) }))
      .toThrow(/duplicate/);
  });

  it('builds a drill of the requested length', () => {
    const q = buildDrill({ subtest: 'MK', count: 7, rng: mulberry32(1) });
    expect(q).toHaveLength(7);
    expect(q.every((x) => x.subtest === 'MK')).toBe(true);
  });

  it('excludes stretch templates unless asked', () => {
    registerTemplate({
      id: 'test-hard', subtest: 'MK', band: 5, stretch: true, concepts: ['arith'],
      generate: (rng, h) => {
        const { choices, correctIndex } = h.choices(1, [2, 3]);
        return { stem: 'hard', choices, correctIndex };
      },
    });
    const plain = buildDrill({ subtest: 'MK', count: 40, rng: mulberry32(2) });
    expect(plain.some((q) => q.stretch)).toBe(false);
    const withStretch = buildDrill({ subtest: 'MK', count: 40, rng: mulberry32(2), includeStretch: true });
    expect(withStretch.some((q) => q.stretch)).toBe(true);
  });

  it('seedFrom is stable', () => {
    expect(seedFrom('abc')).toBe(seedFrom('abc'));
    expect(seedFrom('abc')).not.toBe(seedFrom('abd'));
  });
});

describe('timing', () => {
  it('scales the budget by pressure', () => {
    const real = paceBudget('MK', 25, 1);
    expect(real.totalMs).toBe(22 * 60 * 1000);
    expect(paceBudget('MK', 25, 0.6).totalMs).toBe(Math.round(real.totalMs * 0.6));
  });

  it('reports ahead, on, or behind against the expected question index', () => {
    const totalMs = 100000;
    const questionCount = 10;
    expect(paceCheck({ elapsedMs: 50000, answeredCount: 5, totalMs, questionCount }).state).toBe('on');
    expect(paceCheck({ elapsedMs: 50000, answeredCount: 8, totalMs, questionCount }).state).toBe('ahead');
    expect(paceCheck({ elapsedMs: 50000, answeredCount: 2, totalMs, questionCount }))
      .toMatchObject({ state: 'behind', expectedIndex: 5, delta: -3 });
  });

  it('nudges the 5-second abandon rule only on fast subtests', () => {
    expect(shouldNudgeAbandon('BC', 6000)).toBe(true);
    expect(shouldNudgeAbandon('BC', 3000)).toBe(false);
    expect(shouldNudgeAbandon('AR', 6000)).toBe(false);
  });

  it('formats a clock', () => {
    expect(formatClock(65000)).toBe('1:05');
    expect(formatClock(-5)).toBe('0:00');
  });
});
