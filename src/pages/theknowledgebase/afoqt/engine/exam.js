// Full-length Form T exam simulator - sequencing + single-sitting scoring.
//
// PART 28 of docs/afoqt/HANDOFF.md. Engine + curriculum-design work, never farmable
// (section 4 of that file: "Curriculum design - deciding what the chapters ARE" and "Engine
// work" both stay with Claude).
//
// The real test administers all 12 subtests back to back in ONE fixed order with two breaks -
// a candidate does not pick a subtest off a menu the way DrillConfig lets a practice session do.
// This file is pure sequencing + scoring logic, no React and no storage, same separation as
// timing.js and scoring.js. views/ExamRunner.jsx is the only caller.

import { SUBTESTS, BREAKS, COMPOSITES, SUBTEST_BY_CODE } from './afoqtSpec.js';
import { assembleDrill } from './drill.js';
import { PRACTICE_ACCURACY_LABEL } from './scoring.js';

export { PRACTICE_ACCURACY_LABEL };

/**
 * The fixed administration sequence, derived from SUBTESTS' own `order` and BREAKS - not
 * hand-typed, so a future change to either table can never drift out of step with this list.
 *
 * A 'subtest' step is drilled and scored. The Self-Description Inventory (order 7) is neither -
 * PART 26 decided it has no right/wrong answers and is deliberately not built as an interactive
 * tool, so its slot here is a fixed 'info' step (a notice, not a question set). Skipping its slot
 * outright would misrepresent how the real ~3.5 hours actually feels: 45 minutes of personality
 * inventory genuinely sits between Situational Judgment and the Part A/B break, and a candidate
 * who has never felt that gap is in for a surprise on test day that this tool exists to prevent.
 */
export function buildExamSteps() {
  const steps = [];
  for (const s of SUBTESTS) {
    steps.push(s.studyable ? { type: 'subtest', code: s.code } : { type: 'info', code: s.code });
    const brk = BREAKS.find((b) => b.afterOrder === s.order);
    if (brk) steps.push({ type: 'break', minutes: brk.minutes, label: brk.label });
  }
  return steps;
}

export const EXAM_STEPS = buildExamSteps();

export const EXAM_TOTAL_MINUTES =
  SUBTESTS.reduce((n, s) => n + s.minutes, 0) + BREAKS.reduce((n, b) => n + b.minutes, 0);

/**
 * One subtest's full-length, honest (non-biased) question queue for the exam - the real
 * question count, drawn with `exam: true` so no training-aid template and no miss-pool
 * weighting can enter a simulated score. See engine/drill.js `assembleDrill` for why "honest"
 * turns both of those off.
 */
export function buildExamQuestions(code, rng) {
  const meta = SUBTEST_BY_CODE[code];
  if (!meta) return [];
  return assembleDrill({ subtest: code, count: meta.questions, rng, exam: true });
}

/**
 * Composite scores for ONE SITTING, not lifetime history.
 *
 * engine/scoring.js's `compositeAccuracy` reads `progress.templateStats`, which blends every
 * practice rep ever recorded and can be partial (some subtests never attempted). A finished
 * exam is a single honest sample across every subtest at once - the full sequence always
 * touches every composite's subtests, so a completed run has 100% coverage by construction -
 * and deserves its own number computed only from THIS run's results, never blended with
 * practice history.
 *
 * `results` is `{ [subtestCode]: { correct, total } }`. Same practice-accuracy framing as
 * scoring.js: this is percent correct, never the real norm-referenced percentile, which
 * this tool cannot compute (see scoring.js's header for why that is not a closable gap).
 * Summing correct/total across a composite's subtests IS the count-weighted average scoring.js
 * uses, since every question is worth one point - no separate weighting step is needed here.
 */
export function examComposites(results) {
  return COMPOSITES.map((c) => {
    const rows = c.subtests.map((code) => results[code] ?? { correct: 0, total: 0 });
    const total = rows.reduce((n, r) => n + (r.total ?? 0), 0);
    const correct = rows.reduce((n, r) => n + (r.correct ?? 0), 0);
    return {
      code: c.code,
      name: c.name,
      subtests: c.subtests,
      disputed: !!c.disputed,
      rated: !!c.rated,
      min: c.min ?? null,
      accuracy: total ? correct / total : null,
    };
  });
}

/** Overall rights-only score across every SCORED subtest actually administered in the run. */
export function examOverall(results) {
  const rows = Object.entries(results).filter(([code]) => SUBTEST_BY_CODE[code]?.scored);
  const total = rows.reduce((n, [, r]) => n + (r.total ?? 0), 0);
  const correct = rows.reduce((n, [, r]) => n + (r.correct ?? 0), 0);
  return { correct, total, accuracy: total ? correct / total : null };
}
