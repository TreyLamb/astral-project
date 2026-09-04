import { useCallback, useEffect, useRef, useState } from 'react';

// Speech recognition, wrapped the same way `useSpeaker` wraps synthesis.
//
// FOUR THINGS MAKE A NAIVE IMPLEMENTATION UNUSABLE, and all four are handled here:
//
//  1. THE MICROPHONE HEARS THE SYNTHESISER. The single worst failure mode of a read-aloud +
//     speak-your-answer loop: the tool reads "C. Gracious", the recogniser hears "C", and the
//     question answers itself. Discarding results while speaking is not enough, because the
//     recogniser buffers audio and hands it over afterwards - so `setMuted(true)` ABORTS the
//     recogniser outright, which throws the buffer away, and restarts it when the voice stops.
//  2. `continuous` STILL STOPS. Chrome ends a session after a stretch of silence and simply
//     fires `onend`. Without an automatic restart the mic goes dead a few questions in and
//     nothing says so.
//  3. `start()` WHILE ALREADY RUNNING THROWS `InvalidStateError`, and the state that decides it
//     is the browser's, not ours - `onstart`/`onend` are the only honest source, so a ref tracks
//     it and every start goes through the guard.
//  4. A SINGLE TRANSCRIPT IS A BAD BET on one-syllable words. "D" comes back as "dee", "the",
//     "3" or "duh" depending on the mic; `maxAlternatives` asks for several readings and the
//     resolver gets all of them, which is the difference between a letter that works and one
//     that needs three tries. It is also why saying "delta" is worth advertising in the UI.

const Impl = () => (typeof window === 'undefined'
  ? null
  : window.SpeechRecognition || window.webkitSpeechRecognition || null);

export const listeningSupported = () => !!Impl();

/**
 * @param {{
 *   enabled: boolean,
 *   resolve: (transcript: string) => any,   // called per alternative; first truthy result wins
 *   onAction: (action: any, transcript: string) => void,
 * }} opts
 */
export default function useListener({ enabled, resolve, onAction }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [interim, setInterim] = useState('');

  const rec = useRef(null);
  const running = useRef(false);
  const wanted = useRef(false);
  const muted = useRef(false);
  const restart = useRef(null);
  // Handlers are read through refs so the recogniser is built ONCE. Rebuilding it on every render
  // - which is what happens if these land in the effect's dependency list - tears down the audio
  // stream between questions and gives a visible "reconnecting" stutter plus a permission flicker.
  // Assigned in an effect, not during render: a ref written during a render React then discards
  // is left holding a handler from a tree that never mounted.
  const cbs = useRef({ resolve, onAction });
  useEffect(() => { cbs.current = { resolve, onAction }; });

  const startNow = useCallback(() => {
    const r = rec.current;
    if (!r || running.current || !wanted.current || muted.current) return;
    try {
      r.start();
      running.current = true;
    } catch {
      // InvalidStateError - the browser thinks it is already running. `onend` will settle it.
      running.current = true;
    }
  }, []);

  useEffect(() => {
    const Ctor = Impl();
    if (!Ctor) return undefined;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 5;
    r.lang = 'en-US';

    r.onstart = () => { setListening(true); setError(null); };

    r.onend = () => {
      running.current = false;
      setListening(false);
      // The auto-restart. Delayed by a beat rather than immediate: a tight restart loop on a
      // denied microphone spins the CPU and re-prompts, and the delay is inaudible.
      clearTimeout(restart.current);
      if (wanted.current && !muted.current) restart.current = setTimeout(startNow, 250);
    };

    r.onerror = (e) => {
      // `no-speech` and `aborted` are normal punctuation in a continuous session - reporting them
      // would put an error on screen every time the user thinks for a few seconds.
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wanted.current = false;
        setError('Microphone permission denied. Allow it in the browser address bar to answer by voice.');
      } else if (e.error === 'audio-capture') {
        setError('No microphone found.');
      } else {
        setError(String(e.error));
      }
    };

    r.onresult = (event) => {
      if (muted.current) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) {
          setInterim(result[0]?.transcript ?? '');
          continue;
        }
        setInterim('');
        // Every alternative gets a try, best-first, and the first one that resolves to an action
        // wins. A recogniser's second guess is right often enough on single letters that ignoring
        // it is the main reason voice answering feels unreliable.
        for (let a = 0; a < result.length; a++) {
          const text = result[a].transcript;
          const action = cbs.current.resolve(text);
          if (action) { cbs.current.onAction(action, text); break; }
        }
      }
    };

    rec.current = r;
    return () => {
      wanted.current = false;
      clearTimeout(restart.current);
      r.onend = null;
      r.onresult = null;
      r.onerror = null;
      r.onstart = null;
      try { r.abort(); } catch { /* already stopped */ }
      rec.current = null;
      running.current = false;
    };
  }, [startNow]);

  useEffect(() => {
    wanted.current = enabled;
    if (enabled) startNow();
    else {
      clearTimeout(restart.current);
      try { rec.current?.stop(); } catch { /* not running */ }
    }
  }, [enabled, startNow]);

  /** Deafen the mic while the synthesiser is talking. Abort, not stop - it discards the buffered
   *  audio, which is the whole point (see note 1 above). */
  const setMuted = useCallback((on) => {
    if (muted.current === on) return;
    muted.current = on;
    if (on) {
      clearTimeout(restart.current);
      setInterim('');
      try { rec.current?.abort(); } catch { /* not running */ }
    } else if (wanted.current) {
      // A short tail so the last syllable of the synthesised voice, still travelling from the
      // speakers, is not the first thing the mic hears.
      clearTimeout(restart.current);
      restart.current = setTimeout(startNow, 300);
    }
  }, [startNow]);

  // `interim` is gated on `listening` rather than being cleared by an effect when the mic stops -
  // a half-heard phrase left on screen next to a dead microphone reads as "it heard me and did
  // nothing", which is the one impression this indicator exists to prevent.
  return { supported: !!Impl(), listening, error, interim: listening ? interim : '', setMuted };
}
