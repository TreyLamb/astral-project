// Persistent audio cache for the neural TTS providers.
//
// WHY THIS EXISTS. Kokoro sounds excellent and is not fast: measured on a desktop CPU it takes
// roughly four seconds to synthesise seven seconds of speech, and a phone falls back to WASM
// wherever WebGPU is missing. Synthesising at the moment you want to hear something is therefore
// the one thing that cannot work. Everything about making this voice usable is about doing the
// work EARLIER - prefetching the next question while the current one is being answered, and
// never paying for the same sentence twice.
//
// Two layers, because they solve different problems:
//   - an in-memory LRU of decoded AudioBuffers, so replaying the question you just heard is
//     instant and costs no decode;
//   - IndexedDB holding 16-bit PCM, so the cache survives a reload and a drive. Int16 rather
//     than the Float32 the model emits: it halves the bytes for no audible difference at 24kHz,
//     and a 40-question drill is a lot of seconds of audio.
//
// Keyed on the exact text plus the provider and voice, NOT on a question id. The same option
// text turns up across templates, the miss pool replays questions verbatim, and the study plan
// walks the same words repeatedly - all of which become free hits.

const DB_NAME = 'astral-tts';
const STORE = 'clips';
const DB_VERSION = 1;
// Roughly 30 questions' worth of decoded audio. Past that the oldest goes; IndexedDB still has it.
const MEM_LIMIT = 40;

const mem = new Map(); // key -> AudioBuffer (insertion order = LRU order)

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    // Private browsing, a blocked origin, a full disk: all of these must degrade to "no cache",
    // never to "no audio".
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then((db) => new Promise((resolve) => {
    if (!db) return resolve(null);
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  }));
}

function idbPut(key, value) {
  return openDb().then((db) => new Promise((resolve) => {
    if (!db) return resolve(false);
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  }));
}

/** Stable, short, and collision-safe enough for a per-device audio cache. FNV-1a over the text,
 *  with the length appended so two different strings must also match in length to collide. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(36)}-${str.length}`;
}

export function cacheKey(provider, voice, text) {
  return `${provider}:${voice ?? 'default'}:${hash(text)}`;
}

const toInt16 = (f32) => {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = f32[i] < -1 ? -1 : f32[i] > 1 ? 1 : f32[i];
    out[i] = Math.round(s * 32767);
  }
  return out;
};

const toFloat32 = (i16) => {
  const out = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) out[i] = i16[i] / 32767;
  return out;
};

function remember(key, buffer) {
  mem.delete(key);
  mem.set(key, buffer);
  while (mem.size > MEM_LIMIT) mem.delete(mem.keys().next().value);
}

/**
 * An AudioBuffer for this clip if we already have one, else null.
 * @param {AudioContext} ctx  the buffer is built for this context's use
 */
export async function getClip(ctx, key) {
  const hit = mem.get(key);
  if (hit) {
    remember(key, hit); // refresh LRU position
    return hit;
  }
  const stored = await idbGet(key);
  if (!stored?.pcm) return null;
  const samples = toFloat32(stored.pcm);
  const buf = ctx.createBuffer(1, samples.length, stored.rate);
  buf.copyToChannel(samples, 0);
  remember(key, buf);
  return buf;
}

/** Store a freshly synthesised clip, in memory now and on disk when it lands. */
export async function putClip(ctx, key, float32, rate) {
  const buf = ctx.createBuffer(1, float32.length, rate);
  buf.copyToChannel(float32, 0);
  remember(key, buf);
  // Not awaited by callers: a slow or failed write must never delay playback.
  idbPut(key, { pcm: toInt16(float32), rate, at: Date.now() }).catch(() => {});
  return buf;
}

/** True if the clip is already available without synthesising. Used to report preparation
 *  progress honestly rather than showing a bar that jumps to 100% on a warm cache. */
export async function hasClip(key) {
  if (mem.has(key)) return true;
  const stored = await idbGet(key);
  return !!stored?.pcm;
}

/** Drop everything. Offered in the UI because a cache of neural audio can reach tens of
 *  megabytes and the user should be able to see the back of it. */
export async function clearClips() {
  mem.clear();
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
  } catch { /* nothing to clear */ }
}
