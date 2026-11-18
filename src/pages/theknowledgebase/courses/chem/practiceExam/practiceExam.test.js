// The study-guide practice exam: every style makes exactly 3 questions, the real one reproduces
// his guide's answer, and siblings are well-formed and distinct (PREFERENCES.md, 2026-11-17).
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../../../engine/rng.js';
import { makeHelpers } from '../engine/generator.js';
import { STYLES, styleTriple, buildPracticeExam, norm } from './index.js';
import { LADDERS } from './ladders.js';
import { chemHints } from '../engine/hints.js';

// NaN only as a bare token: NaNO₃ and NaN₃ are real formulas.
const BAD = /NaN(?![A-Za-z₀-₉])|undefined|Infinity|\[object/;
const SAMPLES = Number(process.env.PE_SAMPLES ?? 300);

describe('study-guide practice exam', () => {
  it('style ids are unique', () => {
    const ids = STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const style of STYLES) {
    describe(style.id, () => {
      it('real question reproduces the study-guide answer', () => {
        const r = style.real;
        if (r.from || !r.p) return;
        const g = style.gen(makeHelpers(mulberry32(1), 1), r.p);
        expect(norm(g.right)).toBe(norm(r.answer));
        if (r.choices) expect(r.choices).toContain(r.answer);
      });

      it('makes exactly 3 well-formed questions, siblings distinct', () => {
        for (let seed = 1; seed <= 25; seed++) {
          const qs = styleTriple(style, 1, seed);
          expect(qs).toHaveLength(3);
          expect(new Set(qs.map((q) => `${norm(q.stem.replace(/^\d+[abc]\. /, ''))}|${norm(q.choices[q.correctIndex])}`)).size).toBe(3);
          for (const q of qs) {
            expect(q.choices.length).toBeGreaterThanOrEqual(4);
            expect(new Set(q.choices).size).toBe(q.choices.length);
            expect(q.correctIndex).toBeGreaterThanOrEqual(0);
            expect(BAD.test(`${q.stem} | ${q.choices.join(' | ')} | ${q.explanation}`)).toBe(false);
          }
        }
      });

      it(`siblings stay well-formed over ${SAMPLES} draws`, () => {
        for (let seed = 1; seed <= SAMPLES; seed++) {
          const h = makeHelpers(mulberry32(seed * 977), seed);
          const g = style.gen(h, null);
          const c = h.choices(g.right, g.wrong);
          expect(c.choices.length, `${style.id} seed ${seed}: ${g.stem} -> ${c.choices.join(' | ')}`).toBeGreaterThanOrEqual(4);
          expect(BAD.test(`${g.stem} | ${c.choices.join(' | ')}`), `${style.id} seed ${seed}: ${g.stem} ${c.choices}`).toBe(false);
        }
      });
    });
  }

  it('every question has a hint ladder of at least 5 steps (root CLAUDE.md rule 7)', () => {
    const short = [];
    STYLES.forEach((s, i) => {
      if (!LADDERS[s.id]) short.push(`${s.id}: no ladder`);
      for (let seed = 1; seed <= 10; seed++) {
        for (const q of styleTriple(s, i + 1, seed)) {
          const n = chemHints(q).length;
          if (n < 5) short.push(`${s.id} seed ${seed}: ${n} hints`);
        }
      }
    });
    expect(short).toEqual([]);
  });

  it('the whole exam is 3 questions per style', () => {
    expect(buildPracticeExam({ seed: 5 })).toHaveLength(STYLES.length * 3);
  });
});
