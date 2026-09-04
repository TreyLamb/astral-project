// Atomic Structure — ACS-LEVEL (band 4-5) templates. Companion to ch01-atomic-structure.js,
// which owns the course-level (band 1-3) templates for this chapter. Original questions,
// informed by (never copied from) the ACS study guide's own "Knowledge Required" tags — see
// courses/chem/curriculum.js's header comment for the source and courses/chem/PLAN.md for the
// doctrine this follows.
//
// `section` is left null on every template here — an automated pass assigns the real book
// section later (see syllabusMap.js).

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-01-atomic-structure';

// --- shared formatting helpers (copied from ch01-atomic-structure.js's house style; that file
// does not export them, so they are redeclared here rather than imported) -------------------

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

// Monatomic anion: no parentheses ever (FeCl₂, never Fe(Cl)₂).
const formatMonatomic = (catSymbol, catCount, anSymbol, anCount) =>
  `${catSymbol}${catCount > 1 ? toSub(catCount) : ''}${anSymbol}${anCount > 1 ? toSub(anCount) : ''}`;

// Polyatomic anion: parenthesize the group only when its own subscript is > 1
// (Ca₃(PO₄)₂, but NaNO₃ with no parens since the nitrate subscript is 1).
const formatPolyatomic = (catSymbol, catCount, anFormula, anCount) =>
  `${catSymbol}${catCount > 1 ? toSub(catCount) : ''}${anCount > 1 ? `(${anFormula})${toSub(anCount)}` : anFormula}`;

// =============================================================================================
// 1. chem1-acs-01-weighted-average-backward (band 4)
// Given the average atomic mass and both isotopic masses, solve BACKWARD for one isotope's
// percent abundance — the reverse of the course-level template, which gives both abundances.
// =============================================================================================

const TWO_ISO_AVG_POOL = [
  { name: 'chlorine', symbol: 'Cl', avg: 35.45, isoA: { A: 35, mass: 34.9689 }, isoB: { A: 37, mass: 36.9659 } },
  { name: 'copper', symbol: 'Cu', avg: 63.55, isoA: { A: 63, mass: 62.9296 }, isoB: { A: 65, mass: 64.9278 } },
  { name: 'bromine', symbol: 'Br', avg: 79.90, isoA: { A: 79, mass: 78.9183 }, isoB: { A: 81, mass: 80.9163 } },
  { name: 'boron', symbol: 'B', avg: 10.81, isoA: { A: 10, mass: 10.0129 }, isoB: { A: 11, mass: 11.0093 } },
  { name: 'silver', symbol: 'Ag', avg: 107.87, isoA: { A: 107, mass: 106.9051 }, isoB: { A: 109, mass: 108.9048 } },
  { name: 'lithium', symbol: 'Li', avg: 6.94, isoA: { A: 6, mass: 6.0151 }, isoB: { A: 7, mass: 7.0160 } },
];

registerChemTemplate({
  id: 'chem1-acs-01-weighted-average-backward',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Isotope abundance solved backward from the average atomic mass',
  concepts: ['relative-abundance-weighted-average'],
  generate: (rng, h) => {
    const el = h.pick(TWO_ISO_AVG_POOL);
    const { isoA, isoB, avg } = el;
    const solveForA = h.pick([true, false]);
    const target = solveForA ? isoA : isoB;
    const other = solveForA ? isoB : isoA;
    const fTarget = (avg - other.mass) / (target.mass - other.mass);
    const correctPct = fTarget * 100;
    const otherPct = 100 - correctPct;
    const fTargetIntMass = (avg - other.A) / (target.A - other.A);
    const wrongPctIntMass = fTargetIntMass * 100;
    return {
      stem: `A naturally occurring sample of ${el.name} contains two isotopes: ${el.symbol}-${isoA.A} (isotopic mass ${isoA.mass.toFixed(4)} amu) and ${el.symbol}-${isoB.A} (isotopic mass ${isoB.mass.toFixed(4)} amu). The average atomic mass of ${el.name}, as listed on the periodic table, is ${avg.toFixed(2)} amu. What is the percent abundance of ${el.symbol}-${target.A}?`,
      ...h.choices(
        { value: `${correctPct.toFixed(1)}%` },
        [
          { value: `${otherPct.toFixed(1)}%`, error: 'reported-other-isotope-abundance', why: `solved for the abundance of ${el.symbol}-${other.A} instead of ${el.symbol}-${target.A}` },
          { value: '50.0%', error: 'assumed-equal-abundance', why: 'assumed the two isotopes are equally abundant instead of solving from the given average atomic mass' },
          { value: `${wrongPctIntMass.toFixed(1)}%`, error: 'used-mass-number-not-isotopic-mass', why: `used each isotope's whole-number mass number (${isoA.A} and ${isoB.A}) instead of its precise isotopic mass in the calculation` },
          { value: `${avg.toFixed(1)}%`, error: 'used-mass-as-percent', why: 'used the average atomic mass value itself as if it were the percent abundance' },
        ],
      ),
      explanation: `Let x = fractional abundance of ${el.symbol}-${target.A}. Average mass = (mass of ${el.symbol}-${target.A} × x) + (mass of ${el.symbol}-${other.A} × (1 − x)): ${avg.toFixed(2)} = ${target.mass.toFixed(4)}x + ${other.mass.toFixed(4)}(1 − x). Solving gives x = ${fTarget.toFixed(4)}, so ${el.symbol}-${target.A} is ${correctPct.toFixed(1)}% abundant.`,
    };
  },
});

// =============================================================================================
// Shared pool for templates 2 and 6: real three-isotope elements (mass spectrum work).
// =============================================================================================

