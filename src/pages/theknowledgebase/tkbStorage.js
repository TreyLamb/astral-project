// TKB (TheKnowledgeBase) localStorage data layer.
// Mirrors the mymdbStorage.js API shape so this can swap to a hosted DB later
// without rewriting call sites. This file is the single source of truth for
// every TKB data shape — see the JSDoc typedefs below.

import { SEED_SUBJECTS, SEED_QUESTIONS, SEED_WEIGHTS } from './tkbSeed';
import { ASVAB_SUBJECT } from './asvabSubject';
import ASVAB_QUESTIONS from './asvabQuestions.json';

export const SCHEMA_VERSION = 1;

const ASVAB_MERGE_KEY = 'tkb_asvab_merged_v1';
const CONTENT_SYNC_KEY = 'tkb_content_sync_v1';

// Questions pulled out of the ASVAB deck (2026-07-22 chemistry-depth cleanup)
// as too advanced for what the ASVAB actually tests (net ionic equations,
// molarity/equilibrium calculations, electron configuration, etc). Listed
// here so already-synced accounts (local or Firestore) get them removed too,
// not just fresh seeds of asvabQuestions.json.
export const REMOVED_QUESTION_IDS = [
  'q-asvab-supp-0753', 'q-asvab-supp-0755', 'q-asvab-supp-0756', 'q-asvab-supp-0759',
  'q-asvab-supp-0760', 'q-asvab-supp-0761', 'q-asvab-supp-0762', 'q-asvab-supp-0763',
  'q-asvab-supp-0765', 'q-asvab-supp-0766', 'q-asvab-supp-0767',
];

const KEYS = {
  questions: 'tkb_questions_v1',
  subjects: 'tkb_subjects_v1',
  weights: 'tkb_weights_v1',
  cycles: 'tkb_cycles_v1',
  sessions: 'tkb_sessions_v1',
  settings: 'tkb_settings_v1',
};

export const MAX_SESSIONS = 200;

/**
 * @typedef {Object} QuestionStats
 * @property {number} timesShown
 * @property {number} timesCorrect
 * @property {number} timesWrong
 * @property {string|null} lastShownAt - YYYY-MM-DD
 * @property {string[]} correctDays - distinct YYYY-MM-DD strings; 3 distinct
 *   entries promotes a quick_fact question to main_recall.
 */

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {string[]} answerAlternates
 * @property {string} subjectId
 * @property {string} subtopicId
 * @property {'basic'|'intermediate'|'advanced'} difficulty
 * @property {'main_recall'|'quick_fact'} pipeline
 * @property {string[]} styleTags
 * @property {string|null} sourceNote
 * @property {'seed'|'import'|'mock_adapter'} source
 * @property {'active'|'draft'|'retired'} status - 'retired' is a soft
 *   delete: excluded from selection (same as any non-'active' status) but
 *   kept in storage so it can be restored from Settings.
 * @property {boolean} flagged
 * @property {string} createdAt - ISO date
 * @property {QuestionStats} stats
 */

/**
 * @typedef {Object} Subtopic
 * @property {string} id
 * @property {string} name
 * @property {{basic:string[], intermediate:string[], advanced:string[]}} checklist
 */

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string[]} visibleToProfiles - preset ids: main_recall/quick_facts/auto_all/auto_scoped
 * @property {Subtopic[]} subtopics
 */

/**
 * @typedef {Object} Weights
 * @property {Object<string,number>} subject - subjectId -> 1..100
 * @property {Object<string,number>} tag - styleTag -> 1..100
 * @property {Object<string,number>} question - questionId -> 1..100
 */

/**
 * @typedef {Object} CycleState
 * @property {'new'|'wrong'|'flagged'} reason
 * @property {'active'|'rest'} phase
 * @property {string} phaseStart - YYYY-MM-DD
 * @property {number} activeDays
 * @property {number} restDays
 * @property {number} maxCycles - 1 or 2, rolled at entry
 * @property {number} cyclesCompleted
 */

/**
 * @typedef {Object} SessionLog
 * @property {string} id
 * @property {string} profileId
 * @property {string} startedAt - ISO datetime
 * @property {string|null} endedAt - ISO datetime
 * @property {number} requestedN
 * @property {number} served
 * @property {number} retries
 * @property {number} correct
 * @property {number} wrong
 * @property {number} unsure
 * @property {string[]} flaggedIds
 * @property {Object<string,number>} perSubject - subjectId -> count
 */

/**
 * @typedef {Object} FocusWeek
 * @property {string} id
 * @property {string} subjectId
 * @property {number} multiplier
 * @property {string} revertDate - YYYY-MM-DD
 */

