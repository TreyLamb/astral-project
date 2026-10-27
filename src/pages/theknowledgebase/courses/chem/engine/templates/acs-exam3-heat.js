// ACS-level (bands 4-5) heat math for Exam 3. Built 2026-10-27, six days before the exam.
//
// WHY. Exam 3 is cumulative (ch 1-6) and Trey named heat math as the part he must get on top of.
// The bank had ONE template each for calorimetry and enthalpy and two for Hess/formation, all at
// quiz level. His standing rule (2026-10-27): "my questions [should] lean/mirror more closely what
// the national test looks like ... regardless of how 'easy' my professor's quizzes come out, we
// will use them as a base-standard but not the bar to meet." So everything here is band 4-5:
// two-step problems whose distractors are the classic ACS traps, not bigger numbers.
//
// SOURCE ORDER (theknowledgebase/CLAUDE.md build order). The skill list came from the textbook
// first: every worked example in AcademiQ ch05 §5-3..5-6 (`_academiq/ch05-redox-and-thermochemistry.md`)
// - water mixing (L483), rebar initial temperature (L651/677/685), identify the metal (L695),
// coffee-cup neutralization (L737) and precipitation (L767), bomb calorimeter with water + bomb
// (L777/791), ΔH per mole from experimental data (L995/1009/1023/1055), Hess (L1243/1287),
// ΔHf back-solve (L1363), ΔH°rxn from a ΔHf table (L1425/1473). None of the book's numbers are
// reused; every value below is generated.
//
// DATA. ΔHf° values are the standard gen-chem table values (kJ/mol). The stem always prints the
// values it uses, so the arithmetic is self-consistent by construction; combustion enthalpies are
// DERIVED from the same ΔHf° numbers at load time rather than typed in, so a Hess set can never
// disagree with the formation table.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-06-heat-enthalpy';
const C_WATER = 4.184;

/** n significant figures, never exponent notation. */
function sig(x, n = 3) {
  if (x === 0) return '0';
  const r = Number(x.toPrecision(n));
  const mag = Math.floor(Math.log10(Math.abs(r)));
  return mag >= n - 1 ? r.toFixed(0) : r.toFixed(n - 1 - mag);
}
const kJ = (x) => `${sig(x)} kJ`;
const kJmol = (x) => `${sig(x)} kJ/mol`;
const degC = (x) => `${x.toFixed(1)} °C`;

const METALS = [
  { name: 'aluminum', c: 0.897 },
  { name: 'titanium', c: 0.523 },
  { name: 'iron', c: 0.449 },
  { name: 'copper', c: 0.385 },
  { name: 'silver', c: 0.235 },
  { name: 'lead', c: 0.129 },
];
const metalTable = () => METALS.map((m) => `${m.name} ${m.c.toFixed(3)}`).join(' · ');

/** Two different integers in [lo, hi]. Equal values make two error modes collapse into one. */
function twoDifferent(h, lo, hi) {
  const a = h.int(lo, hi);
  let b = h.int(lo, hi);
  while (b === a) b = h.int(lo, hi);
  return [a, b];
}

// ---------------------------------------------------------------------------
// thermal-equilibrium-heat-transfer: hot metal into water, find the final temperature
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-06-metal-water-final-temp',
  chapterId: CH,
  section: '5-4',
  band: 4,
  name: 'Hot metal into water: final temperature',
  concepts: ['thermal-equilibrium-heat-transfer'],
  generate: (rng, h) => {
    const m = h.pick(METALS);
    const [mm, vw] = twoDifferent(h, 50, 400);
    const tm = h.int(80, 300);
    const tw = h.int(15, 30);
    const tf = (mm * m.c * tm + vw * C_WATER * tw) / (mm * m.c + vw * C_WATER);
    const plainAvg = (tm + tw) / 2;
    const massAvg = (mm * tm + vw * tw) / (mm + vw);
    const swapped = (mm * C_WATER * tm + vw * m.c * tw) / (mm * C_WATER + vw * m.c);
    return {
      stem: `A ${mm}-g piece of ${m.name} (specific heat ${m.c.toFixed(3)} J/(g·°C)) at ${tm} °C is dropped into ${vw} mL of water at ${tw} °C in an insulated cup. Assuming all heat transfer is between the metal and the water, what is the final temperature?`,
      ...h.choices(degC(tf), [
        { value: degC(massAvg), error: 'ignored-specific-heats', why: 'averaged the temperatures by mass only. Each object carries its own specific heat, and water\'s is roughly ten times a metal\'s' },
        { value: degC(swapped), error: 'swapped-specific-heats', why: 'gave the metal water\'s specific heat and the water the metal\'s' },
        { value: degC(plainAvg), error: 'simple-average', why: 'took the plain average of the two starting temperatures, ignoring both masses and both specific heats' },
        { value: degC(tw + (mm * m.c * (tm - tw)) / (vw * C_WATER)), error: 'metal-temp-held-fixed', why: 'computed the water\'s rise as if the metal stayed at its starting temperature. Both objects change until they meet' },
      ]),
      explanation: `Heat lost by the metal = heat gained by the water: q_metal + q_water = 0.\n${mm}(${m.c.toFixed(3)})(T_f − ${tm}) + ${vw}(4.184)(T_f − ${tw}) = 0 (${vw} mL of water = ${vw} g).\nSolve for T_f: T_f = [${mm}(${m.c.toFixed(3)})(${tm}) + ${vw}(4.184)(${tw})] ÷ [${mm}(${m.c.toFixed(3)}) + ${vw}(4.184)] = ${(mm * m.c * tm + vw * C_WATER * tw).toFixed(0)} ÷ ${(mm * m.c + vw * C_WATER).toFixed(1)} = ${tf.toFixed(1)} °C.\nThe trap: the answer sits much closer to the water's ${tw} °C than the simple average (${plainAvg.toFixed(1)} °C) because water's large specific heat and mass soak up the heat with a small temperature rise.`,
    };
  },
});

