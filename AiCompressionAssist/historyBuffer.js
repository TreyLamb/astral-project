// historyBuffer.js — the multi-file FIFO rotation engine (spec section 3).
//
// Every raw, *uncompressed* payload is written here BEFORE compression, so the
// full unedited context is always recoverable when deep-diagnosing a bug.
//
// Rotation (append + rename): new data is appended to history_1.md. When
// history_1.md passes the line budget it rotates:
//   1. delete history_3.md
//   2. rename history_2.md -> history_3.md
//   3. rename history_1.md -> history_2.md
//   4. start a fresh, empty history_1.md
// A fresh history_1.md always begins with the agent instruction header below.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = process.env.LOG_DIR || path.join(MODULE_DIR, 'logs');
const MAX_LINES = Number(process.env.MAX_LINES) || 600;

const FILE_1 = path.join(LOG_DIR, 'history_1.md');
const FILE_2 = path.join(LOG_DIR, 'history_2.md');
const FILE_3 = path.join(LOG_DIR, 'history_3.md');
// All-time savings tally — survives FIFO rotation so `npm run report` can show
// cumulative "with vs without the tool" numbers over a whole session.
const TALLY = path.join(LOG_DIR, 'savings.json');

const AGENT_HEADER = `> **WORKSPACE HISTORY INSTRUCTIONS FOR THE AGENT:**
> You are operating with a local multi-file rolling history system in the \`./logs/\` directory.
> - \`history_1.md\` contains your most immediate, ultra-fresh raw transaction logs. Read this first to catch up on recent context.
> - If you need deeper historical context, read \`history_2.md\` then \`history_3.md\` sequentially. Do not read all three unless explicitly searching for an older interaction event.

`;

function ensureDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create history_1.md with the permanent agent header if it does not exist.
function ensureFreshFile1() {
  if (!fs.existsSync(FILE_1)) {
    fs.writeFileSync(FILE_1, AGENT_HEADER, 'utf8');
  }
}

function lineCount(file) {
  if (!fs.existsSync(file)) return 0;
  return fs.readFileSync(file, 'utf8').split('\n').length;
}

function rotate() {
  if (fs.existsSync(FILE_3)) fs.rmSync(FILE_3);
  if (fs.existsSync(FILE_2)) fs.renameSync(FILE_2, FILE_3);
  if (fs.existsSync(FILE_1)) fs.renameSync(FILE_1, FILE_2);
  ensureFreshFile1(); // fresh history_1.md with the header re-injected
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function pct(from, to) {
  if (!from) return '0%';
  return `${Math.round(((from - to) / from) * 100)}%`;
}

// Accumulate all-time totals into savings.json (read-modify-write). Never
// throws. This is what `report.js` reads to show the measured difference.
function updateTally(before, after) {
  if (!before || !after) return;
  let t = { entries: 0, rawLines: 0, rawBytes: 0, cleanLines: 0, cleanBytes: 0, since: new Date().toISOString() };
  try {
    if (fs.existsSync(TALLY)) t = JSON.parse(fs.readFileSync(TALLY, 'utf8'));
  } catch {}
  t.entries += 1;
  t.rawLines += before.lines;
  t.rawBytes += before.bytes;
  t.cleanLines += after.lines;
  t.cleanBytes += after.bytes;
  try {
    fs.writeFileSync(TALLY, JSON.stringify(t, null, 2), 'utf8');
  } catch {}
}

// One-line stats header so an agent scanning the history can find an entry by
// its size/savings without reading the whole raw block.
function statsLine(before, after) {
  if (!before || !after) return '';
  return (
    `_raw: ${before.lines} lines / ${fmtBytes(before.bytes)} → ` +
    `cleaned: ${after.lines} lines / ${fmtBytes(after.bytes)} ` +
    `(saved ${pct(before.lines, after.lines)} lines, ${pct(before.bytes, after.bytes)} bytes)_\n\n`
  );
}

// Append one raw entry (the completely unedited output) with a timestamp +
// stats header, then rotate if the line budget is exceeded. Never throws —
// history logging must never disrupt the agent.
export function writeRaw(rawText, meta = {}) {
  try {
    ensureDir();
    ensureFreshFile1();
    const stamp = new Date().toISOString();
    const tag = meta.label ? ` — ${meta.label}` : '';
    const entry = `\n## ${stamp}${tag}\n\n${statsLine(meta.before, meta.after)}\`\`\`\n${rawText}\n\`\`\`\n`;
    fs.appendFileSync(FILE_1, entry, 'utf8');
    updateTally(meta.before, meta.after);
    if (lineCount(FILE_1) > MAX_LINES) rotate();
  } catch {
    // swallow — logging failures must not disrupt the agent
  }
}

export const config = { LOG_DIR, MAX_LINES, FILE_1, FILE_2, FILE_3 };