const THREE_ISOTOPE_POOL = [
  {
    name: 'magnesium', symbol: 'Mg',
    isotopes: [
      { A: 24, mass: 23.9850, ab: 78.99 },
      { A: 25, mass: 24.9858, ab: 10.00 },
      { A: 26, mass: 25.9826, ab: 11.01 },
    ],
    allowedMissing: [0, 1, 2],
  },
  {
    name: 'silicon', symbol: 'Si',
    isotopes: [
      { A: 28, mass: 27.9769, ab: 92.23 },
      { A: 29, mass: 28.9765, ab: 4.68 },
      { A: 30, mass: 29.9738, ab: 3.09 },
    ],
    allowedMissing: [0, 1, 2],
  },
  {
    name: 'neon', symbol: 'Ne',
    isotopes: [
      { A: 20, mass: 19.9924, ab: 90.48 },
      { A: 21, mass: 20.9938, ab: 0.27 },
      { A: 22, mass: 21.9914, ab: 9.25 },
    ],
    // index 1 (0.27% abundance) excluded from allowedMissing: the "renormalize over the two
    // given isotopes" distractor becomes numerically indistinguishable from the correct answer
    // when the omitted isotope's true abundance is this tiny (verified by hand: both round to
    // the same 2-dp value). A degenerate draw, excluded per Doctrine rule 5, not patched.
    allowedMissing: [0, 2],
  },
];

// =============================================================================================
// 2. chem1-acs-01-mass-spectrum-normalize (band 4)
// Relative peak intensities (arbitrary units), not ready-made percentages — the buried step is
// normalizing to the total before weighting.
// =============================================================================================

registerChemTemplate({
  id: 'chem1-acs-01-mass-spectrum-normalize',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Average atomic mass from relative mass-spectrum peak intensities',
  concepts: ['relative-abundance-weighted-average'],
  generate: (rng, h) => {
    // Neon excluded here: its 0.27%-abundance isotope is always the smallest peak, so "drop the
    // smallest peak and renormalize over the other two" lands within rounding distance of the
    // correct answer on EVERY draw (verified: both round to the same 2-dp value) — not a rare
    // fluke to patch but a degenerate case to exclude per Doctrine rule 5. Mg and Si have no
    // isotope that thin, so their "drop smallest" distractor stays genuinely distinct.
    const el = h.pick(THREE_ISOTOPE_POOL.filter((e) => e.symbol !== 'Ne'));
    const k = h.int(3, 9);
    const intens = el.isotopes.map((iso) => Math.round(iso.ab * k));
    const total = intens[0] + intens[1] + intens[2];
    const correct = el.isotopes.reduce((s, iso, i) => s + iso.mass * (intens[i] / total), 0);
    const unweighted = (el.isotopes[0].mass + el.isotopes[1].mass + el.isotopes[2].mass) / 3;
    const notNormalized = el.isotopes.reduce((s, iso, i) => s + iso.mass * (intens[i] / 100), 0);
    let minIdx = 0;
    for (let i = 1; i < 3; i++) if (intens[i] < intens[minIdx]) minIdx = i;
    const keptIdx = [0, 1, 2].filter((i) => i !== minIdx);
    const keptTotal = intens[keptIdx[0]] + intens[keptIdx[1]];
    const droppedSmallest = keptIdx.reduce((s, i) => s + el.isotopes[i].mass * (intens[i] / keptTotal), 0);
    const peaksList = el.isotopes.map((iso, i) => `${el.symbol}-${iso.A} (relative intensity ${intens[i]})`).join(', ');
    const massesList = el.isotopes.map((iso) => `${el.symbol}-${iso.A} = ${iso.mass.toFixed(4)} amu`).join(', ');
    return {
      stem: `A mass spectrum of ${el.name} shows three peaks with these relative intensities (arbitrary units): ${peaksList}. Using the isotopic masses ${massesList}, what is the average atomic mass of ${el.name}?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} amu` },
        [
          { value: `${notNormalized.toFixed(2)} amu`, error: 'intensities-not-normalized', why: 'used the relative intensities directly as percentages instead of first dividing each by the total intensity' },
          { value: `${unweighted.toFixed(2)} amu`, error: 'unweighted-average', why: 'averaged the three isotopic masses directly, ignoring the relative intensities entirely' },
          { value: `${droppedSmallest.toFixed(2)} amu`, error: 'dropped-isotope-term', why: 'left the isotope with the smallest peak out of the calculation' },
        ],
      ),
      explanation: `Normalize each intensity to a fraction of the total (${intens[0]} + ${intens[1]} + ${intens[2]} = ${total}), then take the weighted average: ${el.isotopes.map((iso, i) => `(${iso.mass.toFixed(4)} × ${intens[i]}/${total})`).join(' + ')} = ${correct.toFixed(2)} amu.`,
    };
  },
});

// =============================================================================================
// 3. chem1-acs-01-isoelectronic-series (band 5)
// Requires computing the target's electron count AND checking it against several candidates
// spanning different elements/charges — genuine multi-entity synthesis, not a single formula.
// =============================================================================================

