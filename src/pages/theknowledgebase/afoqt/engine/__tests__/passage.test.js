// Reading Comprehension passage engine tests.
//
// Tests registerPassages' validators, the bank invariants the real RC data must hold,
// determinism, and slate integrity across every registered passageTemplates() output.
//
// Each validator guard gets a test that feeds it input that SHOULD fail and asserts it does.
// A guard that has never rejected anything is indistinguishable from a dead one.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../templates/index.js';
import { generateInstance, templatesFor } from '../generator.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import { registerPassages, allPassages, _resetPassages } from '../passage.js';

// The template files registered the REAL bank into passage.js at import time, and that registry
// is a module-level singleton. `_resetPassages()` clears the same map, so a rejection test that
// resets and then registers a fake passage leaves the bank holding that fake passage for every
// block that follows - see rule 12 in HANDOFF.md section 3 and `words.test.js`'s `restoreBank`,
// which this copies.
const REAL_PASSAGES = allPassages();

function restoreBank() {
  _resetPassages();
  registerPassages(REAL_PASSAGES);
}

const VALID_QUESTION = {
  type: 'main-idea',
  stem: 'What is the main idea?',
  choices: ['A', 'B', 'C', 'D', 'E'],
  correctIndex: 0,
  why: 'Because A is correct.',
};

const BASE_PASSAGE = {
  id: 'fx-passage', wordCount: 450, band: 2, lineNumbered: true,
  text: 'Line one of the fixture passage.\nLine two of the fixture passage.',
  questions: [VALID_QUESTION],
};

// --- A. VALIDATOR REJECTION tests -------------------------------------------

describe('registerPassages validator rejection', () => {
  beforeEach(() => _resetPassages());
  afterEach(restoreBank);

  it('rejects a passage with no id', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: undefined }]))
      .toThrow(/missing id/);
  });

  it('rejects a duplicate passage id', () => {
    registerPassages([BASE_PASSAGE]);
    expect(() => registerPassages([{ ...BASE_PASSAGE, text: 'Different.\nText.' }]))
      .toThrow(/Duplicate passage id/);
  });

  it('rejects wordCount below 400', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', wordCount: 100 }]))
      .toThrow(/wordCount must be 400-600/);
  });

  it('rejects wordCount above 600', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', wordCount: 700 }]))
      .toThrow(/wordCount must be 400-600/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', band: 6 }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects missing text', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', text: '' }]))
      .toThrow(/text is missing or invalid/);
  });

  it('rejects lineNumbered that is not a boolean', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', lineNumbered: 'yes' }]))
      .toThrow(/lineNumbered must be a boolean/);
  });

  it('rejects lineNumbered: true with no newline in text', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', text: 'One single unbroken line with no breaks at all.' }]))
      .toThrow(/lineNumbered but text has no/);
  });

  it('rejects a passage with no questions', () => {
    expect(() => registerPassages([{ ...BASE_PASSAGE, id: 'fx-1', questions: [] }]))
      .toThrow(/must have questions/);
  });

  it('rejects a question with an invalid type', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, type: 'not-a-real-type' }],
    }]))
      .toThrow(/invalid type/);
  });

  it('rejects a question missing a stem', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, stem: undefined }],
    }]))
      .toThrow(/missing stem/);
  });

  it('rejects two questions with a duplicate stem within one passage', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [VALID_QUESTION, { ...VALID_QUESTION, why: 'Different why.' }],
    }]))
      .toThrow(/duplicate stem/);
  });

  it('rejects a question without exactly 5 choices', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, choices: ['A', 'B', 'C'] }],
    }]))
      .toThrow(/must have exactly 5 choices/);
  });

  it('rejects a question with duplicate choices', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, choices: ['A', 'A', 'C', 'D', 'E'] }],
    }]))
      .toThrow(/duplicate choices/);
  });

  it('rejects correctIndex out of range', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, correctIndex: 9 }],
    }]))
      .toThrow(/correctIndex out of range/);
  });

  it('rejects a question missing why', () => {
    expect(() => registerPassages([{
      ...BASE_PASSAGE, id: 'fx-1', questions: [{ ...VALID_QUESTION, why: undefined }],
    }]))
      .toThrow(/missing why explanation/);
  });
});

// --- B. BANK INVARIANTS over real registered rows ------

