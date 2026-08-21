// Template registry + deterministic instance builder.
//
// The unit of content is a TEMPLATE, not a question - see docs/afoqt/QUESTION-DOCTRINE.md.
// A template carries a difficulty `band` and emits unlimited instances INSIDE that band,
// which is what makes "iterate at the same difficulty" structural rather than a matter of
// discipline.
//
// An instance is identified by (templateId, seed). The same pair always regenerates the
// identical question, so missed items can be replayed without storing any question text.

import { mulberry32, shuffle, randInt } from '../../engine/rng.js';
import { SUBTEST_BY_CODE } from './afoqtSpec.js';

/** @type {Map<string, Template>} */
const registry = new Map();

/**
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} subtest              two-letter code from afoqtSpec
 * @property {1|2|3|4|5} band              difficulty band - THE doctrine rule, made structural
 * @property {string} name
 * @property {string[]} concepts           chapter concept ids; afoqt:coverage checks these
 * @property {number} [timeSec]            defaults to the subtest pace
 * @property {boolean} [stretch]           Trivium-grade: concept practice, not pace practice
 * @property {string} [calibratedAgainst]  'barrons' | 'trivium' | 'oatts' | 'phillips'
 * @property {boolean} [sheet]             every question in one run shares a figure - see SHEET_BITS
 * @property {number}  [sheetSpan]         how many questions ONE figure is good for before the
 *                                         run moves to a fresh one. Omit for a figure that can
 *                                         carry a whole subtest (a 33x33 table); set it where
 *                                         the figure holds only a few items (a block pile)
 * @property {boolean} [drillOnly]         a training aid, never an exam item: either a question
 *                                         shape the real test does not use, or a deliberately
 *                                         skewed slice of one that does
 * @property {number} [stemSpace]          declared size of a genuinely bounded item space
 * @property {object} [provenance]
 * @property {(rng: () => number, helpers: Helpers) => RawInstance} generate
 */

/**
 * @typedef {Object} RawInstance
 * @property {string} stem
 * @property {string[]} choices            correct answer at index `correctIndex`
 * @property {number} correctIndex
 * @property {string} [explanation]
 * @property {string[]} [tags]
 * @property {object} [render]             { kind: 'blocks'|'instrument'|'table', ... }
 * @property {(string|null)[]} [errors]    per-choice error-mode id, from h.choices
 */

/**
 * Some subtests present ONE figure and ask many questions against it - Table Reading uses a
 * single 33x33 grid for all 40 questions, and Block Counting reuses one pile for 5-13. A
 * template that redrew its figure every question would quietly destroy pace fidelity: every
 * question becomes question one, re-orienting from scratch, and the seconds that costs are
 * seconds the real test does not charge you.
 *
 * So a seed is split. The high bits pick the FIGURE and the low bits pick the QUESTION:
 *
 *     seed = [ figure: 20 bits ][ item: 12 bits ]
 *
 * `buildDrill` holds the high bits fixed across a run and walks the low bits, so every
 * question in that drill lands on the same figure. Crucially the instance is still a pure
 * function of its seed alone, so (templateId, seed) still regenerates byte-identically and
 * the miss pool keeps working untouched.
 */
export const SHEET_BITS = 12;
export const SHEET_ITEMS = 1 << SHEET_BITS;
export const sheetSeedOf = (seed) => (seed >>> SHEET_BITS) >>> 0;
export const composeSeed = (sheetSeed, item) =>
  (((sheetSeed & 0xfffff) << SHEET_BITS) | (item & (SHEET_ITEMS - 1))) >>> 0;

export function registerTemplate(t) {
  if (!t?.id) throw new Error('template needs an id');
  if (registry.has(t.id)) throw new Error(`duplicate template id: ${t.id}`);
  if (!(t.band >= 1 && t.band <= 5)) throw new Error(`${t.id}: band must be 1-5`);
  if (typeof t.generate !== 'function') throw new Error(`${t.id}: generate() required`);
  if (t.sheetSpan && !t.sheet) throw new Error(`${t.id}: sheetSpan needs sheet: true`);
  if (t.varies && t.varies !== 'options') throw new Error(`${t.id}: varies must be 'options'`);
  registry.set(t.id, t);
  return t;
}

export const getTemplate = (id) => registry.get(id) ?? null;
export const allTemplates = () => [...registry.values()];
export const templatesFor = (subtest) => allTemplates().filter((t) => t.subtest === subtest);
export function _resetRegistry() { registry.clear(); }

