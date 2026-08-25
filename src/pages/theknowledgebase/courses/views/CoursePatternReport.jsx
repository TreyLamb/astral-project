import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../CoursesApp';
import { tagHitRate, untestedTaughtTags, recurringAcrossAssessments } from '../engine/patternAnalysis';

// The basic pattern-analysis report: pure counting over Document.tags and
// RealQuestion.topicTags, no AI. Deliberately one screen, not something that
// drives navigation — see the "Pattern analysis" section of
// docs/courses/DATA-MODEL.md for why this stays secondary.
export default function CoursePatternReport() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourse, documents, assessments, realQuestions } = useCourses();
  const course = getCourse(courseId);

  if (!course) {
    return (
      <div className="crs-empty">
        Course not found. <button className="crs-back" onClick={() => navigate('/TKB/courses')}>← back to Courses</button>
      </div>
    );
  }

  const hitRates = tagHitRate(documents, realQuestions, courseId);
  const untested = untestedTaughtTags(documents, realQuestions, courseId);
  const recurring = recurringAcrossAssessments(assessments, realQuestions, courseId);

  return (
    <div>
      <button className="crs-back" onClick={() => navigate(`/TKB/courses/${courseId}`)}>← {course.code}</button>
      <div className="crs-header">
        <div>
          <div className="crs-title">{course.code} — pattern report</div>
          <div className="crs-subtitle">
            Counting, not prediction: what's been taught, what's been tested, and what
            hasn't shown up yet. Tag your documents and captured questions consistently
            or these counts undercount.
          </div>
        </div>
      </div>

      <div className="crs-section">
        <h3>Hasn't been tested yet</h3>
        {untested.length === 0 ? (
          <div className="crs-empty">Nothing yet — tag some documents and log a quiz to populate this.</div>
        ) : (
          <div className="crs-tag-list">
            {untested.map((t) => (
              <span key={t.tag} className="crs-tag" title={`taught ${t.timesTaught}x, tested ${t.timesTested}x`}>{t.tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="crs-section">
        <h3>Keeps coming up across assessments</h3>
        {recurring.length === 0 ? (
          <div className="crs-empty">No tag has repeated across 2+ assessments yet.</div>
        ) : (
          <div className="crs-tag-list">
            {recurring.map((t) => <span key={t.tag} className="crs-tag" title={`in ${t.count} assessments`}>{t.tag} ×{t.count}</span>)}
          </div>
        )}
      </div>

      <div className="crs-section">
        <h3>Taught vs. tested, by tag</h3>
        {hitRates.length === 0 ? (
          <div className="crs-empty">No tagged documents or questions yet.</div>
        ) : (
          <table className="crs-hitrate-table">
            <thead><tr><th>Tag</th><th>Taught</th><th>Tested</th><th>Hit rate</th></tr></thead>
            <tbody>
              {hitRates.map((r) => (
                <tr key={r.tag}>
                  <td>{r.tag}</td>
                  <td>{r.timesTaught}</td>
                  <td>{r.timesTested}</td>
                  <td>{r.hitRate == null ? '—' : `${Math.round(r.hitRate * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
