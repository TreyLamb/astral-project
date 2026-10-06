// Chapter 2 (Atoms, Molecules, and Ions, sections 2-2 through 2-7) study items — same shape and
// same "no bands" instruction as ch1Items.js (see its header for the full rationale). Built
// 2026-09-08 after Trey corrected the scope: Exam 1 covers course chapters 1 AND 2 (confirmed by
// `syllabusMap.js`'s EXAMS — exam-1: chapters: [1, 2]), so Ch2 content is needed now, not deferred.
//
// CH2_REAL_ITEMS — this time the source isn't Trey's own quiz exports (no Quiz 5/6/7 PDFs exist
// yet — see courses/PLAN.md's tracker) but the AcademiQ chapter text's own "End of Section
// Exercises," which ARE real, answer-keyed practice problems the textbook itself provides
// (G:\...\CHEM 1210\_academiq\ch02-atoms-molecules-and-ions.md). A representative subset per
// section is transcribed verbatim (not all ~85 of them, to keep this the same rough scale as
// Ch1's real pool) — same AGENT-PROMPT.md §5 class-8 "REAL TEST ITEM" handling as Ch1.
// ⚠ When Trey's own Quiz 5/6/7 exports arrive, add them here too and note it in PLAN.md's tracker
// — his actual quiz questions are a stronger signal of what's graded than the book's own exercises.
//
// CH2_FACT_ITEMS — original definitional/informational questions, written from the same AcademiQ
// chapter text, covering exactly the concepts Trey's own Classnotes.md flagged as confusing:
// "review polyhatomic ions", "ionic vs molecular compo ---> imp in naming", "ate, ite, ade, etc."
//
// `noMath: true` was added 2026-09-08 for the no-math "walking mode" sub-test — see ch1Items.js's
// header for the full rationale and the test it applies. Tagging pass only: nothing reordered,
// reworded, or deleted.

/** @typedef {import('./ch1Items').Ch1Item} Ch2Item */

