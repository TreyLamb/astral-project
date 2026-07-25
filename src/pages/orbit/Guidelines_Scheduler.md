# Guidelines — Orbit Auto-Scheduler ("the brain")

**Status:** design spec, not yet built. This is the source of truth for the automated
scheduling feature in Orbit. It captures Trey's requirements and the agreed architecture in
enough detail that a fresh agent (or a fresh session) can pick up and build it correctly
without re-deriving the decisions. Update this doc as the design evolves — it is the counterpart
to `Guidelines_Orbit.md`.

**Read `featuredesign.md` and `Guidelines_Orbit.md` before building against this.**

---

## 0. The problem in one paragraph

Orbit collects tasks (via Capture → Triage, the Add Task page, and the fitness-calendar To-do
mode). Trey wants those tasks **automatically placed onto a calendar** in a way that is actually
smart: errands batched together, draining tasks given recovery time, outdoor tasks kept out of
rain and midday heat, travel kept sane, and everything fit within how much energy he has that
day. Critically, he does **not** want to babysit it — if the plan is trustworthy he won't verify
the weather or the route himself, so the automation has to be right or clearly flag when it isn't.

This is a **constraint-satisfaction + soft-optimization** problem (like Motion / Reclaim /
Skedpal), **not** a chat-prompt problem.

---

## 1. Guiding principle (do not violate): AI annotates, script schedules

The single most important architectural decision:

- **AI's only job is bounded, structured extraction** — turning `"paint my truck"` into typed
  metadata (`{category, intensity, outdoor, weatherSensitive, perishable, estWorkMin,
  estRecoveryMin, idealWindow, locationName}`). Output is **JSON validated against a schema**,
  never prose. On parse-fail / out-of-range → retry once → fall back to safe defaults. A bad AI
  reply may weaken an annotation; it can **never** corrupt the schedule.
- **All placement is deterministic script** — ordering, packing, constraints, travel, energy,
  recovery buffers, batching, rescheduling. Testable with unit tests against known inputs.
- **The AI does LESS over time, not more.** As the deterministic rules and the learned databases
  (below) improve, the AI's role shrinks to "what *is* this task." Trey's own framing: *"If we
  architect the auto-schedule component correctly with the logic I want, it will never be better
  done by an AI who is guessing."* That is correct and is the north star.
- Free/untrained models follow loose prose instructions poorly. The mitigation is to **give the
  AI the smallest possible job with a rigid output schema and validate every response.**

| **AI (small, JSON-out, validated, retry-or-default)** | **Script (all logic, deterministic, tested)** |
|---|---|
| Annotate a task into typed fields | All placement / ordering / packing |
| Typo & wording cleanup (already exists) | Hard constraints (fixed events, guardrails, deadlines, deps, energy tank, weather, travel feasibility) |
| Infer a location string from the title + home zip | Soft optimization (priority, energy-fit, proximity batching, adjacency rules, recovery buffers, context-switch minimization) |
| | Weather fetch/cache, geocode/cache, travel estimate, fatigue carryover, duration learning |
| | Feedback → rules crystallization; reschedule cascades |

---

## 2. Current state (what exists today — build on it, don't reinvent)

- **`calc/planner.js`** — `planTasksAcrossDays()` (greedy day-assignment across a horizon using a
  per-day time+energy budget) and `firstOpenDayFor()` (next day with time/energy room; powers the
  "Add to calendar" checkbox). **Day-assignment only — no time-of-day, no intelligence.**
- **`PlannerView.jsx`** — preview UI: orders ready/unblocked/unscheduled tasks by priority, lays
  them across days, lets you shift manually; **nothing is written until "Apply."** This is the
  skeleton for the staged-plan workflow (§11).
- **Energy today** = one flat `energy` int (1–5) per task + a `settings.capacityDefault.energy`
  daily budget (Settings → Constants) with per-day overrides in the Planner. Used by the planner
  and by priority scoring (`cost = (difficulty+energy)/2`).
- **AI plumbing exists and is capable:** `api/_lib/aiProviders.js` rotates **Groq (Llama 3.3 70B)
  → GitHub Models (GPT-4o) → Gemini (2.0 Flash)**, all free-tier, with fallback. Keys are set in
  Vercel (`GROQ_API_KEY` / `GITHUB_TOKEN` / `GEMINI_API_KEY`) — confirmed present as of this doc.
