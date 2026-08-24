// Word Knowledge vocabulary engine tests.
//
// Tests the registrars (registerWords, registerMorphemes, registerPairs) that validate the
// bank's data at import time, plus utility functions (looksLikeHeadword, suffixPos) and the
// invariants the bank must hold (concept ownership, headword uniqueness, confusables differ).
//
// Each validator guard gets a test that feeds it input that SHOULD fail and asserts it does.
// A guard that has never rejected anything is indistinguishable from a dead one.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../templates/index.js';
import { allTemplates, generateInstance, templatesFor } from '../generator.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import {
  registerWords, looksLikeHeadword, allWords, getWord, wordsFor, _resetWords,
} from '../words.js';
import {
  registerMorphemes, registerPairs, allMorphemes, allPairs, morphemesFor, pairsFor,
  _resetMorphology,
} from '../morphology.js';

// The template files registered the REAL bank into words.js and morphology.js at import time,
// and those registries are module-level singletons. `_resetWords()` / `_resetMorphology()` clear
// the same maps, so a rejection test that resets and then registers a fake row leaves the bank
// holding that fake row for every block that follows. Sections C-E then either blow up (a
// morpheme's declared confusion no longer exists) or, worse, pass vacuously against an empty
// array. Snapshot the real rows now and put them back after every destructive test.
const REAL_WORDS = allWords();
const REAL_MORPHEMES = allMorphemes();
const REAL_PAIRS = allPairs();

function restoreBank() {
  _resetWords();
  _resetMorphology();
  registerWords(REAL_WORDS);
  registerMorphemes(REAL_MORPHEMES);
  registerPairs(REAL_PAIRS);
}

// A slate is five options and the registrar checks all five, so a fixture that declares only
// `answer` trips "empty option" long before it reaches the guard under test.
const FULL_SLATE = { antonym: 'opposite', related: 'nearby', decoy: 'unrelated' };

// --- A. VALIDATOR REJECTION tests -------------------------------------------

