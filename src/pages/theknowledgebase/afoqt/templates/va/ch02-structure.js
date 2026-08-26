// Chapter 2 — Part to whole, and member to category.
//
// PART 10 of docs/afoqt/HANDOFF.md. This is the single biggest cluster of real items (~3 in 10
// of the 75-item sourced sample) — but only its first two relations. Part/Part and Sequence are
// PART 10B's rows, appended to this same file once these 24 have landed.
//
// THE TEST THAT SEPARATES THE TWO RELATIONS HERE: try "a IS A b."
//   - FINGER is a HAND?  False — a finger is a PART of a hand. That is part-whole.
//   - ROBIN is a BIRD?   True — a robin genuinely is a bird, one member of that category.
// Every row below was written against that test, not against vibes. Where it is close (PLATOON
// is not literally "an army", but it is a substructure of one, same as PISTON is a substructure
// of ENGINE — not "an engine"), the row stays in part-whole.
//
// LEVEL MATTERS on both sides:
//   - part-whole: the whole must be the SPECIFIC thing the part belongs to. A finger belongs to
//     a hand, not to "a person" — too far up. Never let the whole be a level too broad.
//   - member-category: the category must be the IMMEDIATE one. A robin is a bird, not "an
//     animal" — too broad. Never let the category be a level too broad either.
//
// distractor arithmetic (engine/analogy.js buildMatch/buildFourthTerm): format 2 needs another
// row sharing the base row's `relation` tag at the SAME band, or it returns null. This file keeps
// a 4-and-4 floor at every band so neither relation ever goes dark.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-02-structure';
const PART_WHOLE = ['va-part-whole'];
const MEMBER_CATEGORY = ['va-member-category'];

