# Vercel Deployment Storage — recurring manual prune

**Last checked:** 2026-09-14 — 30 deployments remaining, 111 deleted that run.

**Check this every couple of days.** If the date above is under ~2 days old, skip it — it has
already been done and there is nothing to see. If it is older, run:

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

There is no Vercel setting that fixes this, for three stacked reasons:

1. **Retention is already at its floor.** Hobby has been capped at **30 days** on all four
   deployment states (Canceled, Errored, Pre-Production, Production) since 2026-04-29, and the
   cap cannot be raised *or* lowered.
2. **This project deploys about 4x a day** (measured 2026-09-14: 81 deployments in August, 60
   in the first half of September). At that rate ~120 builds accumulate *inside* the 30-day
   window, so retention never catches up.
3. **~30 builds are protected permanently regardless of age** by retention's own exceptions:
   the last 10 created, the last 20 production in state Ready, the last 20 non-production in
   state Ready, anything holding a production alias, and the latest preview on a branch whose
   PR is still open.

So the storage curve is set by deploy *rate*, and the only lever is deleting builds by hand.

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

Do not project a storage saving from `du` output. Compare the billed number on
**Usage → Deployment Storage** before and after, over the same 30-day range.

Already done: `public/birds/`, `public/rustioclone/` and `public/rustpunkio/` (28.45 MB of
source, ~28 MB of build output) were untracked on 2026-09-14 and are local-only. See the
`public/` tools section of the root `CLAUDE.md`.

The genuinely effective lever is **deploying less often** — batching work-in-progress commits,
or keeping exploratory work on a branch that does not trigger a production build.
