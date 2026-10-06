// Drill queue assembly for the Chem curriculum. Ported-down from afoqt/engine/generator.js's
// buildDrill: keeps distinct round-dealing (so a short chapter gate samples the whole template
// pool before repeating one) and stem-based dedup-on-retry (so one sitting can't ask the same
// question twice). Deliberately drops everything AFOQT-specific: no figure/sheet system, no
// miss-pool weighting, no bank-mixing, no exam pacing — see courses/chem/PLAN.md for why.

import { shuffle } from '../../../engine/rng.js';
import { largestRemainderAllocate } from '../../../engine/selection.js';
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
 * @param {boolean} [opts.mentalOnly] restrict to templates flagged `mental` — no arithmetic, so
 *                                    the run is answerable one-handed on a phone. Applied AFTER
 *                                    the chapter scope, so "quick review of chapter 3" works.
 * @param {number[]} [opts.bands]     restrict to these difficulty bands.
 * @param {string[]} [opts.sections]  restrict to these BOOK sections ('1-3', '2-7', …). This is
 *                                    the course coordinate, not the ACS one, and it is what an
 *                                    exam or a quiz is actually scoped by — his syllabus says
 *                                    "Exam 1 covers Ch 1-2" and Canvas titles quizzes
 *                                    "Quiz 12, Sec 4-3 to 4-4". `chapterId` cannot express
 *                                    either, because one course chapter straddles two ACS
 *                                    chapters. See syllabusMap.js for why both exist.
 * @param {Object<string, number>} [opts.chapterWeights] course chapter -> relative weight. Splits
 *                                    `count` across COURSE chapters (largest remainder) instead
 *                                    of drawing uniformly over templates. Without it, the chapter
 *                                    with the most templates dominates the run: once the Ch 1-2
 *                                    real-item pools landed (2026-10-06), a uniform Exam 2 run
 *                                    was ~2/3 review of material Exam 1 already tested.
 * @returns {Object[]} Instance[]
 */
export function buildChemDrill({ count, rng, chapterId = null, distinct = false, mentalOnly = false, bands = null, sections = null, chapterWeights = null }) {
  let pool = chapterId ? chemTemplatesFor(chapterId) : allChemTemplates();
  if (sections) {
    const want = new Set(sections);
    pool = pool.filter((t) => t.section != null && want.has(t.section));
  }
  if (mentalOnly) pool = pool.filter((t) => t.mental === true);
  if (bands) pool = pool.filter((t) => bands.includes(t.band));
  if (pool.length === 0) return [];

  const order = chapterWeights
    ? weightedChapterOrder(pool, count, rng, chapterWeights)
    : distinct ? dealRounds(pool, count, rng) : null;
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

const courseChapterOf = (t) => String(t.section ?? '').split('-')[0];

/** How many questions each course chapter gets, given the weights. Exported for the preview. */
export function allocateByChapter(pool, count, chapterWeights) {
  const shares = {};
  const caps = {};
  for (const t of pool) {
    const ch = courseChapterOf(t);
    shares[ch] = chapterWeights[ch] ?? 1;
    caps[ch] = count;
  }
  return largestRemainderAllocate(shares, caps, count);
}

/** Each chapter's share dealt in distinct rounds (variety first), then the whole run shuffled. */
function weightedChapterOrder(pool, count, rng, chapterWeights) {
  const alloc = allocateByChapter(pool, count, chapterWeights);
  const out = [];
  for (const [ch, n] of Object.entries(alloc)) {
    out.push(...dealRounds(pool.filter((t) => courseChapterOf(t) === ch), n, rng));
  }
  return shuffle(out, rng);
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
