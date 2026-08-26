// Situational Judgment scenario engine tests.
//
// Tests registerScenarios' validators, scenarioTemplates' 5-row floor, the bank invariants the
// real SJT data must hold, the MOST/LEAST sheet-pairing mechanism this engine is genuinely novel
// for (see engine/judgment.js's header - it reuses the SHEET_BITS split built for Table Reading
// and Block Counting, but nothing else in this codebase pairs two DIFFERENT questions off one
// fixed item the way this does), determinism, and slate integrity.
//
// Each validator guard gets a test that feeds it input that SHOULD fail and asserts it does.
// A guard that has never rejected anything is indistinguishable from a dead one.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../templates/index.js';
import { generateInstance, templatesFor, composeSeed } from '../generator.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import {
  registerScenarios, scenarioTemplates, allScenarios, scenariosFor, COMPETENCIES, _resetScenarios,
} from '../judgment.js';

// The template files registered the REAL bank into judgment.js at import time, and that registry
// is a module-level singleton. `_resetScenarios()` clears the same map, so a rejection test that
// resets and then registers a fake row leaves the bank holding that fake row for every block that
// follows - see rule 12 in HANDOFF.md section 3 and `words.test.js`'s `restoreBank`, which this
// copies.
const REAL_SCENARIOS = allScenarios();

function restoreBank() {
  _resetScenarios();
  registerScenarios(REAL_SCENARIOS);
}

const VALID_ACTION = (n) => ({
  text: `Do the fixture thing number ${n}, which is distinct from every other fixture action.`,
  competency: 'leadership',
  rationale: `Fixture rationale explaining why fixture action ${n} is more or less effective.`,
});

const BASE_SCENARIO = {
  id: 'fx-scenario',
  chapter: 'sjt-03-leadership',
  concepts: ['sjt-situational-authority'],
  band: 1,
  situation: 'This is a fixture situation long enough to clear the forty-character placeholder floor the validator enforces on real scenario prose.',
  actions: [VALID_ACTION(0), VALID_ACTION(1), VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4)],
  mostEffective: 0,
  leastEffective: 1,
  tell: 'Fixture tell naming the transferable judgment principle at stake.',
};

// --- A. VALIDATOR REJECTION tests -------------------------------------------

describe('registerScenarios validator rejection', () => {
  beforeEach(() => _resetScenarios());
  afterEach(restoreBank);

  it('rejects a row with no id', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: undefined }]))
      .toThrow('scenario row needs an id');
  });

  it('rejects a duplicate scenario id', () => {
    registerScenarios([BASE_SCENARIO]);
    expect(() => registerScenarios([{ ...BASE_SCENARIO, situation: BASE_SCENARIO.situation + ' Extra text to keep it distinct.' }]))
      .toThrow(/duplicate scenario id/);
  });

  it('rejects a row with no chapter', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', chapter: undefined }]))
      .toThrow(/needs a chapter/);
  });

  it('rejects a row with no concepts', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', concepts: [] }]))
      .toThrow(/declares no concepts/);
  });

  it('rejects band outside 1-5', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', band: 6 }]))
      .toThrow(/band must be 1-5/);
  });

  it('rejects a placeholder situation under 40 characters', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', situation: 'Too short.' }]))
      .toThrow(/situation must be real scenario prose/);
  });

  it('rejects a situation that is missing entirely', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', situation: undefined }]))
      .toThrow(/situation must be real scenario prose/);
  });

  it('rejects fewer than 5 actions', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', actions: [VALID_ACTION(0), VALID_ACTION(1)] }]))
      .toThrow(/needs exactly 5 actions/);
  });

  it('rejects more than 5 actions', () => {
    expect(() => registerScenarios([{
      ...BASE_SCENARIO, id: 'fx-1',
      actions: [VALID_ACTION(0), VALID_ACTION(1), VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4), VALID_ACTION(5)],
    }]))
      .toThrow(/needs exactly 5 actions/);
  });

  it('rejects an action missing text', () => {
    const actions = [{ ...VALID_ACTION(0), text: '' }, VALID_ACTION(1), VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4)];
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', actions }]))
      .toThrow(/needs text/);
  });

  it('rejects an action with an invalid competency', () => {
    const actions = [{ ...VALID_ACTION(0), competency: 'not-a-real-competency' }, VALID_ACTION(1), VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4)];
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', actions }]))
      .toThrow(/competency must be one of/);
  });

  it('rejects an action missing a rationale', () => {
    const actions = [{ ...VALID_ACTION(0), rationale: '' }, VALID_ACTION(1), VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4)];
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', actions }]))
      .toThrow(/needs a rationale/);
  });

  it('rejects two actions with identical text', () => {
    const dup = VALID_ACTION(0);
    const actions = [dup, { ...dup }, VALID_ACTION(2), VALID_ACTION(3), VALID_ACTION(4)];
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', actions }]))
      .toThrow(/two actions have the same text/);
  });

  it('rejects mostEffective out of range', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', mostEffective: 9 }]))
      .toThrow(/mostEffective must index into actions/);
  });

  it('rejects leastEffective out of range', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', leastEffective: -1 }]))
      .toThrow(/leastEffective must index into actions/);
  });

  it('rejects mostEffective and leastEffective being the same action', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', mostEffective: 2, leastEffective: 2 }]))
      .toThrow(/must be different actions/);
  });

  it('rejects a row with no tell', () => {
    expect(() => registerScenarios([{ ...BASE_SCENARIO, id: 'fx-1', tell: '' }]))
      .toThrow(/needs a tell/);
  });
});

