import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { assembleDrill } from '../engine/drill';
import { generateInstance } from '../engine/generator';
import { bankItemByTemplateId } from '../engine/bank';
import { getSubtest } from '../engine/afoqtSpec';
import { getChapter, CHAPTERS } from '../curriculum/chapters';
import {
  recordTestOut, recordMastery, MASTERY_THRESHOLD, isChapterDone, latestDiagnostic,
  addToWordBank, removeFromWordBank, isFlagged, addFlag, removeFlag,
} from '../afoqtStorage';
import { nextPersonalizedChapter } from '../curriculum/personalize';
import { paceBudget, paceCheck, shouldNudgeAbandon, shouldWarnGuessSweep, formatClock } from '../engine/timing';
import { labelFor } from '../engine/errorModes';
import Figure from '../render/Figure';
import useQuestionVoice from '../voice/useQuestionVoice';
import VoiceBar from '../voice/VoiceBar';
import { mulberry32 } from '../../engine/rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Where a question came from, shown under every miss.
 *
 * Trey's request, and the reason is diagnostic rather than legal. A brutal Verbal Analogies run
 * needs to be readable as one of two completely different things: "this is the real AFOQT
 * difficulty and I have to get used to it", or "this one is ours and might simply be off".
 * Without the label those two feel identical from the inside, and the wrong conclusion is
 * expensive either way - you either dismiss a real weakness or chase a phantom one.
 *
 * Deliberately shown only in the post-drill review, never beside a live question. Knowing an
 * item is official while answering it is a nudge toward trusting it, which is exactly the
 * judgement the review is supposed to let him make with a clear head.
 */
// A question that was never answered. It still gets a card in the review, because on a
// rights-only test it cost the same as a wrong answer and the reader still needs the answer and
// the explanation. Distinguished from a miss rather than merged into one: "you did not get to
// this" and "you got this wrong" call for different fixes - pace versus understanding.
function UnansweredItem({ n, q }) {
  return (
    <div className="afq-miss afq-blank">
      <p className="afq-miss-stem">
        <span className="afq-miss-n">{n}</span>{' '}{q.stem}
      </p>
      {q.render && <Figure render={q.render} reveal />}
      <p className="afq-miss-line">
        <span className="afq-miss-bad">Left blank — no answer marked</span>
        <span className="afq-miss-good">Answer: {q.choices[q.correctIndex]}</span>
      </p>
      {q.explanation && <p className="afq-miss-why">{q.explanation}</p>}
      <SourceLine q={q} />
    </div>
  );
}

function SourceLine({ q }) {
  const p = q.provenance ?? { kind: 'authored' };
  let tone = 'authored';
  let label = 'Written for this tool';
  let detail = q.templateId?.startsWith('bank:') ? null : q.templateId;

  if (p.kind === 'real') {
    tone = 'real';
    label = 'Official USAF question';
    detail = p.source ?? null;
  } else if (p.kind === 'derived') {
    tone = 'derived';
    label = 'Ours, modelled on a real item';
    detail = p.source ?? null;
  } else if (/asvab/i.test(p.source ?? '')) {
    tone = 'asvab';
    label = 'Migrated ASVAB item';
    detail = 'not an AFOQT question - treat its difficulty as indicative only';
  }

  return (
    <p className={`afq-miss-source afq-src-${tone}`}>
      <span className="afq-src-tag">{label}</span>
      {detail && <span className="afq-src-detail">{detail}</span>}
      {p.url && (
        <a className="afq-src-link" href={p.url} target="_blank" rel="noreferrer">source</a>
      )}
    </p>
  );
}

/** First unanswered index scanning forward from (after) `from`, wrapping once; `from` itself if
 *  every other question is already answered - free navigation means "advance" can run out of
 *  places to go without the whole run being done. */
function nextUnanswered(answersArr, from) {
  const n = answersArr.length;
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n;
    if (answersArr[i] == null) return i;
  }
  return from;
}

