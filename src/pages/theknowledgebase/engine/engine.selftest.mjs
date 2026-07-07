import assert from 'node:assert/strict';
import { mulberry32, randInt, weightedSampleWithoutReplacement } from './rng.js';
import { enterCycle, tickCycles } from './cycle.js';
import { largestRemainderAllocate, effectiveWeight, buildSessionQueue } from './selection.js';
import { reinsertRetry, computeProgress } from './queue.js';

// ---------------------------------------------------------------------------
// Test 1: largestRemainderAllocate sums exactly to `total` when pool capacity
// is sufficient, across 2 different weight distributions.
// ---------------------------------------------------------------------------
{
  const poolSizes = { a: 100, b: 100, c: 100 };

  const alloc1 = largestRemainderAllocate({ a: 1, b: 1, c: 1 }, poolSizes, 50);
  assert.equal(alloc1.a + alloc1.b + alloc1.c, 50);

  const alloc2 = largestRemainderAllocate({ a: 5, b: 2, c: 13 }, poolSizes, 37);
  assert.equal(alloc2.a + alloc2.b + alloc2.c, 37);
}

// ---------------------------------------------------------------------------
// Test 2: clamps and redistributes when one subject's poolSize is smaller
// than its proportional quota.
// ---------------------------------------------------------------------------
{
  const shares = { a: 1, b: 1, c: 1 };
  const poolSizes = { a: 2, b: 100, c: 100 };
  const total = 30;
  const alloc = largestRemainderAllocate(shares, poolSizes, total);
  assert.ok(alloc.a <= poolSizes.a, 'a must not exceed its poolSize');
  assert.ok(alloc.b <= poolSizes.b);
  assert.ok(alloc.c <= poolSizes.c);
  assert.equal(alloc.a + alloc.b + alloc.c, total, 'sum should still hit total (capacity allows)');
}

// ---------------------------------------------------------------------------
// Test 3: a subject with effectively-zero weight gets ~0 allocation next to
// a subject with weight 100, head-to-head.
// ---------------------------------------------------------------------------
{
  const shares = { low: effectiveWeight(1), high: effectiveWeight(100) };
  const poolSizes = { low: 100, high: 100 };
  const alloc = largestRemainderAllocate(shares, poolSizes, 100);
  assert.ok(alloc.low <= 2, `expected low-weight subject to get ~0, got ${alloc.low}`);
  assert.ok(alloc.high >= 98, `expected high-weight subject to dominate, got ${alloc.high}`);
  assert.equal(alloc.low + alloc.high, 100);
}

// ---------------------------------------------------------------------------
// Test 4: weightedSampleWithoutReplacement pick-frequency ordering matches
// weight ordering over many trials, for weight ratio [1, 10, 50] (raw ~5/50/250).
// ---------------------------------------------------------------------------
{
  const items = [
    { id: 'low', raw: 5 },
    { id: 'mid', raw: 50 },
    { id: 'high', raw: 250 },
  ];
  const weightFn = (item) => effectiveWeight(item.raw);
  const rng = mulberry32(1234);
  const counts = { low: 0, mid: 0, high: 0 };
  const trials = 5000;
  for (let i = 0; i < trials; i++) {
    const [picked] = weightedSampleWithoutReplacement(items, weightFn, 1, rng);
    counts[picked.id] += 1;
  }
  assert.ok(counts.low < counts.mid, `expected low < mid, got ${counts.low} vs ${counts.mid}`);
  assert.ok(counts.mid < counts.high, `expected mid < high, got ${counts.mid} vs ${counts.high}`);
}

