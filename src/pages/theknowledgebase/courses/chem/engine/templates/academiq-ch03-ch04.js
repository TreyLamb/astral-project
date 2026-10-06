// Exam 2 (course chapters 1-4) - built 2026-10-06, the night before the exam.
//
// Two halves:
//
// 1. BOOK BANKS - the "Additional Exercises" that close every section of AcademiQ chapters 3 and
//    4 (`SupplementalCourseDocs/CHEM 1210/_academiq/ch03-*.md`, `ch04-*.md`). His instructor
//    writes the midterms against this book, so its own multiple-choice items are the closest
//    thing to the exam's voice that exists. Quoted as written - required for course material
//    (theknowledgebase/CLAUDE.md scope note).
//
//    🔴 THE BOOK'S ANSWER KEYS ARE UNRELIABLE IN CHAPTERS 3-4. Every numeric item was recomputed
//    (atomic masses C 12.01, H 1.008, O 16.00, N 14.01, ...). Found:
//      - 17 items whose printed key names the WRONG option (a correct option exists):
//        3-3 #9 · 3-4 #10 #18 #20 · 4-4 #1 #2 #4 #8 #10 #12 #13 #14 · 4-5 #14 · 4-6 #2 #4 #6 #8
//      - 7 items with NO correct option at all: 4-2 #4 (the equation it calls unbalanced is
//        balanced) · 4-4 #3 #5 #9 #15 · 4-5 #3 #13
//      - 1 item with TWO correct options: 3-4 #11 (0.00375 mol and 3.75 × 10⁻³ mol)
//    Each wrong-key item carries `fix` (what the book prints) and its explanation says so, so a
//    student who studied from the book sees the conflict instead of silently "losing" a point.
//    No-correct-option items are repaired with the true value, and their distractors are rebuilt
//    from named error modes. 4-2 #4 is dropped - there is nothing to repair it into.
//    Do NOT "restore" a book key from this header without recomputing it.
//
// 2. GENERATED TEMPLATES for the Ch 3-4 skills nothing in the bank could ask before tonight:
//    percent composition, empirical formula from percent data, molecular formula from the
//    empirical formula, percent yield, titration, gravimetric analysis, acid-base neutralization.
//
// Section facts that drove the tagging (read from the book, not assumed):
//   - §4-3 "Some Chemical Reactions" is precipitation + acid-base ONLY. Redox is §5-2 in this
//     book, so the two oxidation-number templates were moved out of 4-3 (ch05-solutions-aqueous-1).
//   - §4-6 "Titrations and Combustion Analysis" teaches titration, gravimetric analysis AND
//     combustion analysis. ⚠ An earlier pass of this header (same day) said there was no
//     combustion content: the subsection has no heading of its own, so a heading-only scan missed
//     it. It has two worked examples (polyethylene -> CH2, polystyrene -> CH) and is generated
//     below. Scan section BODIES, not just headings, before declaring a topic absent.
//   - §4-2's ionic-equation items are tagged 4-3: `net-ionic-equations` belongs to the ACS
//     chapter 4-3 points at, and the Exam 2 scope includes both sections anyway.

import { registerChemTemplate } from '../generator.js';

const CH3 = 'chem1-03-mole-calculations';
const CH4 = 'chem1-04-stoichiometry';
const CH5 = 'chem1-05-solutions-aqueous-1';

// --- helpers -----------------------------------------------------------------

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => (n === 1 ? '' : String(n).split('').map((d) => SUB[+d]).join(''));
const formula = (parts) => parts.map(([el, n]) => `${el}${sub(n)}`).join('');
// A displayed measurement keeps its trailing zeros (0.00900 g, not 0.009 g) — a JS number drops
// them, which on a sig-fig-heavy course teaches the wrong habit. Strings for display, numbers for math.
const sf3 = (x) => x.toPrecision(3);
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (x, digits = 2) => {
  const [m, e] = x.toExponential(digits).split('e');
  return `${m} × 10${String(Number(e)).split('').map((ch) => SUPS[ch]).join('')}`;
};
const sf4 = (x) => x.toPrecision(4);
const pct = (x) => `${x >= 100 ? x.toFixed(0) : x.toFixed(1)}%`;

const AM = {
  H: 1.008, C: 12.01, N: 14.01, O: 16.00, Na: 22.99, Mg: 24.31, Al: 26.98, P: 30.97, S: 32.06,
  Cl: 35.45, K: 39.10, Ca: 40.08, Fe: 55.85, Cu: 63.55, Ba: 137.33, Ag: 107.87, Si: 28.09,
};
const mm = (x) => x.toFixed(2);
const massOf = (parts) => parts.reduce((s, [el, n]) => s + AM[el] * n, 0);

function bookBank({ id, chapterId, section, band, mental, name, concepts, items }) {
  registerChemTemplate({
    id, chapterId, section, band, mental, name, concepts,
    generate: (rng, h) => {
      const it = h.pick(items);
      const src = `AcademiQ §${section}${it.sec ? ` (book §${it.sec})` : ''}, Additional Exercise ${it.n}`;
      const fix = it.fix
        ? ` ⚠ The book's printed answer key says "${it.fix}". That key is WRONG; recomputed, the answer is ${it.a}.`
        : '';
      return {
        stem: it.q,
        ...h.choices(it.a, it.w),
        explanation: `${it.x ?? `Answer: ${it.a}.`}${fix} (${src}.)`,
      };
    },
  });
}

// =============================================================================
// 1. BOOK BANKS
// =============================================================================

bookBank({
  id: 'chem1-aq-03-2-concepts',
  chapterId: CH3, section: '3-2', band: 1, mental: true,
  name: '§3-2 book exercises: formula mass and the mole (concepts)',
  concepts: ['mole-definition', 'molar-mass-calculation', 'average-atomic-mass-lookup'],
  items: [
    { n: 1, q: 'Which statement best explains why carbon-12 is used as the reference for atomic masses?', a: 'Carbon-12 was assigned a mass of exactly 12 amu, providing a convenient standard for relative atomic masses.', w: ['Carbon-12 is the most abundant isotope of all elements.', 'Carbon-12 always has exactly 12 protons and 12 neutrons, so its mass is exactly 24 amu.', 'Carbon-12 atoms can be weighed directly in the laboratory.'] },
    { n: 2, q: 'The periodic table value labeled "atomic mass" for chlorine (35.45) is best described as:', a: 'The average mass of naturally occurring chlorine atoms, relative to the carbon-12 standard.', w: ['The mass of one chlorine atom in grams.', 'The mass number of the most common chlorine isotope.', 'The number of neutrons in a chlorine atom.'] },
    { n: 3, q: 'A covalent compound has formula C₉H₈O₄. Its formula mass (molecular mass) is found by:', a: 'Adding the masses of 9 C atoms, 8 H atoms, and 4 O atoms using their average atomic masses.', w: ["Adding 9, 8, and 4 to get 21 amu, then multiplying by Avogadro's number.", 'Dividing the molar mass by Avogadro\'s number to get amu.', 'Using only the mass of carbon-12 because it is the standard.'] },
    { n: 4, q: 'Which statement correctly distinguishes "molecular mass" from "formula mass"?', a: 'Molecular mass refers to a molecule; formula mass refers to the atoms listed in a formula unit (especially for ionic compounds).', w: ['Molecular mass is used for ionic compounds; formula mass is used for covalent compounds.', 'Molecular mass is measured in g/mol; formula mass is measured only in grams.', 'Molecular mass always equals 12 amu times the number of atoms present.'] },
    { n: 5, q: 'Which expression correctly represents the mole concept?', a: '1 mol = 6.022 × 10²³ entities (atoms, molecules, ions, or formula units).', w: ['1 mol = mass of a substance in grams equal to its atomic number.', '1 mol = 6.022 × 10²³ grams.', '1 mol = 12.000 entities by definition of carbon-12.'] },
    { n: 7, q: 'A student writes: "The mass of one NaCl molecule is 58.44 amu." The best correction is:', a: 'NaCl does not exist as molecules; 58.44 amu is the formula mass per formula unit.', w: ['The mass of one NaCl molecule is 58.44 g.', '58.44 amu is the molar mass of NaCl.', '58.44 amu is the atomic mass of sodium.'] },
    { n: 8, q: 'Aluminum sulfate is Al₂(SO₄)₃. For a formula-mass calculation, rewriting it as Al₂S₃O₁₂ is helpful because it:', a: 'makes the total count of each type of atom explicit without changing the composition.', w: ['changes the compound to a covalent molecule.', 'removes charges so the mass becomes measurable.', 'accounts for isotopes by listing atoms separately.'] },
    { n: 10, q: 'Which statement correctly connects amu and g/mol?', a: "A particle's mass in amu is numerically equal to the mass of 1 mol of those particles in grams.", w: ["A particle's mass in amu equals its molar mass in kilograms per mole.", "A particle's mass in grams equals its molar mass in amu per mole.", 'The amu-to-gram conversion depends on temperature.'] },
    { n: 12, q: 'Which conversion uses molar mass as a conversion factor correctly (to convert grams to moles)?', a: 'g ÷ (g/mol)', w: ['g × (g/mol)', 'g ÷ (mol/g)', 'g × 6.022 × 10²³'], x: 'Dividing grams by g/mol cancels grams and leaves mol. (Multiplying by mol/g is the same thing; the book lists that form as a separate option, so it is left out here to keep one correct choice.)' },
    { n: 13, q: 'A student claims: "Because carbon-12 is exactly 12 amu, 1 mol of natural carbon has a mass of exactly 12 g." The best response is:', a: 'False; only carbon-12 has exactly 12 g/mol, while natural carbon is an isotopic mixture with an average molar mass slightly above 12 g/mol.', w: ['True; the mole is defined so that carbon is always exactly 12 g/mol.', 'True; isotopes do not affect molar mass.', 'False; the mole is defined as the mass of 1 atom in grams.'] },
  ],
});

bookBank({
  id: 'chem1-aq-03-2-calc',
  chapterId: CH3, section: '3-2', band: 2, mental: false,
  name: '§3-2 book exercises: molar mass and mole calculations',
  concepts: ['molar-mass-calculation', 'avogadros-number', 'moles-to-mass-conversion', 'mole-ratios-from-formula'],
  items: [
    { n: 6, q: 'Ibuprofen has formula C₁₃H₁₈O₂. How many moles of atoms are present in 1.00 mol of ibuprofen molecules?', a: '33.0 mol atoms', w: ['13.0 mol atoms', '18.0 mol atoms', '2.00 mol atoms'], x: '13 + 18 + 2 = 33 atoms per molecule, so 33.0 mol of atoms per mole of molecules.' },
    { n: 9, q: 'Using C = 12.01, H = 1.008, N = 14.01 and O = 16.00, the molar mass of acetaminophen (C₈H₉NO₂) is closest to:', a: '151.16 g/mol', w: ['121.13 g/mol', '135.16 g/mol', '149.19 g/mol'], x: '8(12.01) + 9(1.008) + 14.01 + 2(16.00) = 96.08 + 9.072 + 14.01 + 32.00 = 151.16 g/mol.' },
    { n: 11, q: 'A sample contains 1.204 × 10²⁴ molecules of aspirin. How many moles of aspirin is this (use 6.022 × 10²³ mol⁻¹)?', a: '2.00 mol', w: ['0.200 mol', '20.0 mol', '0.500 mol'], x: '1.204 × 10²⁴ ÷ 6.022 × 10²³ = 2.00 mol.' },
    { n: 14, q: 'Chloroform is CHCl₃. How many chlorine atoms are present in a sample containing 0.750 mol of CHCl₃ molecules?', a: '2.25 mol Cl atoms', w: ['0.250 mol Cl atoms', '0.750 mol Cl atoms', '4.52 × 10²³ Cl atoms'], x: '3 Cl per molecule: 0.750 × 3 = 2.25 mol Cl. (4.52 × 10²³ is 0.750 mol counted as particles, forgetting the 3.)' },
    { n: 15, q: 'The formula mass of Ca₃(PO₄)₂ is 310.18 amu. The mass of 2.50 mol of Ca₃(PO₄)₂ is closest to:', a: '775 g', w: ['124 g', '310 g', '7.75 × 10⁵ g'], x: '2.50 mol × 310.18 g/mol = 775 g. (124 g is dividing instead of multiplying.)' },
  ],
});

