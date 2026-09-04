// ACS-level (band 4-5) templates for Formula Calculations and the Mole. Bands 1-3 for this
// chapter live in ch03-mole-calculations.js (course-level, instructor-quiz difficulty); these are
// the standardized-exam-level companion — two-step problems and real traps (buried unit
// conversions, subscripts that must be carried, hydrate water, empirical-vs-molecular formula
// confusion) rather than bigger numbers. Data tables are copied from ch03-mole-calculations.js
// rather than imported, per that file's own header note on sourcing.
//
// `section: null` on every template here on purpose — an automated pass assigns the real book
// section later (see syllabusMap.js). Nothing in this file should be read as "no section exists".

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-03-mole-calculations';

// Standard atomic masses (amu, == g/mol). Matches common gen-chem textbook rounding, same values
// as ch03-mole-calculations.js's ELEMENTS table (Z/isotope data dropped — unused here).
const ELEMENTS = {
  H:  { name: 'hydrogen',  mass: 1.008 },
  C:  { name: 'carbon',    mass: 12.01 },
  N:  { name: 'nitrogen',  mass: 14.01 },
  O:  { name: 'oxygen',    mass: 16.00 },
  Na: { name: 'sodium',    mass: 22.99 },
  Mg: { name: 'magnesium', mass: 24.31 },
  Al: { name: 'aluminum',  mass: 26.98 },
  S:  { name: 'sulfur',    mass: 32.07 },
  Cl: { name: 'chlorine',  mass: 35.45 },
  Ca: { name: 'calcium',   mass: 40.08 },
  Fe: { name: 'iron',      mass: 55.85 },
  Cu: { name: 'copper',    mass: 63.55 },
  Zn: { name: 'zinc',      mass: 65.38 },
  Ba: { name: 'barium',    mass: 137.33 },
  Pb: { name: 'lead',      mass: 207.2 },
};

// General-purpose compound pool. Deliberately H-free: every one of these elements' masses has at
// most 2 decimal digits, so a molar mass built from them is EXACT at 2 dp (never a rounded
// approximation) — that lets every explanation below show ordinary arithmetic without silently
// carrying rounding error into a later step (Doctrine: "never print false arithmetic"). Every
// entry also has at least one subscript > 1, so a "carry the subscript" question always has a
// real trap available. H-bearing chemistry (water, hydrates, glucose) is confined to the three
// templates that need it, where the extra precision is handled explicitly.
const COMPOUNDS = [
  { formula: 'CO₂',    parts: [{ symbol: 'C', count: 1 }, { symbol: 'O', count: 2 }] },
  { formula: 'CaCO₃',  parts: [{ symbol: 'Ca', count: 1 }, { symbol: 'C', count: 1 }, { symbol: 'O', count: 3 }] },
  { formula: 'Al₂O₃',  parts: [{ symbol: 'Al', count: 2 }, { symbol: 'O', count: 3 }] },
  { formula: 'MgCl₂',  parts: [{ symbol: 'Mg', count: 1 }, { symbol: 'Cl', count: 2 }] },
  { formula: 'Fe₂O₃',  parts: [{ symbol: 'Fe', count: 2 }, { symbol: 'O', count: 3 }] },
  { formula: 'ZnCl₂',  parts: [{ symbol: 'Zn', count: 1 }, { symbol: 'Cl', count: 2 }] },
  { formula: 'BaCl₂',  parts: [{ symbol: 'Ba', count: 1 }, { symbol: 'Cl', count: 2 }] },
  { formula: 'Na₂CO₃', parts: [{ symbol: 'Na', count: 2 }, { symbol: 'C', count: 1 }, { symbol: 'O', count: 3 }] },
  { formula: 'CuSO₄',  parts: [{ symbol: 'Cu', count: 1 }, { symbol: 'S', count: 1 }, { symbol: 'O', count: 4 }] },
  { formula: 'PbO₂',   parts: [{ symbol: 'Pb', count: 1 }, { symbol: 'O', count: 2 }] },
];

const molarMass = (parts) => parts.reduce((sum, p) => sum + ELEMENTS[p.symbol].mass * p.count, 0);
const totalAtoms = (parts) => parts.reduce((sum, p) => sum + p.count, 0);

const SUBSCRIPT_DIGITS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const toSubscript = (n) => String(n).split('').map((ch) => SUBSCRIPT_DIGITS[ch] ?? ch).join('');
const partsToFormula = (parts) => parts.map(({ symbol, count }) => symbol + (count === 1 ? '' : toSubscript(count))).join('');

