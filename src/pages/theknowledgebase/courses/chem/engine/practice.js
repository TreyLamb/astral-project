// Practice mode: drill the question you are stuck on (Trey, 2026-11-02).
//
// From any question in a test he can open a practice set of x (5 or 10):
//   - the first ceil(x/2) are the SAME generator: the question he was on, then fresh draws of it;
//   - the rest test the SAME SKILL with DIFFERENT generators (a different kind of question, wording
//     or set of information), dealt one per generator before any repeats.
// "Same skill" = shares a concept id with the question. Generators in the same book section come
// first, because a concept id can span a chapter's worth of material.
//
// When the bank has fewer sibling generators than the set needs, the shortfall is filled from the
// same generator and REPORTED (`shortBy`), never hidden. `practiceDepth()` lists those gaps.

import { allChemTemplates, generateChemInstance } from './generator.js';

const TRIES = 12;

export const sameTemplateCount = (x) => Math.ceil(x / 2);

/** Generators other than `templateId` that test one of `concepts`, nearest first. */
export function siblingTemplates(templateId, concepts, section) {
  const want = new Set(concepts ?? []);
  const sibs = allChemTemplates().filter((t) => t.id !== templateId && (t.concepts ?? []).some((c) => want.has(c)));
  return sibs.sort((a, b) => (b.section === section) - (a.section === section) || shared(b, want) - shared(a, want));
}
const shared = (t, want) => (t.concepts ?? []).filter((c) => want.has(c)).length;

function draw(templateId, rng, asked) {
  for (let i = 0; i < TRIES; i++) {
    const inst = generateChemInstance(templateId, Math.floor(rng() * 0xffffffff) >>> 0);
    if (inst && !asked.has(inst.stem)) { asked.add(inst.stem); return inst; }
  }
  return null;
}

/**
 * @param q    the instance he is on (needs templateId, concepts, section)
 * @param x    set size (5 or 10)
 * @returns { questions, sameCount, siblingsUsed, shortBy }
 */
export function buildPracticeSet(q, x, rng) {
  const asked = new Set([q.stem]);
  const out = [{ ...q, practiceKind: 'same' }];
  const same = sameTemplateCount(x);
  while (out.length < same) {
    const inst = draw(q.templateId, rng, asked);
    if (!inst) break;
    out.push({ ...inst, practiceKind: 'same' });
  }
  const sibs = siblingTemplates(q.templateId, q.concepts, q.section);
  const used = new Set();
  let shortBy = 0;
  for (let round = 0; out.length < x && round < 3; round++) {
    for (const t of sibs) {
      if (out.length >= x) break;
      const inst = draw(t.id, rng, asked);
      if (inst) { out.push({ ...inst, practiceKind: 'related' }); used.add(t.id); }
    }
    if (!sibs.length) break;
  }
  // Slots the skill's other question types could not fill. Topped up from the same generator
  // while it still has fresh questions; a small generator can run dry, and the set is then
  // shorter than x (the UI says so).
  shortBy = Math.max(0, x - same - out.filter((p) => p.practiceKind === 'related').length);
  while (out.length < x) {
    const inst = draw(q.templateId, rng, asked);
    if (!inst) break;
    out.push({ ...inst, practiceKind: 'same' });
  }
  return { questions: out, sameCount: same, siblingsUsed: used.size, shortBy };
}

/** For every generator in `sections`: how many sibling generators its skill has. */
export function practiceDepth(sections) {
  const want = new Set(sections);
  return allChemTemplates()
    .filter((t) => want.has(t.section))
    .map((t) => ({ id: t.id, section: t.section, name: t.name, concepts: t.concepts, siblings: siblingTemplates(t.id, t.concepts, t.section).map((s) => s.id) }));
}
