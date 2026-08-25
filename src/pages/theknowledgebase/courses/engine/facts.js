// Tier 2 (in-app, zero-AI) generation for vocab-heavy courses. Adapted from
// afoqt/engine/facts.js's term+gloss+confusions data model — same idea (a
// fact names what it's genuinely confused with, so a wrong answer is a named
// mistake, never noise), but the OUTPUT shape is different on purpose: TKB
// questions are open-recall flashcards (question/answer), not multiple
// choice, so there are no distractor choices to build — "confusions" instead
// becomes a note on the card ("commonly confused with: X").
//
// Output rows match the exact shape TkbStorage.importQuestions accepts (the
// notesToQuestionsPrompt.md schema), same as promptBuilder's Tier-3 output —
// so ImportGenerated.jsx previews and commits both tiers identically.

/**
 * @typedef {Object} FactRow
 * @property {string} id
 * @property {string} term
 * @property {string} gloss
 * @property {string[]} tags
 * @property {'basic'|'intermediate'|'advanced'} [difficulty]
 * @property {string[]} [confusions] - ids of other rows in the SAME array genuinely confused with this one
 * @property {string} [recallStem] - a question `term` answers; omit if the gloss fits more than one term
 */

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * @param {import('../coursesStorage').Course} course
 * @param {FactRow[]} factRows
 * @returns {Array<Object>} rows shaped for TkbStorage.importQuestions
 */
export function generateFactQuestions(course, factRows) {
  const byId = new Map(factRows.map((f) => [f.id, f]));
  const rows = [];

  for (const f of factRows) {
    const confusedWith = (f.confusions ?? []).map((id) => byId.get(id)?.term).filter(Boolean);
    const sourceNote = confusedWith.length
      ? `Courses fact engine (generated, zero-AI) — commonly confused with: ${confusedWith.join(', ')}.`
      : 'Courses fact engine (generated, zero-AI).';
    const base = {
      subject: course.code,
      subtopic: f.tags?.[0] ?? '',
      difficulty: f.difficulty ?? 'basic',
      pipeline: 'main_recall',
      style_tags: f.tags ?? [],
      source_note: sourceNote,
    };

    rows.push({
      ...base,
      question: `What does "${cap(f.term.trim())}" mean?`,
      answer: f.gloss,
      answer_alternates: [],
    });

    if (f.recallStem) {
      rows.push({
        ...base,
        question: f.recallStem,
        answer: cap(f.term.trim()),
        answer_alternates: [],
      });
    }
  }

  return rows;
}

// The "prove the reuse path end-to-end" example set, per the Courses
// architecture plan — a handful of MICR 2060 terms, not a full content
// build-out (that happens per-course as Trey enters real material).
export const EXAMPLE_MICR_FACTS = [
  {
    id: 'obligate-aerobe', tags: ['microbial-metabolism'], difficulty: 'basic',
    term: 'obligate aerobe',
    gloss: 'an organism that requires oxygen to survive and grow',
    recallStem: 'What term describes an organism that requires oxygen to survive and grow?',
    confusions: ['obligate-anaerobe', 'facultative-anaerobe'],
  },
  {
    id: 'obligate-anaerobe', tags: ['microbial-metabolism'], difficulty: 'basic',
    term: 'obligate anaerobe',
    gloss: 'an organism that is killed by the presence of oxygen',
    recallStem: 'What term describes an organism that is killed by the presence of oxygen?',
    confusions: ['obligate-aerobe', 'facultative-anaerobe'],
  },
  {
    id: 'facultative-anaerobe', tags: ['microbial-metabolism'], difficulty: 'intermediate',
    term: 'facultative anaerobe',
    gloss: 'an organism that can grow with or without oxygen, preferring oxygen when available',
    recallStem: 'What term describes an organism that can grow with or without oxygen?',
    confusions: ['obligate-aerobe', 'obligate-anaerobe'],
  },
  {
    id: 'gram-positive', tags: ['gram-staining'], difficulty: 'basic',
    term: 'Gram-positive',
    gloss: 'a bacterium with a thick peptidoglycan cell wall that retains crystal violet stain, appearing purple',
    recallStem: 'What term describes a bacterium whose thick peptidoglycan wall retains crystal violet stain and appears purple?',
    confusions: ['gram-negative'],
  },
  {
    id: 'gram-negative', tags: ['gram-staining'], difficulty: 'basic',
    term: 'Gram-negative',
    gloss: 'a bacterium with a thin peptidoglycan wall that does not retain crystal violet, appearing pink/red after counterstain',
    recallStem: 'What term describes a bacterium whose thin wall does not retain crystal violet and appears pink after counterstain?',
    confusions: ['gram-positive'],
  },
  {
    id: 'endospore', tags: ['bacterial-survival'], difficulty: 'intermediate',
    term: 'endospore',
    gloss: 'a dormant, highly resistant structure some bacteria form to survive harsh conditions',
    recallStem: 'What term describes the dormant, highly resistant structure some bacteria form to survive harsh conditions?',
  },
];
