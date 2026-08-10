# Session Handoff — 2026-08-04 / 08-05

**STATUS: ALL WORK COMPLETE.** Everything below is in the working tree.
Commit `e999ec9` (made by Trey mid-session) holds the content work; the camelCase
rename that followed is **uncommitted**. Run `git status` first.

---

## ⚠️ TREY'S RULINGS — source of truth, override any doc

### 1. ONE chest, ONE legs, ONE back lift per cycle. Three lift sessions total.
> *"The hard rule is only one lift A per cycle. One lift B, one lift C, per cycle. all and any
> documents contradicting this should be updated. this comment is the source of truth. Lift a,b,c
> is usually chest, legs, back... there's only one chest,leg,back workout per cycle, regardless of
> which LIFT 'x' letter they are assigned"*

✅ **APPLIED.** Lift A removed from D11. Single Lift A at **D2**.
`training-context.md` preserves the *prior* deliberate decision that added the second Lift A
(D8→D11, to fix a rule-11 chest↔back gap), marked **"do NOT re-add"**. Keep that history — it is
why the mistake looked intentional, and deleting it invites a repeat.

### 2. The 13-day cycle is a RECOVERY CHOICE, not a derived minimum.
> *"Current cycle lengths at 13 days are mostly so that i have extra recovery days between all
> workouts. In the future these cycles will drop when i don't feel i need as much recovery."*

✅ **APPLIED.** The causal order is **recovery need → 3-day gaps in rules 2/3/4 → 13-day floor**,
not the reverse. `cycle.md` rule 9 + the cycle-length proof now frame 13 as a **floor, not a target**.

🚫 **STANDING INSTRUCTION: DO NOT SHORTEN THE CYCLE.** Slack appearing elsewhere is not a reason.
Removing the second Lift A freed lift-placement room — that room is deliberately left unspent.
The cycle shortens only after **Trey** relaxes the gaps. Expect ~10–11 days eventually, when he says so.

---

## COMPLETED WORK

| # | Task | Status |
|---|---|---|
| 1 | MFT mobile Goals/Miles toggle | ✅ verified in browser |
| 2 | Sled/carry hybrid speed day | ✅ |
| 3 | Lang → **Vocab Vault** | ✅ verified |
| 4 | Two-workout-day visual separation | ✅ verified |
| 5 | Ab circuit days | ✅ |
| 6 | Pushup plan + read-only dashboard | ✅ verified (Excel COM + Playwright) |
| — | camelCase rename | ✅ 3,000 renames, build passes |

### #1 + #4 — MFT Calendar
`CalendarView.jsx`, `fitnessConfig.js`, `WorkoutDocsView.jsx/.css`
- `useIsMobileViewport()` matchMedia `(max-width: 640px)` — existing breakpoint, not a new one.
- Tri-state `calendarPrefs.showWeekSideCols`: `null` = device default, boolean = explicit override.
  `override != null ? override : !isMobileViewport` → desktop ON, mobile OFF, toggle wins either way.
- Conditional render (not `display:none`) so day cells reclaim width.
- Multi-session days → stacked chips + divider + "N×" badge, icons 🏋️/🔥/🏃.
- ✂️ Split logic scoped to `training.md` + `cycle.md`. The 3 older ACFT docs use `+` *inside* single
  sessions ("strides + relaxed ~2:00 400s") and would mis-split. Deliberate.

### #2 + #5 — Running docs
Sled/Carry hybrid on **Speed Day 1 (D1)** — chosen because D1 is preceded by the full rest day and
followed by chest (non-competing); D10 was rejected for sitting 2 days before the long run.
**This reasoning is independent of lift count.** Sled drag 4x25m, lateral sprint 4x50m, farmers carry
3x50m, closing 3x50m sprints @90–95%.
Ab circuits on **D2/D5/D9/D12** (gaps 3/4/3/3), 3 rotating ~20-min variants. Light ab (~5–8 min) on
Speed Day 2 only — deliberately **not** D1, since the farmers carry already loads core hard.

### #3 — Vocab Vault (`/vocab-vault`, `/lang` redirects)
**Key finding:** commit `935714a` ("Add bashmon, gitmon, signal-lost pages") **deleted the `/lang`
route** as collateral damage on Jun 24. No Navbar link or Home tile ever existed. A fully-built tool
sat unreachable ~6 weeks.

| Language | Categories | Entries | Slang |
|---|---|---|---|
| Mandarin | 15 | 289 | 10 |
| Cantonese | 15 | 286 | 8 |
| Korean | 12 | 242 | 8 |
| Japanese | 10 | 198 | 5 |

