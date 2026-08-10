# Phase 8 — Day Adjustments (Reschedule / Add X / Remove X) + Route Map

**Mission:** give the user first-class buttons to react to how a day actually unfolds — **Reschedule** a task/day/week (priority-aware cascade), **Add X** tasks onto today when there's spare bandwidth, **Remove X** overflow off today to a better day — plus a **daily route map** so the day's driving is verifiable at a glance. All of it stays behind the staged-preview accept flow; nothing auto-commits.

This is **doc §17 Phase 5** of `src/pages/orbit/guidelinesScheduler.md` (the "spec"). The deep sections are **§13 (Reschedule / Add X / Remove X, deferability score)** and **§14 (route map)**.

---

## ⚡ AGENT PROMPT (read this, then read the WHOLE doc before writing code)

> You are extending an already-built deterministic task-scheduler inside the **Orbit** sub-app of a React SPA. **Phases 1–6 (and ideally 7) are done and green:** there is a working timed solver (`calc/scheduler.js` → `buildTimedPlan`), pure energy/travel/weather modules, an AI-annotation flow, and a staged-plan preview (`views/AutoScheduleView.jsx`). Your job is Phase 8: the three **day-adjustment actions** and the **route map**, exactly as specified below.
>
> **You can only see `src/pages/orbit/` and `src/pages/fitnesstracker/`.** Both are in-scope and editable. Everything Phase 8 needs is in those two folders — you do **not** need any file outside them (no `api/`, no `package.json`, no site-level `App.jsx`/`Navbar`/`Home`). The **route map must be dependency-free** (see §5.5) precisely because you cannot add an npm package (that would require editing `package.json` at the astral-project root, which you cannot see). If you believe you need something outside these folders, STOP and flag it in your report.
>
> **Definition of done:** every checklist MUST implemented; new pure logic unit-tested; `npx vitest run` all-green; `npm run build` clean; `npx eslint <changed/new files>` clean; coverage-matrix report (§8). Do not regress the existing tests.
>
> Read the rest of this document fully first — it has the exact signatures you build on, the gotchas, and per-feature specs.

---

## 1. Repo & environment constraints
- **Editable, in-scope:** `src/pages/orbit/` (all of it) and `src/pages/fitnesstracker/`. New Orbit views/routes register in `src/pages/orbit/OrbitApp.jsx` (in-scope). The fitness **calendar is the app's main visual surface** (spec §2) and already renders Orbit tasks via `src/pages/fitnesstracker/orbitTasksBridge.js` + `CalendarView.jsx` — a natural place to surface a per-day "Reschedule / Add / Remove" affordance and the route map, in addition to `AutoScheduleView`.
- **Out of scope / invisible:** astral-project root. Phase 8 needs none of it. **No npm installs** (so the route map uses inline SVG + public OSM raster tiles as `<img>`, no Leaflet — see §5.5).
- **Commands from root (work despite scoped file view):** `npx vitest run`, `npm run build`, `npx eslint <files>`. Tests MUST live under `src/pages/orbit/**/*.test.js` (or `src/pages/fitnesstracker/**/*.test.js`) to be discovered.
- **Do NOT touch** the Firestore coalescing machinery in `orbitContext.js`. **Do NOT** update the external project-memory file. **DO** update the "Where it stands" block in `guidelinesScheduler.md` when done.

---

## 2. Current code you build on (authoritative signatures)

### `calc/scheduler.js`
```js
buildTimedPlan(input) => { placements, unplaced }
// input keys: tasks, days, capacityFor, busyFor, guardrails, weatherFor,
//   placesById, durationDb, fatigueCfg, defaultRecoveryMin, weatherAvoidPrecipPct, homePlace, travelOpts
//   (if Phase 7 shipped, also: rules, softWeights — check the file)
// placement = { taskId, date, startMin, endMin, blockStartMin, blockEndMin,
//   workMin, recoveryMin, travelMinBefore, energyCost, startLabel, endLabel, reasons:[] }
// also exported: parseHM, minutesToHM, freeIntervals, guardrailWindow
```
**Reuse `buildTimedPlan` as the placement engine** for all three adjustments — you run it over a *bounded* task set / day window rather than reimplementing placement. That is the whole point of §13: "all re-run the §10 solver over a bounded window and use the staged-preview + accept flow."

