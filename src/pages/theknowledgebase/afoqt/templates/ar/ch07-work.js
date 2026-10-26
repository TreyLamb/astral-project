// Chapter 5 (continued) - work, crews, machines and pipes.
//
// Added 2026-10-25 from Trey's debrief of the real AFOQT (taken 2026-09-23): "some questions related to work loads
// based on worker speeds and headcount". The bank had ONE generator for this, "two workers on one job" (about 64
// possible stems), and ch05-averages.js said work-rate "appears in NO official AFOQT material", an assumption his real
// test just disproved. He had prepared on the one shape the bank had and still missed the item, which is exactly what a
// single narrow generator does: it teaches one version of a family of problems that look different on the page.
//
// This is the FAMILY. Ten generators, each with several variants of who or what does the work (a named person, a
// crew, identical machines, a pump) and what is asked (a time, a count of workers, an amount produced, how much is
// left), so a long run on "work problems" is many different problems, not one problem with new numbers:
//
//   combined workers      three workers together; find the missing worker's solo time; "twice as fast as"
//   part of a job         one works alone first, then both finish; a fraction done, how long is left
//   headcount x time      more workers, fewer days; workers needed for a deadline; crew changes mid-job
//   output                machines producing units; scale machines and hours at once; two machines' output rates
//   fill and drain        a pipe fills while a drain empties
//
// Every answer is a small whole number (a pencil-and-paper item at 70 seconds), worked below in FRACTIONS and person-hours,
// never in rounded decimals (the 1/10 + 1/40 = 0.13 lesson in ch05-averages.js), and the numbers are SEARCHED for, not
// guessed, so no item ships with a fractional answer or two distractors that collide.

import { registerTemplate } from '../../engine/generator.js';
import { threeNames, twoNames } from './words.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const ints = (arr) => [...new Set(arr.filter((x) => Number.isInteger(x) && x > 0))];
const E = (value, error, why) => ({ value, error, why });
const pick = (h, a) => h.pick(a);

// Things a person, a crew or a machine does. `job` follows "can ..." and "to ...".
const JOBS = [
  'paint the warehouse', 'stock the shelves', 'sort the mail', 'assemble the displays', 'pack the shipment',
  'tile the lobby', 'mow the field', 'load the cargo', 'address the envelopes', 'inspect the parts',
];
const CREW = ['workers', 'mechanics', 'technicians', 'volunteers', 'painters', 'loaders'];
const PRODUCTS = ['widgets', 'brackets', 'circuit boards', 'fasteners', 'filters', 'seals', 'panels'];
const VESSEL = ['tank', 'pool', 'reservoir', 'water barrel'];

