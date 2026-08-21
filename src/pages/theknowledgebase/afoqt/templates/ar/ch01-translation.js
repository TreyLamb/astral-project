// Chapter 1 — Turning words into arithmetic.
//
// This is the deferred "chapter 14" from the Math Knowledge build, and it belongs here: it is
// not a math skill, it is a reading skill with a number at the end. Math Knowledge hands you
// `3x - 7 = 14` already written down. Arithmetic Reasoning makes you write it, and 69.6 seconds
// per question is generous precisely because the writing is the work.
//
// Four failures account for nearly every miss in the subtest, and there is one template family
// per failure:
//   1. the subtraction/division ran backwards ("7 less than x" is x - 7)
//   2. the wrong quantity was named as the unknown, so the algebra never closes
//   3. the algebra was right and the WRONG PERSON was reported - you solve for the base and
//      the question asks about someone defined off it
//   4. the units in the data and the units in the question never matched
//
// Number 3 is the one worth dwelling on. It is the only error on the whole test that punishes
// you for doing the problem correctly, and the official item set contains it deliberately: the
// three-person orange problem resolves to R = 7 and then asks for Leon, who is 9. Seven is on
// the answer sheet.

import { registerTemplate } from '../../engine/generator.js';
import { sweep, num, money } from '../util.js';
import { COUNTABLES, WEIGHED, twoNames, threeNames, plural, times, OATTS } from './words.js';

// --- 1. The order of a subtraction, and where the parentheses go ------------

/**
 * Four phrasings, each with its own error-mode slate, because the mistakes are not
 * interchangeable: "less than" inverts, "times the sum of" fails to distribute, and "the
 * quotient of" inverts a different way. A single generic distractor set would let the
 * candidate eliminate by shape rather than by reading.
 */
const PHRASINGS = [
  {
    id: 'less-than',
    phrase: (k, c) => `${c} less than ${times(k)} a number`,
    correct: (k, c) => `${k}n - ${c}`,
    wrong: (k, c) => [
      { value: `${c} - ${k}n`, error: 'reversed-subtraction', why: 'wrote the subtraction in the order the words appear' },
      { value: `${k}n + ${c}`, error: 'wrong-operation', why: 'read "less than" as an addition' },
      { value: `${k}(n - ${c})`, error: 'mis-grouped', why: 'subtracted before multiplying' },
      { value: `${c}n - ${k}`, error: 'swapped-numbers', why: 'swapped the multiplier and the constant' },
      { value: `n/${k} - ${c}`, error: 'wrong-operation', why: 'read "times" as "divided by"' },
    ],
    teach: (k, c) => `"${c} less than" something means you START from that something and take ${c} away, so the ${c} lands SECOND: ${k}n - ${c}. English puts it first, arithmetic puts it last, and that inversion is the single most common translation error on the subtest.`,
  },
  {
    id: 'more-than',
    phrase: (k, c) => `${c} more than ${times(k)} a number`,
    correct: (k, c) => `${k}n + ${c}`,
    wrong: (k, c) => [
      { value: `${c}n + ${k}`, error: 'swapped-numbers', why: 'swapped the multiplier and the constant' },
      { value: `${k}(n + ${c})`, error: 'mis-grouped', why: 'added before multiplying' },
      { value: `${k}n - ${c}`, error: 'wrong-operation', why: 'read "more than" as a subtraction' },
      { value: `n/${k} + ${c}`, error: 'wrong-operation', why: 'read "times" as "divided by"' },
      { value: `${c} - ${k}n`, error: 'reversed-subtraction', why: 'inverted an operation that was never a subtraction' },
    ],
    teach: (k, c) => `Addition does not care about order, so "${c} more than ${times(k)} a number" is ${k}n + ${c} either way. The trap here is not the order, it is which number multiplies: ${c}n + ${k} uses both numbers and means something else entirely.`,
  },
  {
    id: 'times-the-sum',
    phrase: (k, c) => `${times(k)} the sum of a number and ${c}`,
    correct: (k, c) => `${k}(n + ${c})`,
    wrong: (k, c) => [
      { value: `${k}n + ${c}`, error: 'failed-to-distribute', why: 'multiplied only the variable, not the whole sum' },
      { value: `n + ${k * c}`, error: 'failed-to-distribute', why: 'multiplied only the constant' },
      { value: `${c}(n + ${k})`, error: 'swapped-numbers', why: 'swapped the multiplier and the constant' },
      { value: `${k}(n - ${c})`, error: 'wrong-operation', why: 'read "sum" as a difference' },
      { value: `${k} + n + ${c}`, error: 'wrong-operation', why: 'read "times" as an addition' },
    ],
    // NOTE: kn + kc is NOT a distractor here. It is the distributed form of the answer, i.e. a
    // second correct option. `${k}n + ${c}` (undistributed constant) is the actual mistake.
    teach: (k, c) => `"The sum of a number and ${c}" is a single quantity, (n + ${c}), and ${times(k)} it multiplies ALL of it: ${k}(n + ${c}), which expands to ${k}n + ${k * c}. Writing ${k}n + ${c} multiplies half the sum and leaves the rest behind.`,
  },
  {
    id: 'quotient',
    phrase: (k, c) => `${c} less than the quotient of a number and ${k}`,
    correct: (k, c) => `n/${k} - ${c}`,
    wrong: (k, c) => [
      { value: `${k}/n - ${c}`, error: 'inverted-quotient', why: 'divided the wrong way round' },
      { value: `${c} - n/${k}`, error: 'reversed-subtraction', why: 'wrote the subtraction in the order the words appear' },
      { value: `(n - ${c})/${k}`, error: 'mis-grouped', why: 'subtracted before dividing' },
      { value: `${k}n - ${c}`, error: 'wrong-operation', why: 'read "quotient" as a product' },
      { value: `n/${k} + ${c}`, error: 'wrong-operation', why: 'read "less than" as an addition' },
    ],
    teach: (k, c) => `"The quotient of a number and ${k}" is n/${k} - the first thing named goes on top. Then "${c} less than" that subtracts from it: n/${k} - ${c}. Both halves of this phrase invert, which is why it is worth reading twice.`,
  },
];

