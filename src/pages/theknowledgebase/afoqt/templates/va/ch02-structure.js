// Chapter 2 — Part to whole, and member to category.
//
// PART 10 of docs/afoqt/HANDOFF.md. REWRITTEN 2026-09-20 — read the "VA IS NOT A VOCABULARY TEST"
// note at the top of ../../engine/analogy.js before touching this file again. Two things changed:
// vocabulary that required prior memorization (stanchion, vestibule, cornice, cochlea, epithelium,
// gavotte, anthracite, cumulonimbus, villanelle, epee - none of them inferable from context, all
// of them exactly the kind of word Trey ruled out) was replaced with plain, everyday words; and
// the old bands 4/5 were folded into bands 2/3 - VA has no real difficulty ladder, so both bands
// now share the SAME vocabulary ceiling and differ only in how obvious the right pairing is.
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
// distractor arithmetic (engine/analogy.js buildMatch): format 2 needs another row sharing the
// base row's `relation` tag at the SAME band, or it returns null. This file keeps an 8-and-8 floor
// at both bands so neither relation ever goes dark.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-02-structure';
const PART_WHOLE = ['va-part-whole'];
const MEMBER_CATEGORY = ['va-member-category'];

registerRelations([
  // ================================ BAND 2 — everyday parts ===================================
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
  },
  {
    id: 'va-pw-rung', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'rung', pos: 'noun' }, b: { word: 'ladder', pos: 'noun' },
    tell: 'A rung is one of the crossbars that makes up a ladder, not the ladder itself.',
  },
  {
    id: 'va-pw-yolk', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'yolk', pos: 'noun' }, b: { word: 'egg', pos: 'noun' },
    tell: 'The yolk is the yellow part inside an egg, not the whole egg.',
  },
  {
    id: 'va-pw-branch', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'branch', pos: 'noun' }, b: { word: 'tree', pos: 'noun' },
    tell: 'A branch grows out of a tree — it is one part, not the whole tree.',
  },
  {
    id: 'va-pw-sleeve', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'sleeve', pos: 'noun' }, b: { word: 'shirt', pos: 'noun' },
    tell: 'A sleeve is the part of a shirt that covers the arm, not the whole shirt.',
  },
  {
    id: 'va-pw-heel', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'heel', pos: 'noun' }, b: { word: 'shoe', pos: 'noun' },
    tell: 'The heel is the back part of a shoe, not the whole shoe.',
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
  {
    id: 'va-mc-sparrow', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'sparrow', pos: 'noun' }, b: { word: 'bird', pos: 'noun' },
    tell: 'A sparrow IS a bird, the same way a robin is.',
  },
  {
    id: 'va-mc-pine', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'pine', pos: 'noun' }, b: { word: 'tree', pos: 'noun' },
    tell: 'A pine IS a tree, the same way an oak is.',
  },
  {
    id: 'va-mc-shark', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'shark', pos: 'noun' }, b: { word: 'fish', pos: 'noun' },
    tell: 'A shark IS a fish, the same way a trout is.',
  },
  {
    id: 'va-mc-beetle', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'beetle', pos: 'noun' }, b: { word: 'insect', pos: 'noun' },
    tell: 'A beetle IS an insect, the same way an ant is.',
  },

  // ==================== BAND 3 — same simple words, less obvious pairing ======================
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
    id: 'va-pw-cartilage', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'cartilage', pos: 'noun' }, b: { word: 'joint', pos: 'noun' },
    tell: 'Cartilage is the cushioning tissue inside a joint, not the joint itself.',
  },
  {
    id: 'va-pw-filament', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'filament', pos: 'noun' }, b: { word: 'lightbulb', pos: 'noun' },
    tell: 'The filament is the thin wire inside a lightbulb that glows - a component, not the bulb itself.',
  },
  {
    id: 'va-pw-blade', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'blade', pos: 'noun' }, b: { word: 'fan', pos: 'noun' },
    tell: 'A blade is one of the spinning parts of a fan, not the whole fan.',
  },
  {
    id: 'va-pw-strap', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'strap', pos: 'noun' }, b: { word: 'watch', pos: 'noun' },
    tell: 'The strap holds a watch to the wrist - a part, not the whole watch.',
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
    id: 'va-mc-trapezoid', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'trapezoid', pos: 'noun' }, b: { word: 'quadrilateral', pos: 'noun' },
    tell: 'A trapezoid IS a quadrilateral — one four-sided shape within that broader class.',
  },
  {
    id: 'va-mc-dirge', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'dirge', pos: 'noun' }, b: { word: 'song', pos: 'noun' },
    tell: 'A dirge IS a song - a specific mournful, funeral kind within that category.',
  },
  {
    id: 'va-mc-daisy', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'daisy', pos: 'noun' }, b: { word: 'flower', pos: 'noun' },
    tell: 'A daisy IS a flower — a specific kind within that category.',
  },
  {
    id: 'va-mc-novel', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'novel', pos: 'noun' }, b: { word: 'book', pos: 'noun' },
    tell: 'A novel IS a book — a specific long-fiction kind within that category.',
  },
  {
    id: 'va-mc-chess', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'chess', pos: 'noun' }, b: { word: 'game', pos: 'noun' },
    tell: 'Chess IS a game — a specific board game within that category.',
  },
]);

