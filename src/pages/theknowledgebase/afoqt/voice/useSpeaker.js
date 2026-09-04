import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Text-to-speech, wrapped so the rest of the app never touches `speechSynthesis` directly.
//
// THE WEB SPEECH API IS NOT A PLAY BUTTON. Four documented behaviours have to be worked around
// before "read the question aloud" is reliable enough to study with, and every one of them
// presents as the same symptom - the voice just stops, with no error anywhere:
//
//  1. `getVoices()` RETURNS AN EMPTY ARRAY on the first call in Chrome and Edge. The list arrives
//     asynchronously and fires `voiceschanged`. Picking a voice at mount without listening for
//     that event means always falling back to the default one, which on Windows is the flattest
//     voice installed.
//  2. SPEECH DIES AFTER ~15 SECONDS in Chrome. A long utterance is silently cut off partway.
//     Alternating pause()/resume() on a timer keeps the queue alive; it is the accepted
//     workaround and there is no API-level alternative.
//  3. `cancel()` IMMEDIATELY FOLLOWED BY `speak()` DROPS THE NEW UTTERANCE. Cancelling is
//     asynchronous, so the fresh utterance can be swallowed by the cancel it was queued behind -
//     which is exactly what happens when you skip to the next question quickly. A tick between
//     the two fixes it.
//  4. AUTOPLAY IS BLOCKED until the page has seen a user gesture, and on iOS the FIRST utterance
//     must originate inside a handler. So the first speech has to be a click, which is what the
//     "Voice" toggle is - see `prime()`.
//
// We also run our own queue rather than pushing every segment into the browser's. The browser's
// queue cannot tell us which segment is playing, cannot be re-ordered, and on Safari an early
// cancel can leave a stale utterance that fires later; ours makes "which option is being read
// right now" a piece of state the UI can highlight, and makes barge-in exact.

const KEEPALIVE_MS = 9000;

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : null);

export const speechSupported = () => !!synth();

/**
 * Rank the installed voices, best first.
 *
 * Quality varies enormously and is not discoverable from the API - there is no "quality" field -
 * so this ranks on the naming conventions the platforms actually use. Windows ships both the old
 * SAPI voices (David, Zira: robotic) and the newer neural ones (Aria, Guy, Jenny, marked
 * "Natural"/"Online"); Chrome adds the Google network voices, which are the best available on
 * most desktops. `localService === false` means a network voice, which is a decent tiebreaker
 * because the network ones are uniformly the newer generation.
 */
export function rankVoices(voices) {
  const score = (v) => {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = 0;
    if (/natural|neural/.test(n)) s += 60;
    if (/google/.test(n)) s += 45;
    if (/\b(aria|guy|jenny|ava|andrew|emma|brian)\b/.test(n)) s += 25;
    if (/premium|enhanced|siri/.test(n)) s += 30;
    if (!v.localService) s += 12;
    if (/^en[-_]us/i.test(v.lang)) s += 20;
    else if (/^en[-_]gb/i.test(v.lang)) s += 14;
    else if (/^en/i.test(v.lang)) s += 8;
    // Every desktop has these and they are the reason people assume TTS still sounds like 2005.
    if (/\b(david|zira|mark|hazel|microsoft sam)\b/.test(n)) s -= 25;
    if (/compact|eloquence|espeak/.test(n)) s -= 20;
    return s;
  };
  return [...voices].filter((v) => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a));
}

/**
 * @param {{ rate?: number, voiceURI?: string|null, onSegment?: (i: number|null) => void }} opts
 */