// ---------------------------------------------------------------------------
// Test 5: tickCycles phase transitions + removal after maxCycles.
// Force maxCycles=1 via an rng that always returns 0 (randInt(rng,1,2) with
// rng()=0 => 1 + floor(0 * (2-1+1)) = 1).
// ---------------------------------------------------------------------------
{
  const zeroRng = () => 0;
  assert.equal(randInt(zeroRng, 1, 2), 1, 'sanity check: randInt(rng=0,1,2) should be 1');

  const cycleConfig = { activeMin: 3, activeMax: 3, restMin: 2, restMax: 2 };
  let cycles = enterCycle({}, 'q1', 'new', cycleConfig, '2026-01-01', zeroRng);
  assert.equal(cycles.q1.phase, 'active');
  assert.equal(cycles.q1.activeDays, 3);
  assert.equal(cycles.q1.restDays, 2);
  assert.equal(cycles.q1.maxCycles, 1);

  // Day-by-day advance. activeDays=3: should still be active on days 1,2 and
  // flip to rest once elapsed >= 3 (day 3).
  cycles = tickCycles(cycles, '2026-01-02', zeroRng, cycleConfig); // elapsed=1
  assert.equal(cycles.q1.phase, 'active');
  cycles = tickCycles(cycles, '2026-01-03', zeroRng, cycleConfig); // elapsed=2
  assert.equal(cycles.q1.phase, 'active');
  cycles = tickCycles(cycles, '2026-01-04', zeroRng, cycleConfig); // elapsed=3 -> rest
  assert.equal(cycles.q1.phase, 'rest');
  assert.equal(cycles.q1.phaseStart, '2026-01-04');

  // restDays=2: flips back to active (or removed, since maxCycles=1) once
  // elapsed >= 2.
  cycles = tickCycles(cycles, '2026-01-05', zeroRng, cycleConfig); // elapsed=1
  assert.equal(cycles.q1.phase, 'rest');
  cycles = tickCycles(cycles, '2026-01-06', zeroRng, cycleConfig); // elapsed=2 -> completes cycle 1 of 1 -> removed
  assert.equal(cycles.q1, undefined, 'question should be fully removed after maxCycles completions');
}

// ---------------------------------------------------------------------------
// Test 6: tickCycles idempotency — calling twice with the same `today`
// produces an identical result both times.
// ---------------------------------------------------------------------------
{
  const rng = mulberry32(7);
  const cycleConfig = { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 };
  let cycles = enterCycle({}, 'q1', 'new', cycleConfig, '2026-01-01', rng);
  cycles = tickCycles(cycles, '2026-01-05', rng, cycleConfig);
  const once = JSON.stringify(cycles);
  const twiceRng = mulberry32(999); // different rng shouldn't matter if no re-roll happens
  const cyclesAgain = tickCycles(cycles, '2026-01-05', twiceRng, cycleConfig);
  const twice = JSON.stringify(cyclesAgain);
  assert.equal(once, twice, 'calling tickCycles twice with unchanged `today` must not double-advance');
}

// ---------------------------------------------------------------------------
// Test 7: forced-inclusion of active-cycling questions has NO cap, by
// explicit user request — every active-cycling question is force-included
// as long as it fits within N (the only limit is the session size itself).
// ---------------------------------------------------------------------------
{
  const rng = mulberry32(42);
  const subjects = [
    { id: 's1', name: 'S1', color: '#fff', visibleToProfiles: ['p1'], subtopics: [] },
  ];
  const N = 20;
  const numActiveCycling = 10; // well under N, so all of them should survive uncapped
  const questions = [];
  const cycles = {};
  for (let i = 0; i < numActiveCycling; i++) {
    const id = `cyc${i}`;
    questions.push(makeQuestion(id, 's1', 'main_recall'));
    cycles[id] = {
      reason: 'wrong',
      phase: 'active',
      phaseStart: '2026-01-01',
      activeDays: 100, // won't transition during this test
      restDays: 100,
      maxCycles: 2,
      cyclesCompleted: 0,
    };
  }
  // Plus some ordinary non-cycling questions so remaining-pool selection has
  // something to draw from.
  for (let i = 0; i < 15; i++) {
    questions.push(makeQuestion(`norm${i}`, 's1', 'main_recall'));
  }

  const weights = { subject: {}, tag: {}, question: {} };
  const settings = {
    schemaVersion: 1,
    activeProfileId: 'p1',
    autoScopedSubjectIds: [],
    cycle: { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 },
    retryOffset: { min: 10, max: 40 },
    selfRating: false,
    colorMode: 'pool',
    defaultN: 60,
    focusWeeks: [],
  };
  const profile = { id: 'p1', paceClass: 'fast', subjectScope: 'all', adjustmentMode: 'manual' };

  const { queue } = buildSessionQueue({
    N,
    questions,
    subjects,
    weights,
    cycles,
    settings,
    profile,
    today: '2026-01-01',
    rng,
  });

  const forcedInQueue = queue.filter((item) => item.questionId.startsWith('cyc'));
  assert.equal(
    forcedInQueue.length,
    numActiveCycling,
    `expected all ${numActiveCycling} active-cycling questions force-included uncapped, got ${forcedInQueue.length}`
  );
}

