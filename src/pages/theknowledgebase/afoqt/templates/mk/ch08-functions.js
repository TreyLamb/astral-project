// Chapter 8 — Functions and sequences.
//
// Function notation is mostly a substitution exercise with a sign trap; composition is a
// direction trap (f(g(x)) is not g(f(x))); sequences are an off-by-one trap (the nth term
// uses n - 1 steps, not n). All three appear on the AFOQT in their plainest form - there is
// no calculus and no trigonometry anywhere on this test.

import { registerTemplate } from '../../engine/generator.js';
import { poly, binom } from '../util.js';

registerTemplate({
  id: 'mk-function-evaluate',
  subtest: 'MK',
  band: 2,
  name: 'Evaluating a function',
  concepts: ['function-notation'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(2, 6);
    const b = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    const c = h.int(1, 12) * (h.int(0, 1) ? 1 : -1);
    const k = -h.int(2, 7); // negative input, so the squaring trap is live
    const correct = a * k * k + b * k + c;
    // Error modes: squared the input but kept the sign negative (-k^2 instead of (-k)^2);
    // multiplied the input by a before squaring; dropped the constant; sign slip on bx.
    const { choices, correctIndex } = h.choices(correct, [
      -a * k * k + b * k + c,
      a * (k * k) * a + b * k + c,
      a * k * k + b * k,
      a * k * k - b * k + c,
      a * k + b * k + c,
      a * k * k + b * k - c,
    ]);
    return {
      stem: `If f(x) = ${poly([a, b, c])}, what is f(${k})?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `f(${k}) = ${a}(${k})² ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${k}) ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${a * k * k} ${b * k < 0 ? '-' : '+'} ${Math.abs(b * k)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${correct}. (${k})² is POSITIVE ${k * k}; only -${k}² would be negative.`,
    };
  },
});

registerTemplate({
  id: 'mk-function-composition',
  subtest: 'MK',
  band: 4,
  name: 'Composing two functions',
  concepts: ['function-composition'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const a = h.int(2, 6);
    const b = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    const c = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    let k = h.int(2, 7);
    const f = (x) => a * x + b;
    const g = (x) => x * x + c;
    // Two degeneracies to walk away from: f(g(k)) === g(f(k)) makes the headline distractor
    // the answer, and f(k) === 0 collapses three of the others onto each other.
    for (let i = 0; i < 8 && (f(g(k)) === g(f(k)) || f(k) === 0); i++) k += 1;
    const correct = f(g(k));
    // ⭐ Error mode number one: ran the composition in the wrong order.
    const { choices, correctIndex } = h.choices(correct, [
      g(f(k)),
      f(k) * g(k),
      f(k) + g(k),
      a * k * k + c,
      g(g(k)),
      f(f(k)),
      f(k),
      g(k),
    ]);
    return {
      stem: `If f(x) = ${binom(`${a}x`, b)} and g(x) = ${binom('x^2', c)}, what is f(g(${k}))?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `Work from the INSIDE out: g(${k}) = ${g(k)}, then f(${g(k)}) = ${correct}. Reversing the order gives g(f(${k})) = ${g(f(k))} - a different function entirely.`,
    };
  },
});

registerTemplate({
  id: 'mk-domain-restriction',
  subtest: 'MK',
  band: 3,
  name: 'Values excluded from a domain',
  concepts: ['domain-restrictions'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const p = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let q = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    if (Math.abs(q) === Math.abs(p)) q = (Math.abs(p) === 9 ? 2 : Math.abs(p) + 1) * Math.sign(q);
    let n = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    if (n === p || n === q) n = Math.abs(n) === 9 ? 1 : n + 1;
    const fmt = (arr) => `x = ${arr[0]} and x = ${arr[1]}`;
    const roots = [-p, -q].sort((m, o) => m - o);
    const correct = fmt(roots);
    // Error modes: took the constants without negating; solved the NUMERATOR (that is where
    // the function is zero, not undefined); found only one of the two.
    const { choices, correctIndex } = h.choices(correct, [
      fmt([p, q].sort((m, o) => m - o)),
      `x = ${-n}`,
      `x = ${roots[0]}`,
      'x = 0',
      fmt([-p, q].sort((m, o) => m - o)),
    ]);
    return {
      stem: `For what values of x is f(x) = (${binom('x', n)}) / (${poly([1, p + q, p * q])}) undefined?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `A fraction is undefined where its DENOMINATOR is zero. ${poly([1, p + q, p * q])} factors as (x ${p < 0 ? '-' : '+'} ${Math.abs(p)})(x ${q < 0 ? '-' : '+'} ${Math.abs(q)}), so ${correct}. The numerator's zero (x = ${-n}) is where f is zero, not undefined.`,
    };
  },
});

registerTemplate({
  id: 'mk-arithmetic-sequence',
  subtest: 'MK',
  band: 3,
  name: 'nth term of an arithmetic sequence',
  concepts: ['arithmetic-sequence'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a1 = h.int(2, 20);
    let d = h.int(3, 12) * (h.int(0, 1) ? 1 : -1);
    // d === a1 collapses three distractors onto the answer at once (a1 + nd, nd and a1*n all
    // coincide), because every one of them is then just a multiple of the same number.
    if (Math.abs(d) === a1) d = (Math.abs(d) === 12 ? 3 : Math.abs(d) + 1) * Math.sign(d);
    const n = h.int(9, 30);
    const correct = a1 + (n - 1) * d;
    const shown = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d].join(', ');
    // ⭐ Off-by-one is the whole item: the 20th term takes NINETEEN steps.
    const { choices, correctIndex } = h.choices(correct, [
      a1 + n * d,
      a1 + (n - 2) * d,
      n * d,
      a1 * n,
      (n - 1) * d,
      a1 + d,
    ]);
    return {
      stem: `What is the ${n}th term of the sequence ${shown}, ...?`,
      choices, correctIndex,
      tags: ['algebra', 'sequences'],
      explanation: `Common difference d = ${d}. The nth term is a₁ + (n - 1)d = ${a1} + ${n - 1}(${d}) = ${correct}. It is (n - 1) steps, not n - the first term is already there before you take any.`,
    };
  },
});

registerTemplate({
  id: 'mk-geometric-sequence',
  subtest: 'MK',
  band: 4,
  name: 'nth term of a geometric sequence',
  concepts: ['geometric-sequence'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const a1 = h.int(2, 12);
    const r = h.int(2, 4);
    const n = h.int(5, 8);
    const correct = a1 * r ** (n - 1);
    const shown = [a1, a1 * r, a1 * r * r, a1 * r ** 3].join(', ');
    // Error modes: r^n instead of r^(n-1); multiplied by r*n; treated it as arithmetic.
    const { choices, correctIndex } = h.choices(correct, [
      a1 * r ** n,
      a1 * r ** (n - 2),
      a1 * r * n,
      a1 + (n - 1) * r,
      a1 * n,
      r ** (n - 1),
    ]);
    return {
      stem: `What is the ${n}th term of the sequence ${shown}, ...?`,
      choices, correctIndex,
      tags: ['algebra', 'sequences'],
      explanation: `Each term is ${r} times the one before, so the nth term is a₁ · r^(n-1) = ${a1} · ${r}^${n - 1} = ${correct}. Same off-by-one as arithmetic sequences: n - 1 multiplications, not n.`,
    };
  },
});
