// Grade-adjusted pace via Minetti's metabolic cost-of-transport model.
//
// Minetti AE, Moia C, Roi GS, Susta D, Ferretti G. "Energy cost of walking and
// running at extreme uphill and downhill slopes." J Appl Physiol 93 (2002):
// 1039-1046. Metabolic cost of running per unit distance as a 5th-order
// polynomial in gradient i (rise/run; 0.10 = +10%), in J/kg/m:
//   Cr(i) = 155.4 i^5 - 30.4 i^4 - 43.3 i^3 + 46.3 i^2 + 19.5 i + 3.6
// Valid -0.45 <= i <= 0.45. Flat (i=0) Cr = 3.6 J/kg/m. Verified: minimum cost
// is near i ≈ -0.20 at ~half flat cost, and +10% costs ~1.66x flat — Minetti's
// headline results. (see gap.test.js)

const COEF = [155.4, -30.4, -43.3, 46.3, 19.5, 3.6]; // i^5 .. i^0
export const FLAT_COST = 3.6;
export const GRADE_MIN = -0.45, GRADE_MAX = 0.45;

export function costOfRunning(grade) {
  const i = clampGrade(grade);
  const [a, b, c, d, e, f] = COEF;
  return ((((a * i + b) * i + c) * i + d) * i + e) * i + f; // Horner's method
}

function clampGrade(i) {
  if (i < GRADE_MIN) return GRADE_MIN;
  if (i > GRADE_MAX) return GRADE_MAX;
  return i;
}

// Speed multiplier for a grade: how much faster you could run on the flat for the
// same metabolic cost. >1 uphill, <1 downhill.
export function gapFactor(grade) {
  return costOfRunning(grade) / FLAT_COST;
}

// Equivalent flat pace for an actual graded pace (both seconds-per-meter). Equal
// metabolic power on the flat => v_flat = v * Cr(i)/Cr(0) => pace / gapFactor.
export function gradeAdjustedPace(actualSecPerM, grade) {
  if (actualSecPerM == null) return null;
  return actualSecPerM / gapFactor(grade);
}

// Net grade from run geometry.
export function gradeFrom(elevationChangeM, distanceM) {
  if (!distanceM) return 0;
  return elevationChangeM / distanceM;
}
