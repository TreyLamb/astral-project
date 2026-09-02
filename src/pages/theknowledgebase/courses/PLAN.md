# Courses — LIVE HANDOFF STATE

**This file is the resume point.** A fresh session should read this file first and know
exactly where to pick up. Update it at the end of every working block.

---

# 🔴 RESUME HERE — last session 2026-09-02

## The one thing blocking everything else

**Trey needs to re-run the Canvas capture snippet.** Everything downstream waits on it.

1. Open **https://uvu.instructure.com**, logged in → **F12** → **Console**
   (if it warns about pasting, type `allow pasting` first)
2. Paste all of **`scripts/browser/canvasCapture.js`**, Enter, wait for `canvas-capture.json`
   to download
3. Tell the agent — it lands in `~/Downloads/canvas-capture.json`

Then the agent runs (from anywhere in the repo):

```bash
npm run canvas -- --from-capture "$USERPROFILE/Downloads/canvas-capture.json"
npm run courses:scan
```

**Why it must be re-run:** the current snapshot predates two fixes. It has **no submission
status** (so nothing can tell finished work from missed work — 8 past-due items are unknown) and
**no files** (82 real PDFs/handouts exist but the first capture missed them; instructors hid the
Files tab and the fix resolves them through module items instead).

## What is built and where

| Thing | Where | State |
|---|---|---|
| Agent ingest manual | `courses/AGENT-PROMPT.md` | ✅ The binding doc. Read before touching any course material. |
| Trey-facing how-to | `courses/INGEST-HOWTO.md` | ✅ Canvas capture, chem-book capture, file handling |
| Canvas capture (browser) | `scripts/browser/canvasCapture.js` | ✅ No token needed — UVU disables student tokens |
| Canvas import | `scripts/canvasFetch.mjs` (`npm run canvas`) | ✅ Both capture and token modes |
| Ingest ledger | `scripts/courseSourceScan.mjs` (`npm run courses:scan`) | ✅ Never re-read an ingested doc |
| Dashboard | `/TKB/courses/dashboard` | ✅ Verified in browser |
| Syllabus template | `/TKB/courses/syllabus` | ✅ CHEM done; MICR ×2 pending |
| Chem curriculum | `/TKB/courses/chem` | ✅ 9 chapters, 88 templates (`npm run chem:selftest`) |
| Chem dual coordinates | `chem/syllabusMap.js` | ✅ 45 sections, all carrying concepts; all 88 templates tagged |
| Chem two-tier gates | `chem/engine/gates.js` | ✅ Logic + storage tested. ⚠ Only 4/45 sections have enough templates to fill one |
| Chem coverage check | `npm run chem:coverage` | ✅ Verifies the section↔chapter join `chem:selftest` cannot see |
| Committed data | `courses/data/canvasSchedule.json`, `courses/data/syllabi.json` | ✅ |