bookBank({
  id: 'chem1-aq-03-3-book',
  chapterId: CH3, section: '3-3', band: 2, mental: false,
  name: '§3-3 book exercises: percent composition, empirical and molecular formulas',
  concepts: ['percent-composition', 'empirical-formula-atomic-ratios', 'molecular-formula-from-empirical'],
  items: [
    { n: 1, q: 'A sample contains 2.50 g H and 7.50 g C (total mass 10.00 g). What is the percent composition by mass?', a: '25.0% H, 75.0% C', w: ['75.0% H, 25.0% C', '2.50% H, 7.50% C', '10.0% H, 90.0% C'] },
    { n: 2, q: 'A 12.04-g sample contains 7.34 g C, 1.85 g H, and 2.85 g N. Which set of percent compositions matches these data?', a: '61.0% C, 15.4% H, 23.7% N', w: ['61.0% C, 23.7% H, 15.4% N', '49.5% C, 25.0% H, 25.5% N', '15.4% C, 61.0% H, 23.7% N'] },
    { n: 3, q: 'A compound contains 1.71 g C and 0.287 g H. After converting to moles, you obtain 0.142 mol C and 0.284 mol H. What empirical formula follows?', a: 'CH₂', w: ['C₂H', 'CH₄', 'C₂H₄'], x: '0.284 / 0.142 = 2, so C:H = 1:2 → CH₂. (C₂H₄ has the same ratio but is not the SIMPLEST one.)' },
    { n: 4, q: 'A compound contains 5.31 g Cl and 8.40 g O. Converting to moles gives 0.150 mol Cl and 0.525 mol O. What empirical formula follows?', a: 'Cl₂O₇', w: ['ClO₃', 'ClO₄', 'Cl₂O₃'], x: '0.525 / 0.150 = 3.5, so Cl:O = 1:3.5. A ratio ending in .5 is doubled, not rounded: 2:7 → Cl₂O₇.' },
    { n: 5, q: 'A compound contains 0.130 g N and 0.370 g O. Which empirical formula matches these masses?', a: 'N₂O₅', w: ['NO₂', 'N₂O₃', 'NO'], x: '0.130/14.01 = 0.00928 mol N; 0.370/16.00 = 0.0231 mol O; ratio 1 : 2.49 ≈ 1 : 2.5 → double → N₂O₅.' },
    { n: 6, q: 'A compound has empirical formula mass 81.13 g/mol per formula unit and molar mass 162.3 g/mol. What is the integer multiplier n relating molecular formula to empirical formula?', a: '2', w: ['1', '3', '4'], x: '162.3 / 81.13 = 2.00.' },
    { n: 7, q: 'A compound has empirical formula C₅H₇N and molar mass 162.3 g/mol. What is its molecular formula?', a: 'C₁₀H₁₄N₂', w: ['C₅H₇N', 'C₂₅H₃₅N₅', 'C₁₅H₂₁N₃'], x: 'C₅H₇N = 81.1 g/mol; 162.3 / 81.1 = 2 → double every subscript: C₁₀H₁₄N₂.' },
    { n: 8, q: 'A compound has percent composition 40.0% C, 6.7% H, and 53.3% O by mass. The empirical formula is CH₂O. If its molar mass is 180 g/mol, what is the molecular formula?', a: 'C₆H₁₂O₆', w: ['C₃H₆O₃', 'C₂H₄O₂', 'C₁₂H₂₄O₁₂'], x: 'CH₂O = 30.0 g/mol; 180 / 30.0 = 6 → C₆H₁₂O₆.' },
    { n: 9, fix: 'CH₂O', q: 'After converting element masses to moles for an unknown compound, you obtain: C = 0.250 mol, H = 0.500 mol, O = 0.125 mol. What empirical formula follows?', a: 'C₂H₄O', w: ['CH₂O', 'C₄H₈O₂', 'C₂H₄O₂'], x: 'Divide by the smallest (0.125): C 2, H 4, O 1 → C₂H₄O. CH₂O would need C and O in equal amounts, but there is twice as much C as O.' },
    { n: 10, q: 'In empirical-formula determination, you divide each element\'s mole amount by the smallest mole amount because:', a: 'it yields the simplest whole-number ratio of atoms', w: ['it converts grams directly to atoms', 'it forces the total number of moles to equal 1.00', 'it eliminates the need to use molar mass'] },
  ],
});

bookBank({
  id: 'chem1-aq-03-4-concepts',
  chapterId: CH5, section: '3-4', band: 1, mental: true,
  name: '§3-4 book exercises: what molarity means',
  concepts: ['molar-concentration-definition', 'dilution-calculations'],
  items: [
    { n: 2, q: 'A 355 mL beverage contains 0.133 mol sucrose. Which expression correctly gives the molarity?', a: '(0.133 mol)/(0.355 L)', w: ['(0.133 mol)/(355 mL)', '(355 mL)/(0.133 mol)', '(0.355 L)/(0.133 mol)'] },
    { n: 5, q: 'A student writes "0.25 M = 0.25 mol/mL." What is the correct interpretation of 0.25 M?', a: '0.25 mol per L of solution', w: ['0.25 mol per mL of solution', '0.25 g per L of solution', '0.25 g per mL of solution'] },
    { n: 6, q: 'A solution label reads "2.0 g/L NaCl." Which additional information is needed to convert this to molarity?', a: 'The molar mass of NaCl', w: ['The density of the solution', 'The temperature of the solution', 'The identity of the solvent'] },
    { n: 8, q: 'Which statement best describes a solution (as used in this section)?', a: 'A homogeneous mixture with uniform composition throughout', w: ['A mixture that can settle into layers over time', 'Any mixture containing water', 'A mixture whose components are always in equal amounts'] },
    { n: 14, q: 'Which change will decrease molarity, assuming no solute is added or removed?', a: 'Add solvent to increase total volume', w: ['Remove some solvent by evaporation', 'Add more solute and stir', 'Freeze part of the solution so volume decreases'] },
    { n: 19, q: 'Which quantity must remain unchanged during an ideal dilution (adding only solvent)?', a: 'Moles of solute', w: ['Volume of solution', 'Molarity of solution', 'Density of solution'] },
  ],
});

bookBank({
  id: 'chem1-aq-03-4-calc',
  chapterId: CH5, section: '3-4', band: 2, mental: false,
  name: '§3-4 book exercises: molarity and dilution calculations',
  concepts: ['molar-concentration-definition', 'molarity-from-mass', 'dilution-calculations'],
  items: [
    { n: 1, q: 'A solution is prepared by dissolving 0.180 mol of solute in enough water to make 150.0 mL of solution. What is the molarity?', a: '1.20 M', w: ['0.833 M', '0.270 M', '0.120 M'], x: '0.180 mol / 0.1500 L = 1.20 M.' },
    { n: 3, q: 'How many moles of solute are present in 18.0 mL of a 0.375 M solution?', a: '6.75 × 10⁻³ mol', w: ['6.75 × 10⁻² mol', '4.80 × 10⁻³ mol', '1.50 × 10⁻³ mol'], x: '0.375 mol/L × 0.0180 L = 6.75 × 10⁻³ mol.' },
    { n: 4, q: 'Which solution has the higher molarity?', a: '0.0400 mol solute in 50.0 mL solution', w: ['0.0500 mol solute in 100.0 mL solution', '0.0600 mol solute in 150.0 mL solution', '0.0900 mol solute in 250.0 mL solution'], x: '0.800 M vs 0.500, 0.400 and 0.360 M.' },
    { n: 7, q: 'A reaction requires a 1:1 mole ratio: A + B → C. Two solutions each contain 1.00 g of solute per mL, but M(A) = 40.0 g/mol and M(B) = 80.0 g/mol. To mix equal moles of A and B, what volume ratio V(A):V(B) should you use?', a: '1:2', w: ['1:1', '2:1', '4:1'], x: 'B is twice as heavy per mole, so each mL of B holds half as many moles: you need twice the volume of B.' },
    { n: 9, q: 'A student dissolves 0.0100 mol sucrose in a final solution volume of 200.0 mL. What is the molarity?', a: '0.0500 M', w: ['0.00200 M', '0.0200 M', '0.200 M'] },
    { n: 10, fix: '0.0250 M', q: 'A solution contains 0.0500 mol solute in 500.0 mL. If it is diluted to 1.000 L, what is the final molarity?', a: '0.0500 M', w: ['0.200 M', '0.100 M', '0.0250 M'], x: 'Moles stay 0.0500 mol; the final volume is 1.000 L, so 0.0500 mol / 1.000 L = 0.0500 M. (0.0250 M halves the concentration twice: once for the doubling and again by mistake.)' },
    { n: 11, q: 'How many moles of solute are in a 10.0 mL sample of a 0.375 M solution?', a: '3.75 × 10⁻³ mol', w: ['3.75 mol', '3.75 × 10⁻⁴ mol', '0.0375 mol'], x: '0.375 mol/L × 0.0100 L = 3.75 × 10⁻³ mol. (The book lists this answer twice, as 0.00375 and 3.75 × 10⁻³; one copy was replaced with the forgot-to-convert-mL error, 3.75 mol.)' },
    { n: 12, q: 'A student prepares 250.0 mL of 0.120 M solution from a 1.50 M stock. What volume of stock is needed?', a: '20.0 mL', w: ['12.0 mL', '18.0 mL', '30.0 mL'], x: 'M₁V₁ = M₂V₂ → V₁ = (0.120)(250.0) / 1.50 = 20.0 mL.' },
    { n: 13, q: 'A solution is made by dissolving 5.85 g NaCl (58.44 g/mol) to make 200.0 mL of solution. What is the molarity?', a: '0.500 M', w: ['0.0500 M', '0.0850 M', '0.250 M'], x: '5.85 / 58.44 = 0.100 mol; 0.100 / 0.2000 L = 0.500 M.' },
    { n: 15, q: 'A solution has molarity 0.600 M. What volume (in mL) contains 0.0150 mol solute?', a: '25.0 mL', w: ['9.00 mL', '15.0 mL', '40.0 mL'], x: '0.0150 / 0.600 = 0.0250 L = 25.0 mL.' },
    { n: 16, q: 'A student reports the molarity of a solution as 0.3 M based on 0.133 mol in 0.355 L. Which is the best critique?', a: 'It should be 0.375 M; rounding to 0.3 M is too aggressive', w: ['It should be 0.0375 M, not 0.3 M', 'It should be 3.75 M, not 0.3 M', 'It should be 0.355 M because liters are in the denominator'] },
    { n: 17, q: 'A solution is diluted from 75.0 mL to 300.0 mL. If the initial concentration was 0.800 M, what is the final concentration?', a: '0.200 M', w: ['0.267 M', '0.400 M', '3.20 M'] },
    { n: 18, fix: '0.0833 M', q: 'A student mixes 100.0 mL of 0.200 M NaCl with 200.0 mL of 0.0500 M NaCl (assume volumes add). What is the final molarity of NaCl?', a: '0.100 M', w: ['0.0833 M', '0.150 M', '0.250 M'], x: 'Total moles: 0.0200 + 0.0100 = 0.0300 mol. Total volume 0.3000 L. 0.0300 / 0.3000 = 0.100 M.' },
    { n: 20, fix: '750.0 mL', q: 'A student needs 0.150 M solution and has a 0.600 M stock. What final volume should the stock be diluted to if 125.0 mL of stock is used?', a: '500.0 mL', w: ['250.0 mL', '400.0 mL', '750.0 mL'], x: 'V₂ = M₁V₁ / M₂ = (0.600)(125.0) / 0.150 = 500.0 mL.' },
  ],
});

