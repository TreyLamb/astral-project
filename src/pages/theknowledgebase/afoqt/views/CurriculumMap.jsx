import { useNavigate } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { TRACKS, CHAPTERS, chaptersForTrack, isUnlocked, getChapter } from '../curriculum/chapters';
import { chapterState, isChapterDone, curriculumProgress } from '../afoqtStorage';
import { SUBTESTS, getSubtest, secPerQuestion, compositeReach } from '../engine/afoqtSpec';

// Derived, not written down. The hand-written version of this footnote still promised tracks
// for Aviation Information, Instrument Comprehension and Block Counting three phases after all
// three had shipped - a track list is exactly the kind of prose that goes stale silently,
// because nothing fails when it does. This is the same computation `afoqt:coverage` prints.
const PENDING = SUBTESTS.filter(
  (s) => s.studyable && !CHAPTERS.some((c) => c.subtest === s.code),
);

// The chapter list, with prerequisites shown rather than enforced silently. A locked chapter
// always names what unlocks it - a lock with no explanation reads like a bug.
export default function CurriculumMap() {
  const navigate = useNavigate();
  const { progress } = useAfoqt();

  return (
    <div className="afq-curriculum">
      {TRACKS.map((track) => {
        const chapters = chaptersForTrack(track.id);
        const stats = curriculumProgress(progress, chapters);
        const spec = getSubtest(track.subtest);
        const reach = compositeReach(track.subtest);

        return (
          <section key={track.id} className="afq-track">
            <header className="afq-track-head">
              <div>
                <h2>{track.name}</h2>
                <p className="afq-note">{track.blurb}</p>
              </div>
              <div className="afq-track-stat">
                <span>{stats.done} / {stats.total}</span>
                <label>chapters done</label>
                {stats.minutesLeft > 0 && <small>~{stats.minutesLeft} min of reading left</small>}
                {stats.testedOut > 0 && <small>{stats.testedOut} tested out</small>}
              </div>
            </header>

            <div className="afq-track-meta">
              {spec && <span className="afq-pill">{spec.questions} Qs · {secPerQuestion(spec).toFixed(1)}s each</span>}
              <span className="afq-reach">{reach.join(' ')}</span>
            </div>

            <ol className="afq-chapters">
              {chapters.map((ch) => {
                const st = chapterState(progress, ch.id);
                const done = isChapterDone(progress, ch.id);
                const unlocked = isUnlocked(ch, progress.chapters ?? {});
                const blockers = (ch.prereqs ?? [])
                  .filter((p) => !isChapterDone(progress, p))
                  .map((p) => getChapter(p)?.title ?? p);

                return (
                  <li
                    key={ch.id}
                    className={'afq-chapter' + (done ? ' done' : '') + (unlocked ? '' : ' locked')}
                  >
                    <button
                      className="afq-chapter-hit"
                      onClick={() => navigate(`/TKB/afoqt/learn/${ch.id}`)}
                      disabled={!unlocked}
                    >
                      <span className="afq-chapter-num">{ch.order}</span>
                      <span className="afq-chapter-body">
                        <strong>{ch.title}</strong>
                        <small>{ch.summary}</small>
                        <span className="afq-chapter-tags">
                          <span className="afq-chip">{ch.minutes} min</span>
                          <span className="afq-chip">{ch.concepts.length} concepts</span>
                          {ch.testOutPass === 5 && <span className="afq-chip afq-chip-warn">test out needs 5/5</span>}
                          {st.bestScore != null && <span className="afq-chip">best {Math.round(st.bestScore * 100)}%</span>}
                        </span>
                        {!unlocked && (
                          <small className="afq-locked-note">Unlocks after: {blockers.join(', ')}</small>
                        )}
                      </span>
                      <span className="afq-chapter-state">
                        {done ? (st.testedOut ? 'tested out' : 'complete') : st.lessonRead ? 'in progress' : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {PENDING.length > 0 && (
        <p className="afq-note afq-footnote">
          Later phases add tracks for {PENDING.map((s) => s.name).join(', ')}. Those subtests are
          already drillable from the Drill tab wherever a question bank exists.
        </p>
      )}
    </div>
  );
}