// ---------------------------------------------------------------------------
// thermal-equilibrium-heat-transfer: find the metal's starting temperature (the "rebar" problem)
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-06-metal-initial-temp',
  chapterId: CH,
  section: '5-4',
  band: 4,
  name: 'Hot metal into water: the metal\'s initial temperature',
  concepts: ['thermal-equilibrium-heat-transfer'],
  generate: (rng, h) => {
    const m = h.pick(METALS);
    const mm = h.int(100, 400);
    const vw = h.int(150, 500);
    const tw = h.int(150, 300) / 10;
    const tmTrue = h.int(120, 350);
    const tfExact = (mm * m.c * tmTrue + vw * C_WATER * tw) / (mm * m.c + vw * C_WATER);
    const tf = Math.round(tfExact * 10) / 10;
    const qWater = vw * C_WATER * (tf - tw);
    const dropMetal = qWater / (mm * m.c);
    const tm = tf + dropMetal;
    return {
      stem: `A ${mm}-g piece of ${m.name} (specific heat ${m.c.toFixed(3)} J/(g·°C)) is taken from an oven and placed in ${vw} mL of water at ${tw.toFixed(1)} °C. When the two reach the same temperature, the water is at ${tf.toFixed(1)} °C. Assuming no heat is lost to the surroundings, what was the metal's initial temperature?`,
      ...h.choices(degC(tm), [
        { value: degC(dropMetal), error: 'reported-delta-t-not-temperature', why: 'found how far the metal\'s temperature DROPPED and stopped there. The initial temperature is the final temperature plus that drop' },
        { value: degC(tf + (vw * (tf - tw)) / mm), error: 'ignored-specific-heats', why: 'treated the metal and the water as if they had the same specific heat' },
        { value: degC(tw + dropMetal), error: 'added-drop-to-water-start', why: 'added the metal\'s temperature drop to the water\'s starting temperature instead of to the shared final temperature' },
        // Last on purpose: it usually lands below absolute zero, which gives itself away.
        { value: degC(tf - dropMetal), error: 'sign-error-metal-cooled', why: 'subtracted the drop. The metal cooled DOWN to the final temperature, so it started above it' },
      ]),
      explanation: `The water gained q = m·c·ΔT = ${vw} g × 4.184 × (${tf.toFixed(1)} − ${tw.toFixed(1)}) = ${qWater.toFixed(0)} J.\nThe metal lost exactly that: ${qWater.toFixed(0)} J = ${mm} g × ${m.c.toFixed(3)} × (T_i − ${tf.toFixed(1)}), so the metal dropped ${qWater.toFixed(0)} ÷ ${(mm * m.c).toFixed(1)} = ${dropMetal.toFixed(1)} °C.\nT_i = ${tf.toFixed(1)} + ${dropMetal.toFixed(1)} = ${tm.toFixed(1)} °C.`,
    };
  },
});

// ---------------------------------------------------------------------------
// thermal-equilibrium-heat-transfer: find the specific heat, identify the metal
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-06-identify-metal',
  chapterId: CH,
  section: '5-4',
  band: 5,
  name: 'Specific heat of an unknown metal from a calorimetry experiment',
  concepts: ['thermal-equilibrium-heat-transfer', 'specific-heat-definition'],
  generate: (rng, h) => {
    const m = h.pick(METALS);
    const [mm, vw] = twoDifferent(h, 50, 150);
    const tw = h.int(180, 250) / 10;
    const tfExact = (mm * m.c * 100 + vw * C_WATER * tw) / (mm * m.c + vw * C_WATER);
    const tf = Math.round(tfExact * 100) / 100;
    const qWater = vw * C_WATER * (tf - tw);
    const c = qWater / (mm * (100 - tf));
    const show = (x) => `${x.toFixed(3)} J/(g·°C)`;
    return {
      stem: `A ${mm}-g piece of an unknown metal is held in boiling water (100.0 °C), then quickly moved into ${vw} mL of water at ${tw.toFixed(1)} °C. The final temperature of the water and metal is ${tf.toFixed(2)} °C. Specific heats, J/(g·°C): ${metalTable()}. What is the metal's specific heat? (The table then tells you which metal it is.)`,
      ...h.choices(show(c), [
        { value: show(qWater / (mm * tf)), error: 'used-final-temp-as-delta-t', why: 'used the final temperature itself as the metal\'s ΔT. The metal went from 100.0 °C down to the final temperature' },
        { value: show(vw * C_WATER / mm), error: 'used-one-delta-t-for-both', why: 'gave the metal the same ΔT as the water. The two objects meet at one final temperature but start far apart, so their ΔTs differ' },
        { value: show((mm * C_WATER * (tf - tw)) / (vw * (100 - tf))), error: 'swapped-masses', why: 'used the metal\'s mass for the water and the water\'s mass for the metal' },
        { value: show(qWater / (mm * (100 + tf))), error: 'added-temperatures', why: 'added the temperatures for the metal\'s ΔT instead of subtracting them' },
      ]),
      explanation: `Water gained q = ${vw} g × 4.184 × (${tf.toFixed(2)} − ${tw.toFixed(1)}) = ${qWater.toFixed(0)} J.\nThe metal lost the same heat while cooling from 100.0 to ${tf.toFixed(2)} °C, a ΔT of ${(100 - tf).toFixed(2)} °C.\nc = q ÷ (m·ΔT) = ${qWater.toFixed(0)} ÷ (${mm} × ${(100 - tf).toFixed(2)}) = ${c.toFixed(3)} J/(g·°C), closest to ${m.name} (${m.c.toFixed(3)}).`,
    };
  },
});

