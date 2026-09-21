// Chapter 4 — Synonym, antonym and degree.
//
// PART 11 of docs/afoqt/HANDOFF.md. REWRITTEN 2026-09-20, TWICE, in the same session:
//
// PASS 1 retired SYNONYM and ANTONYM entirely after Trey caught a generated item offering the
// stem's own two words back as distractors, then objected to the whole premise on the reasoning
// that "recognizing X means the same/opposite as Y" has no structure that transfers to a new pair
// - Word Knowledge wearing an analogy's clothes.
//
// PASS 2 (this one) brought them BACK, after two things surfaced that PASS 1 didn't have yet:
//   1. Trey's own hand-written lesson draft for this chapter (`TreysDontTouch.md`) teaches
//      synonym and antonym explicitly, using only plain words - FAST:QUICK, BEGIN:START,
//      TERSE:BRIEF, HOT:COLD, UP:DOWN, BENEVOLENT:MALEVOLENT.
//   2. Two of the ten OFFICIAL, cleared-for-release OATTS items in `data/realQuestions.json` ARE
//      synonym/antonym: `oatts-VA-076` (NATURAL:ARTIFICIAL::OBSCURE:OBVIOUS, antonym) and
//      `oatts-VA-077` (FLAW:IMPERFECTION::RICH:WEALTHY, synonym) - both using dead-simple words,
//      nothing like the SAT-tier vocabulary (recalcitrant, parsimonious) that caused the original
//      complaint.
// Conclusion: the real defect was never the RELATION TYPE, it was pairing it with hard vocabulary.
// The original band 2/3 synonym rows (happy/glad, fast/quick...) were ALREADY simple and never
// should have been cut with the rest - only bands 4/5's SAT-tier rows were the actual problem.
// Confirmed with Trey directly before restoring them. DEGREE was never in question - it's in the
// commercial-book relation catalogue too (RESEARCH.md's VA SOURCING) and confirmed by
// `oatts-VA-078` (LOUD:DEAFENING::DAMP:SOAKING).
//
// VOCABULARY CEILING (applies to all three relations equally, no exceptions this time): every
// pair below is a plain, everyday word - Trey's own floor, "sponge, mechanic, ink, pencil... "
// and his rejection line, "delirious... shows up, it's too hard." Nothing here needs a
// definition.
//
// BAND: VA has no real difficulty ladder ("most VA questions are just deep thinking questions,
// you can't really make [them] much more difficult without losing the concept" — Trey). Bands 2
// and 3 hold the SAME vocabulary ceiling; band 3 differs only in how close the wrong pairs sit to
// the right one, never in word rarity.
//
// `symmetric: true` on synonym/antonym is not optional polish - without it, the engine's own
// reversed-pair distractor becomes a second correct answer (HAPPY/GLAD and GLAD/HAPPY are
// equally correct).

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-04-meaning-degree';
const SYNONYM = ['va-synonym'];
const ANTONYM = ['va-antonym'];
const DEGREE = ['va-degree'];

