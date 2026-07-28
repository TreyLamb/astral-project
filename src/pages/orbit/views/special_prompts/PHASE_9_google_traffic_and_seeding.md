# Phase 9 — Live Google Traffic + Travel-Log Archive + Seeding

**Mission:** make travel estimates *real* — use Google Distance Matrix's predictive traffic (`duration_in_traffic`) for the trip's actual future time, log every result to a local backup archive, and pre-warm that archive with a budget-capped seeding campaign. Google is **primary and live each plan**; the local DB is **backup only** (used when Google is lost/over-cap); haversine is the last resort. All of it is hard-capped so it can **never** cost money.

This is **doc §17 Phase 6** of `src/pages/orbit/Guidelines_Scheduler.md` (the "spec"). Deep section: **§7 (travel & places DB, `departure_time`, cost guard, seeding)**, with **§19 (holidays)** as an adjacent consideration.

> ⚠️ **This is the one remaining phase that requires files at the astral-project ROOT, which you (the agent) cannot see or edit** — specifically a new serverless endpoint under `api/` and a Vercel env var. This doc gives you the **complete endpoint code** and the exact human steps so the human/verifier can drop it in. **You build everything on the Orbit side** (client service, cost guard, travel-log logging, solver integration, seeding UI) so that the moment the endpoint + key exist, it all works. Where you truly cannot act, produce the artifact in your report and flag it — never fake it.

---

## ⚡ AGENT PROMPT (read this, then read the WHOLE doc before writing code)

> You are extending an already-built deterministic task-scheduler inside the **Orbit** sub-app of a React SPA. **Phases 1–6 (ideally 7–8) are done and green.** There is a working timed solver (`calc/scheduler.js` → `buildTimedPlan`), pure `calc/travel.js` (haversine + rush-hour), a places DB, and a **travel-log DB already scaffolded** (`orbitTravelLog`, `newTravelLogEntry`, `upsertTravelLogEntry`) plus a **cost-guard settings block already present** (`settings.googleCostGuard`). Your job is Phase 9: wire in **live Google traffic** as the primary travel source, **log to the backup archive**, and add **budget-capped seeding** — exactly as specified.
>
> **You can only see `src/pages/orbit/` and `src/pages/fitnesstracker/`.** The Google call MUST go through a serverless endpoint at the **astral-project root `api/` folder, which you cannot see or edit** (a key in client code would be publicly exposed — unacceptable). This doc contains the **full endpoint file** to hand to the human, and the exact conventions it follows. Build the entire Orbit-side integration so it activates as soon as the endpoint + `GOOGLE_MAPS_API_KEY` exist; until then everything must **degrade gracefully** to the travel-log DB and then haversine (the app must never break because Google is absent).
>
> **Definition of done:** every checklist MUST implemented on the Orbit side; new pure logic unit-tested; `npx vitest run` all-green; `npm run build` clean; `npx eslint <changed/new files>` clean; coverage-matrix report (§8) that **explicitly lists the human-only steps** (endpoint file, Vercel env var, Google Console quota). Do not regress existing tests, and **do not break the scheduler when Google is unavailable.**
>
> Read the rest of this document fully first.

---

## 1. Repo & environment constraints — READ CAREFULLY
- **Editable, in-scope:** `src/pages/orbit/` (all) and `src/pages/fitnesstracker/`.
- **Astral-project ROOT — you CANNOT see/edit it, but Phase 9 needs it.** Specifically:
  - **`api/orbit-travel.js`** — the serverless proxy to Google (full code in §5.1 below). **You cannot create this.** Put its complete contents in your final report for the human to add. Build your client code to call `POST /api/orbit-travel` regardless.
  - **`GOOGLE_MAPS_API_KEY`** — a Vercel environment variable (server-side, read via `process.env`, NOT a `VITE_` var — a `VITE_` var would be baked into the public bundle and leak the key). **Human step.**
  - **Google Cloud Console** — enable Distance Matrix + billing, set a **hard requests/day quota** and a **$0/low budget alert**. **Human step.** These plus the in-app element cap make "never charged" a guarantee.
