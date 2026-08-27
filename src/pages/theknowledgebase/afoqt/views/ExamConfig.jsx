import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { getSubtest, COMPOSITES } from '../engine/afoqtSpec';
import {
  EXAM_PLAN, examTestingMinutes, examBreakMinutes, examContentMinutes, OFFICIAL_TOTAL_MINUTES,
  newExamId, allExamCompositeAccuracy, EXAM_ACCURACY_LABEL,
} from '../engine/exam';
import { ExamSession } from '../afoqtStorage';

function formatMinutes(m) {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
}

/**
 * Entry point for the full-length Form T exam (PART 28) - the sequenced runner in
 * ExamRunner.jsx. This screen's job: show what a full run actually involves before someone
 * commits ~4 hours to it, let them resume one already in progress (ExamSession persists across
 * a page reload, see afoqtStorage.js), and surface past attempts so an exam run is not a
 * one-off number that vanishes the moment the summary screen is left.
 */
export default function ExamConfig() {
  const navigate = useNavigate();
  const { progress } = useAfoqt();
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const inProgress = ExamSession.load();
  const examRuns = progress.examRuns ?? [];

  const start = () => {
    const firstStep = EXAM_PLAN[0];
    const session = {
      schemaVersion: 1,
      examId: newExamId(),
      startedAt: new Date().toISOString(),
      stepIndex: 0,
      status: 'running',
      results: {},
      seed: firstStep.kind === 'subtest' ? (Math.floor(Math.random() * 0xffffffff) >>> 0) : null,
      answers: [],
      stepStartedAt: Date.now(),
      sdiTiming: false,
    };
    ExamSession.save(session);
    navigate('/TKB/afoqt/exam/run');
  };

  const abandonInProgress = () => {
    ExamSession.clear();
    setConfirmAbandon(false);
  };

  return (
    <div className="afq-config">
      <h2>Full-length exam</h2>
      <p className="afq-note">
        All 12 Form T subtests, in the real administration order, with the real breaks and the
        real per-subtest time budget - the honest baseline DrillConfig's "Full subtest" button
        gives you one subtest at a time, chained into one sitting.
      </p>

      {inProgress && inProgress.status === 'running' && (
        <section className="afq-next">
          <div>
            <h3>Exam in progress</h3>
            <p className="afq-note">
              Started {new Date(inProgress.startedAt).toLocaleString()} - step {inProgress.stepIndex + 1} of {EXAM_PLAN.length}
              {' '}({EXAM_PLAN[inProgress.stepIndex]?.label}).
            </p>
          </div>
          <div className="afq-row">
            <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/exam/run')}>Resume</button>
            {confirmAbandon
              ? (
                <span className="afq-row">
                  <span className="afq-note">Discard this attempt?</span>
                  <button className="afq-btn afq-ghost" onClick={abandonInProgress}>Yes, discard</button>
                  <button className="afq-btn" onClick={() => setConfirmAbandon(false)}>Cancel</button>
                </span>
              )
              : <button className="afq-btn afq-ghost" onClick={() => setConfirmAbandon(true)}>Discard</button>}
          </div>
        </section>
      )}

      {(!inProgress || inProgress.status !== 'running') && (
        <button className="afq-btn afq-primary afq-start" onClick={start}>Start the full exam</button>
      )}

      <section>
        <h3>What this involves</h3>
        <p className="afq-note">
          {examTestingMinutes()} minutes of timed content + {examBreakMinutes()} minutes of
          breaks = {formatMinutes(examContentMinutes())} simulated here. Real test day runs
          about {formatMinutes(OFFICIAL_TOTAL_MINUTES)} all-in - the difference is check-in,
          per-subtest instructions and the demographics page, which this tool does not simulate.
        </p>
        <ol className="afq-exam-steps">
          {EXAM_PLAN.map((s) => {
            const m = s.kind !== 'break' ? getSubtest(s.subtest) : null;
            return (
              <li key={s.index} className={'afq-exam-step afq-exam-step-' + s.kind}>
                <span className="afq-exam-step-label">{s.label}</span>
                <span className="afq-note">
                  {s.kind === 'break' ? `${s.minutes} min break` : `${m.questions} questions / ${s.minutes} min`}
                  {s.kind === 'sdi' && ' - not simulated, see the pass-through screen'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {examRuns.length > 0 && (
        <section>
          <h3>Past attempts</h3>
          <table className="afq-table">
            <thead><tr><th>Date</th><th>Subtests reached</th><th>Composites</th><th></th></tr></thead>
            <tbody>
              {examRuns.map((r) => {
                const reached = Object.keys(r.results ?? {}).length;
                const composites = allExamCompositeAccuracy(r.results ?? {}).filter((c) => c.accuracy != null);
                return (
                  <tr key={r.examId}>
                    <td>{new Date(r.startedAt).toLocaleDateString()}{r.aborted ? ' (ended early)' : ''}</td>
                    <td>{reached} / {EXAM_PLAN.filter((s) => s.kind === 'subtest').length}</td>
                    <td>
                      {composites.length
                        ? composites.map((c) => `${c.code} ${Math.round(c.accuracy * 100)}%`).join(' · ')
                        : '-'}
                    </td>
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="afq-note afq-score-disclaimer">{EXAM_ACCURACY_LABEL}</p>
        </section>
      )}

      <section>
        <h3>Composites this covers</h3>
        <p className="afq-note">
          {COMPOSITES.filter((c) => !c.disputed).map((c) => c.name).join(', ')}. Situational
          Judgment is disputed (docs/afoqt/RESEARCH.md) and is drilled in this exam but not
          scored into a composite here.
        </p>
      </section>
    </div>
  );
}
