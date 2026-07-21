#!/usr/bin/env node
// hook.js — Claude Code PostToolUse hook.
//
// Strips terminal/log noise from a tool's output BEFORE the agent reads it, so
// a session spends fewer tokens re-reading npm spam, PASS walls, and
// node_modules path dumps. The unedited original is backed up to the rolling
// history buffer (AiCompressionAssist/logs/) so nothing is ever truly lost.
//
// 100% local, deterministic regex, no network, no model — it never leaves the
// machine and costs nothing.
//
// Contract (from Claude Code hooks): read the hook payload as JSON on stdin;
// to replace what the agent sees, print
//   { "hookSpecificOutput": { "hookEventName": "PostToolUse",
//                             "updatedToolOutput": <replacement> } }
// Printing nothing (exit 0) leaves the original output untouched.
//
// SAFETY: this hook is fail-open. On any unrecognized shape, parse error, or
// exception it prints nothing, so your real tool output always survives intact.
// It also stays silent when filtering removed nothing (zero added overhead).

import { filterAndLog } from './pipeline.js';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

const raw = await readStdin();

// Capture mode: record the exact hook payload and pass through unchanged.
// Run with HOOK_CAPTURE=1 once to confirm the real `tool_response` shape on
// your machine before trusting active filtering. (PowerShell: `$env:HOOK_CAPTURE=1`)
if (process.env.HOOK_CAPTURE) {
  const { writeRaw } = await import('./historyBuffer.js');
  try {
    writeRaw(raw, { label: 'CAPTURE — raw PostToolUse stdin' });
  } catch {}
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0); // not JSON we understand → leave output untouched
}

const cmd = payload.tool_input && payload.tool_input.command;
const label = `${payload.tool_name || 'tool'}${cmd ? ' ' + String(cmd).slice(0, 80) : ''}`;
const tr = payload.tool_response;

let updated;
let anyChanged = false;

try {
  if (typeof tr === 'string') {
    // tool_response is a plain string.
    const r = filterAndLog(tr, label);
    updated = r.cleaned;
    anyChanged = r.changed;
  } else if (tr && typeof tr === 'object') {
    // tool_response is an object — preserve its shape, only touch the string
    // fields that actually hold command output.
    const clone = { ...tr };
    for (const key of ['stdout', 'stderr', 'output', 'content', 'result']) {
      if (typeof clone[key] === 'string' && clone[key].length > 0) {
        const r = filterAndLog(clone[key], `${label} .${key}`);
        clone[key] = r.cleaned;
        anyChanged = anyChanged || r.changed;
      }
    }
    updated = clone;
  } else {
    process.exit(0); // unknown shape → pass through
  }
} catch {
  process.exit(0); // any failure → pass through untouched
}

// Nothing was actually collapsed → don't touch the output (zero token cost).
if (!anyChanged) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      updatedToolOutput: updated,
      additionalContext:
        'Noise-filtered; full raw output in AiCompressionAssist/logs/history_1.md.',
    },
  })
);
