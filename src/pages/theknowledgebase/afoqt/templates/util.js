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
