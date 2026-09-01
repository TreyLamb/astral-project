// Chem curriculum progress layer. Mirrors afoqtStorage.js's chapter-progress pattern (same
// local-first/debounced-cloud persistence, same chapterState/recordTestOut/recordMastery
// shape) — see afoqt/afoqtStorage.js's own header for the reasoning. No templateStats/missPool
// here: Chem has no bank/miss-pool system (courses/chem/PLAN.md), so progress is just
// per-chapter gate/mastery state, one small Firestore doc.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';

export const CHEM_SCHEMA_VERSION = 1;
const KEY = 'chem_progress_v1';

export function defaultChemProgress() {
  return {
    schemaVersion: CHEM_SCHEMA_VERSION,
    chapters: {}, // chapterId -> { status, testedOut, lessonRead, bestScore, attempts, completedAt }
    runs: [],     // most recent first, capped
  };
}

const MAX_RUNS = 100;

export function migrateChemProgress(p) {
  if (!p || typeof p !== 'object') return defaultChemProgress();
  return { ...defaultChemProgress(), ...p, schemaVersion: CHEM_SCHEMA_VERSION };
}

export function addChemRun(progress, run) {
  return { ...progress, runs: [run, ...(progress.runs ?? [])].slice(0, MAX_RUNS) };
}

/** @typedef {'available'|'reading'|'drilling'|'complete'} ChemChapterStatus */

export const emptyChemChapter = () => ({
  status: 'available',
  testedOut: false,
  lessonRead: false,
  bestScore: null,   // best mastery-check (or test-out) score, 0-1
  attempts: 0,
  completedAt: null,
});

export const chemChapterState = (progress, id) => progress?.chapters?.[id] ?? emptyChemChapter();

function patchChemChapter(progress, id, patch) {
  const prev = chemChapterState(progress, id);
  return { ...progress, chapters: { ...(progress.chapters ?? {}), [id]: { ...prev, ...patch } } };
}

export const markChemLessonRead = (progress, id) => patchChemChapter(progress, id, { lessonRead: true, status: 'drilling' });

export function recordChemTestOut(progress, id, { correct, total, pass }) {
  const passed = correct >= pass;
  const prev = chemChapterState(progress, id);
  return patchChemChapter(progress, id, {
    attempts: prev.attempts + 1,
    testedOut: passed,
    status: passed ? 'complete' : 'reading',
    bestScore: Math.max(prev.bestScore ?? 0, total ? correct / total : 0),
    completedAt: passed ? new Date().toISOString() : prev.completedAt,
  });
}

export const CHEM_MASTERY_THRESHOLD = 0.8;

export function recordChemMastery(progress, id, { correct, total }) {
  const score = total ? correct / total : 0;
  const prev = chemChapterState(progress, id);
  const passed = score >= CHEM_MASTERY_THRESHOLD;
  return patchChemChapter(progress, id, {
    attempts: prev.attempts + 1,
    bestScore: Math.max(prev.bestScore ?? 0, score),
    status: passed ? 'complete' : 'drilling',
    completedAt: passed ? new Date().toISOString() : prev.completedAt,
  });
}

export const isChemChapterDone = (progress, id) => {
  const st = chemChapterState(progress, id);
  return st.status === 'complete' || st.testedOut;
};

export function chemCurriculumProgress(progress, chapters) {
  const done = chapters.filter((c) => isChemChapterDone(progress, c.id));
  return {
    done: done.length,
    total: chapters.length,
    testedOut: done.filter((c) => chemChapterState(progress, c.id).testedOut).length,
    minutesLeft: chapters.filter((c) => !isChemChapterDone(progress, c.id)).reduce((n, c) => n + c.minutes, 0),
  };
}

// --- persistence -------------------------------------------------------------

export const ChemLocal = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? migrateChemProgress(JSON.parse(raw)) : defaultChemProgress();
    } catch {
      return defaultChemProgress();
    }
  },
  save(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
    return p;
  },
};

export const ChemCloud = {
  ref: (uid) => doc(db, 'users', uid, 'chem', 'progress'),
  async load(uid) {
    const snap = await getDoc(ChemCloud.ref(uid));
    return snap.exists() ? migrateChemProgress(snap.data()) : defaultChemProgress();
  },
  async save(uid, p) {
    await setDoc(ChemCloud.ref(uid), p);
    return p;
  },
};
