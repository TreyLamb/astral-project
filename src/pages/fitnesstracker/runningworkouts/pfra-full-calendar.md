# PFRA 2-Mile Plan — Calendar (Date + Cycle Day)

**How this file works now:** every row shows the actual **date** and the **cycle day** it falls on. Cycles are built and added here one at a time as they actually happen — not pre-projected 14 cycles out — because cycle length and paces both just changed (11-day → 13-day cycle, ~20:00 → ~18:00 baseline) and a long-range table would go stale immediately. See `pfra-2mile-training-plan.md` for the phase/checkpoint framework and `cycle.md` for the generic structure each cycle below is built from.

Fixes from the previous version of this file: the duplicate "Lift A" bug (Day 2 and Day 7 were both showing Lift A) is corrected — Lift A is chest/arms, Lift B is legs, Lift C is back, and both speed days are present.

---

## Cycle 1 — Phase 1, one-time adjusted start (Aug 2 – Aug 13, 12 days)

**Why this cycle is different:** this is a one-time exception, not the new template. Time-trial testing (Aug 1–2) left you very sore, so Cycle 1 opens with full rest + Lift A instead of a speed day, and a slow recovery run before Leg day instead of going straight into it. From Cycle 2 onward, the standard 13-day `cycle.md` template applies.

| Cycle Day | Date | Session |
|---|---|---|
| D1 | Sun 8/2 | Full rest from running + **Lift A** (chest/arms) — soreness from time trials |
| D2 | Mon 8/3 | Easy run, slow (recovery) |
| D3 | Tue 8/4 | **Lift B** (legs) |
| D4 | Wed 8/5 | Easy run |
| D5 | Thu 8/6 | Easy run |
| D6 | Fri 8/7 | **Speed Day 1** — strides + relaxed ~2:00 400s, full recovery + light ab (~5 min, see cycle.md) |
| D7 | Sat 8/8 | Easy recovery run |
| D8 | Sun 8/9 | **Lift C** (back) + easy run |
| D9 | Mon 8/10 | Long run |
| D10 | Tue 8/11 | Easy run |
| D11 | Wed 8/12 | **Speed Day 2** — strides + relaxed ~2:00 400s, full recovery + light ab (~5 min, see cycle.md) |
| D12 | Thu 8/13 | Full true rest |

**Known deviation:** Back day (D8) sits only 2 days from Speed 1 (D6), not the standard 3 — accepted for this cycle only to avoid stretching the soft-start even longer. Every other spacing rule holds (Leg↔Back 5 days, Leg↔either speed ≥3, long run has a clear buffer before Speed 2).

Paces this cycle: easy ~10:45–11:15/mi by feel, HR controlled. No formal threshold. Speed days are light — strides and relaxed 400s around 2:00, not max effort.

**Ab/core:** Cycle 1 is soft-start throughout, so it gets the *light* ab add-on on both speed days only — no robust 20-min circuit yet. That starts Cycle 2 (`cycle.md` rule 13), once the standard template is running at full intensity. See `training-context.md` for the full reasoning.

---

## Cycle 2 — Phase 1 (Aug 14 – Aug 26, 13 days)

Standard `cycle.md` template, first full application of it.

| Cycle Day | Date | Session |
|---|---|---|
| D1 | Fri 8/14 | **Speed Day 1** (classic) — strides + 400s, full recovery + light ab (~5 min, see cycle.md) |
| D2 | Sat 8/15 | Easy run + **Lift A** (chest/arms) + **Ab Circuit A** (~20 min) |
| D3 | Sun 8/16 | Easy run |
| D4 | Mon 8/17 | **Lift B** (legs) — no run |
| D5 | Tue 8/18 | Easy run + **Ab Circuit B** (~20 min) |
| D6 | Wed 8/19 | Easy run |
| D7 | Thu 8/20 | **Lift C** (back) + easy run |
| D8 | Fri 8/21 | Easy run |
| D9 | Sat 8/22 | Easy run + **Ab Circuit C** (~20 min) |
| D10 | Sun 8/23 | **Speed Day 2** (classic) + light ab (~5 min) |
| D11 | Mon 8/24 | Easy run |
| D12 | Tue 8/25 | Long run + **Ab Circuit A** (~20 min, post-run) |
| D13 | Wed 8/26 | Full true rest — no ab work, no exceptions |

Paces: easy ~10:45–11:15/mi. Both speed days are strides + relaxed 400s (~2:00, full recovery) — still Phase 1, no formal threshold yet. Ab/Core Circuit (rule 13) starts this cycle, rotating A→B→C→A on Days 2/5/9/12, plus the light add-on on both speed days. Long run distance: modest step up from Cycle 1, stay conservative given the soft start (roughly 3–3.5 mi range, adjust by feel).

**Correction (2026-08-17):** D1 originally carried the Speed Day 1 sled/carry hybrid (`cycle.md` rule 12). That session trained the ACFT's Sprint-Drag-Carry; with the switch to the USAF PFRA it has no event to train and was retired. D1 is a classic speed day.

**Correction (2026-08-04):** D11 previously carried a second Lift A (chest/arms) session. Trey ruled: one lift session per muscle group per cycle only — one chest, one legs, one back — the A/B/C letters are labels, not a count. D11 is now plain easy run. See `cycle.md` rule 1 and `training-context.md` for the full reasoning.

Cycle 3 Day 1 lands **Thu 8/27**.

---

## What's next

- **Long-range view:** `cycleProjection.md` now projects every cycle out to end-2027 in both a 13-day and an 11-day variant, with dates, phases, checkpoints and interpolated pace targets. This file stays the record of what was *actually* built and run, one cycle at a time; that one is the forecast. **Note its headline finding:** at 13 days only 11 cycles fit before the Dec 31 test, so Checkpoint Test 4 never happens.
- **Checkpoint Test 1** lands roughly in Cycle 3 (deload cycle), which starts ~Aug 27 — exact placement and the real target pace will be confirmed when Cycle 3 is built.
- Cycles 3+ get added here the same way, one at a time, using whatever `cycle.md` says at that point (length may compress from 13 days once recovery capacity allows) and whatever the latest checkpoint-test result says for pace.
- If a cycle's mileage or a session gets missed, resume at the current day — don't try to make up missed volume.
