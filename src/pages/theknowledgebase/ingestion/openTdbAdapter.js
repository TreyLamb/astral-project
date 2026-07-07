// Open Trivia DB adapter. Keyless public API — no auth needed.
// https://opentdb.com/api_config.php

const API_URL = 'https://opentdb.com/api.php';
const MAX_PER_CALL = 50;

const HTML_ENTITIES = {
  '&quot;': '"',
  '&#039;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&hellip;': '…',
  '&eacute;': 'é',
  '&uuml;': 'ü',
  '&ouml;': 'ö',
  '&auml;': 'ä',
  '&ntilde;': 'ñ',
  '&nbsp;': ' ',
};

function decodeHtmlEntities(str) {
  return str.replace(/&[a-zA-Z#0-9]+;/g, entity => HTML_ENTITIES[entity] ?? entity);
}

const DIFFICULTY_MAP = { easy: 'basic', medium: 'intermediate', hard: 'advanced' };

function shuffleInPlace(arr) {
  // Not required for correctness (shuffling is a UI concern), but avoids
  // correct answer always landing in the same slot when eyeballing samples.
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchOne(count) {
  const url = `${API_URL}?amount=${count}&type=multiple`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn('[openTdbAdapter] network error', err);
    return [];
  }
  if (!res.ok) {
    console.warn('[openTdbAdapter] HTTP error', res.status);
    return [];
  }
  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.warn('[openTdbAdapter] bad JSON', err);
    return [];
  }
  if (data.response_code !== 0 || !Array.isArray(data.results)) {
    return [];
  }
  return data.results.map(r => {
    const question = decodeHtmlEntities(r.question).trim();
    const answer = decodeHtmlEntities(r.correct_answer).trim();
    const choices = shuffleInPlace([
      answer,
      ...r.incorrect_answers.map(a => decodeHtmlEntities(a).trim()),
    ]);
    return {
      question,
      choices,
      answer,
      subject: r.category,
      difficulty: DIFFICULTY_MAP[r.difficulty] ?? 'basic',
      tags: ['trivia'],
      source: 'opentdb',
      status: 'draft',
    };
  });
}

export const name = 'opentdb';

/**
 * @param {number} count
 * @returns {Promise<import('../tkbAdapters').RawAdapterQuestion[]>}
 */
export async function fetchBatch(count) {
  const results = [];
  let remaining = count;
  while (remaining > 0) {
    const batchSize = Math.min(remaining, MAX_PER_CALL);
    const batch = await fetchOne(batchSize); // sequential by design, API has no batch/offset param
    results.push(...batch);
    if (batch.length === 0) break; // avoid infinite loop on repeated no-result responses
    remaining -= batchSize;
  }
  return results;
}

export default { name, fetchBatch };
