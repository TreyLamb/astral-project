# Vercel Deployment Storage — recurring manual prune

**Last checked:** 2026-09-14 — 30 deployments remaining, 111 deleted that run.

**Check this every couple of days.** If the date above is under ~2 days old, skip it — it has
already been done and there is nothing to see. If it is older, run the commands below.

Since retention was shortened to 1 week (see the correction further down), this is a **backstop**
rather than the mechanism — expect most runs to find nothing to prune. That is the success case,
not a reason to go looking for something to delete.

```bash
npm run vercel:prune -- --status     # state + last-checked date, changes nothing
npm run vercel:prune -- --dry-run    # show exactly what would be deleted
npm run vercel:prune                 # delete, then re-stamp the date above
```

The script stamps the date itself on every completed run, including a run that finds nothing
to delete. Do not hand-edit the date — if it is stale, that means the prune genuinely has not
run, which is the signal.

Needs the Vercel CLI (`npm i -g vercel`) and `vercel login`. `vercel whoami` should print
`treylamb`.

---

## Why this has to be manual

The free tier allows **10 GB** of Deployment Storage. That metric is **bytes at rest** — source
files, build output and build cache, summed across every deployment still retained. It is **not
bandwidth**; traffic is metered separately as Fast Data Transfer and Edge Requests. Hitting 75%
of it says nothing about how much the site is being visited.

🔴 **CORRECTION 2026-09-14 — retention CAN be shortened, and this file originally said it could
not.** The first version of this doc claimed Hobby's 30-day cap "cannot be raised *or* lowered"
and built the whole case for a manual prune on that. The docs only ever said it was *capped* at
30 days; the floor was an assumption, and it was wrong. **Settings → Security → Deployment
Retention Policy offers 30 days / 2 weeks / 1 week / 1 day** on each of the four states. So
retention does most of this automatically and the script below is a **backstop, not the primary
mechanism**.

### Retention settings for this project

| State | Set to | Why |
|---|---|---|
| Canceled | 1 day | Free to set; this project has none |
| Errored | 1 week | Long enough to still read a failed build's logs |
| Pre-Production | 1 week | Only 2 of 141 deployments were previews |
| **Production** | **1 week** | **The only dial that matters — 139 of 141 deployments** |

Every push to `main` is a production build and all 141 measured deployments were state `READY`,
so the Canceled and Errored dropdowns are close to cosmetic here.

**Why 1 week and not 1 day:** the retention exceptions keep the **last 20 production deployments
in state Ready** regardless of age. At ~4 deploys/day that is ~5 days of rollback history
whatever is picked, so 1 day saves little and buys no safety. Expect a steady state of ~28-30
deployments.

What still argues for the prune existing at all:

1. **This project deploys about 4x a day** (measured 2026-09-14: 81 deployments in August, 60
   in the first half of September), so a heavy day can still bank a large daily peak before the
   retention sweep runs — and that sweep takes up to 48 hours.
2. **~30 builds are protected permanently regardless of age** by retention's own exceptions:
   the last 10 created, the last 20 production in state Ready, the last 20 non-production in
   state Ready, anything holding a production alias, and the latest preview on a branch whose
   PR is still open. No retention setting gets below that floor.

## 🔴 The dashboard figure and the daily figure disagree ON PURPOSE — do not chase the red one

Vercel bills this in **GB-months**: *"For each metric, Vercel records the maximum stored amount
for each project on each billing day. It adds those daily project amounts across the billing
period."*

| Where | What it is | Behavior |
|---|---|---|
| Red project-dashboard figure | The **billing-period accumulation** — each day's peak, summed | **Only ever goes UP within a cycle** |
| Usage drill-in, "as of today" | The **current stored amount** | Reflects reality now |

So deleting deployments **cannot** lower the red number. Days already elapsed are banked, and the
total keeps climbing until the billing period rolls over. Observed 2026-09-14: the dashboard
still read over 10 GB and in the red while the same day's drill-in read under 2 GB, down from
~7.5 GB before the prune. **Nothing was wrong — the prune had worked.**

⚠️ **So "prune, then watch Usage drop" is bad advice and was given here once.** The only figure
that responds to a prune is the per-day one. Judge the result there, and expect the banner to
stay red for the remainder of the cycle no matter what is deleted.

## What the script does

Keeps the newest **30** and deletes the rest, oldest-first, by explicit URL.

⚠️ **It does NOT use `vercel remove <project> --safe`, and neither should you.** Passing a
project name to `vercel remove` **deletes the entire project** unless `--safe` is given — and
even with `--safe`, that flag only skips deployments holding an active preview URL or production
domain. It is *not* the same guard as the retention exceptions above, so it would happily delete
recent builds too. Deleting by explicit URL is the only way to actually keep a chosen window.

Two safety rails, both of which abort the run rather than proceed:

- **`MIN_AGE_DAYS = 7`** — nothing newer than a week is ever deleted, whatever `KEEP` says.
- Assertions that the kill list does not overlap the keep set and does not breach the age floor.

Deleted deployments enter a **30-day recovery window** (Project → Settings → Security → Recently
Deleted) and can be restored from there.

## Reducing the per-deployment cost

Measured 2026-09-14: **7.5 GB across 141 deployments is ~54 MB each** — well below the ~140 MB
that local `du` of source + `dist/` suggests, so Vercel evidently **deduplicates unchanged files
across deployments**. Trimming static assets therefore helps far less than raw file sizes imply,
because an asset that never changes is not being stored once per build.

Do not project a storage saving from `du` output. Compare the **per-day** figure in the Usage
drill-in before and after — not the accumulating dashboard total, for the reason above.

Already done: `public/birds/`, `public/rustioclone/` and `public/rustpunkio/` (28.45 MB of
source, ~28 MB of build output) were untracked on 2026-09-14 and are local-only. See the
`public/` tools section of the root `CLAUDE.md`.

The genuinely effective lever is **deploying less often** — batching work-in-progress commits,
or keeping exploratory work on a branch that does not trigger a production build.
