import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { assembleDrill } from '../engine/drill';
import { getSubtest, COMPOSITES } from '../engine/afoqtSpec';
import { paceBudget, formatClock } from '../engine/timing';
import { labelFor } from '../engine/errorModes';
import { EXAM_PLAN, allExamCompositeAccuracy, EXAM_ACCURACY_LABEL } from '../engine/exam';
import { ExamSession, addExamRun, addToWordBank } from '../afoqtStorage';
import Figure from '../render/Figure';
import useQuestionVoice from '../voice/useQuestionVoice';
import VoiceBar from '../voice/VoiceBar';
import { mulberry32 } from '../../engine/rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Fold one completed subtest step's answers into the exam's running results tally. `results`
 * is keyed by subtest code, never by step index - a re-run of the same subtest (there isn't
 * one in the official plan, but nothing enforces that) would otherwise silently overwrite.
 */
function foldResults(results, code, finalAnswers) {
  const correct = finalAnswers.filter((a) => a.correct).length;
  const totalMs = finalAnswers.reduce((n, a) => n + a.elapsedMs, 0);
  const errorModes = { ...(results[code]?.errorModes ?? {}) };
  for (const a of finalAnswers) {
    if (a.errorMode) errorModes[a.errorMode] = (errorModes[a.errorMode] ?? 0) + 1;
  }
  return { ...results, [code]: { correct, answered: finalAnswers.length, totalMs, errorModes } };
}

/**
 * The full-length Form T runner (PART 28). Chains all 14 EXAM_PLAN steps - 11 timed subtests,
 * one SDI pass-through, two breaks - in the real administration order, with no return to
 * DrillConfig between them. A single subtest's live-question mechanics (pace bar, clock,
 * keyboard answers, auto-guess sweep at timeout) are deliberately NOT shared with
 * DrillRunner.jsx: that component's state is scoped to one drill and never expected to survive
 * a page reload, where an exam step's state has to survive one by design (see ExamSession in
 * afoqtStorage.js) - forcing the two to share a component would have coupled DrillRunner's
 * simpler, well-exercised code path to exam-only persistence concerns for no benefit to either.
 */
