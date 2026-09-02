// The spine that lets ONE body of chem content serve TWO different exams.
//
// THE PROBLEM THIS SOLVES
// Trey's course and the ACS exam cover nearly the same material in different orders, and the
// existing curriculum.js was built to the ACS ordering. Studying it in order would put him on
// Electronic Structure while his class is on Atoms and Molecules - four chapters out of step:
//
//   Topic                 ACS ch    Course ch
//   Electronic Structure     2          6
//   Heat / Enthalpy          6          5
//   Bonding                  7        7 + 8   (course splits it)
//   States of Matter         8       9 + 10   (course splits into Gases / IMF)
//   Redox                 (Chem 2)      5     (his instructor tests it; ACS Chem-1 barely does)
//
// So neither ordering can be "the" ordering. The CONCEPT is the atom, and every concept carries
// BOTH coordinates. A drill can then be assembled by course section (to survive Friday's quiz) or
// by ACS chapter (to survive the final), from the same templates.
//
// SOURCES (all verified, not assumed):
//   - Course sections: the AcademiQ book itself, 10 chapters / 55 sections, captured 2026-09-02.
//   - ACS chapters: "Preparing for Your ACS Examination in General Chemistry" 2nd ed., first-term
//     chapter list (courses/PLAN.md, 2026-08-28 entry).
//   - Which section each quiz covers: Canvas assignment titles, e.g. "Quiz 12, Sec 4-3 to 4-4".
//   - Exam -> chapter map: the CHEM 1210 syllabus (courses/data/syllabi.json).

/**
 * @typedef {Object} SectionMap
 * @property {string} section      course section number, matching the book and the quiz titles
 * @property {string} title        the book's own section title
 * @property {string|null} acs     ACS chapter id this maps to, or null if the ACS exam skips it
 * @property {string[]} concepts   curriculum.js concept ids this section teaches
 */

/** ACS first-term chapters, in ACS order. `chem1-00-toolbox` etc. match curriculum.js ids. */
export const ACS_CHAPTERS = [
  { id: 'chem1-00-toolbox', acsNum: 0, title: 'Toolbox: Foundational Concepts' },
  { id: 'chem1-01-atomic-structure', acsNum: 1, title: 'Atomic Structure' },
  { id: 'chem1-02-electronic-structure', acsNum: 2, title: 'Electronic Structure' },
  { id: 'chem1-03-mole-calculations', acsNum: 3, title: 'Formula Calculations and the Mole' },
  { id: 'chem1-04-stoichiometry', acsNum: 4, title: 'Stoichiometry' },
  { id: 'chem1-05-solutions-aqueous-1', acsNum: 5, title: 'Solutions and Aqueous Reactions, Part 1' },
  { id: 'chem1-06-heat-enthalpy', acsNum: 6, title: 'Heat and Enthalpy' },
  { id: 'chem1-07-structure-bonding', acsNum: 7, title: 'Structure and Bonding' },
  { id: 'chem1-08-states-of-matter', acsNum: 8, title: 'States of Matter' },
];

/** The course's own 10 chapters, in the order class actually moves through them. */
export const COURSE_CHAPTERS = [
  { num: 1, title: 'Essential Ideas' },
  { num: 2, title: 'Atoms, Molecules, and Ions' },
  { num: 3, title: 'Composition of Substances and Solutions' },
  { num: 4, title: 'Stoichiometry of Chemical Reactions' },
  { num: 5, title: 'Redox and Thermochemistry' },
  { num: 6, title: 'Electronic Structure and Periodic Properties of Elements' },
  { num: 7, title: 'Chemical Bonding and Molecular Geometry' },
  { num: 8, title: 'Advanced Theories of Covalent Bonding' },
  { num: 9, title: 'Gases' },
  { num: 10, title: 'Intermolecular Forces' },
];

/**
 * Every teaching section of the book, mapped to its ACS home.
 * "-1 Introduction" sections are omitted: they are chapter front-matter and teach nothing testable.
 *
 * @type {SectionMap[]}
 */