describe('Reading Comprehension bank invariants', () => {
  const rcPassages = allPassages();
  const rcChapters = CHAPTERS.filter((c) => c.subtest === 'RC');
  if (rcPassages.length === 0) throw new Error('the RC passage bank is empty at collection time - every invariant below would pass vacuously');

  const VALID_TYPES = new Set([
    'main-idea', 'vocabulary-in-context', 'detail-inference', 'function-of-paragraph', 'author-agreement',
  ]);

  it('every passage id is unique', () => {
    const seen = new Set();
    for (const p of rcPassages) {
      expect(seen.has(p.id), `duplicate passage id: ${p.id}`).toBe(false);
      seen.add(p.id);
    }
  });

  it('every passage word count is 400-600', () => {
    for (const p of rcPassages) {
      expect(p.wordCount, `${p.id}: wordCount out of range`).toBeGreaterThanOrEqual(400);
      expect(p.wordCount).toBeLessThanOrEqual(600);
    }
  });

  it('every passage band is 1-5', () => {
    for (const p of rcPassages) {
      expect(p.band).toBeGreaterThanOrEqual(1);
      expect(p.band).toBeLessThanOrEqual(5);
    }
  });

  it('every lineNumbered passage has at least one newline in its text', () => {
    for (const p of rcPassages) {
      if (p.lineNumbered) expect(p.text.includes('\n'), `${p.id}: lineNumbered but no newline`).toBe(true);
    }
  });

  it('every question has a valid type and exactly 5 distinct choices', () => {
    for (const p of rcPassages) {
      for (const q of p.questions) {
        expect(VALID_TYPES.has(q.type), `${p.id}: invalid question type ${q.type}`).toBe(true);
        expect(q.choices.length, `${p.id}: ${q.type} does not have 5 choices`).toBe(5);
        expect(new Set(q.choices).size, `${p.id}: ${q.type} has duplicate choices`).toBe(5);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(5);
      }
    }
  });

  it('every question has a non-empty why explanation', () => {
    for (const p of rcPassages) {
      for (const q of p.questions) {
        expect(q.why, `${p.id}: ${q.type} missing why`).toBeTruthy();
      }
    }
  });

  it('a vocabulary-in-context stem referencing "line N" points at a real line containing the quoted word', () => {
    let checked = 0;
    for (const p of rcPassages) {
      const lines = p.text.split('\n');
      for (const q of p.questions) {
        if (q.type !== 'vocabulary-in-context') continue;
        const m = q.stem.match(/line (\d+), "([^"]+)"/);
        expect(m, `${p.id}: vocabulary-in-context stem does not name a line and a quoted term: "${q.stem}"`).toBeTruthy();
        const lineNum = Number(m[1]);
        const word = m[2].toLowerCase();
        const actual = (lines[lineNum - 1] ?? '').toLowerCase();
        expect(actual.includes(word), `${p.id}: line ${lineNum} does not contain "${word}" - got "${lines[lineNum - 1]}"`).toBe(true);
        checked++;
      }
    }
    expect(checked, 'no vocabulary-in-context questions were checked - this test would pass vacuously').toBeGreaterThan(0);
  });

  it('rc-* chapters exist for every question type this bank produces', () => {
    expect(rcChapters.length).toBeGreaterThan(0);
    const declaredConcepts = new Set(rcChapters.flatMap((c) => c.concepts));
    const typeToConcept = {
      'main-idea': 'rc-main-idea',
      'vocabulary-in-context': 'rc-vocabulary-in-context',
      'detail-inference': 'rc-detail-inference',
      'function-of-paragraph': 'rc-function-of-paragraph',
      'author-agreement': 'rc-author-agreement',
    };
    for (const p of rcPassages) {
      for (const q of p.questions) {
        expect(declaredConcepts.has(typeToConcept[q.type]), `${p.id}: no rc-* chapter declares ${typeToConcept[q.type]}`).toBe(true);
      }
    }
  });
});

// --- C. DETERMINISM test -------------------------------------------------------

describe('generateInstance determinism (RC)', () => {
  it('emits byte-identical output for the same templateId and seed', () => {
    const templates = templatesFor('RC');
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      const seed = 42;
      const q1 = generateInstance(t.id, seed);
      const q2 = generateInstance(t.id, seed);
      expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
    }
  });

  it('stays on the same passage for consecutive items within one sheet block', () => {
    // SHEET_BITS = 12: composing a fixed sheetSeed with different low-bit `item` values should
    // land on the same passage id (render.sheetSeed) for a run of consecutive questions, the
    // whole point of RC's sheet mode - see the header comment in engine/passage.js.
    const templates = templatesFor('RC');
    expect(templates.length).toBeGreaterThan(0);
    const t = templates[0];
    const sheetSeed = 7;
    const seeds = [0, 1, 2, 3, 4].map((item) => ((sheetSeed & 0xfffff) << 12) | item);
    const passageIds = seeds.map((s) => generateInstance(t.id, s)?.render?.sheetSeed).filter(Boolean);
    expect(passageIds.length).toBeGreaterThan(0);
    expect(new Set(passageIds).size, 'consecutive items in one sheet block landed on different passages').toBe(1);
  });
});

// --- D. SLATE INTEGRITY over RC templates ------------------------------------

describe('RC template slate integrity', () => {
  const rcTemplates = templatesFor('RC');
  if (rcTemplates.length === 0) throw new Error('no RC templates registered at collection time - every invariant below would pass vacuously');

  it.each(rcTemplates.map((t) => [t.id, t]))('%s generates five distinct options', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
      const q = generateInstance(id, seed);
      if (!q) continue;
      const normalized = q.choices.map((c) => String(c).trim().toLowerCase());
      const unique = new Set(normalized);
      expect(unique.size, `${id} seed ${seed}: ${normalized.length} choices but only ${unique.size} distinct`).toBe(5);
    }
  });

  it.each(rcTemplates.map((t) => [t.id, t]))('%s has correctIndex in valid range', (id, t) => {
    for (let i = 0; i < 100; i++) {
      const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
      const q = generateInstance(id, seed);
      if (!q) continue;
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(5);
    }
  });
});
