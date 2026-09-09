// Exam 1 review — Atomic Structure half. Same source as rev1-ch00-toolbox.js: the instructor's
// own "Ch 1-2 Review" handout (IMG_0008.jpg / IMG_0009.jpg in SupplementalCourseDocs/).
//
//   Q18 33.32 g XY holds 10.25 g X; Y in 20.00 g?   -> definite-proportions
//   Q19 electrons/protons/neutrons in ²¹F⁻           -> ion-particle-triple
//   Q20 % of ¹²X from an average mass of 11.3 u      -> isotope-percent-from-average
//   Q23 2 X : 3 O by atoms, 1.336 g X per 1.000 g O  -> mass-ratio-to-atomic-mass
//   Q26 N₂S₃, I₂O₄, I₄O₉, CsBr₄ molecular or ionic?  -> ionic-vs-molecular
//
// Q18 and Q23 are both the law of definite proportions, which had no concept and no template
// anywhere in the bank — a whole idea from chapter 2 that nothing tested. Q20 existed only at
// ACS band 4 (acs-ch01's weighted-average-backward); the instructor asks it at course level,
// with the isotope masses handed to you, so it gets a band-3 version here rather than leaving
// the course track unable to draw it.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-01-atomic-structure';

const sig = (n, d) => Number(n).toPrecision(d);
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((d) => SUP[d]).join('');

/**
 * First value in `values` for which the whole slate is distinct. Local copy of AFOQT's sweep()
 * — see the note in rev1-ch00-toolbox.js, including the caveat that it cannot rescue a
 * collision that does not depend on the swept value.
 */
function sweep(values, slate) {
  for (const v of values) {
    const s = slate(v).map(String);
    if (new Set(s).size === s.length) return v;
  }
  return values[0];
}

