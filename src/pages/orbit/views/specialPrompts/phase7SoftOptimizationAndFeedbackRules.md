# Phase 7 — Soft Optimization + Feedback→Rules Loop

**Mission:** make the auto-scheduler's placements *smart* (batch nearby errands, avoid bad adjacencies, honor time-of-day preferences, minimize context-switching) and make it *learn* (when the user rejects/corrects a placement, crystallize the correction into a durable task-tag or a policy rule the deterministic placer enforces forever).

This is **doc §17 Phases 3 + 4** of `src/pages/orbit/guidelinesScheduler.md` (referred to below as "the spec"; the relevant deep sections are **§7 batching, §10 step 5, §12 feedback→rules**).

---

## ⚡ AGENT PROMPT (read this, then read the WHOLE doc before writing code)

> You are extending an already-built deterministic task-scheduler inside the **Orbit** sub-app of a React SPA. **Phases 1–6 are done and green** (339 tests): there is a working timed solver (`calc/scheduler.js`), pure energy/travel/weather modules, an AI-annotation flow, and a staged-plan preview UI (`views/AutoScheduleView.jsx`). Your job is Phase 7: **soft optimization** (Milestone A) and the **feedback→rules loop** (Milestone B), exactly as specified below.
>
> **You can only see the `src/pages/orbit/` and `src/pages/fitnesstracker/` folders.** Everything you need for this phase lives in `src/pages/orbit/` — you do **not** need to create or edit any file outside it (no `api/`, no `App.jsx`, no `package.json`). If you ever think you do, STOP and flag it in your report instead.
>
> **Definition of done:** every checklist MUST item implemented; new pure logic unit-tested; `npx vitest run` all-green; `npm run build` clean; `npx eslint <your changed/new files>` clean; and a coverage-matrix report (see §8). Do **not** regress the existing 339 tests — if a change to `buildTimedPlan` intentionally alters output, update the affected tests in `calc/scheduler.test.js` deliberately and say so.
>
> Read the rest of this document fully first. It contains the exact current function signatures you build on, the non-obvious gotchas that will bite you, and the precise spec for each item.

---

## 1. Repo & environment constraints

