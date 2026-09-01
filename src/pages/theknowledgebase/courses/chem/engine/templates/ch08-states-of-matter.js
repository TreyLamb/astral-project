// States of Matter. Original questions, informed by (never copied from) the ACS study guide's
// own "Knowledge Required" tags for this chapter — see courses/PLAN.md's 2026-08-28 entry for
// the source and courses/chem/PLAN.md for the doctrine this follows.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-08-states-of-matter';
const R = 0.08206; // L·atm/(mol·K)
const cToK = (c) => c + 273.15;

// ---------------------------------------------------------------------------
// ideal-gas-properties
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-ideal-gas-conditions',
  chapterId: CH,
  band: 1,
  name: 'When a real gas behaves most ideally',
  concepts: ['ideal-gas-properties'],
  generate: (rng, h) => {
    return {
      stem: `A real gas behaves most like an ideal gas under which conditions?`,
      ...h.choices(
        'low pressure and high temperature',
        [
          { value: 'high pressure and low temperature', error: 'ideal-conditions-reversed', why: 'picked the conditions that make a real gas LEAST ideal — high pressure crowds particles together and low temperature lets attractive forces matter more' },
          { value: 'high pressure and high temperature', error: 'wrong-pressure-condition', why: 'got temperature right but pressure wrong — high pressure forces particles close enough that their own volume and attractions become significant' },
          { value: 'low pressure and low temperature', error: 'wrong-temperature-condition', why: 'got pressure right but temperature wrong — low temperature slows particles down enough for intermolecular attractions to matter' },
        ],
      ),
      explanation: `The ideal gas model assumes negligible particle volume and no intermolecular attractions. Low pressure keeps particles far apart (their own volume matters less) and high temperature keeps them moving fast (attractions have less time to act) — together, these conditions come closest to the ideal-gas assumptions.`,
    };
  },
});