const AVOGADRO = 6.022e23;
const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '' };
const toSuperscript = (n) => String(n).split('').map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch).join('');
// display, never rely on raw float stringification: toExponential(2) always returns a fixed
// two-decimal mantissa string (see ch03-mole-calculations.js's formatSci for the bug this avoids).
function formatSci(n) {
  const [mantissa, expPart] = n.toExponential(2).split('e');
  return `${mantissa} × 10${toSuperscript(parseInt(expPart, 10))}`;
}

function pickTargetWithSubscript(h, parts) {
  const candidates = parts.filter((p) => p.count > 1);
  return h.pick(candidates);
}

// =================================================================================================
// BAND 4 — two-step problems, or one step carrying a real trap
// =================================================================================================

// --- mass-to-moles-conversion: a hidden unit conversion --------------------------------------
registerChemTemplate({
  id: 'chem1-acs-03-mass-to-moles-unit-trap',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Grams to moles with a hidden unit conversion',
  concepts: ['mass-to-moles-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const mm = molarMass(compound.parts);
    const unit = h.pick(['mg', 'kg']);
    const draw = () => (unit === 'mg' ? h.int(500, 9000) : h.pick([0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]));
    // mg-path grams land at 0.5-9 g (always below every mm in COMPOUNDS, min 44.01); kg-path
    // grams land at 500-5000 g (always above every mm, max 239.2), so grams != mm always — but
    // "no-unit-conversion" (given/mm) and "inverted-ratio" (mm/grams) are reciprocal-shaped and
    // CAN pass arbitrarily close to one another for a specific (given, mm) pair regardless (e.g.
    // 3 kg of MgCl₂, mm 95.21 — no fixed decimal precision is guaranteed to keep those two
    // distractors visually distinct), so redraw rather than trust a decimal count to separate them.
    let given;
    let grams;
    let choiceStrings;
    do {
      given = draw();
      grams = unit === 'mg' ? given / 1000 : given * 1000;
      const wrongFactor = unit === 'mg' ? given / 100 : given * 100;
      choiceStrings = new Set([
        (grams / mm).toFixed(4),
        (given / mm).toFixed(4),
        (wrongFactor / mm).toFixed(4),
        (mm / grams).toFixed(4),
      ]);
    } while (choiceStrings.size < 4);
    const correct = grams / mm;
    const wrongFactorGrams = unit === 'mg' ? given / 100 : given * 100;
    const context = unit === 'mg'
      ? `An analytical balance measures a ${given} mg sample of ${compound.formula}.`
      : `An industrial process uses ${given} kg of ${compound.formula}.`;
    return {
      stem: `${context} How many moles of ${compound.formula} is that? (molar mass ${mm.toFixed(2)} g/mol)`,
      ...h.choices(
        { value: `${correct.toFixed(4)} mol` },
        [
          { value: `${(given / mm).toFixed(4)} mol`, error: 'no-unit-conversion', why: `used the ${given} ${unit} value directly as grams, without converting ${unit} to g first` },
          { value: `${(wrongFactorGrams / mm).toFixed(4)} mol`, error: 'wrong-conversion-factor', why: `converted ${unit} to g using a factor of 100 instead of 1000` },
          { value: `${(mm / grams).toFixed(4)} mol`, error: 'inverted-ratio', why: 'divided molar mass by mass instead of mass by molar mass' },
        ],
      ),
      explanation: `Convert to grams first: ${given} ${unit} = ${grams} g. Then moles = mass ÷ molar mass = ${grams} g ÷ ${mm.toFixed(2)} g/mol = ${correct.toFixed(4)} mol.`,
    };
  },
});

