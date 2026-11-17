// Hints for a chem question, revealed one at a time in the drill (Trey, 2026-11-02: "one of the
// first hints should be 'you need to know the speed of light' etc, don't give the # just tell me
// i should know it").
//
// Derived from the question's own stem + explanation, so every template gets hints without being
// edited. Hint 1 names the constants, never their values; hint 2 names the relationship. A
// constant the stem already prints is still named: the exam may not print it.

const CONSTANTS = [
  { name: "Planck's constant (h)", test: /6\.626|Planck|E = hν|hc\/λ|= hν/ },
  { name: 'the speed of light (c)', test: /3\.00 × 10⁸|2\.998 ?× ?10⁸|speed of light|λν|ν = c\/λ|λ = c\/ν|hc\// },
  { name: "Avogadro's number", test: /6\.022|Avogadro/ },
  { name: 'the Rydberg constant', test: /1\.097|R∞|R_H|2\.18 ?× ?10⁻¹⁸|Rydberg/ },
  { name: 'the specific heat of water', test: /4\.18 ?4? J\/\(?g|specific heat of water|(mL|g) of water/ },
  { name: 'the calorie-joule conversion', test: /1 cal = 4\.184|cal\b.*4\.184|4\.184 J.*cal/ },
  { name: 'the gas constant (R)', test: /0\.0821|0\.08206|8\.314|PV = nRT/ },
  { name: 'the molar volume of a gas at STP', test: /22\.4 L/ },
  { name: 'the density of water', test: /1\.00 g\/mL|density of water|mL of water/ },
  { name: 'molar masses from the periodic table', test: /g\/mol/ },
];

const RELATIONS = [
  { name: 'E = hν (energy of one photon)', test: /E = hν|= hν/, how: ['E is the energy of ONE photon, in joules. Multiply h by the frequency in Hz (s⁻¹); the s cancels and leaves J.'] },
  { name: 'c = λν (wavelength × frequency)', test: /λν|ν = c\/λ|λ = c\/ν/, how: ['Rearrange BEFORE plugging in: ν = c/λ or λ = c/ν. They move opposite: long wavelength, low frequency.', 'Units must match c (m/s): put the wavelength in METERS first (1 nm = 10⁻⁹ m).'] },
  { name: 'E = hc/λ', test: /hc\/λ/, how: ['Convert the wavelength to meters before dividing (1 nm = 10⁻⁹ m). Forgetting this is the most common wrong answer.', 'Multiply h × c on top first, then divide by λ. Watch the powers of ten: add exponents when multiplying, subtract when dividing.'] },
  { name: 'the Rydberg equation', test: /1\/λ =|Rydberg|R_H\(/, how: ['The LOWER level goes in the first term (1/n₁²), the higher level second, so the bracket comes out positive.', 'Square each n before taking 1 over it: 1/2² = 1/4, not 1/2.', 'If the equation gives 1/λ, flip it at the end to get λ, then convert m to nm (× 10⁹).'] },
  { name: 'q = m × c × ΔT', test: /q = m|m × c × ΔT|mcΔT|specific heat (of \w+ is )?[\d(]/, how: ['ΔT is FINAL minus INITIAL. Something that cools has a negative ΔT and a negative q.', 'Mass in grams to match a specific heat in J/(g·°C). Water: 1 mL = 1 g.'] },
  { name: 'heat lost = heat gained (q_hot = −q_cold)', test: /heat lost|q_hot|−q_cold|q_metal|gained by the water/, how: ['Write one m·c·ΔT for EACH object, then set their sum to zero (q_hot + q_cold = 0).', 'There is only one unknown. Expand both brackets, gather the unknown on one side, and solve.', 'Sanity check: a final temperature must land BETWEEN the two starting temperatures, nearer the one with more m × c.'] },
  { name: 'ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants)', test: /ΔH°f|ΔHf°|ΔH_f/, how: ['Multiply each ΔH°f by that substance’s coefficient in the balanced equation.', 'An element in its standard state (O₂, H₂, Cl₂, C graphite) has ΔH°f = 0.', 'Products MINUS reactants, in that order. Watch double negatives.'] },
  { name: "Hess's law (flip and scale the given equations, then add)", test: /Hess/, how: ['Find each target compound in ONE given equation. Is it on the same side as in the target? If not, flip that equation and flip the sign of its ΔH.', 'Multiply an equation to match the target coefficient, and multiply its ΔH by the same number.', 'Add the adjusted equations; everything not in the target must cancel. Then add the adjusted ΔH values.'] },
  { name: 'PV = nRT', test: /PV = nRT/ },
  { name: 'M₁V₁ = M₂V₂', test: /M₁V₁|M1V1|dilution/i },
  { name: 'd = m/V', test: /d = m\/V|density =/ },
  { name: 'orbitals per subshell = 2l + 1', test: /2l \+ 1/, how: ['Letters to l: s = 0, p = 1, d = 2, f = 3. mₗ runs from −l to +l, one orbital per value.'] },
  { name: 'orbitals per shell = n², electrons per shell = 2n²', test: /n²|2n²/, how: ['Each orbital holds 2 electrons. Decide first whether the question asks for ORBITALS or ELECTRONS.'] },
  { name: 'electrons = Z − charge', test: /Z − charge|Electrons = Z/, how: ['A positive charge means electrons were LOST (fewer electrons); a negative charge means GAINED.', 'Count electrons for the given species first, then for each option. Isoelectronic means the same electron count, nothing else.'] },
];

// The ladder, modelled on the Exam 2 Skill Sweep he studied from (Drive: CHEM 1210/
// Exam2_Skill_Sweep.html): first where to start, then one step at a time, and NO hint ever
// contains the answer. The steps come from the question's own worked explanation; any step that
// mentions the answer is dropped, and so is the last one, which is usually the conclusion.
const MAX_HINTS = 7;

function answerTests(answer) {
  const a = String(answer ?? '').trim();
  if (!a) return [];
  // A short answer like "S" or "Cs" must match as a word, or every sentence with a capital S goes.
  const word = new RegExp(`(?<![A-Za-z])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`);
  const tests = [a.length <= 3 ? (s) => word.test(s) : (s) => s.includes(a)];
  const num = a.match(/[−-]?\d+(?:\.\d+)?/);
  if (num) {
    const n = num[0].replace('−', '-').replace(/^-/, '');
    const re = new RegExp(`(?<![\\d.])${n.replace('.', '\\.')}(?![\\d])`);
    tests.push((s) => re.test(s.replace(/−/g, '-')));
  }
  return tests;
}

function steps(explanation, answer) {
  const parts = String(explanation)
    .split(/\n+|(?<=\.)\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const leaks = answerTests(answer);
  // A step that prints a constant's value is dropped too: the hint names it, he supplies it.
  const constValue = /6\.626|3\.00 ?× ?10⁸|2\.998|1\.097|6\.022|2\.18 ?× ?10⁻¹⁸|4\.18/;
  return parts.slice(0, -1).filter((s) => !leaks.some((t) => t(s)) && !constValue.test(s));
}

// Concept questions have no constant or equation to name, so their ladder is written per concept:
// where to look first, then the principle, then why it works. General rules only; the step that
// applies them to THIS question's elements is his to take.
const CONCEPT_HINTS = {
  'ionization-energy-trend': [
    'Find both elements on the periodic table first. Are they in the same period (row) or the same group (column)?',
    'Ionization energy is the energy needed to pull off the outermost electron. The tighter it is held, the higher the value.',
    'Across a period, protons are added to the same shell, so Zeff rises and the electron is held tighter. Down a group, the outer electron sits in a higher shell, farther out and better shielded.',
    'So ionization energy runs opposite to atomic radius: highest toward the upper right of the table.',
  ],
  'periodic-trend-atomic-radius': [
    'Locate each element: which period (row) and which group (column)?',
    'Going DOWN a group adds a whole electron shell, so the atom gets bigger.',
    'Going RIGHT across a period adds protons to the same shell, so Zeff rises and pulls the electrons in: the atom gets smaller.',
    'Compare row first (a new shell is the bigger effect), then column within a row.',
  ],
  'periodic-trend-ionic-radius': [
    'Count protons and electrons for each species before comparing.',
    'Losing electrons (a cation) shrinks the particle; gaining electrons (an anion) swells it.',
    'For species with the SAME number of electrons, the one with more protons pulls them in harder and is smaller.',
  ],
  'effective-nuclear-charge-zeff': [
    'Zeff is the pull the outer electrons actually feel: protons minus the shielding from inner electrons.',
    'Across a period, each step adds a proton but the new electron goes in the same shell and shields poorly.',
  ],
  'quantum-number-rules': [
    'Check each quantum number in order: n, then l, then mₗ, then mₛ.',
    'l runs from 0 to n − 1. mₗ runs from −l to +l. mₛ is only +½ or −½.',
    'Letters for l: s = 0, p = 1, d = 2, f = 3.',
  ],
  'absorption-vs-emission': [
    'Which way does the electron move: to a higher n or a lower n?',
    'Moving up takes energy in (absorption). Dropping down gives energy out as a photon (emission).',
    'A bigger energy drop means a higher-energy photon: higher frequency, shorter wavelength.',
  ],
  'electron-configuration-periodic-table': [
    'Find the electron count first: Z for a neutral atom, then adjust for any charge.',
    'Fill in order: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p. Each s holds 2, p 6, d 10.',
    'Read the order straight off the periodic table: the s block, then the d block one shell behind, then the p block.',
  ],
  'valence-electrons': [
    'Valence electrons are those in the outermost shell (highest n).',
    'For main-group elements, groups 1-2 give 1-2; groups 13-18 give the group number minus 10.',
  ],
  'cation-electron-removal-order': [
    'Write the neutral atom’s configuration first.',
    'Electrons leave from the HIGHEST n first, so 4s empties before 3d even though 4s filled first.',
  ],
  'orbital-diagrams-paramagnetism': [
    'Draw the partly filled subshell as boxes.',
    'Hund’s rule: put one electron in each box before pairing any.',
    'Any unpaired electron makes the atom paramagnetic; all paired makes it diamagnetic.',
  ],
  'oxidation-number-rules': [
    'Assign the atoms you are sure of first: F, then group 1A and 2A metals, then H, then O.',
    'The oxidation numbers must add up to the overall charge of the molecule or ion.',
    'Set up one equation with the unknown atom as x and solve.',
  ],
  'oxidation-reduction-definitions': [
    'Assign an oxidation number to every atom on BOTH sides of the arrow.',
    'Oxidation = the number goes UP (electrons lost). Reduction = the number goes DOWN (electrons gained).',
    'A reaction is redox only if some atom’s number changes. A free element on either side is a strong sign.',
  ],
  'oxidizing-reducing-agents': [
    'Find which species is oxidized and which is reduced first.',
    'The species that is REDUCED is the oxidizing agent; the one OXIDIZED is the reducing agent.',
    'Name the species as it is written on the reactant side.',
  ],
  'specific-heat-definition': [
    'Specific heat is the heat needed to raise 1 g by 1 °C.',
    'A high specific heat means the temperature changes LESS for the same heat.',
  ],
  'heat-mass-temperature-relationship': [
    'q = m × c × ΔT ties the four together. Which one is the question changing?',
    'For the same heat, ΔT goes down as mass or specific heat goes up.',
  ],
  'energy-per-mole-reaction': [
    'Find the heat for the amount given (from q = m·c·ΔT, or as stated).',
    'Convert the amount of substance to MOLES with its molar mass.',
    'Divide heat by moles. Released heat makes ΔH negative.',
  ],
  'bomb-calorimetry': [
    'The heat released by the reaction goes into the calorimeter (and its water, if any is given).',
    'Calorimeter: q = C × ΔT with C the heat capacity. Water: q = m × c × ΔT. Add them if both are given.',
    'The reaction’s q is the NEGATIVE of the heat the calorimeter absorbed. Divide by moles burned for kJ/mol.',
  ],
  'coffee-cup-calorimetry': [
    'The solution absorbs the heat: q = m × c × ΔT, using the total solution mass (density about 1 g/mL).',
    'Find the moles that actually reacted. If both reactants are given, check which one runs out.',
    'ΔH = −q ÷ moles. A temperature rise means the reaction released heat, so ΔH is negative.',
  ],
  'thermochemical-stoichiometry': [
    'ΔH in a thermochemical equation is for the moles AS WRITTEN (the coefficients).',
    'Convert the given mass to moles, then scale ΔH by moles given ÷ coefficient.',
    'Reverse the reaction and the sign of ΔH flips. Multiply the reaction and ΔH multiplies too.',
  ],
  'enthalpy-of-formation': [
    'A formation reaction makes ONE mole of the compound from its elements in their standard states.',
    'Elements in their standard state (O₂(g), H₂(g), C graphite) have ΔH°f = 0.',
    'ΔH°rxn = Σ n·ΔH°f(products) − Σ n·ΔH°f(reactants). If one ΔH°f is unknown, write that equation and solve for it.',
  ],
  'thermal-equilibrium-heat-transfer': [
    'Heat flows from the hotter object to the cooler one until they reach one final temperature.',
    'Heat lost by one = heat gained by the other: m₁c₁ΔT₁ + m₂c₂ΔT₂ = 0.',
  ],
  'first-law-thermodynamics': [
    'ΔE = q + w. Decide the sign of each from the system’s point of view.',
    'Heat absorbed by the system: q is positive. Work done ON the system: w is positive. Work done BY the system: w is negative.',
  ],
};

/** @returns {string[]} hints in reveal order */
export function chemHints({ stem = '', explanation = '', choices, correctIndex, concepts = [] }) {
  const text = `${stem}\n${explanation}`;
  const answer = choices && correctIndex != null ? choices[correctIndex] : null;
  const leaks = answerTests(answer);
  const out = [];
  const consts = CONSTANTS.filter((c) => c.test.test(text));
  if (consts.length) {
    const given = consts.filter((c) => c.test.test(stem));
    out.push(`You need to know ${listOf(consts.map((c) => c.name))}.` + (given.length ? ` (This question gives ${consts.length > 1 ? 'some of them' : 'it'}, but the exam may not: know ${consts.length > 1 ? 'them' : 'it'} cold.)` : ''));
  }
  const rels = RELATIONS.filter((r) => r.test.test(text));
  if (rels.length) out.push(`Use ${listOf(rels.map((r) => r.name))}.`);
  for (const r of rels) for (const h of r.how ?? []) out.push(h);
  const before = out.length;
  for (const c of concepts) for (const h of CONCEPT_HINTS[c] ?? []) if (!out.includes(h)) out.push(h);
  // A concept ladder already walks the reasoning; the explanation's sentences would only say it
  // again (Trey saw the trend rule twice in one ladder).
  if (out.length > before && !rels.length) return out.slice(0, MAX_HINTS);
  // A worked step that only repeats an earlier hint ("Electrons = Z − charge" after "Use
  // electrons = Z − charge") is dropped: every press has to tell him something new.
  const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9₀-₉⁰-⁹⁺⁻−+=]+/g, ' ').split(' ').filter(Boolean));
  const repeats = (s) => {
    const w = words(s);
    // Repeats if most of its words were already said in one earlier hint.
    return out.some((o) => { const ow = words(o); return [...w].filter((x) => ow.has(x)).length >= 0.6 * w.size; });
  };
  for (const s of steps(explanation, answer)) {
    if (out.length >= MAX_HINTS) break;
    if (!repeats(s)) out.push(s.replace(/([−-])\s*\(-(\d)/g, '$1 (−$2'));
  }
  return out.slice(0, MAX_HINTS);
}

function listOf(xs) {
  if (xs.length < 2) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
