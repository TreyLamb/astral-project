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
// 🔴 2026-09-20 — FORMAT 1 IS DISABLED. Do not re-enable it by un-commenting the registerTemplate
// call in relationTemplates() without reading this first, and without fixing what's described here.
//
// Trey caught a generated item ("PARSIMONIOUS is to MISERLY as RECALCITRANT is to:") that offered
// "Parsimonious" and "Miserly" — the stem's OWN two words — as 2 of its 4 wrong answers. That was
// buildFourthTerm's "reused-base-word" distractor, and it is a straight bug: checked against every
// one of the 75 real sourced items (ResearchPics/quizlet3.md + quizlet8.md), NONE of them ever
// offers a stem word back as a choice. Fixed below.
//
// But fixing that bug exposed a SECOND, deeper problem that is why format 1 is off rather than
// just patched. Read all 19 real format-1 items in the two source files side by side and every
// single one draws its WRONG answers from the same real-world TOPIC as the stem's third word —
// FORK:EAT::PEN:[INK, PENCIL, WRITE, LETTER, BOOK] (all pen/writing objects), TENSION:STRESS::
// VIRUS:[LIVING, DISEASE, BACTERIA, IMMUNITY, MORBIDITY] (all illness words), ODOMETER:MILEAGE::
// COMPASS:[SPEED, HIKING, NEEDLE, DIRECTION, HUMIDITY] (all wayfinding/outdoor words). That
// clustering is what makes the wrong answers plausible enough to require knowing the RELATION,
// not just recognizing an unrelated word. `crossPool()` (used by format 2 successfully) draws
// distractors by "different relation tag, same band" — completely blind to topic — so swapping it
// in for the reused-base-word bug still produces things like "FUSELAGE is to: AIRCRAFT(correct),
// POEM, FRANK, MALEVOLENT, COAL": four wildly unrelated single words next to one obvious topical
// fit. That is not just off-flavor, it is a correctness problem — the domain mismatch alone gives
// the answer away without the test-taker ever reasoning about the relation.
//
// Format 2 does NOT have this problem — checked the same way against real items (e.g. "ACTOR is
// to STAGE as: PATIENT:DOCTOR / OUTSIDE:BENCH / GARAGE:CAR / TEACHER:CLASSROOM / METER:ELECTRICITY")
// and its wrong PAIRS genuinely do come from unrelated topics; only the relation type has to match.
// That is exactly what crossPool()/buildMatch() already do, so format 2 needed no design change,
// just this file's own bug fix (buildFourthTerm, see below) and stays the sole VA frame for now.
//
// Re-enabling format 1 for real needs per-relation-row DOMAIN-CLUSTERED distractor words authored
// by hand (a `topicPool` of same-subject wrong words per row, not a blind cross-relation draw) —
// a real authoring lift across every chapter, not a one-line fix. Flagged, not silently dropped;
// ask Trey before investing in it. Until then, relationTemplates() registers format 2 only.
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
 * @property {1|2|3|4|5} band        VA effectively has no difficulty ladder — only bands 2 and 3
 *                                   are registered, at the SAME vocabulary ceiling; 3 differs from
 *                                   2 only in how close the wrong pairs are, never in word rarity.
 *                                   See the "VA IS NOT A VOCABULARY TEST" note above wordBand().
 * @property {string} relation       short internal tag ('part-whole', 'cause-effect', ...). Not
 *                                   the same thing as `concepts`: two rows in different chapters
 *                                   can legitimately share a relation tag (used to pool "same
 *                                   relation" and "different relation" candidates across the
 *                                   whole bank), while a concept stays scoped to one chapter.
 * @property {boolean} [symmetric]   true when swapping a/b does not change the relation (e.g.
 *                                   PART_PART - ARM/LEG are co-equal, swapping changes nothing).
 *                                   Order-reversal is not a real trap for these, so the
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