### `calc/energy.js`, `calc/travel.js`, `calc/weather.js` — pure helpers
```js
// energy.js
startingTank, heatMultiplier, conditionMultiplier, energyCost(task,slot), estimateWorkMin, recoveryMin, blockMinutes, normalizeTitle
// travel.js
haversineMiles(a,b), roadMinutes, rushHourMultiplier, travelMinutes(from,to,hour,opts), clusterByProximity(items,radiusMiles)
// weather.js
shapeOpenMeteoForecast, weatherLookup(cache,locId)->(date)=>entry|null, dateIsRainy(entry,threshold), outdoorRescheduleFlags(tasks,cache,threshold)
```

### Task model & context (`orbitConfig.js`, `orbitContext.js`)
- Task fields (all exist): `status ('todo'|'doing'|'done'|'killed'), scheduledDate, scheduledTime, pinnedToday, pinnedOn, dueDate, blockedBy[], priorityScore, importance, urgency, energy, intensity, difficulty, timeMin, estWorkMin, estRecoveryMin, category, indoorOutdoor, weatherSensitive, perishable, locationId, idealWindow, constraints[]`.
- Readiness/priority helpers: `calc/readiness.js` `isReady(task, tasksById)` (unblocked); `calc/priority.js` `compareForToday(a,b,today)`, `isOverdue(task,today)`.
- `useOrbit()` exposes: `tasks, tasksById, settings, today, getDayPlan, setDayPlan, updateTask, mode, places, durations, weather, rules, weatherRainFlags`. **`updateTask(id, patch)` recomputes priorityScore — never set it yourself.**
- A task is "scheduled on day D" when `scheduledDate === D`. Committing an adjustment = `updateTask(id, { scheduledDate, scheduledTime })` (and `scheduledDate:null` to unschedule/defer to backlog, or a different date to move).

### `views/AutoScheduleView.jsx`
The staged-preview pattern to mirror: run the solver → group `byDay` → per-item Apply(checkbox)/Remove/Pin/Move → an "Apply plan (N)" commit button. Per-day cards already show dry-run stats (tank 🔋 / travel 🚗 / weather ☀️☔). **Your Add X / Remove X / Reschedule previews should reuse this exact accept-then-commit UX** (a small modal or inline panel scoped to one day is fine).

---

## 3. Gotchas that WILL bite you
1. **`energyCost` uses `intensity ?? energy ?? 3`** — mind this in fit tests and tank math.
2. **Nested settings patches merge against DEFAULTS** — pass a full `{ ...settings.scheduler, ...change }` object (see `SchedulerSection` in `SettingsView.jsx`).
3. **Never set `priorityScore` directly** — `updateTask` recomputes it.
4. **Lint:** no `setState` in an effect body (lazy `useState` init for localStorage reads); no unused vars / dead `eslint-disable`.
5. **Determinism** in all scoring/selection math (no `Math.random`, no `Date.now` inside placement logic). "Which tasks the script chooses" (Add/Remove) must be reproducible and testable.
6. **Tests must live under the orbit/fitness trees** to be discovered by vitest.
7. **Add X and Remove X are deliberate mirror images** and **the script chooses which tasks, not the user** (spec §13). Don't turn them into a manual picker.

---

## 4. Build checklist (MUST / SHOULD / COULD)

### Milestone A — Deferability score (spec §13.3) — the shared primitive
- **A1 (MUST)** New pure module `calc/deferability.js` exporting `deferabilityScore(task, ctx) -> number` (higher = safer to bump off today). It's a function of: no near deadline, not weather-locked-to-today, not part of a cluster the user is still doing today, no dependents waiting on it, not `pinnedToday`. `ctx` supplies `today`, the day's other tasks, `tasksById` (for dependents), and a weather lookup. Fully unit-tested.

### Milestone B — Remove X (spec §13.3)
- **B1 (MUST)** `removeXFromDay(date, x, deps) -> { removed:[placement-ish], keep:[...], replacements }`: drop today's **highest-deferability × lowest-priority** items first until either `x` items are removed (explicit count) OR today fits the remaining time/tank (fit-to-capacity). Protected and never auto-removed: due-today, `pinnedToday`, weather-locked-to-today. Removed tasks are **re-placed on their next best day** via `buildTimedPlan` over the forward window. Pure/deterministic core + a thin UI.
- **B2 (MUST)** UI: a per-day "Remove X" control (in `AutoScheduleView` day cards and/or the fitness calendar day cell) → staged preview of what leaves and where it lands → accept commits (`updateTask` new dates) / cancel.

