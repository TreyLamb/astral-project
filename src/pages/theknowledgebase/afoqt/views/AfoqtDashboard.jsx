import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE, getSubtest, secPerQuestion, compositeReach, COMPOSITES } from '../engine/afoqtSpec';
import { templatesFor } from '../engine/generator';
import { allCompositeAccuracy, PRACTICE_ACCURACY_LABEL, subtestAccuracy } from '../engine/scoring';
import { missPoolIds, clearMissPool, curriculumProgress, ExamSession, latestDiagnostic } from '../afoqtStorage';
import { weakestSubtests, DIAGNOSTIC_ACCURACY_LABEL } from '../engine/diagnostic';
import { CHAPTERS } from '../curriculum/chapters';
import { nextPersonalizedChapter } from '../curriculum/personalize';

// Days until the test. Trey sits it in early October 2026, and policy is 2 lifetime
// attempts 150 days apart - so there is no second attempt this year. The countdown is
// here because that fact should not be easy to forget.
const TEST_DATE = '2026-10-01';

function daysUntil(iso) {
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

export default function AfoqtDashboard() {
  const navigate = useNavigate();
  const { progress, mutate } = useAfoqt();
  const misses = missPoolIds(progress);
  const days = daysUntil(TEST_DATE);

  // Goes through scoring.js rather than aggregating templateStats here. This view used to
  // duplicate that arithmetic inline, which is exactly why the "bank items are invisible" bug
  // existed in two places at once - see subtestStatKeys() for what was being missed.
  const bySubtest = DRILLABLE.map((s) => {
    const { seen, accuracy, totalMs } = subtestAccuracy(progress, s.code);
    return {
      ...s,
      templates: templatesFor(s.code).length,
      seen,
      acc: accuracy,
      avgSec: seen ? totalMs / seen / 1000 : null,
      realSec: secPerQuestion(s),
      reach: compositeReach(s.code),
    };
  });

  const totalSeen = bySubtest.reduce((n, s) => n + s.seen, 0);

  const composites = allCompositeAccuracy(progress);
  const curriculum = curriculumProgress(progress, CHAPTERS);
  const examInProgress = ExamSession.load()?.status === 'running';
  const diagnostic = latestDiagnostic(progress);
  const diagnosticWeakest = diagnostic ? weakestSubtests(diagnostic.results, 3) : [];
  // The next thing to actually do: the first unlocked, unfinished chapter - weakest-diagnostic-
  // subtest-first once a diagnostic exists, standard `order` otherwise (see curriculum/personalize.js).
  const nextChapter = nextPersonalizedChapter(CHAPTERS, progress, diagnostic?.results ?? null);

  return (
    <div className="afq-dash">
      <header className="afq-dash-head">
        <div>
          <h2>AFOQT</h2>
          <p className="afq-note">
            {days > 0 ? `${days} days out` : 'test date passed'} · 2 lifetime attempts, 150 days apart
          </p>
        </div>
        <div className="afq-row">
          {examInProgress && (
            <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/exam/run')}>Resume exam</button>
          )}
          <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/exam')}>Full exam</button>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/drill')}>Start a drill</button>
        </div>
      </header>

      {totalSeen === 0 && !diagnostic && (
        <div className="afq-empty">
          <p>
            No attempts recorded yet. Rather than guessing where to start, take the{' '}
            <strong>diagnostic</strong> — six questions at every subtest's real pace, about 35
            minutes, tells you where you actually stand before committing to a curriculum.
          </p>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/diagnostic')}>
            Take the diagnostic
          </button>
        </div>
      )}

      {diagnostic && (
        <section className="afq-next">
          <div>
            <h3>Diagnostic</h3>
            <p className="afq-note">
              Taken {new Date(diagnostic.takenAt).toLocaleDateString()}. {DIAGNOSTIC_ACCURACY_LABEL}
            </p>
            {diagnosticWeakest.length > 0 && (
              <p className="afq-next-title">
                Weakest: {diagnosticWeakest.map((w) => `${getSubtest(w.code)?.name} (${Math.round(w.accuracy * 100)}%)`).join(' · ')}
              </p>
            )}
          </div>
          <div className="afq-row">
            {diagnosticWeakest.length > 0 && (
              <button
                className="afq-btn afq-primary"
                onClick={() => navigate(`/TKB/afoqt/drill?subtest=${diagnosticWeakest[0].code}`)}
              >
                Drill {getSubtest(diagnosticWeakest[0].code)?.name}
              </button>
            )}
            <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/diagnostic/results')}>Full results</button>
            <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/diagnostic')}>Retake</button>
          </div>
        </section>
      )}

      <section className="afq-next">
        <div>
          <h3>Curriculum{diagnostic && <span className="afq-chip">personalized</span>}</h3>
          <p className="afq-note">
            {curriculum.done} of {curriculum.total} chapters done
            {curriculum.testedOut > 0 && ` (${curriculum.testedOut} tested out)`}
            {curriculum.minutesLeft > 0 && ` · ~${curriculum.minutesLeft} min of reading left`}
          </p>
          {nextChapter && (
            <p className="afq-next-title">
              Next up: <strong>{nextChapter.title}</strong> — {nextChapter.summary}
            </p>
          )}
        </div>
        <button
          className="afq-btn afq-primary"
          onClick={() => navigate(nextChapter ? `/TKB/afoqt/learn/${nextChapter.id}` : '/TKB/afoqt/learn')}
        >
          {nextChapter ? 'Open the chapter' : 'Browse chapters'}
        </button>
      </section>

      {misses.length > 0 && (
        <p className="afq-note afq-misspool">
          <span>
            {misses.length} template{misses.length === 1 ? '' : 's'} in the miss pool — about{' '}
            {Math.round((progress.settings.missInjection ?? 0.1) * 100)}% of each drill until you
            get them right on 3 separate days. Exam runs ignore the pool, so a baseline is always honest.
          </span>
          {/* The manual half of requirement 12's clean slate. The automatic half is exam mode. */}
          <button className="afq-btn afq-ghost" onClick={() => mutate(clearMissPool)}>Reset the pool</button>
        </p>
      )}

      <section>
        <h3>By subtest</h3>
        <table className="afq-table">
          <thead>
            <tr><th>Subtest</th><th>Composites</th><th>Pace</th><th>Seen</th><th>Accuracy</th><th>Your pace</th></tr>
          </thead>
          <tbody>
            {bySubtest.map((s) => (
              <tr key={s.code} className={s.templates === 0 ? 'afq-dim' : ''}>
                <td>{s.name}</td>
                <td className="afq-reach">{s.reach.length ? s.reach.join(' ') : 'unscored'}</td>
                <td>{s.realSec.toFixed(1)}s</td>
                <td>{s.seen || '-'}</td>
                <td>{s.acc == null ? '-' : `${Math.round(s.acc * 100)}%`}</td>
                <td className={s.avgSec && s.avgSec > s.realSec ? 'afq-over' : ''}>
                  {s.avgSec == null ? '-' : `${s.avgSec.toFixed(1)}s`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Composites</h3>
        <p className="afq-note afq-score-disclaimer">
          {PRACTICE_ACCURACY_LABEL}
        </p>
        <ul className="afq-composites">
          {composites.map((c) => (
            <li key={c.code}>
              <strong>{c.name}</strong>
              <span>{COMPOSITES.find((x) => x.code === c.code).subtests.join(' + ')}</span>
              <span className="afq-composite-acc">
                {c.accuracy == null
                  ? 'no attempts yet'
                  : `${Math.round(c.accuracy * 100)}% practice accuracy`}
                {c.coverage < 1 && c.accuracy != null
                  && ` (${Math.round(c.coverage * 100)}% of subtests attempted)`}
              </span>
              {COMPOSITES.find((x) => x.code === c.code).min != null && (
                <small>official minimum: {COMPOSITES.find((x) => x.code === c.code).min}th percentile — not the same scale as the accuracy above</small>
              )}
            </li>
          ))}
        </ul>
        <p className="afq-note">
          Math Knowledge feeds five composites and Table Reading all three rated ones, so
          work there carries furthest. Physical Science and the Self-Description Inventory
          feed none. Situational Judgment is disputed - treat it as probably scored.
        </p>
      </section>
    </div>
  );
}
