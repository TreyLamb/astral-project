// npm run afoqt:selftest [-- --only=mk-factor --samples=1000 --verbose]
//
// Generates N instances of every registered template and asserts the structural contract
// from docs/afoqt/QUESTION-DOCTRINE.md. This is the defence against repeating the ASVAB
// pollution: a template that CAN emit a broken question fails here rather than reaching a
// study session.
//
// The rules themselves live in afoqt/engine/templateAudit.js so this CLI and the vitest
// suite check exactly the same thing. This file is only the report.
//
// Runs on plain Node (no vite, no test runner), which is why every import inside the AFOQT
// engine carries an explicit .js extension.

import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { auditAll, DEFAULT_SAMPLES } from '../src/pages/theknowledgebase/afoqt/engine/templateAudit.js';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const samples = Number(arg('samples', DEFAULT_SAMPLES));
const only = arg('only', null);
const subtest = arg('subtest', null);
const verbose = process.argv.includes('--verbose');

const results = auditAll({ samples, only, subtest });
let failures = 0;

for (const r of results) {
  if (r.problems.length === 0) {
    if (verbose) console.log(`ok    ${r.id}  band ${r.band}  ${r.stems} stems`);
    continue;
  }
  failures++;
  console.log(`\nFAIL  ${r.id}  (band ${r.band}, ${r.subtest})`);
  if (r.firstShort) {
    const { seed, instance } = r.firstShort;
    console.log(`      e.g. seed ${seed}: ${instance.stem}`);
    console.log(`           got ${JSON.stringify(instance.choices)}  correct = ${instance.choices[instance.correctIndex]}`);
  }
  for (const p of r.problems.slice(0, 6)) console.log(`      ${p}`);
  if (r.problems.length > 6) console.log(`      ... and ${r.problems.length - 6} more`);
}

const byBand = {};
const bySubtest = {};
for (const r of results) {
  byBand[r.band] = (byBand[r.band] ?? 0) + 1;
  bySubtest[r.subtest] = (bySubtest[r.subtest] ?? 0) + 1;
}

console.log(`\n${results.length} templates x ${samples} instances`);
console.log('subtests: ' + Object.keys(bySubtest).sort().map((s) => `${s}:${bySubtest[s]}`).join('  '));
console.log('bands:    ' + Object.keys(byBand).sort().map((b) => `${b}:${byBand[b]}`).join('  '));

if (failures) {
  console.log(`\n${failures} template(s) failed. A short slate means two error-modes produced the`);
  console.log('same number for those parameters - over-supply distractors or constrain the draw.');
  console.log('Do NOT pad with an invented number; that breaks the error-mode rule.');
  process.exit(1);
}
console.log('all templates hold their contract');
