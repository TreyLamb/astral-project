// Plain-node QC script, mirroring afoqt:selftest/afoqt:coverage at Chem's scale. Run with:
//   node src/pages/theknowledgebase/courses/chem/engine/selftest.mjs [--samples=2000]
//
// Checks, per template: every generated instance has a valid correctIndex, a distinct set of
// choices, and a non-empty stem/explanation. Then a bidirectional coverage check: every concept
// in curriculum.js is tested by at least one template, and every template's concepts are all
// declared by its chapter (no orphan concepts either direction — Doctrine rule 2).

import './templates/index.js';
import { allChemTemplates, generateChemInstance } from './generator.js';
import { CHEM_CHAPTERS, ALL_CHEM_CONCEPTS } from '../curriculum.js';

const samplesArg = process.argv.find((a) => a.startsWith('--samples='));
const SAMPLES = samplesArg ? Number(samplesArg.split('=')[1]) : 2000;

let failed = 0;
const fail = (msg) => { failed++; console.error(`FAIL: ${msg}`); };

const templates = allChemTemplates();
console.log(`${templates.length} templates registered across ${CHEM_CHAPTERS.length} chapters.\n`);

if (templates.length === 0) {
  console.error('No templates registered at all — nothing to check.');
  process.exit(1);
}

// --- per-template structural checks ---------------------------------------
for (const t of templates) {
  const chapter = CHEM_CHAPTERS.find((c) => c.id === t.chapterId);
  if (!chapter) { fail(`${t.id}: chapterId "${t.chapterId}" is not a real chapter`); continue; }
  for (const c of t.concepts ?? []) {
    if (!chapter.concepts.includes(c)) {
      fail(`${t.id}: declares concept "${c}" that chapter ${chapter.id} does not list`);
    }
  }

  let collisions = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const seed = Math.floor(Math.random() * 0xffffffff);
    const inst = generateChemInstance(t.id, seed);
    if (!inst) { fail(`${t.id}: generateChemInstance returned null at seed ${seed}`); break; }
    if (!inst.stem) { fail(`${t.id}: empty stem at seed ${seed}`); break; }
    if (!(inst.correctIndex >= 0 && inst.correctIndex < inst.choices.length)) {
      fail(`${t.id}: correctIndex out of range at seed ${seed}`); break;
    }
    const distinct = new Set(inst.choices);
    if (distinct.size !== inst.choices.length) collisions++;
  }
  if (collisions > 0) fail(`${t.id}: ${collisions}/${SAMPLES} samples had a choice collision (two identical options)`);
}

// --- coverage: every concept tested by >=1 template ------------------------
const testedConcepts = new Set(templates.flatMap((t) => t.concepts ?? []));
for (const concept of ALL_CHEM_CONCEPTS) {
  if (!testedConcepts.has(concept)) fail(`concept "${concept}" is taught (curriculum.js) but tested by no template`);
}

// --- every chapter has at least one template --------------------------------
for (const chapter of CHEM_CHAPTERS) {
  const own = templates.filter((t) => t.chapterId === chapter.id);
  if (own.length === 0) fail(`chapter "${chapter.id}" has zero templates`);
}

console.log(failed === 0 ? `\nAll checks passed (${SAMPLES} samples/template).` : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
