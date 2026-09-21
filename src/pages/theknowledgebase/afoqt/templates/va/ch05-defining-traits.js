// Chapter 5 — What defines it.
//
// PART 11B of docs/afoqt/HANDOFF.md. REWRITTEN 2026-09-20 — read the "VA IS NOT A VOCABULARY
// TEST" note at the top of ../../engine/analogy.js before touching this file again.
//
// THE CALIBRATION BAR ("the sycophant rule"): Trey approved TYRANT:CRUELTY::SYCOPHANT:FLATTERY
// explicitly, verbatim: "3/4 of those words are readily understandable, only sycophant is 'band 1'
// [WK-band-1-or-harder], which means the question expects you to know it or figure it out based
// on the other words' meanings. But it is readily understandable rather than trying to guess the
// meaning of recalcitrant or parsimonious without context." Applied here: a row may carry AT MOST
// ONE moderately-elevated word, and only when the rest of the item makes it inferable, never an
// isolated word you either already know or don't. `probity`, `pugnacious`, `fiduciary` and
// `numismatist` failed that test (no contextual scaffolding makes them guessable) and were cut
// rather than kept for coverage's sake.
//
// One official concept, `va-object-attribute`, covering two readings (PART 8's design record,
// "folded in, not invented"):
//   - CLASSIC: a is the defining quality of b. FIERCE/TIGER passes (fierceness IS what a tiger
//     is known for). STRIPED/CHEETAH would fail (a true fact about cheetahs, but incidental —
//     it does not define what a cheetah IS the way speed does).
//   - WORKER-DOMAIN: a is a role, b is the setting/subject-matter that role is defined by.
//     SURGEON/HOSPITAL passes (a surgeon's role is defined by that setting). The same test
//     applies: does b define a's role, or merely locate them? A surgeon in a grocery store is
//     still a surgeon — the hospital is definitional, a grocery store would just be incidental.
//
// Split into two internal relation tags - TRAIT_DEFINES and ROLE_DOMAIN - so `samePool`
// (engine/analogy.js) only ever matches a row against a genuine same-shape partner (see the
// 2026-09-17 correction this file used to carry, in git history, for why: an adjective-defines-a-
// noun pair and a noun-role-defined-by-its-setting pair do not read as restatements of one
// relation side by side even though both satisfy the same abstract "a defines b" test).

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-05-defining-traits';
const OBJECT_ATTRIBUTE = ['va-object-attribute'];
const TRAIT_DEFINES = 'trait-defines';
const TRAIT_DEFINES_NOUN = 'trait-defines-noun';
const ROLE_DOMAIN = 'role-domain';

