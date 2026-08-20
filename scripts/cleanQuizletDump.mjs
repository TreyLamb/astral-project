// Strips Quizlet page chrome out of a raw "select all / copy" dump, leaving the terms.
//
// A full-page paste carries nav, upsells, and a marketing footer around the card list.
// Each card renders as:  <number> / <term> / <definition> / "Image"  separated by blanks.
// Anything that does not fit that shape is dropped, and the count is reported so a partial
// capture (Quizlet lazy-loads, so a scroll-and-copy often gets only the tail) is obvious.
//
//   node scripts/cleanQuizletDump.mjs <file.md> [--write]

import { readFileSync, writeFileSync } from 'node:fs';

const [file, ...rest] = process.argv.slice(2);
if (!file) { console.error('usage: node scripts/cleanQuizletDump.mjs <file.md> [--write]'); process.exit(1); }

const raw = readFileSync(file, 'utf8');
const lines = raw.split(/\r?\n/).map((l) => l.trim());

const NOISE = new Set([
  'Image', 'Add a card', 'Create', 'Create and practice', 'Model', 'Import', 'Add diagram',
  'Suggestions', 'Search', 'Home', 'Your library', 'Study groups', 'Notifications',
  'Your folders', 'New folder', 'Start here', 'Flashcards', 'Study Guides', 'Practice Tests',
  'Expert Solutions', 'Public', 'Title', 'Profile Picture', 'Enhanced by AI', 'What’s new',
  'Create a new flashcard set', 'Search for practice tests', 'Upgrade: free 7-day trial',
]);
const isNoise = (l) =>
  !l || NOISE.has(l) || /^Saved /.test(l) || /^Upgrade/.test(l) || /flashcards in seconds/.test(l) ||
  /^Turn anything into/.test(l) || /^Review before adding/.test(l) || /^Improved quality/.test(l) ||
  /^Our new models/.test(l) || /^Enter a prompt/.test(l) || /^Preview generated/.test(l) ||
  /^Upload files like/.test(l);

const kept = lines.filter((l) => !isNoise(l));

const cards = [];
for (let i = 0; i < kept.length; i++) {
  if (!/^\d{1,4}$/.test(kept[i])) continue;
  const n = Number(kept[i]);
  const term = kept[i + 1];
  const def = kept[i + 2];
  // A real card is number / term / definition, where neither of the next two is another
  // bare number (that would mean the term or definition was blank).
  if (!term || !def || /^\d{1,4}$/.test(term) || /^\d{1,4}$/.test(def)) continue;
  cards.push({ n, term, def });
  i += 2;
}

const srcMatch = raw.match(/https:\/\/quizlet\.com\/\S+/);
const titleIdx = lines.findIndex((l) => l === 'Title');
const title = titleIdx >= 0 ? lines.slice(titleIdx + 1, titleIdx + 3).filter(Boolean).join(' - ') : '';

const nums = cards.map((c) => c.n);
const lo = Math.min(...nums), hi = Math.max(...nums);
const header = [
  `<!-- source: ${srcMatch ? srcMatch[0] : 'quizlet (url not captured)'}`,
  `<!-- title: ${title}`,
  `<!-- cards: ${cards.length} (numbered ${lo}-${hi})`,
  '',
];
const body = cards.map((c) => `${c.n}. ${c.term} :: ${c.def}`);
const out = [...header, ...body, ''].join('\n');

console.log(`${file}: ${lines.length} lines in -> ${cards.length} cards out (numbered ${lo}-${hi})`);
if (hi - lo + 1 !== cards.length) console.log(`  WARNING: gaps in numbering`);
if (lo > 1) console.log(`  WARNING: starts at ${lo}, so cards 1-${lo - 1} were NOT captured`);

if (rest.includes('--write')) { writeFileSync(file, out); console.log('  written in place'); }
else console.log(out.split('\n').slice(0, 12).join('\n'));
