import { useCallback, useEffect, useRef, useState } from 'react';
import useSpeaker from './useSpeaker';
import useListener from './useListener';
import { speechFor, passageSpeech, matchUtterance, SPEAKABILITY } from '../engine/speech';

// The whole voice loop for one question, composed from the two hardware-facing hooks. Every
// runner (drill, exam, diagnostic) uses this rather than touching either directly, so the
// behaviour - and the mistakes it guards against - stay identical across all three.

export const VOICE_DEFAULTS = {
  enabled: false,
  autoplay: true,
  readOptions: true,
  listen: true,
  rate: 1,
  voiceURI: null,
  // Which synthesiser. `webspeech` is the device's own - instant, free, and only as good as
  // whatever that device shipped. `piper` and `kokoro` are neural models that download once and
  // are cached; see PROVIDERS in shared/ttsEngine.js. Default stays webspeech because a silent
  // 75MB download on someone's first drill is not a default anyone asked for - the picker says
  // plainly that it is the one to change if the voice sounds bad.
  provider: 'webspeech',
  // How long a heard answer sits highlighted before it is submitted.
  //
  // NOT ZERO BY DEFAULT, and this is the single most important number in the feature. A
  // recogniser mishears; on a scored question an instant commit turns one misheard syllable into
  // a wrong answer with no way to intervene. A beat of "heard B - say no to cancel" costs nothing
  // when it is right and saves the question when it is not. Set to 0 for instant commit.
  commitMs: 1200,
};

/**
 * @param {{
 *   q: object|null, subtest: string, enabled: boolean, settings: object,
 *   onPick: (index: number) => void,
 *   onCommand: (name: string) => void,
 * }} args
 */
export default function useQuestionVoice({ q, subtest, enabled, settings, onPick, onCommand }) {
  const cfg = { ...VOICE_DEFAULTS, ...(settings ?? {}) };
  const speaker = useSpeaker({ rate: cfg.rate, voiceURI: cfg.voiceURI, provider: cfg.provider });
  // A question's identity, and the key everything transient is scoped by. `armed` and `heard`
  // both belong to ONE question, and stamping them with the key is what lets moving to the next
  // question drop them without an effect that fires a setState on every navigation.
  const qKey = q ? `${q.templateId}:${q.seed}` : null;
  const [armedAt, setArmedAt] = useState(null);
  const [heardAt, setHeardAt] = useState(null);
  const armed = armedAt?.key === qKey ? armedAt : null;
  const heard = heardAt?.key === qKey ? heardAt : null;
  const commitTimer = useRef(null);
  const live = useRef({ q, onPick, onCommand, qKey });
  useEffect(() => { live.current = { q, onPick, onCommand, qKey }; });

  const level = SPEAKABILITY[subtest]?.level ?? 'full';
  const on = enabled && cfg.enabled && speaker.supported;

  const readQuestion = useCallback(() => {
    const cur = live.current.q;
    if (!cur) return;
    speaker.speak(speechFor(cur, { includeOptions: cfg.readOptions }));
  }, [speaker, cfg.readOptions]);

  const readOptions = useCallback(() => {
    const cur = live.current.q;
    if (!cur) return;
    speaker.speak(speechFor(cur, { includeOptions: true }).filter((s) => s.kind !== 'stem'));
  }, [speaker]);

  const readPassage = useCallback(() => {
    const cur = live.current.q;
    if (!cur?.render) return;
    speaker.speak(passageSpeech(cur.render));
  }, [speaker]);

  const clearArmed = useCallback(() => {
    clearTimeout(commitTimer.current);
    setArmedAt(null);
  }, []);

  // Resolve runs inside the recogniser's result handler, so it must not close over render state.
  const resolve = useCallback((transcript) => {
    const cur = live.current.q;
    if (!cur) return null;
    return matchUtterance(transcript, { choices: cur.choices, count: cur.choices.length });
  }, []);

  const onAction = useCallback((action, transcript) => {
    setHeardAt({ key: live.current.qKey, text: transcript, at: Date.now() });
    if (action.kind === 'command') {
      if (action.name === 'undo') { clearArmed(); return; }
      if (action.name === 'repeat') { clearArmed(); readQuestion(); return; }
      if (action.name === 'options') { clearArmed(); readOptions(); return; }
      if (action.name === 'passage') { clearArmed(); readPassage(); return; }
      if (action.name === 'stop') { speaker.cancel(); clearArmed(); return; }
      clearArmed();
      live.current.onCommand(action.name);
      return;
    }
    // An answer. Re-arming replaces the pending one rather than queueing a second commit, so
    // correcting yourself out loud ("B... no, C") lands on C.
    clearTimeout(commitTimer.current);
    if (!cfg.commitMs) { setArmedAt(null); live.current.onPick(action.index); return; }
    setArmedAt({ key: live.current.qKey, index: action.index, via: action.via, at: Date.now() });
    commitTimer.current = setTimeout(() => {
      setArmedAt(null);
      live.current.onPick(action.index);
    }, cfg.commitMs);
  }, [cfg.commitMs, clearArmed, readQuestion, readOptions, readPassage, speaker]);

  const listener = useListener({
    enabled: on && cfg.listen && level !== 'figure',
    resolve,
    onAction,
  });

  // Deafen the microphone whenever the synthesiser is talking, or the tool answers its own
  // questions - see useListener's note 1.
  const { setMuted } = listener;
  useEffect(() => { setMuted(speaker.speaking); }, [speaker.speaking, setMuted]);

  // Autoplay on question change. A figure subtest never autoplays: reading "how many other blocks
  // does block 2 touch" to someone who has not looked at the pile is noise, not help.
  useEffect(() => {
    // No state reset here - `armed` and `heard` are keyed on the question and fall away on their
    // own. Only the pending commit needs cancelling, or an answer heard for the previous question
    // lands on this one.
    clearTimeout(commitTimer.current);
    if (!on || !cfg.autoplay || !qKey || level === 'figure') return;
    readQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qKey, on, cfg.autoplay, level]);

  useEffect(() => {
    if (!on) speaker.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  return {
    on,
    level,
    hasPassage: q?.render?.kind === 'passage',
    note: SPEAKABILITY[subtest]?.note ?? null,
    speaker,
    listener,
    armed,
    heard,
    cancelArmed: clearArmed,
    readQuestion,
    readOptions,
    readPassage,
    stop: speaker.cancel,
  };
}
