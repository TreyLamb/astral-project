// Chapter 12 — Coordinate geometry.
//
// Five formulas, and four of them are the same idea: subtract the coordinates. The errors
// are almost all orientation errors - run over rise, x and y swapped, a sign lost on the way
// down - so the distractors are the same numbers arranged wrongly rather than different
// numbers, which is exactly how the real test writes them.

import { registerTemplate } from '../../engine/generator.js';
import { frac, TRIPLES, binom, sweep } from '../util.js';

registerTemplate({
  id: 'mk-slope-two-points',
  subtest: 'MK',
  band: 2,
  name: 'Slope through two points',
  concepts: ['slope'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const x1 = h.int(-9, 9);
    const y1 = h.int(-9, 9);
    let dx = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    let dy = h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    // |dy| === |dx| makes the inverted distractor equal to the answer (or its negative).
    if (Math.abs(dy) === Math.abs(dx)) dy = (Math.abs(dy) === 9 ? 2 : Math.abs(dy) + 1) * Math.sign(dy);
    const x2 = x1 + dx, y2 = y1 + dy;
    const correct = frac(dy, dx).s;
    // Error modes: run over rise; sign lost by subtracting in opposite orders; added the
    // coordinates instead of subtracting; answered with the rise alone.
    const { choices, correctIndex } = h.choices(correct, [
      frac(dx, dy).s,
      frac(-dy, dx).s,
      frac(dx, -dy).s,
      x1 + x2 !== 0 ? frac(y1 + y2, x1 + x2).s : frac(y1 + y2, dx).s,
      frac(dy, 1).s,
      frac(dx, 1).s,
    ]);
    return {
      stem: `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `Slope = rise/run = (${y2} - ${y1}) / (${x2} - ${x1}) = ${dy}/${dx} = ${correct}. Subtract in the SAME order top and bottom; swapping one of them flips the sign.`,
    };
  },
});

registerTemplate({
  id: 'mk-midpoint',
  subtest: 'MK',
  band: 2,
  name: 'Midpoint of a segment',
  concepts: ['midpoint'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    // Each pair shares a parity, so the midpoint lands on whole numbers.
    //
    // Neither endpoint coordinate may be zero. Where x1 = 0, (x2 - x1)/2 IS (x1 + x2)/2, so
    // "halved the difference instead of the sum" stops being a wrong answer in that
    // coordinate - and no sweep can rescue a slate whose collision does not depend on the
    // value being swept.
    let x1 = h.int(-12, 11);
    if (x1 >= 0) x1 += 1;
    let y1 = h.int(-12, 11);
    if (y1 >= 0) y1 += 1;
    const x2 = x1 + 2 * h.int(1, 9) * (h.int(0, 1) ? 1 : -1);
    // Every option here is built from the same four numbers, so pairs of them coincide more
    // often than they look like they would - a midpoint on y = x makes the "swapped the
    // coordinates" option a no-op, and one particular segment made TWO options collide at
    // once. Sweep the second endpoint for an offset where the whole slate is distinct.
    const dyFor = (k) => (k <= 9 ? k : -(k - 9)) * 2;
    const k = sweep(1, 18, h.int(1, 18), (cand) => {
      const dy = dyFor(cand);
      const ey = y1 + dy;
      const cx = (x1 + x2) / 2, cy = (y1 + ey) / 2;
      return [`(${cx}, ${cy})`, `(${x1 + x2}, ${y1 + ey})`, `(${(x2 - x1) / 2}, ${dy / 2})`,
        `(${cy}, ${cx})`, `(${cx}, ${dy / 2})`, `(${x2 - x1}, ${dy})`];
    });
    const y2 = y1 + dyFor(k);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const correct = `(${mx}, ${my})`;
    // Error modes: forgot to halve; subtracted instead of averaging; swapped x and y;
    // averaged one coordinate and differenced the other.
    const { choices, correctIndex } = h.choices(correct, [
      `(${x1 + x2}, ${y1 + y2})`,
      `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`,
      `(${my}, ${mx})`,
      `(${mx}, ${(y2 - y1) / 2})`,
      `(${x2 - x1}, ${y2 - y1})`,
    ]);
    return {
      stem: `What is the midpoint of the segment joining (${x1}, ${y1}) and (${x2}, ${y2})?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `Average each coordinate: ((${x1} + ${x2})/2, (${y1} + ${y2})/2) = ${correct}. Midpoint AVERAGES; distance and slope SUBTRACT - that is the only thing to keep straight here.`,
    };
  },
});

