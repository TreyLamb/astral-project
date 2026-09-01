// Courses Firestore data layer — used only when signed in. Mirrors
// coursesStorage.js's business logic exactly, one collection:
// users/{uid}/courses_courses.
//
// The courses_documents/courses_assessments/courses_realquestions
// collections were removed 2026-08-28 along with the rest of the
// Documents/Assessments feature — see coursesStorage.js's header comment.
// Any old documents left in those collections from before the removal are
// simply orphaned, unread by the app.

import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { SEED_COURSES } from './coursesSeed';
import { uid } from './coursesStorage';

function coursesRef(uidStr) { return collection(db, 'users', uidStr, 'courses_courses'); }

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
  async removeCourse(uidStr, id) {
    await deleteDoc(doc(db, 'users', uidStr, 'courses_courses', id));
  },
};
