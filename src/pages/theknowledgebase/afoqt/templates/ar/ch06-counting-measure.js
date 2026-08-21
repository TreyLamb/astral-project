// Chapter 6 — Counting, area and volume in words.
//
// Two families that look unrelated and share a habit: both punish you for computing the right
// quantity and reporting the wrong one.
//
// FENCEPOSTS. Divide a length by a spacing and you have counted GAPS, not posts. On a straight
// run with a post at each end there is always one more post than gap; around a closed loop the
// counts are equal. The official item set asks this as a button pressed every 45 minutes over
// 9 hours "at the very beginning" - 540/45 = 12 intervals, 13 presses - and its answer key
// offers 12. Both variants are generated here and the stem does not signal which, because
// "always add one" is the wrong lesson and a candidate who learns it will lose the loop case.
//
// AREA AND VOLUME. These are in the AF's OWN Arithmetic Reasoning syllabus ("Area of 2D
// Shapes", "Area of 3D Shapes"), not in its Math Knowledge syllabus, which is why they live
// here rather than in the geometry chapters of the math track. The trap is never the formula;
// it is the SQUARE of the conversion factor. Three feet make a yard, but NINE square feet make
// a square yard and TWENTY-SEVEN cubic feet make a cubic yard. Dividing a floor area by 3 is
// the single most common miss in the chapter, and it produces a number that looks entirely
// reasonable.

import { registerTemplate } from '../../engine/generator.js';
import { num, money, sweep } from '../util.js';
import { ROOMS, CONTAINERS, OATTS } from './words.js';

// --- Fenceposts -------------------------------------------------------------

const TASKS = [
  { verb: 'log a reading', noun: 'readings' },
  { verb: 'press a reset button', noun: 'presses' },
  { verb: 'record a fuel check', noun: 'checks' },
  { verb: 'radio a position report', noun: 'reports' },
  { verb: 'take a meter reading', noun: 'readings' },
];

registerTemplate({
  id: 'ar-fencepost',
  subtest: 'AR',
  band: 3,
  name: 'Counting events at fixed intervals',
  concepts: ['ar-fencepost'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const task = h.pick(TASKS);
    const mins = h.pick([12, 15, 20, 24, 30, 36, 40, 45, 90]);
    // Sweep the duration: the answer, the off-by-ones and the two "answered with a given"
    // distractors are all small integers drawn from the same handful of numbers, so they
    // collide readily.
    const hoursUnit = sweep(2, 12, h.int(2, 12), (cand) => {
      const total = cand * 60;
      if (total % mins !== 0) return null;
      const gaps = total / mins;
      if (gaps < 3) return null;
      return [gaps + 1, gaps, gaps - 1, gaps + 2, cand, mins];
    });
    const gaps = (hoursUnit * 60) / mins;
    const correct = gaps + 1;
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(gaps), error: 'counted-gaps-not-events', why: 'divided and stopped, which counts the INTERVALS and misses the one at the start' },
      { value: num(gaps - 1), error: 'off-by-one', why: 'dropped an event at each end' },
      { value: num(gaps + 2), error: 'off-by-one', why: 'added an extra event at the end as well as the start' },
      { value: num(hoursUnit), error: 'answered-with-a-given', why: 'reported the number of hours' },
      { value: num(mins), error: 'answered-with-a-given', why: 'reported the interval in minutes' },
    ]);
    return {
      stem: `You must ${task.verb} once every ${mins} minutes during a ${hoursUnit}-hour shift, starting with one at the very beginning of the shift. How many ${task.noun} do you make?`,
      choices, correctIndex, errors, whys,
      tags: ['counting'],
      explanation: `${hoursUnit} hours is ${hoursUnit * 60} minutes, and ${hoursUnit * 60} / ${mins} = ${gaps}. That ${gaps} is the number of INTERVALS, not the number of ${task.noun}. Because one is made at the very start, there is one more ${task.noun.replace(/s$/, '')} than interval: ${gaps} + 1 = ${correct}. Picture four fence posts holding up three panels - the division always gives you the panels.`,
    };
  },
});

