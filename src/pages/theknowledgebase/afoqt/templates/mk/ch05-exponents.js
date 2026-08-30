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
      explanation: `In an expression like ${c1}x^${e1}, the ${c1} out front is the coefficient (the plain number multiplying the variable), and the ${e1} is the exponent - it says how many times x, the base, gets multiplied by itself. When two expressions with the SAME base are multiplied, the coefficients multiply together normally (${c1} x ${c2} = ${c1 * c2}), but the exponents ADD rather than multiply: x^${e1} times x^${e2} means "x multiplied by itself ${e1} times, then ${e2} MORE times," which is x multiplied by itself ${e1 + e2} times total. So (${c1}x^${e1})(${c2}x^${e2}) = ${c1 * c2}x^${e1 + e2}. The trap is multiplying the exponents instead of adding them (giving x^${e1 * e2}) - that operation belongs to a DIFFERENT situation, raising an already-exponentiated term to another power, not to multiplying two separate powers of x together.`,
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
      explanation: `Dividing two powers of the same base works almost like multiplying them, but in reverse: the coefficients (the plain numbers out front) divide normally, while the exponents (which count repeated multiplications of the base) SUBTRACT instead of adding. That's because x^${e1} / x^${e2} means "${e1} copies of x, with ${e2} of them cancelled by the division," leaving x^${e1 - e2}. Applying that: the coefficients divide to ${c1} / ${c2} = ${k}, and the exponents subtract to ${e1} - ${e2} = ${e1 - e2}, giving ${k}x^${e1 - e2}. A common mistake is subtracting the coefficients instead of dividing them (giving ${c1 - c2} instead of ${k}) - the coefficients and exponents deliberately follow OPPOSITE rules here: the coefficients are just ordinary numbers being divided, while the exponents are counts of repeated multiplication being cancelled out, which is a subtraction of counts, not a division.`,
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
      explanation: `Raising an already-exponentiated expression to another power - (${c}x^${m})^${n} - means multiplying the ENTIRE expression inside the parentheses by itself ${n} times, which applies the outer exponent to every piece inside, including the plain-number coefficient, not just the variable. The coefficient ${c} raised to the ${n} power is ${c ** n} (not left as plain ${c}), and the exponent on x multiplies rather than adds, because "x^${m}, repeated ${n} times over" means x has now been multiplied by itself ${m} x ${n} = ${m * n} times total. So (${c}x^${m})^${n} = ${c ** n}x^${m * n}. The single most common miss is leaving the coefficient unchanged as ${c} while still correctly updating the exponent on x - the outer power applies to everything inside the parentheses, a plain number exactly as much as a variable with an exponent.`,
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
      explanation: `A negative exponent is an instruction to take the RECIPROCAL of whatever is being raised to that power, and then apply the power as a positive number - it is not an instruction to make the result negative. (A reciprocal is what you get by flipping a fraction upside down, swapping which number is on top and which is on bottom: the reciprocal of ${a}/${b} is ${b}/${a}.) This rule exists because exponents follow a consistent pattern - each time the exponent goes down by 1, the value gets divided by the base one more time, and dividing by something repeatedly is the same as multiplying by its reciprocal repeatedly, so a negative exponent is simply that pattern continued past zero. So (${a}/${b})^-${n} means: first flip the fraction to its reciprocal, ${b}/${a}, THEN raise that to the positive power ${n}: (${b}/${a})^${n} = ${b ** n}/${a ** n}. The trap is treating the minus sign as if it belongs to the final ANSWER, making the result negative (-${b ** n}/${a ** n}) - but the negative sign on the exponent is an instruction about flipping the fraction, not a sign that carries through to the value itself. A second trap is forgetting to flip at all and applying the exponent directly to ${a}/${b}, which uses the wrong fraction entirely.`,
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
      explanation: `Multiplying two powers of the same base adds their exponents - the same rule from earlier in this chapter - so x^${m} times x^-${m} gives x^(${m} + (-${m})) = x^0. Any nonzero base raised to the power of zero equals exactly 1, never 0, because dividing a power by itself must always equal 1 (x^${m} / x^${m} is obviously 1, and dividing powers of the same base is the same operation as subtracting their exponents down to zero). So the x^0 here simply becomes 1, and the whole expression collapses to ${c} x 1 = ${c}. The trap is treating x^0 as "zero copies of x, so the term vanishes to nothing" - exponent rules about adding and subtracting apply to the count in the exponent itself, not to an intuition about emptiness, and a zero exponent is a well-defined value (1), never a signal to erase the term.`,
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
      explanation: `A radical (the √ symbol) is asking "what number, multiplied by itself, gives this value" - and simplifying one means checking whether the number underneath has a PERFECT SQUARE hiding inside it as a factor (a perfect square is a number that is some whole number times itself, like ${s} = ${out} x ${out}). Here ${n} breaks down into ${s} x ${r}, and ${s} is a perfect square (√${s} = ${out} exactly), so the square root can be split across the multiplication: √${n} = √${s} x √${r}. Only the perfect-square piece gets a clean root pulled out of it - √${s} becomes the whole number ${out}, while √${r} stays under the radical because ${r} has no perfect-square factor left inside it to extract. So √${n} = ${correct}. The trap is pulling ${s} out from under the radical WITHOUT actually taking its square root first - leaving ${s}√${r} instead of ${out}√${r} - but the whole point of spotting a perfect-square factor is replacing it with its OWN root, not just relocating the same number to outside the radical sign.`,
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
      explanation: `Scientific notation writes any number as a single digit from 1-9, followed by a decimal point and the remaining digits, multiplied by a power of ten - the power of ten's job is to record how many places the decimal point had to move to get there. Starting from ${digits}, the decimal point (currently after all the digits) has to move left until only one digit (${Math.floor(m / 100)}) remains in front of it: that takes ${e} moves, which is exactly why the exponent on the 10 is ${e}. So ${digits} becomes ${mant} x 10^${e}. A number can be arithmetically correct and still NOT be in scientific notation - ${(m / 10).toFixed(1)} x 10^${e - 1} equals the exact same value, but its leading part (${(m / 10).toFixed(1)}) is 10 or greater, which breaks the "exactly one digit before the decimal point" rule scientific notation requires. Counting the decimal point's moves carefully, rather than guessing at the exponent, is what keeps the leading digit correctly between 1 and 9.`,
    };
  },
});
