// Shared math helpers for Math Knowledge templates.
//
// These exist so a template can express an ERROR MODE directly ("added the numerators and
// the denominators") instead of hand-rolling arithmetic each time. Every fraction returned
// is REDUCED, which matters more than it looks: `h.choices()` dedupes distractors by
// string, so two unreduced forms of the same value (4/6 and 2/3) would slip through as two
// correct answers. Reducing everything makes string-equality and value-equality the same
// test.

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/** Reduced fraction with a printable form. Sign always rides on the numerator. */
export function frac(n, d) {
  if (d === 0) return { n: 0, d: 1, s: 'undefined' };
  const sign = d < 0 ? -1 : 1;
  n *= sign; d *= sign;
  const g = gcd(n, d);
  n /= g; d /= g;
  return { n, d, s: d === 1 ? String(n) : `${n}/${d}` };
}

/** Mixed-number form, which is how several answer keys print improper fractions. */
export function mixed(n, d) {
  const f = frac(n, d);
  if (f.d === 1 || Math.abs(f.n) < f.d) return f.s;
  const whole = Math.trunc(f.n / f.d);
  const rem = Math.abs(f.n % f.d);
  return `${whole} ${rem}/${f.d}`;
}

/** Round to at most `places` decimals and drop trailing zeros: 12.50 -> "12.5". */
export function num(x, places = 2) {
  const r = Math.round(x * 10 ** places) / 10 ** places;
  return String(r);
}

export const money = (x) => `$${(Math.round(x * 100) / 100).toFixed(2)}`;

/** Signed term for building expressions: 3 -> "+ 3", -3 -> "- 3". */
export const signed = (x) => (x < 0 ? `- ${Math.abs(x)}` : `+ ${x}`);

/** `x + 3`, `x - 3`, `x` — the factored-binomial form used all over chapters 6 and 7. */
export const binom = (v, c) => (c === 0 ? v : `${v} ${signed(c)}`);

/** Coefficient prefix: 1 -> "", -1 -> "-", 5 -> "5". */
export const coef = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));

/** `4x^2`, `x`, `-3` — one polynomial term, blank when the coefficient is 0. */
export function term(c, v, p) {
  if (c === 0) return '';
  if (p === 0) return String(c);
  return `${coef(c)}${v}${p === 1 ? '' : `^${p}`}`;
}

/** Assemble `ax^2 + bx + c`, skipping zero terms and fixing the leading sign. */
export function poly(coeffs, v = 'x') {
  const deg = coeffs.length - 1;
  let out = '';
  coeffs.forEach((c, i) => {
    const p = deg - i;
    if (c === 0) return;
    const t = term(Math.abs(c), v, p);
    if (!out) out = (c < 0 ? '-' : '') + t;
    else out += ` ${c < 0 ? '-' : '+'} ${t}`;
  });
  return out || '0';
}

/** Largest perfect square dividing n — the whole job of simplifying a radical. */
export function largestSquareFactor(n) {
  let best = 1;
  for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) best = k * k;
  return best;
}

/** `6√2`, `√7`, `12` */
export function radical(outside, inside) {
  if (inside === 1) return String(outside);
  if (outside === 1) return `√${inside}`;
  return `${outside}√${inside}`;
}

/**
 * Find a parameter value whose whole answer slate is free of collisions.
 *
 * Some items are built almost entirely out of the numbers already on the page - angles in a
 * triangle, the faces of a box - so two different error-modes land on the same value far more
 * often than they look like they would, and sometimes on the ANSWER. Guarding one collision
 * at a time does not work: the repair re-breaks a different pair. Sweeping the whole legal
 * range for a value where every option differs does.
 *
 * Sweeps from `start` and wraps, so the choice stays random rather than always the low end.
 * `slateFor(candidate)` returns every value that will appear as a choice (correct answer
 * included), or null to reject the candidate outright.
 *
 * @returns {number} the first clean value, or `start` if the range has none
 */
export function sweep(lo, hi, start, slateFor) {
  const span = hi - lo + 1;
  for (let i = 0; i < span; i++) {
    const cand = lo + ((start - lo + i) % span);
    const slate = slateFor(cand);
    if (slate && new Set(slate).size === slate.length) return cand;
  }
  return start;
}

