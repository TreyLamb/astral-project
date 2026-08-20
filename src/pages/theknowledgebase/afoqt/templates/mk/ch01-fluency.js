// Chapter 1 — Arithmetic fluency and the traps that live in it.
//
// Trey scored 97th percentile on an ASVAB math pretest, so this chapter is a REFRESH, not
// instruction. Every template here exists because the AFOQT sets a specific trap, not
// because the arithmetic is hard: order of operations, unlike denominators, the "parts
// separately" mixed-number slip, absolute-value signs, decimal place shifts, and the
// phrase-to-expression translation that a third of word problems open with.

import { registerTemplate } from '../../engine/generator.js';
import { frac, mixed, num, gcd } from '../util.js';

registerTemplate({
  id: 'mk-order-of-operations',
  subtest: 'MK',
  band: 1,
  name: 'Order of operations with an exponent',
  concepts: ['order-of-operations'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(2, 15);
    const b = h.int(2, 9);
    const diff = h.int(2, 7);
    const d = h.int(1, 9);
    const c = d + diff;
    const correct = a + b * diff ** 2;
    // Error modes, in the order people actually make them: dropped the exponent; worked
    // strictly left to right; distributed the square across the subtraction; squared the
    // product instead of the parenthesis.
    const { choices, correctIndex } = h.choices(correct, [
      a + b * diff,
      (a + b) * diff ** 2,
      a + b * (c * c - d * d),
      a + (b * diff) ** 2,
      ((a + b) * diff) ** 2,
      (a + b * diff) ** 2,
    ]);
    return {
      stem: `${a} + ${b}(${c} - ${d})^2 = ?`,
      choices, correctIndex,
      tags: ['arithmetic'],
      explanation: `Parentheses first: ${c} - ${d} = ${diff}. Then the exponent: ${diff}^2 = ${diff ** 2}. Then multiply: ${b} x ${diff ** 2} = ${b * diff ** 2}. Add last: ${a} + ${b * diff ** 2} = ${correct}. (${c} - ${d})^2 is NOT ${c}^2 - ${d}^2.`,
    };
  },
});

registerTemplate({
  id: 'mk-fraction-add-unlike',
  subtest: 'MK',
  band: 2,
  name: 'Adding fractions with unlike denominators',
  concepts: ['fraction-arithmetic'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const b = h.int(3, 12);
    let d = h.int(3, 12);
    if (d === b) d = b === 12 ? 3 : b + 1;
    let a = h.int(1, b - 1);
    let c = h.int(1, d - 1);
    // Keep both addends in lowest terms: an unreduced stem (2/4) collapses distractors onto
    // each other and reads like a typo.
    while (gcd(a, b) !== 1) a -= 1;
    while (gcd(c, d) !== 1) c -= 1;
    const correct = frac(a * d + c * b, b * d).s;
    // Error modes: added across the bar; found a common denominator but never rescaled the
    // numerators; scaled each numerator by its own denominator; subtracted; multiplied.
    const { choices, correctIndex } = h.choices(correct, [
      frac(a + c, b + d).s,
      frac(a + c, b * d).s,
      frac(a * b + c * d, b * d).s,
      frac(a * d - c * b, b * d).s,
      frac(a * c, b * d).s,
      frac(a + c, Math.max(b, d)).s,
      frac(a * d + c * b, b + d).s,
      frac(a * b - c * d, b * d).s,
    ]);
    return {
      stem: `${a}/${b} + ${c}/${d} = ?`,
      choices, correctIndex,
      tags: ['fractions'],
      explanation: `Common denominator ${b * d}: ${a}/${b} = ${a * d}/${b * d} and ${c}/${d} = ${c * b}/${b * d}. Sum = ${a * d + c * b}/${b * d} = ${correct}. Adding numerators AND denominators gives ${frac(a + c, b + d).s}, which is never right.`,
    };
  },
});

