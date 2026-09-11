import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { DRILLABLE_BY_PRIORITY, getSubtest, secPerQuestion, compositeReach, COMPOSITES,
  CAREERS, PRIORITY, subtestsForCareer, compositesForCareer } from '../engine/afoqtSpec';
import { templatesFor } from '../engine/generator';
import { depthVerdict, nonRepeatingRuns } from '../engine/inventory';
import { allCompositeAccuracy, PRACTICE_ACCURACY_LABEL, subtestAccuracy, recentSubtestAccuracy, RECENT_RUN_WINDOW, subtestCompletion } from '../engine/scoring';
import { missPoolIds, clearMissPool, curriculumProgress, ExamSession, latestDiagnostic, flaggedEntries } from '../afoqtStorage';
import { weakestSubtests } from '../engine/diagnostic';
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
  const flagged = flaggedEntries(progress);
  const days = daysUntil(TEST_DATE);

  // Goes through scoring.js rather than aggregating templateStats here. This view used to
  // duplicate that arithmetic inline, which is exactly why the "bank items are invisible" bug
  // existed in two places at once - see subtestStatKeys() for what was being missed.
  // Ordered by how much each subtest matters to HIS actual application list, not by test order.
  const bySubtest = DRILLABLE_BY_PRIORITY.map((s) => {
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
      depth: depthVerdict(s.code),
      runs: nonRepeatingRuns(s.code),
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

      <section>
        <h3>By subtest</h3>
        <div className="afq-subtest-wrap">
        <table className="afq-table afq-subtest-table">
          <thead>
            <tr>
              <th className="afq-hide-col"><span className="afq-sr-only">Hide</span></th>
              <th title="How much this subtest is worth to the eleven jobs you actually applied for, 0-10. Not a property of the AFOQT - a property of YOUR list.">Priority</th>
              <th>Subtest</th>
              <th title="Which scored composites this subtest feeds. 'Unscored' means it feeds none - it is on the test but not in any composite you are graded on.">Composites</th>
              <th title="Seconds per question on the real test">Pace</th>
              <th title="Every distinct question this subtest can ever ask. 'Open' means the content is generated from parameters and never runs out.">Bank</th>
              {/* The number that actually answers "is there enough here to prepare me". A bank is
                  not big or small on its own - it is big or small against the length of the real
                  subtest. 165 Reading Comprehension questions sounds ample until you divide by 25. */}
              <th title="How many full-length sittings of this subtest the bank can serve before it must repeat a question.">Depth</th>
              <th title="Questions you have answered, all time - not the last 10 drills">Seen</th>
              <th title={`Your last ${RECENT_RUN_WINDOW} drills of this subtest, not your lifetime average`}>Recent accuracy</th>
              <th>Your pace</th>
            </tr>
          </thead>
          <tbody>
            {shownSubtests.map((s) => (
              // The whole row opens the subtest's own page. Trey, 2026-09-11: "i want to be able
              // to just click in to the subtest FROM the dashboard to start choosing my study
              // option." The name cell is also a real <button> so this works from a keyboard and
              // reads as a control to a screen reader - a click handler on a <tr> alone does not.
              <tr
                key={s.code}
                className={['afq-subtest-row', s.templates === 0 ? 'afq-dim' : '', s.solved ? 'afq-solved' : ''].filter(Boolean).join(' ')}
                onClick={() => navigate(`/TKB/afoqt/subtest/${s.code}`)}
              >
                <td className="afq-hide-col">
                  <button
                    type="button"
                    className="afq-hide-btn"
                    title={`Hide ${s.name} from this table`}
                    aria-label={`Hide ${s.name} from this table`}
                    onClick={(e) => { e.stopPropagation(); toggleHidden(s.code); }}
                  >
                    –
                  </button>
                </td>
                <td className="afq-num">
                  <span className={'afq-prio afq-prio-' + (PRIORITY[s.code] >= 8 ? 'hi' : PRIORITY[s.code] >= 4 ? 'mid' : 'lo')}>
                    {PRIORITY[s.code] ?? 0}
                  </span>
                </td>
                <td>
                  <button type="button" className="afq-subtest-link" onClick={(e) => { e.stopPropagation(); navigate(`/TKB/afoqt/subtest/${s.code}`); }}>
                    {s.name}
                  </button>
                </td>
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
                <td className={`afq-num afq-depth afq-depth-${s.depth.level}`} title={s.depth.hint}>
                  {s.depth.level === 'open' ? '∞' : `${s.runs < 1 ? s.runs.toFixed(1) : Math.floor(s.runs)}×`}
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
        {/* Depth is the honest readiness number and it is the one that was missing. The bank
            column alone cannot tell you whether 165 questions is a lot, because that depends
            entirely on how long the subtest is. */}
        <p className="afq-note">
          <strong>Depth</strong> divides that bank by the subtest's real length, so it answers what
          the raw count cannot: how many full-length sittings you get before the bank has to repeat
          itself. <span className="afq-depth-open">∞</span> is an open subtest; a{' '}
          <span className="afq-depth-thin">red</span> figure means you will start recognising
          questions instead of solving them. <strong>Click any row</strong> for that subtest's own
          page — what is actually in it, where you stand, and every way to study it.
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

      {/* Everything that is not a subtest, in one compact strip.
          Trey, 2026-09-11: "The 4 section blocks at the top of the AFOQT dashboard are an
          eyesore and terrible and shouldn't be there." They were four full-width bars stacked
          above the only table on the page, so the thing he opens the dashboard to read was
          permanently below the fold. They are now one row of small cards, BELOW the subtest
          table, and the Study plan is gone from here entirely - it is a Word Knowledge surface
          and now lives on the Word Knowledge hub, which is where he went looking for it. */}
      <section className="afq-side">
        <h3>Everything else</h3>
        <div className="afq-side-grid">
          <button className="afq-side-card" onClick={() => navigate(nextChapter ? `/TKB/afoqt/learn/${nextChapter.id}` : '/TKB/afoqt/learn')}>
            <strong>Curriculum{diagnostic && <em className="afq-side-tag">personalized</em>}</strong>
            <span>
              {curriculum.done} of {curriculum.total} chapters done
              {curriculum.testedOut > 0 && ` (${curriculum.testedOut} tested out)`}
              {curriculum.minutesLeft > 0 && ` · ~${curriculum.minutesLeft} min of reading left`}
            </span>
            {nextChapter && <small>Next up: {nextChapter.title}</small>}
          </button>

          <button className="afq-side-card" onClick={() => navigate(diagnostic ? '/TKB/afoqt/diagnostic/results' : '/TKB/afoqt/diagnostic')}>
            <strong>Diagnostic</strong>
            <span>
              {diagnostic
                ? `Taken ${new Date(diagnostic.takenAt).toLocaleDateString()}`
                : 'Six questions at every subtest\u2019s real pace, about 35 minutes. Tells you where you actually stand.'}
            </span>
            {diagnostic && diagnosticWeakest.length > 0 && (
              <small>Weakest: {diagnosticWeakest.map((w) => getSubtest(w.code)?.name).join(', ')}</small>
            )}
          </button>

          {flagged.length > 0 && (
            <button className="afq-side-card" onClick={() => navigate('/TKB/afoqt/flagged')}>
              <strong>Flagged<em className="afq-side-tag">{flagged.length}</em></strong>
              <span>Questions you marked to come back to, right or wrong.</span>
            </button>
          )}

          {misses.length > 0 && (
            <div className="afq-side-card afq-side-static">
              <strong>Miss pool<em className="afq-side-tag">{misses.length}</em></strong>
              <span>
                About {Math.round((progress.settings.missInjection ?? 0.1) * 100)}% of each drill until you get them
                right on 3 separate days. Exam runs ignore the pool, so a baseline is always honest.
              </span>
              <button className="afq-btn afq-ghost" onClick={() => mutate(clearMissPool)}>Reset the pool</button>
            </div>
          )}
        </div>
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

      {/* The jobs he actually applied for, in his own submitted order, each with the subtests
          that decide it. This is what makes the priority column above meaningful rather than a
          generic "MK is important" - ten of these eleven are non-rated and are selected on
          Verbal + Quantitative, so RPA is single-handedly the reason the four rated-only
          subtests appear on his study plan at all. */}
      <section>
        <h3>Your OTS job list — and what each one is scored on</h3>
        <p className="afq-note">
          Your eleven applications in submitted order. <strong>Ten are non-rated</strong> and turn on
          Verbal + Quantitative plus Academic Aptitude. <strong>RPA is the only rated one</strong>, and
          it is the only reason Table Reading, Instrument Comprehension, Block Counting and
          Aviation Information are worth any of your time.
        </p>
        <div className="afq-subtest-wrap">
          <table className="afq-table afq-career-table">
            <thead>
              <tr>
                <th title="Your submitted preference order. The last two were left unranked on the form.">#</th>
                <th>Job</th>
                <th title="The AFOQT composites this job is selected on">Composites</th>
                <th title="Every subtest feeding those composites, most valuable first">Subtests that decide it</th>
              </tr>
            </thead>
            <tbody>
              {CAREERS.map((c) => (
                <tr key={c.name} className={c.rated ? 'afq-career-rated' : undefined}>
                  <td className="afq-num">{c.rank ?? '—'}</td>
                  <td>
                    {c.name}
                    {c.rated && <small className="afq-career-tag">rated</small>}
                  </td>
                  <td className="afq-reach">{compositesForCareer(c).join(' ')}</td>
                  <td>
                    {subtestsForCareer(c).map((code) => (
                      <span key={code} className={'afq-prio-chip afq-prio-' + (PRIORITY[code] >= 8 ? 'hi' : PRIORITY[code] >= 4 ? 'mid' : 'lo')}>
                        {code}<small>{PRIORITY[code]}</small>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="afq-note">
          Read it as: <strong>MK 10</strong> is the only subtest inside every composite you need, rated and
          non-rated. <strong>WK 9</strong> is the only other one that reaches both. <strong>VA / AR / RC 8</strong> are
          tied because each feeds exactly two of the non-rated composites that ten of your eleven jobs
          are scored on. <strong>TR 6</strong> is rated-only but sits in both of RPA's composites;
          <strong> IC / BC / AI 4</strong> are rated-only and in just one each. <strong>SJ 5</strong> is hedged —
          it is disputed, and if it counts it counts for all eleven. <strong>PS 0</strong> feeds nothing.
        </p>
        <p className="afq-note afq-score-disclaimer">
          AFOQT side only. A real board also weighs GPA and the whole-person score, and RPA adds the
          TBAS/PCSM — none of which this tool models.
        </p>
      </section>
    </div>
  );
}