// --- molar-mass-calculation: percent composition of one element -------------------------------
registerChemTemplate({
  id: 'chem1-acs-03-percent-composition-element',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Percent composition of one element in a formula',
  concepts: ['molar-mass-calculation'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = pickTargetWithSubscript(h, compound.parts);
    const others = compound.parts.filter((p) => p !== target);
    const other = h.pick(others);
    const dropped = h.pick(others);
    const mm = molarMass(compound.parts);
    const targetMass = ELEMENTS[target.symbol].mass * target.count;
    const correct = (targetMass / mm) * 100;
    const ignoredSubscript = (ELEMENTS[target.symbol].mass / mm) * 100;
    const droppedTermMM = mm - ELEMENTS[dropped.symbol].mass * dropped.count;
    const droppedTerm = (targetMass / droppedTermMM) * 100;
    const otherElement = (ELEMENTS[other.symbol].mass * other.count / mm) * 100;
    const targetName = ELEMENTS[target.symbol].name;
    return {
      stem: `What is the percent by mass of ${targetName} in ${compound.formula}?`,
      ...h.choices(
        { value: `${correct.toFixed(2)}%` },
        [
          { value: `${ignoredSubscript.toFixed(2)}%`, error: 'ignored-subscript', why: `used one ${targetName} atom's mass instead of carrying its subscript (${target.count}) into the numerator` },
          { value: `${droppedTerm.toFixed(2)}%`, error: 'dropped-a-term', why: `left ${ELEMENTS[dropped.symbol].name} out of the molar mass total in the denominator` },
          { value: `${otherElement.toFixed(2)}%`, error: 'wrong-element', why: `computed the percentage for ${ELEMENTS[other.symbol].name} instead of ${targetName}` },
        ],
      ),
      explanation: `%${targetName} = (${target.count} × ${ELEMENTS[target.symbol].mass.toFixed(2)}) ÷ ${mm.toFixed(2)} × 100 = ${targetMass.toFixed(2)} ÷ ${mm.toFixed(2)} × 100 = ${correct.toFixed(2)}%.`,
    };
  },
});

// --- molar-mass-calculation: percent water in a hydrate ----------------------------------------
// Fixed pool (not open-ended random numbers): every entry below was hand-verified so none of its
// four rendered choices collide, and so the true and complement percentages never land near a
// 50/50 split (which would make "answered the wrong species" collide with the real answer).
const HYDRATES = [
  { formula: 'CuSO₄·5H₂O', anhydrousParts: [{ symbol: 'Cu', count: 1 }, { symbol: 'S', count: 1 }, { symbol: 'O', count: 4 }], n: 5 },
  { formula: 'MgSO₄·7H₂O', anhydrousParts: [{ symbol: 'Mg', count: 1 }, { symbol: 'S', count: 1 }, { symbol: 'O', count: 4 }], n: 7 },
  { formula: 'CaCl₂·2H₂O', anhydrousParts: [{ symbol: 'Ca', count: 1 }, { symbol: 'Cl', count: 2 }], n: 2 },
  { formula: 'Na₂CO₃·10H₂O', anhydrousParts: [{ symbol: 'Na', count: 2 }, { symbol: 'C', count: 1 }, { symbol: 'O', count: 3 }], n: 10 },
  { formula: 'BaCl₂·2H₂O', anhydrousParts: [{ symbol: 'Ba', count: 1 }, { symbol: 'Cl', count: 2 }], n: 2 },
  { formula: 'ZnSO₄·7H₂O', anhydrousParts: [{ symbol: 'Zn', count: 1 }, { symbol: 'S', count: 1 }, { symbol: 'O', count: 4 }], n: 7 },
];
const WATER_MASS = 2 * ELEMENTS.H.mass + ELEMENTS.O.mass; // 18.016 g/mol, shown at full precision
                                                            // (never rounded to 18.02) so no shown
                                                            // step is a rounded value carried further.

registerChemTemplate({
  id: 'chem1-acs-03-hydrate-percent-water',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Percent by mass of water in a hydrate',
  concepts: ['molar-mass-calculation'],
  generate: (rng, h) => {
    const hydrate = h.pick(HYDRATES);
    const anhydrousMM = molarMass(hydrate.anhydrousParts);
    const waterMass = hydrate.n * WATER_MASS;
    const hydrateMM = anhydrousMM + waterMass;
    const correct = (waterMass / hydrateMM) * 100;
    const forgotHydrateWater = (waterMass / anhydrousMM) * 100;
    const reportedAnhydrous = (anhydrousMM / hydrateMM) * 100;
    const singleWaterOnly = (WATER_MASS / hydrateMM) * 100;
    return {
      stem: `What is the percent by mass of water in ${hydrate.formula}?`,
      ...h.choices(
        { value: `${correct.toFixed(2)}%` },
        [
          { value: `${forgotHydrateWater.toFixed(2)}%`, error: 'forgot-hydrate-water-in-total', why: "used the anhydrous salt's molar mass as the total, forgetting that the waters of hydration add to the compound's total mass" },
          { value: `${reportedAnhydrous.toFixed(2)}%`, error: 'reported-anhydrous-percent', why: 'calculated the percent of the anhydrous salt instead of the percent of water' },
          { value: `${singleWaterOnly.toFixed(2)}%`, error: 'single-water-only', why: `used the mass of one water molecule instead of all ${hydrate.n} in the formula` },
        ],
      ),
      explanation: `Molar mass of ${hydrate.formula} = anhydrous molar mass + ${hydrate.n} × (molar mass of H₂O) = ${anhydrousMM.toFixed(2)} + ${hydrate.n} × ${WATER_MASS.toFixed(3)} = ${hydrateMM.toFixed(2)} g/mol. %water = (${hydrate.n} × ${WATER_MASS.toFixed(3)}) ÷ ${hydrateMM.toFixed(2)} × 100 = ${correct.toFixed(2)}%.`,
    };
  },
});