registerRelations([
  // ================================ BAND 2 — everyday cases ====================================
  {
    id: 'va-oa-fierce', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'fierce', pos: 'adj' }, b: { word: 'tiger', pos: 'noun' },
    tell: 'Fierceness is what a tiger is known for - a defining quality, not an incidental fact.',
  },
  {
    id: 'va-oa-swift', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'swift', pos: 'adj' }, b: { word: 'falcon', pos: 'noun' },
    tell: 'Speed is the defining quality of a falcon, the same way fierceness defines a tiger.',
  },
  {
    id: 'va-oa-brave', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'brave', pos: 'adj' }, b: { word: 'soldier', pos: 'noun' },
    tell: 'Bravery is the defining quality expected of a soldier.',
    confusions: ['va-ao-teach'],
  },
  {
    id: 'va-oa-sly', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'sly', pos: 'adj' }, b: { word: 'fox', pos: 'noun' },
    tell: 'Slyness is the defining quality of a fox.',
  },
  {
    id: 'va-oa-venomous', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'venomous', pos: 'adj' }, b: { word: 'cobra', pos: 'noun' },
    tell: 'Being venomous is the defining quality of a cobra.',
  },
  {
    id: 'va-oa-resilient', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'resilient', pos: 'adj' }, b: { word: 'bamboo', pos: 'noun' },
    tell: 'Resilience - bending without breaking - is the defining quality of bamboo.',
  },
  {
    id: 'va-oa-pilot', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'pilot', pos: 'noun' }, b: { word: 'cockpit', pos: 'noun' },
    tell: 'The cockpit defines a pilot\'s role - it is where the skill that makes them a pilot is exercised, not just a place they happen to be.',
  },
  {
    id: 'va-oa-lifeguard', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'lifeguard', pos: 'noun' }, b: { word: 'beach', pos: 'noun' },
    tell: 'The beach defines a lifeguard\'s role, the same way the cockpit defines a pilot\'s.',
  },
  {
    id: 'va-oa-farmer', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'farmer', pos: 'noun' }, b: { word: 'field', pos: 'noun' },
    tell: 'The field defines a farmer\'s role.',
  },
  {
    id: 'va-oa-librarian', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'librarian', pos: 'noun' }, b: { word: 'library', pos: 'noun' },
    tell: 'The library defines a librarian\'s role.',
  },
  {
    id: 'va-oa-surgeon', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'surgeon', pos: 'noun' }, b: { word: 'hospital', pos: 'noun' },
    tell: 'The hospital defines a surgeon\'s role - a surgeon in a grocery store is still a surgeon, but the hospital is where that role is defined.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-oa-beautician', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'beautician', pos: 'noun' }, b: { word: 'salon', pos: 'noun' },
    tell: 'The salon defines a beautician\'s role.',
  },
  {
    id: 'va-oa-journalist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'journalist', pos: 'noun' }, b: { word: 'newsroom', pos: 'noun' },
    tell: 'The newsroom defines a journalist\'s role.',
  },
  {
    id: 'va-oa-diplomat', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'diplomat', pos: 'noun' }, b: { word: 'embassy', pos: 'noun' },
    tell: 'The embassy defines a diplomat\'s role.',
  },
  {
    id: 'va-oa-curator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'curator', pos: 'noun' }, b: { word: 'museum', pos: 'noun' },
    tell: 'The museum defines a curator\'s role, the same way the hospital defines a surgeon\'s.',
  },

  // ============ BAND 3 — one inferable word at most, everything else still plain ================
  {
    id: 'va-oa-tenacious', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'tenacious', pos: 'adj' }, b: { word: 'bulldog', pos: 'noun' },
    tell: 'Tenacity - refusing to let go - is the defining quality of a bulldog.',
  },
  {
    id: 'va-oa-vigilant', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'vigilant', pos: 'adj' }, b: { word: 'sentry', pos: 'noun' },
    tell: 'Vigilance - constant watchfulness - is the entire defining purpose of a sentry\'s role.',
  },
  {
    id: 'va-oa-intrepid', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'intrepid', pos: 'adj' }, b: { word: 'explorer', pos: 'noun' },
    tell: 'Intrepidity - fearlessness in the face of danger - is the defining quality of an explorer.',
  },
  // 🔴 2026-09-20 CORRECTION - these three used to share the plain TRAIT_DEFINES tag with the
  // adjective-first rows above (fierce:tiger, faithful:dog...). Trey caught it: a generated item
  // based on FAITHFUL:DOG offered SYCOPHANT:FLATTERY as the marked-correct answer, right after
  // correctly excluding TURTLE:SLOW (the reversed form of SLOW:TURTLE) for running backwards.
  // His question - "Sycophant:flattery runs in the wrong direction too. how would that be more
  // right?" - was exactly right. FAITHFUL:DOG puts the trait word FIRST (adjective, then the
  // creature); SYCOPHANT:FLATTERY puts the trait word SECOND (entity-noun, then the trait-noun).
  // Both orderings are natural English on their own (adjectives lead, "tyrant, cruelty"-style
  // noun pairs trail - confirmed against quizlet3.md #4's own word order), but juxtaposed as
  // base-and-answer in one item they read backwards from each other - the identical bug class
  // the 2026-09-17 correction above already fixed once for TRAIT_DEFINES vs ROLE_DOMAIN ("an
  // adjective-defines-a-noun pair and a noun-role-defined-by-its-setting pair do not read as
  // restatements of one relation side by side"). Same fix, one level deeper: a THIRD internal tag
  // so `samePool` never offers a noun-first row as a direct, unreversed partner for an
  // adjective-first base (or vice versa). They can still surface as a crossPool "different
  // relation" trap against each other, which is fine - that's a real, separate check, not a
  // second correct answer.
  //
  // Confirmed against ResearchPics/quizlet3.md #4 ("AFOQT Official Practice"): TYRANT:CRUELTY as
  // SYCOPHANT:FLATTERY. Restyled here as its own base row rather than copied verbatim. This is the
  // calibration bar for the whole chapter - see the header note.
  {
    id: 'va-oa-sycophant', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES_NOUN,
    a: { word: 'sycophant', pos: 'noun' }, b: { word: 'flattery', pos: 'noun' },
    tell: 'Flattery is the entire defining behavior of a sycophant - it is what the word means.',
  },
  // Confirmed against quizlet3.md #8: ANARCHIST:DISORDER as PACIFIST:PEACE.
  {
    id: 'va-oa-anarchist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES_NOUN,
    a: { word: 'anarchist', pos: 'noun' }, b: { word: 'disorder', pos: 'noun' },
    tell: 'Promoting disorder is the defining aim of an anarchist.',
  },
  {
    id: 'va-oa-zealot', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES_NOUN,
    a: { word: 'zealot', pos: 'noun' }, b: { word: 'fanaticism', pos: 'noun' },
    tell: 'Fanaticism is the defining trait of a zealot, the same way flattery defines a sycophant.',
  },
  // Confirmed against quizlet8.md #23: CARDIOLOGIST:HEART as (correct) neurologist:brain.
  {
    id: 'va-oa-cardiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'cardiologist', pos: 'noun' }, b: { word: 'heart', pos: 'noun' },
    tell: 'The heart is the subject-matter domain that defines a cardiologist\'s role.',
  },
  {
    id: 'va-oa-anesthesiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'anesthesiologist', pos: 'noun' }, b: { word: 'surgery', pos: 'noun' },
    tell: 'Surgery is the setting that defines an anesthesiologist\'s role.',
  },
  {
    id: 'va-oa-arbitrator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'arbitrator', pos: 'noun' }, b: { word: 'dispute', pos: 'noun' },
    tell: 'Settling a dispute is the subject-matter domain that defines an arbitrator\'s role.',
  },
  {
    id: 'va-oa-herpetologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'herpetologist', pos: 'noun' }, b: { word: 'reptiles', pos: 'noun' },
    tell: 'Reptiles are the subject-matter domain that defines a herpetologist\'s role.',
  },
  {
    id: 'va-oa-lexicographer', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'lexicographer', pos: 'noun' }, b: { word: 'dictionaries', pos: 'noun' },
    tell: 'Compiling dictionaries defines a lexicographer\'s role, the same way reptiles define a herpetologist\'s.',
  },
]);

