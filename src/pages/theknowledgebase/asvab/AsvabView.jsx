import { useNavigate } from 'react-router-dom';
import { useTkbData } from '../TkbApp';
import { ASVAB_SUBJECT } from '../asvabSubject';
// Reuses the AFOQT styles; this view lives outside AfoqtApp so it imports them itself.
import '../afoqt/Afoqt.css';

// Parked ASVAB module. READ-ONLY by explicit user rule: the ASVAB review material stays
// exactly as it is. Nothing here retires, re-files or rewrites a question - the AFOQT side
// works from a separate migrated COPY (afoqt/data/migratedAsvab.json).

export default function AsvabView() {
  const navigate = useNavigate();
  const { questions } = useTkbData();

  const mine = questions.filter((q) => q.subjectId === ASVAB_SUBJECT.id && q.status === 'active');
  const byTopic = new Map();
  for (const q of mine) byTopic.set(q.subtopicId, (byTopic.get(q.subtopicId) ?? 0) + 1);

  const start = (n) =>
    navigate(`/TKB/review?profile=focused_review&subject=${ASVAB_SUBJECT.id}&n=${n}`);

  return (
    <div className="afq-dash">
      <header className="afq-dash-head">
        <div>
          <h2>ASVAB Practice</h2>
          <p className="afq-note">
            {mine.length} questions, unchanged. Kept intact alongside the AFOQT module.
          </p>
        </div>
        <button className="afq-btn afq-primary" onClick={() => start(60)}>Review 60</button>
      </header>

      <div className="afq-row afq-wrap-row">
        <button className="afq-btn" onClick={() => start(20)}>20</button>
        <button className="afq-btn" onClick={() => start(60)}>60</button>
        <button className="afq-btn" onClick={() => start(mine.length)}>All {mine.length}</button>
      </div>

      <section>
        <h3>Sections</h3>
        <table className="afq-table">
          <thead><tr><th>Section</th><th>Questions</th><th>On the AFOQT?</th></tr></thead>
          <tbody>
            {ASVAB_SUBJECT.subtopics.map((st) => {
              // Mechanical Comprehension, Electronics, Auto & Shop and Biology were all
              // removed from the AFOQT in the 2014 Form T transition.
              const onAfoqt = !/mechanical|electronics|auto-shop|biology/.test(st.id);
              return (
                <tr key={st.id} className={onAfoqt ? '' : 'afq-dim'}>
                  <td>{st.name}</td>
                  <td>{byTopic.get(st.id) ?? 0}</td>
                  <td className="afq-reach">{onAfoqt ? 'yes' : 'ASVAB only'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="afq-note">
        This deck is left exactly as it was. The AFOQT module studies from a separate
        cleaned copy, so nothing here is altered by that work.
      </p>
    </div>
  );
}
