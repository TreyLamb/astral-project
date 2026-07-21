// Universal pace / time / distance solver + splits + structured-workout parser.
//
// Everything here works in canonical base units: distance in METERS, time in
// SECONDS, speed in m/s. Pace is expressed as seconds-per-meter internally and
// converted to per-km / per-mile / per-100 at the edges. No unit math leaks into
// the UI — components pass meters+seconds and format with the helpers below.

import { M_PER_MILE, M_PER_KM, M_PER_YARD } from '../units';

// Standard distances a runner actually solves for. `m` is canonical meters.
// Track distances are included per the spec ("not just road-race distances") so
// a 500m split can be turned into a mile pace.
export const TRACK_DISTANCES = [
  { id: '200m', name: '200 m', m: 200 },
  { id: '400m', name: '400 m', m: 400 },
  { id: '500m', name: '500 m', m: 500 },
  { id: '600m', name: '600 m', m: 600 },
  { id: '800m', name: '800 m', m: 800 },
  { id: '1000m', name: '1000 m', m: 1000 },
  { id: '1200m', name: '1200 m', m: 1200 },
  { id: '1500m', name: '1500 m', m: 1500 },
  { id: '1600m', name: '1600 m', m: 1600 },
  { id: '3000m', name: '3000 m', m: 3000 },
  { id: '3200m', name: '3200 m', m: 3200 },
];

export const ROAD_DISTANCES = [
  { id: '1mi', name: '1 mile', m: M_PER_MILE },
  { id: '2mi', name: '2 mile', m: 2 * M_PER_MILE },
  { id: '5k', name: '5K', m: 5000 },
  { id: '8k', name: '8K', m: 8000 },
  { id: '10k', name: '10K', m: 10000 },
  { id: '15k', name: '15K', m: 15000 },
  { id: '10mi', name: '10 mile', m: 10 * M_PER_MILE },
  { id: '20k', name: '20K', m: 20000 },
  { id: 'half', name: 'Half marathon', m: 21097.5 }, // 21.0975 km, official
  { id: '25k', name: '25K', m: 25000 },
  { id: '30k', name: '30K', m: 30000 },
  { id: 'marathon', name: 'Marathon', m: 42195 },    // 42.195 km, official
  { id: '50k', name: '50K', m: 50000 },
];

export const ALL_DISTANCES = [...TRACK_DISTANCES, ...ROAD_DISTANCES];

export function distancePreset(id) {
  return ALL_DISTANCES.find((d) => d.id === id) || null;
}

// ---- pace unit conversion (seconds per meter is canonical) ----
export const PACE_UNITS = {
  mi: { label: '/mi', per: M_PER_MILE },
  km: { label: '/km', per: M_PER_KM },
  '100m': { label: '/100m', per: 100 },
  '100yd': { label: '/100yd', per: 100 * M_PER_YARD },
  '400m': { label: '/400m', per: 400 },
};

export function paceSecPerMeter(distanceM, timeSec) {
  if (!distanceM || distanceM <= 0 || timeSec == null || timeSec <= 0) return null;
  return timeSec / distanceM;
}

// seconds-per-meter -> seconds per whatever unit ("mi","km","100m","400m",...)
export function paceIn(secPerM, unit) {
  const u = PACE_UNITS[unit];
  if (secPerM == null || !u) return null;
  return secPerM * u.per;
}

export function speedKmh(distanceM, timeSec) {
  if (!distanceM || !timeSec) return null;
  return (distanceM / 1000) / (timeSec / 3600);
}

