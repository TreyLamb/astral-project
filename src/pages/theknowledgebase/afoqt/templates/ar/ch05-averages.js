// Chapter 5 — Averages, totals and combined work.
//
// One idea carries the whole chapter: AN AVERAGE IS A DISGUISED TOTAL. The definition runs
// both ways, and the useful direction is the one nobody uses:
//
//     average = total / count        ->        total = average x count
//
// Recover the total and every question here becomes one subtraction. Skip that step and you
// are guessing, because averages do not combine by averaging: two groups of different sizes,
// two legs of different durations, and two workers of different speeds all weight their parts
// differently, and in every case the naive mean is a plausible wrong number sitting on the
// answer sheet.
//
// ✂️ MIXTURE and WORK-RATE appear in every commercial prep book and in NO official AFOQT
// material - not in the OATTS Arithmetic Reasoning module, not in the AFPC pamphlet's sample
// items. They are built here because their absence is not proof, but they are deliberately
// ranked last in the chapter and neither is a prerequisite for anything.

import { registerTemplate } from '../../engine/generator.js';
import { num, money, sweep } from '../util.js';
import { NAMES, twoNames, OATTS } from './words.js';

registerTemplate({
  id: 'ar-average-missing',
  subtest: 'AR',
  band: 2,
  name: 'The missing value behind an average',
  concepts: ['ar-average-missing-value'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const n = h.int(4, 6);
    // The known values are drawn first and the MISSING one is swept, which is the only ordering
    // that cannot fail. Drawing the average first and letting the remainder fall out produces a
    // negative missing value whenever the known values happen to run high - and a template that
    // bails and returns null is a template the audit counts as broken.
    const given = [];
    let spent = 0;
    for (let i = 0; i < n - 1; i++) {
      const v = h.int(9, 44);
      given.push(v);
      spent += v;
    }
    const correct = sweep(8, 45, h.int(8, 45), (cand) => {
      const t = spent + cand;
      if (t % n !== 0) return null;          // the stem quotes a whole-number average
      const a = t / n;
      return [cand, a, Math.round(spent / (n - 1)), t, spent, Math.abs(a - cand), t - spent + n];
    });
    const total = spent + correct;
    const avg = total / n;
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(avg), error: 'assumed-it-is-the-average', why: 'assumed the missing value equals the average' },
      { value: num(Math.round(spent / (n - 1))), error: 'averaged-the-known', why: 'averaged the values that were given' },
      { value: num(total), error: 'answered-with-the-total', why: 'gave the total of all the values' },
      { value: num(spent), error: 'answered-with-the-subtotal', why: 'gave the total of the known values' },
      { value: num(Math.abs(avg - (total - spent))), error: 'wrong-operation', why: 'subtracted the answer from the average' },
      { value: num(total - spent + n), error: 'off-by-the-count', why: 'added the number of values back in' },
    ]);
    return {
      stem: `The average of ${n} numbers is ${avg}. ${n - 1} of them are ${given.slice(0, -1).join(', ')} and ${given[given.length - 1]}. What is the remaining number?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      explanation: `Turn the average into a total first: ${avg} x ${n} = ${total}. The known values come to ${spent}, so the missing one is ${total} - ${spent} = ${correct}. There is no shortcut through the average itself - the missing value only equals ${avg} in the special case where everything else already averages ${avg}.`,
    };
  },
});

registerTemplate({
  id: 'ar-average-raise',
  subtest: 'AR',
  band: 3,
  name: 'The score needed to raise an average',
  concepts: ['ar-average-missing-value'],
  calibratedAgainst: 'barrons',
  generate: (rng, h) => {
    const n = h.int(3, 6);
    const now = h.int(68, 84);
    const target = sweep(now + 2, 95, now + h.int(2, 8), (cand) => {
      const g = cand - now;
      const need = now + (n + 1) * g;
      if (need > 100) return null;           // a score above 100 is not a question
      return [need, now + g, now + 2 * g, now + n * g, n * now + (n + 1) * g, now];
    });
    const correct = (n + 1) * target - n * now;
    const gap = target - now;
    // ⚠ Two traps caught here by the 8,000-sample audit, both invisible on inspection:
    //   - `2t - w` and `t + (t - w)` are the SAME expression. They read like two different
    //     mistakes and are one, so the slate silently came up a choice short.
    //   - `w + (n+1)(t - w)` expands to `(n+1)t - nw`, which IS the correct answer. It was
    //     sitting in the list labelled "over-corrected".
    // Every distractor below is now written as `now + <multiple of gap>` so that duplicates
    // and accidental identities are visible at a glance rather than hidden behind algebra.
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(now + gap), error: 'answered-with-the-target', why: 'gave the average being aimed at rather than the score needed' },
      { value: num(now + 2 * gap), error: 'used-one-test', why: 'balanced the new score against ONE previous test instead of all of them' },
      { value: num(now + n * gap), error: 'off-by-one-test', why: `spread the gap over ${n} tests instead of all ${n + 1}` },
      { value: num(n * now + (n + 1) * gap), error: 'wrong-subtotal', why: 'subtracted one test score instead of the total of all of them' },
      { value: num(now), error: 'no-change', why: 'assumed the current average already meets the target' },
    ]);
    return {
      stem: `After ${n} tests your average is ${now}. What must you score on the next test to bring your average up to ${target}?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      explanation: `Work in totals, never in averages. You currently hold ${n} x ${now} = ${n * now} points. To average ${target} over ${n + 1} tests you need ${n + 1} x ${target} = ${(n + 1) * target}. The difference is the score required: ${(n + 1) * target} - ${n * now} = ${correct}. The gap of ${target - now} points has to be made up on EVERY previous test as well as the new one, which is why the answer runs so far above ${target}.`,
    };
  },
});

