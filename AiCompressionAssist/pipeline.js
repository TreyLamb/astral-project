// pipeline.js — the shared filter step used by the hook and the CLI.
//
// Strip terminal/log noise from a text blob, and back up the unedited original
// to the rolling history buffer. Deterministic regex only — no network, no
// model, nothing leaves the machine.

import { compress } from './filters.js';
import { writeRaw } from './historyBuffer.js';

export function stat(s) {
  return { lines: s.split('\n').length, bytes: Buffer.byteLength(s, 'utf8') };
}

// Filter one text blob. The unedited original is logged (with before/after
// stats) ONLY when filtering actually removed something — clean output costs
// zero history and zero added tokens. Returns cleaned text + whether it
// changed. Never throws.
export function filterAndLog(text, label = '') {
  if (typeof text !== 'string' || text.length === 0) {
    return { cleaned: text, changed: false, before: null, after: null };
  }
  const before = stat(text);
  const cleaned = compress(text);
  const after = stat(cleaned);
  const changed = cleaned !== text;
  if (changed) writeRaw(text, { label, before, after });
  return { cleaned, changed, before, after };
}
