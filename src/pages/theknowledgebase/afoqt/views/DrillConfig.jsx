import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE, getSubtest, secPerQuestion, compositeReach } from '../engine/afoqtSpec';
import { templatesFor } from '../engine/generator';
import { bankCount } from '../engine/bank';
import { PRESSURE_PRESETS } from '../engine/timing';

const COUNTS = [5, 10, 20, 40];

export default function DrillConfig() {
  const navigate = useNavigate();
  const { progress, updateSettings } = useAfoqt();
  const [subtest, setSubtest] = useState('MK');
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState(progress.settings.mode);
  const [pressure, setPressure] = useState(progress.settings.pressure);
  // Band 5 / `stretch` (Trivium-ceiling material) was built and tested but had no way to reach
  // it from any view - `assembleDrill`'s `includeStretch` had no caller passing true. Off by
  // default per doctrine ("untimed by default, for concept mastery rather than pace") and it
  // forces untimed the moment it's turned on, same way "Full subtest" forces exam mode - stretch
  // and a real-test simulation are opposite goals and should never combine.
  const [stretch, setStretch] = useState(false);

  const meta = getSubtest(subtest);
  const available = templatesFor(subtest).length + bankCount(subtest);
  const perQ = meta ? secPerQuestion(meta) * pressure : 0;
  const hasStretch = templatesFor(subtest).some((t) => t.stretch);

  const start = () => {
    updateSettings({ mode, pressure });
    navigate(`/TKB/afoqt/drill/run?subtest=${subtest}&count=${count}&mode=${mode}&pressure=${pressure}${stretch ? '&stretch=1' : ''}`);
  };

  return (
    <div className="afq-config">
      <h2>Build a drill</h2>

      <section>
        <h3>Subtest</h3>
        <div className="afq-grid">
          {DRILLABLE.map((s) => {
            const n = templatesFor(s.code).length;
            const bank = bankCount(s.code);
            const reach = compositeReach(s.code);
            return (
              <button
                key={s.code}
                className={'afq-tile' + (subtest === s.code ? ' active' : '') + (n + bank === 0 ? ' empty' : '')}
                onClick={() => setSubtest(s.code)}
              >
                <strong>{s.name}</strong>
                <small>{secPerQuestion(s).toFixed(1)}s / question</small>
                {/* Reach is why some subtests matter more: MK feeds five composites, TR all three rated ones. */}
                <small className="afq-reach">{reach.length ? reach.join(' ') : 'unscored'}</small>
                <small>{[n ? `${n} templates` : null, bank ? `${bank} in bank` : null].filter(Boolean).join(' + ') || 'not built yet'}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3>Questions</h3>
        <div className="afq-row afq-wrap-row">
          {COUNTS.map((c) => (
            <button key={c} className={'afq-btn' + (count === c ? ' afq-primary' : '')} onClick={() => setCount(c)}>{c}</button>
          ))}
          {/* The real thing, one click. On the fast subtests the whole difficulty IS the full
              run - forty Table Reading lookups in seven minutes is a different experience from
              five of them, and no amount of five-question drilling rehearses it. */}
          {meta && (
            <button
              className={'afq-btn' + (count === meta.questions ? ' afq-primary' : '')}
              onClick={() => { setCount(meta.questions); setMode('exam'); setPressure(1); setStretch(false); }}
              title={`${meta.questions} questions in ${meta.minutes} minutes, exactly as administered`}
            >
              Full subtest ({meta.questions} in {meta.minutes}:00)
            </button>
          )}
        </div>
      </section>

      <section>
        <h3>Timing</h3>
        <div className="afq-row">
          {['untimed', 'paced', 'exam'].map((m) => (
            <button
              key={m}
              className={'afq-btn' + (mode === m ? ' afq-primary' : '')}
              onClick={() => { setMode(m); if (m === 'exam') setStretch(false); }}
            >
              {m}
            </button>
          ))}
        </div>
        {mode !== 'untimed' && (
          <>
            <div className="afq-row afq-wrap-row">
              {PRESSURE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={'afq-btn' + (pressure === p.value ? ' afq-primary' : '')}
                  onClick={() => setPressure(p.value)}
                  title={p.hint}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="afq-note">
              {perQ.toFixed(1)}s per question
              {pressure !== 1 && meta && ` (real pace is ${secPerQuestion(meta).toFixed(1)}s)`}
            </p>
          </>
        )}
      </section>

      {hasStretch && (
        <section>
          <h3>Depth</h3>
          {/* Band 5 - Trivium-ceiling material, harder than the real test's calibration target
              and meant for concept mastery rather than pace, so turning it on forces untimed and
              is refused together with exam mode (a "real test" run has to stay an honest replica
              of the real test, which has no band-5 content at all). */}
          <button
            className={'afq-btn' + (stretch ? ' afq-primary' : '')}
            onClick={() => { setStretch((v) => !v); if (!stretch) setMode('untimed'); }}
            title="Harder than the real test on purpose - for depth, not pace. Untimed."
          >
            {stretch ? 'Stretch: on' : 'Include stretch (ceiling difficulty, untimed)'}
          </button>
        </section>
      )}

      <button className="afq-btn afq-primary afq-start" onClick={start} disabled={available === 0}>
        {available === 0 ? 'No templates for this subtest yet' : `Start ${count} questions`}
      </button>
    </div>
  );
}