bookBank({
  id: 'chem1-aq-04-2-book',
  chapterId: CH4, section: '4-2', band: 1, mental: true,
  name: '§4-2 book exercises: writing and balancing equations',
  concepts: ['balancing-chemical-equations', 'chemical-equation-notation'],
  items: [
    { n: 1, q: 'For the balanced combustion equation CH₄ + 2 O₂ ⟶ CO₂ + 2 H₂O, which statement is always correct?', a: '1 mol CH₄ reacts with 2 mol O₂ to form 1 mol CO₂ and 2 mol H₂O', w: ['1 g CH₄ reacts with 2 g O₂ to form 1 g CO₂ and 2 g H₂O', '1 L CH₄ reacts with 2 g O₂ to form 1 L CO₂ and 2 g H₂O', '1 molecule CH₄ reacts with 2 mol O₂ to form 1 molecule CO₂ and 2 mol H₂O'] },
    { n: 2, q: 'Which change would violate the idea that subscripts are part of a substance\'s identity (and therefore cannot be used to balance an equation)?', a: 'Changing H₂O to H₂O₂', w: ['Changing 2 H₂O to 3 H₂O', 'Changing O₂ to 2 O₂', 'Changing CO₂ to 2 CO₂'] },
    { n: 3, q: 'In the balanced equation 2 H₂O ⟶ 2 H₂ + O₂, what is the coefficient ratio H₂O:H₂:O₂?', a: '2:2:1', w: ['1:2:2', '2:1:2', '1:1:1'] },
    { n: 5, q: 'For forming dinitrogen pentoxide from its elements, the correctly balanced equation is:', a: '2 N₂ + 5 O₂ ⟶ 2 N₂O₅', w: ['N₂ + 5 O₂ ⟶ 2 N₂O₅', '2 N₂ + 3 O₂ ⟶ 2 N₂O₃', 'N₂ + 2 O₂ ⟶ N₂O₄'] },
    { n: 6, q: 'Which statement best describes why a fractional coefficient can appear during balancing but not in the final reported equation?', a: 'Fractions are acceptable temporarily, and multiplying all coefficients by a common factor preserves balance while giving integers', w: ['Fractions are chemically impossible because atoms cannot be split', 'Fractions change molar masses, so they must be removed', 'Fractions are only allowed for ionic equations, not molecular equations'] },
    { n: 7, q: 'A student writes 3 N₂ + 9 H₂ ⟶ 6 NH₃ and claims it is "unbalanced." Which is the most accurate evaluation?', a: 'It is balanced but not written with the smallest whole-number coefficients', w: ['It is balanced and already has the smallest integer coefficients', 'It is unbalanced because nitrogen is not conserved', 'It is unbalanced because hydrogen must be diatomic only on the product side'] },
    { n: 8, q: 'Ethane combustion is balanced as 2 C₂H₆ + 7 O₂ ⟶ 4 CO₂ + 6 H₂O. If you first balance C and H to get C₂H₆ + O₂ ⟶ 2 CO₂ + 3 H₂O, what coefficient on O₂ balances oxygen at that intermediate step?', a: '7/2', w: ['5/2', '3/2', '9/2'], x: 'Oxygen on the right: 2(2) + 3(1) = 7 atoms → 7/2 O₂. Doubling everything gives the reported 2, 7, 4, 6.' },
    { n: 9, q: 'Which set correctly matches physical state symbols to meanings?', a: '(s) solid, (l) liquid, (g) gas, (aq) aqueous (dissolved in water)', w: ['(s) aqueous, (l) gas, (g) liquid, (aq) solid', '(s) solution, (l) low density, (g) glass, (aq) gas in water', '(s) suspended, (l) light, (g) ground, (aq) acquired'] },
    { n: 10, q: 'What does writing Δ above an arrow most directly communicate in a chemical equation?', a: 'The reaction requires heating', w: ['The reaction is exothermic', 'The reaction occurs in acidic solution', 'The reaction is an equilibrium'] },
    { n: 11, q: 'In 2 Na(s) + 2 H₂O(l) ⟶ 2 NaOH(aq) + H₂(g), which species is explicitly indicated as aqueous?', a: 'NaOH', w: ['Na', 'H₂O', 'H₂'] },
    { n: 20, q: 'For electrolysis of brine, the balanced molecular equation is 2 NaCl(aq) + 2 H₂O(l) ⟶ 2 NaOH(aq) + H₂(g) + Cl₂(g). Which statement is correct?', a: 'The equation shows that 2 mol NaOH are produced for every 1 mol Cl₂ produced', w: ['The equation shows that NaCl is the only source of hydrogen atoms in H₂', 'The equation shows that water is a catalyst because it appears on the reactant side', 'The equation shows that H₂ and Cl₂ must both be aqueous because they form in solution'] },
  ],
});

bookBank({
  id: 'chem1-aq-04-ionic-equations-book',
  chapterId: CH5, section: '4-3', band: 2, mental: true,
  name: '§4-2/4-3 book exercises: molecular, complete ionic and net ionic equations',
  concepts: ['net-ionic-equations', 'solubility-rules-precipitation'],
  items: [
    { n: 12, sec: '4-2', q: 'In the molecular equation CaCl₂(aq) + 2 AgNO₃(aq) ⟶ Ca(NO₃)₂(aq) + 2 AgCl(s), which statement is correct?', a: 'AgCl is a precipitate because it is labeled (s)', w: ['All products are aqueous because the reaction occurs in water', 'Ca(NO₃)₂ must be a solid because it contains a metal cation', 'The equation is net ionic because charges are shown'] },
    { n: 13, sec: '4-2', q: 'Which complete ionic equation corresponds to CaCl₂(aq) + 2 AgNO₃(aq) ⟶ Ca(NO₃)₂(aq) + 2 AgCl(s)?', a: 'Ca²⁺(aq) + 2 Cl⁻(aq) + 2 Ag⁺(aq) + 2 NO₃⁻(aq) ⟶ Ca²⁺(aq) + 2 NO₃⁻(aq) + 2 AgCl(s)', w: ['CaCl₂(aq) + 2 Ag⁺(aq) + 2 NO₃⁻(aq) ⟶ Ca²⁺(aq) + 2 NO₃⁻(aq) + 2 AgCl(s)', 'Ca²⁺(aq) + 2 Cl⁻(aq) + 2 AgNO₃(aq) ⟶ Ca(NO₃)₂(aq) + 2 AgCl(s)', 'Ca²⁺(aq) + 2 Cl⁻(aq) + 2 Ag⁺(aq) ⟶ Ca²⁺(aq) + 2 AgCl(s)'] },
    { n: 14, sec: '4-2', q: 'For the AgCl precipitation reaction (CaCl₂ + AgNO₃), which ions are spectators in the complete ionic equation?', a: 'Ca²⁺ and NO₃⁻', w: ['Ag⁺ and Cl⁻', 'Ca²⁺ and Cl⁻', 'Ag⁺ and NO₃⁻'] },
    { n: 15, sec: '4-2', q: 'Which is the correct net ionic equation for the formation of AgCl(s) from aqueous ions?', a: '2 Cl⁻(aq) + 2 Ag⁺(aq) ⟶ 2 AgCl(s)', w: ['Ca²⁺(aq) + 2 Cl⁻(aq) + 2 Ag⁺(aq) + 2 NO₃⁻(aq) ⟶ Ca²⁺(aq) + 2 NO₃⁻(aq) + 2 AgCl(s)', 'Cl⁻(aq) + Ag⁺(aq) ⟶ AgCl(aq)', 'AgCl(s) ⟶ Ag⁺(aq) + Cl⁻(aq)'] },
    { n: 16, sec: '4-2', q: 'In converting a complete ionic equation to a net ionic equation, what is the correct criterion for canceling a species?', a: 'Cancel any species that appears on both sides in identical chemical form (same formula, charge, and state)', w: ['Cancel any species that is a product', 'Cancel any species with a polyatomic ion', 'Cancel any species with a coefficient of 1'] },
    { n: 17, sec: '4-2', q: 'For CO₂(aq) + 2 NaOH(aq) ⟶ Na₂CO₃(aq) + H₂O(l), which is the correct net ionic equation?', a: 'CO₂(aq) + 2 OH⁻(aq) ⟶ CO₃²⁻(aq) + H₂O(l)', w: ['CO₂(aq) + 2 Na⁺(aq) + 2 OH⁻(aq) ⟶ 2 Na⁺(aq) + CO₃²⁻(aq) + H₂O(l)', 'CO₂(g) + 2 OH⁻(aq) ⟶ CO₃²⁻(aq) + H₂O(l)', 'CO₂(aq) + 2 Na⁺(aq) ⟶ Na₂CO₃(aq)'] },
    { n: 18, sec: '4-2', q: 'In the complete ionic equation for the CO₂/NaOH reaction, which species is the spectator ion?', a: 'Na⁺(aq)', w: ['CO₂(aq)', 'OH⁻(aq)', 'CO₃²⁻(aq)'] },
    { n: 19, sec: '4-2', q: 'Which statement about net ionic equations is most accurate?', a: 'A net ionic equation shows only the species that undergo chemical change, so it can apply regardless of the spectator-ion sources', w: ['A net ionic equation depends on which soluble salts were mixed, so it changes when the sources change', 'A net ionic equation must include all ions to maintain charge neutrality', 'A net ionic equation is only used for molecular (covalent) reactants'] },
    { n: 21, sec: '4-2', q: 'Which is the correct complete ionic equation for 2 NaCl(aq) + 2 H₂O(l) ⟶ 2 NaOH(aq) + H₂(g) + Cl₂(g)?', a: '2 Na⁺(aq) + 2 Cl⁻(aq) + 2 H₂O(l) ⟶ 2 Na⁺(aq) + 2 OH⁻(aq) + H₂(g) + Cl₂(g)', w: ['2 NaCl(aq) + 2 H₂O(l) ⟶ 2 NaOH(aq) + H₂(g) + Cl₂(g)', '2 Cl⁻(aq) + 2 H₂O(l) ⟶ 2 OH⁻(aq) + H₂(g) + Cl₂(g)', 'Na⁺(aq) + Cl⁻(aq) + H₂O(l) ⟶ NaOH(aq) + H₂(g) + Cl₂(g)'] },
    { n: 22, sec: '4-2', q: 'Which net ionic equation corresponds to the electrolysis of brine (after removing spectator ions)?', a: '2 Cl⁻(aq) + 2 H₂O(l) ⟶ 2 OH⁻(aq) + H₂(g) + Cl₂(g)', w: ['2 Na⁺(aq) + 2 H₂O(l) ⟶ 2 NaOH(aq) + H₂(g)', '2 Cl₂(g) + 2 H₂O(l) ⟶ 4 HCl(aq) + O₂(g)', '2 NaCl(aq) ⟶ 2 Na(s) + Cl₂(g)'] },
    { n: 23, sec: '4-2', q: 'A student writes the complete ionic equation for a precipitation reaction and cancels NO₃⁻(aq) from the left side but leaves it on the right side. What is the best diagnosis?', a: 'This is incorrect because cancellation must remove identical species from both sides in equal amounts', w: ['This is allowed because nitrate is always a spectator ion', 'This is correct if nitrate has a coefficient of 1', 'This is incorrect because you should never cancel polyatomic ions'] },
    { n: 25, sec: '4-2', q: 'If a chemical equation includes state symbols, which of the following is the most appropriate interpretation?', a: 'State symbols may indicate whether a species is likely to be written as ions in a complete ionic equation (e.g., aq) or left intact (e.g., s)', w: ['State symbols can be ignored because they do not affect stoichiometry', 'State symbols are used only for gases and do not apply to aqueous solutions', 'State symbols determine the values of coefficients needed for balance'] },
  ],
});

