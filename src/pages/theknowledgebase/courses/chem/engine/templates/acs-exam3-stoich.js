// ACS-level (bands 4-5) review of course chapters 3-4 for the CUMULATIVE Exam 3. Built 2026-10-27.
//
// Trey: "i'll have to review a lot of the titration/moles etc etc from last exam. A LOT to review."
// The bank had zero band-4/5 templates for book sections 3-4, 4-4, 4-5 and 4-6. These are the
// two-step versions the national exam asks: mass-to-mass through a mole ratio that is not 1, the
// mass of excess reactant left over, a molar mass from a titration of a polyprotic acid, ion
// concentration after mixing two solutions, and precipitate mass from two solutions (limiting
// reactant inside a solution problem). Same standing rule as acs-exam3-heat.js: the professor's
// quizzes are the floor, the ACS exam is the bar.

import { registerChemTemplate } from '../generator.js';

const CH4 = 'chem1-04-stoichiometry';
const CH5 = 'chem1-05-solutions-aqueous-1';

function sig(x, n = 3) {
  if (x === 0) return '0';
  const r = Number(x.toPrecision(n));
  const mag = Math.floor(Math.log10(Math.abs(r)));
  return mag >= n - 1 ? r.toFixed(0) : r.toFixed(n - 1 - mag);
}
const g = (x) => `${sig(x)} g`;

const RXNS = [
  { eq: '2KClO₃(s) → 2KCl(s) + 3O₂(g)', sp: [{ f: 'KClO₃', c: 2, M: 122.55 }, { f: 'KCl', c: 2, M: 74.55 }, { f: 'O₂', c: 3, M: 32.00 }] },
  { eq: 'Fe₂O₃(s) + 3CO(g) → 2Fe(s) + 3CO₂(g)', sp: [{ f: 'Fe₂O₃', c: 1, M: 159.70 }, { f: 'CO', c: 3, M: 28.01 }, { f: 'Fe', c: 2, M: 55.85 }, { f: 'CO₂', c: 3, M: 44.01 }] },
  { eq: '4NH₃(g) + 5O₂(g) → 4NO(g) + 6H₂O(g)', sp: [{ f: 'NH₃', c: 4, M: 17.03 }, { f: 'O₂', c: 5, M: 32.00 }, { f: 'NO', c: 4, M: 30.01 }, { f: 'H₂O', c: 6, M: 18.02 }] },
  { eq: 'C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)', sp: [{ f: 'C₃H₈', c: 1, M: 44.09 }, { f: 'O₂', c: 5, M: 32.00 }, { f: 'CO₂', c: 3, M: 44.01 }, { f: 'H₂O', c: 4, M: 18.02 }] },
  { eq: '2Al(s) + 3Cl₂(g) → 2AlCl₃(s)', sp: [{ f: 'Al', c: 2, M: 26.98 }, { f: 'Cl₂', c: 3, M: 70.90 }, { f: 'AlCl₃', c: 2, M: 133.33 }] },
  { eq: 'N₂(g) + 3H₂(g) → 2NH₃(g)', sp: [{ f: 'N₂', c: 1, M: 28.02 }, { f: 'H₂', c: 3, M: 2.016 }, { f: 'NH₃', c: 2, M: 17.03 }] },
  { eq: '2C₂H₆(g) + 7O₂(g) → 4CO₂(g) + 6H₂O(l)', sp: [{ f: 'C₂H₆', c: 2, M: 30.07 }, { f: 'O₂', c: 7, M: 32.00 }, { f: 'CO₂', c: 4, M: 44.01 }, { f: 'H₂O', c: 6, M: 18.02 }] },
];
// Reactions with exactly two reactants, listed first in `sp`.
const TWO_REACTANT = RXNS.filter((r) => r.eq.split('→')[0].split('+').length === 2);
const reactantsOf = (r) => r.sp.slice(0, 2);

