# AFOQT — Project Skeleton & Polish List

**Rewritten 2026-08-27, replacing the old PART-by-PART farming board.** Every PART on that
board (33 of them, Phases 0-14) is done — there's no more construction work to farm out, so
the packet/prompt/board format that board used no longer serves a purpose. Full historical
detail — design records, hard-won engine bugs, per-PART verification notes — is preserved
in `HANDOFF-ARCHIVE.md`, worth opening only if you're modifying the VA/RC/SJT/exam engines
and want the reasoning behind a specific decision. `PLAN.md` is still the live session
handoff — read it first in a new session.

---

## 1. What's built

All 12 scored/unscored AFOQT Form T subtests are content-complete and drillable.

| Subtest | Code | Templates | Feeds composites |
|---|---|---:|---|
| Math Knowledge | MK | 82 | Pilot, CSO, ABM, Academic, Quantitative |
| Arithmetic Reasoning | AR | 37 | Academic, Quantitative |
| Word Knowledge | WK | 36 | CSO, Academic, Verbal |
| Verbal Analogies | VA | 28 | ABM, Academic, Verbal |
| Reading Comprehension | RC | 12 | Academic, Verbal |
| Table Reading | TR | 6 | Pilot, CSO, ABM |
| Instrument Comprehension | IC | 6 | Pilot, ABM |
| Block Counting | BC | 5 | CSO, ABM |
| Aviation Information | AI | 64 | Pilot, ABM |
| Physical Science | PS | 48 | none (unscored) |
| Situational Judgment | SJ | 6 | none — disputed, treat as probably-scored |
| Self-Description Inventory | — | n/a | **not built as a tool** — see §3 |

330 templates total, 63 curriculum chapters, 742 lesson-minutes, 251 concepts.
`npm run afoqt:coverage` confirms every concept a chapter teaches is tested and vice versa
(Doctrine rule 2), except the two gaps in §2.

**Folder map** (`src/pages/theknowledgebase/afoqt/`):

| Folder | What |
|---|---|
| `engine/` | Pure logic — one file per subsystem: `generator.js` (template runtime), `facts.js` (AI/PS), `analogy.js` (VA), `judgment.js` (SJT), `passage.js` (RC), `table.js`/`blocks.js` (TR/BC renderers), `scoring.js`/`exam.js`/`diagnostic.js`/`analytics.js` (Phase 14), `errorModes.js` (named-mistake labels), `timing.js`, `drill.js`/`bank.js` (assembly + real-question mixing) |
| `templates/<subtest>/` | Content, one file per curriculum chapter |
| `curriculum/` | `chapters.js` (pure data: tracks/chapters/concepts/bands) + `chapters/<subtest>/*.md` lessons |
| `views/` | `AfoqtDashboard`, `CurriculumMap`, `ChapterView`, `DrillConfig`, `DrillRunner`, `ExamConfig`, `ExamRunner`, `DiagnosticRunner`, `AfoqtResults` |
| `data/` | `realQuestions.json` (89 official OATTS items), `migratedAsvab.json` (128 usable, read-only-source copy) |
| `afoqtStorage.js` | Per-user progress: `templateStats`, `runs`, `examRuns`, `diagnosticRuns` |

QC gates (run these before trusting any change):
```
npm run afoqt:selftest -- --samples=8000   # structural contract, every template
npm run afoqt:coverage                     # bidirectional teach/test traceability
npm run afoqt:check                        # both
npx vitest run src/pages/theknowledgebase/afoqt
```

---

## 2. Needs polish (verified against actual code 2026-08-27, not carried forward from an old estimate)

