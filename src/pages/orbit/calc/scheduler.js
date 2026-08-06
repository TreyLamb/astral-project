// Orbit deterministic timed solver (guidelinesScheduler.md §10) — the "brain".
// Places priority-ordered candidate tasks onto ACTUAL times of day across a
// horizon, honoring HARD constraints (guardrail windows, fixed events, the
// energy tank + cross-day fatigue, weather-avoid, travel feasibility, learned
// rules) and then SOFT-optimizing among the legal options (§7): batch errands
// near where the day already sends you, honor time-of-day preferences, keep
// same-category work contiguous, and never sit perishables in a hot-car slot.
// Pure: no React, no storage, no network, no AI — everything fuzzy (annotation,
// live traffic, the rulebook) is injected as data by the caller. Produces a
// PROPOSED plan; nothing is committed here (see the staged preview UI). Every
// placement carries reason strings for the review chips.

import { startingTank, energyCost, estimateWorkMin, recoveryMin } from './energy';
import { travelMinutes } from './travel';

const DAY_MIN = 24 * 60;

// Soft-cost weights (§7). travel/contextSwitch/idealWindow are user-tunable
// (settings.scheduler.softWeights); dayIndex is an internal front-loading bias
// small enough that any real travel/window saving overrides it, so the plan
// still fills today first when nothing else distinguishes the days.
export const DEFAULT_SOFT_WEIGHTS = { travel: 1, contextSwitch: 0.5, idealWindow: 0.5, dayIndex: 0.1 };

// Two placed blocks are "adjacent" for hot-car / context-switch purposes when
// the second starts within this many minutes of the first ending. A perishable
// three hours after an outdoor task isn't sitting in a hot car; a 5-minute gap
// is. Context-switching tolerates a slightly larger gap than the hot car does.
const ADJACENCY_GAP_MIN = 60;
const CONTEXT_GAP_MIN = 90;

const EPS = 1e-9;

// Hour bands for idealWindow scoring (§7). Half-open [lo, hi). `any` / unknown
// windows never score a mismatch.
const WINDOW_BANDS = {
  morning: [5, 11],
  midday: [11, 14],
  afternoon: [14, 18],
  evening: [18, 22],
};