// ---------------------------------------------------------------------------
// Test 8: reinsertRetry index bounds — mid-array insert and clamped
// near-end-of-array insert.
// ---------------------------------------------------------------------------
{
  const queue = Array.from({ length: 20 }, (_, i) => ({ questionId: `q${i}`, retry: false }));
  const retryOffset = { min: 3, max: 5 };

  // Mid-array: currentIdx=2, offset in [3,5] => new entry should land in
  // [5,7] (well within bounds).
  const rngMid = mulberry32(1);
  const midQueue = reinsertRetry(queue, 2, rngMid, retryOffset);
  const midInsertIdx = midQueue.findIndex((item, idx) => item.retry && item.questionId === 'q2');
  assert.ok(midInsertIdx >= 2 + retryOffset.min && midInsertIdx <= 2 + retryOffset.max);

  // Near-end: currentIdx=18 with a 20-length queue, offset in [3,5] would
  // land at 21-23, which overflows -> must clamp to queue.length (20, i.e.
  // appended at the very end, index 20 in the new 21-length array).
  const rngEnd = mulberry32(2);
  const endQueue = reinsertRetry(queue, 18, rngEnd, retryOffset);
  assert.equal(endQueue.length, queue.length + 1);
  const lastItem = endQueue[endQueue.length - 1];
  assert.equal(lastItem.retry, true);
  assert.equal(lastItem.questionId, 'q18');
}

// ---------------------------------------------------------------------------
// Test 9: full buildSessionQueue run — no duplicate non-retry questionIds,
// queue.length === min(N, total available pool).
// ---------------------------------------------------------------------------
{
  const rng = mulberry32(2026);
  const subjects = [
    { id: 's1', name: 'S1', color: '#f00', visibleToProfiles: ['p1'], subtopics: [] },
    { id: 's2', name: 'S2', color: '#0f0', visibleToProfiles: ['p1'], subtopics: [] },
    { id: 's3', name: 'S3', color: '#00f', visibleToProfiles: ['p1'], subtopics: [] },
  ];
  const questions = [
    ...Array.from({ length: 4 }, (_, i) => makeQuestion(`s1q${i}`, 's1', 'main_recall')),
    ...Array.from({ length: 3 }, (_, i) => makeQuestion(`s2q${i}`, 's2', 'main_recall')),
    ...Array.from({ length: 3 }, (_, i) => makeQuestion(`s3q${i}`, 's3', 'main_recall')),
  ];
  const weights = {
    subject: { s1: 70, s2: 40, s3: 50 },
    tag: {},
    question: {},
  };
  const cycles = {};
  const settings = {
    schemaVersion: 1,
    activeProfileId: 'p1',
    autoScopedSubjectIds: [],
    cycle: { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 },
    retryOffset: { min: 10, max: 40 },
    selfRating: false,
    colorMode: 'pool',
    defaultN: 60,
    focusWeeks: [],
  };
  const profile = { id: 'p1', paceClass: 'fast', subjectScope: 'all', adjustmentMode: 'manual' };

  const N = 8; // less than total available (10), forces genuine selection
  const { queue } = buildSessionQueue({
    N,
    questions,
    subjects,
    weights,
    cycles,
    settings,
    profile,
    today: '2026-01-01',
    rng,
  });

  const nonRetryIds = queue.filter((item) => !item.retry).map((item) => item.questionId);
  const uniqueIds = new Set(nonRetryIds);
  assert.equal(uniqueIds.size, nonRetryIds.length, 'no questionId should appear twice among non-retry entries');
  assert.equal(queue.length, Math.min(N, questions.length));

  // Also sanity-check the case where N exceeds total available pool: queue
  // should legitimately come back shorter than N.
  const bigN = 50;
  const { queue: bigQueue } = buildSessionQueue({
    N: bigN,
    questions,
    subjects,
    weights,
    cycles,
    settings,
    profile,
    today: '2026-01-01',
    rng,
  });
  assert.equal(bigQueue.length, Math.min(bigN, questions.length));
}

function makeQuestion(id, subjectId, pipeline) {
  return {
    id,
    question: `Q ${id}`,
    answer: 'A',
    answerAlternates: [],
    subjectId,
    subtopicId: null,
    difficulty: 'basic',
    pipeline,
    styleTags: [],
    sourceNote: null,
    source: 'seed',
    status: 'active',
    flagged: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    stats: { timesShown: 0, timesCorrect: 0, timesWrong: 0, lastShownAt: null, correctDays: [] },
  };
}

// computeProgress smoke check (not one of the 9 required, but cheap to verify
// while we're here since it's part of queue.js's public surface).
{
  const progress = computeProgress([{ questionId: 'a', retry: false }, { questionId: 'b', retry: false }], 0, 2);
  assert.deepEqual(progress, { position: 1, total: 2, retriesAdded: 2 });
}

console.log('All engine tests passed');
