# Cycle Projection — through end of 2027

**What this is:** the full cycle calendar projected forward, in **two variants** — the current 13-day cycle, and the 11-day cycle Trey wants to move to around Cycle 3 — so the trade between them is visible in numbers rather than argued in the abstract.

**This doc does not change anything.** `cycle.md` still holds the canonical 13-day template, and `training-context.md`'s standing instruction ("do not compress the cycle — the cycle shortens only after Trey relaxes the spacing gaps") still stands. Section 3 below lists exactly which gaps he'd be relaxing. Nothing moves to 11 days until he says so.

Fixed inputs, taken as fact from the live docs and not re-derived here: Cycle 1 = Aug 2–13 (12 days, soft start), Cycle 2 = Aug 14–26 (13 days), **Cycle 3 Day 1 = Thu Aug 27, 2026**, test day = **Dec 31, 2026**, baseline = ~18:00, goal = 13:56 (stretch 13:40).

---

## 1. The headline — the 14-cycle plan does not fit the test date

`pfra-2mile-training-plan.md` lays out **14 cycles**, with checkpoint tests at cycles 3, 6, 9, and 12, and Cycle 14 tapering into test day. That framework was written when the cycle was 11 days (the doc says so: *"cycle numbers below are approximate now that cycle length has moved from 11 to 13 days"*). Nobody re-checked the arithmetic after the move to 13.

There are **127 days** from Cycle 3 Day 1 (Aug 27) to test day (Dec 31).

| | 13-day cycle | 11-day cycle | To fit all 14 cycles |
|---|---|---|---|
| Cycles that fit after C2 | 9.8 → **9** | 11.5 → **11** | 12 |
| **Total cycles before test day** | **11** | **13** | 14 |
| Last full cycle ends | Dec 21 | Dec 25 | Dec 31 |
| Days left over for a taper | 10 | 6 | 0 |
| Checkpoint tests that happen | **3** (C3, C6, C9) | **4** (C3, C6, C9, C12) | 4 |
| Required cycle length | — | — | **10.6 days** |

**So at 13 days you lose Checkpoint Test 4 entirely**, and Phase 3 (race specificity) gets two cycles instead of four. At 11 days all four checkpoints happen and Phase 3 gets three cycles. That is the single biggest concrete difference between the two, and it is not a small one — Checkpoint 4 is the last real read you get before test day.

---

## 2. Does the checkpoint schedule still line up with the pace chart?

The pace chart in `pfra-2mile-training-plan.md` is keyed to **weeks** (checkpoints at ~wk 5, 9, 14, 19; goal at wk 22), not cycles. So the question is whether the cycles land on those weeks. This is where the two variants separate sharply:

| Chart says | 13-day cycle lands | 11-day cycle lands |
|---|---|---|
| Checkpoint 1 — wk 5 | C3, **wk 4** (−1) | C3, **wk 4** (−1) |
| Checkpoint 2 — wk 9 | C6, **wk 10** (+1) | C6, **wk 9** ✅ exact |
| Checkpoint 3 — wk 14 | C9, **wk 15** (+1) | C9, **wk 14** ✅ exact |
| Checkpoint 4 — wk 19 | **never happens** | C12, **wk 18** (−1) |

The 11-day cycle reproduces the chart's checkpoint schedule almost exactly. That isn't a coincidence — the chart was built when the cycle was 11 days. **The plan's own testing cadence only works at 11 days.**

---

## 3. What an 11-day cycle actually costs — the two gaps that have to give

`cycle.md`'s cycle-length proof is a chain of five gaps:

> Speed 1 → *(g1)* → Legs → *(g2)* → Back → *(g3)* → Speed 2 → *(g4)* → Long run → *(g5)* → next Speed 1

Current minimums: g1, g2, g3 ≥ **3 days** (rules 3, 2, 4); g4, g5 ≥ **2 days** (rule 7). That sums to 3+3+3+2+2 = **13**, which is where the current floor comes from.

To reach 11, **two days must come out of g1/g2/g3** — g4 and g5 are already at rule 7's floor and should not move (that rule exists to fix a specific bug from the old calendar). I enumerated every valid arrangement:

