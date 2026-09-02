// Stoichiometry. Original questions, informed by (never copied from) the ACS study guide's own
// "Knowledge Required" tags for this chapter — see courses/PLAN.md's 2026-08-28 entry for the
// source and courses/chem/PLAN.md for the doctrine this follows.
//
// Every reaction below is balanced and every molar mass computed by hand against standard
// atomic weights (2 dp): H 1.01, C 12.01, N 14.01, O 16.00, Na 22.99, Mg 24.31, Al 26.98,
// S 32.06, Cl 35.45, Fe 55.85, Zn 65.38.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-04-stoichiometry';
const NA = 6.022e23;

// --- display helpers --------------------------------------------------------

// A molar mass like 32.00 or 28.02 must always go through toFixed(2) before it's shown — a
// bare JS number silently drops a meaningful trailing zero (32.00 -> "32"), the exact bug
// toolbox.js's sig-figs template documents and CLAUDE.md calls out by name.
const mm = (n) => n.toFixed(2);

const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const toSup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
const fmtSci = (n) => {
  const [mantissa, exp] = n.toExponential(2).split('e');
  return `${mantissa} × 10${toSup(parseInt(exp, 10))}`;
};

// --- reaction data (balanced by hand; see per-reaction comments) -----------

// Combustion of straight-chain alkanes. Coefficients within each row are the smallest whole
// numbers and are all pairwise DISTINCT (checked by hand) so "coefficient of species X" never
// collides with another species' coefficient for the same reaction — methane (1,2,1,2, two
// duplicate pairs) is deliberately excluded for that reason.
const COMBUSTIONS = [
  // 2C2H6 + 7O2 -> 4CO2 + 6H2O   C:4=4  H:12=12  O:14=8+6=14
  { formula: 'C₂H₆', name: 'ethane', a: 2, b: 7, c: 4, d: 6 },
  // C3H8 + 5O2 -> 3CO2 + 4H2O    C:3=3  H:8=8    O:10=6+4=10
  { formula: 'C₃H₈', name: 'propane', a: 1, b: 5, c: 3, d: 4 },
  // 2C4H10 + 13O2 -> 8CO2 + 10H2O   C:8=8  H:20=20  O:26=16+10=26
  { formula: 'C₄H₁₀', name: 'butane', a: 2, b: 13, c: 8, d: 10 },
  // C5H12 + 8O2 -> 5CO2 + 6H2O   C:5=5  H:12=12  O:16=10+6=16
  { formula: 'C₅H₁₂', name: 'pentane', a: 1, b: 8, c: 5, d: 6 },
];

// Two-reactant, one-product reactions with molar masses, for mole-ratio / mass / molecule
// questions. `product: true` marks the one product species in each row.
const REACTIONS3 = [
  { // N2 + 3H2 -> 2NH3   N:2=2  H:6=6
    eq: 'N₂ + 3H₂ → 2NH₃',
    species: [
      { label: 'N₂', coef: 1, molarMass: 28.02 },
      { label: 'H₂', coef: 3, molarMass: 2.02 },
      { label: 'NH₃', coef: 2, molarMass: 17.04, product: true },
    ],
  },
  { // 2H2 + O2 -> 2H2O   H:4=4  O:2=2
    eq: '2H₂ + O₂ → 2H₂O',
    species: [
      { label: 'H₂', coef: 2, molarMass: 2.02 },
      { label: 'O₂', coef: 1, molarMass: 32.00 },
      { label: 'H₂O', coef: 2, molarMass: 18.02, product: true },
    ],
  },
  { // 2SO2 + O2 -> 2SO3   S:2=2  O:4+2=6=6
    eq: '2SO₂ + O₂ → 2SO₃',
    species: [
      { label: 'SO₂', coef: 2, molarMass: 64.06 },
      { label: 'O₂', coef: 1, molarMass: 32.00 },
      { label: 'SO₃', coef: 2, molarMass: 80.06, product: true },
    ],
  },
  { // 4Fe + 3O2 -> 2Fe2O3   Fe:4=4  O:6=6
    eq: '4Fe + 3O₂ → 2Fe₂O₃',
    species: [
      { label: 'Fe', coef: 4, molarMass: 55.85 },
      { label: 'O₂', coef: 3, molarMass: 32.00 },
      { label: 'Fe₂O₃', coef: 2, molarMass: 159.70, product: true },
    ],
  },
  { // 2Al + 3Cl2 -> 2AlCl3   Al:2=2  Cl:6=6
    eq: '2Al + 3Cl₂ → 2AlCl₃',
    species: [
      { label: 'Al', coef: 2, molarMass: 26.98 },
      { label: 'Cl₂', coef: 3, molarMass: 70.90 },
      { label: 'AlCl₃', coef: 2, molarMass: 133.33, product: true },
    ],
  },
];

