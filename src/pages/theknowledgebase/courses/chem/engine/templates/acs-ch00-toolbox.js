// Toolbox: Foundational Concepts — ACS ceiling (bands 4-5).
//
// The band 1-3 templates for this chapter live in toolbox.js. These are the harder tier: the
// same chemistry, but at the difficulty the standardized ACS exam asks it at. Trey studies both
// at once ("chem in college is basically like studying for 2 courses"), so an item here must be
// harder in a way he can actually learn from — more steps or a real trap, never uglier numbers.
//
// Band 4 = two steps, or one step wrapped around a trap (a buried conversion, a value handed to
// you in the wrong unit). Band 5 = three-plus chained steps, or two ideas at once.
//
// `section: null` on every template: the course-section coordinate is assigned by
// scripts/chemTagSections.mjs from the concepts, not written by hand.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-00-toolbox';

/**
 * Three significant figures, always in plain decimal notation.
 *
 * Every option in a unit-conversion item has to be formatted identically, because an option that
 * looks different from the others can be eliminated without doing any chemistry. Rounding to 3 sf
 * FIRST and only then choosing decimal places is what keeps that true across four orders of
 * magnitude: 1851.85 has to print as "1850", not as toFixed(0)'s "1852" (4 sf) or as
 * toPrecision(3)'s "1.85e+3" (a different notation from its siblings).
 */
/** Decimal places in a number written as a string. */
const dp = (s) => (String(s).split('.')[1] ?? '').length;

function sig3(x) {
  if (x === 0) return '0.00';
  const k = Math.floor(Math.log10(Math.abs(x)));
  const f = Math.pow(10, 2 - k);
  const rounded = Math.round(x * f) / f;
  return rounded.toFixed(Math.max(0, 2 - k));
}

// Densities in g/cm³. Water is deliberately absent: at 1.00 the "multiplied instead of divided"
// distractor lands exactly on the correct answer, and no choice of the other variable rescues it.
//
// `display` is a STRING and is what the stem prints. A JS number drops a trailing zero (2.70
// interpolates as "2.7"), which would quietly show the reader a 2-significant-figure density in a
// chapter whose whole point is significant figures. toolbox.js hit this same trap already.
const DENSITIES = [
  { name: 'aluminum', d: 2.70, display: '2.70' },
  { name: 'iron', d: 7.87, display: '7.87' },
  { name: 'copper', d: 8.96, display: '8.96' },
  { name: 'lead', d: 11.3, display: '11.3' },
  { name: 'mercury', d: 13.6, display: '13.6' },
  { name: 'gold', d: 19.3, display: '19.3' },
  { name: 'ethanol', d: 0.789, display: '0.789' },
  { name: 'glycerol', d: 1.26, display: '1.26' },
];

