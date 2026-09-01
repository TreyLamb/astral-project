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
        <button className="chq-btn chq-primary" onClick={() => navigate('/TKB/courses/chem/practice')}>
          Mass review — mix questions from every chapter
        </button>
      </div>

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
              <button
                className="chq-chapter-hit"
                disabled={!unlocked}
                onClick={() => navigate(`/TKB/courses/chem/${ch.id}`)}
              >
                <span className="chq-chapter-num">{ch.order}</span>
                <span className="chq-chapter-body">
                  <strong>{ch.title}</strong>
                  <small>{ch.summary}</small>
                  {!unlocked && blockers.length > 0 && (
                    <small className="chq-locked-note">Unlocks after: {blockers.join(', ')}</small>
                  )}
                </span>
                <span className="chq-chapter-state">
                  {done ? (st.testedOut ? 'tested out' : 'complete') : st.lessonRead ? 'in progress' : unlocked ? '' : 'locked'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
