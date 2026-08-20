// Chapter 11 — Right triangles and solids.
//
// Last of the three geometry chapters. Pythagoras and the two special triangles are the
// highest-yield facts in the whole math track because they turn a 40-second problem into a
// 5-second one, and Math Knowledge only gives you 52.8 seconds per question. Every item here
// is built on a Pythagorean triple or a special-triangle ratio so the answer is exact.

import { registerTemplate } from '../../engine/generator.js';
import { TRIPLES, pi, piFrac, radical, sweep } from '../util.js';

registerTemplate({
  id: 'mk-pythagorean-hypotenuse',
  subtest: 'MK',
  band: 2,
  name: 'Hypotenuse from two legs',
  concepts: ['pythagorean-theorem', 'pythagorean-triples'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const [a0, b0, c0] = h.pick(TRIPLES);
    const k = h.int(1, 5);
    const a = a0 * k, b = b0 * k, correct = c0 * k;
    // Error modes: added the legs; forgot to take the square root; SUBTRACTED the squares
    // (which is the formula for the missing LEG, not the hypotenuse).
    const { choices, correctIndex } = h.choices(correct, [
      a + b,
      a * a + b * b,
      Math.round(Math.sqrt(Math.abs(b * b - a * a))),
      b - a,
      Math.round((a + b) / 2),
      a * b,
    ]);
    return {
      stem: `A right triangle has legs of ${a} and ${b}. What is the length of the hypotenuse?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `a² + b² = c²: ${a * a} + ${b * b} = ${correct * correct}, so c = ${correct}. ${a}-${b}-${correct} is a multiple of the ${a0}-${b0}-${c0} triple - recognising those on sight is worth real seconds.`,
    };
  },
});

registerTemplate({
  id: 'mk-pythagorean-leg',
  subtest: 'MK',
  band: 3,
  name: 'Missing leg from a hypotenuse',
  concepts: ['pythagorean-theorem'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const [a0, b0, c0] = h.pick(TRIPLES);
    const k = h.int(1, 4);
    const known = a0 * k, hyp = c0 * k, correct = b0 * k;
    // ⭐ The error this item exists for: adding the squares instead of subtracting them,
    // i.e. running the hypotenuse formula when you were given the hypotenuse.
    const { choices, correctIndex } = h.choices(correct, [
      Math.round(Math.sqrt(hyp * hyp + known * known)),
      hyp - known,
      hyp + known,
      hyp * hyp - known * known,
      Math.round(Math.sqrt(hyp - known)),
      Math.round((hyp + known) / 2),
    ]);
    return {
      stem: `A right triangle has a hypotenuse of ${hyp} and one leg of ${known}. How long is the other leg?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Rearrange: b² = c² - a² = ${hyp * hyp} - ${known * known} = ${correct * correct}, so b = ${correct}. When the hypotenuse is GIVEN you subtract; ${hyp} - ${known} = ${hyp - known} is not how squares work.`,
    };
  },
});

const SPECIAL = [
  {
    ask: 'the hypotenuse', kind: '45-45-90', given: 'each leg',
    correct: (L) => radical(L, 2),
    wrong: (L) => [radical(L, 3), String(2 * L), `${radical(L, 2)}/2`, String(L * L), radical(2 * L, 3)],
    why: (L) => `In a 45-45-90 triangle the sides are x : x : x√2, so the hypotenuse is ${radical(L, 2)}. √3 belongs to the 30-60-90 triangle.`,
  },
  {
    ask: 'the longer leg', kind: '30-60-90', given: 'the shorter leg',
    correct: (L) => radical(L, 3),
    wrong: (L) => [radical(L, 2), String(2 * L), `${radical(L, 3)}/2`, String(3 * L), radical(2 * L, 3)],
    why: (L) => `In a 30-60-90 triangle the sides are x : x√3 : 2x, so the longer leg is ${radical(L, 3)} and the hypotenuse is ${2 * L}.`,
  },
  {
    ask: 'the hypotenuse', kind: '30-60-90', given: 'the shorter leg',
    correct: (L) => String(2 * L),
    wrong: (L) => [radical(L, 3), radical(L, 2), String(3 * L), `${radical(L, 3)}/2`, String(L * L)],
    why: (L) => `In a 30-60-90 triangle the hypotenuse is twice the SHORTER leg: ${2 * L}. The √3 side is the longer leg (${radical(L, 3)}), not the hypotenuse.`,
  },
];

registerTemplate({
  id: 'mk-special-right-triangle',
  subtest: 'MK',
  band: 4,
  name: 'Special right triangle ratios',
  concepts: ['special-right-triangles'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const form = h.pick(SPECIAL);
    const L = h.int(2, 30);
    // Distractors are the ratios from the OTHER special triangle - the only mix-up that
    // actually happens, and the reason both are taught in the same chapter.
    const { choices, correctIndex } = h.choices(form.correct(L), form.wrong(L));
    return {
      stem: `In a ${form.kind} triangle, ${form.given} measures ${L}. What is ${form.ask}?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: form.why(L),
    };
  },
});

