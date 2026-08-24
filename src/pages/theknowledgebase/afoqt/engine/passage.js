import { registerTemplate } from './generator.js';

/**
 * @typedef {Object} RcQuestion
 * @property {'main-idea'|'vocabulary-in-context'|'detail-inference'|'function-of-paragraph'|'author-agreement'} type
 * @property {string} stem
 * @property {string[]} choices - exactly 5 choices
 * @property {number} correctIndex - 0-4
 * @property {string} why - explanation
 */

/**
 * @typedef {Object} RcPassage
 * @property {string} id - unique across bank
 * @property {number} wordCount - must be between 400-600
 * @property {boolean} lineNumbered
 * @property {string} text
 * @property {1|2|3|4|5} band - difficulty 1-5
 * @property {RcQuestion[]} questions
 */

const PASSAGES = new Map();
const VALID_QUESTION_TYPES = new Set([
  'main-idea',
  'vocabulary-in-context',
  'detail-inference',
  'function-of-paragraph',
  'author-agreement',
]);

const TYPE_TO_CONCEPT = {
  'main-idea': 'rc-main-idea',
  'vocabulary-in-context': 'rc-vocabulary-in-context',
  'detail-inference': 'rc-detail-inference',
  'function-of-paragraph': 'rc-function-of-paragraph',
  'author-agreement': 'rc-author-agreement',
};

let _nextInternalId = 0;

/**
 * Used for testing to reset the registry.
 */
export function _resetPassages() {
  PASSAGES.clear();
  _nextInternalId = 0;
}

/**
 * Registers passages into the bank. Throws on validation failure.
 * @param {RcPassage[]} passages
 */
export function registerPassages(passages) {
  for (const p of passages) {
    if (!p.id) throw new Error(`Passage missing id`);
    if (PASSAGES.has(p.id)) throw new Error(`Duplicate passage id: ${p.id}`);
    if (typeof p.wordCount !== 'number' || p.wordCount < 400 || p.wordCount > 600) {
      throw new Error(`Passage ${p.id} wordCount must be 400-600`);
    }
    if (typeof p.band !== 'number' || p.band < 1 || p.band > 5) {
      throw new Error(`Passage ${p.id} band must be 1-5`);
    }
    if (!p.text || typeof p.text !== 'string') {
      throw new Error(`Passage ${p.id} text is missing or invalid`);
    }
    if (!Array.isArray(p.questions) || p.questions.length === 0) {
      throw new Error(`Passage ${p.id} must have questions`);
    }

    const seenStems = new Set();
    for (let i = 0; i < p.questions.length; i++) {
      const q = p.questions[i];
      if (!VALID_QUESTION_TYPES.has(q.type)) {
        throw new Error(`Passage ${p.id} question ${i} has invalid type: ${q.type}`);
      }
      if (!q.stem) throw new Error(`Passage ${p.id} question ${i} missing stem`);
      if (seenStems.has(q.stem)) throw new Error(`Passage ${p.id} duplicate stem: ${q.stem}`);
      seenStems.add(q.stem);

      if (!Array.isArray(q.choices) || q.choices.length !== 5) {
        throw new Error(`Passage ${p.id} question ${i} must have exactly 5 choices`);
      }
      const uniqueChoices = new Set(q.choices);
      if (uniqueChoices.size !== 5) {
        throw new Error(`Passage ${p.id} question ${i} has duplicate choices`);
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 4) {
        throw new Error(`Passage ${p.id} question ${i} correctIndex out of range`);
      }
      if (!q.why) throw new Error(`Passage ${p.id} question ${i} missing why explanation`);
    }

    PASSAGES.set(p.id, p);
  }
}

export function allPassages() {
  return Array.from(PASSAGES.values());
}

/**
 * Builds and registers templates for a specific chapter and band, drawn from the provided passages.
 * A template is created for EACH question type found in the given passages that belongs to the chapter.
 * 
 * In a real test, questions are bundled to the passage, but templates are isolated units of testing.
 * So the generator will randomly pick a passage that has a question of the needed type,
 * then render the passage text and the question.
 *
 * @param {Object} opts
 * @param {string} opts.chapter - e.g. 'rc-02-main-idea'
 * @param {number} opts.band - e.g. 3
 * @param {string} opts.idBase - e.g. 'rc-main-idea-b3'
 * @param {string} opts.name - template display name
 * @param {string[]} opts.concepts - concepts this template claims to test
 * @param {RcPassage[]} opts.passages - the subset of passages available to draw from
 */
export function passageTemplates({ chapter, band, idBase, name, concepts, passages }) {
  if (passages.length === 0) return []; // nothing to build

  // Collect all questions of the relevant concepts from the given passages.
  // A question is relevant if TYPE_TO_CONCEPT[q.type] is in `concepts`.
  const eligibleItems = [];
  for (const p of passages) {
    if (p.band !== band) continue;
    
    for (let i = 0; i < p.questions.length; i++) {
      const q = p.questions[i];
      const conceptForType = TYPE_TO_CONCEPT[q.type];
      if (concepts.includes(conceptForType)) {
        eligibleItems.push({ passage: p, question: q, index: i });
      }
    }
  }

  // Engine floor check: A template needs a minimum pool of questions to be viable for random generation.
  // We'll require at least 5 eligible questions across the passages to register the template.
  if (eligibleItems.length < 5) return [];

  const templateId = idBase;
  registerTemplate({
    id: templateId,
    subtest: 'RC',
    band,
    name,
    concepts,
    stemSpace: eligibleItems.length,
    generate: (rng, h) => {
      // Pick a random eligible question
      const item = h.pick(eligibleItems);
      
      // Shuffle the choices, keeping track of the correct answer
      const { choices, correctIndex } = h.choices(
        item.question.choices[item.question.correctIndex],
        item.question.choices.filter((_, i) => i !== item.question.correctIndex)
      );

      return {
        stem: item.question.stem,
        choices,
        correctIndex,
        explanation: item.question.why,
        render: {
          kind: 'passage',
          text: item.passage.text,
          lineNumbered: item.passage.lineNumbered,
          passageId: item.passage.id
        }
      };
    }
  });

  return [templateId];
}
