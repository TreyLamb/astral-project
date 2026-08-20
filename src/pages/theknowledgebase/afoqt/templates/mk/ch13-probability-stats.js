// Chapter 13 — Probability, counting and statistics.
//
// Small chapter, four traps: probability is part-over-WHOLE (not part-over-rest), a second
// draw without replacement changes BOTH numbers, permutations count order and combinations
// do not, and an average of averages is not an average unless the groups are the same size.

import { registerTemplate } from '../../engine/generator.js';
import { frac, nPr, nCr, num } from '../util.js';

registerTemplate({
  id: 'mk-simple-probability',
  subtest: 'MK',
  band: 2,
  name: 'Probability of a single draw',
  concepts: ['simple-probability'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    const red = h.int(2, 12);
    const blue = h.int(2, 12);
    const green = h.int(2, 12);
    const total = red + blue + green;
    const correct = frac(red, total).s;
    // Error modes: part over the REST (that is odds, not probability); the complement;
    // inverted; compared against only one other colour.
    const { choices, correctIndex } = h.choices(correct, [
      frac(red, blue + green).s,
      frac(blue + green, total).s,
      frac(total, red).s,
      frac(red, blue).s,
      frac(red + blue, total).s,
      frac(blue, total).s,
    ]);
    return {
      stem: `A bag holds ${red} red, ${blue} blue and ${green} green marbles. One marble is drawn at random. What is the probability it is red?`,
      choices, correctIndex,
      tags: ['probability'],
      explanation: `P = favourable / TOTAL = ${red}/${total} = ${correct}. ${frac(red, blue + green).s} is the ODDS (red to not-red), which is a different quantity and a favourite distractor.`,
    };
  },
});

registerTemplate({
  id: 'mk-compound-probability',
  subtest: 'MK',
  band: 4,
  name: 'Two draws without replacement',
  concepts: ['compound-probability'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const k = h.int(3, 9);
    const others = h.int(3, 12);
    const n = k + others;
    const correct = frac(k * (k - 1), n * (n - 1)).s;
    // ⭐ The item exists for one distractor: the WITH-replacement answer. Both the numerator
    // and the denominator drop by one on the second draw, and forgetting either is the miss.
    const { choices, correctIndex } = h.choices(correct, [
      frac(k * k, n * n).s,
      frac(k * (k - 1), n * n).s,
      frac(k * k, n * (n - 1)).s,
      frac(k, n).s,
      frac(2 * k, n).s,
      frac(k + k - 1, n + n - 1).s,
    ]);
    return {
      stem: `A box holds ${k} defective parts and ${others} good ones. Two parts are drawn at random WITHOUT replacement. What is the probability that both are defective?`,
      choices, correctIndex,
      tags: ['probability'],
      explanation: `First draw ${k}/${n}; the box is now smaller AND has one fewer defective, so the second is ${k - 1}/${n - 1}. Multiply: ${correct}. With replacement it would be ${frac(k * k, n * n).s} - the words "without replacement" are the whole question.`,
    };
  },
});

registerTemplate({
  id: 'mk-permutation-combination',
  subtest: 'MK',
  band: 4,
  // Bounded: 6 group sizes x 3 selection sizes x the two framings. Beyond n = 10 the
  // factorials stop being mental arithmetic, which is the only thing this item tests.
  stemSpace: 36,
  name: 'Permutations and combinations',
  concepts: ['permutations', 'combinations'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const n = h.int(5, 10);
    const r = h.int(2, 4);
    const ordered = h.int(0, 1) === 1;
    const correct = ordered ? nPr(n, r) : nCr(n, r);
    // ⭐ The two are each other's distractor, which is the only honest way to write this item:
    // the mistake is never arithmetic, it is deciding whether order matters.
    const { choices, correctIndex } = h.choices(correct, [
      ordered ? nCr(n, r) : nPr(n, r),
      n ** r,
      n * r,
      nCr(n, r) * r,
      nPr(n, r) * r,
      n + r,
    ]);
    const stem = ordered
      ? `In how many different ORDERS can ${r} of ${n} runners finish first through ${r === 2 ? 'second' : r === 3 ? 'third' : 'fourth'}?`
      : `In how many ways can a committee of ${r} be chosen from ${n} people?`;
    return {
      stem,
      choices, correctIndex,
      tags: ['probability'],
      explanation: ordered
        ? `Order matters, so this is a permutation: P(${n},${r}) = ${n}!/(${n}-${r})! = ${correct}. The combination C(${n},${r}) = ${nCr(n, r)} would count the same ${r} runners once regardless of who won.`
        : `Order does NOT matter on a committee, so this is a combination: C(${n},${r}) = ${correct}. The permutation P(${n},${r}) = ${nPr(n, r)} counts the same ${r} people ${r}! different ways.`,
    };
  },
});

// Fixed scrambles of a sorted 7-item list. Every one moves the median away from slot 3, so
// "took the middle of the list as written" is always a wrong answer and always available.
const SHUFFLES = [
  [2, 5, 0, 6, 1, 4, 3], [4, 0, 6, 2, 5, 3, 1], [1, 6, 3, 0, 4, 2, 5],
  [5, 2, 4, 1, 6, 0, 3], [6, 3, 1, 5, 0, 4, 2], [0, 4, 5, 2, 3, 6, 1],
  [3, 1, 6, 4, 2, 5, 0], [2, 6, 0, 5, 3, 1, 4],
];

