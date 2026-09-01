# Courses — LIVE HANDOFF STATE

**This file is the resume point.** A fresh session should read this file first and know
exactly where to pick up. Update it at the end of every working block.

- **Term:** Fall 2026, 9 courses (see `coursesSeed.js`). 6 tracked `full`, 3 (the AERO
  commissioning classes) tracked `light`.
- **Goal:** permanent home for course tracking + turning material into study questions, feeding
  TKB's existing spaced-review engine (Tier 2/3) or — for CHEM 1210 specifically — a full
  standalone curriculum (`chem/PLAN.md`). See `DATA-MODEL.md` for the full architecture and the
  reasoning behind it. (The original per-document/assessment tracking + pattern-report layer was
  removed 2026-08-28 — see below; Trey does that by hand elsewhere.)

---

## STATUS BOARD

| Phase | Scope | Status |
|---|---|---|
| **0** | Architecture design + clarification with Trey | ✅ **DONE** (2026-08-24) |
| **1** | Data layer: `coursesStorage.js`, `coursesFirestore.js`, `coursesSeed.js` | ✅ **DONE** |
| **2** | `CoursesApp.jsx` shell + route wired into `TkbApp.jsx` | ✅ **DONE** |
| **3** | Core CRUD views: dashboard, course detail, document form, assessment capture | ✅ DONE, then **REMOVED 2026-08-28** — see below |
| **4** | Pattern analysis engine + report view | ✅ DONE, then **REMOVED 2026-08-28** — depended entirely on Phase 3's data |
| **5** | Tier 2/3 question generation: prompt builder, facts engine, template generator, import panel | ✅ **DONE** (one worked example each — MICR facts, CHEM molarity template); promptBuilder simplified 2026-08-28, see below |
| **6** | ~~Real content entry — Trey adds actual documents/assessments per course~~ | **N/A — Documents/Assessments removed 2026-08-28** |
| **7** | Expand Tier 2 generators beyond the one proof-of-concept template/fact-set per course | ⬜ Not started (MICR 2060 still just the one example set) |
| **8** | UI/UX pass once real data exists (this was built ahead of any real content) | ⬜ Not started |
| **9** | Full Chem 1 (CHEM 1210) curriculum: gate/lesson/drill/mastery per chapter + mass review | ✅ **DONE** — 9 chapters, 88 templates, engine/storage/views/routes, verified end-to-end in a real browser. See `chem/PLAN.md` |

---

## WHAT IS ALREADY DECIDED (do not re-litigate)

- **No file upload feature, ever, by design.** Bulk content (full syllabi, slide decks,
  scanned notes) lives outside the repo — Trey's own Drive/cloud-drive
  (`SupplementalCourseDocs`). This app never stores or parses the source material itself.
- **No in-app AI calls, ever, by design.** Question generation stays two tiers, both free:
  local zero-cost generation (Tier 2), manual copy/paste through Trey's own free AI chat
  (Tier 3). Never a billed API call from this app.
- **Generated/imported questions do NOT get their own review engine.** They're written into
  TKB's existing `Question` store via the existing `importQuestions()` call (subject =
  course code), so they ride the same spaced-review scheduling every other TKB question uses.
- **Naming: `courses/` folder, `/TKB/courses` route.** Not `classes/`.
- Course `trackingLevel` (`full`/`light`/`none`) is a per-course toggle, not a hard rule —
  the AERO courses default to `light` but Trey can flip any course any time.
- **Documents, Assessments, RealQuestions and the pattern-analysis report are GONE
  (2026-08-28).** Trey tracks coursework by hand outside the app and called the manual
  entry UI "a waste." Do not re-add them without him asking. See RESOLVED 2026-08-28 below.
  `Course` (the list of 9 courses) and the separate Worksheets feature are unaffected.

## OPEN QUESTIONS FOR TREY (ask when next relevant, don't block on them)

- Real term name/dates beyond "Fall 2026" (seeded as a guess, editable per course).
- Which courses should get their own Tier 2 fact-set/template beyond the MICR/CHEM examples,
  once he's actually a few weeks into the term and has real material to build them from.

## RESOLVED (2026-08-31)

