// Chapter 10 — Measurement: perimeter, area, circles, composite figures.
//
// Second of the three geometry chapters. Every formula here has exactly one thing people
// drop - the 1/2 on a triangle, the halving of the two bases on a trapezoid, the height vs
// the slant side on a parallelogram, and radius vs diameter on a circle. Those four are the
// distractors; there is nothing else worth putting on the page.

import { registerTemplate } from '../../engine/generator.js';
import { pi, piFrac } from '../util.js';

registerTemplate({
  id: 'mk-rectangle-perimeter',
  subtest: 'MK',
  band: 1,
  name: 'Perimeter of a rectangle',
  concepts: ['perimeter'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    const l = h.int(4, 40);
    let w = h.int(2, 30);
    if (w === l) w = l === 30 ? 2 : w + 1;
    const correct = 2 * (l + w);
    // Error modes: answered with the AREA; added the two sides once; doubled only one side.
    const { choices, correctIndex } = h.choices(correct, [
      l * w,
      l + w,
      2 * l + w,
      l + 2 * w,
      4 * l,
      2 * l * w,
    ]);
    return {
      stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Perimeter is the distance all the way around: 2(${l} + ${w}) = ${correct} cm. ${l * w} is the AREA - check the units the question asks for.`,
    };
  },
});

registerTemplate({
  id: 'mk-parallelogram-area',
  subtest: 'MK',
  band: 3,
  name: 'Area of a parallelogram',
  concepts: ['area-rectangle-parallelogram'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const base = h.int(5, 30);
    const height = h.int(3, 20);
    const slant = height + h.int(2, 12); // the slant side is always LONGER than the height
    const correct = base * height;
    // ⭐ The whole item: the slant side is on the page precisely so you can use it by mistake.
    // Area uses the PERPENDICULAR height, never the side length.
    const { choices, correctIndex } = h.choices(correct, [
      base * slant,
      (base * height) / 2,
      2 * (base + slant),
      base + height,
      2 * (base + height),
      base * slant * 2,
    ]);
    return {
      stem: `A parallelogram has a base of ${base}, a slant side of ${slant}, and a perpendicular height of ${height}. What is its area?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Area = base x HEIGHT = ${base} x ${height} = ${correct}. The slant side (${slant}) belongs to the perimeter, not the area - using it gives ${base * slant}.`,
    };
  },
});

registerTemplate({
  id: 'mk-triangle-area',
  subtest: 'MK',
  band: 2,
  name: 'Area of a triangle',
  concepts: ['area-triangle'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const b = h.int(2, 20) * 2; // even base keeps the answer clean
    const ht = h.int(3, 18);
    const area = (b * ht) / 2;
    // Error modes: forgot to halve (the classic), used perimeter-ish sum, halved twice.
    // Over-supplied on purpose: several of these coincide for particular b/h pairs.
    const { choices, correctIndex } = h.choices(area, [
      b * ht, b + ht, Math.round(area / 2), (b + ht) * 2, area + b, area + ht, b * 2 + ht * 2, area * 2 + b,
    ]);
    return {
      stem: `A triangle has a base of ${b} and a height of ${ht}. What is its area?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Area = (1/2) x base x height = (1/2)(${b})(${ht}) = ${area}. Forgetting the 1/2 gives ${b * ht}.`,
    };
  },
});

registerTemplate({
  id: 'mk-trapezoid-area',
  subtest: 'MK',
  band: 3,
  name: 'Area of a trapezoid',
  concepts: ['area-trapezoid'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const b1 = h.int(3, 20);
    let b2 = h.int(3, 24);
    if (b2 === b1) b2 = b1 === 24 ? 3 : b1 + 1;
    const height = h.int(2, 10) * 2; // even, so halving the base sum stays whole
    const correct = ((b1 + b2) / 2) * height;
    // Error modes: forgot to average the bases; averaged but forgot the height; used only one
    // base (the rectangle formula); multiplied the bases together.
    const { choices, correctIndex } = h.choices(correct, [
      (b1 + b2) * height,
      (b1 + b2) / 2,
      b1 * height,
      b2 * height,
      (b1 * b2) / 2,
      b1 + b2 + height,
    ]);
    return {
      stem: `A trapezoid has parallel sides of ${b1} and ${b2} and a height of ${height}. What is its area?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Area = ((b₁ + b₂)/2) x h = ((${b1} + ${b2})/2) x ${height} = ${correct}. It is the AVERAGE of the two parallel sides times the height - a trapezoid is a rectangle whose width is that average.`,
    };
  },
});

registerTemplate({
  id: 'mk-circle-area-vs-circumference',
  subtest: 'MK',
  band: 3,
  name: 'Circle area from diameter',
  concepts: ['circle-area', 'circle-circumference'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const r = h.int(2, 60);
    const d = r * 2;
    // Error modes: used the DIAMETER as the radius (the trap the stem sets), gave
    // circumference instead of area, forgot to square.
    const { choices, correctIndex } = h.choices(pi(r * r), [
      pi(d * d),
      pi(d),
      pi(r),
      pi(2 * r * r),
      pi(r * r * 4),
      pi(d + r),
    ]);
    return {
      stem: `A circle has a diameter of ${d}. What is its area, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Radius = ${d}/2 = ${r}. Area = πr² = ${pi(r * r)}. Using the diameter as the radius gives ${pi(d * d)}; the circumference would be ${pi(d)}.`,
    };
  },
});

// 180 is deliberately absent: for a semicircle the sector and the REST of the circle are the
// same area, which puts that distractor on top of the answer.
const SECTOR_ANGLES = [30, 45, 60, 72, 90, 120, 135, 150, 240, 270, 300];

registerTemplate({
  id: 'mk-arc-sector',
  subtest: 'MK',
  band: 4,
  name: 'Area of a sector',
  concepts: ['arc-sector'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    // r = 3 up: at r = 2 the sector area and the arc length are the same number, which puts
    // the "gave the arc length" distractor on top of the answer.
    const r = h.int(3, 20);
    const deg = h.pick(SECTOR_ANGLES);
    const correct = piFrac(deg * r * r, 360);
    // Error modes: gave the whole circle's area; gave the ARC LENGTH instead of the area;
    // used 180 as the full turn; answered with the REST of the circle; forgot to square r.
    const { choices, correctIndex } = h.choices(correct, [
      pi(r * r),
      piFrac(deg * 2 * r, 360),
      piFrac(deg * r * r, 180),
      piFrac((360 - deg) * r * r, 360),
      piFrac(deg * r, 360),
      pi(2 * r),
    ]);
    return {
      stem: `A circle has radius ${r}. What is the area of a sector with a central angle of ${deg}°, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `A sector is the fraction ${deg}/360 of the circle: (${deg}/360) x π(${r})² = ${correct}. The same fraction of the CIRCUMFERENCE (${piFrac(deg * 2 * r, 360)}) is the arc length - a different question.`,
    };
  },
});

registerTemplate({
  id: 'mk-composite-figure',
  subtest: 'MK',
  band: 4,
  name: 'Area remaining in a composite figure',
  concepts: ['composite-figures'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const m = h.int(2, 50);
    const s = 2 * m; // side of the square = diameter of the circle
    const correct = `${s * s} - ${pi(m * m)}`;
    // Error modes: used the side length as the radius; subtracted the circumference; gave
    // only the piece that was removed; added instead of subtracting.
    const { choices, correctIndex } = h.choices(correct, [
      `${s * s} - ${pi(s * s)}`,
      `${s * s} - ${pi(s)}`,
      pi(m * m),
      `${s * s} + ${pi(m * m)}`,
      `${s * s} - ${pi(2 * m * m)}`,
      `${s * s} - ${pi(m)}`,
    ]);
    return {
      stem: `A circle of diameter ${s} is cut out of a square with sides of ${s}. What area remains, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Square = ${s}² = ${s * s}. The circle's RADIUS is ${s}/2 = ${m}, so its area is ${pi(m * m)}. Remaining = ${correct}. Take the whole and subtract the hole - and halve the diameter before you square it.`,
    };
  },
});
