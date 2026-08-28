import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { allTemplates, generateInstance } from '../generator.js';
import { ERROR_LABELS, labelFor } from '../errorModes.js';

/**
 * The payoff for insisting a distractor is a NAMED error mode is the post-drill ranking:
 * "you read Y as ascending on four of your five misses". That only works if every id a
 * template can emit has prose behind it - `labelFor` falls back to the raw kebab-case id, which
 * is silent, looks like a bug to the reader, and turns the most useful screen in the tool into
 * a list of slugs. 133 ids were in exactly that state until 2026-08-26.
 */
describe('every emitted error-mode id has a prose label', () => {
  const emitted = new Map(); // id -> subtest
  for (const t of allTemplates()) {
    for (let i = 0; i < 200; i++) {
      const inst = generateInstance(t.id, (i * 2654435761) >>> 0);
      for (const e of inst?.errors ?? []) if (e && !emitted.has(e)) emitted.set(e, t.subtest);
    }
  }

  it('samples a substantial number of distinct ids (anti-vacuity guard)', () => {
    // If sampling ever silently stops producing labelled distractors this suite would pass
    // over an empty set and prove nothing. 100 is well below the ~160 real count.
    expect(emitted.size).toBeGreaterThan(100);
  });

  it('no template emits an id that falls back to its raw slug', () => {
    const missing = [...emitted.entries()]
      .filter(([id]) => !ERROR_LABELS[id])
      .map(([id, sub]) => `${sub}:${id}`);
    expect(missing, `unlabeled error modes: ${missing.join(', ')}`).toEqual([]);
  });

  it('labelFor still falls back safely for a genuinely unknown id', () => {
    expect(labelFor('not-a-real-error-mode')).toBe('not-a-real-error-mode');
  });
});

describe('label quality', () => {
  it('no label is empty, and none is just its own slug with hyphens swapped for spaces', () => {
    for (const [id, label] of Object.entries(ERROR_LABELS)) {
      expect(label.trim().length, `${id} has an empty label`).toBeGreaterThan(0);
      expect(label, `${id} is a de-kebabbed slug, not real prose`).not.toBe(id.replace(/-/g, ' '));
    }
  });

  it('labels read as a continuation of "you ..." - never sentence-cased or full-stopped', () => {
    for (const [id, label] of Object.entries(ERROR_LABELS)) {
      expect(label.endsWith('.'), `${id} ends with a full stop`).toBe(false);
      expect(/^[A-Z]/.test(label) && !/^[A-Z]{2,}/.test(label), `${id} is sentence-cased`).toBe(false);
    }
  });
});