const RUNS = [
  { straight: 'straight fence', loop: 'circular fence', unit: 'posts' },
  { straight: 'straight driveway', loop: 'circular path', unit: 'lights' },
  { straight: 'straight boundary', loop: 'perimeter fence', unit: 'markers' },
];

registerTemplate({
  id: 'ar-fencepost-loop',
  subtest: 'AR',
  band: 4,
  name: 'Posts along a run, open or closed',
  concepts: ['ar-fencepost'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const run = h.pick(RUNS);
    const closed = h.int(0, 1) === 1;
    const spacing = h.pick([4, 5, 6, 8, 10, 12, 15, 20]);
    const gaps = sweep(6, 40, h.int(6, 40), (cand) => {
      const c = closed ? cand : cand + 1;
      return [c, closed ? cand + 1 : cand, cand - 1, cand + 2, cand * spacing, spacing];
    });
    const length = gaps * spacing;
    const correct = closed ? gaps : gaps + 1;
    // The wrong-variant distractor is the whole item: a candidate who memorised "always add
    // one" gets the loop backwards, and one who memorised "posts equals gaps" gets the
    // straight run backwards. Neither can be eliminated without reading the shape.
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(closed ? gaps + 1 : gaps), error: 'wrong-variant', why: closed
        ? 'added one for an end post, but a closed loop has no ends'
        : 'counted gaps, but a run with a post at each end has one more post than gap' },
      { value: num(gaps - 1), error: 'off-by-one', why: 'dropped a post' },
      { value: num(gaps + 2), error: 'off-by-one', why: 'added a post at each end of something that needed at most one' },
      { value: num(length), error: 'answered-with-the-length', why: 'reported the length rather than a count' },
      { value: num(spacing), error: 'answered-with-a-given', why: 'reported the spacing' },
    ]);
    return {
      stem: closed
        ? `A ${run.loop} ${length} feet around has ${run.unit} spaced every ${spacing} feet. How many ${run.unit} are there?`
        : `A ${run.straight} ${length} feet long has ${run.unit} spaced every ${spacing} feet, including one at each end. How many ${run.unit} are there?`,
      choices, correctIndex, errors, whys,
      tags: ['counting'],
      explanation: closed
        ? `${length} / ${spacing} = ${gaps} gaps. On a CLOSED loop the last gap joins back to the first ${run.unit.replace(/s$/, '')}, so there is no extra one to add: the answer is ${gaps}. This is the case where "always add one" costs you the question.`
        : `${length} / ${spacing} = ${gaps} gaps. On an OPEN run with a ${run.unit.replace(/s$/, '')} at each end there is always one more ${run.unit.replace(/s$/, '')} than gap, so the answer is ${gaps} + 1 = ${correct}. Close the same run into a loop and the answer would be ${gaps} - read the shape before you add anything.`,
    };
  },
});

// --- Measurement in words ---------------------------------------------------

