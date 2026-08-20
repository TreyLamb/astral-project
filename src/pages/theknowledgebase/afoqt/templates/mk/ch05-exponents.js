// Chapter 5 — Exponents, radicals and scientific notation.
//
// Three rules do almost all the work: multiply -> ADD exponents, divide -> SUBTRACT them,
// power of a power -> MULTIPLY them. Nearly every wrong answer in this chapter is one of
// those three operations applied in the wrong place, so that is exactly what the distractors
// are built from.

import { registerTemplate } from '../../engine/generator.js';
import { largestSquareFactor, radical } from '../util.js';

registerTemplate({
  id: 'mk-exponent-product',
  subtest: 'MK',
  band: 2,
  name: 'Multiplying powers of the same base',
  concepts: ['exponent-rules'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    // Distinct draws: e1 === e2 makes "added" and "multiplied" exponents collide (2+2 = 2x2),
    // and c1 === c2 does the same for the coefficient slips.
    const c1 = h.int(2, 9);
    let c2 = h.int(2, 9);
    if (c2 === c1) c2 = c1 === 9 ? 2 : c1 + 1;
    const e1 = h.int(2, 6);
    let e2 = h.int(2, 6);
    if (e2 === e1) e2 = e1 === 6 ? 2 : e1 + 1;
    const correct = `${c1 * c2}x^${e1 + e2}`;
    // Error modes: multiplied the exponents; added the coefficients; did both wrong.
    const { choices, correctIndex } = h.choices(correct, [
      `${c1 * c2}x^${e1 * e2}`,
      `${c1 + c2}x^${e1 + e2}`,
      `${c1 + c2}x^${e1 * e2}`,
      `${c1 * c2}x^${Math.abs(e1 - e2) || 1}`,
      `${c1 * c2}x`,
      `${c1 * c2}x^${e1 + e2 + 1}`,
    ]);
    return {
      stem: `Simplify: (${c1}x^${e1})(${c2}x^${e2})`,
      choices, correctIndex,
      tags: ['algebra', 'exponents'],
      explanation: `Multiply coefficients (${c1} x ${c2} = ${c1 * c2}) and ADD exponents (${e1} + ${e2} = ${e1 + e2}). Multiplying the exponents is the usual slip.`,
    };
  },
});

registerTemplate({
  id: 'mk-exponent-quotient',
  subtest: 'MK',
  band: 3,
  name: 'Dividing powers of the same base',
  concepts: ['exponent-rules'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const c2 = h.int(2, 9);
    let k = h.int(2, 9);
    // c1 - c2 === k (only at c2 = k = 2) makes "subtracted the coefficients" the answer.
    if (c2 * k - c2 === k) k = 3;
    const c1 = c2 * k;
    const e2 = h.int(2, 5);
    let e1 = e2 + h.int(2, 5);
    // ... and round(e1/e2) === e1 - e2 makes "divided the exponents" the answer too.
    if (Math.round(e1 / e2) === e1 - e2) e1 += 1;
    const correct = `${k}x^${e1 - e2}`;
    // Error modes: divided the exponents; subtracted the coefficients; added the exponents;
    // subtracted the exponents the wrong way round.
    const { choices, correctIndex } = h.choices(correct, [
      `${k}x^${Math.round(e1 / e2)}`,
      `${c1 - c2}x^${e1 - e2}`,
      `${k}x^${e1 + e2}`,
      `${k}x^${e2 - e1}`,
      `${c1 - c2}x^${e1 + e2}`,
      `${k}x^${e1}`,
    ]);
    return {
      stem: `Simplify: ${c1}x^${e1} / ${c2}x^${e2}`,
      choices, correctIndex,
      tags: ['algebra', 'exponents'],
      explanation: `Divide the coefficients (${c1} / ${c2} = ${k}) and SUBTRACT the exponents (${e1} - ${e2} = ${e1 - e2}). The coefficients divide; only the exponents subtract.`,
    };
  },
});

registerTemplate({
  id: 'mk-power-of-power',
  subtest: 'MK',
  band: 3,
  name: 'Raising a power to a power',
  concepts: ['exponent-rules'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    // c >= 3 keeps c*n distinct from c^n (2 x 2 = 2^2), and m !== n keeps m*n distinct
    // from m^n. Both collisions would put a distractor on top of the answer.
    const c = h.int(3, 7);
    const m = h.int(2, 7);
    let n = h.int(2, 3);
    if (n === m) n = n === 3 ? 2 : n + 1;
    const correct = `${c ** n}x^${m * n}`;
    // Error modes: left the coefficient alone (the dominant one); added the exponents;
    // multiplied the coefficient by the outer power instead of raising it.
    const { choices, correctIndex } = h.choices(correct, [
      `${c}x^${m * n}`,
      `${c ** n}x^${m + n}`,
      `${c * n}x^${m * n}`,
      `${c ** n}x^${m ** n}`,
      `${c * n}x^${m + n}`,
      `${c ** n}x^${m}`,
    ]);
    return {
      stem: `Simplify: (${c}x^${m})^${n}`,
      choices, correctIndex,
      tags: ['algebra', 'exponents'],
      explanation: `The outer power hits EVERYTHING inside: ${c}^${n} = ${c ** n} and x^(${m} x ${n}) = x^${m * n}. Leaving the coefficient as ${c} is the most common miss.`,
    };
  },
});

