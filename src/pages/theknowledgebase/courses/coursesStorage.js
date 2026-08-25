// Courses localStorage data layer. Mirrors tkbStorage.js's shape/pattern —
// see that file's header comment. This is the single source of truth for
// every Courses data shape.
//
// Bulk content (full syllabi, slide decks, scanned notes) never lives here or
// in Firestore — see CourseDocument.ref below. Only small, structured records
// do: course metadata, a document's tags/summary, and captured real quiz
// questions (verbatim text is short).

import { SEED_COURSES } from './coursesSeed';

export const SCHEMA_VERSION = 1;

const KEYS = {
  courses: 'courses_courses_v1',
  documents: 'courses_documents_v1',
  assessments: 'courses_assessments_v1',
  realQuestions: 'courses_realquestions_v1',
};

/**
 * @typedef {'full'|'light'|'none'} TrackingLevel
 * - full: documents, assessments and pattern analysis all expected
 * - light: course exists (name/credits) but no content is expected
 * - none: exists only so it doesn't get re-added by a future seed pass
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} code       - "MICR 2060"
 * @property {string} title      - "Microbiol for Health Prof"
 * @property {string} term       - "Fall 2026" — editable, not authoritative
 * @property {TrackingLevel} trackingLevel
 * @property {string} color
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CourseDocument
 * @property {string} id
 * @property {string} courseId
 * @property {string|null} weekId
 * @property {'syllabus'|'slides'|'reading'|'book-notes'|'lecture-notes'} kind
 * @property {string} title
 * @property {{type: 'drive-link'|'repo-doc'|'none', value: string}} ref - a
 *   reference, never the content itself. drive-link is an openable URL;
 *   repo-doc is a path under docs/courses/<CODE>/ that Trey adds by hand.
 * @property {string} summary   - short, hand-written — what gets tagged/searched
 * @property {string[]} tags    - topic tags, the join key for pattern analysis
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Assessment
 * @property {string} id
 * @property {string} courseId
 * @property {string} name        - "Quiz 1"
 * @property {'quiz'|'exam'|'homework'} type
 * @property {string} date        - YYYY-MM-DD
 * @property {string[]} questionIds
 * @property {number|null} score
 * @property {number|null} totalPossible
 * @property {string} createdAt
 */

