// Checkpoint orchestration: cadence resolution, rest-day shifting, curve
// assembly, realism scoring, and the recompute-from-here-forward engine
// (guidelinesForecast.md §5/§6). Parallel in role to calc/planning.js (which
// handles ordinary drag/cascade rescheduling) — this file is specifically
// about a GOAL's checkpoint trajectory.
import { addDaysISO } from './planning';
import { weekdayOffsets } from './goals';
import { curveFor } from './curves';
import { realismScore, realismScoreLift } from './realism';
import { goalDeadline } from '../fitnessConfig';
import { vdotFromRace, equivalentRaceTime } from './vdot';
import { metersToDistance, kgToWeight, weightToKg, secToClock, clockToSec, M_PER_MILE, M_PER_KM } from '../units';

function round2(n) { return n == null ? null : Math.round(n * 100) / 100; }

export function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00').getTime();
  const b = new Date(bISO + 'T00:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

// 0..1 elapsed-time fraction of dateISO between startISO and endISO — the
// input every curve function takes, computed from real dates (not a week
// index) so irregular/rest-shifted cadences still produce a correct shape.
export function fracOf(startISO, endISO, dateISO) {
  const span = daysBetween(startISO, endISO);
  if (span <= 0) return 1;
  return daysBetween(startISO, dateISO) / span;
}

// The on-pace target for ANY date tied to a goal, not just a checkpoint date
// — every task-frequency training day still shows a real number, it just
// isn't a graded/loggable/realism-scored checkpoint the way a cadence day is.
// Without this, only the (often much sparser) checkpoint-cadence days carried
// a visible target and every other generated day looked "empty."
export function interpolatedTarget(goal, dateISO) {
  const start = goal.startDate;
  const deadline = goalDeadline(goal);
  if (!start || !deadline || goal.baselineValue == null || goal.targetValue == null) return null;
  return curveFor(goal.kind, goal.baselineValue, goal.targetValue, [fracOf(start, deadline, dateISO)])[0];
}

// Multi-month/year goals default to a coarser cadence rather than daily
// checkpoint fatigue (guidelinesForecast.md §5) — still user-adjustable via
// goal.cadence, this is only the 'auto' suggestion.
export function suggestCadence(durationDays) {
  if (durationDays <= 21) return { type: 'everyNDays', n: 3 };
  if (durationDays <= 90) return { type: 'weekly' };
  return { type: 'monthly' };
}

// All dates a cadence setting produces between start and deadline, ALWAYS
// including both endpoints (§5: "any goal shorter than one cadence interval
// still gets a start-point and end-point checkpoint at minimum").
export function resolveCadenceDates(startISO, deadlineISO, cadence) {
  const dates = new Set([startISO, deadlineISO]);
  const resolved = (!cadence || cadence.type === 'auto') ? suggestCadence(daysBetween(startISO, deadlineISO)) : cadence;
  const type = resolved?.type;
  if (type === 'daily') {
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, 1)) dates.add(d);
  } else if (type === 'everyNDays') {
    const n = Math.max(1, Math.round(Number(resolved.n) || 3));
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, n)) dates.add(d);
  } else if (type === 'weekly') {
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, 7)) dates.add(d);
  } else if (type === 'monthly') {
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, 30)) dates.add(d);
  } else if (type === 'weekdays' && Array.isArray(resolved.days) && resolved.days.length) {
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, 1)) {
      if (resolved.days.includes(new Date(d + 'T00:00:00').getDay())) dates.add(d);
    }
  } else {
    // 'milestone' (✂️ deferred — see plan's out-of-scope list) or anything
    // unrecognized falls back to weekly rather than producing zero checkpoints.
    for (let d = startISO; d <= deadlineISO; d = addDaysISO(d, 7)) dates.add(d);
  }
  return [...dates].sort();
}

// Domain-mandated rest/cadence constraints (§5) — minimal, citable per domain,
// not a full training-calendar model: running needs ~48h between hard efforts,
// lifting follows the Starting-Strength nonconsecutive-day rule, swimming gets
// a lighter 1-day gap, weigh-ins/generic goals have no physiological constraint.
const REST_DAY_RULES = { run: 2, swim: 1, lift: 1, weight: 0, generic: 0 };

