// Timing model. On the AFOQT, PACE IS THE DIFFICULTY - Block Counting allows 9.0 seconds
// per question - so this is a first-class engine, not a display detail.
//
// Pure functions. No timers here; the runner owns the interval and calls in.

import { getSubtest, secPerQuestion } from './afoqtSpec';

/** 1.0 = the real allotment. Below 1 is harder; 1.25 is an early-practice cushion. */
export const PRESSURE_PRESETS = [
  { value: 1.25, label: 'Practice', hint: '25% more time than the real test' },
  { value: 1.0,  label: 'Real',     hint: 'Exactly the official allotment' },
  { value: 0.8,  label: 'Hard',     hint: '20% less time' },
  { value: 0.6,  label: 'Brutal',   hint: '40% less time' },
];

export const MODES = ['untimed', 'paced', 'exam'];

/**
 * Total and per-question budget for a run.
 * @param {string} subtestCode
 * @param {number} questionCount may be fewer than the real subtest length
 * @param {number} pressure
 */
export function paceBudget(subtestCode, questionCount, pressure = 1) {
  const s = getSubtest(subtestCode);
  if (!s) return { totalMs: 0, perQuestionMs: 0, realSecPerQuestion: 0 };
  const perQ = secPerQuestion(s) * pressure;
  return {
    totalMs: Math.round(perQ * questionCount * 1000),
    perQuestionMs: Math.round(perQ * 1000),
    realSecPerQuestion: secPerQuestion(s),
  };
}

/**
 * Where you SHOULD be right now, and by how much you are off.
 *
 * This implements the pacing method a real test-taker described: 22 minutes total, 50
 * seconds per question, so by half-way at 11 minutes remaining you need to be around
 * question 13. A bare countdown does not teach pace; an explicit ahead/behind marker does.
 *
 * @returns {{expectedIndex:number, delta:number, state:'ahead'|'on'|'behind'}}
 */
export function paceCheck({ elapsedMs, answeredCount, totalMs, questionCount }) {
  if (totalMs <= 0 || questionCount <= 0) {
    return { expectedIndex: 0, delta: 0, state: 'on' };
  }
  const fraction = Math.min(1, elapsedMs / totalMs);
  const expectedIndex = Math.round(fraction * questionCount);
  const delta = answeredCount - expectedIndex;
  // One question either way is noise at these speeds; do not nag.
  const state = delta >= 1 ? 'ahead' : delta <= -1 ? 'behind' : 'on';
  return { expectedIndex, delta, state };
}

/**
 * The 5-second abandon rule: on the fast subtests, dwelling is the failure mode. Guess
 * within 5 seconds rather than leaving a blank. Only nag where the pace demands it.
 */
export const ABANDON_NUDGE_MS = 5000;
export function shouldNudgeAbandon(subtestCode, questionElapsedMs) {
  const s = getSubtest(subtestCode);
  if (!s) return false;
  if (secPerQuestion(s) > 20) return false; // slow subtests: dwelling is fine
  return questionElapsedMs >= ABANDON_NUDGE_MS;
}

/** Rights-only scoring means an unanswered question is strictly worse than a guess. */
export const GUESS_SWEEP_WARNING_MS = 15000;
export const shouldWarnGuessSweep = (remainingMs, unansweredCount) =>
  remainingMs <= GUESS_SWEEP_WARNING_MS && unansweredCount > 0;

export function formatClock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
