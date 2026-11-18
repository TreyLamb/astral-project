// Chapters 3-4 question styles (moles, formulas, molarity, equations, stoichiometry, yields,
// solution reactions) from his study guides. Same contract as styles-ch1.js.

import { parseFormula, molarMass, sub, chargeSup, AVOGADRO, el, CATIONS, ANIONS, cation, anion, ionicFormula, ionicName, ionCounts, soluble } from './data.js';
import { sf, measuredText, rnd } from './styles-ch1.js';

const sci = (x, n) => Number(x * (1 + 1e-12)).toExponential(n - 1).replace(/e\+?/, 'e');
const mm = (f) => molarMass(f);
const mm2 = (f) => mm(f).toFixed(2);

// ---------- balanced equations, verified at load ----------

function parseEq(eq) {
  const [l, r] = eq.split('→').map((s) => s.trim());
  const side = (s) => s.split(' + ').map((t) => {
    const m = t.trim().match(/^(\d*)(.+)$/);
    return { n: m[1] ? Number(m[1]) : 1, f: m[2] };
  });
  return { left: side(l), right: side(r) };
}
function assertBalanced(eq) {
  const { left, right } = parseEq(eq);
  const tally = (terms) => {
    const t = {};
    for (const { n, f } of terms) for (const [k, v] of Object.entries(parseFormula(f))) t[k] = (t[k] ?? 0) + v * n;
    return JSON.stringify(Object.keys(t).sort().map((k) => [k, t[k]]));
  };
  if (tally(left) !== tally(right)) throw new Error(`practiceExam: unbalanced equation ${eq}`);
  return { left, right };
}
const eqText = (eq) => eq.split(' ').map((t) => (t === '+' || t === '→' ? t : t.replace(/^(\d*)(.+)$/, (_, c, f) => `${c === '1' ? '' : c}${sub(f)}`))).join(' ');

const BALANCE = [
  '4PH3 + 8O2 → P4O10 + 6H2O', '2N2H4 + N2O4 → 3N2 + 4H2O', 'B2H6 + 3O2 → B2O3 + 3H2O', '2AgI + Na2S → Ag2S + 2NaI',
  'Ca3(PO4)2 + 4H3PO4 → 3Ca(H2PO4)2', '4NH3 + 5O2 → 4NO + 6H2O', '2Al + 3CuSO4 → Al2(SO4)3 + 3Cu', 'Fe2O3 + 3CO → 2Fe + 3CO2',
  '2KClO3 → 2KCl + 3O2', '4Fe + 3O2 → 2Fe2O3', '3NO2 + H2O → 2HNO3 + NO', 'Al4C3 + 12H2O → 4Al(OH)3 + 3CH4',
  'P4 + 6Cl2 → 4PCl3', 'SiCl4 + 2H2O → SiO2 + 4HCl', '2NaHCO3 → Na2CO3 + CO2 + H2O', '2H2S + 3O2 → 2SO2 + 2H2O',
  'Fe3O4 + 4H2 → 3Fe + 4H2O', '2Al + 6HCl → 2AlCl3 + 3H2', 'Mg3N2 + 6H2O → 3Mg(OH)2 + 2NH3', '4FeS2 + 11O2 → 2Fe2O3 + 8SO2',
].map((eq) => ({ eq, ...assertBalanced(eq) }));

const HYDROCARBONS = ['CH4', 'C2H6', 'C3H8', 'C4H10', 'C5H12', 'C2H4', 'C3H6', 'C4H8', 'C2H2', 'C6H6', 'C7H16', 'C8H18'];
function combustion(f) {
  const { C: x, H: y } = parseFormula(f);
  let k = 1; // multiply until O2 coefficient is whole
  while (((x + y / 4) * k) % 1 !== 0) k++;
  const eq = `${k}${f} + ${(x + y / 4) * k}O2 → ${x * k}CO2 + ${(y / 2) * k}H2O`;
  return { eq, ...assertBalanced(eq), fuel: k, o2: (x + y / 4) * k, co2: x * k, h2o: (y / 2) * k };
}

// decompositions for mol/mol and g/mol and g/g: [reactant name, eq, product asked]
const DECOMP = [
  ['ammonia, NH₃', '2NH3 → N2 + 3H2'], ['water, H₂O', '2H2O → 2H2 + O2'], ['hydrogen peroxide, H₂O₂', '2H2O2 → 2H2O + O2'],
  ['potassium chlorate, KClO₃', '2KClO3 → 2KCl + 3O2'], ['sodium azide, NaN₃', '2NaN3 → 2Na + 3N2'], ['mercury(II) oxide, HgO', '2HgO → 2Hg + O2'],
  ['calcium carbonate, CaCO₃', 'CaCO3 → CaO + CO2'], ['sodium chloride, NaCl', '2NaCl → 2Na + Cl2'], ['potassium bromide, KBr', '2KBr → 2K + Br2'],
  ['aluminum chloride, AlCl₃', '2AlCl3 → 2Al + 3Cl2'], ['magnesium bromide, MgBr₂', 'MgBr2 → Mg + Br2'], ['sodium iodide, NaI', '2NaI → 2Na + I2'],
].map(([name, eq]) => ({ name, eq, ...assertBalanced(eq) }));
const GAS_NAME = { N2: 'N₂', H2: 'H₂', O2: 'O₂', CO2: 'CO₂', Cl2: 'chlorine gas', Br2: 'bromine gas', I2: 'iodine', Hg: 'mercury', Na: 'sodium' };

const ORGANICS = [
  ['C6H11O6N', 'C₆H₁₁O₆N'], ['C6H12O6', 'glucose, C₆H₁₂O₆'], ['C12H22O11', 'sucrose, C₁₂H₂₂O₁₁'], ['C8H10N4O2', 'caffeine, C₈H₁₀N₄O₂'],
  ['C9H8O4', 'aspirin, C₉H₈O₄'], ['C17H19NO3', 'morphine, C₁₇H₁₉NO₃'], ['C3H8O3', 'glycerol, C₃H₈O₃'], ['CO(NH2)2', 'urea, CO(NH₂)₂'],
];

const PERCENT_POOL = ['C8H18', 'C17H19NO3', 'Ca3(PO4)2', 'C6H12O6', 'NH4NO3', 'Fe2O3', 'KMnO4', 'CuSO4·5H2O', 'C9H8O4', 'Na2CO3', 'Al2(SO4)3', 'C3H8O3', 'Mg(OH)2', 'C8H10N4O2', '(NH4)2SO4'];
const NAMES = { C8H18: 'isooctane (C₈H₁₈)', C17H19NO3: 'morphine (C₁₇H₁₉NO₃)', C9H8O4: 'aspirin (C₉H₈O₄)', C6H12O6: 'glucose (C₆H₁₂O₆)', C3H8O3: 'glycerol (C₃H₈O₃)', C8H10N4O2: 'caffeine (C₈H₁₀N₄O₂)' };
const label = (f) => NAMES[f] ?? sub(f);
const ELNAME = (s) => el(s).name;

// empirical formulas (already in lowest terms), element order as written
const EMPIRICAL = [
  [['N', 2], ['O', 5]], [['N', 2], ['O', 3]], [['C', 1], ['S', 2]], [['P', 2], ['O', 5]], [['Fe', 2], ['O', 3]], [['C', 3], ['H', 4], ['Cl', 4]],
  [['C', 9], ['H', 8], ['O', 4]], [['C', 10], ['H', 10], ['O', 3]], [['K', 1], ['H', 2], ['P', 1], ['O', 4]], [['Cr', 2], ['O', 3]],
  [['C', 2], ['H', 5], ['N', 1]], [['C', 5], ['H', 4]], [['Mn', 1], ['O', 2]], [['Al', 2], ['S', 3]], [['C', 3], ['H', 8], ['O', 1]],
];
const fmtCounts = (pairs) => pairs.map(([e, n]) => `${e}${n === 1 ? '' : n}`).join('');
const pctOf = (pairs) => {
  const tot = pairs.reduce((s, [e, n]) => s + el(e).mass * n, 0);
  return pairs.map(([e, n]) => [e, (100 * el(e).mass * n) / tot]);
};
function empiricalWrongs(pairs) {
  const f = (ps) => sub(fmtCounts(ps));
  const out = [];
  out.push(f(pairs.map(([e, n]) => [e, n * 2])));
  out.push(f(pairs.map(([e, n], i) => [e, i === pairs.length - 1 ? n + 1 : n])));
  out.push(f(pairs.map(([e], i) => [e, pairs[pairs.length - 1 - i][1]])));
  out.push(f(pairs.map(([e, n]) => [e, Math.max(1, Math.round(n / 2))])));
  out.push(f(pairs.map(([e, n], i) => [e, i === 0 ? n + 1 : n])));
  return out;
}

const MOLECULAR = [
  ['C2H5N', 2, 'A compound with a molar mass of 86.14 g/mol is 55.77% C, 11.70% H, and 32.53% N.'],
  ['C5H5N5', 1, 'Adenine'], ['CH', 6, 'A compound of carbon and hydrogen'], ['C2H5', 2, 'A hydrocarbon'], ['CH2O', 6, 'A sugar'],
  ['C4H5N2O', 2, 'Caffeine'], ['CH2', 4, 'A hydrocarbon'], ['C3H4O3', 2, 'A compound'], ['C2H3O2', 2, 'A compound'], ['NO2', 2, 'An oxide of nitrogen'],
];

const HYDRATES = [['CuSO4', 5, 'copper(II) sulfate'], ['MgSO4', 7, 'magnesium sulfate'], ['CaCl2', 2, 'calcium chloride'], ['Na2CO3', 10, 'sodium carbonate'],
  ['CoCl2', 6, 'cobalt(II) chloride'], ['BaCl2', 2, 'barium chloride'], ['FeSO4', 7, 'iron(II) sulfate'], ['Na2SO4', 10, 'sodium sulfate'], ['ZnSO4', 7, 'zinc sulfate']];

const SALTS = ['KCl', 'NaOH', 'Ca(OH)2', 'NaCl', 'KNO3', 'Na2SO4', 'CuSO4', 'KMnO4', 'Na2Cr2O7', 'MgCl2', 'AgNO3', 'K2CO3', 'NH4Cl', 'Na3PO4'];
const SALT_NAME = { KCl: 'KCl', NaOH: 'sodium hydroxide', 'Ca(OH)2': 'calcium hydroxide', NaCl: 'NaCl', KNO3: 'potassium nitrate', Na2SO4: 'sodium sulfate', CuSO4: 'copper(II) sulfate', KMnO4: 'KMnO₄', Na2Cr2O7: 'Na₂Cr₂O₇', MgCl2: 'magnesium chloride', AgNO3: 'silver nitrate', K2CO3: 'potassium carbonate', NH4Cl: 'ammonium chloride', Na3PO4: 'sodium phosphate' };

// salts that dissolve completely: [formula, name, ion formula, ion name, ions of it per formula]
const ION_SALTS = [
  ['Na2CO3', 'sodium carbonate', 'Na', 'sodium ion', 2], ['Na2SO4', 'sodium sulfate', 'Na', 'sodium ion', 2], ['NaCl', 'sodium chloride', 'Na', 'sodium ion', 1],
  ['Na3PO4', 'sodium phosphate', 'Na', 'sodium ion', 3], ['K2SO4', 'potassium sulfate', 'K', 'potassium ion', 2], ['CaCl2', 'calcium chloride', 'Cl', 'chloride ion', 2],
  ['AlCl3', 'aluminum chloride', 'Cl', 'chloride ion', 3], ['K3PO4', 'potassium phosphate', 'K', 'potassium ion', 3], ['Mg(NO3)2', 'magnesium nitrate', 'NO3', 'nitrate ion', 2],
  ['Li2CO3', 'lithium carbonate', 'Li', 'lithium ion', 2],
];
const OXY_SALTS = [['Sr(ClO4)2', 'strontium perchlorate'], ['Ca(NO3)2', 'calcium nitrate'], ['Na2SO4', 'sodium sulfate'], ['KMnO4', 'potassium permanganate'],
  ['Al(NO3)3', 'aluminum nitrate'], ['Na3PO4', 'sodium phosphate'], ['Mg(ClO4)2', 'magnesium perchlorate'], ['K2Cr2O7', 'potassium dichromate'], ['Fe(NO3)3', 'iron(III) nitrate']];