// ---------------------------------------------------------------------------
// ideal-gas-law — solve for one variable
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-ideal-gas-law-solve',
  chapterId: CH,
  band: 2,
  name: 'Solving PV = nRT for one variable',
  concepts: ['ideal-gas-law'],
  generate: (rng, h) => {
    const askFor = h.pick(['P', 'V', 'n', 'T']);
    const P = h.int(10, 40) / 10;   // 1.0-4.0 atm
    const V = h.int(20, 100) / 10;  // 2.0-10.0 L
    const n = h.int(5, 40) / 10;    // 0.5-4.0 mol
    const tempC = h.int(0, 80);
    const T = cToK(tempC);

    if (askFor === 'P') {
      const answer = (n * R * T) / V;
      return {
        stem: `A ${V.toFixed(1)} L container holds ${n.toFixed(1)} mol of gas at ${tempC}°C. What is the pressure? (R = 0.08206 L·atm/(mol·K))`,
        ...h.choices(
          { value: `${answer.toFixed(2)} atm` },
          [
            { value: `${(n * R * tempC).toFixed(2)} atm`, error: 'forgot-kelvin-conversion', why: 'used the Celsius temperature directly instead of converting to Kelvin first' },
            { value: `${((n * R * T) * V).toFixed(2)} atm`, error: 'multiplied-instead-of-divided', why: 'multiplied by volume instead of dividing by it' },
            { value: `${(n * T / V).toFixed(2)} atm`, error: 'omitted-r', why: 'left the gas constant R out of the calculation entirely' },
          ],
        ),
        explanation: `PV = nRT → P = nRT/V. Convert to Kelvin: ${tempC}°C + 273.15 = ${T.toFixed(2)} K. P = (${n.toFixed(1)})(0.08206)(${T.toFixed(2)}) / ${V.toFixed(1)} = ${answer.toFixed(2)} atm.`,
      };
    }
    if (askFor === 'V') {
      const answer = (n * R * T) / P;
      return {
        stem: `${n.toFixed(1)} mol of gas is at a pressure of ${P.toFixed(1)} atm and a temperature of ${tempC}°C. What volume does it occupy? (R = 0.08206 L·atm/(mol·K))`,
        ...h.choices(
          { value: `${answer.toFixed(2)} L` },
          [
            { value: `${(n * R * tempC / P).toFixed(2)} L`, error: 'forgot-kelvin-conversion', why: 'used the Celsius temperature directly instead of converting to Kelvin first' },
            { value: `${(n * R * T * P).toFixed(2)} L`, error: 'multiplied-instead-of-divided', why: 'multiplied by pressure instead of dividing by it' },
            { value: `${(P * T / n).toFixed(2)} L`, error: 'wrong-variables-combined', why: 'combined the wrong variables — used P·T/n instead of nRT/P' },
          ],
        ),
        explanation: `PV = nRT → V = nRT/P. Convert to Kelvin: ${tempC}°C + 273.15 = ${T.toFixed(2)} K. V = (${n.toFixed(1)})(0.08206)(${T.toFixed(2)}) / ${P.toFixed(1)} = ${answer.toFixed(2)} L.`,
      };
    }
    if (askFor === 'n') {
      const answer = (P * V) / (R * T);
      return {
        stem: `A ${V.toFixed(1)} L container holds gas at ${P.toFixed(1)} atm and ${tempC}°C. How many moles of gas are present? (R = 0.08206 L·atm/(mol·K))`,
        ...h.choices(
          { value: `${answer.toFixed(3)} mol` },
          [
            { value: `${(P * V / (R * tempC)).toFixed(3)} mol`, error: 'forgot-kelvin-conversion', why: 'used the Celsius temperature directly instead of converting to Kelvin first' },
            { value: `${(P * V * R * T).toFixed(3)} mol`, error: 'multiplied-instead-of-divided', why: 'multiplied by R and T instead of dividing by them' },
            { value: `${(V / (R * T)).toFixed(3)} mol`, error: 'omitted-pressure', why: 'left pressure out of the calculation entirely' },
          ],
        ),
        explanation: `PV = nRT → n = PV/(RT). Convert to Kelvin: ${tempC}°C + 273.15 = ${T.toFixed(2)} K. n = (${P.toFixed(1)})(${V.toFixed(1)}) / (0.08206 × ${T.toFixed(2)}) = ${answer.toFixed(3)} mol.`,
      };
    }
    // askFor === 'T'
    const answer = (P * V) / (n * R);
    const answerC = answer - 273.15;
    return {
      stem: `${n.toFixed(1)} mol of gas occupies ${V.toFixed(1)} L at ${P.toFixed(1)} atm. What is the temperature, in °C? (R = 0.08206 L·atm/(mol·K))`,
      ...h.choices(
        { value: `${answerC.toFixed(1)} °C` },
        [
          { value: `${answer.toFixed(1)} °C`, error: 'forgot-kelvin-to-celsius', why: 'solved correctly for the Kelvin temperature but forgot to convert back to Celsius by subtracting 273.15' },
          { value: `${((P * V * n * R) - 273.15).toFixed(1)} °C`, error: 'multiplied-instead-of-divided', why: 'multiplied by n and R instead of dividing by them' },
          { value: `${((P / (n * R * V)) - 273.15).toFixed(1)} °C`, error: 'wrong-variables-combined', why: 'combined the variables incorrectly — used P/(nRV) instead of PV/(nR)' },
        ],
      ),
      explanation: `PV = nRT → T = PV/(nR) = (${P.toFixed(1)})(${V.toFixed(1)}) / (${n.toFixed(1)} × 0.08206) = ${answer.toFixed(2)} K. Converting to Celsius: ${answer.toFixed(2)} − 273.15 = ${answerC.toFixed(1)} °C.`,
    };
  },
});

// ---------------------------------------------------------------------------
// ideal-gas-law — gas density, d = PM/RT
// ---------------------------------------------------------------------------
const GAS_DENSITY_SUBSTANCES = [
  { name: 'Xe', molar: 131.29 }, { name: 'CO₂', molar: 44.01 }, { name: 'N₂', molar: 28.01 },
  { name: 'O₂', molar: 32.00 }, { name: 'Ar', molar: 39.95 }, { name: 'SO₂', molar: 64.07 },
];

