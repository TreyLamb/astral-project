// npm run afoqt:sample [-- --only=mk-factor --n=3 --subtest=MK]
//
// Prints real generated instances so a human can eyeball them. The selftest proves the
// STRUCTURE is sound (option counts, no duplicates, stems vary); only reading the questions
// proves the MATH and the wording are right, and that the distractors are the plausible
// mistakes they claim to be rather than obvious throwaways.

import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { allTemplates, generateInstance } from '../src/pages/theknowledgebase/afoqt/engine/generator.js';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ONLY = arg('only', null);
const SUBTEST = arg('subtest', null);
const N = Number(arg('n', 2));
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

for (const t of allTemplates()) {
  if (ONLY && !t.id.includes(ONLY)) continue;
  if (SUBTEST && t.subtest !== SUBTEST) continue;
  console.log(`\n=== ${t.id}  [${t.subtest} band ${t.band}${t.stretch ? ' stretch' : ''}]  ${t.name}`);
  console.log(`    concepts: ${t.concepts.join(', ')}   calibrated: ${t.calibratedAgainst ?? '-'}`);
  for (let i = 0; i < N; i++) {
    const seed = (i + 1) * 7919;
    const q = generateInstance(t.id, seed);
    console.log(`\n  ${q.stem}`);
    q.choices.forEach((c, j) => {
      console.log(`    ${LETTERS[j]}. ${c}${j === q.correctIndex ? '   <-- correct' : ''}`);
    });
    if (q.explanation) console.log(`    > ${q.explanation}`);
  }
}
