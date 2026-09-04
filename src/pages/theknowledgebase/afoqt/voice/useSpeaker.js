import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PROVIDERS, speakSegments, stop as stopSpeech, listVoices, preload, primeAudio,
  lastFallbackReason, prepare, readyCount, clearClips,
} from '../../../shared/ttsEngine';

// Text-to-speech for a question, over the shared three-provider engine
// (`src/pages/shared/ttsEngine.js`). This file owns the AFOQT-specific parts: which voice is
// worth defaulting to, and reporting which option is being read so the UI can follow along.
//
// ── WHY THIS DELEGATES INSTEAD OF DRIVING `speechSynthesis` ITSELF ────────────────────────
// The first version called the browser API directly, and Trey's verdict on a phone was "truly
// terrible quality... it sounds like a haunted house, scary, evil robot voice". Two separate
// causes, and only the second is about the voice itself:
//
//  1. THE KEEPALIVE WAS MANGLING THE AUDIO. To dodge Chrome's ~15-second cutoff, the first
//     version called `pause()` then `resume()` every 9 seconds while speaking. On desktop
//     Chrome that is the accepted workaround. On a phone it is not: several mobile TTS engines
//     RESTART the current utterance on `resume()` rather than continuing it, so a long question
//     became overlapping, half-repeated speech — which is what "haunted house" describes. IT IS
//     GONE. The shared engine uses a per-segment watchdog instead (a timeout scaled to the text
//     length, resolving the segment if `onend` never fires), which costs nothing when nothing is
//     wrong. Short segments were always the real defence against the cutoff anyway.
//  2. WEB SPEECH QUALITY IS WHATEVER THE DEVICE SHIPS, and on a phone that is often a compact
//     voice from a decade ago. No amount of rate/pitch tuning fixes that, because it is not a
//     tuning problem. Piper and Kokoro synthesise from a neural model and are a different class
//     of output; that is what the provider picker is for.

export { PROVIDERS };

/**
 * Rank the installed Web Speech voices, best first.
 *
 * Quality is not discoverable from the API — there is no quality field — so this ranks on the
 * naming conventions the platforms actually use. Windows ships both the old SAPI voices (David,
 * Zira: robotic) and the newer neural ones (Aria, Guy, Jenny, marked "Natural"/"Online");
 * Chrome adds the Google network voices; Android exposes a handful of varying age.
 *
 * This only ever picks the least-bad option from a fixed list. It cannot make a device that
 * ships one 2013 voice sound like anything else — which is the whole reason the neural
 * providers exist alongside it.
 */
export function rankVoices(voices) {
  const score = (v) => {
    const n = `${v.name} ${v.id ?? ''}`.toLowerCase();
    let s = 0;
    if (/natural|neural/.test(n)) s += 60;
    if (/google/.test(n)) s += 45;
    if (/\b(aria|guy|jenny|ava|andrew|emma|brian)\b/.test(n)) s += 25;
    if (/premium|enhanced|siri/.test(n)) s += 30;
    if (/^en[-_]us/i.test(v.lang)) s += 20;
    else if (/^en[-_]gb/i.test(v.lang)) s += 14;
    else if (/^en/i.test(v.lang)) s += 8;
    // On every desktop, and the reason people assume TTS still sounds like 2005.
    if (/\b(david|zira|mark|hazel|microsoft sam)\b/.test(n)) s -= 25;
    if (/compact|eloquence|espeak/.test(n)) s -= 20;
    return s;
  };
  return [...voices].filter((v) => !v.lang || /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a));
}

/**
 * @param {{ rate?: number, voiceURI?: string|null, provider?: string }} opts
 */
