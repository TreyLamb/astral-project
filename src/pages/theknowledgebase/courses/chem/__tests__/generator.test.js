// Guards on the template contract itself. Both of these exist because the equivalent mistake
// already shipped once in AFOQT: generateInstance's return is a WHITELIST, so a field a template
// sets but the return omits disappears with no error anywhere (theknowledgebase/CLAUDE.md).

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerChemTemplate, generateChemInstance, getChemTemplate, _resetChemRegistry,
} from '../engine/generator.js';

const base = {
  chapterId: 'chem1-00-toolbox',
  name: 'test',
  concepts: [],
  generate: (rng, h) => ({
    stem: 'stem?',
    ...h.choices('right', [{ value: 'wrong1' }, { value: 'wrong2' }, { value: 'wrong3' }]),
    explanation: 'because',
  }),
};

beforeEach(() => _resetChemRegistry());

describe('band validation', () => {
  it('accepts course bands 1-3 and ACS bands 4-5', () => {
    for (const band of [1, 2, 3, 4, 5]) {
      expect(() => registerChemTemplate({ ...base, id: `t${band}`, band })).not.toThrow();
    }
  });

  it('still rejects a band outside 1-5', () => {
    expect(() => registerChemTemplate({ ...base, id: 'lo', band: 0 })).toThrow(/band must be 1-5/);
    expect(() => registerChemTemplate({ ...base, id: 'hi', band: 6 })).toThrow(/band must be 1-5/);
  });
});

describe('section passthrough', () => {
  it('carries `section` onto the generated instance', () => {
    // The whole two-gates-per-section design keys off this field. If the generator drops it,
    // every gate silently draws from every section and nothing errors.
    registerChemTemplate({ ...base, id: 'with-section', band: 4, section: '4-3' });
    const inst = generateChemInstance('with-section', 123);
    expect(inst.section).toBe('4-3');
    expect(inst.band).toBe(4);
  });

  it('is null, not undefined, when a template declares no section', () => {
    registerChemTemplate({ ...base, id: 'no-section', band: 1 });
    const inst = generateChemInstance('no-section', 1);
    expect(inst.section).toBeNull();
  });

  it('keeps section on the registered template too', () => {
    registerChemTemplate({ ...base, id: 'keeps', band: 2, section: '1-6' });
    expect(getChemTemplate('keeps').section).toBe('1-6');
  });
});

describe('determinism still holds', () => {
  it('same (templateId, seed) regenerates identically', () => {
    registerChemTemplate({ ...base, id: 'det', band: 5, section: '9-3' });
    expect(generateChemInstance('det', 42)).toEqual(generateChemInstance('det', 42));
  });
});
