// npm run tt:parse
//
// Reads the raw registrar text dump at src/pages/TranscriptTool/Transcript.json
// and emits real JSON beside it for the /TT page to import.
//
// The raw file is NOT json despite its name — it is the source of record and is
// never modified. Vite parses .json at import time, so the page cannot import
// it directly; that is the whole reason this script exists.
//
// Exits non-zero if the parse disagrees with any figure the transcript prints
// about itself, so a silently-swallowed course row fails the run instead of
// quietly shipping a wrong GPA.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseTranscript } from '../src/pages/TranscriptTool/parseTranscript.js';
import { gpaOf, fmtGpa } from '../src/pages/TranscriptTool/gpa.js';

const RAW = fileURLToPath(new URL('../src/pages/TranscriptTool/Transcript.json', import.meta.url));
const OUT = fileURLToPath(new URL('../src/pages/TranscriptTool/transcript.data.json', import.meta.url));

const { courses, terms, totals, unparsed } = parseTranscript(readFileSync(RAW, 'utf8'));

let failed = false;
const fail = (msg) => { failed = true; console.error(`  ✗ ${msg}`); };

console.log(`\nParsed ${courses.length} courses across ${terms.length} terms.\n`);
console.log('  TERM          CR   COMPUTED  →  PRINTED');
console.log('  ' + '─'.repeat(46));

for (const t of terms) {
  const r = gpaOf(courses.filter((c) => c.semester === t.semester));
  const p = t.printed;
  const line = `  ${t.semester.padEnd(13)} ${String(r.gpaHours).padStart(4)}   ${fmtGpa(r.gpa)}  →  ${p ? p.gpa.toFixed(2) : '  ??'}`;
  if (!p) { console.log(line); fail(`${t.semester}: no printed footer found`); continue; }
  const ok = r.gpaHours === p.gpaHours
    && r.earnedHours === p.earnedHours
    && Math.abs(r.points - p.points) < 0.005
    && fmtGpa(r.gpa) === p.gpa.toFixed(2);
  console.log(`${line}  ${ok ? '✓' : '✗'}`);
  if (!ok) fail(`${t.semester}: computed ${r.earnedHours}/${r.gpaHours}/${r.points} vs printed ${p.earnedHours}/${p.gpaHours}/${p.points}`);
}

const total = gpaOf(courses);
const printed = totals.institution;
console.log('  ' + '─'.repeat(46));
console.log(`  ${'TOTAL'.padEnd(13)} ${String(total.gpaHours).padStart(4)}   ${fmtGpa(total.gpa)}  →  ${printed ? printed.gpa.toFixed(2) : '  ??'}`);

if (!printed) fail('no TOTAL INSTITUTION line found');
else {
  if (total.gpaHours !== printed.gpaHours) fail(`GPA hours ${total.gpaHours} vs printed ${printed.gpaHours}`);
  if (total.earnedHours !== printed.earnedHours) fail(`earned hours ${total.earnedHours} vs printed ${printed.earnedHours}`);
  if (Math.abs(total.points - printed.points) >= 0.005) fail(`quality points ${total.points} vs printed ${printed.points}`);
  if (fmtGpa(total.gpa) !== printed.gpa.toFixed(2)) fail(`GPA ${fmtGpa(total.gpa)} vs printed ${printed.gpa.toFixed(2)}`);
}

if (unparsed.length) {
  console.error(`\n  ${unparsed.length} line(s) could not be read:`);
  for (const u of unparsed) console.error(`    line ${u.line}: ${u.text}`);
  failed = true;
}

if (failed) {
  console.error('\nReconciliation FAILED — transcript.data.json not written.\n');
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify({
  generatedFrom: 'Transcript.json',
  institution: 'Utah Valley University',
  scaleNote: 'UVU uses ±0.4/0.7 plus-minus steps and truncates displayed GPA to 2dp.',
  totals,
  terms,
  courses,
}, null, 2) + '\n');

console.log(`\n  ✓ all figures reconcile — wrote ${courses.length} courses to transcript.data.json\n`);
