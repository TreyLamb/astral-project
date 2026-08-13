// Pure PRNG + sampling helpers. No imports, no side effects.
//
// Deliberately a local copy of src/pages/theknowledgebase/engine/rng.js rather
// than an import: importing across sub-app boundaries couples TKB's release
// cadence to DLAB's, and the repo's established convention is to duplicate tiny
// pure helpers (uid() lives independently in every storage module). If the two
// ever need to diverge, they can.

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
 * @template T
 * @param {T[]} arr - must be non-empty
 * @param {() => number} rng
 * @returns {T}
 */
export function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
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

/**
 * @template T
 * @param {T[]} arr
 * @param {number} count
 * @param {() => number} rng
 * @returns {T[]} `count` distinct items (fewer if arr is shorter)
 */
export function sample(arr, count, rng) {
  return shuffle(arr, rng).slice(0, Math.min(count, arr.length));
}

/**
 * A 32-bit seed derived from a string, so a shared/typed seed code maps to a
 * language deterministically. FNV-1a.
 * @param {string} str
 * @returns {number}
 */
export function seedFromString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Human-shareable seed code. Excludes I/O/0/1 so it survives being read aloud
 * or retyped from a screenshot.
 * @param {() => number} rng
 * @returns {string} 6-character code
 */
export function makeSeedCode(rng) {
  let out = '';
  for (let i = 0; i < 6; i++) out += SEED_ALPHABET[Math.floor(rng() * SEED_ALPHABET.length)];
  return out;
}