const ELECTRON_FAMILIES = [
  {
    count: 10,
    members: [
      { label: 'Na⁺', name: 'sodium', Z: 11, charge: 1, chemFamily: 'alkali metal' },
      { label: 'Mg²⁺', name: 'magnesium', Z: 12, charge: 2, chemFamily: 'alkaline earth metal' },
      { label: 'Al³⁺', name: 'aluminum', Z: 13, charge: 3, chemFamily: 'other metal' },
      { label: 'F⁻', name: 'fluorine', Z: 9, charge: -1, chemFamily: 'halogen' },
      { label: 'O²⁻', name: 'oxygen', Z: 8, charge: -2, chemFamily: 'chalcogen' },
      { label: 'Ne', name: 'neon', Z: 10, charge: 0, chemFamily: 'noble gas' },
    ],
  },
  {
    count: 18,
    members: [
      { label: 'K⁺', name: 'potassium', Z: 19, charge: 1, chemFamily: 'alkali metal' },
      { label: 'Ca²⁺', name: 'calcium', Z: 20, charge: 2, chemFamily: 'alkaline earth metal' },
      { label: 'Sc³⁺', name: 'scandium', Z: 21, charge: 3, chemFamily: 'transition metal' },
      { label: 'Cl⁻', name: 'chlorine', Z: 17, charge: -1, chemFamily: 'halogen' },
      { label: 'S²⁻', name: 'sulfur', Z: 16, charge: -2, chemFamily: 'chalcogen' },
      { label: 'Ar', name: 'argon', Z: 18, charge: 0, chemFamily: 'noble gas' },
    ],
  },
  {
    count: 36,
    members: [
      { label: 'Rb⁺', name: 'rubidium', Z: 37, charge: 1, chemFamily: 'alkali metal' },
      { label: 'Sr²⁺', name: 'strontium', Z: 38, charge: 2, chemFamily: 'alkaline earth metal' },
      { label: 'Y³⁺', name: 'yttrium', Z: 39, charge: 3, chemFamily: 'transition metal' },
      { label: 'Br⁻', name: 'bromine', Z: 35, charge: -1, chemFamily: 'halogen' },
      { label: 'Se²⁻', name: 'selenium', Z: 34, charge: -2, chemFamily: 'chalcogen' },
      { label: 'Kr', name: 'krypton', Z: 36, charge: 0, chemFamily: 'noble gas' },
    ],
  },
];

registerChemTemplate({
  id: 'chem1-acs-01-isoelectronic-series',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Identifying an isoelectronic species',
  concepts: ['ion-charge-electrons-protons'],
  generate: (rng, h) => {
    const famIdx = h.int(0, ELECTRON_FAMILIES.length - 1);
    const fam = ELECTRON_FAMILIES[famIdx];
    const chargedMembers = fam.members.filter((m) => m.charge !== 0);
    const target = h.pick(chargedMembers);
    const correctCandidates = fam.members.filter((m) => m !== target);
    const correct = h.pick(correctCandidates);
    const targetElectrons = target.Z - target.charge;
    const d1Label = `a neutral ${target.name} atom`;
    const otherFamilies = ELECTRON_FAMILIES.filter((_, i) => i !== famIdx);

    const pickFromFamily = (f) => {
      const sameChem = f.members.find((m) => m.chemFamily === target.chemFamily && m.charge !== 0);
      if (sameChem) return { member: sameChem, kind: 'same-chemical-family-different-electron-count' };
      const candidates = f.members.filter((m) => m.charge !== 0);
      return { member: h.pick(candidates), kind: 'wrong-electron-count' };
    };
    const d2 = pickFromFamily(otherFamilies[0]);
    const d3 = pickFromFamily(otherFamilies[1]);

    const whyFor = (d) => (d.kind === 'same-chemical-family-different-electron-count'
      ? `${d.member.label} is in the same ${target.chemFamily} family as ${target.label}, but same-family ions are not automatically isoelectronic — it has ${d.member.Z - d.member.charge} electrons, not ${targetElectrons}`
      : `${d.member.label} has ${d.member.Z - d.member.charge} electrons, not ${targetElectrons}`);

    const fmtCharge = (c) => (c === 0 ? '0' : (c > 0 ? `+${c}` : `${c}`));

    return {
      stem: `A ${target.name} ion, ${target.label}, has an atomic number of ${target.Z}. Which of the following species contains the SAME number of electrons as ${target.label}?`,
      ...h.choices(
        { value: correct.label },
        [
          { value: d1Label, error: 'used-atomic-number-not-electron-count', why: `a neutral ${target.name} atom has ${target.Z} electrons, not ${targetElectrons} — this ignores that ${target.label} has gained or lost electrons` },
          { value: d2.member.label, error: d2.kind, why: whyFor(d2) },
          { value: d3.member.label, error: d3.kind, why: whyFor(d3) },
        ],
      ),
      explanation: `${target.label} has ${target.Z} protons and a charge of ${fmtCharge(target.charge)}, so it has ${targetElectrons} electrons (protons − charge). ${correct.label} has ${correct.Z} protons and a charge of ${fmtCharge(correct.charge)}, giving ${correct.Z - correct.charge} electrons — matching ${target.label}, so the two are isoelectronic.`,
    };
  },
});

// =============================================================================================
// 4. chem1-acs-01-unknown-element-from-particles (band 4)
// Given mass number + neutron count (not atomic number directly): subtract to find Z, then
// recall the element identity from it — a calculation step plus a recall step.
// =============================================================================================

const ELEMENT_BY_Z = {
  1: { s: 'H', n: 'hydrogen' }, 2: { s: 'He', n: 'helium' }, 3: { s: 'Li', n: 'lithium' },
  4: { s: 'Be', n: 'beryllium' }, 5: { s: 'B', n: 'boron' }, 6: { s: 'C', n: 'carbon' },
  7: { s: 'N', n: 'nitrogen' }, 8: { s: 'O', n: 'oxygen' }, 9: { s: 'F', n: 'fluorine' },
  10: { s: 'Ne', n: 'neon' }, 11: { s: 'Na', n: 'sodium' }, 12: { s: 'Mg', n: 'magnesium' },
  13: { s: 'Al', n: 'aluminum' }, 14: { s: 'Si', n: 'silicon' }, 15: { s: 'P', n: 'phosphorus' },
  16: { s: 'S', n: 'sulfur' }, 17: { s: 'Cl', n: 'chlorine' }, 18: { s: 'Ar', n: 'argon' },
  19: { s: 'K', n: 'potassium' }, 20: { s: 'Ca', n: 'calcium' }, 21: { s: 'Sc', n: 'scandium' },
  22: { s: 'Ti', n: 'titanium' }, 23: { s: 'V', n: 'vanadium' }, 24: { s: 'Cr', n: 'chromium' },
  25: { s: 'Mn', n: 'manganese' }, 26: { s: 'Fe', n: 'iron' }, 27: { s: 'Co', n: 'cobalt' },
  28: { s: 'Ni', n: 'nickel' }, 29: { s: 'Cu', n: 'copper' }, 30: { s: 'Zn', n: 'zinc' },
  31: { s: 'Ga', n: 'gallium' }, 32: { s: 'Ge', n: 'germanium' }, 33: { s: 'As', n: 'arsenic' },
  34: { s: 'Se', n: 'selenium' }, 35: { s: 'Br', n: 'bromine' }, 36: { s: 'Kr', n: 'krypton' },
  37: { s: 'Rb', n: 'rubidium' }, 38: { s: 'Sr', n: 'strontium' }, 39: { s: 'Y', n: 'yttrium' },
  40: { s: 'Zr', n: 'zirconium' },
};

