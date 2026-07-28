# Guidelines — Orbit Auto-Scheduler ("the brain")

**Status:** design spec, not yet built. This is the source of truth for the automated
scheduling feature in Orbit. It captures Trey's requirements and the agreed architecture in
enough detail that a fresh agent (or a fresh session) can pick up and build it correctly
without re-deriving the decisions. Update this doc as the design evolves — it is the counterpart
to `Guidelines_Orbit.md`.

**Read `featuredesign.md` and `Guidelines_Orbit.md` before building against this.**

### Where it stands (as of 2026-07-27) — start here
Doc §17 **Phases 1, 2, AND 3+4 are BUILT** (the trustworthy no-AI skeleton, the AI annotation layer,
the soft-optimizer, and the feedback→rules loop). Everything is unit-tested (379 tests green) and
behind the staged-plan preview — nothing auto-commits. **Doc §17 Phases 5–6 remain** (day-adjustments
+ route map, live Google traffic + travel-log seeding). Phase-handoff prompts for the remaining work
live in `views/special_prompts/PHASE_7…9_*.md` (build-phase 7 = §17 P3+P4 = this batch; 8 = §17 P5;
9 = §17 P6).

**What shipped (built as 6 finer build-phases; doc-§17 mapping in parens):**
1. Rich task model + 5 scheduler DBs + gas-tank/guardrail settings — `orbitConfig.js`, `orbitStorage.js`,
   `orbitContext.js` (localStorage-only DBs; Firestore sync still deferred per §3.2). (§17-P1)
2. `calc/energy.js` (gas-tank + cross-day fatigue + heat/duration) and `calc/travel.js` (haversine +
   rush-hour + clustering) — pure, unit-tested. (§17-P1)
3. `calc/scheduler.js` — the deterministic timed solver (`buildTimedPlan`): free/busy grid, guardrails,
   tank + fatigue, weather-avoid, travel, recovery buffers, reason chips. Unit-tested. (§17-P1, §10)
4. Weather — `calc/weather.js` (pure) + `orbitWeatherService.js` (Open-Meteo forecast + Nominatim
   geocode, free/no-key), daily fetch/cache, rain re-check flags. (§17-P1, §6)
5. `views/AutoScheduleView.jsx` — the staged-plan preview (batch cap, per-item apply/remove/pin/move,
   reason chips, per-day dry-run stats: tank/travel/weather). Nav: `/orbit/auto-schedule`. Home-ZIP +
   guardrail/fatigue knobs added to Settings. (§17-P1, §11)
6. AI annotation — `api/orbit-annotate.js` + pure `api/_lib/annotate.js` (strict JSON schema,
   validate/retry/safe-default), `annotateTasks()` client action + "✨ Annotate" button; location
   inference→places DB via geocode. Signed-in only; degrades to defaults. (§17-P2, §1/§9/§15)
7. Soft optimization + feedback→rules (§7, §12) — `buildTimedPlan` refactored from first-fit to
   **best-scored** placement (proximity batching via cheapest-hop travel, `idealWindow` preference,
   context-switch minimization, a small front-load bias) with a **hard perishable-not-after-outdoor
   adjacency** filter and a **rulebook** the solver enforces (`ruleAllows`/`ruleFloorMin`, new `rules`
   + `softWeights` inputs). New pure `calc/feedback.js` (`reasonToWrites`) maps rejection reason-chips
   to durable writes (task tags / learned durations / policy rules). UI: reason-capture popover on
   Remove/Move (`views/AutoScheduleFeedback.jsx`), a rules manager + optimization-weight editors in
   Settings. All pure logic unit-tested. (§17-P3+P4)

**Next action = doc §17 Phase 5** (Reschedule / Add-X / Remove-X + deferability score + route map) →
then Phase 6 (Google traffic + seeding — needs the Google key + cost guard from §18/§7). See
`views/special_prompts/PHASE_8_*.md` and `PHASE_9_*.md` for the self-contained build prompts.