registerTemplate({
  id: 'mk-negative-exponent',
  subtest: 'MK',
  band: 3,
  name: 'Negative exponent on a fraction',
  concepts: ['negative-exponents'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const a = h.int(2, 6);
    let b = h.int(2, 7);
    if (b === a) b = a === 7 ? 2 : a + 1;
    const n = h.int(2, 3);
    const correct = `${b ** n}/${a ** n}`;
    // Error modes: never inverted; made the result negative (a negative exponent does not
    // make a negative number); multiplied by n instead of raising to n.
    const { choices, correctIndex } = h.choices(correct, [
      `${a ** n}/${b ** n}`,
      `-${b ** n}/${a ** n}`,
      `-${a ** n}/${b ** n}`,
      `${b * n}/${a * n}`,
      `${a * n}/${b * n}`,
      `${b ** n}/${a}`,
    ]);
    return {
      stem: `Evaluate: (${a}/${b})^-${n}`,
      choices, correctIndex,
      tags: ['exponents'],
      explanation: `A negative exponent means RECIPROCAL, not negative: (${a}/${b})^-${n} = (${b}/${a})^${n} = ${correct}. The sign of the answer never changes.`,
    };
  },
});

registerTemplate({
  id: 'mk-zero-exponent',
  subtest: 'MK',
  band: 3,
  name: 'Terms that cancel to a zero exponent',
  concepts: ['zero-exponent'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const c = h.int(2, 12);
    const m = h.int(2, 7);
    const correct = String(c);
    // Error modes: treated x^0 as 0 (so the whole product vanishes); added the exponents to
    // 2m; kept an x that is no longer there.
    const { choices, correctIndex } = h.choices(correct, [
      '0',
      `${c}x^${2 * m}`,
      `${c}x`,
      `${c}x^${m}`,
      '1',
      `${c}x^-${2 * m}`,
    ]);
    return {
      stem: `Simplify: (${c}x^${m})(x^-${m})`,
      choices, correctIndex,
      tags: ['exponents'],
      explanation: `Add the exponents: ${m} + (-${m}) = 0, and x^0 = 1, so the expression is ${c} x 1 = ${c}. Anything nonzero raised to the zero power is 1, not 0.`,
    };
  },
});

const SQUARE_FACTORS = [4, 9, 16, 25, 36, 49, 64, 100, 121, 144];
const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];

registerTemplate({
  id: 'mk-radical-simplify',
  subtest: 'MK',
  band: 3,
  name: 'Simplifying a square root',
  concepts: ['radicals-simplify'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const s = h.pick(SQUARE_FACTORS);
    const r = h.pick(SQUAREFREE);
    const n = s * r;
    const out = Math.sqrt(s);
    const correct = radical(out, r);
    // Error modes: pulled the square factor out WITHOUT taking its root; swapped what stays
    // in and what comes out; multiplied it all into one integer; left it unsimplified.
    const { choices, correctIndex } = h.choices(correct, [
      radical(s, r),
      radical(r, out),
      String(out * r),
      radical(1, n),
      radical(out, n),
      radical(out + r, 1),
    ]);
    return {
      stem: `Simplify: √${n}`,
      choices, correctIndex,
      tags: ['radicals'],
      explanation: `${n} = ${s} x ${r}, and ${s} is a perfect square, so √${n} = √${s} x √${r} = ${correct}. What comes out of the radical is the ROOT of the square factor (${out}), not the factor itself.`,
    };
  },
});

registerTemplate({
  id: 'mk-scientific-notation',
  subtest: 'MK',
  band: 2,
  name: 'Writing a number in scientific notation',
  concepts: ['scientific-notation'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    let m = h.int(101, 999);
    if (m % 10 === 0) m += 1; // a trailing zero makes two distractors read identically
    const e = h.int(3, 8);
    const mant = `${Math.floor(m / 100)}.${String(m % 100).padStart(2, '0')}`;
    const digits = String(m) + '0'.repeat(e - 2);
    const correct = `${mant} x 10^${e}`;
    // Error modes: the mantissa is not between 1 and 10 (these have the right VALUE but are
    // not scientific notation - the actual discrimination being tested), plus exponents
    // counted one place off in each direction.
    const { choices, correctIndex } = h.choices(correct, [
      `${(m / 10).toFixed(1)} x 10^${e - 1}`,
      `${mant} x 10^${e + 1}`,
      `${mant} x 10^${e - 1}`,
      `${m} x 10^${e - 2}`,
      `0.${String(m).padStart(3, '0')} x 10^${e + 1}`,
    ]);
    return {
      stem: `Write ${digits} in scientific notation.`,
      choices, correctIndex,
      tags: ['exponents'],
      explanation: `Scientific notation needs exactly one nonzero digit before the decimal point: ${correct}. Count the places the point moves - ${e} here. ${(m / 10).toFixed(1)} x 10^${e - 1} is the same NUMBER but is not scientific notation.`,
    };
  },
});