// Nudges (never removes) a checkpoint forward when it lands inside the
// domain's rest-gap window of the checkpoint before it — "shift, don't force"
// (§5). Can push the final date past the nominal deadline in extreme cadences;
// that's the intended behavior, not a bug — a shift, not a silent drop.
export function shiftForRestDay(dates, kind) {
  const minGap = REST_DAY_RULES[kind] ?? 0;
  if (!minGap || dates.length < 2) return dates;
  const out = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const prev = out[out.length - 1];
    let cur = dates[i];
    if (daysBetween(prev, cur) < minGap) cur = addDaysISO(prev, minGap);
    out.push(cur);
  }
  return [...new Set(out)];
}

// Implied rate between two consecutive checkpoint values. Lift is absolute
// kg/week (Starting-Strength's cited rate is absolute, not proportional — see
// calc/realism.js); every other domain is fractional %/week relative to the
// prior value, which is direction-agnostic (works for a pace that should drop
// or a VDOT/weight that should rise).
function segmentWeeklyRate(prevValue, prevDate, value, date, kind) {
  const weeks = Math.max(1, daysBetween(prevDate, date)) / 7;
  if (kind === 'lift') return (value - prevValue) / weeks;
  if (!prevValue) return null;
  return ((value - prevValue) / prevValue) / weeks;
}

function scoreRealism(kind, rate, direction) {
  return kind === 'lift' ? realismScoreLift(rate) : realismScore(kind, rate, direction);
}

// Assembles a goal's full checkpoint set: zero-data path marks the whole
// curve `provisional` (guidelinesForecast.md §4) until a real result lands;
// with-data path is identical math, just `provisional:false` — the curve
// shape/realism scoring doesn't change based on that flag, only its display
// treatment does (handled by the UI, not here).
export function buildCheckpoints(goal, { hasRealBaseline }) {
  const start = goal.startDate;
  const deadline = goalDeadline(goal);
  if (!start || !deadline || goal.baselineValue == null || goal.targetValue == null) return [];
  const dates = shiftForRestDay(resolveCadenceDates(start, deadline, goal.cadence), goal.kind);
  const fracs = dates.map((d) => fracOf(start, deadline, d));
  const targets = curveFor(goal.kind, goal.baselineValue, goal.targetValue, fracs);
  return dates.map((date, i) => {
    const prevValue = i === 0 ? goal.baselineValue : targets[i - 1];
    const prevDate = i === 0 ? start : dates[i - 1];
    const rate = segmentWeeklyRate(prevValue, prevDate, targets[i], date, goal.kind);
    return {
      date, targetValue: targets[i], source: 'computed', realism: scoreRealism(goal.kind, rate, goal.direction),
      provisional: !hasRealBaseline, actualValue: null, loggedAt: null, status: 'pending',
    };
  });
}

// THE recompute-from-here-forward engine (§6): everything AFTER touchIndex
// recalculates from (newValue, its date) forward to the fixed end goal;
// everything at/before touchIndex is returned byte-identical — nothing before
// an edit point ever moves. A worse-than-projected `newValue` naturally
// produces a steeper remaining curve (curveFor doesn't know or care whether
// the new anchor is better or worse than originally planned), correctly
// flagged more aggressive by realism scoring — never softened (§7/§11.5).
export function recomputeFrom(kind, checkpoints, touchIndex, newValue, endGoal) {
  const before = checkpoints.slice(0, touchIndex + 1);
  const after = checkpoints.slice(touchIndex + 1);
  if (!after.length) return before;
  const touchDate = checkpoints[touchIndex].date;
  const deadline = endGoal.deadline;
  const fracs = after.map((c) => fracOf(touchDate, deadline, c.date));
  const targets = curveFor(kind, newValue, endGoal.targetValue, fracs);
  const recomputed = after.map((c, i) => {
    const prevValue = i === 0 ? newValue : targets[i - 1];
    const prevDate = i === 0 ? touchDate : after[i - 1].date;
    const rate = segmentWeeklyRate(prevValue, prevDate, targets[i], c.date, kind);
    return { ...c, targetValue: targets[i], source: 'computed', provisional: false, realism: scoreRealism(kind, rate, endGoal.direction) };
  });
  return [...before, ...recomputed];
}