// ---------------------------------------------------------------------------
// coffee-cup-calorimetry: neutralization, ΔH per mole of water (limiting reactant inside)
// ---------------------------------------------------------------------------
const NEUTRALIZATIONS = [
  { acid: 'HCl', base: 'NaOH', eq: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)' },
  { acid: 'HNO₃', base: 'KOH', eq: 'HNO₃(aq) + KOH(aq) → KNO₃(aq) + H₂O(l)' },
  { acid: 'HBr', base: 'NaOH', eq: 'HBr(aq) + NaOH(aq) → NaBr(aq) + H₂O(l)' },
];

registerChemTemplate({
  id: 'chem1-acs-06-coffee-cup-neutralization',
  chapterId: CH,
  section: '5-4',
  band: 5,
  name: 'Coffee-cup calorimetry: ΔH of neutralization',
  concepts: ['coffee-cup-calorimetry', 'energy-per-mole-reaction'],
  generate: (rng, h) => {
    const r = h.pick(NEUTRALIZATIONS);
    const VOLS = [25.0, 50.0, 75.0, 100.0];
    const MOLS = [0.500, 1.00, 1.50, 2.00];
    const va = h.pick(VOLS);
    let vb = h.pick(VOLS);
    while (vb === va) vb = h.pick(VOLS);
    const ma = h.pick(MOLS);
    const mb = h.pick(MOLS);
    const na = (va * ma) / 1000;
    const nb = (vb * mb) / 1000;
    const n = Math.min(na, nb);
    const ti = h.int(2000, 2400) / 100;
    const dT = Math.round(((55.8e3 * n) / ((va + vb) * C_WATER)) * 100) / 100;
    const tf = ti + dT;
    const qSoln = ((va + vb) * C_WATER * dT) / 1000;
    const dH = -qSoln / n;
    const molStr = (x) => (x >= 1 ? x.toFixed(2) : x.toFixed(3));
    return {
      stem: `In a coffee-cup calorimeter, ${va.toFixed(1)} mL of ${molStr(ma)} M ${r.acid} and ${vb.toFixed(1)} mL of ${molStr(mb)} M ${r.base}, both at ${ti.toFixed(2)} °C, are mixed:\n${r.eq}\nThe temperature rises to ${tf.toFixed(2)} °C. Assume the solution has a density of 1.00 g/mL and a specific heat of 4.184 J/(g·°C), and that no heat is lost. What is ΔH for the reaction, in kJ per mole of water formed?`,
      ...h.choices(kJmol(dH), [
        { value: kJmol(-((va * C_WATER * dT) / 1000) / n), error: 'used-one-solution-mass', why: `used only the acid's ${va.toFixed(1)} g. The heat warms the whole ${(va + vb).toFixed(1)} g of mixed solution` },
        { value: kJmol(-dH), error: 'sign-error', why: 'the solution warmed up, so the reaction RELEASED heat: q_rxn = −q_solution and ΔH is negative' },
        { value: kJmol(-qSoln / Math.max(na, nb)), error: 'used-excess-reactant-moles', why: 'divided by the moles of the reactant in EXCESS. Only the limiting reactant\'s moles actually react to make water' },
        { value: kJmol(-qSoln / (na + nb)), error: 'added-both-reactant-moles', why: 'divided by the moles of acid plus base. The mole count that matters is the moles of water formed, set by the limiting reactant' },
      ]),
      explanation: `Total solution mass = ${va.toFixed(1)} + ${vb.toFixed(1)} mL × 1.00 g/mL = ${(va + vb).toFixed(1)} g.\nq_solution = ${(va + vb).toFixed(1)} g × 4.184 × ${dT.toFixed(2)} °C = ${(qSoln * 1000).toFixed(0)} J = ${qSoln.toFixed(3)} kJ, so q_rxn = −${qSoln.toFixed(3)} kJ.\nMoles: ${r.acid} ${na.toFixed(4)} mol, ${r.base} ${nb.toFixed(4)} mol. They react 1:1, so ${na === nb ? 'neither is in excess' : `${na < nb ? r.acid : r.base} is limiting`} and ${n.toFixed(4)} mol of water forms.\nΔH = −${qSoln.toFixed(3)} kJ ÷ ${n.toFixed(4)} mol = ${sig(dH)} kJ/mol. (Strong acid + strong base is always near −56 kJ/mol, a good check.)`,
    };
  },
});

// ---------------------------------------------------------------------------
// bomb-calorimetry: water AND bomb absorb heat, then per mole of fuel
// ---------------------------------------------------------------------------
const FUELS = [
  { name: 'benzoic acid', formula: 'C₇H₆O₂', M: 122.12, dHc: -3227 },
  { name: 'glucose', formula: 'C₆H₁₂O₆', M: 180.16, dHc: -2803 },
  { name: 'naphthalene', formula: 'C₁₀H₈', M: 128.17, dHc: -5157 },
  { name: 'sucrose', formula: 'C₁₂H₂₂O₁₁', M: 342.30, dHc: -5640 },
  { name: 'ethanol', formula: 'C₂H₅OH', M: 46.07, dHc: -1367 },
  { name: 'benzene', formula: 'C₆H₆', M: 78.11, dHc: -3268 },
];

