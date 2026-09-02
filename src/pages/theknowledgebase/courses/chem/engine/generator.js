// Template registry + deterministic instance builder for the Chem curriculum.
//
// Ported from afoqt/engine/generator.js (registerTemplate/generateInstance/h.choices) — same
// idea (a template is a pure seeded function; (templateId, seed) regenerates a question
// byte-identically; a difficulty band makes "iterate at the same difficulty" structural, not a
// matter of discipline — see QUESTION-DOCTRINE.md) — but stripped of everything AFOQT-specific
// that Chem doesn't need: no SHEET_BITS/figure-sharing, no stretch/ceiling bands, no
// stemSpace/provenance/calibratedAgainst fields, no per-subtest choice count (Chem is always
// 4-option, matching how ACS's own Study/Practice Questions are formatted).
//
// This is a deliberately separate registry from AFOQT's — see courses/chem/PLAN.md for why
// (bolting a fake "subtest" onto AFOQT's registry would corrupt afoqt:coverage/afoqt:selftest,
// which are hardcoded to the 12 real AFOQT subtests).

import { mulberry32, shuffle, randInt } from '../../../engine/rng.js';

const CHOICES_PER_QUESTION = 4;

/** @type {Map<string, ChemTemplate>} */
const registry = new Map();

/**
 * @typedef {Object} ChemTemplate
 * @property {string} id
 * @property {string} chapterId          curriculum.js chapter id (ACS ordering); coverage checks this
 * @property {string} [section]          book section, e.g. '4-3' (course ordering). See syllabusMap.js
 *                                       for why a template needs BOTH coordinates.
 * @property {1|2|3|4|5} band            1-3 = course level (what the instructor tests)
 *                                       4-5 = ACS level (the standardized final; harder)
 *                                       engine/gates.js turns this split into the two gate tests.
 * @property {string} name
 * @property {string[]} concepts          chapter concept ids this template tests
 * @property {(rng: () => number, h: Helpers) => RawInstance} generate
 */

/**
 * @typedef {Object} RawInstance
 * @property {string} stem
 * @property {string[]} choices           correct answer at index `correctIndex`
 * @property {number} correctIndex
 * @property {string} [explanation]
 * @property {(string|null)[]} [errors]   per-choice error-mode id, from h.choices
 * @property {(string|null)[]} [whys]
 */

export function registerChemTemplate(t) {
  if (!t?.id) throw new Error('chem template needs an id');
  if (registry.has(t.id)) throw new Error(`duplicate chem template id: ${t.id}`);
  // 1-3 course level, 4-5 ACS level. Widened from 1-3 on 2026-09-02: the ACS gate needs a band
  // above what the course itself demands, and the old ceiling made that literally unrepresentable.
  if (!(t.band >= 1 && t.band <= 5)) throw new Error(`${t.id}: band must be 1-5`);
  if (!t.chapterId) throw new Error(`${t.id}: chapterId required`);
  if (typeof t.generate !== 'function') throw new Error(`${t.id}: generate() required`);
  registry.set(t.id, t);
  return t;
}

export const getChemTemplate = (id) => registry.get(id) ?? null;
export const allChemTemplates = () => [...registry.values()];
export const chemTemplatesFor = (chapterId) => allChemTemplates().filter((t) => t.chapterId === chapterId);
export function _resetChemRegistry() { registry.clear(); }

/** Same contract as afoqt/engine/generator.js's makeHelpers — see that file for the reasoning. */
function makeHelpers(rng, seed) {
  return {
    rng,
    seed,
    int: (min, max) => randInt(rng, min, max),
    pick: (arr) => arr[Math.floor(rng() * arr.length)],
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
        pool.push({ value, error: tagged ? (d.error ?? null) : null, why: tagged ? (d.why ?? null) : null });
        if (pool.length >= CHOICES_PER_QUESTION - 1) break;
      }
      const right = typeof correct === 'object' && correct !== null && 'value' in correct
        ? { value: correct.value, error: null, why: null }
        : { value: correct, error: null, why: null };
      const all = shuffle([right, ...pool], rng);
      return {
        choices: all.map((e) => String(e.value)),
        correctIndex: all.indexOf(right),
        errors: labelled ? all.map((e) => e.error) : null,
        whys: labelled ? all.map((e) => e.why) : null,
      };
    },
  };
}

/**
 * Build one question. Deterministic: same (templateId, seed) => identical output forever.
 */
export function generateChemInstance(templateId, seed) {
  const t = registry.get(templateId);
  if (!t) return null;
  const rng = mulberry32(seed);
  const raw = t.generate(rng, makeHelpers(rng, seed));
  if (!raw) return null;
  return {
    templateId: t.id,
    seed,
    chapterId: t.chapterId,
    // Carried through explicitly. This return is a WHITELIST - a field the template sets but this
    // object omits vanishes with no error anywhere, which is exactly how AFOQT lost its `vocab`
    // field for a whole build (theknowledgebase/CLAUDE.md). There is a test for this.
    section: t.section ?? null,
    band: t.band,
    concepts: t.concepts ?? [],
    stem: raw.stem,
    choices: raw.choices,
    correctIndex: raw.correctIndex,
    explanation: raw.explanation ?? null,
    errors: raw.errors ?? null,
    whys: raw.whys ?? null,
  };
}
