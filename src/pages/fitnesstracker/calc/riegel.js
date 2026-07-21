// Race-equivalency prediction via Riegel's endurance model.
//
// Peter Riegel, "Athletic Records and Human Endurance," American Scientist 69
// (1981): 285-290. Predicts the time for a second distance from a known
// performance:  T2 = T1 * (D2 / D1) ^ 1.06
// The exponent 1.06 is Riegel's "fatigue factor" fitted across running events;
// it is the value the spec calls out and the one used by mainstream calculators.
// Accurate roughly over ~1500 m to the marathon; it drifts for very short
// sprints and ultras (the model has no physiology, only a power law).

export const RIEGEL_EXPONENT = 1.06;

export function riegelPredict(knownDistanceM, knownTimeSec, targetDistanceM, exponent = RIEGEL_EXPONENT) {
  if (!knownDistanceM || !knownTimeSec || !targetDistanceM) return null;
  return knownTimeSec * Math.pow(targetDistanceM / knownDistanceM, exponent);
}

// Equivalent performances across a list of distances (for a prediction table).
export function riegelTable(knownDistanceM, knownTimeSec, distances, exponent = RIEGEL_EXPONENT) {
  return distances.map((d) => ({
    ...d,
    timeSec: riegelPredict(knownDistanceM, knownTimeSec, d.m, exponent),
  }));
}
