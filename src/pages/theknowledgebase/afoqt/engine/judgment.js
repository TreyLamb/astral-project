// Situational Judgment: the scenario registry and its MOST/LEAST-effective question frame.
//
// PART 24 of docs/afoqt/HANDOFF.md. Engine work, never farmable (section 4) — this file is the
// registrar + validator + question builder that PART 25's DATA ROWS (and PART 25B's test suite)
// will be built against, the same relationship engine/analogy.js has to VA's PARTS 10-13. See
// "PART 24 design record" in HANDOFF.md for the decisions this file is built to; they are not
// repeated here except where the code needs them.
//
// WHY THIS IS NOT engine/facts.js OR engine/analogy.js WEARING A NEW LABEL. Every other AFOQT
// subtest has exactly one right answer per question, and a wrong option is either a computed
// error-mode (math) or a declared confusion (facts, analogies). SJT has neither: the AFPC
// directions are explicit that responses are "scored relative to the consensus judgment of a
// wide sample of experienced U.S. Air Force officers" — there is no arithmetic to be wrong at
// and no dictionary definition to confuse. A scenario's five actions are each an authored
// judgment call, and the SAME five actions answer TWO different questions (which is MOST
// effective, which is LEAST), never one. That is a genuinely different content shape, so it
// gets a genuinely different engine rather than a thin wrapper around an existing one.
//
// THE MOST/LEAST PAIRING REUSES THE SHEET MECHANISM, NOT A NEW ONE. The real subtest presents
// each situation as two consecutive numbered items — "9. Select the MOST EFFECTIVE action",
// "10. Select the LEAST EFFECTIVE action" — always about the same five actions. That is exactly
// the shape engine/generator.js's SHEET_BITS split was built for (one Block Counting pile serves
// several consecutive questions before the run moves to a fresh one): the HIGH bits of the seed
// pick the SITUATION and the LOW bit picks MOST-vs-LEAST. `scenarioTemplates` therefore registers
// ONE template per chapter+band (`sheet: true, sheetSpan: 2`), not two — a `-most` template and a
// `-least` template pulling from the same pool independently would have no way to guarantee they
// land on the same situation back to back, which is the one structural property that actually
// matters here. `buildDrill`'s existing sheet-rotation logic (advance the figure every
// `sheetSpan` questions) does the pairing for free; nothing in generator.js or templateAudit.js
// needed to change, and `seedForSample` already spreads a `sheet` template's high bits generically
// for any subtest, not just Table Reading.
//
// WHY EVERY SCENARIO ALWAYS FILLS THE SLATE EXACTLY. A math template can come up short on
// distractors and must over-supply candidates (see generator.js's `h.choices` doc). A scenario
// can't: it has exactly five actions, one is the answer, the other four are automatically the
// distractors — for BOTH questions the situation asks. There is no shortfall case to guard here,
// which is a real structural advantage over the fact-engine subtests.
//
// SCORING SIMPLIFICATION, DECLARED RATHER THAN HIDDEN. Barron's own directions note the official
// key sometimes accepts two answers on one item — consensus is a distribution, not a single
// truth. This engine models exactly one accepted MOST index and one accepted LEAST index per
// scenario; where a real source documents a genuine split verdict, PART 25's author picks the
// pedagogically clearer answer and records the tension in the row's `tell` rather than trying to
// teach the tool multiple correct indices. Same "declare the bound honestly" convention as
// `stemSpace` elsewhere in this codebase — a simplification that is written down, not a silent
// approximation.

import { registerTemplate } from './generator.js';

/** The six competencies AFPC's Form T pamphlet and Barron's practice test both name.
 *  See docs/afoqt/RESEARCH.md "Situational Judgment". Every scenario action tags one of these —
 *  it is what makes a miss report as "you picked the response that skipped the chain of command"
 *  rather than just "wrong", the same job `error`/`why` does on every other subtest's distractors. */
export const COMPETENCIES = [
  'integrity-professionalism',
  'leadership',
  'resource-management',
  'communication',
  'innovation',
  'mentoring',
];
const COMPETENCY_SET = new Set(COMPETENCIES);

/**
 * @typedef {Object} ScenarioAction
 * @property {string} text          the action as the candidate would read it, e.g. "Contact the
 *                                   previous section leader and ask for suggestions."
 * @property {string} competency    one of COMPETENCIES — which lens this action's soundness (or
 *                                   unsoundness) is judged through
 * @property {string} rationale     third-person, one or two sentences: WHY this action is more or
 *                                   less effective. Shown after a miss, same job `why` plays on
 *                                   every other subtest's distractors.
 */

