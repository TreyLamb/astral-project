// Question styles first seen on his Exam 3 Review (Chapters 1-6), photographed 2026-11-17
// (Drive: CHEM 1210/Exam3_Review_page1-4). The rest of that review's questions joined styles that
// already existed (EXTRA_ASKED in index.js). Same contract as styles-ch1.js.

import { sub } from './data.js';
import { sf } from './styles-ch1.js';
import { HF, HF_RXNS, spTxt, rxnTxt, dHrxn } from './styles-ch5-8.js';

const sci = (x, n) => Number(x * (1 + 1e-12)).toExponential(n - 1).replace(/e\+?/, 'e');
const kJ = (x) => `${x > 0 ? '+' : ''}${x.toFixed(1)} kJ`;
const COEF = { 0.5: '½', 1.5: '3/2', 2.5: '5/2' };
const coef = (n) => (n === 1 ? '' : COEF[n] ?? String(n));

// ---------- Hess's law: two given equations, one target, verified by species bookkeeping ----------
const sp = (s) => { const m = s.match(/^(.*)\((\w+)\)$/); return `${sub(m[1])}(${m[2]})`; };
const eqStr = (map) => {
  const side = (sign) => Object.entries(map).filter(([, n]) => Math.sign(n) === sign).map(([s, n]) => `${coef(Math.abs(n))}${sp(s)}`).join(' + ');
  return `${side(-1)} → ${side(1)}`;
};
const HESS = [
  { eqs: [[{ 'C(s)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, -393.5], [{ 'S(s)': -1, 'O2(g)': -1, 'SO2(g)': 1 }, -296.8]], k: [1, -1], target: { 'SO2(g)': -1, 'C(s)': -1, 'CO2(g)': 1, 'S(s)': 1 } },
  { eqs: [[{ 'N2H4(g)': -1, 'H2(g)': -1, 'NH3(g)': 2 }, -187.8], [{ 'H2(g)': -3, 'N2(g)': -1, 'NH3(g)': 2 }, -92.4]], k: [-1, 1], target: { 'H2(g)': -2, 'N2(g)': -1, 'N2H4(g)': 1 } },
  { eqs: [[{ 'C(s)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, -393.5], [{ 'CO(g)': -1, 'O2(g)': -0.5, 'CO2(g)': 1 }, -283.0]], k: [1, -1], target: { 'C(s)': -1, 'O2(g)': -0.5, 'CO(g)': 1 } },
  { eqs: [[{ 'H2(g)': -1, 'O2(g)': -0.5, 'H2O(l)': 1 }, -285.8], [{ 'H2O(l)': -1, 'H2O(g)': 1 }, 44.0]], k: [1, 1], target: { 'H2(g)': -1, 'O2(g)': -0.5, 'H2O(g)': 1 } },
  { eqs: [[{ 'S(s)': -1, 'O2(g)': -1, 'SO2(g)': 1 }, -296.8], [{ 'SO2(g)': -2, 'O2(g)': -1, 'SO3(g)': 2 }, -197.8]], k: [1, 0.5], target: { 'S(s)': -1, 'O2(g)': -1.5, 'SO3(g)': 1 } },
  { eqs: [[{ 'N2(g)': -1, 'O2(g)': -1, 'NO(g)': 2 }, 180.6], [{ 'NO(g)': -2, 'O2(g)': -1, 'NO2(g)': 2 }, -114.1]], k: [1, 1], target: { 'N2(g)': -1, 'O2(g)': -2, 'NO2(g)': 2 } },
  { eqs: [[{ 'Cgr(s)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, -393.5], [{ 'Cdia(s)': -1, 'O2(g)': -1, 'CO2(g)': 1 }, -395.4]], k: [1, -1], target: { 'Cgr(s)': -1, 'Cdia(s)': 1 } },
  { eqs: [[{ 'Fe(s)': -2, 'O2(g)': -1.5, 'Fe2O3(s)': 1 }, -824.2], [{ 'Al(s)': -2, 'O2(g)': -1.5, 'Al2O3(s)': 1 }, -1675.7]], k: [-1, 1], target: { 'Al(s)': -2, 'Fe2O3(s)': -1, 'Al2O3(s)': 1, 'Fe(s)': 2 } },
  { eqs: [[{ 'Ca(s)': -1, 'O2(g)': -0.5, 'CaO(s)': 1 }, -635.1], [{ 'CaO(s)': -1, 'CO2(g)': -1, 'CaCO3(s)': 1 }, -178.3]], k: [1, 1], target: { 'Ca(s)': -1, 'O2(g)': -0.5, 'CO2(g)': -1, 'CaCO3(s)': 1 } },
  { eqs: [[{ 'P4(s)': -1, 'Cl2(g)': -6, 'PCl3(l)': 4 }, -1280], [{ 'PCl3(l)': -1, 'Cl2(g)': -1, 'PCl5(s)': 1 }, -124]], k: [1, 4], target: { 'P4(s)': -1, 'Cl2(g)': -10, 'PCl5(s)': 4 } },
];
for (const hz of HESS) {
  const sum = {};
  hz.eqs.forEach(([m], i) => { for (const [s, n] of Object.entries(m)) sum[s] = (sum[s] ?? 0) + n * hz.k[i]; });
  const keys = new Set([...Object.keys(sum), ...Object.keys(hz.target)]);
  for (const s of keys) if (Math.abs((sum[s] ?? 0) - (hz.target[s] ?? 0)) > 1e-9) throw new Error(`practiceExam: Hess entry does not add to its target (${s})`);
}
const hessTxt = (map) => eqStr(map).replace(/Cgr/g, 'C(graphite)').replace(/Cdia/g, 'C(diamond)').replace(/\(graphite\)\(s\)|\(diamond\)\(s\)/g, (m) => m.replace('(s)', ''));

// ---------- fuels for heating problems ----------
const FUELS = [
  { name: 'propane', f: 'C3H8', M: 44, eq: 'C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)', dH: -2220, n: 1, co2: 3, d: 0.493 },
  { name: 'octane', f: 'C8H18', M: 114.2, eq: '2C₈H₁₈ + 25O₂ → 16CO₂ + 18H₂O', dH: -5470, n: 2, co2: 16, d: 0.703 },
  { name: 'ethanol', f: 'C2H5OH', M: 46.07, eq: 'C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)', dH: -1367, n: 1, co2: 2, d: 0.789 },
  { name: 'methanol', f: 'CH3OH', M: 32.04, eq: '2CH₃OH(l) + 3O₂(g) → 2CO₂(g) + 4H₂O(l)', dH: -1452, n: 2, co2: 2, d: 0.792 },
  { name: 'methane', f: 'CH4', M: 16.04, eq: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', dH: -890, n: 1, co2: 1, d: null },
];
const HEATED = [
  { what: 'steel pipe', c: 0.420, kg: [50, 300] }, { what: 'aluminum block', c: 0.897, kg: [5, 60] }, { what: 'copper boiler', c: 0.385, kg: [20, 150] },
  { what: 'iron beam', c: 0.449, kg: [50, 400] }, { what: 'water', c: 4.184, kg: [50, 2000] },
];
const heatedTxt = (obj, kg) => (obj.what === 'water' ? `${kg} kg of water (specific heat ${obj.c.toFixed(3)} J/g°C)` : `a ${kg} kg ${obj.what} (specific heat ${obj.c.toFixed(3)} J/g°C)`);

const METALS_C = [['copper', 0.385], ['iron', 0.449], ['aluminum', 0.897], ['lead', 0.129], ['silver', 0.235], ['zinc', 0.388], ['nickel', 0.444]];

const FORMATION = [
  { f: 'CO₂(g)', right: 'C(s) + O₂(g) → CO₂(g)', wrong: ['C(g) + 2O(g) → CO₂(g)', 'CO(g) + ½O₂(g) → CO₂(g)', '2C(s) + 2O₂(g) → 2CO₂(g)'] },
  { f: 'H₂O(l)', right: 'H₂(g) + ½O₂(g) → H₂O(l)', wrong: ['2H₂(g) + O₂(g) → 2H₂O(l)', '2H(g) + O(g) → H₂O(l)', 'H₂(g) + ½O₂(g) → H₂O(g)'] },
  { f: 'NH₃(g)', right: '½N₂(g) + 3/2H₂(g) → NH₃(g)', wrong: ['N₂(g) + 3H₂(g) → 2NH₃(g)', 'N(g) + 3H(g) → NH₃(g)', 'N₂H₄(g) + H₂(g) → 2NH₃(g)'] },
  { f: 'CH₄(g)', right: 'C(s) + 2H₂(g) → CH₄(g)', wrong: ['C(g) + 4H(g) → CH₄(g)', 'C(s) + 4H(g) → CH₄(g)', 'CO₂(g) + 2H₂O(l) → CH₄(g) + 2O₂(g)'] },
  { f: 'C₂H₅OH(l)', right: '2C(s) + 3H₂(g) + ½O₂(g) → C₂H₅OH(l)', wrong: ['4C(s) + 6H₂(g) + O₂(g) → 2C₂H₅OH(l)', '2CO₂(g) + 3H₂O(l) → C₂H₅OH(l) + 3O₂(g)', '2C(s) + 6H(g) + O(g) → C₂H₅OH(l)'] },
  { f: 'NaCl(s)', right: 'Na(s) + ½Cl₂(g) → NaCl(s)', wrong: ['2Na(s) + Cl₂(g) → 2NaCl(s)', 'Na⁺(aq) + Cl⁻(aq) → NaCl(s)', 'Na(g) + Cl(g) → NaCl(s)'] },
  { f: 'Fe₂O₃(s)', right: '2Fe(s) + 3/2O₂(g) → Fe₂O₃(s)', wrong: ['4Fe(s) + 3O₂(g) → 2Fe₂O₃(s)', '2Fe(s) + 3O(g) → Fe₂O₃(s)', '2FeO(s) + ½O₂(g) → Fe₂O₃(s)'] },
  { f: 'CO(g)', right: 'C(s) + ½O₂(g) → CO(g)', wrong: ['2C(s) + O₂(g) → 2CO(g)', 'C(s) + O(g) → CO(g)', 'CO₂(g) → CO(g) + ½O₂(g)'] },
];

// Same net ionic equation, different spectators: [reaction A, reaction B, the shared net ionic equation]
const SAME_HEAT = [
  ['NaCl and AgNO₃', 'KCl and AgNO₃', 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)'], ['HCl and NaOH', 'HNO₃ and KOH', 'H⁺(aq) + OH⁻(aq) → H₂O(l)'],
  ['Pb(NO₃)₂ and NaI', 'Pb(NO₃)₂ and KI', 'Pb²⁺(aq) + 2I⁻(aq) → PbI₂(s)'], ['BaCl₂ and Na₂SO₄', 'Ba(NO₃)₂ and K₂SO₄', 'Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)'],
  ['HBr and KOH', 'HClO₄ and NaOH', 'H⁺(aq) + OH⁻(aq) → H₂O(l)'], ['CaCl₂ and Na₂CO₃', 'Ca(NO₃)₂ and K₂CO₃', 'Ca²⁺(aq) + CO₃²⁻(aq) → CaCO₃(s)'],
];

// Particle-diagram reactions: reactant A, reactant B, product, coefficients a A + b B -> p P
const PARTICLE_RXNS = [
  ['CO', 'O₂', 'CO₂', 2, 1, 2], ['H₂', 'O₂', 'H₂O', 2, 1, 2], ['N₂', 'H₂', 'NH₃', 1, 3, 2], ['H₂', 'Cl₂', 'HCl', 1, 1, 2],
  ['SO₂', 'O₂', 'SO₃', 2, 1, 2], ['NO', 'O₂', 'NO₂', 2, 1, 2], ['N₂', 'O₂', 'NO', 1, 1, 2],
];
function particleOutcome([A, B, P, a, b, p], nA, nB) {
  const runs = Math.min(Math.floor(nA / a), Math.floor(nB / b));
  const leftA = nA - runs * a, leftB = nB - runs * b;
  const left = [leftA ? `${leftA} ${A}` : '', leftB ? `${leftB} ${B}` : ''].filter(Boolean).join(' and ');
  return { runs, text: `${runs * p} ${P}${left ? `, with ${left} left over` : ', with nothing left over'}` };
}

const WEAK = [['HF', 'F⁻', 'hydrofluoric acid'], ['HNO₂', 'NO₂⁻', 'nitrous acid'], ['HC₂H₃O₂', 'C₂H₃O₂⁻', 'acetic acid'], ['HCN', 'CN⁻', 'hydrocyanic acid'], ['HClO', 'ClO⁻', 'hypochlorous acid']];
const STRONG = [['HCl', 'Cl⁻', 'hydrochloric acid'], ['HBr', 'Br⁻', 'hydrobromic acid'], ['HNO₃', 'NO₃⁻', 'nitric acid'], ['HClO₄', 'ClO₄⁻', 'perchloric acid']];
const BASES = [['NaOH', 'Na⁺', 'sodium hydroxide'], ['KOH', 'K⁺', 'potassium hydroxide'], ['LiOH', 'Li⁺', 'lithium hydroxide']];

// ---------------------------------------------------------------------------------------------

export const STYLES_EXAM3 = [
  {
    id: 'hess-law', section: '5-6', title: "Hess's law: combine given equations", asked: ['ex3:1', 'ex3:26'],
    real: { src: 'ex3', q: 1, stem: "Given C(s) + O₂(g) → CO₂(g) ΔH = -393.5 kJ and S(s) + O₂(g) → SO₂(g) ΔH = -296.8 kJ, what will be the ΔH for the following reaction? SO₂(g) + C(s) → CO₂(g) + S(s)", answer: '-96.7 kJ', p: { i: 0 } },
    gen(h, p) {
      const hz = HESS[p ? p.i : h.int(0, HESS.length - 1)];
      const [[e1, d1], [e2, d2]] = hz.eqs;
      const x = hz.k[0] * d1 + hz.k[1] * d2;
      const fmt = (v) => `${v.toFixed(1)} kJ`;
      return {
        stem: `Given ${hessTxt(e1)} ΔH = ${d1.toFixed(1)} kJ and ${hessTxt(e2)} ΔH = ${d2.toFixed(1)} kJ, what is ΔH for ${hessTxt(hz.target)}?`,
        right: fmt(x), wrong: [fmt(d1 + d2), fmt(-x), fmt(d1 - d2 === x ? d2 - d1 - 10 : d1 - d2), fmt(hz.k[0] * d1 + Math.sign(hz.k[1]) * d2), fmt(d1)].filter((w) => w !== fmt(x)),
        explanation: `Arrange the given equations so they add up to the target. Find each target substance in one given equation: same side as in the target keeps the equation; opposite side means FLIP it and flip the sign of ΔH. Scale an equation to match a coefficient and scale its ΔH the same way.\nHere: ${hz.k[0] === 1 ? 'keep' : hz.k[0] === -1 ? 'flip' : `multiply by ${hz.k[0]}`} the first (${(hz.k[0] * d1).toFixed(1)} kJ) and ${hz.k[1] === 1 ? 'keep' : hz.k[1] === -1 ? 'flip' : `multiply by ${hz.k[1]}`} the second (${(hz.k[1] * d2).toFixed(1)} kJ). Everything not in the target cancels.\nΔH = ${fmt(x)}.\n\nAdding the two ΔH values without flipping is the most common wrong answer.`,
      };
    },
  },
  {
    id: 'hrxn-from-hf', section: '5-6', title: 'Reaction enthalpy from a table of heats of formation', asked: ['ex3:2'],
    real: {
      src: 'ex3', q: 2,
      stem: 'Given the following table of ΔH°f values (kJ/mol): C₂H₅OH(l) -277.6; H₂O(l) -285.8; H₂O(g) -241.8; CO₂(g) -393.5; CO(g) -110.5; H₂O₂(l) -187.6; C₃H₈(g) -103.8. What is the ΔH for the reaction that forms C₂H₅OH(l) and oxygen gas by combining CO₂(g) and H₂O(l)?',
      answer: '+1366.8 kJ', p: { i: 0, reverse: true },
    },
    gen(h, p) {
      const r = HF_RXNS[p ? p.i : h.int(0, HF_RXNS.length - 1)];
      const reverse = p ? p.reverse : h.rng() < 0.4;
      const terms = reverse ? r.terms.map(([n, s]) => [-n, s]) : r.terms;
      const x = dHrxn(terms);
      const unweighted = terms.reduce((s, [n, sp2]) => s + Math.sign(n) * HF[sp2], 0);
      const shown = terms.filter(([, s]) => HF[s] !== 0).map(([, s]) => s);
      const decoys = Object.keys(HF).filter((k) => HF[k] !== 0 && !shown.includes(k)).sort(() => h.rng() - 0.5).slice(0, 2);
      const table = [...shown, ...decoys].sort(() => h.rng() - 0.5).map((s) => `${spTxt(s)} ${HF[s].toFixed(1)}`).join('; ');
      const wet = terms.some(([, s]) => s === 'H2O(l)') ? dHrxn(terms.map(([n, s]) => [n, s === 'H2O(l)' ? 'H2O(g)' : s])) : x + 88;
      return {
        stem: `Given the following table of ΔH°f values (kJ/mol): ${table}. What is ΔH for the reaction ${rxnTxt(terms)}?`,
        right: kJ(x), wrong: [kJ(-x), kJ(unweighted), kJ(wet), kJ(x / 2)].filter((w) => w !== kJ(x)),
        explanation: `ΔH°rxn = Σ n·ΔH°f(products) - Σ n·ΔH°f(reactants). O₂ and other elements in their standard states are 0.\n    ${rxnTxt(terms)}\n    ΔH = ${kJ(x)}\n\n${reverse ? 'Forming the fuel from CO₂ and water is the REVERSE of burning it, so the sign is positive (it needs energy). ' : ''}Common errors: forgetting the coefficients, reactants minus products (wrong sign), or using H₂O(g) when the equation shows H₂O(l).`,
      };
    },
  },
  {
    id: 'heat-to-fuel', section: '5-5', title: 'Fuel needed (or CO₂ made) to heat an object', asked: ['ex3:3', 'ex3:33'],
    real: {
      src: 'ex3', q: 3,
      stem: 'How many liters of combusted propane (C₃H₈; 44 g/mol) are required to heat a 100 kg steel pipe (specific heat of steel is 0.420 J/g°C), from room temperature (20°C) to its melting point of 1300°C? The density of propane is 0.493 g/mL. C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l) ΔH = -2220 kJ/mol',
      answer: '2.16 L', p: { fuel: 0, kg: 100, c: 0.420, T1: 20, T2: 1300, what: 'steel pipe', mode: 'L' },
    },
    gen(h, p) {
      const fuelPool = FUELS.filter((f) => f.d);
      const fu = p ? FUELS[p.fuel] : h.pick(h.rng() < 0.5 ? fuelPool : FUELS);
      const obj = p ? { what: p.what, c: p.c } : h.pick(HEATED);
      const kg = p ? p.kg : h.int(...(obj.kg ?? [50, 200]));
      const T1 = p ? p.T1 : h.int(15, 25);
      const T2 = p ? p.T2 : obj.c > 4 ? h.int(60, 95) : h.int(150, 900);
      const mode = p ? p.mode : fu.d ? h.pick(['L', 'CO2']) : 'CO2';
      const qkJ = (kg * 1000 * obj.c * (T2 - T1)) / 1000;
      const molRxn = qkJ / Math.abs(fu.dH);
      const molFuel = molRxn * fu.n;
      if (mode === 'L') {
        const L = (molFuel * fu.M) / fu.d / 1000;
        return {
          stem: `How many liters of combusted ${fu.name} (${sub(fu.f)}; ${fu.M} g/mol) are required to heat ${heatedTxt(obj, kg)} from ${T1}°C to ${T2}°C? The density of ${fu.name} is ${fu.d} g/mL. ${fu.eq} ΔH = ${fu.dH} kJ/mol`,
          right: `${sf(L, 3)} L`, wrong: [`${sf(L * 1000, 3)} L`, `${sf((molFuel * fu.M) / 1000, 3)} L`, `${sf((L * T2) / (T2 - T1), 3)} L`, `${sf(L / 1000, 3)} L`],
          explanation: `1) Heat needed: q = m·c·ΔT = ${kg * 1000} g × ${obj.c} J/g°C × ${T2 - T1}°C = ${sci(qkJ * 1000, 4)} J = ${sf(qkJ, 4)} kJ.\n2) Moles of fuel: ${sf(qkJ, 4)} kJ ÷ ${Math.abs(fu.dH)} kJ per ${fu.n} mol = ${sf(molFuel, 4)} mol.\n3) Grams: × ${fu.M} g/mol = ${sf(molFuel * fu.M, 4)} g.\n4) Volume: ÷ ${fu.d} g/mL = ${sf((molFuel * fu.M) / fu.d, 4)} mL = ${sf(L, 3)} L.\n\nTraps: J versus kJ (a factor of 1000), stopping at grams, or using the final temperature instead of ΔT.`,
        };
      }
      const g = molRxn * fu.co2 * 44.01;
      return {
        stem: `For the combustion of ${fu.name} shown below, how many grams of carbon dioxide would be produced in heating ${heatedTxt(obj, kg)} from ${T1} to ${T2}°C? ${fu.eq} ΔH = ${fu.dH} kJ/mol`,
        right: `${sci(g, 3)} g`, wrong: [`${sci(g / fu.co2 * fu.n, 3)} g`, `${sci(g * 1000, 3)} g`, `${sci(molRxn * fu.co2, 3)} g`, `${sci(g / 2, 3)} g`],
        explanation: `1) Heat needed: q = m·c·ΔT = ${sf(qkJ, 4)} kJ.\n2) ΔH = ${fu.dH} kJ is for the equation AS WRITTEN, which makes ${fu.co2} mol CO₂. Times the equation runs: ${sf(qkJ, 4)} ÷ ${Math.abs(fu.dH)} = ${sf(molRxn, 4)}.\n3) CO₂: × ${fu.co2} = ${sf(molRxn * fu.co2, 4)} mol × 44.01 g/mol = ${sci(g, 3)} g.\n\nIf an object and water are both heated, add their two m·c·ΔT terms first. Reading the ΔH as "per mole of fuel" when the equation burns ${fu.n} mol changes the answer by a factor of ${fu.n}${fu.n === 1 ? ' (here it does not)' : ''}.`,
      };
    },
  },
  {
    id: 'formation-reaction', section: '5-6', title: 'What a formation reaction is', asked: ['ex3:5'],
    real: {
      src: 'ex3', q: 5, stem: 'In a formation reaction you create ______ of a chemical from the necessary ______.',
      choices: ['one mole ... elements in their standard states', 'one gram ... elements in their standard states', 'one mole ... compounds that contain its atoms', 'two moles ... atoms in the gas phase'],
      answer: 'one mole ... elements in their standard states',
      explanation: 'A formation reaction makes exactly ONE MOLE of one compound from its ELEMENTS in their STANDARD STATES (the form each element takes at 25 °C and 1 atm: O₂(g), H₂(g), C(s, graphite), Na(s), Cl₂(g)). Its ΔH is the heat of formation, ΔH°f.\n\nThat is why fractions like ½O₂ appear in formation equations, and why an element in its standard state has ΔH°f = 0.',
    },
    gen(h) {
      const x = h.pick(FORMATION);
      return {
        stem: `Which equation is the formation reaction for ${x.f} (the reaction whose ΔH is ΔH°f)?`,
        right: x.right, wrong: x.wrong,
        explanation: `A formation reaction makes exactly ONE mole of the compound, from its ELEMENTS in their STANDARD STATES (O₂, H₂, N₂ and Cl₂ as diatomic gases, C as solid graphite, metals as solids).\n    ${x.right}\nFractions are allowed and expected. Two moles, single gas atoms (O, H), compounds or ions as starting materials, or the wrong state of the product all break the definition.`,
      };
    },
  },
  {
    id: 'calorimetry-specific-heat', section: '5-4', title: 'Specific heat of a metal dropped into water', asked: ['ex3:23'],
    real: {
      src: 'ex3', q: 23, stem: 'What is the specific heat of a metal if a 23 g block of the metal is heated to 102 °C and then placed into 350 mL of water at 20 °C, and the resulting water and metal ends up at 28 °C? (s water = 4.184 J/g°C)',
      answer: '6.9 J/g°C', p: { m: 23, Th: 102, mw: 350, Tc: 20, Tf: 28 },
    },
    gen(h, p) {
      let m, Th, mw, Tc, Tf;
      if (p) ({ m, Th, mw, Tc, Tf } = p);
      else {
        const [, c0] = h.pick(METALS_C);
        m = h.int(25, 180); Th = h.int(80, 110); mw = h.pick([50, 75, 100, 150, 200, 250]); Tc = h.int(18, 25);
        Tf = round1((m * c0 * Th + mw * 4.184 * Tc) / (m * c0 + mw * 4.184));
        if (Tf - Tc < 0.8) Tf = round1(Tc + 1.2);
      }
      const qw = mw * 4.184 * (Tf - Tc);
      const c = qw / (m * (Th - Tf));
      const n = 2;
      const u = 'J/g°C';
      return {
        stem: `What is the specific heat of a metal if a ${m} g block of the metal is heated to ${Th} °C and then placed into ${mw} mL of water at ${Tc} °C, and the water and metal end up at ${Tf} °C? (s water = 4.184 J/g°C)`,
        right: `${sf(c, n)} ${u}`, wrong: [`${sf(qw / (m * (Tf - Tc)), n)} ${u}`, `${sf((m * 4.184 * (Tf - Tc)) / (mw * (Th - Tf)), n)} ${u}`, `${sf(qw / (m * (Th - Tc)), n)} ${u}`, `${sf(qw / (m * Th), n)} ${u}`, `${sf(c * 10, n)} ${u}`],
        explanation: `Heat lost by the metal = heat gained by the water (1 mL of water = 1 g).\n    water: q = ${mw} g × 4.184 × (${Tf} - ${Tc}) = ${sf(qw, 4)} J\n    metal: ${m} g × c × (${Th} - ${Tf}) = ${sf(qw, 4)} J\n    c = ${sf(qw, 4)} ÷ (${m} × ${round1(Th - Tf)}) = ${sf(c, n)} ${u}\n\nEach object uses ITS OWN temperature change: the metal falls from ${Th} to ${Tf}; the water rises from ${Tc} to ${Tf}.${p ? ' (This answer is unrealistically high for a metal, which are usually 0.1-0.9 J/g°C, but it is what the numbers on the review give.)' : ''}`,
      };
    },
  },
  {
    id: 'thermo-limiting', section: '5-5', title: 'Energy as a limiting reactant', asked: ['ex3:25'],
    real: {
      src: 'ex3', q: 25, stem: 'Given the following equation, 6CO₂(g) + 6H₂O(l) → C₆H₁₂O₆(s) + 6O₂(g) ΔH = 2816 kJ/mol. What mass of glucose could be produced if 101 g of CO₂ and 1200.0 kJ of heat was provided?',
      answer: '68.9 g', p: { gCO2: 101, E: 1200.0, dH: 2816 },
    },
    gen(h, p) {
      const dH = p?.dH ?? h.pick([2816, 2900, 2803]);
      let gCO2 = p?.gCO2, E = p?.E;
      if (!p) {
        gCO2 = h.int(30, 400);
        const fromC = gCO2 / 44.01 / 6;
        E = Math.round(fromC * dH * (h.rng() < 0.5 ? 0.6 + 0.3 * h.rng() : 1.15 + 0.4 * h.rng()) * 10) / 10;
      }
      const fromC = gCO2 / 44.01 / 6, fromE = E / dH;
      const mol = Math.min(fromC, fromE);
      const M = 180.16;
      return {
        stem: `Given the following equation, 6CO₂(g) + 6H₂O(l) → C₆H₁₂O₆(s) + 6O₂(g) ΔH = ${dH} kJ/mol. What mass of glucose could be produced if ${gCO2} g of CO₂ and ${E.toFixed(1)} kJ of heat were provided?`,
        right: `${sf(mol * M, 3)} g`, wrong: [`${sf(Math.max(fromC, fromE) * M, 3)} g`, `${sf((gCO2 / 44.01) * M, 3)} g`, `${sf((fromC + fromE) * M, 3)} g`, `${sf(mol * M * 6, 3)} g`],
        explanation: `Treat the energy like a reactant: glucose is limited by whichever runs out first.\n    From CO₂: ${gCO2} g ÷ 44.01 = ${sf(gCO2 / 44.01, 4)} mol × (1 glucose / 6 CO₂) = ${sf(fromC, 4)} mol\n    From energy: ${E.toFixed(1)} kJ ÷ ${dH} kJ/mol = ${sf(fromE, 4)} mol\nThe smaller amount wins: ${fromC < fromE ? 'CO₂' : 'the energy'} is limiting -> ${sf(mol, 4)} mol × 180.16 g/mol = ${sf(mol * M, 3)} g.\n\nForgetting the 6 : 1 ratio, or using the larger amount, are the traps.`,
      };
    },
  },
  {
    id: 'neutralization-net-ionic', section: '4-3', title: 'Net ionic equation for an acid-base neutralization', asked: ['ex3:28'],
    real: { src: 'ex3', q: 28, stem: 'What is the coefficient in front of the F⁻ ion in the net ionic equation for the reaction between sodium hydroxide and hydrofluoric acid?', answer: '1', p: { weak: 0, base: 0, ask: 'anion' } },
    gen(h, p) {
      const isWeak = p ? true : h.rng() < 0.6;
      const [HA, A, an] = p ? WEAK[p.weak] : h.pick(isWeak ? WEAK : STRONG);
      const [B, M, bn] = p ? BASES[p.base] : h.pick(BASES);
      const ask = p?.ask ?? h.pick(['anion', 'water', 'metal', 'acid']);
      const NOT = 'it is not in the net ionic equation';
      const net = isWeak ? `${HA}(aq) + OH⁻(aq) → ${A}(aq) + H₂O(l)` : 'H⁺(aq) + OH⁻(aq) → H₂O(l)';
      const target = { anion: `the ${A} ion`, water: 'water', metal: `the ${M} ion`, acid: isWeak ? `${HA}` : 'the H⁺ ion' }[ask];
      const right = ask === 'metal' || (ask === 'anion' && !isWeak) ? NOT : '1';
      return {
        stem: `What is the coefficient in front of ${target} in the net ionic equation for the reaction between ${bn} and ${an}?`,
        right, wrong: ['1', '2', '3', NOT].filter((w) => w !== right),
        explanation: `${an[0].toUpperCase() + an.slice(1)} is a ${isWeak ? 'WEAK acid, so it stays mostly as whole molecules and is written as ' + HA + ' in the ionic equation' : 'STRONG acid, so it is written as separate ions'}. ${bn[0].toUpperCase() + bn.slice(1)} is a strong base: ${M} and OH⁻.\nNet ionic equation: ${net}\n${M}${isWeak ? '' : ` and ${A}`} ${isWeak ? 'is a spectator' : 'are spectators'} and ${isWeak ? 'does' : 'do'} not appear.\n\nThe trap is splitting a weak acid into H⁺ and its anion: it does not ionize, so it reacts as a whole molecule.`,
      };
    },
  },
  {
    id: 'spectator-same-heat', section: '4-3', title: 'Why two reactions release the same heat (same net ionic equation)', asked: ['ex3:34'],
    real: {
      src: 'ex3', q: 34, stem: 'The reaction between NaCl and AgNO₃ releases the same amount of heat as the reaction between KCl and AgNO₃. Why is this the case?',
      choices: ['Both have the same net ionic equation, Ag⁺(aq) + Cl⁻(aq) → AgCl(s); Na⁺ and K⁺ are only spectator ions', 'Na and K are in the same group, so they react with the same energy', 'NaCl and KCl have the same molar mass', 'Every precipitation reaction releases the same amount of heat'],
      answer: 'Both have the same net ionic equation, Ag⁺(aq) + Cl⁻(aq) → AgCl(s); Na⁺ and K⁺ are only spectator ions',
      explanation: 'Write the net ionic equation for each: both are Ag⁺(aq) + Cl⁻(aq) → AgCl(s). Na⁺, K⁺ and NO₃⁻ are spectators: they are dissolved before and after and take no part. The heat comes only from the change that actually happens, so the same net reaction releases the same heat per mole.\n\nThe same idea explains why every strong acid + strong base neutralization releases about the same heat: they are all H⁺ + OH⁻ → H₂O.',
    },
    gen(h) {
      const [a, b, net] = h.pick(SAME_HEAT);
      return {
        stem: `The reaction between ${a} releases the same amount of heat per mole as the reaction between ${b}. Why is this the case?`,
        right: `Both have the same net ionic equation, ${net}; the other ions are only spectators`,
        wrong: ['The metals are in the same group, so they react with the same energy', 'The reactants have the same molar masses', 'Every reaction in water releases the same amount of heat'],
        explanation: `Write both net ionic equations: each is ${net}. The ions that differ between the two reactions are spectators, dissolved before and after, and contribute no heat. Same net reaction, same heat per mole.`,
      };
    },
  },
  {
    id: 'particle-limiting', section: '4-4', title: 'Limiting reactant from a particle diagram', asked: ['ex3:16'],
    real: {
      src: 'ex3', q: 16, stem: 'Consider the reaction between this mixture of CO and O₂ to form CO₂ (2CO + O₂ → 2CO₂). The box holds 4 CO molecules and 3 O₂ molecules. If the material in the box reacts, what will be the resulting products and remaining reactants?',
      answer: '4 CO₂, with 1 O₂ left over', p: { i: 0, nA: 4, nB: 3 },
    },
    gen(h, p) {
      const r = PARTICLE_RXNS[p ? p.i : h.int(0, PARTICLE_RXNS.length - 1)];
      const [A, B, P, a, b] = r;
      let nA = p?.nA, nB = p?.nB;
      // At least one full reaction must be possible, and the mix must not be exactly stoichiometric.
      if (!p) { do { nA = h.int(a, 9); nB = h.int(b, 9); } while (nA / a === nB / b); }
      const right = particleOutcome(r, nA, nB).text;
      const naive = `${Math.min(nA, nB) * r[5]} ${P}, with nothing left over`;
      const wrong = [
        `${nA + nB} ${P}, with nothing left over`, naive, particleOutcome([A, B, P, b, a, r[5]], nA, nB).text,
        `${Math.max(nA, nB)} ${P}, with ${Math.abs(nA - nB)} ${nA > nB ? B : A} left over`, particleOutcome(r, nA + 1, nB).text,
      ].filter((w) => w !== right);
      return {
        stem: `Consider the reaction ${a === 1 ? '' : a}${A} + ${b === 1 ? '' : b}${B} → ${r[5] === 1 ? '' : r[5]}${P}. A box holds ${nA} ${A} molecules and ${nB} ${B} molecules. If the material in the box reacts as completely as it can, what will be the resulting products and remaining reactants?`,
        right, wrong,
        explanation: `Each reaction uses ${a} ${A} and ${b} ${B}. ${A} allows ${Math.floor(nA / a)} reactions; ${B} allows ${Math.floor(nB / b)}. The smaller number runs, so ${Math.min(Math.floor(nA / a), Math.floor(nB / b))} reactions make ${right}.\n\nIt is the coefficients, not the raw counts, that decide which reactant runs out.`,
      };
    },
  },
];

function round1(x) { return Math.round(x * 10) / 10; }
