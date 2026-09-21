// Chapter 3 — Cause to effect, and doer to action.
//
// PART 10C of docs/afoqt/HANDOFF.md. REWRITTEN 2026-09-20 — read the "VA IS NOT A VOCABULARY
// TEST" note at the top of ../../engine/analogy.js before touching this file again. Vocabulary
// that needed prior memorization to parse (devaluation, avarice, connive, expurgate - none of
// them inferable from context) was cut rather than kept for its own sake, and bands 4/5 folded
// into bands 2/3 - VA has no real difficulty ladder, both bands share the same vocabulary
// ceiling and differ only in how obvious the pairing is.
//
// Two relations that both name what happens BETWEEN two things, but in different directions:
//   - cause-effect: a MAKES b happen. The relation runs one way (a causes b), and the effect
//     must be DIRECT — a single step, not a chain of downstream consequences. FIRE/SMOKE
//     passes; FIRE/HOMELESSNESS fails (too many causal steps between the two).
//   - action-object: a IS what b does that DEFINES it. BARK/DOG passes because barking is what
//     a dog characteristically does; EAT/DOG fails because eating does not define a dog — nearly
//     everything eats. The defining test: is this the thing b IS KNOWN for, or just something
//     b sometimes happens to do?
//
// Neither relation is symmetric. `symmetric` is left at its default (false) on every row here.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-03-cause-consequence';
const CAUSE_EFFECT = ['va-cause-effect'];
const ACTION_OBJECT = ['va-action-object'];

registerRelations([
  // ================================ BAND 2 — everyday cases ====================================
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
  {
    id: 'va-ao-excavate', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'excavate', pos: 'verb' }, b: { word: 'archaeologist', pos: 'noun' },
    tell: 'Excavating a site is the defining action of an archaeologist.',
  },
  {
    id: 'va-ao-forecast', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'forecast', pos: 'verb' }, b: { word: 'meteorologist', pos: 'noun' },
    tell: 'Forecasting weather is the defining action of a meteorologist - it is the job itself.',
  },
  {
    id: 'va-ao-interrogate', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'interrogate', pos: 'verb' }, b: { word: 'detective', pos: 'noun' },
    tell: 'Interrogating a suspect is the defining action of a detective.',
  },

  // ==================== BAND 3 — same simple words, less obvious pairing ======================
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
    id: 'va-ce-oxidation', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'oxidation', pos: 'noun' }, b: { word: 'corrosion', pos: 'noun' },
    tell: 'Oxidation is the direct chemical process that produces corrosion (rust).',
  },
  {
    id: 'va-ce-erosion', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'erosion', pos: 'noun' }, b: { word: 'sediment', pos: 'noun' },
    tell: 'Erosion directly wears material away into sediment - the immediate next step.',
  },
  {
    id: 'va-ce-negligence', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'negligence', pos: 'noun' }, b: { word: 'liability', pos: 'noun' },
    tell: 'Negligence directly creates liability - the immediate legal consequence, not a distant one.',
  },
  {
    id: 'va-ce-provocation', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'provocation', pos: 'noun' }, b: { word: 'retaliation', pos: 'noun' },
    tell: 'A provocation directly triggers retaliation - the immediate response, not a downstream one.',
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
  {
    id: 'va-ao-adjudicate', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'adjudicate', pos: 'verb' }, b: { word: 'magistrate', pos: 'noun' },
    tell: 'Adjudicating - ruling on a case - is the defining action of a magistrate (a judge).',
  },
  {
    id: 'va-ao-embalm', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'embalm', pos: 'verb' }, b: { word: 'mortician', pos: 'noun' },
    tell: 'Embalming is the defining action of a mortician.',
  },
  {
    id: 'va-ao-counterfeit', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'counterfeit', pos: 'verb' }, b: { word: 'forger', pos: 'noun' },
    tell: 'Counterfeiting is the defining action of a forger.',
  },
  {
    id: 'va-ao-filibuster', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'filibuster', pos: 'verb' }, b: { word: 'legislator', pos: 'noun' },
    tell: 'Filibustering - stalling a vote with prolonged speech - is a defining tactic of an obstructing legislator.',
  },
  {
    id: 'va-ao-proselytize', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'proselytize', pos: 'verb' }, b: { word: 'missionary', pos: 'noun' },
    tell: 'Proselytizing - trying to convert others to a belief - is the defining action of a missionary.',
  },
]);

