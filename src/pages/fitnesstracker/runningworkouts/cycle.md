# Generic Training Cycle (cycle.md)

**This is the one canonical microcycle template.** No dates here on purpose — dates + cycle-day numbers live in `pfra-full-calendar.md`. When the cycle length changes (see below), update it here and it flows into the next calendar entry.

---

## Hard rules (non-negotiable, confirmed by user)

1. **3 lift SESSIONS per cycle, full stop — one chest, one legs, one back.** (Corrected 2026-08-04 — see `training-context.md` decision log. Previously ambiguous wording let a second Lift A/chest session get added at Day 11; Trey's explicit ruling: "The hard rule is only one lift A per cycle. One lift B, one lift C, per cycle... there's only one chest, leg, back workout per cycle, regardless of which LIFT 'x' letter they are assigned.") The **A/B/C letters are just labels** for which muscle group is which (A=chest/arms, B=legs, C=back) — the letter assignment is not itself a rule, the "one session per muscle group" count is. Order among the three doesn't matter — spacing does.
2. **Leg day ↔ Back day:** minimum **3 days** apart.
3. **Leg day ↔ any speed day:** minimum **3 days** apart.
4. **Back day ↔ any speed day:** minimum **3 days** apart.
5. **2 speed days per cycle.**
6. **1 full true rest day per cycle** — no running, no lifting.
7. **Long run → speed day:** at least **1 full easy/rest day of separation**, in both directions. (The original bug this fixes: a long run on Day 11 flowing straight into a speed day on the next cycle's Day 1.)
8. **Lift A (chest/arms)** has no spacing restriction relative to running — pair it freely with any easy run day. It still has to respect rule 10 below relative to the other lifts.
9. Cycle length is **not fixed, and it is ultimately a RECOVERY decision, not a math result** (clarified by Trey 2026-08-04 — see `training-context.md` decision log). The causal chain runs: *how much recovery Trey currently needs* → sets the 3-day spacing gaps in rules 2/3/4 → those gaps set the minimum cycle length. Right now that's **13 days**. Trey, verbatim: *"Current cycle lengths at 13 days are mostly so that i have extra recovery days between all workouts. In the future these cycles will drop when i don't feel i need as much recovery."*
   **What this means in practice:** the length can only shrink by first relaxing the spacing gaps, and that is a deliberate recovery call for Trey to make — never a derivation a future session performs on its own. Expect it to compress toward 10–11 days later as recovery capacity improves. **Do not shorten the cycle just because slack appears elsewhere** (e.g. removing a lift day frees placement room — that is not a reason to compress). Re-derive the floor only *after* Trey changes the gaps, never before.
10. **Any two lift days** (A↔B, A↔C, B↔C, or **this cycle's A ↔ next cycle's A**, across the cycle boundary — corrected 2026-08-04: with only one Lift A per cycle now, this last case is literally "the two nearest chest sessions across the boundary," not "two chest sessions inside one cycle"): minimum **1 day** between them, **ideally 2**. At 13 days apart (D2 to next cycle's D2), this case is trivially satisfied and imposes no real constraint at the current cycle length.
11. **Lift A ↔ Lift C (chest ↔ back) specifically:** this pairing matters more than the others — ideally **2 days minimum**, and longer is actively better, not just tolerated. When there's a choice of where to place a lift, protect this gap first among the "ideally 2" rules.
12. **~~Speed Day 1 is the Sled/Carry Hybrid~~ — RETIRED 2026-08-17.** The hybrid existed to train the ACFT's Sprint-Drag-Carry; the USAF PFRA has no equivalent event, so it was cut and **Speed Day 1 reverted to a classic speed session**. The rule number is deliberately left occupied rather than renumbered — rule 13 is cross-referenced by number from `training.md`, `training-context.md` and `training-with-pushups.md`. See `training-context.md` → "Decision — ACFT → USAF PFRA (2026-08-17)".
13. **Ab/core circuit days:** 4 dedicated ~20-min circuit days per cycle, spaced roughly every 3 days — **Days 2, 5, 9, 12** in the 13-day template. Never on the full-rest day (Day 13) and never on a day immediately before Lift A/B/C. **Both speed days** (Day 1 and Day 10) additionally get a short **light** ab add-on (~5–8 min). *(Updated 2026-08-17: Day 1 previously got none, on the grounds that the hybrid's loaded farmers carry already delivered an anti-rotation/anti-extension stimulus. With the hybrid retired under rule 12, Day 1 is a plain speed session with no built-in core stimulus, so it takes the same light add-on Day 10 has always had — and core endurance is now a scored PFRA event, which makes leaving a speed day with zero core work harder to justify than it was.)* Full circuit content and the day-before/after-lift/rest exclusion logic live in the **Ab/Core Circuit** section below.

Note on "4–5 days of rest between cycles": this was mentioned once by the user and never fully pinned down — see the open question in `training-context.md`. It is **not** currently enforced as a hard rule below; only the single full-rest day (rule 6) and the long-run/speed buffer (rule 7) are locked in.

---

## Current template — 13-Day Cycle (minimum length that satisfies all rules above)

| Cycle Day | Session | Ab/Core |
|---|---|---|
| 1 | **Speed Day 1** (classic) | Light ab (~5–8 min) |
| 2 | Easy run + **Lift A** (chest/arms) | **Ab Circuit** (~20 min) |
| 3 | Easy run | — |
| 4 | **Lift B** (legs) — lift only, no run | — |
| 5 | Easy run | **Ab Circuit** (~20 min) |
| 6 | Easy run | — |
| 7 | **Lift C** (back) + easy run (mileage-only day, no speed) | — |
| 8 | Easy run | — |
| 9 | Easy run | **Ab Circuit** (~20 min) |
| 10 | **Speed Day 2** (classic) | Light ab (~5–8 min) |
| 11 | Easy run | — |
| 12 | **Long run** | **Ab Circuit** (~20 min) |
| 13 | **Full rest** (true rest — sets up Day 1 of next cycle) | — |

### Why this satisfies every rule
- Leg (D4) → Back (D7): 3 days ✅
- Leg (D4) → Speed 1 (D1): 3 days ✅ · Leg (D4) → Speed 2 (D10): 6 days ✅
- Back (D7) → Speed 1 (D1): 6 days ✅ · Back (D7) → Speed 2 (D10): 3 days ✅
- Long run (D12) → Speed 2 (D10): 2 days buffer ✅ · Long run (D12) → next cycle's Speed 1: 1 full rest day (D13) in between ✅
- One full rest day (D13), two speed days, three lifts, all spaced ✅
- **Lift spacing (rules 10–11) — re-derived 2026-08-04 for the corrected single-Lift-A layout:** A(D2)↔B(D4) = 2 days (meets the "ideally 2" target exactly) · B(D4)↔C(D7) = 3 days (clear of the "ideally 2" minimum) · **A(D2)↔C(D7) = 5 days** — the *only* chest↔back gap now that there's just one Lift A, comfortably clear of the ideal-2 minimum, no juggling required · this cycle's A(D2) ↔ next cycle's A(D2, day 15) = 13 days, trivially clear. With only one instance of each lift, rules 10–11 impose no real constraint at this cycle length — there's no second chest↔back gap to protect and no placement puzzle to solve.

**Cycle-length proof, re-derived from scratch (2026-08-04) — the old proof was written when Lift A appeared twice and is no longer valid as stated (see `training-context.md` decision log); this one is independent of lift count:**
13 days is still the minimum, and lift count was never actually what forced it — the binding chain is rules 2/3/4 (3-day spacing) plus rule 7 (long-run/speed buffer) plus rule 6 (the rest day doubling as that buffer):
Speed 1 (D1) →+3 (rule 3, leg↔speed)→ Legs (D4) →+3 (rule 2, leg↔back)→ Back (D7) →+3 (rule 4, back↔speed)→ Speed 2 (D10) →+2 (rule 7 requires ≥1 full easy/rest day *between* long run and any speed day, so the earliest the long run can land is 2 days after Speed 2)→ Long run (D12) →+2 (rule 7 again, same requirement in the other direction, toward *next* cycle's Speed 1)→ next cycle's Speed 1 (day 14). That chain is 3+3+3+2+2 = 13 days from this cycle's D1 to the next cycle's D1 — i.e., a 13-day cycle — and every one of those gaps is already at its rule-mandated minimum; none can shrink without breaking rule 2, 3, 4, or 7. The single full-rest day (rule 6) sits at D13, which is exactly the buffer day rule 7 already needs between the long run and next cycle's Speed 1 — one day satisfying two rules at once, already as efficient as it can be. Lift placement (rules 1, 10, 11) never added length on top of this chain; A/B/C just get slotted into days this chain already produces (D2, D4, D7), which is why removing the second Lift A didn't shorten anything — it was never part of what set the floor. **13 days remains the minimum _given the current gaps_** — and the reason is now cleaner and lift-count-independent.

**⚠️ Read that conclusion correctly — it is a floor, not a target (clarified by Trey 2026-08-04).** The chain above proves 13 is the shortest cycle *that satisfies the rules as currently written*. It does **not** mean 13 is inherently correct or immutable. The 3-day gaps in rules 2/3/4 are not laws of physics — they encode **how much recovery Trey needs right now**, and he has said explicitly that they will relax as recovery capacity improves, at which point this same derivation yields a shorter cycle (~10–11 days). See rule 9.
So: the cycle is 13 days **because Trey currently wants that much recovery**, and the rules are how that preference is written down. The derivation above shows the rules and the length are consistent — it is not an argument that the length is fixed. **Never compress the cycle on the strength of this proof alone; only re-derive after Trey changes the gaps.**

### Retired 2026-08-17 — the Sled/Carry Hybrid (rule 12)
Two subsections used to sit here: why Speed Day 1 rather than Speed Day 2 carried the hybrid, and why Cycle 1 was exempt from it. Both are moot — the hybrid trained the ACFT's Sprint-Drag-Carry and the USAF PFRA has no equivalent event, so the session is gone and **both speed days are classic**. The reasoning is preserved in `training-context.md`'s decision log rather than here; this heading exists so a future session doesn't go looking for a prescription that was deliberately removed.

One consequence worth stating plainly, because it removes a standing caveat rather than adding one: the **D1 → D4 gap into Lift B (legs) is correctly sized again**. That 3-day gap was set for a plain speed day, and the old progression note flagged that heavier sled/carry loading down the line could erode it. Day 1 is a plain speed day again, so the flag is closed.

### Why the Ab/Core Circuit lands on Days 2, 5, 9, 12 (rule 13)
*(Exclusion list re-derived 2026-08-04 for the corrected single-Lift-A layout — D10 is no longer "the day before a lift" since D11 no longer holds a lift.)*
Excluded up front: the day before any of the three lifts (D1 before A@D2, D3 before B@D4, D6 before C@D7 — a heavy trunk circuit the day before a lift blunts the next day's lift quality) and the day after Lift C/back (D8 — back work already taxes the erectors/core hard, D8 needs to actually recover from it, not layer more on). D13 is the cycle's one full true-rest day (rule 6: "no running, no lifting, no exceptions") — **ruling: no ab work on D13.** A 20-minute weighted/bodyweight circuit is real training stress even though it isn't barbell "lifting" in the literal sense, and rule 6 exists to guarantee one genuinely stimulus-free day per cycle; that intent loses if a loophole word ("lifting") lets a circuit sneak in. D13 stays fully off.
That leaves D2, D4, D5, D7, D9, D10, D11, D12 as technically eligible (D10 newly eligible under the corrected exclusion list). D4 (Lift B/legs) and D11 (now a plain easy run, no lift) are left unused so the placement below can land on a clean ~3-day cadence. D7 (Lift C/back) is deliberately skipped even though the literal rule only excludes the day *after* back — back day's own accessory work (rows, deadlifts, pull-ups) already trains the core hard as a stabilizer, so stacking a dedicated circuit on the same day risks the same double-load problem D8's exclusion is protecting against. **D10 (Speed Day 2) is deliberately skipped for the robust rotation too, despite now being technically eligible** — it's still a hard classic-interval quality session, and a full 20-min circuit after it is more fatigue than a speed day should absorb; it keeps its separate light-only add-on instead (below), a call based on session content, not day-adjacency.
**Committed placement: D2, D5, D9, D12** — unchanged by the correction. Gaps of 3, 4, 3, and 3 (D12 → next cycle's D2, i.e. day 12 → day 15) days, re-verified by direct count against the corrected table above — this placement never actually depended on D11's lift status, so it holds exactly as before. D2 doubles up with Lift A (chest) — a standard, low-interference pairing (ab work doesn't meaningfully blunt a chest lift, many programs pair them deliberately) — and D12 doubles up with the Long Run, done post-run once cooled down.
**Both speed days (D1 and D10)** get a short **light** add-on (~5–8 min, see Ab/Core Circuit below) since classic speedwork carries no built-in core stimulus. *(Updated 2026-08-17 — D1 previously got none because the retired hybrid's loaded carry covered it; see rule 12.)* Note this does not collide with D1's exclusion from the **robust** rotation as the day before Lift A (D2): the exclusion exists because a heavy 20-min trunk circuit blunts the next day's lift, and a 5–8 minute maintenance add-on is explicitly not that. The robust circuit stays off D1.

---

## Session type guide (fill in actual paces from `pfra-2mile-training-plan.md`, updated after each checkpoint test)

- **Speed Day 1 (classic):** intervals/strides/relaxed-fast reps — intensity and volume per current training phase (see training plan). *(Was the Sled/Carry Hybrid from Cycle 2 until 2026-08-17; retired with the ACFT, see rule 12.)*
- **Speed Day 2 (classic):** intervals/strides/relaxed-fast reps — intensity and volume per current training phase (see training plan).
- **Long run:** easy aerobic pace, HR controlled, longest single effort of the cycle.
- **Easy run:** by feel, easy pace range, no quality intent.
- **Lift A (chest/arms):** low leg stress, safe to pair with any run.
- **Lift B (legs):** heaviest leg stress in the cycle — no run same day.
- **Lift C (back):** upper-body focused but still gets a full 3-day buffer from legs and speed; easy run same day is fine (mileage only).
- **Full rest:** no running, no lifting, no exceptions. (Also no ab circuit — see rule 13.)
- **Ab/Core Circuit:** ~20 min, 3 rotating variants — full content below.

---

## Ab/Core Circuit (full content, 3 rotating variants)
~20 minutes each, rotate **A → B → C → A →...** across the cycle's 4 ab days so it doesn't go stale (e.g. Cycle 2: D2=A, D5=B, D9=C, D12=A; Cycle 3 continues the rotation from B).

**Variant A — Foundation / anti-extension**
1. Dead Bug — 3 x 10/side, 30s rest
2. Plank hold — 3 x 30–45s, 30s rest
3. Bird Dog — 3 x 10/side, 30s rest
4. Bicycle crunch — 3 x 15/side, 30s rest
5. Side plank — 2 x 20–30s/side, 30s rest
(~2 min warm-up movement prep + ~2 min cooldown stretch bookend the above to land at ~20 min total.)

**Variant B — Anti-rotation**
1. Pallof press (band or single DB) — 3 x 12/side, 30s rest
2. Russian twist (bodyweight or light weight) — 3 x 20 total, 30s rest
3. Mountain climbers — 3 x 30s, 30s rest
4. Side plank with reach-under — 2 x 10/side, 30s rest
5. Hollow body hold — 3 x 20–30s, 30s rest
6. Superman hold — 2 x 30s, 30s rest

**Variant C — Progression / loaded** *(introduce once Variant A/B feel comfortably controlled, roughly Cycle 3+)*
1. Hanging knee raise (or lying leg raise if no bar) — 3 x 12, 30s rest
2. Weighted sit-up (light plate) — 3 x 15, 30s rest
3. Plank with shoulder taps — 3 x 20 taps, 30s rest
4. Suitcase hold (single KB, anti-lateral-flexion) — 2 x 20–30s/side, 30s rest
5. Reverse crunch — 3 x 15, 30s rest
6. Plank hold — 2 x 45s, 30s rest

**Light ab add-on (both speed days, ~5–8 min):** Dead Bug 2 x 8/side + Plank hold 2 x 20–30s. Deliberately short and low-fatigue — this is maintenance, not a session. *(Updated 2026-08-17 — was Speed Day 2 only, because Speed Day 1's retired sled/carry hybrid already trained anti-rotation/anti-extension core via the farmers carry. Both speed days are classic now, so both take it.)*

## Optional add-ons
- Hike/ruck can sub in for one easy day per cycle if desired (carried over from earlier drafts) — not required by any hard rule, use based on how you feel. Keep it off the day immediately before/after a speed day or long run.

## Reassessment
- Every time recovery capacity shifts noticeably (better or worse), re-check whether 13 days is still the minimum needed, or whether it can compress.
- After each checkpoint test, session intensities (not the structure above) update off the new numbers — see `pfra-2mile-training-plan.md`.
