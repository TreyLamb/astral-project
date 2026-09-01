// Pure data: the CHEM 1210 (Chem 1 / first-term) curriculum. Concepts are grounded in the real
// ACS "Preparing for Your ACS Examination in General Chemistry" 2nd ed. study guide — the
// Toolbox concepts come from its own "Specific topics covered" list (PDF p.7); every other
// chapter's concepts are deduplicated from the "Knowledge Required:" tag under every one of
// that chapter's Study Questions (extracted directly from the PDF, offset = printed page + 7 —
// see courses/PLAN.md's 2026-08-28 entry). Never the question text itself — see chem/PLAN.md.
//
// Mirrors afoqt/curriculum/chapters.js's shape (id/title/order/concepts/prereqs/testOutPass/
// minutes), minus AFOQT-only fields (track/subtest/bands/subtest-pacing) Chem doesn't need.

/**
 * @typedef {Object} ChemChapter
 * @property {string} id
 * @property {number} order
 * @property {string} title
 * @property {string} summary        one line, shown on the curriculum map
 * @property {number} minutes        honest reading estimate for the lesson
 * @property {string[]} prereqs      chapter ids; a locked chapter names what unlocks it
 * @property {number} testOutPass    correct answers out of 5 needed to skip the lesson
 * @property {string[]} concepts     every concept the lesson teaches - all must be tested
 */

