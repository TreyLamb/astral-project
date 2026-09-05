import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE_BY_PRIORITY, getSubtest, secPerQuestion, compositeReach, PRIORITY, TEST_LEVEL_BAND } from '../engine/afoqtSpec';
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
    return requested && DRILLABLE_BY_PRIORITY.some((s) => s.code === requested) ? requested : null;
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

  // Difficulty. Trey, 2026-09-04: "By band or something so if I want easier words I do an easier
  // band." The engine has supported a band filter all along - `assembleDrill({ bands })`, reached
  // through `?bands=` - but the only thing that ever set it was the Speed toggle, so the control
  // existed and was unreachable. `null` means every band.
  const bandsAvailable = [...new Set(templates.map((t) => t.band))].sort();
  const bandCount = (b) => templates.filter((t) => t.band === b).length;

  // TEST LEVEL IS THE DEFAULT, not "everything". Trey, 2026-09-05: "I want the tool to default to
  // only the bands that are on the test or higher. I only want to choose the lower bands for
  // specific reasons."
  //
  // Band 3 is about where the real AFOQT sits; 1-2 are below it. Defaulting to all bands meant a
  // third of every drill was material he had already told us was beneath the level he needs -
  // which is the opposite of what the priority work was for. Bands below 3 are now opt-in.
  const testLevelBands = bandsAvailable.filter((b) => b >= TEST_LEVEL_BAND);
  const defaultBands = testLevelBands.length ? testLevelBands : bandsAvailable;
  // Multi-select: a set of chosen bands, not one. "I want to be able to choose multiple bands."
  const [bands, setBands] = useState(defaultBands);

  const toggleBand = (b) => {
    if (speed) setSpeed(false);
    setBands((cur) => {
      const next = cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b].sort();
      // Never let the picker reach zero bands - a drill of nothing is not a state worth being in,
      // and the last band tapped off is almost always a mis-tap.
      return next.length ? next : cur;
    });
  };
  const allSelected = bandsAvailable.every((b) => bands.includes(b));
  const isDefault = bands.length === defaultBands.length && defaultBands.every((b) => bands.includes(b));

  // Picking a subtest resets the run length. "Full subtest" sets `count` to that subtest's own
  // question count, and carrying 40 over from Table Reading into a 25-question Word Knowledge
  // drill silently builds a run the chosen subtest never administers.
  const chooseSubtest = (code) => {
    if (code !== subtest) {
      setCount(5); setSpeed(false); setStretch(false);
      const avail = [...new Set(templatesFor(code).map((t) => t.band))].sort();
      const atLevel = avail.filter((b) => b >= TEST_LEVEL_BAND);
      setBands(atLevel.length ? atLevel : avail);
    }
    setSubtest(code);
  };

  const start = () => {
    updateSettings({ mode, pressure });
    const q = new URLSearchParams({ subtest, count, mode, pressure });
    if (stretch) q.set('stretch', '1');
    // Speed pins bands 1-2 as part of what it is; otherwise the difficulty picker decides. Only
    // omitted when every band is selected, where a filter would be a no-op.
    if (speed) q.set('bands', '1,2');
    else if (bands.length && !bandsAvailable.every((b) => bands.includes(b))) q.set('bands', bands.join(','));
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
              {/* Most valuable to HIS eleven applications first, not test order - see PRIORITY. */}
              {DRILLABLE_BY_PRIORITY.map((s) => {
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
                    <small>
                      <span className={'afq-prio afq-prio-' + (PRIORITY[s.code] >= 8 ? 'hi' : PRIORITY[s.code] >= 4 ? 'mid' : 'lo')}>
                        {PRIORITY[s.code] ?? 0}
                      </span>
                      {' '}priority · {secPerQuestion(s).toFixed(1)}s / question
                    </small>
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

      {bandsAvailable.length > 1 && (
            <section>
              <h3>Difficulty</h3>
              {/* MULTI-SELECT. Each band is an independent toggle, so any combination is reachable
                  - band 4 alone, 4+5, or 3+4+5. The default is test level and up; the low bands
                  are opt-in and say so on their own faces. */}
              <div className="afq-row afq-wrap-row">
                {bandsAvailable.map((b) => {
                  const on = !speed && bands.includes(b);
                  const below = b < TEST_LEVEL_BAND;
                  return (
                    <button
                      key={b}
                      className={'afq-btn afq-bandbtn' + (on ? ' afq-primary' : '') + (below ? ' afq-band-below' : '')}
                      onClick={() => toggleBand(b)}
                      aria-pressed={on}
                      title={`${bandCount(b)} templates at band ${b}${below ? ' - below the level the test asks' : ''}`}
                    >
                      Band {b}{below && <small> below test</small>}
                    </button>
                  );
                })}
              </div>
              <div className="afq-row afq-wrap-row afq-band-presets">
                <button
                  className={'afq-btn afq-ghost' + (isDefault && !speed ? ' afq-band-ison' : '')}
                  onClick={() => { setSpeed(false); setBands(defaultBands); }}
                >
                  Test level and up{defaultBands.length ? ` (${defaultBands.join(', ')})` : ''}
                </button>
                <button
                  className={'afq-btn afq-ghost' + (allSelected && !speed ? ' afq-band-ison' : '')}
                  onClick={() => { setSpeed(false); setBands(bandsAvailable); }}
                >
                  All bands
                </button>
              </div>
              <p className="afq-note">
                Band 3 is about where the real test sits, 4 is the level worth owning, 5 is
                deliberately above it. <strong>Bands 1-2 are below what the AFOQT asks</strong> and are
                off by default — they are not for learning, and their speed practice lives in the
                flashcards below. Every item inside the bands you pick is equally likely.
              </p>
            </section>
          )}

          {lowBand > 0 && (
        <section>
          <h3>Speed — the low bands</h3>
          {/* Trey, 2026-09-05: "the lower bands were supposed to have their own flash card style
              speed run." On Word Knowledge that is now literally what it is - a flashcard deck of
              the band 1-2 words, one tap per card, no five-option slate and no scoring. The point
              was never to TEST him on words he already knows; it is to cut the hesitation, and a
              graded multiple-choice drill is the slowest possible way to practise that.

              Other subtests keep the timed drill, because "flashcard" does not mean anything for a
              Table Reading lookup or a Block Counting pile - there is no front and back. */}
          {subtest === 'WK' ? (
            <>
              <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/cards?deck=speed')}>
                Open flashcard speed run
              </button>
              <p className="afq-note">
                Bands 1-2, as fast cards rather than a drill. One tap per word, no scoring — this is
                for cutting hesitation on words you already half-know, which is what costs you the
                time you need on the hard items. The drill above stays at test level.
              </p>
            </>
          ) : (
            <>
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
                The easy bands, answered fast, at 40% less than the real allotment. Not for learning
                — for cutting hesitation on items you already half-know.
              </p>
            </>
          )}
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