- **Commands from root (work despite scoped file view):** `npx vitest run`, `npm run build`, `npx eslint <files>`. Tests MUST live under `src/pages/orbit/**/*.test.js`.
- `vercel.json` at root already resolves `api/*` before SPA rewrites — no routing change needed. `api/` uses ESM (`"type":"module"`). You don't touch any of this; it's context for the human dropping in the endpoint.
- **Do NOT** touch the Firestore coalescing machinery, and **do NOT** wire the travel-log/places DBs into Firestore (spec §3.2 keeps them local — and they're a private movement log, spec's privacy note: never export/share). **Do NOT** update the external memory file. **DO** update `Guidelines_Scheduler.md`'s "Where it stands" block when done.

---

## 2. Current code you build on (authoritative — already exists)

### Travel-log DB & cost guard (Phase 1 — already built, just consume them)
```js
// orbitConfig.js
newTravelLogEntry({ key, origin, dest, weekday, hourBucket, durationSec, samples, median, source })
//   key = `${originPlaceId}|${destPlaceId}|${weekday}|${hourBucket}`  (identity; id===key)
//   source: 'google' | 'observed' | 'seed'
newPlace({ name, lat, lng, zip, source, openHours, geocodedAt })

// settings.googleCostGuard (already in defaults + deep-merged):
{ monthlyElementCap: 8000, elementsUsedThisMonth: 0, monthKey: '', seedingEnabled: false, seedTargetPct: 0.9 }

// orbitContext.js exposes:
travelLog                       // array (state)
upsertTravelLogEntry(entry)     // idempotent by entry.key, local persist
places                          // array
settings, updateSettings        // for the cost counter (see gotcha #2 — pass a FULL googleCostGuard object)
```

### `calc/travel.js` — the fallback math (keep as the last resort)
```js
haversineMiles(a,b), roadMinutes(miles,opts), rushHourMultiplier(hour,cfg),
travelMinutes(from,to,hour,opts) -> minutes|null, clusterByProximity(items,radius)
```

### `calc/scheduler.js` — the solver you'll feed a live-travel lookup into
```js
buildTimedPlan(input) => { placements, unplaced }
// It is PURE and SYNCHRONOUS. It currently computes travel via travel.js haversine on
// {lat,lng} coords, tracking `lastPlace` (coords) per day. See §5.3 for the change: add a
// `travelLookup` input and track lastPlace *id* so the lookup can key by placeId.
```
Weather geocoding already exists and is reusable for places: `orbitWeatherService.js` exports `geocodePlaceName(name)` and `geocodeZip(zip)` (Nominatim, free, no key). Use these to ensure every place has coords before a Google call.

---

## 3. Gotchas that WILL bite you
1. **`departure_time` = the TRIP's future time, NOT when you call.** Google returns predicted traffic for whatever future datetime you pass. Always pass the trip's scheduled datetime (unix **seconds**). Omitting it gives a static, traffic-free number (= no better than haversine). **This one parameter is the entire reason to use Google.** You can't query the past (now/future only).
2. **Far-future → normalize** `departure_time` to the **next upcoming `{weekday, hour}` occurrence** for trips >~7 days out (a Tuesday behaves like any Tuesday). This also makes the travel-log key reusable. **EXCEPTION: major holidays** (spec §19) — normalization is invalid; use the actual date or flag low-confidence (holiday handling is a COULD here — see checklist).
3. **Cost is per billable ELEMENT (origins × destinations), not per HTTP request.** Batch up to 25×25 per request for fewer round-trips at the same element cost. The counter counts **elements**, and covers **real + seeding** calls together.
4. **Cost-guard settings patch merges against DEFAULTS** — to bump the counter, pass a FULL object: `updateSettings({ googleCostGuard: { ...settings.googleCostGuard, elementsUsedThisMonth: n, monthKey } })`. Reset the counter when `monthKey !== currentYYYYMM`.
5. **Never breach the cap.** Real calls take priority; seeding only fills headroom up to `seedTargetPct` of the cap and yields to real calls. Check `elementsUsed + batchElements <= monthlyElementCap` BEFORE every call; if it wouldn't fit, skip Google and fall back.
6. **Graceful degradation is mandatory.** No key / over cap / network error / endpoint missing → the scheduler must still produce a plan using the travel-log DB median (× rush multiplier) and then haversine. The app must never break because Google is absent.
7. **Determinism** in the solver stays intact: the async Google fetch happens **before** `buildTimedPlan`, populating a lookup the pure solver reads synchronously. Never make the solver async.
8. **Lint:** lazy `useState` init (no `setState` in effects); no unused vars/directives. **Never log or expose the API key** (it lives only in the endpoint, server-side).
9. **Privacy:** the places + travel-log DBs are a personal movement log — keep single-user, local, never export.

