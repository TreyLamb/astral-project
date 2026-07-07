// Stub adapter interface for future question sources (Open Trivia DB, The
// Trivia API, MMLU, etc.). Phase 1 defines the shape and one mock adapter —
// no network calls. New sources plug in later by implementing `fetch()` and
// running results through `normalize()`.

/**
 * @typedef {Object} RawAdapterQuestion
 * @property {string} question
 * @property {string[]} choices
 * @property {string} answer
 * @property {string} subject
 * @property {'basic'|'intermediate'|'advanced'} difficulty
 * @property {string[]} tags
 * @property {string} source
 * @property {'draft'} status
 */

/**
 * @typedef {Object} TkbAdapter
 * @property {string} name
 * @property {() => Promise<RawAdapterQuestion[]>} fetch
 */

/** @type {TkbAdapter} */
export const mockAdapter = {
  name: 'mock_adapter',
  async fetch() {
    return [
      {
        question: 'What is the boiling point of water at sea level (°C)?',
        choices: ['90', '100', '110', '120'],
        answer: '100',
        subject: 'Chemistry',
        difficulty: 'basic',
        tags: ['fact', 'science'],
        source: 'mock_adapter',
        status: 'draft',
      },
      {
        question: 'How many continents are there?',
        choices: ['5', '6', '7', '8'],
        answer: '7',
        subject: 'World Geography',
        difficulty: 'basic',
        tags: ['geography', 'count'],
        source: 'mock_adapter',
        status: 'draft',
      },
    ];
  },
};

/**
 * Converts a RawAdapterQuestion into TKB's internal Question shape
 * (minus id/createdAt/stats, which the storage layer fills in on add).
 * @param {RawAdapterQuestion} raw
 * @param {string} subjectId
 */
export function normalize(raw, subjectId) {
  return {
    question: raw.question,
    answer: raw.answer,
    answerAlternates: [],
    subjectId,
    subtopicId: null,
    difficulty: raw.difficulty ?? 'basic',
    pipeline: 'main_recall',
    styleTags: raw.tags ?? [],
    sourceNote: `Adapter: ${raw.source}`,
    source: 'mock_adapter',
    status: 'draft',
    flagged: false,
  };
}

export const ADAPTERS = [mockAdapter];