// Harvested 2026-09-20 from "AFOQT Verbal Analogies — 50 New Study Bank Questions.md" - see the
// note above ch02-structure.js's equivalent block.
registerRelations([
  {
    id: 'va-oa-proud', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'proud', pos: 'adj' }, b: { word: 'peacock', pos: 'noun' },
    tell: 'Pride is the defining quality of a peacock, the same way fierceness defines a tiger.',
  },
  {
    id: 'va-oa-stubborn', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'stubborn', pos: 'adj' }, b: { word: 'mule', pos: 'noun' },
    tell: 'Stubbornness is the defining quality of a mule.',
  },
  {
    id: 'va-oa-busy', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'busy', pos: 'adj' }, b: { word: 'bee', pos: 'noun' },
    tell: 'Busyness is the defining quality of a bee.',
  },
  {
    id: 'va-oa-graceful', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'graceful', pos: 'adj' }, b: { word: 'swan', pos: 'noun' },
    tell: 'Gracefulness is the defining quality of a swan.',
  },
  {
    id: 'va-oa-wise', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: TRAIT_DEFINES,
    a: { word: 'wise', pos: 'adj' }, b: { word: 'owl', pos: 'noun' },
    tell: 'Wisdom is the defining quality of an owl.',
  },
  {
    id: 'va-oa-crafty', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'crafty', pos: 'adj' }, b: { word: 'raccoon', pos: 'noun' },
    tell: 'Craftiness is the defining quality of a raccoon.',
  },
  {
    id: 'va-oa-faithful', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'faithful', pos: 'adj' }, b: { word: 'dog', pos: 'noun' },
    tell: 'Faithfulness is the defining quality of a dog.',
  },
  {
    id: 'va-oa-slow', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'slow', pos: 'adj' }, b: { word: 'turtle', pos: 'noun' },
    tell: 'Slowness is the defining quality of a turtle.',
  },

  {
    id: 'va-oa-chef', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'chef', pos: 'noun' }, b: { word: 'kitchen', pos: 'noun' },
    tell: 'The kitchen defines a chef\'s role, the same way the cockpit defines a pilot\'s.',
  },
  {
    id: 'va-oa-judge', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'judge', pos: 'noun' }, b: { word: 'courthouse', pos: 'noun' },
    tell: 'The courthouse defines a judge\'s role.',
  },
  {
    id: 'va-oa-teacher', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'teacher', pos: 'noun' }, b: { word: 'classroom', pos: 'noun' },
    tell: 'The classroom defines a teacher\'s role.',
  },
  {
    id: 'va-oa-miner', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: ROLE_DOMAIN,
    a: { word: 'miner', pos: 'noun' }, b: { word: 'mine', pos: 'noun' },
    tell: 'The mine defines a miner\'s role, the same way the classroom defines a teacher\'s.',
  },
  {
    id: 'va-oa-actor', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'actor', pos: 'noun' }, b: { word: 'stage', pos: 'noun' },
    tell: 'The stage defines an actor\'s role.',
  },
  {
    id: 'va-oa-chemist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'chemist', pos: 'noun' }, b: { word: 'laboratory', pos: 'noun' },
    tell: 'The laboratory defines a chemist\'s role, the same way the stage defines an actor\'s.',
  },
  {
    id: 'va-oa-artist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'artist', pos: 'noun' }, b: { word: 'studio', pos: 'noun' },
    tell: 'The studio defines an artist\'s role.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-05-b${band}`, name: 'What defines it' });
}