export const SECTIONS = [
  // 1-2 is one of only two sections in the whole book carrying a graded checkpoint, and it is the
  // source of the macroscopic/particle/symbolic-domain questions in Trey's own course notes.
  { section: '1-2', title: 'Chemistry in Context', acs: 'chem1-00-toolbox', concepts: ['properties-representations-of-matter'] },
  { section: '1-3', title: 'Phases and Classification of Matter', acs: 'chem1-00-toolbox', concepts: ['classification-of-matter', 'properties-representations-of-matter'] },
  { section: '1-4', title: 'Physical and Chemical Properties', acs: 'chem1-00-toolbox', concepts: ['properties-representations-of-matter'] },
  { section: '1-5', title: 'Measurements', acs: 'chem1-00-toolbox', concepts: ['unit-conversions', 'scientific-notation'] },
  { section: '1-6', title: 'Significant Figures, Accuracy, and Precision', acs: 'chem1-00-toolbox', concepts: ['significant-figures'] },
  { section: '1-7', title: 'Mathematical Treatment of Measurement Results', acs: 'chem1-00-toolbox', concepts: ['unit-conversions', 'density'] },

  { section: '2-2', title: 'Early Ideas in Atomic Theory', acs: 'chem1-01-atomic-structure', concepts: ['atomic-number-vs-mass-number'] },
  { section: '2-3', title: 'Atomic Structure and Symbolism', acs: 'chem1-01-atomic-structure', concepts: ['isotope-and-ion-definitions', 'nuclear-symbol-notation', 'atomic-number-vs-mass-number', 'ion-charge-electrons-protons', 'relative-abundance-weighted-average'] },
  { section: '2-4', title: 'Chemical Formulas', acs: 'chem1-01-atomic-structure', concepts: ['predicting-ionic-formulas'] },
  { section: '2-5', title: 'The Periodic Table', acs: 'chem1-01-atomic-structure', concepts: ['periodic-table-groups-diatomics', 'element-classification-periodic-table'] },
  { section: '2-6', title: 'Ionic and Molecular Compounds', acs: 'chem1-01-atomic-structure', concepts: ['predicting-ionic-formulas'] },
  { section: '2-7', title: 'Chemical Nomenclature', acs: 'chem1-00-toolbox', concepts: ['nomenclature-ionic-covalent'] },

  { section: '3-2', title: 'Formula Mass and the Mole Concept', acs: 'chem1-03-mole-calculations', concepts: ['average-atomic-mass-lookup', 'molar-mass-calculation', 'mass-to-moles-conversion', 'avogadros-number', 'moles-to-mass-conversion', 'mole-ratios-from-formula'] },
  { section: '3-3', title: 'Determining Empirical and Molecular Formulas', acs: 'chem1-03-mole-calculations', concepts: ['empirical-formula-atomic-ratios'] },
  { section: '3-4', title: 'Molarity', acs: 'chem1-05-solutions-aqueous-1', concepts: ['molar-concentration-definition', 'molarity-from-mass', 'dilution-calculations'] },

  { section: '4-2', title: 'Writing and Balancing Chemical Equations', acs: 'chem1-04-stoichiometry', concepts: ['balancing-chemical-equations', 'molecules-to-moles-relationship'] },
  { section: '4-3', title: 'Some Chemical Reactions', acs: 'chem1-05-solutions-aqueous-1', concepts: ['electrolyte-strong-vs-weak', 'solubility-rules-precipitation', 'net-ionic-equations', 'weak-acid-particulate-representation', 'oxidation-number-rules', 'oxidation-reduction-definitions'] },
  { section: '4-4', title: 'Reaction Stoichiometry', acs: 'chem1-04-stoichiometry', concepts: ['mole-ratios-from-coefficients', 'moles-to-mass-stoichiometry'] },
  { section: '4-5', title: 'Reaction Yields', acs: 'chem1-04-stoichiometry', concepts: ['limiting-reactant-theoretical-yield'] },
  { section: '4-6', title: 'Titrations and Combustion Analysis', acs: 'chem1-05-solutions-aqueous-1', concepts: ['molarity-from-mass', 'dilution-calculations'] },

  // Redox is the one genuinely course-only topic: his instructor tests it in Ch5, but the ACS
  // FIRST-TERM exam does not carry it (full redox/electrochemistry is ACS Ch15, second term).
  // acs: null is meaningful - it tells the ACS track to skip it and the course track to keep it.
  { section: '5-2', title: 'Redox Reactions', acs: null, concepts: ['oxidation-number-rules', 'oxidation-reduction-definitions', 'oxidizing-reducing-agents'] },
  { section: '5-3', title: 'Energy Basics', acs: 'chem1-06-heat-enthalpy', concepts: ['first-law-thermodynamics', 'heat-mass-temperature-relationship', 'specific-heat-definition'] },
  { section: '5-4', title: 'Calorimetry', acs: 'chem1-06-heat-enthalpy', concepts: ['bomb-calorimetry'] },
  { section: '5-5', title: 'Enthalpy', acs: 'chem1-06-heat-enthalpy', concepts: ['energy-per-mole-reaction'] },
  { section: '5-6', title: "Hess's Law and Heat of Formation", acs: 'chem1-06-heat-enthalpy', concepts: ['hess-law', 'enthalpy-of-formation'] },

  { section: '6-2', title: 'Electromagnetic Energy', acs: 'chem1-02-electronic-structure', concepts: ['rydberg-formula-energy-levels', 'photon-energy-wavelength-relationship', 'absorption-vs-emission'] },
  { section: '6-3', title: 'Development of Quantum Theory', acs: 'chem1-02-electronic-structure', concepts: ['quantum-number-rules'] },
  { section: '6-4', title: 'Electronic Structure of Atoms (Electron Configurations)', acs: 'chem1-02-electronic-structure', concepts: ['electron-configuration-periodic-table', 'valence-electrons', 'cation-electron-removal-order', 'orbital-diagrams-paramagnetism', 'mole-definition'] },
  { section: '6-5', title: 'Periodic Variations in Element Properties', acs: 'chem1-02-electronic-structure', concepts: ['effective-nuclear-charge-zeff', 'periodic-trend-atomic-radius', 'periodic-trend-ionic-radius', 'ionization-energy-trend'] },

  { section: '7-2', title: 'Formation of Ionic Compounds', acs: 'chem1-07-structure-bonding', concepts: ['bond-type-electronegativity'] },
  { section: '7-3', title: 'Ionic Lattice Energy', acs: 'chem1-07-structure-bonding', concepts: ['lattice-energy-definition'] },
  { section: '7-4', title: 'Covalent Bonding', acs: 'chem1-07-structure-bonding', concepts: ['covalent-bond-concepts'] },
  { section: '7-5', title: 'Lewis Structures', acs: 'chem1-07-structure-bonding', concepts: ['lewis-dot-structures', 'formal-charge-calculation'] },
  { section: '7-6', title: 'Resonance', acs: 'chem1-07-structure-bonding', concepts: ['resonance-structures'] },

  { section: '8-2', title: 'Molecular Structure and Polarity', acs: 'chem1-07-structure-bonding', concepts: ['molecular-geometry-vsepr'] },
  // Geometry appears here as well as in 8-2: you cannot decide whether a molecule is polar without
  // first knowing its shape, so a polarity question legitimately tests both.
  { section: '8-3', title: 'Molecular Polarity', acs: 'chem1-07-structure-bonding', concepts: ['molecular-polarity', 'molecular-geometry-vsepr'] },
  { section: '8-4', title: 'Hybrid Orbitals', acs: 'chem1-07-structure-bonding', concepts: ['valence-bond-theory-orbital-overlap'] },
  { section: '8-5', title: 'Multiple Bonds', acs: 'chem1-07-structure-bonding', concepts: ['molecular-orbital-diagrams-bond-order', 'bond-enthalpy-reaction-enthalpy'] },

  { section: '9-2', title: 'Gas Pressure', acs: 'chem1-08-states-of-matter', concepts: ['ideal-gas-properties', 'combined-gas-law'] },
  { section: '9-3', title: 'Relating Pressure, Volume, Amount, and Temperature: The Ideal Gas Law', acs: 'chem1-08-states-of-matter', concepts: ['ideal-gas-law'] },
  { section: '9-4', title: 'Stoichiometry of Gaseous Substances, Mixtures, and Reactions', acs: 'chem1-08-states-of-matter', concepts: ['gas-stoichiometry', 'partial-pressure-dalton'] },
  { section: '9-5', title: 'Effusion and Diffusion of Gases', acs: 'chem1-08-states-of-matter', concepts: ['kinetic-molecular-theory', 'maxwell-boltzmann-distribution'] },

  { section: '10-2', title: 'Intermolecular Forces', acs: 'chem1-08-states-of-matter', concepts: ['hydrogen-bonding', 'intermolecular-forces-boiling-point'] },
  { section: '10-3', title: 'Heating Curves', acs: 'chem1-08-states-of-matter', concepts: ['vapor-pressure'] },
  { section: '10-4', title: 'Phase Diagrams', acs: 'chem1-08-states-of-matter', concepts: ['phase-diagrams', 'unit-cell-density'] },
];