- **`AGENT-PROMPT.md` written** (this folder) — the binding operating manual for future agents
  ingesting new course material, per Trey: *"Write me a very thorough all-inclusive prompt .md
  to live in /supplementalcoursedocs and or /courses root for future claude agents… as i upload
  notes, quizzes, exams, etc… the agent needs to do a little cleaning up of the docs… bits and
  pieces should become parts of future quizzes, future question databases… the prompt has to be
  perfect and clean so I know i can trust it."* It formalizes the fledgling
  `coursenotesfilterexample.md` into an 8-class paragraph taxonomy with a routing table, and
  defines the four standing deliverables (SCHEDULE.md · chapter guide · per-exam guide ·
  AFOQT-grade curriculum). A one-page pointer copy lives at
  `G:\My Drive\SupplementalCourseDocs\README-FOR-AGENTS.md`; registered in
  `theknowledgebase/CLAUDE.md`.
- **Canvas is the primary ingest path** — `scripts/canvasFetch.mjs`, answering Trey's *"are you
  able to scrape my course modules for me if you have my login?"* / *"what is the best way to get
  all of my course materials into the folders the fastest?"*. **UVU runs Canvas at
  `uvu.instructure.com`** — discovered by rendering the scanned `Microbiology_LAB/SyllabusQuiz.pdf`
  to PNG and reading the footer URL (`uvu.instructure.com/courses/637860/quizzes/2351558`), not
  assumed. The script pulls syllabus, assignments, quizzes (**with due dates + point values** —
  the direct raw input for `SCHEDULE.md`), modules, pages and every uploaded file into
  `<COURSE>/_canvas/` and `<COURSE>/files/`. Auth is a **personal access token** in `CANVAS_TOKEN`
  (env or gitignored `.env.local`), never a password and never a command argument. Idempotent —
  existing files are skipped, so re-running after he posts material is cheap. Lint- and
  syntax-clean; **not yet run against live Canvas** (needs his token) ✂️.
- **`INGEST-HOWTO.md` written — for Trey, not for agents.** Covers the Canvas token setup, the
  devtools-capture path for his chem book, loose-file handling, and an explicit answer to the
  login question: a scoped, revocable token or his own logged-in browser tab, never a password.
- **The chem textbook is NOT on Canvas.** It lives on "AcademiQ"
  (`learn-ai-danielscott26.replit.app`), a React SPA whose `/api/*` sits behind a login —
  verified anonymous `GET /api/courses` → `401 Unauthorized`, `/` → 200 HTML shell. So the
  content is structured and pullable, but only from an authenticated session. The path given is a
  two-step devtools snippet (monkey-patch `fetch` → click through → download the capture), which
  needs no credential handoff at all. **A real crawler is blocked until he sends one capture** —
  endpoint names aren't visible from outside the login ✂️.
- **`.pptx` support added to the ledger** (he confirmed PowerPoints are coming). Chunked **one
  chunk per slide**, not per text run — a slide is the unit a lecture moves in, and per-run
  chunking would make a re-saved deck look entirely new. The zip central-directory walker was
  verified against a real archive (18 entries out of `chem1210.docx`).
- **Course list corrected against the registrar** — Trey: *"you can edit my course list based on
  the schedule i gave you."* `coursesSeed.js` now carries all **10** registered courses / **17.5
  hrs** from `ClassSchedule_2026Fall.xlsx` sheet 2, with `section`, `credits`, `crn` and
  `delivery` added to the `Course` typedef (credits weight study-time recommendations; delivery
  separates online from in-person). Added AERO 1430R + AERO 1100, dropped PHIL 2050G. Palette
  widened 5→10 so no two courses share a colour. ⚠️ Seeding is edit-once — an account that
  already stored the old list keeps it until reseeded.
- **Stale drive letter fixed:** `DATA-MODEL.md` and this file said `H:\My Drive\...`; the folder
  is on **`G:`**.
- **Agent role expanded (AGENT-PROMPT §0.5): tutor / advisor / scheduling coach**, per Trey:
  *"I am expecting the agent to act as my tutor, advisor, scheduling coach, etc… so i can put the
  extra time into studying."* Same standing as root `CLAUDE.md`'s MFT running-coach rule,
  including its "he is not the subject expert — you are" clause. Organizing is the deliverable;
  handing back an unranked dump is a failure even when every fact is right.
