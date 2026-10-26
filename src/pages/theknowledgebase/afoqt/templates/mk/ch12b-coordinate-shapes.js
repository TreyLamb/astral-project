// Chapter 12 (continued) - shapes on the coordinate plane.
//
// Added 2026-10-25 from Trey's debrief of the real AFOQT (taken 2026-09-23): "it gave x,y coords and
// asked what the 3rd point of a triangle would be" - two or three items, 5-7% of the math, on something
// the bank never covered. The bank had the five formulas and nothing that asks for a VERTEX.
//
// FIRST VERSION WAS TOO THIN, and Trey said so: six templates, one sentence frame each, a rectangle and
// a parallelogram, so twenty questions would have been the same four questions with new numbers. This is
// the rewrite. The figure is DATA (shapes.js): rectangles, squares, rhombi and parallelograms squared to the
// axes or TILTED, kites, isosceles trapezoids and four kinds of triangle. Each template draws a figure,
// hides ANY one vertex, labels it differently each time, and varies the wording; and the questions are
// different QUESTIONS, not one question: a missing vertex, a classification, a perimeter, an area, a
// center, a centroid, a transformation, a collinearity. The wording of the real items is not known, so
// this is breadth on purpose ("overprepare intelligently"), not a guess at one item.
//
// Not calibrated against a book or the OATTS items: `calibratedAgainst` is left off. Every answer is
// computed twice (a rule, then a check by a different route) and the template throws if they disagree,
// so the 8000-sample selftest is also a correctness test.

import { registerTemplate } from '../../engine/generator.js';
import { shuffle } from '../../../engine/rng.js';
import {
  pt, P, add, sub, scale, rotCCW, rotCW, swap, same, d2, cross, len, wholeMid, shoelace, distinct,
  LABELS, latticeVec, sideVectors,
} from './shapes.js';

const sign = (h) => (h.int(0, 1) ? 1 : -1);
/** A real test keeps its figures small enough to sketch. True when every coordinate is within `max` of the origin. */
const small = (pts, max = 14) => pts.every((p) => Math.abs(p.x) <= max && Math.abs(p.y) <= max);
const assert = (ok, what) => { if (!ok) throw new Error(`coordinate shapes: ${what}`); };
const named = (L, i, p) => `${L[i]}${P(p)}`;
const pickPhrase = (h, list) => h.pick(list);
const intStrs = (arr) => arr.filter((x) => Number.isInteger(x)).map(String);

