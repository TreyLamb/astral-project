import { describe, it, expect } from 'vitest';
import { SAFE_DEFAULTS, parseAnnotation, validateAnnotation } from './annotate.js';

describe('parseAnnotation', () => {
  it('strips ```json fences and parses the object', () => {
    const raw = '```json\n{"category":"errand","intensity":2}\n```';
    expect(parseAnnotation(raw)).toEqual({ category: 'errand', intensity: 2 });
  });

  it('strips plain ``` fences and parses the object', () => {
    const raw = '```\n{"category":"chore"}\n```';
    expect(parseAnnotation(raw)).toEqual({ category: 'chore' });
  });

  it('extracts the first {...} object out of surrounding commentary', () => {
    const raw = 'Sure, here you go:\n{"estWorkMin":45}\nHope that helps!';
    expect(parseAnnotation(raw)).toEqual({ estWorkMin: 45 });
  });

  it('returns null on garbage text', () => {
    expect(parseAnnotation('not json at all, sorry')).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    expect(parseAnnotation('{category: "errand", }')).toBeNull();
  });

  it('returns null on non-string input', () => {
    expect(parseAnnotation(null)).toBeNull();
    expect(parseAnnotation(undefined)).toBeNull();
    expect(parseAnnotation(42)).toBeNull();
  });

  it('returns null when the parsed JSON is an array, not an object', () => {
    expect(parseAnnotation('[1,2,3]')).toBeNull();
  });
});

describe('validateAnnotation', () => {
  it('returns null when given null', () => {
    expect(validateAnnotation(null)).toBeNull();
  });

  it('clamps intensity below range up to 1', () => {
    const result = validateAnnotation({ intensity: 0 });
    expect(result.intensity).toBe(1);
  });

  it('clamps intensity above range down to 5', () => {
    const result = validateAnnotation({ intensity: 9 });
    expect(result.intensity).toBe(5);
  });

  it('rounds a non-integer estWorkMin to the nearest positive int', () => {
    const result = validateAnnotation({ estWorkMin: 42.6 });
    expect(result.estWorkMin).toBe(43);
  });

  it('falls back estWorkMin to the safe default when zero/negative', () => {
    expect(validateAnnotation({ estWorkMin: 0 }).estWorkMin).toBe(SAFE_DEFAULTS.estWorkMin);
    expect(validateAnnotation({ estWorkMin: -10 }).estWorkMin).toBe(SAFE_DEFAULTS.estWorkMin);
  });

  it('rounds estRecoveryMin and allows zero but not negative', () => {
    expect(validateAnnotation({ estRecoveryMin: 12.4 }).estRecoveryMin).toBe(12);
    expect(validateAnnotation({ estRecoveryMin: 0 }).estRecoveryMin).toBe(0);
    expect(validateAnnotation({ estRecoveryMin: -5 }).estRecoveryMin).toBe(SAFE_DEFAULTS.estRecoveryMin);
  });

  it('maps an unknown idealWindow to "any"', () => {
    const result = validateAnnotation({ idealWindow: 'brunch' });
    expect(result.idealWindow).toBe('any');
  });

  it('maps an unknown category to null', () => {
    const result = validateAnnotation({ category: 'not-a-real-category' });
    expect(result.category).toBeNull();
  });

  it('keeps a valid category as-is', () => {
    const result = validateAnnotation({ category: 'outdoor' });
    expect(result.category).toBe('outdoor');
  });

  it('coerces truthy/falsy-looking values for booleans', () => {
    expect(validateAnnotation({ weatherSensitive: 'true' }).weatherSensitive).toBe(true);
    expect(validateAnnotation({ weatherSensitive: 'false' }).weatherSensitive).toBe(false);
    expect(validateAnnotation({ perishable: 1 }).perishable).toBe(true);
    expect(validateAnnotation({ perishable: 0 }).perishable).toBe(false);
  });

  it('fills all missing keys from SAFE_DEFAULTS', () => {
    const result = validateAnnotation({});
    expect(result).toEqual(SAFE_DEFAULTS);
  });

  it('always returns a fully-populated object for any non-null object input', () => {
    const result = validateAnnotation({ randomJunk: 'ignored' });
    expect(Object.keys(result).sort()).toEqual(Object.keys(SAFE_DEFAULTS).sort());
  });

  it('trims and keeps a valid locationName, nulls an empty one', () => {
    expect(validateAnnotation({ locationName: '  Trader Joe\'s  ' }).locationName).toBe("Trader Joe's");
    expect(validateAnnotation({ locationName: '   ' }).locationName).toBeNull();
    expect(validateAnnotation({ locationName: 123 }).locationName).toBeNull();
  });
});
