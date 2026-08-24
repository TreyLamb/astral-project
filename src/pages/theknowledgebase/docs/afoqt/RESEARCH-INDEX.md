# ResearchPics — reference index

What is actually in this folder, one entry per file (or per logical group of files), so a future
part can tell from THIS file alone whether it needs to open the real thing. This index is itself
reference material — nothing in `ResearchPics/` ships into the app; see the copyright note at the
bottom of `docs/afoqt/RESEARCH.md` and the ⚠️ note already on `pics related to quizlet10/pics.index.md`.
Author lessons and questions FROM these, at the "topic and difficulty" level QUESTION-DOCTRINE.md
describes — never copy a stem, a full answer choice set, or a definition wording across.

Counts below are read directly from each file with `grep`/`pdftotext`, not estimated from memory.

## Verbal Analogies (VA)

| File | Set title / source | Items | Notes |
|---|---|---:|---|
| `quizlet3.md` lines 1-170 | "AFOQT Official Practice Verbal Analogies" (`quizlet.com/_6tg4g7`) | 25 | ⚠️ **This file is 3 different Quizlet sets concatenated back to back — see below.** This is the VA slice only. Format-2 heavy ("X is to Y as ___" full-pair choices), matches RESEARCH.md's "VA SOURCING" 3:1 ratio finding. |
| `quizlet8.md` | "AFOQT Practice-Verbal Analogies" (`quizlet.com/_1ft8tl`) | 50 | Single set, clean, whole file is VA. Lowercase choice letters. Includes the DOMINANCE/HEGEMONY item RESEARCH.md's band note cites. |

**`quizlet3.md` is not one set — read the whole file before assuming its scope.** It is three
Quizlet exports pasted one after another with no separator beyond their own repeated headers:

1. Lines 1-170: VA, 25 items, `_6tg4g7` (table row above).
2. Lines 171-301: **"AFOQT verbal and word knowledge"** (`_6tjd6x`) — 115 bare `word: definition`
   glossary lines, NOT analogy pairs. This is WK-shaped material sitting inside a file named for VA.
3. Lines 302-678: **"AFOQT Math Knowledge"** (`_g5sa3`) — 35 items, standard MK word-problem format
   with worked-solution explanations. See the MK row below.

Anyone told "go read quizlet3.md for VA" and stopping at the first page boundary will miss that
two-thirds of the file is a different subtest.

## Word Knowledge (WK)

| File | Set title / source | Items | Notes |
|---|---|---:|---|
| `quizlet3.md` lines 171-301 | "AFOQT verbal and word knowledge" (`_6tjd6x`) | 115 | See the VA section above — embedded inside the VA-named file. Plain `word: one-line gloss`, no distractors, no part of speech marked. |
| `quizlet14.md` | "AFOQT Word Knowledge" (`_g5pl9`) | 25 | Clean single set. Real multiple-choice shape: headword, 5 lettered choices, correct answer + one-line rationale ("Something that is heinous is monstrous."). Closest of all the WK sources to the app's own `words.js` row shape. |
| `wordknow1.pdf` | "Barron's AFOQT Word Knowledge" flashcards (`quizlet.com/246683329`) | 545 | 6-page PDF export, plain `Term — definition` table, alphabetical, no distractors, no difficulty marking. This is a **calibration wordlist**, not question material — good for "is this word too obscure for band N" checks the way PLAN.md's Barron's citation already uses it (e.g. FATUOUS, BIFURCATE as hard-end examples), not for lifting new question rows from. |

## Math Knowledge (MK)

| File | Set title / source | Items | Notes |
|---|---|---:|---|
| `quizlet3.md` lines 302-678 | "AFOQT Math Knowledge" (`_g5sa3`) | 35 | See the VA section above. Full worked solutions included, which is unusually good for writing an explanation field. |
| `quizlet9.md` | "AFOQT PRACTICE TEST (MATH SECTION)" (`quizlet.com/329487621`) | ~31 | Own file, single set, but its own title header got cut off when it was captured — the file just starts mid-question. Lowercase choice letters, worked solutions included (e.g. the midpoint-formula and linear-equation walkthroughs). Algebra + geometry + probability mix, wider syllabus spread than quizlet3's MK slice. |