/**
 * @typedef {Object} Settings
 * @property {number} schemaVersion
 * @property {string} activeProfileId
 * @property {string[]} autoScopedSubjectIds
 * @property {{activeMin:number, activeMax:number, restMin:number, restMax:number}} cycle - no concurrent-cycling cap, by explicit user request
 * @property {{min:number, max:number}} retryOffset
 * @property {boolean} selfRating
 * @property {'pool'|'subject'} colorMode
 * @property {number} defaultN
 * @property {FocusWeek[]} focusWeeks
 */

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
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

export function defaultSettings() {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeProfileId: 'main_recall',
    autoScopedSubjectIds: [],
    cycle: { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 },
    retryOffset: { min: 10, max: 40 },
    selfRating: false,
    colorMode: 'pool',
    defaultN: 60,
    focusWeeks: [],
  };
}

// Migration hook: bump SCHEMA_VERSION and add a case here when a shape changes.
export function migrate(settings) {
  const version = settings?.schemaVersion ?? 0;
  if (version < SCHEMA_VERSION) {
    return { ...defaultSettings(), ...settings, schemaVersion: SCHEMA_VERSION };
  }
  return settings;
}

function seedIfEmpty() {
  if (localStorage.getItem(KEYS.subjects) === null) {
    storeRaw(KEYS.subjects, SEED_SUBJECTS);
  }
  if (localStorage.getItem(KEYS.questions) === null) {
    storeRaw(KEYS.questions, SEED_QUESTIONS);
  }
  if (localStorage.getItem(KEYS.weights) === null) {
    storeRaw(KEYS.weights, SEED_WEIGHTS);
  }
  if (localStorage.getItem(KEYS.cycles) === null) {
    storeRaw(KEYS.cycles, {});
  }
  if (localStorage.getItem(KEYS.sessions) === null) {
    storeRaw(KEYS.sessions, []);
  }
  if (localStorage.getItem(KEYS.settings) === null) {
    storeRaw(KEYS.settings, defaultSettings());
  } else {
    const migrated = migrate(loadRaw(KEYS.settings, defaultSettings()));
    storeRaw(KEYS.settings, migrated);
  }
  mergeAsvabIfMissing();
  syncContentIfStale();
}

// One-time pass (guarded by its own flag, bump CONTENT_SYNC_KEY's version
// suffix to re-run for everyone) that patches question/answer/explanation
// text on ALREADY-STORED questions from the current source data, and drops
// REMOVED_QUESTION_IDS. mergeAsvabIfMissing above only ever ADDS ids that are
// missing — it never touches a question a user already has, so content
// fixes/explanations shipped after initial import would otherwise never
// reach an existing localStorage without this.
function syncContentIfStale() {
  if (localStorage.getItem(CONTENT_SYNC_KEY) !== null) return;

  const sourceById = new Map();
  for (const q of [...SEED_QUESTIONS, ...ASVAB_QUESTIONS]) sourceById.set(q.id, q);

  const questions = loadRaw(KEYS.questions, [])
    .filter(q => !REMOVED_QUESTION_IDS.includes(q.id))
    .map(q => {
      const src = sourceById.get(q.id);
      if (!src) return q;
      return { ...q, question: src.question, answer: src.answer, answerAlternates: src.answerAlternates, explanation: src.explanation };
    });
  storeRaw(KEYS.questions, questions);

  localStorage.setItem(CONTENT_SYNC_KEY, '1');
}

// Merges the ASVAB practice deck in exactly once, independent of whether the
// base seed above already ran (an existing user's localStorage still gets
// this deck added on their next load, not just fresh installs). Guarded by
// its own flag key so re-running seed() never re-adds or duplicates it.
function mergeAsvabIfMissing() {
  if (localStorage.getItem(ASVAB_MERGE_KEY) !== null) return;

  const subjects = loadRaw(KEYS.subjects, []);
  if (!subjects.some(s => s.id === ASVAB_SUBJECT.id)) {
    subjects.push(ASVAB_SUBJECT);
    storeRaw(KEYS.subjects, subjects);
  }

  const questions = loadRaw(KEYS.questions, []);
  const existingIds = new Set(questions.map(q => q.id));
  const newQuestions = ASVAB_QUESTIONS.filter(q => !existingIds.has(q.id));
  if (newQuestions.length > 0) {
    storeRaw(KEYS.questions, [...questions, ...newQuestions]);
  }

  const settings = migrate(loadRaw(KEYS.settings, defaultSettings()));
  if (!settings.autoScopedSubjectIds.includes(ASVAB_SUBJECT.id)) {
    settings.autoScopedSubjectIds = [...settings.autoScopedSubjectIds, ASVAB_SUBJECT.id];
    storeRaw(KEYS.settings, settings);
  }

  localStorage.setItem(ASVAB_MERGE_KEY, '1');
}

