At a glance — what this has to do
Any goal + deadline → auto-builds a checkpoint-by-checkpoint trajectory, pushed to calendar
Cadence is fully configurable per goal (daily, weekly, every N days, custom) — never fixed at 3-4 days
Works with zero baseline data (best-guess curve) or real data (formula-driven curve)
Computes the trajectory even when it's unrealistic — never refuses or softens it, only flags it
Handles numeric goals (pace, load, reps) and non-numeric/milestone goals (flexibility, skill work)
Any checkpoint is editable; editing one recomputes everything after it; history never rewrites
Goal duration is fully open (days to years), not locked to 3 months
Every goal type needs a documented research basis before it ships — including future ones

Governing principle: the person never picks a formula, a curve shape, or a model — the system infers that from goal type. The only manual input is ever a real result.

1. Vocabulary
Goal — target value + deadline (or duration)
Baseline — most recent known real performance, if any
Checkpoint — a scheduled forecast point with a target value
Task frequency vs. checkpoint frequency — how often the workout happens (e.g., lift 3x/week) is a separate setting from how often the forecast re-benchmarks (e.g., every 4th day). You can stretch daily but only get graded weekly.
Trajectory/curve — the full run of checkpoints, today → deadline
Logged actual vs. override — a real result vs. a hypothetical retarget (different actions, see §6)
Realism index — non-blocking flag showing how aggressive a trajectory is vs. documented data
2. Goal-type taxonomy

Three types were in your brief. I'd add three more — they're near-certain to come up and change the model needed.

Goal type	Metric	Real model	Zero-data fallback
Endurance/cardio	Pace / time-over-distance	Riegel cross-distance formula; VDOT pace system	Documented novice improvement curve
Strength/load	Weight × reps → est. 1RM	Epley/Brzycki formulas; novice linear progression	Starting-Strength-style beginner add-rate
Flexibility/mobility	ROM° or sit-and-reach, or milestone	No individual predictive formula exists — population ROM-gain data as a loose guardrail only	Milestone checklist, no number required
Body composition [Addition]	Weight / body-fat %	Energy-balance math, rate-capped	Conservative default rate
Habit/consistency [Addition]	Done/not-done streak	None — this isn't a curve, it's adherence	Day 1 = 0%, no guess needed
Skill milestone [Addition]	Staged binary steps (first pull-up, handstand)	None — ordered checklist w/ typical stage timeline	Generic staged timeline

Forcing everything into a "curve" is the mistake to avoid — habits and skills aren't performance curves, and treating them as one produces nonsense forecasts.

3. Research already done (launch domains)

