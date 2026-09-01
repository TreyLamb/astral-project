// Formula Calculations and the Mole. Original questions, informed by (never copied from) the
// ACS study guide's own "Specific topics covered" list for this chapter — see toolbox.js's
// header comment for the sourcing rule this follows.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-03-mole-calculations';

// Standard atomic masses (amu, == g/mol), atomic numbers, and the mass number of each element's
// most abundant naturally-occurring isotope. Values match common gen-chem textbook rounding.
const ELEMENTS = {
  H:  { name: 'hydrogen',  Z: 1,  mass: 1.008,   isotopeMassNumber: 1 },
  C:  { name: 'carbon',    Z: 6,  mass: 12.01,   isotopeMassNumber: 12 },
  N:  { name: 'nitrogen',  Z: 7,  mass: 14.01,   isotopeMassNumber: 14 },
  O:  { name: 'oxygen',    Z: 8,  mass: 16.00,   isotopeMassNumber: 16 },
  Na: { name: 'sodium',    Z: 11, mass: 22.99,   isotopeMassNumber: 23 },
  Mg: { name: 'magnesium', Z: 12, mass: 24.31,   isotopeMassNumber: 24 },
  Al: { name: 'aluminum',  Z: 13, mass: 26.98,   isotopeMassNumber: 27 },
  S:  { name: 'sulfur',    Z: 16, mass: 32.07,   isotopeMassNumber: 32 },
  Cl: { name: 'chlorine',  Z: 17, mass: 35.45,   isotopeMassNumber: 35 },
  K:  { name: 'potassium', Z: 19, mass: 39.10,   isotopeMassNumber: 39 },
  Ca: { name: 'calcium',   Z: 20, mass: 40.08,   isotopeMassNumber: 40 },
  Fe: { name: 'iron',      Z: 26, mass: 55.85,   isotopeMassNumber: 56 },
  Cu: { name: 'copper',    Z: 29, mass: 63.55,   isotopeMassNumber: 63 },
  Zn: { name: 'zinc',      Z: 30, mass: 65.38,   isotopeMassNumber: 64 },
  Ag: { name: 'silver',    Z: 47, mass: 107.87,  isotopeMassNumber: 107 },
  Ba: { name: 'barium',    Z: 56, mass: 137.33,  isotopeMassNumber: 138 },
  Pb: { name: 'lead',      Z: 82, mass: 207.2,   isotopeMassNumber: 208 },
};

// Compounds used across several templates below. Every entry has >=1 element with a subscript
// > 1, so "ignore the subscript" distractors never collide with the correct molar mass.
const COMPOUNDS = [
  { formula: 'H₂O',    parts: [{ symbol: 'H', count: 2 }, { symbol: 'O', count: 1 }] },
  { formula: 'CO₂',    parts: [{ symbol: 'C', count: 1 }, { symbol: 'O', count: 2 }] },
  { formula: 'CaCO₃',  parts: [{ symbol: 'Ca', count: 1 }, { symbol: 'C', count: 1 }, { symbol: 'O', count: 3 }] },
  { formula: 'Al₂O₃',  parts: [{ symbol: 'Al', count: 2 }, { symbol: 'O', count: 3 }] },
  { formula: 'MgCl₂',  parts: [{ symbol: 'Mg', count: 1 }, { symbol: 'Cl', count: 2 }] },
  { formula: 'Mg(OH)₂', parts: [{ symbol: 'Mg', count: 1 }, { symbol: 'O', count: 2 }, { symbol: 'H', count: 2 }] },
  { formula: 'C₆H₁₂O₆', parts: [{ symbol: 'C', count: 6 }, { symbol: 'H', count: 12 }, { symbol: 'O', count: 6 }] },
  { formula: 'NH₃',    parts: [{ symbol: 'N', count: 1 }, { symbol: 'H', count: 3 }] },
  { formula: 'Fe₂O₃',  parts: [{ symbol: 'Fe', count: 2 }, { symbol: 'O', count: 3 }] },
];

