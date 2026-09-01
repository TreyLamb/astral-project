// Heat and Enthalpy. Original questions, informed by (never copied from) the ACS study guide's
// own "Knowledge Required" tags for this chapter — see courses/PLAN.md's 2026-08-28 entry for the
// source and courses/chem/PLAN.md for the doctrine this follows.
//
// Sign convention used throughout (matches the lesson, ch06-heat-enthalpy.md):
//   q > 0  system absorbs heat        q < 0  system releases heat
//   w > 0  work done ON the system    w < 0  work done BY the system
//   ΔE = q + w
// Every hand-worked number below (bomb calorimetry, first law, enthalpy-of-formation
// manipulation, Hess's Law sums) was checked by hand before shipping — see the PLAN.md
// handoff note for this chapter for the worked derivations.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-06-heat-enthalpy';

// ---------------------------------------------------------------------------
// specific-heat-definition
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-specific-heat-definition',
  chapterId: CH,
  band: 1,
  name: 'What specific heat means',
  concepts: ['specific-heat-definition'],
  generate: (rng, h) => {
    const SUBSTANCES = [
      { name: 'water', c: '4.184' },
      { name: 'aluminum', c: '0.897' },
      { name: 'iron', c: '0.449' },
      { name: 'copper', c: '0.385' },
      { name: 'ethanol', c: '2.44' },
      { name: 'gold', c: '0.129' },
    ];
    const s = h.pick(SUBSTANCES);
    return {
      stem: `The specific heat of ${s.name} is ${s.c} J/(g·°C). What does this value represent?`,
      ...h.choices(
        `The energy required to raise the temperature of 1 gram of ${s.name} by 1°C`,
        [
          { value: `The energy required to raise the temperature of 1 mole of ${s.name} by 1°C`, error: 'confused-specific-with-molar-heat-capacity', why: 'used moles instead of grams — that describes molar heat capacity, not specific heat' },
          { value: `The total amount of thermal energy stored in 1 gram of ${s.name}`, error: 'confused-with-total-energy', why: 'described total stored energy rather than the energy needed for a 1°C change' },
          { value: `The temperature change produced by adding 1 joule of energy to 1 gram of ${s.name}`, error: 'inverted-relationship', why: 'inverted the relationship — that describes 1/(specific heat), not specific heat itself' },
        ],
      ),
      explanation: `Specific heat is defined per GRAM (not per mole) and per °C: it is the energy needed to raise 1 g of ${s.name} by 1°C. A substance with a high specific heat (like water) resists temperature change; one with a low specific heat (like gold) heats up easily.`,
    };
  },
});

// ---------------------------------------------------------------------------
// heat-mass-temperature-relationship — direct q = mcΔT calculation
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-heat-mass-temp',
  chapterId: CH,
  band: 1,
  name: 'q = mcΔT calculation',
  concepts: ['heat-mass-temperature-relationship'],
  generate: (rng, h) => {
    const SUBSTANCES = [
      { name: 'water', c: 4.184 },
      { name: 'aluminum', c: 0.897 },
      { name: 'iron', c: 0.449 },
      { name: 'copper', c: 0.385 },
      { name: 'ethanol', c: 2.44 },
    ];
    const s = h.pick(SUBSTANCES);
    const mass = h.int(15, 250); // g
    const tInit = h.int(10, 30); // °C
    const rise = h.int(15, 60); // °C, always heating
    const tFinal = tInit + rise;
    const qKJ = (mass * s.c * rise) / 1000;
    return {
      stem: `How much heat is required to warm ${mass} g of ${s.name} (specific heat ${s.c.toFixed(3)} J/(g·°C)) from ${tInit}°C to ${tFinal}°C?`,
      ...h.choices(
        { value: `${qKJ.toFixed(2)} kJ` },
        [
          { value: `${((s.c * rise) / 1000).toFixed(2)} kJ`, error: 'forgot-mass', why: 'left mass out of q = mcΔT' },
          { value: `${(mass * s.c * rise).toFixed(2)} kJ`, error: 'forgot-kj-conversion', why: 'calculated correctly in joules but forgot to convert to kJ (off by a factor of 1000)' },
          { value: `${((mass * s.c * tFinal) / 1000).toFixed(2)} kJ`, error: 'wrong-delta-t', why: 'used the final temperature itself as ΔT instead of (final − initial)' },
        ],
      ),
      explanation: `q = mcΔT = ${mass} g × ${s.c.toFixed(3)} J/(g·°C) × (${tFinal}°C − ${tInit}°C) = ${mass} × ${s.c.toFixed(3)} × ${rise} J = ${(mass * s.c * rise).toFixed(1)} J = ${qKJ.toFixed(2)} kJ.`,
    };
  },
});

