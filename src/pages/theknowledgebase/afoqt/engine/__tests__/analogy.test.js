// Verbal Analogies relation engine tests.
//
// Tests registerRelations' validators, relationTemplates' confusion-existence check, wordBand(),
// the bank invariants the real VA data must hold, determinism, slate integrity, and the two
// format-specific behaviors that are easy to get backwards: the -pair/-term stem shapes, and
// whether the reversed-pair distractor is (or is not) offered depending on `symmetric`.
//
// Each validator guard gets a test that feeds it input that SHOULD fail and asserts it does.
// A guard that has never rejected anything is indistinguishable from a dead one.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../templates/index.js';
import { generateInstance, templatesFor } from '../generator.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import { registerWords, allWords, _resetWords } from '../words.js';
import {
  registerRelations, relationTemplates, allRelations, relationsFor, wordBand, _resetRelations,
} from '../analogy.js';

// The template files registered the REAL bank into analogy.js and words.js at import time, and
// those registries are module-level singletons. `_resetRelations()` / `_resetWords()` clear the
// same maps, so a rejection test that resets and then registers a fake row leaves the bank
// holding that fake row for every block that follows - see rule 12 in HANDOFF.md section 3 and
// `words.test.js`'s `restoreBank`, which this copies.
const REAL_RELATIONS = allRelations();
const REAL_WORDS = allWords();

function restoreBank() {
  _resetRelations();
  _resetWords();
  registerWords(REAL_WORDS);
  registerRelations(REAL_RELATIONS);
}

const BASE_ROW = {
  id: 'fx-base', chapter: 'va-02-structure', concepts: ['va-part-whole'], band: 1,
  relation: 'fx-relation', tell: 'a fixture relation',
  a: { word: 'fixalpha', pos: 'noun' }, b: { word: 'fixbeta', pos: 'noun' },
};

// --- A. VALIDATOR REJECTION tests (registerRelations) ------------------------

describe('registerRelations validator rejection', () => {
  beforeEach(() => _resetRelations());
  afterEach(restoreBank);

  it('rejects a row with no id', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: undefined }]))
      .toThrow('relation row needs an id');
  });

  it('rejects duplicate relation ids', () => {
    registerRelations([BASE_ROW]);
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-base', a: { word: 'other', pos: 'noun' }, b: { word: 'another', pos: 'noun' } }]))
      .toThrow(/duplicate relation id/);
  });

  it('rejects a row with no chapter', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', chapter: undefined }]))
      .toThrow(/needs a chapter/);
  });

  it('rejects a row with no concepts', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', concepts: [] }]))
      .toThrow(/declares no concepts/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', band: 6 }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects a row with no relation tag', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', relation: undefined }]))
      .toThrow(/needs a relation tag/);
  });

  it('rejects a row with no tell', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', tell: undefined }]))
      .toThrow(/needs a tell/);
  });

  it('rejects a missing half.word', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', a: { pos: 'noun' } }]))
      .toThrow(/a\.word is required/);
  });

  it('rejects an invalid part of speech', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', a: { word: 'fixalpha', pos: 'badpos' } }]))
      .toThrow(/pos must be one of/);
  });

  it('rejects a and b being the same word', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', a: { word: 'same', pos: 'noun' }, b: { word: 'SAME', pos: 'noun' } }]))
      .toThrow(/a and b are the same word/);
  });

  it('rejects a duplicate pair in the same order', () => {
    registerRelations([BASE_ROW]);
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-2' }]))
      .toThrow(/duplicates the pair/);
  });

  it('rejects a duplicate pair swapped', () => {
    registerRelations([BASE_ROW]);
    expect(() => registerRelations([{
      ...BASE_ROW, id: 'fx-2', a: { word: 'fixbeta', pos: 'noun' }, b: { word: 'fixalpha', pos: 'noun' },
    }]))
      .toThrow(/duplicates the pair/);
  });

  it('rejects a confusions entry that is not a string', () => {
    expect(() => registerRelations([{ ...BASE_ROW, id: 'fx-1', confusions: [42] }]))
      .toThrow(/confusions must be ids/);
  });

  it('rejects a word whose band disagrees with the WK bank', () => {
    // "gregarious" is registered by wk/words.js (via one of the WK vocabulary chapters) at band
    // 3 in the real bank (already loaded via the templates/index.js import above). A VA row
    // reusing it at a different band is a real data defect - two subtests cannot disagree about
    // the same word's rarity. (This must come from words.js, not morphology.js's registerPairs -
    // wordBand() only reads allWords(), so a confusable-pair headword like "historic" would not
    // trip this check at all.)
    expect(() => registerRelations([{
      ...BASE_ROW, id: 'fx-1', band: 4, a: { word: 'gregarious', pos: 'adj' }, b: { word: 'fixzzz', pos: 'noun' },
    }]))
      .toThrow(/is band 3 in the WK bank but this row is band 4/);
  });
});

