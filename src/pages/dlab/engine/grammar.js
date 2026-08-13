// Grammar layer: rolls the parameter vector that defines one language's
// structure, then builds the actual morphemes that realize those parameters.
//
// This file is the anti-staleness axis of the whole tool. Every value below
// multiplies with every other, so two consecutive sittings are structurally
// different languages rather than the same language with different spellings.
// See RECENT_PARAM_MEMORY / paramDistance for the filter that enforces it.

import { makeStem, renderWord, stressIndex, vowelClass } from './phonology.js';
import { pick, randInt } from './rng.js';

export const WORD_ORDERS = ['SOV', 'SVO', 'VSO', 'VOS', 'OSV', 'OVS'];
export const ADJ_PLACEMENTS = ['pre', 'post'];
export const POSSESSION_MODES = ['possessorSuffix', 'possessorPrefix', 'particle', 'headMarked'];
export const PLURAL_MODES = ['suffix', 'prefix', 'reduplication', 'ablaut', 'numeralOnly'];
export const CASE_MODES = ['nomAccSuffix', 'ergative', 'particle', 'prefix', 'wordOrderOnly'];
export const TENSE_MODES = ['suffix', 'prefix', 'auxiliary', 'vowelChange'];
export const NEGATION_MODES = ['prefix', 'suffix', 'preverbalParticle', 'finalParticle', 'circumfix'];
export const QUESTION_MODES = ['initialParticle', 'finalParticle', 'inversion', 'verbSuffix'];
export const AGREEMENT_MODES = ['verbSubject', 'adjNoun', 'none'];
export const DEFINITENESS_MODES = ['prefix', 'suffix', 'clitic', 'none'];
export const MORPHOPHONOLOGY_MODES = ['none', 'vowelHarmony', 'assimilation', 'linkingVowel', 'syllableAllomorph', 'stressAllomorph'];

// The axes compared when rejecting a language for being too similar to a recent
// one. Stress rule lives in phonology but is a structural axis, so it counts.
export const GRAMMAR_AXES = [
  'wordOrder', 'adjPlacement', 'possession', 'possessorFirst', 'plural',
  'caseMarking', 'tense', 'negation', 'question', 'agreement',
  'definiteness', 'morphophonology', 'stressRule',
];

// How many past parameter vectors to remember, and how many axes must differ
// before a candidate is accepted. 5 of 13 is strict enough that a repeat feels
// like a different language, loose enough that generation still terminates fast.
export const RECENT_PARAM_MEMORY = 20;
export const MIN_AXIS_DIFFERENCE = 5;

/**
 * Count of axes on which two parameter vectors differ.
 * @param {Record<string, unknown>} a
 * @param {Record<string, unknown>} b
 * @returns {number}
 */
export function paramDistance(a, b) {
  let d = 0;
  for (const axis of GRAMMAR_AXES) {
    if (a[axis] !== b[axis]) d += 1;
  }
  return d;
}

/**
 * @param {Record<string, unknown>} candidate
 * @param {Record<string, unknown>[]} recent
 * @returns {boolean} true when the candidate is structurally distinct enough
 */
export function isDistinctEnough(candidate, recent) {
  return recent.every((prev) => paramDistance(candidate, prev) >= MIN_AXIS_DIFFERENCE);
}

/**
 * @typedef {Object} Grammar
 * @property {string} wordOrder
 * @property {'pre'|'post'} adjPlacement
 * @property {string} possession
 * @property {boolean} possessorFirst
 * @property {string} plural
 * @property {string} caseMarking
 * @property {string} tense
 * @property {string} negation
 * @property {string} question
 * @property {string} agreement
 * @property {string} definiteness
 * @property {string} morphophonology
 */

/**
 * @param {() => number} rng
 * @param {import('./phonology.js').Phonology} phon
 * @returns {Grammar}
 */
