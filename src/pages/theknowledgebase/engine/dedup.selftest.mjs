import assert from 'node:assert/strict';
import {
  normalizeText,
  tokenize,
  jaccardSimilarity,
  isNearDuplicate,
  findDuplicates,
  dedupeBatch,
  isNearDuplicateQa,
  dedupeQaBatch,
  DEFAULT_THRESHOLD,
} from './dedup.js';

// ---------------------------------------------------------------------------
// Test 1: normalizeText / tokenize — punctuation and case differences don't
// affect the resulting token set (apostrophe removal turning "What's" into
// "Whats" is expected).
// ---------------------------------------------------------------------------
{
  const a = tokenize("What's the capital of France?");
  const b = tokenize('whats the capital of france');
  assert.deepEqual(a, ['whats', 'the', 'capital', 'of', 'france']);
  assert.deepEqual(a, b, 'punctuation/case should not affect tokenization');

  assert.equal(normalizeText('  Hello,   World!!  '), 'hello world');
  assert.equal(tokenize('  a    b  ').length, 2, 'collapsed whitespace should not yield empty tokens');
}

// ---------------------------------------------------------------------------
// Test 2: jaccardSimilarity — identical -> 1.0, disjoint -> 0.0, partial
// overlap hand-computed on a small example.
// ---------------------------------------------------------------------------
{
  const same = ['a', 'b', 'c'];
  assert.equal(jaccardSimilarity(same, same.slice()), 1.0);

  assert.equal(jaccardSimilarity(['a', 'b'], ['c', 'd']), 0.0);

  // Two 4-word sets sharing exactly 2 words: intersection=2, union=6 -> 1/3.
  const setA = ['a', 'b', 'c', 'd'];
  const setB = ['c', 'd', 'e', 'f'];
  assert.equal(jaccardSimilarity(setA, setB), 2 / 6);

  // Edge cases: no NaN, empty-vs-empty and empty-vs-non-empty both 0.
  assert.equal(jaccardSimilarity([], []), 0);
  assert.equal(jaccardSimilarity([], ['a']), 0);
  assert.equal(jaccardSimilarity(['a'], []), 0);
}

// ---------------------------------------------------------------------------
// Test 3: isNearDuplicate — a clearly-reworded duplicate is detected at the
// default threshold; a clearly-different pair (different subject entirely)
// is not.
// ---------------------------------------------------------------------------
{
  const dupA = 'What is the tallest mountain in the world?';
  const dupB = "What's the tallest mountain in the world?";
  const dupScore = jaccardSimilarity(tokenize(dupA), tokenize(dupB));
  assert.ok(dupScore >= DEFAULT_THRESHOLD, `expected reworded dup to score >= threshold, got ${dupScore}`);
  assert.ok(isNearDuplicate(dupA, dupB), 'reworded duplicate should be flagged as near-duplicate');

  const unrelatedA = 'What is the powerhouse of the cell?';
  const unrelatedB = 'Who wrote the play Hamlet?';
  assert.ok(!isNearDuplicate(unrelatedA, unrelatedB), 'unrelated questions must not be flagged as duplicates');
}

// ---------------------------------------------------------------------------
// Test 4: known false-positive class — "same pattern, different answer"
// short questions. "What is the capital of France?" vs "What is the capital
// of Germany?" share 5 of their ~6-7 tokens (what/is/the/capital/of) despite
// naming different countries. Plain Jaccard cannot tell these apart from a
// true paraphrase; see the DEFAULT_THRESHOLD comment in dedup.js for the
// deliberate tradeoff. This asserts the ACTUAL behavior of our chosen
// threshold on this exact pair (it crosses the threshold, so it IS flagged
// as a near-duplicate) rather than an aspirational "should be different"
// behavior the plain-Jaccard approach does not provide.
// ---------------------------------------------------------------------------
{
  const franceQ = 'What is the capital of France?';
  const germanyQ = 'What is the capital of Germany?';
  const score = jaccardSimilarity(tokenize(franceQ), tokenize(germanyQ));
  assert.equal(score, 5 / 7, `expected hand-computed 5/7 overlap, got ${score}`);
  assert.ok(
    isNearDuplicate(franceQ, germanyQ),
    'documented known limitation: same-template different-answer pair crosses the default threshold'
  );
}

