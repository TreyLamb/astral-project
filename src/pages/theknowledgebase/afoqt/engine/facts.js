// Fact-driven question generation, for the subtests whose content is knowledge rather than
// procedure. Aviation Information is the first user; Physical Science will be the second.
//
// THE PROBLEM THIS SOLVES. Math Knowledge templates compute their own distractors - "forgot to
// halve" is a number you can derive. A knowledge question has no arithmetic to be wrong at, so
// the naive move is to pad the slate with unrelated terms, and that produces the single worst
// kind of multiple choice: four obviously-wrong options and one obviously-right one, testing
// nothing. It is also exactly what polluted the old ASVAB deck.
//
// THE FIX. A fact row names the terms it is genuinely CONFUSED WITH. `aileron` lists `elevator`
// and `rudder`; `angle of attack` lists `angle of incidence`. The distractors are therefore
// real error modes in the same sense the math ones are - each is a specific mistake a real
// person makes - and the explanation can name it: "the elevator is the one that changes pitch."
//
// TWO FRAMES PER ROW. Knowing that an elevator changes pitch and being able to name the surface
// that changes pitch are different recall tasks, and the official items ask both ways:
//
//     "An aircraft's elevator functions to ___"                        (identify)
//     "The downward force acting on an aircraft is called ___"         (recall)
//
// Both are written out per row rather than generated from a pattern. Auto-phrasing produced
// stems that either read like a database dump or gave the answer away in the question.

import { registerTemplate } from './generator.js';

/**
 * @typedef {Object} Fact
 * @property {string} id
 * @property {string} chapter        curriculum chapter id
 * @property {string[]} concepts     must be declared by that chapter - afoqt:coverage checks it
 * @property {1|2|3|4|5} band
 * @property {string} term           the answer to the RECALL frame
 * @property {string} gloss          the answer to the IDENTIFY frame
 * @property {string} stem           identify: a sentence `gloss` completes
 * @property {string} [recallStem]   recall: a question `term` answers. Omit where the gloss fits
 *                                   several terms and the question would have no single answer.
 * @property {string[]} [confusions] ids of facts genuinely mistaken for this one
 * @property {string} [why]          the one-line reason, shown after a miss
 * @property {string} [source]       'PHAK 6-3', 'OATTS', 'AFPC pamphlet', ...
 */

/**
 * An all-capitals word that is EMPHASIS rather than an acronym.
 *
 * The first version of this check used a bare /[A-Z]{2,}/ and would have rejected every gloss
 * mentioning an ILS or a VFR minimum. It never fired at all, as it happens: a shell heredoc
 * turned its word boundaries into literal backspace bytes and the regex silently matched
 * nothing. Both failures point the same way - the rule needs to know which capitals are real
 * words, so it keeps a list.
 */
const ACRONYMS = new Set([
  'ADF', 'AGL', 'ATC', 'ATIS', 'CTAF', 'DME', 'EGT', 'FL', 'GPS', 'IAS', 'CAS', 'TAS', 'EAS',
  'IFR', 'ILS', 'MDS', 'MOA', 'MSL', 'NDB', 'PAPI', 'RPM', 'TFR', 'UTC', 'VASI', 'VFR', 'VIP',
  'VOR', 'VTOL', 'STOL', 'US', 'AFOQT', 'ANDS', 'UNOS',
]);

export function shoutedWord(text) {
  for (const w of String(text).split(/[^A-Za-z]+/)) {
    if (w.length >= 2 && w === w.toUpperCase() && /[A-Z]/.test(w) && !ACRONYMS.has(w)) return w;
  }
  return null;
}

const REGISTRY = new Map();

export function registerFacts(rows) {
  for (const f of rows) {
    if (REGISTRY.has(f.id)) throw new Error(`duplicate fact id: ${f.id}`);
    if (!f.term || !f.gloss) throw new Error(`${f.id}: needs a term and a gloss`);
    if (f.identify === false && !f.recallStem) {
      throw new Error(`${f.id}: identify is off, so recallStem is the only way to ask it`);
    }
    if (!(f.band >= 1 && f.band <= 5)) throw new Error(`${f.id}: band must be 1-5`);
    if (!f.concepts?.length) throw new Error(`${f.id}: declares no concepts`);
    // A gloss BECOMES an answer option, so emphasis capitals in one are a visual tell: the
    // odd option out is findable without knowing anything about aeroplanes. Emphasis belongs
    // in `why`, which is only ever read once the answer is already in.
    const shout = shoutedWord(f.gloss);
    if (shout) throw new Error(`${f.id}: gloss shouts "${shout}" - an option in capitals is a tell, move it to why`);
    REGISTRY.set(f.id, f);
  }
  return rows;
}

