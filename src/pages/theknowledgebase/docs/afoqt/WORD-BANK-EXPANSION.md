# Word Bank Expansion — sources, tiers, and the plan

Written 2026-09-02, from Trey's response in `vocab-calibration.md`. This is the reference for
every future Word Knowledge authoring pass. Read it with `QUESTION-DOCTRINE.md`.

---

## Trey's difficulty ranking (his words, treat as the spec)

> `ACT < SAT = ASVAB = OATS = TKB band 3 < band 4 / GRE`

Collapsed to three working tiers:

| Tier | Sources | Use |
|---|---|---|
| **Lowest** | ACT | Not worth studying. He knows ~99% of it. |
| **Medium** | SAT · ASVAB · OATTS · TKB band 3 | He is uncomfortable with roughly **33%** of it. Speed-drill material, not new-word material. |
| **Highest** | TKB band 4 · GRE | **The database new AFOQT questions are built from.** |

Two standing decisions that follow from it:

1. **New AFOQT Word Knowledge questions are authored from the Highest tier only.**
2. **Bands 1–2 get a speed drill** — a mode for running questions fast, not for learning
   meanings. The value there is reaction time under a 12-second clock, not vocabulary.

---

## The source: a public, merged GRE headword list

`github.com/Xatta-Trone/gre-words-collection` — 9,566 unique headwords merged from 14 published
lists. **Bare headwords only, no definitions**, which is what makes it usable: a word list is not
the copyrightable part of a prep book, and every gloss, answer and distractor we ship is written
here. This is the same "ruler, not corpus" rule the calibration books get (folder `CLAUDE.md`
constraint 2) — we take *which words*, never *what they say about them*.

**No license is stated on the repo.** It is a compilation of published lists rather than original
authorship, and we take only headwords from it, but the absence of a license is worth knowing
before anything is redistributed.

### Validation — our banding is already calibrated correctly

**117 of our 120 existing words appear in that list**: band 2 → 38/40, band 3 → 40/40,
band 4 → 39/40. Whatever else is wrong with the bank, the *register* was right. That is the
evidence the GRE corpus is the correct source rather than a guess.

### How the pool was tiered

The 9,566 includes bulk 5,000-word lists full of easy words (`abandon`). The Highest tier is
built from the five **curated** lists instead, scored by how many of them a word appears in:

| Hard list | Words |
|---|---|
| Manhattan Prep 1000 | 1,014 |
| GregMat 960 | 959 |
| Powerscore Repeat Offenders | 699 |
| Magoosh Advanced | 350 |
| Barron's 333 | 274 |

Then subtract an **easy-tier union** (Vocabulary.com Top 1000 + Greenlight Basic 500 +
Magoosh Basic, 1,644 words) and subtract our existing 120.

| Filter | Words |
|---|---|
| Union of the 5 hard lists | 1,899 |
| … minus easy tier | 1,179 |
| … minus our existing bank | **1,146** ← the answer to "how many extra words do we get" |
| Of those, in **≥2** hard lists (high-confidence core) | **413** |
| Of those, in **≥3** hard lists (highest confidence) | **145** |

**Result: `data/wordCandidates.csv`** — 1,146 rows, `word,hardListHits`. `hardListHits` is the
authoring priority: 3+ first, then 2, then 1.

His 30/day × 22 days = 660 target fits inside this with room to spare.

---

## How the GRE picks its words (and what that implies for the AFOQT)

ETS publishes no official list. Published lists are reverse-engineered from released practice
material. The selection method the academic-vocabulary field uses — and which the GRE's own
behaviour matches — is the **Academic Word List** approach: pick words by *range* (they appear
across many academic disciplines), *frequency* (a floor of appearances in an academic corpus),
and *dispersion* (evenly spread, not concentrated in one field), **after excluding** the ~2,000
most common everyday words.

That last exclusion is the useful part. It explains the ACT/SAT/AFOQT/GRE ordering mechanically:
each test cuts the common-word floor at a different height. It also predicts what AFOQT items
look like — educated general register, not technical jargon — which matches the six official
OATTS words we have (`arduous`, `ardent`, `cursory`, `benevolent`, `malevolent`, `exasperate`).

No source states where the AFOQT itself sources vocabulary; published guidance is consistently
"study SAT/GRE/ASVAB lists." Treat that as the best available answer, not a documented fact.

---

## Multi-angle questioning — already built, and the real multiplier

Trey's point 5: one word should support 3–5 genuinely different questions. **This is already the
design**, and the bank is deeper than a headword count suggests.

120 words currently produce **631 distinct Word Knowledge questions** across 36 templates:

