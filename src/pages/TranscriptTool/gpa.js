// GPA arithmetic. Pure — no imports, unit-tested against the transcript's own
// printed term footers and grand total.

// UVU's actual scale, derived from the transcript's own points column
// (points / credits): MAT 0990 C+ 9.60/4.00 = 2.40, EXSC 270G B+ 10.20/3.00 =
// 3.40, CHEM 1220 D+ 5.60/4.00 = 1.40. The plus/minus steps are 0.4/0.7, NOT
// the 0.3/0.7 of the common US scale — using "standard" here would print a GPA
// that disagrees with the transcript, which reads as a bug rather than a
// choice. E is UVU's failing grade; there is no F on this transcript.
export const SCALES = {
  uvu: {
    label: 'UVU (±0.4 / 0.7)',
    points: { A: 4.0, 'A-': 3.7, 'B+': 3.4, B: 3.0, 'B-': 2.7, 'C+': 2.4, C: 2.0, 'C-': 1.7, 'D+': 1.4, D: 1.0, 'D-': 0.7, E: 0.0, F: 0.0 },
  },
  standard: {
    label: 'Standard US (±0.3 / 0.7)',
    points: { A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, 'C-': 1.7, 'D+': 1.3, D: 1.0, 'D-': 0.7, E: 0.0, F: 0.0 },
  },
};

export const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

const FAILING = new Set(['E', 'F']);

// An 'E' in the R column marks an attempt superseded by a retake. It
// contributes ZERO GPA hours and zero points — it is not merely zero-pointed,
// it is removed from the denominator. Honouring these is what reproduces the
// printed 3.05; ignoring them inflates GPA hours from 171 to ~185.
export function isCounted(course, honorRepeats = true) {
  if (course.excluded) return false;
  return honorRepeats ? course.repeatFlag !== 'E' : true;
}

export function gradeOf(course, overrides = {}) {
  const o = overrides[course.id];
  return o || course.grade;
}

/**
 * @param {Array} courses
 * @param {{scale?: string, honorRepeats?: boolean, overrides?: Object}} opts
 * @returns {{gpaHours: number, earnedHours: number, points: number, gpa: number}}
 */
export function gpaOf(courses, opts = {}) {
  const { scale = 'uvu', honorRepeats = true, overrides = {} } = opts;
  const table = (SCALES[scale] || SCALES.uvu).points;

  let gpaHours = 0;
  let earnedHours = 0;
  let points = 0;

  for (const c of courses) {
    if (!isCounted(c, honorRepeats)) continue;
    const grade = gradeOf(c, overrides);
    if (grade === null || grade === undefined || grade === '' || grade === 'IP') continue;
    const value = table[grade];
    if (value === undefined) continue;
    gpaHours += c.credits;
    points += value * c.credits;
    if (!FAILING.has(grade)) earnedHours += c.credits;
  }

  // Float drift: 0.4 * 3 lands at 1.2000000000000002 and 15 terms of that
  // shifts the second decimal. Round to the registrar's own 2dp before
  // dividing so the displayed GPA matches the printed one exactly.
  points = Math.round(points * 100) / 100;
  return {
    gpaHours: Math.round(gpaHours * 100) / 100,
    earnedHours: Math.round(earnedHours * 100) / 100,
    points,
    gpa: gpaHours > 0 ? points / gpaHours : 0,
  };
}

// How far overall GPA would move if this one course were an A. This is the
// number that answers "which grades are dragging me down" — a 9-credit B-
// outranks a 1-credit C-, which sorting by letter grade alone gets backwards.
export function impactOf(courses, course, opts = {}) {
  if (!isCounted(course, opts.honorRepeats !== false)) return 0;
  const base = gpaOf(courses, opts).gpa;
  const lifted = gpaOf(courses, {
    ...opts,
    overrides: { ...(opts.overrides || {}), [course.id]: 'A' },
  }).gpa;
  return lifted - base;
}

// Credits at `target` grade needed to pull overall GPA up to `goal`.
// Returns null when the goal is already met, or unreachable (goal above the
// target grade's own value — no amount of B+ reaches a 3.9).
export function creditsToReach(courses, goal, opts = {}) {
  const { scale = 'uvu' } = opts;
  const table = (SCALES[scale] || SCALES.uvu).points;
  const per = table[opts.targetGrade || 'A'];
  const { gpaHours, points } = gpaOf(courses, opts);
  if (gpaHours > 0 && points / gpaHours >= goal) return { met: true, credits: 0 };
  if (per <= goal) return { met: false, credits: null, unreachable: true };
  const credits = (goal * gpaHours - points) / (per - goal);
  return { met: false, credits: Math.ceil(credits * 10) / 10, unreachable: false };
}

// UVU TRUNCATES the displayed GPA, it does not round. 2012 SPRING is
// 50.80 / 13 = 3.9077 and the transcript prints 3.90 — rounding would print
// 3.91. 2013 SPRING (1.909 -> 1.90) and 2016 SPRING (3.6263 -> 3.62) agree.
// The epsilon is for float drift: 34.5 / 10 * 100 lands at 344.99999999999994,
// which a bare floor() would turn into 3.44.
export function truncGpa(n) {
  return Number.isFinite(n) ? Math.floor(n * 100 + 1e-9) / 100 : 0;
}

export function fmtGpa(n) {
  return Number.isFinite(n) ? truncGpa(n).toFixed(2) : '—';
}
