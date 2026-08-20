import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAfoqt } from '../AfoqtApp';
import { getChapter, isUnlocked } from '../curriculum/chapters';
import { getLesson } from '../curriculum/lessons';
import { chapterState, isChapterDone, markLessonRead, MASTERY_THRESHOLD } from '../afoqtStorage';
import { templatesFor } from '../engine/generator';

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

  const run = (phase, count) => {
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
          <span className={'afq-badge' + (st.testedOut ? ' afq-badge-fast' : '')}>
            {st.testedOut ? 'Tested out' : 'Complete'}
          </span>
        )}
      </header>

      {!unlocked && (
        <div className="afq-alert">
          This chapter builds on earlier ones. You can still read it, but the drills assume
          material from: {chapter.prereqs.join(', ')}.
        </div>
      )}

      <section className="afq-chapter-steps">
        <div className={'afq-step' + (done ? ' afq-step-done' : '')}>
          <h3>1 · Test out</h3>
          <p>
            {TEST_OUT_COUNT} questions, untimed. Get <strong>{chapter.testOutPass} of {TEST_OUT_COUNT}</strong> and
            the chapter is marked done — no lesson, no drill.
            {chapter.testOutPass === 5 && ' This one needs a clean sweep, on purpose.'}
          </p>
          <button className="afq-btn afq-primary" onClick={() => run('testout', TEST_OUT_COUNT)}>
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
          <h3>4 · Mastery check</h3>
          <p>
            {MASTERY_COUNT} questions at real test pace. {Math.round(MASTERY_THRESHOLD * 100)}% clears the chapter.
          </p>
          <button className="afq-btn afq-primary" onClick={() => run('mastery', MASTERY_COUNT)}>
            Take the mastery check
          </button>
        </div>
      </section>

      {open && lesson && (
        <article className="afq-lesson">
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