registerRelations([
  // ================================ BAND 2 — plain words ========================================
  {
    id: 'va-syn-happy', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'happy', pos: 'adj' }, b: { word: 'glad', pos: 'adj' },
    tell: 'Happy and glad share the same core meaning - neither is a stronger or weaker version of the other.',
  },
  {
    id: 'va-syn-fast', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'fast', pos: 'adj' }, b: { word: 'quick', pos: 'adj' },
    tell: 'Fast and quick mean the same thing - true synonyms, not two different intensities.',
  },
  {
    id: 'va-syn-begin', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'begin', pos: 'verb' }, b: { word: 'start', pos: 'verb' },
    tell: 'Begin and start mean the same thing, interchangeably.',
  },
  {
    id: 'va-syn-small', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'small', pos: 'adj' }, b: { word: 'little', pos: 'adj' },
    tell: 'Small and little mean the same thing - neither one is "more small" than the other.',
  },
  {
    id: 'va-syn-big', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'big', pos: 'adj' }, b: { word: 'large', pos: 'adj' },
    tell: 'Big and large mean the same thing.',
  },
  {
    id: 'va-ant-hot', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'hot', pos: 'adj' }, b: { word: 'cold', pos: 'adj' },
    tell: 'Hot and cold are direct opposites - the natural opposite reads the same in either direction.',
  },
  {
    id: 'va-ant-up', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'up', pos: 'adv' }, b: { word: 'down', pos: 'adv' },
    tell: 'Up and down are direct, natural opposites.',
  },
  {
    id: 'va-ant-fast', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'fast', pos: 'adj' }, b: { word: 'slow', pos: 'adj' },
    tell: 'Fast and slow are direct opposites.',
  },
  {
    id: 'va-ant-light', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'light', pos: 'adj' }, b: { word: 'dark', pos: 'adj' },
    tell: 'Light and dark are direct opposites.',
  },
  {
    id: 'va-ant-full', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'full', pos: 'adj' }, b: { word: 'empty', pos: 'adj' },
    tell: 'Full and empty are direct opposites.',
  },
  // =============================== BAND 2 — blatant contrast ==================================
  {
    id: 'va-deg-warm', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'warm', pos: 'adj' }, b: { word: 'boiling', pos: 'adj' },
    tell: 'Warm is a weaker form of boiling - same dimension (temperature), different intensity.',
  },
  {
    id: 'va-deg-annoyed', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'annoyed', pos: 'adj' }, b: { word: 'angry', pos: 'adj' },
    tell: 'Annoyed is a weaker form of angry - both are the same emotion at different strengths.',
  },
  {
    id: 'va-deg-drizzle', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'drizzle', pos: 'noun' }, b: { word: 'downpour', pos: 'noun' },
    tell: 'A drizzle is a weaker form of a downpour - same dimension (rain), different intensity.',
  },
  {
    id: 'va-deg-trickle', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'trickle', pos: 'noun' }, b: { word: 'flood', pos: 'noun' },
    tell: 'A trickle is a weaker form of a flood - same dimension (water flow), different intensity.',
  },
  {
    id: 'va-deg-concerned', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'concerned', pos: 'adj' }, b: { word: 'alarmed', pos: 'adj' },
    tell: 'Concerned is a weaker form of alarmed - both are worry at different strengths.',
  },
  {
    id: 'va-deg-cold', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'cold', pos: 'adj' }, b: { word: 'freezing', pos: 'adj' },
    tell: 'Cold is a weaker form of freezing - same dimension (temperature), different intensity.',
  },
  {
    id: 'va-deg-tired', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'tired', pos: 'adj' }, b: { word: 'exhausted', pos: 'adj' },
    tell: 'Tired is a weaker form of exhausted - both describe low energy at different strengths.',
  },
  {
    id: 'va-deg-hungry', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'hungry', pos: 'adj' }, b: { word: 'starving', pos: 'adj' },
    tell: 'Hungry is a weaker form of starving - same dimension (need for food), different intensity.',
  },

  // ==================== BAND 3 — same simple words, closer wrong answers ======================
  {
    id: 'va-syn-terse', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'terse', pos: 'adj' }, b: { word: 'brief', pos: 'adj' },
    tell: 'Terse and brief mean the same thing - neither is a stronger version of the other.',
  },
  {
    id: 'va-syn-quiet', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'quiet', pos: 'adj' }, b: { word: 'silent', pos: 'adj' },
    tell: 'Quiet and silent mean the same thing.',
  },
  {
    id: 'va-syn-tidy', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'tidy', pos: 'adj' }, b: { word: 'neat', pos: 'adj' },
    tell: 'Tidy and neat mean the same thing.',
  },
  {
    id: 'va-syn-wet', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'wet', pos: 'adj' }, b: { word: 'damp', pos: 'adj' },
    tell: 'Wet and damp mean the same thing - neither is a stronger version of the other here.',
  },
  {
    id: 'va-syn-easy', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'easy', pos: 'adj' }, b: { word: 'simple', pos: 'adj' },
    tell: 'Easy and simple mean the same thing.',
  },
  {
    id: 'va-ant-benevolent', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'benevolent', pos: 'adj' }, b: { word: 'malevolent', pos: 'adj' },
    tell: 'Benevolent and malevolent are direct opposites - kind-intentioned versus evil-intentioned.',
  },
  {
    id: 'va-ant-sparing', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'sparing', pos: 'adj' }, b: { word: 'lavish', pos: 'adj' },
    tell: 'Sparing and lavish are direct opposites - economical versus extravagant.',
  },
  {
    id: 'va-ant-wet', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'dry', pos: 'adj' }, b: { word: 'soaked', pos: 'adj' },
    tell: 'Dry and soaked are direct opposites.',
  },
  {
    id: 'va-ant-loud', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'loud', pos: 'adj' }, b: { word: 'quiet', pos: 'adj' },
    tell: 'Loud and quiet are direct opposites.',
  },
  {
    id: 'va-ant-day', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'day', pos: 'noun' }, b: { word: 'night', pos: 'noun' },
    tell: 'Day and night are direct opposites.',
  },
  {
    id: 'va-deg-irritated', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'irritated', pos: 'adj' }, b: { word: 'furious', pos: 'adj' },
    tell: 'Irritated and furious are both angry, but furious is the stronger form.',
  },
  {
    id: 'va-deg-peeved', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'peeved', pos: 'adj' }, b: { word: 'fuming', pos: 'adj' },
    tell: 'Peeved is a weaker form of fuming - both are anger at different strengths.',
  },
  {
    id: 'va-deg-tepid', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'tepid', pos: 'adj' }, b: { word: 'scalding', pos: 'adj' },
    tell: 'Tepid is a weaker form of scalding - same dimension (heat), different intensity.',
  },
  {
    id: 'va-deg-argument', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'argument', pos: 'noun' }, b: { word: 'brawl', pos: 'noun' },
    tell: 'An argument is a weaker form of a brawl - same dimension (conflict), different intensity.',
  },
  {
    id: 'va-deg-worried', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'worried', pos: 'adj' }, b: { word: 'terrified', pos: 'adj' },
    tell: 'Worried is a weaker form of terrified - both are fear at different strengths.',
  },
  {
    id: 'va-deg-sad', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'sad', pos: 'adj' }, b: { word: 'devastated', pos: 'adj' },
    tell: 'Sad is a weaker form of devastated - both describe grief at different strengths.',
  },
  {
    id: 'va-deg-miffed', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'miffed', pos: 'adj' }, b: { word: 'irate', pos: 'adj' },
    tell: 'Miffed is a weaker form of irate - both are anger at different strengths.',
  },
  {
    id: 'va-deg-nervous', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'nervous', pos: 'adj' }, b: { word: 'panicked', pos: 'adj' },
    tell: 'Nervous is a weaker form of panicked - both are fear at different strengths.',
  },
]);

