# The Question Doctrine — READ THIS BEFORE WRITING ANY QUESTION

This is the binding contract for every question that enters the AFOQT module. It exists
because the ASVAB deck that preceded it was polluted into uselessness by bulk import, and
Trey stopped using the tool as a result. **Both rules below come directly from him.**

If you are a fresh session, an outside AI, or a subagent: read this file completely before
generating a single question.

---

## RULE 1 — Iterate at the SAME difficulty (Trey's words)

> Take one question and produce more versions **of the same question**.
>
> If a question is `2 + 2 = ?`, the iterations are `3 + 4`, `1 + 3`, `4 + 1`.
> They are **NOT** `2 × 354`.
>
> If `2 × 354` needs practice, it is a **different question** that gets its **own**
> iterations.
>
> Given a 100-question sample test, the expected yield is ~500 questions:
> ~50 distinct question types × ~10 iterations each.

### Why this is architectural, not advisory

The unit of content is a **template**, not a question. A template carries a difficulty
`band` and emits unlimited instances **inside that band**:

```js
{
  id: 'mk-linear-one-step',
  subtest: 'MK',
  band: 2,                    // 1–5. THE RULE, MADE STRUCTURAL.
  timeSec: 24,
  calibratedAgainst: 'barrons',
  provenance: { kind: 'derived', source: '…', url: '…' },
  generate(rng) => ({ stem, choices, correctIndex, explanation, tags })
}
```

A harder question **requires a different template**, which forces a conscious placement on
the difficulty ladder. The `2+2 → 2×354` jump becomes structurally impossible rather than
something a tired author has to remember at 1 a.m.

### Distractors must be ERROR MODES, not noise

Every wrong choice must be the answer produced by a **specific plausible mistake**:

| Mistake | Distractor |
|---|---|
| Sign error | `-7` when the answer is `7` |
| Forgot to halve | `bh` instead of `½bh` |
| Radius vs. diameter | area using `d` not `r` |
| Off-by-one row | the adjacent cell in Table Reading |
| Reversed bank | the inverted-pointer aircraft in Instrument Comprehension |

**Randomised numeric distractors are forbidden.** They are trivially eliminable, they
teach nothing, and they make a question look harder than it is. This reasoning is why
templates are hand-written by Claude and **not** farmed out to bulk generation.

---

## RULE 2 — Relevance / Traceability (Trey's words)

> "If there's a biology question about *how many chromosomes do humans have* and your
> chapter intro asks *what is an organelle?* and nowhere else are organelles ever
> discussed — that is an unrelated question."
>
> "A chapter review does not need to be all-inclusive; however, if it is likely a question
> may veer into that territory, it is better to cover edge cases than to oversimplify.
> **The rule of the game is OVERPREPARE intelligently.**"

### Enforced by `npm run afoqt:coverage` — bidirectional

1. **No orphan lesson content.** Every concept a chapter teaches must map to ≥1 template
   or fact row in that chapter's pool. If nothing tests it, it is not taught.
2. **No untaught question.** Every template and fact row must be covered by some chapter.
   A question must never test something the curriculum never presented.

The check fails the build if either direction breaks.

### Why this makes "overprepare intelligently" self-policing

If an edge case is worth teaching, the rule **forces you to write the template that tests
it**. If it is not worth writing a question for, it does not belong in the lesson.
Breadth is encouraged — it just has to be paid for in questions.

Chapters declare concepts explicitly so the check has something to run against:

```js
{ id: 'av-04-instruments',
  concepts: ['pitot-static-system', 'gyroscopic-instruments', 'blocked-pitot',
             'blocked-static', 'ias-cas-tas-gs'],   // every one MUST be tested
  templates: ['av-instrument-id', 'av-instrument-failure', …] }
```

---

## Difficulty calibration — use the ladder, not your judgement