/**
 * @typedef {Object} ScenarioRow
 * @property {string} id
 * @property {string} chapter        an sjt-0N-* chapter id from curriculum/chapters.js
 * @property {string[]} concepts     must be declared by that chapter — afoqt:coverage checks it
 * @property {1|2|3|4|5} band        how CONTESTED the judgment call is, not vocabulary or
 *                                   arithmetic difficulty — a scenario where competent officers
 *                                   would mostly agree is low-band; one where several actions have
 *                                   real merit and the distinction is genuinely fine is high-band
 * @property {string} situation      the scenario prose. Original writing — see the header comment
 *                                   in QUESTION-DOCTRINE.md and CLAUDE.md rule 2: this subtest's
 *                                   calibration source (Barron's) is a ruler, never a corpus.
 * @property {ScenarioAction[]} actions   exactly 5, in AFOQT's own A-E order
 * @property {number} mostEffective   index 0-4 into `actions`
 * @property {number} leastEffective  index 0-4 into `actions`, must differ from mostEffective
 * @property {string} tell            one sentence naming the judgment PRINCIPLE at stake — the
 *                                   thing a candidate should recognise next time, not a restated
 *                                   summary of this one scenario. Same job `tell` plays on a
 *                                   morphology.js pair or an analogy.js relation.
 * @property {object} [provenance]
 */

const SCENARIOS = new Map();

export function registerScenarios(rows) {
  for (const r of rows) {
    const at = `${r.id ?? '(no id)'}`;
    if (!r.id) throw new Error('scenario row needs an id');
    if (SCENARIOS.has(r.id)) throw new Error(`duplicate scenario id: ${r.id}`);
    if (!r.chapter) throw new Error(`${at}: needs a chapter`);
    if (!r.concepts?.length) throw new Error(`${at}: declares no concepts`);
    if (!(r.band >= 1 && r.band <= 5)) throw new Error(`${at}: band must be 1-5`);
    if (!r.situation || r.situation.trim().length < 40) {
      throw new Error(`${at}: situation must be real scenario prose, not a placeholder`);
    }
    if (!Array.isArray(r.actions) || r.actions.length !== 5) {
      throw new Error(`${at}: needs exactly 5 actions (AFOQT presents A-E)`);
    }
    r.actions.forEach((act, i) => {
      const label = `${at}: action ${i}`;
      if (!act?.text?.trim()) throw new Error(`${label}: needs text`);
      if (!COMPETENCY_SET.has(act.competency)) {
        throw new Error(`${label}: competency must be one of ${COMPETENCIES.join(', ')}`);
      }
      if (!act.rationale?.trim()) throw new Error(`${label}: needs a rationale`);
    });
    // Same-text actions would make h.choices silently dedupe the slate down to four options —
    // the exact failure mode flagged for wk-02-roots' `sense` field and va's pair rows.
    const seenText = new Set();
    for (const act of r.actions) {
      const k = act.text.trim().toLowerCase();
      if (seenText.has(k)) throw new Error(`${at}: two actions have the same text`);
      seenText.add(k);
    }
    if (!(r.mostEffective >= 0 && r.mostEffective <= 4)) {
      throw new Error(`${at}: mostEffective must index into actions (0-4)`);
    }
    if (!(r.leastEffective >= 0 && r.leastEffective <= 4)) {
      throw new Error(`${at}: leastEffective must index into actions (0-4)`);
    }
    if (r.mostEffective === r.leastEffective) {
      throw new Error(`${at}: mostEffective and leastEffective must be different actions`);
    }
    if (!r.tell?.trim()) throw new Error(`${at}: needs a tell - the judgment principle at stake`);

    SCENARIOS.set(r.id, r);
  }
  return rows;
}

// sjt-01-method ('sjt-judgment-format', 'sjt-competency-lens') has no scenarios of its own -
// there is no such thing as a scenario that ONLY tests "the MOST/LEAST format." Every scenario
// this engine ever generates exercises both skills simply by being a two-question situational
// item, the same way every VA format-2 item exercises va-relation-format without a template
// written specifically for it (see engine/analogy.js) and every RC item exercises rc-time-
// management without a dedicated quiz (see engine/passage.js). scenarioTemplates() tags both
// onto every template it builds, in addition to whatever concepts the scenarios themselves
// declare - which is what clears them off the afoqt:coverage orphan list without inventing a
// bogus "name the format" quiz.
const METHOD_CONCEPTS = ['sjt-judgment-format', 'sjt-competency-lens'];