// Chained-edit rule (§6): recompute always runs from the most recently
// touched point forward — earlier overrides/logs stay as historical
// waypoints, never re-touched by a later edit further down the line.
export function mostRecentTouchIndex(checkpoints) {
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (checkpoints[i].source === 'override' || checkpoints[i].actualValue != null) return i;
  }
  return -1; // nothing touched yet — recompute (or initial build) starts from the original baseline
}

// Plain task-frequency training days (no specific checkpoint target) spread
// evenly per week via the existing weekdayOffsets helper, skipping any date
// already covered by a checkpoint — these are "train today" placeholders,
// distinct from a dated, targeted checkpoint.
export function buildTaskSessions(startISO, deadlineISO, taskFrequency, checkpointDates) {
  const perWeek = Math.max(1, Math.min(7, Math.round(Number(taskFrequency?.value) || 3)));
  const offsets = weekdayOffsets(perWeek);
  const totalWeeks = Math.ceil((daysBetween(startISO, deadlineISO) + 1) / 7);
  const checkpointSet = new Set(checkpointDates);
  const out = [];
  for (let w = 0; w < totalWeeks; w++) {
    for (const off of offsets) {
      const date = addDaysISO(startISO, w * 7 + off);
      if (date > deadlineISO || checkpointSet.has(date)) continue;
      out.push(date);
    }
  }
  return out;
}

// Single formatter shared by CalendarView/EntryEditor/GoalEditorModal so a
// target and, once logged, an actual result always render identically —
// previously each place hand-rolled its own copy of this string. Target and
// actual are stored in the SAME canonical unit per kind (e.g. both a VDOT
// number for 'run'), so one function formats either.
export function formatCheckpointValue(goal, value, units) {
  if (value == null) return '';
  switch (goal.kind) {
    case 'run': {
      if (!goal.targetDistanceM) return '';
      const distVal = round2(metersToDistance(goal.targetDistanceM, units.distance));
      const timeAtDist = secToClock(Math.round(equivalentRaceTime(value, goal.targetDistanceM)));
      // Pace per mile/km, alongside the time-at-distance — Riegel/VDOT-derived
      // pace isn't a flat division (it legitimately slows with distance), so
      // this re-uses the same equivalent-time formula at exactly one
      // mile/km rather than a naive time/distance division.
      const useKm = units.distance === 'km';
      const paceSec = equivalentRaceTime(value, useKm ? M_PER_KM : M_PER_MILE);
      const paceText = `${secToClock(Math.round(paceSec))}/${useKm ? 'km' : 'mi'}`;
      const alreadyOneUnit = Math.abs(distVal - 1) < 0.001;
      return alreadyOneUnit ? `${timeAtDist} at ${distVal}${units.distance}` : `${timeAtDist} at ${distVal}${units.distance} (${paceText})`;
    }
    case 'swim':
      return `${secToClock(Math.round(value))}/100m`;
    case 'lift':
      return `${round2(kgToWeight(value, units.weight))} ${units.weight} ${goal.label}`.trim();
    case 'weight':
      return `${round2(kgToWeight(value, units.weight))} ${units.weight}`;
    default:
      return `${round2(value)}${goal.label ? ` ${goal.label}` : ''}`;
  }
}

// Converts a free-text override input (mm:ss clock, weight number, or a raw
// number depending on kind) into the goal's canonical unit — shared by
// EntryEditor's checkpoint panel and the calendar's week-end quick-override
// so both parse identically instead of two hand-rolled copies.
export function parseOverrideValue(goal, raw, weightUnit) {
  if (raw === '' || raw == null) return null;
  switch (goal.kind) {
    case 'run': {
      const s = clockToSec(raw);
      return (s && goal.targetDistanceM) ? vdotFromRace(goal.targetDistanceM, s) : null;
    }
    case 'swim':
      return clockToSec(raw);
    case 'lift':
    case 'weight':
      return weightToKg(raw, weightUnit);
    default: {
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    }
  }
}

export function overridePlaceholderFor(goal, weightUnit) {
  if (goal.kind === 'run') return 'e.g. 6:00 (mm:ss)';
  if (goal.kind === 'swim') return 'e.g. 1:30 (mm:ss/100m)';
  if (goal.kind === 'lift' || goal.kind === 'weight') return `e.g. 185 (${weightUnit})`;
  return 'e.g. 50';
}
