// TKB Firestore data layer — used only when signed in (see AuthContext).
// Mirrors tkbStorage.js's business logic (stat math, cycle randomization,
// cascades, import/dedup) exactly, just persisted under
// users/{uid}/tkb_questions, users/{uid}/tkb_subjects, and one combined
// users/{uid}/tkb_meta/state doc for weights/cycles/settings/sessions
// (small blobs — cheaper as one doc than four separate reads/writes).
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { SEED_SUBJECTS, SEED_QUESTIONS, SEED_WEIGHTS } from './tkbSeed';
import { ASVAB_SUBJECT } from './asvabSubject';
import ASVAB_QUESTIONS from './asvabQuestions.json';
import { uid, todayStr, defaultSettings, MAX_SESSIONS, SCHEMA_VERSION } from './tkbStorage';

function questionsRef(uidStr) {
  return collection(db, 'users', uidStr, 'tkb_questions');
}
function subjectsRef(uidStr) {
  return collection(db, 'users', uidStr, 'tkb_subjects');
}
function metaDocRef(uidStr) {
  return doc(db, 'users', uidStr, 'tkb_meta', 'state');
}

function defaultMeta() {
  return { weights: SEED_WEIGHTS, cycles: {}, sessions: [], settings: defaultSettings() };
}