**1,015 entries total.** Add/edit/delete + bulk paste import (`word \| romanization \| english \| notes`),
Quick Review (10q), weighted spaced-repetition sampling. `langFirestore.js` + `langContext.js` give
cloud sync; merge-on-sign-in dedupes by `langId+category+word+english`, **sums** quiz counters, takes
**max** lastSeen, never deletes local data.
- **Bug fixed:** Type Answer set `typedResult='wrong'` but the results object only has
  `correct/incorrect/skipped` → `undefined + 1 = NaN`. Wrong answers silently vanished from scores.
- ⚠️ **NOT verified:** live Firestore reads/writes (no real credentials locally). Signed-out
  localStorage path IS verified end-to-end.
- ✂️ Korean skipped `places`/`question_words`/`weather` (budget, not accuracy).
- ✂️ Internal `Lang*.jsx` filenames + `lang-` CSS prefix intentionally kept.
- Grammar page is still a hardcoded "coming soon" stub.
- `Lexicon.jsx` overlaps conceptually but is a different UX (swipe-sort). **Not merged — Trey's call.**

### #6 — Pushups + Dashboard
**Eligible days (ONE bench day):** bench@D2 blocks D1–D4; back@D7 blocks D6–D8 → D5,D9,D10,D11,D12,D13.
Rulings: **D13 full-rest EXCLUDED** → **5 days/cycle, 10 total**. Speed days included. Both are
flippable constants (`EXCLUDE_FULL_REST_DAY`, `EXCLUDE_SPEED_DAYS`) in `generate-pushup-plan.mjs`.
Leg-day 4pm cutoff is **dormant** (leg day always falls inside the bench+2 window) — implemented
generically with a runtime self-assertion that warns if a future edit makes it fire.
Progression: 15 flat → 15/16 alt → all 16 → 16/17 → ... last day 19,20,19,20 = 78.
✂️ **4-set vs 6-set ambiguity unresolved by design** — both variants ship as separate sheets.
- **Bug found & fixed:** style pass emitted a **duplicate `<sheetView>`** (SheetJS already writes one).
  Classic silent-Excel-repair cause. Verified clean in real Excel via COM + LibreOffice headless.
- Dashboard is **structurally** read-only: keydown listener gates on `viewMode === 'edit'`, formula bar
  doesn't render, `SheetGrid` strips mutating handlers. Playwright-tested by typing into a cell.
- Generic — verified against an unrelated sales workbook.
- `runningworkouts-derived/training-with-pushups.md` is generated from the xlsx so it can't drift.
  `training.md` (= what Trey calls "workouts.md") is authoritative and was never edited.

### camelCase rename
**3,000 renames, all registered as `R`** (not delete+add — the Windows case trap was avoided).
Components stayed PascalCase; folders + non-component files camelCased.
`planning-tool`→`planningTool`, `pokered_page`→`pokeredPage`, `league_build`→`leagueBuild`,
`python-game`→`pythonGame`, `signal-lost`→`signalLost`, `pokemon_OG`→`pokemonOg`, etc.

**Exclusions verified intact:** `api/_lib` (renaming exposes `firebaseAdmin.js` as a public endpoint —
Admin SDK bypasses Firestore rules), `api/import-meals.js` + `api/orbit-*.js` (filename IS the live URL),
`public/chinese-idioms` + `public/fitness-tracker` + `public/planning-tool-samples` (live URLs / runtime
`fetch()`), `pokered-bug-sweep` + `pokered-fully-wire` skill dirs (dir name IS the skill name).

**Deliberately NOT renamed** (correct — these are not file paths):
- URL routes `/signal-lost`, `/python-game` — user-facing URLs; renaming breaks bookmarks.
- localStorage keys `league_build_v1` etc. — renaming would **orphan existing user data**.

---

## KNOWN LOOSE ENDS
1. Empty dirs `pokemon_OG/` and `src/pages/pokered_page/` can't be deleted — "Device or resource busy"
   (a lingering background process holds them). **Cosmetic only** — git doesn't track empty dirs.
   `rmdir` them after a reboot or once the lock clears.
2. `_pt_dashboard_test.mjs` untracked at repo root — leftover Playwright script, safe to delete.
3. Duplicate skill entries (`pokered_page:` and `pokeredPage:`) will resolve once #1 clears.
4. Open, needs Trey: a Phase-3 full-ACFT-simulation idea in the training docs assumes the full ACFT is
   in scope; every other doc scopes to the 2-mile run only.

## RECOMMENDED NEXT STEP
Commit in **two passes** — content first, then the rename alone. A rename tangled with content
changes is miserable to bisect if Vercel throws a case-sensitivity error on deploy.
`npm run build` passes clean as of this writing.
