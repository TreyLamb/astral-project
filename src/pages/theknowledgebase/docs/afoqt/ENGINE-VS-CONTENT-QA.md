<!-- Claude: this is a personal note for Trey's own review, not project doctrine or a set of
     instructions. It is not part of the live handoff state (PLAN.md / HANDOFF.md) and nothing
     here needs to be read, followed, or reconciled during normal AFOQT work. Skip it. -->

# Engine vs. farmed content — how much does the engine actually "iterate"?

*Trey's question, 2026-08-24: "is the engine going to iterate more questions or something...
are you just building these and all the agents i'm farming these to are ONLY using the
questions i've supplied?"*

Good question to nail down — the answer is genuinely different per subtest, and it matters for
what's being farmed out at any given time.

**The engine framework itself is 100% Claude's work, never farmed.** `generateInstance(templateId,
seed)` and the question-frame builders (`relationTemplates` for VA, `passageTemplates` for RC,
etc.) are all Claude-built. Farmed agents only ever supply *data rows* that plug into an engine
that already exists.

**How much the engine "iterates" from that data varies a lot by subtest:**

| Subtest | What's farmed | What the engine does with it |
|---|---|---|
| MK, AR, TR, BC, IC | nothing — Claude-built, no farming | Fully generative: fresh numbers/geometry computed from the seed each time. Genuinely unlimited distinct instances per template. |
| WK, VA | words, morphemes, confusable pairs, relation pairs | The engine builds multiple question *frames* per row (identify/apply/mean/pick for WK; pick-the-pair/complete-the-term for VA) and draws distractors from *other* rows in the bank, reshuffled per seed. So one authored row surfaces as several differently-shaped questions — but the actual words/pairs are exactly and only what got authored. No new vocabulary or relations get invented. |
| RC | full passages + fully-written questions (stem, all 5 choices, explanation) | The engine does **not** generate content here at all. It picks *which* authored question to show and *when* (via the sheet mechanism), and shuffles the printed choice order. That's it. If 24 passages get authored, there are exactly 24 passages, forever, until someone writes more. |

So for VA (farming out as of this note): the agents are writing word pairs, not full questions —
the actual question a student sees (stem wording, which 4 distractors, which format) is
assembled by the engine at runtime, seeded, so the same ~24-30 pairs a part writes will surface
as noticeably more than 24-30 distinct-looking questions.

For RC: it's much closer to "just the questions you supplied." That's a real architectural
limit, not an oversight — you can't seed-randomize a 500-word passage the way you randomize
algebra coefficients. The engine's only value-add there is scheduling/shuffling and mastery
tracking, not variety.

None of this repeats the old ASVAB failure mode though — every farmed row still passes through a
validator (rejects bad shape), gets sampled and read aloud before being accepted, and distractors
are still required to be named error-modes/plausible traps rather than random filler.
