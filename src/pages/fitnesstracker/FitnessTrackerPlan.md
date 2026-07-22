# FitnessTracker — Plan & Phase Coverage

**Binding spec:** `FT_ProjectDoc.md` (same folder). **Architecture** (decided with Trey): Firestore-backed sub-app inside astral-project — no Node/SQLite backend. Reuses Firebase Google auth + Firestore (medaldex/pogoaccs pattern); all calculators / import / PWA / calendar client-side. GPS device = **Apple Watch** → import targets GPX/TCX.

Every physiological/statistical constant is researched, cited in-code, and **unit-tested against reference values** (Vitest — `npm test`). `✂️` marks *agent-initiated* cuts; phase boundaries were user-directed, not cuts.

---

## Phase 1 — scaffold + data model + calendar shell ✅
Sub-app shell, canonical-unit data model, dual persistence (localStorage + Firestore), month/week/day calendar, planned-vs-completed chips, drag-reschedule, quick-add, entry editor, Home card + route + navbar.

## Phase 2 — fast entry + running calculators ✅
| # | Requirement | Status |
|---|---|---|
| 1 | Shorthand parse ("5mi 38:20", "1500m 22:10") | ✅ `calc/shorthand.js` + QuickAdd box |
| 2 | Repeat-last / recent templates | ✅ QuickAdd "Repeat recent" chips |
| 3 | Large one-handed targets (mobile-first) | ✅ existing `ft-` styles, responsive |
| 4 | PWA installable (manifest + icon) | ✅ scoped `public/fitness-tracker/manifest.webmanifest` + icons, injected only on the sub-app |
| 5 | Pace/time/distance solver (mi/km/m/yd + track) | ✅ `calc/pace.js` `solve()` + Tools |
| 6 | Even splits + structured reps ("6×800m w/ 400m jog") | ✅ `evenSplits` + `parseStructuredWorkout` |
| 7 | Riegel predictor (1.06) | ✅ `calc/riegel.js` |
| 8 | VDOT + Daniels paces + equivalent races | ✅ `calc/vdot.js` (reproduces VDOT-50 table) |
| 9 | Grade-adjusted pace (Minetti 2002) | ✅ `calc/gap.js` |
| 10 | Karvonen HR zones (real max/rest HR) | ✅ `calc/hr.js` + Settings profile |
| 11 | PR tracking per distance bucket | ✅ `calc/pr.js` + Dashboard shelf |
| 12 | Weekly/monthly mileage + acute:chronic ratio | ✅ `calc/load.js` (ACWR rolling + EWMA) |
| 13 | Elevation gain/loss per run, charted | ✅ entry field + Dashboard chart (auto-fill via Phase-4 import) |

## Phase 3 — swim + lift ✅
- Swim: pace/100 (pool-unit aware), SWOLF, **CSS** two-trial + zones (`calc/swim.js`), swim fields in EntryEditor, CSS card in Tools.
- Lift: sets×reps×weight editor (`LiftSets.jsx`), **1RM** Epley + Brzycki, volume (`calc/lift.js`), 1RM card in Tools.

## Phase 4 — import ✅
- GPX + TCX via native DOMParser → distance/splits/elevation/HR/cadence (`calc/importParsers.js`, `ImportPage.jsx`); haversine + smoothed elevation + interpolated splits (unit-tested).
- CSV import/export (backfill + plain-text backup).
- ✂️ **FIT (binary)** is a best-effort stub that points to GPX/TCX — a maintained in-browser FIT parser wasn't added to avoid a heavy/unreliable binary dep; Apple Watch apps export GPX/TCX cleanly.

## Phase 5 — Google Calendar two-way ✅ (code) / ⚠️ needs live config to exercise
- `calc/googleCalendar.js` (REST client, own calendar-scoped provider — site-wide auth untouched) + `CalendarSync.jsx`: connect, find/create **Training** calendar, push planned+logged as events, pull scheduling changes (last-write-wins by timestamp), import external Google events as planned. Performance data stays local, summarised into the description.
- ⚠️ Runtime-verifiable only when the site's Google Cloud project has the Calendar API + scope enabled and the user consents. Browser OAuth token ≈1h (no refresh token) → occasional reconnect — surfaced in the UI.

## Phase 6 — dashboard/correlations + smart calendar ✅
- Dashboard: PR shelf, ACWR gauge, weekly-volume bars, pace + elevation trends, 30-day rollup.
- Auto-proposed **correlations** (`calc/correlations.js`, Pearson): rest-days→pace, volume→pace, lifting→pace, consistency streak.
- Smart calendar (`calc/planning.js`): dependency-aware **cascade** (move/skip a planned session shifts the chain), **conflict detection** (two planned sessions/day), "Schedule watch" panel, non-workout **event** type + URL field for quick-drops.
- ✂️ URL auto-summarize / free event-lookup API ("POGO raichu day" → auto-fill) is **deferred** — the spec marked it "final logic TBD" and it needs an external API; the manual event + link path is built.

