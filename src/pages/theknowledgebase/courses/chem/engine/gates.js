// Two gate tests per book section, at two different difficulty ceilings.
//
// Trey's design, 2026-09-02: "I want 2 different gate-tests per section. a gate test for the
// bands1-3 and a gate test for 4-5."
//
// WHY TWO RATHER THAN ONE HARDER ONE
// The two exams are not the same exam. His instructor's quizzes sit at bands 1-3 and are keyed to
// book sections; the ACS final is notoriously harder, formulaic and calculation-dense, and lives
// at bands 4-5. A single gate averaged across both would report a number that answers neither
// question: passing it would not mean "ready for Friday's quiz" OR "ready for the final". Two
// gates give two honest answers.
//
// THE UNIT IS THE SECTION, NOT THE CHAPTER. Canvas quizzes are titled by section ("Quiz 12,
// Sec 4-3 to 4-4"), so a section-level gate maps 1:1 onto a real graded event. Chapters are still
// how the ACS track walks the material - see syllabusMap.js for why both coordinates exist.
//
// NOTHING HERE LOCKS ANYTHING. Failing a gate never closes the lesson or the drill, and the ACS
// gate is never gated behind the course gate - same rule AFOQT's ChapterView already follows
// (afoqt/views/ChapterView.jsx step 3). A gate reports readiness; it does not ration content.

/**
 * @typedef {'course'|'acs'} GateTier
 */

/**
 * @typedef {Object} GateSpec
 * @property {GateTier} tier
 * @property {string} label        shown on the gate button
 * @property {string} blurb        one line saying what passing it actually means
 * @property {number[]} bands      template difficulty bands this gate draws from
 * @property {number} count        questions per attempt
 * @property {number} pass         correct answers needed to pass
 * @property {boolean} stretch     true = above what the course itself demands
 */

/** @type {Record<GateTier, GateSpec>} */
export const GATE_TIERS = {
  course: {
    tier: 'course',
    label: 'Course check',
    blurb: 'At the level your instructor tests. Passing means this section is quiz-ready.',
    bands: [1, 2, 3],
    count: 5,
    pass: 4,
    stretch: false,
  },
  acs: {
    tier: 'acs',
    label: 'ACS check',
    blurb: 'At ACS final difficulty — harder than the course asks. Passing means exam-ready.',
    bands: [4, 5],
    // Six rather than five: at 5/pass-4 a single unlucky draw fails an otherwise solid section,
    // and the ACS band is where item-to-item variance is highest.
    count: 6,
    pass: 5,
    stretch: true,
  },
};

export const GATE_TIER_IDS = /** @type {GateTier[]} */ (Object.keys(GATE_TIERS));

export const gateSpec = (tier) => GATE_TIERS[tier] ?? null;

/** Does this template belong in that tier's gate? */
export function templateInTier(template, tier) {
  const spec = GATE_TIERS[tier];
  if (!spec || !template) return false;
  return spec.bands.includes(template.band);
}

/** Templates eligible for one section's gate at one tier. */
export function eligibleTemplates(templates, section, tier) {
  return (templates ?? []).filter((t) => t.section === section && templateInTier(t, tier));
}

/**
 * Can this gate actually be offered? A gate with fewer distinct templates than questions would
 * have to repeat one, which reads as a broken test rather than a hard one.
 *
 * Returned as a reason string rather than a bare false so the UI can say WHY a gate is missing -
 * "no ACS-level questions written yet" is useful; a greyed-out button is not.
 */
export function gateAvailability(templates, section, tier) {
  const spec = GATE_TIERS[tier];
  if (!spec) return { ready: false, have: 0, need: 0, reason: `unknown tier "${tier}"` };
  const have = eligibleTemplates(templates, section, tier).length;
  if (have === 0) {
    return { ready: false, have, need: spec.count, reason: `No ${spec.label.toLowerCase()} questions written for ${section} yet.` };
  }
  if (have < spec.count) {
    return { ready: false, have, need: spec.count, reason: `Only ${have} of ${spec.count} questions written for ${section} at this level.` };
  }
  return { ready: true, have, need: spec.count, reason: null };
}

/**
 * Grade an attempt. `correct` is a count, not a ratio, because the pass line is a count - turning
 * it into a ratio first and comparing against 0.8 silently changes the pass line when `count`
 * changes (5/pass-4 is 0.80, 6/pass-5 is 0.833).
 */
export function gradeGate(tier, correct, total) {
  const spec = GATE_TIERS[tier];
  if (!spec) return { passed: false, correct, total, pass: 0, score: 0 };
  const asked = total ?? spec.count;
  return {
    passed: correct >= spec.pass,
    correct,
    total: asked,
    pass: spec.pass,
    score: asked ? correct / asked : 0,
  };
}

/**
 * What a section's two gates say together. This is the line the UI shows, and it is deliberately
 * blunt about the middle case: passing the course gate while failing the ACS one is the NORMAL
 * state for most of the term, not a failure, but it must not read as "done".
 */
export function sectionReadiness(courseState, acsState) {
  const c = !!courseState?.passed;
  const a = !!acsState?.passed;
  if (c && a) return { level: 'exam-ready', label: 'Exam ready', detail: 'Passed at both course and ACS level.' };
  if (c && !a) return { level: 'quiz-ready', label: 'Quiz ready', detail: 'Solid for the course. Not yet at ACS final difficulty.' };
  if (!c && a) return { level: 'odd', label: 'ACS passed, course not', detail: 'Unusual — re-take the course check; the two draw on different templates.' };
  return { level: 'not-started', label: 'Not passed', detail: 'Start with the course check.' };
}
