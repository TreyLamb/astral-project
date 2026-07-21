# Turning the compression hook ON / OFF (and measuring it)

Plain-English operator guide. For the design, see `CompressionGuidlelines.Md`;
for the dev details, see `README.md`.

**What it does:** strips repetitive terminal noise (test `PASS` walls, npm/pip
download bars, `node_modules`/cache path dumps) out of command output *before
the agent reads it*, so a session burns fewer tokens. The full raw output is
always backed up to `logs/`.

**Is it safe?** It's **fail-open**: if it hits anything it doesn't understand,
or errors, it emits nothing and your original output passes through untouched.
The worst realistic case is it filters a bit too much — and even then the exact
original is sitting in `logs/history_1.md`. It never calls a model, never hits
the network, and costs nothing.

---

## ✅ Turn it ON

**Step 1 (recommended once) — confirm the output shape on your machine.**
Enable capture mode so the hook just *records* what it receives without changing
anything:

```powershell
# PowerShell, in this folder
$env:HOOK_CAPTURE = "1"
```

Then do Step 2, start a session, run a command or two, and read
`logs/history_1.md` to confirm it captured real output. When satisfied:

```powershell
Remove-Item Env:\HOOK_CAPTURE
```

**Step 2 — register the hook.** Add this to `.claude/settings.json` (use
`.claude/settings.local.json` to keep it just for you). If a `"hooks"` block
already exists, merge the `PostToolUse` array into it. The matcher covers
**both** `Bash` and `PowerShell` — Claude Code treats these as separate tool
names, so a `"Bash"`-only matcher never fires for commands run through the
PowerShell tool (this bit us once: hook silently never ran, and since it's
fail-open + only logs when it collapses something, there was no error to
notice — just an empty `logs/` folder):

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

**Step 3 — restart Claude Code** (start a new session) so the hook loads.

**Confirm it's working:** run something noisy (e.g. `npm test` in a project with
lots of passing tests). The output you see should show `… [N … collapsed] …`
markers, and `AiCompressionAssist/logs/history_1.md` should have a new entry
with the full raw text.

---

## ⛔ Turn it OFF (fast)

Pick whichever is quickest for you — **all reversible, none destructive:**

1. **Cleanest:** delete the `PostToolUse` block you added from
   `.claude/settings.json`, then restart the session.
2. **Keep the config, kill the behavior:** change the matcher so it matches
   nothing (e.g. `"matcher": "NeverMatchThis"`), restart.
3. **Instant panic button:** the hook only acts on real output — if you suspect
   it's misbehaving mid-session, just remove the block (option 1) and restart;
   because it's fail-open, disabling it can never leave your output in a bad
   state.

After disabling, your tool output is 100% back to normal immediately on the next
session. Nothing else in the repo depends on it.

---

## 🔎 "Is it doing anything weird?" checklist

| Symptom | What to do |
|---|---|
| `logs/` never gets *any* entries, ever, across whole sessions | Check the `matcher` in `.claude/settings.json` covers every shell tool you actually use (`"Bash\|PowerShell"`), and confirm you restarted the session after the last edit — hooks only load at session start. Set `HOOK_CAPTURE=1` and run one command as a decisive test: if `history_1.md` still doesn't appear, the hook process isn't being invoked at all. |
| Output looks like it's missing something | Open `logs/history_1.md` — the full raw output for every filtered call is there. |
| It's collapsing things it shouldn't | Loosen the thresholds in `filters.js` (`TEST_RUN_MIN`, `DEP_RUN_MIN`, `PATH_RUN_MIN` — raise them) and run `npm test`. |
| It's not collapsing obvious noise | Lower those thresholds, or add a rule (see README "Extending the filters"). |
| Anything looks corrupted / broken | It shouldn't (fail-open). Turn it OFF (above) and note what the command was — that's a filter bug worth fixing. |

---

## 📊 Measuring the difference

You have two ways to see whether it's worth it.

### Method A — self-measured (easiest, no A/B needed)
The hook records, for every filtered output, both what you *would* have read
(raw) and what you *actually* read (cleaned) into `logs/savings.json`. So just
use Claude Code normally for a while, then:

```powershell
npm run report
```

Example:

```
  Lines read:        4,120               1,090
  Est. tokens read:  ~48,000             ~12,500
  SAVED:  3,030 lines  |  ~35,500 tokens  (74% fewer lines read on filtered outputs)
```

- Survives log rotation (the tally is separate from the rolling history).
- **Reset** anytime by deleting `logs/savings.json`.
- Token numbers are estimates (~4 chars/token), and it only counts outputs that
  actually had noise — clean output is never touched, so real per-session
  savings depend on how noisy your commands are.

### Method B — true A/B (measures real session token usage)
If you want the real end-to-end number, run the *same* workload twice:

1. **Baseline (OFF):** pick a repeatable task (e.g. "run the test suite, fix one
   failing test"). Do it with the hook **off**. Note total tokens from Claude
   Code's `/cost` (or the context meter in the status line).
2. **Treatment (ON):** start a fresh session, enable the hook, do the *same*
   task. Note tokens again.
3. Compare. Also run `npm run report` to see exactly what the filter removed
   during the ON run.

Keep the workload identical and start each run fresh so the numbers are
comparable. Method A tells you what the filter stripped; Method B tells you what
that meant for actual session cost.


user placed commands here intentionally:

Remove-Item Env:\HOOK_CAPTURE

Rename-Item ".\.claude\settings.json" ".\.claude\settings.json.tmp"
Rename-Item ".\.claude\settings.json.disabled" ".\.claude\settings.json"
Rename-Item ".\.claude\settings.json.tmp" ".\.claude\settings.json.disabled"