// Chapter 6 — Polynomials and factoring.
//
// ⭐ Two of the ten official OATTS Math Knowledge items are AC-method factoring
// (6y^2 - 19y - 7 and 6a^2 + a - 12), which is the hardest thing the real test asks in
// algebra. That is why this chapter carries the most template depth in the math track and
// why the AC template's headline distractor is the SWAPPED constant pair - the one wrong
// answer that multiplies out to the right constant term and the wrong middle term.

import { registerTemplate } from '../../engine/generator.js';
import { poly, binom, gcd } from '../util.js';

const VARS = ['x', 'y', 'a', 'n'];

registerTemplate({
  id: 'mk-polynomial-subtract',
  subtest: 'MK',
  band: 2,
  name: 'Subtracting polynomials',
  concepts: ['polynomial-arithmetic'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(3, 12), b = h.int(3, 14), c = h.int(3, 15);
    const d = h.int(1, a - 1), e = h.int(1, b - 1), f = h.int(1, c - 1);
    const correct = poly([a - d, b - e, c - f]);
    // Error modes: distributed the minus sign to the first term only (the dominant one);
    // added instead of subtracting; reversed the order of subtraction; missed the last term.
    const { choices, correctIndex } = h.choices(correct, [
      poly([a - d, b + e, c + f]),
      poly([a + d, b + e, c + f]),
      poly([d - a, e - b, f - c]),
      poly([a - d, b - e, c + f]),
      poly([a - d, b + e, c - f]),
    ]);
    return {
      stem: `Simplify: (${poly([a, b, c])}) - (${poly([d, e, f])})`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `The minus sign applies to EVERY term in the second polynomial: ${a}-${d}, ${b}-${e}, ${c}-${f} gives ${correct}. Distributing it to the first term only is the mistake this item is built to catch.`,
    };
  },
});

registerTemplate({
  id: 'mk-foil',
  subtest: 'MK',
  band: 3,
  name: 'Multiplying two binomials',
  concepts: ['foil-expansion'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const p = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let q = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    // |q| === |p| is fatal twice over: q === p duplicates the binomials, and q === -p zeroes
    // the middle term - which is exactly the "forgot the middle term" distractor.
    if (Math.abs(q) === Math.abs(p)) q = (Math.abs(p) === 9 ? 2 : Math.abs(p) + 1) * Math.sign(q);
    const correct = poly([1, p + q, p * q]);
    // Error modes: no middle term at all (multiplied first and last only); swapped the sum
    // and the product; sign slip on the constant; doubled the middle term.
    const { choices, correctIndex } = h.choices(correct, [
      poly([1, 0, p * q]),
      poly([1, p * q, p + q]),
      poly([1, p + q, -p * q]),
      poly([1, -(p + q), p * q]),
      poly([1, 2 * (p + q), p * q]),
      poly([1, p + q, p * q + 1]),
    ]);
    return {
      stem: `Expand: (${binom('x', p)})(${binom('x', q)})`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `FOIL: x^2, then the two outer/inner terms ${p} + ${q} = ${p + q}, then ${p} x ${q} = ${p * q}. Result ${correct}. The middle term is the SUM; the constant is the PRODUCT.`,
    };
  },
});

registerTemplate({
  id: 'mk-factor-gcf',
  subtest: 'MK',
  band: 2,
  name: 'Factoring out the greatest common factor',
  concepts: ['factor-gcf'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const g = h.int(2, 9) * 2; // even, so "pulled half the GCF" is an available error mode
    const k = h.int(1, 3);
    const m = h.int(2, 7);
    let n = h.int(2, 9);
    if (n === m) n = m === 9 ? 2 : m + 1;
    const v = h.pick(VARS);
    const vk = k === 1 ? v : `${v}^${k}`;
    const correct = `${g}${vk}(${m}${v} + ${n})`;
    // Error modes: pulled the GCF out front but forgot to divide it back out of the bracket;
    // pulled only half of it; took the wrong power of the variable; pulled the variable
    // only and left the number behind.
    const { choices, correctIndex } = h.choices(correct, [
      `${g}${vk}(${g * m}${v} + ${g * n})`,
      `${g / 2}${vk}(${2 * m}${v} + ${2 * n})`,
      `${g}${v}^${k + 1}(${m}${v} + ${n})`,
      `${vk}(${g * m}${v} + ${g * n})`,
      `${g}${vk}(${m}${v} + ${n}${v})`,
    ]);
    return {
      stem: `Factor completely: ${g * m}${v}^${k + 1} + ${g * n}${vk}`,
      choices, correctIndex,
      tags: ['algebra', 'factoring'],
      explanation: `The GCF of ${g * m} and ${g * n} is ${g}, and both terms carry at least ${vk}. Pulling ${g}${vk} out leaves ${m}${v} + ${n}. Check by distributing back - that catches every error on this item type.`,
    };
  },
});

registerTemplate({
  id: 'mk-difference-of-squares',
  subtest: 'MK',
  band: 3,
  name: 'Difference of squares',
  concepts: ['factor-difference-of-squares'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const c = h.int(1, 9);
    let a = h.int(2, 12);
    if (a === c) a = c === 12 ? 2 : c + 1;
    const v = h.pick(VARS);
    const cv = c === 1 ? v : `${c}${v}`;
    const correct = `(${cv} + ${a})(${cv} - ${a})`;
    // Error modes: treated it as a perfect square (both signs the same); squared the
    // constant instead of taking its root; split the leading coefficient wrongly.
    const { choices, correctIndex } = h.choices(correct, [
      `(${cv} - ${a})^2`,
      `(${cv} + ${a})^2`,
      `(${cv} + ${a * a})(${cv} - ${a * a})`,
      `(${c * c}${v} + ${a})(${v} - ${a})`,
      `${cv}(${cv} - ${a * a})`,
    ]);
    return {
      stem: `Factor: ${c * c}${v}^2 - ${a * a}`,
      choices, correctIndex,
      tags: ['algebra', 'factoring'],
      explanation: `Both terms are perfect squares and they are SUBTRACTED, so it splits into a sum times a difference: ${correct}. A sum of squares (${c * c}${v}^2 + ${a * a}) does not factor at all - recognising which one you are looking at is the whole item.`,
    };
  },
});