/**
 * Helpers passed to every generate(). Keeping distractor construction here is deliberate:
 * a wrong choice must be the result of a PLAUSIBLE MISTAKE, never a random number, or the
 * item is trivially eliminable and teaches nothing.
 */
function makeHelpers(rng, need, seed) {
  return {
    rng,
    seed,
    /** High bits of the seed: the figure this question is asked against. See SHEET_BITS. */
    sheetSeed: sheetSeedOf(seed),
    /**
     * Low bits: which item this is on that figure. A run walks these in order, so a template
     * whose figure holds a small fixed set of items can index by it and be sure of asking
     * each one exactly once - which is what the real test does with a numbered block pile.
     * Drawing at random instead leaves it to chance, and chance repeats.
     */
    item: seed & (SHEET_ITEMS - 1),
    int: (min, max) => randInt(rng, min, max),
    pick: (arr) => arr[Math.floor(rng() * arr.length)],
    /**
     * Assemble and shuffle choices, returning the correct index after the shuffle.
     *
     * Distractors are deduplicated, so a template SHOULD over-supply error-modes: two
     * plausible mistakes often coincide for particular parameters (e.g. e1+e2 === e1*e2
     * when both are 2), which would otherwise silently yield a 4-option question on a
     * 5-option subtest. Supply extras; the first `need - 1` distinct ones are used.
     *
     * If a template still cannot fill the slate the shortfall is returned as-is rather
     * than padded with invented numbers - padding would violate the error-mode rule, and
     * the template selftest fails loudly so the template gets fixed instead.
     *
     * A distractor may be a bare value or `{ value, error, why, render }`. Naming the error is
     * worth doing where the mistakes are nameable and repeatable - on Table Reading, "you read Y
     * as ascending on four of your five misses" is a diagnosis, where "4/5" is just a score. The
     * labels ride through the shuffle and come back as `errors`, aligned to `choices`.
     *
     * `render` carries a figure for an option that IS a picture. Instrument Comprehension offers
     * four aircraft silhouettes rather than four phrases, so its `value` is a canonical
     * description - which the runner keeps for screen readers and for the post-drill review, but
     * never shows beside the figure while the question is live.
     */
    choices(correct, distractors) {
      const seen = new Set([String(typeof correct === 'object' && correct !== null && 'value' in correct ? correct.value : correct)]);
      const pool = [];
      let labelled = false;
      for (const d of distractors) {
        const tagged = d !== null && typeof d === 'object' && 'value' in d;
        if (tagged) labelled = true;
        const value = tagged ? d.value : d;
        const k = String(value);
        if (seen.has(k)) continue;
        seen.add(k);
        pool.push({
          value,
          error: tagged ? (d.error ?? null) : null,
          why: tagged ? (d.why ?? null) : null,
          render: tagged ? (d.render ?? null) : null,
        });
        if (need && pool.length >= need - 1) break;
      }
      // Identity, not equality: a distractor is allowed to stringify to the same thing as
      // another entry that was deduped away, and indexOf on the value would find the wrong one.
      const right = typeof correct === 'object' && correct !== null && 'value' in correct
        ? { value: correct.value, error: null, why: null, render: correct.render ?? null }
        : { value: correct, error: null, why: null, render: null };
      const all = shuffle([right, ...pool], rng);
      const anyRender = all.some((e) => e.render);
      return {
        choices: all.map((e) => String(e.value)),
        correctIndex: all.indexOf(right),
        errors: labelled ? all.map((e) => e.error) : null,
        whys: labelled ? all.map((e) => e.why) : null,
        optionRender: anyRender ? all.map((e) => e.render) : null,
      };
    },
  };
}

/** Stable 32-bit seed from a string, so seeds can be human-readable if useful. */
export function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build one question. Deterministic: same (templateId, seed) => identical output forever.
 * @returns {Instance|null}
 */