registerChemTemplate({
  id: 'chem1-08-gas-density',
  chapterId: CH,
  band: 3,
  name: 'Density of a gas (d = PM/RT)',
  concepts: ['ideal-gas-law'],
  generate: (rng, h) => {
    const gas = h.pick(GAS_DENSITY_SUBSTANCES);
    const P = h.int(10, 30) / 10; // 1.0-3.0 atm
    const tempC = h.int(0, 100);
    const T = cToK(tempC);
    const density = (P * gas.molar) / (R * T);
    return {
      stem: `What is the density of ${gas.name} gas (molar mass ${gas.molar.toFixed(2)} g/mol) at ${tempC}°C and ${P.toFixed(1)} atm? (R = 0.08206 L·atm/(mol·K))`,
      ...h.choices(
        { value: `${density.toFixed(2)} g/L` },
        [
          { value: `${(P * gas.molar / (R * tempC)).toFixed(2)} g/L`, error: 'forgot-kelvin-conversion', why: 'used the Celsius temperature directly instead of converting to Kelvin first' },
          { value: `${(gas.molar / (R * T)).toFixed(2)} g/L`, error: 'omitted-pressure', why: 'left pressure out of the density formula entirely' },
          { value: `${(R * T / (P * gas.molar)).toFixed(2)} g/L`, error: 'inverted-formula', why: 'inverted the formula — computed RT/(PM) instead of PM/(RT)' },
        ],
      ),
      explanation: `d = PM/(RT). Convert to Kelvin: ${tempC}°C + 273.15 = ${T.toFixed(2)} K. d = (${P.toFixed(1)})(${gas.molar.toFixed(2)}) / (0.08206 × ${T.toFixed(2)}) = ${density.toFixed(2)} g/L.`,
    };
  },
});

// ---------------------------------------------------------------------------
// combined-gas-law
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-combined-gas-law',
  chapterId: CH,
  band: 2,
  name: 'Combined gas law, P1V1/T1 = P2V2/T2',
  concepts: ['combined-gas-law'],
  generate: (rng, h) => {
    const P1 = h.int(10, 40) / 10;
    const V1 = h.int(20, 100) / 10;
    const t1C = h.int(0, 60);
    const T1 = cToK(t1C);
    const t2C = h.int(0, 60);
    const T2 = cToK(t2C);
    const P2 = h.int(10, 40) / 10;
    const V2 = (P1 * V1 * T2) / (T1 * P2);
    return {
      stem: `A fixed amount of gas occupies ${V1.toFixed(1)} L at ${P1.toFixed(1)} atm and ${t1C}°C. What volume does it occupy at ${P2.toFixed(1)} atm and ${t2C}°C?`,
      ...h.choices(
        { value: `${V2.toFixed(2)} L` },
        [
          { value: `${(P1 * V1 * t2C / (t1C === 0 ? 1 : t1C * P2)).toFixed(2)} L`, error: 'forgot-kelvin-conversion', why: 'used the Celsius temperatures directly instead of converting both to Kelvin' },
          { value: `${(P2 * V1 * T1 / (T2 * P1)).toFixed(2)} L`, error: 'inverted-ratio', why: 'set up P₁V₁/T₁ = P₂V₂/T₂ with the two states swapped' },
          { value: `${V1.toFixed(2)} L`, error: 'ignored-conditions-change', why: 'left the volume unchanged and ignored that pressure and temperature both changed' },
        ],
      ),
      explanation: `P₁V₁/T₁ = P₂V₂/T₂ (Kelvin required: T₁ = ${T1.toFixed(2)} K, T₂ = ${T2.toFixed(2)} K). V₂ = P₁V₁T₂/(T₁P₂) = (${P1.toFixed(1)})(${V1.toFixed(1)})(${T2.toFixed(2)}) / ((${T1.toFixed(2)})(${P2.toFixed(1)})) = ${V2.toFixed(2)} L.`,
    };
  },
});

// ---------------------------------------------------------------------------
// gas-stoichiometry
// ---------------------------------------------------------------------------
const GAS_STOICH_REACTIONS = [
  { desc: 'the decomposition of solid KClO₃ into solid KCl and O₂ gas (2 KClO₃ → 2 KCl + 3 O₂)', gasCoeff: 3, solidCoeff: 2, solidMolar: 122.55, solidName: 'KClO₃' },
  { desc: 'the reaction of solid CaCO₃ decomposing into solid CaO and CO₂ gas (CaCO₃ → CaO + CO₂)', gasCoeff: 1, solidCoeff: 1, solidMolar: 100.09, solidName: 'CaCO₃' },
  { desc: 'the reaction of Zn metal with HCl to produce ZnCl₂ and H₂ gas (Zn + 2 HCl → ZnCl₂ + H₂)', gasCoeff: 1, solidCoeff: 1, solidMolar: 65.38, solidName: 'Zn' },
];

