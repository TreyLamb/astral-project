import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChem } from '../ChemApp';
import { buildChemDrill } from '../engine/drill';
import { getChemChapter } from '../curriculum';
import { recordChemTestOut, recordChemMastery, CHEM_MASTERY_THRESHOLD } from '../chemStorage';
import { mulberry32 } from '../../../engine/rng';
import { ChemReferenceContent } from './ChemResources';

const LETTERS = ['A', 'B', 'C', 'D'];

// Runs one drill/gate/mastery-check/mass-review session. Mirrors afoqt/views/DrillRunner.jsx,
// stripped of everything AFOQT-specific (pacing/clock/sweep/composite pressure) — see
// courses/chem/PLAN.md. `chapter` absent means a cross-chapter run (the "mass review" mode,
// reached from ChemPractice.jsx with no chapter param, same relationship AFOQT's
// DrillConfig -> DrillRunner has).
export default function ChemDrillRunner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { recordRun, mutate } = useChem();

  const count = Number(params.get('count') ?? 10);
  const chapter = getChemChapter(params.get('chapter') ?? '');
  const phase = params.get('phase') ?? 'free';
  const isGate = phase === 'testout' || phase === 'mastery';
  // Book-section scope, used by exam prep (ChemExamPrep.jsx). A run scoped this way is NOT
  // scoped to an ACS chapter and never touches gate/mastery state - one course chapter spans
  // more than one ACS chapter, so there is no chapter for it to be recorded against.
  const sectionParam = params.get('sections');
  const sections = sectionParam ? sectionParam.split(',').filter(Boolean) : null;
  const label = params.get('label');

  const questions = useMemo(() => {
    const rng = mulberry32(Date.now());
    return buildChemDrill({ count, rng, chapterId: chapter ? chapter.id : null, distinct: isGate, sections });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, chapter?.id, isGate, sectionParam]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Reference drawer, openable DURING a run (Trey: "it's supposed to be available while taking
  // a chem drill"). It overlays the question rather than navigating away, because leaving the
  // route would discard the run - `questions` is a useMemo keyed on the params, not persisted.
  const [showRef, setShowRef] = useState(false);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());

  const finish = useCallback((finalAnswers) => {
    setDone(true);
    const right = finalAnswers.filter((a) => a.correct).length;
    if (chapter && finalAnswers.length === questions.length) {
      if (phase === 'testout') {
        mutate((p) => recordChemTestOut(p, chapter.id, { correct: right, total: questions.length, pass: chapter.testOutPass }));
      } else if (phase === 'mastery') {
        mutate((p) => recordChemMastery(p, chapter.id, { correct: right, total: questions.length }));
      }
    }
    recordRun({
      id: Date.now().toString(36),
      chapter: chapter?.id ?? null,
      phase,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      correct: right,
      answered: finalAnswers.length,
    });
  }, [recordRun, chapter, phase, questions.length, mutate]);

  const submit = useCallback((picked) => {
    const q = questions[idx];
    if (!q || done) return;
    const correct = picked === q.correctIndex;
    const entry = {
      picked,
      correct,
      elapsedMs: Date.now() - questionStart.current,
      errorMode: !correct ? (q.errors?.[picked] ?? null) : null,
      errorWhy: !correct ? (q.whys?.[picked] ?? null) : null,
    };
    const next = [...answers, entry];
    setAnswers(next);
    questionStart.current = Date.now();
    if (idx + 1 >= questions.length) finish(next);
    else setIdx(idx + 1);
  }, [questions, idx, answers, done, finish]);

  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      const q = questions[idx];
      // R opens the reference. It is outside A-D, so it can never be mistaken for an answer.
      if (e.key.toUpperCase() === 'R') { e.preventDefault(); setShowRef((v) => !v); return; }
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); }
      // Escape closes the reference first if it is open, and only ends the run otherwise -
      // ending a 40-question drill because you wanted to shut a panel is not recoverable.
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showRef) setShowRef(false); else finish(answers);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, idx, done, submit, finish, answers, showRef]);

  if (questions.length === 0) {
    return (
      <div className="chq-runner">
        <p>No templates {label ? `for ${label}` : chapter ? `for ${chapter.title}` : 'registered'} yet.</p>
        <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem')}>Back</button>
      </div>
    );
  }

  if (done) {
    const right = answers.filter((a) => a.correct).length;
    const modes = Object.entries(
      answers.reduce((acc, a) => {
        if (a.errorMode) acc[a.errorMode] = (acc[a.errorMode] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((p, q2) => q2[1] - p[1]);

    return (
      <div className="chq-runner chq-summary">
        <h2>{right} / {questions.length}</h2>
        <div className="chq-summary-grid">
          <div><span>{Math.round((right / questions.length) * 100)}%</span><label>Accuracy</label></div>
        </div>

        {chapter && phase === 'testout' && (
          <p className={right >= chapter.testOutPass ? 'chq-verdict chq-pass' : 'chq-verdict'}>
            {right >= chapter.testOutPass
              ? `Tested out of ${chapter.title}. Chapter marked done — skip the lesson.`
              : `Needed ${chapter.testOutPass} of ${questions.length}. Read the lesson, drill it, and come back — the gate never blocks either of those.`}
          </p>
        )}
        {chapter && phase === 'mastery' && (
          <p className={right / questions.length >= CHEM_MASTERY_THRESHOLD ? 'chq-verdict chq-pass' : 'chq-verdict'}>
            {right / questions.length >= CHEM_MASTERY_THRESHOLD
              ? `${chapter.title} cleared.`
              : `${Math.round(CHEM_MASTERY_THRESHOLD * 100)}% clears this chapter. Drill it again — unlimited, any time — then retake the check.`}
          </p>
        )}

        {modes.length > 0 && (
          <section className="chq-modes">
            <h3>How you missed them</h3>
            <ul>
              {modes.map(([id, n]) => <li key={id}><span className="chq-mode-n">{n}x</span><span>{id}</span></li>)}
            </ul>
          </section>
        )}

        {answers.length > 0 && (
          <section className="chq-misses">
            <div className="chq-review-head">
              <h3>{showAll ? `Every question (${answers.length})` : 'What you missed'}</h3>
              <button className="chq-review-toggle" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)}>
                {showAll ? `Misses only (${answers.length - right})` : `Show all ${answers.length}`}
              </button>
            </div>
            {!showAll && right === answers.length && (
              <p className="chq-note">Nothing missed. Show all {answers.length} to read the explanations.</p>
            )}
            {answers.map((a, i) => {
              if (a.correct && !showAll) return null;
              const q = questions[i];
              if (!q) return null;
              return (
                <div key={i} className={a.correct ? 'chq-miss chq-hit' : 'chq-miss'}>
                  <p className="chq-miss-stem"><span className="chq-miss-n">{i + 1}</span>{q.stem}</p>
                  <p className="chq-miss-line">
                    {a.correct
                      ? <span className="chq-miss-good">You: {q.choices[q.correctIndex]}</span>
                      : (<>
                          <span className="chq-miss-bad">You: {q.choices[a.picked]}</span>
                          <span className="chq-miss-good">Answer: {q.choices[q.correctIndex]}</span>
                        </>)}
                  </p>
                  {a.errorWhy && <p className="chq-miss-mode">You {a.errorWhy}.</p>}
                  {q.explanation && <p className="chq-miss-why">{q.explanation}</p>}
                </div>
              );
            })}
          </section>
        )}

        <div className="chq-row">
          <button className="chq-btn chq-primary" onClick={() => navigate(0)}>Again</button>
          {chapter
            ? <button className="chq-btn" onClick={() => navigate(`/TKB/courses/chem/${chapter.id}`)}>Back to the chapter</button>
            : sections
              ? <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/exam')}>Change exam prep</button>
              : <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/practice')}>Change mass review</button>}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="chq-runner">
      <header className="chq-runner-top">
        <span className="chq-pill">{label ?? (chapter ? chapter.title : 'Mass review')}</span>
        <span className="chq-progress">{idx + 1} / {questions.length}</span>
        <button
          className={'chq-btn chq-ghost' + (showRef ? ' chq-primary' : '')}
          aria-expanded={showRef}
          onClick={() => setShowRef((v) => !v)}
        >
          {showRef ? 'Close reference' : 'Reference'}
        </button>
        <button className="chq-btn chq-ghost" onClick={() => finish(answers)}>End</button>
      </header>

      {showRef && (
        <aside className="chq-ref-drawer">
          <div className="chq-ref-drawer-head">
            <strong>Reference</strong>
            <button className="chq-btn chq-ghost" onClick={() => setShowRef(false)}>Close</button>
          </div>
          <div className="chq-ref-drawer-body"><ChemReferenceContent /></div>
        </aside>
      )}

      <div className="chq-card">
        <p className="chq-stem">{q.stem}</p>
        <ol className="chq-choices">
          {q.choices.map((c, i) => (
            <li key={i}>
              <button className="chq-choice" onClick={() => submit(i)}>
                <span className="chq-letter">{LETTERS[i]}</span>{c}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <p className="chq-hint">Press {LETTERS.slice(0, q.choices.length).join(' / ')} to answer · R for the reference sheet · Esc to end</p>
    </div>
  );
}