export function generateInstance(templateId, seed) {
  const t = registry.get(templateId);
  if (!t) return null;
  const rng = mulberry32(seed);
  const need = SUBTEST_BY_CODE[t.subtest]?.choices ?? null;
  const raw = t.generate(rng, makeHelpers(rng, need, seed));
  if (!raw) return null;
  return {
    templateId: t.id,
    seed,
    subtest: t.subtest,
    band: t.band,
    stretch: !!t.stretch,
    timeSec: t.timeSec ?? null,
    concepts: t.concepts ?? [],
    provenance: t.provenance ?? { kind: 'authored' },
    stem: raw.stem,
    choices: raw.choices,
    correctIndex: raw.correctIndex,
    explanation: raw.explanation ?? null,
    tags: raw.tags ?? [],
    render: raw.render ?? null,
    errors: raw.errors ?? null,
    whys: raw.whys ?? null,
    optionRender: raw.optionRender ?? null,
  };
}

/**
 * Build a drill queue. `weights` biases template selection (the miss pool uses this to
 * resurface weak material at ~10%); absent weights, selection is uniform across the
 * matching templates.
 */
export function buildDrill({ subtest, count, rng, band = null, filter = null, includeStretch = false, weightFor = null, distinct = false, sheet = null, exam = false }) {
  let pool = templatesFor(subtest);
  if (band != null) pool = pool.filter((t) => t.band === band);
  // An exam simulation has to be the real test, not a practice mix. Training aids - a
  // deliberately easy slice of a grid, or a question shape the real subtest never asks - are
  // exactly what makes a simulated score meaningless.
  if (exam) pool = pool.filter((t) => !t.drillOnly);
  // `filter` is the general form - the curriculum uses it to scope a drill to one chapter's
  // concepts and band range, which is what the test-out gate and mastery check run on.
  if (filter) pool = pool.filter(filter);
  if (!includeStretch) pool = pool.filter((t) => !t.stretch);
  if (pool.length === 0) return [];

  // `distinct` deals a shuffled round of the whole pool before repeating any template. It
  // matters most on a short chapter gate: uniform random sampling of 7 templates into 5 slots
  // asked two isosceles-triangle questions and never asked about the transversal at all, which
  // is not a valid test of the chapter. Weighted selection (the miss pool) opts out on purpose -
  // repeating weak material is the entire point there.
  const order = distinct && !weightFor ? dealRounds(pool, count, rng) : null;

  // One figure for the whole run, where the subtest works that way. The item index is walked
  // rather than drawn at random so no two questions in a drill can collide onto the same seed
  // and repeat themselves verbatim.
  const runSheet = sheet ?? randInt(rng, 0, 0xfffff);

  // ...except where one figure cannot carry a whole subtest. A Table Reading grid holds 1,089
  // cells and serves all 40 questions, which is what the real test does. A Block Counting pile
  // numbers six blocks and the real test rotates through several piles - "one pile image serves
  // 5-13 numbered questions". A template says how many questions its figure is good for via
  // `sheetSpan`, and the run advances to a fresh figure after that many.
  //
  // Without this a 30-question Block Counting exam asked SIX distinct questions and repeated
  // the other 24, which no structural check would ever have flagged.
  const sheetAt = (t, i) => (t.sheetSpan ? (runSheet + Math.floor(i / t.sheetSpan)) & 0xfffff : runSheet);

  const out = [];
  const asked = new Set();
  let item = 0;
  for (let i = 0; i < count; i++) {
    const t = order
      ? order[i]
      : weightFor ? weightedPick(pool, weightFor, rng) : pool[Math.floor(rng() * pool.length)];
    let inst = null;
    // Two templates sharing a figure can land on the same part of it - a band-3 and a band-4
    // Table Reading item both picking cell (+9, -13) asks the identical question twice in one
    // run. Walk the item index on rather than shipping a visible repeat. Bounded, because a
    // template with a small item space is allowed to repeat eventually.
    const mySheet = sheetAt(t, i);
    for (let tries = 0; tries < 16; tries++) {
      const seed = t.sheet ? composeSeed(mySheet, item++) : Math.floor(rng() * 0xffffffff) >>> 0;
      inst = generateInstance(t.id, seed);
      // Keyed by figure as well as stem: "how many blocks does block 2 touch" is a different
      // question on a different pile, so a stem-only key would suppress legitimate items once
      // the figure rotates.
      if (!inst || !t.sheet || !asked.has(`${mySheet}:${inst.stem}`)) break;
    }
    if (inst) { asked.add(`${sheetAt(t, i)}:${inst.stem}`); out.push(inst); }
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

function weightedPick(pool, weightFor, rng) {
  const weights = pool.map((t) => Math.max(1e-9, weightFor(t)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