// -------------------------------------------------------------------------------------------------------
// Number tables, built once by search so every entry is a clean whole-number problem.
const PAIRS = []; // [a, b, together] with a < b, together = a*b/(a+b) a whole number
for (let a = 2; a <= 30; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (a + b) === 0 && b !== 2 * a) PAIRS.push([a, b, (a * b) / (a + b)]);
const TRIPLES = []; // [a, b, c, together] three distinct solo times, together a whole number
for (let a = 2; a <= 24; a++) for (let b = a + 1; b <= 30; b++) for (let c = b + 1; c <= 36; c++) {
  const L = lcm(lcm(a, b), c);
  const s = L / a + L / b + L / c;
  if (L % s === 0 && L / s >= 1) TRIPLES.push([a, b, c, L / s]);
}

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-three',
  subtest: 'AR',
  band: 4,
  name: 'Three workers on one job',
  concepts: ['ar-work-rate'],
  generate: (rng, h) => {
    const [a, b, c, T] = h.pick(TRIPLES);
    const [n1, n2, n3] = threeNames(h);
    const unit = pick(h, ['hours', 'days']);
    const { choices, correctIndex, errors, whys } = h.choices(`${T} ${unit}`, [
      E(`${a + b + c} ${unit}`, 'added-the-times', 'added the three times, as if they worked one after another'),
      ...(Number.isInteger((a + b + c) / 3) ? [E(`${(a + b + c) / 3} ${unit}`, 'averaged-the-times', 'took the mean of the three times')] : []),
      E(`${a} ${unit}`, 'answered-with-a-worker', 'gave the fastest worker acting alone'),
      E(`${c} ${unit}`, 'answered-with-a-worker', 'gave the slowest worker acting alone'),
      ...(Number.isInteger(T + 1) ? [E(`${T + 1} ${unit}`, 'off-by-one', 'was close but did not finish the arithmetic')] : []),
      E(`${b} ${unit}`, 'answered-with-a-worker', 'gave the middle worker acting alone'),
    ]);
    const L = lcm(lcm(a, b), c);
    return {
      stem: pick(h, [
        `Working alone, ${n1} can finish a job in ${a} ${unit}, ${n2} in ${b} ${unit} and ${n3} in ${c} ${unit}. Working together at those rates, how long does the job take?`,
        `${n1}, ${n2} and ${n3} can each do the same job alone in ${a}, ${b} and ${c} ${unit}. If all three work on it together, how long will it take?`,
      ]),
      choices, correctIndex, errors, whys, tags: ['averages'],
      variant: 'three-workers',
      explanation: `Add RATES. In one ${unit.slice(0, -1)} they do 1/${a} + 1/${b} + 1/${c} of the job. Over a common denominator of ${L}: ${L / a}/${L} + ${L / b}/${L} + ${L / c}/${L} = ${L / a + L / b + L / c}/${L}, which is 1/${T} of the job per ${unit.slice(0, -1)}. So the whole job takes ${T} ${unit}. Three people working together must be faster than the fastest alone (${a}).`,
    };
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-find-alone',
  subtest: 'AR',
  band: 4,
  name: 'Find one worker\'s solo time from the pair\'s time',
  concepts: ['ar-work-rate'],
  generate: (rng, h) => {
    const [a, b, T] = h.pick(PAIRS);
    const [n1, n2] = twoNames(h);
    const askFirst = h.int(0, 1) === 1; // which worker is the unknown
    const known = askFirst ? b : a, want = askFirst ? a : b;
    const [nk, nw] = askFirst ? [n2, n1] : [n1, n2];
    const unit = pick(h, ['hours', 'days']);
    const { choices, correctIndex, errors, whys } = h.choices(`${want} ${unit}`, [
      E(`${known - T} ${unit}`, 'subtracted-the-times', 'subtracted the two times instead of the two rates'),
      E(`${known + T} ${unit}`, 'added-the-times', 'added the times'),
      E(`${known} ${unit}`, 'repeated-the-given', 'gave the time already stated for the other worker'),
      E(`${T} ${unit}`, 'answered-with-the-pair', 'gave the time for both working together'),
      ...(Number.isInteger(known * 2 - T) && known * 2 - T > 0 ? [E(`${known * 2 - T} ${unit}`, 'doubled-then-subtracted', 'doubled the known time and subtracted')] : []),
    ].filter((d) => d.value !== `${want} ${unit}`));
    const L = lcm(known, T);
    return {
      stem: pick(h, [
        `${n1} and ${n2} together can finish a job in ${T} ${unit}. ${nk} alone could do it in ${known} ${unit}. How long would ${nw} take alone?`,
        `Working together, two crews finish a job in ${T} ${unit}. The first crew alone needs ${known} ${unit}. How many ${unit} would the second crew need alone?`,
      ]),
      choices, correctIndex, errors, whys, tags: ['averages'],
      variant: `find-alone:${askFirst ? 'first' : 'second'}`,
      explanation: `Subtract RATES. Together they do 1/${T} of the job per ${unit.slice(0, -1)}; the known worker does 1/${known}. The other does 1/${T} − 1/${known} = ${L / T}/${L} − ${L / known}/${L} = ${L / T - L / known}/${L} = 1/${want}. So the unknown worker takes ${want} ${unit}. Check: 1/${known} + 1/${want} = 1/${T}.`,
    };
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-relative-speed',
  subtest: 'AR',
  band: 4,
  name: 'One machine is a multiple as fast as the other',
  concepts: ['ar-work-rate'],
  generate: (rng, h) => {
    const k = h.pick([2, 3, 4]);
    const T = k * h.int(1, 4) + 0; // together-time, a multiple of k so the faster machine's solo time is whole
    const fast = (T * (k + 1)) / k, slow = T * (k + 1);
    const askFast = h.int(0, 1) === 1;
    const want = askFast ? fast : slow;
    const MULT = { 2: 'twice', 3: 'three times', 4: 'four times' };
    const unit = pick(h, ['hours', 'days']);
    const [thing, thingB] = pick(h, [['Machine A', 'Machine B'], ['Pump A', 'Pump B'], ['Press A', 'Press B'], ['Crew A', 'Crew B']]);
    const { choices, correctIndex, errors, whys } = h.choices(`${want} ${unit}`, [
      E(`${askFast ? slow : fast} ${unit}`, 'answered-for-the-other', 'solved correctly but gave the other machine\'s time'),
      E(`${T * k} ${unit}`, 'multiplied-by-the-factor', `multiplied the together-time by ${k}`),
      ...(T % k === 0 ? [E(`${T / k} ${unit}`, 'divided-by-the-factor', `divided the together-time by ${k}`)] : []),
      E(`${T * 2} ${unit}`, 'doubled', 'doubled the together-time'),
      E(`${T + k} ${unit}`, 'added-the-factor', 'added the factor to the time'),
      E(`${T} ${unit}`, 'answered-with-the-pair', 'gave the time with both running'),
    ].filter((d) => d.value !== `${want} ${unit}`));
    return {
      stem: `${thing} works ${MULT[k]} as fast as ${thingB}. Running together they finish a job in ${T} ${unit}. How long would ${askFast ? thing : thingB} take to finish the job alone?`,
      choices, correctIndex, errors, whys, tags: ['averages'],
      variant: `relative-speed:x${k}:${askFast ? 'faster' : 'slower'}`,
      explanation: `Let ${thingB} do 1 share of the work per ${unit.slice(0, -1)}; then ${thing} does ${k} shares, and together they do ${k + 1} shares. The job takes ${T} ${unit} at ${k + 1} shares per ${unit.slice(0, -1)}, so the whole job is ${T * (k + 1)} shares. ${thingB} alone: ${T * (k + 1)} ÷ 1 = ${slow} ${unit}. ${thing} alone: ${T * (k + 1)} ÷ ${k} = ${fast} ${unit}. Asked for ${askFast ? thing : thingB}: ${want} ${unit}.`,
    };
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-partial',
  subtest: 'AR',
  band: 4,
  name: 'One works alone first, then the other joins',
  concepts: ['ar-work-rate'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const [a, b] = h.pick(PAIRS);
      const k = h.int(1, a - 1);
      if (((a - k) * b) % (a + b) !== 0) continue;
      const left = ((a - k) * b) / (a + b);
      if (left < 1 || left > 30) continue;
      const [n1, n2] = twoNames(h);
      const unit = pick(h, ['hours', 'days']);
      const together = (a * b) / (a + b);
      const wrong = [
        E(`${together} ${unit}`, 'ignored-the-head-start', 'solved the whole job as if both had worked from the start'),
        E(`${a - k} ${unit}`, 'used-the-solo-time-left', `took what is left of ${n1}'s solo time, ignoring that ${n2} helps`),
        E(`${k + left} ${unit}`, 'counted-the-head-start', 'added the head start to the time still needed'),
        E(`${b - k} ${unit}`, 'subtracted-from-the-wrong-time', `subtracted the head start from ${n2}'s time`),
        E(`${a} ${unit}`, 'answered-with-a-worker', `gave ${n1}'s solo time`),
      ].filter((d) => d.value !== `${left} ${unit}`);
      const { choices, correctIndex, errors, whys } = h.choices(`${left} ${unit}`, wrong);
      return {
        stem: `${n1} can finish a job alone in ${a} ${unit} and ${n2} can finish it alone in ${b} ${unit}. ${n1} works alone for ${k} ${k === 1 ? unit.slice(0, -1) : unit}, and then ${n2} joins and they finish together. How many more ${unit} does it take, once ${n2} joins?`,
        choices, correctIndex, errors, whys, tags: ['averages'],
        variant: 'partial:head-start',
        explanation: `In ${k} ${unit}, ${n1} does ${k}/${a} of the job, so ${a - k}/${a} is left. Together they do 1/${a} + 1/${b} = ${a + b}/${a * b} of the job per ${unit.slice(0, -1)}. Time = (work left) ÷ (rate) = (${a - k}/${a}) ÷ (${a + b}/${a * b}) = ${(a - k) * b}/${a + b} = ${left} ${unit}.`,
      };
    }
    throw new Error('ar-work-partial: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-remaining',
  subtest: 'AR',
  band: 3,
  name: 'A fraction of the job is done: how long is left',
  concepts: ['ar-work-rate'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 300; tries++) {
      const [f, g] = h.pick([[1, 3], [2, 5], [3, 4], [3, 5], [2, 3], [5, 8], [1, 4], [3, 8], [4, 5], [1, 5], [3, 7]]);
      const d = f * h.int(1, 6);
      const rest = (d * (g - f)) / f;
      if (!Number.isInteger(rest) || rest < 1 || rest > 40 || rest === d) continue;
      const total = (d * g) / f;
      const who = pick(h, [`A crew of ${h.int(3, 9)} ${pick(h, CREW)}`, 'A road crew', 'A maintenance team', 'A printing shop']);
      const unit = pick(h, ['days', 'hours']);
      const wrongSet = [
        E(`${total} ${unit}`, 'gave-the-total-time', 'gave the time for the whole job, not what remains'),
        E(`${d} ${unit}`, 'repeated-the-given', 'repeated the time already spent'),
        ...ints([(d * f) / (g - f)]).map((v) => E(`${v} ${unit}`, 'inverted-the-fraction', 'turned the fraction upside down')),
        ...ints([(d * (g - f)) / g]).map((v) => E(`${v} ${unit}`, 'used-the-wrong-whole', 'took the remaining fraction of the time already spent')),
        E(`${rest + d} ${unit}`, 'added-the-given', 'added the time already spent to the time left'),
        E(`${rest * 2} ${unit}`, 'doubled', 'doubled the answer'),
        E(`${g - f} ${unit}`, 'used-the-numerators', 'subtracted the two parts of the fraction and called it the time'),
      ].filter((x) => x.value !== `${rest} ${unit}`);
      if (new Set(wrongSet.map((x) => x.value)).size < 5 || rest < 2) continue;
      const { choices, correctIndex, errors, whys } = h.choices(`${rest} ${unit}`, wrongSet);
      return {
        stem: `${who} completes ${f}/${g} of a project in ${d} ${unit}. At the same rate, how many more ${unit} will it take to finish the project?`,
        choices, correctIndex, errors, whys, tags: ['averages'],
        variant: `remaining:${f}/${g}`,
        explanation: `${f}/${g} of the job takes ${d} ${unit}, so each ${1}/${g} of it takes ${d / f} ${unit}. What is left is ${g - f}/${g}, which is ${g - f} of those parts: ${g - f} × ${d / f} = ${rest} ${unit}. (The whole job takes ${total} ${unit}; ${total} − ${d} = ${rest}.)`,
      };
    }
    throw new Error('ar-work-remaining: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-headcount',
  subtest: 'AR',
  band: 3,
  name: 'More workers, fewer days',
  concepts: ['ar-work-headcount', 'ar-inverse-rate'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const n1 = h.int(3, 12), d1 = h.int(4, 20);
      const W = n1 * d1;
      const n2 = h.int(2, 24);
      if (n2 === n1 || W % n2 !== 0) continue;
      const d2 = W / n2;
      if (d2 < 2 || d2 > 40) continue;
      const kind = pick(h, ['days', 'workers', 'extra']);
      const crew = pick(h, CREW), job = pick(h, JOBS);
      let correct, ask, wrong, expl;
      if (kind === 'days') {
        correct = d2;
        ask = `how many days would ${n2} ${crew} take to ${job}, working at the same rate?`;
        wrong = ints([Math.round((d1 * n2) / n1), d1 - (n2 - n1), d1 + (n2 - n1), n2 * d1, d1, W]);
        expl = `The job is a fixed amount of work: ${n1} workers × ${d1} days = ${W} worker-days. With ${n2} workers: ${W} ÷ ${n2} = ${d2} days. More workers means FEWER days, so the answer is ${n2 > n1 ? 'smaller' : 'larger'} than ${d1}.`;
      } else if (kind === 'workers') {
        correct = n2;
        ask = `how many ${crew} are needed to finish it in ${d2} days, at the same rate?`;
        wrong = ints([Math.round((n1 * d2) / d1), n1 + (d1 - d2), n1 - (d1 - d2), d1 * d2, W, n1]);
        expl = `The job is ${n1} × ${d1} = ${W} worker-days. To finish in ${d2} days you need ${W} ÷ ${d2} = ${n2} workers.`;
      } else {
        correct = Math.abs(n2 - n1);
        ask = `how many ${n2 > n1 ? 'more' : 'fewer'} ${crew} would it take to ${job} in ${d2} days instead?`;
        wrong = ints([n2, n1, Math.abs(d1 - d2), Math.round((n1 * d2) / d1), n1 + n2]);
        expl = `The job is ${W} worker-days. In ${d2} days you need ${W} ÷ ${d2} = ${n2} workers. That is ${Math.abs(n2 - n1)} ${n2 > n1 ? 'more' : 'fewer'} than ${n1}. The question asks for the DIFFERENCE, not the new crew size.`;
      }
      const slate = wrong.filter((x) => x !== correct);
      if (slate.length < 4) continue;
      const { choices, correctIndex } = h.choices(String(correct), slate.map(String));
      return {
        stem: `${n1} ${crew} can ${job} in ${d1} days. At the same rate, ${ask}`,
        choices, correctIndex, tags: ['averages'],
        variant: `headcount:${kind}:${n2 > n1 ? 'more' : 'fewer'}`,
        explanation: expl,
      };
    }
    throw new Error('ar-work-headcount: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-join-leave',
  subtest: 'AR',
  band: 4,
  name: 'The crew changes size partway through the job',
  concepts: ['ar-work-headcount'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 600; tries++) {
      const n = h.int(4, 12), d = h.int(6, 20), x = h.int(2, d - 2);
      const joins = h.int(0, 1) === 1;
      const m = h.int(1, 4);
      const n2 = joins ? n + m : n - m;
      if (n2 < 2) continue;
      const R = n * (d - x); // worker-days still to do
      if (R % n2 !== 0) continue;
      const left = R / n2;
      if (left < 2 || left > 30 || left === d - x) continue;
      const crew = pick(h, CREW), job = pick(h, JOBS);
      const wrong = ints([d - x, (n * d) / n2 - x, Math.round((n * d) / n2), joins ? Math.round(R / (n - m)) : Math.round(R / (n + m)), left + x, d]);
      const slate = wrong.filter((v) => v !== left);
      if (slate.length < 4) continue;
      const { choices, correctIndex } = h.choices(String(left), slate.map(String));
      return {
        stem: `A crew of ${n} ${crew} can ${job} in ${d} days. After ${x} days, ${m} ${m === 1 ? crew.slice(0, -1) : crew} ${joins ? 'join the crew' : 'leave'}. If the rest work at the same rate, how many more days will the job take?`,
        choices, correctIndex, tags: ['averages'],
        variant: `join-leave:${joins ? 'join' : 'leave'}`,
        explanation: `The whole job is ${n} × ${d} = ${n * d} worker-days. After ${x} days, ${n} × ${x} = ${n * x} worker-days are done, leaving ${n * d - n * x}. The crew is now ${n2}: ${n * d - n * x} ÷ ${n2} = ${left} days. The original "${d - x} days left" is what it would have been if nobody had ${joins ? 'joined' : 'left'}.`,
      };
    }
    throw new Error('ar-work-join-leave: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-output-scale',
  subtest: 'AR',
  band: 3,
  name: 'Machines, hours and units produced',
  concepts: ['ar-work-headcount'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 500; tries++) {
      const m1 = h.int(2, 8), t1 = h.int(2, 9), r = h.int(2, 15);
      const u = m1 * t1 * r;
      const m2 = h.int(2, 12), t2 = h.int(2, 12);
      if (m2 === m1 || t2 === t1) continue;
      const answer = r * m2 * t2;
      if (answer > 2500) continue;
      const wrong = ints([(u * m2) / m1, (u * t2) / t1, u + (m2 - m1) * r, u + (t2 - t1) * r, u * m2 * t2, answer + r, (u / m1) * m2 + t2]);
      const slate = wrong.filter((v) => v !== answer);
      if (slate.length < 4) continue;
      const prod = pick(h, PRODUCTS), mach = pick(h, ['machines', 'presses', 'looms', 'assembly stations']);
      const { choices, correctIndex } = h.choices(String(answer), slate.map(String));
      return {
        stem: `${m1} identical ${mach} produce ${u} ${prod} in ${t1} hours. At the same rate, how many ${prod} would ${m2} of these ${mach} produce in ${t2} hours?`,
        choices, correctIndex, tags: ['averages'],
        variant: `output-scale:${m2 > m1 ? 'more' : 'fewer'}-machines:${t2 > t1 ? 'longer' : 'shorter'}`,
        explanation: `Find the output of ONE machine in ONE hour: ${u} ÷ (${m1} × ${t1}) = ${r}. Then ${m2} machines for ${t2} hours: ${r} × ${m2} × ${t2} = ${answer}. Scaling only the machines, or only the hours, gives a wrong answer because BOTH changed.`,
      };
    }
    throw new Error('ar-work-output-scale: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-work-output-rates',
  subtest: 'AR',
  band: 3,
  name: 'Two machines with different output rates',
  concepts: ['ar-work-output'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 400; tries++) {
      const ra = h.int(10, 60), rb = h.int(10, 60);
      if (ra === rb) continue;
      const hours = h.int(2, 9);
      const N = (ra + rb) * hours;
      if (N > 1500) continue;
      const kind = pick(h, ['time', 'made', 'time-alone']);
      const prod = pick(h, PRODUCTS);
      const unit = pick(h, ['hour']);
      let correct, ask, wrong, expl;
      if (kind === 'time') {
        correct = hours;
        ask = `Working together, how many hours do they need to make ${N} ${prod}?`;
        wrong = ints([N / ra, N / rb, N / ((ra + rb) / 2), N / (ra * rb), hours + 1, hours - 1]);
        expl = `Their rates ADD: ${ra} + ${rb} = ${ra + rb} ${prod} per hour together. Time = ${N} ÷ ${ra + rb} = ${hours} hours. Using one machine's rate alone (${N} ÷ ${ra} or ${N} ÷ ${rb}) answers a different question.`;
      } else if (kind === 'made') {
        correct = N;
        ask = `Working together, how many ${prod} do they make in ${hours} hours?`;
        wrong = ints([ra * hours, rb * hours, ((ra + rb) / 2) * hours, ra + rb + hours, (ra + rb) * (hours - 1), (ra + rb) * (hours + 1)]);
        expl = `Together they make ${ra} + ${rb} = ${ra + rb} per hour. In ${hours} hours: ${ra + rb} × ${hours} = ${N}. Using only one machine's output, or averaging the two rates, undercounts.`;
      } else {
        correct = N / ra;
        if (!Number.isInteger(correct)) continue;
        ask = `Machine A works alone to make ${N} ${prod}. How many hours does it need?`;
        wrong = ints([hours, N / rb, N / (ra + rb), N - ra, N / (ra * 2)]);
        expl = `Machine A alone makes ${ra} per hour, so ${N} ÷ ${ra} = ${correct} hours. The ${hours} hours is how long BOTH machines would need.`;
      }
      const slate = wrong.filter((v) => v !== correct);
      if (slate.length < 4) continue;
      const { choices, correctIndex } = h.choices(String(correct), slate.map(String));
      return {
        stem: `Machine A makes ${ra} ${prod} per ${unit} and Machine B makes ${rb} ${prod} per ${unit}. ${ask}`,
        choices, correctIndex, tags: ['averages'],
        variant: `output-rates:${kind}`,
        explanation: expl,
      };
    }
    throw new Error('ar-work-output-rates: no clean slate');
  },
});

// -------------------------------------------------------------------------------------------------------
registerTemplate({
  id: 'ar-fill-drain',
  subtest: 'AR',
  band: 4,
  name: 'A pipe fills while a drain empties',
  concepts: ['ar-fill-drain'],
  generate: (rng, h) => {
    for (let tries = 0; tries < 600; tries++) {
      const variant = pick(h, ['fill-drain', 'fill-drain', 'two-fill-drain', 'two-fill']);
      const vessel = pick(h, VESSEL);
      if (variant === 'fill-drain') {
        const a = h.int(2, 12), b = h.int(a + 1, 40);
        if ((a * b) % (b - a) !== 0) continue;
        const T = (a * b) / (b - a);
        if (T > 60) continue;
        const wrong = ints([a * b / (a + b), b - a, a + b, T + a, (a + b) / 2, b]);
        const slate = wrong.filter((v) => v !== T);
        if (slate.length < 4) continue;
        const { choices, correctIndex } = h.choices(String(T), slate.map(String));
        return {
          stem: `A pipe can fill a ${vessel} in ${a} hours. A drain can empty the full ${vessel} in ${b} hours. If the ${vessel} starts empty and both are open, how many hours does it take to fill?`,
          choices, correctIndex, tags: ['averages'],
          variant: 'fill-drain:one-each',
          explanation: `The pipe adds 1/${a} of the ${vessel} per hour and the drain removes 1/${b}, so the NET rate is 1/${a} − 1/${b} = ${b - a}/${a * b}. Time = ${a * b}/${b - a} = ${T} hours. Adding the rates (1/${a} + 1/${b} = ${a + b}/${a * b}) treats the drain as a second filler.`,
        };
      }
      if (variant === 'two-fill-drain') {
        const a = h.int(2, 12), b = h.int(a, 20), c = h.int(2, 60);
        const L = lcm(lcm(a, b), c);
        const net = L / a + L / b - L / c;
        if (net <= 0 || L % net !== 0) continue;
        const T = L / net;
        if (T > 40) continue;
        const wrong = ints([T + 1, a + b - c, (a * b) / (a + b), Math.round((a * b) / (a + b)) + c, Math.max(a, b), c]);
        const slate = wrong.filter((v) => v !== T);
        if (slate.length < 4) continue;
        const { choices, correctIndex } = h.choices(String(T), slate.map(String));
        return {
          stem: `Two pipes can fill a ${vessel} in ${a} hours and ${b} hours. A drain at the bottom can empty it in ${c} hours. With both pipes and the drain open, how many hours does it take to fill the empty ${vessel}?`,
          choices, correctIndex, tags: ['averages'],
          variant: 'fill-drain:two-fillers-one-drain',
          explanation: `Net rate = 1/${a} + 1/${b} − 1/${c}. Over a common denominator of ${L}: ${L / a}/${L} + ${L / b}/${L} − ${L / c}/${L} = ${net}/${L}. Time = ${L}/${net} = ${T} hours.`,
        };
      }
      // two pipes fill: the same as two workers, in a tank costume
      const [a, b, T] = h.pick(PAIRS);
      const wrong = ints([(a + b) / 2, a + b, a, b, Math.abs(b - a), T + 1]);
      const slate = wrong.filter((v) => v !== T);
      if (slate.length < 4) continue;
      const { choices, correctIndex } = h.choices(String(T), slate.map(String));
      return {
        stem: `One pipe can fill an empty ${vessel} in ${a} hours and another can fill it in ${b} hours. With both pipes open, how many hours does it take to fill the ${vessel}?`,
        choices, correctIndex, tags: ['averages'],
        variant: 'fill-drain:two-fillers',
        explanation: `Add the rates: 1/${a} + 1/${b} = ${a + b}/${a * b} of the ${vessel} per hour. Time = ${a * b}/${a + b} = ${T} hours.`,
      };
    }
    throw new Error('ar-fill-drain: no clean slate');
  },
});
