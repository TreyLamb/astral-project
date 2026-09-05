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

/**
 * TREY'S ACTUAL OTS APPLICATION LIST, in his own submitted order (screenshot 2026-09-04).
 *
 * This is the thing that makes a study plan HIS rather than generic. Ten of the eleven are
 * NON-RATED line-officer jobs, which are selected on the Verbal and Quantitative minimums plus
 * Academic Aptitude as part of the whole-person score. Exactly one - RPA - is RATED, and rated
 * jobs are the only reason Table Reading, Instrument Comprehension, Block Counting and Aviation
 * Information matter to him at all.
 *
 * `rank` is his submitted preference order; the last two were left unranked on the form.
 *
 * ⚠ RPA IS RATED, AND THAT DOES NOT AGE HIM OUT - checked 2026-09-04 because he reasonably
 * assumed it should have. Manned rated (pilot / CSO / ABM) is the ~33rd-birthday rule everyone
 * quotes. **RPA is explicitly carved OUT of it**: DAFI 36-2137's Undergraduate Flying Training
 * age paragraph contains an exception for Undergraduate RPA Training and redirects RPA
 * applicants to the maximum age for APPOINTMENT in DAFMAN 36-2032 - i.e. the ordinary
 * commissioning ceiling rather than a flying-training one. That mechanism is the solid part, and
 * it is what makes "rated means 33" not apply here.
 *
 * ⚠ THE CEILING NUMBER ITSELF IS NOT SETTLED, and an earlier version of this comment stated it
 * as though it were. Sources of different vintages give 39, 40 and 42; the most recent points at
 * 42 under DAFMAN 36-2032 / 10 USC 1251, and notes AF/A1 and SF/S1 may further restrict it by
 * component. AFRS OTS guidance is quoted as "prior to their 40th birthday" with no age ETP
 * authorized for RPA. This is exactly the trap the folder CLAUDE.md names for AFOQT sources: an
 * official-looking document is not necessarily the current one. NO PRIMARY SOURCE WAS READ
 * DIRECTLY - the AFRS PDF 403s to automated fetching, and DAFI 36-2137 / DAFMAN 36-2032 were not
 * pulled from e-publishing. Treat every number above as secondhand.
 *
 * What survives the uncertainty: at 36 he is inside ALL of 39, 40 and 42, so the conclusion holds
 * whichever is current. The portal listing RPA under QUALIFIED is consistent with that. The
 * rated-only subtests (TR, IC, BC, AI) keep their PRIORITY scores below - do not "correct" this
 * by dropping RPA or demoting those four on the assumption that rated implies an age bar.
 *
 * Still worth a recruiter confirmation, and RPA gates separately on a flight physical and the
 * TBAS/PCSM - neither an age rule nor modelled here.
 *
 * ⚠ Composite REQUIREMENTS here are the AFOQT-side gate only. A real board also weighs GPA, the
 * whole-person score, and for RPA the TBAS/PCSM, none of which this tool models. Treat these as
 * "which subtests move the needle", not as an eligibility determination.
 */
export const CAREERS = [
  { rank: 1,    name: 'Intelligence',                     rated: false },
  { rank: 2,    name: 'U.S. Space Force Officer',         rated: false },
  { rank: 3,    name: 'Remotely Piloted Aircraft (RPA)',  rated: true  },
  { rank: 4,    name: 'Special Investigations (OSI)',     rated: false },
  { rank: 5,    name: 'Cyberspace Operations',            rated: false },
  { rank: 6,    name: 'ICBM Missile',                     rated: false },
  { rank: 7,    name: 'Munitions & Missile Maintenance',  rated: false },
  { rank: 8,    name: 'Security Forces',                  rated: false },
  { rank: 9,    name: 'Logistics Readiness',              rated: false },
  { rank: null, name: 'Aircraft Maintenance',             rated: false },
  { rank: null, name: 'Airfield Operations',              rated: false },
];

/** Non-rated line jobs gate on Verbal + Quantitative and are boarded on Academic Aptitude. */
const NON_RATED_COMPOSITES = ['VERB', 'QUANT', 'ACAD'];
/** RPA is the one rated job on his list. ABM is NOT - nothing he applied for uses it. */
const RATED_COMPOSITES = ['PILOT', 'CSO'];

/** Which composites a job is selected on, and therefore which subtests feed it. */
export function compositesForCareer(career) {
  return career.rated ? [...RATED_COMPOSITES, ...NON_RATED_COMPOSITES] : NON_RATED_COMPOSITES;
}

/** The subtests that feed a given job, in study-priority order. */
export function subtestsForCareer(career) {
  const codes = compositesForCareer(career);
  const set = new Set(COMPOSITES.filter((c) => codes.includes(c.code)).flatMap((c) => c.subtests));
  return [...set].sort((a, b) => (PRIORITY[b] ?? 0) - (PRIORITY[a] ?? 0));
}

/**
 * STUDY PRIORITY, 0-10. Trey's scale and his two anchors: "Math 10 most, physical science 0
 * least. Tests can tie their numbers."
 *
 * Derived from his application list above, not from the test in the abstract:
 *
 *  10  MK  the only subtest in EVERY composite he needs - both non-rated (QUANT, ACAD) and
 *          rated (PILOT, CSO). Nothing else spans both.
 *   9  WK  Verbal + Academic + CSO. The only other subtest that reaches a rated composite AND
 *          the non-rated gates that ten of his eleven jobs are selected on.
 *   8  VA/AR/RC  each feeds exactly two non-rated composites, which is what 10 of 11 jobs are
 *          scored on. Tied deliberately - there is no honest reason to separate them.
 *   5  SJ  DISPUTED. Modelled as possibly-scored (see COMPOSITES). If it counts it counts for
 *          every job on his list, so it is hedged mid-table rather than dismissed.
 *   6  TR  rated-only, but in BOTH of RPA's composites - the most valuable of the rated group.
 *   4  IC/BC/AI  rated-only and each in just ONE of RPA's two composites. They matter for
 *          exactly one job (his #3), which is why they sit below everything non-rated.
 *   0  PS  feeds no composite at all. His anchor, and correct.
 */
export const PRIORITY = {
  MK: 10, WK: 9, VA: 8, AR: 8, RC: 8, TR: 6, SJ: 5, IC: 4, BC: 4, AI: 4, PS: 0,
};

/**
 * The studyable subtests, most important to him FIRST. Ties fall back to real test order so the
 * list is stable rather than arbitrary.
 *
 * DRILLABLE itself deliberately keeps TEST order, because engine/diagnostic.js builds on it and a
 * diagnostic should mirror the real administration. Only the surfaces a human browses - the drill
 * picker and the dashboard table - use this one.
 */
export const DRILLABLE_BY_PRIORITY = [...DRILLABLE].sort(
  (a, b) => (PRIORITY[b.code] ?? 0) - (PRIORITY[a.code] ?? 0) || a.order - b.order,
);

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