registerChemTemplate({
  id: 'chem1-acs-06-bomb-water-plus-bomb',
  chapterId: CH,
  section: '5-4',
  band: 4,
  name: 'Bomb calorimeter with water + bomb: molar heat of combustion',
  concepts: ['bomb-calorimetry', 'energy-per-mole-reaction'],
  generate: (rng, h) => {
    const f = h.pick(FUELS);
    const mass = h.int(50, 300) / 100;
    const mw = h.int(700, 1200);
    const cb = h.int(700, 1100);
    const nFuel = mass / f.M;
    const cTot = mw * C_WATER + cb;
    const dT = Math.round(((-f.dHc * 1000 * nFuel) / cTot) * 100) / 100;
    const q = (cTot * dT) / 1000;
    const ans = -q / nFuel;
    return {
      stem: `A ${mass.toFixed(2)}-g sample of ${f.name}, ${f.formula} (molar mass ${f.M.toFixed(2)} g/mol), is burned in a bomb calorimeter. The bomb has a heat capacity of ${cb} J/°C and sits in ${mw} g of water. The temperature rises by ${dT.toFixed(2)} °C. What is the heat of combustion of ${f.name} in kJ/mol (as q per mole of fuel burned)?`,
      ...h.choices(kJmol(ans), [
        { value: kJmol(-((mw * C_WATER * dT) / 1000) / nFuel), error: 'forgot-bomb-heat-capacity', why: `counted only the water. The bomb itself also warmed and absorbed ${cb} J for every °C` },
        { value: kJmol(-ans), error: 'sign-error', why: 'reported the heat the calorimeter ABSORBED. The combustion released it, so q per mole is negative' },
        { value: kJmol(-q / mass), error: 'per-gram-not-per-mole', why: `divided by the ${mass.toFixed(2)} g of sample instead of converting it to moles first. That gives kJ per gram` },
        { value: kJmol(-((cb * dT) / 1000) / nFuel), error: 'forgot-water', why: 'counted only the bomb. Most of the heat goes into the water' },
      ]),
      explanation: `Both the water and the bomb warm: q = (m_water·c_water + C_bomb)·ΔT = (${mw} × 4.184 + ${cb}) J/°C × ${dT.toFixed(2)} °C = ${cTot.toFixed(0)} × ${dT.toFixed(2)} = ${(q * 1000).toFixed(0)} J = ${q.toFixed(2)} kJ absorbed, so the combustion released ${q.toFixed(2)} kJ.\nMoles burned = ${mass.toFixed(2)} g ÷ ${f.M.toFixed(2)} g/mol = ${nFuel.toFixed(5)} mol.\nq per mole = −${q.toFixed(2)} kJ ÷ ${nFuel.toFixed(5)} mol = ${sig(ans)} kJ/mol.`,
    };
  },
});

