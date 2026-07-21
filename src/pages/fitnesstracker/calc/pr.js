// Automatic PR tracking. Buckets completed runs by standard race distance and
// keeps the fastest time per bucket; odd distances get best-effort tracking by
// best average pace. Derived entirely from logged workouts — no external data.

import { paceSecPerMeter } from './pace';

export const PR_BUCKETS = [
  { id: '1mi', name: '1 mile', m: 1609.344 },
  { id: '2mi', name: '2 mile', m: 3218.688 },
  { id: '5k', name: '5K', m: 5000 },
  { id: '10k', name: '10K', m: 10000 },
  { id: '15k', name: '15K', m: 15000 },
  { id: '10mi', name: '10 mile', m: 16093.44 },
  { id: 'half', name: 'Half marathon', m: 21097.5 },
  { id: 'marathon', name: 'Marathon', m: 42195 },
];

// A run counts for a bucket if within tol (default ±1.5%) of the exact distance.
export function matchBucket(distanceM, tol = 0.015) {
  let best = null;
  for (const b of PR_BUCKETS) {
    const diff = Math.abs(distanceM - b.m) / b.m;
    if (diff <= tol && (!best || diff < best.diff)) best = { bucket: b, diff };
  }
  return best ? best.bucket : null;
}

export function computePRs(workouts, activityType = 'run') {
  const prs = {};
  for (const w of workouts) {
    if (w.activityType !== activityType || w.status !== 'completed') continue;
    if (!w.distanceM || !w.durationSec) continue;
    const b = matchBucket(w.distanceM);
    if (!b) continue;
    if (!prs[b.id] || w.durationSec < prs[b.id].timeSec) {
      prs[b.id] = { bucketId: b.id, name: b.name, timeSec: w.durationSec, distanceM: w.distanceM, date: w.date, workoutId: w.id };
    }
  }
  return PR_BUCKETS.map((b) => ({ bucket: b, pr: prs[b.id] || null }));
}

// best-effort: fastest average pace across all runs (covers odd distances).
export function bestPace(workouts, activityType = 'run') {
  let best = null;
  for (const w of workouts) {
    if (w.activityType !== activityType || w.status !== 'completed') continue;
    if (!w.distanceM || !w.durationSec) continue;
    const p = paceSecPerMeter(w.distanceM, w.durationSec);
    if (p && (!best || p < best.secPerM)) best = { secPerM: p, date: w.date, workoutId: w.id, distanceM: w.distanceM };
  }
  return best;
}

// longest single run (distance PR).
export function longestRun(workouts, activityType = 'run') {
  let best = null;
  for (const w of workouts) {
    if (w.activityType !== activityType || w.status !== 'completed') continue;
    if (!w.distanceM) continue;
    if (!best || w.distanceM > best.distanceM) best = { distanceM: w.distanceM, date: w.date, workoutId: w.id };
  }
  return best;
}