| Frame | Template | Items |
|---|---|---|
| Closest in meaning | `wk-05/06-b{2,3,4}-syn` | 120 |
| In context (sentence) | `wk-05/06-b{2,3,4}-ctx` | 120 |
| **Most nearly opposite** | `wk-opposite-b{2,3,4}` | 120 |
| Connotation (pos/neg) | `wk-connotation-b{2,3,4}` | 51 |
| Roots — meaning + apply | `wk-02-b*` | 60 |
| Affixes — meaning + apply | `wk-03-b*` | 48 |
| Confusables — define + pick | `wk-04-b*` | 112 |

That is **~5.3 questions per word**, which is exactly the ratio he asked for. So the multiplier is
not the missing piece — **the headword count is**. Each new word added at the Highest tier is
worth roughly five questions, so 1,146 candidates ≈ **6,000 additional distinct items**.

**Every row already carries a confusable** — `registerWords()` throws without one
(`engine/words.js`), and its meaning is always on the slate. Point 7 is enforced structurally,
not by convention.

---

## What was wrong in the calibration sheet

Two things I told him that this file corrects:

1. **"Word Knowledge capped at 120."** Wrong unit. 120 *headwords*, 631 *questions*. The same
   error understated Verbal Analogies (114 relations → 260 questions), Physical Science
   (266 facts → 532), and Aviation Information (374 facts → 670).
2. **"It is authoring volume, not a missing feature."** He rejected this and he is right. The
   words were reachable the whole time — a public 9,566-word list, one fetch away, with 97.5%
   of our existing bank already inside it. Nobody looked. That is the same failure the root
   `CLAUDE.md` already names under "never declare a source unavailable from a sample of one",
   applied to a source that was never even searched for.


---

## What was actually built, 2026-09-02

**132 new words** across six chapters, taking the bank from 120 to **252**. Band 5 did not exist
before this and now holds 73 words.

| Chapter | Cluster | Words | Band 4 / 5 |
|---|---|---|---|
| `wk-07` | Deception, truth and integrity | 22 | 13 / 9 |
| `wk-08` | Praise, blame and scorn | 22 | 13 / 9 |
| `wk-09` | Temperament and mood | 22 | 9 / 13 |
| `wk-10` | Clarity, obscurity and expression | 22 | 11 / 11 |
| `wk-11` | Abundance, scarcity and harm | 22 | 7 / 15 |
| `wk-12` | Rigour, obligation and pace | 22 | 7 / 15 |

Word Knowledge went from 36 templates to **60**, and from 631 distinct questions to **895**
(band 2: 206, band 3: 216, band 4: 329, band 5: 144). The jump is smaller than 132 x 5 because
the method frames (`wk-opposite-*`, `wk-connotation-*`) draw across a whole band rather than a
chapter, so they widen rather than multiply. Lessons are GENERATED (`scripts/afoqtWordLessons.mjs`) so their tables cannot drift
from the rows the questions actually use.

### Three defects found while building, all worth keeping

1. **`stemSpace: 1` on every Instrument Comprehension template.** The file's own header said the
   space was about 120 attitudes; the declared value said 1, so `templateAudit.js` had been
   sampling ONE attitude per template and reporting clean. Real space is 168. Fixed by deriving
   it from the pool sizes and declaring `varies: 'options'` (the stem is constant on IC; the
   attitude is the item).
2. **Per-figure `stemSpace` summed into subtest totals.** Block Counting and Table Reading
   generate their figures, so their `stemSpace` counts questions per figure. Summing it invented
   a finish line that does not exist. Both now carry `generatedFigure: true`; Reading
   Comprehension and Situational Judgment index an AUTHORED list and stay countable.
3. **A LENGTH TELL on 69 of the 132 new rows.** A confusable glossed as *"to treat something
   sacred with disrespect"* on a slate of one-word options is findable in a second by anyone who
   notices the long option is always the trap. Every structural check passed. It surfaced only
   from reading `npm run afoqt:sample` output — the exact failure mode the folder `CLAUDE.md`
   warns knowledge subtests about. All 69 shortened, and `registerWords()` now **throws** on a
   confusable gloss two or more words longer than every other option, so it cannot recur. The
   original 120 rows had zero instances of it.

### Still to do

`data/wordCandidates.csv` holds **1,146** sourced candidates; 132 are now authored. The
remaining ~1,014 each need a gloss, four named wrong answers and a real confusable before they
can carry a question. The study plan at `/TKB/afoqt/study` states the gap on its own face rather
than presenting a quarter-full plan as a finished one.
