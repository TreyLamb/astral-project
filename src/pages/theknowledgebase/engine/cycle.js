// Pure cycle-state transitions. Dates are YYYY-MM-DD strings throughout;
// inputs are never mutated, new objects are always returned.

import { randInt } from './rng.js';

/**
 * @param {string} a - YYYY-MM-DD
 * @param {string} b - YYYY-MM-DD
 * @returns {number} whole days from a to b (b - a)
 */
function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86400000);
}

/**
 * @param {Object<string, import('../tkbStorage.js').CycleState>} cycles
 * @param {string} questionId
 * @param {'new'|'wrong'|'flagged'} reason
 * @param {{activeMin:number, activeMax:number, restMin:number, restMax:number}} cycleConfig
 * @param {string} today - YYYY-MM-DD
 * @param {() => number} rng
 * @returns {Object<string, import('../tkbStorage.js').CycleState>} new cycles object
 */
export function enterCycle(cycles, questionId, reason, cycleConfig, today, rng) {
  return {
    ...cycles,
    [questionId]: {
      reason,
      phase: 'active',
      phaseStart: today,
      activeDays: randInt(rng, cycleConfig.activeMin, cycleConfig.activeMax),
      restDays: randInt(rng, cycleConfig.restMin, cycleConfig.restMax),
      maxCycles: randInt(rng, 1, 2),
      cyclesCompleted: 0,
    },
  };
}

/**
 * Advance every entry by (at most) one phase transition, based on elapsed
 * days since phaseStart at the moment of the call. Idempotent: calling this
 * twice in a row with the same `today` produces the same result both times,
 * because a transition always resets phaseStart to `today`, and (elapsed = 0)
 * never satisfies `elapsed >= activeDays/restDays` for the config ranges this
 * engine uses (activeDays/restDays are always >= 1, since cycleConfig mins
 * are expected to be >= 1 — see NOTE below for the defensive floor).
 *
 * NOTE (design decision): the spec's buildSessionQueue step calls
 * `tickCycles(cycles, today, rng)` with 3 args, but re-rolling activeDays/
 * restDays on rest->active requires the cycle config (activeMin/Max,
 * restMin/Max) which isn't stored on the entry itself (only the already-
 * rolled concrete values are). A 3-arg call has no way to know the original
 * range. Resolution: `cycleConfig` is accepted as an optional 4th parameter.
 * When provided (buildSessionQueue passes `settings.cycle`), re-rolls use it.
 * When omitted, the re-roll falls back to reusing the entry's own current
 * activeDays/restDays as a fixed (degenerate min===max) range, so the
 * function still never throws and stays pure/self-contained.
 *
 * @param {Object<string, import('../tkbStorage.js').CycleState>} cycles
 * @param {string} today - YYYY-MM-DD
 * @param {() => number} rng
 * @param {{activeMin:number, activeMax:number, restMin:number, restMax:number}} [cycleConfig]
 * @returns {Object<string, import('../tkbStorage.js').CycleState>} new cycles object
 */
export function tickCycles(cycles, today, rng, cycleConfig) {
  const result = {};
  for (const [qid, entry] of Object.entries(cycles)) {
    const elapsed = daysBetween(entry.phaseStart, today);

    if (entry.phase === 'active' && elapsed >= entry.activeDays) {
      result[qid] = { ...entry, phase: 'rest', phaseStart: today };
      continue;
    }

    if (entry.phase === 'rest' && elapsed >= entry.restDays) {
      const cyclesCompleted = entry.cyclesCompleted + 1;
      if (cyclesCompleted >= entry.maxCycles) {
        // Exits the cycle system entirely — falls back to normal weighted
        // selection. Deliberately omitted from `result`.
        continue;
      }
      const cfg = cycleConfig || {
        activeMin: entry.activeDays,
        activeMax: entry.activeDays,
        restMin: entry.restDays,
        restMax: entry.restDays,
      };
      result[qid] = {
        ...entry,
        phase: 'active',
        phaseStart: today,
        activeDays: randInt(rng, cfg.activeMin, cfg.activeMax),
        restDays: randInt(rng, cfg.restMin, cfg.restMax),
        cyclesCompleted,
      };
      continue;
    }

    // No transition this call.
    result[qid] = entry;
  }
  return result;
}

/**
 * @param {Object<string, import('../tkbStorage.js').CycleState>} cycles
 * @returns {{activeIds: string[], restIds: string[]}}
 */
export function partitionByPhase(cycles) {
  const activeIds = [];
  const restIds = [];
  for (const [qid, entry] of Object.entries(cycles)) {
    if (entry.phase === 'active') activeIds.push(qid);
    else if (entry.phase === 'rest') restIds.push(qid);
  }
  return { activeIds, restIds };
}
