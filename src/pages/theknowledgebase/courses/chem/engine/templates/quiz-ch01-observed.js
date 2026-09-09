// Built from Trey's OWN GRADED QUIZZES — Canvas attempt-review exports of Quiz 2 (Sec 1-4 to
// 1-5), Quiz 3 (Sec 1-6) and Quiz 4 (Sec 1-7), in `SupplementalCourseDocs/CHEM 1210/`.
// All six PDFs are Exam 1 material. This is the highest-fidelity source in the whole project:
// the instructor's actual wording, his actual distractors, and the answer he marked correct.
//
// ⚠️ HOW TO READ THOSE PDFs (2026-09-09 — a wrong call cost a round-trip)
// They have NO text layer, so `extractBook.mjs` returns blank pages, AND pages 1-2 are only the
// Canvas quiz header plus an empty `<iframe>` shell onto learn-ai-DanielScott26.replit.app.
// The graded attempt review — every question, every option, the marked answer and the
// per-distractor feedback — starts on PAGE 3. Render them as images and read from page 3:
//     node <scratch>/shotpdf.mjs "<pdf>" <out> 1 8      (PDFParse getScreenshot, scale 2-3)
// Judging the file from its text layer, or from pages 1-2, says "empty". It is not.
//
// EVERY TEMPLATE BELOW CLOSES A GAP A REAL QUIZ QUESTION EXPOSED:
//
//   Q2 #3 Q3   extensive vs intensive property        -> extensive-vs-intensive  ← he MISSED this
//   Q2 #2 Q8   "SI base unit for measuring time?"     -> si-base-unit
//   Q4    Q5   "SI prefix for a factor of 10^-2?"     -> si-prefix-factor
//   Q4    Q6   "'micro-' means 10^6 — correct them"   -> si-prefix-factor
//   Q2 #3 Q10  4.50 x 10^-3 s -> express with a prefix -> sci-notation-to-prefix
//   Q2 #3 Q9   mass 203 g of silver -> volume displaced -> volume-displacement
//   Q2 #3 Q11  volume 203 mL -> volume displaced         -> volume-displacement
//   Q2 #2 Q15  homogeneous mixture vs pure substance     -> mixture-vs-pure-substance
//
// The existing `chem1-toolbox-unit-prefix` converts a VALUE between prefixes and never asks what
// a prefix MEANS, which is the form his quizzes actually use twice.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-00-toolbox';

// ---------------------------------------------------------------------------
// Quiz 2 attempt 3, Q3 — the one question in the whole set he got wrong.
// "Which of the following is an example of an extensive property?" Temperature / Mass /
// Density / Color. He answered Color.
//
// The test is whether the property changes when you take MORE of the same stuff.
// ---------------------------------------------------------------------------
const EXTENSIVE = [
  { p: 'mass', why: 'twice as much material has twice the mass' },
  { p: 'volume', why: 'twice as much material takes up twice the space' },
  { p: 'length', why: 'a longer piece of the same wire measures longer' },
  { p: 'total energy content', why: 'twice as much fuel stores twice the energy' },
  { p: 'the number of moles present', why: 'a bigger sample contains more particles' },
  { p: 'total heat capacity of a sample', why: 'a bigger sample takes more heat to warm by 1 °C' },
];
const INTENSIVE = [
  { p: 'temperature', why: 'a cup of boiling water and a potful are both at 100 °C' },
  { p: 'density', why: 'a gold nugget and a gold bar have the same density' },
  { p: 'color', why: 'a drop and a bucket of the same solution are the same color' },
  { p: 'melting point', why: 'ice melts at 0 °C whether it is a cube or a glacier' },
  { p: 'boiling point', why: 'water boils at 100 °C regardless of how much is in the pan' },
  { p: 'concentration', why: 'pouring off half a solution does not change its molarity' },
  { p: 'hardness', why: 'a diamond chip is exactly as hard as a large diamond' },
  { p: 'specific heat', why: 'it is defined per gram, so sample size is already divided out' },
];