Cardio. Pete Riegel published a cross-distance race-time formula in 1977 that multiplies a known time by the distance ratio raised to roughly a 1.06 power, modeling how pace predictably slows as distance grows — useful when the baseline data is a different distance than the goal (e.g., a known mile time, a 2-mile goal). Jack Daniels and Jimmy Gilbert built the VDOT system to turn one race result into a single fitness score that both predicts equivalent times at other distances and prescribes training paces, roughly 65-78% of VO2max for easy running up through 95-100%+ for intervals and reps, with most weekly volume meant to stay easy. (VDOT itself is a registered trademark — implement the method, don't use the name in-product without a license.) For the zero-data/beginner curve: beginner runners typically gain only about 5-15% in pace across their entire first year, front-loaded into the first 8-12 weeks with diminishing returns after, and standard beginner programs take about 9-12 weeks to build someone from little/no running to a continuous 5K. 
Runners Connect - + 4

Strength. Epley: 1RM = weight × (1 + reps/30). Brzycki: 1RM = weight × 36/(37 − reps) (Epley, 1985; Brzycki, 1993). Both are most reliable in the 1-10 rep range and diverge past that as fatigue and individual endurance start to dominate. For progression: the classic Starting Strength novice model has beginners adding weight to the bar nearly every session on the big compound lifts until the rate of gain naturally stalls, typically 3 nonconsecutive days a week, at which point weekly-add variants (~5 lb/week upper body, ~10 lb/week lower body) or periodization take over. For programming targets: roughly 70-85% of 1RM for hypertrophy, 85-95% for strength, and 95-100% for peaking. Your instinct here is right — this domain is unusually well documented. 
Arvo + 5

Flexibility. This one genuinely doesn't have a Riegel or Epley equivalent. Meta-analysis shows stretch training performed consistently for at least ~2 weeks measurably increases joint range of motion, with long-duration static or PNF stretching outperforming dynamic/ballistic methods, and one 10-week, 3x/week static program increased ankle dorsiflexion by about 9°, though the gain tracked more with tolerance for the stretch than any real tissue change — a broader review found insufficient evidence that even 24 weeks of stretching produces true structural change. Build this as milestone/checklist by default; offer ROM-degrees or sit-and-reach as an optional numeric proxy for users who want one, using population data only as a loose guardrail, never as a formula-driven curve. 
ScienceDirect + 2

Body composition [Research Entry — added when the 'weight' goal kind shipped]. Weight change is fundamentally an energy-balance problem. Wishnofsky (1958) established that roughly 3,500 kcal correspond to one pound of adipose tissue (454g × ~87% lipid × 9 kcal/g ≈ 3,555, rounded) — a useful short-horizon kcal↔weight conversion, but one that overestimates long-horizon change because it ignores metabolic adaptation (energy expenditure drops as weight drops); it is shown only as a secondary, caveated "≈X kcal/day implied" figure in-app, never as the rate authority. The authoritative rate cap comes from the International Society of Sports Nutrition's position stand on diets and body composition (Aragon et al. 2017, *Journal of the International Society of Sports Nutrition*, reaffirmed 2022), which recommends a maximum ~500 kcal/day deficit for lean/athletic populations, targeting 0.5–0.75% of bodyweight lost per week during a cut. For gain, natural-bodybuilding lean-bulk research (Helms et al.) recommends a slower 0.25–0.5% of bodyweight gained per week, since bulking faster than this measurably shifts the gain toward more fat and less lean mass. %-bodyweight/week is used as the authoritative unit (proportional, ISSN-native) rather than raw kcal, matching how both citations express their own guidance.
- Canonical metric + units: body weight, kg (canonical), displayed in lb/kg per the user's unit setting.
- Primary real-world formula/model + source: linear energy-balance curve (baseline → target, roughly linear over short/medium horizons) rate-capped at the %-bodyweight/week bounds above — Aragon et al. 2017 (loss), Helms et al. lean-bulk literature (gain).
- Zero-data fallback + source: same rate-capped curve, using the conservative midpoint of each cited range (0.6%/week loss, 0.375%/week gain) when no logged weigh-in history exists yet to anchor a real baseline.
- Plausible progression bounds (feeds the realism index): 0.5–0.75%/week loss (conservative→plausible boundary), 1.5× that (~1.125%/week) treated as the plausible→implausible boundary; 0.25–0.5%/week gain, 1.5× that (~0.75%/week) as the implausible boundary.
- Domain cadence/rest constraints: none physiological (a weigh-in carries no recovery requirement, unlike a hard training session) — but daily weigh-ins are noisy (water/glycogen fluctuation), so a weekly-or-coarser checkpoint cadence is recommended by default, still user-adjustable.
- Confidence tier: population-data / expert-consensus position stand — one notch below "solved" (unlike Epley/VDOT, this isn't an individual physiological law; unlike flexibility, it does have quantified, citable rate bounds).
- Reviewed-by: Claude (implementation pass), 2026-07-21 — pending Trey's sign-off per the standing governance requirement above.

4. How the curve gets built
Inputs at creation: goal type, target metric + value, deadline (or duration), cadence (default suggested, editable), optional baseline.
Zero-data path: pull the domain's fallback heuristic (§3), build the full checkpoint set, and mark the whole curve Provisional until a real result lands — at which point it immediately recalculates on the with-data path. This distinction matters: a guess and a data-backed forecast shouldn't look equally authoritative. [Addition — not in your original brief]
With-data path: anchor the real formula to the logged baseline, solve backward from (target value, target date) for the required rate, distribute across checkpoints.
Curve shape: should not default to a straight line. Cardio gains are front-loaded/diminishing-returns; novice strength gains are closer to flat-linear-per-session until an abrupt plateau; habit goals have no curve at all. Shape is domain-specific.

Worked example, your own numbers: baseline 2mi/60:00, goal 2mi/12:00, ~13 weeks, checkpoints every 3-4 days (~26 checkpoints). Solving (12/60) = m^26 for m gives roughly a 6% time-cut needed at every single checkpoint, compounding. Over one week that's ~11-12% — nearly the entire top end (~15%) of what real beginner runners gain across their whole first year. The engine still outputs this exactly. It doesn't round it off or soften it — it computes it and tags it (§7) as roughly a year of realistic progress compressed into every seven days. 
Runners Connect -

5. Cadence & calendar rules
Cadence is arbitrary per goal: daily, every N days, weekly, specific weekdays, or milestone-triggered (next checkpoint whenever the prior one is confirmed, regardless of date).
Task frequency and checkpoint frequency are separate fields, not one setting doing double duty (§1).
[Addition] Checkpoints shouldn't land on a domain-mandated rest day — strength's nonconsecutive-day rule, running's recovery window (daily running without rest sharply raises overuse-injury risk, since tissue needs about 48 hours to rebuild). Shift the checkpoint, don't force it. 
Runners Need
Any goal shorter than one cadence interval still gets a start-point and end-point checkpoint at minimum.
[Addition] Multi-month/year goals should default to a coarser suggested cadence (weekly/monthly) rather than daily checkpoint fatigue — still user-adjustable.
Calendar entries carry the actual target value ("Run 2mi — target 42:10"), never a generic label.
6. Editing a checkpoint (your core interactive ask)

Two distinct actions, not one:

Logged actual — "this is what really happened." Becomes the new real baseline for all downstream math.
Manual override — "I want to retarget this point," independent of whether it's occurred yet.

Recompute rule: everything after the edited/logged point recalculates from (new value, its date) forward to the fixed end-goal, using the same domain formula. Nothing before it moves. Editing the end goal itself (value or deadline) recomputes the entire remaining curve, not just the tail. Chained edits always recompute from the most recent touch-point forward; earlier overrides stay as historical waypoints. [Addition] A missed/unlogged checkpoint should default to "unknown" — the curve holds its last computed shape rather than silently assuming a hit or a miss.

7. Realism index

Every checkpoint gets a computed, non-blocking flag scored against the domain's plausible-range bounds from the research library — never a cap, never a refusal, purely informational, exactly as instructed. [Addition] Worth letting this flag double as a light injury-risk signal in load- and volume-sensitive domains, since the same literature that defines "realistic" also documents overuse-injury risk from too-fast jumps. Still dismissible, never gating.

8. Research governance (your standing requirement)

No goal type ships without a completed Research Entry:

Goal type name + example goals
Canonical metric(s) + units
Primary real-world formula/model + source
Zero-data fallback heuristic + source
Plausible progression bounds (feeds §7)
Domain cadence/rest constraints
Confidence tier — "solved" (running, strength) vs. "population data only" (flexibility) vs. "no formula applies" (habits)
Reviewed-by + review date

§3 above is the first three completed entries. Store this as one running "Goal-Type Research Library" doc, and re-review entries periodically — exercise-science guidance updates over time.

9. Other gaps worth building in
[Addition] Multi-goal handling: people will run cardio + strength + flexibility goals concurrently. Each gets its own independent curve, but one unified calendar view.
[Addition] Goal lifecycle: active → optional pause (injury/travel — freezes checkpoints, doesn't delete) → deadline → closed as "met" or "not met" with real final data preserved, never silently extended → optional prompt to start a follow-on goal.
[Addition] Units (lb/kg, mi/km) configurable, not hardcoded.
[Addition] A goal can track multiple metrics (weight, reps, est. 1RM) — pick one canonical metric for the forecast math, display the rest for context.
10. Edge-case checklist
Goal shorter than one cadence interval
Target or deadline changed mid-course
Real progress goes backward (injury/illness) — curve gets more aggressive for the remainder, flagged, never blocked
Multiple unlogged checkpoints in a row
Checkpoint landing on a mandated rest day
Editing the end goal vs. a mid-course checkpoint
Zero-data goal receiving its first real log
Flexibility/habit goals with no numeric baseline at all
Unit mismatch between goal entry and logged data
Concurrent goals sharing calendar space
11. Definition of done
Every launch goal type has a completed Research Entry before shipping
Zero-data and with-data paths both produce a full, dated checkpoint set to the deadline
Editing any checkpoint instantly recomputes everything after it; nothing before it changes
Calendar entries show the real target value, never a generic label
No trajectory is ever capped or softened for being unrealistic — computed and flagged, never refused
Cadence and checkpoint frequency are independently configurable, per goal, down to a specific date