- **No single-gap option is acceptable.** Taking both days from one gap collapses it 3 → 1, putting a lift and a speed day almost back to back. Two gaps at 2 days each spreads the same cost far better.
- Of the three two-gap options, one stands out: **relax Legs↔Back and Back↔Speed 2, and leave Speed 1 → Legs at the full 3 days.**

**⚠️ Updated 2026-08-17 — the original argument for that last part no longer applies.** This section used to lean on a `cycle.md` caveat that the D1→D4 gap "was sized for the original plain speed day, not a loaded hybrid," on the grounds that Speed Day 1's sled/carry hybrid loaded quads/glutes/hamstrings straight into leg day. **The hybrid was retired with the switch to the USAF PFRA, so Speed Day 1 is a plain speed day again and that gap is correctly sized by definition** — it is no longer flagged as possibly-too-short.

The recommendation is unchanged, but for a weaker and more honest reason: Speed 1 → Legs is a *running*-to-legs gap, the only one of the three where the same muscle groups are loaded twice, so it remains the least attractive place to spend a day. That is a preference now, not a flagged risk. Either way, rule 9's standing instruction still governs — the cycle shortens only when **Trey** relaxes the gaps, never as a derivation.

### Proposed 11-day template

| Cycle Day | Session | Change from the 13-day template |
|---|---|---|
| 1 | **Speed Day 1** (classic) | — |
| 2 | Easy run + **Lift A** (chest/arms) | — |
| 3 | Easy run | — |
| 4 | **Lift B** (legs) — no run | — |
| 5 | Easy run | — |
| 6 | **Lift C** (back) + easy run | was D7 — **1 day earlier** |
| 7 | Easy run | — |
| 8 | **Speed Day 2** (classic) | was D10 — **2 days earlier** |
| 9 | Easy run | — |
| 10 | **Long run** | was D12 |
| 11 | **Full rest** | was D13 |

**Every rule re-checked against this layout:**

| Rule | 13-day | 11-day | |
|---|---|---|---|
| 2 · Legs ↔ Back ≥3 | 3 | **2** | ⚠️ relaxed |
| 3 · Legs ↔ Speed 1 ≥3 | 3 | 3 | ✅ |
| 3 · Legs ↔ Speed 2 ≥3 | 6 | 4 | ✅ |
| 4 · Back ↔ Speed 2 ≥3 | 3 | **2** | ⚠️ relaxed |
| 4 · Back ↔ Speed 1 ≥3 | 6 | 5 (and 6 to next) | ✅ |
| 7 · Long run ↔ nearest speed ≥1 full day | 2 / 2 | 2 / 2 | ✅ |
| 1 · one chest, one legs, one back | ✓ | ✓ | ✅ |
| 5 · 2 speed days | ✓ | ✓ | ✅ |
| 6 · 1 full rest day | D13 | D11 | ✅ |
| 10 · any two lifts ≥1, ideally 2 | A↔B 2, B↔C 3 | A↔B 2, B↔C 2 | ✅ |
| 11 · Lift A ↔ Lift C, ideally ≥2 | 5 | 4 | ✅ |

**Exactly two relaxations, both from 3 days to 2, both touching back day.** Back day ends up with 2 days of buffer on each side instead of 3 — it becomes the most-squeezed session in the cycle. That's the honest cost, and it's the thing to watch if the change is made.

### ✂️ Unresolved consequence: the ab/core circuit cadence breaks

Rule 13 wants **4 circuits per cycle, roughly every 3 days**, never the day before a lift, never the day after back, never on the full-rest day. Applying those same exclusions to the 11-day layout leaves only D2, D4, D9, D10 eligible — gaps of 2 / 5 / 1 / 3. There is no clean ~3-day cadence available in 11 days.

Two options, neither free — **this one needs Trey's call, I'm not picking it silently:**

- **(a) Three circuits on D2, D4, D9** — respects every stated exclusion, but gaps become 2 / 5 / 4.
- **(b) Three circuits on D2, D6, D10** — clean 4 / 4 / 3 cadence, but D6 is back day, which `cycle.md` deliberately skips because back accessory work already loads the core hard.

I'd take **(a)**: it keeps a rule the docs reasoned through carefully, and uneven ab spacing is a much smaller problem than double-loading the trunk on back day. Either way, **4 circuits per cycle drops to 3** at 11 days.