// Harvested 2026-09-20 from "AFOQT Verbal Analogies — 50 New Study Bank Questions.md" - see the
// note above ch02-structure.js's equivalent block for why these were pulled as bare pairs rather
// than the doc's own fixed 5-choice questions (several of its distractors reverse the base pair's
// own two words, which buildMatch deliberately never does).
registerRelations([
  {
    id: 'va-ce-spark', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'spark', pos: 'noun' }, b: { word: 'flame', pos: 'noun' },
    tell: 'A spark directly produces a flame - one step, nothing in between.',
  },
  {
    id: 'va-ce-cold', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'cold', pos: 'noun' }, b: { word: 'shiver', pos: 'noun' },
    tell: 'Cold directly causes a shiver - the immediate physical response, not something further downstream.',
  },
  {
    id: 'va-ce-wind', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'wind', pos: 'noun' }, b: { word: 'wave', pos: 'noun' },
    tell: 'Wind directly produces waves - one step, not a chain of later events.',
  },
  {
    id: 'va-ce-exercise', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'exercise', pos: 'noun' }, b: { word: 'sweat', pos: 'noun' },
    tell: 'Exercise directly produces sweat - the immediate physical response.',
  },
  {
    id: 'va-ce-gravity', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'gravity', pos: 'noun' }, b: { word: 'falling', pos: 'noun' },
    tell: 'Gravity directly causes falling - one step, not a chain of events.',
  },
  {
    id: 'va-ce-bacteria', chapter: CH, concepts: CAUSE_EFFECT, band: 2, relation: 'cause-effect',
    a: { word: 'bacteria', pos: 'noun' }, b: { word: 'decay', pos: 'noun' },
    tell: 'Bacteria directly cause decay - the immediate biological effect.',
  },
  {
    id: 'va-ce-heat', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'heat', pos: 'noun' }, b: { word: 'melting', pos: 'noun' },
    tell: 'Heat directly causes melting - one step, not a chain of events.',
  },
  {
    id: 'va-ce-impact', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'impact', pos: 'noun' }, b: { word: 'bruise', pos: 'noun' },
    tell: 'An impact directly causes a bruise - the immediate physical mark.',
  },
  {
    id: 'va-ce-earthquake', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'earthquake', pos: 'noun' }, b: { word: 'aftershock', pos: 'noun' },
    tell: 'An earthquake directly produces an aftershock - the immediate follow-on, not a distant one.',
  },
  {
    id: 'va-ce-dust', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'dust', pos: 'noun' }, b: { word: 'sneeze', pos: 'noun' },
    tell: 'Dust directly triggers a sneeze - the immediate physical response.',
  },
  {
    id: 'va-ce-magnet', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'magnet', pos: 'noun' }, b: { word: 'attraction', pos: 'noun' },
    tell: 'A magnet directly produces attraction - one step, not a chain of events.',
  },
  {
    id: 'va-ce-current', chapter: CH, concepts: CAUSE_EFFECT, band: 3, relation: 'cause-effect',
    a: { word: 'current', pos: 'noun' }, b: { word: 'drift', pos: 'noun' },
    tell: 'A current directly produces drift - the immediate physical effect.',
  },

  {
    id: 'va-ao-howl', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'howl', pos: 'verb' }, b: { word: 'wolf', pos: 'noun' },
    tell: 'Howling is the defining sound of a wolf, the same way barking defines a dog.',
  },
  {
    id: 'va-ao-paint', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'paint', pos: 'verb' }, b: { word: 'painter', pos: 'noun' },
    tell: 'Painting is the defining action of a painter - the job itself.',
  },
  {
    id: 'va-ao-buzz', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'buzz', pos: 'verb' }, b: { word: 'bee', pos: 'noun' },
    tell: 'Buzzing is the defining sound of a bee.',
  },
  {
    id: 'va-ao-weld', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'weld', pos: 'verb' }, b: { word: 'welder', pos: 'noun' },
    tell: 'Welding is the defining action of a welder - the job itself.',
  },
  {
    id: 'va-ao-repair', chapter: CH, concepts: ACTION_OBJECT, band: 2, relation: 'action-object',
    a: { word: 'repair', pos: 'verb' }, b: { word: 'mechanic', pos: 'noun' },
    tell: 'Repairing is the defining action of a mechanic.',
  },
  {
    id: 'va-ao-bake', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'bake', pos: 'verb' }, b: { word: 'baker', pos: 'noun' },
    tell: 'Baking is the defining action of a baker, the same way cooking defines a chef.',
  },
  {
    id: 'va-ao-trim', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'trim', pos: 'verb' }, b: { word: 'barber', pos: 'noun' },
    tell: 'Trimming hair is the defining action of a barber.',
  },
  {
    id: 'va-ao-serve', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'serve', pos: 'verb' }, b: { word: 'waiter', pos: 'noun' },
    tell: 'Serving is the defining action of a waiter - the job itself.',
  },
  {
    id: 'va-ao-clean', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'clean', pos: 'verb' }, b: { word: 'janitor', pos: 'noun' },
    tell: 'Cleaning is the defining action of a janitor.',
  },
  {
    id: 'va-ao-rescue', chapter: CH, concepts: ACTION_OBJECT, band: 3, relation: 'action-object',
    a: { word: 'rescue', pos: 'verb' }, b: { word: 'lifeguard', pos: 'noun' },
    tell: 'Rescuing swimmers is the defining action of a lifeguard.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-03-b${band}`, name: 'Cause to effect, and doer to action' });
}