// ---------------------------------------------------------------------------------------------------
// 1. Missing corner of a rectangle whose sides are parallel to the axes
registerTemplate({
  id: 'mk-vertex-rectangle-axis',
  subtest: 'MK',
  band: 2,
  name: 'Missing corner of an axis-parallel rectangle',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 200; tries++) {
      const x1 = h.int(-8, 3), w = h.int(2, 9), y1 = h.int(-7, 3), ht = h.int(2, 9);
      if (w === ht) continue; // a square makes two of the wrong-way errors coincide
      const L = h.pick(LABELS);
      const flipX = h.int(0, 1), flipY = h.int(0, 1);
      const corner = [[0, 0], [w, 0], [w, ht], [0, ht]];
      const k = h.int(0, 3); // which physical corner is "A"
      const verts = [0, 1, 2, 3].map((i) => {
        const [dx, dy] = corner[(i + k) % 4];
        return pt(x1 + (flipX ? w - dx : dx), y1 + (flipY ? ht - dy : dy));
      });
      const miss = h.int(0, 3);
      const given = [0, 1, 2, 3].filter((i) => i !== miss);
      const gx = given.map((i) => verts[i].x), gy = given.map((i) => verts[i].y);
      const alone = (arr) => arr.find((v) => arr.filter((u) => u === v).length === 1);
      const ux = alone(gx), uy = alone(gy);
      assert(same(pt(ux, uy), verts[miss]), 'rectangle rule disagrees');
      const xt = gx.find((v) => v !== ux), yt = gy.find((v) => v !== uy);
      const correct = P(pt(ux, uy));
      // Error modes: swapped x and y; stepped the wrong way sideways; the wrong way vertically; repeated a
      // corner already given (two of the three given corners share one coordinate with the answer).
      const errs = [P(pt(uy, ux)), P(pt(ux + (ux - xt), uy)), P(pt(ux, uy + (uy - yt))), P(pt(xt, uy)), P(pt(ux, yt))];
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      const say = pickPhrase(h, [
        `Three vertices of rectangle ${L.join('')}, whose sides are parallel to the axes, are ${given.map((i) => named(L, i, verts[i])).join(', ')}. What are the coordinates of ${L[miss]}?`,
        `Rectangle ${L.join('')} has its sides parallel to the x- and y-axes. Its vertices ${given.map((i) => L[i]).join(', ')} are ${given.map((i) => P(verts[i])).join(', ')}. Where is ${L[miss]}?`,
        `${given.map((i) => named(L, i, verts[i])).join(', ')} are three corners of a rectangle ${L.join('')} with horizontal and vertical sides. Find the coordinates of the fourth corner, ${L[miss]}.`,
      ]);
      return {
        stem: say, choices, correctIndex, tags: ['coordinate'], variant: `rect-axis:${ux < xt ? 'left' : 'right'}-${uy < yt ? 'bottom' : 'top'}:${w > ht ? 'wide' : 'tall'}`,
        explanation: `A rectangle with horizontal and vertical sides uses only TWO different x-values and TWO different y-values. Among the three given corners, x = ${xt} appears twice and x = ${ux} once, so the missing corner takes the x that is alone: ${ux}. y = ${yt} appears twice and y = ${uy} once, so it takes y = ${uy}. ${L[miss]} = ${correct}. The other two corners of that box, ${P(pt(xt, uy))} and ${P(pt(ux, yt))}, are already given.`,
      };
    }
    throw new Error('mk-vertex-rectangle-axis: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 2. Missing vertex of a parallelogram, rectangle, rhombus or square (squared to the axes or tilted)
registerTemplate({
  id: 'mk-vertex-parallelogram',
  subtest: 'MK',
  band: 3,
  name: 'Missing vertex of a parallelogram, rectangle, rhombus or square',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const kind = h.pick(['parallelogram', 'parallelogram', 'rectangle', 'rhombus', 'square']);
      const { u, v } = sideVectors(h, kind);
      if (cross(u, v) === 0) continue;
      const A = pt(h.int(-6, 3), h.int(-6, 3));
      const verts = [A, add(A, u), add(add(A, u), v), add(A, v)];
      if (!small(verts)) continue;
      const L = h.pick(LABELS);
      const miss = h.int(0, 3);
      const n1 = verts[(miss + 1) % 4], n2 = verts[(miss + 3) % 4], opp = verts[(miss + 2) % 4];
      const answer = sub(add(n1, n2), opp);
      assert(same(answer, verts[miss]), 'parallelogram rule disagrees');
      const correct = P(answer);
      const centre = wholeMid(n1, n2); // the point where the diagonals cross
      // Error modes: used the wrong corner as the one to subtract; forgot to subtract at all; gave the
      // center (the diagonals' crossing point is not a vertex); went past the opposite corner by the same
      // amount; swapped x and y.
      const errs = [
        P(sub(add(opp, n1), n2)), P(sub(add(opp, n2), n1)), P(add(n1, n2)),
        centre ? P(centre) : P(sub(scale(opp, 2), answer)),
        P(swap(answer)),
      ];
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      const given = [0, 1, 2, 3].filter((i) => i !== miss);
      const Name = kind[0].toUpperCase() + kind.slice(1);
      const say = pickPhrase(h, [
        `${Name} ${L.join('')} has vertices ${given.map((i) => named(L, i, verts[i])).join(', ')}, with its corners lettered in order around the figure. What are the coordinates of ${L[miss]}?`,
        `The vertices of ${kind} ${L.join('')}, in order, include ${given.map((i) => named(L, i, verts[i])).join(', ')}. Find ${L[miss]}.`,
        `Three corners of ${kind} ${L.join('')} are ${given.map((i) => named(L, i, verts[i])).join(', ')} (lettered in order). What is the fourth corner, ${L[miss]}?`,
      ]);
      return {
        stem: say, choices, correctIndex, tags: ['coordinate'], variant: `${kind}:${u.x !== 0 && u.y !== 0 ? 'tilted' : 'axis'}:hide${miss}`,
        explanation: `${L[miss]} and ${L[(miss + 2) % 4]} are opposite corners, and so are ${L[(miss + 1) % 4]} and ${L[(miss + 3) % 4]}. The diagonals of a parallelogram bisect each other (${kind === 'parallelogram' ? 'this is a parallelogram' : `every ${kind} is a parallelogram, so the rule holds`}), so the two opposite pairs have the same sum: ${L[miss]} + ${L[(miss + 2) % 4]} = ${L[(miss + 1) % 4]} + ${L[(miss + 3) % 4]}. That gives ${L[miss]} = ${L[(miss + 1) % 4]} + ${L[(miss + 3) % 4]} − ${L[(miss + 2) % 4]} = (${n1.x} + ${n2.x} − ${opp.x < 0 ? `(${opp.x})` : opp.x}, ${n1.y} + ${n2.y} − ${opp.y < 0 ? `(${opp.y})` : opp.y}) = ${correct}.${centre ? ` The point ${P(centre)} is where the diagonals cross, not a vertex.` : ''}`,
      };
    }
    throw new Error('mk-vertex-parallelogram: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 3. Square from two opposite corners (a TILTED square: rotate a corner a quarter turn about the center)
registerTemplate({
  id: 'mk-vertex-square-diagonal',
  subtest: 'MK',
  band: 3,
  name: 'Other corners of a square from one diagonal',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 200; tries++) {
      const M = pt(h.int(-6, 6), h.int(-6, 6));
      const half = pt(h.int(1, 6) * sign(h), h.int(1, 6) * sign(h));
      if (Math.abs(half.x) === Math.abs(half.y)) continue; // that square would sit squared to the axes
      const A = add(M, half), C = sub(M, half);
      const B = add(M, rotCCW(half)); // counterclockwise lettering: each corner is the last turned a quarter
      const D = add(M, rotCW(half));
      assert(d2(A, B) === d2(B, C) && d2(B, C) === d2(C, D) && d2(A, C) === d2(B, D), 'square check');
      const L = h.pick(LABELS);
      const askB = h.int(0, 1) === 1;
      const answer = askB ? B : D, other = askB ? D : B;
      // Error modes: the OTHER corner (wrong turning direction, the usual one); the center; went along the
      // diagonal's own direction instead of across it; swapped the two parts of the half-diagonal.
      const errs = [P(other), P(M), P(add(M, swap(half))), P(add(M, pt(-half.x, half.y))), P(add(M, pt(half.x, -half.y)))];
      const correct = P(answer);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: pickPhrase(h, [`${L.join('')} is a square lettered counterclockwise. Opposite corners ${L[0]}${P(A)} and ${L[2]}${P(C)} are given. What are the coordinates of ${L[askB ? 1 : 3]}?`, `Square ${L.join('')} is lettered counterclockwise, and its diagonal runs from ${L[0]}${P(A)} to ${L[2]}${P(C)}. Where is ${L[askB ? 1 : 3]}?`, `Square ${L.join('')} has its letters going counterclockwise. Its diagonal runs from ${L[0]}${P(A)} to ${L[2]}${P(C)}. Find ${L[askB ? 1 : 3]}.`]),
        choices, correctIndex, tags: ['coordinate'], variant: `square-diag:ask-${askB ? 'B' : 'D'}:${half.x > 0 ? 'R' : 'L'}${half.y > 0 ? 'U' : 'D'}`,
        explanation: `The diagonals of a square are equal, perpendicular and bisect each other. Their midpoint is the center M = ((${A.x} + ${C.x < 0 ? `(${C.x})` : C.x})/2, (${A.y} + ${C.y < 0 ? `(${C.y})` : C.y})/2) = ${P(M)}. From M, corner ${L[0]} is the step (${half.x}, ${half.y}). Another corner is that step turned a quarter turn: counterclockwise it is (${-half.y}, ${half.x}), clockwise (${half.y}, ${-half.x}). Counterclockwise lettering puts ${L[1]} a quarter turn counterclockwise after ${L[0]}, so ${L[1]} = M + (${-half.y}, ${half.x}) = ${P(B)}, and ${L[3]} = ${P(D)}. The answer is ${correct}; the other corner, ${P(other)}, is what you get by turning the wrong way.`,
      };
    }
    throw new Error('mk-vertex-square-diagonal: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 4. Symmetric figures: isosceles triangle apex, isosceles trapezoid, kite (the missing point is a reflection)
registerTemplate({
  id: 'mk-vertex-symmetric',
  subtest: 'MK',
  band: 3,
  name: 'Missing point of an isosceles triangle, isosceles trapezoid or kite',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const variant = h.pick(['apex', 'trapezoid', 'kite']);
      const y0 = h.int(-6, 3);
      const L = h.pick(LABELS);
      if (variant === 'apex') {
        const x1 = h.int(-9, 3), half = h.int(2, 7), x2 = x1 + 2 * half, apexY = y0 + h.int(2, 9);
        const mid = x1 + half;
        const errs = [x1, x2, 2 * half, half, x1 + x2, apexY].map(String);
        const correct = String(mid);
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        return {
          stem: `Triangle ${L[0]}${L[1]}${L[2]} has ${L[0]}${P(pt(x1, y0))}, ${L[1]}${P(pt(x2, y0))} and ${L[2]}(x, ${apexY}). Sides ${L[0]}${L[2]} and ${L[1]}${L[2]} are equal in length. What is the value of x?`,
          choices, correctIndex, tags: ['coordinate'], variant: 'apex',
          explanation: `Equal sides mean ${L[2]} is the same distance from ${L[0]} and from ${L[1]}, so it sits directly above the MIDPOINT of ${L[0]}${L[1]}. The base runs from x = ${x1} to x = ${x2}, so x = (${x1} + ${x2})/2 = ${mid}. The height ${apexY} does not change x. Half the base LENGTH (${half}) is a distance, not a coordinate.`,
        };
      }
      if (variant === 'trapezoid') {
        const a = h.int(-9, 0), b = a + h.int(5, 10), inset = h.int(1, 3);
        const c = b - inset, d = a + inset;       // top corners, symmetric about the middle of the base
        const y1 = y0 + h.int(2, 6);
        if (c <= d) continue;
        assert(a + b === c + d, 'trapezoid symmetry');
        const correct = P(pt(d, y1));
        // Error modes: used the PARALLELOGRAM rule (a + c - b), the single most common mix-up; copied a
        // corner; reflected in the wrong direction; swapped x and y.
        const errs = [P(pt(a + c - b, y1)), P(pt(c, y1 - (y1 - y0))), P(pt(d, y0)), P(pt(a + b + c, y1)), P(pt(y1, d))];
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        return {
          stem: `${L.join('')} is an isosceles trapezoid with ${L[0]}${L[1]} and ${L[3]}${L[2]} horizontal and parallel. ${L[0]}${P(pt(a, y0))}, ${L[1]}${P(pt(b, y0))} and ${L[2]}${P(pt(c, y1))} are given. What are the coordinates of ${L[3]}?`,
          choices, correctIndex, tags: ['coordinate'], variant: 'trapezoid',
          explanation: `An isosceles trapezoid is symmetric about the vertical line through the middle of its bases. The bottom base runs from x = ${a} to x = ${b}, so the line of symmetry is x = (${a} + ${b})/2 = ${(a + b) / 2}. ${L[3]} is the mirror image of ${L[2]} across that line, at the same height ${y1}: x = ${a + b} − ${c} = ${d}. ${L[3]} = ${correct}. Do not use the parallelogram rule here: ${L[3]} = ${L[0]} + ${L[2]} − ${L[1]} would give ${P(pt(a + c - b, y1))}, and that is not an isosceles trapezoid.`,
        };
      }
      // kite: AC is the vertical axis of symmetry, B and D are mirror images across it
      const ax = h.int(-5, 4), ay = y0 + h.int(3, 8), cy = y0 - h.int(1, 4), bxOff = h.int(2, 6), byv = h.int(cy + 1, ay - 1);
      const bx = ax - bxOff, dx = ax + bxOff;
      const correct = P(pt(dx, byv));
      const errs = [P(pt(bx, 2 * ay - byv)), P(pt(-bx, byv)), P(pt(dx, cy)), P(pt(ax, byv)), P(pt(byv, dx))];
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: `${L.join('')} is a kite. The diagonal ${L[0]}${L[2]} is vertical, with ${L[0]}${P(pt(ax, ay))} and ${L[2]}${P(pt(ax, cy))}, and the kite is symmetric about it. Given ${L[1]}${P(pt(bx, byv))}, what are the coordinates of ${L[3]}?`,
        choices, correctIndex, tags: ['coordinate'], variant: 'kite',
        explanation: `A kite is symmetric about the diagonal ${L[0]}${L[2]}, which lies on the line x = ${ax}. ${L[3]} is the mirror image of ${L[1]} across that line: same height (${byv}), and the same distance from x = ${ax} on the other side. ${L[1]} is ${bxOff} to the left, so ${L[3]} is ${bxOff} to the right: x = ${dx}. ${L[3]} = ${correct}. Reflecting across the line x = ${ax} keeps y and changes only x.`,
      };
    }
    throw new Error('mk-vertex-symmetric: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 5. Right triangle with horizontal and vertical legs: the right-angle vertex, or the third vertex of a right isosceles
registerTemplate({
  id: 'mk-vertex-right-triangle',
  subtest: 'MK',
  band: 2,
  name: 'Right-angle vertex or third vertex of a right triangle',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const L = h.pick(LABELS);
      const variant = h.pick(['right-angle', 'right-angle', 'isosceles']);
      if (variant === 'right-angle') {
        const x1 = h.int(-8, 6), y1 = h.int(-8, 6);
        const dx = h.int(2, 9) * sign(h), dy = h.int(2, 9) * sign(h);
        if (Math.abs(dx) === Math.abs(dy)) continue;
        const A = pt(x1, y1), B = pt(x1 + dx, y1 + dy);
        const horizontalFromA = h.int(0, 1) === 1; // which of the two legs is horizontal flips the answer
        const C = horizontalFromA ? pt(B.x, A.y) : pt(A.x, B.y);
        const wrongC = horizontalFromA ? pt(A.x, B.y) : pt(B.x, A.y);
        const errs = [P(wrongC), P(swap(C)), P(pt(dx, dy)), P(add(A, B)), P(pt(-C.x, C.y))];
        const correct = P(C);
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        const horiz = horizontalFromA ? `${L[0]}${L[2]} is horizontal and ${L[1]}${L[2]} is vertical` : `${L[0]}${L[2]} is vertical and ${L[1]}${L[2]} is horizontal`;
        return {
          stem: `In triangle ${L[0]}${L[1]}${L[2]}, ${L[0]} is ${P(A)} and ${L[1]} is ${P(B)}. The right angle is at ${L[2]}, and ${horiz}. What are the coordinates of ${L[2]}?`,
          choices, correctIndex, tags: ['coordinate'], variant: `right-angle:${horizontalFromA ? 'A-horizontal' : 'A-vertical'}`,
          explanation: `A horizontal side keeps its y-value; a vertical side keeps its x-value. ${horizontalFromA ? `${L[0]}${L[2]} is horizontal, so ${L[2]} has the same y as ${L[0]} (${A.y}); ${L[1]}${L[2]} is vertical, so it has the same x as ${L[1]} (${B.x})` : `${L[0]}${L[2]} is vertical, so ${L[2]} has the same x as ${L[0]} (${A.x}); ${L[1]}${L[2]} is horizontal, so it has the same y as ${L[1]} (${B.y})`}. ${L[2]} = ${correct}. The other corner of the box, ${P(wrongC)}, puts the right angle at the opposite end: read WHICH side was called horizontal.`,
        };
      }
      // isosceles right triangle with horizontal and vertical legs; the right angle is at C, B is above or below C
      const cx = h.int(-6, 6), cy = h.int(-6, 6), leg = h.int(2, 8);
      const aSide = sign(h), bSide = sign(h);
      const A = pt(cx + aSide * leg, cy), C = pt(cx, cy), B = pt(cx, cy + bSide * leg);
      assert(d2(A, C) === d2(B, C), 'isosceles legs');
      const correct = P(B);
      const errs = [P(pt(cx, cy - bSide * leg)), P(pt(cx + aSide * leg, cy + bSide * leg)), P(pt(cx - aSide * leg, cy)), P(pt(cx + bSide * leg, cy)), P(pt(cx, cy + bSide * leg * 2))];
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: `Triangle ${L[0]}${L[1]}${L[2]} is a right isosceles triangle with the right angle at ${L[2]}${P(C)}. ${L[0]}${L[2]} is horizontal with ${L[0]} at ${P(A)}, and ${L[1]} lies ${bSide > 0 ? 'above' : 'below'} ${L[2]}. What are the coordinates of ${L[1]}?`,
        choices, correctIndex, tags: ['coordinate'], variant: `right-isosceles:${bSide > 0 ? 'above' : 'below'}`,
        explanation: `The legs are equal and meet at a right angle. ${L[0]}${L[2]} is horizontal with length |${A.x} − ${C.x < 0 ? `(${C.x})` : C.x}| = ${leg}, so ${L[1]}${L[2]} is vertical with the same length ${leg}. ${L[1]} keeps ${L[2]}'s x (${cx}) and sits ${leg} ${bSide > 0 ? 'above' : 'below'} it: y = ${cy} ${bSide > 0 ? '+' : '−'} ${leg} = ${B.y}. ${L[1]} = ${correct}.`,
      };
    }
    throw new Error('mk-vertex-right-triangle: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 6. Classify a triangle from its coordinates (right? isosceles? both? neither?)
const tilt = (h) => { const [a, b] = h.pick([[3, 4], [4, 3]]); return pt(a * sign(h), b * sign(h)); };
const TRI_CHOICES = ['scalene, no right angle', 'isosceles, no right angle', 'right, but scalene', 'right and isosceles', 'equilateral'];
registerTemplate({
  id: 'mk-triangle-classify',
  subtest: 'MK',
  band: 3,
  name: 'Classify a triangle from its vertices',
  concepts: ['triangle-from-coordinates'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const type = h.pick([0, 1, 2, 3]); // index into TRI_CHOICES (4 = equilateral is never possible on whole-number grid points)
      const O = pt(h.int(-6, 4), h.int(-6, 4));
      let pts;
      if (type === 3) {
        const u = h.int(0, 1) ? tilt(h) : pt(h.int(2, 7) * sign(h), 0);
        pts = [O, add(O, u), add(O, rotCCW(u))];
      } else if (type === 2) {
        const u = tilt(h), m = h.int(1, 2);
        const q = h.int(1, 2);
        pts = [O, add(O, scale(u, q)), add(O, scale(rotCCW(u), m))];
        if (m === q) continue;
      } else if (type === 1) {
        const half = h.int(2, 6), ht = h.int(1, 8);
        if (ht === half) continue; // that is the right isosceles
        pts = [add(O, pt(-half, 0)), add(O, pt(half, 0)), add(O, pt(0, ht))];
      } else {
        const x3 = h.int(-3, 7), y3 = h.int(-3, 7);
        pts = [O, add(O, pt(h.int(3, 8), h.int(-2, 2))), add(O, pt(x3, y3))];
      }
      const s = [d2(pts[0], pts[1]), d2(pts[1], pts[2]), d2(pts[0], pts[2])].sort((a, b) => a - b);
      if (cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])) === 0) continue; // collinear
      const right = s[0] + s[1] === s[2];
      const iso = s[0] === s[1] || s[1] === s[2];
      const equi = s[0] === s[2];
      assert(!equi, 'whole-number points cannot make an equilateral triangle');
      const kind = right ? (iso ? 3 : 2) : (iso ? 1 : 0);
      if (kind !== type) continue; // only keep draws that are the type we meant, so every type turns up
      const order = shuffle(pts, rng);
      const correct = TRI_CHOICES[kind];
      const errs = TRI_CHOICES.filter((_, i) => i !== kind);
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: (() => { const L = h.pick(LABELS); const v = order.map((p, i) => `${L[i]}${P(p)}`).join(', '); return pickPhrase(h, [`Triangle ${L.slice(0, 3).join('')} has vertices ${v}. Which description fits it best?`, `Which of these describes the triangle with vertices ${v}?`, `The points ${v} are joined to make a triangle. What kind of triangle is it?`]); })(),
        choices, correctIndex, tags: ['coordinate'], variant: `classify:${correct}`,
        explanation: `Find the squared side lengths with (Δx)² + (Δy)², no square roots needed: ${s.join(', ')}. ${iso ? 'Two are equal, so it is isosceles.' : 'None are equal, so it is scalene.'} ${right ? `${s[0]} + ${s[1]} = ${s[2]}, so the Pythagorean theorem holds and it has a right angle.` : `${s[0]} + ${s[1]} = ${s[0] + s[1]}, not ${s[2]}, so there is no right angle.`} That is: ${correct}. An equilateral triangle is never the answer for points on whole-number grid positions.`,
      };
    }
    throw new Error('mk-triangle-classify: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 7. Perimeter of a rectangle, parallelogram or rhombus from its vertices (tilted sides come in whole-number lengths)
registerTemplate({
  id: 'mk-perimeter-polygon',
  subtest: 'MK',
  band: 3,
  name: 'Perimeter of a polygon from its vertices',
  concepts: ['coordinate-area'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const kind = h.pick(['rectangle', 'parallelogram', 'rhombus']);
      let u, v;
      if (kind === 'rhombus') ({ u, v } = sideVectors(h, 'rhombus'));
      else if (kind === 'rectangle') ({ u, v } = sideVectors(h, 'rectangle'));
      else { u = latticeVec(h); v = h.int(0, 1) ? pt(h.int(3, 9) * sign(h), 0) : latticeVec(h); }
      if (cross(u, v) === 0) continue;
      const lu = len(u), lv = len(v);
      if (!Number.isInteger(lu) || !Number.isInteger(lv)) continue;
      const A = pt(h.int(-6, 3), h.int(-6, 3));
      const verts = [A, add(A, u), add(add(A, u), v), add(A, v)];
      if (!small(verts, 18)) continue;
      const L = h.pick(LABELS);
      const per = 2 * (lu + lv);
      assert(per === Math.sqrt(d2(verts[0], verts[1])) + Math.sqrt(d2(verts[1], verts[2])) + Math.sqrt(d2(verts[2], verts[3])) + Math.sqrt(d2(verts[3], verts[0])), 'perimeter check');
      // Error modes: added the horizontal and vertical steps instead of the slanted length; forgot to double;
      // reported the area (for a rectangle or parallelogram it is the cross product); used 4 x one side.
      const steps = 2 * (Math.abs(u.x) + Math.abs(u.y) + Math.abs(v.x) + Math.abs(v.y));
      const errs = intStrs([steps, lu + lv, Math.abs(cross(u, v)), 4 * lu, 2 * lu + lv, lu + 2 * lv]);
      const correct = String(per);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: pickPhrase(h, [`${kind[0].toUpperCase() + kind.slice(1)} ${L.join('')} has vertices ${verts.map((p, i) => named(L, i, p)).join(', ')}. What is its perimeter?`, `A ${kind} is drawn through ${verts.map((p, i) => named(L, i, p)).join(', ')}. How far is it around the figure?`, `Find the perimeter of ${kind} ${L.join('')}, whose corners in order are ${verts.map((p, i) => named(L, i, p)).join(', ')}.`]),
        choices, correctIndex, tags: ['coordinate'], variant: kind,
        explanation: `Opposite sides are equal, so the perimeter is 2 × (one side + the next side). Side ${L[0]}${L[1]}: the steps are (${Math.abs(u.x)}, ${Math.abs(u.y)}), so its length is √(${Math.abs(u.x)}² + ${Math.abs(u.y)}²) = ${lu}. Side ${L[1]}${L[2]}: steps (${Math.abs(v.x)}, ${Math.abs(v.y)}), length ${lv}. Perimeter = 2(${lu} + ${lv}) = ${per}. Adding the steps instead of taking the length (${steps}) is the common slip.`,
      };
    }
    throw new Error('mk-perimeter-polygon: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 8. Area of a triangle whose base is horizontal or vertical (right triangles included)
registerTemplate({
  id: 'mk-area-triangle-base',
  subtest: 'MK',
  band: 2,
  name: 'Area of a triangle from its vertices',
  concepts: ['coordinate-area'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const horizontal = h.int(0, 1) === 1;
      const x1 = h.int(-7, 1), y1 = h.int(-7, 1);
      const base = h.int(3, 11), height = h.int(2, 9);
      if ((base * height) % 2 !== 0 || base === height) continue;
      const off = h.int(-4, base + 3); // where the third vertex sits along the base: it does not matter
      const right = h.int(0, 3) === 0; // a right triangle: the third vertex above an end of the base
      const along = right ? (h.int(0, 1) ? 0 : base) : off;
      const sg = sign(h);
      const A = pt(x1, y1);
      const B = horizontal ? pt(x1 + base, y1) : pt(x1, y1 + base);
      const C = horizontal ? pt(x1 + along, y1 + sg * height) : pt(x1 + sg * height, y1 + along);
      const area = (base * height) / 2;
      assert(shoelace([A, B, C]) === area, 'triangle area check');
      // Error modes: forgot the 1/2; added base and height; doubled instead of halving; added the base or the height to the answer.
      const errs = intStrs([base * height, base + height, base * height * 2, area + base, area + height]);
      const correct = String(area);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      const pts = shuffle([A, B, C], rng);
      return {
        stem: (() => { const L = h.pick(LABELS); const v = pts.map((p, i) => `${L[i]}${P(p)}`).join(', '); return pickPhrase(h, [`Triangle ${L.slice(0, 3).join('')} has vertices ${v}. What is its area?`, `What is the area of the triangle whose vertices are ${v}?`, `A triangle is drawn through ${v}. Find its area.`]); })(),
        choices, correctIndex, tags: ['coordinate'], variant: `${horizontal ? 'horizontal' : 'vertical'}-base:${right ? 'right' : 'oblique'}`,
        explanation: `${horizontal ? `Two vertices share y = ${A.y}, so that side is a horizontal base of length ${base}.` : `Two vertices share x = ${A.x}, so that side is a vertical base of length ${base}.`} The height is the perpendicular distance from the third vertex to the base's line: ${horizontal ? `|${C.y} − ${A.y < 0 ? `(${A.y})` : A.y}| = ${height}` : `|${C.x} − ${A.x < 0 ? `(${A.x})` : A.x}| = ${height}`}. Area = (1/2) × base × height = (1/2)(${base})(${height}) = ${area}. Where the third vertex sits ALONG the base does not change the area, and leaving out the 1/2 gives ${base * height}, the area of the full rectangle.`,
      };
    }
    throw new Error('mk-area-triangle-base: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 9. Area of a quadrilateral: rectangle from corners, parallelogram, trapezoid, rhombus or kite by its diagonals
registerTemplate({
  id: 'mk-area-quadrilateral',
  subtest: 'MK',
  band: 3,
  name: 'Area of a rectangle, parallelogram, trapezoid, rhombus or kite',
  concepts: ['coordinate-area'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const variant = h.pick(['rectangle', 'parallelogram', 'trapezoid', 'rhombus']);
      const L = h.pick(LABELS);
      const x0 = h.int(-7, 1), y0 = h.int(-7, 1);
      if (variant === 'rectangle') {
        const w = h.int(2, 9), ht = h.int(2, 9);
        if (w === ht) continue;
        const A = pt(x0, y0), C = pt(x0 + w, y0 + ht);
        const flip = h.int(0, 1);
        const p = flip ? pt(A.x, C.y) : A, q = flip ? pt(C.x, A.y) : C;
        const errs = intStrs([2 * (w + ht), w + ht, Math.abs(q.x * q.y) || w + ht + 1, w * w + ht * ht]);
        const correct = String(w * ht);
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        return {
          stem: `Opposite corners of a rectangle with sides parallel to the axes are ${P(p)} and ${P(q)}. What is its area?`,
          choices, correctIndex, tags: ['coordinate'], variant: 'rectangle',
          explanation: `Subtract to get the side lengths: across |${q.x} − ${p.x < 0 ? `(${p.x})` : p.x}| = ${w}, up |${q.y} − ${p.y < 0 ? `(${p.y})` : p.y}| = ${ht}. Area = ${w} × ${ht} = ${w * ht}. The coordinates say WHERE the rectangle is; the differences say how BIG it is.`,
        };
      }
      if (variant === 'parallelogram') {
        const b = h.int(3, 9), [sx, hy] = h.pick([[3, 4], [4, 3], [5, 12], [6, 8], [8, 6]]);
        const shift = sx * sign(h);
        const A = pt(x0, y0), B = pt(x0 + b, y0), C = pt(x0 + b + shift, y0 + hy), D = pt(x0 + shift, y0 + hy);
        const slant = Math.hypot(shift, hy);
        const area = b * hy;
        assert(shoelace([A, B, C, D]) === area, 'parallelogram area check');
        const errs = intStrs([b * slant, b + hy, 2 * (b + slant), b * Math.abs(shift), (b * hy) / 2]);
        const correct = String(area);
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        return {
          stem: `Parallelogram ${L.join('')} has vertices ${[A, B, C, D].map((p, i) => named(L, i, p)).join(', ')}. What is its area?`,
          choices, correctIndex, tags: ['coordinate'], variant: 'parallelogram',
          explanation: `${L[0]}${L[1]} is horizontal, so it is the base: length ${b}. The height is the VERTICAL distance between the two horizontal sides, ${hy}, not the slanted side (${slant}). Area = base × height = ${b} × ${hy} = ${area}. Multiplying by the slanted side (${b * slant}) is the standard wrong answer.`,
        };
      }
      if (variant === 'trapezoid') {
        const b1 = h.int(4, 12), b2 = h.int(2, b1 - 1), ht = h.int(2, 8);
        if (((b1 + b2) * ht) % 2 !== 0) continue;
        const shift = h.int(0, b1 - b2);
        const A = pt(x0, y0), B = pt(x0 + b1, y0), C = pt(x0 + shift + b2, y0 + ht), D = pt(x0 + shift, y0 + ht);
        const area = ((b1 + b2) * ht) / 2;
        assert(shoelace([A, B, C, D]) === area, 'trapezoid area check');
        const errs = intStrs([(b1 + b2) * ht, b1 * ht, b2 * ht, (b1 + b2) + ht, ((b1 - b2) * ht) / 2]);
        const correct = String(area);
        if (!distinct([correct, ...errs])) continue;
        const { choices, correctIndex } = h.choices(correct, errs);
        return {
          stem: `Trapezoid ${L.join('')} has ${L[0]}${L[1]} parallel to ${L[3]}${L[2]}, with vertices ${[A, B, C, D].map((p, i) => named(L, i, p)).join(', ')}. What is its area?`,
          choices, correctIndex, tags: ['coordinate'], variant: 'trapezoid',
          explanation: `The parallel sides are horizontal: ${L[0]}${L[1]} has length ${b1} and ${L[3]}${L[2]} has length ${b2}. The height is the distance between them, ${ht}. Area = (1/2)(${b1} + ${b2})(${ht}) = ${area}. Leaving out the 1/2 gives ${(b1 + b2) * ht}.`,
        };
      }
      // rhombus or kite with its diagonals on lines parallel to the axes: area = half the product of the diagonals
      const p = h.int(2, 7), q = h.int(2, 7);
      if (p === q) continue;
      const cx = x0 + p, cy = y0 + q;
      const V = [pt(cx - p, cy), pt(cx, cy + q), pt(cx + p, cy), pt(cx, cy - q)];
      const area = 2 * p * q;
      assert(shoelace(V) === area, 'rhombus area check');
      const errs = intStrs([p * q, 4 * p * q, p + q, 2 * (p + q), (p * q) / 2]);
      const correct = String(area);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: `A rhombus has vertices ${V.map((pp, i) => named(L, i, pp)).join(', ')}. What is its area?`,
        choices, correctIndex, tags: ['coordinate'], variant: 'rhombus',
        explanation: `The diagonals of a rhombus are perpendicular. Here they are horizontal and vertical: ${L[0]}${L[2]} runs from x = ${V[0].x} to x = ${V[2].x}, length ${2 * p}; ${L[1]}${L[3]} runs from y = ${V[3].y} to y = ${V[1].y}, length ${2 * q}. Area = (1/2) × d₁ × d₂ = (1/2)(${2 * p})(${2 * q}) = ${area}. Multiplying the HALF-diagonals (${p * q}) forgets that each diagonal has two halves.`,
      };
    }
    throw new Error('mk-area-quadrilateral: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 10. Centroid of a triangle
registerTemplate({
  id: 'mk-centroid',
  subtest: 'MK',
  band: 3,
  name: 'Centroid of a triangle',
  concepts: ['triangle-from-coordinates'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const xs = [h.int(-8, 8), h.int(-8, 8)], ys = [h.int(-8, 8), h.int(-8, 8)];
      // pick the third coordinate so each sum is a multiple of 3 (a whole-number centroid)
      const x3 = (() => { const c = []; for (let v = -8; v <= 8; v++) if ((xs[0] + xs[1] + v) % 3 === 0) c.push(v); return h.pick(c); })();
      const y3 = (() => { const c = []; for (let v = -8; v <= 8; v++) if ((ys[0] + ys[1] + v) % 3 === 0) c.push(v); return h.pick(c); })();
      const T = [pt(xs[0], ys[0]), pt(xs[1], ys[1]), pt(x3, y3)];
      if (cross(sub(T[1], T[0]), sub(T[2], T[0])) === 0) continue;
      const Sx = T[0].x + T[1].x + T[2].x, Sy = T[0].y + T[1].y + T[2].y;
      const G = pt(Sx / 3, Sy / 3);
      const m01 = wholeMid(T[0], T[1]);
      // Error modes: added the coordinates and never divided; divided by 2; averaged only two vertices;
      // averaged x and y of different vertices; swapped x and y.
      const errs = [P(pt(Sx, Sy)), P(pt(Sx / 2, Sy / 2)), m01 ? P(m01) : P(swap(G)), P(pt(G.x, Sy)), P(pt(Sx, G.y))]
        .filter((s) => !/\./.test(s));
      const correct = P(G);
      if (errs.length < 4 || !distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: (() => { const L = h.pick(LABELS); const v = T.map((p, i) => `${L[i]}${P(p)}`).join(', '); return pickPhrase(h, [`Triangle ${L.slice(0, 3).join('')} has vertices ${v}. What are the coordinates of its centroid, the point where the three medians meet?`, `Find the centroid of the triangle with vertices ${v}.`, `The medians of triangle ${L.slice(0, 3).join('')}, with ${v}, meet at a single point. What are its coordinates?`]); })(),
        choices, correctIndex, tags: ['coordinate'], variant: 'centroid',
        explanation: `The centroid is the AVERAGE of the three vertices, coordinate by coordinate: x = (${T.map((p) => (p.x < 0 ? `(${p.x})` : p.x)).join(' + ')})/3 = ${Sx}/3 = ${G.x}, y = (${T.map((p) => (p.y < 0 ? `(${p.y})` : p.y)).join(' + ')})/3 = ${Sy}/3 = ${G.y}. It is the same idea as a midpoint, with three points instead of two, so divide by 3, not 2.`,
      };
    }
    throw new Error('mk-centroid: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 11. Where do the diagonals meet? (the midpoint of either diagonal)
registerTemplate({
  id: 'mk-diagonals-meet',
  subtest: 'MK',
  band: 2,
  name: 'Where the diagonals of a parallelogram meet',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const kind = h.pick(['parallelogram', 'rectangle', 'rhombus', 'square']);
      const { u, v } = sideVectors(h, kind);
      if (cross(u, v) === 0) continue;
      const A = pt(h.int(-6, 3), h.int(-6, 3));
      const verts = [A, add(A, u), add(add(A, u), v), add(A, v)];
      if (!small(verts)) continue;
      const L = h.pick(LABELS);
      const M = wholeMid(verts[0], verts[2]);
      if (!M) continue;
      assert(same(M, wholeMid(verts[1], verts[3])), 'diagonals share a midpoint');
      const m01 = wholeMid(verts[0], verts[1]);
      const errs = [P(add(verts[0], verts[2])), m01 ? P(m01) : P(swap(M)), P(swap(M)), P(sub(verts[2], verts[0])), P(verts[3])];
      const correct = P(M);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: `${kind[0].toUpperCase() + kind.slice(1)} ${L.join('')} has vertices ${verts.map((p, i) => named(L, i, p)).join(', ')}. At what point do its diagonals ${L[0]}${L[2]} and ${L[1]}${L[3]} cross?`,
        choices, correctIndex, tags: ['coordinate'], variant: kind,
        explanation: `The diagonals of a parallelogram bisect each other, so they cross at the MIDPOINT of either one. Midpoint of ${L[0]}${L[2]}: ((${A.x} + ${verts[2].x < 0 ? `(${verts[2].x})` : verts[2].x})/2, (${A.y} + ${verts[2].y < 0 ? `(${verts[2].y})` : verts[2].y})/2) = ${correct}. The midpoint of ${L[1]}${L[3]} gives the same point, which is a good check.`,
      };
    }
    throw new Error('mk-diagonals-meet: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 12. The image of a point under a reflection, rotation or translation
const OPS = [
  { id: 'rx', say: 'reflected across the x-axis', f: (p) => pt(p.x, -p.y), name: 'a reflection across the x-axis', rule: '(x, y) → (x, −y)' },
  { id: 'ry', say: 'reflected across the y-axis', f: (p) => pt(-p.x, p.y), name: 'a reflection across the y-axis', rule: '(x, y) → (−x, y)' },
  { id: 'rd', say: 'reflected across the line y = x', f: (p) => pt(p.y, p.x), name: 'a reflection across the line y = x', rule: '(x, y) → (y, x)' },
  { id: 'rn', say: 'reflected across the line y = −x', f: (p) => pt(-p.y, -p.x), name: 'a reflection across the line y = −x', rule: '(x, y) → (−y, −x)' },
  { id: 'cc', say: 'rotated 90° counterclockwise about the origin', f: (p) => pt(-p.y, p.x), name: 'a 90° counterclockwise rotation about the origin', rule: '(x, y) → (−y, x)' },
  { id: 'cw', say: 'rotated 90° clockwise about the origin', f: (p) => pt(p.y, -p.x), name: 'a 90° clockwise rotation about the origin', rule: '(x, y) → (y, −x)' },
  { id: 'r180', say: 'rotated 180° about the origin', f: (p) => pt(-p.x, -p.y), name: 'a 180° rotation about the origin', rule: '(x, y) → (−x, −y)' },
];
registerTemplate({
  id: 'mk-transform-point',
  subtest: 'MK',
  band: 2,
  name: 'Image of a point under a reflection, rotation or translation',
  concepts: ['coordinate-transformations'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const p = pt(h.int(-9, 9), h.int(-9, 9));
      if (p.x === 0 || p.y === 0 || Math.abs(p.x) === Math.abs(p.y)) continue; // generic point: every image differs
      const useShift = h.int(0, 3) === 0;
      let op, answer;
      if (useShift) {
        const a = h.int(2, 8) * sign(h), b = h.int(2, 8) * sign(h);
        op = { say: `translated ${Math.abs(a)} units ${a < 0 ? 'left' : 'right'} and ${Math.abs(b)} units ${b < 0 ? 'down' : 'up'}`, rule: `(x, y) → (x ${a < 0 ? '−' : '+'} ${Math.abs(a)}, y ${b < 0 ? '−' : '+'} ${Math.abs(b)})` };
        answer = pt(p.x + a, p.y + b);
      } else {
        op = h.pick(OPS);
        answer = op.f(p);
      }
      const correct = P(answer);
      // Error modes: the image under each of the OTHER transformations, which is exactly what a mixed-up rule gives.
      const clean = [...new Set([...OPS.filter((o) => o !== op).map((o) => P(o.f(p))), P(swap(answer))])].filter((e) => e !== correct);
      if (clean.length < 4) continue;
      const { choices, correctIndex } = h.choices(correct, clean);
      return {
        stem: `The point ${P(p)} is ${op.say}. What are the coordinates of its image?`,
        choices, correctIndex, tags: ['coordinate'], variant: useShift ? 'translate' : op.id,
        explanation: `The rule is ${op.rule}. Applied to ${P(p)}: ${correct}. Check it by picture: a reflection keeps the same distance from the mirror on the other side; a rotation keeps the same distance from the origin.`,
      };
    }
    throw new Error('mk-transform-point: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 13. Which transformation takes this point to that one?
registerTemplate({
  id: 'mk-transform-identify',
  subtest: 'MK',
  band: 3,
  name: 'Name the transformation that moves one point to another',
  concepts: ['coordinate-transformations'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const p = pt(h.int(-9, 9), h.int(-9, 9));
      if (p.x === 0 || p.y === 0 || Math.abs(p.x) === Math.abs(p.y)) continue;
      const op = h.pick(OPS);
      const q = op.f(p);
      const images = OPS.map((o) => P(o.f(p)));
      assert(distinct(images), 'images differ for a generic point');
      const wrong = shuffle(OPS.filter((o) => o.id !== op.id), rng).slice(0, 4).map((o) => o.name);
      const { choices, correctIndex } = h.choices(op.name, wrong);
      return {
        stem: pickPhrase(h, [`Under a certain transformation, the point ${P(p)} moves to ${P(q)}. Which transformation is it?`, `A single transformation takes ${P(p)} to ${P(q)}. Which one?`, `The image of ${P(p)} is ${P(q)}. Which transformation produced it?`]),
        choices, correctIndex, tags: ['coordinate'], variant: op.id,
        explanation: `Test the candidates on ${P(p)}. ${op.name[0].toUpperCase() + op.name.slice(1)} follows ${op.rule}, which sends ${P(p)} to ${P(q)}. Every other choice sends ${P(p)} somewhere different (for example a reflection across the x-axis would give ${P(pt(p.x, -p.y))}). Swapping the two coordinates with no sign change is a reflection across y = x; swapping and negating one of them is a rotation.`,
      };
    }
    throw new Error('mk-transform-identify: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 14. Collinear points: find k so three points lie on one line
registerTemplate({
  id: 'mk-collinear-k',
  subtest: 'MK',
  band: 3,
  name: 'Find k so that three points lie on one line',
  concepts: ['collinear-points'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const m = h.int(1, 6) * sign(h);
      const x1 = h.int(-6, 2), step1 = h.int(1, 4), step2 = h.int(1, 4);
      if (step1 === step2) continue;
      const y1 = h.int(-6, 6);
      const A = pt(x1, y1), B = pt(x1 + step1, y1 + m * step1), C = pt(x1 + step1 + step2, y1 + m * (step1 + step2));
      const k = C.y;
      const L = h.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z']]);
      assert(cross(sub(B, A), sub(C, A)) === 0, 'collinear check');
      // Error modes: added the runs to y; added the slope once instead of once per step; reused the middle point's y;
      // stepped the slope the wrong way; added the first two y-values.
      const errs = intStrs([y1 + step1 + step2, B.y + m, B.y, B.y - m * step2, A.y + B.y, C.y + m]);
      const correct = String(k);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: pickPhrase(h, [`The points ${L[0]}${P(A)}, ${L[1]}${P(B)} and ${L[2]}(${C.x}, k) all lie on the same straight line. What is the value of k?`, `${L[0]}${P(A)}, ${L[1]}${P(B)} and ${L[2]}(${C.x}, k) are collinear. Find k.`, `For what value of k is ${L[2]}(${C.x}, k) on the line through ${L[0]}${P(A)} and ${L[1]}${P(B)}?`]),
        choices, correctIndex, tags: ['coordinate'], variant: m > 0 ? 'rising' : 'falling',
        explanation: `Points on one line share one slope. From ${L[0]} to ${L[1]}: rise ${B.y} − ${A.y < 0 ? `(${A.y})` : A.y} = ${B.y - A.y}, run ${step1}, slope ${m}. From ${L[1]} to ${L[2]} the run is ${step2}, so the rise must be ${m} × ${step2} = ${m * step2}. k = ${B.y} + ${m * step2 < 0 ? `(${m * step2})` : m * step2} = ${k}. Check with ${L[0]} to ${L[2]}: (${k} − ${A.y < 0 ? `(${A.y})` : A.y})/${C.x - A.x} = ${m}. ✓`,
      };
    }
    throw new Error('mk-collinear-k: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 15. Which of these points COULD be the fourth vertex of a parallelogram? (three answers are valid in the world, one is offered)
registerTemplate({
  id: 'mk-vertex-could-be',
  subtest: 'MK',
  band: 3,
  name: 'Which point could be the fourth vertex of a parallelogram',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const T = [pt(h.int(-7, 7), h.int(-7, 7)), pt(h.int(-7, 7), h.int(-7, 7)), pt(h.int(-7, 7), h.int(-7, 7))];
      if (cross(sub(T[1], T[0]), sub(T[2], T[0])) === 0) continue;
      const valid = [sub(add(T[0], T[1]), T[2]), sub(add(T[0], T[2]), T[1]), sub(add(T[1], T[2]), T[0])];
      const validKeys = new Set(valid.map(P));
      if (validKeys.size !== 3) continue;
      const pickIdx = h.int(0, 2);
      const ans = valid[pickIdx];
      // Error modes: added all three (never subtracted); extended a side past a vertex (a straight line, not a
      // parallelogram); swapped x and y of a valid answer; negated one coordinate of a valid answer.
      const cands = [
        add(add(T[0], T[1]), T[2]), sub(scale(T[0], 2), T[1]), sub(scale(T[1], 2), T[2]), sub(scale(T[2], 2), T[0]),
        swap(ans), pt(-ans.x, ans.y), pt(ans.x, -ans.y),
      ];
      const errs = [];
      for (const c of cands) { const k = P(c); if (!validKeys.has(k) && !errs.includes(k) && k !== P(ans)) errs.push(k); }
      if (errs.length < 4) continue;
      const correct = P(ans);
      const { choices, correctIndex } = h.choices(correct, errs);
      const L = h.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z']]);
      return {
        stem: pickPhrase(h, [
          `Three vertices of a parallelogram are ${T.map((p, i) => `${L[i]}${P(p)}`).join(', ')}. Which of the following could be the fourth vertex?`,
          `A parallelogram has vertices ${T.map((p, i) => `${L[i]}${P(p)}`).join(', ')} and a fourth vertex D. Which of these could be D?`,
          `Which of these points could complete a parallelogram with ${T.map(P).join(', ')}?`,
        ]),
        choices, correctIndex, tags: ['coordinate'],
        variant: `could-be:answer-${pickIdx}`,
        explanation: `Any one of the three given points can be the corner opposite the missing one, so there are THREE points that complete a parallelogram: ${valid.map((v) => P(v)).join(', ')}. (Each is the sum of two given points minus the third.) Exactly one of them is offered: ${correct}. The others offered are not on that list.`,
      };
    }
    throw new Error('mk-vertex-could-be: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 16. The opposite vertex, given the point where the diagonals cross
registerTemplate({
  id: 'mk-vertex-opposite-centre',
  subtest: 'MK',
  band: 2,
  name: 'Opposite vertex from the point where the diagonals meet',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const kind = h.pick(['parallelogram', 'rectangle', 'rhombus', 'square']);
      const L = h.pick(LABELS);
      const M = pt(h.int(-6, 6), h.int(-6, 6));
      const step = pt(h.int(1, 9) * sign(h), h.int(-8, 8));
      if (step.x === 0 && step.y === 0) continue;
      const i = h.int(0, 3);
      const V = add(M, step), W = sub(M, step); // V is given, W is the opposite vertex
      const errs = [P(step), P(add(V, M)), P(swap(W)), P(sub(scale(V, 2), M)), P(pt(-V.x, -V.y)), P(sub(V, scale(M, 0)))].filter((e) => e !== P(W));
      const correct = P(W);
      const uniq = [...new Set(errs)];
      if (uniq.length < 4) continue;
      const { choices, correctIndex } = h.choices(correct, uniq);
      return {
        stem: pickPhrase(h, [
          `The diagonals of ${kind} ${L.join('')} meet at ${P(M)}. Vertex ${L[i]} is ${P(V)}. What are the coordinates of vertex ${L[(i + 2) % 4]}?`,
          `${kind[0].toUpperCase() + kind.slice(1)} ${L.join('')} has its center at ${P(M)}, where the diagonals cross, and ${L[i]} is at ${P(V)}. Where is ${L[(i + 2) % 4]}, the opposite vertex?`,
          `Diagonals ${L[0]}${L[2]} and ${L[1]}${L[3]} of ${kind} ${L.join('')} intersect at ${P(M)}. If ${L[i]} = ${P(V)}, find ${L[(i + 2) % 4]}.`,
        ]),
        choices, correctIndex, tags: ['coordinate'],
        variant: `opposite-centre:${kind}`,
        explanation: `The diagonals bisect each other, so the crossing point ${P(M)} is the MIDPOINT of ${L[i]}${L[(i + 2) % 4]}. If the midpoint of ${L[i]}${L[(i + 2) % 4]} is ${P(M)} and ${L[i]} = ${P(V)}, then ${L[(i + 2) % 4]} = 2 × ${P(M)} − ${P(V)} = (${2 * M.x} − ${V.x < 0 ? `(${V.x})` : V.x}, ${2 * M.y} − ${V.y < 0 ? `(${V.y})` : V.y}) = ${correct}. Take the step from ${L[i]} to the center and take it once more.`,
      };
    }
    throw new Error('mk-vertex-opposite-centre: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 17. The third vertex of a triangle, given the centroid
registerTemplate({
  id: 'mk-vertex-from-centroid',
  subtest: 'MK',
  band: 3,
  name: 'Third vertex of a triangle from its centroid',
  concepts: ['polygon-vertices', 'triangle-from-coordinates'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const A = pt(h.int(-8, 8), h.int(-8, 8)), B = pt(h.int(-8, 8), h.int(-8, 8)), G = pt(h.int(-5, 5), h.int(-5, 5));
      const C = sub(sub(scale(G, 3), A), B);
      if (Math.abs(C.x) > 12 || Math.abs(C.y) > 12) continue;
      if (cross(sub(B, A), sub(C, A)) === 0) continue;
      assert(same(pt((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3), G), 'centroid check');
      // Error modes: forgot to multiply the centroid by 3; subtracted instead of adding the centroid;
      // used 2 instead of 3; averaged the two given vertices and the centroid; swapped x and y.
      const errs = [P(sub(sub(G, A), B)), P(sub(add(scale(G, 3), A), B)), P(sub(sub(scale(G, 2), A), B)), P(swap(C)), P(add(A, B))];
      // Ask for the whole point, one coordinate of it, or the sum of its coordinates: the same facts, three different questions.
      const ask = h.pick(['point', 'point', 'x', 'y', 'sum']);
      const errPts = [sub(sub(G, A), B), sub(add(scale(G, 3), A), B), sub(sub(scale(G, 2), A), B), swap(C), add(A, B)];
      const asNum = { x: (e) => String(e.x), y: (e) => String(e.y), sum: (e) => String(e.x + e.y) };
      const correct = ask === 'point' ? P(C) : asNum[ask](C);
      const wrong = ask === 'point' ? errs : errPts.map(asNum[ask]);
      if (!distinct([correct, ...wrong])) continue;
      const { choices, correctIndex } = h.choices(correct, wrong);
      const L = h.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z']]);
      const askText = {
        point: `what are the coordinates of ${L[2]}?`,
        x: `what is the x-coordinate of ${L[2]}?`,
        y: `what is the y-coordinate of ${L[2]}?`,
        sum: `what is the sum of the coordinates of ${L[2]}?`,
      }[ask];
      const askThird = {
        point: 'What is the third vertex?',
        x: 'What is the x-coordinate of the third vertex?',
        y: 'What is the y-coordinate of the third vertex?',
        sum: 'What is the sum of the coordinates of the third vertex?',
      }[ask];
      const cap = (t) => t[0].toUpperCase() + t.slice(1);
      return {
        stem: pickPhrase(h, [
          `The centroid of triangle ${L.join('')} is ${P(G)}. If ${L[0]} is ${P(A)} and ${L[1]} is ${P(B)}, ${askText}`,
          `Triangle ${L.join('')} has ${L[0]}${P(A)}, ${L[1]}${P(B)} and centroid ${P(G)}. ${cap(askText)}`,
          `Two vertices of a triangle are ${P(A)} and ${P(B)}, and its centroid is ${P(G)}. ${askThird}`,
        ]),
        choices, correctIndex, tags: ['coordinate'],
        variant: `from-centroid:${ask}`,
        explanation: `The centroid is the average of the three vertices: ${P(G)} = ((${A.x} + ${B.x < 0 ? `(${B.x})` : B.x} + x)/3, (${A.y} + ${B.y < 0 ? `(${B.y})` : B.y} + y)/3). Multiply by 3 first: the three x-values must add to ${3 * G.x} and the three y-values to ${3 * G.y}. So the third vertex is (${3 * G.x} − ${A.x < 0 ? `(${A.x})` : A.x} − ${B.x < 0 ? `(${B.x})` : B.x}, ${3 * G.y} − ${A.y < 0 ? `(${A.y})` : A.y} − ${B.y < 0 ? `(${B.y})` : B.y}) = ${correct}.`,
      };
    }
    throw new Error('mk-vertex-from-centroid: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 18. Solve for an unknown coordinate k so that the four points make a parallelogram
registerTemplate({
  id: 'mk-vertex-unknown-k',
  subtest: 'MK',
  band: 3,
  name: 'Find the unknown coordinate that makes a parallelogram',
  concepts: ['polygon-vertices'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const kind = h.pick(['parallelogram', 'parallelogram', 'rectangle', 'rhombus']);
      const { u, v } = sideVectors(h, kind);
      if (cross(u, v) === 0) continue;
      const A = pt(h.int(-6, 3), h.int(-6, 3));
      const V = [A, add(A, u), add(add(A, u), v), add(A, v)];
      if (!small(V)) continue;
      const L = h.pick(LABELS);
      const idx = h.int(0, 3), axis = h.pick(['x', 'y']);
      const n1 = V[(idx + 1) % 4], n2 = V[(idx + 3) % 4], opp = V[(idx + 2) % 4];
      const answer = n1[axis] + n2[axis] - opp[axis];
      assert(answer === V[idx][axis], 'unknown-k rule');
      // Error modes: forgot to subtract the opposite corner; swapped the roles of the three corners; copied the opposite
      // corner's coordinate; subtracted the neighbours.
      const errs = [n1[axis] + n2[axis], n1[axis] + opp[axis] - n2[axis], n2[axis] + opp[axis] - n1[axis], opp[axis], n1[axis] - n2[axis]].map(String);
      const correct = String(answer);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      const show = V.map((p, i) => (i === idx ? `${L[i]}${axis === 'x' ? `(k, ${p.y})` : `(${p.x}, k)`}` : `${L[i]}${P(p)}`)).join(', ');
      return {
        stem: pickPhrase(h, [
          `${L.join('')} is a parallelogram with vertices ${show}, in order. What is the value of k?`,
          `The points ${show} are the vertices of a parallelogram ${L.join('')}, lettered in order around it. Find k.`,
          `For what value of k are ${show} the consecutive vertices of a parallelogram?`,
        ]),
        choices, correctIndex, tags: ['coordinate'],
        variant: `unknown-k:${kind}:${axis}:hide${idx}`,
        explanation: `In a parallelogram the two diagonals share a midpoint, so opposite corners have the same sum: ${L[idx]} + ${L[(idx + 2) % 4]} = ${L[(idx + 1) % 4]} + ${L[(idx + 3) % 4]}. Using the ${axis}-coordinates: k + ${opp[axis] < 0 ? `(${opp[axis]})` : opp[axis]} = ${n1[axis] < 0 ? `(${n1[axis]})` : n1[axis]} + ${n2[axis] < 0 ? `(${n2[axis]})` : n2[axis]}, so k = ${correct}.`,
      };
    }
    throw new Error('mk-vertex-unknown-k: no clean slate');
  },
});

// ---------------------------------------------------------------------------------------------------
// 19. An endpoint, given the other endpoint and the midpoint (belongs to the midpoint concept)
registerTemplate({
  id: 'mk-midpoint-endpoint',
  subtest: 'MK',
  band: 2,
  name: 'Missing endpoint from the midpoint',
  concepts: ['midpoint'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const M = pt(h.int(-8, 8), h.int(-8, 8));
      const step = pt(h.int(1, 9) * sign(h), h.int(-9, 9));
      const given = add(M, step), want = sub(M, step);
      const L = h.pick([['A', 'B'], ['P', 'Q'], ['X', 'Y'], ['E', 'F']]);
      const swapRole = h.int(0, 1);
      const [g, w] = swapRole ? [L[1], L[0]] : [L[0], L[1]];
      // Error modes: gave the step (the midpoint minus the endpoint); added the midpoint and the endpoint; subtracted in
      // the wrong order (endpoint minus midpoint); doubled the midpoint and forgot the endpoint; swapped x and y.
      const errs = [P(sub(M, given)), P(add(M, given)), P(sub(given, M)), P(scale(M, 2)), P(swap(want))];
      const correct = P(want);
      if (!distinct([correct, ...errs])) continue;
      const { choices, correctIndex } = h.choices(correct, errs);
      return {
        stem: pickPhrase(h, [
          `The midpoint of segment ${L.join('')} is ${P(M)}. If ${g} is at ${P(given)}, what are the coordinates of ${w}?`,
          `${P(M)} is the midpoint of ${L.join('')}, and ${g} = ${P(given)}. Find ${w}.`,
          `Segment ${L.join('')} has midpoint ${P(M)}. One endpoint, ${g}, is ${P(given)}. What is the other endpoint?`,
        ]),
        choices, correctIndex, tags: ['coordinate'],
        variant: `midpoint-endpoint:${swapRole ? 'second' : 'first'}-given`,
        explanation: `The midpoint is the average of the endpoints, so each endpoint is the midpoint's step away on the other side. Work each coordinate: if the midpoint's x is ${M.x} and ${g} has x = ${given.x}, then ${w} has x = 2(${M.x}) − ${given.x < 0 ? `(${given.x})` : given.x} = ${want.x}; for y, 2(${M.y}) − ${given.y < 0 ? `(${given.y})` : given.y} = ${want.y}. ${w} = ${correct}. Check: the average of ${given.x} and ${want.x} is ${M.x}.`,
      };
    }
    throw new Error('mk-midpoint-endpoint: no clean slate');
  },
});
