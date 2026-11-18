// Chapters 5-8 question styles (redox, thermochemistry, light, electron configuration, periodic
// trends, Lewis structures, VSEPR, polarity, hybridization). Almost all of these come from his
// Exam 4 review (Chapters 1-8), photographed 2026-11-17. Same contract as styles-ch1.js.

import { BY_Z, el, sub, parseFormula, molarMass } from './data.js';
import { sf, measuredText } from './styles-ch1.js';

const sci = (x, n) => Number(x * (1 + 1e-12)).toExponential(n - 1).replace(/e\+?/, 'e');
const shuffleH = (h, arr) => [...arr].sort(() => h.rng() - 0.5);

// ---------- oxidation numbers ----------
// [species text, formula, charge, target element, its oxidation number]
const OXID = [
  ['the nitrite ion, NO₂⁻', 'NO2', -1, 'N', 3], ['the nitrate ion, NO₃⁻', 'NO3', -1, 'N', 5], ['the ammonium ion, NH₄⁺', 'NH4', 1, 'N', -3],
  ['dinitrogen monoxide, N₂O', 'N2O', 0, 'N', 1], ['nitric acid, HNO₃', 'HNO3', 0, 'N', 5], ['the sulfate ion, SO₄²⁻', 'SO4', -2, 'S', 6],
  ['the sulfite ion, SO₃²⁻', 'SO3', -2, 'S', 4], ['hydrogen sulfide, H₂S', 'H2S', 0, 'S', -2], ['the thiosulfate ion, S₂O₃²⁻', 'S2O3', -2, 'S', 2],
  ['the dichromate ion, Cr₂O₇²⁻', 'Cr2O7', -2, 'Cr', 6], ['the chromate ion, CrO₄²⁻', 'CrO4', -2, 'Cr', 6], ['the permanganate ion, MnO₄⁻', 'MnO4', -1, 'Mn', 7],
  ['the carbonate ion, CO₃²⁻', 'CO3', -2, 'C', 4], ['methane, CH₄', 'CH4', 0, 'C', -4], ['carbon monoxide, CO', 'CO', 0, 'C', 2],
  ['the perchlorate ion, ClO₄⁻', 'ClO4', -1, 'Cl', 7], ['the hypochlorite ion, ClO⁻', 'ClO', -1, 'Cl', 1], ['the chlorate ion, ClO₃⁻', 'ClO3', -1, 'Cl', 5],
  ['the phosphate ion, PO₄³⁻', 'PO4', -3, 'P', 5], ['potassium permanganate, KMnO₄', 'KMnO4', 0, 'Mn', 7], ['sodium dichromate, Na₂Cr₂O₇', 'Na2Cr2O7', 0, 'Cr', 6],
  // Peroxide: the one place O is not -2 (Exam 3 review Q29). oxCheck still passes because the
  // target is excluded from the fixed values.
  ['hydrogen peroxide, H₂O₂', 'H2O2', 0, 'O', -1],
];
function oxCheck([, f, q, t, want]) {
  const c = parseFormula(f);
  const fixed = { O: -2, H: 1, Na: 1, K: 1 };
  let rest = 0;
  for (const [e, n] of Object.entries(c)) if (e !== t) rest += fixed[e] * n;
  const got = (q - rest) / c[t];
  if (got !== want) throw new Error(`practiceExam: oxidation number of ${t} in ${f} is ${got}, table says ${want}`);
}
OXID.forEach(oxCheck);
const signed = (n) => (n > 0 ? `+${n}` : String(n));