---

## 4. Projection — 13-day cycle (current template)

2-mile targets are the `pfra-2mile-training-plan.md` chart interpolated by **week**, since adaptation tracks calendar time rather than cycle count. Long-run and cycle-mileage columns are projections, not prescriptions — see the note under section 6.

| Cycle | Dates | Days | Wk | Phase | Checkpoint | 2-mi target | /mi | /400m | Long run | Cycle mi |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sun 8/2 – 8/13 | 12 | 1 | P1 Base |  | 18:00 | 9:00 | 2:15 | 3.0 | 18 |
| 2 | Fri 8/14 – 8/26 | 13 | 2 | P1 Base |  | 17:45 | 8:52 | 2:13 | 3.5 | 22 |
| 3 | Thu 8/27 – 9/8 | 13 | 4 | P1 Base | **TEST 1** | 17:15 | 8:38 | 2:09 | 3.0 | 19 |
| 4 | Wed 9/9 – 9/21 | 13 | 6 | P1 Base |  | 16:48 | 8:24 | 2:06 | 4.0 | 25 |
| 5 | Tue 9/22 – 10/4 | 13 | 8 | P1 Base |  | 16:22 | 8:11 | 2:03 | 4.5 | 27 |
| 6 | Mon 10/5 – 10/17 | 13 | 10 | P2 Threshold | **TEST 2** | 16:00 | 8:00 | 2:00 | 4.0 | 24 |
| 7 | Sun 10/18 – 10/30 | 13 | 12 | P2 Threshold |  | 15:40 | 7:50 | 1:58 | 5.0 | 32 |
| 8 | Sat 10/31 – 11/12 | 13 | 13 | P2 Threshold |  | 15:30 | 7:45 | 1:56 | 5.5 | 34 |
| 9 | Fri 11/13 – 11/25 | 13 | 15 | P2 Threshold | **TEST 3** | 15:10 | 7:35 | 1:54 | 4.5 | 30 |
| 10 | Thu 11/26 – 12/8 | 13 | 17 | P3 Specificity |  | 14:50 | 7:25 | 1:51 | 6.0 | 40 |
| 11 | Wed 12/9 – 12/21 | 13 | 19 | P3 Specificity |  | 14:30 | 7:15 | 1:49 | 4.0 | 26 |
| — | **Tue 12/22 – Thu 12/31** | **10** | 21 | **Taper** | **GOAL TEST 12/31** | **13:56** | **6:58** | **1:44** | — | ~12 |

A 10-day taper is longer than a 2-mile race needs (5–7 days is typical). The extra days are dead calendar — not harmful, but not productive either.

## 5. Projection — 11-day cycle (from Cycle 3)

| Cycle | Dates | Days | Wk | Phase | Checkpoint | 2-mi target | /mi | /400m | Long run | Cycle mi |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Sun 8/2 – 8/13 | 12 | 1 | P1 Base |  | 18:00 | 9:00 | 2:15 | 3.0 | 18 |
| 2 | Fri 8/14 – 8/26 | 13 | 2 | P1 Base |  | 17:45 | 8:52 | 2:13 | 3.5 | 22 |
| 3 | Thu 8/27 – 9/6 | 11 | 4 | P1 Base | **TEST 1** | 17:15 | 8:38 | 2:09 | 3.0 | 16 |
| 4 | Mon 9/7 – 9/17 | 11 | 6 | P1 Base |  | 16:48 | 8:24 | 2:06 | 4.0 | 21 |
| 5 | Fri 9/18 – 9/28 | 11 | 7 | P1 Base |  | 16:35 | 8:18 | 2:04 | 4.0 | 23 |
| 6 | Tue 9/29 – 10/9 | 11 | 9 | P2 Threshold | **TEST 2** | 16:10 | 8:05 | 2:01 | 4.0 | 20 |
| 7 | Sat 10/10 – 10/20 | 11 | 10 | P2 Threshold |  | 16:00 | 8:00 | 2:00 | 5.0 | 27 |
| 8 | Wed 10/21 – 10/31 | 11 | 12 | P2 Threshold |  | 15:40 | 7:50 | 1:58 | 5.0 | 29 |
| 9 | Sun 11/1 – 11/11 | 11 | 14 | P2 Threshold | **TEST 3** | 15:20 | 7:40 | 1:55 | 4.5 | 25 |
| 10 | Thu 11/12 – 11/22 | 11 | 15 | P2 Threshold |  | 15:10 | 7:35 | 1:54 | 6.0 | 34 |
| 11 | Mon 11/23 – 12/3 | 11 | 17 | P3 Specificity |  | 14:50 | 7:25 | 1:51 | 6.0 | 37 |
| 12 | Fri 12/4 – 12/14 | 11 | 18 | P3 Specificity | **TEST 4** | 14:40 | 7:20 | 1:50 | 5.0 | 32 |
| 13 | Tue 12/15 – 12/25 | 11 | 20 | P3 Specificity |  | 14:20 | 7:10 | 1:48 | 4.0 | 26 |
| — | **Sat 12/26 – Thu 12/31** | **6** | 21 | **Taper** | **GOAL TEST 12/31** | **13:56** | **6:58** | **1:44** | — | ~8 |

