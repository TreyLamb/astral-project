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
  { name: 'E = hν (energy of one photon)', test: /E = hν|= hν/ },
  { name: 'c = λν (wavelength × frequency)', test: /λν|ν = c\/λ|λ = c\/ν/ },
  { name: 'E = hc/λ', test: /hc\/λ/ },
  { name: 'the Rydberg equation', test: /1\/λ =|Rydberg|R_H\(/ },
  { name: 'q = m × c × ΔT', test: /q = m|m × c × ΔT|mcΔT|specific heat/ },
  { name: 'heat lost = heat gained (q_hot = −q_cold)', test: /heat lost|q_hot|−q_cold|q_metal|gained by the water/ },
  { name: 'ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants)', test: /ΔH°f|ΔHf°|ΔH_f/ },
  { name: "Hess's law (flip and scale the given equations, then add)", test: /Hess/ },
  { name: 'PV = nRT', test: /PV = nRT/ },
  { name: 'M₁V₁ = M₂V₂', test: /M₁V₁|M1V1|dilution/i },
  { name: 'd = m/V', test: /d = m\/V|density =/ },
  { name: 'orbitals per subshell = 2l + 1', test: /2l \+ 1/ },
  { name: 'orbitals per shell = n², electrons per shell = 2n²', test: /n²|2n²/ },
  { name: 'electrons = Z − charge', test: /Z − charge|Electrons = Z/ },
];

/** @returns {string[]} hints in reveal order */
export function chemHints({ stem = '', explanation = '' }, topic) {
  const text = `${stem}\n${explanation}`;
  const out = [];
  const consts = CONSTANTS.filter((c) => c.test.test(text));
  if (consts.length) {
    const given = consts.filter((c) => c.test.test(stem));
    out.push(`You need to know ${listOf(consts.map((c) => c.name))}.` + (given.length ? ` (This question gives ${consts.length > 1 ? 'some of them' : 'it'}, but the exam may not: know ${consts.length > 1 ? 'them' : 'it'} cold.)` : ''));
  }
  const rels = RELATIONS.filter((r) => r.test.test(text));
  if (rels.length) out.push(`Use ${listOf(rels.map((r) => r.name))}.`);
  if (!out.length) out.push(topic ? `No constants needed. Topic: ${topic}.` : 'No constants needed: this one is conceptual.');
  return out;
}

function listOf(xs) {
  if (xs.length < 2) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
