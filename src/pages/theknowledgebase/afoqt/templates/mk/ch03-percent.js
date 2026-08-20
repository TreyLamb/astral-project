// Chapter 3 — Percent, percent change and interest.
//
// The AFOQT's percent items are rarely about arithmetic; they are about WHICH NUMBER IS THE
// BASE. Percent change divides by the original, successive discounts do not add, and
// simple interest is not compound interest. Each template below is built around exactly one
// of those confusions.

import { registerTemplate } from '../../engine/generator.js';
import { money, num } from '../util.js';

const CLEAN_PCT = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80];

registerTemplate({
  id: 'mk-percent-of',
  subtest: 'MK',
  band: 1,
  name: 'Percent of a number',
  concepts: ['percent-of'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    const p = h.pick(CLEAN_PCT);
    const n = h.int(2, 30) * 20;
    const correct = (p * n) / 100;
    // Error modes: every decimal-place shift, "the rest" instead of the part, dividing by
    // the percent, and dropping the /100 entirely.
    const { choices, correctIndex } = h.choices(num(correct), [
      num((p * n) / 10),
      num((p * n) / 1000),
      num(n - correct),
      num(Math.round(n / (p / 100))),
      num(p * n),
    ]);
    return {
      stem: `What is ${p}% of ${n}?`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `${p}% = ${p / 100}, and "of" means multiply: ${p / 100} x ${n} = ${num(correct)}.`,
    };
  },
});

registerTemplate({
  id: 'mk-percent-change',
  subtest: 'MK',
  band: 3,
  name: 'Percent increase or decrease',
  concepts: ['percent-change'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    // 50 is excluded on purpose: 100 - 50 = 50 makes the "answered with the complement"
    // distractor identical to the answer.
    const pct = h.pick([10, 15, 20, 25, 30, 40, 60, 75, 80]);
    const original = h.int(2, 25) * 20;
    const up = h.int(0, 1) === 1;
    const delta = (original * pct) / 100;
    const nv = up ? original + delta : original - delta;
    // Error modes: divided by the NEW value instead of the original (the defining mistake
    // of this topic); gave the raw difference; gave the ratio instead of the change;
    // answered with the complement.
    const { choices, correctIndex } = h.choices(`${num(pct)}%`, [
      `${num(Math.round((delta / nv) * 1000) / 10)}%`,
      `${num(delta)}%`,
      `${num(Math.round((nv / original) * 1000) / 10)}%`,
      `${num(100 - pct)}%`,
      `${num(Math.round((original / nv) * 1000) / 10)}%`,
      `${num(pct / 2)}%`,
    ]);
    return {
      stem: `A quantity ${up ? 'rises' : 'falls'} from ${original} to ${num(nv)}. What is the percent ${up ? 'increase' : 'decrease'}?`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `Change = ${num(delta)}. Percent change = change / ORIGINAL = ${num(delta)}/${original} = ${num(pct)}%. Dividing by the new value instead gives ${num(Math.round((delta / nv) * 1000) / 10)}%, which is the single most common error on this question type.`,
    };
  },
});

registerTemplate({
  id: 'mk-simple-interest',
  subtest: 'MK',
  band: 3,
  name: 'Simple interest',
  concepts: ['simple-interest'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const principal = h.int(4, 40) * 250;
    const rate = h.pick([2, 3, 4, 5, 6, 8, 10, 12]);
    const years = h.int(2, 9);
    const correct = (principal * rate * years) / 100;
    // Error modes: dropped the time factor; answered with the BALANCE rather than the
    // interest; compounded it; used the rate as a whole number.
    const { choices, correctIndex } = h.choices(money(correct), [
      money((principal * rate) / 100),
      money(principal + correct),
      money(principal * (1 + rate / 100) ** years - principal),
      money(principal * rate * years),
      money(correct / years),
      money(rate * years),
    ]);
    return {
      stem: `$${principal} is invested at ${rate}% simple interest for ${years} years. How much INTEREST is earned?`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `I = Prt = ${principal} x ${rate / 100} x ${years} = ${money(correct)}. Simple interest is charged on the original principal every year - it never earns interest on itself, and the question asks for the interest, not the balance (${money(principal + correct)}).`,
    };
  },
});

registerTemplate({
  id: 'mk-successive-discount',
  subtest: 'MK',
  band: 4,
  name: 'Two successive discounts',
  concepts: ['successive-discount', 'percent-change'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const price = h.int(4, 40) * 25;
    const d1 = h.pick([10, 15, 20, 25, 30, 40]);
    let d2 = h.pick([5, 10, 20, 25]);
    if (d2 === d1) d2 = d1 === 10 ? 5 : 10;
    const correct = price * (1 - d1 / 100) * (1 - d2 / 100);
    // Error modes: ADDED the two percentages, i.e. took the second discount off the ORIGINAL
    // price (the whole point of the item); applied only the first; applied only the second;
    // answered with the amount saved instead of the price paid; multiplied the percentages.
    const { choices, correctIndex } = h.choices(money(correct), [
      money(price * (1 - (d1 + d2) / 100)),
      money(price * (1 - d1 / 100)),
      money(price * (1 - d2 / 100)),
      money(price - correct),
      money(price * (1 - (d1 * d2) / 10000)),
    ]);
    return {
      stem: `A $${price} jacket is marked down ${d1}%, and the sale price is then reduced a further ${d2}%. What is the final price?`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `${d1}% off leaves ${money(price * (1 - d1 / 100))}. Taking ${d2}% off THAT leaves ${money(correct)}. Successive discounts multiply (${num(((1 - d1 / 100) * (1 - d2 / 100) - 1) * 100)}% overall), they never add to ${d1 + d2}%, because the second discount applies to a smaller base.`,
    };
  },
});

registerTemplate({
  id: 'mk-percent-find-base',
  subtest: 'MK',
  band: 3,
  name: 'Finding the whole from a percent',
  concepts: ['percent-of'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const p = h.pick(CLEAN_PCT);
    const whole = h.int(2, 30) * 20;
    const part = (whole * p) / 100;
    // ⭐ The reason this is a separate template from "percent of a number": the same
    // relationship with a different unknown is a different question, and reflexively taking
    // p% OF the part is the miss. Solving it is a division, not a multiplication.
    const { choices, correctIndex } = h.choices(num(whole), [
      num((part * p) / 100),
      num(part * p),
      num(part / p),
      num((part * 100) / (100 - p)),
      num(part + p),
      num(part * (100 / p) * 2),
    ]);
    return {
      stem: `${num(part)} is ${p}% of what number?`,
      choices, correctIndex,
      tags: ['percent'],
      explanation: `part = percent x whole, so whole = part / percent = ${num(part)} / ${p / 100} = ${num(whole)}. Taking ${p}% OF ${num(part)} instead gives ${num((part * p) / 100)} - the right operation run backwards.`,
    };
  },
});
