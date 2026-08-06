# Training Plan — Master Context

**Read this file first, in full, before making any change to any other training doc.** It exists so that any future session has complete, accurate context and never has to guess. If something here conflicts with another doc, this file wins — it's the settled record.

**Live doc set (two docs):**
1. `training-context.md` — this file. Decisions, history, rules, open questions. Read first.
2. `training.md` — the working doc. Numbers-only merge of the old cycle template + calendar + training plan: pace bands, per-cycle micro-checkpoint estimates, and the day-by-day calendar with actual prescribed workout numbers (distances, paces, rep times). Built incrementally, cycle by cycle, same as the old calendar was.

**Retired/superseded, do not resurrect:** `perplexrunning.md`, `RunningCycle.md`, `runningplan.md` (wrong 2027 date) — fully absorbed early on, genuinely gone, do not resurrect these three.

**Corrected 2026-08-04 — `cycle.md`, `acft-2mile-training-plan.md`, and `acft-full-calendar.md` are NOT retired.** An earlier version of this file claimed they'd been merged into `training.md` and retired, but that was never actually followed through — all three have continued to be actively maintained doc-for-doc alongside `training.md` (verified directly: none are stubs/redirects, and this file's own "Cycle structure" section and "Instructions for future sessions" section both already treated `cycle.md` as the live source of the hard rules, contradicting the retirement claim above them). **Correct, current picture: the live doc set is all five files** — `training-context.md` (this file, decisions/history/rules, reads first, wins on conflict), `cycle.md` (canonical generic template + full session prescriptions — sled/carry hybrid and ab/core circuit content live here), `training.md` (numbers-dense Cycle 1 & 2 dated tables), `acft-full-calendar.md` (calendar view of the same dated cycles), `acft-2mile-training-plan.md` (phase/pace/checkpoint framework). A stale "some docs are retired" claim being left uncorrected is exactly how the separate Lift A mess below happened (rule 1 was ambiguous in one doc and nobody caught it because doc liveness itself was unclear) — so this is fixed outright rather than re-flagged.

---

## Goal
- Event: ACFT 2-mile run.
- Target: **14:00** (7:00/mile), stretch goal **13:40** (6:50/mile).
- Test date: **December 31, 2026**. (Earlier drafts briefly used a 2027 goal — that was a documented mistake in an earlier conversation and has been corrected. Do not revisit or re-derive this; end of 2026 is final.)
- Plan start: July 29, 2026 conceptually; Cycle 1 actually began **Aug 2, 2026**.

## Background
- Training history: 30–35 mi/week for extended periods, years ago (not currently trained at that level).
- Longest run at restart: 2 miles.
- Known ankle history — no sustained hill running until Phase 2 at the earliest (Cycle 6+), and even then only short controlled sprints on a gentle grade, full recovery. Any sharp pain (not normal soreness) stops the session. Drop hills entirely if the ankle flares.
- HR flag: 180–185 bpm after the first mile at "maintainable" effort reads high for that effort level. Not treated as alarming, but worth knowing resting HR / a basic checkup at some point. Not medical advice, just logged so it isn't lost.

## Time trial results (Aug 1–2, 2026 — Orem, UT, ~91°F, elevation ~4,575 ft)
Used to reset training paces off real data instead of an assumed baseline.

- **1600m:** 185 bpm avg / 197 bpm peak, 9.3/10 effort. Splits (per 400m): 1:56, 2:07, 2:14, 2:06. Note: on split 3 there was an attempt to intentionally slow down that accidentally sped up instead — a 2:07 on that split was likely achievable.
- **1200m:** 188 bpm avg / 195 bpm peak, 9/10 effort. Splits: 2:03, 2:09, 2:10. Pushed hard but wasn't faster per-lap than the 1600m — read as fractionally more fatigued than expected, or a fade under repeated hard effort.
- **"400m" (originally planned as 800m):** stopped after lap 1 due to fatigue; that lap was 2:10, run conservatively since a second lap was expected. Expect faster true 400m times on dedicated speed days that don't start off a fresh mile effort.

