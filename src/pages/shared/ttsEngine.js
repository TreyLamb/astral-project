// Provider-agnostic text-to-speech adapter. Shared: DLAB's listening drill and AFOQT's
// read-aloud both run on it. (It began as `dlab/engine/voice.js`; moved 2026-09-04 when AFOQT
// needed the same three providers rather than reaching into another sub-app's folder.)
//
// Three engines share one API so the rest of the app never branches on which
// voice is active. Piper and Kokoro are multi-megabyte WASM models, so they
// are loaded with a dynamic import() INSIDE the function that needs them —
// never at module scope — so selecting Web Speech (the default) never pulls
// either bundle over the wire.
//
// audioScript.js emits ordered segments, each with its own rate/pitch/volume,
// because a stress item is only answerable if one syllable is audibly louder,
// slower and higher than its neighbours. speakSegments() is what turns that
// segment list into gapless audio, per provider.
//
// ── QUALITY IS THE REASON THE NEURAL PROVIDERS EXIST ─────────────────────────────────────
// Web Speech quality is whatever the device happens to ship, and on a phone that is often an
// old compact voice that sounds mechanical however carefully it is driven. Piper and Kokoro
// synthesise real audio from a neural model, which is a different class of output, not a
// tuning of the same one. Trey, 2026-09-04, on the built-in voice: "truly terrible quality".
//
// One thing NOT to assert here: routing. Web Speech output does not go through Web Audio, so
// there is no `setSinkId()` and nothing a page can do to steer it — which led to an
// assumption that it therefore cannot reach a car over Bluetooth. Trey checked, and on his
// phone it does. Whatever the platform does with that stream, it is not ours to control and
// not something this file should claim to know. The neural path returns real audio and goes
// through Web Audio, so it routes like music does; that much is true regardless.

export const PROVIDERS = [
  { id: 'webspeech', label: 'Web Speech', note: 'Built into the browser. Zero download, and whatever quality the device happens to ship.' },
  { id: 'piper', label: 'Piper', note: 'VITS neural voice via ONNX/WASM. ~75MB, cached after first use. Fast enough for a phone.' },
  { id: 'kokoro', label: 'Kokoro', note: 'Kokoro-82M via transformers.js. Best quality, heaviest download and the slowest to synthesise.' },
];

const DEFAULTS = { rate: 0.95, pitch: 1.0, volume: 1.0 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const clampRate = (v) => clamp(v ?? DEFAULTS.rate, 0.5, 2);
const clampPitch = (v) => clamp(v ?? DEFAULTS.pitch, 0, 2);
const clampVolume = (v) => clamp(v ?? DEFAULTS.volume, 0, 1);

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let fallbackReason = null;
export function lastFallbackReason() {
  return fallbackReason;
}

// Model handles, cached per "provider:voiceName" so a second speak() with the
// same voice does not re-download or re-init the runtime.
const modelCache = new Map();

// Everything currently in flight, so stop() can reach it regardless of which
// provider started it.
let activeToken = 0;
let activeWatchdogs = [];
let activeAudioCtx = null;
let activeAudioSources = [];

function clearWatchdogs() {
  activeWatchdogs.forEach(clearTimeout);
  activeWatchdogs = [];
}

// The one AudioContext the neural providers play through, created inside a user gesture.
//
// AN AUDIOCONTEXT CREATED OUTSIDE A GESTURE STARTS SUSPENDED AND NEVER PLAYS. Synthesis is
// asynchronous and can take seconds, so a context constructed at the point of playback is
// always outside the gesture that asked for the speech - on iOS that is silent audio with no
// error anywhere. Priming one on the click that turns voice on, and reusing it, is what makes
// the neural path work on a phone at all. Reusing it also stops the per-utterance
// create/close churn, which browsers cap.
let sharedCtx = null;

export function primeAudio() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') sharedCtx = new Ctor();
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function stopActiveAudio() {
  activeAudioSources.forEach((src) => {
    try { src.stop(); } catch { /* already stopped */ }
    try { src.disconnect(); } catch { /* already disconnected */ }
  });
  activeAudioSources = [];
  // Never close the primed context - it is the one thing here that cannot be recreated outside
  // a user gesture. Only a context this module made for itself gets torn down.
  if (activeAudioCtx && activeAudioCtx !== sharedCtx) {
    activeAudioCtx.close().catch(() => {});
  }
  activeAudioCtx = null;
}

// Every in-flight loop (Web Speech segment-by-segment, or the buffer scheduler)
// checks its captured token against this one before doing anything further, so
// bumping it here is what makes stop() reach a provider it didn't start.
export function stop() {
  activeToken += 1;
  clearWatchdogs();
  stopActiveAudio();
  if (synth) synth.cancel();
}

export function isSpeaking() {
  if (synth?.speaking) return true;
  // A finished source stays in the list until the next stop(); `playbackState`
  // is not portable, so treat a live context with scheduled sources as speaking.
  return activeAudioSources.length > 0 && activeAudioCtx?.state === 'running';
}

export function isSupported(providerId) {
  if (providerId === 'webspeech') return !!synth;
  // Piper/Kokoro need WASM at minimum; actual availability is only known once
  // the dynamic import resolves, so this is best-effort.
  return typeof WebAssembly !== 'undefined';
}

// Chrome returns [] from getVoices() on the very first call and only fills the
// list in asynchronously via 'voiceschanged' — sometimes never, if the page
// never touches audio again. A short timeout fallback means listVoices()
// still resolves (possibly empty) instead of hanging forever.
function webSpeechVoices() {
  if (!synth) return Promise.resolve([]);
  const existing = synth.getVoices();
  if (existing.length) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let done = false;
    const finish = (voices) => {
      if (done) return;
      done = true;
      synth.removeEventListener('voiceschanged', onChange);
      clearTimeout(timer);
      resolve(voices);
    };
    const onChange = () => finish(synth.getVoices());
    synth.addEventListener('voiceschanged', onChange);
    const timer = setTimeout(() => finish(synth.getVoices()), 1000);
  });
}

