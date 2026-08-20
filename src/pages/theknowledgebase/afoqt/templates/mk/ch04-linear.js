// Chapter 4 — Linear equations, inequalities and systems.
//
// The single highest-frequency algebra topic on the test. Band 1 is the one-step warm-up;
// the real work is the sign discipline in bands 3-4 - moving a term across the equals sign,
// FLIPPING an inequality when you divide by a negative, and answering with the variable the
// question actually asked for.

import { registerTemplate } from '../../engine/generator.js';

registerTemplate({
  id: 'mk-linear-one-step',
  subtest: 'MK',
  band: 1,
  name: 'One-step linear equation',
  concepts: ['linear-equations'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const x = h.int(2, 12);
    const a = h.int(2, 9);
    // b > a keeps "forgot to subtract b" from rounding back onto the correct answer.
    const b = h.int(a + 1, a + 20);
    const c = a * x + b;
    // Error modes: forgot to subtract b; subtracted then forgot to divide; sign slip on b.
    const { choices, correctIndex } = h.choices(x, [
      Math.round(c / a),
      c - b,
      Math.round((c + b) / a),
      c + b,
      a * b,
      c,
      a + b,
    ]);
    return {
      stem: `If ${a}x + ${b} = ${c}, what is x?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `${a}x = ${c} - ${b} = ${c - b}. x = ${c - b} / ${a} = ${x}.`,
    };
  },
});

registerTemplate({
  id: 'mk-linear-both-sides',
  subtest: 'MK',
  band: 3,
  name: 'Linear equation with the variable on both sides',
  concepts: ['linear-equations'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const x = h.int(2, 14);
    const a = h.int(3, 12);
    const c = h.int(1, a - 2);
    const b = h.int(2, 30);
    const d = (a - c) * x + b;
    // Error modes: sign slip moving b across; ADDED the two x-coefficients instead of
    // subtracting; forgot to divide at the end; reversed the subtraction (gives -x).
    const { choices, correctIndex } = h.choices(x, [
      Math.round((d + b) / (a - c)),
      Math.round((d - b) / (a + c)),
      d - b,
      -x,
      Math.round((d - b) / c),
      Math.round((d - b) / a),
      (d - b) * (a - c),
      a - c,
      Math.round((d + b) / (a + c)),
    ]);
    return {
      stem: `Solve for x: ${a}x + ${b} = ${c}x + ${d}`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `Collect x on the left and constants on the right: ${a}x - ${c}x = ${d} - ${b}, so ${a - c}x = ${d - b} and x = ${x}. Subtract the coefficients - adding them to ${a + c} is the usual slip.`,
    };
  },
});

registerTemplate({
  id: 'mk-linear-inequality',
  subtest: 'MK',
  band: 3,
  name: 'Inequality with a negative coefficient',
  concepts: ['linear-inequalities'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const m = h.int(2, 9);
    const k = h.int(2, 12);
    const b = h.int(5, 40);
    const c = b - m * k;
    // -mx + b < c  =>  -mx < c - b  =>  x > (b - c)/m  =>  x > k
    const correct = `x > ${k}`;
    // Error modes: did not flip the inequality when dividing by a negative (the entire
    // point of the item); sign slip on the constant; forgot to divide by m.
    const { choices, correctIndex } = h.choices(correct, [
      `x < ${k}`,
      `x > ${-k}`,
      `x < ${-k}`,
      `x > ${m * k}`,
      `x < ${m * k}`,
    ]);
    return {
      stem: `Solve for x: -${m}x + ${b} < ${c}`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `-${m}x < ${c} - ${b} = ${c - b}. Dividing both sides by -${m} REVERSES the inequality: x > ${k}. Dividing or multiplying by a negative is the only step that flips the sign - adding and subtracting never do.`,
    };
  },
});

registerTemplate({
  id: 'mk-literal-equation',
  subtest: 'MK',
  band: 3,
  name: 'Solving for one variable in terms of others',
  concepts: ['literal-equations'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(2, 12);
    const b = h.int(2, 12);
    const correct = `(c - ${b}y)/${a}`;
    // Error modes: sign slip moving the y-term; divided only the first term by a; multiplied
    // by a instead of dividing; divided by the wrong coefficient.
    const { choices, correctIndex } = h.choices(correct, [
      `(c + ${b}y)/${a}`,
      `c/${a} - ${b}y`,
      `${a}(c - ${b}y)`,
      `(c - ${b}y)/${b}`,
      `(${b}y - c)/${a}`,
      `c - ${b}y - ${a}`,
    ]);
    return {
      stem: `Solve for x: ${a}x + ${b}y = c`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `Move the y-term first: ${a}x = c - ${b}y. Then divide EVERYTHING on the right by ${a}: x = (c - ${b}y)/${a}. Dividing only the c gives c/${a} - ${b}y, which is the classic half-done answer.`,
    };
  },
});

registerTemplate({
  id: 'mk-system-two-equations',
  subtest: 'MK',
  band: 4,
  name: 'System of two linear equations',
  concepts: ['systems-of-equations'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const x = h.int(2, 12);
    let y = h.int(2, 12);
    if (y === x) y = x === 12 ? 2 : x + 1; // else "answered with y" stops being a distractor
    const a = h.int(2, 6);
    const b = h.int(1, 6);
    const p = h.int(1, 6);
    let q = h.int(1, 6);
    if (a * q === b * p) q = q === 6 ? 1 : q + 1; // keep the system independent
    const c = a * x + b * y;
    const r = p * x - q * y;
    // Error modes: solved correctly but reported the OTHER variable (by far the most common
    // way to lose this item); sign slip during elimination; answered with the sum.
    const { choices, correctIndex } = h.choices(x, [
      y, x + y, Math.abs(x - y), -x, x + 1, Math.round((c + r) / (a + p)),
    ]);
    return {
      stem: `If ${a}x + ${b}y = ${c} and ${p}x - ${q}y = ${r}, what is x?`,
      choices, correctIndex,
      tags: ['algebra'],
      explanation: `Multiply the first by ${q} and the second by ${b}, then add to eliminate y: x = ${x} (and y = ${y}). Re-read the question before you mark - it asks for x, and ${y} is sitting right there on the page.`,
    };
  },
});
