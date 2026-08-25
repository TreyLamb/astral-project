// Tier 2 (in-app, zero-AI) generation for numeric/procedural problems.
// Adapted from afoqt/engine/generator.js's registerTemplate contract — same
// idea (a template is a pure, seeded function; (templateId, seed) regenerates
// a question byte-identically; same-difficulty iteration by varying the
// numbers, never the concept — see QUESTION-DOCTRINE.md) — but simplified for
// TKB's open-recall Question shape: no multiple-choice slate/collision-guard
// machinery is needed since there's no distractor list to keep distinct.
//
// Output rows match the exact shape TkbStorage.importQuestions accepts, same
// as facts.js and promptBuilder — all three tiers preview/commit identically
// in ImportGenerated.jsx.

import { mulberry32, randInt } from '../../engine/rng.js';

const REGISTRY = new Map();

/**
 * @typedef {Object} CourseTemplate
 * @property {string} id
 * @property {string} courseCode
 * @property {'basic'|'intermediate'|'advanced'} difficulty
 * @property {string[]} tags
 * @property {(rng: () => number, h: {randInt: (min:number,max:number)=>number}) => {question: string, answer: string, answer_alternates?: string[]}} generate
 */

/** @param {CourseTemplate} t */
export function registerCourseTemplate(t) {
  if (REGISTRY.has(t.id)) throw new Error(`duplicate course template id: ${t.id}`);
  REGISTRY.set(t.id, t);
  return t;
}

export const courseTemplatesFor = (courseCode) => [...REGISTRY.values()].filter((t) => t.courseCode === courseCode);
export const allCourseTemplates = () => [...REGISTRY.values()];

/**
 * @param {string} templateId
 * @param {number} seed
 * @returns {Object} a row shaped for TkbStorage.importQuestions
 */
export function generateFromTemplate(templateId, seed) {
  const t = REGISTRY.get(templateId);
  if (!t) throw new Error(`unknown course template: ${templateId}`);
  const rng = mulberry32(seed);
  const h = { randInt: (min, max) => randInt(rng, min, max) };
  const { question, answer, answer_alternates = [] } = t.generate(rng, h);
  return {
    question, answer, answer_alternates,
    subject: t.courseCode,
    subtopic: t.tags?.[0] ?? '',
    difficulty: t.difficulty,
    pipeline: 'main_recall',
    style_tags: t.tags ?? [],
    source_note: `Courses generator engine (seeded template "${templateId}", zero-AI) — same-difficulty iteration.`,
  };
}

/**
 * @param {string} templateId
 * @param {number} count
 * @param {number} [startSeed]
 * @returns {Object[]}
 */
export function generateBatch(templateId, count, startSeed = 1) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(generateFromTemplate(templateId, startSeed + i));
  return out;
}

export function _resetCourseTemplates() { REGISTRY.clear(); }

// The "prove the reuse path end-to-end" example template, per the Courses
// architecture plan — one worked CHEM 1210 problem, not a full content
// build-out. Same-difficulty iteration: only the numbers move, molarity is
// always a clean division (moles chosen in tenths, volume in tenths), so no
// sweep()-style collision guard is needed here — there's no distractor slate.
registerCourseTemplate({
  id: 'chem1210-molarity',
  courseCode: 'CHEM 1210',
  difficulty: 'intermediate',
  tags: ['molarity', 'solutions'],
  generate: (rng, h) => {
    const molesTenths = h.randInt(1, 8); // 0.1–0.8 mol
    const volumeTenths = h.randInt(2, 20); // 0.2–2.0 L
    const moles = molesTenths / 10;
    const volumeL = volumeTenths / 10;
    const molarity = +(moles / volumeL).toFixed(2);
    return {
      question: `A solution contains ${moles} mol of solute dissolved in ${volumeL} L of solution. What is its molarity?`,
      answer: `${molarity} M`,
      answer_alternates: [`${molarity}`],
    };
  },
});
