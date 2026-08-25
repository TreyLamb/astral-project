import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCourses } from '../CoursesApp';
import DocumentForm from './DocumentForm';
import AssessmentCapture from './AssessmentCapture';
import ImportGenerated from './ImportGenerated';
import Boundary from '../../../../components/errors/Boundary';

const TRACKING_LEVELS = ['full', 'light', 'none'];

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourse, updateCourse, removeCourse, documents, assessments, realQuestions, removeDocument, removeAssessment } = useCourses();
  const [showDocForm, setShowDocForm] = useState(false);
  const [showAssessForm, setShowAssessForm] = useState(false);

  const course = getCourse(courseId);
  if (!course) {
    return (
      <div className="crs-empty">
        Course not found. <button className="crs-back" onClick={() => navigate('/TKB/courses')}>← back to Courses</button>
      </div>
    );
  }

  const courseDocs = documents.filter((d) => d.courseId === courseId);
  const courseAssessments = assessments.filter((a) => a.courseId === courseId);
  const questionsByAssessment = (assessmentId) => realQuestions.filter((q) => q.assessmentId === assessmentId);

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
          <button className="crs-btn secondary" onClick={() => navigate(`/TKB/courses/${course.id}/patterns`)}>Pattern report</button>
          <button
            className="crs-btn secondary"
            onClick={() => { if (confirm(`Remove ${course.code} and all its documents/assessments?`)) { removeCourse(course.id); navigate('/TKB/courses'); } }}
          >
            Remove course
          </button>
        </div>
      </div>

      <div className="crs-section">
        <h3>Documents ({courseDocs.length})</h3>
        {courseDocs.length === 0 && <div className="crs-empty">No documents yet — add a syllabus, slides, or a reading and tag it.</div>}
        {courseDocs.map((d) => (
          <div key={d.id} className="crs-row">
            <div>
              <strong>{d.title}</strong> <span className="crs-pill">{d.kind}</span> {d.weekId && <span className="crs-pill">{d.weekId}</span>}
              {d.summary && <div className="crs-empty">{d.summary}</div>}
              <div className="crs-tag-list">{d.tags.map((t) => <span key={t} className="crs-tag">{t}</span>)}</div>
              {d.ref?.type !== 'none' && d.ref?.value && (
                d.ref.type === 'drive-link'
                  ? <a href={d.ref.value} target="_blank" rel="noreferrer">open reference</a>
                  : <span className="crs-empty">{d.ref.value}</span>
              )}
            </div>
            <button className="crs-btn secondary" onClick={() => removeDocument(d.id)}>Remove</button>
          </div>
        ))}
        {showDocForm
          ? <DocumentForm courseId={course.id} onDone={() => setShowDocForm(false)} />
          : <button className="crs-btn secondary" onClick={() => setShowDocForm(true)}>+ Add document</button>}
      </div>

      <div className="crs-section">
        <h3>Assessments ({courseAssessments.length})</h3>
        {courseAssessments.length === 0 && <div className="crs-empty">No quizzes/exams logged yet.</div>}
        {courseAssessments.map((a) => (
          <div key={a.id} className="crs-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{a.name}</strong> <span className="crs-pill">{a.type}</span> <span className="crs-pill">{a.date}</span>
                {a.score != null && a.totalPossible != null && <span className="crs-pill">{a.score}/{a.totalPossible}</span>}
              </div>
              <button className="crs-btn secondary" onClick={() => removeAssessment(a.id)}>Remove</button>
            </div>
            {questionsByAssessment(a.id).map((q) => (
              <div key={q.id} className="crs-empty" style={{ paddingLeft: '0.5rem' }}>
                Q: {q.verbatimText} {q.correctAnswer && `— A: ${q.correctAnswer}`}
                {q.topicTags.length > 0 && <span className="crs-tag-list">{q.topicTags.map((t) => <span key={t} className="crs-tag">{t}</span>)}</span>}
              </div>
            ))}
          </div>
        ))}
        {showAssessForm
          ? <AssessmentCapture courseId={course.id} onDone={() => setShowAssessForm(false)} />
          : <button className="crs-btn secondary" onClick={() => setShowAssessForm(true)}>+ Log a quiz/exam</button>}
      </div>

      <div className="crs-section">
        <h3>Generate study questions</h3>
        <Boundary title="Question generation stopped working." resetId={course.id}>
          <ImportGenerated course={course} />
        </Boundary>
      </div>
    </div>
  );
}
