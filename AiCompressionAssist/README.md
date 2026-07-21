# AI Compression Assist

A **local, free, zero-dependency** Claude Code hook that strips terminal/log
noise from tool output **before the agent reads it** — so a session spends
fewer tokens re-reading npm spam, walls of `PASS`, and `node_modules` path
dumps. The unedited original is backed up to a rolling history buffer so nothing
is ever truly lost.

Nothing leaves your machine. No model, no API, no network — just deterministic
regex.

## How it works

Claude Code fires a **PostToolUse** hook after each tool call. A hook may return
`updatedToolOutput`, which **replaces** the output the agent ingests. This tool
plugs in there:

```
Bash runs ──► raw output ──►  hook.js
                               ├─ backs up the raw output to logs/history_1.md
                               ├─ strips noise (filters.js)
                               └─ returns updatedToolOutput ──► agent reads the SMALLER version
```

If a command's output has no noise, the hook stays silent and the original
passes through untouched — zero added tokens. It is **fail-open**: on any
unexpected input or error it emits nothing, so your real output is never
corrupted or dropped.

## What gets filtered (conservatively)

All rules live in `filters.js` and only collapse a *run* of noise lines above a
per-filter threshold, so a single meaningful line is never dropped:

- **Test walls** — long runs of `PASS` / `✓` / TAP `ok N` → one summary line.
- **Dependency logs** — npm/pip/yarn download + progress bars.
- **Path bloat** — repeated `node_modules/` and cache paths, while **preserving**
  app files, line numbers, and error/stack-trace lines.

## Install (wire the hook)

Requires Node 18+. There is nothing to `npm install`.

1. **Verify the payload shape on your machine first (recommended).** Enable
   capture mode, run any command, then read `logs/history_1.md` to confirm what
   `tool_response` looks like:

   ```powershell
   $env:HOOK_CAPTURE = "1"   # PowerShell
   ```

   (Capture mode passes output through unchanged — it only records the raw hook
   payload. Unset it once you've confirmed.)

2. **Register the hook** in `.claude/settings.json` (project or user scope).
   Match every shell tool Claude Code might run commands through — on Windows
   that's usually both `Bash` (Git Bash, POSIX scripts) and `PowerShell`
   (native). A matcher of just `"Bash"` silently never fires for PowerShell
   calls, which is easy to miss since the hook is fail-open and logs nothing
   when it never ran at all:

   ```json
   {
     "hooks": {
       "PostToolUse": [
         {
           "matcher": "Bash|PowerShell",
           "hooks": [
             {
               "type": "command",
               "command": "node \"${CLAUDE_PROJECT_DIR}/AiCompressionAssist/hook.js\""
             }
           ]
         }
       ]
     }
   }
   ```

3. Restart / start a new Claude Code session so the hook loads.

> Tip: keep the filters conservative until you trust them. Everything is logged
> raw, so you can always compare `logs/history_1.md` against what the agent saw.

## Configuration (env vars)

| Var | Default | Purpose |
|---|---|---|
| `LOG_DIR` | `./logs` | Where the rolling history files are written |
| `MAX_LINES` | `600` | Line budget per history file before rotation |
| `HOOK_CAPTURE` | *(unset)* | When set, record the raw hook payload and pass output through unchanged |

## The rolling history buffer

Only outputs that were *actually filtered* are logged (clean output isn't
duplicated). Each entry gets a timestamp, the command, and a **stats line**
(`raw: 120 lines / 5.4 KB → cleaned: 40 lines / 1.2 KB (saved 66% lines, 78%
bytes)`) so you — or an agent reviewing history — can find an entry by its size
without reading the whole block.

Files rotate FIFO: appended to `history_1.md`; at `MAX_LINES` → delete
`history_3`, `2 → 3`, `1 → 2`, fresh `history_1` (which re-injects a header
telling an agent to read `history_1` first, then `2`, then `3`). `logs/` is
git-ignored.

**Deep-diagnosing a bug?** The output the agent saw was *minimally filtered*.
Read `logs/history_1.md` (newest), then `history_2.md`, then `history_3.md` for
the exact original text.

## Test it

```bash
npm test                 # filters + hook, both tool_response shapes, fail-open
npm test 2>&1 | node cli.js   # see the filter compress live output via pipe mode
```

## Files

| File | Role |
|---|---|
| `hook.js` | The PostToolUse hook: reads the payload, logs raw, filters, returns `updatedToolOutput` |
| `filters.js` | The compression rules (regex + thresholds) — the one place to tune filtering |
| `historyBuffer.js` | Multi-file FIFO rotation + stats + agent header injection |
| `pipeline.js` | Shared filter-and-log step used by the hook and CLI |
| `cli.js` | Pipe mode (`… | node cli.js`) for manual wrapping / testing |
| `report.js` | `npm run report` — measured savings from `logs/savings.json` |
| `selftest.js` | Full self-test (`npm test`) |
| `CompressionGuidlelines.Md` | Design spec (corrected) |
| `TOGGLE-AND-TEST.md` | Operator guide: turn on/off + measure the difference |

## Extending the filters

Each rule in `filters.js` is individually exported (`cleanTestSuites`,
`stripDependencyLogs`, `prunePathBloat`) and only collapses runs above a
threshold. Add a rule by writing a classifier regex + a `collapseRuns(...)`
call, then chain it inside `compress()`. Run `npm test` after any change.