async function listWebSpeechVoices() {
  const voices = await webSpeechVoices();
  return voices.map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang }));
}

async function loadPiper() {
  const key = 'piper';
  if (modelCache.has(key)) return modelCache.get(key);
  const mod = await import('@mintplex-labs/piper-tts-web');
  modelCache.set(key, mod);
  return mod;
}

async function loadKokoro() {
  const key = 'kokoro';
  if (modelCache.has(key)) return modelCache.get(key);
  const mod = await import('kokoro-js');
  modelCache.set(key, mod);
  return mod;
}

// Verified against the packages' own docs rather than guessed:
//   piper:  tts.predict({ text, voiceId }) -> Blob;  tts.voices() -> [{ key, ... }]
//   kokoro: KokoroTTS.from_pretrained(MODEL_ID, { dtype, device })
//           tts.generate(text, { voice }) -> RawAudio
// Both need an explicit default voice — calling either with an undefined voice
// throws, which would silently degrade every request to the browser voice and
// make the provider picker a lie.
const PIPER_DEFAULT_VOICE = 'en_US-hfc_female-medium';
const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const KOKORO_DEFAULT_VOICE = 'af_heart';

async function listPiperVoices() {
  const mod = await loadPiper();
  const voices = await mod.voices();
  return voices.map((v) => ({
    id: v.key ?? v.id ?? v.name,
    name: v.name ?? v.key,
    lang: v.language?.code ?? v.lang ?? '',
  }));
}

async function listKokoroVoices() {
  const tts = await kokoroModel(KOKORO_DEFAULT_VOICE);
  // The voice table lives on the loaded instance, not on the module.
  const table = typeof tts.list_voices === 'function' ? tts.list_voices() : tts.voices;
  if (!table) return [{ id: KOKORO_DEFAULT_VOICE, name: KOKORO_DEFAULT_VOICE, lang: 'en' }];
  const entries = Array.isArray(table) ? table.map((v) => [v, null]) : Object.entries(table);
  return entries.map(([id, meta]) => ({
    id,
    name: meta?.name ?? id,
    lang: meta?.language ?? 'en',
  }));
}

export async function listVoices(providerId) {
  try {
    if (providerId === 'piper') return await listPiperVoices();
    if (providerId === 'kokoro') return await listKokoroVoices();
    return await listWebSpeechVoices();
  } catch {
    fallbackReason = providerLabel(providerId) + ' voice list could not load — used the browser voice instead.';
    return listWebSpeechVoices();
  }
}

function providerLabel(id) {
  return PROVIDERS.find((p) => p.id === id)?.label ?? id;
}

function pickWebSpeechVoice(voices, voiceName) {
  return voices.find((v) => v.name === voiceName)
    ?? voices.find((v) => v.default && v.lang?.startsWith('en'))
    ?? voices.find((v) => v.lang?.startsWith('en'))
    ?? voices[0]
    ?? null;
}