// ---------------------------------------------------------------------------
// Test 5: dedupeBatch — partitions a batch containing (a) a duplicate of an
// existing question, (b) two near-duplicates of each other within the batch
// (only the first kept), (c) genuinely unique questions.
// ---------------------------------------------------------------------------
{
  const existingTexts = [
    'What is the tallest mountain in the world?',
    'Who painted the Mona Lisa?',
  ];

  const candidates = [
    "What's the tallest mountain in the world?", // (a) dup of existing[0]
    'What is the largest planet in our solar system?', // (c) unique so far -> kept
    'What is the largest planet in the solar system?', // (b) dup of previous candidate, within batch
    'Who wrote the play Hamlet?', // (c) unique
    'What is the chemical symbol for gold?', // (c) unique
  ];

  const result = dedupeBatch(candidates, existingTexts);

  assert.deepEqual(result.kept, [
    'What is the largest planet in our solar system?',
    'Who wrote the play Hamlet?',
    'What is the chemical symbol for gold?',
  ]);
  assert.deepEqual(result.droppedAsDuplicateOfExisting, ["What's the tallest mountain in the world?"]);
  assert.deepEqual(result.droppedAsDuplicateWithinBatch, [
    'What is the largest planet in the solar system?',
  ]);

  // findDuplicates sanity check against the same bank.
  const found = findDuplicates("What's the tallest mountain in the world?", existingTexts);
  assert.deepEqual(found, ['What is the tallest mountain in the world?']);
  assert.deepEqual(findDuplicates('Totally unrelated question about nothing here.', existingTexts), []);
}

// ---------------------------------------------------------------------------
// Test 6: isNearDuplicateQa / dedupeQaBatch — the answer-aware layer that
// fixes test 4's false-positive class for real batch import. A same-template
// batch of "capital of X?" questions (each with a DIFFERENT correct answer)
// must all survive, since requiring answer agreement rules out the France/
// Germany-style false positive; a genuine reworded duplicate (same answer)
// must still be caught.
// ---------------------------------------------------------------------------
{
  const franceQ = { question: 'What is the capital of France?', answer: 'Paris' };
  const germanyQ = { question: 'What is the capital of Germany?', answer: 'Berlin' };
  assert.ok(
    !isNearDuplicateQa(franceQ, germanyQ),
    'same-template different-answer pair must NOT be flagged once answers are compared'
  );

  const mountainA = { question: 'What is the tallest mountain in the world?', answer: 'Mount Everest' };
  const mountainB = { question: "What's the tallest mountain in the world?", answer: 'Mount Everest' };
  assert.ok(
    isNearDuplicateQa(mountainA, mountainB),
    'true reworded duplicate (same answer) must still be caught'
  );

  const sameQuestionDifferentAnswer = { question: 'What is the tallest mountain in the world?', answer: 'K2' };
  assert.ok(
    !isNearDuplicateQa(mountainA, sameQuestionDifferentAnswer),
    'identical question text with a disagreeing answer must not be treated as a duplicate (bad data, not a dup)'
  );

  // A same-template batch of 5 different capital-city questions (5 different
  // answers) must all survive dedupeQaBatch intact — this is exactly the
  // real-world case (OpenTDB/Trivia API return many "capital of X" questions
  // together) that the text-only dedupeBatch would have collapsed to ~1.
  const capitalBatch = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'What is the capital of Germany?', answer: 'Berlin' },
    { question: 'What is the capital of Italy?', answer: 'Rome' },
    { question: 'What is the capital of Spain?', answer: 'Madrid' },
    { question: 'What is the capital of Japan?', answer: 'Tokyo' },
  ];
  const capitalResult = dedupeQaBatch(capitalBatch, []);
  assert.equal(capitalResult.kept.length, 5, 'same-template different-answer batch must all survive');
  assert.equal(capitalResult.droppedAsDuplicateOfExisting.length, 0);
  assert.equal(capitalResult.droppedAsDuplicateWithinBatch.length, 0);

  // But a true within-batch duplicate (same answer, reworded question) is
  // still caught alongside the surviving unique ones. Note: "What's" vs
  // "What is" specifically loses too much shared-token weight on a question
  // this short (score ~0.57, below threshold) to reliably trigger — that's
  // the same documented short-text sensitivity as test 4/DEFAULT_THRESHOLD,
  // not a bug. Using an addition ("capital city") instead of a contraction
  // keeps token overlap high (6/7 ~ 0.86) and reliably crosses the threshold.
  const mixedBatch = [
    ...capitalBatch,
    { question: 'What is the capital city of France?', answer: 'Paris' }, // dup of capitalBatch[0]
  ];
  const mixedResult = dedupeQaBatch(mixedBatch, []);
  assert.equal(mixedResult.kept.length, 5);
  assert.deepEqual(mixedResult.droppedAsDuplicateWithinBatch, [
    { question: 'What is the capital city of France?', answer: 'Paris' },
  ]);
}

console.log('All dedup tests passed');