Canvas data lands in `G:\My Drive\SupplementalCourseDocs\<COURSE>\_canvas\` (machine-generated,
never mixed with Trey's own notes) and `\files\`.

## Chem — state as of commit `bdaa25f` (2026-09-02)

**The question bank is thinner than a green test suite makes it look. Read this before
building anything on top of it.**

`npm run chem:coverage -- --verbose` prints the truth, per section:

```
Course check (bands 1-3)   4 of 45 sections have the 5 templates a gate needs
ACS check    (bands 4-5)   0 of 45   — no band 4-5 template exists yet
```

Quiz 4 (Sec 1-7) has **one** template. Most sections have 1-3. The four that are fillable are
2-3, 3-2, 4-3 and 6-4. Nothing is broken — the content simply is not written yet, and the
per-section counts are the build queue.

**What this session fixed.** The blocker was upstream of the templates: 33 of 45 sections in
`syllabusMap.js` carried `concepts: []`, so 65 of 80 concepts had no course-section home and 71
of 88 templates had no derivable section. The course track could never have drawn a question.
Sections now all declare concepts, and every template carries one.

- Sections were **derived, not hand-transcribed** — `npm run chem:tag-sections` (dry run by
  default, `--write` to apply). It is idempotent: a template that already has a `section:` line
  is left alone, so hand corrections survive a re-run.
- Three hand `OVERRIDES` in that script, where the automatic earliest-section tiebreak
  disagreed with the section's own title (e.g. `molecular-polarity` resolved to 8-2 when 8-3 is
  *titled* "Molecular Polarity"). Add to that map rather than editing a template by hand.
- `npm run chem:coverage` is new and checks what `chem:selftest` structurally cannot: a
  section's concepts must belong to the ACS chapter that section points at, and a template's
  two coordinates must agree. `npm run chem:check` runs both.

### Two open decisions — do not just pick one silently

1. **Gates may be scoped to the wrong unit.** Trey asked for two gates *per section* and that is
   what is built. But his quizzes cover **ranges** — "Quiz 5, Sec 2-1 to 2-3". Per section, 2-2
   has 0 templates and 2-3 has 5; as a quiz-range gate that is a usable 5. `sectionsFromQuizTitle`
   in `syllabusMap.js` already computes the union. A quiz-level gate layered over the section
   gates would map 1:1 onto the real graded event and be fillable far sooner. **Ask him.**
2. **`mole-definition` is misfiled in `curriculum.js`** — it sits under
   `chem1-02-electronic-structure`, which is why section 6-4 (Electron Configurations) had to
   adopt it. It belongs in `chem1-03-mole-calculations`. Deliberately left alone: the fix has a
   **broken intermediate state** — moving the concept fails `chem:selftest` until the template
   `chem1-02-mole-definition` moves too. Do both edits in one pass, then re-run
   `chem:tag-sections --write` and `chem:check`.

### Chem build queue, in priority order

1. **Band 4-5 ACS templates. None exist.** Start with the chapters Trey hits in the next six
   weeks: `chem1-00-toolbox`, `chem1-01-atomic-structure`, `chem1-03-mole-calculations`
   (quizzes run Sec 1-7 → 4-6 through 14 Oct). ~10-12 per chapter. Set `section: null` and let
   `chem:tag-sections` assign it. Band 4 = two-step or one step with a real trap; band 5 =
   three-plus chained steps or a two-idea synthesis. Difficulty comes from the chemistry and the
   step count, never from uglier numbers.
2. **Redox (section 5-2) has 1 template.** Course chapter 5, `acs: null` — his instructor tests
   it and the ACS first-term exam does not, so it is invisible to any ACS-driven count. Quiz 15,
   14 Oct.
3. **Fill the thin course-tier sections** so more than 4 of 45 can offer a gate. `--verbose`
   output is the queue.
4. **Course track view + ACS track view.** Blocked on 1-3 having content to show; a track view
   over a bank this thin would render mostly empty gates.
5. **Capture the real Canvas quiz questions** by `quizId` (present in `canvasSchedule.json`;
   the Quizzes tab is hidden, so they come through the same module-item path files do).

⚠️ An earlier attempt to have a sub-agent write the band 4-5 templates **did not finish and
produced no files**. Nothing from it was committed — the tree is clean, not half-applied.

## Immediate next actions, in order

1. **Re-run capture** (above), re-import, confirm the dashboard's orange "no submission status"
   banner disappears and files download.
2. **Normalize MICR 2065's syllabus** — it is `BIOL 2065 Syllabus-1.docx`, Canvas file
   `134770986`, which arrives with the re-run. Fill `data/syllabi.json` → `MICR 2065`.
3. **MICR 2060 has no syllabus in Canvas at all.** Ask Trey where it lives before assuming.
4. **Build `courses/SCHEDULE.md`** (spec: AGENT-PROMPT §6A). Canvas due dates now make this
   possible without a syllabus.
5. **MICR 2060 Exam 1 is 2026-09-19, 135.84 pts, MMAHP Ch 1-3** — the first real study
   deliverable. There are THREE exams at that weight (Sep 19 / Oct 14 / Nov 14), plus a 165-pt
   MICR 2065 practical on Dec 8.

## Decisions made — do not re-litigate

- **No password, ever.** Canvas access is the browser-session capture, or a personal access token
  if UVU ever enables them. Trey confirmed he cannot create a token; his Kaltura scoped key is for
  the video platform and is useless here.
- **`.gdoc` files cannot be read by any local tool.** Three are affected. Fix is a `.md` export or
  the claude.ai Google Drive connector. See AGENT-PROMPT §4.2.
- **The chem textbook is AcademiQ** (`learn-ai-danielscott26.replit.app`), confirmed by CHEM's own
  syllabus. Its `/api` is behind a login; the path is a devtools capture (INGEST-HOWTO §Source 2).
  ⛔ **Blocked until Trey sends one capture** — endpoint names are not visible from outside.
- **Syllabus fluff gets dropped** (Title IX, ADA, learning outcomes, course philosophy). One fixed
  template; the view never adapts to the source document.
- **Contradictions get recorded, never silently resolved.** CHEM 1210's syllabus has three.

## Gotchas that already cost time

- **Canvas `due_at` is UTC.** Formatting it in UTC reported almost every 11:59 PM deadline one day
  late. Always format in `America/Denver`. Trey caught this one.
- **Canvas shadows every quiz with a duplicate assignment.** Join on `assignment.quiz_id` or
  counts double.
- **Instructors hide the Files/Pages tabs**, so `/files` and `/pages` return empty while the
  content sits in modules. Resolve through module items.
- **UVU packs section + term into `course_code`** → folder names must be normalized to `CHEM 1210`.
- **`npm run` works from any folder; bare `node scripts/...` only from the repo root.**
- ⚠️ **Commit `scripts/` selectively.** A `git add -A scripts` in this session swept three
  unrelated OATTS files (`oattsText.mjs`, `parseOattsAnswers.mjs`, `repairOattsBank.mjs`) into
  commit `890973d` under a Canvas message. Not lost, just mislabeled — offer to split if asked.

---

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

## RESOLVED (2026-09-02)

- **Canvas is wired end to end and the first real pull happened.** UVU runs
  `uvu.instructure.com` — discovered by rendering the scanned `Microbiology_LAB/SyllabusQuiz.pdf`
  to PNG and reading the footer URL, not assumed. **Only 3 of 10 courses appear in Canvas**
  (CHEM 1210, MICR 2060, MICR 2065); the AERO/ESMG/ESFF courses are not published there. Trey
  noted AERO runs through **BYU's** site and he has not checked it yet — that is a separate,
  unexplored source.
- **Token-free capture path** (`scripts/browser/canvasCapture.js`). Trey **cannot create a Canvas
  personal access token** (UVU disables it for students), and the "Kaltura scoped API key" he does
  have is for the video platform, not the Canvas REST API. Canvas's API accepts the browser's own
  session for same-origin requests, so a devtools snippet needs no credential at all.
  `canvasFetch.mjs --from-capture` imports it; both paths emit byte-identical folders.
- **First import: 104 dated items across 3 courses**, plus per-course `_canvas/syllabus.md`,
  `schedule.md`, `schedule.json`, `modules.md`, `pages/`.
- **Three bugs found and fixed against real data:**
  1. 🔴 **Off-by-one-day due dates.** `due_at` is UTC; formatting with `toISOString()` reported an
     11:59 PM Denver deadline as the NEXT DAY. It hit nearly every late-night deadline and failed
     in the worst direction for a planner — "due tomorrow" when it was due tonight. **Trey caught
     this**, on OLQ 2. Now formatted via `Intl.DateTimeFormat` in `America/Denver` (`--tz` to
     override) and `schedule.md` carries a Time column. Midday deadlines (CHEM's 12:30 PM quizzes)
     were unaffected, which is exactly why it was not obvious.
  2. **Quizzes double-counted.** Canvas shadows every quiz with an assignment record carrying the
     same name/date/points. Joined on `assignment.quiz_id`. ⚠ Do NOT "simplify" this by dropping
     every assignment with a `quiz_id`: CHEM's quizzes endpoint returns 0 rows (New Quizzes lives
     behind a different API), so its 29 quiz-backed assignments are the only record of them.
  3. **Files and Pages came back empty.** Instructors hide those tabs, so the endpoints return
     nothing while the content sits in modules — 81 hidden files in MICR 2060, 33 hidden pages in
     MICR 2065. Now resolved through module items by `content_id` / `page_url`.
- **Submission status added** (`include[]=submission`). `statusOf()` folds Canvas's four
  disagreeing fields (`excused` / `submitted_at` / `workflow_state` / `missing`) into one word in
  that precedence order. Needed because a planner that cannot tell finished from missed nags about
  work already done. ⚠ **Not in the current snapshot** — needs the capture re-run.
- **Canvas-style dashboard** at `/TKB/courses/dashboard`, per Trey: *"just use a lot of the css
  from canvas uvu.instructure.com so it looks similar."* Lato / `#0374B5` / colour-striped cards /
  "Coming Up" rail, deliberately more minimal than Canvas. **"Biggest items ahead" ranks by POINTS
  rather than date** — the actual study-priority question — and immediately surfaced a 165-pt MICR
  2065 practical and *three* 135.84-pt MICR 2060 exams, none of which were visible reading the
  list chronologically.