// ---------------------------------------------------------------------------
// thermochemical-stoichiometry: grams of one species -> heat, and heat -> grams
// ---------------------------------------------------------------------------
const THERMO_RXNS = [
  { eq: '2H₂(g) + O₂(g) → 2H₂O(l)', dH: -571.6, sp: [{ f: 'H₂', c: 2, M: 2.016 }, { f: 'O₂', c: 1, M: 32.00 }, { f: 'H₂O', c: 2, M: 18.02, prod: true }] },
  { eq: 'N₂(g) + 3H₂(g) → 2NH₃(g)', dH: -92.2, sp: [{ f: 'N₂', c: 1, M: 28.02 }, { f: 'H₂', c: 3, M: 2.016 }, { f: 'NH₃', c: 2, M: 17.03, prod: true }] },
  { eq: 'C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)', dH: -2219.9, sp: [{ f: 'C₃H₈', c: 1, M: 44.09 }, { f: 'O₂', c: 5, M: 32.00 }, { f: 'CO₂', c: 3, M: 44.01, prod: true }, { f: 'H₂O', c: 4, M: 18.02, prod: true }] },
  { eq: '2C₈H₁₈(l) + 25O₂(g) → 16CO₂(g) + 18H₂O(l)', dH: -10940, sp: [{ f: 'C₈H₁₈', c: 2, M: 114.22 }, { f: 'O₂', c: 25, M: 32.00 }, { f: 'CO₂', c: 16, M: 44.01, prod: true }] },
  { eq: '4Fe(s) + 3O₂(g) → 2Fe₂O₃(s)', dH: -1648.4, sp: [{ f: 'Fe', c: 4, M: 55.85 }, { f: 'O₂', c: 3, M: 32.00 }, { f: 'Fe₂O₃', c: 2, M: 159.70, prod: true }] },
  { eq: '2Al(s) + Fe₂O₃(s) → Al₂O₃(s) + 2Fe(s)', dH: -851.5, sp: [{ f: 'Al', c: 2, M: 26.98 }, { f: 'Fe₂O₃', c: 1, M: 159.70 }, { f: 'Fe', c: 2, M: 55.85, prod: true }] },
  { eq: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', dH: -890.3, sp: [{ f: 'CH₄', c: 1, M: 16.04 }, { f: 'O₂', c: 2, M: 32.00 }, { f: 'H₂O', c: 2, M: 18.02, prod: true }] },
];

registerChemTemplate({
  id: 'chem1-acs-06-thermochem-stoich',
  chapterId: CH,
  section: '5-5',
  band: 4,
  name: 'Thermochemical equation: heat from grams, grams from heat',
  concepts: ['thermochemical-stoichiometry'],
  generate: (rng, h) => {
    const r = h.pick(THERMO_RXNS);
    // A coefficient of 1 lets "forgot the coefficient" coincide with the right answer, so the
    // question would silently lose its most important trap. Every reaction has a species with c >= 2.
    const s = h.pick(r.sp.filter((x) => x.c >= 2));
    const Q = -r.dH;
    const verb = s.prod ? 'formed' : 'consumed';
    if (h.pick(['heat', 'mass']) === 'heat') {
      const mass = h.int(100, 999) / 10;
      const n = mass / s.M;
      const q = (Q * n) / s.c;
      return {
        stem: `${r.eq}    ΔH = ${r.dH} kJ\nHow much heat is released when ${mass.toFixed(1)} g of ${s.f} is ${verb}?`,
        ...h.choices(kJ(q), [
          { value: kJ(Q * n), error: 'ignored-coefficient', why: `multiplied ΔH by the moles of ${s.f} directly. ΔH is for ${s.c} mol of ${s.f}, so divide by ${s.c} first` },
          { value: kJ(Q * n * s.c), error: 'multiplied-by-coefficient', why: `multiplied by the coefficient ${s.c} instead of dividing by it` },
          { value: kJ((Q * mass) / s.c), error: 'used-grams-as-moles', why: `used ${mass.toFixed(1)} g as if it were moles. Convert with the molar mass (${s.M} g/mol) first` },
          { value: kJ(Q), error: 'reported-delta-h', why: `reported ΔH for the equation as written. That is the heat for ${s.c} mol of ${s.f}, not for this sample` },
        ]),
        explanation: `${mass.toFixed(1)} g ÷ ${s.M} g/mol = ${n.toFixed(4)} mol ${s.f}.\nThe equation releases ${Q} kJ per ${s.c} mol of ${s.f}, so q = ${n.toFixed(4)} mol × (${Q} kJ ÷ ${s.c} mol) = ${sig(q)} kJ released.`,
      };
    }
    const qWant = h.int(100, 999) * (Q > 3000 ? 10 : 1);
    const mass = (qWant / Q) * s.c * s.M;
    return {
      stem: `${r.eq}    ΔH = ${r.dH} kJ\nWhat mass of ${s.f} is ${verb} when the reaction releases ${qWant} kJ of heat?`,
      ...h.choices(`${sig(mass)} g`, [
        { value: `${sig(mass / s.c)} g`, error: 'ignored-coefficient', why: `treated ${Q} kJ as the heat per mole of ${s.f}. It is per ${s.c} mol` },
        { value: `${sig((qWant / Q) * s.c)} g`, error: 'stopped-at-moles', why: 'found moles and reported them as grams. Multiply by the molar mass to finish' },
        { value: `${sig(mass / (s.c * s.c))} g`, error: 'divided-by-coefficient', why: `divided by the coefficient ${s.c} instead of multiplying` },
        { value: `${sig((Q / qWant) * s.c * s.M)} g`, error: 'inverted-heat-ratio', why: `divided ${Q} kJ by ${qWant} kJ instead of the other way round` },
      ]),
      explanation: `${qWant} kJ ÷ ${Q} kJ = ${(qWant / Q).toFixed(4)} "reactions as written". Each one involves ${s.c} mol of ${s.f}: ${(qWant / Q).toFixed(4)} × ${s.c} = ${((qWant / Q) * s.c).toFixed(4)} mol.\nMass = ${((qWant / Q) * s.c).toFixed(4)} mol × ${s.M} g/mol = ${sig(mass)} g.`,
    };
  },
});

// ---------------------------------------------------------------------------
// thermochemical-stoichiometry: two reactant masses given, the limiting one sets the heat
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-06-thermochem-limiting',
  chapterId: CH,
  section: '5-5',
  band: 5,
  name: 'Heat released when one reactant runs out first',
  concepts: ['thermochemical-stoichiometry'],
  generate: (rng, h) => {
    const r = h.pick(THERMO_RXNS);
    const [A, B] = r.sp.filter((x) => !x.prod);
    const Q = -r.dH;
    let ma; let mb; let eA; let eB;
    for (let i = 0; i < 40; i++) {
      ma = h.int(50, 999) / 10;
      mb = h.int(50, 999) / 10;
      eA = ma / A.M / A.c;
      eB = mb / B.M / B.c;
      if (Math.abs(eA - eB) / Math.max(eA, eB) > 0.2) break;
    }
    const lim = eA < eB ? A : B;
    const ext = Math.min(eA, eB);
    const nA = ma / A.M;
    const nB = mb / B.M;
    return {
      stem: `${r.eq}    ΔH = ${r.dH} kJ\nA mixture of ${ma.toFixed(1)} g of ${A.f} and ${mb.toFixed(1)} g of ${B.f} reacts until one reactant is used up. How much heat is released?`,
      ...h.choices(kJ(Q * ext), [
        { value: kJ(Q * Math.max(eA, eB)), error: 'used-excess-reactant', why: 'based the heat on the reactant in EXCESS. The reaction stops when the limiting reactant runs out' },
        { value: kJ(Q * Math.min(nA, nB)), error: 'ignored-coefficients', why: 'compared and used raw moles without dividing by the coefficients' },
        { value: kJ(Q * (eA + eB)), error: 'added-both-reactants', why: 'added the heat each reactant "could" produce. Only one reaction happens, limited by one reactant' },
        { value: kJ(Q * (lim === A ? nA : nB)), error: 'ignored-coefficient-of-limiting', why: `found the limiting reactant correctly but forgot ΔH is per ${lim.c} mol of ${lim.f}` },
        { value: kJ((Q * (lim === A ? ma : mb)) / lim.c), error: 'used-grams-as-moles', why: `used the grams of ${lim.f} as if they were moles` },
        { value: kJ(Q * ext * lim.c * lim.c), error: 'multiplied-by-coefficient', why: `multiplied by the coefficient ${lim.c} instead of dividing by it` },
        { value: kJ(Q), error: 'reported-delta-h', why: 'reported ΔH for the equation as written, which assumes exactly the moles in the coefficients react' },
        { value: kJ(Q * (lim === A ? nB : nA)), error: 'excess-moles-ignoring-coefficient', why: 'used the raw moles of the excess reactant' },
      ]),
      explanation: `${A.f}: ${ma.toFixed(1)} ÷ ${A.M} = ${nA.toFixed(4)} mol; ÷ ${A.c} = ${eA.toFixed(4)} "reactions".\n${B.f}: ${mb.toFixed(1)} ÷ ${B.M} = ${nB.toFixed(4)} mol; ÷ ${B.c} = ${eB.toFixed(4)} "reactions".\nThe smaller number wins: ${lim.f} is limiting, so the equation runs ${ext.toFixed(4)} times.\nq = ${ext.toFixed(4)} × ${Q} kJ = ${sig(Q * ext)} kJ released.`,
    };
  },
});