// Each entry: Z ≠ (A − Z) [neutron count], hand-verified — see the "used-neutron-count" distractor
// note below for why that exclusion matters (Doctrine rule 5: exclude the degenerate draw).
const UNKNOWN_ELEMENT_POOL = [
  { Z: 9, A: 19 },
  { Z: 11, A: 23 },
  { Z: 13, A: 27 },
  { Z: 15, A: 31 },
  { Z: 17, A: 35 },
  { Z: 18, A: 40 },
  { Z: 19, A: 39 },
];

registerChemTemplate({
  id: 'chem1-acs-01-unknown-element-from-particles',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Identifying an unknown element from mass number and neutron count',
  concepts: ['atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    const pick = h.pick(UNKNOWN_ELEMENT_POOL);
    const { Z, A } = pick;
    const N = A - Z;
    const correctEl = ELEMENT_BY_Z[Z];
    const d1 = ELEMENT_BY_Z[A];
    const d2 = ELEMENT_BY_Z[N];
    const d3 = ELEMENT_BY_Z[Z - 1];
    const d4 = ELEMENT_BY_Z[Z + 1];
    return {
      stem: `A neutral atom has a mass number of ${A} and contains ${N} neutrons. What element is it?`,
      ...h.choices(
        { value: correctEl.n },
        [
          { value: d1.n, error: 'confused-mass-number-with-atomic-number', why: 'looked up the element using the mass number as if it were the atomic number, instead of first subtracting the neutron count' },
          { value: d2.n, error: 'confused-neutron-count-with-atomic-number', why: 'looked up the element using the neutron count as if it were the atomic number' },
          { value: d3.n, error: 'off-by-one-subtraction', why: 'was off by one proton when subtracting the neutron count from the mass number' },
          { value: d4.n, error: 'off-by-one-subtraction', why: 'was off by one proton when subtracting the neutron count from the mass number' },
        ],
      ),
      explanation: `atomic number (protons) = mass number − neutrons = ${A} − ${N} = ${Z}, which identifies the element as ${correctEl.n} (${correctEl.s}).`,
    };
  },
});

// =============================================================================================
// 5. chem1-acs-01-ion-to-ionic-formula (band 5)
// Synthesis: derive the element from its electron count and charge, THEN crisscross with a
// named polyatomic ion. Two concepts, chained.
// =============================================================================================

const SYNTH_CATIONS = [
  { symbol: 'Na', name: 'sodium', Z: 11, charge: 1 },
  { symbol: 'Mg', name: 'magnesium', Z: 12, charge: 2 },
  { symbol: 'Al', name: 'aluminum', Z: 13, charge: 3 },
  { symbol: 'K', name: 'potassium', Z: 19, charge: 1 },
  { symbol: 'Ca', name: 'calcium', Z: 20, charge: 2 },
  { symbol: 'Zn', name: 'zinc', Z: 30, charge: 2 },
];
const SYNTH_ANIONS = [
  { formula: 'NO₃', name: 'nitrate', charge: -1 },
  { formula: 'OH', name: 'hydroxide', charge: -1 },
  { formula: 'SO₄', name: 'sulfate', charge: -2 },
  { formula: 'CO₃', name: 'carbonate', charge: -2 },
  { formula: 'PO₄', name: 'phosphate', charge: -3 },
];

registerChemTemplate({
  id: 'chem1-acs-01-ion-to-ionic-formula',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Identify the element from electrons + charge, then write its polyatomic formula',
  concepts: ['ion-charge-electrons-protons', 'predicting-ionic-formulas'],
  generate: (rng, h) => {
    const cat = h.pick(SYNTH_CATIONS);
    // Excluding anions whose charge magnitude equals the cation's charge: otherwise the
    // correctly-reduced formula is 1:1, identical to the "ignored-charge" distractor's 1:1
    // guess (Doctrine rule 5 — exclude the degenerate draw rather than patch the collision).
    const validAnions = SYNTH_ANIONS.filter((a) => Math.abs(a.charge) !== cat.charge);
    const an = h.pick(validAnions);
    const electrons = cat.Z - cat.charge;
    const m = Math.abs(an.charge);
    const g = gcd(cat.charge, m);
    const catCount = m / g;
    const anCount = cat.charge / g;
    const correct = formatPolyatomic(cat.symbol, catCount, an.formula, anCount);
    const swapped = formatPolyatomic(cat.symbol, cat.charge, an.formula, m);
    const ignored = formatPolyatomic(cat.symbol, 1, an.formula, 1);
    const summed = formatPolyatomic(cat.symbol, 1, an.formula, cat.charge + m);
    return {
      stem: `An ion has a charge of ${cat.charge}+ and contains ${electrons} electrons. Identify the element, then write the correct formula for the neutral ionic compound it forms with the ${an.name} ion (${an.formula}${chargeSup(an.charge)}).`,
      ...h.choices(
        { value: correct },
        [
          { value: swapped, error: 'swapped-subscripts', why: "used each ion's own charge as its own subscript instead of crisscrossing the charges onto the other ion" },
          { value: ignored, error: 'ignored-charge', why: 'wrote a 1:1 formula and ignored the charges entirely' },
          { value: summed, error: 'summed-charges-as-subscript', why: "added the two ions' charge magnitudes together into one subscript instead of crisscrossing each charge onto the other ion" },
        ],
      ),
      explanation: `protons = electrons + charge = ${electrons} + ${cat.charge} = ${cat.Z}, which identifies the element as ${cat.name} (${cat.symbol}), forming the ion ${cat.symbol}${chargeSup(cat.charge)}. Crisscrossing charges with ${an.name} (${an.formula}${chargeSup(an.charge)}): the cation's charge magnitude (${cat.charge}) becomes the anion's subscript and the anion's charge magnitude (${m}) becomes the cation's subscript, reduced by their greatest common factor (${g}): ${correct}.`,
    };
  },
});