registerTemplate({
  id: 'mk-mixed-number-multiply',
  subtest: 'MK',
  band: 3,
  name: 'Multiplying mixed numbers',
  concepts: ['fraction-arithmetic'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const d1 = h.int(2, 6);
    const d2 = h.int(2, 6);
    const w1 = h.int(1, 4);
    const w2 = h.int(1, 4);
    const n1 = h.int(1, d1 - 1);
    const n2 = h.int(1, d2 - 1);
    const i1 = w1 * d1 + n1;
    const i2 = w2 * d2 + n2;
    const correct = mixed(i1 * i2, d1 * d2);
    // Error modes: multiplied whole parts and fraction parts separately (the dominant one);
    // converted as (whole x numerator)/denominator; added; converted correctly then added
    // the whole numbers back in a second time; multiplied only the fractional parts.
    const { choices, correctIndex } = h.choices(correct, [
      mixed(w1 * w2 * d1 * d2 + n1 * n2, d1 * d2),
      mixed(w1 * n1 * w2 * n2, d1 * d2),
      mixed(i1 * d2 + i2 * d1, d1 * d2),
      mixed(i1 * i2 + (w1 + w2) * d1 * d2, d1 * d2),
      mixed(n1 * n2, d1 * d2),
      mixed(i1 * i2, d1 + d2),
    ]);
    return {
      stem: `${w1} ${n1}/${d1} x ${w2} ${n2}/${d2} = ?`,
      choices, correctIndex,
      tags: ['fractions'],
      explanation: `Convert first: ${w1} ${n1}/${d1} = ${i1}/${d1}, ${w2} ${n2}/${d2} = ${i2}/${d2}. Multiply: ${i1 * i2}/${d1 * d2} = ${correct}. Multiplying the whole parts and the fraction parts separately gives ${mixed(w1 * w2 * d1 * d2 + n1 * n2, d1 * d2)} and drops the two cross terms.`,
    };
  },
});

registerTemplate({
  id: 'mk-absolute-value-expression',
  subtest: 'MK',
  band: 2,
  name: 'Evaluating absolute values',
  concepts: ['absolute-value', 'signed-numbers'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(2, 20);
    const b = a + h.int(2, 15);
    const c = h.int(2, 20);
    let gap = h.int(2, 15);
    if (gap === b - a) gap = gap === 15 ? 2 : gap + 1; // keep the answer off zero
    const d = c + gap;
    const first = b - a;
    const second = gap;
    const correct = first - second;
    // Error modes: dropped both bars; dropped one bar; added; took the absolute value of
    // the whole expression at the end; evaluated only the first term.
    const { choices, correctIndex } = h.choices(correct, [
      -correct,
      first + second,
      -(first + second),
      Math.abs(correct),
      first,
      second,
      correct + second,
    ]);
    return {
      stem: `|${a} - ${b}| - |${c} - ${d}| = ?`,
      choices, correctIndex,
      tags: ['arithmetic'],
      explanation: `|${a} - ${b}| = ${first} and |${c} - ${d}| = ${second}, so ${first} - ${second} = ${correct}. The bars apply BEFORE the subtraction between them - they do not make the final answer positive.`,
    };
  },
});

registerTemplate({
  id: 'mk-decimal-to-percent',
  subtest: 'MK',
  band: 1,
  name: 'Decimal to percent',
  concepts: ['decimal-percent-conversion'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    let n = h.int(11, 99);
    if (n % 10 === 0) n += 1; // a trailing zero collapses two of the distractors together
    const dec = `0.0${n < 10 ? '0' : ''}${n}`;
    const correct = `${num(n / 10, 3)}%`;
    // Error modes: every wrong place shift there is, plus "just wrote a % sign on it".
    const { choices, correctIndex } = h.choices(correct, [
      `${n}%`,
      `${num(n / 1000, 4)}%`,
      `${num(n / 100, 3)}%`,
      `${n * 10}%`,
      `${num(n / 10000, 5)}%`,
    ]);
    return {
      stem: `Express ${dec} as a percent.`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `Percent means "per hundred", so multiply by 100 - move the decimal point two places RIGHT: ${dec} -> ${correct}.`,
    };
  },
});

// The phrase-to-expression step. Named "Math Terms" in the official OATTS module list, and
// it is the first move in most Arithmetic Reasoning items too, which is why it is banded
// low but never skipped.
const TRANSLATIONS = [
  (k, m, v) => ({
    phrase: `${k} less than twice a number`,
    correct: `2${v} - ${k}`,
    wrong: [`${k} - 2${v}`, `2(${v} - ${k})`, `2${v} + ${k}`, `${k}${v} - 2`, `${v} - 2${k}`],
  }),
  (k, m, v) => ({
    phrase: `the quotient of a number and ${k}, increased by ${m}`,
    correct: `${v}/${k} + ${m}`,
    wrong: [`${k}/${v} + ${m}`, `(${v} + ${m})/${k}`, `${v}/(${k} + ${m})`, `${m}${v}/${k}`, `${v}/${k} - ${m}`],
  }),
  (k, m, v) => ({
    phrase: `${k} times the sum of a number and ${m}`,
    correct: `${k}(${v} + ${m})`,
    wrong: [`${k}${v} + ${m}`, `${k} + ${m}${v}`, `${v} + ${k}${m}`, `${k}(${v} - ${m})`, `${k}${v} - ${m}`],
  }),
  (k, m, v) => ({
    phrase: `the product of a number and ${k}, decreased by ${m}`,
    correct: `${k}${v} - ${m}`,
    wrong: [`${m} - ${k}${v}`, `${k}(${v} - ${m})`, `${k}${v} + ${m}`, `${v}/${k} - ${m}`, `${m}${v} - ${k}`],
  }),
  (k, m, v) => ({
    phrase: `${k} more than the square of a number`,
    correct: `${v}^2 + ${k}`,
    wrong: [`(${v} + ${k})^2`, `${k}${v}^2`, `${v}^2 - ${k}`, `2${v} + ${k}`, `${k}^2 + ${v}`],
  }),
  (k, m, v) => ({
    phrase: `the difference between a number and ${k}, divided by ${m}`,
    correct: `(${v} - ${k})/${m}`,
    wrong: [`${v} - ${k}/${m}`, `(${k} - ${v})/${m}`, `${v}/${m} - ${k}`, `${m}(${v} - ${k})`, `(${v} + ${k})/${m}`],
  }),
  (k, m, v) => ({
    phrase: `twice the difference of a number and ${k}`,
    correct: `2(${v} - ${k})`,
    wrong: [`2${v} - ${k}`, `${k} - 2${v}`, `2(${k} - ${v})`, `2${v} + ${k}`, `${v} - 2${k}`],
  }),
  (k, m, v) => ({
    phrase: `${k} decreased by three times a number`,
    correct: `${k} - 3${v}`,
    wrong: [`3${v} - ${k}`, `3(${k} - ${v})`, `${k} + 3${v}`, `3${k} - ${v}`, `(${k} - 3)${v}`],
  }),
];