/**
 * A "find the missing value from a mean" item - numbers AND the standard distractor slate,
 * shared by AR ch05 (ar-average-missing) and MK ch13 (mk-mean-missing-value). Same skill, same
 * skeleton, so both now draw the same pencil-and-paper-sized numbers with the same named error
 * modes, rather than two independently tuned versions of one item.
 *
 * MK's version used to draw known values up to 95, pick the mean SEPARATELY, and "fix" a
 * collision (missing value equal to the mean, or to the average of the knowns) by nudging a
 * known value up - which only ever pushes the missing value further negative, never toward a
 * legal one, since a higher known sum makes `total - sum` smaller. Reported failure: mean 32
 * across 89, 62, 38, 15 - an unflagged negative missing value of -44, well past what a rights-
 * only, no-calculator test at 30-45s a question can be worked in. (MK is actually the tighter
 * clock of the two: 22 min / 25 questions = 52.8s; AR is 29 min / 25 = 69.6s.)
 *
 * Every number here - known values, the missing value, the mean, the total - is drawn from or
 * built out of the same small range, so the whole item is one addition, one multiplication and
 * one subtraction: nothing past two digits, and the missing value is always positive by
 * construction (the known values and the swept missing value share one range, so the total can
 * never fall short of it).
 */
export function meanMissingValue(h, { lo = 9, hi = 44, count } = {}) {
  const n = count ?? h.int(4, 6);
  const known = [];
  let spent = 0;
  for (let i = 0; i < n - 1; i++) {
    const v = h.int(lo, hi);
    known.push(v);
    spent += v;
  }
  const avgKnown = Math.round(spent / (n - 1));
  const correct = sweep(lo, hi + 1, h.int(lo, hi + 1), (cand) => {
    const t = spent + cand;
    if (t % n !== 0) return null;               // the stem quotes a whole-number mean
    const mean = t / n;
    return [cand, mean, avgKnown, t, spent, Math.abs(mean - cand), t - spent + n];
  });
  const total = spent + correct;
  const mean = total / n;
  return {
    count: n, known, correct, total, mean, spent,
    distractors: [
      { value: mean, error: 'assumed-it-is-the-average', why: 'assumed the missing value equals the average' },
      { value: avgKnown, error: 'averaged-the-known', why: 'averaged the values that were given' },
      { value: total, error: 'answered-with-the-total', why: 'gave the total of all the values' },
      { value: spent, error: 'answered-with-the-subtotal', why: 'gave the total of the known values' },
      { value: Math.abs(mean - correct), error: 'wrong-operation', why: 'subtracted the answer from the average' },
      { value: total - spent + n, error: 'off-by-the-count', why: 'added the number of values back in' },
    ],
  };
}

export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

/** n! — only ever called with small n here (permutations/combinations). */
export function fact(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export const nPr = (n, r) => fact(n) / fact(n - r);
export const nCr = (n, r) => fact(n) / (fact(r) * fact(n - r));

/** The 3-4-5 family, so Pythagorean items land on whole numbers like real test items do. */
export const TRIPLES = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29],
  [9, 40, 41], [12, 35, 37], [11, 60, 61], [28, 45, 53], [33, 56, 65],
];

/**
 * Pick a triple and a legal integer scale factor, capping the LARGEST resulting side (the
 * hypotenuse) at `maxSide` - so a template scaling a Pythagorean triple can never produce
 * numbers past what a no-calculator, ~50s-a-question subtest can work in.
 *
 * TRIPLES' own primitives already reach 61 and 65 (11-60-61, 33-56-65), so scaling ANY of them
 * by even a small, uniformly-drawn factor can explode past what is quick to compute OR to
 * recognise - the reported failure was 33-56-65 scaled by 4: a hypotenuse of 260 and a leg of
 * 132, neither of which is fast arithmetic even though the triple itself is exact.
 *
 * The cap is per-triple, not a filter: a primitive that already exceeds `maxSide` on its own
 * (11-60-61, 28-45-53, 33-56-65) still gets drawn, just always at k=1 - you cannot shrink a
 * primitive triple, only decline to scale it up further.
 */
export function scaledTriple(h, { triples = TRIPLES, maxSide = 75, maxK = 5 } = {}) {
  const [a0, b0, c0] = h.pick(triples);
  const legalMax = Math.max(1, Math.min(maxK, Math.floor(maxSide / c0)));
  const k = h.int(1, legalMax);
  return { a: a0 * k, b: b0 * k, c: c0 * k, k, a0, b0, c0 };
}

/** π as a symbolic coefficient: 25π, π, 0. Keeps answers exact rather than decimal. */
export function pi(k) {
  if (k === 0) return '0';
  if (k === 1) return 'π';
  return `${k}π`;
}

/** Same, for a fractional coefficient (arcs and sectors). */
export function piFrac(n, d) {
  const f = frac(n, d);
  if (f.n === 0) return '0';
  if (f.d === 1) return pi(f.n);
  if (f.n === 1) return `π/${f.d}`;
  if (f.n === -1) return `-π/${f.d}`;
  return `${f.n}π/${f.d}`;
}
