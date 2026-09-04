import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAfoqt } from '../AfoqtApp';
import { assembleDrill } from '../engine/drill';
import { getSubtest } from '../engine/afoqtSpec';
import { paceBudget, formatClock } from '../engine/timing';
import { labelFor } from '../engine/errorModes';
import { DIAGNOSTIC_SUBTESTS, DIAGNOSTIC_QUESTIONS_PER_SUBTEST, DIAGNOSTIC_ACCURACY_LABEL } from '../engine/diagnostic';
import { addDiagnosticRun, addToWordBank } from '../afoqtStorage';
import Figure from '../render/Figure';
import useQuestionVoice from '../voice/useQuestionVoice';
import VoiceBar from '../voice/VoiceBar';
import DiagnosticReport from './DiagnosticReport';
import { mulberry32 } from '../../engine/rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const PRESSURE = 1; // real pace, no config - see engine/diagnostic.js for why this stays fixed.

function foldResults(finalAnswers) {
  const correct = finalAnswers.filter((a) => a.correct).length;
  const totalMs = finalAnswers.reduce((n, a) => n + a.elapsedMs, 0);
  const errorModes = {};
  for (const a of finalAnswers) {
    if (a.errorMode) errorModes[a.errorMode] = (errorModes[a.errorMode] ?? 0) + 1;
  }
  return { correct, answered: finalAnswers.length, totalMs, errorModes };
}

/**
 * The diagnostic (PART 29): six questions at every scored subtest's real pace, back to back,
 * no breaks - see engine/diagnostic.js for why this is not a scaled-down copy of the exam
 * runner. State here is deliberately plain component state, mirroring DrillRunner.jsx's own
 * proven pattern (a diagnostic is "several drills in a row", not a multi-hour sitting that
 * needs to survive a reload) - the exam runner's localStorage-session machinery, and the real
 * bug PART 28 found and fixed inside it, simply do not apply to something this short.
 */