// =============================================================================================
// 6. chem1-acs-01-missing-isotope-abundance (band 4)
// Only two of three abundances are given; the buried step is recognizing they must sum to 100%
// before the weighted average can even be set up.
// =============================================================================================

registerChemTemplate({
  id: 'chem1-acs-01-missing-isotope-abundance',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Average atomic mass with one isotope abundance omitted',
  concepts: ['relative-abundance-weighted-average'],
  generate: (rng, h) => {
    const el = h.pick(THREE_ISOTOPE_POOL);
    const missingIdx = h.pick(el.allowedMissing);
    const givenIdx = [0, 1, 2].filter((i) => i !== missingIdx);
    const g1 = el.isotopes[givenIdx[0]];
    const g2 = el.isotopes[givenIdx[1]];
    const missing = el.isotopes[missingIdx];
    const missingAb = 100 - g1.ab - g2.ab;
    const correct = g1.mass * (g1.ab / 100) + g2.mass * (g2.ab / 100) + missing.mass * (missingAb / 100);
    const renormOverGiven = g1.mass * (g1.ab / (g1.ab + g2.ab)) + g2.mass * (g2.ab / (g1.ab + g2.ab));
    const droppedMissing = g1.mass * (g1.ab / 100) + g2.mass * (g2.ab / 100);
    const unweighted = (g1.mass + g2.mass + missing.mass) / 3;
    const capName = el.name[0].toUpperCase() + el.name.slice(1);
    return {
      stem: `${capName} has three naturally occurring isotopes: ${el.symbol}-${g1.A} (mass ${g1.mass.toFixed(4)} amu), ${el.symbol}-${g2.A} (mass ${g2.mass.toFixed(4)} amu), and ${el.symbol}-${missing.A} (mass ${missing.mass.toFixed(4)} amu). A natural sample is ${g1.ab.toFixed(2)}% ${el.symbol}-${g1.A} and ${g2.ab.toFixed(2)}% ${el.symbol}-${g2.A}; the remainder is ${el.symbol}-${missing.A}. What is the average atomic mass of ${el.name}?`,
      ...h.choices(
        { value: `${correct.toFixed(2)} amu` },
        [
          { value: `${renormOverGiven.toFixed(2)} amu`, error: 'omitted-third-isotope-renormalized', why: `treated ${g1.ab.toFixed(2)}% and ${g2.ab.toFixed(2)}% as if they summed to 100%, renormalizing over just those two isotopes instead of first finding ${el.symbol}-${missing.A}'s abundance` },
          { value: `${droppedMissing.toFixed(2)} amu`, error: 'dropped-third-isotope-entirely', why: `left ${el.symbol}-${missing.A} out of the weighted average entirely instead of computing its abundance as the remainder` },
          { value: `${unweighted.toFixed(2)} amu`, error: 'unweighted-average-all-three', why: 'averaged the three isotopic masses directly, ignoring abundance entirely' },
        ],
      ),
      explanation: `The three abundances must sum to 100%, so ${el.symbol}-${missing.A} makes up 100 − ${g1.ab.toFixed(2)} − ${g2.ab.toFixed(2)} = ${missingAb.toFixed(2)}%. Weighted average = ${g1.mass.toFixed(4)} × ${(g1.ab / 100).toFixed(4)} + ${g2.mass.toFixed(4)} × ${(g2.ab / 100).toFixed(4)} + ${missing.mass.toFixed(4)} × ${(missingAb / 100).toFixed(4)} = ${correct.toFixed(2)} amu.`,
    };
  },
});

// =============================================================================================
// 7. chem1-acs-01-transition-metal-formula (band 4)
// Roman-numeral naming with a metal that has TWO common charges — the trap is reading (and
// using) the specified charge rather than a memorized default.
// =============================================================================================

const TRANSITION_METALS = [
  { symbol: 'Fe', name: 'iron', charges: [2, 3] },
  { symbol: 'Cu', name: 'copper', charges: [1, 2] },
  { symbol: 'Pb', name: 'lead', charges: [2, 4] },
  { symbol: 'Sn', name: 'tin', charges: [2, 4] },
];
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const MULTI_CHARGE_ANIONS = [
  { symbol: 'Cl', name: 'chloride', charge: -1 },
  { symbol: 'Br', name: 'bromide', charge: -1 },
  { symbol: 'F', name: 'fluoride', charge: -1 },
  { symbol: 'I', name: 'iodide', charge: -1 },
  { symbol: 'O', name: 'oxide', charge: -2 },
  { symbol: 'S', name: 'sulfide', charge: -2 },
  { symbol: 'N', name: 'nitride', charge: -3 },
  { symbol: 'P', name: 'phosphide', charge: -3 },
];

