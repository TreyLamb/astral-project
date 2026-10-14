// Generates siPrefixCards.json (TKB importQuestions rows) for CHEM 1210.
// Source: OpenStax Ch 1 "Common SI prefixes" table (_academiq/ch01-essential-ideas.md) —
// range cut to 10^15..10^-15 at Trey's request. Run: node buildSiPrefixCards.mjs
import fs from 'node:fs';

const P = [
  ['peta', 'P', 15], ['tera', 'T', 12], ['giga', 'G', 9], ['mega', 'M', 6], ['kilo', 'k', 3],
  ['hecto', 'h', 2], ['deca', 'da', 1], ['deci', 'd', -1], ['centi', 'c', -2], ['milli', 'm', -3],
  ['micro', 'μ', -6], ['nano', 'n', -9], ['pico', 'p', -12], ['femto', 'f', -15],
];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const pow = (n) => `10${String(n).split('').map((c) => SUP[c]).join('')}`;
const factor = (n) => `× ${pow(n)}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const SRC = 'OpenStax Chemistry Ch 1 (CHEM 1210 AcademiQ text), common SI prefixes table.';

const rows = [];
const add = (question, answer, subtopic, difficulty, extra = []) => rows.push({
  question, answer, answer_alternates: extra, subject: 'CHEM 1210', subtopic,
  difficulty, pipeline: 'quick_fact', style_tags: ['si-prefixes', 'units'], source_note: SRC,
});

for (const [name, sym, n] of P) {
  const alt = (n === 1) ? ['10^1', '10'] : [`10^${n}`, `1E${n}`];
  const big = n > 0;
  add(`What power of ten does the SI prefix "${name}-" (${sym}) represent?`, `${factor(n)}`, 'si-prefixes', 'basic', alt.map((a) => `× ${a}`).concat(alt));
  add(`Which SI prefix means ${pow(n)}?`, `${name}- (${sym})`, 'si-prefixes', 'basic', [name, sym]);
  add(`What is the symbol for the SI prefix "${name}-"?`, sym, 'si-prefixes', 'basic');
  add(`What does the unit symbol prefix "${sym}" (as in ${sym}m) stand for, and what is its factor?`, `${name}- = ${pow(n)}`, 'si-prefixes', 'basic', [`${name} ${pow(n)}`, name]);
  add(`1 ${name}meter (${sym}m) = ? m`, `${pow(n)} m`, 'si-prefix-conversions', 'basic', [`10^${n} m`]);
  add(`1 m = ? ${name}meters (${sym}m)`, `${pow(-n)} ${sym}m`, 'si-prefix-conversions', 'intermediate', [`10^${-n} ${sym}m`]);
  add(`Is "${name}-" a prefix for very large or very small quantities? Which direction does the exponent go?`, big ? `Large: positive exponent (${pow(n)})` : n === 0 ? '' : `Small: negative exponent (${pow(n)})`, 'si-prefixes', 'basic');
}

// Prefix-to-prefix: adjacent steps students actually convert between.
const pairs = [['kilo', 'milli'], ['mega', 'micro'], ['giga', 'nano'], ['milli', 'micro'], ['micro', 'nano'], ['nano', 'pico'], ['pico', 'femto'], ['centi', 'milli'], ['kilo', 'centi'], ['tera', 'giga'], ['peta', 'tera'], ['giga', 'mega']];
const byName = Object.fromEntries(P.map((p) => [p[0], p]));
for (const [a, b] of pairs) {
  const [, sa, na] = byName[a]; const [, sb, nb] = byName[b];
  const d = na - nb;
  add(`1 ${sa}m = how many ${sb}m? (${cap(a)}meter to ${b}meter)`, `${pow(d)} ${sb}m`, 'si-prefix-conversions', 'intermediate', [`10^${d} ${sb}m`]);
  add(`1 ${sb}m = how many ${sa}m?`, `${pow(-d)} ${sa}m`, 'si-prefix-conversions', 'intermediate', [`10^${-d} ${sa}m`]);
}

// Chemistry-specific unit equalities stated in the text.
const eq = [
  ['1 L = ? mL', '1,000 mL (10³ mL)', ['1000 mL']],
  ['1 mL = ? cm³ (cc)', '1 cm³', ['1 cc']],
  ['1 L = ? dm³', '1 dm³', []],
  ['1 cm³ = ? mL', '1 mL', []],
  ['1 inch = ? cm (exact)', '2.54 cm', []],
  ['1 lb = ? g', '453.59 g (≈ 453.6 g)', ['453.6 g']],
  ['1 oz = ? g', '28.35 g', []],
  ['1 L = ? qt', '1.0567 qt (≈ 1.06 qt)', ['1.06 qt']],
  ['1 m ≈ ? yd', '1.094 yd', []],
  ['1 m ≈ ? in', '39.37 in', []],
  ['1 gal = ? qt', '4 qt', []],
  ['1 gal = ? L', '3.78541 L', []],
  ['SI base unit of length / mass / time?', 'meter (m) / kilogram (kg) / second (s)', []],
  ['Why is the kilogram, not the gram, the SI base unit of mass — and what is the prefix inside it?', 'The base unit already contains a prefix: kilo- (10³ g)', []],
  ['1 MHz = ? Hz; 1 GHz = ? Hz', '10⁶ Hz; 10⁹ Hz', []],
  ['Convert 1 μs to seconds', '10⁻⁶ s', ['10^-6 s']],
];
for (const [q, a, alts] of eq) add(q, a, 'unit-equalities', 'basic', alts);

fs.writeFileSync(new URL('./siPrefixCards.json', import.meta.url), JSON.stringify(rows.filter((r) => r.answer), null, 2));
console.log(rows.length, 'cards');
