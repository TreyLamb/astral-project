// Phonology layer: rolls one language's sound inventory and builds every root
// and affix from it. Pure — no imports beyond rng, no side effects.
//
// WHY structured syllables instead of plain strings: stress rules need syllable
// COUNT and WEIGHT, morphophonology needs to see a morpheme's first/last
// segment, and the audio layer needs syllable boundaries to respell a word so a
// TTS engine pronounces the constructed syllables instead of guessing at
// English spelling. A flat string throws all three away.
//
// WHY the generated languages are agglutinative (whole-syllable affixes, clean
// morpheme boundaries, no fusion): it makes affixation a list concatenation, so
// there is never a resyllabification step that could produce two defensible
// surface forms. Ambiguity is designed out at this layer rather than checked for
// later. Real agglutinative languages (Turkish, Finnish, Japanese) work exactly
// this way, and DLAB-style constructed languages are overwhelmingly of this type.

import { pick, randInt, sample } from './rng.js';

// Onsets and codas are separate pools because a sound that is fine at the start
// of a syllable is not necessarily fine at the end of one — allowing 'ch' or
// 'th' as a coda produces roots that read as English and break the illusion.
const ONSET_POOL = ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'z', 'f', 'v', 'h', 'l', 'r', 'w', 'y', 'sh', 'ch', 'th'];
const CODA_POOL = ['p', 't', 'k', 'm', 'n', 's', 'l', 'r', 'ng'];

const SIMPLE_VOWELS = ['a', 'e', 'i', 'o', 'u'];
const DIPHTHONGS = ['ai', 'au', 'ei', 'ou'];

export const SYLLABLE_TEMPLATES = ['CV', 'CVC', 'CV(C)', '(C)V(C)'];
export const STRESS_RULES = ['initial', 'penultimate', 'final', 'antepenultimate', 'heavy'];

export const STRESS_RULE_LABELS = {
  initial: 'always on the first syllable',
  penultimate: 'always on the second-to-last syllable',
  final: 'always on the last syllable',
  antepenultimate: 'on the third-from-last syllable (first syllable if the word is shorter)',
  heavy: 'on the last heavy syllable — a syllable is heavy if it ends in a consonant or has a two-vowel sound; if no syllable is heavy, on the second-to-last',
};

/**
 * Harmony class of a vowel nucleus, keyed off its final letter. Front/back is
 * the most widely attested harmony axis and the easiest for a test-taker to
 * hear, which matters because these words get read aloud.
 * @param {string} nucleus
 * @returns {'front'|'back'}
 */
export function vowelClass(nucleus) {
  const last = nucleus[nucleus.length - 1];
  return last === 'e' || last === 'i' ? 'front' : 'back';
}

/**
 * @typedef {Object} Syllable
 * @property {string} onset - '' when the syllable is onsetless
 * @property {string} nucleus
 * @property {string} coda - '' when the syllable is open
 */

/**
 * @typedef {Object} Phonology
 * @property {string[]} onsets
 * @property {string[]} codas
 * @property {string[]} vowels
 * @property {string[]} frontVowels
 * @property {string[]} backVowels
 * @property {string} template - one of SYLLABLE_TEMPLATES
 * @property {string} stressRule - one of STRESS_RULES
 */

/**
 * @param {() => number} rng
 * @returns {Phonology}
 */
