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

// rc-01-method ('rc-time-management', 'rc-reading-strategy') has no question TYPE of its own -
// there is no such thing as a "time management question". Every RC item exercises both skills
// simply by being a timed passage-and-question, the same way every VA format-2 item exercises
// va-relation-format without a template written specifically for it (see engine/analogy.js and
// PART 9's design record in docs/afoqt/HANDOFF.md). So passageTemplates() tags both onto every
// template it builds, in addition to whatever concepts the caller asked for - which is what
// clears them off the afoqt:coverage orphan list without inventing a bogus "method quiz".
const METHOD_CONCEPTS = ['rc-time-management', 'rc-reading-strategy'];

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
    if (typeof p.lineNumbered !== 'boolean') {
      throw new Error(`Passage ${p.id} lineNumbered must be a boolean`);
    }
    // Every real AFOQT RC item that names a line ("As used in line 12...") depends on the
    // printed passage actually carrying that numbering. render/PassageView.jsx numbers by
    // splitting `text` on '\n', so an unbroken paragraph would either fail to number at all
    // or number as one giant "line 1" - both silently wrong in a way afoqt:selftest cannot see.
    if (p.lineNumbered && !p.text.includes('\n')) {
      throw new Error(`Passage ${p.id} is lineNumbered but text has no '\\n' line breaks to number`);
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
 * Builds and registers ONE template for a specific chapter and band, drawn from the provided
 * passages. (The header comment used to say "a template is created for EACH question type" -
 * that was never what the code did; it registers exactly one template per call, covering every
 * type named in `concepts`. Call it once per (chapter, band) the way ch02-structure.js calls
 * relationTemplates once per (chapter, band) in VA.)
 *
 * PASSAGE SELECTION IS SHEET-AWARE - this is the fix for the PART 14 review's defect #1.
 * The real subtest bundles 4-6 questions under one printed passage; the first version of this
 * function ignored that and drew an independent random passage per question, so an 8-question
 * drill could show four different passages. `sheet: true` on the registered template plus the
 * SHEET_BITS split in engine/generator.js already solves this for Table Reading and Block
 * Counting: the high bits of the seed pick a FIGURE and stay fixed for `sheetSpan` questions in
 * a row, the low bits pick which item on it. Here the figure is a specific passage:
 *
 *   1. `h.sheetSeed % bandPassages.length` deterministically names ONE passage for this run's
 *      current sheet - every template of every concept in the pool computes the same index from
 *      the same sheetSeed, so a main-idea question and a vocabulary question minted moments
 *      apart in the same drill land on the same passage without coordinating.
 *   2. `h.item` (not a random pick) selects which eligible question on THAT passage to ask, so
 *      two questions sharing a sheet never collide on the same stem.
 *   3. `render.sheetSeed` is set to the passage's own `id` (a string), not the numeric seed bits -
 *      engine/drill.js's `groupByFigure` keys on this field to keep a shared figure's questions
 *      contiguous in the shuffled queue, and a string id can't collide the way two unrelated
 *      bands' numeric sheet values coincidentally could.
 *
 * FALLBACK: a template is band-locked (doctrine: iterate at the same difficulty, never vary it
 * per instance), but two different concepts at the same band can be mid-run on the SAME sheet
 * while the sheet's chosen passage happens not to carry a question of one concept's type at all -
 * every passage need not cover every one of the 5 types. When that happens the sheet passage is
 * not abandoned for the whole subtest, just for this one instance: it falls back to any eligible
 * question in the band and reports its OWN passage's id as the sheetSeed, so it simply starts (or
 * joins) a different figure group rather than silently mislabelling itself as the sheet passage
 * it did not actually draw from. Keep this rare by writing every passage with a mix of question
 * types (see PART 15/16 in HANDOFF.md) - the fallback is a safety net, not the intended path.
 *
 * @param {Object} opts
 * @param {string} opts.chapter - e.g. 'rc-02-main-idea'
 * @param {number} opts.band - e.g. 3
 * @param {string} opts.idBase - e.g. 'rc-main-idea-b3'
 * @param {string} opts.name - template display name
 * @param {string[]} opts.concepts - concepts this template claims to test (question-type ones;
 *   METHOD_CONCEPTS are added automatically, see above - do not pass them in yourself)
 * @param {RcPassage[]} opts.passages - the subset of passages available to draw from
 * @param {number} [opts.sheetSpan] - questions one passage is good for before the run advances
 *   to another; defaults to 5, the middle of the real subtest's "4-6 questions per passage"
 */
export function passageTemplates({ chapter, band, idBase, name, concepts, passages, sheetSpan = 5 }) {
  if (passages.length === 0) return []; // nothing to build

  const bandPassages = passages.filter((p) => p.band === band);
  if (bandPassages.length === 0) return [];

  // Collect all questions of the relevant concepts from the given passages.
  // A question is relevant if TYPE_TO_CONCEPT[q.type] is in `concepts`.
  const eligibleItems = [];
  for (const p of bandPassages) {
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
  const registeredConcepts = [...new Set([...concepts, ...METHOD_CONCEPTS])];
  registerTemplate({
    id: templateId,
    subtest: 'RC',
    band,
    name,
    concepts: registeredConcepts,
    stemSpace: eligibleItems.length,
    sheet: true,
    sheetSpan,
    generate: (rng, h) => {
      // Step 1: which passage is "on screen" for this run right now.
      const sheetPassage = bandPassages[h.sheetSeed % bandPassages.length];
      const inSheetPassage = sheetPassage.questions
        .map((q, i) => ({ passage: sheetPassage, question: q, index: i }))
        .filter((it) => concepts.includes(TYPE_TO_CONCEPT[it.question.type]));

      // Step 2: pick a question on it, walking the item index so a multi-question span on one
      // passage never repeats a stem. Fall back to any eligible question in the band if this
      // particular passage has none of the type this template needs (see doc comment above).
      const item = inSheetPassage.length > 0
        ? inSheetPassage[h.item % inSheetPassage.length]
        : eligibleItems[h.item % eligibleItems.length];

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
          passageId: item.passage.id,
          sheetSeed: item.passage.id,
        }
      };
    }
  });

  return [templateId];
}
