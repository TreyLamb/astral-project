// filters.js — the compression filter rules.
//
// This is the single place where the regular expressions and collapse
// thresholds live (Implementation Task #2). Every filter is deliberately
// CONSERVATIVE: it only collapses *runs* of clearly-noise lines above a
// threshold, so a single meaningful line can never be dropped. If a filter
// throws for any reason, compress() falls back to the original text.

// A run of noise must be at least this many consecutive lines before we
// touch it. Tuned per filter below.
const TEST_RUN_MIN = 5;
const DEP_RUN_MIN = 3;
const PATH_RUN_MIN = 4;

// --- line classifiers -------------------------------------------------------

// A passing-test line: jest/vitest "PASS", TAP "ok 12 - ...", or a bare
// green checkmark. We stay away from ambiguous words like "done".
const TEST_PASS = /^\s*(PASS\b|✓|✔|√|ok\s+\d+\b)/i;

// npm / pip / yarn install + download noise, and generic progress bars.
const DEP_LOG = new RegExp(
  [
    '^npm\\s+(WARN|notice|http|timing|sill|verb)\\b', // npm chatter
    '^(Collecting|Downloading|Using cached|Requirement already satisfied|Installing collected packages)\\b', // pip
    '^\\s*[│|]?\\s*[━▓█▉▊▋▌▍▎▏░▒▬=#\\-]{6,}', // any long bar of block/hash chars
    '\\b\\d+(\\.\\d+)?\\s?(kB|KB|MB|GB)/s\\b', // transfer rate
    '\\beta\\s+\\d', // "eta 0:00:03"
    '⸨[░▒▓█\\s]+⸩', // npm unicode progress
  ].join('|'),
  'i'
);

// A pure dependency/cache path line with NO error signal and NO source
// location. Stack-trace frames (which carry :line:col) are explicitly NOT
// prunable so error context survives.
const PATH_BLOAT = /(node_modules[\\/]|[\\/]\.cache[\\/]|[\\/]Caches[\\/]|npm-cache[\\/])/i;
const HAS_LOCATION = /:\d+(:\d+)?\b/; // file:line or file:line:col
const HAS_ERROR = /\b(error|throw|exception|fail(ed|ure)?|at\s+\w)/i;

// --- generic run-collapser --------------------------------------------------

// Walk the lines; wherever `isNoise` is true for >= minRun consecutive lines,
// replace that whole run with a single summary produced by `label`.
function collapseRuns(lines, isNoise, minRun, label) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (isNoise(lines[i])) {
      let j = i;
      while (j < lines.length && isNoise(lines[j])) j++;
      const runLength = j - i;
      if (runLength >= minRun) {
        out.push(label(runLength));
      } else {
        for (let k = i; k < j; k++) out.push(lines[k]);
      }
      i = j;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out;
}

// --- individual filters (exported so they can be unit-tested) ---------------

export function cleanTestSuites(text) {
  const lines = text.split('\n');
  const collapsed = collapseRuns(
    lines,
    (l) => TEST_PASS.test(l),
    TEST_RUN_MIN,
    (n) => `… [${n} passing test lines collapsed] …`
  );
  return collapsed.join('\n');
}

export function stripDependencyLogs(text) {
  const lines = text.split('\n');
  const collapsed = collapseRuns(
    lines,
    (l) => DEP_LOG.test(l),
    DEP_RUN_MIN,
    (n) => `… [${n} dependency/progress lines stripped] …`
  );
  return collapsed.join('\n');
}

export function prunePathBloat(text) {
  const lines = text.split('\n');
  const isBloat = (l) =>
    PATH_BLOAT.test(l) && !HAS_LOCATION.test(l) && !HAS_ERROR.test(l);
  const collapsed = collapseRuns(
    lines,
    isBloat,
    PATH_RUN_MIN,
    (n) => `… [${n} framework/cache path lines pruned] …`
  );
  return collapsed.join('\n');
}

// --- public entry point -----------------------------------------------------

// Apply every filter in sequence. Never throws: on any error the ORIGINAL
// text is returned so the agent's request is passed through untouched.
export function compress(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  try {
    let out = text;
    out = cleanTestSuites(out);
    out = stripDependencyLogs(out);
    out = prunePathBloat(out);
    return out;
  } catch {
    return text;
  }
}