registerTemplate({
  id: 'mk-term-translation',
  subtest: 'MK',
  band: 1,
  name: 'Translating a phrase into an expression',
  concepts: ['math-vocabulary'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const make = h.pick(TRANSLATIONS);
    const k = h.int(2, 12);
    const m = k + h.int(1, 6);
    const v = h.pick(['n', 'x', 'y', 'm']);
    const t = make(k, m, v);
    const { choices, correctIndex } = h.choices(t.correct, t.wrong);
    return {
      stem: `Which expression represents "${t.phrase}"?`,
      choices, correctIndex,
      tags: ['algebra', 'vocabulary'],
      explanation: `"${t.phrase}" translates term by term to ${t.correct}. Watch the order: "less than", "decreased by" and "subtracted from" all REVERSE the order they are read in.`,
    };
  },
});

// Coprime multipliers, so the GCF is exactly `g` by construction and the LCM is exactly
// g*m*n - which is what makes the other one an honest distractor rather than noise.
const COPRIME = [[2, 3], [3, 4], [4, 5], [3, 5], [5, 6], [2, 5], [4, 7], [5, 7], [3, 7],
  [2, 7], [5, 8], [3, 8], [7, 8], [5, 9], [7, 9], [2, 9], [4, 9], [8, 9], [7, 10], [3, 10]];

registerTemplate({
  id: 'mk-gcf',
  subtest: 'MK',
  band: 2,
  name: 'Greatest common factor',
  concepts: ['divisibility-factors-multiples'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const g = h.int(2, 12);
    const [m, n] = h.pick(COPRIME);
    const a = g * m;
    const b = g * n;
    // The headline error mode is answering with the LCM instead - which is why the two
    // live in separate templates that each carry the other as a distractor.
    const { choices, correctIndex } = h.choices(g, [
      g * m * n, a * b, m * n, Math.min(a, b), Math.abs(a - b), g * 2, a + b,
    ]);
    return {
      stem: `What is the greatest common factor of ${a} and ${b}?`,
      choices, correctIndex,
      tags: ['number-theory'],
      explanation: `${a} = ${g} x ${m} and ${b} = ${g} x ${n}, and ${m} and ${n} share no factor, so the GCF is ${g}. ${g * m * n} is their LEAST COMMON MULTIPLE - the opposite question.`,
    };
  },
});

registerTemplate({
  id: 'mk-lcm',
  subtest: 'MK',
  band: 2,
  name: 'Least common multiple',
  concepts: ['divisibility-factors-multiples'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const g = h.int(2, 12);
    const [m, n] = h.pick(COPRIME);
    const a = g * m;
    const b = g * n;
    const correct = g * m * n;
    // a*b is a real common multiple - just not the least. That makes it the best distractor
    // on the page, because it is what you get by skipping the GCF step entirely.
    const { choices, correctIndex } = h.choices(correct, [
      a * b, g, Math.max(a, b), a + b, m * n, correct * 2,
    ]);
    return {
      stem: `What is the least common multiple of ${a} and ${b}?`,
      choices, correctIndex,
      tags: ['number-theory'],
      explanation: `LCM = (${a} x ${b}) / GCF = ${a * b} / ${gcd(a, b)} = ${correct}. ${a * b} IS a common multiple, but it is not the least one whenever the two numbers share a factor.`,
    };
  },
});
