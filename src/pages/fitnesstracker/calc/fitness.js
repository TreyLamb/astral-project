// Current fitness derived from logged workouts — the missing link between
// "what I actually ran" and "what I should run next".
//
// vdot.js could always turn a RACE into a VDOT, and goals.js could turn a
// PR-bucket effort into one (estimateRunBaseline). Neither helps with the runs
// people actually log: computePRs only matches standard distances (1mi, 2mi,
// 5k, ...) within 1.5%, so a 2.83-mile easy run matches nothing and yields
// null. This module fills that gap, and is explicit about the difference
// between a VDOT that was MEASURED and one that was INFERRED.
//
// The coaching rule that shapes everything here: you cannot compute VDOT from
// an easy run. VDOT is defined off a maximal effort at a known distance. What
// an easy run CAN do is bound the answer — if a given pace was genuinely easy,
// it was somewhere in Daniels' E band, and that pins a VDOT range. Same for a
// rep session sitting between I and R. Those are inferences, always labelled
// as such, and always beaten by a real time trial.

import { vo2AtVelocity, vdotFromRace, PACE_FRACTIONS, trainingPaces } from './vdot';

// RPE at or above this is treated as a maximal effort worth deriving VDOT from.
// 9 = "very hard, could not hold much longer" on this app's RPE_LEGEND.
export const MAX_EFFORT_RPE = 9;

// A note/title mentioning any of these marks a deliberate test effort.
const TIME_TRIAL_RE = /\b(time.?trial|tt|race|test|max effort|all.?out)\b/i;

export function isTimeTrial(w) {
  return TIME_TRIAL_RE.test(`${w?.title ?? ''} ${w?.note ?? ''}`);
}

function isRun(w, activityType = 'run') {
  return w?.activityType === activityType && w?.status !== 'planned';
}

function velocityMPerMin(distanceM, timeSec) {
  if (!distanceM || !timeSec) return null;
  return (distanceM / timeSec) * 60;
}

// Implied VDOT if a velocity was run at a given VO2 fraction (see
// vdot.js PACE_FRACTIONS — those are fractions of VO2, not of velocity).
export function vdotAtFraction(distanceM, timeSec, fraction) {
  const v = velocityMPerMin(distanceM, timeSec);
  if (!v || !fraction) return null;
  const vo2 = vo2AtVelocity(v);
  if (!(vo2 > 0)) return null;
  return vo2 / fraction;
}

// The VDOT range implied by a session run in a named zone. E is a band, so it
// gives a genuine range; the single-point zones give a degenerate one.
// Slower fraction => higher implied VDOT (same pace, easier effort = fitter).
export function impliedVdotRange(distanceM, timeSec, zone) {
  const f = PACE_FRACTIONS[zone];
  if (!f) return null;
  const fractions = Array.isArray(f) ? f : [f, f];
  const values = fractions.map((x) => vdotAtFraction(distanceM, timeSec, x)).filter((x) => x != null);
  if (values.length === 0) return null;
  return [Math.min(...values), Math.max(...values)];
}

// A rep session (short repeats, full recovery) sits between I and R effort, so
// it bounds VDOT from both sides. Takes the pace of a single rep.
export function impliedVdotFromReps(repDistanceM, repTimeSec) {
  const i = vdotAtFraction(repDistanceM, repTimeSec, PACE_FRACTIONS.I);
  const r = vdotAtFraction(repDistanceM, repTimeSec, PACE_FRACTIONS.R);
  if (i == null || r == null) return null;
  return [Math.min(i, r), Math.max(i, r)];
}

// MEASURED: a real maximal effort at a known distance.
//
// Deliberately does NOT use computePRs/estimateRunBaseline. Those match any run
// at a standard distance (1mi, 2mi, 5k...) within 1.5% and treat it as a race —
// so an easy 5k shuffle is scored as a maximal effort and yields a nonsense
// VDOT. Effort has to be established before a time means anything, so the
// filter here is effort FIRST (flagged time trial, or max-effort RPE), distance
// second. This is why a fresh install reports "no qualifying effort" instead of
// a confident wrong number.
export function measuredVdot(workouts, activityType = 'run') {
  let best = null;
  for (const w of workouts ?? []) {
    if (!isRun(w, activityType) || !w.distanceM || !w.durationSec) continue;
    const tt = isTimeTrial(w);
    if (!tt && (w.rpe ?? 0) < MAX_EFFORT_RPE) continue;
    const vdot = vdotFromRace(w.distanceM, w.durationSec);
    if (vdot && (!best || vdot > best.vdot)) {
      best = { vdot, workout: w, via: tt ? 'timeTrial' : 'rpe' };
    }
  }
  return best;
}