registerChemTemplate({
  id: 'chem1-08-gas-stoichiometry',
  chapterId: CH,
  band: 3,
  name: 'Stoichiometry with a gas product (PV = nRT + mole ratio)',
  concepts: ['gas-stoichiometry'],
  generate: (rng, h) => {
    const rxn = h.pick(GAS_STOICH_REACTIONS);
    const massG = h.int(5, 50);
    const tempC = h.int(20, 40);
    const T = cToK(tempC);
    const P = 1.0; // atm, fixed for simplicity

    const molSolid = massG / rxn.solidMolar;
    const molGas = molSolid * (rxn.gasCoeff / rxn.solidCoeff);
    const V = (molGas * R * T) / P;

    return {
      stem: `For ${rxn.desc}: if ${massG} g of ${rxn.solidName} reacts completely, what volume of gas (at ${tempC}°C and ${P.toFixed(1)} atm) is produced? (R = 0.08206 L·atm/(mol·K))`,
      ...h.choices(
        { value: `${V.toFixed(2)} L` },
        [
          { value: `${((molSolid) * R * T / P).toFixed(2)} L`, error: 'ignored-mole-ratio', why: `used the moles of ${rxn.solidName} directly as the moles of gas, ignoring the ${rxn.gasCoeff}:${rxn.solidCoeff} mole ratio from the balanced equation` },
          { value: `${(massG * R * T / P).toFixed(2)} L`, error: 'skipped-molar-mass', why: 'used the mass in grams directly in PV = nRT instead of first converting to moles' },
          { value: `${molGas.toFixed(3)} L`, error: 'reported-moles-not-volume', why: 'reported the number of moles of gas instead of using PV = nRT to find its volume' },
        ],
      ),
      explanation: `First find moles of ${rxn.solidName}: ${massG} g ÷ ${rxn.solidMolar.toFixed(2)} g/mol = ${molSolid.toFixed(3)} mol. Apply the mole ratio (${rxn.gasCoeff}:${rxn.solidCoeff}): ${molGas.toFixed(3)} mol gas. Then PV = nRT → V = (${molGas.toFixed(3)})(0.08206)(${T.toFixed(2)}) / ${P.toFixed(1)} = ${V.toFixed(2)} L.`,
    };
  },
});

