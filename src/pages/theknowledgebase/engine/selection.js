// Pure weighting + session-queue-building logic. No imports of react,
// tkbStorage, or anything with side effects — data and rng are arguments.

import { shuffle, weightedSampleWithoutReplacement } from './rng.js';
import { tickCycles, partitionByPhase } from './cycle.js';

/**
 * Weight 50 is neutral (factor 1.0); absent weight is also neutral.
 * @param {number|undefined} rawWeight - 1..100
 * @returns {number}
 */
export function effectiveWeight(rawWeight) {
  return rawWeight === undefined ? 1.0 : rawWeight / 50;
}

/**
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * @param {string} subjectId
 * @param {import('../tkbStorage.js').Weights} weights
 * @param {import('../tkbStorage.js').Settings} settings
 * @param {string} today - YYYY-MM-DD
 * @returns {number}
 */
export function subjectFactor(subjectId, weights, settings, today) {
  const base = effectiveWeight(weights.subject[subjectId]);
  const focusWeek = (settings.focusWeeks || []).find(
    (fw) => fw.subjectId === subjectId && today < fw.revertDate
  );
  const focusWeekMultiplier = focusWeek ? focusWeek.multiplier : 1;
  return base * focusWeekMultiplier;
}

/**
 * Heuristic stub: questions/subjects that get missed a lot should surface
 * more; questions/subjects on a correct streak should recede a bit.
 * @param {{timesShown:number, timesCorrect:number, timesWrong:number}} stats
 * @returns {number} clamped to [0.5, 2]
 */
export function autoAdjustFactor(stats) {
  const missRate = stats.timesShown > 0 ? stats.timesWrong / stats.timesShown : 0;
  const streakBonus = stats.timesShown > 0 ? stats.timesCorrect / stats.timesShown : 0;
  return clamp(1 + missRate - 0.5 * streakBonus, 0.5, 2);
}

/**
 * @param {import('../tkbStorage.js').Question} question
 * @param {import('../tkbStorage.js').Weights} weights
 * @returns {number}
 */
export function questionEffectiveWeight(question, weights) {
  const tagFactor =
    question.styleTags.length === 0
      ? 1.0
      : Math.min(...question.styleTags.map((tag) => effectiveWeight(weights.tag[tag])));
  const questionFactor = effectiveWeight(weights.question[question.id]);
  return tagFactor * questionFactor;
}

/**
 * Largest-remainder allocation of `total` slots across subjects, proportional
 * to `shares`, clamped so no subject exceeds its available `poolSizes`.
 *
 * Design decisions (not fully specified upstream):
 * - If all shares are <= 0 (or `shares` is empty of positive values), treat
 *   every subject as having an equal proportion rather than dividing by zero.
 * - Remainder distribution is a repeated single-pass-largest-fractional-first
 *   sweep: subjects already at their poolSize cap are skipped without
 *   consuming a "turn". If, after a full sweep through every candidate, some
 *   remainder is still left (this only happens when total capacity across
 *   subjects with room is itself large enough to absorb more than 1 unit per
 *   subject per sweep), it sweeps again. This continues until the remainder
 *   is exhausted or literally no subject has room left.
 * - If sum(poolSizes) < total, the returned allocation legitimately sums to
 *   less than `total` — this is correct, not a bug; there just isn't enough
 *   material to fill the request.
 *
 * @param {Object<string, number>} shares
 * @param {Object<string, number>} poolSizes
 * @param {number} total
 * @returns {Object<string, number>} subjectId -> allocated count
 */
export function largestRemainderAllocate(shares, poolSizes, total) {
  const ids = Object.keys(shares);
  const result = {};
  if (ids.length === 0 || total <= 0) {
    ids.forEach((id) => (result[id] = 0));
    return result;
  }

  const positiveShares = {};
  let sumShares = 0;
  ids.forEach((id) => {
    const s = Math.max(0, shares[id] || 0);
    positiveShares[id] = s;
    sumShares += s;
  });

  const proportions = {};
  if (sumShares > 0) {
    ids.forEach((id) => (proportions[id] = positiveShares[id] / sumShares));
  } else {
    ids.forEach((id) => (proportions[id] = 1 / ids.length));
  }

  const quota = {};
  const floor = {};
  ids.forEach((id) => {
    quota[id] = proportions[id] * total;
    floor[id] = Math.floor(quota[id]);
  });

  ids.forEach((id) => {
    const cap = poolSizes[id] || 0;
    result[id] = Math.min(floor[id], cap);
  });

  let allocated = ids.reduce((sum, id) => sum + result[id], 0);
  let remainder = total - allocated;

  const sortedByFraction = ids
    .slice()
    .sort((a, b) => quota[b] - Math.floor(quota[b]) - (quota[a] - Math.floor(quota[a])));

  while (remainder > 0) {
    let assignedAny = false;
    for (const id of sortedByFraction) {
      if (remainder <= 0) break;
      const cap = poolSizes[id] || 0;
      if (result[id] < cap) {
        result[id] += 1;
        remainder -= 1;
        assignedAny = true;
      }
    }
    if (!assignedAny) break;
  }

  return result;
}

