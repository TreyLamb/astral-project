// MMLU (Massive Multitask Language Understanding) adapter. Free bulk research
// dataset served via HuggingFace's datasets-server — no API key, no auth.
// https://datasets-server.huggingface.co/rows?dataset=cais/mmlu&config=all&split=test

const API_URL = 'https://datasets-server.huggingface.co/rows';
const DATASET = 'cais/mmlu';
const CONFIG = 'all';
const SPLIT = 'test';
const PAGE_SIZE = 100;
// Verified live (2026-07-06): config=all rows are clustered in contiguous
// blocks per subject, NOT interleaved, and NOT alphabetically ordered in a
// way that puts common subjects early - e.g. high_school_biology/chemistry/
// mathematics and elementary_mathematics were only found starting at row
// ~2800-3000 (page ~28-30) of the ~14042-row dataset; a 20-page (2000-row)
// cap returned 0 results for 5 of 8 real subjects tested. Raised to cover
// the full dataset (141 pages) so a subjectFilter fetch can always find its
// target subject, at the cost of a slower worst-case scan (a few minutes)
// for a subject that happens to sit late in the file.
const MAX_FILTER_PAGES = 145;

const ACRONYMS = new Set(['us', 'eu', 'hiv', 'ai']);

/**
 * Prettifies a snake_case MMLU subject slug into a readable title.
 * e.g. "high_school_biology" -> "High School Biology"
 *      "us_foreign_policy" -> "US Foreign Policy"
 * @param {string} slug
 */
export function prettifySubject(slug) {
  return slug
    .split('_')
    .map(word => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/**
 * Difficulty heuristic based on subject slug prefix (MMLU has no explicit
 * difficulty field). high_school_* -> basic; college_* or *elementary* ->
 * intermediate; everything else (professional_*, graduate-level topics with
 * no clear prefix) -> advanced.
 * @param {string} subjectSlug
 * @returns {'basic'|'intermediate'|'advanced'}
 */
export function mmluDifficultyForSubject(subjectSlug) {
  if (subjectSlug.startsWith('high_school_')) return 'basic';
  if (subjectSlug.startsWith('college_') || subjectSlug.includes('elementary')) return 'intermediate';
  return 'advanced';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(offset, length, retriesLeft = 8) {
  const url = `${API_URL}?dataset=${DATASET}&config=${CONFIG}&split=${SPLIT}&offset=${offset}&length=${length}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn('[mmluAdapter] network error', err);
    return null;
  }
  if ((res.status === 429 || res.status === 502 || res.status === 503) && retriesLeft > 0) {
    const attempt = 9 - retriesLeft;
    await sleep(Math.min(1500 * 2 ** attempt, 20000));
    return fetchPage(offset, length, retriesLeft - 1);
  }
  if (!res.ok) {
    console.warn('[mmluAdapter] HTTP error', res.status);
    return null;
  }
  try {
    return await res.json();
  } catch (err) {
    console.warn('[mmluAdapter] bad JSON', err);
    return null;
  }
}

function toRawQuestion(row) {
  const { question, subject, choices, answer } = row;
  const answerText = choices[answer];
  const inlined = `${question}\n(A) ${choices[0]}  (B) ${choices[1]}  (C) ${choices[2]}  (D) ${choices[3]}`;
  const prettySubject = prettifySubject(subject);
  return {
    question: inlined,
    choices,
    answer: answerText,
    subject: prettySubject,
    difficulty: mmluDifficultyForSubject(subject),
    tags: ['mmlu', prettySubject.toLowerCase().replace(/\s+/g, '-')],
    source: 'mmlu',
    status: 'draft',
  };
}

export const name = 'mmlu';

/**
 * @param {number} count
 * @param {{offset?: number, subjectFilter?: string|null}} [options]
 * @returns {Promise<import('../tkbAdapters').RawAdapterQuestion[]>}
 */
export async function fetchBatch(count, { offset = 0, subjectFilter = null } = {}) {
  const results = [];
  let currentOffset = offset;
  let numRowsTotal = Infinity;
  let pagesFetched = 0;
  const pageCap = subjectFilter ? MAX_FILTER_PAGES : Infinity;

  while (results.length < count && currentOffset < numRowsTotal && pagesFetched < pageCap) {
    const length = Math.min(PAGE_SIZE, count - results.length);
    const data = await fetchPage(currentOffset, subjectFilter ? PAGE_SIZE : length);
    pagesFetched += 1;
    if (!data || !Array.isArray(data.rows)) break;

    numRowsTotal = data.num_rows_total ?? numRowsTotal;
    const rows = data.rows.map(r => r.row);
    const filtered = subjectFilter ? rows.filter(r => r.subject === subjectFilter) : rows;
    results.push(...filtered.map(toRawQuestion));

    if (data.rows.length === 0) break;
    currentOffset += data.rows.length;
    // Throttle between pages when scanning far into the dataset for a
    // subjectFilter - verified live that back-to-back requests with no
    // delay trip HuggingFace's rate limit well before reaching a subject
    // that sits ~30+ pages in.
    if (subjectFilter && currentOffset < numRowsTotal) await sleep(1200);
  }

  return results.slice(0, count);
}

/**
 * Empirically derives the distinct list of MMLU subject slugs.
 *
 * NOTE: verified live that `config=all` rows are NOT interleaved across
 * subjects — they're clustered in contiguous alphabetical blocks per subject
 * (some subjects like professional_law/moral_scenarios span 1000+ rows).
 * A "stop after N consecutive stale pages" heuristic is unreliable here: it
 * can trigger while still inside one large subject's block, well before
 * later-alphabet subjects (e.g. formal_logic, professional_law) are ever
 * reached. So instead we scan sequentially up to num_rows_total (reported by
 * the API on the first response), bounded defensively by HARD_CAP in case
 * that field is ever missing/wrong.
 * @returns {Promise<string[]>}
 */
export async function fetchSubjectList() {
  const subjects = new Set();
  const HARD_CAP = 15000;
  let offset = 0;
  let limit = HARD_CAP;

  while (offset < limit) {
    const data = await fetchPage(offset, PAGE_SIZE);
    if (!data || !Array.isArray(data.rows) || data.rows.length === 0) break;

    data.rows.forEach(r => subjects.add(r.row.subject));
    if (typeof data.num_rows_total === 'number') {
      limit = Math.min(data.num_rows_total, HARD_CAP);
    }
    offset += data.rows.length;
    // throttle to avoid HF rate limiting across ~140 sequential pages
    if (offset < limit) await sleep(1000);
  }

  return Array.from(subjects).sort();
}

export default { name, fetchBatch, fetchSubjectList, mmluDifficultyForSubject, prettifySubject };