- **The only AI consumer today** is `api/orbit-ai-triage.js` — a **typo/wording cleaner** for
  untriaged inbox items (button in `TriageView`). It does zero scheduling. It is the template for
  how to call `askAI()` from a serverless endpoint (Firebase ID-token auth, not a static secret).
- **Fitness-calendar bridge:** `src/pages/fitnesstracker/orbitTasksBridge.js` + `CalendarView.jsx`
  render Orbit tasks (by `scheduledDate`) as chips, show a per-day **energy badge** (bottom-right),
  and add to-dos via the QuickAddModal "To-do" mode (writes Orbit tasks, fires an
  `orbit-tasks-changed` window event to refresh). The MFT calendar is the main visual surface.
- **Gap:** the To-do multi-add modal stores text as-typed — it does **not** run the typo cleaner.

---

## 3. Data model

### 3.1 Task — new fields (all optional; filled by AI annotation + learning, editable by user)
Added on top of the existing task (`orbitConfig.js` `newTask`). Nothing here is required to save a
task; absence just means "unknown, use a default."

- `category` — e.g. `errand | shopping | deep-work | admin | physical | outdoor | chore | call | health`. (AI)
- `intensity` — 1–5 physical/mental drain of the *work itself*. (AI)
- `indoorOutdoor` — `indoor | outdoor | either`. (AI)
- `weatherSensitive` — bool; if true, rain/heat affect scheduling. (AI)
- `perishable` — bool; e.g. cold groceries that can't sit in a hot car. Drives adjacency rules. (AI)
- `locationId` — FK into the **places DB** (§7). (AI-inferred or user-set)
- `estWorkMin` — the actual work time. Priority: user-specified → **duration DB** (§8) → AI estimate → category default.
- `estRecoveryMin` — buffer appended *after* the task. `blockMin = estWorkMin + estRecoveryMin`. (AI/heuristic; scales with energy spent)
- `idealWindow` — `morning | midday | afternoon | evening | any` preference (soft). (AI)
- `batchKey` — grouping hint for batching (e.g. all `shopping` near the same place). Usually derived by script from `category` + location proximity, not the AI.
- `constraints[]` — pairwise/relative rules attached to this task, e.g. `{type:'notAfter', category:'outdoor'}` (perishables not after a hot outdoor task). Mostly generated by the feedback→rules loop (§12).
- `energyCost` is **not stored flat** anymore — it is computed at placement time as
  `baseIntensity × conditionMultipliers(heat, weather, timeOfDay)` (§4, §6).

### 3.2 New locally-stored databases (localStorage now; Firestore-synced later, mirroring existing pattern)
- **Places DB** (`orbitPlaces`): `{id, name, lat, lng, zip, geocodedAt, source}`. Geocode each place
  **once** (Nominatim, §7) and cache. Built passively — every task with a location adds/reuses a place.
- **Duration DB** (`orbitDurations`): keyed by normalized task title and/or category →
  `{samples:[minutes...], lastActualMin, medianMin}`. Learns real durations (§8).
- **Weather cache** (`orbitWeather`): per `date` (and location) → cached Open-Meteo hourly forecast,
  refreshed on a daily fetch (§6). Never hit the API more than needed.
- **Rulebook** (`orbitRules`): user-derived scheduling rules from feedback (§12), structured as
  `{id, subject, relation, object, action, createdFrom}`.
- **Travel-log DB** (`orbitTravelLog`, optional/later): actual observed travel times by
  `{origin, dest, weekday, hourBucket}` → learn personal traffic patterns (§7).

---

## 4. Energy model — a gas tank with cross-day fatigue (NOT circadian)

This is a firm correction from Trey; do not model energy as a time-of-day body-clock curve.

- Each day has a **tank capacity** `C` (e.g. 100; configurable, replaces/extends the current
  `capacityDefault.energy`). Tasks **drain** it 1:1.
- **Cross-day fatigue:** a brutal day reduces the *next* day's starting capacity. Example: a
  100/100 Monday leaves Tuesday starting near 50/50. One tunable deterministic formula, e.g.
  `startCap(today) = C − fatigueCarry(load(yesterday))`, where `fatigueCarry` grows once yesterday's
  load exceeds some fraction of `C`. Keep it simple and unit-tested.
