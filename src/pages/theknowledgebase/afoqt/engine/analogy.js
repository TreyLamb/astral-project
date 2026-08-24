// Verbal Analogies: the relation-pair registry and its question frames.
//
// PART 9 of docs/afoqt/HANDOFF.md. Engine work, never farmable (section 4) — this file is the
// registrar + validator + distractor logic that PART 10-13's DATA ROWS, LESSONS and TESTS will
// be built against, exactly the way engine/morphology.js is what PART 3/4's rows were farmed
// against. See PART 8's design record in HANDOFF.md and "VA SOURCING" in RESEARCH.md for the
// decisions this file is built to; they are not repeated here except where the code needs them.
//
// THE TWO FORMATS. Both are real AFOQT formats, not an invention:
//   format 1  "A is to B as C is to ___"   — complete the fourth term. Bare-word choices.
//   format 2  "A is to B as ___"           — pick the whole matching pair. Choices are pairs.
// Format 2 outnumbers format 1 roughly 3:1 in the 75-item sourced sample, so it is registered
// first and is the PRIMARY frame — see relationTemplates below.
//
// WHY A ROW IS NOT A "CONFUSABLE PAIR" (engine/morphology.js) OR A "VOCAB WORD" (engine/words.js)
// WEARING A NEW LABEL. A confusable pair is asked "which meaning goes with THIS word" — the two
// halves are rivals for one definition. An analogy pair is asked "does this OTHER pair share the
// same RELATION as the base pair" — the two halves of a row are partners, not rivals, and the
// question is never about either word's meaning in isolation. That is a different distractor
// problem: morphology's pairTemplates draws wrong glosses that share the headword's part of
// speech; this file draws wrong PAIRS that share a plausible but different relation, or the same
// two words in the wrong order.
//
// BAND IS WORD RARITY, NOT RELATION COMPLEXITY (PART 8's design record). A pair's difficulty is
// how rare its words are — TENSION/STRESS reads easy regardless of relation, DOMINANCE/HEGEMONY
// reads hard regardless of relation. Rather than a second, disconnected rarity scale, a row whose
// headword already exists in the WK bank (engine/words.js) takes ITS declared band from there,
// and a mismatch is a REGISTRATION ERROR: the two subtests would otherwise be free to disagree
// about how hard the same word is, which is exactly the kind of silent drift Doctrine rule 2
// exists to catch between a lesson and a question. A row whose word is not in the WK bank (most
// of them — analogies draw on a much wider vocabulary than the six WK chapters) declares its own
// band directly, same as every other AFOQT content row. `wordBand()` is exported so a PART 10/11
// author can check a word before deciding its band.
//
// WHY va-01-method HAS NO TEMPLATES OF ITS OWN. Its two concepts — va-relation-format,
// va-relation-discriminators — are not separate content the way wk-connotation is (which needed
// its own dedicated frame in engine/words.js because nothing else exercises it). Every instance
// relationTemplates() ever produces IS an example of one of the two formats, and the "-pair"
// frame's whole mechanic IS applying the two official discriminators (does this candidate share
// the SAME KIND of relation, not just a resembling one). So both frames tag their templates with
// those two concepts in addition to whichever specific relation the drawn rows declare — see the
// `concepts` arrays below. That is not padding: it is what the template actually tests on every
// draw, from whichever chapter it was built for. The practical effect for PART 12 (VA lessons):
// va-01-method's lesson is taught once and then exercised by every other chapter's drills, the
// same way a chapter's drill in the curriculum UI pulls whatever templates carry its concepts —
// there is nothing further to author here, and inventing a bespoke "name the format" quiz would
// be a question format the real AFOQT does not ask, which Doctrine rule 1's spirit rules out.
// Flagged in the PART 9 report rather than decided silently, since it changes what PART 12 has to
// build.

import { registerTemplate } from './generator.js';
import { shuffle } from '../../engine/rng.js';
import { allWords } from './words.js';

/**
 * @typedef {Object} RelationHalf
 * @property {string} word
 * @property {'adj'|'noun'|'verb'|'adv'} pos   deliberately allowed to differ between a and b —
 *                                             doer-to-action and cause-to-effect pairs are
 *                                             routinely cross-part-of-speech (BARK is a verb,
 *                                             DOG is a noun), unlike a WK confusable pair.
 * @property {string} [gloss]                 short definition, used only in the explanation;
 *                                             optional because a bare headword is enough to run
 *                                             the question and not every word needs re-glossing
 *                                             if it is already defined in the WK bank.
 */