export const TkbFirestore = {
  // First-run only — does nothing if the user already has questions. No
  // migration of any prior localStorage data, by explicit request: signed-in
  // users start with the same default deck a fresh guest would get.
  async seedIfEmpty(uidStr) {
    const existing = await getDocs(questionsRef(uidStr));
    if (!existing.empty) return;

    const batch = writeBatch(db);
    [...SEED_SUBJECTS, ASVAB_SUBJECT].forEach((s) => {
      batch.set(doc(db, 'users', uidStr, 'tkb_subjects', s.id), s);
    });
    [...SEED_QUESTIONS, ...ASVAB_QUESTIONS].forEach((q) => {
      batch.set(doc(db, 'users', uidStr, 'tkb_questions', q.id), q);
    });
    await batch.commit();

    const settings = defaultSettings();
    settings.autoScopedSubjectIds = [ASVAB_SUBJECT.id];
    await setDoc(metaDocRef(uidStr), { ...defaultMeta(), settings });
  },

  async getQuestions(uidStr) {
    const snap = await getDocs(questionsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },

  async getSubjects(uidStr) {
    const snap = await getDocs(subjectsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },

  async getMeta(uidStr) {
    const snap = await getDoc(metaDocRef(uidStr));
    return snap.exists() ? { ...defaultMeta(), ...snap.data() } : defaultMeta();
  },

  async addQuestion(uidStr, partial) {
    const q = {
      id: uid(),
      answerAlternates: [],
      styleTags: [],
      sourceNote: null,
      status: 'active',
      flagged: false,
      createdAt: new Date().toISOString(),
      stats: { timesShown: 0, timesCorrect: 0, timesWrong: 0, lastShownAt: null, correctDays: [] },
      ...partial,
    };
    await setDoc(doc(db, 'users', uidStr, 'tkb_questions', q.id), q);
    return q;
  },

  async updateQuestion(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'tkb_questions', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'tkb_questions', id));
    return snap.exists() ? snap.data() : null;
  },

  async removeQuestion(uidStr, id) {
    await deleteDoc(doc(db, 'users', uidStr, 'tkb_questions', id));
  },

  async recordAnswer(uidStr, id, grade, currentQuestion) {
    const today = todayStr();
    const stats = { ...currentQuestion.stats };
    stats.timesShown += 1;
    stats.lastShownAt = today;
    if (grade === 'correct') {
      stats.timesCorrect += 1;
      if (!stats.correctDays.includes(today)) stats.correctDays = [...stats.correctDays, today];
    } else if (grade === 'wrong') {
      stats.timesWrong += 1;
    }
    let pipeline = currentQuestion.pipeline;
    if (pipeline === 'quick_fact' && stats.correctDays.length >= 3) {
      pipeline = 'main_recall';
    }
    const updates = { stats, pipeline };
    await updateDoc(doc(db, 'users', uidStr, 'tkb_questions', id), updates);
    return { ...currentQuestion, ...updates };
  },

  async updateSubject(uidStr, id, updates) {
    await updateDoc(doc(db, 'users', uidStr, 'tkb_subjects', id), updates);
    const snap = await getDoc(doc(db, 'users', uidStr, 'tkb_subjects', id));
    return snap.exists() ? snap.data() : null;
  },

  // Cascades: questions, weights, cycles referencing this subject are removed too.
  async removeSubject(uidStr, id, currentQuestions) {
    await deleteDoc(doc(db, 'users', uidStr, 'tkb_subjects', id));

    const removedIds = currentQuestions.filter((q) => q.subjectId === id).map((q) => q.id);
    const batch = writeBatch(db);
    removedIds.forEach((qid) => batch.delete(doc(db, 'users', uidStr, 'tkb_questions', qid)));
    await batch.commit();

    const meta = await this.getMeta(uidStr);
    delete meta.weights.subject[id];
    removedIds.forEach((qid) => delete meta.weights.question[qid]);
    removedIds.forEach((qid) => delete meta.cycles[qid]);
    await setDoc(metaDocRef(uidStr), meta);
    return { removedIds, meta };
  },

  async mergeSubjects(uidStr, sourceId, targetId, currentSubjects, currentQuestions) {
    const source = currentSubjects.find((s) => s.id === sourceId);
    const target = currentSubjects.find((s) => s.id === targetId);
    if (!source || !target) return null;

    const mergedTarget = { ...target, subtopics: [...target.subtopics, ...source.subtopics] };
    await setDoc(doc(db, 'users', uidStr, 'tkb_subjects', targetId), mergedTarget);
    await deleteDoc(doc(db, 'users', uidStr, 'tkb_subjects', sourceId));

    const toMove = currentQuestions.filter((q) => q.subjectId === sourceId);
    const batch = writeBatch(db);
    toMove.forEach((q) => batch.update(doc(db, 'users', uidStr, 'tkb_questions', q.id), { subjectId: targetId }));
    await batch.commit();

    const meta = await this.getMeta(uidStr);
    delete meta.weights.subject[sourceId];
    await setDoc(metaDocRef(uidStr), meta);

    return { mergedTarget, movedIds: toMove.map((q) => q.id), meta };
  },

  async setWeight(uidStr, kind, key, value) {
    const meta = await this.getMeta(uidStr);
    meta.weights = { ...meta.weights, [kind]: { ...meta.weights[kind], [key]: value } };
    await setDoc(metaDocRef(uidStr), meta);
    return meta.weights;
  },

  async enterCycle(uidStr, questionId, reason, { activeMin, activeMax, restMin, restMax }) {
    const meta = await this.getMeta(uidStr);
    const activeDays = activeMin + Math.floor(Math.random() * (activeMax - activeMin + 1));
    const restDays = restMin + Math.floor(Math.random() * (restMax - restMin + 1));
    meta.cycles = {
      ...meta.cycles,
      [questionId]: {
        reason,
        phase: 'active',
        phaseStart: todayStr(),
        activeDays,
        restDays,
        maxCycles: 1 + Math.floor(Math.random() * 2),
        cyclesCompleted: 0,
      },
    };
    await setDoc(metaDocRef(uidStr), meta);
    return meta.cycles;
  },

  async addSession(uidStr, session) {
    const meta = await this.getMeta(uidStr);
    const sessions = [session, ...meta.sessions];
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    meta.sessions = sessions;
    await setDoc(metaDocRef(uidStr), meta);
    return session;
  },

  async updateSettings(uidStr, updates) {
    const meta = await this.getMeta(uidStr);
    meta.settings = { ...meta.settings, ...updates };
    await setDoc(metaDocRef(uidStr), meta);
    return meta.settings;
  },

  /**
   * Same shape/behavior as TkbStorage.importQuestions — see that file's
   * JSDoc. Runs against already-loaded currentSubjects/currentQuestions
   * (avoids an extra round trip) and writes the net-new docs.
   */
  async importQuestions(uidStr, jsonText, currentSubjects, currentQuestions) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { added: 0, skipped: 0, errors: ['Invalid JSON'] };
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'schemaVersion' in parsed) {
      const batch = writeBatch(db);
      currentSubjects.forEach((s) => batch.delete(doc(db, 'users', uidStr, 'tkb_subjects', s.id)));
      currentQuestions.forEach((q) => batch.delete(doc(db, 'users', uidStr, 'tkb_questions', q.id)));
      await batch.commit();

      const restoreBatch = writeBatch(db);
      (parsed.subjects ?? []).forEach((s) => restoreBatch.set(doc(db, 'users', uidStr, 'tkb_subjects', s.id), s));
      (parsed.questions ?? []).forEach((q) => restoreBatch.set(doc(db, 'users', uidStr, 'tkb_questions', q.id), q));
      await restoreBatch.commit();

      await setDoc(metaDocRef(uidStr), {
        weights: parsed.weights ?? { subject: {}, tag: {}, question: {} },
        cycles: parsed.cycles ?? {},
        sessions: parsed.sessions ?? [],
        settings: { ...defaultSettings(), ...(parsed.settings ?? {}) },
      });
      return { restored: true };
    }

    if (!Array.isArray(parsed)) {
      return { added: 0, skipped: 0, errors: ['Expected a JSON array of questions'] };
    }

    const VALID_DIFFICULTY = ['basic', 'intermediate', 'advanced'];
    const VALID_PIPELINE = ['quick_fact', 'main_recall'];
    const errors = [];
    let added = 0;
    let skipped = 0;

    const subjects = [...currentSubjects];
    const newSubjects = [];
    const questionBatch = writeBatch(db);
    const existingTexts = new Set(currentQuestions.map((q) => `${q.subjectId}::${q.question}`));

    parsed.forEach((row, i) => {
      if (!row.question || !row.answer || !row.subject) {
        errors.push(`Row ${i}: missing question/answer/subject`);
        return;
      }
      if (!VALID_DIFFICULTY.includes(row.difficulty)) {
        errors.push(`Row ${i}: invalid difficulty "${row.difficulty}"`);
        return;
      }
      if (!VALID_PIPELINE.includes(row.pipeline)) {
        errors.push(`Row ${i}: invalid pipeline "${row.pipeline}"`);
        return;
      }

      let subject = subjects.find((s) => s.name.toLowerCase() === row.subject.toLowerCase());
      if (!subject) {
        subject = {
          id: uid(),
          name: row.subject,
          color: 'hsl(210, 15%, 55%)',
          visibleToProfiles: ['main_recall', 'quick_facts', 'auto_all', 'auto_scoped'],
          subtopics: [],
        };
        subjects.push(subject);
        newSubjects.push(subject);
      }

      let subtopic = null;
      if (row.subtopic) {
        subtopic = subject.subtopics.find((st) => st.name.toLowerCase() === row.subtopic.toLowerCase());
        if (!subtopic) {
          subtopic = { id: uid(), name: row.subtopic, checklist: { basic: [], intermediate: [], advanced: [] } };
          subject.subtopics.push(subtopic);
          if (!newSubjects.includes(subject)) newSubjects.push(subject);
        }
      }

      const dedupeKey = `${subject.id}::${row.question}`;
      if (existingTexts.has(dedupeKey)) {
        skipped += 1;
        return;
      }
      existingTexts.add(dedupeKey);

      const q = {
        id: uid(),
        question: row.question,
        answer: row.answer,
        answerAlternates: row.answer_alternates ?? [],
        subjectId: subject.id,
        subtopicId: subtopic ? subtopic.id : null,
        difficulty: row.difficulty,
        pipeline: row.pipeline,
        styleTags: row.style_tags ?? [],
        sourceNote: row.source_note ?? null,
        source: 'import',
        status: 'draft',
        flagged: false,
        createdAt: new Date().toISOString(),
        stats: { timesShown: 0, timesCorrect: 0, timesWrong: 0, lastShownAt: null, correctDays: [] },
      };
      questionBatch.set(doc(db, 'users', uidStr, 'tkb_questions', q.id), q);
      added += 1;
    });

    // newSubjects already tracks every subject that's new OR gained a new
    // subtopic (pushed there right where the mutation happens above).
    if (newSubjects.length > 0) {
      const subjectBatch = writeBatch(db);
      newSubjects.forEach((s) => subjectBatch.set(doc(db, 'users', uidStr, 'tkb_subjects', s.id), s));
      await subjectBatch.commit();
    }
    if (added > 0) await questionBatch.commit();

    return { added, skipped, errors };
  },
};

export { SCHEMA_VERSION as TKB_FIRESTORE_SCHEMA_VERSION };
