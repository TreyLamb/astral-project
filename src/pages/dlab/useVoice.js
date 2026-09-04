// React binding for the shared TTS engine (src/pages/shared/ttsEngine.js).
//
// The adapter underneath is provider-agnostic and has no React in it; this adds
// the three things a component actually needs — the voice list once it resolves,
// a `speaking` flag to drive a play/stop button, and cancellation on unmount so
// navigating away mid-word does not leave a voice talking to an empty screen.
//
// `pauseAfter` is handled here rather than in the adapter: silence between
// segments is a script-pacing concern, and the adapter's job is to make a
// segment run gaplessly INTO the next one, which is what makes a stressed
// syllable sound like part of its word instead of a separate utterance.
import { useCallback, useEffect, useRef, useState } from 'react';
import { listVoices, speakSegments, stop, isSpeaking, lastFallbackReason } from '../shared/ttsEngine';
import { buildAudioScript, spokenTextFor, stressedSegmentsFor } from './engine/audioScript';

export const VOICE_SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useVoice(settings) {
  // Stored WITH the provider it belongs to, so switching provider invalidates
  // the list by derivation. Resetting a separate `resolved` flag in the effect
  // body would be a setState during render, which React warns about.
  const [resolved, setResolved] = useState({ provider: null, voices: [] });
  const [speaking, setSpeaking] = useState(false);
  const [fallback, setFallback] = useState(null);
  const abortRef = useRef(null);
  const aliveRef = useRef(true);

  const provider = settings?.voiceProvider || 'webspeech';
  const voicesResolved = resolved.provider === provider;
  const voices = voicesResolved ? resolved.voices : [];

  useEffect(() => {
    let cancelled = false;
    listVoices(provider).then((v) => {
      if (!cancelled) setResolved({ provider, voices: Array.isArray(v) ? v : [] });
    });
    return () => { cancelled = true; };
  }, [provider]);

  // `speechSynthesis` existing is not the same as a voice existing. A browser
  // with the API and an empty voice list accepts speak() and simply never fires
  // onend, so the UI would sit on "Playing…" until the watchdog gave up — and an
  // audio item nobody can hear is unanswerable. Knowing this up front is what
  // lets the test offer the written fallback immediately instead of after a
  // stall on every single question.
  const usable = VOICE_SUPPORTED && (!voicesResolved || voices.length > 0);

  // Leaving the page must silence the voice. Without this, walking away from an
  // audio question keeps reading it out over whatever comes next.
  useEffect(() => () => {
    aliveRef.current = false;
    abortRef.current?.abort();
    stop();
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    stop();
    setSpeaking(false);
  }, []);

  const play = useCallback(async (segments) => {
    if (!segments?.length) return;
    cancel();
    const controller = new AbortController();
    abortRef.current = controller;
    setSpeaking(true);
    setFallback(null);

    // Consecutive segments with no pause between them are spoken as one gapless
    // run; a pause closes the run and opens the next.
    const runs = [];
    let current = [];
    for (const seg of segments) {
      current.push(seg);
      if (seg.pauseAfter) {
        runs.push({ segs: current, pause: seg.pauseAfter });
        current = [];
      }
    }
    if (current.length) runs.push({ segs: current, pause: 0 });

    for (const run of runs) {
      if (controller.signal.aborted || !aliveRef.current) break;
      await speakSegments(run.segs, {
        provider,
        voiceName: settings?.voiceName || undefined,
        signal: controller.signal,
      });
      if (run.pause && !controller.signal.aborted) await sleep(run.pause);
    }

    if (aliveRef.current && !controller.signal.aborted) {
      setSpeaking(false);
      const reason = lastFallbackReason();
      if (reason) setFallback(reason);
    }
  }, [cancel, provider, settings?.voiceName]);

  /** One item's stimulus, with audible stress where the item needs it. */
  const playItem = useCallback((item, language) => {
    const segs = stressedSegmentsFor(item, language)
      || [{ text: spokenTextFor(item), rate: settings?.rate ?? 0.95, pitch: settings?.pitch ?? 1, volume: 1 }];
    return play(segs);
  }, [play, settings?.rate, settings?.pitch]);

  return { voices, voicesResolved, usable, speaking, fallback, play, playItem, cancel, isSpeaking };
}

/**
 * The whole sitting as one read-aloud stream: instructions, every rule, the word
 * list, then each question with a gap for the answer. This is the "put the
 * headphones on and don't look at the screen" path, which is how the real exam's
 * five audio sections are actually taken.
 *
 * @param {object} test
 * @param {{gapSeconds?: number, rate?: number, pitch?: number}} settings
 * @returns {{text: string, rate: number, pitch: number, volume: number, pauseAfter: number}[]}
 */
export function scriptSegments(test, settings = {}) {
  const rate = settings.rate ?? 0.95;
  const pitch = settings.pitch ?? 1;
  const gapMs = (settings.gapSeconds ?? 8) * 1000;
  const out = [];

  for (const seg of buildAudioScript(test)) {
    if (seg.kind === 'pause') {
      // The answer gap is silence, not a spoken segment — an empty utterance is
      // skipped by every engine, so the wait has to be a real pause.
      const prev = out[out.length - 1];
      if (prev) prev.pauseAfter = Math.max(prev.pauseAfter, gapMs);
      continue;
    }
    if (seg.text?.trim()) {
      out.push({ text: seg.text, rate, pitch, volume: 1, pauseAfter: seg.pauseAfter ?? 400 });
    }
    // A vocabulary line is "English word. <constructed word> twice." — the
    // constructed half is respelled, so it is pushed as its own segment.
    if (seg.speak?.trim()) {
      out.push({ text: seg.speak, rate, pitch, volume: 1, pauseAfter: seg.pauseAfter ?? 400 });
    }
  }
  return out;
}