bookBank({
  id: 'chem1-aq-04-3-book',
  chapterId: CH5, section: '4-3', band: 2, mental: true,
  name: '§4-3 book exercises: precipitation reactions and solubility',
  concepts: ['solubility-rules-precipitation', 'net-ionic-equations'],
  items: [
    { n: 1, q: 'When KI(aq) and Pb(NO₃)₂(aq) are mixed, which species are spectator ions in the complete ionic equation?', a: 'K⁺ and NO₃⁻', w: ['Pb²⁺ and I⁻', 'K⁺ and I⁻', 'Pb²⁺ and NO₃⁻'] },
    { n: 2, q: 'Which net ionic equation correctly represents the precipitation that occurs when K₂SO₄(aq) is mixed with Ba(NO₃)₂(aq)?', a: 'Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)', w: ['2K⁺(aq) + SO₄²⁻(aq) + Ba²⁺(aq) + 2NO₃⁻(aq) → BaSO₄(s) + 2K⁺(aq) + 2NO₃⁻(aq)', 'Ba²⁺(aq) + 2NO₃⁻(aq) + 2K⁺(aq) + SO₄²⁻(aq) → BaSO₄(s) + 2KNO₃(aq)', 'BaSO₄(aq) → Ba²⁺(aq) + SO₄²⁻(aq)'] },
    { n: 3, q: 'A student writes the following as the net ionic equation for AgNO₃(aq) + NaCl(aq): AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq). What is the best critique?', a: 'Incorrect because aqueous strong electrolytes should be written as ions, and spectators canceled.', w: ['Correct as written; net ionic equations keep compounds intact.', 'Incorrect because AgCl is soluble and should be written (aq).', 'Incorrect because net ionic equations must include all spectator ions.'] },
    { n: 4, q: 'Mixing AgNO₃(aq) and NaCl(aq) forms AgCl(s). Which complete ionic equation is correct?', a: 'Ag⁺(aq) + NO₃⁻(aq) + Na⁺(aq) + Cl⁻(aq) → AgCl(s) + Na⁺(aq) + NO₃⁻(aq)', w: ['AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)', 'Ag⁺(aq) + Cl⁻(aq) + NaNO₃(aq) → AgCl(s) + Na⁺(aq) + NO₃⁻(aq)', 'Ag(s) + Cl₂(g) → AgCl(s)'] },
    { n: 5, q: 'Which statement best matches the meaning of solubility?', a: 'Solubility is the maximum concentration of a substance that can dissolve under specified conditions.', w: ['Solubility is the rate at which a solid dissolves in water.', 'Solubility is the fraction of solute particles that dissociate into ions.', 'Solubility is the amount of solvent needed to dissolve 1 mol of solute at any temperature.'] },
    { n: 6, q: 'Solutions contain Ba²⁺(aq). Which added solution most directly precipitates Ba²⁺(aq) based on the solubility rules?', a: 'Na₂SO₄(aq)', w: ['NaCl(aq)', 'NaNO₃(aq)', 'KBr(aq)'] },
    { n: 7, q: 'A precipitation reaction is most accurately described as which process?', a: 'Substances dissolved in water react to form a solid product.', w: ['Two aqueous solutions react to form a gas that escapes.', 'A solid reactant dissolves completely to form ions.', 'A reaction in which an organic compound reacts with O₂ to form CO₂ and H₂O.'] },
    { n: 8, q: 'In a double-displacement (metathesis) precipitation reaction written as AB + CD → AD + CB, what must be true for a precipitate to form?', a: 'At least one product (AD or CB) must be insoluble under the reaction conditions.', w: ['Both AD and CB must be insoluble.', 'Both reactants must be acids.', 'All ions must remain dissolved so charge is conserved.'] },
    { n: 9, q: 'Which molecular equation is balanced and consistent with the precipitation of PbI₂(s) when KI(aq) and Pb(NO₃)₂(aq) are mixed?', a: '2KI(aq) + Pb(NO₃)₂(aq) → PbI₂(s) + 2KNO₃(aq)', w: ['KI(aq) + Pb(NO₃)₂(aq) → PbI₂(s) + KNO₃(aq)', '2KI(aq) + PbNO₃(aq) → PbI₂(s) + 2KNO₃(aq)', 'KI(aq) + Pb(NO₃)₂(aq) → PbI₂(aq) + KNO₃(s)'] },
    { n: 10, q: 'Which pair correctly identifies the precipitate and the net ionic equation when LiCl(aq) and AgC₂H₃O₂(aq) are mixed?', a: 'Precipitate: AgCl(s); net ionic: Ag⁺(aq) + Cl⁻(aq) → AgCl(s)', w: ['Precipitate: LiC₂H₃O₂(s); net ionic: Li⁺(aq) + C₂H₃O₂⁻(aq) → LiC₂H₃O₂(s)', 'Precipitate: AgC₂H₃O₂(s); net ionic: Ag⁺(aq) + C₂H₃O₂⁻(aq) → AgC₂H₃O₂(s)', 'Precipitate: LiCl(s); net ionic: Li⁺(aq) + Cl⁻(aq) → LiCl(s)'] },
    { n: 11, q: 'A student claims that if you can write two possible products from ion exchange, then a precipitation reaction must occur. Which response is most correct?', a: 'False; a precipitate forms only if at least one product is insoluble according to solubility rules.', w: ['True; double displacement always produces a precipitate.', 'True; any new ion pairing must form a solid.', 'False; precipitation occurs only for reactions that produce water.'] },
    { n: 12, q: 'Which set of ions is present immediately after mixing AgNO₃(aq) and NaCl(aq), before any precipitation occurs?', a: 'Ag⁺, Cl⁻, Na⁺, NO₃⁻', w: ['AgCl, NaNO₃', 'Ag⁺, NaCl, NO₃⁻', 'AgNO₃, Na⁺, Cl⁻'] },
    { n: 13, q: 'Which statement correctly explains why the net ionic equation for PbI₂(s) formation omits K⁺ and NO₃⁻?', a: 'K⁺ and NO₃⁻ are spectator ions that remain dissolved and cancel.', w: ['K⁺ and NO₃⁻ react to form KNO₃(s), which is removed from the equation.', 'K⁺ and NO₃⁻ are produced, not reactants, so they are not written.', 'K⁺ and NO₃⁻ have charges that do not balance the equation.'] },
    { n: 15, q: 'Which unbalanced equation correctly matches the definition of a combustion reaction?', a: 'C₈H₁₈(l) + O₂(g) → CO₂(g) + H₂O(g)', w: ['C₈H₁₈(l) + H₂O(l) → CO₂(g) + H₂(g)', 'C₈H₁₈(l) + CO₂(g) → O₂(g) + H₂O(g)', 'C₈H₁₈(l) + O₂(g) → CO(g) + H₂(g)'] },
    { n: 16, q: 'Which change would convert a correct molecular precipitation equation into a correct complete ionic equation?', a: 'Split aqueous ionic compounds into their ions, but keep solids, liquids, and gases intact.', w: ['Replace all solids with aqueous ions.', 'Split only the precipitate into ions to show what it is made of.', 'Remove all charges so the equation is easier to balance.'] },
    { n: 17, q: 'Mixing Pb(NO₃)₂(aq) and (NH₄)₂CO₃(aq) produces a precipitate. Which net ionic equation matches this reaction?', a: 'Pb²⁺(aq) + CO₃²⁻(aq) → PbCO₃(s)', w: ['Pb(NO₃)₂(aq) + (NH₄)₂CO₃(aq) → PbCO₃(s) + 2NH₄NO₃(aq)', 'Pb²⁺(aq) + 2NO₃⁻(aq) + 2NH₄⁺(aq) + CO₃²⁻(aq) → PbCO₃(s) + 2NH₄⁺(aq) + 2NO₃⁻(aq)', 'NH₄⁺(aq) + NO₃⁻(aq) → NH₄NO₃(s)'] },
  ],
});