// ---------------------------------------------------------------------------
// mass of A -> mass of B through a mole ratio that is not 1
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-04-mass-to-mass',
  chapterId: CH4,
  section: '4-4',
  band: 4,
  name: 'Mass-to-mass stoichiometry with an unequal mole ratio',
  concepts: ['mole-ratios-from-coefficients', 'moles-to-mass-stoichiometry'],
  generate: (rng, h) => {
    const r = h.pick(RXNS);
    const pairs = [];
    for (const a of r.sp) for (const b of r.sp) if (a !== b && a.c !== b.c) pairs.push([a, b]);
    const [A, B] = h.pick(pairs);
    const mA = h.int(100, 999) / 10;
    const nA = mA / A.M;
    const nB = (nA * B.c) / A.c;
    const mB = nB * B.M;
    return {
      stem: `${r.eq}\nWhat mass of ${B.f} corresponds to ${mA.toFixed(1)} g of ${A.f} in this reaction?`,
      ...h.choices(g(mB), [
        { value: g(nA * B.M), error: 'ignored-mole-ratio', why: `went straight from moles of ${A.f} to grams of ${B.f}. The coefficients say ${A.c} mol ${A.f} ↔ ${B.c} mol ${B.f}` },
        { value: g(((nA * A.c) / B.c) * B.M), error: 'inverted-mole-ratio', why: `used the ratio ${A.c}/${B.c} upside down. Moles wanted go on top: ${B.c} mol ${B.f} / ${A.c} mol ${A.f}` },
        { value: g((mA * B.c) / A.c), error: 'skipped-molar-masses', why: 'applied the mole ratio to GRAMS. Coefficients relate moles, never masses' },
        { value: g(nA * A.c * B.c * B.M), error: 'multiplied-both-coefficients', why: 'multiplied by both coefficients instead of using their ratio' },
        { value: g(nB), error: 'stopped-at-moles', why: `found moles of ${B.f} and reported them as grams. Multiply by ${B.M} g/mol` },
      ]),
      explanation: `grams ${A.f} → moles: ${mA.toFixed(1)} ÷ ${A.M} = ${nA.toFixed(4)} mol.\nMole ratio from the coefficients: × (${B.c} mol ${B.f} / ${A.c} mol ${A.f}) = ${nB.toFixed(4)} mol ${B.f}.\nmoles → grams: ${nB.toFixed(4)} × ${B.M} = ${sig(mB)} g.`,
    };
  },
});

// ---------------------------------------------------------------------------
// limiting reactant: mass of the excess reactant left over
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-acs-04-excess-remaining',
  chapterId: CH4,
  section: '4-5',
  band: 5,
  name: 'Mass of excess reactant remaining',
  concepts: ['limiting-reactant-theoretical-yield'],
  generate: (rng, h) => {
    const r = h.pick(TWO_REACTANT);
    const [A, B] = reactantsOf(r);
    let mA; let mB; let eA; let eB;
    for (let i = 0; i < 40; i++) {
      mA = h.int(50, 999) / 10;
      mB = h.int(50, 999) / 10;
      eA = mA / A.M / A.c;
      eB = mB / B.M / B.c;
      // Also reject "exactly half the excess is used": then used == left and the slate collapses.
      const usedShare = Math.min(eA, eB) / Math.max(eA, eB);
      if (Math.abs(eA - eB) / Math.max(eA, eB) > 0.25 && Math.abs(usedShare - 0.5) > 0.05) break;
    }
    const [L, X, mX, nL] = eA < eB ? [A, B, mB, mA / A.M] : [B, A, mA, mB / B.M];
    const ext = Math.min(eA, eB);
    const nX = mX / X.M;
    const usedX = ext * X.c;
    const left = (nX - usedX) * X.M;
    const cands = [
      { value: g(usedX * X.M), error: 'reported-amount-consumed', why: `found how much ${X.f} REACTS and stopped. The question asks what is left: start minus used` },
      { value: g((nX - nL) * X.M), error: 'ignored-mole-ratio', why: `subtracted moles of ${L.f} from moles of ${X.f} one-for-one. They react ${L.c}:${X.c}` },
      { value: g((nX - nL * L.c / X.c) * X.M), error: 'inverted-mole-ratio', why: `converted moles of ${L.f} to ${X.f} with the ratio upside down` },
      { value: g(mX), error: 'no-reaction-assumed', why: `reported the starting mass of ${X.f}. Some of it is consumed before ${L.f} runs out` },
      { value: g(nX - usedX), error: 'stopped-at-moles', why: `found the moles of ${X.f} left and reported them as grams. Multiply by ${X.M} g/mol` },
      { value: g(mX - (L === A ? mA : mB)), error: 'subtracted-grams', why: 'subtracted the two starting masses directly. Reactants combine by moles, not grams' },
    ].filter((d) => !d.value.startsWith('-') && d.value !== '0 g');
    return {
      stem: `${r.eq}\n${mA.toFixed(1)} g of ${A.f} and ${mB.toFixed(1)} g of ${B.f} react until the limiting reactant is used up. What mass of the excess reactant remains?`,
      ...h.choices(g(left), cands),
      explanation: `${A.f}: ${mA.toFixed(1)} ÷ ${A.M} = ${(mA / A.M).toFixed(4)} mol; ÷ ${A.c} = ${eA.toFixed(4)}.\n${B.f}: ${mB.toFixed(1)} ÷ ${B.M} = ${(mB / B.M).toFixed(4)} mol; ÷ ${B.c} = ${eB.toFixed(4)}.\nSmaller number → ${L.f} is limiting; ${X.f} is in excess.\n${X.f} used = ${ext.toFixed(4)} × ${X.c} = ${usedX.toFixed(4)} mol. Left = ${nX.toFixed(4)} − ${usedX.toFixed(4)} = ${(nX - usedX).toFixed(4)} mol × ${X.M} g/mol = ${sig(left)} g.`,
    };
  },
});