A 6-day taper is close to textbook for a 2-mile.

### How much more aggressive is it, really?

The calendar window is identical, so the *required rate of improvement per week is exactly the same* in both — 18:00 → 13:56 in 21 weeks either way. What changes is **training density**:

| Between Aug 27 and Dec 31 | 13-day | 11-day | Difference |
|---|---|---|---|
| Cycles | 9 | 11 | +2 |
| Speed days | 18 | 22 | **+4** |
| Long runs | 9 | 11 | **+2** |
| Lift sessions | 27 | 33 | +6 |
| Checkpoint tests | 3 | 4 | +1 |
| Full rest days | 9 | 11 | +2 |
| Quality runs per 30 days | 6.9 | 8.2 | **+18%** |

Everything scales by the same factor, because that's all a shorter cycle is: **13 ÷ 11 = +18.2%** of every session type per unit of calendar time.

So it isn't "the paces get faster" — the required improvement per week is identical. It's **~18% more hard sessions in the same four months**, with two of the recovery gaps around back day cut from 3 days to 2. Note the rest days actually go *up* (more cycles = more rest days); what tightens is the spacing *between* hard sessions.

---

## 6. Are the targets realistic? — my assessment, not doctrine

`training-context.md` already calls the goal *"a real stretch (~4 min improvement, almost all aerobic)."* Putting numbers on that (the goal moved 14:00 → 13:56 on 2026-08-17 with the PFRA switch; 4 seconds is well inside the noise of everything below, so the analysis stands as written):