// --- avogadros-number + mole-ratios-from-formula: run the subscript backwards ------------------
registerChemTemplate({
  id: 'chem1-acs-03-atoms-to-moles-compound',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Moles of compound from an atom count of one element',
  concepts: ['avogadros-number', 'mole-ratios-from-formula'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = pickTargetWithSubscript(h, compound.parts);
    const count = target.count;
    const targetName = ELEMENTS[target.symbol].name;
    const molesTargetAtoms = h.pick([0.25, 0.5, 0.75, 1, 1.5, 2, 3]);
    const atomCount = molesTargetAtoms * AVOGADRO;
    const correct = molesTargetAtoms / count;
    return {
      stem: `A sample of ${compound.formula} contains ${formatSci(atomCount)} atoms of ${targetName}. How many moles of ${compound.formula} does the sample contain?`,
      ...h.choices(
        { value: `${correct.toFixed(3)} mol` },
        [
          { value: `${molesTargetAtoms.toFixed(3)} mol`, error: 'forgot-subscript-division', why: `stopped after converting to moles of ${targetName} atoms and never divided by the subscript (${count})` },
          { value: `${(molesTargetAtoms * count).toFixed(3)} mol`, error: 'multiplied-instead-of-divided', why: `multiplied by the subscript (${count}) instead of dividing by it` },
          { value: `${(correct * 10).toFixed(3)} mol`, error: 'wrong-power-of-ten', why: "was off by one power of ten converting atoms to moles" },
        ],
      ),
      explanation: `First convert atoms of ${targetName} to moles of ${targetName} atoms: ${formatSci(atomCount)} ÷ 6.022 × 10²³ = ${molesTargetAtoms} mol ${targetName} atoms. Each mole of ${compound.formula} contains ${count} mol of ${targetName} atoms (its subscript), so moles of ${compound.formula} = ${molesTargetAtoms} ÷ ${count} = ${correct.toFixed(3)} mol.`,
    };
  },
});

// --- molar-mass-calculation + empirical-formula-atomic-ratios: scale up to a molecular formula --
// Fixed pool: n (the empirical->molecular multiplier) is a known integer >= 2 for every entry, so
// "stopped at the empirical formula" (multiplier 1) can never collide with the real answer.
const MOLECULAR_FROM_EMPIRICAL = [
  { emp: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 2 }, { symbol: 'O', count: 1 }], n: 6, name: 'glucose' },
  { emp: [{ symbol: 'N', count: 1 }, { symbol: 'O', count: 2 }], n: 2, name: 'dinitrogen tetroxide' },
  { emp: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 1 }], n: 6, name: 'benzene' },
  { emp: [{ symbol: 'H', count: 1 }, { symbol: 'O', count: 1 }], n: 2, name: 'hydrogen peroxide' },
  { emp: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 3 }], n: 2, name: 'ethane' },
];

function scaleParts(parts, k) {
  return parts.map((p) => ({ symbol: p.symbol, count: p.count * k }));
}

// Two plausible-but-wrong multipliers, always distinct from n, from 1 (the empirical formula),
// and from each other: altA backs off by one (unless that collapses to 1, the empirical formula
// itself, in which case it steps up instead); altB always takes whichever of (n+1) altA left free.
function altMultipliers(n) {
  const altA = n - 1 >= 2 ? n - 1 : n + 1;
  const altB = altA === n + 1 ? n + 2 : n + 1;
  return [altA, altB];
}