// ---------------------------------------------------------------------------
// heat-mass-temperature-relationship — comparative reasoning, no arithmetic needed
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-heat-mass-temp-compare',
  chapterId: CH,
  band: 2,
  name: 'Comparing two substances via q = mcΔT',
  concepts: ['heat-mass-temperature-relationship'],
  generate: (rng, h) => {
    const SUBSTANCES = [
      { name: 'water', c: 4.184 },
      { name: 'aluminum', c: 0.897 },
      { name: 'iron', c: 0.449 },
      { name: 'copper', c: 0.385 },
      { name: 'ethanol', c: 2.44 },
      { name: 'gold', c: 0.129 },
    ];
    let A = h.pick(SUBSTANCES);
    let B = h.pick(SUBSTANCES);
    while (B.name === A.name) B = h.pick(SUBSTANCES);
    const [lo, hi] = A.c < B.c ? [A, B] : [B, A];
    const mode = h.pick(['same-heat', 'same-final']);

    const extraDistractor = { value: 'It cannot be determined without knowing the actual mass', error: 'thinks-mass-needed', why: 'the masses are equal (though unstated), so mass cancels out of the comparison — the specific heats alone decide the answer' };

    if (mode === 'same-heat') {
      return {
        stem: `Equal masses of ${A.name} (specific heat ${A.c.toFixed(3)} J/(g·°C)) and ${B.name} (specific heat ${B.c.toFixed(3)} J/(g·°C)) start at the same temperature. Each sample absorbs the same amount of heat. Which sample ends at the higher temperature?`,
        ...h.choices(
          lo.name,
          [
            { value: hi.name, error: 'inverted-c-relationship', why: 'assumed the substance with the larger specific heat ends up hotter, but ΔT = q/(mc) — with q and m fixed, a SMALLER specific heat produces a BIGGER temperature change' },
            { value: 'They end at the same temperature', error: 'ignored-specific-heat', why: 'ignored that the two substances have different specific heats' },
            extraDistractor,
          ],
        ),
        explanation: `ΔT = q/(mc). With mass and heat added equal for both samples, ΔT is inversely proportional to specific heat. ${lo.name} has the smaller specific heat (${lo.c.toFixed(3)} vs. ${hi.c.toFixed(3)} J/(g·°C)), so it heats up more and ends at the higher temperature.`,
      };
    }
    return {
      stem: `Equal masses of ${A.name} (specific heat ${A.c.toFixed(3)} J/(g·°C)) and ${B.name} (specific heat ${B.c.toFixed(3)} J/(g·°C)) start at the same initial temperature. To raise BOTH samples to the same final temperature, which one requires more heat?`,
      ...h.choices(
        hi.name,
        [
          { value: lo.name, error: 'inverted-c-relationship', why: 'assumed the substance with the smaller specific heat needs more heat, but q = mcΔT — with m and ΔT fixed, a LARGER specific heat means MORE heat is required' },
          { value: 'They require the same amount of heat', error: 'ignored-specific-heat', why: 'ignored that the two substances have different specific heats' },
          extraDistractor,
        ],
      ),
      explanation: `q = mcΔT. With mass and ΔT equal for both, q is directly proportional to specific heat. ${hi.name} has the larger specific heat (${hi.c.toFixed(3)} vs. ${lo.c.toFixed(3)} J/(g·°C)), so it needs more heat to reach the same final temperature.`,
    };
  },
});