// 'HH:MM' -> minutes since midnight, and back. Exported for the UI's time labels.
export function parseHM(hm) {
  const [h, m] = String(hm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
export function minutesToHM(min) {
  const clamped = Math.max(0, Math.min(DAY_MIN - 1, Math.round(min)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Free gaps inside [windowStart, windowEnd] after subtracting busy blocks
// (overlaps merged as we sweep). Deterministic — sorted by start.
export function freeIntervals(windowStart, windowEnd, busy) {
  if (windowEnd <= windowStart) return [];
  const clipped = busy
    .filter((b) => b.endMin > windowStart && b.startMin < windowEnd)
    .map((b) => ({ start: Math.max(b.startMin, windowStart), end: Math.min(b.endMin, windowEnd) }))
    .sort((a, b) => a.start - b.start);
  const free = [];
  let cursor = windowStart;
  for (const b of clipped) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });
  return free;
}

// The window a category may be scheduled in = global awake hours intersected
// with the category's own allowed window (§5). No category override -> awake.
export function guardrailWindow(guardrails, category) {
  const [aStart, aEnd] = guardrails.awake.map(parseHM);
  const cat = category && guardrails.byCategory && guardrails.byCategory[category];
  if (!cat) return [aStart, aEnd];
  const [cStart, cEnd] = cat.map(parseHM);
  return [Math.max(aStart, cStart), Math.min(aEnd, cEnd)];
}

function isOutdoorTask(task) {
  return task.indoorOutdoor === 'outdoor' || !!task.weatherSensitive;
}

// True if any hour overlapping [start,end] has precip probability at/over the
// avoid threshold — the hard rain constraint for outdoor/weather-sensitive work.
function windowHasRain(weather, start, end, threshold) {
  if (!weather || !Array.isArray(weather.hourly)) return false;
  return weather.hourly.some((h) => {
    const hm = h.hour * 60;
    return hm >= start - 60 && hm < end && (h.precipProb ?? 0) >= threshold;
  });
}

function tempAt(weather, minute) {
  if (!weather || !Array.isArray(weather.hourly)) return null;
  const hour = Math.floor(minute / 60);
  const h = weather.hourly.find((x) => x.hour === hour);
  return h && h.tempF != null ? h.tempF : null;
}

// === Pure soft-optimization / constraint predicates (§7, §12) ===============
// All exported so they can be unit-tested in isolation from the greedy loop.
// A "placed" entry (dayContext) is { taskId, category, perishable, isOutdoor,
// startMin, endMin, blockStartMin, blockEndMin, place }. A "placement"/candidate
// is the same shape for the task being considered (place optional).

// How far, in hours, a start hour sits outside the task's ideal band (0 inside).
export function idealWindowMismatch(task, startHour) {
  const w = task.idealWindow;
  if (!w || w === 'any') return 0;
  const band = WINDOW_BANDS[w];
  if (!band) return 0;
  const [lo, hi] = band;
  if (startHour >= lo && startHour < hi) return 0;
  return startHour < lo ? lo - startHour : startHour - (hi - 1);
}

// The block (already placed that day) whose end is the closest one at/just
// before `startMin`, within the gap threshold — i.e. the block you'd be doing
// right before this candidate. null if there's a big gap or nothing precedes.
function immediatePredecessor(startMin, placed, gapThreshold) {
  let best = null;
  for (const p of placed) {
    if (p.blockEndMin <= startMin && startMin - p.blockEndMin <= gapThreshold) {
      if (!best || p.blockEndMin > best.blockEndMin) best = p;
    }
  }
  return best;
}

function immediateSuccessor(blockEndMin, placed, gapThreshold) {
  let best = null;
  for (const p of placed) {
    if (p.blockStartMin >= blockEndMin && p.blockStartMin - blockEndMin <= gapThreshold) {
      if (!best || p.blockStartMin < best.blockStartMin) best = p;
    }
  }
  return best;
}

// A3 (spec §3.1/§10): never put a perishable straight after an outdoor/hot task
// (groceries baking in a hot car), nor an outdoor task straight before an
// already-placed perishable. HARD — used as a placement filter, not a penalty.
export function violatesAdjacency(task, placement, dayPlacements) {
  if (task.perishable) {
    const pred = immediatePredecessor(placement.blockStartMin, dayPlacements, ADJACENCY_GAP_MIN);
    if (pred && pred.isOutdoor) return true;
  }
  if (isOutdoorTask(task)) {
    const succ = immediateSuccessor(placement.blockEndMin, dayPlacements, ADJACENCY_GAP_MIN);
    if (succ && succ.perishable) return true;
  }
  return false;
}

// A4 (spec §7): soft penalty (0-2) for a placement wedged between two blocks of
// a DIFFERENT category — nudges same-category work into contiguous runs.
// Uncategorized tasks/neighbors never count (you can't context-switch out of
// "no category").
export function contextSwitchPenalty(task, placement, dayPlacements) {
  if (!task.category) return 0;
  let penalty = 0;
  const pred = immediatePredecessor(placement.blockStartMin, dayPlacements, CONTEXT_GAP_MIN);
  const succ = immediateSuccessor(placement.blockEndMin, dayPlacements, CONTEXT_GAP_MIN);
  if (pred && pred.category && pred.category !== task.category) penalty += 1;
  if (succ && succ.category && succ.category !== task.category) penalty += 1;
  return penalty;
}

// Marginal travel to slot this task's place into the day: the CHEAPEST hop from
// anywhere the day already goes (home + every located block already placed).
// A day that already sends you near this errand costs ~0 to add it → batching
// (A2). No place / no known origins → 0 (unconstrained).
export function batchTravelMinutes(taskPlace, startHour, dayPlacements, homePlace, travelOpts) {
  if (!taskPlace) return 0;
  const origins = [];
  if (homePlace) origins.push(homePlace);
  for (const p of dayPlacements) if (p.place) origins.push(p.place);
  let min = Infinity;
  for (const o of origins) {
    const tm = travelMinutes(o, taskPlace, startHour, travelOpts);
    if (tm != null && tm < min) min = tm;
  }
  return min === Infinity ? 0 : min;
}

// --- Rulebook (§12) ---------------------------------------------------------
// A rule is { subject, relation, object, action:'forbid', active }. Grammar the
// solver understands (unknown shapes are IGNORED so the rulebook is forward-
// compatible — a future relation never crashes an old solver):
//   subject/object tokens: 'perishable' | 'outdoor' | 'weatherSensitive' | 'category:<x>'
//   relation 'notAfter'  + category/flag object  -> adjacency: subject may not
//                                                    immediately follow object.
//   relation 'notBefore' + category/flag object  -> adjacency: subject may not
//                                                    immediately precede object.
//   relation 'notBefore' + 'HH:MM'               -> time floor (start >= t).
//   relation 'notAfter'  + 'HH:MM'               -> time ceiling (start <= t).
//   relation 'window'    + 'HH:MM-HH:MM'         -> start within [lo, hi).
const TIME_TOKEN = /^\d{1,2}:\d{2}$/;
const WINDOW_TOKEN = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;

function tokenMatchesTask(token, task) {
  if (!token) return false;
  if (token === 'perishable') return !!task.perishable;
  if (token === 'outdoor') return isOutdoorTask(task);
  if (token === 'weatherSensitive') return !!task.weatherSensitive;
  if (token.startsWith('category:')) return task.category === token.slice('category:'.length);
  return false;
}

function tokenMatchesPlaced(token, placed) {
  if (!token || !placed) return false;
  if (token === 'perishable') return !!placed.perishable;
  if (token === 'outdoor') return !!placed.isOutdoor;
  if (token === 'weatherSensitive') return !!placed.weatherSensitive;
  if (token.startsWith('category:')) return placed.category === token.slice('category:'.length);
  return false;
}

// The highest time-floor (notBefore HH:MM / window lo) any active rule imposes
// on this task, in minutes — used to seed a legal candidate start inside a gap
// so a floored task still gets scheduled at its earliest allowed time, not
// merely rejected at the gap's start. null when no floor applies.
export function ruleFloorMin(task, rules = []) {
  let floor = null;
  for (const rule of rules) {
    if (rule.active === false) continue;
    if (!tokenMatchesTask(rule.subject, task)) continue;
    let t = null;
    if (rule.relation === 'notBefore' && TIME_TOKEN.test(rule.object)) t = parseHM(rule.object);
    else if (rule.relation === 'window' && WINDOW_TOKEN.test(rule.object)) t = parseHM(rule.object.split('-')[0]);
    if (t != null && (floor == null || t > floor)) floor = t;
  }
  return floor;
}

// HARD rule filter (§12): does the rulebook allow this task at this candidate?
// `candidate` needs { startMin, blockStartMin, blockEndMin }; `dayContext`
// carries the already-placed blocks so adjacency rules can see the neighbours.
export function ruleAllows(task, candidate, dayContext, rules = []) {
  const placed = (dayContext && dayContext.placements) || [];
  for (const rule of rules) {
    if (rule.action && rule.action !== 'forbid') continue; // only 'forbid' is enforced today
    if (rule.active === false) continue;
    if (!tokenMatchesTask(rule.subject, task)) continue;
    const obj = rule.object;

    if (rule.relation === 'window' && WINDOW_TOKEN.test(obj)) {
      const [lo, hi] = obj.split('-').map(parseHM);
      if (candidate.startMin < lo || candidate.startMin >= hi) return false;
      continue;
    }
    if (rule.relation === 'notBefore' && TIME_TOKEN.test(obj)) {
      if (candidate.startMin < parseHM(obj)) return false;
      continue;
    }
    if (rule.relation === 'notAfter' && TIME_TOKEN.test(obj)) {
      if (candidate.startMin > parseHM(obj)) return false;
      continue;
    }
    if (rule.relation === 'notAfter') { // adjacency: subject not immediately AFTER object
      const pred = immediatePredecessor(candidate.blockStartMin, placed, ADJACENCY_GAP_MIN);
      if (pred && tokenMatchesPlaced(obj, pred)) return false;
      continue;
    }
    if (rule.relation === 'notBefore') { // adjacency: subject not immediately BEFORE object
      const succ = immediateSuccessor(candidate.blockEndMin, placed, ADJACENCY_GAP_MIN);
      if (succ && tokenMatchesPlaced(obj, succ)) return false;
      continue;
    }
    // unknown relation -> ignored (forward-compatible)
  }
  return true;
}

// Weighted sum of the soft-cost parts. Lower is better. Pure + tested.
export function placementSoftCost(parts, weights = DEFAULT_SOFT_WEIGHTS) {
  const w = { ...DEFAULT_SOFT_WEIGHTS, ...weights };
  return w.travel * (parts.travel || 0)
    + w.contextSwitch * (parts.contextSwitch || 0)
    + w.idealWindow * (parts.idealWindow || 0)
    + w.dayIndex * (parts.dayIndex || 0);
}

// === Reason chips ============================================================
function buildReasons(task, date, chosen, days) {
  const reasons = [];
  reasons.push(date === days[0] ? 'fits today' : `earliest open day · ${date}`);
  reasons.push(`within ${task.category || 'awake'} hours`);
  if (chosen.travelBefore > 0) reasons.push(`+${chosen.travelBefore}m travel from last stop`);
  if (chosen.batched) reasons.push('batched near your other stops');
  if (chosen.windowMatched) reasons.push(`${task.idealWindow} preferred`);
  if (chosen.sameCategoryRun) reasons.push('same-category run');
  if (task.perishable) reasons.push('perishable — kept clear of hot-car slots');
  if (isOutdoorTask(task)) {
    if (chosen.startHour < 11 || chosen.startHour >= 16) reasons.push('cooler slot for outdoor work');
    else reasons.push('outdoor — midday heat costs more energy');
  }
  if (task.dueDate) reasons.push(date <= task.dueDate ? 'before due date' : '⚠ past due date');
  reasons.push(`costs ${chosen.energyCost.toFixed(1)} energy · ${chosen.tankAfter.toFixed(1)} left in tank`);
  return reasons;
}

// Main entry. See the input contract in the doc; every fuzzy input (weather,
// places, durations, live travel, rules) is injected so the core stays
// deterministic and unit-testable.
export function buildTimedPlan(input) {
  const {
    tasks,
    days,
    capacityFor,
    busyFor = () => [],
    guardrails,
    weatherFor = () => null,
    placesById = new Map(),
    durationDb = [],
    fatigueCfg,
    defaultRecoveryMin = 10,
    weatherAvoidPrecipPct = 50,
    homePlace = null,
    // Optional (iso) → {lat,lng}|null. Lets a day override the global home as its
    // travel origin + errand-batch seed — the "where I am that day" base. When
    // omitted (or it returns null) the day falls back to homePlace, so behavior
    // is unchanged for callers that don't pass it. See calc/baseLocation.js.
    homePlaceFor = null,
    travelOpts = {},
    rules = [],
    softWeights = DEFAULT_SOFT_WEIGHTS,
  } = input;

  const activeRules = rules.filter((r) => r && r.active !== false);
  const homeForDate = (date) => (homePlaceFor ? (homePlaceFor(date) || homePlace) : homePlace);
  const orderIndex = new Map(days.map((d, i) => [d, i]));
  const dayState = new Map(); // date -> { busy:[], load:number, lastPlace, placed:[] }
  const ensureDay = (date) => {
    if (!dayState.has(date)) {
      dayState.set(date, { busy: [...busyFor(date)], load: 0, lastPlace: homeForDate(date), placed: [] });
    }
    return dayState.get(date);
  };

  // A day's usable tank = its full capacity minus fatigue carried from the
  // PRIOR horizon day's load-so-far. Load accumulates as the greedy fill
  // progresses; since we pack earliest-first, the prior day is largely settled
  // by the time later days take tasks (documented approximation, good for v1).
  const tankFor = (date) => {
    const i = orderIndex.get(date);
    const prevDate = i > 0 ? days[i - 1] : null;
    const prevLoad = prevDate && dayState.has(prevDate) ? dayState.get(prevDate).load : 0;
    return startingTank(capacityFor(date), prevLoad, fatigueCfg);
  };

  // Candidate start offsets to try inside a gap: the earliest legal start
  // (front-load), plus — when relevant — a start aligned to the task's ideal
  // window and one aligned to any rule time-floor, so those preferences are
  // actually reachable instead of only ever rejected at the gap's start.
  const candidateStarts = (task, gap, floor) => {
    const starts = new Set();
    const base = floor != null ? Math.max(gap.start, floor) : gap.start;
    if (base < gap.end) starts.add(base);
    if (task.idealWindow && task.idealWindow !== 'any' && WINDOW_BANDS[task.idealWindow]) {
      const aligned = Math.max(base, WINDOW_BANDS[task.idealWindow][0] * 60);
      if (aligned < gap.end) starts.add(aligned);
    }
    return [...starts].sort((a, b) => a - b);
  };

  const placements = [];
  const unplaced = [];

  for (const task of tasks) {
    const workMin = estimateWorkMin(task, durationDb);
    const taskPlace = task.locationId ? placesById.get(task.locationId) : null;
    const floor = ruleFloorMin(task, activeRules);

    let best = null; // { date, di, cand, softCost }

    for (let di = 0; di < days.length; di += 1) {
      const date = days[di];
      const [winStart, winEnd] = guardrailWindow(guardrails, task.category);
      if (winEnd <= winStart) continue; // category has no legal window at all

      const weather = weatherFor(date);
      if (isOutdoorTask(task) && windowHasRain(weather, winStart, winEnd, weatherAvoidPrecipPct)) continue;

      const state = ensureDay(date);
      const tank = tankFor(date);
      const free = freeIntervals(winStart, winEnd, state.busy);

      for (const iv of free) {
        for (const startAt of candidateStarts(task, iv, floor)) {
          // Travel inserted before the block = from wherever the day last left
          // us, costed at the hour the work starts (rush-hour aware).
          let travelBefore = 0;
          if (taskPlace && state.lastPlace) {
            const tm = travelMinutes(state.lastPlace, taskPlace, Math.floor(startAt / 60), travelOpts);
            if (tm != null) travelBefore = Math.round(tm);
          }
          const workStart = startAt + travelBefore;
          const startHour = Math.floor(workStart / 60);
          const slot = { hourOfDay: startHour, tempF: tempAt(weather, workStart), precipProb: 0 };
          const eCost = energyCost(task, slot);
          const rec = recoveryMin(task, eCost, defaultRecoveryMin);
          const blockEnd = workStart + workMin + rec;

          if (blockEnd > iv.end) continue; // doesn't fit this gap from here
          if (state.load + eCost > tank) continue; // over the day's tank

          const cp = { startMin: workStart, blockStartMin: startAt, blockEndMin: blockEnd };
          if (violatesAdjacency(task, cp, state.placed)) continue; // A3 hard
          if (!ruleAllows(task, cp, { placements: state.placed }, activeRules)) continue; // §12 hard

          // Soft cost among the legal options (§7).
          const batchTravel = batchTravelMinutes(taskPlace, startHour, state.placed, homeForDate(date), travelOpts);
          const csPenalty = contextSwitchPenalty(task, cp, state.placed);
          const iwMismatch = idealWindowMismatch(task, startHour);
          const softCost = placementSoftCost(
            { travel: batchTravel, contextSwitch: csPenalty, idealWindow: iwMismatch, dayIndex: di },
            softWeights,
          );

          const cand = {
            blockStart: startAt,
            workStart,
            workEnd: workStart + workMin,
            blockEnd,
            travelBefore,
            workMin,
            recovery: rec,
            energyCost: eCost,
            startHour,
            tankAfter: tank - (state.load + eCost),
            batched: !!taskPlace && state.placed.some((p) => p.place) && batchTravel <= 15,
            windowMatched: !!task.idealWindow && task.idealWindow !== 'any' && iwMismatch === 0,
            sameCategoryRun: !!task.category && csPenalty === 0
              && state.placed.some((p) => p.category === task.category),
          };

          const better = best === null
            || softCost < best.softCost - EPS
            || (Math.abs(softCost - best.softCost) <= EPS
              && (di < best.di || (di === best.di && workStart < best.cand.workStart)));
          if (better) best = { date, di, cand, softCost };
        }
      }
    }

    if (!best) { unplaced.push(task.id); continue; }

    const state = ensureDay(best.date);
    const { cand } = best;
    state.busy.push({ startMin: cand.blockStart, endMin: cand.blockEnd, label: task.title });
    state.load += cand.energyCost;
    if (taskPlace) state.lastPlace = taskPlace;
    state.placed.push({
      taskId: task.id,
      category: task.category ?? null,
      perishable: !!task.perishable,
      isOutdoor: isOutdoorTask(task),
      weatherSensitive: !!task.weatherSensitive,
      startMin: cand.workStart,
      endMin: cand.workEnd,
      blockStartMin: cand.blockStart,
      blockEndMin: cand.blockEnd,
      place: taskPlace || null,
    });
    state.placed.sort((a, b) => a.blockStartMin - b.blockStartMin);

    placements.push({
      taskId: task.id,
      date: best.date,
      startMin: cand.workStart,
      endMin: cand.workEnd,
      blockStartMin: cand.blockStart,
      blockEndMin: cand.blockEnd,
      workMin: cand.workMin,
      recoveryMin: cand.recovery,
      travelMinBefore: cand.travelBefore,
      energyCost: Math.round(cand.energyCost * 100) / 100,
      startLabel: minutesToHM(cand.workStart),
      endLabel: minutesToHM(cand.workEnd),
      reasons: buildReasons(task, best.date, cand, days),
    });
  }

  return { placements, unplaced };
}