// INFERRED: bound VDOT from ordinary easy runs. Only runs that were actually
// easy qualify — an easy-labelled run done at threshold tells us nothing about
// the E band. Uses the most recent qualifying runs.
export function inferredVdotFromEasy(workouts, { activityType = 'run', maxRpe = 5, limit = 5 } = {}) {
  const runs = (workouts ?? [])
    .filter((w) => isRun(w, activityType) && w.distanceM && w.durationSec)
    .filter((w) => w.rpe == null || w.rpe <= maxRpe)
    .filter((w) => !isTimeTrial(w))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
  if (runs.length === 0) return null;
  const ranges = runs.map((w) => impliedVdotRange(w.distanceM, w.durationSec, 'E')).filter(Boolean);
  if (ranges.length === 0) return null;
  // Take the best (fittest) easy run as the representative one — a slow
  // recovery shuffle should not drag the estimate down.
  const lo = Math.max(...ranges.map((r) => r[0]));
  const hi = Math.max(...ranges.map((r) => r[1]));
  return { range: [lo, hi], samples: runs.length, workouts: runs };
}

// The composite answer the UI asks for.
//   confidence 'measured' — a real max effort exists, use it.
//   confidence 'inferred' — only easy runs; VDOT is a range, midpoint reported.
//   confidence 'none'     — nothing usable logged.
export function currentFitness(workouts, opts = {}) {
  const measured = measuredVdot(workouts, opts.activityType);
  if (measured) {
    return {
      vdot: measured.vdot,
      range: [measured.vdot, measured.vdot],
      confidence: 'measured',
      via: measured.via,
      workout: measured.workout,
      needsTimeTrial: false,
    };
  }
  const easy = inferredVdotFromEasy(workouts, opts);
  if (easy) {
    const [lo, hi] = easy.range;
    return {
      vdot: (lo + hi) / 2,
      range: easy.range,
      confidence: 'inferred',
      via: 'easyRuns',
      workout: easy.workouts[0],
      samples: easy.samples,
      needsTimeTrial: true,
    };
  }
  return { vdot: null, range: null, confidence: 'none', via: null, workout: null, needsTimeTrial: true };
}

// Which training zone a pace actually landed in, and how far off the nearest
// zone it was. Drives the "you ran this faster/slower than prescribed" flag.
export function classifyPace(secPerM, vdot) {
  const paces = vdot ? trainingPaces(vdot) : null;
  if (!paces || !secPerM) return null;
  const points = [
    { zone: 'E', secPerM: (paces.E[0] + paces.E[1]) / 2, range: paces.E },
    { zone: 'M', secPerM: paces.M },
    { zone: 'T', secPerM: paces.T },
    { zone: 'I', secPerM: paces.I },
    { zone: 'R', secPerM: paces.R },
  ].filter((p) => p.secPerM != null);
  let nearest = null;
  for (const p of points) {
    const delta = Math.abs(secPerM - p.secPerM) / p.secPerM;
    if (!nearest || delta < nearest.delta) nearest = { ...p, delta };
  }
  if (!nearest) return null;
  // Negative = ran faster than the zone (lower sec/m).
  const deltaPct = (secPerM - nearest.secPerM) / nearest.secPerM;
  return { zone: nearest.zone, deltaPct, faster: deltaPct < 0 };
}

// Does a session imply we are under-rating current fitness? True when a run
// that should have been in `expectedZone` came in materially faster than that
// zone's pace — the trigger for re-deriving, per methodology.md rule 3.
export function suggestsRecalibration(secPerM, vdot, expectedZone, tolerance = 0.03) {
  const paces = vdot ? trainingPaces(vdot) : null;
  if (!paces || !secPerM || !expectedZone) return false;
  const target = expectedZone === 'E' ? paces.E[1] : paces[expectedZone];
  if (!target) return false;
  return secPerM < target * (1 - tolerance);
}
