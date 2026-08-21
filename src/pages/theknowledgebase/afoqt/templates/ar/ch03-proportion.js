// Chapter 3 — Proportion, scale and similar figures.
//
// Math Knowledge hands you `3/7 = x/28` and asks you to solve it. Arithmetic Reasoning hands
// you a paragraph and asks you to notice there is a proportion in it at all. That is why these
// concepts are `ar-` prefixed and separate from chapter 2 of the math track: the executing is
// the easy half, and it is not the half being measured.
//
// One habit removes most of the errors in this chapter: WRITE THE UNITS INTO THE FRACTION.
//
//     pounds     pounds                 shadow     shadow
//     ------  =  ------      not        ------  =  ------
//     crates     crates                 height     shadow
//
// Set up with matching units on top and matching units underneath, and an inverted proportion
// becomes visible before you multiply rather than after you have an answer. Every "inverted"
// distractor in this file is what the same numbers produce when that check is skipped - and
// they are always plausible, because they are built from exactly the numbers on the page.

import { registerTemplate } from '../../engine/generator.js';
import { num, money, sweep } from '../util.js';
import { WEIGHABLE, BULK_GOODS, VESSELS, lbs, OATTS } from './words.js';

registerTemplate({
  id: 'ar-proportion-words',
  subtest: 'AR',
  band: 2,
  name: 'Scaling a quantity described in prose',
  concepts: ['ar-proportion-setup'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const obj = h.pick(WEIGHABLE);
    const each = h.int(obj.lo, obj.hi);
    const n1 = h.int(3, 9);
    const n2 = sweep(4, 30, h.int(4, 30), (cand) => {
      if (cand === n1) return null;
      const w1 = n1 * each;
      return [cand * each, w1 + (cand - n1), each, w1 * cand, Math.round((w1 * n1) / cand), w1];
    });
    const w1 = n1 * each;
    const correct = n2 * each;
    const { choices, correctIndex, errors, whys } = h.choices(lbs(num(correct)), [
      { value: lbs(num(w1 + (n2 - n1))), error: 'added-the-difference', why: `added the ${n2 - n1} extra ${obj.many} as ${n2 - n1} pounds` },
      { value: lbs(num(each)), error: 'stopped-at-the-unit-rate', why: `gave the weight of ONE ${obj.one}` },
      { value: lbs(num(w1 * n2)), error: 'skipped-the-divide', why: 'multiplied the whole given weight by the new count' },
      { value: lbs(num(Math.round((w1 * n1) / n2))), error: 'inverted-the-proportion', why: 'scaled by the old count over the new one' },
      { value: lbs(num(w1)), error: 'no-change', why: 'reported the weight that was given' },
    ]);
    return {
      stem: `${n1} identical ${obj.many} weigh ${w1} pounds. At that rate, how much do ${n2} ${obj.many} weigh?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion'],
      explanation: `Find one first: ${w1} / ${n1} = ${each} pounds per ${obj.one}, so ${n2} of them weigh ${n2} x ${each} = ${correct} pounds. Going from ${n1} to ${n2} ${obj.many} is a MULTIPLICATION by ${num(n2 / n1)}, not an addition of ${n2 - n1} - adding gives ${num(w1 + (n2 - n1))}, which quietly assumes each extra ${obj.one} weighs one pound.`,
    };
  },
});

registerTemplate({
  id: 'ar-recipe-scale',
  subtest: 'AR',
  band: 2,
  name: 'Scaling a recipe',
  concepts: ['ar-proportion-setup'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    const perServing = h.pick([0.5, 0.75, 1.25, 1.5, 2, 2.5]);
    const s1 = h.int(4, 8);
    const s2 = sweep(9, 30, h.int(9, 30), (cand) => {
      const a1 = s1 * perServing;
      return [cand * perServing, a1 + (cand - s1), perServing, a1 * cand, a1, a1 * (cand / s1) / 2];
    });
    const a1 = s1 * perServing;
    const correct = s2 * perServing;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} cups`, [
      { value: `${num(a1 + (s2 - s1))} cups`, error: 'added-the-difference', why: `added ${s2 - s1} cups for the ${s2 - s1} extra servings` },
      { value: `${num(perServing)} cups`, error: 'stopped-at-the-unit-rate', why: 'gave the amount for ONE serving' },
      { value: `${num(a1 * s2)} cups`, error: 'skipped-the-divide', why: 'multiplied the given amount by the new serving count' },
      { value: `${num(a1)} cups`, error: 'no-change', why: 'reported the amount that was given' },
      { value: `${num((a1 * s2) / s1 / 2)} cups`, error: 'halved-the-answer', why: 'halved a correct scaling for no reason' },
    ]);
    return {
      stem: `A recipe that serves ${s1} people calls for ${num(a1)} cups of flour. How many cups of flour are needed to serve ${s2} people?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion'],
      explanation: `One serving takes ${num(a1)} / ${s1} = ${num(perServing)} cups, so ${s2} servings take ${s2} x ${num(perServing)} = ${num(correct)} cups. Equivalently the recipe scales by ${s2}/${s1} = ${num(s2 / s1)}. Servings and flour scale by the SAME factor - that single sentence is the whole chapter.`,
    };
  },
});

const TALL_THINGS = [
  { tall: 'flagpole', short: 'fence post' },
  { tall: 'radio tower', short: 'road sign' },
  { tall: 'building', short: 'mailbox' },
  { tall: 'water tower', short: 'street lamp' },
  { tall: 'silo', short: 'fence post' },
  { tall: 'chimney', short: 'parking meter' },
];

registerTemplate({
  id: 'ar-shadow-height',
  subtest: 'AR',
  band: 3,
  name: 'Height from a shadow',
  concepts: ['ar-similar-figures'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const pair = h.pick(TALL_THINGS);
    const refH = h.int(3, 9);
    const k = h.int(4, 14);
    // The reference shadow is swept, and refS === refH is REJECTED outright rather than swept
    // past. When the reference is as tall as its own shadow, height equals shadow for
    // everything in the picture, so three separate error-modes all land on the correct answer
    // at once - a sweep cannot rescue a collision that the swept value causes for every
    // candidate in a whole class. That is the degenerate draw the Phase 3 notes warn about.
    const refS = sweep(2, 8, h.int(2, 8), (cand) => {
      if (cand === refH) return null;
      const s = cand * k;
      return [refH * k, s * cand, s * refH, s, s - cand + refH, s + refH];
    });
    const objS = refS * k;
    const correct = refH * k;
    // These are the official item's own distractor shapes: its key offers 250 and 150 for a
    // 50-foot shadow with a 3-foot/5-foot reference, i.e. shadow x reference-shadow and
    // shadow x reference-height. Both are whole numbers, which matters - a distractor that
    // arrives with a decimal on it is eliminable without doing the problem.
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} feet`, [
      { value: `${num(objS * refS)} feet`, error: 'multiplied-by-the-shadow', why: 'multiplied by the reference shadow instead of dividing by it' },
      { value: `${num(objS * refH)} feet`, error: 'skipped-the-divide', why: 'multiplied the two given lengths and never divided' },
      { value: `${num(objS)} feet`, error: 'answered-with-the-shadow', why: 'reported the shadow as the height' },
      { value: `${num(objS - refS + refH)} feet`, error: 'used-the-difference', why: 'treated the relationship as a fixed difference rather than a ratio' },
      { value: `${num(objS + refH)} feet`, error: 'wrong-operation', why: 'added the two given lengths' },
    ]);
    return {
      stem: `At the same time of day, a ${pair.tall} casts a shadow ${objS} feet long and a ${refH}-foot ${pair.short} casts a shadow ${refS} feet long. How tall is the ${pair.tall}?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion'],
      explanation: `The sun is at the same angle for both, so height and shadow are in the same ratio: height/shadow = ${refH}/${refS}. Then height = ${objS} x ${refH}/${refS} = ${correct} feet. Write the units into the fraction and the slip becomes visible before you multiply - height goes over shadow on BOTH sides. Multiplying ${objS} by ${refH} and never dividing gives ${num(objS * refH)}, which is on the answer sheet and is the most common miss on this item.`,
    };
  },
});

const SCALES = [
  { d: 2, label: 'one half inch' },
  { d: 4, label: 'one quarter inch' },
  { d: 8, label: 'one eighth inch' },
];

registerTemplate({
  id: 'ar-scale-plan',
  subtest: 'AR',
  band: 3,
  name: 'Reading a fractional drawing scale',
  concepts: ['ar-scale-drawing'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const s = h.pick(SCALES);
    // A whole number of scale units, so the drawn measurement is a clean fraction of an inch.
    const units = h.int(6, 60);
    const inches = units / s.d;
    const correct = units;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} feet`, [
      { value: `${num(inches / s.d)} feet`, error: 'divided-not-multiplied', why: `divided by ${s.d} instead of multiplying` },
      { value: `${num(inches)} feet`, error: 'ignored-the-scale', why: 'read the drawn inches straight off as feet' },
      { value: `${num(correct * 12)} feet`, error: 'converted-twice', why: 'converted the answer to inches as well' },
      { value: `${num(inches + s.d)} feet`, error: 'wrong-operation', why: 'added the scale denominator instead of multiplying by it' },
      { value: `${num(correct / 12)} feet`, error: 'converted-twice', why: 'divided the answer by 12 as though it were in inches' },
    ]);
    return {
      stem: `On a floor plan drawn to a scale of ${s.label} to the foot, a wall measures ${num(inches)} inches. How long is the actual wall?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion'],
      explanation: `${s.label.charAt(0).toUpperCase() + s.label.slice(1)} stands for one foot, so every inch on the plan is ${s.d} feet, and ${num(inches)} x ${s.d} = ${correct} feet. A fractional scale is the one case where the real thing is BIGGER by the denominator - "${s.label} to the foot" means the drawing is ${s.d} times smaller, so coming out to the world you multiply.`,
    };
  },
});

registerTemplate({
  id: 'ar-conversion-chain',
  subtest: 'AR',
  band: 4,
  name: 'A rate across two unit changes',
  concepts: ['ar-conversion-chain'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const item = h.pick(VESSELS);
    const quartsPerHour = h.int(2, 9);
    const days = h.int(2, 9);
    const quarts = quartsPerHour * 24 * days;
    const correct = quarts / 4;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} gallons`, [
      { value: `${num(quarts)} gallons`, error: 'never-converted', why: 'left the answer in quarts' },
      { value: `${num(quarts * 4)} gallons`, error: 'converted-backwards', why: 'multiplied by 4 instead of dividing' },
      { value: `${num((quartsPerHour * days) / 4)} gallons`, error: 'dropped-a-step', why: 'never converted days to hours' },
      { value: `${num((quartsPerHour * 24) / 4)} gallons`, error: 'dropped-a-step', why: 'worked out one day and stopped' },
      { value: `${num(quartsPerHour * days * 4)} gallons`, error: 'dropped-a-step', why: 'skipped the hours and inverted the gallon conversion' },
    ]);
    return {
      stem: `A ${item.thing} ${item.verb} ${quartsPerHour} quarts of water every hour. How many GALLONS does it lose in ${days} days?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion', 'units'],
      explanation: `Run the chain one link at a time and cancel units as you go: ${quartsPerHour} quarts/hour x 24 hours/day x ${days} days = ${quarts} quarts, then ${quarts} / 4 = ${correct} gallons. Two conversions means two chances to invert one; the size check catches it - gallons are bigger than quarts, so the gallon figure must be the SMALLER number.`,
    };
  },
});

registerTemplate({
  id: 'ar-best-buy',
  subtest: 'AR',
  band: 3,
  name: 'Comparing two sizes by unit price',
  concepts: ['ar-best-buy'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const good = h.pick(BULK_GOODS);
    const centsA = h.int(12, 40);
    const centsB = sweep(8, 39, h.int(8, 39), (cand) => {
      if (cand === centsA) return null;
      return [Math.abs(centsA - cand), Math.min(centsA, cand), Math.max(centsA, cand), centsA + cand,
        Math.abs(centsA - cand) * 2];
    });
    const sizeA = h.int(6, 15) * 2;
    const sizeB = sizeA + h.int(3, 20);
    const priceA = (sizeA * centsA) / 100;
    const priceB = (sizeB * centsB) / 100;
    const correct = Math.abs(centsA - centsB);
    const { choices, correctIndex, errors, whys } = h.choices(`${correct} cents`, [
      { value: `${Math.min(centsA, centsB)} cents`, error: 'answered-with-a-price', why: 'gave the cheaper unit price rather than the gap between them' },
      { value: `${Math.max(centsA, centsB)} cents`, error: 'answered-with-a-price', why: 'gave the dearer unit price rather than the gap between them' },
      { value: `${Math.round(Math.abs(priceA - priceB) * 100)} cents`, error: 'compared-totals', why: 'compared the two total prices, which are for different amounts' },
      { value: `${centsA + centsB} cents`, error: 'wrong-operation', why: 'added the unit prices' },
      { value: `${correct * 2} cents`, error: 'doubled-the-gap', why: 'doubled the difference' },
    ]);
    const cheaper = centsA < centsB ? 'first' : 'second';
    return {
      stem: `A ${good} is sold in two sizes: ${sizeA} ounces for ${money(priceA)}, or ${sizeB} ounces for ${money(priceB)}. How much less per ounce is the cheaper of the two?`,
      choices, correctIndex, errors, whys,
      tags: ['proportion'],
      explanation: `Reduce both to a price per ounce before comparing anything: ${money(priceA)} / ${sizeA} = ${centsA} cents and ${money(priceB)} / ${sizeB} = ${centsB} cents, so the ${cheaper} is cheaper by ${correct} cents an ounce. Comparing the totals instead compares two different quantities of ${good} and answers nothing - the bigger package costs more AND may still be the better deal.`,
    };
  },
});