registerChemTemplate({
  id: 'chem1-acs-03-molecular-formula-from-empirical',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Molecular formula from empirical formula and molar mass',
  concepts: ['molar-mass-calculation', 'empirical-formula-atomic-ratios'],
  generate: (rng, h) => {
    const compound = h.pick(MOLECULAR_FROM_EMPIRICAL);
    const empMass = molarMass(compound.emp);
    const actualMM = Number((empMass * compound.n).toFixed(2));
    const empFormula = partsToFormula(compound.emp);
    const molFormula = partsToFormula(scaleParts(compound.emp, compound.n));
    const [altA, altB] = altMultipliers(compound.n);
    return {
      stem: `A compound (${compound.name}) has empirical formula ${empFormula} (empirical formula mass ${empMass.toFixed(2)} g/mol). Its molar mass, measured experimentally, is ${actualMM.toFixed(2)} g/mol. What is its molecular formula?`,
      ...h.choices(
        { value: molFormula },
        [
          { value: empFormula, error: 'stopped-at-empirical', why: 'gave the empirical formula instead of scaling it up to match the measured molar mass' },
          { value: partsToFormula(scaleParts(compound.emp, altA)), error: 'wrong-multiplier', why: `multiplied every subscript by ${altA} instead of the correct ratio` },
          { value: partsToFormula(scaleParts(compound.emp, altB)), error: 'wrong-multiplier', why: `multiplied every subscript by ${altB} instead of the correct ratio` },
        ],
      ),
      explanation: `Divide the molar mass by the empirical formula mass to get the whole-number multiplier: ${actualMM.toFixed(2)} ÷ ${empMass.toFixed(2)} ≈ ${compound.n}. Multiply every subscript in ${empFormula} by ${compound.n}: ${molFormula}.`,
    };
  },
});

// --- avogadros-number + moles-to-mass-conversion: particles straight to mass -------------------
registerChemTemplate({
  id: 'chem1-acs-03-particles-to-mass',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Mass of a sample from a particle count',
  concepts: ['avogadros-number', 'moles-to-mass-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const mm = molarMass(compound.parts);
    const moles = h.pick([0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3]);
    const particleCount = moles * AVOGADRO;
    const correct = moles * mm;
    // The mantissa of the displayed scientific-notation particle count (always in [1, 10) since
    // that's how exponential notation normalizes) is never equal to `moles` itself for any pool
    // value below, so this distractor never collides with the answer.
    const mantissa = Number(particleCount.toExponential(2).split('e')[0]);
    return {
      stem: `A sample contains ${formatSci(particleCount)} individual particles of ${compound.formula}. What is the mass of the sample, in grams?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} g` },
        [
          { value: `${(mantissa * mm).toFixed(2)} g`, error: 'misread-exponent', why: 'used the leading digits of the particle count as the mole count, without properly converting the power of ten' },
          { value: `${(moles / mm).toFixed(2)} g`, error: 'inverted-operation', why: 'divided by molar mass instead of multiplying by it' },
          { value: `${(correct * 10).toFixed(2)} g`, error: 'wrong-power-of-ten', why: "was off by one power of ten converting particles to moles" },
        ],
      ),
      explanation: `moles = particles ÷ Avogadro's number = ${formatSci(particleCount)} ÷ 6.022 × 10²³ = ${moles} mol. mass = moles × molar mass = ${moles} mol × ${mm.toFixed(2)} g/mol = ${correct.toFixed(2)} g.`,
    };
  },
});

// --- mole-ratios-from-formula + moles-to-mass-conversion: target a specific atom count ---------
registerChemTemplate({
  id: 'chem1-acs-03-target-mass-for-atom-count',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Mass of compound needed for a target number of atoms',
  concepts: ['mole-ratios-from-formula', 'moles-to-mass-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = pickTargetWithSubscript(h, compound.parts);
    const count = target.count;
    const total = totalAtoms(compound.parts);
    const targetName = ELEMENTS[target.symbol].name;
    const mm = molarMass(compound.parts);
    const molesTargetAtoms = h.pick([0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.6, 2]);
    const molesCompound = molesTargetAtoms / count;
    const correct = molesCompound * mm;
    return {
      stem: `How many grams of ${compound.formula} are needed to obtain ${molesTargetAtoms} mol of ${targetName} atoms?`,
      ...h.choices(
        { value: `${correct.toFixed(3)} g` },
        [
          { value: `${((molesTargetAtoms / total) * mm).toFixed(3)} g`, error: 'used-total-atoms-not-subscript', why: `divided by the total atom count in the formula (${total}) instead of just ${targetName}'s subscript (${count})` },
          { value: `${molesCompound.toFixed(3)} g`, error: 'forgot-final-mass-step', why: 'stopped at moles of compound and never multiplied by molar mass' },
          { value: `${(molesTargetAtoms * count * mm).toFixed(3)} g`, error: 'multiplied-instead-of-divided', why: `multiplied by the subscript (${count}) instead of dividing by it` },
        ],
      ),
      explanation: `Moles of ${compound.formula} needed = moles of ${targetName} atoms ÷ ${count} (its subscript) = ${molesTargetAtoms} ÷ ${count}. mass = (${molesTargetAtoms} ÷ ${count}) × ${mm.toFixed(2)} = ${correct.toFixed(3)} g.`,
    };
  },
});

