import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE, getSubtest, secPerQuestion, compositeReach, COMPOSITES } from '../engine/afoqtSpec';
import { allTemplates } from '../engine/generator';
import { allCompositeAccuracy, PRACTICE_ACCURACY_LABEL } from '../engine/scoring';
import { missPoolIds, clearMissPool, curriculumProgress, isChapterDone } from '../afoqtStorage';
import { CHAPTERS, isUnlocked } from '../curriculum/chapters';

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
  const stats = progress.templateStats ?? {};
  const misses = missPoolIds(progress);
  const days = daysUntil(TEST_DATE);

  const bySubtest = DRILLABLE.map((s) => {
    const ids = allTemplates().filter((t) => t.subtest === s.code).map((t) => t.id);
    const seen = ids.reduce((n, id) => n + (stats[id]?.seen ?? 0), 0);
    const correct = ids.reduce((n, id) => n + (stats[id]?.correct ?? 0), 0);
    const totalMs = ids.reduce((n, id) => n + (stats[id]?.totalMs ?? 0), 0);
    return {
      ...s,
      templates: ids.length,
      seen,
      acc: seen ? correct / seen : null,
      avgSec: seen ? totalMs / seen / 1000 : null,
      realSec: secPerQuestion(s),
      reach: compositeReach(s.code),
    };
  });

  const totalSeen = bySubtest.reduce((n, s) => n + s.seen, 0);

  const composites = allCompositeAccuracy(progress);
  const curriculum = curriculumProgress(progress, CHAPTERS);
  // The next thing to actually do: the first unlocked chapter that is not finished. Ordering
  // by `order` keeps the recommendation stable rather than jumping around between visits.
  const nextChapter = CHAPTERS
    .filter((c) => !isChapterDone(progress, c.id) && isUnlocked(c, progress.chapters ?? {}))
    .sort((a, b) => a.order - b.order)[0] ?? null;

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
          <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/exam')}>Full exam</button>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/drill')}>Start a drill</button>
        </div>
      </header>

      {totalSeen === 0 && (
        <div className="afq-empty">
          <p>No attempts recorded yet. Run a drill to seed your weak-area map.</p>
        </div>
      )}

      <section className="afq-next">
        <div>
          <h3>Curriculum</h3>
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