### Milestone C — Add X (spec §13.2) — mirror of Remove X
- **C1 (MUST)** `addXToDay(date, x, deps) -> { added:[...], source }`: candidate pool = unscheduled backlog **plus** tasks scheduled on future days (nearest future day first). Rank by `priorityScore`, then filter by a **today-fit test**: fits remaining tank today, fits remaining guardrail/awake time, weather OK today (for outdoor/weather-sensitive), travel-sane (clusters near where today already sends the user — use `travel.js`), and no blocking flag (unmet dependency, `idealWindow` mismatch, perishable-after-hot adjacency, explicit not-today). Support explicit count OR fill-to-capacity ("top up ~45 more min / ~N more energy"). **Prefer pulling from the nearest future day** unless a flag says today's a bad fit. Pure/deterministic core + thin UI.
- **C2 (MUST)** UI mirror of B2: per-day "Add X" → staged preview with reasons ("next priority · fits your remaining tank · weather ok today · near your 2pm errand") → accept/reject each → commit.

### Milestone D — Reschedule cascade (spec §13.1)
- **D1 (MUST)** `rescheduleCascade({ scope, date, taskId }, deps) -> stagedPlan`: scope = `task | day | week`. Look at the cancelled item(s) **and everything on/after that date**; decide by priority whether to **push future items back** to make room or **defer the cancelled low-priority items later** — keeping high-priority/deadline work on track. **Deadlines and dependencies are hard limits** during the cascade. Implement by re-running `buildTimedPlan` over the affected forward window with the cancelled slot(s) freed. Deterministic core.
- **D2 (MUST)** UI: Reschedule buttons at three scopes — **per task** (a button on a scheduled task row, e.g. in `TodayView` / task rows), **per day** and **per week** (in `AutoScheduleView` or the fitness calendar). Each opens the staged preview of the cascade → accept commits.

