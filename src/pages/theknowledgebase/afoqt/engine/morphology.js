// Word parts, and the sound-alike pairs they help you tell apart.
//
// This is not an enrichment chapter. The official AF syllabus lists exactly TWO Word Knowledge
// modules - "Strategies for Studying" and "Parts of a Word (prefix, root, suffix)" - and step 3
// of the method worked out in every official OATTS item is "use word parts if unsure". Their own
// solutions do it out loud: ard- (to burn), bene- (good), curs- from currere (to run), co- +
// agent (to drive together).
//
// It is also the only part of Word Knowledge that GENERALISES. A memorised word earns you the
// one item that happens to use it; a memorised root earns you every unfamiliar word built on it,
// which on a 25-question subtest drawn from an unbounded vocabulary is the only strategy that
// scales.
//
// TWO DATA TYPES, both with declared confusions rather than drawn distractors, for the same
// reason engine/facts.js works that way: a wrong option must be a mistake somebody actually
// makes. `ante-` and `anti-` differ by one letter and mean completely different things, and
// that pair is worth more than four unrelated prefixes.

import { registerTemplate } from './generator.js';
import { shuffle } from '../../engine/rng.js';

/**
 * @typedef {Object} Morpheme
 * @property {string} id
 * @property {string} chapter
 * @property {string[]} concepts
 * @property {1|2|3|4|5} band
 * @property {string} form            'ard-', 'bene-', '-ous', 'chron-'
 * @property {'root'|'prefix'|'suffix'} kind
 * @property {string} origin          'Latin' | 'Greek'
 * @property {string} sense           what it means, as an option would read it
 * @property {{word: string, gloss: string}[]} examples   at least two
 * @property {string[]} [confusions]  ids of morphemes genuinely mistaken for this one
 */

/**
 * @typedef {Object} Pair
 * @property {string} id
 * @property {string} chapter
 * @property {string[]} concepts
 * @property {1|2|3|4|5} band
 * @property {{word: string, gloss: string, pos: string}} a
 * @property {{word: string, gloss: string, pos: string}} b
 * @property {string} tell            the one-line way to keep them apart
 *
 * `pos` sits on each HALF rather than on the pair, because for several of the best pairs the
 * parts of speech are exactly what differ - principal is an adjective and principle is a noun,
 * and that is half the reason anyone mixes them up. It is used to keep a slate internally
 * consistent: a verb definition ("to openly disregard a rule") offered under an adjective
 * headword is eliminable on sight, without knowing either word.
 */

const MORPHEMES = new Map();
const PAIRS = new Map();
const KINDS = new Set(['root', 'prefix', 'suffix']);
const POS = new Set(['adj', 'noun', 'verb', 'adv']);
const norm = (s) => String(s).trim().toLowerCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function registerMorphemes(rows) {
  for (const m of rows) {
    if (!m.id) throw new Error('morpheme needs an id');
    if (MORPHEMES.has(m.id)) throw new Error(`duplicate morpheme id: ${m.id}`);
    if (!KINDS.has(m.kind)) throw new Error(`${m.id}: kind must be root, prefix or suffix`);
    if (!m.form || !m.sense) throw new Error(`${m.id}: needs a form and a sense`);
    if (!(m.band >= 1 && m.band <= 5)) throw new Error(`${m.id}: band must be 1-5`);
    if (!m.concepts?.length) throw new Error(`${m.id}: declares no concepts`);
    if (!(m.examples?.length >= 2)) throw new Error(`${m.id}: needs at least two example words`);
    // An example that does not visibly contain the form teaches nothing - the whole point is
    // that the candidate can SEE the part inside the word.
    const stem = m.form.replace(/-/g, '').toLowerCase();
    for (const ex of m.examples) {
      if (!ex.word || !ex.gloss) throw new Error(`${m.id}: example needs a word and a gloss`);
      if (!norm(ex.word).includes(stem.slice(0, Math.max(3, stem.length - 1)))) {
        throw new Error(`${m.id}: example "${ex.word}" does not visibly contain "${m.form}"`);
      }
    }
    MORPHEMES.set(m.id, m);
  }
  return rows;
}

