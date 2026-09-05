// The daily flashcard engine. Every rule here is a line of Trey's spec, quoted where it matters.
//
// Worth testing hard despite being a small module: the whole thing is date-keyed, so the failure
// modes are all invisible in a single session. "Opening it twice hands out sixty words" and "a
// skipped day silently shrinks the deck" both look completely normal on the day you write them
// and only misbehave tomorrow.

import { describe, it, expect } from 'vitest';
import {
  WORDS_PER_DAY, NEW_PASSES, WINDOW_DAYS,
  introduceDay, addMore, buildSession, allDeck, introducedIds, idsForDay,
  windowIds, windowDays, nextWords, remainingCount,
} from '../cards.js';

/** A pool big enough to run several days off, with a spread of bands. */
const pool = Array.from({ length: 400 }, (_, i) => ({
  id: `w-${String(i).padStart(3, '0')}`,
  word: `word${i}`,
  band: [2, 3, 4, 5][i % 4],
}));

const base = () => ({ cards: { days: {} } });

/** Run `days` consecutive study days, returning the progress blob. */
function runDays(n, start = 1) {
  let p = base();
  for (let d = 0; d < n; d++) p = introduceDay(p, pool, `2026-09-${String(start + d).padStart(2, '0')}`);
  return p;
}

describe('daily intake', () => {
  it('introduces exactly 30 new words on a day', () => {
    const p = introduceDay(base(), pool, '2026-09-01');
    expect(idsForDay(p, '2026-09-01')).toHaveLength(WORDS_PER_DAY);
    expect(WORDS_PER_DAY).toBe(30);
  });

  it('is idempotent - opening the review twice in a day does NOT hand out 60 words', () => {
    // The spec is "30 new words a day", not 30 per time you open it. introduceDay runs on every
    // mount of the view, so this is the property that keeps that true.
    let p = introduceDay(base(), pool, '2026-09-01');
    p = introduceDay(p, pool, '2026-09-01');
    p = introduceDay(p, pool, '2026-09-01');
    expect(idsForDay(p, '2026-09-01')).toHaveLength(WORDS_PER_DAY);
  });

  it('never repeats a word across days', () => {
    const p = runDays(6);
    const all = introducedIds(p);
    expect(new Set(all).size).toBe(all.length);
  });

  it('hands out the hardest bands first', () => {
    // Trey authors from the highest tier only, so teaching him band 2 first would be perverse.
    const p = introduceDay(base(), pool, '2026-09-01');
    const bands = idsForDay(p, '2026-09-01').map((id) => pool.find((w) => w.id === id).band);
    expect(Math.min(...bands)).toBe(5);
  });

  it('stops cleanly when the pool runs dry rather than inventing words', () => {
    const small = pool.slice(0, 10);
    let p = introduceDay(base(), small, '2026-09-01');
    expect(idsForDay(p, '2026-09-01')).toHaveLength(10);
    p = introduceDay(p, small, '2026-09-02');
    expect(idsForDay(p, '2026-09-02')).toHaveLength(0);
    expect(remainingCount(small, p)).toBe(0);
  });
});

describe('the "add x new words" button', () => {
  it('adds to today on demand', () => {
    let p = introduceDay(base(), pool, '2026-09-01');
    p = addMore(p, pool, '2026-09-01', 12);
    expect(idsForDay(p, '2026-09-01')).toHaveLength(WORDS_PER_DAY + 12);
  });

  it('does NOT change what tomorrow gets', () => {
    // "The next day still gets 30 words, adding words doesn't change." - his words exactly.
    let p = introduceDay(base(), pool, '2026-09-01');
    p = addMore(p, pool, '2026-09-01', 40);
    p = introduceDay(p, pool, '2026-09-02');
    expect(idsForDay(p, '2026-09-02')).toHaveLength(WORDS_PER_DAY);
  });

  it('added words are new words, so they get the three passes too', () => {
    let p = introduceDay(base(), pool, '2026-09-01');
    p = addMore(p, pool, '2026-09-01', 5);
    const q = buildSession(p, '2026-09-01');
    const newCards = q.filter((c) => c.phase === 'new');
    expect(newCards).toHaveLength((WORDS_PER_DAY + 5) * NEW_PASSES);
  });
});

