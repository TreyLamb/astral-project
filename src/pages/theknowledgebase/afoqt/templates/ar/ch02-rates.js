// Chapter 2 — Rate, time and distance.
//
// One relationship, d = rt, rearranged three ways. The arithmetic is trivial and the subtest
// still gets people, because three specific things go wrong:
//
//   1. THE UNITS. A speed in miles per HOUR against a time in MINUTES. The official item set
//      uses this deliberately - "13 mph, 32 minutes" - and the fix is always to convert first.
//   2. THE DIRECTION OF THE RATIO. Same distance, slower speed, so the time goes UP. Half the
//      people who set up a proportion set it up upside down, and it still produces a number.
//   3. AVERAGE SPEED IS NOT THE AVERAGE OF THE SPEEDS. It is total distance over total time,
//      and the difference is not a rounding detail: 30 out and 60 back averages 40, not 45,
//      because you spend twice as long at the slow speed. This is the one item in the chapter
//      where the intuitive answer is on the answer sheet and is wrong.
//
// ⚠ Every speed in this file is drawn INSIDE the drawn vehicle's own plausible range. That is
// not decoration. The first build drew the speed independently of the mode and produced a boat
// at 140 miles per hour and a train quoted in gallons per mile - both perfectly well-formed
// questions that no structural check could flag, and both of which tell the reader the tool
// does not know what it is talking about.

import { registerTemplate } from '../../engine/generator.js';
import { num, gcd, lcm } from '../util.js';
import { TRAVEL, minutesPhrase, OATTS } from './words.js';

/** Unnormalised, on purpose: "4 hours 75 minutes" is exactly what the decimal misreading writes. */
const hm = (h, m) => (m === 0 ? `${h} hour${h === 1 ? '' : 's'}` : `${h} hour${h === 1 ? '' : 's'} ${m} minutes`);

/** A speed inside this vehicle's range, rounded to a multiple of 5 so the arithmetic stays clean. */
const speedFor = (h, t) => h.int(Math.ceil(t.slow / 5), Math.floor(t.fast / 5)) * 5;

/** Vehicles whose fuel use is quoted in gallons per mile in ordinary speech. */
const FUELLED = TRAVEL.filter((t) => t.mode !== 'train');

registerTemplate({
  id: 'ar-rtd-distance',
  subtest: 'AR',
  band: 2,
  name: 'Distance from a speed and a mixed time',
  concepts: ['ar-rate-time-distance'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const t = h.pick(TRAVEL);
    const r = speedFor(h, t);
    const hours = h.int(2, 5);
    const mins = h.pick([15, 30, 45]);
    const correct = r * (hours + mins / 60);
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} miles`, [
      { value: `${num(r * (hours + mins / 100))} miles`, error: 'decimal-as-minutes', why: `read ${hours} hours ${mins} minutes as the decimal ${hours}.${mins}` },
      { value: `${num(r * hours)} miles`, error: 'dropped-the-minutes', why: 'used only the whole hours' },
      { value: `${num(r * (hours + 1))} miles`, error: 'rounded-up', why: 'rounded the part-hour up to a full hour' },
      { value: `${num(r / (hours + mins / 60))} miles`, error: 'wrong-operation', why: 'divided the speed by the time' },
      { value: `${num(r + hours * 60 + mins)} miles`, error: 'wrong-operation', why: 'added the speed to the time' },
    ]);
    return {
      stem: `A ${t.mode} ${t.verb} at a steady ${r} miles per hour for ${minutesPhrase(hours * 60 + mins)}. How far does it travel?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `Convert the time to hours BEFORE multiplying: ${mins} minutes is ${mins}/60 = ${num(mins / 60)} of an hour, so the time is ${num(hours + mins / 60)} hours and the distance is ${r} x ${num(hours + mins / 60)} = ${num(correct)} miles. Treating "${hours} hours ${mins} minutes" as ${hours}.${mins} hours gives ${num(r * (hours + mins / 100))} - a plausible number from a clock that does not run in hundredths.`,
    };
  },
});

