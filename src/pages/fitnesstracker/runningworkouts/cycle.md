# Generic Training Cycle (cycle.md)

**This is the one canonical microcycle template.** No dates here on purpose — dates + cycle-day numbers live in `acft-full-calendar.md`. When the cycle length changes (see below), update it here and it flows into the next calendar entry.

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
12. **Speed Day 1 is the Sled/Carry Hybrid** (added 2026-08-04, effective **Cycle 2 onward**): Day 1 of the standard template carries a sled-drag/farmers-carry/lateral-sprint block that finishes with 2–4 classic sprints. Full prescription and the reasoning for why Day 1 (not Day 10) was picked live in the **Session type guide** below. Cycle 1's two speed days do **not** get this hybrid — see the Cycle 1 exception note there.
13. **Ab/core circuit days:** 4 dedicated ~20-min circuit days per cycle, spaced roughly every 3 days — **Days 2, 5, 9, 12** in the 13-day template. Never on the full-rest day (Day 13) and never on a day immediately before Lift A/B/C. Speed Day 2 (Day 10) additionally gets a short **light** ab add-on (~5–8 min); Speed Day 1 (Day 1, the hybrid) does **not** — the loaded farmers carry already delivers a real anti-rotation/anti-extension core stimulus, and stacking a dedicated ab block on top would double-load the same tissue on the same day. Full circuit content and the day-before/after-lift/rest exclusion logic live in the **Ab/Core Circuit** section below.

Note on "4–5 days of rest between cycles": this was mentioned once by the user and never fully pinned down — see the open question in `training-context.md`. It is **not** currently enforced as a hard rule below; only the single full-rest day (rule 6) and the long-run/speed buffer (rule 7) are locked in.

---

## Current template — 13-Day Cycle (minimum length that satisfies all rules above)

| Cycle Day | Session | Ab/Core |
|---|---|---|
| 1 | **Speed Day 1 — Sled/Carry Hybrid** | *(none — carry work covers core, see rule 13)* |
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