// ---------------------------------------------------------------------------
// partial-pressure-dalton
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-partial-pressure',
  chapterId: CH,
  band: 2,
  name: "Dalton's law of partial pressures",
  concepts: ['partial-pressure-dalton'],
  generate: (rng, h) => {
    const pA = h.int(10, 40) / 10;
    const pB = h.int(10, 40) / 10;
    const pC = h.int(10, 40) / 10;
    const total = pA + pB + pC;
    return {
      stem: `A container holds three gases with partial pressures P_A = ${pA.toFixed(1)} atm, P_B = ${pB.toFixed(1)} atm, and P_C = ${pC.toFixed(1)} atm. What is the total pressure in the container?`,
      ...h.choices(
        { value: `${total.toFixed(1)} atm` },
        [
          { value: `${(pA * pB * pC).toFixed(2)} atm`, error: 'multiplied-instead-of-summed', why: "multiplied the partial pressures together instead of adding them — Dalton's law sums them" },
          { value: `${(total / 3).toFixed(2)} atm`, error: 'averaged-instead-of-summed', why: 'averaged the partial pressures instead of summing them' },
          { value: `${Math.max(pA, pB, pC).toFixed(1)} atm`, error: 'used-max-partial-pressure', why: 'reported only the largest partial pressure instead of the sum of all three' },
        ],
      ),
      explanation: `Dalton's law: the total pressure is the SUM of all partial pressures. P_total = ${pA.toFixed(1)} + ${pB.toFixed(1)} + ${pC.toFixed(1)} = ${total.toFixed(1)} atm.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-08-mole-fraction-pressure',
  chapterId: CH,
  band: 2,
  name: 'Partial pressure from mole fraction',
  concepts: ['partial-pressure-dalton'],
  generate: (rng, h) => {
    const molA = h.int(1, 5);
    const molB = h.int(1, 5);
    const totalMol = molA + molB;
    const totalP = h.int(20, 60) / 10;
    const moleFractionA = molA / totalMol;
    const partialA = moleFractionA * totalP;
    return {
      stem: `A container holds ${molA} mol of gas A and ${molB} mol of gas B, with a total pressure of ${totalP.toFixed(1)} atm. What is the partial pressure of gas A?`,
      ...h.choices(
        { value: `${partialA.toFixed(2)} atm` },
        [
          { value: `${(totalP * molB / totalMol).toFixed(2)} atm`, error: 'used-wrong-gas-mole-fraction', why: "computed gas B's mole fraction instead of gas A's" },
          { value: `${(totalP / 2).toFixed(2)} atm`, error: 'assumed-equal-split', why: 'split the total pressure evenly between the two gases instead of using their actual mole fraction' },
          { value: `${(totalP * molA).toFixed(2)} atm`, error: 'omitted-total-moles', why: "multiplied by moles of A directly without dividing by the total moles to get a mole fraction first" },
        ],
      ),
      explanation: `Mole fraction of A = mol A / total mol = ${molA} / ${totalMol} = ${moleFractionA.toFixed(3)}. Partial pressure of A = mole fraction × total pressure = ${moleFractionA.toFixed(3)} × ${totalP.toFixed(1)} = ${partialA.toFixed(2)} atm.`,
    };
  },
});

// ---------------------------------------------------------------------------
// kinetic-molecular-theory
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-kinetic-molecular-theory',
  chapterId: CH,
  band: 1,
  name: 'Core assumptions of kinetic molecular theory',
  concepts: ['kinetic-molecular-theory'],
  generate: (rng, h) => {
    const STATEMENTS = [
      { correct: true, text: 'Gas particles are in constant, random motion.' },
      { correct: true, text: 'The volume of individual gas particles is negligible compared to the volume of their container.' },
      { correct: true, text: 'Collisions between gas particles are perfectly elastic (no net loss of kinetic energy).' },
      { correct: true, text: 'The average kinetic energy of gas particles is proportional to the absolute (Kelvin) temperature.' },
      { correct: false, text: 'Gas particles attract each other strongly, which is why gases can be compressed.' },
      { correct: false, text: 'At a given temperature, heavier gas particles have a higher average kinetic energy than lighter ones.' },
      { correct: false, text: 'Gas particles come to rest between collisions.' },
    ];
    const trueOnes = STATEMENTS.filter((s) => s.correct);
    const falseOnes = STATEMENTS.filter((s) => !s.correct);
    const askTrue = rng() < 0.5;
    const correct = askTrue ? h.pick(trueOnes) : h.pick(falseOnes);
    const pool = askTrue ? falseOnes : trueOnes;
    const distractors = [];
    const used = new Set();
    while (distractors.length < Math.min(3, pool.length)) {
      const d = h.pick(pool);
      if (used.has(d.text)) continue;
      used.add(d.text);
      distractors.push({ value: d.text, error: 'kmt-assumption-misstated', why: askTrue ? 'is NOT actually one of the core KMT assumptions' : 'IS actually one of the core KMT assumptions, not a false statement' });
    }
    return {
      stem: `Which of the following statements is ${askTrue ? 'a CORRECT' : 'an INCORRECT'} assumption of kinetic molecular theory?`,
      ...h.choices(correct.text, distractors),
      explanation: `Kinetic molecular theory assumes: particles are in constant random motion; their own volume is negligible; collisions are perfectly elastic; and average kinetic energy depends ONLY on absolute temperature (not on particle mass — at the same T, all gases have the same average KE, though not the same average speed).`,
    };
  },
});

// ---------------------------------------------------------------------------
// maxwell-boltzmann-distribution
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-maxwell-boltzmann-mass',
  chapterId: CH,
  band: 2,
  name: 'Comparing molecular speeds at the same temperature',
  concepts: ['maxwell-boltzmann-distribution'],
  generate: (rng, h) => {
    const GASES = [
      { name: 'He', molar: 4.00 }, { name: 'Ne', molar: 20.18 }, { name: 'N₂', molar: 28.01 },
      { name: 'O₂', molar: 32.00 }, { name: 'CO₂', molar: 44.01 }, { name: 'Xe', molar: 131.29 },
    ];
    let A = h.pick(GASES);
    let B = h.pick(GASES);
    while (B.name === A.name) B = h.pick(GASES);
    const [lighter, heavier] = A.molar < B.molar ? [A, B] : [B, A];
    return {
      stem: `At the same temperature, samples of ${A.name} and ${B.name} are compared. Which gas has the HIGHER average molecular speed?`,
      ...h.choices(
        lighter.name,
        [{ value: heavier.name, error: 'maxwell-boltzmann-mass-reversed', why: 'picked the heavier gas — at the same temperature all gases have the same AVERAGE KINETIC ENERGY, so the LIGHTER molecules must move faster to make up for their smaller mass' }],
      ),
      explanation: `At a given temperature, average kinetic energy (½mv²) is the same for all gases. Since ${lighter.name} (${lighter.molar.toFixed(2)} g/mol) has less mass than ${heavier.name} (${heavier.molar.toFixed(2)} g/mol), it must have a higher average speed to have the same kinetic energy.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-08-maxwell-boltzmann-temp',
  chapterId: CH,
  band: 1,
  name: 'How temperature shifts the speed distribution',
  concepts: ['maxwell-boltzmann-distribution'],
  generate: (rng, h) => {
    const gas = h.pick(['N₂', 'O₂', 'Ar', 'CO₂']);
    const tLow = h.int(0, 30);
    const tHigh = tLow + h.int(50, 150);
    return {
      stem: `A sample of ${gas} gas is heated from ${tLow}°C to ${tHigh}°C. How does this change its Maxwell-Boltzmann speed distribution?`,
      ...h.choices(
        'The distribution shifts toward higher speeds and becomes broader/flatter',
        [
          { value: 'The distribution shifts toward lower speeds and becomes narrower/taller', error: 'temperature-effect-reversed', why: 'reversed the effect of raising temperature — higher T means higher average speed, not lower' },
          { value: 'The distribution does not change, since the gas identity is unchanged', error: 'ignored-temperature-effect', why: 'ignored that temperature itself directly affects the speed distribution, regardless of which gas it is' },
          { value: 'The distribution shifts toward higher speeds but becomes narrower/taller', error: 'shift-without-broadening', why: 'got the direction of the shift right but missed that a wider range of speeds becomes populated at higher T, which flattens and broadens the curve' },
        ],
      ),
      explanation: `Raising temperature increases average kinetic energy, so the whole speed distribution shifts toward higher speeds. It also broadens/flattens, since a wider spread of molecular speeds becomes populated at higher T.`,
    };
  },
});