registerTemplate({
  id: 'ar-weighted-groups',
  subtest: 'AR',
  band: 4,
  name: 'Combining two groups of different sizes',
  concepts: ['ar-weighted-groups'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    // Built BACKWARDS from the answer so the combined average is a whole number by
    // construction rather than by search. Take coprime weights p:q, sizes k*p and k*q, and put
    // the two section averages m*q below and m*p above the target c. Then
    //   n1(a1 - c) + n2(a2 - c) = kpq(-m) + kqp(m) = 0
    // so the combined average is exactly c, every time, with no rejection sampling and no
    // possibility of returning null. The sizes are unequal by construction too, which matters:
    // equal sections make the naive mean CORRECT and quietly destroy the item.
    const [p, q] = h.pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [3, 5], [1, 4], [4, 5]]);
    const m = h.int(2, 6);
    const c = h.int(72, 84);
    const k = h.int(3, 8);
    const n1 = k * p;
    const n2 = k * q;
    const a1 = c - q * m;
    const a2 = c + p * m;
    const correct = c;
    // Every distractor here is provably distinct from the answer and from each other for any
    // legal draw - the differences all reduce to non-zero multiples of m, p and q. See the
    // regression test, which asserts it across the whole parameter space rather than trusting
    // the algebra in this comment.
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num((a1 + a2) / 2), error: 'averaged-the-averages', why: 'took the mean of the two averages, ignoring that the groups are different sizes' },
      { value: num(a1), error: 'answered-with-a-group', why: 'gave the first section average' },
      { value: num(a2), error: 'answered-with-a-group', why: 'gave the second section average' },
      { value: num((n1 * a2 + n2 * a1) / (n1 + n2)), error: 'weighted-backwards', why: 'paired each average with the other section size' },
      { value: num(a1 + a2), error: 'added-the-averages', why: 'added the two averages' },
    ]);
    const bigger = n1 > n2 ? a1 : a2;
    return {
      stem: `One section of ${n1} students averaged ${a1} on an exam, and a second section of ${n2} students averaged ${a2}. What was the average for both sections combined?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      explanation: `Go back to totals: ${n1} x ${a1} = ${n1 * a1} points and ${n2} x ${a2} = ${n2 * a2} points, so ${n1 * a1 + n2 * a2} points across ${n1 + n2} students = ${num(correct)}. The mean of the averages, ${num((a1 + a2) / 2)}, is on the answer sheet and is wrong whenever the groups differ in size - the answer is pulled toward ${bigger}, because the bigger section has more students voting.`,
    };
  },
});

registerTemplate({
  id: 'ar-signed-net',
  subtest: 'AR',
  band: 3,
  name: 'A net total from wins and losses',
  concepts: ['ar-signed-net-total'],
  calibratedAgainst: 'oatts',
  provenance: OATTS,
  generate: (rng, h) => {
    const won = h.int(3, 9);
    const lost = h.int(2, 8);
    const deficit = h.int(3, 9);
    // The LEAD is swept, over a range wide enough that a clean value always exists. The first
    // build swept the deficit instead, across a range the "net must stay positive" reject cut
    // down to a single candidate - and when that one candidate collided, `sweep` fell back to
    // its start value and shipped an item whose net was zero, with two options reading "0".
    const lead = sweep(deficit + 1, 28, deficit + h.int(1, 10), (cand) => {
      const net = won * cand - lost * deficit;
      if (net <= 0) return null;
      return [net, won * cand + lost * deficit, won * cand, lost * deficit, cand - deficit,
        won * deficit - lost * cand];
    });
    const correct = won * lead - lost * deficit;
    const { choices, correctIndex, errors, whys } = h.choices(num(correct), [
      { value: num(won * lead + lost * deficit), error: 'added-the-losses', why: 'added the losing margins instead of subtracting them' },
      { value: num(won * lead), error: 'stopped-at-the-wins', why: 'counted only the points gained in the wins' },
      { value: num(lost * deficit), error: 'answered-with-the-losses', why: 'gave the points given away in the losses' },
      { value: num(lead - deficit), error: 'subtracted-the-averages', why: 'subtracted the two average margins and ignored the number of games' },
      { value: num(won * deficit - lost * lead), error: 'swapped-the-margins', why: 'attached each average margin to the wrong set of games' },
    ]);
    return {
      stem: `A team won ${won} games by an average of ${lead} points and lost ${lost} games by an average of ${deficit} points. Over all ${won + lost} games, how many more points did the team score than its opponents?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      explanation: `Each average carries a sign, and each applies to its own number of games: the wins contribute +${won} x ${lead} = ${won * lead} and the losses contribute -${lost} x ${deficit} = -${lost * deficit}. The net is ${won * lead} - ${lost * deficit} = ${correct}. Points conceded in a loss count AGAINST the total - adding them gives ${num(won * lead + lost * deficit)}, which would be the answer to "how many points separated the teams in total", a different question.`,
    };
  },
});

