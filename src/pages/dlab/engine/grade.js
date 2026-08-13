// Answer normalisation and grading.
//
// The grader is deliberately forgiving about FORM and strict about CONTENT. A
// test-taker who produced the right morphemes in the right order but typed them
// with a stray capital or a double space got the linguistics right, and marking
// that wrong would measure typing, not aptitude. A test-taker who produced a
// different morpheme got it wrong, and no amount of leniency should hide that.

/**
 * Case-folded, whitespace-collapsed, diacritic-stripped, hyphen-tolerant.
 * Hyphens fold to nothing rather than to a space so that "ka-RU-mi" and
 * "karumi" compare equal — syllabification is a notation the test asks for in
 * some items and not others, and it should never be the reason an answer fails.
 * @param {string} s
 * @returns {string}
 */
export function normalizeAnswer(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-–—]/g, '')
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stress items are answered in a notation where capitalisation IS the content,
 * so they get their own comparison that keeps case but still forgives spacing
 * and separator choice.
 * @param {string} s
 */
export function normalizeStressAnswer(s) {
  return String(s ?? '')
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/[\s–—]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

const STRESS_NOTATION_TYPES = new Set(['stress', 'composite']);

/**
 * @param {object} item
 * @param {string} given
 * @returns {{correct: boolean, exact: boolean, note: string|null}}
 */
export function gradeAnswer(item, given) {
  const raw = String(given ?? '');
  if (raw.trim() === '') return { correct: false, exact: false, note: null };

  const accepted = [item.answer, ...(item.alternates || [])];

  // Numeric stress answers: accept "2", "syllable 2", "2nd".
  if (item.type === 'stress' && /^\d+$/.test(item.answer)) {
    const digits = raw.match(/\d+/);
    return { correct: !!digits && digits[0] === item.answer, exact: raw.trim() === item.answer, note: null };
  }

  if (STRESS_NOTATION_TYPES.has(item.type) && /[A-Z]/.test(item.answer)) {
    const g = normalizeStressAnswer(raw);
    if (accepted.some((a) => normalizeStressAnswer(a) === g)) {
      return { correct: true, exact: g === normalizeStressAnswer(item.answer), note: null };
    }
    // Right morphemes, stress not marked (or marked wrong) — a real distinction
    // worth naming rather than a flat "wrong", because the two halves of the
    // item test different things.
    if (normalizeAnswer(raw) === normalizeAnswer(item.answer)) {
      return { correct: false, exact: false, note: 'The words are right — the stress marking is not.' };
    }
    return { correct: false, exact: false, note: null };
  }

  const g = normalizeAnswer(raw);
  if (accepted.some((a) => normalizeAnswer(a) === g)) {
    return { correct: true, exact: raw.trim() === item.answer, note: null };
  }

  // Right pieces, wrong order is the single most common near-miss and is worth
  // telling the test-taker about explicitly — it means they know the morphology
  // and missed the syntax, which is a different thing to study.
  const gWords = g.split(' ').filter(Boolean).sort().join(' ');
  const aWords = normalizeAnswer(item.answer).split(' ').filter(Boolean).sort().join(' ');
  if (gWords && gWords === aWords) {
    return { correct: false, exact: false, note: 'All the right words — wrong order.' };
  }

  return { correct: false, exact: false, note: null };
}

/**
 * @param {object[]} items
 * @param {Record<string, {answer: string, assisted?: boolean, overridden?: boolean}>} responses
 */
export function scoreTest(items, responses) {
  const byTier = {};
  const byPool = { written: { correct: 0, total: 0 }, audio: { correct: 0, total: 0 } };
  let correct = 0;
  let assistedCorrect = 0;
  let assistedTotal = 0;
  let unassistedCorrect = 0;
  let unassistedTotal = 0;

  for (const it of items) {
    const r = responses[it.id] || {};
    const graded = r.overridden ? { correct: true } : gradeAnswer(it, r.answer);
    const isCorrect = !!graded.correct;
    if (isCorrect) correct += 1;

    byTier[it.tier] ||= { correct: 0, total: 0 };
    byTier[it.tier].total += 1;
    if (isCorrect) byTier[it.tier].correct += 1;

    const pool = it.modality === 'audio' ? 'audio' : 'written';
    byPool[pool].total += 1;
    if (isCorrect) byPool[pool].correct += 1;

    if (r.assisted) {
      assistedTotal += 1;
      if (isCorrect) assistedCorrect += 1;
    } else {
      unassistedTotal += 1;
      if (isCorrect) unassistedCorrect += 1;
    }
  }

  return {
    correct,
    total: items.length,
    percent: items.length ? Math.round((correct / items.length) * 100) : 0,
    byTier,
    byPool,
    assisted: { correct: assistedCorrect, total: assistedTotal },
    unassisted: { correct: unassistedCorrect, total: unassistedTotal },
  };
}

// The real DLAB reports 95-164 against Category I-IV cutoffs. This is a
// PRACTICE estimate off a different instrument, so it is always labelled as an
// estimate in the UI — reporting it as a DLAB score would be a lie.
export const CATEGORY_CUTOFFS = [
  { cat: 'I', min: 95, langs: 'Spanish, French, Portuguese, Italian' },
  { cat: 'II', min: 100, langs: 'German, Indonesian, Romanian' },
  { cat: 'III', min: 105, langs: 'Russian, Hebrew, Persian, Tagalog' },
  { cat: 'IV', min: 110, langs: 'Arabic, Chinese, Japanese, Korean, Pashto' },
];

/**
 * @param {number} percent
 * @returns {{scaled: number, category: string|null}}
 */
export function scaledEstimate(percent) {
  // 0% maps to the bottom of the reported band, 100% to the top. Linear: the
  // real conversion is not public, and inventing a curve would imply a
  // precision this estimate does not have.
  const scaled = Math.round(50 + (percent / 100) * (164 - 50));
  let category = null;
  for (const c of CATEGORY_CUTOFFS) if (scaled >= c.min) category = c.cat;
  return { scaled, category };
}
