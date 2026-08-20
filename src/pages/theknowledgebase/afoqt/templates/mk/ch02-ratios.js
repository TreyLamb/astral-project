// Chapter 2 — Ratios, proportions and rates.
//
// The whole chapter is one idea applied four ways: two quantities scale by the SAME factor.
// Every error mode below is a failure to identify that factor - adding the difference
// instead of multiplying by it, inverting it, or forgetting a unit conversion inside it.

import { registerTemplate } from '../../engine/generator.js';
import { num } from '../util.js';

registerTemplate({
  id: 'mk-proportion-solve',
  subtest: 'MK',
  band: 2,
  name: 'Solving a proportion',
  concepts: ['proportion-solving'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const b = h.int(2, 12);
    const k = h.int(2, 9);
    const d = b * k;
    let a = h.int(1, b * 2);
    if (a === b) a = b === 1 ? 2 : a + 1; // a === b makes "cross-multiplied backwards" correct
    const x = a * k;
    // Error modes: inverted one side before cross-multiplying; ADDED the difference between
    // denominators instead of scaling by their ratio; scaled by the wrong number; never
    // divided at all.
    const { choices, correctIndex } = h.choices(x, [
      Math.round((b * d) / a),
      a + (d - b),
      a * b,
      a * d,
      Math.round((a * b) / d),
      x + k,
    ]);
    return {
      stem: `If ${a}/${b} = x/${d}, what is x?`,
      choices, correctIndex,
      tags: ['ratios'],
      explanation: `${b} x ${k} = ${d}, so both parts scale by ${k}: x = ${a} x ${k} = ${x}. Denominators went UP by ${d - b}, but a proportion multiplies - it never adds.`,
    };
  },
});

registerTemplate({
  id: 'mk-ratio-parts',
  subtest: 'MK',
  band: 3,
  name: 'Dividing a total in a given ratio',
  concepts: ['ratio-form'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const small = h.int(2, 7);
    const large = small + h.int(1, 6);
    const unit = h.int(3, 25);
    const total = (small + large) * unit;
    const correct = large * unit;
    // Error modes: answered with the other share; split it evenly; answered with one PART
    // rather than the share; divided the total by a ratio number instead of by the number
    // of parts.
    const { choices, correctIndex } = h.choices(correct, [
      small * unit,
      Math.round(total / 2),
      unit,
      Math.round(total / large),
      Math.round(total / small),
      total - unit,
    ]);
    return {
      stem: `A board ${total} cm long is cut into two pieces in the ratio ${small}:${large}. How long is the LONGER piece?`,
      choices, correctIndex,
      tags: ['ratios'],
      explanation: `${small}:${large} means ${small + large} equal parts. One part = ${total}/${small + large} = ${unit} cm, so the longer piece is ${large} x ${unit} = ${correct} cm. Dividing by ${large} instead of by ${small + large} is the standard slip.`,
    };
  },
});

registerTemplate({
  id: 'mk-rate-conversion',
  subtest: 'MK',
  band: 3,
  name: 'Applying a rate across a unit change',
  concepts: ['unit-rate'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const minutes = h.int(2, 12);
    const perMin = h.int(3, 30);
    const pages = perMin * minutes;
    const hours = h.int(2, 6);
    const correct = perMin * 60 * hours;
    // Error modes: never converted hours to minutes; inverted the rate; converted twice;
    // multiplied the raw page count by the hours.
    const { choices, correctIndex } = h.choices(correct, [
      perMin * hours,
      Math.round((minutes / pages) * 60 * hours),
      perMin * 60 * hours * 60,
      pages * hours,
      perMin * 60,
      Math.round(correct / 60),
    ]);
    return {
      stem: `A printer produces ${pages} pages in ${minutes} minutes. At that rate, how many pages does it produce in ${hours} hours?`,
      choices, correctIndex,
      tags: ['rates'],
      explanation: `Rate = ${pages}/${minutes} = ${perMin} pages per minute. ${hours} hours = ${hours * 60} minutes, so ${perMin} x ${hours * 60} = ${correct}. The units in the rate and the units in the question have to match before you multiply.`,
    };
  },
});

