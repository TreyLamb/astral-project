// Chapter 1 (Essential Ideas, sections 1-1 through 1-7) study items — NOT part of the banded
// template-generator system (curriculum.js / engine/templates/). Two flat pools, per Trey's
// explicit instruction: "There's no band for this, it's all the same content."
//
// CH1_REAL_ITEMS — verbatim questions from Trey's actual AcademiQ quizzes (Quiz 2/3/4, sections
// 1-4 through 1-7) plus one he pasted himself (bookq's.md). This is AGENT-PROMPT.md §5's class 8
// "REAL TEST ITEM": kept verbatim, provenance-tagged. Source PDFs live in
// G:\My Drive\SupplementalCourseDocs\CHEM 1210\ ("q2. sec 1.4-1.5 #2/#3.pdf", "q3.1-3*.pdf",
// "q4.1-7.1.pdf") — AcademiQ draws each quiz from a small per-section item pool, so 6 exports
// across 3 quizzes gave near-complete coverage with heavy repeats across attempts; duplicates are
// collapsed here to one entry, keeping the clearest phrasing/best explanation seen.
//
// CH1_FACT_ITEMS — original definitional/informational questions Trey asked for ("informational
// and definition related questions from the reading, slides, etc."), written from the real
// AcademiQ chapter text (G:\...\CHEM 1210\_academiq\ch01-essential-ideas.md, captured 2026-09-02),
// the OpenStax Chemistry 2e PDF, and his own Classnotes.md trouble spots (macroscopic /
// microscopic / symbolic domains, unit conversions, sig figs). No verbatim AcademiQ prose is
// copied — see theknowledgebase/CLAUDE.md's courses/ scope note: quoting real QUESTIONS is fine
// here, but this pool is original writing grounded in the reading, not lifted sentences.
//
// Coverage gap, flagged rather than silently filled: no real item exists yet for sections 1-1 or
// 1-2 — Quiz Zero ("1-1 to 1-2") was never exported. See courses/PLAN.md's "what's still needed"
// tracker.
//
// `noMath: true` was added 2026-09-08 for the no-math "walking mode" sub-test Trey asked for
// ("something i can do on the move, while i'm walking, just questions that are knowledge based").
// It marks items answerable with zero arithmetic, zero sig-fig/decimal/atom counting, zero unit
// conversion or scientific-notation rewriting, and no figure/table lookup — see
// theknowledgebase/CLAUDE.md's courses/ AGENT-PROMPT.md for the full test. Existing items are
// otherwise untouched: this is a tagging pass only, nothing was reordered, reworded, or deleted.

/** @typedef {{ stem: string, choices: string[], correctIndex: number, explanation?: string, section: string, noMath?: boolean, provenance?: string }} Ch1Item */

