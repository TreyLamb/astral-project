import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { assembleDrill } from '../engine/drill';
import { getSubtest } from '../engine/afoqtSpec';
import { getChapter } from '../curriculum/chapters';
import { recordTestOut, recordMastery, MASTERY_THRESHOLD } from '../afoqtStorage';
import { paceBudget, paceCheck, shouldNudgeAbandon, shouldWarnGuessSweep, formatClock } from '../engine/timing';
import { labelFor } from '../engine/errorModes';
import Figure from '../render/Figure';
import { mulberry32 } from '../../engine/rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function DrillRunner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { progress, recordAnswer, recordRun, mutate } = useAfoqt();

  const subtest = params.get('subtest') ?? 'MK';
  const count = Number(params.get('count') ?? 5);
  const mode = params.get('mode') ?? progress.settings.mode;
  const pressure = Number(params.get('pressure') ?? progress.settings.pressure);
  const timed = mode !== 'untimed';

  // A chapter-scoped run: the test-out gate, the chapter drill, or the mastery check.
  const chapter = getChapter(params.get('chapter') ?? '');
  const phase = params.get('phase') ?? 'free';
  const isGate = phase === 'testout' || phase === 'mastery';
  // Exam mode is a simulation of the real subtest, which means it is a measurement rather than
  // practice - see `exam` in engine/drill.js for what that switches off.
  const isExam = mode === 'exam';

  const meta = getSubtest(subtest);
  const budget = useMemo(() => paceBudget(subtest, count, pressure), [subtest, count, pressure]);

  // Build once. A drill is a fixed queue; rebuilding on re-render would reshuffle underfoot.
  //
  // `progress` is read here but deliberately left out of the dependency list: it changes on
  // every answered question, and re-running this would rebuild the queue mid-drill.
  const questions = useMemo(() => {
    const rng = mulberry32(Date.now());
    return assembleDrill({
      subtest,
      count,
      rng,
      progress,
      concepts: chapter ? chapter.concepts : null,
      bands: chapter ? chapter.bands : null,
      // A gate has to be an honest sample of the chapter, so no miss-pool weighting.
      ignoreMissPool: isGate,
      exam: isExam,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtest, count, chapter?.id, isGate, isExam]);

  // A 33x33 Table Reading grid needs about 950px; a question stem reads best at 760. So the
  // column widens only when the questions actually carry a figure, rather than making every
  // text drill in the tool sprawl.
  const wide = questions.some((q) => q.render);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());

  const finish = useCallback((finalAnswers) => {
    setDone(true);
    const right = finalAnswers.filter((a) => a.correct).length;
    // A gate only counts if it was actually finished - bailing out at question two must not
    // record a failed test-out attempt against the chapter.
    if (chapter && finalAnswers.length === questions.length) {
      if (phase === 'testout') {
        mutate((p) => recordTestOut(p, chapter.id, { correct: right, total: questions.length, pass: chapter.testOutPass }));
      } else if (phase === 'mastery') {
        mutate((p) => recordMastery(p, chapter.id, { correct: right, total: questions.length }));
      }
    }
    recordRun({
      id: Date.now().toString(36),
      subtest, mode, pressure, count,
      chapter: chapter?.id ?? null,
      phase,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      correct: finalAnswers.filter((a) => a.correct).length,
      answered: finalAnswers.length,
      totalMs: Date.now() - startedAt.current,
    });
  }, [recordRun, subtest, mode, pressure, count, chapter, phase, questions.length, mutate]);

  const submit = useCallback((picked, opts) => {
    const guessed = !!(opts && opts.guessed);
    const q = questions[idx];
    if (!q || done) return;
    const now = Date.now();
    const correct = picked === q.correctIndex;
    const entry = {
      picked,
      correct,
      elapsedMs: now - questionStart.current,
      guessed,
      // Where a template names its distractors, a miss is a NAMED mistake rather than a red
      // mark. A forced guess is not attributed to anything - it was not a mistake, it was the
      // clock. See engine/table.js for the Table Reading error modes.
      errorMode: !correct && !guessed ? (q.errors?.[picked] ?? null) : null,
      errorWhy: !correct && !guessed ? (q.whys?.[picked] ?? null) : null,
    };
    // Recorded against the TEMPLATE - see afoqtStorage for why per-instance is wrong grain.
    recordAnswer({ templateId: q.templateId, seed: q.seed, correct: entry.correct, elapsedMs: entry.elapsedMs });
    const next = [...answers, entry];
    setAnswers(next);
    questionStart.current = now;
    if (idx + 1 >= questions.length) finish(next);
    else setIdx(idx + 1);
  }, [questions, idx, answers, done, recordAnswer, finish]);

  // Whole-subtest countdown, matching how the real test administers: time cannot be banked
  // between questions, so a per-question timer would teach the wrong instinct.
  useEffect(() => {
    if (!timed || done) return;
    const t = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(t);
  }, [timed, done]);

  const remainingMs = budget.totalMs - elapsedMs;

  // Out of time. Rights-only scoring means a blank is strictly worse than a guess, so
  // unless the user disabled it, sweep the remainder with marks rather than leaving blanks.
  useEffect(() => {
    if (!timed || done || remainingMs > 0) return;
    if (answers.length >= questions.length || !progress.settings.autoGuessOnTimeout) {
      finish(answers);
      return;
    }
    const swept = [...answers];
    for (let i = answers.length; i < questions.length; i++) {
      const q = questions[i];
      const picked = Math.floor(Math.random() * q.choices.length);
      recordAnswer({ templateId: q.templateId, seed: q.seed, correct: picked === q.correctIndex, elapsedMs: 0 });
      swept.push({ picked, correct: picked === q.correctIndex, elapsedMs: 0, guessed: true });
    }
    setAnswers(swept);
    finish(swept);
  }, [timed, done, remainingMs, questions, answers, progress.settings.autoGuessOnTimeout, recordAnswer, finish]);

  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      const q = questions[idx];
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); }
      if (e.key === 'Escape') { e.preventDefault(); finish(answers); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, idx, done, submit, finish, answers]);

  if (questions.length === 0) {
    return (
      <div className="afq-runner">
        <p>No templates registered for {meta ? meta.name : subtest} yet.</p>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/drill')}>Back</button>
      </div>
    );
  }

  if (done) {
    const right = answers.filter((a) => a.correct).length;
    const guessed = answers.filter((a) => a.guessed).length;
    // The whole point of insisting distractors are error-modes: at the end of a run the tool
    // can say WHICH mistake was made and how often, which is a habit to fix rather than a score
    // to feel bad about. Ranked, because "you read Y as ascending four times" is the sentence
    // that changes the next drill.
    const modes = Object.entries(
      answers.reduce((acc, a) => {
        if (a.errorMode) acc[a.errorMode] = (acc[a.errorMode] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((p, q2) => q2[1] - p[1]);
    const avgSec = answers.length
      ? Math.round((answers.reduce((n, a) => n + a.elapsedMs, 0) / answers.length) / 100) / 10
      : 0;
    const overPace = avgSec - budget.realSecPerQuestion;
    return (
      <div className={'afq-runner afq-summary' + (wide ? ' afq-runner-wide' : '')}>
        <h2>{right} / {questions.length}</h2>
        <div className="afq-summary-grid">
          <div><span>{Math.round((right / questions.length) * 100)}%</span><label>Accuracy</label></div>
          <div><span>{avgSec}s</span><label>Avg / question</label></div>
          <div><span>{budget.realSecPerQuestion.toFixed(1)}s</span><label>Real pace</label></div>
          {guessed > 0 && <div><span>{guessed}</span><label>Auto-guessed</label></div>}
        </div>
        {overPace > 0 && (
          <p className="afq-warn">
            {overPace.toFixed(1)}s per question over the real pace for {meta ? meta.name : subtest}.
          </p>
        )}

        {chapter && phase === 'testout' && (
          <p className={right >= chapter.testOutPass ? 'afq-verdict afq-pass' : 'afq-verdict'}>
            {right >= chapter.testOutPass
              ? `Tested out of ${chapter.title}. Chapter marked done - skip the lesson.`
              : `Needed ${chapter.testOutPass} of ${questions.length}. Read the lesson, then come back.`}
          </p>
        )}
        {chapter && phase === 'mastery' && (
          <p className={right / questions.length >= MASTERY_THRESHOLD ? 'afq-verdict afq-pass' : 'afq-verdict'}>
            {right / questions.length >= MASTERY_THRESHOLD
              ? `${chapter.title} cleared.`
              : `${Math.round(MASTERY_THRESHOLD * 100)}% clears this chapter. Drill the misses below and retake it.`}
          </p>
        )}

        {modes.length > 0 && (
          <section className="afq-modes">
            <h3>How you missed them</h3>
            <ul>
              {modes.map(([id, n]) => (
                <li key={id}>
                  <span className="afq-mode-n">{n}x</span>
                  <span>{labelFor(id)}</span>
                </li>
              ))}
            </ul>
            {modes[0][1] >= 2 && (
              <p className="afq-note">
                {modes[0][1]} of your {answers.length - right} misses were the same mistake. That
                is one habit to fix, not {answers.length - right} questions to redo.
              </p>
            )}
          </section>
        )}

        {/* The single most useful screen in the whole tool: what went wrong, and why. Every
            template writes an explanation naming the error-mode its distractors encode, so a
            miss turns into a named mistake rather than a red mark. */}
        {answers.some((a) => !a.correct) && (
          <section className="afq-misses">
            <h3>What you missed</h3>
            {answers.map((a, i) => {
              if (a.correct) return null;
              const q = questions[i];
              if (!q) return null;
              return (
                <div key={i} className="afq-miss">
                  <p className="afq-miss-stem">{q.stem}</p>
                  {q.render && <Figure render={q.render} reveal />}
                  <p className="afq-miss-line">
                    <span className="afq-miss-bad">You: {a.guessed ? 'guessed' : q.choices[a.picked]}</span>
                    <span className="afq-miss-good">Answer: {q.choices[q.correctIndex]}</span>
                  </p>
                  {a.errorWhy && <p className="afq-miss-mode">You {a.errorWhy}.</p>}
                  {q.explanation && <p className="afq-miss-why">{q.explanation}</p>}
                </div>
              );
            })}
            <p className="afq-note">
              These templates are now in the miss pool and will resurface in about one in ten
              questions until you get them right on three separate days.
            </p>
          </section>
        )}

        <div className="afq-row">
          <button className="afq-btn afq-primary" onClick={() => navigate(0)}>Again</button>
          {chapter
            ? <button className="afq-btn" onClick={() => navigate(`/TKB/afoqt/learn/${chapter.id}`)}>Back to the chapter</button>
            : <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/drill')}>Change drill</button>}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const pace = paceCheck({
    elapsedMs, answeredCount: answers.length, totalMs: budget.totalMs, questionCount: questions.length,
  });
  const nudge = timed && shouldNudgeAbandon(subtest, Date.now() - questionStart.current);
  const sweepWarn = timed && shouldWarnGuessSweep(remainingMs, questions.length - answers.length);
  const barPct = Math.max(0, (remainingMs / budget.totalMs) * 100);

  return (
    <div className={'afq-runner' + (wide ? ' afq-runner-wide' : '')}>
      <header className="afq-runner-top">
        <span className="afq-pill">{meta ? meta.name : subtest}</span>
        <span className="afq-progress">{idx + 1} / {questions.length}</span>
        {timed && <span className={remainingMs < 30000 ? 'afq-clock low' : 'afq-clock'}>{formatClock(remainingMs)}</span>}
        {timed && (
          <span className={'afq-pace afq-pace-' + pace.state}>
            {pace.state === 'on' ? 'on pace' : Math.abs(pace.delta) + ' ' + pace.state}
          </span>
        )}
        <button className="afq-btn afq-ghost" onClick={() => finish(answers)}>End</button>
      </header>

      {timed && <div className="afq-bar"><div className="afq-bar-fill" style={{ width: barPct + '%' }} /></div>}

      {sweepWarn && <div className="afq-alert">Under 15s left. Mark every remaining question - there is no guessing penalty.</div>}

      <div className="afq-card">
        {q.render && <Figure render={q.render} />}
        <p className="afq-stem">{q.stem}</p>
        {/* A figure plus five stacked options runs past the bottom of a laptop screen, and
            scrolling to reach option E is not a cost the real test charges. Where the options
            are short - a three-digit table value is three characters - they lay out in a row
            instead, which is also how they are printed on the answer sheet. */}
        <ol className={'afq-choices' + (q.optionRender || (q.render && q.choices.every((c) => c.length <= 18)) ? ' afq-choices-row' : '')}>
          {q.choices.map((c, i) => (
            <li key={i}>
              <button
                className={'afq-choice' + (q.optionRender ? ' afq-choice-figure' : '')}
                onClick={() => submit(i)}
              >
                <span className="afq-letter">{LETTERS[i]}</span>
                {/* An option that IS a picture - Instrument Comprehension offers four aircraft,
                    not four phrases. The text description stays in the DOM for screen readers and
                    for the post-drill review, but is never shown beside the figure: reading it
                    would answer the question. */}
                {q.optionRender
                  ? <><Figure render={q.optionRender[i]} /><span className="afq-sr-only">{c}</span></>
                  : c}
              </button>
            </li>
          ))}
        </ol>
        {nudge && <p className="afq-nudge">5s - guess and move on.</p>}
      </div>

      <p className="afq-hint">Press {LETTERS.slice(0, q.choices.length).join(' / ')} to answer - Esc to end</p>
    </div>
  );
}