// =================================================================================================
// BAND 5 — three-or-more chained steps, or a two-idea synthesis
// =================================================================================================

// Percent composition, rounded to 2 dp and made to sum to exactly 100.00 (the last element in
// `parts` absorbs the rounding remainder) — matches how a real percent-composition problem is
// presented, and keeps every downstream number self-consistent with what's shown to the student.
function percentComposition(parts, mm) {
  const raw = parts.map((p) => ({ symbol: p.symbol, raw: (ELEMENTS[p.symbol].mass * p.count / mm) * 100 }));
  const rounded = raw.slice(0, -1).map((r) => ({ symbol: r.symbol, pct: Number(r.raw.toFixed(2)) }));
  const sumSoFar = rounded.reduce((sum, r) => sum + r.pct, 0);
  const last = raw[raw.length - 1];
  return [...rounded, { symbol: last.symbol, pct: Number((100 - sumSoFar).toFixed(2)) }];
}

function andJoin(items) {
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function percentPhrase(pctList) {
  return andJoin(pctList.map((p) => `${p.pct.toFixed(2)}% ${ELEMENTS[p.symbol].name}`));
}

// The correct empirical-formula derivation: moles per 100 g, ratio to the smallest, and a
// half-integer check (e.g. a 1 : 1.5 ratio) that doubles every subscript when needed.
function moleRatioFromPercent(pctList) {
  const moles = pctList.map(({ symbol, pct }) => ({ symbol, moles: pct / ELEMENTS[symbol].mass }));
  const minMoles = Math.min(...moles.map((m) => m.moles));
  let ratios = moles.map((m) => m.moles / minMoles);
  const doubled = ratios.some((r) => Math.abs(r - Math.round(r)) > 0.15 && Math.abs(r * 2 - Math.round(r * 2)) < 0.05);
  if (doubled) ratios = ratios.map((r) => r * 2);
  return { parts: moles.map((m, i) => ({ symbol: m.symbol, count: Math.max(1, Math.round(ratios[i])) })), doubled };
}

// Error mode: treated the mass percentages themselves as mole counts, skipping the ÷ atomic mass
// step entirely.
function ratioFromRawPercent(pctList) {
  const min = Math.min(...pctList.map((p) => p.pct));
  return pctList.map((p) => ({ symbol: p.symbol, count: Math.max(1, Math.round(p.pct / min)) }));
}

// Error mode: normalized every mole value against the LARGEST instead of the smallest, so the
// ratio never clears into small whole numbers.
function ratioByLargestMole(pctList) {
  const moles = pctList.map(({ symbol, pct }) => ({ symbol, moles: pct / ELEMENTS[symbol].mass }));
  const max = Math.max(...moles.map((m) => m.moles));
  return moles.map((m) => ({ symbol: m.symbol, count: Math.max(1, Math.round(m.moles / max)) }));
}

// Error mode: found the right whole-number ratio but paired the counts with the wrong elements.
function rotateCounts(parts) {
  const counts = parts.map((p) => p.count);
  const rotated = [counts[counts.length - 1], ...counts.slice(0, -1)];
  return parts.map((p, i) => ({ symbol: p.symbol, count: rotated[i] }));
}

// Fixed pool, hand-verified: for each of these six, the true empirical formula is recovered
// exactly by moleRatioFromPercent, AND the three distractor formulas below are pairwise distinct
// from it and from each other. (A handful of 1:2-ratio compounds were tried and dropped from this
// pool — e.g. Al₂O₃, BaCl₂, ZnCl₂ — because two of the three distractor methods happen to
// converge on the same wrong ratio for a simple 1:2 compound, which would silently ship a 3-choice
// question. Structural filtering by hand, not a sweep, since this is a small fixed pool.)
const EF_POOL = COMPOUNDS.filter((c) => ['Fe₂O₃', 'CaCO₃', 'MgCl₂', 'Na₂CO₃', 'PbO₂', 'CuSO₄'].includes(c.formula));

registerChemTemplate({
  id: 'chem1-acs-03-empirical-formula-mass-percent',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Empirical formula from mass percent composition',
  concepts: ['empirical-formula-atomic-ratios', 'mass-to-moles-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(EF_POOL);
    const mm = molarMass(compound.parts);
    const pctList = percentComposition(compound.parts, mm);
    const { parts: correctParts, doubled } = moleRatioFromPercent(pctList);
    const correctFormula = partsToFormula(correctParts);
    const rawPercentFormula = partsToFormula(ratioFromRawPercent(pctList));
    const largestMoleFormula = partsToFormula(ratioByLargestMole(pctList));
    const rotatedFormula = partsToFormula(rotateCounts(correctParts));
    const moleLines = pctList.map((p) => `${ELEMENTS[p.symbol].name} = ${p.pct.toFixed(2)} ÷ ${ELEMENTS[p.symbol].mass.toFixed(2)} ≈ ${(p.pct / ELEMENTS[p.symbol].mass).toFixed(3)} mol`).join(', ');
    const doublingNote = doubled ? ' (the ratio came out at a half-integer, so every subscript is doubled)' : '';
    return {
      stem: `A compound containing only ${andJoin(pctList.map((p) => ELEMENTS[p.symbol].name))} is found to be ${percentPhrase(pctList)} by mass. What is its empirical formula?`,
      ...h.choices(
        { value: correctFormula },
        [
          { value: rawPercentFormula, error: 'skipped-mole-conversion', why: 'used the mass percentages themselves as mole counts, without dividing each by its atomic mass first' },
          { value: largestMoleFormula, error: 'divided-by-largest-not-smallest', why: 'divided every mole value by the largest one instead of the smallest, so the ratio never reduced to small whole numbers' },
          { value: rotatedFormula, error: 'wrong-element-assignment', why: 'found the correct whole-number ratio but matched the subscripts to the wrong elements' },
        ],
      ),
      explanation: `Assume a 100 g sample: that gives ${pctList.map((p) => `${p.pct.toFixed(2)} g ${ELEMENTS[p.symbol].name}`).join(', ')}. Convert each to moles: ${moleLines}. Divide every mole value by the smallest to get the ratio${doublingNote}, then round to whole numbers: ${correctFormula}.`,
    };
  },
});

// --- mass-to-moles-conversion + mole-ratios-from-formula + avogadros-number: full atom count ----
registerChemTemplate({
  id: 'chem1-acs-03-atoms-of-element-in-sample',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Atoms of one element in a mass sample',
  concepts: ['mass-to-moles-conversion', 'mole-ratios-from-formula', 'avogadros-number'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = pickTargetWithSubscript(h, compound.parts);
    const count = target.count;
    const targetName = ELEMENTS[target.symbol].name;
    const mm = molarMass(compound.parts);
    // Every distractor below is `correct` scaled by some fixed factor of mass/mm and count (e.g.
    // "inverted-ratio" swaps mass/mm for mm/mass), so a coincidence isn't limited to mass landing
    // near mm — mass landing near mm × sqrt(count) makes "ignored-subscript" and "inverted-ratio"
    // converge instead (seen with 277 g of Fe₂O₃, count 3: mm × √3 ≈ 276.6). Rather than chase each
    // algebraic coincidence individually, redraw mass until the four values the student actually
    // sees are genuinely four distinct strings.
    let mass;
    let choiceStrings;
    do {
      mass = h.int(5, 300);
      const correctAtoms = (mass / mm) * count * AVOGADRO;
      choiceStrings = new Set([
        formatSci(correctAtoms),
        formatSci(correctAtoms / count),
        formatSci(correctAtoms / AVOGADRO),
        formatSci((mm / mass) * count * AVOGADRO),
      ]);
    } while (choiceStrings.size < 4);
    const correct = (mass / mm) * count * AVOGADRO;
    return {
      stem: `A ${mass} g sample of ${compound.formula} is analyzed. How many atoms of ${targetName} does it contain?`,
      ...h.choices(
        { value: formatSci(correct) },
        [
          { value: formatSci(correct / count), error: 'ignored-subscript', why: `stopped at atoms of ${compound.formula} and never multiplied by ${targetName}'s subscript (${count})` },
          { value: formatSci(correct / AVOGADRO), error: 'no-avogadro-conversion', why: 'gave the mole count of atoms, not the number of atoms' },
          { value: formatSci((mm / mass) * count * AVOGADRO), error: 'inverted-ratio', why: 'divided molar mass by mass instead of mass by molar mass, then carried that error through the rest of the calculation' },
        ],
      ),
      explanation: `moles ${compound.formula} = ${mass} g ÷ ${mm.toFixed(2)} g/mol. Each mole of ${compound.formula} contains ${count} mol of ${targetName} atoms, and each mole of atoms is 6.022 × 10²³ atoms: atoms = (${mass} ÷ ${mm.toFixed(2)}) × ${count} × 6.022 × 10²³ = ${formatSci(correct)}.`,
    };
  },
});

// --- mass-to-moles-conversion + mole-ratios-from-formula + moles-to-mass-conversion --------------
registerChemTemplate({
  id: 'chem1-acs-03-mass-of-element-in-sample',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Mass of one element present in a compound sample',
  concepts: ['mass-to-moles-conversion', 'mole-ratios-from-formula', 'moles-to-mass-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = pickTargetWithSubscript(h, compound.parts);
    const count = target.count;
    const targetName = ELEMENTS[target.symbol].name;
    const targetAtomicMass = ELEMENTS[target.symbol].mass;
    const others = compound.parts.filter((p) => p !== target);
    const other = h.pick(others);
    const mm = molarMass(compound.parts);
    const mass = h.int(10, 500);
    const correct = (mass / mm) * count * targetAtomicMass;
    return {
      stem: `A ${mass} g sample of ${compound.formula} is decomposed completely. What mass of ${targetName} does it contain?`,
      ...h.choices(
        { value: `${correct.toFixed(3)} g` },
        [
          { value: `${((mass / mm) * targetAtomicMass).toFixed(3)} g`, error: 'ignored-subscript', why: `used one ${targetName} atom's mass without carrying its subscript (${count})` },
          { value: `${((mass / mm) * count).toFixed(3)} g`, error: 'reported-moles-not-mass', why: `gave the mole count of ${targetName} atoms, not their mass in grams` },
          { value: `${((mass / mm) * other.count * ELEMENTS[other.symbol].mass).toFixed(3)} g`, error: 'wrong-element', why: `calculated the mass of ${ELEMENTS[other.symbol].name} instead of ${targetName}` },
        ],
      ),
      explanation: `mass of ${targetName} = (${mass} ÷ ${mm.toFixed(2)}) × ${count} × ${targetAtomicMass.toFixed(2)} = ${correct.toFixed(3)} g.`,
    };
  },
});

// --- empirical-formula-atomic-ratios + molar-mass-calculation: full synthesis --------------------
// Fixed pool, same reasoning as MOLECULAR_FROM_EMPIRICAL, but the stem gives mass percentages
// instead of the empirical formula directly — the student must derive the empirical formula
// (percent -> grams -> moles -> ratio) AND THEN scale it up, chaining both ideas in one question.
const EMPIRICAL_TO_MOLECULAR = [
  { emp: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 2 }, { symbol: 'O', count: 1 }], n: 6, name: 'glucose' },
  { emp: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 1 }], n: 6, name: 'benzene' },
  { emp: [{ symbol: 'H', count: 1 }, { symbol: 'O', count: 1 }], n: 2, name: 'hydrogen peroxide' },
];

