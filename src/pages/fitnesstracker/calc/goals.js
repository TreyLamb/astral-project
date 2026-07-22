// Goal forecasting: "if I train N days/week, how long until I hit this target?"
//
// Two very different kinds of math live in this file — keep them mentally
// separate:
//   1. BASELINE estimation (estimateRunBaseline / estimateSwimBaseline /
//      estimateLiftBaseline) reuses the app's existing, cited, physiological
//      formulas (Daniels VDOT, CSS, Epley/Brzycki 1RM) against your actual
//      logged workouts. This part is real science, already verified elsewhere
//      in calc/vdot.js, calc/swim.js, calc/lift.js.
//   2. RATE-OF-IMPROVEMENT forecasting (weeksForPercentGain and the
//      forecast*Weeks wrappers) is NOT a physiological law — there is no
//      universally-agreed formula for "how many weeks to close a given fitness
//      gap." The weekly-rate constants below are a planning heuristic informed
//      by common endurance/strength coaching guidance (periodized training
//      blocks of ~3-6 weeks producing a measurable step change; novice linear
//      progression tapering with experience), scaled by training frequency and
//      the size of the ask. Treat forecastWeeks as a rough, revisable estimate
//      — never present it as a guarantee.

import { computePRs } from './pr';
import { vdotFromRace } from './vdot';
import { per100 } from './swim';
import { oneRepMax } from './lift';

// ---- baseline estimation (real formulas, real logged data) ----

// Best current VDOT across any completed run that matches a standard PR bucket.
// VDOT is Daniels' cross-distance fitness score, so the single highest value
// across buckets is a fair "current fitness" baseline regardless of which
// distance produced it.
export function estimateRunBaseline(workouts) {
  let best = null;
  for (const { pr } of computePRs(workouts, 'run')) {
    if (!pr) continue;
    const v = vdotFromRace(pr.distanceM, pr.timeSec);
    if (v && (!best || v > best)) best = v;
  }
  return best;
}

// Best (lowest) pace per 100m across completed swims — analogous fitness anchor
// to CSS without requiring a dedicated two-trial test.
export function estimateSwimBaseline(workouts) {
  let best = null;
  for (const w of workouts) {
    if (w.activityType !== 'swim' || w.status !== 'completed' || !w.distanceM || !w.durationSec) continue;
    const p = per100(w.distanceM, w.durationSec, 'm');
    if (p && (!best || p < best)) best = p;
  }
  return best;
}

// Best estimated 1RM (Epley/Brzycki average) logged for a named exercise.
export function estimateLiftBaseline(workouts, exerciseName) {
  const needle = (exerciseName || '').trim().toLowerCase();
  if (!needle) return null;
  let best = null;
  for (const w of workouts) {
    if (w.activityType !== 'lift' || w.status !== 'completed') continue;
    for (const ex of w.metrics?.exercises || []) {
      if ((ex.name || '').trim().toLowerCase() !== needle) continue;
      for (const s of ex.sets || []) {
        const orm = oneRepMax(Number(s.weightKg), Number(s.reps)).avg;
        if (orm != null && (!best || orm > best)) best = orm;
      }
    }
  }
  return best;
}

// ---- rate-of-improvement heuristic (explicitly NOT a physiological formula) ----

// Reference weekly fractional-improvement rate at a 4-day/week training cadence,
// before frequency/difficulty scaling. Lift responds fastest to added volume
// (well-documented novice linear progression); run/swim aerobic adaptation is
// slower; "generic" (no known formula) is deliberately conservative.
const BASE_WEEKLY_PCT = { run: 0.006, swim: 0.005, lift: 0.01, generic: 0.004 };

// More sessions/week speeds progress, but sub-linearly — diminishing returns and
// an overtraining ceiling, not a straight multiplier. sqrt-scaled, anchored so
// 4 days/week = 1.0x.
function frequencyFactor(daysPerWeek) {
  return Math.sqrt(Math.max(1, Number(daysPerWeek) || 1) / 4);
}

// The last few % toward a ceiling take disproportionately longer than the first
// few — scales the effective weekly rate down as the total ask grows.
function difficultyFactor(pctGainNeeded) {
  return 1 / (1 + pctGainNeeded * 3);
}

// pctGainNeeded: positive fraction (0.08 = 8% improvement needed). Returns whole
// weeks, floored at 2 (nothing forecasts as instant) so a plan always has room
// to actually progress.
export function weeksForPercentGain(pctGainNeeded, daysPerWeek, domain = 'generic') {
  if (!(pctGainNeeded > 0)) return 0;
  const base = BASE_WEEKLY_PCT[domain] ?? BASE_WEEKLY_PCT.generic;
  const weeklyRate = base * frequencyFactor(daysPerWeek) * difficultyFactor(pctGainNeeded);
  return Math.max(2, Math.ceil(pctGainNeeded / weeklyRate));
}