// ---------------------------------------------------------------------------
// titration: molar mass of an unknown (possibly polyprotic) acid
// ---------------------------------------------------------------------------
const ACIDS = [
  { name: 'a monoprotic acid, HA', p: 1, MM: 204.22 },
  { name: 'a monoprotic acid, HA', p: 1, MM: 122.12 },
  { name: 'a diprotic acid, H₂A', p: 2, MM: 90.03 },
  { name: 'a diprotic acid, H₂A', p: 2, MM: 104.06 },
  { name: 'a diprotic acid, H₂A', p: 2, MM: 118.09 },
  { name: 'a triprotic acid, H₃A', p: 3, MM: 192.12 },
  { name: 'a triprotic acid, H₃A', p: 3, MM: 97.99 },
];

registerChemTemplate({
  id: 'chem1-acs-05-titration-molar-mass',
  chapterId: CH5,
  section: '4-6',
  band: 5,
  name: 'Molar mass of an unknown acid from a titration',
  concepts: ['titration-calculations'],
  generate: (rng, h) => {
    const a = h.pick(ACIDS);
    const M = h.pick([0.100, 0.150, 0.200, 0.250]);
    // Draw the buret reading first (15-45 mL, a real titration) and size the sample to it.
    const vTarget = h.int(1500, 4500) / 100;
    const mass = Math.round(((vTarget / 1000) * M / a.p) * a.MM * 1000) / 1000;
    const V = Math.round(((mass / a.MM) * a.p / M) * 1000 * 100) / 100;
    const nBase = (M * V) / 1000;
    const nAcid = nBase / a.p;
    const mm = mass / nAcid;
    const unit = (x) => `${sig(x)} g/mol`;
    return {
      stem: `A ${mass.toFixed(3)}-g sample of ${a.name}, is dissolved in water and titrated to its equivalence point with ${V.toFixed(2)} mL of ${M.toFixed(3)} M NaOH. Every acidic hydrogen is neutralized. What is the molar mass of the acid?`,
      ...h.choices(unit(mm), [
        { value: unit(mass / nBase), error: 'ignored-acidic-hydrogens', why: `treated moles of NaOH as moles of acid. Each acid molecule uses ${a.p} OH⁻` },
        { value: unit(mass / (nBase * a.p)), error: 'inverted-proton-ratio', why: `multiplied the moles of NaOH by ${a.p} instead of dividing` },
        { value: unit(mass / (nBase / 2)), error: 'assumed-diprotic', why: 'assumed two acidic hydrogens; the problem states how many there are' },
        { value: unit(mass / (nBase / 3)), error: 'assumed-triprotic', why: 'assumed three acidic hydrogens; the problem states how many there are' },
        { value: unit(mass / ((M * V) / a.p)), error: 'used-mL-not-L', why: 'multiplied molarity by milliliters. Convert to liters first (÷ 1000)' },
      ]),
      explanation: `mol NaOH = ${M.toFixed(3)} mol/L × ${(V / 1000).toFixed(5)} L = ${nBase.toExponential(3)} mol.\n${a.p === 1 ? 'One acidic H per molecule, so mol acid = mol NaOH' : `${a.p} acidic H per molecule, so mol acid = mol NaOH ÷ ${a.p}`} = ${nAcid.toExponential(3)} mol.\nMolar mass = ${mass.toFixed(3)} g ÷ ${nAcid.toExponential(3)} mol = ${sig(mm)} g/mol.`,
    };
  },
});