registerChemTemplate({
  id: 'chem1-acs-03-empirical-then-molecular',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Molecular formula from mass percent and molar mass',
  concepts: ['empirical-formula-atomic-ratios', 'molar-mass-calculation'],
  generate: (rng, h) => {
    const compound = h.pick(EMPIRICAL_TO_MOLECULAR);
    const empMass = molarMass(compound.emp);
    const actualMM = Number((empMass * compound.n).toFixed(2));
    const pctList = percentComposition(compound.emp, empMass);
    const empFormula = partsToFormula(compound.emp);
    const molFormula = partsToFormula(scaleParts(compound.emp, compound.n));
    const [altA, altB] = altMultipliers(compound.n);
    return {
      stem: `A compound containing only ${andJoin(pctList.map((p) => ELEMENTS[p.symbol].name))} is ${percentPhrase(pctList)} by mass, and its molar mass is measured at ${actualMM.toFixed(2)} g/mol. What is its molecular formula?`,
      ...h.choices(
        { value: molFormula },
        [
          { value: empFormula, error: 'stopped-at-empirical', why: 'derived the empirical formula correctly but never scaled it up to match the measured molar mass' },
          { value: partsToFormula(scaleParts(compound.emp, altA)), error: 'wrong-multiplier', why: `multiplied every subscript by ${altA} instead of the correct ratio` },
          { value: partsToFormula(scaleParts(compound.emp, altB)), error: 'wrong-multiplier', why: `multiplied every subscript by ${altB} instead of the correct ratio` },
        ],
      ),
      explanation: `Assume a 100 g sample and convert each element's percent to moles, then divide by the smallest to get the empirical formula: ${empFormula} (empirical formula mass ${empMass.toFixed(2)} g/mol). Divide the actual molar mass by that: ${actualMM.toFixed(2)} ÷ ${empMass.toFixed(2)} ≈ ${compound.n}. Multiply every subscript in ${empFormula} by ${compound.n}: ${molFormula}.`,
    };
  },
});