## Aviation Information (AI)

| File | Source | Entries | Notes |
|---|---|---:|---|
| `GLOSSARY-terms.md` | Merged from `quizlet1,2,4,5,6,7,10,11,12,13.md` by `scripts/mergeQuizletGlossaries.mjs` | 1405 | Deduped, alphabetized `term :: definition` pairs. Spot-checked across the file (start, middle, end) — it is Aviation Information cover to cover (airfoils, ATC signals, instruments, weight and balance, weather). The 10 original quizletN.md files this was built from are **gone** — this glossary and the two files below are all that remains of them. |
| `GLOSSARY-qa.md` | Same 10-file merge | 68 | Actual question-phrased Q/A pairs recovered from the same dumps (fuller sentences than the terms glossary, e.g. "An aircraft has a ground speed of 120 knots. How long will it take to travel 20 NM :: 10 minutes"). Better model for an AI question STEM than `GLOSSARY-terms.md` is. |
| `GLOSSARY-review.md` | Same 10-file merge | 4 | Fragments the merge script could not cleanly split — one is literally tagged `UNPARSED`. Skim only if a specific gap shows up nowhere else; not worth building a part around. |

## Instrument Comprehension (IC)

| File(s) | What it is | Notes |
|---|---|---|
| `instruments/1.jpg` – `instruments/25.jpg` | The 25 real question figures from "AFOQT Instrument Comprehension (Form T)" (`quizlet.com/_6bi4g0`), individually cropped, one per file, numbered to match. | ⭐ Each shows an artificial-horizon dial + compass dial on the left and 4 lettered aircraft-silhouette choices (A-D) on the right — **IC is 4 choices, not 5**, unlike every other subtest in this repo. Reference only, same rule as the aviation pics — do not ship the photos; author new SVG attitude figures if a lesson or template needs one on screen. |
| `instruments/instruments1_Answerkey.md` | The 25 answers (letter only, no rationale) for the images above, in order. | Pairs 1:1 with the numbered jpgs by position. |
| `instrumentspdf.pdf` | The same 25 questions, bundled as one 3-page PDF export (confirmed by rendering page 1 — identical figures to `instruments/1.jpg` etc., lower resolution). | Redundant with the two above once you have them; skip it unless you specifically need the original page layout. |

## Orphaned aviation figures (no question text)

`pics related to quizlet10/` — 16 images with their own index at
`pics related to quizlet10/pics.index.md` (already written, not duplicated here). These illustrated
a `quizlet10.md` that was lost before capture, so only the figures survive with no stem or answer.
3 of the 16 files are 0 bytes and unrecoverable. Useful only as visual reference for AI lesson
figures (control surfaces, instrument faces, an isogonic chart, airport sign taxonomy) — see that
file's own table for which figure serves which AI chapter.

## Quick lookup by subtest

- **VA** → `quizlet3.md` (lines 1-170 only) + `quizlet8.md`. 75 items total — matches the "75-item
  sample" `RESEARCH.md`'s VA SOURCING section and PART 8's design record already cite.
- **WK** → `quizlet3.md` (lines 171-301) + `quizlet14.md` for question-shaped material;
  `wordknow1.pdf` for calibration only.
- **MK** → `quizlet3.md` (lines 302-678) + `quizlet9.md`.
- **AI** → the three `GLOSSARY-*.md` files. No standalone quizlet file for AI survives.
- **IC** → the `instruments/` folder. `instrumentspdf.pdf` is redundant with it.
- **Everything else** (AR, RC, SK, TR, PS, BC, GS, ASVAB-only subtests) — **not represented in this
  folder at all.** Do not assume silence means "already sourced elsewhere" — check `RESEARCH.md`
  and `PLAN.md`'s gap list before farming a part for any of those subtests on the assumption that
  reference material exists somewhere.