describe('registerWords validator rejection', () => {
  beforeEach(() => _resetWords());
  afterEach(restoreBank);

  it('rejects a row with no id', () => {
    expect(() => registerWords([{ word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow('needs an id');
  });

  it('rejects duplicate word ids', () => {
    registerWords([{
      id: 'wk-dup', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' }, ...FULL_SLATE,
    }]);
    expect(() => registerWords([{
      id: 'wk-dup', word: 'another', answer: 'sense', gloss: 'def2', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'third', meaning: 'diff2' },
    }]))
      .toThrow(/duplicate word id/);
  });

  it('rejects missing word, answer, or gloss', () => {
    expect(() => registerWords([{ id: 'wk-bad', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow(/word, answer and gloss/);
  });

  it('rejects invalid part of speech', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'badpos', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow(/pos must be one of/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 0, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects invalid charge', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'badcharge', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow(/charge must be one of/);
  });

  it('rejects rows with no concepts', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: [], confusable: { word: 'other', meaning: 'diff' } }]))
      .toThrow(/declares no concepts/);
  });

  it('rejects missing confusable', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'] }]))
      .toThrow(/confusable.*word, meaning/);
  });

  it('rejects confusable that is the headword itself', () => {
    expect(() => registerWords([{ id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'test', meaning: 'same' } }]))
      .toThrow(/confusable is the headword itself/);
  });

  it('rejects duplicate headwords in the bank', () => {
    registerWords([{ id: 'wk-first', word: 'unique', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' }, ...FULL_SLATE }]);
    expect(() => registerWords([{ id: 'wk-second', word: 'UNIQUE', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'third', meaning: 'diff2' } }]))
      .toThrow(/already in the bank/);
  });

  // A blank ANSWER is caught earlier by the word/answer/gloss guard, so the empty-option guard
  // has to be reached through one of the four distractor slots.
  it('rejects empty options on the slate', () => {
    expect(() => registerWords([{
      id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'], confusable: { word: 'other', meaning: 'diff' },
      antonym: 'opposite', related: 'nearby', decoy: '   ',
    }]))
      .toThrow(/empty option/);
  });

  it('rejects duplicate options (same word, case-insensitive)', () => {
    expect(() => registerWords([{
      id: 'wk-bad', word: 'test', answer: 'correct', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'],
      antonym: 'wrong', related: 'CORRECT', decoy: 'false',
      confusable: { word: 'other', meaning: 'diff' },
    }]))
      .toThrow(/appears twice/);
  });

  it('rejects options that look like the headword', () => {
    expect(() => registerWords([{
      id: 'wk-bad', word: 'gregarious', answer: 'sociable', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'],
      antonym: 'reclusive', related: 'popular', decoy: 'friendly',
      confusable: { word: 'other', meaning: 'gregariousness' },
    }]))
      .toThrow(/gives away the headword/);
  });

  it('rejects part-of-speech outlier options', () => {
    expect(() => registerWords([{
      id: 'wk-bad', word: 'gregarious', answer: 'sociable', gloss: 'a definition', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'],
      antonym: 'reclusive', related: 'friendly', decoy: 'ponder',
      confusable: { word: 'garrulous', meaning: 'talkative' },
    }]))
      .toThrow(/reads as a verb.*reads as a adj/);
  });

  it('rejects sentences that do not contain the headword', () => {
    expect(() => registerWords([{
      id: 'wk-bad', word: 'test', answer: 'meaning', gloss: 'def', pos: 'adj', band: 1, charge: 'pos', concepts: ['c1'],
      antonym: 'wrong', related: 'related', decoy: 'false',
      confusable: { word: 'other', meaning: 'diff' },
      sentence: 'This sentence is missing the word.',
    }]))
      .toThrow(/sentence does not contain the headword/);
  });
});

describe('registerMorphemes validator rejection', () => {
  beforeEach(() => _resetMorphology());
  afterEach(restoreBank);

  it('rejects a morpheme with no id', () => {
    expect(() => registerMorphemes([{ form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow('needs an id');
  });

  it('rejects duplicate morpheme ids', () => {
    registerMorphemes([{ id: 'dup', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }, { word: 'ardent', gloss: 'eager' }] }]);
    expect(() => registerMorphemes([{ id: 'dup', form: 'other-', kind: 'root', sense: 'thing', origin: 'Greek', band: 1, concepts: ['c1'], examples: [{ word: 'other', gloss: 'different' }, { word: 'another', gloss: 'more' }] }]))
      .toThrow(/duplicate morpheme id/);
  });

  it('rejects invalid kind', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'badkind', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow(/kind must be root, prefix or suffix/);
  });

  it('rejects missing form or sense', () => {
    expect(() => registerMorphemes([{ id: 'bad', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow(/needs a form and a sense/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 6, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects morphemes with no concepts', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: [], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow(/declares no concepts/);
  });

  it('rejects fewer than two examples', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'arduous', gloss: 'hard' }] }]))
      .toThrow(/at least two example words/);
  });

  it('rejects examples missing word or gloss', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ gloss: 'hard' }, { word: 'ardent', gloss: 'eager' }] }]))
      .toThrow(/example needs a word and a gloss/);
  });

  it('rejects examples that do not visibly contain the form', () => {
    expect(() => registerMorphemes([{ id: 'bad', form: 'ard-', kind: 'root', sense: 'to burn', origin: 'Latin', band: 1, concepts: ['c1'], examples: [{ word: 'unrelated', gloss: 'not ard' }, { word: 'ardent', gloss: 'eager' }] }]))
      .toThrow(/does not visibly contain/);
  });
});