// Harvested 2026-09-20 from "AFOQT Verbal Analogies — 50 New Study Bank Questions.md" (Trey
// supplied it, asked to "add this to our bank"). That doc hand-wrote 50 full questions, but a
// lot of its own distractors reverse the BASE PAIR'S OWN two words (WHEEL is to SPOKE as a wrong
// answer to SPOKE is to WHEEL) - the exact pattern Trey rejected earlier this session ("that's
// lazy shortcutting to make a 5th answer"), which is why buildMatch never does that. Rather than
// import 50 fixed question objects and carry the bug forward, only the underlying WORD PAIRS were
// pulled out - our own engine generates non-reversed-base-pair distractors from them automatically.
registerRelations([
  {
    id: 'va-pw-spoke', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'spoke', pos: 'noun' }, b: { word: 'wheel', pos: 'noun' },
    tell: 'A spoke is one of the rods connecting a wheel\'s hub to its rim, not the wheel itself.',
  },
  {
    id: 'va-pw-page', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'page', pos: 'noun' }, b: { word: 'book', pos: 'noun' },
    tell: 'A page is one leaf of a book, not the whole book.',
  },
  {
    id: 'va-pw-brick', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'brick', pos: 'noun' }, b: { word: 'wall', pos: 'noun' },
    tell: 'A brick is one unit making up a wall, not the whole wall.',
  },
  {
    id: 'va-pw-lens', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'lens', pos: 'noun' }, b: { word: 'camera', pos: 'noun' },
    tell: 'The lens is the part of a camera that focuses light, not the whole camera.',
  },
  {
    id: 'va-pw-sail', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'sail', pos: 'noun' }, b: { word: 'boat', pos: 'noun' },
    tell: 'A sail is a part of a boat that catches wind, not the whole boat.',
  },
  {
    id: 'va-pw-handle', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'handle', pos: 'noun' }, b: { word: 'door', pos: 'noun' },
    tell: 'A handle is the part of a door you grip, not the whole door.',
  },
  {
    id: 'va-pw-leg', chapter: CH, concepts: PART_WHOLE, band: 2, relation: 'part-whole',
    a: { word: 'leg', pos: 'noun' }, b: { word: 'chair', pos: 'noun' },
    tell: 'A leg is one of the supports holding up a chair, not the whole chair.',
  },
  {
    id: 'va-pw-key', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'key', pos: 'noun' }, b: { word: 'keyboard', pos: 'noun' },
    tell: 'A key is one button on a keyboard, not the whole keyboard.',
  },
  {
    id: 'va-pw-beam', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'beam', pos: 'noun' }, b: { word: 'ceiling', pos: 'noun' },
    tell: 'A beam is a structural support inside a ceiling, not the whole ceiling.',
  },
  {
    id: 'va-pw-roof', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'roof', pos: 'noun' }, b: { word: 'house', pos: 'noun' },
    tell: 'A roof covers the top of a house, not the whole house.',
  },
  {
    id: 'va-pw-string', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'string', pos: 'noun' }, b: { word: 'guitar', pos: 'noun' },
    tell: 'A string is one part of a guitar that vibrates to make sound, not the whole guitar.',
  },
  {
    id: 'va-pw-wire', chapter: CH, concepts: PART_WHOLE, band: 3, relation: 'part-whole',
    a: { word: 'wire', pos: 'noun' }, b: { word: 'fence', pos: 'noun' },
    tell: 'A wire is one strand making up a fence, not the whole fence.',
  },

  {
    id: 'va-mc-owl', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'owl', pos: 'noun' }, b: { word: 'bird', pos: 'noun' },
    tell: 'An owl IS a bird, the same way a robin is.',
  },
  {
    id: 'va-mc-hammer', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'hammer', pos: 'noun' }, b: { word: 'tool', pos: 'noun' },
    tell: 'A hammer IS a tool — one member of that category.',
  },
  {
    id: 'va-mc-triangle', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'triangle', pos: 'noun' }, b: { word: 'polygon', pos: 'noun' },
    tell: 'A triangle IS a polygon — a specific three-sided shape within that category.',
  },
  {
    id: 'va-mc-walnut', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'walnut', pos: 'noun' }, b: { word: 'nut', pos: 'noun' },
    tell: 'A walnut IS a nut, one kind within that category.',
  },
  {
    id: 'va-mc-lily', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'lily', pos: 'noun' }, b: { word: 'flower', pos: 'noun' },
    tell: 'A lily IS a flower, the same way a daisy is.',
  },
  {
    id: 'va-mc-bass', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'bass', pos: 'noun' }, b: { word: 'fish', pos: 'noun' },
    tell: 'A bass IS a fish, the same way a trout is.',
  },
  {
    id: 'va-mc-apple', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'apple', pos: 'noun' }, b: { word: 'fruit', pos: 'noun' },
    tell: 'An apple IS a fruit, one member of that category.',
  },
  {
    id: 'va-mc-sofa', chapter: CH, concepts: MEMBER_CATEGORY, band: 2, relation: 'member-category',
    a: { word: 'sofa', pos: 'noun' }, b: { word: 'furniture', pos: 'noun' },
    tell: 'A sofa IS furniture, one member of that category.',
  },
  {
    id: 'va-mc-cedar', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'cedar', pos: 'noun' }, b: { word: 'tree', pos: 'noun' },
    tell: 'A cedar IS a tree, the same way an oak is.',
  },
  {
    id: 'va-mc-rectangle', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'rectangle', pos: 'noun' }, b: { word: 'quadrilateral', pos: 'noun' },
    tell: 'A rectangle IS a quadrilateral, the same way a trapezoid is.',
  },
  {
    id: 'va-mc-soccer', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'soccer', pos: 'noun' }, b: { word: 'sport', pos: 'noun' },
    tell: 'Soccer IS a sport, one member of that category.',
  },
  {
    id: 'va-mc-wrench', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'wrench', pos: 'noun' }, b: { word: 'tool', pos: 'noun' },
    tell: 'A wrench IS a tool, the same way a hammer is.',
  },
  {
    id: 'va-mc-sedan', chapter: CH, concepts: MEMBER_CATEGORY, band: 3, relation: 'member-category',
    a: { word: 'sedan', pos: 'noun' }, b: { word: 'car', pos: 'noun' },
    tell: 'A sedan IS a car, one specific body style within that category.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-02-b${band}`, name: 'Part to whole, member to category' });
}

