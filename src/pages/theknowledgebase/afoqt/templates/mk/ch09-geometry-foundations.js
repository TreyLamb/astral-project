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
      explanation: `Two angles are called COMPLEMENTARY when they add up to exactly 90° (a right angle), and SUPPLEMENTARY when they add up to exactly 180° (a straight line) - those two totals are the whole vocabulary this question type is built on. You're asked for the ${wantComplement ? 'complement' : 'supplement'} of a ${x}° angle, meaning whatever second angle, added to ${x}°, reaches ${wantComplement ? '90°' : '180°'}: ${wantComplement ? '90' : '180'} - ${x} = ${correct}°. The single most common mistake is answering with the OTHER relationship entirely - giving the ${wantComplement ? 'supplement' : 'complement'} (${wantComplement ? 180 - x : 90 - x}) when the ${wantComplement ? 'complement' : 'supplement'} was asked for, since both numbers always sit right next to each other on the answer slate. One memory aid: C comes before S in the alphabet, and 90 comes before 180 on the number line - complement pairs with the smaller total.`,
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
      explanation: `When one line (a transversal) cuts across two parallel lines, it creates eight angles total, but those eight angles only take on TWO distinct values between them - every one of those angles is either equal to your given angle, or supplementary to it (sums with it to 180°). Which of the two depends on WHERE the angle sits relative to the first one, which is exactly what a name like "${rel.name}" describes. As a shortcut: angles described as "alternate," "corresponding," or "vertical" are always equal to each other, while angles described as "same-side" (co-interior) or a "linear pair" are always supplementary - "same-side" is the one reliable tell for the supplementary group, since everything else on this topic is equal. Here, a ${rel.name} is ${rel.equal ? 'EQUAL to the given angle' : 'SUPPLEMENTARY to the given angle'}, so it measures ${correct}°. Mixing up equal-versus-supplementary is the entire difficulty of this question type - the arithmetic itself, just ${x} or just 180 - ${x}, is trivial once you know which one applies.`,
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
      explanation: `Every triangle's three interior angles - the three angles INSIDE it, at its three corners - always add up to exactly 180°, regardless of the triangle's shape or size. So if two of the three are known (${a}° and ${b}° here), the third is whatever is left over from 180°: 180 - ${a} - ${b} = ${correct}°. The trap is using 360° instead - that total belongs to a FOUR-sided shape (a quadrilateral), not a triangle. Every polygon's interior angles sum to (number of sides - 2) x 180°, and a triangle has 3 sides: (3 - 2) x 180 = 180°, not 360°.`,
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
      explanation: `Extending one side of a triangle past a corner creates an EXTERIOR angle at that corner - the angle outside the triangle, between the extended side and the other side meeting at that same corner. The exterior angle theorem says this outside angle always equals the SUM of the two "remote" interior angles - remote meaning the angles at the triangle's OTHER two corners, the ones that do not touch the corner where the exterior angle sits. Here the exterior angle is ${ext}°, one remote interior angle is ${remote1}°, so the other is whatever's left: ${ext} - ${remote1} = ${correct}°. The trap is using the angle immediately NEXT TO the exterior angle instead - that adjacent interior angle (${180 - ext}°) sits at the SAME corner as the exterior angle, forming a straight line with it, which makes it the opposite of "remote," not one of the two angles the theorem is actually about.`,
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
      explanation: `An isosceles triangle has exactly two equal sides, and the two angles sitting opposite those equal sides - called the BASE angles - are equal to each other too. The third angle, between the two equal sides, is the vertex angle. Since all three angles of any triangle sum to 180°, the two base angles together share whatever is left after the vertex angle: 180 - ${vertex}° = ${180 - vertex}°, split evenly between the two of them because they're equal - so each base angle is ${180 - vertex}° / 2 = ${correct}°. The trap is stopping at ${180 - vertex}° and treating that as the answer - that number is the two base angles ADDED TOGETHER, but the question asks for the measure of just ONE base angle, which needs the extra halving step.`,
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
      explanation: `Two triangles are SIMILAR when they have the exact same shape (matching angles) but not necessarily the same size - every side of one is the same multiple, called the SCALE FACTOR, of the corresponding side on the other. "Corresponding" sides are found by matching letters in the same naming order: in triangle ABC similar to triangle DEF, side AB corresponds to DE, and BC corresponds to EF. Here DE is ${de} while its corresponding side AB is ${ab}, so the scale factor is DE/AB = ${de}/${ab} = ${k} - every side of DEF is ${k} times its corresponding side in ABC. So EF = ${k} x BC = ${k} x ${bc} = ${correct}. The trap is treating similarity as ADDITIVE instead of multiplicative - noticing DE is ${de - ab} more than AB and assuming EF must be ${de - ab} more than BC too (giving ${bc + (de - ab)}) - but similar figures scale by a RATIO applied uniformly to every side, never by a fixed difference added to each one.`,
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
      explanation: `Every polygon's interior angles - the angles inside it, at each corner - add up to (number of sides - 2) x 180°, because any polygon can be split into that many triangles, each contributing 180°. A REGULAR polygon has all sides and angles equal, so once the total is known, dividing by the number of sides gives one interior angle. Here, a ${name} has ${n} sides, so the total is (${n} - 2) x 180 = ${sum}°, and one interior angle is ${sum}/${n} = ${correct}°. The trap is confusing this with the EXTERIOR angle formula (360°/${n} = ${360 / n}°, the angle OUTSIDE at each corner, formed by extending one side) - the two formulas sit right next to each other on the answer slate, and an interior angle plus its own exterior angle always add to exactly 180°, a fast way to sanity-check whichever one you just computed.`,
    };
  },
});