registerRelations([
  // ============================ BAND 2 — everyday, on-sight words ============================
  {
    id: 'va-pw-finger', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'finger', pos: 'noun' }, b: { word: 'hand', pos: 'noun' },
    tell: 'A finger is not a hand — it is one part attached to a hand.',
  },
  {
    id: 'va-pw-wheel', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'wheel', pos: 'noun' }, b: { word: 'car', pos: 'noun' },
    tell: 'A wheel is a component bolted onto a car, not a car itself.',
  },
  {
    id: 'va-pw-petal', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'petal', pos: 'noun' }, b: { word: 'flower', pos: 'noun' },
    tell: 'A petal is one piece of a flower, the way a page is one piece of a book.',
    confusions: ['va-mc-oak'],
  },
  {
    id: 'va-pw-rung', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'rung', pos: 'noun' }, b: { word: 'ladder', pos: 'noun' },
    tell: 'A rung is one of the crossbars that makes up a ladder, not the ladder itself.',
  },
  {
    id: 'va-mc-trout', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'trout', pos: 'noun' }, b: { word: 'fish', pos: 'noun' },
    tell: 'A trout genuinely IS a fish — one member of that whole category.',
  },
  {
    id: 'va-mc-oak', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'oak', pos: 'noun' }, b: { word: 'tree', pos: 'noun' },
    tell: 'An oak IS a tree — a specific kind, not a piece of one.',
  },
  {
    id: 'va-mc-robin', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'robin', pos: 'noun' }, b: { word: 'bird', pos: 'noun' },
    tell: 'A robin IS a bird — the category is right at the correct level, not "animal."',
  },
  {
    id: 'va-mc-ant', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'ant', pos: 'noun' }, b: { word: 'insect', pos: 'noun' },
    tell: 'An ant IS an insect — one member of that class.',
  },

  // ======================= BAND 3 — standard test-prep vocabulary ============================
  {
    id: 'va-pw-piston', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'piston', pos: 'noun' }, b: { word: 'engine', pos: 'noun' },
    tell: 'A piston is a moving part inside an engine, not an engine on its own.',
  },
  {
    id: 'va-pw-fuselage', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'fuselage', pos: 'noun' }, b: { word: 'aircraft', pos: 'noun' },
    tell: 'The fuselage is the aircraft\'s main body section — a structural part, not the whole craft.',
  },
  {
    id: 'va-pw-platoon', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'platoon', pos: 'noun' }, b: { word: 'army', pos: 'noun' },
    tell: 'A platoon is a substructure inside an army\'s chain of command, not "an army" itself.',
  },
  {
    id: 'va-pw-keel', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'keel', pos: 'noun' }, b: { word: 'ship', pos: 'noun' },
    tell: 'The keel is the structural spine running along the bottom of a ship\'s hull, not the ship itself.',
  },
  {
    id: 'va-mc-sonnet', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'sonnet', pos: 'noun' }, b: { word: 'poem', pos: 'noun' },
    tell: 'A sonnet IS a poem — a specific 14-line form of the wider category.',
  },
  {
    id: 'va-mc-maple', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'maple', pos: 'noun' }, b: { word: 'hardwood', pos: 'noun' },
    tell: 'Maple IS a hardwood — one kind within that broader class of wood.',
  },
  {
    id: 'va-mc-peninsula', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'peninsula', pos: 'noun' }, b: { word: 'landform', pos: 'noun' },
    tell: 'A peninsula IS a landform — a specific shape within that geographic category.',
  },
  {
    id: 'va-mc-epithelium', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'epithelium', pos: 'noun' }, b: { word: 'tissue', pos: 'noun' },
    tell: 'Epithelium IS a tissue type — one member of the category, not a piece cut from it.',
  },

  // ========================= BAND 4 — low-frequency, inference-level ==========================
  {
    id: 'va-pw-cartilage', chapter: CH, concepts: PART_WHOLE, band: 4, relation: 'part-whole',
    a: { word: 'cartilage', pos: 'noun' }, b: { word: 'joint', pos: 'noun' },
    tell: 'Cartilage is the cushioning tissue inside a joint, not the joint itself.',
  },
  {
    id: 'va-pw-stanchion', chapter: CH, concepts: PART_WHOLE, band: 4, relation: 'part-whole',
    a: { word: 'stanchion', pos: 'noun' }, b: { word: 'railing', pos: 'noun' },
    tell: 'A stanchion is the upright post that holds a railing up — a component, not the railing.',
  },
  {
    id: 'va-pw-vestibule', chapter: CH, concepts: PART_WHOLE, band: 4, relation: 'part-whole',
    a: { word: 'vestibule', pos: 'noun' }, b: { word: 'ear', pos: 'noun' },
    tell: 'The vestibule is the balance-sensing chamber inside the inner ear, not the ear as a whole.',
  },
  {
    id: 'va-pw-cornice', chapter: CH, concepts: PART_WHOLE, band: 4, relation: 'part-whole',
    a: { word: 'cornice', pos: 'noun' }, b: { word: 'facade', pos: 'noun' },
    tell: 'A cornice is the projecting molding along the top of a facade — one architectural part of it.',
  },
  {
    id: 'va-mc-gavotte', chapter: CH, concepts: MEMBER_CATEGORY, band: 4, relation: 'member-category',
    a: { word: 'gavotte', pos: 'noun' }, b: { word: 'dance', pos: 'noun' },
    tell: 'A gavotte IS a dance — a specific French court dance within that category.',
  },
  {
    id: 'va-mc-anthracite', chapter: CH, concepts: MEMBER_CATEGORY, band: 4, relation: 'member-category',
    a: { word: 'anthracite', pos: 'noun' }, b: { word: 'coal', pos: 'noun' },
    tell: 'Anthracite IS coal — the hardest, highest-carbon grade within that category.',
  },
  {
    id: 'va-mc-trapezoid', chapter: CH, concepts: MEMBER_CATEGORY, band: 4, relation: 'member-category',
    a: { word: 'trapezoid', pos: 'noun' }, b: { word: 'quadrilateral', pos: 'noun' },
    tell: 'A trapezoid IS a quadrilateral — one four-sided shape within that broader class.',
  },
  {
    id: 'va-mc-cumulonimbus', chapter: CH, concepts: MEMBER_CATEGORY, band: 4, relation: 'member-category',
    a: { word: 'cumulonimbus', pos: 'noun' }, b: { word: 'cloud', pos: 'noun' },
    tell: 'A cumulonimbus IS a cloud — the specific storm-producing kind within that category.',
  },
]);

for (const band of [2, 3, 4]) {
  relationTemplates({ chapter: CH, band, idBase: `va-02-b${band}`, name: 'Part to whole, member to category' });
}