/**
 * Exam -> course chapter coverage, from the syllabus. Every exam is CUMULATIVE, and a later exam
 * retroactively raises earlier ones, so "covers" is the full span rather than what is new.
 * `chapters` are COURSE chapter numbers.
 */
export const EXAMS = [
  { id: 'exam-1', name: 'Exam 1', chapters: [1, 2], acsEquivalent: false },
  { id: 'exam-2', name: 'Exam 2', chapters: [1, 2, 3, 4], acsEquivalent: false },
  { id: 'exam-3', name: 'Exam 3', chapters: [1, 2, 3, 4, 5, 6], acsEquivalent: false },
  { id: 'exam-4', name: 'Exam 4', chapters: [1, 2, 3, 4, 5, 6, 7, 8], acsEquivalent: false },
  { id: 'final', name: 'Final (ACS standardized)', chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], acsEquivalent: true },
];

const chapterOf = (section) => Number(String(section).split('-')[0]);

/** Every teaching section in one course chapter. */
export const sectionsInChapter = (num) => SECTIONS.filter((s) => chapterOf(s.section) === num);

/** Every teaching section an exam covers, in course order. */
export function sectionsForExam(examId) {
  const exam = EXAMS.find((e) => e.id === examId);
  if (!exam) return [];
  return SECTIONS.filter((s) => exam.chapters.includes(chapterOf(s.section)));
}