// The core solver: give any TWO of { distanceM, timeSec, secPerM } and it returns
// all three filled in. `paceUnit` lets callers hand in pace as per-mile/km/etc.
export function solve({ distanceM = null, timeSec = null, secPerM = null }) {
  const known = [distanceM, timeSec, secPerM].filter((v) => v != null && v !== '' && !Number.isNaN(v)).length;
  if (known < 2) return { distanceM, timeSec, secPerM, complete: false };

  let d = num(distanceM), t = num(timeSec), p = num(secPerM);
  if (d != null && t != null) p = paceSecPerMeter(d, t);
  else if (d != null && p != null) t = d * p;
  else if (t != null && p != null && p > 0) d = t / p;

  return { distanceM: d, timeSec: t, secPerM: p, complete: d != null && t != null && p != null };
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// ---- even splits ----
// Assuming constant pace, break a run into per-unit segments (mi or km). The last
// segment carries the remainder distance so the splits sum exactly to the total.
export function evenSplits(distanceM, timeSec, unit = 'mi') {
  const per = unit === 'km' ? M_PER_KM : M_PER_MILE;
  const secPerM = paceSecPerMeter(distanceM, timeSec);
  if (secPerM == null) return [];
  const out = [];
  let covered = 0;
  let i = 0;
  while (covered < distanceM - 1e-6) {
    const segM = Math.min(per, distanceM - covered);
    out.push({
      index: ++i,
      distanceM: segM,
      full: segM >= per - 1e-6,
      timeSec: segM * secPerM,
      cumulativeM: covered + segM,
      cumulativeSec: (covered + segM) * secPerM,
    });
    covered += segM;
  }
  return out;
}

// ---- structured-workout parser ----
// Parses things a runner types: "6x800m w/ 400m jog", "4 x 1200m", "10x100 @ 1:30",
// "3x(1mi, 2min rest)". Returns a normalised rep set; unknown chunks are ignored
// rather than throwing, so the parser degrades to "just the reps" gracefully.
const DIST_TOKEN = /(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|k|m|yd|yard|yards)\b/i;

export function parseStructuredWorkout(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();

  // reps: "6x800", "6 x 800m", "6×800"
  const rep = s.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|k|m|yd)?/i);
  if (!rep) return null;
  const reps = parseInt(rep[1], 10);
  const workM = toMeters(parseFloat(rep[2]), rep[3] || 'm');

  // recovery: "w/ 400m jog", "with 90s rest", "@ 1:30", "400m jog recovery"
  let recovery = null;
  const recDist = s.replace(rep[0], '').match(/(\d+(?:\.\d+)?)\s*(mi|mile|km|k|m|yd)\s*(jog|walk|easy|recovery|rec)?/i);
  const recTime = s.match(/(?:@|w\/|with|rest|recovery)\s*(\d+(?::\d+)?)\s*(s|sec|min|m)?\b/i);
  if (recDist) {
    recovery = { kind: 'distance', distanceM: toMeters(parseFloat(recDist[1]), recDist[2]), style: recDist[3] || 'jog' };
  } else if (recTime) {
    recovery = { kind: 'time', restSec: parseRestClock(recTime[1], recTime[2]) };
  }

  return {
    reps,
    work: { distanceM: workM },
    recovery,
    totalWorkM: reps * workM,
    label: `${reps}×${rep[2]}${rep[3] || 'm'}${recovery ? recoveryLabel(recovery) : ''}`,
  };
}

function recoveryLabel(r) {
  if (r.kind === 'distance') return ` w/ ${Math.round(r.distanceM)}m ${r.style}`;
  const m = Math.floor(r.restSec / 60), s = r.restSec % 60;
  return ` @ ${m}:${String(s).padStart(2, '0')} rest`;
}

function parseRestClock(str, unit) {
  if (str.includes(':')) {
    const [m, s] = str.split(':').map(Number);
    return m * 60 + s;
  }
  const n = Number(str);
  return unit && unit.startsWith('m') && unit !== 's' && unit !== 'sec' ? n * 60 : n;
}

export function toMeters(value, unit) {
  const u = (unit || 'm').toLowerCase();
  if (u === 'mi' || u === 'mile' || u === 'miles') return value * M_PER_MILE;
  if (u === 'km' || u === 'k') return value * M_PER_KM;
  if (u === 'yd' || u === 'yard' || u === 'yards') return value * M_PER_YARD;
  return value; // meters
}

export { DIST_TOKEN };