**Interpretation (settled):**
- Predicted current 2-mile: **~17:45–18:15**, working baseline **~18:00** — about 2 minutes faster than the plan's original assumed 20:00 baseline. Heat (91°F) and altitude (~4,575 ft) both suppress performance, so true cool-weather fitness is a touch better than even that.
- The limiter is **not top-end speed** — a fresh first 400 (1:56) is already close to the 1:45 goal race pace. The limiter is **aerobic endurance / ability to sustain hard effort**: high HR (185 avg/197 peak) plus a fade on the second hard effort (1200m no faster per-lap than the 1600m) both point the same direction.
- This confirms the plan's structural bet: dump the early work into aerobic base and durability, not speed work. The 14:00 goal is still a real stretch (~4 min improvement, almost all aerobic) but meaningfully more reachable than the original 6-minute framing implied.

**Current settled training paces** (used starting Cycle 1, recalculate after each checkpoint test):
- Easy / long run: **~10:45–11:15/mile**, by feel, HR controlled.
- Threshold: **~9:00–9:15/mile**.
- Speed reps (400m): **~2:00 now**, full recovery, building toward 1:45.
- Goal race pace: **1:45/400m**.
- Cycle 1 specifically: both speed days kept light — strides + relaxed ~2:00 400s, nothing near max, no formal threshold yet (coming off time-trial soreness, still Phase 1 base-building anyway).