// VDOT: higher is better.
export function forecastRunWeeks(currentVdot, targetVdot, daysPerWeek) {
  if (!currentVdot || !targetVdot || targetVdot <= currentVdot) return 0;
  return weeksForPercentGain((targetVdot - currentVdot) / currentVdot, daysPerWeek, 'run');
}

// Pace per 100 (seconds): LOWER is better, so the gain is a pace *reduction*.
export function forecastSwimWeeks(currentPer100Sec, targetPer100Sec, daysPerWeek) {
  if (!currentPer100Sec || !targetPer100Sec || targetPer100Sec >= currentPer100Sec) return 0;
  return weeksForPercentGain((currentPer100Sec - targetPer100Sec) / currentPer100Sec, daysPerWeek, 'swim');
}

// 1RM: higher is better.
export function forecastLiftWeeks(current1RM, target1RM, daysPerWeek) {
  if (!current1RM || !target1RM || target1RM <= current1RM) return 0;
  return weeksForPercentGain((target1RM - current1RM) / current1RM, daysPerWeek, 'lift');
}

// No known formula for an arbitrary generic metric — same shape, most
// conservative rate, direction controlled by higherIsBetter.
export function forecastGenericWeeks(currentValue, targetValue, daysPerWeek, higherIsBetter = true) {
  if (currentValue == null || targetValue == null || !currentValue) return null;
  const pct = higherIsBetter
    ? (targetValue - currentValue) / currentValue
    : (currentValue - targetValue) / currentValue;
  if (pct <= 0) return 0;
  return weeksForPercentGain(pct, daysPerWeek, 'generic');
}

export function forecastWeeks(kind, baselineValue, targetValue, daysPerWeek) {
  switch (kind) {
    case 'run': return forecastRunWeeks(baselineValue, targetValue, daysPerWeek);
    case 'swim': return forecastSwimWeeks(baselineValue, targetValue, daysPerWeek);
    case 'lift': return forecastLiftWeeks(baselineValue, targetValue, daysPerWeek);
    default: return forecastGenericWeeks(baselineValue, targetValue, daysPerWeek, true);
  }
}

// ---- plan generation (pure — turns a forecast into concrete calendar dates) ----

// N sessions/week spread evenly across the 7-day week (e.g. 3/week -> roughly
// Sun/Tue/Thu-spaced), so training days aren't all bunched at the start. Still
// used by calc/checkpoints.js's buildTaskSessions for plain (non-checkpoint)
// training days — the checkpoint trajectory itself is now built by
// calc/checkpoints.js's buildCheckpoints/recomputeFrom (domain-specific curve
// shapes, not the flat linear interpolation this file used to do via the now-
// removed buildPlan()).
export function weekdayOffsets(daysPerWeek) {
  const n = Math.max(1, Math.min(7, Math.round(Number(daysPerWeek) || 1)));
  return Array.from({ length: n }, (_, i) => Math.round((i * 7) / n));
}

// ---- checkpoint "Logged actual" extraction ----
// Reuses the exact same cited formulas the baseline estimators above already
// call, against a SINGLE completed workout tied to a checkpoint, so a real
// result and a baseline are always expressed in the same comparable unit.

export function extractRunResult(workout) {
  if (workout.activityType !== 'run' || !workout.distanceM || !workout.durationSec) return null;
  return vdotFromRace(workout.distanceM, workout.durationSec);
}

export function extractSwimResult(workout) {
  if (workout.activityType !== 'swim' || !workout.distanceM || !workout.durationSec) return null;
  return per100(workout.distanceM, workout.durationSec, 'm');
}

export function extractLiftResult(workout, exerciseName) {
  if (workout.activityType !== 'lift') return null;
  const needle = (exerciseName || '').trim().toLowerCase();
  if (!needle) return null;
  let best = null;
  for (const ex of workout.metrics?.exercises || []) {
    if ((ex.name || '').trim().toLowerCase() !== needle) continue;
    for (const s of ex.sets || []) {
      const orm = oneRepMax(Number(s.weightKg), Number(s.reps)).avg;
      if (orm != null && (!best || orm > best)) best = orm;
    }
  }
  return best;
}

// Generic/weight goals resolve "actual" from other sources (a manual override
// field, or a BodyWeightLog) rather than from a workout's own fields — null
// here is correct, not a gap.
export function extractCheckpointResult(kind, workout, exerciseName) {
  switch (kind) {
    case 'run': return extractRunResult(workout);
    case 'swim': return extractSwimResult(workout);
    case 'lift': return extractLiftResult(workout, exerciseName);
    default: return null;
  }
}