// ---------------------------------------------------------------------------
// first-law-thermodynamics — ΔE = q + w with sign conventions
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-first-law',
  chapterId: CH,
  band: 2,
  name: 'First law of thermodynamics, ΔE = q + w',
  concepts: ['first-law-thermodynamics'],
  generate: (rng, h) => {
    const Q = h.int(50, 400); // J, magnitude
    const W = h.int(10, 150); // J, magnitude
    const heatDir = h.pick(['absorbs', 'releases']);
    const workClause = h.pick(['system-does-work', 'surroundings-do-work']);

    const q = heatDir === 'absorbs' ? Q : -Q;
    const w = workClause === 'system-does-work' ? -W : W;
    const dE = q + w;

    const heatPhrase = heatDir === 'absorbs'
      ? `absorbs ${Q} J of heat from the surroundings`
      : `releases ${Q} J of heat to the surroundings`;
    const workPhrase = workClause === 'system-does-work'
      ? `the system does ${W} J of work on the surroundings`
      : `the surroundings do ${W} J of work on the system`;

    const fmt = (n) => `${n > 0 ? '+' : ''}${n} J`;

    const wrongFlipW = q - w;       // flipped only w's sign convention
    const wrongFlipQ = -q + w;      // flipped only q's sign convention
    const wrongNoWork = q;          // forgot the work term entirely

    return {
      stem: `During a process, a system ${heatPhrase}, and ${workPhrase}. Using ΔE = q + w, what is the change in the system's internal energy?`,
      ...h.choices(
        { value: fmt(dE) },
        [
          { value: fmt(wrongFlipW), error: 'flipped-work-sign', why: 'used the wrong sign convention for w — work done ON the system is positive, work done BY the system is negative' },
          { value: fmt(wrongFlipQ), error: 'flipped-heat-sign', why: 'used the wrong sign convention for q — heat absorbed by the system is positive, heat released is negative' },
          { value: fmt(wrongNoWork), error: 'forgot-work-term', why: 'reported q alone and left the work term out of ΔE = q + w entirely' },
        ],
      ),
      explanation: `System ${heatDir === 'absorbs' ? 'absorbs' : 'releases'} heat, so q = ${fmt(q)}. ${workClause === 'system-does-work' ? 'The system does work on the surroundings, so w is negative' : 'The surroundings do work on the system, so w is positive'}: w = ${fmt(w)}. ΔE = q + w = ${fmt(q)} + (${fmt(w)}) = ${fmt(dE)}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// energy-per-mole-reaction
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-energy-per-mole',
  chapterId: CH,
  band: 2,
  name: 'Energy released per mole of reactant',
  concepts: ['energy-per-mole-reaction'],
  generate: (rng, h) => {
    const SUBSTANCES = [
      { name: 'magnesium', molar: 24.3 },
      { name: 'sodium', molar: 23.0 },
      { name: 'calcium', molar: 40.1 },
      { name: 'aluminum', molar: 27.0 },
      { name: 'iron', molar: 55.8 },
      { name: 'carbon (graphite)', molar: 12.0 },
    ];
    const s = h.pick(SUBSTANCES);
    const mass = h.int(5, 60); // g
    const heatKJ = h.int(80, 900); // kJ released, total
    const moles = mass / s.molar;
    const perMole = heatKJ / moles;

    return {
      stem: `${mass} g of ${s.name} (molar mass ${s.molar.toFixed(1)} g/mol) reacts completely in a reaction that releases ${heatKJ} kJ of heat total. How much energy is released per mole of ${s.name}?`,
      ...h.choices(
        { value: `${perMole.toFixed(1)} kJ/mol` },
        [
          { value: `${(heatKJ / mass).toFixed(1)} kJ/mol`, error: 'used-mass-not-moles', why: 'divided the heat by grams instead of first converting the mass to moles' },
          { value: `${(heatKJ / (mass * s.molar)).toFixed(1)} kJ/mol`, error: 'inverted-molar-mass-use', why: 'multiplied by molar mass instead of dividing by it, inverting the mole calculation' },
          { value: `${(heatKJ * moles).toFixed(1)} kJ/mol`, error: 'multiplied-instead-of-divided', why: 'multiplied the total heat by the number of moles instead of dividing by it' },
        ],
      ),
      explanation: `Convert mass to moles first: ${mass} g ÷ ${s.molar.toFixed(1)} g/mol = ${moles.toFixed(3)} mol. Then energy per mole = ${heatKJ} kJ ÷ ${moles.toFixed(3)} mol = ${perMole.toFixed(1)} kJ/mol.`,
    };
  },
});

// ---------------------------------------------------------------------------
// bomb-calorimetry
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-bomb-calorimetry',
  chapterId: CH,
  band: 2,
  name: 'Bomb calorimetry: constant volume, no work term',
  concepts: ['bomb-calorimetry'],
  generate: (rng, h) => {
    const COMPOUNDS = ['glucose', 'sucrose', 'naphthalene', 'benzoic acid', 'ethanol'];
    const compound = h.pick(COMPOUNDS);
    const mass = h.int(10, 30) / 10; // 1.0-3.0 g, flavor only — not needed for q_rxn
    const Ccal = h.int(80, 150) / 10; // 8.0-15.0 kJ/°C
    const dT = h.int(15, 60) / 10; // 1.5-6.0 °C rise

    const qCal = Ccal * dT;   // kJ absorbed by the calorimeter + water
    const qRxn = -qCal;       // kJ released by the (exothermic) combustion

    return {
      stem: `A ${mass.toFixed(1)} g sample of ${compound} is burned completely in a bomb calorimeter with a heat capacity of ${Ccal.toFixed(1)} kJ/°C. The temperature of the calorimeter and its water bath rises by ${dT.toFixed(1)}°C. Because a bomb calorimeter holds constant volume (no work term), what is q for the combustion reaction?`,
      ...h.choices(
        { value: `${qRxn.toFixed(1)} kJ` },
        [
          { value: `${qCal.toFixed(1)} kJ`, error: 'forgot-sign-flip', why: 'reported the heat absorbed BY the calorimeter instead of recognizing that the reaction released that heat — heat released by the reaction has the opposite sign' },
          { value: `${(Ccal / dT).toFixed(1)} kJ`, error: 'divided-instead-of-multiplied', why: 'divided the heat capacity by ΔT instead of multiplying them' },
          { value: `${(-(Ccal + dT)).toFixed(1)} kJ`, error: 'added-instead-of-multiplied', why: 'added the heat capacity and ΔT instead of multiplying them' },
        ],
      ),
      explanation: `At constant volume, w = 0, so all the energy change shows up as heat. Heat absorbed by the calorimeter: q_cal = C_cal × ΔT = ${Ccal.toFixed(1)} kJ/°C × ${dT.toFixed(1)}°C = ${qCal.toFixed(1)} kJ. By energy conservation, the reaction released exactly that much heat: q_rxn = −q_cal = ${qRxn.toFixed(1)} kJ.`,
    };
  },
});

// ---------------------------------------------------------------------------
// enthalpy-of-formation — reversing and scaling ΔH
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06-enthalpy-formation-manipulation',
  chapterId: CH,
  band: 2,
  name: 'Reversing and scaling a formation ΔH',
  concepts: ['enthalpy-of-formation'],
  generate: (rng, h) => {
    const FORMATION = [
      { name: 'water', eq: 'H₂(g) + ½O₂(g) → H₂O(l)', dH: -285.8 },
      { name: 'carbon dioxide', eq: 'C(s, graphite) + O₂(g) → CO₂(g)', dH: -393.5 },
      { name: 'methane', eq: 'C(s, graphite) + 2H₂(g) → CH₄(g)', dH: -74.8 },
      { name: 'ammonia', eq: '½N₂(g) + 1.5H₂(g) → NH₃(g)', dH: -46.1 },
      { name: 'nitrogen dioxide', eq: '½N₂(g) + O₂(g) → NO₂(g)', dH: 33.2 },
      { name: 'sulfur dioxide', eq: 'S(s) + O₂(g) → SO₂(g)', dH: -296.8 },
    ];
    const f = h.pick(FORMATION);
    const n = h.int(1, 3);
    let reversed = rng() < 0.5;
    if (n === 1 && !reversed) reversed = true; // never ask a no-op question

    const shownDH = f.dH;
    const targetDH = shownDH * n * (reversed ? -1 : 1);

    let ask;
    if (reversed && n === 1) {
      ask = `What is ΔH for the reverse reaction (decomposing 1 mol of ${f.name} back into its elements)?`;
    } else if (!reversed && n > 1) {
      ask = `What is ΔH if the reaction is scaled up to form ${n} mol of ${f.name} instead of 1 mol (all coefficients multiplied by ${n})?`;
    } else {
      ask = `What is ΔH for the reverse reaction, scaled so that ${n} mol of ${f.name} decomposes back into its elements?`;
    }

    const forgotFlip = shownDH * n;                              // scaled but sign not flipped
    const forgotScale = shownDH * (reversed ? -1 : 1);            // flipped but not scaled
    const noManipulation = shownDH;                               // neither applied — always distinct given the no-op guard above

    return {
      stem: `The formation reaction for ${f.name} is:\n${f.eq}, ΔH = ${shownDH.toFixed(1)} kJ\n${ask}`,
      ...h.choices(
        { value: `${targetDH.toFixed(1)} kJ` },
        [
          { value: `${forgotFlip.toFixed(1)} kJ`, error: 'forgot-sign-flip-on-reverse', why: 'scaled the value correctly but forgot that reversing a reaction flips the sign of ΔH' },
          { value: `${forgotScale.toFixed(1)} kJ`, error: 'forgot-to-scale', why: 'handled the sign correctly but forgot to scale ΔH by the same factor used to scale the reaction\'s coefficients' },
          { value: `${noManipulation.toFixed(1)} kJ`, error: 'no-manipulation-applied', why: 'used the formation reaction\'s ΔH unchanged, without reversing or scaling it to match the reaction asked about' },
        ],
      ),
      explanation: `ΔH scales with the reaction's coefficients and flips sign when the reaction is reversed. Starting from ΔH = ${shownDH.toFixed(1)} kJ: ${n > 1 ? `scale by ${n} → ${(shownDH * n).toFixed(1)} kJ; ` : ''}${reversed ? `reverse the reaction → flip the sign → ${targetDH.toFixed(1)} kJ.` : `no reversal is needed here, so ΔH stays ${targetDH.toFixed(1)} kJ.`}`,
    };
  },
});