// ---------------------------------------------------------------------------
// hydrogen-bonding
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-hydrogen-bonding-identify',
  chapterId: CH,
  band: 1,
  name: 'Identifying hydrogen bonding',
  concepts: ['hydrogen-bonding'],
  generate: (rng, h) => {
    const CAN_H_BOND = ['H₂O (water)', 'NH₃ (ammonia)', 'HF (hydrogen fluoride)', 'CH₃OH (methanol)', 'CH₃COOH (acetic acid)'];
    const CANNOT_H_BOND = ['CH₄ (methane)', 'H₂S (hydrogen sulfide)', 'HCl (hydrogen chloride)', 'CO₂ (carbon dioxide)', 'PH₃ (phosphine)'];
    const askCan = rng() < 0.5;
    const correct = askCan ? h.pick(CAN_H_BOND) : h.pick(CANNOT_H_BOND);
    const distractorPool = askCan ? CANNOT_H_BOND : CAN_H_BOND;
    const d1 = h.pick(distractorPool);
    let d2 = h.pick(distractorPool);
    while (d2 === d1) d2 = h.pick(distractorPool);
    return {
      stem: `Which of these molecules ${askCan ? 'CAN' : 'CANNOT'} form hydrogen bonds with other molecules of its own kind?`,
      ...h.choices(
        correct,
        [
          { value: d1, error: 'hydrogen-bonding-requirement-missed', why: askCan ? 'lacks H bonded directly to N, O, or F, so it cannot hydrogen bond' : 'actually DOES have H bonded directly to N, O, or F, and can hydrogen bond' },
          { value: d2, error: 'hydrogen-bonding-requirement-missed', why: askCan ? 'lacks H bonded directly to N, O, or F, so it cannot hydrogen bond' : 'actually DOES have H bonded directly to N, O, or F, and can hydrogen bond' },
        ],
      ),
      explanation: `Hydrogen bonding requires a hydrogen atom bonded DIRECTLY to N, O, or F (a small, highly electronegative atom). H₂S, HCl, and PH₃ have hydrogen bonded to S, Cl, and P respectively — none of those qualify, even though they may seem similar to H₂O, HF, and NH₃.`,
    };
  },
});

