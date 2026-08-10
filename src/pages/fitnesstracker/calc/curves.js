// Per-domain forecast curve shapes (guidelinesForecast.md §4: "curve shape
// should not default to a straight line"). Each fn takes a fraction-of-elapsed-
// time array (0..1, computed from real checkpoint DATES by calc/checkpoints.js
// — not week-index, since cadence can be irregular/rest-shifted) and returns
// the target value at each fraction. Direction-agnostic: works whether
// target > baseline (run VDOT, lift 1RM, weight gain) or target < baseline
// (swim pace, weight loss) — the interpolation is symmetric either way.

// Cardio: front-loaded / diminishing-returns. No individual formula predicts
// the SHAPE of aerobic adaptation (only baseline/prediction — Riegel/VDOT are
// already used for that elsewhere) — gamma<1 is a documented modeling choice,
// not a cited law. Endpoints are still exact: frac=0 -> baseline, frac=1 -> target.
export function cardioCurve(baselineValue, targetValue, fracs, gamma = 0.6) {
  return fracs.map((f) => baselineValue + (targetValue - baselineValue) * Math.pow(clamp01(f), gamma));
}

// Novice strength: flat-linear-per-session (Starting-Strength-style) until an
// abrupt plateau at plateauFrac of the timeline, then holds at the target rate
// reached by that point rather than continuing to climb.
export function strengthCurve(baselineValue, targetValue, fracs, plateauFrac = 0.7) {
  return fracs.map((f) => {
    const ff = Math.min(clamp01(f), plateauFrac) / plateauFrac;
    return baselineValue + (targetValue - baselineValue) * ff;
  });
}

// Body composition: energy balance is fairly linear over short/medium horizons
// (the metabolic-adaptation nonlinearity Wishnofsky's rule misses only matters
// at long horizons — see calc/bodyComposition.js). Never capped/softened here —
// computed exactly even if it implies an unsafe rate; calc/realism.js flags
// that, it never changes this curve's output (guidelinesForecast.md §7/§11.5).
export function bodyCompCurve(baselineValue, targetValue, fracs) {
  return fracs.map((f) => baselineValue + (targetValue - baselineValue) * clamp01(f));
}

export function genericCurve(baselineValue, targetValue, fracs) {
  return fracs.map((f) => baselineValue + (targetValue - baselineValue) * clamp01(f));
}

function clamp01(f) {
  return Math.max(0, Math.min(1, f));
}

export function curveFor(kind, baselineValue, targetValue, fracs) {
  switch (kind) {
    case 'run':
    case 'swim':
      return cardioCurve(baselineValue, targetValue, fracs);
    case 'lift':
      return strengthCurve(baselineValue, targetValue, fracs);
    case 'weight':
      return bodyCompCurve(baselineValue, targetValue, fracs);
    default:
      return genericCurve(baselineValue, targetValue, fracs);
  }
}
