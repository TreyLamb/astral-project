import { useNavigate } from 'react-router-dom';
import { listWorksheets } from '../worksheets/worksheetsRegistry';

export default function WorksheetsList() {
  const navigate = useNavigate();
  const worksheets = listWorksheets();

  return (
    <div>
      <button className="crs-back" onClick={() => navigate('/TKB/courses')}>← All courses</button>

      <div className="crs-header">
        <div>
          <div className="crs-title">Worksheets</div>
          <div className="crs-subtitle">
            Click-to-mark practice worksheets — circle or X out an answer, jot a note in the margin. Marks persist
            on this device.
          </div>
        </div>
      </div>

      {worksheets.length === 0 ? (
        <div className="crs-empty">No worksheets yet.</div>
      ) : (
        <div className="crs-grid">
          {worksheets.map((w) => (
            <div key={w.id} className="crs-card" onClick={() => navigate(`/TKB/courses/worksheets/${w.id}`)}>
              <div className="crs-card-code">{w.courseCode ?? 'Worksheet'}</div>
              <div className="crs-card-title">{w.title}</div>
              <div className="crs-card-meta">
                <span className="crs-pill">{w.chapterCount} chapters</span>
                <span className="crs-pill">{w.questionCount} questions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