// ============================================================================================
// PART 10B — part-part + sequence rows, appended 2026-08-26. Do not alter any row above this
// point; those are PART 10's.
//
// PART/PART: a and b are co-equal parts of the SAME whole; neither contains the other. The
// swap test: could you exchange a and b and still have a valid pair? Yes — that is co-equal,
// which is why every row below sets `symmetric: true`. (The engine JSDoc on RelationRow says
// symmetric is "true only for synonym/antonym" - that described the bank as it stood when PART 9
// was built, before any order-independent relation besides those two existed. Leaving these rows
// at the default `false` would let the engine's own reversed-pair distractor - "the exact same
// two words, wrong order" - stand as a SECOND correct answer, since reversing a genuinely
// co-equal pair changes nothing about the relation. `afoqt:selftest` cannot catch this: reversed
// text is a structurally distinct string, so a slate with two correct answers still reports
// "5 distinct choices" and passes. Read PART 11's own warning about this exact defect class
// before touching this file again.)
//
// SEQUENCE: a precedes b in a fixed, ordered process; the order is inherent, not incidental.
// `symmetric` is left at its default (false) here - swapping breaks the relation on every row.
//
// Only 3 rows per relation at bands 2 and 3 (the real sourced sample shows no band-4 example of
// either), so nothing is registered at band 4 - a template needs 5+ rows or the engine returns
// nothing, and padding to hit 5 would mean inventing a low-confidence "hard" example neither
// real item supports. Combined (part-part + sequence), each of bands 2/3 reaches 6 rows against
// the WHOLE chapter's now-14-row pool per band, past the 5-row floor - see the new
// relationTemplates() calls below, registered under a NEW idBase so they do not collide with
// PART 10's `va-02-b{band}-pair/term` ids (calling relationTemplates again under the SAME idBase
// for a band PART 10 already built would throw a duplicate-template-id error).

const PART_PART = ['va-part-part'];
const SEQUENCE = ['va-sequence'];

registerRelations([
  // ------------------------------- BAND 2, part-part (3) -------------------------------------
  {
    id: 'va-pp-arm', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'arm', pos: 'noun' }, b: { word: 'leg', pos: 'noun' },
    tell: 'An arm and a leg are co-equal limbs of the same body - neither one contains the other.',
    confusions: ['va-pw-finger'],
  },
  {
    id: 'va-pp-mercury', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'mercury', pos: 'noun' }, b: { word: 'venus', pos: 'noun' },
    tell: 'Mercury and Venus are co-equal planets of the same solar system - siblings, not one containing the other.',
  },
  {
    id: 'va-pp-trumpet', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'trumpet', pos: 'noun' }, b: { word: 'drum', pos: 'noun' },
    tell: 'A trumpet and a drum are co-equal instruments in the same band - two parts of one ensemble.',
  },

  // ------------------------------- BAND 2, sequence (3) ---------------------------------------
  {
    id: 'va-sq-caterpillar', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'sequence',
    a: { word: 'caterpillar', pos: 'noun' }, b: { word: 'butterfly', pos: 'noun' },
    tell: 'A caterpillar becomes a butterfly - the order is fixed by the process itself, not by convention.',
  },
  {
    id: 'va-sq-egg', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'sequence',
    a: { word: 'egg', pos: 'noun' }, b: { word: 'chick', pos: 'noun' },
    tell: 'An egg hatches into a chick - the egg always comes first in that process.',
    confusions: ['va-mc-robin'],
  },
  {
    id: 'va-sq-dough', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'sequence',
    a: { word: 'dough', pos: 'noun' }, b: { word: 'bread', pos: 'noun' },
    tell: 'Dough is baked into bread - the dough exists first, before the process finishes it.',
  },

  // ------------------------------- BAND 3, part-part (3) --------------------------------------
  {
    id: 'va-pp-liver', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'liver', pos: 'noun' }, b: { word: 'kidney', pos: 'noun' },
    tell: 'The liver and a kidney are co-equal organs of the same body - siblings, not nested.',
    confusions: ['va-mc-epithelium'],
  },
  {
    id: 'va-pp-infantry', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'infantry', pos: 'noun' }, b: { word: 'cavalry', pos: 'noun' },
    tell: 'Infantry and cavalry are co-equal combat arms of the same army - two parts of one force, not one inside the other.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-pp-starboard', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'starboard', pos: 'noun' }, b: { word: 'port', pos: 'noun' },
    tell: 'Starboard and port are the two co-equal sides of the same ship.',
    confusions: ['va-pw-keel'],
  },

  // ------------------------------- BAND 3, sequence (3) ---------------------------------------
  {
    id: 'va-sq-blueprint', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'sequence',
    a: { word: 'blueprint', pos: 'noun' }, b: { word: 'building', pos: 'noun' },
    tell: 'A blueprint is drawn before the building it describes is ever built - the order cannot reverse.',
  },
  {
    id: 'va-sq-recruit', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'sequence',
    a: { word: 'recruit', pos: 'noun' }, b: { word: 'veteran', pos: 'noun' },
    tell: 'A recruit becomes a veteran only after time and experience - the order is fixed by the process.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-sq-sketch', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'sequence',
    a: { word: 'sketch', pos: 'noun' }, b: { word: 'painting', pos: 'noun' },
    tell: 'A sketch comes before the finished painting it leads to - the process runs one direction.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-02b-b${band}`, name: 'Part to part, and sequence' });
}
