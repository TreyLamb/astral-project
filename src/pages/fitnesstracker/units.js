// Unit conversion for FitnessTracker. Internal storage is canonical (meters,
// kilograms, seconds); everything here converts to/from the user's display unit.
//
// Constants are EXACT by international definition — not approximations
// (per FT_ProjectDoc.md's "don't approximate constants from memory"):
//   1 international mile  = 1609.344 m   (NIST HB 44 / int'l yard-&-pound agreement, 1959)
//   1 international yard  = 0.9144 m      (exactly, by the same 1959 agreement)
//   1 avoirdupois pound   = 0.45359237 kg (exactly, 1959)

export const M_PER_MILE = 1609.344;
export const M_PER_KM = 1000;
export const M_PER_YARD = 0.9144;
export const KG_PER_LB = 0.45359237;

// ---- distance ----
export function metersToDistance(m, unit) {
  if (m == null) return null;
  switch (unit) {
    case 'mi': return m / M_PER_MILE;
    case 'km': return m / M_PER_KM;
    case 'yd': return m / M_PER_YARD;
    case 'm':  return m;
    default:   return m / M_PER_MILE;
  }
}

export function distanceToMeters(val, unit) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  switch (unit) {
    case 'mi': return n * M_PER_MILE;
    case 'km': return n * M_PER_KM;
    case 'yd': return n * M_PER_YARD;
    case 'm':  return n;
    default:   return n * M_PER_MILE;
  }
}

export function formatDistance(m, unit, digits = 2) {
  const d = metersToDistance(m, unit);
  if (d == null) return '';
  return `${d.toFixed(digits)} ${unit}`;
}

// ---- weight ----
export function kgToWeight(kg, unit) {
  if (kg == null) return null;
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function weightToKg(val, unit) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  return unit === 'kg' ? n : n * KG_PER_LB;
}

// ---- duration ----
// Seconds -> "M:SS" (or "H:MM:SS" past an hour).
export function secToClock(sec) {
  if (sec == null || sec === '') return '';
  sec = Math.round(Number(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// "38:20" / "1:05:30" -> seconds. A bare number is read as MINUTES ("45" -> 45min),
// which is the natural thing to type for a duration-only entry.
export function clockToSec(str) {
  if (str == null || str === '') return null;
  const s = String(str).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s) * 60);
  const parts = s.split(':').map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export const DISTANCE_UNIT_LABEL = { mi: 'mi', km: 'km', yd: 'yd', m: 'm' };

// ---- elevation ----
// Stored canonical in meters; displayed in feet for US (mile) preference, meters
// for metric. 1 international foot = 0.3048 m exactly (1959 agreement).
export const M_PER_FOOT = 0.3048;
const elevIsMetric = (distanceUnit) => distanceUnit === 'km' || distanceUnit === 'm';

export function metersToElev(m, distanceUnit) {
  if (m == null) return null;
  return elevIsMetric(distanceUnit) ? m : m / M_PER_FOOT;
}
export function elevToMeters(val, distanceUnit) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  return elevIsMetric(distanceUnit) ? n : n * M_PER_FOOT;
}
export function elevUnitLabel(distanceUnit) {
  return elevIsMetric(distanceUnit) ? 'm' : 'ft';
}

// ---- height ----
// Stored canonical in cm; displayed in cm or inches derived from
// settings.units.weight (kg = metric, lb = imperial) — same derived-not-a-
// separate-preference pattern as elevation above. 1 international inch =
// 2.54 cm exactly (1959 agreement).
export const CM_PER_INCH = 2.54;
const heightIsMetric = (weightUnit) => weightUnit === 'kg';

export function cmToHeight(cm, weightUnit) {
  if (cm == null) return null;
  return heightIsMetric(weightUnit) ? cm : cm / CM_PER_INCH;
}
export function heightToCm(val, weightUnit) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  return heightIsMetric(weightUnit) ? n : n * CM_PER_INCH;
}
export function heightUnitLabel(weightUnit) {
  return heightIsMetric(weightUnit) ? 'cm' : 'in';
}