/**
 * @param {Object} args
 * @param {number} args.N
 * @param {import('../tkbStorage.js').Question[]} args.questions
 * @param {import('../tkbStorage.js').Subject[]} args.subjects
 * @param {import('../tkbStorage.js').Weights} args.weights
 * @param {Object<string, import('../tkbStorage.js').CycleState>} args.cycles
 * @param {import('../tkbStorage.js').Settings} args.settings
 * @param {{id:string, paceClass:'fast'|'slow', subjectScope:'all'|'scoped', adjustmentMode:'auto'|'manual'}} args.profile
 * @param {string} args.today - YYYY-MM-DD
 * @param {() => number} args.rng
 * @returns {{queue: {questionId:string, retry:boolean}[], cyclesOut: Object<string, import('../tkbStorage.js').CycleState>}}
 */
export function buildSessionQueue({ N, questions, subjects, weights, cycles, settings, profile, today, rng }) {
  const subjectsById = new Map(subjects.map((s) => [s.id, s]));
  const requiredPipeline = profile.paceClass === 'fast' ? 'main_recall' : 'quick_fact';

  const pool = questions.filter((q) => {
    if (q.status !== 'active') return false;
    if (q.pipeline !== requiredPipeline) return false;
    const subject = subjectsById.get(q.subjectId);
    if (!subject || !subject.visibleToProfiles.includes(profile.id)) return false;
    if (profile.subjectScope === 'scoped' && !settings.autoScopedSubjectIds.includes(subject.id)) {
      return false;
    }
    return true;
  });

  const cyclesOut = tickCycles(cycles, today, rng, settings.cycle);
  const { activeIds, restIds } = partitionByPhase(cyclesOut);
  const activeIdSet = new Set(activeIds);
  const restIdSet = new Set(restIds);

  const forcedPoolShuffled = shuffle(
    pool.filter((q) => activeIdSet.has(q.id)),
    rng
  );
  // No cap on how many cycling questions can be force-included, by explicit
  // user request - the only limit left is N itself (can't serve more
  // questions than the session size asks for), which is a structural fact
  // about the session, not a throttle on the cycle subsystem.
  let forced = forcedPoolShuffled;
  if (forced.length > N) forced = forced.slice(0, N);

  const remainingPool = pool.filter(
    (q) => !activeIdSet.has(q.id) && !restIdSet.has(q.id)
  );

  const M = Math.max(0, N - forced.length);

  const bySubject = new Map();
  remainingPool.forEach((q) => {
    if (!bySubject.has(q.subjectId)) bySubject.set(q.subjectId, []);
    bySubject.get(q.subjectId).push(q);
  });

  const shares = {};
  const poolSizes = {};
  bySubject.forEach((qs, subjectId) => {
    let factor = subjectFactor(subjectId, weights, settings, today);
    if (profile.adjustmentMode === 'auto') {
      const agg = qs.reduce(
        (acc, q) => ({
          timesShown: acc.timesShown + q.stats.timesShown,
          timesCorrect: acc.timesCorrect + q.stats.timesCorrect,
          timesWrong: acc.timesWrong + q.stats.timesWrong,
        }),
        { timesShown: 0, timesCorrect: 0, timesWrong: 0 }
      );
      factor *= autoAdjustFactor(agg);
    }
    shares[subjectId] = factor;
    poolSizes[subjectId] = qs.length;
  });

  const quotas = largestRemainderAllocate(shares, poolSizes, M);

  const sampled = [];
  bySubject.forEach((qs, subjectId) => {
    const picks = weightedSampleWithoutReplacement(
      qs,
      (q) => questionEffectiveWeight(q, weights),
      quotas[subjectId] || 0,
      rng
    );
    sampled.push(...picks);
  });

  const merged = shuffle(
    [...forced, ...sampled].map((q) => ({ questionId: q.id, retry: false })),
    rng
  );

  return { queue: merged, cyclesOut };
}