bookBank({
  id: 'chem1-aq-04-4-book',
  chapterId: CH4, section: '4-4', band: 2, mental: false,
  name: '§4-4 book exercises: reaction stoichiometry',
  concepts: ['moles-to-mass-stoichiometry', 'mole-ratios-from-coefficients'],
  items: [
    { n: 1, fix: '6.00 g', q: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), what mass of H₂ is required to react completely with 14.0 g of N₂?', a: '3.00 g', w: ['1.50 g', '6.00 g', '9.00 g'], x: '14.0 g / 28.02 = 0.500 mol N₂ × 3 = 1.50 mol H₂ × 2.016 g/mol = 3.02 g ≈ 3.00 g.' },
    { n: 2, fix: '6.02 × 10²³ molecules', q: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), how many NH₃ molecules can form from 0.250 mol of N₂ (assume excess H₂)?', a: '3.01 × 10²³ molecules', w: ['6.02 × 10²³ molecules', '1.20 × 10²⁴ molecules', '7.53 × 10²³ molecules'], x: '0.250 mol N₂ × 2 = 0.500 mol NH₃ × 6.022 × 10²³ = 3.01 × 10²³ molecules.' },
    { n: 3, q: 'For 2Al + 3I₂ → 2AlI₃, what mass of I₂ is required to react completely with 10.0 g of Al?', a: '141 g', w: ['35.3 g', '70.6 g', '94.1 g'], x: '10.0 / 26.98 = 0.371 mol Al × 3/2 = 0.556 mol I₂ × 253.8 g/mol = 141 g. (94.1 g skips the 3/2 ratio. The book offers none of the right answer here; its options were all wrong.)' },
    { n: 4, fix: '2.25 × 10²³ atoms', q: 'For 2Al + 3I₂ → 2AlI₃, how many Al atoms are required to react completely with 1.50 × 10²³ molecules of I₂?', a: '1.00 × 10²³ atoms', w: ['2.25 × 10²³ atoms', '3.00 × 10²³ atoms', '4.50 × 10²³ atoms'], x: 'Al : I₂ = 2 : 3, so 1.50 × 10²³ × 2/3 = 1.00 × 10²³. (2.25 × 10²³ uses the ratio upside down.)' },
    { n: 5, q: 'For 3Ca(OH)₂ + 2H₃PO₄ → Ca₃(PO₄)₂ + 6H₂O, what mass of Ca(OH)₂ is required to react completely with 49.0 g of H₃PO₄?', a: '55.6 g', w: ['24.7 g', '37.0 g', '84.0 g'], x: '49.0 / 97.99 = 0.500 mol H₃PO₄ × 3/2 = 0.750 mol Ca(OH)₂ × 74.09 = 55.6 g. (The book\'s options did not include the right answer; 24.7 g inverts the ratio, 37.0 g ignores it.)' },
    { n: 6, q: 'For 3Ca(OH)₂ + 2H₃PO₄ → Ca₃(PO₄)₂ + 6H₂O, how many formula units of Ca₃(PO₄)₂ can form from 0.400 mol of H₃PO₄ (assume excess Ca(OH)₂)?', a: '1.20 × 10²³ formula units', w: ['8.03 × 10²² formula units', '2.41 × 10²³ formula units', '4.82 × 10²³ formula units'] },
    { n: 7, q: 'For C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, what mass of O₂ is required to combust 11.0 g of C₃H₈ completely?', a: '40.0 g', w: ['16.0 g', '24.0 g', '80.0 g'] },
    { n: 8, fix: '9.03 × 10²³ molecules', q: 'For C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, how many CO₂ molecules are produced when 0.125 mol of C₃H₈ is completely combusted?', a: '2.26 × 10²³ molecules', w: ['4.52 × 10²³ molecules', '9.03 × 10²³ molecules', '1.13 × 10²⁴ molecules'], x: '0.125 × 3 = 0.375 mol CO₂ × 6.022 × 10²³ = 2.26 × 10²³.' },
    { n: 9, q: 'For (NH₄)₂SO₄ + Ca(OH)₂ → 2NH₃ + CaSO₄ + 2H₂O, what mass of NH₃ is produced from 18.5 g of Ca(OH)₂ (assume excess (NH₄)₂SO₄)?', a: '8.50 g', w: ['4.25 g', '12.6 g', '18.9 g'], x: '18.5 / 74.09 = 0.250 mol × 2 = 0.499 mol NH₃ × 17.03 = 8.50 g. (Not among the book\'s options; 4.25 g forgets the 2.)' },
    { n: 10, fix: '3.61 × 10²³ molecules', q: 'For (NH₄)₂SO₄ + Ca(OH)₂ → 2NH₃ + CaSO₄ + 2H₂O, how many NH₃ molecules are produced from 0.150 mol of Ca(OH)₂ (assume excess (NH₄)₂SO₄)?', a: '1.81 × 10²³ molecules', w: ['4.52 × 10²² molecules', '9.03 × 10²² molecules', '3.61 × 10²³ molecules'], x: '0.150 × 2 = 0.300 mol × 6.022 × 10²³ = 1.81 × 10²³.' },
    { n: 11, q: 'For MgCl₂(aq) + 2NaOH(aq) → Mg(OH)₂(s) + 2NaCl(aq), what mass of Mg(OH)₂ can be produced from 25.0 g of NaOH (assume excess MgCl₂)?', a: '18.2 g', w: ['9.12 g', '24.3 g', '36.5 g'] },
    { n: 12, fix: '3.32 × 10²³ formula units', q: 'How many formula units of Mg(OH)₂ correspond to 16.0 g of Mg(OH)₂?', a: '1.65 × 10²³ formula units', w: ['3.32 × 10²³ formula units', '6.64 × 10²³ formula units', '9.96 × 10²³ formula units'], x: '16.0 / 58.32 = 0.274 mol × 6.022 × 10²³ = 1.65 × 10²³.' },
    { n: 13, fix: '4.31 g', q: 'For 4Ga + 3O₂ → 2Ga₂O₃, what mass of O₂ is required to react completely with 20.0 g of Ga?', a: '6.89 g', w: ['1.72 g', '3.44 g', '4.31 g'], x: '20.0 / 69.72 = 0.287 mol Ga × 3/4 = 0.215 mol O₂ × 32.00 = 6.89 g.' },
    { n: 14, fix: '3.01 × 10²⁴ molecules', q: 'For 2C₈H₁₈ + 25O₂ → 16CO₂ + 18H₂O, how many O₂ molecules are required to combust 0.200 mol of C₈H₁₈ completely?', a: '1.51 × 10²⁴ molecules', w: ['7.53 × 10²³ molecules', '3.01 × 10²⁴ molecules', '7.53 × 10²⁴ molecules'], x: '0.200 × 25/2 = 2.50 mol O₂ × 6.022 × 10²³ = 1.51 × 10²⁴. (3.01 × 10²⁴ forgets to divide by 2.)' },
    { n: 15, q: 'For Fe₂O₃ + 3CO → 2Fe + 3CO₂, what mass of CO₂ is produced when 25.13 g of Fe₂O₃ reacts completely (assume excess CO)?', a: '20.8 g', w: ['6.93 g', '11.0 g', '33.1 g'], x: '25.13 / 159.70 = 0.1574 mol × 3 = 0.472 mol CO₂ × 44.01 = 20.8 g. (Not among the book\'s options; 6.93 g forgets the 3.)' },
  ],
});

bookBank({
  id: 'chem1-aq-04-5-calc',
  chapterId: CH4, section: '4-5', band: 3, mental: false,
  name: '§4-5 book exercises: limiting reactant and percent yield',
  concepts: ['limiting-reactant-theoretical-yield', 'percent-yield'],
  items: [
    { n: 1, q: 'For H₂(g) + Cl₂(g) → 2 HCl(g), a mixture contains 4.50 mol H₂ and 3.20 mol Cl₂; after reaction goes to completion, how many moles of HCl form?', a: '6.40 mol', w: ['7.70 mol', '9.00 mol', '3.20 mol'] },
    { n: 2, q: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), a reaction starts with 5.00 mol N₂ and 9.00 mol H₂; which statement is correct?', a: 'H₂ is limiting; 6.00 mol NH₃ forms', w: ['N₂ is limiting; 6.00 mol NH₃ forms', 'N₂ is limiting; 10.0 mol NH₃ forms', 'H₂ is limiting; 10.0 mol NH₃ forms'] },
    { n: 3, q: 'For 3 Si(s) + 2 N₂(g) → Si₃N₄(s), 2.00 g Si reacts with 1.50 g N₂; what mass of excess reactant remains after completion? (Si = 28.09 g/mol, N₂ = 28.02 g/mol)', a: '0.170 g N₂', w: ['0.336 g N₂', '0.170 g Si', '1.33 g N₂'], x: 'Si: 0.0712 mol needs 0.0475 mol N₂ (1.33 g). N₂ available 0.0535 mol, so 0.0061 mol = 0.170 g N₂ is left. (The book\'s key, 0.336 g, does not follow from its own numbers.)' },
    { n: 4, q: 'For 2 Al(s) + 3 Cl₂(g) → 2 AlCl₃(s), a sample contains 5.40 g Al and 9.60 g Cl₂; what is the limiting reactant?', a: 'Cl₂', w: ['Al', 'AlCl₃', 'Neither; stoichiometric mixture'] },
    { n: 5, q: 'For CuSO₄(aq) + Zn(s) → Cu(s) + ZnSO₄(aq), 1.274 g CuSO₄ produces 0.392 g Cu; what is the percent yield? (CuSO₄ = 159.62 g/mol, Cu = 63.55 g/mol)', a: '77.3%', w: ['22.7%', '129%', '48.3%'], x: 'Theoretical: 1.274/159.62 × 63.55 = 0.507 g Cu. 0.392 / 0.507 × 100 = 77.3%. (129% is the ratio upside down.)' },
    { n: 7, q: 'For 2 CO(g) + O₂(g) → 2 CO₂(g), a container has 5.00 mol CO and 2.40 mol O₂; how many moles of CO remain unreacted?', a: '0.200 mol', w: ['0.100 mol', '2.60 mol', '0 mol'] },
    { n: 8, q: 'For 2 H₂(g) + O₂(g) → 2 H₂O(l), 5.00 g H₂ and 10.0 g O₂ react; what mass of H₂O can form?', a: '11.3 g', w: ['22.5 g', '14.1 g', '5.63 g'] },
    { n: 11, q: 'For 3 Si(s) + 2 N₂(g) → Si₃N₄(s), 2.50 mol Si and 1.40 mol N₂ react; what is the limiting reactant?', a: 'N₂', w: ['Si', 'Si₃N₄', 'None; stoichiometric mixture'] },
    { n: 13, q: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), 28.0 g N₂ reacts with 6.00 g H₂; what mass of NH₃ is the theoretical yield? (N₂ = 28.02, H₂ = 2.016, NH₃ = 17.03 g/mol)', a: '33.8 g', w: ['34.0 g', '17.0 g', '11.3 g'], x: 'N₂: 0.999 mol (needs 3.00 mol H₂). H₂: 2.976 mol, so H₂ is (barely) limiting: 2.976 × 2/3 = 1.984 mol NH₃ × 17.03 = 33.8 g. 34.0 g is what you get if you assume N₂ limits. (The book\'s key, 17.0 g, is wrong, and its options did not include 33.8 g.)' },
    { n: 14, fix: '0.214 mol AlI₃, which is 87.3 g', q: 'For 2 Al(s) + 3 I₂(s) → 2 AlI₃(s), a mixture has 0.429 mol Al and 0.500 mol I₂; what mass of AlI₃ can form? (AlI₃ = 407.69 g/mol)', a: '0.333 mol AlI₃, which is 136 g', w: ['0.286 mol AlI₃, which is 116 g', '0.500 mol AlI₃, which is 204 g', '0.214 mol AlI₃, which is 87.3 g'], x: '0.429 mol Al would need 0.644 mol I₂; only 0.500 is there, so I₂ limits: 0.500 × 2/3 = 0.333 mol × 407.69 = 136 g.' },
  ],
});

bookBank({
  id: 'chem1-aq-04-5-concepts',
  chapterId: CH4, section: '4-5', band: 1, mental: true,
  name: '§4-5 book exercises: what yield means',
  concepts: ['limiting-reactant-theoretical-yield', 'percent-yield'],
  items: [
    { n: 6, q: 'A student calculates a theoretical yield of 18.6 g product but isolates 20.1 g; which is the best interpretation?', a: 'The percent yield is greater than 100%, which usually indicates impurities, incomplete drying, or a measurement error', w: ['The percent yield is 92.5%, so the experiment was efficient', 'The reaction had no limiting reactant', 'Theoretical yield must be recalculated using actual yield'] },
    { n: 9, q: 'For H₂(g) + Cl₂(g) → 2 HCl(g), a student calculates 6.00 mol HCl from the available H₂ and 5.20 mol HCl from the available Cl₂; what conclusion follows?', a: 'Cl₂ is limiting and 5.20 mol HCl is the theoretical yield', w: ['H₂ is limiting and 6.00 mol HCl forms', 'Both are limiting; 11.2 mol HCl forms', 'No limiting reactant; 5.60 mol HCl forms'] },
    { n: 10, q: 'A reaction has a theoretical yield of 0.750 mol product and an actual yield of 24.0 g product; which additional piece of information is required to compute percent yield?', a: 'The molar mass of the product', w: ['The balanced chemical equation', 'The limiting reactant identity', 'The initial mass of each reactant'] },
    { n: 12, q: 'A student reports percent yield using theoretical yield in grams and actual yield in moles; what is the main problem?', a: 'Percent yield requires both yields to be in the same units so they cancel', w: ['Percent yield only works if both yields are in liters', 'Theoretical yield must always be smaller than actual yield', 'Percent yield uses the inverse ratio (theoretical/actual)'] },
    { n: 15, q: 'A synthesis has an atom economy of 100% but a percent yield of 62%; which statement best explains this combination?', a: 'All reactant atoms end up in the desired product in theory, but in practice product is lost or side reactions/incomplete reaction reduce the actual yield', w: ['The reaction must have a limiting reactant', 'The percent yield must also be 100% if atom economy is 100%', 'Atom economy is calculated from actual yield, so it must be 62%'] },
  ],
});