registerTemplate({
  id: 'mk-volume-cylinder',
  subtest: 'MK',
  band: 3,
  name: 'Volume of a cylinder',
  concepts: ['volume-prism-cylinder'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const r = h.int(2, 12);
    const height = h.int(1, 8) * 3; // divisible by 3 so the cone distractor is a whole number
    const correct = pi(r * r * height);
    // Error modes: used the cone formula; forgot to square the radius; used the diameter;
    // computed the lateral surface area instead.
    const { choices, correctIndex } = h.choices(correct, [
      pi((r * r * height) / 3),
      pi(r * height),
      pi(4 * r * r * height),
      pi(2 * r * height),
      pi(r * r),
      pi(2 * r * r * height),
    ]);
    return {
      stem: `A cylinder has radius ${r} and height ${height}. What is its volume, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `V = πr²h = π(${r})²(${height}) = ${correct}. Every prism and cylinder is "area of the base times height" - the base here is a circle.`,
    };
  },
});

registerTemplate({
  id: 'mk-volume-cone',
  subtest: 'MK',
  band: 4,
  name: 'Volume of a cone',
  concepts: ['volume-cone-sphere'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const r = h.int(2, 12);
    const height = h.int(1, 8) * 3;
    const correct = pi((r * r * height) / 3);
    // ⭐ Forgetting the 1/3 is the single most common miss in solid geometry, so the cylinder
    // volume sits right there on the page.
    const { choices, correctIndex } = h.choices(correct, [
      pi(r * r * height),
      pi((r * r * height) / 2),
      pi((r * height) / 3),
      pi((4 * r * r * height) / 3),
      pi((2 * r * height) / 3),
      pi(r * r),
    ]);
    return {
      stem: `A cone has radius ${r} and height ${height}. What is its volume, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `V = (1/3)πr²h = (1/3)π(${r})²(${height}) = ${correct}. A cone is exactly one third of the cylinder that contains it (${pi(r * r * height)}) - same for a pyramid inside its prism.`,
    };
  },
});

registerTemplate({
  id: 'mk-volume-sphere',
  subtest: 'MK',
  band: 4,
  // r^3 grows fast, so the radius is capped where the numbers stay readable. Bounded and
  // declared rather than widened into six-figure coefficients nobody would meet on the test.
  stemSpace: 22,
  name: 'Volume of a sphere',
  concepts: ['volume-cone-sphere'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const r = h.int(3, 24);
    const correct = piFrac(4 * r ** 3, 3);
    // Error modes: dropped the 4/3; used the SURFACE area formula (4πr²); squared instead of
    // cubed; used 3/4 instead of 4/3.
    const { choices, correctIndex } = h.choices(correct, [
      pi(r ** 3),
      pi(4 * r * r),
      piFrac(4 * r * r, 3),
      piFrac(3 * r ** 3, 4),
      pi(4 * r ** 3),
      piFrac(2 * r ** 3, 3),
    ]);
    return {
      stem: `A sphere has radius ${r}. What is its volume, in terms of π?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `V = (4/3)πr³ = (4/3)π(${r})³ = ${correct}. Volume is CUBED; the sphere's surface area is 4πr² = ${pi(4 * r * r)}, which is the squared one.`,
    };
  },
});

registerTemplate({
  id: 'mk-surface-area-box',
  subtest: 'MK',
  band: 4,
  name: 'Surface area of a rectangular solid',
  concepts: ['surface-area'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const l = h.int(2, 15);
    let w = h.int(2, 15);
    if (w === l) w = l === 15 ? 2 : w + 1;
    // Small boxes make several of these coincide - 2x6x3 has volume === half the surface area
    // AND 6lw === the answer - so sweep the height for a value where every option on the page
    // is a different number.
    const ht = sweep(2, 15, h.int(2, 15), (cand) => {
      if (cand === l || cand === w) return null;
      const f = l * w + l * cand + w * cand;
      return [2 * f, f, l * w * cand, 6 * l * w, 2 * (l * w + l * cand),
        4 * (l + w + cand), 2 * l * w * cand, l + w + cand];
    });
    const faces = l * w + l * ht + w * ht;
    const correct = 2 * faces;
    // Error modes: counted each face once instead of twice; answered with the VOLUME; assumed
    // a cube; counted only two of the three face pairs; added the edges.
    const { choices, correctIndex } = h.choices(correct, [
      faces,
      l * w * ht,
      6 * l * w,
      2 * (l * w + l * ht),
      4 * (l + w + ht),
      2 * l * w * ht,
      l + w + ht,
    ]);
    return {
      stem: `A rectangular box measures ${l} by ${w} by ${ht}. What is its total surface area?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Three distinct faces, each appearing twice: 2(lw + lh + wh) = 2(${l * w} + ${l * ht} + ${w * ht}) = ${correct}. Forgetting the 2 gives ${faces}; ${l * w * ht} is the volume.`,
    };
  },
});