// ---------------------------------------------------------------------------
// molarity: ion concentration after mixing two solutions that share an ion
// ---------------------------------------------------------------------------
const MIXES = [
  { ion: 'Cl⁻', a: { f: 'NaCl', k: 1 }, b: { f: 'CaCl₂', k: 2 } },
  { ion: 'Cl⁻', a: { f: 'KCl', k: 1 }, b: { f: 'AlCl₃', k: 3 } },
  { ion: 'Na⁺', a: { f: 'NaCl', k: 1 }, b: { f: 'Na₂SO₄', k: 2 } },
  { ion: 'NO₃⁻', a: { f: 'KNO₃', k: 1 }, b: { f: 'Mg(NO₃)₂', k: 2 } },
  { ion: 'K⁺', a: { f: 'KBr', k: 1 }, b: { f: 'K₃PO₄', k: 3 } },
];

registerChemTemplate({
  id: 'chem1-acs-05-mixed-ion-concentration',
  chapterId: CH5,
  section: '3-4',
  band: 4,
  name: 'Ion concentration after mixing two solutions',
  concepts: ['dilution-calculations', 'molar-concentration-definition'],
  generate: (rng, h) => {
    const x = h.pick(MIXES);
    const VOLS = [25.0, 50.0, 75.0, 100.0, 150.0];
    const v1 = h.pick(VOLS);
    let v2 = h.pick(VOLS);
    while (v2 === v1) v2 = h.pick(VOLS);
    const M1 = h.pick([0.100, 0.200, 0.250, 0.400, 0.500]);
    const M2 = h.pick([0.100, 0.150, 0.200, 0.300]);
    const mol = v1 * M1 * x.a.k + v2 * M2 * x.b.k;
    const ans = mol / (v1 + v2);
    const M = (y) => `${sig(y)} M`;
    return {
      stem: `${v1.toFixed(1)} mL of ${M1.toFixed(3)} M ${x.a.f} is mixed with ${v2.toFixed(1)} mL of ${M2.toFixed(3)} M ${x.b.f}. Both salts dissolve completely. What is the concentration of ${x.ion} in the mixture?`,
      ...h.choices(M(ans), [
        { value: M((v1 * M1 + v2 * M2) / (v1 + v2)), error: 'ignored-ion-count', why: `forgot that each ${x.b.f} releases ${x.b.k} ${x.ion}` },
        { value: M(M1 * x.a.k + M2 * x.b.k), error: 'added-concentrations', why: 'added the two concentrations. Mixing DILUTES both: add the moles, then divide by the total volume' },
        { value: M((M1 * x.a.k + M2 * x.b.k) / 2), error: 'averaged-concentrations', why: 'averaged the two concentrations. That only works when the volumes are equal' },
        { value: M(mol / v1), error: 'forgot-total-volume', why: `divided by only the first solution's ${v1.toFixed(1)} mL instead of the combined ${(v1 + v2).toFixed(1)} mL` },
      ]),
      explanation: `mol ${x.ion} from ${x.a.f} = ${(v1 / 1000).toFixed(4)} L × ${M1.toFixed(3)} M × ${x.a.k} = ${((v1 * M1 * x.a.k) / 1000).toFixed(5)} mol.\nmol ${x.ion} from ${x.b.f} = ${(v2 / 1000).toFixed(4)} L × ${M2.toFixed(3)} M × ${x.b.k} = ${((v2 * M2 * x.b.k) / 1000).toFixed(5)} mol.\nTotal ${(mol / 1000).toFixed(5)} mol ÷ ${((v1 + v2) / 1000).toFixed(4)} L = ${sig(ans)} M.`,
    };
  },
});