- **Standard syllabus template** at `/TKB/courses/syllabus` (`data/syllabi.json`), per Trey:
  *"EVERY teacher does their syllabus slightly different... I just want one standard template that
  each syllabus gets imported to and the fluff gets kicked out."* Fixed shape; the view never
  adapts to the source. Fluff taxonomy and the real-vs-fluff rules live in AGENT-PROMPT §B2.
  A missing section renders **as missing** — an absent late policy silently reads as "no penalty".
  - **CHEM 1210 normalized in full**, and it has **three self-contradictions**, all recorded in
    `conflicts[]` rather than resolved: two entirely different grade breakdowns in one document
    (points table summing to 1100 vs. a later section with percentages and only THREE midterms),
    "Exams (4 x 125)" labelled 475 (4×125=500), and a final worth 250 in prose but 275 in the
    table. The points table was used because it sums exactly to 1100 and matches the four-exam
    schedule — but this is Trey's to confirm with the instructor.
  - Confirmed from that syllabus: **AcademiQ is the official required text**, and its "progress
    questions" are the graded homework. Exams are **all cumulative and retroactively raise earlier
    exam scores**; the scale is curved so **63% is a C**.
- **Course list corrected + `Course` typedef gained `section`/`credits`/`crn`/`delivery`**;
  stale `H:` drive letter fixed to `G:` in two docs.
- **A crash caught only in a real browser:** `SyllabusView` filtered courses on `s.code`, but the
  `_schema` documentation block documents its own fields as strings, so `_schema.code` is truthy
  and the schema sailed through as a course (`s.keyRules.map is not a function`). Now filtered on
  the `_` key prefix. `afoqt:selftest`-style structural checks would never have caught this —
  the error boundary and a screenshot did.
- ✂️ **Not built this pass:** `SCHEDULE.md` (now unblocked — Canvas supplies the dates);
  MICR 2060 / MICR 2065 syllabus normalization (blocked on the re-run and on MICR 2060 having no
  syllabus in Canvas at all); the AcademiQ textbook crawler (blocked on one capture from Trey);
  no study guides or question generation from any of this material yet; AERO/BYU entirely
  unexplored.

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