const molarMass = (parts) => parts.reduce((sum, p) => sum + ELEMENTS[p.symbol].mass * p.count, 0);
const molarMassIgnoringSubscripts = (parts) => parts.reduce((sum, p) => sum + ELEMENTS[p.symbol].mass, 0);
const molarMassUsingAtomicNumbers = (parts) => parts.reduce((sum, p) => sum + ELEMENTS[p.symbol].Z * p.count, 0);
const molarMassDroppingLast = (parts) => parts.slice(0, -1).reduce((sum, p) => sum + ELEMENTS[p.symbol].mass * p.count, 0);
const totalAtoms = (parts) => parts.reduce((sum, p) => sum + p.count, 0);
const sumString = (parts) => parts.map((p) => `(${p.count} × ${ELEMENTS[p.symbol].mass.toFixed(2)})`).join(' + ');

function pickDistinct(rng, arr, n) {
  const pool = arr.slice();
  const out = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '' };
const toSuperscript = (n) => String(n).split('').map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch).join('');
// display, never rely on raw float stringification: `n.toExponential(2)` always returns a
// fixed two-decimal mantissa string, so trailing digits can't silently disappear (see the
// chem1-toolbox-sig-figs-mult comment in toolbox.js for the bug this avoids).
function formatSci(n) {
  const [mantissa, expPart] = n.toExponential(2).split('e');
  return `${mantissa} × 10${toSuperscript(parseInt(expPart, 10))}`;
}

// --- average-atomic-mass-lookup ---------------------------------------------------------------
// H excluded: its atomic number (1) and its own most-abundant-isotope mass number (1) are the
// same value, which would collide two of the four choices for that one element (Doctrine's
// "exclude the degenerate value from the draw" rule).
const LOOKUP_POOL = ['C', 'N', 'O', 'Na', 'Mg', 'Al', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Ba', 'Pb'];

registerChemTemplate({
  id: 'chem1-03-avg-atomic-mass',
  chapterId: CH,
  band: 1,
  name: 'Reading average atomic mass off the periodic table',
  concepts: ['average-atomic-mass-lookup'],
  generate: (rng, h) => {
    const symbol = h.pick(LOOKUP_POOL);
    const el = ELEMENTS[symbol];
    return {
      stem: `On the periodic table, ${el.name} (${symbol}) is listed with atomic number ${el.Z} and average atomic mass ${el.mass.toFixed(2)}. Which value should you use as ${symbol}'s molar mass when converting between grams and moles?`,
      ...h.choices(
        { value: `${el.mass.toFixed(2)} amu — the average atomic mass` },
        [
          { value: `${el.Z} — the atomic number`, error: 'used-atomic-number', why: 'used the atomic number (proton count) instead of the average atomic mass' },
          { value: `${el.isotopeMassNumber} amu — the mass number of its most abundant isotope`, error: 'used-isotope-mass-number', why: "used a single isotope's mass number instead of the periodic table's weighted average" },
          { value: `${el.isotopeMassNumber + 1} amu — the mass number of a different isotope`, error: 'wrong-isotope-mass-number', why: "used a different isotope's mass number instead of the periodic table's weighted average" },
        ],
      ),
      explanation: `The periodic table's average atomic mass — a weighted average across all of ${el.name}'s naturally occurring isotopes — is numerically equal to its molar mass in g/mol. That's the number for mole calculations, never the atomic number or any single isotope's mass number.`,
    };
  },
});

// --- molar-mass-calculation -------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-03-molar-mass',
  chapterId: CH,
  band: 2,
  name: 'Molar mass from a formula',
  concepts: ['molar-mass-calculation'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const correct = molarMass(compound.parts);
    const ignoredSub = molarMassIgnoringSubscripts(compound.parts);
    const usedZ = molarMassUsingAtomicNumbers(compound.parts);
    const dropped = molarMassDroppingLast(compound.parts);
    return {
      stem: `What is the molar mass of ${compound.formula}?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} g/mol` },
        [
          { value: `${ignoredSub.toFixed(2)} g/mol`, error: 'ignored-subscripts', why: "added each element's average atomic mass once, ignoring the formula's subscripts" },
          { value: `${usedZ} g/mol`, error: 'used-atomic-number', why: 'summed atomic numbers instead of average atomic masses' },
          { value: `${dropped.toFixed(2)} g/mol`, error: 'dropped-a-term', why: 'left one of the elements out of the sum' },
        ],
      ),
      explanation: `Molar mass = sum of (average atomic mass × subscript) for every element: ${sumString(compound.parts)} = ${correct.toFixed(2)} g/mol.`,
    };
  },
});

