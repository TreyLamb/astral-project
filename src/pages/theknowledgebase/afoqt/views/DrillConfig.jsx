import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE, getSubtest, secPerQuestion, compositeReach } from '../engine/afoqtSpec';
import { templatesFor } from '../engine/generator';
import { bankCount } from '../engine/bank';
import { PRESSURE_PRESETS } from '../engine/timing';

const COUNTS = [5, 10, 20, 40];

export default function DrillConfig() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { progress, updateSettings } = useAfoqt();
  // Two steps, not one form. Trey, 2026-09-03: "When I select a subtest to drill I want all
  // other subtests to disappear THEN I want the settings for how I want to do my drill to pop
  // up. I don't want to do it all at once."
  //
  // So `null` is the real starting state now rather than a preselected MK: with a subtest
  // already chosen, the picker and every setting competed for attention at once, and on a phone
  // the settings sat below a 12-tile grid where they were easy to miss entirely. Step one asks
  // one question; step two collapses the grid to the choice and shows what depends on it.
  //
  // A caller can still deep-link a subtest and land straight on step two - the diagnostic's
  // "drill your weakest subtest" button is the reason this exists, and that caller has already
  // made the step-one decision. DRILLABLE.some() guards against an unknown/typo'd code, which
  // now falls back to step one rather than to a picker showing nothing selected.
  const [subtest, setSubtest] = useState(() => {
    const requested = params.get('subtest');
    return requested && DRILLABLE.some((s) => s.code === requested) ? requested : null;
  });
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState(progress.settings.mode);
  const [pressure, setPressure] = useState(progress.settings.pressure);
  // Band 5 / `stretch` (Trivium-ceiling material) was built and tested but had no way to reach
  // it from any view - `assembleDrill`'s `includeStretch` had no caller passing true. Off by
  // default per doctrine ("untimed by default, for concept mastery rather than pace") and it
  // forces untimed the moment it's turned on, same way "Full subtest" forces exam mode - stretch
  // and a real-test simulation are opposite goals and should never combine.
  const [stretch, setStretch] = useState(false);
  // Speed mode: bands 1-2 only, at 40% less time than the real allotment.
  //
  // Trey's request, 2026-09-02, and the reasoning behind it is worth keeping. His ranking puts
  // bands 1-2 BELOW the level the test asks, so studying them for meaning is wasted time - he
  // already knows those words. What is not wasted is answering them faster: Word Knowledge gives
  // twelve seconds a question, and hesitating on a word you half-know is what eats the time you
  // need for the band 4-5 items. So this trains recall SPEED on easy material rather than
  // teaching anything new, which is why it forces `exam` timing and refuses stretch.
  const [speed, setSpeed] = useState(false);

  // Every derived value below is scoped to the chosen subtest, so all of them have to tolerate
  // not having one yet - step one renders before any of this means anything.
  const meta = subtest ? getSubtest(subtest) : null;
  const templates = subtest ? templatesFor(subtest) : [];
  const available = subtest ? templates.length + bankCount(subtest) : 0;
  const perQ = meta ? secPerQuestion(meta) * pressure : 0;
  const hasStretch = templates.some((t) => t.stretch);
  const lowBand = templates.filter((t) => t.band <= 2).length;

  // Picking a subtest resets the run length. "Full subtest" sets `count` to that subtest's own
  // question count, and carrying 40 over from Table Reading into a 25-question Word Knowledge
  // drill silently builds a run the chosen subtest never administers.
  const chooseSubtest = (code) => {
    if (code !== subtest) setCount(5);
    setSubtest(code);
  };

  const start = () => {
    updateSettings({ mode, pressure });
    const q = new URLSearchParams({ subtest, count, mode, pressure });
    if (stretch) q.set('stretch', '1');
    if (speed) q.set('bands', '1,2');
    navigate(`/TKB/afoqt/drill/run?${q}`);
  };

  return (
    <div className="afq-config">
      <h2>{subtest ? 'Set up your drill' : 'Pick a subtest'}</h2>

      {!subtest && (
        <>
          <p className="afq-note">
            Want all 12 subtests, in the real order, back to back? That is the{' '}
            <button className="afq-linklike" onClick={() => navigate('/TKB/afoqt/exam')}>full exam</button>,
            not a drill. New here and not sure where to start? Try the{' '}
            <button className="afq-linklike" onClick={() => navigate('/TKB/afoqt/diagnostic')}>diagnostic</button>{' '}
            first - six questions per subtest, ~35 minutes, tells you where to focus.
          </p>

          <section>
            <div className="afq-grid afq-subtest-grid">
              {DRILLABLE.map((s) => {
                const n = templatesFor(s.code).length;
                const bank = bankCount(s.code);
                const reach = compositeReach(s.code);
                return (
                  <button
                    key={s.code}
                    className={'afq-tile' + (n + bank === 0 ? ' empty' : '')}
                    onClick={() => chooseSubtest(s.code)}
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
        </>
      )}

      {subtest && (
        <>
          {/* The picker collapses to its answer. Keeping the choice on screen matters more than
              keeping the grid: every setting below reads differently depending on it (the pace,
              the "Full subtest" length, whether Speed and Stretch appear at all), so the one
              thing that must stay visible is which subtest they are describing. */}
          <div className="afq-chosen">
            <div className="afq-chosen-id">
              <strong className="afq-chosen-name">{meta ? meta.name : subtest}</strong>
              <small className="afq-chosen-meta">
                {[
                  templates.length ? `${templates.length} templates` : null,
                  bankCount(subtest) ? `${bankCount(subtest)} in bank` : null,
                  meta ? `${secPerQuestion(meta).toFixed(1)}s / question` : null,
                ].filter(Boolean).join(' · ')}
              </small>
            </div>
            <button className="afq-btn afq-ghost" onClick={() => setSubtest(null)}>
              Change subtest
            </button>
          </div>

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
            {/* Was a stored setting with no way to reach it. Off by default now: filling your
                blanks hides that you ran out of time, and a lucky random mark inflates accuracy.
                Still offered, because on the real test a blank is strictly worse than a guess. */}
            <label className="afq-toggle">
              <input
                type="checkbox"
                checked={!!progress.settings.autoGuessOnTimeout}
                onChange={(e) => updateSettings({ autoGuessOnTimeout: e.target.checked })}
              />
              <span>
                Auto-guess anything still blank when the clock runs out
                <small>Off: blanks stay blank and are counted against you, which is what the real test does to an unmarked answer.</small>
              </span>
            </label>
          </>
        )}
      </section>

      {lowBand > 0 && (
        <section>
          <h3>Speed</h3>
          <button
            className={'afq-btn' + (speed ? ' afq-primary' : '')}
            onClick={() => {
              const on = !speed;
              setSpeed(on);
              // Speed and stretch are opposite goals - one drills material you already know for
              // pace, the other drills material above the test for depth. Never both.
              if (on) { setStretch(false); setMode('exam'); setPressure(0.6); }
            }}
            title="Bands 1-2 only, 40% less time than the real allotment"
          >
            {speed ? 'Speed drill: on' : `Speed drill (bands 1-2, ${lowBand} templates)`}
          </button>
          <p className="afq-note">
            The easy bands, answered fast. Not for learning words — for cutting the hesitation on
            ones you already half-know, which is what costs you the time you need on the hard
            items. Forces exam timing at 40% less than the real allotment.
          </p>
        </section>
      )}

      {hasStretch && !speed && (
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
        </>
      )}
    </div>
  );
}
