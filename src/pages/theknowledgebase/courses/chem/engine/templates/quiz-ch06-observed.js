// Built from Trey's own graded CHEM 1210 Quiz 19 (Sec 6-3 to 6-4) and Quiz 20 (Sec 6-5), taken
// 2026-11-02 the morning of Exam 3. PDFs: `SupplementalCourseDocs/chem/` (lowercase folder; these
// two DO have a text layer, unlike the Exam 1 quizzes).
//
// These are GENERATORS modelled on the quiz's question KINDS, never copies of its items (Trey,
// 2026-11-02: "USE THEM AS TEMPLATES NOT IDENTICAL QUESTIONS"). Every kind draws its element,
// numbers and wording fresh, and every kind below maps to a quiz question it was modelled on:
//
//   Q19 Q1 allowed l for n              -> shell-counts: allowed-l
//   Q19 Q3/5/6, Q20 Q3/4 subshell (n,l) -> shell-counts: subshell-label
//   Q20 Q7 which qn sets shape          -> shell-counts: which-quantum-number
//   Q20 Q9/Q16 orbitals in subshell     -> shell-counts: subshell-orbitals, ml-range
//   Q20 Q10 orbitals in n = 4 shell     -> shell-counts: shell-orbitals        <- he MISSED this
//   Q20 Q12 electrons in n = 2 shell    -> shell-counts: shell-electrons       <- he MISSED this
//   Q19 Q12/16, Q20 Q2 c = λν, E = hν   -> light-calcs
//   Q19 Q4, Q20 Q5 Rydberg (R∞ in m⁻¹)  -> light-calcs: rydberg
//   Q19 Q13/14/15, Q20 Q1/Q6 EM energy  -> em-spectrum
//   Q20 Q8/Q11 radius order / largest   -> radius-order                        <- he MISSED Q8
//   Q20 Q14 isoelectronic ion radii     -> radius-order: isoelectronic-series
//   Q20 Q15 isoelectronic with Br⁺      -> isoelectronic                       <- he MISSED this
//   Q19 Q10 −2 ion from configuration   -> isoelectronic: ion-from-config
//   Q19 Q2, Q20 Q13 removing electrons  -> ionization-concepts                 <- he MISSED Q19 Q2

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-02-electronic-structure';
const H = 6.626e-34;
const C = 3.00e8;
const RINF = 1.097e7;
const L_LETTER = ['s', 'p', 'd', 'f'];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

/** 6.0e14 -> "6.00 × 10¹⁴" */
function sci(x, digits = 3) {
  const [m, e] = x.toExponential(digits - 1).split('e');
  return `${m} × 10${String(Number(e)).split('').map((ch) => SUP[ch]).join('')}`;
}

// ---------------------------------------------------------------------------
// Quantum numbers and shell bookkeeping (6-3)
// ---------------------------------------------------------------------------
const SHELL_KINDS = ['allowed-l', 'subshell-label', 'which-quantum-number', 'subshell-orbitals', 'ml-range', 'shell-orbitals', 'shell-electrons', 'subshell-electrons'];

const QN_ROLES = [
  { role: 'the general SHAPE of an orbital (s, p, d, f)', qn: 'angular momentum quantum number, l' },
  { role: 'the SIZE and energy level (shell) of an orbital', qn: 'principal quantum number, n' },
  { role: 'the ORIENTATION of an orbital in space', qn: 'magnetic quantum number, mₗ' },
  { role: 'the SPIN direction of an electron', qn: 'spin quantum number, mₛ' },
];