// Speaks one Web Speech segment, resolving on completion. A watchdog covers a
// real Chrome bug where a long utterance's onend simply never fires, which
// would otherwise hang the whole sequence forever; the timeout is scaled to
// text length so short segments aren't cut short and long ones don't stall.
function speakWebSpeechSegment(seg, token, voices, voiceName) {
  return new Promise((resolve) => {
    if (token !== activeToken) return resolve();
    if (!seg.text?.trim()) return resolve();

    const utter = new SpeechSynthesisUtterance(seg.text);
    const voice = pickWebSpeechVoice(voices, voiceName);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    utter.rate = clampRate(seg.rate);
    utter.pitch = clampPitch(seg.pitch);
    utter.volume = clampVolume(seg.volume);

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      resolve();
    };
    utter.onend = finish;
    utter.onerror = finish;

    const watchdog = setTimeout(finish, 4000 + seg.text.length * 200);
    activeWatchdogs.push(watchdog);

    synth.speak(utter);
  });
}

async function speakWebSpeechSegments(segments, opts) {
  if (!synth) return;
  synth.cancel();
  const token = activeToken;
  const voices = await webSpeechVoices();
  for (const [i, seg] of segments.entries()) {
    if (token !== activeToken) return;
    if (opts.signal?.aborted) return;
    if (opts.onSegment) opts.onSegment(i);
    await speakWebSpeechSegment(seg, token, voices, opts.voiceName);
  }
}

/**
 * Synthesizes EVERY segment first, then schedules them all.
 *
 * WHY in two passes rather than one loop: synthesis is slow and variable. If
 * each buffer is scheduled as soon as it is synthesized, the start time computed
 * for segment 2 can already be in the past by the time segment 2 finishes
 * synthesizing — Web Audio then plays it immediately and it overlaps segment 1.
 * The overlap is worst on exactly the short syllable-sized segments a stress
 * item is made of. Synthesizing up front costs a moment of silence before the
 * word and buys playback that is actually gapless.
 */
async function synthAndPlayBuffers(synthesizeSegment, segments, opts) {
  const ctx = primeAudio();
  if (!ctx) throw new Error('no AudioContext');
  // A context primed several minutes ago can have been suspended by the browser since (tab
  // backgrounded, phone locked). Resuming is cheap and a no-op when it is already running.
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  activeAudioCtx = ctx;
  const token = activeToken;

  const buffers = [];
  for (const [i, seg] of segments.entries()) {
    if (token !== activeToken || opts.signal?.aborted) return;
    const audioBuffer = await synthesizeSegment(ctx, seg, opts);
    if (!audioBuffer) return;
    buffers.push({ seg, audioBuffer, index: i });
  }

  if (token !== activeToken || opts.signal?.aborted) return;

  let when = ctx.currentTime + 0.05;
  for (const { seg, audioBuffer, index } of buffers) {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    // Neither Piper nor Kokoro exposes prosody on its synthesis call, so rate is
    // applied at playback. playbackRate moves pitch with it — a slower syllable
    // also sounds lower, the opposite of the pitch cue Web Speech can give — so
    // for these two providers loudness carries the stress and duration supports
    // it. Web Speech remains the provider that can do all three cues, which is
    // why it is the default for a drill built around hearing stress.
    source.playbackRate.value = clampRate(seg.rate);
    const gain = ctx.createGain();
    gain.gain.value = clampVolume(seg.volume);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(when);
    // Keeps `isSpeaking()` honest now that the context is long-lived and never leaves the
    // 'running' state on its own.
    source.onended = () => { activeAudioSources = activeAudioSources.filter((s) => s !== source); };
    activeAudioSources.push(source);
    // Everything is scheduled up front (see the note above), so "which segment is playing" is a
    // clock question rather than an event one. The caller uses it to highlight the option
    // currently being read.
    if (opts.onSegment) {
      const at = setTimeout(() => {
        if (token === activeToken) opts.onSegment(index);
      }, Math.max(0, (when - ctx.currentTime) * 1000));
      activeWatchdogs.push(at);
    }
    when += audioBuffer.duration / source.playbackRate.value;
  }

  const remaining = Math.max(0, when - ctx.currentTime) * 1000;
  await new Promise((resolve) => {
    const watchdog = setTimeout(resolve, remaining + 200);
    activeWatchdogs.push(watchdog);
  });
}

async function decodeToBuffer(ctx, source) {
  // Kokoro hands back a RawAudio; the raw Float32 samples are the most reliable
  // path since they need no container parsing at all.
  if (source?.audio instanceof Float32Array) {
    const buf = ctx.createBuffer(1, source.audio.length, source.sampling_rate || 24000);
    buf.copyToChannel(source.audio, 0);
    return buf;
  }
  const arrayBuffer = source instanceof Blob ? await source.arrayBuffer() : source;
  // decodeAudioData detaches the buffer it is given, so hand it a copy.
  return ctx.decodeAudioData(arrayBuffer.slice(0));
}

async function synthesizePiperSegment(ctx, seg, opts) {
  const mod = await loadPiper();
  const wav = await mod.predict({
    text: seg.text,
    voiceId: opts.voiceName || PIPER_DEFAULT_VOICE,
  });
  return decodeToBuffer(ctx, wav);
}

