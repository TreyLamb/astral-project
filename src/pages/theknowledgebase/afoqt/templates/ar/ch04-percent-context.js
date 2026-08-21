// Chapter 4 — Percent in context.
//
// Math Knowledge asks "what is 30% of 240?". Arithmetic Reasoning buries the same arithmetic
// under a paragraph whose real question is WHICH NUMBER IS THE BASE, and then asks for a
// quantity one step past the one the percent gives you. The official item set does this three
// separate ways, and each has a template here:
//
//   - a percent OF a percent, where the second base is the first result, not the original
//   - a percent converted back to a COUNT, and then to the count that was NOT asked about
//   - a discount expressed as an equivalence ("the same as how many at full price?"), which is
//     a counting question wearing a percent costume
//
// The recurring distractor throughout is the STAGE-ONE RESULT. It is a real number, correctly
// computed, and it is the answer to the question you stopped reading halfway through - in the
// official 14,500-student item it is 6,960, and it sits right there on the answer sheet.

import { registerTemplate } from '../../engine/generator.js';
import { num, money, sweep } from '../util.js';
import { POPULATIONS, ORGS, GOODS, twoNames, OATTS } from './words.js';


registerTemplate({
  id: 'ar-percent-subgroup',
  subtest: 'AR',
  band: 3,
  name: 'A percent of a percent',
  concepts: ['ar-percent-subgroup'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const pop = h.pick(POPULATIONS);
    const total = h.int(6, 40) * 500;
    // ⚠ 50 is excluded. At p1 = 50 the group and "everyone outside the group" are the same
    // size, so two distractors coincide for EVERY p2 - the sweep below has no clean value to
    // find and falls back to a colliding one. 48 and 52 are the official item's own split and
    // read just as naturally.
    const p1 = h.pick([20, 25, 40, 48, 52, 60, 75]);
    // Swept in 5-point steps. p2 === p1 and p2 === 100 - p1 both fold two of the "wrong base"
    // distractors onto values already in the slate, and at p1 = 50 they are the same condition.
    const p2 = sweep(4, 19, h.int(4, 19), (cand5) => {
      const cand = cand5 * 5;
      const g = (total * p1) / 100;
      const c = (g * (100 - cand)) / 100;
      if (!Number.isInteger(c)) return null;
      return [c, g, (g * cand) / 100, (total * (100 - cand)) / 100, (total * cand) / 100,
        (total * (100 - p1)) / 100, total - c];
    }) * 5;
    const group = (total * p1) / 100;
    const correct = (group * (100 - p2)) / 100;
    // Every one of these is a correctly-executed calculation of the wrong thing, which is what
    // makes them hard to eliminate: none is arithmetically wrong, they just answer a different
    // sentence.
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(group), error: 'stopped-at-stage-one', why: `gave the whole group rather than the ${100 - p2}% of it that was asked for` },
      { value: num((group * p2) / 100), error: 'wrong-side-of-the-split', why: `gave the ${p2}% instead of the rest` },
      { value: num((total * (100 - p2)) / 100), error: 'wrong-base', why: 'took the second percent of the WHOLE population instead of the group' },
      { value: num((total * p2) / 100), error: 'wrong-base', why: 'took the second percent of the whole population' },
      { value: num((total * (100 - p1)) / 100), error: 'wrong-side-of-the-split', why: 'gave everyone outside the group' },
      { value: num(total - correct), error: 'answered-the-complement', why: 'gave everyone the question did not ask about' },
    ]);
    return {
      stem: `A ${pop.whole} has ${total.toLocaleString('en-US')} ${pop.member}, of whom ${p1}% are ${pop.sub}. If ${p2}% of the ${pop.subNoun} ${pop.past}, how many ${pop.subNoun} did NOT ${pop.bare}?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `Two stages, and the second base is the FIRST RESULT - the ${p2}% is ${p2}% of the ${pop.subNoun}, not of all ${total.toLocaleString('en-US')} ${pop.member}. Stage 1: ${p1}% of ${total.toLocaleString('en-US')} = ${num(group)} ${pop.subNoun}. Stage 2: the question asks who did NOT, which is ${100 - p2}% of ${num(group)} = ${num(correct)}. Note ${num(group)} is on the answer sheet - it is stage one, computed perfectly, and it answers the question you have not finished reading.`,
    };
  },
});

registerTemplate({
  id: 'ar-percent-to-count',
  subtest: 'AR',
  band: 2,
  name: 'A score turned back into a count',
  concepts: ['ar-percent-to-count'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    // ⚠ 100 is deliberately NOT in this list. On a 100-question test the number missed and the
    // percentage missed are the same number, so "reported the percentage as a count" IS the
    // correct answer and no choice of score can separate them - the sweep below has no clean
    // value to find and falls back to a colliding one. The item only teaches the units
    // distinction when the two genuinely differ.
    const total = h.pick([20, 25, 40, 50, 80, 200]);
    const s = sweep(52, 96, h.int(52, 96), (cand) => {
      if ((total * cand) % 100 !== 0) return null;
      const right = (total * cand) / 100;
      return [total - right, right, 100 - cand, cand, total - (100 - cand), total, 2 * (total - right)];
    });
    const right = (total * s) / 100;
    const correct = total - right;
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(right), error: 'answered-the-other-half', why: 'gave the number ANSWERED CORRECTLY' },
      { value: num(100 - s), error: 'percent-as-a-count', why: `reported the ${100 - s} percentage points as if they were questions` },
      { value: num(s), error: 'percent-as-a-count', why: 'reported the score itself as a count' },
      { value: num(total - (100 - s)), error: 'mixed-units', why: 'subtracted a percentage from a count' },
      { value: num(total), error: 'answered-with-the-total', why: 'gave the number of questions on the test' },
      { value: num(2 * correct), error: 'doubled-it', why: 'doubled a correct count' },
    ]);
    return {
      stem: `A test has ${total} questions, all worth the same. How many questions can be answered incorrectly and still leave a score of ${s}%?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `${s}% of ${total} = ${num(right)} correct, so ${total} - ${num(right)} = ${num(correct)} can be missed. The percentage and the count are different units and only one of them is what the question wants: ${100 - s} is the percentage missed, ${num(correct)} is the number of QUESTIONS missed, and they only coincide when the test happens to have 100 questions on it.`,
    };
  },
});