### Milestone E — Route map (spec §14)
- **E1 (MUST)** A **dependency-free** daily route map component (`views/RouteMap.jsx` + CSS) that, given a day's ordered stops (from placements + `places` DB coords + `homePlace`), draws the ordered markers and a connecting polyline, labels each leg with distance (`haversineMiles`) and drive time (`travelMinutes`), and shows the day's total miles/drive-time. Verifiable by eye (spec §14).
- **E2 (MUST)** A **"View in Maps" deep link** for the day's ordered stops (e.g. a `https://www.google.com/maps/dir/?api=1&...` waypoints URL) so the user can open the real route for navigation — this is the pragmatic, keyless way to get an actual map without a dependency.
- **E3 (SHOULD)** Render the SVG markers over **OSM raster tiles as `<img>` backgrounds** (public tile URLs `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, no key, no library) using Web-Mercator lat/lng→pixel math, for a real map look. If the Mercator math is too fiddly to get right within scope, ✂️ downgrade to the schematic SVG (E1) + deep link (E2) and say so — E1+E2 alone satisfy MUST.
- **E4 (SHOULD)** A per-leg note affordance ("this leg looks wrong") that writes a task `constraint`/tag or a rule (ties into the Phase 7 feedback loop if present) — spec §14 "leave a note → feeds §12".
- **E5 (COULD)** Surface the route map on the **fitness calendar** day view (the main visual surface) as well as in `AutoScheduleView`.

---

## 5. Detailed specs

### 5.1 Shared "deps" bundle
All four cores take a `deps` object you assemble once in the UI from `useOrbit()` + settings, mirroring `buildTimedPlan`'s inputs: `{ tasks, tasksById, today, capacityFor, busyFor, guardrails, weatherFor, placesById, durationDb, fatigueCfg, defaultRecoveryMin, weatherAvoidPrecipPct, homePlace, rules }`. Keep the cores pure (no `useOrbit` inside `calc/`).

### 5.2 Remove X selection order (B1)
Sort today's removable (non-protected) placements by a composite key: primary = **deferability desc**, secondary = **priorityScore asc** (lowest priority leaves first). Remove until the stop condition. Then feed removed task ids back through `buildTimedPlan` with `days` = tomorrow…horizon to compute their new landing spots. Return a staged plan the UI previews.

### 5.3 Add X today-fit (C1)
Build candidate pool, sort by `priorityScore` desc, and for each run a boolean `fitsToday(task, remainingState)`:
- remaining tank today ≥ `energyCost(task, slotAtProposedHour)`,
- a legal free interval remains inside the guardrail/awake window today big enough for `blockMinutes`,
- weather OK today if outdoor/weather-sensitive (`!dateIsRainy`),
- travel-sane: proposed stop is within a small radius of an existing stop today, or the added travel is under a threshold (`travel.js`),
- no blocking flag (dependency unmet via `isReady`, `idealWindow` mismatch beyond tolerance, perishable-after-hot adjacency).
Prefer candidates already scheduled on the **nearest future day** (moving earlier is safe) over deep-backlog ones, unless flagged. Stop at the count or when capacity is topped up.

### 5.4 Reschedule cascade (D1)
Free the cancelled slot(s), collect all tasks on/after `date` in the affected scope, and re-run `buildTimedPlan` over that forward window with those tasks as the candidate set (priority-ordered). Deadlines/deps are already hard constraints in the solver — ensure the cancelled task, if deferred, cannot jump a dependency or blow a deadline (if it can't be legally placed, surface it as unplaced with a clear reason). Return staged placements.

### 5.5 Route map — dependency-free (E1–E3)
- **Inputs:** the ordered list of a day's placements (sorted by `startMin`) → resolve each `task.locationId` to `places` coords; prepend `homePlace` as stop 0 if present.
- **Schematic (always works, E1):** normalize the stops' lat/lng into an SVG viewBox (min/max scaling with padding), draw numbered circles + a polyline in visit order, label legs with `haversineMiles`→`roadMinutes`. Show total distance/time. This needs zero deps and no network.
- **Tiles (nice-to-have, E3):** compute a bounding box, pick a zoom, render the covering OSM tiles as absolutely-positioned `<img>` elements, and overlay the SVG markers using slippy-map math (`lng→x`, `lat→y` via Web Mercator). Public tiles, no key. If fiddly, ship E1 and ✂️-note the downgrade.
- **Deep link (E2):** build `https://www.google.com/maps/dir/?api=1&origin=<home>&destination=<last>&waypoints=<mids joined by |>` from the coords (or place names). Opens the real navigable route.

---

## 6. Tests required (`src/pages/orbit/**`, all green)
- **A1 deferability:** a task due today scores low (unsafe to bump); a no-deadline, standalone, unpinned task scores high; a task with a dependent waiting scores lower than an identical one without.
- **B1 Remove X:** given an over-capacity day, removing 2 drops the two highest-deferability×lowest-priority tasks and re-lands them on later days; a due-today/pinned task is never removed even if lowest priority.
- **C1 Add X:** with spare tank, add pulls the highest-priority *fitting* task from the nearest future day; a task that fails the weather/tank/travel test is skipped in favor of the next that fits; fill-to-capacity stops when the tank/time is topped up.
- **D1 Reschedule:** cancelling a day pushes/defers by priority without violating a deadline or dependency; a task that can't be legally re-placed comes back as unplaced with a reason.
- **E (route helpers):** pure geometry/leg-labeling helpers (distance/time per leg, total) are unit-tested even if the SVG rendering isn't.

## 7. Integration/wiring points
- `AutoScheduleView.jsx`: per-day Add X / Remove X / Reschedule controls + the route map, reusing the staged-preview accept UX.
- `views/TodayView.jsx` (and/or task rows): per-task Reschedule button.
- `src/pages/fitnesstracker/CalendarView.jsx` (+ `orbitTasksBridge.js`): optionally surface per-day adjust buttons and the route map on the calendar (E5) — the main visual surface. Keep FitnessTracker's `ft-` CSS prefix if you add styles there; keep Orbit styles `orb-` prefixed.
- No files outside `src/pages/orbit/` and `src/pages/fitnesstracker/`.

## 8. Definition of done — report format
Coverage matrix for every checklist item (A1, B1–B2, C1–C2, D1–D2, E1–E5) → Done/Partial/Cut with file+line. Separate verification section: final `npx vitest run` summary line, `npm run build` result, `npx eslint <changed files>` clean. Mark every agent-initiated omission/downgrade with ✂️ (especially if E3 tiles were downgraded to the schematic). Update the "Where it stands" block in `guidelinesScheduler.md` (Phase 8 = doc §17 P5 built; note what remains).
