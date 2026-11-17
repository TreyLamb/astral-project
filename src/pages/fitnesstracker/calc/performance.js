// A runner's OWN distance-time curve, built from their real max efforts.
//
// Why this exists: Daniels' VDOT equivalence (vdot.js) and Riegel's 1.06
// exponent (riegel.js) both describe an AVERAGE runner — one whose endurance
// matches their speed. Fed a single fast mile, they predict a 2-mile as if that
// runner were typical. A speed-limited or endurance-limited runner is not, and
// the error is large: a 7:34 mile reads as a 16:03 2-mile by VDOT for a runner
// whose two-mile was 18:11 three weeks earlier. The app used to take the BEST
// VDOT ever logged and run every pace off it, which compounded the error.
//
// The model is Riegel's power law with a PERSONAL exponent:
//     t(d) = t_anchor * (d / d_anchor) ^ k
// - the anchor is the MOST RECENT max effort (fitness changes; a real result is
//   the only input — guidelinesForecast.md), never the best-ever one;
// - k is fitted from the runner's own recent efforts at two or more distances;
// - with only one distance, k is not knowable, so a population value is used
//   AND the uncertainty is reported as a range instead of hidden.
//
// Exponent evidence: Riegel (1981) fitted 1.06 across elite performances.
// Vickers & Vertosick (2016, BMC Sports Sci Med Rehabil; 2,303 recreational
// runners) found Riegel too optimistic for typical runners, with the population
// figure nearer 1.07-1.09 and higher for low-volume training (their calculator
// uses 1.12 for that tier). Endurance specialists sit near 1.04. Hence: default
// 1.08, single-distance band 1.04-1.12, and hard bounds 1.01-1.20 on a fit —
// anything outside that is two tests disagreeing, not a physiology.

import { vdotFromRace, trainingPaces } from './vdot';
import { isTimeTrial, MAX_EFFORT_RPE } from './fitness';

export const DEFAULT_EXPONENT = 1.08;
export const SINGLE_DISTANCE_BAND = [1.04, 1.12];
export const EXPONENT_BOUNDS = [1.01, 1.2];
// Efforts older than this (relative to the newest one) don't shape the curve.
export const FIT_WINDOW_DAYS = 42;
// Tests further apart than this mix fitness change into the fitted exponent.
export const TIGHT_PAIR_DAYS = 14;
// The newest test older than this means the whole model needs a retest.
export const STALE_DAYS = 42;
// Two distances closer than this ratio can't separate k from noise.
export const MIN_DISTANCE_SPREAD = 1.25;

const MARATHON_M = 42195;
const MILE_M = 1609.344;

function dayNumber(iso) {
  return Math.round(new Date(`${iso}T00:00:00`).getTime() / 86400000);
}

export function slowdownPerDoubling(k) {
  return Math.pow(2, k - 1) - 1;
}