/**
 * @typedef {Object} RelationRow
 * @property {string} id
 * @property {string} chapter        a va-0N-* chapter id from curriculum/chapters.js
 * @property {string[]} concepts     must be declared by that chapter — afoqt:coverage checks it
 * @property {1|2|3|4|5} band        word rarity — see wordBand() below
 * @property {string} relation       short internal tag ('part-whole', 'cause-effect', ...). Not
 *                                   the same thing as `concepts`: two rows in different chapters
 *                                   can legitimately share a relation tag (used to pool "same
 *                                   relation" and "different relation" candidates across the
 *                                   whole bank), while a concept stays scoped to one chapter.
 * @property {boolean} [symmetric]   true when swapping a/b does not change the relation (SYNONYM,
 *                                   ANTONYM). Order-reversal is not a real trap for these, so the
 *                                   reversed-pair distractor is skipped for them — see buildMatch.
 * @property {RelationHalf} a
 * @property {RelationHalf} b
 * @property {string} tell           the one-line way to name the relation, shown after a miss —
 *                                   same job as `tell` on a morphology.js Pair.
 * @property {string[]} [confusions] ids of OTHER relation rows that are a genuine, author-picked
 *                                   "looks similar but is not the same relation" trap. Preferred
 *                                   over a blind draw from the cross-relation pool, same priority
 *                                   order as morphDistractors in engine/morphology.js. Not
 *                                   restricted to the same chapter — the whole point of the
 *                                   official "level of association" discriminator is that the
 *                                   nearest-looking trap is often a DIFFERENT relation type
 *                                   entirely (a part-whole pair offered against a cause-effect
 *                                   base pair), which can live in another chapter.
 */

const RELATIONS = new Map();
const POS = new Set(['adj', 'noun', 'verb', 'adv']);
const norm = (s) => String(s).trim().toLowerCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The band a word already carries in the WK bank, or null if it is not there. Exported so a
 * PART 10/11 author can check a candidate word before assigning a band by hand, and used by
 * registerRelations() to enforce that the two subtests never silently disagree about the same
 * word's rarity. Returns null (no opinion, no error) until the WK chapters that define that
 * word have actually been imported and registered — module load order is the caller's problem,
 * same as it already is for every other cross-chapter check in this codebase.
 */
export function wordBand(word) {
  const w = norm(word);
  for (const wk of allWords()) if (norm(wk.word) === w) return wk.band;
  return null;
}

export function registerRelations(rows) {
  for (const r of rows) {
    const at = `${r.id ?? '(no id)'}`;
    if (!r.id) throw new Error('relation row needs an id');
    if (RELATIONS.has(r.id)) throw new Error(`duplicate relation id: ${r.id}`);
    if (!r.chapter) throw new Error(`${at}: needs a chapter`);
    if (!r.concepts?.length) throw new Error(`${at}: declares no concepts`);
    if (!(r.band >= 1 && r.band <= 5)) throw new Error(`${at}: band must be 1-5`);
    if (!r.relation) throw new Error(`${at}: needs a relation tag`);
    if (!r.tell) throw new Error(`${at}: needs a tell - the way to name the relation`);
    for (const half of ['a', 'b']) {
      const h = r[half];
      if (!h?.word) throw new Error(`${at}: ${half}.word is required`);
      if (!POS.has(h.pos)) throw new Error(`${at}: ${half}.pos must be one of ${[...POS].join(', ')}`);
    }
    if (norm(r.a.word) === norm(r.b.word)) throw new Error(`${at}: a and b are the same word`);

    // A pair the bank already holds, in either order, is a duplicate ITEM even with a fresh id -
    // "PETAL is to FLOWER" and a second row with the same two words teaches nothing twice over
    // and risks two templates asking the visually identical question.
    for (const other of RELATIONS.values()) {
      const sameOrder = norm(other.a.word) === norm(r.a.word) && norm(other.b.word) === norm(r.b.word);
      const swapped = norm(other.a.word) === norm(r.b.word) && norm(other.b.word) === norm(r.a.word);
      if (sameOrder || swapped) throw new Error(`${at}: duplicates the pair in "${other.id}"`);
    }

    // Word-rarity cross-check against the WK bank (see wordBand() above). A word this row
    // shares with WK must agree on how hard it is - two subtests disagreeing about the same
    // word's rarity is a real data defect, not a judgement call, so it throws rather than warns.
    for (const half of ['a', 'b']) {
      const wk = wordBand(r[half].word);
      if (wk != null && wk !== r.band) {
        throw new Error(
          `${at}: ${half}.word "${r[half].word}" is band ${wk} in the WK bank but this row is band ${r.band} - `
          + 'a word cannot be two different rarities across subtests. Match the WK band, or use a different word.');
      }
    }

    for (const id of r.confusions ?? []) {
      // Existence is checked here; cross-reference resolution (which needs every chapter's
      // rows loaded, not just this batch) happens once at template-build time in
      // relationTemplates/formatTemplates, same staging as morphology.js's registerPairs vs
      // pairTemplates.
      if (typeof id !== 'string') throw new Error(`${at}: confusions must be ids (strings)`);
    }

    RELATIONS.set(r.id, r);
  }
  return rows;
}

