// How much of a drill comes from the static bank, and how hard it repeats.
//
// Trey, 2026-09-04: "I've seen the word 'belie' like 30x overall throughout all my testing so a
// lot of words are clearly repeating. I haven't seen a new word in a while."
//
// He was right and the cause was arithmetic, not content. Word Knowledge has 35 bank items
// against 450 distinct headwords reachable from its 60 templates. `composeDrill` mixed the two
// at a flat `bankRatio: 0.5`, so a 25-question drill took ~12 items from those same 35 EVERY
// run - about a third of the whole bank per session - while a given template word turned up
// ~2.4% of the time. That made a bank item roughly 13x more likely to be seen than a generated
// one, which is exactly what "belie again" feels like from the inside.
//
// Two changes, and the tests below pin both: the share drops to BANK_SHARE_WITH_TEMPLATES
// wherever generation can carry the run, and the bank draw is least-seen-first so the pool is
// covered instead of resampled. Neither is visible to any structural check - a repeated question
// is perfectly well formed - so this file is the only thing standing between the fix and a quiet
// regression back to 0.5.

import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { assembleDrill } from '../drill.js';
import { composeDrill, bankItems } from '../bank.js';
import { mulberry32 } from '../../../engine/rng';

const isBank = (q) => String(q.templateId).startsWith('bank:');

/** Replays N drills the way the app does, carrying templateStats forward between them. */
function sessions({ subtest, count, runs }) {
  const progress = { templateStats: {}, missPool: {} };
  const served = [];
  for (let s = 0; s < runs; s++) {
    const qs = assembleDrill({ subtest, count, rng: mulberry32(s * 2654435761 + 7), progress });
    for (const q of qs) {
      served.push(q);
      const prev = progress.templateStats[q.templateId] ?? { seen: 0, correct: 0, totalMs: 0 };
      progress.templateStats[q.templateId] = { ...prev, seen: prev.seen + 1 };
    }
  }
  return { served, progress };
}

describe('bank share of a drill', () => {
  it('is a garnish, not half, once the subtest has templates', () => {
    const { served } = sessions({ subtest: 'WK', count: 25, runs: 20 });
    const share = served.filter(isBank).length / served.length;
    // The old flat 0.5 sat right at the top of this range; anything at or above 0.3 means the
    // constant has drifted back toward "half the drill".
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(0.3);
  });

  it('still gives a whole drill to a subtest with no templates to fall back on', () => {
    // The early return in composeDrill is what makes the lower share safe. Without it, dropping
    // the ratio would have quietly shortened drills on subtests that only have bank items.
    const pool = bankItems('WK');
    const out = composeDrill({ subtest: 'WK', count: 10, rng: mulberry32(3), generated: [] });
    expect(out).toHaveLength(Math.min(10, pool.length));
    expect(out.every(isBank)).toBe(true);
  });

  it('honours an explicitly pinned ratio', () => {
    const generated = Array.from({ length: 40 }, (_, i) => ({ templateId: 'gen-' + i }));
    const out = composeDrill({ subtest: 'WK', count: 20, rng: mulberry32(9), generated, bankRatio: 0.5 });
    expect(out.filter(isBank)).toHaveLength(10);
  });
});

describe('bank draw covers the pool instead of resampling it', () => {
  it('serves every bank item before serving any of them a third time', () => {
    // The real complaint, stated as a property: with least-seen-first, repetition can only
    // begin once the pool is exhausted. A uniform draw fails this badly - it re-serves a seen
    // item as happily as an unseen one, which is how one word reaches 30 sightings while
    // others have never appeared.
    const pool = bankItems('WK');
    const { progress } = sessions({ subtest: 'WK', count: 25, runs: 30 });
    const counts = pool.map((q) => progress.templateStats[q.templateId]?.seen ?? 0);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    // Every item has been served, and no item has run more than one full lap ahead of the
    // least-served one.
    expect(min).toBeGreaterThan(0);
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it('does not settle into a fixed rotation', () => {
    // Shuffle-then-stable-sort is what keeps the choice among equally-fresh items random. If the
    // shuffle were dropped, the same seed-independent order would come back every run.
    const a = assembleDrill({ subtest: 'WK', count: 25, rng: mulberry32(1), progress: { templateStats: {}, missPool: {} } });
    const b = assembleDrill({ subtest: 'WK', count: 25, rng: mulberry32(2), progress: { templateStats: {}, missPool: {} } });
    const ids = (qs) => qs.filter(isBank).map((q) => q.templateId).join(',');
    expect(ids(a)).not.toBe(ids(b));
  });
});

describe('generated words carry the run', () => {
  it('shows far more distinct Word Knowledge headwords than the bank holds', () => {
    const { served } = sessions({ subtest: 'WK', count: 25, runs: 30 });
    const words = new Set(served.map((q) => q.vocab?.word?.toLowerCase()).filter(Boolean));
    // 35 is the whole WK bank. Clearing it by a wide margin is the point: the generated side is
    // where the vocabulary breadth lives, so it has to dominate what actually reaches the screen.
    expect(words.size).toBeGreaterThan(150);
  });
});
