import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE, getSubtest, secPerQuestion, compositeReach, COMPOSITES } from '../engine/afoqtSpec';
import { templatesFor } from '../engine/generator';
import { allCompositeAccuracy, PRACTICE_ACCURACY_LABEL, subtestAccuracy, recentSubtestAccuracy, RECENT_RUN_WINDOW, subtestCompletion } from '../engine/scoring';
import { missPoolIds, clearMissPool, curriculumProgress, ExamSession, latestDiagnostic, wordBankEntries, flaggedEntries } from '../afoqtStorage';
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

/**
 * Subtests closed out on purpose rather than by score.
 *
 * Block Counting is 5 templates over a generated pile space with a 30-item declared bank; Trey
 * called it a non-issue and stopped spending time on it. A retired row reads SOLVED like an
 * earned one because the practical meaning is the same - nothing left to do here - but the
 * tooltip says which it is, because a dashboard that cannot tell "finished" from "abandoned" is
 * lying to the person reading it.
 */
const SUNSET = { BC: 'Retired by choice, not by score - you called this one a non-issue.' };

export default function AfoqtDashboard() {
  const navigate = useNavigate();
  const { progress, mutate, updateSettings } = useAfoqt();
  const misses = missPoolIds(progress);
  const words = wordBankEntries(progress);
  const flagged = flaggedEntries(progress);
  const days = daysUntil(TEST_DATE);

  // Goes through scoring.js rather than aggregating templateStats here. This view used to
  // duplicate that arithmetic inline, which is exactly why the "bank items are invisible" bug
  // existed in two places at once - see subtestStatKeys() for what was being missed.
  const bySubtest = DRILLABLE.map((s) => {
    // `seen` stays LIFETIME - it answers "how much have I done", which does not decay. Accuracy
    // and pace come from the last few drills instead: they answer "where do I stand now", and a
    // lifetime average buries recent improvement under every early rep (Trey, 2026-09-01).
    const { seen } = subtestAccuracy(progress, s.code);
    const recent = recentSubtestAccuracy(progress, s.code);
    // Capped subtests get a finish line; open ones cannot have one. See subtestCompletion().
    const done = subtestCompletion(progress, s.code, recent.accuracy);
    return {
      ...s,
      templates: templatesFor(s.code).length,
      seen,
      acc: recent.accuracy,
      recentRuns: recent.runs,
      avgSec: recent.seen ? recent.totalMs / recent.seen / 1000 : null,
      realSec: secPerQuestion(s),
      reach: compositeReach(s.code),
      done,
      sunset: SUNSET[s.code] ?? null,
      solved: done.solved || s.code in SUNSET,
    };
  });

  // A hidden subtest is hidden from THIS TABLE only. It is deliberately still counted in
  // `totalSeen` and in every composite below: hiding a row you have stopped worrying about must
  // not quietly change the numbers you are using to judge readiness.
  const hidden = new Set(progress.settings.hiddenSubtests ?? []);
  const shownSubtests = bySubtest.filter((s) => !hidden.has(s.code));
  const hiddenSubtests = bySubtest.filter((s) => hidden.has(s.code));
  const toggleHidden = (code) => updateSettings({
    hiddenSubtests: hidden.has(code)
      ? [...hidden].filter((c) => c !== code)
      : [...hidden, code],
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

      <section className="afq-next">
        <div>
          <h3>Study plan</h3>
          <p className="afq-note">
            The high-tier word list, {30} a day, in a fixed order — words to learn deliberately
            rather than meet by accident in a drill.
          </p>
        </div>
        <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/study')}>Open the plan</button>
      </section>

      {words.length > 0 && (
        <section className="afq-next">
          <div>
            <h3>Word bank</h3>
            <p className="afq-note">
              {words.length} word{words.length === 1 ? '' : 's'} you've actually gotten wrong on
              Word Knowledge - a real gap, not a lucky guess.
            </p>
          </div>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/words')}>Review</button>
        </section>
      )}

      {flagged.length > 0 && (
        <section className="afq-next">
          <div>
            <h3>Flagged questions</h3>
            <p className="afq-note">
              {flagged.length} question{flagged.length === 1 ? '' : 's'} you've flagged to come
              back to, right or wrong.
            </p>
          </div>
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/flagged')}>Review</button>
        </section>
      )}

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
        <div className="afq-subtest-wrap">
        <table className="afq-table afq-subtest-table">
          <thead>
            <tr>
              <th className="afq-hide-col"><span className="afq-sr-only">Hide</span></th>
              <th>Subtest</th>
              <th title="Which scored composites this subtest feeds. 'Unscored' means it feeds none - it is on the test but not in any composite you are graded on.">Composites</th>
              <th title="Seconds per question on the real test">Pace</th>
              <th title="Every distinct question this subtest can ever ask. 'Open' means the content is generated from parameters and never runs out.">Bank</th>
              <th title="Questions you have answered, all time - not the last 10 drills">Seen</th>
              <th title={`Your last ${RECENT_RUN_WINDOW} drills of this subtest, not your lifetime average`}>Recent accuracy</th>
              <th>Your pace</th>
            </tr>
          </thead>
          <tbody>
            {shownSubtests.map((s) => (
              <tr
                key={s.code}
                className={[s.templates === 0 ? 'afq-dim' : '', s.solved ? 'afq-solved' : ''].filter(Boolean).join(' ')}
              >
                <td className="afq-hide-col">
                  <button
                    type="button"
                    className="afq-hide-btn"
                    title={`Hide ${s.name} from this table`}
                    aria-label={`Hide ${s.name} from this table`}
                    onClick={() => toggleHidden(s.code)}
                  >
                    –
                  </button>
                </td>
                <td>{s.name}</td>
                <td className="afq-reach">{s.reach.length ? s.reach.join(' ') : 'unscored'}</td>
                <td className="afq-num">{s.realSec.toFixed(1)}s</td>
                {/* The finish line, for the subtests that can have one. A capped subtest shows
                    how much of its bank you have worked through; an open one says so rather than
                    showing a percentage of infinity. */}
                <td
                  className="afq-num afq-bank"
                  title={s.done.capped
                    ? `${s.done.generated} generated + ${s.done.banked} official = ${s.done.items} distinct questions`
                    : `${s.done.unbounded} of ${s.done.templates} templates are parameterised - this never runs out`}
                >
                  {s.done.capped
                    ? <>{s.done.items}<small>{s.done.coverage > 0 ? ` ${Math.round(s.done.coverage * 100)}%` : ''}</small></>
                    : <span className="afq-open">open</span>}
                </td>
                <td className="afq-num">{s.seen || '-'}</td>
                <td
                  className="afq-num afq-acc"
                  style={s.acc == null || s.solved ? undefined : { '--acc': s.acc }}
                  title={s.solved
                    ? (s.sunset ?? 'Whole bank attempted at 100% recent accuracy.')
                    : (s.recentRuns ? `over your last ${s.recentRuns} drill${s.recentRuns === 1 ? '' : 's'}` : undefined)}
                >
                  {s.solved
                    ? <strong className="afq-solved-tag">SOLVED</strong>
                    : (s.acc == null ? '-' : `${Math.round(s.acc * 100)}%`)}
                </td>
                <td className={s.avgSec && s.avgSec > s.realSec ? 'afq-over' : ''}>
                  {s.avgSec == null ? '-' : `${s.avgSec.toFixed(1)}s`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="afq-note">
          <strong>Bank</strong> is every distinct question a subtest can ask. Eight of the eleven
          are capped — their content is curated, so working through all of it is a real finish
          line, and the percentage is how much you have attempted. Math Knowledge, Arithmetic
          Reasoning and Table Reading are <em>open</em>: their questions are built from parameters
          and never repeat. A capped subtest reads <strong>SOLVED</strong> once you have attempted
          its whole bank at 100% recent accuracy.
        </p>
        {/* Hidden rows are listed rather than simply gone. A preference you cannot see is a
            preference you cannot undo, and "why is Block Counting missing" is a worse puzzle
            than one short line of chips. */}
        {hiddenSubtests.length > 0 && (
          <p className="afq-hidden-list">
            <span className="afq-note">Hidden:</span>
            {hiddenSubtests.map((s) => (
              <button
                key={s.code}
                type="button"
                className="afq-hidden-chip"
                title={`Show ${s.name} again`}
                onClick={() => toggleHidden(s.code)}
              >
                {s.name} <span aria-hidden="true">+</span>
              </button>
            ))}
          </p>
        )}
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
              </span>
              {/* A composite averages ONLY the subtests with data (scoring.js compositeAccuracy),
                  so a number here can come from half the composite and still look complete. The
                  old line said "50% of subtests attempted", which did not answer the obvious next
                  question - which half? Naming the untouched subtests makes the number readable
                  as what it is: a partial signal with a listed blind spot. */}
              {c.accuracy != null && c.coverage < 1 && (
                <small className="afq-composite-gap">
                  from {c.subtests.filter((r) => r.accuracy != null).map((r) => r.code).join(', ')} only
                  {' '}— no data yet for {c.subtests.filter((r) => r.accuracy == null).map((r) => r.code).join(', ')}
                </small>
              )}
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
