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
// Both readings get the SAME `relation: 'object-attribute'` tag on every row, on purpose — they
// are one official concept, not two, so a worker-domain pair is a valid "same relation" match
// for a classic pair's format-2 question, never offered as a wrong-relation trap against it.
// Because this chapter declares only the one concept, crossPool (engine/analogy.js) draws every
// wrong-relation distractor from the REST OF THE BANK — chapters 2, 3 and 4 — which is exactly
// why this file runs last: the bank is largest by the time it's written.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-05-defining-traits';
const OBJECT_ATTRIBUTE = ['va-object-attribute'];

registerRelations([
  // ============================ BAND 2 — everyday, on-sight words ============================
  {
    id: 'va-oa-fierce', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'fierce', pos: 'adj' }, b: { word: 'tiger', pos: 'noun' },
    tell: 'Fierceness is what a tiger is known for - a defining quality, not an incidental fact.',
  },
  {
    id: 'va-oa-swift', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'swift', pos: 'adj' }, b: { word: 'falcon', pos: 'noun' },
    tell: 'Speed is the defining quality of a falcon, the same way fierceness defines a tiger.',
  },
  {
    id: 'va-oa-brave', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'brave', pos: 'adj' }, b: { word: 'soldier', pos: 'noun' },
    tell: 'Bravery is the defining quality expected of a soldier.',
    confusions: ['va-ao-teach'],
  },
  {
    id: 'va-oa-sly', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'sly', pos: 'adj' }, b: { word: 'fox', pos: 'noun' },
    tell: 'Slyness is the defining quality of a fox.',
  },
  {
    id: 'va-oa-pilot', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'pilot', pos: 'noun' }, b: { word: 'cockpit', pos: 'noun' },
    tell: 'The cockpit defines a pilot\'s role - it is where the skill that makes them a pilot is exercised, not just a place they happen to be.',
  },
  {
    id: 'va-oa-lifeguard', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'lifeguard', pos: 'noun' }, b: { word: 'beach', pos: 'noun' },
    tell: 'The beach defines a lifeguard\'s role, the same way the cockpit defines a pilot\'s.',
  },
  {
    id: 'va-oa-farmer', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'farmer', pos: 'noun' }, b: { word: 'field', pos: 'noun' },
    tell: 'The field defines a farmer\'s role.',
  },
  {
    id: 'va-oa-librarian', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 2, relation: 'object-attribute',
    a: { word: 'librarian', pos: 'noun' }, b: { word: 'library', pos: 'noun' },
    tell: 'The library defines a librarian\'s role.',
  },

  // ======================= BAND 3 — standard test-prep vocabulary ============================
  {
    id: 'va-oa-tenacious', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'tenacious', pos: 'adj' }, b: { word: 'bulldog', pos: 'noun' },
    tell: 'Tenacity is the defining quality of a bulldog.',
  },
  {
    id: 'va-oa-venomous', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'venomous', pos: 'adj' }, b: { word: 'cobra', pos: 'noun' },
    tell: 'Being venomous is the defining quality of a cobra.',
  },
  {
    id: 'va-oa-resilient', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'resilient', pos: 'adj' }, b: { word: 'bamboo', pos: 'noun' },
    tell: 'Resilience - bending without breaking - is the defining quality of bamboo.',
  },
  {
    id: 'va-oa-vigilant', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'vigilant', pos: 'adj' }, b: { word: 'sentry', pos: 'noun' },
    tell: 'Vigilance is the entire defining purpose of a sentry\'s role.',
  },
  {
    id: 'va-oa-surgeon', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'surgeon', pos: 'noun' }, b: { word: 'hospital', pos: 'noun' },
    tell: 'The hospital defines a surgeon\'s role - a surgeon in a grocery store is still a surgeon, but the hospital is where that role is defined.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-oa-cardiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'cardiologist', pos: 'noun' }, b: { word: 'heart', pos: 'noun' },
    tell: 'The heart is the subject-matter domain that defines a cardiologist\'s role.',
  },
  {
    id: 'va-oa-beautician', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'beautician', pos: 'noun' }, b: { word: 'salon', pos: 'noun' },
    tell: 'The salon defines a beautician\'s role.',
  },
  {
    id: 'va-oa-journalist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 3, relation: 'object-attribute',
    a: { word: 'journalist', pos: 'noun' }, b: { word: 'newsroom', pos: 'noun' },
    tell: 'The newsroom defines a journalist\'s role.',
  },

  // ========================= BAND 4 — low-frequency, inference-level ==========================
  {
    id: 'va-oa-probity', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'probity', pos: 'noun' }, b: { word: 'judge', pos: 'noun' },
    tell: 'Probity - unimpeachable honesty - is the defining quality expected of a judge.',
    confusions: ['va-ao-adjudicate'],
  },
  {
    id: 'va-oa-pugnacious', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'pugnacious', pos: 'adj' }, b: { word: 'combatant', pos: 'noun' },
    tell: 'Pugnacity - a readiness to fight - is the defining quality of a combatant.',
  },
  {
    id: 'va-oa-fiduciary', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'fiduciary', pos: 'adj' }, b: { word: 'trustee', pos: 'noun' },
    tell: 'Fiduciary responsibility - the obligation to act in someone else\'s interest - is the defining quality of a trustee, not an incidental fact about them.',
  },
  {
    id: 'va-oa-intrepid', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'intrepid', pos: 'adj' }, b: { word: 'explorer', pos: 'noun' },
    tell: 'Intrepidity - fearlessness in the face of danger - is the defining quality of an explorer.',
  },
  {
    id: 'va-oa-diplomat', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'diplomat', pos: 'noun' }, b: { word: 'embassy', pos: 'noun' },
    tell: 'The embassy defines a diplomat\'s role.',
  },
  {
    id: 'va-oa-anesthesiologist', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'anesthesiologist', pos: 'noun' }, b: { word: 'surgery', pos: 'noun' },
    tell: 'Surgery is the setting that defines an anesthesiologist\'s role.',
  },
  {
    id: 'va-oa-curator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'curator', pos: 'noun' }, b: { word: 'museum', pos: 'noun' },
    tell: 'The museum defines a curator\'s role, the same way the hospital defines a surgeon\'s.',
  },
  {
    id: 'va-oa-arbitrator', chapter: CH, concepts: OBJECT_ATTRIBUTE, band: 4, relation: 'object-attribute',
    a: { word: 'arbitrator', pos: 'noun' }, b: { word: 'tribunal', pos: 'noun' },
    tell: 'The tribunal defines an arbitrator\'s role.',
  },
]);

for (const band of [2, 3, 4]) {
  relationTemplates({ chapter: CH, band, idBase: `va-05-b${band}`, name: 'What defines it' });
}