export function rollPhonology(rng) {
  const onsets = sample(ONSET_POOL, randInt(rng, 8, 12), rng).sort();
  // Codas are drawn from the onset inventory where possible so the language
  // sounds like one language rather than two glued together; 'ng' is the one
  // coda-only sound worth allowing through.
  const codaCandidates = CODA_POOL.filter((c) => onsets.includes(c) || c === 'ng');
  const codas = sample(codaCandidates.length >= 3 ? codaCandidates : CODA_POOL, randInt(rng, 3, 5), rng).sort();

  const simple = sample(SIMPLE_VOWELS, randInt(rng, 3, 4), rng);
  const vowels = rng() < 0.45 ? [...simple, pick(DIPHTHONGS, rng)] : simple;

  const frontVowels = vowels.filter((v) => vowelClass(v) === 'front');
  const backVowels = vowels.filter((v) => vowelClass(v) === 'back');

  const template = pick(SYLLABLE_TEMPLATES, rng);
  // A template with no codas can never produce a heavy syllable via closure, so
  // the 'heavy' stress rule would silently collapse into 'penultimate' and the
  // rules brief would be describing something the language never does.
  const stressPool = template === 'CV' ? STRESS_RULES.filter((r) => r !== 'heavy') : STRESS_RULES;

  return {
    onsets,
    codas,
    vowels,
    frontVowels,
    backVowels,
    template,
    stressRule: pick(stressPool, rng),
  };
}

/**
 * @param {Phonology} phon
 * @param {() => number} rng
 * @returns {Syllable}
 */
export function makeSyllable(phon, rng) {
  const t = phon.template;
  const wantsOnset = t === '(C)V(C)' ? rng() < 0.75 : true;
  const wantsCoda = t === 'CVC' ? true : t === 'CV' ? false : rng() < 0.5;

  return {
    onset: wantsOnset ? pick(phon.onsets, rng) : '',
    nucleus: pick(phon.vowels, rng),
    coda: wantsCoda ? pick(phon.codas, rng) : '',
  };
}

/**
 * @param {Phonology} phon
 * @param {number} syllableCount
 * @param {() => number} rng
 * @returns {Syllable[]}
 */
export function makeStem(phon, syllableCount, rng) {
  const out = [];
  for (let i = 0; i < syllableCount; i++) out.push(makeSyllable(phon, rng));
  return out;
}

/** @param {Syllable} syl */
export function renderSyllable(syl) {
  return syl.onset + syl.nucleus + syl.coda;
}

/**
 * @param {Syllable[]} syllables
 * @returns {string}
 */
export function renderWord(syllables) {
  return syllables.map(renderSyllable).join('');
}

/**
 * @param {Syllable[]} syllables
 * @returns {string} syllables joined with hyphens, e.g. "ka-ru-mi"
 */
export function renderSyllabified(syllables) {
  return syllables.map(renderSyllable).join('-');
}

/**
 * A syllable is heavy if it is closed or has a two-vowel nucleus. This is the
 * standard weight distinction and the one the 'heavy' stress rule keys off.
 * @param {Syllable} syl
 * @returns {boolean}
 */
export function isHeavy(syl) {
  return syl.coda !== '' || syl.nucleus.length > 1;
}

/**
 * Stress is DERIVED from the rule and the current syllable count, never stored.
 * That is what makes stress shift correctly when affixation lengthens a word —
 * which is both a real linguistic phenomenon and the basis of the harder audio
 * items and of stress-conditioned allomorphy.
 * @param {Syllable[]} syllables
 * @param {Phonology} phon
 * @returns {number} 0-based index of the stressed syllable
 */
export function stressIndex(syllables, phon) {
  const n = syllables.length;
  if (n === 0) return 0;
  if (n === 1) return 0;

  switch (phon.stressRule) {
    case 'initial':
      return 0;
    case 'final':
      return n - 1;
    case 'penultimate':
      return n - 2;
    case 'antepenultimate':
      return n >= 3 ? n - 3 : 0;
    case 'heavy': {
      for (let i = n - 1; i >= 0; i--) {
        if (isHeavy(syllables[i])) return i;
      }
      return n - 2;
    }
    default:
      return 0;
  }
}

/**
 * @param {Syllable[]} syllables
 * @param {Phonology} phon
 * @returns {string} e.g. "ka-RU-mi" — the form stress items are answered in
 */
export function renderWithStress(syllables, phon) {
  const idx = stressIndex(syllables, phon);
  return syllables.map((s, i) => (i === idx ? renderSyllable(s).toUpperCase() : renderSyllable(s))).join('-');
}
