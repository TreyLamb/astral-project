// Exam 1 review — Toolbox half. Built 2026-09-09 directly from the instructor's own
// "Ch 1-2 Review" handout (photographed as IMG_0008.jpg / IMG_0009.jpg in
// SupplementalCourseDocs/). That sheet is the exam BLUEPRINT: 26 questions the professor
// himself says the exam is drawn from, so anything on it that the bank could not already ask
// is a hole in exactly the wrong place.
//
// Fifteen of its 26 items had no template anywhere in the bank. The ones handled here:
//
//   Q1  mass from density + a bar's L x W x H          -> mass-from-density-block
//   Q2  144 in^2 -> ft^2, and "a conversion factor = ?" -> squared-unit-conversion,
//                                                          conversion-factor-equals-one
//   Q3  dry ice sublimes: what IS the gas?              -> sublimation-identity
//   Q4  which box has only elements?                    -> element-vs-compound-sample
//   Q5  which box has at least one compound?            -> element-vs-compound-sample
//   Q6  1.02 L - 0.010 L, sig figs AND units            -> sigfig-subtraction-units
//   Q8  is oxygen element/compound/homo/hetero?         -> (existing classify-matter, widened)
//   Q9  mL in 15.000 gal, 1 L = 0.2642 gal              -> english-metric-conversion
//   Q11 name the acid H2CO3                             -> acid-name-from-formula
//   Q12 cm^3 in 2.32 kL                                 -> volume-equivalence
//   Q13 inches in 232 km, 2.54 cm = 1 in                -> english-metric-conversion
//   Q14 which archer is the least precise?              -> accuracy-vs-precision
//   Q15 mass of 1.192 mL at 1.192 g/mL                  -> density-matching-numbers
//   Q16 2.02 g / 0.013 mL, sig figs AND units           -> sigfig-division-units
//   Q17 how many sig figs in 17.040?                    -> sigfig-count
//   Q21 formula for trinitrogen dichloride              -> covalent-formula-from-name
//   Q22 formula for molybdenum(II) sulfate              -> stock-formula-from-name
//   Q24 name OsO2 (Stock system)                        -> stock-name-from-formula
//   Q25 name CoCO3 (Stock system)                       -> stock-name-from-formula
//
// PARTICLE DIAGRAMS ARE DELIBERATELY NOT DRAWN (Trey, 2026-09-09: "dont worry about making
// particle diagrams. questions related to mixtures, pure substances, etc replace those").
// Q4/Q5 are the two diagram items on the sheet; element-vs-compound-sample asks the identical
// reasoning in prose — the skill being tested is "does a unit contain one kind of atom or
// more than one", which a sentence carries as well as a picture.
//
// Everything below stays at COURSE bands (1-3). The ACS-band counterparts live in
// acs-ch00-toolbox.js; a review sheet from the instructor is by definition evidence about the
// instructor's level, not the ACS final's.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-00-toolbox';