// precipitation partners: soluble salt of a cation (nitrate or chloride) + Na/K salt of an anion
const PCATS = CATIONS.filter((c) => ['Ag', 'Pb', 'Ba', 'Ca', 'Sr', 'Fe', 'Cu', 'Co', 'Ni', 'Zn', 'Mg', 'Al', 'Mn', 'Cd'].includes(c.f) && !(c.f === 'Pb' && c.q === 4) && !(c.f === 'Mn' && c.q === 4) && !(c.f === 'Cu' && c.q === 1));
const PANS = ['OH', 'CO3', 'PO4', 'S', 'SO4', 'Cl', 'Br', 'I', 'CrO4'].map((f) => ANIONS.find((a) => a.f === f));
const NA = cation('Na'), K = cation('K'), NO3 = anion('nitrate');
const ionTxt = (ion) => `${sub(ion.f)}${chargeSup(ion.q)}(aq)`;
const coefTxt = (n, s) => `${n === 1 ? '' : n}${s}`;
function precipPair(h) {
  for (let t = 0; t < 60; t++) {
    const c = h.pick(PCATS), a = h.pick(PANS);
    if (soluble(c, a) !== false) continue;
    const alkali = h.pick([NA, K]);
    const partnerAnion = c.f === 'Ag' || c.f === 'Pb' ? NO3 : h.pick([NO3, anion('chloride')]);
    if (soluble(c, partnerAnion) !== true) continue;
    return { c, a, alkali, partnerAnion };
  }
  return { c: cation('Fe', 3), a: anion('hydroxide'), alkali: K, partnerAnion: NO3 };
}
function netIonic({ c, a }) {
  const { nc, na } = ionCounts(c, a);
  return { nc, na, text: `${coefTxt(nc, ionTxt(c))} + ${coefTxt(na, ionTxt(a))} → ${sub(ionicFormula(c, a))}(s)` };
}

const STRONG_ACIDS = [['HCl', 'Cl'], ['HBr', 'Br'], ['HI', 'I'], ['HNO3', 'NO3'], ['HClO4', 'ClO4']];
const WEAK_ACIDS = [['HF', 'F'], ['HNO2', 'NO2'], ['HC2H3O2', 'C2H3O2'], ['HCN', 'CN'], ['HClO', 'ClO']];
const STRONG_ELECTROLYTES = [['H₂SO₄', 3, 'sulfuric acid'], ['NaCl', 2, 'sodium chloride'], ['(NH₄)₂CO₃', 3, 'ammonium carbonate'], ['HCl', 2, 'hydrochloric acid'],
  ['KNO₃', 2, 'potassium nitrate'], ['CaCl₂', 3, 'calcium chloride'], ['Na₃PO₄', 4, 'sodium phosphate'], ['KC₂H₃O₂', 2, 'potassium acetate'], ['NaBr', 2, 'sodium bromide'],
  ['AlCl₃', 4, 'aluminum chloride'], ['HNO₃', 2, 'nitric acid'], ['Na₂SO₄', 3, 'sodium sulfate'], ['Ba(OH)₂', 3, 'barium hydroxide'], ['NaOH', 2, 'sodium hydroxide']];
const WEAK_OR_NON = [['HNO₂', 'weak acid', 'nitrous acid'], ['HF', 'weak acid', 'hydrofluoric acid'], ['HC₂H₃O₂', 'weak acid', 'acetic acid'], ['NH₃', 'weak base', 'ammonia'],
  ['C₁₂H₂₂O₁₁', 'nonelectrolyte (molecular, does not ionize)', 'sucrose'], ['C₂H₅OH', 'nonelectrolyte (molecular, does not ionize)', 'ethanol'], ['HCN', 'weak acid', 'hydrocyanic acid'],
  ['CH₃OH', 'nonelectrolyte (molecular, does not ionize)', 'methanol']];

const ACIDS_T = [['HCl', 1, 'HCl'], ['HNO3', 1, 'HNO₃'], ['H2SO4', 2, 'H₂SO₄'], ['HBr', 1, 'HBr']];
const BASES_T = [['NaOH', 1, 'NaOH'], ['KOH', 1, 'KOH'], ['Ca(OH)2', 2, 'Ca(OH)₂'], ['Ba(OH)2', 2, 'Ba(OH)₂']];

// ---------------------------------------------------------------------------------------------