// ✂️ COMMERCIAL-ONLY ARCHETYPE. No official AFOQT material contains a mixture problem.
registerTemplate({
  id: 'ar-mixture',
  subtest: 'AR',
  band: 4,
  name: 'Blending two prices to a target',
  concepts: ['ar-mixture'],
  calibratedAgainst: 'trivium',
  generate: (rng, h) => {
    const cheap = h.int(3, 8);
    const gapLow = h.int(1, 4);
    const j = h.int(2, 9);
    // gapHigh === gapLow makes the blend symmetric, so "equal amounts of each" IS the answer
    // and the inverted-gaps distractor lands on it too. Swept rather than nudged, because the
    // rest of the slate also depends on the ratio between the two gaps.
    const gapHigh = sweep(1, 5, h.int(1, 5), (cand) => {
      if (cand === gapLow) return null;
      const known = gapLow * j;
      const c = (known * cand) / gapLow;
      return [c, (known * gapLow) / cand, known, known + c, Math.abs(cand + gapLow)];
    });
    const target = cheap + gapLow;
    const dear = target + gapHigh;
    const known = gapLow * j;                     // pounds of the dearer blend
    const correct = (known * gapHigh) / gapLow;
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} pounds`, [
      { value: `${num((known * gapLow) / gapHigh)} pounds`, error: 'inverted-the-gaps', why: 'paired each gap with the wrong side of the blend' },
      { value: `${num(known)} pounds`, error: 'matched-the-known', why: 'assumed equal amounts of each' },
      { value: `${num(known + correct)} pounds`, error: 'answered-with-the-blend', why: 'gave the weight of the finished blend' },
      { value: `${num(Math.round(known * (dear / target)))} pounds`, error: 'used-prices-not-gaps', why: 'scaled by the prices themselves rather than by their distances from the target' },
      { value: `${num(Math.abs(dear - cheap))} pounds`, error: 'answered-with-a-price-gap', why: 'reported a price difference as a weight' },
    ]);
    return {
      stem: `Coffee worth ${money(cheap)} a pound is mixed with ${known} pounds of coffee worth ${money(dear)} a pound. How many pounds of the cheaper coffee are needed to make a blend worth ${money(target)} a pound?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      explanation: `Work in distances from the target price. The dear coffee sits ${money(gapHigh)} ABOVE it and the cheap coffee sits ${money(gapLow)} BELOW it, and the blend balances when those pull equally: ${known} x ${gapHigh} = x x ${gapLow}, so x = ${num(correct)} pounds. Equivalently ${cheap}x + ${dear} x ${known} = ${target}(x + ${known}). The further a component is from the target, the LESS of it you need.`,
    };
  },
});