describe('registerPairs validator rejection', () => {
  beforeEach(() => _resetMorphology());
  afterEach(restoreBank);

  it('rejects a pair with no id', () => {
    expect(() => registerPairs([{ a: { word: 'historic', pos: 'adj', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 1, concepts: ['c1'] }]))
      .toThrow('needs an id');
  });

  it('rejects duplicate pair ids', () => {
    registerPairs([{ id: 'dup', a: { word: 'historic', pos: 'adj', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 1, concepts: ['c1'] }]);
    expect(() => registerPairs([{ id: 'dup', a: { word: 'other', pos: 'adj', gloss: 'first' }, b: { word: 'another', pos: 'adj', gloss: 'second' }, tell: 'different', band: 1, concepts: ['c1'] }]))
      .toThrow(/duplicate pair id/);
  });

  it('rejects pairs missing required fields', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'adj' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 1, concepts: ['c1'] }]))
      .toThrow(/each with a word and a gloss/);
  });

  it('rejects invalid part of speech', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'badpos', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 1, concepts: ['c1'] }]))
      .toThrow(/pos must be one of/);
  });

  it('rejects pairs where both halves are the same word', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'same', pos: 'adj', gloss: 'first' }, b: { word: 'SAME', pos: 'adj', gloss: 'second' }, tell: 'different', band: 1, concepts: ['c1'] }]))
      .toThrow(/both halves are the same word/);
  });

  it('rejects pairs where both halves have the same gloss', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'adj', gloss: 'same' }, b: { word: 'historical', pos: 'adj', gloss: 'same' }, tell: 'different', band: 1, concepts: ['c1'] }]))
      .toThrow(/same gloss/);
  });

  it('rejects pairs with no tell', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'adj', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, band: 1, concepts: ['c1'] }]))
      .toThrow(/needs a tell/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'adj', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 0, concepts: ['c1'] }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects pairs with no concepts', () => {
    expect(() => registerPairs([{ id: 'bad', a: { word: 'historic', pos: 'adj', gloss: 'important' }, b: { word: 'historical', pos: 'adj', gloss: 'set in past' }, tell: 'historic matters', band: 1, concepts: [] }]))
      .toThrow(/declares no concepts/);
  });
});

// --- B. UTILITY FUNCTION tests --------------------------------------------------

