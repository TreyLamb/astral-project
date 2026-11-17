import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChem } from '../ChemApp';
import { buildChemDrill } from '../engine/drill';
import { getChemChapter } from '../curriculum';
import { recordChemTestOut, recordChemMastery, CHEM_MASTERY_THRESHOLD } from '../chemStorage';
import { mulberry32, shuffle } from '../../../engine/rng';
import { REVIEW2_REAL_ITEMS } from '../examReview2Items';
import { ChemReferenceContent } from './ChemResources';
import { ConceptContent } from './ChemConceptView';
import { conceptPageFor } from '../concepts';
import { chemHints } from '../engine/hints';
import ChemStem, { inline } from './ChemStem';
import { allChemTemplates } from '../engine/generator';
import { buildPracticeSet } from '../engine/practice';

const LETTERS = ['A', 'B', 'C', 'D'];

// The run in progress is saved to this browser after every answer, so a crash or a refresh never
// costs a test again (2026-11-02: a results-screen crash lost a 40-question, 3-hour run).
// /TKB/courses/chem/drill/run?resume=last reopens it, answers and position intact.
const SAVE_KEY = 'chq_run_in_progress_v1';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null'); } catch { return null; } };
const saveRun = (run) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch { /* private mode: nothing to do */ } };

// Runs one drill/gate/mastery-check/mass-review session. Mirrors afoqt/views/DrillRunner.jsx,
// stripped of everything AFOQT-specific (pacing/clock/sweep/composite pressure) — see
// courses/chem/PLAN.md. `chapter` absent means a cross-chapter run (the "mass review" mode,
// reached from ChemPractice.jsx with no chapter param, same relationship AFOQT's
// DrillConfig -> DrillRunner has).
export default function ChemDrillRunner({ practice = null }) {
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
  // "3:2,4:2,1:1,2:1" - course chapter : relative weight. Set by exam prep so a cumulative exam
  // run leans on the new chapters instead of on whichever chapter has the most templates.
  const weightParam = params.get('weights');
  const chapterWeights = useMemo(
    () => (weightParam ? Object.fromEntries(weightParam.split(',').map((p) => p.split(':')).map(([c, w]) => [c, Number(w)])) : null),
    [weightParam],
  );

  // ?sheet=exam2-review works the professor's whole Exam 2 review sheet in its own order — every
  // question once, options shuffled — instead of sampling it like a template pool.
  const sheet = params.get('sheet');
  const resume = params.get('resume') === 'last' ? loadSaved() : null;
  const questions = useMemo(() => {
    if (practice) return practice.questions;
    if (resume?.questions?.length) return resume.questions;
    const rng = mulberry32(Date.now());
    if (sheet === 'exam2-review') {
      return REVIEW2_REAL_ITEMS.map((it, i) => {
        const order = shuffle(it.choices.map((_, j) => j), rng);
        return {
          templateId: `sheet-exam2-${i + 1}`,
          section: it.section,
          stem: `Q${i + 1}. ${it.stem}`,
          choices: order.map((j) => it.choices[j]),
          correctIndex: order.indexOf(it.correctIndex),
          explanation: it.explanation,
          errors: null,
          whys: null,
        };
      });
    }
    return buildChemDrill({ count, rng, chapterId: chapter ? chapter.id : null, distinct: isGate, sections, chapterWeights });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, chapter?.id, isGate, sectionParam, chapterWeights, sheet]);

  const [idx, setIdx] = useState(() => (resume && !practice ? resume.idx ?? 0 : 0));
  // Practice mode (engine/practice.js): a set built around the question he is on. The test stays
  // mounted underneath, so "Back to the test" returns to the same question with answers intact.
  const [practiceSet, setPracticeSet] = useState(null);
  const [answers, setAnswers] = useState(() => (resume && !practice ? resume.answers ?? [] : []));
  // Saved only once this run has an answer, so opening a fresh test never wipes a saved one.
  const [done, setDone] = useState(false);
  const [saved] = useState(() => (practice || resume ? null : loadSaved()));
  useEffect(() => {
    if (practice || !questions.length || !answers.some(Boolean)) return;
    saveRun({ label: resume?.label ?? label ?? null, questions, answers, idx, done, savedAt: Date.now() });
  }, [practice, questions, answers, idx, done, label, resume?.label]);
  const [dismissSaved, setDismissSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Reference drawer, openable DURING a run (Trey: "it's supposed to be available while taking
  // a chem drill"). It overlays the question rather than navigating away, because leaving the
  // route would discard the run - `questions` is a useMemo keyed on the params, not persisted.
  const [showRef, setShowRef] = useState(false);
  // The "Explain further" page for a missed question's section, shown over the results. A drawer,
  // not a route: navigating away and back would rebuild the drill and lose the results.
  const [deeper, setDeeper] = useState(null);
  // Hints are revealed one at a time; the first names the constants needed, never their values.
  const [hintN, setHintN] = useState(0);
  useEffect(() => { setHintN(0); }, [idx]);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());

  const finish = useCallback((finalAnswers) => {
    setDone(true);
    const right = finalAnswers.filter((a) => a && a.correct).length;
    if (chapter && finalAnswers.filter(Boolean).length === questions.length) {
      if (phase === 'testout') {
        mutate((p) => recordChemTestOut(p, chapter.id, { correct: right, total: questions.length, pass: chapter.testOutPass }));
      } else if (phase === 'mastery') {
        mutate((p) => recordChemMastery(p, chapter.id, { correct: right, total: questions.length }));
      }
    }
    if (practice) return;
    recordRun({
      id: Date.now().toString(36),
      chapter: chapter?.id ?? null,
      phase,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      correct: right,
      answered: finalAnswers.filter(Boolean).length,
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
    // Answers are stored BY QUESTION so he can go back and change one (Trey, 2026-11-02).
    const next = [...answers];
    next[idx] = entry;
    setAnswers(next);
    questionStart.current = Date.now();
    if (idx + 1 < questions.length) setIdx(idx + 1);
  }, [questions, idx, answers, done, finish]);

  useEffect(() => {
    const onKey = (e) => {
      // The global Notes scratchpad floats over every page - without this guard typing a note
      // fires answer letters, R and Escape into the running drill.
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (practiceSet) return;
      if (done) return;
      // Never act on a chord: Ctrl+C / Ctrl+R / Cmd+H belong to the browser.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toUpperCase() === 'R') { e.preventDefault(); setShowRef((v) => !v); return; }
      if (e.key.toUpperCase() === 'H') { e.preventDefault(); setHintN((n) => n + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setIdx((i) => Math.min(questions.length - 1, i + 1)); return; }
      // NO letter hotkeys for answers (Trey, 2026-11-02, said it before: a stray key or Ctrl+C
      // answered the question). Answers are tap/click only.
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
    const right = answers.filter((a) => a && a.correct).length;
    const modes = Object.entries(
      answers.reduce((acc, a) => {
        if (a?.errorMode) acc[a.errorMode] = (acc[a.errorMode] ?? 0) + 1;
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

        {/* Walks QUESTIONS, not answers: with Back/Next an answer slot can be empty (a skipped
            question), and reading .correct off an empty slot crashed this screen on 2026-11-02
            after Trey's 40-question run. A skipped question is shown as skipped. */}
        {questions.length > 0 && (
          <section className="chq-misses">
            <div className="chq-review-head">
              <h3>{showAll ? `Every question (${questions.length})` : 'What you missed or skipped'}</h3>
              <button className="chq-review-toggle" aria-pressed={showAll} onClick={() => setShowAll((v) => !v)}>
                {showAll ? `Misses only (${questions.length - right})` : `Show all ${questions.length}`}
              </button>
            </div>
            {!showAll && right === questions.length && (
              <p className="chq-note">Nothing missed. Show all {questions.length} to read the explanations.</p>
            )}
            {questions.map((q, i) => {
              const a = answers[i] ?? { skipped: true, correct: false, picked: null };
              if (a.correct && !showAll) return null;
              return (
                <div key={i} className={a.correct ? 'chq-miss chq-hit' : 'chq-miss'}>
                  <div className="chq-miss-stem"><span className="chq-miss-n">{i + 1}</span><ChemStem text={q.stem} className="chq-stem-inline" /></div>
                  <p className="chq-miss-line">
                    {a.correct
                      ? <span className="chq-miss-good">You: {q.choices[q.correctIndex]}</span>
                      : (<>
                          <span className="chq-miss-bad">{a.skipped ? 'Skipped' : `You: ${q.choices[a.picked]}`}</span>
                          <span className="chq-miss-good">Answer: {q.choices[q.correctIndex]}</span>
                        </>)}
                  </p>
                  {a.errorWhy && <p className="chq-miss-mode">You {a.errorWhy}.</p>}
                  {q.explanation && <p className="chq-miss-why">{q.explanation}</p>}
                  {q.section && conceptPageFor(q.section) && (
                    <button
                      className="chq-explain"
                      onClick={() => setDeeper(q.section)}
                      title={`Go deeper on Sec ${q.section} — the rules, worked math, and the source text`}
                    >
                      ? Explain further — Sec {q.section}
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {deeper && conceptPageFor(deeper) && (
          <aside className="chq-ref-drawer" role="dialog" aria-label={`Sec ${deeper} explained`}>
            <div className="chq-ref-drawer-head">
              <strong>Sec {deeper} — explained</strong>
              <button className="chq-btn chq-ghost" onClick={() => setDeeper(null)}>Back to results</button>
            </div>
            <div className="chq-ref-drawer-body"><ConceptContent page={conceptPageFor(deeper)} /></div>
          </aside>
        )}

        {practice ? (
          <div className="chq-row">
            <button className="chq-btn chq-primary" onClick={practice.onExit}>Back to the test</button>
          </div>
        ) : (
        <div className="chq-row">
          <button className="chq-btn chq-primary" onClick={() => navigate(0)}>Again</button>
          {chapter
            ? <button className="chq-btn" onClick={() => navigate(`/TKB/courses/chem/${chapter.id}`)}>Back to the chapter</button>
            : sections
              ? <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/exam')}>Change exam prep</button>
              : <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/practice')}>Change mass review</button>}
        </div>
        )}
      </div>
    );
  }

  if (practiceSet) {
    return <ChemDrillRunner practice={{ ...practiceSet, onExit: () => setPracticeSet(null) }} />;
  }

  const q = questions[idx];
  const startPractice = (x) => {
    const set = buildPracticeSet(q, x, mulberry32(Date.now()));
    setPracticeSet({ ...set, size: x, label: `Practice: ${allChemTemplates().find((t) => t.id === q.templateId)?.name ?? 'this question'}` });
  };
  return (
    <div className="chq-runner">
      <header className="chq-runner-top">
        <span className="chq-pill">{practice ? practice.label : label ?? (chapter ? chapter.title : 'Mass review')}</span>
        <span className="chq-progress">{idx + 1} / {questions.length}</span>
        <button
          className={'chq-btn chq-ghost' + (showRef ? ' chq-primary' : '')}
          aria-expanded={showRef}
          onClick={() => setShowRef((v) => !v)}
        >
          {showRef ? 'Close reference' : 'Reference'}
        </button>
        {practice
          ? <button className="chq-btn chq-ghost" onClick={practice.onExit}>Back to the test</button>
          : <button className="chq-btn chq-ghost" onClick={() => finish(answers)}>Finish</button>}
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

      {saved && !saved.done && !dismissSaved && !answers.some(Boolean) && saved.answers?.some(Boolean) && (
        <div className="chq-res-warn chq-row chq-practice">
          <span>
            You have an unfinished test{saved.label ? ` (${saved.label})` : ''}: {saved.answers.filter(Boolean).length} of {saved.questions.length} answered.
          </span>
          <button className="chq-btn chq-primary" onClick={() => { window.location.href = '/TKB/courses/chem/drill/run?resume=last'; }}>Resume it</button>
          <button className="chq-btn chq-ghost" onClick={() => setDismissSaved(true)}>Start this new one</button>
        </div>
      )}
      <div className="chq-runner-body">
      <div className="chq-main">
      <div className="chq-card">
        <ChemStem text={q.stem} />
        <ol className="chq-choices">
          {q.choices.map((c, i) => (
            <li key={i}>
              <button className={'chq-choice' + (answers[idx]?.picked === i ? ' chq-choice-picked' : '')} onClick={() => submit(i)}>
                <span className="chq-letter">{LETTERS[i]}</span>{inline(c, i)}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="chq-row chq-nav">
        <button className="chq-btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Back</button>
        <span className="chq-progress">{answers.filter(Boolean).length} of {questions.length} answered</span>
        {idx + 1 < questions.length
          ? <button className="chq-btn" onClick={() => setIdx(idx + 1)}>Next →</button>
          : <button className="chq-btn chq-primary" onClick={() => finish(answers)}>Finish test</button>}
      </div>

      <p className="chq-hint">Tap an answer · ← / → to move · H for a hint · R for the reference sheet · Esc to end</p>
      </div>

      {/* Side panel: on a PC it sits to the right of the question; on a phone it drops below. */}
      <aside className="chq-side">
        {(() => {
          const hints = chemHints(q, allChemTemplates().find((t) => t.id === q.templateId)?.name);
          return (
            <div className="chq-hints">
              {hints.slice(0, hintN).map((t, i) => <p key={i} className="chq-res-note">💡 {inline(t, i)}</p>)}
              {hintN < hints.length && (
                <button className="chq-btn chq-ghost" onClick={() => setHintN((n) => n + 1)}>
                  {hintN === 0 ? 'Hint' : 'Next hint'} ({hintN + 1}/{hints.length})
                </button>
              )}
            </div>
          );
        })()}
      {practice && idx === 0 && practice.shortBy > 0 && (
        <p className="chq-res-warn">
          This skill has only {practice.siblingsUsed} other question type{practice.siblingsUsed === 1 ? '' : 's'} in the bank so far,
          so {practice.shortBy} of the &quot;different kind&quot; slots are filled with this same type
          {practice.questions.length < practice.size ? ` (and only ${practice.questions.length} fresh questions exist)` : ''}.
          More types are being written.
        </p>
      )}
      {practice && q.practiceKind === 'related' && <p className="chq-data-label">Same skill, different kind of question</p>}
      {!practice && q.templateId && !String(q.templateId).startsWith('sheet-') && (
        <div className="chq-row chq-practice">
          <span className="chq-data-label">Stuck? Practice this:</span>
          <button className="chq-btn chq-ghost" onClick={() => startPractice(5)}>5 questions</button>
          <button className="chq-btn chq-ghost" onClick={() => startPractice(10)}>10 questions</button>
        </div>
      )}
      </aside>
      </div>
    </div>
  );
}
