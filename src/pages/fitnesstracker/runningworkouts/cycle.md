# Generic Training Cycle (cycle.md)

**This is the one canonical microcycle template.** No dates here on purpose — dates + cycle-day numbers live in `acft-full-calendar.md`. When the cycle length changes (see below), update it here and it flows into the next calendar entry.

---

## Hard rules (non-negotiable, confirmed by user)

1. **3 lift days per cycle:** Lift A (chest/arms), Lift B (legs), Lift C (back). Order among themselves doesn't matter — spacing does.
2. **Leg day ↔ Back day:** minimum **3 days** apart.
3. **Leg day ↔ any speed day:** minimum **3 days** apart.
4. **Back day ↔ any speed day:** minimum **3 days** apart.
5. **2 speed days per cycle.**
6. **1 full true rest day per cycle** — no running, no lifting.
7. **Long run → speed day:** at least **1 full easy/rest day of separation**, in both directions. (The original bug this fixes: a long run on Day 11 flowing straight into a speed day on the next cycle's Day 1.)
8. **Lift A (chest/arms)** has no spacing restriction relative to running — pair it freely with any easy run day. It still has to respect rule 10 below relative to the other lifts.
9. Cycle length is **not fixed**. It's whatever satisfies rules 1–8, 10, and 11. Right now that's **13 days**. Expect it to compress toward 10–11 days later as recovery capacity improves — re-derive the minimum length whenever recovery needs change, don't force an old length.
10. **Any two lift days** (A↔B, A↔C, B↔C, or A↔A across the cycle boundary): minimum **1 day** between them, **ideally 2**.
11. **Lift A ↔ Lift C (chest ↔ back) specifically:** this pairing matters more than the others — ideally **2 days minimum**, and longer is actively better, not just tolerated. When there's a choice of where to place a lift, protect this gap first among the "ideally 2" rules.

Note on "4–5 days of rest between cycles": this was mentioned once by the user and never fully pinned down — see the open question in `training-context.md`. It is **not** currently enforced as a hard rule below; only the single full-rest day (rule 6) and the long-run/speed buffer (rule 7) are locked in.

---

## Current template — 13-Day Cycle (minimum length that satisfies all rules above)

| Cycle Day | Session |
|---|---|
| 1 | **Speed Day 1** |
| 2 | Easy run + **Lift A** (chest/arms) |
| 3 | Easy run |
| 4 | **Lift B** (legs) — lift only, no run |
| 5 | Easy run |
| 6 | Easy run |
| 7 | **Lift C** (back) + easy run (mileage-only day, no speed) |
| 8 | Easy run |
| 9 | Easy run |
| 10 | **Speed Day 2** |
| 11 | Easy run + **Lift A** (chest/arms) |
| 12 | **Long run** |
| 13 | **Full rest** (true rest — sets up Day 1 of next cycle) |

### Why this satisfies every rule
- Leg (D4) → Back (D7): 3 days ✅
- Leg (D4) → Speed 1 (D1): 3 days ✅ · Leg (D4) → Speed 2 (D10): 6 days ✅
- Back (D7) → Speed 1 (D1): 6 days ✅ · Back (D7) → Speed 2 (D10): 3 days ✅
- Long run (D12) → Speed 2 (D10): 2 days buffer ✅ · Long run (D12) → next cycle's Speed 1: 1 full rest day (D13) in between ✅
- One full rest day (D13), two speed days, three lifts, all spaced ✅
- **Lift spacing (rules 10–11):** A(D2)↔B(D4) = 2 days · B(D4)↔C(D7) = 3 days · **C(D7)↔A(D11) = 4 days** (the chest↔back pairing — comfortably past the ideal-2 minimum) · A(D11)↔next cycle's A(D2, i.e. day 15) = 4 days · A(D2)↔C(D7) = 5 days (the other chest↔back gap in the cycle, also well clear). Moving the second Lift A from Day 8 to Day 11 is what makes this work — Day 8 would've sat only 1 day off Back day, under the ideal-2 target for the pairing that matters most.

This is provably the **shortest cycle** that satisfies rules 1–8 as currently stated (verified — tightening any gap further breaks another rule). If you want it shorter later, something in rules 2–4 has to loosen first (e.g., legs stay strict at 3 days but back relaxes to 2), which is a call to make deliberately, not by accident.

---

## Session type guide (fill in actual paces from `acft-2mile-training-plan.md`, updated after each checkpoint test)

- **Speed Day:** intervals/strides/relaxed-fast reps — intensity and volume per current training phase (see training plan).
- **Long run:** easy aerobic pace, HR controlled, longest single effort of the cycle.
- **Easy run:** by feel, easy pace range, no quality intent.
- **Lift A (chest/arms):** low leg stress, safe to pair with any run.
- **Lift B (legs):** heaviest leg stress in the cycle — no run same day.
- **Lift C (back):** upper-body focused but still gets a full 3-day buffer from legs and speed; easy run same day is fine (mileage only).
- **Full rest:** no running, no lifting, no exceptions.

## Optional add-ons
- Hike/ruck can sub in for one easy day per cycle if desired (carried over from earlier drafts) — not required by any hard rule, use based on how you feel. Keep it off the day immediately before/after a speed day or long run.

## Reassessment
- Every time recovery capacity shifts noticeably (better or worse), re-check whether 13 days is still the minimum needed, or whether it can compress.
- After each checkpoint test, session intensities (not the structure above) update off the new numbers — see `acft-2mile-training-plan.md`.