registerTemplate({
  id: 'ar-discount-equivalence',
  subtest: 'AR',
  band: 3,
  name: 'Discounted items as full-price equivalents',
  concepts: ['ar-discount-equivalence'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const good = h.pick(GOODS);
    const off = h.pick([25, 50, 75]);
    const keep = (100 - off) / 100;
    const full = h.int(2, 6);
    // The discounted count divides evenly by the discount, so the equivalence lands on a whole
    // number of items - a "4.5 items at full price" answer is a different, worse question.
    const step = off === 50 ? 2 : 4;
    const disc = sweep(1, 3, h.int(1, 3), (mult) => {
      const d = step * mult;
      return [full + d * keep, full + d, d * keep, full, (full + d) * keep, full * keep + d];
    }) * step;
    const correct = full + disc * keep;
    // ⚠ At 50% off, "used the fraction taken off instead of the fraction paid" and "halved the
    // discounted items regardless" BOTH equal the answer - the two fractions coincide. Both
    // were in the first slate, so every 50% item shipped three correct options. 50% is the
    // official item's own discount, so the fix is a slate that survives it rather than
    // dropping the case.
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(full + disc), error: 'ignored-the-discount', why: 'counted every item at full price' },
      { value: num(disc * keep), error: 'dropped-the-full-price-items', why: 'converted the discounted items and forgot the rest' },
      { value: num(full), error: 'dropped-the-discounted-items', why: 'counted only the full-price items' },
      { value: num((full + disc) * keep), error: 'discounted-everything', why: 'applied the discount to the whole purchase' },
      { value: num(full * keep + disc), error: 'discounted-the-wrong-group', why: 'applied the discount to the full-price items instead' },
    ]);
    return {
      stem: `You buy ${full} ${good}s at full price and ${disc} more ${good}s at ${off}% off. In total you have paid the equivalent of how many ${good}s at full price?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `At ${off}% off you still pay ${100 - off}%, so each discounted ${good} is worth ${num(keep)} of a full-price one: ${disc} x ${num(keep)} = ${num(disc * keep)}. Add the ${full} bought outright: ${full} + ${num(disc * keep)} = ${num(correct)}. The percentage never touches the ${full} full-price items - reading "${off}% off" as applying to the whole basket gives ${num((full + disc) * keep)}.`,
    };
  },
});

registerTemplate({
  id: 'ar-reverse-tax',
  subtest: 'AR',
  band: 3,
  name: 'Working back to a pre-tax price',
  concepts: ['ar-markup-tax-tip'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const good = h.pick(GOODS);
    const rate = h.pick([4, 5, 6, 8, 10, 20, 25]);
    const base = h.int(4, 60) * 25;
    const paid = base * (1 + rate / 100);
    const { choices, correctIndex, errors, whys } = h.choices(money(base), [
      { value: money(paid * (1 - rate / 100)), error: 'subtracted-the-percent', why: `took ${rate}% OFF the total, which uses the wrong base` },
      { value: money(paid - rate), error: 'percent-as-money', why: `subtracted ${rate} dollars instead of ${rate} percent` },
      { value: money(paid), error: 'no-change', why: 'reported the amount paid' },
      { value: money(paid / (1 + rate / 100) / (1 + rate / 100)), error: 'divided-twice', why: 'removed the tax a second time' },
      { value: money(paid * (1 + rate / 100)), error: 'went-the-wrong-way', why: 'added the tax again instead of removing it' },
    ]);
    return {
      stem: `A ${good} costs ${money(paid)} including ${rate}% sales tax. What was the price before tax?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `The total is the price PLUS ${rate}% of the price, i.e. ${num(1 + rate / 100)} times the price - so divide: ${money(paid)} / ${num(1 + rate / 100)} = ${money(base)}. Taking ${rate}% off the total instead gives ${money(paid * (1 - rate / 100))}, and it is wrong because the tax was ${rate}% of the SMALLER pre-tax figure, never of the total. Check by going forwards: ${money(base)} + ${rate}% = ${money(paid)}.`,
    };
  },
});

