// npm run afoqt:words-todo [-- --hits=2 --out=<file>]
//
// Which candidate words are still unauthored, right now. Derived, never checked in: a static
// to-do list goes stale the moment a chapter lands, and an agent handed a stale list wastes its
// run rediscovering that half its words already exist (registerWords throws on a duplicate
// headword, so it fails late rather than usefully).
//
// "Authored" means REACHABLE ON SCREEN, not merely present in engine/words.js. 105 of the
// askable headwords come from morphology examples and confusable pairs rather than the word
// registry (see docs/afoqt/QUESTION-SELECTION.md), so checking the registry alone under-reports
// and would hand an author a word the tool already asks about.

import fs from 'node:fs';
import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { allWords } from '../src/pages/theknowledgebase/afoqt/engine/words.js';
import { allTemplates, generateInstance } from '../src/pages/theknowledgebase/afoqt/engine/generator.js';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const MIN_HITS = Number(arg('hits', 0));
const OUT = arg('out', null);

const live = new Set(allWords().map((w) => w.word.toLowerCase()));
for (const t of allTemplates().filter((x) => x.subtest === 'WK')) {
  for (let i = 0; i < Math.max(1, t.stemSpace ?? 1); i++) {
    const w = generateInstance(t.id, ((0x2ab3d & 0xfffff) << 12) | i)?.vocab?.word;
    if (w) live.add(w.toLowerCase());
  }
}

const csv = new URL('../src/pages/theknowledgebase/afoqt/data/wordCandidates.csv', import.meta.url);
const rows = fs.readFileSync(csv, 'utf8').trim().split(/\r?\n/).slice(1)
  .map((l) => { const [word, hits] = l.split(','); return { word: word.trim().toLowerCase(), hits: Number(hits) }; })
  .filter((r) => r.word);

const todo = rows.filter((r) => !live.has(r.word) && r.hits >= MIN_HITS);
const byHits = {};
for (const r of todo) byHits[r.hits] = (byHits[r.hits] || 0) + 1;

console.log(`askable headwords now: ${live.size}`);
console.log(`candidates: ${rows.length}   still unauthored: ${todo.length}`);
console.log(`by hardListHits (authoring priority, 3+ first): ${JSON.stringify(byHits)}`);

const body = todo.sort((a, b) => b.hits - a.hits || a.word.localeCompare(b.word))
  .map((r) => `${r.word},${r.hits}`).join('\n');
if (OUT) {
  fs.writeFileSync(OUT, body + '\n');
  console.log(`\nwritten to ${OUT}`);
} else {
  console.log('\n' + body);
}