- **Syllabus handling expanded (AGENT-PROMPT §B2)**, per Trey: *"They are FULL of important
  information."* A syllabus now yields a full `<course>/SYLLABUS.md` — grade weights (must total
  100%), assessment→chapter map, drop/retake rules, late/makeup/attendance policy, required
  materials incl. banned calculators, weekly topic schedule, office hours, exam logistics. A
  **syllabus quiz counts as a syllabus source**, and the items he missed are the policies he has
  already demonstrated he doesn't know.
- **Incremental ingest ledger built** (`scripts/courseSourceScan.mjs`, `npm run courses:scan`),
  per Trey: *"those docs will grow in size over time. Agents will need to know what has already
  been mapped and what's new, or else a lot of usage will be wasted with each pass reviewing
  information already incorporated."* It extracts each source's **text** (not container bytes — a
  `.docx` zip changes on every save even when the text is identical), splits it into paragraph
  chunks, hashes each, and records ingested hashes in `courses/SOURCE-MANIFEST.json` (committed).
  `--show <path>` prints **only** the chunks not yet ingested; `--mark` records an ingest.
  Verified end to end on a scratch root: first scan NEW → `--mark` → rescan UNCHANGED → append one
  paragraph → `+1 new of 3` → `--show` printed that paragraph alone. Zero new dependencies (the
  zip reader is ~25 lines against `node:zlib`). **The manifest does not exist yet** — it is
  created by the first real `--mark`, and until then everything correctly reports as NEW.
- **`.gdoc` unreadability researched rather than accepted.** Local IO is genuinely exhausted
  (`fs.readFileSync`→`EISDIR`, PowerShell `Get-Content` and `Copy-Item`→"Incorrect function",
  while `Get-Item` reports 176 bytes). Four workarounds are documented in AGENT-PROMPT.md §4.2,
  ranked: (1) **authorize the claude.ai Google Drive connector** — this session listed it as
  present but unauthorized, and it removes the export step entirely; (2) a Google Apps Script on
  a daily trigger auto-exporting into the same folder; (3) manual `File → Download → Markdown`
  (ask for `.md`, not `.docx` — it chunks far more reliably for the ledger); (4) public
  link-share + the `export?format=txt` URL, listed but not recommended (privacy trade).
- **`npm run chem:selftest` added** to package.json. `chem/engine/selftest.mjs` already existed
  and passed but was never wired to a script, so the QC step had no canonical one-liner the way
  `afoqt:check` does. Verified: 88 templates / 9 chapters, all checks pass.
- **Source-folder facts established** (verified against the real Drive folder, not assumed):
  - ⚠️ **`.gdoc` files cannot be read at all.** Reading one fails at the OS level (`Invalid
    request code`) — they are Drive placeholders, not files. Three are affected
    (`Chem1210 ThoroughBookNotes`, `Chem1210 Study Question Database`, `MicroOQL's`). The only
    fix is Trey exporting them to `.docx`/`.md`. This is not a "source unavailable" conclusion —
    it is a known, named blocker with a known unblock.
  - ⚠️ **`coursesSeed.js` disagrees with the registrar.** `ClassSchedule_2026Fall.xlsx` sheet 2
    lists **10** registered courses / 17.5 hrs, including **AERO 1430R** (Air Force Physical
    Training) and **AERO 1100** (DAF Professionalism A) which the seed lacks; the seed carries
    **PHIL 2050G** (Ethics and Values), which is not in the registration. Flagged, deliberately
    NOT auto-corrected — `coursesSeed.js` is edit-once-seeded and an account that already
    customized its course list would not be re-synced anyway. Trey's call.
  - ⚠️ **No syllabus with dates exists for any course**, so `courses/SCHEDULE.md` (deliverable A)
    cannot be populated yet. The format is fully specified in AGENT-PROMPT.md §6A and the
    roster/meeting-time half is available from the xlsx; only the assessment dates are missing.
  - 0-byte files that look like content: `chem/Chem1210 Question Database.docx`,
    `Microbiology/microsyllabusquiz.md`. `Microbiology_LAB/*.pdf` are scanned (no text layer).
  - `chem/chem1210.docx` (2.6 MB, ~380 paragraphs, 6 images) is the richest source in the folder
    and carries four layers needing different routing: OpenStax-style prose, MCQs with per-option
    `Correct:`/`Wrong:` rationales (ready-made error modes), Trey's own AI-discussion transcripts
    and restatements, and end-of-section exercises with no key.
