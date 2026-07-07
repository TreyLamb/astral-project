// Pure near-duplicate detection for bulk-imported questions. No imports, no
// side effects, no localStorage/DOM. Runs BEFORE tkbStorage.importQuestions'
// exact-text-match dedup, to catch reworded/rephrased duplicates that arrive
// from concurrent external sources (OpenTDB, Trivia API, MMLU-style dumps,
// hand-entered seed data, etc.) that overlap heavily with each other.

/**
 * Lowercase, strip everything except letters/digits/spaces, collapse
 * whitespace, trim. Pure string transform.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, '') // drop apostrophes entirely: "what's" -> "whats", not "what s"
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} text
 * @returns {string[]} whitespace-split tokens of the normalized text, empty
 *   tokens (from collapsed punctuation) filtered out
 */
export function tokenize(text) {
  return normalizeText(text)
    .split(' ')
    .filter(Boolean);
}

/**
 * Jaccard index over the token SETS of two token arrays:
 * |intersection| / |union|. Both-empty is defined as 0 (not 1) so an empty
 * candidate never spuriously matches everything; empty-vs-non-empty is also
 * 0, and neither case can produce NaN.
 * @param {string[]} tokensA
 * @param {string[]} tokensB
 * @returns {number} in [0, 1]
 */
export function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const t of setA) {
    if (setB.has(t)) intersectionSize += 1;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  if (unionSize === 0) return 0;
  return intersectionSize / unionSize;
}

/**
 * Default similarity threshold for treating two short trivia-style questions
 * (roughly under ~20 words) as near-duplicates.
 *
 * KNOWN LIMITATION (deliberate, documented): plain Jaccard over word tokens
 * cannot distinguish "same question pattern, different answer" from a true
 * paraphrase of the same fact. Short questions share almost all of their
 * tokens in the shared template ("what is the capital of ___?") regardless
 * of the answer slot, so e.g. "What is the capital of France?" vs "What is
 * the capital of Germany?" score HIGHER (~0.71 on this exact pair) than many
 * genuine paraphrases of the SAME fact (e.g. "What is the tallest mountain
 * in the world?" vs "What's the tallest mountain in the world?" scores
 * ~0.625, because the rewording drops/changes stopwords like "is"). A real
 * semantic check would need embeddings, which is out of scope for a
 * zero-dependency phase-2 pass.
 *
 * 0.6 is chosen (lower than the naive 0.75 starting point) because on short
 * texts a single stopword swap ("is" -> dropped, "what's" vs "what is") can
 * swing Jaccard down substantially even for an obvious duplicate; 0.75 would
 * miss real rewordings we specifically need to catch (OpenTDB/Trivia
 * API/MMLU phrasing variance). This does mean some same-pattern-different-
 * answer pairs (like the France/Germany example above) will ALSO be flagged
 * as near-duplicates — an accepted false-positive class for this phase,
 * better caught manually on review than silently missed.
 */
export const DEFAULT_THRESHOLD = 0.6;

/**
 * @param {string} textA
 * @param {string} textB
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function isNearDuplicate(textA, textB, threshold = DEFAULT_THRESHOLD) {
  return jaccardSimilarity(tokenize(textA), tokenize(textB)) >= threshold;
}

/**
 * @param {string} candidateText
 * @param {string[]} existingTexts
 * @param {number} [threshold]
 * @returns {string[]} subset of existingTexts that are near-duplicates of candidateText
 */
export function findDuplicates(candidateText, existingTexts, threshold = DEFAULT_THRESHOLD) {
  return existingTexts.filter((existing) => isNearDuplicate(candidateText, existing, threshold));
}

/**
 * Partitions a freshly-fetched batch of candidate question strings against
 * an already-existing bank, dropping near-duplicates of the existing bank
 * AND near-duplicates that appear more than once within the same batch
 * (bulk sources like OpenTDB/Trivia API can return the same or near-same
 * question across pages).
 *
 * O(n*m) nested comparison — fine at the scale this runs at (existing bank:
 * a few hundred; incoming batch: a few hundred). Not worth indexing/LSH.
 *
 * @param {string[]} candidates - new, not-yet-imported question strings, in order
 * @param {string[]} existingTexts - current bank's question strings
 * @param {number} [threshold]
 * @returns {{kept: string[], droppedAsDuplicateOfExisting: string[], droppedAsDuplicateWithinBatch: string[]}}
 */
