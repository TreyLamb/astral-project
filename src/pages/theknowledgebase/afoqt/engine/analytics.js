// Results & analytics (PART 30) - pure data/functions, no React, no storage.
//
// PART 30 of docs/afoqt/HANDOFF.md. Curriculum/dashboard design, Claude-only per section 4.
//
// Nothing here computes a NEW fact about how the tool works - it reshapes records that PARTS
// 27-29 already write (`progress.runs`, `.examRuns`, `.diagnosticRuns`, `.templateStats`) into
// the trend-over-time view flagged as missing in every one of those parts' own "not done" notes
// and in PLAN.md's Phase 0 "Recommended deviation". Every accuracy number below carries the same
// non-negotiable framing the rest of this tool already insists on: practice accuracy, never an
// official percentile.

import { subtestAccuracy } from './scoring.js';
import { SUBTEST_BY_CODE } from './afoqtSpec.js';

const dayStr = (iso) => new Date(iso).toISOString().slice(0, 10);
const todayStr = () => dayStr(new Date().toISOString());

/**
 * Bucket every drill run by calendar day, most recent `days` days, oldest first (so a
 * sparkline reads left-to-right as time passing). A day with no runs gets `accuracy: null`,
 * never 0 - "didn't practice" and "practiced badly" are different facts, the same distinction
 * `subtestAccuracy`/`examSubtestAccuracy`/`diagnosticSubtestAccuracy` already draw everywhere
 * else in this tool.
 *
 * @param {Array<{startedAt:string, correct:number, answered:number}>} runs
 * @param {number} days
 */
export function dailyAccuracy(runs, days = 14) {
  const buckets = new Map(); // date -> { correct, answered }
  for (const r of runs ?? []) {
    if (!r?.startedAt) continue;
    const d = dayStr(r.startedAt);
    const cur = buckets.get(d) ?? { correct: 0, answered: 0 };
    cur.correct += r.correct ?? 0;
    cur.answered += r.answered ?? 0;
    buckets.set(d, cur);
  }
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const b = buckets.get(key);
    out.push({
      date: key,
      correct: b?.correct ?? 0,
      answered: b?.answered ?? 0,
      accuracy: b && b.answered ? b.correct / b.answered : null,
    });
  }
  return out;
}

/**
 * Every distinct calendar day the candidate did ANYTHING on this tool - a drill, a full exam,
 * or the diagnostic. Used for both a lifetime count and the streak below.
 */
export function practiceDays(progress) {
  const days = new Set();
  for (const r of progress?.runs ?? []) if (r?.startedAt) days.add(dayStr(r.startedAt));
  for (const r of progress?.examRuns ?? []) if (r?.startedAt) days.add(dayStr(r.startedAt));
  for (const r of progress?.diagnosticRuns ?? []) if (r?.takenAt) days.add(dayStr(r.takenAt));
  return days;
}

/**
 * Consecutive practice days ending today OR yesterday - ending at yesterday still counts as a
 * "live" streak, since a candidate who practiced every day through yesterday and simply hasn't
 * opened the tool yet today should not see their streak read as broken the moment midnight
 * passes. A streak that lapsed further back than yesterday is 0, not a stale number.
 */
export function currentStreakDays(progress) {
  const days = practiceDays(progress);
  if (days.size === 0) return 0;
  const cursor = new Date();
  if (!days.has(todayStr())) cursor.setDate(cursor.getDate() - 1); // allow "yesterday" as the anchor
  let streak = 0;
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * How one whole sitting (exam or diagnostic) went, across every subtest it actually reached -
 * NOT scoped to one composite, unlike `examCompositeAccuracy`/`diagnosticCompositeAccuracy`.
 * Weighted by each subtest's real question count, same documented-assumption weighting used
 * everywhere else in this tool. Returns null if nothing was reached (an exam aborted at step 0).
 *
 * @param {Object<string, {correct:number, answered:number}>} results
 */
export function overallAccuracy(results) {
  const rows = Object.entries(results ?? {})
    .map(([code, r]) => ({ code, correct: r?.correct ?? 0, answered: r?.answered ?? 0 }))
    .filter((r) => r.answered > 0);
  if (!rows.length) return null;
  const weightOf = (code) => SUBTEST_BY_CODE[code]?.questions ?? 1;
  const weightSum = rows.reduce((n, r) => n + weightOf(r.code), 0);
  const acc = rows.reduce((n, r) => n + (r.correct / r.answered) * weightOf(r.code), 0) / weightSum;
  return acc;
}

/**
 * Every completed exam sitting, oldest first (chronological, for a trend list), with its own
 * overall accuracy and how many of the 11 scored subtests it actually reached.
 */
export function examSittingSummaries(examRuns) {
  return [...(examRuns ?? [])]
    .slice()
    .reverse() // examRuns is stored most-recent-first; a trend reads oldest-first
    .map((r) => ({
      examId: r.examId,
      date: r.startedAt,
      aborted: !!r.aborted,
      reached: Object.keys(r.results ?? {}).length,
      accuracy: overallAccuracy(r.results),
    }));
}

/**
 * Per-subtest comparison between the most recent diagnostic and current lifetime practice
 * accuracy - "where you started" vs "where you are now". A subtest the diagnostic reached but
 * that has no lifetime practice data since (still `seen: 0` in `templateStats`, which happens
 * for a subtest with only bank content, or simply untouched since) reports `now: null`, not a
 * misleading 0 or a repeat of the diagnostic's own number.
 *
 * @param {{results: Object}} diagnosticRun
 * @param {object} progress
 */
export function diagnosticVsNow(diagnosticRun, progress) {
  if (!diagnosticRun) return [];
  return Object.entries(diagnosticRun.results ?? {})
    .map(([code, r]) => {
      const then = r?.answered ? r.correct / r.answered : null;
      const now = subtestAccuracy(progress, code).accuracy;
      return {
        code,
        name: SUBTEST_BY_CODE[code]?.name ?? code,
        then,
        now,
        delta: then != null && now != null ? now - then : null,
      };
    })
    .filter((r) => r.then != null);
}