registerTemplate({
  id: 'ar-translate-expression',
  subtest: 'AR',
  band: 1,
  name: 'Writing a phrase as an expression',
  concepts: ['ar-keyword-translation'],
  calibratedAgainst: 'phillips',
  generate: (rng, h) => {
    const form = h.pick(PHRASINGS);
    const k = h.int(2, 9);
    // k === c collapses "swapped the multiplier and the constant" onto the answer - the swap
    // is invisible when the two numbers are the same.
    let c = h.int(2, 15);
    if (c === k) c = k === 15 ? 14 : c + 1;
    const { choices, correctIndex, errors, whys } = h.choices(form.correct(k, c), form.wrong(k, c));
    return {
      stem: `Which expression represents "${form.phrase(k, c)}"?`,
      choices, correctIndex, errors, whys,
      tags: ['translation'],
      explanation: form.teach(k, c),
    };
  },
});

// --- 2. Undoing operations in the right order -------------------------------

registerTemplate({
  id: 'ar-order-trap',
  subtest: 'AR',
  band: 2,
  name: 'Undoing a two-step description',
  concepts: ['ar-operation-order-trap'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const m = h.int(2, 9);
    const x0 = h.int(6, 40);
    // Sweep `a`: this item is built entirely out of x, a and m, so two undo-mistakes land on
    // the same value far more often than they look like they would - and one of them lands on
    // the answer whenever a happens to be 0 or the arithmetic folds.
    const a = sweep(2, 20, h.int(2, 20), (cand) => {
      const r = (x0 - cand) * m;
      return [x0, r / m - cand, Math.round((r - cand) / m), r / m, r - cand * m, r * m + cand];
    });
    const result = (x0 - a) * m;
    const { choices, correctIndex, errors, whys } = h.choices(x0, [
      { value: num(result / m - a), error: 'undid-twice', why: 'subtracted a again instead of adding it back' },
      { value: num(Math.round((result - a) / m)), error: 'wrong-undo-order', why: 'undid the operations in the order the sentence gave them' },
      { value: num(result / m), error: 'stopped-early', why: 'divided but never added the constant back' },
      { value: num(result - a * m), error: 'wrong-operation', why: 'subtracted instead of dividing' },
      { value: num(result * m + a), error: 'wrong-operation', why: 'multiplied instead of dividing' },
    ]);
    return {
      stem: `A number is decreased by ${a}, and the result is then multiplied by ${m}, giving ${result}. What is the number?`,
      choices, correctIndex, errors, whys,
      tags: ['translation'],
      explanation: `Work backwards, and undo the LAST operation first: ${result} / ${m} = ${num(result / m)}, then add the ${a} back to get ${x0}. Running the undo in the order the sentence reads - subtracting ${a} from ${result} first - gives ${num(Math.round((result - a) / m))}, and it is wrong for the same reason you take your shoes off before your socks.`,
    };
  },
});

