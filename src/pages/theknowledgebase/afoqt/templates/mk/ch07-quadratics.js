// Chapter 7 — Quadratics.
//
// Three separate skills that look like one topic: reading roots off a factored form, the
// quadratic formula when nothing factors, and the discriminant as a yes/no on real
// solutions. They are separate templates because they are separate questions - the answer
// to "solve it" and the answer to "how many solutions" are different objects.

import { registerTemplate } from '../../engine/generator.js';
import { poly, largestSquareFactor } from '../util.js';

registerTemplate({
  id: 'mk-quadratic-roots-factoring',
  subtest: 'MK',
  band: 3,
  name: 'Solving a quadratic by factoring',
  concepts: ['quadratic-by-factoring'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const p = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let q = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    if (Math.abs(q) === Math.abs(p)) q = (Math.abs(p) === 9 ? 2 : Math.abs(p) + 1) * Math.sign(q);
    const b = p + q, c = p * q;
    const roots = [-p, -q].sort((m, n) => m - n);
    const fmt = (arr) => `x = ${arr[0]} or x = ${arr[1]}`;
    const correct = fmt(roots);
    // Error modes: read the roots straight off the factors without negating them (by far the
    // most common); negated only one; solved a sign-flipped equation.
    const { choices, correctIndex } = h.choices(correct, [
      fmt([p, q].sort((m, n) => m - n)),
      fmt([-p, q].sort((m, n) => m - n)),
      fmt([p, -q].sort((m, n) => m - n)),
      fmt([b, c].sort((m, n) => m - n)),
      fmt([-b, -c].sort((m, n) => m - n)),
    ]);
    return {
      stem: `Solve: ${poly([1, b, c])} = 0`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `It factors as (x ${p < 0 ? '-' : '+'} ${Math.abs(p)})(x ${q < 0 ? '-' : '+'} ${Math.abs(q)}) = 0. Each factor is set to ZERO, so the roots are the negatives of the constants: ${correct}.`,
    };
  },
});

registerTemplate({
  id: 'mk-quadratic-formula',
  subtest: 'MK',
  band: 4,
  name: 'Quadratic formula with irrational roots',
  concepts: ['quadratic-formula'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    // The point of this item is that it does NOT factor - if it did, factoring would be the
    // faster route and the formula would never be exercised. So: discriminant positive,
    // squarefree (nothing comes out of the radical) and never a perfect square.
    const a = h.int(1, 3);
    let b = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    let c = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    let disc = b * b - 4 * a * c;
    for (let i = 0; i < 30 && !(disc > 1 && largestSquareFactor(disc) === 1); i++) {
      c = c > 0 ? -c : -c + 1;
      if (Math.abs(c) > 9) { c = 1; b = Math.abs(b) >= 9 ? 1 : b + Math.sign(b); }
      disc = b * b - 4 * a * c;
    }
    const correct = `(${-b} ± √${disc}) / ${2 * a}`;
    // Error modes: forgot to negate b; sign error inside the discriminant; divided by a
    // instead of 2a; kept only the + root.
    const { choices, correctIndex } = h.choices(correct, [
      `(${b} ± √${disc}) / ${2 * a}`,
      `(${-b} ± √${b * b + 4 * a * c}) / ${2 * a}`,
      `(${-b} ± √${disc}) / ${a}`,
      `(${-b} + √${disc}) / ${2 * a}`,
      `(${-b} ± √${disc}) / 2`,
    ]);
    return {
      stem: `Solve ${poly([a, b, c])} = 0 using the quadratic formula.`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `x = (-b ± √(b² - 4ac)) / 2a with a = ${a}, b = ${b}, c = ${c}. The discriminant is ${b}² - 4(${a})(${c}) = ${disc}, so x = ${correct}. -b means the OPPOSITE of b, and the whole numerator sits over 2a.`,
    };
  },
});

const nature = (d) => (d > 0 ? 'two real solutions' : d === 0 ? 'one real solution' : 'no real solutions');
const misread = (d) => (d > 0 ? 'no real solutions' : 'two real solutions');

