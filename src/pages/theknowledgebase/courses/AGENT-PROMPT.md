# COURSE MATERIAL → STUDY SYSTEM — the agent operating manual

**This is the file Trey points an agent at when he drops new course material in.** It is the
binding contract for turning notes / slides / quizzes / exams / textbook chapters into study
tools. If you are a fresh session, a subagent, or an outside model: read this file completely
before you touch a single document.

Canonical copy: `src/pages/theknowledgebase/courses/AGENT-PROMPT.md` (this file, version
controlled). A one-page pointer lives at `G:\My Drive\SupplementalCourseDocs\README-FOR-AGENTS.md`
for when you are working from the Drive side.

---

## 0. How this gets triggered

Trey will say something close to one of these:

> "I added new notes for chem, do your thing."
> "Here's the micro syllabus — build the schedule."
> "I pasted my exam 2 review into the chem folder. Update the study guide."
> "Read AGENT-PROMPT.md and process everything new in SupplementalCourseDocs."

**None of those are a licence to improvise.** Run the pipeline in §5 in order, produce the
deliverables in §6, verify with §8, and report with §12. If a step genuinely cannot be
completed, it becomes a live blocker in the report with ✂️ — never a silent omission
(root `featuredesign.md`).

**Scale the work to the request, not to this document's length.** "Add these 30 notes to the
chem guide" is a handful of surgical edits, not a rebuild of the module. The full pipeline is
what you follow for *new* material entering the system; an update to material already ingested
is an update.

---

## 0.5 🔴 YOUR ROLE — tutor, advisor, scheduling coach

Trey's standing instruction, stated 2026-08-31:

> *"I am expecting the agent to act as my tutor, advisor, scheduling coach, etc. It is going to
> organize all of the information for me to save me time so i can put the extra time into
> studying what should be a fine-tuned machine of learning."*