// ---------------------------------------------------------------------------
// thermochemical-stoichiometry: what a thermochemical equation does and does not say
// ---------------------------------------------------------------------------
const CONCEPT_RXNS = [
  ...THERMO_RXNS.map((r) => ({ eq: r.eq, dH: r.dH })),
  { eq: 'N₂(g) + O₂(g) → 2NO(g)', dH: 180.6 },
  { eq: 'CaCO₃(s) → CaO(s) + CO₂(g)', dH: 178.3 },
];

registerChemTemplate({
  id: 'chem1-acs-06-thermochem-statements',
  mental: true,
  chapterId: CH,
  section: '5-5',
  band: 4,
  name: 'Reading a thermochemical equation',
  concepts: ['thermochemical-stoichiometry'],
  generate: (rng, h) => {
    const r = h.pick(CONCEPT_RXNS);
    const exo = r.dH < 0;
    const mag = Math.abs(r.dH);
    const TRUE = [
      `Running the reaction in reverse has ΔH = ${exo ? '+' : '−'}${mag} kJ`,
      `Doubling every coefficient makes ΔH = ${exo ? '−' : '+'}${(mag * 2).toFixed(1).replace(/\.0$/, '')} kJ`,
      exo ? 'The products have lower enthalpy than the reactants' : 'The products have higher enthalpy than the reactants',
    ];
    const FALSE = [
      { value: `Running the reaction in reverse also has ΔH = ${exo ? '−' : '+'}${mag} kJ`, error: 'reverse-keeps-sign', why: 'reversing a reaction flips the sign of ΔH' },
      { value: `Doubling every coefficient leaves ΔH at ${r.dH > 0 ? '+' : '−'}${mag} kJ, because ΔH is a per-mole quantity`, error: 'delta-h-intensive', why: 'ΔH is extensive: it belongs to the equation as written and scales with the coefficients' },
      { value: exo ? `The reaction absorbs ${mag} kJ from the surroundings` : `The reaction releases ${mag} kJ to the surroundings`, error: 'sign-meaning', why: exo ? 'a negative ΔH means heat is RELEASED (exothermic)' : 'a positive ΔH means heat is ABSORBED (endothermic)' },
      { value: exo ? 'The products have higher enthalpy than the reactants' : 'The products have lower enthalpy than the reactants', error: 'enthalpy-diagram-inverted', why: `ΔH = H(products) − H(reactants); ${exo ? 'negative means the products are lower' : 'positive means the products are higher'}` },
    ];
    const pickTrue = h.int(0, 2);
    const correct = TRUE[pickTrue];
    // The true statement's own false twin goes first: telling the two apart is the whole skill.
    const twin = [0, 1, 3][pickTrue];
    const distractors = [FALSE[twin], ...FALSE.filter((_, i) => i !== twin)];
    return {
      stem: `${r.eq}    ΔH = ${r.dH > 0 ? '+' : ''}${r.dH} kJ\nWhich statement is correct?`,
      ...h.choices(correct, distractors),
      explanation: `${exo ? 'ΔH is negative: exothermic, heat released, products lower in enthalpy.' : 'ΔH is positive: endothermic, heat absorbed, products higher in enthalpy.'} ΔH belongs to the equation as written: reverse it and the sign flips; multiply the coefficients and ΔH multiplies too. The correct statement: "${correct}."`,
    };
  },
});

// ---------------------------------------------------------------------------
// enthalpy-of-formation: ΔH°rxn = Σ n ΔH°f(products) − Σ n ΔH°f(reactants)
// ---------------------------------------------------------------------------
const DHF = {
  'CH₄(g)': -74.8, 'CO₂(g)': -393.5, 'H₂O(l)': -285.8, 'H₂O(g)': -241.8, 'C₂H₆(g)': -84.7,
  'C₂H₅OH(l)': -277.7, 'NH₃(g)': -46.1, 'NO(g)': 90.3, 'NO₂(g)': 33.2, 'Fe₂O₃(s)': -824.2,
  'CO(g)': -110.5, 'CaCO₃(s)': -1206.9, 'CaO(s)': -635.1, 'SO₂(g)': -296.8, 'SO₃(g)': -395.7,
  'C₆H₁₂O₆(s)': -1273.3, 'C₃H₈(g)': -103.8, 'Al₂O₃(s)': -1675.7,
};
// Elements in their standard states have ΔH°f = 0 and are deliberately NOT printed in the table:
// knowing that is part of the question, exactly as on the ACS exam.
const FORMATION_RXNS = [
  { r: [[1, 'CH₄(g)'], [2, 'O₂(g)']], p: [[1, 'CO₂(g)'], [2, 'H₂O(l)']] },
  { r: [[2, 'C₂H₆(g)'], [7, 'O₂(g)']], p: [[4, 'CO₂(g)'], [6, 'H₂O(l)']] },
  { r: [[1, 'C₂H₅OH(l)'], [3, 'O₂(g)']], p: [[2, 'CO₂(g)'], [3, 'H₂O(l)']] },
  { r: [[4, 'NH₃(g)'], [5, 'O₂(g)']], p: [[4, 'NO(g)'], [6, 'H₂O(g)']] },
  { r: [[1, 'Fe₂O₃(s)'], [3, 'CO(g)']], p: [[2, 'Fe(s)'], [3, 'CO₂(g)']] },
  { r: [[1, 'CaCO₃(s)']], p: [[1, 'CaO(s)'], [1, 'CO₂(g)']] },
  { r: [[2, 'SO₂(g)'], [1, 'O₂(g)']], p: [[2, 'SO₃(g)']] },
  { r: [[1, 'C₆H₁₂O₆(s)'], [6, 'O₂(g)']], p: [[6, 'CO₂(g)'], [6, 'H₂O(l)']] },
  { r: [[2, 'NO(g)'], [1, 'O₂(g)']], p: [[2, 'NO₂(g)']] },
  { r: [[1, 'C₃H₈(g)'], [5, 'O₂(g)']], p: [[3, 'CO₂(g)'], [4, 'H₂O(g)']] },
  { r: [[2, 'Al(s)'], [1, 'Fe₂O₃(s)']], p: [[1, 'Al₂O₃(s)'], [2, 'Fe(s)']] },
];
const hf = (sp) => DHF[sp] ?? 0;
const side = (list, useCoef = true) => list.reduce((s, [c, sp]) => s + (useCoef ? c : 1) * hf(sp), 0);
const eqText = (rx) => {
  const t = (list) => list.map(([c, sp]) => `${c === 1 ? '' : c}${sp}`).join(' + ');
  return `${t(rx.r)} → ${t(rx.p)}`;
};
const tableFor = (rx) => [...rx.r, ...rx.p].map(([, sp]) => sp).filter((sp) => sp in DHF)
  .filter((sp, i, a) => a.indexOf(sp) === i).map((sp) => `${sp} ${DHF[sp]}`).join(' · ');
