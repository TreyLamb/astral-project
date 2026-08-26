// PART 31 of docs/afoqt/HANDOFF.md: wires the TKB (not afoqt/engine/) `*.selftest.mjs` scripts
// into vitest, since `npm test` never ran them before and they could rot unnoticed.
//
// Both files are plain `node:assert` scripts that run their assertions as top-level side effects
// of being imported - there is nothing to call, just an import to make and a throw to observe.
// Per PART 31's instruction, their own assertions are not touched or rewritten into individual
// `it()` blocks; this file only makes sure importing each one actually runs in CI and fails
// loudly if any of its assertions ever regress.

import { describe, it, expect } from 'vitest';

describe('TKB engine selftest scripts', () => {
  it('engine/dedup.selftest.mjs runs to completion without throwing', async () => {
    await expect(import('../../../engine/dedup.selftest.mjs')).resolves.toBeTruthy();
  });

  it('engine/engine.selftest.mjs runs to completion without throwing', async () => {
    await expect(import('../../../engine/engine.selftest.mjs')).resolves.toBeTruthy();
  });
});
