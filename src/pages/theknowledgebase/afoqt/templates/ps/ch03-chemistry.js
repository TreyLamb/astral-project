// Chapter 3 - States of matter, the periodic table, change, and acids and bases.
//
// PART 20B of docs/afoqt/HANDOFF.md. Grounded in the real OATTS bank: oatts-PS-051 (states of
// matter), oatts-PS-052 (periodic table organized by atomic number), oatts-PS-053 (burning wood
// is a chemical change). Same fact-row rules as PART 20 - never author the identify stem, gloss
// never shouts, confusions stay in-chapter, sample and read the output before calling this done.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-03-chemistry';
const STATES = ['ps-states-of-matter'];
const ORGANIZATION = ['ps-periodic-table-organization'];
const CHANGE = ['ps-physical-chemical-change'];
const ACIDS_BASES = ['ps-acids-and-bases'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-solid', chapter: CH, concepts: STATES, band: 2,
    term: 'a solid', gloss: 'has both a definite shape and a definite volume, since its particles are tightly packed and only vibrate in place',
    recallStem: 'What state of matter has both a definite shape and a definite volume?',
    confusions: ['ps-liquid', 'ps-gas'],
    source: 'OATTS',
  },
  {
    id: 'ps-liquid', chapter: CH, concepts: STATES, band: 2,
    term: 'a liquid', gloss: 'has a definite volume but takes the shape of its container',
    recallStem: 'What state of matter has a definite volume but takes the shape of its container?',
    confusions: ['ps-solid', 'ps-gas'],
  },
  {
    id: 'ps-gas', chapter: CH, concepts: STATES, band: 2,
    term: 'a gas', gloss: 'has neither a definite shape nor a definite volume, expanding to fill its container',
    recallStem: 'What state of matter has neither a definite shape nor a definite volume?',
    confusions: ['ps-solid', 'ps-liquid'],
  },
  {
    id: 'ps-chemical-symbol', chapter: CH, concepts: ORGANIZATION, band: 2,
    term: 'a chemical symbol', gloss: 'is the one- or two-letter abbreviation the periodic table uses to represent an element',
    recallStem: 'What is the one- or two-letter abbreviation for an element on the periodic table called?',
    confusions: ['ps-periodic-arrangement'],
  },
  {
    id: 'ps-periodic-arrangement', chapter: CH, concepts: ORGANIZATION, band: 2,
    term: "the periodic table's arrangement", gloss: 'organizes elements in order of increasing atomic number',
    recallStem: 'What organizing principle puts the elements in a predictable left-to-right order?',
    confusions: ['ps-chemical-symbol', 'ps-metal-nonmetal'],
    source: 'OATTS',
  },
  {
    id: 'ps-metal-nonmetal', chapter: CH, concepts: ORGANIZATION, band: 2,
    term: 'metals, nonmetals, and metalloids', gloss: 'are the three broad classes elements are sorted into, based chiefly on how well they conduct heat and electricity',
    recallStem: 'What three broad classes are elements sorted into, based on how well they conduct heat and electricity?',
    confusions: ['ps-periodic-arrangement'],
  },
  {
    id: 'ps-physical-change', chapter: CH, concepts: CHANGE, band: 2,
    term: 'a physical change', gloss: "alters a substance's form or appearance without producing any new kind of matter",
    recallStem: "What kind of change alters a substance's form without producing any new kind of matter?",
    confusions: ['ps-chemical-change'],
  },
  {
    id: 'ps-chemical-change', chapter: CH, concepts: CHANGE, band: 2,
    term: 'a chemical change', gloss: 'always produces one or more new kinds of matter, different from what was present before',
    recallStem: 'What kind of change always produces one or more new kinds of matter?',
    confusions: ['ps-physical-change', 'ps-chemical-reaction'],
    source: 'OATTS',
  },
  {
    id: 'ps-chemical-reaction', chapter: CH, concepts: CHANGE, band: 2,
    term: 'a chemical reaction', gloss: 'is the process in which one or more substances are transformed into new substances',
    recallStem: 'What is the process called in which substances are transformed into new substances?',
    confusions: ['ps-chemical-change', 'ps-physical-change'],
  },
  {
    id: 'ps-acid', chapter: CH, concepts: ACIDS_BASES, band: 2,
    term: 'an acid', gloss: 'is a substance that releases hydrogen ions in water and turns blue litmus paper red',
    recallStem: 'What kind of substance releases hydrogen ions in water and turns blue litmus paper red?',
    confusions: ['ps-base'],
  },
  {
    id: 'ps-base', chapter: CH, concepts: ACIDS_BASES, band: 2,
    term: 'a base', gloss: 'is a substance that releases hydroxide ions in water and turns red litmus paper blue',
    recallStem: 'What kind of substance releases hydroxide ions in water and turns red litmus paper blue?',
    confusions: ['ps-acid'],
  },
  {
    id: 'ps-ph-scale', chapter: CH, concepts: ACIDS_BASES, band: 2,
    term: 'the pH scale', gloss: 'measures how acidic or basic a solution is, running from 0 to 14 with 7 as neutral',
    recallStem: 'What scale measures how acidic or basic a solution is, running from 0 to 14?',
    confusions: ['ps-acid', 'ps-base'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-plasma', chapter: CH, concepts: STATES, band: 3,
    term: 'plasma', gloss: 'is an ionized gas-like state of matter whose particles carry an electric charge, found in stars and lightning',
    recallStem: 'What ionized, gas-like state of matter is found in stars and lightning?',
    confusions: ['ps-melting-point', 'ps-boiling-point'],
  },
  {
    id: 'ps-melting-point', chapter: CH, concepts: STATES, band: 3,
    term: 'the melting point', gloss: 'is the temperature at which a substance changes from a solid to a liquid',
    recallStem: 'What is the temperature called at which a substance changes from a solid to a liquid?',
    confusions: ['ps-boiling-point', 'ps-plasma'],
  },
  {
    id: 'ps-boiling-point', chapter: CH, concepts: STATES, band: 3,
    term: 'the boiling point', gloss: 'is the temperature at which a substance changes from a liquid to a gas',
    recallStem: 'What is the temperature called at which a substance changes from a liquid to a gas?',
    confusions: ['ps-melting-point', 'ps-plasma'],
  },
  {
    id: 'ps-representative-elements', chapter: CH, concepts: ORGANIZATION, band: 3,
    term: 'the representative elements', gloss: 'are the main-group elements found in groups 1, 2, and 13 through 18 of the periodic table',
    recallStem: 'What are the main-group elements of the periodic table called?',
    confusions: ['ps-transition-metals'],
  },
  {
    id: 'ps-transition-metals', chapter: CH, concepts: ORGANIZATION, band: 3,
    term: 'the transition metals', gloss: 'are the metallic elements found in groups 3 through 12 of the periodic table',
    recallStem: 'What are the metallic elements in groups 3 through 12 of the periodic table called?',
    confusions: ['ps-representative-elements', 'ps-lanthanides-actinides'],
  },
  {
    id: 'ps-lanthanides-actinides', chapter: CH, concepts: ORGANIZATION, band: 3,
    term: 'the lanthanides and actinides', gloss: 'are the two rows of elements normally set apart at the bottom of the periodic table',
    recallStem: 'What are the two rows of elements normally set apart at the bottom of the periodic table called?',
    confusions: ['ps-transition-metals'],
  },
  {
    id: 'ps-precipitate', chapter: CH, concepts: CHANGE, band: 3,
    term: 'a precipitate', gloss: 'is a solid that forms and separates out of a solution during a chemical reaction',
    recallStem: 'What is a solid that forms and separates out of a solution during a reaction called?',
    confusions: ['ps-exothermic', 'ps-endothermic'],
  },
  {
    id: 'ps-exothermic', chapter: CH, concepts: CHANGE, band: 3,
    term: 'an exothermic reaction', gloss: 'releases energy, usually as heat, into its surroundings',
    recallStem: 'What kind of reaction releases energy, usually as heat, into its surroundings?',
    confusions: ['ps-endothermic', 'ps-precipitate'],
  },
  {
    id: 'ps-endothermic', chapter: CH, concepts: CHANGE, band: 3,
    term: 'an endothermic reaction', gloss: 'absorbs energy, usually as heat, from its surroundings',
    recallStem: 'What kind of reaction absorbs energy, usually as heat, from its surroundings?',
    confusions: ['ps-exothermic', 'ps-precipitate'],
  },
  {
    id: 'ps-neutralization', chapter: CH, concepts: ACIDS_BASES, band: 3,
    term: 'neutralization', gloss: 'is the reaction between an acid and a base that produces water and a salt',
    recallStem: 'What is the reaction between an acid and a base, producing water and a salt, called?',
    confusions: ['ps-litmus-test', 'ps-strong-weak-acid'],
  },
  {
    id: 'ps-litmus-test', chapter: CH, concepts: ACIDS_BASES, band: 3,
    term: 'a litmus test', gloss: 'uses treated paper that changes color to quickly classify a solution as acidic or basic',
    recallStem: 'What test uses treated paper that changes color to classify a solution as acidic or basic?',
    confusions: ['ps-neutralization'],
  },
  {
    id: 'ps-strong-weak-acid', chapter: CH, concepts: ACIDS_BASES, band: 3,
    term: 'a strong acid', gloss: 'ionizes almost completely in water, unlike a weak acid, which only partly ionizes',
    recallStem: 'What kind of acid ionizes almost completely in water?',
    confusions: ['ps-neutralization', 'ps-litmus-test'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-sublimation', chapter: CH, concepts: STATES, band: 4,
    term: 'sublimation', gloss: 'is the direct change of a substance from a solid to a gas, skipping the liquid state entirely',
    recallStem: 'What is the direct change from a solid to a gas, skipping the liquid state, called?',
    confusions: ['ps-condensation', 'ps-deposition'],
  },
  {
    id: 'ps-condensation', chapter: CH, concepts: STATES, band: 4,
    term: 'condensation', gloss: 'is the change of a substance from a gas to a liquid',
    recallStem: 'What is the change from a gas to a liquid called?',
    confusions: ['ps-sublimation', 'ps-deposition'],
  },
  {
    id: 'ps-deposition', chapter: CH, concepts: STATES, band: 4,
    term: 'deposition', gloss: 'is the direct change of a substance from a gas to a solid, skipping the liquid state entirely',
    recallStem: 'What is the direct change from a gas to a solid, skipping the liquid state, called?',
    confusions: ['ps-sublimation', 'ps-condensation'],
  },
  {
    id: 'ps-periodic-law', chapter: CH, concepts: ORGANIZATION, band: 4,
    term: 'the periodic law', gloss: "states that an element's properties recur in a regular, predictable pattern when arranged by increasing atomic number",
    recallStem: "What law states that an element's properties recur in a regular pattern when arranged by atomic number?",
    confusions: ['ps-mendeleev', 'ps-mass-vs-number-ordering'],
  },
  {
    id: 'ps-mendeleev', chapter: CH, concepts: ORGANIZATION, band: 4,
    term: "Mendeleev's table", gloss: 'left gaps for undiscovered elements and correctly predicted several of their properties in advance',
    recallStem: "Whose early periodic table left gaps that correctly predicted undiscovered elements' properties?",
    confusions: ['ps-periodic-law'],
  },
  {
    id: 'ps-mass-vs-number-ordering', chapter: CH, concepts: ORGANIZATION, band: 4,
    term: 'ordering by atomic number, not atomic mass', gloss: 'is what the modern periodic table uses, correcting a small number of exceptions Mendeleev\'s mass-based table produced',
    recallStem: "What does the modern periodic table order elements by, instead of atomic mass?",
    confusions: ['ps-mendeleev', 'ps-periodic-law'],
  },
  {
    id: 'ps-catalyst', chapter: CH, concepts: CHANGE, band: 4,
    term: 'a catalyst', gloss: 'speeds up a chemical reaction without being permanently consumed by it',
    recallStem: 'What speeds up a chemical reaction without being permanently consumed by it?',
    confusions: ['ps-conservation-of-mass', 'ps-balanced-equation'],
  },
  {
    id: 'ps-conservation-of-mass', chapter: CH, concepts: CHANGE, band: 4,
    term: 'the conservation of mass', gloss: 'states that the total mass of the substances involved in a reaction stays the same before and after it',
    recallStem: "What law states that a reaction's total mass stays the same before and after it occurs?",
    confusions: ['ps-catalyst', 'ps-balanced-equation'],
  },
  {
    id: 'ps-balanced-equation', chapter: CH, concepts: CHANGE, band: 4,
    term: 'a balanced chemical equation', gloss: 'shows equal numbers of each kind of atom on both sides, reflecting the conservation of mass',
    recallStem: 'What shows equal numbers of each kind of atom on both sides of a reaction?',
    confusions: ['ps-conservation-of-mass', 'ps-catalyst'],
  },
  {
    id: 'ps-buffer', chapter: CH, concepts: ACIDS_BASES, band: 4,
    term: 'a buffer solution', gloss: 'resists changes to its own pH when a small amount of acid or base is added to it',
    recallStem: "What kind of solution resists changes to its own pH when a small amount of acid or base is added?",
    confusions: ['ps-arrhenius', 'ps-hydronium'],
  },
  {
    id: 'ps-arrhenius', chapter: CH, concepts: ACIDS_BASES, band: 4,
    term: 'the Arrhenius definition', gloss: 'defines an acid as a substance that increases the hydrogen ion concentration of a water solution',
    recallStem: 'What definition of an acid focuses on increasing the hydrogen ion concentration of a water solution?',
    confusions: ['ps-buffer', 'ps-hydronium'],
  },
  {
    id: 'ps-hydronium', chapter: CH, concepts: ACIDS_BASES, band: 4,
    term: 'a hydronium ion', gloss: 'forms when a hydrogen ion from an acid attaches to a water molecule in solution',
    recallStem: 'What ion forms when a hydrogen ion from an acid attaches to a water molecule?',
    confusions: ['ps-buffer', 'ps-arrhenius'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-chemistry-b2', name: 'States, the periodic table, change, and acids and bases' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-chemistry-b3', name: 'States, the periodic table, change, and acids and bases' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-chemistry-b4', name: 'States, the periodic table, change, and acids and bases' }),
];