// ============================================================================================
// PART 10B — part-part + sequence rows. Already at bands 2-3 only; vocabulary was already plain
// and needed no changes in this rewrite.
//
// PART/PART: a and b are co-equal parts of the SAME whole; neither contains the other. The
// swap test: could you exchange a and b and still have a valid pair? Yes — that is co-equal,
// which is why every row below sets `symmetric: true`.
//
// SEQUENCE: a precedes b in a fixed, ordered process; the order is inherent, not incidental.
// `symmetric` is left at its default (false) here - swapping breaks the relation on every row.

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

  // ------------------------------- BAND 2, sequence (4) ---------------------------------------
  // Split the same way as band 3's sequence rows (see that block's note) - MATURATION (a living
  // thing becomes its own mature form) versus CREATION_SEQUENCE (a raw material becomes a
  // finished, separate object). Kept as two clean pairs each rather than three-in-one, so
  // neither subgroup is ever left with zero same-relation partners.
  {
    id: 'va-mt-caterpillar', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'maturation',
    a: { word: 'caterpillar', pos: 'noun' }, b: { word: 'butterfly', pos: 'noun' },
    tell: 'A caterpillar becomes a butterfly - the order is fixed by the process itself, not by convention.',
  },
  {
    id: 'va-mt-egg', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'maturation',
    a: { word: 'egg', pos: 'noun' }, b: { word: 'chick', pos: 'noun' },
    tell: 'An egg hatches into a chick - the egg always comes first in that process.',
    confusions: ['va-mc-robin'],
  },
  {
    id: 'va-cs-clay', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'creation-sequence',
    a: { word: 'clay', pos: 'noun' }, b: { word: 'pot', pos: 'noun' },
    tell: 'Clay is shaped and fired into a pot - a raw material becomes a separate, finished object.',
  },
  {
    id: 'va-cs-dough', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'creation-sequence',
    a: { word: 'dough', pos: 'noun' }, b: { word: 'bread', pos: 'noun' },
    tell: 'Dough is baked into bread - the dough exists first, before the process finishes it.',
  },

  // ------------------------------- BAND 3, part-part (3) --------------------------------------
  {
    id: 'va-pp-liver', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'liver', pos: 'noun' }, b: { word: 'kidney', pos: 'noun' },
    tell: 'The liver and a kidney are co-equal organs of the same body - siblings, not nested.',
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

  // ------------------------------- BAND 3, sequence (4) ---------------------------------------
  {
    id: 'va-mt-recruit', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'maturation',
    a: { word: 'recruit', pos: 'noun' }, b: { word: 'veteran', pos: 'noun' },
    tell: 'A recruit becomes a veteran only after time and experience - the order is fixed by the process.',
    confusions: ['va-pw-platoon'],
  },
  {
    id: 'va-mt-novice', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'maturation',
    a: { word: 'novice', pos: 'noun' }, b: { word: 'expert', pos: 'noun' },
    tell: 'A novice becomes an expert only after time and practice, the same way a recruit becomes a veteran.',
  },
  {
    id: 'va-cs-blueprint', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'creation-sequence',
    a: { word: 'blueprint', pos: 'noun' }, b: { word: 'building', pos: 'noun' },
    tell: 'A blueprint is drawn before the building it describes is ever built - the order cannot reverse.',
  },
  {
    id: 'va-cs-sketch', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'creation-sequence',
    a: { word: 'sketch', pos: 'noun' }, b: { word: 'painting', pos: 'noun' },
    tell: 'A sketch comes before the finished painting it leads to - the process runs one direction.',
  },
]);

