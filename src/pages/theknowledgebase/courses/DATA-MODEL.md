# Courses — architecture reference

This is the canonicalized version of the plan approved 2026-08-24. Read `PLAN.md` first for
live status; read this when you need the reasoning, not just the current phase.

## Why this exists

TKB's stated purpose (`TKBDesignDoc.md`) explicitly includes college coursework: dump in
class info, get it organized for study now and reviewed later. Trey is taking 9 courses this
term and wants syllabi/coursework/book notes/captured quiz questions tracked, turned into
study material, and — secondarily — analyzed for "what does my professor tend to test."

Two engines already in this repo solve most of the hard problems and are reused rather than
rebuilt:
- **TKB's own spaced-review core** (`engine/cycle.js`, `queue.js`, `dedup.js`,
  `selection.js`) — Courses questions become ordinary TKB `Question` records via the existing
  `importQuestions()` path and ride the same scheduling as ASVAB/general questions.
- **AFOQT's template + fact engines** (`afoqt/engine/generator.js`, `afoqt/engine/facts.js`)
  — the *data model* (seeded same-difficulty templates; term/gloss/confusion fact rows) is
  reused in `courses/engine/`. The *output shape* is adapted: AFOQT builds multiple-choice
  questions with a distractor slate; TKB questions are open-recall flashcards, so there's no
  distractor slate to build — a fact's `confusions` becomes a note on the card instead.

## Content strategy — references, not blobs

Bulk content (full syllabi, slide decks, scanned book notes) never lives in this repo or in
Firestore — it stays in Trey's own Drive/cloud-drive folder. In practice that's
`H:\My Drive\SupplementalCourseDocs\`, one file per course (e.g. `Chem1210 ThoroughBookNotes.gdoc`),
which is why `drive-link` is `DocumentForm.jsx`'s default `ref.type`. This mirrors the existing
precedent in this repo: AFOQT's calibration books live at `G:\My Drive\` and are never committed,
only referenced by path in scripts.

`repo-doc` (a path under `docs/courses/<CODE>/`) exists as a secondary option for the rare case
Trey judges something small enough to hand-commit instead — as of this writing nothing has used
it, everything real is a `drive-link` into SupplementalCourseDocs.

`CourseDocument` (see `coursesStorage.js` for the full typedef) stores a **reference**
(`ref: {type: 'drive-link'|'repo-doc'|'none', value}`) plus a short hand-written `summary`
and `tags[]` — small and structured, regardless of how big the source material is. The app
never fetches or parses the referenced content; it's just a link a human clicks.

## Question capture & generation — three tiers, all zero-API-cost

**Tier 1 — captured real questions.** `Assessment` + `RealQuestion` records (see
`coursesStorage.js`) hold what a professor actually asked, typed in verbatim right after a
quiz/exam via `AssessmentCapture.jsx`. This is the ground truth the pattern report runs on.

**Tier 2 — in-app procedural/fact generation, zero AI.**
- `courses/engine/facts.js` — vocab-heavy courses (MICR terminology). A `FactRow` names
  `term`, `gloss`, and the ids of facts it's genuinely confused with; `generateFactQuestions`
  emits two Question-shaped rows per fact (an identify frame and, where a clean question
  exists, a recall frame), citing the confusion as a note rather than a distractor. Ships
  with one proof-of-concept set, `EXAMPLE_MICR_FACTS`.
- `courses/engine/generator.js` — numeric/procedural problems (a CHEM stoichiometry
  calculation). `registerCourseTemplate` + `generateFromTemplate(id, seed)` mirrors AFOQT's
  seeded-template contract using TKB's own `engine/rng.js` (`mulberry32`) — same seed always
  regenerates the same question, same-difficulty iteration by varying the numbers, never the
  concept. Ships with one proof-of-concept template, `chem1210-molarity`.
- Both output the exact row shape `TkbStorage.importQuestions` accepts.

**Tier 3 — external-AI-assisted, manual, free.** `courses/engine/promptBuilder.js` assembles
a copy-paste prompt from a course's tagged `CourseDocument` summaries, its real captured
questions (as style/difficulty exemplars), and topics due for more coverage (from
`untestedTaughtTags`). Trey pastes it into any free AI chat, gets a JSON batch back, pastes it
into `ImportGenerated.jsx`, which runs it through `engine/dedup.js`'s `dedupeQaBatch` (fuzzy,
Jaccard-based, answer-agreement-gated) for a preview before committing via `importQuestions`.

All three tiers converge on the same call: `useTkbData().importQuestions(jsonText)` from
`TkbApp.jsx` — Courses does not maintain a separate question bank or review scheduler.

## Pattern analysis — basic version, ships now

`courses/engine/patternAnalysis.js` — pure counting over `CourseDocument.tags` and
`RealQuestion.topicTags`, no AI, no ML:

- `tagFrequencyByWeek` — per-tag counts bucketed by week.
- `tagHitRate` — per-tag `{timesTaught, timesTested, hitRate}`.
- `untestedTaughtTags` — taught tags with little/no test appearance, most-recent first.
- `recurringAcrossAssessments` — tags appearing in ≥2 assessments.

Surfaced at `/TKB/courses/:courseId/patterns` (`CoursePatternReport.jsx`). Deliberately one
report screen among several, not a driver of navigation — matches Trey's framing that this is
"guesswork/projection," useful but not the main purpose.

## Folder / route structure

```
src/pages/theknowledgebase/courses/
  PLAN.md                 — live handoff state, read this first
  DATA-MODEL.md           — this file
  CoursesApp.jsx          — shell, own nested <Routes>, mirrors afoqt/AfoqtApp.jsx
  coursesStorage.js       — localStorage layer (typedefs live here)
  coursesFirestore.js     — Firestore mirror, users/{uid}/courses_* collections
  coursesSeed.js          — the 9 current courses
  engine/
    facts.js
    generator.js
    patternAnalysis.js
    promptBuilder.js
  views/
    CoursesDashboard.jsx
    CourseDetail.jsx
    DocumentForm.jsx
    AssessmentCapture.jsx
    ImportGenerated.jsx
    CoursePatternReport.jsx
    WorksheetsList.jsx
    WorksheetViewer.jsx
  worksheets/               — separate reusable click-to-annotate engine, see PLAN.md's
    worksheetEngine.js         2026-08-26 entry. Not part of the Course/CourseDocument
    worksheetStorage.js        model above — a worksheet is parsed, committed JSON
    worksheetsRegistry.js      (data/<id>.json), not a drive-link reference.
    Worksheet.css
    data/
      mmahp-ch1-4.json
```

Routes: `/TKB/courses` (dashboard), `/TKB/courses/:courseId` (detail — documents,
assessments, generation panel), `/TKB/courses/:courseId/patterns` (report). Wired into
`TkbApp.jsx` as `<Route path="courses/*" element={<CoursesApp />} />` plus a `Courses` tab,
matching the existing `afoqt/*` pattern. No `SITE_LINKS` entry — TKB's sub-routes aren't
individually listed there, reached via TKB's own tab bar instead.

`CourseDetail`, the `ImportGenerated` panel inside it, and `CoursePatternReport` are each
wrapped in `<Boundary>` so a crash in one stays contained.
