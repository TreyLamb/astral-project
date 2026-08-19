# Getting workouts into MFT

Trey runs an **Apple Watch**; workouts land in **Apple Fitness**. There are three routes in, from
zero-setup to zero-effort. Start with route 1 today, set up route 2 when you want it automatic.

---

## What Apple actually exposes (verified 2026-08-19)

This constrains everything below, so it goes first.

| Source | Gets you | Splits / laps? |
|---|---|---|
| iOS **Shortcuts** → `Find Health Samples` | start, end, duration, calories, distance | **No** |
| A **native app** reading HealthKit (HealthFit, RunGap) | everything above **+ laps** | **Yes** |

Laps and splits exist in HealthKit as `HKWorkoutEvent` (`.lap` / `.segment`), but **Shortcuts
cannot read them** — only a native app can. This is why the Fitness app shows more than a
Shortcut can extract, and it's the reason route 2 uses a bridge app rather than a bare Shortcut.

**Consequence for training:** without a bridge app, a 4×400 session imports as one undifferentiated
blob. Per-rep splits are the whole point of a rep session, so if you care about those, use route 2.

---

## Route 1 — drag and drop (works right now, no setup)

1. Export the workout as **TCX** or **GPX** from a bridge app (see route 2 — Apple's own Fitness
   and Health apps have no export).
2. Open **`/MFT/import`**.
3. Drop the file on the drop zone, check the preview, save.

Parses distance, duration, elevation gain/loss, average HR, and per-split data. ✂️ **`.FIT` is not
supported** — `parseFit()` throws on purpose. Export TCX or GPX instead.

## Route 2 — automatic, via a bridge app (recommended)

**HealthFit** ([App Store](https://apps.apple.com/us/app/healthfit/id1202650514)) reads HealthKit
natively, so it gets the laps, and it **auto-syncs to Dropbox, Google Drive, iCloud Drive or
OneDrive with no interaction after each workout**. RunGap is the main alternative (more export
targets, slightly more setup).

Since Trey's Dropbox path is identical on every machine, this gives one flow that solves
ingestion *and* works away from the home PC:

```
Apple Watch → Fitness → HealthFit (auto-export) → Dropbox → any machine → /MFT/import
```

**Setup:** install HealthFit → grant Health access → Settings → enable automatic export → choose
**Dropbox** and **TCX** (or FIT for the richest data, but MFT can't parse FIT — use TCX).

⚠️ **Unverified on-device:** that HealthFit's auto-export includes lap markers in its TCX output.
Documented as supported; confirm with one real interval session before relying on it.

## Route 3 — one tap, straight into the app

`POST /api/import-workouts` accepts a workout as JSON, so an iOS Shortcut can push straight to
Firestore with no file handling. **Totals only** — see the table above.

**This route is blocked until three Vercel env vars are set** (see below). The endpoint returns
`500 Server misconfigured` without them. The meals equivalent, `api/import-meals.js`, has been
complete but inert since 2026-07-22 for exactly this reason.

---

## Unblocking the API routes — three env vars

Set all three in **Vercel → Project Settings → Environment Variables** (all environments), then
redeploy.

**1. `FIREBASE_SERVICE_ACCOUNT_KEY`**
Firebase Console → project `astral-project-10a35` → ⚙ Project Settings → **Service accounts** →
**Generate new private key**. Downloads a JSON file. The env var value is the **entire file
contents**, pasted as one value — it gets `JSON.parse`d in `api/_lib/firebaseAdmin.js`.
**Never commit this file.** It bypasses all Firestore security rules.

**2. `FITNESS_UID`**
Your Firebase Auth uid. Two ways: Firebase Console → **Authentication → Users** → copy the User
UID for your Google account; or open **`/MFT/settings`**, which now displays it while signed in.

**3. `WORKOUT_IMPORT_SECRET`**
Any long random string you invent — it's a shared password. Generate one with:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Setting these also revives the meal import (`MFP_IMPORT_SECRET` for that one).

### Test before trusting it

```bash
# should 401
curl -s -X POST https://<your-domain>/api/import-workouts \
  -H 'Authorization: Bearer wrong' -H 'Content-Type: application/json' \
  -d '{"workouts":[]}'

# should 200
curl -s -X POST https://<your-domain>/api/import-workouts \
  -H "Authorization: Bearer $WORKOUT_IMPORT_SECRET" -H 'Content-Type: application/json' \
  -d '{"workouts":[{"date":"2026-08-19","activityType":"run","distanceM":4553,"durationSec":1763,"note":"shortcut test"}]}'
```

## Building the Shortcut

1. Shortcuts → **+** → **Find Health Samples**, type **Workouts**, sort by End Date, limit 1.
2. **Get Details of Health Sample** for duration / distance / start date.
3. **Text** action — build the JSON body:
   `{"workouts":[{"date":"<start date, formatted yyyy-MM-dd>","activityType":"run","distanceM":<meters>,"durationSec":<seconds>,"sourceId":"<uuid>"}]}`
4. **Get Contents of URL** → `https://<your-domain>/api/import-workouts`, POST, headers
   `Authorization: Bearer <secret>` and `Content-Type: application/json`, body = the text above.
5. Optionally add a **Personal Automation** on "Workout Ended" to make it zero-tap.

`sourceId` makes re-runs idempotent — the same workout re-sent overwrites rather than duplicating.

---

## Getting the data to Claude

Firestore is auth-gated, so Claude cannot read it directly. Two options:

- **`npm run mft:pull`** — dumps `users/{uid}/fitness_*` to a local JSON snapshot using the same
  service-account key. Works on any machine that has the key. Output is gitignored.
- **JSON export** on `/MFT/import` — no credentials needed. Prefer this over the CSV export: CSV
  drops the `metrics` object, so it loses splits and lift sets.

⚠️ This repo is **public**. Health data must never be committed — keep snapshots gitignored, or in
Dropbox outside the repo.