## Cycle structure — hard rules (settled, live in full in `cycle.md`)
1. **3 lift SESSIONS per cycle, full stop — one chest, one legs, one back** (corrected 2026-08-04, see "Decisions — Lift A Count Correction" below; previously-ambiguous wording had let a second chest session get added). The A/B/C letters are just labels for which muscle group is which — not themselves a count. Order among the three doesn't matter, spacing does.
2. Leg day ↔ Back day: **≥3 days** apart.
3. Leg day ↔ any speed day: **≥3 days** apart.
4. Back day ↔ any speed day: **≥3 days** apart.
5. 2 speed days per cycle.
6. 1 full true rest day per cycle (no running, no lifting).
7. Long run → nearest speed day (either direction, including across a cycle boundary): **≥1 full day** of separation. This was the specific bug being fixed — the old calendar had a long run on the last day of one cycle flowing straight into a speed day on Day 1 of the next.
8. Lift A has no spacing restriction relative to running, pairs freely with any easy run day.
9. Cycle length is not fixed — it's derived from rules 1–8, 10, and 11, not the other way around. **13 days is currently the mathematically shortest cycle that satisfies all of the above.** Expect this to compress toward 10–11 days later as recovery needs shrink; re-derive rather than assuming 13 stays fixed.
10. **Any two lift days** (A↔B, A↔C, B↔C, or this cycle's A ↔ next cycle's A across the boundary): minimum 1 day between them, ideally 2. (Added later than the other rules — this was an "unwritten rule" the user hadn't mentioned yet when `cycle.md` was first built, then flagged explicitly. Corrected 2026-08-04: with only one Lift A per cycle now, the "A↔A across the boundary" case means this cycle's single chest session to next cycle's single chest session — 13 days apart, trivially satisfied, not a real constraint.)
11. **Lift A ↔ Lift C (chest↔back) specifically** matters more than the other lift pairings — ideally 2 days minimum, and longer is actively better, not just tolerated. This is the pairing to protect first when placing lifts in the cycle.
12. **Speed Day 1 = Sled/Carry Hybrid, Cycle 2+** (added 2026-08-04). Full prescription in `cycle.md`. See "Decisions" section below for the full reasoning.
13. **Ab/Core Circuit, 4x/cycle on Days 2/5/9/12** (added 2026-08-04), plus a light add-on on Speed Day 2 only. Full content in `cycle.md`. See "Decisions" section below for the full reasoning.

**Template fix this caused (historical — superseded 2026-08-04, kept for the record, do NOT re-add a second Lift A):** the original 13-day template put a second Lift A on Day 8, only 1 day after Back day (D7) — met rule 8's old "no restriction" but violated rule 11 (chest↔back should be ≥2, ideally more). At the time this was fixed by moving that second Lift A to Day 11 instead, giving a 4-day chest↔back gap, and `cycle.md`/`acft-full-calendar.md` reflected two Lift A sessions per cycle (D2 and D11) from that point through 2026-08-04. **This whole fix is now moot** — Trey's 2026-08-04 ruling (below) removed the second Lift A entirely rather than repositioning it, so there is no second chest↔back gap left to protect. This paragraph stays in the doc specifically so a future session doesn't see the "A(D2)↔C(D7) = 5 days, only one gap now" framing and wonder if a second Lift A got lost by accident — it didn't; it was deliberately removed, see below. Cycle 1's actual lift placement (A on D1, B on D3, C on D8) was never affected either way (only ever had one Lift A).

**Open question, not yet resolved:** the user mentioned wanting "4–5 days of rest between cycles" once, alongside a worked example (leg day1 → speed day4 → back day6 → speed day9) that the user explicitly flagged as illustrative-only, not literal. That example's own gaps don't actually satisfy rule 4 (back-to-speed gap of only 2 in the example) — the user's explicit instruction to enforce 3 full days everywhere, plus willingness to extend to 13 days, took precedence in building `cycle.md`. The "4–5 days rest between cycles" phrase was never pinned down to a concrete rule (rest days total per cycle? days at reduced load between cycle repeats?) and is not currently enforced as anything beyond the single full-rest day (rule 6). **Flag this to the user directly if it becomes relevant** — don't guess further at what it meant.

## Cycle 1 — what actually happened (Aug 2–13, 2026, 12 days, one-time adjusted)
Time trials on Aug 1–2 left significant soreness, so Cycle 1 opened with full rest + Lift A instead of a speed day, and a slow recovery run before Leg day. Full table lives in `acft-full-calendar.md`. Known accepted deviation: Back day sits only 2 days from Speed 1 in this cycle specifically (not the standard 3) — a deliberate one-time call to avoid stretching the soft start further, not a new standing rule. Cycle 2 onward uses the standard 13-day template with no deviations.

## Decisions — Sled/Carry Hybrid Speed Day & Ab/Core Circuit (2026-08-04)

**Sled/Carry Hybrid → Speed Day 1, not Speed Day 2, starting Cycle 2:**
*(Note: originally reasoned as "both speed days sit 1 day before a Lift A, so that's a tie" — no longer accurate after the 2026-08-04 Lift A correction below, since D10 isn't adjacent to any lift anymore. Doesn't change the verdict; chest-adjacency was never the deciding factor.)* The decider is distance from **both** legs and back, since a sled drag + farmers carry loads quads/glutes/hamstrings (leg-adjacent) and traps/grip/posterior chain (back-adjacent) at once. Speed 1 (D1): 3 days from Lift B/legs, 6 from Lift C/back, preceded by the cycle's one full-rest day, followed by non-competing Lift A. Speed 2 (D10): only 3 days from back (the tighter gap) and — the real deciding factor — sits 2 days before the Long Run (D12), so any residual fatigue from a loaded sled/carry session would bleed directly into the cycle's single highest-stress run. Speed 1/Day 1 wins on both recovery-in and interference-out. Full reasoning and verification written into `cycle.md` (new "Why Speed Day 1..." subsection) so it's auditable later.
**Cycle 1 exception:** the hybrid does not apply to Cycle 1's speed days (D6, D11). Cycle 1 is a documented one-time soreness-recovery soft start with both speed days already kept deliberately light, and D6 already carries an accepted deviation (only 2 days from back day). Stacking an unfamiliar loaded movement pattern onto that is not something a coach would do. Hybrid starts **Cycle 2 Day 1 (Fri 8/14)**, the first cycle running the standard template at full intensity. Cycle 1's speed days get the light ab add-on only, nothing else new.
Full session prescription (sled drag 4x25m, lateral sprint 4x50m, farmers carry 3x50m, then 2–4 classic 50m sprints, with loads/rest/progression) lives in `cycle.md`. Scaled to current level (2-mile ~18:00, Phase 1 strides-only) — deliberately far below the `Guidelines_AFT` ACFT-test-standard loads (40lb KBs/hand, ~90lb+sled), which are the long-term reference point, not the Cycle 2 starting point.
✂️ Open flag: the progression note in `cycle.md` mentions a possible Phase 3 full-event timed simulation. Every other doc in this set scopes the Dec 31 2026 test to the 2-mile run only, not the full ACFT — that Phase 3 idea assumes the full ACFT might matter, which hasn't been confirmed anywhere. Worth confirming with Trey before it becomes a real plan item.

**Ab/Core Circuit → Days 2, 5, 9, 12 (every ~3 days), robust circuit; Speed Day 2 gets a light add-on, Speed Day 1 (hybrid) gets none; Day 13 (full rest) gets none:**
Excluded: any day before a lift (D1, D3, D6, D10) and the day after Lift C/back (D8 — back day already loads the core hard via rows/deadlifts/pull-ups, D8 needs to recover from that, not add more). D13 ruled off entirely — even though a bodyweight/light-weight ab circuit isn't literal "lifting," rule 6's "no exceptions" full-rest day is meant to guarantee one genuinely stimulus-free day per cycle, and a 20-minute circuit is real training stress; a full-rest day survives that intent, not the letter. Among the technically-eligible remainder (D2, D4, D5, D7, D9, D11, D12), D7 (Lift C/back itself) is also skipped by judgment for the same reason as D8's exclusion — back day's own accessory work already taxes the core — even though the user's literal constraint only named the day *after* back. **Committed placement: D2, D5, D9, D12** — verified gaps of 3, 4, 3, 3 (the last wrapping across the cycle boundary to the next cycle's D2). Speed Day 2 (D10, still classic) gets a short light add-on since it has no built-in core stimulus; Speed Day 1 (D1, the new hybrid) does not, since the loaded farmers carry already delivers real anti-rotation/anti-extension work — stacking a dedicated circuit on top would double-load the same tissue same day.
Circuit content: 3 rotating ~20-min variants (A = foundation/anti-extension, B = anti-rotation, C = progression/loaded) so it doesn't go stale across repeats — rotates A→B→C→A... cycle to cycle. Full exercise lists, sets/reps/rest, and the light add-on definition live in `cycle.md`.
**Cycle 1:** soft-start reasoning extends here too — no robust circuit this cycle, light add-on only on both speed days (D6, D11), matching the same logic used for deferring the hybrid.

