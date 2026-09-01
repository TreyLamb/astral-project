import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../CoursesApp';
import { useTkbData } from '../../TkbApp';
import { listWorksheets } from '../worksheets/worksheetsRegistry';
import ImportGenerated from './ImportGenerated';
import Boundary from '../../../../components/errors/Boundary';

const TRACKING_LEVELS = ['full', 'light', 'none'];

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourse, updateCourse, removeCourse } = useCourses();
  const { questions: tkbQuestions, subjects: tkbSubjects } = useTkbData();

  const course = getCourse(courseId);
  if (!course) {
    return (
      <div className="crs-empty">
        Course not found. <button className="crs-back" onClick={() => navigate('/TKB/courses')}>← back to Courses</button>
      </div>
    );
  }

  // Study/quiz material is whatever actually exists for this course right now —
  // never a placeholder. A worksheet is matched by courseCode; a TKB review deck
  // is matched by subject name == course code (that's how importQuestions() files
  // Tier 2/3 output — see engine/facts.js, ImportGenerated.jsx).
  const courseWorksheets = listWorksheets().filter((w) => w.courseCode === course.code);
  const tkbSubject = tkbSubjects.find((s) => s.name.toLowerCase() === course.code.toLowerCase());
  const activeQuestionCount = tkbSubject
    ? tkbQuestions.filter((q) => q.subjectId === tkbSubject.id && q.status === 'active').length
    : 0;
  const hasChemCurriculum = course.code === 'CHEM 1210';
  const hasStudyMaterial = courseWorksheets.length > 0 || activeQuestionCount > 0 || hasChemCurriculum;

  return (
    <div>
      <button className="crs-back" onClick={() => navigate('/TKB/courses')}>← All courses</button>

      <div className="crs-header">
        <div>
          <div className="crs-title">{course.code} — {course.title}</div>
          <div className="crs-subtitle">{course.term}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={course.trackingLevel} onChange={(e) => updateCourse(course.id, { trackingLevel: e.target.value })}>
            {TRACKING_LEVELS.map((l) => <option key={l} value={l}>{l} tracking</option>)}
          </select>
          <button
            className="crs-btn secondary"
            onClick={() => { if (confirm(`Remove ${course.code}?`)) { removeCourse(course.id); navigate('/TKB/courses'); } }}
          >
            Remove course
          </button>
        </div>
      </div>

      {hasStudyMaterial && (
        <div className="crs-section">
          <h3>Study &amp; quiz material</h3>
          {hasChemCurriculum && (
            <div className="crs-row">
              <div>
                🧪 <strong>Chem 1 curriculum</strong> <span className="crs-pill">gate → lesson → drill → mastery, per chapter</span>
              </div>
              <button className="crs-btn secondary" onClick={() => navigate('/TKB/courses/chem')}>Open</button>
            </div>
          )}
          {courseWorksheets.map((w) => (
            <div key={w.id} className="crs-row">
              <div>
                📝 <strong>{w.title}</strong> <span className="crs-pill">worksheet</span>{' '}
                <span className="crs-pill">{w.questionCount} questions</span>
              </div>
              <button className="crs-btn secondary" onClick={() => navigate(`/TKB/courses/worksheets/${w.id}`)}>Open</button>
            </div>
          ))}
          {activeQuestionCount > 0 && (
            <div className="crs-row">
              <div>
                🔁 <strong>TKB review deck</strong> <span className="crs-pill">{activeQuestionCount} active questions</span>
              </div>
              <button
                className="crs-btn secondary"
                onClick={() => navigate(`/TKB/review?profile=focused_review&subject=${tkbSubject.id}`)}
              >
                Review / quiz
              </button>
            </div>
          )}
        </div>
      )}

      <div className="crs-section">
        <h3>Generate study questions</h3>
        <Boundary title="Question generation stopped working." resetId={course.id}>
          <ImportGenerated course={course} />
        </Boundary>
      </div>
    </div>
  );
}