- 18:00 for 2 miles ≈ **VDOT 32**; 13:56 ≈ **VDOT 44**. (Daniels 5K equivalents scaled to 3218 m with Riegel's 1.06 exponent.) A **12-point** VDOT gain in five months would be exceptional by any standard — typical for a returning runner is 5–8.
- **But the 18:00 baseline is not a fair number.** It was set in **91°F heat at ~4,575 ft**; together those realistically cost 5–8%. A cool-weather equivalent is more like **17:00 (VDOT ~35)**, and test day in Utah in late December will be cold. That reframes the ask as a **~9-point** gain — still big, no longer extraordinary.
- Two things push in his favour: a genuine **30–35 mi/week history** (returning runners regain fitness far faster than novices build it), and a limiter that is **aerobic, not speed** — the most trainable quality there is, and already confirmed by the time-trial data (fresh 400 at 1:56 vs 1:45 goal pace).

**Honest landing zone: 14:15–15:15.** 13:56 is reachable if the aerobic response is good and nothing gets derailed; 13:40 needs an exceptional response. The plan is not fantasy, but the chart's straight march to 13:56 should be treated as the optimistic edge of the range, not the expectation.

The single highest-leverage thing in the whole plan remains the one `pfra-2mile-training-plan.md` already flags: **keep easy runs genuinely easy (10:45–11:15/mi).** Easy-pace creep is the most common way this kind of block underdelivers, and the 185 avg / 197 peak HR reading is exactly the profile of someone whose easy pace has been running too hot.

**On the projected columns:** long-run and cycle-mileage figures ramp ~8% per non-deload cycle from Cycle 2's actual 21.7 mi, with deload cycles at −20%, capped at ~4.2 mi/day. Cycle 1 and 2 values are the real ones from `training.md`. Everything from Cycle 3 on is a projection to sanity-check the shape of the ramp — **replace it with real numbers as each cycle is built**, exactly as `pfra-full-calendar.md` already instructs.

---

## 7. 2027 — structure only

The goal test is **Dec 31, 2026**. Nothing in the doc set defines what happens after it, so the tables below are **cycle dates only** — no paces, no volumes. Checkpoint cycles are still marked every 3rd cycle, since that cadence is structural.

⚠️ **Before any of 2027 becomes a real plan, the objective needs stating.** Plausible directions, none of them assumed here:
1. **Hold and sharpen** — maintain 13:56, chase the 13:40 stretch on a re-test. Note the PFRA is taken **twice a year**, so a second 2026-cycle test is structural, not optional — this is the likeliest direction by default.
2. **Chase the non-run components** — under the PFRA the run is 50 of 100 points; push-ups (15), core (15) and waist-to-height ratio (20) are the other half, and none are trained here. *(Replaces the old "Full ACFT" item — the ✂️ flag asking whether the full 6-event ACFT was in scope is closed as moot, there is no ACFT in this plan. See `training-context.md`.)*
3. **Longer race distance** — a 5K/10K goal reuses the aerobic base directly and would restructure phases entirely.

### 2027 cycle dates — 13-day variant (cycles 13–40)

| Cycle | Dates | Days | Checkpoint |
|---|---|---|---|
| 13 | Mon 1/4/27 – 1/16/27 | 13 |  |
| 14 | Sun 1/17/27 – 1/29/27 | 13 |  |
| 15 | Sat 1/30/27 – 2/11/27 | 13 | TEST |
| 16 | Fri 2/12/27 – 2/24/27 | 13 |  |
| 17 | Thu 2/25/27 – 3/9/27 | 13 |  |
| 18 | Wed 3/10/27 – 3/22/27 | 13 | TEST |
| 19 | Tue 3/23/27 – 4/4/27 | 13 |  |
| 20 | Mon 4/5/27 – 4/17/27 | 13 |  |
| 21 | Sun 4/18/27 – 4/30/27 | 13 | TEST |
| 22 | Sat 5/1/27 – 5/13/27 | 13 |  |
| 23 | Fri 5/14/27 – 5/26/27 | 13 |  |
| 24 | Thu 5/27/27 – 6/8/27 | 13 | TEST |
| 25 | Wed 6/9/27 – 6/21/27 | 13 |  |
| 26 | Tue 6/22/27 – 7/4/27 | 13 |  |
| 27 | Mon 7/5/27 – 7/17/27 | 13 | TEST |
| 28 | Sun 7/18/27 – 7/30/27 | 13 |  |
| 29 | Sat 7/31/27 – 8/12/27 | 13 |  |
| 30 | Fri 8/13/27 – 8/25/27 | 13 | TEST |
| 31 | Thu 8/26/27 – 9/7/27 | 13 |  |
| 32 | Wed 9/8/27 – 9/20/27 | 13 |  |
| 33 | Tue 9/21/27 – 10/3/27 | 13 | TEST |
| 34 | Mon 10/4/27 – 10/16/27 | 13 |  |
| 35 | Sun 10/17/27 – 10/29/27 | 13 |  |
| 36 | Sat 10/30/27 – 11/11/27 | 13 | TEST |
| 37 | Fri 11/12/27 – 11/24/27 | 13 |  |
| 38 | Thu 11/25/27 – 12/7/27 | 13 |  |
| 39 | Wed 12/8/27 – 12/20/27 | 13 | TEST |
| 40 | Tue 12/21/27 – 1/2/28 | 13 |  |


### 2027 cycle dates — 11-day variant (cycles 15–47)

*Cycle 14 runs Sat 12/26/26 – Tue 1/5/27, straddling the test date — it is the taper block in section 5 and continues into January.*

| Cycle | Dates | Days | Checkpoint |
|---|---|---|---|
| 15 | Wed 1/6/27 – 1/16/27 | 11 | TEST |
| 16 | Sun 1/17/27 – 1/27/27 | 11 |  |
| 17 | Thu 1/28/27 – 2/7/27 | 11 |  |
| 18 | Mon 2/8/27 – 2/18/27 | 11 | TEST |
| 19 | Fri 2/19/27 – 3/1/27 | 11 |  |
| 20 | Tue 3/2/27 – 3/12/27 | 11 |  |
| 21 | Sat 3/13/27 – 3/23/27 | 11 | TEST |
| 22 | Wed 3/24/27 – 4/3/27 | 11 |  |
| 23 | Sun 4/4/27 – 4/14/27 | 11 |  |
| 24 | Thu 4/15/27 – 4/25/27 | 11 | TEST |
| 25 | Mon 4/26/27 – 5/6/27 | 11 |  |
| 26 | Fri 5/7/27 – 5/17/27 | 11 |  |
| 27 | Tue 5/18/27 – 5/28/27 | 11 | TEST |
| 28 | Sat 5/29/27 – 6/8/27 | 11 |  |
| 29 | Wed 6/9/27 – 6/19/27 | 11 |  |
| 30 | Sun 6/20/27 – 6/30/27 | 11 | TEST |
| 31 | Thu 7/1/27 – 7/11/27 | 11 |  |
| 32 | Mon 7/12/27 – 7/22/27 | 11 |  |
| 33 | Fri 7/23/27 – 8/2/27 | 11 | TEST |
| 34 | Tue 8/3/27 – 8/13/27 | 11 |  |
| 35 | Sat 8/14/27 – 8/24/27 | 11 |  |
| 36 | Wed 8/25/27 – 9/4/27 | 11 | TEST |
| 37 | Sun 9/5/27 – 9/15/27 | 11 |  |
| 38 | Thu 9/16/27 – 9/26/27 | 11 |  |
| 39 | Mon 9/27/27 – 10/7/27 | 11 | TEST |
| 40 | Fri 10/8/27 – 10/18/27 | 11 |  |
| 41 | Tue 10/19/27 – 10/29/27 | 11 |  |
| 42 | Sat 10/30/27 – 11/9/27 | 11 | TEST |
| 43 | Wed 11/10/27 – 11/20/27 | 11 |  |
| 44 | Sun 11/21/27 – 12/1/27 | 11 |  |
| 45 | Thu 12/2/27 – 12/12/27 | 11 | TEST |
| 46 | Mon 12/13/27 – 12/23/27 | 11 |  |
| 47 | Fri 12/24/27 – 1/3/28 | 11 |  |


---

## 8. Recommendation, and what changes if it's taken

**Go to 11 days at Cycle 3** — but for the checkpoint schedule, not the extra volume. The deciding argument isn't "more training": it's that the plan's own four-checkpoint testing cadence, and the pace chart built around it, **only function at 11 days**. At 13 you fly the last six weeks before test day without a checkpoint read, which is precisely when you most need one to set race-pace work.

The volume increase (+21% hard sessions) is real and is the risk. Mitigations already available in the docs: the deload every 3rd cycle still applies, the guardrail *"deload/checkpoint week shows no improvement or feels worse → extend the phase rather than force the calendar"* still applies, and back day is the specific thing to watch since it's the session losing buffer on both sides.

**A middle option if 11 feels like too much at once:** run **Cycle 3 at 12 days** (relax one gap, keep one at 3), see how back day recovers across a full cycle, then decide on 11 for Cycle 4. Costs one cycle of the schedule and buys a real data point instead of a guess.

**If 11 days is adopted, these need updating — none of it has been done here:**
1. `cycle.md` — rule 2 and rule 4 change from 3 days to 2; rule 9's current-length statement; the cycle-length proof; the 13-day template table; rule 13's ab cadence (4 → 3 circuits, placement per section 3).
2. `training-context.md` — rules 2, 4, 9; a new dated decision entry recording that Trey relaxed the gaps and why (that record is what the standing "do not compress" instruction is protecting).
3. `pfra-2mile-training-plan.md` — the 14-cycle progression table becomes 13 cycles + taper; the phase-to-cycle mapping.
4. `pfra-full-calendar.md` — Cycle 3 onward built on the 11-day template.
5. The pace chart's "Wk 22 / Goal" column lands at the **taper block**, not a numbered cycle, in both variants.