describe('relationTemplates confusion-existence check', () => {
  beforeEach(() => _resetRelations());
  afterEach(restoreBank);

  it('throws when a confusion names a row that does not exist', () => {
    // relationTemplates returns early (does nothing) below a 5-row floor for the chapter+band -
    // the confusion-existence check only runs once that floor is met, so the fixture needs 5
    // rows to actually reach the code under test.
    registerRelations([
      { ...BASE_ROW, id: 'fx-1', confusions: ['fx-nonexistent'] },
      { ...BASE_ROW, id: 'fx-2', a: { word: 'fixgamma', pos: 'noun' }, b: { word: 'fixdelta', pos: 'noun' } },
      { ...BASE_ROW, id: 'fx-3', a: { word: 'fixepsilon', pos: 'noun' }, b: { word: 'fixzeta', pos: 'noun' } },
      { ...BASE_ROW, id: 'fx-4', a: { word: 'fixeta', pos: 'noun' }, b: { word: 'fixtheta', pos: 'noun' } },
      { ...BASE_ROW, id: 'fx-5', a: { word: 'fixiota', pos: 'noun' }, b: { word: 'fixkappa', pos: 'noun' } },
    ]);
    expect(() => relationTemplates({ chapter: 'va-02-structure', band: 1, idBase: 'fx-t', name: 'fixture' }))
      .toThrow(/confusion "fx-nonexistent" does not exist/);
  });
});

// --- B. wordBand() -------------------------------------------------------------

describe('wordBand', () => {
  it('returns the WK band for a word in the bank', () => {
    expect(wordBand('gregarious')).toBe(3);
  });

  it('is case-insensitive', () => {
    expect(wordBand('GREGARIOUS')).toBe(3);
  });

  it('returns null for a word not in the WK bank', () => {
    expect(wordBand('zzznotarealword')).toBeNull();
  });
});

// --- C. BANK INVARIANTS over real registered rows ------

describe('Verbal Analogies bank invariants', () => {
  const vaRows = allRelations();
  const vaChapters = CHAPTERS.filter((c) => c.track === 'analogies');
  if (vaRows.length === 0) throw new Error('the VA relation bank is empty at collection time - every invariant below would pass vacuously');

  it('every relation id is unique', () => {
    const seen = new Set();
    for (const r of vaRows) {
      expect(seen.has(r.id), `duplicate relation id: ${r.id}`).toBe(false);
      seen.add(r.id);
    }
  });

  it('no pair is duplicated in either order across the whole bank', () => {
    const seen = new Map();
    for (const r of vaRows) {
      const key = [r.a.word.toLowerCase(), r.b.word.toLowerCase()].sort().join('::');
      if (seen.has(key)) {
        expect.fail(`pair "${r.a.word}"/"${r.b.word}" (${r.id}) duplicates ${seen.get(key)}`);
      }
      seen.set(key, r.id);
    }
  });

  it('every row declares concepts owned by its chapter', () => {
    for (const r of vaRows) {
      const chapter = vaChapters.find((c) => c.id === r.chapter);
      expect(chapter, `row ${r.id} in unknown chapter ${r.chapter}`).toBeTruthy();
      for (const c of r.concepts) {
        expect(chapter.concepts, `row ${r.id} claims concept "${c}" but chapter ${r.chapter} does not own it`).toContain(c);
      }
    }
  });

  it('every band is in range 1-5', () => {
    for (const r of vaRows) {
      expect(r.band).toBeGreaterThanOrEqual(1);
      expect(r.band).toBeLessThanOrEqual(5);
    }
  });

  it('every word shared with the WK bank agrees on band', () => {
    for (const r of vaRows) {
      for (const half of ['a', 'b']) {
        const wk = wordBand(r[half].word);
        if (wk != null) {
          expect(wk, `${r.id}: ${half}.word "${r[half].word}" is band ${wk} in WK but band ${r.band} here`).toBe(r.band);
        }
      }
    }
  });

  it('every confusions entry names a row that exists in the bank', () => {
    const ids = new Set(vaRows.map((r) => r.id));
    for (const r of vaRows) {
      for (const id of r.confusions ?? []) {
        expect(ids.has(id), `${r.id}: confusion "${id}" does not exist`).toBe(true);
      }
    }
  });
});