registerChemTemplate({
  id: 'chem1-acs-00-density-unit-chain',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Density converted between g/cm³ and kg/m³',
  concepts: ['density', 'unit-conversions'],
  generate: (rng, h) => {
    const s = h.pick(DENSITIES);
    const answer = s.d * 1000;
    return {
      stem: `The density of ${s.name} is ${s.display} g/cm³. Expressed in kg/m³, this is:`,
      ...h.choices(
        { value: `${sig3(answer)} kg/m³` },
        [
          { value: `${sig3(s.d * 1e6)} kg/m³`, error: 'volume-only', why: 'converted cm³ to m³ but left the mass in grams' },
          { value: `${sig3(s.d * 1e-3)} kg/m³`, error: 'mass-only', why: 'converted grams to kilograms but left the volume in cm³' },
          { value: `${sig3(s.d * 0.1)} kg/m³`, error: 'squared-not-cubed', why: 'used 10² cm²/m² instead of 10⁶ cm³/m³' },
        ],
      ),
      explanation: `1 kg = 10³ g and 1 m³ = 10⁶ cm³, so 1 g/cm³ = 10⁶ ÷ 10³ = 10³ kg/m³. `
        + `Therefore ${s.display} g/cm³ × 10³ = ${sig3(answer)} kg/m³. Both units change, and they change by different powers of ten — `
        + `converting only one of them is the usual slip.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-acs-00-volume-from-density',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Volume of a given mass, across three unit changes',
  concepts: ['density', 'unit-conversions'],
  generate: (rng, h) => {
    const s = h.pick(DENSITIES);
    const massKg = h.int(2, 9);
    // Litres = (massKg × 1000 g/kg) ÷ (d g/cm³) ÷ (1000 cm³/L), which reduces to massKg ÷ d.
    // The two factors of 1000 cancel, so the correct answer is exact and no explanation step
    // ever has to quote a rounded intermediate.
    const answer = massKg / s.d;
    return {
      stem: `${massKg}.00 kg of ${s.name} (density ${s.display} g/cm³) occupies what volume, in liters?`,
      ...h.choices(
        { value: `${sig3(answer)} L` },
        [
          { value: `${sig3(massKg / (1000 * s.d))} L`, error: 'no-mass-conversion', why: 'divided kilograms by a density in g/cm³ without converting the mass to grams' },
          { value: `${sig3(massKg * s.d)} L`, error: 'multiplied-by-density', why: 'multiplied by the density instead of dividing by it' },
          { value: `${sig3((massKg * 1000) / s.d)} L`, error: 'no-volume-conversion', why: 'stopped at cm³ and labelled the result liters' },
        ],
      ),
      explanation: `Three conversions in a row: ${massKg}.00 kg × 1000 g/kg = ${massKg * 1000} g; `
        + `${massKg * 1000} g ÷ ${s.display} g/cm³ = ${sig3((massKg * 1000) / s.d)} cm³; `
        + `${sig3((massKg * 1000) / s.d)} cm³ ÷ 1000 cm³/L = ${sig3(answer)} L. `
        + `The two factors of 1000 cancel, so the whole chain is just ${massKg} ÷ ${s.display} — but only if you notice they cancel.`,
    };
  },
});

// Flow-rate rows. Every value terminates exactly, so no explanation step quotes a rounded number
// back into a later step. `display` for the same trailing-zero reason as DENSITIES: 4.0 prints as
// "4" without it, turning a 2-significant-figure rate into a 1-significant-figure one.
const FLOWS = [
  { rate: 2.5, display: '2.5', hours: 8 },
  { rate: 4.0, display: '4.0', hours: 6 },
  { rate: 1.5, display: '1.5', hours: 4 },
  { rate: 7.5, display: '7.5', hours: 2 },
  { rate: 3.0, display: '3.0', hours: 5 },
  { rate: 5.0, display: '5.0', hours: 3 },
];

registerChemTemplate({
  id: 'chem1-acs-00-flow-rate-chain',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Dimensional analysis across time and volume units',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const f = h.pick(FLOWS);
    const answer = (f.rate * 60 * f.hours) / 1000;
    return {
      stem: `A pump delivers a reagent at ${f.display} mL/min. How many liters does it deliver in ${f.hours}.0 hours?`,
      ...h.choices(
        { value: `${sig3(answer)} L` },
        [
          { value: `${sig3(f.rate * 60 * f.hours)} L`, error: 'no-litre-conversion', why: 'never converted milliliters to liters' },
          { value: `${sig3((f.rate * f.hours) / 1000)} L`, error: 'no-hour-conversion', why: 'treated the rate as mL per hour, skipping the 60 min/h step' },
          { value: `${sig3((f.rate * f.hours) / 60 / 1000)} L`, error: 'divided-by-sixty', why: 'divided by 60 min/h instead of multiplying' },
        ],
      ),
      explanation: `Chain the units so each one cancels: ${f.display} mL/min × 60 min/h × ${f.hours}.0 h = ${f.rate * 60 * f.hours} mL, `
        + `then ${f.rate * 60 * f.hours} mL ÷ 1000 mL/L = ${sig3(answer)} L. `
        + `Write the units on every factor. Two of the wrong answers here come from dropping one of the two conversions entirely, `
        + `and both are off by a clean power of ten — which is what a missing conversion always looks like.`,
    };
  },
});

// Lab rows for the density-by-difference item. Each is authored, not generated: the point of the
// question is which digits survive TWO subtractions, and that has to be exactly right.
// `overPrecise` is the raw quotient — the "kept every digit the calculator showed" mistake.
const LAB_ROWS = [
  { empty: '24.36', filled: '51.09', mass: '26.73', vi: '15.0', vf: '25.1', vol: '10.1', answer: '2.65', totalMass: '5.06', finalVol: '1.06', overPrecise: '2.6465' },
  { empty: '18.42', filled: '40.15', mass: '21.73', vi: '12.0', vf: '21.3', vol: '9.3', answer: '2.3', totalMass: '4.3', finalVol: '1.0', overPrecise: '2.3366' },
  { empty: '31.07', filled: '62.55', mass: '31.48', vi: '20.0', vf: '34.2', vol: '14.2', answer: '2.22', totalMass: '4.40', finalVol: '0.920', overPrecise: '2.2169' },
];

registerChemTemplate({
  id: 'chem1-acs-00-lab-density-sigfigs',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Density from lab data, reported to the right precision',
  concepts: ['density', 'significant-figures'],
  generate: (rng, h) => {
    const r = h.pick(LAB_ROWS);
    return {
      stem: `A student masses an empty flask at ${r.empty} g and the flask plus liquid at ${r.filled} g. `
        + `The liquid raises the level in a graduated cylinder from ${r.vi} mL to ${r.vf} mL. `
        + `What is the density of the liquid, reported to the correct number of significant figures?`,
      ...h.choices(
        { value: `${r.answer} g/mL` },
        [
          // Deliberately the only over-precise option. Normally that is a formatting tell, but here
          // precision IS the question, so the giveaway runs the right way: a student who has not
          // learned the rule is drawn to it.
          { value: `${r.overPrecise} g/mL`, error: 'kept-all-digits', why: 'reported every digit the calculator showed, ignoring the precision of the measurements' },
          { value: `${r.totalMass} g/mL`, error: 'used-total-mass', why: 'used the mass of flask plus liquid instead of subtracting the empty flask' },
          { value: `${r.finalVol} g/mL`, error: 'used-final-volume', why: 'used the final cylinder reading instead of the volume displaced' },
        ],
      ),
      explanation: `Two subtractions before any division. Mass of liquid = ${r.filled} − ${r.empty} = ${r.mass} g. `
        + `Volume = ${r.vf} − ${r.vi} = ${r.vol} mL. Density = ${r.mass} ÷ ${r.vol} = ${r.overPrecise} g/mL, `
        + `which must then be cut to the ${r.vol.replace('.', '').replace(/^0+/, '').length} significant figures of ${r.vol} mL — the less precise of the two measured quantities — giving ${r.answer} g/mL.`,
    };
  },
});

// Addition/subtraction rows. Every row is chosen so the DECIMAL-PLACES rule and the
// SIGNIFICANT-FIGURES rule give different answers — otherwise the commonest mistake in the
// chapter is invisible and the distractor collides with the correct answer.
// Two independent constraints on every row, and both are easy to violate by accident:
//   - the DECIMAL-PLACES answer and the SIGNIFICANT-FIGURES answer must DIFFER, or the commonest
//     mistake in the chapter is invisible and its distractor lands on the correct answer;
//   - the raw sum must not sit exactly half way at the rounding digit, because half-up and
//     half-to-even are both taught and a half-way case makes two options defensible.
const ADD_ROWS = [
  { a: '128.4', b: '6.78', op: '+', raw: '135.18', answer: '135.2', sfRule: '135', truncated: '135.1' },
  { a: '9.86', b: '0.4', op: '+', raw: '10.26', answer: '10.3', sfRule: '10', truncated: '10.2' },
  { a: '99.1', b: '0.57', op: '+', raw: '99.67', answer: '99.7', sfRule: '100', truncated: '99.6' },
  { a: '0.9', b: '0.256', op: '+', raw: '1.156', answer: '1.2', sfRule: '1', truncated: '1.1' },
];

registerChemTemplate({
  id: 'chem1-acs-00-sigfig-addition-rule',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Addition uses decimal places, not significant figures',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const r = h.pick(ADD_ROWS);
    return {
      stem: `Evaluate ${r.a} ${r.op} ${r.b} and report the result to the correct precision.`,
      ...h.choices(
        { value: r.answer },
        [
          { value: r.sfRule, error: 'used-sigfig-rule', why: 'applied the multiplication rule (fewest significant figures) to an addition' },
          { value: r.raw, error: 'no-rounding', why: 'reported the raw sum without applying any precision rule' },
          { value: r.truncated, error: 'truncated-not-rounded', why: 'cut the extra digits off instead of rounding them' },
        ],
      ),
      explanation: `Addition and subtraction are governed by DECIMAL PLACES, not significant figures. `
        + `${r.a} is known to ${dp(r.a)} decimal ${dp(r.a) === 1 ? 'place' : 'places'} and ${r.b} to ${dp(r.b)}, `
        + `so the sum ${r.raw} is cut to the smaller of the two: ${r.answer}. `
        + `Applying the significant-figure rule here would give ${r.sfRule}, which is the standard mistake.`,
    };
  },
});

// Mixed-operation rows: the addition rule sets the precision of the intermediate, and the
// significant-figure count of THAT intermediate then governs the multiplication.
// Asks for the COUNT rather than the value, deliberately.
//
// Asking for the rounded number here forces a choice between round-half-up and round-half-to-even
// on some rows, and — worse — the "skipped the addition rule" distractor silently lands on the
// correct answer whenever the multiplier already carries fewer significant figures than the
// unrounded sum. The count has neither problem, tests exactly the same two rules, and matches how
// the ACS exam asks it.
//
// `sum` is the raw sum, `rounded` is it after the decimal-place rule, `answer` is the final count.
const MIXED_ROWS = [
  {
    a: '12.11', b: '0.3', c: '2.4567', sum: '12.41', rounded: '12.4', sumSf: 3, cSf: 5, answer: '3',
    skipped: '4', skippedWhy: 'kept 12.41 and counted its 4 significant figures, never applying the addition rule',
    sfOnAdd: '1', sfOnAddWhy: 'applied the significant-figure rule to the addition, taking 1 from 0.3',
    mostPrecise: '5', mostPreciseWhy: 'took the count from the most precise value in the problem',
  },
  {
    a: '128.4', b: '6.78', c: '0.50', sum: '135.18', rounded: '135.2', sumSf: 4, cSf: 2, answer: '2',
    skipped: '5', skippedWhy: 'kept 135.18 and counted its 5 significant figures, never applying the addition rule',
    sfOnAdd: '3', sfOnAddWhy: 'counted the leading zero in 0.50 as significant, making it 3',
    mostPrecise: '4', mostPreciseWhy: 'reported the sum’s count and ignored the multiplier entirely',
  },
  {
    a: '0.9', b: '0.256', c: '3.14', sum: '1.156', rounded: '1.2', sumSf: 2, cSf: 3, answer: '2',
    skipped: '4', skippedWhy: 'kept 1.156 and counted its 4 significant figures, never applying the addition rule',
    sfOnAdd: '1', sfOnAddWhy: 'applied the significant-figure rule to the addition, taking 1 from 0.9',
    mostPrecise: '3', mostPreciseWhy: 'took the count from the multiplier and ignored the sum',
  },
  {
    a: '47.20', b: '3.6', c: '12.055', sum: '50.80', rounded: '50.8', sumSf: 3, cSf: 5, answer: '3',
    skipped: '4', skippedWhy: 'kept 50.80 and counted its 4 significant figures, never applying the addition rule',
    sfOnAdd: '2', sfOnAddWhy: 'applied the significant-figure rule to the addition, taking 2 from 3.6',
    mostPrecise: '5', mostPreciseWhy: 'took the count from the most precise value in the problem',
  },
];

registerChemTemplate({
  id: 'chem1-acs-00-sigfig-mixed-operations',
  chapterId: CH,
  section: null,
  band: 5,
  name: 'Two precision rules in one calculation',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const r = h.pick(MIXED_ROWS);
    return {
      stem: `The result of (${r.a} + ${r.b}) × ${r.c} is to be reported correctly. `
        + `To how many significant figures should it be given?`,
      ...h.choices(
        { value: r.answer },
        [
          { value: r.skipped, error: 'skipped-addition-rule', why: r.skippedWhy },
          { value: r.sfOnAdd, error: 'sigfig-rule-on-addition', why: r.sfOnAddWhy },
          { value: r.mostPrecise, error: 'wrong-source-count', why: r.mostPreciseWhy },
        ],
      ),
      explanation: `Each step is governed by its own rule, and the addition happens first. `
        + `${r.a} + ${r.b} = ${r.sum}, which the DECIMAL-PLACE rule cuts to ${r.rounded} — carrying ${r.sumSf} significant figures. `
        + `The multiplication is then governed by the SIGNIFICANT-FIGURE rule, comparing those ${r.sumSf} against the ${r.cSf} in ${r.c}, `
        + `so the answer gets the smaller: ${r.answer}. `
        + `Carrying the unrounded sum into the multiplication instead would claim ${r.skipped}, a digit the addition never earned.`,
    };
  },
});

const SCI_ROWS = [
  { stem: '(6.0 × 10⁵) ÷ (2.4 × 10⁻²)', answer: '2.5 × 10⁷', wrongExp: '2.5 × 10³', inverted: '4.0 × 10⁻⁸', unnormalized: '25 × 10⁶',
    expWhy: 'added the exponents instead of subtracting them', invWhy: 'divided the second value by the first' },
  { stem: '(8.4 × 10⁻³) ÷ (2.0 × 10⁵)', answer: '4.2 × 10⁻⁸', wrongExp: '4.2 × 10²', inverted: '2.4 × 10⁷', unnormalized: '0.42 × 10⁻⁷',
    expWhy: 'added the exponents instead of subtracting them', invWhy: 'divided the second value by the first' },
  { stem: '(3.6 × 10⁴) × (5.0 × 10⁻⁷)', answer: '1.8 × 10⁻²', wrongExp: '1.8 × 10¹²', inverted: '7.2 × 10⁻⁴', unnormalized: '18 × 10⁻³',
    expWhy: 'subtracted the exponents instead of adding them', invWhy: 'divided the mantissas instead of multiplying them' },
];

registerChemTemplate({
  id: 'chem1-acs-00-sci-notation-arithmetic',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Scientific notation arithmetic, normalized and rounded',
  concepts: ['scientific-notation', 'significant-figures'],
  generate: (rng, h) => {
    const r = h.pick(SCI_ROWS);
    return {
      stem: `Evaluate ${r.stem}. Report the answer in correct scientific notation.`,
      ...h.choices(
        { value: r.answer },
        [
          { value: r.unnormalized, error: 'not-normalized', why: 'has the right magnitude but a mantissa outside 1 ≤ |m| < 10' },
          { value: r.wrongExp, error: 'wrong-exponent-operation', why: r.expWhy },
          { value: r.inverted, error: 'mantissa-operation', why: r.invWhy },
        ],
      ),
      explanation: `Handle the mantissas and the powers of ten separately, then normalize. `
        + `The mantissa arithmetic and the exponent arithmetic use different operations, and swapping them is the usual error. `
        + `A mantissa outside 1 ≤ |m| < 10 is not yet in scientific notation even when its magnitude is right — ${r.unnormalized} and ${r.answer} are the same number, but only one is correctly written.`,
    };
  },
});

// Name -> formula. Every row pairs a variable-charge metal or a polyatomic ion with a distractor
// set drawn from the three mistakes that actually occur: ignoring the Roman numeral, crossing the
// charges the wrong way, and reaching for the neighbouring polyatomic ion.
const NAME_TO_FORMULA = [
  { name: 'iron(III) sulfate', formula: 'Fe₂(SO₄)₃', ignoredCharge: 'FeSO₄', swapped: 'Fe₃(SO₄)₂', wrongIon: 'Fe₂(SO₃)₃', wrongIonWhy: 'used sulfite (SO₃²⁻) in place of sulfate (SO₄²⁻)' },
  { name: 'copper(II) nitrate', formula: 'Cu(NO₃)₂', ignoredCharge: 'CuNO₃', swapped: 'Cu₂NO₃', wrongIon: 'Cu(NO₂)₂', wrongIonWhy: 'used nitrite (NO₂⁻) in place of nitrate (NO₃⁻)' },
  { name: 'chromium(III) oxide', formula: 'Cr₂O₃', ignoredCharge: 'CrO', swapped: 'Cr₃O₂', wrongIon: 'CrO₃', wrongIonWhy: 'gave oxygen a charge that would make the compound CrO₃, which is chromium(VI)' },
  { name: 'ammonium phosphate', formula: '(NH₄)₃PO₄', ignoredCharge: 'NH₄PO₄', swapped: '(NH₄)₂PO₄', wrongIon: 'NH₄(PO₃)₃', wrongIonWhy: 'used phosphite in place of phosphate and left the ammonium count at one' },
  { name: 'iron(II) phosphate', formula: 'Fe₃(PO₄)₂', ignoredCharge: 'FePO₄', swapped: 'Fe₂(PO₄)₃', wrongIon: 'Fe₃(PO₃)₂', wrongIonWhy: 'used phosphite (PO₃³⁻) in place of phosphate (PO₄³⁻)' },
  { name: 'lead(IV) oxide', formula: 'PbO₂', ignoredCharge: 'PbO', swapped: 'Pb₂O₄', wrongIon: 'PbO₄', wrongIonWhy: 'gave lead four oxygens rather than balancing 4+ against two 2− ions' },
  { name: 'calcium hydrogen carbonate', formula: 'Ca(HCO₃)₂', ignoredCharge: 'CaHCO₃', swapped: 'Ca₂HCO₃', wrongIon: 'Ca(CO₃)₂', wrongIonWhy: 'dropped the hydrogen, turning hydrogen carbonate into carbonate' },
  { name: 'aluminum sulfite', formula: 'Al₂(SO₃)₃', ignoredCharge: 'AlSO₃', swapped: 'Al₃(SO₃)₂', wrongIon: 'Al₂(SO₄)₃', wrongIonWhy: 'used sulfate (SO₄²⁻) in place of sulfite (SO₃²⁻)' },
];

registerChemTemplate({
  id: 'chem1-acs-00-formula-from-name',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Formula from a name with a variable-charge metal or polyatomic ion',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const r = h.pick(NAME_TO_FORMULA);
    return {
      stem: `What is the correct formula for ${r.name}?`,
      ...h.choices(
        { value: r.formula },
        [
          { value: r.ignoredCharge, error: 'charges-not-balanced', why: 'combined the ions one-to-one without balancing their charges' },
          { value: r.swapped, error: 'subscripts-swapped', why: 'crossed the charges the wrong way, putting each subscript on the wrong ion' },
          { value: r.wrongIon, error: 'wrong-polyatomic', why: r.wrongIonWhy },
        ],
      ),
      explanation: `Write each ion with its charge, then choose the smallest whole-number counts that make the total charge zero. `
        + `${r.name} gives ${r.formula}. Parentheses go around a polyatomic ion whenever more than one of it is needed — `
        + `without them the subscript reads as belonging to the last element only.`,
    };
  },
});

const FORMULA_TO_NAME = [
  { formula: 'Fe(NO₃)₃', name: 'iron(III) nitrate', wrongCharge: 'iron(II) nitrate', wrongIon: 'iron(III) nitrite', noCharge: 'iron nitrate' },
  { formula: 'SnCl₄', name: 'tin(IV) chloride', wrongCharge: 'tin(II) chloride', wrongIon: 'tin(IV) chlorate', noCharge: 'tin tetrachloride' },
  { formula: 'Mn(OH)₂', name: 'manganese(II) hydroxide', wrongCharge: 'manganese(III) hydroxide', wrongIon: 'manganese(II) hydride', noCharge: 'manganese hydroxide' },
  { formula: 'CuS', name: 'copper(II) sulfide', wrongCharge: 'copper(I) sulfide', wrongIon: 'copper(II) sulfate', noCharge: 'copper sulfide' },
  { formula: 'Cl₂O₇', name: 'dichlorine heptoxide', wrongCharge: 'chlorine(VII) oxide', wrongIon: 'dichlorine heptachloride', noCharge: 'chlorine oxide' },
  { formula: 'Co₂O₃', name: 'cobalt(III) oxide', wrongCharge: 'cobalt(II) oxide', wrongIon: 'cobalt(III) peroxide', noCharge: 'dicobalt trioxide' },
];

registerChemTemplate({
  id: 'chem1-acs-00-name-from-formula',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Naming a formula, choosing between ionic and covalent conventions',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const r = h.pick(FORMULA_TO_NAME);
    return {
      stem: `What is the correct name for ${r.formula}?`,
      ...h.choices(
        { value: r.name },
        [
          { value: r.wrongCharge, error: 'wrong-metal-charge', why: 'read the metal’s charge off the wrong subscript' },
          { value: r.noCharge, error: 'wrong-convention', why: 'used the wrong naming system for this kind of compound' },
          { value: r.wrongIon, error: 'wrong-anion', why: 'named a different anion from the one in the formula' },
        ],
      ),
      explanation: `Decide first whether the compound is ionic or molecular, because the two use different rules. `
        + `A metal with more than one possible charge takes a Roman numeral, worked backwards from the anion’s charge; `
        + `two nonmetals take Greek prefixes and no Roman numeral. ${r.formula} is ${r.name}.`,
    };
  },
});

const CLASSES = ['element', 'compound', 'homogeneous mixture', 'heterogeneous mixture'];

const CLASSIFY_ROWS = [
  {
    scenario: 'Brass can be melted and cast. Any portion of a single bar has the same copper-to-zinc ratio, but that ratio differs from one bar to the next.',
    answer: 'homogeneous mixture',
    why: {
      compound: 'a compound has a fixed composition; a ratio that varies between batches rules it out',
      element: 'it can be separated into copper and zinc, so it is not a single element',
      'heterogeneous mixture': 'the composition is uniform throughout a given bar, so it is not heterogeneous',
    },
  },
  {
    scenario: 'A colorless gas is decomposed by an electric current into exactly two different gases, always in the same 2:1 volume ratio.',
    answer: 'compound',
    why: {
      element: 'an element cannot be decomposed into two different substances',
      'homogeneous mixture': 'a mixture would not decompose in a fixed, reproducible ratio',
      'heterogeneous mixture': 'the sample is a single uniform gas phase',
    },
  },
  {
    scenario: 'Filtering a sample leaves a solid on the paper, and the liquid that passes through boils over a range of temperatures rather than at one.',
    answer: 'heterogeneous mixture',
    why: {
      'homogeneous mixture': 'a solid that filters out means the sample was not uniform to begin with',
      compound: 'a compound is one substance and would not separate on a filter',
      element: 'an element is one substance and would not separate on a filter',
    },
  },
  {
    scenario: 'A lustrous solid melts at one sharp temperature and cannot be broken down by heating, electrolysis, or reaction with any reagent tried.',
    answer: 'element',
    why: {
      compound: 'a compound can be decomposed into simpler substances by some means',
      'homogeneous mixture': 'a mixture would melt over a range, not at one sharp temperature',
      'heterogeneous mixture': 'the sample is uniform and melts sharply',
    },
  },
];

registerChemTemplate({
  id: 'chem1-acs-00-classify-from-evidence',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Classifying matter from experimental evidence',
  concepts: ['classification-of-matter'],
  generate: (rng, h) => {
    const r = h.pick(CLASSIFY_ROWS);
    // The four class names are the whole option set, so the slate is distinct by construction.
    const wrong = CLASSES.filter((c) => c !== r.answer)
      .map((c) => ({ value: c, error: `not-${c.replace(/\s+/g, '-')}`, why: r.why[c] }));
    return {
      stem: `${r.scenario}\n\nThe original sample is best classified as:`,
      ...h.choices({ value: r.answer }, wrong),
      explanation: `Classify from what the evidence rules OUT, not from what the substance looks like. `
        + `Here the sample is a ${r.answer}: ${Object.values(r.why).join('; ')}.`,
    };
  },
});

const PHYSICAL = [
  'sugar dissolving in warm water',
  'dry ice subliming to a gas',
  'copper wire being drawn thinner',
  'ethanol boiling at 78 °C',
  'paraffin wax melting in a dish',
  'iodine crystals subliming to a violet vapor',
  'salt water separating into salt and water on evaporation',
  'a steel bar becoming magnetized',
];

const CHEMICAL = [
  'zinc metal dissolving in hydrochloric acid while a gas bubbles off',
  'iron forming a flaky red-brown coating in damp air',
  'magnesium ribbon burning with a bright white flame',
  'milk turning sour after several days',
  'silver tarnishing to a black film in air',
  'baking soda fizzing when vinegar is poured on it',
];

registerChemTemplate({
  id: 'chem1-acs-00-physical-vs-chemical-subtle',
  chapterId: CH,
  section: null,
  band: 4,
  name: 'Telling a chemical change from a physical one that looks like it',
  concepts: ['properties-representations-of-matter'],
  generate: (rng, h) => {
    const answer = h.pick(CHEMICAL);
    // Drawn without replacement, so the three physical options can never repeat one another.
    const pool = [...PHYSICAL];
    const wrong = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(rng() * pool.length);
      wrong.push(pool.splice(idx, 1)[0]);
    }
    return {
      stem: 'Which of the following describes a CHEMICAL change?',
      ...h.choices(
        { value: answer },
        wrong.map((w) => ({ value: w, error: 'physical-change', why: 'the substance changes state, shape, or dispersion, but its chemical identity is unchanged' })),
      ),
      explanation: `A chemical change produces a substance that was not there before; a physical change rearranges what is already there. `
        + `"${answer}" makes new substances. Dissolving, melting, subliming and reshaping all leave the identity intact — `
        + `note that dissolving a solid in water is physical, while a metal dissolving in acid and releasing gas is not.`,
    };
  },
});
