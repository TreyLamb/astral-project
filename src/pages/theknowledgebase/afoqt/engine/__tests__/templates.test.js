// Structural gate on every registered template. This is the defence against repeating the
// ASVAB pollution: a template that can emit a broken question FAILS THE BUILD rather than
// reaching a study session. See docs/afoqt/QUESTION-DOCTRINE.md.
//
// The rules live in engine/templateAudit.js, which `npm run afoqt:selftest` also calls, so
// the CLI check and the build check are the same check. Add rules there, not here.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { allTemplates } from '../generator';
import { auditTemplate } from '../templateAudit';

// 400 here keeps `npm test` fast. The CLI runs far higher counts on demand
// (`npm run afoqt:selftest -- --samples=8000`), which is where the rare parameter
// collisions surface - several were found at 1500 and 5000 that 400 never reached.
const SAMPLES = 400;

describe('every registered template', () => {
  const templates = allTemplates();

  it('registers at least one template', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it.each(templates.map((t) => [t.id, t]))('%s holds its contract', (_id, t) => {
    const result = auditTemplate(t, { samples: SAMPLES });
    expect(result.problems, `${t.id}:\n  ${result.problems.join('\n  ')}`).toEqual([]);
  });
});
