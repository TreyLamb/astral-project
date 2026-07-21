// Swimming metrics. Simpler than running but real: pace per 100, SWOLF, and
// Critical Swim Speed (CSS) with derived training zones.
//
// CSS (Ginn 1993; popularised by Swim Smooth): the fastest sustainable speed,
// estimated from two time-trials as (D2 − D1) / (T2 − T1). It plays the role VDOT
// does for running — anchor pace for zone-based swim training.

import { M_PER_YARD } from '../units';

// pace in seconds per 100 of the pool unit ('m' or 'yd')
export function per100(distanceM, timeSec, poolUnit = 'm') {
  if (!distanceM || !timeSec) return null;
  const unitM = poolUnit === 'yd' ? 100 * M_PER_YARD : 100;
  return timeSec / (distanceM / unitM);
}

// SWOLF = strokes for a length + seconds for that length (lower = more efficient).
export function swolf(strokesPerLength, secPerLength) {
  if (strokesPerLength == null || secPerLength == null) return null;
  return strokesPerLength + secPerLength;
}

// Critical Swim Speed from two trials (order-independent; the longer trial is D2).
export function css(d1, t1, d2, t2) {
  let [D1, T1, D2, T2] = d2 > d1 ? [d1, t1, d2, t2] : [d2, t2, d1, t1];
  if (!(D2 > D1) || !(T2 > T1)) return null;
  const speedMps = (D2 - D1) / (T2 - T1);
  if (!(speedMps > 0)) return null;
  return { speedMps, per100mSec: 100 / speedMps, per100ydSec: (100 * M_PER_YARD) / speedMps };
}

// Zones as fractions of CSS speed; pace scales inversely (slower = larger pace).
export const CSS_ZONES = [
  { id: 'rec', name: 'Recovery', frac: 0.85 },
  { id: 'aer', name: 'Aerobic (A2)', frac: 0.92 },
  { id: 'css', name: 'Threshold (CSS)', frac: 1.00 },
  { id: 'vo2', name: 'VO2 (A3)', frac: 1.05 },
  { id: 'spr', name: 'Sprint', frac: 1.11 },
];

export function cssZones(per100mSec) {
  if (!per100mSec) return [];
  return CSS_ZONES.map((z) => ({ ...z, per100mSec: per100mSec / z.frac }));
}