// ---------- redox reactions ----------
const REDOX = [
  { eq: 'H₂S + Cl₂ → S + 2HCl', ra: 'H₂S', oa: 'Cl₂', others: ['S', 'HCl'], e: 2, why: 'S goes from -2 in H₂S to 0 (oxidized); Cl goes from 0 to -1 (reduced).' },
  { eq: 'Zn + CuSO₄ → ZnSO₄ + Cu', ra: 'Zn', oa: 'CuSO₄', others: ['ZnSO₄', 'Cu'], e: 2, why: 'Zn goes from 0 to +2 (oxidized); Cu goes from +2 to 0 (reduced).' },
  { eq: '2Na + Cl₂ → 2NaCl', ra: 'Na', oa: 'Cl₂', others: ['NaCl', 'Cl⁻'], e: 2, why: 'Na goes from 0 to +1 (oxidized); Cl goes from 0 to -1 (reduced).' },
  { eq: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂', ra: 'CO', oa: 'Fe₂O₃', others: ['Fe', 'CO₂'], e: 6, why: 'C goes from +2 in CO to +4 in CO₂ (oxidized); Fe goes from +3 to 0 (reduced).' },
  { eq: 'CuO + H₂ → Cu + H₂O', ra: 'H₂', oa: 'CuO', others: ['Cu', 'H₂O'], e: 2, why: 'H goes from 0 to +1 (oxidized); Cu goes from +2 to 0 (reduced).' },
  { eq: '2Al + Fe₂O₃ → Al₂O₃ + 2Fe', ra: 'Al', oa: 'Fe₂O₃', others: ['Al₂O₃', 'Fe'], e: 6, why: 'Al goes from 0 to +3 (oxidized); Fe goes from +3 to 0 (reduced).' },
  { eq: 'Mg + 2HCl → MgCl₂ + H₂', ra: 'Mg', oa: 'HCl', others: ['MgCl₂', 'H₂'], e: 2, why: 'Mg goes from 0 to +2 (oxidized); H goes from +1 to 0 (reduced).' },
  { eq: 'Cl₂ + 2KBr → 2KCl + Br₂', ra: 'KBr', oa: 'Cl₂', others: ['KCl', 'Br₂'], e: 2, why: 'Br goes from -1 to 0 (oxidized); Cl goes from 0 to -1 (reduced).' },
  { eq: '5CO + Br₂O₅ → 5CO₂ + Br₂', ra: 'CO', oa: 'Br₂O₅', others: ['CO₂', 'Br₂'], e: 10, why: 'C goes from +2 to +4 (oxidized, 5 C × 2 = 10 electrons); Br goes from +5 to 0 (reduced, 2 Br × 5 = 10 electrons).' },
  { eq: 'SnCl₂ + 2FeCl₃ → SnCl₄ + 2FeCl₂', ra: 'SnCl₂', oa: 'FeCl₃', others: ['SnCl₄', 'FeCl₂'], e: 2, why: 'Sn goes from +2 to +4 (oxidized); Fe goes from +3 to +2 (reduced, 2 Fe × 1).' },
  { eq: '2Al + 3CuCl₂ → 2AlCl₃ + 3Cu', ra: 'Al', oa: 'CuCl₂', others: ['AlCl₃', 'Cu'], e: 6, why: 'Al goes from 0 to +3 (2 Al × 3 = 6 electrons); Cu goes from +2 to 0 (3 Cu × 2 = 6).' },
  { eq: '4Fe + 3O₂ → 2Fe₂O₃', ra: 'Fe', oa: 'O₂', others: ['Fe₂O₃', 'O²⁻'], e: 12, why: 'Fe goes from 0 to +3 (4 Fe × 3 = 12 electrons); O goes from 0 to -2 (6 O × 2 = 12).' },
  { eq: '3Mg + N₂ → Mg₃N₂', ra: 'Mg', oa: 'N₂', others: ['Mg₃N₂', 'N³⁻'], e: 6, why: 'Mg goes from 0 to +2 (3 Mg × 2 = 6 electrons); N goes from 0 to -3 (2 N × 3 = 6).' },
  { eq: '5CO + I₂O₅ → 5CO₂ + I₂', ra: 'CO', oa: 'I₂O₅', others: ['CO₂', 'I₂'], e: 10, why: 'C goes from +2 to +4 (5 C × 2 = 10 electrons); I goes from +5 to 0 (2 I × 5 = 10).' },
  { eq: 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag', ra: 'Cu', oa: 'AgNO₃', others: ['Cu(NO₃)₂', 'Ag'], e: 2, why: 'Cu goes from 0 to +2 (oxidized); Ag goes from +1 to 0 (2 Ag × 1 = 2).' },
];

// ---------- heats of formation (kJ/mol, OpenStax Appendix G) ----------
export const HF = {
  'CO2(g)': -393.5, 'H2O(l)': -285.8, 'H2O(g)': -241.8, 'CH4(g)': -74.6, 'C2H6(g)': -84.0, 'C3H8(g)': -103.8, 'C2H5OH(l)': -277.6, 'CH3OH(l)': -238.6,
  'C6H12O6(s)': -1273.3, 'C2H2(g)': 226.7, 'C2H4(g)': 52.4, 'NH3(g)': -45.9, 'NO(g)': 90.3, 'SO2(g)': -296.8, 'SO3(g)': -395.7, 'CO(g)': -110.5,
  'Fe2O3(s)': -824.2, 'Al2O3(s)': -1675.7, 'H2O2(l)': -187.6, 'O2(g)': 0, 'Fe(s)': 0, 'Al(s)': 0,
};
export const HF_RXNS = [
  { terms: [[-1, 'C2H5OH(l)'], [-3, 'O2(g)'], [2, 'CO2(g)'], [3, 'H2O(l)']] }, { terms: [[-1, 'CH4(g)'], [-2, 'O2(g)'], [1, 'CO2(g)'], [2, 'H2O(l)']] },
  { terms: [[-1, 'C3H8(g)'], [-5, 'O2(g)'], [3, 'CO2(g)'], [4, 'H2O(l)']] }, { terms: [[-2, 'C2H6(g)'], [-7, 'O2(g)'], [4, 'CO2(g)'], [6, 'H2O(l)']] },
  { terms: [[-2, 'CH3OH(l)'], [-3, 'O2(g)'], [2, 'CO2(g)'], [4, 'H2O(l)']] }, { terms: [[-2, 'C2H2(g)'], [-5, 'O2(g)'], [4, 'CO2(g)'], [2, 'H2O(l)']] },
  { terms: [[-1, 'C2H4(g)'], [-3, 'O2(g)'], [2, 'CO2(g)'], [2, 'H2O(l)']] }, { terms: [[-4, 'NH3(g)'], [-5, 'O2(g)'], [4, 'NO(g)'], [6, 'H2O(g)']] },
  { terms: [[-2, 'SO2(g)'], [-1, 'O2(g)'], [2, 'SO3(g)']] }, { terms: [[-1, 'Fe2O3(s)'], [-3, 'CO(g)'], [2, 'Fe(s)'], [3, 'CO2(g)']] },
  { terms: [[-2, 'Al(s)'], [-1, 'Fe2O3(s)'], [1, 'Al2O3(s)'], [2, 'Fe(s)']] }, { terms: [[-1, 'C6H12O6(s)'], [-6, 'O2(g)'], [6, 'CO2(g)'], [6, 'H2O(l)']] },
];
export const spTxt = (sp) => { const [, f, st] = sp.match(/^(.*)\((\w+)\)$/); return `${sub(f)}(${st})`; };
export const rxnTxt = (terms) => {
  const side = (s) => terms.filter(([n]) => Math.sign(n) === s).map(([n, sp]) => `${Math.abs(n) === 1 ? '' : Math.abs(n)}${spTxt(sp)}`).join(' + ');
  return `${side(-1)} → ${side(1)}`;
};
export const dHrxn = (terms) => terms.reduce((s, [n, sp]) => s + n * HF[sp], 0);

// ---------- thermochemical stoichiometry ----------
const THERMO = [
  { f: 'C6H12O6', name: 'glucose', M: 180, eq: 'C₆H₁₂O₆(s) + 6O₂(g) → 6CO₂(g) + 6H₂O(l)', dH: -2900, n: 1, made: 'from CO₂ and H₂O' },
  { f: 'CH4', name: 'methane', eq: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', dH: -890, n: 1 },
  { f: 'C3H8', name: 'propane', eq: 'C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)', dH: -2220, n: 1 },
  { f: 'C2H5OH', name: 'ethanol', eq: 'C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)', dH: -1367, n: 1 },
  { f: 'C8H18', name: 'octane', eq: '2C₈H₁₈(l) + 25O₂(g) → 16CO₂(g) + 18H₂O(l)', dH: -10940, n: 2 },
  { f: 'H2', name: 'hydrogen gas', eq: '2H₂(g) + O₂(g) → 2H₂O(l)', dH: -571.6, n: 2 },
  { f: 'C2H6', name: 'ethane', eq: '2C₂H₆(g) + 7O₂(g) → 4CO₂(g) + 6H₂O(l)', dH: -3120, n: 2 },
  { f: 'CH3OH', name: 'methanol', eq: '2CH₃OH(l) + 3O₂(g) → 2CO₂(g) + 4H₂O(l)', dH: -1452, n: 2 },
];

// ---------- light ----------
const H6 = 6.63e-34, C3 = 3.00e8;

// ---------- electron configurations ----------
const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s'];
const CAP = { s: 2, p: 6, d: 10, f: 14 };
const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];
const EXCEPTIONS = new Set([24, 29, 41, 42, 44, 45, 46, 47, 57, 58, 64, 78, 79]);
const SUPN = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
function aufbau(z) {
  const out = [];
  let left = z;
  for (const o of ORDER) {
    if (!left) break;
    const k = Math.min(CAP[o[1]], left);
    out.push([o, k]); left -= k;
  }
  return out;
}
function configText(z, { core = true } = {}) {
  const full = aufbau(z);
  if (!core) return full.map(([o, k]) => `${o}${SUPN(k)}`).join(' ');
  const [nz, ns] = [...NOBLE].reverse().find(([n]) => n < z) ?? [0, ''];
  const coreLen = aufbau(nz).length;
  return `[${ns}] ${full.slice(coreLen).map(([o, k]) => `${o}${SUPN(k)}`).join(' ')}`;
}
const CONFIG_OVERRIDE = { 24: [['3d', 5], ['4s', 1]], 29: [['3d', 10], ['4s', 1]] };
function unpaired(z) {
  const subs = CONFIG_OVERRIDE[z] ?? aufbau(z).slice(-2);
  let u = 0;
  const seen = new Set();
  for (const [o, k] of [...(CONFIG_OVERRIDE[z] ?? []), ...aufbau(z)]) {
    if (seen.has(o)) continue;
    seen.add(o);
    const cap = CAP[o[1]], half = cap / 2;
    u += k <= half ? k : cap - k;
  }
  return subs ? u : u;
}

// main-group valence electrons
const valence = (e) => (e.group <= 2 ? e.group : e.group - 10);

// Clementi calculated atomic radii (pm) - they follow the periodic trends exactly.
const RADIUS = { Li: 167, Be: 112, B: 87, C: 67, N: 56, O: 48, F: 42, Ne: 38, Na: 190, Mg: 145, Al: 118, Si: 111, P: 98, S: 88, Cl: 79, Ar: 71, K: 243, Ca: 194, Ga: 136, Ge: 125, As: 114, Se: 103, Br: 94, Kr: 88, Rb: 265, Sr: 219, In: 156, Sn: 145, Sb: 133, Te: 123, I: 115, Xe: 108, Cs: 298, Ba: 253 };

// ---------- molecules (VSEPR) ----------
// f, shape, angle, lone pairs on central, hybridization of central, polar, pi bonds (null = depends on the Lewis structure chosen)
const MOL = [
  ['CH4', 'tetrahedral', '109.5°', 0, 'sp³', false, 0], ['NH3', 'trigonal pyramidal', 'about 107°', 1, 'sp³', true, 0], ['H2O', 'bent', 'about 104.5°', 2, 'sp³', true, 0],
  ['CO2', 'linear', '180°', 0, 'sp', false, 2], ['BF3', 'trigonal planar', '120°', 0, 'sp²', false, 0], ['PCl3', 'trigonal pyramidal', 'about 100° (less than 109.5°)', 1, 'sp³', true, 0],
  ['PBr3', 'trigonal pyramidal', 'about 101° (less than 109.5°)', 1, 'sp³', true, 0], ['PCl5', 'trigonal bipyramidal', '90° and 120°', 0, 'sp³d', false, 0],
  ['SF6', 'octahedral', '90°', 0, 'sp³d²', false, 0], ['SF4', 'seesaw', 'about 90° and 120°', 1, 'sp³d', true, 0], ['BrCl3', 'T-shaped', 'about 90°', 2, 'sp³d', true, 0],
  ['ClF3', 'T-shaped', 'about 90°', 2, 'sp³d', true, 0], ['XeF2', 'linear', '180°', 3, 'sp³d', false, 0], ['XeF4', 'square planar', '90°', 2, 'sp³d²', false, 0],
  ['OCl2', 'bent', 'about 110° (less than 109.5° expected, widened by the large Cl atoms)', 2, 'sp³', true, 0], ['OF2', 'bent', 'about 103°', 2, 'sp³', true, 0], ['H2S', 'bent', 'about 92°', 2, 'sp³', true, 0],
  ['CCl4', 'tetrahedral', '109.5°', 0, 'sp³', false, 0], ['CF4', 'tetrahedral', '109.5°', 0, 'sp³', false, 0], ['CFCl3', 'tetrahedral', 'about 109.5°', 0, 'sp³', true, 0],
  ['CH2Cl2', 'tetrahedral', 'about 109.5°', 0, 'sp³', true, 0], ['CHCl3', 'tetrahedral', 'about 109.5°', 0, 'sp³', true, 0], ['GeO2', 'linear', '180°', 0, 'sp', false, 2],
  ['HCN', 'linear', '180°', 0, 'sp', true, 2], ['CH2O', 'trigonal planar', 'about 120°', 0, 'sp²', true, 1], ['O3', 'bent', 'about 117°', 1, 'sp²', true, 1],
  ['NO3-', 'trigonal planar', '120°', 0, 'sp²', false, 1], ['CO32-', 'trigonal planar', '120°', 0, 'sp²', false, 1], ['ClO3-', 'trigonal pyramidal', 'about 107°', 1, 'sp³', true, null],
  ['NH4+', 'tetrahedral', '109.5°', 0, 'sp³', false, 0], ['H3O+', 'trigonal pyramidal', 'about 107°', 1, 'sp³', true, 0], ['ICl4-', 'square planar', '90°', 2, 'sp³d²', false, 0],
  ['I3-', 'linear', '180°', 3, 'sp³d', false, 0], ['BeCl2', 'linear', '180°', 0, 'sp', false, 0], ['NF3', 'trigonal pyramidal', 'about 102°', 1, 'sp³', true, 0],
  ['SCl2', 'bent', 'about 103°', 2, 'sp³', true, 0], ['SO2', 'bent', 'about 119°', 1, 'sp²', true, null], ['SO3', 'trigonal planar', '120°', 0, 'sp²', false, null],
  ['CS2', 'linear', '180°', 0, 'sp', false, 2], ['SiH4', 'tetrahedral', '109.5°', 0, 'sp³', false, 0], ['PH3', 'trigonal pyramidal', 'about 94°', 1, 'sp³', true, 0],
  ['C2H2', 'linear', '180°', 0, 'sp', false, 2], ['C2H4', 'trigonal planar', 'about 120°', 0, 'sp²', false, 1], ['N2', 'linear', '180°', 0, 'sp', false, 2],
].map(([f, shape, angle, lp, hyb, polar, pi]) => ({ f, shape, angle, lp, hyb, polar, pi }));
const molTxt = (f) => {
  const m = f.match(/^(.*?)(\d?[+-])?$/);
  return `${sub(m[1])}${m[2] ? m[2].replace(/(\d?)([+-])/, (_, d, s) => `${d ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[d] : ''}${s === '+' ? '⁺' : '⁻'}`) : ''}`;
};
const isIon = (f) => /[+-]$/.test(f);
const SHAPES = ['linear', 'bent', 'trigonal planar', 'trigonal pyramidal', 'tetrahedral', 'T-shaped', 'seesaw', 'square planar', 'trigonal bipyramidal', 'octahedral'];
const EGEOM = { 0: { 2: 'linear', 3: 'trigonal planar', 4: 'tetrahedral', 5: 'trigonal bipyramidal', 6: 'octahedral' } };
const domains = (m) => ({ sp: 2, 'sp²': 3, 'sp³': 4, 'sp³d': 5, 'sp³d²': 6 }[m.hyb]);
const POLAR_PAIRS = [['CF4', 'CFCl3'], ['SO3', 'SO2'], ['CO2', 'SO2'], ['BF3', 'NF3'], ['CCl4', 'CHCl3'], ['CH4', 'CH2Cl2'], ['XeF4', 'SF4'], ['BeCl2', 'SCl2'], ['PCl5', 'PCl3'], ['CS2', 'OCl2'], ['SiH4', 'PH3']];

// skeletal structures described in words: [description, formula]
const SKELETAL = [
  ['a benzene ring (six carbons with alternating double bonds) with nothing attached (benzene)', 'C6H6'],
  ['a six-membered ring of single bonds with only carbons (cyclohexane)', 'C6H12'],
  ['a six-membered ring with alternating double bonds in which one corner is N instead of C (pyridine)', 'C5H5N'],
  ['a five-membered ring with two C=C double bonds and one N–H corner (pyrrole)', 'C4H5N'],
  ['a five-membered ring containing an N–H corner, a C=N double bond and a C=C double bond (imidazole)', 'C3H4N2'],
  ['two benzene rings fused along one shared edge (naphthalene)', 'C10H8'],
  ['a benzene ring fused to a five-membered ring that contains one N–H and one C=C (indole)', 'C8H7N'],
  ['a benzene ring with one CH₃ group attached (toluene)', 'C7H8'],
  ['a benzene ring with one –OH group attached (phenol)', 'C6H6O'],
  ['a five-membered ring of single bonds with only carbons (cyclopentane)', 'C5H10'],
];
const fmtF = (c) => ['C', 'H', ...Object.keys(c).filter((k) => k !== 'C' && k !== 'H').sort()].filter((k) => c[k]).map((k) => `${k}${c[k] === 1 ? '' : c[k]}`).join('');

// ---------------------------------------------------------------------------------------------

export const STYLES_CH5_8 = [
  {
    id: 'oxidation-number', section: '5-2', title: 'Oxidation number of an atom in a compound or ion', asked: ['ex4:6'],
    real: { src: 'ex4', q: 6, stem: 'What is the oxidation number for nitrogen in the nitrite ion?', answer: '+3', p: { i: 0 } },
    gen(h, p) {
      const row = OXID[p ? p.i : h.int(0, OXID.length - 1)];
      const [txt, f, q, t, n] = row;
      const c = parseFormula(f);
      const neutral = n - q / c[t];
      return {
        stem: p ? 'What is the oxidation number for nitrogen in the nitrite ion?' : `What is the oxidation number of ${el(t).name} in ${txt}?`,
        right: signed(n), wrong: [signed(neutral), signed(-n), signed(q), signed(n + 2), signed(n - 2)].filter((w) => w !== signed(n)),
        explanation: `Rules: O is -2 (except in peroxides), H is +1 with nonmetals, Group 1 metals are +1, and everything adds up to the CHARGE of the species.\n    ${sub(f)}${q ? ` (charge ${q > 0 ? '+' : ''}${q})` : ''}: ${t} × ${c[t]} + (the rest) = ${q} -> ${t} = ${signed(n)}.\n\nSetting the sum to 0 for an ion (ignoring its charge) gives ${signed(neutral)}, the most common wrong answer.`,
      };
    },
  },
  {
    id: 'reducing-agent', section: '5-2', title: 'Identify the reducing (or oxidizing) agent', asked: ['ex4:18'],
    real: {
      src: 'ex4', q: 18, stem: 'What is the reducing agent in the following reaction? H₂S + 2Cl₂ → S + 2HCl', choices: ['H₂S', 'Cl₂', 'S', 'HCl'], answer: 'H₂S',
      explanation: 'Assign oxidation numbers. S goes from -2 in H₂S to 0 in S: it LOSES electrons, so it is oxidized, and the species that contains it, H₂S, is the REDUCING agent. Cl goes from 0 in Cl₂ to -1 in HCl: reduced, so Cl₂ is the oxidizing agent.\n\nThe agent is always a REACTANT, never a product, and it is the whole species (H₂S), not just the atom (S).\n\nNote: as printed, this equation is not balanced (4 Cl on the left, 2 on the right). Balanced, it is H₂S + Cl₂ → S + 2HCl. The answer does not change.',
    },
    gen(h) {
      const r = h.pick(REDOX);
      const askRA = h.rng() < 0.6;
      const right = askRA ? r.ra : r.oa;
      return {
        stem: `What is the ${askRA ? 'reducing' : 'oxidizing'} agent in the following reaction? ${r.eq}`,
        right, wrong: [askRA ? r.oa : r.ra, ...r.others],
        explanation: `${r.why}\nThe REDUCING agent is the reactant that is oxidized (it gives electrons away): ${r.ra}. The OXIDIZING agent is the reactant that is reduced: ${r.oa}.\n\nAn agent is always a reactant, never a product. Remember "LEO the lion says GER": Loss of Electrons is Oxidation, Gain of Electrons is Reduction.`,
      };
    },
  },
  {
    id: 'electrons-transferred', section: '5-2', title: 'Number of electrons transferred in a redox reaction', asked: ['ex4:15'],
    real: { src: 'ex4', q: 15, stem: 'How many electrons transfer in this redox reaction? 5 CO + Br₂O₅ → 5 CO₂ + Br₂', answer: '10', p: { i: 8 } },
    gen(h, p) {
      const r = p ? REDOX[p.i] : h.pick(REDOX);
      const per = { 2: [1, 4], 6: [3, 2, 12], 10: [2, 5, 20], 12: [3, 6, 24] }[r.e] ?? [1, r.e * 2];
      return {
        stem: `How many electrons transfer in this redox reaction? ${r.eq}`,
        right: String(r.e), wrong: [...per, r.e + 1, r.e * 2].filter((w) => w !== r.e && w > 0).map(String),
        explanation: `${r.why}\nElectrons transferred = (change per atom) × (number of atoms that change) = ${r.e}. The electrons lost by the reducing agent equal the electrons gained by the oxidizing agent, so count ONE side, never both added together.\n\nUsing the change for a single atom (forgetting the coefficient or subscript), or doubling by counting both halves, are the traps.`,
      };
    },
  },
  {
    id: 'hf-backsolve', section: '5-6', title: 'Heat of formation from a reaction enthalpy (Hess with ΔH°f values)', asked: ['ex4:1'],
    real: {
      src: 'ex4', q: 1,
      stem: 'Given the following table of ΔH°f values (kJ/mol): C₂H₅OH(l) -277.6; H₂O(l) -285.8; H₂O(g) -241.8; CO(g) -110.5; H₂O₂(l) -187.6; C₃H₈(g) -103.8. If the ΔH for the following reaction is -1367 kJ, what is the heat of formation for carbon dioxide? C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)',
      answer: '-393.6 kJ/mol', p: { i: 0, unknown: 'CO2(g)', dH: -1367 },
    },
    gen(h, p) {
      const r = HF_RXNS[p ? p.i : h.int(0, HF_RXNS.length - 1)];
      const cands = r.terms.filter(([, sp]) => HF[sp] !== 0);
      const [nU, unk] = p ? r.terms.find(([, sp]) => sp === p.unknown) : h.pick(cands);
      const dH = p ? p.dH : Number(dHrxn(r.terms).toFixed(1));
      const known = r.terms.filter(([, sp]) => sp !== unk);
      const rest = known.reduce((s, [n, sp]) => s + n * HF[sp], 0);
      const x = (dH - rest) / nU;
      const decoys = Object.keys(HF).filter((k) => HF[k] !== 0 && !r.terms.some(([, sp]) => sp === k));
      const table = shuffleH(h, [...known.filter(([, sp]) => HF[sp] !== 0).map(([, sp]) => sp), ...shuffleH(h, decoys).slice(0, 3)]).map((sp) => `${spTxt(sp)} ${HF[sp].toFixed(1)}`).join('; ');
      const fmt = (v) => `${v.toFixed(1)} kJ/mol`;
      return {
        stem: `Given the following table of ΔH°f values (kJ/mol): ${table}. If ΔH for the following reaction is ${dH.toFixed(1)} kJ, what is the heat of formation of ${spTxt(unk)}? ${rxnTxt(r.terms)}`,
        right: fmt(x), wrong: [fmt(dH - rest), fmt(-x), fmt((-dH + rest) / nU === x ? x * 2 : (-dH - rest) / nU), fmt((dH + rest) / nU), fmt(x / 2)].filter((w) => w !== fmt(x)),
        explanation: `ΔH°rxn = Σ n·ΔH°f(products) - Σ n·ΔH°f(reactants). Elements in their standard state (O₂, Fe, Al) are 0.\nPut in everything you know, leave ${spTxt(unk)} as x:\n    ${dH.toFixed(1)} = ${nU}x + (${rest.toFixed(1)})${nU < 0 ? ' [x is a reactant, so it enters with a minus sign]' : ''}\n    x = ${fmt(x)}\n\nWrong options forget to divide by the coefficient (${Math.abs(nU)}), flip the sign, or use products minus reactants backwards. If the table offers H₂O(g) and H₂O(l), use the state in the equation.`,
      };
    },
  },
  {
    id: 'thermo-stoich', section: '5-5', title: 'Thermochemical stoichiometry (energy ↔ mass)', asked: ['ex4:2'],
    real: {
      src: 'ex4', q: 2, stem: 'How much glucose can be produced when 10001 kJ of energy is provided (C₆H₁₂O₆; 180 g/mol) from CO₂ and H₂O? Use the following combustion equation to help you answer the question: C₆H₁₂O₆(s) + 6O₂(g) → 6CO₂(g) + 6H₂O(l) ΔH = -2900 kJ',
      answer: '621 g', p: { i: 0, mode: 'make', E: '10001' },
    },
    gen(h, p) {
      const t = THERMO[p ? p.i : h.int(0, THERMO.length - 1)];
      const M = t.M ?? Number(molarMass(t.f).toFixed(2));
      const mode = p?.mode ?? h.pick(['make', 'burn']);
      if (mode === 'make') {
        const E = p?.E ?? measuredText(h, 500, 20000, 3);
        const mol = (Number(E) / Math.abs(t.dH)) * t.n;
        const g = mol * M;
        return {
          stem: `How much ${t.name} can be produced${t.made ? ` ${t.made}` : ' by running the reverse of its combustion'} when ${E} kJ of energy is provided (${sub(t.f)}; ${M} g/mol)? Use the combustion equation: ${t.eq} ΔH = ${t.dH} kJ`,
          right: `${sf(g, 3)} g`, wrong: [`${sf(mol, 3)} g`, `${sf((Math.abs(t.dH) / Number(E)) * M, 3)} g`, `${sf(Number(E) * M / Math.abs(t.dH) / (t.n === 1 ? 2 : 1) * (t.n === 1 ? 1 : 1) / (t.n === 2 ? 1 : 1) * (t.n === 1 ? 2 : 0.5), 3)} g`, `${sf(g * 6, 3)} g`],
          explanation: `Making ${t.name} is the REVERSE of burning it, so it ABSORBS ${Math.abs(t.dH)} kJ per ${t.n} mol (ΔH = +${Math.abs(t.dH)} kJ).\n    ${E} kJ × (${t.n} mol ${sub(t.f)} / ${Math.abs(t.dH)} kJ) = ${sf(mol, 4)} mol\n    × ${M} g/mol = ${sf(g, 3)} g\n\nStopping at moles, dividing the wrong way, or multiplying by an O₂ or CO₂ coefficient are the traps.`,
        };
      }
      const m = measuredText(h, 5, 300, 3);
      const q = (Number(m) / M / t.n) * Math.abs(t.dH);
      return {
        stem: `How much heat is released when ${m} g of ${t.name} (${sub(t.f)}, ${M} g/mol) burns completely? ${t.eq} ΔH = ${t.dH} kJ`,
        right: `${sf(q, 3)} kJ`, wrong: [`${sf(Number(m) * Math.abs(t.dH), 3)} kJ`, `${sf((Number(m) / M) * Math.abs(t.dH) * (t.n === 1 ? 2 : 1), 3)} kJ`, `${sf(q / 1000, 3)} kJ`, `${sf(Number(m) / M, 3)} kJ`, `${sf(q * 2, 3)} kJ`],
        explanation: `ΔH = ${t.dH} kJ is for ${t.n} mol of ${sub(t.f)} as written.\n    ${m} g ÷ ${M} g/mol = ${sf(Number(m) / M, 4)} mol × (${Math.abs(t.dH)} kJ / ${t.n} mol) = ${sf(q, 3)} kJ released.\n\n${t.n > 1 ? `The equation burns ${t.n} mol, so divide by ${t.n}; forgetting that doubles the answer.` : 'Multiplying grams straight by ΔH skips the mole step.'}`,
      };
    },
  },
  {
    id: 'photon-wavelength', section: '6-2', title: 'Wavelength, frequency and energy of one photon', asked: ['ex4:4'],
    real: { src: 'ex4', q: 4, stem: 'What is the wavelength of a photon that has an energy of 2.84 × 10⁻¹⁹ J? (h = 6.63 × 10⁻³⁴ J·s, E = hν, c = λν, c = 3.00 × 10⁸ m/s)', answer: '7.00e-7 m', p: { mode: 'EtoL', E: 2.84e-19 } },
    gen(h, p) {
      const mode = p?.mode ?? h.pick(['EtoL', 'LtoE', 'LtoNu']);
      const given = '(h = 6.63 × 10⁻³⁴ J·s, E = hν, c = λν, c = 3.00 × 10⁸ m/s)';
      if (mode === 'EtoL') {
        const E = p?.E ?? Number(`${measuredText(h, 1.5, 9.9, 3)}e-19`);
        const L = (H6 * C3) / E;
        return {
          stem: `What is the wavelength of a photon that has an energy of ${sci(E, 3)} J? ${given}`,
          right: `${sci(L, 3)} m`, wrong: [`${sci(E / H6, 3)} m`, `${sci(E / (H6 * C3), 3)} m`, `${sci(H6 / E, 3)} m`, `${sci(L * 1e9, 3)} m`],
          explanation: `Combine the two equations: E = hν and ν = c/λ, so E = hc/λ and λ = hc/E.\n    λ = (6.63 × 10⁻³⁴ × 3.00 × 10⁸) ÷ ${sci(E, 3)} = ${sci(L, 3)} m (= ${sf(L * 1e9, 3)} nm)\n\n${sci(E / H6, 3)} is the FREQUENCY (Hz), not a wavelength. Check the size: visible light is 400-700 nm, about 10⁻⁷ m.`,
        };
      }
      const nm = h.int(120, 950);
      const L = nm * 1e-9;
      if (mode === 'LtoE') {
        const E = (H6 * C3) / L;
        return {
          stem: `What is the energy of one photon of light with a wavelength of ${nm} nm? ${given}`,
          right: `${sci(E, 3)} J`, wrong: [`${sci((H6 * C3) / nm, 3)} J`, `${sci(H6 * L * C3, 3)} J`, `${sci(H6 * (C3 / L) * 6.022e23, 3)} J`, `${sci(C3 / L, 3)} J`],
          explanation: `E = hc/λ with λ in METERS: ${nm} nm = ${sci(L, 3)} m.\n    E = (6.63 × 10⁻³⁴)(3.00 × 10⁸) ÷ ${sci(L, 3)} = ${sci(E, 3)} J\n\nLeaving λ in nm is off by 10⁹; multiplying by Avogadro's number gives the energy of a MOLE of photons.`,
        };
      }
      const nu = C3 / L;
      return {
        stem: `What is the frequency of light with a wavelength of ${nm} nm? (c = λν, c = 3.00 × 10⁸ m/s)`,
        right: `${sci(nu, 3)} s⁻¹`, wrong: [`${sci(C3 / nm, 3)} s⁻¹`, `${sci(C3 * L, 3)} s⁻¹`, `${sci(L / C3, 3)} s⁻¹`, `${sci(nu / 1e9, 3)} s⁻¹`],
        explanation: `ν = c/λ with λ in meters: ${nm} nm = ${sci(L, 3)} m -> ν = 3.00 × 10⁸ ÷ ${sci(L, 3)} = ${sci(nu, 3)} s⁻¹ (Hz).\n\nForgetting nm -> m is the classic 10⁹ error.`,
      };
    },
  },
  {
    id: 'photon-molar-energy', section: '6-2', title: 'Energy of a mole of photons', asked: ['ex4:36'],
    real: { src: 'ex4', q: 36, stem: 'What is the energy associated with a mol of photons of electromagnetic energy with a wavelength of 220 nm?', answer: '544 kJ/mol', p: { nm: 220 } },
    gen(h, p) {
      const nm = p?.nm ?? h.int(100, 900);
      const E1 = (6.626e-34 * 2.998e8) / (nm * 1e-9);
      const Em = (E1 * 6.022e23) / 1000;
      return {
        stem: `What is the energy associated with a mol of photons of electromagnetic energy with a wavelength of ${nm} nm?`,
        right: `${sf(Em, 3)} kJ/mol`, wrong: [`${sci(E1, 3)} kJ/mol`, `${sf(Em * 1000, 3)} kJ/mol`, `${sf(Em / 1e9 * 1e9 / 1000, 3)} kJ/mol`, `${sf(Em * 2, 3)} kJ/mol`].filter((w, i, a) => a.indexOf(w) === i),
        explanation: `One photon: E = hc/λ = (6.626 × 10⁻³⁴)(2.998 × 10⁸) ÷ (${nm} × 10⁻⁹ m) = ${sci(E1, 3)} J.\nOne MOLE of photons: × 6.022 × 10²³ = ${sf(Em * 1000, 4)} J/mol = ${sf(Em, 3)} kJ/mol.\n\nStopping at one photon, or leaving the answer in J while calling it kJ, are the traps. Shorter wavelength means MORE energy per photon.`,
      };
    },
  },
  {
    id: 'transition-wavelength', section: '6-3', title: 'Hydrogen transitions: shortest/longest wavelength, most/least energy', asked: ['ex4:5', 'ex4:41'],
    real: { src: 'ex4', q: 5, stem: 'Which transition would result in a photon with the shortest wavelength?', choices: ['n=2 to n=1', 'n=4 to n=1', 'n=5 to n=3', 'n=7 to n=6'], answer: 'n=4 to n=1', p: { ask: 'shortest wavelength', ts: [[2, 1], [4, 1], [5, 3], [7, 6]] } },
    gen(h, p) {
      const dE = ([a, b]) => 1 / b ** 2 - 1 / a ** 2;
      let ts = p?.ts;
      if (!ts) {
        for (let t = 0; t < 50; t++) {
          const set = new Map();
          while (set.size < 4) { const lo = h.int(1, 4); const hi = lo + h.int(1, 4); set.set(`${hi}-${lo}`, [hi, lo]); }
          ts = [...set.values()];
          const v = ts.map(dE).sort((x, y) => x - y);
          if (v[0] !== v[1] && v[2] !== v[3]) break;
        }
      }
      const ask = p?.ask ?? h.pick(['shortest wavelength', 'longest wavelength', 'highest energy', 'lowest frequency']);
      const big = ask === 'shortest wavelength' || ask === 'highest energy';
      const best = [...ts].sort((x, y) => (big ? dE(y) - dE(x) : dE(x) - dE(y)))[0];
      const txt = ([a, b]) => `n=${a} to n=${b}`;
      return {
        stem: `Which transition in a hydrogen atom would release a photon with the ${ask}?`,
        right: txt(best), wrong: ts.filter((t) => t !== best).map(txt),
        explanation: `Energy released ∝ (1/n_final² - 1/n_initial²). ${ts.map((t) => `${txt(t)}: ${dE(t).toFixed(4)}`).join('; ')}.\nThe biggest energy gap is a fall to a LOW level (n=1 especially); levels crowd together at high n, so a fall between two high levels releases little energy.\n\nShortest wavelength = highest energy = highest frequency; longest wavelength = lowest energy. ${txt(best)} is the ${ask}.`,
      };
    },
  },
  {
    id: 'electron-configuration', section: '6-4', title: 'Ground-state electron configuration', asked: ['ex4:39'],
    real: { src: 'ex4', q: 39, stem: 'What is the ground state electron configuration for lead?', answer: '[Xe] 6s² 4f¹⁴ 5d¹⁰ 6p²', p: { z: 82 } },
    gen(h, p) {
      const pool = Object.values(BY_Z).filter((e) => e.z > 4 && e.z <= 86 && !EXCEPTIONS.has(e.z) && e.z !== 43);
      const e = p ? BY_Z[p.z] : h.pick(pool);
      const right = configText(e.z);
      const parts = right.split(' ');
      const last = parts[parts.length - 1];
      const bump = (s, d) => s.replace(/([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/, (_, l, k) => `${l}${SUPN(Number(k.split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')) + d)}`);
      const wrong = [
        right.replace(/ 4f¹⁴/, '') !== right ? right.replace(/ 4f¹⁴/, '') : right.replace(/(\d)d¹⁰ /, ''),
        [...parts.slice(0, -1), bump(last, 2)].join(' '),
        [...parts.slice(0, -1), bump(last, -1)].join(' '),
        configText(e.z, { core: true }).replace(/^\[(\w+)\]/, (m, ns) => `[${({ He: 'Ne', Ne: 'Ar', Ar: 'Kr', Kr: 'Xe', Xe: 'Rn' })[ns]}]`),
        right.replace(/(\d)d/, (_, n) => `${Number(n) + 1}d`),
        [...parts.slice(0, -1), bump(last, 1)].join(' '),
      ].filter((w) => w !== right && !/[spdf]⁰( |$)/.test(w));
      return {
        stem: `What is the ground state electron configuration for ${e.name}?`,
        right, wrong,
        explanation: `${e.name[0].toUpperCase() + e.name.slice(1)} has Z = ${e.z}, so ${e.z} electrons. Fill in Aufbau order: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p. Start from the previous noble gas and add the rest:\n    ${right}\n\nCheck: the superscripts after the core must add to ${e.z} minus the core's electrons. The d subshell is one shell BEHIND (3d fills after 4s), and the 4f¹⁴ block must not be skipped for elements after Xe.`,
      };
    },
  },
  {
    id: 'valence-electrons', section: '6-4', title: 'Valence electrons in an atom or ion', asked: ['ex4:7', 'ex4:40'],
    real: { src: 'ex4', q: 7, stem: 'How many valence electrons are in an atom of In?', answer: '3', p: { s: 'In', q: 0 } },
    gen(h, p) {
      const mains = Object.values(BY_Z).filter((e) => e.kind === 'main-group element' && e.z > 2 && e.group !== 18 && e.z <= 83);
      const e = p ? el(p.s) : h.pick(mains);
      const q = p ? p.q : h.pick([0, 0, 0, e.group >= 15 ? -(18 - e.group) : 0, e.sym === 'Pb' || e.sym === 'Sn' ? 2 : 0]);
      const v = valence(e);
      const ans = q < 0 ? 8 : q === 2 ? 2 : v;
      const label = q === 0 ? `an atom of ${e.sym}` : `the ${e.sym}${q > 0 ? `²⁺` : ['', '⁻', '²⁻', '³⁻'][-q]} ion`;
      return {
        stem: `How many valence electrons are in ${label}?`,
        right: String(ans), wrong: [e.z, e.group, v + (q < 0 ? 0 : 2), 8 - v, v + 1, 0].filter((w) => w !== ans && w >= 0).map(String),
        explanation: `Valence electrons are the electrons in the outermost s and p subshells. ${e.name[0].toUpperCase() + e.name.slice(1)} is in group ${e.group}, so a neutral atom has ${v}${e.group >= 13 ? ` (group number minus 10)` : ''}.${q < 0 ? ` As an anion it gains ${-q} to fill the octet: ${v} + ${-q} = 8.` : q === 2 ? ` ${e.sym}²⁺ loses its two p electrons and keeps the ns² pair: 2.` : ''}\n\nDo not count d or f electrons in the inner shells, and do not use the atomic number.\nFor an ion that has lost ALL its valence electrons (lead(IV), Pb⁴⁺, on the Exam 4 review): Pb has 4 (6s² 6p²) and Pb⁴⁺ loses all 4, so 0 remain in the 6th shell. Some instructors instead count the new outer shell (5s² 5p⁶ 5d¹⁰ = 18); ask which convention he wants.`,
      };
    },
  },
  {
    id: 'atomic-size-order', section: '6-5', title: 'Order elements by atomic size', asked: ['ex4:3'],
    real: {
      src: 'ex4', q: 3, stem: 'Order these elements in terms of their size from smallest to largest. As, Br, Kr, and Xe',
      choices: ['Kr < Br < As < Xe', 'As < Br < Kr < Xe', 'Xe < Kr < Br < As', 'Br < Kr < As < Xe'], answer: 'Kr < Br < As < Xe',
      explanation: 'Atomic radius DECREASES across a period (left to right: more protons pull the same shell in tighter) and INCREASES down a group (more shells).\n    As, Br, Kr are all in period 4: As (group 15) > Br (group 17) > Kr (group 18).\n    Xe is in period 5, one shell further out, so it is placed largest.\n-> Kr < Br < As < Xe.\n\n⚠ As versus Xe is not strictly decidable from the two trends (Xe is lower but further right), and published radius tables disagree on it. The answer above is the one the trends are meant to give on this review; if the exam asks a pair like that, the "bigger period wins" reading is the likely intent.',
    },
    gen(h, p) {
      // Only sets where EVERY pair is decided by the trends (same period, same group, or one element
      // is both lower and further left). Diagonal pairs like As/Xe are ambiguous and stay out.
      const per = (k) => [2, 10, 18, 36, 54, 86].findIndex((n) => el(k).z <= n) + 1;
      const decided = (a, b) => (per(a) - per(b)) * (el(a).group - el(b).group) <= 0;
      let els = p?.els;
      if (!els) {
        const keys = Object.keys(RADIUS).filter((k) => el(k).group !== 18);
        for (let t = 0; t < 400; t++) {
          els = shuffleH(h, keys).slice(0, 4);
          if (els.every((a) => els.every((b) => a === b || decided(a, b)))) break;
        }
      }
      const dir = p?.dir ?? h.pick(['up', 'down']);
      const sorted = [...els].sort((a, b) => (dir === 'up' ? RADIUS[a] - RADIUS[b] : RADIUS[b] - RADIUS[a]));
      const j = (arr) => arr.join(dir === 'up' ? ' < ' : ' > ');
      const byZ = [...els].sort((a, b) => el(a).z - el(b).z);
      const wrong = [j([...sorted].reverse()), j(dir === 'up' ? byZ : [...byZ].reverse()), j([sorted[1], sorted[0], sorted[2], sorted[3]]), j([sorted[0], sorted[2], sorted[1], sorted[3]]), j([sorted[0], sorted[1], sorted[3], sorted[2]])];
      return {
        stem: `Order these elements in terms of their size from ${dir === 'up' ? 'smallest to largest' : 'largest to smallest'}. ${els.join(', ').replace(/, (?=[^,]*$)/, ', and ')}`,
        right: j(sorted), wrong,
        explanation: `Atomic radius INCREASES going DOWN a group (more shells) and DECREASES going ACROSS a period left to right (more protons pull the same shell in tighter).\nApproximate radii (pm): ${els.map((e) => `${e} ${RADIUS[e]}`).join(', ')} -> ${j(sorted)}.\n\nOrdering by atomic number gets the across-a-period trend backwards.`,
      };
    },
  },
  {
    id: 'paramagnetic', section: '6-4', title: 'Paramagnetic or diamagnetic (unpaired electrons)', asked: ['ex4:37'],
    real: { src: 'ex4', q: 37, stem: 'Which species is paramagnetic in its ground state? Ca, Cr, Zn or Mg', choices: ['Ca', 'Cr', 'Zn', 'Mg'], answer: 'Cr', p: { right: 'Cr', wrong: ['Ca', 'Zn', 'Mg'], ask: 'paramagnetic' } },
    gen(h, p) {
      const DIA = ['He', 'Be', 'Mg', 'Ca', 'Zn', 'Cd', 'Ne', 'Ar', 'Kr', 'Sr', 'Ba', 'Xe'];
      const PARA = ['Cr', 'Cu', 'Na', 'Al', 'N', 'O', 'Fe', 'Co', 'Ni', 'Mn', 'Ti', 'V', 'B', 'F', 'Cl', 'Sc', 'K', 'P'];
      const ask = p?.ask ?? h.pick(['paramagnetic', 'diamagnetic']);
      const [rp, wp] = ask === 'paramagnetic' ? [PARA, DIA] : [DIA, PARA];
      const right = p?.right ?? h.pick(rp);
      const wrong = p?.wrong ?? shuffleH(h, wp).slice(0, 3);
      const u = (s) => unpaired(el(s).z);
      return {
        stem: `Which species is ${ask} in its ground state? ${[right, ...wrong].sort().join(', ').replace(/, (?=[^,]*$)/, ' or ')}`,
        right, wrong,
        explanation: `PARAmagnetic = at least one UNPAIRED electron; DIAmagnetic = every electron paired. Fill the last subshells with Hund's rule (one electron per orbital before pairing).\nUnpaired electrons: ${[right, ...wrong].map((s) => `${s} ${u(s)}`).join(', ')}.\n${[right, ...wrong].includes('Cr') ? 'Cr is the famous exception: [Ar] 3d⁵ 4s¹, six unpaired electrons. ' : ''}${[right, ...wrong].includes('Cu') ? 'Cu is an exception too: [Ar] 3d¹⁰ 4s¹, one unpaired electron. ' : ''}Elements ending in a filled s² (Group 2, Zn, Cd) or a filled p⁶ (noble gases) are diamagnetic.`,
      };
    },
  },
  {
    id: 'pi-bonds', section: '8-5', title: 'Number of pi bonds in a molecule', asked: ['ex4:23'],
    real: {
      src: 'ex4', q: 23, stem: 'How many pi bonds are in a molecule of SO₃?', choices: ['0', '1', '2', '3'], answer: '3',
      explanation: 'Every double bond has 1 pi bond; every triple bond has 2. The answer depends on the Lewis structure your professor uses for SO₃:\n    • Formal-charge-minimized structure (his Chapter 7 slides: add double bonds "to reduce formal charges", 0 is best): S makes THREE S=O double bonds (expanded octet), every formal charge is 0 -> 3 pi bonds.\n    • Octet-rule structure: one S=O and two S–O, with resonance -> 1 pi bond.\nKeyed 3 here because his slides grade structures by formal charge. ⚠ Ask him which he wants before the exam; the same question about SO₂ has the same split (2 or 1).',
    },
    gen(h) {
      const m = h.pick(MOL.filter((x) => x.pi != null && ['CO2', 'HCN', 'N2', 'C2H2', 'C2H4', 'CH2O', 'O3', 'NO3-', 'CO32-', 'CS2', 'GeO2', 'CH4', 'NH3', 'H2O', 'BF3'].includes(x.f)));
      const bonds = { CO2: 4, HCN: 4, N2: 3, C2H2: 5, C2H4: 6, CH2O: 4, O3: 3, 'NO3-': 4, 'CO32-': 4, CS2: 4, GeO2: 4, CH4: 4, NH3: 3, H2O: 2, BF3: 3 }[m.f];
      return {
        stem: `How many pi bonds are in a${isIon(m.f) ? 'n ion' : ' molecule'} of ${molTxt(m.f)}?`,
        right: String(m.pi), wrong: ['0', '1', '2', '3', '4', String(bonds), String(bonds - m.pi)].filter((w) => w !== String(m.pi)),
        explanation: `Draw the Lewis structure first. A single bond is 1 sigma; a double bond is 1 sigma + 1 pi; a triple bond is 1 sigma + 2 pi.\n${molTxt(m.f)} has ${m.pi === 0 ? 'only single bonds, so 0 pi bonds' : `${m.pi} pi bond${m.pi > 1 ? 's' : ''}`}${['O3', 'NO3-', 'CO32-'].includes(m.f) ? ' (one double bond shared by resonance, but any one structure has exactly one)' : ''}. Counting all bonds (${bonds}) or only sigma bonds (${bonds - m.pi}) answers a different question.`,
      };
    },
  },
  {
    id: 'bond-angle', section: '8-2', title: 'Approximate bond angle (VSEPR)', asked: ['ex4:24'],
    real: { src: 'ex4', q: 24, stem: 'What is the approximate bond angle between 2 of the nitrogen hydrogen bonds in NH₃?', choices: ['about 107°', '109.5°', '120°', '90°'], answer: 'about 107°', p: { f: 'NH3' } },
    gen(h, p) {
      const m = p ? MOL.find((x) => x.f === p.f) : h.pick(MOL.filter((x) => ['CH4', 'NH3', 'H2O', 'CO2', 'BF3', 'SF6', 'XeF4', 'BeCl2', 'H3O+', 'NH4+', 'CH2O', 'C2H2', 'CCl4', 'NO3-', 'CO32-', 'HCN', 'SiH4'].includes(x.f)));
      const pool = ['180°', '120°', '109.5°', 'about 107°', 'about 104.5°', '90°'];
      return {
        stem: p ? this.real?.stem ?? '' : `What is the approximate bond angle in ${molTxt(m.f)}?`,
        right: m.angle, wrong: pool.filter((a) => a !== m.angle),
        explanation: `Count electron domains on the central atom (bonds count once each, double or single, plus lone pairs): ${domains(m)} -> ideal ${({ 2: '180°', 3: '120°', 4: '109.5°', 5: '90° and 120°', 6: '90°' })[domains(m)]}.\nLone pairs take more room and squeeze the bonds together: 1 lone pair on a tetrahedral base gives about 107°, 2 lone pairs about 104.5°.\n${molTxt(m.f)} has ${m.lp} lone pair${m.lp === 1 ? '' : 's'} on the central atom -> ${m.angle}.`,
      };
    },
  },
  {
    id: 'lone-pairs-central', section: '7-5', title: 'Lone pairs on the central atom', asked: ['ex4:25', 'ex4:34'],
    real: { src: 'ex4', q: 25, stem: 'How many lone pairs of electrons are on the central atom in an ion of ClO₃⁻?', answer: '1', p: { f: 'ClO3-' } },
    gen(h, p) {
      const m = p ? MOL.find((x) => x.f === p.f) : h.pick(MOL.filter((x) => !['C2H2', 'C2H4', 'N2'].includes(x.f)));
      const atoms = Object.values(parseFormula(m.f.replace(/\d?[+-]$/, ''))).reduce((s, v) => s + v, 0);
      return {
        stem: `How many lone pairs of electrons are on the central atom in ${isIon(m.f) ? 'an ion of ' : ''}${molTxt(m.f)}?`,
        right: String(m.lp), wrong: ['0', '1', '2', '3', '4', String(atoms * 3)].filter((w) => w !== String(m.lp)),
        explanation: `Count valence electrons (add one per negative charge, subtract one per positive charge), connect the outer atoms to the central atom, complete the outer atoms' octets, then put what is left on the central atom.\n${molTxt(m.f)}: ${m.lp} lone pair${m.lp === 1 ? '' : 's'} on the central atom, giving a ${m.shape} shape.\n\nThe question asks only about the CENTRAL atom; the lone pairs on the outer atoms (about 3 on each O or halogen) do not count.`,
      };
    },
  },
  {
    id: 'bond-length-resonance', section: '7-6', title: 'Bond length in a resonance structure', asked: ['ex4:26'],
    real: { src: 'ex4', q: 26, stem: 'If a C–O bond length is 1.66 pm and a C=O bond length is 1.52 pm, how long would the carbon oxygen bonds in the carbonate ion be?', answer: '1.61 pm', p: { i: 0, s: 1.66, d: 1.52 } },
    gen(h, p) {
      const ION = [['carbonate ion, CO₃²⁻', 'carbon oxygen', 'C–O', 'C=O', 3, 1], ['nitrate ion, NO₃⁻', 'nitrogen oxygen', 'N–O', 'N=O', 3, 1], ['nitrite ion, NO₂⁻', 'nitrogen oxygen', 'N–O', 'N=O', 2, 1],
        ['ozone molecule, O₃', 'oxygen oxygen', 'O–O', 'O=O', 2, 1], ['acetate ion (the two C–O bonds of COO⁻)', 'carbon oxygen', 'C–O', 'C=O', 2, 1], ['benzene molecule, C₆H₆', 'carbon carbon', 'C–C', 'C=C', 6, 3]];
      const [name, pair, s1, d1, nb, nd] = ION[p ? p.i : h.int(0, ION.length - 1)];
      const s = p?.s ?? h.int(140, 155);
      const d = p?.d ?? s - h.int(14, 24);
      const bo = 1 + nd / nb;
      const L = s - (bo - 1) * (s - d);
      const u = p ? 'pm' : 'pm';
      const dp = p ? 2 : 0;
      return {
        stem: `If a ${s1} bond length is ${s} ${u} and a ${d1} bond length is ${d} ${u}, how long would the ${pair} bonds in the ${name} be?`,
        right: `${L.toFixed(dp)} ${u}`, wrong: [`${s.toFixed(dp)} ${u}`, `${d.toFixed(dp)} ${u}`, `${((s + d) / 2 === L ? s - (2 / 3) * (s - d) : (s + d) / 2).toFixed(dp)} ${u}`, `${(s + d).toFixed(dp)} ${u}`],
        explanation: `Resonance spreads the ${nd} double bond${nd > 1 ? 's' : ''} over ${nb} equivalent bonds, so each bond has bond order 1 + ${nd}/${nb} = ${bo.toFixed(2)}. All ${nb} bonds are the same length, in between a single and a double bond, ${nd / nb === 0.5 ? 'halfway' : `${nd}/${nb} of the way`} from single toward double:\n    ${s} - ${(nd / nb).toFixed(2)} × (${s} - ${d}) = ${L.toFixed(2)} ${u}\n\nNo bond in a resonance hybrid is a pure single or pure double bond.${p ? ' (The review prints "pm"; real C–O bonds are about 143 pm and C=O about 120 pm, so the numbers are illustrative.)' : ''}`,
      };
    },
  },
  {
    id: 'molecular-shape', section: '8-2', title: 'Molecular shape (VSEPR)', asked: ['ex4:27', 'ex4:33'],
    real: { src: 'ex4', q: 27, stem: 'What is the shape of PCl₃?', answer: 'trigonal pyramidal', p: { f: 'PCl3' } },
    gen(h, p) {
      const m = p ? MOL.find((x) => x.f === p.f) : h.pick(MOL.filter((x) => !['C2H2', 'C2H4', 'N2'].includes(x.f)));
      const eg = EGEOM[0][domains(m)];
      return {
        stem: `What is the ${p ? '' : 'molecular '}shape of ${molTxt(m.f)}?`.replace('the shape', 'the shape'),
        right: m.shape, wrong: [eg, ...shuffleH(h, SHAPES)].filter((s, i, a) => s !== m.shape && a.indexOf(s) === i).slice(0, 4),
        explanation: `${molTxt(m.f)}: ${domains(m)} electron domains on the central atom (${domains(m) - m.lp} bonded atom${domains(m) - m.lp > 1 ? 's' : ''} + ${m.lp} lone pair${m.lp === 1 ? '' : 's'}). Electron geometry: ${eg}. Molecular shape (atoms only): ${m.shape}.\n\nThe electron geometry counts lone pairs; the molecular shape describes only where the ATOMS are. Mixing the two up is the most common error${m.lp ? ` (${eg} is the electron geometry here)` : ''}.`,
      };
    },
  },
  {
    id: 'polar-nonpolar', section: '8-3', title: 'Is the molecule polar or nonpolar', asked: ['ex4:31', 'ex4:32'],
    real: { src: 'ex4', q: 31, stem: 'Is the compound GeO₂ polar or nonpolar?', answer: 'nonpolar: it is linear, so the two Ge=O bond dipoles cancel', p: { f: 'GeO2' } },
    gen(h, p) {
      const m = p ? MOL.find((x) => x.f === p.f) : h.pick(MOL.filter((x) => !isIon(x.f) && x.f !== 'N2' && x.f !== 'C2H4' && x.f !== 'C2H2'));
      const sym = `it is ${m.shape}, so the ${m.f === 'GeO2' ? 'two Ge=O' : ''}${m.f === 'GeO2' ? ' ' : ''}bond dipoles cancel`.replace(' , ', ', ').replace('the  bond', 'the bond');
      const right = m.polar ? `polar: its ${m.shape} shape leaves the bond dipoles unbalanced` : `nonpolar: ${m.f === 'GeO2' ? 'it is linear, so the two Ge=O bond dipoles cancel' : `it is ${m.shape}, so the bond dipoles cancel`}`;
      const wrong = m.polar
        ? [`nonpolar: it is ${m.shape}, so the bond dipoles cancel`, 'nonpolar: all of its atoms are nonmetals', 'nonpolar: polarity only applies to ionic compounds', 'polar: every molecule with polar bonds is polar']
        : [`polar: the bonds in it are polar`, 'polar: it has lone pairs on its outer atoms', 'nonpolar: the atoms have equal electronegativity', 'polar: every molecule with polar bonds is polar'];
      void sym;
      return {
        stem: `Is the compound ${molTxt(m.f)} polar or nonpolar?`,
        right, wrong,
        explanation: `Two steps: (1) are the BONDS polar (different electronegativities)? (2) does the SHAPE cancel them? A symmetric shape with identical outer atoms and no lone pairs on the central atom (linear AX₂, trigonal planar AX₃, tetrahedral AX₄, square planar, octahedral) cancels every dipole.\n${molTxt(m.f)} is ${m.shape}${m.lp ? ` with ${m.lp} lone pair${m.lp > 1 ? 's' : ''} on the central atom` : ''} -> ${m.polar ? 'POLAR' : 'NONPOLAR'}.\n\nPolar bonds do not guarantee a polar molecule; the shape decides.`,
      };
    },
  },
  {
    id: 'more-polar', section: '8-3', title: 'Which of two compounds is more polar (larger dipole)', asked: ['ex4:28', 'ex4:30'],
    real: { src: 'ex4', q: 28, stem: 'Which compound is more polar? CF₄ or CFCl₃', choices: ['CF₄', 'CFCl₃', 'They are equally polar', 'Neither is polar'], answer: 'CFCl₃', p: { i: 0 } },
    gen(h, p) {
      const [a, b] = POLAR_PAIRS[p ? p.i : h.int(0, POLAR_PAIRS.length - 1)];
      const A = MOL.find((x) => x.f === a), B = MOL.find((x) => x.f === b);
      const [np, pol] = A.polar ? [B, A] : [A, B];
      const order = h.rng() < 0.5 || p ? [a, b] : [b, a];
      const phr = p ? 'is more polar' : h.pick(['is more polar', 'would we expect to have a larger dipole']);
      return {
        stem: `Which compound ${phr}? ${order.map(molTxt).join(' or ')}`,
        right: molTxt(pol.f), wrong: [molTxt(np.f), 'They are equally polar', 'Neither is polar'],
        explanation: `${molTxt(np.f)} is ${np.shape}${np.lp ? '' : ' with identical outer atoms'}, so its bond dipoles cancel: nonpolar, zero net dipole. ${molTxt(pol.f)} is ${pol.shape}${pol.lp ? ` with ${pol.lp} lone pair${pol.lp > 1 ? 's' : ''} on the central atom` : ' with DIFFERENT outer atoms'}, so the dipoles do not cancel: polar.\n\nReplacing one outer atom with a different one (CF₄ -> CFCl₃) or adding a lone pair (SO₃ -> SO₂) breaks the symmetry.`,
      };
    },
  },
  {
    id: 'hybridization', section: '8-4', title: 'Hybridization of the central atom', asked: ['ex4:29'],
    real: { src: 'ex4', q: 29, stem: 'What is the hybridization of carbon in the carbonate ion?', answer: 'sp²', p: { f: 'CO32-' } },
    gen(h, p) {
      const m = p ? MOL.find((x) => x.f === p.f) : h.pick(MOL);
      const central = m.f === 'CO32-' ? 'carbon' : m.f === 'C2H2' || m.f === 'C2H4' ? 'each carbon' : m.f === 'N2' ? 'each nitrogen' : `the central atom`;
      return {
        stem: `What is the hybridization of ${central} in ${isIon(m.f) ? 'the ion ' : ''}${molTxt(m.f)}?`,
        right: m.hyb, wrong: ['sp', 'sp²', 'sp³', 'sp³d', 'sp³d²'].filter((x) => x !== m.hyb),
        explanation: `Hybridization follows the number of electron domains (each bonded atom counts once, whether single, double or triple, plus each lone pair): 2 -> sp, 3 -> sp², 4 -> sp³, 5 -> sp³d, 6 -> sp³d².\n${molTxt(m.f)}: ${domains(m)} domains -> ${m.hyb}.\n\nCounting each bond in a double bond separately is the classic error (it would push carbonate's carbon to sp³).`,
      };
    },
  },
  {
    id: 'formula-from-structure', section: '7-5', title: 'Molecular formula from a skeletal (line) drawing', asked: ['ex4:35'],
    real: {
      src: 'ex4', q: 35, stem: 'What is the chemical formula for the compound drawn on the review? (The drawing: a benzene ring fused to a five-membered ring that contains an N–H corner, a C=N double bond and one more carbon - benzimidazole.)',
      choices: ['C₇H₆N₂', 'C₇H₄N₂', 'C₇H₅N₂', 'C₉H₆N₂'], answer: 'C₇H₆N₂',
      explanation: 'In a skeletal (line) drawing every corner or line end with no label is a CARBON, and each carbon carries enough hydrogens to make 4 bonds. Hydrogens on N are drawn.\n    Carbons: 6 in the benzene ring + 1 in the five-membered ring (between the two N) = 7.\n    Hydrogens: 4 on the benzene ring carbons that are not shared, 1 on the C between the N atoms, 1 on N–H = 6.\n    Nitrogens: 2.\n-> C₇H₆N₂ (benzimidazole).\n\nForgetting the implicit hydrogens (C₇H₄N₂) or counting the two shared ring carbons twice (C₉...) are the traps.',
    },
    gen(h) {
      const [desc, f] = h.pick(SKELETAL);
      const c = parseFormula(f);
      const mk = (d) => sub(fmtF({ ...c, ...d }));
      return {
        stem: `A skeletal (line) structure shows ${desc}. What is its molecular formula?`,
        right: sub(f), wrong: [mk({ H: c.H - 2 }), mk({ H: c.H + 2 }), mk({ C: c.C + 2 }), mk({ H: Math.max(1, c.H - 4) })].filter((w) => w !== sub(f)),
        explanation: `Every unlabeled corner is a carbon; each carbon has as many H as it needs to reach 4 bonds (a ring C with a double bond and two ring bonds has 1 H; a ring C with only single bonds has 2 H; a carbon shared by two fused rings has none). Atoms other than C and H are written, along with any H on them.\nCount: ${sub(f)}.\n\nThe usual errors are forgetting implicit hydrogens or double-counting the carbons two fused rings share.`,
      };
    },
  },
];
