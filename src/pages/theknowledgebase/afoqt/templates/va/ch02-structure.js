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
