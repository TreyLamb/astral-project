import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { getSubtest, COMPOSITES } from '../engine/afoqtSpec';
import {
  DIAGNOSTIC_SUBTESTS, allDiagnosticCompositeAccuracy, DIAGNOSTIC_ACCURACY_LABEL,
  weakestSubtests, subtestTier,
} from '../engine/diagnostic';
import { CHAPTERS } from '../curriculum/chapters';
import { nextPersonalizedChapter } from '../curriculum/personalize';

/**
 * The one place a diagnostic result is rendered. Used both right after finishing
 * (DiagnosticRunner's 'report' phase, which also knows `totalMin`) and later from
 * DiagnosticResults.jsx (reads the same stored run back out of `progress.diagnosticRuns` any
 * time, `takenAt` only) - so "start my curriculum" and the full breakdown are never a one-shot
 * screen that vanishes once you navigate away.
 */
export default function DiagnosticReport({ results, takenAt, totalMin }) {
  const navigate = useNavigate();
  const { progress } = useAfoqt();
  const composites = allDiagnosticCompositeAccuracy(results);
  const weakest = weakestSubtests(results, 3);
  const strong = DIAGNOSTIC_SUBTESTS
    .map((s) => ({ code: s.code, tier: subtestTier(results, s.code) }))
    .filter((s) => s.tier === 'strong');
  const startChapter = nextPersonalizedChapter(CHAPTERS, progress, results);

  return (
    <div className="afq-runner afq-summary">
      <h2>Diagnostic results</h2>
      {takenAt && (
        <p className="afq-note">
          Taken {new Date(takenAt).toLocaleString()}
          {totalMin != null && ` · finished in about ${totalMin} minute${totalMin === 1 ? '' : 's'}`}.
        </p>
      )}
      <p className="afq-note afq-score-disclaimer">{DIAGNOSTIC_ACCURACY_LABEL}</p>

      {startChapter && (
        <section className="afq-next afq-next-primary">
          <div>
            <h3>Start your personalized curriculum</h3>
            <p className="afq-next-title">
              Chapters are ordered weakest-subtest-first from this result
              {strong.length > 0 && `, with expedited test-outs and mastery checks in ${strong.map((s) => getSubtest(s.code)?.name).join(', ')}`}.
              Next up: <strong>{startChapter.title}</strong>.
            </p>
          </div>
          <button className="afq-btn afq-primary" onClick={() => navigate(`/TKB/afoqt/learn/${startChapter.id}`)}>
            Start: {startChapter.title}
          </button>
        </section>
      )}

      {weakest.length > 0 && (
        <section className="afq-next">
          <div>
            <h3>Where to focus first</h3>
            <p className="afq-next-title">
              {weakest.map((w) => `${getSubtest(w.code)?.name} (${Math.round(w.accuracy * 100)}%)`).join(' · ')}
            </p>
          </div>
          <button className="afq-btn" onClick={() => navigate(`/TKB/afoqt/drill?subtest=${weakest[0].code}`)}>
            Drill {getSubtest(weakest[0].code)?.name}
          </button>
        </section>
      )}

      <section>
        <h3 className="afq-note">By subtest</h3>
        <table className="afq-table">
          <thead><tr><th>Subtest</th><th>Score</th><th>Accuracy</th></tr></thead>
          <tbody>
            {DIAGNOSTIC_SUBTESTS.map((s) => {
              const r = results[s.code];
              return (
                <tr key={s.code}>
                  <td>{s.name}</td>
                  <td>{r ? `${r.correct} / ${r.answered}` : '-'}</td>
                  <td>{r ? `${Math.round((r.correct / r.answered) * 100)}%` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="afq-note">Composites</h3>
        <ul className="afq-composites">
          {composites.map((c) => (
            <li key={c.code}>
              <strong>{c.name}</strong>
              <span>{COMPOSITES.find((x) => x.code === c.code).subtests.join(' + ')}</span>
              <span className="afq-composite-acc">
                {c.accuracy == null ? 'not reached' : `${Math.round(c.accuracy * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="afq-row">
        <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/learn')}>Curriculum map</button>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt')}>Dashboard</button>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/diagnostic')}>Retake diagnostic</button>
      </div>
    </div>
  );
}
