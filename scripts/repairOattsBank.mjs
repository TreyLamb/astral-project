// Repairs `afoqt/data/realQuestions.json` in place, pulling fused solution walkthroughs back out
// of the answer choices they were glued onto.
//
// WHY THIS EXISTS SEPARATELY FROM parseOattsAnswers.mjs
// -----------------------------------------------------
// The parser already fixes this (see `splitFusedChoice` there, and the comment above it naming
// the exact 22 items). But the committed bank was generated BEFORE that fix landed and was never
// regenerated, so the fix has had no effect on anything that ships. Regenerating properly needs
// the OATTS answer-key PDFs, which are not vendored here - they come from a ~600 MB external
// repo fetched on demand.
//
// So this applies the parser's OWN exported function to the committed JSON. That is a faithful
// replay of what a regeneration would produce for this defect, rather than a second
// implementation that could drift from the first.
//
//   node scripts/repairOattsBank.mjs [--write]
//
// Without --write it reports and changes nothing.

import { readFileSync, writeFileSync } from 'node:fs';
import { splitFusedChoice } from './oattsText.mjs';

const BANK = 'src/pages/theknowledgebase/afoqt/data/realQuestions.json';
const write = process.argv.includes('--write');

const raw = JSON.parse(readFileSync(BANK, 'utf8'));
const questions = Array.isArray(raw) ? raw : raw.questions;

const fixed = [];
for (const q of questions) {
  if (!q.choices) continue;
  const pulled = [];
  for (const c of q.choices) {
    const [opt, why] = splitFusedChoice(c.text);
    if (!why) continue;
    // The answer text is a copy of the correct choice's text, so it carries the same fusion.
    if (q.answer === c.text) q.answer = opt;
    c.text = opt;
    pulled.push(why);
  }
  if (!pulled.length) continue;
  const joined = pulled.join(' ').trim();
  // Never overwrite a real explanation - only fill one that the fusion had stolen.
  q.explanation = q.explanation ? `${q.explanation} ${joined}`.trim() : joined;
  fixed.push({ id: q.id, subtest: q.subtest, chars: joined.length, option: q.choices.find((c) => !c.text) });
}

for (const f of fixed) console.log(`  ${f.id.padEnd(14)} ${f.subtest}  recovered ${f.chars} chars of explanation`);
console.log(`\n${fixed.length} of ${questions.length} items repaired`);

if (write) {
  writeFileSync(BANK, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  console.log(`wrote ${BANK}`);
} else {
  console.log('(dry run - pass --write to apply)');
}
