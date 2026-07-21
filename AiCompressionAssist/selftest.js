// selftest.js — verifies the filters AND the PostToolUse hook end-to-end.
// Run with `npm test`. No network, no model, no external anything.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compress,
  cleanTestSuites,
  stripDependencyLogs,
  prunePathBloat,
} from './filters.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '__selftest_logs');
fs.rmSync(LOG_DIR, { recursive: true, force: true });

let failed = 0;
function assert(cond, msg) {
  console.log((cond ? 'ok  - ' : 'FAIL- ') + msg);
  if (!cond) failed++;
}

// ---------------------------------------------------------------------------
// 1. Filters (pure functions)
// ---------------------------------------------------------------------------
const noisy = `Running the suite:
PASS src/a.test.js
PASS src/b.test.js
PASS src/c.test.js
✓ renders header (4 ms)
✓ renders footer (2 ms)
ok 12 - integration boot
Installing deps:
npm WARN deprecated foo@1.0.0
npm http fetch GET 200 https://registry.npmjs.org/react
Collecting numpy
Downloading numpy-1.26.0.whl (18 MB)
 ████████████████████████ 18 MB 4.2 MB/s eta 0:00:00
Framework noise:
/project/node_modules/react/index.js
/project/node_modules/react-dom/index.js
/home/user/.cache/webpack/main.js
/project/node_modules/scheduler/cjs/scheduler.js
TypeError: Cannot read property 'x' of undefined
    at /project/node_modules/react-dom/cjs/react-dom.js:1234:56
    at App (src/App.jsx:42:10)`;

const out = compress(noisy);
assert(/passing test lines collapsed/.test(cleanTestSuites(noisy)), 'test PASS block collapses');
assert(/dependency\/progress lines stripped/.test(stripDependencyLogs(noisy)), 'dependency logs stripped');
assert(/framework\/cache path lines pruned/.test(prunePathBloat(noisy)), 'node_modules path bloat pruned');
assert(out.includes("TypeError: Cannot read property 'x' of undefined"), 'error message preserved');
assert(out.includes('src/App.jsx:42:10'), 'app file + line number preserved');
assert(out.includes('react-dom.js:1234:56'), 'stack frame w/ line number preserved (not pruned)');

// ---------------------------------------------------------------------------
// 2. Hook — runs hook.js as a child with sample PostToolUse payloads
// ---------------------------------------------------------------------------
function runHook(payload) {
  const res = execFileSync('node', [path.join(__dirname, 'hook.js')], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, LOG_DIR },
  });
  return res.trim();
}

// 2a. tool_response as a plain STRING
const stringOut = runHook({
  tool_name: 'Bash',
  tool_input: { command: 'npm test' },
  tool_response: noisy,
});
const parsedString = JSON.parse(stringOut);
assert(
  parsedString.hookSpecificOutput.hookEventName === 'PostToolUse',
  'hook emits PostToolUse hookSpecificOutput (string shape)'
);
assert(
  /passing test lines collapsed/.test(parsedString.hookSpecificOutput.updatedToolOutput),
  'hook filters string tool_response into updatedToolOutput'
);
assert(
  parsedString.hookSpecificOutput.updatedToolOutput.includes('src/App.jsx:42:10'),
  'hook preserves error/line context (string shape)'
);

// 2b. tool_response as an OBJECT {stdout, stderr, interrupted}
const objOut = runHook({
  tool_name: 'Bash',
  tool_input: { command: 'npm ci' },
  tool_response: { stdout: noisy, stderr: '', interrupted: false, isImage: false },
});
const parsedObj = JSON.parse(objOut);
const uo = parsedObj.hookSpecificOutput.updatedToolOutput;
assert(typeof uo === 'object' && uo !== null, 'hook preserves object shape of tool_response');
assert(/passing test lines collapsed/.test(uo.stdout), 'hook filters .stdout field');
assert(uo.interrupted === false && 'isImage' in uo, 'hook preserves non-output fields (interrupted/isImage)');

// 2c. CLEAN output → hook must stay SILENT (pass-through, zero overhead)
const cleanOut = runHook({
  tool_name: 'Bash',
  tool_input: { command: 'echo hi' },
  tool_response: 'hi\nall good\n',
});
assert(cleanOut === '', 'hook stays silent when nothing needs filtering (pass-through)');

// 2d. Garbage / non-JSON stdin → fail open (no output, exit 0)
const garbage = execFileSync('node', [path.join(__dirname, 'hook.js')], {
  input: 'not json at all',
  encoding: 'utf8',
  env: { ...process.env, LOG_DIR },
}).trim();
assert(garbage === '', 'hook fails open on non-JSON input (output untouched)');

// ---------------------------------------------------------------------------
// 3. History buffer — raw logged, stats + agent header present
// ---------------------------------------------------------------------------
const hist = fs.readFileSync(path.join(LOG_DIR, 'history_1.md'), 'utf8');
assert(hist.includes('WORKSPACE HISTORY INSTRUCTIONS FOR THE AGENT'), 'agent header injected');
assert((hist.match(/PASS src\/a\.test\.js/g) || []).length >= 1, 'raw (uncompressed) output logged');
assert(/saved \d+% lines, \d+% bytes/.test(hist), 'per-entry byte/line stats recorded');

const tally = JSON.parse(fs.readFileSync(path.join(LOG_DIR, 'savings.json'), 'utf8'));
assert(tally.entries >= 1 && tally.rawLines > tally.cleanLines, 'savings.json tally accumulates raw>clean');

fs.rmSync(LOG_DIR, { recursive: true, force: true });
console.log(`\n${failed === 0 ? 'ALL PASS' : failed + ' FAILED'} — self-test complete.`);
process.exit(failed === 0 ? 0 : 1);
