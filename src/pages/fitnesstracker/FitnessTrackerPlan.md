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
