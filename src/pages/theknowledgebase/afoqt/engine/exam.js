// Full-length Form T exam sequencing. Pure data + pure functions - no React, no storage,
// no side effects. Mirrors engine/scoring.js's discipline: this computes THIS EXAM's own
// accuracy, and is exactly as careful never to call it a percentile.
//
// PART 28 of docs/afoqt/HANDOFF.md. Administration-order design, Claude-only per section 4 -
// deciding where the breaks fall and how the SDI is represented is not a farmable data row.
//
// Source: docs/afoqt/RESEARCH.md "STRUCTURE AND TIMING", read off the AFPC Form T pamphlet's
// own Tables 1 and 2. Order: Part A = VA, AR, WK, MK, RC, [10-min break], SJ, SD,
// [15-min break], Part B = PS, TR, IC, BC, AI. Do not reorder without a cited source - the
// order IS the fidelity a "full-length" runner exists to provide.

import { SUBTESTS, BREAKS, SUBTEST_BY_CODE, COMPOSITES } from './afoqtSpec.js';

/**
 * @typedef {Object} ExamStep
 * @property {number} index
 * @property {'subtest'|'sdi'|'break'} kind
 * @property {string} [subtest]   subtest code - present on 'subtest' and 'sdi' steps
 * @property {number} minutes     official minutes for this step (subtest length, or break length)
 * @property {string} label
 */

/**
 * The full Form T administration order, built from SUBTESTS + BREAKS rather than hand-listed a
 * second time here - so a future correction to either table in afoqtSpec.js cannot drift out of
 * sync with the exam runner silently.
 *
 * SD (Self-Description Inventory) gets its own 'sdi' step kind rather than 'subtest'. PART 26
 * decided it is not drilled - a 240-item personality inventory with no right or wrong answers
 * and zero composite weight has nothing to generate a question FOR. The exam represents it as a
 * timed pass-through instead (see ExamRunner.jsx), never as a drill with fabricated content.
 */
export function buildExamPlan() {
  const steps = [];
  const ordered = [...SUBTESTS].sort((a, b) => a.order - b.order);
  for (const s of ordered) {
    steps.push({
      index: steps.length,
      kind: s.code === 'SD' ? 'sdi' : 'subtest',
      subtest: s.code,
      minutes: s.minutes,
      label: s.name,
    });
    const brk = BREAKS.find((b) => b.afterOrder === s.order);
    if (brk) {
      steps.push({ index: steps.length, kind: 'break', minutes: brk.minutes, label: brk.label });
    }
  }
  return steps;
}

/** Computed once - the plan is pure data over afoqtSpec, never per-session state. */
export const EXAM_PLAN = buildExamPlan();

export const examTestingMinutes = () => SUBTESTS.reduce((n, s) => n + s.minutes, 0);
export const examBreakMinutes = () => BREAKS.reduce((n, b) => n + b.minutes, 0);
export const examContentMinutes = () => examTestingMinutes() + examBreakMinutes();

/**
 * ⚠ This is NOT the official "about 5 hours" / "4 h 47.5 min" figure from RESEARCH.md.
 * That total includes untimed administrative overhead this runner does not and cannot model -
 * check-in, per-subtest instructions, and the demographics page between SJ and SD - roughly
 * 46 minutes unaccounted for by subtest content + breaks alone (216.5 + 25 = 241.5 min vs the
 * documented 287.5). Presenting `examContentMinutes()` as the whole exam length would understate
 * real test day by the better part of an hour, so callers must show both numbers, never one
 * alone. See docs/afoqt/HANDOFF.md's PART 28 design record for the full accounting.
 */
export const OFFICIAL_TOTAL_MINUTES = 287.5;

export function newExamId() {
  return `exam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ⚠ THIS IS NOT THE REAL AFOQT SCORE. Same non-negotiable framing as engine/scoring.js's
 * PRACTICE_ACCURACY_LABEL, repeated here because a candidate reading a just-finished exam
 * report is exactly the moment false confidence is most expensive. This label describes THIS
 * EXAM's own accuracy - not lifetime practice accuracy (scoring.js, computed across every
 * attempt ever made) and not an official percentile (unpublished; see RESEARCH.md "Scoring").
 */
export const EXAM_ACCURACY_LABEL =
  'This exam\'s accuracy - not the official AFOQT percentile. Composites are reported and normed '
  + 'against a candidate population this tool has no access to; this is only how many of the '
  + 'questions in THIS run you got right.';

/**
 * @param {Object<string, {correct:number, answered:number}>} results  subtest code -> this exam's own tally
 * @returns {number|null} null when the subtest was never reached (e.g. exam ended early)
 */
export function examSubtestAccuracy(results, code) {
  const r = results?.[code];
  return r && r.answered ? r.correct / r.answered : null;
}

/**
 * A composite's accuracy computed from THIS EXAM's own subtest tallies, weighted by each
 * subtest's real question count - the same documented-assumption weighting engine/scoring.js
 * uses for lifetime accuracy, kept consistent on purpose so the two numbers mean the same thing
 * when compared. Returns `accuracy: null` when nothing in the composite was reached (an exam
 * ended early before that subtest), never a 0 - "not reached" and "answered wrong" are different
 * facts.
 */
export function examCompositeAccuracy(results, compositeCode) {
  const composite = COMPOSITES.find((c) => c.code === compositeCode);
  if (!composite) return null;
  const rows = composite.subtests.map((code) => ({
    code,
    accuracy: examSubtestAccuracy(results, code),
    weight: SUBTEST_BY_CODE[code]?.questions ?? 1,
  }));
  const attempted = rows.filter((r) => r.accuracy != null);
  if (!attempted.length) {
    return { code: compositeCode, name: composite.name, accuracy: null, subtests: rows };
  }
  const weightSum = attempted.reduce((n, r) => n + r.weight, 0);
  const accuracy = attempted.reduce((n, r) => n + r.accuracy * r.weight, 0) / weightSum;
  return { code: compositeCode, name: composite.name, accuracy, subtests: rows };
}

/** Every non-disputed composite, same exclusion scoring.js applies to SJT and for the same reason. */
export const allExamCompositeAccuracy = (results) =>
  COMPOSITES.filter((c) => !c.disputed).map((c) => examCompositeAccuracy(results, c.code));