registerChemTemplate({
  id: 'chem1-06q-shell-counts',
  mental: true,
  chapterId: CH,
  section: '6-3',
  band: 2,
  name: 'Quantum numbers: allowed values, subshells, orbital and electron counts',
  concepts: ['quantum-number-rules'],
  generate: (rng, h) => {
    const kind = h.pick(SHELL_KINDS);
    if (kind === 'allowed-l') {
      const n = h.int(2, 5);
      const right = Array.from({ length: n }, (_, i) => i).join(', ');
      return {
        stem: h.pick([`If n = ${n}, what values can l take?`, `For an electron in the n = ${n} shell, which set lists every allowed value of the angular momentum quantum number l?`]),
        ...h.choices(right, [
          { value: Array.from({ length: n }, (_, i) => i + 1).join(', '), error: 'l-from-one', why: 'started l at 1; l runs from 0 to n − 1' },
          { value: Array.from({ length: n + 1 }, (_, i) => i).join(', '), error: 'l-up-to-n', why: 'let l reach n; the top value is n − 1' },
          { value: Array.from({ length: 2 * n - 1 }, (_, i) => i - (n - 1)).join(', '), error: 'ml-range-instead', why: 'gave a −/+ range, which is how mₗ behaves, not l' },
        ]),
        explanation: `l runs from 0 up to n − 1. For n = ${n}: ${right}.`,
      };
    }
    if (kind === 'subshell-label') {
      const l = h.int(0, 3);
      const n = h.int(l + 2, Math.min(7, l + 4));
      const right = `${n}${L_LETTER[l]}`;
      const wrong = [
        { value: `${n}${L_LETTER[(l + 1) % 4]}`, error: 'l-letter-shift', why: `matched l = ${l} to the wrong letter (s = 0, p = 1, d = 2, f = 3)` },
        { value: `${l + 1}${L_LETTER[l]}`, error: 'n-from-l', why: 'took the shell number from l instead of n' },
        { value: `${n}${L_LETTER[(l + 3) % 4]}`, error: 'l-letter-shift', why: `matched l = ${l} to the wrong letter (s = 0, p = 1, d = 2, f = 3)` },
      ];
      if (n > 1) wrong.push({ value: `${n - 1}${L_LETTER[l]}`, error: 'n-minus-one', why: 'shifted the shell number down by one' });
      wrong.push({ value: `${n + 1}${L_LETTER[l]}`, error: 'n-plus-one', why: 'shifted the shell number up by one' });
      return {
        stem: h.pick([`Identify the subshell in which electrons with n = ${n}, l = ${l} are found.`, `An electron has n = ${n} and l = ${l}. Which subshell is it in?`]),
        ...h.choices(right, wrong),
        explanation: `n gives the number and l gives the letter: l = 0 s, 1 p, 2 d, 3 f. n = ${n}, l = ${l} is ${right}.`,
      };
    }
    if (kind === 'which-quantum-number') {
      const target = h.pick(QN_ROLES);
      return {
        stem: `Which quantum number specifically determines ${target.role}?`,
        ...h.choices(target.qn, QN_ROLES.filter((r) => r !== target).map((r) => ({ value: r.qn, error: 'qn-roles-mixed', why: `that one sets ${r.role}` }))),
        explanation: `n = shell size and energy; l = shape (s, p, d, f); mₗ = orientation; mₛ = spin.`,
      };
    }
    if (kind === 'subshell-orbitals' || kind === 'ml-range') {
      const l = kind === 'ml-range' ? h.int(1, 3) : h.int(0, 3);
      const n = h.int(Math.max(l + 1, 2), 5);
      const orbs = 2 * l + 1;
      const range = l === 0 ? 'mₗ = 0 only' : `mₗ from −${l} to +${l}`;
      if (kind === 'ml-range') {
        return {
          stem: `How many orbitals are in a ${L_LETTER[l]} subshell, and what is the range of mₗ values?`,
          ...h.choices(`${orbs} orbitals; ${range}`, [
            { value: `${orbs + 1} orbitals; mₗ from −${l} to +${l + 1}`, error: 'ml-off-by-one', why: 'counted one past +l' },
            { value: `${2 * (l + 1) + 1} orbitals; mₗ from −${l + 1} to +${l + 1}`, error: 'wrong-l-value', why: `used l = ${l + 1}; ${L_LETTER[l]} is l = ${l}` },
            { value: `${l + 1} orbitals; mₗ from 0 to +${l}`, error: 'positive-only', why: 'counted only 0 and positive mₗ; it runs −l to +l' },
          ]),
          explanation: `${L_LETTER[l]} is l = ${l}. Orbitals = 2l + 1 = ${orbs}, ${range}.`,
        };
      }
      return {
        stem: h.pick([`How many orbitals in the n = ${n} shell have l = ${l}?`, `How many orbitals make up the ${n}${L_LETTER[l]} subshell?`]),
        ...h.choices(String(orbs), [
          { value: String(2 * orbs), error: 'counted-electrons', why: 'counted electrons (2 per orbital) instead of orbitals' },
          { value: String(n * n), error: 'whole-shell', why: 'counted every orbital in the shell (n²), not just this subshell' },
          { value: String(l + 1), error: 'positive-ml-only', why: 'counted only mₗ = 0 and the positive values' },
          { value: String(2 * (l + 1) + 1), error: 'wrong-l', why: 'used the next l up' },
        ]),
        explanation: `Orbitals in a subshell = 2l + 1 = 2(${l}) + 1 = ${orbs}. n does not change it.`,
      };
    }
    if (kind === 'shell-orbitals') {
      const n = h.int(2, 5);
      return {
        stem: h.pick([`What is the total number of orbitals in the n = ${n} shell of an atom?`, `How many orbitals does the n = ${n} shell contain in all?`]),
        ...h.choices(String(n * n), [
          { value: String(2 * n * n), error: 'counted-electrons', why: 'counted electrons (2n²) instead of orbitals (n²)' },
          { value: String(2 * n - 1), error: 'top-subshell-only', why: 'counted only the highest subshell (2l + 1 with l = n − 1)' },
          { value: String(n), error: 'counted-subshells', why: 'counted subshells (n of them), not orbitals' },
          { value: String(n * n + 1), error: 'off-by-one', why: 'added one to n²' },
        ]),
        explanation: `A shell holds n² orbitals: ${Array.from({ length: n }, (_, l) => `${n}${L_LETTER[l] ?? '?'} ${2 * l + 1}`).join(' + ')} = ${n * n}.`,
      };
    }
    if (kind === 'shell-electrons') {
      const n = h.int(2, 4);
      return {
        stem: h.pick([`What is the maximum number of electrons that all the orbitals of the n = ${n} shell can hold?`, `How many electrons can the n = ${n} shell hold at most?`]),
        ...h.choices(String(2 * n * n), [
          { value: String(n * n), error: 'counted-orbitals', why: 'counted orbitals (n²) and forgot each holds 2 electrons' },
          { value: String(2 * n), error: 'two-per-shell', why: 'gave 2 electrons per subshell instead of 2 per orbital' },
          { value: String(4 * n * n), error: 'doubled-twice', why: 'doubled the 2n² count' },
          { value: String(2 * (2 * n - 1)), error: 'top-subshell-only', why: 'counted only the highest subshell' },
        ]),
        explanation: `n² orbitals × 2 electrons each = 2n² = 2(${n})² = ${2 * n * n}.`,
      };
    }
    const l = h.int(0, 3);
    const n = h.int(l + 1, 5);
    const e = 2 * (2 * l + 1);
    return {
      stem: `What is the maximum number of electrons in the ${n}${L_LETTER[l]} subshell?`,
      ...h.choices(String(e), [
        { value: String(2 * l + 1), error: 'counted-orbitals', why: 'counted orbitals and forgot 2 electrons each' },
        { value: String(2 * n * n), error: 'whole-shell', why: 'gave the whole shell (2n²)' },
        { value: String(2 * (2 * l + 3)), error: 'wrong-l', why: 'used the next l up' },
        { value: String(e + 2), error: 'off-by-two', why: 'added an extra pair' },
      ]),
      explanation: `${L_LETTER[l]}: 2l + 1 = ${2 * l + 1} orbitals × 2 = ${e} electrons.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Light: c = λν, E = hν, Rydberg (6-2)
// ---------------------------------------------------------------------------
const RYDBERG = [[2, 3], [2, 4], [2, 5], [2, 6], [1, 2], [1, 3], [3, 4], [3, 5]];

registerChemTemplate({
  id: 'chem1-06q-light-calcs',
  chapterId: CH,
  section: '6-2',
  band: 3,
  name: 'Light calculations: c = λν, E = hν, Rydberg',
  concepts: ['photon-energy-wavelength-relationship', 'rydberg-formula-energy-levels'],
  generate: (rng, h) => {
    const kind = h.pick(['nu-from-nm', 'lambda-from-nu', 'E-from-nu', 'E-from-nm', 'rydberg']);
    if (kind === 'nu-from-nm' || kind === 'E-from-nm') {
      const nm = h.pick([250, 300, 400, 450, 500, 550, 600, 650, 700, 750, 800, 1200]);
      const nu = C / (nm * 1e-9);
      if (kind === 'nu-from-nm') {
        return {
          stem: `What is the frequency, in hertz, of light with a wavelength of ${nm}. nm? (λν = c, c = 3.00 × 10⁸ m/s)`,
          ...h.choices(`${sci(nu)} Hz`, [
            { value: `${sci(C / nm)} Hz`, error: 'forgot-nm-conversion', why: 'used nm as if it were m' },
            { value: `${sci(C * nm * 1e-9)} Hz`, error: 'multiplied', why: 'multiplied c × λ instead of dividing' },
            { value: `${sci(nm * 1e-9 / C)} Hz`, error: 'inverted', why: 'divided λ by c' },
          ]),
          explanation: `ν = c/λ = (3.00 × 10⁸ m/s) / (${nm} × 10⁻⁹ m) = ${sci(nu)} Hz.`,
        };
      }
      const E = H * nu;
      return {
        stem: `What is the energy, in joules, of one photon of ${nm}. nm light? (h = 6.626 × 10⁻³⁴ J·s, c = 3.00 × 10⁸ m/s)`,
        ...h.choices(`${sci(E)} J`, [
          { value: `${sci(H * C / nm)} J`, error: 'forgot-nm-conversion', why: 'used nm as if it were m' },
          { value: `${sci(H * nm * 1e-9 / C)} J`, error: 'inverted', why: 'used hλ/c instead of hc/λ' },
          { value: `${sci(nu)} J`, error: 'stopped-at-frequency', why: 'found ν and stopped before multiplying by h' },
        ]),
        explanation: `E = hc/λ = (6.626 × 10⁻³⁴)(3.00 × 10⁸) / (${nm} × 10⁻⁹) = ${sci(E)} J.`,
      };
    }
    if (kind === 'lambda-from-nu' || kind === 'E-from-nu') {
      const mant = h.pick([1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.5]);
      const exp = h.pick([11, 13, 14, 15, 17, 18]);
      const nu = mant * 10 ** exp;
      const nuTxt = `${sci(nu, 2)} Hz`;
      if (kind === 'lambda-from-nu') {
        const lam = C / nu;
        return {
          stem: `A source emits radiation at ${nuTxt}. What is its wavelength in meters? (c = 3.00 × 10⁸ m/s)`,
          ...h.choices(`${sci(lam)} m`, [
            { value: `${sci(C * nu)} m`, error: 'multiplied', why: 'multiplied c × ν instead of dividing' },
            { value: `${sci(nu / C)} m`, error: 'inverted', why: 'divided ν by c' },
            { value: `${sci(lam * 1e9)} m`, error: 'unit-mix', why: 'converted to nm but labelled it meters' },
          ]),
          explanation: `λ = c/ν = (3.00 × 10⁸) / (${sci(nu, 2)}) = ${sci(lam)} m.`,
        };
      }
      const E = H * nu;
      return {
        stem: `Calculate the energy in joules of a photon with a frequency of ${nuTxt}. (E = hν, h = 6.626 × 10⁻³⁴ J·s)`,
        ...h.choices(`${sci(E, 2)} J`, [
          { value: `${sci(H / nu, 2)} J`, error: 'divided', why: 'divided h by ν' },
          { value: `${sci(nu / H, 2)} J`, error: 'inverted', why: 'divided ν by h' },
          { value: `${sci(H * C / nu, 2)} J`, error: 'used-hc-over', why: 'used hc/ν; with a frequency it is just hν' },
        ]),
        explanation: `E = hν = (6.626 × 10⁻³⁴)(${sci(nu, 2)}) = ${sci(E, 2)} J.`,
      };
    }
    const [n1, n2] = h.pick(RYDBERG);
    const inv = RINF * (1 / (n1 * n1) - 1 / (n2 * n2));
    const nm = 1e9 / inv;
    const fmt = (v) => `${v.toFixed(0)} nm`;
    return {
      stem: `Using 1/λ = R∞(1/n₁² − 1/n₂²) with R∞ = 1.097 × 10⁷ m⁻¹, what wavelength (in nm) does hydrogen emit when its electron falls from n = ${n2} to n = ${n1}?`,
      ...h.choices(fmt(nm), [
        { value: fmt(1e9 / (RINF * (1 / n1 - 1 / n2))), error: 'forgot-squares', why: 'used 1/n instead of 1/n²' },
        { value: fmt(1e9 / (RINF / (n1 * n1))), error: 'dropped-n2', why: 'used only the 1/n₁² term' },
        { value: `${(inv).toExponential(2).replace(/e\+?(-?\d+)/, ' × 10^$1')} nm`, error: 'reported-1-over-lambda', why: 'reported 1/λ (in m⁻¹) instead of λ' },
        { value: fmt(1e9 / (RINF * (1 / (n1 * n1) - 1 / ((n2 + 1) * (n2 + 1))))), error: 'wrong-level', why: `used n = ${n2 + 1} instead of n = ${n2}` },
      ]),
      explanation: `1/λ = 1.097 × 10⁷ × (1/${n1}² − 1/${n2}²) = ${inv.toExponential(3)} m⁻¹, so λ = ${(1 / inv).toExponential(3)} m = ${fmt(nm)}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// The EM spectrum: energy, frequency, wavelength ordering (6-2)
// ---------------------------------------------------------------------------
const EM = ['radio waves', 'microwaves', 'infrared (IR)', 'visible light', 'ultraviolet (UV)', 'X-rays', 'gamma rays']; // low -> high energy

registerChemTemplate({
  id: 'chem1-06q-em-spectrum',
  mental: true,
  chapterId: CH,
  section: '6-2',
  band: 2,
  name: 'EM spectrum: which region has the most or least energy, frequency or wavelength',
  concepts: ['photon-energy-wavelength-relationship', 'absorption-vs-emission'],
  generate: (rng, h) => {
    const kind = h.pick(['pick-region', 'pick-region', 'emission-compare', 'lowest-energy-wavelength']);
    if (kind === 'pick-region') {
      const idx = [];
      while (idx.length < 4) { const i = h.int(0, EM.length - 1); if (!idx.includes(i)) idx.push(i); }
      idx.sort((a, b) => a - b);
      const ask = h.pick([
        { q: 'the greatest energy per photon', top: true }, { q: 'the least energy per photon', top: false },
        { q: 'the highest frequency', top: true }, { q: 'the lowest frequency', top: false },
        { q: 'the longest wavelength', top: false }, { q: 'the shortest wavelength', top: true },
      ]);
      const right = EM[ask.top ? idx[3] : idx[0]];
      const opp = EM[ask.top ? idx[0] : idx[3]];
      return {
        stem: `Which of these has ${ask.q}?`,
        ...h.choices(right, idx.map((i) => EM[i]).filter((r) => r !== right).map((r) => ({ value: r, error: r === opp ? 'spectrum-reversed' : 'spectrum-order', why: r === opp ? 'read the spectrum backwards: energy and frequency rise as wavelength falls' : 'misplaced this region in the spectrum order' }))),
        explanation: `Low to high energy (and frequency): radio < microwave < IR < visible < UV < X-ray < gamma. Wavelength runs the opposite way. Answer: ${right}.`,
      };
    }
    if (kind === 'emission-compare') {
      let a = h.int(1, EM.length - 1);
      let b = h.int(0, a - 1);
      const hiFirst = rng() < 0.5;
      const [r1, r2] = hiFirst ? [EM[a], EM[b]] : [EM[b], EM[a]];
      const right = hiFirst ? 'undergone a smaller decrease in energy' : 'undergone a larger decrease in energy';
      return {
        stem: `When energized, element 1 emits ${r1} and element 2 emits ${r2}. Compared with the electron in element 1, the electron in element 2 must have __________.`,
        ...h.choices(right, [
          { value: hiFirst ? 'undergone a larger decrease in energy' : 'undergone a smaller decrease in energy', error: 'energy-order-reversed', why: 'flipped which region carries more energy per photon' },
          { value: 'gained more energy during emission', error: 'emission-gains', why: 'emission LOSES energy; nothing is gained' },
          { value: 'gained less energy during emission', error: 'emission-gains', why: 'emission LOSES energy; nothing is gained' },
        ]),
        explanation: `Emission releases a photon carrying the energy the electron loses. ${hiFirst ? r2 : r1} photons carry more energy than ${hiFirst ? r1 : r2}, so element 2's electron had a ${hiFirst ? 'smaller' : 'larger'} drop.`,
      };
    }
    const pool = [410, 486, 520, 589, 656, 700, 850, 1200, 1500];
    const picks = [];
    while (picks.length < 4) { const v = h.pick(pool); if (!picks.includes(v)) picks.push(v); }
    const wantLow = rng() < 0.5;
    const right = wantLow ? Math.max(...picks) : Math.min(...picks);
    return {
      stem: `Which wavelength corresponds to the photon with the ${wantLow ? 'lowest' : 'highest'} energy?`,
      ...h.choices(`${right} nm`, picks.filter((p) => p !== right).map((p) => ({ value: `${p} nm`, error: 'energy-wavelength-direct', why: 'treated energy as rising with wavelength; E = hc/λ, so they move opposite' }))),
      explanation: `E = hc/λ: the longest wavelength has the least energy, the shortest has the most. Answer: ${right} nm.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Isoelectronic species and electron configurations of ions (6-4/6-5)
// ---------------------------------------------------------------------------
const ELEMENTS = [
  ['N', 7, 2, 15], ['O', 8, 2, 16], ['F', 9, 2, 17], ['Ne', 10, 2, 18], ['Na', 11, 3, 1], ['Mg', 12, 3, 2], ['Al', 13, 3, 13],
  ['P', 15, 3, 15], ['S', 16, 3, 16], ['Cl', 17, 3, 17], ['Ar', 18, 3, 18], ['K', 19, 4, 1], ['Ca', 20, 4, 2], ['Ga', 31, 4, 13],
  ['As', 33, 4, 15], ['Se', 34, 4, 16], ['Br', 35, 4, 17], ['Kr', 36, 4, 18], ['Rb', 37, 5, 1], ['Sr', 38, 5, 2], ['In', 49, 5, 13],
  ['Sb', 51, 5, 15], ['Te', 52, 5, 16], ['I', 53, 5, 17], ['Xe', 54, 5, 18], ['Li', 3, 2, 1], ['Be', 4, 2, 2], ['C', 6, 2, 14],
  ['Si', 14, 3, 14], ['Cs', 55, 6, 1], ['Ba', 56, 6, 2],
].map(([s, z, period, group]) => ({ s, z, period, group }));
const BY = Object.fromEntries(ELEMENTS.map((e) => [e.s, e]));
const ORDER = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2], ['3d', 10], ['4p', 6], ['5s', 2], ['4d', 10], ['5p', 6]];
const supNum = (n) => String(n).split('').map((ch) => SUP[ch]).join('');
function config(e) {
  const out = [];
  for (const [sub, cap] of ORDER) { if (e <= 0) break; const k = Math.min(cap, e); out.push(`${sub}${supNum(k)}`); e -= k; }
  return out.join(' ');
}
const chargeTxt = (q) => (q === 0 ? '' : `${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '⁺' : '⁻'}`.replace(/\d/g, (d) => SUP[d]));
const species = (s, q) => `${s}${chargeTxt(q)}`;
// Charges a main-group element realistically carries, plus the odd one quizzes use (Br⁺).
const CHARGES = { 1: [1, 0], 2: [2, 0], 13: [3, 0], 14: [0], 15: [-3, 0], 16: [-2, 0, 1], 17: [-1, 0, 1], 18: [0] };

registerChemTemplate({
  id: 'chem1-06q-isoelectronic',
  mental: true,
  chapterId: CH,
  section: '6-5',
  band: 3,
  name: 'Isoelectronic species and ion configurations',
  concepts: ['electron-configuration-periodic-table'],
  generate: (rng, h) => {
    const kind = h.pick(['which-isoelectronic', 'which-isoelectronic', 'ion-from-config']);
    if (kind === 'ion-from-config') {
      const q = h.pick([-1, -2, -3]);
      const group = { [-1]: 17, [-2]: 16, [-3]: 15 }[q];
      const target = h.pick(ELEMENTS.filter((e) => e.group === group && e.z <= 53));
      const ne = target.z - q;
      const same = ELEMENTS.filter((e) => e.group === group && e !== target && e.z <= 53);
      const noble = ELEMENTS.find((e) => e.z === ne && e.group === 18);
      const wrong = same.slice(0, 2).map((e) => ({ value: species(e.s, q), error: 'wrong-period', why: `${species(e.s, q)} has ${e.z - q} electrons, not ${ne}` }));
      if (noble) wrong.push({ value: noble.s, error: 'neutral-noble-gas', why: `${noble.s} has this configuration too, but it is a neutral atom, not a ${Math.abs(q)}− ion` });
      const nextGroup = ELEMENTS.find((e) => e.period === target.period && e.group === group + 1 && e.group <= 17);
      if (nextGroup) wrong.push({ value: species(nextGroup.s, q), error: 'one-group-over', why: `${species(nextGroup.s, q)} has ${nextGroup.z - q} electrons` });
      return {
        stem: `Which ion with a ${Math.abs(q)}− charge has the electron configuration ${config(ne)}?`,
        ...h.choices(species(target.s, q), wrong),
        explanation: `The configuration holds ${ne} electrons. A ${Math.abs(q)}− ion has ${Math.abs(q)} more electrons than protons, so Z = ${ne} − ${Math.abs(q)} = ${target.z}: ${target.s}, giving ${species(target.s, q)}.`,
      };
    }
    // Pick a target species that has at least one isoelectronic partner in the table.
    const all = [];
    for (const e of ELEMENTS) for (const c of CHARGES[e.group]) all.push({ s: e.s, q: c, ne: e.z - c });
    const partners = (x) => all.filter((y) => y.ne === x.ne && y.s !== x.s);
    const target = h.pick(all.filter((x) => x.q !== 0 && x.ne >= 8 && partners(x).length));
    const base = BY[target.s];
    const q = target.q;
    const ne = target.ne;
    const matches = partners(target);
    const right = h.pick(matches);
    const near = all.filter((x) => Math.abs(x.ne - ne) >= 1 && Math.abs(x.ne - ne) <= 2);
    const wrong = [];
    // The classic trap: same element as the target's neighbour by Z, i.e. counted protons not electrons.
    const byZ = ELEMENTS.find((e) => e.z === base.z && e.group !== 18 && q !== 0);
    if (byZ) wrong.push({ value: byZ.s, error: 'counted-protons', why: `neutral ${base.s} has ${base.z} electrons; the ${q > 0 ? 'positive' : 'negative'} charge changes that to ${ne}` });
    for (const x of near) { if (wrong.length >= 4) break; wrong.push({ value: species(x.s, x.q), error: 'electron-count-off', why: `${species(x.s, x.q)} has ${x.ne} electrons, not ${ne}` }); }
    return {
      stem: h.pick([`Which of the following is isoelectronic with ${species(base.s, q)}?`, `Which species has the same number of electrons as ${species(base.s, q)}?`]),
      ...h.choices(species(right.s, right.q), wrong),
      explanation: `Electrons = Z − charge. ${species(base.s, q)}: ${base.z} − (${q}) = ${ne}. ${species(right.s, right.q)}: ${BY[right.s].z} − (${right.q}) = ${ne}. Same count, so isoelectronic.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Ordering atoms and isoelectronic ions by radius (6-5)
// ---------------------------------------------------------------------------
// Atomic radius by position: bigger down a group, smaller across a period. For the ordering
// question every pair must be decidable by position alone, so atoms come from a "staircase":
// each next atom is lower AND no farther right, or the same period farther left.
function rankByPosition(list) {
  return [...list].sort((a, b) => (a.period - b.period) || (b.group - a.group));
}
function orderable(list) {
  const s = rankByPosition(list);
  for (let i = 1; i < s.length; i++) if (s[i].period > s[i - 1].period && s[i].group > s[i - 1].group) return false;
  return true;
}

registerChemTemplate({
  id: 'chem1-06q-radius-order',
  mental: true,
  chapterId: CH,
  section: '6-5',
  band: 3,
  name: 'Ordering atoms and isoelectronic ions by radius',
  concepts: ['periodic-trend-atomic-radius', 'periodic-trend-ionic-radius'],
  generate: (rng, h) => {
    const kind = h.pick(['atom-order', 'atom-order', 'largest', 'isoelectronic-series']);
    if (kind === 'isoelectronic-series') {
      const series = h.pick([
        ['P', -3, 'S', -2, 'Cl', -1, 'Ar', 0, 'K', 1, 'Ca', 2],
        ['N', -3, 'O', -2, 'F', -1, 'Ne', 0, 'Na', 1, 'Mg', 2, 'Al', 3],
        ['As', -3, 'Se', -2, 'Br', -1, 'Kr', 0, 'Rb', 1, 'Sr', 2],
      ]);
      const items = [];
      for (let i = 0; i < series.length; i += 2) items.push({ s: series[i], q: series[i + 1], z: BY[series[i]].z });
      const chosen = [];
      while (chosen.length < 4) { const it = h.pick(items); if (!chosen.includes(it)) chosen.push(it); }
      const dec = rng() < 0.5;
      const sorted = [...chosen].sort((a, b) => (dec ? a.z - b.z : b.z - a.z));
      const fmt = (arr) => arr.map((x) => species(x.s, x.q)).join(', ');
            return {
        stem: `These species all have the same number of electrons. Rank them in order of ${dec ? 'DECREASING' : 'INCREASING'} radius: ${fmt(h.pick([chosen, [...chosen].reverse()]))}.`,
        ...h.choices(fmt(sorted), [
          { value: fmt([...sorted].reverse()), error: 'reversed', why: 'right order, wrong direction' },
          { value: fmt([sorted[0], sorted[1], sorted[3], sorted[2]]), error: 'swap', why: 'swapped two neighbours; more protons on the same electrons always means smaller' },
          { value: fmt([sorted[0], sorted[2], sorted[1], sorted[3]]), error: 'swap', why: 'swapped two neighbours; rank strictly by proton count' },
          { value: fmt([sorted[1], sorted[0], sorted[2], sorted[3]]), error: 'swap', why: 'swapped two neighbours; rank strictly by proton count' },
        ]),
        explanation: `Same electrons, so the one with the MOST protons pulls hardest and is smallest. Order by Z: ${fmt(sorted)}.`,
      };
    }
    let atoms;
    do {
      atoms = [];
      while (atoms.length < 4) { const a = h.pick(ELEMENTS.filter((e) => e.group !== 18 && e.s !== 'Ga' && e.s !== 'In')); if (!atoms.includes(a)) atoms.push(a); }
    } while (!orderable(atoms) || new Set(atoms.map((a) => `${a.period}-${a.group}`)).size < 4);
    const inc = rankByPosition(atoms); // smallest first
    if (kind === 'largest') {
      const big = inc[3];
      return {
        stem: `Based on their positions in the periodic table, which has the LARGEST atomic radius: ${atoms.map((a) => a.s).join(', ')}?`,
        ...h.choices(big.s, inc.slice(0, 3).map((a) => ({ value: a.s, error: a === inc[0] ? 'trend-reversed' : 'trend-partial', why: a === inc[0] ? 'picked the smallest: radius grows DOWN a group and shrinks to the RIGHT' : `${a.s} is higher or farther right than ${big.s}` }))),
        explanation: `Radius increases down a group and decreases across a period. ${big.s} is lowest / farthest left, so it is largest.`,
      };
    }
    const fmt = (arr) => arr.map((a) => a.s).join(' < ');
    const byGroupOnly = [...atoms].sort((a, b) => b.group - a.group);
    return {
      stem: `Based on their positions in the periodic table, list ${atoms.map((a) => a.s).join(', ')} in order of increasing atomic radius.`,
      ...h.choices(fmt(inc), [
        { value: fmt([...inc].reverse()), error: 'reversed', why: 'gave decreasing order' },
        { value: fmt(byGroupOnly), error: 'group-only', why: 'ranked by group alone and ignored the period (down a group adds a shell)' },
        { value: fmt([inc[1], inc[0], inc[2], inc[3]]), error: 'swap', why: 'swapped the two smallest' },
        { value: fmt([inc[0], inc[1], inc[3], inc[2]]), error: 'swap', why: 'swapped the two largest' },
        { value: fmt([inc[0], inc[2], inc[1], inc[3]]), error: 'swap', why: 'swapped the middle two' },
      ]),
      explanation: `Radius grows going DOWN a group (new shell) and shrinks going RIGHT across a period (higher Zeff). Smallest to largest: ${fmt(inc)}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Removing electrons: always costs energy; outer electrons cost less (6-5)
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-06q-ionization-concepts',
  mental: true,
  chapterId: CH,
  section: '6-5',
  band: 2,
  name: 'Why removing an electron costs energy, and why outer electrons cost less',
  concepts: ['ionization-energy-trend'],
  generate: (rng, h) => {
    const kind = h.pick(['sign', 'why-high-n', 'easiest']);
    if (kind === 'sign') {
      const el = h.pick(ELEMENTS);
      return {
        stem: h.pick([`To remove an electron from a gaseous ${el.s} atom, the process...`, `Is ionizing a gaseous ${el.s} atom (${el.s} → ${el.s}⁺ + e⁻) endothermic or exothermic?`]),
        ...h.choices('requires energy (endothermic, ionization energy is positive)', [
          { value: 'releases energy (exothermic)', error: 'ie-sign', why: 'the electron is attracted to the nucleus; pulling it away always costs energy' },
          { value: 'may require or release energy depending on the atom', error: 'ie-depends', why: 'atoms differ in HOW MUCH it costs, never in whether it costs' },
          { value: 'involves no energy change', error: 'ie-zero', why: 'a bound electron is held by the nucleus; separating it takes work' },
        ]),
        explanation: `An electron is bound by attraction to the nucleus, so separating it always takes energy. Ionization energies are always positive; only the size varies.`,
      };
    }
    if (kind === 'why-high-n') {
      return {
        stem: h.pick(['Why are electrons in shells with a higher principal quantum number n generally easier to remove?', 'Why does an electron in a high-n shell have a lower ionization energy than one in a low-n shell?']),
        ...h.choices('They are farther from the nucleus on average, so they feel a weaker attraction (and more shielding).', [
          { value: 'They move slower than low-n electrons, so they can be pulled away more easily.', error: 'speed', why: 'speed is not what sets binding energy; distance and attraction are' },
          { value: 'They always have unpaired spins, which makes them more reactive.', error: 'spin', why: 'spin pairing has nothing to do with n' },
          { value: 'They have more allowed subshells, so they avoid the nucleus entirely.', error: 'subshells', why: 'the number of subshells does not remove the attraction' },
        ]),
        explanation: `Higher n means a larger average distance from the nucleus and more inner electrons shielding it, so the attraction is weaker and less energy is needed to remove it.`,
      };
    }
    const g = h.pick([1, 2, 16, 17]);
    const col = ELEMENTS.filter((e) => e.group === g).sort((a, b) => a.period - b.period);
    const right = col[col.length - 1];
    return {
      stem: `Which of these loses its outermost electron most easily (lowest first ionization energy): ${h.pick([col, [...col].reverse()]).map((e) => e.s).join(', ')}?`,
      ...h.choices(right.s, col.slice(0, -1).map((e) => ({ value: e.s, error: e === col[0] ? 'ie-reversed' : 'ie-partial', why: `${e.s} is higher in the group, so its outer electron is closer and harder to remove` }))),
      explanation: `Down a group the outer electron sits in a higher n shell, farther out and better shielded, so ionization energy drops. ${right.s} is lowest in the group.`,
    };
  },
});