## Phase 7 — stretch ⚠️ assessed, not built
- ✂️ **Strava auto-import**: requires an OAuth token exchange with a client secret (confidential client) → a server the "no-backend" site doesn't have. Deferred; manual GPX/TCX/CSV import already covers Strava data via export. A Vercel serverless function could host the exchange later if desired.
- **Tailscale**: not needed — Firestore already gives phone-anywhere access (Trey confirmed).

## Phase 8 — meal/food schedule ✅
New `meals` entity (dual persistence: `fitnessStorage.js`/`fitnessFirestore.js`/`fitnessContext.js`, mirrors the `workouts` CRUD 1:1). Meal types (Breakfast/Lunch/Dinner/Snack, extensible via `settings.mealCustomTypes`) in `fitnessConfig.js`.
- Two sticky calendar toggles (`settings.calendarPrefs`, persisted): **Meal day view** swaps the Day tab for `MealDayView.jsx` (per-meal-type sections, daily calorie/macro totals, fills the full day-view height); **Show meals on calendar** splits every day cell into a meals column (left) + workouts/events column (right), per the annotated mockup.
- `MealQuickAddModal.jsx` (fast entry, "repeat recent" templates) + `MealEditor.jsx` (full edit/delete, route `meal/:id`) + `MealsView.jsx` — dedicated **Meals** tab: today's totals, 7-day average, upcoming-planned agenda, recently-logged table.
- `calc/nutrition.js` (Atwater kcal/g factors — real conversion constants) + tests: daily totals, macro % split, day-gap-aware averaging.
- ✂️ Swim-style pool-unit toggle not extended to meals (n/a — no unit conversion needed for calories/macros). No daily-calorie-budget alerts/reminders — `settings.nutritionTarget` exists as a reference value shown alongside totals, but no notification system was built.