describe('looksLikeHeadword', () => {
  it('returns true when option contains the headword', () => {
    expect(looksLikeHeadword('arduous', 'arduousness')).toBe(true);
  });

  it('returns true when headword contains the option', () => {
    expect(looksLikeHeadword('gregariousness', 'gregarious')).toBe(true);
  });

  it('returns true when they share a six-character prefix', () => {
    expect(looksLikeHeadword('gregarious', 'gregariousness')).toBe(true);
  });

  it('returns false when they are a real confusable (3-char overlap)', () => {
    expect(looksLikeHeadword('arduous', 'ardent')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(looksLikeHeadword('GREGARIOUS', 'gregariousness')).toBe(true);
  });

  // `norm` trims and collapses runs of whitespace; it does not delete spaces, so 'set free' and
  // 'setfree' are correctly different strings. Every headword in the bank is one word anyway.
  it('ignores surrounding and repeated whitespace', () => {
    expect(looksLikeHeadword('  GREGARIOUS ', 'gregariousness')).toBe(true);
    expect(looksLikeHeadword('set  free', 'a set free man')).toBe(true);
  });
});

// --- C. BANK INVARIANTS over real registered rows ------

describe('Word Knowledge bank invariants', () => {
  const vocabTemplates = templatesFor('WK');
  const vocabChapters = CHAPTERS.filter((c) => c.subtest === 'WK');
  const allWordsInBank = allWords();
  if (allWordsInBank.length === 0) throw new Error('the word bank is empty at collection time - every invariant below would pass vacuously');
  const declaredConcepts = new Set(vocabChapters.flatMap((c) => c.concepts));

  it('every headword in the bank is unique (case-insensitive)', () => {
    const seen = new Map();
    for (const w of allWordsInBank) {
      const norm = w.word.toLowerCase();
      if (seen.has(norm)) {
        expect.fail(`headword "${w.word}" is duplicated (also ${seen.get(norm)})`);
      }
      seen.set(norm, w.id);
    }
  });

  it('every word row declares concepts owned by its chapter', () => {
    for (const w of allWordsInBank) {
      const chapter = vocabChapters.find((c) => c.id === w.chapter);
      expect(chapter, `word ${w.id} in unknown chapter ${w.chapter}`).toBeTruthy();
      for (const c of w.concepts) {
        expect(chapter.concepts, `word ${w.id} claims concept "${c}" but chapter ${w.chapter} does not own it`).toContain(c);
      }
    }
  });

  it('every word row sentence contains its headword', () => {
    for (const w of allWordsInBank) {
      if (!w.sentence) continue;
      const pattern = new RegExp(w.word.slice(0, Math.max(4, w.word.length - 3)), 'i');
      expect(pattern.test(w.sentence), `word ${w.id}: sentence does not contain "${w.word}"`).toBe(true);
    }
  });

  it('confusable.word differs from headword for every row', () => {
    for (const w of allWordsInBank) {
      expect(w.confusable.word.toLowerCase()).not.toBe(w.word.toLowerCase());
    }
  });

  it('every pair row has halves with distinct parts of speech or glosses', () => {
    expect(allPairs().length, 'the pair bank is empty - this test would pass vacuously').toBeGreaterThan(0);
    for (const p of allPairs()) {
      expect(p.a.word.toLowerCase()).not.toBe(p.b.word.toLowerCase());
      expect(p.a.gloss.toLowerCase()).not.toBe(p.b.gloss.toLowerCase());
    }
  });

  it('every pair row declares concepts owned by its chapter', () => {
    expect(allPairs().length, 'the pair bank is empty - this test would pass vacuously').toBeGreaterThan(0);
    for (const p of allPairs()) {
      const chapter = vocabChapters.find((c) => c.id === p.chapter);
      expect(chapter, `pair ${p.id} in unknown chapter ${p.chapter}`).toBeTruthy();
      for (const c of p.concepts) {
        expect(chapter.concepts, `pair ${p.id} claims concept "${c}" but chapter ${p.chapter} does not own it`).toContain(c);
      }
    }
  });
});

// --- D. DETERMINISM test -------------------------------------------------------

describe('generateInstance determinism', () => {
  it('emits byte-identical output for the same templateId and seed', () => {
    const templates = templatesFor('WK').filter((t) => t.id.includes('wk-'));
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates.slice(0, 5)) {
      const seed = 42;
      const q1 = generateInstance(t.id, seed);
      const q2 = generateInstance(t.id, seed);
      expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
    }
  });
});

// --- E. SLATE INTEGRITY over WK templates ------------------------------------

describe('WK template slate integrity', () => {
  const wkTemplates = templatesFor('WK');

  it.each(wkTemplates.map((t) => [t.id, t]))('%s generates five distinct options', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const q = generateInstance(id, seed);
      const normalized = q.choices.map((c) => String(c).trim().toLowerCase());
      const unique = new Set(normalized);
      expect(unique.size, `${id} seed ${seed}: ${normalized.length} choices but only ${unique.size} distinct`).toBe(5);
    }
  });

  it.each(wkTemplates.map((t) => [t.id, t]))('%s has correctIndex in valid range', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const q = generateInstance(id, seed);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(5);
    }
  });

  it.each(wkTemplates.map((t) => [t.id, t]))('%s never offers the correct answer as a distractor option', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const q = generateInstance(id, seed);
      const correctChoice = q.choices[q.correctIndex];
      for (let j = 0; j < q.choices.length; j++) {
        if (j === q.correctIndex) continue;
        expect(String(q.choices[j]).trim().toLowerCase()).not.toBe(String(correctChoice).trim().toLowerCase());
      }
    }
  });
});