- **Task drain can still vary by conditions.** Painting in midday heat drains *more* than in the
  evening — but that is the *task's cost going up*, not the person's clock. Model as
  `drain = intensity × heatMultiplier(temp/timeOfDay) × weatherMultiplier`. So "midday = draining"
  survives; "I'm a morning person" does **not** enter the energy math.
- **When Trey is naturally sharp/tired is handled by guardrails (§5), not energy.**

---

## 5. Guardrails (allowed scheduling windows) — deterministic, to be specced in detail later

Hard rules about *when a category may be placed at all*, independent of energy. Examples Trey gave:
"if I wake at 7am I'm not shopping at 7:30am"; "I'm not going shopping at 10pm just because it fit."
Model as per-category allowed windows + global awake hours, e.g.
`guardrails = { awake: '07:00–22:00', shopping: '09:00–20:00', calls: '09:00–18:00', ... }`, plus
open/close hours per place (later, from the places DB). Nothing may be scheduled outside its
guardrail even if the tank and calendar have room. **Detailed guardrail config is an open item —
spec it before the timed solver ships.**

---

## 6. Time-of-day & weather

- **Time-of-day is the cheap heat proxy** (early = cool, midday = hot, late = cool) and needs no API.
- **Weather (Open-Meteo)** makes trusting the automation possible — because Trey won't check it
  himself. Open-Meteo is **free, no key, no signup**; hourly forecast 16 days out + historical
  archive. **Fetch once/day and cache/log** (`orbitWeather`); the scheduler reads the cache.
  - **Rain = hard constraint** for `outdoor`/`weatherSensitive` tasks (avoid slots with precip
    probability over a threshold).
  - **Temperature = heat multiplier** feeding the drain/duration of outdoor tasks.
  - **Re-check on each daily fetch:** if a scheduled outdoor task's day flips to rain, **flag it and
    propose a reschedule** (§13) rather than silently leaving it. This is the answer to "if it rains
    Monday and truck-painting is Monday, that day is trashed and I won't have checked."
- Needs a location → home lat/long at minimum (from home zip, §9), or the task's own place.

---

## 7. Travel & the places DB

Trey's instinct is the right architecture: **build a local places DB, geocode once, cache.**

- **Geocode:** Nominatim (OpenStreetMap) turns a place *name* → lat/long. Free, rate-limited →
  **do it once per place and cache** in the places DB. Never re-geocode a known place.
- **Travel time — three tiers, pick per accuracy need:**
  1. **v1, zero-API:** haversine straight-line × ~1.3 road factor ÷ assumed speed. Enough for the
     real question — "are these errands clustered or scattered?" — which is what batching needs.
  2. **Rush-hour multiplier (zero-API):** ×~1.4 during 7–9am / 4–6pm buckets. Captures "busy hours
     are slower" deterministically. Cheap and worth having early.
  3. **Traffic-accurate (Google Maps Distance Matrix):** the **only** option that does real
     predictive traffic (`duration_in_traffic`, `traffic_model`, `departure_time`). Requires a
     billing account + key, but the free monthly credit covers personal use. **Trey is OK setting
     this up.** OSRM / OpenRouteService (free) do routing but **no traffic**, so they don't solve
     the busy-hours problem.
- **Log-and-learn (later):** record actual travel times by `{origin, dest, weekday, hourBucket}`
  (`orbitTravelLog`) to build a *personal* traffic model — Trey's "more setup" idea, viable long-term.
- **Important synergy:** midday is both high heat-cost and high traffic. Feed both signals into the
  cost function and the scheduler will avoid scheduling errands at noon *on its own* — no special case.
- **Batching:** cluster same-category tasks by proximity (local math, no API). Zig-zag across town is
  allowed when priority/deadline forces it, but cluster first.

---

## 8. Duration-learning DB

- If Trey doesn't specify a duration, estimate `estWorkMin` from history: prior "paint truck" took
  2h → guess 2h. Priority order: **user-specified → duration DB (median/last) → AI estimate →
  category default.**
- On task completion, **log the actual elapsed time** back into `orbitDurations` (needs a
  start/complete capture, even rough).