export const allFacts = () => [...REGISTRY.values()];
export const getFact = (id) => REGISTRY.get(id) ?? null;
export const factsFor = (chapter, band = null) =>
  allFacts().filter((f) => f.chapter === chapter && (band == null || f.band === band));

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The identify frame's stem, DERIVED from the term rather than authored.
 *
 * Writing these by hand went wrong two different ways across 374 rows, and both were invisible
 * until the questions were read aloud:
 *
 *   1. THE STEM RESTATED ITS OWN GLOSS. "Pressure altitude corrected for non-standard
 *      temperature is ___" offered "is pressure altitude corrected for temperature" as the
 *      correct choice. The answer was sitting in the question.
 *   2. THE STEM AND GLOSS DID NOT AGREE GRAMMATICALLY. "An aircraft's elevator functions to ___"
 *      wants an infinitive, but the gloss is third-person - "functions to controls pitch".
 *
 * Deriving it makes both impossible. The stem now contains only the term, so it cannot leak the
 * answer, and the gloss is always a third-person predicate, so it always agrees. The varied,
 * official-sounding phrasing lives in `recallStem`, which is where the official items' own
 * character sits anyway ("The downward force acting on an aircraft is called ___").
 *
 * The ARTICLE is part of the term, not something derived here. No rule separates the countable
 * component names that need one ("the aileron controls roll") from the mass nouns that must not
 * have one ("lift is the upward force"), so a human decides it once, in the data.
 */
export function identifyStem(f) {
  return cap(f.term.trim());
}

/**
 * Distractors for one fact, best first.
 *
 * Priority is the whole point. A declared confusion is a mistake someone actually makes; a
 * sibling sharing a concept is at least about the same thing; a same-chapter fact is a weak last
 * resort. Nothing is ever drawn from outside the chapter - a distractor from a different subject
 * is eliminable on sight and turns a five-option item into a two-option one.
 */
export function distractorsFor(fact, key) {
  const seen = new Set([fact.id]);
  const out = [];
  const take = (f, error, why) => {
    if (!f || seen.has(f.id)) return;
    seen.add(f.id);
    out.push({ value: key(f), error, why });
  };

  for (const id of fact.confusions ?? []) {
    const other = getFact(id);
    // A confusion has to resolve: a typo'd id would silently downgrade the item to
    // sibling-grade distractors while still looking correct.
    if (!other) throw new Error(`${fact.id}: confusion "${id}" does not exist`);
    take(other, 'confused-terms', `mixed it up with ${other.term}, which ${other.gloss}`);
  }
  const pool = allFacts().filter((f) => f.chapter === fact.chapter && f.band === fact.band);
  for (const f of pool) {
    if (f.concepts.some((c) => fact.concepts.includes(c))) take(f, 'same-concept', `that is ${f.term}`);
  }
  for (const f of pool) take(f, 'same-chapter', `that is ${f.term}`);
  return out;
}

/**
 * Register the question frames for one chapter at one band.
 *
 * `concepts` is derived from the rows the template can actually draw rather than copied from the
 * chapter, so the coverage check measures what is really tested. Declaring a concept the rows do
 * not cover would otherwise pass a check that exists precisely to catch that.
 */
export function factTemplates({ subtest, chapter, band, idBase, name, calibratedAgainst = 'oatts' }) {
  const rows = factsFor(chapter, band);
  const made = [];

  // Validate the confusion graph HERE, at import, rather than the first time an affected fact
  // happens to be drawn. A dangling id is usually a typo or a forward reference to a chapter
  // that does not exist yet, and finding it on a random seed hours later is no use to anyone.
  for (const f of rows) {
    for (const id of f.confusions ?? []) {
      const other = getFact(id);
      if (!other) throw new Error(`${f.id}: confusion "${id}" does not exist`);
      // Distractors never leave the chapter - one from a different subject is eliminable on
      // sight - so a cross-chapter confusion would silently do nothing.
      if (other.chapter !== f.chapter) {
        throw new Error(`${f.id}: confusion "${id}" is in ${other.chapter}, not ${f.chapter}`);
      }
    }
  }

  const build = (suffix, frameName, rowsFor, key, ask) => {
    const usable = rows.filter(rowsFor);
    // Five options have to come from somewhere, and they all come from this chapter and band.
    if (usable.length < 5) return;
    made.push(registerTemplate({
      id: `${idBase}-${suffix}`,
      subtest,
      band,
      name: `${name} - ${frameName}`,
      concepts: [...new Set(usable.flatMap((f) => f.concepts))],
      calibratedAgainst,
      stemSpace: usable.length,
      generate: (rng, h) => {
        const fact = h.pick(usable);
        const { choices, correctIndex, errors, whys } = h.choices(key(fact), distractorsFor(fact, key));
        return {
          stem: ask(fact),
          choices, correctIndex, errors, whys,
          tags: [subtest.toLowerCase(), ...fact.concepts],
          explanation: fact.why ?? `${cap(fact.term)} - ${fact.gloss.replace(/^(is|are)\s+/, '')}.`,
        };
      },
    }));
  };

  build('id', 'name what it does', (f) => f.identify !== false, (f) => cap(f.gloss), identifyStem);
  build('recall', 'name the thing', (f) => !!f.recallStem, (f) => cap(f.term), (f) => f.recallStem);

  return made;
}

export function _resetFacts() { REGISTRY.clear(); }