- **Editable, in-scope:** anything under `src/pages/orbit/`. Also `src/pages/fitnesstracker/` if you genuinely need to surface something on the fitness calendar (you probably don't for Phase 7).
- **Out of scope / you cannot see it:** the astral-project root (`api/`, `src/App.jsx`, `src/components/Navbar.jsx`, `src/pages/Home.jsx`, `package.json`, `vitest.config.js`). Phase 7 needs **none** of these. New Orbit views/routes register inside `src/pages/orbit/OrbitApp.jsx` (in-scope) — but Phase 7 adds **no new route**; it extends existing files.
- **Commands run from the astral-project root** (they work even though your file view is scoped): `npx vitest run`, `npm run build`, `npx eslint <files>`. Test files must live under `src/pages/orbit/**/*.test.js` or they will NOT be picked up (the vitest `include` glob is scoped — you cannot change it, so just put tests in the orbit tree).
- **Do NOT touch the Firestore write-coalescing machinery** in `orbitContext.js` (`emptyDirty`/`emptyDeletes`/`flush`/`COLLECTIONS`). The scheduler DBs (`rules`, etc.) are deliberately localStorage-only for now (spec §3.2). Rules already have working local persistence — reuse it (see §2).
- **Do NOT update** the project memory file (it lives outside these repos). DO update the "Where it stands" block at the top of `guidelinesScheduler.md` when you finish.

---

## 2. Current code you build on (exact signatures — verify by reading the files, but these are authoritative)

### `calc/scheduler.js` — the solver you will extend
```js
buildTimedPlan(input) => { placements, unplaced }
// input = {
//   tasks,          // priority-ordered candidate tasks (array)
//   days,           // ['YYYY-MM-DD', ...] in order
//   capacityFor,    // (dateISO) => number  (the day's full energy tank C)
//   busyFor,        // (dateISO) => [{startMin, endMin, label}]  fixed events
//   guardrails,     // settings.scheduler.guardrails  {awake:['07:00','22:00'], byCategory:{shopping:['09:00','20:00'],...}}
//   weatherFor,     // (dateISO) => {hourly:[{hour,tempF,precipProb}]} | null
//   placesById,     // Map(placeId -> {lat,lng})
//   durationDb,     // array of duration entries
//   fatigueCfg,     // settings.scheduler.fatigue {thresholdPct,carryFactor,maxCarryPct}
//   defaultRecoveryMin,
//   weatherAvoidPrecipPct,
//   homePlace,      // {lat,lng} | null  (start-of-day origin for travel)
//   travelOpts,     // optional
// }
// placements[i] = {
//   taskId, date, startMin, endMin, blockStartMin, blockEndMin,
//   workMin, recoveryMin, travelMinBefore, energyCost,
//   startLabel, endLabel, reasons:[string]
// }
// unplaced = [taskId]

// Also exported: parseHM('HH:MM')->min, minutesToHM(min)->'HH:MM',
//   freeIntervals(winStart, winEnd, busy)->[{start,end}],
//   guardrailWindow(guardrails, category)->[startMin,endMin]
```
**How it currently places (the loop you'll refactor):** for each task (in priority order), it scans `days` earliest-first; on each day it computes the guardrail window, skips the day if the task is outdoor and that day is rainy, builds `freeIntervals`, and takes the **first** gap that fits `travel + workMin + recovery` AND fits the day's remaining tank. It commits, appends a busy block (travel+work+recovery), drains the tank, advances `lastPlace`, and emits `reasons`. Cross-day fatigue lowers each day's tank via `startingTank`.

> The current inner loop is **first-fit earliest**. Milestone A replaces "take the first gap" with "score a few candidate placements and take the best," keeping every hard constraint as a hard filter.

### `calc/energy.js`
```js
startingTank(capacity, yesterdayLoad, fatigueCfg) -> number
heatMultiplier(hourOfDay, opts) -> number in [1.0,1.5]
conditionMultiplier(task, slot) -> number           // slot={hourOfDay,tempF,precipProb}
energyCost(task, slot) -> number                     // baseIntensity = task.intensity ?? task.energy ?? 3
normalizeTitle(title) -> string
estimateWorkMin(task, durationDb, categoryDefaults) -> number
recoveryMin(task, energySpent, defaultRecoveryMin) -> number
blockMinutes(task, slot, opts) -> number
```

### `calc/travel.js`  (USE `clusterByProximity` for batching)
```js
haversineMiles(a, b) -> miles | null                 // a,b = {lat,lng}
roadMinutes(miles, opts) -> minutes | null
rushHourMultiplier(hourOfDay, cfg) -> number
travelMinutes(fromPlace, toPlace, hourOfDay, opts) -> minutes | null
clusterByProximity(items, radiusMiles) -> [[id,...],...]   // items=[{id,lat,lng}], deterministic single-seed
```

### Data model & context (`orbitConfig.js`, `orbitContext.js`, `orbitStorage.js`)
Task fields you'll read/write (all already exist): `category, intensity, indoorOutdoor, weatherSensitive, perishable, locationId, estWorkMin, estRecoveryMin, idealWindow, batchKey, constraints[], aiAnnotatedAt`. Task `category` enum: `errand | shopping | deep-work | admin | physical | outdoor | chore | call | health`. `idealWindow` enum: `morning | midday | afternoon | evening | any`.

The **rulebook** is already fully wired (Phase 1):
```js
// orbitConfig.js
newRule({subject, relation, object, action, createdFrom, active}) // action default 'forbid', active default true
// orbitContext.js exposes:
rules                                  // array (state)
addRule(partial) -> rule               // local-only persist
updateRule(id, updates)
removeRule(id)
// updateTask(id, patch) recomputes priorityScore automatically — never set priorityScore yourself.
upsertDuration(entry)                  // for "takes longer than that" corrections; entry from newDurationEntry({key,category,samples,medianMin,lastActualMin})
```
Also available from `useOrbit()`: `tasks, tasksById, settings, today, updateTask, mode, places, durations`.

### `views/AutoScheduleView.jsx` — the preview UI you'll extend for Milestone B
Runs `buildTimedPlan` over `candidates` (ready/unblocked/unscheduled, priority-sorted, sliced to a batch cap), groups placements by day (`byDay`), and renders per-day cards. Each placement row already has: checkbox (skip), a **Move** `<select>`, a **Pin** button, and a **Remove ✕** button (`removeTask` adds the id to a `removed` Set → re-solves). Reason chips render from `p.reasons`. There's an "✨ Annotate" button and "⛅ Refresh weather" button. **Milestone B adds reason-code capture when the user removes/corrects a placement.**

---

## 3. Gotchas that WILL bite you (learned the hard way in phases 1–6)

1. **`energyCost` prefers `intensity ?? energy ?? 3`.** In tests, if you want `energy` to drive cost, leave `intensity` null. A task helper that defaults `intensity: 2` will silently mask the `energy` value.
2. **Nested settings patches merge against DEFAULTS, not current.** `updateSettings({scheduler:{...}})` shallow-spreads the patch over current then re-normalizes against defaults — a *partial* `scheduler` patch drops the user's other scheduler tweaks. Always pass a **full** object: `updateSettings({ scheduler: { ...settings.scheduler, ...change } })`. (See `SchedulerSection` in `SettingsView.jsx` for the pattern.) Phase 7 adds new soft-weight settings — follow this exactly.
3. **Never set `priorityScore` directly.** `updateTask`/`addTask` recompute it. Deferability etc. are derived, not stored (unless you deliberately add a stored field — you don't need to for Phase 7).
4. **Lint: no `setState` inside an effect body.** Hydrate localStorage-backed state with a **lazy `useState` initializer** (`useState(() => OrbitStorage.getX())`), not an effect. No unused vars, no unused `eslint-disable` directives.
5. **Test files must be under `src/pages/orbit/**/*.test.js`** or vitest won't run them.
6. **Determinism is mandatory.** The solver must produce identical output for identical input (no `Date.now()`/`Math.random()` in placement math). This is what makes it testable and trustworthy.
7. **Keep it "AI annotates, script schedules."** Milestone B rules are **deterministic data** the placer enforces — never a prose prompt tweak. No new AI calls in Phase 7.

---

## 4. Build checklist (MUST / SHOULD / COULD)

### Milestone A — Soft optimization (spec §7, §10-step5)
- **A1 (MUST)** Refactor `buildTimedPlan`'s inner placement from "first legal gap" to **best-scored legal placement**: for the current task, enumerate a bounded set of candidate (day, gap-start) options that pass all hard constraints, score each with a weighted soft-cost, and pick the lowest. Ties broken deterministically (earliest slot). Hard constraints stay as filters (never violated).
- **A2 (MUST)** **Proximity batching:** the soft-cost includes **travel added** by this placement (from the day's `lastPlace`/home to the task's place at that hour). Prefer days/slots that cluster the task near where the day already sends the user. Use `travel.js` for the estimate; use `clusterByProximity` to precompute batch groupings if helpful.
- **A3 (MUST)** **Adjacency rule — perishable-not-after-outdoor:** never place a `perishable` task in the slot immediately following an `outdoor`/hot task on the same day (groceries in a hot car). Enforce as a **hard** adjacency filter (spec §3.1/§10). Emit a reason when this reordering happens.
- **A4 (SHOULD)** **Context-switch minimization:** soft penalty when a placement sits between two tasks of a *different* `category` than itself (encourages contiguous same-category runs).
- **A5 (SHOULD)** **`idealWindow` soft preference:** soft penalty when a task's placement hour falls outside its `idealWindow` band (morning ≈ 5–11, midday ≈ 11–14, afternoon ≈ 14–18, evening ≈ 18–22; `any` = no penalty). Never hard-block on this.
- **A6 (SHOULD)** **Tunable weights in settings** under `settings.scheduler.softWeights` (e.g. `{ travel: 1, contextSwitch: 0.5, idealWindow: 0.5 }`) with defaults + deep-merge (follow gotcha #2). Surface them in `SettingsView.jsx`'s Auto-Scheduler section (optional COULD if time-boxed).
- **A7 (MUST)** Emit **reason chips** explaining soft choices ("grouped near your 2pm errand", "evening preferred", "same-category run") so the preview stays legible.

### Milestone B — Feedback→rules loop (spec §12)
- **B1 (MUST)** **Reason-code capture:** when the user Removes (or Moves) a placement in `AutoScheduleView`, present a small **starter set** of reason chips. Suggested starter set (do NOT try to enumerate everything — spec §12 says grow it later): `perishable`, `too-draining-here`, `wrong-time-of-day`, `not-near-my-errands`, `takes-longer`, `not-today`.
- **B2 (MUST)** Each chip performs **two actions**: (a) the immediate correction (remove/move already happened), and (b) a **durable write** — either a task-level tag or a policy rule:
  - `perishable` → `updateTask(id, { perishable: true })`.
  - `too-draining-here` → bump `intensity` (+1, cap 5) and/or `estRecoveryMin`.
  - `wrong-time-of-day` → set the task's `idealWindow` (ask which, or infer from the slot it was moved to).
  - `takes-longer` → set `estWorkMin` (prompt for minutes) AND `upsertDuration({ key: normalizeTitle(title), category, samples:[...], lastActualMin, medianMin })`.
  - `not-near-my-errands` → (policy) consider a rule; at minimum add `constraints[]` on the task.
  - `not-today` → mark the task not-eligible-today for this session (exclude from candidates) — a session-scoped exclusion is fine; optionally persist a `notToday` tag.
- **B3 (MUST)** **Policy rules → `orbitRules`:** at least one reason path must create a durable rule via `addRule` (e.g. a global "perishables never after outdoor" toggle, or a per-category window rule). Rules are `{subject, relation, object, action}` — define the small grammar you support and document it in the doc + in code.
- **B4 (MUST)** **Rule enforcement in the solver:** add a `rules` input to `buildTimedPlan` (array, default `[]`). Implement a pure `ruleAllows(task, candidatePlacement, dayContext, rules)` (or fold into the hard-constraint filter). Support at least: `relation:'notAfter'` (adjacency forbid), `relation:'window'`/`'notBefore'`/`'notAfter'` (time guardrail forbid). Unknown relations are ignored (forward-compatible). Wire `AutoScheduleView` to pass `rules` from context into `buildTimedPlan`.
- **B5 (SHOULD)** A tiny **rules manager** UI (list active rules, toggle `active`, delete) — a section in `SettingsView.jsx` or a small panel in `AutoScheduleView`. Users must be able to see and undo what the feedback loop learned.
- **B6 (COULD)** Show, on each placement, a subtle marker when a **rule influenced** it ("moved: perishable-after-outdoor rule").

---

## 5. Detailed specs

### 5.1 The scored-placement refactor (A1)
Keep the outer `for (task of tasks)` loop. Replace the "first fitting gap" logic with:
```
candidates = []
for date in days:
  window = guardrailWindow(guardrails, task.category)      // hard
  if window invalid: continue
  if outdoor(task) and dayHasRain(date, window): continue  // hard (existing)
  if !ruleAllows(task, {date, ...}, rules): continue       // hard (B4)
  tank = tankFor(date)
  for gap in freeIntervals(window, busy[date]):
     placement = tryFit(task, gap, date)   // computes travel, workStart, energyCost, recovery, blockEnd
     if !placement: continue                                // didn't fit gap
     if state.load + placement.energyCost > tank: break     // tank spent this day
     if violatesAdjacency(task, placement, dayPlacements): continue  // A3 hard
     candidates.push({ placement, softCost: score(task, placement, date, dayContext) })
pick = candidates with min softCost (tie: earliest date then earliest startMin)
```
`score()` = `wTravel*travelAddedMin + wSwitch*contextSwitchPenalty + wWindow*idealWindowMismatch` (+ optionally a small earliest-day bias so it still front-loads when all else is equal). Keep it a **pure function** you can unit-test in isolation. Bounded search: you may cap candidates per task (e.g. first N gaps per day, first M days) for performance — document the cap.

> **Backward-compat note:** several existing `scheduler.test.js` cases assert exact `startLabel`s under the old first-fit behavior (e.g. "places at 07:00", "packs immediately after"). With pure single-task/empty-day inputs and default weights, best-score should still pick the earliest slot — so those should keep passing. Where a soft-opt scenario legitimately changes placement, add a NEW test rather than weakening an old one; only edit an old test if its scenario's *correct* answer genuinely changed, and note it.

### 5.2 Adjacency (A3) & rules (B4) as pure predicates
Add pure exports (in `scheduler.js` or a new `calc/constraints.js` — your call, but keep pure + tested):
```js
violatesAdjacency(task, placement, alreadyPlacedThatDaySortedByTime) -> bool
ruleAllows(task, candidate, dayContext, rules) -> bool
```
`dayContext` gives the day's already-placed tasks (with their categories/times) so `notAfter` can look at the immediately-preceding block. Define `subject`/`object` matching: support `subject:'perishable'` (task.perishable), `subject:'category:<x>'` (task.category===x), and `object` likewise pointing at the *preceding* task or a time window.

### 5.3 Reason-chip → durable-write mapping (B2) as a pure function
Make the mapping testable:
```js
// e.g. calc/feedback.js
reasonToWrites(reasonCode, task, context) -> { taskPatch?, rule?, duration?, sessionExclude? }
```
The UI calls this, then applies `updateTask`/`addRule`/`upsertDuration` accordingly. Unit-test the mapping (pure) separately from the UI.

---

## 6. Tests required (all under `src/pages/orbit/**`, `npx vitest run` green)
- **A1/A2:** given two tasks with nearby locations and one far, best-score batches the near pair on the same day/adjacent slots (lower total travel than naive priority order would give). Determinism: same input → same output twice.
- **A3:** a perishable task is NOT placed immediately after an outdoor task; it lands elsewhere (or later).
- **A4/A5:** context-switch penalty orders same-category runs; a task with `idealWindow:'evening'` prefers an evening slot when one is free.
- **B4:** a `notAfter` rule (`perishable notAfter category:outdoor`) forbids the bad adjacency even without A3's hard rule; an unknown relation is ignored (no crash, no effect).
- **B2/B3:** `reasonToWrites('takes-longer', ...)` returns an `estWorkMin` patch + a duration upsert; `reasonToWrites('perishable', ...)` returns `{perishable:true}`; a policy chip returns a well-formed `rule`.
- Existing `scheduler.test.js` still green (adjust intentionally-changed cases, documented).

## 7. Integration/wiring points
- `AutoScheduleView.jsx`: pass `rules` (from `useOrbit()`) into `buildTimedPlan`; add reason-chip capture on Remove/Move; add soft-weight display if you did A6; optionally a rules-manager panel (B5).
- `SettingsView.jsx`: `settings.scheduler.softWeights` editors (A6) and/or rules manager (B5) — follow the nested-patch gotcha (#2).
- No new route needed. No files outside `src/pages/orbit/`.

## 8. Definition of done — report format
Report a **coverage matrix**: every checklist item (A1–A7, B1–B6) → Done / Partial / Cut, with the file + line where it lives. Then a **separate** verification section: paste the final `npx vitest run` summary line, the `npm run build` result line, and confirm `npx eslint <changed files>` is clean. Mark any agent-initiated omission/deferral with ✂️. Finally, update the "Where it stands" block at the top of `guidelinesScheduler.md` to note Phase 7 (doc §17 P3+P4) is built and what remains.