/**
 * @typedef {Object} RealQuestion
 * @property {string} id
 * @property {string} courseId
 * @property {string} assessmentId
 * @property {string} verbatimText  - what the professor actually asked
 * @property {string} myAnswer
 * @property {string} correctAnswer
 * @property {string[]} topicTags
 * @property {string|null} sourceDocId
 * @property {string} createdAt
 */

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadRaw(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function storeRaw(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedIfEmpty() {
  if (localStorage.getItem(KEYS.courses) === null) {
    storeRaw(KEYS.courses, SEED_COURSES);
  }
  if (localStorage.getItem(KEYS.documents) === null) storeRaw(KEYS.documents, []);
  if (localStorage.getItem(KEYS.assessments) === null) storeRaw(KEYS.assessments, []);
  if (localStorage.getItem(KEYS.realQuestions) === null) storeRaw(KEYS.realQuestions, []);
}

export const CoursesStorage = {
  seed: seedIfEmpty,

  // --- Courses ---
  getCourses() {
    return loadRaw(KEYS.courses, []);
  },
  addCourse(partial) {
    const courses = loadRaw(KEYS.courses, []);
    const c = {
      id: uid(),
      term: '',
      trackingLevel: 'full',
      color: 'hsl(203, 68%, 55%)',
      createdAt: new Date().toISOString(),
      ...partial,
    };
    courses.push(c);
    storeRaw(KEYS.courses, courses);
    return c;
  },
  updateCourse(id, updates) {
    const courses = loadRaw(KEYS.courses, []);
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return null;
    courses[idx] = { ...courses[idx], ...updates };
    storeRaw(KEYS.courses, courses);
    return courses[idx];
  },
  removeCourse(id) {
    // Cascades: documents, assessments and real questions for this course go too.
    storeRaw(KEYS.courses, loadRaw(KEYS.courses, []).filter(c => c.id !== id));
    storeRaw(KEYS.documents, loadRaw(KEYS.documents, []).filter(d => d.courseId !== id));
    storeRaw(KEYS.assessments, loadRaw(KEYS.assessments, []).filter(a => a.courseId !== id));
    storeRaw(KEYS.realQuestions, loadRaw(KEYS.realQuestions, []).filter(q => q.courseId !== id));
  },

  // --- Documents ---
  getDocuments() {
    return loadRaw(KEYS.documents, []);
  },
  addDocument(partial) {
    const documents = loadRaw(KEYS.documents, []);
    const d = {
      id: uid(),
      weekId: null,
      tags: [],
      summary: '',
      createdAt: new Date().toISOString(),
      ...partial,
    };
    documents.push(d);
    storeRaw(KEYS.documents, documents);
    return d;
  },
  updateDocument(id, updates) {
    const documents = loadRaw(KEYS.documents, []);
    const idx = documents.findIndex(d => d.id === id);
    if (idx === -1) return null;
    documents[idx] = { ...documents[idx], ...updates };
    storeRaw(KEYS.documents, documents);
    return documents[idx];
  },
  removeDocument(id) {
    storeRaw(KEYS.documents, loadRaw(KEYS.documents, []).filter(d => d.id !== id));
  },

  // --- Assessments ---
  getAssessments() {
    return loadRaw(KEYS.assessments, []);
  },
  addAssessment(partial) {
    const assessments = loadRaw(KEYS.assessments, []);
    const a = {
      id: uid(),
      type: 'quiz',
      questionIds: [],
      score: null,
      totalPossible: null,
      createdAt: new Date().toISOString(),
      ...partial,
    };
    assessments.push(a);
    storeRaw(KEYS.assessments, assessments);
    return a;
  },
  updateAssessment(id, updates) {
    const assessments = loadRaw(KEYS.assessments, []);
    const idx = assessments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    assessments[idx] = { ...assessments[idx], ...updates };
    storeRaw(KEYS.assessments, assessments);
    return assessments[idx];
  },
  removeAssessment(id) {
    storeRaw(KEYS.assessments, loadRaw(KEYS.assessments, []).filter(a => a.id !== id));
    storeRaw(KEYS.realQuestions, loadRaw(KEYS.realQuestions, []).filter(q => q.assessmentId !== id));
  },

  // --- Real questions ---
  getRealQuestions() {
    return loadRaw(KEYS.realQuestions, []);
  },
  addRealQuestion(partial) {
    const questions = loadRaw(KEYS.realQuestions, []);
    const q = {
      id: uid(),
      myAnswer: '',
      correctAnswer: '',
      topicTags: [],
      sourceDocId: null,
      createdAt: new Date().toISOString(),
      ...partial,
    };
    questions.push(q);
    storeRaw(KEYS.realQuestions, questions);

    const assessments = loadRaw(KEYS.assessments, []);
    const idx = assessments.findIndex(a => a.id === q.assessmentId);
    if (idx !== -1 && !assessments[idx].questionIds.includes(q.id)) {
      assessments[idx] = { ...assessments[idx], questionIds: [...assessments[idx].questionIds, q.id] };
      storeRaw(KEYS.assessments, assessments);
    }
    return q;
  },
  updateRealQuestion(id, updates) {
    const questions = loadRaw(KEYS.realQuestions, []);
    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    questions[idx] = { ...questions[idx], ...updates };
    storeRaw(KEYS.realQuestions, questions);
    return questions[idx];
  },
  removeRealQuestion(id) {
    const q = loadRaw(KEYS.realQuestions, []).find(q => q.id === id);
    storeRaw(KEYS.realQuestions, loadRaw(KEYS.realQuestions, []).filter(q => q.id !== id));
    if (!q) return;
    const assessments = loadRaw(KEYS.assessments, []);
    const idx = assessments.findIndex(a => a.id === q.assessmentId);
    if (idx !== -1) {
      assessments[idx] = { ...assessments[idx], questionIds: assessments[idx].questionIds.filter(qid => qid !== id) };
      storeRaw(KEYS.assessments, assessments);
    }
  },
};

export { KEYS as COURSES_STORAGE_KEYS };
