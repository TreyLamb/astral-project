// CHEM 1210 — Exam 1 (Ch 1-2) items built from the PROFESSOR'S OWN official review study guide.
//
// Source: two photographed pages titled "Ch 1-2 Review", handed out by the instructor and uploaded
// by Trey 2026-09-08 as IMG_0007.HEIC / IMG_0008.HEIC. 26 questions. This is the closest thing that
// exists to the exam blueprint, and it settles three things the other banks could only guess at:
//
//   1. EXAM 1 IS CH 1-2. The guide says so in its title, matching syllabusMap's EXAMS entry.
//   2. THE EXAM IS OPERATIONAL, NOT CONCEPTUAL. Of 26 questions, ~22 ask you to compute a number,
//      name a real formula, or write a real formula. Almost none ask "which statement best
//      describes…". ch1Items.js and ch2Items.js are the other way round — heavy on definitions —
//      so this file is what rebalances the Exam 1 pool toward what he will actually be asked.
//   3. THE DIFFICULTY CEILING. The hardest things on the guide are: a squared unit conversion,
//      solving a weighted average BACKWARDS for isotope abundance, identifying an element from a
//      mass ratio, and scaling a law-of-definite-proportions ratio. Nothing harder than that
//      appears, and nothing requiring stoichiometry, moles, or solutions appears at all.
//
// Two pools, same convention as ch1Items.js / ch2Items.js:
//   REVIEW_REAL_ITEMS  — his 26, transcribed and worked. Verbatim is REQUIRED here, not merely
//                        allowed: this is his own course material and the point is to practise the
//                        actual questions. (theknowledgebase/CLAUDE.md rule 2's scope note.)
//   REVIEW_ITERATIONS  — same skill, different numbers, per QUESTION-DOCTRINE rule 1. Every one is
//                        pinned to a numbered review question so the difficulty band is his, not
//                        mine, and distractors are named error modes rather than noise.
//
// ✂️ Three of his 26 carry figures that cannot ship as-is: Q4 and Q5 are particle-diagram boxes and
// Q14 is a four-target archer diagram. The particle diagrams are re-expressed as text descriptions
// of the same boxes (the skill — telling an element from a compound from a mixture in a picture —
// survives the translation intact). Q14 is left to ch1Items.js, which already carries an archer
// item with the pattern described in words.

const REAL = (n, extra) => ({
  provenance: `Professor's official "Ch 1-2 Review" study guide, question ${n} — verbatim${extra ? `, ${extra}` : ''}. Worked answer computed by agent.`,
});