// --- D. relationsFor() ----------------------------------------------------------

describe('relationsFor', () => {
  it('returns only rows for the given chapter and band', () => {
    const rows = relationsFor('va-02-structure', 2);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.chapter).toBe('va-02-structure');
      expect(r.band).toBe(2);
    }
  });

  it('returns rows for a chapter across all bands when band is omitted', () => {
    const rows = relationsFor('va-02-structure');
    const bands = new Set(rows.map((r) => r.band));
    expect(bands.size).toBeGreaterThan(1);
  });
});

// --- E. DETERMINISM test -------------------------------------------------------

describe('generateInstance determinism (VA)', () => {
  it('emits byte-identical output for the same templateId and seed', () => {
    const templates = templatesFor('VA');
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates.slice(0, 6)) {
      const seed = 42;
      const q1 = generateInstance(t.id, seed);
      const q2 = generateInstance(t.id, seed);
      expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
    }
  });
});

// --- F. SLATE INTEGRITY over VA templates ------------------------------------

describe('VA template slate integrity', () => {
  const vaTemplates = templatesFor('VA');

  it.each(vaTemplates.map((t) => [t.id, t]))('%s generates five distinct options', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const q = generateInstance(id, seed);
      const normalized = q.choices.map((c) => String(c).trim().toLowerCase());
      const unique = new Set(normalized);
      expect(unique.size, `${id} seed ${seed}: ${normalized.length} choices but only ${unique.size} distinct`).toBe(5);
    }
  });

  it.each(vaTemplates.map((t) => [t.id, t]))('%s has correctIndex in valid range', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      const q = generateInstance(id, seed);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(5);
    }
  });
});

// --- G. FORMAT-SPECIFIC checks --------------------------------------------------

describe('VA format shapes', () => {
  const vaTemplates = templatesFor('VA');
  const pairTemplates = vaTemplates.filter((t) => t.id.endsWith('-pair'));
  const termTemplates = vaTemplates.filter((t) => t.id.endsWith('-term'));

  it('every -pair template stem ends with "as:"', () => {
    expect(pairTemplates.length).toBeGreaterThan(0);
    for (const t of pairTemplates) {
      const q = generateInstance(t.id, 1);
      expect(q.stem.trim().endsWith('as:'), `${t.id}: stem "${q.stem}" does not end with "as:"`).toBe(true);
    }
  });

  it('every -term template stem ends with "is to:"', () => {
    expect(termTemplates.length).toBeGreaterThan(0);
    for (const t of termTemplates) {
      const q = generateInstance(t.id, 1);
      expect(q.stem.trim().endsWith('is to:'), `${t.id}: stem "${q.stem}" does not end with "is to:"`).toBe(true);
    }
  });
});

