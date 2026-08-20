# AFOQT Study Tool — Project Contract

Trey's requirements, captured as close to verbatim as possible. When a build decision is
ambiguous, this file wins over inference.

---

## Why this exists

TKB was a rapid-fire self-graded flashcard tool. An ASVAB deck was bolted on, got polluted
during bulk import, and **Trey stopped using it**:

> "When creating the ASVAB questions the TKB questions got convoluted and a lot of
> unrelated questions got added that made me never end up using the tool."

The audit backs this up: of 786 ASVAB questions, **258 are junk** (Open Trivia DB / Trivia
API / MMLU imports — *"What are male cows called?"* under Physical Science, a
1,199-character AP Physics C problem under Mechanical Comprehension), ~60 more are
misfiled, and difficulty was assigned per-block rather than per-question.

The pivot: **the target is now the AFOQT, not the ASVAB.**

---

## The requirements

| # | Requirement |
|---|---|
| 1 | **Claude owns the curriculum.** *"YOU are the designer of this curriculum and I am going to put in 100% effort studying. If I fail it's because you set me up to fail."* |
| 2 | Research the real AFOQT; find practice tests; match real difficulty and subject matter. |
| 3 | **Keep the flash-review modality, ADD a semi-curriculum** of chapters. *"Don't start too easy like 5 year old child knowledge."* Build math up *"like a math teacher would for their class."* |
| 4 | Re-use existing questions; expect many new ones. Label genuinely-sourced real questions — *"Not big and gawdy and in your face, just labeled somewhere."* |
| 5–6 | **Each subject gets its own phase.** Expect usage limits across multiple sessions. Requires a project doc, a handoff plan doc, and whatever else survives a session break. |
| 7 | **Keep ASVAB alive** on its own sub-page. Copy the good stuff across. *"the point is, we are keeping the asvab stuff not overwriting it all."* |
| 8 | **The Question Iteration Doctrine** — see `QUESTION-DOCTRINE.md`. Trey: *"make THIS part of the CORE of the documentation/memory."* |
| 9 | **Build around time limits**, with an option to tighten below real to increase difficulty. |
| 10 | Script/generate wherever possible — *"This should be like 90-100% automatable so theoretically we can end up with an infinite amount of questions so no test is ever identical but all tests would feel like identical to a true AFOQT test."* |
| 11 | Trey personally pulls real questions from gated sources. Outside AIs may generate bulk content. **Not everything must be automated** — *"It's not a failure if some of this can't be automated."* |
| 12 | **Adaptive miss pool** — auto-track misses, resurface ~10% more often, support clean-slate reset. *"An ever-changing ever-adjusting review-test."* |

---

## Context that shapes the build

**Timeline.** ~6 weeks. Trey explicitly declined to have the build reshaped around it:

> "I don't see why you need to build anything differently based on the timeframe. If you
> set it up with the correct information then i will just have to dedicate time to
> studying it. It's not like we are cramming 100 credit-hours of college classes into 6
> weeks. I should know 80% of all the information alreadY! a lot of this is making sure i
> understand where i'm weak and have an understanding of how the test feels."

→ The two headline features are therefore the **diagnostic** and the **faithful timed
simulator**, not raw question count.

**Composites.** All of them. *"I want to absolutely dominate on all the topics even if
i'll never use them."*

**Math.** Algebra 2. *"I got better at math the harder the math got (was FORCED to
understand the intricacies)."* 97th percentile on an ASVAB pretest; *"decently rusty."*
→ ASVAB-grade math is the **warm-up floor**, not the target.

**Geometry is the weak spot.** *"My geometry is probably one of my weakest subjects. If
there is geometry, that may be where we need some extra foundation."*
→ Geometry gets **three** chapters, taught from foundations, not refreshed.

**No front-loading.** *"Don't focus too much on any one thing. just build them all out so
if i was asked a question about any of the subjects that i would be able to answer it. I
don't want to plan to have weaknesses or to worry about front loading."*
→ Phase order is a **risk hedge** (if interrupted, what is missing is unscored material),
**not** a prioritisation. Everything gets built.

**Boredom is a real risk.** *"It can't take too long or i wont't have time or might get
bored and give up on the tool, but obviously it needs to be 'ENOUGH'."*
→ 34 chapters, ~11 h if every word is read, **~6–7 h expected** thanks to test-out gates.
Any chapter that cannot justify 20 minutes gets **cut**, not padded.

---

## Non-negotiables

1. **Never repeat the ASVAB pollution.** Every question traceable to a template, a band,
   and a chapter. `afoqt:selftest` and `afoqt:coverage` fail the build, not a review pass.
2. **Never delete ASVAB content.** Soft-retire only, restorable from Settings.
3. **Never ship verbatim commercial question text** — this deploys publicly. See the
   copyright section of `QUESTION-DOCTRINE.md`.
4. **Never claim a source is unavailable without searching for alternatives** — repo-wide
   rule, see root `CLAUDE.md`. Escalate paid/keyed options as a question.
5. **Mark every agent-initiated omission or downgrade with ✂️** so Trey can scan for it.

---

## Out of scope

- The existing general-knowledge TKB (`/TKB`, `/TKB/review`, `/TKB/subjects`,
  `/TKB/settings`) is **not** redesigned. All new behaviour is additive.
- ✂️ The Self-Description Inventory gets an explanatory chapter but **no drills** — it is a
  personality inventory with no correct answers.
