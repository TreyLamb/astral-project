// Toolbox: Foundational Concepts. Original questions, informed by (never copied from) the ACS
// study guide's own "Specific topics covered" list for this chapter — see courses/PLAN.md's
// 2026-08-28 entry for the source and courses/chem/PLAN.md for the doctrine this follows.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-00-toolbox';

registerChemTemplate({
  id: 'chem1-toolbox-unit-prefix',
  chapterId: CH,
  section: '1-5',
  band: 1,
  name: 'Metric prefix conversion',
  concepts: ['unit-conversions'],
  generate: (rng, h) => {
    const PREFIXES = [
      { name: 'kilo', symbol: 'k', exp: 3 },
      { name: 'centi', symbol: 'c', exp: -2 },
      { name: 'milli', symbol: 'm', exp: -3 },
      { name: 'micro', symbol: 'µ', exp: -6 },
    ];
    const from = h.pick(PREFIXES);
    let to = h.pick(PREFIXES);
    while (to.name === from.name) to = h.pick(PREFIXES);
    const value = h.int(2, 9);
    // value * 10^from.exp base units = answer * 10^to.exp base units
    const diff = from.exp - to.exp;
    const answer = value * Math.pow(10, diff);
    const fmt = (n) => (Math.abs(n) >= 1000 || (Math.abs(n) < 0.001 && n !== 0)) ? n.toExponential(2) : String(n);
    return {
      stem: `${value} ${from.name}grams (${from.symbol}g) equals how many ${to.name}grams (${to.symbol}g)?`,
      ...h.choices(
        { value: fmt(answer) },
        [
          { value: fmt(value * Math.pow(10, -diff)), error: 'inverted-conversion', why: 'inverted the direction of the conversion' },
          { value: fmt(value * Math.pow(10, from.exp - to.exp) / 10), error: 'off-by-one-power', why: 'was off by one power of ten' },
          { value: fmt(value), error: 'no-conversion', why: 'did not convert at all' },
          { value: fmt(value * Math.pow(10, to.exp - from.exp) * -1), error: 'sign-error', why: 'flipped the sign of the exponent difference' },
        ],
      ),
      explanation: `Convert through base units: ${value} ${from.symbol}g × 10^${from.exp} g/${from.symbol}g ÷ 10^${to.exp} g/${to.symbol}g = ${fmt(answer)} ${to.symbol}g.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-sig-figs-mult',
  chapterId: CH,
  section: '1-6',
  band: 1,
  name: 'Significant figures in multiplication',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    // `display` is a STRING, not derived from the numeric `value` — a JS number silently drops
    // trailing zeros (12.0 -> "12", 7.50 -> "7.5"), which would show a displayed value with
    // fewer digits than the sig-fig count it's labelled with. Keep them independent.
    const pairs = [
      [{ display: '2.5', value: 2.5, sf: 2 }, { display: '4.10', value: 4.10, sf: 3 }],
      [{ display: '3.2', value: 3.2, sf: 2 }, { display: '1.005', value: 1.005, sf: 4 }],
      [{ display: '12.0', value: 12.0, sf: 3 }, { display: '0.5', value: 0.5, sf: 1 }],
      [{ display: '7.50', value: 7.50, sf: 3 }, { display: '2.0', value: 2.0, sf: 2 }],
    ];
    const [a, b] = h.pick(pairs);
    const product = +(a.value * b.value).toFixed(6);
    const correctSF = Math.min(a.sf, b.sf);
    return {
      stem: `You multiply a measurement of ${a.display} (${a.sf} sig figs) by a measurement of ${b.display} (${b.sf} sig figs). The raw product is ${product}. How many significant figures should the reported answer have?`,
      ...h.choices(
        String(correctSF),
        [
          { value: String(a.sf + b.sf), error: 'summed-sig-figs', why: 'added the two sig-fig counts instead of taking the smaller one' },
          { value: String(Math.max(a.sf, b.sf)), error: 'took-larger', why: 'used the larger sig-fig count instead of the smaller one' },
          { value: String(correctSF + 1), error: 'off-by-one', why: 'was off by one significant figure' },
        ],
      ),
      explanation: `Multiplication/division answers keep as many sig figs as the LEAST precise input: min(${a.sf}, ${b.sf}) = ${correctSF}.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-sci-notation',
  chapterId: CH,
  section: '1-5',
  band: 1,
  name: 'Scientific notation conversion',
  concepts: ['scientific-notation'],
  generate: (rng, h) => {
    const mantissa = +(1 + h.int(1, 89) / 10).toFixed(1);
    const exp = h.int(-6, 6) || 3;
    const decimal = mantissa * Math.pow(10, exp);
    const decimalStr = Math.abs(exp) > 4 ? decimal.toExponential(2) : decimal.toPrecision(2 + Math.max(0, Math.abs(exp)));
    return {
      stem: `Write ${mantissa} × 10^${exp} in decimal form.`,
      ...h.choices(
        { value: Number(decimal.toPrecision(6)).toString() },
        [
          { value: Number((mantissa * Math.pow(10, -exp)).toPrecision(6)).toString(), error: 'sign-error', why: 'flipped the sign of the exponent' },
          { value: Number((mantissa * Math.pow(10, exp - 1)).toPrecision(6)).toString(), error: 'off-by-one-power', why: 'was off by one power of ten' },
          { value: Number((mantissa * Math.pow(10, exp + 1)).toPrecision(6)).toString(), error: 'off-by-one-power', why: 'was off by one power of ten' },
        ],
      ),
      explanation: `Move the decimal point ${Math.abs(exp)} places ${exp >= 0 ? 'right' : 'left'} (sign of the exponent tells you the direction).`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-nomenclature-ionic',
  chapterId: CH,
  section: '2-7',
  band: 2,
  name: 'Naming an ionic compound',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const COMPOUNDS = [
      { formula: 'FeCl₃', correct: 'iron(III) chloride', wrongCharge: 'iron(II) chloride', noSuffix: 'iron trichloride' },
      { formula: 'CuO', correct: 'copper(II) oxide', wrongCharge: 'copper(I) oxide', noSuffix: 'copper monoxide' },
      { formula: 'K₂SO₄', correct: 'potassium sulfate', wrongCharge: 'potassium(I) sulfate', noSuffix: 'potassium sulfide' },
      { formula: 'Mg(NO₃)₂', correct: 'magnesium nitrate', wrongCharge: 'magnesium(II) nitrate', noSuffix: 'magnesium nitride' },
    ];
    const c = h.pick(COMPOUNDS);
    return {
      stem: `What is the correct name for the ionic compound ${c.formula}?`,
      ...h.choices(
        c.correct,
        [
          { value: c.wrongCharge, error: 'unneeded-roman-numeral', why: 'added a Roman numeral to a metal whose charge does not need to be shown, or used the wrong charge' },
          { value: c.noSuffix, error: 'wrong-anion-suffix', why: 'used the wrong suffix or name for the anion' },
          { value: c.formula.toLowerCase() + ' compound', error: 'not-a-name', why: 'did not actually name the compound' },
        ],
      ),
      explanation: `Ionic naming: cation name first, then the anion (polyatomic ions keep their own name; monatomic anions take an -ide suffix). Only give the metal a Roman-numeral charge when it can have more than one.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-nomenclature-covalent',
  chapterId: CH,
  section: '2-7',
  band: 2,
  name: 'Naming a covalent compound',
  concepts: ['nomenclature-ionic-covalent'],
  generate: (rng, h) => {
    const PREFIX = ['mono', 'di', 'tri', 'tetra', 'penta'];
    const els = ['N', 'S', 'P', 'Cl'];
    const el1 = h.pick(els);
    let el2 = h.pick(els);
    while (el2 === el1) el2 = h.pick(els);
    const n2 = h.int(2, 4);
    const n1 = h.int(0, 1); // 0 => no prefix on first element
    const names = { N: 'nitrogen', S: 'sulfur', P: 'phosphorus', Cl: 'chlorine', O: 'oxide' };
    const stemPrefix = names[el2] === 'oxide' ? 'ox' : names[el2].replace(/(ine|ur|us)$/, '').toLowerCase();
    const el2Name = PREFIX[n2 - 1] + (el2 === 'O' ? 'oxide' : `${stemPrefix}ide`);
    const el1Name = n1 === 0 ? names[el1] : PREFIX[n1] + names[el1];
    const correct = `${el1Name} ${el2Name}`;
    return {
      stem: `Name the covalent compound ${el1}${n1 > 1 ? n1 : ''}${el2}${n2}, using Greek numerical prefixes.`,
      ...h.choices(
        correct,
        [
          { value: `${PREFIX[0]}${names[el1]} ${el2Name}`, error: 'unneeded-mono-prefix', why: 'added "mono-" to the first element, which only ever names a second element' },
          { value: `${el1Name} ${el2Name.replace(PREFIX[n2 - 1], PREFIX[n2 - 2] ?? 'mono')}`, error: 'wrong-atom-count', why: 'used the wrong prefix for the number of atoms shown' },
          { value: `${names[el1]}(${n1 || 1}) ${names[el2]}`, error: 'used-ionic-naming', why: 'used ionic (charge-based) naming instead of covalent (prefix-based) naming' },
        ],
      ),
      explanation: `Covalent naming uses Greek prefixes (mono-, di-, tri-...) to state exactly how many atoms of each element are present. "Mono-" is only used on the SECOND element, never the first.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-density',
  chapterId: CH,
  section: '1-7',
  band: 1,
  name: 'Density calculation',
  concepts: ['density'],
  generate: (rng, h) => {
    const mass = h.int(10, 200);
    const volume = h.int(2, 20);
    const density = +(mass / volume).toFixed(2);
    return {
      stem: `A sample has a mass of ${mass} g and a volume of ${volume} mL. What is its density?`,
      ...h.choices(
        { value: `${density} g/mL` },
        [
          { value: `${+(volume / mass).toFixed(2)} g/mL`, error: 'inverted-ratio', why: 'divided volume by mass instead of mass by volume' },
          { value: `${mass * volume} g/mL`, error: 'multiplied-instead', why: 'multiplied mass and volume instead of dividing' },
          { value: `${+(density * 10).toFixed(2)} g/mL`, error: 'decimal-error', why: 'made a decimal-place error in the division' },
        ],
      ),
      explanation: `density = mass / volume = ${mass} g / ${volume} mL = ${density} g/mL.`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-classify-matter',
  chapterId: CH,
  section: '1-3',
  band: 2,
  name: 'Classifying matter',
  concepts: ['classification-of-matter'],
  generate: (rng, h) => {
    const ITEMS = [
      { desc: 'a bar of pure copper', correct: 'element' },
      { desc: 'table salt (NaCl)', correct: 'compound' },
      { desc: 'a solution of salt fully dissolved in water', correct: 'homogeneous mixture' },
      { desc: 'a glass of water with visible sand settled at the bottom', correct: 'heterogeneous mixture' },
      { desc: 'oxygen gas, O₂', correct: 'element' },
      { desc: 'carbon dioxide, CO₂', correct: 'compound' },
    ];
    const item = h.pick(ITEMS);
    const ALL = ['element', 'compound', 'homogeneous mixture', 'heterogeneous mixture'];
    const distractors = ALL.filter((a) => a !== item.correct);
    return {
      stem: `How is ${item.desc} classified?`,
      ...h.choices(item.correct, distractors.map((v) => ({ value: v, error: 'misclassified-matter', why: `classified it as a ${v} instead` }))),
      explanation: `An element can't be broken down chemically; a compound is two+ elements chemically bonded in a fixed ratio; a mixture is physically combined and separable, uniform (homogeneous) or not (heterogeneous).`,
    };
  },
});

registerChemTemplate({
  id: 'chem1-toolbox-physical-vs-chemical',
  chapterId: CH,
  section: '1-4',
  band: 1,
  name: 'Physical vs. chemical property',
  concepts: ['properties-representations-of-matter'],
  generate: (rng, h) => {
    const ITEMS = [
      { desc: 'the melting point of ice', correct: 'physical' },
      { desc: 'the color of a solution', correct: 'physical' },
      { desc: 'the flammability of gasoline', correct: 'chemical' },
      { desc: 'iron rusting in damp air', correct: 'chemical' },
      { desc: 'the density of a metal', correct: 'physical' },
      { desc: 'the reactivity of an acid with a metal', correct: 'chemical' },
    ];
    const item = h.pick(ITEMS);
    const other = item.correct === 'physical' ? 'chemical' : 'physical';
    return {
      stem: `Is ${item.desc} a physical property or a chemical property?`,
      ...h.choices(
        `${item.correct} property`,
        [{ value: `${other} property`, error: 'physical-chemical-confused', why: `called it a ${other} property instead` }],
      ),
      explanation: `A physical property is observed without the substance becoming something new; a chemical property describes how it reacts to form a different substance.`,
    };
  },
});
