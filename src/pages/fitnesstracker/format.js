// Presentation helpers (UI-facing formatting). Kept out of calc/ (pure math) and
// out of units.js (pure conversion) so the display strings live in one place.
import { secToClock, metersToDistance } from './units';
import { paceIn, PACE_UNITS } from './calc/pace';

// pace in seconds-per-meter -> "6:26 /mi"
export function fmtPace(secPerM, unit = 'mi') {
  const s = paceIn(secPerM, unit);
  if (s == null || !isFinite(s) || s <= 0) return '—';
  return `${secToClock(Math.round(s))} ${PACE_UNITS[unit]?.label || ''}`.trim();
}

export function fmtDist(m, unit = 'mi', digits) {
  const d = metersToDistance(m, unit);
  if (d == null) return '—';
  const dg = digits ?? (unit === 'm' || unit === 'yd' ? 0 : 2);
  return `${d.toFixed(dg)} ${unit}`;
}

export function fmtDur(sec) {
  return secToClock(sec) || '—';
}

// default pace display unit for a distance preference
export function paceUnitFor(distanceUnit) {
  return distanceUnit === 'km' || distanceUnit === 'm' ? 'km' : 'mi';
}