/** @type {Ch2Item[]} */
export const CH2_REAL_ITEMS = [
  // ---- 2-2 Early Ideas in Atomic Theory (law of definite/multiple proportions) ----
  {
    section: '2-2',
    stem: 'A compound has the formula X₂O. Analysis shows 0.126 g of X for every 1.00 g of O. What element is X (closest periodic-table atomic mass)?',
    choices: ['H', 'Li', 'Be', 'B'],
    correctIndex: 0,
    explanation: '(2X)/16.00 = 0.126 → X ≈ 1.008, which matches hydrogen.',
    provenance: "AcademiQ ch01-atoms-molecules-ions.md, 2-2 End of Section Exercises",
  },
  {
    section: '2-2',
    stem: 'A compound has the formula X₂O. A 9.60 g sample contains 7.12 g of X. What element is X (closest periodic-table atomic mass)?',
    choices: ['Na', 'Mg', 'Li', 'K'],
    correctIndex: 0,
    explanation: 'Mass of O = 9.60 − 7.12 = 2.48 g. Ratio X:O = 7.12:2.48 = 2.871. (2X)/16.00 = 2.871 → X ≈ 22.97, matching sodium.',
    provenance: 'AcademiQ ch02, 2-2 End of Section Exercises',
  },
  {
    section: '2-2',
    stem: 'A compound has the formula XCl. A 20.0 g sample contains 9.51 g of Cl. What element is X (closest periodic-table atomic mass)?',
    choices: ['Na', 'K', 'Li', 'Mg'],
    correctIndex: 1,
    explanation: 'Mass of X = 20.0 − 9.51 = 10.49 g. X:Cl ratio scaled against Cl\'s atomic mass (35.45) gives an atomic mass for X near 39.1 — potassium.',
    provenance: 'AcademiQ ch02, 2-2 End of Section Exercises',
  },
  {
    section: '2-2',
    stem: 'A compound has the formula X₂S. An 18.0 g sample contains 10.6 g of X. What element is X (closest periodic-table atomic mass)?',
    choices: ['K', 'Na', 'Li', 'Mg'],
    correctIndex: 1,
    explanation: 'Mass of S = 18.0 − 10.6 = 7.4 g. (2X)/32.06 ≈ 10.6/7.4 → X ≈ 22.97, matching sodium.',
    provenance: 'AcademiQ ch02, 2-2 End of Section Exercises',
  },
  {
    section: '2-2',
    stem: 'A compound has the formula X₂O₃. A 40.0 g sample contains 18.8 g of oxygen. What element is X (closest periodic-table atomic mass)?',
    choices: ['Al', 'Fe', 'Cr', 'B'],
    correctIndex: 0,
    explanation: 'Mass of X = 40.0 − 18.8 = 21.2 g. (2X)/(3×16.00) = 21.2/18.8 → X ≈ 27.0, matching aluminum.',
    provenance: 'AcademiQ ch02, 2-2 End of Section Exercises',
  },

  // ---- 2-3 Atomic Structure and Symbolism (protons/neutrons/electrons, isotopes, ions) ----
  {
    section: '2-3',
    stem: 'A species has mass number 56 and contains 24 electrons. If it has 26 protons, what is its isotope/ion symbol?',
    choices: ['⁵⁶Fe²⁺', '⁵⁶Fe²⁻', '⁵⁶Cr²⁺', '⁵⁶Fe⁰'],
    correctIndex: 0,
    explanation: '26 protons = iron. Charge = protons − electrons = 26 − 24 = 2+.',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'An ion contains 17 protons and 20 neutrons. It has a 1− charge. How many electrons does it contain, and what is its symbol?',
    choices: ['16 electrons; ³⁷Cl⁺', '17 electrons; ³⁷Cl⁻', '18 electrons; ³⁷Cl⁻', '18 electrons; ³⁷Ar⁻'],
    correctIndex: 2,
    explanation: '17 protons = chlorine, mass number = 17 + 20 = 37. Charge 1− means 1 more electron than protons: 17 + 1 = 18 electrons.',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'Which statement is always true for two isotopes of the same element?',
    choices: ['They have the same number of neutrons.', 'They have the same number of protons.', 'They have the same mass number.', 'They have the same number of electrons even when they are ions.'],
    correctIndex: 1,
    explanation: 'Isotopes of the same element share the same proton count (that\'s what makes them the same element) but differ in neutron count.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'Which change converts a neutral ³¹P atom into ³¹P³⁻?',
    choices: ['Gain 3 protons', 'Lose 3 electrons', 'Gain 3 electrons', 'Lose 3 neutrons'],
    correctIndex: 2,
    explanation: 'A more negative charge means MORE electrons than protons — gaining 3 electrons turns neutral P into P³⁻.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'A cation has atomic number 12 and has 10 electrons. What is its charge and symbol (mass number not specified)?',
    choices: ['2+; Mg²⁺', '2−; Mg²⁻', '2+; Na²⁺', '10+; Mg¹⁰⁺'],
    correctIndex: 0,
    explanation: 'Atomic number 12 = magnesium. Charge = 12 protons − 10 electrons = 2+.',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'A species is written as ⁸⁰Br⁻. How many protons, neutrons, and electrons does it have? (Atomic number of Br is 35.)',
    choices: ['35 p, 45 n, 34 e', '35 p, 45 n, 35 e', '35 p, 45 n, 36 e', '34 p, 46 n, 35 e'],
    correctIndex: 2,
    explanation: '35 protons (atomic number). Neutrons = 80 − 35 = 45. Charge 1− means 1 extra electron: 35 + 1 = 36.',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'An element X has two isotopes. 60.0% is ¹⁰X with mass 10.013 amu and 40.0% is ¹¹X with mass 11.009 amu. What is the average atomic mass?',
    choices: ['10.41 amu', '10.61 amu', '10.99 amu', '10.01 amu'],
    correctIndex: 0,
    explanation: '(0.600 × 10.013) + (0.400 × 11.009) = 6.008 + 4.404 = 10.41 amu.',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'Which statement best interprets an atomic mass of 63.55 amu for copper on the periodic table?',
    choices: ['Every Cu atom has a mass of exactly 63.55 amu.', 'A typical Cu atom has 63.55 protons.', 'The average Cu atom in nature has a mass of 63.55 amu due to a mixture of isotopes.', 'Copper atoms have 63.55 neutrons.'],
    correctIndex: 2,
    explanation: 'The periodic table lists a weighted AVERAGE across all naturally occurring isotopes — no single atom actually has that exact mass.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },
  {
    section: '2-3',
    stem: 'A sample of chlorine contains 75.77% ³⁵Cl (34.969 amu) and 24.23% ³⁷Cl (36.966 amu). What is the average atomic mass of chlorine (to two decimals)?',
    choices: ['35.45 amu', '35.97 amu', '36.52 amu', '35.00 amu'],
    correctIndex: 0,
    explanation: '(0.7577 × 34.969) + (0.2423 × 36.966) = 26.496 + 8.957 = 35.45 amu. (Re-keyed 2026-10-06: the earlier key, 35.49, does not follow from these numbers.)',
    provenance: 'AcademiQ ch02, 2-3 End of Section Exercises',
  },

  // ---- 2-4 Chemical Formulas (molecular vs empirical, subscripts vs coefficients) ----
  {
    section: '2-4',
    stem: 'Which statement best explains why O and O₂ represent different chemical species?',
    choices: ['O is an ion, while O₂ is neutral.', 'O is one oxygen atom, while O₂ is one molecule containing two bonded oxygen atoms.', 'O is always found alone in nature, while O₂ exists only in compounds.', 'O is an empirical formula, while O₂ is a structural formula.'],
    correctIndex: 1,
    explanation: 'A lone symbol means one atom; a subscript means that many atoms bonded together in one molecule.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'Which statement correctly distinguishes H₂ from 2H?',
    choices: ['H₂ represents two separate hydrogen atoms, while 2H represents one diatomic molecule.', 'H₂ represents one diatomic hydrogen molecule, while 2H represents two unbonded hydrogen atoms.', 'H₂ represents a hydrogen ion pair, while 2H represents neutral hydrogen.', 'H₂ and 2H are always chemically equivalent.'],
    correctIndex: 1,
    explanation: 'A SUBSCRIPT counts atoms bonded within one unit; a COEFFICIENT in front counts separate, unbonded units.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'Which list contains only elements that are commonly diatomic in their elemental form?',
    choices: ['H, O, N, C', 'F, Cl, Br, I', 'S, P, Ar, Ne', 'Na, Mg, Al, Si'],
    correctIndex: 1,
    explanation: 'The seven common diatomic elements are H₂, N₂, O₂, F₂, Cl₂, Br₂, and I₂ — the halogens (F, Cl, Br, I) are one clean subset of that list.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'A compound has molecular formula C₆H₁₂O₆. What is its empirical formula?',
    choices: ['C₆H₁₂O₆', 'C₃H₆O₃', 'CH₂O', 'C₂H₄O₂'],
    correctIndex: 2,
    explanation: 'Divide every subscript by their greatest common factor (6): 6:12:6 → 1:2:1 → CH₂O.',
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'Two compounds share the molecular formula C₂H₆O but differ in connectivity. What is the relationship between them?',
    choices: ['They are isotopes.', 'They are structural isomers.', 'They are the same compound because the formula matches.', 'They are ionic vs covalent forms of the same substance.'],
    correctIndex: 1,
    explanation: 'Same molecular formula, different arrangement of atoms = structural isomers (this exact formula gives both ethanol and dimethyl ether).',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'In the expression 4Mg(OH)₂, how many Mg atoms, how many O atoms, and how many H atoms are represented total?',
    choices: ['Mg = 4, O = 2, H = 2', 'Mg = 4, O = 4, H = 4', 'Mg = 4, O = 8, H = 8', 'Mg = 8, O = 4, H = 4'],
    correctIndex: 2,
    explanation: 'The parenthesis subscript (2) multiplies everything inside: 1 Mg + 2 O + 2 H per unit, ×4 coefficient = 4 Mg, 8 O, 8 H.',
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },
  {
    section: '2-4',
    stem: 'A compound has molecular formula C₈H₁₆O₄. What is its empirical formula?',
    choices: ['C₈H₁₆O₄', 'C₄H₈O₂', 'C₂H₄O', 'CH₂O'],
    correctIndex: 2,
    explanation: 'Divide 8:16:4 by their greatest common factor (4): 2:4:1 → C₂H₄O.',
    provenance: 'AcademiQ ch02, 2-4 End of Section Exercises',
  },

  // ---- 2-5 The Periodic Table (metal/nonmetal/metalloid, groups, families) ----
  {
    section: '2-5',
    stem: 'Which element is a metal and an inner transition metal?',
    choices: ['Br', 'Am', 'Rh', 'C'],
    correctIndex: 1,
    explanation: 'Americium (Am) sits in the actinide row at the bottom of the table — the inner transition metals.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-5 End of Section Exercises',
  },
  {
    section: '2-5',
    stem: 'Which element is a nonmetal and a representative (main-group) element?',
    choices: ['Au', 'U', 'S', 'Re'],
    correctIndex: 2,
    explanation: 'Sulfur (Group 16) is a nonmetal and a main-group element; Au, U, and Re are all metals.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-5 End of Section Exercises',
  },
  {
    section: '2-5',
    stem: 'An element is in the same period as selenium and is an alkaline earth metal. Which is it?',
    choices: ['Be', 'Mg', 'Ca', 'Sr'],
    correctIndex: 2,
    explanation: 'Selenium is in period 4; the Group 2 (alkaline earth) element in period 4 is calcium.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-5 End of Section Exercises',
  },
  {
    section: '2-5',
    stem: 'Which element is the halogen in the same period as lithium?',
    choices: ['Cl', 'Br', 'I', 'F'],
    correctIndex: 3,
    explanation: 'Lithium is period 2; the Group 17 (halogen) element in period 2 is fluorine.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-5 End of Section Exercises',
  },
  {
    section: '2-5',
    stem: 'Identify the isotope symbol for the alkali metal with 11 protons and mass number 23.',
    choices: ['¹¹₂₃Na', '²³₁₁Na', '²³₁₁Ne', '¹²₂₃Na'],
    correctIndex: 1,
    explanation: '11 protons = sodium (Na). Mass number (23) is the left superscript, atomic number (11) the left subscript.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-5 End of Section Exercises',
  },

  // ---- 2-6 Ionic and Molecular Compounds (monatomic/polyatomic ions, ionic vs covalent) ----
  {
    section: '2-6',
    stem: 'Which compound is ionic even though it contains no metal atoms?',
    choices: ['NH₄Br', 'SO₃', 'PCl₅', 'IBr'],
    correctIndex: 0,
    explanation: 'The ammonium ion (NH₄⁺) is a polyatomic cation made entirely of nonmetals, but it behaves like a metal cation — NH₄Br and (NH₄)₂SO₄ are both ionic despite having no metal.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
  {
    section: '2-6',
    stem: 'Which statement about ionic compound formulas is most accurate?',
    choices: ['They give the number of atoms in one molecule.', 'They show the simplest whole-number ratio of ions in the lattice.', 'They always match the empirical formula of the compound.', 'They are chosen to maximize the number of atoms shown.'],
    correctIndex: 1,
    explanation: "Ionic compounds aren't discrete molecules — the formula is a ratio of ions in the crystal lattice, so \"molecular formula\" doesn't really apply to them.",
    noMath: true,
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
  {
    section: '2-6',
    stem: 'Which pair will form a compound with formula Ca₃(PO₄)₂?',
    choices: ['Ca⁺ and PO₄³⁻', 'Ca²⁺ and PO₄³⁻', 'Ca³⁺ and PO₄²⁻', 'Ca²⁺ and PO₄²⁻'],
    correctIndex: 1,
    explanation: 'Charges must balance: 3×(2+) = 6+ balances 2×(3−) = 6−, giving the 3:2 ratio in the formula.',
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
  {
    section: '2-6',
    stem: 'Which formula is correct for the compound formed by Al³⁺ and O²⁻?',
    choices: ['AlO', 'AlO₂', 'Al₂O₃', 'Al₃O₂'],
    correctIndex: 2,
    explanation: 'Cross the charges as subscripts: Al gets subscript 2 (from O\'s charge), O gets subscript 3 (from Al\'s charge) → Al₂O₃.',
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
  {
    section: '2-6',
    stem: 'Which formula is correct for the compound formed by NH₄⁺ and PO₄³⁻?',
    choices: ['NH₄PO₄', '(NH₄)₂PO₄', '(NH₄)₃PO₄', '(NH₄)(PO₄)₃'],
    correctIndex: 2,
    explanation: 'Three 1+ ammonium ions are needed to balance one 3− phosphate ion: (NH₄)₃PO₄.',
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
  {
    section: '2-6',
    stem: 'Sodium oxalate has the formula Na₂C₂O₄ rather than the reduced form NaCO₂. Why?',
    choices: ['Ionic compounds never use empirical formulas.', 'The subscripts must reflect the actual polyatomic ion C₂O₄²⁻.', 'Sodium always forms 2+ ions.', 'Oxalate ions cannot exist in solids.'],
    correctIndex: 1,
    explanation: 'You can\'t reduce a polyatomic ion\'s own internal subscripts — C₂O₄²⁻ is one real, intact ion; splitting it into "CO₂" would misrepresent what the anion actually is.',
    noMath: true,
    provenance: 'AcademiQ ch02, 2-6 End of Section Exercises',
  },
];

// Provenance is stamped in below rather than repeated on every literal — see ch1Items.js's note.
/** @type {Ch2Item[]} */
const CH2_FACT_LITERALS = [
  // ---- 2-2 Early Ideas in Atomic Theory ----
  {
    section: '2-2',
    stem: "Dalton's atomic theory says atoms are neither created nor destroyed during a chemical change, only rearranged. Which everyday law does this directly explain?",
    choices: ['The law of conservation of mass', "Newton's third law", 'The ideal gas law', "Boyle's law"],
    correctIndex: 0,
    explanation: 'If atoms just rearrange rather than appear/disappear, then the total mass before and after a chemical change must stay the same — that IS the law of conservation of mass.',
    noMath: true,
  },
  {
    section: '2-2',
    stem: 'The law of definite proportions states that a pure compound…',
    choices: [
      'always contains the same elements in the same mass ratio, regardless of sample size',
      'can vary its elemental ratio depending on how it was made',
      'always contains exactly two elements',
      'has a mass ratio that changes proportionally with temperature',
    ],
    correctIndex: 0,
    explanation: 'A 10 g sample and a 40 g sample of the same pure compound always show the identical mass ratio of its elements — that fixed ratio is the whole point of the law.',
    noMath: true,
  },
  {
    section: '2-2',
    stem: 'The law of multiple proportions applies specifically to the case where…',
    choices: [
      'the same two elements form more than one compound with each other',
      'a single element reacts with itself',
      'a compound is heated until it decomposes',
      'two different compounds happen to have the same molar mass',
    ],
    correctIndex: 0,
    explanation: 'It compares two DIFFERENT compounds made from the same pair of elements (like CuCl and CuCl₂) and says the ratio of masses of the second element (per fixed mass of the first) reduces to small whole numbers.',
    noMath: true,
  },

  // ---- 2-3 Atomic Structure and Symbolism ----
  {
    section: '2-3',
    stem: 'Which subatomic particle contributes the most to an atom\'s VOLUME rather than its mass?',
    choices: ['Proton', 'Neutron', 'Electron', 'Nucleus (as a whole)'],
    correctIndex: 2,
    explanation: 'Electrons occupy almost all of an atom\'s volume (the electron cloud) while contributing almost nothing to its mass (~0.00055 amu) — the opposite is true of protons and neutrons, packed into the tiny, dense nucleus.',
    noMath: true,
  },
  {
    section: '2-3',
    stem: 'For a neutral atom, which equality must always hold?',
    choices: ['protons = neutrons', 'protons = electrons', 'neutrons = electrons', 'mass number = atomic number'],
    correctIndex: 1,
    explanation: 'Neutral means no net charge, which means equal numbers of positive protons and negative electrons — protons and neutrons are NOT required to be equal (that varies by isotope).',
    noMath: true,
  },
  {
    section: '2-3',
    stem: 'Two atoms are isotopes of the same element. What is guaranteed to be true?',
    choices: [
      'They have the same mass number',
      'They have the same number of protons but can differ in neutrons',
      'They have the same number of neutrons but can differ in protons',
      'They must have different chemical properties',
    ],
    correctIndex: 1,
    explanation: 'Same element means same proton count (that\'s what defines the element) — isotopes differ specifically in how many neutrons they carry, which changes the mass number but not the identity.',
    noMath: true,
  },
  {
    section: '2-3',
    stem: 'The atomic mass shown on the periodic table (e.g., chlorine = 35.45 amu) is best described as…',
    choices: [
      'the mass of the single most common isotope',
      'a weighted average over all naturally occurring isotopes, weighted by their abundance',
      'a simple unweighted average of every known isotope, including artificial ones',
      "the mass number of the atom's most stable isotope",
    ],
    correctIndex: 1,
    explanation: 'It\'s (fractional abundance × isotopic mass) summed over every naturally occurring isotope — which is exactly why no single chlorine atom actually weighs 35.45 amu.',
    noMath: true,
  },

  // ---- 2-4 Chemical Formulas ----
  {
    section: '2-4',
    stem: 'A molecular formula and an empirical formula for the same compound will be IDENTICAL exactly when…',
    choices: [
      'the compound is ionic',
      "the molecular formula's subscripts are already in lowest whole-number terms",
      'the compound contains only two elements',
      'the compound has an even number of atoms',
    ],
    correctIndex: 1,
    explanation: 'The empirical formula is always the molecular formula reduced to its simplest ratio — if the molecular formula can\'t be reduced further (like H₂O, already 2:1 with no common factor), the two are the same.',
    noMath: true,
  },
  {
    section: '2-4',
    stem: 'Benzene has molecular formula C₆H₆ and empirical formula CH. What does this tell you about a real benzene molecule?',
    choices: [
      'It actually contains only 1 carbon and 1 hydrogen atom',
      'It contains 6 carbon and 6 hydrogen atoms — 6 times the empirical ratio',
      'The empirical formula is wrong for benzene',
      'Benzene must be an ionic compound',
    ],
    correctIndex: 1,
    explanation: 'The molecular formula gives the ACTUAL count of atoms in one real molecule; the empirical formula only gives the simplest ratio (1:1 here) — benzene is 6× that ratio.',
    noMath: true,
  },
  {
    section: '2-4',
    stem: 'Structural isomers are compounds that share the same…',
    choices: [
      'molecular formula, but differ in how their atoms are connected',
      'empirical formula, but differ in molecular formula',
      'physical properties, but differ in chemical formula',
      'atomic number, but differ in mass number',
    ],
    correctIndex: 0,
    explanation: 'Acetic acid and methyl formate are the classic example: both C₂H₄O₂, completely different connectivity, completely different properties.',
    noMath: true,
  },

  // ---- 2-5 The Periodic Table ----
  {
    section: '2-5',
    stem: 'Which group of elements is often called "the noble gases," and what property makes them chemically important reference points?',
    choices: [
      'Group 1 — they are extremely reactive metals',
      'Group 17 — they readily gain one electron',
      'Group 18 — they have a stable, filled valence-electron configuration (an octet, or 2 for helium)',
      'Group 2 — they commonly form 2+ ions',
    ],
    correctIndex: 2,
    explanation: 'The noble gases\' filled valence shells make them the "target" configuration other main-group atoms gain or lose electrons to reach — that\'s exactly why periodic-table position predicts common ion charges.',
    noMath: true,
  },
  {
    section: '2-5',
    stem: 'Which statement correctly distinguishes a metalloid from a metal and a nonmetal?',
    choices: [
      'A metalloid is always radioactive',
      'A metalloid has intermediate properties — it conducts moderately well and shows a mix of metal/nonmetal character',
      'A metalloid is any element in Group 1',
      'A metalloid is a synonym for "transition metal"',
    ],
    correctIndex: 1,
    explanation: 'Metals are shiny/conductive, nonmetals are dull/poor conductors, and metalloids (like silicon, boron, arsenic) sit in between — moderate conductivity, mixed properties.',
    noMath: true,
  },
  {
    section: '2-5',
    stem: 'For representative (main-group) elements specifically, why is periodic-table position such a reliable predictor of common ion charge?',
    choices: [
      'Because all representative elements have the same charge',
      "Because their valence electrons sit in s and p orbitals, and their common ions correspond to simple counts (reaching 2 or 8, a noble-gas configuration)",
      'Because representative elements never form ions',
      'Because their atomic mass equals their group number',
    ],
    correctIndex: 1,
    explanation: 'This reliability breaks down for transition metals precisely because it doesn\'t hold there — iron, copper, chromium, and manganese all commonly form MULTIPLE different ion charges, unlike a clean Group 1/2/13/15/16/17 element.',
    noMath: true,
  },

  // ---- 2-6 Ionic and Molecular Compounds ----
  {
    section: '2-6',
    stem: 'What is a polyatomic ion?',
    choices: [
      'An ion formed from a single atom that has lost or gained electrons',
      'A group of two or more bonded atoms that together carry an overall electric charge',
      'Any ion with a charge greater than 2',
      'A neutral molecule with an unusually large number of atoms',
    ],
    correctIndex: 1,
    explanation: 'A polyatomic ion (like SO₄²⁻ or NH₄⁺) acts as ONE charged unit in a formula, even though it\'s made of multiple bonded atoms — this is exactly the concept flagged as needing review.',
    noMath: true,
  },
  {
    section: '2-6',
    stem: 'An oxyanion is specifically a polyatomic ion that…',
    choices: ['contains one or more oxygen atoms', 'has a charge of exactly 2−', 'is always paired with a metal', 'contains no hydrogen'],
    correctIndex: 0,
    explanation: 'Sulfate (SO₄²⁻), carbonate (CO₃²⁻), and nitrate (NO₃⁻) are all oxyanions — the "oxy" names the oxygen content, not the charge or what it\'s paired with.',
    noMath: true,
  },
  {
    section: '2-6',
    stem: 'The quickest reliable clue that a compound is likely IONIC (with one important named exception) is…',
    choices: [
      'the compound contains only nonmetals',
      'the compound contains a metal',
      'the compound has an odd number of atoms',
      'the compound is a gas at room temperature',
    ],
    correctIndex: 1,
    explanation: 'Metal + nonmetal is the standard ionic shortcut. The one major exception: NH₄⁺ (ammonium) is built entirely from nonmetals but still behaves like a metal cation, making compounds like NH₄Br ionic anyway.',
    noMath: true,
  },
  {
    section: '2-6',
    stem: 'Why does an ionic compound\'s formula show a ratio of ions rather than the makeup of one discrete "molecule"?',
    choices: [
      'Because ionic compounds don\'t actually exist',
      'Because ionic compounds form a 3D crystal lattice of alternating ions, not individual bonded molecules',
      'Because ionic compounds are always gases',
      'Because ionic formulas are simply written wrong by convention',
    ],
    correctIndex: 1,
    explanation: 'There\'s no single "one NaCl molecule" sitting by itself — a salt crystal is ions in a repeating 3D lattice, held together by electrostatic attraction, so the formula reports the ratio (1 Na⁺ : 1 Cl⁻) rather than a molecule\'s atom count.',
    noMath: true,
  },
  {
    section: '2-6',
    stem: 'Why do ionic compounds conduct electricity when MOLTEN or dissolved, but NOT when solid?',
    choices: [
      'Because heating destroys the ions',
      'Because the ions can move freely once the rigid lattice breaks apart, but are locked in place in the solid',
      'Because molten compounds are actually covalent',
      'Because dissolving always creates new ions that weren\'t there before',
    ],
    correctIndex: 1,
    explanation: 'Conductivity needs charge carriers that can MOVE. In a solid lattice, ions are locked in fixed positions; melting or dissolving frees them to move and carry current.',
    noMath: true,
  },

  // ---- 2-7 Chemical Nomenclature (the section Trey's own notes flagged directly) ----
  {
    section: '2-7',
    stem: 'For a binary ionic compound with a monatomic anion (e.g., NaCl), how is the anion\'s name formed?',
    choices: [
      'Add the prefix "bi-" to the element name',
      'Take the nonmetal element name and replace its ending with the suffix "-ide"',
      'Add "-ate" to the element name',
      'Use the element\'s symbol followed by "-ion"',
    ],
    correctIndex: 1,
    explanation: 'Chlorine → chlorIDE, oxygen → oxIDE, nitrogen → nitrIDE. Cation name stays as-is (sodium), anion gets the "-ide" swap.',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'FeCl₂ and FeCl₃ have DIFFERENT names (iron(II) chloride vs. iron(III) chloride) rather than both being called "iron chloride." Why?',
    choices: [
      'Because chlorine can have two different charges',
      "Because iron is a metal that commonly forms MORE THAN ONE cation charge, so the Roman numeral names which charge is present in that specific compound",
      "Because it's simply a spelling convention with no chemical meaning",
      'Because FeCl₂ is ionic and FeCl₃ is covalent',
    ],
    correctIndex: 1,
    explanation: 'Transition metals (and some other metals) often form multiple stable cations — the Roman numeral is determined by charge-balancing against the known anion charge, and it\'s required precisely because "iron chloride" alone is ambiguous.',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'Which pair of suffixes is used to distinguish two related polyatomic oxyanions of the same element, where one has MORE oxygen atoms than the other (e.g., sulfate SO₄²⁻ vs. sulfite SO₃²⁻)?',
    choices: ['-ic and -ous (for acids only)', '-ate (more O) and -ite (fewer O)', '-ide and -ic', '-hydrate and -anhydrate'],
    correctIndex: 1,
    explanation: 'This is exactly the "ate, ite" distinction to memorize: the "-ate" ion has one more oxygen atom than the corresponding "-ite" ion of the same element (sulfATE has 4 O, sulfITE has 3 O) — same central atom, same overall charge, different oxygen count.',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'When naming an OXYACID (an acid containing oxygen, formed by dissolving a hydrogen + polyatomic-oxyanion compound in water), the anion\'s "-ate" ending becomes…',
    choices: ['"-ate acid," unchanged', '"-ic acid"', '"-ide acid"', '"-ous acid," always'],
    correctIndex: 1,
    explanation: 'The rule: drop "hydrogen," take the anion\'s root, swap "-ate" → "-ic" (or "-ite" → "-ous"), and add "acid." Carbonate (CO₃²⁻) → carbonIC acid (H₂CO₃).',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'A BINARY acid (just hydrogen + one other nonmetal, e.g., HCl dissolved in water) is named differently from an oxyacid. What\'s the rule?',
    choices: [
      '"hydrogen" becomes the prefix "hydro-", the other element gets the suffix "-ic", then the word "acid" — e.g. HCl → hydrochloric acid',
      'The compound keeps its molecular name and just adds "(aq)"',
      'Binary acids use the same "-ate/-ic" rule as oxyacids',
      'Binary acids are never actually called acids',
    ],
    correctIndex: 0,
    explanation: 'No oxygen means no "-ate/-ite" swap is even possible — binary acids get their own simpler rule: hydro- + element root + -ic + "acid."',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'For a MOLECULAR (covalent) compound made of two nonmetals — like N₂O₃ — how do Greek numerical prefixes get used in the name?',
    choices: [
      'They\'re never used for molecular compounds, only ionic ones',
      'A prefix (mono-, di-, tri-, tetra-, …) states how many atoms of EACH element are present, since covalent compounds don\'t have a fixed ratio the way ionic ones do',
      'They indicate the compound\'s overall charge',
      'They\'re only used for the second element, never the first',
    ],
    correctIndex: 1,
    explanation: 'CO and CO₂ both exist — an ionic-style "carbon oxide" name would be ambiguous, so covalent names spell out exact counts: dinitrogen trioxide (N₂O₃) leaves no doubt it\'s 2 N and 3 O, unlike an ionic name which never needs prefixes because charge-balancing already fixes the ratio.',
    noMath: true,
  },
  {
    section: '2-7',
    stem: 'An "ionic hydrate" like CuSO₄·5H₂O has water molecules built into its crystal in a fixed ratio. What does the Greek prefix in its name ("pentahydrate") tell you?',
    choices: [
      'The compound is 5% water by mass',
      'There are exactly 5 water molecules per formula unit of the anhydrous compound',
      'The compound must be heated 5 times to remove all water',
      'The compound has 5 different possible hydrate forms',
    ],
    correctIndex: 1,
    explanation: '"Penta-" = 5, so pentahydrate means 5 H₂O molecules are part of the crystal structure for every one formula unit of CuSO₄ — a fixed, countable ratio, not a vague description.',
    noMath: true,
  },
];

/** @type {Ch2Item[]} */
export const CH2_FACT_ITEMS = CH2_FACT_LITERALS.map((item) => ({
  ...item,
  provenance:
    item.provenance ??
    `Written by agent from the assigned reading — AcademiQ ch02-atoms-molecules-and-ions.md §${item.section}, cross-checked against OpenStax Chemistry 2e Ch2. Not a real quiz question.`,
}));

/** Every Chapter 2 item — real (textbook exercises) + fact pools combined. */
export const CH2_ALL_ITEMS = [...CH2_REAL_ITEMS, ...CH2_FACT_ITEMS];
