// Orbit feedback→rules loop (guidelinesScheduler.md §12) — pure calc, no
// storage/React. When you reject or move an auto-scheduled placement, you tell
// the planner WHY with a reason chip; each reason crystallizes the one-off
// correction into something DURABLE the deterministic placer honors next time:
// a task-level tag, a learned duration, or a policy rule. "AI annotates, script
// schedules" — none of this is a model call; it's data the solver reads.
//
// reasonToWrites(code, task, context) is the whole contract: it returns the
// writes to apply, and the UI (AutoScheduleView) actually calls updateTask /
// upsertDuration / addRule with them. Keeping it pure means the mapping is unit-
// tested independently of the React layer.

import { normalizeTitle } from './energy';

// The starter reason set (§12 says grow it later — do NOT try to be exhaustive).
// `needs` flags the tiny extra input the UI must collect before applying:
//   'minutes'  -> a number of minutes (takes-longer)
//   'window'   -> a morning/midday/afternoon/evening choice (wrong-time-of-day)
// `offersRule` marks reasons that can ALSO write a global policy rule (opt-in).
export const REASON_CODES = [
  { code: 'perishable', label: 'Perishable', hint: 'Keep it out of hot-car slots', offersRule: true },
  { code: 'too-draining-here', label: 'Too draining here', hint: 'Costs more energy than planned' },
  { code: 'wrong-time-of-day', label: 'Wrong time of day', hint: 'Prefer a different part of the day', needs: 'window' },
  { code: 'not-near-my-errands', label: 'Not near my errands', hint: 'Batch it with other stops' },
  { code: 'takes-longer', label: 'Takes longer', hint: 'It actually needs more time', needs: 'minutes' },
  { code: 'not-today', label: 'Not today', hint: 'Skip it for this planning session' },
];

export const REASON_BY_CODE = new Map(REASON_CODES.map((r) => [r.code, r]));

const WINDOW_BANDS = {
  morning: [5, 11],
  midday: [11, 14],
  afternoon: [14, 18],
  evening: [18, 22],
};

// Which ideal window a minute-of-day falls into (for inferring wrong-time-of-day
// from the slot the user dragged a task to). null if it's outside all bands.
export function inferWindowFromMin(min) {
  if (min == null) return null;
  const hour = Math.floor(min / 60);
  for (const [name, [lo, hi]] of Object.entries(WINDOW_BANDS)) {
    if (hour >= lo && hour < hi) return name;
  }
  return null;
}

function median(nums) {
  const xs = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : Math.round((xs[mid - 1] + xs[mid]) / 2);
}

// The canonical policy rule the perishable reason can install (§12 example).
export function perishableAfterOutdoorRule() {
  return {
    subject: 'perishable',
    relation: 'notAfter',
    object: 'category:outdoor',
    action: 'forbid',
    createdFrom: 'feedback:perishable',
  };
}

// Map a reason code + optional collected context to the durable writes to apply.
// Returns any of { taskPatch, rule, duration, sessionExclude }. Never mutates
// its inputs. An unknown/empty code returns {} (a no-op correction).
//   context: { makeRule, addRecovery, defaultRecoveryMin, idealWindow,
//              movedToMin, estWorkMin, prevSamples }
export function reasonToWrites(code, task, context = {}) {
  if (!task) return {};
  switch (code) {
    case 'perishable': {
      const out = { taskPatch: { perishable: true } };
      if (context.makeRule) out.rule = perishableAfterOutdoorRule();
      return out;
    }
    case 'too-draining-here': {
      const intensity = Math.min(5, (task.intensity ?? task.energy ?? 3) + 1);
      const taskPatch = { intensity };
      if (context.addRecovery) {
        const cur = task.estRecoveryMin ?? context.defaultRecoveryMin ?? 10;
        taskPatch.estRecoveryMin = cur + 10;
      }
      return { taskPatch };
    }
    case 'wrong-time-of-day': {
      const idealWindow = context.idealWindow || inferWindowFromMin(context.movedToMin);
      return idealWindow ? { taskPatch: { idealWindow } } : {};
    }
    case 'takes-longer': {
      const minutes = Number(context.estWorkMin);
      if (!minutes || minutes <= 0) return {};
      const prev = Array.isArray(context.prevSamples) ? context.prevSamples : [];
      const samples = [...prev, minutes];
      return {
        taskPatch: { estWorkMin: minutes },
        duration: {
          key: normalizeTitle(task.title),
          category: task.category ?? null,
          samples,
          lastActualMin: minutes,
          medianMin: median(samples),
        },
      };
    }
    case 'not-near-my-errands': {
      const constraints = Array.isArray(task.constraints) ? task.constraints : [];
      if (constraints.includes('batch-with-errands')) return {};
      return { taskPatch: { constraints: [...constraints, 'batch-with-errands'] } };
    }
    case 'not-today':
      return { sessionExclude: true };
    default:
      return {};
  }
}
