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

### ~~Arithmetic Reasoning error-mode labels~~ — DONE 2026-08-27
All **133** unlabeled ids now have prose: 112 Arithmetic Reasoning, 13 Math Knowledge, 8 Word
Knowledge. Written from each distractor's own `why` string (sampled from live generation) rather
than guessed from the slug, so a label states the mistake the template actually encodes — a wrong
label is worse than a raw id, because it misdiagnoses the miss. Grouped in `errorModes.js` by
KIND of mistake (answered the wrong question / setup error / arithmetic slip / percentage base /
units / fencepost), since that is what the correction differs by.
`engine/__tests__/errorModes.test.js` now fails if any template emits an id with no label.

Note the earlier claim that Verbal Analogies, Situational Judgment and Physical Science were
also missing labels was **wrong** — `dbe01ed` had already done VA and SJT, and PS shares
`engine/facts.js` with Aviation Information and only emits the three already-labeled ids.

### ~~Dashboard "By subtest" table undercounts `seen`~~ — DONE 2026-08-27, and it was worse than described
The blind spot was not only in `AfoqtDashboard.jsx` — the identical filter lives in
`scoring.js`'s `subtestAccuracy`, so it also silently skewed **every composite practice-accuracy
number**, not just a "seen" column. And since `composeDrill` mixes at `bankRatio: 0.5`, that is up
to *half* of every drill on the six subtests that have a bank (Physical Science 52, Math Knowledge
49, Arithmetic Reasoning 37, Word Knowledge 35, Verbal Analogies 10, Reading Comprehension 10).
The ignored half is the official USAF material, so the number was **biased optimistic**, not
merely incomplete.

Fixed by adding `subtestStatKeys(code)` (templates + bank ids) in `scoring.js`, with
`AfoqtDashboard` now consuming `subtestAccuracy` instead of duplicating the arithmetic inline —
that duplication is precisely why the bug existed in two places at once. Guarded by
`engine/__tests__/scoring.test.js`.

### ~~RC and SJT test-out gates can repeat a question~~ — RESOLVED 2026-08-27, and it was a measurement error
**This was never a real limitation.** Flagged as fact three times (PARTs 16, 25D, and again
above) on the strength of `curriculum.test.js` counting **templates** — but a template is not a
question. One SJT template holds ~30 scenarios; one RC template holds every question on its
passages. Measured against 300 real generated 5-question gates per chapter:

- all six `sjt-*` chapters: a clean **5 of 5**, zero repeats
- `rc-03-details`, `rc-04-vocabulary`: a clean **5 of 5**, zero repeats
- `rc-02-main-idea`: genuinely broken — **2 distinct for 5, on every single seed** — and the
  template-counting check had been *passing* it, because it had 3 templates

So the check was wrong in both directions: eight false alarms, and blind to the one real defect.
Its root cause was an engine bug, not the curriculum (see below). Both `curriculum.test.js` and
`afoqtCoverage.mjs` now assert only what template-counting honestly supports — at least one
in-band template — and whether a gate actually repeats is verified against real drills in
`engine/__tests__/drillDedup.test.js`. **Do not re-add a template-count threshold.**

### Two real dedup bugs in `buildDrill`, fixed 2026-08-27
Both made the engine ship a question it had already asked in the same sitting.

1. **The dedup key ignored the figure actually rendered.** It used the numeric run-sheet, but
   every template in a run shares that number while each maps it to its own figure
   (`bandPassages[sheetSeed % n]`). RC also reuses stem wording across passages on purpose (so
   does the real subtest), so two different questions collided on `<same number>:<same stem>`,
   the retry loop exhausted, and a real duplicate shipped. This is what broke `rc-02-main-idea`.
2. **The same key was wrong the other way for Instrument Comprehension**, which has no
   `sheetSeed` and an identical stem on every question — so everything looked like a duplicate of
   the first, every retry failed, and dedup silently never ran for it. Its identity is the dial
   values. A `!t.sheet` early-out also limited dedup to figure-sharing subtests only.

Measured over 200 seeds at full subtest length: Instrument Comprehension **min 17/25 → 25/25**,
`rc-02-main-idea` gate **3.72 → 5/5**, Reading Comprehension 25q **24.5 → 25/25**. TR, BC, VA, MK,
AR and AI are all exact too. Remaining shortfalls are **content**, not selection, and are asserted
as floors: Word Knowledge 23/25, Physical Science 19/20, **Situational Judgment 31/50** (only 60
items exist against a 50-question subtest — authoring work).

⚠ Raising `DEDUP_TRIES` does NOT help and was tried; a non-sheet retry draws from the shared
`rng`, so a longer walk just reshuffles which items later questions get.

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

---

## 5. Optional polish, flagged from a `howtowritetests.md` cross-check (2026-08-28)

Trey had a generic "how to write good test questions" doc reviewed against
`QUESTION-DOCTRINE.md` and the actual templates, just to see if the engine's logic held up.
Verdict: it does, and in most places the doctrine is stricter (structural/build-failing checks
where the primer only has manual-checklist advice — see `QUESTION-DOCTRINE.md` + `scoring.js`'s
`templateStats` for the item-bank-with-results equivalent). One primer idea doesn't apply here at
all: **item discrimination** (comparing high vs. low scorers on each item) needs a population of
test-takers; this is a single-user tool, so there's no cohort to discriminate against — not a gap,
just a different context than the primer assumes.

Two things the primer covers that we don't, neither urgent, both need Trey's call before building
since they're new scope, not bugs:

1. **No explicit cognitive-level tag (Recall / Understanding / Application), separate from
   `band`.** Right now `band` (1-5) does double duty for "how hard" and implicitly "what kind of
   thinking." AFOQT itself isn't scored by Bloom's level, so this may not be worth adding — but if
   a coverage view like "are we too recall-heavy in Aviation Information" ever becomes useful,
   this is the missing axis.
2. **No automated check for distractor stylistic "tells"** — an option that's obviously longer/
   shorter than the others, or grammatically mismatched to the stem. `h.choices` in
   `engine/generator.js` (~line 131) dedupes by value only, nothing checks parity. Low risk for
   numeric subtests (MK, AR, Block Counting, Table Reading — all short numbers/expressions).
   Actually relevant for the text-option subtests: Word Knowledge, Verbal Analogies, Aviation
   Information (fact engine), Reading Comprehension, SJT. Would be a new check inside
   `afoqt:selftest`, not a template rewrite.