const fmt1 = (x) => `${x.toFixed(1)} kJ`;

registerChemTemplate({
  id: 'chem1-acs-06-dhrxn-from-dhf',
  chapterId: CH,
  section: '5-6',
  band: 4,
  name: 'ΔH°rxn from a table of ΔH°f',
  concepts: ['enthalpy-of-formation'],
  generate: (rng, h) => {
    const rx = h.pick(FORMATION_RXNS);
    const P = side(rx.p);
    const R = side(rx.r);
    const ans = P - R;
    // Drop a COMPOUND: dropping an element (ΔH°f = 0) changes nothing and duplicates the answer.
    const [dc, dsp] = [...rx.p].reverse().find(([, sp]) => sp in DHF);
    return {
      stem: `Use standard enthalpies of formation (ΔH°f, kJ/mol: ${tableFor(rx)}) to find ΔH°rxn for:\n${eqText(rx)}`,
      ...h.choices(fmt1(ans), [
        { value: fmt1(R - P), error: 'reactants-minus-products', why: 'subtracted in the wrong order. It is products minus reactants' },
        { value: fmt1(side(rx.p, false) - side(rx.r, false)), error: 'ignored-coefficients', why: 'used each ΔH°f once. Each one is per mole and must be multiplied by its coefficient' },
        { value: fmt1(P + R), error: 'added-both-sides', why: 'added the products and reactants together instead of subtracting' },
        { value: fmt1(side(rx.r, false) - side(rx.p, false)), error: 'ignored-coefficients-and-flipped', why: 'ignored the coefficients AND subtracted in the wrong order' },
        { value: fmt1(P - dc * hf(dsp) - R), error: 'dropped-a-product', why: `left ${dsp} out of the products sum` },
        { value: fmt1(P - side(rx.r, false)), error: 'coefficients-on-products-only', why: 'multiplied the products by their coefficients but not the reactants' },
      ]),
      explanation: `ΔH°rxn = Σ n·ΔH°f(products) − Σ n·ΔH°f(reactants). Elements in their standard state (O₂, Fe, Al) have ΔH°f = 0.\nProducts: ${rx.p.map(([c, sp]) => `${c}(${hf(sp)})`).join(' + ')} = ${P.toFixed(1)} kJ.\nReactants: ${rx.r.map(([c, sp]) => `${c}(${hf(sp)})`).join(' + ')} = ${R.toFixed(1)} kJ.\nΔH°rxn = ${P.toFixed(1)} − (${R.toFixed(1)}) = ${ans.toFixed(1)} kJ.`,
    };
  },
});

// ---------------------------------------------------------------------------
// enthalpy-of-formation: back-solve an unknown ΔH°f from a measured ΔH°rxn
// ---------------------------------------------------------------------------
const BACK_SOLVE = FORMATION_RXNS.flatMap((rx, i) => [
  ...rx.r.filter(([, sp]) => sp in DHF).map(([c, sp]) => ({ i, sp, c, onProducts: false })),
  ...rx.p.filter(([, sp]) => sp in DHF).map(([c, sp]) => ({ i, sp, c, onProducts: true })),
]).filter((u) => {
  // Needs a coefficient above 1 somewhere, or "forgot to divide" and "ignored the other
  // coefficients" both collapse onto the right answer and the slate runs short.
  const rx = FORMATION_RXNS[u.i];
  return u.c >= 2 || [...rx.r, ...rx.p].some(([c, sp]) => sp !== u.sp && sp in DHF && c >= 2);
});