// ---------------------------------------------------------------------------
// hess-law — combine 2-3 given reactions (reversing/scaling as needed) to reach
// a target ΔH. All three sets below are real, hand-verified thermochemistry:
// their targetDH (computed at runtime as the weighted sum) matches the accepted
// literature ΔHf° of CO(g) (-110.5), CH4(g) (-74.8), and C2H2(g) (+226.7).
// ---------------------------------------------------------------------------
const HESS_SETS = [
  {
    targetLabel: 'C(s, graphite) + ½O₂(g) → CO(g)',
    given: [
      { eq: 'C(s, graphite) + O₂(g) → CO₂(g)', dH: -393.5, coeff: 1 },
      { eq: 'CO(g) + ½O₂(g) → CO₂(g)', dH: -283.0, coeff: -1 },
    ],
  },
  {
    targetLabel: 'C(s, graphite) + 2H₂(g) → CH₄(g)',
    given: [
      { eq: 'C(s, graphite) + O₂(g) → CO₂(g)', dH: -393.5, coeff: 1 },
      { eq: 'H₂(g) + ½O₂(g) → H₂O(l)', dH: -285.8, coeff: 2 },
      { eq: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', dH: -890.3, coeff: -1 },
    ],
  },
  {
    targetLabel: '2C(s, graphite) + H₂(g) → C₂H₂(g)',
    given: [
      { eq: 'C(s, graphite) + O₂(g) → CO₂(g)', dH: -393.5, coeff: 2 },
      { eq: 'H₂(g) + ½O₂(g) → H₂O(l)', dH: -285.8, coeff: 1 },
      { eq: 'C₂H₂(g) + 2.5O₂(g) → 2CO₂(g) + H₂O(l)', dH: -1299.5, coeff: -1 },
    ],
  },
];

registerChemTemplate({
  id: 'chem1-06-hess-law',
  chapterId: CH,
  band: 3,
  name: "Hess's Law: combining given reactions",
  concepts: ['hess-law'],
  generate: (rng, h) => {
    const set = h.pick(HESS_SETS);
    const givenLines = set.given
      .map((g, i) => `  ${i + 1}. ${g.eq}, ΔH${i + 1} = ${g.dH.toFixed(1)} kJ`)
      .join('\n');

    const correct = set.given.reduce((sum, g) => sum + g.dH * g.coeff, 0);
    const forgotReversal = set.given.reduce((sum, g) => sum + g.dH * Math.abs(g.coeff), 0);
    const forgotScaling = set.given.reduce((sum, g) => sum + g.dH * Math.sign(g.coeff), 0);
    const flippedFinal = -correct;

    const describe = (g, i) => {
      const dir = g.coeff < 0 ? 'reversed' : 'used as written';
      const mag = Math.abs(g.coeff);
      const scaleTxt = mag === 1 ? '' : ` and scaled ×${mag}`;
      return `reaction ${i + 1} is ${dir}${scaleTxt} (contributes ${(g.dH * g.coeff).toFixed(1)} kJ)`;
    };

    return {
      stem: `Given the following reactions:\n${givenLines}\nUse Hess's Law to find ΔH for:\n  ${set.targetLabel}`,
      ...h.choices(
        { value: `${correct.toFixed(1)} kJ` },
        [
          { value: `${forgotReversal.toFixed(1)} kJ`, error: 'forgot-to-reverse', why: "added every given reaction's ΔH in the direction it was printed, without reversing the one(s) needed to cancel the intermediate species" },
          { value: `${forgotScaling.toFixed(1)} kJ`, error: 'forgot-to-scale', why: "reversed the correct reaction(s) but forgot to multiply a reaction's ΔH by the same factor used to scale its coefficients" },
          { value: `${flippedFinal.toFixed(1)} kJ`, error: 'flipped-final-sign', why: 'combined the reactions correctly but flipped the sign of the final answer' },
        ],
      ),
      explanation: `Combine the given reactions so every intermediate cancels and the sum equals the target equation: ${set.given.map(describe).join('; ')}. Sum: ${set.given.map((g) => (g.dH * g.coeff).toFixed(1)).join(' + ')} = ${correct.toFixed(1)} kJ.`,
    };
  },
});
