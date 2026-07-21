# AI Compression Assist — Design Spec

> This is the corrected spec. Earlier drafts described an HTTP "prompt proxy" on
> `localhost:3000` that forwarded to an upstream LLM. **That was wrong** and is
> what this tool is explicitly *not* (see Non-goals). This document describes
> what was actually built and why.

## Goal
Reduce how much the coding agent (Claude Code) has to **read** every time it runs
a local command, so a session spends fewer tokens re-reading terminal/log noise.
Example intent: read ~700k lines a session instead of ~1M.

Hard constraints:
- **100% local** — nothing ever leaves the machine.
- **100% free** — no LLM API, no network calls, no metered anything.
- **Deterministic** — plain regex/string filtering, no second AI doing the work.
- **Hyperlightweight** — Node built-ins only, zero dependencies, zero overhead
  when there's nothing to strip.
- **Safe** — must never disrupt or corrupt the agent's output. Fail-open.

## What it is
A **Claude Code `PostToolUse` hook**. After a tool (e.g. Bash) runs, Claude Code
invokes the hook with the tool's output. The hook:

1. Backs up the **completely unedited** output to a rolling history buffer.
2. Strips repetitive noise from the output with regex filters.
3. Returns the smaller version via `updatedToolOutput`, which **replaces** what
   the agent ingests.

```
Bash runs ─► raw output ─► hook.js
                             ├─ log raw to logs/history_1.md (+ savings tally)
                             ├─ strip noise (filters.js)
                             └─ return updatedToolOutput ─► agent reads the SMALLER version
```

If the output has no noise, the hook stays silent and the original passes through
— zero added tokens.

## Architecture
- **Mechanism:** Claude Code hooks. `PostToolUse` supports returning
  `hookSpecificOutput.updatedToolOutput`, which replaces the tool result the
  model reads. That is the entire leverage point.
- **Invocation:** registered in `.claude/settings.json` with a `Bash` matcher
  (extendable to other noisy tools). See `TOGGLE-AND-TEST.md`.
- **Shape-agnostic + fail-open:** `tool_response` may arrive as a plain string or
  as an object (`{stdout, stderr, …}`). The hook handles both and preserves the
  object shape. On any unknown shape, parse error, or exception it emits nothing,
  so the original output is never corrupted or dropped.

## Filtering logic (conservative)
All rules live in `filters.js`. Each only collapses a **run** of noise lines
above a per-filter threshold, so a single meaningful line is never dropped:

1. **Test walls** — long runs of `PASS` / `✓` / TAP `ok N` → one summary line.
2. **Dependency logs** — npm/pip/yarn download + progress bars.
3. **Path bloat** — repeated `node_modules/` and cache paths, **while strictly
   preserving** app files, line numbers, and error/stack-trace lines.

`compress()` chains the filters and is fail-safe (returns the original on error).

## FIFO rolling history buffer (`historyBuffer.js`)
The raw, unedited output is written **before** filtering so the full context is
always recoverable for deep debugging.

- Append to `logs/history_1.md`. Only outputs that were actually filtered are
  logged (clean output isn't duplicated).
- Each entry carries a timestamp, the command, and a stats line
  (`raw: 120 lines / 5.4 KB → cleaned: 40 lines / 1.2 KB (saved 66% …)`) so an
  entry is findable by size without reading the whole block.
- **Line budget 600 per file.** When `history_1.md` exceeds it, rotate: delete
  `history_3.md`, `2 → 3`, `1 → 2`, start a fresh `history_1.md`.
- Every fresh `history_1.md` begins with a permanent header telling an agent to
  read `history_1` first, then reach back to `history_2` / `history_3` only for
  deeper context.
- `logs/savings.json` keeps an all-time tally (survives rotation) powering
  `npm run report`.

## Files
| File | Role |
|---|---|
| `hook.js` | The PostToolUse hook (entry point) |
| `filters.js` | Compression rules — the one place to tune filtering |
| `historyBuffer.js` | FIFO rotation + stats + savings tally + agent header |
| `pipeline.js` | Shared filter-and-log step (used by hook + CLI) |
| `cli.js` | Pipe mode (`… \| node cli.js`) for manual use / testing |
| `report.js` | Prints measured savings from `logs/savings.json` |
| `selftest.js` | Full self-test (`npm test`) |
| `README.md` | How it works + install + files |
| `TOGGLE-AND-TEST.md` | Operator guide: turn on/off + measure the difference |

## Non-goals (explicitly NOT this tool)
- ❌ Not an HTTP server / proxy. Nothing listens on `localhost:3000`.
- ❌ Not an LLM/prompt proxy. It does **not** forward to any upstream AI, and it
  does not use a model to summarize — filtering is deterministic regex.
- ❌ Not wired into the astral-project React site. It's a standalone dev tool in
  this folder only.
- ❌ Does not filter the model's *responses* — only noisy *tool output* the agent
  would otherwise read.

## Status
Built and passing (`npm test` — filters + hook, both output shapes, fail-open,
silent-on-clean, history + stats + tally). Not auto-enabled: activation is a
manual `.claude/settings.json` edit by the owner (see `TOGGLE-AND-TEST.md`).