/** Every section mapping onto one ACS chapter, for ACS-ordered study. */
export const sectionsForAcsChapter = (acsId) => SECTIONS.filter((s) => s.acs === acsId);

/**
 * Parse the section span out of a Canvas quiz title, e.g.
 *   "Quiz 12, Sec 4-3 to 4-4"  -> ['4-3', '4-4']
 *   "Quiz 4, Sec 1-7"          -> ['1-7']
 *   "Quiz 1, Ch 1, Sections 1-3" -> ['1-3']
 * Returns [] when the title names no section, which is a real case (Quiz Zero) and not an error.
 */
export function sectionsFromQuizTitle(title) {
  const nums = [...String(title ?? '').matchAll(/\b(\d{1,2}-\d{1,2})\b/g)].map((m) => m[1]);
  if (!nums.length) return [];

  // Work on the numeric span, NOT on whether each endpoint is itself a teaching section. Real
  // titles start ranges on "-1 Introduction" sections, which this map deliberately omits:
  // "Quiz Zero 1-1 to 1-2" and "Quiz 5, Sec 2-1 to 2-3" both do. Matching endpoints against known
  // sections first made those ranges collapse to a single section, silently under-drilling a quiz.
  const key = (s) => {
    const [c, n] = String(s).split('-').map(Number);
    return c * 1000 + n;
  };
  const keys = nums.map(key);
  const lo = Math.min(...keys);
  const hi = Math.max(...keys);

  return SECTIONS.filter((s) => {
    const k = key(s.section);
    return k >= lo && k <= hi;
  }).map((s) => s.section);
}

/** Sections that the ACS exam does not test — course-only material. */
export const courseOnlySections = () => SECTIONS.filter((s) => s.acs === null);