export function rollGrammar(rng, phon) {
  const wordOrder = pick(WORD_ORDERS, rng);
  const adjPlacement = pick(ADJ_PLACEMENTS, rng);
  const possession = pick(POSSESSION_MODES, rng);
  const possessorFirst = rng() < 0.6;
  const plural = pick(PLURAL_MODES, rng);
  const caseMarking = pick(CASE_MODES, rng);
  const tense = pick(TENSE_MODES, rng);
  const negation = pick(NEGATION_MODES, rng);
  const question = pick(QUESTION_MODES, rng);
  const agreement = pick(AGREEMENT_MODES, rng);
  const definiteness = pick(DEFINITENESS_MODES, rng);
  let morphophonology = pick(MORPHOPHONOLOGY_MODES, rng);

  // Ablaut plural and vowel-change tense both work by swapping a nucleus, so a
  // language using both would need four distinct vowels reserved for grammar
  // alone and would read as noise. Demote one.
  const resolvedTense = plural === 'ablaut' && tense === 'vowelChange' ? pick(['suffix', 'prefix', 'auxiliary'], rng) : tense;

  // Every morphophonological rule fires at an affix boundary. A language whose
  // markers are all separate particles has no boundary for it to fire at, so
  // the rules brief would be stating a rule the language never demonstrates.
  const hasAffixBoundary =
    plural === 'suffix' || plural === 'prefix' ||
    resolvedTense === 'suffix' || resolvedTense === 'prefix' ||
    ['nomAccSuffix', 'ergative', 'prefix'].includes(caseMarking) ||
    ['prefix', 'suffix', 'circumfix'].includes(negation) ||
    ['prefix', 'suffix'].includes(definiteness);
  if (!hasAffixBoundary) morphophonology = 'none';
  // Harmony needs both classes present to alternate between.
  if (morphophonology === 'vowelHarmony' && (phon.frontVowels.length === 0 || phon.backVowels.length === 0)) {
    morphophonology = 'none';
  }
  // Linking vowels and assimilation only ever surface after a closed syllable.
  if ((morphophonology === 'linkingVowel' || morphophonology === 'assimilation') && phon.template === 'CV') {
    morphophonology = 'none';
  }

  // Inversion forms a question by fronting the verb. In a verb-initial language
  // the verb is already fronted, so the question would be string-identical to
  // the statement — an unanswerable item. Verb-initial languages get a particle.
  const resolvedQuestion =
    question === 'inversion' && wordOrder.startsWith('V')
      ? pick(['initialParticle', 'finalParticle', 'verbSuffix'], rng)
      : question;

  return {
    wordOrder,
    adjPlacement,
    possession,
    possessorFirst,
    plural,
    caseMarking,
    tense: resolvedTense,
    negation,
    question: resolvedQuestion,
    agreement,
    definiteness,
    morphophonology,
  };
}

/**
 * @typedef {Object} Affix
 * @property {string} id
 * @property {import('./phonology.js').Syllable[]} syllables
 * @property {import('./phonology.js').Syllable[]} [altFront]
 * @property {import('./phonology.js').Syllable[]} [altBack]
 * @property {import('./phonology.js').Syllable[]} [altLong]
 * @property {import('./phonology.js').Syllable[]} [altFinalStress]
 */

/**
 * Builds a unique 1-syllable morpheme, plus whatever alternants the language's
 * morphophonological rule requires. `taken` is mutated so no two morphemes in a
 * language ever render identically — the homophony validator depends on this.
 * @returns {Affix}
 */
export function makeAffix(id, phon, grammar, rng, taken) {
  let syllables = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = makeStem(phon, 1, rng);
    const form = renderWord(candidate);
    if (!taken.has(form)) {
      taken.add(form);
      syllables = candidate;
      break;
    }
  }
  if (!syllables) syllables = makeStem(phon, 2, rng);

  const affix = { id, syllables };

  if (grammar.morphophonology === 'vowelHarmony') {
    const base = syllables[0];
    affix.altFront = [{ ...base, nucleus: pick(phon.frontVowels, rng) }];
    affix.altBack = [{ ...base, nucleus: pick(phon.backVowels, rng) }];
  }
  if (grammar.morphophonology === 'syllableAllomorph') {
    affix.altLong = [{ ...syllables[0], onset: pick(phon.onsets, rng) }];
  }
  if (grammar.morphophonology === 'stressAllomorph') {
    affix.altFinalStress = [{ ...syllables[0], nucleus: pick(phon.vowels, rng) }];
  }

  return affix;
}

