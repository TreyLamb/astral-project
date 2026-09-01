import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChem } from '../ChemApp';
import { getChemChapter, isChemChapterUnlocked } from '../curriculum';
import { getChemLesson } from '../lessons';
import { chemChapterState, isChemChapterDone, markChemLessonRead, CHEM_MASTERY_THRESHOLD } from '../chemStorage';
import { chemTemplatesFor } from '../engine/generator';

// A chapter is: test-out gate -> lesson -> drill -> mastery check — mirrors
// afoqt/views/ChapterView.jsx exactly. The drill step is unlimited and untethered from the
// gate on purpose: repeatedly failing the gate must never leave you with no study material,
// only the option to keep failing the same 5 questions. See courses/chem/PLAN.md.

const TEST_OUT_COUNT = 5;
const MASTERY_COUNT = 10;

export default function ChemChapterView() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { progress, mutate } = useChem();
  const chapter = getChemChapter(chapterId);
  const [showLesson, setShowLesson] = useState(false);

  if (!chapter) {
    return (
      <div className="chq-chapter-view">
        <p>No chapter called "{chapterId}".</p>
        <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem')}>Back to the map</button>
      </div>
    );
  }

  const st = chemChapterState(progress, chapter.id);
  const done = isChemChapterDone(progress, chapter.id);
  const unlocked = isChemChapterUnlocked(chapter, progress.chapters ?? {});
  const lesson = getChemLesson(chapter.id);
  const open = showLesson || st.lessonRead || done;
  const pool = chemTemplatesFor(chapter.id);

  const run = (phase, count) => {
    const params = new URLSearchParams({ chapter: chapter.id, phase, count: String(count) });
    navigate(`/TKB/courses/chem/drill/run?${params}`);
  };

  return (
    <div className="chq-chapter-view">
      <button className="chq-btn chq-ghost chq-back" onClick={() => navigate('/TKB/courses/chem')}>
        ← All chapters
      </button>

      <header className="chq-chapter-head">
        <div>
          <span className="chq-pill">Chapter {chapter.order}</span>
          <h2>{chapter.title}</h2>
          <p className="chq-note">{chapter.summary}</p>
        </div>
        {done && (
          <span className={'chq-badge' + (st.testedOut ? ' chq-badge-fast' : '')}>
            {st.testedOut ? 'Tested out' : 'Complete'}
          </span>
        )}
      </header>

      {!unlocked && (
        <div className="chq-alert">
          This chapter builds on earlier ones. You can still read it, but the drills assume
          material from: {chapter.prereqs.map((p) => p).join(', ')}.
        </div>
      )}

      <section className="chq-chapter-steps">
        <div className={'chq-step' + (done ? ' chq-step-done' : '')}>
          <h3>1 · Test out</h3>
          <p>
            {TEST_OUT_COUNT} questions, untimed. Get <strong>{chapter.testOutPass} of {TEST_OUT_COUNT}</strong> and
            the chapter is marked done — no lesson, no drill required.
          </p>
          <button className="chq-btn chq-primary" onClick={() => run('testout', TEST_OUT_COUNT)}>
            {st.attempts > 0 && !done ? 'Try the gate again' : 'Take the gate'}
          </button>
          {st.attempts > 0 && st.bestScore != null && (
            <small className="chq-note">Best so far: {Math.round(st.bestScore * 100)}%</small>
          )}
        </div>

        <div className={'chq-step' + (st.lessonRead ? ' chq-step-done' : '')}>
          <h3>2 · Lesson</h3>
          <p>About {chapter.minutes} minutes. Covers {chapter.concepts.length} concepts, every one of which is tested.</p>
          <button className="chq-btn" onClick={() => setShowLesson((v) => !v)}>
            {open ? 'Hide the lesson' : 'Read the lesson'}
          </button>
        </div>

        <div className="chq-step">
          <h3>3 · Drill</h3>
          <p>
            Unlimited questions from this chapter's {pool.length} templates. Nothing is recorded
            against the chapter here — practise as many times as you want, whether or not you've
            passed the gate.
          </p>
          <button className="chq-btn" onClick={() => run('practice', 10)}>Practise 10</button>
        </div>

        <div className="chq-step">
          <h3>4 · Mastery check</h3>
          <p>{MASTERY_COUNT} questions. {Math.round(CHEM_MASTERY_THRESHOLD * 100)}% clears the chapter.</p>
          <button className="chq-btn chq-primary" onClick={() => run('mastery', MASTERY_COUNT)}>
            Take the mastery check
          </button>
        </div>
      </section>

      {open && lesson && (
        <article className="chq-lesson">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson}</ReactMarkdown>
          {!st.lessonRead && (
            <button
              className="chq-btn chq-primary"
              onClick={() => mutate((p) => markChemLessonRead(p, chapter.id))}
            >
              Mark as read
            </button>
          )}
        </article>
      )}

      <details className="chq-concepts">
        <summary>What this chapter is accountable for ({chapter.concepts.length} concepts)</summary>
        <ul className="chq-concept-list">
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
