// Courses localStorage data layer. Mirrors tkbStorage.js's shape/pattern —
// see that file's header comment. This is the single source of truth for
// every Courses data shape.
//
// Documents/Assessments/RealQuestions (and the pattern-analysis report built
// on them) were removed 2026-08-28 at Trey's request — he tracks that by hand
// elsewhere and the manual entry UI here was dead weight. Only Course records
// (+ the separate, JSON-backed Worksheets feature) remain.

import { SEED_COURSES } from './coursesSeed';

export const SCHEMA_VERSION = 1;

const KEYS = {
  courses: 'courses_courses_v1',
};

/**
 * @typedef {'full'|'light'|'none'} TrackingLevel
 * - full: real content is expected for this course
 * - light: course exists (name/credits) but no content is expected
 * - none: exists only so it doesn't get re-added by a future seed pass
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} code       - "MICR 2060"
 * @property {string} title      - "Microbiology for Health Professions"
 * @property {string} [section]  - "X01" — registrar section, distinguishes online from in-person
 * @property {number} [credits]  - 3 — weights how much study time the course deserves
 * @property {string} [crn]      - "15476" — registrar id, the stable key across systems
 * @property {string} [delivery] - "Online" | "Face to Face" | "Face to Face Lab"
 * @property {string} term       - "Fall 2026" — editable, not authoritative
 * @property {TrackingLevel} trackingLevel
 * @property {string} color
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
}

export const CoursesStorage = {
  seed: seedIfEmpty,

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
    storeRaw(KEYS.courses, loadRaw(KEYS.courses, []).filter(c => c.id !== id));
  },
};

export { KEYS as COURSES_STORAGE_KEYS };
