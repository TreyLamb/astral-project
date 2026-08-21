import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDlab } from '../dlabContext';
import { PRESETS, MAX_WRITTEN, MAX_AUDIO } from '../engine/buildTest';
import { tierCounts } from '../engine/questions';

const TIER_ORDER = ['easy', 'medium', 'hard', 'extreme'];

function Mix({ label, n }) {
  if (n === 0) return <div className="dlab-mix is-empty"><span className="dlab-setlabel">{label}</span><span className="dlab-muted dlab-tiny">none</span></div>;
  const c = tierCounts(n);
  return (
    <div className="dlab-mix">
      <span className="dlab-setlabel">{label} — {n}</span>
      <div className="dlab-mixbar">
        {TIER_ORDER.filter((t) => c[t] > 0).map((t) => (
          <span key={t} className={`dlab-mixseg dlab-tier-${t}`} style={{ flexGrow: c[t] }} title={`${c[t]} ${t}`} />
        ))}
      </div>
      <span className="dlab-muted dlab-tiny">
        {TIER_ORDER.filter((t) => c[t] > 0).map((t) => `${c[t]} ${t}`).join(' · ')}
      </span>
    </div>
  );
}

export default function SetupView() {
  const { test, startTest, abandonTest, results, settings } = useDlab();
  const navigate = useNavigate();

  const [presetId, setPresetId] = useState(settings.defaultPreset);
  const [custom, setCustom] = useState(false);
  const [written, setWritten] = useState(12);
  const [audio, setAudio] = useState(48);
  const [code, setCode] = useState('');

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const w = custom ? written : preset.written;
  const a = custom ? audio : preset.audio;
  const mc = custom ? false : !!preset.mc;

  const begin = () => {
    startTest({ presetId: custom ? null : presetId, written: w, audio: a, mc, seedText: code });
    navigate('/DLAB/brief');
  };

  return (
    <div className="dlab-setup">
      <header className="dlab-hero">
        <h1>Every sitting is a language you have never seen</h1>
        <p className="dlab-lede">
          The DLAB does not test a language you know — it invents one, shows you its rules,
          and measures whether you can apply them. So this invents one too, from scratch,
          every time: new sounds, new words, new grammar. Nothing carries over, and nothing
          is multiple choice. You write every answer yourself.
        </p>
      </header>

      {test && (
        <section className="dlab-panel dlab-resume">
          <div>
            <h2>You have a sitting open</h2>
            <p className="dlab-help">
              Code {test.seedCode} · {test.config.written} written, {test.config.audio} audio
              {test.config.mc ? ' · multiple choice' : ''}
            </p>
          </div>
          <div className="dlab-actions">
            <Link className="dlab-btn dlab-btn-primary" to="/DLAB/brief">Back to it</Link>
            <button type="button" className="dlab-btn dlab-btn-danger" onClick={abandonTest}>Throw it away</button>
          </div>
        </section>
      )}

      <section className="dlab-panel">
        <h2>Pick a shape</h2>
        <p className="dlab-help">
          The real exam runs five listening sections to one visual one, which is why the
          default here is weighted the same way. The written and listening halves are
          independent sets of questions over the <em>same</em> language — being asked the
          same thing twice in two formats would only measure whether you remembered your
          own earlier answer.
        </p>

        <div className="dlab-presets">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`dlab-preset ${!custom && presetId === p.id ? 'is-on' : ''}`}
              onClick={() => { setPresetId(p.id); setCustom(false); }}
            >
              <span className="dlab-presetname">{p.label}</span>
              <span className="dlab-presetsplit">{p.written} written · {p.audio} audio</span>
              <span className="dlab-presetdesc">{p.desc}</span>
              <span className="dlab-presetmeta">
                {p.mc ? 'multiple choice · timed' : 'written answers'} · about {p.estMinutes} min
              </span>
            </button>
          ))}
          <button
            type="button"
            className={`dlab-preset ${custom ? 'is-on' : ''}`}
            onClick={() => setCustom(true)}
          >
            <span className="dlab-presetname">Your own mix</span>
            <span className="dlab-presetsplit">{written} written · {audio} audio</span>
            <span className="dlab-presetdesc">Set each half yourself, from none to plenty.</span>
            <span className="dlab-presetmeta">written answers</span>
          </button>
        </div>

        {custom && (
          <div className="dlab-customsliders">
            <label className="dlab-setrow">
              <span className="dlab-setlabel">Written questions — {written}</span>
              <input type="range" min="0" max={MAX_WRITTEN} value={written} onChange={(e) => setWritten(Number(e.target.value))} />
            </label>
            <label className="dlab-setrow">
              <span className="dlab-setlabel">Listening questions — {audio}</span>
              <input type="range" min="0" max={MAX_AUDIO} value={audio} onChange={(e) => setAudio(Number(e.target.value))} />
            </label>
          </div>
        )}

        <div className="dlab-mixes">
          <Mix label="Written" n={w} />
          <Mix label="Listening" n={a} />
        </div>
        <p className="dlab-help">
          Each half climbs on its own from one rule at a time up to items that stack ten
          simultaneously. Difficulty is measured from how many rules an answer actually
          needs, not guessed at — so the hard section is genuinely hard in whatever
          language you happen to get.
        </p>

        <details className="dlab-details">
          <summary>Sit a language you have had before</summary>
          <p className="dlab-help">
            A sitting is completely determined by its code, so entering one rebuilds that
            exact language, those exact questions and that exact answer key. Useful for
            re-sitting something that went badly, or for handing someone else the same test.
            Leave it empty for a language you have not seen.
          </p>
          <input
            className="dlab-input"
            placeholder="e.g. WAS98J"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={12}
          />
        </details>

        <div className="dlab-actions dlab-actions-end">
          <button type="button" className="dlab-btn dlab-btn-primary dlab-btn-lg" onClick={begin} disabled={w + a === 0}>
            {code ? `Rebuild ${code}` : 'Invent a language'}
          </button>
        </div>
      </section>

      {results.length > 0 && (
        <section className="dlab-panel">
          <div className="dlab-briefblockhead">
            <h2>Lately</h2>
            <Link className="dlab-btn" to="/DLAB/history">All sittings</Link>
          </div>
          <ul className="dlab-recent">
            {results.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link to={`/DLAB/results/${r.id}`}>
                  <span className="dlab-seed-pill">{r.seedCode}</span>
                  <span className="dlab-recentpct">{r.score?.percent ?? 0}%</span>
                  <span className="dlab-muted dlab-tiny">
                    {r.score?.correct ?? 0}/{r.score?.total ?? 0}
                    {r.assistUsed ? ' · assisted' : ''}
                  </span>
                  <span className="dlab-muted dlab-tiny">{new Date(r.createdAt).toLocaleDateString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