export default function DiagnosticRunner() {
  const { progress, recordAnswer, mutate, updateVoice } = useAfoqt();

  const [phase, setPhase] = useState('intro'); // 'intro' | 'running' | 'report'
  const [subtestIdx, setSubtestIdx] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [allResults, setAllResults] = useState({});
  const startedAt = useRef(null);
  const questionStart = useRef(Date.now());

  const meta = getSubtest(DIAGNOSTIC_SUBTESTS[subtestIdx]?.code);

  const questions = useMemo(() => {
    if (phase !== 'running' || !meta) return [];
    const rng = mulberry32(Date.now() ^ (subtestIdx * 0x9e3779b9));
    return assembleDrill({
      subtest: meta.code,
      count: DIAGNOSTIC_QUESTIONS_PER_SUBTEST,
      rng,
      progress: null,
      concepts: null,
      bands: null,
      exam: true,       // honest sample - no miss-pool weighting, no drill-only training aids
      includeStretch: false,
      bankRatio: 0.8,   // prefer real OATTS items where the bank has them, for authenticity
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, subtestIdx]);

  useEffect(() => { questionStart.current = Date.now(); }, [subtestIdx, idx]);

  const start = () => {
    startedAt.current = Date.now();
    setPhase('running');
    setSubtestIdx(0);
    setIdx(0);
    setAnswers([]);
    setAllResults({});
  };

  // PART 28's lesson applied here too: every setState call below is a plain call with a value
  // already computed from the current closure, never a value read back out of another
  // updater's functional form. `nextResults` is computed once, then `setAllResults`, `setPhase`,
  // `mutate` and the subtest-advance calls all just use it directly - nothing here depends on
  // React having already applied a previous setState call by the time the next line runs.
  const finishSubtest = useCallback((finalAnswers) => {
    const folded = foldResults(finalAnswers);
    const nextResults = { ...allResults, [meta.code]: folded };
    setAllResults(nextResults);
    if (subtestIdx + 1 >= DIAGNOSTIC_SUBTESTS.length) {
      setPhase('report');
      mutate((p) => addDiagnosticRun(p, { takenAt: new Date().toISOString(), results: nextResults }));
    } else {
      setSubtestIdx(subtestIdx + 1);
      setIdx(0);
      setAnswers([]);
    }
  }, [meta, subtestIdx, allResults, mutate]);

  const submit = useCallback((picked, opts) => {
    if (phase !== 'running') return;
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
    const nextAnswers = [...answers, entry];
    setAnswers(nextAnswers);
    if (nextAnswers.length >= questions.length) finishSubtest(nextAnswers);
    else setIdx(idx + 1);
  }, [phase, questions, idx, answers, recordAnswer, finishSubtest, mutate]);

  // Voice, same hook as the drill and the exam. The diagnostic walks every scored subtest in
  // turn, so `subtest` changes mid-run and the hook re-derives speakability with it - Block
  // Counting's slice stays silent while Word Knowledge's is read, without anything here knowing
  // which is which.
  const voice = useQuestionVoice({
    q: phase === 'running' ? (questions[idx] ?? null) : null,
    subtest: meta?.code ?? '',
    enabled: phase === 'running',
    settings: progress.settings.voice,
    onPick: submit,
    onCommand: () => {},
    upcoming: phase === 'running' ? questions.slice(idx + 1, idx + 4) : null,
  });

  const [, tick] = useState(0);
  const budget = useMemo(
    () => (meta ? paceBudget(meta.code, questions.length || DIAGNOSTIC_QUESTIONS_PER_SUBTEST, PRESSURE) : null),
    [meta, questions.length],
  );
  const subtestStart = useRef(Date.now());
  useEffect(() => { subtestStart.current = Date.now(); }, [subtestIdx]);

  useEffect(() => {
    if (phase !== 'running' || !budget) return undefined;
    const id = setInterval(() => {
      const elapsed = Date.now() - subtestStart.current;
      if (budget.totalMs - elapsed > 0) { tick((n) => n + 1); return; }
      // Time's up on this subtest slice - sweep the rest with a mark, same rights-only-scoring
      // convention as DrillRunner and the exam runner: a blank is strictly worse than a guess.
      if (answers.length < questions.length) {
        const filled = [...answers];
        for (let i = filled.length; i < questions.length; i++) {
          const q = questions[i];
          const picked = Math.floor(Math.random() * q.choices.length);
          recordAnswer({ templateId: q.templateId, seed: q.seed, correct: picked === q.correctIndex, elapsedMs: 0 });
          filled.push({ picked, correct: picked === q.correctIndex, elapsedMs: 0, guessed: true, errorMode: null, errorWhy: null });
        }
        setAnswers(filled);
        finishSubtest(filled);
      } else {
        finishSubtest(answers);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, budget, answers, questions, recordAnswer, finishSubtest]);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'running') return;
      const q = questions[idx];
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); return; }
      if (voice.on && e.key.toUpperCase() === 'R') { e.preventDefault(); voice.readQuestion(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, questions, idx, submit, voice]);

  // --- intro ------------------------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <div className="afq-runner">
        <h2>Diagnostic</h2>
        <p>
          {DIAGNOSTIC_QUESTIONS_PER_SUBTEST} questions at every one of the {DIAGNOSTIC_SUBTESTS.length}{' '}
          scored subtests' own real pace, back to back, no breaks - about 35-40 minutes total.
        </p>
        <p className="afq-note">
          {DIAGNOSTIC_ACCURACY_LABEL} The point is finding where to focus first, not a score to
          judge yourself by - six questions is a pointer, not a percentile.
        </p>
        <button className="afq-btn afq-primary afq-start" onClick={start}>Start the diagnostic</button>
      </div>
    );
  }

  // --- report -------------------------------------------------------------------------------
  // Rendered by DiagnosticReport, the same component DiagnosticResults.jsx reads back out of
  // stored progress later - this is not the only place these results are ever visible.
  if (phase === 'report') {
    const totalMin = startedAt.current ? Math.round((Date.now() - startedAt.current) / 60000) : null;
    return <DiagnosticReport results={allResults} takenAt={new Date().toISOString()} totalMin={totalMin} />;
  }

  // --- running: a live question -------------------------------------------------------------
  const q = questions[idx];
  if (!q) {
    return (
      <div className="afq-runner">
        <p>No questions available for {meta?.name ?? 'this subtest'} - skipping.</p>
        <button className="afq-btn afq-primary" onClick={() => finishSubtest(answers)}>Continue</button>
      </div>
    );
  }
  const elapsedMs = Date.now() - subtestStart.current;
  const remainingMs = budget.totalMs - elapsedMs;
  const barPct = Math.max(0, (remainingMs / budget.totalMs) * 100);
  const wide = questions.some((qq) => qq.render);

  return (
    <div className={'afq-runner' + (wide ? ' afq-runner-wide' : '') + (voice.on ? ' afq-stage' : '')}>
      <header className="afq-runner-top">
        <span className="afq-progress">Subtest {subtestIdx + 1} / {DIAGNOSTIC_SUBTESTS.length}</span>
        <span className="afq-pill">{meta.name}</span>
        <span className="afq-progress">{idx + 1} / {questions.length}</span>
        <span className={remainingMs < 15000 ? 'afq-clock low' : 'afq-clock'}>{formatClock(remainingMs)}</span>
      </header>

      <div className="afq-bar"><div className="afq-bar-fill" style={{ width: barPct + '%' }} /></div>

      <VoiceBar voice={voice} settings={progress.settings.voice} updateVoice={updateVoice} queue={questions} />

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
