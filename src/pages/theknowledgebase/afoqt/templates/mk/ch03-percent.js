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
      explanation: `A percent is a fraction out of 100, so ${p}% literally means "${p} out of every 100," or ${p / 100} written as a decimal. The word "of" sitting between a percent and a number is an instruction to multiply - the same job it does in "half of 12" (1/2 x 12). So "${p}% of ${n}" means: convert ${p}% to the decimal ${p / 100}, then multiply that by ${n}: ${p / 100} x ${n} = ${num(correct)}. The most common slip is moving the decimal point the wrong number of places when converting the percent - ${p}% is ${p / 100}, not ${num(p / 10)} (one place) or ${num(p / 1000)} (three places), because "per-CENT" means per hundred, which is always exactly two places. A second common miss is computing "the rest" - the ${100 - p}% of ${n} left over - instead of the ${p}% actually asked for, which answers a completely different question with a completely different number.`,
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
      explanation: `Percent change measures how big a change is RELATIVE to where the quantity started, so the formula is: percent change = (amount of change) / (ORIGINAL value). "Original" specifically means the number before anything happened - never the new number, and never some average of the two. Here the quantity ${up ? 'rises' : 'falls'} from ${original} to ${num(nv)}, so the change itself is ${num(delta)}, and the value to divide by is the starting one, ${original} - not the ending one, ${num(nv)}. Dividing: ${num(delta)} / ${original} = ${num(pct)}%. The single most common mistake is dividing by the NEW value instead of the original, which gives ${num(Math.round((delta / nv) * 1000) / 10)}% - a real number, just the answer to a different question ("how big is the change compared to where I ended up" rather than "compared to where I started"). Percent change always looks backward to the starting point, because that starting point is the base the word "change" is being measured against.`,
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
      explanation: `The formula I = P x r x t calculates simple interest, where I is the Interest earned (what the question asks for), P is the Principal (the original amount invested), r is the annual interest Rate written as a decimal, and t is the Time the money is invested, in years. "Simple" means the interest is calculated on the ORIGINAL principal every single year - unlike compound interest, it never earns interest on interest already earned, so the same dollar amount is added each year rather than a growing one. Here, P = ${principal} (the amount invested), r = ${rate / 100} (the ${rate}% rate written as a decimal, since percent means "per hundred"), and t = ${years} because the problem states the money sits for ${years} years - t is always whatever number of years the question names, nothing more or less. Multiplying all three: I = ${principal} x ${rate / 100} x ${years} = ${money(correct)}. Two different mistakes produce the two most common wrong answers: forgetting to multiply by t at all gives just one year's interest (${money((principal * rate) / 100)}), which is what you'd get if the money had only sat for a single year regardless of what t actually says; and answering with the account's final BALANCE (${money(principal + correct)}) instead of the interest confuses "how much it grew" with "how much is there now" - the question specifically asks for the interest EARNED, which is only the I, not the P + I.`,
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
      explanation: `Each discount is a percentage OF WHATEVER PRICE EXISTS AT THAT MOMENT, not of the original price - so two discounts in a row apply one after another to a shrinking base rather than combining into one bigger percentage. Taking ${d1}% off the original $${price} leaves ${money(price * (1 - d1 / 100))} (that's ${100 - d1}% of the original remaining). Taking ${d2}% off THAT new, smaller amount - not off the original $${price} again - leaves ${money(correct)}. The overall discount from the original price works out to ${num(((1 - d1 / 100) * (1 - d2 / 100) - 1) * -100)}%, which is NOT the same as simply adding ${d1}% + ${d2}% = ${d1 + d2}% - adding them assumes both discounts came out of the same original price, but the second one actually came out of a price that had already shrunk. This is exactly why "stacking" discounts is always a little less generous than it sounds: ${d2}% of a smaller number is fewer dollars than ${d2}% of the original price.`,
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
      explanation: `Every percent problem relates three quantities through one relationship: part = percent x whole, where "whole" is the total amount, "percent" is the share of it being described, and "part" is the piece that share works out to. This question gives you the part (${num(part)}) and the percent (${p}%), and asks for the missing WHOLE - so the formula has to be rearranged to solve for whole instead of part: whole = part / percent. As decimals: whole = ${num(part)} / ${p / 100} = ${num(whole)}. The reflex mistake is to do what you'd do if the whole were already known and the part were missing - multiply ${num(part)} by ${p}% instead of dividing by it - which gives ${num((part * p) / 100)}, a smaller and unrelated number, because multiplying by a percent under 100% always shrinks a value, while dividing by it (to recover the whole) grows it back up. Reading which of the three quantities - part, whole, or percent - is actually missing decides whether the next step is a multiplication or a division, before any arithmetic even starts.`,
    };
  },
});