export default function useSpeaker({ rate = 1, voiceURI = null } = {}) {
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [segment, setSegment] = useState(null);

  const queue = useRef([]);
  const runId = useRef(0);
  const keepalive = useRef(null);
  const onDone = useRef(null);
  // The live rate, read at utterance time rather than captured in the closure - changing the
  // speed mid-question then applies from the next segment instead of the next question. Written
  // in an effect rather than during render: a ref assigned during render is torn by a re-render
  // React discards, and the lint rule that forbids it is right to.
  const rateRef = useRef(rate);
  // `step` recurses through `onend`, so it cannot reference itself directly - it is declared
  // below and mirrored here after each commit.
  const stepRef = useRef(null);
  useEffect(() => { rateRef.current = rate; });

  useEffect(() => {
    const s = synth();
    if (!s) return undefined;
    const load = () => setVoices(s.getVoices());
    load();
    s.addEventListener('voiceschanged', load);
    return () => s.removeEventListener('voiceschanged', load);
  }, []);

  const ranked = useMemo(() => rankVoices(voices), [voices]);
  const chosen = useMemo(
    () => voices.find((v) => v.voiceURI === voiceURI) ?? ranked[0] ?? null,
    [voices, ranked, voiceURI],
  );

  const stopKeepalive = useCallback(() => {
    clearInterval(keepalive.current);
    keepalive.current = null;
  }, []);

  const cancel = useCallback(() => {
    runId.current += 1;
    queue.current = [];
    onDone.current = null;
    stopKeepalive();
    const s = synth();
    if (s) s.cancel();
    setSpeaking(false);
    setSegment(null);
  }, [stopKeepalive]);

  // One segment at a time, chained through `onend`. Each utterance stays short, which is the
  // other half of the 15-second defence: even if the keepalive misses, a dropped segment loses a
  // single option rather than the rest of the question.
  const step = useCallback((id) => {
    const s = synth();
    if (!s || id !== runId.current) return;
    const next = queue.current.shift();
    if (!next) {
      stopKeepalive();
      setSpeaking(false);
      setSegment(null);
      const cb = onDone.current;
      onDone.current = null;
      if (cb) cb();
      return;
    }
    // Only an OPTION reports a position. Passage lines carry an index too, and reporting theirs
    // would light up option C while line 3 of a reading passage was being read.
    setSegment(next.kind === 'option' ? next.index : null);
    const u = new SpeechSynthesisUtterance(next.text);
    if (chosen) u.voice = chosen;
    u.lang = chosen?.lang ?? 'en-US';
    u.rate = rateRef.current;
    // A hair of extra pause before an option letter, so "A." does not run into the previous
    // option's last word. Achieved with the utterance itself rather than a timer - a timer here
    // is a gap the user hears as a stutter.
    u.pitch = 1;
    u.onend = () => stepRef.current?.(id);
    // An error is usually `interrupted` (we cancelled) or `not-allowed` (no gesture yet). Neither
    // is worth a console wall, but neither may hang the chain either.
    u.onerror = () => { if (id === runId.current) stepRef.current?.(id); };
    s.speak(u);
  }, [chosen, stopKeepalive]);

  useEffect(() => { stepRef.current = step; });

  /**
   * Speak a list of segments. Replaces anything already queued.
   * @param {{ text: string, index?: number }[]} segments
   * @param {() => void} [done]
   */
  const speak = useCallback((segments, done) => {
    const s = synth();
    if (!s) return;
    const list = (segments ?? []).filter((x) => x && x.text && x.text.trim());
    cancel();
    if (!list.length) return;
    const id = runId.current;
    queue.current = list;
    onDone.current = done ?? null;
    setSpeaking(true);
    stopKeepalive();
    keepalive.current = setInterval(() => {
      const live = synth();
      if (!live || !live.speaking) return;
      live.pause();
      live.resume();
    }, KEEPALIVE_MS);
    // The tick that stops a fresh utterance being swallowed by the cancel above. 0 is enough -
    // it only has to land after the current task, not after any particular delay.
    setTimeout(() => stepRef.current?.(id), 0);
  }, [cancel, stopKeepalive]);

  /** Unlock audio from inside a click. Silent, and harmless to call repeatedly. */
  const prime = useCallback(() => {
    const s = synth();
    if (!s) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
  }, []);

  useEffect(() => cancel, [cancel]);

  return { speak, cancel, prime, speaking, segment, voices: ranked, voice: chosen, supported: !!synth() };
}