- ✂️ **Not built this pass** (no request, and each is real scope): `SCHEDULE.md` itself (blocked
  on a syllabus); any `SOURCES.md`/`SYLLABUS.md`/`guides/` files (the layout is specified, the
  content is a separate ingest run); no MICR module; no new views — the guides are specified as
  `.md` and nothing renders `guides/` in-app yet, which is a wiring task for whenever the first
  guide actually exists.

## RESOLVED (2026-08-28)

- **Documents/Assessments/RealQuestions + pattern-analysis report removed**, per Trey:
  "remove documents/assessments. i put everything in manual those are a waste." Deleted:
  `views/DocumentForm.jsx`, `views/AssessmentCapture.jsx`, `views/CoursePatternReport.jsx`,
  `engine/patternAnalysis.js`, the `/TKB/courses/:courseId/patterns` route, and the
  `courses_documents`/`courses_assessments`/`courses_realquestions` Firestore collections
  (old docs in those collections are simply orphaned, not migrated). `coursesStorage.js` and
  `coursesFirestore.js` now hold only `Course` CRUD. `engine/promptBuilder.js`'s
  `buildStudyPrompt` lost its `documents`/`realQuestions`/`focusTags` params — Tier 3 now
  takes one optional free-text `context` string instead, typed into `ImportGenerated.jsx`.
- **CourseDetail now surfaces actual study/quiz material**, per Trey: "Put a link somewhere
  in each course that links to the study/quiz material." A "Study & quiz material" section
  shows only what genuinely exists for that course — right now that's a registered Worksheet
  (matched by `courseCode`) and/or a link into TKB's main review deck scoped to that course
  (matched by TKB `Subject.name === course.code`, same pattern `AsvabView.jsx` uses for its
  own subject-scoped review link). Renders nothing for a course with neither — never a
  placeholder, per Trey's explicit "leave the courses blank if i haven't uploaded anything."