// --- mass-to-moles-conversion -----------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-03-mass-to-moles',
  chapterId: CH,
  band: 2,
  name: 'Grams to moles',
  concepts: ['mass-to-moles-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const mm = molarMass(compound.parts);
    const mass = h.int(5, 300);
    const correct = mass / mm;
    const ignoredSub = molarMassIgnoringSubscripts(compound.parts);
    return {
      stem: `A sample of ${compound.formula} (molar mass ${mm.toFixed(2)} g/mol) has a mass of ${mass} g. How many moles is that?`,
      ...h.choices(
        { value: `${correct.toFixed(3)} mol` },
        [
          { value: `${(mm / mass).toFixed(3)} mol`, error: 'inverted-ratio', why: 'divided molar mass by mass instead of mass by molar mass' },
          { value: `${mass.toFixed(3)} mol`, error: 'no-conversion', why: 'used the mass in grams as if it were already a mole count' },
          { value: `${(mass / ignoredSub).toFixed(3)} mol`, error: 'wrong-molar-mass', why: "divided by a molar mass that ignored the formula's subscripts" },
        ],
      ),
      explanation: `moles = mass ÷ molar mass = ${mass} g ÷ ${mm.toFixed(2)} g/mol = ${correct.toFixed(3)} mol.`,
    };
  },
});

// --- avogadros-number --------------------------------------------------------------------------
const AVOGADRO = 6.022e23;
const SUBSTANCES = [
  { label: 'helium', particle: 'atoms' },
  { label: 'water', particle: 'molecules' },
  { label: 'NaCl', particle: 'formula units' },
  { label: 'glucose', particle: 'molecules' },
  { label: 'O₂', particle: 'molecules' },
  { label: 'iron', particle: 'atoms' },
];
const MOLES_POOL = [0.1, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

registerChemTemplate({
  id: 'chem1-03-avogadro-conversion',
  chapterId: CH,
  band: 1,
  name: "Moles to particle count via Avogadro's number",
  concepts: ['avogadros-number'],
  generate: (rng, h) => {
    const substance = h.pick(SUBSTANCES);
    const moles = h.pick(MOLES_POOL);
    const correct = moles * AVOGADRO;
    // Only the raw-mole-count distractor can render at a count of exactly 1 (the multiplied
    // and divided values are never anywhere near 1) — singularize just that one spot.
    const rawParticleWord = moles === 1 ? substance.particle.replace(/s$/, '') : substance.particle;
    return {
      stem: `You have ${moles} mol of ${substance.label} ${substance.particle}. How many individual ${substance.particle} is that?`,
      ...h.choices(
        { value: `${formatSci(correct)} ${substance.particle}` },
        [
          { value: `${formatSci(moles / AVOGADRO)} ${substance.particle}`, error: 'inverted-operation', why: "divided by Avogadro's number instead of multiplying by it" },
          { value: `${formatSci(moles * 6.022e22)} ${substance.particle}`, error: 'wrong-power-of-ten', why: "was off by one power of ten in Avogadro's number" },
          { value: `${moles} ${rawParticleWord}`, error: 'no-conversion', why: 'gave the mole count, not the number of particles' },
        ],
      ),
      explanation: `Avogadro's number (6.022 × 10²³ per mole) converts moles to a particle count: ${moles} mol × 6.022 × 10²³ ${substance.particle}/mol = ${formatSci(correct)} ${substance.particle}.`,
    };
  },
});

// --- mole-ratios-from-formula --------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-03-mole-ratio-formula',
  chapterId: CH,
  band: 2,
  name: 'Mole ratios from a formula',
  concepts: ['mole-ratios-from-formula'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const target = h.pick(compound.parts);
    const others = compound.parts.filter((p) => p !== target);
    const otherPart = h.pick(others);
    const N = h.pick([1, 2, 3, 4, 5, 6]);
    const correct = N * target.count;
    const total = totalAtoms(compound.parts);
    const targetName = ELEMENTS[target.symbol].name;
    return {
      stem: `How many moles of ${targetName} atoms are in ${N} mol of ${compound.formula}?`,
      ...h.choices(
        { value: `${correct} mol` },
        [
          { value: `${N} mol`, error: 'ignored-subscript', why: `used ${N} mol of ${compound.formula} directly, ignoring ${targetName}'s subscript in the formula` },
          { value: `${N * total} mol`, error: 'used-total-atoms', why: "multiplied by the total number of atoms in the formula instead of just this element's subscript" },
          { value: `${N * otherPart.count} mol`, error: 'wrong-element-subscript', why: `used ${ELEMENTS[otherPart.symbol].name}'s subscript instead of ${targetName}'s` },
        ],
      ),
      explanation: `Each mole of ${compound.formula} contains ${target.count} mol of ${targetName} atoms (its subscript in the formula), so ${N} mol ${compound.formula} × ${target.count} mol ${targetName}/mol ${compound.formula} = ${correct} mol ${targetName}.`,
    };
  },
});