registerTemplate({
  id: 'ar-tip-split',
  subtest: 'AR',
  band: 2,
  name: 'A bill with a tip, split evenly',
  concepts: ['ar-markup-tax-tip'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    const [a] = twoNames(h);
    const people = h.int(3, 8);
    const rate = h.pick([10, 15, 20, 25]);
    const bill = h.int(4, 30) * people * 5;
    const total = bill * (1 + rate / 100);
    const correct = total / people;
    const { choices, correctIndex, errors, whys } = h.choices(money(correct), [
      { value: money(bill / people), error: 'forgot-the-tip', why: 'split the bill before adding the tip' },
      { value: money(total), error: 'forgot-to-split', why: 'gave the whole bill rather than one share' },
      { value: money((bill * rate) / 100 / people), error: 'answered-with-the-tip', why: 'gave each share of the TIP only' },
      { value: money(bill / people + rate), error: 'percent-as-money', why: `added ${rate} dollars to each share instead of ${rate} percent` },
      { value: money((bill / people) * rate), error: 'percent-as-multiplier', why: `multiplied each share by ${rate} rather than by ${num(1 + rate / 100)}` },
    ]);
    return {
      stem: `${a} and ${people - 1} colleagues share a meal costing ${money(bill)} before a ${rate}% tip. If they add the tip and split the total evenly, how much does each person pay?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `Add the tip to the bill first, then divide: ${money(bill)} x ${num(1 + rate / 100)} = ${money(total)}, and ${money(total)} / ${people} = ${money(correct)}. Order does not actually matter here - splitting first and then adding ${rate}% to each share gives the same figure - but splitting and FORGETTING the tip gives ${money(bill / people)}, which is the option most people take.`,
    };
  },
});

// ✂️ COMMERCIAL-ONLY ARCHETYPE, like mixture and work-rate in chapter 5: compound interest is a
// prep-book staple and appears in no OATTS module and no AFPC sample item. Built anyway, banded
// 4, and ranked last in the chapter.
//
// It carries `ar-percent-remaining` rather than a concept of its own, and that is a real mapping
// rather than a filing convenience: that concept IS "successive percentage changes multiply
// rather than add", and compounding is the same rule applied n times instead of twice. Math
// Knowledge's `mk-simple-interest` teaches the other side of the same contrast, and its headline
// distractor is the compounded figure - this one's is the simple figure, deliberately.
registerTemplate({
  id: 'ar-compound-interest',
  subtest: 'AR',
  band: 4,
  name: 'Compound interest against simple interest',
  concepts: ['ar-percent-remaining'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    // 25 and 50 keep the arithmetic just as clean and were in the first draw, but "50% interest
    // compounded annually" is not a rate any bank has ever offered - the same realism failure as
    // a boat at 140 mph, and just as invisible to the audit. 10% and 20% divide every round
    // principal here evenly at both horizons.
    const rate = h.pick([10, 20]);
    const years = h.int(2, 3);
    const growth = 1 + rate / 100;
    // The principal is swept over round figures until the compounded balance lands on whole
    // dollars - $1,024 is a divisor, not a principal any answer key would print.
    const step = sweep(3, 16, h.int(3, 16), (cand) => {
      const p = cand * 500;
      const bal = p * growth ** years;
      if (!Number.isInteger(bal)) return null;
      return [bal, p * (1 + (rate * years) / 100), p * growth, bal - p,
        p * growth ** (years + 1), (p * rate * years) / 100];
    });
    const principal = step * 500;
    const correct = principal * growth ** years;
    const simple = principal * (1 + (rate * years) / 100);
    const { choices, correctIndex, errors, whys } = h.choices(money(correct), [
      { value: money(simple), error: 'used-simple-interest', why: `charged ${rate}% of the ORIGINAL principal every year instead of compounding` },
      { value: money(principal * growth), error: 'one-period-only', why: 'applied the rate once rather than once per year' },
      { value: money(correct - principal), error: 'answered-with-the-interest', why: 'gave the interest earned rather than the balance' },
      { value: money(principal * growth ** (years + 1)), error: 'off-by-a-period', why: `compounded ${years + 1} times instead of ${years}` },
      { value: money((principal * rate * years) / 100), error: 'answered-with-the-interest', why: 'gave the simple interest amount alone' },
    ]);
    return {
      stem: `${money(principal)} is invested at ${rate}% interest compounded annually. What is the balance after ${years} years?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `Compounding multiplies by ${num(growth)} once per year, because each year's interest is charged on the balance that is there AT THE TIME: ${money(principal)} x ${num(growth)}^${years} = ${money(correct)}. Simple interest would charge ${rate}% of the original ${money(principal)} every year, giving ${money(simple)} - and the gap between those two figures IS the interest earned on earlier interest. Read the word "compounded"; it is doing all the work in this stem.`,
    };
  },
});