export const allRelations = () => [...RELATIONS.values()];
export const relationsFor = (chapter, band = null) =>
  allRelations().filter((r) => r.chapter === chapter && (band == null || r.band === band));
export function _resetRelations() { RELATIONS.clear(); }

const renderPair = (a, b) => `${cap(a)} : ${cap(b)}`;
const readRelation = (tag) => tag.replace(/-/g, ' ');

/** Other rows in the same chapter/band sharing this row's relation tag. Null if there are none. */
function samePool(base, chapterRows) {
  const out = chapterRows.filter((r) => r.relation === base.relation && r.id !== base.id);
  return out.length ? out : null;
}

/**
 * Rows at the same band whose relation DIFFERS from the base row's - the material a
 * "which pair really matches" or "what completes the fourth term" distractor is built from.
 * Declared `confusions` come first (an author-picked, genuine near-miss beats a blind draw, the
 * same priority morphDistractors in engine/morphology.js uses), then the rest of the bank at
 * this band, shuffled on the instance rng so a drill does not teach "the third option is never
 * the trap" by always presenting distractors in declaration order.
 *
 * Deliberately reaches across the WHOLE bank rather than staying in one chapter: va-05 declares
 * exactly one relation (va-object-attribute), so a chapter-only pool there would have nothing to
 * draw a wrong-relation trap from at all, and the official "level of association" discriminator
 * is precisely that the nearest-looking trap is often a different relation family entirely, which
 * routinely lives in another chapter.
 */
function crossPool(base, band, rng) {
  const declaredIds = new Set(base.confusions ?? []);
  const declared = [];
  for (const id of declaredIds) {
    const row = RELATIONS.get(id);
    if (!row) throw new Error(`${base.id}: confusion "${id}" does not exist`);
    declared.push(row);
  }
  const rest = allRelations().filter(
    (r) => r.band === band && r.relation !== base.relation && !declaredIds.has(r.id));
  return [...declared, ...shuffle(rest, rng)];
}

/**
 * FORMAT 2 material: the correct matching pair, plus up to four wrong pairs.
 * Returns null if the pool has no other row sharing the base row's relation - format 2 cannot be
 * asked at all without a genuine "this one really does match" answer to offer.
 */
function buildMatch(base, chapterRows, band, rng) {
  const partners = samePool(base, chapterRows);
  if (!partners) return null;
  const partner = partners[Math.floor(rng() * partners.length)];
  const correct = renderPair(partner.a.word, partner.b.word);

  const distractors = [];
  // THE classic AFOQT trap: the exact same two words as the base pair, wrong order. Skipped for
  // symmetric relations (SYNONYM, ANTONYM) where reversing changes nothing, so it would not be a
  // real mistake and offering it would just be a second correct answer in disguise.
  if (!base.symmetric) {
    distractors.push({
      value: renderPair(base.b.word, base.a.word),
      error: 'reversed-order',
      why: `that is ${cap(base.a.word)} and ${cap(base.b.word)} in the wrong order - the relation runs `
        + `${cap(base.a.word)} to ${cap(base.b.word)}, not back the other way.`,
    });
  }
  for (const r of crossPool(base, band, rng)) {
    if (distractors.length >= 4) break;
    distractors.push({
      value: renderPair(r.a.word, r.b.word),
      error: 'wrong-relation',
      why: `${cap(r.a.word)} and ${cap(r.b.word)} are related by ${readRelation(r.relation)}, `
        + `not ${readRelation(base.relation)} like the base pair.`,
    });
  }
  return { correct, distractors };
}

/**
 * FORMAT 1 material: the correct fourth term, a partner pair to supply the stem's "C", and up to
 * four wrong words. Returns null for the same reason buildMatch does.
 */