export function dedupeBatch(candidates, existingTexts, threshold = DEFAULT_THRESHOLD) {
  const kept = [];
  const droppedAsDuplicateOfExisting = [];
  const droppedAsDuplicateWithinBatch = [];

  candidates.forEach((candidate) => {
    if (existingTexts.some((existing) => isNearDuplicate(candidate, existing, threshold))) {
      droppedAsDuplicateOfExisting.push(candidate);
      return;
    }
    if (kept.some((acceptedSoFar) => isNearDuplicate(candidate, acceptedSoFar, threshold))) {
      droppedAsDuplicateWithinBatch.push(candidate);
      return;
    }
    kept.push(candidate);
  });

  return { kept, droppedAsDuplicateOfExisting, droppedAsDuplicateWithinBatch };
}

/**
 * Question-text-only similarity (above) has a documented false-positive class:
 * same-template-different-answer pairs ("capital of France?" vs "capital of
 * Germany?") can score AS HIGH OR HIGHER than genuine paraphrases, because
 * the shared template dominates a short question's tokens. Bulk sources
 * (OpenTDB/Trivia API/MMLU) are FULL of same-template batches (many "capital
 * of ___" or "which of the following ___" questions arrive together), so
 * using dedupeBatch's text-only check as the real import gate would collapse
 * an entire same-template batch down to ~1 survivor — a real data-loss bug,
 * not just a theoretical edge case.
 *
 * Fix: require answer agreement too. Two questions are only treated as an
 * actual duplicate if the question text is a near-duplicate AND the answers
 * normalize to the same string (exact match on normalizeText(answer), not
 * fuzzy — answers are typically short factual strings where near-match would
 * itself risk false positives, e.g. "Paris" vs "France"). This is what
 * dedupeQaBatch/isNearDuplicateQA use; prefer these over the text-only
 * functions above for any real batch-import dedup path.
 */

/**
 * @typedef {Object} QaPair
 * @property {string} question
 * @property {string} answer
 */

/**
 * @param {QaPair} a
 * @param {QaPair} b
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function isNearDuplicateQa(a, b, threshold = DEFAULT_THRESHOLD) {
  if (normalizeText(a.answer) !== normalizeText(b.answer)) return false;
  return isNearDuplicate(a.question, b.question, threshold);
}

/**
 * Same partitioning as dedupeBatch, but operating on {question, answer} pairs
 * and requiring answer agreement before a question-similarity match counts as
 * a duplicate. Use this (not the text-only dedupeBatch) for real ingestion —
 * see the comment above for why the text-only version is unsafe for
 * same-template batches.
 * @param {QaPair[]} candidates
 * @param {QaPair[]} existingPairs
 * @param {number} [threshold]
 * @returns {{kept: QaPair[], droppedAsDuplicateOfExisting: QaPair[], droppedAsDuplicateWithinBatch: QaPair[]}}
 */
export function dedupeQaBatch(candidates, existingPairs, threshold = DEFAULT_THRESHOLD) {
  const kept = [];
  const droppedAsDuplicateOfExisting = [];
  const droppedAsDuplicateWithinBatch = [];

  candidates.forEach((candidate) => {
    if (existingPairs.some((existing) => isNearDuplicateQa(candidate, existing, threshold))) {
      droppedAsDuplicateOfExisting.push(candidate);
      return;
    }
    if (kept.some((acceptedSoFar) => isNearDuplicateQa(candidate, acceptedSoFar, threshold))) {
      droppedAsDuplicateWithinBatch.push(candidate);
      return;
    }
    kept.push(candidate);
  });

  return { kept, droppedAsDuplicateOfExisting, droppedAsDuplicateWithinBatch };
}
