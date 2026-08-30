// AFOQT progress layer. Mirrors the local-vs-Firestore split TkbApp already uses.
//
// Mastery is tracked PER TEMPLATE, not per instance. With generated questions there is no
// stable per-question identity, and "you are 62% on one-step linear equations" is a more
// useful fact than "you missed question #1234" anyway. Because (templateId, seed)
// regenerates a question byte-identically, a miss can be replayed without ever storing
// question text - so the whole progress blob stays small enough for ONE Firestore doc
// (users/{uid}/afoqt/progress) instead of a document per question.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MISS_INJECTION_RATE } from './engine/afoqtSpec';

export const AFOQT_SCHEMA_VERSION = 1;
const KEY = 'afoqt_progress_v1';

export { MISS_INJECTION_RATE };
/** Distinct days of correct answers before a template graduates out of the miss pool.
 *  Separate DAYS, not repetitions - the same rule tkbStorage uses for quick-fact promotion,
 *  which exists to stop short-term memory faking mastery. */
export const GRADUATION_DAYS = 3;

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function defaultProgress() {
  return {
    schemaVersion: AFOQT_SCHEMA_VERSION,
    templateStats: {},   // templateId -> { seen, correct, totalMs, lastSeen, correctDays[] }
    missPool: {},        // templateId -> { seeds: [], addedAt, correctDays: [] }
    runs: [],            // most recent first, capped
    examRuns: [],        // most recent first, capped - full-length simulated exams only (PART 28)
    diagnosticRuns: [],  // most recent first, capped - short whole-subtest samples (PART 29)
    chapters: {},        // chapterId -> { status, testedOut, completedAt, bestScore }
    wordBank: {},        // word (lowercased) -> { word, pos, gloss, root, missCount, firstMissedAt, lastMissedAt }
    settings: {
      mode: 'paced',
      pressure: 1,
      perQuestionClock: false,
      autoGuessOnTimeout: true, // rights-only scoring: never leave a blank
      missInjection: MISS_INJECTION_RATE,
    },
  };
}

const MAX_RUNS = 200;

export function migrate(p) {
  if (!p || typeof p !== 'object') return defaultProgress();
  const d = defaultProgress();
  return {
    ...d,
    ...p,
    schemaVersion: AFOQT_SCHEMA_VERSION,
    settings: { ...d.settings, ...(p.settings ?? {}) },
  };
}

/** Fold one answered question into the progress blob. Pure - returns a new object. */
export function applyAnswer(progress, { templateId, seed, correct, elapsedMs }) {
  const p = { ...progress, templateStats: { ...progress.templateStats }, missPool: { ...progress.missPool } };
  const today = todayStr();

  const prev = p.templateStats[templateId] ?? { seen: 0, correct: 0, totalMs: 0, lastSeen: null, correctDays: [] };
  const correctDays = correct && !prev.correctDays.includes(today)
    ? [...prev.correctDays, today]
    : prev.correctDays;
  p.templateStats[templateId] = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    totalMs: prev.totalMs + (elapsedMs ?? 0),
    lastSeen: today,
    correctDays,
  };

  if (!correct) {
    const cur = p.missPool[templateId] ?? { seeds: [], addedAt: today, correctDays: [] };
    // Keep the seeds so the exact missed question can be replayed verbatim.
    const seeds = cur.seeds.includes(seed) ? cur.seeds : [...cur.seeds, seed].slice(-20);
    p.missPool[templateId] = { ...cur, seeds, correctDays: [] };
  } else if (p.missPool[templateId]) {
    const cur = p.missPool[templateId];
    const days = cur.correctDays.includes(today) ? cur.correctDays : [...cur.correctDays, today];
    if (days.length >= GRADUATION_DAYS) delete p.missPool[templateId];
    else p.missPool[templateId] = { ...cur, correctDays: days };
  }
  return p;
}

export const accuracy = (s) => (s && s.seen ? s.correct / s.seen : null);
export const avgMs = (s) => (s && s.seen ? Math.round(s.totalMs / s.seen) : null);

/** Templates currently owed extra reps. */
export const missPoolIds = (progress) => Object.keys(progress.missPool ?? {});