**Decisions baked in during the build (tunable):** energy tank reuses `capacityDefault.energy` (NOT a
separate 100-scale); fatigue formula = linear ramp from `thresholdPct` to a `maxCarryPct` cap so a
fully-drained day → ~half tank tomorrow; guardrail defaults seeded (editable in Settings). Still open
per §18: exact guardrail hours (user sets), Google cost-guard specifics (Phase 6), duration-capture
mechanism, Add/Remove-X input mode, holidays.

This doc is the source of truth; a companion project memory (`orbit-scheduler-design`) points back here.

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
- **Travel-log DB** (`orbitTravelLog`): a **passive archive** of every live Google traffic result
  (plus any self-observed times), keyed by `{origin, dest, weekday, hourBucket}` → `{durationSec,
  samples[], median}`. **Backup ONLY — not read while Google is available** (§7): the scheduler uses
  fresh Google results and only drops to the archive's historical median if Google is lost/over-cap.

> **Privacy note:** the places + travel-log DBs together are effectively a detailed personal
> movement log (Trey joked "the government will track me so well"). They live **only in Trey's own
> store** (localStorage / his Firestore under his uid), single-user, never shared or sent anywhere
> except the Google call itself. Keep it that way — no export, no third-party sink.

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
- **Travel time — DECISION: live Google Maps traffic is primary; the DB is only a backup.**
  - **Primary = live Google Maps Distance Matrix on each (re)plan.** The only option that does real
    predictive traffic (`duration_in_traffic`, `traffic_model:'best_guess'`, `departure_time`). While
    Google is available, **use fresh results — do NOT rely on the historical DB even if it's ~99%
    accurate** (Trey: no reason to guess when a free live source exists). OSRM / OpenRouteService
    (free) do routing but **no traffic**, so they don't solve the busy-hours problem.
  - **CRITICAL — `departure_time` = the TRIP's future time, NOT the call time.** The estimate follows
    the `departure_time` you pass, independent of when the call is made. Batch-schedule at 8pm for a
    trip next Tuesday 2pm → pass `departure_time = Tue 14:00` and Google returns its *predicted*
    2pm-Tuesday traffic, not 8pm. **Always pass the trip's own scheduled datetime.** **Omitting
    `departure_time` gives a static traffic-free number (~= the free APIs)** — so this one parameter is
    the entire reason to use Google. It's Google's edge over OSRM/ORS/haversine, which have **no
    time-of-day traffic model at all**; Google predicts any future time-of-day from historical + live
    data. Real limits (fine for planning): can't query the *past* (now/future only); far-future
    predictions are typical-conditions estimates that **sharpen on re-plan as the date nears**.
  - **Far-future → normalize to the nearest `{weekday × hour}` occurrence (Trey's call).** Google's
    prediction for a weekday+hour is ~the same whether it's this Tuesday or a Tuesday weeks out
    (typical conditions), so for trips more than ~7 days out — and for DB reuse — pass `departure_time`
    = the **next upcoming** instance of that `{weekday, hour}`, not the real far date. Better near-term
    prediction quality, and estimates cache by `{weekday, hour}` (the DB key). **EXCEPTION: major
    holidays** — traffic, store hours, and availability all differ from a normal weekday, so the
    normalization is invalid on/near them; use the actual date and/or flag the estimate. See §19.
  - **Cost / free-tier reality (Trey asked — "$200/mo is not free"):** Google Maps Platform gives a
    generous **free monthly allowance**. (Historically a **$200/month credit** = $200 of usage free
    each month; Google moved to per-API **free monthly call volumes** — on the order of ~10k free
    calls/month for the relevant APIs — around 2025. **Verify the current terms in the Cloud
    Console.**) It is generous but **NOT infinite**, and billing must be enabled, so guard it hard:
    1. **In-code monthly usage counter** — count billable **elements** (origin×dest pairs), NOT HTTP
       requests: Distance Matrix bills per element (batch up to 25×25 per request for fewer round-trips
       at the same element cost). Persist it; expose a configurable monthly cap in Settings; **the
       counter covers real AND seeding calls (below)**; when it nears the cap, **stop calling Google
       and fall back** (DB → haversine). Trey's ask: "track calls statically so we can stop before the limit."
    2. **Google Cloud Console hard quota** — set a max requests/day quota so the API *physically*
       cannot exceed the free allowance, plus a $0/low budget alert. Belt-and-suspenders → guaranteed $0.
    - Single-user, per-plan volume won't come close regardless; the cap just makes "never charged" a
      guarantee rather than a hope.
  - **Seed / pre-warm the DB (first ~2 months) — deliberately use the otherwise-wasted allowance.**
    Trey's plan: real use won't touch even ~50% of the free monthly allowance, so spend the rest
    up-front (target ~90%/month for the first ~2 months, **real + seeding combined**) to pre-fetch a
    matrix of `{place-pair × time-bucket × weekday}` and build rich historical coverage for the
    drop-Google fallback fast.
    - **How:** vary **`departure_time`** across the next occurrence of each `{weekday × hour}` bucket —
      you cover the *entire* matrix from one sitting regardless of what time you actually call, because
      the estimate follows `departure_time` (see the CRITICAL note above), not the call time. The
      ~2-month spread is for staying under the cap, refreshing values, and catching drift — **not**
      because coverage requires calling at those times of day (it doesn't). Can't sample the *past*.
    - **Budget-aware & prioritized** (a full matrix explodes: ~N² pairs × buckets × days): cover
      real/likely routes first, **only within guardrail hours** (skip 3am — pointless), **rush vs
      non-rush buckets first**, then finer granularity. Tune place-count / bucket / day granularity to
      land ~90% of whatever the cap is. Spread across days (a daily seed budget) to sample real
      day-to-day variance and stay under the Console daily quota.
    - **Seeding always yields to real calls and NEVER breaches the cap** (Trey's caveat: "don't
      accidentally go over with fake calls too"): real calls take priority, seeding only fills the
      headroom up to the ~90% target, and the hard cap + Console quota stop everything. Time-boxed —
      after the window, seeding off; the DB is then maintained passively from real calls.
  - **Travel-log DB = passive archive, BACKUP ONLY (§3.2).** Log every live result (cheap, no
    downside) purely to build a fallback — **not read while Google works.** If Google is
    lost/over-cap, estimate from the DB's historical median for that route+time; with no data, fall
    back to haversine × ~1.3 road factor and a ~1.3–1.4 rush-hour multiplier (7–9am / 4–6pm).
  - **No-location / no-data batching** still uses local haversine proximity (zero-API) to cluster
    errands before any timing matters.
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
- **Per-day "where I am" base override (BUILT 2026-07-27).** The home zip is the *default* origin, but
  on any given day Trey may be based somewhere else (Orem → Paris UT → Hawaii). `settings.bases` is a
  small registry of those places (`tag` = short calendar label like `OREM`; `query` = disambiguated
  geocode string `"Paris, Idaho"` — critical, since "Paris" alone hits France; geocoded once via
  Nominatim; the base id doubles as its weather-cache locationId). `settings.dayLocations` maps
  `{iso → baseId}`. On a tagged day the **whole stack reasons from that base**: `buildTimedPlan`'s new
  `homePlaceFor(iso)` input makes it the travel origin + errand-batch seed, and weather-avoid reads that
  base's forecast (per-day `weatherFor` keyed by base id). Everything falls back to the global home when
  a day is untagged or its base isn't geocoded — byte-identical to before when `bases` is empty. Pure
  resolvers live in `calc/baseLocation.js`. The tag is **set from the fitness calendar's WHERE chip**
  (writes Orbit settings through `orbitTasksBridge`) or Orbit **Settings → "Where I am — bases"**.

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

## 13. Day adjustments: Reschedule, Add X, Remove X

Three first-class buttons for reacting to how a day actually unfolds. All re-run the §10 solver over
a **bounded window** (today vs adjacent days) and use the staged-preview + accept flow (§11) —
nothing auto-commits. Add X and Remove X are deliberate mirror images: pull the best-fitting work
*in*, push the most-deferrable work *out* — and in both cases **the script chooses which tasks**, not
the user.

### 13.1 Reschedule (per task / day / week) — cascade-aware
Because life happens ("something came up, can't run errands today"):
- **Scope:** per task, per day (everything that day), per week.
- **Behavior:** look at the cancelled item(s) **and everything on/after that date**, then decide by
  priority — **push future items back** to make room, or **defer the cancelled low-priority items to
  later** — whichever keeps high-priority/deadline work on track. Deadlines and dependencies are hard
  limits during the cascade. This is the "I'm scrapping this day/task" tool.

### 13.2 Add X tasks (per day) — pull work IN when you have spare bandwidth
Trigger: you finished early or have more energy than expected, and you don't want to go hunting for
something to fill the time.
- **Candidate pool:** unscheduled backlog **plus** tasks already scheduled for future days (nearest
  first — usually tomorrow).
- **Rank by** priority (`priorityScore`), then **filter by a "today-fit" test** — only propose a task
  if today is genuinely a good day for it:
  - fits **remaining** energy tank today (after what's already done/planned),
  - fits the **remaining** time inside guardrail/awake windows (and daylight, for outdoor),
  - **weather** OK today (rain/heat) for outdoor/weather-sensitive tasks,
  - **travel-sane** — clusters near where today already sends you; doesn't force a lone cross-town trip,
  - no blocking flag: unmet dependency, `idealWindow` mismatch, perishable-after-hot adjacency, an
    explicit "not today."
- **Prefer pulling from the nearest future day** (moving a task *earlier* is normally safe) — unless a
  flag says today is bad, or the pull would break a future-day cluster/dependency.
- **X input:** either an explicit count ("add 2") or fill-to-capacity ("top up ~45 more min / ~10 more
  energy"). Propose the best-fit candidates **with reasons** ("next priority · fits your remaining
  tank · weather ok today · near your 2pm errand"); accept/reject each (§11).

### 13.3 Remove X tasks (per day) — shed overflow from the BOTTOM
Trigger: "I can't get through everything today." **Not** a Reschedule — the day is not cancelled, you
keep doing the rest; the script just trims the overflow, and **it** decides what goes (you're busy
doing the remaining work, so you're not the one picking).
- **Drop the lowest-priority items *for today* and re-place them on their next best day.** "For today"
  = priority **adjusted by deferability**, so what leaves is what's safest to move, not blindly the
  lowest global priority.
- **Deferability score** (new, deterministic): how safe is it to bump a task off today =
  f(no near deadline, not weather-locked-to-today, not part of a cluster you're still doing, no
  dependents waiting, not `pinnedToday`). Remove-X bumps **highest-deferability × lowest-priority
  first**. A task due today / pinned / weather-locked to today is protected — it leaves last or never.
- **X input:** explicit count ("remove 3") or fit-to-capacity ("until today fits my remaining
  time/tank"). Removed tasks re-place via §10. Preview + accept (§11).

The two nudges keep the day's core intact and only touch the margins — the reason they're separate
from the heavier Reschedule cascade.

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
| Travel, rough / batching / fallback | local haversine × road-factor (+ rush-hour multiplier) | none |
| Travel + traffic (COMMITTED, primary, live) | **Google Maps Distance Matrix** (fresh each plan; log to `orbitTravelLog` as backup) | billing + key; free monthly allowance — hard-cap in-code + Console so it can never charge |
| Travel, free routing (no traffic) | OSRM / OpenRouteService | free — not used (no traffic) |
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
5. **Day adjustments** — Reschedule cascade + the Add X / Remove X per-day nudges (§13) — and the
   **route map** (§14).
6. **Google Maps traffic travel + travel-log archive** (committed). Real timed placement uses Google's
   `duration_in_traffic` **live each plan**; log to `orbitTravelLog` as backup. **Kick off the
   ~2-month seed/pre-warm here** (§7) to build historical coverage while the free allowance would
   otherwise go to waste — inside the shared element cap, seeding yielding to real calls.

Each phase ships behind the staged-plan preview (nothing auto-commits) until Trey trusts it.

---

## 18. Open decisions (resolve before/while building the relevant phase)

- **Timed placement vs day-assignment for v1** — target is timed (energy/weather/recovery need it);
  confirm scope for the first shippable slice.
- **Guardrail config** (§5) — exact awake hours + per-category windows; add place open/close hours later.
- **Fatigue-carry formula** (§4) — pick and tune the concrete function.
- ~~Traffic approach~~ — **RESOLVED (2026-07-24):** **live** Google Maps for traffic each plan
  (Trey committed); the `orbitTravelLog` archive is **backup only**, not relied on while Google works;
  haversine for batching / no-data (§7).
- **Google cost guard (build-time TODO)** — confirm the current free-tier structure in the Cloud
  Console; set the **in-app monthly element cap** (stop + fall back before the limit) **and** a hard
  Console requests/day quota + $0 budget alert so billing can never trigger (§7).
- **Seed/pre-warm scope (§7)** — matrix granularity (place count × time buckets × weekday), the
  monthly target % (~90%), and window length (~2 months); prioritize real routes + guardrail hours
  first. Seeding must yield to real calls and stay under the hard element cap.
- **Break down the triage queue further?** — Trey floated finer triage tiers to reduce how many
  tasks ever reach "schedulable." Worth exploring as an input to volume control.
- **Duration/complete capture** — need a lightweight way to log actual task time to feed §8.
- **Add/Remove X input mode** (§13.2/13.3) — support both an explicit count *and* fill-to-capacity
  ("top up ~45 min" / "until today fits")? Leaning yes; confirm the default when building.
- **Holidays & notable days (§19)** — Trey's consideration (roll-out TBD): source, per-flag behavior,
  and calendar display all open. Directly affects far-future travel normalization (§7).

---

## 19. Holidays & notable days (CONSIDERATION — roll-out TBD)

Trey flagged this as *"something to think about, not sure how to roll it out fully"* — capture, don't
build yet. Two linked ideas:

### 19.1 Why the scheduler needs holidays
The far-future weekday-normalization (§7) assumes a Tuesday behaves like any Tuesday — **false on/near
major holidays.** Holidays change:
- **Traffic** — Thanksgiving / Black Friday / the day-before-holiday evening spike; weekday
  normalization is invalid, so use the actual date and/or a holiday modifier, or flag the estimate
  low-confidence.
- **Place hours** — stores closed/reduced; don't route an errand to a closed place.
- **Trey's availability / energy** — a day off, or a busy family day; different guardrails/capacity.

### 19.2 Holidays on the calendar as "things worth noting"
Trey also wants major holidays **rendered on the calendar** as visible annotations — a lightweight
"notable days" layer (like the fitness event chips) so both he and the scheduler see them. This is a
subset of the broader "notable events / multi-calendar" idea he raised earlier.

### 19.3 Sourcing (options, undecided)
- **Nager.Date** (`date.nager.at`) — free public-holidays API, **no key**, per country/year (US
  federal holidays). Cache annually.
- **Static list** — simplest; hardcode the major US holidays, zero dependency.
- **User-added notable days** — Trey adds his own (birthdays, "family in town", personal days) that
  also flag scheduling. Ties into the notable-events concept.

### 19.4 Open (roll-out TBD)
- Which source — API vs static vs both + user-added?
- What each flag *does* — block scheduling / reduce capacity / just annotate / adjust travel?
  (Likely configurable per flag.)
- The holiday **impact window** — day-of only, or day-before-evening + week-of for the big ones?