// ---------------------------------------------------------------------------
// gravimetric-analysis: precipitate mass from two solutions (limiting reactant in solution)
// ---------------------------------------------------------------------------
const PRECIPS = [
  { a: 'AgNO₃', ca: 1, b: 'NaCl', cb: 1, ppt: 'AgCl', cp: 1, M: 143.32, eq: 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)' },
  { a: 'BaCl₂', ca: 1, b: 'Na₂SO₄', cb: 1, ppt: 'BaSO₄', cp: 1, M: 233.39, eq: 'BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s) + 2NaCl(aq)' },
  { a: 'Pb(NO₃)₂', ca: 1, b: 'KI', cb: 2, ppt: 'PbI₂', cp: 1, M: 461.0, eq: 'Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s) + 2KNO₃(aq)' },
  { a: 'AgNO₃', ca: 2, b: 'K₂CrO₄', cb: 1, ppt: 'Ag₂CrO₄', cp: 1, M: 331.73, eq: '2AgNO₃(aq) + K₂CrO₄(aq) → Ag₂CrO₄(s) + 2KNO₃(aq)' },
  { a: 'CaCl₂', ca: 3, b: 'Na₃PO₄', cb: 2, ppt: 'Ca₃(PO₄)₂', cp: 1, M: 310.18, eq: '3CaCl₂(aq) + 2Na₃PO₄(aq) → Ca₃(PO₄)₂(s) + 6NaCl(aq)' },
];

registerChemTemplate({
  id: 'chem1-acs-05-precipitate-mass',
  chapterId: CH5,
  section: '4-6',
  band: 5,
  name: 'Mass of precipitate from two solutions',
  concepts: ['gravimetric-analysis'],
  generate: (rng, h) => {
    const p = h.pick(PRECIPS);
    let va; let vb; let ma; let mb; let eA; let eB;
    for (let i = 0; i < 40; i++) {
      va = h.pick([25.0, 50.0, 75.0, 100.0]);
      vb = h.pick([25.0, 50.0, 75.0, 100.0]);
      ma = h.pick([0.100, 0.150, 0.200, 0.300]);
      mb = h.pick([0.100, 0.150, 0.200, 0.300]);
      eA = (va * ma) / 1000 / p.ca;
      eB = (vb * mb) / 1000 / p.cb;
      if (Math.abs(eA - eB) / Math.max(eA, eB) > 0.2) break;
    }
    const ext = Math.min(eA, eB);
    const mass = ext * p.cp * p.M;
    return {
      stem: `${va.toFixed(1)} mL of ${ma.toFixed(3)} M ${p.a} is mixed with ${vb.toFixed(1)} mL of ${mb.toFixed(3)} M ${p.b}:\n${p.eq}\nWhat is the maximum mass of ${p.ppt} that can precipitate?`,
      ...h.choices(g(mass), [
        { value: g(Math.max(eA, eB) * p.cp * p.M), error: 'used-excess-reactant', why: 'based the yield on the reactant in excess. The precipitate stops forming when the limiting reactant runs out' },
        { value: g(Math.min(eA * p.ca, eB * p.cb) * p.M), error: 'ignored-coefficients', why: 'compared raw moles without dividing by the coefficients, so it picked the wrong limiting amount' },
        { value: g((eA + eB) * p.cp * p.M), error: 'added-both-reactants', why: 'added the yield each solution could give on its own. Only one reaction happens' },
        { value: g(ext * p.cp * p.M * 1000), error: 'used-mL-not-L', why: 'multiplied molarity by milliliters without converting to liters' },
      ]),
      explanation: `mol ${p.a} = ${(va / 1000).toFixed(4)} L × ${ma.toFixed(3)} M = ${((va * ma) / 1000).toFixed(5)} mol; ÷ ${p.ca} = ${eA.toFixed(5)}.\nmol ${p.b} = ${(vb / 1000).toFixed(4)} L × ${mb.toFixed(3)} M = ${((vb * mb) / 1000).toFixed(5)} mol; ÷ ${p.cb} = ${eB.toFixed(5)}.\nThe smaller value limits: ${ext.toFixed(5)} mol ${p.ppt} × ${p.M} g/mol = ${sig(mass)} g.`,
    };
  },
});