// Two-reactant, one-product reactions for limiting-reactant questions. `a`/`b` are the two
// reactants; `product` is the species whose yield gets computed.
const REACTIONS2 = [
  { // Zn + 2HCl -> ZnCl2 + H2   Zn:1=1  H:2=2  Cl:2=2
    eq: 'Zn + 2HCl → ZnCl₂ + H₂',
    a: { label: 'Zn', coef: 1, molarMass: 65.38 },
    b: { label: 'HCl', coef: 2, molarMass: 36.46 },
    product: { label: 'ZnCl₂', coef: 1, molarMass: 136.28 },
  },
  { // N2 + 3H2 -> 2NH3
    eq: 'N₂ + 3H₂ → 2NH₃',
    a: { label: 'N₂', coef: 1, molarMass: 28.02 },
    b: { label: 'H₂', coef: 3, molarMass: 2.02 },
    product: { label: 'NH₃', coef: 2, molarMass: 17.04 },
  },
  { // 2Mg + O2 -> 2MgO   Mg:2=2  O:2=2
    eq: '2Mg + O₂ → 2MgO',
    a: { label: 'Mg', coef: 2, molarMass: 24.31 },
    b: { label: 'O₂', coef: 1, molarMass: 32.00 },
    product: { label: 'MgO', coef: 2, molarMass: 40.31 },
  },
  { // 4Al + 3O2 -> 2Al2O3   Al:4=4  O:6=6
    eq: '4Al + 3O₂ → 2Al₂O₃',
    a: { label: 'Al', coef: 4, molarMass: 26.98 },
    b: { label: 'O₂', coef: 3, molarMass: 32.00 },
    product: { label: 'Al₂O₃', coef: 2, molarMass: 101.96 },
  },
  { // 2Na + Cl2 -> 2NaCl   Na:2=2  Cl:2=2
    eq: '2Na + Cl₂ → 2NaCl',
    a: { label: 'Na', coef: 2, molarMass: 22.99 },
    b: { label: 'Cl₂', coef: 1, molarMass: 70.90 },
    product: { label: 'NaCl', coef: 2, molarMass: 58.44 },
  },
  { // 2Al + 3Cl2 -> 2AlCl3
    eq: '2Al + 3Cl₂ → 2AlCl₃',
    a: { label: 'Al', coef: 2, molarMass: 26.98 },
    b: { label: 'Cl₂', coef: 3, molarMass: 70.90 },
    product: { label: 'AlCl₃', coef: 2, molarMass: 133.33 },
  },
];

// --- templates ---------------------------------------------------------------