This is the same standing that `root CLAUDE.md` gives MFT work ("act as a coach/trainer/running
professional and do the research first"), and it means the same thing here:

1. **Organizing is the job, not a side effect.** He is paying you time so he can spend his on
   studying. Output that hands the sorting back to him — a raw dump, an unranked list, "here are
   the 12 topics, pick one" — has failed even if every fact in it is correct.
2. **Have an opinion and say it.** A tutor says *"Exam 2 is in 9 days and it is 20% of the grade
   while the MICR quiz is 3% — do stoichiometry tonight and let the quiz ride."* Rank by
   **weight × days-remaining × his measured weakness**, and lead with the recommendation.
3. **Teach to understanding, not to the answer key.** Every explanation follows the §6B depth
   standard: define the symbols, state the rule, map the numbers, name the trap. He has said
   repeatedly that a correct-but-terse explanation is useless to him.
4. **He is not the subject expert here — you are.** If he asserts something about the chemistry,
   the microbiology, or how he should be studying, evaluate it as a tutor would. Agreeing because
   he said it is the exact failure this rule exists to prevent. Same doctrine as the MFT rule:
   *"i'm relying on you knowing MORE than me."*
5. **Volunteer what he did not ask about.** A syllabus that says the lowest quiz is dropped, a
   lab that requires a notebook check every week, an exam whose format changed — surface it. He
   cannot ask about what he has not read yet.
6. **Track the calendar as a coach, not a calendar app.** Surface what is coming, what it is
   worth, and what to do about it *now*.

## 1. Read-first order

| # | File | Why |
|---|---|---|
| 1 | `courses/PLAN.md` | **Live handoff state.** What exists, what was removed and why, what is decided. |
| 2 | This file | The intake rules. |
| 3 | `courses/DATA-MODEL.md` | Architecture + the reasoning behind it. |
| 3b | `courses/INGEST-HOWTO.md` | Written for **Trey**, not you — how material gets into the folders (Canvas token, devtools capture, exports). Read it so you can answer him without re-deriving it. |
| 4 | `theknowledgebase/CLAUDE.md` | TKB-wide rules: the ASVAB read-only rule, copyright, CSS prefixes, PDF reading. |
| 5 | `docs/afoqt/QUESTION-DOCTRINE.md` | **The two question rules.** They apply here identically. |
| 6 | `courses/chem/PLAN.md` | Only if the task touches CHEM 1210. It is the reference implementation. |
| 7 | root `CLAUDE.md`, `webdesign.md`, `featuredesign.md` | If you will write a view or a new page. |

---

## 2. The non-negotiables

1. **Never modify a source document.** Everything in `G:\My Drive\SupplementalCourseDocs\`
   is Trey's original. Read it, never write it. Cleaned/derived copies live in the repo (§5.2).
2. **Iterate at the SAME difficulty.** `2+2` iterates to `3+4`, never to `2×354`. A harder
   question is a *different* template with its own band. Structural, not advisory —
   `QUESTION-DOCTRINE.md` rule 1.
3. **No orphan concepts, both directions.** Nothing is taught that nothing tests; nothing is
   tested that no lesson taught. Enforced by the selftest (§8) — rule 2.
4. **Distractors are named error modes**, never noise. Every wrong option is the answer some
   specific, plausible mistake produces, and it says which (`error` / `why` on `h.choices`).
5. **Never ship verbatim commercial text.** The ACS guide, Barron's, MMAHP/MCI, publisher
   slide decks and textbooks are **rulers, not corpora** — read them to set difficulty and to
   extract topic coverage; write new questions. This site deploys publicly to Vercel.
   *(Trey's own typed notes and his own captured quiz questions are his; they still do not get
   published as a public deck — see §9's provenance rule.)*
6. **The ASVAB deck is read-only.** Never write to `asvabQuestions.json` or `subj-asvab`.
7. **No AI API calls from the app, ever.** Generation is Tier 2 (local, procedural, zero-cost)
   or Tier 3 (a prompt Trey pastes into a free chat himself). Never a billed call.
8. **No file upload feature.** Bulk content stays in the Drive; the repo holds derived,
   structured artifacts only. The one standing exception is a parsed worksheet JSON (§3).

---

## 3. Where things live, and which of the three systems to use

There are **three** delivery systems under `courses/`. Picking the wrong one is the most
common way this work goes sideways, so decide deliberately.

| System | Use it when | What you produce | Lives in |
|---|---|---|---|
| **A. TKB question store** (spaced review) | Vocabulary, terminology, definitions, discrete facts. Anything that is *recall*. | Rows in `importQuestions` shape → open-recall flashcards on TKB's existing scheduler | `courses/engine/facts.js` fact sets (Tier 2), or a Tier-3 pasted batch |
| **B. Chem-style curriculum module** | A course with real chapter structure, procedures, and calculations that need unlimited same-band practice. | `curriculum.js` chapters + `lessons/*.md` + seeded `templates/*.js` + gate/lesson/drill/mastery views | `courses/<course>/` — `courses/chem/` is the worked example |
| **C. Worksheet** | A specific lettered-MCQ practice PDF Trey wants to *work through and annotate*, as-is. | A parsed JSON blob + a registry entry | `courses/worksheets/data/<id>.json` |

**How to choose:** if the material is "know this term" → **A**. If it is "be able to do this
kind of problem, repeatedly, forever" → **B**. If it is "let me sit and take this exact
practice sheet" → **C**. A single course can feed all three; CHEM 1210 already does.

### Folder layout for a course

`courses/chem/` is the reference. A new course that graduates to system **B** mirrors it:

```
courses/
  AGENT-PROMPT.md            this file
  SCHEDULE.md                deliverable A — every course's quiz/exam calendar (§6A)
  PLAN.md  DATA-MODEL.md     handoff state + architecture
  <course>/                  e.g. chem/ , micr2060/
    PLAN.md                  per-module live state (chem/PLAN.md is the model)
    SOURCES.md               the source ledger (§5.1) — REQUIRED before any build
    SYLLABUS.md              normalized dates/weights/exam→chapter map (§6C)
    curriculum.js            chapters: id/order/title/summary/minutes/prereqs/testOutPass/concepts
    lessons.js + lessons/*.md
    guides/
      chapter-NN-<slug>.md   deliverable B (§6B)
      exam-N.md              deliverable C (§6C)
    engine/
      generator.js  drill.js  selftest.mjs
      templates/<chapter>.js + index.js
    views/  <Course>.css
```

A course that only ever feeds system **A** needs just `SOURCES.md`, `SYLLABUS.md`, `guides/`,
and a fact set — do **not** scaffold an empty engine it will never use.

---

## 4. Reading the source files — formats and traps

All of these were verified 2026-08-31 against the real folder. Do not re-derive them.

| Format | Readable? | How |
|---|---|---|
| `.md`, `.txt` | ✅ | Read tool. |
| `.pdf` **with** a text layer | ✅ | `node scripts/extractBook.mjs "<path>" --pages 15-40 --out <scratchpad>/x.txt` |
| `.pdf` **scanned** (no text layer) | ⚠️ render it | `pdf-parse` v2's `getScreenshot({first,last,scale:5})` → PNG → **Read the PNG**. Full recipe in `theknowledgebase/CLAUDE.md`. `Microbiology_LAB/SyllabusQuiz.pdf` is one of these — it returns empty text, it is *not* an empty file. |
| `.docx` | ✅ | It is a zip. `unzip -q file.docx -d out/` then parse `word/document.xml` (`<w:p>` → `<w:t>` runs). Images are in `word/media/`. Working snippet in §4.1. |
| `.xlsx` | ✅ | Also a zip. Parse `xl/sharedStrings.xml` + `xl/worksheets/sheetN.xml`. Snippet in §4.1. |
| `.pptx` | ✅ | Also a zip: `ppt/slides/slideN.xml`, text in `<a:t>` runs. The ledger chunks it **one chunk per slide** — a slide is the unit a lecture moves in. Lecture decks are usually the closest thing to "what the instructor thinks is important." |
| **`.gdoc`** | ❌ not locally | **These are not files** — Drive placeholders. Every local read path fails (verified: `fs.readFileSync` → `EISDIR`, PowerShell `Get-Content` and `Copy-Item` → "Incorrect function", despite `Get-Item` reporting 176 bytes). See §4.2 for the four real workarounds — do **not** report this as "unavailable" and stop. |
| `.jpg` / `.png` | ✅ | Read tool displays them. `PerTable.jpg` is a periodic table. |

⚠️ **A 0-byte file is a real thing here.** `chem/Chem1210 Question Database.docx` and
`Microbiology/microsyllabusquiz.md` are both currently empty. Report them as empty and ask —
never silently skip them, and never assume the `.gdoc` next to them is the same content.

### 4.1 Verified extraction snippets

**docx → text** (writes to scratchpad, never the repo):

```bash
cd "$TEMP" && rm -rf dx && mkdir dx && cd dx && unzip -o -q "<path>.docx" && node -e "
const fs=require('fs');
const x=fs.readFileSync('word/document.xml','utf8');
const paras=[...x.matchAll(/<w:p[ >].*?<\/w:p>/gs)]
  .map(p=>[...p[0].matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gs)].map(t=>t[1]).join(''))
  .filter(s=>s.trim());
fs.writeFileSync('out.txt', paras.join('\n\n'));
console.log(paras.length+' paragraphs');
"
```

**xlsx → cells:** same idea — unzip, read `xl/sharedStrings.xml` into an array of `<si>` texts,
then walk `<row>`/`<c r="A1" t="s">` in each `xl/worksheets/sheetN.xml`; `t="s"` means the `<v>`
is an index into the shared strings, otherwise it is a literal.

⚠️ **Write these through the Write tool, not a shell heredoc,** if you save them as a script.
A `\b` or `\d` through a heredoc becomes a literal control byte and the regex silently matches
nothing. This has bitten this repo four times (`theknowledgebase/CLAUDE.md`).

### 4.2 The `.gdoc` problem — four workarounds, ranked

Local file IO cannot reach a Google Doc's content. That is settled (tested three ways, above).
What is *not* settled is that Trey must export by hand every time. Options, best first:

**1. Authorize the Google Drive connector (best — removes the export step entirely).**
This session listed a `claude.ai Google Drive` MCP connector as present but **unauthorized**.
Authorized, an agent reads the live Google Doc directly by name — no export, no stale copy, and
it always reflects the current version. Trey enables it in his **claude.ai connector settings**
(an agent cannot run the OAuth flow for him). If it is connected, **prefer it over the `.docx`
copy** for any `.gdoc`, and note in `SOURCES.md` that the content came from the live doc.
⚠️ The ledger (§5.0) hashes local files, so a doc read through the connector is not tracked by
it — record its ingest state in `SOURCES.md` by section instead.

**2. Auto-export with a Google Apps Script (best hands-off local option).**
One-time setup, then a `.docx` (or `.md`) copy lands in the same Drive folder automatically on a
trigger — nothing manual per edit. In the doc: **Extensions → Apps Script**, paste a script that
does `DriveApp.getFolderById(<folder>).createFile(doc.getBlob().getAs('application/vnd.openxmlformats-officedocument.wordprocessingml.document').setName(name + '.docx'))`
after deleting the previous export, then add a **time-driven trigger** (daily is plenty). This
keeps the ledger working, because the export is a real local file.

**3. Manual export — File → Download → Markdown (`.md`).**
The fallback Trey already offered. **Ask for `.md`, not `.docx`** — it is cleaner to parse, it
diffs properly, and the ledger chunks it far more reliably than a Word zip. Keep the same
basename so the manifest tracks it as one file over time.

**4. Publish-to-web / link-share + fetch the export URL.**
`https://docs.google.com/document/d/<id>/export?format=txt` works without auth **only if the doc
is shared publicly**. That is a real privacy trade for personal course notes, so raise it as a
choice — never do it unilaterally. Listed for completeness, not recommended.

**What to actually do when you hit a `.gdoc`:** check whether the Drive connector is available
(option 1) before asking for anything. If it is not, say which option you recommend and why —
option 2 if the doc will keep growing, option 3 if it is a one-off.

### 4.3 Canvas is the primary source — most material arrives through it

UVU runs Canvas at **`uvu.instructure.com`**. `scripts/canvasFetch.mjs` pulls syllabus,
assignments, quizzes (all with **due dates and point values**), modules, pages and every
uploaded file into the course folder. Trey's own setup instructions: `INGEST-HOWTO.md`.

```bash
node scripts/canvasFetch.mjs                 # list courses + ids
node scripts/canvasFetch.mjs --list          # preview due dates, download nothing
node scripts/canvasFetch.mjs --all           # everything, every active course
```

Auth is a **personal access token** in `CANVAS_TOKEN` (env or `.env.local`) — never a password,
never a token passed as a command argument. If it is missing, the script prints the setup steps;
relay those rather than working around it.

**What this means for you as an agent:**
- A `_canvas/` folder is **machine-generated**. `_canvas/schedule.json` is the best raw input to
  `SCHEDULE.md` that exists — prefer it over parsing dates out of prose.
- `files/` next to it holds real instructor material (slide decks, handouts). Treat those as
  `authority: instructor` in `SOURCES.md` — an instructor's own deck outranks a textbook for
  predicting what gets tested.
- Anything **not** under `_canvas/` is Trey's own; never overwrite it.
- Re-running is idempotent (existing files skipped), so "re-pull then scan the ledger" is the
  normal way to start a session after he's been adding material.

⚠️ **Other sources exist and are not Canvas.** His main chem textbook lives on a separate app
("AcademiQ", `learn-ai-danielscott26.replit.app`) whose `/api/*` is behind a login (verified:
anonymous `GET /api/courses` → `401`). It is captured via a devtools snippet from his own
logged-in tab — see `INGEST-HOWTO.md` §"Source 2". Do **not** ask him for credentials for it.

---

## 5. THE INTAKE PIPELINE

Run these in order, every time new material arrives.

### 5.0 🔴 FIRST: scan the ledger. Never re-read a whole document.

**Trey's documents grow.** `chem1210.docx` gains sections every week. Re-reading the whole file
every pass to find the handful of new paragraphs is the single biggest waste of budget in this
workflow, and he has called it out explicitly. There is a ledger so you don't have to.

```bash
npm run courses:scan                                    # what's NEW / CHANGED / UNCHANGED
node scripts/courseSourceScan.mjs --show "chem/chem1210.docx"   # print ONLY the new paragraphs
node scripts/courseSourceScan.mjs --mark                 # after ingesting: record it
node scripts/courseSourceScan.mjs --mark "chem/chem1210.docx"   # ...one file only
```

How it works: it extracts the **text** (not the container bytes — a `.docx` zip changes on every
save even when the text is identical), splits it into paragraph chunks, and hashes each one. The
manifest at `courses/SOURCE-MANIFEST.json` records which chunk hashes have already been ingested.
So a file that grew by three paragraphs reports `+3 new of 383`, and `--show` prints exactly
those three.

**The rules:**
1. **Always run the scan before opening any source file.** A file listed `UNCHANGED` is fully
   ingested — **skip it entirely**, do not open it.
2. **For a `CHANGED` file, read `--show` output, not the file.** That is the whole point.
3. **Only `--mark` material you actually processed into an artifact.** Marking is a claim that
   the content is now represented in a guide, a fact set, or a template. Marking something you
   merely skimmed silently destroys it — the next agent will skip it forever.
4. **Mark per file as you finish it**, not once at the end of a long run. A run that dies
   halfway then leaves an honest ledger.
5. `SOURCE-MANIFEST.json` is committed. It is the memory that survives sessions — treat a merge
   conflict in it as real, and keep the union of ingested hashes.
6. The ledger tracks *chunks*, `SOURCES.md` (§5.1) tracks *meaning*. Both. The ledger says "these
   400 words are new"; `SOURCES.md` says "this document is the instructor's Exam 2 review and it
   covers Ch 4-6." Neither substitutes for the other.

⚠️ Chunk hashing is exact-match. A paragraph Trey *edits* reads as new (its hash changed) and
its old version stays marked ingested — correct behaviour, but it means an edited paragraph
resurfaces for review. That is cheap and safe. A paragraph that is *reordered* does not
resurface at all, because the hash is unchanged.

### 5.1 Triage and log

For each new/changed file, record one row in that course's `SOURCES.md`:

```markdown
| File | Kind | Authority | Text layer | Ingested | Covers |
|---|---|---|---|---|---|
| chem/chem1210.docx | book-notes + practice | course/instructor | native | 2026-08-31 | Ch 1 §1-1..1-2 |
| chem/acs exam study guide 2nd edition.pdf | national-exam guide | ACS official | native | 2026-08-28 | Ch 1-16 |
```

- **Kind** — one of: `syllabus`, `schedule`, `lecture-slides`, `book-notes`, `quiz-taken`,
  `exam-taken`, `practice-set`, `national-exam-guide`, `lab-manual`, `reference`.
- **Authority** — who the material speaks for. This decides how much weight it carries:
  `national-exam` > `instructor` (their own quiz/exam is the literal thing being graded) >
  `textbook` > `third-party`.
- **Covers** — chapter/section span. If you cannot tell, say so and ask (§11).

`SOURCES.md` is not bookkeeping for its own sake: it is how the *next* agent knows whether a
document was already mined, and it is what makes "re-run on the whole folder" idempotent.

### 5.2 Never edit the original — write a cleaned copy

Cleaned text goes to the **scratchpad** while you work
(`C:\Users\Trey\AppData\Local\Temp\claude\...\scratchpad`). Only *derived, structured* artifacts
land in the repo: guides, curriculum data, templates, fact sets, worksheet JSON. Raw dumps of a
copyrighted book never enter the repo, even cleaned.

### 5.3 The tidy pass — what you MAY and MAY NOT change

Trey's ask: *"a little cleaning up of the docs just to make them tidy."* That is a
**presentation** pass, not an editorial one.

**MAY:** fix extraction artifacts (run-together options `AThe solubility…BThe covalent…` split
back onto their own lines); restore headings; normalize whitespace and bullets; convert `H2O` →
`H₂O` where the source clearly meant a subscript; join hyphen-split words; number questions that
lost their numbers; separate a question from its answer key.

**MAY NOT:** reword his notes; "improve" his phrasing; correct chemistry/biology you believe is
wrong (flag it instead, §11); delete anything you judge unimportant; merge his personal
restatements into the textbook prose; drop his own progress markers.

⚠️ **His inline markers are data.** `chem1210.docx` contains lines like
`1-1 intro – skipped::1:2 start` — that is Trey tracking where he stopped. Preserve them and
use them: they tell you which sections he has actually covered.

### 5.4 The extraction pass — the classification taxonomy

This formalizes `coursenotesfilterexample.md`. Walk the cleaned text and label **every**
paragraph with exactly one class. This is the step that decides what becomes a question.

| # | Class | Looks like | Test for it |
|---|---|---|---|
| 1 | **HARD FACT / PRINCIPLE** | "A chemical change always produces one or more types of matter that differ from the matter present before the change." | Load-bearing and always true. If it were false, downstream reasoning breaks. |
| 2 | **DEFINITION** | "Combustion is the reaction between an organic compound and oxygen to produce CO₂(g) and H₂O(g)." | A term is being bound to a meaning. |
| 3 | **EXAMPLE / INSTANCE** | "The formation of rust is a chemical change because…" | It illustrates a rule stated elsewhere. |
| 4 | **PROCEDURE / FORMULA** | "molarity = mol solute / L solution"; a balancing method; a sig-fig rule | It has variables or steps and can be run on new numbers. |
| 5 | **CONTEXT-ONLY / SCOPE NOTE** | "In this context, an organic compound is a compound made mostly of carbon and hydrogen." | Only true/needed inside this passage. |
| 6 | **FILLER / TRANSITION** | "While many elements differ dramatically… these properties can be used to sort the elements into three classes." | Narrative glue. Usually carries *one* real fact buried in it. |
| 7 | **HIS OWN WORDS** | His restatements and pasted AI-discussion transcripts ("Measurable properties are the stuff you can directly observe or put a number on…") | First person, informal, explanatory. |
| 8 | **REAL TEST ITEM** | A question he was actually asked, with options and often a key | It came off a quiz, exam, or an assigned practice set. |

**Class 6 is where agents fail.** Trey's own note on that paragraph: *"filler section to
introduce the next section. Most of this isn't worth pruning to study… valid question 'what are
the three element classes'… perhaps other questions could be derived but you would have to tie
it into other knowledge to make it a more thoughtful question."* Extract the one real fact,
drop the glue, and do not manufacture three shallow questions out of one transition.

### 5.5 Routing — where each class goes

| Class | Destination | Notes |
|---|---|---|
| 1 HARD FACT | Lesson body **and** a question | The single highest-value class. Both, always. |
| 2 DEFINITION | `FactRow` (`term` / `gloss` / `confusions`) → system **A** | `confusions` names the terms genuinely mixed up with it. Never pad with an unrelated term. |
| 3 EXAMPLE | Lesson body; optionally a recognition question | *"What does C₈H₁₈(l) + O₂(g) → CO₂(g) + H₂O(g) represent?"* |
| 4 PROCEDURE | A seeded **template** (system **B**) | This is the only class that yields unlimited same-band practice. |
| 5 CONTEXT-ONLY | A clarifying note on the related card | **Never its own question.** |
| 6 FILLER | Mine one fact, then drop | Do not inflate. |
| 7 HIS OWN WORDS | The lesson's plain-English layer (§6B) | **Never a question stem.** This is the register explanations should be written in. |
| 8 REAL TEST ITEM | Difficulty ruler + error-mode source; `provenance` tagged | Do **not** ship an instructor's question verbatim to a public deck. Use it to calibrate a band and to learn which mistakes that instructor baits. |

### 5.6 Build or extend

Now produce/update the deliverables in §6. Prefer **extending** what exists over creating a
parallel structure — a second chapter list or a second guide for the same chapter is the
failure mode here, not a feature.

### 5.7 Verify

§8. Non-optional. Structural checks pass constantly on content that reads terribly, so the
sampling step is where real defects are actually caught.

---

## 6. The four standing deliverables

### A. `courses/SCHEDULE.md` — the calendar, in list format

Trey's ask: *"a schedule built out in list format so i can know when/what each quiz/exam is
going to be coming up so i can study accordingly."*

One file, all courses, chronological, **flat list** — not a per-course grouping, because the
question it answers is "what is coming at me next."

```markdown
# Fall 2026 — assessment schedule
_Last rebuilt: 2026-09-xx from: CHEM 1210 syllabus (p.3), MICR 2060 Canvas schedule_

## Next 14 days
- **Tue 09-08** · CHEM 1210 · Quiz 1 · Ch 1-2 · 5% · [study guide](chem/guides/exam-1.md)
- **Fri 09-11** · MICR 2060 · OLQ 1 · MMAHP Ch 1 · 3% · [guide](micr2060/guides/chapter-01.md)

## Full term
| Date | Course | Assessment | Covers | Weight | Guide |
|---|---|---|---|---|---|
| 2026-09-08 | CHEM 1210 | Quiz 1 | Ch 1-2 | 5% | … |
| 2026-12-xx | CHEM 1210 | ACS Final | Ch 1-8 | **>50%** | … |

## Unknown / needs a syllabus
- ESFF 1120 — no syllabus in SupplementalCourseDocs yet.
```

Rules:
- **Every row cites its source.** A date with no source is a guess, and a guessed exam date is
  worse than a missing one. Put unsourced items in the "Unknown" section.
- **The roster comes from `ClassSchedule_2026Fall.xlsx`** (sheet 2 = the registered course list
  with CRNs; sheet 1 = the weekly meeting grid). That spreadsheet is authoritative over
  `coursesSeed.js`. ⚠️ As of 2026-08-31 they disagree — see §10.
- Rebuild the whole file rather than appending; it is derived data.
- Weight matters as much as date. A 5% quiz and a 50% final do not get equal study time.

### B. Chapter study guide — `<course>/guides/chapter-NN-<slug>.md`

One per chapter. This is the "I have 40 minutes before class" artifact.

Required sections, in this order:

1. **What this chapter is actually about** — 2-3 sentences, plain English, no jargon that the
   chapter itself defines.
2. **Vocabulary** — table: term · plain-English gloss · what it gets confused with.
3. **The rules that carry weight** — every class-1 HARD FACT, stated once, cleanly.
4. **Procedures** — each formula/method with **every symbol defined in words**, a worked
   example with the numbers labelled by role, and the failure mode.
5. **Traps** — from real missed questions, and from the error modes in the templates.
6. **In your own words** — the class-7 material, kept in his register.
7. **Practice** — links into the drill for this chapter; the count of templates covering it.
8. **Sources** — which documents this chapter was built from.

**Explanation depth is the standard Trey set (2026-08-30) and it is binding:**

> Define every symbol and term in plain English → state the general rule → map *these specific
> numbers* to their role and say **why** → show the computation → name the trap and say why
> it's wrong.

Concretely: `I = P × r × t` is not an explanation. **I** is the interest earned — the thing
asked for; **P** is the principal, the original amount; **r** is the annual rate as a decimal;
**t** is the time in years, which is 7 *because the problem says the money sits for 7 years*.
"Simple" means it is always computed on the original principal, so the same dollar amount is
added each year. And the common wrong answer $3,900 is the final *balance*, which confuses "how
much it grew" with "how much is there now."

Two more rules from the same session:
- **Never assume a word is known because it appeared in the answer.** If an explanation says
  "reciprocal," it must say what a reciprocal is. He missed the question — that is the evidence
  he doesn't have the term.
- **Never repeat the same boilerplate across many explanations.** Five misses that all say
  "use the CHARGE principle" is not five explanations. If the same sentence would fit every
  item in a set, it belongs in the lesson, not in each item's explanation.

### B2. 🔴 Syllabi — mine ALL of it, not just the dates

Trey, 2026-08-31: *"They are FULL of important information that i expect to be added to this
course tool to help me keep up on things as well as the agent knowing what information will be
going into which exams etc."*

A syllabus is the highest-authority document a course produces — it is the instructor stating,
in writing, exactly how the grade is computed. **Never skim one for dates and move on.** Every
syllabus produces a `<course>/SYLLABUS.md` with all of the following that the document contains:

| Section | Why it matters |
|---|---|
| **Grade weights** | The single most decision-relevant fact in the file. Drives every study-time recommendation. A 5% quiz and a 30% exam are not both "an assessment." |
| **Assessment map** | Which chapters are on which exam, and when. This is what makes deliverable C possible at all. |
| **Drop / retake / replacement rules** | "Lowest quiz dropped", "final replaces lowest exam", "unlimited attempts" — these change strategy completely and he will not remember them unprompted. |
| **Late / makeup / attendance policy** | A missed lab that cannot be made up is a different risk than one that can. |
| **Required materials** | Access codes, lab notebooks, calculators (and which models are banned on exams). |
| **Weekly topic schedule** | Maps calendar dates to chapters — the spine of both the schedule and the guides. |
| **Instructor + office hours** | Where to go when stuck; a real study resource, not trivia. |
| **Exam logistics** | Format, item count, time limit, open/closed book, location, proctoring. Pacing practice depends on this. |
| **Standardized-exam notes** | e.g. CHEM's ACS final. Flag its weight loudly. |

Rules:
- **Weights must total 100%.** If they don't, you misread the file — re-read it, don't guess.
- **A Canvas due date beats a printed syllabus date** when they conflict; instructors move dates
  in Canvas without reissuing the PDF. Note the conflict rather than silently picking one.
- **A syllabus quiz is a syllabus source.** `Microbiology_LAB/SyllabusQuiz.pdf` is a graded quiz
  *about* the syllabus — its questions state grading components and attendance rules directly.
  Mine it like a syllabus (and note which items he missed: those are the policies he has already
  demonstrated he doesn't know).
- **Everything mined lands in `SYLLABUS.md`, and the dated rows also land in `SCHEDULE.md`.**
  One is the reference, the other is the calendar.
- After ingesting any syllabus, **report the three things he most needs to act on** — per §0.5,
  don't just file it.

### C. Exam study guide — `<course>/guides/exam-N.md`

Trey's ask: *"a study guide based on each 'exam' that i will be taking, based on the syllabi
some courses cover different amount of chapters in each exam. at different times."*

**The chapter→exam mapping is per course and comes from the syllabus. Never assume.** Exam 2 is
not automatically "the chapters since Exam 1," and a final is not automatically cumulative.
Record the real mapping in `<course>/SYLLABUS.md` first:

```markdown
## Assessment map
| # | Assessment | Date | Covers | Weight | Format |
|---|---|---|---|---|---|
| 1 | Exam 1 | 2026-09-26 | Ch 1-3 | 15% | 40 MC, in class, 50 min |
| F | ACS Final | 2026-12-xx | Ch 1-8 | >50% | ACS standardized, 70 items, 110 min |
```

The exam guide then contains, in order: the assessment's own facts (date, format, minutes,
item count, calculator/equation-sheet rules); a **weighted** breakdown of which chapters carry
how much of it; the union of those chapters' traps; a "if you only have one hour" section
ranked by weight × weakness; and a link to a mixed drill covering exactly that chapter span.

**Where the format is known, the practice must match it.** A 50-minute 40-item exam is a pacing
problem as much as a knowledge problem — say the per-item budget out loud (75 s/item here).

### D. Curriculum, drills, exams — the AFOQT-grade build

Reserved for system **B** courses. `courses/chem/` is the worked example: 9 chapters, 88
templates, gate → lesson → drill → mastery, selftest-clean. Match that bar.

Per chapter you need: an entry in `curriculum.js` (with a real `concepts` list), one lesson
`.md`, and enough templates that **every listed concept is tested** and **no template tests a
concept the chapter doesn't list**. Bands 1-3 within the chapter, spread across them.

The gate/lesson/drill relationship, copied from AFOQT and confirmed correct there: **failing a
test-out gate never locks the lesson or the drill.** Both stay reachable and repeatable
indefinitely. Do not add a lock.

---

## 7. Exact contracts

### Seeded template (system B)

```js
import { registerChemTemplate } from '../generator.js';

registerChemTemplate({
  id: 'chem1-toolbox-unit-prefix',      // unique, kebab, prefixed by course+chapter
  chapterId: 'chem1-00-toolbox',        // must exist in curriculum.js
  band: 1,                              // 1-3. THE SAME-DIFFICULTY RULE, MADE STRUCTURAL.
  name: 'Metric prefix conversion',
  concepts: ['unit-conversions'],       // must all be listed by the chapter
  generate: (rng, h) => ({
    stem: `…`,
    ...h.choices(
      correctValue,                                   // or { value }
      [ { value: wrong1, error: 'inverted-conversion', why: 'inverted the direction' },
        { value: wrong2, error: 'off-by-one-power',   why: 'was off by one power of ten' } ],
    ),
    explanation: `…`,                    // to the §6B depth standard
  }),
});
```

`h`: `h.int(min,max)`, `h.pick(arr)`, `h.rng`, `h.seed`, `h.choices(correct, distractors)`.
4 options. `(templateId, seed)` regenerates byte-identically, forever.

### Fact row (system A)

```js
{ id, term, gloss, tags: [], difficulty: 'basic'|'intermediate'|'advanced',
  confusions: ['id-of-another-row'],     // genuinely confused with — never filler
  recallStem: 'a question this term answers' }   // omit if the gloss fits >1 term
```

→ `generateFactQuestions(course, rows)` in `courses/engine/facts.js`.

### Imported question row (both tiers converge here)

```json
{ "question": "", "answer": "", "answer_alternates": [], "subject": "CHEM 1210",
  "subtopic": "", "difficulty": "basic|intermediate|advanced",
  "pipeline": "quick_fact|main_recall", "style_tags": [], "source_note": "" }
```

Committed via `useTkbData().importQuestions(jsonText)`, deduped by `engine/dedup.js`.
Full Tier-3 prompt: `docs/notesToQuestionsPrompt.md`; builder: `engine/promptBuilder.js`.

### Curriculum chapter

```js
{ id, order, title, summary, minutes, prereqs: [], testOutPass: 4, concepts: [] }
```

---

## 8. Verify — commands and the checklist

```bash
npm run chem:selftest                    # per-template structure + bidirectional coverage
node src/pages/theknowledgebase/courses/chem/engine/selftest.mjs --samples=10000
npm test                                 # vitest
npm run lint
npm run build
```

Then, and this is the part that actually catches defects:

- [ ] **Print real generated questions and read them.** A selftest proves a question is well
      *formed*, never well *written*.
- [ ] Read three explanations aloud against the §6B standard. Is every symbol defined? Is the
      trap named?
- [ ] Is the same sentence repeated across many explanations? (The "CHARGE principle" failure.)
- [ ] Every chapter concept tested; every template concept declared. (Selftest enforces it —
      confirm it actually ran.)
- [ ] No control bytes: `LC_ALL=C grep -rn $'[\001-\010\013\014\016-\037]' src/pages/theknowledgebase/courses/`
- [ ] If a view changed: real browser check, and body text ≥1rem per `webdesign.md` §1c.
- [ ] `SOURCES.md`, the module `PLAN.md`, and `SCHEDULE.md` updated.
- [ ] **`--mark` run for every file actually processed**, and `npm run courses:scan` re-run to
      confirm it now reports `UNCHANGED`. An unmarked ingest means the next agent redoes it;
      a mark on unprocessed material means the next agent skips it forever.

⚠️ **The single most expensive recurring bug in this module:** building a wrong answer by
regex-mutating the correct answer's string. It produced a visibly garbled `4s²⁶`, and — worse —
an ASCII `\d` pattern silently failed to match Unicode superscripts, so the "distractor" came
out identical to the answer and was silently deduped away, permanently losing that error mode
with no visible symptom. **Hand-write the wrong string as its own value.** Never derive it.

---

## 9. Per-course dossiers

### CHEM 1210 — Principles of Chemistry I

**Two audiences, and they are not the same test.** The ACS standardized final is *debatably
harder* than the instructor's own questions and is **>50% of the grade**. Every chapter guide
must serve both:

| Audience | Source of truth | Character |
|---|---|---|
| **ACS national exam** (>50%) | `chem/acs exam study guide 2nd edition.pdf` — official ACS, 2nd ed. 2018, 209 pp, native text, PDF page = printed page + 7 | Formulaic, calculation-heavy, standardized. Chapters have worked Study Questions (SQ) and unexplained Practice Questions (PQ) with a letter key at chapter end. |
| **Instructor's quizzes/exams** | `chem/chem1210.docx`, class slides, quizzes he has taken | Passage-based conceptual MC, "which statement best…" framing, macroscopic/particle/symbolic-domain distinctions. |

Chem 1 = ACS Ch 1-8 (Atomic Structure · Electronic Structure · Formula Calculations and the
Mole · Stoichiometry · Solutions and Aqueous Reactions Pt.1 · Heat and Enthalpy · Structure and
Bonding · States of Matter). Ch 9-16 are Chem 2 — **not in scope** unless asked.

- ⚠️ The ACS guide is **copyrighted**. Ruler, not corpus. Its SQ explanations especially must
  not be copied. Use its "Knowledge Required:" tags for concept lists — that is exactly how
  `chem/curriculum.js` was built.
- ⚠️ Exponents, subscripts and nuclear notation extract as garbage from it in plain text. The
  rendered page is clean — use the `getScreenshot` path for those.
- `chem1210.docx` (2.6 MB, ~380 paragraphs, 6 images) is **the richest single source in the
  folder** and contains four distinct layers that must be routed differently: OpenStax-style
  section prose (classes 1-4), MCQs with per-option `Correct:`/`Wrong:` rationales (class 8 —
  and those rationales are *ready-made error modes*, mine them), his own AI-discussion
  transcripts and restatements (class 7), and end-of-section exercises (class 8, often with no
  key — do not invent one, work it and mark it as your answer).
- Existing module: `courses/chem/` — 9 chapters, 88 templates, selftest-clean. **Extend it.**
  Known gaps (✂️, from `chem/PLAN.md`): no figures, no timed-exam mode, no real question bank.

### MICR 2060 / MICR 2065 — Microbiology for Health Professions (+ Lab)

Vocabulary-dominant → system **A** is the primary fit, with worksheets (**C**) for the MCI sets.

- `Microbiology/MCI for OLQs 1-4 on MMAHP Ch 1-4.pdf` — 36 pp of real MCQs covering MMAHP
  Ch 1-4. ⚠️ **It has no answer key anywhere**, despite "Answered and Explained" in the title.
  Do not fabricate one; work the items and mark your answers as *derived*.
- Already parsed as worksheet `mmahp-ch1-4` via `scripts/parseMciWorksheet.mjs`. That script is
  written for the whole MCI *family* — re-run it for the next file in the series rather than
  writing a new parser. It hard-fails on structural mismatch by design.
- `Microbiology/microsyllabusquiz.md` is **0 bytes**. `MicroOQL's.gdoc` is **unreadable** (§4).
- `Microbiology_LAB/SyllabusQuiz.pdf` and `SAFETYQUIZ.pdf` are **scanned** — render, don't parse.

### The rest

ESMG 3200 · ESFF 1120 · PHIL 2050G · AERO 1100/1430R/1800R/2000/2100. No material has arrived
for any of them. When it does: run §5, start at system **A**, and do not scaffold a curriculum
module for a 0.5-credit lab. The AERO courses are `trackingLevel: 'light'` by default.

---

## 10. Known traps — dated, verified, do not re-derive

| Date | Trap |
|---|---|
| 2026-08-31 | **`.gdoc` files cannot be read by any local tool** — OS-level failure, not an empty file. Four real workarounds in §4.2; the Google Drive connector is the one that removes the manual step. |
| 2026-08-31 | **Never re-read a whole source document.** Run `npm run courses:scan` first and read only `--show` output. Trey flagged repeat-reading of already-ingested material as wasted budget. |
| 2026-08-31 | **`coursesSeed.js` disagrees with the registrar.** The xlsx lists 10 registered courses / 17.5 hrs including **AERO 1430R** (Air Force Physical Training) and **AERO 1100** (DAF Professionalism A), which the seed lacks; the seed lists **PHIL 2050G**, which is not in the registration. The spreadsheet is authoritative. Flag it — do not silently rewrite the seed, it is edit-once and may already be customized in his account. |
| 2026-08-31 | **No syllabus with dates exists in the folder for any course.** `SCHEDULE.md` cannot be populated until one lands. Ask for it; do not guess dates. |
| 2026-08-31 | 0-byte files are real: `Chem1210 Question Database.docx`, `microsyllabusquiz.md`. |
| 2026-08-28 | Distractors built by regex-mutating the correct string → garbled output, or a silent no-op that duplicates the answer. Hand-write wrong values. |
| 2026-08-28 | ACS guide: copyrighted; PDF page = printed + 7; superscripts extract as garbage. |
| 2026-08-28 | **Documents / Assessments / RealQuestions / pattern-analysis were removed** at Trey's request ("i put everything in manual those are a waste"). Do not re-add without him asking. |
| 2026-08-26 | Worksheets are the one exception to "no content in the repo" — parsed JSON, never the PDF. |
| — | Never write a regex through a shell heredoc. Four incidents. |
| — | `courses/` CSS prefix is `crs-`; chem is `chq-`. Inherit `--tkb-*` tokens, no new palette. |

---

## 11. Decide yourself vs. ask Trey

**Decide yourself:** classification of a paragraph; which of the three systems fits; band
assignment; distractor error modes; guide wording; file/section naming; whether a passage is
filler.

**Ask, and do not guess:**
- Any **date, weight, or exam→chapter mapping** not stated in a document.
- Whether a source you believe contains an **error** is actually wrong (quote it, say why).
- Which chapters an instructor actually **assigned** vs. what the book contains.
- Anything requiring a `.gdoc` export or a file that isn't there.
- Whether a course should graduate from system **A** to a full **B** module — that is a large
  build and his call.

**Ask, never quietly drop:** if a source seems unavailable, search for an alternative first and
report what you checked and what each returned. Root `CLAUDE.md` — *"never declare one
'unavailable' from a sample of one."*

---

## 12. End-of-run report

Every run ends with, in the chat (not only in a file):

1. **Sources processed** — file, kind, how many chunks were new, what came out of them, and
   which files you skipped as `UNCHANGED`. State plainly that the ledger was marked.
2. **What was created/changed** — with paths.
3. **Coverage matrix** — every requirement of the request: Done / Partial / Missing / Cut.
4. **Verification** — which commands ran, what they returned, and what you *read* (not just
   what passed).
5. **✂️ Omissions, deferrals, downgrades** — each with what's blocked, why, what you tried,
   and what would unblock it.
6. **Questions for Trey** — the §11 list.
7. **Docs updated** — `SOURCES.md`, `PLAN.md`, `SCHEDULE.md`.

A run that reports only "done" has not reported.
