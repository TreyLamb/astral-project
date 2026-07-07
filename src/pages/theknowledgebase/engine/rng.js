// Pure PRNG + sampling helpers. No imports, no side effects.

/**
 * mulberry32 — deterministic PRNG. Same seed => same sequence forever.
 * @param {number} seed - 32-bit integer seed
 * @returns {() => number} function returning a float in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 * @returns {number} integer in [min, max] inclusive
 */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Fisher-Yates shuffle. Does not mutate input.
 * @template T
 * @param {T[]} arr
 * @param {() => number} rng
 * @returns {T[]} new shuffled array
 */
export function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Never let a weight <= 0 (or NaN/undefined-ish) produce a divide-by-zero or
// NaN key — clamp to a tiny epsilon so the item is just extremely unlikely,
// never a crash.
const WEIGHT_EPSILON = 1e-9;

/**
 * Weighted sampling without replacement, Efraimidis-Spirakis algorithm:
 * each item gets key = rng() ** (1/weight); take the top `count` keys.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => number} weightFn
 * @param {number} count
 * @param {() => number} rng
 * @returns {T[]} up to `count` items, no duplicates
 */
export function weightedSampleWithoutReplacement(items, weightFn, count, rng) {
  if (count <= 0 || items.length === 0) return [];
  const keyed = items.map((item) => {
    let w = weightFn(item);
    if (!(w > 0) || !Number.isFinite(w)) w = WEIGHT_EPSILON;
    const key = Math.pow(rng(), 1 / w);
    return { item, key };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map((k) => k.item);
}
