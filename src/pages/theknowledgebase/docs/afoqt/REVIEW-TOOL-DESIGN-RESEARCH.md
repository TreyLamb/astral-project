# Review-tool design research — is the AFOQT engine built to last?

*For Trey's review. This is a research + recommendations document, not adopted doctrine — nothing
here changes behavior until specific items get picked and written into CLAUDE.md / webdesign.md /
PLAN.md. Written 2026-08-25 in response to: "i don't hate our design but i'm worried it isn't
going to be great to use long term."*

**Bottom line up front:** the engine already does several things research-backed tools get right,
and does at least one thing (naming distractors as error-modes) that most commercial tools don't
bother with at all. The real gap isn't the question-generation side — it's that the *review
scheduling* is a flat rate rather than an adaptive one, and there's no dedicated "just show me
what's about to fall out of my head" mode. Both are fixable without a rebuild.

---

## 1. What the research actually says makes review effective

Four findings, all with real backing, all directly relevant to a multiple-choice study tool:

**Retrieval practice beats re-reading.** Testing yourself on material — even getting it wrong —
produces better long-term retention than re-studying it. This is the whole premise of a
question-bank tool over a textbook, and it's well-established science, not a design fad.

**Interleaving beats blocking.** Mixing question types/concepts within a session, rather than
grinding one type until it's "done," produces worse *short-term* performance but meaningfully
better *long-term* retention — interleaving forces you to also practice recognizing which concept
you're even looking at, not just recalling the answer once you're told which bucket to search.

**Desirable difficulty is the mechanism behind both of the above.** Spacing, interleaving, and
retrieval practice all work by making the *practice session* harder than it needs to feel, in
exchange for the material sticking. A tool that optimizes for a smooth, easy practice session is
optimizing against the thing it's supposed to produce.

**Spaced repetition scheduling has moved past SM-2.** The old standard (SuperMemo's 1987
algorithm, still what Anki defaults to for most users) tracks a single "ease factor" per item that
can spiral downward — a genuinely hard item gets scheduled more and more often forever without
ever being judged as "probably stable now." FSRS (Free Spaced Repetition Scheduler), the current
state of the art, models *stability* and *retrievability* separately and fits its parameters to
your own review history, which lets it schedule meaningfully fewer total reviews for the same
retention. It's the 2026 default recommendation for any tool built or rebuilt now.