registerTemplate({
  id: 'mk-scale-map',
  subtest: 'MK',
  band: 3,
  name: 'Reading a map scale',
  concepts: ['scale-conversion'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const perInch = h.int(8, 60);
    const halves = 2 * h.int(2, 11) + 1; // ODD, so the measurement always carries a half inch
    const inches = halves / 2;
    const correct = perInch * inches;
    // Error modes: dropped the half inch; inverted the scale; doubled instead of halving;
    // added the two numbers.
    const { choices, correctIndex } = h.choices(num(correct), [
      num(perInch * Math.floor(inches)),
      num(inches / perInch),
      num(perInch * inches * 2),
      num(perInch + inches),
      num(perInch * Math.ceil(inches)),
      num(perInch / inches),
    ]);
    return {
      stem: `On a map, 1 inch represents ${perInch} miles. Two towns are ${num(inches)} inches apart on the map. How many miles apart are they?`,
      choices, correctIndex,
      tags: ['ratios'],
      explanation: `${num(inches)} x ${perInch} = ${num(correct)} miles. A scale is a multiplier: map units x scale = real units, so you multiply going out to the world and divide coming back to the map.`,
    };
  },
});

// factor = how many of the SMALLER unit fit in one of the larger. Everything here is one
// multiplication; the entire difficulty is deciding which way it runs.
const CONVERSIONS = [
  { big: 'foot', bigPl: 'feet', small: 'inch', smallPl: 'inches', factor: 12 },
  { big: 'yard', bigPl: 'yards', small: 'foot', smallPl: 'feet', factor: 3 },
  { big: 'mile', bigPl: 'miles', small: 'foot', smallPl: 'feet', factor: 5280 },
  { big: 'pound', bigPl: 'pounds', small: 'ounce', smallPl: 'ounces', factor: 16 },
  { big: 'gallon', bigPl: 'gallons', small: 'quart', smallPl: 'quarts', factor: 4 },
  { big: 'hour', bigPl: 'hours', small: 'minute', smallPl: 'minutes', factor: 60 },
  { big: 'minute', bigPl: 'minutes', small: 'second', smallPl: 'seconds', factor: 60 },
  { big: 'week', bigPl: 'weeks', small: 'day', smallPl: 'days', factor: 7 },
  { big: 'metre', bigPl: 'metres', small: 'centimetre', smallPl: 'centimetres', factor: 100 },
  { big: 'kilometre', bigPl: 'kilometres', small: 'metre', smallPl: 'metres', factor: 1000 },
];

registerTemplate({
  id: 'mk-unit-conversion',
  subtest: 'MK',
  band: 2,
  name: 'Converting between units',
  concepts: ['unit-rate'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const u = h.pick(CONVERSIONS);
    const n = h.int(2, 40);
    const toSmall = h.int(0, 1) === 1;
    // Both directions on purpose: the mistake is never the arithmetic, it is running the
    // conversion the wrong way, and that only shows up if both directions get asked.
    const correct = toSmall ? n * u.factor : n;
    const given = toSmall ? n : n * u.factor;
    const fromUnit = toSmall ? u.bigPl : u.smallPl;
    const toUnit = toSmall ? u.smallPl : u.bigPl;
    const { choices, correctIndex } = h.choices(correct, [
      toSmall ? Math.round(n / u.factor) || 1 : n * u.factor * u.factor,
      given,
      given + u.factor,
      Math.round(correct / 2),
      correct * 2,
      u.factor,
    ]);
    return {
      stem: `How many ${toUnit} are in ${given} ${fromUnit}?`,
      choices, correctIndex,
      tags: ['ratios', 'units'],
      explanation: `1 ${u.big} = ${u.factor} ${u.smallPl}. Going from ${fromUnit} to ${toUnit} you ${toSmall ? 'MULTIPLY' : 'DIVIDE'} by ${u.factor}, giving ${correct}. Sanity check with size: more ${u.smallPl} than ${u.bigPl} always, because a ${u.small} is smaller.`,
    };
  },
});
