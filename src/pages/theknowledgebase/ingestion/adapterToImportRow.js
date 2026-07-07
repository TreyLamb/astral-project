// Converts a RawAdapterQuestion (see tkbAdapters.js) into the snake_case
// shape TkbStorage.importQuestions expects (matches
// notes-to-questions-prompt.md format). Pure, no network.

/**
 * @param {import('../tkbAdapters').RawAdapterQuestion} raw
 */
export function adapterRowToImportRow(raw) {
  return {
    question: raw.question,
    answer: raw.answer,
    answer_alternates: [],
    subject: raw.subject,
    subtopic: null,
    difficulty: raw.difficulty,
    pipeline: 'main_recall',
    style_tags: raw.tags,
    source_note: `Imported from ${raw.source}`,
  };
}
