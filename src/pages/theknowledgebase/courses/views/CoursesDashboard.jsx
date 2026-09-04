import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCourses } from '../CoursesApp';

const TRACKING_CYCLE = { full: 'light', light: 'none', none: 'full' };

export default function CoursesDashboard() {
  const navigate = useNavigate();
  const { courses, addCourse, updateCourse } = useCourses();
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [term, setTerm] = useState(courses[0]?.term ?? '');

  const submitAdd = (e) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;
    addCourse({ code: code.trim(), title: title.trim(), term: term.trim() });
    setCode(''); setTitle(''); setAdding(false);
  };

  return (
    <div>
      <div className="crs-header">
        <div>
          <div className="crs-title">Courses</div>
          <div className="crs-subtitle">
            {courses.length} courses — open a card for its study material and question
            generation. Click the tracking pill to cycle full → light → none.
          </div>
        </div>
        <div className="crs-header-actions">
          <button className="crs-btn" onClick={() => navigate('/TKB/courses/dashboard')}>
            📊 Canvas dashboard
          </button>
          <button className="crs-btn secondary" onClick={() => navigate('/TKB/courses/syllabus')}>
            📋 Syllabi
          </button>
          <button className="crs-btn secondary" onClick={() => navigate('/TKB/courses/worksheets')}>
            📝 Worksheets
          </button>
          <button className="crs-btn secondary" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : '+ Add course'}
          </button>
        </div>
      </div>

      {adding && (
        <form className="crs-form crs-section" onSubmit={submitAdd}>
          <input placeholder="Course code (e.g. BIOL 3000)" value={code} onChange={(e) => setCode(e.target.value)} />
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Term" value={term} onChange={(e) => setTerm(e.target.value)} />
          <button className="crs-btn" type="submit">Add course</button>
        </form>
      )}

      <div className="crs-grid">
        {courses.map((c) => {
          return (
            <div
              key={c.id}
              className="crs-card"
              style={{ '--crs-accent': c.color }}
              onClick={() => navigate(`/TKB/courses/${c.id}`)}
            >
              <div className="crs-card-code">{c.code}</div>
              <div className="crs-card-title">{c.title}</div>
              <div className="crs-card-meta">
                <span
                  className={`crs-pill ${c.trackingLevel}`}
                  title="Click to change tracking level (full / light / none)"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCourse(c.id, { trackingLevel: TRACKING_CYCLE[c.trackingLevel] });
                  }}
                >
                  {c.trackingLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