/** @type {ChemChapter[]} */
export const CHEM_CHAPTERS = [
  {
    id: 'chem1-00-toolbox',
    order: 0,
    title: 'Toolbox: Foundational Concepts',
    summary: 'Unit conversions, significant figures, scientific notation, nomenclature, density, classifying matter.',
    minutes: 8,
    prereqs: [],
    testOutPass: 4,
    concepts: [
      'unit-conversions',
      'significant-figures',
      'scientific-notation',
      'nomenclature-ionic-covalent',
      'density',
      'classification-of-matter',
      'properties-representations-of-matter',
    ],
  },
  {
    id: 'chem1-01-atomic-structure',
    order: 1,
    title: 'Atomic Structure',
    summary: 'Isotopes and ions, nuclear symbol notation, atomic number vs. mass number, average atomic mass, the periodic table.',
    minutes: 9,
    prereqs: ['chem1-00-toolbox'],
    testOutPass: 4,
    concepts: [
      'isotope-and-ion-definitions',
      'nuclear-symbol-notation',
      'atomic-number-vs-mass-number',
      'ion-charge-electrons-protons',
      'relative-abundance-weighted-average',
      'periodic-table-groups-diatomics',
      'element-classification-periodic-table',
      'predicting-ionic-formulas',
    ],
  },
  {
    id: 'chem1-02-electronic-structure',
    order: 2,
    title: 'Electronic Structure',
    summary: 'Photon energy and the Rydberg formula, quantum numbers, electron configuration, periodic trends (Zeff, radius, ionization energy).',
    minutes: 11,
    prereqs: ['chem1-01-atomic-structure'],
    testOutPass: 4,
    concepts: [
      'rydberg-formula-energy-levels',
      'photon-energy-wavelength-relationship',
      'absorption-vs-emission',
      'quantum-number-rules',
      'electron-configuration-periodic-table',
      'valence-electrons',
      'cation-electron-removal-order',
      'orbital-diagrams-paramagnetism',
      'effective-nuclear-charge-zeff',
      'periodic-trend-atomic-radius',
      'periodic-trend-ionic-radius',
      'ionization-energy-trend',
      'mole-definition',
    ],
  },
  {
    id: 'chem1-03-mole-calculations',
    order: 3,
    title: 'Formula Calculations and the Mole',
    summary: "Molar mass, Avogadro's number, mass-to-mole conversions, mole ratios from a formula.",
    minutes: 8,
    prereqs: ['chem1-02-electronic-structure'],
    testOutPass: 4,
    concepts: [
      'average-atomic-mass-lookup',
      'molar-mass-calculation',
      'mass-to-moles-conversion',
      'avogadros-number',
      'mole-ratios-from-formula',
      'moles-to-mass-conversion',
      'empirical-formula-atomic-ratios',
    ],
  },
  {
    id: 'chem1-04-stoichiometry',
    order: 4,
    title: 'Stoichiometry',
    summary: 'Balancing equations, mole ratios from coefficients, mass-to-mass stoichiometry, limiting reactant and theoretical yield.',
    minutes: 9,
    prereqs: ['chem1-03-mole-calculations'],
    testOutPass: 5,
    concepts: [
      'balancing-chemical-equations',
      'mole-ratios-from-coefficients',
      'moles-to-mass-stoichiometry',
      'limiting-reactant-theoretical-yield',
      'molecules-to-moles-relationship',
    ],
  },
  {
    id: 'chem1-05-solutions-aqueous-1',
    order: 5,
    title: 'Solutions and Aqueous Reactions, Part 1',
    summary: 'Electrolytes, molarity and dilution, solubility rules and precipitation, net ionic equations, oxidation numbers.',
    minutes: 10,
    prereqs: ['chem1-04-stoichiometry'],
    testOutPass: 4,
    concepts: [
      'electrolyte-strong-vs-weak',
      'molar-concentration-definition',
      'molarity-from-mass',
      'dilution-calculations',
      'solubility-rules-precipitation',
      'net-ionic-equations',
      'weak-acid-particulate-representation',
      'oxidation-number-rules',
      'oxidation-reduction-definitions',
      'oxidizing-reducing-agents',
    ],
  },
  {
    id: 'chem1-06-heat-enthalpy',
    order: 6,
    title: 'Heat and Enthalpy',
    summary: 'Specific heat, the first law of thermodynamics, bomb calorimetry, enthalpy of formation, Hess’s law.',
    minutes: 9,
    prereqs: ['chem1-05-solutions-aqueous-1'],
    testOutPass: 4,
    concepts: [
      'specific-heat-definition',
      'heat-mass-temperature-relationship',
      'first-law-thermodynamics',
      'energy-per-mole-reaction',
      'bomb-calorimetry',
      'enthalpy-of-formation',
      'hess-law',
    ],
  },
  {
    id: 'chem1-07-structure-bonding',
    order: 7,
    title: 'Structure and Bonding',
    summary: 'Lattice energy, bond type and electronegativity, Lewis structures, formal charge, resonance, VSEPR geometry, molecular orbital theory.',
    minutes: 12,
    prereqs: ['chem1-06-heat-enthalpy'],
    testOutPass: 5,
    concepts: [
      'lattice-energy-definition',
      'bond-type-electronegativity',
      'lewis-dot-structures',
      'formal-charge-calculation',
      'resonance-structures',
      'bond-enthalpy-reaction-enthalpy',
      'covalent-bond-concepts',
      'molecular-geometry-vsepr',
      'molecular-polarity',
      'valence-bond-theory-orbital-overlap',
      'molecular-orbital-diagrams-bond-order',
    ],
  },
  {
    id: 'chem1-08-states-of-matter',
    order: 8,
    title: 'States of Matter',
    summary: 'Ideal and combined gas laws, gas stoichiometry, partial pressure, kinetic molecular theory, intermolecular forces, phase diagrams.',
    minutes: 11,
    prereqs: ['chem1-07-structure-bonding'],
    testOutPass: 4,
    concepts: [
      'ideal-gas-properties',
      'ideal-gas-law',
      'combined-gas-law',
      'gas-stoichiometry',
      'partial-pressure-dalton',
      'kinetic-molecular-theory',
      'maxwell-boltzmann-distribution',
      'hydrogen-bonding',
      'intermolecular-forces-boiling-point',
      'vapor-pressure',
      'unit-cell-density',
      'phase-diagrams',
    ],
  },
];

const CHAPTER_BY_ID = new Map(CHEM_CHAPTERS.map((c) => [c.id, c]));

export const getChemChapter = (id) => CHAPTER_BY_ID.get(id) ?? null;

export const ALL_CHEM_CONCEPTS = [...new Set(CHEM_CHAPTERS.flatMap((c) => c.concepts))];

export const TOTAL_CHEM_LESSON_MINUTES = CHEM_CHAPTERS.reduce((n, c) => n + c.minutes, 0);

/** Same rule as afoqt/curriculum/chapters.js's isUnlocked: every prereq must be done. */
export function isChemChapterUnlocked(chapter, chaptersProgress = {}) {
  return (chapter.prereqs ?? []).every((p) => {
    const st = chaptersProgress[p];
    return st && (st.status === 'complete' || st.testedOut);
  });
}
