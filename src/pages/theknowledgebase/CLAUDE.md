# CLAUDE.md — TheKnowledgeBase (TKB) / AFOQT

Folder-local rules. Read before touching anything under
`src/pages/theknowledgebase/`. The root `CLAUDE.md` still applies on top of this.

---

## What lives here

| Route | What |
|---|---|
| `/TKB` | General-knowledge rapid-review flashcards (the original tool) |
| `/TKB/review`, `/TKB/subjects`, `/TKB/settings` | Original tool — **do not redesign, additive changes only** |
| `/TKB/asvab` | Parked ASVAB module *(planned)* |
| `/TKB/afoqt/*` | AFOQT training module *(in build)* — Math Knowledge, Arithmetic Reasoning, Table Reading, Aviation Information, Instrument Comprehension and Block Counting live |
| `/TKB/courses/*` | Courses module — per-course document/assessment tracking, real-question capture, and zero-AI question generation feeding TKB's spaced-review engine |

**Full AFOQT docs: `docs/afoqt/`.** `PLAN.md` there is the **live handoff state** — read it first
in a new session, update it at the end of every working block.

**Full Courses docs live IN the courses folder, not under `docs/`:**
`courses/PLAN.md` (live handoff state) and `courses/DATA-MODEL.md` (architecture/reasoning) —
read `PLAN.md` first. Unlike AFOQT, these sit next to the code they describe rather than in a
sibling `docs/courses/` folder (that folder still exists only for the unused `repo-doc` content
convention — see `DATA-MODEL.md`'s Content Strategy section).

**`docs/afoqt/HANDOFF.md` is the project skeleton + known-polish list.** All 33 build PARTs are
done (2026-08-26), so the old outside-agent farming-board format (numbered PARTs, paste-ready
prompts, minimal-zip recipe) was retired 2026-08-27 — read it if you need to know what's built,
what's flagged-but-not-fixed, or what's a deliberate scope decision (SDI). The full historical
PART-by-PART design records and hard-won engine bugs it replaced are preserved in
`HANDOFF-ARCHIVE.md`, worth opening only when modifying the VA/RC/SJT/exam engines specifically.

---

## THE TWO RULES THAT MATTER MOST

Full text in `docs/afoqt/QUESTION-DOCTRINE.md`. Do not generate a single question without
reading it.

### 1. Iterate at the SAME difficulty
`2 + 2` iterates to `3 + 4`, `1 + 3`, `4 + 1` — **never** to `2 × 354`. A harder question
is a *different* question needing its *own* iterations. Enforced structurally: content is a
**template** carrying a difficulty `band`, emitting instances only inside that band.
**Distractors are error-modes** (sign error, forgot to halve, radius-vs-diameter), never
random noise.

### 2. No orphan concepts — "OVERPREPARE intelligently"
A lesson must not teach what nothing tests, and no question may test what no chapter
taught. Bidirectional, enforced by `npm run afoqt:coverage`. Cover edge cases a real
question might veer into — breadth is fine, it just has to be paid for in questions.

---

## Why these rules exist (do not repeat this)

The ASVAB deck here was polluted by bulk import and **Trey stopped using the tool**:

- **258 of 786 ASVAB questions are junk** — Open Trivia DB / Trivia API / MMLU imports.
  *"What are male cows called?"* is filed under Physical Science. A **1,199-character AP
  Physics C** oscillator problem is filed under Mechanical Comprehension.
- ~60 core questions are **misfiled** (electronics/biology under `arithmetic-reasoning`);
  12 "arithmetic reasoning" questions contain **no digits**.
- `difficulty` was assigned **per block**, not per question.

`ingestion/` (mmluAdapter, openTdbAdapter, triviaApiAdapter) is the **dead code that
caused this**. It is slated for deletion — do not revive or extend it.

---

## Hard constraints

1. **The ASVAB deck is READ-ONLY. Do not modify it at all.**
   Trey's rule, stated explicitly: *"I want the asvab review stuff to be left untouched, we
   are making copies and cleaning those up instead of overwriting the current asvab test
   questions."*
   - `asvabQuestions.json`, `asvabSubject.js` and the `subj-asvab` questions in a user's
     storage stay exactly as they are. **No retiring, no re-filing, no difficulty
     re-derivation, no `CONTENT_SYNC_VERSION` bump against that deck.**
   - The junk (258 supplemental imports) and the ~60 misfiled questions are filtered out of
     the **copy** that feeds AFOQT. They remain in the ASVAB deck, untouched.
   - `/TKB/asvab` is a read-only entry point onto the existing deck, not a cleanup surface.
2. **Never ship verbatim commercial question text.** This site **deploys publicly to
   Vercel**. The calibration books at `G:\My Drive\` are a **ruler, not a corpus** — read
   them to set difficulty bands and extract topic coverage; generate new questions.
   Only **official AF material** (OATTS, AFPC pamphlet — cleared for public release) may
   ship verbatim as `provenance.kind: 'real'`.
3. **CSS prefix `afq-`** for AFOQT, `tkb-` for everything else. Inherit `--tkb-*` tokens;
   no new palette.
4. **Lessons are markdown** rendered with `react-markdown` (already a dependency).
5. Mastery is tracked **per template, not per instance** — `(templateId, seed)` regenerates
   a question byte-identical. One Firestore doc: `users/{uid}/afoqt/progress`.

---

## AFOQT facts that are easy to get wrong

- **Form T is current** (since 2014). **Rotated Blocks, Hidden Figures, General Science,
  Mechanical Comprehension are GONE.** Several popular free practice tests are still
  Form S — including afoqtguide.com's free full test and test-guide.com's quizzes.
- ⚠ **An official-looking PDF is not necessarily current.** AFPC hosts a pamphlet under a
  `/Form%20S/` path with outdated numbers.
- **No calculus, no trigonometry** in Math Knowledge. Arithmetic, algebra, geometry only.
- **No guessing penalty** — always mark an answer.
- **Instrument Comprehension has 4 options; every other subtest has 5.** Its bank
  indicator is **inverted** (bank right → pointer left) and the viewer is **always looking
  north**.
- **Block Counting answer ranges shift every question AND can run DESCENDING.** The official
  Form T key for five consecutive samples is `1-5`, `3-7`, `5-9`, `2-6`, `2-6`; Barron's
  Test #1 keys block 23 **`A6 B5 C4 D3 E2`**. You cannot memorise "4 = B" and you cannot
  assume the key ascends. Reproducing both behaviours is mandatory.
  ⚠️ Watch the *answer position* while doing it: deriving the window from an offset and
  clamping it at 1 piles low counts onto the same slot, and C came up 38% more often than
  chance — which hands back the guess-the-letter reflex the shifting key exists to destroy.
- **Block Counting piles are cuboids in CROSSED layers, never a lattice of cubes.** A lattice
  block has at most six neighbours and the official S3 is keyed at **seven**, so a lattice
  cannot represent the AF's own worked example. Length 2 gives the Form T sample's "two above,
  two below" (6); length 3 gives Form S's "three above, three below" (7). Corner and edge
  contacts must not count — that exclusion is the entire difficulty. `engine/blocks.js`.
- **Table Reading Y axis DESCENDS** top-to-bottom, and the real grid is ~33×33. Difficulty is
  **scan distance, never grid size** — every band in `templates/tr/` runs on the full-size grid,
  because a smaller grid would teach a layout the test does not use.
- **The Table Reading field is GRADUAL: every step right and DOWN adds exactly 1 or 2.** So the
  five options cluster within a couple of points and a slipped row cannot be felt — that is the
  entire difficulty of the subtest. It is also **not separable** (row deltas differ per row), so
  there is no formula to shortcut a lookup. Verified against the AFPC pamphlet's own sample
  table, transcribed in `engine/table.js` and `docs/afoqt/RESEARCH.md`.
  ⚠️ An earlier pass of RESEARCH.md claimed the values were *"non-monotone"* with **no citation
  and no backing item**, and the first build of the generator was written to it (uniform random
  0-999). Treat an uncited line in that dossier as a hypothesis, not a fact.
- Timing is the real difficulty: Block Counting **9.0 s/question**, Table Reading 10.5,
  Word Knowledge 12.0, Instrument Comprehension 12.0.

### Composite count is DISPUTED — do not state "six" as settled
Current commercial sources report **six** composites (Pilot, CSO, ABM, Academic Aptitude,
Verbal, Quantitative). But the **AFPC 2015 pamphlet and Barron's 4th Ed (2018) both
describe SEVEN**, the seventh being **Situational Judgment**.

- **Physical Science and the Self-Description Inventory are in no composite** — that much
  is consistent across every source.
- **Situational Judgment may well be scored.** Do not deprioritise it on the assumption
  that it is worthless.

---

## Calibration books (outside the repo, at `G:\My Drive\`)

| Anchor | File | Rule |
|---|---|---|
| **TARGET** | `Military Flight Aptitude Tests _ Barron's.pdf` — Duran, **4th Ed, 2018**, 700 pp | Aim here. **Two full AFOQT practice tests**: book p.217 & p.315 = **PDF p.226 & p.324** (offset **+9**). |
| **CEILING** | `AFOQT practice test book 2021-2022 … Trivium` | Too hard *for the time limit*. Tag templates `stretch`, default untimed. |
| **FLOOR** | `The Complete AFOQT Study Guide 2020-2021.epub` | "Way too easy" — never fall to this. |

**Text-extraction quality differs per book — only Barron's has OCR damage:**

| Book | Text layer | Quality |
|---|---|---|
| Trivium (164 pp) | **Native** | Clean. No OCR issues. |
| Complete Study Guide (`.epub`, 28 files) | **Native** | Clean, ~280k chars. |
| Barron's (700 pp) | **OCR'd library scan** | Body prose extracts well. ⚠ **Cover art, TOC dot leaders, table cells and math notation are mangled** (`517` → `Sy7`; the composite table lost every X mark). Never trust an OCR'd number or table from this book without eyeballing the page. |

### ⭐ PDF pages DO render — you can look at the figures yourself (2026-08-20)

The old line here said images "never extract" and to ask Trey for screenshots. **That is no
longer true and it cost two phases of guessing.** `pdftoppm`/poppler is still missing, so the
**Read tool cannot open a PDF** — but `pdf-parse` v2 renders pages itself, and `sharp` (already
installed) crops them:

```js
const p = new PDFParse({ data: new Uint8Array(fs.readFileSync(pdf)) });
const r = await p.getScreenshot({ first: 24, last: 24, scale: 5 });   // scale 5 => ~4000px wide
fs.writeFileSync(out, Buffer.from(String(r.pages[0].dataUrl).split(',').pop(), 'base64'));
// then: sharp(out).extract({ left, top, width, height }).resize({ width: 900 }).toFile(crop)
```

Then **Read the PNG** — it displays. Render the page at `scale: 5` and crop to the figure;
reading a whole page downscaled loses the detail that matters. This is how the official Block
Counting pile was finally read. Use it before asking Trey for a screenshot of anything.

`PDFParse` also exposes `getImage`, `resolveEmbeddedImage`, `getTable` and `getPathGeometry`.

⚠ **Check which FORM a pamphlet is before trusting a number.** Two different "AFPC pamphlets"
are in play and they disagree on Block Counting's own worked answers. The one at
`afrotc.rutgers.edu/.../afpt-997_afoqt-practice-pamphlet_cao01aug15.pdf` is **Form T** — Part A /
Part B, Reading Comprehension and SJT present, `Part B.4 - Block Counting`. If a pamphlet lists
Rotated Blocks, Hidden Figures or General Science, it is **Form S** and its numbers are stale.

Barron's is multi-service (AFOQT + SIFT + ASTB-E). Mine its **aviation, math and verbal**
sections; **skip Mechanical Comprehension, Spatial Apperception and nautical** — no AFOQT
equivalent. Cross-service items are safe for *topic coverage* but **not for difficulty
banding** (SIFT is adaptive, ASTB norms differently).

Read a book with:
```
node scripts/extractBook.mjs "G:/My Drive/<file>" --pages 226-240 --out <scratchpad>/x.txt
```
Always write extracted text to the **scratchpad, never the repo**.

---

## AFOQT QC scripts — run these, they are the whole defence

```
npm run afoqt:selftest                    # structural contract, 400 instances/template
npm run afoqt:selftest -- --samples=8000  # ⚠ DO THIS before declaring a batch done
npm run afoqt:coverage                    # bidirectional traceability (Doctrine rule 2)
npm run afoqt:check                       # both of the above
npm run afoqt:sample -- --only=mk-factor  # print real generated questions to eyeball
```

Rules learned in Phase 3, all of them the hard way:

1. **400 samples is not enough.** 8 collisions surfaced at 400, 23 more at 1500, 3 more at
   5000. A collision usually means a distractor landed **on the answer**, i.e. two correct
   choices shipped.
2. **Never guard collisions one at a time** — the repair re-breaks a different pair. Use
   `sweep(lo, hi, start, slateFor)` from `templates/util.js`, which walks a parameter's range
   for a value where the whole slate is distinct. ⚠ A sweep cannot fix a collision that does
   not depend on the swept value (`x1 = 0` in midpoint, `a = 90` in third-angle) — exclude the
   degenerate value from the draw instead.
3. **Never pad a short slate with an invented number.** That breaks the error-mode rule. Fix
   the template or drop the distractor.
4. **A bounded item space gets DECLARED** via `stemSpace` on the template, not hidden.
5. **Short gates deal distinct templates.** `buildDrill({ distinct: true })`. A 5-question gate
   sampled uniformly asked two isosceles questions and skipped the transversal entirely.
6. **A figure-carrying subtest shares ONE figure per run** (`sheet: true` on the template).
   The seed splits — high 20 bits pick the figure, low 12 pick the question (`SHEET_BITS` in
   `engine/generator.js`) — so a 40-question Table Reading drill runs on one grid like the real
   subtest, while `(templateId, seed)` still regenerates byte-identically. Two consequences that
   are easy to get wrong:
   - **The audit must walk the HIGH bits for those templates.** Seeds 0..7999 produce only two
     grids, so 8,000 samples would check distractor collisions against two tables and report
     clean. `seedForSample()` in `templateAudit.js` spreads them. Block Counting and Instrument
     Comprehension will need the same treatment.
   - **Miss-pool draws on a sheet subtest are always fresh siblings**, re-seeded onto the run's
     figure — an exact replay would drop a second grid into the middle of a drill, and the exact
     item is worthless there anyway.
7. **Distractors can name themselves.** `h.choices` accepts `{ value, error, why }`; the labels
   ride through the shuffle and come back as `errors` / `whys`, and the results screen ranks
   them ("2x read Y as ascending"). Use it wherever the mistakes are nameable and repeatable.
8. **AFOQT engine imports carry explicit `.js` extensions.** Node ESM needs them and Vite
   accepts them, which is what lets the QC scripts run on plain node (vite-node is NOT
   installed). `afoqtStorage.js` imports firebase, so shared constants like
   `MISS_INJECTION_RATE` live in `engine/afoqtSpec.js` instead.

## 🔴 Figure-bearing subtests: check the primary source, then assert the convention

Two phases in a row shipped a figure built to the wrong spec, and neither was catchable by any
structural check. Both are cheap to prevent:

1. **Re-read the primary source before building any figure.** Phase 4's Table Reading grid was
   built to an uncited line in `RESEARCH.md` and was wrong about the single most important
   property of the artifact (the field is gradual, not random). Phase 6 found the dossier wrong
   about the bank pointer too. The AFPC pamphlet extracts cleanly with
   `node scripts/extractBook.mjs <pdf>` — it takes two minutes.
   ⚠ That pamphlet is the **Form S** edition (it lists Rotated Blocks, Hidden Figures and General
   Science). Table Reading, Instrument Comprehension and Block Counting were unchanged in the
   Form T transition, so their directions carry over; anything else from it needs corroboration.
2. **Assert the physical convention numerically BEFORE drawing a pixel.** `bodyAxes` used
   `nose × wing` for the up vector, which points DOWN in a right-handed frame — so a right bank
   raised the right wing, every bank distractor was the correct answer, and the tool would have
   taught the inverted-pointer rule backwards. The output looked completely normal. One assertion
   ("a right bank puts the right wing at positive screen-Y") catches it instantly.
3. **A figure must be checked for LEGIBILITY, which is a judgement, not a test.** Render a contact
   sheet of the whole item space and look at it. Instrument Comprehension's first draft rendered
   two of four options as invisible hairlines, and the numeric fix (projected area) only became
   findable once the picture showed the problem.
4. **Options can be pictures.** `h.choices` takes a `render` per option and returns `optionRender`;
   the `value` stays a canonical text description, hidden behind `.afq-sr-only` during the
   question so it reaches screen readers without giving the answer away.

## Knowledge subtests use the FACT ENGINE, and its failures are editorial

`engine/facts.js` drives Aviation Information and will drive Physical Science. A fact row carries
a `term`, a `gloss`, and the ids of the terms it is **genuinely confused with** — those become the
distractors, so a wrong choice is a named mistake rather than a filler option. Never pad a slate
with an unrelated term; that is what polluted the ASVAB deck.

Four rules learned the hard way in Phase 5, all of them defects that **shipped, passed every
structural check, and were found only by reading questions out loud**:

1. **Never author the identify stem.** `identifyStem()` derives it from the term alone. Writing it
   by hand put the answer in the question on 60 rows, and produced "functions to controls pitch"
   on others. The varied official-style phrasing goes in `recallStem`.
2. **The gloss is a PREDICATE and the article belongs to the term.** "the aileron" + "controls
   roll"; "lift" + "is the upward force". No rule separates the two cases, so a human decides.
3. **A gloss becomes an option, so it must not shout.** Emphasis capitals are a visual tell. Use
   `shoutedWord()`, which allows acronyms — a bare `/[A-Z]{2,}/` rejects every mention of an ILS.
4. **Sample the output and read it.** `npm run afoqt:sample -- --only=<id>` is not optional for a
   knowledge subtest. `afoqt:selftest` proves a question is well-FORMED, never that it is well-
   WRITTEN.

## 🔴 Word-problem subtests: the prose is a defect surface, and only reading catches it

From Phase 8 (Arithmetic Reasoning). Every defect below passed `afoqt:selftest` at **8,000
samples** and was found by running `npm run afoqt:sample` and reading the output aloud.

1. **Draw the NUMBER from the NOUN, never independently.** Independent draws produced a boat at
   **140 mph**, a train quoted in **gallons per mile**, **"5 identical tickets weigh 100 pounds"**
   and a **tent sold by the ounce**. The fix is typed pools, not wider ranges: `TRAVEL` carries a
   `[slow, fast]` per vehicle, `WEIGHABLE` is separate from `COUNTABLES`, `BULK_GOODS` from
   `GOODS`. An item that is arithmetically perfect and physically absurd still tells the reader
   the tool does not know its subject.
2. **Declare word forms; derive nothing linguistic.** `verb.replace(/ed$/, '')` gives
   *"How many did Quinn **fil**?"* — wrong on 5 of 10 entries (`moved→mov`, `assembled→assembl`,
   `logged→logg`, irregular `sold`). Pools declare `bare` alongside `verb`.
3. **An explanation may only cite a distractor guaranteed to reach the page.** `h.choices` keeps
   the first `need - 1` DISTINCT distractors and drops the rest, so a distractor listed fifth may
   not exist when the text names it. Order the slate by teaching value and cite from the front.
4. **Never let a rounded value carry a worked step.** `num()` rounds to 2 dp, so an explanation
   printed `1/10 + 1/40 = 0.13` and then `1 / 0.13 = 8 hours` — false arithmetic on a page
   teaching arithmetic. Work in fractions, or in a quantity that is exact by construction.
5. **Write distractors in ONE canonical form so identities are visible.** `ar-average-raise`
   failed 8,000/8,000: two distractors were the same expression written differently, and a third
   expanded to the correct answer. Rewriting them all as `base + <multiple of gap>` made both
   obvious. **A slate is a set — check it as one.**
6. **More degenerate draws a sweep cannot rescue** (the Phase 3 rule, four more instances):
   reference height == its own shadow; a 50/50 population split; a 100-question test; a 50%
   discount. In each the collision holds for EVERY swept value, so `sweep()` silently returns its
   `start` and ships the broken item. Exclude the value from the draw.
7. **The official answer key is a distractor SPEC.** OATTS items ship full solution walkthroughs;
   its wrong options are named error modes and its numbers are deliberately whole. **A distractor
   carrying a decimal among integers is eliminable without doing the problem.**

## 🔴 NEVER write a regex through a shell heredoc

`\b` written through a bash heredoc becomes a literal **0x08 backspace byte**. This has now bitten
this project **four times**, and in Phase 5 it silently disabled a validation guard for an entire
phase — the regex compiled to `/<BS>[A-Z]{2,}<BS>/` and matched nothing while reporting clean.

- Use the **Write or Edit tool** for any file containing a backslash escape.
- Scan before declaring a phase done:
  `LC_ALL=C grep -rn $'[\001-\010\013\014\016-\037]' src/pages/theknowledgebase/afoqt/`
- **Test a new guard against input that should FAIL it.** A guard that has never rejected anything
  is indistinguishable from a dead one.

## 🔴 NEVER truncate a doc to write it, and keep doc scripts re-runnable

`PLAN.md` was reduced to **zero bytes twice** in Phase 7, and it is untracked, so git had
nothing to restore. Both times the cause was the same: a script did `io.open(PLAN, 'w')` and
*then* hit a `UnicodeEncodeError`. Opening for write truncates immediately, so the exception
destroyed the file before writing a byte.

- **Encode first, replace last.** Build the whole string, `.encode('utf-8')` it, write a temp
  file, then `os.replace()`. Never open the target until the new content exists.
- **Never write an emoji as an escape.** `🔴` in a Python literal is a lone surrogate
  pair and UTF-8 cannot encode it. Write the character, or use `\U0001F534`. Better: keep prose
  in a `.md` file written with the Write tool and have the script only splice it.
- **A doc script that edits two files is not re-runnable.** Replaying the recovery re-applied
  the `CLAUDE.md` half and duplicated three whole sections here. Split per file, or make the
  edit idempotent.
- **Recovery exists but is not a plan.** A full `Read` of a file survives in the session
  transcript at `~/.claude/projects/<project>/<session>.jsonl`, and the tool calls that wrote
  each section survive too. That is what rebuilt PLAN.md. `docs/afoqt/` is still untracked —
  committing it is the actual fix.

## One figure per run is a SPAN, not a constant (`sheetSpan`)

`sheet: true` shares one figure across a drill. How many questions that figure can carry differs
per subtest, and getting it wrong is invisible to every structural check:

- **Table Reading**: no `sheetSpan`. A 33×33 grid has 1,089 cells and genuinely serves all 40
  questions, which is what the real test does.
- **Block Counting**: `sheetSpan: 6`. A pile numbers six blocks, and the real test rotates piles
  ("one pile image serves 5-13 numbered questions"). Without it a **30-question exam asked six
  questions and repeated the other 24** — every one of them perfectly well formed.

Two things that go with it: index the item off `h.item` rather than drawing at random (retrying
on collision is coupon-collecting, and it duplicated on some rng seeds but not others), and note
that `assembleDrill` shuffles the queue, so `groupByFigure` keeps one figure's questions
contiguous instead of scattering them across the run.

## Tooling already available (do not re-install or re-derive)

`pdf-parse` v2 (ESM, `new PDFParse({data})` → `.getText({first,last})`) · `jszip` (epub is
a zip) · `react-markdown` + `remark-gfm` · `vitest` · `playwright` · `firebase`.

Existing engine code worth reusing rather than rewriting: `engine/rng.js`
(`mulberry32`, `shuffle`, `weightedSampleWithoutReplacement`), `engine/selection.js`
(`largestRemainderAllocate`), `engine/queue.js` (`reinsertRetry`), `engine/cycle.js`
(active/rest cycler), `engine/dedup.js` (currently dead — wire it up for import dedup).

⚠ `engine/*.selftest.mjs` are plain `node:assert` scripts **not run by `npm test`**. Wire
them into vitest.