bookBank({
  id: 'chem1-aq-04-6-calc',
  chapterId: CH5, section: '4-6', band: 3, mental: false,
  name: '§4-6 book exercises: titration and gravimetric calculations',
  concepts: ['titration-calculations', 'gravimetric-analysis'],
  items: [
    { n: 2, fix: '0.08832 M', q: 'A 25.00 mL sample of HNO₃(aq) is titrated with 0.1200 M Ba(OH)₂(aq). If 18.40 mL of base is required to reach equivalence, what is the molarity of HNO₃?', a: '0.1766 M', w: ['0.04416 M', '0.08832 M', '0.2208 M'], x: 'mol Ba(OH)₂ = 0.1200 × 0.01840 = 0.002208. 2 HNO₃ per Ba(OH)₂ (it gives 2 OH⁻) → 0.004416 mol HNO₃ / 0.02500 L = 0.1766 M. (0.08832 M forgets the 2.)' },
    { n: 4, fix: '0.1580 M', q: 'A 40.00 mL sample of HCl(aq) is titrated with 0.2500 M NaOH(aq). If the endpoint is reached after 31.60 mL of NaOH is delivered, what is the molarity of HCl?', a: '0.1975 M', w: ['0.07900 M', '0.09875 M', '0.1580 M'], x: '0.2500 × 0.03160 = 0.007900 mol NaOH = mol HCl (1:1). 0.007900 / 0.04000 L = 0.1975 M.' },
    { n: 6, fix: '60.1%', q: 'A 0.612 g impure solid containing Na₂CO₃ is dissolved and treated with excess Ba(NO₃)₂, forming 0.948 g BaCO₃(s). What is the mass percent of Na₂CO₃ in the solid? (BaCO₃ = 197.34 g/mol, Na₂CO₃ = 105.99 g/mol)', a: '83.2%', w: ['40.7%', '52.5%', '60.1%'], x: '0.948 / 197.34 = 0.004804 mol BaCO₃ = mol Na₂CO₃ (1:1) × 105.99 = 0.509 g. 0.509 / 0.612 × 100 = 83.2%.' },
    { n: 8, fix: '0.4500 M', q: 'A 10.00 mL sample of H₃PO₄(aq) is titrated to complete neutralization with 0.2000 M Ca(OH)₂(aq). If 15.00 mL of base is required, what is the molarity of H₃PO₄? (2 H₃PO₄ + 3 Ca(OH)₂ → Ca₃(PO₄)₂ + 6 H₂O)', a: '0.2000 M', w: ['0.1500 M', '0.4500 M', '0.6000 M'], x: '0.2000 × 0.01500 = 0.003000 mol Ca(OH)₂ × 2/3 = 0.002000 mol H₃PO₄ / 0.01000 L = 0.2000 M. (0.4500 M uses the ratio upside down.)' },
    { n: 10, q: 'A chloride-containing sample is treated with excess Ag⁺ to precipitate AgCl(s). If 0.5000 g of sample produces 0.2865 g AgCl, what is the mass percent of Cl⁻ in the sample? (AgCl = 143.32 g/mol, Cl = 35.45 g/mol)', a: '14.15%', w: ['28.30%', '20.00%', '10.00%'], x: '0.2865 / 143.32 × 35.45 = 0.07087 g Cl; / 0.5000 × 100 = 14.17% (the book rounds to 14.15%).' },
    { n: 12, q: 'A 15.00 mL sample of H₂C₂O₄(aq) is titrated with 0.08000 M NaOH(aq). If 22.50 mL of base is required, what is the molarity of H₂C₂O₄? (H₂C₂O₄ + 2 NaOH → Na₂C₂O₄ + 2 H₂O)', a: '0.06000 M', w: ['0.04000 M', '0.08000 M', '0.1200 M'], x: '0.08000 × 0.02250 = 0.001800 mol NaOH ÷ 2 = 0.000900 mol acid / 0.01500 L = 0.06000 M. (0.1200 M multiplies by 2 instead of dividing.)' },
  ],
});

bookBank({
  id: 'chem1-aq-04-6-concepts',
  chapterId: CH5, section: '4-6', band: 1, mental: true,
  name: '§4-6 book exercises: titration and gravimetric concepts',
  concepts: ['titration-calculations', 'gravimetric-analysis'],
  items: [
    { n: 1, q: 'In an acid-base titration, which statement best describes the equivalence point?', a: 'The moles of H⁺ and OH⁻ have reacted in the stoichiometric ratio of the balanced equation.', w: ['The indicator first changes color permanently.', 'The pH equals 7.00.', 'The analyte has been completely converted to products, regardless of stoichiometry.'] },
    { n: 3, q: 'Which balanced molecular equation matches the titration of sulfuric acid with potassium hydroxide?', a: 'H₂SO₄(aq) + 2 KOH(aq) → K₂SO₄(aq) + 2 H₂O(l)', w: ['H₂SO₄(aq) + KOH(aq) → KHSO₄(aq) + H₂O(l)', '2 H₂SO₄(aq) + KOH(aq) → K₂SO₄(aq) + 2 H₂O(l)', 'HSO₄⁻(aq) + OH⁻(aq) → SO₄²⁻(aq) + H₂O(l)'] },
    { n: 5, q: 'A student calculates moles of titrant using 23.50 mL × 0.1050 mol/L but forgets to convert mL to L. How does this mistake affect the calculated analyte molarity?', a: 'It is too large by a factor of 1000.', w: ['It is too small by a factor of 1000.', 'It is too small by a factor of 10.', 'It is too large by a factor of 10.'] },
    { n: 7, q: 'Which statement correctly connects an indicator endpoint to the equivalence point in a titration?', a: 'The endpoint is an observed signal (such as a color change) that is chosen to occur as close as possible to the equivalence point.', w: ['The endpoint and equivalence point are always identical in any titration.', 'The endpoint is defined by equal volumes of titrant and analyte.', 'The equivalence point is detected by a visible signal; the endpoint is when the stoichiometric amounts have reacted.'] },
    { n: 9, q: 'In gravimetric analysis, which sequence best matches the method?', a: 'Convert analyte to a measurable solid, isolate and dry it, then use its mass and stoichiometry to find analyte amount.', w: ['Dissolve sample, titrate to a color change, compute molarity.', 'Measure gas volume, use ideal gas law, compute moles.', 'Heat sample to decompose it completely, then compute percent yield.'] },
    { n: 11, q: 'A student writes the factor-label setup for a titration as: 35.00 mL titrant × (0.1000 mol titrant / 1 L) × (1 L / 1000 mL). Which statement is correct about this setup?', a: 'It is correct; multiplication is commutative, so either order gives the same moles as long as units cancel.', w: ['It is incorrect because the mL-to-L conversion must come before the molarity factor.', 'It is incorrect because molarity must be written as (1 L / 0.1000 mol).', 'It is incorrect because mL cannot be converted to L in stoichiometry problems.'] },
    { n: 13, q: 'Which calculation plan is most appropriate for finding the molarity of an unknown monoprotic acid HA using a standardized NaOH titration?', a: 'Convert volume of NaOH to moles NaOH, use 1:1 stoichiometry to get moles HA, then divide by volume of acid solution in liters.', w: ['Divide mL NaOH by mL acid to get the molarity of the acid directly.', 'Multiply molarity of NaOH by volume of acid to get moles of acid, then divide by volume of NaOH.', 'Use the mass of the acid solution and its density to calculate moles of acid.'] },
    { n: 14, q: 'Which statement best distinguishes titration from the vinegar + baking soda demonstration?', a: 'A titration uses a solution of known concentration to determine an unknown concentration by measuring the amount needed to reach equivalence.', w: ['A titration must always produce a gas that can be measured.', 'A titration requires an insoluble precipitate to form.', 'A titration is any reaction that bubbles.'] },
  ],
});

// =============================================================================
// 2. GENERATED TEMPLATES
// =============================================================================

// Every percent / formula below is computed from AM at draw time, never typed in.
const COMPOUNDS = [
  { name: 'ammonia', parts: [['N', 1], ['H', 3]] },
  { name: 'water', parts: [['H', 2], ['O', 1]] },
  { name: 'carbon dioxide', parts: [['C', 1], ['O', 2]] },
  { name: 'methane', parts: [['C', 1], ['H', 4]] },
  { name: 'glucose', parts: [['C', 6], ['H', 12], ['O', 6]] },
  { name: 'calcium carbonate', parts: [['Ca', 1], ['C', 1], ['O', 3]] },
  { name: 'sodium thiosulfate ("hypo")', parts: [['Na', 2], ['S', 2], ['O', 3]] },
  { name: 'sulfuric acid', parts: [['H', 2], ['S', 1], ['O', 4]] },
  { name: 'ethanol', parts: [['C', 2], ['H', 6], ['O', 1]] },
  { name: 'aluminum oxide', parts: [['Al', 2], ['O', 3]] },
  { name: 'iron(III) oxide', parts: [['Fe', 2], ['O', 3]] },
  { name: 'potassium nitrate', parts: [['K', 1], ['N', 1], ['O', 3]] },
  { name: 'magnesium chloride', parts: [['Mg', 1], ['Cl', 2]] },
  { name: 'phosphorus pentoxide', parts: [['P', 2], ['O', 5]] },
];

registerChemTemplate({
  id: 'chem1-aq-03-percent-composition',
  chapterId: CH3, section: '3-3', band: 2, mental: false,
  name: 'Percent composition from a formula',
  concepts: ['percent-composition'],
  generate: (rng, h) => {
    const c = h.pick(COMPOUNDS);
    const [el, n] = h.pick(c.parts);
    const M = massOf(c.parts);
    const right = (n * AM[el] / M) * 100;
    const atoms = c.parts.reduce((s, [, k]) => s + k, 0);
    const others = c.parts.filter(([e]) => e !== el).map(([e, k]) => ({ value: pct(k * AM[e] / M * 100), error: 'wrong-element', why: `that is the percent of ${e}, not ${el}` }));
    return {
      stem: `What is the percent ${el} by mass in ${c.name}, ${formula(c.parts)}? (Use ${c.parts.map(([e]) => `${e} = ${mm(AM[e])}`).join(', ')} g/mol.)`,
      ...h.choices(pct(right), [
        ...(n > 1 ? [{ value: pct(AM[el] / M * 100), error: 'forgot-subscript', why: `used one ${el} atom instead of ${n}` }] : []),
        { value: pct(n / atoms * 100), error: 'atom-fraction', why: 'counted atoms instead of mass — percent composition is by MASS' },
        ...others,
        { value: pct(n * AM[el] / (M - n * AM[el]) * 100), error: 'divided-by-rest', why: `divided by the mass of everything except ${el}, not by the whole formula mass` },
      ]),
      explanation: `Formula mass of ${formula(c.parts)} = ${M.toFixed(2)} g/mol. ${el} contributes ${n} × ${mm(AM[el])} = ${(n * AM[el]).toFixed(2)} g/mol, so %${el} = ${(n * AM[el]).toFixed(2)} / ${M.toFixed(2)} × 100 = ${pct(right)}.`,
    };
  },
});

// Empirical formula from percent data: real compounds whose SIMPLEST formula is the answer.
const EMPIRICAL = [
  { parts: [['C', 1], ['S', 2]] },
  { parts: [['C', 1], ['H', 2], ['O', 1]] },
  { parts: [['P', 2], ['O', 5]] },
  { parts: [['N', 2], ['O', 5]] },
  { parts: [['N', 1], ['O', 2]] },
  { parts: [['Fe', 2], ['O', 3]] },
  { parts: [['Al', 2], ['O', 3]] },
  { parts: [['C', 3], ['H', 8]] },
  { parts: [['C', 2], ['H', 6], ['O', 1]] },
  { parts: [['C', 1], ['H', 4], ['O', 1]] },
  { parts: [['Na', 2], ['S', 1], ['O', 4]] },
  { parts: [['K', 1], ['Cl', 1], ['O', 3]] },
];

