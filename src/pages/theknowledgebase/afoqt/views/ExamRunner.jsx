import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import {
  EXAM_STEPS, EXAM_TOTAL_MINUTES, buildExamQuestions, examComposites, examOverall,
  PRACTICE_ACCURACY_LABEL,
} from '../engine/exam';
import { getSubtest, compositeReach } from '../engine/afoqtSpec';
import { paceBudget, paceCheck, shouldNudgeAbandon, shouldWarnGuessSweep, formatClock } from '../engine/timing';
import { addExamRun } from '../afoqtStorage';
import Figure from '../render/Figure';
import { mulberry32 } from '../../engine/rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Resume checkpoints land only at STEP boundaries (before/after a subtest, break, or info
// screen), never mid-subtest. A per-question checkpoint would need to serialize the exact
// generated question queue and replay React state precisely; a per-step one needs three plain
// numbers and a results map. The cost is real but bounded: a reload mid-subtest loses at most
// that one subtest (worst case ~38 minutes, Reading Comprehension) - every subtest completed
// before it is safe. A 3.5-hour sitting with NO resume at all was the alternative, and losing
// the whole thing to one accidental tab close is a worse failure than re-taking one subtest.
const SAVE_KEY = 'afoqt_exam_inprogress_v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveCheckpoint(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* not fatal - resume just won't work */ }
}
function clearCheckpoint() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing to clean up */ }
}

