// Lexicon layer: fixed semantic slots get generated roots, and the grammar
// parameters get the concrete morphemes that realize them.
//
// English meanings deliberately recur across sittings — what changes every time
// is the form attached to them. A test-taker cannot pre-learn "the word for dog"
// because it is different every sitting, and having a stable meaning inventory
// is what lets item templates be written once.

import { makeStem, renderWord } from './phonology.js';
import { makeAffix, rootLength } from './grammar.js';
import { pick } from './rng.js';

export const NOUNS = [
  'dog', 'cat', 'house', 'tree', 'water', 'stone', 'bird', 'fish', 'man', 'woman',
  'child', 'river', 'mountain', 'road', 'book', 'fire', 'sun', 'moon', 'horse', 'door',
];

export const VERBS = [
  'see', 'eat', 'run', 'give', 'take', 'make', 'sleep', 'walk',
  'hear', 'want', 'find', 'carry', 'know', 'break',
];

export const ADJECTIVES = [
  'big', 'small', 'red', 'old', 'new', 'good', 'bad', 'tall', 'cold', 'hot', 'heavy', 'fast',
];

export const PRONOUNS = ['I', 'you', 'he', 'we', 'they'];
export const NUMERALS = ['one', 'two', 'three', 'many'];
export const QUESTION_WORDS = ['who', 'what', 'where'];
export const PREPOSITIONS = ['in', 'on', 'near', 'with'];

/**
 * Cyclic vowel shift. WHY cyclic rather than "replace with vowel X": a fixed
 * target vowel silently produces an identical singular and plural whenever the
 * root already contains it, which is an ambiguous item that no amount of
 * downstream validation can rescue. Shifting along the series can never be the
 * identity, and it states cleanly in the rules brief as "a -> e -> i -> o -> a".
 * @param {string} nucleus
 * @param {string[]} series
 * @param {1|-1} direction
 * @returns {string}
 */
export function shiftVowel(nucleus, series, direction) {
  const idx = series.indexOf(nucleus);
  if (idx === -1) return series[0];
  const next = (idx + direction + series.length) % series.length;
  return series[next];
}

/**
 * Applies a cyclic shift to the last syllable's nucleus.
 * @param {import('./phonology.js').Syllable[]} syllables
 * @param {string[]} series
 * @param {1|-1} direction
 * @returns {import('./phonology.js').Syllable[]}
 */
export function ablaut(syllables, series, direction) {
  const out = syllables.map((s) => ({ ...s }));
  const last = out[out.length - 1];
  last.nucleus = shiftVowel(last.nucleus, series, direction);
  return out;
}

function makeRoot(phon, rng, taken) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const stem = makeStem(phon, rootLength(rng), rng);
    const form = renderWord(stem);
    if (!taken.has(form)) {
      taken.add(form);
      return stem;
    }
  }
  // Inventory exhausted at 2-3 syllables — go one longer rather than emit a
  // duplicate, which would break the homophony guarantee outright.
  const stem = makeStem(phon, 4, rng);
  taken.add(renderWord(stem));
  return stem;
}

function makeSet(meanings, phon, rng, taken) {
  const out = {};
  for (const m of meanings) out[m] = makeRoot(phon, rng, taken);
  return out;
}

/**
 * @typedef {Object} Lexicon
 * @property {Record<string, import('./phonology.js').Syllable[]>} nouns
 * @property {Record<string, import('./phonology.js').Syllable[]>} verbs
 * @property {Record<string, import('./phonology.js').Syllable[]>} adjectives
 * @property {Record<string, import('./phonology.js').Syllable[]>} pronouns
 * @property {Record<string, import('./phonology.js').Syllable[]>} numerals
 * @property {Record<string, import('./phonology.js').Syllable[]>} questionWords
 * @property {Record<string, import('./phonology.js').Syllable[]>} prepositions
 * @property {Record<string, import('./grammar.js').Affix>} morphemes
 * @property {string[]} vowelSeries
 */

/**
 * @param {import('./phonology.js').Phonology} phon
 * @param {import('./grammar.js').Grammar} grammar
 * @param {() => number} rng
 * @returns {Lexicon}
 */
export function buildLexicon(phon, grammar, rng) {
  const taken = new Set();

  const lex = {
    nouns: makeSet(NOUNS, phon, rng, taken),
    verbs: makeSet(VERBS, phon, rng, taken),
    adjectives: makeSet(ADJECTIVES, phon, rng, taken),
    pronouns: makeSet(PRONOUNS, phon, rng, taken),
    numerals: makeSet(NUMERALS, phon, rng, taken),
    questionWords: makeSet(QUESTION_WORDS, phon, rng, taken),
    prepositions: makeSet(PREPOSITIONS, phon, rng, taken),
    morphemes: {},
    // Only simple vowels take part in ablaut — shifting a diphthong to a
    // monophthong is not a series step and would not state cleanly as a rule.
    vowelSeries: phon.vowels.filter((v) => v.length === 1),
  };

  const affix = (id) => makeAffix(id, phon, grammar, rng, taken);
  const m = lex.morphemes;

  if (grammar.plural === 'suffix' || grammar.plural === 'prefix') m.plural = affix('plural');

  if (grammar.caseMarking === 'nomAccSuffix' || grammar.caseMarking === 'prefix') {
    // Nominative is the unmarked member in nom-acc systems; marking both would
    // make the contrast redundant and the items trivially mechanical.
    m.accusative = affix('accusative');
  }
  if (grammar.caseMarking === 'ergative') m.ergative = affix('ergative');
  if (grammar.caseMarking === 'particle') {
    m.subjectParticle = affix('subjectParticle');
    m.objectParticle = affix('objectParticle');
  }

  if (grammar.tense === 'suffix' || grammar.tense === 'prefix' || grammar.tense === 'auxiliary') {
    m.past = affix('past');
    m.future = affix('future');
  }

  if (grammar.negation === 'circumfix') {
    m.negation = affix('negation');
    m.negationEnd = affix('negationEnd');
  } else {
    m.negation = affix('negation');
  }

  if (grammar.question !== 'inversion') m.question = affix('question');

  if (grammar.definiteness !== 'none') m.definite = affix('definite');

  if (grammar.possession !== 'headMarked') m.possessive = affix('possessive');
  else m.possessed = affix('possessed');

  if (grammar.agreement === 'verbSubject') m.verbPlural = affix('verbPlural');
  if (grammar.agreement === 'adjNoun') m.adjPlural = affix('adjPlural');

  return lex;
}

/**
 * Every content word in the language, flattened for the vocabulary table in the
 * rules brief and for building distractors.
 * @param {Lexicon} lex
 * @returns {{meaning: string, pos: string, syllables: import('./phonology.js').Syllable[]}[]}
 */
export function allContentWords(lex) {
  const out = [];
  const push = (bag, pos) => {
    for (const [meaning, syllables] of Object.entries(bag)) out.push({ meaning, pos, syllables });
  };
  push(lex.nouns, 'noun');
  push(lex.verbs, 'verb');
  push(lex.adjectives, 'adjective');
  push(lex.pronouns, 'pronoun');
  push(lex.numerals, 'numeral');
  push(lex.questionWords, 'question');
  push(lex.prepositions, 'preposition');
  return out;
}

/**
 * @param {Lexicon} lex
 * @param {() => number} rng
 * @returns {string} a meaning key from NOUNS
 */
export function pickNoun(lex, rng) { return pick(Object.keys(lex.nouns), rng); }
export function pickVerb(lex, rng) { return pick(Object.keys(lex.verbs), rng); }
export function pickAdjective(lex, rng) { return pick(Object.keys(lex.adjectives), rng); }
