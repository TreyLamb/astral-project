import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAfoqt } from '../AfoqtApp';
import { getChapter, isUnlocked, CHAPTERS } from '../curriculum/chapters';
import { getLesson } from '../curriculum/lessons';
import { CHAPTER_FIGURES } from '../curriculum/chapterFigures';
import { chapterState, isChapterDone, markLessonRead, MASTERY_THRESHOLD, latestDiagnostic } from '../afoqtStorage';
import { nextPersonalizedChapter } from '../curriculum/personalize';
import { templatesFor } from '../engine/generator';
import { getSubtest } from '../engine/afoqtSpec';
import {
  subtestTier, EXPEDITED_TEST_OUT_COUNT, EXPEDITED_MASTERY_COUNT, DIAGNOSTIC_ACCURACY_LABEL,
  diagnosticSubtestAccuracy,
} from '../engine/diagnostic';

// A chapter is: test-out gate -> lesson -> drill -> mastery check.
//
// The gate is the reason the curriculum is usable at all. Trey estimates he already knows
// most of the math track and boredom is a real adoption risk, so five questions can skip a
// whole chapter. The three geometry chapters need 5/5 rather than 4/5 - he named geometry as
// his weakest area, and a lucky four is exactly how a weak area gets skipped.
//
// Both gates run through the normal DrillRunner rather than a second question UI, so the
// pace marker, the 5-second nudge and the guess sweep all apply here too.

const TEST_OUT_COUNT = 5;
const MASTERY_COUNT = 12;

