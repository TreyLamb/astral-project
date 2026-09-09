import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../CoursesApp';
import { useTkbData } from '../../TkbApp';
import { listWorksheets } from '../worksheets/worksheetsRegistry';
import { EXAMS, sectionsForExam } from '../chem/syllabusMap';
import ImportGenerated from './ImportGenerated';
import Boundary from '../../../../components/errors/Boundary';

const TRACKING_LEVELS = ['full', 'light', 'none'];

// The next exam to sit, resolved from syllabusMap rather than hardcoded, so the big button on
// the CHEM 1210 page keeps pointing at something real once Exam 1 is behind him. Swap the id
// here (or make it date-driven) when Exam 2 becomes the one that matters.
const EXAM_1 = {
  name: EXAMS[0].name,
  sections: sectionsForExam(EXAMS[0].id).map((s) => s.section),
};

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

      {/* PRACTICE GOES FIRST, AND IT GOES DIRECTLY. Trey, 2026-09-09: "I'm starting at the chem
          1210 page and there's nothing here to practice." He was right — the whole study module
          was one SECONDARY button labelled "Open", on a row titled "Chem 1 curriculum", sitting
          under a heading that visually competed with the "Generate study questions" panel below
          it. Nothing on this page used the words drill, practice or exam.

          It was also six clicks deep: courses → card → here → Open → chapter map → exam prep →
          pick exam → start. The first button below now goes STRAIGHT into a running 20-question
          Exam 1 drill, because the thing he needs the night before an exam should not be a menu. */}
      {hasChemCurriculum && (
        <div className="crs-practice">
          <h3>Practice</h3>
          <div className="crs-practice-grid">
            <button
              className="crs-practice-card primary"
              onClick={() => navigate(`/TKB/courses/chem/drill/run?count=20&label=${encodeURIComponent(EXAM_1.name)}&sections=${EXAM_1.sections.join(',')}`)}
            >
              <span className="crs-practice-icon">🎯</span>
              <strong>Start Exam 1 practice</strong>
              <small>20 questions from Ch 1–2 — begins immediately</small>
            </button>
            <button className="crs-practice-card" onClick={() => navigate('/TKB/courses/chem/exam')}>
              <span className="crs-practice-icon">📝</span>
              <strong>Exam prep</strong>
              <small>Pick the exam and question count. Exams 1–4 and the final.</small>
            </button>
            <button className="crs-practice-card" onClick={() => navigate('/TKB/courses/chem/quick')}>
              <span className="crs-practice-icon">⚡</span>
              <strong>Quick review</strong>
              <small>No arithmetic, built for a phone. Nothing is scored.</small>
            </button>
            <button className="crs-practice-card" onClick={() => navigate('/TKB/courses/chem/resources')}>
              <span className="crs-practice-icon">📖</span>
              <strong>Reference sheet</strong>
              <small>Units, prefixes, polyatomic ions, naming rules. Printable.</small>
            </button>
            <button className="crs-practice-card" onClick={() => navigate('/TKB/courses/chem/practice')}>
              <span className="crs-practice-icon">🔀</span>
              <strong>Mass review</strong>
              <small>Mixes every chapter, not just what an exam covers.</small>
            </button>
            <button className="crs-practice-card" onClick={() => navigate('/TKB/courses/chem')}>
              <span className="crs-practice-icon">📚</span>
              <strong>Chapters &amp; lessons</strong>
              <small>Read a lesson, test out, or drill one chapter at a time.</small>
            </button>
          </div>
        </div>
      )}

      {hasStudyMaterial && (courseWorksheets.length > 0 || activeQuestionCount > 0) && (
        <div className="crs-section">
          <h3>Other material</h3>
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
