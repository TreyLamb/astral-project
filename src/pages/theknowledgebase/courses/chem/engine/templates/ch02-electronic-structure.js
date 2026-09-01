// Electronic Structure. Original questions, informed by (never copied from) the ACS study
// guide's own "Knowledge Required" tags for this chapter — see courses/PLAN.md's 2026-08-28
// entry for the source and courses/chem/PLAN.md for the doctrine this follows.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-02-electronic-structure';

const H_PLANCK = 6.626e-34; // J·s
const C_LIGHT = 2.998e8;    // m/s
const R_H = 2.18e-18;       // J

// ---------------------------------------------------------------------------
// rydberg-formula-energy-levels + photon-energy-wavelength-relationship
// ---------------------------------------------------------------------------
const TRANSITIONS = [
  { ni: 4, nf: 2 }, { ni: 3, nf: 1 }, { ni: 5, nf: 2 }, { ni: 4, nf: 1 }, { ni: 6, nf: 3 },
];

registerChemTemplate({
  id: 'chem1-02-rydberg-wavelength',
  chapterId: CH,
  band: 3,
  name: 'Rydberg formula to photon wavelength',
  concepts: ['rydberg-formula-energy-levels', 'photon-energy-wavelength-relationship'],
  generate: (rng, h) => {
    const t = h.pick(TRANSITIONS);
    const deltaE = R_H * (1 / (t.nf * t.nf) - 1 / (t.ni * t.ni)); // positive, ni > nf, emission
    const wavelengthM = (H_PLANCK * C_LIGHT) / deltaE;
    const wavelengthNm = wavelengthM * 1e9;
    return {
      stem: `An electron in a hydrogen atom falls from n = ${t.ni} to n = ${t.nf}. Using ΔE = R_H(1/n_f² − 1/n_i²) with R_H = 2.18×10⁻¹⁸ J, and E = hc/λ with h = 6.626×10⁻³⁴ J·s and c = 2.998×10⁸ m/s, what wavelength of light (in nm) is emitted?`,
      ...h.choices(
        { value: `${wavelengthNm.toFixed(0)} nm` },
        [
          { value: `${(wavelengthNm / 2).toFixed(0)} nm`, error: 'used-ni-only', why: 'computed ΔE using only 1/n_i² (as if n_f were infinite) instead of the difference between both levels' },
          { value: `${(wavelengthNm * 2).toFixed(0)} nm`, error: 'inverted-n-terms', why: 'set up the Rydberg formula with n_i and n_f swapped, roughly halving the energy difference' },
          { value: `${wavelengthM.toExponential(2)} nm`, error: 'forgot-nm-conversion', why: 'calculated the wavelength correctly in meters, but forgot to convert to nanometers before reporting it' },
        ],
      ),
      explanation: `ΔE = R_H(1/n_f² − 1/n_i²) = 2.18×10⁻¹⁸ J × (1/${t.nf}² − 1/${t.ni}²) = ${deltaE.toExponential(3)} J. λ = hc/ΔE = (6.626×10⁻³⁴)(2.998×10⁸) / ${deltaE.toExponential(3)} = ${wavelengthM.toExponential(3)} m = ${wavelengthNm.toFixed(0)} nm.`,
    };
  },
});