function buildFourthTerm(base, chapterRows, band, rng) {
  const partners = samePool(base, chapterRows);
  if (!partners) return null;
  const partner = partners[Math.floor(rng() * partners.length)];
  const correctWord = partner.b.word;

  const distractors = [
    // Restating a word already on the page is the single most common wrong pick on a rushed
    // read - it LOOKS related because it was just seen, not because it completes anything.
    { value: cap(base.a.word), error: 'reused-base-word',
      why: `${cap(base.a.word)} is already used earlier in the analogy - repeating it completes nothing.` },
    { value: cap(base.b.word), error: 'reused-base-word',
      why: `${cap(base.b.word)} is already used earlier in the analogy - repeating it completes nothing.` },
  ];
  for (const r of crossPool(base, band, rng)) {
    if (distractors.length >= 4) break;
    distractors.push({
      value: cap(r.b.word),
      error: 'wrong-relation',
      why: `that completes ${cap(r.a.word)} : ${cap(r.b.word)} (a ${readRelation(r.relation)} pair), `
        + `not ${cap(base.a.word)} : ${cap(base.b.word)}'s relation.`,
    });
  }
  return { correctWord, partner, distractors };
}

/**
 * Register the two frame templates for one chapter at one band. Mirrors the shape of
 * wordTemplates()/pairTemplates() in the sibling engine files: a chapter+band pair with fewer
 * than 5 rows produces nothing rather than a thin, easily-collided item space.
 *
 * `concepts` carries the chapter's own relation concept(s), derived from the rows actually drawn
 * (never copied from the chapter definition - see the header comment in engine/words.js for why
 * that distinction matters), PLUS the two va-01-method concepts every instance of these frames
 * genuinely exercises. See this file's header for why va-01-method has no templates of its own.
 */
export function relationTemplates({ chapter, band, idBase, name, calibratedAgainst = 'quizlet' }) {
  const rows = relationsFor(chapter, band);
  const made = [];
  if (rows.length < 5) return made;

  for (const r of rows) {
    for (const id of r.confusions ?? []) {
      if (!RELATIONS.get(id)) throw new Error(`${r.id}: confusion "${id}" does not exist`);
    }
  }

  const ownConcepts = [...new Set(rows.flatMap((r) => r.concepts))];

  // FORMAT 2 - PRIMARY. Outnumbers format 1 roughly 3:1 in the sourced sample
  // (docs/afoqt/RESEARCH.md "VA SOURCING"), so it is registered first.
  made.push(registerTemplate({
    id: `${idBase}-pair`,
    subtest: 'VA',
    band,
    name: `${name} - pick the matching pair`,
    concepts: [...new Set([...ownConcepts, 'va-relation-format', 'va-relation-discriminators'])],
    calibratedAgainst,
    stemSpace: rows.length,
    generate: (rng, h) => {
      const base = h.pick(rows);
      const built = buildMatch(base, rows, band, rng);
      if (!built) return null;
      const { choices, correctIndex, errors, whys } = h.choices(built.correct, built.distractors);
      return {
        stem: `${base.a.word.toUpperCase()} is to ${base.b.word.toUpperCase()} as:`,
        choices, correctIndex, errors, whys,
        tags: ['va', ...base.concepts],
        explanation: `${cap(base.a.word)} is to ${cap(base.b.word)} by ${readRelation(base.relation)}: `
          + `${base.tell} The correct pair shares that same relation; every wrong pair either `
          + `reverses the base pair's own words or relates its two words a different way.`,
      };
    },
  }));

  // FORMAT 1 - secondary but still a real AFOQT format (about 1 in 4 sourced items).
  made.push(registerTemplate({
    id: `${idBase}-term`,
    subtest: 'VA',
    band,
    name: `${name} - complete the fourth term`,
    concepts: [...new Set([...ownConcepts, 'va-relation-format'])],
    calibratedAgainst,
    stemSpace: rows.length,
    generate: (rng, h) => {
      const base = h.pick(rows);
      const built = buildFourthTerm(base, rows, band, rng);
      if (!built) return null;
      const { correctWord, partner, distractors } = built;
      const { choices, correctIndex, errors, whys } = h.choices(cap(correctWord), distractors);
      return {
        stem: `${base.a.word.toUpperCase()} is to ${base.b.word.toUpperCase()} as `
          + `${partner.a.word.toUpperCase()} is to:`,
        choices, correctIndex, errors, whys,
        tags: ['va', ...base.concepts],
        explanation: `${cap(base.a.word)} is to ${cap(base.b.word)} by ${readRelation(base.relation)}: `
          + `${base.tell} ${cap(partner.a.word)} takes the same relation to "${cap(correctWord)}".`,
      };
    },
  }));

  return made;
}
