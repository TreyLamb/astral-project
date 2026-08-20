// Chapter 9 — Geometry foundations: angles, parallel lines, triangles, similarity.
//
// Trey named geometry as his weakest area, so the math track teaches it from the ground up
// across three chapters instead of refreshing it in one. This is the first: no formulas to
// memorise, just the angle relationships that every later geometry item assumes you already
// know. The distractors are built from the two confusions that cause almost every miss -
// complement vs supplement, and equal vs supplementary angle pairs on a transversal.

import { registerTemplate } from '../../engine/generator.js';
import { sweep } from '../util.js';

registerTemplate({
  id: 'mk-complement-supplement',
  subtest: 'MK',
  band: 2,
  name: 'Complement and supplement of an angle',
  concepts: ['angle-pairs'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const wantComplement = h.int(0, 1) === 1;
    // Both forms use an acute angle so the complement is always a real angle. 30 and 45 break
    // the complement form (2x or x lands on the answer); 45 and 60 break the supplement form.
    let x = h.int(5, 84);
    if (x === 30 || x === 45 || x === 60) x += 1;
    const correct = wantComplement ? 90 - x : 180 - x;
    // ⭐ The headline distractor is the OTHER one: complement and supplement are the single
    // most-swapped pair in the whole subtest.
    const { choices, correctIndex } = h.choices(correct, [
      wantComplement ? 180 - x : 90 - x,
      x,
      360 - x,
      2 * x,
      90 + x,
      180 - 2 * x,
    ]);
    return {
      stem: `What is the ${wantComplement ? 'complement' : 'supplement'} of a ${x}° angle?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Complementary angles sum to 90°; supplementary angles sum to 180°. ${wantComplement ? '90' : '180'} - ${x} = ${correct}. C comes before S in the alphabet and 90 comes before 180 - that is the whole mnemonic.`,
    };
  },
});

// Every relationship on a transversal resolves to exactly one of two answers: equal, or
// supplementary. Knowing which is which IS the question.
const TRANSVERSAL = [
  { name: 'corresponding angle', equal: true },
  { name: 'alternate interior angle', equal: true },
  { name: 'alternate exterior angle', equal: true },
  { name: 'vertical angle', equal: true },
  { name: 'same-side interior (co-interior) angle', equal: false },
  { name: 'linear pair partner', equal: false },
];

registerTemplate({
  id: 'mk-parallel-transversal',
  subtest: 'MK',
  band: 3,
  name: 'Angles formed by a transversal',
  concepts: ['parallel-lines-transversal'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const rel = h.pick(TRANSVERSAL);
    // Even, so the halved distractor stays a whole number of degrees. 90 makes both possible
    // answers the same; 60 and 120 put 2x or x/2 on top of the other one.
    let x = h.int(10, 80) * 2;
    if (x === 60 || x === 90 || x === 120) x += 2;
    const correct = rel.equal ? x : 180 - x;
    // Error modes: picked the wrong side of the equal/supplementary split; used the
    // COMPLEMENT instead; doubled or halved it.
    const { choices, correctIndex } = h.choices(correct, [
      rel.equal ? 180 - x : x,
      90 - x > 0 ? 90 - x : 90 + x,
      360 - x,
      2 * x,
      Math.round(x / 2),
    ]);
    return {
      stem: `Two parallel lines are cut by a transversal. One angle measures ${x}°. What is the measure of its ${rel.name}?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `A ${rel.name} is ${rel.equal ? 'EQUAL to' : 'SUPPLEMENTARY to'} the given angle, so it measures ${correct}°. Corresponding, alternate interior, alternate exterior and vertical angles are equal; same-side interior angles and linear pairs sum to 180°.`,
    };
  },
});

registerTemplate({
  id: 'mk-triangle-third-angle',
  subtest: 'MK',
  band: 2,
  name: 'Third angle of a triangle',
  concepts: ['triangle-angle-sum'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const a = h.int(20, 100);
    // |a - b| was originally on the slate as "subtracted the two given angles". It is worth
    // dropping rather than guarding: whenever a = 90 it equals the answer for EVERY b, so no
    // sweep can rescue it, and it was never a mistake anyone actually makes.
    const hi = Math.max(21, 160 - a);
    const b = sweep(20, hi, h.int(20, hi), (cand) => {
      const c = 180 - a - cand;
      return c > 0 ? [c, 360 - a - cand, a + cand, 180 - a, 180 - cand,
        180 - Math.abs(a - cand), Math.round((a + cand) / 2)] : null;
    });
    const correct = 180 - a - b;
    // Error modes: used 360 instead of 180 (a quadrilateral's sum); answered with the sum of
    // the two given angles; subtracted only one of them; averaged them.
    const { choices, correctIndex } = h.choices(correct, [
      360 - a - b,
      a + b,
      180 - a,
      180 - b,
      180 - Math.abs(a - b),
      Math.round((a + b) / 2),
    ]);
    return {
      stem: `Two angles of a triangle measure ${a}° and ${b}°. What is the third angle?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `The three interior angles of any triangle sum to 180°: 180 - ${a} - ${b} = ${correct}°. 360° is the sum for a quadrilateral, not a triangle.`,
    };
  },
});