export const TkbStorage = {
  seed: seedIfEmpty,

  // --- Questions ---
  getQuestions() {
    return loadRaw(KEYS.questions, []);
  },
  saveQuestions(questions) {
    storeRaw(KEYS.questions, questions);
  },
  addQuestion(partial) {
    const questions = loadRaw(KEYS.questions, []);
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
    questions.push(q);
    storeRaw(KEYS.questions, questions);
    return q;
  },
  updateQuestion(id, updates) {
    const questions = loadRaw(KEYS.questions, []);
    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    questions[idx] = { ...questions[idx], ...updates };
    storeRaw(KEYS.questions, questions);
    return questions[idx];
  },
  removeQuestion(id) {
    storeRaw(KEYS.questions, loadRaw(KEYS.questions, []).filter(q => q.id !== id));
  },
  recordAnswer(id, grade) {
    // grade: 'correct' | 'wrong' | 'unsure'
    const questions = loadRaw(KEYS.questions, []);
    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    const q = questions[idx];
    const today = todayStr();
    const stats = { ...q.stats };
    stats.timesShown += 1;
    stats.lastShownAt = today;
    if (grade === 'correct') {
      stats.timesCorrect += 1;
      if (!stats.correctDays.includes(today)) stats.correctDays = [...stats.correctDays, today];
    } else if (grade === 'wrong') {
      stats.timesWrong += 1;
    }
    let pipeline = q.pipeline;
    if (pipeline === 'quick_fact' && stats.correctDays.length >= 3) {
      pipeline = 'main_recall';
    }
    questions[idx] = { ...q, stats, pipeline };
    storeRaw(KEYS.questions, questions);
    return questions[idx];
  },

  // --- Subjects ---
  getSubjects() {
    return loadRaw(KEYS.subjects, []);
  },
  saveSubjects(subjects) {
    storeRaw(KEYS.subjects, subjects);
  },
  updateSubject(id, updates) {
    const subjects = loadRaw(KEYS.subjects, []);
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) return null;
    subjects[idx] = { ...subjects[idx], ...updates };
    storeRaw(KEYS.subjects, subjects);
    return subjects[idx];
  },
  removeSubject(id) {
    // Cascades: questions, weights, cycles referencing this subject are removed too.
    const subjects = loadRaw(KEYS.subjects, []).filter(s => s.id !== id);
    storeRaw(KEYS.subjects, subjects);
    const questions = loadRaw(KEYS.questions, []);
    const removedIds = questions.filter(q => q.subjectId === id).map(q => q.id);
    storeRaw(KEYS.questions, questions.filter(q => q.subjectId !== id));
    const weights = loadRaw(KEYS.weights, { subject: {}, tag: {}, question: {} });
    delete weights.subject[id];
    removedIds.forEach(qid => delete weights.question[qid]);
    storeRaw(KEYS.weights, weights);
    const cycles = loadRaw(KEYS.cycles, {});
    removedIds.forEach(qid => delete cycles[qid]);
    storeRaw(KEYS.cycles, cycles);
  },
  mergeSubjects(sourceId, targetId) {
    const subjects = loadRaw(KEYS.subjects, []);
    const source = subjects.find(s => s.id === sourceId);
    const target = subjects.find(s => s.id === targetId);
    if (!source || !target) return;
    target.subtopics = [...target.subtopics, ...source.subtopics];
    storeRaw(KEYS.subjects, subjects.filter(s => s.id !== sourceId));
    const questions = loadRaw(KEYS.questions, []).map(q =>
      q.subjectId === sourceId ? { ...q, subjectId: targetId } : q
    );
    storeRaw(KEYS.questions, questions);
    const weights = loadRaw(KEYS.weights, { subject: {}, tag: {}, question: {} });
    if (weights.subject[sourceId] !== undefined) {
      delete weights.subject[sourceId];
    }
    storeRaw(KEYS.weights, weights);
  },

  // --- Weights ---
  getWeights() {
    return loadRaw(KEYS.weights, { subject: {}, tag: {}, question: {} });
  },
  saveWeights(weights) {
    storeRaw(KEYS.weights, weights);
  },
  setWeight(kind, key, value) {
    const weights = loadRaw(KEYS.weights, { subject: {}, tag: {}, question: {} });
    weights[kind] = { ...weights[kind], [key]: value };
    storeRaw(KEYS.weights, weights);
    return weights;
  },

  // --- Cycles ---
  getCycles() {
    return loadRaw(KEYS.cycles, {});
  },
  saveCycles(cycles) {
    storeRaw(KEYS.cycles, cycles);
  },
  enterCycle(questionId, reason, { activeMin, activeMax, restMin, restMax }) {
    const cycles = loadRaw(KEYS.cycles, {});
    const activeDays = activeMin + Math.floor(Math.random() * (activeMax - activeMin + 1));
    const restDays = restMin + Math.floor(Math.random() * (restMax - restMin + 1));
    cycles[questionId] = {
      reason,
      phase: 'active',
      phaseStart: todayStr(),
      activeDays,
      restDays,
      maxCycles: 1 + Math.floor(Math.random() * 2), // 1 or 2
      cyclesCompleted: 0,
    };
    storeRaw(KEYS.cycles, cycles);
    return cycles;
  },

  // --- Sessions ---
  getSessions() {
    return loadRaw(KEYS.sessions, []);
  },
  addSession(session) {
    const sessions = loadRaw(KEYS.sessions, []);
    sessions.unshift(session);
    if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS;
    storeRaw(KEYS.sessions, sessions);
    return session;
  },

  // --- Settings ---
  getSettings() {
    return migrate(loadRaw(KEYS.settings, defaultSettings()));
  },
  saveSettings(settings) {
    storeRaw(KEYS.settings, settings);
  },
  updateSettings(updates) {
    const settings = migrate(loadRaw(KEYS.settings, defaultSettings()));
    const merged = { ...settings, ...updates };
    storeRaw(KEYS.settings, merged);
    return merged;
  },

  // --- Export / Import ---
  exportAll() {
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      subjects: loadRaw(KEYS.subjects, []),
      questions: loadRaw(KEYS.questions, []),
      weights: loadRaw(KEYS.weights, { subject: {}, tag: {}, question: {} }),
      cycles: loadRaw(KEYS.cycles, {}),
      sessions: loadRaw(KEYS.sessions, []),
      settings: migrate(loadRaw(KEYS.settings, defaultSettings())),
    };
  },

  downloadExport() {
    const data = this.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tkb-export-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Retired (removed) questions live in the same 'tkb_questions_v1' localStorage
  // key as everything else, just flagged status:'retired' — nothing physically
  // moves. This export pulls just those out as plain question/answer pairs so
  // they're easy to hand to Claude as "too hard for this test" examples.
  downloadRemovedQuestions() {
    const questions = loadRaw(KEYS.questions, []).filter(q => q.status === 'retired');
    const subjects = loadRaw(KEYS.subjects, []);
    const subjectName = (id) => subjects.find(s => s.id === id)?.name ?? '(unknown)';
    const lines = questions.map(
      (q) => `Q: ${q.question}\nA: ${q.answer}\nSubject: ${subjectName(q.subjectId)}\n`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tkb-removed-questions-${todayStr()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Accepts either:
   *  - a notesToQuestionsPrompt.md array: [{question, answer, answer_alternates,
   *    subject, subtopic, difficulty, pipeline, style_tags, source_note}, ...]
   *  - a full exportAll() restore blob (detected via a top-level schemaVersion key)
   * Returns {added, skipped, errors} for import arrays, or {restored:true} for a restore.
   */
  importQuestions(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { added: 0, skipped: 0, errors: ['Invalid JSON'] };
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'schemaVersion' in parsed) {
      storeRaw(KEYS.subjects, parsed.subjects ?? []);
      storeRaw(KEYS.questions, parsed.questions ?? []);
      storeRaw(KEYS.weights, parsed.weights ?? { subject: {}, tag: {}, question: {} });
      storeRaw(KEYS.cycles, parsed.cycles ?? {});
      storeRaw(KEYS.sessions, parsed.sessions ?? []);
      storeRaw(KEYS.settings, migrate(parsed.settings ?? defaultSettings()));
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

    const subjects = loadRaw(KEYS.subjects, []);
    const questions = loadRaw(KEYS.questions, []);
    const existingTexts = new Set(questions.map(q => `${q.subjectId}::${q.question}`));

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

      let subject = subjects.find(s => s.name.toLowerCase() === row.subject.toLowerCase());
      if (!subject) {
        subject = {
          id: uid(),
          name: row.subject,
          color: 'hsl(210, 15%, 55%)',
          visibleToProfiles: ['main_recall', 'quick_facts', 'auto_all', 'auto_scoped'],
          subtopics: [],
        };
        subjects.push(subject);
      }

      let subtopic = null;
      if (row.subtopic) {
        subtopic = subject.subtopics.find(st => st.name.toLowerCase() === row.subtopic.toLowerCase());
        if (!subtopic) {
          subtopic = {
            id: uid(),
            name: row.subtopic,
            checklist: { basic: [], intermediate: [], advanced: [] },
          };
          subject.subtopics.push(subtopic);
        }
      }

      const dedupeKey = `${subject.id}::${row.question}`;
      if (existingTexts.has(dedupeKey)) {
        skipped += 1;
        return;
      }
      existingTexts.add(dedupeKey);

      questions.push({
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
      });
      added += 1;
    });

    storeRaw(KEYS.subjects, subjects);
    storeRaw(KEYS.questions, questions);

    return { added, skipped, errors };
  },
};

export { KEYS as TKB_STORAGE_KEYS };
