// The Trivia API (v2) adapter. Keyless public API — no auth needed.
// https://the-trivia-api.com/docs/v2/

const API_URL = 'https://the-trivia-api.com/v2/questions';
const MAX_PER_CALL = 50;

const DIFFICULTY_MAP = { easy: 'basic', medium: 'intermediate', hard: 'advanced' };

function prettifySubject(slug) {
  return slug
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function prettifyTag(tag) {
  return tag.toLowerCase().replace(/_/g, '-');
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchOne(count) {
  const url = `${API_URL}?limit=${count}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn('[triviaApiAdapter] network error', err);
    return [];
  }
  if (!res.ok) {
    console.warn('[triviaApiAdapter] HTTP error', res.status);
    return [];
  }
  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.warn('[triviaApiAdapter] bad JSON', err);
    return [];
  }
  if (!Array.isArray(data)) return [];

  return data.map(r => {
    // The Trivia API's own source data occasionally has trailing/leading
    // whitespace on answer strings (e.g. "Dublin " with a trailing space) —
    // trim defensively so it doesn't leak into display or dedup.
    const correctAnswer = r.correctAnswer.trim();
    const choices = shuffleInPlace([correctAnswer, ...r.incorrectAnswers.map(a => a.trim())]);
    return {
      question: r.question.text.trim(),
      choices,
      answer: correctAnswer,
      subject: prettifySubject(r.category),
      difficulty: DIFFICULTY_MAP[r.difficulty] ?? 'basic',
      tags: (r.tags ?? []).map(prettifyTag),
      source: 'trivia_api',
      status: 'draft',
    };
  });
}

export const name = 'trivia_api';

/**
 * @param {number} count
 * @returns {Promise<import('../tkbAdapters').RawAdapterQuestion[]>}
 */
export async function fetchBatch(count) {
  const results = [];
  let remaining = count;
  while (remaining > 0) {
    const batchSize = Math.min(remaining, MAX_PER_CALL);
    const batch = await fetchOne(batchSize); // sequential by design, API has no offset/cursor param
    results.push(...batch);
    if (batch.length === 0) break;
    remaining -= batchSize;
  }
  return results;
}

export default { name, fetchBatch };
