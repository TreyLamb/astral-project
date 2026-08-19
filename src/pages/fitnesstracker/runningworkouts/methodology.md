# Methodology — how this plan gets built

**Read before changing any number in this doc set.** This is the running-specific binding of
`../guidelinesForecast.md`, which is the parent methodology and wins on conflict. That doc's
governing principle is the whole point:

> *"the person never picks a formula, a curve shape, or a model — the system infers that from
> goal type. The only manual input is ever a real result."*

Written 2026-08-18, after the plan spent two weeks prescribing paces roughly 2–3.5 minutes per
2-mile too slow because nobody re-checked the baseline. See `training-context.md` for the
post-mortem.

---

## The five rules

**1. Never hand-write a pace.** Paces are a function of current fitness, and the app computes
them. `calc/goals.js` → `estimateRunBaseline(workouts)` turns logged runs into a VDOT;
`calc/vdot.js` → `trainingPaces(vdot)` turns that VDOT into Daniels E / M / T / I / R paces. Both
are unit-tested against Daniels' published tables. **This doc records the zone and the purpose;
the app prints the number.** A pace typed by hand into a markdown file is stale the moment
fitness moves, and there is no mechanism that will ever correct it.

**2. Every session states a purpose**, and is one of:
- **faster** than the last comparable session, or
- **the same**, to consolidate, or
- **easier**, and then *the reason is named* — recovery, deload, taper, or a niggle.

A session with no stated purpose is a bug. Trey's rule, and it is a good one: *"Every single
workout should be purposeful. if it's not FASTER then it's because it's a recovery workout or for
some other purpose."*

**3. Re-derive on evidence, not on the calendar.** Recompute training paces whenever:
- a time trial or race happens (always),
- **any session comes in outside its prescribed band** — that is the signal the model is wrong,
- there's been a layoff of >10 days,
- a new cycle is being built.

Progression is not a per-cycle percentage. It is the output of re-measuring.

**4. Volume is governed by ACWR, not a formula.** `calc/load.js` → `acwrRolling()` /
`acwrStatus()`: acute (7d) ÷ chronic (28d) load, sweet spot **0.8–1.3**, caution to 1.5, high risk
above. Let that gate the ramp. The old "+8% per non-deload cycle" rule is retired — it grew
volume on the calendar regardless of what the athlete was actually absorbing.

**5. One variable at a time.** Add reps, or add pace, or add volume — not two in the same cycle.
When a session is missed, resume at the current day; never make up lost volume.

---

## What this athlete actually needs

Established from real data, not assumption. **Re-derive this section whenever the picture
changes — it is a snapshot, not a constant.**

- Goal: **13:56 / 3200m** ≈ **VDOT 44**. At that fitness: I 1:42/400 · T 7:47/mi ·
  E 9:47–11:02/mi · R 1:32/400.
- **The limiter is aerobic endurance, not leg speed.** Every measurement says so: the Aug 1–2
  1600m faded 1:56 → 2:07 → 2:14 → 2:06, the 1200m was no faster per-lap than the 1600m, and HR
  ran 185 avg / 197 peak. On 8/18 he ran 400s at 1:43/1:47/1:49 — already at *goal-fitness* I
  pace — while a sustained 8-lap effort at that pace is nowhere near available yet.
- **Therefore: reps at goal pace with full recovery mean on-track, not ahead.** A 400 rep is
  *supposed* to be faster than 3200m race pace; that is what rep work is for. Do not read a fast
  single rep as being ahead of schedule, and do not respond to it by prescribing faster reps.
- **The work that closes the gap** is threshold volume, **rep density** (more reps, shorter
  recovery — not faster reps), and the long run. Standard military 2-mile progression:
  4×400 → 5×400 → 6×400 → 8×400, then 5×600 / 4×800 at goal pace in the final weeks. One
  threshold session and one interval session per week on an easy-mileage base; threshold ≈ 86–88%
  VO2max, ~20 minutes continuous.

## Guardrails

- **Ankle** (long-standing): no sustained hill running before Phase 2, and only short controlled
  efforts on gentle grade even then. Sharp pain — not normal soreness — ends the session.
- **Calf** (flagged 2026-08-17/18, attributed to under-stretching): the same stop-sign rule. Two
  sessions were cut short for it in the rebase week; if it recurs, that is a volume signal, not
  something to train through.
- Two hard days never sit back to back.
- Not medical advice. If something hurts in a way that isn't ordinary training soreness, that is
  a doctor's question, not a plan question.

## What lives where

| Doc | Owns |
|---|---|
| `../guidelinesForecast.md` | Parent methodology. Wins on conflict. |
| `methodology.md` (this file) | How the running plan is built and re-derived. |
| `training-context.md` | Decisions, history, post-mortems. Wins over the numbers docs. |
| `cycle.md` | The microcycle template and hard spacing rules. |
| `training.md` | Dated cycles — **structure and purpose**; numbers regenerated, not typed. |
| `pfra-full-calendar.md` | Record of what was actually run. |
| `Guidelines_AF` | The event, its components, and Trey's targets. |
| `strength/` | Trey's own push-up / sit-up programming. He owns it. |