export default function ChapterView() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { progress, mutate } = useAfoqt();
  const chapter = getChapter(chapterId);
  const [showLesson, setShowLesson] = useState(false);

  if (!chapter) {
    return (
      <div className="afq-chapter-view">
        <p>No chapter called “{chapterId}”.</p>
        <button className="afq-btn" onClick={() => navigate('/TKB/afoqt/learn')}>Back to the map</button>
      </div>
    );
  }

  const st = chapterState(progress, chapter.id);
  const done = isChapterDone(progress, chapter.id);
  const unlocked = isUnlocked(chapter, progress.chapters ?? {});
  const lesson = getLesson(chapter.id);
  const open = showLesson || st.lessonRead || done;

  const pool = templatesFor(chapter.subtest)
    .filter((t) => t.concepts.some((c) => chapter.concepts.includes(c)));

  // Diagnostic-driven fast lane. A chapter that already demands testOutPass === 5 (geometry, the
  // inverted instrument pointer, block counting...) keeps the standard gate regardless of subtest
  // strength - that flag exists specifically for a chapter where someone can be confidently and
  // uniformly wrong, and a strong subtest-level result is not evidence against that one failure
  // mode. See engine/diagnostic.js for why 3-question/3-correct doesn't reopen the lucky-pass hole.
  const diag = latestDiagnostic(progress);
  const tier = diag ? subtestTier(diag.results, chapter.subtest) : null;
  const diagAcc = diag ? diagnosticSubtestAccuracy(diag.results, chapter.subtest) : null;
  // The whole point: once this chapter is done, the next one should be one click away right
  // here, not a trip back to the map to go find it - same complaint applies to DrillRunner's
  // own results screen, which offers the identical button after a passing gate.
  const nextChapter = done ? nextPersonalizedChapter(CHAPTERS, progress, diag?.results ?? null) : null;
  const expedited = tier === 'strong' && chapter.testOutPass !== 5;
  const testOutCount = expedited ? EXPEDITED_TEST_OUT_COUNT : TEST_OUT_COUNT;
  const testOutNeed = expedited ? EXPEDITED_TEST_OUT_COUNT : chapter.testOutPass;
  const masteryCount = tier === 'strong' ? EXPEDITED_MASTERY_COUNT : MASTERY_COUNT;

  const run = (phase, count, need) => {
    const params = new URLSearchParams({
      subtest: chapter.subtest,
      count: String(count),
      chapter: chapter.id,
      phase,
      // Untimed for the gate and paced for the mastery check: the gate asks "do you know
      // this", the mastery check asks "do you know it at test speed".
      mode: phase === 'testout' ? 'untimed' : 'paced',
      pressure: String(progress.settings.pressure ?? 1),
    });
    if (need != null) params.set('need', String(need));
    navigate(`/TKB/afoqt/drill/run?${params}`);
  };

  return (
    <div className="afq-chapter-view">
      <button className="afq-btn afq-ghost afq-back" onClick={() => navigate('/TKB/afoqt/learn')}>
        ← All chapters
      </button>

      <header className="afq-chapter-head">
        <div>
          <span className="afq-pill">Chapter {chapter.order}</span>
          <h2>{chapter.title}</h2>
          <p className="afq-note">{chapter.summary}</p>
        </div>
        {done && (
          <div className="afq-chapter-done-block">
            <span className={'afq-badge' + (st.testedOut ? ' afq-badge-fast' : '')}>
              {st.testedOut ? 'Tested out' : 'Complete'}
            </span>
            {nextChapter ? (
              <button className="afq-btn afq-primary" onClick={() => navigate(`/TKB/afoqt/learn/${nextChapter.id}`)}>
                Next: {nextChapter.title} →
              </button>
            ) : (
              <span className="afq-note">🎉 Every chapter done</span>
            )}
          </div>
        )}
      </header>

      {!unlocked && (
        <div className="afq-alert">
          This chapter builds on earlier ones. You can still read it, but the drills assume
          material from: {chapter.prereqs.join(', ')}.
        </div>
      )}

      {tier && (
        <div className={'afq-alert' + (tier === 'strong' ? ' afq-alert-strong' : tier === 'weak' ? ' afq-alert-weak' : ' afq-alert-neutral')}>
          {tier === 'strong' && (
            <>⚡ Your diagnostic showed strength in {getSubtest(chapter.subtest)?.name} ({Math.round(diagAcc * 100)}%)
            {expedited
              ? <> — the test-out gate and mastery check below are shortened for this chapter.</>
              : <>, but this chapter always needs the standard clean-sweep gate — see below.</>}</>
          )}
          {tier === 'weak' && (
            <>Your diagnostic flagged {getSubtest(chapter.subtest)?.name} as a focus area ({Math.round(diagAcc * 100)}%) — worth reading the lesson rather than testing out.</>
          )}
          {tier === 'moderate' && (
            <>{getSubtest(chapter.subtest)?.name} was middling on your diagnostic ({Math.round(diagAcc * 100)}%) — standard pace here.</>
          )}
          <small className="afq-note">{DIAGNOSTIC_ACCURACY_LABEL}</small>
        </div>
      )}

      <section className="afq-chapter-steps">
        <div className={'afq-step' + (done ? ' afq-step-done' : '')}>
          <h3>1 · Test out{expedited && <span className="afq-chip afq-chip-fast">⚡ expedited</span>}</h3>
          <p>
            {testOutCount} questions, untimed. Get <strong>{testOutNeed} of {testOutCount}</strong> and
            the chapter is marked done — no lesson, no drill.
            {chapter.testOutPass === 5 && ' This one needs a clean sweep, on purpose.'}
          </p>
          <button className="afq-btn afq-primary" onClick={() => run('testout', testOutCount, testOutNeed)}>
            {st.attempts > 0 && !done ? 'Try the gate again' : 'Take the gate'}
          </button>
          {st.attempts > 0 && st.bestScore != null && (
            <small className="afq-note">Best so far: {Math.round(st.bestScore * 100)}%</small>
          )}
        </div>

        <div className={'afq-step' + (st.lessonRead ? ' afq-step-done' : '')}>
          <h3>2 · Lesson</h3>
          <p>About {chapter.minutes} minutes. Covers {chapter.concepts.length} concepts, every one of which is tested.</p>
          <button className="afq-btn" onClick={() => setShowLesson((v) => !v)}>
            {open ? 'Hide the lesson' : 'Read the lesson'}
          </button>
        </div>

        <div className="afq-step">
          <h3>3 · Drill</h3>
          <p>
            Unlimited questions from this chapter's {pool.length} templates, at your current
            pace setting. Nothing is recorded against the chapter here — practise freely.
          </p>
          <button className="afq-btn" onClick={() => run('practice', 10)}>Practise 10</button>
        </div>

        <div className="afq-step">
          <h3>4 · Mastery check{tier === 'strong' && <span className="afq-chip afq-chip-fast">⚡ expedited</span>}</h3>
          <p>
            {masteryCount} questions at real test pace. {Math.round(MASTERY_THRESHOLD * 100)}% clears the chapter.
          </p>
          <button className="afq-btn afq-primary" onClick={() => run('mastery', masteryCount)}>
            Take the mastery check
          </button>
        </div>
      </section>

      {open && lesson && (
        <article className="afq-lesson">
          {CHAPTER_FIGURES[chapter.id] && (
            <div className="afq-lesson-figure">
              <p className="afq-note">{CHAPTER_FIGURES[chapter.id].caption}</p>
              {(() => { const { Component } = CHAPTER_FIGURES[chapter.id]; return <Component />; })()}
            </div>
          )}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson}</ReactMarkdown>
          {!st.lessonRead && (
            <button
              className="afq-btn afq-primary"
              onClick={() => mutate((p) => markLessonRead(p, chapter.id))}
            >
              Mark as read
            </button>
          )}
        </article>
      )}

      <details className="afq-concepts">
        <summary>What this chapter is accountable for ({chapter.concepts.length} concepts)</summary>
        <p className="afq-note">
          Every concept below is tested by at least one template, and every template in this
          chapter maps back to one of them. <code>npm run afoqt:coverage</code> fails the build
          if either direction breaks.
        </p>
        <ul className="afq-concept-list">
          {chapter.concepts.map((c) => {
            const testedBy = pool.filter((t) => t.concepts.includes(c));
            return (
              <li key={c}>
                <code>{c}</code>
                <span>{testedBy.length} template{testedBy.length === 1 ? '' : 's'}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
