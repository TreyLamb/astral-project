// Auto-proposed correlations over the athlete's own logs — the "surface metrics I
// didn't ask for by name" mandate. Each definition computes over the workout list
// and returns { text } to show, or null when there isn't enough data to claim
// anything. Pearson r with a small-sample guard keeps it honest.
//
// Phase 6 expands this list; the engine (pearson + weekly bucketing) lives here so
// the dashboard and the smart-calendar can share it.

import { paceSecPerMeter } from './pace';

const DAY = 86400000;
const dayIndex = (iso) => Math.floor(new Date(iso + 'T00:00:00').getTime() / DAY);

export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 4) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

function strength(r) {
  const a = Math.abs(r);
  if (a < 0.2) return 'No clear';
  if (a < 0.4) return 'A weak';
  if (a < 0.6) return 'A moderate';
  return 'A strong';
}

const completedRuns = (ws) => ws
  .filter((w) => w.activityType === 'run' && w.status === 'completed' && w.distanceM && w.durationSec)
  .sort((a, b) => a.date.localeCompare(b.date));

// group completed workouts into ISO-week buckets keyed by Monday-ish week index
function weekly(ws) {
  const map = new Map();
  for (const w of ws) {
    if (w.status !== 'completed') continue;
    const wk = Math.floor(dayIndex(w.date) / 7);
    const cur = map.get(wk) || { runDist: 0, runTime: 0, liftCount: 0, count: 0 };
    if (w.activityType === 'run' && w.distanceM && w.durationSec) { cur.runDist += w.distanceM; cur.runTime += w.durationSec; }
    if (w.activityType === 'lift') cur.liftCount += 1;
    cur.count += 1;
    map.set(wk, cur);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([wk, v]) => ({ wk, ...v }));
}

export const CORRELATIONS = [
  {
    id: 'rest-vs-pace',
    name: 'Rest days → pace',
    compute(ws) {
      const runs = completedRuns(ws);
      const all = ws.filter((w) => w.status === 'completed').sort((a, b) => a.date.localeCompare(b.date));
      const xs = [], ys = [];
      for (const run of runs) {
        const prior = all.filter((w) => w.date < run.date).pop();
        if (!prior) continue;
        xs.push(dayIndex(run.date) - dayIndex(prior.date));
        ys.push(paceSecPerMeter(run.distanceM, run.durationSec));
      }
      const r = pearson(xs, ys);
      if (r == null) return null;
      const dir = r < 0 ? 'more rest tends to mean faster runs' : 'more rest tends to mean slower runs';
      return { r, text: `${strength(r)} link — ${dir} (r=${r.toFixed(2)}).` };
    },
  },
  {
    id: 'volume-vs-pace',
    name: 'Weekly volume → pace',
    compute(ws) {
      const wk = weekly(ws).filter((w) => w.runDist && w.runTime);
      const xs = wk.map((w) => w.runDist);
      const ys = wk.map((w) => w.runTime / w.runDist); // avg pace sec/m
      const r = pearson(xs, ys);
      if (r == null) return null;
      const dir = r < 0 ? 'higher-mileage weeks run faster on average' : 'higher-mileage weeks run slower on average';
      return { r, text: `${strength(r)} link — ${dir} (r=${r.toFixed(2)}).` };
    },
  },
  {
    id: 'lift-vs-run',
    name: 'Lifting → run pace',
    compute(ws) {
      const wk = weekly(ws).filter((w) => w.runDist && w.runTime);
      const xs = wk.map((w) => w.liftCount);
      const ys = wk.map((w) => w.runTime / w.runDist);
      if (xs.every((v) => v === 0)) return null;
      const r = pearson(xs, ys);
      if (r == null) return null;
      const dir = r < 0 ? 'weeks with more lifting also run faster' : 'weeks with more lifting run slower';
      return { r, text: `${strength(r)} link — ${dir} (r=${r.toFixed(2)}).` };
    },
  },
  {
    id: 'streak',
    name: 'Consistency streak',
    compute(ws) {
      const weeks = new Set(ws.filter((w) => w.status === 'completed').map((w) => Math.floor(dayIndex(w.date) / 7)));
      if (!weeks.size) return null;
      const thisWeek = Math.floor(dayIndex(new Date().toISOString().slice(0, 10)) / 7);
      let streak = 0;
      for (let wk = thisWeek; weeks.has(wk); wk--) streak++;
      if (streak < 2) return null;
      return { streak, text: `${streak} weeks in a row with at least one session — keep it going.` };
    },
  },
];
