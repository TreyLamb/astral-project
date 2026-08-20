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
| **8** | Arithmetic Reasoning | ⬜ Not started |
| **9** | Word Knowledge | ⬜ Not started |
| **10** | Verbal Analogies | ⬜ Not started |
| **11** | Reading Comprehension | ⬜ Not started |
| **12** | Physical Science *(unscored)* | ⬜ Not started |
| **13** | Situational Judgment + SDI *(unscored)* | ⬜ Not started |
| **14** | Exam sim, composite scoring, diagnostic, dashboard | ⬜ Not started |

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

## NEXT

**Phase 8 — Arithmetic Reasoning.** 25 questions in 29 minutes (69.6 s each, the most generous
on the test) and it carries the deferred **chapter 14, word-problem translation**. Confirmed
archetypes from official items: rate/time/distance, percent, proportion/unit-rate, ratio,
volume-in-words, averages, algebraic setup from prose, discount equivalence, scale/map
conversion, and **fencepost counting**. ✂️ Compound interest, mixture and work-rate appear in
commercial prep but in **no** official material — they get templates, ranked below the confirmed
archetypes.

After that: Word Knowledge, Verbal Analogies, Reading Comprehension, Physical Science, SJT/SDI,
then the exam simulator.

**Five subtests now exist (MK, TR, AI, IC, BC)** — the whole Pilot composite and three of the
four CSO subtests.

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
