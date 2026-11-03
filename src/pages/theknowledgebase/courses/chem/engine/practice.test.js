import { describe, it, expect } from 'vitest';
import './templates/index.js';
import { generateChemInstance } from './generator.js';
import { buildPracticeSet, sameTemplateCount } from './practice.js';
import { mulberry32 } from '../../../engine/rng.js';

describe('practice mode', () => {
  it('splits a set about half same-template, half same-skill', () => {
    expect(sameTemplateCount(5)).toBe(3);
    expect(sameTemplateCount(10)).toBe(5);
  });

  for (const x of [5, 10]) {
    it(`x=${x}: starts with the exact question, then the same template, then other templates of the same skill`, () => {
      const q = generateChemInstance('chem1-acs-06-dhrxn-from-dhf', 42);
      const set = buildPracticeSet(q, x, mulberry32(7));
      expect(set.questions).toHaveLength(x);
      expect(set.questions[0].stem).toBe(q.stem);
      const same = set.questions.slice(0, sameTemplateCount(x));
      expect(same.every((p) => p.templateId === q.templateId)).toBe(true);
      const rest = set.questions.slice(sameTemplateCount(x)).filter((p) => p.practiceKind === 'related');
      for (const p of rest) {
        expect(p.templateId).not.toBe(q.templateId);
        expect(p.concepts.some((c) => q.concepts.includes(c))).toBe(true);
      }
      expect(new Set(set.questions.map((p) => p.stem)).size).toBe(x);
    });
  }

  it('reports a shortfall instead of hiding it', () => {
    const q = generateChemInstance('chem1-02-zeff-trend', 1);
    const set = buildPracticeSet(q, 10, mulberry32(3));
    // Zeff has no sibling generators yet: all five "different kind" slots are reported short.
    expect(set.shortBy).toBe(10 - sameTemplateCount(10));
    expect(set.siblingsUsed).toBe(0);
  });
});
