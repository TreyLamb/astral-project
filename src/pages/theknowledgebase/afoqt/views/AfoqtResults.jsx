import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { getSubtest } from '../engine/afoqtSpec';
import { latestDiagnostic } from '../afoqtStorage';
import {
  dailyAccuracy, practiceDays, currentStreakDays, examSittingSummaries, diagnosticVsNow,
} from '../engine/analytics';

const SPARK_DAYS = 14;

function formatShortDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Results & analytics (PART 30) - the trend-over-time view flagged as missing since Phase 0's
 * "Recommended deviation" and repeated in every one of PARTS 27-29's own "not done" notes.
 * Reshapes records those parts already write (`progress.runs`/`.examRuns`/`.diagnosticRuns`)
 * rather than tracking anything new - see engine/analytics.js.
 */
export default function AfoqtResults() {
  const navigate = useNavigate();
  const { progress } = useAfoqt();

  const runs = progress.runs ?? [];
  const examRuns = progress.examRuns ?? [];
  const diagnosticRuns = progress.diagnosticRuns ?? [];
  const hasAnything = runs.length > 0 || examRuns.length > 0 || diagnosticRuns.length > 0;

  if (!hasAnything) {
    return (
      <div className="afq-dash">
        <h2>Results</h2>
        <div className="afq-empty">
          <p>Nothing to show yet - trends need at least one drill, exam, or diagnostic first.</p>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/diagnostic')}>Take the diagnostic</button>
        </div>
      </div>
    );
  }

  const spark = dailyAccuracy(runs, SPARK_DAYS);
  const totalAnswered = [...runs, ...examRuns.flatMap((r) => Object.values(r.results ?? {})), ...diagnosticRuns.flatMap((r) => Object.values(r.results ?? {}))]
    .reduce((n, r) => n + (r.answered ?? 0), 0);
  const days = practiceDays(progress).size;
  const streak = currentStreakDays(progress);
  const sittings = examSittingSummaries(examRuns);
  const diagnostic = latestDiagnostic(progress);
  const comparison = diagnosticVsNow(diagnostic, progress);

  return (
    <div className="afq-dash">
      <h2>Results</h2>

      <div className="afq-stat-tiles">
        <div className="afq-stat-tile"><span>{days}</span><label>Practice days</label></div>
        <div className="afq-stat-tile"><span>{streak}</span><label>Current streak</label></div>
        <div className="afq-stat-tile"><span>{totalAnswered}</span><label>Questions answered</label></div>
        <div className="afq-stat-tile"><span>{examRuns.filter((r) => !r.aborted).length}</span><label>Exams completed</label></div>
      </div>

      <section>
        <h3 className="afq-note">Accuracy, last {SPARK_DAYS} days</h3>
        <div className="afq-spark">
          {spark.map((d) => (
            <div key={d.date} className="afq-spark-col">
              <div
                className="afq-spark-track"
                title={d.accuracy == null ? `${formatShortDate(d.date)}: no attempts` : `${formatShortDate(d.date)}: ${Math.round(d.accuracy * 100)}% (${d.correct}/${d.answered})`}
              >
                {d.accuracy != null && <div className="afq-spark-bar" style={{ height: `${Math.round(d.accuracy * 100)}%` }} />}
              </div>
            </div>
          ))}
        </div>
        <div className="afq-spark-labels">
          {spark.map((d, i) => (
            <span key={d.date}>
              {(i === 0 || i === spark.length - 1 || i === Math.floor(spark.length / 2)) ? formatShortDate(d.date) : ''}
            </span>
          ))}
        </div>
        <p className="afq-note">Days with no attempts are an empty track, not a zero - the two are different facts.</p>
      </section>

      {sittings.length > 0 && (
        <section>
          <h3 className="afq-note">Full exam sittings</h3>
          <table className="afq-table">
            <thead><tr><th>Date</th><th>Subtests reached</th><th>Overall accuracy</th></tr></thead>
            <tbody>
              {sittings.map((s) => (
                <tr key={s.examId}>
                  <td>{new Date(s.date).toLocaleDateString()}{s.aborted ? ' (ended early)' : ''}</td>
                  <td>{s.reached} / 11</td>
                  <td>{s.accuracy == null ? '-' : `${Math.round(s.accuracy * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {comparison.length > 0 && (
        <section>
          <h3 className="afq-note">Since your diagnostic ({new Date(diagnostic.takenAt).toLocaleDateString()})</h3>
          <table className="afq-table">
            <thead><tr><th>Subtest</th><th>Then</th><th>Now</th><th>Change</th></tr></thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.code}>
                  <td>{getSubtest(c.code)?.name ?? c.name}</td>
                  <td>{Math.round(c.then * 100)}%</td>
                  <td>{c.now == null ? 'no practice since' : `${Math.round(c.now * 100)}%`}</td>
                  <td className={c.delta != null && c.delta < 0 ? 'afq-over' : ''}>
                    {c.delta == null ? '-' : `${c.delta > 0 ? '+' : ''}${Math.round(c.delta * 100)}pt`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
