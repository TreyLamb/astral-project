# Training — Numbers, with Pushups (DERIVED — Cycle 1 & 2)

> **This is a derived doc, not the source of truth.** It mirrors
> `../runningworkouts/training.md` (the real running plan) with one extra
> column bolted on the side — a daily pushup schedule computed from the rules
> below. **`training.md` is never edited to produce this file** and stays
> authoritative for the running plan itself; if the two ever disagree, trust
> `training.md` and treat this file as stale until re-generated.
>
> Lives in `runningworkouts-derived/` (a sibling of `runningworkouts/`, not
> inside it) on purpose, so the folder that documents-agent owns stays
> untouched by this pushup work.
>
> Full detail (per-set clock times, a 6-set/2-hour alternative, weekly
> roll-ups, running/cumulative totals, and the exact rulings this table is
> built on) lives in the companion workbook:
> `src/pages/planningTool/samples/pushup-plan.xlsx` (also served at
> `/planning-tool-samples/pushup-plan.xlsx`, and loadable with one click from
> `/planning-tool`'s "📥 Load push-up plan sample" button, then "📊 Dashboard
> view" for the KPI/chart summary).
>
> **Corrected 2026-08-17 — how to update this file.** An earlier version of
> this header said to "re-generate both this file and the workbook" from
> `src/pages/planningTool/samples/generate-pushup-plan.mjs`. That is wrong and
> would waste a future session's time: **the generator writes only
> `pushup-plan.xlsx`** (one `writeFileSync` at the end of the script). This
> markdown is maintained by hand against `training.md`. So when `training.md`'s
> dated tables change: edit this file directly, and separately re-sync the
> generator's hard-coded `DAYS` array and re-run it for the workbook.

**Goal:** 13:56 (6:58/mi) · stretch 13:40 (6:50/mi) · Test: **12/31/26** *(USAF PFRA — see `../runningworkouts/Guidelines_AF`)*
**Baseline (8/2/26):** 2-mile ~18:00 (9:00/mi) · fresh full-recovery 400m ~1:56–2:00

*(Pace bands, rep paces, and every other running detail are unchanged from
`training.md` — not repeated here so this file can't drift into being a
second source of truth for the running plan. See `training.md` directly.)*

---

## How the Pushups column works (read this once)

- **Default variant shown below: 4 sets/day, every 3 hours, 10am–7pm**
  (10:00, 13:00, 16:00, 19:00) — the literal reading of "every 3 hours from
  10am until 8pm." Trey's own worked examples showed 6 values per day
  instead, which would mean every 2 hours (10am–8pm) — that reading is
  shipped as an equally-complete alternative in the xlsx's "Daily (6-set)"
  tab, not repeated here to keep this column secondary. ✂️ *Ambiguity not
  resolved by this doc — pick a variant from the xlsx.*
- **Progression:** day 1 of the progression = 15 reps/set flat. Day 2 =
  alternating 15/16. Day 3 = flat 16. Day 4 = alternating 16/17. Day 5 = flat
  17. Continues the same way (flat, then +1 alternating, repeat) across both
  cycles combined — the "day" count in "pushup day N of 10" below is this
  progression index, not the calendar day.
- **A day is blank (—) for one of three reasons**, always stated inline so
  sparseness reads as intentional, never as a missing/broken row:
  - `bench window` — within 1 day before, on, or 2 days after a Lift A
    (bench/chest) day.
  - `back window` — within 1 day before, on, or 1 day after a Lift C
    (back) day.
  - `full rest` — the cycle's full true-rest day. ✂️ **This one is a
    ruling, not directly stated by Trey for pushups** — `cycle.md` calls
    full rest "no running, no lifting, no exceptions," and a pushup set is
    still training, so it's excluded the same way. It's a one-line flag in
    `generate-pushup-plan.mjs` (`EXCLUDE_FULL_REST_DAY`) — flip it and
    re-generate to make these days eligible instead.
  - Speed days are **not** excluded (also a flagged ruling, also a one-line
    flag — `EXCLUDE_SPEED_DAYS`, off by default) — no rule in Trey's spec
    touches them and there's no stated conflict the way there is with
    lifting.
- **Totals**: each eligible row shows `set1,set2,set3,set4 = day total`, and
  the running cumulative total (both cycles combined) sits in the last
  column so the whole plan's volume is readable without adding it up by hand.

---

## Cycle 1 (Aug 2 – Aug 13, 12 days — one-time soft start)

| Day | Date | Session | Workout | Pushups (4-set, secondary) | Cumulative |
|---|---|---|---|---|---|
| D1 | Sun 8/2 | Full rest + **Lift A** (chest/arms) | — | — *(bench window: the day itself)* | 0 |
| D2 | Mon 8/3 | Easy | 2.0 mi @ 11:10/mi (~22:20) | — *(bench window: 1 day after)* | 0 |
| D3 | Tue 8/4 | **Lift B** (legs) | no run | — *(bench window: 2 days after)* | 0 |
| D4 | Wed 8/5 | Easy | 1.5 mi @ 11:10/mi (~16:45) | 15,15,15,15 = **60** *(pushup day 1 of 10)* | 60 |
| D5 | Thu 8/6 | Easy | 1.5 mi @ 11:10/mi (~16:45) | 15,16,15,16 = **62** *(day 2)* | 122 |
| D6 | Fri 8/7 | **Speed 1** | WU 1mi @11:00 + 5x20s strides (walk-back) + 3x400m @2:03 (2:30 jog) + CD 0.5mi (~2.5mi total) + light ab (~5 min, see cycle.md) | 16,16,16,16 = **64** *(day 3)* | 186 |
| D7 | Sat 8/8 | Easy recovery | 1.5 mi @ 11:15/mi (~16:53) | — *(back window: 1 day before)* | 186 |
| D8 | Sun 8/9 | **Lift C** (back) + Easy | 1.5 mi @ 11:10/mi (~16:45) | — *(back window: the day itself)* | 186 |
| D9 | Mon 8/10 | Long run | 3.0 mi @ 10:40/mi (~32:00) | — *(back window: 1 day after)* | 186 |
| D10 | Tue 8/11 | Easy | 1.5 mi @ 11:10/mi (~16:45) | 16,17,16,17 = **66** *(day 4)* | 252 |
| D11 | Wed 8/12 | **Speed 2** | WU 1mi + 4x400m @2:00 (2:30 jog) + CD 0.5mi (~2.5mi total) + light ab (~5 min, see cycle.md) | 17,17,17,17 = **68** *(day 5)* | 320 |
| D12 | Thu 8/13 | Full rest | — | — *(full rest)* | 320 |

**Cycle total: ~17.5 mi running · 320 pushups (4-set variant), 5 of 12 days eligible**

---

## Cycle 2 (Aug 14 – Aug 26, 13 days — standard template)

| Day | Date | Session | Workout | Pushups (4-set, secondary) | Cumulative |
|---|---|---|---|---|---|
| D1 | Fri 8/14 | **Speed 1** + light ab | WU 1mi @11:00 + 5x20s strides (walk-back) + 4x400m @2:00 (2:30 jog) + CD 0.5mi (~2.5mi total) + light ab (~5 min, see cycle.md) | — *(bench window: 1 day before)* | 320 |
| D2 | Sat 8/15 | Easy + **Lift A** (chest/arms) + **Ab Circuit A** | 1.5 mi @ 11:00/mi (~16:30) + ~20 min ab circuit (see cycle.md) | — *(bench window: the day itself)* | 320 |
| D3 | Sun 8/16 | Easy | 1.5 mi @ 11:00/mi (~16:30) | — *(bench window: 1 day after)* | 320 |
| D4 | Mon 8/17 | **Lift B** (legs) | no run | — *(bench window: 2 days after — this is the leg-day slot; see note below)* | 320 |
| D5 | Tue 8/18 | Easy + **Ab Circuit B** | 1.75 mi @ 11:00/mi (~19:15) + ~20 min ab circuit (see cycle.md) | 17,18,17,18 = **70** *(day 6)* | 390 |
| D6 | Wed 8/19 | Easy | 1.75 mi @ 11:00/mi (~19:15) | — *(back window: 1 day before)* | 390 |
| D7 | Thu 8/20 | **Lift C** (back) + Easy | 1.5 mi @ 10:55/mi (~16:23) | — *(back window: the day itself)* | 390 |
| D8 | Fri 8/21 | Easy | 1.5 mi @ 10:55/mi (~16:23) | — *(back window: 1 day after)* | 390 |
| D9 | Sat 8/22 | Easy + **Ab Circuit C** | 1.5 mi @ 10:55/mi (~16:23) + ~20 min ab circuit (see cycle.md) | 18,18,18,18 = **72** *(day 7)* | 462 |
| D10 | Sun 8/23 | **Speed 2** + light ab | WU 1mi + 6x400m @1:55 (2:15 jog) + CD 0.5mi (~3.0mi total) + light ab (~5 min, see cycle.md) | 18,19,18,19 = **74** *(day 8)* | 536 |
| D11 | Mon 8/24 | Easy | 1.5 mi @ 10:50/mi (~16:15) | 19,19,19,19 = **76** *(day 9)* | 612 |
| D12 | Tue 8/25 | Long run + **Ab Circuit A** | 3.5 mi @ 10:20/mi (~36:10) + ~20 min ab circuit, post-run (see cycle.md) | 19,20,19,20 = **78** *(day 10 of 10)* | 690 |
| D13 | Wed 8/26 | Full rest | — (no ab work — full rest is exception-free, see cycle.md rule 13) | — *(full rest)* | 690 |

**Cycle total: ~21.7 mi running · 370 pushups (4-set variant), 5 of 13 days eligible**

**Both cycles combined: 690 pushups (4-set variant) · 1035 pushups (6-set
variant, see the xlsx) · 10 of 25 calendar days eligible.**

**Leg-day note (Cycle 2 D4, and Cycle 1 D3):** leg day (Lift B) has its own
rule — pushups allowed, but the last set must land by 4pm so nothing sits
within 3 hours of a 7pm leg workout. In both cycles as currently scheduled,
leg day always falls inside the bench 2-days-after window anyway, so it's
already excluded outright before the leg-specific rule would ever matter —
implemented generically in the generator (and it *would* fire if the
schedule ever moves leg day outside that window), but it's dormant today.
✂️ Flagging this rather than silently dropping it, per the leg-day rule
Trey specified.

---

Cycle 3 Day 1 = **Thu 8/27** → real Checkpoint Test 1, target 17:00.
Recalculate all paces off that actual result before building Cycle 3's
numbers — same as `training.md`. The pushup progression (day 11 of the
progression = flat 20) continues forward from Cycle 2's last eligible day
whenever Cycle 3's own eligible days are worked out; not built yet since
Cycle 3's running schedule itself isn't built yet.