registerChemTemplate({
  id: 'chem1-04-balance-coefficient',
  chapterId: CH,
  section: '4-2',
  band: 1,
  name: 'Balancing a combustion equation',
  concepts: ['balancing-chemical-equations'],
  generate: (rng, h) => {
    const r = h.pick(COMBUSTIONS);
    const SPECIES = [
      { label: r.formula, coef: r.a },
      { label: 'O₂', coef: r.b },
      { label: 'CO₂', coef: r.c },
      { label: 'H₂O', coef: r.d },
    ];
    const targetIdx = h.int(0, 3);
    const target = SPECIES[targetIdx];
    const others = SPECIES.filter((_, i) => i !== targetIdx);
    return {
      stem: `When the equation ___${r.formula} + ___O₂ → ___CO₂ + ___H₂O (combustion of ${r.name}) is balanced using the smallest whole-number coefficients, what is the coefficient of ${target.label}?`,
      ...h.choices(
        String(target.coef),
        others.map((s) => ({
          value: String(s.coef),
          error: 'wrong-species-coefficient',
          why: `gave the coefficient of ${s.label} instead of ${target.label}`,
        })),
      ),
      explanation: `Balanced: ${r.a}${r.formula} + ${r.b}O₂ → ${r.c}CO₂ + ${r.d}H₂O. The coefficient of ${target.label} is ${target.coef}.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-04-mole-ratio',
  chapterId: CH,
  section: '4-4',
  band: 1,
  name: 'Mole ratios from coefficients',
  concepts: ['mole-ratios-from-coefficients'],
  generate: (rng, h) => {
    const r = h.pick(REACTIONS3);
    // Only pair species whose coefficients differ, so the "ignored ratio" (1:1) and
    // "inverted ratio" distractors below can never silently equal the correct answer.
    const pairs = [];
    for (let i = 0; i < r.species.length; i++) {
      for (let j = 0; j < r.species.length; j++) {
        if (i !== j && r.species[i].coef !== r.species[j].coef) pairs.push([i, j]);
      }
    }
    const [fi, ti] = h.pick(pairs);
    const from = r.species[fi];
    const to = r.species[ti];
    const other = r.species.find((_, i) => i !== fi && i !== ti);
    const fromMoles = h.int(2, 9);
    // A `toFixed(2)` result stays a STRING here — round-tripping it through Number() (e.g.
    // `+x.toFixed(2)`) silently drops a meaningful trailing zero ("7.50" -> 7.5) and makes one
    // choice's decimal formatting disagree with its siblings. See CLAUDE.md's toolbox.js note.
    const answer = (fromMoles * (to.coef / from.coef)).toFixed(2);
    return {
      stem: `In the reaction ${r.eq}, how many moles of ${to.label} correspond to ${fromMoles} mol of ${from.label}, based on the coefficients in the balanced equation?`,
      ...h.choices(
        { value: `${answer} mol` },
        [
          {
            value: `${(fromMoles * (from.coef / to.coef)).toFixed(2)} mol`,
            error: 'inverted-mole-ratio',
            why: 'used the mole ratio upside down (flipped numerator and denominator)',
          },
          {
            value: `${fromMoles.toFixed(2)} mol`,
            error: 'ignored-mole-ratio',
            why: 'treated the reaction as a 1:1 mole ratio and ignored the coefficients',
          },
          {
            value: `${(fromMoles * (other.coef / from.coef)).toFixed(2)} mol`,
            error: 'wrong-species-coefficient',
            why: `used the coefficient of ${other.label} instead of ${to.label}`,
          },
        ],
      ),
      explanation: `Mole ratio from the balanced equation: ${to.coef} mol ${to.label} per ${from.coef} mol ${from.label}. ${fromMoles} mol ${from.label} × (${to.coef}/${from.coef}) = ${answer} mol ${to.label}.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-04-moles-to-mass',
  chapterId: CH,
  section: '4-4',
  band: 2,
  name: 'Moles of one species to mass of another',
  concepts: ['moles-to-mass-stoichiometry'],
  generate: (rng, h) => {
    const r = h.pick(REACTIONS3);
    const to = r.species.find((s) => s.product);
    const fromCandidates = r.species.filter((s) => !s.product);
    const from = h.pick(fromCandidates);
    const fromMoles = h.pick([1, 1.5, 2, 2.5, 3, 4, 5]);
    const molesTo = fromMoles * (to.coef / from.coef);
    const massTo = (molesTo * to.molarMass).toFixed(2);
    return {
      stem: `In the reaction ${r.eq}, ${fromMoles} mol of ${from.label} reacts completely. How many grams of ${to.label} (molar mass ${mm(to.molarMass)} g/mol) are produced?`,
      ...h.choices(
        { value: `${massTo} g` },
        [
          {
            value: `${(fromMoles * (from.coef / to.coef) * to.molarMass).toFixed(2)} g`,
            error: 'inverted-mole-ratio',
            why: 'used the mole ratio upside down (flipped numerator and denominator)',
          },
          {
            value: `${molesTo.toFixed(2)} g`,
            error: 'forgot-moles-to-mass',
            why: 'stopped after finding the moles of the target species and never multiplied by its molar mass',
          },
          {
            value: `${(molesTo * from.molarMass).toFixed(2)} g`,
            error: 'wrong-molar-mass',
            why: `used the molar mass of ${from.label} instead of ${to.label}`,
          },
        ],
      ),
      explanation: `Moles of ${to.label} = ${fromMoles} mol ${from.label} × (${to.coef}/${from.coef}) = ${molesTo.toFixed(3)} mol. Mass = ${molesTo.toFixed(3)} mol × ${mm(to.molarMass)} g/mol = ${massTo} g.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-04-limiting-reactant-id',
  chapterId: CH,
  section: '4-5',
  band: 2,
  name: 'Identifying the limiting reactant',
  concepts: ['limiting-reactant-theoretical-yield'],
  generate: (rng, h) => {
    const r = h.pick(REACTIONS2);
    const pool = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10];
    let molesA, molesB, ratioA, ratioB;
    do {
      molesA = h.pick(pool);
      molesB = h.pick(pool);
      ratioA = molesA / r.a.coef;
      ratioB = molesB / r.b.coef;
    } while (Math.abs(ratioA - ratioB) < 1e-9);
    const limiting = ratioA < ratioB ? r.a : r.b;
    const excess = ratioA < ratioB ? r.b : r.a;
    return {
      stem: `In the reaction ${r.eq}, you start with ${molesA} mol of ${r.a.label} and ${molesB} mol of ${r.b.label}. Which reactant is the limiting reactant?`,
      ...h.choices(
        limiting.label,
        [
          {
            value: excess.label,
            error: 'wrong-reactant-picked',
            why: `picked ${excess.label}, which is actually the reactant left over in excess`,
          },
          {
            value: 'Neither — they react in the exact stoichiometric ratio',
            error: 'assumed-exact-ratio',
            why: 'assumed the reactants were supplied in the exact stoichiometric ratio without checking',
          },
          {
            value: 'Cannot be determined without knowing the molar masses',
            error: 'thinks-mass-needed',
            why: 'the limiting reactant is found by comparing mole-to-coefficient ratios — molar mass is not needed for this comparison',
          },
        ],
      ),
      explanation: `Divide each mole amount by its coefficient: ${r.a.label} → ${molesA}/${r.a.coef} = ${ratioA.toFixed(3)}; ${r.b.label} → ${molesB}/${r.b.coef} = ${ratioB.toFixed(3)}. The smaller value (${limiting.label}) runs out first, so it is limiting.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-04-limiting-reactant-yield',
  chapterId: CH,
  section: '4-5',
  band: 3,
  name: 'Limiting reactant and theoretical yield',
  concepts: ['limiting-reactant-theoretical-yield'],
  generate: (rng, h) => {
    const r = h.pick(REACTIONS2);
    let massA, massB, molesA, molesB, ratioA, ratioB;
    do {
      massA = h.int(5, 60);
      massB = h.int(5, 60);
      molesA = massA / r.a.molarMass;
      molesB = massB / r.b.molarMass;
      ratioA = molesA / r.a.coef;
      ratioB = molesB / r.b.coef;
    } while (Math.abs(ratioA - ratioB) < 0.02 * Math.max(ratioA, ratioB));

    const aIsLimiting = ratioA < ratioB;
    const limitingRatio = aIsLimiting ? ratioA : ratioB;
    const excessRatio = aIsLimiting ? ratioB : ratioA;
    const limitingMoles = aIsLimiting ? molesA : molesB;
    const limitingCoef = aIsLimiting ? r.a.coef : r.b.coef;
    const limitingLabel = aIsLimiting ? r.a.label : r.b.label;
    const limitingMass = aIsLimiting ? massA : massB;

    const molesProduct = limitingRatio * r.product.coef;
    // Every mass below stays a toFixed(2) STRING — round-tripping through Number() would
    // silently drop a meaningful trailing zero and make one choice's decimals disagree with
    // its siblings (the exact bug documented in toolbox.js).
    const massProduct = (molesProduct * r.product.molarMass).toFixed(2);

    // Distractor 1: ran the calculation off the reactant in excess instead of the limiting one.
    const massFromExcess = (excessRatio * r.product.coef * r.product.molarMass).toFixed(2);
    // Distractor 2: used the given mass directly as moles, skipping the molar-mass division.
    const wrongMolesLimiting = limitingMass / limitingCoef;
    const massSkippedMolarMass = (wrongMolesLimiting * r.product.coef * r.product.molarMass).toFixed(2);
    // Distractor 3: found moles of product but never converted to grams.
    const molesAsIfGrams = molesProduct.toFixed(2);

    return {
      stem: `In the reaction ${r.eq}, you react ${massA} g of ${r.a.label} (molar mass ${mm(r.a.molarMass)} g/mol) with ${massB} g of ${r.b.label} (molar mass ${mm(r.b.molarMass)} g/mol). What is the theoretical yield of ${r.product.label} (molar mass ${mm(r.product.molarMass)} g/mol), in grams?`,
      ...h.choices(
        { value: `${massProduct} g` },
        [
          {
            value: `${massFromExcess} g`,
            error: 'used-excess-reactant',
            why: `calculated the yield from ${aIsLimiting ? r.b.label : r.a.label} (the reactant in excess) instead of the limiting reactant, ${limitingLabel}`,
          },
          {
            value: `${massSkippedMolarMass} g`,
            error: 'skipped-molar-mass-conversion',
            why: 'used the given mass of the limiting reactant directly as moles instead of dividing by its molar mass first',
          },
          {
            value: `${molesAsIfGrams} g`,
            error: 'forgot-moles-to-mass',
            why: 'found the moles of product but never multiplied by its molar mass to get grams',
          },
        ],
      ),
      explanation: `Moles: ${r.a.label} = ${massA}/${mm(r.a.molarMass)} = ${molesA.toFixed(3)} mol; ${r.b.label} = ${massB}/${mm(r.b.molarMass)} = ${molesB.toFixed(3)} mol. Divide by coefficients: ${ratioA.toFixed(3)} vs ${ratioB.toFixed(3)} — ${limitingLabel} is limiting. Moles of ${r.product.label} = ${limitingRatio.toFixed(3)} × ${r.product.coef} = ${molesProduct.toFixed(3)} mol × ${mm(r.product.molarMass)} g/mol = ${massProduct} g.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-04-molecules-to-moles',
  chapterId: CH,
  section: '4-2',
  band: 2,
  name: 'Molecules of product from moles of reactant',
  concepts: ['molecules-to-moles-relationship'],
  generate: (rng, h) => {
    const r = h.pick(REACTIONS3);
    const to = r.species.find((s) => s.product);
    const fromCandidates = r.species.filter((s) => !s.product);
    const from = h.pick(fromCandidates);
    const fromMoles = h.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);
    const molesTo = fromMoles * (to.coef / from.coef);
    const molecules = molesTo * NA;
    return {
      stem: `In the reaction ${r.eq}, ${fromMoles} mol of ${from.label} reacts completely. How many molecules of ${to.label} are produced? (Avogadro's number = 6.022 × 10²³ /mol.)`,
      ...h.choices(
        { value: fmtSci(molecules) },
        [
          {
            value: fmtSci(fromMoles * NA),
            error: 'ignored-mole-ratio',
            why: 'treated the reaction as a 1:1 mole ratio and ignored the coefficients',
          },
          {
            value: fmtSci(fromMoles * (from.coef / to.coef) * NA),
            error: 'inverted-mole-ratio',
            why: 'used the mole ratio upside down (flipped numerator and denominator)',
          },
          {
            value: molesTo.toFixed(2),
            error: 'forgot-avogadros-number',
            why: `gave the number of moles of ${to.label} (${molesTo.toFixed(2)}), not the number of molecules — forgot to multiply by Avogadro's number`,
          },
        ],
      ),
      explanation: `Moles of ${to.label} = ${fromMoles} mol ${from.label} × (${to.coef}/${from.coef}) = ${molesTo.toFixed(3)} mol. Molecules = ${molesTo.toFixed(3)} mol × 6.022 × 10²³/mol = ${fmtSci(molecules)}.`,
    };
  },
});