export function registerPairs(rows) {
  for (const p of rows) {
    if (!p.id) throw new Error('pair needs an id');
    if (PAIRS.has(p.id)) throw new Error(`duplicate pair id: ${p.id}`);
    if (!p.a?.word || !p.b?.word || !p.a?.gloss || !p.b?.gloss) {
      throw new Error(`${p.id}: needs a and b, each with a word and a gloss`);
    }
    for (const half of ['a', 'b']) {
      if (!POS.has(p[half].pos)) {
        throw new Error(`${p.id}: ${half}.pos must be one of ${[...POS].join(', ')}`);
      }
    }
    if (norm(p.a.word) === norm(p.b.word)) throw new Error(`${p.id}: both halves are the same word`);
    if (norm(p.a.gloss) === norm(p.b.gloss)) {
      throw new Error(`${p.id}: both halves have the same gloss, so no question can distinguish them`);
    }
    if (!p.tell) throw new Error(`${p.id}: needs a tell - the way to keep them apart`);
    if (!(p.band >= 1 && p.band <= 5)) throw new Error(`${p.id}: band must be 1-5`);
    if (!p.concepts?.length) throw new Error(`${p.id}: declares no concepts`);
    PAIRS.set(p.id, p);
  }
  return rows;
}

export const allMorphemes = () => [...MORPHEMES.values()];
export const allPairs = () => [...PAIRS.values()];
export const morphemesFor = (chapter, band = null) =>
  allMorphemes().filter((m) => m.chapter === chapter && (band == null || m.band === band));
export const pairsFor = (chapter, band = null) =>
  allPairs().filter((p) => p.chapter === chapter && (band == null || p.band === band));
export function _resetMorphology() { MORPHEMES.clear(); PAIRS.clear(); }

/** Declared confusions first, then same-chapter siblings. Never leaves the chapter. */
function morphDistractors(m, pool, key, rng) {
  const seen = new Set([m.id]);
  const out = [];
  const take = (o, error, why) => {
    if (!o || seen.has(o.id)) return;
    seen.add(o.id);
    out.push({ value: key(o), error, why });
  };
  for (const id of m.confusions ?? []) {
    const other = MORPHEMES.get(id);
    if (!other) throw new Error(`${m.id}: confusion "${id}" does not exist`);
    take(other, 'confused-parts', `that is "${other.form}", which means ${other.sense}`);
  }
  // Shuffled for the same reason the pair frames are: declaration order would make the
  // first few rows of the chapter the permanent distractors.
  //
  // Same KIND first, because a sense carries its word class. Offering "one who does or
  // believes" against `inter-` lets a candidate strike it for reading like a suffix, without
  // knowing what either part means. It is only a preference and not a filter: a chapter
  // usually holds two suffixes per band and four distractors are needed, so a suffix headword
  // still borrows from the prefixes rather than shipping a short slate.
  const shuffled = shuffle(pool, rng);
  for (const o of shuffled) if (o.kind === m.kind) take(o, 'same-chapter', `that is "${o.form}"`);
  for (const o of shuffled) take(o, 'same-chapter', `that is "${o.form}"`);
  return out;
}

export function morphemeTemplates({ chapter, band, idBase, name, calibratedAgainst = 'oatts' }) {
  const rows = morphemesFor(chapter, band);
  const made = [];
  if (rows.length < 5) return made;

  for (const m of rows) {
    for (const id of m.confusions ?? []) {
      const other = MORPHEMES.get(id);
      if (!other) throw new Error(`${m.id}: confusion "${id}" does not exist`);
      if (other.chapter !== m.chapter) {
        throw new Error(`${m.id}: confusion "${id}" is in ${other.chapter}, not ${m.chapter}`);
      }
    }
  }

  const concepts = [...new Set(rows.flatMap((m) => m.concepts))];

  // FRAME 1: the part -> its meaning.
  made.push(registerTemplate({
    id: `${idBase}-mean`,
    subtest: 'WK',
    band,
    name: `${name} - what the part means`,
    concepts,
    calibratedAgainst,
    stemSpace: rows.length,
    generate: (rng, h) => {
      const m = h.pick(rows);
      const { choices, correctIndex, errors, whys } = h.choices(
        cap(m.sense), morphDistractors(m, rows, (o) => cap(o.sense), rng));
      return {
        stem: `The ${m.kind} "${m.form}" means:`,
        choices, correctIndex, errors, whys,
        tags: ['wk', ...m.concepts],
        explanation: `"${m.form}" is ${m.origin} and means ${m.sense}. You can see it in ${m.examples.map((e) => `${e.word} (${e.gloss})`).join(' and ')}. One root is worth more than one word: it pays out on every unfamiliar word built from it.`,
      };
    },
  }));

  // FRAME 2: the meaning -> a word carrying the part. This is the direction the real subtest
  // rewards, because it is what you do when an unfamiliar headword appears.
  made.push(registerTemplate({
    id: `${idBase}-apply`,
    subtest: 'WK',
    band,
    name: `${name} - spot the part in a word`,
    concepts,
    calibratedAgainst,
    stemSpace: rows.length,
    generate: (rng, h) => {
      const m = h.pick(rows);
      const ex = h.pick(m.examples);
      const { choices, correctIndex, errors, whys } = h.choices(
        cap(ex.word), morphDistractors(m, rows, (o) => cap(o.examples[0].word), rng));
      return {
        stem: `Which word is built on a ${m.kind} meaning "${m.sense}"?`,
        choices, correctIndex, errors, whys,
        tags: ['wk', ...m.concepts],
        explanation: `${cap(ex.word)} carries "${m.form}" (${m.origin}, ${m.sense}) and means ${ex.gloss}. Reading an unfamiliar word part by part is step 3 of the official method, and it is the only Word Knowledge strategy that works on a word you have never seen.`,
      };
    },
  }));

  return made;
}