registerTemplate({
  id: 'mk-median',
  subtest: 'MK',
  band: 2,
  name: 'Median of a data set',
  concepts: ['mean-median-mode'],
  calibratedAgainst: 'oatts',
  generate: (rng, h) => {
    // Build strictly increasing, then scramble with a permutation that never leaves the
    // median in the middle SLOT. Drawing 7 free values allowed repeats, and a repeated median
    // put two distractors (the 3rd and 5th sorted values) on top of the answer.
    const asc = [h.int(2, 20)];
    for (let i = 1; i < 7; i++) asc.push(asc[i - 1] + h.int(2, 9));
    const perm = h.pick(SHUFFLES);
    const values = perm.map((i) => asc[i]);
    const sorted = asc;
    const correct = sorted[3];
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    // ⭐ The middle of the UNSORTED list is the distractor this item is built around - the
    // whole skill is remembering to sort first.
    const { choices, correctIndex } = h.choices(correct, [
      values[3],
      mean,
      sorted[6] - sorted[0],
      sorted[0],
      sorted[6],
      sorted[2],
      sorted[4],
    ]);
    return {
      stem: `What is the median of: ${values.join(', ')}?`,
      choices, correctIndex,
      tags: ['statistics'],
      explanation: `Sort first: ${sorted.join(', ')}. With 7 values the median is the 4th, ${correct}. The 4th value as WRITTEN is ${values[3]}, and taking it without sorting is the standard miss. (The mean here is about ${mean}, and the range is ${sorted[6] - sorted[0]}.)`,
    };
  },
});

registerTemplate({
  id: 'mk-mean-missing-value',
  subtest: 'MK',
  band: 3,
  name: 'Finding a missing value from a mean',
  concepts: ['mean-median-mode'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const count = h.int(4, 6);
    const mean = h.int(10, 90);
    const known = [];
    for (let i = 0; i < count - 1; i++) known.push(h.int(5, 95));
    // If the missing value equals the mean (or the average of the known ones), two distractors
    // land on the answer. Nudge one known value until it does not.
    for (let i = 0; i < 30; i++) {
      const s = known.reduce((a, b) => a + b, 0);
      const c = mean * count - s;
      if (c !== mean && c !== Math.round(s / (count - 1)) && c > 0) break;
      known[0] += 1;
    }
    const sum = known.reduce((a, b) => a + b, 0);
    const correct = mean * count - sum;
    // Error modes: subtracted the mean instead of the total; answered with the total; used
    // count - 1; answered with the mean itself.
    const { choices, correctIndex } = h.choices(correct, [
      mean - Math.round(sum / (count - 1)),
      mean * count,
      mean * (count - 1) - sum,
      mean,
      sum - mean * count,
      Math.round(sum / (count - 1)),
    ]);
    return {
      stem: `The mean of ${count} numbers is ${mean}. ${count - 1} of them are ${known.join(', ')}. What is the remaining number?`,
      choices, correctIndex,
      tags: ['statistics'],
      explanation: `A mean of ${mean} across ${count} numbers means the TOTAL is ${mean} x ${count} = ${mean * count}. The known values sum to ${sum}, so the missing one is ${correct}. Always convert the mean back into a total first.`,
    };
  },
});

registerTemplate({
  id: 'mk-weighted-average',
  subtest: 'MK',
  band: 4,
  name: 'Weighted average of two groups',
  concepts: ['weighted-average'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const p = h.int(1, 5);
    let q = h.int(1, 5);
    // Equal group sizes would make the plain average correct, and this item exists precisely
    // because it usually is not.
    if (q === p) q = p === 5 ? 1 : q + 1;
    const a1 = h.int(12, 19) * 5;
    let a2 = h.int(12, 19) * 5;
    if (a2 === a1) a2 = a1 === 95 ? 60 : a1 + 5;
    // Walk a2 to the nearest value that makes the combined average a whole number.
    for (let i = 0; i < 12 && (p * a1 + q * a2) % (p + q) !== 0; i++) a2 += a2 > a1 ? 1 : -1;
    const n1 = p * 10, n2 = q * 10;
    const correct = (p * a1 + q * a2) / (p + q);
    // ⭐ The plain average of the two averages - right only when the groups are equal, which
    // they deliberately are not. Runner-up: the weights applied to the wrong groups. Both sit
    // inside the plausible range, unlike a raw total, which anyone would eliminate on sight.
    const { choices, correctIndex } = h.choices(num(correct, 1), [
      num((a1 + a2) / 2, 1),
      num(a1, 1),
      num(a2, 1),
      num((n2 * a1 + n1 * a2) / (n1 + n2), 1),
      num((a1 + a2) / (p + q), 1),
      num(correct + (a2 > a1 ? 1 : -1), 1),
    ]);
    return {
      stem: `A class of ${n1} students averaged ${a1} on a test and another class of ${n2} students averaged ${a2}. What is the combined average?`,
      choices, correctIndex,
      tags: ['statistics'],
      explanation: `Weight each average by its group size: (${n1} x ${a1} + ${n2} x ${a2}) / ${n1 + n2} = ${num(correct, 1)}. The plain average of ${a1} and ${a2} is ${num((a1 + a2) / 2, 1)} and is only correct when the two groups are the same size.`,
    };
  },
});