describe('scenarioTemplates 5-row floor', () => {
  beforeEach(() => _resetScenarios());
  afterEach(restoreBank);

  it('produces nothing for a chapter+band under 5 rows', () => {
    registerScenarios([
      { ...BASE_SCENARIO, id: 'fx-1' },
      { ...BASE_SCENARIO, id: 'fx-2' },
    ]);
    const made = scenarioTemplates({ chapter: 'sjt-03-leadership', band: 1, idBase: 'fx-floor', name: 'fixture' });
    expect(made).toEqual([]);
  });

  it('registers exactly one template once the floor is reached', () => {
    registerScenarios([
      { ...BASE_SCENARIO, id: 'fx-1' }, { ...BASE_SCENARIO, id: 'fx-2' }, { ...BASE_SCENARIO, id: 'fx-3' },
      { ...BASE_SCENARIO, id: 'fx-4' }, { ...BASE_SCENARIO, id: 'fx-5' },
    ]);
    const made = scenarioTemplates({ chapter: 'sjt-03-leadership', band: 1, idBase: 'fx-floor2', name: 'fixture' });
    expect(made.length).toBe(1);
    expect(made[0].id).toBe('fx-floor2-judge');
  });
});

// --- B. BANK INVARIANTS over real registered rows ------

describe('Situational Judgment bank invariants', () => {
  const rows = allScenarios();
  const sjtChapters = CHAPTERS.filter((c) => c.track === 'judgment');
  if (rows.length === 0) throw new Error('the SJT scenario bank is empty at collection time - every invariant below would pass vacuously');

  it('every scenario id is unique', () => {
    const seen = new Set();
    for (const r of rows) {
      expect(seen.has(r.id), `duplicate scenario id: ${r.id}`).toBe(false);
      seen.add(r.id);
    }
  });

  it('every scenario declares concepts owned by its chapter', () => {
    for (const r of rows) {
      const chapter = sjtChapters.find((c) => c.id === r.chapter);
      expect(chapter, `scenario ${r.id} in unknown chapter ${r.chapter}`).toBeTruthy();
      for (const c of r.concepts) {
        expect(chapter.concepts, `scenario ${r.id} claims concept "${c}" but chapter ${r.chapter} does not own it`).toContain(c);
      }
    }
  });

  it('every action competency is one of the six exported COMPETENCIES', () => {
    for (const r of rows) {
      for (const act of r.actions) {
        expect(COMPETENCIES, `${r.id}: "${act.competency}" is not a real competency`).toContain(act.competency);
      }
    }
  });

  it('every band is in range 1-5', () => {
    for (const r of rows) {
      expect(r.band).toBeGreaterThanOrEqual(1);
      expect(r.band).toBeLessThanOrEqual(5);
    }
  });

  it('mostEffective and leastEffective always differ and stay in range', () => {
    for (const r of rows) {
      expect(r.mostEffective).not.toBe(r.leastEffective);
      expect(r.mostEffective).toBeGreaterThanOrEqual(0);
      expect(r.mostEffective).toBeLessThanOrEqual(4);
      expect(r.leastEffective).toBeGreaterThanOrEqual(0);
      expect(r.leastEffective).toBeLessThanOrEqual(4);
    }
  });

  it('every scenario has exactly 5 actions, each with text, a real competency, and a rationale', () => {
    for (const r of rows) {
      expect(r.actions.length, `${r.id}: expected 5 actions`).toBe(5);
      for (const act of r.actions) {
        expect(act.text?.trim(), `${r.id}: action missing text`).toBeTruthy();
        expect(act.rationale?.trim(), `${r.id}: action missing rationale`).toBeTruthy();
        expect(COMPETENCIES).toContain(act.competency);
      }
    }
  });
});

