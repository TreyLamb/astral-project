---
name: question-engine-quality
description: The quality bar for ANY question generator in this repo (every AFOQT subtest, the CHEM and other course engines, and every future test built on an engine). Use it whenever you create, extend, audit or report on question templates/generators, banks, drills or practice tests. Trey has had to say this a dozen times; do not make him say it again.
---

# Question-engine quality bar

Trey, 2026-10-25, verbatim: *"The engine and the templates being bad: this is reoccurring. I've brought it up a dozen times
now. I'm tired of agents building shallow flimsy templates. I should be able to say 'I want a 100 question test on ONLY this one
thing, vertices' and theoretically get 100 questions that never repeat and vary as much as possible. Questions that would be
seen on a real test, not garbage worded weird to make '1 more' unique question."*
And: *"This is a general comment for every single section of my AFOQT and/or future tests we build with engines."*
Also: *"I SHOULDN'T HAVE TO ASK THIS."* Apply this to everything, unprompted.

## Words (use them exactly, with the unit every time)

- **Engine** = the machinery that deals unlimited questions: `afoqt/engine/generator.js`, `drill.js`, `bank.js` (and
  `courses/chem/engine/`). It already exists. Do not rebuild it, build **into** it.
- **Generator** (the code calls it a *template*) = one program that draws a figure/case at random and prints a question. A
  generator is NOT a question and NOT a sentence with numbers swapped.
- **Variant** = the structural kind one instance drew (which shape, which part is hidden, which direction is asked, which context).
  Generators report it (`variant:` on the instance) so a drill can spread across variants and the audit can count them.
- **Topic** = a concept id (`polygon-vertices`, `ar-work-headcount`). Trey drills by topic ("Build by topic" in the drill screen).
- Never conflate: *generators*, *variants*, *distinct questions*, *answer choices*, *written bank items* are five different numbers.

## The acceptance test: "100 questions on one topic"

For every topic you build or touch, run:

    npm run afoqt:concept-audit -- --concept=<concept-id> --n=100 --out=<scratch>/run.md

It must show: 100/100 distinct stems; **zero** repeats of the same figure with the same numbers; **many** distinct variants; no
single variant dominating; **every generator reports a variant**. Then **READ the written run**: no weird wording, no figure bigger
than a person would sketch, no question you would not expect on a real test. Structural checks never catch awkward prose; reading does.
Pin the guarantees in a vitest (see `afoqt/templates/mk/ch12b-coordinate-shapes.test.js`). `npm run afoqt:audit-all` ranks every
topic in every subtest by how weak it is: run it before claiming any subtest is "filled out".

## What "rich" means (all of it, before you ship)

1. **Map the whole family first.** Write down every kind of question a real test could ask about the topic: forward, inverse, "which
   of these could be", find-the-unknown, compare, count, classify, each shape/case/setting. If you only built the one thing the user
   mentioned, you built a fraction. A real test's item is usually one member of a family you were not told about.
2. **Model it as data.** Shapes, cases, scenarios as objects the generators draw from, not sentences. See `templates/mk/shapes.js`.
3. **Vary every axis:** the figure or case; its orientation/position (tilted, any quadrant, any hidden part); labels and names;
   3+ natural phrasings of each question; the setting (a person, a crew, a machine, a pump); the direction of the question.
4. **Real-test realism.** Sized for pencil and paper at the subtest's seconds-per-question (`engine/afoqtSpec.js`). Small whole
   numbers, whole answers, plain wording a test writer would use. Never reword a question only to make a new unique string.
5. **Distractors are named error modes**, never random numbers: over-supply them, dedupe, never pad, never a decimal among whole
   numbers, no distractor equal to the answer, no two equal to each other. Label them (`{ value, error, why }`) where the mistakes are repeatable.
6. **Compute every answer two ways** (a rule, then an independent check) and throw on disagreement. The 8000-sample selftest then
   doubles as a correctness test.
7. **Teach what you test, test what you teach.** One lesson section per new kind; concept ids in `curriculum/chapters.js`;
   `npm run afoqt:coverage` must hold in both directions.
8. **Calibrate honestly.** Use the real-test debrief (`docs/afoqt/PLAN.md`), the ruler books and official samples. Do not claim
   calibration you did not do (leave `calibratedAgainst` off) and **never write "this is not on the real test"**: the old comment
   that work-rate "appears in NO official AFOQT material" was false, and Trey's real test had it.
9. **Depth is not template count.** Report real units (distinct questions, variants, sittings before a repeat), not "96 templates".

## Process, in order

1. Read `src/pages/theknowledgebase/CLAUDE.md` (the "YOU ARE THE TEST CREATOR" section) and `docs/afoqt/QUESTION-DOCTRINE.md`.
2. Audit what exists (`afoqt:concept-audit`, `afoqt:audit-all`, `engine/inventory.js`). State the gap as numbers.
3. Map the family, build generators with variants, write the lesson sections.
4. Verify: `afoqt:selftest -- --samples=8000`, `afoqt:coverage`, `npx vitest run`, the 100-question audit at three seeds, read the run.
   If you touched the drill screen, drive it in a browser (Playwright is installed; start `npm run dev -- --port 5199`).
5. Report plainly: what was thin, what you built, the audit numbers, what is still weak. Mark omissions with ✂️. A thin
   subtest is your failure to fix, not a fact to report.

## Mistakes already made (do not repeat)

- Vertices: six one-sentence generators and a rectangle and a parallelogram; Trey: "same 7 questions over and over". Rebuilt as a family.
- Work problems: ONE generator (~64 possible stems), no headcount × time, no fill-and-drain, no partial work, plus a comment denying the topic was tested.
- Decimal distractors among whole numbers; coordinates far bigger than anyone would draw; "ABC and one more point are the vertices".
- A single-variant generator dealt ten times into a 100-question run.
- Reporting "N templates" as if it were depth; a doc claiming a subtest was complete without measuring it.

## Current state and the worklist

`src/pages/theknowledgebase/docs/afoqt/ENGINE-QUALITY-HANDOFF.md` is the live handoff (what is done, the honest per-subtest state, the
prioritized worklist, the traps). `docs/afoqt/ENGINE-AUDIT.md` is the scoreboard `npm run afoqt:audit-all -- --write` regenerates. Read both before you start.

## Where things live

`src/pages/theknowledgebase/afoqt/`: `engine/` (generator, drill, bank, inventory, afoqtSpec), `templates/<subtest>/` (generators),
`curriculum/` (chapters.js + lessons), `views/DrillConfig.jsx` (by topic / by type), `docs/afoqt/` (PLAN.md is the live state).
Scripts in `scripts/`: `afoqtSelftest`, `afoqtCoverage`, `afoqtSample`, `afoqtConceptAudit`, `afoqtAuditAll`.
Course engines (CHEM and others) follow the same bar: `src/pages/theknowledgebase/courses/`.