registerTemplate({
  id: 'mk-factor-trinomial-monic',
  subtest: 'MK',
  band: 3,
  name: 'Factoring x^2 + bx + c',
  concepts: ['factor-trinomial'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const p = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let q = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    if (Math.abs(q) === Math.abs(p)) q = Math.abs(p) === 9 ? 2 * Math.sign(q) : (Math.abs(p) + 1) * Math.sign(q);
    const b = p + q;
    const c = p * q;
    const correct = `(${binom('x', p)})(${binom('x', q)})`;
    // Error modes: signs flipped (all three ways they can be); and the pair that multiplies
    // to c but does NOT add to b - the mistake of stopping at the first factor pair found.
    const { choices, correctIndex } = h.choices(correct, [
      `(${binom('x', -p)})(${binom('x', -q)})`,
      `(${binom('x', p)})(${binom('x', -q)})`,
      `(${binom('x', -p)})(${binom('x', q)})`,
      `(${binom('x', 1)})(${binom('x', c)})`,
      `(${binom('x', b)})(${binom('x', 1)})`,
    ]);
    return {
      stem: `Factor: ${poly([1, b, c])}`,
      choices, correctIndex,
      tags: ['algebra', 'factoring'],
      explanation: `Find two numbers that MULTIPLY to ${c} and ADD to ${b}: ${p} and ${q}. So ${correct}. Both conditions have to hold - a pair that only multiplies correctly is the trap.`,
    };
  },
});

registerTemplate({
  id: 'mk-factor-ac',
  subtest: 'MK',
  band: 4,
  name: 'Factoring ax^2 + bx + c (AC method)',
  concepts: ['factor-ac-method', 'factor-trinomial'],
  calibratedAgainst: 'oatts',
  provenance: { kind: 'derived', source: 'OATTS Math Knowledge answer key (6y^2 - 19y - 7)', url: 'https://af-oatts.github.io/' },
  generate: (rng, h) => {
    // r >= 2 on purpose. With r === 1 the "all of a on one factor" distractor is just the
    // swapped-constants distractor written in the other order - two options that are the
    // same expression. Both official AC items look like this too: 6y^2 - 19y - 7 splits 3x2.
    const p = h.int(2, 6);
    let r = h.int(2, 5);
    // p === r turns "swapped the constants" into a commutative reorder of the SAME answer,
    // and it also produces difference-of-squares items that belong to the other template.
    if (r === p) r = p === 5 ? 2 : r + 1;
    // Gauss's lemma: if each binomial is primitive, their product is too - which is what
    // guarantees the printed trinomial is ALREADY fully factored. Walking s alone could not
    // achieve that (with q and a both even, every s leaves a common factor of 2), which is
    // how 8x^2 - 36x + 36 got through.
    const qOpts = [];
    for (let k = 1; k <= 9; k++) if (gcd(k, p) === 1) qOpts.push(k, -k);
    const sOpts = [];
    for (let k = 1; k <= 9; k++) if (gcd(k, r) === 1) sOpts.push(k, -k);
    const q = h.pick(qOpts);
    let s = h.pick(sOpts);
    const from = sOpts.indexOf(s);
    for (let i = 0; i < sOpts.length; i++) {
      const cand = sOpts[(from + i) % sOpts.length];
      const b = p * cand + q * r;
      const ok = p * cand !== q * r   // swapping the constants must actually change the item
        && q !== cand                 // ... and must not be a no-op
        && q !== -cand                // ... and must not coincide with flipping both signs
        && b !== 0;                   // a zero middle term is a difference of squares
      if (ok) { s = cand; break; }
    }
    const v = h.pick(VARS);
    const a = p * r, b = p * s + q * r, c = q * s;
    const pv = `${p}${v}`;
    const rv = r === 1 ? v : `${r}${v}`;
    const correct = `(${binom(pv, q)})(${binom(rv, s)})`;
    // ⭐ The headline error mode: swapping the two constants keeps a and c correct and gets
    // b wrong, so it survives every check except actually multiplying the middle term out.
    const { choices, correctIndex } = h.choices(correct, [
      `(${binom(pv, s)})(${binom(rv, q)})`,
      `(${binom(pv, -q)})(${binom(rv, -s)})`,
      `(${binom(pv, q)})(${binom(rv, -s)})`,
      `(${binom(v, q)})(${binom(`${a}${v}`, s)})`,
      `(${binom(pv, -s)})(${binom(rv, -q)})`,
    ]);
    return {
      stem: `Factor: ${poly([a, b, c], v)}`,
      choices, correctIndex,
      tags: ['algebra', 'factoring'],
      explanation: `AC method: ${a} x ${c} = ${a * c}. Find two numbers multiplying to ${a * c} and adding to ${b} (${p * s} and ${q * r}), split the middle term, then factor by grouping: ${correct}. Multiply the outer and inner terms back out - swapping the constants gives the right ${c} and the wrong middle term.`,
    };
  },
});