// ---------------------------------------------------------------------------
// Q18. The law of definite proportions, stated as a scaling problem: a compound's composition
// by mass is FIXED, so the fraction found in one sample is the fraction in every sample.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-01-definite-proportions',
  chapterId: CH,
  section: '2-2',
  band: 3,
  name: 'Law of definite proportions: scaling a fixed composition',
  concepts: ['law-of-definite-proportions', 'atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    const total1 = +(h.int(2200, 4800) / 100).toFixed(2);
    const massX1 = +(total1 * (0.25 + rng() * 0.45)).toFixed(2);
    const massY1 = +(total1 - massX1).toFixed(2);
    const fracY = massY1 / total1;
    const f = (n) => sig(n, 4);

    // The "subtracted the same absolute mass" distractor can land on the answer for particular
    // second-sample sizes; sweep the sample size until the whole slate separates.
    const total2 = sweep(
      [20.00, 25.00, 15.00, 30.00, 12.50, 40.00, 18.00, 35.00].map((x) => +x.toFixed(2)),
      (t2) => [f(t2 * fracY), f(t2 - massX1), f(t2 * (massX1 / total1)), f(massY1), f(t2 * (total1 / massY1))],
    );

    return {
      stem: `${total1.toFixed(2)} g of the compound XY contains ${massX1.toFixed(2)} g of X. Its other component is Y. How many grams of Y are in a second ${total2.toFixed(2)} g sample of XY?`,
      ...h.choices(
        { value: `${f(total2 * fracY)} g` },
        [
          { value: `${f(total2 - massX1)} g`, error: 'subtracted-absolute-mass', why: 'subtracted the FIRST sample’s mass of X from the second sample — what stays constant between samples is the RATIO, never the absolute masses' },
          { value: `${f(total2 * (massX1 / total1))} g`, error: 'scaled-the-wrong-component', why: 'scaled X’s fraction instead of Y’s' },
          { value: `${f(massY1)} g`, error: 'reused-first-sample', why: 'reported the first sample’s mass of Y unchanged' },
          { value: `${f(total2 * (total1 / massY1))} g`, error: 'inverted-fraction', why: 'used the fraction upside down' },
        ],
      ),
      explanation: `Law of definite proportions: a given compound always contains the same elements in the same proportion BY MASS. In the first sample, Y is ${total1.toFixed(2)} − ${massX1.toFixed(2)} = ${massY1.toFixed(2)} g, a mass fraction of ${massY1.toFixed(2)} / ${total1.toFixed(2)} = ${f(fracY)}. That same fraction holds in any sample, so ${total2.toFixed(2)} g × ${f(fracY)} = ${f(total2 * fracY)} g of Y. Note what does NOT carry over: the ${massX1.toFixed(2)} g itself. Fractions scale, masses do not.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q23. The hardest item on the sheet: an atom ratio plus a mass ratio gives you the unknown
// element's atomic mass, and the mass then names it. It is definite proportions run backwards
// into the periodic table.
// ---------------------------------------------------------------------------
const ELEMENTS_BY_MASS = [
  { sym: 'Li', name: 'lithium', m: 6.94 }, { sym: 'Be', name: 'beryllium', m: 9.01 },
  { sym: 'B', name: 'boron', m: 10.81 }, { sym: 'C', name: 'carbon', m: 12.01 },
  { sym: 'N', name: 'nitrogen', m: 14.01 }, { sym: 'O', name: 'oxygen', m: 16.00 },
  { sym: 'F', name: 'fluorine', m: 19.00 }, { sym: 'Na', name: 'sodium', m: 22.99 },
  { sym: 'Mg', name: 'magnesium', m: 24.31 }, { sym: 'Al', name: 'aluminium', m: 26.98 },
  { sym: 'Si', name: 'silicon', m: 28.09 }, { sym: 'P', name: 'phosphorus', m: 30.97 },
  { sym: 'S', name: 'sulfur', m: 32.06 }, { sym: 'Cl', name: 'chlorine', m: 35.45 },
  { sym: 'K', name: 'potassium', m: 39.10 }, { sym: 'Ca', name: 'calcium', m: 40.08 },
  { sym: 'Ti', name: 'titanium', m: 47.87 }, { sym: 'Cr', name: 'chromium', m: 52.00 },
  { sym: 'Mn', name: 'manganese', m: 54.94 }, { sym: 'Fe', name: 'iron', m: 55.85 },
  { sym: 'Ni', name: 'nickel', m: 58.69 }, { sym: 'Cu', name: 'copper', m: 63.55 },
  { sym: 'Zn', name: 'zinc', m: 65.38 }, { sym: 'As', name: 'arsenic', m: 74.92 },
  { sym: 'Se', name: 'selenium', m: 78.97 }, { sym: 'Br', name: 'bromine', m: 79.90 },
  { sym: 'Sr', name: 'strontium', m: 87.62 }, { sym: 'Mo', name: 'molybdenum', m: 95.95 },
  { sym: 'Ag', name: 'silver', m: 107.87 }, { sym: 'Sn', name: 'tin', m: 118.71 },
];

const nearestElement = (mass) =>
  ELEMENTS_BY_MASS.reduce((best, e) => (Math.abs(e.m - mass) < Math.abs(best.m - mass) ? e : best));

registerChemTemplate({
  id: 'chem1-rev1-01-mass-ratio-to-atomic-mass',
  chapterId: CH,
  section: '2-2',
  band: 3,
  name: 'Atomic mass of an unknown element from a compound’s mass ratio',
  concepts: ['law-of-definite-proportions', 'atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    const O = 16.00;
    // Skip oxygen itself, and anything so light that the whole-number atom ratios below produce
    // an unbelievable formula.
    const target = h.pick(ELEMENTS_BY_MASS.filter((e) => e.sym !== 'O' && e.m > 10));
    const RATIOS = [[1, 1], [1, 2], [2, 3], [2, 1], [1, 3], [3, 4], [2, 5]];
    const [p, q] = h.pick(RATIOS);

    // r is what the STEM shows, so the key has to be recomputed from the rounded r rather than
    // from the exact value — otherwise the printed numbers and the printed answer disagree in
    // the last digit (Phase 8 rule 4).
    const r = +(((target.m * p) / (q * O))).toPrecision(4);
    const amCorrect = (r * q * O) / p;
    const amInverted = (r * p * O) / q;
    const amNoRatio = r * O;
    const amDiatomic = (r * q * 32.0) / p;

    const label = (mass) => {
      const e = nearestElement(mass);
      return `${sig(mass, 4)} u — ${e.name} (${e.sym})`;
    };

    return {
      stem: `A certain element X forms a compound with oxygen in which there are ${p} atom${p > 1 ? 's' : ''} of X for every ${q} atom${q > 1 ? 's' : ''} of O. In this compound, ${r} g of X are combined with 1.000 g of oxygen. Use the average atomic mass of oxygen (16.00 u) to calculate the average atomic mass of X, then use that mass to identify element X.`,
      ...h.choices(
        { value: label(amCorrect) },
        [
          { value: label(amInverted), error: 'ratio-inverted', why: 'used the atom ratio upside down — you need moles of X per mole of O, which is X’s coefficient over oxygen’s' },
          { value: label(amNoRatio), error: 'ratio-ignored', why: 'compared the masses directly and never used the atom ratio at all' },
          { value: label(amDiatomic), error: 'used-o2-mass', why: 'used 32.00 u for oxygen — the question gives you the mass of an oxygen ATOM, not of O₂' },
          { value: label(amCorrect / 2), error: 'halved-the-result', why: 'divided the result by two somewhere in the setup' },
        ],
      ),
      explanation: `Turn the 1.000 g of oxygen into atoms: 1.000 g ÷ 16.00 g/mol = ${sig(1 / O, 4)} mol of O. The formula says ${p} X per ${q} O, so there are ${sig(1 / O, 4)} × ${p}/${q} = ${sig(p / (q * O), 4)} mol of X, and that is what the ${r} g weighs. Atomic mass of X = ${r} g ÷ ${sig(p / (q * O), 4)} mol = ${sig(amCorrect, 4)} u, which is ${nearestElement(amCorrect).name} (${nearestElement(amCorrect).sym}). The atom ratio is the whole question — without it the mass ratio alone tells you nothing.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q19. Three counts at once for a charged isotope. The bank could do each count separately and
// never asked for all three together, which is how the ion trips people: the charge changes the
// electrons and NOTHING else.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-01-ion-particle-triple',
  chapterId: CH,
  section: '2-3',
  band: 2,
  mental: true,
  name: 'Protons, neutrons and electrons in a charged isotope',
  concepts: ['ion-charge-electrons-protons', 'atomic-number-vs-mass-number'],
  generate: (rng, h) => {
    // Mass numbers are REAL isotopes and the charge is the one that element actually forms.
    // Deriving both from ranges instead gave ⁶⁹Br³⁺ — a bromine isotope that does not exist,
    // carrying a charge bromine never takes. The arithmetic was right and the chemistry was
    // fiction, which is the failure mode theknowledgebase/CLAUDE.md calls out for word problems:
    // draw the number from the noun. The instructor's own item is ²¹F⁻, a real (short-lived)
    // fluorine isotope, so a few radioisotopes are in scope; invented ones are not.
    const ELS = [
      { sym: 'F', z: 9, iso: [18, 19, 20, 21], charge: -1 },
      { sym: 'O', z: 8, iso: [16, 17, 18], charge: -2 },
      { sym: 'N', z: 7, iso: [13, 14, 15], charge: -3 },
      { sym: 'S', z: 16, iso: [32, 33, 34, 35, 36], charge: -2 },
      { sym: 'Cl', z: 17, iso: [35, 36, 37], charge: -1 },
      { sym: 'Br', z: 35, iso: [79, 80, 81], charge: -1 },
      { sym: 'Li', z: 3, iso: [6, 7], charge: 1 },
      { sym: 'Na', z: 11, iso: [22, 23, 24], charge: 1 },
      { sym: 'K', z: 19, iso: [39, 40, 41], charge: 1 },
      { sym: 'Mg', z: 12, iso: [24, 25, 26], charge: 2 },
      { sym: 'Ca', z: 20, iso: [40, 42, 43, 44], charge: 2 },
      { sym: 'Al', z: 13, iso: [26, 27], charge: 3 },
    ];
    const e = h.pick(ELS);
    const A = h.pick(e.iso);
    const neutrons = A - e.z;
    // Never zero: a neutral atom would make the "ignored the charge" distractor the answer.
    const charge = e.charge;
    const electrons = e.z - charge;
    const chargeStr = `${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge < 0 ? '−' : '+'}`;
    const fmt = (p, n, el) => `${p} protons, ${n} neutrons, ${el} electrons`;

    return {
      stem: `How many protons, neutrons and electrons are in ${sup(A)}${e.sym}${sup(Math.abs(charge) === 1 ? '' : Math.abs(charge))}${charge < 0 ? '⁻' : '⁺'}?`,
      ...h.choices(
        fmt(e.z, neutrons, electrons),
        [
          { value: fmt(e.z, neutrons, e.z), error: 'charge-ignored', why: 'gave the neutral atom’s electron count — the superscript charge is there precisely because it is not neutral' },
          { value: fmt(e.z, neutrons, e.z + charge), error: 'charge-sign-flipped', why: `added where you should subtract: a ${charge < 0 ? 'negative' : 'positive'} charge means the atom has ${charge < 0 ? 'GAINED' : 'LOST'} electrons` },
          { value: fmt(e.z, A, electrons), error: 'mass-number-as-neutrons', why: 'used the mass number as the neutron count — the mass number counts protons AND neutrons' },
          { value: fmt(neutrons, e.z, electrons), error: 'protons-neutrons-swapped', why: 'swapped the proton and neutron counts' },
        ],
      ),
      explanation: `The element symbol fixes the protons: ${e.sym} is always ${e.z}. Neutrons are the mass number minus the protons: ${A} − ${e.z} = ${neutrons}. The charge only ever touches the electrons: ${chargeStr} means ${charge < 0 ? `${Math.abs(charge)} MORE` : `${charge} FEWER`} electron${Math.abs(charge) === 1 ? '' : 's'} than protons, so ${e.z} − (${charge}) = ${electrons}. Changing the protons would make it a different element; changing the neutrons would make it a different isotope.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q20. Backward abundance at COURSE level — both isotope masses handed to you, one unknown
// percentage. The ACS-band version (acs-ch01) makes you supply the masses yourself.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-01-isotope-percent-from-average',
  chapterId: CH,
  section: '2-3',
  band: 3,
  name: 'Isotope percentage from an average atomic mass',
  concepts: ['relative-abundance-weighted-average'],
  generate: (rng, h) => {
    const m1 = h.int(6, 40);
    const m2 = m1 + h.int(2, 6);
    // 50 is excluded by construction: at a 50/50 split the "solved for the other isotope"
    // distractor (100 − f) IS the answer, and no sweep can separate them.
    const PCTS = [10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 82.5, 85, 90];
    const pct = h.pick(PCTS);
    const f2 = pct / 100;
    const avg = +(m1 * (1 - f2) + m2 * f2).toFixed(2);
    const heavier = `${sup(m2)}X`;
    const lighter = `${sup(m1)}X`;
    const p = (x) => `${Number(x.toFixed(1))}%`;

    return {
      stem: `An element X has a naturally occurring average atomic mass of ${avg} u, and it has two isotopes, ${lighter} and ${heavier}. What percentage of the isotopes are ${heavier}? (Use ${m1}.00 u and ${m2}.0 u as the masses of ${lighter} and ${heavier}.)`,
      ...h.choices(
        { value: p(pct) },
        [
          { value: p(100 - pct), error: 'solved-for-other-isotope', why: `solved for ${lighter} instead — check which isotope the question actually asked about` },
          { value: p((avg / m2) * 100), error: 'divided-by-heavier-mass', why: 'divided the average by the heavier isotope’s mass instead of setting up the weighted average' },
          { value: p(((avg - m1) / m2) * 100), error: 'wrong-denominator', why: 'divided by the heavier mass rather than by the GAP between the two masses' },
          { value: p(pct / 2), error: 'halved-the-result', why: 'halved the fraction along the way' },
        ],
      ),
      explanation: `Let f be the fraction of ${heavier}. Then ${m1}.00(1 − f) + ${m2}.0(f) = ${avg}, which rearranges to f = (average − lighter) ÷ (heavier − lighter) = (${avg} − ${m1}.00) ÷ (${m2}.0 − ${m1}.00) = ${Number((f2).toFixed(4))}, i.e. ${p(pct)}. Sanity check without doing any algebra: ${avg} sits ${avg - m1 > (m2 - m1) / 2 ? 'closer to the HEAVIER' : 'closer to the LIGHTER'} isotope, so the answer must be ${pct > 50 ? 'above' : 'below'} 50%.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q26. Molecular vs ionic from the formula alone. The rule is one question — is there a metal? —
// and the professor's own list (N₂S₃, I₂O₄, I₄O₉, CsBr₄) is three nonmetal pairs and one
// caesium compound, so it tests exactly that and nothing else.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-01-ionic-vs-molecular',
  chapterId: CH,
  section: '2-6',
  band: 2,
  mental: true,
  name: 'Telling an ionic compound from a molecular one',
  concepts: ['ionic-vs-molecular-classification'],
  generate: (rng, h) => {
    // Declared real compounds rather than a symbol plus a random subscript. Generating them
    // produced Al₂N₃ and Al₃N₃ side by side — neither is a real formula, and two options
    // differing only in one subscript read as a typo rather than as two different compounds.
    // The instructor's own item (N₂S₃, I₂O₄, I₄O₉, CsBr₄) is four written-out formulas, so the
    // skill is unchanged; only the chemistry gets better. CsBr₄ itself is corrected to CsBr —
    // caesium is +1 — because his point there was purely "Cs is a metal".
    const IONIC = [
      { f: 'CsBr', metal: 'Cs' }, { f: 'KI', metal: 'K' }, { f: 'CaCl₂', metal: 'Ca' },
      { f: 'MgO', metal: 'Mg' }, { f: 'Al₂O₃', metal: 'Al' }, { f: 'Na₂S', metal: 'Na' },
      { f: 'BaBr₂', metal: 'Ba' }, { f: 'Li₃N', metal: 'Li' }, { f: 'SrCl₂', metal: 'Sr' },
      { f: 'K₂O', metal: 'K' }, { f: 'CaS', metal: 'Ca' }, { f: 'AlF₃', metal: 'Al' },
      { f: 'MgBr₂', metal: 'Mg' }, { f: 'Rb₂S', metal: 'Rb' }, { f: 'Ca₃N₂', metal: 'Ca' },
      { f: 'FeCl₃', metal: 'Fe' }, { f: 'CuO', metal: 'Cu' }, { f: 'ZnS', metal: 'Zn' },
    ];
    const MOLECULAR = [
      { f: 'N₂S₃' }, { f: 'I₂O₄' }, { f: 'I₄O₉' }, { f: 'CO₂' }, { f: 'SF₆' }, { f: 'PCl₅' },
      { f: 'N₂O₄' }, { f: 'SO₃' }, { f: 'CCl₄' }, { f: 'P₄O₁₀' }, { f: 'ClF₃' }, { f: 'BrF₅' },
      { f: 'SiO₂' }, { f: 'NO₂' }, { f: 'S₂Cl₂' }, { f: 'PBr₃' }, { f: 'SeO₂' }, { f: 'N₂O₅' },
    ];

    const askIonic = rng() < 0.5;
    const drawn = new Set();
    const make = (isIonic) => {
      const pool = (isIonic ? IONIC : MOLECULAR).filter((x) => !drawn.has(x.f));
      if (pool.length === 0) return null;
      const picked = h.pick(pool);
      drawn.add(picked.f);
      return { f: picked.f, isIonic, metal: picked.metal ?? null };
    };

    const items = [make(askIonic), make(!askIonic), make(!askIonic), make(!askIonic)];
    if (items.some((x) => x === null)) return null;
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const answer = items.find((x) => x.isIonic === askIonic);

    return {
      stem: `Identify each of the following as molecular or ionic. Which one is ${askIonic ? 'IONIC' : 'MOLECULAR'}?\n\n${items.map((x) => x.f).join(',  ')}`,
      ...h.choices(
        answer.f,
        items
          .filter((x) => x.f !== answer.f)
          .map((x) => ({
            value: x.f,
            error: askIonic ? 'missed-the-metal' : 'called-a-nonmetal-pair-ionic',
            why: x.isIonic
              ? `${x.f} is ionic — ${x.metal} is a metal`
              : `${x.f} is molecular — both elements in it are nonmetals`,
          })),
      ),
      explanation: `${answer.f}. The test is one question: does the formula contain a METAL? Metal + nonmetal means electrons are transferred, giving ions and an IONIC compound (named with -ide or a polyatomic name, and a Roman numeral if the metal needs one). Nonmetal + nonmetal means electrons are shared, giving a MOLECULAR compound (named with Greek prefixes — di-, tri-, tetra-). Big subscripts are not evidence either way: ${items.filter((x) => !x.isIonic)[0].f} is molecular no matter how large its numbers get.`,
    };
  },
});