// ---------------------------------------------------------------------------
// absorption-vs-emission
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-02-absorption-emission',
  chapterId: CH,
  band: 1,
  name: 'Absorption vs. emission from a transition direction',
  concepts: ['absorption-vs-emission'],
  generate: (rng, h) => {
    const nLow = h.int(1, 3);
    const nHigh = nLow + h.int(1, 3);
    const goesUp = rng() < 0.5;
    const from = goesUp ? nLow : nHigh;
    const to = goesUp ? nHigh : nLow;
    const correct = goesUp ? 'absorption — the electron moves to a higher energy level' : 'emission — the electron moves to a lower energy level';
    const wrong = goesUp ? 'emission — the electron moves to a lower energy level' : 'absorption — the electron moves to a higher energy level';
    return {
      stem: `An electron moves from n = ${from} to n = ${to}. Is this absorption or emission of a photon?`,
      ...h.choices(
        correct,
        [{ value: wrong, error: 'absorption-emission-swapped', why: `read the direction of the transition backwards — n = ${from} to n = ${to} is ${goesUp ? 'a move UP' : 'a move DOWN'} in energy level` }],
      ),
      explanation: `Moving to a HIGHER n (higher energy) requires ABSORBING a photon's energy. Moving to a LOWER n (lower energy) RELEASES a photon — emission. Here the electron goes from n = ${from} to n = ${to}, which is ${goesUp ? 'absorption' : 'emission'}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// quantum-number-rules
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-02-quantum-number-valid',
  chapterId: CH,
  band: 2,
  name: 'Valid quantum number combinations',
  concepts: ['quantum-number-rules'],
  generate: (rng, h) => {
    const n = h.int(2, 4);
    const validL = h.int(0, n - 1);
    const validMl = h.int(-validL, validL);
    const validMs = h.pick(['+½', '−½']);
    const valid = { n, l: validL, ml: validMl, ms: validMs };
    const fmt = (q) => `n = ${q.n}, l = ${q.l}, mₗ = ${q.ml}, mₛ = ${q.ms}`;

    const violations = [
      { ...valid, l: n, error: 'l-out-of-range', why: 'gave l a value equal to or greater than n — l must run from 0 to n − 1' },
      { ...valid, ml: validL + 1, error: 'ml-out-of-range', why: 'gave mₗ a value outside the allowed range of −l to +l' },
      { ...valid, ms: valid.ms === '+½' ? '+1' : '−1', error: 'ms-invalid-value', why: 'gave mₛ a value other than +½ or −½, the only two allowed values' },
    ];
    return {
      stem: `Which of the following is a VALID set of quantum numbers?`,
      ...h.choices(
        { value: fmt(valid) },
        violations.map((v) => ({ value: fmt(v), error: v.error, why: v.why })),
      ),
      explanation: `Rules: n ≥ 1; l runs from 0 to n − 1; mₗ runs from −l to +l; mₛ is always +½ or −½. ${fmt(valid)} satisfies all four; each other option breaks exactly one rule.`,
    };
  },
});

// ---------------------------------------------------------------------------
// electron-configuration-periodic-table
// ---------------------------------------------------------------------------
// Aufbau-regular elements only (Cr, Cu and other s/d anomalies deliberately excluded —
// first-term gen chem tests the RULE, and using an exception here would either require
// flagging it as a special case or silently teach the wrong general pattern).
//
// `wrongOrder` and `shortOne` are hand-written per element, not derived by string surgery on
// `config` — an earlier regex-based version silently produced a garbled string ("...4s²⁶") for
// Fe/Zn and a nonsensical label-swap for the s/p-only elements. A wrong answer that looks like a
// typo teaches nothing and isn't a real mistake a student would make; these are.
const CONFIG_ELEMENTS = [
  { name: 'sodium', symbol: 'Na', z: 11, config: '1s²2s²2p⁶3s¹', shortOne: '1s²2s²2p⁵3s¹' },
  { name: 'aluminum', symbol: 'Al', z: 13, config: '1s²2s²2p⁶3s²3p¹', shortOne: '1s²2s²2p⁶3s¹3p¹' },
  { name: 'phosphorus', symbol: 'P', z: 15, config: '1s²2s²2p⁶3s²3p³', shortOne: '1s²2s²2p⁶3s²3p²' },
  { name: 'chlorine', symbol: 'Cl', z: 17, config: '1s²2s²2p⁶3s²3p⁵', shortOne: '1s²2s²2p⁶3s²3p⁴' },
  { name: 'calcium', symbol: 'Ca', z: 20, config: '1s²2s²2p⁶3s²3p⁶4s²', shortOne: '1s²2s²2p⁶3s²3p⁶4s¹' },
  {
    name: 'iron', symbol: 'Fe', z: 26, config: '1s²2s²2p⁶3s²3p⁶4s²3d⁶', shortOne: '1s²2s²2p⁶3s²3p⁶4s²3d⁵',
    wrongOrder: '1s²2s²2p⁶3s²3p⁶3d⁶4s²',
  },
  {
    name: 'zinc', symbol: 'Zn', z: 30, config: '1s²2s²2p⁶3s²3p⁶4s²3d¹⁰', shortOne: '1s²2s²2p⁶3s²3p⁶4s²3d⁹',
    wrongOrder: '1s²2s²2p⁶3s²3p⁶3d¹⁰4s²',
  },
];

registerChemTemplate({
  id: 'chem1-02-electron-configuration',
  chapterId: CH,
  band: 2,
  name: 'Ground-state electron configuration from periodic table position',
  concepts: ['electron-configuration-periodic-table'],
  generate: (rng, h) => {
    const el = h.pick(CONFIG_ELEMENTS);
    const distractors = [
      { value: el.shortOne, error: 'electron-count-off', why: `used a total electron count that doesn't match ${el.z}, the atomic number of ${el.symbol}` },
    ];
    if (el.wrongOrder) {
      distractors.push({ value: el.wrongOrder, error: 'wrong-fill-order', why: 'wrote the subshells in the order they appear on the periodic table row-by-row (3d before 4s) instead of the actual Aufbau filling order, where 4s fills before 3d' });
    }
    return {
      stem: `What is the ground-state electron configuration of ${el.name} (${el.symbol}, Z = ${el.z})?`,
      ...h.choices(el.config, distractors),
      explanation: `${el.name} (Z = ${el.z}) has ${el.z} electrons, filled in order of increasing energy (1s, 2s, 2p, 3s, 3p, 4s, 3d, ...): ${el.config}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// valence-electrons
// ---------------------------------------------------------------------------
const VALENCE_ELEMENTS = [
  { name: 'oxygen', symbol: 'O', group: 16, valence: 6 },
  { name: 'nitrogen', symbol: 'N', group: 15, valence: 5 },
  { name: 'sodium', symbol: 'Na', group: 1, valence: 1 },
  { name: 'magnesium', symbol: 'Mg', group: 2, valence: 2 },
  { name: 'aluminum', symbol: 'Al', group: 13, valence: 3 },
  { name: 'sulfur', symbol: 'S', group: 16, valence: 6 },
  { name: 'chlorine', symbol: 'Cl', group: 17, valence: 7 },
  { name: 'carbon', symbol: 'C', group: 14, valence: 4 },
];

registerChemTemplate({
  id: 'chem1-02-valence-electrons',
  chapterId: CH,
  band: 1,
  name: 'Counting valence electrons from group number',
  concepts: ['valence-electrons'],
  generate: (rng, h) => {
    const el = h.pick(VALENCE_ELEMENTS);
    const distractors = [
      { value: String(el.valence - 1), error: 'off-by-one', why: 'miscounted by one valence electron' },
      { value: String(el.valence + 1), error: 'off-by-one', why: 'miscounted by one valence electron' },
    ];
    // Only groups 13-18 have a group number that differs from their valence-electron count
    // (group 1/2's number already IS the valence count, so "used the raw group number" isn't a
    // distinct, meaningful wrong answer for them — it would just repeat the correct value).
    if (el.group > 12) {
      distractors.push({ value: String(el.group), error: 'used-raw-group-number', why: "used the periodic table's raw group number (13-18) directly as the valence count, instead of subtracting 10 to get the actual count of valence electrons" });
    }
    return {
      stem: `How many valence electrons does a neutral ${el.name} (${el.symbol}) atom have?`,
      ...h.choices(String(el.valence), distractors),
      explanation: `For a main-group element, the number of valence electrons matches its group number (using the 1-2, 13-18 labeling): ${el.name} is in group ${el.group}, so it has ${el.valence} valence electrons.`,
    };
  },
});

// ---------------------------------------------------------------------------
// cation-electron-removal-order
// ---------------------------------------------------------------------------
// `wrongRemoveD` is hand-written per element (removes 2 electrons from 3d instead of 4s) —
// an earlier version built this with a regex targeting ASCII \d digits, which never matches
// the superscript Unicode digits actually used here (⁶⁷⁸ etc.), so the "remove from 3d"
// replacement silently no-opped and the distractor collapsed onto the correct answer on every
// single generation, invisibly losing this error-mode entirely.
const TRANSITION_CATIONS = [
  { name: 'iron', symbol: 'Fe', neutralConfig: '[Ar]4s²3d⁶', ion: 'Fe²⁺', ionConfig: '[Ar]3d⁶', wrongRemoveD: '[Ar]4s²3d⁴' },
  { name: 'manganese', symbol: 'Mn', neutralConfig: '[Ar]4s²3d⁵', ion: 'Mn²⁺', ionConfig: '[Ar]3d⁵', wrongRemoveD: '[Ar]4s²3d³' },
  { name: 'cobalt', symbol: 'Co', neutralConfig: '[Ar]4s²3d⁷', ion: 'Co²⁺', ionConfig: '[Ar]3d⁷', wrongRemoveD: '[Ar]4s²3d⁵' },
  { name: 'nickel', symbol: 'Ni', neutralConfig: '[Ar]4s²3d⁸', ion: 'Ni²⁺', ionConfig: '[Ar]3d⁸', wrongRemoveD: '[Ar]4s²3d⁶' },
];

registerChemTemplate({
  id: 'chem1-02-cation-removal-order',
  chapterId: CH,
  band: 3,
  name: 'Which electrons a transition metal loses first',
  concepts: ['cation-electron-removal-order'],
  generate: (rng, h) => {
    const m = h.pick(TRANSITION_CATIONS);
    const wrongRemoveD = m.wrongRemoveD;
    return {
      stem: `Neutral ${m.name} (${m.symbol}) has the configuration ${m.neutralConfig}. What is the electron configuration of the ${m.ion} ion?`,
      ...h.choices(
        m.ionConfig,
        [
          { value: wrongRemoveD, error: 'removed-d-before-s', why: 'removed 3d electrons before the 4s electrons — even though 4s filled first, the highest-n s-electrons are always removed FIRST when forming a cation' },
          { value: m.neutralConfig, error: 'no-electrons-removed', why: 'did not actually remove any electrons for the +2 charge' },
        ],
      ),
      explanation: `When a transition metal forms a cation, the electrons in the HIGHEST principal quantum number (n) are removed first — here that's the 4s electrons, even though 3d filled after 4s during the building-up process. ${m.symbol} loses both 4s electrons to form ${m.ion}: ${m.ionConfig}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// orbital-diagrams-paramagnetism
// ---------------------------------------------------------------------------
const PARAMAGNETIC_CASES = [
  { name: 'nitrogen atom', config: '2p³ (three separate p orbitals, one electron each)', unpaired: 3, magnetic: 'paramagnetic' },
  { name: 'oxygen atom', config: '2p⁴ (two orbitals with one electron each, one orbital with a pair)', unpaired: 2, magnetic: 'paramagnetic' },
  { name: 'neon atom', config: '2p⁶ (all three p orbitals fully paired)', unpaired: 0, magnetic: 'diamagnetic' },
  { name: 'magnesium atom', config: '3s² (fully paired)', unpaired: 0, magnetic: 'diamagnetic' },
  { name: 'carbon atom', config: '2p² (two separate p orbitals, one electron each, by Hund\'s rule)', unpaired: 2, magnetic: 'paramagnetic' },
];

registerChemTemplate({
  id: 'chem1-02-orbital-paramagnetism',
  chapterId: CH,
  band: 2,
  name: "Hund's rule and paramagnetism",
  concepts: ['orbital-diagrams-paramagnetism'],
  generate: (rng, h) => {
    const c = h.pick(PARAMAGNETIC_CASES);
    const wrongMagnetic = c.magnetic === 'paramagnetic' ? 'diamagnetic' : 'paramagnetic';
    return {
      stem: `A ${c.name} has the valence configuration ${c.config}, giving it ${c.unpaired} unpaired electron${c.unpaired === 1 ? '' : 's'}. Is this atom paramagnetic or diamagnetic?`,
      ...h.choices(
        c.magnetic,
        [{ value: wrongMagnetic, error: 'paramagnetic-diamagnetic-swapped', why: c.unpaired > 0 ? 'called an atom with unpaired electrons diamagnetic — any unpaired electrons make an atom paramagnetic' : 'called a fully-paired atom paramagnetic — with zero unpaired electrons, it must be diamagnetic' }],
      ),
      explanation: `By Hund's rule, electrons fill degenerate orbitals singly (with parallel spins) before pairing up. An atom with ANY unpaired electrons is paramagnetic (weakly attracted to a magnetic field); an atom with all electrons paired is diamagnetic. Here there are ${c.unpaired} unpaired electron${c.unpaired === 1 ? '' : 's'}, so the atom is ${c.magnetic}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// effective-nuclear-charge-zeff
// ---------------------------------------------------------------------------
const ZEFF_PAIRS = [
  { lower: 'Na', higher: 'Cl', period: 3 }, { lower: 'Mg', higher: 'S', period: 3 },
  { lower: 'Li', higher: 'F', period: 2 }, { lower: 'K', higher: 'Br', period: 4 },
];

registerChemTemplate({
  id: 'chem1-02-zeff-trend',
  chapterId: CH,
  band: 2,
  name: 'Effective nuclear charge trend across a period',
  concepts: ['effective-nuclear-charge-zeff'],
  generate: (rng, h) => {
    const p = h.pick(ZEFF_PAIRS);
    return {
      stem: `${p.lower} and ${p.higher} are both in period ${p.period}, with ${p.higher} farther to the right on the periodic table. Which one has the greater effective nuclear charge (Zeff) on its valence electrons?`,
      ...h.choices(
        p.higher,
        [{ value: p.lower, error: 'zeff-trend-reversed', why: `assumed Zeff decreases moving right across a period — it actually INCREASES, since each added proton isn't fully shielded by the added electrons in the same shell` }],
      ),
      explanation: `Effective nuclear charge increases moving LEFT to RIGHT across a period: each element adds a proton, but the added valence electron doesn't shield the others well (same shell, poor mutual shielding). ${p.higher} is farther right than ${p.lower}, so it has the higher Zeff.`,
    };
  },
});

// ---------------------------------------------------------------------------
// periodic-trend-atomic-radius
// ---------------------------------------------------------------------------
const RADIUS_PAIRS = [
  { smaller: 'F', bigger: 'Li', reason: 'same period — F is farther right, so it is smaller' },
  { smaller: 'Cl', bigger: 'F', reason: 'same group — Cl is one period lower, so it is bigger' },
  { smaller: 'O', bigger: 'C', reason: 'same period — O is farther right, so it is smaller' },
  { smaller: 'Na', bigger: 'K', reason: 'same group — K is one period lower, so it is bigger' },
];

registerChemTemplate({
  id: 'chem1-02-atomic-radius-trend',
  chapterId: CH,
  band: 1,
  name: 'Periodic trend in atomic radius',
  concepts: ['periodic-trend-atomic-radius'],
  generate: (rng, h) => {
    const p = h.pick(RADIUS_PAIRS);
    return {
      stem: `Which has the LARGER atomic radius: ${p.smaller} or ${p.bigger}?`,
      ...h.choices(
        p.bigger,
        [{ value: p.smaller, error: 'atomic-radius-trend-reversed', why: `picked the smaller atom — atomic radius decreases moving right across a period (more Zeff pulls electrons in) and increases moving down a group (an added shell)` }],
      ),
      explanation: `Atomic radius DECREASES left→right across a period (increasing Zeff pulls electrons closer) and INCREASES top→bottom down a group (each row adds a new electron shell). ${p.bigger} is bigger than ${p.smaller}: ${p.reason}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// periodic-trend-ionic-radius
// ---------------------------------------------------------------------------
const ION_SIZE_CASES = [
  { neutral: 'Na', ion: 'Na⁺', direction: 'smaller', reason: 'losing its valence electron removes an entire shell and increases Zeff per remaining electron' },
  { neutral: 'Cl', ion: 'Cl⁻', direction: 'larger', reason: 'gaining an electron increases electron-electron repulsion without adding a proton to compensate' },
  { neutral: 'Mg', ion: 'Mg²⁺', direction: 'smaller', reason: 'losing electrons removes a shell and increases Zeff per remaining electron' },
  { neutral: 'O', ion: 'O²⁻', direction: 'larger', reason: 'gaining electrons increases electron-electron repulsion without adding protons to compensate' },
];

registerChemTemplate({
  id: 'chem1-02-ionic-radius-compare',
  chapterId: CH,
  band: 2,
  name: 'Comparing an ion\'s radius to its neutral atom',
  concepts: ['periodic-trend-ionic-radius'],
  generate: (rng, h) => {
    const c = h.pick(ION_SIZE_CASES);
    const opposite = c.direction === 'smaller' ? 'larger' : 'smaller';
    return {
      stem: `Is the ${c.ion} ion larger or smaller than the neutral ${c.neutral} atom it came from?`,
      ...h.choices(
        `${c.direction} than the neutral atom`,
        [{ value: `${opposite} than the neutral atom`, error: 'ionic-radius-direction-reversed', why: `got the direction backwards for ${c.direction === 'smaller' ? 'a cation (losing electrons)' : 'an anion (gaining electrons)'}` }],
      ),
      explanation: `${c.ion} is ${c.direction} than neutral ${c.neutral} because ${c.reason}. Cations (losing electrons) always shrink; anions (gaining electrons) always grow.`,
    };
  },
});

// ---------------------------------------------------------------------------
// ionization-energy-trend
// ---------------------------------------------------------------------------
const IE_PAIRS = [
  { higher: 'F', lower: 'Li', reason: 'same period — F is farther right (higher Zeff, smaller radius), so it holds its electrons more tightly' },
  { higher: 'He', lower: 'Xe', reason: 'same group — He is at the very top, with the smallest radius and least shielding' },
  { higher: 'N', lower: 'Na', reason: 'same period — N is farther right than Na' },
  { higher: 'Cl', lower: 'I', reason: 'same group — Cl is higher up, with a smaller radius and less shielding' },
];

registerChemTemplate({
  id: 'chem1-02-ionization-energy-trend',
  chapterId: CH,
  band: 2,
  name: 'Periodic trend in first ionization energy',
  concepts: ['ionization-energy-trend'],
  generate: (rng, h) => {
    const p = h.pick(IE_PAIRS);
    return {
      stem: `Which has the HIGHER first ionization energy: ${p.higher} or ${p.lower}?`,
      ...h.choices(
        p.higher,
        [{ value: p.lower, error: 'ionization-energy-trend-reversed', why: 'picked the element that is easier to ionize — first ionization energy increases right across a period and increases up a group, tracking with a SMALLER atomic radius and HIGHER Zeff' }],
      ),
      explanation: `First ionization energy INCREASES left→right across a period and INCREASES bottom→top up a group — the opposite direction from atomic radius. ${p.higher} has the higher ionization energy: ${p.reason}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// mole-definition
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-02-mole-definition',
  chapterId: CH,
  band: 1,
  name: 'What a mole is',
  concepts: ['mole-definition'],
  generate: (rng, h) => {
    const items = ['atoms', 'molecules', 'ions', 'formula units'];
    const item = h.pick(items);
    return {
      stem: `A chemist says a sample contains "1 mole" of ${item}. What does this mean?`,
      ...h.choices(
        `The sample contains 6.022 × 10²³ ${item}`,
        [
          { value: `The sample has a mass of 6.022 × 10²³ grams`, error: 'mole-mass-confused', why: 'confused the mole (a COUNT of particles) with a mass — a mole is not a fixed mass, its mass depends on what substance you have' },
          { value: `The sample contains exactly 1 gram of ${item}`, error: 'mole-mass-confused', why: 'confused a mole with a gram — these are unrelated units unless you also know the molar mass' },
          { value: `The sample contains 1000 ${item}`, error: 'wrong-magnitude', why: "used an arbitrary round number instead of Avogadro's number" },
        ],
      ),
      explanation: `A mole is defined as exactly 6.022 × 10²³ of whatever is being counted (Avogadro's number) — it's a COUNTING unit, like "a dozen," not a mass. The mass of one mole depends entirely on what substance you have (its molar mass).`,
    };
  },
});