registerTemplate({
  id: 'ar-rtd-time',
  subtest: 'AR',
  band: 2,
  name: 'Time from a distance and a speed',
  concepts: ['ar-solve-for-time'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const t = h.pick(TRAVEL);
    // Minutes whose decimal form stays under 60, so the "read the decimal as minutes" error
    // prints as a wrong clock reading rather than rolling over into another hour - 4.75 hours
    // misread is "4 hours 75 minutes", and normalising that to 5:15 would hide the mistake.
    const mins = h.pick([10, 12, 15, 20, 24, 30]);
    // The speed has to divide the part-hour into whole miles, or the stem quotes a distance
    // with a decimal in it and gives the game away. Still inside the vehicle's own range.
    const step = 60 / gcd(mins, 60);
    const lo = Math.ceil(t.slow / step);
    const hi = Math.floor(t.fast / step);
    const r = step * (hi >= lo ? h.int(lo, hi) : lo);
    const hours = h.int(2, 5);
    const distance = (r * (hours * 60 + mins)) / 60;
    const decimalMins = Math.round((mins / 60) * 100);
    const { choices, correctIndex, errors, whys } = h.choices(hm(hours, mins), [
      { value: hm(hours, decimalMins), error: 'decimal-as-minutes', why: `read ${hours}.${decimalMins} hours as ${hours} hours ${decimalMins} minutes` },
      { value: hm(hours, 0), error: 'dropped-the-remainder', why: 'kept the whole hours and discarded the rest' },
      { value: hm(hours + 1, 0), error: 'rounded-up', why: 'rounded the part-hour up' },
      { value: hm(hours + 1, mins), error: 'off-by-an-hour', why: 'carried an extra hour' },
      { value: minutesPhrase(Math.max(1, Math.round((r / distance) * 60))), error: 'inverted-the-rate', why: 'divided the speed by the distance' },
    ]);
    return {
      stem: `A ${t.mode} ${t.verb} ${distance} miles at a steady ${r} miles per hour. How long does the trip take?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `Time = distance / speed = ${distance} / ${r} = ${num(distance / r)} hours. Now convert the decimal properly: 0.${String(decimalMins).padStart(2, '0')} of an hour is 0.${String(decimalMins).padStart(2, '0')} x 60 = ${mins} minutes, so the answer is ${hm(hours, mins)}. Reading the decimal straight off as minutes gives ${hm(hours, decimalMins)}, and an hour has 60 minutes in it, not 100.`,
    };
  },
});

registerTemplate({
  id: 'ar-inverse-speed',
  subtest: 'AR',
  band: 3,
  name: 'Same distance at a different speed',
  concepts: ['ar-inverse-rate'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const walk = h.int(3, 5);
    const cycle = h.int(10, 16);
    const j = h.int(4, 9);
    const t1 = walk * j;             // minutes at the cycling speed
    const correct = j * cycle;       // minutes at the walking speed
    const distance = (cycle * t1) / 60;
    const { choices, correctIndex, errors, whys } = h.choices(`${correct} min`, [
      { value: `${Math.round((t1 * walk) / cycle)} min`, error: 'inverted-the-ratio', why: 'scaled the time by the speeds the wrong way round, making the slower trip shorter' },
      { value: `${t1 + (cycle - walk)} min`, error: 'added-the-gap', why: 'added the difference in speeds to the time' },
      { value: `${t1 * (cycle - walk)} min`, error: 'multiplied-by-the-gap', why: 'multiplied the time by the difference in speeds' },
      { value: `${num(distance)} min`, error: 'answered-with-the-distance', why: 'reported the intermediate distance as a time' },
      { value: `${t1} min`, error: 'no-change', why: 'left the time unchanged' },
    ]);
    return {
      stem: `Cycling at an average of ${cycle} miles per hour, your commute takes ${t1} minutes. Walking the same route at ${walk} miles per hour, approximately how long does the commute take?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `The distance does not change: ${cycle} x ${t1}/60 = ${num(distance)} miles. At ${walk} mph that takes ${num(distance)} / ${walk} = ${num(correct / 60)} hours = ${correct} minutes. Sanity check before you commit: you slowed DOWN, so the time must go UP. Any answer below ${t1} minutes is wrong before you check the arithmetic, which eliminates two options for free.`,
    };
  },
});

/**
 * Out-and-back pairs, each attached to the vehicles that can actually do BOTH speeds.
 *
 * The harmonic mean 2ab/(a+b) is only a whole number for particular pairs, and a whole-number
 * answer keeps the item about the concept rather than about long division. Pairing each one
 * against `TRAVEL` ranges is what stops the generator offering a boat at 140 mph.
 */
const OUT_AND_BACK = [[20, 30], [30, 60], [40, 60], [15, 30], [45, 90], [50, 75], [30, 70],
  [12, 24], [10, 15], [30, 45], [60, 90], [8, 24]]
  .filter(([a, b]) => Number.isInteger((2 * a * b) / (a + b)))
  .flatMap(([out, back]) =>
    TRAVEL.filter((t) => t.slow <= out && t.fast >= back).map((t) => ({ out, back, t })));