registerTemplate({
  id: 'mk-distance-two-points',
  subtest: 'MK',
  band: 3,
  name: 'Distance between two points',
  concepts: ['distance-formula'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const [a0, b0, c0] = h.pick(TRIPLES.slice(0, 6));
    const k = h.int(1, 2);
    const dx = a0 * k * (h.int(0, 1) ? 1 : -1);
    const dy = b0 * k * (h.int(0, 1) ? 1 : -1);
    const x1 = h.int(-8, 8), y1 = h.int(-8, 8);
    const correct = c0 * k;
    // Error modes: added the legs; forgot the square root; subtracted the squares (that is
    // the missing-leg formula); used only one difference.
    const { choices, correctIndex } = h.choices(correct, [
      Math.abs(dx) + Math.abs(dy),
      dx * dx + dy * dy,
      Math.round(Math.sqrt(Math.abs(dy * dy - dx * dx))),
      Math.abs(Math.abs(dy) - Math.abs(dx)),
      Math.abs(dx),
      Math.abs(dy),
    ]);
    return {
      stem: `What is the distance between (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy})?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `The distance formula is just Pythagoras on the two differences: √((${dx})² + (${dy})²) = √${dx * dx + dy * dy} = ${correct}. The signs vanish because both differences get squared.`,
    };
  },
});

registerTemplate({
  id: 'mk-line-equation-from-points',
  subtest: 'MK',
  band: 3,
  name: 'Equation of a line through two points',
  concepts: ['line-equations', 'intercepts'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const m = h.int(1, 8) * (h.int(0, 1) ? 1 : -1);
    let b = h.int(1, 12) * (h.int(0, 1) ? 1 : -1);
    if (b === m) b = Math.abs(b) === 12 ? Math.sign(b) : b + Math.sign(b);
    const x1 = h.int(-6, -1), x2 = h.int(1, 6);
    const y1 = m * x1 + b, y2 = m * x2 + b;
    const correct = `y = ${binom(`${m}x`, b)}`;
    // Error modes: swapped slope and intercept (the classic when you read y = mx + b as a
    // pair of numbers); sign slip on the intercept; sign slip on the slope; dropped b.
    const { choices, correctIndex } = h.choices(correct, [
      `y = ${binom(`${b}x`, m)}`,
      `y = ${binom(`${m}x`, -b)}`,
      `y = ${binom(`${-m}x`, b)}`,
      `y = ${m}x`,
      `y = ${binom(`${-m}x`, -b)}`,
    ]);
    return {
      stem: `What is the equation of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `Slope = (${y2} - ${y1}) / (${x2} - ${x1}) = ${m}. Substitute one point to find b: ${y1} = ${m}(${x1}) + b gives b = ${b}. So ${correct}. In y = mx + b, m multiplies x and b stands alone - they are not interchangeable.`,
    };
  },
});

registerTemplate({
  id: 'mk-perpendicular-slope',
  subtest: 'MK',
  band: 3,
  name: 'Slope of a perpendicular line',
  concepts: ['parallel-perpendicular-slopes'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const p = h.int(2, 9) * (h.int(0, 1) ? 1 : -1);
    let q = h.int(2, 9);
    if (Math.abs(p) === q) q = q === 9 ? 2 : q + 1; // |p/q| = 1 makes the flip a no-op
    const c = h.int(1, 15) * (h.int(0, 1) ? 1 : -1);
    const correct = frac(-q, p).s;
    // Error modes: gave the PARALLEL slope (same slope - the most common miss); flipped
    // without negating; negated without flipping; answered with the y-intercept.
    const { choices, correctIndex } = h.choices(correct, [
      frac(p, q).s,
      frac(q, p).s,
      frac(-p, q).s,
      String(c),
      String(-c),
      frac(-q, p * 2).s,
    ]);
    return {
      stem: `What is the slope of a line perpendicular to y = (${p}/${q})x ${c < 0 ? '-' : '+'} ${Math.abs(c)}?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `Perpendicular slopes are NEGATIVE RECIPROCALS: flip ${p}/${q} and change the sign to get ${correct}. Parallel lines keep the same slope (${frac(p, q).s}); only perpendicular ones flip.`,
    };
  },
});

registerTemplate({
  id: 'mk-intercepts',
  subtest: 'MK',
  band: 3,
  name: 'x-intercept of a line in standard form',
  concepts: ['intercepts'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(2, 9);
    let b = h.int(2, 9);
    if (b === a) b = a === 9 ? 2 : a + 1; // a === b makes both intercepts the same number
    const c = a * b * h.int(1, 6); // divisible by both, so both intercepts are whole numbers
    const correct = c / a;
    // ⭐ The item is a reading-comprehension trap as much as an algebra one: the y-intercept
    // is right there and is what most people compute by reflex.
    const { choices, correctIndex } = h.choices(correct, [
      c / b,
      -c / a,
      -c / b,
      c,
      Math.round(a / c) || a,
      c / (a + b),
    ]);
    return {
      stem: `What is the x-intercept of the line ${a}x + ${b}y = ${c}?`,
      choices, correctIndex,
      tags: ['coordinate'],
      explanation: `The x-intercept is where the line crosses the x-axis, so y = 0: ${a}x = ${c}, x = ${correct}. Setting x = 0 instead gives the Y-intercept, ${c / b}.`,
    };
  },
});
