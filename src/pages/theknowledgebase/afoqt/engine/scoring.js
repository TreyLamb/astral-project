// Composite PRACTICE-ACCURACY scoring. Read the warning below before wiring this into any view.
//
// PART 27 of docs/afoqt/HANDOFF.md. Engine work, never farmable (section 4).
//
// ⚠ THIS IS NOT THE REAL AFOQT SCORE, AND CANNOT BE MADE INTO ONE. docs/afoqt/RESEARCH.md
// "Scoring" is explicit: "Composites are reported as percentiles 1 to 99 against a reference
// group - not percent correct. Exact weightings and norming tables are unpublished." That is not
// a research gap one more search closes - it is Pearson/AFPC's proprietary IP, and no public
// source has ever reverse-engineered it. A percentile answers "how do you compare to the
// candidate population"; nothing this tool can compute answers that question, because it has no
// access to that population's data.
//
// So this file computes something different and says so everywhere it is shown: PRACTICE
// ACCURACY - percent correct on the questions actually attempted, combined per composite. It is
// a genuinely useful signal (which subtests need more work, whether accuracy is trending up) and
// a genuinely different one from the real score. Every exported value that reaches a view MUST
// carry `PRACTICE_ACCURACY_LABEL` or equivalent framing - never render a composite's accuracy
// next to its official `min` (a PERCENTILE minimum, afoqtSpec.js COMPOSITES) as though the two are
// on the same scale. A candidate reading "72% vs min 25" as "I am 47 points clear" would be
// building false confidence on a unit-confusion bug, on a test with ONE attempt that counts.
//
// WEIGHTING IS A DOCUMENTED ASSUMPTION, NOT A KNOWN FACT. A composite's practice accuracy here is
// the average of its subtests' accuracy, weighted by each subtest's real question COUNT
// (afoqtSpec.js) - closer to "how a raw composite is probably assembled" than an unweighted
// average across subtests would be, but still a guess about unpublished mechanics, not a
// citation. Recorded here rather than picked silently, same convention as `stemSpace` or the SJT
// scoring simplification in engine/judgment.js.

import { COMPOSITES, SUBTEST_BY_CODE } from './afoqtSpec.js';
import { allTemplates } from './generator.js';

export const PRACTICE_ACCURACY_LABEL =
  'Practice accuracy - not the official AFOQT percentile. The real scoring tables are unpublished; '
  + 'this is how often you have gotten questions right so far, nothing more.';

/**
 * Raw accuracy for one subtest, aggregated across every template it owns.
 * Returns `accuracy: null` (not 0) when nothing has been attempted - "no data" and "0% correct"
 * are different facts and must not collapse into the same number.
 */
export function subtestAccuracy(progress, code) {
  const stats = progress?.templateStats ?? {};
  const ids = allTemplates().filter((t) => t.subtest === code).map((t) => t.id);
  const seen = ids.reduce((n, id) => n + (stats[id]?.seen ?? 0), 0);
  const correct = ids.reduce((n, id) => n + (stats[id]?.correct ?? 0), 0);
  return { code, seen, correct, accuracy: seen ? correct / seen : null };
}

export const allSubtestAccuracy = (progress) =>
  Object.keys(SUBTEST_BY_CODE).map((code) => subtestAccuracy(progress, code));

/**
 * Practice accuracy for one composite: the question-count-weighted average of its subtests'
 * accuracy, over only the subtests that have been attempted at least once.
 *
 * `coverage` (0-1) is how much of the composite has ANY data - a composite where only 1 of 4
 * subtests has been touched should read as "early signal", not a confident number, and a caller
 * showing this should scale its own confidence language off `coverage`, not just `accuracy`.
 *
 * Returns `accuracy: null` when NOTHING in the composite has been attempted - never a 0, for the
 * same "no data vs. failing" reason subtestAccuracy avoids it.
 */
export function compositeAccuracy(progress, compositeCode) {
  const composite = COMPOSITES.find((c) => c.code === compositeCode);
  if (!composite) return null;

  const rows = composite.subtests.map((code) => ({
    ...subtestAccuracy(progress, code),
    weight: SUBTEST_BY_CODE[code]?.questions ?? 1,
  }));
  const attempted = rows.filter((r) => r.accuracy != null);
  const coverage = rows.length ? attempted.length / rows.length : 0;

  if (!attempted.length) {
    return { code: compositeCode, name: composite.name, accuracy: null, coverage, subtests: rows };
  }
  const weightSum = attempted.reduce((n, r) => n + r.weight, 0);
  const accuracy = attempted.reduce((n, r) => n + r.accuracy * r.weight, 0) / weightSum;
  return { code: compositeCode, name: composite.name, accuracy, coverage, subtests: rows };
}

/** Every non-disputed composite's practice accuracy. SJT (disputed) is deliberately excluded from
 *  the default list the same way AfoqtDashboard already filters it out of the composite table -
 *  callers that want it can still call compositeAccuracy('SJT') directly. */
export const allCompositeAccuracy = (progress) =>
  COMPOSITES.filter((c) => !c.disputed).map((c) => compositeAccuracy(progress, c.code));