export const REVIEW_REAL_ITEMS = [
  {
    section: '1-7',
    stem: 'A rectangular bar of this metal measuring 1.5 cm x 2.5cm x 3.5 cm was found to have a density of 10.1 g/cm³. What is the mass of this block?',
    choices: ['1.3 × 10² g (130 g)', '132.56 g', '13 g', '0.77 g'],
    correctIndex: 0,
    explanation:
      'Volume of a rectangular solid is length × width × height:\n\n    V = 1.5 cm × 2.5 cm × 3.5 cm = 13.125 cm³\n\nThen rearrange density:\n\n    m = d × V = 10.1 g/cm³ × 13.125 cm³ = 132.5625 g\n\nSignificant figures: 1.5, 2.5 and 3.5 each carry 2 sig figs, so the volume — and therefore the mass — is limited to 2 sig figs.\n\n    132.5625 g -> 1.3 × 10² g\n\n132.56 g is the unrounded value (it claims 5 sig figs from 2-sig-fig measurements). 13 g is the volume with the density never applied. 0.77 g divides by the density instead of multiplying.',
    ...REAL(1),
  },
  {
    section: '1-6',
    stem: 'It is true that an area that has the dimensions 1ft by 1ft could also be described as 12 in by 12 in. Use this info to convert an area of 144in² to ft². (Remember, conversion factors should always equal what number?)',
    choices: ['1.00 ft²', '12 ft²', '1728 ft²', '0.0833 ft²'],
    correctIndex: 0,
    explanation:
      'A conversion factor always equals 1 — that is the hint in the question. 1 ft / 12 in = 1, so SQUARING it also equals 1:\n\n    (1 ft / 12 in)² = 1 ft² / 144 in² = 1\n\nNow the units cancel:\n\n    144 in² × (1 ft² / 144 in²) = 1.00 ft²\n\nThe trap is squaring the unit but not the number. 12 ft² comes from dividing by 12 instead of 144 — i.e. using 1 ft/12 in unsquared. 1728 ft² multiplies by 12 instead of dividing. 0.0833 is just 1/12.',
    ...REAL(2, 'the parenthetical hint is his'),
  },
  {
    section: '1-4',
    stem: 'When dry ice sublimes, what is the substance in the gas that results?',
    choices: [
      'Carbon dioxide, CO₂ — the same substance, now in the gas phase',
      'Carbon and oxygen gas, released as the compound breaks apart',
      'Water vapour',
      'Oxygen gas, O₂',
    ],
    correctIndex: 0,
    explanation:
      'Sublimation is a PHYSICAL change: solid goes straight to gas with no change in chemical identity. Dry ice is solid CO₂, so the gas is CO₂.\n\nThe distractors are the same misconception in three costumes — that a phase change breaks bonds. It does not. No new substance is produced, which is exactly what makes it physical rather than chemical.',
    ...REAL(3),
  },
  // ✂️ Review questions 4 and 5 (the particle-diagram boxes) are DELIBERATELY ABSENT from this
  // "real" pool. Both were read at full resolution off the photograph and neither has a single
  // determinable answer as printed:
  //
  //   Q4 "which box has only elements?" — box 2 holds two open-open pairs plus two lone filled
  //      atoms, and box 3 holds two open-open pairs plus two filled-filled pairs. BOTH contain
  //      nothing but elements, so both are correct.
  //   Q5 "which box contains at least 1 compound?" — all four boxes visibly contain at least one
  //      open-filled bonded pair, so all four are correct.
  //
  // Rather than guess which he meant and ship a wrong key, the skill is covered by the two
  // unambiguous agent-written items in REVIEW_ITERATIONS below, and this is flagged for Trey to
  // ask his professor. AGENT-PROMPT §11: "whether a source you believe contains an error is
  // actually wrong" is an ASK, never a guess.
  {
    section: '1-7',
    stem: 'Perform the following calculations involving measurements and round the results so that they are written to the correct number of significant figures and have the correct units. 1.02 L - 0.010 L =',
    choices: ['1.01 L', '1.010 L', '1.0 L', '1 L'],
    correctIndex: 0,
    explanation:
      'Addition and subtraction use DECIMAL PLACES, not significant figures:\n\n    1.02  L   <- 2 decimal places\n  - 0.010 L   <- 3 decimal places\n    ---------\n    1.010 L   -> round to 2 decimal places -> 1.01 L\n\nThe answer keeps the FEWEST decimal places of any input, which is 1.02\'s two.\n\n1.010 L is the unrounded arithmetic — it claims a thousandths place that 1.02 never measured. 1.0 L and 1 L apply the multiplication rule (counting sig figs) to a subtraction, which is the single most common error on this topic.',
    ...REAL(6),
  },
  {
    section: '2-4',
    stem: 'Which elements form a diatomic element/compound in nature?',
    choices: [
      'H, N, O, F, Cl, Br, I — the seven diatomics',
      'Only O and N, because they make up the air',
      'H, O, C, N, S, P, Cl',
      'All nonmetals form diatomic molecules',
    ],
    correctIndex: 0,
    explanation:
      'Seven elements occur as diatomic molecules in their natural elemental state: H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂.\n\nOn the periodic table they make a "7" shape — the four halogens in group 17, plus O, N and H. Common memory hooks: "HONClBrIF" or "Have No Fear Of Ice Cold Beer".\n\nCarbon, sulfur and phosphorus are NOT diatomic (S is S₈, P is P₄, carbon is a network solid), which is what makes the third option a real trap rather than filler.',
    ...REAL(7),
  },
  {
    section: '1-3',
    stem: 'Is oxygen a compound, an element, a homogenous mixture or a heterogenous mixture?',
    choices: [
      'An element',
      'A compound, because O₂ has two atoms bonded together',
      'A homogenous mixture',
      'A heterogenous mixture',
    ],
    correctIndex: 0,
    explanation:
      'Oxygen is an ELEMENT — one kind of atom, atomic number 8. It is found as O₂, but a bond between two atoms OF THE SAME ELEMENT does not make a compound.\n\nOption 2 is the misconception the question exists to catch: "it has two atoms, so it must be a compound". A compound needs two or more DIFFERENT elements. Neither mixture option applies — a mixture has more than one substance that could be physically separated.',
    ...REAL(8),
  },
  {
    section: '1-6',
    stem: 'How many mL are in 15.000 gallons? ( 1L= 0.2642 gal)',
    choices: ['5.678 × 10⁴ mL', '3.963 × 10³ mL', '5.678 × 10¹ mL', '5.678 × 10⁷ mL'],
    correctIndex: 0,
    explanation:
      'Set up the chain so the unwanted units cancel:\n\n    15.000 gal × (1 L / 0.2642 gal) × (1000 mL / 1 L)\n\n    gal cancels, then L cancels, leaving mL.\n\n    15.000 / 0.2642 = 56.7752 L\n    56.7752 L × 1000 = 56775.2 mL\n\nSignificant figures: 15.000 has 5, 0.2642 has 4 -> the answer takes the smaller, 4.\n\n    -> 5.678 × 10⁴ mL\n\n3.963 × 10³ MULTIPLIES by 0.2642 instead of dividing — the classic "flipped the conversion factor" error, and the reason to write the factor as a fraction and check that gal cancels. 5.678 × 10¹ never converts L to mL. 5.678 × 10⁷ multiplies by 10⁶.',
    ...REAL(9),
  },
  {
    section: '1-6',
    stem: 'How many mg are in 2.00032 kg?',
    choices: ['2.00032 × 10⁶ mg', '2.00032 × 10³ mg', '2.00032 × 10⁹ mg', '2.00032 × 10⁻⁶ mg'],
    correctIndex: 0,
    explanation:
      'Two prefix steps, both known exactly:\n\n    2.00032 kg × (1000 g / 1 kg) = 2000.32 g\n    2000.32 g × (1000 mg / 1 g)  = 2000320 mg = 2.00032 × 10⁶ mg\n\nkilo- is 10³ and milli- is 10⁻³, so kg -> mg is 10⁶ in total.\n\nAll six significant figures survive: prefix conversions are EXACT definitions, not measurements, so they never limit sig figs.\n\n10³ makes only one of the two steps. 10⁻⁶ goes the wrong direction — a milligram is smaller than a kilogram, so the NUMBER must get bigger.',
    ...REAL(10),
  },
  {
    section: '2-7',
    stem: 'What is the name of this acid H₂CO₃',
    choices: ['Carbonic acid', 'Carbonous acid', 'Hydrocarbonic acid', 'Hydrogen carbonate'],
    correctIndex: 0,
    explanation:
      'H₂CO₃ is an OXYACID — hydrogen plus an oxygen-containing polyatomic ion. The anion decides the name:\n\n    CO₃²⁻ is carbonATE  ->  carbonIC acid\n\nThe two rules, worth memorising as a pair:\n\n    -ate anion  ->  -ic acid    (sulfate -> sulfuric, nitrate -> nitric)\n    -ite anion  ->  -ous acid   (sulfite -> sulfurous, nitrite -> nitrous)\n\n"Carbonous" would need CO₂²⁻ (carbonite). The "hydro-" prefix belongs only to BINARY acids — hydrogen plus ONE other element, like HCl -> hydrochloric acid — never to an oxyacid. "Hydrogen carbonate" names the ion HCO₃⁻, not this acid.',
    ...REAL(11),
  },
  {
    section: '1-6',
    stem: 'How many cm³ are in 2.32 kL?',
    choices: ['2.32 × 10⁶ cm³', '2.32 × 10³ cm³', '2.32 × 10⁹ cm³', '2.32 × 10⁻³ cm³'],
    correctIndex: 0,
    explanation:
      'This one needs the identity 1 mL = 1 cm³, which is a definition worth knowing cold.\n\n    2.32 kL × (1000 L / 1 kL)   = 2320 L\n    2320 L × (1000 mL / 1 L)    = 2.32 × 10⁶ mL\n    2.32 × 10⁶ mL × (1 cm³/1 mL) = 2.32 × 10⁶ cm³\n\nSo kL -> cm³ is 10⁶, the same factor as kg -> mg, for the same reason: kilo- is 10³ up and milli- is 10³ down.\n\n10³ stops at litres. 10⁹ treats cm³ as if it were 10⁻⁶ of a litre (that would be a cubic millimetre).',
    ...REAL(12),
  },
  {
    section: '1-6',
    stem: 'How many inches are in 232 km? (2.54 cm= 1 inch)',
    choices: ['9.13 × 10⁶ in', '5.89 × 10⁷ in', '9.13 × 10⁴ in', '9.13 × 10³ in'],
    correctIndex: 0,
    explanation:
      'Chain the factors so every unwanted unit cancels:\n\n    232 km × (1000 m / 1 km) × (100 cm / 1 m) × (1 in / 2.54 cm)\n\n    km -> m -> cm -> in\n\n    232 km = 2.32 × 10⁵ m = 2.32 × 10⁷ cm\n    2.32 × 10⁷ cm / 2.54 = 9.1339 × 10⁶ in\n\n232 has 3 sig figs (2.54 is an exact definition, so it does not limit anything):\n\n    -> 9.13 × 10⁶ in\n\n5.89 × 10⁷ MULTIPLIES by 2.54 instead of dividing. An inch is bigger than a centimetre, so the number of inches must be SMALLER than the number of centimetres — that check catches the flip instantly. The other two drop a factor of 100 or 1000.',
    ...REAL(13),
  },
  {
    section: '1-7',
    stem: 'A chemical has a density of 1.192 g/mL. What is the mass in grams of 1.192 mL of this chemical?',
    choices: ['1.421 g', '1.192 g', '1.000 g', '0.8389 g'],
    correctIndex: 0,
    explanation:
      'Density is mass per volume, so mass is density times volume:\n\n    m = d × V = 1.192 g/mL × 1.192 mL = 1.420864 g\n\nBoth values carry 4 sig figs, so the answer does too:\n\n    -> 1.421 g\n\nThe question is built to bait you: the density and the volume are the SAME NUMBER, which tempts the answer 1.192 g (as if they cancelled) or 1.000 g (as if they divided). They do not — the units mL cancel, the numbers multiply. 0.8389 g is 1/1.192, i.e. dividing by the density instead of multiplying.',
    ...REAL(15),
  },
  {
    section: '1-7',
    stem: 'Perform the following calculations involving measurements and round the results so that they are written to the correct number of significant figures and have the correct units. 2.02 g / 0.013 mL =',
    choices: ['1.6 × 10² g/mL', '155.4 g/mL', '160 g', '1.6 × 10² mL/g'],
    correctIndex: 0,
    explanation:
      'Division uses SIGNIFICANT FIGURES (unlike addition, which uses decimal places):\n\n    2.02 g / 0.013 mL = 155.3846... g/mL\n\n    2.02  -> 3 sig figs\n    0.013 -> 2 sig figs   (leading zeros are never significant)\n\nThe answer takes the FEWEST, so 2 sig figs:\n\n    -> 1.6 × 10² g/mL\n\nNote why scientific notation matters here: written as "160 g/mL" the trailing zero is ambiguous about whether it is significant. 1.6 × 10² is unambiguous.\n\nThe question says "and have the correct units", so watch them too — g divided by mL gives g/mL, not g and not mL/g. 155.4 g/mL is the unrounded value.',
    ...REAL(16),
  },
  {
    section: '1-6',
    stem: 'How many significant figures does the following measured quantity have? 17.040',
    choices: ['5', '4', '3', '2'],
    correctIndex: 0,
    explanation:
      'Walk the digits: 1, 7, 0, 4, 0.\n\n    1, 7   — nonzero, always significant\n    0      — a CAPTIVE zero (between nonzeros), always significant\n    4      — nonzero\n    0      — a TRAILING zero AFTER a decimal point, significant\n\nThat is 5.\n\nThe trailing zero is the whole point of the question. Writing 17.040 rather than 17.04 is a deliberate claim that the measurement was good to the thousandths place. Answering 4 means dropping it; the only zeros that are never significant are LEADING ones (0.0126 has 3).',
    ...REAL(17),
  },
  {
    section: '2-2',
    stem: '33.32 g of XY contains 10.25 g of X. Its other component is Y. How many grams of Y are in a second 20.00 g sample of XY?',
    choices: ['13.85 g', '6.15 g', '23.07 g', '10.25 g'],
    correctIndex: 0,
    explanation:
      'This is the LAW OF DEFINITE PROPORTIONS: any sample of a pure compound has the same mass ratio of its elements, whatever its size.\n\nStep 1 — find Y in the known sample:\n\n    Y = 33.32 g - 10.25 g = 23.07 g\n\nStep 2 — get the mass fraction of Y:\n\n    23.07 / 33.32 = 0.6924\n\nStep 3 — apply that same fraction to the new sample:\n\n    0.6924 × 20.00 g = 13.85 g Y\n\n6.15 g applies X\'s fraction (10.25/33.32 = 0.3076) instead of Y\'s — the answer to a question that was not asked. 23.07 g is Y in the FIRST sample, forgetting to scale to 20.00 g. 10.25 g is X\'s mass copied across.',
    ...REAL(18),
  },
  {
    section: '2-3',
    stem: 'How many electrons, protons and neutrons are in ²¹F⁻ ?',
    choices: [
      '10 electrons, 9 protons, 12 neutrons',
      '9 electrons, 9 protons, 12 neutrons',
      '10 electrons, 9 protons, 21 neutrons',
      '9 electrons, 10 protons, 11 neutrons',
    ],
    correctIndex: 0,
    explanation:
      'Read the symbol in three moves:\n\n    PROTONS come from the element, never from the notation. F is fluorine, atomic number 9 -> 9 protons. This never changes; change it and it is no longer fluorine.\n\n    NEUTRONS = mass number - atomic number:\n        21 - 9 = 12 neutrons\n\n    ELECTRONS = protons - charge. The charge is 1-, meaning one EXTRA electron:\n        9 - (-1) = 10 electrons\n\nThe sign is the trap. A negative charge means electrons were GAINED, so a 1- anion has MORE electrons than protons. Option 2 ignores the charge entirely; option 3 reads the mass number as the neutron count; option 4 changes the proton count, which would make it neon.',
    ...REAL(19),
  },
  {
    section: '2-3',
    stem: 'If an element X had a naturally occurring mass of 11.3 u, and it had 2 isotopes, ⁸X and ¹²X, what percentage of the isotopes are ¹²X? (Use 8.00 u and 12.0 u as the masses of ⁸X and ¹²X)',
    choices: ['82.5%', '17.5%', '75.0%', '94.2%'],
    correctIndex: 0,
    explanation:
      'This is the weighted average run BACKWARDS — you know the average and want an abundance. Let f be the fraction that is ¹²X; then (1 - f) is the fraction that is ⁸X, because the two must total 1.\n\n    8.00(1 - f) + 12.0(f) = 11.3\n    8.00 - 8.00f + 12.0f  = 11.3\n    8.00 + 4.00f          = 11.3\n    4.00f                 = 3.30\n    f                     = 0.825  ->  82.5%\n\nSanity check before trusting it: 11.3 sits much closer to 12.0 than to 8.00, so the heavy isotope must be the ABUNDANT one. 82.5% passes; 17.5% (which is the ⁸X fraction) fails that check immediately.\n\nRunning that check first is the cheapest way to catch a sign slip on this type — and it works on every weighted-average problem.',
    ...REAL(20),
  },
  {
    section: '2-6',
    stem: 'Write the formula for the following: trinitrogen dichloride',
    choices: ['N₃Cl₂', 'N₂Cl₃', 'NCl₃', 'N₃Cl'],
    correctIndex: 0,
    explanation:
      'Greek prefixes on BOTH elements means this is a MOLECULAR (covalent) compound — two nonmetals. The prefixes are the subscripts, read straight off:\n\n    tri-  nitrogen  -> N₃\n    di-   chloride  -> Cl₂\n\n    -> N₃Cl₂\n\nNo charge balancing happens here, and no reducing. That is the key difference from an ionic formula: molecular prefixes state the exact atom count, so N₃Cl₂ is never simplified.\n\nN₂Cl₃ swaps the two prefixes. NCl₃ drops "tri-" from nitrogen and misreads "di-". Prefix list to have cold: mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6.',
    ...REAL(21),
  },
  {
    section: '2-6',
    stem: 'Write the formula for the following: Molybdenum(II) sulfate',
    choices: ['MoSO₄', 'Mo₂SO₄', 'Mo(SO₄)₂', 'MoSO₃'],
    correctIndex: 0,
    explanation:
      'Two pieces, then balance the charges:\n\n    Molybdenum(II) — the Roman numeral IS the charge -> Mo²⁺\n    sulfate        — a polyatomic ion you must know -> SO₄²⁻\n\n    +2 and -2 already cancel one-to-one:\n\n    -> MoSO₄\n\nBecause the charges are equal and opposite, no subscripts are needed at all. Mo₂SO₄ and Mo(SO₄)₂ both cross the charges over without then reducing — crossing 2 and 2 gives Mo₂(SO₄)₂, which MUST reduce to MoSO₄.\n\nMoSO₃ uses sulfITE (SO₃²⁻) instead of sulfATE. That one oxygen is the entire difference between the two names: -ate has more oxygen, -ite has one fewer.',
    ...REAL(22),
  },
  {
    section: '2-3',
    stem: 'A certain element X forms a compound with oxygen in which there are two atoms of X for every three atoms of O. In this compound, 1.336 g of X are combined with 1.000 g of oxygen. Use the average atomic mass of oxygen to calculate the average atomic mass of X. Use your calculated atomic mass to identify the element X.',
    choices: [
      '32.06 u — sulfur (S)',
      '21.4 u — neon (Ne)',
      '48.1 u — titanium (Ti)',
      '16.0 u — oxygen (O)',
    ],
    correctIndex: 0,
    explanation:
      'The formula is X₂O₃, so the ATOM ratio is 2 X for every 3 O. Work in moles, because the formula ratio is a ratio of atoms, not of grams.\n\nStep 1 — moles of oxygen, using its average atomic mass 16.00 u:\n\n    1.000 g / 16.00 g/mol = 0.06250 mol O\n\nStep 2 — moles of X from the 2:3 ratio:\n\n    0.06250 mol O × (2 mol X / 3 mol O) = 0.04167 mol X\n\nStep 3 — atomic mass is grams per mole:\n\n    1.336 g / 0.04167 mol = 32.06 u\n\nStep 4 — find 32.06 on the periodic table: SULFUR.\n\n21.4 u skips step 2 and uses a 1:1 ratio — the single most common error here, and the reason the formula must be read before any arithmetic. 48.1 u inverts the ratio to 3:2.',
    ...REAL(23),
  },
  {
    section: '2-7',
    stem: 'Name the following ionic compound using the Stock system (the Roman numeral system). OsO₂',
    choices: ['Osmium(IV) oxide', 'Osmium(II) oxide', 'Osmium dioxide', 'Osmium(I) oxide'],
    correctIndex: 0,
    explanation:
      'The Stock system puts the METAL\'S charge in Roman numerals. Osmium is a transition metal with more than one possible charge, so you must work its charge out from the anion.\n\n    Oxide is always O²⁻. There are two of them: 2 × (-2) = -4 total negative.\n    The compound is neutral, so osmium must supply +4.\n\n    -> Osmium(IV) oxide\n\nOsmium(II) reads the SUBSCRIPT as the charge. That is the error this question is built to catch: the subscript 2 belongs to oxygen, and it tells you the total negative charge, not osmium\'s.\n\n"Osmium dioxide" uses Greek prefixes, which belong to MOLECULAR compounds (two nonmetals) — never to an ionic compound with a metal.',
    ...REAL(24),
  },
  {
    section: '2-7',
    stem: 'Name the following ionic compound using the Stock system (the Roman numeral system). CoCO₃',
    choices: ['Cobalt(II) carbonate', 'Cobalt(I) carbonate', 'Cobalt(II) carbonite', 'Cobalt carbon trioxide'],
    correctIndex: 0,
    explanation:
      'Split the formula into its two ions first — the hard part of this one is seeing where the split is:\n\n    Co | CO₃      NOT  C | O₃  and not Co | C | O₃\n\n    CO₃²⁻ is the carbonate ion, one unit.\n    One carbonate is -2, so cobalt must be +2.\n\n    -> Cobalt(II) carbonate\n\nThe formula CoCO₃ is deliberately confusing because Co (cobalt) and C followed by O (carbon, oxygen) sit right next to each other. Capitalisation is the only signal: Co is one element, C and O are two.\n\n"Carbonite" would be CO₂²⁻. "Cobalt carbon trioxide" applies molecular prefixes to an ionic compound.',
    ...REAL(25),
  },
  {
    section: '2-6',
    stem: 'Identify each of the following as molecular or ionic: N₂S₃, I₂O₄, I₄O₉, CsBr₄',
    choices: [
      'N₂S₃ molecular, I₂O₄ molecular, I₄O₉ molecular, CsBr₄ ionic',
      'All four are molecular',
      'All four are ionic',
      'N₂S₃ ionic, I₂O₄ molecular, I₄O₉ ionic, CsBr₄ molecular',
    ],
    correctIndex: 0,
    explanation:
      'One test decides all four: is a METAL present?\n\n    metal + nonmetal   -> IONIC\n    nonmetal + nonmetal -> MOLECULAR (covalent)\n\n    N₂S₃  — nitrogen and sulfur, both nonmetals      -> molecular\n    I₂O₄  — iodine and oxygen, both nonmetals        -> molecular\n    I₄O₉  — iodine and oxygen, both nonmetals        -> molecular\n    CsBr₄ — caesium is an ALKALI METAL, bromine is not -> ionic\n\nThe large and unusual subscripts are deliberate noise. They tell you nothing about bonding type; only the position of the elements on the periodic table does.\n\nThe one exception worth remembering: a compound with the ammonium ion NH₄⁺ is ionic despite containing no metal.',
    ...REAL(26),
  },
];

