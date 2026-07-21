// Heart-rate training zones via the Karvonen (heart-rate reserve) method.
//
// Karvonen MJ, Kentala E, Mustala O. "The effects of training on heart rate: a
// longitudinal study." Ann Med Exp Biol Fenn 35 (1957): 307-315.
//   HRR = HRmax - HRrest
//   target = HRR * intensity + HRrest
// Uses the athlete's real measured max & resting HR rather than 220-age, per the
// spec. Bands below are the conventional 5-zone %HRR split.

export function karvonen(hrMax, hrRest, intensity) {
  if (hrMax == null || hrRest == null) return null;
  return (hrMax - hrRest) * intensity + hrRest;
}

export const HR_ZONES = [
  { id: 'z1', name: 'Z1 Recovery', lo: 0.50, hi: 0.60 },
  { id: 'z2', name: 'Z2 Aerobic', lo: 0.60, hi: 0.70 },
  { id: 'z3', name: 'Z3 Tempo', lo: 0.70, hi: 0.80 },
  { id: 'z4', name: 'Z4 Threshold', lo: 0.80, hi: 0.90 },
  { id: 'z5', name: 'Z5 VO2max', lo: 0.90, hi: 1.00 },
];

export function hrZones(hrMax, hrRest) {
  if (hrMax == null || hrRest == null || hrMax <= hrRest) return [];
  return HR_ZONES.map((z) => ({
    ...z,
    loBpm: Math.round(karvonen(hrMax, hrRest, z.lo)),
    hiBpm: Math.round(karvonen(hrMax, hrRest, z.hi)),
  }));
}

export function zoneForHr(bpm, hrMax, hrRest) {
  if (hrMax == null || hrRest == null || hrMax <= hrRest) return null;
  const frac = (bpm - hrRest) / (hrMax - hrRest);
  if (frac >= 1) return HR_ZONES[HR_ZONES.length - 1];
  return HR_ZONES.find((z) => frac >= z.lo && frac < z.hi) || HR_ZONES[0];
}