- **Course-material source correction:** the MMAHP/MCI microbiology worksheet (`mmahp-ch1-4`)
  really is MICR 2060 — that was never in question. What *was* wrong: Trey's chem questions
  this whole thread were about a different, misidentified file. The actual **CHEM 1210**
  source is `SupplementalCourseDocs/chem/acs exam study guide 2nd edition.pdf` — the official
  ACS "Preparing for Your ACS Examination in General Chemistry," 2nd ed. (2018), 209 pages,
  native text layer (readable, though exponents/subscripts/nuclear notation extract as
  garbage in plain-text — the rendered page itself is clean; use the `getScreenshot` render
  workaround from `theknowledgebase/CLAUDE.md` for those). It answers Trey's original
  Chem-1-vs-Chem-2 split question directly and precisely, with an explicit chapter TOC (PDF
  page = printed page + 7):
  - **First-Term (Chem 1):** Ch 1 Atomic Structure (p.15) · Ch 2 Electronic Structure (p.25) ·
    Ch 3 Formula Calculations and the Mole (p.37) · Ch 4 Stoichiometry (p.47) · Ch 5 Solutions
    and Aqueous Reactions Pt.1 (p.57) · Ch 6 Heat and Enthalpy (p.69) · Ch 7 Structure and
    Bonding (p.81) · Ch 8 States of Matter (p.97).
  - **Second-Term (Chem 2):** Ch 9 Solutions and Aqueous Reactions Pt.2 (p.113) · Ch 10
    Kinetics (p.123) · Ch 11 Equilibrium (p.139) · Ch 12 Acids and Bases (p.151) · Ch 13
    Solubility Equilibria (p.163) · Ch 14 Thermodynamics (p.175) · Ch 15 Electrochemistry
    (p.187) · Ch 16 Nuclear Chemistry (p.199).
  - Each chapter has worked Study Questions (SQ, full explanation inline) and unexplained
    Practice Questions (PQ) with a bare letter-answer key at the chapter end ("Answers to
    Practice..." appears 17×, once per chapter+Toolbox) — real, gradeable content, unlike the
    MICR MCI file which has zero answer key anywhere despite its "Answered and Explained"
    title. This is the file to build the actual CHEM 1210 quiz from, whenever Trey asks.
    ⚠ It is a copyrighted, officially-published ACS guide — same "ruler, not corpus" handling
    as the AFOQT calibration books applies if anything from it is used to seed content that
    ships on this public site (SQ explanations especially should not be copied verbatim into
    a publicly-deployed bundle; this is Trey's own private Firestore data, not the AFOQT
    public deck, but the same discipline is worth keeping in mind).
- **Full Chem 1 curriculum built** (`courses/chem/`), per Trey: "Build a curriculum based on
  chem 1 for now, and then build the repeatable quizzes for each curriculum, and then the base
  for the mass-review mass-study version of tests." Mirrors AFOQT's gate → lesson → drill →
  mastery chapter pattern in a new, smaller, parallel engine (never bolted onto AFOQT's own
  registry — see `chem/PLAN.md` for why). Also answers Trey's "does AFOQT already have
  repeatable quizzes per curriculum" question: **yes**, confirmed by reading
  `afoqt/views/ChapterView.jsx` — the Drill step is unlimited and never gated by test-out
  pass/fail, so repeatedly failing a gate never strands you without study material. No AFOQT
  change was needed. Full detail, folder map, and status board: `chem/PLAN.md`.

## RESOLVED (2026-08-26)

- **New sub-feature: Worksheets** (`/TKB/courses/worksheets`, `/TKB/courses/worksheets/:worksheetId`).
  A separate, reusable click-to-annotate engine for digitizing a lettered-MCQ practice
  worksheet PDF from `SupplementalCourseDocs` — click a letter to circle it (green), click
  again for an X (red), again to clear, looping, no debounce. Click the blank space on any
  line to type a margin note. Two-column layout in original question order (CSS grid
  auto-flow, headings span both columns). Marks/notes persist to localStorage per worksheet
  id (`worksheetStorage.js`) — no Firestore mirror yet, single-device only.
  - Deliberately NOT part of the `Course`/`CourseDocument` CRUD data model above — a
    worksheet is a parsed, self-contained JSON blob (`worksheets/data/<id>.json`), not a
    `drive-link` reference. This is the one exception to "no file upload / references only":
    the *content itself* is committed as structured JSON, produced by a one-time parser
    script run against a PDF outside the repo, never the PDF itself.
  - Reusable by design: `worksheets/worksheetEngine.js` (pure — flatten + mark-cycle logic)
    and `views/WorksheetViewer.jsx` (rendering + persistence) don't know about "MCI" or
    "MMAHP" — only `worksheetsRegistry.js` and the specific parser script are per-document.
  - `scripts/parseMciWorksheet.mjs` is written for the whole MCI-family PDF layout (numbered
    questions, lettered options, chapter/section headers), not just this one file — re-run it
    for the next PDF in the series. It hard-fails (non-zero exit) on any structural mismatch
    rather than silently mis-parsing; a couple of genuine gaps in the source PDF itself
    (a skipped option letter) are logged as warnings and kept verbatim rather than invented.
  - Reachable via a "📝 Worksheets" button on the Courses dashboard header.

## RESOLVED (2026-08-25)

- **Docs location:** `PLAN.md`/`DATA-MODEL.md` moved from `docs/courses/` into this folder
  (`src/pages/theknowledgebase/courses/`) so the design docs live with the code they describe.
  Reference them from `theknowledgebase/CLAUDE.md`, not the other way around.
- **Per-course content:** confirmed live at `G:\My Drive\SupplementalCourseDocs\` (⚠ this entry
  originally said `H:\` — corrected 2026-08-31; the drive letter is **G:**) (a `drive-link`,
  not `repo-doc`) — one file per course, e.g. `Chem1210 ThoroughBookNotes.gdoc`. `docs/courses/<CODE>/`
  stays available as the unused `repo-doc` fallback; nothing currently uses it.
