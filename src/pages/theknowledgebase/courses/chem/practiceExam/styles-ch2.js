// Chapter 2 question styles (atoms, isotopes, ions, the periodic table, nomenclature) from his
// study guides. One style = one generator; see index.js for how a style becomes 3 questions and
// styles-ch1.js for the contract this file follows.
//
// gen(h, p) returns { stem, right, wrong, explanation }. `p` is null for a sibling (random draw)
// or a parameter object that reproduces a real study-guide question (checked by the test).
// Every number is computed from data.js; every distractor is a named mistake.

import { BY_Z, ELEMENTS, el, parseFormula, sub, sup, chargeSup, CATIONS, ANIONS, anion, cation, ionCounts, ionicFormula, ionicName, cationName, ROMAN, molecularName, PREFIX, soluble } from './data.js';
import { sf, rnd, measuredText } from './styles-ch1.js';

// ---------- small helpers (local to chapter 2) ----------

const SUBD = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const subNum = (n) => String(n).split('').map((c) => SUBD[c]).join('');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const ion = (sym, q) => sym + (q ? chargeSup(q) : '');
const signed = (q) => (q > 0 ? `+${q}` : `${q}`);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Distinct strings from `list`, excluding the right answer. */
const others = (right, list) => [...new Set(list.filter((x) => x != null && x !== '').map(String))].filter((x) => x !== String(right));
/** Numeric distractors: the named error values first, then off-by-one miscounts only if needed to reach 3. */
function numWrong(right, cands) {
  const out = others(right, cands.filter((x) => Number.isFinite(Number(x)) && Number(x) > 0));
  for (const d of [1, -1, 2, -2, 3, 4]) {
    if (out.length >= 3) break;
    const v = String(Number(right) + d);
    if (Number(v) > 0 && !out.includes(v) && v !== String(right)) out.push(v);
  }
  return out;
}
/** The `n` elements closest in atomic number to Z (a misread of the periodic table). */
const nearestZ = (Z, n) => ELEMENTS.filter((e) => e.z !== Z).sort((a, b) => Math.abs(a.z - Z) - Math.abs(b.z - Z) || a.z - b.z).slice(0, n);
const shuffled = (h, arr) => [...arr].map((x) => [h.rng(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
/** Valence electrons of a main-group element (group 1-2 -> group; 13-18 -> group - 10). */
const valence = (e) => (e.group <= 2 ? e.group : e.group - 10);
/** The charge a main-group element's monatomic ion takes. */
const mainCharge = (e) => (e.metal === 'metal' ? valence(e) : valence(e) - 8);

// ---------- data pools ----------

// Two-element compounds with real mass ratios, for the law of definite proportions.
const DP_COMPOUNDS = ['NaCl', 'H2O', 'CO2', 'MgO', 'CaCl2', 'Fe2O3', 'Al2O3', 'SO3', 'NH3', 'CH4', 'KBr', 'CuO', 'ZnS', 'N2O', 'CaO', 'Li2O'];

// [symbol, mass number, charges the ion commonly takes ([0] = only ever asked as a neutral atom)]
const ISOTOPES = [
  ['N', 15, [-3]], ['N', 16, [-3]], ['O', 18, [-2]], ['F', 19, [-1]], ['Na', 23, [1]], ['Mg', 26, [2]], ['Al', 27, [3]],
  ['P', 31, [-3]], ['S', 34, [-2]], ['Cl', 37, [-1]], ['K', 39, [1]], ['Ca', 44, [2]], ['Ti', 47, [3, 4]], ['Cr', 52, [3, 2]],
  ['Mn', 55, [2]], ['Fe', 56, [2, 3]], ['Co', 59, [2, 3]], ['Cu', 65, [1, 2]], ['Zn', 66, [2]], ['Se', 80, [-2]], ['Br', 81, [-1]],
  ['Sr', 88, [2]], ['Ag', 109, [1]], ['Sn', 120, [2, 4]], ['I', 127, [-1]], ['Ba', 138, [2]], ['Au', 197, [3, 1]], ['Pb', 208, [2, 4]],
  ['U', 238, [0]], ['C', 14, [0]], ['Xe', 132, [0]], ['Ar', 40, [0]],
];
const drawIsotope = (h) => {
  const [sym, A, qs] = h.pick(ISOTOPES);
  const q = qs[0] === 0 ? 0 : h.rng() < 0.2 ? 0 : h.pick(qs);
  const e = el(sym);
  return { sym, name: e.name, Z: e.z, A, N: A - e.z, q, e: e.z - q };
};

// Real elements with two natural isotopes: [mass number, isotopic mass (amu), percent abundance].
const TWO_ISO = [
  { sym: 'Cl', iso: [[35, '34.969', '75.78'], [37, '36.966', '24.22']] },
  { sym: 'Cu', iso: [[63, '62.930', '69.15'], [65, '64.928', '30.85']] },
  { sym: 'B', iso: [[10, '10.013', '19.90'], [11, '11.009', '80.10']] },
  { sym: 'Ga', iso: [[69, '68.926', '60.11'], [71, '70.925', '39.89']] },
  { sym: 'Br', iso: [[79, '78.918', '50.69'], [81, '80.916', '49.31']] },
  { sym: 'Li', iso: [[6, '6.015', '7.59'], [7, '7.016', '92.41']] },
  { sym: 'Ag', iso: [[107, '106.905', '51.84'], [109, '108.905', '48.16']] },
  { sym: 'Rb', iso: [[85, '84.912', '72.17'], [87, '86.909', '27.83']] },
  { sym: 'Sb', iso: [[121, '120.904', '57.21'], [123, '122.904', '42.79']] },
  { sym: 'N', iso: [[14, '14.003', '99.64'], [15, '15.000', '0.36']] },
  { sym: 'Eu', iso: [[151, '150.920', '47.81'], [153, '152.921', '52.19']] },
  { sym: 'Ir', iso: [[191, '190.961', '37.30'], [193, '192.963', '62.70']] },
];
// Real elements with three natural isotopes (abundances sum to 100).
const THREE_ISO = [
  { sym: 'Mg', iso: [[24, '23.985', '78.99'], [25, '24.986', '10.00'], [26, '25.983', '11.01']] },
  { sym: 'Si', iso: [[28, '27.977', '92.23'], [29, '28.976', '4.68'], [30, '29.974', '3.09']] },
  { sym: 'Ne', iso: [[20, '19.992', '90.48'], [21, '20.994', '0.27'], [22, '21.991', '9.25']] },
  { sym: 'K', iso: [[39, '38.964', '93.26'], [40, '39.964', '0.01'], [41, '40.962', '6.73']] },
];
const HYPO = ['X', 'Q', 'Z', 'M', 'R', 'D', 'E', 'J', 'L', 'T', 'G', 'A'];

// Real oxides X(a)O(b): [symbol, a, b].
const OXIDES = [
  ['Al', 2, 3], ['Fe', 2, 3], ['Cr', 2, 3], ['S', 1, 2], ['S', 1, 3], ['C', 1, 2], ['Mg', 1, 1], ['Ca', 1, 1], ['Ti', 1, 2],
  ['N', 2, 5], ['P', 2, 5], ['Na', 2, 1], ['K', 2, 1], ['Li', 2, 1], ['Cu', 1, 1], ['Cu', 2, 1], ['Zn', 1, 1], ['Mn', 1, 2],
  ['Si', 1, 2], ['B', 2, 3], ['Ga', 2, 3], ['Sc', 2, 3], ['V', 2, 5], ['W', 1, 3], ['Sn', 1, 2], ['Pb', 1, 2], ['Ba', 1, 1],
  ['Sr', 1, 1], ['Ni', 1, 1], ['Cl', 2, 7], ['Mo', 1, 3], ['As', 2, 5], ['Se', 1, 2],
];
/** The element whose table mass is closest to v (other than `not`). */
const nearestMass = (v, not) => ELEMENTS.filter((e) => e.sym !== not).reduce((best, e) => (Math.abs(e.mass - v) < Math.abs(best.mass - v) ? e : best));

// Atoms and monatomic ions for electron counting: [symbol, charge].
const SPECIES = [
  ['N', -3], ['O', -2], ['F', -1], ['Ne', 0], ['Na', 1], ['Mg', 2], ['Al', 3], ['P', -3], ['S', -2], ['Cl', -1], ['Ar', 0], ['K', 1],
  ['Ca', 2], ['Sc', 3], ['As', -3], ['Se', -2], ['Br', -1], ['Kr', 0], ['Rb', 1], ['Sr', 2], ['Y', 3], ['Te', -2], ['I', -1], ['Xe', 0],
  ['Cs', 1], ['Ba', 2], ['Fe', 2], ['Fe', 3], ['Mn', 2], ['Co', 3], ['Co', 2], ['Cu', 1], ['Cu', 2], ['Zn', 2], ['Ni', 2], ['Ag', 1],
  ['Cd', 2], ['Cr', 3], ['Ti', 4], ['Na', 0], ['Mg', 0], ['Cl', 0], ['S', 0], ['O', 0], ['Ca', 0], ['Se', 0], ['K', 0],
];

// Natural form of a pure element at room temperature (diatomic style).
const FORMS = {
  D: (s) => `as diatomic molecules, ${s}₂`,
  M: (s) => `as single, separate atoms, ${s}`,
  P: () => 'as larger polyatomic molecules, such as P₄ or S₈',
  L: () => 'as a metallic solid: a lattice of atoms sharing a sea of electrons',
  N: () => 'as a covalent network solid, like diamond or graphite',
};
const FORM_OF = {
  H: 'D', N: 'D', O: 'D', F: 'D', Cl: 'D', Br: 'D', I: 'D', He: 'M', Ne: 'M', Ar: 'M', Kr: 'M', Xe: 'M', P: 'P', S: 'P',
  Fe: 'L', Na: 'L', Cu: 'L', Mg: 'L', Al: 'L', Ni: 'L', C: 'N', Si: 'N',
};
const DIATOMIC = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
const NOT_DIATOMIC = ['Fe', 'P', 'Ni', 'Ne', 'S', 'C', 'Na', 'Ar', 'He', 'Cu', 'Kr', 'Mg', 'Si'];

const FAMILIES = [
  { name: 'Alkali metals', group: 1, q: 1, why: 'each atom has 1 valence electron and loses it.' },
  { name: 'Alkaline earth metals', group: 2, q: 2, why: 'each atom has 2 valence electrons and loses both.' },
  { name: 'Halogens', group: 17, q: -1, why: 'each atom has 7 valence electrons and gains 1 to reach 8.' },
  { name: 'Group 16 nonmetals (oxygen, sulfur, selenium)', group: 16, q: -2, why: 'each atom has 6 valence electrons and gains 2 to reach 8.' },
  { name: 'Group 15 nonmetals (nitrogen and phosphorus)', group: 15, q: -3, why: 'each atom has 5 valence electrons and gains 3 to reach 8.' },
  { name: 'Group 13 metals such as aluminum and gallium', group: 13, q: 3, why: 'each atom has 3 valence electrons and loses all 3.' },
];
const ION_ELEMENTS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Ga', 'N', 'P', 'O', 'S', 'Se', 'F', 'Cl', 'Br', 'I'];

// Salts of an unknown metal X: formula, anion name, X's charge, X count, anion count.
const SALTS = [
  { f: 'XCl', word: 'chloride', q: 1, nX: 1, nA: 1 }, { f: 'XBr', word: 'bromide', q: 1, nX: 1, nA: 1 },
  { f: 'XF2', word: 'fluoride', q: 2, nX: 1, nA: 2 }, { f: 'XI2', word: 'iodide', q: 2, nX: 1, nA: 2 },
  { f: 'XBr2', word: 'bromide', q: 2, nX: 1, nA: 2 }, { f: 'X2O', word: 'oxide', q: 1, nX: 2, nA: 1 },
  { f: 'XO', word: 'oxide', q: 2, nX: 1, nA: 1 }, { f: 'XCl3', word: 'chloride', q: 3, nX: 1, nA: 3 },
  { f: 'XN', word: 'nitride', q: 3, nX: 1, nA: 1 }, { f: 'X2S', word: 'sulfide', q: 1, nX: 2, nA: 1 },
  { f: 'XS', word: 'sulfide', q: 2, nX: 1, nA: 1 }, { f: 'X2O3', word: 'oxide', q: 3, nX: 2, nA: 3 },
  { f: 'XF3', word: 'fluoride', q: 3, nX: 1, nA: 3 },
];
const SALT_METALS = { 1: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Ag'], 2: ['Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Cd'], 3: ['Al', 'Ga', 'Sc', 'Y', 'In'] };

const IONIC_CPDS = ['NaCl', 'KBr', 'CaCl2', 'MgO', 'Al2O3', 'Fe2O3', 'CuSO4', 'NH4Cl', '(NH4)2SO4', 'NH4NO3', 'LiF', 'BaS', 'K2O', 'Na3PO4', 'ZnS', 'CaCO3'];
const MOLECULAR_CPDS = ['N2O', 'SO3', 'PCl5', 'CO2', 'H2O', 'NH3', 'CH4', 'CCl4', 'NO2', 'SF6', 'P4O10', 'N2O4', 'CS2', 'ClF3', 'OF2', 'Cl2O7', 'I2O5', 'PCl3', 'N2S3'];
const BIN_IONIC = ['NaCl', 'KBr', 'CaCl2', 'MgO', 'Al2O3', 'Fe2O3', 'LiF', 'BaS', 'K2O', 'ZnS', 'CsBr', 'AlN', 'SrI2', 'CaF2'];
const AMMONIUM = ['NH4Cl', '(NH4)2SO4', 'NH4NO3', '(NH4)3PO4', 'NH4Br'];
const BOND_OPT = {
  I: 'ionic, because it contains a metal and a nonmetal',
  C: 'covalent (molecular), because it contains only nonmetals',
  N: 'ionic, because it contains the ammonium ion, NH₄⁺',
  L: 'metallic, because it contains a metal',
};

// Binary molecular compounds: [first element, its count, second element, its count].
const MOLEC = [
  ['N', 2, 'O', 4], ['S', 1, 'O', 3], ['P', 4, 'O', 10], ['C', 1, 'S', 2], ['Cl', 1, 'O', 2], ['N', 2, 'O', 5], ['S', 1, 'F', 6],
  ['C', 1, 'Cl', 4], ['N', 1, 'O', 2], ['I', 1, 'F', 7], ['Cl', 2, 'O', 7], ['Xe', 1, 'F', 4], ['S', 2, 'Cl', 2], ['Si', 1, 'O', 2],
  ['N', 2, 'O', 1], ['P', 1, 'Cl', 5], ['P', 1, 'Cl', 3], ['B', 1, 'F', 3], ['N', 2, 'O', 3], ['S', 1, 'O', 2], ['P', 2, 'O', 5],
  ['P', 4, 'S', 3], ['Br', 1, 'F', 5], ['Cl', 1, 'F', 3], ['N', 1, 'Cl', 3], ['Si', 1, 'Cl', 4], ['C', 1, 'Br', 4], ['O', 1, 'F', 2],
  ['Se', 1, 'O', 2], ['I', 2, 'O', 5],
];
const ROOT2 = { O: 'oxide', S: 'sulfide', Cl: 'chloride', F: 'fluoride', Br: 'bromide', I: 'iodide', N: 'nitride', P: 'phosphide', Se: 'selenide' };
const molF = (a, na, b, nb) => `${a}${na > 1 ? na : ''}${b}${nb > 1 ? nb : ''}`;

// -ate/-ite (and -ide) partners: the anion a student confuses this one with.
const PARTNER = {
  sulfate: 'sulfite', sulfite: 'sulfate', nitrate: 'nitrite', nitrite: 'nitrate', chlorate: 'chlorite', chlorite: 'chlorate',
  perchlorate: 'chlorate', hypochlorite: 'chlorite', carbonate: 'hydrogen carbonate', 'hydrogen carbonate': 'carbonate',
  phosphate: 'hydrogen phosphate', 'hydrogen phosphate': 'phosphate', 'dihydrogen phosphate': 'phosphate', chromate: 'dichromate',
  dichromate: 'chromate', sulfide: 'sulfite', nitride: 'nitrite', phosphide: 'phosphate', chloride: 'chlorate', oxide: 'hydroxide',
  hydroxide: 'oxide', bromide: 'bromate', iodide: 'iodate', selenide: 'selenate', arsenide: 'arsenate', cyanide: 'cyanate',
  permanganate: 'manganate',
};
// Partner ions that are not in data.js's ANIONS (used only as wrong options).
const EXTRA_ANIONS = [
  { f: 'BrO3', q: -1, name: 'bromate', poly: true }, { f: 'IO3', q: -1, name: 'iodate', poly: true },
  { f: 'SeO4', q: -2, name: 'selenate', poly: true }, { f: 'AsO4', q: -3, name: 'arsenate', poly: true },
  { f: 'OCN', q: -1, name: 'cyanate', poly: true }, { f: 'MnO4', q: -2, name: 'manganate', poly: true },
];
const anyAnion = (name) => anion(name) ?? EXTRA_ANIONS.find((a) => a.name === name) ?? null;
/** The ending a student swaps in by mistake when no real partner ion exists (-ide/-ate/-ite). */
const endingSwap = (name) => (/ide$/.test(name) ? name.replace(/ide$/, 'ate') : /ate$/.test(name) ? name.replace(/ate$/, 'ite') : name.replace(/ite$/, 'ate'));
const partF = (ion1, n) => (n === 1 ? ion1.f : ion1.poly ? `(${ion1.f})${n}` : `${ion1.f}${n}`);
// Ammonium never pairs with a 3- monatomic ion; sodium nitride is left out because its formulas spell "NaN".
const ionicPairs = () => CATIONS.flatMap((c) => ANIONS.filter((a) => !(c.f === 'NH4' && !a.poly && a.q === -3) && !(c.f === 'Na' && a.f === 'N')).map((a) => [c, a]));
/** Prefix + word, with the a/o of the prefix dropped before "oxide" (pentoxide, monoxide). */
const withPrefix = (n, word) => {
  let p = PREFIX[n];
  if (/^oxide/.test(word) && /[ao]$/.test(p)) p = p.slice(0, -1);
  return p + word;
};

// Acids: formula, name, the anion it comes from, wrong names and wrong formulas (named errors).
const ACIDS = [
  { f: 'HCl', name: 'hydrochloric acid', an: 'chloride (Cl⁻)', kind: 'binary', wn: ['chloric acid', 'hydrochlorous acid', 'chlorous acid', 'hydrogen chloride'], wf: ['HClO3', 'H2Cl', 'HClO'] },
  { f: 'HBr', name: 'hydrobromic acid', an: 'bromide (Br⁻)', kind: 'binary', wn: ['bromic acid', 'hydrobromous acid', 'bromous acid', 'hydrogen bromide'], wf: ['HBrO3', 'H2Br', 'HBrO'] },
  { f: 'HI', name: 'hydroiodic acid', an: 'iodide (I⁻)', kind: 'binary', wn: ['iodic acid', 'hydroiodous acid', 'iodous acid', 'hydrogen iodide'], wf: ['HIO3', 'H2I', 'HIO'] },
  { f: 'HF', name: 'hydrofluoric acid', an: 'fluoride (F⁻)', kind: 'binary', wn: ['fluoric acid', 'hydrofluorous acid', 'fluorous acid', 'hydrogen fluoride'], wf: ['H2F', 'HFO', 'HF2'] },
  { f: 'H2S', name: 'hydrosulfuric acid', an: 'sulfide (S²⁻)', kind: 'binary', wn: ['sulfuric acid', 'hydrosulfurous acid', 'sulfurous acid', 'hydrogen sulfide'], wf: ['H2SO4', 'H2SO3', 'HS'] },
  { f: 'HCN', name: 'hydrocyanic acid', an: 'cyanide (CN⁻)', kind: 'binary', wn: ['cyanic acid', 'hydrocyanous acid', 'hydrogen cyanate'], wf: null },
  { f: 'H2CO3', name: 'carbonic acid', an: 'carbonate (CO₃²⁻)', kind: 'ate', wn: ['carbonous acid', 'hydrocarbonic acid', 'hydrogen carbonate'], wf: ['HCO3', 'H2CO2', 'H3CO3'] },
  { f: 'H2SO4', name: 'sulfuric acid', an: 'sulfate (SO₄²⁻)', kind: 'ate', wn: ['sulfurous acid', 'hydrosulfuric acid', 'hydrogen sulfate'], wf: ['H2SO3', 'H2S', 'HSO4'] },
  { f: 'H2SO3', name: 'sulfurous acid', an: 'sulfite (SO₃²⁻)', kind: 'ite', wn: ['sulfuric acid', 'hydrosulfurous acid', 'hydrogen sulfite'], wf: ['H2SO4', 'H2S', 'HSO3'] },
  { f: 'HNO3', name: 'nitric acid', an: 'nitrate (NO₃⁻)', kind: 'ate', wn: ['nitrous acid', 'hydronitric acid', 'hydrogen nitrate'], wf: ['HNO2', 'H2NO3', 'H3N'] },
  { f: 'HNO2', name: 'nitrous acid', an: 'nitrite (NO₂⁻)', kind: 'ite', wn: ['nitric acid', 'hydronitrous acid', 'hydrogen nitrite'], wf: ['HNO3', 'H2NO2', 'H3N'] },
  { f: 'H3PO4', name: 'phosphoric acid', an: 'phosphate (PO₄³⁻)', kind: 'ate', wn: ['phosphorous acid', 'hydrophosphoric acid', 'hydrogen phosphate'], wf: ['H3PO3', 'HPO4', 'H3P'] },
  { f: 'HClO4', name: 'perchloric acid', an: 'perchlorate (ClO₄⁻)', kind: 'ate', wn: ['chloric acid', 'hydrochloric acid', 'perchlorous acid', 'hydrogen perchlorate'], wf: ['HClO3', 'HCl', 'H2ClO4'] },
  { f: 'HClO3', name: 'chloric acid', an: 'chlorate (ClO₃⁻)', kind: 'ate', wn: ['chlorous acid', 'hydrochloric acid', 'perchloric acid', 'hydrogen chlorate'], wf: ['HClO2', 'HCl', 'HClO4'] },
  { f: 'HClO2', name: 'chlorous acid', an: 'chlorite (ClO₂⁻)', kind: 'ite', wn: ['chloric acid', 'hypochlorous acid', 'hydrochlorous acid', 'hydrogen chlorite'], wf: ['HClO3', 'HClO', 'HCl'] },
  { f: 'HClO', name: 'hypochlorous acid', an: 'hypochlorite (ClO⁻)', kind: 'ite', wn: ['hypochloric acid', 'chlorous acid', 'hydrochloric acid', 'hydrogen hypochlorite'], wf: ['HClO2', 'HCl', 'HClO3'] },
  { f: 'HC2H3O2', name: 'acetic acid', an: 'acetate (C₂H₃O₂⁻)', kind: 'ate', wn: ['acetous acid', 'hydroacetic acid', 'hydrogen acetate'], wf: null },
];
const ACID_RULE = 'Acid naming depends on the anion:\n    -ide anion (no oxygen)  ->  hydro-___-ic acid   (chloride -> hydrochloric acid)\n    -ate anion              ->  ___-ic acid         (sulfate -> sulfuric acid)\n    -ite anion              ->  ___-ous acid        (sulfite -> sulfurous acid)\nThe hydro- prefix is ONLY for acids with no oxygen. The number of H atoms equals the size of the anion\'s negative charge, so the acid is neutral.';

// Formulas with parentheses and hydrates, for counting atoms.
const COUNT_FORMULAS = [
  '(NH4)2HPO4', 'Ni(ClO4)2', 'Cr(C2H3O2)3', 'Ca3(PO4)2', 'Al2(SO4)3', 'CuSO4·5H2O', 'Fe(NO3)3·9H2O', 'Mg(OH)2', '(NH4)3PO4',
  'Ba(NO3)2', 'Na2CO3·10H2O', 'CoCl2·6H2O', 'Al(NO3)3', 'K2Cr2O7', 'Fe2(SO4)3', 'MgSO4·7H2O', 'Ca(C2H3O2)2', '(NH4)2SO4',
];

// Cations and anions used for particle-diagram ratios (soluble combinations only, since the box is "in water").
const DIAGRAM_CATIONS = CATIONS.filter((c) => !c.v || ['Fe', 'Cu'].includes(c.f));
// Oxide, nitride, phosphide and arsenide react with water instead of dissolving as ions, so they are left out.
const DIAGRAM_ANIONS = ANIONS.filter((a) => (!a.poly && !['O', 'N', 'P', 'As'].includes(a.f)) || ['NO3', 'SO4', 'PO4', 'CO3', 'OH', 'C2H3O2'].includes(a.f));

// ---------------------------------------------------------------------------------------------

export const STYLES_CH2 = [
  {
    id: 'definite-proportions', section: '2-2', title: 'Law of definite proportions: scale a known composition',
    asked: ['ch12:15', 'ex1:7', 'ex1:18', 'ex1:20'],
    real: { from: 'ch12', idx: 14 },
    gen(h) {
      const frame = h.int(0, 2);
      const law = 'This is the LAW OF DEFINITE PROPORTIONS: every sample of a pure compound has the same mass ratio of its elements, whatever the size of the sample.';
      if (frame === 0) {
        const T1 = rnd(h, 20, 60, 2);
        const lo = h.rng() < 0.5;
        const frac = lo ? 0.15 + h.rng() * 0.27 : 0.58 + h.rng() * 0.27;
        const mx = Number((T1 * frac).toFixed(2));
        let T2 = rnd(h, 10, 50, 2);
        if (Math.abs(T2 - T1) < 1) T2 = Number((T2 + 5).toFixed(2));
        const my1 = T1 - mx;
        const y = (my1 / T1) * T2;
        const f = (v) => `${v.toFixed(2)} g`;
        return {
          stem: `${T1.toFixed(2)} g of XY contains ${mx.toFixed(2)} g of X. Its other component is Y. How many grams of Y are in a second ${T2.toFixed(2)} g sample of XY?`,
          right: f(y), wrong: [f((mx / T1) * T2), f(my1), f(mx), f(T2 - mx)],
          explanation: `${law}\n\n    Y in the first sample = ${T1.toFixed(2)} g - ${mx.toFixed(2)} g = ${my1.toFixed(2)} g\n    mass fraction of Y = ${my1.toFixed(2)} / ${T1.toFixed(2)} = ${(my1 / T1).toFixed(4)}\n    Y in the new sample = ${(my1 / T1).toFixed(4)} × ${T2.toFixed(2)} g = ${f(y)}\n\n${f((mx / T1) * T2)} uses X's fraction instead of Y's. ${f(my1)} is Y in the FIRST sample, never scaled to ${T2.toFixed(2)} g. ${f(mx)} copies X's mass across.`,
        };
      }
      if (frame === 1) {
        const f = h.pick(DP_COMPOUNDS);
        const counts = parseFormula(f);
        let [A, B] = Object.keys(counts);
        if (h.rng() < 0.5) [A, B] = [B, A];
        const mA = el(A).mass * counts[A], mB = el(B).mass * counts[B];
        const a1 = measuredText(h, 2, 60, 3);
        const b1 = sf(Number(a1) * mB / mA, 3);
        const b2 = measuredText(h, 1, 40, 3);
        const ratio = Number(a1) / Number(b1);
        const a2 = Number(b2) * ratio;
        const g = (v) => `${sf(v, 3)} g`;
        return {
          stem: `A sample of ${sub(f)} contains ${a1} g of ${el(A).name} and ${b1} g of ${el(B).name}. How many grams of ${el(A).name} are in a different sample of ${sub(f)} that contains ${b2} g of ${el(B).name}?`,
          right: g(a2), wrong: [g(Number(b2) / ratio), g(Number(b2) * Number(a1) / (Number(a1) + Number(b1))), `${a1} g`, `${b2} g`],
          explanation: `${law} So the ${el(A).name} : ${el(B).name} mass ratio is the same in both samples.\n\n    ${el(A).name} / ${el(B).name} = ${a1} g / ${b1} g = ${sf(ratio, 4)}\n    ${el(A).name} in the new sample = ${b2} g × ${sf(ratio, 4)} = ${g(a2)}\n\n${g(Number(b2) / ratio)} uses the ratio upside down (${el(B).name} / ${el(A).name}). ${g(Number(b2) * Number(a1) / (Number(a1) + Number(b1)))} uses ${el(A).name}'s fraction of the WHOLE compound, but the ${b2} g is only the ${el(B).name}, not the whole sample. ${a1} g copies the first sample.`,
        };
      }
      const [P, Q] = h.pick([['A', 'B'], ['X', 'Z'], ['M', 'N'], ['D', 'E']]);
      const a = measuredText(h, 10, 90, 3);
      let b = measuredText(h, 10, 90, 3);
      if (Math.abs(Number(a) - Number(b)) < 3) b = (Number(b) + 7.5).toPrecision(3);
      let T = measuredText(h, 50, 400, 4);
      if (Math.abs(Number(T) - Number(a) - Number(b)) < 15) T = (Number(T) + 41.3).toPrecision(4);
      const askB = h.rng() < 0.5;
      const [mine, other] = askB ? [Number(b), Number(a)] : [Number(a), Number(b)];
      const who = askB ? Q : P;
      const ans = (mine / (mine + other)) * Number(T);
      const g = (v) => `${sf(v, 3)} g`;
      return {
        stem: `A compound ${P}${Q} contains ${a} g of ${P} and ${b} g of ${Q}. What mass of ${who} is present in a ${T} g sample of ${P}${Q}?`,
        right: g(ans), wrong: [g((other / (mine + other)) * Number(T)), g((mine / other) * Number(T)), g(Number(T) - mine), `${sf(mine, 3)} g`],
        explanation: `${law}\n\n    total of the first sample = ${a} g + ${b} g = ${sf(Number(a) + Number(b), 4)} g\n    fraction that is ${who} = ${sf(mine, 3)} / ${sf(Number(a) + Number(b), 4)} = ${sf(mine / (mine + other), 4)}\n    ${who} in ${T} g = ${sf(mine / (mine + other), 4)} × ${T} g = ${g(ans)}\n\nThe trap options use the OTHER element's fraction, divide one element by the other instead of by the total, or subtract the first sample's mass from the new sample.`,
      };
    },
  },
  {
    id: 'pne', section: '2-3', title: 'Protons, neutrons and electrons in an atom or ion',
    asked: ['ch12:16', 'ex1:2', 'ex2:14', 'si2:13', 'prep:22', 'prep:23', 'prep:25', 'prep:26', 'prep:30', 'ex4:11'],
    real: { src: 'ex4', q: 11, stem: 'How many neutrons are in a -3 ion of nitrogen 16?', answer: '9', p: { sym: 'N', A: 16, q: -3, ask: 'neutrons', given: 'words' } },
    gen(h, p) {
      let x;
      if (p) { const e = el(p.sym); x = { sym: p.sym, name: e.name, Z: e.z, A: p.A, N: p.A - e.z, q: p.q, e: e.z - p.q }; } else x = drawIsotope(h);
      const ask = p?.ask ?? h.pick(['neutrons', 'protons', 'electrons', 'all']);
      const given = p?.given ?? h.pick(['words', 'symbol']);
      const { sym, name, Z, A, N, q, e } = x;
      const what = given === 'symbol'
        ? `${sup(A)}${subNum(Z)}${sym}${q ? chargeSup(q) : ''}`
        : q === 0 ? `an atom of ${name}-${A}` : `a ${signed(q)} ion of ${name}-${A}`;
      const work = `Protons = atomic number = ${Z} (${name} is element ${Z}; the protons decide which element it is).\n    Neutrons = mass number - protons = ${A} - ${Z} = ${N}.\n    Electrons = protons - charge = ${Z} - (${signed(q)}) = ${e}${q === 0 ? ' (a neutral atom has as many electrons as protons)' : q < 0 ? ' (a negative ion GAINED electrons)' : ' (a positive ion LOST electrons)'}.`;
      let right, wrong;
      if (ask === 'all') {
        const t = (pp, nn, ee) => `${pp} protons, ${nn} neutrons, ${ee} electrons`;
        right = t(Z, N, e);
        wrong = others(right, [t(Z, A, e), t(Z, N, Z + q), t(N, Z, e), t(Z, N, Z), t(A, N, A), t(Z, A, Z)]);
      } else {
        const R = { neutrons: N, protons: Z, electrons: e }[ask];
        const cands = { neutrons: [A, Z, e, N - q, A + Z], protons: [e, N, A, Z + q], electrons: [Z, Z + q, N, A] }[ask];
        right = String(R);
        wrong = numWrong(R, cands);
      }
      return {
        stem: ask === 'all' ? `How many protons, neutrons and electrons are in ${what}?` : `How many ${ask} are in ${what}?`,
        right, wrong,
        explanation: `${work}\n\nThe usual mistakes: taking the mass number (${A}) as the number of neutrons, forgetting the charge when counting electrons, or moving the charge the wrong way (a ${q < 0 ? 'negative ion has MORE electrons than protons' : q > 0 ? 'positive ion has FEWER electrons than protons' : 'charged ion would differ, but this atom is neutral'}). The charge never changes the protons or the neutrons.`,
      };
    },
  },
  {
    id: 'nuclide-from-counts', section: '2-3', title: 'Identify the element or write the symbol from particle counts',
    asked: ['ex1:5', 'prep:21', 'prep:23', 'prep:24'],
    real: {
      src: 'prep', q: 21, stem: 'Write the symbol for the ion with 54 electrons, 53 protons, and 74 neutrons.', answer: '¹²⁷I⁻',
      p: { Z: 53, N: 74, e: 54, frame: 'symbol', order: ['e', 'p', 'n'] },
    },
    gen(h, p) {
      let Z, N, e, q;
      if (p) { ({ Z, N, e } = p); q = Z - e; } else ({ Z, N, e, q } = drawIsotope(h));
      const x = BY_Z[Z];
      const A = Z + N;
      const ch = q ? chargeSup(q) : '';
      const frame = p?.frame ?? h.pick(['symbol', 'symbol', 'identify']);
      const parts = { e: `${e} electrons`, p: `${Z} protons`, n: `${N} neutrons` };
      const order = p?.order ?? shuffled(h, ['e', 'p', 'n']);
      const list = `${parts[order[0]]}, ${parts[order[1]]}, and ${parts[order[2]]}`;
      const byE = e !== Z ? BY_Z[e] : null;
      const byN = N !== Z ? BY_Z[N] : null;
      const work = `The PROTONS identify the element: ${Z} protons is ${x.name} (${x.sym}).\n    Mass number = protons + neutrons = ${Z} + ${N} = ${A}.\n    Charge = protons - electrons = ${Z} - ${e} = ${signed(q)}${q === 0 ? ' (neutral)' : ''}.`;
      if (frame === 'symbol') {
        const right = `${sup(A)}${x.sym}${ch}`;
        const wrong = others(right, [
          q ? `${sup(A)}${x.sym}${chargeSup(-q)}` : null,
          `${sup(N)}${x.sym}${ch}`,
          byE ? `${sup(A)}${byE.sym}${ch}` : null,
          byN ? `${sup(A)}${byN.sym}${ch}` : null,
          `${sup(Z + e)}${x.sym}${ch}`,
          `${sup(Z)}${x.sym}${ch}`,
        ]);
        return {
          stem: `Write the symbol for the ${q ? 'ion' : 'atom'} with ${list}.`,
          right, wrong,
          explanation: `${work}\n\nSo the symbol is ${right}: mass number top-left, charge top-right.\n\nThe traps: ${q ? `flipping the charge sign (more electrons than protons means NEGATIVE), ` : ''}writing the neutron count (${N}) as the mass number, or choosing the element from the electron or neutron count instead of the protons.`,
        };
      }
      const nm = (y) => `${y.name} (${y.sym})`;
      const right = nm(x);
      const byA = BY_Z[A] ?? null;
      const wrong = others(right, [byE ? nm(byE) : null, byN ? nm(byN) : null, byA ? nm(byA) : null, ...nearestZ(Z, 3).map(nm)]);
      return {
        stem: `A particle has ${list}. Which element is it?`,
        right, wrong,
        explanation: `${work}\n\nOnly the proton count names the element. The electron count changes when an atom becomes an ion, and the neutron count changes between isotopes, so choosing the element by either of those is the trap.`,
      };
    },
  },
  {
    id: 'avg-mass-2', section: '2-3', title: 'Average atomic mass from two isotopes',
    asked: ['ex2:16', 'prep:27', 'prep:32', 'ex4:12'],
    real: {
      src: 'ex4', q: 12,
      stem: 'What is the average mass for hypothetical element X? ¹⁷X, with a mass of 17.00 units is 52.45% abundant and the only other isotope is ¹⁶X with a mass of 16.00 units.',
      answer: '16.52 units', p: { L: 'X', A1: 17, m1: '17.00', a1: '52.45', A2: 16, m2: '16.00' },
    },
    gen(h, p) {
      let stem, m1, m2, a1, a2, unit, label1, label2;
      if (p || h.rng() < 0.5) {
        const L = p?.L ?? h.pick(HYPO);
        const A1 = p?.A1 ?? h.int(6, 140);
        const A2 = p?.A2 ?? A1 + h.pick([1, 2, -1, -2]);
        m1 = p?.m1 ?? (A1 + rnd(h, -0.09, 0.09, 2)).toFixed(2);
        m2 = p?.m2 ?? (A2 + rnd(h, -0.09, 0.09, 2)).toFixed(2);
        let ab = rnd(h, 5, 95, 2);
        if (Math.abs(ab - 50) < 2) ab += 7;
        a1 = p?.a1 ?? ab.toFixed(2);
        a2 = (100 - Number(a1)).toFixed(2);
        unit = 'units'; label1 = `${sup(A1)}${L}`; label2 = `${sup(A2)}${L}`;
        stem = `What is the average mass for hypothetical element ${L}? ${label1}, with a mass of ${m1} units is ${a1}% abundant and the only other isotope is ${label2} with a mass of ${m2} units.`;
      } else {
        const r = h.pick(TWO_ISO);
        const e = el(r.sym);
        const [[A1, M1, P1], [A2, M2, P2]] = h.rng() < 0.5 ? r.iso : [r.iso[1], r.iso[0]];
        m1 = M1; m2 = M2; a1 = P1; a2 = P2; unit = 'amu';
        label1 = `${e.name}-${A1}`; label2 = `${e.name}-${A2}`;
        stem = `${cap(e.name)} has two naturally occurring isotopes: ${label1} (mass ${m1} amu, ${a1}% abundant) and ${label2} (mass ${m2} amu, ${a2}% abundant). What is the average atomic mass of ${e.name}?`;
      }
      const f1 = Number(a1) / 100, f2 = Number(a2) / 100;
      const avg = Number(m1) * f1 + Number(m2) * f2;
      const u = (v) => `${v.toFixed(2)} ${unit}`;
      const major = Number(a1) >= Number(a2) ? m1 : m2;
      return {
        stem,
        right: u(avg),
        wrong: [u((Number(m1) + Number(m2)) / 2), u(Number(m1) * f2 + Number(m2) * f1), u(avg * 100), u(Number(major)), u(Number(m1) + Number(m2))],
        explanation: `Average atomic mass is a WEIGHTED average: multiply each isotope's mass by its abundance written as a decimal, then add.\n\n    ${a2 === (100 - Number(a1)).toFixed(2) && unit === 'units' ? `the other isotope's abundance = 100% - ${a1}% = ${a2}%\n    ` : ''}(${m1} × ${f1.toFixed(4)}) + (${m2} × ${f2.toFixed(4)}) = ${(Number(m1) * f1).toFixed(4)} + ${(Number(m2) * f2).toFixed(4)} = ${u(avg)}\n\nThe plain average of the two masses (${u((Number(m1) + Number(m2)) / 2)}) ignores the abundances. Pairing each mass with the OTHER isotope's abundance gives ${u(Number(m1) * f2 + Number(m2) * f1)}. Using the percents without dividing by 100 gives a number 100 times too big. Sanity check: the answer must lie between the two masses, closer to the more abundant isotope.`,
      };
    },
  },
  {
    id: 'avg-mass-3', section: '2-3', title: 'Average atomic mass from three isotopes',
    asked: ['ex1:1', 'prep:29'],
    real: {
      src: 'ex1', q: 1,
      stem: 'Suppose an element has three naturally occurring isotopes. Isotope 1 has 2.00% abundance and mass 22.488 amu. Isotope 2 has 95.00 % abundance and mass 23.581 amu. Isotope 3 has mass 24.490 amu. What is the atomic mass for the element?',
      answer: '23.59 amu', p: { m: ['22.488', '23.581', '24.490'], a: ['2.00', '95.00'], infer: true },
    },
    gen(h, p) {
      let m, a, infer, stem;
      if (p) { m = p.m; a = [...p.a]; infer = p.infer; } else if (h.rng() < 0.35) {
        const r = h.pick(THREE_ISO);
        const e = el(r.sym);
        m = r.iso.map((i) => i[1]); a = r.iso.map((i) => i[2]);
        infer = h.rng() < 0.5;
        const lab = r.iso.map((i) => `${e.name}-${i[0]}`);
        stem = `${cap(e.name)} has three naturally occurring isotopes: ${lab[0]} (mass ${m[0]} amu, ${a[0]}% abundant), ${lab[1]} (mass ${m[1]} amu, ${a[1]}% abundant) and ${lab[2]} (mass ${m[2]} amu${infer ? ', the rest of the sample' : `, ${a[2]}% abundant`}). What is the average atomic mass of ${e.name}?`;
      } else {
        const A = h.int(10, 120);
        m = [0, 1, 2].map((k) => (A + k + rnd(h, -0.06, 0.06, 3)).toFixed(3));
        const d = h.int(0, 2);
        const minor = [rnd(h, 1, 15, 2), rnd(h, 1, 15, 2)];
        a = [0, 1, 2].map((k) => (k === d ? null : minor.shift().toFixed(2)));
        a[d] = (100 - a.reduce((s, x) => s + (x == null ? 0 : Number(x)), 0)).toFixed(2);
        infer = h.rng() < 0.6;
      }
      if (infer) a[2] = (100 - Number(a[0]) - Number(a[1])).toFixed(2);
      if (!stem) {
        stem = `Suppose an element has three naturally occurring isotopes. Isotope 1 has ${a[0]}% abundance and mass ${m[0]} amu. Isotope 2 has ${a[1]}% abundance and mass ${m[1]} amu. Isotope 3 has ${infer ? '' : `${a[2]}% abundance and `}mass ${m[2]} amu. What is the atomic mass for the element?`;
      }
      const M = m.map(Number), F = a.map((x) => Number(x) / 100);
      const avg = M[0] * F[0] + M[1] * F[1] + M[2] * F[2];
      const u = (v) => `${v.toFixed(2)} amu`;
      const two = M[0] * F[0] + M[1] * F[1];
      const major = M[F.indexOf(Math.max(...F))];
      const wrongThird = two + M[2] * (100 - Number(a[1])) / 100;
      return {
        stem,
        right: u(avg),
        wrong: [u((M[0] + M[1] + M[2]) / 3), u(two), u(avg * 100), infer ? u(wrongThird) : u(major), u(major), u(avg / 3), u(M[0] * F[2] + M[1] * F[1] + M[2] * F[0])],
        explanation: `${infer ? `First the missing abundance: the three must add to 100%, so isotope 3 = 100% - ${a[0]}% - ${a[1]}% = ${a[2]}%.\n\nThen the weighted` : 'The weighted'} average (each abundance as a decimal):\n\n    (${m[0]} × ${F[0].toFixed(4)}) + (${m[1]} × ${F[1].toFixed(4)}) + (${m[2]} × ${F[2].toFixed(4)})\n    = ${(M[0] * F[0]).toFixed(4)} + ${(M[1] * F[1]).toFixed(4)} + ${(M[2] * F[2]).toFixed(4)} = ${u(avg)}\n\n${u(two)} leaves out isotope 3${infer ? ' because its abundance was not printed' : ''}; ${u((M[0] + M[1] + M[2]) / 3)} is the plain average, which ignores abundance; forgetting to divide the percents by 100 gives a number 100 times too big. The answer must sit closest to the most abundant isotope's mass.`,
      };
    },
  },
  {
    id: 'abundance-backsolve', section: '2-3', title: 'Isotope abundance from the average atomic mass',
    asked: ['ch12:17', 'ex1:3', 'ex4:38'],
    real: {
      src: 'ex4', q: 38,
      stem: 'If naturally occurring chromium were made up of only 2 isotopes of Chromium-51 and Chromium-53 what would be the predicted ratio of the two isotopes in nature?',
      answer: '50% chromium-51 : 50% chromium-53 (a 1 : 1 ratio)', p: { sym: 'Cr', A1: 51, A2: 53 },
    },
    gen(h, p) {
      let e, A1, A2, m1, m2, frame;
      if (p) { e = el(p.sym); A1 = p.A1; A2 = p.A2; m1 = A1; m2 = A2; frame = 'mass-number'; } else if (h.rng() < 0.55) {
        const r = h.pick(TWO_ISO);
        e = el(r.sym);
        const iso = h.rng() < 0.5 ? r.iso : [r.iso[1], r.iso[0]];
        [A1, A2] = [iso[0][0], iso[1][0]];
        [m1, m2] = [Number(iso[0][1]), Number(iso[1][1])];
        frame = 'measured';
      } else {
        e = el(h.pick(['Cu', 'Zn', 'Ga', 'Ge', 'Se', 'Br', 'Rb', 'Mo', 'Ag', 'Cd', 'Sn', 'Sb', 'Ba', 'Pt', 'Hg', 'Pb', 'Ti', 'Ni', 'Mg', 'Si', 'Cl', 'Ca', 'K', 'Fe']));
        A1 = Math.floor(e.mass);
        if (Math.abs(e.mass - A1 - 1) < 0.05 || e.mass - A1 < 0.05) A1 -= 1;
        if (Math.abs(e.mass - (A1 + 1)) < 0.05) A1 -= 1;
        A2 = A1 + 2;
        if (h.rng() < 0.5) [A1, A2] = [A2, A1];
        m1 = A1; m2 = A2; frame = 'mass-number';
      }
      const M = e.mass;
      const x = (M - m2) / (m1 - m2);
      const p1 = x * 100, p2 = 100 - p1;
      const n1 = `${e.name}-${A1}`, n2 = `${e.name}-${A2}`;
      const trim = (v) => String(Number(v.toFixed(1)));
      const fmt = (q1) => (p ? `${trim(q1)}% ${n1} : ${trim(100 - q1)}% ${n2} (a ${Math.round(q1) / gcd(Math.round(q1), Math.round(100 - q1))} : ${Math.round(100 - q1) / gcd(Math.round(q1), Math.round(100 - q1))} ratio)` : `${q1.toFixed(1)}% ${n1}, ${(100 - q1).toFixed(1)}% ${n2}`);
      const dec = Math.round((M % 1) * 1000) / 10;
      const closer = Math.abs(M - m1) < Math.abs(M - m2) ? 100 : 0;
      const wrong = p
        ? [fmt(75), fmt(25), `${trim(100)}% chromium-52, since the average mass must itself be an isotope`]
        : [fmt(p2), frame === 'measured' ? fmt(((M - A2) / (A1 - A2)) * 100) : null, fmt(50), dec > 0 ? fmt(dec) : null, fmt(closer)].filter(Boolean);
      const stem = frame === 'measured'
        ? `${cap(e.name)} naturally occurs as a mixture of two isotopes: ${n1} with an atomic mass of ${m1.toFixed(3)} amu and ${n2} with an atomic mass of ${m2.toFixed(3)} amu. The periodic table lists ${e.name}'s average atomic mass as ${M} amu. What are the relative abundances of the two isotopes?`
        : `If naturally occurring ${e.name} were made up of only 2 isotopes, ${n1} and ${n2}, what would be the predicted ratio of the two isotopes in nature? (Use the periodic table's average atomic mass, ${M.toFixed(2)}, and take each isotope's mass as its mass number.)`;
      return {
        stem,
        right: fmt(p1),
        wrong,
        explanation: `Let x = the fraction that is ${n1}; then 1 - x is ${n2}. The weighted average must equal the periodic-table mass:\n\n    x(${m1}) + (1 - x)(${m2}) = ${M}\n    x = (${M} - ${m2}) / (${m1} - ${m2}) = ${x.toFixed(4)}\n\nSo ${trim(p1)}% ${n1} and ${trim(p2)}% ${n2}. Check: ${Math.abs(p1 - 50) < 0.05 ? `the average (${M}) sits exactly halfway between ${m1} and ${m2}, so the two isotopes are equally abundant` : `the average (${M}) sits closer to ${Math.abs(M - m1) < Math.abs(M - m2) ? n1 : n2}, so that isotope must be the more abundant one`}.\n\nThe swapped answer puts the bigger share on the isotope FARTHER from the average. Reading the decimal part of the atomic mass as a percent, or assuming 50 : 50, skips the algebra entirely.`,
      };
    },
  },
  {
    id: 'atomic-mass-from-ratio', section: '2-3', title: 'Atomic mass of X from a combining-mass ratio, then identify X',
    asked: ['ch12:20', 'prep:28'],
    real: { from: 'ch12', idx: 19 },
    gen(h) {
      const [sym, a, b] = h.pick(OXIDES);
      const x = el(sym);
      const mStr = sf((a * x.mass) / (b * 16.0), 4);
      const m = Number(mStr);
      const calc = (m * b * 16.0) / a;
      const lab = (v, y) => `${y ? y.mass : sf(v, 3)} u — ${(y ?? nearestMass(v, x.sym)).name} (${(y ?? nearestMass(v, x.sym)).sym})`;
      const oneToOne = m * 16.0;
      const inverted = (m * a * 16.0) / b;
      const right = `${x.mass} u — ${x.name} (${x.sym})`;
      const wrong = others(right, [...(a === b ? [] : [lab(oneToOne), lab(inverted)]), ...nearestZ(x.z, 3).map((y) => lab(y.mass, y))]);
      return {
        stem: `A certain element X forms a compound with oxygen in which there ${a === 1 ? 'is one atom' : `are ${WORDS[a]} atoms`} of X for every ${b === 1 ? 'one atom' : `${WORDS[b]} atoms`} of O. In this compound, ${mStr} g of X are combined with 1.000 g of oxygen. Use the average atomic mass of oxygen to calculate the average atomic mass of X. Use your calculated atomic mass to identify the element X.`,
        right, wrong,
        explanation: `The formula is X${a > 1 ? subNum(a) : ''}O${b > 1 ? subNum(b) : ''}, so the ATOM ratio is ${a} X : ${b} O. Work in moles, because a formula is a ratio of atoms, not of grams.\n\n    mol O = 1.000 g / 16.00 g/mol = 0.06250 mol\n    mol X = 0.06250 mol O × (${a} X / ${b} O) = ${sf(0.0625 * a / b, 4)} mol\n    atomic mass of X = ${mStr} g / ${sf(0.0625 * a / b, 4)} mol = ${sf(calc, 4)} g/mol\n\n${sf(calc, 4)} u matches ${x.name} (${x.mass} u on the periodic table).\n\n${a === b ? 'Here the ratio happens to be 1 : 1, so skipping it changes nothing, but read the formula first every time.' : `Skipping the atom ratio (treating it as 1 : 1) gives ${sf(oneToOne, 3)} u; turning the ratio upside down gives ${sf(inverted, 3)} u.`}`,
      };
    },
  },
  {
    id: 'isoelectronic-pair', section: '2-3', title: 'Which pair has the same number of electrons',
    asked: ['ex1:8'],
    real: {
      src: 'ex1', q: 8, stem: 'Which pair of particles has the same number of electrons?',
      choices: ['F⁻, Mg²⁺', 'Ne, Ar', 'Br⁻, Se', 'Al³⁺, P³⁻'], answer: 'F⁻, Mg²⁺',
      explanation: 'Electrons = atomic number - charge.\n\n    F⁻: 9 + 1 = 10      Mg²⁺: 12 - 2 = 10   -> same (both have neon\'s 10)\n    Ne: 10              Ar: 18\n    Br⁻: 35 + 1 = 36    Se: 34 (a neutral atom)\n    Al³⁺: 13 - 3 = 10   P³⁻: 15 + 3 = 18\n\nF⁻ and Mg²⁺ are ISOELECTRONIC. "Br⁻, Se" is the trap: Se would need to be Se²⁻ to have 36 electrons. "Al³⁺, P³⁻" has two ions with the same SIZE of charge, but one lost 3 electrons and the other gained 3.',
    },
    gen(h) {
      const sp = SPECIES.map(([s, q]) => ({ s, q, e: el(s).z - q, t: ion(s, q) }));
      const pairText = (x, y) => `${x.t}, ${y.t}`;
      const count = (x) => (x.q ? `${x.t}: ${el(x.s).z} ${x.q > 0 ? '-' : '+'} ${Math.abs(x.q)} = ${x.e}` : `${x.t}: ${x.e} (a neutral atom)`);
      let a, b;
      for (;;) {
        a = h.pick(sp);
        const mates = sp.filter((y) => y.e === a.e && y.t !== a.t);
        if (mates.length) { b = h.pick(mates); break; }
      }
      if (h.rng() < 0.5) {
        const right = pairText(a, b);
        const wrongPairs = [];
        const usedT = new Set([right]);
        const add = (x, y) => { const t = pairText(x, y); if (x.e !== y.e && x.t !== y.t && !usedT.has(t)) { usedT.add(t); wrongPairs.push([x, y]); } };
        const atom = sp.find((y) => y.s === b.s && y.q === 0) ?? { s: b.s, q: 0, e: el(b.s).z, t: b.s };
        add(a, atom);
        for (let t = 0; t < 60 && wrongPairs.length < 3; t++) {
          const x = h.pick(sp), y = h.pick(sp);
          if (t < 30 && Math.sign(x.q) === Math.sign(y.q)) continue;
          add(x, y);
        }
        const opts = shuffled(h, [[a, b], ...wrongPairs]);
        return {
          stem: `Which pair of particles has the same number of electrons: ${opts.map(([x, y]) => `${x.t} and ${y.t}`).join('; ')}?`,
          right, wrong: wrongPairs.map(([x, y]) => pairText(x, y)),
          explanation: `Electrons = atomic number - charge (a negative charge ADDS electrons).\n\n${opts.map(([x, y]) => `    ${count(x)};  ${count(y)}`).join('\n')}\n\nOnly ${a.t} and ${b.t} match (${a.e} electrons each), so they are ISOELECTRONIC. Same-sized charges, or neighbouring elements, do not mean the same electron count.`,
        };
      }
      const right = b.t;
      const wrongSp = [];
      const add = (y) => { if (y && y.e !== a.e && y.t !== a.t && !wrongSp.some((w) => w.t === y.t)) wrongSp.push(y); };
      if (a.q) add({ s: a.s, q: 0, e: el(a.s).z, t: a.s });
      add(sp.find((y) => y.s === b.s && y.q !== b.q));
      add(sp.find((y) => y.e === a.e + 8 && y.q === b.q) ?? sp.find((y) => y.e === a.e - 8));
      for (let t = 0; t < 60 && wrongSp.length < 4; t++) add(h.pick(sp));
      return {
        stem: `Which particle has the same number of electrons as ${a.t}?`,
        right, wrong: wrongSp.map((y) => y.t),
        explanation: `Electrons = atomic number - charge.\n\n    ${count(a)}\n    ${count(b)}   <- same\n${wrongSp.slice(0, 3).map((y) => `    ${count(y)}`).join('\n')}\n\nThe charge is the whole point: a neutral atom of the same element, or an ion of a neighbouring element with the wrong charge, has a different electron count.`,
      };
    },
  },
  {
    id: 'diatomic', section: '2-4', title: 'Diatomic elements',
    asked: ['ch12:5', 'ex1:4', 'prep:2'],
    real: {
      src: 'ex1', q: 4, stem: 'Which group number contains the most diatomic molecular elements?',
      choices: ['Group 1', 'Group 16', 'Group 17', 'Group 18'], answer: 'Group 17',
      explanation: 'Seven elements exist in nature as diatomic molecules: H₂, N₂, O₂, F₂, Cl₂, Br₂ and I₂. Four of them, F₂, Cl₂, Br₂ and I₂, are the halogens in GROUP 17.\n\n    Group 1: only hydrogen (H₂), and hydrogen is not an alkali metal; Li, Na, K... are metals.\n    Group 16: only oxygen (O₂); sulfur exists as S₈ rings and selenium as chains, which are polyatomic, not diatomic.\n    Group 18: the noble gases exist as single atoms (monatomic), He, Ne, Ar.\n\nMemory aid for the seven: "Have No Fear Of Ice Cold Beer" (H, N, F, O, I, Cl, Br).',
    },
    gen(h) {
      const frame = h.int(0, 2);
      const nm = (s) => `${el(s).name} (${s})`;
      const rule = 'Seven elements exist in nature as diatomic molecules: H₂, N₂, O₂, F₂, Cl₂, Br₂ and I₂ ("Have No Fear Of Ice Cold Beer"). Noble gases are single atoms; phosphorus (P₄) and sulfur (S₈) are POLYatomic, not diatomic; metals are lattices of atoms; carbon and silicon are covalent network solids.';
      if (frame === 0) {
        const s = h.pick(Object.keys(FORM_OF));
        const k = FORM_OF[s];
        const opt = (kk) => FORMS[kk](s);
        const right = opt(k);
        const wrong = shuffled(h, Object.keys(FORMS).filter((kk) => kk !== k)).map(opt);
        return {
          stem: `In a sample of pure ${el(s).name} at room temperature, how are its atoms present?`,
          right, wrong,
          explanation: `Pure ${el(s).name} exists ${right}.\n\n${rule}`,
        };
      }
      const want = frame === 1;
      const [inPool, outPool] = want ? [DIATOMIC, NOT_DIATOMIC] : [NOT_DIATOMIC, DIATOMIC];
      const r = h.pick(inPool);
      const w = shuffled(h, outPool).slice(0, 3);
      const opts = shuffled(h, [r, ...w]).map(nm);
      return {
        stem: want
          ? `Which of the following elements exists in nature as diatomic molecules: ${opts.join(', ')}?`
          : `Which of the following elements is NOT diatomic in nature: ${opts.join(', ')}?`,
        right: nm(r), wrong: w.map(nm),
        explanation: `${cap(nm(r))} is the only one that ${want ? 'is' : 'is not'} diatomic. ${rule}`,
      };
    },
  },
  {
    id: 'ion-charge-from-group', section: '2-5', title: 'Charge of the ion an element forms',
    asked: ['ex1:12', 'prep:23b'],
    real: {
      src: 'ex1', q: 12, stem: 'Alkaline earth metals form', choices: ['+1 ions', '+2 ions', '+3 ions', '-1 ions'], answer: '+2 ions',
      explanation: 'The alkaline earth metals are GROUP 2 (Be, Mg, Ca, Sr, Ba). Each atom has 2 valence electrons and LOSES both to reach the electron count of the noble gas before it, so it forms a 2+ ion: Mg²⁺, Ca²⁺.\n\nThe pattern for main-group elements: metals lose electrons (group 1 -> +1, group 2 -> +2, group 13 -> +3); nonmetals gain electrons to reach 8 (group 15 -> -3, group 16 -> -2, group 17 -> -1). +1 is the alkali metals (group 1), +3 is aluminum\'s group, -1 is the halogens.',
    },
    gen(h) {
      const famRule = 'Main-group metals LOSE their valence electrons (group 1 -> +1, group 2 -> +2, group 13 -> +3). Nonmetals GAIN electrons until they have 8 valence electrons (group 15 -> -3, group 16 -> -2, group 17 -> -1). Either way the ion ends up with the electron count of the nearest noble gas.';
      if (h.rng() < 0.45) {
        const f = h.pick(FAMILIES);
        const right = `${signed(f.q)} ions`;
        const v = f.q > 0 ? f.q : f.q + 8;
        const wrong = others(right, [-f.q, v !== f.q ? v : null, f.q > 0 ? f.q + 1 : f.q - 1, f.q > 0 ? f.q - 1 : f.q + 1, -v, f.q > 0 ? f.q + 2 : f.q - 2].filter((x) => x != null && x !== 0).map((x) => `${signed(x)} ions`));
        return {
          stem: `${f.name} form`, right, wrong,
          explanation: `${f.name} are in group ${f.group}: ${f.why}\n\n${famRule}`,
        };
      }
      const e = el(h.pick(ION_ELEMENTS));
      const q = mainCharge(e), v = valence(e);
      const right = ion(e.sym, q);
      const wrong = others(right, [-q, v, -v, v - 8, q + (q > 0 ? 1 : -1), q - (q > 0 ? 1 : -1)].filter((x) => x !== 0).map((x) => ion(e.sym, x)));
      return {
        stem: `Use the periodic table to write the symbol for the ion that ${e.name} forms.`,
        right, wrong,
        explanation: `${cap(e.name)} is in group ${e.group}, so it has ${v} valence electron${v === 1 ? '' : 's'}. ${q > 0 ? `As a metal it LOSES ${q} electron${q === 1 ? '' : 's'}, giving ${right}.` : `As a nonmetal it GAINS ${-q} electron${q === -1 ? '' : 's'} to reach 8, giving ${right}.`}\n\nThe traps: the right size of charge with the wrong sign, or using the number of valence electrons (${v}) as the charge.\n\n${famRule}`,
      };
    },
  },
  {
    id: 'classify-element', section: '2-5', title: 'Metal/nonmetal and main-group/transition/inner transition',
    asked: ['ex1:16', 'prep:31'],
    real: {
      src: 'ex1', q: 16,
      stem: 'Classify rhenium as a metal or nonmetal, then classify it as a main-group (representative) element, transition metal, or inner transition metal.',
      answer: 'metal, transition metal', p: { sym: 'Re' },
    },
    gen(h, p) {
      const pool = ELEMENTS.filter((e) => e.metal !== 'metalloid');
      const kind = h.pick(['main-group element', 'transition metal', 'inner transition metal']);
      const e = p ? el(p.sym) : h.pick(pool.filter((x) => x.kind === kind));
      const ans = (m, k) => `${m}, ${k}`;
      const right = ans(e.metal, e.kind);
      const flip = e.metal === 'metal' ? 'nonmetal' : 'metal';
      const kinds = ['main-group element', 'transition metal', 'inner transition metal'].filter((k) => k !== e.kind);
      const wrong = [ans(e.metal, kinds[0]), ans(e.metal, kinds[1]), ans(flip, e.kind), ans(flip, kinds[0])];
      const where = e.kind === 'transition metal'
        ? `group ${e.group}, the d block in the middle of the table, so it is a transition metal, and every transition metal is a metal`
        : e.kind === 'inner transition metal'
          ? `the f block (the two rows printed below the table, the lanthanides and actinides), so it is an inner transition metal, which is a metal`
          : `group ${e.group}, an s- or p-block column (groups 1, 2 and 13-18), so it is a main-group (representative) element; it sits ${e.metal === 'metal' ? 'to the LEFT of the metal/nonmetal staircase, so it is a metal' : (e.sym === 'H' ? 'at the top of group 1 but is a nonmetal gas, the one exception in that column' : 'to the RIGHT of the metal/nonmetal staircase, so it is a nonmetal')}`;
      return {
        stem: `Classify ${e.name} as a metal or nonmetal, then classify it as a main-group (representative) element, transition metal, or inner transition metal.`,
        right, wrong,
        explanation: `${cap(e.name)} (${e.sym}, element ${e.z}) is in ${where}.\n\nAnswer: ${right}. Main-group = groups 1, 2, 13-18; transition metals = groups 3-12; inner transition metals = the lanthanide and actinide rows. Only main-group elements can be nonmetals.`,
      };
    },
  },
  {
    id: 'element-from-cation-electrons', section: '2-5', title: "Identify a metal from its salt formula and its cation's electron count",
    asked: ['ex2:22', 'si2:22', 'sample2:16'],
    real: {
      src: 'sample2', q: 16, stem: 'Element X forms a bromide salt with a formula of XBr₂. What is element X if its cation has 36 electrons?',
      choices: ['Sr', 'Ba', 'Ca', 'Mg'], answer: 'Sr', p: { sym: 'Sr', f: 'XBr2' },
    },
    gen(h, p) {
      const salt = p ? SALTS.find((s) => s.f === p.f) : h.pick(SALTS);
      const x = el(p ? p.sym : h.pick(SALT_METALS[salt.q]));
      const eCount = x.z - salt.q;
      const right = x.sym;
      const neighbours = ELEMENTS.filter((y) => y.group === x.group && y.z !== x.z && y.kind === x.kind).sort((a, b) => Math.abs(a.z - x.z) - Math.abs(b.z - x.z)).slice(0, 2);
      const wrong = others(right, [BY_Z[eCount]?.sym, BY_Z[eCount - salt.q]?.sym, ...neighbours.map((y) => y.sym), ...nearestZ(x.z, 2).map((y) => y.sym)]);
      const an = anion(salt.word);
      return {
        stem: `Element X forms ${/^[aeiou]/.test(salt.word) ? 'an' : 'a'} ${salt.word} salt with a formula of ${sub(salt.f)}. What is element X if its cation has ${eCount} electrons?`,
        right, wrong,
        explanation: `Step 1, the cation's charge from the formula: ${salt.word} is ${ion(an.f, an.q)}. ${sub(salt.f)} must be neutral, so ${salt.nX} × (charge of X) = ${salt.nA} × ${Math.abs(an.q)}, which makes X a ${signed(salt.q)} ion.\n\nStep 2, protons: a ${signed(salt.q)} ion has LOST ${salt.q} electron${salt.q === 1 ? '' : 's'}, so protons = ${eCount} + ${salt.q} = ${x.z}. Element ${x.z} is ${x.name} (${x.sym}).\n\n${BY_Z[eCount] ? `${BY_Z[eCount].sym} (element ${eCount}) forgets that the ion lost electrons. ` : ''}${BY_Z[eCount - salt.q] ? `${BY_Z[eCount - salt.q].sym} subtracts the charge instead of adding it. ` : ''}${neighbours.length ? `${neighbours.map((y) => y.sym).join(' and ')} ${neighbours.length > 1 ? 'are' : 'is'} in the same group, so ${neighbours.length > 1 ? 'they form' : 'it forms'} the same kind of salt, but with a different electron count.` : ''}`,
      };
    },
  },
  {
    id: 'ionic-vs-molecular', section: '2-6', title: 'Ionic or molecular (covalent) compound',
    asked: ['ch12:23', 'ex1:15', 'prep:31', 'prep:36', 'prep:26', 'prep:25'],
    real: { from: 'ch12', idx: 22 },
    gen(h) {
      const frame = h.int(0, 2);
      const rule = 'Metal + nonmetal -> IONIC. Nonmetals only -> MOLECULAR (covalent). The exception to remember: anything with the ammonium ion, NH₄⁺, is ionic even though it has no metal.';
      if (frame < 2) {
        const wantIonic = frame === 0;
        const r = h.pick(wantIonic ? IONIC_CPDS : MOLECULAR_CPDS);
        const w = shuffled(h, wantIonic ? MOLECULAR_CPDS : IONIC_CPDS).slice(0, 3);
        const opts = shuffled(h, [r, ...w]).map(sub);
        return {
          stem: `Which of the following is ${wantIonic ? 'an ionic' : 'a molecular'} compound: ${opts.join(', ')}?`,
          right: sub(r), wrong: w.map(sub),
          explanation: `${sub(r)} is ${wantIonic ? (r.includes('NH4') ? 'ionic: it contains the ammonium ion, NH₄⁺, a polyatomic CATION' : 'ionic: it contains a metal') : 'molecular: every element in it is a nonmetal'}. ${w.map(sub).join(', ')} ${wantIonic ? 'contain only nonmetals' : (w.some((c) => c.includes('NH4')) ? 'each contain a metal or the ammonium ion' : 'each contain a metal')}, so they are ${wantIonic ? 'molecular' : 'ionic'}.\n\n${rule}`,
        };
      }
      const pick = h.pick([...BIN_IONIC.map((f) => [f, 'I']), ...MOLECULAR_CPDS.map((f) => [f, 'C']), ...AMMONIUM.map((f) => [f, 'N'])]);
      const [f, k] = pick;
      const right = BOND_OPT[k];
      return {
        stem: `Using the periodic table, predict whether ${sub(f)} is ionic or covalent.`,
        right, wrong: Object.values(BOND_OPT).filter((o) => o !== right),
        explanation: `${sub(f)}: ${k === 'I' ? 'a metal bonded to a nonmetal, so electrons are transferred and it is IONIC' : k === 'C' ? 'only nonmetals, so electrons are shared and it is COVALENT (molecular)' : 'no metal, but NH₄⁺ is a polyatomic cation, so the compound is IONIC. "Only nonmetals" is the trap here'}.\n\n${rule} "Metallic" bonding is only for a metal on its own or an alloy.`,
      };
    },
  },
  {
    id: 'molecular-name-to-formula', section: '2-6', title: 'Formula from a molecular (prefix) name',
    asked: ['ch12:18', 'ex1:6', 'ex1:13', 'si2:5', 'prep:56'],
    real: { src: 'ex1', q: 13, stem: 'Write the formula for diphosphorus pentoxide', answer: 'P₂O₅', p: { c: ['P', 2, 'O', 5] } },
    gen(h, p) {
      const [a, na, b, nb] = p ? p.c : h.pick(MOLEC);
      const name = molecularName(a, na, b, nb);
      const right = sub(molF(a, na, b, nb));
      const wrong = others(right, [molF(a, nb, b, na), molF(a, 1, b, nb), molF(a, na, b, 1), molF(a, na, b, nb + 1), nb > 1 ? molF(a, na, b, nb - 1) : null, molF(a, na + 1, b, nb)].filter(Boolean).map(sub));
      return {
        stem: `Write the formula for ${name}`,
        right, wrong,
        explanation: `Two nonmetals make a MOLECULAR compound, and its prefixes ARE the subscripts. Nothing is crossed and no charges are used.\n\n    ${name}: ${na === 1 ? `no prefix on ${el(a).name} = 1` : `${PREFIX[na]}- = ${na} ${el(a).name}`}, ${PREFIX[nb]}- = ${nb} ${el(b).name}  ->  ${right}\n\n(mono- is left off the first element, and the a or o of a prefix is dropped before "oxide".) Swapping the two subscripts, dropping one, or misremembering a prefix (mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, octa 8, nona 9, deca 10) gives the wrong options.`,
      };
    },
  },
  {
    id: 'molecular-formula-to-name', section: '2-6', title: 'Name a binary molecular compound',
    asked: ['prep:34', 'ex1:15'],
    real: {
      src: 'prep', q: 34, stem: 'Name this compound: P₄O₆',
      choices: ['Diphosphorus dioxide', 'Phosphorus oxygen', 'Tetraphosphorus hexaoxide', 'Phosphorus oxide'], answer: 'Tetraphosphorus hexaoxide',
      explanation: 'P₄O₆ is two NONMETALS, so it is a molecular compound and is named with prefixes that state every count:\n\n    P₄ -> tetra- + phosphorus = tetraphosphorus\n    O₆ -> hexa- + oxide = hexaoxide (also written hexoxide; the a may be dropped before "oxide")\n\n    -> tetraphosphorus hexaoxide\n\n"Phosphorus oxide" leaves out the prefixes, which is how IONIC compounds are named; "Phosphorus oxygen" also forgets that the second element takes the -ide ending; "Diphosphorus dioxide" uses the wrong counts.',
    },
    gen(h) {
      const [a, na, b, nb] = h.pick(MOLEC);
      const right = molecularName(a, na, b, nb);
      const first = el(a).name, root = ROOT2[b];
      // The first element's real oxidation state: a numeral equal to it would be a defensible Stock name, so it is never offered.
      const ox = (nb * ({ O: 2, S: 2, Se: 2, N: 3 }[b] ?? 1)) / na;
      const wrong = others(right, [
        `${first} ${root}`,
        na === 1 ? `mono${first} ${withPrefix(nb, root)}` : null,
        nb !== ox && ROMAN[nb] ? `${first}(${ROMAN[nb]}) ${root}` : null,
        molecularName(a, nb, b, na),
        nb < 10 ? molecularName(a, na, b, nb + 1) : null,
        `${first} ${el(b).name}`,
      ]);
      return {
        stem: `Name this compound: ${sub(molF(a, na, b, nb))}`,
        right, wrong,
        explanation: `Both elements are NONMETALS, so this is a molecular compound: name it with prefixes for the number of each atom, and give the second element the -ide ending.\n\n    ${na === 1 ? `one ${first} (mono- is never used on the FIRST element)` : `${na} ${first} -> ${PREFIX[na]}${first}`}\n    ${nb} ${el(b).name} -> ${withPrefix(nb, root)}\n\n    -> ${right}\n\nLeaving the prefixes off, or adding a Roman numeral, is IONIC naming and does not apply to two nonmetals.`,
      };
    },
  },
  {
    id: 'ionic-name-to-formula', section: '2-7', title: 'Formula of an ionic compound from its name',
    asked: ['ch12:19', 'si2:5', 'si2:25', 'prep:24', 'prep:32', 'prep:33'],
    real: { src: 'si2', q: 25, stem: 'What is the formula of titanium (IV) phosphate?', answer: 'Ti₃(PO₄)₄', p: { cat: ['Ti', 4], an: 'phosphate' } },
    gen(h, p) {
      const [cat, an] = p ? [cation(p.cat[0], p.cat[1]), anion(p.an)] : h.pick(ionicPairs());
      const { nc, na } = ionCounts(cat, an);
      const right = sub(ionicFormula(cat, an));
      const other = cat.v ? CATIONS.find((c) => c.f === cat.f && c.q !== cat.q) : null;
      const partner = PARTNER[an.name] ? anyAnion(PARTNER[an.name]) : null;
      const wrong = others(right, [
        partF(cat, 1) + partF(an, 1),
        partF(cat, na) + partF(an, nc),
        an.poly && na > 1 ? `${partF(cat, nc)}${an.f}${na}` : cat.poly && nc > 1 ? `${cat.f}${nc}${partF(an, na)}` : null,
        partF(cat, 1) + partF(an, cat.q),
        partF(cat, -an.q) + partF(an, cat.q),
        other ? ionicFormula(other, an) : null,
        partner ? ionicFormula(cat, partner) : null,
        partF(cat, nc) + partF(an, na + 1),
        partF(cat, nc + 1) + partF(an, na),
        partF(cat, nc * 2) + partF(an, na * 2),
      ].filter(Boolean).map(sub));
      return {
        stem: `What is the formula of ${ionicName(cat, an)}?`,
        right, wrong,
        explanation: `Write each ion with its charge, then use the smallest numbers that make the total charge zero.\n\n    ${cationName(cat)} = ${ion(sub(cat.f), cat.q)}${cat.v ? ` (the Roman numeral ${ROMAN[cat.q]} IS the charge)` : ''}\n    ${an.name} = ${ion(sub(an.f), an.q)}\n    ${nc} × (${signed(cat.q)}) + ${na} × (${an.q}) = 0  ->  ${right}\n\n${an.poly && na > 1 ? `The parentheses keep ${sub(an.f)} together as one ion; without them the subscript ${na} would only multiply the last atom. ` : ''}${cat.v ? `The Roman numeral is the charge, not a subscript. ` : ''}Writing one of each ion ignores the charges, and swapping the counts gives the wrong total charge.`,
      };
    },
  },
  {
    id: 'ionic-formula-to-name', section: '2-7', title: 'Name an ionic compound (Stock system)',
    asked: ['ch12:21', 'ch12:22', 'ex2:13', 'ex1:15', 'prep:30', 'prep:37', 'prep:39', 'ex4:10'],
    real: {
      src: 'ex4', q: 10, stem: 'Name the following ionic compound OsC', answer: 'osmium(IV) carbide',
      choices: ['osmium(IV) carbide', 'osmium carbide', 'osmium(I) carbide', 'osmium monocarbide'],
      explanation: 'Carbide is C⁴⁻ (carbon gains 4 electrons to reach 8). One Os balances one C⁴⁻, so osmium must be +4 -> osmium(IV) carbide.\n\nOsmium is a transition metal with more than one possible charge, so its name MUST carry a Roman numeral, and the numeral is the CHARGE you work out from the anion, not the subscript (there is no subscript here, which is where "osmium(I)" comes from). "Osmium carbide" leaves out the required numeral, and "osmium monocarbide" uses a prefix, which is only for molecular compounds of two nonmetals.',
    },
    gen(h) {
      const pairs = ionicPairs();
      const pool = h.rng() < 0.6 ? pairs.filter(([c]) => c.v) : pairs.filter(([c]) => !c.v);
      const [cat, an] = h.pick(pool);
      const { nc, na } = ionCounts(cat, an);
      const f = ionicFormula(cat, an);
      const right = ionicName(cat, an);
      const other = cat.v ? CATIONS.find((c) => c.f === cat.f && c.q !== cat.q) : null;
      const partner = PARTNER[an.name];
      const prefixed = `${nc > 1 ? PREFIX[nc] : ''}${cat.name} ${withPrefix(na, an.name)}`;
      const wrong = others(right, [
        cat.v ? `${cat.name} ${an.name}` : `${cat.name}(${ROMAN[cat.q]}) ${an.name}`,
        `${cat.name}(${ROMAN[nc]}) ${an.name}`,
        `${cat.name}(${ROMAN[na]}) ${an.name}`,
        other ? `${cat.name}(${ROMAN[other.q]}) ${an.name}` : null,
        partner ? `${cationName(cat)} ${partner}` : null,
        prefixed,
        !partner ? `${cationName(cat)} ${endingSwap(an.name)}` : null,
      ]);
      const total = na * an.q;
      return {
        stem: `Name the following ionic compound ${sub(f)}`,
        right, wrong,
        explanation: `${cat.v
          ? `${cap(cat.name)} can have more than one charge, so the name needs a Roman numeral, and you must work the charge out from the anion:\n\n    ${an.name} is ${ion(sub(an.f), an.q)}; ${na} of them = ${total}\n    so ${nc} ${cat.name} = ${signed(-total)}, and each is ${signed(cat.q)}  ->  ${right}\n\nThe numeral is the CHARGE, never a copy of a subscript.`
          : `${cap(cat.name)} only ever forms ${ion(sub(cat.f), cat.q)}, so its name takes NO Roman numeral: ${right}.`}\n\nPrefixes (mono-, di-, tri-) are for molecular compounds of two nonmetals only, never ionic ones. Check the anion ending too: ${an.name}${partner ? ` and ${partner} are different ions` : ' is the ion here'}.`,
      };
    },
  },
  {
    id: 'acid-name', section: '2-7', title: 'Name an acid from its formula',
    asked: ['ch12:9', 'ex1:17', 'prep:35'],
    real: { from: 'ch12', idx: 8 },
    gen(h) {
      const x = h.pick(ACIDS);
      return {
        stem: `What is the name of this acid ${sub(x.f)}`,
        right: x.name, wrong: x.wn,
        explanation: `${sub(x.f)} comes from the ${x.an} ion, so it is ${x.name}.\n\n${ACID_RULE}\n\nA "hydrogen ___" name is not an acid name: it names an ion (hydrogen carbonate is HCO₃⁻) or the pure compound, not the acid dissolved in water.`,
      };
    },
  },
  {
    id: 'acid-formula', section: '2-7', title: 'Formula of an acid from its name',
    asked: ['ex2:11', 'ex4:8'],
    real: { src: 'ex4', q: 8, stem: 'What is the chemical formula for sulfurous acid?', answer: 'H₂SO₃', p: { name: 'sulfurous acid' } },
    gen(h, p) {
      const x = p ? ACIDS.find((a) => a.name === p.name) : h.pick(ACIDS.filter((a) => a.wf));
      return {
        stem: `What is the chemical formula for ${x.name}?`,
        right: sub(x.f), wrong: x.wf.map(sub),
        explanation: `${cap(x.name)} comes from the ${x.an} ion: ${x.kind === 'binary' ? 'hydro-___-ic means an -ide anion with NO oxygen' : x.kind === 'ate' ? '-ic acid means the -ate anion' : '-ous acid means the -ite anion'}. Add enough H⁺ to cancel the anion's charge -> ${sub(x.f)}.\n\n${ACID_RULE}`,
      };
    },
  },
  {
    id: 'atoms-in-formula', section: '2-6', title: 'Count atoms in a formula with parentheses or a hydrate',
    asked: ['prep:28', 'prep:29'],
    real: {
      src: 'prep', q: 28, stem: 'How many atoms of O are represented in the following expression? 2CuSO₄·5H₂O',
      choices: ['5', '18', '10', '8'], answer: '18',
      explanation: 'The 2 in front multiplies EVERYTHING after it, including the waters: 2CuSO₄·5H₂O means 2 × (CuSO₄·5H₂O).\n\n    O in one CuSO₄·5H₂O = 4 (in SO₄) + 5 × 1 (in the five H₂O) = 9\n    O in two of them = 2 × 9 = 18\n\n8 forgets the water (2 × 4), 10 counts only the waters (2 × 5), and 5 counts only the waters of one unit.',
    },
    gen(h) {
      const f = h.pick(COUNT_FORMULAS);
      const coef = h.int(1, 4);
      const disp = `${coef > 1 ? coef : ''}${sub(f)}`;
      const base = parseFormula(f);
      const noParen = parseFormula(f.replace(/\)(\d+)/g, ')'));
      const noWater = parseFormula(f.split('·')[0]);
      const total = (o) => Object.values(o).reduce((s, n) => s + n, 0);
      const askTotal = h.rng() < 0.3;
      const tricky = Object.keys(base).filter((k) => noParen[k] !== base[k] || noWater[k] !== base[k]);
      const sym = tricky.length && h.rng() < 0.75 ? h.pick(tricky) : h.pick(Object.keys(base));
      const cnt = (o) => (askTotal ? total(o) : o[sym] ?? 0);
      const right = coef * cnt(base);
      const hydrate = f.includes('·');
      const wrong = numWrong(right, [cnt(base), coef * cnt(noParen), hydrate ? coef * cnt(noWater) : null, cnt(noParen), hydrate ? cnt(noWater) : null]);
      return {
        stem: askTotal ? `How many atoms in total are represented in the following expression? ${disp}` : `How many atoms of ${sym} are represented in the following expression? ${disp}`,
        right: String(right), wrong,
        explanation: `A subscript multiplies the atom (or the parenthesised group) right before it; a coefficient in front multiplies the WHOLE formula${hydrate ? ', including the water after the dot' : ''}.\n\n    ${askTotal ? 'atoms' : `${sym} atoms`} in one ${sub(f)} = ${cnt(base)}${coef > 1 ? `\n    × ${coef} (the coefficient) = ${right}` : ''}\n\n${cnt(noParen) !== cnt(base) ? `Forgetting to multiply through the parentheses gives ${coef * cnt(noParen)}. ` : ''}${hydrate && cnt(noWater) !== cnt(base) ? `Forgetting the water of hydration gives ${coef * cnt(noWater)}. ` : ''}${coef > 1 ? `Forgetting the coefficient gives ${cnt(base)}.` : ''}`,
      };
    },
  },
  {
    id: 'ion-ratio-diagram', section: '2-6', title: 'Which ionic compound a particle diagram represents',
    asked: ['ex2:21', 'ex4:21'],
    real: {
      src: 'ex4', q: 21, stem: 'Which compound when placed in water would be represented by the box? The box holds 6 open circles (cations) and 3 filled circles (anions).',
      choices: ['Sodium chloride', 'Sodium selenide', 'Potassium iodide', 'Magnesium chloride'], answer: 'Sodium selenide',
      explanation: 'Count the ions: 6 cations : 3 anions = 2 : 1. The compound must have TWO cations for every anion, a formula like M₂X.\n\n    Sodium selenide = Na₂Se (Na⁺ and Se²⁻): 2 : 1  -> matches\n    Sodium chloride = NaCl (Na⁺, Cl⁻): 1 : 1\n    Potassium iodide = KI (K⁺, I⁻): 1 : 1\n    Magnesium chloride = MgCl₂ (Mg²⁺, Cl⁻): 1 : 2, the reverse\n\nAn ionic compound dissolved in water separates into its ions, so the box shows the formula\'s ratio of cations to anions.',
    },
    gen(h) {
      const pairs = DIAGRAM_CATIONS.flatMap((c) => DIAGRAM_ANIONS.filter((a) => soluble(c, a) === true).map((a) => [c, a]));
      const ratio = ([c, a]) => { const { nc, na } = ionCounts(c, a); return `${nc}:${na}`; };
      const [cat, an] = h.pick(pairs);
      const { nc, na } = ionCounts(cat, an);
      const kmax = Math.floor(12 / (nc + na));
      const k = kmax >= 2 ? h.int(2, kmax) : 1;
      const r0 = ratio([cat, an]);
      const byRatio = {};
      for (const pr of pairs) (byRatio[ratio(pr)] ??= []).push(pr);
      const otherRatios = shuffled(h, Object.keys(byRatio).filter((r) => r !== r0));
      const rev = `${na}:${nc}`;
      if (byRatio[rev] && rev !== r0) otherRatios.unshift(rev);
      const wrongPairs = [...new Set(otherRatios)].slice(0, 4).map((r) => h.pick(byRatio[r]));
      const nm = ([c, a]) => cap(ionicName(c, a));
      const line = ([c, a]) => { const q = ionCounts(c, a); return `    ${nm([c, a])} = ${sub(ionicFormula(c, a))} (${ion(sub(c.f), c.q)}, ${ion(sub(a.f), a.q)}): ${q.nc} : ${q.na}`; };
      return {
        stem: `An ionic compound is dissolved in water. A box drawn to represent the solution holds ${nc * k} cations and ${na * k} anions. Which compound does the box represent?`,
        right: nm([cat, an]), wrong: wrongPairs.map(nm),
        explanation: `${nc * k} cations : ${na * k} anions reduces to ${nc} : ${na}, so the formula has ${nc} cation${nc > 1 ? 's' : ''} for every ${na} anion${na > 1 ? 's' : ''}.\n\n${line([cat, an])}  -> matches\n${wrongPairs.slice(0, 3).map(line).join('\n')}\n\nThe charges set the ratio: the cation and anion counts must make the total charge zero.`,
      };
    },
  },
];
