// Chapter 5 — What defines it.
//
// PART 11B of docs/afoqt/HANDOFF.md. One official concept, `va-object-attribute`, covering two
// readings (PART 8's design record, "folded in, not invented"):
//   - CLASSIC: a is the defining quality of b. FIERCE/TIGER passes (fierceness IS what a tiger
//     is known for). STRIPED/CHEETAH would fail (a true fact about cheetahs, but incidental —
//     it does not define what a cheetah IS the way speed does).
//   - WORKER-DOMAIN: a is a role, b is the setting/subject-matter that role is defined by.
//     SURGEON/HOSPITAL passes (a surgeon's role is defined by that setting). The same test
//     applies: does b define a's role, or merely locate them? A surgeon in a grocery store is
//     still a surgeon — the hospital is definitional, a grocery store would just be incidental.
//
// 🔴 2026-09-17 CORRECTION - both readings used to share ONE `relation: 'object-attribute'` tag,
// on the theory that they are one official concept and a worker-domain pair should be a valid
// "same relation" MATCH for a classic pair's format-2 question. In practice that generated
// "SURGEON is to HOSPITAL as: ... VIGILANT is to SENTRY" as the marked-CORRECT answer - Trey,
// verbatim: "that is a TERRIBLE answer and not true." He is right: an adjective-defines-a-noun
// pair (VIGILANT:SENTRY, cross-part-of-speech) and a noun-role-defined-by-its-setting pair
// (SURGEON:HOSPITAL, noun:noun) do not read as restatements of the same relation side by side,
// even though both satisfy the same abstract "a defines b" test in isolation. They still share
// ONE official concept (`va-object-attribute` below, untouched - see curriculum/chapters.js,
// which only reads `concepts`, never the internal `relation` tag), but are now split into two
// internal relation tags - TRAIT_DEFINES and ROLE_DOMAIN - so `samePool` (engine/analogy.js)
// only ever matches a row against a genuine same-shape partner. A worker-domain pair can still
// surface as a wrong-relation TRAP against a trait-defines question (and vice versa) via
// crossPool, which is exactly the "different relation family" discriminator the real test uses -
// it is now a labeled MISTAKE instead of a second correct answer.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-05-defining-traits';
const OBJECT_ATTRIBUTE = ['va-object-attribute'];
const TRAIT_DEFINES = 'trait-defines';
const ROLE_DOMAIN = 'role-domain';