### Arithmetic Reasoning error-mode labels — the big one
`engine/errorModes.js`'s `ERROR_LABELS` table had **zero** entries for AR before this pass,
despite AR's six chapter files declaring **~150 distinct named error ids**
(`used-simple-interest`, `wrong-operation`, `forgot-to-halve`, etc. — one per distractor,
by design, per Doctrine rule "distractors are error-modes"). Every AR miss currently prints
its raw kebab-case id instead of prose. This is real editorial work — reading each id in
context and writing an accurate one-line description — not a mechanical fix. Do it file by
file (`ch01-translation.js` through `ch06-counting-measure.js`); each file's ids are listed
together so it's a bounded task per file, not one 150-line slog.

### Dashboard "By subtest" table undercounts `seen`
`AfoqtDashboard.jsx`'s per-subtest aggregation only walks `progress.templateStats` (keyed by
real template id). A drill that draws a real OATTS/ASVAB bank item — which `bankRatio`-mixed
drills, the diagnostic, and exams all do — records that item's stats under a `bank:<id>` key
the aggregation never looks for. Every subtest's "seen" count on the Dashboard is an
undercount by however many bank items got drawn; verified reproducing during PART 29 (VA/AR/
WK/MK/RC all showed `seen: 1` instead of `6` in a diagnostic run where 5 of 6 questions came
from the bank). Fix: extend the Dashboard aggregation to also walk `bankItems()`.

### RC and SJT test-out gates can repeat a question
Confirmed still failing as of this pass (`npx vitest run`, 1 failure,
`curriculum.test.js`'s "every chapter can fill its own test-out gate"):

- `rc-02-main-idea`, `rc-03-details`, `rc-04-vocabulary` — 3 in-band templates each
- `sjt-02-integrity-professionalism`, `sjt-03-leadership`, `sjt-04-resource-management`,
  `sjt-05-communication`, `sjt-06-innovation`, `sjt-07-mentoring` — 1 in-band template each

Root cause: `passageTemplates()` (RC) and `scenarioTemplates()` (SJT) both register exactly
one template per (chapter, band) by design — unlike TR/WK/VA/MK, which register several
frames per band. A 5-question test-out gate sampling without replacement from 1-3 templates
must repeat. **Not fixable by writing more content** — each template's own `stemSpace` already
covers many non-repeating question instances; the gate counts templates, not distinct
questions. Real fix is either an engine change (register >1 template per band for RC/SJT) or
loosening the test-out gate's own logic for these two subtests specifically. Flagged three
times now (PARTs 16, 25D, and this pass) without being picked up — worth actually deciding on
next.

### Fixed this pass (2026-08-27)
Verified `engine/analogy.js` (VA) uses 3 named error ids (`reversed-order`, `wrong-relation`,
`reused-base-word`) and `engine/judgment.js` (SJT) uses the 6 `COMPETENCIES` names as its
error ids (SJT has no error-mode/confusion concept of its own — see that file's header
comment) — none were in `ERROR_LABELS`. Added all 9. Confirmed Physical Science needs
nothing: it shares `engine/facts.js` with Aviation Information, which only ever emits the
three already-labeled `confused-terms`/`same-concept`/`same-chapter` ids — the earlier "likely
PS" hedge in the old handoff doc was checked and is not a real gap.
`npx vitest run` and `npm run afoqt:check` both clean after the addition (same single
pre-existing RC/SJT failure above, no new failures).

---

## 3. Decided, not a gap — don't reopen without Trey raising it

**Self-Description Inventory (SDI) is intentionally not built as an interactive tool.** It's
a 240-item personality inventory with no right/wrong answers and zero composite weight —
nothing to drill or master. Documented (format, timing) so test day isn't a surprise; that's
the whole scope. Trey's call, 2026-08-26.

---

## 4. Waiting on Trey

- Confirm paper vs. eAFOQT delivery — shifts pace targets by ~2-3 s/question either way.
- Any new OATTS official-practice-software captures — paste raw into
  `afoqt/data/raw/oatts-live-<date>.md` (`# source:` / `# subtest:` headers), screenshots only
  for figures (TR grid / IC dials / BC piles). See `CONTRIBUTING-QUESTIONS.md`.
