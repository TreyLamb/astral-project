// Drill queue assembly for the Chem curriculum. Ported-down from afoqt/engine/generator.js's
// buildDrill: keeps distinct round-dealing (so a short chapter gate samples the whole template
// pool before repeating one) and stem-based dedup-on-retry (so one sitting can't ask the same
// question twice). Deliberately drops everything AFOQT-specific: no figure/sheet system, no
// miss-pool weighting, no bank-mixing, no exam pacing — see courses/chem/PLAN.md for why.

import { shuffle } from '../../../engine/rng.js';
import { chemTemplatesFor, allChemTemplates, generateChemInstance } from './generator.js';

const DEDUP_TRIES = 16;

/**
 * @param {Object} opts
 * @param {number} opts.count
 * @param {() => number} opts.rng
 * @param {string} [opts.chapterId]   scope to one chapter's templates; omit for cross-chapter
 *                                    (mass-review) pulls from every registered template
 * @param {boolean} [opts.distinct]   deal a shuffled round of the whole pool before repeating —
 *                                    used for the gate/mastery check, same reasoning AFOQT's
 *                                    buildDrill documents: uniform random sampling of a small
 *                                    pool can skip a concept entirely on a short run.
 * @returns {Object[]} Instance[]
 */
export function buildChemDrill({ count, rng, chapterId = null, distinct = false }) {
  const pool = chapterId ? chemTemplatesFor(chapterId) : allChemTemplates();
  if (pool.length === 0) return [];

  const order = distinct ? dealRounds(pool, count, rng) : null;
  const out = [];
  const asked = new Set();

  for (let i = 0; i < count; i++) {
    const t = order ? order[i] : pool[Math.floor(rng() * pool.length)];
    let inst = null;
    for (let tries = 0; tries < DEDUP_TRIES; tries++) {
      const seed = Math.floor(rng() * 0xffffffff) >>> 0;
      inst = generateChemInstance(t.id, seed);
      if (!inst || !asked.has(inst.stem)) break;
    }
    if (inst) { asked.add(inst.stem); out.push(inst); }
  }
  return out;
}

/** Repeated shuffled passes over the pool, so nothing repeats until everything has appeared. */
function dealRounds(pool, count, rng) {
  const out = [];
  while (out.length < count) {
    const round = shuffle(pool, rng);
    for (const t of round) {
      if (out.length >= count) break;
      out.push(t);
    }
  }
  return out;
}
