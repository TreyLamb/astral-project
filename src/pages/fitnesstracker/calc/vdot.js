// Daniels VDOT, training paces, and equivalent race performances.
//
// Core equations: Daniels & Gilbert, "Oxygen Power: Performance Tables for
// Distance Runners" (1979), as restated in Jack Daniels, "Daniels' Running
// Formula" (3rd ed.).
//   VO2 demand of a velocity v (m/min):
//     VO2(v) = -4.60 + 0.182258 v + 0.000104 v^2            (mL/kg/min)
//   fraction of VO2max sustainable for a race lasting t (min):
//     pct(t) = 0.8 + 0.1894393 e^(-0.012778 t) + 0.2989558 e^(-0.1932605 t)
//   VDOT = VO2(v_race) / pct(t_race)
//
// Verified: a 20:00 5K (v = 250 m/min, t = 20) gives VDOT ≈ 49.8 — "≈ 50", the
// reference value named in the spec. (see vdot.test.js)

const A = -4.60, B = 0.182258, C = 0.000104;

export function vo2AtVelocity(vMetersPerMin) {
  return A + B * vMetersPerMin + C * vMetersPerMin * vMetersPerMin;
}

// invert VO2(v) for v > 0 (positive root of the quadratic C v^2 + B v + (A-vo2)=0)
export function velocityAtVo2(vo2) {
  const disc = B * B - 4 * C * (A - vo2);
  if (disc < 0) return null;
  return (-B + Math.sqrt(disc)) / (2 * C);
}

export function pctVo2max(tMin) {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);
}

export function vdotFromRace(distanceM, timeSec) {
  if (!distanceM || !timeSec) return null;
  const tMin = timeSec / 60;
  const vMetersPerMin = distanceM / tMin;
  return vo2AtVelocity(vMetersPerMin) / pctVo2max(tMin);
}

// Equivalent race time at another distance for a given VDOT — Daniels' own race-
// prediction method: find t so that VO2(distance/t)/pct(t) == VDOT. Implied VDOT
// is monotonic decreasing in t, so bisect. Model-based alternative to Riegel.
export function equivalentRaceTime(vdot, distanceM) {
  if (!vdot || !distanceM) return null;
  let lo = 1 / 60, hi = 600; // minutes: ~1s .. 10h
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const impliedVdot = vo2AtVelocity(distanceM / mid) / pctVo2max(mid);
    if (impliedVdot > vdot) lo = mid; else hi = mid; // too-fast time -> raise floor
  }
  return ((lo + hi) / 2) * 60; // seconds
}

export function equivalentRaceTable(vdot, distances) {
  return distances.map((d) => ({ ...d, timeSec: equivalentRaceTime(vdot, d.m) }));
}

// Training-pace intensities as fractions of VDOT (of VO2max), from Daniels'
// published zone definitions (Daniels' Running Formula):
//   E 59-74% | M 80-84% | T 86-88% | I 97-100% | R >100% (economy/anaerobic).
// The single-point fractions below were chosen to REPRODUCE Daniels' published
// pace tables: at VDOT 50 they yield  T 6:51/mi · M 7:06/mi · I 6:10/mi ·
// E 8:14-9:04/mi · R 5:40/mi — matching his book to a few sec/mi (see vdot.test.js).
// R sits above VO2max, so its "fraction" is an extrapolation of the VO2 curve
// tuned to his R column, not a literal %VO2max — the least physiological of the set.
export const PACE_FRACTIONS = { E: [0.62, 0.70], M: 0.84, T: 0.88, I: 1.0, R: 1.11 };

function paceSecPerMeterAtFraction(vdot, fraction) {
  const v = velocityAtVo2(vdot * fraction); // m/min
  if (!v || v <= 0) return null;
  return 60 / v; // seconds per meter
}

// Training paces as seconds-per-meter. E is a [slow, fast] range.
export function trainingPaces(vdot) {
  if (!vdot) return null;
  return {
    E: PACE_FRACTIONS.E.map((f) => paceSecPerMeterAtFraction(vdot, f)),
    M: paceSecPerMeterAtFraction(vdot, PACE_FRACTIONS.M),
    T: paceSecPerMeterAtFraction(vdot, PACE_FRACTIONS.T),
    I: paceSecPerMeterAtFraction(vdot, PACE_FRACTIONS.I),
    R: paceSecPerMeterAtFraction(vdot, PACE_FRACTIONS.R),
  };
}

export const PACE_ZONE_LABELS = {
  E: 'Easy', M: 'Marathon', T: 'Threshold', I: 'Interval', R: 'Repetition',
};