// 🔴 VA IS NOT A VOCABULARY TEST — 2026-09-20, read before authoring or reviewing any RelationRow.
//
// Trey, verbatim, after "PARSIMONIOUS is to MISERLY as RECALCITRANT is to:" (band 4) and then
// "AUDACIOUS is to BRAZEN as: ... Recalcitrant : Intransigent" (also band 4) both shipped:
// "The point is not to test someone's vocabulary. It's to test their logical reasoning of how the
// words connect. The tester should NEVER HAVE TO GUESS WHAT A WORD MEANS." And, more precisely,
// on which relation types even qualify: "Audacious vs brazen? that is questioning the difference
// of the definition of the two words. Fork is to eat, pen is to... that is testing the logical
// connection between the words, it has nothing to do with the definition."
//
// This reverses the PART 8 design decision at the top of this file ("BAND IS WORD RARITY, NOT
// RELATION COMPLEXITY") — that decision is now known WRONG for VA and is kept here, struck
// through in spirit, only so nobody re-derives it independently and reintroduces the bug:
//
//   1. SYNONYM and ANTONYM are NOT banned relation types — that was this file's first draft of
//      this note, and it was an overcorrection, reversed the same day. Two things surfaced after
//      the ban: Trey's own lesson draft for ch04 (`TreysDontTouch.md`) teaches synonym/antonym
//      explicitly with plain words (FAST:QUICK, HOT:COLD, BENEVOLENT:MALEVOLENT), and two of the
//      ten OFFICIAL, cleared OATTS items in `data/realQuestions.json` — `oatts-VA-076`
//      (NATURAL:ARTIFICIAL::OBSCURE:OBVIOUS) and `oatts-VA-077` (FLAW:IMPERFECTION::RICH:WEALTHY)
//      — ARE synonym/antonym, both using dead-simple words. The real defect was never the
//      relation type; it was pairing "X means the same/opposite as Y" with SAT-tier vocabulary
//      (recalcitrant, parsimonious) that offers no path to reasoning it out. Rule 2 below is what
//      actually matters and applies to synonym/antonym exactly as hard as everything else — a
//      synonym/antonym row with a hard word is exactly as wrong as it ever was. DEGREE was never
//      in question (Trey confirmed it, it's in the commercial-book relation catalogue in
//      RESEARCH.md's VA SOURCING section, and `oatts-VA-078` confirms it officially too).
//   2. Every VA word must be simple enough that NO test-taker has to stop and guess a definition.
//      Trey's own calibration, given directly: `sponge, mechanic, ink, pencil, write, letter,
//      book, insect, ant` = fine. `delirious` (a word that would land around WK band 2-3) =
//      already too hard. The one narrow exception: a single moderately-elevated word is fine ONLY
//      when the item's own structure makes it inferable without prior memorization — his own
//      example, `TYRANT:CRUELTY::SYCOPHANT:FLATTERY`, has three plain words and "sycophant" is
//      figure-out-able from the pattern (a person defined by an abstract trait/behavior) the same
//      way tyrant is defined by cruelty. Compare `RECALCITRANT`/`PARSIMONIOUS`, which offer zero
//      contextual scaffolding and simply require already knowing the word. One inferable word per
//      item, never an isolated must-already-know word, never two hard words in the same item.
//   3. VA effectively has NO band ladder. "Most VA questions are just deep thinking questions. you
//      can't really make the[m] much more difficult without losing the concept" (Trey). Every VA
//      chapter now registers only bands 2 and 3, held to the SAME vocabulary ceiling — band 3
//      differs from band 2 only in how close the wrong pairs are to the right one (a subtler
//      relation-boundary judgment), never in word rarity. `wordBand()` below is a plain lookup now
//      with NO enforcement against it (see the removed cross-check in registerRelations) — a VA
//      word matching or beating its WK band is coincidence, not a requirement.
//   4. Distractors must be reasoned per item, not mechanically diverse. Trey: "Distractors are not
//      simply 'opposites' or 'what might someone conclude immediately' — you have to really look
//      at the question and know what relationship you're trying to match." Prefer declared
//      `confusions` (an author-picked genuine near-miss) over letting crossPool's blind draw
//      supply the wrong pairs — see the field's own doc above.
//
// Full source analysis this rewrite is built on: all 75 items in ResearchPics/quizlet3.md and
// quizlet8.md, categorized by relation type AND by what specifically makes each wrong answer
// wrong (reversed-order-of-a-different-pair, adjacent-but-distinct relation, cross-relation-
// family, antonym-of-the-pattern, synonym-flavor trap, or a plausible-sounding but underspecified
// pair) — none of them is a blind grab from "anything else in the bank at this difficulty."

