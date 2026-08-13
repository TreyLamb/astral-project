// Ties phonology + grammar + lexicon into one language object.
//
// A language is a pure function of its seed. That is the whole contract the
// rest of the engine leans on: the same seed reproduces the same language, the
// same items and the same answers, forever — which is what makes a test
// shareable, retakeable, and fuzz-testable.

import { mulberry32, makeSeedCode, seedFromString } from './rng.js';
import { rollPhonology } from './phonology.js';
import { rollGrammar, isDistinctEnough, GRAMMAR_AXES } from './grammar.js';
import { buildLexicon } from './lexicon.js';

/**
 * @typedef {Object} Language
 * @property {number} seed
 * @property {string} seedCode
 * @property {import('./phonology.js').Phonology} phon
 * @property {import('./grammar.js').Grammar} grammar
 * @property {import('./lexicon.js').Lexicon} lex
 */

/**
 * @param {number} seed
 * @returns {Language}
 */
export function rollLanguage(seed) {
  const rng = mulberry32(seed);
  const seedCode = makeSeedCode(rng);
  const phon = rollPhonology(rng);
  const grammar = rollGrammar(rng, phon);
  const lex = buildLexicon(phon, grammar, rng);
  return { seed, seedCode, phon, grammar, lex };
}

/** @param {string} code */
export function rollLanguageFromCode(code) {
  return rollLanguage(seedFromString(String(code).trim().toUpperCase()));
}

/**
 * The comparable structural signature of a language — what the anti-staleness
 * filter remembers between sittings. Deliberately excludes the lexicon: two
 * languages with identical grammar but different roots are the SAME test to
 * practise against, and remembering the roots would defeat the filter.
 * @param {Language} language
 * @returns {Record<string, unknown>}
 */
export function paramVector(language) {
  const v = {};
  for (const axis of GRAMMAR_AXES) {
    v[axis] = axis === 'stressRule' ? language.phon.stressRule : language.grammar[axis];
  }
  return v;
}

/**
 * Rolls a language that is structurally distinct from the recent history.
 *
 * Falls back to the best-available candidate rather than looping forever: a
 * user who has just taken twenty tests should still get a test, and "as
 * different as we could manage" beats "spinner". The chosen seed is returned so
 * the sitting stays reproducible either way.
 *
 * @param {number} startSeed
 * @param {Record<string, unknown>[]} recentVectors
 * @param {number} [maxAttempts]
 * @returns {{language: Language, attempts: number, forced: boolean}}
 */
export function rollDistinctLanguage(startSeed, recentVectors = [], maxAttempts = 40) {
  let best = null;
  let bestScore = -1;

  for (let i = 0; i < maxAttempts; i++) {
    // Stepping by a large odd constant rather than +1 keeps consecutive
    // attempts from landing in correlated regions of the PRNG's output.
    const seed = (startSeed + i * 0x9e3779b1) >>> 0;
    const language = rollLanguage(seed);
    const vec = paramVector(language);

    if (isDistinctEnough(vec, recentVectors)) {
      return { language, attempts: i + 1, forced: false };
    }

    const score = recentVectors.reduce((min, prev) => {
      let d = 0;
      for (const axis of GRAMMAR_AXES) if (vec[axis] !== prev[axis]) d += 1;
      return Math.min(min, d);
    }, Infinity);
    if (score > bestScore) {
      bestScore = score;
      best = language;
    }
  }

  return { language: best ?? rollLanguage(startSeed), attempts: maxAttempts, forced: true };
}
