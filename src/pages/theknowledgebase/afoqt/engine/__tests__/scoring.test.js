import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { subtestStatKeys, subtestAccuracy, compositeAccuracy } from '../scoring.js';
import { bankItems, bankCount } from '../bank.js';
import { templatesFor } from '../generator.js';

// Subtests that actually ship a stored bank. If this list ever goes empty the regression tests
// below would pass vacuously, so it is asserted non-empty first (the anti-vacuity rule from
// HANDOFF.md section 3 rule 12).
const WITH_BANK = ['MK', 'PS', 'AR', 'WK', 'VA', 'RC'];

describe('subtestStatKeys - the bank blind spot', () => {
  it('the subtests under test genuinely have bank items (anti-vacuity guard)', () => {
    for (const code of WITH_BANK) expect(bankCount(code), `${code} has no bank items`).toBeGreaterThan(0);
  });

  it('includes BOTH generated template ids and stored bank ids', () => {
    for (const code of WITH_BANK) {
      const keys = subtestStatKeys(code);
      expect(keys.length).toBe(templatesFor(code).length + bankCount(code));
      expect(keys.some((k) => k.startsWith('bank:')), `${code} keys omit bank items`).toBe(true);
    }
  });

  it('a subtest with no bank is unaffected', () => {
    for (const code of ['TR', 'IC', 'BC', 'AI', 'SJ']) {
      expect(bankCount(code)).toBe(0);
      expect(subtestStatKeys(code).length).toBe(templatesFor(code).length);
    }
  });
});

describe('subtestAccuracy counts answered bank items', () => {
  it('a drill answered ENTIRELY from the bank still registers - it used to read as no data', () => {
    const code = 'MK';
    const ids = bankItems(code).slice(0, 5).map((b) => b.templateId);
    const templateStats = {};
    for (const id of ids) templateStats[id] = { seen: 2, correct: 1, totalMs: 4000, lastSeen: null, correctDays: [] };
    const r = subtestAccuracy({ templateStats }, code);
    expect(r.seen).toBe(10);
    expect(r.correct).toBe(5);
    expect(r.accuracy).toBeCloseTo(0.5, 5);
  });

  it('totalMs is returned so the dashboard pace column covers bank items too', () => {
    const id = bankItems('MK')[0].templateId;
    const r = subtestAccuracy({ templateStats: { [id]: { seen: 4, correct: 4, totalMs: 8000, lastSeen: null, correctDays: [] } } }, 'MK');
    expect(r.totalMs).toBe(8000);
  });

  it('still returns null - not 0 - when nothing at all has been attempted', () => {
    expect(subtestAccuracy({ templateStats: {} }, 'MK').accuracy).toBeNull();
  });
});

describe('compositeAccuracy inherits the fix', () => {
  it('a composite whose only evidence is bank items is no longer reported as untouched', () => {
    // QUANT = Arithmetic Reasoning + Math Knowledge, both of which have banks.
    const templateStats = {};
    for (const code of ['AR', 'MK']) {
      for (const b of bankItems(code).slice(0, 3)) {
        templateStats[b.templateId] = { seen: 2, correct: 2, totalMs: 1000, lastSeen: null, correctDays: [] };
      }
    }
    const r = compositeAccuracy({ templateStats }, 'QUANT');
    expect(r.accuracy).not.toBeNull();
    expect(r.accuracy).toBeCloseTo(1, 5);
    expect(r.coverage).toBe(1);
  });
});