## Decision — Why the cycle is 13 days (2026-08-04, Trey, direct)

**13 days is a RECOVERY choice, not a derived minimum.** Trey, verbatim:
> *"Current cycle lengths at 13 days are mostly so that i have extra recovery days between all workouts. In the future these cycles will drop when i don't feel i need as much recovery. that's the reasoning for 13 right now."*

The causal order matters and had been recorded backwards. It runs:
**how much recovery Trey currently needs → the 3-day gaps in rules 2/3/4 → the 13-day floor.**
Not the other way around. The spacing rules are how a recovery preference got written down; they are not independent constraints that happen to yield 13.

**Why this needed correcting:** `cycle.md` asserted 13 days was *"provably the shortest cycle that satisfies rules 1–8."* That statement is arithmetically true but reads as though the length is immutable and rule-derived — which would invite a future session to compress the cycle the moment any constraint loosened. That is precisely what Trey does not want. The claim has been reframed in `cycle.md` (rule 9 + the cycle-length proof section) as a **floor, not a target**.

**Standing instruction — do not compress the cycle.** Slack appearing elsewhere is not a reason to shorten it. The single-Lift-A correction (below) freed up lift-placement room; that room is deliberately left unspent. The cycle shortens only after **Trey** relaxes the spacing gaps, and only then is the floor re-derived. Expect ~10–11 days eventually, when he says so — not before.

## Bugs fixed from the old calendar (for record-keeping, don't need to re-fix)
- Old calendar showed **Lift A twice** (Day 2 and Day 7) instead of Lift A (chest/arms) + Lift B (legs). Corrected.
- Old calendar had lost/dropped speed days somewhere in a prior edit. Restored — both speed days present every cycle.
- Old 11-day template put the long run right before the next cycle's speed day with no buffer. Fixed via rule 7 above and the extra rest day built into `cycle.md`.

## Instructions for future sessions
- When asked to update the cycle, calendar, or plan, read this file in full first. It has final say over anything that conflicts with an older doc.
- Don't revisit the 2026-vs-2027 goal date question — it's settled, 2026 is correct.
- Once a real Checkpoint Test result exists, recalculate pace targets off that result (not the original ~18:00 estimate) for every cycle after it — this applies to `acft-2mile-training-plan.md`'s pace chart and to speed/threshold prescriptions in the calendar.
- Extend `acft-full-calendar.md` one cycle at a time as cycles actually happen, using the current version of `cycle.md` (which may have shortened) rather than assuming 13 days indefinitely.
- If the "4–5 days rest between cycles" question ever comes up again, ask directly rather than assuming — see Open Question above.