// Every logged max effort, oldest first. Same effort-first filter the rest of
// the app uses: flagged as a time trial, or RPE at max effort.
export function maxEfforts(workouts, activityType = 'run') {
  return (workouts ?? [])
    .filter((w) => w?.activityType === activityType && w.status !== 'planned' && w.distanceM && w.durationSec && w.date)
    .filter((w) => isTimeTrial(w) || (w.rpe ?? 0) >= MAX_EFFORT_RPE)
    .map((w) => ({ date: w.date, distanceM: w.distanceM, timeSec: w.durationSec, via: isTimeTrial(w) ? 'timeTrial' : 'rpe', workout: w }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Most recent effort per distance (within 3%), so an old slow 2-mile can't
// drag the fit once a newer 2-mile exists.
function latestPerDistance(efforts) {
  const out = [];
  for (const e of [...efforts].reverse()) {
    if (!out.some((o) => Math.abs(o.distanceM / e.distanceM - 1) < 0.03)) out.push(e);
  }
  return out;
}

// Least-squares slope of log(time) on log(distance).
function fitSlope(points) {
  const xs = points.map((p) => Math.log(p.distanceM));
  const ys = points.map((p) => Math.log(p.timeSec));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den > 0 ? num / den : null;
}

// source 'fitted'  — two+ distances tested within TIGHT_PAIR_DAYS: trust it.
// source 'loose'   — two+ distances, but far enough apart that fitness changed
//                    in between; the point estimate splits the difference with
//                    the population value and the range spans both.
// source 'default' — one distance only; population value, wide band.
export function personalExponent(efforts) {
  const points = latestPerDistance(efforts);
  const ds = points.map((p) => p.distanceM);
  const spread = ds.length ? Math.max(...ds) / Math.min(...ds) : 1;
  if (points.length < 2 || spread < MIN_DISTANCE_SPREAD) {
    return { k: DEFAULT_EXPONENT, band: SINGLE_DISTANCE_BAND, source: 'default', raw: null, clamped: false, points, gapDays: 0 };
  }
  const raw = fitSlope(points);
  const [lo, hi] = EXPONENT_BOUNDS;
  const fitted = Math.min(hi, Math.max(lo, raw));
  const days = points.map((p) => dayNumber(p.date));
  const gapDays = Math.max(...days) - Math.min(...days);
  const common = { raw, clamped: fitted !== raw, points, gapDays };
  if (gapDays <= TIGHT_PAIR_DAYS) return { k: fitted, band: null, source: 'fitted', ...common };
  return {
    k: (fitted + DEFAULT_EXPONENT) / 2,
    band: [Math.min(fitted, DEFAULT_EXPONENT), Math.max(fitted, DEFAULT_EXPONENT)],
    source: 'loose',
    ...common,
  };
}

function riegel(anchor, k, distanceM) {
  return anchor.timeSec * Math.pow(distanceM / anchor.distanceM, k);
}

// The distance this runner covers in `timeSec` of all-out running.
function distanceForDuration(anchor, k, timeSec) {
  return anchor.distanceM * Math.pow(timeSec / anchor.timeSec, 1 / k);
}

// Daniels defines each zone by the race effort it corresponds to: R ~ current
// mile race pace, I ~ what you could race for ~11 minutes, T ~ for ~60 minutes,
// M at the marathon. E takes the I anchor, not T: Daniels defines E as 59-74%
// of VO2max, and the ~11-minute effort is the curve's best read of VO2max.
// What a speed-limited runner lacks is the FRACTION of VO2max they can hold for
// a long hard effort, and that deficit belongs in T and M, not in how slowly
// they jog. Anchoring E on T made an easy run he really ran at 10:23/mi
// look like a mistake. Each zone's VDOT is
// read off the PERSONAL curve at that effort — then Daniels' own fractions
// turn it into a pace — so a speed-limited runner gets slower T/E paces than
// their mile alone would assign, and vice versa.
//
// No zone is anchored further out than the longest distance actually tested
// (or further in than the shortest): a fitted exponent is evidence only over
// the span it was fitted on. A T pace extrapolated from a mile and a 2-mile to
// a 60-minute effort is a guess, so it reads the 2-mile instead and says so.
const ZONE_EFFORT = {
  R: { distanceM: MILE_M },
  I: { durationSec: 11 * 60 },
  T: { durationSec: 60 * 60 },
  M: { distanceM: MARATHON_M },
};

export function runProfile(workouts, { asOf, activityType = 'run' } = {}) {
  const all = maxEfforts(workouts, activityType);
  if (all.length === 0) return null;
  const anchor = all[all.length - 1];
  const windowStart = dayNumber(anchor.date) - FIT_WINDOW_DAYS;
  const recent = all.filter((e) => dayNumber(e.date) >= windowStart);
  const exponent = personalExponent(recent);
  const { k } = exponent;

  const predict = (distanceM) => {
    const timeSec = riegel(anchor, k, distanceM);
    const range = exponent.band
      ? exponent.band.map((kk) => riegel(anchor, kk, distanceM)).sort((a, b) => a - b)
      : null;
    return { timeSec, range };
  };
  const vdotAt = (distanceM) => vdotFromRace(distanceM, predict(distanceM).timeSec);

  const tested = exponent.points.map((p) => p.distanceM);
  const minTested = Math.min(...tested);
  const maxTested = Math.max(...tested);
  const zoneAnchors = {};
  for (const [zone, effort] of Object.entries(ZONE_EFFORT)) {
    const wanted = effort.distanceM ?? distanceForDuration(anchor, k, effort.durationSec);
    const distanceM = Math.min(maxTested, Math.max(minTested, wanted));
    zoneAnchors[zone] = { distanceM, vdot: vdotAt(distanceM), extrapolationCapped: Math.abs(distanceM / wanted - 1) > 0.03 };
  }
  zoneAnchors.E = zoneAnchors.I;
  const paces = {
    E: trainingPaces(zoneAnchors.E.vdot).E,
    M: trainingPaces(zoneAnchors.M.vdot).M,
    T: trainingPaces(zoneAnchors.T.vdot).T,
    I: trainingPaces(zoneAnchors.I.vdot).I,
    R: trainingPaces(zoneAnchors.R.vdot).R,
  };

  const today = asOf ?? new Date().toISOString().slice(0, 10);
  const ageDays = dayNumber(today) - dayNumber(anchor.date);
  return {
    anchor,
    efforts: all,
    exponent,
    slowdownPerDoubling: slowdownPerDoubling(k),
    predict,
    vdotAt,
    zoneAnchors,
    paces,
    ageDays,
    stale: ageDays > STALE_DAYS,
  };
}

// Translate a single effort to another distance through the runner's own
// exponent — used to grade a checkpoint run that wasn't at the goal distance.
export function translateEffort(distanceM, timeSec, targetDistanceM, k = DEFAULT_EXPONENT) {
  if (!distanceM || !timeSec || !targetDistanceM) return null;
  return timeSec * Math.pow(targetDistanceM / distanceM, k);
}
