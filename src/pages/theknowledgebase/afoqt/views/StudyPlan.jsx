import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { allWords } from '../engine/words';
import { mulberry32, shuffle } from '../../engine/rng';

// A day-by-day list of high-tier words to learn deliberately, outside of any drill.
//
// Trey's request, 2026-09-02: "i want 30x22 words compiled so i can intentionally study them,
// randomly picked from the HIGHEST band". Bands 4-5 only, because his ranking puts everything
// below that at or under material he already half-knows - bands 1-2 get the speed drill on the
// Build-a-drill screen instead, which trains recall pace rather than teaching new words.
//
// WHY THE ORDER IS SEEDED AND NOT RANDOM PER VISIT. A study plan you cannot return to is not a
// plan. `mulberry32(PLAN_SEED)` deals the same shuffle every time the page opens, on any device,
// so "day 4" means the same thirty words tomorrow as it did today. Adding words to the bank
// reshuffles the whole deal, which is correct - a new word has to land somewhere - but the
// contents of a day are stable for as long as the bank is.
const PLAN_SEED = 0x41464f51; // "AFOQ"
const PER_DAY = 30;
const DAYS = 22;

export default function StudyPlan() {
  const navigate = useNavigate();
  const { progress, updateSettings } = useAfoqt();
  const done = new Set(progress.settings.studyDaysDone ?? []);

  const { days, pool } = useMemo(() => {
    const high = allWords().filter((w) => w.band >= 4);
    const dealt = shuffle([...high], mulberry32(PLAN_SEED));
    const out = [];
    for (let i = 0; i < dealt.length; i += PER_DAY) out.push(dealt.slice(i, i + PER_DAY));
    return { days: out, pool: high.length };
  }, []);

  const toggleDay = (i) => updateSettings({
    studyDaysDone: done.has(i) ? [...done].filter((d) => d !== i) : [...done, i],
  });

  const target = PER_DAY * DAYS;

  return (
    <div className="afq-study">
      <header className="afq-dash-head">
        <div>
          <h2>Study plan</h2>
          <p className="afq-note">
            {pool} high-tier words (bands 4 and 5), dealt {PER_DAY} a day. The order is fixed, so
            day {days.length > 3 ? 4 : 1} means the same words tomorrow as it does today.
          </p>
        </div>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/drill?subtest=WK')}>Drill these</button>
      </header>

      {/* The gap is stated rather than hidden. A plan that silently covers a quarter of what was
          asked for reads as a finished plan, and the next honest number would not arrive until
          he ran out of days mid-study. */}
      {pool < target && (
        <p className="afq-study-gap">
          <strong>{days.length} of {DAYS} days are filled.</strong> A full {PER_DAY}×{DAYS} plan
          needs {target} words and the bank holds {pool} at bands 4–5. The remaining candidates
          are already sourced and sitting in <code>data/wordCandidates.csv</code> — they need
          authoring (a gloss, four named wrong answers and a real confusable each) before they
          can appear here.
        </p>
      )}

      <ol className="afq-study-days">
        {days.map((words, i) => (
          <li key={i} className={done.has(i) ? 'afq-day-done' : ''}>
            <div className="afq-day-head">
              <label className="afq-toggle afq-day-check">
                <input type="checkbox" checked={done.has(i)} onChange={() => toggleDay(i)} />
                <span><strong>Day {i + 1}</strong> <small>{words.length} words</small></span>
              </label>
            </div>
            <table className="afq-table afq-study-table">
              <thead>
                <tr><th>Word</th><th>Band</th><th>Means</th><th>Not to be confused with</th></tr>
              </thead>
              <tbody>
                {words.map((w) => (
                  <tr key={w.id}>
                    <td><strong>{w.word}</strong> <small className="afq-note">{w.pos}</small></td>
                    <td className="afq-num">{w.band}</td>
                    <td>{w.gloss}</td>
                    <td className="afq-note"><em>{w.confusable.word}</em> — {w.confusable.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </li>
        ))}
      </ol>
    </div>
  );
}