export default function useSpeaker({ rate = 1, voiceURI = null, provider = 'webspeech' } = {}) {
  const [speaking, setSpeaking] = useState(false);
  const [segment, setSegment] = useState(null);
  // Speaking, but nothing has come out yet - i.e. the model is still synthesising. Its own flag
  // rather than something derived, because unexplained silence is the failure mode that makes a
  // slow voice feel broken rather than slow.
  const [preparing, setPreparing] = useState(false);
  // Stored WITH the provider it belongs to, so switching provider invalidates the list by
  // derivation rather than by a setState inside an effect.
  const [resolved, setResolved] = useState({ provider: null, voices: [] });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const abort = useRef(null);
  const runId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listVoices(provider).then((v) => {
      if (!cancelled) setResolved({ provider, voices: Array.isArray(v) ? v : [] });
    });
    return () => { cancelled = true; };
  }, [provider]);

  const voices = useMemo(() => {
    if (resolved.provider !== provider) return [];
    return provider === 'webspeech' ? rankVoices(resolved.voices) : resolved.voices;
  }, [resolved, provider]);

  // `af_heart` is Kokoro's own default and the one Trey picked out of three by ear, so it is
  // what an unset preference resolves to rather than whatever the voice table happens to list
  // first. Only a default - any voice in the list still wins once chosen.
  const voice = useMemo(() => {
    if (voiceURI) {
      const exact = voices.find((v) => v.id === voiceURI);
      if (exact) return exact;
    }
    if (provider === 'kokoro') {
      const heart = voices.find((v) => v.id === 'af_heart');
      if (heart) return heart;
    }
    return voices[0] ?? null;
  }, [voices, voiceURI, provider]);

  const cancel = useCallback(() => {
    runId.current += 1;
    abort.current?.abort();
    abort.current = null;
    stopSpeech();
    setSpeaking(false);
    setPreparing(false);
    setSegment(null);
  }, []);

  /**
   * Speak a list of segments. Replaces anything already queued.
   * @param {{ kind: string, text: string, index?: number }[]} list
   * @param {() => void} [done]
   */
  const speak = useCallback((list, done) => {
    const segments = (list ?? []).filter((x) => x && x.text && x.text.trim());
    cancel();
    if (!segments.length) return;
    runId.current += 1;
    const id = runId.current;
    const controller = new AbortController();
    abort.current = controller;
    setSpeaking(true);
    setPreparing(provider !== 'webspeech');

    speakSegments(segments.map((s) => ({ text: s.text, rate })), {
      provider,
      voiceName: voice?.name ?? voice?.id,
      signal: controller.signal,
      // The engine indexes its own array; only an OPTION has a position worth showing. A
      // passage line carries an index too, and reporting that would light up option C while
      // line 3 of a reading passage was being read.
      onSegment: (i) => {
        if (id !== runId.current) return;
        // First segment out means synthesis is behind us and audio is actually playing.
        setPreparing(false);
        const seg = segments[i];
        setSegment(seg?.kind === 'option' ? seg.index : null);
      },
    }).finally(() => {
      if (id !== runId.current) return;
      setSpeaking(false);
      setPreparing(false);
      setSegment(null);
      // The engine falls back to the browser voice when a neural model cannot load, which is the
      // right behaviour and the wrong silence: you would pick Piper, hear the device voice, and
      // conclude Piper sounds terrible. Surfaced instead.
      const why = lastFallbackReason();
      if (why) setLoadError(why);
      if (done) done();
    });
  }, [cancel, provider, rate, voice]);

  /**
   * Unlock audio from inside a click. Harmless to call repeatedly, and it MUST come from a real
   * user gesture or nothing below it works:
   *  - browsers refuse `speechSynthesis.speak()` before a gesture, and on iOS the first
   *    utterance has to originate inside a handler;
   *  - an AudioContext built outside a gesture starts suspended and never plays, which is how
   *    the neural providers fail silently on a phone.
   */
  const prime = useCallback(() => {
    primeAudio();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  }, []);

  /** Download a neural model up front. The case this exists for is studying in a car, where
   *  meeting a 75MB download on the first question is the wrong moment to meet it. */
  const download = useCallback(async () => {
    if (provider === 'webspeech') return;
    setLoading(true);
    setLoadError(null);
    try {
      await preload(provider, voice?.id);
    } catch {
      const label = PROVIDERS.find((p) => p.id === provider)?.label ?? provider;
      setLoadError(`${label} could not load. The browser voice is still available.`);
    } finally {
      setLoading(false);
    }
  }, [provider, voice]);

  /**
   * Synthesise segments into the cache without playing them.
   *
   * The load-bearing half of making Kokoro usable. It is roughly 0.5x real time on a desktop
   * CPU, so synthesising when you press play cannot work - but synthesising the NEXT question
   * while the current one is on screen costs nothing you notice, and a cache hit afterwards is
   * a memcpy. Never awaited by anything on the playback path.
   */
  const warm = useCallback((segmentLists) => {
    if (provider === 'webspeech') return;
    const flat = (segmentLists ?? []).flat().filter((s) => s?.text?.trim());
    if (!flat.length) return;
    prepare(flat.map((s) => ({ text: s.text })), {
      provider,
      voiceName: voice?.name ?? voice?.id,
    }).catch(() => {});
  }, [provider, voice]);

  /** Walk a whole queue up front, with progress. The car case: do this on wi-fi, then drive. */
  const prepareAll = useCallback(async (segmentLists, onProgress) => {
    if (provider === 'webspeech') return { done: 0, total: 0, failed: 0 };
    const flat = (segmentLists ?? []).flat().filter((s) => s?.text?.trim());
    setLoading(true);
    setLoadError(null);
    try {
      return await prepare(flat.map((s) => ({ text: s.text })), {
        provider,
        voiceName: voice?.name ?? voice?.id,
        onProgress,
      });
    } finally {
      setLoading(false);
    }
  }, [provider, voice]);

  const ready = useCallback(
    (segmentLists) => readyCount((segmentLists ?? []).flat(), {
      provider,
      voiceName: voice?.name ?? voice?.id,
    }),
    [provider, voice],
  );

  useEffect(() => cancel, [cancel]);

  return {
    speak,
    cancel,
    prime,
    download,
    warm,
    prepareAll,
    ready,
    clearCache: clearClips,
    loading,
    loadError,
    speaking,
    preparing,
    segment,
    voices,
    voice,
    provider,
    supported: typeof window !== 'undefined'
      && ('speechSynthesis' in window || 'AudioContext' in window),
  };
}
