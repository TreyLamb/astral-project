// Chapter 1 question styles (matter, measurement, units, significant figures, density) from his
// study guides. One style = one generator; see index.js for how a style becomes 3 questions.
//
// gen(h, p) returns { stem, right, wrong, explanation }. `p` is null for a sibling (random draw)
// or a parameter object that reproduces a real study-guide question (checked by the test).

import { sig, round } from './data.js';
import { sigFigsOf, addSub, roundToDp, render, roundToSigFigs } from '../engine/templates/_numeric.js';

export const rnd = (h, lo, hi, dp) => round(lo + h.rng() * (hi - lo), dp);
/** A random measured value with exactly `sf` significant figures, as display text (trailing zeros kept). */
export const measuredText = (h, lo, hi, sf) => {
  const x = lo + h.rng() * (hi - lo);
  return Number(x.toPrecision(sf)).toPrecision(sf);
};
/** Format x to n sig figs; scientific notation when a plain number would hide significance. */
// Half-up, like a chemist rounds: 34.65 / 3.3 is 10.4999... in floating point and must still print 11.
export const sf = (x, n) => Number(x * (1 + 1e-12)).toPrecision(n).replace(/e\+?/, 'e');
const sci = (x, n) => Number(x).toExponential(n - 1).replace(/e\+?/, 'e');

// ---------------------------------------------------------------------------------------------

const MATTER = [
  ['oxygen', 'an element'], ['silicon', 'an element'], ['iron', 'an element'], ['gold', 'an element'],
  ['mercury', 'an element'], ['helium', 'an element'], ['sulfur', 'an element'],
  ['carbon dioxide', 'a compound'], ['water', 'a compound'], ['table sugar (sucrose)', 'a compound'],
  ['table salt (sodium chloride)', 'a compound'], ['baking soda (sodium bicarbonate)', 'a compound'], ['ammonia', 'a compound'],
  ['vinegar', 'a homogenous mixture'], ['air', 'a homogenous mixture'], ['salt water', 'a homogenous mixture'],
  ['brass', 'a homogenous mixture'], ['apple juice', 'a homogenous mixture'], ['gasoline', 'a homogenous mixture'],
  ['granite', 'a heterogenous mixture'], ['a chocolate chip cookie', 'a heterogenous mixture'], ['sand in water', 'a heterogenous mixture'],
  ['Italian salad dressing', 'a heterogenous mixture'], ['concrete', 'a heterogenous mixture'], ['chicken noodle soup', 'a heterogenous mixture'],
];
const MATTER_RULE = {
  'an element': 'one kind of atom only, so it cannot be broken down chemically. Every element is on the periodic table.',
  'a compound': 'two or more elements chemically bonded in a FIXED ratio, so it has one formula (CO₂, H₂O, NaCl).',
  'a homogenous mixture': 'two or more substances physically mixed with the SAME composition throughout (a solution). You cannot see the parts.',
  'a heterogenous mixture': 'two or more substances physically mixed whose composition VARIES from place to place. You can see or separate the parts.',
};

const PHYSICAL = ['condensation of steam', 'melting of gold', 'ice melting', 'condensation of nitrogen', 'dissolving sugar in water',
  'boiling water', 'crushing an aluminum can', 'sublimation of dry ice', 'chopping wood', 'freezing of mercury', 'evaporation of rubbing alcohol', 'breaking a glass'];
const CHEMICAL = ['souring of milk', 'coal burning', 'burning of gasoline', 'explosion of a firecracker', 'rusting of iron', 'baking a cake',
  'digestion of food', 'tarnishing of silver', 'frying an egg', 'a match igniting', 'wood rotting'];

const PHASE = [
  { what: 'dry ice sublimes', f: 'CO₂', name: 'Carbon dioxide', wrong: ['Carbon and oxygen gas, released as the compound breaks apart', 'Oxygen gas, O₂', 'Water vapour'] },
  { what: 'liquid water boils', f: 'H₂O', name: 'Water', wrong: ['Hydrogen and oxygen gas, released as the molecules break apart', 'Oxygen gas, O₂', 'Air trapped in the water'] },
  { what: 'iodine crystals sublime', f: 'I₂', name: 'Iodine', wrong: ['Single iodine atoms, released as the I₂ molecules break apart', 'Oxygen gas, O₂', 'Water vapour'] },
  { what: 'liquid nitrogen evaporates', f: 'N₂', name: 'Nitrogen', wrong: ['Single nitrogen atoms, released as the N₂ molecules break apart', 'Water vapour', 'Ammonia, NH₃'] },
  { what: 'rubbing alcohol (isopropanol, C₃H₈O) evaporates', f: 'C₃H₈O', name: 'Isopropanol', wrong: ['Carbon dioxide and water, released as the molecules break apart', 'Water vapour', 'Hydrogen gas, H₂'] },
  { what: 'a mothball (naphthalene, C₁₀H₈) sublimes', f: 'C₁₀H₈', name: 'Naphthalene', wrong: ['Carbon and hydrogen gas, released as the molecules break apart', 'Water vapour', 'Carbon dioxide, CO₂'] },
];

const ABUNDANT = [
  { where: 'milk', right: 'water', wrong: ['protein', 'tryglycerides', 'calcium'], why: 'Milk is about 87% water; fat, protein, sugar and minerals are the rest.' },
  { where: 'the air', right: 'nitrogen', wrong: ['carbon dioxide', 'argon', 'oxygen'], why: 'Dry air is about 78% N₂ and 21% O₂; argon is about 0.9% and CO₂ about 0.04%.' },
  { where: 'the ocean', right: 'water', wrong: ['sodium phosphate', 'calcium chloride', 'sodium chloride'], why: 'Seawater is about 96.5% water; dissolved salts (mostly NaCl) are only about 3.5%.' },
  { where: 'the human body (by mass)', right: 'water', wrong: ['protein', 'fat', 'calcium phosphate'], why: 'An adult body is roughly 55-60% water by mass.' },
  { where: "the Earth's crust (by mass)", right: 'oxygen', wrong: ['silicon', 'aluminum', 'iron'], why: 'The crust is about 46% oxygen by mass, bound in silicate and oxide minerals; silicon is second at about 28%.' },
  { where: 'the Sun', right: 'hydrogen', wrong: ['helium', 'oxygen', 'carbon'], why: 'The Sun is about 73% hydrogen and 25% helium by mass.' },
];