*Sources: [Interleaving Retrieval Practice Promotes Science Learning](https://journals.sagepub.com/doi/10.1177/09567976211057507) · [Desirable Difficulties: Bjork's 5 Principles](https://www.structural-learning.com/post/desirable-difficulties) · [Make It Stick summary](https://blog.apaonline.org/2020/02/19/takeaways-from-make-it-stick-the-science-of-successful-learning/) · [Spaced Repetition: SM-2 vs FSRS](https://kachika.app/en/blog/spaced-repetition-algorithms/) · [Spaced Repetition Complete Guide 2026](https://activerecalling.com/blog/spaced-repetition-ultimate-guide)*

---

## 2. What the successful tools actually do

**Anki / FSRS-based apps.** The whole product is the scheduler. Every card carries its own
interval, and the app's one job is showing you the right card at the right time. The lesson to
steal: review priority should be a computed property of *how close an item is to being
forgotten*, not a fixed injection rate.

**UWorld (the gold standard in medical/professional test prep).** Its distinguishing feature
isn't the questions — it's the explanations: every question, right or wrong, gets a full written
rationale, tagged by subject/system, feeding a performance dashboard that tells you exactly where
you're weak. The lesson: a wrong answer's value is almost entirely in what it *teaches you about
your specific mistake*, not the red mark.

**Duolingo-style streak/consistency mechanics.** A 7+ day streak measurably predicts continued
daily engagement, and consistency (not intensity) is what spaced repetition actually depends on —
missing days breaks the schedule far more than a short session does.

**Computerized Adaptive Testing (CAT) / Item Response Theory.** High-stakes licensing exams
increasingly select each next question based on a running estimate of the test-taker's ability,
converging on an accurate score in far fewer questions than a fixed-length test needs. This is
built for *scoring efficiently*, not for *studying broadly* — it's the right model for a exam
*simulator*, and the wrong model for a *practice/study* mode where breadth of exposure is the
actual goal.

**The one consistent warning across the gamification research:** streaks and light
consistency-tracking help; points, badges, and leaderboards are a documented double-edged sword —
one well-cited study found students in a gamified course scored *worse* on the final exam than an
ungamified control, because the game layer started competing with the material for attention
instead of supporting it. "Pointsification" (rewarding an action count instead of a learning
outcome) is the specific failure mode named in the research.

*Sources: [Best Spaced Repetition Apps in 2026](https://wordsonrepeat.com/blog/best-spaced-repetition-apps-2026) · [UWorld MCAT Prep App](https://gradschool.uworld.com/mcat/mcat-prep-app/) · [Computerized Adaptive Testing (CAT)](https://assess.com/computerized-adaptive-testing/) · [Gamification Gone Wrong](https://nerdsip.com/blog/gamification-gone-wrong-when-streaks-become-the-point) · [Streaks and Milestones for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)*

---

## 3. Honest audit — what THIS tool already does right

Checked against the actual code (`afoqt/engine/`, `afoqt/afoqtStorage.js`,
`afoqt/views/DrillRunner.jsx`, `AfoqtDashboard.jsx`), not from memory of what was planned:

| Principle | Status | Where |
|---|---|---|
| Retrieval practice | ✅ Every session is retrieval, never re-reading a fact sheet during a drill | `DrillRunner.jsx` |
| Interleaving within a subtest | ✅ `distinct: true` deals a shuffled round of the whole template pool before repeating any one — the WK Phase 3 lesson caught a 5-question gate that asked two isosceles questions and skipped the transversal entirely, and this is the fix | `engine/generator.js` `dealRounds()` |
| Desirable difficulty (item variety) | ✅ Genuinely unusual and genuinely good: a question is a *template*, not a stored string, so the same concept regenerates with different numbers/words every time (`generateInstance(templateId, seed)`). You cannot pattern-match "the third question is always 47" the way you can with a static bank — memorizing the *answer key* instead of the *skill* is structurally impossible here. This is a stronger guarantee than most commercial tools give you. | `engine/generator.js` |
| Explanation quality (UWorld's core strength) | ✅ Distractors are required to be *named error modes*, not random wrong answers — a miss reports "you read Y as ascending" or "you mixed it up with a spin, which is an aggravated stall," not just a red X. Very few commercial tools go this far; most just show the right answer. | `engine/errorModes.js`, every `templates/*/ch*.js` |
| Honest baseline / exam mode | ✅ Exam runs disable both the miss-pool weighting and training-aid templates, so a practice score can't be quietly inflated by rehearsed material — a real gap most casual quiz apps don't bother closing | `engine/drill.js` `assembleDrill({ exam: true })` |
| Spaced repetition (basic form) | 🟡 Partial — see gap #1 below | `afoqtStorage.js`, `engine/drill.js` `drawFromMissPool` |
| Consistency/streak visibility | ❌ Not built | — |
| Adaptive difficulty (CAT-style) | N/A by design — see note below | — |

**On adaptive difficulty specifically:** this tool is a *curriculum* (band 1→4 progression per
chapter, gated by test-out thresholds), not a CAT engine, and that's the right call for a study
tool — CAT exists to score someone efficiently in as few questions as possible, which is exactly
backwards from what a practice tool wants (maximum honest exposure to the material). The one place
CAT-style thinking *would* be a legitimate fit is Phase 14's exam simulator, if it's ever meant to
predict a composite score rather than just replicate the real subtest structure — worth deciding
deliberately rather than defaulting into it.

---

## 4. The real gaps

**Gap 1 — the miss pool is a flat rate, not an adaptive schedule.** Right now every subtest with
progress data draws **exactly 10%** of a drill from the miss pool (`MISS_INJECTION_RATE` in
`afoqtSpec.js`), regardless of whether a template was missed once last week or five times in a
row this morning. A concept you keep failing gets the *same* resurfacing priority as one you
missed once and probably already have. This is the single most impactful place to close the gap
with FSRS/Anki without anywhere near the engineering cost of a full IRT-style scheduler — a
lightweight per-template "strikes" or "days since last success" weight inside
`drawFromMissPool`'s selection would get most of the benefit.

The "resurface until right on 3 separate days" rule already gives this tool something Anki's raw
SM-2 doesn't have out of the box (a graduation requirement, not just an interval) — the piece
that's missing is *priority ordering* among everything still ungraduated, not the graduation logic
itself.

**Gap 2 — there's no dedicated "review what's about to fall out of my head" mode.** The miss pool
only ever appears diluted at 10% inside an ordinary drill; `DrillConfig.jsx` has no "drill just my
misses" option next to the subtest/count/timing choices. UWorld and Anki both make this the
*primary* mode, not a side ingredient. This is a small, additive UI change (a new drill source
in `assembleDrill`, a button in `DrillConfig.jsx`) — not a redesign.

**Gap 3 — no consistency/streak visibility.** `AfoqtDashboard.jsx` already shows a test-date
countdown and per-subtest accuracy, which is good bones, but nothing shows "you've studied N of
the last 7 days." Given the research specifically separates *streaks* (net positive, cheap, low
psychological risk for an adult professional-exam context) from *badges/leaderboards/points*
(the documented double-edged sword), the recommendation is narrow: a simple calendar-heatmap or
day-streak counter, nothing gamey layered on top. Given the 5-week runway to test day, this is
also directly useful as a "did I actually study yesterday" signal, not just a dopamine hook.

**Gap 4 — the dashboard recommends the next chapter, not the highest-leverage action.**
`nextChapter` in `AfoqtDashboard.jsx` always points at the next unfinished chapter in curriculum
order. That's reasonable as a default, but with ~5 weeks left and MK/TR already flagged in the
dashboard's own copy as carrying the most composite reach, a "what should I actually do today"
recommendation that weighs *composite reach × current weakness × days left* would be more useful
than pure curriculum order once more subtests are built out. This is the most speculative
recommendation here — worth prototyping, not necessarily worth committing to.

---

## 5. Recommendations, roughly in cost order

**Cheap, clearly worth doing:**
1. A "drill my misses" button/mode in `DrillConfig.jsx`, using the existing miss pool at 100%
   selection instead of 10% dilution.
2. A streak/consistency indicator on `AfoqtDashboard.jsx` — day-count or calendar-heatmap only,
   no points/badges/leaderboard.

**Medium — real value, real but bounded engineering:**
3. Replace the flat 10% miss-pool rate with a lightweight priority weight (recency of last miss,
   consecutive-miss count) inside `drawFromMissPool`. Not a full FSRS port — a small scoring
   function on top of what's already tracked in `templateStats`.
4. A "what to do today" recommendation on the dashboard that factors composite reach and current
   weak spots, not just curriculum order — worth prototyping once more subtests exist to make the
   weighting meaningful.

**Not recommended:**
5. Points/badges/leaderboards. The research is fairly consistent that this actively risks the
   thing the tool is for, and it doesn't fit a serious adult exam-prep context anyway.
6. A full IRT/CAT engine for the practice/drill mode. Right tool for a scoring-efficient exam,
   wrong tool for a study tool whose whole point is broad honest exposure. Worth a deliberate,
   separate conversation only if the exam *simulator* (Phase 14) is ever meant to predict a
   composite score adaptively rather than replicate the real subtest structure.
7. Migrating to a full Anki-style per-card FSRS scheduler. The current template/seed model
   already solves the problem FSRS is mainly fighting (answer memorization from a static card) in
   a stronger way than card-based FSRS does — a full port would be solving an already-solved
   problem at real engineering cost for a marginal gain over recommendation #3.
