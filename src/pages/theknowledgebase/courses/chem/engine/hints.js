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
  { name: 'q = m × c × ΔT', test: /q = m|m × c × ΔT|mcΔT|specific heat/, how: ['ΔT is FINAL minus INITIAL. Something that cools has a negative ΔT and a negative q.', 'Mass in grams to match a specific heat in J/(g·°C). Water: 1 mL = 1 g.'] },
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

/** @returns {string[]} hints in reveal order */
export function chemHints({ stem = '', explanation = '', choices, correctIndex }, topic) {
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
  if (!consts.length && !rels.length) out.push(topic && !leaks.some((t) => t(topic)) ? `No constants needed. Topic: ${topic}.` : 'No constants needed: this one is conceptual.');
  for (const r of rels) for (const h of r.how ?? []) out.push(h);
  for (const s of steps(explanation, answer)) {
    if (out.length >= MAX_HINTS - 1) break;
    out.push(`Step: ${s}`);
  }
  return out.slice(0, MAX_HINTS);
}

function listOf(xs) {
  if (xs.length < 2) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