registerTemplate({
  id: 'ar-perimeter-width',
  subtest: 'AR',
  band: 2,
  name: 'A missing side from a perimeter',
  concepts: ['ar-perimeter-in-words'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const room = h.pick(ROOMS);
    const width = h.int(8, 45);
    // The length is swept away from the degenerate shapes: length = P/4 makes it a square (so
    // "answered with the length" IS the width), and length = P/2 leaves no width at all.
    const length = sweep(10, 80, h.int(10, 80), (cand) => {
      if (cand === width) return null;
      const p = 2 * (cand + width);
      return [width, p - 2 * cand, p - cand, 2 * cand, cand, p / 2, p / 4];
    });
    const perimeter = 2 * (length + width);
    const correct = width;
    // Three of these are the official item's own distractors: for a 65-foot room with a
    // 220-foot perimeter its key offers 155 (= P - L), 130 (= 2L) and 65 (= L).
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} feet`, [
      { value: `${num(perimeter - 2 * length)} feet`, error: 'forgot-to-halve', why: 'took both lengths off the perimeter and never halved what was left' },
      { value: `${num(perimeter - length)} feet`, error: 'subtracted-one-length', why: 'subtracted the length once instead of twice' },
      { value: `${num(2 * length)} feet`, error: 'answered-with-the-lengths', why: 'reported the two long sides' },
      { value: `${num(length)} feet`, error: 'answered-with-the-length', why: 'reported the length that was given' },
      { value: `${num(perimeter / 2)} feet`, error: 'halved-the-perimeter', why: 'gave half the perimeter, which is length PLUS width' },
    ]);
    return {
      stem: `A rectangular ${room.name} is ${length} feet long and has a perimeter of ${perimeter} feet. How wide is it?`,
      choices, correctIndex, errors, whys,
      tags: ['measurement'],
      explanation: `Perimeter = 2L + 2W, so ${perimeter} = ${2 * length} + 2W, giving 2W = ${perimeter - 2 * length} and W = ${correct} feet. The quickest route is to halve first: half the perimeter is ${num(perimeter / 2)}, which is one length plus one width, so the width is ${num(perimeter / 2)} - ${length} = ${correct}. Forgetting the final halving gives ${num(perimeter - 2 * length)}, which is exactly twice the answer.`,
    };
  },
});

registerTemplate({
  id: 'ar-area-words',
  subtest: 'AR',
  band: 3,
  name: 'Floor area bought in square yards',
  concepts: ['ar-area-in-words'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const room = h.pick(ROOMS);
    // Both sides are multiples of 3, so the area comes out in whole square yards.
    const w = 3 * h.int(3, 9);
    const l = sweep(4, 12, h.int(4, 12), (cand) => {
      const len = 3 * cand;
      const sqft = len * w;
      return [sqft / 9, sqft, sqft / 3, len + w, 2 * (len + w), (len / 3) * (w / 3) * 3];
    }) * 3;
    const sqft = l * w;
    const correct = sqft / 9;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} square yards`, [
      { value: `${num(sqft / 3)} square yards`, error: 'linear-factor-on-an-area', why: 'divided by 3 instead of 9 - the conversion factor is SQUARED for an area' },
      { value: `${num(sqft)} square yards`, error: 'never-converted', why: 'left the answer in square feet' },
      { value: `${num(2 * (l + w))} square yards`, error: 'used-the-perimeter', why: 'measured around the room instead of across it' },
      { value: `${num(l + w)} square yards`, error: 'added-the-sides', why: 'added the two dimensions' },
      { value: `${num(sqft * 9)} square yards`, error: 'converted-backwards', why: 'multiplied by 9 instead of dividing' },
    ]);
    return {
      stem: `The ${room.surface} of a ${room.name} measures ${l} feet by ${w} feet. Carpet is sold by the square yard. How many square yards are needed to cover it?`,
      choices, correctIndex, errors, whys,
      tags: ['measurement'],
      explanation: `Area first: ${l} x ${w} = ${sqft} square feet. Now the conversion, and this is the whole item - a square yard is 3 feet BY 3 feet, so it is 9 square feet, not 3. ${sqft} / 9 = ${correct} square yards. Dividing by 3 gives ${num(sqft / 3)}, a number that looks perfectly sensible and is three times too big. You can also convert first: ${l / 3} yards by ${w / 3} yards = ${correct}.`,
    };
  },
});

