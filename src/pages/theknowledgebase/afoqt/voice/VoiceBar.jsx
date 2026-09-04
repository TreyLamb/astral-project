import { useState } from 'react';
import { VOICE_DEFAULTS } from './useQuestionVoice';
import { PROVIDERS } from './useSpeaker';

// The voice strip that sits above a question. One control does the thing you want 95% of the
// time (turn it on / replay); everything else is behind the gear, because a row of six toggles
// above every question is exactly the clutter a hands-free mode is supposed to remove.

// The test line, chosen so it exercises what actually goes wrong - a number, a degree symbol, a
// comma and a question - rather than proving the speakers work.
const SAMPLE = 'Test. The aircraft banked 30° to the right. Which instrument shows that?';

const RATES = [
  { v: 0.85, label: 'Slow' },
  { v: 1, label: 'Normal' },
  { v: 1.25, label: 'Brisk' },
  { v: 1.6, label: 'Fast' },
];

export default function VoiceBar({ voice, settings, updateVoice, compact = false }) {
  const [open, setOpen] = useState(false);
  const cfg = { ...VOICE_DEFAULTS, ...(settings ?? {}) };
  const { speaker, listener, level, note, armed, heard } = voice;

  if (!speaker.supported) {
    return (
      <p className="afq-note afq-voice-unsupported">
        This browser has no speech synthesis, so read-aloud is unavailable. Chrome, Edge and Safari
        all have it.
      </p>
    );
  }

  const toggle = () => {
    // The enabling click IS the user gesture that unlocks audio - browsers refuse to speak
    // before one, and on iOS the very first utterance has to originate inside a handler. Priming
    // here rather than at the first autoplay is the difference between voice working on the first
    // question and working on the second.
    if (!cfg.enabled) speaker.prime();
    else speaker.cancel();
    updateVoice({ enabled: !cfg.enabled });
  };

  return (
    <div className={'afq-voicebar' + (compact ? ' afq-voicebar-compact' : '')}>
      <button
        className={'afq-voice-toggle' + (cfg.enabled ? ' afq-voice-on' : '')}
        onClick={toggle}
        aria-pressed={cfg.enabled}
        title={cfg.enabled ? 'Turn read-aloud off' : 'Read questions aloud'}
      >
        <span aria-hidden="true">{cfg.enabled ? '🔊' : '🔈'}</span>
        <span>{cfg.enabled ? 'Voice on' : 'Voice'}</span>
      </button>

      {cfg.enabled && (
        <>
          <button
            className="afq-voice-btn"
            onClick={() => (speaker.speaking ? speaker.cancel() : voice.readQuestion())}
            title="Read the question again (or press R)"
          >
            {speaker.speaking ? '■ Stop' : '↻ Repeat'}
          </button>

          {/* Reading Comprehension only. The passage serves several questions, so it is never
              re-read automatically with each one - and the button only exists where there is
              something to read. */}
          {voice.hasPassage && (
            <button
              className="afq-voice-btn"
              onClick={voice.readPassage}
              disabled={speaker.speaking}
              title="Read the reading passage aloud"
            >
              ▤ Passage
            </button>
          )}

          {cfg.listen && (
            <span
              className={'afq-mic' + (listener.listening ? ' afq-mic-live' : '')}
              title={listener.listening ? 'Listening - say a letter, "bravo", or the answer itself' : 'Microphone idle'}
            >
              <span className="afq-mic-dot" aria-hidden="true" />
              {listener.listening ? 'Listening' : 'Mic off'}
            </span>
          )}

          <button className="afq-voice-gear" onClick={() => setOpen((v) => !v)} aria-expanded={open} title="Voice settings">
            ⚙
          </button>
        </>
      )}

      {/* What the recogniser heard, shown verbatim. A voice interface that silently ignores you is
          indistinguishable from a broken one; showing the transcript makes "it misheard me" and
          "it never heard me" two different, fixable problems. */}
      {cfg.enabled && (armed || heard || listener.interim) && (
        <span className={'afq-heard' + (armed ? ' afq-heard-armed' : '')}>
          {armed
            ? <>Heard <strong>{'ABCDE'[armed.index]}</strong> — say “no” to cancel</>
            : <>“{listener.interim || heard?.text}”</>}
        </span>
      )}

      {cfg.enabled && listener.error && <span className="afq-voice-err">{listener.error}</span>}

      {cfg.enabled && level === 'figure' && (
        <span className="afq-voice-err">Reading only — {note}</span>
      )}

      {open && (
        <div className="afq-voice-panel">
          <label className="afq-toggle">
            <input type="checkbox" checked={cfg.autoplay} onChange={(e) => updateVoice({ autoplay: e.target.checked })} />
            <span>Read each question automatically<small>Off: nothing is spoken until you press Repeat or R.</small></span>
          </label>
          <label className="afq-toggle">
            <input type="checkbox" checked={cfg.readOptions} onChange={(e) => updateVoice({ readOptions: e.target.checked })} />
            <span>Read the options too<small>Off: just the stem, then you read the five options yourself.</small></span>
          </label>
          <label className="afq-toggle">
            <input type="checkbox" checked={cfg.listen} onChange={(e) => updateVoice({ listen: e.target.checked })} disabled={!listener.supported} />
            <span>
              Answer out loud
              <small>
                {listener.supported
                  ? 'Say a letter, the NATO word (alpha, bravo, charlie, delta, echo), or the answer itself. Also: repeat, options, next, back, flag, finish.'
                  : 'This browser has no speech recognition — Chrome, Edge and Safari do. Tap an answer instead.'}
              </small>
            </span>
          </label>

          <div className="afq-voice-field">
            <span className="afq-voice-label">Speed</span>
            <div className="afq-row afq-wrap-row">
              {RATES.map((r) => (
                <button
                  key={r.v}
                  className={'afq-btn' + (cfg.rate === r.v ? ' afq-primary' : '')}
                  onClick={() => updateVoice({ rate: r.v })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="afq-voice-field">
            <span className="afq-voice-label">Confirm before submitting</span>
            <div className="afq-row afq-wrap-row">
              {[0, 800, 1200, 2000].map((ms) => (
                <button
                  key={ms}
                  className={'afq-btn' + (cfg.commitMs === ms ? ' afq-primary' : '')}
                  onClick={() => updateVoice({ commitMs: ms })}
                >
                  {ms === 0 ? 'Instant' : `${(ms / 1000).toFixed(1)}s`}
                </button>
              ))}
            </div>
            <p className="afq-note">
              A heard answer waits this long before it is submitted, so a mishearing can be undone
              by saying “no”. Instant is faster and unforgiving.
            </p>
          </div>

          {/* THE FIRST THING TO CHANGE IF IT SOUNDS BAD, so it is the first thing in the panel.
              Web Speech quality is whatever the device shipped and nothing else in this panel can
              improve it - the neural engines are a different class of output, at the cost of a
              one-time download. */}
          <div className="afq-voice-field">
            <span className="afq-voice-label">Engine</span>
            <div className="afq-row afq-wrap-row">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={'afq-btn' + (cfg.provider === p.id ? ' afq-primary' : '')}
                  onClick={() => { speaker.cancel(); updateVoice({ provider: p.id, voiceURI: null }); }}
                  title={p.note}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="afq-note">{PROVIDERS.find((p) => p.id === cfg.provider)?.note}</p>
            {cfg.provider !== 'webspeech' && (
              <div className="afq-row afq-wrap-row">
                <button className="afq-btn" onClick={speaker.download} disabled={speaker.loading}>
                  {speaker.loading ? 'Downloading…' : 'Download now'}
                </button>
                <span className="afq-note">
                  Cached after the first time. Worth doing on wi-fi before you need it in the car.
                </span>
              </div>
            )}
            {speaker.loadError && <p className="afq-voice-err">{speaker.loadError}</p>}
          </div>

          <div className="afq-voice-field">
            <span className="afq-voice-label">Voice</span>
            <div className="afq-row afq-wrap-row">
              <select
                className="afq-voice-select"
                value={speaker.voice?.id ?? ''}
                onChange={(e) => updateVoice({ voiceURI: e.target.value || null })}
              >
                {speaker.voices.length === 0 && <option value="">Loading…</option>}
                {speaker.voices.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {/* Auditioning a voice must not cost a drill. Without this the only way to hear a
                  setting is to start a run and spend a question finding out. */}
              <button
                className="afq-btn"
                onClick={() => {
                  if (speaker.speaking) { speaker.cancel(); return; }
                  speaker.prime();
                  speaker.speak([{ kind: 'note', text: SAMPLE }]);
                }}
                disabled={speaker.loading}
              >
                {speaker.speaking ? '■ Stop' : '▶ Test voice'}
              </button>
            </div>
            <p className="afq-note">
              {cfg.provider === 'webspeech'
                ? 'Best-first, but the list is only what this device has installed. If none of them sound good, that is the engine above, not the voice.'
                : 'Neural voices, all well past anything in the browser list.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