// ---------------------------------------------------------------------------------------------
// Iterations. Each is pinned to the review question whose SKILL and DIFFICULTY it copies — per
// QUESTION-DOCTRINE rule 1, an iteration changes the numbers, never the band. Distractors are the
// named error modes from the parent question's own worked answer.
// ---------------------------------------------------------------------------------------------

const ITER = (n, skill) => ({
  provenance: `Created by agent from the professor's official "Ch 1-2 Review" study guide, question ${n} (${skill}) — same skill and difficulty, different numbers.`,
});

const ITERATION_LITERALS = [
  {
    section: '1-3',
    stem: 'Four sealed boxes each hold particles. An open circle is an atom of one element; a filled circle is an atom of a different element. Which box contains ONLY elements — no compound anywhere in it? Box 1: four units, each one open circle bonded to one filled circle. Box 2: two units of two open circles bonded together, plus two units of two filled circles bonded together. Box 3: two units of two open circles bonded together, plus two units of one open bonded to one filled. Box 4: one lone open atom, one lone filled atom, and two units of one open bonded to one filled.',
    choices: [
      'Box 2',
      'Box 1',
      'Box 3',
      'Box 4',
    ],
    correctIndex: 0,
    explanation:
      'An ELEMENT is matter made of only one kind of atom. A bonded pair of IDENTICAL atoms — like O₂ — is still an element; bonding does not create a compound, having two DIFFERENT kinds of atom bonded together does.\n\n    Box 2: open-open and filled-filled only -> two elements, no compound. ✓\n    Box 1: every unit is open-filled -> a pure compound.\n    Box 3: open-open (element) mixed with open-filled (compound).\n    Box 4: lone atoms (elements) mixed with open-filled units (compound).\n\nThe trap is reading "two atoms bonded together" as "compound". Ask instead: are the two atoms the SAME kind? If yes, it is still an element.',
    provenance:
      'Written by agent to cover the skill in the professor\'s Ch 1-2 Review questions 4-5 (particle diagrams). His own two figures could not be transcribed with a single determinable answer — see the note in REVIEW_REAL_ITEMS — so this is a clean re-statement of the same skill, not his question.',
  },
  {
    section: '1-3',
    stem: 'Using the same key — an open circle is an atom of one element, a filled circle is an atom of a different element — which box contains AT LEAST ONE compound? Box 1: three units of two open circles bonded together, and one lone filled atom. Box 2: two lone open atoms and three lone filled atoms, none of them bonded. Box 3: two units of two filled circles bonded together, and two lone open atoms. Box 4: two units of two open circles bonded together, and one unit of one open bonded to one filled.',
    choices: [
      'Box 4',
      'Box 1',
      'Box 2',
      'Box 3',
    ],
    correctIndex: 0,
    explanation:
      'A COMPOUND is two or more DIFFERENT elements chemically bonded in a fixed ratio. Only an open-filled bonded unit qualifies.\n\n    Box 4: has one open-filled unit -> contains a compound. ✓\n    Box 1: open-open units and a lone filled atom — two different elements are PRESENT, but never bonded to each other. That is a MIXTURE of elements.\n    Box 2: unbonded atoms only -> a mixture of two elements.\n    Box 3: filled-filled units and lone open atoms -> again a mixture of elements.\n\nBox 1 and box 3 are the distractors that matter: "contains two different elements" is not the test. The elements must be BONDED TO EACH OTHER.',
    provenance:
      'Written by agent to cover the skill in the professor\'s Ch 1-2 Review questions 4-5 (particle diagrams). His own two figures could not be transcribed with a single determinable answer — see the note in REVIEW_REAL_ITEMS — so this is a clean re-statement of the same skill, not his question.',
  },
  {
    section: '1-7',
    stem: 'A rectangular block measuring 2.0 cm × 4.5 cm × 6.0 cm has a density of 8.92 g/cm³. What is the mass of the block?',
    choices: ['4.8 × 10² g', '481.7 g', '54 g', '6.1 g'],
    correctIndex: 0,
    explanation:
      '    V = 2.0 × 4.5 × 6.0 = 54 cm³\n    m = d × V = 8.92 g/cm³ × 54 cm³ = 481.68 g\n\nEvery dimension carries 2 sig figs, so the answer does too:\n\n    -> 4.8 × 10² g\n\n481.7 g keeps digits the measurements never supported. 54 g stops at the volume. 6.1 g divides by the density.',
    ...ITER(1, '3-D volume then mass from density'),
  },
  {
    section: '1-6',
    stem: 'A tabletop has an area of 7.50 ft². Convert this to in². (12 in = 1 ft)',
    choices: ['1.08 × 10³ in²', '90.0 in²', '0.0521 in²', '625 in²'],
    correctIndex: 0,
    explanation:
      'The conversion factor must be SQUARED, because the unit is squared:\n\n    (12 in / 1 ft)² = 144 in² / 1 ft²\n\n    7.50 ft² × (144 in² / 1 ft²) = 1080 in² = 1.08 × 10³ in²\n\n90.0 in² multiplies by 12 instead of 144 — squaring the unit but not the number, the error this whole question type exists to expose. 0.0521 divides instead of multiplying (an inch is smaller, so the NUMBER of in² must be larger). 625 is unrelated arithmetic.',
    ...ITER(2, 'squared unit conversion'),
  },
  {
    section: '1-6',
    stem: 'A room measures 3.00 m × 4.00 m. What is its floor area in cm²?',
    choices: ['1.20 × 10⁵ cm²', '1.20 × 10³ cm²', '1.20 × 10⁷ cm²', '12.0 cm²'],
    correctIndex: 0,
    explanation:
      '    Area = 3.00 m × 4.00 m = 12.0 m²\n\n    (100 cm / 1 m)² = 10 000 cm² / 1 m²\n\n    12.0 m² × 10 000 cm²/m² = 120 000 cm² = 1.20 × 10⁵ cm²\n\n1.20 × 10³ multiplies by 100 rather than 100² — the unsquared factor. 1.20 × 10⁷ squares twice. 12.0 never converts at all.',
    ...ITER(2, 'squared unit conversion'),
  },
  {
    section: '1-6',
    stem: 'How many mm³ are in 4.75 L?',
    choices: ['4.75 × 10⁶ mm³', '4.75 × 10³ mm³', '4.75 × 10⁹ mm³', '4.75 × 10⁻³ mm³'],
    correctIndex: 0,
    explanation:
      'Use the two definitions that make volume conversions tractable:\n\n    1 mL = 1 cm³        and        1 cm³ = 1000 mm³\n\n    4.75 L × (1000 mL / 1 L)   = 4750 mL\n    4750 mL × (1 cm³ / 1 mL)   = 4750 cm³\n    4750 cm³ × (1000 mm³/1 cm³) = 4.75 × 10⁶ mm³\n\nThe last step is the one people miss: a millimetre is 1/10 of a centimetre, so a CUBIC millimetre is 1/1000 of a cubic centimetre, not 1/10.\n\n4.75 × 10³ stops at cm³. 4.75 × 10⁹ applies the 1000 factor twice too many.',
    ...ITER(12, 'metric volume prefix chain'),
  },
  {
    section: '1-6',
    stem: 'How many µg are in 0.04500 g?',
    choices: ['4.500 × 10⁴ µg', '4.500 × 10¹ µg', '4.500 × 10⁷ µg', '4.500 × 10⁻² µg'],
    correctIndex: 0,
    explanation:
      'micro- (µ) is 10⁻⁶:\n\n    0.04500 g × (1 × 10⁶ µg / 1 g) = 45 000 µg = 4.500 × 10⁴ µg\n\nAll four sig figs survive — the prefix relationship is an exact definition and never limits them.\n\n4.500 × 10¹ uses milli- (10³) instead of micro-. 10⁻² goes the wrong way; a microgram is far smaller than a gram, so the number must grow.',
    ...ITER(10, 'metric mass prefix conversion'),
  },
  {
    section: '1-6',
    stem: 'How many feet are in 88.0 m? (1 in = 2.54 cm, 12 in = 1 ft)',
    choices: ['289 ft', '3.46 × 10³ ft', '26.8 ft', '224 ft'],
    correctIndex: 0,
    explanation:
      'Chain it and let the units cancel:\n\n    88.0 m × (100 cm/1 m) × (1 in/2.54 cm) × (1 ft/12 in)\n\n    88.0 m = 8800 cm\n    8800 / 2.54 = 3464.6 in\n    3464.6 / 12 = 288.7 ft\n\n    3 sig figs (88.0) -> 289 ft\n\n3.46 × 10³ stops at inches — always check the unit you actually landed on. 26.8 ft divides by 2.54 twice, and 224 ft multiplies by 2.54 somewhere it should divide.',
    ...ITER(13, 'multi-step length conversion'),
  },
  {
    section: '1-7',
    stem: 'A liquid has a density of 0.7850 g/mL. What is the mass of 25.0 mL of it?',
    choices: ['19.6 g', '31.8 g', '0.0314 g', '25.0 g'],
    correctIndex: 0,
    explanation:
      '    m = d × V = 0.7850 g/mL × 25.0 mL = 19.625 g\n\n25.0 carries 3 sig figs and limits the answer:\n\n    -> 19.6 g\n\n31.8 g divides the volume by the density instead of multiplying. 0.0314 g inverts the whole thing. A density BELOW 1 g/mL means the mass in grams must be LESS than the volume in millilitres — that check kills 31.8 g and 25.0 g at a glance.',
    ...ITER(15, 'mass from density and volume'),
  },
  {
    section: '1-7',
    stem: 'Perform the calculation and give the result with the correct number of significant figures and the correct units: 4.50 g / 0.0025 mL =',
    choices: ['1.8 × 10³ g/mL', '1800 g/mL', '1.80 × 10³ g/mL', '1.8 × 10³ mL/g'],
    correctIndex: 0,
    explanation:
      '    4.50 g / 0.0025 mL = 1800 g/mL\n\n    4.50   -> 3 sig figs\n    0.0025 -> 2 sig figs   (leading zeros never count)\n\nDivision keeps the FEWEST, so 2:\n\n    -> 1.8 × 10³ g/mL\n\n"1800 g/mL" written plainly is ambiguous — nothing in it says whether those trailing zeros are significant, which is exactly why scientific notation is required here. 1.80 × 10³ claims 3 sig figs. The last option inverts the units.',
    ...ITER(16, 'division with sig figs and derived units'),
  },
  {
    section: '1-7',
    stem: 'Perform the calculation and give the result with the correct number of significant figures: 25.6 mL + 0.084 mL =',
    choices: ['25.7 mL', '25.684 mL', '25.68 mL', '26 mL'],
    correctIndex: 0,
    explanation:
      'Addition is governed by DECIMAL PLACES:\n\n    25.6   mL   <- 1 decimal place\n  +  0.084 mL   <- 3 decimal places\n    ----------\n    25.684 mL   -> round to 1 decimal place -> 25.7 mL\n\n25.684 is unrounded. 25.68 rounds to 2 decimal places instead of 1. 26 mL applies the sig-fig (multiplication) rule to an addition — the same swap the professor tests in review question 6.',
    ...ITER(6, 'addition/subtraction decimal-place rule'),
  },
  {
    section: '1-6',
    stem: 'How many significant figures does the measured quantity 0.030400 have?',
    choices: ['5', '6', '3', '4'],
    correctIndex: 0,
    explanation:
      'Take the digits in order: 0, 0, 3, 0, 4, 0, 0.\n\n    0.0     — LEADING zeros, never significant (they only place the decimal)\n    3       — significant\n    0       — captive, significant\n    4       — significant\n    0, 0    — trailing AFTER a decimal point, significant\n\nCount the significant ones: 3, 0, 4, 0, 0 -> 5.\n\nAnswering 6 counts one leading zero. Answering 3 drops the trailing zeros, which is the same mistake as calling 17.040 four sig figs in review question 17.',
    ...ITER(17, 'significant figure counting'),
  },
  {
    section: '2-2',
    stem: '48.60 g of a compound AB contains 18.24 g of A. How many grams of B are in a 15.00 g sample of the same compound?',
    choices: ['9.37 g', '5.63 g', '30.36 g', '18.24 g'],
    correctIndex: 0,
    explanation:
      'Law of definite proportions — the mass ratio is fixed no matter the sample size.\n\n    B in the known sample = 48.60 - 18.24 = 30.36 g\n    mass fraction of B    = 30.36 / 48.60 = 0.6247\n    B in the new sample   = 0.6247 × 15.00 = 9.37 g\n\n5.63 g uses A\'s fraction (18.24/48.60 = 0.3753) — solving for the wrong element. 30.36 g is B in the FIRST sample, never scaled. 18.24 g copies A\'s mass across.',
    ...ITER(18, 'definite proportions, scaled to a new sample'),
  },
  {
    section: '2-3',
    stem: 'An element Q has an average atomic mass of 24.31 u and two isotopes, ²⁴Q (24.00 u) and ²⁶Q (26.00 u). What percentage of the isotopes are ²⁶Q?',
    choices: ['15.5%', '84.5%', '24.3%', '9.31%'],
    correctIndex: 0,
    explanation:
      'Let f be the fraction that is ²⁶Q; the rest, (1 - f), is ²⁴Q.\n\n    24.00(1 - f) + 26.00(f) = 24.31\n    24.00 + 2.00f           = 24.31\n    2.00f                   = 0.31\n    f                       = 0.155  ->  15.5%\n\nCheck it before moving on: 24.31 sits very close to 24.00, so the LIGHT isotope must dominate and the heavy one must be scarce. 15.5% passes; 84.5% (the ²⁴Q fraction) fails, and that check is the fastest way to catch the slip.',
    ...ITER(20, 'weighted average solved backwards for abundance'),
  },
  {
    section: '2-3',
    stem: 'How many protons, neutrons and electrons are in ²⁷Al³⁺ ? (Aluminium is atomic number 13.)',
    choices: [
      '13 protons, 14 neutrons, 10 electrons',
      '13 protons, 14 neutrons, 16 electrons',
      '13 protons, 27 neutrons, 10 electrons',
      '10 protons, 14 neutrons, 13 electrons',
    ],
    correctIndex: 0,
    explanation:
      '    PROTONS   = atomic number = 13 (fixed by the element itself)\n    NEUTRONS  = 27 - 13 = 14\n    ELECTRONS = 13 - (+3) = 10\n\nA POSITIVE charge means electrons were LOST, so a cation has FEWER electrons than protons — the opposite of the ²¹F⁻ case in review question 19. Getting the sign backwards gives 16, the second option.\n\nThe third reads the mass number as neutrons; the fourth changes the proton count, which would make it a different element entirely.',
    ...ITER(19, 'subatomic particle counts from isotope notation'),
  },
  {
    section: '2-3',
    stem: 'Boron has two isotopes: 19.9% is ¹⁰B (10.013 u) and 80.1% is ¹¹B (11.009 u). What is boron\'s average atomic mass?',
    choices: ['10.81 u', '10.51 u', '21.02 u', '10.61 u'],
    correctIndex: 0,
    explanation:
      'Convert percentages to decimals, then weight each mass by its abundance:\n\n    (0.199 × 10.013) + (0.801 × 11.009)\n  =  1.9926          +  8.8182\n  = 10.81 u\n\nCheck: the answer must land BETWEEN the two isotope masses, and closer to the abundant one (¹¹B at 80.1%). 10.81 does both.\n\n10.51 u is the plain unweighted average of 10.013 and 11.009 — ignoring abundance entirely, the most common error here. 21.02 u adds them instead of averaging, which falls outside the range and should be rejected on sight.',
    ...ITER(20, 'weighted average, forward direction'),
  },
  {
    section: '2-3',
    stem: 'An element Z forms a compound with oxygen in which there is one atom of Z for every one atom of O. In this compound, 2.505 g of Z are combined with 1.000 g of oxygen. What is the average atomic mass of Z, and what element is it?',
    choices: [
      '40.08 u — calcium (Ca)',
      '20.04 u — neon (Ne)',
      '80.16 u — bromine (Br)',
      '16.00 u — oxygen (O)',
    ],
    correctIndex: 0,
    explanation:
      'The formula is ZO, so the atom ratio is 1:1.\n\n    mol O = 1.000 g / 16.00 g/mol = 0.06250 mol\n    mol Z = 0.06250 × (1/1)       = 0.06250 mol\n    mass of Z per mole = 2.505 g / 0.06250 mol = 40.08 u\n\n40.08 on the periodic table is CALCIUM, and CaO (lime) is a real 1:1 oxide — a good sign the answer is sensible.\n\n20.04 u halves the result as if the ratio were 2:1; 80.16 u doubles it. Read the formula ratio BEFORE doing any arithmetic — that step, not the division, is where this question is won or lost.',
    ...ITER(23, 'element identification from a mass ratio'),
  },
  {
    section: '2-7',
    stem: 'Name the following ionic compound using the Stock system: Fe₂O₃',
    choices: ['Iron(III) oxide', 'Iron(II) oxide', 'Diiron trioxide', 'Iron(I) oxide'],
    correctIndex: 0,
    explanation:
      'Work the metal\'s charge out from the anion, which has a fixed one.\n\n    Three oxides: 3 × (-2) = -6 total negative\n    Two irons must supply +6, so each iron is +3.\n\n    -> Iron(III) oxide\n\nThe Roman numeral is the charge on ONE metal atom, never the subscript and never the total. Iron(II) reads the subscript 2 off the iron; that is the trap.\n\n"Diiron trioxide" uses Greek prefixes, which belong to molecular compounds only — an iron compound is ionic.',
    ...ITER(24, 'Stock-system naming from a formula'),
  },
  {
    section: '2-7',
    stem: 'Name the following ionic compound using the Stock system: Cu₃(PO₄)₂',
    choices: ['Copper(II) phosphate', 'Copper(III) phosphate', 'Copper(II) phosphite', 'Tricopper diphosphate'],
    correctIndex: 0,
    explanation:
      'Balance the charges to find copper\'s:\n\n    Two phosphates: 2 × (-3) = -6 total negative\n    Three coppers must supply +6, so each copper is +2.\n\n    -> Copper(II) phosphate\n\nThis is the reverse of "criss-cross": the subscripts came FROM the charges, so you undo the crossing rather than reading the subscripts as charges. Copper(III) reads the 3 off the copper subscript, which is where phosphate\'s charge went.\n\nPhosphITE is PO₃³⁻ — one fewer oxygen. The last option applies molecular prefixes to an ionic compound.',
    ...ITER(24, 'Stock-system naming with a polyatomic ion'),
  },
  {
    section: '2-6',
    stem: 'Write the formula for the following: Chromium(III) sulfite',
    choices: ['Cr₂(SO₃)₃', 'Cr₃(SO₃)₂', 'Cr₂(SO₄)₃', 'CrSO₃'],
    correctIndex: 0,
    explanation:
      '    Chromium(III) -> Cr³⁺\n    sulfite       -> SO₃²⁻\n\nCross the charges to get the subscripts, then check the total:\n\n    Cr³⁺ takes subscript 2, SO₃²⁻ takes subscript 3\n\n    -> Cr₂(SO₃)₃\n\n    Check:  2 × (+3) = +6   and   3 × (-2) = -6.  Neutral. ✓\n\nThe polyatomic ion needs PARENTHESES because its subscript multiplies the whole group.\n\nCr₃(SO₃)₂ crosses them the wrong way. Cr₂(SO₄)₃ uses sulfATE — that single extra oxygen is the whole difference between the two names. CrSO₃ ignores the charges entirely.',
    ...ITER(22, 'formula from a name, Roman numeral plus polyatomic'),
  },
  {
    section: '2-6',
    stem: 'Write the formula for the following: dinitrogen pentoxide',
    choices: ['N₂O₅', 'N₅O₂', 'NO₅', 'N₂O₄'],
    correctIndex: 0,
    explanation:
      'Greek prefixes on both elements means MOLECULAR, so the prefixes are the subscripts directly:\n\n    di-    nitrogen -> N₂\n    penta- oxide    -> O₅\n\n    -> N₂O₅\n\nNo charge balancing and no reducing — that is what separates molecular naming from ionic. ("Pentoxide" drops the a of "penta-" before a vowel; the count is still five.)\n\nN₅O₂ swaps the prefixes. NO₅ ignores "di-". N₂O₄ would be dinitrogen tetroxide.',
    ...ITER(21, 'formula from a molecular name'),
  },
  {
    section: '2-7',
    stem: 'What is the name of the acid H₂SO₃?',
    choices: ['Sulfurous acid', 'Sulfuric acid', 'Hydrosulfuric acid', 'Hydrogen sulfite'],
    correctIndex: 0,
    explanation:
      'Identify the polyatomic ion first, then apply the oxyacid rule:\n\n    SO₃²⁻ is sulfITE  ->  -ous acid  ->  sulfurOUS acid\n\nThe pair to keep straight:\n\n    SO₄²⁻ sulfATE -> sulfurIC acid   (more oxygen)\n    SO₃²⁻ sulfITE -> sulfurOUS acid  (one fewer oxygen)\n\n"Hydro-" is only for BINARY acids — hydrogen plus one other element, like H₂S -> hydrosulfuric acid. An acid containing oxygen never takes it. "Hydrogen sulfite" names the ion HSO₃⁻.',
    ...ITER(11, 'oxyacid naming'),
  },
  {
    section: '2-7',
    stem: 'What is the name of the acid HBr when dissolved in water?',
    choices: ['Hydrobromic acid', 'Bromic acid', 'Bromous acid', 'Hydrogen bromide acid'],
    correctIndex: 0,
    explanation:
      'HBr has NO oxygen, so it is a BINARY acid — hydrogen plus one other element. Binary acids take a different pattern from oxyacids:\n\n    hydro- + (element root) + -ic acid\n    hydro- + brom          + -ic acid  ->  hydrobromic acid\n\n"Bromic acid" would be HBrO₃ (from bromATE) and "bromous acid" HBrO₂ (from bromITE) — both contain oxygen, and neither is this.\n\nWorth noting: HBr as a pure gas is called hydrogen bromide. It only becomes hydrobromic acid dissolved in water, which is why the question says "dissolved in water".',
    ...ITER(11, 'binary acid naming'),
  },
  {
    section: '2-6',
    stem: 'Identify each of the following as molecular or ionic: P₄O₁₀, MgBr₂, SF₆, NH₄Cl',
    choices: [
      'P₄O₁₀ molecular, MgBr₂ ionic, SF₆ molecular, NH₄Cl ionic',
      'P₄O₁₀ molecular, MgBr₂ ionic, SF₆ molecular, NH₄Cl molecular',
      'All four are molecular',
      'P₄O₁₀ ionic, MgBr₂ ionic, SF₆ molecular, NH₄Cl ionic',
    ],
    correctIndex: 0,
    explanation:
      'Apply the metal test, then remember the one exception:\n\n    P₄O₁₀ — phosphorus + oxygen, both nonmetals  -> molecular\n    MgBr₂ — magnesium is an alkaline earth METAL  -> ionic\n    SF₆   — sulfur + fluorine, both nonmetals     -> molecular\n    NH₄Cl — no metal at all, BUT it contains the ammonium ion NH₄⁺ -> IONIC\n\nAmmonium is the exception that makes this question worth doing. NH₄⁺ is a polyatomic CATION built from two nonmetals, and any compound containing it is ionic. Applying the metal test blindly gives "molecular" and gets it wrong — that is option 2.\n\nLarge subscripts like P₄O₁₀ are irrelevant to bonding type; only the elements\' positions matter.',
    ...ITER(26, 'molecular vs ionic classification'),
  },
  {
    section: '1-4',
    stem: 'Solid iodine is warmed and turns directly into a violet gas without melting. What is the substance in that gas, and what kind of change is it?',
    choices: [
      'Iodine, I₂ — a physical change (sublimation)',
      'Iodine atoms, I — a chemical change, since the I₂ bond breaks',
      'Iodine oxide — a chemical change with air',
      'Iodine, I₂ — a chemical change, because the appearance changed',
    ],
    correctIndex: 0,
    explanation:
      'Sublimation is solid straight to gas with no change in chemical identity, so the violet gas is still I₂.\n\nThe last option is the misconception worth naming: a dramatic change in APPEARANCE is not evidence of a chemical change. What matters is whether a NEW SUBSTANCE with different composition was produced. Here nothing new was made — the same molecules simply spread out.\n\nThis is the same reasoning as dry ice subliming to CO₂ in review question 3.',
    ...ITER(3, 'sublimation and physical vs chemical change'),
  },
];

export const REVIEW_ITERATIONS = ITERATION_LITERALS;

export const REVIEW_ALL_ITEMS = [...REVIEW_REAL_ITEMS, ...REVIEW_ITERATIONS];
