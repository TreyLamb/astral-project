import assert from 'node:assert/strict';
import { calculateRoundScore, AQ_POINTS } from './aqScoring.js';

// ---------------------------------------------------------------------------
// Test 1: all zeros / all fields undefined -> total 0, every breakdown entry 0.
// ---------------------------------------------------------------------------
{
  const { total, breakdown } = calculateRoundScore({});
  assert.equal(total, 0);
  for (const key of Object.keys(breakdown)) {
    assert.equal(breakdown[key], 0, `expected ${key} to be 0`);
  }

  const { total: totalUndefined, breakdown: breakdownUndefined } = calculateRoundScore(undefined);
  assert.equal(totalUndefined, 0);
  assert.deepEqual(breakdownUndefined, breakdown, 'calling with undefined should behave the same as {}');
}

// ---------------------------------------------------------------------------
// Test 2: hand-computed single-collection case.
// 1 standard collection (+500) + 3 individual antiquities (3 * 25 = 75) +
// wentOut (+500) = 500 + 75 + 500 = 1075.
// ---------------------------------------------------------------------------
{
  const { total, breakdown } = calculateRoundScore({
    standardCollections: 1,
    individualAntiquities: 3,
    wentOut: true,
  });
  assert.equal(breakdown.standardCollections, 500);
  assert.equal(breakdown.individualAntiquities, 75);
  assert.equal(breakdown.wentOut, 500);
  assert.equal(total, 1075, `expected 500 + 75 + 500 = 1075, got ${total}`);
}

// ---------------------------------------------------------------------------
// Test 3: only held-card penalties -> negative total.
// heldAntiquities: 2 * -25 = -50
// heldTreasures:   1 * -50 = -50
// heldRemingtons:  1 * -100 = -100
// total = -50 + -50 + -100 = -200
// ---------------------------------------------------------------------------
{
  const { total, breakdown } = calculateRoundScore({
    heldAntiquities: 2,
    heldTreasures: 1,
    heldRemingtons: 1,
  });
  assert.equal(breakdown.heldAntiquities, -50);
  assert.equal(breakdown.heldTreasures, -50);
  assert.equal(breakdown.heldRemingtons, -100);
  assert.equal(total, -200, `expected -50 + -50 + -100 = -200, got ${total}`);
}

// ---------------------------------------------------------------------------
// Test 4: realistic mixed case, positive and negative fields together.
// perfectTreasures:    1 * 1500 = 1500
// perfectAntiquities:  0 *  1000 =    0
// standardCollections: 2 *   500 = 1000
// mixedCollections:    1 *   250 =  250
// individualAntiquities: 4 * 25 =  100
// individualTreasures:   2 * 50 =  100
// remingtons:             1 * 100 = 100
// wentOut:                          500
// heldAntiquities:      3 * -25  =  -75
// heldTreasures:         1 * -50 =  -50
// heldRemingtons:                     0
// sum of positives: 1500+1000+250+100+100+100+500 = 3550
// sum of penalties: -75 + -50 = -125
// total = 3550 - 125 = 3425
// ---------------------------------------------------------------------------
{
  const { total, breakdown } = calculateRoundScore({
    perfectTreasures: 1,
    perfectAntiquities: 0,
    standardCollections: 2,
    mixedCollections: 1,
    individualAntiquities: 4,
    individualTreasures: 2,
    remingtons: 1,
    wentOut: true,
    heldAntiquities: 3,
    heldTreasures: 1,
    heldRemingtons: 0,
  });
  assert.equal(breakdown.perfectTreasures, 1500);
  assert.equal(breakdown.perfectAntiquities, 0);
  assert.equal(breakdown.standardCollections, 1000);
  assert.equal(breakdown.mixedCollections, 250);
  assert.equal(breakdown.individualAntiquities, 100);
  assert.equal(breakdown.individualTreasures, 100);
  assert.equal(breakdown.remingtons, 100);
  assert.equal(breakdown.wentOut, 500);
  assert.equal(breakdown.heldAntiquities, -75);
  assert.equal(breakdown.heldTreasures, -50);
  assert.equal(breakdown.heldRemingtons, 0);
  assert.equal(total, 3425, `expected 3550 - 125 = 3425, got ${total}`);
}

// ---------------------------------------------------------------------------
// Test 5: AQ_POINTS constants match the documented point values.
// ---------------------------------------------------------------------------
{
  assert.equal(AQ_POINTS.antiquity, 25);
  assert.equal(AQ_POINTS.treasure, 50);
  assert.equal(AQ_POINTS.remington, 100);
  assert.equal(AQ_POINTS.perfectTreasure, 1500);
  assert.equal(AQ_POINTS.perfectAntiquity, 1000);
  assert.equal(AQ_POINTS.standardCollection, 500);
  assert.equal(AQ_POINTS.mixedCollection, 250);
  assert.equal(AQ_POINTS.wentOut, 500);
}

console.log('All aqScoring tests passed');
