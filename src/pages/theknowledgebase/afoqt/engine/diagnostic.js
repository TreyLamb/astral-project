// Diagnostic mode - a short, honest sample of every scored subtest, taken in one sitting in
// well under an hour. Pure data/functions, no React, no storage.
//
// PART 29 of docs/afoqt/HANDOFF.md. Curriculum/administration design, Claude-only per section 4.
//
// Why this exists: PLAN.md's Phase 0 "Recommended deviation" flagged it back on day one and it
// was never built - "Trey's stated goal is 'understand where I'm weak and how the test feels' -
// he should get that in week one, not week five." The full exam runner (PART 28) answers that
// question too, but costs ~4 hours; this answers a lighter version of the same question in
// well under an hour, so there is a way to get an early signal before committing to the full
// curriculum or a full sitting.
//
// Deliberately NOT a scaled-down copy of engine/exam.js's administration sequencing:
// - No breaks, no SDI slot. A diagnostic is not simulating test-day logistics; it is sampling
//   every subtest once, back to back, as quickly as an honest sample allows.
// - `DIAGNOSTIC_SUBTESTS` reuses `DRILLABLE` (afoqtSpec.js) directly rather than re-deriving an
//   order, which already excludes the non-drillable SD (Self-Description Inventory) the same
//   way the exam plan's dedicated 'sdi' step does, and needs no special-casing to get there.
// - The accuracy math is NOT reimplemented here. `examSubtestAccuracy`/`examCompositeAccuracy`/
//   `allExamCompositeAccuracy` in engine/exam.js already do exactly this over a
//   `{ [code]: {correct, answered} }` results map with no assumption baked in about WHICH
//   session produced it - a diagnostic's results are shaped identically to an exam's, so this
//   file re-exports that math under diagnostic-appropriate names/labels rather than duplicating
//   it. Two independent copies of the same weighting formula is how they quietly drift apart.

import { DRILLABLE } from './afoqtSpec.js';
import { examSubtestAccuracy, examCompositeAccuracy, allExamCompositeAccuracy } from './exam.js';

/**
 * Six questions per subtest is short enough to stay "well under an hour" (six questions at
 * every subtest's real pace totals about 37 minutes across all 11 scored subtests) while still
 * clearing the 5-question floor this project's own gates already treat as a meaningful sample
 * size (see QUESTION-DOCTRINE.md / the chapter test-out gates).
 */
export const DIAGNOSTIC_QUESTIONS_PER_SUBTEST = 6;

/** Every scored subtest, in the same order DrillConfig already lists them - SD is excluded
 *  because `DRILLABLE` already filters to `studyable` subtests. */
export const DIAGNOSTIC_SUBTESTS = DRILLABLE;

export const diagnosticSubtestAccuracy = examSubtestAccuracy;
export const diagnosticCompositeAccuracy = examCompositeAccuracy;
export const allDiagnosticCompositeAccuracy = allExamCompositeAccuracy;

/**
 * ⚠ THIS IS NOT THE REAL AFOQT SCORE, and it is a WEAKER signal than even the practice-accuracy
 * numbers elsewhere in this tool - six questions is enough to point at a weak area, not enough
 * to be confident about a precise percentage. Every view that shows a diagnostic result must
 * carry this framing, same non-negotiable rule as engine/scoring.js's PRACTICE_ACCURACY_LABEL
 * and engine/exam.js's EXAM_ACCURACY_LABEL.
 */
export const DIAGNOSTIC_ACCURACY_LABEL =
  'Diagnostic snapshot - not the official AFOQT percentile, and only six questions per subtest, '
  + 'so treat this as "where to look first," not a precise score.';

/**
 * Rank subtests by accuracy, weakest first, among only the ones actually reached (a diagnostic
 * ended early should not report a never-attempted subtest as "your weakest" - that is silence,
 * not a low score, and the two must not be confused).
 *
 * @param {Object<string, {correct:number, answered:number}>} results
 * @param {number} n how many to return
 * @returns {{code:string, accuracy:number}[]}
 */
export function weakestSubtests(results, n = 3) {
  return Object.entries(results ?? {})
    .map(([code, r]) => ({ code, accuracy: diagnosticSubtestAccuracy(results, code) }))
    .filter((r) => r.accuracy != null)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, n);
}

// --- personalization thresholds ---------------------------------------------
//
// Six questions per subtest, so accuracy only ever lands on 0, 1/6, 2/6 ... 6/6. STRONG needs
// 5/6 or 6/6 - a real cluster, not "got lucky once." WEAK is 3/6 or worse - half wrong against a
// five-option question is a genuine signal even at n=6, not noise (chance alone is 20%). 4/6 is
// left as MODERATE on purpose: one miss out of six is not enough to claim mastery either way.
export const STRONG_ACCURACY = 0.8;
export const WEAK_ACCURACY = 0.5;

/** null = subtest never reached this diagnostic; do not treat that as either weak or strong. */
export function subtestTier(results, code) {
  const acc = diagnosticSubtestAccuracy(results, code);
  if (acc == null) return null;
  if (acc >= STRONG_ACCURACY) return 'strong';
  if (acc <= WEAK_ACCURACY) return 'weak';
  return 'moderate';
}

/** Sort key: weakest first, strongest last. Missing/moderate share the middle rank. */
export function tierRank(tier) {
  return tier === 'weak' ? 0 : tier === 'strong' ? 2 : 1;
}

/**
 * How much a `strong` diagnostic result shortens a chapter's gates. Still a full sweep, never a
 * lower bar - EXPEDITED_TEST_OUT_COUNT of 3 needs 3/3, not "2 out of 3 is close enough." Chance of
 * bluffing a clean sweep on a genuine guess is (1/5)^3 = 0.8%, so shortening the gate doesn't
 * reopen the "lucky pass" hole the standard 5-question / 4-or-5-correct gate exists to close.
 * Chapters that already demand testOutPass === 5 (see curriculum/chapters.js) are exempt from
 * this - that flag exists specifically because someone can be confidently, uniformly wrong on
 * that one chapter (the inverted instrument pointer, geometry), and a strong subtest-level
 * diagnostic result is not evidence against that specific failure mode.
 */
export const EXPEDITED_TEST_OUT_COUNT = 3;

/** MASTERY_THRESHOLD (0.85) applied at n=8 allows exactly one miss (7/8 = 87.5%), preserving the
 *  standard gate's roughly-one-miss tolerance (11/12 = 91.7%) at two-thirds the length. */
export const EXPEDITED_MASTERY_COUNT = 8;