registerTemplate({
  id: 'ar-volume-words',
  subtest: 'AR',
  band: 3,
  name: 'Capacity from a volume',
  concepts: ['ar-volume-in-words'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const box = h.pick(CONTAINERS);
    const a = h.int(2, 8);
    const b = h.int(2, 8);
    const c = sweep(2, 9, h.int(2, 9), (cand) => {
      const v = a * b * cand;
      return [v * 7.5, v, v / 7.5, 2 * (a * b + a * cand + b * cand), a + b + cand, v * 27];
    });
    const volume = a * b * c;
    const perCubicFoot = 7.5;
    const correct = volume * perCubicFoot;
    // ⚠ ORDER MATTERS HERE, and it is easy to miss. `h.choices` keeps the first `need - 1`
    // distinct distractors and discards the rest, so a distractor listed fifth may never reach
    // the page - and an explanation that names it then describes an option the candidate cannot
    // see. "Used only two of the three dimensions" is the most instructive miss in this item, so
    // it is placed where it is guaranteed to survive, and the explanation cites only the first
    // two entries.
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} gallons`, [
      { value: `${num(volume)} gallons`, error: 'stopped-at-the-volume', why: 'gave the volume in cubic feet without converting to gallons' },
      { value: `${num(a * b * perCubicFoot)} gallons`, error: 'dropped-a-dimension', why: 'used only two of the three dimensions' },
      { value: `${num(2 * (a * b + a * c + b * c))} gallons`, error: 'used-surface-area', why: 'computed the surface area instead of the volume' },
      { value: `${num(Math.round(volume / perCubicFoot))} gallons`, error: 'converted-backwards', why: 'divided by 7.5 instead of multiplying' },
      { value: `${num(a + b + c)} gallons`, error: 'added-the-dimensions', why: 'added the three dimensions' },
    ]);
    return {
      stem: `A rectangular ${box.name} measures ${a} feet by ${b} feet by ${c} feet. If one cubic foot holds about 7.5 gallons, approximately how many gallons does it hold when full?`,
      choices, correctIndex, errors, whys,
      tags: ['measurement'],
      explanation: `Volume is all THREE dimensions multiplied: ${a} x ${b} x ${c} = ${volume} cubic feet. Then apply the rate: ${volume} x 7.5 = ${num(correct)} gallons. Two checks worth making. A volume needs three measurements, and using only two gives ${num(a * b * perCubicFoot)}, which is on the answer sheet. And a gallon is much smaller than a cubic foot, so the gallon figure has to come out LARGER than ${volume} - which rules out stopping at the volume itself.`,
    };
  },
});

registerTemplate({
  id: 'ar-cost-per-area',
  subtest: 'AR',
  band: 4,
  name: 'Costing a floor by the square yard',
  concepts: ['ar-cost-per-area'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const room = h.pick(ROOMS);
    const w = 3 * h.int(3, 8);
    const l = 3 * h.int(4, 10);
    const sqft = l * w;
    const sqyd = sqft / 9;
    const perYard = h.int(8, 30);
    const fitting = h.int(2, 12) * 25;
    const correct = sqyd * perYard + fitting;
    const { choices, correctIndex, errors, whys } = h.choices(money(correct), [
      { value: money(sqyd * perYard), error: 'forgot-the-fixed-cost', why: 'priced the carpet and left out the fitting charge' },
      { value: money(sqft * perYard + fitting), error: 'never-converted', why: 'priced every square FOOT at the square-yard rate' },
      { value: money((sqft / 3) * perYard + fitting), error: 'linear-factor-on-an-area', why: 'divided the area by 3 rather than by 9' },
      { value: money(2 * (l + w) * perYard + fitting), error: 'used-the-perimeter', why: 'priced the distance around the room' },
      { value: money(sqyd + perYard + fitting), error: 'wrong-operation', why: 'added the area to the rate instead of multiplying' },
    ]);
    return {
      stem: `The ${room.surface} of a ${room.name} measures ${l} feet by ${w} feet. Carpet costs ${money(perYard)} per square yard and fitting is a flat ${money(fitting)}. What is the total cost?`,
      choices, correctIndex, errors, whys,
      tags: ['measurement'],
      explanation: `Three steps, and each one is a place to stop early. Area: ${l} x ${w} = ${sqft} square feet. Convert: ${sqft} / 9 = ${sqyd} square yards, dividing by NINE because the rate is per square yard. Cost: ${sqyd} x ${money(perYard)} = ${money(sqyd * perYard)}, then add the flat ${money(fitting)} for ${money(correct)}. Pricing square feet at the square-yard rate gives ${money(sqft * perYard + fitting)} - which prices nine times too much carpet and is the largest option on the page.`,
    };
  },
});