// --- 3. Two related quantities, and the question asking about the other one --

registerTemplate({
  id: 'ar-relate-two',
  subtest: 'AR',
  band: 2,
  name: 'Two quantities, one defined off the other',
  concepts: ['ar-choose-the-unknown'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const [a, b] = twoNames(h);
    const obj = h.pick(COUNTABLES);
    // k >= 3 keeps "split it evenly" (t/2) clear of "divided by k instead of k+1" (t/k).
    const k = h.int(3, 6);
    const u = sweep(4, 30, h.int(4, 30), (cand) => {
      const t = cand * (k + 1);
      return [k * cand, cand, Math.round(t / 2), t, cand + k, Math.round(t / k)];
    });
    const total = u * (k + 1);
    const correct = k * u;
    const { choices, correctIndex, errors, whys } = h.choices(correct, [
      { value: u, error: 'answered-for-the-other', why: `gave ${b}'s share instead of ${a}'s` },
      { value: Math.round(total / 2), error: 'split-evenly', why: 'halved the total and ignored the ratio' },
      { value: total, error: 'answered-with-the-total', why: 'reported the combined figure' },
      { value: Math.round(total / k), error: 'wrong-number-of-parts', why: `divided by ${k} instead of by the ${k + 1} parts` },
      { value: u + k, error: 'added-the-multiplier', why: 'added the multiplier instead of multiplying by it' },
    ]);
    return {
      stem: `${a} ${obj.verb} ${times(k)} as many ${obj.many} as ${b}. Together they ${obj.verb} ${total} ${obj.many}. How many did ${a} ${obj.bare}?`,
      choices, correctIndex, errors, whys,
      tags: ['translation'],
      explanation: `Let ${b} = n. Then ${a} = ${k}n, and n + ${k}n = ${k + 1}n = ${total}, so n = ${u}. The question asks about ${a}: ${k} x ${u} = ${correct}. Note ${u} is on the answer sheet - it is ${b}'s figure, and it is what you get by solving correctly and then stopping one line early.`,
    };
  },
});

registerTemplate({
  id: 'ar-relate-three',
  subtest: 'AR',
  band: 3,
  name: 'Three quantities sharing a total',
  concepts: ['ar-choose-the-unknown', 'ar-answer-the-question'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const [a, b, c] = threeNames(h);
    const obj = h.pick(WEIGHED);
    const k = h.int(2, 4);
    const add = h.int(2, 9);
    const base = sweep(3, 24, h.int(3, 24), (cand) => {
      const t = (k + 2) * cand + add;
      return [cand + add, cand, k * cand, Math.round((t - add) / (k + 1)), Math.round(t / 3), t - add];
    });
    const total = (k + 2) * base + add;
    // Ask about the "+ constant" person: the algebra resolves to the BASE, so this is the
    // shape where finishing the algebra and answering are two different acts.
    const correct = base + add;
    const { choices, correctIndex, errors, whys } = h.choices(correct, [
      { value: base, error: 'answered-with-the-unknown', why: `solved for ${b} and reported that` },
      { value: k * base, error: 'answered-for-the-other', why: `gave ${a}'s figure` },
      { value: Math.round((total - add) / (k + 1)), error: 'miscounted-shares', why: `divided by ${k + 1} shares instead of ${k + 2}` },
      { value: Math.round(total / 3), error: 'split-evenly', why: 'split the total three ways and ignored the relationships' },
      { value: total - add, error: 'subtracted-from-the-total', why: 'took the constant off the total instead of solving' },
    ]);
    return {
      stem: `${a} ${obj.verb} ${times(k)} as many ${obj.many} as ${b}, and ${c} ${obj.verb} ${add} ${obj.many} more than ${b}. Together they ${obj.verb} ${total} ${obj.many}. How many ${obj.many} did ${c} ${obj.bare}?`,
      choices, correctIndex, errors, whys,
      tags: ['translation'],
      explanation: `Name the one everything else is measured against: ${b} = n. Then ${a} = ${k}n and ${c} = n + ${add}, so ${k}n + n + (n + ${add}) = ${k + 2}n + ${add} = ${total}, giving n = ${base}. Now answer the question that was asked - ${c} = ${base} + ${add} = ${correct}. The algebra hands you ${base}, and ${base} is one of the five options.`,
    };
  },
});

