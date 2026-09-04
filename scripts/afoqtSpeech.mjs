// npm run afoqt:speech [-- --subtest=MK --only=mk-factor --n=1]
//
// Prints what the READ-ALOUD voice will actually say for real generated questions, beside the
// text it was built from. The companion to `afoqt:sample`, and it exists for the same reason:
// `afoqt:selftest` proves a question is well-FORMED and says nothing about whether it is
// well-SPOKEN, and every speech defect this project has had was found by reading this output
// rather than by any structural check.
//
// Things worth looking for, all of which have happened:
//   - an operator that vanished          `12 - 8` read as "twelve eight"
//   - a sign that flipped meaning        `12 - 8` read as "twelve negative eight"
//   - two words run together             "19the square root of 8"
//   - an unbalanced bracket              "the quantity 7 x cubed, times (8 x"
//   - a word spelled instead of said     "B-E-N-E-V-O-L-E-N-T"
//   - a hyphenated word turned into arithmetic   "x minus coordinate"

import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { allTemplates, generateInstance } from '../src/pages/theknowledgebase/afoqt/engine/generator.js';
import { speechFor, SPEAKABILITY } from '../src/pages/theknowledgebase/afoqt/engine/speech.js';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ONLY = arg('only', null);
const SUBTEST = arg('subtest', null);
const N = Number(arg('n', 1));

let shown = 0;
for (const t of allTemplates()) {
  if (ONLY && !t.id.includes(ONLY)) continue;
  if (SUBTEST && t.subtest !== SUBTEST) continue;
  const level = SPEAKABILITY[t.subtest]?.level ?? 'full';
  console.log(`\n=== ${t.id}  [${t.subtest} band ${t.band}]  speakability: ${level}`);
  for (let i = 0; i < N; i++) {
    const q = generateInstance(t.id, (i + 1) * 7919);
    if (!q) continue;
    shown++;
    console.log(`  TEXT  ${q.stem.replace(/\n+/g, ' / ')}`);
    console.log(`        ${q.choices.join('  |  ')}`);
    for (const seg of speechFor(q)) console.log(`  SAID  ${seg.text}`);
  }
}
console.log(`\n${shown} questions.`);