registerChemTemplate({
  id: 'chem1-acs-01-transition-metal-formula',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Ionic formula from a Roman-numeral transition-metal name',
  concepts: ['predicting-ionic-formulas'],
  generate: (rng, h) => {
    const metal = h.pick(TRANSITION_METALS);
    const chosenIdx = h.int(0, 1);
    const chosen = metal.charges[chosenIdx];
    const other = metal.charges[1 - chosenIdx];
    // Exclude anions matching EITHER of the metal's two charges: matching `chosen` would give
    // the "ignored charge" 1:1 distractor a real shot at colliding with correct; matching
    // `other` would collapse the "used the other common charge" distractor onto "ignored
    // charge" instead (both degenerate cases the same rule 5 fix covers).
    const validAnions = MULTI_CHARGE_ANIONS.filter((a) => Math.abs(a.charge) !== chosen && Math.abs(a.charge) !== other);
    const an = h.pick(validAnions);
    const m = Math.abs(an.charge);
    const g = gcd(chosen, m);
    const catCount = m / g;
    const anCount = chosen / g;
    const correct = formatMonatomic(metal.symbol, catCount, an.symbol, anCount);
    const gOther = gcd(other, m);
    const otherFormula = formatMonatomic(metal.symbol, m / gOther, an.symbol, other / gOther);
    const swapped = formatMonatomic(metal.symbol, chosen, an.symbol, m);
    const ignored = formatMonatomic(metal.symbol, 1, an.symbol, 1);
    return {
      stem: `What is the correct formula for ${metal.name}(${ROMAN[chosen]}) ${an.name}?`,
      ...h.choices(
        { value: correct },
        [
          { value: otherFormula, error: 'used-other-common-charge', why: `used ${metal.name}'s other common charge (${other}+) instead of the ${chosen}+ specified by the Roman numeral (${ROMAN[chosen]})` },
          { value: swapped, error: 'swapped-subscripts', why: "used each ion's own charge as its own subscript instead of crisscrossing the charges onto the other ion" },
          { value: ignored, error: 'ignored-charge', why: 'wrote a 1:1 formula and ignored the charges entirely' },
        ],
      ),
      explanation: `The Roman numeral (${ROMAN[chosen]}) specifies the metal ion's charge as ${chosen}+, giving ${metal.symbol}${chargeSup(chosen)}. Crisscrossing with ${an.name} (${an.symbol}${chargeSup(an.charge)}): the cation's charge magnitude (${chosen}) becomes the anion's subscript and the anion's charge magnitude (${m}) becomes the cation's subscript, reduced by their greatest common factor (${g}): ${correct}.`,
    };
  },
});

// =============================================================================================
// 8. chem1-acs-01-polyatomic-ionic-formula (band 4)
// Same crisscross rule as the course-level template, but with a polyatomic anion — the real
// ACS-level trap is remembering the parentheses when that anion's subscript is > 1.
// =============================================================================================

const SIMPLE_CATIONS_8 = [
  { symbol: 'Na', name: 'sodium', charge: 1 },
  { symbol: 'K', name: 'potassium', charge: 1 },
  { symbol: 'Ag', name: 'silver', charge: 1 },
  { symbol: 'Mg', name: 'magnesium', charge: 2 },
  { symbol: 'Ca', name: 'calcium', charge: 2 },
  { symbol: 'Zn', name: 'zinc', charge: 2 },
  { symbol: 'Al', name: 'aluminum', charge: 3 },
];
const POLYATOMIC_ANIONS_8 = [
  { formula: 'NO₃', name: 'nitrate', charge: -1 },
  { formula: 'OH', name: 'hydroxide', charge: -1 },
  { formula: 'SO₄', name: 'sulfate', charge: -2 },
  { formula: 'CO₃', name: 'carbonate', charge: -2 },
  { formula: 'PO₄', name: 'phosphate', charge: -3 },
];

registerChemTemplate({
  id: 'chem1-acs-01-polyatomic-ionic-formula',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Predicting a neutral ionic formula with a polyatomic anion',
  concepts: ['predicting-ionic-formulas'],
  generate: (rng, h) => {
    const cat = h.pick(SIMPLE_CATIONS_8);
    const validAnions = POLYATOMIC_ANIONS_8.filter((a) => Math.abs(a.charge) !== cat.charge);
    const an = h.pick(validAnions);
    const m = Math.abs(an.charge);
    const g = gcd(cat.charge, m);
    const catCount = m / g;
    const anCount = cat.charge / g;
    const correct = formatPolyatomic(cat.symbol, catCount, an.formula, anCount);
    const swapped = formatPolyatomic(cat.symbol, cat.charge, an.formula, m);
    const ignored = formatPolyatomic(cat.symbol, 1, an.formula, 1);
    const summed = formatPolyatomic(cat.symbol, 1, an.formula, cat.charge + m);
    return {
      stem: `A ${cat.name} ion (${cat.symbol}${chargeSup(cat.charge)}) combines with a ${an.name} ion (${an.formula}${chargeSup(an.charge)}) to form a neutral ionic compound. What is the correct formula, including any needed parentheses?`,
      ...h.choices(
        { value: correct },
        [
          { value: swapped, error: 'swapped-subscripts', why: "used each ion's own charge as its own subscript instead of crisscrossing the charges onto the other ion" },
          { value: ignored, error: 'ignored-charge', why: 'wrote a 1:1 formula and ignored the charges entirely' },
          { value: summed, error: 'summed-charges-as-subscript', why: "added the two ions' charge magnitudes together into one subscript instead of crisscrossing each charge onto the other ion" },
        ],
      ),
      explanation: `Charge balance (the crisscross rule): the cation's charge magnitude (${cat.charge}) becomes the anion's subscript and the anion's charge magnitude (${m}) becomes the cation's subscript, then reduce by their greatest common factor (${g}). Because the anion is polyatomic, a subscript greater than 1 on it needs parentheses: ${correct}.`,
    };
  },
});