const NO_CHEM = [
  { what: 'food', opts: ['whole grains', 'pure water', 'apples'], all: 'All food contains chemicals' },
  { what: 'drink', opts: ['bottled spring water', 'organic orange juice', 'black coffee'], all: 'All drinks contain chemicals' },
  { what: 'product', opts: ['an "all-natural" soap', 'an "organic" shampoo', 'a "chemical-free" sunscreen'], all: 'All of these products contain chemicals' },
  { what: 'material', opts: ['cotton', 'wood', 'wool'], all: 'All of these materials are made of chemicals' },
];

const METALS_OXIDIZE = [
  { thing: 'a shiny iron nail', product: 'red-brown iron(III) oxide (rust)', verb: 'corrodes' },
  { thing: 'a strip of magnesium ribbon', product: 'white magnesium oxide', verb: 'burns in air' },
  { thing: 'a coil of copper wire', product: 'black copper(II) oxide', verb: 'is heated in air' },
  { thing: 'a piece of aluminum foil', product: 'aluminum oxide', verb: 'is heated in air' },
];

const PREFIXES = [
  { s: 'T', n: 'tera-', e: 12, ns: 'Teka-' }, { s: 'G', n: 'giga-', e: 9, ns: 'gega-' }, { s: 'M', n: 'mega-', e: 6, ns: 'milli-' },
  { s: 'k', n: 'kilo-', e: 3, ns: 'kila-' }, { s: 'd', n: 'deci-', e: -1, ns: 'deka-' }, { s: 'c', n: 'centi-', e: -2, ns: 'cent' },
  { s: 'm', n: 'milli-', e: -3, ns: 'mega-' }, { s: 'µ', n: 'micro-', e: -6, ns: 'milli-' }, { s: 'n', n: 'nano-', e: -9, ns: 'pico-' },
  { s: 'p', n: 'pico-', e: -12, ns: 'nano-' },
];
const WRONG_SYM = { T: 't', G: 'g', M: 'm', k: 'K', d: 'da', c: 'C', m: 'M', 'µ': 'm', n: 'N', p: 'P' };
const pow = (e) => `x 10^${e}`;

// Unit conversion chains: [from, to, factor text, multiplier from->to, metric hops shown]
const CHAINS = [
  { from: 'gallons', to: 'mL', given: '1 L = 0.2642 gal', mult: 1000 / 0.2642, fsf: 4, hop: 1000, how: 'gal -> L (÷ 0.2642) -> mL (× 1000)' },
  { from: 'km', to: 'inches', given: '2.54 cm = 1 inch', mult: 100000 / 2.54, fsf: 3, hop: 100000, how: 'km -> cm (× 100,000) -> in (÷ 2.54)' },
  { from: 'pounds', to: 'mg', given: '1 lb = 453.6 g', mult: 453.6 * 1000, fsf: 4, hop: 1000, how: 'lb -> g (× 453.6) -> mg (× 1000)' },
  { from: 'quarts', to: 'mL', given: '1 L = 1.057 qt', mult: 1000 / 1.057, fsf: 4, hop: 1000, how: 'qt -> L (÷ 1.057) -> mL (× 1000)' },
  { from: 'miles', to: 'cm', given: '1 mi = 1.609 km', mult: 1.609 * 100000, fsf: 4, hop: 100000, how: 'mi -> km (× 1.609) -> cm (× 100,000)' },
  { from: 'ounces', to: 'kg', given: '1 oz = 28.35 g', mult: 28.35 / 1000, fsf: 4, hop: 0.001, how: 'oz -> g (× 28.35) -> kg (÷ 1000)' },
];

// metric prefix conversions: [from, to, powerOf10 multiplier, quantity]
const METRIC = [
  ['kg', 'mg', 6], ['g', 'µg', 6], ['mg', 'kg', -6], ['kg', 'g', 3], ['kL', 'cm³', 6], ['L', 'mL', 3],
  ['mL', 'L', -3], ['kL', 'mL', 6], ['km', 'cm', 5], ['mm', 'm', -3], ['nm', 'm', -9], ['µL', 'mL', -3], ['cm³', 'L', -3],
];

const AREA = [
  { a: 'in', b: 'ft', f: 12, given: '12 in = 1 ft' }, { a: 'ft', b: 'yd', f: 3, given: '3 ft = 1 yd' },
  { a: 'cm', b: 'm', f: 100, given: '100 cm = 1 m' }, { a: 'mm', b: 'cm', f: 10, given: '10 mm = 1 cm' },
  { a: 'ft', b: 'in', f: 1 / 12, given: '12 in = 1 ft' }, { a: 'm', b: 'cm', f: 1 / 100, given: '100 cm = 1 m' },
  { a: 'km', b: 'ft', f: 1 / 3281, given: '1 km = 3281 ft' },
];

const SPRINTS = [
  ['Usain Bolt can run 100 meters in 9.58 seconds', 100, 9.58], ['A cheetah can run 100 meters in 5.95 seconds', 100, 5.95],
  ['Michael Johnson ran 200 meters in 19.32 seconds', 200, 19.32], ['Wayde van Niekerk ran 400 meters in 43.03 seconds', 400, 43.03],
  ['A greyhound can run 500 meters in 28.9 seconds', 500, 28.9], ['A racing pigeon flies 1500 meters in 61.2 seconds', 1500, 61.2],
  ['A cyclist covers 1000 meters in 71.4 seconds', 1000, 71.4],
];

const SUBSTANCES = ['a given solvent', 'a chemical', 'a liquid', 'a metal alloy', 'an oil', 'an unknown liquid'];

// ---------------------------------------------------------------------------------------------

