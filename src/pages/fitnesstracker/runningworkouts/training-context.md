# Training Plan — Master Context

**Read this file first, in full, before making any change to any other training doc.** It exists so that any future session has complete, accurate context and never has to guess. If something here conflicts with another doc, this file wins — it's the settled record.

**Live doc set (two docs):**
1. `training-context.md` — this file. Decisions, history, rules, open questions. Read first.
2. `training.md` — the working doc. Numbers-only merge of the old cycle template + calendar + training plan: pace bands, per-cycle micro-checkpoint estimates, and the day-by-day calendar with actual prescribed workout numbers (distances, paces, rep times). Built incrementally, cycle by cycle, same as the old calendar was.

**Retired/superseded, do not resurrect:** `perplexrunning.md`, `RunningCycle.md`, `runningplan.md` (wrong 2027 date) — fully absorbed early on. `cycle.md`, `acft-2mile-training-plan.md`, `acft-full-calendar.md` — these were a three-way split of the same information; merged into `training.md` on request for a single numbers-dense doc. The rules and rationale that used to live in `cycle.md`'s prose (hard rules 1–11 below) still live here in full; `training.md` just shows the resulting numbers without re-explaining them.

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
1. 3 lifts per cycle: Lift A (chest/arms), Lift B (legs), Lift C (back). Order among them doesn't matter, spacing does.
2. Leg day ↔ Back day: **≥3 days** apart.
3. Leg day ↔ any speed day: **≥3 days** apart.
4. Back day ↔ any speed day: **≥3 days** apart.
5. 2 speed days per cycle.
6. 1 full true rest day per cycle (no running, no lifting).
7. Long run → nearest speed day (either direction, including across a cycle boundary): **≥1 full day** of separation. This was the specific bug being fixed — the old calendar had a long run on the last day of one cycle flowing straight into a speed day on Day 1 of the next.
8. Lift A has no spacing restriction relative to running, pairs freely with any easy run day.
9. Cycle length is not fixed — it's derived from rules 1–8, 10, and 11, not the other way around. **13 days is currently the mathematically shortest cycle that satisfies all of the above.** Expect this to compress toward 10–11 days later as recovery needs shrink; re-derive rather than assuming 13 stays fixed.
10. **Any two lift days** (A↔B, A↔C, B↔C, or A↔A across the cycle boundary): minimum 1 day between them, ideally 2. (Added later than the other rules — this was an "unwritten rule" the user hadn't mentioned yet when `cycle.md` was first built, then flagged explicitly.)
11. **Lift A ↔ Lift C (chest↔back) specifically** matters more than the other lift pairings — ideally 2 days minimum, and longer is actively better, not just tolerated. This is the pairing to protect first when placing lifts in the cycle.

**Template fix this caused:** the original 13-day template put the second Lift A on Day 8, only 1 day after Back day (D7) — met rule 8's old "no restriction" but violated the new rule 11 (chest↔back should be ≥2, ideally more). Fixed by moving the second Lift A to Day 11 instead, giving a 4-day chest↔back gap. `cycle.md` and `acft-full-calendar.md` (Cycle 2 onward) both reflect this. Cycle 1's actual lift placement (A on D1, B on D3, C on D8) already happened to satisfy this by a comfortable margin (6 days between C and the next A) — no retroactive fix needed there.

**Open question, not yet resolved:** the user mentioned wanting "4–5 days of rest between cycles" once, alongside a worked example (leg day1 → speed day4 → back day6 → speed day9) that the user explicitly flagged as illustrative-only, not literal. That example's own gaps don't actually satisfy rule 4 (back-to-speed gap of only 2 in the example) — the user's explicit instruction to enforce 3 full days everywhere, plus willingness to extend to 13 days, took precedence in building `cycle.md`. The "4–5 days rest between cycles" phrase was never pinned down to a concrete rule (rest days total per cycle? days at reduced load between cycle repeats?) and is not currently enforced as anything beyond the single full-rest day (rule 6). **Flag this to the user directly if it becomes relevant** — don't guess further at what it meant.

## Cycle 1 — what actually happened (Aug 2–13, 2026, 12 days, one-time adjusted)
Time trials on Aug 1–2 left significant soreness, so Cycle 1 opened with full rest + Lift A instead of a speed day, and a slow recovery run before Leg day. Full table lives in `acft-full-calendar.md`. Known accepted deviation: Back day sits only 2 days from Speed 1 in this cycle specifically (not the standard 3) — a deliberate one-time call to avoid stretching the soft start further, not a new standing rule. Cycle 2 onward uses the standard 13-day template with no deviations.

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