// ✂️ COMMERCIAL-ONLY ARCHETYPE. Combined work-rate is a prep-book staple and appears in no
// official AFOQT material.
// Filtered on BOTH conditions: the combined time must be a whole number, and the five options
// must be mutually distinct. [3, 6] passes the first and fails the second - the faster worker
// alone (3) and the difference of the two times (3) are the same number - and [2, 6] collides
// the mean with the difference at 4. Deriving the list rather than hand-checking it is what
// keeps a later addition to this table from quietly shipping a four-option question.
const WORK_PAIRS = [[6, 12], [4, 12], [3, 6], [10, 15], [20, 30], [2, 6], [8, 24], [5, 20],
  [12, 24], [15, 30], [9, 18], [6, 30], [4, 20], [10, 40], [7, 42], [12, 36]]
  .filter(([a, b]) => Number.isInteger((a * b) / (a + b)))
  .filter(([a, b]) => {
    const slate = [(a * b) / (a + b), (a + b) / 2, a + b, Math.min(a, b), Math.max(a, b), Math.abs(a - b)];
    return new Set(slate).size === slate.length;
  });

registerTemplate({
  id: 'ar-work-rate',
  subtest: 'AR',
  band: 4,
  name: 'Two workers on one job',
  concepts: ['ar-work-rate'],
  calibratedAgainst: 'trivium',
  stemSpace: WORK_PAIRS.length * 4,
  generate: (rng, h) => {
    const [ta, tb] = h.pick(WORK_PAIRS);
    const [a, b] = twoNames(h);
    const correct = (ta * tb) / (ta + tb);
    const { choices, correctIndex, errors, whys } = h.choices(`${num(correct)} hours`, [
      { value: `${num((ta + tb) / 2)} hours`, error: 'averaged-the-times', why: 'took the mean of the two times, which is slower than the faster worker alone' },
      { value: `${num(ta + tb)} hours`, error: 'added-the-times', why: 'added the times, as if they worked one after the other' },
      { value: `${num(Math.min(ta, tb))} hours`, error: 'answered-with-a-worker', why: 'gave the faster worker acting alone' },
      { value: `${num(Math.max(ta, tb))} hours`, error: 'answered-with-a-worker', why: 'gave the slower worker acting alone' },
      { value: `${num(Math.abs(ta - tb))} hours`, error: 'used-the-difference', why: 'subtracted the two times' },
    ]);
    return {
      stem: `Working alone, ${a} can complete a job in ${ta} hours and ${b} can complete the same job in ${tb} hours. Working together at those rates, how long does the job take?`,
      choices, correctIndex, errors, whys,
      tags: ['averages'],
      // ⚠ Keep this worked in FRACTIONS. Writing the combined rate as a decimal ran it through
      // num(), which rounds to two places: 1/10 + 1/40 printed as "0.13", and the next line
      // then claimed 1 / 0.13 = 8. The arithmetic on the page was simply wrong, and no
      // structural check looks at an explanation. The combined time is a whole number by
      // construction, so the reciprocal is exact and needs no rounding at all.
      explanation: `Add RATES, never times. ${a} does 1/${ta} of the job an hour and ${b} does 1/${tb}, so together they do 1/${ta} + 1/${tb} = 1/${correct} of the job per hour - and a rate of one ${correct}th per hour means the job takes ${correct} hours. The sanity check is free: two people must be FASTER than either one alone, so any answer of ${Math.min(ta, tb)} hours or more is wrong on sight, which kills three of the five options.`,
    };
  },
});

export { NAMES };