registerTemplate({
  id: 'ar-answer-asked',
  subtest: 'AR',
  band: 3,
  name: 'The question asks for the difference',
  concepts: ['ar-answer-the-question'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const [a, b] = twoNames(h);
    const obj = h.pick(COUNTABLES);
    const k = h.int(2, 5);
    const u = sweep(6, 40, h.int(6, 40), (cand) => {
      const t = cand * (k + 1);
      return [(k - 1) * cand, k * cand, cand, t, Math.round(t / 2), k + 1];
    });
    const total = u * (k + 1);
    const correct = (k - 1) * u;
    const { choices, correctIndex, errors, whys } = h.choices(correct, [
      { value: k * u, error: 'answered-with-a-value', why: `gave ${a}'s count rather than the gap` },
      { value: u, error: 'answered-with-a-value', why: `gave ${b}'s count rather than the gap` },
      { value: total, error: 'answered-with-the-total', why: 'reported the combined figure' },
      { value: Math.round(total / 2), error: 'split-evenly', why: 'halved the total and ignored the ratio' },
      { value: k + 1, error: 'answered-with-the-parts', why: 'gave the number of shares rather than a count' },
    ]);
    return {
      stem: `${a} ${obj.verb} ${times(k)} as many ${obj.many} as ${b}, and between them they ${obj.verb} ${total} ${obj.many}. How many MORE ${obj.many} did ${a} ${obj.bare} than ${b}?`,
      choices, correctIndex, errors, whys,
      tags: ['translation'],
      explanation: `${b} = ${u} and ${a} = ${k} x ${u} = ${k * u}, so the difference is ${k * u} - ${u} = ${correct}. Both of those figures are on the answer sheet, and both are the right answer to a question that was not asked. Underline the last sentence before you compute anything.`,
    };
  },
});

// --- 4. Units that do not match the question --------------------------------

const PRICED_BY_LENGTH = [
  { good: 'wire', unit: 'foot', unitPl: 'feet', big: 'yard', bigPl: 'yards', factor: 3 },
  { good: 'cable', unit: 'foot', unitPl: 'feet', big: 'yard', bigPl: 'yards', factor: 3 },
  { good: 'trim', unit: 'inch', unitPl: 'inches', big: 'foot', bigPl: 'feet', factor: 12 },
  { good: 'tubing', unit: 'inch', unitPl: 'inches', big: 'foot', bigPl: 'feet', factor: 12 },
  { good: 'rope', unit: 'foot', unitPl: 'feet', big: 'yard', bigPl: 'yards', factor: 3 },
];

registerTemplate({
  id: 'ar-unit-mismatch',
  subtest: 'AR',
  band: 2,
  name: 'A price quoted in one unit, a quantity given in another',
  concepts: ['ar-unit-tracking'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const m = h.pick(PRICED_BY_LENGTH);
    const perUnit = h.int(2, 12) * 0.25 + 0.5;
    const bigQty = h.int(2, 15);
    const smallQty = bigQty * m.factor;
    const correct = perUnit * smallQty;
    const { choices, correctIndex, errors, whys } = h.choices(money(correct), [
      { value: money(perUnit * bigQty), error: 'never-converted', why: `priced ${bigQty} ${m.bigPl} as if they were ${m.unitPl}` },
      { value: money((perUnit * bigQty) / m.factor), error: 'converted-backwards', why: `divided by ${m.factor} instead of multiplying` },
      { value: money(correct * m.factor), error: 'converted-twice', why: `applied the x${m.factor} a second time` },
      { value: money(perUnit + smallQty), error: 'wrong-operation', why: 'added the price to the length' },
      { value: money(smallQty), error: 'dropped-the-price', why: 'reported the converted length as if it were money' },
    ]);
    return {
      stem: `${m.good.charAt(0).toUpperCase() + m.good.slice(1)} costs ${money(perUnit)} per ${m.unit}. What is the cost of ${plural(bigQty, m.big, m.bigPl)} of ${m.good}?`,
      choices, correctIndex, errors, whys,
      tags: ['translation', 'units'],
      explanation: `The price is per ${m.unit} and the quantity is in ${m.bigPl}, so convert before you multiply: ${bigQty} x ${m.factor} = ${smallQty} ${m.unitPl}, then ${smallQty} x ${money(perUnit)} = ${money(correct)}. Multiplying ${money(perUnit)} by ${bigQty} gives ${money(perUnit * bigQty)} - a clean-looking number produced by never reading the units at all.`,
    };
  },
});