// Harvested 2026-09-20 from the same 50-question study bank doc (see the note above the
// part-whole/member-category registerRelations block).
registerRelations([
  {
    id: 'va-pp-artery', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'artery', pos: 'noun' }, b: { word: 'vein', pos: 'noun' },
    tell: 'An artery and a vein are co-equal parts of the circulatory system - siblings, not nested.',
  },
  {
    id: 'va-pp-salt', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'salt', pos: 'noun' }, b: { word: 'pepper', pos: 'noun' },
    tell: 'Salt and pepper are co-equal seasonings of the same shaker set.',
  },
  {
    id: 'va-pp-plate', chapter: CH, concepts: PART_PART, band: 2, relation: 'part-part', symmetric: true,
    a: { word: 'plate', pos: 'noun' }, b: { word: 'bowl', pos: 'noun' },
    tell: 'A plate and a bowl are co-equal dishes of the same place setting.',
  },
  {
    id: 'va-pp-pitcher', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'pitcher', pos: 'noun' }, b: { word: 'catcher', pos: 'noun' },
    tell: 'A pitcher and a catcher are co-equal positions on the same baseball team.',
  },
  {
    id: 'va-pp-quarter', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'quarter', pos: 'noun' }, b: { word: 'nickel', pos: 'noun' },
    tell: 'A quarter and a nickel are co-equal coins of the same currency.',
  },
  {
    id: 'va-pp-hammer', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'hammer', pos: 'noun' }, b: { word: 'saw', pos: 'noun' },
    tell: 'A hammer and a saw are co-equal tools in the same toolbox.',
  },
  {
    id: 'va-pp-door', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'door', pos: 'noun' }, b: { word: 'window', pos: 'noun' },
    tell: 'A door and a window are co-equal parts of the same house.',
  },
  {
    id: 'va-pp-knife', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'knife', pos: 'noun' }, b: { word: 'fork', pos: 'noun' },
    tell: 'A knife and a fork are co-equal parts of the same place setting.',
  },
  {
    id: 'va-pp-brush', chapter: CH, concepts: PART_PART, band: 3, relation: 'part-part', symmetric: true,
    a: { word: 'brush', pos: 'noun' }, b: { word: 'comb', pos: 'noun' },
    tell: 'A brush and a comb are co-equal tools in the same grooming kit.',
  },

  {
    id: 'va-mt-tadpole', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'maturation',
    a: { word: 'tadpole', pos: 'noun' }, b: { word: 'frog', pos: 'noun' },
    tell: 'A tadpole becomes a frog - the order is fixed by the growth process itself.',
  },
  {
    id: 'va-mt-cocoon', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'maturation',
    a: { word: 'cocoon', pos: 'noun' }, b: { word: 'moth', pos: 'noun' },
    tell: 'A cocoon precedes the moth that emerges from it, the same way a caterpillar precedes a butterfly.',
  },
  {
    id: 'va-cs-mold', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'creation-sequence',
    a: { word: 'mold', pos: 'noun' }, b: { word: 'statue', pos: 'noun' },
    tell: 'A mold is used to cast a statue - a shaping tool comes before the finished, separate object.',
  },
  {
    id: 'va-cs-batter', chapter: CH, concepts: SEQUENCE, band: 2, relation: 'creation-sequence',
    a: { word: 'batter', pos: 'noun' }, b: { word: 'cake', pos: 'noun' },
    tell: 'Batter is baked into a cake - the batter exists first, before the process finishes it.',
  },
  {
    id: 'va-mt-seedling', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'maturation',
    a: { word: 'seedling', pos: 'noun' }, b: { word: 'sapling', pos: 'noun' },
    tell: 'A seedling becomes a sapling - the order is fixed by the growth process.',
  },
  {
    id: 'va-mt-acorn', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'maturation',
    a: { word: 'acorn', pos: 'noun' }, b: { word: 'oak', pos: 'noun' },
    tell: 'An acorn grows into an oak, the same way a seedling grows into a sapling.',
  },
  {
    id: 'va-mt-nymph', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'maturation',
    a: { word: 'nymph', pos: 'noun' }, b: { word: 'dragonfly', pos: 'noun' },
    tell: 'A nymph becomes a dragonfly, the same way a tadpole becomes a frog.',
  },
  {
    id: 'va-cs-rehearsal', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'creation-sequence',
    a: { word: 'rehearsal', pos: 'noun' }, b: { word: 'performance', pos: 'noun' },
    tell: 'A rehearsal comes before the performance it prepares for - the order cannot reverse.',
  },
  {
    id: 'va-cs-practice', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'creation-sequence',
    a: { word: 'practice', pos: 'noun' }, b: { word: 'game', pos: 'noun' },
    tell: 'Practice comes before the game it prepares for, the same way a rehearsal precedes a performance.',
  },
  {
    id: 'va-cs-audition', chapter: CH, concepts: SEQUENCE, band: 3, relation: 'creation-sequence',
    a: { word: 'audition', pos: 'noun' }, b: { word: 'role', pos: 'noun' },
    tell: 'An audition comes before landing the role it leads to - the order cannot reverse.',
  },
]);

for (const band of [2, 3]) {
  relationTemplates({ chapter: CH, band, idBase: `va-02b-b${band}`, name: 'Part to part, and sequence' });
}