registerChemTemplate({
  id: 'chem1-aq-03-empirical-from-percent',
  chapterId: CH3, section: '3-3', band: 3, mental: false,
  name: 'Empirical formula from percent composition',
  concepts: ['empirical-formula-atomic-ratios', 'percent-composition'],
  generate: (rng, h) => {
    const c = h.pick(EMPIRICAL);
    const M = massOf(c.parts);
    const pcts = c.parts.map(([e, n]) => Number((n * AM[e] / M * 100).toFixed(1)));
    const minP = Math.min(...pcts);
    const fromPercents = formula(c.parts.map(([e], i) => [e, Math.max(1, Math.round(pcts[i] / minP))]));
    const swapped = formula(c.parts.map(([e], i) => [e, c.parts[(i + 1) % c.parts.length][1]]));
    const doubled = formula(c.parts.map(([e, n]) => [e, n * 2]));
    const minN = Math.min(...c.parts.map(([, n]) => n));
    const halfRounded = minN > 1 ? formula(c.parts.map(([e, n]) => [e, Math.floor(n / minN)])) : null;
    const moles = c.parts.map(([e], i) => pcts[i] / AM[e]);
    const minMol = Math.min(...moles);
    return {
      stem: `A compound is ${c.parts.map(([e], i) => `${pcts[i]}% ${e}`).join(', ')} by mass. What is its empirical formula?`,
      ...h.choices(formula(c.parts), [
        ...(halfRounded ? [{ value: halfRounded, error: 'rounded-half-ratio', why: 'rounded a fractional mole ratio (like 1 : 2.5 or 1 : 2.67) instead of multiplying every ratio up to whole numbers' }] : []),
        { value: fromPercents, error: 'used-mass-not-moles', why: 'took the ratio of the PERCENTS (masses) instead of converting each to moles first' },
        { value: doubled, error: 'not-simplest', why: 'right ratio, but not the simplest whole numbers' },
        { value: swapped, error: 'subscripts-swapped', why: 'attached the mole ratios to the wrong elements' },
        { value: formula(c.parts.map(([e], i) => [e, c.parts[c.parts.length - 1 - i][1]])), error: 'subscripts-swapped', why: 'attached the mole ratios to the wrong elements' },
        { value: formula(c.parts.map(([e, n]) => [e, n * 3])), error: 'not-simplest', why: 'right ratio, but not the simplest whole numbers' },
      ]),
      explanation: `Assume 100 g, so each percent is grams. Convert to moles: ${c.parts.map(([e], i) => `${e} ${pcts[i]}/${mm(AM[e])} = ${moles[i].toFixed(3)}`).join('; ')}. Divide by the smallest (${minMol.toFixed(3)}): ${c.parts.map(([e], i) => `${e} ${(moles[i] / minMol).toFixed(2)}`).join(', ')}.${minN > 1 ? ` A ratio ending in .5 or .33 is multiplied up to whole numbers, never rounded.` : ''} → ${formula(c.parts)}.`,
    };
  },
});

const MOLECULAR = [
  { emp: [['C', 1], ['H', 2], ['O', 1]], n: 6 },
  { emp: [['C', 1], ['H', 1]], n: 6 },
  { emp: [['C', 5], ['H', 7], ['N', 1]], n: 2 },
  { emp: [['C', 1], ['H', 2]], n: 4 },
  { emp: [['N', 1], ['O', 2]], n: 2 },
  { emp: [['P', 2], ['O', 5]], n: 2 },
  { emp: [['C', 2], ['H', 5]], n: 2 },
  { emp: [['C', 1], ['H', 2], ['Cl', 1]], n: 2 },
  { emp: [['C', 3], ['H', 4]], n: 3 },
  { emp: [['H', 1], ['O', 1]], n: 2 },
  { emp: [['C', 1], ['H', 1]], n: 2 },
  { emp: [['C', 2], ['H', 3], ['O', 1]], n: 4 },
];

registerChemTemplate({
  id: 'chem1-aq-03-molecular-from-empirical',
  chapterId: CH3, section: '3-3', band: 2, mental: false,
  name: 'Molecular formula from the empirical formula and molar mass',
  concepts: ['molecular-formula-from-empirical'],
  generate: (rng, h) => {
    const m = h.pick(MOLECULAR);
    const em = massOf(m.emp);
    const molar = em * m.n;
    const times = (k) => formula(m.emp.map(([e, s]) => [e, s * k]));
    return {
      stem: `A compound has empirical formula ${formula(m.emp)} and a molar mass of ${molar.toFixed(1)} g/mol. What is its molecular formula?`,
      ...h.choices(times(m.n), [
        { value: formula(m.emp), error: 'stopped-at-empirical', why: 'reported the empirical formula without comparing it to the molar mass' },
        { value: times(m.n + 1), error: 'wrong-multiplier', why: `multiplied by ${m.n + 1}; ${molar.toFixed(1)} / ${em.toFixed(2)} = ${m.n}` },
        { value: formula(m.emp.map(([e, s], i) => [e, i === 0 ? s * m.n : s])), error: 'multiplied-one-element', why: 'multiplied only the first subscript — every subscript is multiplied by n' },
        { value: times(m.n * 2), error: 'wrong-multiplier', why: `doubled the multiplier; n = ${m.n}` },
      ]),
      explanation: `Empirical formula mass of ${formula(m.emp)} = ${em.toFixed(2)} g/mol. n = ${molar.toFixed(1)} / ${em.toFixed(2)} = ${m.n}. Multiply every subscript by ${m.n}: ${times(m.n)}.`,
    };
  },
});

