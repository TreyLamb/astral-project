// Solutions and Aqueous Reactions, Part 1. Original questions, informed by (never copied from)
// the ACS study guide's own "Knowledge Required" tags for this chapter — see curriculum.js's
// header comment for the source and courses/chem/PLAN.md for the doctrine this follows.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-05-solutions-aqueous-1';

// --- shared reference data --------------------------------------------------

const STRONG_ACIDS = ['HCl', 'HBr', 'HI', 'HNO₃', 'H₂SO₄', 'HClO₄'];
const STRONG_BASES = ['NaOH', 'KOH', 'Ca(OH)₂', 'Ba(OH)₂'];
const SOLUBLE_IONIC = ['NaCl', 'KBr', 'NH₄NO₃', 'K₂SO₄', 'LiCl'];
const WEAK_ACIDS_BASES = ['CH₃COOH (acetic acid)', 'HF', 'NH₃', 'HNO₂'];
const NONELECTROLYTES = ['C₆H₁₂O₆ (glucose)', 'C₂H₅OH (ethanol)', 'C₁₂H₂₂O₁₁ (sucrose)', 'CH₃OH (methanol)'];

registerChemTemplate({
  id: 'chem1-05-electrolyte-classify',
  chapterId: CH,
  section: '4-3',
  band: 1,
  name: 'Classifying strong/weak electrolytes and nonelectrolytes',
  concepts: ['electrolyte-strong-vs-weak'],
  generate: (rng, h) => {
    const CATEGORIES = [
      { pool: [...STRONG_ACIDS, ...STRONG_BASES, ...SOLUBLE_IONIC], correct: 'strong electrolyte' },
      { pool: WEAK_ACIDS_BASES, correct: 'weak electrolyte' },
      { pool: NONELECTROLYTES, correct: 'nonelectrolyte' },
    ];
    const cat = h.pick(CATEGORIES);
    const substance = h.pick(cat.pool);
    const ALL = ['strong electrolyte', 'weak electrolyte', 'nonelectrolyte'];
    const distractors = ALL.filter((v) => v !== cat.correct).map((v) => ({
      value: v,
      error: 'electrolyte-miscategorized',
      why: `called it a ${v} instead`,
    }));
    return {
      stem: `When ${substance} is dissolved in water, is the resulting solution best classified as a strong electrolyte, a weak electrolyte, or a nonelectrolyte?`,
      ...h.choices(cat.correct, distractors),
      explanation: `A strong electrolyte ionizes essentially completely (strong acids, strong bases, and soluble ionic compounds). A weak electrolyte only partially ionizes (weak acids/bases like NH₃ or CH₃COOH). A nonelectrolyte dissolves as intact molecules and produces no ions (most molecular compounds, like sugars and alcohols).`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-05-molarity-definition',
  chapterId: CH,
  section: '3-4',
  band: 1,
  name: 'Definition of molar concentration',
  concepts: ['molar-concentration-definition'],
  generate: (rng, h) => {
    const mol = h.int(1, 8) / 2; // 0.5 .. 4.0
    // vol = 1 is excluded: at exactly 1 L, mol/vol, mol*vol, and mol itself are all the same
    // number, which would silently collapse three distinct "wrong move" distractors onto the
    // correct answer instead of being real, distinguishable mistakes.
    const vol = h.pick([0.5, 2, 4]);
    const molarity = +(mol / vol).toFixed(2);
    return {
      stem: `A solution contains ${mol.toFixed(1)} mol of dissolved solute in ${vol.toFixed(1)} L of solution. What is its molar concentration (molarity)?`,
      ...h.choices(
        { value: `${molarity.toFixed(2)} M` },
        [
          { value: `${(mol * vol).toFixed(2)} M`, error: 'multiplied-instead', why: 'multiplied moles by volume instead of dividing' },
          { value: `${(vol / mol).toFixed(2)} M`, error: 'inverted-ratio', why: 'divided volume by moles instead of moles by volume' },
          { value: `${mol.toFixed(2)} M`, error: 'ignored-volume', why: 'reported the moles of solute and ignored the solution volume entirely' },
        ],
      ),
      explanation: `Molar concentration (molarity, M) is defined as moles of solute per liter of SOLUTION: M = mol / L = ${mol.toFixed(1)} mol / ${vol.toFixed(1)} L = ${molarity.toFixed(2)} M.`,
    };
  },
});

const SOLUTES = [
  { formula: 'NaCl', molarMass: 58.44 },
  { formula: 'NaOH', molarMass: 40.00 },
  { formula: 'KCl', molarMass: 74.55 },
  { formula: 'CaCl₂', molarMass: 110.98 },
  { formula: 'C₆H₁₂O₆', molarMass: 180.16 },
  { formula: 'Na₂CO₃', molarMass: 105.99 },
];

registerChemTemplate({
  id: 'chem1-05-molarity-from-mass',
  chapterId: CH,
  section: '3-4',
  band: 2,
  name: 'Molarity from a measured mass',
  concepts: ['molarity-from-mass'],
  generate: (rng, h) => {
    const solute = h.pick(SOLUTES);
    // 1.0 L is excluded: at volumeL = 1, moles / volumeL and moles * volumeL are the same
    // number, so the "multiplied instead of divided" distractor would silently collapse onto
    // the correct answer instead of being a real, distinct mistake.
    const volumeL = h.pick([0.25, 0.5, 1.5, 2.0]);
    const massG = h.int(5, 40);
    const moles = massG / solute.molarMass;
    const molarity = moles / volumeL;
    return {
      stem: `You dissolve ${massG.toFixed(1)} g of ${solute.formula} (molar mass ${solute.molarMass.toFixed(2)} g/mol) in enough water to make ${volumeL.toFixed(2)} L of solution. What is the molarity?`,
      ...h.choices(
        { value: `${molarity.toFixed(3)} M` },
        [
          { value: `${(massG / volumeL).toFixed(3)} M`, error: 'skipped-molar-mass', why: 'divided the mass in grams directly by volume, skipping the conversion to moles' },
          { value: `${(moles * volumeL).toFixed(3)} M`, error: 'multiplied-instead', why: 'multiplied moles by volume instead of dividing' },
          { value: `${(massG * solute.molarMass / volumeL).toFixed(3)} M`, error: 'multiplied-by-molar-mass', why: 'multiplied by the molar mass instead of dividing by it when converting grams to moles' },
        ],
      ),
      explanation: `First convert mass to moles: ${massG.toFixed(1)} g ÷ ${solute.molarMass.toFixed(2)} g/mol = ${moles.toFixed(4)} mol. Then M = mol / L = ${moles.toFixed(4)} / ${volumeL.toFixed(2)} = ${molarity.toFixed(3)} M.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-05-dilution',
  chapterId: CH,
  section: '3-4',
  band: 2,
  name: 'Dilution calculations (M₁V₁ = M₂V₂)',
  concepts: ['dilution-calculations'],
  generate: (rng, h) => {
    const askFor = h.pick(['finalVolume', 'finalMolarity', 'stockVolume']);
    const m1 = h.pick([0.5, 1.0, 2.0, 3.0, 6.0]);
    const v1 = h.int(10, 100); // mL
    if (askFor === 'finalVolume') {
      const m2 = m1 / h.pick([2, 3, 4, 5]);
      const v2 = (m1 * v1) / m2;
      return {
        stem: `You dilute ${v1.toFixed(1)} mL of a ${m1.toFixed(1)} M stock solution to a final concentration of ${m2.toFixed(3)} M. What is the final volume?`,
        ...h.choices(
          { value: `${v2.toFixed(1)} mL` },
          [
            { value: `${(m2 * v1 / m1).toFixed(1)} mL`, error: 'inverted-ratio', why: 'set up M₁V₁ = M₂V₂ with the concentrations swapped' },
            { value: `${(v1 * m1 / m2 - v1).toFixed(1)} mL`, error: 'reported-water-added', why: 'reported only the volume of water added, not the total final volume' },
            { value: `${v1.toFixed(1)} mL`, error: 'ignored-dilution', why: 'left the volume unchanged and ignored the dilution' },
          ],
        ),
        explanation: `M₁V₁ = M₂V₂: (${m1.toFixed(1)} M)(${v1.toFixed(1)} mL) = (${m2.toFixed(3)} M)(V₂), so V₂ = ${(m1 * v1).toFixed(2)} / ${m2.toFixed(3)} = ${v2.toFixed(1)} mL.`,
      };
    }
    if (askFor === 'finalMolarity') {
      const v2 = v1 * h.pick([2, 3, 4, 5]);
      const m2 = (m1 * v1) / v2;
      return {
        stem: `You dilute ${v1.toFixed(1)} mL of a ${m1.toFixed(1)} M stock solution up to a total volume of ${v2.toFixed(1)} mL. What is the new molarity?`,
        ...h.choices(
          { value: `${m2.toFixed(3)} M` },
          [
            { value: `${(m1 * v2 / v1).toFixed(3)} M`, error: 'inverted-ratio', why: 'set up M₁V₁ = M₂V₂ with the volumes swapped' },
            { value: `${m1.toFixed(3)} M`, error: 'ignored-dilution', why: 'left the concentration unchanged and ignored the dilution' },
            { value: `${(m1 * (v2 - v1) / v1).toFixed(3)} M`, error: 'used-water-volume', why: 'used only the volume of water added instead of the total final volume' },
          ],
        ),
        explanation: `M₁V₁ = M₂V₂: (${m1.toFixed(1)} M)(${v1.toFixed(1)} mL) = M₂(${v2.toFixed(1)} mL), so M₂ = ${(m1 * v1).toFixed(2)} / ${v2.toFixed(1)} = ${m2.toFixed(3)} M.`,
      };
    }
    // stockVolume: how much stock do you need to make a target diluted solution?
    // divisor excludes 2 on purpose: at exactly a 2x dilution, "water added" and "stock needed"
    // are numerically identical (both are half the final volume), which would silently collapse
    // the reportedWaterAdded distractor onto the correct answer instead of being a real mistake.
    const m2 = m1 / h.pick([3, 4, 5]);
    const v2 = h.int(100, 500);
    const v1needed = (m2 * v2) / m1;
    return {
      stem: `You need to prepare ${v2.toFixed(1)} mL of a ${m2.toFixed(3)} M solution using a ${m1.toFixed(1)} M stock solution. What volume of stock solution should you measure out?`,
      ...h.choices(
        { value: `${v1needed.toFixed(1)} mL` },
        [
          { value: `${(m1 * v2 / m2).toFixed(1)} mL`, error: 'inverted-ratio', why: 'set up M₁V₁ = M₂V₂ with the concentrations swapped' },
          { value: `${v2.toFixed(1)} mL`, error: 'ignored-dilution', why: 'used the target volume directly as the stock volume' },
          { value: `${(v2 - v1needed).toFixed(1)} mL`, error: 'reported-water-added', why: 'reported the volume of water to add instead of the volume of stock solution needed' },
        ],
      ),
      explanation: `M₁V₁ = M₂V₂: V₁ = M₂V₂ / M₁ = (${m2.toFixed(3)} M)(${v2.toFixed(1)} mL) / ${m1.toFixed(1)} M = ${v1needed.toFixed(1)} mL of stock, then add water up to ${v2.toFixed(1)} mL total.`,
    };
  },
});

// Solubility rule pairs: [cation-or-anion group, forms with, soluble?, ruleName]
const SOLUBILITY_CASES = [
  { salt: 'AgCl', soluble: false, rule: 'chlorides are soluble except with Ag⁺, Pb²⁺, and Hg₂²⁺' },
  { salt: 'PbI₂', soluble: false, rule: 'iodides are soluble except with Ag⁺, Pb²⁺, and Hg₂²⁺' },
  { salt: 'BaSO₄', soluble: false, rule: 'sulfates are soluble except with Ba²⁺, Pb²⁺, Ca²⁺, and Sr²⁺' },
  { salt: 'CaCO₃', soluble: false, rule: 'carbonates are insoluble except with Group 1 metals and NH₄⁺' },
  { salt: 'Ca₃(PO₄)₂', soluble: false, rule: 'phosphates are insoluble except with Group 1 metals and NH₄⁺' },
  { salt: 'Mg(OH)₂', soluble: false, rule: 'hydroxides are insoluble except with Group 1 metals, NH₄⁺, and Ba²⁺' },
  { salt: 'NaNO₃', soluble: true, rule: 'all nitrates are soluble' },
  { salt: 'KCl', soluble: true, rule: 'chlorides are soluble except with Ag⁺, Pb²⁺, and Hg₂²⁺, and K⁺ is not one of those' },
  { salt: 'NH₄Br', soluble: true, rule: 'all ammonium salts are soluble' },
  { salt: 'K₂SO₄', soluble: true, rule: 'sulfates are soluble except with Ba²⁺, Pb²⁺, Ca²⁺, and Sr²⁺, and K⁺ is not one of those' },
];

registerChemTemplate({
  id: 'chem1-05-solubility-predict',
  chapterId: CH,
  section: '4-3',
  band: 2,
  name: 'Applying solubility rules',
  concepts: ['solubility-rules-precipitation'],
  generate: (rng, h) => {
    const c = h.pick(SOLUBILITY_CASES);
    const correct = c.soluble ? 'soluble' : 'insoluble (forms a precipitate)';
    const wrong = c.soluble ? 'insoluble (forms a precipitate)' : 'soluble';
    return {
      stem: `According to the standard solubility rules, is ${c.salt} soluble or insoluble in water?`,
      ...h.choices(
        correct,
        [{ value: wrong, error: 'solubility-rule-misapplied', why: 'applied the opposite solubility rule for this ion combination' }],
      ),
      explanation: `${c.salt} is ${c.soluble ? 'soluble' : 'insoluble'} because ${c.rule}.`,
    };
  },
});

const PRECIPITATION_REACTIONS = [
  {
    r1: 'AgNO₃(aq)', r2: 'NaCl(aq)',
    precipitate: 'AgCl(s)', spectatorCation: 'Na⁺', spectatorAnion: 'NO₃⁻',
    netIonic: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)',
  },
  {
    r1: 'Pb(NO₃)₂(aq)', r2: 'KI(aq)',
    precipitate: 'PbI₂(s)', spectatorCation: 'K⁺', spectatorAnion: 'NO₃⁻',
    netIonic: 'Pb²⁺(aq) + 2 I⁻(aq) → PbI₂(s)',
  },
  {
    r1: 'BaCl₂(aq)', r2: 'Na₂SO₄(aq)',
    precipitate: 'BaSO₄(s)', spectatorCation: 'Na⁺', spectatorAnion: 'Cl⁻',
    netIonic: 'Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)',
  },
  {
    r1: 'CaCl₂(aq)', r2: 'Na₂CO₃(aq)',
    precipitate: 'CaCO₃(s)', spectatorCation: 'Na⁺', spectatorAnion: 'Cl⁻',
    netIonic: 'Ca²⁺(aq) + CO₃²⁻(aq) → CaCO₃(s)',
  },
];

registerChemTemplate({
  id: 'chem1-05-net-ionic-equation',
  chapterId: CH,
  section: '4-3',
  band: 3,
  name: 'Writing the net ionic equation for a precipitation reaction',
  concepts: ['net-ionic-equations', 'solubility-rules-precipitation'],
  generate: (rng, h) => {
    const rxn = h.pick(PRECIPITATION_REACTIONS);
    return {
      stem: `Aqueous ${rxn.r1} is mixed with aqueous ${rxn.r2}, producing a precipitate of ${rxn.precipitate}. What is the correct net ionic equation for this reaction (spectator ions removed)?`,
      ...h.choices(
        { value: rxn.netIonic },
        [
          {
            value: `${rxn.spectatorCation}(aq) + ${rxn.spectatorAnion}(aq) → ${rxn.spectatorCation}${rxn.spectatorAnion}(aq)`,
            error: 'kept-spectators-only',
            why: 'wrote an equation for the two spectator ions instead of the ions that actually form the precipitate',
          },
          {
            value: `${rxn.r1} + ${rxn.r2} → ${rxn.precipitate} + spectator products`,
            error: 'wrote-molecular-equation',
            why: 'wrote the full molecular equation instead of removing the spectator ions to get the net ionic equation',
          },
          {
            value: rxn.netIonic.replace('→', '⇌'),
            error: 'wrong-reaction-direction',
            why: 'wrote the precipitation as a reversible/equilibrium process instead of a one-way reaction that removes ions from solution',
          },
        ],
      ),
      explanation: `Split both reactants into ions, cancel the spectator ions that appear unchanged on both sides (${rxn.spectatorCation} and ${rxn.spectatorAnion} here), and keep only what actually reacts: ${rxn.netIonic}.`,
    };
  },
});

const WEAK_ACID_PARTICULATE = [
  { acid: 'HF', formula: 'HF', ionA: 'H⁺', ionB: 'F⁻' },
  { acid: 'acetic acid', formula: 'CH₃COOH', ionA: 'H⁺', ionB: 'CH₃COO⁻' },
  { acid: 'nitrous acid', formula: 'HNO₂', ionA: 'H⁺', ionB: 'NO₂⁻' },
];

registerChemTemplate({
  id: 'chem1-05-weak-acid-particulate',
  chapterId: CH,
  section: '4-3',
  band: 2,
  name: 'Reading a particulate diagram of a weak acid',
  concepts: ['weak-acid-particulate-representation'],
  generate: (rng, h) => {
    const acid = h.pick(WEAK_ACID_PARTICULATE);
    const total = h.int(8, 12);
    const ionizedPairs = h.int(1, 2); // small fraction ionized, characteristic of a weak acid
    const intact = total - ionizedPairs;
    return {
      stem: `A particulate diagram shows a beaker of dissolved ${acid.acid} (${acid.formula}): ${intact} intact ${acid.formula} molecules, plus ${ionizedPairs} separate ${acid.ionA} ion(s) and ${ionizedPairs} separate ${acid.ionB} ion(s) — no other species present. What does this diagram represent?`,
      ...h.choices(
        `a weak acid, mostly un-ionized in solution`,
        [
          { value: 'a strong acid, fully ionized in solution', error: 'strong-weak-confused', why: 'called it a strong acid, but a strong acid diagram would show zero intact molecules, only ions' },
          { value: 'a nonelectrolyte, producing no ions at all', error: 'ignored-ions-present', why: 'ignored that the diagram shows some ions present, which rules out a nonelectrolyte' },
          { value: 'a salt that is completely insoluble', error: 'misread-as-precipitate', why: 'misread a dissolved-and-partially-ionized species as an insoluble solid' },
        ],
      ),
      explanation: `Because most of the ${acid.formula} particles remain intact molecules with only a few ionized into ${acid.ionA} and ${acid.ionB}, the diagram shows partial ionization — the signature of a weak acid. A strong acid's diagram would show only ions and no intact molecules.`,
    };
  },
});

const OXNUM_COMPOUNDS = [
  { formula: 'H₂SO₄', target: 'S', answer: '+6', work: 'H is +1 (×2 = +2), O is −2 (×4 = −8); +2 + x − 8 = 0 → x = +6' },
  { formula: 'KMnO₄', target: 'Mn', answer: '+7', work: 'K is +1, O is −2 (×4 = −8); +1 + x − 8 = 0 → x = +7' },
  { formula: 'CO₃²⁻', target: 'C', answer: '+4', work: 'O is −2 (×3 = −6); overall charge is −2, so x − 6 = −2 → x = +4' },
  { formula: 'N₂O₅', target: 'N', answer: '+5', work: 'O is −2 (×5 = −10), two N atoms share the positive total; 2x − 10 = 0 → x = +5' },
  { formula: 'Cr₂O₇²⁻', target: 'Cr', answer: '+6', work: 'O is −2 (×7 = −14); overall charge is −2, so 2x − 14 = −2 → x = +6' },
  { formula: 'ClO₃⁻', target: 'Cl', answer: '+5', work: 'O is −2 (×3 = −6); overall charge is −1, so x − 6 = −1 → x = +5' },
];

registerChemTemplate({
  id: 'chem1-05-oxidation-number',
  chapterId: CH,
  section: '4-3',
  band: 3,
  name: 'Assigning oxidation numbers',
  concepts: ['oxidation-number-rules'],
  generate: (rng, h) => {
    const c = h.pick(OXNUM_COMPOUNDS);
    const answerNum = Number(c.answer);
    return {
      stem: `Using the standard oxidation-number rules (O is usually −2, H is usually +1, the sum equals the overall charge), what is the oxidation number of ${c.target} in ${c.formula}?`,
      ...h.choices(
        c.answer,
        [
          { value: `${-answerNum > 0 ? '+' : ''}${-answerNum}`, error: 'sign-error', why: 'flipped the sign of the final oxidation number' },
          { value: `${answerNum > 0 ? '+' : ''}${answerNum + 2}`, error: 'oxygen-rule-error', why: "miscounted oxygen's contribution (treated O as -1 or miscounted the number of O atoms)" },
          { value: `${answerNum > 0 ? '+' : ''}${answerNum - 1}`, error: 'charge-balance-error', why: 'set the sum of oxidation numbers equal to zero instead of the ion\'s actual overall charge' },
        ],
      ),
      explanation: `${c.work}. Oxidation number of ${c.target} = ${c.answer}.`,
    };
  },
});

const REDOX_PAIRS = [
  { species: 'Zn', before: 0, after: '+2', change: 'loses 2 electrons', label: 'oxidized' },
  { species: 'Cu²⁺', before: '+2', after: 0, change: 'gains 2 electrons', label: 'reduced' },
  { species: 'Fe²⁺', before: '+2', after: '+3', change: 'loses 1 electron', label: 'oxidized' },
  { species: 'Cl₂', before: 0, after: '−1', change: 'gains 1 electron (per atom)', label: 'reduced' },
  { species: 'Mg', before: 0, after: '+2', change: 'loses 2 electrons', label: 'oxidized' },
  { species: 'Ag⁺', before: '+1', after: 0, change: 'gains 1 electron', label: 'reduced' },
];

registerChemTemplate({
  id: 'chem1-05-oxidation-reduction-define',
  chapterId: CH,
  section: '4-3',
  band: 2,
  name: 'Identifying oxidation vs. reduction from a change in oxidation number',
  concepts: ['oxidation-reduction-definitions'],
  generate: (rng, h) => {
    const p = h.pick(REDOX_PAIRS);
    const opposite = p.label === 'oxidized' ? 'reduced' : 'oxidized';
    return {
      stem: `In a reaction, the oxidation number of ${p.species} changes from ${p.before} to ${p.after}. Is ${p.species} oxidized or reduced?`,
      ...h.choices(
        p.label,
        [
          { value: opposite, error: 'oxidation-reduction-swapped', why: `swapped the definitions — called an increase in oxidation number "${opposite}" (or a decrease "oxidized")` },
          { value: 'neither — this is not a redox process', error: 'missed-oxidation-number-change', why: 'failed to notice that the oxidation number actually changed, which is the definition of a redox process' },
        ],
      ),
      explanation: `Oxidation = LOSS of electrons = oxidation number INCREASES. Reduction = GAIN of electrons = oxidation number DECREASES. ${p.species} goes from ${p.before} to ${p.after} (${p.change}), so it is ${p.label}.`,
    };
  },
});

const REDOX_REACTIONS = [
  {
    equation: 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)',
    oxidized: 'Zn', reduced: 'Cu²⁺',
    oxidizingAgent: 'Cu²⁺', reducingAgent: 'Zn',
  },
  {
    equation: 'Mg(s) + 2 Ag⁺(aq) → Mg²⁺(aq) + 2 Ag(s)',
    oxidized: 'Mg', reduced: 'Ag⁺',
    oxidizingAgent: 'Ag⁺', reducingAgent: 'Mg',
  },
  {
    equation: 'Fe(s) + Pb²⁺(aq) → Fe²⁺(aq) + Pb(s)',
    oxidized: 'Fe', reduced: 'Pb²⁺',
    oxidizingAgent: 'Pb²⁺', reducingAgent: 'Fe',
  },
  {
    equation: '2 Al(s) + 3 Cu²⁺(aq) → 2 Al³⁺(aq) + 3 Cu(s)',
    oxidized: 'Al', reduced: 'Cu²⁺',
    oxidizingAgent: 'Cu²⁺', reducingAgent: 'Al',
  },
];

registerChemTemplate({
  id: 'chem1-05-oxidizing-reducing-agent',
  chapterId: CH,
  section: '5-2',
  band: 3,
  name: 'Identifying the oxidizing and reducing agents',
  concepts: ['oxidizing-reducing-agents', 'oxidation-reduction-definitions'],
  generate: (rng, h) => {
    const rxn = h.pick(REDOX_REACTIONS);
    const askFor = h.pick(['oxidizing', 'reducing']);
    const correct = askFor === 'oxidizing' ? rxn.oxidizingAgent : rxn.reducingAgent;
    const other = askFor === 'oxidizing' ? rxn.reducingAgent : rxn.oxidizingAgent;
    return {
      stem: `For the reaction ${rxn.equation}, which species is the ${askFor} agent?`,
      ...h.choices(
        correct,
        [
          { value: other, error: 'oxidizing-reducing-agent-swapped', why: 'swapped the oxidizing and reducing agents — the oxidizing agent is the species that gets REDUCED, and the reducing agent is the species that gets OXIDIZED' },
        ],
      ),
      explanation: `${rxn.oxidized} is oxidized (loses electrons) and is therefore the REDUCING agent. ${rxn.reduced} is reduced (gains electrons) and is therefore the OXIDIZING agent. The ${askFor} agent here is ${correct}.`,
    };
  },
});