describe('the session', () => {
  it('starts with the new words and shows them three times', () => {
    const p = introduceDay(base(), pool, '2026-09-01');
    const q = buildSession(p, '2026-09-01');
    expect(q.slice(0, WORDS_PER_DAY * NEW_PASSES).every((c) => c.phase === 'new')).toBe(true);
    expect(NEW_PASSES).toBe(3);
    for (const pass of [1, 2, 3]) {
      expect(q.filter((c) => c.phase === 'new' && c.pass === pass)).toHaveLength(WORDS_PER_DAY);
    }
  });

  it('keeps the first pass in introduction order and shuffles the later ones', () => {
    const p = introduceDay(base(), pool, '2026-09-01');
    const q = buildSession(p, '2026-09-01');
    const ids = idsForDay(p, '2026-09-01');
    const pass = (n) => q.filter((c) => c.phase === 'new' && c.pass === n).map((c) => c.id);
    expect(pass(1)).toEqual(ids);
    expect(pass(2)).not.toEqual(ids);
    expect([...pass(2)].sort()).toEqual([...ids].sort());   // same words, different order
  });

  it('then mixes new and old together', () => {
    const p = runDays(3);
    const q = buildSession(p, '2026-09-03');
    const mixed = q.filter((c) => c.phase === 'mixed').map((c) => c.id);
    expect(mixed).toHaveLength(WORDS_PER_DAY * 3);
    // Today's words are IN the mix, not just the older ones.
    expect(mixed.some((id) => idsForDay(p, '2026-09-03').includes(id))).toBe(true);
    expect(mixed.some((id) => idsForDay(p, '2026-09-01').includes(id))).toBe(true);
  });

  it('is stable across rebuilds, so a re-render does not reshuffle under you', () => {
    const p = runDays(2);
    expect(buildSession(p, '2026-09-02')).toEqual(buildSession(p, '2026-09-02'));
  });
});

describe('the five-day window', () => {
  it('holds at most five days of words', () => {
    const p = runDays(8);
    expect(windowDays(p)).toHaveLength(WINDOW_DAYS);
    expect(windowIds(p)).toHaveLength(WORDS_PER_DAY * WINDOW_DAYS);
  });

  it('keeps the FIVE MOST RECENT days and drops the oldest', () => {
    const p = runDays(7);
    expect(windowDays(p)).toEqual(['2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07']);
  });

  it('counts STUDY days, not calendar days, so a skipped day does not shrink the deck', () => {
    // He studies on the 1st, 2nd and then not again until the 20th. The window is his five most
    // recent study days - counting calendar days would silently hand him a three-card review
    // after a break, which is the opposite of what someone returning from a gap needs.
    let p = base();
    for (const d of ['2026-09-01', '2026-09-02', '2026-09-20', '2026-09-21', '2026-09-22']) {
      p = introduceDay(p, pool, d);
    }
    expect(windowDays(p)).toHaveLength(5);
    expect(windowIds(p)).toHaveLength(WORDS_PER_DAY * 5);
  });

  it('does not delete words that fall out of the window', () => {
    const p = runDays(8);
    expect(introducedIds(p)).toHaveLength(WORDS_PER_DAY * 8);
    expect(allDeck(p)).toHaveLength(WORDS_PER_DAY * 8);
  });
});

describe('the full deck', () => {
  it('holds every word ever introduced, including ones past the window', () => {
    const p = runDays(8);
    expect(new Set(allDeck(p))).toEqual(new Set(introducedIds(p)));
  });

  it('is shuffled, not a chronological march through study history', () => {
    const p = runDays(8);
    expect(allDeck(p)).not.toEqual(introducedIds(p));
  });
});

describe('nextWords', () => {
  it('skips words already taken', () => {
    const taken = pool.slice(0, 50).map((w) => w.id);
    expect(nextWords(pool, taken, 10).some((id) => taken.includes(id))).toBe(false);
  });

  it('returns fewer than asked rather than repeating when the pool is short', () => {
    expect(nextWords(pool.slice(0, 4), [], 30)).toHaveLength(4);
  });
});
