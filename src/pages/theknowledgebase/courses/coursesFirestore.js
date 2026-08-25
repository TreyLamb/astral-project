// Courses Firestore data layer — used only when signed in. Mirrors
// coursesStorage.js's business logic exactly, one collection per entity under
// users/{uid}/courses_courses, users/{uid}/courses_documents,
// users/{uid}/courses_assessments, users/{uid}/courses_realquestions —
// same split tkbFirestore.js uses, not a single blob doc, because Documents
// and RealQuestions are expected to keep growing term over term.

import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { SEED_COURSES } from './coursesSeed';
import { uid } from './coursesStorage';

function coursesRef(uidStr) { return collection(db, 'users', uidStr, 'courses_courses'); }
function documentsRef(uidStr) { return collection(db, 'users', uidStr, 'courses_documents'); }
function assessmentsRef(uidStr) { return collection(db, 'users', uidStr, 'courses_assessments'); }
function realQuestionsRef(uidStr) { return collection(db, 'users', uidStr, 'courses_realquestions'); }

export const CoursesFirestore = {
  async seedIfEmpty(uidStr) {
    const existing = await getDocs(coursesRef(uidStr));
    if (!existing.empty) return;
    const batch = writeBatch(db);
    SEED_COURSES.forEach((c) => batch.set(doc(db, 'users', uidStr, 'courses_courses', c.id), c));
    await batch.commit();
  },

  async getCourses(uidStr) {
    const snap = await getDocs(coursesRef(uidStr));
    return snap.docs.map((d) => d.data());
  },
  async addCourse(uidStr, partial) {
    const c = {
      id: uid(), term: '', trackingLevel: 'full', color: 'hsl(203, 68%, 55%)',
      createdAt: new Date().toISOString(), ...partial,
    };
    await setDoc(doc(db, 'users', uidStr, 'courses_courses', c.id), c);
    return c;
  },
  async updateCourse(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'courses_courses', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'courses_courses', id));
    return snap.exists() ? snap.data() : null;
  },
  async removeCourse(uidStr, id, currentDocuments, currentAssessments, currentRealQuestions) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uidStr, 'courses_courses', id));
    currentDocuments.filter((d) => d.courseId === id).forEach((d) => batch.delete(doc(db, 'users', uidStr, 'courses_documents', d.id)));
    currentAssessments.filter((a) => a.courseId === id).forEach((a) => batch.delete(doc(db, 'users', uidStr, 'courses_assessments', a.id)));
    currentRealQuestions.filter((q) => q.courseId === id).forEach((q) => batch.delete(doc(db, 'users', uidStr, 'courses_realquestions', q.id)));
    await batch.commit();
  },

  async getDocuments(uidStr) {
    const snap = await getDocs(documentsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },
  async addDocument(uidStr, partial) {
    const d = { id: uid(), weekId: null, tags: [], summary: '', createdAt: new Date().toISOString(), ...partial };
    await setDoc(doc(db, 'users', uidStr, 'courses_documents', d.id), d);
    return d;
  },
  async updateDocument(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'courses_documents', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'courses_documents', id));
    return snap.exists() ? snap.data() : null;
  },
  async removeDocument(uidStr, id) {
    await deleteDoc(doc(db, 'users', uidStr, 'courses_documents', id));
  },

  async getAssessments(uidStr) {
    const snap = await getDocs(assessmentsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },
  async addAssessment(uidStr, partial) {
    const a = {
      id: uid(), type: 'quiz', questionIds: [], score: null, totalPossible: null,
      createdAt: new Date().toISOString(), ...partial,
    };
    await setDoc(doc(db, 'users', uidStr, 'courses_assessments', a.id), a);
    return a;
  },
  async updateAssessment(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'courses_assessments', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'courses_assessments', id));
    return snap.exists() ? snap.data() : null;
  },
  async removeAssessment(uidStr, id, currentRealQuestions) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uidStr, 'courses_assessments', id));
    currentRealQuestions.filter((q) => q.assessmentId === id).forEach((q) => batch.delete(doc(db, 'users', uidStr, 'courses_realquestions', q.id)));
    await batch.commit();
  },

  async getRealQuestions(uidStr) {
    const snap = await getDocs(realQuestionsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },
  async addRealQuestion(uidStr, partial, currentAssessment) {
    const q = {
      id: uid(), myAnswer: '', correctAnswer: '', topicTags: [], sourceDocId: null,
      createdAt: new Date().toISOString(), ...partial,
    };
    await setDoc(doc(db, 'users', uidStr, 'courses_realquestions', q.id), q);
    if (currentAssessment && !currentAssessment.questionIds.includes(q.id)) {
      await updateDoc(doc(db, 'users', uidStr, 'courses_assessments', currentAssessment.id), {
        questionIds: [...currentAssessment.questionIds, q.id],
      });
    }
    return q;
  },
  async updateRealQuestion(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'courses_realquestions', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'courses_realquestions', id));
    return snap.exists() ? snap.data() : null;
  },
  async removeRealQuestion(uidStr, id, currentAssessment) {
    await deleteDoc(doc(db, 'users', uidStr, 'courses_realquestions', id));
    if (currentAssessment) {
      await updateDoc(doc(db, 'users', uidStr, 'courses_assessments', currentAssessment.id), {
        questionIds: currentAssessment.questionIds.filter((qid) => qid !== id),
      });
    }
  },
};