// =============================================================================================
// 9. chem1-acs-01-elemental-form-true-statement (band 4)
// Harder than "which element is diatomic": now the wrong choices are plausible-sounding false
// claims about elemental forms (S₈, P₄, monatomic noble gases, O₃), not just other elements.
// =============================================================================================

const ELEMENTAL_FORM_TRUE = [
  { tag: 'H2', text: 'Hydrogen exists as a diatomic molecule, H₂, in its elemental form.' },
  { tag: 'N2', text: 'Nitrogen exists as a diatomic molecule, N₂, in its elemental form.' },
  { tag: 'O2', text: "Oxygen's most common elemental form is the diatomic molecule O₂." },
  { tag: 'Cl2', text: 'Chlorine exists as a diatomic molecule, Cl₂, in its elemental form.' },
  { tag: 'S8', text: "Sulfur's most common elemental form is S₈, a ring of eight atoms, not a diatomic molecule." },
  { tag: 'P4', text: 'Phosphorus commonly exists as P₄ (white phosphorus) in its elemental form, not as a diatomic molecule.' },
  { tag: 'noblegas', text: 'The noble gases (such as neon and argon) exist as individual, unbonded atoms in their elemental form.' },
  { tag: 'O3', text: 'Ozone, O₃, is a distinct allotrope of oxygen from the diatomic O₂ form.' },
  { tag: 'I2', text: 'Iodine exists as a diatomic molecule, I₂, in its elemental form.' },
  { tag: 'Br2', text: 'Bromine exists as a diatomic molecule, Br₂, in its elemental form.' },
];
const ELEMENTAL_FORM_FALSE = [
  { tag: 'S8', text: 'Sulfur exists as a diatomic molecule, S₂, in its elemental form.', error: 'assumed-diatomic-sulfur', why: "sulfur's elemental form is S₈, not a diatomic S₂ molecule" },
  { tag: 'noblegas', text: 'Neon exists as a diatomic molecule, Ne₂, in its elemental form.', error: 'assumed-diatomic-noble-gas', why: 'noble gases exist as individual, unbonded atoms, not diatomic molecules' },
  { tag: 'P4', text: 'Phosphorus exists as a diatomic molecule, P₂, in its elemental form.', error: 'assumed-diatomic-phosphorus', why: "phosphorus's common elemental form is P₄, not a diatomic P₂ molecule" },
  { tag: 'carbon', text: 'Carbon exists as a diatomic molecule, C₂, in its elemental form.', error: 'assumed-diatomic-carbon', why: 'carbon forms extended network structures (like graphite or diamond), not a simple diatomic molecule' },
  { tag: 'I2', text: 'Iodine exists as individual, unbonded atoms in its elemental form.', error: 'missed-that-iodine-is-diatomic', why: 'iodine is one of the seven elements that exist as a diatomic molecule, I₂' },
  { tag: 'Br2', text: 'Bromine exists as individual, unbonded atoms in its elemental form.', error: 'missed-that-bromine-is-diatomic', why: 'bromine is one of the seven elements that exist as a diatomic molecule, Br₂' },
  { tag: 'O2', text: 'Oxygen has only one elemental form, the diatomic molecule O₂, with no other allotropes.', error: 'missed-ozone-allotrope', why: 'oxygen also has the allotrope ozone, O₃, distinct from O₂' },
  { tag: 'H2', text: 'Hydrogen exists as individual, unbonded atoms in its elemental form.', error: 'missed-that-hydrogen-is-diatomic', why: 'hydrogen is one of the seven elements that exist as a diatomic molecule, H₂' },
];

registerChemTemplate({
  id: 'chem1-acs-01-elemental-form-true-statement',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'True statement about elemental molecular forms',
  concepts: ['periodic-table-groups-diatomics'],
  generate: (rng, h) => {
    const trueStmt = h.pick(ELEMENTAL_FORM_TRUE);
    const availableFalse = ELEMENTAL_FORM_FALSE.filter((f) => f.tag !== trueStmt.tag);
    const distractors = sampleWithoutReplacement(availableFalse, 3, rng);
    return {
      stem: 'Which of the following statements about the elemental (uncombined) form of an element is TRUE?',
      ...h.choices(
        { value: trueStmt.text },
        distractors.map((d) => ({ value: d.text, error: d.error, why: d.why })),
      ),
      explanation: `Only seven elements exist as diatomic molecules in their pure elemental form: H₂, N₂, O₂, F₂, Cl₂, Br₂, and I₂. Every other element's elemental form is either single atoms (the noble gases), a larger cluster (S₈, P₄), or an extended network (carbon) — and oxygen additionally has the allotrope O₃ (ozone) alongside O₂.`,
    };
  },
});

// =============================================================================================
// 10. chem1-acs-01-bonding-type-classification (band 5)
// Synthesis: classify each element in FOUR candidate pairs (metal or nonmetal), then apply the
// bonding rule, to find the one pair that is primarily ionic.
// =============================================================================================

const BOND_METALS = [
  { s: 'Na', n: 'sodium' }, { s: 'K', n: 'potassium' }, { s: 'Mg', n: 'magnesium' },
  { s: 'Ca', n: 'calcium' }, { s: 'Al', n: 'aluminum' }, { s: 'Zn', n: 'zinc' }, { s: 'Fe', n: 'iron' },
];
const BOND_NONMETALS = [
  { s: 'H', n: 'hydrogen' }, { s: 'C', n: 'carbon' }, { s: 'N', n: 'nitrogen' }, { s: 'O', n: 'oxygen' },
  { s: 'F', n: 'fluorine' }, { s: 'Cl', n: 'chlorine' }, { s: 'Br', n: 'bromine' }, { s: 'I', n: 'iodine' },
  { s: 'S', n: 'sulfur' }, { s: 'P', n: 'phosphorus' },
];

