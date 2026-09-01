# Courses — architecture reference

This is the canonicalized version of the plan approved 2026-08-24. Read `PLAN.md` first for
live status; read this when you need the reasoning, not just the current phase.

## Why this exists

TKB's stated purpose (`TKBDesignDoc.md`) explicitly includes college coursework: dump in
class info, get it organized for study now and reviewed later. Trey is taking 9 courses this
term. The original plan (2026-08-24) also tracked syllabi/coursework/captured quiz questions
and analyzed "what does my professor tend to test" — that tracking/analysis layer was removed
2026-08-28 (Trey does it by hand elsewhere); what's left is course tracking + turning material
into study questions.

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
Firestore — it stays in Trey's own Drive/cloud-drive folder, `G:\My Drive\SupplementalCourseDocs\`
(one folder per course/subject; see e.g. the `chem/` and `Microbiology/` subfolders). This
mirrors the existing precedent in this repo: AFOQT's calibration books live at `G:\My Drive\`
and are never committed, only referenced by path in scripts.

The app has no CRUD for tracking individual documents — no `CourseDocument` model, no
`DocumentForm.jsx` (both existed 2026-08-24 through 2026-08-28 and were removed; see PLAN.md's
2026-08-28 entry). Trey references source material by hand when he needs it (in a prompt, in
conversation) rather than logging it into the app.

## Question capture & generation — two tiers, both zero-API-cost

Tier 1 (captured real questions via `Assessment`/`RealQuestion` records, feeding a pattern
report) existed 2026-08-24 through 2026-08-28 and was removed at Trey's request — "i put
everything in manual those are a waste." See PLAN.md's 2026-08-28 entry for the full removal
list. What remains:

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
a copy-paste prompt from the course code/title and an optional free-text `context` string
Trey types into `ImportGenerated.jsx` (what material/topics to base questions on — there's no
tagged document store to pull this from anymore). Trey pastes the prompt into any free AI
chat, gets a JSON batch back, pastes it into `ImportGenerated.jsx`, which runs it through
`engine/dedup.js`'s `dedupeQaBatch` (fuzzy, Jaccard-based, answer-agreement-gated) for a
preview before committing via `importQuestions`.

Both tiers converge on the same call: `useTkbData().importQuestions(jsonText)` from
`TkbApp.jsx` — Courses does not maintain a separate question bank or review scheduler.

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
    promptBuilder.js
  views/
    CoursesDashboard.jsx
    CourseDetail.jsx        — shows study/quiz material (worksheet + TKB review deck
                               links, only what actually exists) + the generation panel
    ImportGenerated.jsx
    WorksheetsList.jsx
    WorksheetViewer.jsx
  worksheets/               — separate reusable click-to-annotate engine, see PLAN.md's
    worksheetEngine.js         2026-08-26 entry. Not part of the Course model above — a
    worksheetStorage.js        worksheet is parsed, committed JSON (data/<id>.json), not
    worksheetsRegistry.js      a drive-link reference.
    Worksheet.css
    data/
      mmahp-ch1-4.json
  chem/                     — a THIRD thing, separate again: a full CHEM 1210 curriculum
                               (gate/lesson/drill/mastery per chapter + cross-chapter mass
                               review), its own smaller engine mirroring AFOQT's pattern.
                               See chem/PLAN.md, not this file, for its architecture.
```

Routes: `/TKB/courses` (dashboard), `/TKB/courses/:courseId` (detail — study/quiz links,
generation panel). Wired into `TkbApp.jsx` as `<Route path="courses/*" element={<CoursesApp />} />`
plus a `Courses` tab, matching the existing `afoqt/*` pattern. No `SITE_LINKS` entry — TKB's
sub-routes aren't individually listed there, reached via TKB's own tab bar instead.

`CourseDetail` and the `ImportGenerated` panel inside it are each wrapped in `<Boundary>` so a
crash in one stays contained.