function fmtMinutes(total) {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function ExamRunner() {
  const navigate = useNavigate();
  const { mutate } = useAfoqt();

  const [phase, setPhase] = useState('intro'); // intro | running | report
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => { setSaved(loadSaved()); }, []);

  const begin = (fresh) => {
    if (fresh || !saved) {
      setStepIndex(0);
      setResults({});
      setStartedAt(Date.now());
      clearCheckpoint();
    } else {
      setStepIndex(saved.stepIndex);
      setResults(saved.results);
      setStartedAt(saved.startedAt);
    }
    setPhase('running');
  };

  const abandon = () => {
    if (!window.confirm('Abandon this exam sitting? All progress in this attempt - including completed subtests - will be discarded.')) return;
    clearCheckpoint();
    setResults({});
    setStepIndex(0);
    setSaved(null);
    setPhase('intro');
  };

  // Advances to the next step, folding a finished subtest's result (if any - breaks and the
  // SDI info screen pass null) into the running results map. On the LAST step this is where
  // the sitting is recorded to progress.examRuns and the resume checkpoint is cleared - not on
  // an unmount, so an abandoned tab never silently records a partial sitting as complete.
  const advance = useCallback((code, stepResult) => {
    const next = stepResult ? { ...results, [code]: stepResult } : results;
    const nextIndex = stepIndex + 1;
    setResults(next);
    if (nextIndex >= EXAM_STEPS.length) {
      const endedAt = Date.now();
      mutate((p) => addExamRun(p, {
        id: endedAt.toString(36),
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        totalMs: endedAt - startedAt,
        results: next,
      }));
      clearCheckpoint();
      setPhase('report');
    } else {
      saveCheckpoint({ stepIndex: nextIndex, results: next, startedAt });
    }
    setStepIndex(nextIndex);
  }, [results, stepIndex, startedAt, mutate]);

  if (phase === 'intro') {
    return (
      <div className="afq-runner afq-exam-intro">
        <h2>Full-length Form T exam</h2>
        <p className="afq-note">
          All 12 subtests, in the real administration order, at the real per-subtest time -{' '}
          {fmtMinutes(EXAM_TOTAL_MINUTES)} total, including both breaks and the
          Self-Description Inventory's own slot. This is a MEASUREMENT, not practice: no
          miss-pool weighting, no stretch content, and no pausing mid-subtest.
        </p>
        <ol className="afq-exam-sequence">
          {EXAM_STEPS.map((s, i) => {
            const meta = s.code ? getSubtest(s.code) : null;
            return (
              <li key={i} className={'afq-exam-step afq-exam-step-' + s.type}>
                {s.type === 'break'
                  ? `Break - ${s.minutes} min - ${s.label}`
                  : s.type === 'info'
                    ? `${meta?.name} - not scored, not drillable (see below)`
                    : `${meta?.name} - ${meta?.questions}q / ${meta?.minutes}:00`}
              </li>
            );
          })}
        </ol>
        <p className="afq-note">
          {PRACTICE_ACCURACY_LABEL} The report at the end is percent correct on this one
          sitting - never the real norm-referenced percentile, which this tool has no way to
          compute (see the Dashboard's Composites section).
        </p>
        <p className="afq-note">
          Breaks and the Self-Description Inventory screen show a real countdown but never force
          you to wait - skip either whenever you are ready. A reload mid-subtest loses that one
          subtest only; everything completed before it is saved.
        </p>
        <div className="afq-row">
          {saved && (
            <button className="afq-btn afq-primary" onClick={() => begin(false)}>
              Resume ({saved.stepIndex} / {EXAM_STEPS.length} steps done)
            </button>
          )}
          <button className={'afq-btn' + (saved ? '' : ' afq-primary')} onClick={() => begin(true)}>
            {saved ? 'Start over instead' : 'Begin the full exam'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'report') {
    const composites = examComposites(results);
    const overall = examOverall(results);
    const sjt = composites.find((c) => c.disputed);
    return (
      <div className="afq-runner afq-summary afq-exam-report">
        <h2>Exam complete</h2>
        <div className="afq-summary-grid">
          <div><span>{overall.correct} / {overall.total}</span><label>Scored subtests</label></div>
          <div>
            <span>{overall.accuracy == null ? '-' : `${Math.round(overall.accuracy * 100)}%`}</span>
            <label>Overall accuracy</label>
          </div>
        </div>

        <section>
          <h3>By subtest</h3>
          <table className="afq-table">
            <thead><tr><th>Subtest</th><th>Score</th><th>Feeds</th></tr></thead>
            <tbody>
              {Object.entries(results).map(([code, r]) => (
                <tr key={code}>
                  <td>{getSubtest(code)?.name ?? code}</td>
                  <td>{r.correct} / {r.total}</td>
                  <td className="afq-reach">{compositeReach(code).join(' ') || 'unscored'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Composites - this sitting</h3>
          <p className="afq-note afq-score-disclaimer">{PRACTICE_ACCURACY_LABEL}</p>
          <ul className="afq-composites">
            {composites.filter((c) => !c.disputed).map((c) => (
              <li key={c.code}>
                <strong>{c.name}</strong>
                <span>{c.subtests.join(' + ')}</span>
                <span className="afq-composite-acc">
                  {c.accuracy == null ? 'not administered' : `${Math.round(c.accuracy * 100)}% practice accuracy`}
                </span>
                {c.min != null && (
                  <small>official minimum: {c.min}th percentile - not the same scale as the accuracy above</small>
                )}
              </li>
            ))}
          </ul>
          {sjt && sjt.accuracy != null && (
            <p className="afq-note">
              Situational Judgment (disputed composite): {Math.round(sjt.accuracy * 100)}% agreement
              with the officer-consensus key - see the AFOQT docs for why this composite may or may
              not actually count toward anything.
            </p>
          )}
        </section>

        <div className="afq-row">
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt')}>Back to dashboard</button>
          <button className="afq-btn" onClick={() => begin(true)}>Take it again</button>
        </div>
      </div>
    );
  }

  const step = EXAM_STEPS[stepIndex];
  if (!step) return null;

  return (
    <div className="afq-exam-shell">
      <div className="afq-exam-topline">
        <span className="afq-note">Step {stepIndex + 1} / {EXAM_STEPS.length}</span>
        <button className="afq-btn afq-ghost" onClick={abandon}>Abandon exam</button>
      </div>
      {step.type === 'break' && <BreakStep label={step.label} minutes={step.minutes} onContinue={() => advance(null, null)} />}
      {step.type === 'info' && <InfoStep code={step.code} onContinue={() => advance(step.code, null)} />}
      {step.type === 'subtest' && (
        <SubtestStep key={stepIndex} code={step.code} onComplete={(r) => advance(step.code, r)} />
      )}
    </div>
  );
}

function BreakStep({ label, minutes, onContinue }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="afq-runner afq-exam-break">
      <h2>{label}</h2>
      <p className="afq-clock afq-exam-break-clock">{formatClock(remaining * 1000)}</p>
      <p className="afq-note">
        The real test pauses here for {minutes} minutes. Take it if it helps - this tool will
        not force you to wait.
      </p>
      <button className="afq-btn afq-primary" onClick={onContinue}>Continue</button>
    </div>
  );
}

function InfoStep({ code, onContinue }) {
  const meta = getSubtest(code);
  return (
    <div className="afq-runner afq-exam-info">
      <h2>{meta?.name}</h2>
      <p className="afq-note">
        {meta?.questions} items, Likert-scale, {meta?.minutes} minutes on the real test. There is
        no right or wrong answer and it feeds no composite - this tool deliberately does not
        drill it (see the AFOQT docs). Answer from first impression on test day; there is
        nothing to practice here. This slot exists so the sequence and total time stay honest -
        the real exam genuinely spends {meta?.minutes} minutes here, between Situational
        Judgment and the Part A/B break.
      </p>
      <button className="afq-btn afq-primary" onClick={onContinue}>Continue</button>
    </div>
  );
}

/** One subtest, run at full official length and real pace (pressure 1.0, always timed) - the
 *  exam sequencer's per-subtest engine. `key={stepIndex}` on the parent's usage of this
 *  component forces a full remount on every step, which is what resets all local state below
 *  without a manual effect - the same trick a fresh drill relies on when its own key changes. */
function SubtestStep({ code, onComplete }) {
  const { recordAnswer, recordRun } = useAfoqt();
  const meta = getSubtest(code);

  const questions = useMemo(() => buildExamQuestions(code, mulberry32(Date.now())), [code]);
  const budget = useMemo(() => paceBudget(code, questions.length || meta?.questions || 1, 1), [code, questions.length, meta]);
  const wide = questions.some((q) => q.render);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const finishedRef = useRef(false);

  const finish = useCallback((finalAnswers) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setDone(true);
    const right = finalAnswers.filter((a) => a.correct).length;
    recordRun({
      id: Date.now().toString(36),
      subtest: code, mode: 'exam', pressure: 1, count: questions.length,
      chapter: null, phase: 'exam-sitting',
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      correct: right,
      answered: finalAnswers.length,
      totalMs: Date.now() - startedAt.current,
    });
    onComplete({ correct: right, total: questions.length, answered: finalAnswers.length });
  }, [recordRun, code, questions.length, onComplete]);

  const submit = useCallback((picked, opts) => {
    const guessed = !!(opts && opts.guessed);
    const q = questions[idx];
    if (!q || done) return;
    const now = Date.now();
    const correct = picked === q.correctIndex;
    const entry = { picked, correct, elapsedMs: now - questionStart.current, guessed };
    recordAnswer({ templateId: q.templateId, seed: q.seed, correct: entry.correct, elapsedMs: entry.elapsedMs });
    const next = [...answers, entry];
    setAnswers(next);
    questionStart.current = now;
    if (idx + 1 >= questions.length) finish(next);
    else setIdx(idx + 1);
  }, [questions, idx, answers, done, recordAnswer, finish]);

  // Whole-subtest countdown, matching how the real test administers: time cannot be banked
  // between questions.
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(t);
  }, [done]);

  const remainingMs = budget.totalMs - elapsedMs;

  // Out of time. Rights-only scoring means a blank is strictly worse than a guess, so the
  // remainder is always swept with marks - unlike DrillRunner, an exam sitting has no
  // `autoGuessOnTimeout` setting to respect, because a real proctor doesn't ask.
  useEffect(() => {
    if (done || remainingMs > 0) return;
    if (answers.length >= questions.length) { finish(answers); return; }
    const swept = [...answers];
    for (let i = answers.length; i < questions.length; i++) {
      const q = questions[i];
      const picked = Math.floor(Math.random() * q.choices.length);
      recordAnswer({ templateId: q.templateId, seed: q.seed, correct: picked === q.correctIndex, elapsedMs: 0 });
      swept.push({ picked, correct: picked === q.correctIndex, elapsedMs: 0, guessed: true });
    }
    setAnswers(swept);
    finish(swept);
  }, [done, remainingMs, questions, answers, recordAnswer, finish]);

  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      const q = questions[idx];
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, idx, done, submit]);

  // A subtest with genuinely zero content (should not happen - every scored/studyable subtest
  // has templates or bank items as of Phase 13) must not hang the whole sequence forever.
  useEffect(() => {
    if (questions.length === 0) onComplete({ correct: 0, total: 0, answered: 0 });
  }, [questions.length, onComplete]);

  if (questions.length === 0) {
    return <div className="afq-runner"><p>No content for {meta?.name} yet - skipping.</p></div>;
  }

  const q = questions[idx];
  const pace = paceCheck({ elapsedMs, answeredCount: answers.length, totalMs: budget.totalMs, questionCount: questions.length });
  const nudge = shouldNudgeAbandon(code, Date.now() - questionStart.current);
  const sweepWarn = shouldWarnGuessSweep(remainingMs, questions.length - answers.length);
  const barPct = Math.max(0, (remainingMs / budget.totalMs) * 100);

  return (
    <div className={'afq-runner' + (wide ? ' afq-runner-wide' : '')}>
      <header className="afq-runner-top">
        <span className="afq-pill">{meta?.name}</span>
        <span className="afq-progress">{idx + 1} / {questions.length}</span>
        <span className={remainingMs < 30000 ? 'afq-clock low' : 'afq-clock'}>{formatClock(remainingMs)}</span>
        <span className={'afq-pace afq-pace-' + pace.state}>
          {pace.state === 'on' ? 'on pace' : Math.abs(pace.delta) + ' ' + pace.state}
        </span>
      </header>

      <div className="afq-bar"><div className="afq-bar-fill" style={{ width: barPct + '%' }} /></div>

      {sweepWarn && <div className="afq-alert">Under 15s left. Mark every remaining question - there is no guessing penalty.</div>}

      <div className="afq-card">
        {q.render && <Figure render={q.render} />}
        <p className="afq-stem">{q.stem}</p>
        <ol className={'afq-choices' + (q.optionRender || (q.render && q.choices.every((c) => c.length <= 18)) ? ' afq-choices-row' : '')}>
          {q.choices.map((c, i) => (
            <li key={i}>
              <button className={'afq-choice' + (q.optionRender ? ' afq-choice-figure' : '')} onClick={() => submit(i)}>
                <span className="afq-letter">{LETTERS[i]}</span>
                {q.optionRender
                  ? <><Figure render={q.optionRender[i]} /><span className="afq-sr-only">{c}</span></>
                  : c}
              </button>
            </li>
          ))}
        </ol>
        {nudge && <p className="afq-nudge">5s - guess and move on.</p>}
      </div>

      <p className="afq-hint">
        Press {LETTERS.slice(0, q.choices.length).join(' / ')} to answer - no early exit mid-subtest, matching the real test
      </p>
    </div>
  );
}