describe('symmetric rows never offer the reversed base pair as a distractor', () => {
  beforeEach(() => _resetRelations());
  afterEach(restoreBank);

  it('buildMatch skips the reversed-pair distractor when symmetric is true', () => {
    _resetRelations();
    registerRelations([
      { id: 'fx-sym-1', chapter: 'va-04-meaning-degree', concepts: ['va-synonym'], band: 5, relation: 'fx-sym', symmetric: true, tell: 'fixture synonym', a: { word: 'fixalpha', pos: 'noun' }, b: { word: 'fixbeta', pos: 'noun' } },
      { id: 'fx-sym-2', chapter: 'va-04-meaning-degree', concepts: ['va-synonym'], band: 5, relation: 'fx-sym', symmetric: true, tell: 'fixture synonym', a: { word: 'fixgamma', pos: 'noun' }, b: { word: 'fixdelta', pos: 'noun' } },
      { id: 'fx-other-1', chapter: 'va-04-meaning-degree', concepts: ['va-degree'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixepsilon', pos: 'noun' }, b: { word: 'fixzeta', pos: 'noun' } },
      { id: 'fx-other-2', chapter: 'va-04-meaning-degree', concepts: ['va-degree'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixeta', pos: 'noun' }, b: { word: 'fixtheta', pos: 'noun' } },
      { id: 'fx-other-3', chapter: 'va-04-meaning-degree', concepts: ['va-degree'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixiota', pos: 'noun' }, b: { word: 'fixkappa', pos: 'noun' } },
    ]);
    const [pairTemplate] = relationTemplates({ chapter: 'va-04-meaning-degree', band: 5, idBase: 'fx-sym-test', name: 'fixture' });
    expect(pairTemplate).toBeTruthy();
    let sawSymmetricBase = false;
    for (let seed = 0; seed < 500; seed++) {
      const q = generateInstance(pairTemplate.id, seed);
      if (!q) continue;
      // Only the two symmetric rows produce "Fixalpha : Fixbeta" or "Fixgamma : Fixdelta" as the
      // stem; when the base is one of them, "Fixbeta : Fixalpha" (reversed) must never appear.
      if (/^FIXALPHA IS TO FIXBETA/i.test(q.stem)) {
        sawSymmetricBase = true;
        const reversed = q.choices.some((c) => String(c).toLowerCase() === 'fixbeta : fixalpha');
        expect(reversed, `seed ${seed}: reversed pair offered for a symmetric base row`).toBe(false);
      }
    }
    expect(sawSymmetricBase, 'never drew the symmetric fixture row as a base across 500 seeds').toBe(true);
  });

  it('buildMatch DOES offer the reversed-pair distractor when symmetric is false (default)', () => {
    _resetRelations();
    registerRelations([
      { id: 'fx-asym-1', chapter: 'va-03-cause-consequence', concepts: ['va-cause-effect'], band: 5, relation: 'fx-asym', tell: 'fixture cause', a: { word: 'fixalpha', pos: 'noun' }, b: { word: 'fixbeta', pos: 'noun' } },
      { id: 'fx-asym-2', chapter: 'va-03-cause-consequence', concepts: ['va-cause-effect'], band: 5, relation: 'fx-asym', tell: 'fixture cause', a: { word: 'fixgamma', pos: 'noun' }, b: { word: 'fixdelta', pos: 'noun' } },
      { id: 'fx-other-1', chapter: 'va-03-cause-consequence', concepts: ['va-action-object'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixepsilon', pos: 'noun' }, b: { word: 'fixzeta', pos: 'noun' } },
      { id: 'fx-other-2', chapter: 'va-03-cause-consequence', concepts: ['va-action-object'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixeta', pos: 'noun' }, b: { word: 'fixtheta', pos: 'noun' } },
      { id: 'fx-other-3', chapter: 'va-03-cause-consequence', concepts: ['va-action-object'], band: 5, relation: 'fx-other', tell: 'fixture other', a: { word: 'fixiota', pos: 'noun' }, b: { word: 'fixkappa', pos: 'noun' } },
    ]);
    const [pairTemplate] = relationTemplates({ chapter: 'va-03-cause-consequence', band: 5, idBase: 'fx-asym-test', name: 'fixture' });
    expect(pairTemplate).toBeTruthy();
    let sawReversed = false;
    for (let seed = 0; seed < 500; seed++) {
      const q = generateInstance(pairTemplate.id, seed);
      if (!q) continue;
      if (/^FIXALPHA IS TO FIXBETA/i.test(q.stem)) {
        if (q.choices.some((c) => String(c).toLowerCase() === 'fixbeta : fixalpha')) sawReversed = true;
      }
    }
    expect(sawReversed, 'the reversed-pair distractor never appeared across 500 seeds for an asymmetric row').toBe(true);
  });
});