Three reference books, graded by a real test-taker, are the rulers. Files live **outside
the repo** at `G:\My Drive\`.

| Anchor | Book | Rule |
|---|---|---|
| **FLOOR** | `The Complete AFOQT Study Guide 2020-2021.epub` | *"way too easy"* — never fall to this level |
| **TARGET** | `Military Flight Aptitude Tests _ Barron's.pdf` | *"most accurate all around"*; math/verbal slightly harder than real, aviation/science at-level. **Aim here.** |
| **CEILING** | `AFOQT practice test book 2021-2022 … Trivium` | *"crazy difficult considering the time constraint"* — never exceed |

Every template records `calibratedAgainst`.

### Trivium is a PACE problem, not a CONTENT problem

The complaint is literally *"crazy difficult **considering the time constraint**"*, and the
official AF curriculum confirms **no calculus and no trigonometry** exist on the real test.
So Trivium items are the right topics with heavier algebra that eats clock. Therefore:

- Trivium-band templates are tagged **`stretch: true`** and **default to untimed/extended**.
  They build concept margin.
- **Pace training runs on Barron's-band items only.** Drilling a 2-minute problem against a
  53-second clock rehearses failure, not speed.
- Never mix them in one drill. *Learn it hard, then run it fast.*

---

## ⚖️ Copyright — the hard line

**This site deploys publicly to Vercel.** The risk is not where a PDF sits on disk; it is
**content reaching a public deployment**.

| | |
|---|---|
| ✅ | Read commercial items → set difficulty bands → **generate new questions**. Shipped output is our templates. |
| ✅ | Extract **topic distribution / coverage facts** — facts, not expression. |
| ✅ | Trey reads the books himself as ordinary study. |
| ❌ | **Never** ship verbatim commercial question text into the app or commit it to the repo. |

**Official AF material is the exception and the reason `provenance.kind: 'real'` can exist
at all.** OATTS answer keys and the AFPC pamphlet are government work cleared for public
release (AFRL 2025-4499). Those ~100 items may ship verbatim with attribution.

> **Official material supplies the questions we publish.
> Commercial books supply the ruler we calibrate against.**

---

## Provenance labelling (Trey: "not big and gawdy, just labeled somewhere")

Rendered as a small chip in the existing `.tkb-card-meta` row — same visual weight as the
difficulty/tag chips already there.

| `kind` | Meaning | Chip |
|---|---|---|
| `real` | Verbatim published question (official sources only) | `real practice question` |
| `derived` | Generated by a template calibrated on a specific real question | `modeled on: <source>` |
| `authored` | Written from the topic spec, no single real anchor | *(no chip)* |

`source` + `url` stored on every `real`/`derived` item so Trey can open the original and
check calibration himself — that is the point of the label.

---

## Automation honesty

Trey estimated "90–100% automatable" on the fly and later said explicitly that **not
everything has to be automated, and hand-authoring is not a failure.** Real figures:

| Subtest | Automatable | Note |
|---|---|---|
| Table Reading | **100%, genuinely unbounded** | The only truly infinite subtest |
| Math Knowledge | ~100% | Generator computes the answer — math is never wrong |
| Arithmetic Reasoning | ~95% | Slot-filled word problems |
| Block Counting | ~95%, **bounded** | Low thousands of readable configurations |
| Word Knowledge | ~95% | Needs the word list (data) |
| Instrument Comprehension | ~90%, **bounded ~240 attitudes** | Silhouette art may need authoring |
| Verbal Analogies | ~90% | Needs the relation-pair DB (data) |
| Physical Science | ~70% | Numeric templatable; concepts need a fact table |
| Aviation Information | ~60% | Mostly fact table |
| Reading Comprehension | ~20% | Passages must be written |
| Situational Judgment | ~10% | Must be authored |

**Do not claim "infinite" for anything but Table Reading.**

---

## Before you ship any batch

```
npm run afoqt:validate    # schemas, bands in range, no duplicate keys
npm run afoqt:selftest    # 200 instances/template: one correct answer, no duplicate
                          # choices, answer independently recomputable, stem uniqueness
npm run afoqt:coverage    # bidirectional traceability (Rule 2)
```

`afoqt:selftest` is the structural defence against repeating the ASVAB pollution: a
template that emits a broken question **fails the build** rather than reaching a study
session.