export function pairTemplates({ chapter, band, idBase, name, calibratedAgainst = 'oatts' }) {
  const rows = pairsFor(chapter, band);
  const made = [];
  if (rows.length < 5) return made;
  const concepts = [...new Set(rows.flatMap((p) => p.concepts))];

  // Each pair yields two items - one asked from each side - so the candidate cannot learn
  // "the one on the left is the right answer".
  const sides = rows.flatMap((p) => [
    { p, self: p.a, mate: p.b },
    { p, self: p.b, mate: p.a },
  ]);

  made.push(registerTemplate({
    id: `${idBase}-define`,
    subtest: 'WK',
    band,
    name: `${name} - tell the pair apart`,
    concepts,
    calibratedAgainst,
    stemSpace: sides.length,
    generate: (rng, h) => {
      const { p, self, mate } = h.pick(sides);
      // Distractor glosses are drawn only from halves sharing this headword's part of speech.
      // Without the filter a verb definition turns up under an adjective headword and is
      // eliminable without knowing either word - the same outlier tell engine/words.js guards.
      const seen = new Set([norm(self.gloss), norm(mate.gloss)]);
      const wrong = [{ value: cap(mate.gloss), error: 'confused-with', why: `that is "${mate.word}" - ${p.tell}` }];
      // Declaration order would hand every question in a run the SAME two or three
      // distractors - the first same-class pairs in the array, every time. Shuffling on
      // the instance rng keeps (templateId, seed) byte-identical and stops a drill from
      // teaching which words are never the answer.
      const sameClass = shuffle(
        rows.flatMap((o) => (o.id === p.id ? [] : [o.a, o.b].filter((x) => x.pos === self.pos).map((x) => ({ x })))),
        rng);
      for (const { x } of sameClass) {
        if (wrong.length >= 4) break;
        if (seen.has(norm(x.gloss))) continue;
        seen.add(norm(x.gloss));
        wrong.push({ value: cap(x.gloss), error: 'wrong-meaning', why: `that is "${x.word}"` });
      }
      const { choices, correctIndex, errors, whys } = h.choices(cap(self.gloss), wrong);
      return {
        stem: `${self.word.toUpperCase()} most nearly means:`,
        choices, correctIndex, errors, whys,
        tags: ['wk', ...p.concepts],
        explanation: `${cap(self.word)} means ${self.gloss}. It is routinely confused with "${mate.word}", which means ${mate.gloss}. ${p.tell}`,
      };
    },
  }));

  made.push(registerTemplate({
    id: `${idBase}-pick`,
    subtest: 'WK',
    band,
    name: `${name} - pick the right half`,
    concepts,
    calibratedAgainst,
    stemSpace: sides.length,
    generate: (rng, h) => {
      const { p, self, mate } = h.pick(sides);
      const seen = new Set([norm(self.word), norm(mate.word)]);
      const wrong = [{ value: cap(mate.word), error: 'confused-with', why: `"${mate.word}" means ${mate.gloss} - ${p.tell}` }];
      // Declaration order would hand every question in a run the SAME two or three
      // distractors - the first same-class pairs in the array, every time. Shuffling on
      // the instance rng keeps (templateId, seed) byte-identical and stops a drill from
      // teaching which words are never the answer.
      const sameClass = shuffle(
        rows.flatMap((o) => (o.id === p.id ? [] : [o.a, o.b].filter((x) => x.pos === self.pos).map((x) => ({ x })))),
        rng);
      for (const { x } of sameClass) {
        if (wrong.length >= 4) break;
        if (seen.has(norm(x.word))) continue;
        seen.add(norm(x.word));
        wrong.push({ value: cap(x.word), error: 'wrong-meaning', why: `"${x.word}" means ${x.gloss}` });
      }
      const { choices, correctIndex, errors, whys } = h.choices(cap(self.word), wrong);
      return {
        stem: `Which word means "${self.gloss}"?`,
        choices, correctIndex, errors, whys,
        tags: ['wk', ...p.concepts],
        explanation: `${cap(self.word)} means ${self.gloss}; "${mate.word}" means ${mate.gloss}. ${p.tell}`,
      };
    },
  }));

  return made;
}