export const STYLES_CH3_4 = [
  {
    id: 'mol-to-particles', section: '3-2', title: 'Moles to number of particles', asked: ['ex2:5'], real: { from: 'ex2', idx: 4 },
    gen(h) {
      const [f, name] = h.pick(ORGANICS.concat([['Hb', 'hemoglobin']]));
      const M = f === 'Hb' ? 64456 : mm(f);
      const n = measuredText(h, 0.01, 4.5, 2);
      const x = Number(n) * AVOGADRO;
      return {
        stem: `A sample contains ${n} mol of ${name}${f === 'Hb' ? ' (molar mass = 64,456 g/mol)' : ` (molar mass = ${M.toFixed(1)} g/mol)`}. How many molecules is this?`,
        right: `${sci(x, 2)} molecules`, wrong: [`${sci(Number(n) * M, 2)} molecules`, `${sci(Number(n) / AVOGADRO, 2)} molecules`, `${sci(Number(n) * M * AVOGADRO, 2)} molecules`],
        explanation: `molecules = mol × Avogadro's number = ${n} × 6.022 × 10²³ = ${sci(x, 2)}.\n\nThe molar mass is a distractor: moles to molecules never needs it. Multiplying by the molar mass gives grams; dividing by Avogadro's number gives a tiny number that cannot be a count of molecules.`,
      };
    },
  },
  {
    id: 'mol-to-mass', section: '3-2', title: 'Moles to grams', asked: ['ex2:6'], real: { from: 'ex2', idx: 5 },
    gen(h) {
      const [f, name] = h.pick([['O3', 'ozone molecules, O₃'], ['N2', 'nitrogen molecules, N₂'], ['P4', 'phosphorus molecules, P₄'], ['S8', 'sulfur molecules, S₈'], ['Cl2', 'chlorine molecules, Cl₂'], ['CO2', 'carbon dioxide, CO₂'], ['C6H12O6', 'glucose, C₆H₁₂O₆'], ['NH3', 'ammonia, NH₃']]);
      const n = measuredText(h, 0.05, 5, 3);
      const M = mm(f);
      const atom = el(Object.keys(parseFormula(f))[0]).mass;
      return {
        stem: `Determine the mass in grams of ${n} mol of ${name}.`,
        right: `${sf(Number(n) * M, 3)} g`, wrong: [`${sf(Number(n) * atom, 3)} g`, `${sf(Number(n) / M, 3)} g`, `${sf(Number(n) * M * 2, 3)} g`, `${sf(Number(n) * M / 2, 3)} g`],
        explanation: `Molar mass of ${sub(f)} = ${M.toFixed(2)} g/mol.\n    ${n} mol × ${M.toFixed(2)} g/mol = ${sf(Number(n) * M, 3)} g\n\nThe usual slips: using one atom's mass instead of the molecule's, or dividing instead of multiplying (mol ÷ g/mol does not give grams).`,
      };
    },
  },
  {
    id: 'particles-to-mol', section: '3-2', title: 'Number of atoms to moles', asked: ['ex2:7'], real: { from: 'ex2', idx: 6 },
    gen(h) {
      const name = h.pick(['gold', 'neon', 'copper', 'lithium', 'tungsten', 'xenon', 'zinc']);
      const N = `${measuredText(h, 1, 9.99, 3)}e${h.int(3, 26)}`;
      const n = Number(N) / AVOGADRO;
      return {
        stem: `How many moles of ${name} atoms correspond to ${sci(Number(N), 3)} atoms of ${name}?`,
        right: `${sci(n, 3)} mol`, wrong: [`${sci(Number(N) * AVOGADRO, 3)} mol`, `${sci(AVOGADRO / Number(N), 3)} mol`, `${sci(n * 10, 3)} mol`],
        explanation: `mol = atoms ÷ 6.022 × 10²³ = ${sci(Number(N), 3)} ÷ 6.022 × 10²³ = ${sci(n, 3)} mol.\n\nOne mole is an enormous count, so a number of atoms smaller than 6.022 × 10²³ must be less than one mole. Multiplying, or dividing upside down, gives a huge number of moles.`,
      };
    },
  },
  {
    id: 'particles-to-mass', section: '3-2', title: 'Number of formula units to grams', asked: ['sample2:4'],
    real: {
      src: 'sample2', q: 4, stem: 'How many grams of C₆H₁₁O₆N (193.1 g/mol) correspond to 1.560 × 10²⁴ units of C₆H₁₁O₆N?',
      choices: ['7.857 g', '12.52 g', '2.635 g', '500.2 g'], answer: '500.2 g', p: { f: 'C6H11O6N', name: 'C₆H₁₁O₆N', M: 193.1, N: 1.560e24 },
    },
    gen(h, p) {
      const [f, name] = p ? [p.f, p.name] : h.pick(ORGANICS);
      const M = p ? p.M : Number(mm(f).toFixed(1));
      const N = p ? p.N : Number(`${measuredText(h, 1, 9.99, 4)}e${h.int(21, 24)}`);
      const n = N / AVOGADRO;
      return {
        stem: `How many grams of ${name} (${M} g/mol) correspond to ${sci(N, 4)} units of ${name.replace(/^.*?, /, '')}?`,
        right: `${sf(n * M, 4)} g`, wrong: [`${sf(n, 4)} g`, `${sf(n / M, 4)} g`, `${sf(M / n, 4)} g`, `${sf(n * M * 10, 4)} g`],
        explanation: `units -> moles -> grams.\n    ${sci(N, 4)} ÷ 6.022 × 10²³ = ${sf(n, 4)} mol\n    ${sf(n, 4)} mol × ${M} g/mol = ${sf(n * M, 4)} g\n\nStopping at moles, or dividing by the molar mass, are the common errors.`,
      };
    },
  },
  {
    id: 'mass-to-atoms', section: '3-2', title: 'Grams of an element to number of atoms', asked: ['si2:23'],
    real: { src: 'si2', q: 23, stem: 'How many atoms are in 1.50 g of Ga?', answer: '1.30e22 atoms', p: { s: 'Ga', m: '1.50' } },
    gen(h, p) {
      const s = p?.s ?? h.pick(['Ga', 'Fe', 'Cu', 'Al', 'Mg', 'Au', 'Ag', 'Zn', 'Ca', 'Pb', 'Na', 'Ni']);
      const m = p?.m ?? measuredText(h, 0.1, 80, 3);
      const M = el(s).mass;
      const x = (Number(m) / M) * AVOGADRO;
      return {
        stem: `How many atoms are in ${m} g of ${s}?`,
        right: `${sci(x, 3)} atoms`, wrong: [`${sci(Number(m) * M * AVOGADRO, 3)} atoms`, `${sci(Number(m) * AVOGADRO, 3)} atoms`, `${sci(Number(m) / M, 3)} atoms`, `${sci((M / Number(m)) * AVOGADRO, 3)} atoms`],
        explanation: `grams -> moles -> atoms.\n    ${m} g ÷ ${M} g/mol = ${sf(Number(m) / M, 4)} mol\n    × 6.022 × 10²³ = ${sci(x, 3)} atoms\n\nWrong options multiply by the molar mass, skip it, or stop at moles.`,
      };
    },
  },
  {
    id: 'atoms-of-element-in-mass', section: '3-2', title: 'Atoms of one element in a mass of a compound', asked: ['si2:2'],
    real: { src: 'si2', q: 2, stem: 'How many sulfur atoms are in 3.00 g of iron pyrite, FeS₂ (M = 120.0)?', choices: ['7.53 × 10²¹', '1.51 × 10²²', '3.01 × 10²²', '6.02 × 10²³'], answer: '3.01 × 10²²', p: { f: 'FeS2', name: 'iron pyrite', e: 'S', M: 120.0, m: '3.00' } },
    gen(h, p) {
      const pool = [['FeS2', 'iron pyrite', 'S'], ['CO2', 'carbon dioxide', 'O'], ['C6H12O6', 'glucose', 'C'], ['NH3', 'ammonia', 'H'], ['Al2O3', 'aluminum oxide', 'Al'], ['H2SO4', 'sulfuric acid', 'O'], ['CCl4', 'carbon tetrachloride', 'Cl'], ['C3H8', 'propane', 'H']];
      const [f, name, e] = p ? [p.f, p.name, p.e] : h.pick(pool);
      const M = p ? p.M : Number(mm(f).toFixed(1));
      const m = p?.m ?? measuredText(h, 0.5, 60, 3);
      const k = parseFormula(f)[e];
      const units = (Number(m) / M) * AVOGADRO;
      const fmt = (x) => (p ? sci(x, 3) : `${sci(x, 3)} atoms`);
      return {
        stem: `How many ${ELNAME(e)} atoms are in ${m} g of ${name}, ${sub(f)} (M = ${M.toFixed(1)})?`,
        right: fmt(units * k), wrong: [fmt(units), fmt(units * (k === 2 ? 4 : 2) / (k === 2 ? 2 : 1) / (k === 1 ? 1 : 1) * (k === 1 ? 2 : 1)), fmt(units / k), fmt(AVOGADRO), fmt(units * k * 2)],
        explanation: `${m} g ÷ ${M.toFixed(1)} g/mol = ${sf(Number(m) / M, 4)} mol ${sub(f)}\n× 6.022 × 10²³ = ${sci(units, 3)} formula units\n× ${k} ${e} per formula unit = ${sci(units * k, 3)} ${ELNAME(e)} atoms\n\nForgetting the subscript (${k}) is the trap; 6.02 × 10²³ is just Avogadro's number.`,
      };
    },
  },
  {
    id: 'formula-atom-ratio', section: '3-2', title: 'Moles of one element that combine with another in a formula', asked: ['ex2:8', 'si2:11', 'sample2:5'],
    real: { src: 'sample2', q: 5, stem: 'How many moles of Bi are needed to combine with 3.32 mol of S to make bismuth (II) sulfide?', choices: ['2.21 mols', '3.32 mols', '1.89 mols', '0.891 mols'], answer: '3.32 mols', p: { cat: ['Bi', 2, 'bismuth (II)'], an: ['S', -2, 'sulfide'], n: '3.32' } },
    gen(h, p) {
      const opts = [[['Bi', 3, 'bismuth (III)'], ['O', -2, 'oxide']], [['Al', 3, 'aluminum'], ['O', -2, 'oxide']], [['Fe', 3, 'iron (III)'], ['S', -2, 'sulfide']], [['Ca', 2, 'calcium'], ['N', -3, 'nitride']],
        [['Mg', 2, 'magnesium'], ['P', -3, 'phosphide']], [['Na', 1, 'sodium'], ['O', -2, 'oxide']], [['Cr', 3, 'chromium (III)'], ['O', -2, 'oxide']], [['Ti', 4, 'titanium (IV)'], ['O', -2, 'oxide']], [['Li', 1, 'lithium'], ['N', -3, 'nitride']]];
      const [c, a] = p ? [p.cat, p.an] : h.pick(opts);
      const n = p?.n ?? measuredText(h, 0.5, 9.5, 3);
      const { nc, na } = ionCounts({ f: c[0], q: c[1] }, { f: a[0], q: a[1] });
      const x = Number(n) * nc / na;
      const f = `${c[0]}${nc === 1 ? '' : nc}${a[0]}${na === 1 ? '' : na}`;
      const u = p ? 'mols' : 'mol';
      return {
        stem: `How many moles of ${c[0]} are needed to combine with ${n} mol of ${a[0]} to make ${c[2]} ${a[2]}?`,
        right: `${sf(x, 3)} ${u}`, wrong: [`${sf(Number(n) * na / nc, 3)} ${u}`, `${sf(Number(n), 3)} ${u}`, `${sf(Number(n) * c[1] / -a[1], 3)} ${u}`, `${sf(Number(n) / (nc + na), 3)} ${u}`, `${sf(x * 2, 3)} ${u}`],
        explanation: `${c[2]} ${a[2]}: ${c[0]}${chargeSup(c[1])} and ${a[0]}${chargeSup(a[1])} combine as ${sub(f)}, so ${nc} ${c[0]} : ${na} ${a[0]}.\n    ${n} mol ${a[0]} × (${nc} ${c[0]} / ${na} ${a[0]}) = ${sf(x, 3)} mol ${c[0]}\n\nThe ratio comes from the formula's subscripts, which come from the charges. Using the ratio upside down is the usual slip.`,
      };
    },
  },
  {
    id: 'percent-element', section: '3-3', title: 'Mass percent of an element in a compound', asked: ['ex2:18', 'si2:21', 'prep:41', 'prep:43', 'prep:44', 'prep:46'],
    real: { src: 'si2', q: 21, stem: 'What is the mass percent of carbon in isooctane (C₈H₁₈)?', answer: '84.12%', p: { f: 'C8H18', e: 'C' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(PERCENT_POOL);
      const counts = parseFormula(f);
      const e = p?.e ?? h.pick(Object.keys(counts).filter((k) => k !== 'H' || f.startsWith('C')));
      const M = mm(f);
      const part = el(e).mass * counts[e];
      const pc = (100 * part) / M;
      const oneAtom = (100 * el(e).mass) / M;
      const byCount = (100 * counts[e]) / Object.values(counts).reduce((s, v) => s + v, 0);
      return {
        stem: `What is the mass percent of ${ELNAME(e)} in ${label(f)}?`,
        right: `${pc.toFixed(2)}%`, wrong: [`${oneAtom.toFixed(2)}%`, `${byCount.toFixed(2)}%`, `${(100 - pc).toFixed(2)}%`, `${((100 * part) / (M - part)).toFixed(2)}%`].filter((w) => Number.parseFloat(w) <= 100),
        explanation: `% ${e} = (atoms of ${e} × atomic mass) ÷ molar mass × 100\n    = (${counts[e]} × ${el(e).mass}) ÷ ${M.toFixed(2)} × 100 = ${pc.toFixed(2)}%\n\nCommon slips: forgetting the subscript (one atom only), counting atoms instead of mass, or giving the percent of everything else.`,
      };
    },
  },
  {
    id: 'percent-compare', section: '3-3', title: 'Which compound has a given mass percent', asked: ['si2:1', 'prep:48'],
    real: { src: 'si2', q: 1, stem: 'Which potassium salt is 28.9% chlorine by mass?', choices: ['KCl', 'KClO', 'KClO₂', 'KClO₃'], answer: 'KClO₃', p: { set: 0, i: 3 } },
    gen(h, p) {
      const SETS = [
        { who: 'potassium salt', e: 'Cl', fs: ['KCl', 'KClO', 'KClO2', 'KClO3', 'KClO4'] }, { who: 'sodium salt', e: 'O', fs: ['NaNO2', 'NaNO3', 'Na2SO3', 'Na2SO4', 'NaClO4'] },
        { who: 'iron compound', e: 'Fe', fs: ['FeO', 'Fe2O3', 'Fe3O4', 'FeCl3', 'FeS'] }, { who: 'nitrogen oxide', e: 'N', fs: ['N2O', 'NO', 'NO2', 'N2O5', 'N2O3'] },
        { who: 'sulfur compound', e: 'S', fs: ['SO2', 'SO3', 'H2S', 'H2SO4', 'Na2S'] }, { who: 'copper compound', e: 'Cu', fs: ['CuO', 'Cu2O', 'CuS', 'CuCl2', 'CuSO4'] },
      ];
      const set = SETS[p ? p.set : h.int(0, SETS.length - 1)];
      const fs = p ? set.fs.slice(0, 4) : [...set.fs].sort(() => h.rng() - 0.5).slice(0, 4);
      const target = p ? fs[p.i] : h.pick(fs);
      const pc = (f) => (100 * el(set.e).mass * parseFormula(f)[set.e]) / mm(f);
      return {
        stem: `Which ${set.who} is ${pc(target).toFixed(1)}% ${ELNAME(set.e)} by mass?`,
        right: sub(target), wrong: fs.filter((f) => f !== target).map(sub),
        explanation: `Compute % ${set.e} for each option: ${fs.map((f) => `${sub(f)} ${pc(f).toFixed(1)}%`).join('; ')}. Only ${sub(target)} matches.\n\nShortcut: the more of everything else a formula carries, the smaller the share of ${set.e}.`,
      };
    },
  },
  {
    id: 'empirical-from-percent', section: '3-3', title: 'Empirical formula from percent composition', asked: ['ex2:9', 'si2:3', 'sample2:6', 'prep:40', 'prep:51', 'prep:52', 'ex4:16'],
    real: { src: 'ex4', q: 16, stem: 'What is the emperical formula for a componud that is 25.9% nitrogen and 74.1% oxygen?', answer: 'N₂O₅', p: { i: 0 } },
    gen(h, p) {
      const pairs = EMPIRICAL[p ? p.i : h.int(0, EMPIRICAL.length - 1)];
      const pcs = pctOf(pairs);
      const shown = pcs.map(([e, x]) => `${x.toFixed(p ? 1 : 2)}% ${ELNAME(e)}`);
      const hideLast = !p && pairs.length > 2 && h.rng() < 0.4;
      const stemParts = hideLast ? shown.slice(0, -1) : shown;
      const others = pairs.map(([e]) => ELNAME(e));
      const molesTxt = pcs.map(([e, x]) => `${e}: ${x.toFixed(2)} ÷ ${el(e).mass} = ${(x / el(e).mass).toFixed(4)}`).join('; ');
      return {
        stem: hideLast
          ? `What is the empirical formula for a compound containing only ${others.slice(0, -1).join(', ')} and ${others[others.length - 1]} that was found to be ${stemParts.join(' and ')}?`
          : `What is the empirical formula for a compound that is ${stemParts.join(' and ').replace(/ and (?=.* and )/g, ', ')}?`,
        right: sub(fmtCounts(pairs)), wrong: empiricalWrongs(pairs),
        explanation: `Assume 100 g, so each percent is grams. Divide by atomic mass to get moles: ${molesTxt}. Divide every value by the smallest, then multiply by a small whole number if any ratio ends in .5, .33 or .25 (×2, ×3, ×4).\n\nResult: ${sub(fmtCounts(pairs))}.${hideLast ? ` The last element's percent is 100 minus the others.` : ''} Stopping before clearing a fraction like 1 : 2.5 is the classic error.`,
      };
    },
  },
  {
    id: 'molecular-from-empirical', section: '3-3', title: 'Molecular formula from the empirical formula and a molar-mass multiple', asked: ['ex2:10', 'prep:42'], real: { from: 'ex2', idx: 9 },
    gen(h) {
      const [f, k] = h.pick([['C4H9', 2], ['CH2O', 6], ['C2H5', 2], ['CH', 6], ['NO2', 2], ['C3H4O3', 2], ['CH2', 5], ['C2H3O', 4], ['P2O5', 2], ['C5H7N', 2]]);
      const M = mm(f) * k;
      const mult = (n) => sub(Object.entries(parseFormula(f)).map(([e, c]) => `${e}${c * n === 1 ? '' : c * n}`).join(''));
      return {
        stem: `The following empirical formula and molar mass are provided: ${sub(f)}; ${M.toFixed(0)} g/mol. What is the compound's molecular formula?`,
        right: mult(k), wrong: [mult(1), mult(k + 1), mult(k * 2), mult(k + 2)],
        explanation: `Empirical mass of ${sub(f)} = ${mm(f).toFixed(2)} g/mol. ${M.toFixed(0)} ÷ ${mm(f).toFixed(2)} = ${k}, so multiply every subscript by ${k}: ${mult(k)}.`,
      };
    },
  },
  {
    id: 'molecular-from-percent-mass', section: '3-3', title: 'Molecular formula from percent composition and molar mass', asked: ['si2:4', 'sample2:7', 'prep:49', 'prep:50'],
    real: { src: 'sample2', q: 7, stem: 'A compound with a molar mass of 86.14 g/mol is 55.77% C, 11.70% H, and 32.53% N. What is the molecular formula?', choices: ['C₆H₁₄N₄', 'C₂H₅N', 'C₄H₁₀N₂', 'C₈H₂₀N₄'], answer: 'C₄H₁₀N₂', p: { i: 0 } },
    gen(h, p) {
      const POOL = [['C2H5N', 2], ['C5H5N5', 1], ['CH', 6], ['C2H5', 2], ['CH2O', 6], ['C4H5N2O', 2], ['CH2', 4], ['NO2', 2], ['C3H4O3', 2], ['C2H3O2', 2], ['C5H7N', 2]];
      const [f, k] = POOL[p ? p.i : h.int(0, POOL.length - 1)];
      const counts = Object.entries(parseFormula(f));
      const mult = (n) => sub(counts.map(([e, c]) => `${e}${c * n === 1 ? '' : c * n}`).join(''));
      const M = mm(f) * k;
      const pcs = pctOf(counts);
      return {
        stem: `A compound with a molar mass of ${M.toFixed(2)} g/mol is ${pcs.map(([e, x]) => `${x.toFixed(2)}% ${e}`).join(', ').replace(/, (?=[^,]*$)/, ', and ')}. What is the molecular formula?`,
        right: mult(k), wrong: [mult(k === 1 ? 2 : 1), mult(k + 1), mult(k * 2), mult(k + 2), mult(k + 3)].filter((w) => w !== mult(k)),
        explanation: `Step 1, the empirical formula: assume 100 g, convert each percent to moles, divide by the smallest -> ${sub(f)} (${mm(f).toFixed(2)} g/mol).\nStep 2, the multiple: ${M.toFixed(2)} ÷ ${mm(f).toFixed(2)} = ${k}.\nStep 3: multiply the subscripts -> ${mult(k)}.\n\nThe empirical formula itself is the usual wrong answer: it has the right ratio but not the right molar mass.`,
      };
    },
  },
  {
    id: 'hydrate-formula', section: '3-3', title: 'Formula of a hydrate from mass lost on heating', asked: ['ex2:19', 'si2:17'], real: { from: 'ex2', idx: 18 },
    gen(h) {
      const [f, n, name] = h.pick(HYDRATES);
      const anh = mm(f), w = mm('H2O');
      const mAnh = rnd(h, 8, 30, 2);
      const mTot = mAnh * (anh + n * w) / anh;
      const wrongN = [n - 1, n + 1, n + 2, Math.max(1, n - 2), n * 2].filter((x) => x > 0 && x !== n);
      return {
        stem: `A hydrate of ${name} with an unknown number of water molecules has an initial mass of ${mTot.toFixed(2)} g and a mass of ${mAnh.toFixed(2)} g after it is completely dehydrated. What is the formula of the hydrate?`,
        right: `${sub(f)}·${n}H₂O`, wrong: wrongN.map((x) => `${sub(f)}·${x === 1 ? '' : x}H₂O`),
        explanation: `Water lost = ${mTot.toFixed(2)} - ${mAnh.toFixed(2)} = ${(mTot - mAnh).toFixed(2)} g -> ÷ 18.02 = ${((mTot - mAnh) / w).toFixed(4)} mol H₂O.\nAnhydrous ${sub(f)}: ${mAnh.toFixed(2)} g ÷ ${anh.toFixed(2)} = ${(mAnh / anh).toFixed(4)} mol.\nRatio = ${((mTot - mAnh) / w / (mAnh / anh)).toFixed(2)} ≈ ${n}, so ${sub(f)}·${n}H₂O.\n\nThe ratio is water moles to SALT moles, never to the original mass.`,
      };
    },
  },
  {
    id: 'mass-element-from-atoms', section: '3-2', title: 'Grams of one element bonded to a counted number of atoms of another', asked: ['prep:45'],
    real: { src: 'prep', q: 45, stem: 'How many grams of O are combined with 7.14 × 10²¹ atoms of N in the compound dinitrogen pentoxide?', choices: ['3.24', '2.34', '1.45', '0.474'], answer: '0.474', p: { i: 0, N: 7.14e21 } },
    gen(h, p) {
      const POOL = [['N2O5', 'N', 'O', 'dinitrogen pentoxide'], ['P4O10', 'P', 'O', 'tetraphosphorus decaoxide'], ['CO2', 'C', 'O', 'carbon dioxide'], ['SF6', 'S', 'F', 'sulfur hexafluoride'],
        ['N2O4', 'N', 'O', 'dinitrogen tetroxide'], ['CCl4', 'C', 'Cl', 'carbon tetrachloride'], ['SO3', 'S', 'O', 'sulfur trioxide'], ['Fe2O3', 'Fe', 'O', 'iron(III) oxide']];
      const [f, a, b, name] = POOL[p ? p.i : h.int(0, POOL.length - 1)];
      const N = p ? p.N : Number(`${measuredText(h, 1, 9.99, 3)}e${h.int(21, 23)}`);
      const c = parseFormula(f);
      const molB = (N / AVOGADRO) * c[b] / c[a];
      const g = molB * el(b).mass;
      const fmt = (x) => (p ? sf(x, 3) : `${sf(x, 3)} g`);
      return {
        stem: `How many grams of ${b} are combined with ${sci(N, 3)} atoms of ${a} in the compound ${name}?`,
        right: fmt(g), wrong: [fmt((N / AVOGADRO) * c[a] / c[b] * el(b).mass), fmt((N / AVOGADRO) * el(b).mass), fmt(molB * el(b).mass * 2), fmt(molB), fmt((N / AVOGADRO) * c[b] / c[a] * mm(f))],
        explanation: `${sci(N, 3)} atoms ${a} ÷ 6.022 × 10²³ = ${sci(N / AVOGADRO, 4)} mol ${a}.\n${sub(f)} has ${c[a]} ${a} : ${c[b]} ${b}, so mol ${b} = × ${c[b]}/${c[a]} = ${sci(molB, 4)} mol.\n× ${el(b).mass} g/mol = ${sf(g, 3)} g ${b}.\n\nThe ratio upside down, or skipping it, are the common errors.`,
      };
    },
  },
  {
    id: 'mass-compound-for-element', section: '3-3', title: 'Mass of a compound needed to supply a mass of one element', asked: ['prep:47'],
    real: { src: 'prep', q: 47, stem: 'How many grams of (NH₄)₂CO₃ would be required to supply 0.100 kilogram of nitrogen to the soil?', choices: ['289', '398', '748', '343'], answer: '343', p: { i: 0, kg: '0.100' } },
    gen(h, p) {
      const POOL = [['(NH4)2CO3', 'N'], ['NH4NO3', 'N'], ['(NH4)2SO4', 'N'], ['CO(NH2)2', 'N'], ['KCl', 'K'], ['Ca3(PO4)2', 'P'], ['K2SO4', 'K'], ['Fe2O3', 'Fe']];
      const [f, e] = POOL[p ? p.i : h.int(0, POOL.length - 1)];
      const kg = p?.kg ?? measuredText(h, 0.05, 2.5, 3);
      const frac = (el(e).mass * parseFormula(f)[e]) / mm(f);
      const g = (Number(kg) * 1000) / frac;
      const fmt = (x) => (p ? sf(x, 3) : `${sf(x, 3)} g`);
      return {
        stem: `How many grams of ${sub(f)} would be required to supply ${kg} kilogram of ${ELNAME(e)}${e === 'N' || e === 'K' || e === 'P' ? ' to the soil' : ''}?`,
        right: fmt(g), wrong: [fmt(Number(kg) * 1000 * frac), fmt((Number(kg) * 1000 * mm(f)) / el(e).mass), fmt(g / 1000), fmt(Number(kg) * 1000 / frac * 2)],
        explanation: `Mass fraction of ${e} in ${sub(f)} = ${parseFormula(f)[e]} × ${el(e).mass} ÷ ${mm(f).toFixed(2)} = ${(100 * frac).toFixed(2)}%.\nNeeded: ${Number(kg) * 1000} g ${e} ÷ ${frac.toFixed(4)} = ${sf(g, 3)} g ${sub(f)}.\n\nMultiplying by the fraction gives the ${e} in ${Number(kg) * 1000} g of compound, the reverse question. Ignoring the subscript doubles or halves the answer.`,
      };
    },
  },
  {
    id: 'molarity-mass', section: '3-4', title: 'Grams of solute from molarity and volume', asked: ['ex2:1', 'si2:9', 'si2:19'],
    real: { src: 'si2', q: 9, stem: 'How many grams of KCl are needed to prepare 30.0 mL of a 0.500 M KCl solution?', answer: '1.12 g', p: { f: 'KCl', V: '30.0', M: '0.500' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(SALTS);
      const V = p?.V ?? measuredText(h, 10, 500, 3);
      const M = p?.M ?? measuredText(h, 0.05, 3, 3);
      const n = (Number(V) / 1000) * Number(M);
      const g = n * mm(f);
      const n2 = Math.min(3, String(V).replace('.', '').replace(/^0+/, '').length);
      return {
        stem: `How many grams of ${SALT_NAME[f] ?? sub(f)} are needed to prepare ${V} mL of a ${M} M ${SALT_NAME[f] && /[a-z]{4}/.test(SALT_NAME[f]) ? '' : `${sub(f)} `}solution?`.replace('M  solution', 'M solution'),
        right: `${sf(g, 3)} g`, wrong: [`${sf(n, 3)} g`, `${sf(g * 1000, 3)} g`, `${sf(Number(M) * mm(f), 3)} g`, `${sf(g / 2, 3)} g`],
        explanation: `mol = M × L = ${M} mol/L × ${Number(V) / 1000} L = ${sf(n, 4)} mol.\nMolar mass of ${sub(f)} = ${mm2(f)} g/mol -> ${sf(n, 4)} × ${mm2(f)} = ${sf(g, 3)} g.\n\nWrong options stop at moles, forget mL -> L, or skip the volume. (${n2 >= 3 ? '' : ''}Write the formula carefully: calcium hydroxide is Ca(OH)₂, two hydroxides.)`,
      };
    },
  },
  {
    id: 'molarity-from-mass', section: '3-4', title: 'Molarity from grams of solute and volume', asked: ['ex2:28', 'ex2:29', 'si2:12'],
    real: { src: 'si2', q: 12, stem: 'What is the molarity of Na₂Cr₂O₇ in a solution of 0.247 g of Na₂Cr₂O₇ in 0.250 L of solution?', answer: '3.77e-3 M', p: { f: 'Na2Cr2O7', g: '0.247', V: '0.250', unit: 'L' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(['HCl', 'KMnO4', 'Na2Cr2O7', 'NaOH', 'KNO3', 'CuSO4', 'NaCl', 'C6H12O6', 'AgNO3']);
      const unit = p?.unit ?? h.pick(['L', 'mL', 'mg']);
      const g = p?.g ?? (unit === 'mg' ? `${measuredText(h, 1, 9.9, 2)}e4` : measuredText(h, 0.05, 40, 3));
      const V = p?.V ?? (unit === 'mL' ? measuredText(h, 25, 750, 3) : measuredText(h, 0.05, 2, 3));
      const grams = unit === 'mg' ? Number(g) / 1000 : Number(g);
      const L = unit === 'mL' ? Number(V) / 1000 : Number(V);
      const M = grams / mm(f) / L;
      const n = unit === 'mg' ? 2 : 3;
      const fmt = (x) => `${sci(x, n)} M`;
      const stem = unit === 'mg'
        ? `Determine the molarity for the following solution: ${sci(Number(g), 2)} mg of ${sub(f)} in ${V} L of solution.`
        : `What is the molarity of ${sub(f)} in a solution of ${g} g of ${sub(f)} in ${V} ${unit} of solution?`;
      return {
        stem, right: fmt(M), wrong: [fmt(grams / L), fmt(M * 1000), fmt(M / 1000), fmt((grams * mm(f)) / L)],
        explanation: `mol = ${grams} g ÷ ${mm2(f)} g/mol = ${sci(grams / mm(f), 4)} mol; volume = ${L} L.\nM = mol ÷ L = ${fmt(M)}.\n\nWrong options skip the molar mass, or slip a factor of 1000 on mL or mg.`,
      };
    },
  },
  {
    id: 'ion-molarity', section: '3-4', title: 'Molarity of one ion from grams of a salt', asked: ['ex2:26'], real: { from: 'ex2', idx: 25 },
    gen(h) {
      const [f, name, ion, ionName, k] = h.pick(ION_SALTS);
      const g = measuredText(h, 0.5, 9.5, 2);
      const V = h.pick(['100.', '250.', '500.', '50.0', '200.']);
      const M = (Number(g) / mm(f)) / (Number(V) / 1000);
      return {
        stem: `What is the molarity of ${ionName} in a solution of ${g} grams of ${name} in ${V} mL of water?`,
        right: `${sf(M * k, 2)} M`, wrong: [`${sf(M, 2)} M`, `${sf(M * k / 1000, 2)} M`, `${sf(M / k, 2)} M`, `${sf(Number(g) / mm(f) * k, 2)} M`, `${sf(M * k * 2, 2)} M`],
        explanation: `mol ${sub(f)} = ${g} ÷ ${mm2(f)} = ${sf(Number(g) / mm(f), 4)} mol; ÷ ${Number(V) / 1000} L = ${sf(M, 4)} M ${sub(f)}.\nEach ${sub(f)} releases ${k} ${ionName}${k > 1 ? 's' : ''} -> ${sf(M * k, 2)} M.\n\nForgetting the ×${k} gives the salt's molarity, not the ion's.`,
      };
    },
  },
  {
    id: 'oxygen-in-solution', section: '3-4', title: 'Grams of one element in a volume of solution', asked: ['sample2:1'],
    real: { src: 'sample2', q: 1, stem: 'How many grams of oxygen are in 25 mL of 0.20 M strontium perchlorate?', choices: ['0.32 g', '0.64 g', '0.16 g', '0.056 g'], answer: '0.64 g', p: { i: 0, V: '25', M: '0.20' } },
    gen(h, p) {
      const [f, name] = OXY_SALTS[p ? p.i : h.int(0, OXY_SALTS.length - 1)];
      const V = p?.V ?? String(h.pick([10, 15, 20, 25, 40, 50, 75]));
      const M = p?.M ?? h.pick(['0.10', '0.15', '0.20', '0.25', '0.30', '0.40', '0.50']);
      const n = (Number(V) / 1000) * Number(M);
      const k = parseFormula(f).O;
      const g = n * k * 16.00;
      return {
        stem: `How many grams of oxygen are in ${V} mL of ${M} M ${name}?`,
        right: `${sf(g, 2)} g`, wrong: [`${sf(g / 2, 2)} g`, `${sf(g / 4, 2)} g`, `${sf(n * 16.0, 2)} g`, `${sf(n * mm(f), 2)} g`, `${sf(g * 2, 2)} g`],
        explanation: `mol ${sub(f)} = ${Number(V) / 1000} L × ${M} M = ${sf(n, 3)} mol.\nEach ${sub(f)} carries ${k} O atoms -> ${sf(n * k, 3)} mol O × 16.00 g/mol = ${sf(g, 2)} g.\n\nCount every O in the formula, including inside parentheses: ${sub(f)} has ${k}.`,
      };
    },
  },
  {
    id: 'volume-for-ion-mass', section: '3-4', title: 'Volume of solution that delivers a mass of one ion', asked: ['ex2:30', 'ex4:22'],
    real: { src: 'ex4', q: 22, stem: 'What volume of 2.3 M solution of sodium carbonate is needed to deliver 100.0 gram of sodium ion?', answer: '0.95 L', p: { i: 0, M: '2.3', g: '100.0', unit: 'L' } },
    gen(h, p) {
      const [f, name, ion, ionName, k] = ION_SALTS[p ? p.i : h.int(0, ION_SALTS.length - 1)];
      const M = p?.M ?? measuredText(h, 0.5, 4, 2);
      const g = p?.g ?? measuredText(h, 0.5, 120, 3);
      const unit = p?.unit ?? (Number(g) < 10 ? 'mL' : 'L');
      const ionM = ion === 'NO3' ? mm('NO3') : el(ion).mass;
      const L = (Number(g) / ionM / k) / Number(M);
      const fmt = (x) => (unit === 'mL' ? `${sf(x * 1000, 2)} mL` : `${sf(x, 2)} L`);
      return {
        stem: `What volume of ${M} M solution of ${name} is needed to deliver ${g} gram${Number(g) === 1 ? '' : 's'} of ${ionName}?`,
        right: fmt(L), wrong: [fmt(L * k), fmt((Number(g) / mm(f)) / Number(M)), fmt(L / k / (k === 1 ? 2 : 1)), fmt(L * 1000), fmt(L / 10)],
        explanation: `mol ${ionName} = ${g} g ÷ ${ionM.toFixed(2)} g/mol = ${sf(Number(g) / ionM, 4)} mol.\nEach ${sub(f)} gives ${k} -> mol ${sub(f)} = ${sf(Number(g) / ionM / k, 4)} mol.\nV = mol ÷ M = ${sf(L, 4)} L = ${fmt(L)}.\n\nForgetting the ${k} ions per formula, or using the salt's molar mass for the ion, are the traps.`,
      };
    },
  },
  {
    id: 'dilution-water-to-add', section: '3-4', title: 'Dilution: how much water to ADD', asked: ['ex2:27', 'ex4:20'],
    real: { src: 'ex4', q: 20, stem: 'How many mL of water should be added to 1 mL of 12.7 M X to create a solution of 0.100 M X?', answer: '126 mL', p: { V1: '1', M1: '12.7', M2: '0.100' } },
    gen(h, p) {
      const V1 = p?.V1 ?? String(h.pick([1, 2, 5, 10, 15, 20, 25, 35, 50]));
      const M1 = p?.M1 ?? measuredText(h, 1.5, 18, 3);
      let M2 = p?.M2 ?? measuredText(h, 0.1, 1.2, 3);
      if (Number(M2) >= Number(M1)) M2 = (Number(M1) / 4).toFixed(2);
      const V2 = (Number(M1) * Number(V1)) / Number(M2);
      return {
        stem: `How many mL of water should be added to ${V1} mL of ${M1} M X to create a solution of ${M2} M X?`,
        right: `${sf(V2 - Number(V1), 3)} mL`, wrong: [`${sf(V2, 3)} mL`, `${sf((Number(M2) * Number(V1)) / Number(M1), 3)} mL`, `${sf(V2 + Number(V1), 3)} mL`, `${sf((Number(M1) - Number(M2)) * Number(V1), 3)} mL`],
        explanation: `M₁V₁ = M₂V₂ -> V₂ = (${M1} M)(${V1} mL) ÷ ${M2} M = ${sf(V2, 4)} mL. That is the FINAL volume.\nWater to add = ${sf(V2, 4)} - ${V1} = ${sf(V2 - Number(V1), 3)} mL.\n\nThe trap is answering with the final volume; the other wrong options put the molarities upside down.`,
      };
    },
  },
  {
    id: 'dilution-stock-volume', section: '3-4', title: 'Dilution: volume of stock solution needed', asked: ['ex2:31'], real: { from: 'ex2', idx: 30 },
    gen(h) {
      const M1 = measuredText(h, 6, 18.5, 3);
      const [V2, V2u] = h.pick([[1, '1 L'], [0.5, '500. mL'], [0.25, '250. mL'], [2, '2.00 L'], [0.1, '100. mL']]);
      const [M2, M2t] = h.pick([[0.1, '100 mM'], [0.25, '0.250 M'], [0.5, '500 mM'], [0.05, '50.0 mM'], [1, '1.00 M']]);
      const acid = h.pick(['HCl', 'HNO₃', 'H₂SO₄', 'NH₃', 'NaOH']);
      const V1 = (M2 * V2) / Number(M1) * 1000;
      return {
        stem: `How many mL of ${M1} M ${acid} are needed to make ${V2u} of ${M2t} ${acid}?`,
        right: `${sf(V1, 2)} mL`, wrong: [`${sf(V1 * 1000, 2)} mL`, `${sf((Number(M1) * V2) / M2, 2)} mL`, `${sf(V1 / 1000, 2)} mL`, `${sf(V1 * 10, 2)} mL`],
        explanation: `Convert first: ${M2t} = ${M2} M; ${V2u} = ${V2} L.\nM₁V₁ = M₂V₂ -> V₁ = (${M2} × ${V2}) ÷ ${M1} = ${sf(V1 / 1000, 3)} L = ${sf(V1, 2)} mL.\n\nmM is millimolar (10⁻³ M): skipping that conversion is the 1000× error.`,
      };
    },
  },
  {
    id: 'combustion-o2-coeff', section: '4-2', title: 'Coefficient of O₂ in a balanced combustion', asked: ['ex2:3', 'sample2:2'],
    real: { src: 'sample2', q: 2, stem: 'What is the coefficient in front of the oxygen when a balanced equation is written for the reaction between C₄H₈ and oxygen gas to produce carbon dioxide and water? C₄H₈ + O₂ → CO₂ + H₂O', choices: ['6', '5', '4', '2'], answer: '6', p: { f: 'C4H8' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(HYDROCARBONS);
      const c = combustion(f);
      const { C: x, H: y } = parseFormula(f);
      return {
        stem: `What is the coefficient in front of the oxygen when a balanced equation is written for the combustion of ${sub(f)}? ${sub(f)} + O₂ → CO₂ + H₂O`,
        right: String(c.o2), wrong: [c.co2, c.h2o, c.o2 * 2, 2 * x + y / 2, c.o2 + 1, c.o2 - 1].filter((w) => w > 0 && w !== c.o2).map(String),
        explanation: `Balance C, then H, then O last:\n    ${eqText(c.eq)}\nOxygen atoms on the right: ${c.co2}(2) + ${c.h2o}(1) = ${2 * c.co2 + c.h2o} -> ${c.o2} O₂.${c.fuel > 1 ? ` An odd count of O atoms forces doubling everything, which is why ${sub(f)} gets a coefficient of ${c.fuel}.` : ''}\n\nCounting O ATOMS instead of O₂ molecules gives double the answer.`,
      };
    },
  },
  {
    id: 'balance-coefficient', section: '4-2', title: 'Balance an equation and read one coefficient', asked: ['si2:6', 'si2:7', 'si2:14', 'si2:15', 'prep:58'],
    real: { src: 'si2', q: 7, stem: 'What is the coefficient in front of the oxygen when the equation for the combustion of poisonous gas, PH₃, is balanced? PH₃ + O₂ → P₄O₁₀ + H₂O', answer: '8', p: { i: 0, f: 'O2' } },
    gen(h, p) {
      const b = BALANCE[p ? p.i : h.int(0, BALANCE.length - 1)];
      const all = [...b.left, ...b.right];
      const target = p ? all.find((t) => t.f === p.f) : h.pick(all);
      const skel = `${b.left.map((t) => sub(t.f)).join(' + ')} → ${b.right.map((t) => sub(t.f)).join(' + ')}`;
      const others = [...new Set(all.map((t) => t.n))].filter((n) => n !== target.n);
      return {
        stem: `What is the coefficient in front of ${sub(target.f)} when the following equation is balanced? ${skel}`,
        right: String(target.n), wrong: [...others, target.n + 1, target.n * 2, Math.max(1, target.n - 1), target.n + 2, target.n + 3].filter((w) => w !== target.n).map(String),
        explanation: `Balanced: ${eqText(b.eq)}\nCheck: count every element on both sides. Balance the element that appears in only one compound per side first, and leave free elements (O₂, N₂, Al, Cu) for last because you can change their coefficient without disturbing anything else.\n\nThe coefficient of ${sub(target.f)} is ${target.n}.`,
      };
    },
  },
  {
    id: 'stoich-mol-mol', section: '4-4', title: 'Moles of product from moles of reactant', asked: ['ex2:4'], real: { from: 'ex2', idx: 3 },
    gen(h) {
      const d = h.pick(DECOMP.filter((x) => x.right.some((t) => GAS_NAME[t.f])));
      const prod = h.pick(d.right.filter((t) => GAS_NAME[t.f]));
      const r = d.left[0];
      const n = measuredText(h, 0.1, 4.5, 3);
      const x = (Number(n) * prod.n) / r.n;
      return {
        stem: `How many moles of ${GAS_NAME[prod.f] === 'mercury' ? 'mercury' : sub(prod.f)} can be formed by the decomposition of ${n} mol of ${d.name}?`,
        right: `${sf(x, 3)} mol`, wrong: [`${sf((Number(n) * r.n) / prod.n, 3)} mol`, `${sf(Number(n), 3)} mol`, `${sf(Number(n) * prod.n, 3)} mol`, `${sf(x * 2, 3)} mol`, `${sf(x / 2, 3)} mol`, `${sf(x * 3, 3)} mol`],
        explanation: `Balance first: ${eqText(d.eq)}.\n    ${n} mol × (${prod.n} ${sub(prod.f)} / ${r.n} ${sub(r.f)}) = ${sf(x, 3)} mol\n\nAn unbalanced equation (assuming 1 : 1) or the mole ratio upside down are the usual errors.`,
      };
    },
  },
  {
    id: 'stoich-g-to-mol', section: '4-4', title: 'Moles of product from grams of reactant', asked: ['ex2:2', 'si2:18'], real: { from: 'ex2', idx: 1 },
    gen(h) {
      const d = h.pick(DECOMP);
      const prod = h.pick(d.right.filter((t) => GAS_NAME[t.f]));
      const r = d.left[0];
      const g = measuredText(h, 5, 150, 3);
      const nr = Number(g) / mm(r.f);
      const x = (nr * prod.n) / r.n;
      const pname = GAS_NAME[prod.f].includes(' ') || GAS_NAME[prod.f].length > 3 ? GAS_NAME[prod.f] : sub(prod.f);
      return {
        stem: `Determine the moles of ${pname} that could be produced from ${g} g of ${d.name.split(', ')[1] ?? d.name}.`,
        right: `${sf(x, 3)} mol`, wrong: [`${sf(nr, 3)} mol`, `${sf((nr * r.n) / prod.n, 3)} mol`, `${sf(Number(g) / mm(prod.f), 3)} mol`, `${sf(x * 2, 3)} mol`, `${sf(x / 2, 3)} mol`, `${sf(Number(g) * mm(r.f) / 1000, 3)} mol`],
        explanation: `${eqText(d.eq)}\n    ${g} g ÷ ${mm2(r.f)} g/mol = ${sf(nr, 4)} mol ${sub(r.f)}\n    × (${prod.n} / ${r.n}) = ${sf(x, 3)} mol ${sub(prod.f)}\n\nWrong options skip the ratio, flip it, or divide the reactant's grams by the PRODUCT's molar mass.`,
      };
    },
  },
  {
    id: 'stoich-g-to-g', section: '4-4', title: 'Grams of product from grams of reactant', asked: ['sample2:3'],
    real: { src: 'sample2', q: 3, stem: 'How many grams of H₂ can be formed by the decomposition of 67.5 grams of ammonia, NH₃? 2NH₃ → N₂ + 3H₂', choices: ['0.296 g', '0.592 g', '12.0 g', '7.87 g'], answer: '12.0 g', p: { i: 0, prod: 'H2', g: '67.5' } },
    gen(h, p) {
      const d = p ? DECOMP[p.i] : h.pick(DECOMP);
      const prod = p ? d.right.find((t) => t.f === p.prod) : h.pick(d.right);
      const r = d.left[0];
      const g = p?.g ?? measuredText(h, 5, 150, 3);
      const x = (Number(g) / mm(r.f)) * (prod.n / r.n) * mm(prod.f);
      return {
        stem: `How many grams of ${sub(prod.f)} can be formed by the decomposition of ${g} grams of ${d.name}? ${eqText(d.eq)}`,
        right: `${sf(x, 3)} g`, wrong: [`${sf((Number(g) / mm(r.f)) * (r.n / prod.n) * mm(prod.f), 3)} g`, `${sf((Number(g) / mm(r.f)) * mm(prod.f), 3)} g`, `${sf((Number(g) / mm(r.f)) * (prod.n / r.n), 3)} g`, `${sf(x / 2, 3)} g`, `${sf(x * 2, 3)} g`],
        explanation: `grams -> moles -> mole ratio -> grams.\n    ${g} g ÷ ${mm2(r.f)} = ${sf(Number(g) / mm(r.f), 4)} mol ${sub(r.f)}\n    × ${prod.n}/${r.n} = ${sf((Number(g) / mm(r.f)) * (prod.n / r.n), 4)} mol ${sub(prod.f)}\n    × ${mm2(prod.f)} g/mol = ${sf(x, 3)} g\n\nStopping at moles, skipping the ratio, or flipping it are the distractors.`,
      };
    },
  },
  {
    id: 'limiting-reactant-mass', section: '4-4', title: 'Limiting reactant: grams of product from two reactant masses', asked: ['ex4:14'],
    real: { src: 'ex4', q: 14, stem: 'How many grams of carbon dioxide will result if 44 grams of C₃H₈ combusts with 100 g of oxygen gas?', answer: '83 g', p: { f: 'C3H8', gf: '44', go: '100' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(HYDROCARBONS);
      const c = combustion(f);
      const gf = p?.gf ?? measuredText(h, 10, 90, 3);
      const go = p?.go ?? measuredText(h, 30, 400, 3);
      const nf = Number(gf) / mm(f), no = Number(go) / 32.00;
      const fromF = (nf * c.co2) / c.fuel, fromO = (no * c.co2) / c.o2;
      const lim = fromF < fromO ? 'fuel' : 'O2';
      const x = Math.min(fromF, fromO) * mm('CO2');
      const n = p ? 2 : 3;
      return {
        stem: `How many grams of carbon dioxide will result if ${gf} grams of ${sub(f)} combusts with ${go} g of oxygen gas?`,
        right: `${sf(x, n)} g`, wrong: [`${sf(Math.max(fromF, fromO) * mm('CO2'), n)} g`, `${sf(Number(gf) + Number(go), n)} g`, `${sf(Math.min(fromF, fromO), n)} g`, `${sf(nf * mm('CO2'), n)} g`, `${sf(no * mm('CO2'), n)} g`, `${sf(x / 2, n)} g`],
        explanation: `${eqText(c.eq)}\n${sub(f)}: ${gf} ÷ ${mm2(f)} = ${sf(nf, 4)} mol -> could make ${sf(fromF, 4)} mol CO₂.\nO₂: ${go} ÷ 32.00 = ${sf(no, 4)} mol -> could make ${sf(fromO, 4)} mol CO₂.\nThe smaller amount wins: ${lim === 'fuel' ? sub(f) : 'O₂'} is limiting -> ${sf(Math.min(fromF, fromO), 4)} mol × 44.01 = ${sf(x, n)} g CO₂.\n\nThe main trap is working from the reactant in EXCESS (the larger answer). Mass is not conserved into one product, so adding the reactant masses is wrong too.`,
      };
    },
  },
  {
    id: 'percent-yield', section: '4-5', title: 'Percent yield', asked: ['ex2:32', 'ex4:17'],
    real: { src: 'ex4', q: 17, stem: 'In an experiment when 50 g of C₃H₈ is combusted, 35 g of carbon dioxide resulted. What was the percent yield for the reaction?', answer: '23%', p: { f: 'C3H8', gf: '50', ga: '35', prod: 'CO2' } },
    gen(h, p) {
      const f = p?.f ?? h.pick(HYDROCARBONS);
      const c = combustion(f);
      const prod = p?.prod ?? h.pick(['CO2', 'H2O']);
      const gf = p?.gf ?? measuredText(h, 10, 90, 3);
      const coef = prod === 'CO2' ? c.co2 : c.h2o;
      const theo = (Number(gf) / mm(f)) * (coef / c.fuel) * mm(prod);
      const ga = p?.ga ?? (theo * (0.35 + 0.6 * h.rng())).toFixed(1);
      const y = (100 * Number(ga)) / theo;
      const n = p ? 2 : 3;
      const one = (Number(gf) / mm(f)) * mm(prod);
      return {
        stem: `In an experiment when ${gf} g of ${sub(f)} is combusted, ${ga} g of ${prod === 'CO2' ? 'carbon dioxide' : 'water'} resulted. What was the percent yield for the reaction?`,
        right: `${sf(y, n)}%`, wrong: [`${sf((100 * Number(ga)) / Number(gf), n)}%`, `${sf((100 * Number(ga)) / one, n)}%`, `${sf(100 - y, n)}%`, `${sf(y / 2, n)}%`, `${sf((y * c.fuel) / coef, n)}%`, `${sf((100 * Number(ga)) / (theo + Number(gf)), n)}%`, `${sf(y * 0.8, n)}%`].filter((w) => Number.parseFloat(w) <= 100 && Number.parseFloat(w) > 0),
        explanation: `${eqText(c.eq)}\nTheoretical yield: ${gf} g ÷ ${mm2(f)} = ${sf(Number(gf) / mm(f), 4)} mol ${sub(f)} × ${coef}/${c.fuel} = ${sf((Number(gf) / mm(f)) * (coef / c.fuel), 4)} mol × ${mm2(prod)} = ${sf(theo, 4)} g.\nPercent yield = actual ÷ theoretical × 100 = ${ga} ÷ ${sf(theo, 4)} × 100 = ${sf(y, n)}%.\n\nComparing to the mass of fuel, or skipping the mole ratio, are the traps.`,
      };
    },
  },
  {
    id: 'solution-stoich-volume', section: '4-4', title: 'Volume of one solution needed to react with another', asked: ['ex4:13'],
    real: { src: 'ex4', q: 13, stem: 'What volume of 0.12 M sodium sulfate will be required to react with 10 mL of 0.05 M chromium (IV) Bromide?', answer: '8.3 mL', p: { aName: 'chromium (IV) Bromide', bName: 'sodium sulfate', qM: 4, nMperA: 1, qX: 2, nXperB: 1, VA: '10', MA: '0.05', MB: '0.12' } },
    gen(h, p) {
      let q;
      if (p) q = p;
      else {
        const { c, a, alkali, partnerAnion } = precipPair(h);
        const A = ionCounts(c, partnerAnion), B = ionCounts(alkali, a);
        q = { aName: ionicName(c, partnerAnion), bName: ionicName(alkali, a), qM: c.q, nMperA: A.nc, qX: -a.q, nXperB: B.na,
          VA: String(h.pick([10, 15, 20, 25, 30, 50])), MA: h.pick(['0.050', '0.10', '0.15', '0.20', '0.25']), MB: h.pick(['0.12', '0.10', '0.20', '0.25', '0.30', '0.40']) };
      }
      const molA = (Number(q.VA) / 1000) * Number(q.MA);
      const molX = (molA * q.nMperA * q.qM) / q.qX;
      const molB = molX / q.nXperB;
      const V = (molB / Number(q.MB)) * 1000;
      return {
        stem: `What volume of ${q.MB} M ${q.bName} will be required to react with ${q.VA} mL of ${q.MA} M ${q.aName}?`,
        right: `${sf(V, 2)} mL`, wrong: [`${sf((molA / Number(q.MB)) * 1000, 2)} mL`, `${sf(((molA * q.qX) / (q.qM * q.nMperA) / Number(q.MB)) * 1000, 2)} mL`, `${sf(V / 1000, 2)} mL`, `${sf(V * 2, 2)} mL`, `${sf((Number(q.MA) * Number(q.VA)) / Number(q.MB) * 3, 2)} mL`],
        explanation: `Charges set the ratio. The metal ion is ${q.qM}+ and the anion is ${q.qX}-, so each metal ion needs ${q.qM}/${q.qX} anion${q.qM / q.qX === 1 ? '' : 's'}.\nmol ${q.aName} = ${Number(q.VA) / 1000} L × ${q.MA} M = ${sci(molA, 3)} mol (${q.nMperA} metal ion${q.nMperA > 1 ? 's' : ''} each).\nAnion needed = ${sci(molX, 3)} mol -> ${sci(molB, 3)} mol ${q.bName}.\nV = ${sci(molB, 3)} ÷ ${q.MB} M = ${sf(V / 1000, 3)} L = ${sf(V, 2)} mL.\n\nAssuming a 1 : 1 reaction is the most common error.`,
      };
    },
  },
  {
    id: 'titration-molarity', section: '4-6', title: 'Titration: molarity from volumes', asked: ['ex2:33'], real: { from: 'ex2', idx: 32 },
    gen(h) {
      const [a, na, at] = h.pick(ACIDS_T), [b, nb, bt] = h.pick(BASES_T);
      const Va = measuredText(h, 10, 30, 4), Vb = measuredText(h, 10, 40, 4), Mb = measuredText(h, 0.05, 0.6, 3);
      const molOH = (Number(Vb) / 1000) * Number(Mb) * nb;
      const Ma = molOH / na / (Number(Va) / 1000);
      // Volume version (Exam 3 Review Q27): how many mL of base neutralize a known acid sample.
      if (h.rng() < 0.4) {
        const Ma2 = measuredText(h, 0.2, 1.5, 3), Va2 = measuredText(h, 20, 150, 4);
        const molH = (Number(Va2) / 1000) * Number(Ma2) * na;
        const Vb2 = (molH / nb / Number(Mb)) * 1000;
        return {
          stem: `How many mL of ${Mb} M ${bt} would be needed to neutralize ${Va2} mL of ${Ma2} M ${at}?`,
          right: `${sf(Vb2, 3)} mL`, wrong: [`${sf((Number(Ma2) * Number(Va2)) / Number(Mb), 3)} mL`, `${sf(Vb2 * 2, 3)} mL`, `${sf(Vb2 / 2, 3)} mL`, `${sf((Number(Mb) * Number(Va2)) / Number(Ma2), 3)} mL`, `${sf(Vb2 * 4, 3)} mL`],
          explanation: `Moles of H⁺ = ${Number(Va2) / 1000} L × ${Ma2} M × ${na} H⁺ per ${at} = ${sci(molH, 4)} mol.\nEach ${bt} supplies ${nb} OH⁻, so mol base = ${sci(molH / nb, 4)}; ÷ ${Mb} M = ${sf(Vb2 / 1000, 4)} L = ${sf(Vb2, 3)} mL.\n\nWith ${nb === 2 ? `a base that gives TWO OH⁻ (${bt})` : na === 2 ? `an acid that gives TWO H⁺ (${at})` : 'a 1 : 1 ratio'}, ${na === nb ? 'M₁V₁ = M₂V₂ happens to work here' : 'plain M₁V₁ = M₂V₂ is off by a factor of 2'}.`,
        };
      }
      return {
        stem: `A ${Va} mL sample of ${at} requires ${Vb} mL of ${Mb} M ${bt} for complete neutralization. What is the molarity of the ${at}?`,
        right: `${sf(Ma, 3)} M`, wrong: [`${sf((Number(Mb) * Number(Vb)) / Number(Va), 3)} M`, `${sf((Number(Mb) * Number(Va)) / Number(Vb), 3)} M`, `${sf(Ma * 2, 3)} M`, `${sf(Ma / 2, 3)} M`, `${sf(Ma * 4, 3)} M`],
        explanation: `Moles of OH⁻ delivered = ${Number(Vb) / 1000} L × ${Mb} M × ${nb} OH⁻ per ${bt} = ${sci(molOH, 4)} mol.\nEach ${at} gives ${na} H⁺, so mol acid = ${sci(molOH / na, 4)}; ÷ ${Number(Va) / 1000} L = ${sf(Ma, 3)} M.\n\nM₁V₁ = M₂V₂ only works when the ratio is 1 : 1; ${na !== 1 || nb !== 1 ? `here it is not (${at} gives ${na} H⁺, ${bt} gives ${nb} OH⁻).` : 'here it is, but check every time.'}`,
      };
    },
  },
  {
    id: 'combustion-analysis', section: '4-6', title: 'Empirical formula from combustion analysis', asked: ['ex2:34'], real: { from: 'ex2', idx: 33 },
    gen(h) {
      const [emp, mol] = h.pick([['CH4', 'CH4'], ['CH3', 'C2H6'], ['C3H8', 'C3H8'], ['CH2', 'C2H4'], ['CH', 'C6H6'], ['C2H5', 'C4H10'], ['C5H12', 'C5H12'], ['C7H16', 'C7H16'], ['C4H9', 'C8H18'], ['C3H4', 'C9H12']]);
      const { C: x, H: y } = parseFormula(mol);
      const nMol = rnd(h, 0.02, 0.12, 3);
      const gCO2 = nMol * x * mm('CO2'), gH2O = nMol * (y / 2) * mm('H2O');
      const e = parseFormula(emp);
      const f = (cx, hy) => sub(`C${cx === 1 ? '' : cx}H${hy === 1 ? '' : hy}`);
      const half = (() => { const g = (a, b) => (b ? g(b, a % b) : a); const d = g(e.C, Math.max(1, e.H / 2)); return f(e.C / d, Math.max(1, e.H / 2) / d); })();
      return {
        stem: `Complete combustion of a compound containing only carbon and hydrogen produces ${gCO2.toFixed(2)} g CO₂ and ${gH2O.toFixed(2)} g H₂O. What is the empirical formula of the compound?`,
        right: f(e.C, e.H), wrong: [half, f(e.H, e.C), f(e.C, e.H + 1), mol !== emp ? sub(mol) : f(e.C * 2, e.H * 2), f(e.C + 1, e.H)],
        explanation: `All the C ends up in CO₂ and all the H in H₂O.\n    mol C = ${gCO2.toFixed(2)} ÷ 44.01 = ${(gCO2 / 44.01).toFixed(4)}\n    mol H = ${gH2O.toFixed(2)} ÷ 18.02 × 2 = ${((gH2O / 18.02) * 2).toFixed(4)} (TWO H per water)\nDivide by the smaller and clear fractions -> ${f(e.C, e.H)}.\n\nForgetting the 2 H per H₂O halves the hydrogen; the molecular formula is a multiple of the empirical one and is not what was asked.`,
      };
    },
  },
  {
    id: 'net-ionic-equation', section: '4-3', title: 'Net ionic equation for a precipitation', asked: ['si2:8', 'si2:20', 'prep:54'],
    real: { src: 'si2', q: 8, stem: 'Write a balanced net ionic equation for the reaction between iron(III) nitrate and potassium hydroxide.', answer: 'Fe³⁺(aq) + 3OH⁻(aq) → Fe(OH)₃(s)', p: { c: ['Fe', 3], a: 'hydroxide', alk: 'K', pa: 'nitrate' } },
    gen(h, p) {
      const pr = p ? { c: cation(p.c[0], p.c[1]), a: anion(p.a), alkali: cation(p.alk), partnerAnion: anion(p.pa) } : precipPair(h);
      const { c, a, alkali, partnerAnion } = pr;
      const ni = netIonic(pr);
      const salt = sub(ionicFormula(c, a));
      return {
        stem: `Write a balanced net ionic equation for the reaction between ${ionicName(c, partnerAnion)} and ${ionicName(alkali, a)}.`,
        right: ni.text,
        wrong: [`${ionTxt(c)} + ${ionTxt(a)} → ${salt}(s)`, `${coefTxt(ni.nc, ionTxt(c))} + ${coefTxt(ni.na, ionTxt(a))} + ${ionTxt(alkali)} + ${ionTxt(partnerAnion)} → ${salt}(s) + ${ionTxt(alkali)} + ${ionTxt(partnerAnion)}`,
          `${ionTxt(alkali)} + ${ionTxt(partnerAnion)} → ${sub(ionicFormula(alkali, partnerAnion))}(s)`, `${coefTxt(ni.nc, ionTxt(c))} + ${coefTxt(ni.na, ionTxt(a))} → ${salt}(aq)`],
        explanation: `Both reactants are soluble ionic compounds, so they are written as ions. ${salt} is insoluble (solubility rules), so it precipitates. ${ionicName(alkali, partnerAnion)} stays dissolved; its ions are SPECTATORS and drop out.\nBalance charge with coefficients: ${ni.text}.\n\nWrong options leave the charge unbalanced, keep the spectators, precipitate the soluble product, or call the solid (aq).`,
      };
    },
  },
  {
    id: 'net-ionic-coefficient', section: '4-3', title: 'Coefficient in a net ionic equation (or "not in it")', asked: ['ex2:17', 'prep:57', 'prep:60'], real: { from: 'ex2', idx: 16 },
    gen(h) {
      const pr = precipPair(h);
      const ni = netIonic(pr);
      const ask = h.pick(['cation', 'anion', 'product', 'spectator']);
      const NOT = 'it is not in the net ionic equation';
      const [what, right] = ask === 'cation' ? [`the ${pr.c.name} ion`, String(ni.nc)] : ask === 'anion' ? [`the ${pr.a.name} ion`, String(ni.na)]
        : ask === 'product' ? ['the product', '1'] : [h.pick([`the ${pr.alkali.name} ion`, `the ${pr.partnerAnion.name} ion`]), NOT];
      return {
        stem: `Complete and balance the following equation, then write the net ionic equation. ${sub(ionicFormula(pr.c, pr.partnerAnion))}(aq) + ${sub(ionicFormula(pr.alkali, pr.a))}(aq) → ? What is the coefficient in front of ${what} in the balanced net ionic equation?`,
        right, wrong: ['1', '2', '3', '4', '6', NOT].filter((w) => w !== right),
        explanation: `Net ionic equation: ${ni.text}. The ${pr.alkali.name} and ${pr.partnerAnion.name} ions are spectators and do not appear. Coefficients in the net equation come from balancing CHARGE in the precipitate (${sub(ionicFormula(pr.c, pr.a))}), not from the molecular equation's coefficients.`,
      };
    },
  },
  {
    id: 'complete-ionic', section: '4-3', title: 'Complete ionic equation', asked: ['prep:62', 'prep:59'],
    real: { src: 'prep', q: 62, stem: 'What is the ionic equation for the following molecular reaction: SrBr₂(aq) + K₂SO₄(aq) → SrSO₄(s) + 2KBr(aq)', answer: 'Sr²⁺(aq) + 2Br⁻(aq) + 2K⁺(aq) + SO₄²⁻(aq) → SrSO₄(s) + 2K⁺(aq) + 2Br⁻(aq)', p: { c: ['Sr', 2], a: 'sulfate', alk: 'K', pa: 'bromide' } },
    gen(h, p) {
      const pr = p ? { c: cation(p.c[0], p.c[1]), a: anion(p.a), alkali: cation(p.alk), partnerAnion: anion(p.pa) } : precipPair(h);
      const { c, a, alkali, partnerAnion } = pr;
      const A = ionCounts(c, partnerAnion), B = ionCounts(alkali, a), P = ionCounts(c, a);
      // whole-equation coefficients: lcm on the metal and the precipitating anion
      const g = (x, y) => (y ? g(y, x % y) : x);
      const lcm = (x, y) => (x * y) / g(x, y);
      const nM = lcm(A.nc, P.nc), kA = nM / A.nc, kP = nM / P.nc;
      const kB = (kP * P.na) / B.na;
      if (kB % 1) return this.gen(h, null);
      const nAlk = kB * B.nc, nPart = kA * A.na;
      const left = `${coefTxt(kA * A.nc, ionTxt(c))} + ${coefTxt(nPart, ionTxt(partnerAnion))} + ${coefTxt(nAlk, ionTxt(alkali))} + ${coefTxt(kB * B.na, ionTxt(a))}`;
      const prodTxt = `${coefTxt(kP, sub(ionicFormula(c, a)))}(s)`;
      const right = `${left} → ${prodTxt} + ${coefTxt(nAlk, ionTxt(alkali))} + ${coefTxt(nPart, ionTxt(partnerAnion))}`;
      const mol = `${coefTxt(kA, sub(ionicFormula(c, partnerAnion)))}(aq) + ${coefTxt(kB, sub(ionicFormula(alkali, a)))}(aq) → ${prodTxt} + ${coefTxt(nAlk, sub(ionicFormula(alkali, partnerAnion)))}(aq)`;
      return {
        stem: `What is the ionic equation for the following molecular reaction: ${mol}`,
        right,
        wrong: [netIonic(pr).text, `${ionTxt(c)} + ${ionTxt(partnerAnion)} + ${ionTxt(alkali)} + ${ionTxt(a)} → ${prodTxt} + ${ionTxt(alkali)} + ${ionTxt(partnerAnion)}`,
          `${left} → ${coefTxt(kP * P.nc, ionTxt(c))} + ${coefTxt(kP * P.na, ionTxt(a))} + ${coefTxt(nAlk, ionTxt(alkali))} + ${coefTxt(nPart, ionTxt(partnerAnion))}`, `${mol.replace(/\(aq\)/g, '')}`],
        explanation: `COMPLETE ionic equation: write every soluble strong electrolyte as separate ions, keep the solid together, and keep all coefficients.\n    ${right}\nThe NET ionic equation is what is left after the spectators cancel - a different question. Splitting the precipitate into ions is wrong: it is a solid.`,
      };
    },
  },
  {
    id: 'molecular-equation', section: '4-3', title: 'Molecular equation for a precipitation described in words', asked: ['prep:55'],
    real: { src: 'prep', q: 55, stem: 'Aqueous solutions of sodium sulfide and copper(II) nitrate are mixed. A precipitate of copper(II) sulfide forms at once. The solution that remains contains sodium nitrate. What is the molecular equation for this reaction?', answer: 'Na₂S(aq) + Cu(NO₃)₂(aq) → 2NaNO₃(aq) + CuS(s)', p: { c: ['Cu', 2], a: 'sulfide', alk: 'Na', pa: 'nitrate' } },
    gen(h, p) {
      const pr = p ? { c: cation(p.c[0], p.c[1]), a: anion(p.a), alkali: cation(p.alk), partnerAnion: anion(p.pa) } : precipPair(h);
      const { c, a, alkali, partnerAnion } = pr;
      const A = ionCounts(c, partnerAnion), B = ionCounts(alkali, a), P = ionCounts(c, a);
      const g = (x, y) => (y ? g(y, x % y) : x);
      const nM = (A.nc * P.nc) / g(A.nc, P.nc), kA = nM / A.nc, kP = nM / P.nc;
      const kB = (kP * P.na) / B.na;
      if (kB % 1) return this.gen(h, null);
      const kS = kB * B.nc / ionCounts(alkali, partnerAnion).nc;
      const t = (k, f, st) => `${coefTxt(k, sub(f))}(${st})`;
      const right = `${t(kB, ionicFormula(alkali, a), 'aq')} + ${t(kA, ionicFormula(c, partnerAnion), 'aq')} → ${t(kS, ionicFormula(alkali, partnerAnion), 'aq')} + ${t(kP, ionicFormula(c, a), 's')}`;
      return {
        stem: `Aqueous solutions of ${ionicName(alkali, a)} and ${ionicName(c, partnerAnion)} are mixed. A precipitate of ${ionicName(c, a)} forms at once. The solution that remains contains ${ionicName(alkali, partnerAnion)}. What is the molecular equation for this reaction?`,
        right,
        wrong: [netIonic(pr).text, `${t(1, ionicFormula(alkali, a), 'aq')} + ${t(1, ionicFormula(c, partnerAnion), 'aq')} → ${t(1, ionicFormula(alkali, partnerAnion), 'aq')} + ${t(1, ionicFormula(c, a), 's')}`,
          `${t(kB, ionicFormula(alkali, a), 'aq')} + ${t(kA, ionicFormula(c, partnerAnion), 'aq')} → ${t(kS, ionicFormula(alkali, partnerAnion), 's')} + ${t(kP, ionicFormula(c, a), 'aq')}`,
          `${t(kB, `${alkali.f}${a.poly ? `(${a.f})` : a.f}`, 'aq')} + ${t(kA, `${c.f}${partnerAnion.f}`, 'aq')} → ${t(kS, `${alkali.f}${partnerAnion.f}`, 'aq')} + ${t(kP, `${c.f}${a.f}`, 's')}`,
          `${t(kB, ionicFormula(alkali, a), 'aq')} + ${t(kA, ionicFormula(c, partnerAnion), 'aq')} → no reaction (all products are soluble)`,
          `${t(kB, ionicFormula(alkali, a), 'aq')} + ${t(kA, ionicFormula(c, partnerAnion), 'aq')} → ${t(kS, ionicFormula(alkali, partnerAnion), 'aq')} + ${t(kP, ionicFormula(c, a), 'aq')}`],
        explanation: `A MOLECULAR equation writes every compound as a whole formula, with state labels, balanced.\n    ${right}\nThe net ionic equation is a different question; the unbalanced version or the one with the states swapped are wrong. Formulas come from the charges (${c.name}${c.v ? ` ${c.q}+` : ''}, ${a.name} ${-a.q}-).`,
      };
    },
  },
  {
    id: 'ionization-in-water', section: '4-3', title: 'Equation for an acid ionizing in water (strong → vs weak ⇌)', asked: ['prep:53', 'prep:56', 'prep:61'],
    real: { src: 'prep', q: 53, stem: 'Pure HClO₄ is molecular. In water it is a strong acid and ionizes completely. Write an equation for its ionization in water.', answer: 'HClO₄(aq) → H⁺(aq) + ClO₄⁻(aq)', p: { strong: true, i: 4 } },
    gen(h, p) {
      const strong = p ? p.strong : h.rng() < 0.5;
      const [acid, an] = (strong ? STRONG_ACIDS : WEAK_ACIDS)[p ? p.i : h.int(0, 4)];
      const A = sub(acid), X = sub(an);
      const arrow = strong ? '→' : '⇌';
      const other = strong ? '⇌' : '→';
      const right = strong ? `${A}(aq) → H⁺(aq) + ${X}⁻(aq)` : `${A}(aq) + H₂O(l) ⇌ H₃O⁺(aq) + ${X}⁻(aq)`;
      return {
        stem: `Pure ${A} is molecular. In water it is a ${strong ? 'strong acid and ionizes completely' : 'weak acid and ionizes only partly'}. Write an equation for its ionization in water.`,
        right,
        wrong: [right.replace(arrow, other), strong ? `${A}(aq) → H₂(g) + ${X}⁻(aq)` : `${A}(aq) + H₂O(l) ⇌ H₂O⁺(aq) + ${X}⁻(aq)`,
          strong ? `${A}(aq) → H⁺(aq) + ${an.replace(/O\d?$/, '').replace(/\d/g, '') === an ? `${X}²⁻(aq)` : `${sub(an.replace(/O\d+$|O$/, ''))}⁻(aq)`}` : `${A}(aq) ⇌ ${sub(acid.slice(1))}(aq) + H⁺(aq)`,
          `${A}(aq) + H₂O(l) ${arrow} H₂O(l) + ${X}(aq)`],
        explanation: `An acid gives H⁺ (written H₃O⁺ when water is shown as the partner) and its anion, ${X}⁻. A STRONG acid ionizes completely: single arrow (→). A WEAK acid ionizes only partly and sets up an equilibrium: double arrow (⇌).\n    ${right}\nThe strong acids to memorize: HCl, HBr, HI, HNO₃, HClO₄, H₂SO₄ (first H). ${A} is ${strong ? 'one of them' : 'not one of them, so it is weak'}.`,
      };
    },
  },
  {
    id: 'precipitate-which', section: '4-3', title: 'Which pair forms a precipitate', asked: ['ex2:20', 'si2:16'], real: { from: 'ex2', idx: 19 },
    gen(h) {
      const reagentAn = h.pick(['carbonate', 'hydroxide', 'phosphate', 'sulfide', 'sulfate', 'chloride']);
      const R = { c: h.pick([NA, K]), a: anion(reagentAn) };
      const cands = PCATS.flatMap((c) => [NO3, anion('chloride'), anion('acetate')].map((pa) => ({ c, pa }))).filter(({ c, pa }) => soluble(c, pa) === true);
      const yes = cands.filter(({ c }) => soluble(c, R.a) === false);
      const no = [...CATIONS.filter((c) => ['NH4', 'Li', 'Na', 'K'].includes(c.f) && c.f !== R.c.f).map((c) => ({ c, pa: h.pick([NO3, anion('acetate'), anion('chloride')]) })),
        ...cands.filter(({ c }) => soluble(c, R.a) === true)];
      if (!yes.length || no.length < 3) return this.gen(h);
      const right = h.pick(yes);
      const wrong = [...no].sort(() => h.rng() - 0.5).slice(0, 4).map(({ c, pa }) => ionicName(c, pa));
      return {
        stem: `Which compound will react with aqueous ${ionicName(R.c, R.a)} to form a precipitate?`,
        right: ionicName(right.c, right.pa), wrong: wrong.filter((w) => w !== ionicName(right.c, right.pa)),
        explanation: `Swap partners and check each new product against the solubility rules. With ${ionicName(right.c, right.pa)}, the products are ${sub(ionicFormula(right.c, R.a))} and ${sub(ionicFormula(R.c, right.pa))}; ${sub(ionicFormula(right.c, R.a))} is insoluble, so it precipitates.\n\nAny compound of Group 1 metals or ammonium, and every nitrate and acetate, is soluble - so partners that would only make those products give no precipitate.`,
      };
    },
  },
  {
    id: 'electrolyte-strength', section: '4-3', title: 'Strong, weak and nonelectrolytes (which conducts poorly)', asked: ['ex2:23', 'si2:10', 'sample2:17'],
    real: { src: 'sample2', q: 17, stem: 'A solution of which compound will not conduct electricity well?', choices: ['H₂SO₄', 'HNO₂', 'NaCl', '(NH₄)₂CO₃'], answer: 'HNO₂', explanation: 'Conductivity needs IONS. H₂SO₄ is a strong acid, NaCl and (NH₄)₂CO₃ are soluble ionic compounds: all three ionize completely (strong electrolytes). HNO₂ (nitrous acid) is a WEAK acid: only a small fraction ionizes, so its solution conducts poorly.\n\nThe strong acids to memorize: HCl, HBr, HI, HNO₃, HClO₄, H₂SO₄. HNO₃ is strong; HNO₂ is weak.' },
    gen(h) {
      const frame = h.int(0, 1);
      const [wf, wkind, wname] = h.pick(frame ? WEAK_OR_NON.filter((w) => w[1] === 'weak acid') : WEAK_OR_NON);
      const strong = [...STRONG_ELECTROLYTES].filter((s) => frame === 0 || /acid/.test(s[2])).sort(() => h.rng() - 0.5).slice(0, 4).map((s) => s[0]);
      return {
        stem: frame ? 'Identify the weak acid.' : 'A solution of which compound will not conduct electricity well?',
        right: wf, wrong: strong,
        explanation: `${wf} (${wname}) is a ${wkind}: ${wkind.startsWith('non') ? 'it dissolves as whole molecules, so there are no ions to carry charge' : 'only a small fraction ionizes'}. The others are strong electrolytes (strong acids, strong bases, or soluble ionic compounds) and ionize completely.\n\nStrong acids: HCl, HBr, HI, HNO₃, HClO₄, H₂SO₄. Anything else with a leading H (HF, HNO₂, HC₂H₃O₂, HCN) is weak.`,
      };
    },
  },
  {
    id: 'conductivity-rank', section: '4-3', title: 'Most conductive solution at equal concentration', asked: ['ex2:25', 'ex4:19'],
    real: { src: 'ex4', q: 19, stem: 'Which compound will result in the most conductive solution when a 0.1 M solution of it is made?', choices: ['Sulfuric acid', 'acetic acid', 'potassium acetate', 'sodium bromide'], answer: 'Sulfuric acid', explanation: 'At the same concentration, conductivity follows the number of IONS each formula unit releases.\n    sulfuric acid H₂SO₄ -> 2 H⁺ + SO₄²⁻ = 3 ions (strong acid)\n    potassium acetate KC₂H₃O₂ -> 2 ions\n    sodium bromide NaBr -> 2 ions\n    acetic acid HC₂H₃O₂ -> weak acid, barely ionized\nSulfuric acid gives the most ions, so it conducts best. (Its second H⁺ is not 100% released, but it still gives the most ions here.)' },
    gen(h) {
      const pool = [...STRONG_ELECTROLYTES].sort(() => h.rng() - 0.5);
      const top = pool.find((s) => s[1] >= 3);
      const rest = pool.filter((s) => s[1] < top[1]).slice(0, 2);
      const weak = h.pick(WEAK_OR_NON);
      if (rest.length < 2) return this.gen(h);
      const conc = h.pick(['0.1', '0.05', '0.010', '0.2']);
      return {
        stem: `Which compound will result in the most conductive solution when a ${conc} M solution of it is made?`,
        right: top[2], wrong: [...rest.map((r) => r[2]), weak[2]],
        explanation: `At equal concentration the solution with the MOST IONS per formula unit conducts best: ${[top, ...rest].map((s) => `${s[2]} (${s[0]}) -> ${s[1]} ions`).join('; ')}; ${weak[2]} is a ${weak[1]}, so it gives few or no ions.`,
      };
    },
  },
];