// Harvested 2026-09-20 from "AFOQT Verbal Analogies — 50 New Study Bank Questions.md" - see the
// note above ch02-structure.js's equivalent block. A few of the doc's own pairs duplicated rows
// already in this file (EASY:SIMPLE, NEAT:TIDY reversed, FULL:EMPTY) and were skipped rather than
// re-added.
registerRelations([
  {
    id: 'va-deg-whisper', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'whisper', pos: 'noun' }, b: { word: 'shout', pos: 'noun' },
    tell: 'A whisper is a weaker form of a shout - same dimension (loudness), different intensity.',
  },
  {
    id: 'va-deg-nibble', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'nibble', pos: 'verb' }, b: { word: 'devour', pos: 'verb' },
    tell: 'To nibble is a weaker form of devouring - same dimension (eating), different intensity.',
  },
  {
    id: 'va-deg-breeze', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'breeze', pos: 'noun' }, b: { word: 'gale', pos: 'noun' },
    tell: 'A breeze is a weaker form of a gale - same dimension (wind), different intensity.',
  },
  {
    id: 'va-deg-simmer', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'simmer', pos: 'verb' }, b: { word: 'boil', pos: 'verb' },
    tell: 'To simmer is a weaker form of boiling - same dimension (heat), different intensity.',
  },
  {
    id: 'va-deg-drip', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'drip', pos: 'noun' }, b: { word: 'pour', pos: 'noun' },
    tell: 'A drip is a weaker form of a pour - same dimension (water flow), different intensity.',
  },
  {
    id: 'va-deg-trot', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'trot', pos: 'noun' }, b: { word: 'gallop', pos: 'noun' },
    tell: 'A trot is a weaker form of a gallop - same dimension (speed), different intensity.',
  },
  {
    id: 'va-deg-glad', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'glad', pos: 'adj' }, b: { word: 'ecstatic', pos: 'adj' },
    tell: 'Glad is a weaker form of ecstatic - both are happiness at different strengths.',
  },
  {
    id: 'va-deg-pleased', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'pleased', pos: 'adj' }, b: { word: 'thrilled', pos: 'adj' },
    tell: 'Pleased is a weaker form of thrilled - both are happiness at different strengths.',
  },
  {
    id: 'va-deg-tense', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'tense', pos: 'adj' }, b: { word: 'rigid', pos: 'adj' },
    tell: 'Tense is a weaker form of rigid - both describe stiffness at different strengths.',
  },
  {
    id: 'va-deg-cool', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'cool', pos: 'adj' }, b: { word: 'freezing', pos: 'adj' },
    tell: 'Cool is a weaker form of freezing - same dimension (temperature), different intensity.',
  },
  {
    id: 'va-deg-sip', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'sip', pos: 'noun' }, b: { word: 'gulp', pos: 'noun' },
    tell: 'A sip is a weaker form of a gulp - same dimension (drinking), different intensity.',
  },
  {
    id: 'va-deg-walk', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'walk', pos: 'verb' }, b: { word: 'sprint', pos: 'verb' },
    tell: 'To walk is a weaker form of sprinting - same dimension (speed), different intensity.',
  },

  {
    id: 'va-syn-end', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'end', pos: 'verb' }, b: { word: 'finish', pos: 'verb' },
    tell: 'End and finish mean the same thing.',
  },
  {
    id: 'va-syn-help', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'help', pos: 'verb' }, b: { word: 'assist', pos: 'verb' },
    tell: 'Help and assist mean the same thing.',
  },
  {
    id: 'va-syn-brave', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'brave', pos: 'adj' }, b: { word: 'courageous', pos: 'adj' },
    tell: 'Brave and courageous mean the same thing.',
  },

  {
    id: 'va-ant-wetdry', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'wet', pos: 'adj' }, b: { word: 'dry', pos: 'adj' },
    tell: 'Wet and dry are direct opposites.',
  },
  {
    id: 'va-ant-sharp', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'sharp', pos: 'adj' }, b: { word: 'dull', pos: 'adj' },
    tell: 'Sharp and dull are direct opposites.',
  },
  {
    id: 'va-ant-strong', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'strong', pos: 'adj' }, b: { word: 'weak', pos: 'adj' },
    tell: 'Strong and weak are direct opposites.',
  },
  {
    id: 'va-ant-openclosed', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'open', pos: 'adj' }, b: { word: 'closed', pos: 'adj' },
    tell: 'Open and closed are direct opposites.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-04-b${band}`, name: 'Synonym, antonym and degree' });
}