registerTemplate({
  id: 'ar-percent-remaining',
  subtest: 'AR',
  band: 4,
  name: 'A fall followed by a rise',
  concepts: ['ar-percent-remaining'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const org = h.pick(ORGS);
    const start = h.int(4, 30) * 200;
    const down = h.pick([10, 15, 20, 25, 40]);
    // Swept in 5-point steps, and every value on the slate must come out WHOLE. People do not
    // come in fractions: the first build swept single percentage points and produced "increased
    // by 29%", giving 5,263.2 employees rounded to 5,263 - a number no answer key would print,
    // and an arithmetic check that fails if Trey works it himself.
    const up = sweep(1, 10, h.int(1, 10), (cand5) => {
      const cand = cand5 * 5;
      const a = (start * (100 - down)) / 100;
      const c = (a * (100 + cand)) / 100;
      if (!Number.isInteger(c)) return null;
      return [c, (start * (100 - down + cand)) / 100, a, start,
        (start * (100 + cand)) / 100, (a * (100 - cand)) / 100];
    }) * 5;
    const after = (start * (100 - down)) / 100;
    const correct = (after * (100 + up)) / 100;
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num((start * (100 - down + up)) / 100), error: 'added-the-percents', why: `treated it as a single net ${up - down}% change on the original` },
      { value: num(after), error: 'stopped-at-stage-one', why: 'stopped after the reduction' },
      { value: num(start), error: 'assumed-it-cancels', why: 'assumed the rise undid the fall' },
      { value: num((start * (100 + up)) / 100), error: 'wrong-base', why: 'applied the rise to the ORIGINAL figure' },
      { value: num((after * (100 - up)) / 100), error: 'wrong-direction', why: 'reduced a second time instead of increasing' },
    ]);
    return {
      stem: `A ${org} employs ${start.toLocaleString('en-US')} people. Staffing is cut by ${down}%, and the following year the reduced staff is increased by ${up}%. How many people does it employ then?`,
      choices, correctIndex, errors, whys,
      tags: ['percent'],
      explanation: `Percents apply to whatever is there AT THE TIME, so they multiply rather than add: ${start.toLocaleString('en-US')} x ${num(1 - down / 100)} = ${num(after)}, then x ${num(1 + up / 100)} = ${num(correct)}. The ${up}% is ${up}% of the REDUCED figure, not of the original - which is why a ${down}% cut followed by a ${down}% rise never gets you back where you started.`,
    };
  },
});