### Why Speed Day 1 (not Speed Day 2) got the Sled/Carry Hybrid (rule 12)
*(Corrected 2026-08-04: with the single-Lift-A ruling, Speed 2/D10 is no longer adjacent to any lift day at all — the original "both speed days sit 1 day before a Lift A" framing is no longer accurate. Doesn't change the verdict; the deciding factor was never chest-adjacency.)*
The deciding factor is distance from **legs and back both**, because a sled drag + farmers carry loads quads/glutes/hamstrings (like a leg day) **and** traps/grip/posterior chain (like a back day), not just one or the other.
- **Speed 1 (D1):** 3 days from Lift B/legs (D4), 6 days from Lift C/back (D7, forward) and effectively a full cycle removed from the *previous* cycle's back day. Preceded by D13, the one full true-rest day — best possible recovery state walking in. Followed immediately by D2's Lift A (chest), a non-competing muscle group, so the hybrid's fatigue doesn't collide with anything.
- **Speed 2 (D10):** only 3 days from Lift C/back (D7) — the tighter of the two back-gaps — and, more importantly, sits 2 days before the Long Run (D12), with no lift adjacent to it at all now. A 3.5mi+ long run 2 days after a loaded sled/carry session is the weak point in that placement: residual soreness or a rough sled session would directly threaten long-run quality, and the long run is the cycle's highest single training-stress day.
- **Verdict: Speed 1/Day 1 still wins** — best recovery going in, zero downstream interference with the long run, and maximum separation from the two muscle groups the hybrid actually loads. Unaffected by the Lift A correction.

### Cycle 1 exception (why the hybrid does NOT start Cycle 1)
Cycle 1 (Aug 2–13) is a documented one-time soreness-recovery soft start — both its speed days are explicitly kept light (strides + relaxed ~2:00 400s, "nothing near max," per `training.md`/`acft-full-calendar.md`), and its Speed 1 (D6) sits only 2 days from back day (D8), a known accepted deviation for *that* reason alone. Loading a brand-new, unfamiliar strength-speed movement pattern (sled + loaded carry) onto an athlete who is still recovering from time-trial soreness, on a day already tighter to back day than the standard template allows, is not something a coach would do. **The hybrid begins Cycle 2 Day 1 (Fri 8/14)** — the first cycle that runs the standard 13-day template at full intensity. Cycle 1's two speed days keep their original content; they get the *light* ab add-on only (see rule 13 / Ab/Core Circuit below), not the hybrid and not the robust circuit.

### Why the Ab/Core Circuit lands on Days 2, 5, 9, 12 (rule 13)
*(Exclusion list re-derived 2026-08-04 for the corrected single-Lift-A layout — D10 is no longer "the day before a lift" since D11 no longer holds a lift.)*
Excluded up front: the day before any of the three lifts (D1 before A@D2, D3 before B@D4, D6 before C@D7 — a heavy trunk circuit the day before a lift blunts the next day's lift quality) and the day after Lift C/back (D8 — back work already taxes the erectors/core hard, D8 needs to actually recover from it, not layer more on). D13 is the cycle's one full true-rest day (rule 6: "no running, no lifting, no exceptions") — **ruling: no ab work on D13.** A 20-minute weighted/bodyweight circuit is real training stress even though it isn't barbell "lifting" in the literal sense, and rule 6 exists to guarantee one genuinely stimulus-free day per cycle; that intent loses if a loophole word ("lifting") lets a circuit sneak in. D13 stays fully off.
That leaves D2, D4, D5, D7, D9, D10, D11, D12 as technically eligible (D10 newly eligible under the corrected exclusion list). D4 (Lift B/legs) and D11 (now a plain easy run, no lift) are left unused so the placement below can land on a clean ~3-day cadence. D7 (Lift C/back) is deliberately skipped even though the literal rule only excludes the day *after* back — back day's own accessory work (rows, deadlifts, pull-ups) already trains the core hard as a stabilizer, so stacking a dedicated circuit on the same day risks the same double-load problem D8's exclusion is protecting against. **D10 (Speed Day 2) is deliberately skipped for the robust rotation too, despite now being technically eligible** — it's still a hard classic-interval quality session, and a full 20-min circuit after it is more fatigue than a speed day should absorb; it keeps its separate light-only add-on instead (below), a call based on session content, not day-adjacency.
**Committed placement: D2, D5, D9, D12** — unchanged by the correction. Gaps of 3, 4, 3, and 3 (D12 → next cycle's D2, i.e. day 12 → day 15) days, re-verified by direct count against the corrected table above — this placement never actually depended on D11's lift status, so it holds exactly as before. D2 doubles up with Lift A (chest) — a standard, low-interference pairing (ab work doesn't meaningfully blunt a chest lift, many programs pair them deliberately) — and D12 doubles up with the Long Run, done post-run once cooled down.
**Speed Day 2 (D10)** gets a short **light** add-on (~5–8 min, see Ab/Core Circuit below) since it's still pure classic speedwork with no built-in core stimulus. **Speed Day 1 (D1, the hybrid)** does not — see rule 13 above.

---

## Session type guide (fill in actual paces from `acft-2mile-training-plan.md`, updated after each checkpoint test)

- **Speed Day 1 (Sled/Carry Hybrid, Cycle 2+):** sled drag + lateral sprint + kettlebell farmers carry, closing with 2–4 classic sprints — full prescription below. Cycle 1 exception: keeps the plain classic format (see rule 12 note above).
- **Speed Day 2 (classic):** intervals/strides/relaxed-fast reps — intensity and volume per current training phase (see training plan).
- **Long run:** easy aerobic pace, HR controlled, longest single effort of the cycle.
- **Easy run:** by feel, easy pace range, no quality intent.
- **Lift A (chest/arms):** low leg stress, safe to pair with any run.
- **Lift B (legs):** heaviest leg stress in the cycle — no run same day.
- **Lift C (back):** upper-body focused but still gets a full 3-day buffer from legs and speed; easy run same day is fine (mileage only).
- **Full rest:** no running, no lifting, no exceptions. (Also no ab circuit — see rule 13.)
- **Ab/Core Circuit:** ~20 min, 3 rotating variants — full content below.

---

## Speed Day 1 — Sled/Carry Hybrid (full prescription)
*Effective Cycle 2 Day 1 onward. Scaled for current level: 2-mile ~18:00 baseline, 400m ~1:56–2:00 fresh, Phase 1 base-building (strides only, no formal threshold yet). This is a beginner-appropriate introduction to the movement pattern, not an ACFT-test-standard effort — see the progression note at the bottom for how it scales up over cycles. Real ACFT Sprint-Drag-Carry standards (`Guidelines_AFT`: 40lb KBs/hand, ~90lb+sled, 25m-each-way legs) are the long-run reference point, not the Week 1 prescription.*

**Order and why:** warm-up → sled drag → lateral sprint → farmers carry → recovery → classic sprints. This roughly mirrors the real ACFT Sprint-Drag-Carry event's internal sequence (drag → lateral → carry), which is deliberate — it trains the actual movement chain and lets grip fatigue accumulate the same way it would in the real event (sled grip first, then the higher grip demand of the loaded carry last). The classic sprints go **last, after a full recovery window**, not first: these loaded/grinding elements aren't true max-velocity work, so they don't need to precede sprinting to protect sprint quality the way, say, a heavy squat session would. Placing them last also lets a brief post-activation-potentiation effect from the loaded work carry into the sprints, and keeps the session's actual finishing emphasis on "still follows some classic speedwork," per spec.

1. **Warm-up (~10–12 min):** 800m–1mi easy jog/brisk walk, dynamic drills (leg swings, walking lunges, high knees, butt kicks) ~5 min, then 4 x 20s build-up strides @ ~85% with full walk-back recovery — same backbone as the existing speed-day warm-up.
2. **Sled Drag — 4 x 25m:** light-moderate load (RPE 6–7/10) — enough resistance to feel like a driven power-walk, not a max grind; posture stays upright and stride controlled the whole 25m, never hunched forward. If loading a sled, start bodyweight-only-plus-sled or the lightest plate available. 60–90s walk-back recovery between reps. Cue: drive from the hips, short quick steps, chest up.
3. **Lateral Sprint — 4 x 50m (25m out + 25m back):** controlled-fast shuffle/carioca-to-shuffle, ~80–85% effort. 60–90s recovery between reps. Cue: stay low, don't cross feet through the shuffle, quick clean direction change at the 25m mark. *(Ankle note: lateral loading is different from forward running — respect the same ankle guardrail as the rest of the plan; any sharp pain stops the set, and this is exactly why effort is capped at controlled-fast rather than max here.)*
4. **Farmers Carry (kettlebells) — 3 x 50m (25m out + 25m back):** start at 2 x 20–25lb (one KB per hand); quick/purposeful walk-to-jog pace, not a max-speed loaded sprint yet (loaded max-velocity carries are a real injury risk before grip/trunk strength catches up). Full 90s–2min recovery between reps — grip and trunk need to actually reset for the next rep to be quality. Cue: tall posture, braced core, quick controlled turnover.
5. **Transition / recovery — 3–4 min easy walk:** implements down, mentally reset for pure sprint work.
6. **Classic Sprints — 3 x 50m @ ~90–95% effort** (default: 3; drop to 2 on a tired week, build to 4 once the movement pattern feels controlled and confident — stays inside the required 2–4 range either way). Not 100% max yet — still Phase 1, protect the hamstrings. Full 2–3 min recovery between reps.
7. **Cooldown (~5 min):** easy walk + static stretch — hip flexors, hamstrings, calves, low back, lats/forearms (from the carries).

**Total session:** ~40–45 min, ~11 specialized reps (4 drag + 4 lateral + 3 carry) plus 3 closing sprints.

**Progression across cycles:**
- **Cycle 2 (introduction):** exactly as prescribed above — light loads, RPE-capped, 3 closing sprints, generous recovery. The goal this cycle is clean movement pattern, not load.
- **Cycles 3–5 (rest of Phase 1):** if the pattern feels controlled and the D1→D4 (3-day) gap into Lift B/legs still recovers cleanly, add 1 rep to each specialized element (5 drag / 5 lateral / 4 carry) and/or nudge KB load to 25–30lb before touching sled weight — control and positioning lead the progression, not load, at this stage.
- **Phase 2 (Cycle 6+, threshold work begins):** sled load can start climbing toward a real resisted grind (RPE 7–8), KBs toward 30–35lb, and closing sprints can move from 90–95% to true 95–100% effort now that aerobic base is more established.
- **Phase 3 (Cycle 11+, race specificity):** consider trialing a single continuous ACFT-style shuttle (sprint–drag–lateral–carry–sprint, one unbroken pass, timed against the `Guidelines_AFT` percentile table) as a periodic fitness check — **layered on top of**, not replacing, the closing classic sprints. ✂️ Flag: every other doc in this set (`training.md`, `training-context.md`, `acft-2mile-training-plan.md`) scopes the Dec 31 2026 test to the **2-mile run only**, not the full 6-event ACFT. Confirm with Trey whether the full ACFT is actually in scope before building toward a timed full-event simulation — this progression step assumes it might be, but that hasn't been stated anywhere else in the doc set.
- **Re-verify recovery, don't just assume it holds:** as load increases, re-check that the 3-day D1→D4 gap to Lift B (legs) is still enough recovery given the added posterior-chain/grip demand — that gap was sized for the *original* plain speed day, not a loaded hybrid, and heavier loading down the line is exactly what could erode it.

## Ab/Core Circuit (full content, 3 rotating variants)
~20 minutes each, rotate **A → B → C → A →...** across the cycle's 4 ab days so it doesn't go stale (e.g. Cycle 2: D2=A, D5=B, D9=C, D12=A; Cycle 3 continues the rotation from B).

**Variant A — Foundation / anti-extension**
1. Dead Bug — 3 x 10/side, 30s rest
2. Plank hold — 3 x 30–45s, 30s rest
3. Bird Dog — 3 x 10/side, 30s rest
4. Bicycle crunch — 3 x 15/side, 30s rest
5. Side plank — 2 x 20–30s/side, 30s rest
(~2 min warm-up movement prep + ~2 min cooldown stretch bookend the above to land at ~20 min total.)

**Variant B — Anti-rotation** *(pairs conceptually with the hybrid day's loaded-carry demand)*
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

**Light ab add-on (Speed Day 2 only, ~5–8 min):** Dead Bug 2 x 8/side + Plank hold 2 x 20–30s. Deliberately short and low-fatigue — this is maintenance, not a session. **Not used on Speed Day 1** (the hybrid) — the farmers carry already trains anti-rotation/anti-extension core hard; adding this on top would double-load the same tissue on the same day.

## Optional add-ons
- Hike/ruck can sub in for one easy day per cycle if desired (carried over from earlier drafts) — not required by any hard rule, use based on how you feel. Keep it off the day immediately before/after a speed day or long run.

## Reassessment
- Every time recovery capacity shifts noticeably (better or worse), re-check whether 13 days is still the minimum needed, or whether it can compress.
- After each checkpoint test, session intensities (not the structure above) update off the new numbers — see `acft-2mile-training-plan.md`.