registerChemTemplate({
  id: 'chem1-acs-01-bonding-type-classification',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Predicting primarily ionic bonding from element classification',
  concepts: ['element-classification-periodic-table'],
  generate: (rng, h) => {
    const metal = h.pick(BOND_METALS);
    const nonmetal = h.pick(BOND_NONMETALS);
    const correct = `${metal.n} and ${nonmetal.n}`;
    const nm4 = sampleWithoutReplacement(BOND_NONMETALS, 4, rng);
    const nmPair1 = `${nm4[0].n} and ${nm4[1].n}`;
    const nmPair2 = `${nm4[2].n} and ${nm4[3].n}`;
    const mm2 = sampleWithoutReplacement(BOND_METALS, 2, rng);
    const mmPair = `${mm2[0].n} and ${mm2[1].n}`;
    return {
      stem: 'Which of the following pairs of elements would be expected to form a primarily IONIC bond when combined?',
      ...h.choices(
        { value: correct },
        [
          { value: nmPair1, error: 'both-nonmetals-is-covalent', why: 'both elements in this pair are nonmetals, which share electrons in a covalent bond rather than transferring them' },
          { value: nmPair2, error: 'both-nonmetals-is-covalent', why: 'both elements in this pair are nonmetals, which share electrons in a covalent bond rather than transferring them' },
          { value: mmPair, error: 'both-metals-is-metallic', why: 'both elements in this pair are metals, which share a sea of delocalized electrons (metallic bonding) rather than forming an ionic or covalent bond with each other' },
        ],
      ),
      explanation: `An ionic bond forms between a metal (which loses electrons) and a nonmetal (which gains them): ${metal.n} (a metal) and ${nonmetal.n} (a nonmetal) fit that pattern. Two nonmetals instead share electrons covalently, and two metals share delocalized electrons via metallic bonding — neither is ionic.`,
    };
  },
});

// =============================================================================================
// 11. chem1-acs-01-abundance-from-particle-counts (band 5)
// Chained: derive each isotope's mass number from protons+neutrons, then solve backward for
// abundance from a given average, then identify (and report) the LESS abundant isotope.
// =============================================================================================

registerChemTemplate({
  id: 'chem1-acs-01-abundance-from-particle-counts',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Isotope abundance from proton/neutron counts and average atomic mass',
  concepts: ['atomic-number-vs-mass-number', 'relative-abundance-weighted-average'],
  generate: (rng, h) => {
    const Z = h.int(10, 45);
    const N1 = h.int(10, Z + 5);
    const delta = h.pick([1, 2, 3, 4]);
    const N2 = N1 + delta;
    const massA = Z + N1;
    const massB = Z + N2;
    // Kept at least 10 points away from 50 on purpose: rounding the average to 1 dp for display
    // can shift the back-solved percentage by a few points (worst case ~5, at delta = 1), and
    // this margin guarantees that drift never flips which isotope reads as "less abundant" —
    // the degenerate near-50/50 case Doctrine rule 5 warns about.
    const fPool = [15, 20, 25, 30, 35, 40, 60, 65, 70, 75, 80, 85];
    const fChosen = h.pick(fPool);
    const avgExact = massA * (fChosen / 100) + massB * (1 - fChosen / 100);
    const avgDisplay = Number(avgExact.toFixed(1));
    const fDerived = (avgDisplay - massB) / (massA - massB);
    const pctA = fDerived * 100;
    const pctB = 100 - pctA;
    const isoAless = pctA < 50;
    const correctPct = isoAless ? pctA : pctB;
    const otherPct = isoAless ? pctB : pctA;
    const lessAbundantMass = isoAless ? massA : massB;
    const moreAbundantMass = isoAless ? massB : massA;
    // Substituting neutron counts for mass numbers in this same equation was tried and rejected:
    // the numerator shifts by exactly Z while the denominator (a small delta of 1-4) does not,
    // so the "wrong" answer is inflated by roughly Z/delta and lands hundreds of percent away —
    // technically distinct but so absurd (negative, or far past 100%) that it stops reading as
    // a plausible mistake. Forgetting the ×100 unit conversion is a real, common error instead,
    // and it is structurally guaranteed distinct: it is always well under 1, while the two real
    // answers are always >=13 (the fPool floor) and 50.0% is exactly 50.
    const forgotPercentConversion = correctPct / 100;
    return {
      stem: `An unknown element has two isotopes, both with ${Z} protons. Isotope 1 has ${N1} neutrons; isotope 2 has ${N2} neutrons. Using each isotope's mass number as an approximation for its isotopic mass, the element's average atomic mass is ${avgDisplay.toFixed(1)} amu. What is the percent abundance of the LESS abundant isotope?`,
      ...h.choices(
        { value: `${correctPct.toFixed(1)}%` },
        [
          { value: `${otherPct.toFixed(1)}%`, error: 'reported-more-abundant-isotope', why: 'reported the abundance of the MORE abundant isotope instead of the less abundant one' },
          { value: '50.0%', error: 'assumed-equal-abundance', why: 'assumed the two isotopes are equally abundant instead of solving from the given average atomic mass' },
          { value: `${forgotPercentConversion.toFixed(1)}%`, error: 'forgot-percent-conversion', why: 'solved for the correct fractional abundance but reported the raw fraction directly instead of multiplying by 100 to get a percent' },
        ],
      ),
      explanation: `Mass numbers: isotope 1 = ${Z} + ${N1} = ${massA}; isotope 2 = ${Z} + ${N2} = ${massB}. Let x = fractional abundance of the mass-${lessAbundantMass} isotope. Solving ${avgDisplay.toFixed(1)} = ${moreAbundantMass}(1 − x) + ${lessAbundantMass}x for x gives the mass-${lessAbundantMass} isotope's abundance as ${correctPct.toFixed(1)}%, making it the less abundant of the two.`,
    };
  },
});
