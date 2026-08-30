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
      explanation: `Order of operations (PEMDAS) is a strict priority list, not a suggestion: work out anything inside Parentheses first, then Exponents, then Multiplication/Division left to right, and only then Addition/Subtraction left to right - each step must fully finish before the next one starts. Here the parentheses go first: ${c} - ${d} = ${diff}. That result gets squared next, because the exponent applies to the whole parenthetical group, not to ${c} and ${d} individually: ${diff}^2 = ${diff ** 2}. Only now does multiplication happen: ${b} x ${diff ** 2} = ${b * diff ** 2}. Addition is last: ${a} + ${b * diff ** 2} = ${correct}. The trap built into this shape is that (${c} - ${d})^2 is NOT ${c}^2 - ${d}^2: squaring a difference means multiplying (${c} - ${d}) by itself, which expands to ${c}^2 - 2(${c})(${d}) + ${d}^2 - treating the exponent as if it applies to each term separately silently drops that middle "cross" term entirely, and a dropped term is a different number, not a rounding error.`,
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
      explanation: `A fraction's denominator names the SIZE of the pieces being counted, and piece-counts can only be added directly once both fractions are counting the same size piece - so before ${a}/${b} and ${c}/${d} can be added, both need to be rewritten over a shared denominator. Multiplying the two denominators together (${b} x ${d} = ${b * d}) always produces a valid shared one. To keep each fraction's VALUE unchanged while its denominator changes, whatever the bottom is multiplied by, the top must be multiplied by too: ${a}/${b} becomes ${a * d}/${b * d}, and ${c}/${d} becomes ${c * b}/${b * d}. Only once both fractions count the same-size pieces can the numerators be added directly: ${a * d} + ${c * b} = ${a * d + c * b}, over ${b * d}, which is ${correct}. The trap is adding straight across the ORIGINAL fractions - numerator plus numerator, denominator plus denominator, giving ${frac(a + c, b + d).s} - which is never valid, because it changes what size piece is being counted partway through instead of converting both fractions to a common size first.`,
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
      explanation: `A mixed number like ${w1} ${n1}/${d1} is shorthand for a whole number PLUS a fraction added together, not a single multiplicative unit - so before two mixed numbers can be multiplied, each must first be rewritten as one improper fraction. To convert, multiply the whole number by the denominator and add the existing numerator: ${w1} ${n1}/${d1} becomes (${w1} x ${d1} + ${n1})/${d1} = ${i1}/${d1}, and ${w2} ${n2}/${d2} becomes ${i2}/${d2} the same way. Once both are plain fractions, multiplying is straightforward - numerator times numerator, denominator times denominator: ${i1} x ${i2} over ${d1} x ${d2} = ${i1 * i2}/${d1 * d2}, which is ${correct}. The trap is multiplying the whole-number parts together and the fraction parts together SEPARATELY, then adding those two results (${mixed(w1 * w2 * d1 * d2 + n1 * n2, d1 * d2)}) - that looks reasonable but silently discards two "cross" pieces a real multiplication produces (one whole part times the other's fraction, both ways), the same missing-cross-term mistake that shows up when squaring a binomial. Converting to an improper fraction first isn't a formality; it's what forces those cross terms to be included automatically.`,
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
      explanation: `Absolute value bars mean "distance from zero," which is always zero or positive - but that positivity applies only to what's directly INSIDE one pair of bars, and stops the instant you step outside them. There are two separate absolute-value expressions here, so each resolves independently first: |${a} - ${b}| = ${first} and |${c} - ${d}| = ${second} (both differences are negative before the bars, and the bars flip them positive). Only after both bars are resolved does the OUTER subtraction happen: ${first} - ${second} = ${correct}. The trap is assuming that because absolute values are involved, the final answer must also come out positive - but there are no bars around the outer subtraction itself, so once each bar has done its one job, ordinary subtraction (which can absolutely go negative) takes over for what's left. Treating "|x| - |y|" as if it behaves like "|x - y|" is a different expression, with the bars in a different place and no rule guaranteeing a positive result.`,
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
      explanation: `Percent literally means "per hundred," so turning any decimal into a percent is always the same mechanical move: multiply by 100, which shifts the decimal point exactly two places to the RIGHT. Here, ${dec} x 100 = ${correct}. A common wrong answer just tacks a "%" sign directly onto the original digits with no shift at all (${n}%) - but a percent sign isn't decoration, it's shorthand for "divide by 100," so leaving the value unshifted while adding that sign silently changes what the number means. Other wrong answers on this question type come from shifting the right direction but the wrong number of places - one place instead of two, or three instead of two. Decimal-to-percent conversions are unforgiving about exactly two places, never more and never fewer.`,
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
      explanation: `Turning English into algebra means finding the operation each key phrase names, then writing the pieces in the order the MATH needs - which is not always the order the words appear in. "${t.phrase}" becomes ${t.correct}. Most phrases translate left to right exactly as read: "the sum of," "the product of," "times," and "increased by" all just insert their operation between the two quantities in the order given. A specific handful of phrases work backwards from how they read: "X less than Y" means Y − X, not X − Y, and "X subtracted from Y" means Y − X as well - in both, the quantity named FIRST is the one being taken away, not the one being taken away from. "Decreased by" looks like it belongs in that same reversing group but does not: "Y decreased by X" keeps natural order, Y − X, because "decreased by" describes what happens TO the first-named quantity rather than naming something being subtracted from a later one. Reading which specific phrase is in play - not just recognizing "a subtraction is here somewhere" - is what separates a translation that merely looks plausible from one that is actually correct.`,
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
      explanation: `The Greatest Common Factor (GCF) of two numbers is the largest number that divides evenly into BOTH of them, so it can never be larger than the smaller of the two. Breaking each number down as (shared factor) x (leftover factor) shows this directly: ${a} = ${g} x ${m} and ${b} = ${g} x ${n}. The ${g} is common to both - and since ${m} and ${n} themselves share no factor between them, there's nothing bigger left to pull out, which makes ${g} the greatest common factor. The trap on this question type is answering ${g * m * n} instead - a real number, just the answer to the OPPOSITE question: it's the Least Common Multiple (the smallest number both ${a} and ${b} divide INTO), not the greatest common factor (the largest number that divides INTO both of them). GCF and LCM move in opposite directions - one shrinks toward the smaller starting number, the other grows past the larger one - so confusing them produces an answer bigger than both original numbers instead of smaller.`,
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
      explanation: `The Least Common Multiple (LCM) of two numbers is the SMALLEST number both of them divide into evenly, so it can never be smaller than the larger of the two. The reliable way to find it is LCM = (first number x second number) / GCF - dividing by the GCF is necessary because simply multiplying the two numbers (${a} x ${b} = ${a * b}) double-counts whatever factor they already share. The GCF of ${a} and ${b} is ${gcd(a, b)}, so LCM = ${a * b} / ${gcd(a, b)} = ${correct}. The trap is stopping after the multiplication and answering ${a * b} directly - that number IS a common multiple (both ${a} and ${b} do divide into it evenly), but it is only the LEAST one when the two numbers share no factor to begin with. Since ${a} and ${b} do share a factor here (${gcd(a, b)}), skipping the division step gives a real but needlessly large common multiple, not the smallest one the question actually asks for.`,
    };
  },
});
