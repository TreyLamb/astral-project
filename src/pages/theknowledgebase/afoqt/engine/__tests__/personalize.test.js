// Tests for curriculum/personalize.js - the diagnostic-to-curriculum ordering Trey asked for:
// weak subtests first, strong ones out of the way, and a chapter to actually start on.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { CHAPTERS, TRACKS } from '../../curriculum/chapters';
import { personalizedChapterOrder, personalizedTrackOrder, nextPersonalizedChapter } from '../../curriculum/personalize';
import { defaultProgress, recordTestOut } from '../../afoqtStorage';

// One diagnostic result: WK weak, MK strong, everything else untouched (moderate/no signal).
const results = {
  WK: { correct: 1, answered: 6 },
  MK: { correct: 6, answered: 6 },
  AR: { correct: 4, answered: 6 },
};

describe('personalizedChapterOrder', () => {
  it('with no diagnostic, falls back to standard authored order', () => {
    const ordered = personalizedChapterOrder(CHAPTERS, null);
    expect(ordered).toEqual([...CHAPTERS].sort((a, b) => a.order - b.order));
  });

  it('puts every weak-subtest chapter before every strong-subtest chapter', () => {
    const ordered = personalizedChapterOrder(CHAPTERS, results);
    const idxOf = (subtest) => ordered.findIndex((c) => c.subtest === subtest);
    const lastWeakIdx = ordered.map((c, i) => (c.subtest === 'WK' ? i : -1)).filter((i) => i >= 0).pop();
    const firstStrongIdx = ordered.map((c, i) => (c.subtest === 'MK' ? i : -1)).filter((i) => i >= 0)[0];
    expect(lastWeakIdx).toBeLessThan(firstStrongIdx);
    expect(idxOf('WK')).toBeGreaterThanOrEqual(0);
  });

  it('keeps authored order as the tiebreaker within one tier', () => {
    const ordered = personalizedChapterOrder(CHAPTERS, results);
    const mk = ordered.filter((c) => c.subtest === 'MK');
    expect(mk).toEqual([...mk].sort((a, b) => a.order - b.order));
  });
});

describe('personalizedTrackOrder', () => {
  it('with no diagnostic, returns the tracks unchanged', () => {
    expect(personalizedTrackOrder(TRACKS, null)).toBe(TRACKS);
  });

  it('moves the weak track ahead of the strong one', () => {
    const ordered = personalizedTrackOrder(TRACKS, results);
    const wk = ordered.findIndex((t) => t.subtest === 'WK');
    const mk = ordered.findIndex((t) => t.subtest === 'MK');
    expect(wk).toBeLessThan(mk);
  });
});

describe('nextPersonalizedChapter', () => {
  it('recommends a weak-subtest chapter over a strong one when both are unlocked and undone', () => {
    const next = nextPersonalizedChapter(CHAPTERS, defaultProgress(), results);
    expect(next.subtest).toBe('WK');
  });

  it('skips a completed chapter and moves to the next personalized one', () => {
    const wk01 = CHAPTERS.find((c) => c.subtest === 'WK' && c.order === Math.min(
      ...CHAPTERS.filter((c) => c.subtest === 'WK').map((c) => c.order),
    ));
    const p = recordTestOut(defaultProgress(), wk01.id, { correct: 5, total: 5, pass: wk01.testOutPass });
    const next = nextPersonalizedChapter(CHAPTERS, p, results);
    expect(next.id).not.toBe(wk01.id);
    expect(next.subtest).toBe('WK'); // more WK chapters remain, still weakest
  });

  it('falls back to standard order with no diagnostic', () => {
    const next = nextPersonalizedChapter(CHAPTERS, defaultProgress(), null);
    expect(next.order).toBe(Math.min(...CHAPTERS.map((c) => c.order)));
  });
});