/** @type {Ch1Item[]} */
export const CH1_REAL_ITEMS = [
  // ---- 1-3 Phases and Classification of Matter ----
  {
    section: '1-3',
    stem: 'Which statement correctly compares homogeneous and heterogeneous mixtures?',
    choices: [
      'Homogeneous mixtures are the same throughout; heterogeneous mixtures are not uniform in composition.',
      'Heterogeneous mixtures are chemically bonded, homogeneous mixtures are not.',
      'Both can only be separated by chemical means.',
      'Both are pure substances composed of a single element.',
    ],
    correctIndex: 0,
    explanation: 'Homogeneous mixtures have uniform composition, while heterogeneous mixtures have visibly different parts.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-3',
    stem: 'How does a homogeneous mixture differ from a pure substance?',
    choices: [
      "A homogeneous mixture has a variable composition, while a pure substance has a fixed, constant composition.",
      'Only pure substances can be separated into components by physical means.',
      'Both have fixed compositions.',
      'Homogeneous mixtures are elements; pure substances are compounds.',
    ],
    correctIndex: 0,
    explanation: "A homogeneous mixture's composition can vary, but a pure substance's is always constant.",
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-3',
    stem: 'How should copper be classified?',
    choices: ['Compound', 'Element', 'Homogeneous mixture', 'Mixture'],
    correctIndex: 1,
    explanation: 'Copper consists of only copper atoms, making it a pure element.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-3',
    stem: 'How should air be classified?',
    choices: ['Element', 'Compound', 'Homogeneous mixture', 'Mixture'],
    correctIndex: 2,
    explanation: 'Air is a homogeneous mixture of different gases (nitrogen, oxygen, argon, etc. blended uniformly).',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-3',
    stem: 'Which statement best compares an element with a compound?',
    choices: [
      'Elements always exist as single atoms; compounds always exist as ions.',
      'Elements are mixtures; compounds are pure substances.',
      'An element can be decomposed into simpler substances, a compound cannot.',
      'Both elements and compounds are pure substances, but compounds are combinations of different elements.',
    ],
    correctIndex: 3,
    explanation: 'Both are pure substances, but only compounds have atoms of two or more elements bonded together.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-3',
    stem: "Particle-diagram question (four boxes of circles/filled circles representing atoms): which box(es) contain at least one compound? (Two same-element atoms bonded = NOT a compound; two different-element atoms bonded = a compound.)",
    choices: ['1 and 4', 'all of them', '1', '2 and 3'],
    correctIndex: 0,
    explanation: 'A compound needs atoms of two DIFFERENT elements bonded together — boxes showing a light + dark atom paired qualify; a box with only same-color pairs does not.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item (figure simplified to text)',
  },

  // ---- 1-4 Physical and Chemical Properties ----
  {
    section: '1-4',
    stem: 'When iron left outdoors forms rust over time, which type of change occurs?',
    choices: ['Both chemical and physical', 'Neither', 'Physical', 'Chemical'],
    correctIndex: 3,
    explanation: 'Rusting is a chemical change: iron reacts with oxygen to form a new substance.',
    noMath: true,
    provenance: 'Quiz 2/3/4, real AcademiQ item (recurs across every attempt)',
  },
  {
    section: '1-4',
    stem: 'What classification applies to melting gold?',
    choices: ['Both physical and chemical change', 'Chemical change', 'Neither physical nor chemical change', 'Physical change'],
    correctIndex: 3,
    explanation: 'Melting gold is a physical change because it changes from solid to liquid without altering its chemical composition.',
    noMath: true,
    provenance: 'Quiz 2/3, real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'How should the explosion of a firecracker be classified?',
    choices: ['Chemical change', 'Physical change', 'Neither physical nor chemical change', 'Both physical and chemical change'],
    correctIndex: 0,
    explanation: 'The explosion involves chemical reactions that create new substances (gases, heat, light).',
    noMath: true,
    provenance: 'Quiz 2/3, real AcademiQ item (recurs across every attempt)',
  },
  {
    section: '1-4',
    stem: 'When ice melts to form liquid water, what type of change is this?',
    choices: ['Physical change', 'Chemical change', 'Both physical and chemical change', 'Neither physical nor chemical change'],
    correctIndex: 0,
    explanation: 'Melting is a physical change because the substance remains water (H₂O) in both phases.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Which of the following describes a chemical property?',
    choices: ['Flammability', 'Density', 'Melting point', 'Boiling point'],
    correctIndex: 0,
    explanation: 'Flammability is a chemical property because it describes the ability to react and form a new substance.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Which of the following is an example of an extensive property?',
    choices: ['Temperature', 'Mass', 'Density', 'Color'],
    correctIndex: 1,
    explanation: 'Mass depends on how much material is present, making it an extensive property (density, temperature, and color are intensive — they don\'t depend on amount).',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: "Which property is considered physical and can be measured without changing the substance's identity?",
    choices: ['Flammability', 'Toxicity', 'Color', 'Acidity'],
    correctIndex: 2,
    explanation: "Color can be observed without altering the substance's molecules, so it is a physical property.",
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'When sugar dissolves in water, what type of change is happening?',
    choices: ['Chemical change', 'Physical change', 'Neither physical nor chemical change', 'Both physical and chemical change'],
    correctIndex: 1,
    explanation: 'Dissolving sugar in water is a physical change; the sugar molecules are dispersed but retain their chemical identity.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'How would you classify the souring of milk?',
    choices: ['Neither physical nor chemical change', 'Chemical change', 'Both physical and chemical change', 'Physical change'],
    correctIndex: 1,
    explanation: 'Souring of milk is a chemical change because it results from the formation of new substances due to chemical reactions.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Mixing chocolate syrup with milk is an example of what type of change?',
    choices: ['Neither physical nor chemical change', 'Chemical change', 'Both physical and chemical change', 'Physical change'],
    correctIndex: 3,
    explanation: 'Mixing chocolate syrup with milk is a physical change — the substances retain their original identities, they are simply blended.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Which type of change occurs when coal burns?',
    choices: ['Both physical and chemical change', 'Neither physical nor chemical change', 'Chemical change', 'Physical change'],
    correctIndex: 2,
    explanation: 'Burning coal is a chemical change because the coal reacts with oxygen, forming new substances such as CO₂.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Which food contains no chemicals?',
    choices: ['All food contains chemicals', 'pure water', 'Apples', 'whole grains'],
    correctIndex: 0,
    explanation: 'A conceptual trick question: every food (including water) is made of chemical substances. "Chemical-free" is not a real category.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-4',
    stem: 'Dry ice is carbon dioxide in the solid phase. At room temperature and pressure dry ice does not melt but goes directly to its gas form (sublimation). What is the gas formed as dry ice sublimes?',
    choices: ['oxygen gas', 'carbon dioxide gas', 'carbon monoxide gas', 'carbon gas'],
    correctIndex: 1,
    explanation: 'Sublimation is a physical change — dry ice (solid CO₂) goes straight to CO₂ gas; the substance itself does not change.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },

  // ---- 1-5 Measurements ----
  {
    section: '1-5',
    stem: 'What is the SI base unit for measuring time?',
    choices: ['Millisecond', 'Minute', 'Second', 'Hour'],
    correctIndex: 2,
    explanation: 'The SI base unit of time is the second (s).',
    noMath: true,
    provenance: 'Quiz 2/3, real AcademiQ item',
  },
  {
    section: '1-5',
    stem: "What number should replace the question mark? 0.025 m = ? mm",
    choices: ['0.25', '25', '0.00025', '2500'],
    correctIndex: 1,
    explanation: '1 m = 1000 mm, so 0.025 m × 1000 = 25 mm.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: "What number should replace the question mark? 0.025 m = ? cm",
    choices: ['0.00025', '250', '2.5', '25'],
    correctIndex: 2,
    explanation: '1 m = 100 cm, so 0.025 m × 100 = 2.5 cm.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'Which of the following conversion factors is correct for converting inches to centimeters?',
    choices: ['1 in = 2.54 cm', '1 in = 10 cm', '1 in = 0.254 cm', '1 in = 25.4 cm'],
    correctIndex: 0,
    explanation: '1 inch = 2.54 centimeters exactly (a defined conversion).',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'Which answer below is equivalent to 10,000 mm?',
    choices: ['100 m', '10 µm', '10 cm', '1000 cm'],
    correctIndex: 3,
    explanation: '10,000 mm ÷ 10 mm/cm = 1000 cm.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'Which answer below is equivalent to 10,000 cm?',
    choices: ['100,000 m', '100 m', '10,000,000 mm', '10 m'],
    correctIndex: 1,
    explanation: '10,000 cm ÷ 100 cm/m = 100 m.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'A time interval is reported as 4.50 × 10⁻³ s. Express this using an SI prefix.',
    choices: ['4.50 centiseconds', '4.50 microseconds', '4.50 nanoseconds', '4.50 milliseconds'],
    correctIndex: 3,
    explanation: 'Milli⁻ means 10⁻³, so 4.50 × 10⁻³ s = 4.50 ms.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'Fill in the SI prefix table: ? / pico- / ×10⁻¹²,  T / ? / ×10¹²,  G / Giga- / ?,  ? / deci- / ×10⁻¹ — in order.',
    choices: ['p, Tera-, ×10⁹, d', 'k, Teka-, ×10⁻⁶, d', 'p, Teka-, 10⁹, d', 'p, Tera-, 10⁹, d'],
    correctIndex: 3,
    explanation: 'p = pico (10⁻¹²), T = Tera (10¹²), Giga- = ×10⁹, d = deci (10⁻¹).',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'Fill in the SI prefix table: T / Tera- / ?,  k / ? / ×10³,  ? / nano- / ×10⁻⁹,  m / milli- / ? — in order.',
    choices: ['×10⁹, kilo-, n, ×10⁻²', '×10¹², keto-, n, 10⁻²', '×10¹², kilo-, n, ×10⁻³', '×10⁻¹², kilo-, z, 10⁻³'],
    correctIndex: 2,
    explanation: 'Tera- = ×10¹², kilo- = ×10³, nano- = 10⁻⁹, milli- = ×10⁻³.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: 'What is the SI prefix (and its symbol) for a factor of 10⁻²?',
    choices: ['micro⁻ (µ)', 'milli⁻ (m)', 'nano⁻ (n)', 'centi⁻ (c)'],
    correctIndex: 3,
    explanation: 'Centi⁻ (c) means 10⁻² or 0.01.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-5',
    stem: "If a student says that 'micro-' means 10⁶, how would you correct them?",
    choices: ["'Micro-' means 10³.", "'Micro-' means 10⁻⁶.", "'Micro-' means 10⁻².", "'Micro-' means 10¹²."],
    correctIndex: 1,
    explanation: 'Micro⁻ (µ) means 10⁻⁶ — the student had both the sign and the magnitude wrong.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },

  // ---- 1-6 Significant Figures, Accuracy, and Precision ----
  {
    section: '1-6',
    stem: 'A scientist records: 5.12 cm, 5.15 cm, 5.14 cm. The true value is 5.90 cm. Which statement best describes these data?',
    choices: ['Data are both accurate and precise.', 'Data are accurate, but not precise.', 'Data are neither accurate nor precise.', 'Data are precise, but not accurate.'],
    correctIndex: 3,
    explanation: 'The values are very close together (precise), but all far from the true value 5.90 (not accurate).',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: "A dispenser labeled '296 mL' provides these readings: 296.1, 295.9, 296.1, 296.0, and 296.1 mL. What can you conclude about the dispenser?",
    choices: ['The dispenser is both accurate and precise.', 'The dispenser is not accurate, but it is precise.', 'The dispenser is accurate but not precise.', 'The dispenser is neither accurate nor precise.'],
    correctIndex: 0,
    explanation: 'All measurements are tightly grouped around 296 mL, showing both accuracy (average ≈ 296) and precision (little spread).',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: '(Archer target diagram, 4 shot patterns) Which archer is most PRECISE — tightly clustered shots, regardless of whether they hit the bullseye?',
    choices: ['A tight cluster low and to one side of the target', 'A tight cluster in the bullseye', 'Widely scattered shots across the whole target', 'A loose cluster near the bullseye'],
    correctIndex: 0,
    explanation: 'Precision only measures how close the shots are to EACH OTHER, not to the bullseye — a tight cluster anywhere on the target is the most precise pattern, even if it misses the center.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item (figure simplified to text — "Archer X" in the source)',
  },
  {
    section: '1-6',
    stem: 'How many significant figures are contained in this measurement: 2 × 10¹⁸ m?',
    choices: ['1', '10', '18', '2,000,000,000,000,000,000'],
    correctIndex: 0,
    explanation: 'Only the digit "2" is significant; the exponent is not a measured digit.',
    provenance: 'Quiz 3/4, real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'How many significant figures are in the value 0.01400 g/mL?',
    choices: ['3', '5', '2', '4'],
    correctIndex: 3,
    explanation: '0.01400 has four significant figures — leading zeros are never significant, but a zero after a nonzero digit AND after the decimal point always is.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'How many significant figures does the measurement 0.0126 kg have?',
    choices: ['5', '3', '1', '4'],
    correctIndex: 1,
    explanation: 'Leading zeros (0.0) are never significant; 1, 2, and 6 are — 3 significant figures.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'How many significant figures does 0.0306 g contain?',
    choices: ['2', '3', '4', '5'],
    correctIndex: 1,
    explanation: 'The leading zeros (0.0) are not significant placeholders, but 3, 0, and 6 are all significant (nonzero digits and the zero between them), giving 3 significant figures.',
    provenance: "Trey's own AcademiQ capture, bookq's.md",
  },
  {
    section: '1-6',
    stem: 'A balance reads 6.72 g. Based on common practice, what is the implied uncertainty in this measurement?',
    choices: ['± 0.5 g', '± 0.01 g', '± 0.1 g', '± 0.001 g'],
    correctIndex: 1,
    explanation: 'The uncertainty is assumed to be in the last reported digit. Since the last digit is in the hundredths place, the uncertainty is ± 0.01 g.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Round 1.497 × 10⁻³ to two significant figures.',
    choices: ['1.50 × 10⁻³', '1.5 × 10⁻³', '1.49 × 10⁻³', '1.4 × 10⁻³'],
    correctIndex: 1,
    explanation: 'The digits after "1" are 4 and 9; since 9 is more than 5, round up. The result is 1.5 × 10⁻³.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'How many significant figures are contained in the measurement 38.7 g?',
    choices: ['0.1', '1', '2', '3'],
    correctIndex: 3,
    explanation: 'All three digits (3, 8, 7) are nonzero, so all three are significant.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'How many significant figures are contained in the measurement 0.0613 cm³?',
    choices: ['5', '4', '3', '0.01'],
    correctIndex: 2,
    explanation: 'Leading zeros are not significant; 6, 1, and 3 are — 3 significant figures.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Express the number 0.0000000651 in scientific notation with correct significant figures.',
    choices: ['6.51 × 10⁸', '6.51 × 10⁷', '6.51 × 10⁻⁸', '6.51 × 10⁻⁷'],
    correctIndex: 2,
    explanation: 'Moving the decimal 8 places right to reach 6.51 means the exponent is −8: 6.51 × 10⁻⁸.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Express 0.03344 in scientific notation with correct significant figures.',
    choices: ['3.344 × 10⁻²', '0.3344 × 10⁻²', '33.44 × 10⁻²', '3.344 × 10²'],
    correctIndex: 0,
    explanation: 'Only the first form has exactly one nonzero digit before the decimal point, as scientific notation requires.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Express 0.05499 in scientific notation while preserving the correct number of significant figures.',
    choices: ['5.499 × 10⁻²', '5.50 × 10⁻²', '0.5499 × 10⁻¹', '5.4990 × 10⁻²'],
    correctIndex: 0,
    explanation: '0.05499 contains four significant figures, so it should be expressed as 5.499 × 10⁻².',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Express the number 22086 in scientific notation with correct significant figures.',
    choices: ['2.2086 × 10⁻⁵', '2.2086 × 10³', '2.2086 × 10⁵', '2.2086 × 10⁴'],
    correctIndex: 3,
    explanation: 'Moving the decimal 4 places to reach 2.2086 gives an exponent of 4.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Which of the following is expressed correctly in scientific notation?',
    choices: ['8.4 × 10³', '530 × 10⁴', '0.85 × 10²', '42.6 × 10¹'],
    correctIndex: 0,
    explanation: 'Scientific notation requires a value between 1 and 10, times a power of 10. Only 8.4 × 10³ matches this rule.',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: "When a vial label states '12 tablets,' how should this number be regarded in calculations according to the rules of significant figures?",
    choices: ['It has 1 significant figure.', 'It has infinite significant figures (exact number).', 'It has 2 significant figures.', 'It is an approximation with 1 significant figure.'],
    correctIndex: 1,
    explanation: 'Exact counts (things you count one at a time, like tablets) have infinite significant figures for calculation purposes — they never limit a result\'s precision.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-6',
    stem: 'Which of the following is NOT always included when presenting a measurement in chemistry?',
    choices: ['The uncertainty (when appropriate)', 'The unit of measurement', 'The instrument used', 'A numerical value'],
    correctIndex: 2,
    explanation: 'The instrument used is not always reported with every measurement, but the value, unit, and (when appropriate) uncertainty are.',
    noMath: true,
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },

  // ---- 1-7 Mathematical Treatment of Measurement Results ----
  {
    section: '1-7',
    stem: 'A block of material has a density of 2.70 g/cm³ and a volume of 15.0 cm³. What is the mass of the block?',
    choices: ['17.7 g', '5.56 g', '40.5 g', '4.44 g'],
    correctIndex: 2,
    explanation: 'Mass = density × volume = 2.70 × 15.0 = 40.5 g.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'A material with a volume of 22.35 cm³ and a mass of 17.88 g has a density of…',
    choices: ['39.99 g/cm³', '1.250 g/mL', '0.8000 g/mL', '1.250 g/cm³'],
    correctIndex: 2,
    explanation: 'Density = mass ÷ volume = 17.88 g ÷ 22.35 cm³ = 0.8000 g/mL.',
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'A sample weighs 45.6 g. Its volume was measured to be 36.4 mL. What is the density of the sample in g/mL?',
    choices: ['0.798', '1.25', '2.23', '1.12'],
    correctIndex: 1,
    explanation: 'Density = 45.6 g ÷ 36.4 mL = 1.25 g/mL.',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'How many m³ are in 155 g of gold? (Density of gold = 19.32 g/mL)',
    choices: ['0.0215 m³', '0.00155 m³', '8.02 × 10⁻⁶ m³', '2.01 × 10⁻³ m³'],
    correctIndex: 2,
    explanation: 'Volume = 155 g ÷ 19.32 g/mL = 8.02 mL = 8.02 × 10⁻⁶ m³ (1 mL = 10⁻⁶ m³).',
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'If a silver bar with a mass of 203 g is dipped into a vessel of water, how much volume do you expect the bar to displace?',
    choices: ['203 cm³', '10.5 cm³', '0.052 cm³', '19.4 cm³'],
    correctIndex: 3,
    // Re-keyed 2026-10-06. AcademiQ's grader marks 203 cm³, which only works if 1 g of silver were
    // 1 cm³. For exam prep the physically correct answer is keyed; the quirk is named below.
    explanation: "An object displaces its own VOLUME, so convert mass to volume with silver's density (10.49 g/cm³): 203 g ÷ 10.49 g/cm³ = 19.4 cm³. 10.5 cm³ is the density mistaken for a volume, and 0.052 cm³ is the division upside down. ⚠ AcademiQ's own quiz key marks 203 cm³ here, which treats 1 g as 1 cm³ (only true for water). If this exact item appears on an AcademiQ quiz, the grader expects 203 cm³; on a written exam, 19.4 cm³ is right.",
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item — ⚠ see explanation, treat with caution',
  },
  {
    section: '1-7',
    stem: 'If a silver bar with a VOLUME of 203 mL is dipped into a vessel of water, how much volume do you expect the bar to displace?',
    choices: ['0.203 mL', '193 mL', '19.4 mL', '203 mL'],
    correctIndex: 3,
    explanation: 'An object always displaces its own volume of water, regardless of density — 203 mL in, 203 mL displaced. (Contrast with the mass-based version of this question above, where density is actually needed.)',
    noMath: true,
    provenance: 'Quiz 2 (Sec 1-4 to 1-5), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'A metal cylinder has a mass of 157 g. When immersed in water, the volume reading changes from 50.00 mL to 67.25 mL. What is the density of the metal in g/mL?',
    choices: ['0.093 g/mL', '9.10 g/mL', '13.12 g/mL', '6.26 g/mL'],
    correctIndex: 1,
    explanation: "Displaced volume = 67.25 − 50.00 = 17.25 mL (the water rises by exactly the cylinder's volume). Density = mass ÷ volume = 157 g ÷ 17.25 mL = 9.10 g/mL. ⚠ The real AcademiQ quiz offered 9.44 g/mL as its key, which does not follow from these numbers (re-keyed 2026-10-06); if this item shows up on an AcademiQ quiz, pick the option closest to 9.1.",
    provenance: 'Quiz 3 (Sec 1-6), real AcademiQ item — ⚠ source math is approximate, see explanation',
  },
  {
    section: '1-7',
    stem: 'Perform the following arithmetic and round to the correct number of significant figures, with correct units: 1000.0 mL − 0.010 mL =',
    choices: ['1.0000 L', '990 mL', '1000.0 L', '999.990 mL'],
    correctIndex: 0,
    // Re-keyed 2026-10-06: the old key (999.990 mL) kept three decimal places, which breaks the
    // very rule its own explanation stated.
    explanation: 'Subtraction rule: the answer keeps only as many DECIMAL PLACES as the least precise value. 1000.0 mL has one decimal place, 0.010 mL has three, so round to one: 999.990 → 1000.0 mL. Written in liters that is 1.0000 L (same five significant figures, just a different unit). 999.990 mL is the unrounded calculator answer, and 1000.0 L multiplies the volume by 1000.',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Perform the following arithmetic and round to the correct significant figures, with correct units: 0.0023 m × 3150 m =',
    choices: ['7.2', '7.25', '7.0', '7.245'],
    correctIndex: 0,
    explanation: 'Multiplication rule: the result gets as many significant figures as the LEAST precise factor. 0.0023 has 2 sig figs, so the answer (7.245 m²) rounds to 7.2 m².',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Perform the following arithmetic and round to the correct significant figures, with correct units: 1.00 L − 0.0100 L =',
    choices: ['1.0 L', '0.990 L', '0.99 L', '0.99 L²'],
    correctIndex: 2,
    explanation: 'Subtraction rule: round to the least precise decimal place. 1.00 has 2 decimal places, 0.0100 has 4 — round the result (0.9900) to 2 decimal places: 0.99 L.',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Soccer is played with a round ball having a circumference between 27 and 28 in. and a weight between 14 and 16 oz. What are these specifications in units of centimeters and grams?',
    choices: ['54–56 cm; 24–32 g', '60–70 cm; 412–453 g', '68–71 cm; 24–32 g', '68–71 cm; 400–450 g'],
    correctIndex: 3,
    explanation: '27–28 in × 2.54 cm/in ≈ 68–71 cm; 14–16 oz × ~28.35 g/oz ≈ 400–450 g.',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Given 4.00 qt of antifreeze weighing 9.26 lb, what is the density in g/mL using the correct conversion factors?',
    choices: ['4.20 g/mL', '2.32 g/mL', '0.432 g/mL', '1.11 g/mL'],
    correctIndex: 3,
    explanation: 'Convert mass from lb to g and volume from qt to mL, then divide mass by volume, to get a density of 1.11 g/mL. (The 4.20 g/mL distractor comes from using only the mass and forgetting to divide by volume.)',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Which best describes the rule for the number of decimal places in the result of addition or subtraction of measured quantities?',
    choices: [
      'The answer should be rounded to the same decimal place as the least precise measurement.',
      'The answer should have as many significant figures as the value with the fewest significant figures.',
      'The answer should have as many decimal places as the value with the most decimal places.',
      'The answer should always be rounded to the tenths place.',
    ],
    correctIndex: 0,
    explanation: 'When adding or subtracting, the final answer must be rounded to the same decimal place as the least precise term, reflecting its absolute uncertainty.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'When multiplying or dividing measured values, how many significant figures should be reported in the final result?',
    choices: ['As many as the value with the most significant figures.', 'Always three significant figures.', 'Only the digits before the decimal point.', 'As many as the value with the fewest significant figures.'],
    correctIndex: 3,
    explanation: 'The result from multiplication or division should have as many significant figures as the measurement with the fewest, which controls the overall uncertainty.',
    noMath: true,
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
  {
    section: '1-7',
    stem: 'Perform the following arithmetic using the correct number of significant figures: (3.14 × 2.751) / 0.64',
    choices: ['13.50', '13.5', '13', '13.497'],
    correctIndex: 2,
    explanation: '0.64 has the fewest significant figures (2), so the final answer rounds to 2 sig figs: 13.497 → 13.',
    provenance: 'Quiz 4 (Sec 1-7), real AcademiQ item',
  },
];

// Fact items get their provenance stamped in below rather than repeated on all 20 literals. Trey
// asked to always see where a question came from: "if you iterated off an ACS question - i want to
// see 'created by agent from ACS question' or whatever." None of these were iterated off a
// specific real question — they're original, written from the assigned reading — and the stamp
// says exactly that. If you ever DO derive one from a real item, give it an explicit `provenance`
// naming that item; the stamp only fills in where the field is missing.
/** @type {Ch1Item[]} */
const CH1_FACT_LITERALS = [
  // ---- 1-2 Chemistry in Context (the graded-checkpoint section; source of the
  // macroscopic/microscopic/symbolic confusion flagged in Trey's own Classnotes.md) ----
  {
    section: '1-2',
    stem: 'A chemist studies water boiling in a beaker (what you can see), draws the individual H₂O molecules gaining energy and separating (what\'s really happening), and writes H₂O(l) → H₂O(g) (how it\'s represented). These are the three domains chemists use to describe matter. Which domain does "H₂O(l) → H₂O(g)" belong to?',
    choices: ['Macroscopic', 'Microscopic (particulate)', 'Symbolic', 'Empirical'],
    correctIndex: 2,
    explanation: 'The symbolic domain uses chemical symbols, formulas, and equations to represent what is happening — as opposed to the macroscopic domain (what you observe directly) or the microscopic/particulate domain (atoms and molecules themselves).',
    noMath: true,
  },
  {
    section: '1-2',
    stem: 'You watch ice melt in your hand and feel it get cold — no formulas, no atoms, just what your senses observe. Which of chemistry\'s three domains is this?',
    choices: ['Macroscopic', 'Microscopic (particulate)', 'Symbolic', 'Theoretical'],
    correctIndex: 0,
    explanation: 'Macroscopic is the domain of everyday, directly observable properties and events — what you can see, smell, weigh, or feel without any special equipment or notation.',
    noMath: true,
  },
  {
    section: '1-2',
    stem: 'A textbook diagram shows individual water molecules as bent V-shaped particles, packed close together in the liquid and spread far apart in the gas. Which domain is this diagram illustrating?',
    choices: ['Macroscopic', 'Microscopic (particulate)', 'Symbolic', 'Descriptive'],
    correctIndex: 1,
    explanation: 'The microscopic (particulate) domain describes matter in terms of atoms, molecules, and ions — entities too small to see directly, reasoned about rather than observed.',
    noMath: true,
  },
  {
    section: '1-2',
    stem: 'In the scientific method, a scientist proposes "metals conduct electricity because their electrons are loosely held" to explain many separate observations. What is this broad, evidence-supported explanation called?',
    choices: ['A law', 'A hypothesis', 'A theory', 'An observation'],
    correctIndex: 2,
    explanation: 'A theory is a well-substantiated explanation that accounts for a body of observations and can be revised if new evidence demands it — broader in scope than a single hypothesis.',
    noMath: true,
  },
  {
    section: '1-2',
    stem: 'After many careful experiments, scientists find that "the volume of a fixed amount of gas is inversely proportional to its pressure, at constant temperature" — every time, no exceptions found. This kind of statement, which summarizes a pattern without explaining WHY it happens, is called a…',
    choices: ['Theory', 'Law', 'Hypothesis', 'Model'],
    correctIndex: 1,
    explanation: 'A scientific law describes WHAT happens (a consistent, observed pattern) but does not explain WHY — that explanatory role belongs to a theory.',
    noMath: true,
  },
  {
    section: '1-2',
    stem: 'A student proposes: "I think adding salt to water raises its boiling point because the salt particles get in the way of water molecules escaping." Before testing it, what is this tentative, testable explanation called?',
    choices: ['A law', 'A theory', 'A hypothesis', 'A conclusion'],
    correctIndex: 2,
    explanation: 'A hypothesis is a tentative, testable explanation proposed BEFORE the supporting evidence is gathered — the starting point of the scientific method, not its endpoint.',
    noMath: true,
  },

  // ---- 1-3 Phases and Classification of Matter ----
  {
    section: '1-3',
    stem: 'Which correctly ranks how tightly particles are packed and how freely they move, from most ordered/least free to least ordered/most free?',
    choices: ['Gas < liquid < solid', 'Solid < liquid < gas', 'Liquid < solid < gas', 'Solid < gas < liquid'],
    correctIndex: 1,
    explanation: 'Solids have fixed, tightly packed particles; liquids are close together but can flow past each other; gases are far apart and move freely — solid < liquid < gas in both spacing and freedom of motion.',
    noMath: true,
  },
  {
    section: '1-3',
    stem: 'Salt water is a solid dissolved uniformly in a liquid — you cannot see individual salt crystals, and a spoonful from anywhere in the glass tastes the same. What is this an example of?',
    choices: ['A heterogeneous mixture', 'A homogeneous mixture', 'A pure substance', 'A compound'],
    correctIndex: 1,
    explanation: 'A homogeneous mixture has uniform composition and properties throughout — you cannot visually distinguish its components, unlike a heterogeneous mixture (e.g., sand in water).',
    noMath: true,
  },
  {
    section: '1-3',
    stem: 'Which of these is a pure substance rather than a mixture: pure gold (Au), sterling silver (Ag + Cu alloy), salt water, or granite?',
    choices: ['Sterling silver', 'Salt water', 'Granite', 'Pure gold'],
    correctIndex: 3,
    explanation: 'A pure substance (element or compound) has a fixed composition throughout. Alloys, salt water, and granite are all mixtures of two or more substances in variable proportions.',
    noMath: true,
  },

  // ---- 1-4 Physical and Chemical Properties ----
  {
    section: '1-4',
    stem: 'Which pair correctly matches "intensive property" with an example?',
    choices: ['Intensive — total volume', 'Intensive — total mass', 'Intensive — melting point', 'Intensive — total energy content'],
    correctIndex: 2,
    explanation: "An intensive property (like melting point, density, or color) does NOT depend on how much material is present — unlike an extensive property (mass, volume, total energy), which scales with the sample's size.",
    noMath: true,
  },
  {
    section: '1-4',
    stem: 'A "chemical change" is best defined as one where…',
    choices: [
      'only the physical state (solid/liquid/gas) changes',
      'a new substance with different chemical properties is formed',
      'the size or shape of the material changes',
      'the material is separated into its physical components',
    ],
    correctIndex: 1,
    explanation: 'A chemical change produces one or more new substances with a different chemical identity than what you started with — the defining test physical changes never pass.',
    noMath: true,
  },

  // ---- 1-5 Measurements ----
  {
    section: '1-5',
    stem: 'Which of these is one of the seven SI BASE units (not a derived unit)?',
    choices: ['Liter (volume)', 'Newton (force)', 'Kilogram (mass)', 'Joule (energy)'],
    correctIndex: 2,
    explanation: 'The kilogram is one of the 7 SI base units (along with meter, second, ampere, kelvin, mole, candela). Liter, newton, and joule are all DERIVED units, built from combinations of base units.',
    noMath: true,
  },
  {
    section: '1-5',
    stem: 'Which SI base unit is used for amount of substance — the unit at the heart of nearly every chemistry calculation?',
    choices: ['Gram', 'Mole', 'Liter', 'Molar'],
    correctIndex: 1,
    explanation: 'The mole (mol) is the SI base unit for amount of substance — it counts particles (6.022 × 10²³ of them), unlike the gram (a mass unit) or the liter (a volume unit).',
    noMath: true,
  },
  {
    section: '1-5',
    stem: "Ranking metric prefixes from SMALLEST to LARGEST factor: nano-, milli-, kilo-, mega- — which order is correct?",
    choices: ['mega- < kilo- < milli- < nano-', 'nano- < milli- < kilo- < mega-', 'milli- < nano- < mega- < kilo-', 'kilo- < mega- < nano- < milli-'],
    correctIndex: 1,
    explanation: 'nano- (10⁻⁹) < milli- (10⁻³) < kilo- (10³) < mega- (10⁶) — smallest to largest factor of ten.',
    noMath: true,
  },

  // ---- 1-6 Significant Figures, Accuracy, and Precision ----
  {
    section: '1-6',
    stem: 'Which rule correctly states when a zero IS significant?',
    choices: [
      'A zero is significant only if it is the very first digit in the number.',
      'A zero between two nonzero digits, or a trailing zero after a decimal point, is significant.',
      'Zeros are never significant, regardless of position.',
      'A zero is significant only when it appears in scientific notation.',
    ],
    correctIndex: 1,
    explanation: 'Leading zeros (before the first nonzero digit) are never significant — they just locate the decimal point. Zeros sandwiched between nonzero digits, and trailing zeros after a decimal point, ARE significant.',
    noMath: true,
  },
  {
    section: '1-6',
    stem: '"Precision" in a set of measurements refers to…',
    choices: [
      'how close the measurements are to the true, accepted value',
      'how close the measurements are to each other',
      'how many significant figures the instrument can display',
      'whether the measuring instrument was calibrated correctly',
    ],
    correctIndex: 1,
    explanation: 'Precision measures reproducibility — how close repeated measurements are to EACH OTHER. Accuracy, by contrast, measures how close a measurement is to the true value; a data set can be precise without being accurate.',
    noMath: true,
  },
  {
    section: '1-6',
    stem: "A measurement's reported uncertainty is conventionally taken to be…",
    choices: [
      'half of the smallest division on the measuring instrument',
      'in the last (rightmost) digit reported',
      'always exactly ±1%, regardless of the instrument',
      'the difference between the highest and lowest possible readings on the scale',
    ],
    correctIndex: 1,
    explanation: 'By convention, the uncertainty in a properly reported measurement lives in the LAST digit shown — e.g., 6.72 g is understood to carry an uncertainty of about ±0.01 g.',
    noMath: true,
  },

  // ---- 1-7 Mathematical Treatment of Measurement Results ----
  {
    section: '1-7',
    stem: 'Density is defined as…',
    choices: ['mass ÷ volume', 'volume ÷ mass', 'mass × volume', 'mass − volume'],
    correctIndex: 0,
    explanation: 'Density = mass / volume, typically reported in g/mL or g/cm³ for solids and liquids — it is an intensive property (it does not depend on how much of the substance you have).',
    noMath: true,
  },
  {
    section: '1-7',
    stem: 'Dimensional analysis (the "factor-label method") solves a unit-conversion problem by…',
    choices: [
      'guessing which operation (multiply or divide) gives a reasonable-looking number',
      'multiplying by conversion factors written as fractions equal to 1, so that unwanted units cancel',
      'always converting everything to SI base units first, with no other steps',
      'rounding the given quantity to one significant figure before converting',
    ],
    correctIndex: 1,
    explanation: 'Dimensional analysis works by multiplying by one or more conversion factors (each equal to 1, e.g. 100 cm/1 m) so that units cancel algebraically, leaving only the target unit — this is exactly the "if a unit is not on both top and bottom somewhere, it doesn\'t cancel" check.',
    noMath: true,
  },
  {
    section: '1-7',
    stem: 'A cube of unknown material measures 2.00 cm on each side and has a mass of 43.2 g. Its volume is 8.00 cm³. What is its density?',
    choices: ['5.40 g/cm³', '0.185 g/cm³', '345.6 g/cm³', '4.32 g/cm³'],
    correctIndex: 0,
    explanation: 'Density = 43.2 g ÷ 8.00 cm³ = 5.40 g/cm³.',
  },
];

/** @type {Ch1Item[]} */
export const CH1_FACT_ITEMS = CH1_FACT_LITERALS.map((item) => ({
  ...item,
  provenance:
    item.provenance ??
    `Written by agent from the assigned reading — AcademiQ ch01-essential-ideas.md §${item.section}, cross-checked against OpenStax Chemistry 2e Ch1. Not a real quiz question.`,
}));

/** Every Chapter 1 item — real + fact pools combined, for a mixed practice run. */
export const CH1_ALL_ITEMS = [...CH1_REAL_ITEMS, ...CH1_FACT_ITEMS];