## Phase 9 — goals: forecast-then-accept ✅
New `goals` entity (same dual-persistence pattern). `calc/goals.js` splits cleanly into (a) baseline estimation reusing the **existing cited formulas** — Daniels VDOT, CSS-style swim pace, Epley/Brzycki 1RM — against real logged workouts, and (b) an explicitly-labeled **heuristic** weeks-to-goal rate model (frequency + diminishing-returns scaling) since no physiological law governs "how long to close a fitness gap" — documented in-code and surfaced in the UI copy as an estimate, not a guarantee. Unit-tested (direction handling, monotonicity, plan-date generation, interpolation).
- `GoalEditorModal.jsx`: pick activity + kind-specific target (run: PR-bucket distance + time; swim: pace/100m; lift: exercise + target 1RM; generic: manual current/target), days/week selector, live forecast preview (current estimate, ~weeks, target date).
- **Save as forecast** (no calendar impact) vs **Accept & add to calendar** (generates planned workouts spread across the forecast window via `buildPlan`, each tagged `goalId` + a human-readable `metrics.goalTarget`).
- Dashboard **Goals** card (directly under Personal records, as requested): list, `+ New goal`, Edit (re-forecasts and regenerates future not-yet-completed sessions), Abandon (status + removes future planned sessions).
- Calendar chips carry a 🎯 pin badge when tied to a goal (tooltip: goal name + that session's specific target) — `WorkoutChip` in `CalendarView.jsx`.
- ✂️ No editable per-goal periodization curve (build/peak/taper) — the plan is a single linear interpolation from baseline to target, documented as a deliberate simplification over full training-block periodization.

## Small UX fixes (same pass)
- Day-view "dead space" layout bug fixed — `.ft-main → .ft-cal → .ft-cal-body → .ft-day` now form a real flex chain so the day cell fills the viewport instead of stopping at a flat 320px.
- Topbar **+ Log** now defaults to **Completed**; clicking a calendar day now reads **"Schedule a workout"** and defaults to **Planned** — same modal, `mode` prop distinguishes intent. Mirrored for meals (Log vs Schedule a meal).
- `ClearableInput.jsx` — one-tap ✕ to reset a field — applied to the optional numeric/text fields across QuickAddModal, EntryEditor, and both new meal/goal forms (previously the only way to undo an accidental fill was manual select-all-delete).

## Verification
`npm test` → 103 passing (14 files, up from 76/12). `npm run build` green. `eslint src/pages/fitnesstracker` clean. Playwright-driven browser pass across calendar (month/week/day + both new toggles), meal quick-add/edit, Meals tab, Dashboard Goals card, and a full goal create→accept→calendar-plan round trip (verified real baseline estimation from a logged 20:00 5K, non-zero forecast, 🎯-badged planned workouts appearing on the calendar): zero console/page errors.

## Phase 10 — checkpoint/forecast engine + body-weight goals ✅
Built out the forecast function against `Guidelines_Forecast.md`'s full spec (checkpoint trajectories, editable/recompute-forward, realism index, cadence rules), extending Phase 9's `goals` entity in place rather than replacing it, plus added body-composition (weight) goals per request.

- **Checkpoint model**: `goal.checkpoints` (ordered array: date, targetValue, source, realism, provisional, actualValue, loggedAt, status) is the recompute source of truth. Checkpoints are derived LIVE at render time (`goal.checkpoints.find(c => c.date === w.date)`) rather than duplicated onto workout rows — avoids a stale-write race where a workout's own field edits and a checkpoint mirror-write could clobber each other, and old pre-checkpoint goals (`checkpoints: null`) simply render as before with zero migration needed.
- **`calc/curves.js`**: domain-specific curve shapes replacing the old flat linear interpolation — `cardioCurve` (front-loaded/diminishing-returns, run/swim), `strengthCurve` (flat-linear-then-plateau, lift), `bodyCompCurve` (linear energy-balance, weight).
- **`calc/bodyComposition.js`** + **Research Entry appended to `Guidelines_Forecast.md` §3**: Wishnofsky 1958 (kcal↔lb, short-horizon/secondary display only), ISSN position stand (Aragon et al. 2017/2022 — 0.5–0.75%BW/wk loss rate cap), Helms lean-bulk research (0.25–0.5%BW/wk gain cap).
- **`calc/realism.js`**: non-blocking realism index (conservative/plausible/implausible) per domain against cited bounds — surfaced as a chip flag (⚠), a Goals-panel badge, and a modal insight tile. Never caps or blocks, only flags.
- **`calc/checkpoints.js`**: cadence resolution (`auto` suggests coarser cadence for longer goals) independent of task frequency, rest-day shifting (run/lift/swim minimum gaps), `recomputeFrom`/`mostRecentTouchIndex` (the recompute-forward engine — "Logged actual" vs "Manual override" per §6), `buildTaskSessions` (plain non-checkpoint training days), `formatCheckpointValue` (shared target/actual formatter, replacing three hand-rolled copies).
- **Calendar display** (`CalendarView.jsx`): chips now show the checkpoint target inline (`ft-chip-target`), and once logged, actual-vs-target using the app's existing `{actual}<small>/target</small>` idiom — previously target was hover-tooltip-only. Scales with Month/Week/Day per the existing zoom convention.
- **`EntryEditor.jsx`**: new checkpoint panel (target, realism band, provisional basis, manual-override field) on any checkpoint-tagged workout; completing one with real numbers auto-logs the actual result via `extractRunResult`/`extractSwimResult`/`extractLiftResult` (new, reusing the same cited formulas the baseline estimators use).
- **`GoalEditorModal.jsx`** rewritten: real **deadline** input (date or "in N weeks" duration) replacing the old computed-only target date; **task frequency** and **checkpoint frequency** are now separate controls; new **weight** kind (current/target weight, lose/gain direction toggle); a live Realism insight tile; editing an accepted goal now recomputes forward from the most recent touch point (or rebuilds the schedule from that point if deadline/cadence itself changed) instead of deleting and regenerating everything.
- **Body-weight tracking**: new `BodyWeightLog` entity (dual persistence, mirrors `goals`/`meals` 1:1), `WeighInModal.jsx` (fast entry), `BodyWeightPanel.jsx` (latest/7d/30d deltas, trend chart via `MiniChart`, next-checkpoint actual-vs-target) — added to `MealsView.jsx` and a compact tile in `MealDayView.jsx`, living inside the food-tracking area per request. A weigh-in logged within 3 days of a weight-goal checkpoint auto-satisfies it.
- **Goal lifecycle**: added `paused` status (Pause/Resume buttons on both Goals panels, freezes without deleting) and `closed_met`/`closed_not_met` fields (not yet surfaced with dedicated UI — ✂️ see below).
- ✂️ Flexibility/Habit/Skill-milestone goal types — not requested, no supporting activity types exist; deferred per the spec's own framing as future work.
- ✂️ Milestone-triggered cadence — selectable in the data model, falls back to weekly (none of the shipped kinds need the dedicated scheduler).
- ✂️ Lift realism uses one conservative absolute-kg/week bound for all lift goals (no exercise→body-region classifier exists to split the cited upper/lower-body rates).
- ✂️ Google Calendar sync (`calc/googleCalendar.js`) does not yet push checkpoint targets into synced event descriptions — confirmed inert (no `goalId`/`goalTarget` reference today), not broken; a follow-up, not bundled in.
- ✂️ No dedicated "close out a goal" UI for `closed_met`/`closed_not_met` yet — the status values and fields exist on the model, Abandon still covers early termination.

**Verification**: `npm test` → 134 passing (18 files, up from 103/14) — new suites `calc/curves.test.js`, `calc/bodyComposition.test.js`, `calc/realism.test.js`, `calc/checkpoints.test.js` (including the core recompute-forward invariant: a worse-than-projected logged result leaves everything at/before the touch point untouched and steepens, never softens, the remainder). `npm run build` clean, `eslint src/pages/fitnesstracker` clean. Playwright-driven browser passes (two rounds, zero console/page errors) covering: run-goal create→accept with a real deadline, calendar chips showing inline target text in Month/Week/Day, realism ⚠ flags on aggressive checkpoints, Pause button + realism badge on both Goals panels, weigh-in logging + Body weight panel in Meals, weight-goal create with auto-baseline from a logged weigh-in and a live Realism tile, and the EntryEditor checkpoint panel (target/realism/provisional basis/manual override) on a lift goal.
