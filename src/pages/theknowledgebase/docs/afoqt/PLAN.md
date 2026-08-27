# AFOQT Build — LIVE HANDOFF STATE

**This file is the resume point.** A fresh session should be able to read this file alone
and know exactly where to pick up. Update it at the end of every working block.

- **Test date:** ~6 weeks from 2026-08-19 (≈ early October 2026)
- **Stakes:** 2 lifetime attempts, 150 days apart (90 for AFROTC). A test in early Oct
  puts attempt #2 in **late Feb 2027** — there is **no second attempt in 2026**.
  Treat attempt #1 as the one that counts.
- **Goal:** all six composites. "Dominate all the topics even if I'll never use them."

---

## STATUS BOARD

| Phase | Scope | Status |
|---|---|---|
| **0** | Docs, folder CLAUDE.md, OATTS ingestion, book tooling | ✅ **DONE** |
| **1** | Foundation: schema, spec, generator runtime, timing, storage, routes, runner | ✅ **DONE** |
| **2** | ASVAB parking + cleanup + migration | ✅ **DONE** |
| **3** | Math Knowledge (5 of 6 composites) | ✅ **DONE** |
| **4** | Table Reading (all 3 rated composites, 100% generatable) | ✅ **DONE** |
| **5** | Aviation Information (largest teaching build) | ✅ **DONE** |
| **6** | Instrument Comprehension (+ renderers) | ✅ **DONE** |
| **7** | Block Counting (+ isometric renderer) | ✅ **DONE** |
| **8** | Arithmetic Reasoning | ✅ **DONE** |
| **9** | Word Knowledge | ✅ **DONE** |
| **10** | Verbal Analogies | ✅ **DONE** (2026-08-26 — PARTS 10/10B/10C/11/11B/12/13 all landed in one session) |
| **11** | Reading Comprehension | ✅ **DONE** (2026-08-26 — PARTS 15/16/17/18 all landed) |
| **12** | Physical Science *(unscored)* | ✅ **DONE** (2026-08-26 — PARTS 20/20B/21/21B/22/23 all landed) |
| **13** | Situational Judgment + SDI *(unscored, SJT disputed)* | ✅ **DONE** (2026-08-26 — PARTS 25/25B/25C/25D/25E all landed. SDI decided NOT built as an interactive tool (Trey's call).) |
| **14** | Exam sim, composite scoring, diagnostic, dashboard | 🟨 Composite scoring engine (PART 27) and the full-length exam runner (PART 28) both done 2026-08-26 - practice accuracy, not the real percentile, see notes below; diagnostic mode + trend analytics (PARTS 29/30) still `[L]` locked, not started |

**Recommended deviation:** build the diagnostic in reduced form right after Phase 4,
seeded from official OATTS items. Trey's stated goal is "understand where I'm weak and how
the test feels" — he should get that in week one, not week five.

---

## PHASE 0 CHECKLIST

- [x] `QUESTION-DOCTRINE.md` — the two core rules, calibration ladder, copyright line
- [x] `PROJECT.md` — requirements captured verbatim
- [x] `RESEARCH.md` — all sourced AFOQT facts + URLs
- [x] `CONTRIBUTING-QUESTIONS.md` — hand-off format for Trey / outside AIs
- [x] Folder-scoped `src/pages/theknowledgebase/CLAUDE.md` (registered in root CLAUDE.md) + slim memory pointers
- [x] `pdf-parse` v2 installed + `scripts/extractBook.mjs` written and verified on all three books
- [x] `.gitignore` — `*.pdf` / `*.epub` blocked under the TKB folder
- [x] Tooling documented in the folder-scoped CLAUDE.md
- [x] OATTS ingestion → **89 official questions** in `afoqt/data/realQuestions.json`

---

## WHAT IS ALREADY DECIDED (do not re-litigate)

1. **Templates, not static questions.** Unit of content is a generator with a difficulty
   band. See `QUESTION-DOCTRINE.md`.
2. **Mastery tracked per TEMPLATE, not per instance.** `(templateId, seed)` regenerates a
   question byte-identical, so misses replay without storing text. One Firestore doc:
   `users/{uid}/afoqt/progress`.
3. **ASVAB is preserved, never deleted.** Soft-retire junk via the existing
   `REMOVED_QUESTION_IDS` + `CONTENT_SYNC_VERSION` mechanism in `tkbStorage.js`.
4. **CSS prefix `afq-`**, inheriting `--tkb-*` tokens. No new palette.
5. **Lessons are markdown** rendered with `react-markdown` (already a dependency).
6. **Physical Science / SJT / SDI are in NO composite** — built last, sized small.
7. **Barron's = target band, Trivium = ceiling (`stretch`, untimed), Phillips = floor.**

---

## THE KEY NUMBERS (from AFPC official pamphlet)

| Subtest | Qs | Min | sec/Q |
|---|---|---|---|
| Block Counting | 30 | 4.5 | **9.0** |
| Table Reading | 40 | 7 | **10.5** |
| Word Knowledge | 25 | 5 | **12.0** |
| Instrument Comprehension | 25 | 5 | **12.0** |
| Verbal Analogies | 25 | 8 | 19.2 |
| Aviation Information | 20 | 8 | 24.0 |
| Physical Science | 20 | 10 | 30.0 |
| Math Knowledge | 25 | 22 | 52.8 |
| Arithmetic Reasoning | 25 | 29 | 69.6 |
| Reading Comprehension | 25 | 38 | 91.2 |
| Situational Judgment | 50 (16 scenarios) | 35 | 42.0 |
| Self-Description Inventory | 240 | 45 | 11.25 |

**Composites:** Pilot = MK+TR+IC+AI · CSO = WK+MK+TR+BC · ABM = VA+MK+TR+IC+BC+AI ·
Verbal = VA+WK+RC · Quantitative = AR+MK · Academic = Verbal ∪ Quantitative.
**MK is in 5 of 6. TR is in all 3 rated ones.**

**No guessing penalty.** Always mark an answer.

---

## OPEN ITEMS / WAITING ON TREY

- [ ] Quizlet deck dumps → `afoqt/data/raw/` (raw paste, `# source:` + `# subtest:` headers)
- [ ] Reddit study-guide dumps → same folder
- [ ] Confirm paper vs. eAFOQT delivery (changes pace targets ~2-3 s/question)
- [ ] Library: LearningExpress via <https://onlinelibrary.utah.gov/> (confirmed to carry AFOQT)
- [ ] Retry DTIC reports (apps.dtic.mil was down): AD1203687, AD1168029, AD1157021

## KNOWN GAPS (flagged, not dropped)

- No AFOQT-specific open word list found — substitute is a GRE/SAT high-frequency list
- Reddit unreachable from automated search — Trey supplies this
- Quizlet/UnionTestPrep/Docsity are 403 to automation — Trey supplies these
- Within-subtest back-navigation on the computer version: unconfirmed

---

## PHASE 0 FINDINGS (2026-08-19)

### Barron's is confirmed and mapped
`Military Flight Aptitude Tests`, **Terry L. Duran, 4th Edition, 2018**, ISBN
978-1-4380-1104-2, **700 PDF pages**. This *is* the "Barron's 4th" the Reddit reporters
praise. Contains **two full AFOQT practice tests** plus subtest reviews.

**Page offset: book page + 9 = PDF page.**

| Section | Book p. | PDF p. |
|---|---|---|
| Part I: Aviation background | 1 | 10 |
| Part II: Testing formats & review | ~40 | ~49 |
| **AFOQT Practice Test #1** | **217** | **226** |
| **AFOQT Practice Test #2** | **315** | **324** |
| SIFT #1 / #2 | ~415 | ~424 |
| ASTB-E #1 | 517 | 526 |
| ASTB-E #2 | 615 | 624 |

**Extraction quality — corrected, it is NOT a blanket problem:**

| Book | Pages/files | Text layer | Verdict |
|---|---|---|---|
| Trivium 2021-2022 | 164 pp | **Native** | Clean, no OCR damage |
| Complete Study Guide | 28 xhtml (~280k chars) | **Native** | Clean |
| Barron's 4th Ed | 700 pp | **OCR'd library scan** | Prose fine; **tables, dot leaders and math notation mangled** |

⚠ Only Barron's needs care, and only for numbers/tables/math (`517` → `Sy7`; the composite
table lost every X mark). **Trey does NOT need to hand-transcribe anything** — extraction
is automated and costs him nothing.

⚠ **What genuinely cannot be extracted from any book: images and diagrams.** Instrument
Comprehension dials, Block Counting piles, Table Reading grids. Those need screenshots
from Trey, referenced by page.

### Composite count correction
Barron's p.217 states **seven** composite scores and its table has a **Situational
Judgment** column. This contradicts the earlier "three subtests worth zero" conclusion.
**Physical Science and SDI are unscored; SJT is disputed and should be treated as
probably-scored.** See `RESEARCH.md` → "Composite count is DISPUTED".
Also independently confirms **Block Counting = 4.5 minutes**.

### Tooling
`scripts/extractBook.mjs` handles both PDF (pdf-parse v2) and EPUB (jszip, already a dep):
```
node scripts/extractBook.mjs "G:/My Drive/<file>" --info
node scripts/extractBook.mjs "G:/My Drive/<file>" --pages 226-240 --out <scratchpad>/x.txt
```
**Always write extracted text to the scratchpad, never the repo** (copyright line).

### Remaining Phase 0 work
- [x] `.gitignore` — `*.pdf` / `*.epub` blocked under the TKB folder
- [x] OATTS ingestion → **89 official questions** in `afoqt/data/realQuestions.json`
- [ ] Extract Barron's AFOQT Test #1 (PDF 226-324) for band calibration
- [x] Trivium PDF + EPUB probed — both native text, clean

---

## BARRON'S PAGE MAP (book page + 9 = PDF page)

Located by text extraction 2026-08-19. **Text extracts fine from all of these; only the
DIAGRAMS need visual capture.**

### AFOQT Practice Test #1 — starts PDF 226
| Subtest | PDF page | Diagrams? |
|---|---|---|
| #1 Verbal Analogies | 227 | no |
| #4 Math Knowledge | 237 | some geometry figures |
| #6 Situational Judgment | 251 | no |
| #7 Self-Description Inventory | 263 | no |
| **#9 Table Reading** | **267–271** | ⚠ **YES — the grid** |
| **#10 Instrument Comprehension** | **271–277** | ⚠ **YES — dials + silhouettes. Most critical.** |
| **#11 Block Counting** | **~277–282** | ⚠ **YES — block piles** |
| #12 Aviation Information | ~282–286 | some |

**AFOQT Practice Test #2 — starts PDF 324.** Same order, roughly +98 pages
(TR ≈ 365, IC ≈ 369, BC ≈ 375).

### Part II review chapters (book p. → PDF p.)
| Section | Book | PDF |
|---|---|---|
| AFOQT format overview | 45 | 54 |
| Test-taking strategies | 59 | 68 |
| Reading Comprehension | 69 | 78 |
| Parts of a Word (roots/prefixes) | 74 | 83 |
| Vocabulary | 80 | 89 |
| **Mathematics Review** | 97 | 106 |
| ├ Fractions / Decimals / Exponents / Square Roots | 101/106/108/109 | 110/115/117/118 |
| └ **Geometry** | ~115 | **~124** |
| **Technical Knowledge / Aviation Information** | **125** | **134** |
| ├ How We Fly | 126 | 135 |
| ├ Newton's Laws | 133 | 142 |
| ├ **Flight Theory & the Flight Envelope** | 134 | 143 |
| ├ Aviation/Aerospace milestones | 156 | 165 |
| └ **Airport and Runway Information** | 159 | 168 |
| ~~Nautical Information~~ | 161 | 170 | ✂️ skip — not AFOQT |
| Science Review | 169 | 178 |

### ⚠ PAGE RASTERISATION IS BROKEN IN THIS ENVIRONMENT — do not retry blind

Tested and **failed** 2026-08-19. Do not burn tokens re-attempting these:

| Attempt | Result |
|---|---|
| `pdf-parse` v2 `getScreenshot()` | Renders **blank** — draws vector/text layers but not embedded bitmaps |
| `pdf-parse` v2 `getImage()` | `Image object img_p225_1 not found` |
| `pdf-to-img` (installed, tested, **uninstalled**) | Renders **blank on BOTH books** |

**Two separate causes, and the second is the fatal one:**
1. Barron's pages are **JPEG 2000 (JPX)** scans — `JpxError: OpenJPEG failed to initialize`.
2. **But Trivium, a native-text PDF, also rendered blank.** So the canvas/rasterisation
   backend itself is not compositing in this Node build. This is not a JPX-only problem
   and would not be fixed by solving the JPX decode.

**Text extraction is unaffected and works perfectly on all three books.** Only *pixels*
are unavailable.

**Resolution: Trey supplies screenshots** of the ~25 diagram pages flagged ⚠ in the page
map above. He offered; this is the right use of that offer. A poppler (`pdftoppm`) system
install would likely also work and is the fallback if the screenshot list grows large.

**Do NOT ask him to capture the whole book** — text is fully automated, and only the pages
flagged ⚠ actually need eyes.

### RESOLVED — the EPUB supplies every diagram, extractable programmatically

**No screenshots are needed.** `The Complete AFOQT Study Guide 2020-2021.epub` contains
**66 images as ordinary files inside the zip** (an epub is a zip; `jszip` is already a
dependency). Extracted and verified 2026-08-19. This closes the P1/P2/P3 request list
entirely.

| Source chapter | Images | Covers |
|---|---|---|
| `s9` + `c12_ic` — Instrument Comprehension | `09-ex1/ex2`, `09-1..5`, `ptic_01..12` = **19** | ⭐ P1 — dials + 4 silhouettes, full convention |
| `c10` + `c12_bc` — Block Counting | `10-1..3`, `10-pq1/pq2`, `ptbl_1..6` = **11** | ⭐ P1 — numbered 3-D piles |
| `s8` + `c12_tr` — Table Reading | `08-example`, `08-practice`, `08-1..8` = **10** | ⭐ P1 — the grid |
| `c11` — Aviation Information | `11-01..11-16` = **16** | ⭐ P2 — aviation diagrams |
| `s4` — Math Knowledge | `04-01a..04-10` = **10** | ⭐ P3 — geometry figures |

Extract with:
```
node -e "…jszip…"   # see git history, or re-derive: filter zip entries by /\.(png|jpe?g|gif)$/
```
Write them to the **scratchpad, never the repo**.

⚠ **Important limitation.** This epub is the **FLOOR** anchor ("way too easy"). It is
authoritative for **visual convention** — dial layout, silhouette views, pile rendering,
grid format are standardised and identical across publishers — but it is **NOT**
authoritative for **visual difficulty**. Barron's block piles likely have more blocks and
more ambiguous occlusions; its dials may use subtler bank angles.

**Therefore:** Barron's diagram pages (PDF 267–282, 124–134, 135/143/168) are **downgraded
from blocking to optional**. Ask Trey for them later, when calibrating *how hard the
generated figures should look* — not now, and only a handful.

---

## TREY'S BARRON'S SCREENSHOTS — `G:\My Drive\baarronsscreenshots\`

15 PNGs (`2.png`–`16.png`, `Untitled.png`), captured 2026-08-19. Page numbers are not in
the filenames; identify by content. ⚠ **Some have a duplicated band at the top — that is a
capture artifact, not the book.** Ignore repeated strips.

Confirmed contents so far: `5.png` = Block Counting Qs 16–25 (piles + KEY tables) **and**
the Verbal Analogies answer key with per-item explanations.

**Findings already extracted from them:**
- ⭐ **Block Counting keys can run DESCENDING** (block 23 = `A6 B5 C4 D3 E2`) — corrected
  in `RESEARCH.md` and the folder `CLAUDE.md`. Generator must randomise range **and**
  direction.
- Barron's draws piles as **line-art wireframe**; OATTS/epub uses **shaded 3-D colour**.
  Both are authentic; support both styles.
- Barron's VA explanations name relationship types in their own vocabulary — *"tool to
  user"*, *"object to function"*, *"action to result"* — a useful supplement to the
  official OATTS taxonomy.
- Barron's VA difficulty is **mid-level** (GLOVE:HAND::SHOE:FOOT, PLAN:STRATEGY::FIGHT:BATTLE),
  notably easier than afoqtguide's hard set (FATUOUS, BIFURCATE). Band accordingly.

---

## PHASE 0 COMPLETE — 2026-08-19

**Official question bank committed:** `src/pages/theknowledgebase/afoqt/data/realQuestions.json`
— **89 items**, 79 with full five-option choices, 75 immediately servable (14 need a figure
we do not yet have alongside them and are flagged `needsImage: true`).

| Subtest | Items | Full choices |
|---|---|---|
| Physical Science (8 areas) | 25 | 25 |
| Arithmetic Reasoning | 10 | 10 |
| Aviation Information | 10 | 0 (layout has no distractors) |
| Block Counting | 10 | 10 |
| Math Knowledge | 10 | 10 |
| Verbal Analogies | 10 | 10 |
| Word Knowledge | 10 | 10 |
| Instrument Comprehension | 4 | 4 |

✂️ **Table Reading and Reading Comprehension yielded nothing.** TR states its answers only
inside the figure (not extractable) — acceptable, since TR is the one 100%-generatable
subtest and needs no real seed. RC states answers in prose (*"Answer choice C … is the
correct answer"*) and its passages live in the Captivate lesson modules as images. Both are
**deferred, not abandoned** — revisit if RC calibration proves thin.

**Scripts added:** `scripts/extractBook.mjs` (PDF+EPUB text), `scripts/fetchOatts.mjs`
(manifest → answer-key zips), `scripts/parseOattsAnswers.mjs` (5 different PDF layouts →
JSON). Deps added: `pdf-parse`, `yaml`.

### ⚠ TOOLING TRAP — cost ~40 minutes, do not repeat
Writing JS regexes via a Python heredoc **silently converted `\b` into a literal backspace
byte (0x08)**. The file *looked* correct when printed, because terminals render 0x08
invisibly — the regex just never matched. It happened **twice**.

**Rule: after any scripted edit that writes a regex, verify with**
```
LC_ALL=C grep -n $'[\001-\010\013\014\016-\037]' <file> && echo "CTRL CHARS" || echo clean
```
Prefer writing such lines via a quoted heredoc (`cat > f <<'EOF'`) spliced in with `awk`,
which cannot mangle backslashes.

### Next session starts at PHASE 1
Foundation: schema (`choices[]`, `provenance`, `renderer`), `afoqtSpec.js`, generator
runtime, timing engine, `afoqtStorage.js`, routes, shell, `QuestionRunner`.
Exit criterion: a hardcoded 5-question timed drill runs end to end.

---

## TREY'S QUIZLET DUMPS — `src/pages/theknowledgebase/ResearchPics/quizlet*.md`

Raw pasted Quizlet deck exports, `quizlet1.md` … `quizlet12.md`. Format is a numbered
`term -> definition` list preceded by a `Study online at https://quizlet.com/_xxxxx` line.
Optional `<!-- source:` / `<!-- subtest:` header comments; **infer the subtest from content
when absent.**

⚠ These `.md` files ARE committed (the folder's gitignore rule covers only `*.pdf` /
`*.epub`). Quizlet decks are community-generated, not a publisher's book, so that is
acceptable — unlike the calibration books, which must never enter the repo.

**TODO (Claude):** write `scripts/parseQuizletDumps.mjs` → validated JSON. Per
`CONTRIBUTING-QUESTIONS.md`, a parse miss must degrade to "shown verbatim for review",
never to silently dropped.

### ✂️ Untapped free source flagged by Trey
`quizlet4.md` cites **<https://www.triviumtestprep.com/afoqt-practice-test>** — a free
sample we identified in research but **never actually pulled**. Worth scraping.
⚠ Band anything sourced from Trivium as **`stretch`** (ceiling anchor, untimed by default),
and note that only their *book/PDF* material is respected — their online test platform was
described as "trash" by the first-hand report.

---

## ⭐ IC VALIDATION SET — `ResearchPics/instruments/` (Trey, 2026-08-19)

**25 real Instrument Comprehension questions with a verified answer key.** Source:
Quizlet "AFOQT Instrument Comprehension (Form T)" <https://quizlet.com/_6bi4g0>.
Photos of a book page: `1.jpg` … `25.jpg` plus `instruments1_Answerkey.md`.

Answers: 1C 2B 3C 4A 5B 6A 7A 8C 9D 10C 11C 12C 13C 14A 15B 16B 17A 18A 19C 20D 21C
22C 23D 24C 25A.

**This is the renderer's regression suite, not just study material.** Because the answers
are known, the IC generator can be validated against them: encode each item's
(pitch, bank, heading), run our convention, and confirm it selects the published answer.
If it disagrees, our convention is wrong - which is the single failure mode most likely to
poison Phase 6.

**Already validated from `1.jpg`:** compass points **S**, correct answer is **C**, and C is
the **front view** - confirming *"you are always looking north"*, so a southbound aircraft
flies toward the viewer. The convention in `RESEARCH.md` holds.

⚠ Photos of a page, so lighting/angle vary and fine pointer angles are legible but not
crisp. Good enough for convention checking; do not infer precise bank degrees from them.

---

## PHASE 1 COMPLETE — 2026-08-19

Exit criterion met: **a timed 5-question drill runs end to end**, verified in a real
browser with Playwright (not just unit tests).

**Built:** `engine/afoqtSpec.js` (12 subtests, composites, 550-question total),
`engine/generator.js` (template registry, deterministic `(templateId, seed)` instances),
`engine/timing.js` (pace budget, ahead/behind checkpoints, 5s abandon nudge, guess sweep),
`afoqtStorage.js` (per-template mastery, miss pool, local + debounced Firestore),
`AfoqtApp.jsx` shell, `views/DrillConfig.jsx`, `views/DrillRunner.jsx`,
`views/AfoqtDashboard.jsx`, `Afoqt.css` (`afq-` prefix, inherits `--tkb-*`).
Wired into `TkbApp.jsx` as an `AFOQT` tab at `/TKB/afoqt`.

**Tests: 20 passing.** Added `src/pages/theknowledgebase/**` to `vitest.config.js` - its
include list was an allowlist that excluded this whole folder.

### The template selftest earned its keep immediately
`engine/__tests__/templates.test.js` caught **four real defects** in the four seed
templates before any of them reached a study session:
1. Templates supplied 3 distractors on a **5-option** subtest (only IC has 4).
2. Error-modes **collided** for particular parameters - `e1 + e2 === e1 * e2` when both are
   2 - silently yielding a 4-option question. Fixed by drawing distinct exponents and
   over-supplying candidates.
3. Same collision class in the linear template: `b <= a` made "forgot to subtract b" round
   back onto the correct answer. Fixed by forcing `b > a`.
4. The circle template drew radius 2-12, so it could only ever emit **11 distinct stems** -
   a static question wearing a template's clothes. Widened to 2-40.

`h.choices()` now targets the subtest's real option count and **never pads with invented
numbers** - padding would violate the error-mode rule, so a shortfall fails the test and
the template gets fixed instead.

### Next: PHASE 2 - ASVAB parking + cleanup + migration *(done - see below)*

---

## CONTENT INVENTORY — `ResearchPics/` (after the 2026-08-19 merge)

| File | Entries | Use |
|---|---|---|
| `GLOSSARY-terms.md` | **1,405** | Deduped `term :: definition`. Feeds `data/aviationFacts.json` + WK word list. |
| `GLOSSARY-qa.md` | 68 | Q/A pairs with long stems - fact rows, not head-words |
| `GLOSSARY-review.md` | 4 | Fragments needing a human eye |
| `quizlet3.md`, `quizlet8.md` | - | **Verbal Analogies** MC practice + answer keys |
| `quizlet9.md` | - | **Math** MC practice + answer keys |
| `quizlet14.md` | - | **Word Knowledge** MC practice with answer explanations |
| `instruments/` | 25 img + key | ⭐ IC validation set (see above) |

Merged by `scripts/mergeQuizletGlossaries.mjs` (handles 4 source layouts, skips question
dumps). Cleaned by `scripts/cleanQuizletDump.mjs` (strips Quizlet page chrome).

**TODO:** `scripts/parseQuizletQuestions.mjs` for the four MC dumps - they carry stems,
five options AND answer keys, so they become `provenance: derived` calibration anchors.

### ⚠️ Three parser bugs that would have shipped silently
Caught only because the merge was verified **before** the sources were deleted:
1. **Reversed pairs.** A definition wrapping to a second line was read as the *next term*
   and paired with the *following* entry - producing confidently wrong rows like
   `"A barometric scale window..." :: "Lag"`. ~200 corrupted entries.
2. **Truncated definitions.** Wrapped continuation lines were dropped entirely
   (`Dilemma :: ...or between` <- cut mid-sentence).
3. **Nested sub-lists** in the aviation set parsed as new entries.

**Rule: never delete a source until the derived artefact has been spot-checked.** Raw
dumps are the source of record precisely so a parser bug is re-runnable rather than
destructive - the same principle as `/TT`'s `Transcript.json`.

Overlap across the 10 glossary dumps was **~13%** (1,690 raw -> 1,476 unique), not the
"ton" it looked like.

### ✂️ Dead files still in `ResearchPics/`
`wordknow1.pdf` and `instrumentspdf.pdf` - both **unreadable** (image-only PDFs; no text
layer, and page rasterisation does not work in this environment). Superseded by
`instruments/*.jpg`. Gitignored, so harmless, but they can be deleted.

### `ResearchPics/pics related to quizlet10/` — 16 aviation card images
Diagrams pulled from the 614-term aviation set. **Genuinely useful curriculum art**, not
decoration - the one spot-checked is a labelled empennage (rudder, vertical stabilizer,
trim tab, elevators, horizontal stabilizer), which is Aviation chapter 1 material.

⚠ Filenames are Quizlet content hashes, so **which image belongs to which term is not
recoverable from the filename.** Identify them visually when building the Aviation
chapters (Phase 5) and write a `pics.index.md` mapping file -> concept id at that point.
Do not spend image-reading budget on it before then.

---

## ⚠️ PHASE 2 SCOPE CORRECTED (Trey, 2026-08-19)

The original plan had Phase 2 soft-retiring junk **inside** the ASVAB deck via
`REMOVED_QUESTION_IDS` + a content-sync bump. **That is now out of scope.**

> *"I want the asvab review stuff to be left untouched, we are making copies and cleaning
> those up instead of overwriting the current asvab test questions."*

**The ASVAB deck is read-only.** Phase 2 is therefore:
1. `/TKB/asvab` - a dedicated read-only entry point that launches a review session scoped
   to `subj-asvab`, reusing the existing `buildSessionQueue`. No new engine, no data change.
2. `scripts/migrateAsvabToAfoqt.mjs` - reads `asvabQuestions.json` and writes a **separate**
   `afoqt/data/migratedAsvab.json`. All filtering, re-filing, choice-splitting and
   difficulty work happens **in the copy only**.
3. Nothing writes back to `asvabQuestions.json`, `asvabSubject.js`, `REMOVED_QUESTION_IDS`
   or any `subj-asvab` record.

This is simpler and safer than the original: no migration of already-synced accounts, no
risk of destroying ASVAB study material, and the copy can be regenerated at will.

---

## PHASE 2 COMPLETE — 2026-08-19

**ASVAB deck untouched, as required.** `/TKB/asvab` renders "786 questions, unchanged" and
is a read-only entry point: it launches a normal review session scoped to `subj-asvab`.

Two small additive changes made that possible without writing to settings or data:
- `engine/selection.js` `buildSessionQueue()` gained an optional **`scopeSubjectIds`**
  override of `settings.autoScopedSubjectIds`.
- `TkbReview.jsx` reads **`?subject=`** and **`?n=`** so an entry point can scope and size a
  session without persisting anything.

**Migration is a COPY.** `scripts/migrateAsvabToAfoqt.mjs` reads `asvabQuestions.json` and
writes a separate `afoqt/data/migratedAsvab.json`. It never writes back.

```
786 in  ->  258 junk imports skipped
            154 subtopics not on Form T (mech/electronics/auto/bio)
             63 misfiled, off-topic or duplicate
          = 311 copied  (128 had inline choices split out of the stem)
```
Verified by inspection: **0** non-arithmetic topics leaked into AR, **0** earth-science
into PS.

**`engine/bank.js`** normalises both static sources into the generator's instance shape, so
`DrillRunner` does not care where a question came from. `composeDrill()` mixes bank items
with generated ones — which is why **Word Knowledge and Physical Science are already
drillable with zero templates written.**

| Source | Items | Usable | Held back |
|---|---|---|---|
| OATTS (official) | 89 | **65** | 24 (14 need a figure, 10 have no distractors) |
| Migrated ASVAB | 311 | **128** | 183 free-recall, no inline options |
| **Total usable** | | **193** | |

Tests: **25 passing**. Verified in a real browser across three subtests plus `/TKB/asvab`.

### ⚠️ Fidelity gap found by the smoke test — ASVAB items have 4 options, AFOQT has 5
Migrated ASVAB questions carry **A-D**, because the ASVAB uses four options. The AFOQT uses
**five** on every subtest except Instrument Comprehension. So a migrated item is
structurally easier than the real thing: 25% guess rate instead of 20%.

✂️ **Not fixed yet, deliberately.** The honest fix is to add a fifth distractor drawn from
*other questions' answers within the same subtest* - a real competing concept, which
satisfies the error-mode rule. Inventing a fifth option outright would not. Scheduled for
the subtest phases, where the fact tables make sibling answers available.
Until then bank items are correct but slightly generous.

### Recoverable: 183 free-recall ASVAB items
They have a stem and a correct answer but no options. Same fix as above - generate
distractors from sibling answers - which would roughly **double** the usable bank.

### Next: PHASE 3 - Math Knowledge *(done - see below)*

---

## PHASE 3 COMPLETE — Math Knowledge — 2026-08-19

**MK feeds five of the six composites — more reach than any other subtest.** It is now the
first fully-built track: a 13-chapter curriculum, 79 templates, and the miss pool finally
wired into live drills.

| | |
|---|---|
| Templates | **79** (was 4) — bands 1:6 · 2:20 · 3:36 · 4:17 |
| Chapters | **13**, 162 lesson-minutes, 71 concepts |
| Tests | **131 passing** (was 25) |
| Structural gate | 79 × 8,000 instances = **632,000 generated questions, zero contract violations** |

### What was built

- `templates/mk/ch01..ch13.js` — one file per chapter, so "what does chapter 7 test?" is
  answered by opening chapter 7.
- `templates/util.js` — reduced fractions, polynomial/binomial printing, π coefficients,
  Pythagorean triples, and `sweep()` (see below).
- `curriculum/chapters.js` — pure data: tracks, chapters, prereq DAG, per-chapter concepts.
  **No markdown imports**, so `afoqt:coverage` can load it under plain Node.
- `curriculum/lessons.js` + `curriculum/chapters/mk/*.md` — 13 markdown lessons rendered with
  react-markdown. Browser-only (`?raw`).
- `engine/templateAudit.js` — the structural contract in ONE place, called by both the CLI and
  vitest so they cannot drift.
- `engine/drill.js` — `assembleDrill()`: miss pool + generated + bank, with chapter scoping.
- `views/CurriculumMap.jsx`, `views/ChapterView.jsx`; `DrillRunner` now understands chapter
  gates and shows a **"What you missed"** review with each template's explanation.
- Scripts: `afoqt:selftest`, `afoqt:coverage`, `afoqt:sample`, `afoqt:check`.

### ⭐ Requirement 12 is finally live
The miss pool was captured from Phase 1 and **never injected**. `assembleDrill()` now draws
~10% of every drill from it — 65% fresh siblings (tests the concept), 35% exact
`(templateId, seed)` replays (tests the item). `ignoreMissPool` keeps exam runs unbiased, and
the dashboard has a manual **Reset the pool** button. Both halves of the clean slate exist.

### Curriculum shape
Chapters 1-5 are terse refreshers with test-out gates; 6-8 are the algebra core; **9-11 are
the three geometry chapters, taught from foundations and gated at 5/5 rather than 4/5** —
Trey named geometry as his weakest area and a lucky four is exactly how a weak area gets
skipped. Prereq DAG has two entry points (ch01 and ch09), so geometry is never blocked behind
algebra.

⭐ **Chapter 6 carries the most depth deliberately:** 2 of the 10 official OATTS MK items are
AC-method factoring, and its headline distractor is the **swapped constant pair**, which
multiplies to the right constant and the wrong middle term.

### ✂️ Chapter 14 (word-problem translation) is NOT here
It is an **Arithmetic Reasoning** chapter, not a Math Knowledge one. It arrives with Phase 8
alongside the AR templates. Nothing is lost — `mk-term-translation` already covers the
phrase-to-expression step inside chapter 1.

---

## LESSONS FROM PHASE 3 — read before writing templates for any other subtest

### 1. Sample count matters enormously; 400 is not enough
The template selftest found **8 collisions at 400 samples, 23 more at 1500, and 3 more at
5000.** Every one was a case where two error-modes produced the same value for particular
parameters — and usually one of them landed **on the answer**, so the item had two correct
choices. `npm test` runs 400 for speed; **run `npm run afoqt:selftest -- --samples=8000`
before declaring a batch done.**

### 2. Guarding collisions one at a time does not work — sweep instead
Fixing a collision with a single `if` repeatedly re-broke a different pair. `util.js` now
exports **`sweep(lo, hi, start, slateFor)`**: it walks a parameter's legal range for a value
where the WHOLE answer slate is distinct. Used by the exterior-angle, third-angle,
surface-area and midpoint templates.

⚠️ **A sweep cannot rescue a collision that does not depend on the swept value.** Two real
cases: with `x1 = 0`, midpoint's "halved the difference" IS the midpoint for every y; with
`a = 90`, the third-angle item's `|a − b|` IS the answer for every b. Both needed the
degenerate value excluded from the draw, or the distractor dropped entirely.

### 3. Declare a bounded item space rather than faking it
A ratio-only stem-uniqueness rule meant raising `--samples` silently raised the bar, failing
templates that had not changed. The rule is now `min(samples × 0.1, 40)`, and a template with
a genuinely finite space declares **`stemSpace`** (regular polygons: 14; permutations: 36).
Declaring the bound is honest; silently emitting six stems forever is not.

### 4. The AFOQT engine imports carry explicit `.js` extensions
Node ESM requires them and Vite accepts them, which is what lets `afoqt:coverage` and
`afoqt:selftest` run as **plain node scripts** with no test runner and no vite-node (not
installed). Keep it that way. `MISS_INJECTION_RATE` lives in `afoqtSpec.js` rather than
`afoqtStorage.js` for the same reason — storage imports firebase.

### 5. A short gate must deal distinct templates
Caught in the browser, not by a test: a 5-question chapter gate sampled uniformly from 7
templates asked **two isosceles questions and never asked about the transversal.** `buildDrill`
now takes `distinct: true` and deals shuffled rounds of the whole pool before repeating.
Weighted (miss-pool) selection opts out — repeating weak material is the point there.

### 6. Verify in a browser, not just in tests
The distinct-template defect, the redundant explanation text and the implausible
`(n₁a₁+n₂a₂)/2` distractor were all found by reading real generated questions on screen.
`npm run afoqt:sample -- --only=<id>` prints them without a browser.

---

## PHASE 4 COMPLETE — Table Reading — 2026-08-20

**6 templates · 1 chapter · 5 concepts · the project's first renderer · 185 tests (was 131).**
`npm run afoqt:selftest -- --samples=8000` → 85 templates, all hold. `afoqt:coverage` holds
both directions. Build clean. Verified in a real browser at four viewport sizes.

### What shipped

| File | What |
|---|---|
| `engine/table.js` | The grid: pure geometry + a murmur3 cell hash. No React, so the QC scripts audit it on plain Node. |
| `templates/tr/ch01-table-reading.js` | `tr-anchor` (b1) · `tr-lookup-near` (b2) · `tr-axis-read` (b2) · **`tr-lookup` (b3, the real item)** · `tr-lookup-far` (b4) · `tr-locate` (b4) |
| `render/DataTable.jsx` + `render/Figure.jsx` | The 33×33 grid, and the dispatcher later phases register `blocks` / `instrument` into |
| `curriculum/chapters/tr/ch01-table-reading.md` | 8-minute technique lesson |
| `engine/__tests__/tableReading.test.js` | 54 tests |

### Decisions worth not re-deriving

- **Difficulty is SCAN DISTANCE, never grid size.** Every band runs on the full 33×33 real
  grid; the easy bands just ask for cells near the origin anchor. Shrinking the grid for band 1
  would have taught a layout the test does not use.
- **One grid per run** (`sheet: true`). The seed is split — high 20 bits pick the figure, low 12
  pick the question — so a whole 40-question drill lands on one table exactly as the real
  subtest does, *and* `(templateId, seed)` still regenerates byte-identically. Redrawing the
  grid per question would have made every question "question one" and quietly destroyed pace
  fidelity while still reporting a number.
- **Miss-pool items on a sheet subtest are ALWAYS fresh siblings**, re-seeded onto the run's
  grid. An exact replay would drop a second table into the middle of a drill, and remembering
  that one cell of one grid held `084` is not the skill.
- **Distractors are named.** `h.choices` now accepts `{ value, error, why }`, the labels ride
  through the shuffle, and the results screen ranks them: *"2× read Y as ascending"*. That is a
  habit to fix rather than a score. Generalises to Block Counting and Instrument
  Comprehension.
- **Cell values are 3-wide, zero-padded** (`002`, `090`). See the open question in `RESEARCH.md`
  — the dossier's `02` / `090` samples cannot both come from one uniformly formatted table.
  Three overshoots, which is the project's calibration rule.
- ~ **`tr-locate` (reverse lookup) is NOT a real AFOQT format.** It is a deliberate technique
  drill — the only exercise that forces a label to be *read off* the axis rather than counted
  toward. Banded 4, tagged `technique-drill`, and the first thing to cut if it ever proves to
  train the wrong instinct.

### Two defects the QC caught, both the Phase 3 lesson repeating

1. **`seedForSample` in `templateAudit.js`.** A sheet template's variability lives in the HIGH
   bits, so walking seeds 0..7999 only ever produced **two grids** — 8,000 samples would have
   checked distractor collisions against two tables and reported a clean run. Sheet templates
   now walk a Knuth-hashed spread. Without this the whole TR audit was hollow.
2. **20 short slates in 8,000** on `tr-locate`, invisible at 400. A unique value in the far
   corner has no row above it, so two of its four slip-by-one error modes fall off the grid.
   Fixed by constraining the draw to full-ring cells (`hasFullRing`), not by padding.

### And two the browser caught, which no test would have

3. **The grid scrolled.** `.tkb-main` caps at 960px — the original flashcard tool's reading
   column. Lifted with `:has(.afq-runner-wide)` so no shared TKB rule changed.
4. **Option E fell below the fold** at 10.5s/question. Short options now lay out in a row (as
   on the answer sheet), and on a short window the grid gets *denser* rather than taller.
   Verified above the fold at 1920×1080, 1440×1050, 1366×768 and 1280×800.

---

## PHASE 5 COMPLETE — Aviation Information — 2026-08-20

**11 chapters · 374 facts · 64 templates · 148 lesson-minutes · 1,399 TKB tests (was 190).**
`npm run afoqt:selftest -- --samples=8000` → 149 templates across MK/TR/AI, all hold.
`afoqt:coverage` holds both directions. Build clean. Verified in a real browser.

### What shipped

| File | What |
|---|---|
| `engine/facts.js` | ⭐ The **fact engine** — reusable for Physical Science in Phase 12 |
| `templates/av/ch01..ch11.js` | 374 facts, each declaring the terms it is genuinely confused with |
| `curriculum/chapters/av/*.md` | 11 lessons |
| `engine/errorModes.js` | One map of every named mistake, shared by all subtests |
| `engine/__tests__/aviation.test.js` | The editorial guards, one per defect class that shipped |
| `ResearchPics/pics related to quizlet10/pics.index.md` | The 16 aviation diagrams, identified |

### ⭐ The fact engine, and why distractors are declared

Math templates compute their distractors — "forgot to halve" is a number you can derive. A
knowledge question has no arithmetic to be wrong at, so the naive move is to pad the slate with
unrelated terms, which produces four obviously-wrong options and tests nothing. **That is
precisely what polluted the ASVAB deck.**

So a fact row names the terms it is genuinely **confused with**. `aileron` lists `elevator` and
`rudder`; `angle of attack` lists `angle of incidence`. Distractors are therefore error modes in
the same sense the math ones are, and a miss reports as *"you mixed it up with a spin, which is an
aggravated stall."* Priority runs declared-confusion → same-concept → same-chapter, and **never
leaves the chapter** — a distractor from another subject is eliminable on sight.

Each row asks in **two directions**, because they are different recall tasks and the official
items use both: *"The elevator ___"* → controls pitch, and *"Which surface controls pitch?"* →
the elevator.

### ⚠️ FOUR EDITORIAL DEFECT CLASSES SHIPPED, AND NO EXISTING GATE SAW ANY OF THEM

Every one produced a *correct answer* from an *internally consistent* generator, passed the
selftest, and was found only by reading generated questions out loud. This is the most important
lesson of the phase: **structural QC cannot see a badly written question.**

1. **The question contained its own answer.** *"Pressure altitude corrected for non-standard
   temperature is ___"* offered "is pressure altitude corrected for temperature" as the correct
   choice. **60 rows** had a version of this.
2. **Question and answer did not agree grammatically.** *"An aircraft's elevator functions to
   ___"* wants an infinitive; the gloss is third-person — "functions to controls pitch".
3. **Term and gloss inverted.** The MDS rows asked *"Which designation marks a multi-mission
   remotely piloted aircraft?"* and answered *"a multi-mission remotely piloted aircraft."*
4. **Visual tells.** One option in capitals, or one plural among four singulars, is findable
   without knowing anything about aeroplanes.

**The structural fix for 1 and 2:** the identify stem is now **derived from the term alone**
(`identifyStem()`), never authored. It cannot leak an answer it does not contain, and a
third-person gloss always agrees with it. 374 hand-written stems were deleted. The varied,
official-sounding phrasing moved to `recallStem`, which is where the official items' character
sits anyway. The **article is part of the term** — no rule separates "the aileron controls roll"
from "lift is the upward force", so a human decides it once, in the data.

### 🔴 THE `\b` BACKSPACE BYTE, FOURTH OCCURRENCE — and this time it disabled a guard

Writing `\b` through a shell heredoc produced a literal **0x08 byte**, so the shouted-word guard
compiled to `/<BS>[A-Z]{2,}<BS>/` and **matched nothing for the entire phase.** It reported clean
while doing nothing at all.

Previous occurrences corrupted visible output. This one silently disabled a *check*, which is
strictly worse — a dead guard is indistinguishable from a passing one.

**Rules adopted:**
- **Never write a regex through a shell heredoc.** Use the Write or Edit tool for any file
  containing a backslash escape.
- `LC_ALL=C grep -rn $'[\001-\010\013\014\016-\037]' <dir>` is now part of the phase
  checklist, not just a debugging step.
- **A new guard must be tested against something that should FAIL it.** Had the guard been fed
  one shouting gloss when written, it would have been caught in seconds.

### Other decisions worth not re-deriving

- **⭐ Chapter 10 (MDS) exists because of the research and earns 5/5 to test out.** Two of the ten
  official items test designation letters and almost **no commercial guide covers it** — a
  straight, silent blind spot. Airfield operations also demands 5/5, for the same density reason.
- **Four chapters have no prerequisites** (anatomy, airports, weather, aircraft type), so a
  from-zero subject is enterable from several directions rather than one long chain.
- **The bare `/[A-Z]{2,}/` caps guard was wrong even once repaired** — it rejects every gloss
  mentioning an ILS or a VFR minimum. `shoutedWord()` keeps an acronym allowlist.
- ⬜ **Three of the 16 aviation diagrams are 0 bytes** and cannot be recovered — worth re-pulling
  if the source deck is still to hand. One more (`EnBtlSYbG52Lp6T-VNvVNg.png`) has an arrow whose
  referent is ambiguous without its original question.
- ~ The images are **reference only, never shipped** — same rule as the calibration books. The
  PHAK figures are public domain but the photographs are not, and this site deploys publicly.

---

## PHASE 6 COMPLETE — Instrument Comprehension — 2026-08-20

**6 templates · 3 renderers · 1 chapter · 2,311 repo tests.** Selftest holds at 8,000 samples
across 155 templates. Coverage holds. Build clean. Verified in a browser.

### ⭐ THE RENDERING GATE IS PASSED — no sprite fallback needed

The plan set an explicit gate: *"if the output does not read cleanly after a time-boxed attempt,
stop"* and fall back to ~48–96 hand-authored SVG views. **It reads cleanly.** A contact sheet of
all 120 attitudes was rendered and eyeballed, and every one is recognisably an aircraft with a
readable heading, bank and pitch. The fallback is not needed and Trey does not have to author
anything.

| File | What |
|---|---|
| `engine/attitude.js` | Pure geometry — body axes, projection, the official distractor formula |
| `render/AttitudeIndicator.jsx` | The artificial horizon, with the inverted pointer |
| `render/CompassCard.jsx` | The compass |
| `render/AircraftSilhouette.jsx` | The four aircraft, projected from a 3-D model |
| `templates/ic/ch01-instruments.js` | `ic-pointer` (b1, drill) · `ic-heading` · `ic-pitch` · `ic-bank` (b2) · **`ic-attitude` (b3, the real item)** · `ic-steep` (b4) |

### 🔴 A geometry bug that inverted the entire subtest

`bodyAxes` computed the up vector as `nose × wing`. Forward-cross-right points **DOWN** in a
right-handed frame, so **a right bank raised the right wing.** Every banked aircraft was
mirrored, which means **every "wrong bank" distractor was the correct answer and every correct
answer was a distractor.**

Nothing about the output looked wrong. The dials were right, the options were four and distinct,
the audit passed, and a study session would have taught the inverted-pointer rule **backwards** —
the single worst outcome available on this subtest.

**It was caught by asserting the convention numerically before drawing anything**: "a right bank
must put the right wing at positive screen-Y". That check now lives in the test suite across five
headings. ⚠ **Assert the physical convention, not the implementation.** Every renderer from here
on gets a numeric check of what the figure MEANS before a single pixel is drawn.

### ⚠️ The silhouettes collapsed, and no camera elevation could fix it

First render: two of four options were **invisible hairlines**. A viewer exactly level with the
aircraft and exactly on the north axis sees a northbound aircraft perfectly end-on, and at 90° of
bank the whole shape projects to a single line.

Raising the camera does not fix it — **it moves it**. For any elevation E there is a pitch of −E
that points the nose straight down the view axis, so a pure north-axis camera always has a
degenerate attitude somewhere. Measured: elevation 25° produced an area of *exactly zero*.

**The fix is a small azimuth offset.** Because 15° is not a multiple of 45, no heading on the dial
can ever align the nose with the view axis and the degeneracy disappears rather than relocating.
With `VIEW_AZIMUTH 15` / `VIEW_ELEVATION 30`, the thinnest of all 120 silhouettes went from 0.00
to **0.22 of mean area**, and all 120 remain visibly distinct. The fuselage was also rebuilt as
**two crossed plates** so no single flat surface can vanish edge-on.

What is preserved, which is what matters: east is still screen-right, north still flies away,
south still flies toward, every option shares one viewpoint, and no answer changes. Recorded as a
deliberate departure in `attitude.js`.

### ⚠️ The dossier was wrong again, and the primary source was checked first this time

`RESEARCH.md` said the **white** pointer shows bank with the black one as a fixed zero. The AFPC
pamphlet says the opposite, verbatim: *"The heavy black line represents the HORIZON LINE. The
black pointer shows the degree of BANK."* Both readings are recorded; **neither changes an
answer**, because the geometry is identical and no question asks what colour anything is. The
rule adopted: build to the geometry, never to a colour, and never write a question that depends
on naming a pointer.

That check took two minutes and was only done because Phase 4's grid had been built to an uncited
line and was wrong about the artifact's single most important property. **It is now the first
step of any figure-bearing phase.**

### Other decisions worth not re-deriving

- **Options can be PICTURES.** `h.choices` accepts a `render` per option and returns
  `optionRender` aligned with `choices`. The `value` stays a canonical description — hidden
  behind `.afq-sr-only` during the question, so screen readers and the post-drill review get it
  while the page does not give the answer away.
- **5/5 to test out.** The inverted pointer is one fact that inverts a whole subtest; someone who
  has not met it gets every banked question wrong and feels confident doing it.
- ~ `ic-pointer` is **not a real item format** — the real subtest always shows two dials and four
  aircraft. It isolates the inverted pointer before it has to be applied under a 12-second clock,
  and `drillOnly` keeps it out of exam runs.
- The item space is **bounded at ~120 readable attitudes** and says so via `stemSpace`. The
  plan's "90–100% automatable" does not apply to this subtest and never did.

---

## PHASE 7 COMPLETE — Block Counting — 2026-08-20

**5 templates · 1 renderer · 1 chapter · 2,367 repo tests.** Selftest holds at 8,000 samples across
160 templates. Coverage holds. Build clean. Verified in a browser.

| File | What |
|---|---|
| `engine/blocks.js` | Pure geometry — the contact rule, the pile builder, isometric projection |
| `render/BlockPile.jsx` | The pile, drawn as line art |
| `templates/bc/ch01-block-counting.js` | `bc-corner-rule` (b1) · `bc-surface` (b2) · **`bc-count` (b3, the real item)** · `bc-hidden` · `bc-crowded` (b4) |

### ⭐ THE FORM T PAMPHLET WAS FOUND, AND IT RE-SOURCES THE WHOLE PROJECT

Everything before this phase was calibrated against a **Form S** pamphlet plus commercial
cross-checks. The Form T edition is at
`afrotc.rutgers.edu/sites/default/files/pdf/afpt-997_afoqt-practice-pamphlet_cao01aug15.pdf`
— Part A / Part B, Reading Comprehension and the SJT present, `Part B.4 - Block Counting`.

- **Every number in `afoqtSpec.js` is now confirmed against it.** All 12 item counts, all 12
  time limits, the Part A/B split and the order, totalling 3 h 36.5 m testing / 4 h 47.5 m
  all-in. Two long-standing flags close: **IC is 5 minutes** (the Form S doc's 20 questions in
  6 minutes was exactly the stale trap the plan warned about) and **BC is 4.5**.
- **The disputed seventh composite is real.** Table 1 has seven columns — Pilot, CSO, ABM,
  Academic, Verbal, Quant and **Situational Judgment** — and the SJT's single X sits in it.
  Physical Science and the SDI genuinely carry zero. Recorded in `RESEARCH.md`.
- **The face/corner rule is officially sourced after all.** This dossier carried it as an
  unattributed quote; it is verbatim Form T, and the pamphlet works the exclusion out loud.

⭐ **PDF pages render now.** `pdf-parse`'s `getScreenshot({first,last,scale})` plus `sharp` for
cropping produces a PNG the Read tool displays — poppler is still missing but irrelevant. The
old rule "images never extract, ask Trey for screenshots" is retired; it cost two phases of
guessing. Written up in `CLAUDE.md`.

### 🔴 The piles are NOT a lattice of cubes, and a lattice cannot represent the official item

The dossier was silent on pile structure — the same gap that made Phase 4's Table Reading grid
wrong about its own most important property. In an axis-aligned lattice of cubes a block has one
neighbour per direction and **at most six**. But the Form S sample keys S3 at **seven** ("three
blocks above, three blocks below, and one block on the right"), and published explanations say
"three above", "two below", "two to the left" routinely.

The blocks are identical **cuboids in crossed layers**: each layer runs perpendicular to the one
under it, so a block's top face is shared with two or three of the blocks above. Both official
patterns are the same model at two block lengths — **length 2 gives the Form T sample's "two
above, two below" (6), length 3 gives Form S's "three above, three below" (7)** — so a pile
picks one. Asserted numerically before a pixel was drawn.

The reconstruction also **identified the geometry by elimination**: a running-bond wall produces
"two below", but its diagonals do not touch the block at all, which would make the pamphlet's
corner warning vacuous. Only crossed layers give both. That is now a regression test.

### 🔴 A 30-question exam asked SIX questions and repeated the other 24

The worst defect of the phase, invisible to every structural check because each individual
question was perfectly well formed. One pile numbers six blocks; the `sheet` mechanism gives one
figure per run; so a full-length Block Counting simulation was six items shown five times.

Fixed with **`sheetSpan`** on the template — how many questions one figure is good for before
the run moves to a fresh one. Table Reading declares none (a 33×33 grid genuinely serves all 40
questions, which is what the real test does); Block Counting declares 6, matching *"one pile
image serves 5-13 numbered questions"*. A 30-question exam now runs on 5 piles with zero repeats.

Two follow-on bugs came out of the same thread, both found only by looking at the actual queue:

1. **Block choice was left to chance.** Retrying on collision is coupon-collecting: it passed on
   one rng seed and still duplicated on another. Now indexed by `h.item`, so a run walks the
   numbered blocks and asks each exactly once. The test loops 25 rng seeds for that reason.
2. **The queue shuffle scattered the piles.** `assembleDrill` shuffles to mix miss-pool items in,
   which costs nothing with one figure but made the drill jump to a different pile almost every
   question — 30 re-orientations instead of 5, unlike the real test and harder than it.
   `groupByFigure` keeps a figure's questions contiguous while leaving both orders shuffled.

### ⚠️ Two smaller things that were also only visible by looking

- **The answer position was biased to the middle.** Deriving the option window from an offset and
  clamping it at 1 piled low counts onto the same slot: **C came up 38% more often than chance
  and E 38% less.** That hands back exactly the guess-the-letter reflex the shifting key exists
  to destroy. Fixed by drawing the *position* uniformly over the feasible slots. The residual
  shortfall at E is authentic — a count of 3 cannot sit fifth without printing a zero option.
- **The tool was easier than the test.** The numbered block being asked about was highlighted, so
  *finding* it cost nothing — but the real figure highlights nothing and locating the block is
  part of the nine seconds. Now marked only on reveal, reusing `DataTable`'s existing pattern.

### Decisions worth not re-deriving

- **Piles have no enclosed voids and nothing floats.** Blocks are only ever removed from the top
  down, so the layers below are solid and a candidate can *deduce* what is buried. A hidden block
  you could not possibly infer turns the question into a coin flip. Asserted: every block above
  the ground is fully supported.
- **`stemSpace: 6` is declared, not hidden.** The stem names one of six numbered blocks and says
  nothing else, so six distinct stem strings is the true and complete stem space — the item space
  behind it is unbounded because every sheet seed builds a different pile.
- **Only `bc-count` is exam-eligible.** The other four select blocks by property (has a corner
  trap, has a hidden neighbour, is crowded), and the real subtest does not choose that way —
  letting them into an exam would make the simulated score harder than the real thing.

### 🔴 PLAN.md was destroyed and rebuilt during this phase — read this before scripting an edit

A doc-update script did `io.open(PLAN, 'w')` and *then* hit a `UnicodeEncodeError` on an emoji
written as a surrogate-pair escape. Opening for write truncates immediately, so the exception
left **PLAN.md at zero bytes**, and the file has never been committed, so git had nothing to
restore. It happened twice, the second time after the first repair.

Recovered by replaying history: a full `Read` of the file survived in the session transcript
(`~/.claude/projects/.../<session>.jsonl`) as a post-Phase-2 snapshot, and the Phase 3-6 sections
were recovered from the tool calls that wrote them. The transcript is a real backstop — but it
only worked because the phase scripts were still on disk in the scratchpad.

Three rules adopted:
- **Never write a doc with escaped emoji.** `🔴` in a Python literal is a lone
  surrogate pair that UTF-8 cannot encode. Write the character, or use `\U0001F534`.
- **Never truncate the target before the new content exists.** Write a temp file, verify it
  encodes and is non-empty, then replace.
- **A phase script that also edits `CLAUDE.md` is not re-runnable.** Replaying the recovery
  duplicated three sections there and they had to be trimmed back out by hand. Keep doc edits
  idempotent, or split them per file.

---

## PHASE 8 COMPLETE — Arithmetic Reasoning — 2026-08-20

**37 templates · 6 chapters · 31 concepts · 77 lesson-minutes.** Selftest holds at 8,000 samples
across **197 templates**. Coverage holds both directions. 200 simulated full-length exams produced
**zero repeated stems**, used all 36 exam-eligible templates, and spread them evenly (125–155 appearances each).

| File | What |
|---|---|
| `templates/ar/words.js` | Prose furniture: names, typed object pools, `OATTS` provenance, `times()` |
| `templates/ar/ch01-translation.js` | The spine — the deferred "chapter 14". `ar-translate-expression` (b1) · `ar-order-trap` · `ar-relate-two` · **`ar-relate-three` (b3, the official three-person shape)** · `ar-answer-asked` · `ar-unit-mismatch` |
| `templates/ar/ch02-rates.js` | d = rt. `ar-rtd-distance` · `ar-rtd-time` · **`ar-inverse-speed`** · `ar-average-speed` (b4, harmonic) · `ar-fuel-rate` · `ar-closing-rate` |
| `templates/ar/ch03-proportion.js` | `ar-proportion-words` · `ar-recipe-scale` · **`ar-shadow-height`** · `ar-scale-plan` · `ar-conversion-chain` · `ar-best-buy` |
| `templates/ar/ch04-percent-context.js` | **`ar-percent-subgroup`** · **`ar-percent-to-count`** · **`ar-discount-equivalence`** · `ar-reverse-tax` · `ar-tip-split` · `ar-percent-remaining` · ✂️`ar-compound-interest` |
| `templates/ar/ch05-averages.js` | `ar-average-missing` · `ar-average-raise` · `ar-weighted-groups` · **`ar-signed-net`** · ✂️`ar-mixture` · ✂️`ar-work-rate` |
| `templates/ar/ch06-counting-measure.js` | **`ar-fencepost`** · `ar-fencepost-loop` · **`ar-perimeter-width`** · `ar-area-words` · `ar-volume-words` · `ar-cost-per-area` |

Bold = modelled on a specific official OATTS item, carrying `provenance.kind: 'derived'`.

### ⭐ The official answer key is a DISTRACTOR SPEC, not just a topic list

All ten official AR items ship with a full solution walkthrough, and reading those keys changed
what got built. The AF's own distractors are named error modes, and three of them were adopted
verbatim as shapes:

- The 14,500-student item offers **6,960** — the stage-one result, computed perfectly, answering
  the question you stopped reading halfway through. That "stage-one result" distractor is now the
  spine of the whole percent chapter.
- The shadow item offers **250 (= shadow × reference shadow)** and **150 (= shadow × reference
  height)** — both *whole numbers*. The first build used `shadow × refS / refH`, which is the
  textbook inversion but arrives with a decimal on it, and **a distractor carrying a decimal
  among integers is eliminable without doing the problem.** The AF picked integers on purpose.
- The perimeter item offers **155 (= P − L)**, **130 (= 2L)** and **65 (= L)**.

`ar-` prefixes on all 31 concepts are load-bearing: Math Knowledge already owns `percent-of`,
`unit-rate`, `proportion-solving`, `scale-conversion` and `weighted-average`, and coverage fails
if two chapters claim one concept. The split is also true to the test — MK asks you to EXECUTE a
proportion, AR asks you to notice there is one.

### 🔴 REALISM IS A DEFECT CLASS, and no structural check can see it

Every one of these passed `afoqt:selftest` at 8,000 samples and was found only by running
`afoqt:sample` and reading the output:

- **a boat travelling at 140 miles per hour** — the speed was drawn independently of the vehicle
- **a train quoted in gallons per mile**
- **"5 identical tickets weigh 100 pounds"** — a countable-objects pool used for a weight item
- **"a tent, 28 ounces for $9.24"** — a durable good sold by the ounce
- **"1 pounds"**, and a British "water butt" on a USAF test paper

The fix is TYPED POOLS, not wider ranges: `TRAVEL` carries a `[slow, fast]` per vehicle and
speeds are drawn inside it; `WEIGHABLE` is separate from `COUNTABLES`; `BULK_GOODS` is separate
from `GOODS`; `ORGS` exists because a district does not "employ". A question that is arithmetically
perfect and physically absurd still tells the reader the tool does not know what it is talking
about — and this tool's entire history is a user who walked away from a polluted deck.

### 🔴 Four defects in the ARITHMETIC of the questions themselves

1. **`ar-average-raise` failed 8,000/8,000.** Two of its five distractors, `2t − w` and
   `t + (t − w)`, are the same expression written two ways — and a third, `w + (n+1)(t − w)`,
   expands to `(n+1)t − nw`, **which is the correct answer**, sitting in the list labelled
   "over-corrected". Every distractor is now written in the single form `now + <multiple of gap>`
   so an identity is visible at a glance instead of hidden behind algebra.
2. **`num()` made an explanation FALSE.** `ar-work-rate` printed the combined rate as a decimal:
   `1/10 + 1/40 = 0.13`, then `1 / 0.13 = 8 hours`. The rounding is `num()`'s job and the
   sentence is simply wrong arithmetic on a page teaching arithmetic. Worked in fractions now —
   the combined time is a whole number by construction, so `1/<correct>` is exact.
   **Never let a rounded value carry a worked step in an explanation.**
3. **An explanation may only cite a distractor guaranteed to survive.** `h.choices` keeps the
   first `need − 1` DISTINCT distractors and discards the rest. `ar-volume-words` listed
   "used only two of the three dimensions" fifth and then cited it in the explanation — so the
   text described an option that was not on the page. Order the slate by teaching value, and
   cite only from the front of it.
4. **Fractional people.** `ar-percent-remaining` swept single percentage points and produced
   "increased by 29%" → 5,263.2 staff. Percentages sweep in 5-point steps and every value on the
   slate must come out whole.

### ⚠️ Four more degenerate draws a sweep CANNOT rescue

The Phase 3 rule — *a sweep cannot fix a collision that does not depend on the swept value* —
cost four separate failures here, and the tell is always the same: `sweep()` falls back to its
`start` value and ships the colliding item silently. Exclude the value from the draw instead.

| Template | Degenerate value | Why it folds |
|---|---|---|
| `ar-shadow-height` | `refH === refS` | the reference is as tall as its shadow, so height = shadow for everything and **three** distractors hit the answer at once |
| `ar-percent-subgroup` | `p1 = 50` | the group and everyone outside it are the same size — for EVERY `p2`, so no sweep value exists |
| `ar-percent-to-count` | `total = 100` | on a 100-question test the count missed and the percentage missed are the same number |
| `ar-discount-equivalence` | `off = 50` | the fraction paid and the fraction taken off coincide, collapsing **two** distractors onto the answer. 50% is the official item's own discount, so the slate was rebuilt rather than the case dropped |

`ar-work-rate`'s pair table is now filtered on *both* conditions — whole-number answer AND a
mutually distinct slate — because `[3, 6]` passes the first and fails the second (faster worker
= 3, difference of times = 3).

### 🔴 Declared word forms, never derived ones

`obj.verb.replace(/ed$/, '')` produced **"How many did Quinn fil?"**. It is wrong on 5 of 10
entries: `filed→fil`, `moved→mov`, `assembled→assembl`, `logged→logg`, and the irregular
`sold→sold`. A mangled verb is still a valid string, so nothing structural could catch it. Every
pool entry now declares its `bare` form alongside `verb`. Same family as Phase 5's rule about
never authoring a stem the generator can derive — except here the lesson runs the other way:
**derive nothing linguistic; declare it.**

### Decisions worth not re-deriving

- **Block Counting got its own track.** It was a chapter on the `perceptual` track alongside
  Table Reading, and a track prints ITS SUBTEST's pace and composites in the header — so the
  tightest clock on the test (9.0 s) was labelled with Table Reading's 10.5 s and credited with
  Table Reading's composites. Tracks are one-per-subtest everywhere else.
- **The curriculum map's "later phases" footnote is DERIVED now.** The hand-written one still
  promised tracks for Aviation Information, Instrument Comprehension and Block Counting three
  phases after all three shipped. Nothing fails when prose goes stale, which is exactly why it
  does.
- **`ar-fencepost-loop` generates both variants and the stem does not signal which.** Open run
  with a post at each end is gaps + 1; a closed loop is gaps. Teaching "always add one" would
  hand back the reflex the item exists to remove.
- ✂️ **Mixture, work-rate and compound interest are commercial-only** — in no OATTS module and no AFPC sample item.
  Built anyway (absence is not proof), banded 4, ranked last in their chapter, and prerequisites
  for nothing. Compound interest carries `ar-percent-remaining` rather than a concept of its own,
  which is a real mapping and not a filing convenience - that concept IS "successive percentage
  changes multiply rather than add", and compounding is the same rule applied n times instead of
  twice. Its headline distractor is the SIMPLE-interest figure, mirroring `mk-simple-interest`,
  whose headline distractor is the compounded one.

---

## NEXT

**Phase 9 — Word Knowledge.** 25 questions in 5 minutes (12.0 s each, joint-second tightest clock
on the test). Feeds **CSO, Academic and Verbal**. The known gap is the word list: no
AFOQT-specific open list was found and the substitute is a GRE/SAT high-frequency list — see
KNOWN GAPS. 183 free-recall ASVAB items were recovered in Phase 2 and 52 migrated WK items sit in
the bank already.

After that: Verbal Analogies, Reading Comprehension, Physical Science, SJT/SDI, then the exam
simulator.

**Six subtests now exist (MK, AR, TR, AI, IC, BC)** — the whole Pilot composite, three of the
four CSO subtests, and the whole **Quantitative** composite.

### ✂️ Open, and worth Trey's decision

- **Band 5 / `stretch` is built, tested, and used by ZERO of the 160 templates.** The mechanism
  works and the doctrine calls for it in three places (Trivium = ceiling, tagged `stretch`,
  untimed by default, for concept mastery rather than pace). Nothing has ever been banded there,
  so the tool currently tops out at Barron's-band difficulty. That is *at or slightly above* real
  test level, so nothing is miscalibrated — but the "learn it hard, then run it fast" half of the
  calibration ladder does not exist yet. Trivium's complaint was specifically about **Math
  Knowledge**, so that is where it belongs.
- **3 of the 16 aviation diagrams are 0 bytes** and unrecoverable from the saved copies.
- **A full-size Table Reading grid** has still never been checked against a real one (afoqtguide
  403s to automation; Trey can reach it). The 7×7 pamphlet sample is the only verified specimen.
- **`docs/afoqt/` is untracked by git.** That is why a truncation was unrecoverable from the
  repo. Worth committing.

---

## PHASE 9 IN PROGRESS — Word Knowledge — 2026-08-21

**Templates are DONE and both gates are green.** `npm run afoqt:selftest` reports
*233 templates x 400 instances, all templates hold their contract*; `npm run afoqt:coverage`
reports *coverage holds in both directions*. WK went from 0 to **36 templates** across six
chapters.

| Chapter | Content | Rows |
|---|---|---|
| `wk-01-method` | connotation + the reversed stem, drawn across the whole bank | (frames only) |
| `wk-02-roots` | Latin and Greek roots | **30**, 10 per band |
| `wk-03-affixes` | prefixes and suffixes | **24**, 8 per band |
| `wk-04-confusables` | pairs people actually mix up | **28** (9 / 11 / 8) |
| `wk-05-vocab-people-speech` | character and speech | **60**, 20 per band |
| `wk-06-vocab-change-degree` | change, degree and judgment | **60**, 20 per band |

### ⚠️ STILL OPEN in Phase 9 — the phase is NOT complete

- **The six WK lessons do not exist.** `curriculum/chapters/wk/` has not been created and
  nothing is registered in `curriculum/lessons.js`. **`npm test` is RED because of this**:
  `curriculum.test.js` asserts every chapter has a lesson, and it is correctly reporting the
  gap. It was left failing rather than stubbed - a stub would turn a true signal off.
  Farmed out as **PART 5** and **PART 6** in `docs/afoqt/HANDOFF.md`.
- **No WK test suite yet** (`engine/__tests__/words.test.js`) - **PART 7**.

### 🔴 A `sense` or a gloss must be DISTINGUISHABLE, not merely a different string

The selftest dedupes a slate by exact string, so two options that mean the same thing in
different words sail through it - and that is **two correct answers on the page**. It shipped
three times in one file before being read aloud:

- band 2 offered `in-` "not", `dis-` "not, apart from" and `non-` "not; lacking entirely" on
  one slate;
- band 3 offered `anti-` "against, opposed to", `contra-` "against, opposite" and `ob-`
  "against, in the way of";
- band 4 offered `im-` "not" beside `an-` "not, without", and `-cracy` beside `-archy`.

The repair is not to reword them apart. It is to keep true synonyms **out of the same band** and
to drop a row whose meaning another row already owns: `im-` is the same morpheme as `in-` and
was removed, `-archy` was replaced by `-logy`, and `contra-` moved to band 4. **A declared
`confusion` is only legitimate when the two senses really are distinguishable** - `ante-`/`anti-`
and `hyper-`/`hypo-` are; `-cracy`/`-archy` are not.

### `varies: 'options'` — a template whose stem is constant on purpose

`wk-connotation-b*` asks one sentence forever ("which of these words carries a NEGATIVE
connotation?") and varies the OPTIONS. The audit counted distinct stems, so it reported a
working generator as broken. Templates now declare `varies: 'options'` and `itemKey()` in
`templateAudit.js` keys them off the correct choice instead. Declared, not inferred - the same
rule `stemSpace` follows.

### Distractor pools were being dealt in DECLARATION ORDER

`morphDistractors` and both pair frames walked `rows` in array order, so the first few rows of a
chapter were the permanent distractors on every question of a run - a candidate learns which
words are never the answer without learning any of them. All three now shuffle on the instance
rng, which keeps `(templateId, seed)` byte-identical. `morphDistractors` also prefers the same
`kind` first: offering "one who does or believes" against `inter-` let a candidate strike it for
reading like a suffix, without knowing either part. It is a preference, not a filter, because a
band holds only two suffixes and four distractors are needed.

### 🔴 22 of the 89 OFFICIAL items shipped their worked solution INSIDE an answer choice

Found while writing the WK lesson. `pdf-parse` joins a wrapped line onto the one above it, so
the walkthrough printed after option E arrived as **part of option E** - and the parser's
line-start `Walkthrough:` and `The correct answer is X` rules never saw it. Option E of the
ARDUOUS item was **423 characters long and named the answer**.

Every AR item and every WK item is affected, plus one MK and one IC: **10 AR, 10 WK, 1 MK,
1 IC**. `explanation` was left `null` on almost all of them, so the study screen had no
explanation either.

- `scripts/parseOattsAnswers.mjs` now exports `splitFusedChoice()` and `unmangleQuotes()` and
  applies both. The split boundary is `Solution Walkthrough:` / `Walkthrough:` / `Step 1:` /
  `The correct answer is X`; the head is the option, the tail becomes the explanation.
- ✂️ **`afoqt/data/realQuestions.json` is NOT yet repaired** - the parser is fixed but the
  committed bank still carries the fused text, because the source PDFs are gitignored and were
  not re-fetched before this session ended. Either re-run `scripts/fetchOatts.mjs` then
  `scripts/parseOattsAnswers.mjs`, or apply `splitFusedChoice`/`unmangleQuotes` to the JSON
  directly. **Until then the fused options are still in the app.**
- The mangled `U+FFFD` characters are the source PDFs' curly quotes, which pdf-parse cannot
  decode. Only two shapes are recoverable without guessing (an apostrophe between two word
  characters, and a matched pair around a short phrase); a lone one in `A = <?>(b*h)` is a
  vulgar fraction and is deliberately left visible.

### The results screen shows every question on demand

`DrillRunner.jsx` keeps "What you missed" as the default, with a toggle that reveals the whole
run - correct answers included - so the **provenance line is readable on a question you got
right**. That is the point: "was that official, or ours?" is a fair question after a hard item.
Correct rows carry `afq-hit` and every row is numbered.

### The outside-agent work board

`docs/afoqt/HANDOFF.md` is new: every remaining farmable piece of work is a numbered PART with
its own brief and verify block, plus the paste-ready prompt and the zip recipe. **Verified: the
three QC gates run on bare node with no `npm install`** in a packet of `package.json` +
`scripts/afoqt*.mjs` + `src/pages/theknowledgebase/` (about 2.8 MB without `ResearchPics/`).
Tick a PART's box the moment it is finished.

---

## 2026-08-24 — RC passage engine unblocked (Claude-only, HANDOFF PART 14 fix record)

Trey is about to farm out the next wave (VA Parts 10-13, already unlocked and untouched by this
session). This session's job was to unblock what was still locked: the three defects the
2026-08-24 PART 14 review found in `engine/passage.js`. All three are fixed; see the full record
in `docs/afoqt/HANDOFF.md` under "PART 14 fix record". Short version:

1. **Sheet mode wired in.** RC now shares one passage across a `sheetSpan`-sized block of
   consecutive questions (default 5), the same mechanism Table Reading and Block Counting
   already use, instead of drawing an independent random passage almost every question.
   Confirmed with a synthetic-data script (not committed) before touching real content.
2. **`rc-01-method`'s two concepts (`rc-time-management`, `rc-reading-strategy`) auto-tag onto
   every RC template**, mirroring how VA's `va-01-method` concepts ride along on every
   `relationTemplates` output. They were previously unreachable by any coverage path.
3. **`lineNumbered` is now validated**, and passage `text` is required to carry literal `\n`
   line breaks when it does — because a fourth defect turned up while fixing the other three:
   **`render/Figure.jsx` had no `'passage'` case at all.** A registered RC template would have
   generated a perfectly valid question with nothing rendered above the stem. New
   `render/PassageView.jsx` numbers every line (not every 5th — the numbering exists only so an
   item can point at one) and is now wired into `Figure.jsx`.

**Trey's call on sheet mode, and how it resolved:** asked whether to keep one passage "loaded"
across its questions (matching the real subtest) or accept the fresh-passage shuffle. He said
yes to keeping it loaded, and separately asked whether answers should be hidden until the whole
passage's block of questions is done. Checked `DrillRunner.jsx` first rather than assume: it
already never reveals correct/incorrect until the full drill's summary screen, for every
subtest. So the sheet fix alone delivers what he asked for — the passage panel now stays
mounted (same `text` prop across consecutive questions) with no runner change needed. Per-
question storage writes stay immediate, same as every other subtest, since deferring them would
add real risk (an app closed mid-passage) for zero visible benefit.

**Unlocked as a result:** HANDOFF PARTS 15 and 16 (RC passages, bands 2-3 and 4-5) flipped from
`[P]` paused to `[ ]` ready, with their Do/Verify blocks rewritten to the section-6 standard —
including a new authoring rule (line-break format in `text`, and a per-passage question-type
spread requirement so the sheet mechanism doesn't visibly repeat a thin passage's one question of
a type). PART 17 (RC lessons) needed no change — its concept list already matched the resolved
`rc-01-method` ownership.

**Verification run:** `npm run afoqt:check` — selftest clean (`233 templates x 400 instances,
all templates hold their contract`); coverage still reports every `va-*` and `rc-*` concept as
an orphan, which is the documented "already red" work-board state (HANDOFF section 3, rule 11),
not a regression — nothing farms data into those concepts yet. `npx vitest run
src/pages/theknowledgebase/` — 1977 passed, 11 failed, and all 11 are that same pre-existing
VA/RC orphan state (confirmed by reading every failure). No test outside `curriculum.test.js`
was affected by this session's changes.

### Not done this session, worth flagging for whoever picks up PART 15/16 next

- The sheet-selection fallback path (a template's concept has no eligible question on the
  sheet's current passage) was exercised in the synthetic check but not against real content -
  it degrades safely (falls back to any eligible question in the band and reports its own
  passage as the sheetSeed) but has not been seen with a real 12-24-passage bank yet. Worth
  eyeballing once PART 15 lands.
- Phase 12 (Physical Science) design was NOT started this session - `PART 19` is still `[L]`
  locked. It is the next Claude-only design task behind a live session, the same shape as VA's
  PART 8, and `engine/facts.js` (built for Aviation Information in Phase 5) is already flagged
  as reusable for it.

---

## 2026-08-25 — Physical Science unlocked, MK stretch band seeded, review-tool research doc

Autonomous session while Trey stepped away, per his instruction: answer his standing questions
up front, then keep unlocking whatever's next without pausing to ask, and report back when he's
back. Three pieces of real work landed; decisions made along the way are called out below since
nobody reviewed them in real time.

### Physical Science fully unlocked (PART 19, then PARTS 20-23 written)

8 chapters, 30 concepts, added to `curriculum/chapters.js` under a new `science` track -
grounded in the 25 official OATTS Physical Science items already in the repo
(`afoqt/data/realQuestions.json`), which split evenly across exactly 8 real areas. Full record
in `docs/afoqt/HANDOFF.md` under "PART 19 design record." Two decisions worth flagging:

- **This supersedes HANDOFF's original placeholder split** ("mechanics, forces, energy" / "matter,
  chemistry, earth and space") - that guess was written before anyone pulled the real 25 items
  and does not match the actual taxonomy. Checked the primary source before designing, same
  discipline the figure-bearing subtests required.
- **No new engine needed.** `engine/facts.js` (built for Aviation Information) is reused as-is -
  unlike VA, which needed a new `engine/analogy.js`. Part 19's whole job was curriculum design.

PARTS 20/20B/21/21B (fact rows, split VA's `10`/`10B` way so downstream part numbers don't
shift), 22 (lessons) and 23 (test suite) are now fully detailed and farmable. Trey confirmed
full-depth investment (parity with Aviation Information's ~370 facts / ~11 chapters) over a
lighter unscored-subtest pass, given his "dominate every topic" goal.

### MK band-5 `stretch` seeded, and it was unreachable from any view until now

Trey said yes to building this (a standing question in this file - "worth Trey's decision" - had
sat unanswered for a while). Three new templates, one each in `ch06-polynomials.js`
(`mk-factor-sum-diff-cubes`), `ch07-quadratics.js` (`mk-complete-the-square`) and
`ch11-right-triangles-solids.js` (`mk-space-diagonal`, in the chapter covering Trey's named
weakest area). Each is a genuinely different skill from anything already in its chapter at bands
1-4, not a wider parameter range - doctrine requires that distinction and it was checked
deliberately for each one (see each template's file comment).

**Real defect caught by reading the output aloud, exactly the kind structural checks can't see:**
`mk-complete-the-square`'s hand-typed explanation string had an inverted sign ternary - it
printed "y = (x + 4)² - 9" and then immediately said "i.e. (x - 4)² - 9" in the same sentence.
The actual answer choices were never wrong (computed correctly via `binom()`), only the
redundant hand-typed restatement in the explanation was - which is its own lesson: the fix was
to delete the hand-typed restatement entirely and lean on the already-correct `correct` variable,
rather than trying to fix the sign by hand a second time.

**A second thing found in the same pass, not originally part of Part 33's scope:** `stretch`
content had a UI reachability gap. `assembleDrill`'s `includeStretch` parameter existed and
worked, but no view ever passed `true` for it - `DrillConfig.jsx` had no control for it at all.
Band 5 could have been "done" by every structural check while remaining completely invisible to
Trey, the same class of bug the UI feature contract section of the root CLAUDE.md exists to
catch ("a toggle must do the thing it claims"). Fixed: a "Depth" section in `DrillConfig.jsx`,
off by default, shown only for a subtest that actually has stretch templates, forces untimed the
moment it's enabled, and is mutually exclusive with exam mode in both directions (a "Full
subtest" simulation has to stay an honest replica of the real test, which has zero band-5
content).

**Explicitly NOT done:** the other 10 MK chapters have no band-5 tier. This was scoped as a seed
that proves the mechanism end-to-end (content + reachable UI path), not full stretch coverage of
the math track - continuing it to more chapters is genuine future work, flagged rather than
silently implied as finished.

**Verification:** `npm run afoqt:selftest -- --samples=8000` clean (236 templates, band 5 now
shows 3 - was 0). One structural finding along the way, not a defect: `mk-space-diagonal`'s
curated table of 10 exact-diagonal triples has two entries that collide when scaled (3-4-12-13 x2
equals 6-8-24-26; 2-3-6-7 x2 equals 4-6-12-14, both already-scaled primitives happening to
already be in the table) - declared `stemSpace: 18` (the measured true count) rather than the
intended 20, following the project's own "declare the bound as measured" convention.
`npm run afoqt:coverage` clean for the three new concepts. `npm run build` clean. `npx vitest run`
- 1980 passed, 19 failed, all 19 the documented pre-existing VA/RC/PS "no data yet" pattern (was
11 before this session; +8 is exactly the 8 new PS chapters getting the same "no lesson yet"
failure VA/RC already had - not a regression).

### Review-tool design research (not implemented, Trey's to review)

Answered Trey's "I'm worried this isn't great to use long term" concern with actual research
(spaced repetition / FSRS vs SM-2, retrieval practice, interleaving, UWorld/Anki/CAT patterns,
gamification pitfalls), audited against the ACTUAL current code rather than from memory, and
wrote it up at `docs/afoqt/REVIEW-TOOL-DESIGN-RESEARCH.md`. Headline finding: the engine already
does several research-backed things well (per-template regeneration defeats answer-memorization
harder than a static Anki card can; distractors as named error-modes is close to unheard-of in
commercial tools), but the miss-pool is a flat 10% injection rate rather than an adaptive
priority, and there's no dedicated "drill just my misses" mode - both flagged as cheap, clearly
worth doing, neither implemented pending Trey's read.

### Also saved this session, for Trey's own reference (not doctrine)

`docs/afoqt/ENGINE-VS-CONTENT-QA.md` - answers his question about how much of a farmed VA/RC
part is "real" engine-generated variety vs. literally the words a farmed agent typed. Marked
Claude-ignore at the top; it's a personal note, not a work-board entry.

---

## 2026-08-26 — Phase 13 (Situational Judgment) unlocked; SDI scope decided

Trey asked what it would take to unlock Phases 13 and 14, said he hasn't had time to farm out the
already-unlocked work (PS/VA/RC parts still sit untouched) and wants Claude to keep advancing
whatever isn't farmable in the meantime. Two decisions from him up front: unlock Phase 13 now, and
do NOT build the SDI as an interactive tool.

### SJT design + a new engine (PART 24)

Read Barron's 4th Ed's SJT section directly rather than working from `RESEARCH.md`'s summary -
extracted PDF 251-263 with `scripts/extractBook.mjs` to the scratchpad (never the repo). That is
the full Practice Test #1 SJT subtest: 25 numbered situations, five lettered actions each, plus the
SUBTEST #6/#7 directions verbatim and 20 sample SDI statements.

**Curriculum:** new `judgment` track in `curriculum/chapters.js`, 7 chapters (a method chapter plus
one per official competency - Integrity/Professionalism, Leadership, Resource Management,
Communication, Innovation, Mentoring), 15 concepts. Grouped by what the 25 real situations actually
show, the same "check the primary source, group by what it shows" discipline PS's Part 19 used -
not an invented split.

**Engine:** SJT doesn't fit `facts.js` (no dictionary confusions) or `analogy.js` (no relation
pairs) - every one of a scenario's five actions is an authored judgment call, and the same five
actions answer TWO different questions (MOST effective, LEAST effective) about one situation. New
file: `engine/judgment.js`. The one genuinely clever piece: the real subtest asks MOST then LEAST
back-to-back for each situation, and that pairing falls out for free by reusing the existing sheet
mechanism (`SHEET_BITS`, built for Table Reading/Block Counting) instead of inventing a new one -
high seed bits pick the situation, the low bit picks MOST-vs-LEAST, and `buildDrill`'s existing
figure-rotation logic does the rest. Verified with a throwaway smoke script (registered synthetic
rows, walked seed pairs across 50 sheet seeds, confirmed pairing + all six registrar guards actually
reject bad input), then deleted - not committed, same as PART 8/19's `node --check`-only
verification, since it carried no real content.

**Two things flagged rather than silently resolved**, full detail in HANDOFF.md's "PART 24 design
record":
- **Scenario count is disputed and the design does not commit to a number.** `afoqtSpec.js`
  already flagged "AFPC counts 50 questions across 16 scenarios; Pearson counts the 16 scenarios" -
  but Barron's actual practice test has **25** situations producing exactly 2 questions each. Both
  are primary-lineage sources disagreeing on more than a timing footnote. Built to 50 questions
  (undisputed) without baking either 16 or 25 into the engine.
- **Innovation is thin in the real sample** - 24 of 25 situations turn on one of the other five
  competencies. Declared anyway (same precedent as VA's rare-but-real Part/Part and Sequence), but
  PART 25C is told explicitly not to invent scenarios to fill it and to report a blocker instead if
  a second source doesn't turn up real grounding.

PARTS 25/25B/25C (scenario rows, split by chapter pair like VA/PS's data parts), 25D (lessons) and
25E (test suite) are now fully detailed and farmable in HANDOFF.md - none of them touched yet,
per Trey's "farm it out later" plan.

### SDI: decided not to build (PART 26)

Asked Trey directly rather than assuming: a 240-item personality inventory with explicitly no right
or wrong answers and zero composite weight has nothing to drill or master, so an interactive
version would be a UI with no mastery concept behind it. He agreed - skip it, document the format
only (Likert scale, 45 min / 240 items, answer from first impression) somewhere Trey will see it
before test day, not as a drillable subtest. Not built this session; flagged for whoever next
touches exam-overview content.

**Verification:** `node --check` on `chapters.js` and `judgment.js`; `npm run afoqt:selftest` -
236 templates unchanged, all still hold (confirms the new track/chapters didn't disturb anything
existing); `npm run afoqt:coverage` - all 15 new `sjt-*` concepts report as orphans, the documented
"already red" state (no rows exist yet), not a regression.

### Phase 14, PART 27: composite scoring engine - and why it computes practice accuracy, not a score

Kept going per Trey's "keep going on non-farmable work while I get around to farming the rest"
instruction. Flagged above that PART 27 looked unlockable without a research pass since
`afoqtSpec.js` already specifies `COMPOSITES` - true, but the deeper question turned out not to
be "what's the formula," it was "can this tool compute the real AFOQT score at all." It cannot:
`RESEARCH.md`'s own "Scoring" section already confirms percentiles are norm-referenced against a
population this tool has no access to, and exact weightings are unpublished Pearson/AFPC IP - not
a gap another search closes. Faking a percentile would have handed Trey false confidence (or a
false alarm) on a test with one attempt that counts, so `engine/scoring.js` computes something
different and labels it everywhere it appears: **practice accuracy** - percent correct so far,
composited as a question-count-weighted average across each composite's subtests, with "no
attempts yet" kept distinct from an actual 0%.

Wired into `AfoqtDashboard.jsx`'s Composites section (previously just listed which subtests feed
which composite, no number at all). Verified two ways beyond unit math: a throwaway Playwright
script screenshotted the empty state (all six composites read "no attempts yet" - see
`docs/afoqt/HANDOFF.md`'s PART 27 record) and a populated state with real MK/TR template ids
seeded into `localStorage` (PILOT/CSO/ABM/ACAD/QUANT all showed hand-verifiable weighted
percentages, zero console errors). Both scripts deleted after, not committed.

**The rule that matters for anyone touching this next:** a composite's practice-accuracy percentage
must never render next to its official percentile `min` as though the two are on the same scale.
The current layout spells out "Xth percentile - not the same scale as the accuracy above" every
time the minimum appears, rather than trusting a reader to remember a rule stated once. This is
the single most dangerous mistake this feature could make, and it is now the top of PART 27's
design record for exactly that reason.

**Not done:** the full-length sequenced Form T exam runner (PART 28), diagnostic mode seeded from
real OATTS items (PART 29 - flagged back in Phase 0's "Recommended deviation" note and still never
built), and any trend-over-time view (PART 30). This session was scoped to "can a composite number
exist at all, honestly" - the rest is real remaining work, detailed as far as it can be without
building PART 28 first (an exam runner needs real content across VA/RC/PS/SJT to actually

### 2026-08-26 — Every farmable PART landed in one continuous session (PARTS 10 through 32)

Trey decided not to farm the remaining work out to outside agents after all ("I am going to have
you do the sections that i initially was going to farm... I've decided to not farm them"), and
asked to keep going through the whole board without pausing between parts, pushing live after
each one. This session did: **VA data + lessons + tests** (PARTS 10/10B/10C/11/11B/12/13), **RC
passages + lessons + tests** (PARTS 15/16/17/18), **PS fact rows + lessons + tests**
(PARTS 20/20B/21/21B/22/23), **SJT scenario rows + lessons + tests** (PARTS 25/25B/25C/25D/25E),
and the two standing chores (PART 31: wired the TKB `*.selftest.mjs` scripts into vitest; PART 32:
deleted the confirmed-dead `ingestion/` folder). Every part shipped with its own `git commit` +
`git push` immediately after passing its Verify block, per Trey's instruction, so the repo history
IS the part-by-part record - `docs/afoqt/HANDOFF.md`'s section 5 board and each part's own
completion note carry the full detail; this entry is a pointer, not a duplicate.

**Three real defects were caught by the QC gates themselves, not by inspection, and are worth
remembering as patterns, not just fixed instances:**
1. **A short slate can come from a bare-word collision across the WHOLE bank, not just within one
   file.** VA's `-term` format reduces a distractor to a bare word; two DIFFERENT rows in
   DIFFERENT chapters sharing a bare b-word (e.g. two "TREE" pairs, or two "HOT" pairs) collided
   silently, because `crossPool` draws from the entire cross-chapter band pool, not just the
   current file. Caught by `afoqt:selftest -- --samples=8000` on VA parts, then RC hit an
   analogous version (a compound term split across a line-wrap boundary).
2. **A `sheet: true` template can lock onto a single item forever** if a figure/passage/scenario
   has exactly 1 eligible item for that template's concept pool - `inSheetPassage[h.item % 1]` is
   always the same index, and the fallback to the full cross-figure pool only triggers at a pool
   of exactly 0. RC's `rc-main-idea` template collapsed to 2-3 distinct stems this way; the fix
   pattern (every passage/scenario needs 0 or 2+ eligible items per pooled template, never
   exactly 1) is now baked into how PART 16's passages and every SJT chapter's scenarios were
   built from the start, rather than discovered after the fact each time.
3. **Two engines (`engine/passage.js` and `engine/judgment.js`) share the exact same structural
   ceiling** - one template per (chapter, band), which means a chapter can never clear the generic
   "5 templates in-band" test-out-gate check no matter how much content exists, since content
   volume grows a template's internal `stemSpace`, not its template count. This surfaced first as
   an RC-specific finding in PART 16, then was confirmed systemic to SJT too while verifying
   PART 25D - documented in both places rather than silently patched, since a real fix means
   redesigning one or both engines to register multiple template flavors per band (the way
   `engine/facts.js` and Table Reading's own template file already do), which is real
   engine-design work for a future session, not something any amount of data-authoring could
   close.

Also found and fixed, while verifying PART 25D specifically: `engine/judgment.js`'s
`scenarioTemplates()` never auto-tagged `sjt-01-method`'s two concepts onto its generated
templates, unlike `engine/analogy.js` and `engine/passage.js`, which both already do this for
their own method chapters. A real gap in PART 24's engine work, invisible until PART 25D's lesson
verification actually ran `afoqt:coverage` against it.

**End state:** `npm run afoqt:selftest -- --samples=8000` clean (330 templates), `npm run build`
clean, `npx vitest run` at 4067/4068 passing - the sole failure is the documented, not-fixed
test-out-gate limitation above (item 3), reported the same way every session in this project
reports a known limitation: named, explained, and left for whoever does the engine redesign next.
Every board item is `[x]` except the three still-`[L]`-locked exam-simulator parts (28/29/30),
which need real VA/RC/PS/SJT content to simulate against and were never in scope for this pass -
that content now exists, so PART 28 is unblocked for whoever picks it up next.

---

### 2026-08-26 — PART 28: full-length Form T exam runner (Claude-only)

Picked up PART 28 right where the note above left it - all farmable subtest content existed, so
the exam runner was no longer blocked. New `engine/exam.js` (pure administration-order plan built
from `afoqtSpec.js`'s `SUBTESTS`/`BREAKS`, so it can't drift out of sync with a future spec edit),
`views/ExamConfig.jsx` and `views/ExamRunner.jsx`, a third "Exam" nav tab, and an `examRuns` +
`ExamSession` addition to `afoqtStorage.js`. Full design record is in `docs/afoqt/HANDOFF.md`
under "PART 28 design record" - read it before touching `ExamRunner.jsx` again.

**The one thing worth repeating here:** this shipped a real bug that every automated gate in the
repo (`afoqt:selftest`, `afoqt:coverage`, `npx vitest run`, `npm run build`) stayed green through
the entire time it was broken. `advance()` tried to read a variable assigned inside a `setSession`
updater on the very next line after calling `setSession(...)` - which doesn't work, because React
does not guarantee the updater has run by then. The on-screen "Exam complete" report rendered
correctly (React's own state was fine) while `localStorage` and `progress.examRuns` silently never
got the finished exam. Found only by scripting an actual Playwright click-through of a full ~310
question exam and inspecting `localStorage` at each step - the same "structural checks prove
well-formed, never well-behaved" lesson this project has learned before, just for state
transitions instead of question content. Fixed by moving every persistence side effect into a
`useEffect` that reacts to the COMMITTED `session` value instead.

**Verification:** `engine/__tests__/exam.test.js` (19 tests, plan order/timing/accuracy-math) +
a full browser click-through (all 11 scored subtests, both breaks, the SDI pass-through, the
final report, zero console errors) + `npm run afoqt:selftest -- --samples=8000` (330 templates,
unchanged) + `npx vitest run` (3180/3181 in the TKB folder, the sole failure being the
pre-existing documented RC/SJT test-out-gate limitation, not this part) + `npm run build` clean.

✂️ **Flagged, not fixed:** the exam report's aggregated "how you missed them" panel reveals that
several subtests (VA, AR, SJT, likely PS) never got their named error-mode ids added to
`engine/errorModes.js`'s `ERROR_LABELS` table, so they print as raw kebab-case ids instead of
prose. Pre-existing in `DrillRunner.jsx` too, not introduced by this part - just newly visible now
that a report shows every subtest's misses on one screen. Real editorial work, out of scope here.

PARTS 29 (diagnostic + dashboard) and 30 (results/analytics) remain `[L]`, unstarted.
