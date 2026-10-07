// CHEM 1210 — Exam 2 (Ch 1-4) items from the PROFESSOR'S OWN Exam 2 review sheet.
//
// Source: IMG_8608.HEIC (Q1-22) + IMG_8609.HEIC (Q23-34), photographed by Trey 2026-10-06 and
// transcribed the same hour by a parallel session into
// `SupplementalCourseDocs/CHEM 1210/IMG_8608-8609_exam-prep-study-guide.{md,json}` — read those,
// never re-OCR the photos. The sheet has NO answer key: every answer below was worked here and
// every number recomputed. Stems are the sheet's wording (verbatim is required for his own course
// material — theknowledgebase/CLAUDE.md), except where a figure had to be put into words (Q21,
// Q24) and Q18, which the handout gets wrong (see its explanation).
//
// Same shape as examReviewItems.js; registered as templates in engine/templates/real-items-ch01-ch02.js.

const SRC = (n, extra) => `Professor's Exam 2 review sheet, Q${n}${extra ? ` — ${extra}` : ''}. Worked answer computed (no key was handed out).`;

export const REVIEW2_REAL_ITEMS = [
  {
    section: '3-4', provenance: SRC(1),
    stem: 'What mass of calcium hydroxide is in 10 mL of 2.4M calcium hydroxide?',
    choices: ['1.8 g', '0.024 g', '1.8 × 10³ g', '1.4 g'], correctIndex: 0,
    explanation: 'mol = M × L = 2.4 mol/L × 0.010 L = 0.024 mol Ca(OH)₂. Molar mass Ca(OH)₂ = 40.08 + 2(16.00 + 1.008) = 74.10 g/mol. 0.024 × 74.10 = 1.78 g → 1.8 g (2 sig figs). Traps: 0.024 g stops at moles; 1.8 × 10³ g forgets mL → L; 1.4 g uses "CaOH" (one hydroxide) — calcium is 2+, so it needs two OH⁻.',
  },
  {
    section: '4-4', provenance: SRC(2),
    stem: 'Determine the mols of chlorine gas that could be produced from 52.5 g of NaCl.',
    choices: ['0.449 mol', '0.898 mol', '1.80 mol', '0.740 mol'], correctIndex: 0,
    explanation: '2 NaCl → 2 Na + Cl₂, so 2 mol NaCl give 1 mol Cl₂. 52.5 g ÷ 58.44 g/mol = 0.898 mol NaCl × (1 Cl₂ / 2 NaCl) = 0.449 mol Cl₂. 0.898 skips the ratio; 1.80 uses it upside down; 0.740 divides 52.5 g by Cl₂\'s molar mass, as if the 52.5 g were chlorine.',
  },
  {
    section: '4-2', provenance: SRC(3), noMath: true,
    stem: 'What is the coefficient in front of the oxygen when the equation for the combustion of C3H8 is balanced?',
    choices: ['5', '4', '10', '13'], correctIndex: 0,
    explanation: 'C₃H₈ + O₂ → CO₂ + H₂O. Carbon: 3 CO₂. Hydrogen: 8 H → 4 H₂O. Oxygen on the right: 3(2) + 4(1) = 10 O atoms = 5 O₂. C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O. (4 is the water; 10 counts O atoms instead of O₂ molecules; 13 is butane\'s 2 C₄H₁₀ + 13 O₂.)',
  },
  {
    section: '4-4', provenance: SRC(4),
    stem: 'How many moles of N2 can be formed by the decomposition of 0.530 mol of ammonia, NH3?',
    choices: ['0.265 mol', '0.530 mol', '1.06 mol', '0.795 mol'], correctIndex: 0,
    explanation: 'Balance first: 2 NH₃ → N₂ + 3 H₂. 0.530 mol NH₃ × (1 N₂ / 2 NH₃) = 0.265 mol N₂. 0.795 is the H₂ (×3/2); 1.06 multiplies by 2 instead of dividing; 0.530 assumes 1:1.',
  },
  {
    section: '3-2', provenance: SRC(5),
    stem: 'An individual has 0.030 mol of hemoglobin (molar mass = 64,456 g/mol) in their blood. How many hemoglobin molecules is this?',
    choices: ['1.8 × 10²² molecules', '1.9 × 10³ molecules', '5.0 × 10⁻²⁶ molecules', '1.2 × 10²⁷ molecules'], correctIndex: 0,
    explanation: 'Molecules = mol × Avogadro\'s number = 0.030 × 6.022 × 10²³ = 1.8 × 10²². The molar mass is a distractor — moles → molecules never needs it. 1.9 × 10³ is the MASS in grams (0.030 × 64,456); 5.0 × 10⁻²⁶ divides by Avogadro; 1.2 × 10²⁷ multiplies the mass by Avogadro.',
  },
  {
    section: '3-2', provenance: SRC(6),
    stem: 'Determine the mass in grams of 0.600 mol of ozone molecules, O3.',
    choices: ['28.8 g', '9.60 g', '19.2 g', '0.0125 g'], correctIndex: 0,
    explanation: 'O₃ = 3 × 16.00 = 48.00 g/mol. 0.600 mol × 48.00 g/mol = 28.8 g. 9.60 g uses a single O atom (16.00); 19.2 g uses O₂ (32.00); 0.0125 g divides instead of multiplying.',
  },
  {
    section: '3-2', provenance: SRC(7, 'the element is made up, which is fine: identity is irrelevant'),
    stem: 'How many moles of cheronisopierium atoms correspond to 1.56x10^4 atoms of cheronisopierium?',
    choices: ['2.59 × 10⁻²⁰ mol', '9.39 × 10²⁷ mol', '3.86 × 10¹⁹ mol', '2.59 × 10²⁰ mol'], correctIndex: 0,
    explanation: 'mol = atoms ÷ 6.022 × 10²³ = 1.56 × 10⁴ ÷ 6.022 × 10²³ = 2.59 × 10⁻²⁰ mol. A tiny count of atoms is a VERY small number of moles — if your answer is huge, you multiplied (9.39 × 10²⁷) or divided upside down (3.86 × 10¹⁹). The made-up element name changes nothing.',
  },
  {
    section: '3-2', provenance: SRC(8),
    stem: 'How many moles of Bi atoms are needed to combine with 3.32 mol of O atoms to make bismuth (III) oxide?',
    choices: ['2.21 mol', '4.98 mol', '3.32 mol', '1.11 mol'], correctIndex: 0,
    explanation: 'Bismuth(III) is Bi³⁺, oxide is O²⁻ → charges balance at Bi₂O₃ (2 × 3+ = 6+, 3 × 2− = 6−). Bi : O = 2 : 3, so 3.32 mol O × 2/3 = 2.21 mol Bi. 4.98 uses 3/2 (upside down); 1.11 divides by 3 only.',
  },
  {
    section: '3-3', provenance: SRC(9, 'hydrogen is the unstated remainder, 100 − 60.0 − 35.5 = 4.5%'),
    stem: 'What is the empirical formula for a compound containing only carbon, hydrogen and oxygen, that was found to be 60.0% carbon and 35.5% oxygen.',
    choices: ['C₉H₈O₄', 'C₂H₂O', 'C₉O₄', 'C₁₈H₁₆O₈'], correctIndex: 0,
    explanation: 'Hydrogen = 100 − 60.0 − 35.5 = 4.5%. Per 100 g: C 60.0/12.01 = 4.996 mol, H 4.5/1.008 = 4.46 mol, O 35.5/16.00 = 2.219 mol. ÷ 2.219 → C 2.25, H 2.01, O 1. A .25 ratio is multiplied by 4, never rounded: C₉H₈O₄ (aspirin). C₂H₂O rounds 2.25 down; C₉O₄ forgets the hydrogen the problem didn\'t state; C₁₈H₁₆O₈ is right ratio, not simplest.',
  },
  {
    section: '3-3', provenance: SRC(10),
    stem: 'A compound with an empirical formula of C8H4NNaO4S is found to have a molar mass twice that of the empirical mass. What is the molecular formula of the compound?',
    choices: ['C₁₆H₈N₂Na₂O₈S₂', 'C₈H₄NNaO₄S', 'C₁₆H₈NNaO₄S', 'C₁₆H₈N₂Na₂O₈S'], correctIndex: 0,
    explanation: 'n = 2, so EVERY subscript doubles — including the invisible 1s on N, Na and S: C₁₆H₈N₂Na₂O₈S₂. The wrong options double only some of them (or none).',
  },
  {
    section: '2-7', provenance: SRC(11), noMath: true,
    stem: 'What is the chemical formula for nitrous acid?',
    choices: ['HNO₂', 'HNO₃', 'H₂NO₂', 'HNO'], correctIndex: 0,
    explanation: '"-ous acid" comes from the "-ite" anion: nitrite is NO₂⁻, add one H⁺ to balance its 1− charge → HNO₂. Nitric acid (from nitrate, NO₃⁻) is HNO₃ — the -ic/-ate one has the extra oxygen.',
  },
  {
    section: '1-7', provenance: SRC(12),
    stem: 'How many significant figures does the following calculations yield? (12.2-0.2)/1.02',
    choices: ['3', '1', '2', '4'], correctIndex: 0,
    explanation: 'Do the parentheses first with the ADDITION/SUBTRACTION rule (decimal places): 12.2 and 0.2 both go to the tenths → 12.0, which has 3 sig figs. Then DIVISION (sig-fig count): 12.0 (3) ÷ 1.02 (3) → 3 sig figs (11.8). "1" applies the multiplication rule to 0.2 — but 0.2 was in a subtraction, where only decimal places matter.',
  },
  {
    section: '2-7', provenance: SRC(13, 'osmium has more than one charge, so the Roman numeral is required'), noMath: true,
    stem: 'Name the following ionic compound OsO',
    choices: ['osmium(II) oxide', 'osmium oxide', 'osmium(I) oxide', 'osmium monoxide'], correctIndex: 0,
    explanation: 'Oxide is O²⁻ and there is one Os per O, so osmium must be 2+ → osmium(II) oxide. Ionic names never use mono-/di- prefixes (those are for molecular compounds), and a transition metal with several possible charges needs its Roman numeral.',
  },
  {
    section: '2-3', provenance: SRC(14), noMath: true,
    stem: 'How many protons and electrons are in each atom of ³⁵₁₇Cl⁻?',
    choices: ['17 protons, 18 electrons', '17 protons, 17 electrons', '17 protons, 16 electrons', '18 protons, 17 electrons'], correctIndex: 0,
    explanation: 'The bottom number (17) is the atomic number = protons. The 1− charge means one MORE electron than protons: 18. (35 is the mass number — protons + neutrons — so it has 18 neutrons, which the question didn\'t ask.)',
  },
  {
    section: '1-7', provenance: SRC(15),
    stem: 'How many square ft are in 1.0 square km?',
    choices: ['1.1 × 10⁷ ft²', '3.3 × 10³ ft²', '1.0 × 10⁶ ft²', '9.3 × 10⁻⁸ ft²'], correctIndex: 0,
    explanation: '1 km = 1000 m and 1 ft = 0.3048 m, so 1 km = 3281 ft. A SQUARE unit squares the factor too: 1.0 km² × (3281 ft / 1 km)² = 1.0 × 1.076 × 10⁷ = 1.1 × 10⁷ ft². 3.3 × 10³ forgets to square; 1.0 × 10⁶ is m², not ft²; 9.3 × 10⁻⁸ is the factor upside down.',
  },
  {
    section: '2-3', provenance: SRC(16),
    stem: 'What is the average mass for hypothetical element X? 17X, with a mass of 16.97 units is 22.45% abundant and the only other isotope is 19X with a mass of 19.01 units.',
    choices: ['18.55 units', '17.99 units', '17.43 units', '3.810 units'], correctIndex: 0,
    explanation: 'The other isotope is 100 − 22.45 = 77.55%. Average = 0.2245(16.97) + 0.7755(19.01) = 3.810 + 14.742 = 18.55. Sanity check: it must sit closer to 19.01, the more abundant isotope. 17.99 is a plain average (ignores abundance); 17.43 swaps the abundances; 3.810 is just the first term.',
  },
  {
    section: '4-3', provenance: SRC(17), noMath: true,
    stem: 'Complete and balance the following equation then write the net ionic equation. Fe(NO3)3 + K3PO4 --> ... What is the coefficient in front of the Fe ion in the balanced net ionic equation?',
    choices: ['1', '2', '3', '6'], correctIndex: 0,
    explanation: 'Swap partners: Fe³⁺ + PO₄³⁻ → FePO₄ (charges 3+ and 3− balance 1:1; phosphates are insoluble → precipitate), and K⁺ + NO₃⁻ → KNO₃ (soluble). Fe(NO₃)₃(aq) + K₃PO₄(aq) → FePO₄(s) + 3 KNO₃(aq). Net ionic: Fe³⁺(aq) + PO₄³⁻(aq) → FePO₄(s). Coefficient on Fe³⁺: 1. (3 is the KNO₃ coefficient — a spectator.)',
  },
  {
    section: '3-3', provenance: SRC(18, '⚠ the handout asks for "percent potassium in Ca3(PO4)2", which contains no potassium; asked here as intended'),
    stem: '(Review sheet Q18, corrected — the handout says "potassium", but Ca₃(PO₄)₂ contains none.) What is the percent calcium in Ca₃(PO₄)₂?',
    choices: ['38.76%', '12.92%', '23.08%', '61.24%'], correctIndex: 0,
    explanation: 'Formula mass Ca₃(PO₄)₂ = 3(40.08) + 2(30.97) + 8(16.00) = 120.24 + 61.94 + 128.00 = 310.18. %Ca = 120.24 / 310.18 × 100 = 38.76%. 12.92% uses one Ca instead of three; 23.08% is 3 Ca out of 13 atoms (atom count, not mass); 61.24% is everything EXCEPT calcium. ⚠ On the real exam, if a question names an element the formula doesn\'t contain, ask the professor — don\'t guess.',
  },
  {
    section: '3-3', provenance: SRC(19, 'masses in grams'),
    stem: 'If a hydrate of copper (II) sulfate with an unknown number of water molecules has an initial mass of 24.97 and then a mass of 15.97 after it is dehydrated by heating, what was the original formula of the hydrate?',
    choices: ['CuSO₄·5H₂O', 'CuSO₄·9H₂O', 'CuSO₄·H₂O', 'CuSO₄·3H₂O'], correctIndex: 0,
    explanation: 'Water lost = 24.97 − 15.97 = 9.00 g → 9.00 / 18.02 = 0.4994 mol H₂O. What\'s left is anhydrous CuSO₄: 15.97 / 159.62 = 0.1000 mol. Ratio H₂O : CuSO₄ = 0.4994 / 0.1000 = 4.99 ≈ 5 → CuSO₄·5H₂O. 9H₂O uses the 9.00 GRAMS as if they were moles.',
  },
  {
    section: '4-3', provenance: SRC(20), noMath: true,
    stem: 'What compound will react with aqueous potassium carbonate to form a precipitate? Iron (iii) chloride, ammonium acetate or Lithium phosphate.',
    choices: ['Iron(III) chloride', 'Ammonium acetate', 'Lithium phosphate', 'None of them'], correctIndex: 0,
    explanation: 'Swap partners and check each new pair. FeCl₃ + K₂CO₃ → Fe₂(CO₃)₃ (carbonates are insoluble unless Group 1 or ammonium → precipitate) + KCl. Ammonium acetate → NH₄⁺/K⁺ with CO₃²⁻/acetate: all soluble, no reaction. Lithium phosphate → K₃PO₄ and Li₂CO₃: Group 1 salts, soluble.',
  },
  {
    section: '2-6', provenance: SRC(21, 'the particle diagram described in words'), noMath: true,
    stem: 'A box contains 3 large circles labelled "anion" and 6 small circles labelled "cation". Which compound could this diagram represent? NaCl, MgCl₂, Li₂S, H₂S',
    choices: ['Li₂S', 'MgCl₂', 'NaCl', 'H₂S'], correctIndex: 0,
    explanation: 'Twice as many cations as anions → formula M₂X, so the cation is 1+ and the anion 2−. Li₂S fits (2 Li⁺ : 1 S²⁻), and Li⁺ is much smaller than S²⁻, matching the small/large circles. MgCl₂ is the reverse ratio (1 : 2); NaCl is 1 : 1; H₂S is molecular — no ions at all.',
  },
  {
    section: '2-3', provenance: SRC(22, '"formas" is the handout\'s typo'), noMath: true,
    stem: 'Element X formas a bromide with a formula of XBr. What is element X if its cation has 18 electrons?',
    choices: ['Potassium (K)', 'Argon (Ar)', 'Calcium (Ca)', 'Chlorine (Cl)'], correctIndex: 0,
    explanation: 'XBr with Br⁻ means X is 1+. A 1+ ion has one FEWER electron than its protons: 18 electrons → 19 protons → potassium, K⁺. Argon has 18 electrons as a neutral atom and forms no cation; Ca²⁺ also has 18 electrons but would make XBr₂.',
  },
  {
    section: '4-3', provenance: SRC(23), noMath: true,
    stem: 'A solution of which acid will not conduct electricity well? H2SO4, HCl, HNO2, HClO4',
    choices: ['HNO₂', 'H₂SO₄', 'HCl', 'HClO₄'], correctIndex: 0,
    explanation: 'Conductivity needs ions. H₂SO₄, HCl and HClO₄ are three of the six strong acids — essentially fully ionized. Nitrous acid, HNO₂, is weak: only a small fraction ionizes, so few ions and poor conduction.',
  },
  {
    section: '1-6', provenance: SRC(24, 'the burette picture described in words'),
    stem: 'A burette (numbers INCREASE going down) has a line every 0.1 mL between the 6 and 7 mL marks. The bottom of the meniscus sits between the 6.6 and 6.7 lines, about a third of the way down from 6.6. Which reading is reported with the correct number of significant figures?',
    choices: ['6.63 mL', '6.6 mL', '6.67 mL', '6.630 mL'], correctIndex: 0,
    explanation: 'Record every certain digit plus ONE estimated digit: the lines give 6.6, and "a third of the way to 6.7" estimates the hundredths → 6.63 mL (3 sig figs). 6.6 drops the estimated digit; 6.630 claims a digit the burette can\'t give; 6.67 reads the scale upward like a graduated cylinder — a burette counts DOWN.',
  },
  {
    section: '4-3', provenance: SRC(25), noMath: true,
    stem: 'A 0.01 M solution made with which sodium salt should result in the highest conductivity? chloride, sulfate, phosphate or acetate?',
    choices: ['Sodium phosphate', 'Sodium sulfate', 'Sodium chloride', 'Sodium acetate'], correctIndex: 0,
    explanation: 'Same concentration, so the winner is the one that releases the most ions per formula unit: Na₃PO₄ → 3 Na⁺ + PO₄³⁻ = 4 ions; Na₂SO₄ → 3; NaCl → 2; NaC₂H₃O₂ → 2. More ions → more conduction.',
  },
  {
    section: '3-4', provenance: SRC(26),
    stem: 'What is the molarity of sodium ion in a solution of 2 grams of sodium sulfate in 100 mL of water?',
    choices: ['0.28 M', '0.14 M', '2.8 × 10⁻⁴ M', '0.42 M'], correctIndex: 0,
    explanation: 'Na₂SO₄ = 2(22.99) + 32.06 + 4(16.00) = 142.04 g/mol. 2 g ÷ 142.04 = 0.0141 mol Na₂SO₄ → TWO Na⁺ each = 0.0282 mol Na⁺. ÷ 0.100 L = 0.28 M (0.3 M to the 1 sig fig "2 grams" really allows). 0.14 M is the Na₂SO₄ molarity, not the Na⁺; 0.42 M counts all 3 ions; 2.8 × 10⁻⁴ M divides by 100 mL instead of 0.100 L.',
  },
  {
    section: '3-4', provenance: SRC(27, 'asks for water ADDED, not the final volume'),
    stem: 'How much water should be added to 35 mL of 2.7 M X to create a solution of 1.0 M X?',
    choices: ['about 60 mL (59.5 mL)', '95 mL', '13 mL', '35 mL'], correctIndex: 0,
    explanation: 'M₁V₁ = M₂V₂ → V₂ = (2.7)(35 mL) / 1.0 = 94.5 mL FINAL volume. The question asks how much to ADD: 94.5 − 35 = 59.5 ≈ 60 mL. 95 mL is the final volume (the trap the wording sets); 13 mL puts the molarities upside down.',
  },
  {
    section: '3-4', provenance: SRC(28),
    stem: 'Determine the molarity for the following solution: 1.8 x 10^4 mg of HCl in 0.075 L of solution.',
    choices: ['6.6 M', '6.6 × 10³ M', '0.49 M', '0.15 M'], correctIndex: 0,
    explanation: '1.8 × 10⁴ mg = 18 g HCl. ÷ 36.46 g/mol = 0.494 mol. ÷ 0.075 L = 6.6 M. 6.6 × 10³ M treats the mg as grams; 0.49 M stops at moles; 0.15 M divides the volume by the moles.',
  },
  {
    section: '3-4', provenance: SRC(29),
    stem: 'What is the molarity of KMnO4 in a solution of 0.0908 g of KMnO4 in 0.500 L of solution?',
    choices: ['1.15 × 10⁻³ M', '5.75 × 10⁻⁴ M', '0.182 M', '2.87 × 10⁻⁴ M'], correctIndex: 0,
    explanation: 'KMnO₄ = 39.10 + 54.94 + 4(16.00) = 158.04 g/mol. 0.0908 / 158.04 = 5.75 × 10⁻⁴ mol ÷ 0.500 L = 1.15 × 10⁻³ M. 5.75 × 10⁻⁴ forgets the volume; 0.182 is g/L, not mol/L; 2.87 × 10⁻⁴ multiplies by the volume.',
  },
  {
    section: '3-4', provenance: SRC(30),
    stem: 'What volume of 2.3 M solution of NaCl is needed to deliver 1.0 gram of sodium ion?',
    choices: ['19 mL', '7.4 mL', '53 mL', '0.019 mL'], correctIndex: 0,
    explanation: '1.0 g Na⁺ ÷ 22.99 g/mol = 0.0435 mol Na⁺ = 0.0435 mol NaCl (one Na per NaCl). V = mol / M = 0.0435 / 2.3 = 0.0189 L = 19 mL. 7.4 mL uses NaCl\'s molar mass, as if 1.0 g of NaCl were wanted; 53 mL divides M by mol; 0.019 mL is the liters number labelled as mL.',
  },
  {
    section: '3-4', provenance: SRC(31),
    stem: 'How many mL of 12.1 M HCl is needed to make 1 L of 100 mM HCl?',
    choices: ['8.3 mL', '121 mL', '8.3 × 10³ mL', '0.0083 mL'], correctIndex: 0,
    explanation: '100 mM = 0.100 M. V₁ = M₂V₂ / M₁ = (0.100)(1 L) / 12.1 = 0.00826 L = 8.3 mL. 8.3 × 10³ mL reads 100 mM as 100 M; 121 mL inverts the molarities; 0.0083 mL is liters labelled as mL.',
  },
  {
    section: '4-5', provenance: SRC(32),
    stem: 'If 25.0 mL of 0.300 M CaCl2 is mixed with 40.0 mL of 0.150 M Na2CO3. CaCl2(aq) + Na2CO3(aq) -> CaCO3(s) + 2NaCl(aq) and 0.525 g of CaCO3 is collected, what is the percent yield?',
    choices: ['87.4%', '69.9%', '114%', '12.6%'], correctIndex: 0,
    explanation: 'CaCl₂: 0.0250 L × 0.300 = 7.50 × 10⁻³ mol. Na₂CO₃: 0.0400 L × 0.150 = 6.00 × 10⁻³ mol. 1 : 1 ratio → Na₂CO₃ runs out first (limiting). Theoretical CaCO₃ = 6.00 × 10⁻³ mol × 100.09 g/mol = 0.601 g. Percent yield = 0.525 / 0.601 × 100 = 87.4%. 69.9% uses CaCl₂ (the excess reactant); 114% divides upside down; 12.6% is the loss.',
  },
  {
    section: '4-6', provenance: SRC(33),
    stem: 'A 20.00 mL sample of HCl requires 18.60 mL of 0.250 M Ca(OH)2 for complete neutralization. 2HCl + Ca(OH)2 -> CaCl2 + 2H2O. What is the molarity of the HCl?',
    choices: ['0.465 M', '0.233 M', '0.116 M', '0.538 M'], correctIndex: 0,
    explanation: 'mol Ca(OH)₂ = 0.01860 L × 0.250 = 4.65 × 10⁻³. Each Ca(OH)₂ neutralizes 2 HCl → 9.30 × 10⁻³ mol HCl. ÷ 0.02000 L = 0.465 M. 0.233 M ignores the 2; 0.116 M halves instead of doubling; 0.538 M swaps the two volumes.',
  },
  {
    section: '4-6', provenance: SRC(34),
    stem: 'Complete combustion of a compound containing only carbon and hydrogen produces 8.80 g CO2 and 3.60 g H2O. What is the empirical formula of the compound?',
    choices: ['CH₂', 'CH', 'CH₄', 'C₂H₄'], correctIndex: 0,
    explanation: 'mol C = 8.80 / 44.01 = 0.200 (1 C per CO₂). mol H = 3.60 / 18.02 × 2 = 0.400 (TWO H per H₂O). H : C = 2 : 1 → CH₂. CH forgets the 2 H per water; CH₄ doubles twice; C₂H₄ is the right ratio but not the simplest.',
  },
];