// reactant -> product, with the mole ratio product/reactant from the balanced equation.
const YIELD_RXNS = [
  { eq: 'CuSO₄ + Zn → Cu + ZnSO₄', r: 'CuSO₄', Mr: 159.62, p: 'Cu', Mp: 63.55, ratio: [1, 1] },
  { eq: 'CaCO₃ → CaO + CO₂', r: 'CaCO₃', Mr: 100.09, p: 'CaO', Mp: 56.08, ratio: [1, 1] },
  { eq: 'N₂ + 3H₂ → 2NH₃', r: 'N₂', Mr: 28.02, p: 'NH₃', Mp: 17.03, ratio: [1, 2] },
  { eq: '2H₂ + O₂ → 2H₂O', r: 'O₂', Mr: 32.00, p: 'H₂O', Mp: 18.02, ratio: [1, 2] },
  { eq: '4Fe + 3O₂ → 2Fe₂O₃', r: 'Fe', Mr: 55.85, p: 'Fe₂O₃', Mp: 159.70, ratio: [4, 2] },
  { eq: '2Al + 3Cl₂ → 2AlCl₃', r: 'Cl₂', Mr: 70.90, p: 'AlCl₃', Mp: 133.33, ratio: [3, 2] },
  { eq: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O', r: 'C₃H₈', Mr: 44.09, p: 'CO₂', Mp: 44.01, ratio: [1, 3] },
  { eq: '2KClO₃ → 2KCl + 3O₂', r: 'KClO₃', Mr: 122.55, p: 'O₂', Mp: 32.00, ratio: [2, 3] },
];

registerChemTemplate({
  id: 'chem1-aq-04-percent-yield',
  chapterId: CH4, section: '4-5', band: 2, mental: false,
  name: 'Percent yield from a reactant mass and an actual yield',
  concepts: ['percent-yield', 'limiting-reactant-theoretical-yield'],
  generate: (rng, h) => {
    const x = h.pick(YIELD_RXNS);
    const mass = h.int(105, 899) / 10;
    const [a, b] = x.ratio;
    const theo = mass / x.Mr * (b / a) * x.Mp;
    const actualStr = (theo * h.int(52, 94) / 100).toPrecision(3);
    const actual = Number(actualStr);
    const right = actual / theo * 100;
    return {
      stem: `For ${x.eq}, ${mass.toFixed(1)} g of ${x.r} reacts completely (the other reactants are in excess) and ${actualStr} g of ${x.p} is collected. What is the percent yield? (${x.r} = ${mm(x.Mr)}, ${x.p} = ${mm(x.Mp)} g/mol)`,
      ...h.choices(pct(right), [
        { value: pct(theo / actual * 100), error: 'ratio-inverted', why: 'divided theoretical by actual — percent yield is ACTUAL / theoretical, and cannot exceed 100% for a clean product' },
        ...(a !== b ? [{ value: pct(actual / (mass / x.Mr * x.Mp) * 100), error: 'ignored-mole-ratio', why: `skipped the ${a}:${b} mole ratio from the balanced equation` }] : []),
        { value: pct(actual / mass * 100), error: 'used-reactant-mass', why: 'divided by the reactant mass instead of the theoretical yield of product' },
        { value: pct(100 - right), error: 'reported-loss', why: 'that is the percent LOST, not the percent yield' },
        { value: `${(right / 100).toFixed(3)}%`, error: 'forgot-times-100', why: 'left the ratio as a decimal fraction and never multiplied by 100' },
      ]),
      explanation: `Theoretical yield: ${mass.toFixed(1)} g / ${mm(x.Mr)} = ${(mass / x.Mr).toFixed(4)} mol ${x.r} × ${b}/${a} = ${(mass / x.Mr * b / a).toFixed(4)} mol ${x.p} × ${mm(x.Mp)} = ${sf3(theo)} g. Percent yield = actual / theoretical × 100 = ${actualStr} / ${sf3(theo)} × 100 = ${pct(right)}.`,
    };
  },
});

// acid : base mole ratio from the neutralization equation.
const TITRATIONS = [
  { acid: 'HCl', base: 'NaOH', eq: 'HCl + NaOH → NaCl + H₂O', ratio: [1, 1] },
  { acid: 'HNO₃', base: 'KOH', eq: 'HNO₃ + KOH → KNO₃ + H₂O', ratio: [1, 1] },
  { acid: 'H₂SO₄', base: 'NaOH', eq: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O', ratio: [1, 2] },
  { acid: 'HNO₃', base: 'Ba(OH)₂', eq: '2HNO₃ + Ba(OH)₂ → Ba(NO₃)₂ + 2H₂O', ratio: [2, 1] },
  { acid: 'HCl', base: 'Ca(OH)₂', eq: '2HCl + Ca(OH)₂ → CaCl₂ + 2H₂O', ratio: [2, 1] },
  { acid: 'H₂C₂O₄', base: 'NaOH', eq: 'H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O', ratio: [1, 2] },
  { acid: 'H₃PO₄', base: 'NaOH', eq: 'H₃PO₄ + 3NaOH → Na₃PO₄ + 3H₂O', ratio: [1, 3] },
  { acid: 'H₃PO₄', base: 'Ca(OH)₂', eq: '2H₃PO₄ + 3Ca(OH)₂ → Ca₃(PO₄)₂ + 6H₂O', ratio: [2, 3] },
];

registerChemTemplate({
  id: 'chem1-aq-04-titration-molarity',
  chapterId: CH5, section: '4-6', band: 3, mental: false,
  name: 'Titration: molarity of an acid from the volume of base',
  concepts: ['titration-calculations'],
  generate: (rng, h) => {
    const t = h.pick(TITRATIONS);
    const Va = h.pick([10.00, 15.00, 20.00, 25.00, 40.00, 50.00]);
    const Mb = h.int(500, 2500) / 10000;
    const Vb = h.int(1000, 4800) / 100;
    const [a, b] = t.ratio;
    const molB = Mb * Vb / 1000;
    const right = molB * (a / b) / (Va / 1000);
    return {
      stem: `A ${Va.toFixed(2)} mL sample of ${t.acid}(aq) is titrated with ${Mb.toFixed(4)} M ${t.base}(aq). Equivalence is reached after ${Vb.toFixed(2)} mL of base. What is the molarity of the ${t.acid}? (${t.eq})`,
      ...h.choices(`${sf4(right)} M`, [
        ...(a !== b ? [{ value: `${sf4(molB / (Va / 1000))} M`, error: 'ignored-mole-ratio', why: `treated it as 1:1; the equation says ${a} ${t.acid} : ${b} ${t.base}` }] : []),
        ...(a !== b ? [{ value: `${sf4(molB * (b / a) / (Va / 1000))} M`, error: 'ratio-inverted', why: 'used the mole ratio upside down' }] : []),
        { value: `${sf4(Mb * Va / Vb * (a / b))} M`, error: 'volumes-swapped', why: 'used the acid volume to get moles of base and divided by the base volume' },
        { value: `${sf4(molB * (a / b))} M`, error: 'reported-moles', why: 'stopped at moles of acid and never divided by the acid volume in liters' },
        { value: `${sf4(Mb)} M`, error: 'assumed-equal', why: 'assumed the acid has the same molarity as the base' },
      ]),
      explanation: `mol ${t.base} = ${Mb.toFixed(4)} mol/L × ${(Vb / 1000).toFixed(5)} L = ${sci(molB, 3)} mol. Ratio ${a} ${t.acid} : ${b} ${t.base} → mol ${t.acid} = ${sci(molB * a / b, 3)} mol. Divide by ${(Va / 1000).toFixed(5)} L of acid: ${sf4(right)} M.`,
    };
  },
});

const GRAVIMETRIC = [
  { ppt: 'AgCl', Mppt: 143.32, analyte: 'Cl', Man: 35.45, reagent: 'excess AgNO₃' },
  { ppt: 'AgCl', Mppt: 143.32, analyte: 'NaCl', Man: 58.44, reagent: 'excess AgNO₃' },
  { ppt: 'BaCO₃', Mppt: 197.34, analyte: 'Na₂CO₃', Man: 105.99, reagent: 'excess Ba(NO₃)₂' },
  { ppt: 'BaSO₄', Mppt: 233.39, analyte: 'SO₄²⁻', Man: 96.06, reagent: 'excess BaCl₂' },
  { ppt: 'BaSO₄', Mppt: 233.39, analyte: 'S', Man: 32.06, reagent: 'excess BaCl₂ (after converting all S to sulfate)' },
];

registerChemTemplate({
  id: 'chem1-aq-04-gravimetric-percent',
  chapterId: CH5, section: '4-6', band: 3, mental: false,
  name: 'Gravimetric analysis: mass percent from a precipitate',
  concepts: ['gravimetric-analysis'],
  generate: (rng, h) => {
    const g = h.pick(GRAVIMETRIC);
    const sample = h.int(4000, 9999) / 10000;
    const frac = h.int(12, 88) / 100;
    const pptStr = (sample * frac * g.Mppt / g.Man).toPrecision(4);
    const pptMass = Number(pptStr);
    const right = pptMass / g.Mppt * g.Man / sample * 100;
    return {
      stem: `A ${sample.toFixed(4)} g sample is treated with ${g.reagent}, and ${pptStr} g of ${g.ppt}(s) is collected. What is the mass percent of ${g.analyte} in the sample? (${g.ppt} = ${g.Mppt}, ${g.analyte} = ${g.Man} g/mol)`,
      ...h.choices(pct(right), [
        { value: pct(pptMass / sample * 100), error: 'used-precipitate-mass', why: `treated the precipitate mass as if it were all ${g.analyte}` },
        { value: pct(pptMass * g.Mppt / g.Man / sample * 100), error: 'ratio-inverted', why: 'multiplied by the molar masses upside down' },
        { value: pct(100 - right), error: 'reported-remainder', why: `that is the percent that is NOT ${g.analyte}` },
        { value: pct(pptMass / g.Mppt * g.Man * 100), error: 'forgot-sample-mass', why: 'never divided by the sample mass' },
        { value: `${(right / 100).toFixed(3)}%`, error: 'forgot-times-100', why: 'left the ratio as a decimal fraction and never multiplied by 100' },
      ]),
      explanation: `mol ${g.ppt} = ${pptStr} / ${g.Mppt} = ${sci(pptMass / g.Mppt, 3)} mol = mol ${g.analyte} (1:1). Mass ${g.analyte} = × ${g.Man} = ${(pptMass / g.Mppt * g.Man).toFixed(4)} g. ÷ ${sample.toFixed(4)} g sample × 100 = ${pct(right)}.`,
    };
  },
});

// Neutralization: acid + base -> salt + water. Distractors are the classic charge mistakes.
const NEUTRALIZATIONS = [
  { acid: 'HCl', base: 'NaOH', salt: 'NaCl', w: ['NaCl₂', 'NaOHCl', 'Na₂Cl'] },
  { acid: 'HNO₃', base: 'KOH', salt: 'KNO₃', w: ['K(NO₃)₂', 'KOH₂NO₃', 'K₂NO₃'] },
  { acid: 'H₂SO₄', base: 'NaOH', salt: 'Na₂SO₄', w: ['NaSO₄', 'Na(SO₄)₂', 'NaHSO₄OH'] },
  { acid: 'HCl', base: 'Mg(OH)₂', salt: 'MgCl₂', w: ['MgCl', 'Mg₂Cl', 'Mg(OH)Cl₂'] },
  { acid: 'HNO₃', base: 'Ca(OH)₂', salt: 'Ca(NO₃)₂', w: ['CaNO₃', 'Ca₂NO₃', 'Ca(NO₃)₃'] },
  { acid: 'HBr', base: 'LiOH', salt: 'LiBr', w: ['LiBr₂', 'Li₂Br', 'LiOHBr'] },
  { acid: 'H₂SO₄', base: 'Ba(OH)₂', salt: 'BaSO₄', w: ['Ba₂SO₄', 'Ba(SO₄)₂', 'BaOHSO₄'] },
  { acid: 'HCl', base: 'Al(OH)₃', salt: 'AlCl₃', w: ['AlCl', 'Al₃Cl', 'AlCl₂'] },
  { acid: 'HClO₄', base: 'NaOH', salt: 'NaClO₄', w: ['Na(ClO₄)₂', 'Na₂ClO₄', 'NaCl'] },
  { acid: 'H₃PO₄', base: 'KOH', salt: 'K₃PO₄', w: ['KPO₄', 'K(PO₄)₃', 'K₂PO₄'] },
];
const STRONG_ACIDS = ['HCl', 'HBr', 'HI', 'HNO₃', 'HClO₄', 'H₂SO₄'];
const WEAK_ACIDS = ['HF', 'CH₃COOH (acetic acid)', 'HNO₂', 'H₂CO₃', 'H₃PO₄', 'HCN'];

// §4-6 combustion analysis, exactly as the book works it: every C ends up in CO2 and every H in
// H2O, TWO H per water; mol H / mol C gives the empirical formula. Hydrocarbons only, like the
// book's examples. Masses are at the book's milligram scale (0.00126 g of polyethylene).
const HYDROCARBONS = [
  { name: 'polyethylene', emp: [1, 2] },
  { name: 'polystyrene', emp: [1, 1] },
  { name: 'methane', emp: [1, 4] },
  { name: 'ethane', emp: [1, 3] },
  { name: 'propane', emp: [3, 8] },
  { name: 'butane', emp: [2, 5] },
  { name: 'propyne', emp: [3, 4] },
  { name: 'pentane', emp: [5, 12] },
  { name: 'cyclohexene', emp: [3, 5] },
  { name: 'toluene', emp: [7, 8] },
];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const hc = (c, h) => formula([['C', c], ['H', h]]);
const reduced = (c, h) => { const g = gcd(c, h); return hc(c / g, h / g); };

registerChemTemplate({
  id: 'chem1-aq-04-combustion-analysis',
  chapterId: CH5, section: '4-6', band: 3, mental: false,
  name: 'Combustion analysis: empirical formula from CO2 and H2O masses',
  concepts: ['combustion-analysis'],
  generate: (rng, h) => {
    const x = h.pick(HYDROCARBONS);
    const [c, hy] = x.emp;
    const sample = h.int(100, 400) / 100000;
    const units = sample / (c * AM.C + hy * AM.H);
    const co2Str = (units * c * 44.01).toPrecision(3);
    const h2oStr = (units * (hy / 2) * 18.02).toPrecision(3);
    const co2 = Number(co2Str);
    const h2o = Number(h2oStr);
    const molC = co2 / 44.01;
    const molH = (2 * h2o) / 18.02;
    return {
      stem: `A ${sample.toFixed(5)}-g sample of ${x.name}, a hydrocarbon, is burned completely in a combustion analysis, producing ${co2Str} g of CO₂ and ${h2oStr} g of H₂O. What is its empirical formula?`,
      ...h.choices(hc(c, hy), [
        { value: reduced(2 * c, hy), error: 'forgot-two-H-per-water', why: 'counted one H per H₂O — every water molecule carries TWO hydrogens, so mol H = 2 × mol H₂O' },
        { value: hc(2 * c, 2 * hy), error: 'not-simplest', why: 'right ratio, not the simplest whole numbers' },
        ...(c !== hy ? [{ value: hc(hy, c), error: 'subscripts-swapped', why: 'put the H count on carbon and the C count on hydrogen' }] : []),
        { value: reduced(c, 2 * hy), error: 'doubled-H', why: 'doubled the hydrogen twice — mol H₂O × 2 is already mol H' },
      ]),
      explanation: `All the carbon ends up in CO₂ and all the hydrogen in H₂O. mol C = ${co2Str} g ÷ 44.01 g/mol × 1 C per CO₂ = ${sci(molC)} mol. mol H = ${h2oStr} g ÷ 18.02 g/mol × 2 H per H₂O = ${sci(molH)} mol. H : C = ${(molH / molC).toFixed(3)} : 1${c > 1 ? `, which is ${hy} : ${c} as whole numbers` : ''} → ${hc(c, hy)}. (No balanced equation is needed — only the C and H counts. The sample mass isn't used for a pure hydrocarbon; it would be, to find O by difference, if the compound contained oxygen.)`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-aq-04-neutralization-salt',
  chapterId: CH5, section: '4-3', band: 2, mental: true,
  name: 'Acid-base neutralization: the salt formed',
  concepts: ['acid-base-neutralization'],
  generate: (rng, h) => {
    const n = h.pick(NEUTRALIZATIONS);
    return {
      stem: `${n.acid}(aq) is neutralized by ${n.base}(aq). acid + base → salt + water. What is the formula of the salt?`,
      ...h.choices(n.salt, n.w.map((v) => ({ value: v, error: 'charges-not-balanced', why: 'the cation and anion charges do not sum to zero' }))),
      explanation: `The metal cation from the base pairs with the anion left after the acid gives up its H⁺. Balance the charges so they sum to zero: ${n.salt}. The water comes from H⁺ + OH⁻ → H₂O.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-aq-04-strong-acid',
  chapterId: CH5, section: '4-3', band: 1, mental: true,
  name: 'Recognising the strong acids',
  concepts: ['acid-base-neutralization'],
  generate: (rng, h) => {
    const flip = h.int(0, 1) === 1;
    const pool = flip ? WEAK_ACIDS : STRONG_ACIDS;
    const other = flip ? STRONG_ACIDS : WEAK_ACIDS;
    const right = h.pick(pool);
    const wrong = [...other].sort(() => rng() - 0.5).slice(0, 3);
    return {
      stem: flip
        ? 'Which of these is a WEAK acid (only partly ionized in water)?'
        : 'Which of these is a STRONG acid (essentially completely ionized in water)?',
      ...h.choices(right, wrong),
      explanation: `The book's six strong acids: ${STRONG_ACIDS.join(', ')}. Everything else you will meet in this chapter (HF, acetic acid, HNO₂, H₂CO₃, H₃PO₄, HCN) is weak. "Strong" means how completely it ionizes, not how dangerous it is.`,
    };
  },
});