registerTemplate({
  id: 'ar-average-speed',
  subtest: 'AR',
  band: 4,
  name: 'Average speed over a round trip',
  concepts: ['ar-average-speed'],
  calibratedAgainst: 'trivium',
  // Bounded and small: the clean pairs are a short list and each only fits certain vehicles.
  // Derived rather than written down, so trimming an unrealistic pair cannot silently break
  // the audit's stem-variety floor.
  stemSpace: OUT_AND_BACK.length,
  generate: (rng, h) => {
    const { out, back, t } = h.pick(OUT_AND_BACK);
    const correct = (2 * out * back) / (out + back);
    // A convenient one-way distance for the worked explanation. The lowest common multiple
    // makes both legs whole hours; multiplying the speeds together also works but describes a
    // 2,100-mile delivery route, which reads as nonsense even though the algebra is fine.
    const leg = lcm(out, back);
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} mph`, [
      { value: `${num((out + back) / 2)} mph`, error: 'averaged-the-speeds', why: 'took the mean of the two speeds, which ignores that the slow leg takes longer' },
      { value: `${num(out)} mph`, error: 'answered-with-a-leg', why: 'reported the outbound speed' },
      { value: `${num(back)} mph`, error: 'answered-with-a-leg', why: 'reported the return speed' },
      { value: `${num(out + back)} mph`, error: 'added-the-speeds', why: 'added the two speeds as if they combined' },
      { value: `${num(Math.round(Math.sqrt(out * back)))} mph`, error: 'wrong-mean', why: 'used the geometric mean instead of distance over time' },
    ]);
    return {
      stem: `A ${t.mode} ${t.verb} a delivery route at ${out} miles per hour and returns along the same route at ${back} miles per hour. What is the average speed for the whole round trip?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `Average speed is TOTAL DISTANCE / TOTAL TIME, never the average of the speeds. Take the route as ${leg} miles each way: the outbound leg takes ${num(leg / out)} hours and the return takes ${num(leg / back)} hours, so ${2 * leg} miles in ${num(leg / out + leg / back)} hours = ${num(correct)} mph. The mean of the speeds, ${num((out + back) / 2)}, is on the answer sheet and is wrong because you spend MORE TIME at the slower speed - the slow leg gets the heavier weight.`,
    };
  },
});

registerTemplate({
  id: 'ar-fuel-rate',
  subtest: 'AR',
  band: 2,
  name: 'Distance from a fuel consumption rate',
  concepts: ['ar-consumption-rate'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const t = h.pick(FUELLED);
    const used = h.pick([1.5, 2, 2.5, 3, 4]);
    const miles = h.int(6, 24) * 5;
    const k = h.int(3, 8);
    const tank = used * k;
    const correct = miles * k;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} miles`, [
      { value: `${num((miles * used) / tank)} miles`, error: 'inverted-the-proportion', why: 'set the proportion up upside down' },
      { value: `${num(miles * tank)} miles`, error: 'skipped-the-rate', why: `multiplied by the ${num(tank)} gallons without dividing by the ${num(used)} it takes` },
      { value: `${num(miles + tank)} miles`, error: 'wrong-operation', why: 'added the fuel to the distance' },
      { value: `${num(miles * 2)} miles`, error: 'guessed-a-doubling', why: 'doubled the distance rather than scaling it' },
      { value: `${num(k)} miles`, error: 'answered-with-the-factor', why: 'reported the scale factor instead of the distance' },
    ]);
    return {
      stem: `If a ${t.mode} uses ${num(used)} gallons of fuel every ${miles} miles, how many miles can it travel on ${num(tank)} gallons?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `Set it up as a proportion with matching units on top: ${num(used)}/${miles} = ${num(tank)}/x, so ${num(used)}x = ${miles} x ${num(tank)} and x = ${num(correct)} miles. The check that costs a second: ${num(tank)} gallons is ${k} times ${num(used)} gallons, so the distance is ${k} times ${miles}.`,
    };
  },
});

registerTemplate({
  id: 'ar-closing-rate',
  subtest: 'AR',
  band: 4,
  name: 'Two vehicles and a closing distance',
  concepts: ['ar-combined-rates'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const slower = h.int(5, 11) * 5;
    const faster = slower + h.int(1, 5) * 5;
    const hours = h.int(2, 6);
    const apart = (slower + faster) * hours;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(hours)} hours`, [
      { value: `${num(apart / (faster - slower))} hours`, error: 'used-the-difference', why: 'subtracted the speeds, which is the formula for two vehicles going the SAME way' },
      { value: `${num(apart / faster)} hours`, error: 'used-one-speed', why: 'used only the faster vehicle' },
      { value: `${num(apart / slower)} hours`, error: 'used-one-speed', why: 'used only the slower vehicle' },
      { value: `${num(apart / ((slower + faster) / 2))} hours`, error: 'averaged-the-speeds', why: 'averaged the two speeds instead of adding them' },
      { value: `${num(Math.round(apart / (slower + faster) / 2))} hours`, error: 'halved-the-answer', why: 'split the result between the two vehicles' },
    ]);
    return {
      stem: `Two trucks leave the same depot at the same time and drive in OPPOSITE directions, one at ${slower} miles per hour and one at ${faster} miles per hour. After how many hours are they ${apart} miles apart?`,
      choices, correctIndex, errors, whys,
      tags: ['rates'],
      explanation: `Driving apart, the gap grows by both speeds at once: ${slower} + ${faster} = ${slower + faster} miles every hour, so ${apart} / ${slower + faster} = ${num(hours)} hours. Subtracting the speeds answers a different question - that is the gap for two vehicles travelling the SAME direction, and it gives ${num(apart / (faster - slower))} here. The word "opposite" is the whole item.`,
    };
  },
});
