// Chapter 3 — Cause to effect, and doer to action.
//
// PART 10C of docs/afoqt/HANDOFF.md. Two relations that both name what happens BETWEEN two
// things (unlike chapter 2's structural family), but in different directions:
//   - cause-effect: a MAKES b happen. The relation runs one way (a causes b), and the effect
//     must be DIRECT — a single step, not a chain of downstream consequences. FIRE/SMOKE
//     passes; FIRE/HOMELESSNESS fails (too many causal steps between the two).
//   - action-object: a IS what b does that DEFINES it. BARK/DOG passes because barking is what
//     a dog characteristically does; EAT/DOG fails because eating does not define a dog — nearly
//     everything eats. The defining test: is this the thing b IS KNOWN for, or just something
//     b sometimes happens to do?
//
// Neither relation is symmetric. `symmetric` is left at its default (false) on every row here —
// see the PART 10B header comment in ch02-structure.js for why that flag needs to be set
// correctly and what breaks if it is not.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-03-cause-consequence';
const CAUSE_EFFECT = ['va-cause-effect'];
const ACTION_OBJECT = ['va-action-object'];

registerRelations([
  // ============================ BAND 2 — everyday, on-sight words ============================
  {
    id: 'va-ce-fire', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'fire', pos: 'noun' }, b: { word: 'smoke', pos: 'noun' },
    tell: 'Fire directly produces smoke - one step, no chain of downstream events in between.',
  },
  {
    id: 'va-ce-rain', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'rain', pos: 'noun' }, b: { word: 'puddle', pos: 'noun' },
    tell: 'Rain directly leaves a puddle behind - immediate, not a multi-step consequence.',
  },
  {
    id: 'va-ce-sun', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'sun', pos: 'noun' }, b: { word: 'sunburn', pos: 'noun' },
    tell: 'Too much sun directly causes a sunburn - the effect on the skin itself, not something further downstream.',
  },
  {
    id: 'va-ce-collision', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'collision', pos: 'noun' }, b: { word: 'dent', pos: 'noun' },
    tell: 'A collision directly leaves a dent - the immediate mark, not an insurance claim three steps later.',
  },
  {
    id: 'va-ao-bark', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'bark', pos: 'verb' }, b: { word: 'dog', pos: 'noun' },
    tell: 'Barking is what a dog is known for - the defining action, not just something it occasionally does.',
    confusions: ['va-ce-fire'],
  },
  {
    id: 'va-ao-meow', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'meow', pos: 'verb' }, b: { word: 'cat', pos: 'noun' },
    tell: 'Meowing is the defining sound of a cat, the same way barking defines a dog.',
  },
  {
    id: 'va-ao-teach', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'teach', pos: 'verb' }, b: { word: 'teacher', pos: 'noun' },
    tell: 'Teaching is the defining action of a teacher - it is the job itself, not an occasional task.',
  },
  {
    id: 'va-ao-cook', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'cook', pos: 'verb' }, b: { word: 'chef', pos: 'noun' },
    tell: 'Cooking is the defining action of a chef, the same way teaching defines a teacher.',
  },

  // ======================= BAND 3 — standard test-prep vocabulary ============================
  {
    id: 'va-ce-lightning', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'lightning', pos: 'noun' }, b: { word: 'thunder', pos: 'noun' },
    tell: 'Lightning directly produces the thunder that follows it - immediate, not a chain of later events.',
  },
  {
    id: 'va-ce-friction', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'friction', pos: 'noun' }, b: { word: 'heat', pos: 'noun' },
    tell: 'Friction directly generates heat - the immediate physical effect, not something further removed.',
  },
  {
    id: 'va-ce-infection', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'infection', pos: 'noun' }, b: { word: 'fever', pos: 'noun' },
    tell: 'An infection directly triggers a fever - the body\'s immediate response, not a downstream complication.',
    confusions: ['va-ao-diagnose'],
  },
  {
    id: 'va-ce-eruption', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'eruption', pos: 'noun' }, b: { word: 'ash', pos: 'noun' },
    tell: 'A volcanic eruption directly produces ash - the immediate output of the event.',
  },
  {
    id: 'va-ao-diagnose', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'diagnose', pos: 'verb' }, b: { word: 'physician', pos: 'noun' },
    tell: 'Diagnosing illness is the defining action of a physician.',
    confusions: ['va-ce-infection'],
  },
  {
    id: 'va-ao-legislate', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'legislate', pos: 'verb' }, b: { word: 'senator', pos: 'noun' },
    tell: 'Legislating - writing and passing law - is the defining action of a senator.',
  },
  {
    id: 'va-ao-officiate', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'officiate', pos: 'verb' }, b: { word: 'referee', pos: 'noun' },
    tell: 'Officiating a game is the defining action of a referee.',
  },
  {
    id: 'va-ao-prosecute', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'prosecute', pos: 'verb' }, b: { word: 'attorney', pos: 'noun' },
    tell: 'Prosecuting a case is a defining action of an attorney, the same way diagnosing defines a physician.',
  },

  // ========================= BAND 4 — low-frequency, inference-level ==========================
  {
    id: 'va-ce-vibration', chapter: CH, concepts: CAUSE_EFFECT, band: 4, relation: 'cause-effect',
    a: { word: 'vibration', pos: 'noun' }, b: { word: 'resonance', pos: 'noun' },
    tell: 'Vibration at a matching frequency directly produces resonance - one step, not a chain.',
  },
  {
    id: 'va-ce-erosion', chapter: CH, concepts: CAUSE_EFFECT, band: 4, relation: 'cause-effect',
    a: { word: 'erosion', pos: 'noun' }, b: { word: 'sedimentation', pos: 'noun' },
    tell: 'Erosion directly deposits the material that becomes sedimentation - the immediate next step.',
  },
  {
    id: 'va-ce-inflation', chapter: CH, concepts: CAUSE_EFFECT, band: 4, relation: 'cause-effect',
    a: { word: 'inflation', pos: 'noun' }, b: { word: 'devaluation', pos: 'noun' },
    tell: 'Inflation directly devalues a currency - the immediate economic effect, not a distant one.',
  },
  {
    id: 'va-ce-oxidation', chapter: CH, concepts: CAUSE_EFFECT, band: 4, relation: 'cause-effect',
    a: { word: 'oxidation', pos: 'noun' }, b: { word: 'corrosion', pos: 'noun' },
    tell: 'Oxidation is the direct chemical process that produces corrosion.',
  },
  {
    id: 'va-ao-adjudicate', chapter: CH, concepts: ACTION_OBJECT, band: 4, relation: 'action-object',
    a: { word: 'adjudicate', pos: 'verb' }, b: { word: 'magistrate', pos: 'noun' },
    tell: 'Adjudicating - ruling on a case - is the defining action of a magistrate.',
  },
  {
    id: 'va-ao-excavate', chapter: CH, concepts: ACTION_OBJECT, band: 4, relation: 'action-object',
    a: { word: 'excavate', pos: 'verb' }, b: { word: 'archaeologist', pos: 'noun' },
    tell: 'Excavating a site is the defining action of an archaeologist.',
  },
  {
    id: 'va-ao-forecast', chapter: CH, concepts: ACTION_OBJECT, band: 4, relation: 'action-object',
    a: { word: 'forecast', pos: 'verb' }, b: { word: 'meteorologist', pos: 'noun' },
    tell: 'Forecasting weather is the defining action of a meteorologist - it is the job itself.',
  },
  {
    id: 'va-ao-interrogate', chapter: CH, concepts: ACTION_OBJECT, band: 4, relation: 'action-object',
    a: { word: 'interrogate', pos: 'verb' }, b: { word: 'detective', pos: 'noun' },
    tell: 'Interrogating a suspect is the defining action of a detective.',
  },
]);

for (const band of [2, 3, 4]) {
  relationTemplates({ chapter: CH, band, idBase: `va-03-b${band}`, name: 'Cause to effect, doer to action' });
}
