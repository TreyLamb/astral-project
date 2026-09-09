import { useNavigate } from 'react-router-dom';
import { useChem } from '../ChemApp';
import { CHEM_CHAPTERS, isChemChapterUnlocked, TOTAL_CHEM_LESSON_MINUTES } from '../curriculum';
import { chemChapterState, isChemChapterDone, chemCurriculumProgress } from '../chemStorage';

export default function ChemCurriculumMap() {
  const navigate = useNavigate();
  const { progress } = useChem();
  const stat = chemCurriculumProgress(progress, CHEM_CHAPTERS);

  return (
    <div className="chq-curriculum">
      <header className="chq-track-head">
        <div>
          <h2>Chem 1 (CHEM 1210)</h2>
          <p className="chq-note">
            First-term general chemistry, from the ACS exam study guide's own chapter split.
            Each chapter: test out, or read the lesson and drill it — the drill is unlimited
            either way.
          </p>
        </div>
        <div className="chq-track-stat">
          <span>{stat.done}/{stat.total}</span>
          <label>chapters done</label>
          <small>{stat.testedOut} tested out · ~{stat.minutesLeft} of {TOTAL_CHEM_LESSON_MINUTES} min left</small>
        </div>
      </header>

      <div className="chq-track-meta">
        <button className="chq-btn chq-primary" onClick={() => navigate('/TKB/courses/chem/exam')}>
          🎯 Exam prep — scoped to YOUR chapters (Exam 1 = Ch 1–2)
        </button>
        <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/practice')}>
          Mass review — mix questions from every chapter
        </button>
        <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/resources')}>
          📖 Resources — units, prefixes, polyatomic ions, naming rules
        </button>
        <button className="chq-btn" onClick={() => navigate('/TKB/courses/chem/quick')}>
          ⚡ Quick review — no-math questions, built for a phone
        </button>
      </div>

      {/* The chapter list below is in ACS order, which is NOT the order this class moves in
          (see syllabusMap.js). Exam prep is the one that speaks in course chapter numbers, so
          it says so here rather than leaving "chapter 1" ambiguous between two meanings. */}
      <p className="chq-note">
        The chapters below follow the <strong>ACS</strong> ordering, which your class does not —
        your Ch 1–2 is spread across the first two of them. Use <strong>Exam prep</strong> to
        practise by your own chapter numbers. Nothing here is rationed by the locks below.
      </p>

      <ul className="chq-chapters">
        {CHEM_CHAPTERS.map((ch) => {
          const st = chemChapterState(progress, ch.id);
          const done = isChemChapterDone(progress, ch.id);
          const unlocked = isChemChapterUnlocked(ch, progress.chapters ?? {});
          const blockers = (ch.prereqs ?? [])
            .filter((p) => !isChemChapterDone(progress, p))
            .map((p) => CHEM_CHAPTERS.find((c) => c.id === p)?.title ?? p);

          return (
            <li key={ch.id} className={'chq-chapter' + (done ? ' done' : '')}>
              {/* Never disabled. The prereq chain is a SUGGESTED ORDER, not a gate — the same
                  rule engine/gates.js states for the gate tests ("a gate reports readiness; it
                  does not ration content"), which the chapter list was quietly contradicting.
                  It mattered on 2026-09-09: Trey's first exam is on chapters 1-2 and Atomic
                  Structure rendered greyed out and unclickable, reading as "this isn't built
                  yet" for the one chapter he needed that week. */}
              <button
                className="chq-chapter-hit"
                onClick={() => navigate(`/TKB/courses/chem/${ch.id}`)}
              >
                <span className="chq-chapter-num">{ch.order}</span>
                <span className="chq-chapter-body">
                  <strong>{ch.title}</strong>
                  <small>{ch.summary}</small>
                  {!unlocked && blockers.length > 0 && (
                    <small className="chq-locked-note">Best read after: {blockers.join(', ')} — open it any time.</small>
                  )}
                </span>
                {/* No badge for an out-of-order chapter: the "Best read after…" line under the
                    summary already says it, and every short label for it ("locked", "out of
                    order") reads as "broken" or "unavailable" now that it is openable. */}
                <span className="chq-chapter-state">
                  {done ? (st.testedOut ? 'tested out' : 'complete') : st.lessonRead ? 'in progress' : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