---

## 4. Build checklist (MUST / SHOULD / COULD)

### Endpoint (human-applied; you provide code + build the client)
- **9.1 (MUST — deliver as code for the human)** Provide the complete `api/orbit-travel.js` (see §5.1). In your report, paste it verbatim and list the human steps (env var, Console quota). You cannot create it yourself.

### Orbit-side client & guard
- **9.2 (MUST)** `orbitTravelService.js` (in `src/pages/orbit/`): `fetchTravelMatrix(origins, destinations, departureUnix, idToken) -> { ok, durations:[[sec]], reason? }`. POSTs to `/api/orbit-travel`. Returns `{ok:false, reason}` on any non-OK/no-key/error (never throws).
- **9.3 (MUST)** Pure `calc/departure.js`: `normalizeDeparture(dateISO, hour, now) -> unixSeconds` implementing gotcha #2 (near-term = actual date/time; >7 days out = next `{weekday, hour}`), and `hourBucket(hour) -> bucket` + `travelLogKey(originId, destId, weekday, hour)`. Unit-tested.
- **9.4 (MUST)** Cost guard (pure + wired): `calc/costGuard.js` with `canSpend(guard, elements, nowMonthKey) -> bool` and `applySpend(guard, elements, nowMonthKey) -> newGuard` (resets the counter on month rollover). Wire the counter increment through `updateSettings` (gotcha #4). Unit-tested.
- **9.5 (MUST)** **Travel resolver** (context/service orchestration): given the candidate place-pairs + their trip datetimes, for each pair (a) check the travel-log DB for a fresh entry at that `{origin,dest,weekday,hourBucket}` — **but only use it if Google is unavailable/over-cap**; (b) if Google is available and under cap, batch the missing pairs into ≤25×25 Google requests, spend from the guard, and **log every result** to `orbitTravelLog` via `upsertTravelLogEntry` (source `'google'`, updating `samples`/`median`); (c) build a `Map` → `travelLookup(originId, destId, hour) -> minutes|null`. Live Google result → minutes; else DB median (× rush multiplier from `travel.js`) → minutes; else `null` (solver falls back to haversine).
- **9.6 (MUST)** **Solver integration:** add a `travelLookup` input to `buildTimedPlan` and track `lastPlaceId` per day; when computing travel-before, try `travelLookup(lastPlaceId, taskPlaceId, hour)` first, else the existing `travelMinutes(coords…)` haversine. `AutoScheduleView` builds the lookup (async pre-pass) before calling `buildTimedPlan`, showing a "checking traffic…" state. Keep all existing scheduler tests green (a missing `travelLookup` must behave exactly as today).
- **9.7 (SHOULD)** **Seeding campaign:** a Settings panel ("Seed travel database") that, time-boxed and budget-aware, pre-fetches the `{place-pair × weekday × hourBucket}` matrix into `orbitTravelLog` (source `'seed'`) up to `seedTargetPct` of the cap — **prioritizing real/likely routes, guardrail hours only, rush vs non-rush buckets first**, yielding to real calls, never breaching the cap. MVP: a manual "Seed now (uses ≤N elements of remaining budget)" button with progress + stop, spending only headroom. Full auto-spread across ~2 months is a COULD.
- **9.8 (SHOULD)** Cost-guard UI in `SettingsView.jsx`: show `elementsUsedThisMonth / monthlyElementCap` this month, let the user set the cap and toggle `seedingEnabled` (full googleCostGuard object per gotcha #4).
- **9.9 (COULD)** **Holidays (spec §19):** a small `calc/holidays.js` (static US-holiday list is fine, no API) that flags a date so `normalizeDeparture` uses the actual date near holidays and the calendar can annotate "notable days." Clearly ✂️-flag if deferred.
- **9.10 (COULD)** "Observed" travel logging: when the user actually makes a trip (if any signal exists), log `source:'observed'`. Likely ✂️-deferred (no reliable signal yet) — note it.

---

## 5. Detailed specs & the endpoint code

### 5.1 `api/orbit-travel.js` — COMPLETE endpoint (HAND THIS TO THE HUMAN; you cannot create it)
Conventions it follows (from the project's serverless rules): ESM, default-exported `handler(req,res)`, ID-token auth mirroring the existing `api/orbit-annotate.js` (called from a signed-in browser tab), key from `process.env` (never `VITE_`), no Firestore writes.
```js
// api/orbit-travel.js
// Proxies Google Distance Matrix so the API key stays server-side. Called from
// Orbit's auto-scheduler (signed-in browser tab) — verifies a Firebase ID token
// like api/orbit-ai-triage.js / api/orbit-annotate.js. Bills per element
// (origins × destinations); departure_time drives predictive traffic. Degrades:
// no key -> {ok:false, reason:'no-key'} so the client falls back to its local DB.
import { adminAuth } from './_lib/firebaseAdmin.js';

const DM_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!idToken) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try { await adminAuth().verifyIdToken(idToken); }
  catch { res.status(401).json({ error: 'Unauthorized' }); return; }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) { res.status(200).json({ ok: false, reason: 'no-key' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { origins, destinations, departureTime } = body || {};
  if (!Array.isArray(origins) || !Array.isArray(destinations) || origins.length === 0 || destinations.length === 0) {
    res.status(400).json({ error: 'origins and destinations required' }); return;
  }

  const fmt = (arr) => arr.map((p) => `${p.lat},${p.lng}`).join('|');
  const params = new URLSearchParams({
    origins: fmt(origins),
    destinations: fmt(destinations),
    departure_time: String(departureTime || 'now'),
    traffic_model: 'best_guess',
    key,
  });

  try {
    const r = await fetch(`${DM_URL}?${params.toString()}`);
    const data = await r.json();
    if (data.status !== 'OK') { res.status(200).json({ ok: false, reason: data.status || 'google-error' }); return; }
    const durations = (data.rows || []).map((row) =>
      (row.elements || []).map((el) =>
        (el.status === 'OK' ? (el.duration_in_traffic?.value ?? el.duration?.value ?? null) : null)));
    res.status(200).json({ ok: true, durations, elementCount: origins.length * destinations.length });
  } catch {
    res.status(200).json({ ok: false, reason: 'network' });
  }
}
```
**Human steps to activate (put these in your report):**
1. Add the file above at `api/orbit-travel.js` (astral-project root).
2. In Google Cloud Console: enable **Distance Matrix API** + billing; set a **max requests/day quota** and a **$0/low budget alert** (belt-and-suspenders → guaranteed never charged); note the current free-tier terms (spec §7 — verify, they changed ~2025).
3. Add `GOOGLE_MAPS_API_KEY` in Vercel → Project Settings → Environment Variables (plain env var, not `VITE_`).

### 5.2 Client call (`orbitTravelService.js`, 9.2)
Mirror how `annotateTasks` calls `/api/orbit-annotate` in `orbitContext.js`: get `await user.getIdToken()`, `fetch('/api/orbit-travel', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({origins, destinations, departureTime}) })`. Return `{ok, durations, reason}`; never throw.

### 5.3 Solver change (9.6) — exact
- Add `travelLookup` to the `buildTimedPlan` input (default `undefined`).
- Track the day's `lastPlaceId` alongside `lastPlace` (coords). `homePlace` gets a synthetic id like `'home'` (and pass a `homePlaceId` or reuse `'home'`).
- Where the solver computes `travelBefore`:
  ```
  let tm = null;
  if (travelLookup && lastPlaceId && taskPlaceId) tm = travelLookup(lastPlaceId, taskPlaceId, hour);
  if (tm == null && taskPlace && lastPlace) tm = travelMinutes(lastPlace, taskPlace, hour, travelOpts); // haversine fallback
  travelBefore = tm != null ? Math.round(tm) : 0;
  ```
- **Backward-compat:** with no `travelLookup`, behavior is byte-identical to today → existing `scheduler.test.js` stays green. Add new tests for the lookup path (lookup hit overrides haversine; lookup miss falls back).

### 5.4 Resolver orchestration (9.5)
In `AutoScheduleView` (or a context helper), before `buildTimedPlan`: derive the candidate place-pairs from the ordered candidates + home; for each unique `{origin,dest,weekday,hourBucket}`, decide source (fresh Google if under cap, else DB median × rush, else null); batch Google-needed pairs (≤25×25), `canSpend`→call→`applySpend`→`upsertTravelLogEntry`; assemble `travelLookup`. Show a lightweight "checking traffic (used N/CAP this month)" status. If nothing is available, the solver silently uses haversine.

### 5.5 Departure normalization (9.3) — pure, tested
`normalizeDeparture(dateISO, hour, now)`: if the target datetime is ≤7 days from `now`, return its unix seconds; if >7 days, return the unix seconds of the **next** occurrence of that `{weekday, hour}` from `now` (Google predicts typical conditions the same). Google can't take a past time — if the computed time is in the past, bump to the next matching future instance. `hourBucket(hour)` can be the hour itself or a coarse bucket (document your choice); use it consistently in the travel-log key.

---

## 6. Tests required (`src/pages/orbit/**`, green)
- **9.3 `normalizeDeparture`:** near-term returns the real datetime; a date 20 days out returns the next same-weekday/hour instance; a past time bumps forward; `travelLogKey`/`hourBucket` are stable.
- **9.4 cost guard:** `canSpend` is false when a batch would exceed the cap; `applySpend` increments within a month and **resets** on month rollover (`monthKey` change).
- **9.6 solver lookup:** a `travelLookup` hit overrides the haversine estimate; a miss (returns null) falls back to haversine; absent `travelLookup` is byte-identical to current behavior.
- **9.5 resolver (pure parts):** given a travel-log with a fresh entry and Google marked unavailable, the resolver uses the DB median; with Google available + budget, it prefers the live value and logs it. (Mock the fetch; keep the decision logic pure/testable.)

## 7. Integration/wiring points
- `calc/scheduler.js` (travelLookup + lastPlaceId), `AutoScheduleView.jsx` (async pre-pass + status), `SettingsView.jsx` (cost-guard display + seeding panel), new `orbitTravelService.js`, `calc/departure.js`, `calc/costGuard.js` (+ optional `calc/holidays.js`). All inside `src/pages/orbit/`.
- The endpoint (`api/orbit-travel.js`) and env var are **human steps** — deliver code + instructions, don't attempt to create them.

## 8. Definition of done — report format
Coverage matrix for every checklist item (9.1–9.10) → Done / Partial / Cut / **Human-step** with file+line. A dedicated **"Human steps required"** section repeating the endpoint file + the Vercel/Console actions (so nothing is silently assumed done). Separate verification: final `npx vitest run` summary line, `npm run build` result, `npx eslint <changed files>` clean, and an explicit statement that **the scheduler still works with Google absent** (degrades to DB→haversine). Mark every agent-initiated omission/downgrade with ✂️ (esp. seeding auto-spread and holidays if deferred). Update the "Where it stands" block in `Guidelines_Scheduler.md` (Phase 9 = doc §17 P6; note the human steps as the only thing between "built" and "live").
