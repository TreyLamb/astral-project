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
import { bankItems } from './bank.js';

export const PRACTICE_ACCURACY_LABEL =
  'Practice accuracy - not the official AFOQT percentile. The real scoring tables are unpublished; '
  + 'this is how often you have gotten questions right so far, nothing more.';

/**
 * Every progress key that belongs to one subtest: its generated templates AND its stored bank
 * items.
 *
 * ⚠ THE BANK HALF IS EASY TO FORGET AND WAS MISSING HERE UNTIL 2026-08-26. A generated question
 * is recorded under its template id; a stored one under `bank:<id>`, which is deliberately kept
 * out of the template registry (see bank.js's header). So `allTemplates()` alone silently
 * ignored every official OATTS and migrated-ASVAB question ever answered - and since
 * `composeDrill` mixes generated with stored, that is a real share of every drill on the six
 * subtests that have a bank (Physical Science 52, Math Knowledge 49, Arithmetic Reasoning 37,
 * Word Knowledge 35, Verbal Analogies 10, Reading Comprehension 10). The share was a flat HALF
 * until 2026-09-04 and is now `BANK_SHARE_WITH_TEMPLATES` (0.15) wherever templates can carry
 * the run - see bank.js for why. Smaller, but never zero, so this still cannot be skipped.
 *
 * That made the number not merely incomplete but BIASED: the ignored half is the official USAF
 * material, which is the most representative content in the tool. Anything computing a stat per
 * subtest must go through here rather than filtering `allTemplates()` itself.
 */
export function subtestStatKeys(code) {
  return [
    ...allTemplates().filter((t) => t.subtest === code).map((t) => t.id),
    ...bankItems(code).map((b) => b.templateId),
  ];
}

/**
 * Raw accuracy for one subtest, aggregated across every template AND bank item it owns.
 * Returns `accuracy: null` (not 0) when nothing has been attempted - "no data" and "0% correct"
 * are different facts and must not collapse into the same number.
 */
export function subtestAccuracy(progress, code) {
  const stats = progress?.templateStats ?? {};
  const ids = subtestStatKeys(code);
  const seen = ids.reduce((n, id) => n + (stats[id]?.seen ?? 0), 0);
  const correct = ids.reduce((n, id) => n + (stats[id]?.correct ?? 0), 0);
  const totalMs = ids.reduce((n, id) => n + (stats[id]?.totalMs ?? 0), 0);
  return { code, seen, correct, totalMs, accuracy: seen ? correct / seen : null };
}

export const allSubtestAccuracy = (progress) =>
  Object.keys(SUBTEST_BY_CODE).map((code) => subtestAccuracy(progress, code));

/** How many recent drills the headline accuracy is averaged over. */
export const RECENT_RUN_WINDOW = 10;

/**
 * Accuracy over the LAST N DRILLS of one subtest, rather than over its whole history.
 *
 * `subtestAccuracy` above sums `templateStats`, which are lifetime running totals with no
 * timestamps - a rep from your first week weighs exactly as much as one from today, so a subtest
 * you were bad at early keeps reading low long after you have fixed it. That is the wrong number
 * to answer "where do I stand now", which is the only question that matters this close to a test
 * with no second attempt.
 *
 * `progress.runs` already stores one entry per finished drill, most recent first, so the window
 * costs nothing to compute. The denominator is `answered`, not `count`: a drill abandoned after
 * two questions is not a 2/25 performance, it is a two-question sample. Runs with nothing
 * answered are skipped entirely rather than counted as zero.
 *
 * Returns `accuracy: null` when the window is empty - "no recent data" is not "0% correct".
 */
export function recentSubtestAccuracy(progress, code, limit = RECENT_RUN_WINDOW) {
  const runs = (progress?.runs ?? [])
    .filter((r) => r.subtest === code && (r.answered ?? 0) > 0)
    .slice(0, limit);
  const answered = runs.reduce((n, r) => n + (r.answered ?? 0), 0);
  const correct = runs.reduce((n, r) => n + (r.correct ?? 0), 0);
  const totalMs = runs.reduce((n, r) => n + (r.totalMs ?? 0), 0);
  return {
    code,
    runs: runs.length,
    seen: answered,
    correct,
    totalMs,
    accuracy: answered ? correct / answered : null,
  };
}

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

/**
 * How many DISTINCT questions a subtest can ever ask.
 *
 * Trey's requirement, 2026-09-02: for a subtest whose content is curated rather than computed,
 * "have I seen all of it?" is a real, answerable goal, and he wants it tracked. For one whose
 * content is parameterised it is not a question at all - a quadratic template re-rolls forever.
 *
 * The distinction is already declared per template: `stemSpace` is set exactly when the item
 * space is finite (QUESTION-DOCTRINE rule 4, "a bounded item space gets DECLARED"). So a subtest
 * is CAPPED when every one of its templates declares one, and OPEN when any template does not -
 * one unbounded template is enough to make the total unbounded, so this deliberately does not
 * report a partial sum for a mixed subtest. That would read as a finish line that does not exist.
 *
 * Stored bank items (official OATTS / migrated ASVAB) are a fixed list and always count toward a
 * capped total.
 */
export function subtestItemSpace(code) {
  const templates = allTemplates().filter((t) => t.subtest === code);
  // `generatedFigure` templates (Block Counting piles, Table Reading grids) declare a stemSpace
  // that is questions PER FIGURE, and the figures themselves are generated - so summing it would
  // invent a finish line that does not exist. Reading Comprehension and Situational Judgment are
  // also sheet-based but index an AUTHORED list of passages/scenarios, so they stay countable.
  const open = (t) => t.stemSpace == null || t.generatedFigure;
  const unbounded = templates.filter(open).length;
  const generated = templates.reduce((n, t) => n + (open(t) ? 0 : t.stemSpace), 0);
  const banked = bankItems(code).length;
  return {
    code,
    templates: templates.length,
    unbounded,
    capped: templates.length > 0 && unbounded === 0,
    items: unbounded === 0 ? generated + banked : null,
    generated,
    banked,
  };
}

/**
 * Progress toward having answered every question a capped subtest owns, correctly.
 *
 * `coverage` is lifetime attempts over the item space and is a PROXY, not a set difference: the
 * engine records stats per template, never per instance (mastery is per-template by design - see
 * the folder CLAUDE.md), so nothing here knows which specific seeds have been drawn. Answering
 * 631 Word Knowledge questions does not guarantee all 631 distinct ones were seen. It is the
 * honest ceiling on what the stored data can support, and the UI says "of the bank seen" rather
 * than claiming completion.
 *
 * `solved` is deliberately strict: the whole item space attempted AND perfect recent accuracy.
 * Anything looser turns a finish line into a participation badge.
 */
export function subtestCompletion(progress, code, recentAccuracy) {
  const space = subtestItemSpace(code);
  const { seen } = subtestAccuracy(progress, code);
  if (!space.capped) return { ...space, seen, coverage: null, solved: false };
  const coverage = space.items ? Math.min(1, seen / space.items) : 0;
  return { ...space, seen, coverage, solved: coverage >= 1 && recentAccuracy === 1 };
}