const SUBS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const SUPS = { 1: '', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
/** Render a subscript count, dropping an implicit 1 the way a real formula does. */
const sub = (n) => (n === 1 ? '' : String(n).split('').map((d) => SUBS[d]).join(''));

/** Fixed significant figures, as a STRING — trailing zeros are the whole point here. */
const sig = (n, d) => Number(n).toPrecision(d);

/** Compact scientific notation, for the answers that would otherwise be a wall of digits. */
const sci = (n, d = 4) => {
  const e = Number(n).toExponential(d - 1);
  const [m, ex] = e.split('e');
  return `${m} × 10${Number(ex) < 0 ? '⁻' : ''}${String(Math.abs(Number(ex))).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('')}`;
};

/**
 * Walk `values` for the first one where `slate(v)` is all-distinct.
 *
 * The chem registry has no templates/util.js, so this is the local copy of AFOQT's `sweep()`
 * (theknowledgebase/CLAUDE.md, Phase 3 rule 2). Same caveat applies: it can only rescue a
 * collision that actually DEPENDS on the swept value. Where it can't — a ratio of 1:1, a 50/50
 * split — the degenerate value is excluded from the draw instead, and that is called out at
 * each site below.
 */
function sweep(values, start, slate) {
  const ordered = [start, ...values.filter((v) => v !== start)];
  for (const v of ordered) {
    const s = slate(v).map(String);
    if (new Set(s).size === s.length) return v;
  }
  return start;
}

// ---------------------------------------------------------------------------
// Q2's parenthetical. The professor asks it in an aside — "conversion factors should always
// equal WHAT number?" — which is exactly the kind of one-line conceptual anchor that never
// gets its own question and then costs a point.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-conversion-factor-equals-one',
  chapterId: CH,
  section: '1-5',
  band: 1,
  mental: true,
  name: 'A conversion factor is always equal to 1',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const EQ = [
      { eq: '12 in = 1 ft', a: '12 in', b: '1 ft' },
      { eq: '100 cm = 1 m', a: '100 cm', b: '1 m' },
      { eq: '1000 m = 1 km', a: '1000 m', b: '1 km' },
      { eq: '2.54 cm = 1 in', a: '2.54 cm', b: '1 in' },
      { eq: '1000 g = 1 kg', a: '1000 g', b: '1 kg' },
      { eq: '1 mL = 1 cm³', a: '1 mL', b: '1 cm³' },
    ];
    const e = h.pick(EQ);
    return {
      stem: `A conversion factor is written from an equality — for example ${e.eq} gives the factor (${e.a} / ${e.b}). What number is every correctly written conversion factor equal to?`,
      ...h.choices(
        '1',
        [
          { value: 'The number on top of the fraction', error: 'read-the-numerator', why: 'read the numerator instead of evaluating the ratio' },
          { value: '0', error: 'confused-with-difference', why: 'confused the ratio of the two sides with their difference' },
          { value: '100', error: 'assumed-metric-100', why: 'assumed every conversion is a metric factor of 100' },
          { value: 'It depends on which unit you start in', error: 'direction-dependent', why: 'thought the value of the factor changes with direction — only which side goes on top changes' },
        ],
      ),
      explanation: `${e.eq} says the two sides are the SAME amount, so ${e.a} / ${e.b} = 1 (and so does ${e.b} / ${e.a}). That is why multiplying by a conversion factor never changes the quantity — only the units it is written in. Which side you put on top is chosen so the unit you are leaving cancels.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q2 proper. 144 in^2 -> ft^2. The trap is dividing by 12 instead of 12^2, and it is one of the
// most reliable single-point losses on a first chemistry exam.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-squared-unit-conversion',
  chapterId: CH,
  section: '1-7',
  band: 3,
  name: 'Converting a squared or cubed unit',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const CASES = [
      { small: 'in', big: 'ft', f: 12 },
      { small: 'ft', big: 'yd', f: 3 },
      { small: 'cm', big: 'm', f: 100 },
      { small: 'mm', big: 'cm', f: 10 },
    ];
    const c = h.pick(CASES);
    const power = h.pick([2, 3]);
    const exp = power === 2 ? '²' : '³';
    const k = h.int(1, 9);
    const factor = Math.pow(c.f, power);
    const value = k * factor;
    const fmt = (n) => (Math.abs(n) >= 1e6 || (Math.abs(n) > 0 && Math.abs(n) < 1e-3) ? sci(n) : String(Number(n.toPrecision(6))));
    return {
      stem: `${power === 2 ? 'An area' : 'A volume'} of ${fmt(value)} ${c.small}${exp} is measured. Given that ${c.f} ${c.small} = 1 ${c.big}, how many ${c.big}${exp} is that?`,
      ...h.choices(
        { value: `${fmt(k)} ${c.big}${exp}` },
        [
          // The whole point of the item. Ordered first so it is guaranteed to reach the page
          // (Phase 8 rule 3) and can safely be named in the explanation.
          { value: `${fmt(value / c.f)} ${c.big}${exp}`, error: 'factor-not-raised', why: `divided by ${c.f} once instead of by ${c.f}${exp}` },
          { value: `${fmt(value * factor)} ${c.big}${exp}`, error: 'inverted-conversion', why: 'multiplied by the factor instead of dividing — converted in the wrong direction' },
          { value: `${fmt(value / Math.pow(c.f, power === 2 ? 3 : 2))} ${c.big}${exp}`, error: 'wrong-power', why: `raised the factor to the wrong power` },
          { value: `${fmt(value)} ${c.big}${exp}`, error: 'no-conversion', why: 'changed the unit label without converting the number' },
        ],
      ),
      explanation: `Square (or cube) the WHOLE conversion factor, units and all: (${c.f} ${c.small} / 1 ${c.big})${exp} = ${fmt(factor)} ${c.small}${exp} / 1 ${c.big}${exp}. So ${fmt(value)} ${c.small}${exp} ÷ ${fmt(factor)} = ${fmt(k)} ${c.big}${exp}. Dividing by ${c.f} alone gives ${fmt(value / c.f)}, which is off by a factor of ${fmt(factor / c.f)} — the single most common way to lose this question.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q9 and Q13. Both give the equality in the question, so this is not a memory test — it is a
// test of chaining a supplied non-metric factor onto metric prefixes without inverting one.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-english-metric-conversion',
  chapterId: CH,
  section: '1-5',
  band: 2,
  name: 'Converting across a supplied non-metric equality',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const CASES = [
      {
        from: 'gallons', to: 'mL', given: '1 L = 0.2642 gal',
        correct: (v) => (v / 0.2642) * 1000,
        inverted: (v) => v * 0.2642 * 1000,
        onestep: (v) => v / 0.2642,
      },
      {
        from: 'km', to: 'inches', given: '2.54 cm = 1 in',
        correct: (v) => (v * 100000) / 2.54,
        inverted: (v) => v * 100000 * 2.54,
        onestep: (v) => (v * 1000) / 2.54,
      },
      {
        from: 'pounds', to: 'mg', given: '1 lb = 453.6 g',
        correct: (v) => v * 453.6 * 1000,
        inverted: (v) => (v / 453.6) * 1000,
        onestep: (v) => v * 453.6,
      },
      {
        from: 'quarts', to: 'µL', given: '1 qt = 0.9464 L',
        correct: (v) => v * 0.9464 * 1e6,
        inverted: (v) => (v / 0.9464) * 1e6,
        onestep: (v) => v * 0.9464 * 1000,
      },
    ];
    const c = h.pick(CASES);
    const v = +(h.int(105, 985) / 10).toFixed(1);
    return {
      stem: `How many ${c.to} are in ${v} ${c.from}? (${c.given})`,
      ...h.choices(
        { value: `${sci(c.correct(v))} ${c.to}` },
        [
          { value: `${sci(c.inverted(v))} ${c.to}`, error: 'inverted-factor', why: `used the supplied factor upside down — multiplied where it should divide, or the reverse` },
          { value: `${sci(c.onestep(v))} ${c.to}`, error: 'missed-a-metric-step', why: 'stopped one metric prefix short of the unit asked for' },
          { value: `${sci(c.correct(v) / 10)} ${c.to}`, error: 'off-by-one-power', why: 'was off by a single power of ten somewhere in the chain' },
          { value: `${sci(v)} ${c.to}`, error: 'no-conversion', why: 'relabelled the unit without converting' },
        ],
      ),
      explanation: `Chain the factors so every unit but the last one cancels, and check the direction before you compute: going to ${c.to} from ${c.from}, the number must come out ${c.correct(v) > v ? 'LARGER' : 'SMALLER'}, because ${c.to} is the ${c.correct(v) > v ? 'smaller' : 'larger'} unit. Answer: ${sci(c.correct(v))} ${c.to}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q12. The hinge is that 1 mL and 1 cm^3 are the same volume by definition — the only place in
// the course where two differently-named units are exactly equal with no factor at all.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-volume-equivalence',
  chapterId: CH,
  section: '1-5',
  band: 2,
  name: 'Volume unit equivalence (1 mL = 1 cm³)',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    // Every entry is "how many `to` in one `from`". 1 mL = 1 cm^3 exactly.
    const CASES = [
      { from: 'kL', to: 'cm³', k: 1e6, note: '1 kL = 1000 L, 1 L = 1000 mL, 1 mL = 1 cm³' },
      { from: 'L', to: 'cm³', k: 1000, note: '1 L = 1000 mL, 1 mL = 1 cm³' },
      { from: 'm³', to: 'L', k: 1000, note: '1 m³ = 10⁶ cm³, 1 cm³ = 1 mL, 1000 mL = 1 L' },
      { from: 'cm³', to: 'L', k: 0.001, note: '1 cm³ = 1 mL, 1000 mL = 1 L' },
      { from: 'kL', to: 'mL', k: 1e6, note: '1 kL = 1000 L, 1 L = 1000 mL' },
    ];
    const c = h.pick(CASES);
    const v = +(h.int(112, 989) / 100).toFixed(2);
    const fmt = (n) => (Math.abs(n) >= 1e5 || Math.abs(n) < 0.01 ? sci(n) : String(Number(n.toPrecision(6))));
    return {
      stem: `How many ${c.to} are in ${v} ${c.from}?`,
      ...h.choices(
        { value: `${fmt(v * c.k)} ${c.to}` },
        [
          { value: `${fmt(v / c.k)} ${c.to}`, error: 'inverted-conversion', why: 'converted in the wrong direction' },
          { value: `${fmt(v * c.k / 1000)} ${c.to}`, error: 'missed-a-metric-step', why: 'left out one 1000-fold step in the chain' },
          { value: `${fmt(v * c.k * 1000)} ${c.to}`, error: 'extra-metric-step', why: 'applied one 1000-fold step too many — usually by treating 1 cm³ as 1 L rather than 1 mL' },
          { value: `${fmt(v)} ${c.to}`, error: 'no-conversion', why: 'relabelled the unit without converting' },
        ],
      ),
      explanation: `${c.note}. So ${v} ${c.from} × ${fmt(c.k)} = ${fmt(v * c.k)} ${c.to}. The step people drop is the free one: a millilitre and a cubic centimetre are the same volume by definition, factor of exactly 1.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q17. Counting sig figs in a measured quantity. The bank could APPLY the rules in arithmetic
// and could not COUNT them, which is the form the professor actually asks.
//
// The counts are declared, never derived: a JS number silently destroys trailing zeros, and
// the trailing zeros are the entire content of this question.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-sigfig-count',
  chapterId: CH,
  section: '1-6',
  band: 1,
  mental: true,
  name: 'Counting significant figures in a measured quantity',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const ITEMS = [
      { q: '17.040', sf: 5, digits: 5, why: 'the zero between 4 and nothing is captive AND trailing after a decimal point, so it counts' },
      { q: '0.00420', sf: 3, digits: 6, why: 'leading zeros never count; the trailing zero after the decimal point does' },
      { q: '1200', sf: 2, digits: 4, why: 'with no decimal point shown, the trailing zeros are ambiguous and are not counted' },
      { q: '1200.', sf: 4, digits: 4, why: 'the trailing decimal point is there precisely to say those zeros were measured' },
      { q: '0.050', sf: 2, digits: 4, why: 'leading zeros are placeholders; the final zero is significant' },
      { q: '100.0', sf: 4, digits: 4, why: 'a decimal point is shown, so every digit written counts' },
      { q: '0.0001', sf: 1, digits: 5, why: 'all four zeros are placeholders locating the decimal point' },
      { q: '45.60', sf: 4, digits: 4, why: 'a trailing zero after a decimal point is a measured digit, not decoration' },
      { q: '6.022 × 10²³', sf: 4, digits: 4, why: 'in scientific notation only the coefficient carries significant figures' },
      { q: '3.00 × 10⁸', sf: 3, digits: 3, why: 'in scientific notation only the coefficient carries significant figures' },
      { q: '0.9080', sf: 4, digits: 5, why: 'the captive zero and the trailing zero after the decimal both count' },
      { q: '20500', sf: 3, digits: 5, why: 'the captive zero counts; the trailing zeros with no decimal point shown do not' },
    ];
    const it = h.pick(ITEMS);
    return {
      // The quantity goes LAST, matching the instructor's own phrasing. It also has to: one of
      // the items is "1200." and "the quantity 1200. have?" is unreadable mid-sentence.
      stem: `How many significant figures does the following measured quantity have?\n\n${it.q}`,
      ...h.choices(
        String(it.sf),
        [
          { value: String(it.digits), error: 'counted-every-digit', why: 'counted every digit written, including placeholder zeros' },
          { value: String(it.sf + 1), error: 'counted-one-extra-zero', why: 'counted one zero that is only a placeholder' },
          { value: String(it.sf - 1), error: 'dropped-a-real-zero', why: 'dropped a zero that was actually measured' },
          { value: String(it.sf + 2), error: 'counted-every-digit', why: 'counted placeholder zeros as measured digits' },
        ],
      ),
      explanation: `${it.q} has ${it.sf} significant figures — ${it.why}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q6. Addition/subtraction uses DECIMAL PLACES, not significant figures — and the professor
// bolds "and have the correct units", so a unitless option is one of the wrong answers.
//
// Every displayed number is a declared string. Deriving "1.010" from the float 1.01 is
// impossible, and that trailing zero is the question.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-sigfig-subtraction-units',
  chapterId: CH,
  section: '1-6',
  band: 2,
  name: 'Addition and subtraction: decimal places, and keep the units',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const CASES = [
      { a: '1.02 L', b: '0.010 L', op: '−', raw: '1.010', ans: '1.01', unit: 'L', sfWrong: '1.0', dp: 2, from: '1.02' },
      { a: '12.11 g', b: '0.3 g', op: '−', raw: '11.81', ans: '11.8', unit: 'g', sfWrong: '10', dp: 1, from: '0.3' },
      { a: '4.7 mL', b: '0.155 mL', op: '+', raw: '4.855', ans: '4.9', unit: 'mL', sfWrong: '4.9', dp: 1, from: '4.7' },
      { a: '25.00 cm', b: '1.2 cm', op: '+', raw: '26.20', ans: '26.2', unit: 'cm', sfWrong: '26', dp: 1, from: '1.2' },
      { a: '0.250 g', b: '0.107 g', op: '−', raw: '0.143', ans: '0.143', unit: 'g', sfWrong: '0.143', dp: 3, from: 'both' },
      { a: '108.4 mL', b: '9.06 mL', op: '+', raw: '117.46', ans: '117.5', unit: 'mL', sfWrong: '117.5', dp: 1, from: '108.4' },
    ];
    const c = h.pick(CASES);
    return {
      stem: `Perform the calculation and report the result with the correct number of significant figures AND the correct units.\n\n${c.a} ${c.op} ${c.b} =`,
      ...h.choices(
        { value: `${c.ans} ${c.unit}` },
        [
          { value: `${c.raw} ${c.unit}`, error: 'no-rounding-applied', why: 'reported every digit the calculator showed instead of applying the precision rule' },
          { value: `${c.ans}`, error: 'units-dropped', why: 'got the number right and dropped the unit — a measurement without a unit is not an answer' },
          { value: `${c.sfWrong} ${c.unit}`, error: 'used-sig-fig-rule', why: 'used the multiplication rule (fewest significant figures) — addition and subtraction use fewest DECIMAL PLACES' },
          { value: `${c.raw}`, error: 'no-rounding-applied', why: 'neither rounded nor kept the unit' },
        ],
      ),
      explanation: `Line the numbers up at the decimal point. The raw result is ${c.raw} ${c.unit}. For + and − the answer keeps the FEWEST DECIMAL PLACES of any input${c.from === 'both' ? '' : ` — here that is ${c.from}, with ${c.dp}`}${c.from === 'both' ? `, which is ${c.dp} here` : ''} — giving ${c.ans} ${c.unit}. Significant figures are the rule for × and ÷; they are NOT the rule here. The unit carries straight through unchanged.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q16, the multiplication/division counterpart — and here the units genuinely CHANGE (g / mL
// becomes g/mL, cm x cm becomes cm^2), which is the part the professor bolded.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-sigfig-division-units',
  chapterId: CH,
  section: '1-6',
  band: 2,
  name: 'Multiplication and division: fewest sig figs, and the unit changes',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const CASES = [
      { expr: '2.02 g / 0.013 mL', raw: '155.3846...', ans: '1.6 × 10²', unit: 'g/mL', sf: 2, lim: '0.013 (2 sig figs)', badUnit: 'g·mL', wrongSf: '155.38' },
      { expr: '4.50 g / 1.2 mL', raw: '3.75', ans: '3.8', unit: 'g/mL', sf: 2, lim: '1.2 (2 sig figs)', badUnit: 'mL/g', wrongSf: '3.750' },
      { expr: '6.02 cm × 2.1 cm', raw: '12.642', ans: '13', unit: 'cm²', sf: 2, lim: '2.1 (2 sig figs)', badUnit: 'cm', wrongSf: '12.6' },
      { expr: '125 g / 25.0 mL', raw: '5', ans: '5.00', unit: 'g/mL', sf: 3, lim: 'both inputs (3 sig figs)', badUnit: 'mL/g', wrongSf: '5' },
      { expr: '0.0840 L × 3.5 mol/L', raw: '0.294', ans: '0.29', unit: 'mol', sf: 2, lim: '3.5 (2 sig figs)', badUnit: 'mol/L', wrongSf: '0.294' },
      { expr: '18.6 m / 2.00 s', raw: '9.3', ans: '9.30', unit: 'm/s', sf: 3, lim: '2.00 (3 sig figs)', badUnit: 'm·s', wrongSf: '9.3' },
    ];
    const c = h.pick(CASES);
    return {
      stem: `Perform the calculation and report the result with the correct number of significant figures AND the correct units.\n\n${c.expr} =`,
      ...h.choices(
        { value: `${c.ans} ${c.unit}` },
        [
          { value: `${c.ans} ${c.badUnit}`, error: 'wrong-derived-unit', why: 'rounded correctly but did not carry the units through the operation — divide the units when you divide the numbers' },
          { value: `${c.wrongSf} ${c.unit}`, error: 'wrong-sig-fig-count', why: `kept the wrong number of significant figures (the answer can only have ${c.sf})` },
          { value: `${c.ans}`, error: 'units-dropped', why: 'dropped the unit entirely' },
          { value: `${c.raw} ${c.unit}`, error: 'no-rounding-applied', why: 'reported the raw calculator display' },
        ],
      ),
      explanation: `For × and ÷ the answer keeps the FEWEST SIGNIFICANT FIGURES of any input — here ${c.lim}, so ${c.sf}. The raw value is ${c.raw}, which written to ${c.sf} significant figures is ${c.ans}. Treat the units as algebra alongside the numbers: ${c.expr.replace(/[\d.]+ ?/g, '')} → ${c.unit}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q14, the four archers. Rebuilt as repeated weighings of a known mass, which is how chemistry
// actually meets the distinction and — unlike a target — separates the two axes cleanly:
// precision is the SPREAD of a student's own numbers, accuracy is how close they sit to truth.
//
// The answer is DERIVED from the numbers drawn, not declared alongside them, so a wide draw
// can never silently disagree with the key.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-accuracy-vs-precision',
  chapterId: CH,
  section: '1-6',
  band: 2,
  mental: true,
  name: 'Telling accuracy from precision',
  concepts: ['accuracy-vs-precision'],
  generate: (rng, h) => {
    const TRUE = 10.00;
    const jitter = (spread) => +(((rng() - 0.5) * 2 * spread)).toFixed(3);

    // Four profiles with deliberately separated spreads and biases, so every question below has
    // exactly one defensible answer no matter what the jitter does.
    //   good      tight  + centred    -> accurate AND precise
    //   tightOff  tight  + far off    -> precise, NOT accurate
    //   loose     wide   + near       -> neither strongly; the "middle" option
    //   scattered widest + moderate   -> least precise
    const profiles = [
      { key: 'good', bias: 0, spread: 0.02 },
      { key: 'tightOff', bias: -1.6, spread: 0.02 },
      { key: 'loose', bias: 0.25, spread: 0.55 },
      { key: 'scattered', bias: -0.3, spread: 2.4 },
    ];

    const NAMES = ['W', 'X', 'Y', 'Z'];
    const order = [...profiles];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const students = order.map((p, i) => {
      const reads = [0, 1, 2].map(() => +(TRUE + p.bias + jitter(p.spread)).toFixed(2));
      const mean = reads.reduce((a, b) => a + b, 0) / reads.length;
      return {
        name: NAMES[i],
        key: p.key,
        reads,
        range: Math.max(...reads) - Math.min(...reads),
        off: Math.abs(mean - TRUE),
      };
    });

    const by = (fn) => students.slice().sort(fn)[0].name;
    const QUESTIONS = [
      {
        ask: 'whose results are precise but NOT accurate',
        answer: () => students.find((s) => s.key === 'tightOff').name,
        note: 'Their three numbers agree closely with each other (precise) but sit well away from the true mass (not accurate) — the signature of a systematic error, like a balance that was never zeroed.',
      },
      {
        ask: 'whose results are both accurate and precise',
        answer: () => students.find((s) => s.key === 'good').name,
        note: 'Their numbers agree with each other AND cluster on the true value.',
      },
      {
        ask: 'whose results are the LEAST precise',
        answer: () => by((a, b) => b.range - a.range),
        note: 'Precision is only about how closely a set of measurements agrees with ITSELF — the widest spread is the least precise, whether or not its average happens to land near the truth.',
      },
      {
        ask: 'whose results are the LEAST accurate on average',
        answer: () => by((a, b) => b.off - a.off),
        // Kept free of any claim about that student's SPREAD: the answer here is derived from
        // the numbers actually drawn, so on an unlucky draw the widest set can also be the
        // furthest off, and a note asserting "tidy but wrong" would then be false.
        note: 'Accuracy is only about how close the average of your measurements lands to the true value, and says nothing about whether they agree with each other.',
      },
    ];
    const q = h.pick(QUESTIONS);
    const correct = q.answer();
    const roster = students.map((s) => `Student ${s.name}: ${s.reads.map((r) => r.toFixed(2)).join(' g, ')} g`).join('\n');

    return {
      stem: `A sample is known to have a mass of exactly ${TRUE.toFixed(2)} g. Four students each weigh it three times:\n\n${roster}\n\nBased only on these results, ${q.ask}?`,
      ...h.choices(
        `Student ${correct}`,
        students
          .filter((s) => s.name !== correct)
          .map((s) => ({
            value: `Student ${s.name}`,
            error: 'accuracy-precision-confused',
            why: `Student ${s.name}'s numbers ${s.range > 0.3 ? 'disagree with each other by a lot' : 'agree closely with each other'} and their average is ${s.off > 0.5 ? 'well away from' : 'close to'} ${TRUE.toFixed(2)} g`,
          })),
      ),
      explanation: `Student ${correct}. ${q.note} The two words are independent: PRECISE means the repeats agree with each other; ACCURATE means they agree with the true value. A set of measurements can be either, both, or neither.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q1. Density with the volume hidden inside a set of dimensions, so the question is really
// "did you notice you have to build the volume first".
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-mass-from-density-block',
  chapterId: CH,
  section: '1-7',
  band: 2,
  name: 'Mass of a rectangular block from its density and dimensions',
  concepts: ['density', 'unit-conversions'],
  generate: (rng, h) => {
    const DIMS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
    // Densities of real metals, so the number in the stem is something a chemist would believe.
    // None of them equals a possible dimension, which is what keeps the "dropped a dimension"
    // distractor from ever landing on the answer.
    const METALS = [
      { d: 10.1, name: '' }, { d: 2.70, name: '' }, { d: 7.87, name: '' },
      { d: 8.96, name: '' }, { d: 11.3, name: '' }, { d: 19.3, name: '' },
    ];
    const L = h.pick(DIMS);
    const W = h.pick(DIMS.filter((x) => x !== L));
    const H = h.pick(DIMS.filter((x) => x !== L && x !== W));
    const { d } = h.pick(METALS);
    const V = L * W * H;
    const m = d * V;
    const f = (n) => sig(n, 4);
    return {
      stem: `A rectangular bar of a metal measuring ${L.toFixed(1)} cm × ${W.toFixed(1)} cm × ${H.toFixed(1)} cm was found to have a density of ${d.toFixed(2)} g/cm³. What is the mass of this block?`,
      ...h.choices(
        { value: `${f(m)} g` },
        [
          { value: `${f(V)} g`, error: 'stopped-at-volume', why: 'found the volume and stopped — that is a volume in cm³, not a mass in g' },
          { value: `${f(V / d)} g`, error: 'inverted-density', why: 'divided by the density instead of multiplying — density is mass PER volume, so mass = density × volume' },
          { value: `${f(d * L * W)} g`, error: 'dropped-a-dimension', why: 'used only two of the three dimensions, giving an area rather than a volume' },
          { value: `${f(d * (L + W + H))} g`, error: 'added-dimensions', why: 'added the dimensions instead of multiplying them' },
        ],
      ),
      explanation: `Volume first: ${L.toFixed(1)} × ${W.toFixed(1)} × ${H.toFixed(1)} = ${f(V)} cm³. Then mass = density × volume = ${d.toFixed(2)} g/cm³ × ${f(V)} cm³ = ${f(m)} g. The units tell you which way round it goes: g/cm³ × cm³ leaves g, so multiply.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q15. The numbers in the stem are identical on purpose. "1.192 mL at 1.192 g/mL" invites the
// answer 1.192 g (or 1) — the units cancel, the NUMBERS do not.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-density-matching-numbers',
  chapterId: CH,
  section: '1-7',
  band: 2,
  name: 'Density and volume with matching numbers',
  concepts: ['density'],
  generate: (rng, h) => {
    // Excluded by construction: a density of exactly 1, where d^2 == d and the trap distractor
    // would BE the answer. A sweep cannot fix that one — the collision holds for every draw.
    const D = [1.192, 0.8765, 2.045, 1.490, 0.7893, 3.120, 1.847];
    const d = h.pick(D);
    const f = (n) => sig(n, 4);
    return {
      stem: `A chemical has a density of ${d} g/mL. What is the mass in grams of ${d} mL of this chemical?`,
      ...h.choices(
        { value: `${f(d * d)} g` },
        [
          { value: `${d} g`, error: 'numbers-cancelled', why: 'saw the same number twice and assumed it cancelled — only the mL unit cancels, not the value' },
          { value: '1.000 g', error: 'assumed-unity', why: 'treated the matching numbers as a ratio equal to 1' },
          { value: `${f(1 / d)} g`, error: 'inverted-density', why: 'divided by the density instead of multiplying' },
          { value: `${f(d / d)} g`, error: 'assumed-unity', why: 'divided the two identical numbers instead of multiplying them' },
        ],
      ),
      explanation: `mass = density × volume = ${d} g/mL × ${d} mL = ${f(d * d)} g. Only the mL cancels. Multiplying a number by itself does not give you that number back (unless it happens to be 1), and the matching digits in the question are bait.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q3. Sublimation does not decompose anything — the gas above dry ice is still CO2. This is a
// one-line idea that the bank's physical-vs-chemical template never actually asked.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-sublimation-identity',
  chapterId: CH,
  section: '1-4',
  band: 1,
  mental: true,
  name: 'A phase change does not change the substance',
  concepts: ['properties-representations-of-matter'],
  generate: (rng, h) => {
    const CASES = [
      {
        change: 'dry ice (solid CO₂) sublimes', phase: 'gas',
        correct: 'carbon dioxide, CO₂',
        wrong: [
          { value: 'carbon and oxygen gas, C and O₂', error: 'assumed-decomposition', why: 'assumed the solid broke apart into its elements — that would be a chemical change' },
          { value: 'water vapour, H₂O', error: 'confused-with-the-fog', why: 'named the white fog you can see, which is condensed water from the air, not the CO₂ itself' },
          { value: 'oxygen gas, O₂', error: 'assumed-decomposition', why: 'kept only part of the original substance' },
        ],
      },
      {
        change: 'solid iodine sublimes', phase: 'violet vapour',
        correct: 'iodine, I₂',
        wrong: [
          { value: 'iodine atoms, I', error: 'assumed-bond-breaking', why: 'broke the I–I bond — subliming does not break bonds WITHIN a molecule' },
          { value: 'hydrogen iodide, HI', error: 'invented-a-reaction', why: 'invented a reaction that the question never described' },
          { value: 'a mixture of iodine and air', error: 'confused-with-mixture', why: 'described where the vapour ends up rather than what the vapour IS' },
        ],
      },
      {
        change: 'liquid nitrogen boils', phase: 'gas',
        correct: 'nitrogen, N₂',
        wrong: [
          { value: 'nitrogen atoms, N', error: 'assumed-bond-breaking', why: 'broke the N≡N bond — boiling separates molecules from each other, not atoms within a molecule' },
          { value: 'air', error: 'confused-with-mixture', why: 'named the mixture it disperses into rather than the substance itself' },
          { value: 'nitrogen dioxide, NO₂', error: 'invented-a-reaction', why: 'invented a reaction with oxygen that the question never described' },
        ],
      },
      {
        change: 'water boils in a kettle', phase: 'gas',
        correct: 'water, H₂O',
        wrong: [
          { value: 'hydrogen and oxygen gas, H₂ and O₂', error: 'assumed-decomposition', why: 'assumed the water split into its elements — that needs electrolysis, not a kettle' },
          { value: 'air with extra moisture in it', error: 'confused-with-mixture', why: 'described the room rather than the substance leaving the kettle' },
          { value: 'hydrogen peroxide, H₂O₂', error: 'invented-a-reaction', why: 'invented a new compound; boiling makes no new substance' },
        ],
      },
    ];
    const c = h.pick(CASES);
    return {
      stem: `When ${c.change}, what is the substance in the ${c.phase} that results?`,
      ...h.choices(c.correct, c.wrong),
      explanation: `${c.correct} — unchanged. Melting, boiling and subliming are PHYSICAL changes: they change how far apart the particles are and how freely they move, not what the particles are. Making a different substance would be a chemical change, and nothing in the question describes one.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q4 and Q5, in prose rather than as particle boxes (see the header note). The reasoning is
// identical: look at each UNIT in the sample and ask whether it holds one kind of atom or more
// than one. The composition is generated, and the key derived from it.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-element-vs-compound-sample',
  chapterId: CH,
  section: '1-3',
  band: 2,
  mental: true,
  name: 'Elements and compounds in a described sample',
  concepts: ['classification-of-matter'],
  generate: (rng, h) => {
    // A "unit" is one free-floating particle. `kinds` counts how many DIFFERENT elements are
    // bonded together in it — 2 or more makes it a compound.
    const UNITS = {
      loneA: { text: 'single unbonded atoms of element A', kinds: 1 },
      loneB: { text: 'single unbonded atoms of element B', kinds: 1 },
      aa: { text: 'molecules of two A atoms bonded together', kinds: 1 },
      bb: { text: 'molecules of two B atoms bonded together', kinds: 1 },
      aaa: { text: 'molecules of three A atoms bonded together', kinds: 1 },
      ab: { text: 'molecules of one A atom bonded to one B atom', kinds: 2 },
      ab2: { text: 'molecules of one A atom bonded to two B atoms', kinds: 2 },
      a2b: { text: 'molecules of two A atoms bonded to one B atom', kinds: 2 },
    };
    const PURE = ['loneA', 'loneB', 'aa', 'bb', 'aaa'];
    const MIXED = ['ab', 'ab2', 'a2b'];

    const pickN = (from, n) => {
      const pool = [...from];
      const out = [];
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      return out;
    };

    const wantOnlyElements = rng() < 0.5;

    // Build four samples. Exactly one satisfies the question; the other three are constructed to
    // fail it, so the key is unique by construction rather than by luck.
    const samples = [];
    for (let i = 0; i < 4; i++) {
      const isAnswer = i === 0;
      const holdsCompound = wantOnlyElements ? !isAnswer : isAnswer;
      const keys = holdsCompound
        ? [...pickN(MIXED, 1), ...pickN(PURE, 1)]
        : pickN(PURE, 2);
      samples.push({ keys, holdsCompound });
    }
    for (let i = samples.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [samples[i], samples[j]] = [samples[j], samples[i]];
    }

    const labelled = samples.map((s, i) => ({ ...s, label: `Sample ${i + 1}` }));
    const answer = labelled.find((s) => (wantOnlyElements ? !s.holdsCompound : s.holdsCompound));
    const roster = labelled
      .map((s) => `${s.label}: ${s.keys.map((k) => UNITS[k].text).join(', and ')}.`)
      .join('\n');

    return {
      stem: `A and B are two different elements. Four sealed flasks each hold a sample:\n\n${roster}\n\nWhich sample ${wantOnlyElements ? 'contains only elements (no compound at all)' : 'contains at least one compound'}?`,
      ...h.choices(
        answer.label,
        labelled
          .filter((s) => s.label !== answer.label)
          .map((s) => ({
            value: s.label,
            error: wantOnlyElements ? 'counted-a-compound-as-an-element' : 'counted-an-element-as-a-compound',
            why: s.holdsCompound
              ? `${s.label} does contain a compound — it has a particle with two different elements bonded together`
              : `${s.label} contains no compound — every particle in it is built from just one kind of atom`,
          })),
      ),
      explanation: `${answer.label}. Look at each particle on its own and ask how many DIFFERENT elements are bonded inside it. One kind of atom means an element — and that stays true whether the atoms float alone or are bonded into a molecule, so two A atoms bonded together are still element A, not a compound. Two or more different elements bonded together is a compound. Having several different particles in the same flask makes it a MIXTURE, which is a separate question from whether any one particle is an element or a compound.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q11. Acid nomenclature — its own system, and completely absent from the bank before this.
// ---------------------------------------------------------------------------
const ACIDS = [
  { f: 'H₂CO₃', name: 'carbonic acid', ion: 'carbonate, CO₃²⁻', ous: 'carbonous acid', hydro: 'hydrocarbonic acid', ionName: 'carbonate acid', kind: 'oxy' },
  { f: 'H₂SO₄', name: 'sulfuric acid', ion: 'sulfate, SO₄²⁻', ous: 'sulfurous acid', hydro: 'hydrosulfuric acid', ionName: 'sulfate acid', kind: 'oxy' },
  { f: 'H₂SO₃', name: 'sulfurous acid', ion: 'sulfite, SO₃²⁻', ous: 'sulfuric acid', hydro: 'hydrosulfurous acid', ionName: 'sulfite acid', kind: 'oxy' },
  { f: 'HNO₃', name: 'nitric acid', ion: 'nitrate, NO₃⁻', ous: 'nitrous acid', hydro: 'hydronitric acid', ionName: 'nitrate acid', kind: 'oxy' },
  { f: 'HNO₂', name: 'nitrous acid', ion: 'nitrite, NO₂⁻', ous: 'nitric acid', hydro: 'hydronitrous acid', ionName: 'nitrite acid', kind: 'oxy' },
  { f: 'H₃PO₄', name: 'phosphoric acid', ion: 'phosphate, PO₄³⁻', ous: 'phosphorous acid', hydro: 'hydrophosphoric acid', ionName: 'phosphate acid', kind: 'oxy' },
  { f: 'HClO₄', name: 'perchloric acid', ion: 'perchlorate, ClO₄⁻', ous: 'chloric acid', hydro: 'hydroperchloric acid', ionName: 'perchlorate acid', kind: 'oxy' },
  { f: 'HClO₃', name: 'chloric acid', ion: 'chlorate, ClO₃⁻', ous: 'chlorous acid', hydro: 'hydrochloric acid', ionName: 'chlorate acid', kind: 'oxy' },
  { f: 'HClO₂', name: 'chlorous acid', ion: 'chlorite, ClO₂⁻', ous: 'chloric acid', hydro: 'hydrochlorous acid', ionName: 'chlorite acid', kind: 'oxy' },
  { f: 'HC₂H₃O₂', name: 'acetic acid', ion: 'acetate, C₂H₃O₂⁻', ous: 'acetous acid', hydro: 'hydroacetic acid', ionName: 'acetate acid', kind: 'oxy' },
  { f: 'HCl(aq)', name: 'hydrochloric acid', ion: 'chloride, Cl⁻', ous: 'chlorous acid', hydro: 'chloric acid', ionName: 'chloride acid', kind: 'binary' },
  { f: 'HBr(aq)', name: 'hydrobromic acid', ion: 'bromide, Br⁻', ous: 'bromous acid', hydro: 'bromic acid', ionName: 'bromide acid', kind: 'binary' },
  { f: 'HF(aq)', name: 'hydrofluoric acid', ion: 'fluoride, F⁻', ous: 'fluorous acid', hydro: 'fluoric acid', ionName: 'fluoride acid', kind: 'binary' },
  { f: 'H₂S(aq)', name: 'hydrosulfuric acid', ion: 'sulfide, S²⁻', ous: 'sulfurous acid', hydro: 'sulfuric acid', ionName: 'sulfide acid', kind: 'binary' },
];

registerChemTemplate({
  id: 'chem1-rev1-00-acid-name-from-formula',
  chapterId: CH,
  section: '2-7',
  band: 2,
  mental: true,
  name: 'Naming an acid from its formula',
  concepts: ['nomenclature-acids'],
  generate: (rng, h) => {
    const a = h.pick(ACIDS);
    const rule = a.kind === 'oxy'
      ? 'An OXYacid (the anion contains oxygen) takes no "hydro-": an -ate ion becomes -IC acid, an -ite ion becomes -OUS acid.'
      : 'A BINARY acid (no oxygen in the anion) takes "hydro-" + the element stem + "-ic acid".';
    return {
      stem: `What is the name of the acid ${a.f}?`,
      ...h.choices(
        a.name,
        [
          { value: a.ous, error: 'ate-ite-suffix-swap', why: 'swapped -ic and -ous, which corresponds to the wrong anion' },
          { value: a.hydro, error: 'hydro-prefix-misapplied', why: a.kind === 'oxy' ? 'used "hydro-", which belongs only to acids whose anion contains NO oxygen' : 'left off "hydro-", which a binary acid requires' },
          { value: a.ionName, error: 'kept-the-ion-name', why: 'kept the anion’s own name instead of converting the suffix to an acid ending' },
        ],
      ),
      explanation: `${a.f} is ${a.name}. Its anion is ${a.ion}. ${rule}`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-rev1-00-acid-formula-from-name',
  chapterId: CH,
  section: '2-7',
  band: 2,
  mental: true,
  name: 'Writing an acid formula from its name',
  concepts: ['nomenclature-acids'],
  generate: (rng, h) => {
    const a = h.pick(ACIDS);
    const others = ACIDS.filter((x) => x.f !== a.f);
    const sameStem = others.find((x) => x.name.replace(/(ic|ous) acid$/, '') === a.name.replace(/(ic|ous) acid$/, ''));
    const pool = [];
    if (sameStem) {
      pool.push({ value: sameStem.f, error: 'ate-ite-suffix-swap', why: `that is ${sameStem.name} — the -ic/-ous ending picks which oxyanion you mean, and this one has the wrong number of oxygens` });
    }
    // The hydrogen count comes from the anion's charge; getting it wrong is the other half of
    // the skill, so a wrong-H version of the SAME anion is always on the page.
    const bumped = a.f.replace(/^H(₂|₃)?/, (m, n) => (n === '₂' ? 'H' : n === '₃' ? 'H₂' : 'H₂'));
    pool.push({ value: bumped, error: 'wrong-hydrogen-count', why: 'used the wrong number of H atoms — you need exactly enough to cancel the anion’s charge' });
    for (const o of others) pool.push({ value: o.f, error: 'wrong-anion', why: `that is ${o.name}` });
    return {
      stem: `Write the formula for ${a.name}.`,
      ...h.choices(a.f, pool),
      explanation: `${a.name} is ${a.f}. Work backwards from the name to the anion (${a.ion}), then add exactly enough H⁺ to bring the total charge to zero.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q21. "trinitrogen dichloride" -> N3Cl2. The bank could name a covalent compound and could not
// go the other way, which is the direction the professor asks.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-covalent-formula-from-name',
  chapterId: CH,
  section: '2-7',
  band: 2,
  mental: true,
  name: 'Formula from a covalent (prefix) name',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const PREFIX = ['mono', 'di', 'tri', 'tetra', 'penta', 'hexa'];
    const ELS = [
      { sym: 'N', name: 'nitrogen', stem: 'nitr' },
      { sym: 'S', name: 'sulfur', stem: 'sulf' },
      { sym: 'P', name: 'phosphorus', stem: 'phosph' },
      { sym: 'Cl', name: 'chlorine', stem: 'chlor' },
      { sym: 'O', name: 'oxygen', stem: 'ox' },
      { sym: 'C', name: 'carbon', stem: 'carb' },
      { sym: 'Br', name: 'bromine', stem: 'brom' },
    ];
    const e1 = h.pick(ELS);
    const e2 = h.pick(ELS.filter((x) => x.sym !== e1.sym));
    // n1 != n2 keeps the "swapped the subscripts" distractor from ever equalling the answer.
    const n1 = h.int(1, 4);
    const n2 = h.pick([1, 2, 3, 4, 5].filter((x) => x !== n1));

    const firstWord = n1 === 1 ? e1.name : PREFIX[n1 - 1] + e1.name;
    const secondWord = PREFIX[n2 - 1] + e2.stem + 'ide';
    const correct = `${e1.sym}${sub(n1)}${e2.sym}${sub(n2)}`;

    return {
      stem: `Write the formula for the following compound: ${firstWord} ${secondWord}`,
      ...h.choices(
        correct,
        [
          { value: `${e1.sym}${sub(n2)}${e2.sym}${sub(n1)}`, error: 'subscripts-swapped', why: 'attached each prefix to the wrong element' },
          { value: `${e2.sym}${sub(n2)}${e1.sym}${sub(n1)}`, error: 'elements-reversed', why: 'wrote the elements in the wrong order — the formula follows the name, first element first' },
          { value: `${e1.sym}${e2.sym}`, error: 'prefixes-ignored', why: 'ignored the Greek prefixes, which in a covalent name ARE the subscripts' },
          { value: `${e1.sym}${sub(n2)}${e2.sym}${sub(n2)}`, error: 'one-prefix-reused', why: 'used the second prefix for both elements' },
        ],
      ),
      explanation: `In a covalent name every Greek prefix is literally the subscript: ${firstWord} → ${e1.sym}${sub(n1) || ' (1)'}, ${secondWord} → ${e2.sym}${sub(n2) || ' (1)'}. So the formula is ${correct}. ${n1 === 1 ? 'No prefix on the first element means one atom — "mono-" is dropped there and only there.' : 'Note that the prefix on the FIRST element is never dropped once it is above one.'} Unlike ionic naming there is nothing to balance: the name states the count outright.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q24 and Q25. Naming with the Stock (Roman-numeral) system, where the numeral has to be
// DERIVED from the anion rather than read off the formula. The bank's existing ionic-naming
// template works from a fixed four-compound list and never makes you do that derivation.
// ---------------------------------------------------------------------------
// `charges` is the list of oxidation states this metal ACTUALLY forms. Drawing the charge
// freely from 1-4 instead produced copper(IV) and vanadium(I) — arithmetically fine, chemically
// nonsense, and exactly the "physically absurd but internally consistent" failure the
// word-problem rules in theknowledgebase/CLAUDE.md warn about. Osmium keeps its high states
// because OsO₂/OsO₄ are the reason the instructor picked it.
const VARIABLE_METALS = [
  { sym: 'Os', name: 'osmium', charges: [3, 4] },
  { sym: 'Co', name: 'cobalt', charges: [2, 3] },
  { sym: 'Fe', name: 'iron', charges: [2, 3] },
  { sym: 'Cu', name: 'copper', charges: [1, 2] },
  { sym: 'Mn', name: 'manganese', charges: [2, 3, 4] },
  { sym: 'Cr', name: 'chromium', charges: [2, 3] },
  { sym: 'Pb', name: 'lead', charges: [2, 4] },
  { sym: 'Sn', name: 'tin', charges: [2, 4] },
  { sym: 'Mo', name: 'molybdenum', charges: [2, 3, 4] },
  { sym: 'Ni', name: 'nickel', charges: [2, 3] },
  { sym: 'V', name: 'vanadium', charges: [2, 3, 4] },
  { sym: 'Ti', name: 'titanium', charges: [3, 4] },
];

const gcd = (x, y) => { while (y) { [x, y] = [y, x % y]; } return x; };

/** Crossed-over subscripts, ALWAYS reduced — an ionic formula is by definition in lowest terms. */
const crossed = (charge, z) => {
  const g = gcd(charge, z);
  return { m: z / g, a: charge / g, g };
};
const ANIONS = [
  { f: 'O', name: 'oxide', z: 2, poly: false, wrong: 'oxate' },
  { f: 'S', name: 'sulfide', z: 2, poly: false, wrong: 'sulfate' },
  { f: 'Cl', name: 'chloride', z: 1, poly: false, wrong: 'chlorate' },
  { f: 'Br', name: 'bromide', z: 1, poly: false, wrong: 'bromate' },
  { f: 'N', name: 'nitride', z: 3, poly: false, wrong: 'nitrate' },
  { f: 'CO₃', name: 'carbonate', z: 2, poly: true, wrong: 'carbide' },
  { f: 'SO₄', name: 'sulfate', z: 2, poly: true, wrong: 'sulfide' },
  { f: 'SO₃', name: 'sulfite', z: 2, poly: true, wrong: 'sulfate' },
  { f: 'PO₄', name: 'phosphate', z: 3, poly: true, wrong: 'phosphide' },
  { f: 'NO₃', name: 'nitrate', z: 1, poly: true, wrong: 'nitride' },
  { f: 'OH', name: 'hydroxide', z: 1, poly: true, wrong: 'oxide' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Render M_m(A)_a, bracketing a polyatomic anion only when its count is above one. */
const ionicFormula = (metal, anion, m, a) =>
  `${metal.sym}${sub(m)}${anion.poly && a > 1 ? `(${anion.f})${sub(a)}` : `${anion.f}${sub(a)}`}`;

registerChemTemplate({
  id: 'chem1-rev1-00-stock-name-from-formula',
  chapterId: CH,
  section: '2-7',
  band: 2,
  mental: true,
  name: 'Naming an ionic compound with the Stock (Roman numeral) system',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const anion = h.pick(ANIONS);
    const metal = h.pick(VARIABLE_METALS);
    const charge = h.pick(metal.charges);
    const { m, a } = crossed(charge, anion.z);

    const formula = ionicFormula(metal, anion, m, a);
    const correct = `${metal.name}(${ROMAN[charge]}) ${anion.name}`;

    // The teaching distractor is "read a subscript off the formula and call it the charge". For a
    // SINGLY-charged anion the anion subscript always equals the metal's charge, so that reading
    // is accidentally right and the distractor would be the answer. h.choices drops a distractor
    // equal to the correct value rather than shipping two right answers, so both subscripts are
    // offered and whichever is genuinely wrong survives — five entries here, three needed. An
    // earlier version excluded such draws instead, which silently made chloride, bromide,
    // nitrate and hydroxide unaskable and returned null for them.
    return {
      stem: `Name the following ionic compound using the Stock system (the Roman numeral system): ${formula}`,
      ...h.choices(
        correct,
        [
          { value: `${metal.name}(${ROMAN[a]}) ${anion.name}`, error: 'subscript-read-as-charge', why: 'read a subscript straight off the formula as the metal’s charge — the numeral is the charge, and it has to be worked out from the anion' },
          { value: `${metal.name}(${ROMAN[m]}) ${anion.name}`, error: 'subscript-read-as-charge', why: 'used the metal’s own subscript as its charge — the subscript counts ions, the numeral is the charge on ONE of them' },
          { value: `${metal.name} ${anion.name}`, error: 'numeral-omitted', why: `left the Roman numeral out, but ${metal.name} can take more than one charge, so the name is ambiguous without it` },
          { value: `${metal.name}(${ROMAN[charge]}) ${anion.wrong}`, error: 'wrong-anion-name', why: 'used the wrong name (and so the wrong charge) for the anion' },
          { value: `${metal.name}(${ROMAN[charge + 1]}) ${anion.name}`, error: 'charge-off-by-one', why: 'was off by one on the metal’s charge' },
        ],
      ),
      explanation: `The compound is neutral, so start from the anion, whose charge is fixed: ${a} × ${anion.name} at ${anion.z}− is ${a * anion.z}− of negative charge. That must be cancelled by ${m} ${metal.sym} ion${m > 1 ? 's' : ''}, so each ${metal.sym} carries ${a * anion.z} ÷ ${m} = ${charge}+. The name is ${correct}. The Roman numeral is the CHARGE ON ONE METAL ION, which is not in general the same as any subscript you can see.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Q22, the reverse: molybdenum(II) sulfate -> MoSO4. Note this is exactly the case where the
// charges are equal and the crossed subscripts reduce to 1:1, which is where most people write
// Mo2(SO4)2.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-rev1-00-stock-formula-from-name',
  chapterId: CH,
  section: '2-7',
  band: 2,
  mental: true,
  name: 'Formula from a Stock (Roman numeral) name',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const metal = h.pick(VARIABLE_METALS);
    const anion = h.pick(ANIONS);
    const charge = h.pick(metal.charges);
    const z = anion.z;
    const { m, a, g } = crossed(charge, z);

    const correct = ionicFormula(metal, anion, m, a);
    const name = `${metal.name}(${ROMAN[charge]}) ${anion.name}`;

    // Ordered by teaching value, and deliberately over-supplied: h.choices keeps the first three
    // DISTINCT ones, and several of these coincide when charge == z (the MoSO4 case) or when a
    // count is 1. The explanation names only the first, which is guaranteed to survive.
    const pool = [
      { value: ionicFormula(metal, anion, z, charge), error: 'not-reduced', why: 'crossed the charges over but never reduced the subscripts to their simplest whole-number ratio' },
      { value: ionicFormula(metal, anion, charge, z), error: 'charges-not-crossed', why: 'gave each ion its own charge as its subscript instead of crossing them over' },
      { value: ionicFormula(metal, anion, a, m), error: 'subscripts-swapped', why: 'put each subscript on the wrong ion' },
      { value: `${metal.sym}${charge > 1 ? SUPS[charge] : ''}⁺ ${anion.poly ? `(${anion.f})` : anion.f}${z > 1 ? SUPS[z] : ''}⁻`, error: 'charges-left-in', why: 'left the charges showing — a finished formula is neutral and carries no charges' },
      { value: ionicFormula(metal, anion, m + 1, a), error: 'count-off-by-one', why: 'was off by one on the metal count' },
      { value: ionicFormula(metal, anion, m, a + 1), error: 'count-off-by-one', why: 'was off by one on the anion count' },
    ];

    return {
      stem: `Write the formula for the following: ${name}`,
      ...h.choices(correct, pool),
      explanation: `${metal.name}(${ROMAN[charge]}) means the ${metal.sym} ion carries ${charge}+, and ${anion.name} is ${anion.poly ? `(${anion.f})` : anion.f}${z > 1 ? `${z}−` : '−'}. Cross the charges over — ${charge} becomes the anion's subscript, ${z} becomes the metal's — giving ${ionicFormula(metal, anion, z, charge)}. ${g > 1 ? `Then REDUCE to the simplest whole-number ratio (both subscripts divide by ${g}), which gives ${correct}; stopping before the reduction is the usual way to lose this one.` : `That is already in lowest terms, so ${correct} is the answer.`} A subscript of 1 is never written.`,
    };
  },
});