- Social contract (Trey's words): *"if I don't give feedback on how long it takes, I waive the right
  to be annoyed at the inaccuracy."* So a wrong estimate with no correction is acceptable; a
  correction updates the DB so it's right next time.

---

## 9. Location inference

- Trey provides a **home zipcode** (settings). If a task has no location and none matches the places
  DB, the AI infers a likely location string from the title + home zip (e.g. "buy milk" → nearest
  grocery). Always check the places DB first; only call the AI/geocoder for unknowns; cache results.
- Inferred locations are **suggestions** — surfaced for confirmation, editable, and confirmable into
  the places DB.

---

## 10. The scheduler algorithm (deterministic core)

Runs over a candidate set (see §11 for how the set is bounded). Produces a **proposed** timed plan;
nothing is committed until accepted.

1. **Candidate + order:** ready, unblocked, unscheduled tasks, ordered by existing `priorityScore`
   (overdue first, then score, then due date). The triage/priority queue already limits volume.
2. **Build the day's free/busy grid:** subtract fixed events (workouts, appointments), guardrail
   windows, and sleep. Apply the day's energy tank (with fatigue carryover).
3. **Annotate** each candidate (AI, cached) → category/intensity/outdoor/etc.
4. **Compute each task's block:** `estWorkMin` (§8) + `estRecoveryMin`, with condition multipliers
   for outdoor/heat/weather at the candidate slot.
5. **Place** greedily by priority into legal slots, honoring **hard constraints** (fixed events,
   guardrails, deadlines, dependencies, tank capacity, weather-avoid, travel feasibility) and
   optimizing **soft preferences** (energy-fit, proximity batching, adjacency rules like
   perishable-not-after-outdoor, recovery buffers, minimize travel + context switches).
6. **Emit reasons** per placement ("grouped with 2 nearby errands · avoids Mon rain · fits today's
   tank · evening = cooler for painting") for the review UI (§11) and the route map (§14).

Start with **day-assignment + coarse ordering** if timed placement is too much for v1, but the
energy/recovery/weather ideas only mean something once you place at **actual times of day** — that
is the target.

---

## 11. Staged-plan workflow & training wheels

Trey will **not** trust "place 100 tasks" until the logic has earned it. Sequencing matters:
**you cannot design the feedback layer (§12) in a vacuum — build the plan/simulation first, then the
feedback chips fall out of reacting to real proposed plans.** Shipping feedback before there's a plan
to react to is backwards.

Ship these together as the training wheels:
1. **Staged plan, nothing committed** — extend `PlannerView`'s preview-then-Apply.
2. **Batch cap** — plan only N tasks per run (default ~10–20; Trey suggested 20 is a comfortable
   review size). A bad plan is a small cleanup, never a 99-task re-assign.
3. **Per-item disposition** — Accept / Reject / Move / Pin per placed block, not all-or-nothing.
4. **Reason chips** — each block shows *why* it landed there; makes wrong ones obvious.
5. **Feedback → rules** (§12) — corrections crystallize into deterministic rules/annotations so the
   same mistake can't recur. Trey is the UAT.
6. **Dry-run simulate** — show tank levels, travel legs, and weather per proposed day before accepting.

Long-term goal: logic good enough that scheduling ~100 at once is trustable. Volume expectation:
30–200 tasks, growing before it shrinks as organization improves.

---

## 12. Feedback → rules (Trey left the mechanism to me — here's the design)

When Trey rejects/corrects a placement, capture **why** as a structured **reason code**, and turn it
into one of two durable artifacts (never a vague prompt tweak):

- **Task-level → an annotation override (a tag on the task).** e.g. reason "this is perishable" →
  `perishable:true`; "too tired for this here" → nudge `intensity`/`estRecoveryMin`; "actually 30
  min" → write `estWorkMin` + duration DB. Tags are queryable and stick to that task (and similar
  titles).
- **Policy-level → a rule in the rulebook (`orbitRules`).** e.g. "perishables never after an outdoor
  task" → `{subject:'perishable', relation:'notAfter', object:'category:outdoor', action:'forbid'}`;
  "no errands before 9am" → a guardrail rule. Rules are cross-task and enforced by the deterministic
  placer forever.

Reason chips = the UI for picking a reason code. Seed a **small** starter set from the categories
above and grow it as real patterns show up (don't try to enumerate every chip up front — Trey
explicitly doesn't want to brainstorm chips abstractly). Each chip does two things: an immediate
correction (move/adjust the block) **and** the durable write above. Over time the rulebook + tags do
the work and the AI's guesses matter less.

---

## 13. Reschedule (per day / per week / per task) — cascade-aware

A first-class button, because life happens ("something came up, can't run errands today"):
- **Scope:** per task, per day (everything that day), per week.
- **Behavior:** look at the cancelled item(s) **and everything on/after that date**, then decide by
  priority: **push future items back** to make room, or **defer the cancelled low-priority items to
  later** — whichever keeps high-priority/deadline work on track. Respect deadlines and dependencies
  as hard limits during the cascade.
- Same deterministic solver as §10, just re-run over the affected window with the cancelled items
  removed/deferred. Preview + accept, same as a normal plan.

---

## 14. Route map / daily verification

- A **daily route map** showing where the planner intends to send Trey — trivial to verify by eye.
  Build with **Leaflet + OpenStreetMap tiles** (free, no key); draw markers from the places DB and a
  polyline of the day's ordered stops.
- If a leg looks wrong, Trey leaves a note on it → feeds §12 (rule/annotation) for future plans.
  *"I am the UAT."*

---

## 15. AI reliability discipline (how to tame free models)

- **Every AI call returns JSON matching a fixed schema.** Define the schema; instruct terse; set low
  temperature. Parse and validate.
- **Validate ranges/enums.** Out-of-range or unparseable → **retry once** → **fall back to safe
  defaults** (`intensity:3, indoorOutdoor:'indoor', weatherSensitive:false, perishable:false`).
- **Never let a bad AI reply block scheduling** — annotations degrade gracefully to defaults.
- Reuse `askAI()` from `api/_lib/aiProviders.js` and the ID-token auth pattern from
  `api/orbit-ai-triage.js`. New endpoints go in `api/` per the CLAUDE.md serverless rules.
- Consider running the **typo cleaner** on the To-do multi-add flow too (currently it doesn't clean).

---

## 16. External APIs — the free stack (summary)

| Need | Service | Cost / key |
|---|---|---|
| Task understanding | Groq / GitHub Models / Gemini via `aiProviders.js` | free tiers, keys set in Vercel |
| Weather | **Open-Meteo** | free, **no key** |
| Geocoding (name → lat/long) | **Nominatim (OSM)** | free, rate-limited, cache once |
| Travel, rough / batching | local haversine × road-factor | none |
| Travel, traffic-accurate | **Google Maps Distance Matrix** | needs billing + key; free credit covers personal use |
| Travel, free routing (no traffic) | OSRM / OpenRouteService | free |
| Map display | **Leaflet + OSM tiles** | free, no key |

---

## 17. Phased build plan (so the trustworthy skeleton exists before any fuzzy magic)

1. **Rich task model + deterministic timed solver, NO AI.** New task fields (defaults only), the
   gas-tank energy model + fatigue, guardrails, recovery buffers, free/busy grid, weather-avoid
   (Open-Meteo), places DB + haversine travel + rush-hour multiplier, duration DB. Unit-tested.
   Staged-plan preview (batch cap + per-item accept/reject + reason chips + dry-run simulate).
2. **AI annotation layer.** New `api/` endpoint wrapping `askAI()` with a strict JSON schema +
   validation; fills the task fields; cached; user-editable. Location inference from home zip.
3. **Soft optimization.** Proximity batching, adjacency rules, context-switch minimization, using
   the annotations + rulebook.
4. **Feedback → rules loop** (§12) — now meaningful because there are real plans to correct.
5. **Reschedule cascade** (§13) and **route map** (§14).
6. **Traffic-accurate travel** (Google) and/or **log-and-learn** travel model, if v1 travel proves
   too loose.

Each phase ships behind the staged-plan preview (nothing auto-commits) until Trey trusts it.

---

## 18. Open decisions (resolve before/while building the relevant phase)

- **Timed placement vs day-assignment for v1** — target is timed (energy/weather/recovery need it);
  confirm scope for the first shippable slice.
- **Guardrail config** (§5) — exact awake hours + per-category windows; add place open/close hours later.
- **Fatigue-carry formula** (§4) — pick and tune the concrete function.
- **Traffic approach** — start with rush-hour multiplier + log actuals; add Google when needed
  (Trey OK with billing).
- **Break down the triage queue further?** — Trey floated finer triage tiers to reduce how many
  tasks ever reach "schedulable." Worth exploring as an input to volume control.
- **Duration/complete capture** — need a lightweight way to log actual task time to feed §8.