/**
 * The band a word already carries in the WK bank, or null if it is not there. NOT enforced
 * against a VA row's own band (see the note above) — a mismatch is expected and correct, since VA
 * words are supposed to sit far below whatever WK calls the same word. Kept as a lookup an author
 * can consult by hand while choosing a word, not as a rule the registry checks for you.
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

    // 🔴 2026-09-20 — there used to be a check here forcing a word shared with the WK bank to
    // agree on band between the two subtests. That was exactly backwards under the corrected VA
    // doctrine (see the "VA IS NOT A VOCABULARY TEST" note above `wordBand()` below): VA words are
    // supposed to sit far BELOW whatever WK calls the same word's band, not match it. A shared
    // word disagreeing on band is now expected, not a defect - do not resurrect this check.

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
  const shuffledPartners = shuffle(partners, rng);
  const partner = shuffledPartners[0];
  const correct = renderPair(partner.a.word, partner.b.word);

  const distractors = [];
  // THE classic AFOQT reversed-order trap - but NOT built by flipping the base pair's own two
  // words. That was the original implementation and it produced things like "SURGEON is to
  // HOSPITAL as: ... Hospital is to Surgeon" - Trey, 2026-09-17: "that's not ever going to be a
  // real answer. that's lazy shortcutting to make a 5th answer." He is right, and the real
  // sourced items agree: `docs/afoqt/RESEARCH.md`'s VA SOURCING items (ResearchPics/quizlet3.md)
  // never reverse the base pair's own literal words. #16 keys TANKER:SHIP against distractor
  // INSECT:ANT - a DIFFERENT member-category pair with its two roles swapped, not "SHIP:TANKER".
  // #24 keys HANDS:CLOCK against CARNIVORE:TIGER the same way. So the real trap is "this relation
  // is genuine, but here it runs backward" using a DIFFERENT same-relation pair, which reads as a
  // plausible foil instead of an obviously nonsensical restatement of the question. Falls back to
  // reversing the base pair itself only when the pool is too thin to offer a second row.
  // Skipped entirely for symmetric relations (SYNONYM, ANTONYM), where reversing changes
  // nothing - it would not be a real mistake and would just be a second correct answer.
  if (!base.symmetric) {
    const reversalSource = shuffledPartners[1] ?? base;
    distractors.push({
      value: renderPair(reversalSource.b.word, reversalSource.a.word),
      error: 'reversed-order',
      why: reversalSource === base
        ? `that is ${cap(base.a.word)} and ${cap(base.b.word)} in the wrong order - the relation runs `
          + `${cap(base.a.word)} to ${cap(base.b.word)}, not back the other way.`
        : `${cap(reversalSource.a.word)} and ${cap(reversalSource.b.word)} really do share this relation, `
          + `but in the wrong order - it runs ${cap(reversalSource.a.word)} to ${cap(reversalSource.b.word)}, `
          + `not back the other way.`,
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
 *
 * NOT CURRENTLY REGISTERED — see the "FORMAT 1 IS DISABLED" note at the top of this file before
 * wiring this back into relationTemplates(). Kept (and its reused-base-word bug fixed) so the
 * function is correct and ready once real per-row topic-clustered distractors exist; drawing from
 * crossPool() alone fixes the "repeats the stem's own words" bug but NOT the deeper domain-
 * clustering gap the top-of-file note describes.
 */
function buildFourthTerm(base, chapterRows, band, rng) {
  const partners = samePool(base, chapterRows);
  if (!partners) return null;
  const partner = partners[Math.floor(rng() * partners.length)];
  const correctWord = partner.b.word;

  const distractors = [];
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
    // Same treatment as engine/words.js: this template is a flat bag of independent relation
    // rows, so it is dealt per ITEM rather than per template and every row gets equal airtime.
    // Without it the drill dealt one slot per template regardless of pool size, and a row in a
    // small chapter/band pool was asked far more often than one in a large pool - measured at
    // sd/sqrt 3.01 against the 1.0 a uniform draw gives. See docs/afoqt/QUESTION-SELECTION.md.
    itemPool: true,
    itemKeys: () => rows.map((r) => r.id),
    generate: (rng, h) => {
      const base = rows[h.item % rows.length];
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

  // FORMAT 1 IS DISABLED — see the "FORMAT 1 IS DISABLED" note at the top of this file for why
  // (reused-stem-word distractor bug, plus the deeper domain-clustering gap that fixing the bug
  // alone doesn't close). buildFourthTerm() is still correct and ready for when real per-row
  // topic-clustered distractors exist to register this from; do not re-add the registerTemplate
  // call here without that data.

  return made;
}