// ---------------------------------------------------------------------------
// intermolecular-forces-boiling-point
// ---------------------------------------------------------------------------
const BP_COMPARISONS = [
  { lower: 'CH₄ (dispersion only)', higher: 'HCl (dipole-dipole)', reason: 'HCl has a permanent dipole (dipole-dipole forces), which are stronger than the dispersion-only forces in nonpolar CH₄' },
  { lower: 'HCl (dipole-dipole)', higher: 'H₂O (hydrogen bonding)', reason: 'H₂O can hydrogen bond, the strongest common intermolecular force, while HCl only has dipole-dipole forces' },
  { lower: 'Ne (small, dispersion only)', higher: 'Xe (larger, dispersion only)', reason: 'both rely only on dispersion forces, but Xe is larger and more polarizable, giving it stronger dispersion forces' },
  { lower: 'CH₄ (dispersion only)', higher: 'NH₃ (hydrogen bonding)', reason: 'NH₃ can hydrogen bond, while CH₄ has only weak dispersion forces' },
];

registerChemTemplate({
  id: 'chem1-08-boiling-point-imf',
  chapterId: CH,
  band: 2,
  name: 'Ranking boiling points by intermolecular force strength',
  concepts: ['intermolecular-forces-boiling-point'],
  generate: (rng, h) => {
    const c = h.pick(BP_COMPARISONS);
    return {
      stem: `Which has the HIGHER boiling point: ${c.lower.split(' (')[0]} or ${c.higher.split(' (')[0]}?`,
      ...h.choices(
        c.higher.split(' (')[0],
        [{ value: c.lower.split(' (')[0], error: 'imf-strength-ranking-reversed', why: 'picked the substance with weaker intermolecular forces — stronger IMFs require more energy to overcome, which means a HIGHER boiling point' }],
      ),
      explanation: `Boiling point tracks with intermolecular force strength: dispersion forces (weakest, growing with molar mass/polarizability) < dipole-dipole < hydrogen bonding (strongest common type). ${c.higher} has the higher boiling point because ${c.reason}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// vapor-pressure
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-vapor-pressure-compare',
  chapterId: CH,
  band: 2,
  name: 'Comparing vapor pressure via intermolecular forces',
  concepts: ['vapor-pressure'],
  generate: (rng, h) => {
    const c = h.pick(BP_COMPARISONS); // reuse: the one with WEAKER IMF has the HIGHER vapor pressure
    const weaker = c.lower.split(' (')[0];
    const stronger = c.higher.split(' (')[0];
    return {
      stem: `At the same temperature, which has the HIGHER vapor pressure: ${weaker} or ${stronger}?`,
      ...h.choices(
        weaker,
        [{ value: stronger, error: 'vapor-pressure-imf-relationship-reversed', why: 'picked the substance with STRONGER intermolecular forces — vapor pressure is HIGHER when molecules escape into the gas phase more easily, which happens with WEAKER intermolecular forces' }],
      ),
      explanation: `Vapor pressure is inversely related to intermolecular force strength: weaker IMFs let more molecules escape the liquid into the vapor phase at a given temperature, producing a higher vapor pressure. ${weaker} has weaker intermolecular forces than ${stronger}, so it has the higher vapor pressure (and is more volatile).`,
    };
  },
});

// ---------------------------------------------------------------------------
// unit-cell-density
// ---------------------------------------------------------------------------
const BCC_METALS = [
  { name: 'iron (α-Fe)', molar: 55.85, edgePm: 286.6 },
  { name: 'chromium', molar: 52.00, edgePm: 291.0 },
  { name: 'tungsten', molar: 183.84, edgePm: 316.5 },
  { name: 'sodium', molar: 22.99, edgePm: 429.1 },
];

registerChemTemplate({
  id: 'chem1-08-bcc-density',
  chapterId: CH,
  band: 3,
  name: 'Density from a body-centered cubic unit cell',
  concepts: ['unit-cell-density'],
  generate: (rng, h) => {
    const m = h.pick(BCC_METALS);
    const edgeCm = m.edgePm * 1e-10; // pm -> cm (1 pm = 1e-10 cm)
    const volumeCm3 = Math.pow(edgeCm, 3);
    const atomsPerCell = 2; // body-centered cubic: 8 corners x 1/8 + 1 center = 2
    const NA = 6.022e23;
    const massPerCell = (atomsPerCell * m.molar) / NA;
    const density = massPerCell / volumeCm3;
    return {
      stem: `${m.name} crystallizes in a body-centered cubic (BCC) unit cell with edge length ${m.edgePm.toFixed(1)} pm (molar mass ${m.molar.toFixed(2)} g/mol). A BCC cell contains 2 atoms per unit cell. What is the density?`,
      ...h.choices(
        { value: `${density.toFixed(2)} g/cm³` },
        [
          { value: `${((1 * m.molar / NA) / volumeCm3).toFixed(2)} g/cm³`, error: 'wrong-atoms-per-cell', why: 'used 1 atom per unit cell instead of the 2 atoms a BCC cell actually contains' },
          { value: `${(density * 1e21).toExponential(2)} g/cm³`, error: 'unit-conversion-error', why: 'made an error converting the edge length from picometers to centimeters' },
          { value: `${(massPerCell * volumeCm3).toExponential(2)} g/cm³`, error: 'multiplied-instead-of-divided', why: 'multiplied the cell mass by the cell volume instead of dividing by it' },
        ],
      ),
      explanation: `Cell mass = (2 atoms × ${m.molar.toFixed(2)} g/mol) / 6.022×10²³ = ${massPerCell.toExponential(3)} g. Cell volume = (${m.edgePm.toFixed(1)} pm × 10⁻¹⁰ cm/pm)³ = ${volumeCm3.toExponential(3)} cm³. Density = mass/volume = ${density.toFixed(2)} g/cm³.`,
    };
  },
});

// ---------------------------------------------------------------------------
// phase-diagrams
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-08-phase-diagram-read',
  chapterId: CH,
  band: 2,
  name: 'Reading regions of a phase diagram',
  concepts: ['phase-diagrams'],
  generate: (rng, h) => {
    const SCENARIOS = [
      { desc: 'below the triple point pressure, at a temperature where the substance is transitioning directly between solid and gas', correct: 'sublimation/deposition — no liquid phase is possible at this pressure' },
      { desc: 'at a pressure and temperature ABOVE the critical point', correct: 'a supercritical fluid — neither a distinct liquid nor a distinct gas phase exists here' },
      { desc: 'exactly at the triple point', correct: 'solid, liquid, and gas all coexist in equilibrium simultaneously' },
      { desc: 'at a pressure and temperature between the triple point and the critical point, crossing the solid-liquid boundary line', correct: 'melting/freezing — a normal solid-to-liquid phase transition' },
    ];
    const s = h.pick(SCENARIOS);
    const others = SCENARIOS.filter((x) => x !== s).map((x) => ({
      value: x.correct,
      error: 'phase-diagram-region-misread',
      why: 'describes a different region of the phase diagram than the one in the question',
    }));
    return {
      stem: `On a phase diagram, a substance is ${s.desc}. What is happening?`,
      ...h.choices(s.correct, others),
      explanation: `Phase diagram regions: below the triple point, only solid and gas exist (sublimation/deposition, no liquid). At the triple point, all three phases coexist. Between the triple point and critical point, normal solid/liquid/gas boundaries apply. Above the critical point, the liquid/gas distinction disappears entirely (supercritical fluid).`,
    };
  },
});
