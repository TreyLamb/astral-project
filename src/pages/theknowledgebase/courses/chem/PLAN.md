# Chem 1 curriculum — live handoff state

Built 2026-08-28 at Trey's request: "Build a curriculum based on chem 1 for now, and then build
the repeatable quizzes for each curriculum, and then the base for the mass-review mass-study
version of tests." Mirrors AFOQT's proven gate → lesson → drill → mastery pattern (see
`afoqt/HANDOFF.md` and `afoqt/afoqtStorage.js`'s header), scoped to CHEM 1210 / Chem 1
(first-term general chemistry). Full architectural reasoning: `courses/PLAN.md`'s 2026-08-28
entry and the plan file this was built from.

## Why a separate module from AFOQT

AFOQT's real engine (`afoqt/engine/generator.js`, `drill.js`, `afoqtStorage.js`) carries a lot
of AFOQT-only machinery Chem doesn't need — figure-sharing (`SHEET_BITS`), `stretch`/ceiling
bands, miss-pool sibling/exact resurfacing, bank-mixing, composite/exam pacing. Bolting a fake
"CHEM" subtest onto AFOQT's registry would also corrupt `afoqt:coverage`/`afoqt:selftest`,
which are hardcoded to the 12 real AFOQT subtests. So this is a parallel, smaller module that
copies the *pattern*, not the code — same relationship Courses' Tier 2 generator already has to
AFOQT's (see `courses/DATA-MODEL.md`).

## Answering the "does AFOQT already have this" question

**Yes, and it was never a gap.** `afoqt/views/ChapterView.jsx`'s step 3 ("Drill") is explicitly
unlimited and untethered from the test-out gate — failing the gate never locks the Lesson or
Drill steps, both stay reachable and repeatable indefinitely. Chem's `ChemChapterView.jsx`
copies this exactly. No AFOQT change was needed; this was confirmed by reading the code, not
assumed.

## Folder map

```
courses/chem/
  PLAN.md                 — this file
  curriculum.js            — pure data: 9 chapters (Toolbox + Ch1-8), concepts, prereqs.
                             Concepts are grounded in the ACS study guide's own "Knowledge
                             Required" tags per Study Question — never the question text itself.
  lessons.js + lessons/*.md — one original lesson per chapter, ?raw-imported (mirrors
                             afoqt/curriculum/lessons.js)
  chemStorage.js           — progress: chapterState/recordTestOut/recordMastery/
                             MASTERY_THRESHOLD (0.80), local + Firestore (users/{uid}/chem/progress)
  ChemApp.jsx              — shell, context provider (mutate/recordRun), nested <Routes>
  engine/
    generator.js           — registerChemTemplate/generateChemInstance/h.choices — ported
                             subset of afoqt/engine/generator.js, 4-choice only, no sheet/
                             stretch/stemSpace/provenance
    drill.js                — buildChemDrill: distinct round-dealing + stem-dedup retry, no
                             miss-pool/bank-mixing/figures
    selftest.mjs            — plain-node QC: per-template sample check (valid/distinct choices)
                             + bidirectional concept coverage, mirrors afoqt:selftest/:coverage
    templates/<chapter>.js  — one file per chapter, self-registering; templates/index.js is
                             the barrel
  views/
    ChemCurriculumMap.jsx  — chapter list, lock/progress (mirrors CurriculumMap.jsx)
    ChemChapterView.jsx    — gate → lesson → drill → mastery (mirrors ChapterView.jsx)
    ChemDrillRunner.jsx    — runs one session; `chapter` param absent = cross-chapter (mirrors
                             DrillRunner.jsx, stripped of AFOQT pacing/sweep/composite bits)
    ChemPractice.jsx       — the "mass review" base: no chapter scoping, pulls from every
                             registered template. Deliberately NOT a timed exam simulator —
                             that's real scope for later, layered on top the way AFOQT's
                             ExamRunner sits on top of DrillRunner
  Chem.css                 — prefix chq-, inherits --tkb-* tokens (ported subset of Afoqt.css)
```

Routes (under `/TKB/courses/chem`, wired into `CoursesApp.jsx`): `/` (map), `/:chapterId`
(chapter), `/drill/run` (runner), `/practice` (mass-review config). Reachable from
`CourseDetail.jsx`'s "Study & quiz material" section when `course.code === 'CHEM 1210'`.

## STATUS BOARD

