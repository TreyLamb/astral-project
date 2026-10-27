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

// Templates that SOMETIMES ship 3 options instead of 4, found 2026-10-27 when the 4-choice check
// was first added. Known debt, not fixed yet: each one needs another named error mode, not padding.
// A ratchet - a template NOT on this list that starts collapsing fails the run, and an entry can
// be deleted as soon as its template is fixed. Never add a new template here to make a run pass.
const KNOWN_SHORT = new Set([
  'chem1-toolbox-sig-figs-mult', 'chem1-toolbox-density', 'chem1-01-particle-counting',
  'chem1-01-ionic-formula-predict', 'chem1-02-valence-electrons', 'chem1-03-mass-to-moles',
  'chem1-03-mole-ratio-formula', 'chem1-04-mole-ratio', 'chem1-04-moles-to-mass',
  'chem1-04-molecules-to-moles', 'chem1-05-molarity-definition', 'chem1-05-dilution',
  'chem1-07-formal-charge-calc', 'chem1-08-ideal-gas-law-solve', 'chem1-08-gas-density',
  'chem1-08-combined-gas-law', 'chem1-08-gas-stoichiometry', 'chem1-08-mole-fraction-pressure',
  'chem1-rev1-00-sigfig-division-units', 'chem1-rev1-01-mass-ratio-to-atomic-mass',
  'chem1-aq-01-implied-uncertainty',
  // Rare (about 1 in 10,000): a rounding coincidence, seen only on large runs.
  'chem1-08-partial-pressure', 'chem1-aq-04-titration-molarity',
]);
const knownShort = [];
const byDesignThree = [];

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
  let short = 0;
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
    // h.choices silently drops a distractor that duplicates another, so a slate can come out
    // short with every remaining option distinct. Added 2026-10-27 after a 3-option question
    // passed this script at 8000 samples and was only caught by reading it.
    if (inst.choices.length !== 4) short++;
  }
  if (collisions > 0) fail(`${t.id}: ${collisions}/${SAMPLES} samples had a choice collision (two identical options)`);
  // Short on EVERY sample = a 3-way question by design ("increases / decreases / no change"), and
  // padding it with an invented option would break the error-mode rule. Short only SOMETIMES = two
  // error modes landing on the same number, which is a defect.
  if (short === SAMPLES) byDesignThree.push(t.id);
  else if (short > 0 && KNOWN_SHORT.has(t.id)) knownShort.push(`${t.id} (${short}/${SAMPLES})`);
  else if (short > 0) fail(`${t.id}: ${short}/${SAMPLES} samples had fewer than 4 choices (distractors collapsed onto each other)`);
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

if (byDesignThree.length) console.log(`\n${byDesignThree.length} template(s) are 3-option by design.`);
if (knownShort.length) console.log(`${knownShort.length} known-debt template(s) sometimes ship 3 options: ${knownShort.join(', ')}`);
console.log(failed === 0 ? `\nAll checks passed (${SAMPLES} samples/template).` : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
