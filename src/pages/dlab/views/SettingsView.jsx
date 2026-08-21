import { useDlab } from '../dlabContext';
import { PRESETS } from '../engine/buildTest';
import { useVoice, VOICE_SUPPORTED } from '../useVoice';

// A word with the same shape as a generated one, so the preview actually
// exercises the respelling the drill uses rather than reading English.
const SAMPLE = [
  { text: 'kah-', rate: 0.95, pitch: 0.9, volume: 0.7, pauseAfter: 40 },
  { text: 'ROO-', rate: 0.7, pitch: 1.3, volume: 1, pauseAfter: 40 },
  { text: 'mee', rate: 0.95, pitch: 0.9, volume: 0.7 },
];

function Row({ label, help, children }) {
  return (
    <label className="dlab-setrow">
      <span className="dlab-setlabel">{label}</span>
      {children}
      {help && <span className="dlab-help">{help}</span>}
    </label>
  );
}

export default function SettingsView() {
  const { settings, updateSettings, mode } = useDlab();
  const voice = useVoice(settings);

  const englishFirst = [...voice.voices].sort((a, b) => {
    const ae = a.lang?.startsWith('en') ? 0 : 1;
    const be = b.lang?.startsWith('en') ? 0 : 1;
    return ae - be || a.name.localeCompare(b.name);
  });

  return (
    <div className="dlab-settings">
      <section className="dlab-panel">
        <h2>Voice</h2>
        {!VOICE_SUPPORTED ? (
          <p className="dlab-warn">
            This browser has no speech synthesis, so audio questions cannot be spoken here.
            The study screen can still export the whole drill as a read-aloud script.
          </p>
        ) : (
          <>
            <Row
              label="Voice"
              help="Only the voice's accent changes — every word is respelled before it is spoken so the synthesiser says what the answer key expects, whichever voice reads it."
            >
              <select
                className="dlab-input"
                value={settings.voiceName ?? ''}
                onChange={(e) => updateSettings({ voiceName: e.target.value || null })}
              >
                <option value="">System default</option>
                {englishFirst.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} — {v.lang}</option>
                ))}
              </select>
            </Row>

            <Row label={`Speed — ${settings.rate.toFixed(2)}×`}>
              <input
                type="range" min="0.5" max="1.5" step="0.05"
                value={settings.rate}
                onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
              />
            </Row>

            <Row label={`Pitch — ${settings.pitch.toFixed(2)}`}>
              <input
                type="range" min="0.5" max="1.5" step="0.05"
                value={settings.pitch}
                onChange={(e) => updateSettings({ pitch: Number(e.target.value) })}
              />
            </Row>

            <div className="dlab-actions">
              <button
                type="button"
                className="dlab-btn"
                onClick={() => (voice.speaking ? voice.cancel() : voice.play(SAMPLE))}
              >
                {voice.speaking ? '■ Stop' : '▶ Hear a sample word'}
              </button>
              <span className="dlab-help">
                The middle syllable is the stressed one. If you cannot hear which, raise the
                pitch or slow the speed — stress questions depend on that difference being audible.
              </span>
            </div>
          </>
        )}
      </section>

      <section className="dlab-panel">
        <h2>Drill</h2>

        <Row
          label="Default format"
          help="What the setup screen starts on."
        >
          <select
            className="dlab-input"
            value={settings.defaultPreset}
            onChange={(e) => updateSettings({ defaultPreset: e.target.value })}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label} — {p.written} written, {p.audio} audio</option>
            ))}
          </select>
        </Row>

        <Row
          label={`Replays allowed — ${settings.replayLimit}`}
          help="How many times an audio question may be played again after the first play. The real exam plays each item once; more replays make this a study aid rather than a simulation."
        >
          <input
            type="range" min="0" max="5" step="1"
            value={settings.replayLimit}
            onChange={(e) => updateSettings({ replayLimit: Number(e.target.value) })}
          />
        </Row>

        <Row
          label={`Answer gap — ${settings.gapSeconds}s`}
          help="Silence left after each question in the full read-aloud script, for writing an answer. Does not affect the on-screen sitting, where you take as long as you like."
        >
          <input
            type="range" min="3" max="30" step="1"
            value={settings.gapSeconds}
            onChange={(e) => updateSettings({ gapSeconds: Number(e.target.value) })}
          />
        </Row>

        <label className="dlab-check">
          <input
            type="checkbox"
            checked={settings.strictGrading}
            onChange={(e) => updateSettings({ strictGrading: e.target.checked })}
          />
          <span>
            <strong>Strict grading</strong>
            <span className="dlab-help">
              Off by default: an answer with the right morphemes in the right order counts even
              with a stray capital, a double space or a hyphen the key does not have — marking
              those wrong measures typing, not aptitude. On, the answer must match the key
              exactly. This only ever lowers a score; it never makes a wrong answer right.
              Changing it re-scores every sitting in your history.
            </span>
          </span>
        </label>

        <label className="dlab-check">
          <input
            type="checkbox"
            checked={settings.showTimerBar}
            onChange={(e) => updateSettings({ showTimerBar: e.target.checked })}
          />
          <span>
            <strong>Show the countdown on timed sittings</strong>
            <span className="dlab-help">
              The clock still runs either way and the sitting still submits itself when time is
              up — this only hides the display, for when watching it is the distraction.
            </span>
          </span>
        </label>
      </section>

      <section className="dlab-panel">
        <h2>Data</h2>
        <p className="dlab-help">
          {mode === 'cloud'
            ? 'Signed in — results and settings sync across your devices, and the last 100 sittings are kept.'
            : 'Signed out — results and settings live in this browser only. Sign in from the Astral Hub to sync them.'}
        </p>
        <p className="dlab-help">
          A stored sitting is just its language code and your answers. Every question, prompt and
          answer key is rebuilt from the code on demand, which is why an old sitting can be
          reviewed in full and replayed exactly.
        </p>
      </section>
    </div>
  );
}
