// report.js — print the measured "with vs without the tool" savings.
//
// Reads logs/savings.json (the all-time tally the hook maintains) and prints
// how much less text the agent read because the filter was on. Run:
//   npm run report
// Reset the tally by deleting logs/savings.json.

import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const TALLY = path.join(LOG_DIR, 'savings.json');

// Rough token estimate. ~4 chars per token is the common rule of thumb; this is
// an approximation, not an exact count.
const estTokens = (bytes) => Math.round(bytes / 4);
const pct = (from, to) => (from ? Math.round(((from - to) / from) * 100) : 0);
const fmt = (n) => n.toLocaleString('en-US');
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

if (!fs.existsSync(TALLY)) {
  console.log('No savings recorded yet.');
  console.log(`(Nothing has been filtered, or LOG_DIR is elsewhere. Looked in: ${TALLY})`);
  console.log('Enable the hook, use Claude Code for a bit, then run `npm run report` again.');
  process.exit(0);
}

let t;
try {
  t = JSON.parse(fs.readFileSync(TALLY, 'utf8'));
} catch {
  console.log('savings.json is unreadable/corrupt — delete it to reset.');
  process.exit(1);
}

const rawTok = estTokens(t.rawBytes);
const cleanTok = estTokens(t.cleanBytes);

console.log('\n  AI Compression Assist — measured savings');
console.log('  ' + '─'.repeat(48));
console.log(`  Since:            ${t.since}`);
console.log(`  Outputs filtered: ${fmt(t.entries)}`);
console.log('');
console.log('                     without tool        with tool');
console.log(`  Lines read:        ${fmt(t.rawLines).padEnd(18)}  ${fmt(t.cleanLines)}`);
console.log(`  Size read:         ${fmtBytes(t.rawBytes).padEnd(18)}  ${fmtBytes(t.cleanBytes)}`);
console.log(`  Est. tokens read:  ${('~' + fmt(rawTok)).padEnd(18)}  ~${fmt(cleanTok)}`);
console.log('  ' + '─'.repeat(48));
console.log(`  SAVED:  ${fmt(t.rawLines - t.cleanLines)} lines  |  ${fmtBytes(t.rawBytes - t.cleanBytes)}  |  ~${fmt(rawTok - cleanTok)} tokens`);
console.log(`          (${pct(t.rawLines, t.cleanLines)}% fewer lines, ${pct(t.rawBytes, t.cleanBytes)}% fewer bytes read on filtered outputs)`);
console.log('  Note: token numbers are estimates (~4 chars/token). Only counts outputs that had noise to strip.\n');
