import { describe, it, expect } from 'vitest';
import {
  reasonToWrites, inferWindowFromMin, perishableAfterOutdoorRule, REASON_CODES,
} from './feedback';

const task = (over = {}) => ({
  id: 't1',
  title: 'Buy groceries',
  category: 'shopping',
  intensity: null,
  energy: 3,
  estWorkMin: null,
  estRecoveryMin: null,
  idealWindow: null,
  perishable: false,
  constraints: [],
  ...over,
});

describe('inferWindowFromMin', () => {
  it('maps a minute-of-day to its band', () => {
    expect(inferWindowFromMin(8 * 60)).toBe('morning');
    expect(inferWindowFromMin(12 * 60)).toBe('midday');
    expect(inferWindowFromMin(15 * 60)).toBe('afternoon');
    expect(inferWindowFromMin(19 * 60)).toBe('evening');
  });
  it('is null outside all bands and for a missing value', () => {
    expect(inferWindowFromMin(3 * 60)).toBe(null);
    expect(inferWindowFromMin(null)).toBe(null);
  });
});

describe('reasonToWrites — perishable (B2/B3)', () => {
  it('tags the task perishable', () => {
    expect(reasonToWrites('perishable', task())).toEqual({ taskPatch: { perishable: true } });
  });
  it('also emits the canonical policy rule when makeRule is set', () => {
    const out = reasonToWrites('perishable', task(), { makeRule: true });
    expect(out.taskPatch).toEqual({ perishable: true });
    expect(out.rule).toMatchObject({ subject: 'perishable', relation: 'notAfter', object: 'category:outdoor', action: 'forbid' });
  });
});

describe('reasonToWrites — too-draining-here', () => {
  it('bumps intensity by 1, capped at 5, off the energy fallback', () => {
    expect(reasonToWrites('too-draining-here', task({ intensity: null, energy: 3 })).taskPatch.intensity).toBe(4);
    expect(reasonToWrites('too-draining-here', task({ intensity: 5 })).taskPatch.intensity).toBe(5);
  });
  it('optionally adds recovery when asked', () => {
    const out = reasonToWrites('too-draining-here', task({ estRecoveryMin: 10 }), { addRecovery: true });
    expect(out.taskPatch.estRecoveryMin).toBe(20);
  });
});

describe('reasonToWrites — wrong-time-of-day', () => {
  it('uses an explicit window', () => {
    expect(reasonToWrites('wrong-time-of-day', task(), { idealWindow: 'morning' })).toEqual({ taskPatch: { idealWindow: 'morning' } });
  });
  it('infers the window from the slot the task was moved to', () => {
    expect(reasonToWrites('wrong-time-of-day', task(), { movedToMin: 19 * 60 })).toEqual({ taskPatch: { idealWindow: 'evening' } });
  });
  it('is a no-op when no window can be determined', () => {
    expect(reasonToWrites('wrong-time-of-day', task(), { movedToMin: 3 * 60 })).toEqual({});
  });
});

describe('reasonToWrites — takes-longer', () => {
  it('sets estWorkMin AND upserts a duration with the appended sample + median', () => {
    const out = reasonToWrites('takes-longer', task(), { estWorkMin: 90, prevSamples: [60] });
    expect(out.taskPatch).toEqual({ estWorkMin: 90 });
    expect(out.duration).toMatchObject({
      key: 'buy groceries', category: 'shopping', samples: [60, 90], lastActualMin: 90, medianMin: 75,
    });
  });
  it('is a no-op without a positive minute value', () => {
    expect(reasonToWrites('takes-longer', task(), {})).toEqual({});
    expect(reasonToWrites('takes-longer', task(), { estWorkMin: 0 })).toEqual({});
  });
});

describe('reasonToWrites — not-near-my-errands / not-today / unknown', () => {
  it('adds a batch-with-errands constraint (deduped)', () => {
    expect(reasonToWrites('not-near-my-errands', task()).taskPatch.constraints).toEqual(['batch-with-errands']);
    expect(reasonToWrites('not-near-my-errands', task({ constraints: ['batch-with-errands'] }))).toEqual({});
  });
  it('marks not-today as a session exclusion', () => {
    expect(reasonToWrites('not-today', task())).toEqual({ sessionExclude: true });
  });
  it('returns nothing for an unknown code or missing task', () => {
    expect(reasonToWrites('nope', task())).toEqual({});
    expect(reasonToWrites('perishable', null)).toEqual({});
  });
});

describe('feedback exports', () => {
  it('exposes the starter reason set and the canonical rule factory', () => {
    expect(REASON_CODES.map((r) => r.code)).toContain('perishable');
    expect(REASON_CODES.map((r) => r.code)).toContain('takes-longer');
    expect(perishableAfterOutdoorRule()).toMatchObject({ subject: 'perishable', relation: 'notAfter' });
  });
});