/** Wipe the miss pool so a run is an honest, unbiased baseline. */
export function clearMissPool(progress) {
  return { ...progress, missPool: {} };
}

// --- word bank -------------------------------------------------------------
//
// Trey's request: Word Knowledge is guessable at 20% a shot (5 options), so a lucky run can
// leave real gaps invisible. Every MISSED Word Knowledge question - drill, gate, diagnostic,
// exam, all of them, `recordAnswer` doesn't distinguish - folds that word into a standing
// personal vocabulary list instead of just resurfacing it through the ordinary miss pool. The
// miss pool already resurfaces the QUESTION; this is a separate, browsable DEFINITION list that
// only grows, so "words I've actually gotten wrong" is reviewable on its own, not buried inside
// a drill. `word` from `q.vocab` is already lowercase (see engine/words.js WordRow.word), and is
// used as the storage key directly - two rows never describe the same headword differently.

export function addToWordBank(progress, vocab) {
  if (!vocab || !vocab.word) return progress;
  const key = vocab.word.toLowerCase();
  const prev = progress.wordBank?.[key];
  const today = todayStr();
  return {
    ...progress,
    wordBank: {
      ...progress.wordBank,
      [key]: {
        word: vocab.word, pos: vocab.pos, gloss: vocab.gloss, root: vocab.root ?? null,
        missCount: (prev?.missCount ?? 0) + 1,
        firstMissedAt: prev?.firstMissedAt ?? today,
        lastMissedAt: today,
      },
    },
  };
}

/** A word graduates once it's been captured but you've since gotten it right elsewhere - kept
 *  as an explicit action rather than automatic, since "reviewed it" is a judgement only the
 *  learner can make, not something the drill can infer from one correct answer. */
export function removeFromWordBank(progress, word) {
  const key = word.toLowerCase();
  if (!(key in (progress.wordBank ?? {}))) return progress;
  const next = { ...progress.wordBank };
  delete next[key];
  return { ...progress, wordBank: next };
}

/** Worst-first: the word missed the most times floats to the top of the review list. */
export const wordBankEntries = (progress) =>
  Object.values(progress.wordBank ?? {}).sort((a, b) => b.missCount - a.missCount || a.word.localeCompare(b.word));

export function addRun(progress, run) {
  return { ...progress, runs: [run, ...(progress.runs ?? [])].slice(0, MAX_RUNS) };
}

// --- full-length exam runs (PART 28) ---------------------------------------
//
// Distinct from `runs`, which is one entry per single-subtest drill. An exam run covers all
// 12 Form T steps at once, so it gets its own small list rather than being folded into `runs`
// and forcing every reader of `runs` to branch on shape. PART 30's trend-over-time view can
// read "how did each full sitting go" directly from here without reconstructing it from 12
// individual subtest rows.

const MAX_EXAM_RUNS = 50;

/** @param {{examId, startedAt, finishedAt, results, aborted?:boolean}} examRun */
export function addExamRun(progress, examRun) {
  return { ...progress, examRuns: [examRun, ...(progress.examRuns ?? [])].slice(0, MAX_EXAM_RUNS) };
}

// --- exam session (PART 28) -------------------------------------------------
//
// The IN-PROGRESS state of a full exam - which step, the current step's questions/answers,
// its start time. Kept separate from `progress` on purpose: a real exam runs ~4-5 hours, so
// this is large, changes on every answered question, and is pure scratch state that must
// never fight the debounced Firestore write `persist()` already does for `progress`. It is
// local-only - resuming a half-finished exam on a different device is not a requirement this
// tool takes on, the same way a half-finished DrillRunner session already isn't persisted
// across devices either.
const EXAM_SESSION_KEY = 'afoqt_exam_session_v1';

