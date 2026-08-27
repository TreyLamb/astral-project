# Courses — LIVE HANDOFF STATE

**This file is the resume point.** A fresh session should read this file first and know
exactly where to pick up. Update it at the end of every working block.

- **Term:** Fall 2026, 9 courses (see `coursesSeed.js`). 6 tracked `full`, 3 (the AERO
  commissioning classes) tracked `light`.
- **Goal:** permanent home for syllabi/coursework/notes/quiz-question tracking, feeding TKB's
  existing spaced-review engine — plus a basic pattern report on what's been taught vs. tested.
  See `DATA-MODEL.md` for the full architecture and the reasoning behind it.

---

## STATUS BOARD

| Phase | Scope | Status |
|---|---|---|
| **0** | Architecture design + clarification with Trey | ✅ **DONE** (2026-08-24) |
| **1** | Data layer: `coursesStorage.js`, `coursesFirestore.js`, `coursesSeed.js` | ✅ **DONE** |
| **2** | `CoursesApp.jsx` shell + route wired into `TkbApp.jsx` | ✅ **DONE** |
| **3** | Core CRUD views: dashboard, course detail, document form, assessment capture | ✅ **DONE** |
| **4** | Pattern analysis engine + report view | ✅ **DONE** (basic version, per Trey's explicit request) |
| **5** | Tier 2/3 question generation: prompt builder, facts engine, template generator, import panel | ✅ **DONE** (one worked example each — MICR facts, CHEM molarity template) |
| **6** | Real content entry — Trey adds actual documents/assessments per course | ⬜ Not started (ongoing, per-course, by Trey) |
| **7** | Expand Tier 2 generators beyond the one proof-of-concept template/fact-set per course | ⬜ Not started |
| **8** | UI/UX pass once real data exists (this was built ahead of any real content) | ⬜ Not started |

---

## WHAT IS ALREADY DECIDED (do not re-litigate)

- **No file upload feature, ever, by design.** Bulk content (full syllabi, slide decks,
  scanned notes) lives outside the repo — Trey's own Drive/cloud-drive, or occasionally a
  small hand-committed `.md` under `docs/courses/<CODE>/`. The app only ever stores a
  *reference* (`CourseDocument.ref`) plus a short summary/tags. See DATA-MODEL.md.
- **No in-app AI calls, ever, by design.** Three tiers of question generation, all free:
  captured real questions (Tier 1), local zero-cost generation (Tier 2), manual copy/paste
  through Trey's own free AI chat (Tier 3). Never a billed API call from this app.
- **Pattern analysis is pure counting**, not ML/AI, and deliberately a secondary report
  screen, not something that drives navigation.
- **Generated/imported questions do NOT get their own review engine.** They're written into
  TKB's existing `Question` store via the existing `importQuestions()` call (subject =
  course code), so they ride the same spaced-review scheduling every other TKB question uses.
- **Naming: `courses/` folder, `/TKB/courses` route.** Not `classes/`.
- Course `trackingLevel` (`full`/`light`/`none`) is a per-course toggle, not a hard rule —
  the AERO courses default to `light` but Trey can flip any course any time.

## OPEN QUESTIONS FOR TREY (ask when next relevant, don't block on them)

- Real term name/dates beyond "Fall 2026" (seeded as a guess, editable per course).
- Which courses should get their own Tier 2 fact-set/template beyond the MICR/CHEM examples,
  once he's actually a few weeks into the term and has real material to build them from.

## RESOLVED (2026-08-25)

- **Docs location:** `PLAN.md`/`DATA-MODEL.md` moved from `docs/courses/` into this folder
  (`src/pages/theknowledgebase/courses/`) so the design docs live with the code they describe.
  Reference them from `theknowledgebase/CLAUDE.md`, not the other way around.
- **Per-course content:** confirmed live at `H:\My Drive\SupplementalCourseDocs\` (a `drive-link`,
  not `repo-doc`) — one file per course, e.g. `Chem1210 ThoroughBookNotes.gdoc`. `docs/courses/<CODE>/`
  stays available as the unused `repo-doc` fallback; nothing currently uses it.