// The model, not a per-utterance handle, is what is expensive to load — cached
// once per voice and reused for every segment and every later call.
async function kokoroModel(voiceName) {
  const cacheKey = `kokoro:${voiceName || KOKORO_DEFAULT_VOICE}`;
  let tts = modelCache.get(cacheKey);
  if (!tts) {
    const mod = await loadKokoro();
    const TTS = mod.KokoroTTS ?? mod.default;
    tts = await TTS.from_pretrained(KOKORO_MODEL_ID, {
      dtype: 'q8',
      // WebGPU is several times faster where it exists, and this model is big
      // enough that the difference is the difference between usable and not.
      device: typeof navigator !== 'undefined' && navigator.gpu ? 'webgpu' : 'wasm',
    });
    modelCache.set(cacheKey, tts);
  }
  return tts;
}

async function synthesizeKokoroSegment(ctx, seg, opts) {
  const tts = await kokoroModel(opts.voiceName);
  const audio = await tts.generate(seg.text, { voice: opts.voiceName || KOKORO_DEFAULT_VOICE });
  return decodeToBuffer(ctx, audio);
}

async function speakWithProvider(providerId, segments, opts) {
  if (providerId === 'piper') {
    await synthAndPlayBuffers(synthesizePiperSegment, segments, opts);
    return;
  }
  if (providerId === 'kokoro') {
    await synthAndPlayBuffers(synthesizeKokoroSegment, segments, opts);
    return;
  }
  await speakWebSpeechSegments(segments, opts);
}

function normalizeSegments(segments) {
  return segments.map((seg) => ({
    text: seg.text,
    rate: clampRate(seg.rate),
    pitch: clampPitch(seg.pitch),
    volume: clampVolume(seg.volume),
  }));
}

/**
 * Speaks an ordered list of segments back to back, each honoring its own
 * rate/pitch/volume — how a stressed syllable is made audible. Resolves when
 * the last segment finishes, or immediately if `opts.signal` aborts mid-way.
 * @param {{text: string, rate?: number, pitch?: number, volume?: number}[]} segments
 * @param {{provider?: string, voiceName?: string, signal?: AbortSignal,
 *          onSegment?: (index: number) => void}} [opts]
 *   `onSegment` fires as each segment starts, so a caller can show where the voice has got to.
 * @returns {Promise<void>}
 */
export async function speakSegments(segments, opts = {}) {
  stop();
  activeToken += 1;
  const token = activeToken;
  fallbackReason = null;

  if (!segments?.length) return;
  const normalized = normalizeSegments(segments);

  const signal = opts.signal;
  const onAbort = () => stop();
  signal?.addEventListener('abort', onAbort);

  const chain = [opts.provider || 'webspeech', 'webspeech'];
  const tried = new Set();

  try {
    for (const providerId of chain) {
      if (tried.has(providerId)) continue;
      tried.add(providerId);
      if (token !== activeToken) return;
      try {
        await speakWithProvider(providerId, normalized, { ...opts, signal });
        return;
      } catch {
        if (providerId !== 'webspeech') {
          fallbackReason = `${providerLabel(providerId)} could not load — used the browser voice instead.`;
          continue;
        }
        // Web Speech itself failed (or is unsupported) — nothing left to fall
        // back to. Resolve silently per the "never throw at the call site"
        // contract.
        return;
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Speaks a single piece of text as one segment. Convenience wrapper around
 * speakSegments() for callers that don't need per-syllable prosody.
 * @param {string} text
 * @param {{provider?: string, voiceName?: string, rate?: number, pitch?: number, volume?: number, signal?: AbortSignal}} [opts]
 * @returns {Promise<void>}
 */
export async function speak(text, opts = {}) {
  return speakSegments([{ text, rate: opts.rate, pitch: opts.pitch, volume: opts.volume }], opts);
}

/**
 * Download and initialise a neural model without speaking anything.
 *
 * Worth having its own entry point because the alternative is discovering the download on the
 * first question - and the case this was built for is studying in a car, where "75MB over
 * cellular, starting now" is exactly the wrong moment. Resolves once the model is cached and
 * the next speak() is instant; rejects if the model cannot be loaded, so a caller can say so
 * rather than silently falling back to the browser voice forever.
 *
 * @param {string} providerId
 * @param {string} [voiceName]
 * @returns {Promise<void>}
 */
export async function preload(providerId, voiceName) {
  if (providerId === 'piper') { await loadPiper(); return; }
  if (providerId === 'kokoro') { await kokoroModel(voiceName); return; }
  await webSpeechVoices();
}
