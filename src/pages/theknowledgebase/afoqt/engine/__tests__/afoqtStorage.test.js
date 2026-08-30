// Storage-layer tests for the word bank (Trey's request: a standing, browsable vocabulary list
// built from real Word Knowledge misses, separate from the miss pool - the miss pool resurfaces
// the QUESTION inside a drill, this is a plain definition list read on its own).

import { describe, it, expect } from 'vitest';
import {
  defaultProgress, addToWordBank, removeFromWordBank, wordBankEntries,
  flagKey, addFlag, removeFlag, isFlagged, flaggedEntries,
} from '../../afoqtStorage.js';

const ARDUOUS = { word: 'arduous', pos: 'adj', gloss: 'requiring great effort; difficult', root: { form: 'ardu-', sense: 'steep' } };
const CURSORY = { word: 'cursory', pos: 'adj', gloss: 'hasty and not thorough' };

describe('addToWordBank', () => {
  it('adds a missed word with missCount 1', () => {
    const p = addToWordBank(defaultProgress(), ARDUOUS);
    expect(p.wordBank.arduous.missCount).toBe(1);
    expect(p.wordBank.arduous.gloss).toBe(ARDUOUS.gloss);
  });

  it('increments missCount on a repeat miss of the same word', () => {
    let p = addToWordBank(defaultProgress(), ARDUOUS);
    p = addToWordBank(p, ARDUOUS);
    p = addToWordBank(p, ARDUOUS);
    expect(p.wordBank.arduous.missCount).toBe(3);
  });

  it('keys by word case- and space-insensitively', () => {
    let p = addToWordBank(defaultProgress(), ARDUOUS);
    p = addToWordBank(p, { ...ARDUOUS, word: 'Arduous' });
    expect(Object.keys(p.wordBank)).toEqual(['arduous']);
    expect(p.wordBank.arduous.missCount).toBe(2);
  });

  it('tracks two different words independently', () => {
    let p = addToWordBank(defaultProgress(), ARDUOUS);
    p = addToWordBank(p, CURSORY);
    expect(Object.keys(p.wordBank).sort()).toEqual(['arduous', 'cursory']);
  });

  it('is a no-op when the question carried no vocab (not a Word Knowledge miss)', () => {
    const p = addToWordBank(defaultProgress(), null);
    expect(p.wordBank).toEqual({});
  });

  it('does not mutate the progress object passed in', () => {
    const before = defaultProgress();
    addToWordBank(before, ARDUOUS);
    expect(before.wordBank).toEqual({});
  });
});

describe('removeFromWordBank', () => {
  it('removes a word entirely, not just decrements it', () => {
    let p = addToWordBank(defaultProgress(), ARDUOUS);
    p = addToWordBank(p, ARDUOUS);
    p = removeFromWordBank(p, 'arduous');
    expect(p.wordBank.arduous).toBeUndefined();
  });

  it('is a no-op removing a word never missed', () => {
    const p = removeFromWordBank(defaultProgress(), 'nonexistent');
    expect(p.wordBank).toEqual({});
  });
});

describe('wordBankEntries', () => {
  it('orders worst-missed word first', () => {
    let p = addToWordBank(defaultProgress(), CURSORY); // 1 miss
    p = addToWordBank(p, ARDUOUS);
    p = addToWordBank(p, ARDUOUS);
    p = addToWordBank(p, ARDUOUS); // 3 misses
    const entries = wordBankEntries(p);
    expect(entries.map((e) => e.word)).toEqual(['arduous', 'cursory']);
  });

  it('is empty on a fresh profile', () => {
    expect(wordBankEntries(defaultProgress())).toEqual([]);
  });
});

describe('flagged questions', () => {
  const Q1 = { templateId: 'wk-opposite-b3', seed: 42, subtest: 'WK', stem: 'Which word is most nearly OPPOSITE...' };
  const Q2 = { templateId: 'mk-simple-interest', seed: 7, subtest: 'MK', stem: '$2500 is invested...' };

  it('flags a question and reports it flagged', () => {
    const p = addFlag(defaultProgress(), Q1);
    expect(isFlagged(p, Q1.templateId, Q1.seed)).toBe(true);
  });

  it('is not flagged before being added', () => {
    expect(isFlagged(defaultProgress(), Q1.templateId, Q1.seed)).toBe(false);
  });

  it('keys on (templateId, seed) together - same templateId, different seed is a different flag', () => {
    let p = addFlag(defaultProgress(), Q1);
    p = addFlag(p, { ...Q1, seed: 99 });
    expect(Object.keys(p.flagged).sort()).toEqual([flagKey(Q1.templateId, 42), flagKey(Q1.templateId, 99)].sort());
  });

  it('removeFlag removes only the targeted flag', () => {
    let p = addFlag(defaultProgress(), Q1);
    p = addFlag(p, Q2);
    p = removeFlag(p, Q1.templateId, Q1.seed);
    expect(isFlagged(p, Q1.templateId, Q1.seed)).toBe(false);
    expect(isFlagged(p, Q2.templateId, Q2.seed)).toBe(true);
  });

  it('removing a never-flagged question is a no-op', () => {
    const p = removeFlag(defaultProgress(), 'nonexistent', 1);
    expect(p.flagged).toEqual({});
  });

  it('flaggedEntries lists most-recently-flagged first', async () => {
    let p = addFlag(defaultProgress(), Q1);
    // Real timestamps, not mocked - a tiny real delay guarantees a distinct flaggedAt to sort by.
    await new Promise((r) => setTimeout(r, 2));
    p = addFlag(p, Q2);
    const entries = flaggedEntries(p);
    expect(entries.map((e) => e.templateId)).toEqual([Q2.templateId, Q1.templateId]);
  });

  it('does not mutate the progress object passed in', () => {
    const before = defaultProgress();
    addFlag(before, Q1);
    expect(before.flagged).toEqual({});
  });
});