registerChemTemplate({
  id: 'chem1-acs-06-dhf-back-solve',
  chapterId: CH,
  section: '5-6',
  band: 5,
  name: 'Find an unknown ΔH°f from ΔH°rxn',
  concepts: ['enthalpy-of-formation'],
  generate: (rng, h) => {
    const u = h.pick(BACK_SOLVE);
    const rx = FORMATION_RXNS[u.i];
    const dHrxn = side(rx.p) - side(rx.r);
    const others = (list) => list.filter(([, sp]) => sp !== u.sp);
    const Po = side(others(rx.p));
    const Ro = side(others(rx.r));
    // ΔHrxn = (Po [+ c·x]) − (Ro [+ c·x]), solved for x.
    const solve = (dH, po, ro) => (u.onProducts ? (dH - po + ro) / u.c : (po - ro - dH) / u.c);
    const x = solve(dHrxn, Po, Ro);
    const cx = u.c === 1 ? 'x' : `${u.c}x`;
    const known = [...rx.r, ...rx.p].map(([, sp]) => sp).filter((sp) => sp in DHF && sp !== u.sp)
      .filter((sp, i, a) => a.indexOf(sp) === i).map((sp) => `${sp} ${DHF[sp]}`).join(' · ');
    return {
      stem: `${eqText(rx)}    ΔH°rxn = ${dHrxn.toFixed(1)} kJ\nGiven ΔH°f (kJ/mol): ${known || '(no other compounds)'}. What is ΔH°f of ${u.sp}?`,
      ...h.choices(`${x.toFixed(1)} kJ/mol`, [
        { value: `${(x * u.c).toFixed(1)} kJ/mol`, error: 'forgot-to-divide-by-coefficient', why: `solved for ${u.c}·ΔH°f and stopped. ΔH°f is per ONE mole, so divide by ${u.c}` },
        { value: `${(-x).toFixed(1)} kJ/mol`, error: 'sign-error-rearranging', why: `put ${u.sp} on the wrong side of "products minus reactants" while rearranging` },
        { value: `${solve(-dHrxn, Po, Ro).toFixed(1)} kJ/mol`, error: 'flipped-reaction-sign', why: 'used ΔH°rxn with the wrong sign' },
        { value: `${solve(dHrxn, side(others(rx.p), false), side(others(rx.r), false)).toFixed(1)} kJ/mol`, error: 'ignored-other-coefficients', why: 'forgot to multiply the other ΔH°f values by their coefficients' },
      ]),
      explanation: `ΔH°rxn = Σ n·ΔH°f(products) − Σ n·ΔH°f(reactants), with ΔH°f = 0 for elements.\nKnown products total ${Po.toFixed(1)} kJ; known reactants total ${Ro.toFixed(1)} kJ.\n${u.onProducts ? `${dHrxn.toFixed(1)} = (${Po.toFixed(1)} + ${cx}) − (${Ro.toFixed(1)})` : `${dHrxn.toFixed(1)} = ${Po.toFixed(1)} − (${Ro.toFixed(1)} + ${cx})`}, so x = ${x.toFixed(1)} kJ/mol.`,
    };
  },
});

// ---------------------------------------------------------------------------
// hess-law: formation enthalpy of a fuel from three combustion equations
// ---------------------------------------------------------------------------
const HESS_FUELS = [
  { name: 'ethylene', sp: 'C₂H₄(g)', C: 2, H: 4, O: 0, dHf: 52.4 },
  { name: 'ethane', sp: 'C₂H₆(g)', C: 2, H: 6, O: 0, dHf: -84.7 },
  { name: 'propane', sp: 'C₃H₈(g)', C: 3, H: 8, O: 0, dHf: -103.8 },
  { name: 'methanol', sp: 'CH₃OH(l)', C: 1, H: 4, O: 1, dHf: -238.7 },
  { name: 'ethanol', sp: 'C₂H₅OH(l)', C: 2, H: 6, O: 1, dHf: -277.7 },
  { name: 'benzene', sp: 'C₆H₆(l)', C: 6, H: 6, O: 0, dHf: 49.0 },
];
const coef = (n) => (n === 1 ? '' : n === 0.5 ? '½' : Number.isInteger(n) ? String(n) : `${n * 2}/2 `);
const DH_CO2 = -393.5;
const DH_H2O = -285.8;

registerChemTemplate({
  id: 'chem1-acs-06-hess-from-combustion',
  chapterId: CH,
  section: '5-6',
  band: 4,
  name: "Hess's Law: a formation enthalpy from combustion data",
  concepts: ['hess-law'],
  generate: (rng, h) => {
    const f = h.pick(HESS_FUELS);
    const o2 = f.C + f.H / 4 - f.O / 2;
    const w = f.H / 2;
    const dHc = Math.round((f.C * DH_CO2 + w * DH_H2O - f.dHf) * 10) / 10;
    const ans = f.C * DH_CO2 + w * DH_H2O - dHc;
    const target = `${coef(f.C)}C(s, graphite) + ${coef(w)}H₂(g)${f.O ? ` + ${coef(f.O / 2)}O₂(g)` : ''} → ${f.sp}`;
    return {
      stem: `Given:\n  1. C(s, graphite) + O₂(g) → CO₂(g), ΔH₁ = ${DH_CO2} kJ\n  2. H₂(g) + ½O₂(g) → H₂O(l), ΔH₂ = ${DH_H2O} kJ\n  3. ${f.sp} + ${coef(o2)}O₂(g) → ${coef(f.C)}CO₂(g) + ${coef(w)}H₂O(l), ΔH₃ = ${dHc.toFixed(1)} kJ\nUse Hess's Law to find ΔH for the formation of ${f.name}:\n  ${target}`,
      ...h.choices(fmt1(ans), [
        { value: fmt1(f.C * DH_CO2 + w * DH_H2O + dHc), error: 'forgot-to-reverse', why: `added reaction 3 as written. ${f.name} is a PRODUCT of the target, so the combustion must be reversed` },
        { value: fmt1(DH_CO2 + DH_H2O - dHc), error: 'forgot-to-scale', why: `reversed reaction 3 but forgot to multiply reaction 1 by ${f.C} and reaction 2 by ${w}` },
        { value: fmt1(-ans), error: 'flipped-final-sign', why: 'combined the reactions correctly, then flipped the sign of the answer' },
        { value: fmt1(f.C * DH_CO2 + DH_H2O - dHc), error: 'scaled-only-carbon', why: `scaled reaction 1 by ${f.C} but left reaction 2 at one mole of H₂ instead of ${w}` },
      ]),
      explanation: `Line the equations up with the target: ×${f.C} reaction 1 (makes ${f.C} CO₂ from ${f.C} C), ×${w} reaction 2 (makes ${w} H₂O from ${w} H₂), and REVERSE reaction 3 so ${f.name} ends up on the product side and CO₂, H₂O and the extra O₂ cancel.\nΔH = ${f.C}(${DH_CO2}) + ${w}(${DH_H2O}) − (${dHc.toFixed(1)}) = ${(f.C * DH_CO2).toFixed(1)} + ${(w * DH_H2O).toFixed(1)} + ${(-dHc).toFixed(1)} = ${ans.toFixed(1)} kJ.`,
    };
  },
});