export const STYLES_CH1 = [
  {
    id: 'classify-matter', section: '1-3', title: 'Element, compound, homogeneous or heterogeneous mixture',
    asked: ['ch12:6', 'prep:9', 'prep:11', 'prep:12', 'prep:13', 'prep:14', 'prep:5'],
    real: { from: 'ch12', idx: 5 },
    gen(h, p) {
      const [s, a] = p ? MATTER.find((m) => m[0] === p.s) : h.pick(MATTER);
      const all = Object.keys(MATTER_RULE);
      return {
        stem: `Is ${s} a compound, an element, a homogenous mixture or a heterogenous mixture?`,
        right: a, wrong: all.filter((x) => x !== a),
        explanation: `${s[0].toUpperCase() + s.slice(1)} is ${a}: ${MATTER_RULE[a]}\n\nDecide in order: one kind of atom -> element; a fixed formula -> compound; otherwise a mixture, and then ask whether it looks the same everywhere (homogeneous) or not (heterogeneous).`,
      };
    },
  },
  {
    id: 'phys-chem-change', section: '1-4', title: 'Physical versus chemical change',
    asked: ['prep:1', 'prep:10'],
    real: {
      src: 'prep', q: 1, stem: 'Each of the following changes are either physical or chemical. Which of the following is a physical change?',
      choices: ['souring of milk', 'coal burning', 'burning of gasoline', 'condensation of steam'], answer: 'condensation of steam',
      p: { want: 'physical', right: 'condensation of steam', wrong: ['souring of milk', 'coal burning', 'burning of gasoline'] },
    },
    gen(h, p) {
      const want = p?.want ?? h.pick(['physical', 'chemical']);
      const [rightPool, wrongPool] = want === 'physical' ? [PHYSICAL, CHEMICAL] : [CHEMICAL, PHYSICAL];
      const right = p?.right ?? h.pick(rightPool);
      const wrong = p?.wrong ?? [...wrongPool].sort(() => h.rng() - 0.5).slice(0, 3);
      return {
        stem: `Each of the following changes are either physical or chemical. Which of the following is a ${want} change?`,
        right, wrong,
        explanation: `A PHYSICAL change alters form or state only (melting, boiling, condensing, dissolving, crushing); the substance is still the same substance. A CHEMICAL change makes a NEW substance (burning, rusting, souring, cooking, exploding) - look for gas, heat or light given off, a colour change or a new smell.\n\n"${right}" is the only ${want} change here. ${wrong.map((w) => `"${w}" is ${want === 'physical' ? 'chemical' : 'physical'}`).join('; ')}.`,
      };
    },
  },
  {
    id: 'phase-change-identity', section: '1-4', title: 'What substance is present after a phase change',
    asked: ['ch12:3'],
    real: { from: 'ch12', idx: 2 },
    gen(h) {
      const x = h.pick(PHASE);
      return {
        stem: `When ${x.what}, what is the substance in the gas that results?`,
        right: `${x.name}, ${x.f} - the same substance, now in the gas phase`, wrong: x.wrong,
        explanation: `A phase change (melting, boiling, evaporating, subliming) is a PHYSICAL change: the molecules move apart but are not broken. The gas is still ${x.f}.\n\nThe wrong options all assume the phase change breaks bonds or makes something new. It does not; that would be a chemical change.`,
      };
    },
  },
  {
    id: 'no-chemicals', section: '1-2', title: 'All matter is made of chemicals',
    asked: ['prep:15'],
    real: {
      src: 'prep', q: 15, stem: 'Which food contains no chemicals?', choices: ['whole grains', 'pure water', 'Apples', 'All food contains chemicals'],
      answer: 'All food contains chemicals', p: { what: 'food' },
    },
    gen(h, p) {
      const x = p ? NO_CHEM.find((n) => n.what === p.what) : h.pick(NO_CHEM);
      return {
        stem: `Which ${x.what} contains no chemicals?`, right: x.all, wrong: x.opts,
        explanation: 'Chemistry studies MATTER, and every bit of matter is made of chemicals (elements and compounds). Water is the chemical H₂O; an apple is water, sugars, acids and fibre. "Natural" or "organic" does not mean chemical-free. Nothing that has mass and takes up space is chemical-free.',
      };
    },
  },
  {
    id: 'most-abundant', section: '1-2', title: 'Most abundant substance in a common material',
    asked: ['prep:3', 'prep:6', 'prep:8'],
    real: {
      src: 'prep', q: 6, stem: 'What is the most abundant chemical in the air?', choices: ['carbon dioxide', 'argon', 'oxygen', 'nitrogen'],
      answer: 'nitrogen', p: { where: 'the air' },
    },
    gen(h, p) {
      const x = p ? ABUNDANT.find((a) => a.where === p.where) : h.pick(ABUNDANT);
      return { stem: `What is the most abundant chemical in ${x.where}?`, right: x.right, wrong: x.wrong, explanation: x.why };
    },
  },
  {
    id: 'mass-conservation', section: '2-1', title: 'Conservation of mass: mass of oxygen picked up',
    asked: ['prep:7'],
    real: {
      src: 'prep', q: 7,
      stem: 'When elemental iron corrodes it combines with oxygen in the air to ultimately form red brown iron(III) oxide called rust. If a shiny iron nail with an initial mass of 23.2 g is weighed after being coated in a layer of rust and the mass of the iron nail increases to 24.1 g, what mass of oxygen combined with the iron?',
      choices: ['23.2', '1.1 g', '47.3 g', '0.9 g'], answer: '0.9 g', p: { k: 0, m1: 23.2, m2: 24.1 },
    },
    gen(h, p) {
      const x = METALS_OXIDIZE[p ? p.k : h.int(0, METALS_OXIDIZE.length - 1)];
      const m1 = p ? p.m1 : rnd(h, 2.0, 40.0, 1);
      const m2 = p ? p.m2 : round(m1 + rnd(h, 0.3, 3.5, 1), 1);
      const d = round(m2 - m1, 1);
      return {
        stem: `When ${x.thing} ${x.verb}, the metal combines with oxygen from the air to form ${x.product}. If it has an initial mass of ${m1.toFixed(1)} g and its mass increases to ${m2.toFixed(1)} g, what mass of oxygen combined with the metal?`,
        right: `${d.toFixed(1)} g`, wrong: [`${m1.toFixed(1)} g`, `${m2.toFixed(1)} g`, `${round(m1 + m2, 1).toFixed(1)} g`, `${round(d + 0.2, 1).toFixed(1)} g`, `${round(d * 2, 1).toFixed(1)} g`],
        explanation: `Mass is conserved: metal + oxygen = oxide. The only thing added was oxygen, so\n\n    mass of oxygen = final - initial = ${m2.toFixed(1)} g - ${m1.toFixed(1)} g = ${d.toFixed(1)} g\n\n${m1.toFixed(1)} g is the metal, ${m2.toFixed(1)} g is the whole oxidised object, and ${round(m1 + m2, 1).toFixed(1)} g adds them, which counts the metal twice.`,
      };
    },
  },
  {
    id: 'prefix-table', section: '1-5', title: 'Metric prefix table: symbol, name and power of ten',
    asked: ['prep:16', 'prep:20'],
    real: {
      src: 'prep', q: 16,
      stem: 'Fill in the table (symbol | prefix | factor):  ? | pico- | x 10^-12 ;  T | ? | x 10^12 ;  G | giga- | ? ;  ? | deci- | x 10^-1',
      choices: ['p, Tera-, x 10^9, d', 'p, Teka-, x 10^9, d', 'p, Tessa-, x 10^6, d', 'k, Teka-, x 10^-6, d'], answer: 'p, Tera-, x 10^9, d',
      explanation: 'The blanks in order: p (pico- is 10⁻¹²), Tera- (T is 10¹²), x 10^9 (giga-), d (deci- is 10⁻¹).\n\n"Teka-" and "Tessa-" are not prefixes, and 10⁶ is mega-, not giga-. The prefixes to know cold: T tera- 10¹², G giga- 10⁹, M mega- 10⁶, k kilo- 10³, d deci- 10⁻¹, c centi- 10⁻², m milli- 10⁻³, µ micro- 10⁻⁶, n nano- 10⁻⁹, p pico- 10⁻¹².',
    },
    gen(h) {
      const rows = [...PREFIXES].sort(() => h.rng() - 0.5).slice(0, 4);
      const cols = rows.map(() => h.int(0, 2));
      if (new Set(cols).size === 1) cols[0] = (cols[0] + 1) % 3;
      const cell = (r, c) => [r.s, r.n, pow(r.e)][c];
      const wrongCell = (r, c) => [WRONG_SYM[r.s], r.ns, pow(-r.e)][c];
      const ans = rows.map((r, i) => cell(r, cols[i]));
      const wrong = [0, 1, 2, 3].map((i) => ans.map((a, j) => (j === i ? wrongCell(rows[j], cols[j]) : a)).join(', '));
      wrong.push(ans.map((a, j) => (j % 2 ? wrongCell(rows[j], cols[j]) : a)).join(', '));
      const table = rows.map((r, i) => [0, 1, 2].map((c) => (c === cols[i] ? '?' : cell(r, c))).join(' | ')).join(' ;  ');
      return {
        stem: `Fill in the table (symbol | prefix | factor):  ${table}`,
        right: ans.join(', '), wrong,
        explanation: `The blanks in order: ${ans.join(', ')}.\n\nThe prefixes to know cold: T tera- 10¹², G giga- 10⁹, M mega- 10⁶, k kilo- 10³, d deci- 10⁻¹, c centi- 10⁻², m milli- 10⁻³, µ micro- 10⁻⁶, n nano- 10⁻⁹, p pico- 10⁻¹². Capital M (mega) and small m (milli) are different prefixes; so are the positive and negative powers.`,
      };
    },
  },
  {
    id: 'metric-convert', section: '1-6', title: 'Metric-to-metric conversion',
    asked: ['ch12:8', 'ch12:10'],
    real: { from: 'ch12', idx: 7 },
    gen(h) {
      const [a, b, e] = h.pick(METRIC);
      const n = h.int(3, 6);
      const v = measuredText(h, 1, 999, n);
      const x = Number(v) * 10 ** e;
      const fmt = (y) => `${sci(y, n)} ${b}`;
      return {
        stem: `How many ${b} are in ${v} ${a}?`,
        right: fmt(x), wrong: [fmt(Number(v) * 10 ** -e), fmt(x * 1000), fmt(x / 1000)],
        explanation: `Go through the base unit. 1 ${a} = 10^${e} ${b}, so\n\n    ${v} ${a} × (10^${e} ${b} / 1 ${a}) = ${sci(x, n)} ${b}\n\nA conversion keeps the measurement's significant figures (${n} here); only the power of ten changes. Going to a SMALLER unit gives a BIGGER number. The 10^${-e} option converts in the wrong direction; the others are off by one prefix step (10³).`,
      };
    },
  },
  {
    id: 'unit-chain', section: '1-6', title: 'Conversion through a given non-metric factor',
    asked: ['ch12:7', 'ch12:11'],
    real: { from: 'ch12', idx: 6 },
    gen(h) {
      const c = h.pick(CHAINS);
      const n = h.int(3, 4);
      const v = measuredText(h, 2, 600, n);
      const ansSf = Math.min(n, c.fsf);
      const x = Number(v) * c.mult;
      const inv = Number(v) * c.hop * c.hop / c.mult; // used the given factor upside down
      const fmt = (y) => `${sci(y, ansSf)} ${c.to}`;
      return {
        stem: `How many ${c.to} are in ${v} ${c.from}? (${c.given})`,
        right: fmt(x), wrong: [fmt(inv), fmt(x / c.hop), fmt(x * (c.hop > 1 ? 10 : 0.1))],
        explanation: `Chain the factors so each unit cancels: ${c.how}.\n\n    ${v} ${c.from} -> ${sci(x, ansSf)} ${c.to}\n\nSignificant figures: the measurement has ${n} and the given factor ${c.fsf}; metric factors are exact. The answer keeps ${ansSf}. One distractor uses the given factor upside down, one forgets the metric step, one slips a power of ten.`,
      };
    },
  },
  {
    id: 'speed-convert', section: '1-6', title: 'Speed conversion (m/s to mi/h)',
    asked: ['ex1:11'],
    real: { src: 'ex1', q: 11, stem: 'Usain Bolt can run 100 meters in 9.58 seconds. What is this speed in miles/hour? (1 mi = 1.609 km)', answer: '23.4 mi/h', p: { k: 0 } },
    gen(h, p) {
      const [who, m, s] = p ? SPRINTS[p.k] : h.pick(SPRINTS);
      const ms = m / s;
      const mph = (ms * 3600) / 1609;
      const kmh = ms * 3.6;
      return {
        stem: `${who}. What is this speed in miles/hour? (1 mi = 1.609 km)`,
        right: `${sf(mph, 3)} mi/h`, wrong: [`${sf(ms, 3)} mi/h`, `${sf(kmh, 3)} mi/h`, `${sf(kmh * 1.609, 3)} mi/h`],
        explanation: `${m} m / ${s} s = ${sf(ms, 4)} m/s\n    × 3600 s/h = ${sf(ms * 3600, 4)} m/h\n    × (1 km / 1000 m) × (1 mi / 1.609 km) = ${sf(mph, 3)} mi/h\n\nThree significant figures, from ${s} s. The wrong options stop at m/s, stop at km/h, or multiply by 1.609 instead of dividing.`,
      };
    },
  },
  {
    id: 'area-convert', section: '1-6', title: 'Squared-unit (area) conversion',
    asked: ['ch12:2', 'ex2:15'],
    real: { from: 'ch12', idx: 1 },
    // Squared (area) or cubed (volume) units: the Exam 3 Review asks "How many ft³ are in 144 in³?".
    gen(h) {
      const u = h.pick(AREA);
      const k = h.pick([2, 2, 3]);
      const p = k === 2 ? '²' : '³';
      const n = h.int(2, 3);
      const v = measuredText(h, 2, 900, n);
      const x = Number(v) / u.f ** k;
      const fmt = (y) => `${sci(y, n)} ${u.b}${p}`;
      return {
        stem: `Convert ${k === 2 ? 'an area' : 'a volume'} of ${v} ${u.a}${p} to ${u.b}${p}. (${u.given})`,
        right: fmt(x), wrong: [fmt(Number(v) / u.f), fmt(Number(v) * u.f ** k), fmt(Number(v) / u.f ** (k === 2 ? 3 : 2)), fmt(Number(v) * u.f)],
        explanation: `A conversion factor equals 1, so its ${k === 2 ? 'SQUARE' : 'CUBE'} also equals 1. Raise the number AND the unit to the power ${k}:\n\n    (${u.given})${p} -> divide by ${sf(u.f ** k, 4)} going ${u.a}${p} -> ${u.b}${p}\n    ${v} ${u.a}${p} -> ${sci(x, n)} ${u.b}${p}\n\nThe classic mistake is raising the unit to the power but not the number (using the linear factor once).`,
      };
    },
  },
  {
    id: 'sigfig-count', section: '1-6', title: 'Counting significant figures',
    asked: ['ch12:14', 'ex1:10', 'si2:24'],
    real: { from: 'ch12', idx: 13 },
    gen(h) {
      const kind = h.int(0, 3);
      const d = () => String(h.int(1, 9));
      let s;
      if (kind === 0) s = `0.${'0'.repeat(h.int(1, 3))}${d()}0${d()}0`; // leading + captive + trailing
      else if (kind === 1) s = `${d()}${d()}.0${d()}0`; // trailing zero after a decimal
      else if (kind === 2) s = `${d()}0${d()}.${'0'.repeat(h.int(1, 2))}`;
      else s = `${d()}.${d()}0${'0'.repeat(h.int(0, 1))} × 10^${h.pick([-5, -3, 4, 6])}`;
      const n = sigFigsOf(s.split(' ')[0]);
      const allDigits = s.split(' ')[0].replace('.', '').length;
      const noTrail = s.split(' ')[0].replace('.', '').replace(/^0+/, '').replace(/0+$/, '').length;
      const unit = h.pick(['mL', 'g', 'cm', 'kg', 'L', 'm']);
      const wrong = [allDigits, noTrail, n + 1, n - 1, n + 2].filter((w) => w > 0 && w !== n).map(String);
      return {
        stem: `How many significant figures are in ${s} ${unit}?`,
        right: String(n), wrong,
        explanation: `Rules: non-zero digits always count; zeros BETWEEN them count; LEADING zeros never count (they only place the decimal); TRAILING zeros count when there is a decimal point. In scientific notation count only the digits before × 10.\n\n${s} has ${n} significant figures.`,
      };
    },
  },
  {
    id: 'sigfig-muldiv', section: '1-6', title: 'Multiply/divide with significant figures and units',
    asked: ['ch12:13', 'ex1:14a', 'ex1:14d'],
    real: { from: 'ch12', idx: 12 },
    gen(h) {
      const n1 = h.int(2, 4), n2 = h.int(2, 4);
      const a = measuredText(h, 1, 99, n1);
      const b = h.pick([measuredText(h, 0.01, 0.99, n2), measuredText(h, 1, 50, n2)]);
      const op = h.pick(['/', '×']);
      const [ua, ub, ur, uw] = op === '/' ? ['g', 'mL', 'g/mL', 'mL/g'] : ['cm', 'cm', 'cm²', 'cm'];
      const x = op === '/' ? Number(a) / Number(b) : Number(a) * Number(b);
      const n = Math.min(sigFigsOf(a), sigFigsOf(b));
      const max = Math.max(sigFigsOf(a), sigFigsOf(b));
      return {
        stem: `Perform the following calculation and round the result so it is written to the correct number of significant figures and has the correct units. ${a} ${ua} ${op} ${b} ${ub} =`,
        right: `${sf(x, n)} ${ur}`, wrong: [`${sf(x, max === n ? n + 1 : max)} ${ur}`, `${sf(x, n)} ${uw}`, `${sf(x, n + 2)} ${ur}`, `${sf(x * 10, n)} ${ur}`, `${sf(x / 10, n)} ${ur}`],
        explanation: `Multiplication and division keep the FEWEST significant figures of the inputs: ${a} has ${sigFigsOf(a)}, ${b} has ${sigFigsOf(b)}, so the answer has ${n}.\n\n    ${a} ${op} ${b} = ${sf(x, 6)} -> ${sf(x, n)} ${ur}\n\nUnits combine the same way the numbers do (${ua} ${op} ${ub} = ${ur}). Scientific notation shows significance that a plain number with trailing zeros would hide.`,
      };
    },
  },
  {
    id: 'sigfig-addsub', section: '1-6', title: 'Add/subtract with significant figures (decimal places)',
    asked: ['ch12:4', 'ex1:14b', 'ex1:14c'],
    real: { from: 'ch12', idx: 3 },
    gen(h) {
      const unit = h.pick(['L', 'g', 'mL', 'cm', 'kg']);
      const dpA = h.int(1, 3);
      let dpB = h.int(0, 3);
      if (dpB === dpA) dpB = (dpA + 1) % 4;
      const intA = String(h.int(1, 99)), intB = String(h.int(0, 9));
      const mk = (ip, dp) => {
        let fp = ''; for (let i = 0; i < dp; i++) fp += h.int(0, 9);
        if (dp > 0 && fp.endsWith('0') === false && h.rng() < 0.3) fp = fp.slice(0, -1) + '0';
        const str = dp ? `${ip}.${fp}` : ip;
        return { str, dp, scaled: BigInt(ip + fp) };
      };
      const a = mk(intA, dpA), b = mk(intB, dpB);
      if (Number(b.str) === 0) return this.gen(h);
      const op = h.pick(['+', '-']);
      if (op === '-' && Number(b.str) > Number(a.str)) return this.gen(h);
      const raw = addSub(a, b, op);
      const keep = Math.min(a.dp, b.dp);
      const r = roundToDp(raw.scaled, raw.dp, keep);
      const right = render(r.scaled, r.dp);
      const unrounded = render(raw.scaled, raw.dp);
      const sfRule = roundToSigFigs(raw.scaled, raw.dp, Math.min(sigFigsOf(a.str), sigFigsOf(b.str)));
      const extra = render(roundToDp(raw.scaled, raw.dp, keep + 1).scaled, keep + 1);
      return {
        stem: `Perform the following calculation and round the result to the correct number of significant figures, with units. ${a.str} ${unit} ${op} ${b.str} ${unit} =`,
        right: `${right} ${unit}`, wrong: [unrounded, sfRule, extra, render(roundToDp(raw.scaled, raw.dp, Math.max(0, keep - 1)).scaled, Math.max(0, keep - 1)), render(roundToDp(addSub(a, b, op === '+' ? '-' : '+').scaled, raw.dp, keep).scaled, keep), render(r.scaled - 1n, keep), render(roundToDp(raw.scaled, raw.dp, keep + 2).scaled, keep + 2)].map((w) => `${w} ${unit}`),
        explanation: `Addition and subtraction keep the FEWEST DECIMAL PLACES (not significant figures): ${a.str} has ${a.dp}, ${b.str} has ${b.dp}, so the answer keeps ${keep}.\n\n    ${a.str} ${op} ${b.str} = ${unrounded} -> ${right} ${unit}\n\nCounting significant figures here is the most common mistake - that is the multiply/divide rule.`,
      };
    },
  },
  {
    id: 'sigfig-mixed', section: '1-6', title: 'Significant figures in a mixed calculation',
    asked: ['ex2:12', 'ex4:9'],
    real: {
      src: 'ex4', q: 9, stem: 'How many significant figures does the following calculations yield? (12.21-1.01)/1.02', choices: ['1', '2', '3', '4'], answer: '3',
      explanation: 'Parentheses first, with the ADDITION rule (decimal places): 12.21 - 1.01 = 11.20, kept to two decimal places, which is 4 significant figures (the trailing zero counts).\nThen the division, with the MULTIPLICATION rule (fewest significant figures): 11.20 has 4 and 1.02 has 3 -> 3.\n\nThe answer is 10.98..., reported as 11.0. Writing 11.2 as the difference, or counting 11.20 as 3 significant figures, are the traps.',
    },
    gen(h) {
      const a = `${h.int(10, 60)}.${h.int(1, 9)}`;
      const b = `0.${h.int(1, 9)}`;
      const c = h.pick([`${h.int(1, 9)}.0${h.int(1, 9)}`, `${h.int(1, 9)}.${h.int(10, 99)}`, `${h.int(1, 9)}.${h.int(1, 9)}`]);
      const op = h.pick(['-', '+']);
      const top = op === '-' ? Number(a) - Number(b) : Number(a) + Number(b);
      const topSf = String(top.toFixed(1)).replace('.', '').replace(/^0+/, '').length;
      const n = Math.min(topSf, sigFigsOf(c));
      const naive = Math.min(sigFigsOf(a), sigFigsOf(b), sigFigsOf(c));
      return {
        stem: `How many significant figures does the following calculation yield? (${a} ${op} ${b}) / ${c}`,
        right: String(n), wrong: [naive, n + 1, n - 1, n + 2, 1].filter((w) => w > 0 && w !== n).map(String),
        explanation: `Work the parentheses first with the ADDITION rule (decimal places): ${a} ${op} ${b} = ${top.toFixed(1)}, kept to one decimal place, which is ${topSf} significant figures. Then divide with the MULTIPLICATION rule (fewest significant figures): ${top.toFixed(1)} (${topSf}) and ${c} (${sigFigsOf(c)}) -> ${n}.\n\nApplying the significant-figure rule to ${b} directly (it has only 1) is the trap: inside an addition only decimal places matter.`,
      };
    },
  },
  {
    id: 'density-mass', section: '1-6', title: 'Mass from density and volume',
    asked: ['ch12:12', 'ex1:9', 'prep:17'],
    real: { src: 'ex1', q: 9, stem: 'A given solvent has a density of 11.0 g/mL. What is the mass, in g, of 0.871 mL of the solvent?', answer: '9.58 g', p: { d: '11.0', v: '0.871', who: 'a given solvent' } },
    gen(h, p) {
      const d = p?.d ?? measuredText(h, 0.6, 19.5, 3);
      const v = p?.v ?? measuredText(h, 0.2, 60, 3);
      const who = p?.who ?? h.pick(SUBSTANCES);
      const m = Number(d) * Number(v);
      return {
        stem: `${who[0].toUpperCase() + who.slice(1)} has a density of ${d} g/mL. What is the mass, in g, of ${v} mL of ${who.startsWith('a') ? 'it' : 'the substance'}?`.replace('of it?', `of the ${who.replace(/^an? (given )?/, '')}?`),
        right: `${sf(m, 3)} g`, wrong: [`${sf(Number(v) / Number(d), 3)} g`, `${sf(Number(d) / Number(v), 3)} g`, `${sf(m * 10, 3)} g`, `${sf(m / 10, 3)} g`, `${sf(Number(d) + Number(v), 3)} g`],
        explanation: `d = m / V, so m = d × V = ${d} g/mL × ${v} mL = ${sf(m, 3)} g (mL cancels).\n\nDividing either way gives units of mL²/g or g/mL², not grams - a units check catches it.`,
      };
    },
  },
  {
    id: 'density-volume', section: '1-6', title: 'Volume from density and mass',
    asked: ['prep:21'],
    real: {
      src: 'prep', q: 21, stem: 'A given solvent has a density of 10.0 g/mL. What is the volume, in mL, of 0.791 g of the solvent?',
      choices: ['2.24', '1.23', '12.64', '0.0791'], answer: '0.0791', p: { d: '10.0', m: '0.791' },
    },
    gen(h, p) {
      const d = p?.d ?? measuredText(h, 0.6, 19.5, 3);
      const m = p?.m ?? measuredText(h, 0.3, 90, 3);
      const v = Number(m) / Number(d);
      return {
        stem: `A given solvent has a density of ${d} g/mL. What is the volume, in mL, of ${m} g of the solvent?`,
        right: p ? sf(v, 3) : `${sf(v, 3)} mL`, wrong: [Number(m) * Number(d), Number(d) / Number(m), v * 10, v / 10, Number(m) * Number(d) / 10].map((x) => `${sf(x, 3)} mL`),
        explanation: `d = m / V, so V = m / d = ${m} g ÷ ${d} g/mL = ${sf(v, 3)} mL (g cancels, mL is left).\n\nMultiplying gives g²/mL; dividing the density by the mass gives 1/mL. Set up the units first and the arithmetic follows.`,
      };
    },
  },
  {
    id: 'density-from-mv', section: '1-6', title: 'Density from mass and volume',
    asked: ['prep:19'],
    real: {
      src: 'prep', q: 19, stem: 'A sample weighs 45.6 g. Its volume was measured to be 36.4 mL. What is the density of the sample in g mL⁻¹?',
      choices: ['1.12', '.798', '2.23', '1.25'], answer: '1.25', p: { m: '45.6', v: '36.4' },
    },
    gen(h, p) {
      const m = p?.m ?? measuredText(h, 5, 300, 3);
      let v = p?.v ?? measuredText(h, 2, 250, 3);
      if (!p && v === m) v = measuredText(h, 2, 250, 3);
      const d = Number(m) / Number(v);
      return {
        stem: `A sample weighs ${m} g. Its volume was measured to be ${v} mL. What is the density of the sample in g mL⁻¹?`,
        right: p ? sf(d, 3) : `${sf(d, 3)} g/mL`, wrong: [Number(v) / Number(m), Number(m) * Number(v), d / 1000, d * 10, d / 10].map((x) => `${sf(x, 3)} g/mL`),
        explanation: `Density = mass / volume = ${m} g ÷ ${v} mL = ${sf(d, 3)} g/mL. Three significant figures from both measurements.\n\n${sf(Number(v) / Number(m), 3)} is volume ÷ mass (mL/g, upside down).`,
      };
    },
  },
  {
    id: 'density-box', section: '1-6', title: 'Mass of a rectangular solid from its dimensions and density',
    asked: ['ch12:1'],
    real: { from: 'ch12', idx: 0 },
    gen(h) {
      const n = h.int(2, 3);
      const dims = [0, 1, 2].map(() => measuredText(h, 1, 9.9, n));
      const d = measuredText(h, 2, 19.3, 3);
      const V = dims.reduce((s, x) => s * Number(x), 1);
      const m = V * Number(d);
      return {
        stem: `A rectangular bar of metal measuring ${dims.join(' cm x ')} cm has a density of ${d} g/cm³. What is the mass of this block?`,
        right: `${sf(m, n)} g`, wrong: [`${sf(m, 5)} g`, `${sf(V, n)} g`, `${sf(V / Number(d), n)} g`],
        explanation: `V = l × w × h = ${dims.join(' × ')} = ${sf(V, 5)} cm³\nm = d × V = ${d} × ${sf(V, 5)} = ${sf(m, 6)} g -> ${sf(m, n)} g\n\nThe dimensions carry ${n} significant figures each, so the answer does too. The other options are the unrounded value, the volume alone, and V ÷ d.`,
      };
    },
  },
  {
    id: 'density-sphere', section: '1-6', title: 'Mass of a sphere from its radius and density',
    asked: ['ex1:19'],
    real: { src: 'ex1', q: 19, stem: 'A spherical metal object has a radius of 2.0 cm and a density of 10.1 g/cm³. What is its mass? V = (4/3)πr³', answer: '3.4e2 g', p: { r: '2.0', d: '10.1' } },
    gen(h, p) {
      const r = p?.r ?? measuredText(h, 0.5, 6.0, 2);
      const d = p?.d ?? measuredText(h, 2, 19.3, 3);
      const V = (4 / 3) * Math.PI * Number(r) ** 3;
      const m = V * Number(d);
      const n = Math.min(sigFigsOf(r), sigFigsOf(d));
      return {
        stem: `A spherical metal object has a radius of ${r} cm and a density of ${d} g/cm³. What is its mass? V = (4/3)πr³`,
        right: `${sf(m, n)} g`,
        wrong: [`${sf(m * 8, n)} g`, `${sf(Math.PI * Number(r) ** 3 * Number(d), n)} g`, `${sf((4 / 3) * Math.PI * Number(r) ** 2 * Number(d), n)} g`, `${sf(V, n)} g`, `${sf(m / 8, n)} g`],
        explanation: `V = (4/3)π(${r} cm)³ = ${sf(V, 4)} cm³\nm = d × V = ${d} × ${sf(V, 4)} = ${sf(m, 4)} g -> ${sf(m, n)} g (${n} significant figures, from the radius).\n\nWrong options: using the diameter (8 times too big), dropping the 4/3, or squaring r instead of cubing it.`,
      };
    },
  },
  {
    id: 'density-displacement', section: '1-6', title: 'Density by water displacement in a graduated cylinder',
    asked: ['prep:18'],
    real: {
      src: 'prep', q: 18,
      stem: 'A graduated cylinder was filled with water to the 15.0 mL mark and weighed on a balance. Its mass was 27.35 g. An object made of silver was placed in the cylinder and completely submerged in the water. The water level rose to 18.3 mL. When reweighed, the cylinder, water, and silver object had a total mass of 62.00 g. Calculate the density of silver in g/cm³.',
      choices: ['11 g/cm³', '18 g/cm³', '12 g/cm³', '21 g/cm³'], answer: '11 g/cm³', p: { v1: '15.0', m1: '27.35', v2: '18.3', m2: '62.00', metal: 'silver' },
    },
    gen(h, p) {
      const [metal, dens] = p ? [p.metal, null] : h.pick([['silver', 10.5], ['lead', 11.3], ['copper', 8.96], ['zinc', 7.14], ['nickel', 8.90], ['aluminum', 2.70], ['tin', 7.31], ['iron', 7.87]]);
      const v1 = p?.v1 ?? measuredText(h, 10, 30, 3);
      const dv = p ? null : rnd(h, 2.1, 9.8, 1);
      const v2 = p?.v2 ?? (Number(v1) + dv).toFixed(1);
      const m1 = p?.m1 ?? (rnd(h, 20, 60, 2)).toFixed(2);
      const add = p ? null : round(dens * dv * (0.97 + 0.06 * h.rng()), 2);
      const m2 = p?.m2 ?? (Number(m1) + add).toFixed(2);
      const dm = Number(m2) - Number(m1);
      const dV = Number(v2) - Number(v1);
      const n = String(dV.toFixed(1)).replace('.', '').replace(/^0+/, '').length;
      const d = dm / dV;
      return {
        stem: `A graduated cylinder was filled with water to the ${v1} mL mark and weighed on a balance. Its mass was ${m1} g. An object made of ${metal} was placed in the cylinder and completely submerged in the water. The water level rose to ${v2} mL. When reweighed, the cylinder, water, and ${metal} object had a total mass of ${m2} g. Calculate the density of ${metal} in g/cm³.`,
        right: `${sf(d, n)} g/cm³`, wrong: [Number(m2) / dV, dm / Number(v2), Number(m2) / Number(v2), dm / Number(v1), dV / dm].map((x) => `${sf(x, n)} g/cm³`),
        explanation: `Mass of the object = ${m2} - ${m1} = ${dm.toFixed(2)} g. Volume of the object = the rise in water level = ${v2} - ${v1} = ${dV.toFixed(1)} mL = ${dV.toFixed(1)} cm³.\n\n    d = ${dm.toFixed(2)} g / ${dV.toFixed(1)} cm³ = ${sf(d, 4)} -> ${sf(d, n)} g/cm³\n\nThe volume difference has only ${n} significant figures (subtraction keeps one decimal place), and that limits the answer. Wrong options use the total mass, or the final water level instead of the rise.`,
      };
    },
  },
  {
    id: 'burette-reading', section: '1-6', title: 'Reading a burette to one estimated digit',
    asked: ['ex2:24'],
    real: { from: 'ex2', idx: 23 },
    gen(h) {
      const whole = h.int(1, 45);
      const tenth = h.int(0, 8);
      const frac = h.pick([['about a third of the way down from', 3], ['about halfway down from', 5], ['about a fifth of the way down from', 2], ['about 80% of the way down from', 8], ['about a tenth of the way down from', 1]]);
      const lo = `${whole}.${tenth}`, hi = (whole + (tenth + 1) / 10).toFixed(1);
      const right = `${whole}.${tenth}${frac[1]} mL`;
      return {
        stem: `A burette (numbers INCREASE going down) has a line every 0.1 mL between the ${whole} and ${whole + 1} mL marks. The bottom of the meniscus sits between the ${lo} and ${hi} lines, ${frac[0]} ${lo}. Which reading is reported with the correct number of significant figures?`,
        right, wrong: [`${lo} mL`, `${whole}.${tenth}${10 - frac[1]} mL`, `${whole}.${tenth}${frac[1]}0 mL`, `${whole}.${tenth + 1}${frac[1]} mL`, `${hi} mL`],
        explanation: `Record every certain digit plus ONE estimated digit. The lines give ${lo} for certain; the estimate between ${lo} and ${hi} supplies the hundredths place -> ${right}.\n\n${lo} drops the estimated digit; the reading with an extra 0 claims a digit the burette cannot give; the other reads the scale upward, as if the numbers increased going up.`,
      };
    },
  },
];