export default function ExamRunner() {
  const navigate = useNavigate();
  const { progress, recordAnswer, mutate, updateVoice } = useAfoqt();
  const [session, setSession] = useState(() => ExamSession.load());
  const [, tick] = useState(0);
  const questionStart = useRef(Date.now());

  const step = session ? EXAM_PLAN[session.stepIndex] : null;
  const meta = step && step.kind !== 'break' ? getSubtest(step.subtest) : null;

  // Build this step's question queue once per (step, seed) pair. A fresh subtest step always
  // gets a fresh seed (see startStep/advance below), so this only ever regenerates when the
  // exam actually moves to new content, never on every answered question.
  const questions = useMemo(() => {
    if (!session || session.status !== 'running' || !step || step.kind !== 'subtest') return [];
    const rng = mulberry32(session.seed >>> 0);
    return assembleDrill({
      subtest: step.subtest,
      count: meta.questions,
      rng,
      progress,
      concepts: null,
      bands: null,
      exam: true,
      includeStretch: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.stepIndex, session?.seed, session?.status]);

  const idx = session?.answers?.length ?? 0;
  useEffect(() => { questionStart.current = Date.now(); }, [session?.stepIndex, idx]);

  // Persist to localStorage as a REACTION to the committed session, never as a side effect
  // bolted onto the state update itself. Every setSession call in this file is a plain, pure
  // update; this is the one and only place ExamSession.save/clear runs, keyed off what React
  // actually committed.
  //
  // The bug this replaced: `setSession((prev) => { ...; outerVar = X; return next; })` followed
  // immediately by `if (outerVar) { ExamSession.clear(); ... }` on the next line. That looks
  // synchronous but isn't - React does not guarantee a functional updater has run by the time
  // the code after `setSession(...)` executes, so `outerVar` was still its stale value at that
  // point. Traced with explicit logging: the updater's own "reached the end of the plan, this
  // is 'done'" branch DID run (visible in the log), but the outer `if (finishedRun)` block that
  // was supposed to react to it ran BEFORE that assignment landed, so `ExamSession.clear()` and
  // `addExamRun()` silently never fired on the real completion - a finished exam sat in
  // localStorage forever labelled "running", and the completed run never reached
  // `progress.examRuns`. Watching `session` in an effect is the only way to react to what React
  // actually committed rather than to what an updater closure happened to compute.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (session.status === 'running') {
      ExamSession.save(session);
      return;
    }
    if ((session.status === 'done' || session.status === 'aborted') && !finishedRef.current) {
      finishedRef.current = true;
      ExamSession.clear();
      mutate((p) => addExamRun(p, {
        examId: session.examId, startedAt: session.startedAt, finishedAt: session.finishedAt,
        results: session.results, aborted: session.status === 'aborted',
      }));
    }
  }, [session, mutate]);

  const advance = useCallback((finalAnswers) => {
    setSession((prev) => {
      if (!prev) return prev;
      const curStep = EXAM_PLAN[prev.stepIndex];
      const results = curStep.kind === 'subtest' && finalAnswers
        ? foldResults(prev.results, curStep.subtest, finalAnswers)
        : prev.results;
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= EXAM_PLAN.length) {
        return { ...prev, results, stepIndex: nextIndex, status: 'done', finishedAt: new Date().toISOString() };
      }
      const nextStep = EXAM_PLAN[nextIndex];
      return {
        ...prev,
        results,
        stepIndex: nextIndex,
        seed: nextStep.kind === 'subtest' ? (Math.floor(Math.random() * 0xffffffff) >>> 0) : null,
        answers: [],
        stepStartedAt: Date.now(),
        sdiTiming: false,
      };
    });
  }, []);

  const abandon = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const curStep = EXAM_PLAN[prev.stepIndex];
      const results = curStep.kind === 'subtest' && prev.answers?.length
        ? foldResults(prev.results, curStep.subtest, prev.answers)
        : prev.results;
      return { ...prev, results, status: 'aborted', finishedAt: new Date().toISOString() };
    });
  }, []);

  const submit = useCallback((picked, opts) => {
    if (!session || session.status !== 'running' || !step || step.kind !== 'subtest') return;
    const guessed = !!(opts && opts.guessed);
    const q = questions[idx];
    if (!q) return;
    const correct = picked === q.correctIndex;
    const entry = {
      picked, correct, guessed,
      elapsedMs: Date.now() - questionStart.current,
      errorMode: !correct && !guessed ? (q.errors?.[picked] ?? null) : null,
      errorWhy: !correct && !guessed ? (q.whys?.[picked] ?? null) : null,
    };
    recordAnswer({ templateId: q.templateId, seed: q.seed, correct, elapsedMs: entry.elapsedMs });
    if (!correct && !guessed && q.vocab) mutate((p) => addToWordBank(p, q.vocab));
    const nextAnswers = [...(session.answers ?? []), entry];
    if (nextAnswers.length >= questions.length) {
      advance(nextAnswers);
    } else {
      // No ExamSession.save() here - the effect above persists `session` on every change while
      // status is 'running', which is what actually fires once React commits this update.
      setSession((prev) => ({ ...prev, answers: nextAnswers }));
    }
  }, [session, step, questions, idx, recordAnswer, advance, mutate]);

  // Voice, same hook the drill and the diagnostic use. Deliberately available during a full
  // simulated exam even though the real AFOQT is read silently: a session where you cannot use
  // the tool the way you actually study is a session you skip. The exam's own header carries the
  // caveat that a read-aloud run is measuring something different from a paper one.
  //
  // No navigation commands - the exam is strictly linear, and "back" has no meaning here.
  const inSubtest = !!step && step.kind === 'subtest' && session?.status === 'running';
  const voice = useQuestionVoice({
    q: inSubtest ? (questions[idx] ?? null) : null,
    subtest: inSubtest ? step.subtest : '',
    enabled: inSubtest,
    settings: progress.settings.voice,
    onPick: submit,
    onCommand: () => {},
  });

  // One clock for every timed step: a subtest (real pace budget), a break (its own countdown),
  // or the SDI when the candidate opts into timing it (see the sdi render branch). All three
  // reduce to "how much time is left before this step ends itself", so one effect covers all.
  useEffect(() => {
    if (!session || session.status !== 'running' || !step) return undefined;
    let totalMs = null;
    if (step.kind === 'subtest') totalMs = paceBudget(step.subtest, meta.questions, 1).totalMs;
    else if (step.kind === 'break') totalMs = step.minutes * 60000;
    else if (step.kind === 'sdi' && session.sdiTiming) totalMs = step.minutes * 60000;
    if (totalMs == null) return undefined;

    const id = setInterval(() => {
      const elapsed = Date.now() - session.stepStartedAt;
      if (totalMs - elapsed > 0) { tick((n) => n + 1); return; }
      // Time's up. A subtest sweeps every remaining question with a mark rather than a blank -
      // rights-only scoring means a blank is strictly worse than a guess, and the real test
      // gives no guessing penalty either. A break or the timed SDI simply moves on.
      if (step.kind === 'subtest' && (session.answers?.length ?? 0) < questions.length) {
        const filled = [...(session.answers ?? [])];
        for (let i = filled.length; i < questions.length; i++) {
          const q = questions[i];
          const picked = Math.floor(Math.random() * q.choices.length);
          recordAnswer({ templateId: q.templateId, seed: q.seed, correct: picked === q.correctIndex, elapsedMs: 0 });
          filled.push({ picked, correct: picked === q.correctIndex, elapsedMs: 0, guessed: true, errorMode: null, errorWhy: null });
        }
        advance(filled);
      } else {
        advance(session.answers ?? []);
      }
    }, 200);
    return () => clearInterval(id);
  }, [session, step, meta, questions, advance, recordAnswer]);

  useEffect(() => {
    const onKey = (e) => {
      if (!session || session.status !== 'running' || !step || step.kind !== 'subtest') return;
      const q = questions[idx];
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); return; }
      if (voice.on && e.key.toUpperCase() === 'R') { e.preventDefault(); voice.readQuestion(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, step, questions, idx, submit, voice]);

  const startSdiTiming = () => setSession((prev) => ({ ...prev, sdiTiming: true, stepStartedAt: Date.now() }));

  // --- no exam in progress ---------------------------------------------------------------
  if (!session) {
    return (
      <div className="afq-runner">
        <p>No exam in progress.</p>
        <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/exam')}>Back to Exam</button>
      </div>
    );
  }

  // --- finished (completed the whole plan, or ended early) -------------------------------
  if (session.status === 'done' || session.status === 'aborted') {
    const composites = allExamCompositeAccuracy(session.results);
    const stepsReached = EXAM_PLAN.filter((s) => s.kind === 'subtest' && session.results[s.subtest]);
    return (
      <div className="afq-runner afq-summary">
        <h2>{session.status === 'aborted' ? 'Exam ended early' : 'Exam complete'}</h2>
        <p className="afq-note">
          {stepsReached.length} of {EXAM_PLAN.filter((s) => s.kind === 'subtest').length} scored subtests reached.
        </p>

        <section>
          <h3 className="afq-note">By subtest</h3>
          <table className="afq-table">
            <thead><tr><th>Subtest</th><th>Score</th><th>Accuracy</th><th>Avg / question</th></tr></thead>
            <tbody>
              {EXAM_PLAN.filter((s) => s.kind === 'subtest').map((s) => {
                const r = session.results[s.subtest];
                const m = getSubtest(s.subtest);
                return (
                  <tr key={s.subtest} className={r ? '' : 'afq-dim'}>
                    <td>{s.label}</td>
                    <td>{r ? `${r.correct} / ${r.answered}` : 'not reached'}</td>
                    <td>{r ? `${Math.round((r.correct / r.answered) * 100)}%` : '-'}</td>
                    <td>{r ? `${(r.totalMs / r.answered / 1000).toFixed(1)}s (real ${(m.minutes * 60 / m.questions).toFixed(1)}s)` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="afq-note">Composites</h3>
          <p className="afq-note afq-score-disclaimer">{EXAM_ACCURACY_LABEL}</p>
          <ul className="afq-composites">
            {composites.map((c) => (
              <li key={c.code}>
                <strong>{c.name}</strong>
                <span>{COMPOSITES.find((x) => x.code === c.code).subtests.join(' + ')}</span>
                <span className="afq-composite-acc">
                  {c.accuracy == null ? 'not reached' : `${Math.round(c.accuracy * 100)}% this exam`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {(() => {
          const modes = Object.entries(
            Object.values(session.results).reduce((acc, r) => {
              for (const [m, n] of Object.entries(r.errorModes ?? {})) acc[m] = (acc[m] ?? 0) + n;
              return acc;
            }, {}),
          ).sort((a, b) => b[1] - a[1]);
          return modes.length > 0 && (
            <section className="afq-modes">
              <h3>How you missed them, across the whole exam</h3>
              <ul>
                {modes.map(([id, n]) => <li key={id}><span className="afq-mode-n">{n}x</span><span>{labelFor(id)}</span></li>)}
              </ul>
            </section>
          );
        })()}

        <div className="afq-row">
          <button className="afq-btn afq-primary" onClick={() => navigate('/TKB/afoqt/exam')}>Back to Exam</button>
          <button className="afq-btn" onClick={() => navigate('/TKB/afoqt')}>Dashboard</button>
        </div>
      </div>
    );
  }

  const overallStepNum = step.index + 1;
  const totalSteps = EXAM_PLAN.length;
  const partLabel = step.kind === 'break' ? '' : (getSubtest(step.subtest)?.part === 'A' ? 'Part A' : 'Part B');

  // --- break --------------------------------------------------------------------------------
  if (step.kind === 'break') {
    const remainingMs = Math.max(0, step.minutes * 60000 - (Date.now() - session.stepStartedAt));
    return (
      <div className="afq-runner">
        <header className="afq-runner-top">
          <span className="afq-progress">Step {overallStepNum} / {totalSteps}</span>
        </header>
        <div className="afq-card afq-exam-banner">
          <h2>{step.label}</h2>
          <p className="afq-note">Real administration gives you {step.minutes} minutes here. Nothing to answer.</p>
          <p className="afq-clock">{formatClock(remainingMs)}</p>
          <button className="afq-btn afq-primary" onClick={() => advance(null)}>Skip break, continue now</button>
        </div>
        <button className="afq-btn afq-ghost" onClick={abandon}>End exam early</button>
      </div>
    );
  }

  // --- SDI pass-through -----------------------------------------------------------------
  if (step.kind === 'sdi') {
    const remainingMs = session.sdiTiming
      ? Math.max(0, step.minutes * 60000 - (Date.now() - session.stepStartedAt))
      : null;
    return (
      <div className="afq-runner">
        <header className="afq-runner-top">
          <span className="afq-progress">Step {overallStepNum} / {totalSteps}</span>
        </header>
        <div className="afq-card afq-exam-banner">
          <h2>Self-Description Inventory</h2>
          <p>
            240 statements, Likert scale (strongly disagree ... strongly agree), {step.minutes}{' '}
            minutes on the real test. Answer from first impression, comparing yourself to peers
            of the same age and sex.
          </p>
          <p className="afq-note">
            Not simulated here - it has no right or wrong answers and feeds no composite (PART 26).
            This step exists so the SDI is not a surprise on test day, not to drill it.
          </p>
          {session.sdiTiming
            ? <p className="afq-clock">{formatClock(remainingMs)}</p>
            : (
              <button className="afq-btn" onClick={startSdiTiming}>
                Time the real {step.minutes} minutes anyway (for pacing/fatigue practice)
              </button>
            )}
          <button className="afq-btn afq-primary" onClick={() => advance(null)}>Continue</button>
        </div>
        <button className="afq-btn afq-ghost" onClick={abandon}>End exam early</button>
      </div>
    );
  }

  // --- a scored subtest step, live question ------------------------------------------------
  const q = questions[idx];
  if (!q) {
    // A step whose subtest has no content reachable under exam:true (should not happen given
    // Phase 3-13 are all complete, but a missing template set must not brick the whole exam).
    return (
      <div className="afq-runner">
        <p>No questions available for {step.label} - skipping.</p>
        <button className="afq-btn afq-primary" onClick={() => advance([])}>Continue</button>
      </div>
    );
  }
  const budget = paceBudget(step.subtest, meta.questions, 1);
  const elapsedMs = Date.now() - session.stepStartedAt;
  const remainingMs = budget.totalMs - elapsedMs;
  const barPct = Math.max(0, (remainingMs / budget.totalMs) * 100);
  const wide = questions.some((qq) => qq.render);

  return (
    <div className={'afq-runner' + (wide ? ' afq-runner-wide' : '') + (voice.on ? ' afq-stage' : '')}>
      <header className="afq-runner-top">
        <span className="afq-progress">Step {overallStepNum} / {totalSteps} - {partLabel}</span>
        <span className="afq-pill">{meta.name}</span>
        <span className="afq-progress">{idx + 1} / {questions.length}</span>
        <span className={remainingMs < 30000 ? 'afq-clock low' : 'afq-clock'}>{formatClock(remainingMs)}</span>
        <button className="afq-btn afq-ghost" onClick={abandon}>End exam early</button>
      </header>

      <div className="afq-bar"><div className="afq-bar-fill" style={{ width: barPct + '%' }} /></div>

      <VoiceBar voice={voice} settings={progress.settings.voice} updateVoice={updateVoice} />

      <div className="afq-card">
        {q.render && <Figure render={q.render} />}
        <p className="afq-stem">{q.stem}</p>
        <ol className={'afq-choices' + (q.optionRender || (q.render && q.choices.every((c) => c.length <= 18)) ? ' afq-choices-row' : '')}>
          {q.choices.map((c, i) => (
            <li key={i}>
              <button
                className={'afq-choice'
                  + (q.optionRender ? ' afq-choice-figure' : '')
                  + (voice.speaker.segment === i ? ' afq-choice-reading' : '')
                  + (voice.armed?.index === i ? ' afq-choice-armed' : '')}
                onClick={() => { voice.cancelArmed(); submit(i); }}
              >
                <span className="afq-letter">{LETTERS[i]}</span>
                {q.optionRender
                  ? <><Figure render={q.optionRender[i]} /><span className="afq-sr-only">{c}</span></>
                  : c}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <p className="afq-hint">Press {LETTERS.slice(0, q.choices.length).join(' / ')} to answer</p>
    </div>
  );
}