export default function DrillRunner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { progress, recordAnswer, recordRun, mutate, updateVoice } = useAfoqt();

  const subtest = params.get('subtest') ?? 'MK';
  const count = Number(params.get('count') ?? 5);
  const mode = params.get('mode') ?? progress.settings.mode;
  const pressure = Number(params.get('pressure') ?? progress.settings.pressure);
  const timed = mode !== 'untimed';
  // Band 5 / `stretch` - see DrillConfig.jsx for why this is the only place that ever sets
  // includeStretch: true. Exam mode never carries this param (DrillConfig clears it the moment
  // exam is chosen), so a real-test simulation still can't accidentally include ceiling content.
  const includeStretch = params.get('stretch') === '1';
  // `?bands=1,2`. Parsed defensively - a junk value must fall back to "every band" rather than
  // to an empty array, which would assemble a drill of zero questions and look like a crash.
  const bandFilter = (() => {
    const raw = params.get('bands');
    if (!raw) return null;
    const list = raw.split(',').map(Number).filter((n) => n >= 1 && n <= 5);
    return list.length ? list : null;
  })();
  // `bandFilter` is a fresh array on every render, so the memo below keys off this string
  // instead - passing the array itself would rebuild the whole drill each render.
  const bandKey = bandFilter?.join(',') ?? '';

  // A chapter-scoped run: the test-out gate, the chapter drill, or the mastery check.
  const chapter = getChapter(params.get('chapter') ?? '');
  const phase = params.get('phase') ?? 'free';
  const isGate = phase === 'testout' || phase === 'mastery';
  // The diagnostic's expedited gate shortens the question count AND the pass threshold together
  // (see engine/diagnostic.js EXPEDITED_TEST_OUT_COUNT) - ChapterView always sends `need`
  // explicitly rather than this component re-deriving it, so a standard gate and an expedited one
  // are the same code path here.
  const passOverride = params.get('need') != null ? Number(params.get('need')) : null;
  const testOutPass = chapter ? (passOverride ?? chapter.testOutPass) : null;
  // Exam mode is a simulation of the real subtest, which means it is a measurement rather than
  // practice - see `exam` in engine/drill.js for what that switches off.
  const isExam = mode === 'exam';

  const meta = getSubtest(subtest);
  const budget = useMemo(() => paceBudget(subtest, count, pressure), [subtest, count, pressure]);

  // A flagged question is replayed verbatim rather than re-assembled - (templateId, seed)
  // regenerates byte-identically (engine/generator.js), which is the whole reason a flag can be
  // keyed on that pair in the first place. Bypasses assembleDrill entirely: a 1-question, untimed,
  // no-chapter, no-scoring "just look at it again" queue.
  const replayTemplateId = params.get('templateId');
  const replaySeed = params.get('seed') != null ? Number(params.get('seed')) : null;

  // Build once. A drill is a fixed queue; rebuilding on re-render would reshuffle underfoot.
  //
  // `progress` is read here but deliberately left out of the dependency list: it changes on
  // every answered question, and re-running this would rebuild the queue mid-drill.
  const questions = useMemo(() => {
    if (replayTemplateId && replaySeed != null) {
      // Bank items (real OATTS / migrated ASVAB questions - see engine/bank.js) have no
      // template+rng behind them to regenerate; the item itself IS the content, looked up by id.
      const one = replayTemplateId.startsWith('bank:')
        ? bankItemByTemplateId(replayTemplateId)
        : generateInstance(replayTemplateId, replaySeed);
      return one ? [one] : [];
    }
    const rng = mulberry32(Date.now());
    return assembleDrill({
      subtest,
      count,
      rng,
      progress,
      concepts: chapter ? chapter.concepts : null,
      // A chapter gate fixes the bands; otherwise `?bands=1,2` may fix them, which is what the
      // speed drill uses. Without a caller for either, a drill spans every band the subtest has
      // and a "run the easy ones fast" session was impossible to build.
      bands: chapter ? chapter.bands : bandFilter,
      // A gate has to be an honest sample of the chapter, so no miss-pool weighting.
      ignoreMissPool: isGate,
      exam: isExam,
      includeStretch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtest, count, chapter?.id, isGate, isExam, includeStretch, replayTemplateId, replaySeed,
    bandKey]);

  // A 33x33 Table Reading grid needs about 950px; a question stem reads best at 760. So the
  // column widens only when the questions actually carry a figure, rather than making every
  // text drill in the tool sprawl.
  const wide = questions.some((q) => q.render);

  // `current` is a VIEWING position, not a progress cursor - free navigation (back/forward, the
  // rail, jumping around) means it can move in either direction or land on an already-answered
  // question. `answers` is therefore sparse and INDEX-addressed (one slot per question, filled
  // in place), not a push-array - Trey's request: "if I know the answer I can navigate to it no
  // matter how long it takes; the interface shouldn't be the obstacle, the clock and the content
  // are the real difficulty." Re-submitting on an already-answered question overwrites it, so
  // going back to change an answer works the way it would on paper.
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(null));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [done, setDone] = useState(false);
  // The results page is about the misses by default - a wall of 40 correct answers buries the
  // three that matter. But provenance is worth reading on a question you got RIGHT too ("was
  // that official, or ours?"), so the whole run is one click away.
  const [showAll, setShowAll] = useState(false);
  // WK-only "cheat" mode: Trey's request, 2026-08-30 - "I want to be able to hover or click to
  // see the definition of a word" while drilling, as a deliberate opt-in study mode distinct from
  // testing. `revealMode` is sticky for the session; `revealed` is per-question and resets on
  // navigation so the next word isn't spoiled by habit.
  const [revealMode, setRevealMode] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());

  useEffect(() => { questionStart.current = Date.now(); setRevealed(false); }, [current]);

  const answeredCount = useMemo(() => answers.filter((a) => a != null).length, [answers]);

  const finish = useCallback((finalAnswers) => {
    setDone(true);
    const answered = finalAnswers.filter((a) => a != null);
    const right = answered.filter((a) => a.correct).length;
    // A gate only counts if EVERY question was actually answered - bailing out early must not
    // record a failed test-out attempt against the chapter.
    if (chapter && answered.length === questions.length) {
      if (phase === 'testout') {
        mutate((p) => recordTestOut(p, chapter.id, { correct: right, total: questions.length, pass: testOutPass }));
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
      correct: right,
      answered: answered.length,
      totalMs: Date.now() - startedAt.current,
    });
  }, [recordRun, subtest, mode, pressure, count, chapter, phase, questions.length, mutate, testOutPass]);

  const submit = useCallback((picked, opts) => {
    const guessed = !!(opts && opts.guessed);
    const q = questions[current];
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
    // A genuinely missed Word Knowledge word joins the standing word bank - see afoqtStorage.js
    // "word bank" for why this is separate from the miss pool. Gated on the same
    // `!correct && !guessed` the error-mode capture above already uses: a clock-forced random
    // pick says nothing about whether the word itself is known.
    if (!correct && !guessed && q.vocab) mutate((p) => addToWordBank(p, q.vocab));
    // Plain computed values, not a functional updater with setCurrent nested inside it - React
    // Strict Mode double-invokes a setState updater function to catch exactly this shape of bug
    // (a side effect living inside what's supposed to be a pure state-derivation function), and
    // the nested setCurrent call genuinely fired twice, silently double-advancing past a question
    // every time one was answered. `answers` is in the dependency list so this closure is never
    // stale, the same guarantee the updater form existed to provide.
    const next = [...answers];
    next[current] = entry;
    setAnswers(next);
    // Advance to the next unanswered question - the familiar "answer, move on" flow for a fresh
    // linear run. Re-answering a question reached via the rail/back-forward just overwrites it
    // in place without forcing a jump anywhere.
    setCurrent(nextUnanswered(next, current));
  }, [questions, current, done, recordAnswer, mutate, answers]);

  // Voice. Declared up here rather than beside the question card because hooks cannot live after
  // the early returns below, and `active` is the same question the card renders - it is read from
  // `questions[current]` in both places.
  const active = questions[current] ?? null;
  const onVoiceCommand = useCallback((name) => {
    if (name === 'next') { setCurrent((c) => Math.min(questions.length - 1, c + 1)); return; }
    if (name === 'back') { setCurrent((c) => Math.max(0, c - 1)); return; }
    if (name === 'finish') { finish(answers); return; }
    if (name === 'flag') {
      const cur = questions[current];
      if (!cur) return;
      mutate((p) => (isFlagged(p, cur.templateId, cur.seed)
        ? removeFlag(p, cur.templateId, cur.seed)
        : addFlag(p, { templateId: cur.templateId, seed: cur.seed, subtest, stem: cur.stem })));
    }
  }, [questions, current, answers, finish, mutate, subtest]);

  const voice = useQuestionVoice({
    q: active,
    subtest,
    enabled: !done,
    settings: progress.settings.voice,
    onPick: submit,
    onCommand: onVoiceCommand,
  });

  // Whole-subtest countdown, matching how the real test administers: time cannot be banked
  // between questions, so a per-question timer would teach the wrong instinct.
  useEffect(() => {
    if (!timed || done) return;
    const t = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 200);
    return () => clearInterval(t);
  }, [timed, done]);

  const remainingMs = budget.totalMs - elapsedMs;

  // Out of time. Rights-only scoring means a blank is strictly worse than a guess, so
  // unless the user disabled it, sweep every still-unanswered slot with a random mark.
  useEffect(() => {
    if (!timed || done || remainingMs > 0) return;
    if (answeredCount >= questions.length || !progress.settings.autoGuessOnTimeout) {
      finish(answers);
      return;
    }
    const swept = [...answers];
    for (let i = 0; i < questions.length; i++) {
      if (swept[i] != null) continue;
      const q = questions[i];
      const picked = Math.floor(Math.random() * q.choices.length);
      recordAnswer({ templateId: q.templateId, seed: q.seed, correct: picked === q.correctIndex, elapsedMs: 0 });
      swept[i] = { picked, correct: picked === q.correctIndex, elapsedMs: 0, guessed: true };
    }
    setAnswers(swept);
    finish(swept);
  }, [timed, done, remainingMs, questions, answers, answeredCount, progress.settings.autoGuessOnTimeout, recordAnswer, finish]);

  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      const q = questions[current];
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (q && i >= 0 && i < q.choices.length) { e.preventDefault(); submit(i); return; }
      // R for repeat - outside A-E, so it costs nothing, and it is the one voice control worth a
      // key: re-reading a question you half-heard is the most common thing you want. Gated on
      // voice being on, because a browser refuses to speak before the toggle's user gesture and a
      // key that silently does nothing is worse than one that does not exist.
      if (voice.on && e.key.toUpperCase() === 'R') { e.preventDefault(); voice.readQuestion(); return; }
      if (e.key === 'Escape') { e.preventDefault(); finish(answers); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrent((c) => Math.max(0, c - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setCurrent((c) => Math.min(questions.length - 1, c + 1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, current, done, submit, finish, answers, voice]);

  if (questions.length === 0) {
    return (
      <div className="afq-runner">
        <p>No templates registered for {meta ? meta.name : subtest} yet.</p>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/drill')}>Back</button>
      </div>
    );
  }

  if (done) {
    const answered = answers.filter((a) => a != null);
    const right = answered.filter((a) => a.correct).length;
    const guessed = answered.filter((a) => a.guessed).length;
    // A blank is a LOST POINT, not an absent question. The AFOQT is rights-only scored, so
    // leaving one empty costs exactly what getting it wrong costs - and the review used to
    // measure itself against `answered` rather than the whole run, which meant answering 2 of 6
    // correctly and skipping the rest printed "2 / 6" and "Nothing missed" on the same screen.
    // Everything below counts against questions.length for that reason.
    const blank = questions.length - answered.length;
    // The whole point of insisting distractors are error-modes: at the end of a run the tool
    // can say WHICH mistake was made and how often, which is a habit to fix rather than a score
    // to feel bad about. Ranked, because "you read Y as ascending four times" is the sentence
    // that changes the next drill.
    const modes = Object.entries(
      answered.reduce((acc, a) => {
        if (a.errorMode) acc[a.errorMode] = (acc[a.errorMode] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((p, q2) => q2[1] - p[1]);
    const avgSec = answered.length
      ? Math.round((answered.reduce((n, a) => n + a.elapsedMs, 0) / answered.length) / 100) / 10
      : 0;
    const overPace = avgSec - budget.realSecPerQuestion;
    // `progress` already reflects this run's recordTestOut/recordMastery mutate() call by the
    // time this renders, so isChapterDone is checked fresh here rather than re-deriving pass/fail
    // locally - covers a just-passed gate AND a practice run on a chapter that was already done.
    // This is the fix for "don't make me go back to the map to find the next chapter."
    const chapterDoneNow = chapter && isChapterDone(progress, chapter.id);
    const nextChapter = chapterDoneNow
      ? nextPersonalizedChapter(CHAPTERS, progress, latestDiagnostic(progress)?.results ?? null)
      : null;
    // Flags are read fresh from stored progress rather than tracked locally, same reasoning as
    // the flag toggle button below - a flag set two questions ago should show up here even
    // though nothing about THIS render path touched it directly.
    const flaggedIdx = questions
      .map((q, i) => (isFlagged(progress, q.templateId, q.seed) ? i : -1))
      .filter((i) => i >= 0);
    return (
      <div className={'afq-runner afq-summary' + (wide ? ' afq-runner-wide' : '')}>
        <h2>{right} / {questions.length}</h2>
        <div className="afq-summary-grid">
          <div><span>{Math.round((right / questions.length) * 100)}%</span><label>Accuracy</label></div>
          <div><span>{avgSec}s</span><label>Avg / question</label></div>
          <div><span>{budget.realSecPerQuestion.toFixed(1)}s</span><label>Real pace</label></div>
          {guessed > 0 && <div><span>{guessed}</span><label>Auto-guessed</label></div>}
          {blank > 0 && <div><span className="afq-over">{blank}</span><label>Left blank</label></div>}
          {flaggedIdx.length > 0 && <div><span>🚩 {flaggedIdx.length}</span><label>Flagged</label></div>}
        </div>
        {overPace > 0 && (
          <p className="afq-warn">
            {overPace.toFixed(1)}s per question over the real pace for {meta ? meta.name : subtest}.
          </p>
        )}

        {chapter && phase === 'testout' && (
          <p className={right >= testOutPass ? 'afq-verdict afq-pass' : 'afq-verdict'}>
            {right >= testOutPass
              ? `Tested out of ${chapter.title}. Chapter marked done - skip the lesson.`
              : `Needed ${testOutPass} of ${questions.length}. Read the lesson, then come back.`}
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
                {modes[0][1]} of your {answered.length - right} misses were the same mistake. That
                is one habit to fix, not {answered.length - right} questions to redo.
              </p>
            )}
          </section>
        )}

        {/* Flagged questions surface here regardless of right/wrong, per Trey's request - a
            flag means "look at this again", which is orthogonal to whether it was missed. */}
        {flaggedIdx.length > 0 && (
          <section className="afq-modes">
            <h3>🚩 Flagged this run</h3>
            <ul>
              {flaggedIdx.map((i) => (
                <li key={i}>
                  <span className="afq-mode-n">{i + 1}</span>
                  <span>{questions[i].stem.slice(0, 90)}{questions[i].stem.length > 90 ? '…' : ''}</span>
                </li>
              ))}
            </ul>
            <p className="afq-note">
              Every flag is saved to your flagged-questions list (<button className="afq-linklike" onClick={() => navigate('/TKB/afoqt/flagged')}>review it</button>) until you remove it there.
            </p>
          </section>
        )}

        {/* The single most useful screen in the whole tool: what went wrong, and why. Every
            template writes an explanation naming the error-mode its distractors encode, so a
            miss turns into a named mistake rather than a red mark - and every miss now names
            WHERE THE QUESTION CAME FROM, which is the difference between "this is the real
            difficulty, get used to it" and "this one is ours and might be off". */}
        {questions.length > 0 && (
          <section className="afq-misses">
            <div className="afq-review-head">
              <h3>{showAll ? `Every question (${questions.length})` : 'What you missed'}</h3>
              <button
                className="afq-review-toggle"
                aria-pressed={showAll}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? `Misses only (${questions.length - right})` : `Show all ${questions.length}`}
              </button>
            </div>
            {blank > 0 && (
              <p className="afq-warn">
                {blank} question{blank === 1 ? '' : 's'} left blank. The AFOQT scores rights only,
                so a blank costs exactly what a wrong answer costs — on the real test, always mark
                something.
              </p>
            )}
            {!showAll && right === questions.length && (
              <p className="afq-note">Nothing missed. Show all {questions.length} to read the sources.</p>
            )}
            {answers.map((a, i) => {
              // An unanswered question is shown, not skipped: it is a lost point and the reader
              // still needs to see what the answer was.
              if (!a) return <UnansweredItem key={i} n={i + 1} q={questions[i]} />;
              if (a.correct && !showAll) return null;
              const q = questions[i];
              if (!q) return null;
              return (
                <div key={i} className={a.correct ? 'afq-miss afq-hit' : 'afq-miss'}>
                  <p className="afq-miss-stem">
                    <span className="afq-miss-n">{i + 1}</span>{' '}{q.stem}
                    {isFlagged(progress, q.templateId, q.seed) && <span title="Flagged"> 🚩</span>}
                  </p>
                  {q.render && <Figure render={q.render} reveal />}
                  <p className="afq-miss-line">
                    {a.correct ? (
                      <span className="afq-miss-good">
                        {a.guessed ? 'Auto-guessed, and it landed on' : 'You:'} {q.choices[q.correctIndex]}
                      </span>
                    ) : (
                      <>
                        <span className="afq-miss-bad">You: {a.guessed ? 'guessed' : q.choices[a.picked]}</span>
                        <span className="afq-miss-good">Answer: {q.choices[q.correctIndex]}</span>
                      </>
                    )}
                  </p>
                  {a.errorWhy && <p className="afq-miss-mode">You {a.errorWhy}.</p>}
                  {q.explanation && <p className="afq-miss-why">{q.explanation}</p>}
                  <SourceLine q={q} />
                </div>
              );
            })}
            {right < questions.length && (
              <p className="afq-note">
                These templates are now in the miss pool and will resurface in about one in ten
                questions until you get them right on three separate days.
              </p>
            )}
          </section>
        )}

        {chapterDoneNow && !nextChapter && (
          <p className="afq-note">🎉 Every chapter done — nothing left to move on to.</p>
        )}
        <div className="afq-row">
          {nextChapter && (
            <button className="afq-btn afq-primary" onClick={() => navigate(`/TKB/afoqt/learn/${nextChapter.id}`)}>
              Next: {nextChapter.title} →
            </button>
          )}
          <button className={'afq-btn' + (nextChapter ? '' : ' afq-primary')} onClick={() => navigate(0)}>Again</button>
          {chapter
            ? <button className="afq-btn" onClick={() => navigate(`/TKB/afoqt/learn/${chapter.id}`)}>Back to the chapter</button>
            : <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/drill')}>Change drill</button>}
        </div>
      </div>
    );
  }

  const q = questions[current];
  const pace = paceCheck({
    elapsedMs, answeredCount, totalMs: budget.totalMs, questionCount: questions.length,
  });
  const nudge = timed && shouldNudgeAbandon(subtest, Date.now() - questionStart.current);
  const sweepWarn = timed && shouldWarnGuessSweep(remainingMs, questions.length - answeredCount);
  const barPct = Math.max(0, (remainingMs / budget.totalMs) * 100);
  const qFlagged = isFlagged(progress, q.templateId, q.seed);
  const wordFlagged = !!q.vocab && q.vocab.word.toLowerCase() in (progress.wordBank ?? {});

  return (
    // `afq-stage` is the answer-first layout, and it only does anything on a narrow screen.
    // Trey's spec, verbatim: "the screen on mobile should be like 90% answers 10% question" - once
    // the question is being read to you, the stem is a reminder rather than something you read,
    // and what you need is five targets big enough to hit without looking. Desktop is untouched.
    <div className={'afq-runner' + (wide ? ' afq-runner-wide' : '') + (voice.on ? ' afq-stage' : '')}>
      <header className="afq-runner-top">
        <span className="afq-pill">{meta ? meta.name : subtest}</span>
        <span className="afq-progress">{current + 1} / {questions.length}</span>
        {timed && <span className={remainingMs < 30000 ? 'afq-clock low' : 'afq-clock'}>{formatClock(remainingMs)}</span>}
        {timed && (
          <span className={'afq-pace afq-pace-' + pace.state}>
            {pace.state === 'on' ? 'on pace' : Math.abs(pace.delta) + ' ' + pace.state}
          </span>
        )}
        {subtest === 'WK' && (
          <button
            className={'afq-btn afq-ghost afq-reveal-toggle' + (revealMode ? ' afq-reveal-on' : '')}
            onClick={() => setRevealMode((v) => !v)}
            title="Show the tested word's definition on demand - a study mode, not a test mode"
          >
            👁 {revealMode ? 'Cheat mode on' : 'Cheat mode'}
          </button>
        )}
        <button
          className={'afq-btn' + (answeredCount >= questions.length ? ' afq-primary' : ' afq-ghost')}
          onClick={() => finish(answers)}
        >
          {answeredCount >= questions.length ? 'Finish' : 'End'}
        </button>
      </header>

      {timed && <div className="afq-bar"><div className="afq-bar-fill" style={{ width: barPct + '%' }} /></div>}

      {sweepWarn && <div className="afq-alert">Under 15s left. Mark every remaining question - there is no guessing penalty.</div>}

      <VoiceBar voice={voice} settings={progress.settings.voice} updateVoice={updateVoice} />

      <div className="afq-runner-body">
        <div className="afq-runner-main">
          <div className="afq-runner-flags">
            <button
              className={'afq-flag-btn' + (qFlagged ? ' afq-flagged' : '')}
              onClick={() => mutate((p) => (qFlagged
                ? removeFlag(p, q.templateId, q.seed)
                : addFlag(p, { templateId: q.templateId, seed: q.seed, subtest, stem: q.stem })))}
              title={qFlagged ? 'Unflag this question' : 'Flag this question to look at again later'}
            >
              {qFlagged ? '🚩 Flagged' : '⚑ Flag question'}
            </button>
            {subtest === 'WK' && q.vocab && (
              <button
                className={'afq-flag-btn' + (wordFlagged ? ' afq-flagged' : '')}
                onClick={() => mutate((p) => (wordFlagged
                  ? removeFromWordBank(p, q.vocab.word)
                  : addToWordBank(p, q.vocab)))}
                title={wordFlagged ? `Remove "${q.vocab.word}" from your word bank` : `Add "${q.vocab.word}" to your word bank for review`}
              >
                {wordFlagged ? `📖 ${q.vocab.word.toUpperCase()} flagged` : `📖 Flag word: ${q.vocab.word.toUpperCase()}`}
              </button>
            )}
            {revealMode && q.vocab && (
              revealed ? (
                <span className="afq-reveal-def">{q.vocab.word.toUpperCase()}: {q.vocab.gloss}</span>
              ) : (
                <button className="afq-flag-btn" onClick={() => setRevealed(true)}>👁 Reveal definition</button>
              )
            )}
          </div>

          {/* Table Reading puts the question and the options ABOVE the grid. The grid is a
              33-column reference surface, not an illustration: with the stem underneath it you
              read the question, scroll your eye up to look something up, then hunt back down for
              the options. Trey's request, 2026-09-01. Every other figure is small enough to sit
              above its stem the way it always has. */}
          <div className={'afq-card' + (q.render?.kind === 'table' ? ' afq-card-qfirst' : '')}>
            {q.render?.kind !== 'table' && q.render && <Figure render={q.render} />}
            <p className="afq-stem">{q.stem}</p>
            {/* A figure plus five stacked options runs past the bottom of a laptop screen, and
                scrolling to reach option E is not a cost the real test charges. Where the options
                are short - a three-digit table value is three characters - they lay out in a row
                instead, which is also how they are printed on the answer sheet. */}
            <ol className={'afq-choices' + (q.optionRender || (q.render && q.choices.every((c) => c.length <= 18)) ? ' afq-choices-row' : '')}>
              {q.choices.map((c, i) => (
                <li key={i}>
                  <button
                    className={'afq-choice'
                      + (q.optionRender ? ' afq-choice-figure' : '')
                      + (answers[current]?.picked === i ? ' afq-choice-picked' : '')
                      // Follows the voice, so you can see where in the slate it has got to - and
                      // a spoken answer highlights before it commits, which is what makes the
                      // confirm delay legible rather than just a lag.
                      + (voice.speaker.segment === i ? ' afq-choice-reading' : '')
                      + (voice.armed?.index === i ? ' afq-choice-armed' : '')}
                    onClick={() => { voice.cancelArmed(); submit(i); }}
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
            {q.render?.kind === 'table' && <Figure render={q.render} />}
          </div>

          <div className="afq-row afq-nav-row">
            <button className="afq-btn" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>← Back</button>
            <button className="afq-btn" disabled={current === questions.length - 1} onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Forward →</button>
            <p className="afq-hint">
              Press {LETTERS.slice(0, q.choices.length).join(' / ')} to answer · ←/→ to move
              {voice.on ? ' · R to re-read' : ''} · Esc to end
            </p>
          </div>
        </div>

        {/* The rail: every question in the run, its status, and a click to jump straight to it.
            Trey's reasoning: "if I know the answer I can navigate to it no matter how long it
            takes" - the rail is what makes skipping around and coming back actually practical
            instead of a mental-tracking exercise. */}
        <nav className="afq-question-rail" aria-label="Jump to question">
          <div className="afq-rail-grid">
            {questions.map((rq, i) => {
              const a = answers[i];
              const state = i === current ? 'current' : a == null ? 'unanswered' : a.correct ? 'correct' : 'wrong';
              const flag = isFlagged(progress, rq.templateId, rq.seed);
              return (
                <button
                  key={i}
                  className={`afq-rail-item afq-rail-${state}`}
                  onClick={() => setCurrent(i)}
                  title={`Question ${i + 1}${a == null ? ' - not answered' : a.correct ? ' - correct' : ' - missed'}${flag ? ' - flagged' : ''}`}
                >
                  {i + 1}{flag && <span className="afq-rail-flag">🚩</span>}
                </button>
              );
            })}
          </div>
          <p className="afq-rail-legend">
            <span className="afq-rail-key afq-rail-correct" /> right
            <span className="afq-rail-key afq-rail-wrong" /> missed
            <span className="afq-rail-key afq-rail-unanswered" /> unanswered
          </p>
        </nav>
      </div>
    </div>
  );
}
