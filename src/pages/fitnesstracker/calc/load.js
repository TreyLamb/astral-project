// Training-load & mileage rollups + the acute:chronic workload ratio (ACWR).
//
// Session load uses session-RPE (Foster CA et al., "A new approach to monitoring
// exercise training," J Strength Cond Res 2001): load = duration(min) * RPE (AU).
// When RPE is absent we fall back to duration, then distance, so a GPS-only run
// still contributes something.
//
// ACWR (Hulin BT, Gabbett TJ et al., Br J Sports Med 2016): short-term "acute"
// load vs a longer "chronic" rolling load — an early injury-risk signal when it
// spikes. This is the correlated metric the spec asked to surface unprompted.
//   Rolling: acute = sum(last 7d); chronic = sum(last 28d)/4; ratio = acute/chronic
//   EWMA (Williams S et al., Br J Sports Med 2017 — more sensitive):
//     EWMA_t = load_t*λ + (1-λ)*EWMA_(t-1),  λ = 2/(N+1)
//     acute N=7 (λ=0.25), chronic N=28 (λ≈0.069); ratio = EWMA_acute/EWMA_chronic

const DAY = 86400000;
function dayIndex(iso) { return Math.floor(new Date(iso + 'T00:00:00').getTime() / DAY); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

export function sessionLoad(w) {
  if (!w || w.status !== 'completed') return 0;
  const min = (w.durationSec || 0) / 60;
  if (w.rpe && min) return min * w.rpe;        // sRPE (AU)
  if (min) return min;                          // duration-only fallback
  if (w.distanceM) return w.distanceM / 1000;   // distance-only fallback (km)
  return 0;
}

function dailyTotals(workouts) {
  const m = new Map();
  for (const w of workouts) {
    const l = sessionLoad(w);
    if (!l) continue;
    const d = dayIndex(w.date);
    m.set(d, (m.get(d) || 0) + l);
  }
  return m;
}

export function acwrRolling(workouts, asOfISO = todayISO()) {
  const totals = dailyTotals(workouts);
  const today = dayIndex(asOfISO);
  let acute = 0, chronic = 0;
  for (let d = today - 27; d <= today; d++) {
    const l = totals.get(d) || 0;
    chronic += l;
    if (d > today - 7) acute += l;
  }
  chronic = chronic / 4; // put the 28-day total on the same 7-day scale
  return { acute, chronic, ratio: chronic > 0 ? acute / chronic : null };
}

export function acwrEwma(workouts, asOfISO = todayISO()) {
  const totals = dailyTotals(workouts);
  if (!totals.size) return { acute: 0, chronic: 0, ratio: null };
  const today = dayIndex(asOfISO);
  const start = Math.min(...totals.keys());
  const lambdaA = 2 / (7 + 1), lambdaC = 2 / (28 + 1);
  let ewmaA = 0, ewmaC = 0;
  for (let d = start; d <= today; d++) {
    const l = totals.get(d) || 0;
    ewmaA = l * lambdaA + (1 - lambdaA) * ewmaA;
    ewmaC = l * lambdaC + (1 - lambdaC) * ewmaC;
  }
  return { acute: ewmaA, chronic: ewmaC, ratio: ewmaC > 0 ? ewmaA / ewmaC : null };
}

export function acwrStatus(ratio) {
  if (ratio == null) return { label: '—', level: 'none' };
  if (ratio < 0.8) return { label: 'Detraining', level: 'low' };
  if (ratio <= 1.3) return { label: 'Sweet spot', level: 'good' };
  if (ratio <= 1.5) return { label: 'Caution', level: 'warn' };
  return { label: 'High risk', level: 'danger' };
}

export function distanceInRange(workouts, startISO, endISO, activityType) {
  const s = dayIndex(startISO), e = dayIndex(endISO);
  let m = 0;
  for (const w of workouts) {
    if (activityType && w.activityType !== activityType) continue;
    if (w.status !== 'completed' || !w.distanceM) continue;
    const d = dayIndex(w.date);
    if (d >= s && d <= e) m += w.distanceM;
  }
  return m;
}

// weekly distance buckets (meters) for the last N weeks ending asOf.
export function weeklyDistance(workouts, weeks = 12, asOfISO = todayISO(), activityType) {
  const today = dayIndex(asOfISO);
  const out = [];
  for (let wk = weeks - 1; wk >= 0; wk--) {
    const end = today - wk * 7;
    const start = end - 6;
    let m = 0;
    for (const w of workouts) {
      if (activityType && w.activityType !== activityType) continue;
      if (w.status !== 'completed' || !w.distanceM) continue;
      const d = dayIndex(w.date);
      if (d >= start && d <= end) m += w.distanceM;
    }
    out.push({ weekEndDay: end, weekEndISO: new Date(end * DAY).toISOString().slice(0, 10), distanceM: m });
  }
  return out;
}

// total distance + session count grouped by activity type over a range.
export function rollupByActivity(workouts, startISO, endISO) {
  const s = dayIndex(startISO), e = dayIndex(endISO);
  const map = new Map();
  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    const d = dayIndex(w.date);
    if (d < s || d > e) continue;
    const cur = map.get(w.activityType) || { activityType: w.activityType, distanceM: 0, durationSec: 0, count: 0 };
    cur.distanceM += w.distanceM || 0;
    cur.durationSec += w.durationSec || 0;
    cur.count += 1;
    map.set(w.activityType, cur);
  }
  return [...map.values()];
}