registerTemplate({
  id: 'mk-exterior-angle',
  subtest: 'MK',
  band: 3,
  name: 'Exterior angle theorem',
  concepts: ['triangle-angle-sum'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    // A right exterior angle is excluded because 180 - ext is then ext itself, so two of the
    // distractors are the same number for EVERY choice of the remote angle.
    let ext = h.int(80, 170);
    if (ext === 90) ext = 91;
    // Angles that are all multiples of 45 collapse this slate completely (ext = 135,
    // remote = 45 put THREE distractors on the answer), so sweep the whole legal range for a
    // remote angle where every value on the page is distinct, rather than guarding them one
    // at a time. An earlier version nudged by +-1 and ping-ponged between 21 and 22.
    const remote1 = sweep(20, ext - 20, h.int(20, ext - 20), (cand) => {
      const c = ext - cand;
      return c > 0 ? [c, ext + cand, 180 - ext, cand, 180 - cand, 360 - ext - cand, ext] : null;
    });
    const correct = ext - remote1;
    // Error modes: added the remote angle instead of subtracting; used the interior angle at
    // that vertex (180 - ext); answered with a value copied straight off the stem.
    const { choices, correctIndex } = h.choices(correct, [
      ext + remote1,
      180 - ext,
      remote1,
      180 - remote1,
      360 - ext - remote1,
      ext,
    ]);
    return {
      stem: `An exterior angle of a triangle measures ${ext}°. One of the two remote interior angles measures ${remote1}°. What is the other?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `An exterior angle equals the SUM of the two remote (non-adjacent) interior angles: ${ext} = ${remote1} + ?, so ? = ${correct}°. The angle next to it inside the triangle is ${180 - ext}° - that one is the linear pair, not a remote interior angle.`,
    };
  },
});

registerTemplate({
  id: 'mk-isosceles-base-angle',
  subtest: 'MK',
  band: 2,
  name: 'Base angles of an isosceles triangle',
  concepts: ['triangle-types'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    let vertex = h.int(5, 87) * 2; // even, so the base angles are whole degrees
    // 60 is equilateral (the vertex angle IS the answer) and at 90 half the vertex angle is
    // also the answer - both would put a distractor on top of the correct choice.
    if (vertex === 60 || vertex === 90) vertex += 2;
    const correct = (180 - vertex) / 2;
    // Error modes: forgot to halve (that is the whole item); halved the vertex angle instead;
    // used 360 as the total; answered with the vertex angle.
    const { choices, correctIndex } = h.choices(correct, [
      180 - vertex,
      vertex / 2,
      (180 + vertex) / 2,
      (360 - vertex) / 2,
      vertex,
      90,
    ]);
    return {
      stem: `An isosceles triangle has a vertex angle of ${vertex}°. What is the measure of EACH base angle?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `The two base angles are equal and share what is left of 180°: (180 - ${vertex}) / 2 = ${correct}°. ${180 - vertex}° is the pair TOGETHER - the question asks for one of them.`,
    };
  },
});

registerTemplate({
  id: 'mk-similar-triangles',
  subtest: 'MK',
  band: 3,
  name: 'Corresponding sides of similar triangles',
  concepts: ['similar-triangles'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const k = h.int(2, 4);
    const ab = h.int(3, 15);
    let bc = h.int(3, 18);
    if (bc === ab) bc = ab === 18 ? 3 : ab + 1;
    const de = k * ab;
    const correct = k * bc;
    // ⭐ The defining error: treating similarity as ADDITIVE (DE is 8 more than AB, so EF must
    // be 8 more than BC). Similar figures scale by a ratio, never by a difference.
    const { choices, correctIndex } = h.choices(correct, [
      bc + (de - ab),
      Math.round(bc / k),
      de,
      bc,
      k * bc * k,
      Math.round((bc * ab) / de),
    ]);
    return {
      stem: `Triangle ABC is similar to triangle DEF. AB = ${ab}, BC = ${bc}, and DE = ${de}. What is EF?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `The scale factor is DE/AB = ${de}/${ab} = ${k}, and it applies to EVERY corresponding side: EF = ${k} x ${bc} = ${correct}. Adding the difference (${de - ab}) instead gives ${bc + (de - ab)} and is the classic wrong turn.`,
    };
  },
});

// Only n values where (n-2)·180/n is a whole number, so the answer never needs rounding.
const NGONS = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36];
const NGON_NAMES = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };

registerTemplate({
  id: 'mk-polygon-interior-angle',
  subtest: 'MK',
  band: 3,
  // Bounded on purpose: n has to divide 360 for the answer to be a whole number of degrees,
  // and beyond ~36 sides nobody names the shape. Declared rather than faked.
  stemSpace: 14,
  name: 'Interior angle of a regular polygon',
  concepts: ['polygon-angle-sum'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const n = h.pick(NGONS);
    const sum = (n - 2) * 180;
    const correct = sum / n;
    const name = NGON_NAMES[n] ? `regular ${NGON_NAMES[n]}` : `regular ${n}-sided polygon`;
    // Error modes: gave the EXTERIOR angle (360/n - the other formula everyone memorises);
    // gave the total SUM rather than one angle; divided 180 by n.
    const { choices, correctIndex } = h.choices(correct, [
      360 / n,
      sum,
      180 / n,
      n * 180,
      Math.round(((n - 1) * 180) / n),
      360,
    ]);
    return {
      stem: `What is the measure of one interior angle of a ${name}?`,
      choices, correctIndex,
      tags: ['geometry'],
      explanation: `Interior angles sum to (n - 2) x 180 = ${sum}°, and a REGULAR polygon splits that evenly: ${sum}/${n} = ${correct}°. ${360 / n}° is the exterior angle - the two always add to 180°.`,
    };
  },
});