registerTemplate({
  id: 'mk-discriminant',
  subtest: 'MK',
  band: 4,
  name: 'Discriminant and the number of real solutions',
  concepts: ['discriminant'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    // a >= 2 on purpose: with a = 1 the "dropped the a" distractor is not an error at all,
    // it is the same number as the answer.
    const a = h.int(2, 5);
    const b = h.int(1, 12) * (h.int(0, 1) ? 1 : -1);
    const c = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    const d = b * b - 4 * a * c;
    const correct = `${d}; ${nature(d)}`;
    // Error modes: sign error on the -4ac term (the one that flips the conclusion); dropped
    // the a; computed 4ac - b²; right number, wrong reading of it.
    const { choices, correctIndex } = h.choices(correct, [
      `${b * b + 4 * a * c}; ${nature(b * b + 4 * a * c)}`,
      `${b * b - 4 * c}; ${nature(b * b - 4 * c)}`,
      `${4 * a * c - b * b}; ${nature(4 * a * c - b * b)}`,
      `${d}; ${misread(d)}`,
      `${b * b}; ${nature(b * b)}`,
    ]);
    return {
      stem: `For ${poly([a, b, c])} = 0, what is the discriminant and how many real solutions are there?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `b² - 4ac = (${b})² - 4(${a})(${c}) = ${d}. Positive means two real solutions, zero means one, negative means none - here, ${nature(d)}. You never have to finish the formula to answer this.`,
    };
  },
});

registerTemplate({
  id: 'mk-parabola-vertex',
  subtest: 'MK',
  band: 4,
  name: 'Vertex of a parabola',
  concepts: ['vertex-and-roots'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    // |a| >= 2: with a = +-1, b is exactly -+2k and every "divided by the wrong thing"
    // distractor collapses onto +-2k, leaving three options on a five-option item.
    const a = h.int(2, 5) * (h.int(0, 1) ? 1 : -1);
    const k = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    const b = -2 * a * k; // makes -b/2a land on the integer k
    const c = h.int(1, 20) * (h.int(0, 1) ? 1 : -1);
    // Error modes: dropped the minus sign; divided by a instead of 2a; halved b without
    // dividing by a; answered with b or c straight off the equation.
    const { choices, correctIndex } = h.choices(k, [
      -k, 2 * k, -2 * k, b, -b, c, b / 2,
    ]);
    return {
      stem: `What is the x-coordinate of the vertex of y = ${poly([a, b, c])}?`,
      choices, correctIndex,
      tags: ['algebra', 'coordinate'],
      explanation: `x = -b / 2a = -(${b}) / (2 x ${a}) = ${k}. The axis of symmetry runs through the vertex, so this is also where the maximum (a < 0) or minimum (a > 0) sits.`,
    };
  },
});

registerTemplate({
  id: 'mk-quadratic-from-roots',
  subtest: 'MK',
  band: 3,
  name: 'Building a quadratic from its roots',
  concepts: ['quadratic-by-factoring'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const r1 = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let r2 = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    // r2 === -r1 zeroes the middle term and r2 === r1 makes it a perfect square; both put a
    // sign-flipped distractor on top of the answer.
    if (Math.abs(r2) === Math.abs(r1)) r2 = (Math.abs(r1) === 9 ? 2 : Math.abs(r1) + 1) * Math.sign(r2);
    const sum = r1 + r2, product = r1 * r2;
    const correct = poly([1, -sum, product]);
    // Error modes: used the roots' signs directly instead of negating the sum; sign slip on
    // the constant; swapped the sum and product slots.
    const { choices, correctIndex } = h.choices(correct, [
      poly([1, sum, product]),
      poly([1, -sum, -product]),
      poly([1, sum, -product]),
      poly([1, -product, sum]),
      poly([1, -sum, product + 1]),
    ]);
    return {
      stem: `Which quadratic equation has roots ${r1} and ${r2}?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `Roots ${r1} and ${r2} come from (x ${-r1 < 0 ? '-' : '+'} ${Math.abs(r1)})(x ${-r2 < 0 ? '-' : '+'} ${Math.abs(r2)}) = 0. Expanded: x² - (sum)x + (product) = ${correct}. The middle coefficient is the NEGATIVE of the sum - that sign is the whole item.`,
    };
  },
});