const VOICED = new Set(['b', 'd', 'g', 'z', 'v', 'm', 'n', 'l', 'r', 'w', 'y', 'ng']);
const DEVOICE = { b: 'p', d: 't', g: 'k', z: 's', v: 'f' };
const VOICE = { p: 'b', t: 'd', k: 'g', s: 'z', f: 'v' };

/**
 * Resolves an affix to its surface syllables in the context of the stem it is
 * attaching to, applying the language's one morphophonological rule.
 *
 * Returns the resolved syllables plus a `note` describing what fired, so
 * compose.js can put a truthful line in the trace without re-deriving it.
 *
 * @param {Affix} affix
 * @param {import('./phonology.js').Syllable[]} stem
 * @param {'suffix'|'prefix'} position
 * @param {{phon: import('./phonology.js').Phonology, grammar: Grammar}} lang
 * @returns {{syllables: import('./phonology.js').Syllable[], note: string|null}}
 */
export function resolveAffix(affix, stem, position, lang) {
  const { phon, grammar } = lang;
  const mode = grammar.morphophonology;

  if (mode === 'vowelHarmony' && affix.altFront && affix.altBack) {
    // A prefix harmonises to the vowel it precedes, a suffix to the one it
    // follows — in both cases the nearest stem vowel across the boundary.
    const neighbour = position === 'suffix' ? stem[stem.length - 1] : stem[0];
    const cls = vowelClass(neighbour.nucleus);
    return {
      syllables: cls === 'front' ? affix.altFront : affix.altBack,
      note: `vowel harmony: the neighbouring stem vowel "${neighbour.nucleus}" is ${cls}, so the ${cls} form is used`,
    };
  }

  if (mode === 'syllableAllomorph' && affix.altLong) {
    const long = stem.length >= 3;
    return {
      syllables: long ? affix.altLong : affix.syllables,
      note: `syllable-count allomorphy: the stem has ${stem.length} syllables, so the ${long ? 'long-stem' : 'short-stem'} form is used`,
    };
  }

  if (mode === 'stressAllomorph' && affix.altFinalStress) {
    const finalStress = stressIndex(stem, phon) === stem.length - 1;
    return {
      syllables: finalStress ? affix.altFinalStress : affix.syllables,
      note: `stress-conditioned allomorphy: stem stress ${finalStress ? 'is' : 'is not'} on the final syllable, so the ${finalStress ? 'final-stress' : 'default'} form is used`,
    };
  }

  if (mode === 'assimilation' && position === 'suffix') {
    const lastCoda = stem[stem.length - 1].coda;
    const onset = affix.syllables[0].onset;
    if (lastCoda && onset) {
      const stemVoiced = VOICED.has(lastCoda);
      const target = stemVoiced ? VOICE[onset] : DEVOICE[onset];
      if (target && target !== onset) {
        return {
          syllables: [{ ...affix.syllables[0], onset: target }],
          note: `assimilation: the stem ends in ${stemVoiced ? 'a voiced' : 'an unvoiced'} "${lastCoda}", so the suffix's "${onset}" becomes "${target}"`,
        };
      }
    }
  }

  if (mode === 'linkingVowel' && position === 'suffix') {
    const lastCoda = stem[stem.length - 1].coda;
    const onset = affix.syllables[0].onset;
    if (lastCoda && onset) {
      const linker = phon.vowels[0];
      return {
        syllables: [{ onset: '', nucleus: linker, coda: '' }, ...affix.syllables],
        note: `linking vowel: the stem ends in the consonant "${lastCoda}" and the suffix begins with "${onset}", so "${linker}" is inserted between them`,
      };
    }
  }

  return { syllables: affix.syllables, note: null };
}

/**
 * Number of syllables a root should have. Two is the default so affixation
 * stays audible; a minority of three-syllable roots exist specifically so that
 * syllable-count allomorphy and antepenultimate stress have something to bite on.
 * @param {() => number} rng
 */
export function rootLength(rng) {
  return randInt(rng, 1, 10) <= 7 ? 2 : 3;
}