| Piece | Status |
|---|---|
| Engine (generator.js, drill.js, selftest.mjs) | ✅ DONE, verified against Toolbox chapter |
| Curriculum data (9 chapters, concepts grounded in the ACS guide) | ✅ DONE |
| Storage (chemStorage.js, local + Firestore) | ✅ DONE |
| Views + routes + CourseDetail link | ✅ DONE, manually click-tested (Playwright) end to end: link → map → chapter → lesson → drill → summary → mass review |
| Toolbox chapter content (8 templates + lesson) | ✅ DONE, authored directly, selftest-clean |
| Ch 1-8 content (templates + lessons) | ✅ **DONE 2026-08-28** — 88 templates total across all 9 chapters, selftest-clean at 10,000 samples/template, every concept covered both directions, verified end-to-end in a real browser (chapter view, lesson, drill, mastery, mass review). See "Content authoring notes" below. |

## Content authoring notes (2026-08-28)

All 9 chapters (Toolbox + Ch 1-8) are built: 88 templates, 9 lessons, every curriculum concept
tested by at least one template and every template's concepts declared by its chapter (no
orphans either direction — `selftest.mjs` enforces this structurally, same as `afoqt:coverage`).

**How it was built:** Toolbox authored directly first, to prove the pipeline end-to-end. The
remaining 8 chapters were dispatched to 8 parallel `sonnet`-model agents, each given: the exact
`Template`/`h.choices` contract, the worked Toolbox example, its chapter's real concept list
(grounded in the ACS study guide's own "Knowledge Required" tags — never the guide's question
text), and the same-difficulty/named-error-distractor/no-verbatim doctrine. **3 of 8 agents were
cut off mid-run by an account-level session usage cap** (unrelated to this task — a shared
resource limit, not a bug). Ch3, Ch4, Ch5, Ch7, Ch1 landed cleanly from their agents. Ch6 had a
complete, correct template file from its agent but no lesson (written directly afterward). Ch2
and Ch8 hadn't started writing at all when cut off — both were authored directly afterward,
same standard as everything else, then run through the same self-verification.

**A real, recurring bug worth flagging for future template authoring:** several early submissions
(both agent-written and hand-written) built a "wrong" distractor by taking the correct answer
string and mutating it with a regex — e.g. swapping which subshell owns a superscript, or
stripping `4s²` out of an electron configuration with a pattern keyed to ASCII `\d` digits. Two
concrete failures this produced, both caught only by actually printing generated instances and
reading them, never by the structural selftest:
1. A regex that consumed part of a Unicode superscript run but not all of it produced a visibly
   garbled string (`...4s²⁶`) — not a plausible wrong answer, just a typo-looking string.
2. A regex keyed to ASCII `\d` silently failed to match the Unicode superscript digits actually
   used (⁶⁷⁸...), so the "mutation" was a no-op — the distractor came out identical to the correct
   answer and got silently deduped away by `h.choices`, permanently losing that error-mode with
   no visible symptom (fewer choices than intended, not a crash).

**The fix, applied everywhere it was found:** hand-write the wrong string as its own explicit
value alongside the correct one, rather than deriving it by mutating the correct string at
runtime. This is slightly more typing per template but eliminates the entire bug class — a
selftest can confirm choices are *structurally* distinct, but it cannot tell a garbled string
from a real one, or notice that two strings that look different in source are byte-identical
once template-literal interpolation runs. **Read the actual generated output, not just the
selftest's exit code, before trusting a template that builds a distractor by transforming the
correct answer's string rather than stating it directly** — this cost real review time across
three separate templates in this one session.

## Known content gaps / deliberate scope cuts (✂️)

- **No figures.** All questions are text-only. Lewis structures, VSEPR geometry, phase
  diagrams etc. are described in words rather than drawn — a real constraint of the current
  engine, not an oversight. AFOQT's `render`/`Figure` system could be ported later if this
  becomes a real limitation, but wasn't built now (no request for it, and it's a genuinely
  separate chunk of work — see `afoqt/CLAUDE.md`'s figure-rendering notes for what that took).
- **Mass review has no timed-exam mode.** `ChemPractice.jsx` is deliberately just "the base" —
  question count + cross-chapter mixing, no clock, no per-subtest pacing simulation. Trey's own
  words: "the base for the mass-review mass-study version of tests." A stricter simulator is
  real, separate scope if he asks for it later.
- **Chem 2 (second-term material, Ch 9-16) is not built.** Trey scoped this explicitly to
  "chem 1 for now." The ACS guide's own chapter split (confirmed, `courses/PLAN.md`'s
  2026-08-28 entry) makes extending this to Chem 2 later a repeat of the same pattern, not a
  redesign.
- **No real captured questions (a "bank"), unlike AFOQT's 89 official OATTS items.** Every Chem
  question is procedurally generated from a template; there is no equivalent of AFOQT's
  hand-transcribed official-question bank. Not asked for, and the ACS guide's own SQ/PQ items
  are copyrighted commercial content — see courses/PLAN.md's 2026-08-28 entry for the "ruler,
  not corpus" handling that applies if this is ever revisited.
