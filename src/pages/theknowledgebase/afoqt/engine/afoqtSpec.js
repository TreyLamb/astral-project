// AFOQT Form T structure. Every number here is sourced - see docs/afoqt/RESEARCH.md.
//
// Primary source: AFPC official Form T Information Pamphlet, Tables 1 and 2.
// Where Pearson VUE disagrees the variance is recorded in `pearson`, never silently
// resolved (repo policy: report both, pick deliberately).
//
// Pure data + pure functions. No React, no storage, no side effects.

/**
 * @typedef {Object} Subtest
 * @property {string} code            two-letter id used everywhere else
 * @property {string} name
 * @property {number} order           administration order on the real test
 * @property {'A'|'B'} part           Part A runs before the 15-minute break
 * @property {number} questions
 * @property {number} minutes
 * @property {number} choices         options per question (IC is the odd one out)
 * @property {boolean} scored         whether it feeds ANY composite
 * @property {boolean} studyable
 * @property {string[]} [pearsonNote]
 */

/** Seconds per question - the number this whole tool is designed around. */
export const secPerQuestion = (s) => (s.minutes * 60) / s.questions;

export const SUBTESTS = [
  { code: 'VA', name: 'Verbal Analogies',           order: 1,  part: 'A', questions: 25,  minutes: 8,    choices: 5, scored: true,  studyable: true },
  { code: 'AR', name: 'Arithmetic Reasoning',       order: 2,  part: 'A', questions: 25,  minutes: 29,   choices: 5, scored: true,  studyable: true },
  { code: 'WK', name: 'Word Knowledge',             order: 3,  part: 'A', questions: 25,  minutes: 5,    choices: 5, scored: true,  studyable: true },
  { code: 'MK', name: 'Math Knowledge',             order: 4,  part: 'A', questions: 25,  minutes: 22,   choices: 5, scored: true,  studyable: true },
  { code: 'RC', name: 'Reading Comprehension',      order: 5,  part: 'A', questions: 25,  minutes: 38,   choices: 5, scored: true,  studyable: true,
    pearsonNote: ['Pearson VUE publishes 24 minutes for this subtest; AFPC publishes 38.'] },
  { code: 'SJ', name: 'Situational Judgment',       order: 6,  part: 'A', questions: 50,  minutes: 35,   choices: 5, scored: false, studyable: true,
    pearsonNote: ['AFPC counts 50 QUESTIONS across 16 scenarios (each asks MOST then LEAST effective). Pearson counts the 16 scenarios. This is the entire 550-vs-516 discrepancy.'] },
  { code: 'SD', name: 'Self-Description Inventory', order: 7,  part: 'A', questions: 240, minutes: 45,   choices: 5, scored: false, studyable: false },
  { code: 'PS', name: 'Physical Science',           order: 8,  part: 'B', questions: 20,  minutes: 10,   choices: 5, scored: false, studyable: true },
  { code: 'TR', name: 'Table Reading',              order: 9,  part: 'B', questions: 40,  minutes: 7,    choices: 5, scored: true,  studyable: true },
  { code: 'IC', name: 'Instrument Comprehension',   order: 10, part: 'B', questions: 25,  minutes: 5,    choices: 4, scored: true,  studyable: true },
  { code: 'BC', name: 'Block Counting',             order: 11, part: 'B', questions: 30,  minutes: 4.5,  choices: 5, scored: true,  studyable: true,
    pearsonNote: ['Pearson VUE publishes 5 minutes; AFPC publishes 4.5.'] },
  { code: 'AI', name: 'Aviation Information',       order: 12, part: 'B', questions: 20,  minutes: 8,    choices: 5, scored: true,  studyable: true },
];

export const SUBTEST_BY_CODE = Object.fromEntries(SUBTESTS.map((s) => [s.code, s]));
export const getSubtest = (code) => SUBTEST_BY_CODE[code] ?? null;

/** Subtests that are drilled. Excludes the SDI, which has no right answers. */
export const DRILLABLE = SUBTESTS.filter((s) => s.studyable);

/**
 * Composite construction, reconstructed from AFPC Table 1 and independently confirmed.
 * NOTE: the composite COUNT is disputed - current commercial sources report six, while
 * the AFPC 2015 pamphlet and Barron's 4th Ed (2018) both describe a seventh Situational
 * Judgment composite. SJ is therefore modelled as `disputed`, not omitted.
 */
export const COMPOSITES = [
  { code: 'PILOT', name: 'Pilot',             subtests: ['MK', 'TR', 'IC', 'AI'],                    rated: true,  min: 25 },
  { code: 'CSO',   name: 'Combat Systems Officer', subtests: ['WK', 'MK', 'TR', 'BC'],               rated: true,  min: 25 },
  { code: 'ABM',   name: 'Air Battle Manager', subtests: ['VA', 'MK', 'TR', 'IC', 'BC', 'AI'],       rated: true,  min: 25 },
  { code: 'ACAD',  name: 'Academic Aptitude',  subtests: ['VA', 'AR', 'WK', 'MK', 'RC'],             rated: false, min: null },
  { code: 'VERB',  name: 'Verbal',             subtests: ['VA', 'WK', 'RC'],                         rated: false, min: 15 },
  { code: 'QUANT', name: 'Quantitative',       subtests: ['AR', 'MK'],                               rated: false, min: 10 },
  { code: 'SJT',   name: 'Situational Judgment', subtests: ['SJ'], rated: false, min: null, disputed: true },
];

/** How many composites a subtest feeds - MK is in 5, TR in all 3 rated ones. */
export function compositeReach(code) {
  return COMPOSITES.filter((c) => !c.disputed && c.subtests.includes(code)).map((c) => c.code);
}

/** Rights-only scoring: a blank is strictly worse than a guess. Never penalise. */
export const GUESSING_PENALTY = false;

/**
 * Share of a drill drawn from the miss pool. Trey's number, and the right one: a heavier rate
 * turns every session into a punishment loop, which is how the ASVAB deck lost its user.
 *
 * It lives here rather than in afoqtStorage because both the storage layer and the drill
 * assembler need it, and afoqtStorage imports firebase - which would drag a network client
 * into every Node script that just wanted to know the rate.
 */
export const MISS_INJECTION_RATE = 0.1;

export const BREAKS = [
  { afterOrder: 5,  minutes: 10, label: 'Break after Reading Comprehension' },
  { afterOrder: 7,  minutes: 15, label: 'Break between Part A and Part B' },
];

export const TOTAL_QUESTIONS = SUBTESTS.reduce((n, s) => n + s.questions, 0);
export const TOTAL_TEST_MINUTES = SUBTESTS.reduce((n, s) => n + s.minutes, 0);