// --- C. relationsFor-style filter: scenariosFor() ---------------------------

describe('scenariosFor', () => {
  it('returns only rows for the given chapter and band', () => {
    const rows = scenariosFor('sjt-03-leadership', 3);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.chapter).toBe('sjt-03-leadership');
      expect(r.band).toBe(3);
    }
  });

  it('returns rows for a chapter across all bands when band is omitted', () => {
    const rows = scenariosFor('sjt-03-leadership');
    const bands = new Set(rows.map((r) => r.band));
    expect(bands.size).toBeGreaterThan(1);
  });
});

// --- D. THE MOST/LEAST SHEET-PAIRING MECHANISM ---------------------------------
// The one thing genuinely novel to this engine (see the header comment in engine/judgment.js):
// composeSeed(sheetSeed, 0) and composeSeed(sheetSeed, 1) must always reference the SAME
// underlying situation and flip MOST -> LEAST between the two draws.

describe('MOST/LEAST sheet pairing', () => {
  const sjtTemplates = templatesFor('SJ').filter((t) => t.id.endsWith('-judge'));
  if (sjtTemplates.length === 0) throw new Error('no SJT -judge templates registered at collection time');

  it.each(sjtTemplates.map((t) => [t.id, t]))('%s: item 0 and item 1 of one sheet seed reference the same situation, tagged MOST then LEAST', (id) => {
    let checked = 0;
    for (let sheetSeed = 0; sheetSeed < 200; sheetSeed++) {
      const seedMost = composeSeed(sheetSeed, 0);
      const seedLeast = composeSeed(sheetSeed, 1);
      const qMost = generateInstance(id, seedMost);
      const qLeast = generateInstance(id, seedLeast);
      expect(qMost, `${id} seed ${seedMost} generated nothing`).toBeTruthy();
      expect(qLeast, `${id} seed ${seedLeast} generated nothing`).toBeTruthy();
      // Same underlying situation: both stems embed the same situation prose (the stem is the
      // situation text plus a MOST/LEAST instruction line appended to it).
      const situationOf = (q) => q.stem.split('\n\nSelect the')[0];
      expect(situationOf(qMost), `seed ${sheetSeed}: item 0/1 did not reference the same situation`).toBe(situationOf(qLeast));
      expect(qMost.stem, `seed ${sheetSeed}: item 0 was not tagged MOST`).toMatch(/MOST EFFECTIVE/);
      expect(qLeast.stem, `seed ${sheetSeed}: item 1 was not tagged LEAST`).toMatch(/LEAST EFFECTIVE/);
      checked++;
    }
    expect(checked).toBe(200);
  });
});

// --- E. DETERMINISM test -------------------------------------------------------

describe('generateInstance determinism (SJT)', () => {
  it('emits byte-identical output for the same templateId and seed', () => {
    const templates = templatesFor('SJ');
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      const seed = composeSeed(42, 0);
      const q1 = generateInstance(t.id, seed);
      const q2 = generateInstance(t.id, seed);
      expect(JSON.stringify(q1)).toBe(JSON.stringify(q2));
    }
  });
});

// --- F. SLATE INTEGRITY over SJT templates ------------------------------------

describe('SJT template slate integrity', () => {
  const sjtTemplates = templatesFor('SJ');

  it.each(sjtTemplates.map((t) => [t.id, t]))('%s generates five distinct options', (id) => {
    for (let sheetSeed = 0; sheetSeed < 100; sheetSeed++) {
      for (const item of [0, 1]) {
        const q = generateInstance(id, composeSeed(sheetSeed, item));
        const normalized = q.choices.map((c) => String(c).trim().toLowerCase());
        const unique = new Set(normalized);
        expect(unique.size, `${id} sheetSeed ${sheetSeed} item ${item}: ${normalized.length} choices but only ${unique.size} distinct`).toBe(5);
      }
    }
  });

  it.each(sjtTemplates.map((t) => [t.id, t]))('%s has correctIndex in valid range', (id) => {
    for (let sheetSeed = 0; sheetSeed < 100; sheetSeed++) {
      for (const item of [0, 1]) {
        const q = generateInstance(id, composeSeed(sheetSeed, item));
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(5);
      }
    }
  });
});