// --- moles-to-mass-conversion -------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-03-moles-to-mass',
  chapterId: CH,
  band: 2,
  name: 'Moles to grams',
  concepts: ['moles-to-mass-conversion'],
  generate: (rng, h) => {
    const compound = h.pick(COMPOUNDS);
    const mm = molarMass(compound.parts);
    const moles = h.pick([0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
    const correct = moles * mm;
    const ignoredSub = molarMassIgnoringSubscripts(compound.parts);
    return {
      stem: `How many grams are in ${moles} mol of ${compound.formula} (molar mass ${mm.toFixed(2)} g/mol)?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} g` },
        [
          { value: `${(moles / mm).toFixed(4)} g`, error: 'inverted-ratio', why: 'divided moles by molar mass instead of multiplying' },
          { value: `${moles.toFixed(2)} g`, error: 'no-conversion', why: 'used the mole count as if it were already the mass in grams' },
          { value: `${(moles * ignoredSub).toFixed(2)} g`, error: 'wrong-molar-mass', why: "multiplied by a molar mass that ignored the formula's subscripts" },
        ],
      ),
      explanation: `mass = moles × molar mass = ${moles} mol × ${mm.toFixed(2)} g/mol = ${correct.toFixed(2)} g.`,
    };
  },
});

// --- empirical-formula-atomic-ratios ------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-03-empirical-atom-count',
  chapterId: CH,
  band: 3,
  name: 'Comparing atom counts in equal-mass samples',
  concepts: ['empirical-formula-atomic-ratios'],
  generate: (rng, h) => {
    const picks = pickDistinct(rng, COMPOUNDS, 3);
    const rows = picks.map((c) => {
      const mm = molarMass(c.parts);
      const atoms = totalAtoms(c.parts);
      const molesAtoms = (atoms / mm) * 10.0;
      return { compound: c, mm, atoms, molesAtoms };
    });
    const task = h.pick(['greatest', 'fewest']);
    const sorted = [...rows].sort((a, b) => (task === 'greatest' ? b.molesAtoms - a.molesAtoms : a.molesAtoms - b.molesAtoms));
    const winner = sorted[0];
    const losers = sorted.slice(1);
    const summary = rows
      .map((r) => `${r.compound.formula} (M = ${r.mm.toFixed(2)} g/mol, ${r.atoms} atoms/unit): ${r.molesAtoms.toFixed(3)} mol atoms`)
      .join('; ');
    return {
      stem: `Three 10.0 g samples are prepared: ${picks[0].formula}, ${picks[1].formula}, and ${picks[2].formula}. Which sample contains the ${task === 'greatest' ? 'GREATEST' : 'FEWEST'} total number of atoms?`,
      ...h.choices(
        { value: winner.compound.formula },
        [
          ...losers.map((l) => ({
            value: l.compound.formula,
            error: 'wrong-compound',
            why: `has a different atoms-per-gram ratio than the sample that actually has the ${task === 'greatest' ? 'most' : 'fewest'} atoms per gram`,
          })),
          {
            value: 'They all contain the same number of atoms',
            error: 'equal-mass-equal-atoms-fallacy',
            why: 'assumed equal mass means equal moles (and therefore equal atom count) — but different compounds have different molar masses',
          },
        ],
      ),
      explanation: `Compare moles of atoms per 10.0 g sample (atoms per formula unit ÷ molar mass × 10.0 g): ${summary}. ${winner.compound.formula} has the ${task === 'greatest' ? 'highest' : 'lowest'} value, so it has the ${task === 'greatest' ? 'most' : 'fewest'} atoms.`,
    };
  },
});