registerChemTemplate({
  id: 'chem1-qz-01-extensive-vs-intensive',
  chapterId: CH,
  section: '1-4',
  band: 2,
  mental: true,
  name: 'Extensive vs. intensive properties',
  concepts: ['properties-representations-of-matter'],
  generate: (rng, h) => {
    const askExtensive = rng() < 0.5;
    const pool = askExtensive ? EXTENSIVE : INTENSIVE;
    const other = askExtensive ? INTENSIVE : EXTENSIVE;

    const answer = h.pick(pool);
    const wrong = [];
    const seen = new Set();
    while (wrong.length < 3) {
      const w = h.pick(other);
      if (seen.has(w.p)) continue;
      seen.add(w.p);
      wrong.push(w);
    }

    return {
      stem: `Which of the following is an example of an ${askExtensive ? 'EXTENSIVE' : 'INTENSIVE'} property?`,
      ...h.choices(
        answer.p,
        wrong.map((w) => ({
          value: w.p,
          error: askExtensive ? 'intensive-called-extensive' : 'extensive-called-intensive',
          why: `${w.p} is ${askExtensive ? 'INTENSIVE' : 'EXTENSIVE'} — ${w.why}`,
        })),
      ),
      explanation: `${answer.p} is ${askExtensive ? 'extensive' : 'intensive'}: ${answer.why}. The one question that settles it every time is "if I take TWICE AS MUCH of the same substance, does this change?" If yes it is EXTENSIVE (it depends on how much you have — mass, volume, length, moles). If no it is INTENSIVE (it is a property of the substance itself — temperature, density, color, melting point). Note that density is intensive even though mass and volume are both extensive: dividing one by the other cancels the sample size out.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Quiz 2 attempt 2, Q8 — "What is the SI base unit for measuring time?" with Millisecond /
// Minute / Second / Hour. Nothing in the bank knew the SI base units by name.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-qz-01-si-base-unit',
  chapterId: CH,
  section: '1-5',
  band: 1,
  mental: true,
  name: 'SI base units',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const UNITS = [
      { q: 'time', unit: 'second', sym: 's', wrong: ['minute', 'hour', 'millisecond'] },
      { q: 'length', unit: 'meter', sym: 'm', wrong: ['centimeter', 'kilometer', 'inch'] },
      { q: 'mass', unit: 'kilogram', sym: 'kg', wrong: ['gram', 'pound', 'milligram'] },
      { q: 'temperature', unit: 'kelvin', sym: 'K', wrong: ['degree Celsius', 'degree Fahrenheit', 'calorie'] },
      { q: 'amount of substance', unit: 'mole', sym: 'mol', wrong: ['gram', 'molecule', 'liter'] },
      { q: 'electric current', unit: 'ampere', sym: 'A', wrong: ['volt', 'watt', 'coulomb'] },
    ];
    const u = h.pick(UNITS);
    const massNote = u.q === 'mass'
      ? ' Mass is the odd one out: the kilogram is the only base unit whose name already carries a prefix, so the "base" unit is the kilogram, not the gram.'
      : '';
    return {
      stem: `What is the SI base unit for measuring ${u.q}?`,
      ...h.choices(
        u.unit,
        u.wrong.map((w) => ({
          value: w,
          error: 'not-the-base-unit',
          why: `${w} measures ${u.q}, but it is not the SI BASE unit — it is either a prefixed version of it or a non-SI unit`,
        })),
      ),
      explanation: `The SI base unit of ${u.q} is the ${u.unit} (${u.sym}).${massNote} A base unit is one of the seven the whole system is defined from; anything with a prefix on it (millisecond, centimeter) is a DERIVED convenience, not a base unit.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Quiz 4, Q5 ("SI prefix for a factor of 10^-2?") and Q6 ("a student says 'micro-' means 10^6 —
// correct them"). Both ask what a prefix MEANS. `chem1-toolbox-unit-prefix` only ever converts
// a value from one prefix to another and never asks this, which is why it did not cover them.
// ---------------------------------------------------------------------------
const PREFIXES = [
  { name: 'giga', sym: 'G', exp: 9 },
  { name: 'mega', sym: 'M', exp: 6 },
  { name: 'kilo', sym: 'k', exp: 3 },
  { name: 'deci', sym: 'd', exp: -1 },
  { name: 'centi', sym: 'c', exp: -2 },
  { name: 'milli', sym: 'm', exp: -3 },
  { name: 'micro', sym: 'µ', exp: -6 },
  { name: 'nano', sym: 'n', exp: -9 },
  { name: 'pico', sym: 'p', exp: -12 },
];
const p10 = (e) => `10${e < 0 ? '⁻' : ''}${String(Math.abs(e)).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]).join('')}`;

registerChemTemplate({
  id: 'chem1-qz-01-si-prefix-factor',
  chapterId: CH,
  section: '1-5',
  band: 1,
  mental: true,
  name: 'What an SI prefix means',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const p = h.pick(PREFIXES);
    const others = PREFIXES.filter((x) => x.name !== p.name);
    const askForPrefix = rng() < 0.5;

    if (askForPrefix) {
      // Quiz 4 Q5's exact form: given the factor, name the prefix.
      const wrong = [];
      const seen = new Set();
      // Nearest neighbours first — "off by one prefix step" is the mistake worth showing.
      const byNearness = others.slice().sort((a, b) => Math.abs(a.exp - p.exp) - Math.abs(b.exp - p.exp));
      for (const w of byNearness) {
        if (seen.has(w.name)) continue;
        seen.add(w.name);
        wrong.push({ value: `${w.name}- (${w.sym})`, error: 'wrong-prefix', why: `${w.name}- is ${p10(w.exp)}, not ${p10(p.exp)}` });
        if (wrong.length >= 4) break;
      }
      return {
        stem: `What is the SI prefix (and its symbol) for a factor of ${p10(p.exp)}?`,
        ...h.choices(`${p.name}- (${p.sym})`, wrong),
        explanation: `${p.name}- (${p.sym}) means ${p10(p.exp)}. Worth committing to memory as a ladder rather than one at a time: kilo 10³, deci 10⁻¹, centi 10⁻², milli 10⁻³, micro 10⁻⁶, nano 10⁻⁹. Everything below the base unit is negative, and after milli they step down by THREE at a time.`,
      };
    }

    // Quiz 4 Q6's form: a stated wrong meaning, and you supply the correction.
    const claimed = h.pick(others.filter((x) => x.exp !== p.exp));
    // The "next prefix along" comes from the real ladder, not from arithmetic on the exponent:
    // p.exp - 3 is not a prefix for centi- (10^-5 has no name), and an invented one is not a
    // mistake anybody makes. Nearest real neighbour that is not the one the student named.
    const neighbour = others
      .filter((x) => x.exp !== claimed.exp && x.exp !== -p.exp)
      .sort((a, b) => Math.abs(a.exp - p.exp) - Math.abs(b.exp - p.exp))[0];
    const wrong = [
      { value: `The student is right; '${p.name}-' does mean ${p10(claimed.exp)}.`, error: 'accepted-the-error', why: `accepted the student's value — ${p10(claimed.exp)} is ${claimed.name}-, not ${p.name}-` },
      { value: `'${p.name}-' means ${p10(-p.exp)}.`, error: 'sign-flipped', why: 'flipped the sign of the exponent — that turns a unit smaller than the base into a larger one, or the reverse' },
      { value: `'${p.name}-' means ${p10(neighbour.exp)}.`, error: 'off-by-one-prefix-step', why: `${p10(neighbour.exp)} is ${neighbour.name}- — one step along the ladder from the right answer` },
    ];
    return {
      stem: `A student says that '${p.name}-' means ${p10(claimed.exp)}. How would you correct them?`,
      ...h.choices(`'${p.name}-' means ${p10(p.exp)}.`, wrong),
      explanation: `${p.name}- (${p.sym}) is ${p10(p.exp)}; ${p10(claimed.exp)} is ${claimed.name}- (${claimed.sym}). Sign is the half people drop: a prefix with a NEGATIVE exponent makes the unit SMALLER than the base (a millimetre is a thousandth of a metre), and a positive one makes it larger.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Quiz 2 attempt 3, Q10 — "A time interval is reported as 4.50 × 10⁻³ s. Express this using an
// SI prefix." This is the join between the two skills, and neither existing template did it.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-qz-01-sci-notation-to-prefix',
  chapterId: CH,
  section: '1-5',
  band: 2,
  mental: true,
  name: 'Rewriting a scientific-notation value with an SI prefix',
  concepts: ['scientific-notation', 'unit-conversions'],
  generate: (rng, h) => {
    const BASES = [
      { q: 'A time interval', unit: 'second', sym: 's' },
      { q: 'A length', unit: 'meter', sym: 'm' },
      { q: 'A mass', unit: 'gram', sym: 'g' },
      { q: 'A volume', unit: 'liter', sym: 'L' },
    ];
    const b = h.pick(BASES);
    // Only the prefixes whose exponent a coefficient of 1-9.99 lands on exactly.
    const p = h.pick(PREFIXES.filter((x) => [3, -1, -2, -3, -6, -9].includes(x.exp)));
    const coeff = `${h.int(1, 9)}.${h.int(0, 9)}${h.int(0, 9)}`;
    const others = PREFIXES.filter((x) => x.name !== p.name)
      .sort((a, c) => Math.abs(a.exp - p.exp) - Math.abs(c.exp - p.exp));

    return {
      stem: `${b.q} is reported as ${coeff} × ${p10(p.exp)} ${b.sym}. Express this using an SI prefix.`,
      ...h.choices(
        `${coeff} ${p.name}${b.unit}s`,
        others.slice(0, 4).map((w) => ({
          value: `${coeff} ${w.name}${b.unit}s`,
          error: 'wrong-prefix',
          why: `${w.name}- is ${p10(w.exp)}; you need the prefix that IS ${p10(p.exp)}`,
        })),
      ),
      explanation: `${p.name}- means ${p10(p.exp)}, so ${coeff} × ${p10(p.exp)} ${b.sym} is exactly ${coeff} ${p.name}${b.unit}s (${coeff} ${p.sym}${b.sym}). The coefficient never changes — you are renaming the power of ten, not converting it, so if the digits move you have made an error.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Quiz 2 attempt 3, Q9 and Q11 — the silver bar dipped in water. Q11 hands you the VOLUME
// (answer: the same number, it displaces its own volume) and Q9 hands you the MASS, so you have
// to go through density first. Asking both is the point: the second looks like the first.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-qz-01-volume-displacement',
  chapterId: CH,
  section: '1-7',
  band: 2,
  name: 'Volume displaced by a submerged object',
  concepts: ['density'],
  generate: (rng, h) => {
    const METALS = [
      { name: 'silver', d: 10.49 }, { name: 'aluminium', d: 2.70 }, { name: 'iron', d: 7.87 },
      { name: 'copper', d: 8.96 }, { name: 'lead', d: 11.34 }, { name: 'titanium', d: 4.51 },
    ];
    const m = h.pick(METALS);
    const n = h.int(120, 480);
    const fromMass = rng() < 0.5;
    const f = (x) => Number(Number(x).toPrecision(3));

    if (!fromMass) {
      // The direct one. Its whole content is that displacement equals the object's own volume.
      return {
        stem: `A bar of ${m.name} with a volume of ${n} mL is fully submerged in a vessel of water. How much water volume do you expect the bar to displace?`,
        ...h.choices(
          { value: `${n} mL` },
          [
            { value: `${f(n / m.d)} mL`, error: 'divided-by-density', why: 'divided by the density, but you were given the VOLUME already — there is nothing to convert' },
            { value: `${f(n * m.d)} mL`, error: 'multiplied-by-density', why: 'multiplied by the density, which turns a volume into a mass' },
            { value: `${f(n / 1000)} mL`, error: 'stray-conversion', why: 'converted units that were already correct' },
          ],
        ),
        explanation: `${n} mL. A fully submerged object pushes aside a volume of water exactly equal to ITS OWN VOLUME — that is what displacement means, and it is true whatever the object is made of. The density of ${m.name} is a distractor here: you were handed the volume, so there is no calculation to do.`,
      };
    }

    // The one that looks identical and is not: mass in, volume out, density is the bridge.
    const vol = n / m.d;
    return {
      stem: `A bar of ${m.name} with a mass of ${n} g is fully submerged in a vessel of water. ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} has a density of ${m.d} g/cm³. How much water volume do you expect the bar to displace?`,
      ...h.choices(
        { value: `${f(vol)} cm³` },
        [
          { value: `${n} cm³`, error: 'mass-read-as-volume', why: 'used the mass number as if it were a volume — grams and cm³ are only interchangeable for a substance whose density happens to be 1' },
          { value: `${f(n * m.d)} cm³`, error: 'multiplied-by-density', why: 'multiplied by the density instead of dividing; g × g/cm³ does not give cm³' },
          { value: `${f(m.d / n)} cm³`, error: 'inverted-ratio', why: 'divided the density by the mass rather than the mass by the density' },
        ],
      ),
      explanation: `A submerged object displaces its own VOLUME, so first turn the mass into a volume: ${n} g ÷ ${m.d} g/cm³ = ${f(vol)} cm³. Let the units decide the operation — g ÷ (g/cm³) leaves cm³, so you divide. Answering "${n} cm³" is the trap: it assumes a density of 1 g/cm³, which is water, not ${m.name}.`,
    };
  },
});

// ---------------------------------------------------------------------------
// Quiz 2 attempt 2, Q15 — "How does a homogeneous mixture differ from a pure substance?"
// The answer he needed is about COMPOSITION being variable vs fixed. `classify-matter` sorts
// examples into buckets; it never asks for the defining difference between two buckets.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-qz-01-mixture-vs-pure-substance',
  chapterId: CH,
  section: '1-3',
  band: 2,
  mental: true,
  name: 'What separates a mixture from a pure substance',
  concepts: ['classification-of-matter'],
  generate: (rng, h) => {
    const FORMS = [
      {
        ask: 'How does a homogeneous mixture differ from a pure substance?',
        right: 'A homogeneous mixture has a variable composition, while a pure substance has a fixed, constant composition.',
        wrong: [
          { value: 'Only pure substances can be separated into their components by physical means.', error: 'reversed-separability', why: 'it is the other way round — a MIXTURE separates physically, and a pure substance does not' },
          { value: 'Both have a fixed composition.', error: 'missed-the-difference', why: 'that is what makes them different, so it cannot be true of both' },
          { value: 'Homogeneous mixtures are elements; pure substances are compounds.', error: 'confused-the-categories', why: 'elements and compounds are the two kinds of PURE SUBSTANCE — neither is a mixture' },
        ],
        note: 'Saltwater can be 1% salt or 10% salt and is a homogeneous mixture either way. Pure water is always exactly 2 hydrogens per oxygen. Uniform appearance is NOT the test — a mixture can look perfectly uniform.',
      },
      {
        ask: 'Which statement correctly distinguishes a compound from a homogeneous mixture?',
        right: 'A compound has a fixed ratio of elements and is separated only by a chemical reaction; a homogeneous mixture has a variable ratio and separates physically.',
        wrong: [
          { value: 'A compound always looks uniform; a homogeneous mixture always looks non-uniform.', error: 'appearance-as-the-test', why: 'both look uniform — that is exactly why appearance cannot be the test' },
          { value: 'A compound can be separated by filtering; a homogeneous mixture cannot.', error: 'reversed-separability', why: 'filtering is a physical method, so if anything it separates the MIXTURE, and even then only a heterogeneous one' },
          { value: 'A compound contains only one element; a homogeneous mixture contains several.', error: 'confused-the-categories', why: 'a substance of only one element is an ELEMENT; a compound is two or more, chemically bonded' },
        ],
        note: 'Both are uniform throughout. The difference is whether the ratio is FIXED (compound, set by chemical bonding) or can be dialled up and down (mixture, just physically combined).',
      },
      {
        ask: 'What makes an element different from a compound?',
        right: 'An element contains only one kind of atom and cannot be broken down chemically; a compound contains two or more different elements bonded in a fixed ratio.',
        wrong: [
          { value: 'An element is always a single atom; a compound is always a molecule.', error: 'atoms-vs-molecules', why: 'an element can travel as a molecule — O₂, O₃ and S₈ are all still elements' },
          { value: 'An element has a variable composition; a compound has a fixed one.', error: 'variable-vs-fixed-misapplied', why: 'both are pure substances with fixed composition; variable composition is what makes something a MIXTURE' },
          { value: 'An element can be separated by physical means; a compound cannot.', error: 'reversed-separability', why: 'neither separates physically — both are pure substances' },
        ],
        note: 'The trap is O₂: two atoms bonded together, but both the SAME element, so it is an element and not a compound.',
      },
    ];
    const f = h.pick(FORMS);
    return {
      stem: f.ask,
      ...h.choices(f.right, f.wrong),
      explanation: `${f.right} ${f.note}`,
    };
  },
});