export const ExamSession = {
  load() {
    try {
      const raw = localStorage.getItem(EXAM_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(session) {
    localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(session));
    return session;
  },
  clear() {
    localStorage.removeItem(EXAM_SESSION_KEY);
  },
};

// --- diagnostic runs (PART 29) -----------------------------------------------
//
// A short, honest sample of every scored subtest - see engine/diagnostic.js. Unlike the exam
// session above, there is no separate in-progress local-storage store: a diagnostic runs well
// under an hour and its live state is plain React component state in DiagnosticRunner.jsx, the
// same convention DrillRunner.jsx already uses for an ordinary drill. Only the FINISHED result
// folds in here, via `mutate()`, same as `addExamRun`/`addRun`.

const MAX_DIAGNOSTIC_RUNS = 20;

/** @param {{takenAt, results}} run */
export function addDiagnosticRun(progress, run) {
  return { ...progress, diagnosticRuns: [run, ...(progress.diagnosticRuns ?? [])].slice(0, MAX_DIAGNOSTIC_RUNS) };
}

/** Most recent diagnostic, or null if none has ever been taken. */
export const latestDiagnostic = (progress) => progress?.diagnosticRuns?.[0] ?? null;

// --- curriculum chapters ---------------------------------------------------
//
// A chapter is: test-out gate -> lesson -> drill -> mastery check. The gate exists because
// Trey estimates he already knows most of the math track, and sitting him through a lesson on
// order of operations is how a study tool loses its user in week one.

/** @typedef {'locked'|'available'|'reading'|'drilling'|'complete'} ChapterStatus */

export const emptyChapter = () => ({
  status: 'available',
  testedOut: false,
  lessonRead: false,
  bestScore: null,     // best mastery-check score, 0-1
  attempts: 0,
  completedAt: null,
});

export const chapterState = (progress, id) => progress?.chapters?.[id] ?? emptyChapter();

function patchChapter(progress, id, patch) {
  const prev = chapterState(progress, id);
  return {
    ...progress,
    chapters: { ...(progress.chapters ?? {}), [id]: { ...prev, ...patch } },
  };
}

export const markLessonRead = (progress, id) => patchChapter(progress, id, { lessonRead: true, status: 'drilling' });

/**
 * Record a test-out attempt. Passing skips the lesson outright.
 * `pass` is the chapter's own threshold - 5/5 for the geometry chapters, 4/5 elsewhere,
 * because a lucky 4 is exactly how a weak area gets skipped.
 */
export function recordTestOut(progress, id, { correct, total, pass }) {
  const passed = correct >= pass;
  const prev = chapterState(progress, id);
  return patchChapter(progress, id, {
    attempts: prev.attempts + 1,
    testedOut: passed,
    status: passed ? 'complete' : 'reading',
    bestScore: Math.max(prev.bestScore ?? 0, correct / total),
    completedAt: passed ? new Date().toISOString() : prev.completedAt,
  });
}

/** Mastery check at the end of a chapter. ~85% clears it, matching the plan. */
export const MASTERY_THRESHOLD = 0.85;

export function recordMastery(progress, id, { correct, total }) {
  const score = total ? correct / total : 0;
  const prev = chapterState(progress, id);
  const passed = score >= MASTERY_THRESHOLD;
  return patchChapter(progress, id, {
    attempts: prev.attempts + 1,
    bestScore: Math.max(prev.bestScore ?? 0, score),
    status: passed ? 'complete' : 'drilling',
    completedAt: passed ? new Date().toISOString() : prev.completedAt,
  });
}

export const isChapterDone = (progress, id) => {
  const st = chapterState(progress, id);
  return st.status === 'complete' || st.testedOut;
};

export function curriculumProgress(progress, chapters) {
  const done = chapters.filter((c) => isChapterDone(progress, c.id));
  return {
    done: done.length,
    total: chapters.length,
    testedOut: done.filter((c) => chapterState(progress, c.id).testedOut).length,
    minutesLeft: chapters.filter((c) => !isChapterDone(progress, c.id)).reduce((n, c) => n + c.minutes, 0),
  };
}

// --- persistence -----------------------------------------------------------

export const AfoqtLocal = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? migrate(JSON.parse(raw)) : defaultProgress();
    } catch {
      return defaultProgress();
    }
  },
  save(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
    return p;
  },
};

export const AfoqtCloud = {
  ref: (uid) => doc(db, 'users', uid, 'afoqt', 'progress'),
  async load(uid) {
    const snap = await getDoc(AfoqtCloud.ref(uid));
    return snap.exists() ? migrate(snap.data()) : defaultProgress();
  },
  async save(uid, p) {
    await setDoc(AfoqtCloud.ref(uid), p);
    return p;
  },
};
