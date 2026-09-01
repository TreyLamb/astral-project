// Atomic Structure. Original questions, informed by (never copied from) the ACS study guide's
// "Knowledge Required" tags for this chapter — see courses/chem/curriculum.js's header comment
// for the source and courses/chem/PLAN.md for the doctrine this follows.

import { registerChemTemplate } from '../generator.js';
import { shuffle } from '../../../../engine/rng.js';

const CH = 'chem1-01-atomic-structure';

// --- shared formatting helpers ---------------------------------------------

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const toSup = (n) => String(n).split('').map((d) => SUP[d]).join('');
const toSub = (n) => String(n).split('').map((d) => SUB[d]).join('');

// e.g. chargeSup(2) => "²⁺", chargeSup(-1) => "⁻", chargeSup(3) => "³⁺"
const chargeSup = (charge) => {
  const mag = Math.abs(charge);
  return (mag === 1 ? '' : toSup(mag)) + (charge > 0 ? '⁺' : '⁻');
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const sampleWithoutReplacement = (arr, n, rng) => {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};

// --- shared data pools -------------------------------------------------------

// Isotopes with real, verified mass numbers (protons = Z). Used for nuclear-symbol notation,
// the isotope-vs-isotope comparison, and neutron counting.
const ISOTOPE_POOL = [
  { symbol: 'C', name: 'carbon', Z: 6, massNumbers: [12, 13, 14] },
  { symbol: 'N', name: 'nitrogen', Z: 7, massNumbers: [14, 15] },
  { symbol: 'O', name: 'oxygen', Z: 8, massNumbers: [16, 17, 18] },
  { symbol: 'Na', name: 'sodium', Z: 11, massNumbers: [23] },
  { symbol: 'Mg', name: 'magnesium', Z: 12, massNumbers: [24, 25, 26] },
  { symbol: 'Al', name: 'aluminum', Z: 13, massNumbers: [27] },
  { symbol: 'Cl', name: 'chlorine', Z: 17, massNumbers: [35, 37] },
  { symbol: 'K', name: 'potassium', Z: 19, massNumbers: [39, 40, 41] },
  { symbol: 'Ca', name: 'calcium', Z: 20, massNumbers: [40, 42, 43, 44] },
  { symbol: 'Fe', name: 'iron', Z: 26, massNumbers: [54, 56, 57, 58] },
  { symbol: 'Cu', name: 'copper', Z: 29, massNumbers: [63, 65] },
  { symbol: 'Zn', name: 'zinc', Z: 30, massNumbers: [64, 66, 67, 68] },
  { symbol: 'Br', name: 'bromine', Z: 35, massNumbers: [79, 81] },
  { symbol: 'Ag', name: 'silver', Z: 47, massNumbers: [107, 109] },
  { symbol: 'I', name: 'iodine', Z: 53, massNumbers: [127] },
];

registerChemTemplate({
  id: 'chem1-01-nuclear-symbol-notation',
  chapterId: CH,
  band: 1,
  name: 'Reading/writing nuclear symbol notation',
  concepts: ['nuclear-symbol-notation', 'atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    const el = h.pick(ISOTOPE_POOL);
    const A = h.pick(el.massNumbers);
    const Z = el.Z;
    const correct = `${toSup(A)}${toSub(Z)}${el.symbol}`;
    return {
      stem: `Which nuclear symbol correctly represents an atom of ${el.name}-${A} (atomic number ${Z})?`,
      ...h.choices(
        correct,
        [
          { value: `${toSup(Z)}${toSub(A)}${el.symbol}`, error: 'swapped-sub-superscript', why: 'swapped which number goes in the superscript (mass number) and which goes in the subscript (atomic number)' },
          { value: `${toSup(A)}${toSub(Z + 1)}${el.symbol}`, error: 'wrong-atomic-number', why: 'used the wrong atomic number in the subscript' },
          { value: `${toSup(A + 1)}${toSub(Z)}${el.symbol}`, error: 'wrong-mass-number', why: 'used the wrong mass number in the superscript' },
        ],
      ),
      explanation: `Nuclear symbol notation places the mass number (protons + neutrons) as a left superscript and the atomic number (protons) as a left subscript: ${correct} means ${A} total nucleons, ${Z} of them protons.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-01-isotope-definition',
  chapterId: CH,
  band: 1,
  name: 'What distinguishes two isotopes',
  concepts: ['isotope-and-ion-definitions', 'atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    const pool = ISOTOPE_POOL.filter((e) => e.massNumbers.length >= 2);
    const el = h.pick(pool);
    let i1 = h.int(0, el.massNumbers.length - 1);
    let i2 = h.int(0, el.massNumbers.length - 1);
    while (i2 === i1) i2 = h.int(0, el.massNumbers.length - 1);
    const m1 = Math.min(el.massNumbers[i1], el.massNumbers[i2]);
    const m2 = Math.max(el.massNumbers[i1], el.massNumbers[i2]);
    return {
      stem: `Two isotopes of ${el.name}, ${el.symbol}-${m1} and ${el.symbol}-${m2}, are compared. Which statement correctly describes how they differ?`,
      ...h.choices(
        { value: 'They have the same number of protons, but a different number of neutrons (and therefore a different mass number).' },
        [
          { value: 'They have a different number of protons, since they are different isotopes.', error: 'isotopes-differ-in-protons', why: 'thought isotopes of the same element differ in proton count — they never do, that would make them a different element' },
          { value: 'They have the same mass number, but a different number of protons.', error: 'swapped-what-differs', why: 'swapped which quantity stays the same and which one changes between isotopes' },
          { value: 'They are different elements entirely, since their mass numbers differ.', error: 'isotope-mistaken-for-different-element', why: 'mistook two isotopes of one element for two different elements' },
        ],
      ),
      explanation: `Isotopes of the same element always have the same number of protons (that's what makes them ${el.name}) but a different number of neutrons, so their mass numbers differ: ${el.symbol}-${m1} has ${m1 - el.Z} neutrons, ${el.symbol}-${m2} has ${m2 - el.Z}.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-01-particle-counting',
  chapterId: CH,
  band: 2,
  name: 'Counting neutrons from mass and atomic number',
  concepts: ['atomic-number-vs-mass-number', 'isotope-and-ion-definitions'],
  generate: (rng, h) => {
    const el = h.pick(ISOTOPE_POOL);
    const A = h.pick(el.massNumbers);
    const Z = el.Z;
    const neutrons = A - Z;
    return {
      stem: `An atom of ${el.name}-${A} has a mass number of ${A} and an atomic number of ${Z}. How many neutrons does it contain?`,
      ...h.choices(
        String(neutrons),
        [
          { value: String(A + Z), error: 'added-instead-of-subtracted', why: 'added the mass number and atomic number instead of subtracting' },
          { value: String(A), error: 'used-mass-number', why: 'reported the mass number itself instead of subtracting the atomic number from it' },
          { value: String(Z), error: 'used-atomic-number', why: 'reported the atomic number (proton count) instead of the neutron count' },
        ],
      ),
      explanation: `neutrons = mass number − atomic number = ${A} − ${Z} = ${neutrons}.`,
    };
  },
});

// Cations and anions with real, unambiguous charges (single-charge transition-metal ions
// included, e.g. Zn²⁺ and Ag⁺, but NOT Fe/Cu which have more than one common charge).
const ION_EXAMPLES = [
  { symbol: 'Na', name: 'sodium', Z: 11, charge: 1 },
  { symbol: 'Mg', name: 'magnesium', Z: 12, charge: 2 },
  { symbol: 'Al', name: 'aluminum', Z: 13, charge: 3 },
  { symbol: 'K', name: 'potassium', Z: 19, charge: 1 },
  { symbol: 'Ca', name: 'calcium', Z: 20, charge: 2 },
  { symbol: 'Zn', name: 'zinc', Z: 30, charge: 2 },
  { symbol: 'Ag', name: 'silver', Z: 47, charge: 1 },
  { symbol: 'F', name: 'fluorine', Z: 9, charge: -1 },
  { symbol: 'O', name: 'oxygen', Z: 8, charge: -2 },
  { symbol: 'N', name: 'nitrogen', Z: 7, charge: -3 },
  { symbol: 'S', name: 'sulfur', Z: 16, charge: -2 },
  { symbol: 'Cl', name: 'chlorine', Z: 17, charge: -1 },
  { symbol: 'Br', name: 'bromine', Z: 35, charge: -1 },
];

registerChemTemplate({
  id: 'chem1-01-ion-charge-particles',
  chapterId: CH,
  band: 2,
  name: 'Electron count of an ion from its charge',
  concepts: ['ion-charge-electrons-protons'],
  generate: (rng, h) => {
    const ion = h.pick(ION_EXAMPLES);
    const electrons = ion.Z - ion.charge;
    return {
      stem: `A neutral atom of ${ion.name} has ${ion.Z} protons and ${ion.Z} electrons. It forms the ion ${ion.symbol}${chargeSup(ion.charge)}. How many electrons does this ion have?`,
      ...h.choices(
        String(electrons),
        [
          { value: String(ion.Z), error: 'ignored-charge', why: 'kept the neutral-atom electron count and ignored that the ion has gained or lost electrons' },
          { value: String(ion.Z + ion.charge), error: 'added-instead-of-subtracted', why: 'added the charge to the proton count instead of subtracting it' },
          { value: String(Math.abs(ion.charge)), error: 'charge-mistaken-for-count', why: 'reported the charge itself as if it were the electron count' },
        ],
      ),
      explanation: `electrons = protons − charge = ${ion.Z} − (${ion.charge}) = ${electrons}. A positive charge means the atom lost electrons; a negative charge means it gained them.`,
    };
  },
});

// Real, IUPAC isotopic masses and natural abundances (verified by hand: each pair's
// weighted average reproduces the element's standard atomic weight).
const WEIGHTED_AVERAGE_POOL = [
  { name: 'chlorine', symbol: 'Cl', isoA: { massNum: 35, mass: 34.9689, abundance: 75.77 }, isoB: { massNum: 37, mass: 36.9659, abundance: 24.23 } },
  { name: 'copper', symbol: 'Cu', isoA: { massNum: 63, mass: 62.9296, abundance: 69.15 }, isoB: { massNum: 65, mass: 64.9278, abundance: 30.85 } },
  { name: 'bromine', symbol: 'Br', isoA: { massNum: 79, mass: 78.9183, abundance: 50.69 }, isoB: { massNum: 81, mass: 80.9163, abundance: 49.31 } },
  { name: 'boron', symbol: 'B', isoA: { massNum: 10, mass: 10.0129, abundance: 19.9 }, isoB: { massNum: 11, mass: 11.0093, abundance: 80.1 } },
  { name: 'silver', symbol: 'Ag', isoA: { massNum: 107, mass: 106.9051, abundance: 51.84 }, isoB: { massNum: 109, mass: 108.9048, abundance: 48.16 } },
  { name: 'lithium', symbol: 'Li', isoA: { massNum: 6, mass: 6.0151, abundance: 7.59 }, isoB: { massNum: 7, mass: 7.016, abundance: 92.41 } },
];

registerChemTemplate({
  id: 'chem1-01-weighted-average-mass',
  chapterId: CH,
  band: 3,
  name: 'Average atomic mass from isotope abundances',
  concepts: ['relative-abundance-weighted-average'],
  generate: (rng, h) => {
    const el = h.pick(WEIGHTED_AVERAGE_POOL);
    const { isoA, isoB } = el;
    const correct = (isoA.mass * isoA.abundance + isoB.mass * isoB.abundance) / 100;
    const unweighted = (isoA.mass + isoB.mass) / 2;
    const swapped = (isoA.mass * isoB.abundance + isoB.mass * isoA.abundance) / 100;
    const notDivided = isoA.mass * isoA.abundance + isoB.mass * isoB.abundance;
    return {
      stem: `A naturally occurring sample of ${el.name} contains two stable isotopes: ${el.symbol}-${isoA.massNum} (mass = ${isoA.mass} amu, ${isoA.abundance}% abundance) and ${el.symbol}-${isoB.massNum} (mass = ${isoB.mass} amu, ${isoB.abundance}% abundance). What is the average atomic mass of ${el.name}, to two decimal places?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} amu` },
        [
          { value: `${unweighted.toFixed(2)} amu`, error: 'unweighted-average', why: 'averaged the two isotope masses directly without weighting by their abundance' },
          { value: `${swapped.toFixed(2)} amu`, error: 'swapped-abundances', why: 'paired each isotope’s mass with the other isotope’s abundance' },
          { value: `${notDivided.toFixed(2)} amu`, error: 'percent-not-converted', why: 'used the abundance as a whole percent instead of converting it to a decimal fraction first' },
        ],
      ),
      explanation: `Weighted average = (mass₁ × fraction₁) + (mass₂ × fraction₂) = (${isoA.mass} × ${(isoA.abundance / 100).toFixed(4)}) + (${isoB.mass} × ${(isoB.abundance / 100).toFixed(4)}) = ${correct.toFixed(2)} amu.`,
    };
  },
});

const FAMILY_POOL = [
  { symbol: 'Li', name: 'lithium', family: 'alkali metal' },
  { symbol: 'Na', name: 'sodium', family: 'alkali metal' },
  { symbol: 'K', name: 'potassium', family: 'alkali metal' },
  { symbol: 'Be', name: 'beryllium', family: 'alkaline earth metal' },
  { symbol: 'Mg', name: 'magnesium', family: 'alkaline earth metal' },
  { symbol: 'Ca', name: 'calcium', family: 'alkaline earth metal' },
  { symbol: 'F', name: 'fluorine', family: 'halogen' },
  { symbol: 'Cl', name: 'chlorine', family: 'halogen' },
  { symbol: 'Br', name: 'bromine', family: 'halogen' },
  { symbol: 'I', name: 'iodine', family: 'halogen' },
  { symbol: 'He', name: 'helium', family: 'noble gas' },
  { symbol: 'Ne', name: 'neon', family: 'noble gas' },
  { symbol: 'Ar', name: 'argon', family: 'noble gas' },
  { symbol: 'Kr', name: 'krypton', family: 'noble gas' },
  { symbol: 'Fe', name: 'iron', family: 'transition metal' },
  { symbol: 'Cu', name: 'copper', family: 'transition metal' },
  { symbol: 'Zn', name: 'zinc', family: 'transition metal' },
  { symbol: 'Ag', name: 'silver', family: 'transition metal' },
];
const FAMILIES = ['alkali metal', 'alkaline earth metal', 'halogen', 'noble gas', 'transition metal'];

registerChemTemplate({
  id: 'chem1-01-periodic-groups',
  chapterId: CH,
  band: 1,
  name: 'Identifying a periodic table family',
  concepts: ['periodic-table-groups-diatomics'],
  generate: (rng, h) => {
    const item = h.pick(FAMILY_POOL);
    return {
      stem: `Which family (group) on the periodic table does ${item.name} (${item.symbol}) belong to?`,
      ...h.choices(
        item.family,
        FAMILIES.filter((f) => f !== item.family).map((f) => ({ value: f, error: 'wrong-family', why: `identified it as a member of the ${f} family instead` })),
      ),
      explanation: `${item.name[0].toUpperCase()}${item.name.slice(1)} (${item.symbol}) sits in the ${item.family} family — elements in the same family share the periodic table column and, with it, similar chemical behavior.`,
    };
  },
});

const DIATOMIC = [
  { symbol: 'H', name: 'hydrogen' },
  { symbol: 'N', name: 'nitrogen' },
  { symbol: 'O', name: 'oxygen' },
  { symbol: 'F', name: 'fluorine' },
  { symbol: 'Cl', name: 'chlorine' },
  { symbol: 'Br', name: 'bromine' },
  { symbol: 'I', name: 'iodine' },
];
const NON_DIATOMIC = [
  { symbol: 'Na', name: 'sodium' },
  { symbol: 'Fe', name: 'iron' },
  { symbol: 'Ne', name: 'neon' },
  { symbol: 'C', name: 'carbon' },
  { symbol: 'S', name: 'sulfur' },
  { symbol: 'K', name: 'potassium' },
  { symbol: 'Cu', name: 'copper' },
  { symbol: 'Ar', name: 'argon' },
  { symbol: 'He', name: 'helium' },
  { symbol: 'Al', name: 'aluminum' },
];

registerChemTemplate({
  id: 'chem1-01-diatomic-elements',
  chapterId: CH,
  band: 1,
  name: 'Identifying a diatomic element',
  concepts: ['periodic-table-groups-diatomics'],
  generate: (rng, h) => {
    const correct = h.pick(DIATOMIC);
    const distractors = sampleWithoutReplacement(NON_DIATOMIC, 3, h.rng);
    return {
      stem: `Which of these elements exists as a diatomic molecule (two atoms bonded together, X₂) in its pure elemental form?`,
      ...h.choices(
        correct.name,
        distractors.map((d) => ({ value: d.name, error: 'not-diatomic-element', why: `${d.name} does not exist as a diatomic molecule in its pure elemental form` })),
      ),
      explanation: `Only seven elements exist as diatomic molecules in their elemental form: H₂, N₂, O₂, F₂, Cl₂, Br₂, and I₂. Every other element's elemental form is single atoms (like the noble gases) or a larger cluster (like S₈ or P₄), never a plain two-atom molecule.`,
    };
  },
});

const CLASS_POOL = [
  { symbol: 'Na', name: 'sodium', kind: 'metal' },
  { symbol: 'Fe', name: 'iron', kind: 'metal' },
  { symbol: 'Al', name: 'aluminum', kind: 'metal' },
  { symbol: 'Cu', name: 'copper', kind: 'metal' },
  { symbol: 'Ca', name: 'calcium', kind: 'metal' },
  { symbol: 'Zn', name: 'zinc', kind: 'metal' },
  { symbol: 'O', name: 'oxygen', kind: 'nonmetal' },
  { symbol: 'N', name: 'nitrogen', kind: 'nonmetal' },
  { symbol: 'S', name: 'sulfur', kind: 'nonmetal' },
  { symbol: 'Cl', name: 'chlorine', kind: 'nonmetal' },
  { symbol: 'C', name: 'carbon', kind: 'nonmetal' },
  { symbol: 'B', name: 'boron', kind: 'metalloid' },
  { symbol: 'Si', name: 'silicon', kind: 'metalloid' },
  { symbol: 'Ge', name: 'germanium', kind: 'metalloid' },
  { symbol: 'As', name: 'arsenic', kind: 'metalloid' },
  { symbol: 'Sb', name: 'antimony', kind: 'metalloid' },
];
const CLASSES = ['metal', 'nonmetal', 'metalloid'];

registerChemTemplate({
  id: 'chem1-01-element-classification',
  chapterId: CH,
  band: 2,
  name: 'Classifying an element by periodic table position',
  concepts: ['element-classification-periodic-table'],
  generate: (rng, h) => {
    const item = h.pick(CLASS_POOL);
    return {
      stem: `Based on its position on the periodic table, how is ${item.name} (${item.symbol}) classified?`,
      ...h.choices(
        item.kind,
        CLASSES.filter((c) => c !== item.kind).map((c) => ({ value: c, error: 'misclassified-element', why: `classified it as a ${c} instead` })),
      ),
      explanation: `Metals occupy the left and center of the table (shiny, malleable, conduct electricity, tend to lose electrons); nonmetals occupy the upper right; metalloids form the staircase boundary between them (B, Si, Ge, As, Sb, Te) and share properties of both.`,
    };
  },
});

// Main-group + single-charge transition-metal ions, all with unambiguous common charges.
const FORMULA_CATIONS = [
  { symbol: 'Na', name: 'sodium', charge: 1 },
  { symbol: 'K', name: 'potassium', charge: 1 },
  { symbol: 'Ag', name: 'silver', charge: 1 },
  { symbol: 'Mg', name: 'magnesium', charge: 2 },
  { symbol: 'Ca', name: 'calcium', charge: 2 },
  { symbol: 'Zn', name: 'zinc', charge: 2 },
  { symbol: 'Al', name: 'aluminum', charge: 3 },
];
const FORMULA_ANIONS = [
  { symbol: 'Cl', name: 'chloride', charge: -1 },
  { symbol: 'Br', name: 'bromide', charge: -1 },
  { symbol: 'F', name: 'fluoride', charge: -1 },
  { symbol: 'O', name: 'oxide', charge: -2 },
  { symbol: 'S', name: 'sulfide', charge: -2 },
  { symbol: 'N', name: 'nitride', charge: -3 },
];

const formatFormula = (catSymbol, catCount, anSymbol, anCount) =>
  `${catSymbol}${catCount > 1 ? toSub(catCount) : ''}${anSymbol}${anCount > 1 ? toSub(anCount) : ''}`;

registerChemTemplate({
  id: 'chem1-01-ionic-formula-predict',
  chapterId: CH,
  band: 2,
  name: 'Predicting a neutral ionic formula from charges',
  concepts: ['predicting-ionic-formulas'],
  generate: (rng, h) => {
    const cat = h.pick(FORMULA_CATIONS);
    const an = h.pick(FORMULA_ANIONS);
    const catMag = cat.charge;
    const anMag = Math.abs(an.charge);
    const g = gcd(catMag, anMag);
    const catCount = anMag / g;
    const anCount = catMag / g;
    const correct = formatFormula(cat.symbol, catCount, an.symbol, anCount);
    return {
      stem: `A ${cat.name} ion (${cat.symbol}${chargeSup(cat.charge)}) combines with a ${an.name} ion (${an.symbol}${chargeSup(an.charge)}) to form a neutral ionic compound. What is the correct formula?`,
      ...h.choices(
        correct,
        [
          { value: formatFormula(cat.symbol, catMag, an.symbol, anMag), error: 'swapped-subscripts', why: "used each ion's own charge as its own subscript instead of crisscrossing the charges onto the other ion" },
          { value: formatFormula(cat.symbol, 1, an.symbol, 1), error: 'ignored-charge', why: 'wrote a 1:1 formula and ignored the charges entirely' },
          { value: formatFormula(cat.symbol, 1, an.symbol, catMag + anMag), error: 'summed-charges-as-subscript', why: "added the two ions' charge magnitudes together into one subscript instead of crisscrossing each charge onto the other ion" },
        ],
      ),
      explanation: `Charge balance (the crisscross rule): the cation's charge magnitude (${catMag}) becomes the anion's subscript and the anion's charge magnitude (${anMag}) becomes the cation's subscript, then reduce by their greatest common factor (${g}): ${correct}.`,
    };
  },
});