registerRelations([
  // ============================ BAND 2 — everyday, on-sight words ============================
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

  // ======================= BAND 3 — standard test-prep vocabulary ============================
  {
    id: 'va-oa-tenacious', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'tenacious', pos: 'adj' }, b: { word: 'bulldog', pos: 'noun' },
    tell: 'Tenacity is the defining quality of a bulldog.',
  },
  {
    id: 'va-oa-venomous', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'venomous', pos: 'adj' }, b: { word: 'cobra', pos: 'noun' },
    tell: 'Being venomous is the defining quality of a cobra.',
  },
  {
    id: 'va-oa-resilient', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'resilient', pos: 'adj' }, b: { word: 'bamboo', pos: 'noun' },
    tell: 'Resilience - bending without breaking - is the defining quality of bamboo.',
  },
  {
    id: 'va-oa-vigilant', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: TRAIT_DEFINES,
    a: { word: 'vigilant', pos: 'adj' }, b: { word: 'sentry', pos: 'noun' },
    tell: 'Vigilance is the entire defining purpose of a sentry\'s role.',
  },
  {
    id: 'va-oa-surgeon', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'surgeon', pos: 'noun' }, b: { word: 'hospital', pos: 'noun' },
    tell: 'The hospital defines a surgeon\'s role - a surgeon in a grocery store is still a surgeon, but the hospital is where that role is defined.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-oa-cardiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'cardiologist', pos: 'noun' }, b: { word: 'heart', pos: 'noun' },
    tell: 'The heart is the subject-matter domain that defines a cardiologist\'s role.',
  },
  {
    id: 'va-oa-beautician', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'beautician', pos: 'noun' }, b: { word: 'salon', pos: 'noun' },
    tell: 'The salon defines a beautician\'s role.',
  },
  {
    id: 'va-oa-journalist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: ROLE_DOMAIN,
    a: { word: 'journalist', pos: 'noun' }, b: { word: 'newsroom', pos: 'noun' },
    tell: 'The newsroom defines a journalist\'s role.',
  },

  // ========================= BAND 4 — low-frequency, inference-level ==========================
  {
    id: 'va-oa-probity', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: TRAIT_DEFINES,
    a: { word: 'probity', pos: 'noun' }, b: { word: 'judge', pos: 'noun' },
    tell: 'Probity - unimpeachable honesty - is the defining quality expected of a judge.',
    confusions: ['va-ao-adjudicate'],
  },
  {
    id: 'va-oa-pugnacious', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: TRAIT_DEFINES,
    a: { word: 'pugnacious', pos: 'adj' }, b: { word: 'combatant', pos: 'noun' },
    tell: 'Pugnacity - a readiness to fight - is the defining quality of a combatant.',
  },
  {
    id: 'va-oa-fiduciary', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: TRAIT_DEFINES,
    a: { word: 'fiduciary', pos: 'adj' }, b: { word: 'trustee', pos: 'noun' },
    tell: 'Fiduciary responsibility - the obligation to act in someone else\'s interest - is the defining quality of a trustee, not an incidental fact about them.',
  },
  {
    id: 'va-oa-intrepid', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: TRAIT_DEFINES,
    a: { word: 'intrepid', pos: 'adj' }, b: { word: 'explorer', pos: 'noun' },
    tell: 'Intrepidity - fearlessness in the face of danger - is the defining quality of an explorer.',
  },
  {
    id: 'va-oa-diplomat', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: ROLE_DOMAIN,
    a: { word: 'diplomat', pos: 'noun' }, b: { word: 'embassy', pos: 'noun' },
    tell: 'The embassy defines a diplomat\'s role.',
  },
  {
    id: 'va-oa-anesthesiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: ROLE_DOMAIN,
    a: { word: 'anesthesiologist', pos: 'noun' }, b: { word: 'surgery', pos: 'noun' },
    tell: 'Surgery is the setting that defines an anesthesiologist\'s role.',
  },
  {
    id: 'va-oa-curator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: ROLE_DOMAIN,
    a: { word: 'curator', pos: 'noun' }, b: { word: 'museum', pos: 'noun' },
    tell: 'The museum defines a curator\'s role, the same way the hospital defines a surgeon\'s.',
  },
  {
    id: 'va-oa-arbitrator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: ROLE_DOMAIN,
    a: { word: 'arbitrator', pos: 'noun' }, b: { word: 'tribunal', pos: 'noun' },
    tell: 'The tribunal defines an arbitrator\'s role.',
  },

  // ============ BAND 5 — added 2026-09-17, closing the VA band-5 gap (see ch04's note). ========
  // TRAIT_DEFINES here runs noun:noun rather than adj:noun - "a person characterized by an
  // abstract quality" is the same relation as fierce:tiger, just with the quality itself named
  // as a noun instead of an adjective (SYCOPHANT:FLATTERY, not "SYCOPHANTIC:FLATTERY") - a real
  // pattern confirmed against the sourced practice items (ResearchPics/quizlet3.md #4,
  // TYRANT:CRUELTY / SYCOPHANT:FLATTERY), restyled here rather than copied.
  {
    id: 'va-oa-sycophant', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: TRAIT_DEFINES,
    a: { word: 'sycophant', pos: 'noun' }, b: { word: 'flattery', pos: 'noun' },
    tell: 'Flattery is the entire defining behavior of a sycophant - it is what the word means.',
  },
  {
    id: 'va-oa-anarchist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: TRAIT_DEFINES,
    a: { word: 'anarchist', pos: 'noun' }, b: { word: 'disorder', pos: 'noun' },
    tell: 'Promoting disorder is the defining aim of an anarchist.',
  },
  {
    id: 'va-oa-zealot', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: TRAIT_DEFINES,
    a: { word: 'zealot', pos: 'noun' }, b: { word: 'fanaticism', pos: 'noun' },
    tell: 'Fanaticism is the defining trait of a zealot, the same way flattery defines a sycophant.',
  },
  {
    id: 'va-oa-numismatist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: ROLE_DOMAIN,
    a: { word: 'numismatist', pos: 'noun' }, b: { word: 'coinage', pos: 'noun' },
    tell: 'Coinage is the subject-matter domain that defines a numismatist\'s role.',
  },
  {
    id: 'va-oa-herpetologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: ROLE_DOMAIN,
    a: { word: 'herpetologist', pos: 'noun' }, b: { word: 'reptiles', pos: 'noun' },
    tell: 'Reptiles are the subject-matter domain that defines a herpetologist\'s role.',
  },
  {
    id: 'va-oa-lexicographer', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 5, relation: ROLE_DOMAIN,
    a: { word: 'lexicographer', pos: 'noun' }, b: { word: 'dictionaries', pos: 'noun' },
    tell: 'Compiling dictionaries defines a lexicographer\'s role, the same way coinage defines a numismatist\'s.',
  },
]);

for (const band of [2, 3, 4, 5]) {
  relationTemplates({ chapter: CH, band, idBase: `va-05-b${band}`, name: 'What defines it' });
}