export const allScenarios = () => [...SCENARIOS.values()];
export const scenariosFor = (chapter, band = null) =>
  allScenarios().filter((s) => s.chapter === chapter && (band == null || s.band === band));
export function _resetScenarios() { SCENARIOS.clear(); }

/**
 * Register the one template for a chapter+band. A chapter+band with fewer than 5 situations
 * produces nothing — same "declared bound, not a silent thin item space" rule every other
 * subtest's *Templates() builder follows.
 *
 * `sheet: true, sheetSpan: 2` is the whole mechanism: `h.sheetSeed` (the high bits of the seed,
 * held fixed for 2 consecutive draws by buildDrill) selects WHICH situation, and `h.item & 1`
 * (the low bit, which flips every draw) selects MOST vs LEAST for that situation. A drill built
 * from this template therefore always asks MOST-then-LEAST for one situation before moving to
 * the next, matching the real subtest's own numbering, with no change needed anywhere else in
 * the engine.
 */
/**
 * Register ONE template pooling every scenario at a band, ACROSS chapters.
 *
 * Why this has to exist. `scenarioTemplates()` builds per chapter+band and refuses a pool under
 * five, which is the right rule on its own - but SJT's rows are spread thin across six chapters,
 * and the arithmetic quietly stranded most of the subtest. Measured 2026-09-04, AFTER an
 * authoring pass added 18 scenarios:
 *
 *     band 2   2 per chapter x 5 chapters  = 10 rows, and NOT ONE reached a template
 *     band 3   6 per chapter x 6 chapters  = 36 rows, all live
 *     band 4   3 per chapter (2 in ch06)   = 17 rows, and NOT ONE reached a template
 *
 * So 27 of 63 authored scenarios - 43% of the subtest, including rows that predate this session -
 * validated, registered, and then never appeared in a single drill. Nothing failed. `registerScenarios`
 * accepted them, `afoqt:coverage` held, 4,476 tests passed, and the content was simply inert.
 * Chapter+band was the wrong grouping for a subtest this wide and this shallow.
 *
 * Pooling across chapters is the same move `wordTemplates` vs `methodTemplates` already makes in
 * engine/words.js: a chapter-scoped frame where the chapter is the point, and a band-scoped one
 * where the band is. Unlike words.js's method frames, this one DOES claim the rows' own concepts
 * as well as the method concepts - the scenario is unchanged by being asked here, so its judgment
 * principle is genuinely what is being tested.
 */
export function pooledScenarioTemplates({ band, idBase, name, calibratedAgainst = 'barrons' }) {
  const rows = allScenarios().filter((s) => s.band === band);
  if (rows.length < 5) return [];
  return [buildJudgeTemplate({ rows, band, idBase, name, calibratedAgainst })];
}

export function scenarioTemplates({ chapter, band, idBase, name, calibratedAgainst = 'barrons' }) {
  const rows = scenariosFor(chapter, band);
  if (rows.length < 5) return [];
  return [buildJudgeTemplate({ rows, band, idBase, name, calibratedAgainst })];
}

/** The template body itself, shared by the chapter-scoped and band-pooled builders above. */
function buildJudgeTemplate({ rows, band, idBase, name, calibratedAgainst }) {
  return registerTemplate({
    id: `${idBase}-judge`,
    subtest: 'SJ',
    band,
    name,
    concepts: [...new Set([...rows.flatMap((r) => r.concepts), ...METHOD_CONCEPTS])],
    calibratedAgainst,
    sheet: true,
    sheetSpan: 2,
    stemSpace: rows.length,
    generate: (rng, h) => {
      const situation = rows[h.sheetSeed % rows.length];
      const wantLeast = (h.item & 1) === 1;
      const targetIndex = wantLeast ? situation.leastEffective : situation.mostEffective;
      const correctAction = situation.actions[targetIndex];

      const distractors = situation.actions
        .map((act, i) => ({ act, i }))
        .filter(({ i }) => i !== targetIndex)
        .map(({ act }) => ({ value: act.text, error: act.competency, why: act.rationale }));

      const { choices, correctIndex, errors, whys } = h.choices(correctAction.text, distractors);
      const label = wantLeast ? 'LEAST' : 'MOST';
      return {
        stem: `${situation.situation}\n\nSelect the ${label} EFFECTIVE action (A-E) in response to the situation.`,
        choices, correctIndex, errors, whys,
        tags: ['sjt', wantLeast ? 'least-effective' : 'most-effective', ...situation.concepts],
        explanation: `${situation.tell} ${correctAction.rationale}`,
      };
    },
  });
}
