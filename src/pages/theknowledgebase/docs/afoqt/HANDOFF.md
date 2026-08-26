# AFOQT — OUTSIDE-AGENT HANDOFF

**Purpose.** Ship one self-contained work packet to an AI that has never seen this project,
with the smallest possible amount of context-loading burned before it starts producing.

**How it works.** Every farmable piece of remaining work is a numbered **PART**. Trey sends a
zip plus the six-line prompt below with one number in it. The agent reads this file, finds its
part, does exactly that, and hands the files back.

**Trey — before you send a part, check its box below.** A `[x]` means it is already done and
must not be farmed out. Claude ticks these off as it finishes them.

---

## 1. The packet

Zip these three things from the repo root. Nothing else is needed:

```
package.json
scripts/afoqt*.mjs
src/pages/theknowledgebase/
```

**Exclude `src/pages/theknowledgebase/ResearchPics/`** unless the part says otherwise — it is
4.2 MB of screenshots and no authoring part reads it. Without it the packet is about 2.8 MB.

**Research-sourcing files (`quizlet3.md`, `quizlet8.md`, and similar) are a design-phase input,
not a farmed-part input.** A `(Claude)`-tagged design part (8, 9, 14, 19, 24, 27...) is worked
directly with Trey, not zipped to an outside agent, so its source files are just pasted into
that session — same as this one. Once a design part lands, its findings belong in
`RESEARCH.md` and its decisions in `chapters.js` / the engine file / this doc's PART DETAIL, and
that written-down form is what farmed data-row parts read — they should never need the raw

**Verified 2026-08-21: the three QC gates run on bare `node` in that packet with NO
`npm install` and no `node_modules`.** That is the whole reason the packet is this small. If an
agent tells you it needs to install dependencies to run `npm run afoqt:selftest`, it is wrong.

A one-liner to build it (PowerShell, from the repo root):

```powershell
$dst = "$env:TEMP\afoqt-packet"
Remove-Item -Recurse -Force $dst -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$dst\scripts", "$dst\src\pages" | Out-Null
Copy-Item package.json $dst
Copy-Item scripts\afoqt*.mjs "$dst\scripts"
Copy-Item -Recurse src\pages\theknowledgebase "$dst\src\pages"
Remove-Item -Recurse -Force "$dst\src\pages\theknowledgebase\ResearchPics"
Compress-Archive "$dst\*" "$([Environment]::GetFolderPath('Desktop'))\afoqt-packet.zip" -Force
```

⚠ **Do not add `-Exclude ResearchPics` to the `Copy-Item -Recurse` line above.** It looks like
the obvious one-liner and it silently does not work — `Copy-Item`'s `-Exclude` does not reliably
filter a whole subfolder when combined with `-Recurse` on a directory source (a known PowerShell
quirk, confirmed 2026-08-26: it copied `ResearchPics/` in full, including a stray installer `.exe`
sitting in `ResearchPics/instruments/`, and blew the packet up to 253 MB instead of the documented
~2.8 MB). Copy everything, then delete `ResearchPics/` from the destination, as above. Also run
this from the **repo root**, not from inside `src\pages\theknowledgebase` — the paths above are
relative to root and fail silently-into-a-nested-shell if pasted into a `powershell` prompt you
just launched from partway down the tree (the paste can race the new shell's startup and never
actually execute; if a pasted block produces no output and no errors, assume nothing ran).

---

## 2. The prompt — paste this verbatim, change only the number

> Here is a zip of a React project. Everything you need is inside it. Do **not** run
> `npm install` — the checks run on plain node. Do not ask me questions; work from the files.
>
> **You are doing PART #N.**
>
> 1. Unzip it, then read exactly these three files, in this order:
>    - `src/pages/theknowledgebase/docs/afoqt/HANDOFF.md` — find **PART #N** and follow it literally
>    - `src/pages/theknowledgebase/CLAUDE.md`
>    - `src/pages/theknowledgebase/docs/afoqt/QUESTION-DOCTRINE.md`
>
>    Read nothing else until PART #N tells you which files to open. Do not explore the repo.
> 2. Do **only** PART #N, and touch **only** the files it names. Other parts are being worked
>    in parallel; editing anything else will be thrown away.
> 3. Gate your work on the commands in that part's **Verify** block, and iterate until they
>    pass. If a failure names a template id that does not belong to your part, ignore it and
>    say so in your report.
> 4. Reply with: the **full contents** of every file you created or changed, the final output
>    of each verify command, and anything you could not do and why — as a live blocker with
>    what you actually tried, never as a bare "not possible". 
 5. since it might not be clear in #4, After finishing each file, put them INTO the session chat so Trey has them. Don't keep them on disk where they will be lost when usage hits its limits.
 6. Other agents are running in paralellel so if a small section that looks like it's meant to be farmed out is not finished - that's probably normal
>
> Do not commit, do not run git, do not reformat a file you were not asked to touch.

---

## 3. Rules every part obeys (the agent reads these too)

These are not style notes. Each one has cost this project a shipped defect.

1. **Write files with the editor tool, never through a shell heredoc.** A `\b` written through
   a bash heredoc becomes a literal 0x08 byte. It has happened four times here, and once it
   silently disabled a validation guard for an entire phase.
2. **ASCII inside JavaScript string values.** Comments may use an em dash. If a string needs an
   apostrophe, use a `"double-quoted"` string — do not drop the apostrophe and ship
   *"the officers shoes"*. A real person reads this text.
3. **Never ship commercial question text.** This site deploys publicly. The calibration books
   are a ruler, not a corpus. Write your own prose. Only official USAF material may ship
   verbatim.
4. **Iterate at the same difficulty.** `2 + 2` iterates to `3 + 4`, never to `2 x 354`. A band
   is a difficulty, not a bucket to fill — do not put an easy item in band 4 to hit a count.
5. **Distractors are named error modes**, never noise. A wrong option is a mistake somebody
   actually makes. Never pad a short slate with an invented value; fix the item instead.
6. **`afoqt:selftest` proves a question is well-FORMED, never well-WRITTEN.** Every realism
   defect that ever shipped here passed it. Run `npm run afoqt:sample -- --only=<id>` and read
   the output aloud. That is a required step, not a nicety.
7. **Do not derive anything linguistic.** `verb.replace(/ed$/, '')` produced *"How many did
   Quinn fil?"*. Declare word forms; never compute them.
8. **Report a blocker, do not drop scope.** If you cannot do part of it, do everything else in
   full and say precisely what is missing, what you tried, and what would unblock it.
9. **Do not modify the ASVAB deck** (`asvab/`, `asvabQuestions.json`, `asvabSubject.js`). It is
   read-only by owner's rule, no exceptions.
10. **Do not touch `engine/` or `curriculum/chapters.js`** unless your part names the file.
11. **`afoqt:coverage` is ALREADY RED, and not because of you.** A phase declares its chapters
    and concepts before its data rows are farmed, so every `va-*` and `rc-*` concept currently
    reports as an orphan and every one of those chapters reports "cannot fill a drill". That is
    the work board, not a regression. Your part is done when the concepts **your part owns**
    stop being listed — never by deleting a concept from a chapter, inventing a template to
    silence one, or editing the coverage script. `npm run afoqt:selftest` **must** be clean,
    and the orphan list must not gain anything you did not add.
12. **`_reset*()` helpers clear the REAL bank.** `_resetWords`, `_resetMorphology`,
    `_resetRelations` and `_resetPassages` empty the same module-level registries the template
    files filled at import time. A test that resets and then registers a fake row leaves every
    later block in the file running against that fake row — which either explodes somewhere
    unrelated or, far worse, passes vacuously over an empty array. Snapshot the real rows at
    the top of the file and restore them in `afterEach`. `engine/__tests__/words.test.js` does
    this now (`restoreBank`); copy that, and copy the anti-vacuity guards next to it.

---

## 4. What is farmable, and what is not

| Farmable | Not farmable |
|---|---|
| **Data rows** against an existing registrar + validator (`registerWords`, `registerMorphemes`, `registerPairs`, `registerFacts`) | **Template logic** — distractor design, collision sweeps, banding |
| **Lesson markdown** for a chapter whose concepts are already fixed | **Engine work** — anything in `afoqt/engine/` |
| **Test files** against behaviour that already exists | **Curriculum design** — deciding what the chapters ARE |
| Mechanical chores with an objective pass/fail | **Figure/renderer work** — legibility is a judgement, not a test |

The line is: *is there a validator that mechanically rejects a wrong answer?* Where there is,
the work is safe to farm and the QC gate is the trust boundary. Where the failure mode is
invisible to every structural check — a second correct answer, an inverted physical convention,
a figure that renders as a hairline — it stays with Claude.

*(This supersedes the line in `CONTRIBUTING-QUESTIONS.md` saying templates are never farmed
out. Data rows feeding an existing template builder are farmable; the builder itself is not.)*

---

## 5. THE BOARD

`[x]` done — do not farm out. `[ ]` ready to send. `[L]` locked, design has not landed yet.
`[P]` paused, waiting on Trey. `[C]` unlocked but Claude-only — engine or curriculum-design
work per section 4's not-farmable column; do a live session, never zip this one out.

### Phase 9 — Word Knowledge

- [x] **PART 1** — `templates/wk/ch03-affixes.js` — 24 affix rows *(done 2026-08-21)*
- [x] **PART 2** — `templates/wk/ch06-change-degree.js` — 60 word rows *(done 2026-08-21)*
- [x] **PART 3** — `templates/wk/ch02-roots.js` — 30 roots *(done 2026-08-21)*
- [x] **PART 4** — `templates/wk/ch04-confusables.js` — 28 pairs *(done 2026-08-21)*
- [x] **PART 5** — WK lessons, chapters 1-3
- [x] **PART 6** — WK lessons, chapters 4-6
- [x] **PART 7** — WK test suite *(returned 154 tests, 23 of them failing on arrival; repaired
  2026-08-24. Four fixtures were written against an imagined registrar — a word row needs all
  five slate options before it reaches the guard under test, and a blank `answer` trips the
  earlier word/answer/gloss guard, never the empty-option one. The rest was the `_reset*`
  clobber now written up as rule 12 in section 3. Two "every pair row …" invariants had been
  iterating an empty array and reporting green; they have anti-vacuity guards now.)*

### Phase 10 — Verbal Analogies

- [x] **PART 8** — VA research + curriculum design *(Claude, done 2026-08-22 — 5 chapters,
  10 concepts, in `curriculum/chapters.js` under the new `analogies` track. See "PART 8 —
  design record" below for what was decided and why. Part/Part and Sequence, two of the
  official 10 relation concepts, were originally left undeclared — no real example turned up
  in the 75-item sample — then added 2026-08-23 once `afoqt/data/realQuestions.json` (official
  OATTS items, already in the repo) turned up one of each. See the REOPENED note in the design
  record below.)*
- [x] **PART 9** — `engine/analogy.js` relation engine *(Claude, done 2026-08-23 — see "PART 9
  design record" below)*
- [x] **PART 10** — `templates/va/ch02-structure.js` — part-whole + member-category rows (~24)
  *(Claude, done 2026-08-26 — 24 rows, 8/band at bands 2/3/4, split 4 part-whole + 4
  member-category per band. One real defect found only by the selftest, not by inspection:
  BRANCH/TREE and OAK/TREE shared the bare b-word "tree", and the `-term` frame's
  reused-base-word distractor collapsed onto a crossPool candidate's bare word, producing a
  4-choice slate on ~40% of draws. Fixed by swapping BRANCH/TREE for RUNG/LADDER — no two rows
  in the same band now share a b-word. `afoqt:selftest -- --samples=8000` and `afoqt:coverage`
  clean; `va-part-whole`/`va-member-category` off the orphan list; `va-part-part`/`va-sequence`
  correctly still orphaned, PART 10B's job.)*
- [x] **PART 10B** — same file, appended — part-part + sequence rows (~12) *(Claude, done
  2026-08-26 — 12 rows, 3+3 at bands 2/3, none at band 4 per the sourcing note. Every part-part
  row sets `symmetric: true` even though the engine's own JSDoc says that flag is "true only for
  synonym/antonym" — without it, the reversed-pair distractor (e.g. VENUS:MERCURY for a
  MERCURY:VENUS base) is a genuine second correct answer for a swappable relation, and
  `afoqt:selftest` cannot catch it since the reversed string is structurally distinct. Verified
  by sampling: the reversed pair no longer appears in the choice list. New `va-02b-b{2,3}`
  templates registered under a fresh idBase per PART 9's warning about colliding ids.
  `afoqt:selftest -- --samples=8000` clean, `afoqt:coverage` shows zero remaining `va-02-structure`
  orphans.)*
- [x] **PART 10C** — `templates/va/ch03-cause-consequence.js` — cause-effect + action-object rows (~24)
  *(Claude, done 2026-08-26 — 24 rows, 4+4 per band at bands 2/3/4. Deliberately avoided
  self-referential action-object pairs like ARBITRATE/ARBITRATOR — a shared root makes the
  answer derivable from spelling alone, not from the relation. `afoqt:selftest -- --samples=8000`
  clean on first pass (no b-word collisions this time), `afoqt:coverage` clears
  `va-cause-effect`/`va-action-object`.)*
- [x] **PART 11** — `templates/va/ch04-meaning-degree.js` — synonym + antonym + degree rows (~30)
  *(Claude, done 2026-08-26 — 30 rows, 5 synonym + 2 antonym + 3 degree per band at 2/3/4. Six
  words collided with the WK bank's own band for that word (`candid`, `diligent`, `ample`,
  `frugal`, `garrulous`, `obstinate`, `austere` — WK's confusables/vocab chapters already cover
  a lot of this exact register) and were swapped for a same-meaning word at the WK-agreeing band
  instead of forcing a mismatch. Also hit the cross-chapter version of PART 10's b-word collision
  bug — `WARM:HOT` (degree) shared "hot" with `HOT:COLD` (antonym) at band 2, and since
  `crossPool` draws from the WHOLE VA bank at a given band (not just the current chapter), this
  bug is bank-wide, not file-local. Wrote a one-off collision scanner (checked into no file, just
  run and discarded) that walks every row's a/b words against every OTHER row's b-word in the
  same band — confirmed zero remaining collisions across all three VA chapters combined.
  Confirmed by sampling: a symmetric row's `-pair` question never offers the reversed pair as a
  distractor; an asymmetric degree row's `-term` question correctly DOES offer the reversed word
  as a distractor (a real error mode, not a bug). `afoqt:selftest -- --samples=8000` clean,
  `afoqt:coverage` clears `va-synonym`/`va-antonym`/`va-degree`.)*
- [x] **PART 11B** — `templates/va/ch05-defining-traits.js` — object-attribute rows (~24)
  *(Claude, done 2026-08-26 — 24 rows, 8/band, mixing the classic and worker-domain readings
  under one `relation: 'object-attribute'` tag on purpose, so buildMatch treats both readings as
  valid same-relation partners rather than mistakenly opposing them. Zero WK-band or b-word
  collisions this time (a preflight scan was run before touching selftest at all, once the same
  bug class had bitten two parts in a row). `afoqt:selftest -- --samples=8000` clean,
  `afoqt:coverage` clears `va-object-attribute`. This closes out the whole VA data block —
  PARTS 12 (lessons) and 13 (test suite) are next.)*
- [x] **PART 12** — VA lessons, all five chapters *(Claude, done 2026-08-26 — five files in
  `curriculum/chapters/va/`, registered in `curriculum/lessons.js`. Every worked example pulled
  from actual registered rows in PARTS 10-11B so the lesson and the questions cannot drift.
  `afoqt:coverage` unaffected as expected (it checks chapters.js concepts, not lesson prose) and
  `npm run build` clean — the `?raw` markdown imports resolve. No raw HTML tags in any of the
  five files.)*
- [x] **PART 13** — VA test suite *(Claude, done 2026-08-26 — `engine/__tests__/analogy.test.js`,
  87 tests, modeled on `words.test.js`'s restoreBank/anti-vacuity pattern. Two real setup bugs
  caught while writing it, both worth noting: (1) `relationTemplates` returns early below its
  5-row floor, so the confusion-existence-check test needed 5 fixture rows before the code under
  test was ever reached — a 1-row fixture made the test pass for the wrong reason (never running
  the throw at all). (2) The band-mismatch fixture originally used "historic", which is real WK
  content but registered via `registerPairs` (morphology.js), not `registerWords` (words.js) —
  `wordBand()` only reads `allWords()`, so it silently returned null and the test failed. Switched
  to "gregarious", a genuine `words.js` entry. Also verified directly (not just asserted) that a
  symmetric row's `-pair` template never offers the reversed base pair across 500 seeds, and that
  an asymmetric row's DOES. This closes out PARTS 10-13 — the entire VA data + lesson + test
  block. `npx vitest run` on the file: 87/87 passing. `npm run build` clean.)*

### Phase 11 — Reading Comprehension

- [x] **PART 14** — RC design + passage engine *(Claude — the "PART 14 review, 2026-08-24"
  below records three defects found after the fact; all three are RESOLVED as of 2026-08-24,
  see "PART 14 fix record" below. PARTS 15/16 are unblocked.)*
- [x] **PART 15** — RC passages, set A (bands 2 & 3, ~12 passages) *(Claude, done 2026-08-26 — 12
  PME/Joint-Force-register passages (6 band 2, 6 band 3), 6 questions each, `templates/rc/ch01-
  passages-set-A.js`. Two real defects found only by running the actual QC gates, not by reading:
  (1) A sheet-lock bug — a passage with exactly 1 eligible question for a pooled concept pair
  (main-idea+author-agreement) gets that ONE item every time (`inSheetPassage[h.item % 1]`), so
  the fallback to the full cross-passage pool never triggers as long as the count stays above
  zero. 6 of 12 passages had 1 main-idea + 0 author-agreement, collapsing `rc-main-idea-b{2,3}`
  to 2-3 distinct stems against a declared stemSpace of 12. Fixed by adding an author-agreement
  question to each of those 6 passages, matching the doctrine's own "2+ questions of 3+ types"
  guidance I'd under-applied on the first pass. (2) Even after that fix, the SAME check still
  failed — because I'd reused identical boilerplate stem wording ("Which choice best states the
  main idea of the passage?", "The author of this passage would most likely agree that:") across
  most passages, which the registrar's per-passage duplicate-stem check cannot catch (it's scoped
  to one passage) but the audit's distinct-stem count catches immediately. Varied the wording
  across 6 rotating phrasings each for main-idea and author-agreement. Also wrote a standalone
  verification script (not committed) that checks every vocabulary-in-context "line N" reference
  against the actual `text.split('\n')` output — paragraph-break blank lines get numbered too,
  which silently shifted several hand-counted references off by 1-5 lines; 15 of the original
  references were wrong and are now script-verified correct. `afoqt:selftest -- --samples=8000`
  clean, `afoqt:coverage` clears all seven RC concepts (concept-level, not band-level — PART 16
  adds bands 4-5 for content depth, not to clear further orphans). `npm run build` clean.)*
- [x] **PART 16** — RC passages, set B (bands 4 & 5, ~12 passages) *(Claude, done 2026-08-26 —
  12 passages (6 band 4, 6 band 5), same 6-question layout (main-idea x1, author-agreement x1,
  detail-inference x1, function-of-paragraph x1, vocabulary-in-context x2) designed from the start
  to satisfy both pooled-concept sheet-lock floors PART 15 discovered the hard way, plus stem
  wording rotated through 6 variants from the start rather than fixed after the fact. Two new
  defect classes turned up anyway: (1) declared `wordCount` values were hand-estimated and wrong
  for every one of the 12 passages (off by 55-140 words in a few cases) — replaced with an actual
  word count computed by evaluating each line array. (2) A compound term due for a vocabulary
  question ("free-riding", "mirror-imaging") occasionally landed split across a line break by the
  natural ~14-word wrap, so "line N" pointed at only half the word — a plain substring check on
  `text.split('\n')[N-1]` catches this immediately; fixed by reflowing the line break so the whole
  term stays on one line. `afoqt:selftest -- --samples=8000` clean on the real run (no failures at
  all, unlike PART 15's first pass), `afoqt:coverage` clears every `rc-*` concept.
  ⚠ **Live blocker, flagged not fixed:** `afoqt:coverage` now also reports (separately from the
  concept-orphan list, under "chapter cannot fill a drill") that `rc-02-main-idea`, `rc-03-details`
  and `rc-04-vocabulary` each have "only 3 templates inside bands [2, 3, 4] - a 5-question test-out
  gate would repeat itself." This is NOT fixable by writing more passage content: `passageTemplates()`
  registers exactly ONE template per (chapter, band) by design (its own docstring says so), so RC
  structurally tops out at 3 templates per chapter (one per declared band) no matter how much is
  written, unlike TR (6 templates across bands 1-4, via genuinely different template flavors -
  anchor/near/far/tight lookup, axis-read - not just one per band) or WK/VA (multiple frames per
  band). I checked whether this is pre-existing rather than something PART 15/16 caused: the
  generic check counts TEMPLATES, not distinct QUESTIONS, so it can't see that a single RC
  template's `stemSpace` already covers many non-repeating questions - it's very likely this same
  warning already fired after PART 15 too (bands 2-3 alone would have shown "only 2"), just outside
  what I happened to grep for that session. Fixing it for real needs either redesigning
  `passageTemplates()` to register more than one template per band (curriculum/engine work,
  explicitly Claude-only per section 4) or reconsidering RC's `testOutPass` gate logic - I did not
  attempt either mid-PART-16, since both are outside what "write bands 4-5 passages" was scoped to
  do and a rushed engine change here risks exactly the kind of invisible defect this project's own
  doctrine warns about. Flagging for whoever picks up PART 17/18 or a future RC engine pass, per
  section 3 rule 8 - not silently dropped, not silently patched. `npm run build` clean.)*
- [x] **PART 17** — RC lessons *(Claude, done 2026-08-26 — four files in `curriculum/chapters/rc/`,
  registered in `curriculum/lessons.js`. Every worked example pulled from the actual passages
  registered in PARTS 15/16 so the lesson and the drills cannot drift. `npm run build` clean (the
  `?raw` markdown imports resolve), no raw HTML tags in any of the four files.)*
- [x] **PART 18** — RC test suite *(Claude, done 2026-08-26 — `engine/__tests__/passage.test.js`,
  50 tests: validator rejection, bank invariants (including a check that every
  vocabulary-in-context "line N" reference actually points at a line containing the quoted word -
  the exact defect class PARTS 15/16 kept catching by hand), determinism, a sheet-mode check that
  consecutive items in one sheet block land on the same passage, and slate integrity. All 50 pass.
  Ran the FULL `npx vitest run` afterward as a sanity check (not just the new file) - confirmed
  the pre-existing `curriculum.test.js` failures (17 of them: 15 "orphan concepts"/no-lesson for
  the un-farmed PS/SJT chapters, plus the RC test-out-gate check flagged in PART 16's record) are
  unrelated to this part's own work, not a regression it introduced. This closes out the entire
  RC block - PARTS 15-18.)*

### Phase 12 — Physical Science

- [x] **PART 19** — PS curriculum design *(Claude, done 2026-08-25 — 8 chapters, 30 concepts,
  in `curriculum/chapters.js` under the new `science` track. See "PART 19 design record" below.
  Supersedes the placeholder split below this line ("mechanics, forces, energy" / "matter,
  chemistry, earth and space") — that guess did not match the real OATTS taxonomy once checked.)*
- [x] **PART 20** — `templates/ps/ch01-astronomy.js`, `ch02-atomic-physics.js` — fact rows
  *(Claude, done 2026-08-26 — 36 facts each (9/concept across 4 concepts, 3/concept/band),
  grounded in oatts-PS-045 through oatts-PS-050. One authoring slip caught before selftest ever
  ran: two confusions pointed at ids I'd typo'd with a "-ref" suffix that didn't exist anywhere
  in the file (`ps-planet-ref`, `ps-meteoroid-ref`) — fixed to the real ids before first run, so
  `factTemplates`'s confusion-existence check never actually got to fire on it.
  `afoqt:selftest -- --samples=8000` clean on the real run, `afoqt:coverage` clears all 8
  concepts across both chapters. `npm run build` clean.)*
- [x] **PART 20B** — `templates/ps/ch03-chemistry.js`, `ch04-electrical.js` — fact rows
  *(Claude, done 2026-08-26 — 36 facts each (9/concept), grounded in oatts-PS-051 through
  oatts-PS-056. `afoqt:selftest -- --samples=8000` clean on the first real run, `afoqt:coverage`
  clears all 8 concepts. `npm run build` clean.)*
- [x] **PART 21** — `templates/ps/ch05-light.js`, `ch06-mechanics.js` — fact rows *(Claude, done
  2026-08-26 — 36 facts each, grounded in oatts-PS-057 through oatts-PS-062. Caught before writing
  a single mechanics row: `ps-06-mechanics` is declared `bands: [1, 2, 3]` in chapters.js, not
  `[2, 3, 4]` like every other PS chapter — it's the from-zero entry chapter, same role av-01/02
  play for Aviation Information — so `ch06-mechanics.js` targets bands 1/2/3, not the generic
  2/3/4 the brief's prose suggested; following the brief text instead of the chapter's actual
  declaration would have put nine facts outside any reachable band. Every mechanics row was also
  checked against the PART 19 warning about `av-02-forces` overlap and written from a general,
  non-aviation angle (blocks, ramps, a tug-of-war). `afoqt:selftest -- --samples=8000` clean,
  `afoqt:coverage` clears all 8 concepts. `npm run build` clean.)*
- [ ] **PART 21B** — `templates/ps/ch07-sound.js`, `ch08-thermodynamics.js` — fact rows
- [ ] **PART 22** — PS lessons, all 8 chapters
- [ ] **PART 23** — PS test suite

### Phase 13 — Situational Judgment + Self-Description Inventory

- [x] **PART 24** — SJT design + engine *(Claude, done 2026-08-26 — curriculum design (6 competency
  chapters + a method chapter, 15 concepts, `judgment` track) AND a new engine, `engine/judgment.js`
  — SJT's format doesn't fit the fact engine or the analogy engine, so this one phase needed both
  halves of section 4's not-farmable column at once, the same way VA needed Parts 8 AND 9. See
  "PART 24 design record" below. PARTS 25/25B/25C (scenario rows), 25D (lessons) and 25E (test
  suite) are now unblocked.)*
- [ ] **PART 25** — `templates/sjt/ch02-integrity-professionalism.js`, `ch03-leadership.js` — scenario rows *(unblocked 2026-08-26)*
- [ ] **PART 25B** — `templates/sjt/ch04-resource-management.js`, `ch05-communication.js` — scenario rows *(unblocked 2026-08-26)*
- [ ] **PART 25C** — `templates/sjt/ch06-innovation.js`, `ch07-mentoring.js` — scenario rows *(unblocked 2026-08-26; ch06 has real sourcing gaps, read its brief before starting)*
- [ ] **PART 25D** — SJT lessons, all 7 chapters *(unblocked 2026-08-26)*
- [ ] **PART 25E** — SJT test suite *(unblocked 2026-08-26)*
- [x] **PART 26** — SDI *(decided 2026-08-26, Trey: do NOT build as an interactive tool. It is a
  240-item personality inventory with no right/wrong answers and zero composite weight — there is
  nothing to drill or master. Document its existence/format only, so test day isn't a surprise; see
  the SDI note in "PART 24 design record" below. This is a resolved product-scope decision, not
  open work — do not farm it out and do not reopen it without Trey raising it again.)*

### Phase 14 — Exam simulator, scoring, dashboard

- [x] **PART 27** — composite scoring engine *(Claude, done 2026-08-26 — see "PART 27 design
  record" below. ⚠ Read it before touching `engine/scoring.js` or the Composites section of
  `AfoqtDashboard.jsx`: the real AFOQT percentile cannot be computed (norm tables are
  unpublished, confirmed in `docs/afoqt/RESEARCH.md`), so this deliberately computes and
  clearly labels a PRACTICE ACCURACY number instead, never presented on the same visual scale
  as a composite's official percentile minimum.)*
- [L] **PART 28** — full-length Form T exam runner *(Claude)*
- [L] **PART 29** — diagnostic + dashboard
- [L] **PART 30** — results and analytics

### Standing chores

- [ ] **PART 31** — wire `afoqt/engine/*.selftest.mjs` into vitest
- [ ] **PART 32** — delete the dead `ingestion/` folder
- [x] **PART 33** — Math Knowledge band-5 `stretch` templates *(Claude, done 2026-08-25 — Trey
  said yes. 3 templates seeded: `mk-factor-sum-diff-cubes` (ch06), `mk-complete-the-square`
  (ch07), `mk-space-diagonal` (ch11, Trey's named weakest area). All three are genuinely
  different skills from anything at bands 1-4 in the same chapter, not wider parameter ranges -
  see each file's own comment for why. Also wired the FIRST-EVER UI path to reach `stretch`
  content at all: `DrillConfig.jsx` gets a "Depth" section with an off-by-default toggle
  (only shown when the selected subtest actually has stretch templates), forces untimed the
  moment it's on, and is mutually exclusive with exam mode both directions. Until this session
  `includeStretch` had no caller passing `true` anywhere in the app, so band 5 was unreachable
  even after content existed for it - Aviation Information Part 5's caveat about
  correctness-vs-reachability applies here too. **This is a seed, not full coverage** - the
  other 10 MK chapters have no band-5 tier yet. `npm run afoqt:selftest -- --samples=8000`,
  `npm run afoqt:coverage` and `npx vitest run` all clean; `npm run build` clean. See PLAN.md's
  2026-08-25 session note for the templates' design reasoning and one real defect the
  read-aloud step caught (an inverted sign in a hand-typed explanation string, not in any
  answer or choice).)*

---

## 6. PART DETAIL

Only unlocked parts carry detail. A locked part gets its brief when its phase is designed —
farming one out before then means the agent invents the curriculum, which is exactly the
failure that polluted the old ASVAB deck.

---

### PART 1 — `templates/wk/ch03-affixes.js`

24 morpheme rows (8 per band at bands 2, 3, 4) covering `wk-prefix-negation`,
`wk-prefix-direction-degree` and `wk-suffix-wordclass`. Model file: `ch02-roots.js`. Contract:
`engine/morphology.js` → `registerMorphemes`.

**Verify:** `npm run afoqt:selftest` clean for `wk-03-*`; `npm run afoqt:coverage` no longer
lists those three concepts as orphans; sample and read both frames.

---

### PART 2 — `templates/wk/ch06-change-degree.js`

60 word rows (20 per band at bands 2, 3, 4) covering `wk-vocab-change`, `wk-vocab-magnitude`
and `wk-vocab-judgment`. Model file: `ch05-people-speech.js` — same shape, same care, 60 rows.
Contract: `engine/words.js` → `registerWords`.

**Verify:** `npm run afoqt:selftest` clean for `wk-06-*`, `wk-connotation-*` and
`wk-opposite-*`; coverage clean for those three concepts; sample and read 20 questions.

---

### PART 3 — `templates/wk/ch02-roots.js`, 6 roots to 30

**Read first:** `templates/wk/ch02-roots.js` (the whole file — it is 84 lines and its header is
your authoring contract) and `engine/morphology.js` (`registerMorphemes`, `morphDistractors`,
`morphemeTemplates`).

**Do:** keep all six existing rows exactly as they are. Add 24 more so the chapter holds
**10 roots at band 2, 10 at band 3, 10 at band 4**. The six that exist are all band 3, so
band 2 and band 4 currently generate zero questions — `morphemeTemplates` returns nothing for a
band with fewer than 5 rows, which is why `afoqt:coverage` currently reports
*"wk-02-roots: only 2 templates inside bands [2, 3, 4]"*.

Concepts are `'wk-latin-roots'` and `'wk-greek-roots'` — nothing else, and both must appear in
every band. Band 2 = a root an educated adult already half-knows (`port-`, `dict-`, `spec-`,
`aud-`, `scrib-`). Band 3 = standard test level (`loqu-`, `curs-`, `chron-`, `anthrop-`,
`ped-`, `sequ-`). Band 4 = the hard end (`vinc-`, `pug-`, `lucid-`, `sanct-`, `tempor-`,
`somn-`, `verd-`, `xen-`, `phon-`, `path-`).

**Constraints that fail the QC run:**
- Every `examples` word must **visibly contain the form**. The validator strips hyphens from
  `form` and requires the word to contain its first `max(3, len - 1)` characters.
- **At least two examples per row**, three where all three are common words.
- **Every `sense` string must be unique within its band** — the `-mean` frame builds its
  distractors from other rows' `sense`, so a duplicate deduplicates the slate down to four
  options and the selftest fails.
- **Every example word must be unique across the whole file** — the `-apply` frame's correct
  answer is a random example of the drawn row and its distractors are other rows'
  `examples[0].word`, so a repeat can collide with itself.
- `confusions` may only name ids **in this same chapter**, and both directions should be
  declared. Good candidates: `spec-`/`spic-`, `ped-` (foot) vs `ped-` (child) — put those two
  in one row or in different bands, never as two rows with the same form.
- A `sense` becomes an answer option, so phrase it as a phrase, not a sentence, and never in
  shouting capitals.

**Verify (from the packet root):**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=wk-02-b2-mean
npm run afoqt:sample -- --only=wk-02-b4-apply
```
Coverage must stop reporting `wk-02-roots: only 2 templates`. Read the sampled questions aloud
and fix anything that reads wrong even though it passed.

---

### PART 4 — `templates/wk/ch04-confusables.js`, 6 pairs to 27

**Read first:** `templates/wk/ch04-confusables.js` (65 lines, header is the contract) and
`engine/morphology.js` (`registerPairs`, `pairTemplates`).

**Do:** keep all six existing pairs. Add 21 more so the chapter holds roughly **8 pairs at
band 2, 11 at band 3, 8 at band 4**. Concept is `'wk-confusable-pairs'` for every row.

**The part-of-speech arithmetic — this is the whole difficulty of this part.** `pairTemplates`
builds its distractor glosses only from halves that share the headword's `pos`, **within the
same band**. A headword needs its mate plus **three more same-pos glosses from other pairs in
its band**, or the slate comes up short and the selftest fails. That is exactly why
`wk-04-b3-define` fails today: only three verb halves exist in band 3.

So, per band:
- if any pair has an **adj** half, at least **three other pairs** in that band must contain an
  adj half;
- same for **verb**, same for **noun**.

The safe recipe is to keep each band to two or three parts of speech and give each of them at
least four pairs. Band 2 might be 5 adj pairs + 4 verb pairs; band 3 might be 5 adj + 3 verb +
3 noun (which is what lets `principal`/`principle` stay, since its noun half then has five
other noun glosses to draw from). **A single lonely noun pair in a band silently breaks that
band.** Count them before you write.

**Other constraints:**
- `a.gloss` and `b.gloss` must genuinely differ, or no question can distinguish the halves.
- `tell` is required and is shown after a miss. It must be a **memory hook**, not a restatement
  of the two definitions. *"Prodigal squanders; prodigious impresses. Only one of them is a
  compliment."* is the standard to hit.
- `pos` sits on each **half**, not on the pair — for several of the best pairs the parts of
  speech are exactly what differ.
- The pair must be one people **actually** mix up. Do not invent a pair to hit a count.
- Do not reuse a headword already in `ch05-people-speech.js`.

Candidates worth using: affect/effect, elicit/illicit, allusion/illusion, adverse/averse,
complement/compliment, council/counsel, ingenious/ingenuous, credible/credulous,
disinterested/uninterested, historic/historical, imply/infer, precede/proceed,
persecute/prosecute, venal/venial, martial/marital, moral/morale, canvas/canvass,
appraise/apprise, ambiguous/ambivalent, tortuous/torturous, fortuitous/fortunate,
proscribe/prescribe, deprecate/depreciate, luxurious/luxuriant, judicial/judicious,
economic/economical, continual/continuous.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=wk-04-b3-define
npm run afoqt:sample -- --only=wk-04-b2-pick
```
`wk-04-b3-define` and `wk-04-b3-pick` must go from failing to clean, and coverage must stop
reporting `wk-04-confusables: only 2 templates`.

---

### PART 5 — WK lessons, chapters 1-3

**Read first:** an existing lesson as the model — `curriculum/chapters/ar/ch01-translation.md`
— plus the three chapter definitions in `curriculum/chapters.js` (search for `wk-01-method`),
`curriculum/lessons.js`, and the header comments of `templates/wk/ch01-method.js`,
`ch02-roots.js` and `ch03-affixes.js`.

**Do:** create three files in a new folder `curriculum/chapters/wk/`, named for their chapters:
`ch01-method.md`, `ch02-roots.md`, `ch03-affixes.md`. Match the existing lessons' voice,
structure and length — they are rendered with `react-markdown` + `remark-gfm`, so GFM tables
are available.

**Then register them.** A lesson file that is not imported renders as a blank chapter and
nothing fails. In `curriculum/lessons.js`, add a `?raw` import for each new file next to the
existing ones and a `'wk-01-method': wk01,` style entry in the `LESSONS` map, keyed by the
chapter id from `chapters.js`. That file is the one exception to "touch only the files your
part names".

**The binding rule is Doctrine rule 2, in both directions:**
- every concept the chapter declares in `chapters.js` must be **taught** in its lesson;
- the lesson must **not** teach anything no template tests.

Concepts: ch01 `wk-connotation`, `wk-antonym-trap`. ch02 `wk-latin-roots`, `wk-greek-roots`.
ch03 `wk-prefix-negation`, `wk-prefix-direction-degree`, `wk-suffix-wordclass`.

Chapter 1 is about the clock: 25 questions in 5 minutes is 12.0 seconds each, which is not
enough time to retrieve a definition, weigh five options and commit — so the subtest rewards
partial knowledge used well. Connotation is available in about a second. The reversed stem
("most nearly OPPOSITE") puts the correct meaning on the page as a trap.

Do not invent statistics, and do not cite a source you have not read in this packet.

**Verify:**
```
npm run afoqt:coverage
```
No orphan concepts for `wk-01-method`, `wk-02-roots` or `wk-03-affixes`. Then confirm the
markdown renders as plain markdown (no raw HTML, no unclosed fences) and that every heading
level is consistent with the model lesson.

---

### PART 6 — WK lessons, chapters 4-6

Same as PART 5 — including the `curriculum/lessons.js` registration — for
`curriculum/chapters/wk/ch04-confusables.md`, `ch05-people-speech.md` and
`ch06-change-degree.md`.

Concepts: ch04 `wk-confusable-pairs`. ch05 `wk-vocab-character`, `wk-vocab-speech`.
ch06 `wk-vocab-change`, `wk-vocab-magnitude`, `wk-vocab-judgment`.

Chapters 5 and 6 are vocabulary chapters holding 60 rows each, so their lessons are a **method
plus a reference table**, not sixty definitions in prose — the table is the study surface, and
the prose explains how to use it (charge first, then word parts, then the confusable). Pull the
words from the template files themselves so the lesson and the questions cannot drift.

Chapter 4 is the highest-yield chapter in the subtest: every one of the ten official OATTS Word
Knowledge items names a confusable pair in its own worked solution, and a candidate who has a
pair backwards is *confidently* wrong. That is why its test-out gate is 5/5 rather than 4/5.

**Verify:** `npm run afoqt:coverage` — no orphan concepts for those three chapters.

---

### PART 7 — WK test suite

**Read first:** `engine/__tests__/arithmetic.test.js` as the model (it is the most recent and
the most thorough), plus `engine/words.js` and `engine/morphology.js`.

**Do:** create `engine/__tests__/words.test.js`. Vitest, `node` environment (do **not** add the
jsdom docblock — there is nothing to render). Cover:

1. **Validator rejection.** Each `throw` in `registerWords`, `registerMorphemes` and
   `registerPairs` gets a test that feeds it input which **should** fail and asserts it does.
   A guard that has never rejected anything is indistinguishable from a dead one. Use
   `_resetWords()` / `_resetMorphology()` between cases.
2. **`looksLikeHeadword`** — true for `arduous`/`arduousness` and `gregarious`/`gregariousness`,
   false for `arduous`/`ardent` (a real confusable pair sharing only three characters).
3. **`suffixPos`** — the `-ly` adjective exception (`unruly` is an adj, `quickly` is an adv) and
   the `COMMON_VERBS` outlier catch (`ponder` reads as a verb).
4. **Bank invariants**, asserted over the real registered rows rather than fixtures: every
   headword unique across the whole bank; every row's `concepts` declared by its chapter in
   `chapters.js`; every `sentence` contains its headword; every `confusable.word` differs from
   its headword.
5. **Determinism**: `generateInstance(id, seed)` twice gives a byte-identical question.
6. **Slate integrity** over every `wk-*` template at a few hundred seeds: five distinct
   options, `correctIndex` in range, and no option equal to the correct answer's text.

Do not weaken an assertion to make it pass. If a test finds a real defect in the bank, **leave
the test failing and report it** — that is the test working.

**Verify:**
```
npx vitest run src/pages/theknowledgebase/afoqt/engine/__tests__/words.test.js
```
This part is the one exception to the no-install rule: vitest needs `node_modules`. If the
packet has none, run `npm install` for this part only, and say so in your report.

---

### PART 8 — design record (done 2026-08-22, Claude + Trey, live session)

Not farmed, so no Verify block — this is a record of what was decided, for whoever picks up
PART 9. Full sourcing is in `RESEARCH.md` → "VA SOURCING".

**5 chapters, 10 concepts, in `curriculum/chapters.js` under the new `analogies` track**
(`va-01-method` through `va-05-defining-traits`), grouping the 10 official AF relation concepts
by real-item frequency rather than 1:1 — same approach WK used. `node --check` and an id/dupe
scan both passed; `npm run afoqt:coverage` will still fail until PART 9 exists, since no
template tests these concepts yet — that failure is expected and is not a regression.

**Deliberately left undeclared, then reopened:** Part/Part and Sequence, two of the 10 official
concepts, had no clean example in the 75-item sample (`quizlet3.md` + `quizlet8.md`) as of
2026-08-22. Do not add a concept from memory or general AFOQT knowledge — that is the
invented-curriculum failure section 4 exists to block.

**REOPENED 2026-08-23:** `afoqt/data/realQuestions.json` — official OATTS items already
committed to the repo, `provenance.kind: 'real'`, a stronger source than the quizlet dumps this
design was originally built from — contains one clean example of each: `oatts-VA-070` (Venus is
to Saturn as Plane is to Bus) is labelled Part/Part in its own official explanation, and
`oatts-VA-072` (Prototype is to Product as Blueprint is to Building) is labelled Sequence. Both
concepts are now declared on `va-02-structure` in `curriculum/chapters.js` alongside Part/Whole
and Member/Category. This is the exact condition this record set for reopening the decision —
do not treat it as license to add further concepts without an equally real, sourced trigger.

**Folded in, not invented:** ~6/75 real items follow a "worker to workplace" pattern
(beautician/salon, cardiologist/heart) that matches none of the 10 official concepts cleanly.
Folded into `va-object-attribute` (chapter 5) as a variant reading of Object/Attribute rather
than declared as an 11th concept.

**Band strategy:** difficulty is assigned by vocabulary rarity of the pair, not by relation-type
complexity — real items show band separation tracks word rarity (e.g. a common-word pair reads
easy regardless of relation type; a low-frequency-word pair reads hard regardless of relation
type). This is why PART 9 should take a dependency on `engine/words.js`'s existing band data
rather than build a second one.

**Format weighting for PART 9:** real items split roughly 3:1 in favor of format 2 ("pick the
whole matching pair") over format 1 ("complete the 4th term"). Build format 2 as the primary
frame.

---

### PART 9 — design record (done 2026-08-23, Claude + Trey, live session)

Not farmed. Engine work per section 4's not-farmable column. This is the record for whoever
picks up PART 10.

**What was built:** `afoqt/engine/analogy.js` — the relation-pair registry and its two question
frames. Exports: `registerRelations`, `allRelations`, `relationsFor`, `wordBand`,
`relationTemplates`, `_resetRelations`.

**The registrar contract (what PART 10/10B/10C/11/11B rows must satisfy):**
Every row passed to `registerRelations` needs:
- `id` — unique across the whole bank; suggested prefix `va-` then a short slug
- `chapter` — one of `va-02-structure`, `va-03-cause-consequence`, `va-04-meaning-degree`,
  `va-05-defining-traits`
- `concepts` — must be declared by that chapter in `curriculum/chapters.js`
- `band` — integer 1-5; vocabulary rarity, NOT relation complexity
- `relation` — short internal tag, e.g. `'part-whole'`, `'cause-effect'`, `'synonym'`. Used to
  pool same-relation candidates across the whole bank; distinct from `concepts`
- `symmetric` — `true` only for synonym/antonym (swapping a/b leaves the relation unchanged);
  omit or set `false` for everything else
- `a`, `b` — each with `word` (string) and `pos` (`'adj'|'noun'|'verb'|'adv'`), plus optional
  `gloss` (shown in explanation only; omit if the word already has a WK bank entry)
- `tell` — one sentence naming the relation, shown after a miss; same job as `tell` on a
  confusable pair
- `confusions` — optional array of OTHER row ids that are a genuine "looks similar but
  different relation" trap; cross-chapter ids are allowed and preferred over blind draws

**Validators that throw (registrar rejects the whole batch on any violation):**
- missing id, duplicate id
- `a.word === b.word`
- duplicate pair in either order already in the bank
- `band` out of range
- `pos` not in `{adj, noun, verb, adv}`
- band mismatch with the WK bank: if either word exists in `engine/words.js`, this row's band
  must agree — two subtests cannot disagree about the same word's rarity
- `confusions` entry that names an id not (yet) registered

**Template builder:** `relationTemplates({ chapter, band, idBase, name, calibratedAgainst })`
produces two registered templates per `chapter+band` combination that has at least 5 rows:
- `${idBase}-pair` — FORMAT 2, primary: `"WORD is to WORD as:"` — pick the matching pair
- `${idBase}-term` — FORMAT 1, secondary: `"A is to B as C is to:"` — complete the fourth term

Both templates fail gracefully (return `null`) if the bank at that band has no partner row
sharing the base row's `relation` tag — which is why every relation type needs **at least two
rows at each band where it appears**.

**`wordBand(word)`** is exported so a PART 10/10B/10C/11/11B author can verify a word's WK band
before assigning this row's band. Use it; do not guess.

**va-01-method has no templates of its own** — every format-2 instance exercises
`va-relation-format` and `va-relation-discriminators` directly, so both concepts are tagged on
every template produced by `relationTemplates`. There is nothing to author for va-01-method
beyond its lesson (PART 12).

---

### PART 10 — `templates/va/ch02-structure.js`, part-whole + member-category rows

**Agent:** Sonnet / medium effort. The validator catches every structural error, but semantic
mis-classification — ROOM/CITY declared as part-whole, ROBIN/ANIMAL declared as member-category
— passes every check and reaches the study session untouched. That judgment call is what a
lighter model gets wrong most often here. Gemini Flash and Haiku at standard effort are not
suitable for this reason. Gemini Pro is acceptable if Sonnet is unavailable.

**Read first:** `engine/analogy.js` (the whole file — it is 350 lines; its header and the
`registerRelations` JSDoc block are the authoring contract) and
`curriculum/chapters.js` (search for `va-02-structure` — that entry lists the four concepts this
chapter owns: `va-part-whole`, `va-member-category`, `va-part-part`, `va-sequence`). For the
shape of a finished file, `templates/wk/ch04-confusables.js` is the closest analogue: same
header-comment-as-contract style, same register-then-call-builder pattern.

**Do:** create `templates/va/ch02-structure.js`. Write **24 relation rows** covering only
`va-part-whole` and `va-member-category` — do NOT write `va-part-part` or `va-sequence` rows
(those are PART 10B's scope, to keep session size manageable). Then call `relationTemplates` for
each band that has at least 5 rows, which generates the `-pair` and `-term` templates.

Target: **8 rows per band at bands 2, 3, and 4**, split across the two concepts:
- 4-5 part-whole rows per band, 3-4 member-category rows per band
- Every relation type must appear **at least twice per band** — a lone row of its type at a
  given band can never produce a format-2 question (buildMatch returns null without a partner)

**Concept rules:**
- `'va-part-whole'` — a is a physical or functional part of b, and b is specifically the
  whole it belongs to (PETAL to FLOWER, not PETAL to PLANT). The level must be right:
  ROOM/BUILDING passes; ROOM/CITY fails (too many intermediate levels).
- `'va-member-category'` — a is a member, b is the immediate category. ROBIN/BIRD passes;
  ROBIN/ANIMAL fails (too broad). FORD/CAR passes; FORD/BRAND fails (that is type-to-type).

**Band guidance:**
- Band 2: both words common enough that a high schooler knows them on sight
  (FINGER/HAND, WHEEL/CAR, OAK/TREE, TROUT/FISH)
- Band 3: one or both words at the standard test-prep level
  (PISTON/ENGINE, FUSELAGE/AIRCRAFT, PLATOON/ARMY, EPITHELIUM/TISSUE)
- Band 4: one word low-frequency enough to require inference
  (CUPOLA/DOME, CARTILAGE/JOINT, PHYLUM/KINGDOM, STANCHION/RAILING)

**The distractor arithmetic — read before you write:**
`buildMatch` (format 2) draws its correct answer from another row in the bank that shares the
base row's `relation` tag AND is in the same band. If only ONE row per band has a given
`relation`, format 2 silently skips it. With 8 rows per band and two relations, the safe floor
is 4 part-whole + 4 member-category at every band — never let either drop to 1 or 2 in a band
or that relation will go dark at that band. Count before you finalize.

**`confusions` guidance:** the strongest traps are:
- offering a member-category pair against a part-whole base (SOLDIER/ARMY looks like PETAL/FLOWER
  to a hurried reader)
- offering a same-level part-of-body pair when the base is a structural part of a building
Declaration is optional but rewarded — a declared confusion always beats a blind draw.

**Register the file in `templates/index.js`** by adding
`import './va/ch02-structure.js';` in a new `// --- Verbal Analogies` section.
That file is the one exception to "touch only the files your part names."

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=va-02-b2-pair
npm run afoqt:sample -- --only=va-02-b4-term
```
`afoqt:coverage` must stop reporting `va-part-whole` and `va-member-category` as orphans.
Read the sampled questions aloud. Fix any that parse oddly even if selftest passes.

---

### PART 10B — same file, part-part + sequence rows appended

**Agent:** Sonnet / medium effort. Two compounding risks make this harder than its row count
suggests: (1) the technical trap — calling `relationTemplates` again for a band that Part 10
already registered will throw a duplicate-id error, and a cheaper model will often miss this
on a file it did not write; (2) the "do not pad band 4" instruction is exactly the kind of
scope limit lighter models override. Haiku and Flash are not suitable. Gemini Pro is acceptable
but should be given the PART 9 design record explicitly as context.

**Read first:** the PART 10 detail above, then `templates/va/ch02-structure.js` (the whole file
as PART 10 left it). Do not alter any row PART 10 wrote.

**Context for rarity:** these two relations are each represented by exactly ONE real official
item in the 75-item sample (`oatts-VA-070` for part-part, `oatts-VA-072` for sequence) — they
are genuinely less common on the real test, which is why the row count is modest.

**Do:** append **12 rows** to `templates/va/ch02-structure.js` covering `va-part-part` and
`va-sequence` only:
- 3 rows of `va-part-part` at band 2, 3 rows at band 3 (6 total)
- 3 rows of `va-sequence` at band 2, 3 rows at band 3 (6 total)
- Band 4 is intentionally left empty for both — the real sample shows no high-rarity examples,
  and a template with fewer than 5 rows produces nothing (engine enforces this). Do not pad.

**Concept rules:**
- `'va-part-part'` — a and b are co-equal parts of the SAME whole; neither contains the other.
  The official sourced item is VENUS/SATURN (both planets of the same solar system — not one
  containing the other, not one being a member of a category). The key test: could you swap a
  and b and still have a valid pair? Yes — that is co-equal. If swapping breaks the relation,
  it is probably part-whole.
- `'va-sequence'` — a precedes b in a fixed, ordered process. The official sourced item is
  PROTOTYPE/PRODUCT (the prototype comes before the production item in a development sequence).
  The order must be inherent, not incidental: SEED/TREE passes (growth is inherent);
  MONDAY/TUESDAY is trivially positional without a process, so avoid it.

**Distractor note:** at band 2, the part-whole and member-category rows PART 10 wrote are the
best cross-relation distractors available. Declare the closest-looking PART 10 rows as
`confusions` explicitly — the engine puts declared confusions first.

**Then call `relationTemplates`** for each of the new band+chapter combinations that now have
at least 5 rows. You are adding rows to the chapter that already has part-whole and
member-category templates registered; calling `relationTemplates` again for the SAME band would
re-register a colliding id. Do NOT call it for bands where part-part or sequence has only 3
new rows — the engine returns an empty array for fewer than 5, which is the correct behaviour.
Only call it for a band if part-part + sequence combined reaches 5 at that band.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
```
`afoqt:coverage` must stop reporting `va-part-part` and `va-sequence` as orphans.
Selftest must be clean for all `va-02-*` ids.

---

### PART 10C — `templates/va/ch03-cause-consequence.js`, cause-effect + action-object rows

**Agent:** Sonnet / medium effort. Same class of invisible semantic failure as PART 10:
"FIRE/HOMELESSNESS" passes selftest as a cause-effect pair; only a model with solid causal
reasoning rejects it. The action-object "defining, not incidental" test is equally invisible
to the validator. Gemini Pro is an acceptable substitute. Flash and Haiku at standard effort
are not suitable.

**Read first:** `engine/analogy.js` (registrar contract, same as PART 10). Then
`curriculum/chapters.js` (search `va-03-cause-consequence` — concepts: `va-cause-effect`,
`va-action-object`). Then skim `templates/va/ch02-structure.js` as a finished shape example.

**Do:** create `templates/va/ch03-cause-consequence.js`. Write **24 relation rows** — 12 per
concept — spread 8 per band across bands 2, 3, 4. Then call `relationTemplates` for each band
that reaches 5 rows.

Target distribution: **4 cause-effect + 4 action-object per band** — both concepts need at
least two rows per band, same distractor-arithmetic reason as PART 10.

**Concept rules:**
- `'va-cause-effect'` — a DIRECTLY causes b; the effect must be immediate, not a downstream
  side effect. FIRE/SMOKE passes. FIRE/HOMELESSNESS fails (too many causal steps). On the real
  test, the relation is stated from cause to effect, not from effect to cause — write it that
  direction (a=cause, b=effect). `symmetric: false` (order matters: smoke does not cause fire).
- `'va-action-object'` — a is a defining action of b; b is the thing, role, or agent that
  performs a. The defining test: is this action what b IS, or merely something b sometimes does?
  BARK/DOG passes (barking defines dogs, not just something dogs sometimes do).
  EAT/DOG fails (dogs eat, but so does everything else — eating does not define a dog).
  Note that a is usually a verb and b is usually a noun here, though the format allows
  cross-POS pairs — declare pos faithfully, do not normalize.

**Strong confusion pairings to declare:**
- A cause-effect row whose effect is also an action that something performs is easily confused
  with action-object — declare these cross-concept confusions explicitly.
- Rows from PART 10's part-whole set make plausible cross-chapter distractors (a thing that
  causes another is not the same as a part of it). Cross-chapter id references are allowed.

**Register** by adding `import './va/ch03-cause-consequence.js';` in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=va-03-b2-pair
npm run afoqt:sample -- --only=va-03-b4-term
```
`afoqt:coverage` must stop reporting `va-cause-effect` and `va-action-object` as orphans.

---

### PART 11 — `templates/va/ch04-meaning-degree.js`, synonym + antonym + degree rows

**Agent:** Sonnet / medium effort — and this is the one VA data part where you should
consider high effort if the session budget allows. The synonym/degree distinction is the most
linguistically subtle judgment in the whole block: weaker models consistently label degree
pairs as synonyms, and the flag `symmetric: true` must then be set correctly or the engine
produces a second correct answer hidden inside the distractor slate — a defect that looks fine
until a student hits it. Haiku and Flash are not suitable. Gemini Pro at high effort is
acceptable but should be asked to apply the "can you say A is a weaker/stronger form of B?"
test to every row before finalizing.

**Read first:** `engine/analogy.js` registrar contract. Then `curriculum/chapters.js`
(`va-04-meaning-degree` — concepts: `va-synonym`, `va-antonym`, `va-degree`). Then the
design-record note in PART 8 above: antonym is real but rare (~4/75 real items), so keep its
row count modest relative to synonym and degree.

**Do:** create `templates/va/ch04-meaning-degree.js`. Write **30 relation rows** — roughly
14 synonym + 6 antonym + 10 degree — spread across bands 2, 3, 4 (10 rows per band). Then
call `relationTemplates` for each band.

Target per band: **5 synonym + 2 antonym + 3 degree**. Every relation type needs at least two
rows at every band where it appears, or format 2 silently produces nothing for it at that band.
With only 2 antonym rows per band that floor is exactly met — do not let it slip to 1.

**Concept rules:**
- `'va-synonym'` — a and b share the same core meaning. Use `symmetric: true` (TERSE/BRIEF is
  the same relation as BRIEF/TERSE — order is not a real trap here; offering the reversed pair
  would just be a second correct answer). Pick pairs that are synonymous in the test-relevant
  sense, not pairs where one word is a strong hyponym of the other (SCARLET is not a synonym
  of RED — that is a degree relation).
- `'va-antonym'` — direct opposites. Use `symmetric: true`. Avoid pairs where one direction is
  more natural than the other (HOT/COLD is symmetric; LOVE/INDIFFERENCE is not — the natural
  opposite of love is hate, not indifference). If you are unsure, it is not a clean antonym.
- `'va-degree'` — a and b share the same direction but differ in intensity. `symmetric: false`
  (WARM/HOT is degree; HOT/WARM reverses the direction of increase, which is a real error mode).
  The pair must share a common dimension: TRICKLE/FLOOD (water flow), ANNOYED/FURIOUS (anger).
  A degree pair is NOT the same as a synonym pair — if swapping a and b leaves the relation
  intact, it is a synonym, not a degree.

**The test between synonym and degree:** can you say "a is a weaker (or stronger) form of b"?
If yes, it is degree; if not, it is synonym. TERSE and BRIEF are equally terse — neither is a
stronger form. IRRITATED and FURIOUS are both angry, but furious is the stronger form.

**Register** by adding `import './va/ch04-meaning-degree.js';` in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=va-04-b2-pair
npm run afoqt:sample -- --only=va-04-b3-term
```
All three `va-04-*` concepts must leave the orphan list. The `-pair` sample for a symmetric row
must NOT offer the base pair reversed as a distractor — verify that.

---

### PART 11B — `templates/va/ch05-defining-traits.js`, object-attribute rows

**Agent:** Haiku / high effort is acceptable here — this is the most tractable data part
in the VA block. One concept, the clearest definitional test ("is this attribute part of the
definition, or just a common fact?"), and the richest cross-bank distractor pool by the time
this part runs. The worker-domain variant is novel but precisely described. Gemini Flash at
high effort is also acceptable. If either produces even one pair that fails the definitional
test on readback, escalate to Sonnet for that row only.

**Read first:** `engine/analogy.js` registrar contract. Then `curriculum/chapters.js`
(`va-05-defining-traits` — concept: `va-object-attribute`). Then the PART 8 design note:
the "worker to workplace" pattern (~6/75 real items — BEAUTICIAN/SALON, CARDIOLOGIST/HEART) is
FOLDED INTO `va-object-attribute` as a variant reading, not a separate concept. Write a mix
of both the classic object-attribute pattern and the worker-domain variant, both tagged
`'va-object-attribute'`.

Because `va-05-defining-traits` declares only ONE concept, `crossPool` will draw all its
cross-relation distractors from the rest of the bank — which is why this chapter needs its own
file last (the bank is largest by then) but also why declared `confusions` pointing to specific
rows in PARTS 10-11 are particularly valuable here.

**Do:** create `templates/va/ch05-defining-traits.js`. Write **24 relation rows** — 8 per band
at bands 2, 3, 4 — all tagged `'va-object-attribute'`. Then call `relationTemplates` for each
band.

**Concept rules (object-attribute and its worker-domain variant):**
- Classic: a is a defining attribute or quality of b. FIERCE/TIGER — fierceness is a defining
  quality of tigers, not just an incidental one. The tell test: is this attribute part of the
  DEFINITION, or just a common fact? FAST/CHEETAH passes (speed is definitional);
  STRIPED/CHEETAH fails (stripes are a fact, not the definition).
- Worker-domain: a is a role or agent; b is the domain or setting where a is defined. Write it
  as `a=worker, b=domain` (SURGEON/HOSPITAL, NAVIGATOR/COCKPIT). The defining test: does b
  define a's role, not just locate them? A SURGEON in a hospital is defined by that setting;
  a SURGEON in a grocery store is still a surgeon — the domain is definitional, not locational.

**Band guidance:**
- Band 2: both words immediately recognizable (BRAVE/SOLDIER, PILOT/COCKPIT, SWIFT/FALCON)
- Band 3: one or both words at mid-rarity (TENACIOUS/BULLDOG, LACONIC/SPARTAN,
  OTOLARYNGOLOGIST/CLINIC would be too hard — keep b recognizable even if a is rare)
- Band 4: the defining attribute or role requires more inference
  (PROBITY/JUDGE, PUGNACIOUS/COMBATANT, FIDUCIARY/TRUSTEE)

**Register** by adding `import './va/ch05-defining-traits.js';` in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=va-05-b2-pair
npm run afoqt:sample -- --only=va-05-b4-term
```
`va-object-attribute` must leave the orphan list. `afoqt:selftest` must be fully clean.

---

### PART 12 — VA lessons, all five chapters

**Agent:** Sonnet / medium effort minimum. This is the highest-risk task in the VA block
because there is no structural validator — every check is human judgment. The specific failure
modes that disqualify lighter models: (1) hallucinated statistics (Flash and Haiku will
produce "research shows" claims not sourced in the packet — Doctrine rule 2's spirit prohibits
this); (2) teaching things no template tests, which passes `afoqt:coverage` only because
coverage checks concepts, not lesson content; (3) voice inconsistency across five files
written in one session. Gemini Pro is acceptable if given the two model lessons as explicit
prior context. Grok and Perplexity are not suitable — their markdown output tends to include
HTML that breaks the react-markdown renderer. Haiku and Flash are not suitable.

**Read first:** `curriculum/chapters.js` (all five `va-*` chapter entries — concepts, prereqs,
summaries), `curriculum/lessons.js` (the import + map pattern), and two existing lessons as
model: `curriculum/chapters/ar/ch01-translation.md` and `curriculum/chapters/wk/ch01-method.md`.
Voice, heading depth, and section length in those two files are the standard to match.

**Do:** create `curriculum/chapters/va/` and write five lesson files:

`ch01-method.md` — concepts: `va-relation-format`, `va-relation-discriminators`
- Teach the two real AFOQT formats: format 1 (complete the fourth term) and format 2 (pick the
  matching pair). Explain that format 2 outnumbers format 1 roughly 3:1 on the real test.
- Teach the two official discriminators that catch same-category traps: (1) level of
  association — the pair's relation must be the SAME KIND, not just related; (2) order matters
  in all non-symmetric relations — offering the correct words in the wrong order is the engine's
  primary distractor for asymmetric pairs. Name these by what they actually do on the question,
  not as abstract labels.
- Note: this lesson's concepts are exercised by EVERY question in every other VA chapter — once
  this lesson is complete, the student is practicing these two skills in every drill session
  without a separate drill chapter. Do not invent a bespoke quiz format for va-01-method; the
  doctrine's spirit rules that out.

`ch02-structure.md` — concepts: `va-part-whole`, `va-member-category`, `va-part-part`,
`va-sequence`
- Four relation types in one chapter. Group them by the test that separates them:
  part-whole vs. member-category: the part belongs to a specific whole; the member belongs to a
  class. The level-of-category trap (ROBIN/BIRD vs. ROBIN/ANIMAL) is the live error mode.
  part-part vs. part-whole: co-equal siblings share the same whole but neither CONTAINS the
  other. A sequence imposes an ORDER on the two elements — the order is inherent to the process.
- Two or three worked examples per relation type, no more. This chapter accounts for the largest
  share of real items (~3 in 10) — the lesson is correspondingly the longest VA lesson.

`ch03-cause-consequence.md` — concepts: `va-cause-effect`, `va-action-object`
- The key distinction: cause-effect runs from the trigger to its direct outcome; action-object
  names what an agent IS by naming what it DOES. A doctor causing recovery is cause-effect; a
  doctor performing surgery is action-object. Name the exact error mode that blurs them.

`ch04-meaning-degree.md` — concepts: `va-synonym`, `va-antonym`, `va-degree`
- The single test that separates synonym from degree: can you say "a is a weaker (or stronger)
  form of b"? If yes, degree; if not, synonym. Antonym adds a directionality trap the same way
  the WK reversed-stem does.
- Note that synonym and antonym rows set `symmetric: true` in the engine — explain WHY order
  does not matter for these two and DOES matter for degree. That is the lesson's payoff.

`ch05-defining-traits.md` — concept: `va-object-attribute`
- Two variants that share one concept tag: classic object-attribute (FIERCE/TIGER) and
  worker-domain (SURGEON/HOSPITAL). Teach the "definitional, not incidental" test for classic;
  teach "defines the role, not just locates the person" for worker-domain.
- This is the smallest chapter (one concept) and the lesson should be the shortest.

**Then register all five** in `curriculum/lessons.js`: add five `?raw` imports (e.g.,
`import va01 from './chapters/va/ch01-method.md?raw';`) and five map entries keyed by the exact
chapter ids (`'va-01-method': va01,` etc.). That file is the one exception to "touch only the
files your part names."

**The binding rule applies in both directions (Doctrine rule 2):**
- every concept each chapter declares must be TAUGHT in its lesson
- the lesson must NOT teach anything no template tests

**Verify:**
```
npm run afoqt:coverage
```
No orphan concepts for any `va-*` chapter. Then confirm the markdown renders as plain markdown
(no raw HTML, no unclosed fences) and that every heading level is consistent with the model
lessons.

---

### PART 13 — VA test suite

**Agent:** Sonnet / medium effort. The model file (`words.test.js`) is provided and the
overall structure is mechanical — but two items require reading the engine source, not just
the test file: (1) the symmetric-distractor check (verifying that `buildMatch` actually skips
the reversed-pair distractor for symmetric rows) requires understanding the skip logic in
`analogy.js`; (2) the "do not weaken an assertion" instruction is a trap for any model that
optimizes for green tests — a model that changes `toBe(5)` to `toBeGreaterThanOrEqual(1)` to
make a failing test pass has produced a dead guard. Gemini Pro is acceptable. Haiku at high
effort can handle the mechanical tests (validator rejection, determinism, slate integrity) but
should not be trusted for item (1) above — if using Haiku, verify the symmetric check
yourself before ticking the board.

**Read first:** `engine/__tests__/words.test.js` as the model — it is the most recent and most
thorough test file, and its structure (validator-rejection tests, utility-function tests, bank
invariants over real registered rows, determinism, slate integrity) is the exact pattern to
follow here. Also read `engine/analogy.js` in full.

**Do:** create `engine/__tests__/analogy.test.js`. Vitest, `node` environment (no jsdom
docblock). Cover:

1. **Validator rejection.** Every `throw` in `registerRelations` gets a test that feeds it input
   that SHOULD fail and asserts it does. Use `_resetRelations()` between cases — **and restore
   the real bank in `afterEach`, per rule 12 in section 3.** `words.test.js` shipped without
   that and 20 of its own tests either threw from an unrelated file or passed over an empty
   array; the `restoreBank` helper at the top of it now is the pattern to copy, along with the
   `expect(...).toBeGreaterThan(0)` guards that stop an invariant test going vacuous.
   Guards to cover:
   - no id
   - duplicate id
   - a.word === b.word
   - duplicate pair (same two words in either order)
   - band out of range
   - pos not in `{adj, noun, verb, adv}`
   - confusions entry naming a non-existent id
   - band mismatch with WK bank (register a WK word at band 2, then try a VA row using that
     same word at band 3 — it should throw)

2. **`wordBand(word)`** — returns the correct band when the word exists in the WK bank,
   returns `null` when it does not.

3. **Bank invariants over the real registered rows** (import `../../templates/index.js` to load
   all chapters, same as `words.test.js` does):
   - every id unique across the whole bank
   - no pair duplicated in either order
   - every row's `concepts` declared by its chapter in `curriculum/chapters.js`
   - every band in range 1-5
   - for every row where either word appears in the WK bank, the band matches
   - every `confusions` entry names a row that exists in the bank

4. **`relationsFor(chapter, band)`** — returns only rows for the given chapter and band.

5. **Determinism:** `generateInstance(id, seed)` called twice for the same template id and seed
   gives a byte-identical question.

6. **Slate integrity** over every `va-*` template at a few hundred seeds: five distinct choices,
   `correctIndex` in range 0-4, no choice text equal to another.

7. **Format-specific checks:**
   - `-pair` template stem ends with `"as:"`
   - `-term` template stem ends with `"is to:"`
   - for a symmetric row, the reversed-pair distractor must NOT appear among the choices
     (engine skips it for symmetric rows — verify this actually happens)

Do not weaken an assertion to make it pass. If a test finds a real defect in the bank, **leave
the test failing and report it** — that is the test working.

**Verify:**
```
npx vitest run src/pages/theknowledgebase/afoqt/engine/__tests__/analogy.test.js
```
This part is the one exception to the no-install rule: vitest needs `node_modules`. If the
packet has none, run `npm install` for this part only, and say so in your report.

---

### PART 14 — RC design + passage engine (Claude-only)

Not farmed. This is the record for whoever picks up PARTS 15-18.

**What was built:** `afoqt/engine/passage.js` — the central registrar and template generator for Reading Comprehension.
Exports: `registerPassages`, `allPassages`, `passageTemplates`, `_resetPassages`.

**The registrar contract (what PART 15/16 passages must satisfy):**
Every passage passed to `registerPassages` needs:
- `id` — unique across the whole bank (e.g. `rc-001`)
- `wordCount` — integer strictly between 400 and 600
- `lineNumbered` — boolean `true`
- `text` — the passage body string, written with a **literal `\n` between each printed line**
  (see "PART 14 fix record" below — the renderer numbers lines by splitting on `\n`, and the
  registrar now throws if `lineNumbered: true` but `text` has no `\n` in it at all)
- `band` — difficulty score 1-5
- `questions` — an array of question objects

Every question in the `questions` array needs:
- `type` — one of: `main-idea`, `vocabulary-in-context`, `detail-inference`, `function-of-paragraph`, `author-agreement`
- `stem` — the question text (must be unique within the passage)
- `choices` — array of EXACTLY 5 string distractors (must be unique)
- `correctIndex` — integer 0-4 pointing to the correct choice
- `why` — explanation string for the correct answer

**Validators that throw:**
- missing or duplicate `id`
- `wordCount` out of 400-600 range
- `band` not 1-5
- missing `text` or empty `questions` array
- any question `type` outside the 5 permitted values
- duplicate `stem` within a passage
- `choices` length !== 5, or choices containing duplicates
- `correctIndex` out of 0-4 bounds
- missing `why`

**Template builder:** `passageTemplates({ chapter, band, idBase, name, concepts, passages, sheetSpan })`
Registers exactly **one** template per call (one per (chapter, band) pair — call it once per
band the way VA's `relationTemplates` is called once per chapter+band). The engine floor: it
requires at least **5 eligible questions** across the registered passages for the given concepts
and band, otherwise it quietly returns an empty array — same rule as everywhere else in the
project.

**Sheet behaviour (fixed 2026-08-24, see fix record below):** the template is registered with
`sheet: true` and `sheetSpan` (default 5). Consecutive questions drawn from the same template
pool in one drill land on the SAME passage — chosen deterministically from `h.sheetSeed`, walked
by `h.item` — for `sheetSpan` questions before the run advances to a different one. You do not
need to do anything for this; it is automatic once you register passages and call
`passageTemplates`. **What you DO need to do:** write passages whose `questions` array carries a
reasonable spread of types (see PART 15/16 below) — a passage with only one or two questions of
a given type will legitimately repeat that item once its small pool is exhausted within a
sheet-span block, the same accepted behaviour Block Counting and Table Reading already have for
a bounded item space (`stemSpace`; see `engine/generator.js`'s own comment on it).

#### PART 14 fix record, 2026-08-24 — all three defects resolved, PARTS 15/16 unblocked

The review below found three defects reading `engine/passage.js` against the design record and
against the `sheet` rules in `CLAUDE.md`. None was catchable by `afoqt:selftest`. All three are
fixed as of 2026-08-24 (Claude, live session, confirmed with Trey on the sheet-mode call):

1. **Sheet mode, RESOLVED.** `passageTemplates` now registers `sheet: true` / `sheetSpan: 5` and
   `generate()` picks the run's current passage via `h.sheetSeed % bandPassages.length`, then
   walks `h.item` over that passage's own eligible questions rather than drawing a fresh random
   passage every time. `render.sheetSeed` is set to the passage's own string `id` (not a numeric
   hash) so `engine/drill.js`'s `groupByFigure` cannot accidentally merge two different bands'
   questions that happen to compute the same numeric sheet value. A synthetic-data check (10
   questions, two templates, three passages) confirmed a run stays on one passage for a full
   `sheetSpan` block, cycles through distinct eligible questions before repeating, and is fully
   deterministic for a given (rng seed, sheet) — same guarantee TR/BC already give.
   **Runner note, since Trey asked:** no `DrillRunner.jsx` change was needed to get "the passage
   stays up, answers aren't revealed until you're done with it" — the runner already never shows
   per-question feedback (see `submit()` in `DrillRunner.jsx`; the summary screen is the only
   reveal), so combined with the sheet fix, a passage now visibly stays mounted across its block
   of questions with no extra work. Per-question progress is still saved to storage immediately
   on each answer (same as every other subtest) rather than deferred to the end of the passage
   block — nothing about that is visible to the user, and deferring it would only add risk of
   losing an answer if the app closes mid-passage, so it was left as-is.
   **Also found and fixed in the same pass, not in the original review:** `Figure.jsx` had no
   `kind === 'passage'` branch at all, so a registered RC template would have generated a
   question with literally nothing rendered above the stem. New `render/PassageView.jsx` (line-
   numbers every line, split on `\n`) is now wired in.
2. **`rc-01-method` ownership, RESOLVED.** `passageTemplates` now auto-tags
   `rc-time-management` and `rc-reading-strategy` onto every template it registers, the same
   pattern VA used for `va-relation-format`/`va-relation-discriminators`. You do not add these
   to the `concepts` you pass in — they are added automatically.
3. **`lineNumbered` validation + stale JSDoc, RESOLVED.** `registerPassages` now throws if
   `lineNumbered` is not a boolean, and throws separately if `lineNumbered: true` but `text` has
   no `\n` to number. The JSDoc above the builder now says what the code does (one template per
   call).

PART 15/16's Verify blocks below are rewritten to the section-6 standard.

---

### PART 15 — `templates/rc/ch01-passages-set-A.js`, bands 2 & 3

**Agent:** Sonnet / medium effort. Passages must be originally written, adhering to the "PME / Joint-Force strategic prose" register. Gemini Pro is a viable substitute. Hallucinating 5 unique distractors per question and ensuring strict word counts requires strong linguistic capability. Flash and Haiku are not suitable because they tend to output overly generic or encyclopedic passages.

**Read first:** `engine/passage.js` (the whole file — the header comments on `registerPassages` and `passageTemplates` are your authoring contract, including the sheet-mode section), `docs/afoqt/CONTRIBUTING-QUESTIONS.md` (the RC spec), and `curriculum/chapters.js` (search `rc-` for the four chapter entries and their concepts).

**Do:** create `templates/rc/ch01-passages-set-A.js`. Write **12 passages**:
- 6 passages at band 2
- 6 passages at band 3
- Each passage must have 4-6 questions in its `questions` array.
- Cover all 5 question types across the passages at each band, ensuring AT LEAST 5 questions of each type exist per band (distractor arithmetic: `< 5` means the template builder returns nothing).

**The `text` format — read this before writing your first passage.** The renderer numbers
printed lines by splitting `text` on `\n`, and `registerPassages` now throws if `lineNumbered:
true` and there is no `\n` in the string at all. Write each passage as a plain string with a
literal `\n` after roughly every 12-16 words (a natural printed-line length), not as one long
paragraph. A 500-word passage should come out to somewhere around 30-40 lines. A
`vocabulary-in-context` stem that says "As used in line 12..." must actually be pointing at a
real line 12 in your own text — count it, don't estimate it.

**Per-passage type spread — this is new, and it is the whole reason a drill will feel right.**
Because RC now runs in sheet mode (one passage stays on screen for several consecutive
questions — see the fix record above), a passage whose `questions` array has only one question
of a given type will make that exact question repeat if the run asks for that type twice while
that passage is current. **Give each passage at least 2 questions of at least 3 of the 5 types**
where the passage's own content supports it honestly — never invent a question just to hit this,
but do favor passages substantial enough to support two clean readings of the same type (e.g. a
passage with two distinct inferable details, not one detail asked two different ways).

**Concept rules:**
- `main-idea` — Tests extraction of the thesis from supporting points.
- `vocabulary-in-context` — Tests inferring the meaning of a specific word (e.g. "As used in line 12, 'execute' most nearly means...").
- `detail-inference` — Tests drawing a logical conclusion from a stated fact.
- `function-of-paragraph` — Tests understanding why the author structured a paragraph that way (e.g. "The second paragraph serves primarily to...").
- `author-agreement` — Tests determining what claim the author would likely endorse.

**Then call `passageTemplates`** once per band (2 and 3) for each rc chapter whose concepts your
passages cover — e.g. `passageTemplates({ chapter: 'rc-02-main-idea', band: 2, idBase:
'rc-main-idea-b2', name: 'Main idea, band 2', concepts: ['rc-main-idea', 'rc-author-agreement'],
passages: allPassages() })`, and similarly for `rc-03-details` (`rc-detail-inference`,
`rc-function-of-paragraph`) and `rc-04-vocabulary` (`rc-vocabulary-in-context`), at both band 2
and band 3. Do NOT pass `rc-time-management` / `rc-reading-strategy` yourself — they are added
automatically. If a call returns an empty array, you are short of the 5-eligible-question floor
for that (chapter, band) — add more passages or more questions of that type before moving on.

**Register the file:** `templates/index.js` by adding `import './rc/ch01-passages-set-A.js';` in a new `// --- Reading Comprehension` section.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=rc-main-idea-b2
npm run afoqt:sample -- --only=rc-detail-b3
```
(substitute your actual `idBase` values in the last two commands). `afoqt:coverage` must stop
reporting `rc-main-idea`, `rc-author-agreement`, `rc-detail-inference`, `rc-function-of-
paragraph`, `rc-vocabulary-in-context`, `rc-time-management` and `rc-reading-strategy` as orphans
for bands 2-3 (PART 16 covers bands 4-5 of the same concepts). Read the sampled questions and
confirm any "line N" reference in a stem points at the actual numbered line in that passage's text.

---

### PART 16 — `templates/rc/ch02-passages-set-B.js`, bands 4 & 5

**Agent:** Sonnet / medium effort. Same high standard as PART 15, but targeting high-difficulty strategic prose where vocabulary and syntax are significantly more complex.

**Read first:** The same files as PART 15, including the `text` line-break format and the
per-passage type-spread rule above — both apply here unchanged. Then skim `templates/rc/ch01-passages-set-A.js` so you don't overlap topics.

**Do:** create `templates/rc/ch02-passages-set-B.js`. Write **12 passages**:
- 6 passages at band 4
- 6 passages at band 5
- Follow the exact same rules as PART 15 for question arrays, the `\n`-lined `text` format, and per-passage type spread.

**Then call `passageTemplates`** once per band (4 and 5) for each rc chapter, the same way PART
15 does for bands 2-3 — `rc-02-main-idea`, `rc-03-details`, `rc-04-vocabulary`.

**Register the file:** `templates/index.js`, alongside PART 15's import.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=rc-main-idea-b4
npm run afoqt:sample -- --only=rc-vocabulary-b5
```
(substitute your actual `idBase` values). `afoqt:coverage` must stop reporting every `rc-*`
concept as an orphan — bands 2-3 come from PART 15, bands 4-5 from this part, and both must have
landed for the orphan list to fully clear.

---

### PART 17 — RC lessons

**Agent:** Sonnet / medium effort. No structural validator. Hallucinated strategies or teaching things no template tests will pass `afoqt:coverage` silently. Flash/Haiku are not suitable.

**Read first:** `curriculum/chapters.js` (all `rc-*` entries), `curriculum/lessons.js`.

**Do:** create `curriculum/chapters/rc/` and write four lesson files:
- `ch01-method.md` (time management, reading strategy)
- `ch02-main-idea.md` (main idea, author agreement)
- `ch03-details.md` (detail inference, function of paragraph)
- `ch04-vocabulary.md` (vocabulary in context)

Register them in `curriculum/lessons.js`.

**Verify:**
```
npm run afoqt:coverage
```
Confirm the markdown renders as plain markdown without HTML tags.

---

### PART 18 — RC test suite

**Agent:** Sonnet / medium effort. Must write deterministic tests and bank invariants.

**Read first:** `engine/__tests__/words.test.js` and `engine/passage.js`.

**Do:** create `engine/__tests__/passage.test.js`.
Cover:
- Validator rejection (all `throw`s in `registerPassages`)
- Bank invariants (all registered passages meet constraints)
- Determinism over `passageTemplates` output
- Slate integrity

**Verify:**
```
npx vitest run src/pages/theknowledgebase/afoqt/engine/__tests__/passage.test.js
```

---

### PART 19 — design record (done 2026-08-25, Claude, autonomous session per Trey's go-ahead)

Not farmed. Curriculum design per section 4's not-farmable column. This is the record for
whoever picks up PARTS 20-23.

**What was built:** 8 chapters (`ps-01-astronomy` through `ps-08-thermodynamics`), 30 concepts,
in `curriculum/chapters.js` under a new `science` track. `node --check` passed and
`npm run afoqt:coverage` shows the chapters registered (98 lesson-minutes, 30 concepts, all
correctly listed as orphans — expected, since no fact rows exist yet).

**Grounded in the real official bank, not a guess.** `afoqt/data/realQuestions.json` already has
25 official OATTS Physical Science items (`subtest: 'PS'`), and they split **evenly across
exactly 8 areas** — Astronomy, Atomic Physics, Chemistry, Electrical Physics, Light Physics,
Mechanical Physics, Sound Physics, Thermodynamics (3-4 items each). One chapter per area. This
supersedes the placeholder split this file used to carry ("mechanics, forces, energy" / "matter,
chemistry, earth and space") — that guess predates anyone actually pulling the 25 items and
checking, and it does not match the real taxonomy (there is no "earth and space" area distinct
from astronomy in the real bank, and "forces/energy" spans what the real bank keeps as three
separate areas: mechanical, electrical, thermodynamics). Read the real items yourself before
writing rows — `node -e "console.log(JSON.parse(require('fs').readFileSync('afoqt/data/realQuestions.json')).filter(q=>q.subtest==='PS'))"` from the repo root — they are short, direct,
non-mathematical conceptual-recall items, which is exactly the shape `engine/facts.js` (the
Aviation Information engine) was built for.

**No new engine.** `engine/facts.js` is reused as-is — `registerFacts()` for the data,
`factTemplates()` for the identify/recall question frames, both already generic. This is
DIFFERENT from VA, which needed a new `engine/analogy.js` (Part 9) because relation-pairs are not
fact-lookup shaped. Physical Science facts are exactly the shape Aviation Information facts are,
so nothing new had to be built — Part 19's whole job was curriculum design, not engine work.

**Depth target: full parity with Aviation Information, per Trey's go-ahead (2026-08-25).** He
confirmed this explicitly rather than a lighter unscored-subtest pass, citing his stated goal
("dominate all the topics even if I'll never use them") over the ~5-week runway to test day. AI
landed at 374 facts / 64 templates / 11 chapters (~34 facts/chapter). Target for PS: **roughly
35-45 facts per chapter** (4-concept chapters toward the top of that range, the two 3-concept
chapters — sound, thermodynamics — toward the bottom), landing near 300 facts total. This is
smaller than AI's 374 only because AI's domain is genuinely larger (11 chapters of real aviation
knowledge vs. 8 areas of general-education physical science) — it is not a deliberately lighter
treatment.

**⚠ Mechanics overlap with Aviation Information, read before writing PART 21.**
`av-02-forces` (Aviation Information, already shipped) covers Newton's laws AS THEY APPLY TO
FLIGHT — an airfoil, lift/drag/thrust/weight, angle of attack. `ps-06-mechanics` covers the same
underlying physics from a general, non-aviation angle — blocks, ramps, a tug-of-war, not wings.
The two chapters are correctly scoped to different concept ids, so `afoqt:coverage` cannot catch
an accidental duplicate — a `ps-06-mechanics` fact reading like a flight-training example instead
of a general-physics one would pass every structural check and just be redundant with AI. Write
facts a general-education physics class would ask.

**Prereqs:** mostly empty — unlike Aviation Information, these 8 areas mostly don't build on each
other. Two real ones declared: `ps-03-chemistry` depends on `ps-02-atomic-physics` (periodic
table organization rests on atomic structure), and both `ps-07-sound` and `ps-08-thermodynamics`
depend on `ps-06-mechanics` (both rest on particle motion, which mechanics introduces).
`ps-06-mechanics` itself is the "from-zero" entry chapter (bands `[1,2,3]`, the same role
`av-01`/`av-02` play for Aviation Information) — the most everyday, least-technical area, and the
one every other PS chapter can lean on.

**Splitting the fact-row parts:** PS is being split into **four** data parts (PART 20, 20B, 21,
21B — VA's `10`/`10B` numbering convention, chosen specifically so downstream part numbers
(lessons, tests, and everything from PART 24 onward) don't have to shift), two chapters each,
roughly 70-90 facts per part — comparable in size to WK's PART 2 (60 rows), the largest single
farmed data part so far. Aviation Information itself was NOT farmed (it predates the farming
workflow, built directly in Phase 5) and its own build notes flag real editorial risk in
fact-engine content — four defect classes shipped there that passed every structural check and
were only caught by reading questions aloud (see CLAUDE.md's Aviation Information section). Every
PS data part below repeats the same warning and the same required reading step.

---

### PART 20 — `templates/ps/ch01-astronomy.js`, `ch02-atomic-physics.js`

**Agent:** Sonnet / medium effort. `engine/facts.js`'s registrar catches shape errors (missing
band, an unresolved confusion id, a shouting gloss) but nothing catches a fact whose IDENTIFY
stem leaks its own answer or whose gloss doesn't grammatically agree with the derived stem — see
"FOUR EDITORIAL DEFECT CLASSES" in CLAUDE.md's Aviation Information section, all four of which
passed `afoqt:selftest` at 8,000 samples. Haiku and Flash are not suitable for this reason —
every one of those four defects is a judgment call about phrasing, not a shape a validator can
reject.

**Read first:** `engine/facts.js` in full — the header comment explains why distractors are
declared confusions rather than random padding, and `identifyStem()`'s doc comment explains the
two defect classes it exists to prevent (never author the identify stem by hand). Then
`curriculum/chapters.js`, search `ps-01-astronomy` and `ps-02-atomic-physics` for the concepts
each chapter owns. Then `templates/av/ch01-anatomy.js` or any other `templates/av/ch*.js` file as
the closest finished example of this exact shape (same `registerFacts([...]); factTemplates({...})`
pattern, one file per chapter or chapter pair).

**Do:** create `templates/ps/ch01-astronomy.js` and `templates/ps/ch02-atomic-physics.js`.

- `ch01-astronomy.js`: **35-40 facts** across `ps-solar-system`, `ps-earth-motion-seasons`,
  `ps-eclipses-moon-phases`, `ps-stars-and-universe`, spread across bands 2/3/4 (roughly even,
  minimum 5 rows in each band — `factTemplates` silently registers nothing for a band with fewer
  than 5 eligible rows). Grounded in the real items: `oatts-PS-045` (comets), `oatts-PS-046`
  (solar/lunar eclipses), `oatts-PS-047` (planetary motion and seasons) are already in
  `afoqt/data/realQuestions.json` — read them for phrasing register before writing your own.
- `ch02-atomic-physics.js`: **35-40 facts** across `ps-atomic-structure`,
  `ps-electron-energy-levels`, `ps-periodic-trends`, `ps-radioactivity-decay`. Real items:
  `oatts-PS-048` (electron energy levels), `oatts-PS-049` (mass number from protons/neutrons),
  `oatts-PS-050` (periodic trends).

**Fact-row rules — read before writing your first one:**
- **Never author the identify stem.** `identifyStem()` derives it from `term` alone. Writing it
  by hand is exactly what put the answer inside the question 60 times in Aviation Information.
- **The gloss is a third-person predicate; the article belongs to the term.** "the aileron" +
  "controls roll"; "lift" + "is the upward force". No rule separates the two cases — decide it
  per row, the same way Aviation Information's data does.
- **A gloss must not shout.** `shoutedWord()` in `engine/facts.js` rejects an ALL-CAPS
  non-acronym word in a gloss (it's a visible tell in the shuffled choices). Known acronyms are
  allowlisted in that file; if you need a new one (unlikely for these two chapters), say so in
  your report rather than silently avoiding the term.
- **Give every fact a `recallStem` unless the gloss genuinely fits more than one term.** The
  recall frame ("The downward force acting on an aircraft is called ___" style, but for these
  chapters e.g. "The force that pulls objects toward Earth's center is called ___") only draws
  from rows that HAVE one — omitting it by default just shrinks that frame's pool for no reason.
- **`confusions` may only name ids in the SAME chapter file**, and the priority order for a
  fact's distractors is: declared confusion → same-concept sibling → same-chapter fallback. A
  fact with no siblings sharing its concept degrades to generic same-chapter distractors, which
  is weaker — so give each concept enough rows (aim for at least 3-4 per concept per band) that
  real same-concept distractors exist. Good candidates for `ch01`: "meteor" vs "meteorite" vs
  "asteroid" vs "comet"; "waxing" vs "waning" phases. For `ch02`: "atomic number" vs "mass
  number"; "isotope" vs "ion"; adjacent periodic trends (electronegativity vs. atomic radius).
- **Cite a real source or say "general knowledge."** `source` should be `'OATTS'` where a fact is
  directly informed by one of the real items above, or omitted/`'general physical science'`
  otherwise — never invent a citation you have not actually read, same rule PART 12 (VA lessons)
  used.
- **Sample and read the output — this is not optional.** `afoqt:selftest` proves a question is
  well-FORMED, never well-WRITTEN. Read at least 15-20 sampled questions per chapter aloud before
  calling this done.

**Register the files** by adding `import './ps/ch01-astronomy.js';` and
`import './ps/ch02-atomic-physics.js';` in a new `// --- Physical Science` section of
`templates/index.js`. That file is the one exception to "touch only the files your part names."

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=ps-astronomy-b2-id
npm run afoqt:sample -- --only=ps-atomic-physics-b4-recall
```
(substitute your actual `idBase` values in the last two — whatever you pass to `factTemplates`).
`afoqt:coverage` must stop reporting `ps-solar-system`, `ps-earth-motion-seasons`,
`ps-eclipses-moon-phases`, `ps-stars-and-universe`, `ps-atomic-structure`,
`ps-electron-energy-levels`, `ps-periodic-trends` and `ps-radioactivity-decay` as orphans.

---

### PART 20B — `templates/ps/ch03-chemistry.js`, `ch04-electrical.js`

**Agent:** Sonnet / medium effort. Same editorial-risk profile as PART 20 — read that part's
"Fact-row rules" section in full, it applies here unchanged and is not repeated verbatim below.

**Read first:** same as PART 20 (`engine/facts.js`, an existing `templates/av/ch*.js` file), plus
`curriculum/chapters.js` for `ps-03-chemistry` and `ps-04-electrical`'s concepts.

**Do:** create `templates/ps/ch03-chemistry.js` and `templates/ps/ch04-electrical.js`.

- `ch03-chemistry.js`: **35-40 facts** across `ps-states-of-matter`,
  `ps-periodic-table-organization`, `ps-physical-chemical-change`, `ps-acids-and-bases`. Real
  items: `oatts-PS-051` (states of matter), `oatts-PS-052` (periodic table organization),
  `oatts-PS-053` (chemical vs. physical change).
- `ch04-electrical.js`: **35-40 facts** across `ps-circuit-fundamentals`,
  `ps-resistance-and-conductors`, `ps-circuit-components`, `ps-magnetism-and-electromagnetism`.
  Real items: `oatts-PS-054` (series circuit current), `oatts-PS-055` (what decreases
  resistance), `oatts-PS-056` (what a switch does).

Follow PART 20's fact-row rules exactly (identify stem never authored, gloss never shouts, give
every fact a `recallStem` by default, confusions stay in-chapter, cite `'OATTS'` or general
knowledge honestly, sample and read the output). Good same-chapter confusion candidates: "solid"
vs "crystalline solid" vs "amorphous solid"; "mixture" vs "compound" vs "solution"; "series" vs
"parallel" circuit behavior; "conductor" vs "insulator" vs "semiconductor".

**Register the files** in `templates/index.js`, alongside PART 20's imports.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=ps-chemistry-b3-id
npm run afoqt:sample -- --only=ps-electrical-b2-recall
```
(substitute your actual `idBase` values). `afoqt:coverage` must stop reporting
`ps-states-of-matter`, `ps-periodic-table-organization`, `ps-physical-chemical-change`,
`ps-acids-and-bases`, `ps-circuit-fundamentals`, `ps-resistance-and-conductors`,
`ps-circuit-components` and `ps-magnetism-and-electromagnetism` as orphans.

---

### PART 21 — `templates/ps/ch05-light.js`, `ch06-mechanics.js`

**Agent:** Sonnet / medium effort. Same editorial-risk profile as PART 20.

**Read first:** same as PART 20, plus `curriculum/chapters.js` for `ps-05-light` and
`ps-06-mechanics`'s concepts. **Then read the "⚠ Mechanics overlap with Aviation Information"
note in the PART 19 design record above before writing a single `ch06-mechanics.js` row** —
`av-02-forces` already covers Newton's laws for flight (airfoils, lift/drag); this chapter is the
same physics from an everyday, non-aviation angle (blocks, ramps, tug-of-war), and nothing
mechanically stops a duplicate from shipping since the two chapters use different concept ids.

**Do:** create `templates/ps/ch05-light.js` and `templates/ps/ch06-mechanics.js`.

- `ch05-light.js`: **35-40 facts** across `ps-light-wave-properties`,
  `ps-reflection-and-refraction`, `ps-lenses-and-mirrors`, `ps-electromagnetic-spectrum`. Real
  items: `oatts-PS-057` (a true statement about light), `oatts-PS-058` (reflection naming),
  `oatts-PS-059` (the wave property that determines color and survives a medium change —
  frequency, not wavelength or speed).
- `ch06-mechanics.js`: **35-40 facts** across `ps-newtons-laws-general`, `ps-friction`,
  `ps-simple-machines`, `ps-equilibrium-and-net-force`. Real items: `oatts-PS-060` (what friction
  does to a moving object), `oatts-PS-061` (balanced forces in a stationary tug-of-war),
  `oatts-PS-062` (why an inclined plane is used).

Follow PART 20's fact-row rules exactly. Good same-chapter confusion candidates: "reflection" vs
"refraction" vs "diffraction"; "concave" vs "convex" lens/mirror behavior; "mass" vs "weight";
"static friction" vs "kinetic friction"; "speed" vs "velocity" vs "acceleration".

**Register the files** in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=ps-light-b4-id
npm run afoqt:sample -- --only=ps-mechanics-b2-recall
```
(substitute your actual `idBase` values). `afoqt:coverage` must stop reporting
`ps-light-wave-properties`, `ps-reflection-and-refraction`, `ps-lenses-and-mirrors`,
`ps-electromagnetic-spectrum`, `ps-newtons-laws-general`, `ps-friction`, `ps-simple-machines`
and `ps-equilibrium-and-net-force` as orphans.

---

### PART 21B — `templates/ps/ch07-sound.js`, `ch08-thermodynamics.js`

**Agent:** Sonnet / medium effort. Same editorial-risk profile as PART 20. Smaller part than
20/20B/21 — these are the two 3-concept chapters, so a lighter row count is correct, not a
shortfall.

**Read first:** same as PART 20, plus `curriculum/chapters.js` for `ps-07-sound` and
`ps-08-thermodynamics`'s concepts.

**Do:** create `templates/ps/ch07-sound.js` and `templates/ps/ch08-thermodynamics.js`.

- `ch07-sound.js`: **28-32 facts** across `ps-sound-wave-properties`,
  `ps-sound-propagation-medium`, `ps-wave-behavior-diffraction-doppler`. Real items:
  `oatts-PS-063` (compression/rarefaction), `oatts-PS-064` (sound travels fastest in which
  medium — a solid, not a gas), `oatts-PS-065` (what determines pitch), `oatts-PS-066`
  (diffraction — sound bending around obstacles).
- `ch08-thermodynamics.js`: **28-32 facts** across `ps-heat-transfer-methods`,
  `ps-laws-of-thermodynamics`, `ps-thermal-expansion-phase-change`. Real items: `oatts-PS-067`
  (conduction — direct-contact heat transfer), `oatts-PS-068` (the first law of thermodynamics),
  `oatts-PS-069` (what heating does to particles).

Follow PART 20's fact-row rules exactly. Good same-chapter confusion candidates: "pitch" vs
"volume/loudness" vs "timbre"; "reflection" (echo) vs "diffraction" vs "the Doppler effect";
"conduction" vs "convection" vs "radiation"; first/second/third law of thermodynamics against
each other.

**Register the files** in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=ps-sound-b3-id
npm run afoqt:sample -- --only=ps-thermodynamics-b4-recall
```
(substitute your actual `idBase` values). `afoqt:coverage` must stop reporting `ps-sound-*` and
`ps-heat-transfer-methods`, `ps-laws-of-thermodynamics`, `ps-thermal-expansion-phase-change` as
orphans — this should be the LAST part that clears any `ps-*` concept off the orphan list.

---

### PART 22 — PS lessons, all 8 chapters

**Agent:** Sonnet / medium effort. No structural validator — hallucinated science facts or
teaching something no template tests will pass `afoqt:coverage` silently (it only checks concept
ids, not lesson accuracy). Flash and Haiku are not suitable for the same reason PART 12 (VA
lessons) ruled them out.

**Read first:** all 8 `ps-*` entries in `curriculum/chapters.js`, `curriculum/lessons.js` (the
import + map pattern), and two existing lessons as model — `curriculum/chapters/av/ch01-*.md`
(fact-heavy, knowledge-subtest voice, closest analogue) and `curriculum/chapters/wk/ch01-method.md`
(shorter, for pacing). This part should not run until PARTS 20/20B/21/21B have landed — pull
example facts FROM the finished `templates/ps/ch*.js` files so the lesson and the questions
cannot drift, the same instruction WK's lesson parts followed.

**Do:** create `curriculum/chapters/ps/` and write eight lesson files, one per chapter
(`ch01-astronomy.md` through `ch08-thermodynamics.md`), each covering exactly the concepts its
chapter declares in `curriculum/chapters.js`. Every fact-heavy chapter (like Aviation
Information's) reads best as a short method/orientation paragraph plus a reference table pulling
straight from the registered fact rows — not prose repeating sixty definitions in sentence form.

**Then register all eight** in `curriculum/lessons.js`: a `?raw` import per file plus a
`'ps-01-astronomy': ps01,` style map entry, keyed by the exact chapter id. That file is the one
exception to "touch only the files your part names."

**The binding rule applies in both directions (Doctrine rule 2):** every concept a chapter
declares must be TAUGHT in its lesson; the lesson must NOT teach anything no template tests. Do
not invent statistics, and do not cite a source you have not read in this packet.

**Verify:**
```
npm run afoqt:coverage
```
No orphan concepts for any `ps-*` chapter. Then confirm the markdown renders as plain markdown
(no raw HTML, no unclosed fences) and heading levels match the model lessons.

---

### PART 23 — PS test suite

**Agent:** Sonnet / medium effort. Mechanical in structure, but the "do not weaken an assertion"
trap applies here exactly as it did for WK/VA.

**Read first:** `engine/__tests__/aviation.test.js` as the closest model — it is the only
existing test file for `engine/facts.js`'s generic behavior, written against Aviation
Information's own data. `engine/__tests__/words.test.js` for the `_reset*`/anti-vacuity pattern
(rule 12 in section 3 of this file). Then `engine/facts.js` in full.

**Do:** create `engine/__tests__/physicalScience.test.js`. Vitest, `node` environment (no jsdom
docblock). Cover:

1. **Validator rejection.** Each `throw` in `registerFacts` gets a test that feeds it input which
   SHOULD fail and asserts it does (missing term/gloss, band out of range, no concepts declared,
   a shouting gloss, `identify: false` with no `recallStem`).
2. **`shoutedWord()`** — true for a genuine emphasis word, false for an allowlisted acronym
   (reuse a couple from Aviation Information's list plus any new one PART 20-21B's report flags).
3. **`identifyStem()`** — capitalizes the term, does not otherwise alter it.
4. **Bank invariants over the real registered PS rows** (import `../../templates/index.js` to
   load everything, same as `aviation.test.js` does): every fact id unique across the whole PS
   bank; every fact's `concepts` are declared by its chapter in `curriculum/chapters.js`; every
   `confusions` entry resolves to an id that exists AND shares that fact's chapter; no gloss
   shouts; every `sentence`/`gloss` combination reads as a real predicate (spot check a sample,
   don't try to automate the editorial judgment — that's what PART 20-21B's own read-aloud step
   is for).
5. **Determinism:** `generateInstance(id, seed)` twice gives a byte-identical question, for a
   `ps-*` template of each frame (identify and recall).
6. **Slate integrity** over every `ps-*` template at a few hundred seeds: five distinct choices,
   `correctIndex` in range 0-4, no choice text equal to another.

Do not weaken an assertion to make it pass. If a test finds a real defect in the bank, leave the
test failing and report it.

**Verify:**
```
npx vitest run src/pages/theknowledgebase/afoqt/engine/__tests__/physicalScience.test.js
```
This part is the one exception to the no-install rule: vitest needs `node_modules`. If the
packet has none, run `npm install` for this part only, and say so in your report.

---

### PART 24 — design + engine record (done 2026-08-26, Claude-only autonomous session per Trey's go-ahead)

Not farmed. Curriculum design AND engine work per section 4's not-farmable column — SJT needed
both, the way VA needed both PART 8 and PART 9. This is the record for whoever picks up PARTS
25/25B/25C/25D/25E.

**Grounded in the primary source, read directly, not reasoned about from RESEARCH.md's summary.**
Barron's 4th Ed's full Practice Test #1 SJT section (PDF 251-263) was extracted with
`scripts/extractBook.mjs` to the scratchpad (never the repo — copyright rule) and read in full: all
25 numbered situations, their five lettered actions each, and the SUBTEST #6/#7 directions verbatim.
This is the same "check the figure-bearing subtest's actual source before designing" discipline
Table Reading and Instrument Comprehension needed the hard way — nothing here was inferred from an
uncited summary line.

**What was built:**
- `curriculum/chapters.js` — a new `judgment` track, 7 chapters (`sjt-01-method` through
  `sjt-07-mentoring`), 15 concepts. One chapter per official competency (Integrity/Professionalism,
  Leadership, Resource Management, Communication, Innovation, Mentoring — `docs/afoqt/RESEARCH.md`
  "Situational Judgment"), plus a method chapter mirroring `va-01-method`'s "no templates of its
  own, concepts ride along on every question" role. `node --check` passed; `npm run afoqt:coverage`
  lists all 15 `sjt-*` concepts as orphans, which is the documented "already red" work-board state
  (section 3, rule 11), not a regression.
- `engine/judgment.js` — a NEW engine, not a wrapper around `facts.js` or `analogy.js`. SJT has no
  computed error-modes (no arithmetic) and no declared confusions (no dictionary meaning to mix up)
  — every one of the five actions in a scenario is an authored judgment call, and the SAME five
  actions answer TWO different questions (MOST effective, LEAST effective) about ONE situation, not
  one question about one thing. See the file's own header comment for the full reasoning; the short
  version is in the registrar contract below.
- **The MOST/LEAST pairing reuses the existing sheet mechanism (`SHEET_BITS`, built for Table
  Reading and Block Counting) rather than inventing a new one.** The real subtest asks MOST then
  LEAST back-to-back for one situation before moving to the next. `scenarioTemplates()` registers
  ONE template per chapter+band with `sheet: true, sheetSpan: 2`: the seed's high bits pick WHICH
  situation, the low bit picks MOST-vs-LEAST. `buildDrill`'s existing figure-rotation logic does the
  pairing for free, and `templateAudit.js`'s `seedForSample` already spreads any `sheet` template's
  high bits generically — nothing outside `engine/judgment.js` needed to change. **Verified working**
  with a throwaway smoke script (registered synthetic rows, walked `composeSeed(sheetSeed, 0)` and
  `composeSeed(sheetSeed, 1)` across 50 sheet seeds, confirmed every pair references the same
  situation and flips MOST→LEAST correctly, confirmed all six registrar validation guards actually
  reject bad input) before this record was written, then deleted — not committed, since it carried
  no real content, the same reason PART 8/PART 19 verified with `node --check` rather than leaving
  scratch files behind.

**The registrar contract (what PART 25/25B/25C rows must satisfy) — full detail lives in
`engine/judgment.js`'s own JSDoc, not repeated verbatim in every sub-part below:**
- `id`, `chapter` (an `sjt-0N-*` id), `concepts` (declared by that chapter), `band` (1-5 — **how
  CONTESTED the judgment call is, not vocabulary or arithmetic difficulty**: a scenario where
  competent officers would mostly agree is low-band; one where several actions have real merit and
  the distinction is genuinely fine is high-band)
- `situation` — original scenario prose, at least a real paragraph (the validator rejects anything
  under 40 characters as a placeholder, but that is a floor, not a target — write a real situation)
- `actions` — **exactly 5**, each `{ text, competency, rationale }`. `competency` must be one of the
  six ids in `engine/judgment.js`'s `COMPETENCIES` export (kebab-case: `integrity-professionalism`,
  `leadership`, `resource-management`, `communication`, `innovation`, `mentoring`) — this is what
  lets a miss report as "you picked the response that skipped the chain of command" rather than just
  marking it wrong, the same job `error`/`why` plays on every other subtest's distractors
- `mostEffective`, `leastEffective` — indices 0-4 into `actions`, must differ
- `tell` — one sentence naming the judgment PRINCIPLE at stake (what to recognise next time), not a
  restated summary of this one scenario — same job `tell` plays on a `morphology.js` pair or an
  `analogy.js` relation

**Every scenario always fills its slate exactly** — 5 actions, 1 correct, 4 automatic distractors,
for BOTH questions the situation asks. Unlike every other subtest here, there is no shortfall case
to guard against and no need to over-supply candidates.

**Scoring simplification, declared rather than hidden:** Barron's own directions note the official
key sometimes accepts two answers on one item — consensus is a distribution, not a single truth.
This engine models exactly one accepted MOST index and one accepted LEAST index per scenario. Where
a real source documents a genuine split verdict, pick the pedagogically clearer answer and record
the tension in that row's `tell` rather than trying to teach the tool multiple correct indices —
same "declare the bound honestly" convention as `stemSpace` elsewhere in this codebase.

**⚠ Two things recorded rather than resolved:**
1. **Scenario count is disputed, and this design does not commit to a fixed bank size.**
   `afoqtSpec.js`'s existing `pearsonNote` on `SJ` already says *"AFPC counts 50 questions across 16
   scenarios; Pearson counts the 16 scenarios."* But Barron's actual Practice Test #1 SJT section is
   **25** numbered situations producing exactly 2 questions each (1-50) — a different structural
   claim than "16 scenarios" would imply, from a source that reproduces two full official-style
   practice tests, not a footnote. Both are primary-lineage sources and they disagree on something
   more basic than a timing footnote. Built to **50 questions** (every source agrees on that) without
   baking either 16 or 25 into the data model — `engine/judgment.js` places no ceiling on bank size,
   so PART 25/25B/25C should build as many well-sourced scenarios as reasonably possible per chapter
   rather than stopping at either number.
2. **Innovation is thin in the sourced sample.** 24 of the 25 real situations turn on one of the
   other five competencies; the one that brushes innovation (a section leader inheriting an outdated
   process) reads more like leadership/delegation than a genuine "propose and champion a new idea"
   situation. `sjt-06-innovation` is declared anyway — same precedent VA's Part/Part and Sequence set
   (real but rare is still real, see PART 8's design record) — but PART 25C should pull a second
   source (Trivium's SJT section if it has one, or the AFPC pamphlet's own worked examples) before
   writing this chapter's rows, rather than inventing scenarios to fill a doctrine-compliant label.

**SDI decision (PART 26), Trey's call, 2026-08-26:** do not build it as an interactive tool. It is a
240-statement Likert-scale personality inventory (Strongly disagree … Strongly agree) with
explicitly no right or wrong answers and zero composite weight — there is nothing to drill or
master, so an interactive version would be a UI with no mastery concept behind it. Barron's directs
candidates to answer from first impression, comparing themselves to peers of the same age and sex,
in 45 minutes for 240 items (11.25s each) — that pacing fact and the format itself belong in
whichever chapter/reference material documents the whole exam's structure to Trey (not built this
session; flagged for whoever next touches exam-overview content, likely alongside PART 28's
full-length runner), not as a drillable subtest.

---

### PART 25 — `templates/sjt/ch02-integrity-professionalism.js`, `ch03-leadership.js`

**Agent:** Sonnet / high effort, not medium. Every other data-farming part on this board has a
mechanical validator that catches a real defect (a duplicate id, a band mismatch, a short slate).
This one's hardest failure mode is invisible to `engine/judgment.js`'s registrar entirely: a
scenario whose "correct" MOST or LEAST answer is actually debatable, or whose four distractor
actions are all so obviously bad that the item teaches nothing. That is a judgment call about
judgment calls, and a lighter model will confidently author a scenario that reads as arbitrary.
Haiku and Flash are not suitable. Gemini Pro is acceptable only if explicitly walked through 3-4 of
the real Barron's-style situations described below as calibration before writing its own.

**Read first:** `engine/judgment.js` in full (the registrar contract above is a summary, not a
substitute), `curriculum/chapters.js` (search `sjt-02-integrity-professionalism` and
`sjt-03-leadership` for the exact concepts each chapter owns), and the "PART 24 design record" above
in full — it names the primary source and the two open flags you need to know before writing a row.

**Do not read or request Barron's SJT text itself.** It is a copyrighted commercial book and this
site deploys publicly (CLAUDE.md rule 2, folder CLAUDE.md's hard constraint 2) — the calibration
books are a ruler, never a corpus. Write original scenarios in the same REGISTER: a first- or
second-person military workplace situation, one paragraph, ending in an implicit "what do you do?",
followed by five distinct plausible actions. The competency summaries below (from the design record,
themselves written without quoting the source) are what to calibrate against.

**Do:** create `templates/sjt/ch02-integrity-professionalism.js` and
`templates/sjt/ch03-leadership.js`. Target **at least 8-10 scenarios per chapter**, concentrated at
band 3 with a few at bands 2 and 4 (the engine needs 5+ rows in a band before `scenarioTemplates`
will build anything for it — see PART 24's design record on what "band" means here). Then call
`scenarioTemplates({ chapter, band, idBase, name })` for each band that reaches 5.

- `ch02-integrity-professionalism.js` — situations testing `sjt-honest-reporting` (reporting a fact
  accurately under social or authority pressure to shade it), `sjt-conflict-of-interest`
  (recognising and disclosing a personal entanglement before it biases a decision, not after),
  `sjt-owning-mistakes` (self-reporting an error promptly rather than concealing or minimising it),
  `sjt-fair-process-before-accusation` (gathering facts through the proper channel before acting on
  a suspicion about a colleague).
- `ch03-leadership.js` — `sjt-situational-authority` (acting at your ACTUAL level of authority —
  neither overstepping a decision that is not yours nor punting one that is), `sjt-standards-vs-morale`
  (holding a real standard while reading the team's actual state, not just cracking the whip or
  letting it slide), `sjt-crisis-triage` (sequencing safety, then mission, then administrative
  concerns under real time pressure), `sjt-difficult-personalities` (addressing a performance or
  behavior problem directly and privately, never by avoidance or public confrontation).

**Authoring rules specific to this content type:**
- **Every scenario needs a genuinely correct MOST and a genuinely correct LEAST**, and the other
  three actions should each be a recognisably different KIND of mistake (one overstepping, one
  under-reacting, one procedurally wrong, etc.) tagged with whichever competency that particular
  mistake violates — not necessarily the same competency the scenario is filed under. A scenario
  where all five actions are minor variations of the same idea fails the "genuinely correct" bar even
  if it passes the registrar.
- **Write the `rationale` for EVERY action**, not just the two that get used as the answer — a
  distractor's rationale is what a miss shows the candidate, the same as `why` on every other
  subtest's wrong choices.
- **The `tell` is a transferable principle, not a recap.** "Report facts accurately even when
  they're unwelcome, and route concerns through the person who can act on them" transfers to the next
  scenario; "In this situation, telling the supervisor was best" does not.
- **Vary the protagonist's rank/role and the setting** (a NCO's shop, a joint headquarters cell, a
  deployed convoy, an office) — five scenarios that are all "you are a new lieutenant in an office"
  will read as the same question five times even with different text.

**Register the files** by adding `import './sjt/ch02-integrity-professionalism.js';` and
`import './sjt/ch03-leadership.js';` in a new `// --- Situational Judgment` section of
`templates/index.js`. That file is the one exception to "touch only the files your part names."

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=sjt-02-b3-judge
npm run afoqt:sample -- --only=sjt-03-b3-judge
```
(substitute your actual `idBase` values in the last two). `afoqt:coverage` must stop reporting
`sjt-honest-reporting`, `sjt-conflict-of-interest`, `sjt-owning-mistakes`,
`sjt-fair-process-before-accusation`, `sjt-situational-authority`, `sjt-standards-vs-morale`,
`sjt-crisis-triage` and `sjt-difficult-personalities` as orphans. Read every sampled question aloud
— for this subtest specifically, ask yourself "would a reasonable officer actually pick this as
worst?" for every LEAST-effective answer, since an unconvincing LEAST is the single easiest defect
for this content type to ship invisibly.

---

### PART 25B — `templates/sjt/ch04-resource-management.js`, `ch05-communication.js`

**Agent:** Sonnet / high effort. Same risk profile as PART 25 — read that part's authoring rules in
full, they apply here unchanged and are not repeated verbatim below.

**Read first:** same as PART 25 (`engine/judgment.js`, "PART 24 design record"), plus
`curriculum/chapters.js` for `sjt-04-resource-management` and `sjt-05-communication`'s concepts. Skim
`templates/sjt/ch02-integrity-professionalism.js` once PART 25 lands, as a finished shape example —
if it has not landed yet, proceed from the contract alone.

**Do:** create `templates/sjt/ch04-resource-management.js` and `templates/sjt/ch05-communication.js`.
Same target as PART 25: **8-10 scenarios per chapter**, concentrated at band 3 with a few at 2 and 4.

- `ch04-resource-management.js` — `sjt-prioritization-under-scarcity` (ranking competing demands
  rather than trying to do everything or picking arbitrarily), `sjt-proper-channels-for-requests`
  (routing a cross-team resource ask through the correct chain rather than around it),
  `sjt-realistic-commitment` (communicating what is actually achievable rather than over-promising or
  flatly refusing).
- `ch05-communication.js` — `sjt-tactful-feedback` (delivering a hard message privately,
  specifically, without embarrassing the other person), `sjt-receiving-feedback` (responding to
  criticism by seeking clarity and improving, not defending or deflecting), `sjt-respectful-dissent`
  (raising a genuine concern to a superior through reasoned explanation — neither silent compliance
  nor insubordination), `sjt-proper-escalation` (routing a concern to the person who can actually
  address it rather than accusing or acting on assumption).

**Register the files** by adding `import './sjt/ch04-resource-management.js';` and
`import './sjt/ch05-communication.js';` to the same `// --- Situational Judgment` section PART 25
started in `templates/index.js`.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=sjt-04-b3-judge
npm run afoqt:sample -- --only=sjt-05-b3-judge
```
`afoqt:coverage` must stop reporting all seven `sjt-04-*`/`sjt-05-*` concepts as orphans.

---

### PART 25C — `templates/sjt/ch06-innovation.js`, `ch07-mentoring.js`

**Agent:** Sonnet / high effort, and read the "PART 24 design record"'s Innovation flag before
starting — this is the one chapter on the whole SJT board without a clean real-item anchor.

**Do not invent scenarios to hit a row count for `ch06-innovation.js`.** If, after genuinely trying
a second source (Trivium's SJT section if it has one, the AFPC pamphlet's own examples), you cannot
find real grounding for a distinct "propose/champion a new idea" situation beyond variations on "you
notice an outdated process," **report that as a live blocker** (what you tried, what you found) and
ship fewer than the target row count rather than padding it — this is exactly the kind of judgment
that produced 60 leaking-the-answer defects in Aviation Information and is invisible to every
structural check.

**Do:** create `templates/sjt/ch06-innovation.js` (`sjt-process-improvement`, `sjt-calculated-risk`)
and `templates/sjt/ch07-mentoring.js` (`sjt-developmental-coaching`,
`sjt-balancing-mentorship-with-workload`). Mentoring has decent real grounding (three of the 25
sourced situations touch it); target 8-10 rows there as usual. Innovation's target is soft — write
as many genuinely distinct, well-grounded rows as you can defend, report the count and why.

**Register** by adding the two imports to `templates/index.js`'s Situational Judgment section.

**Verify:**
```
npm run afoqt:selftest
npm run afoqt:coverage
npm run afoqt:sample -- --only=sjt-07-b3-judge
```
`sjt-developmental-coaching` and `sjt-balancing-mentorship-with-workload` must leave the orphan list.
`sjt-process-improvement`/`sjt-calculated-risk` leaving the orphan list is the goal but not a hard
gate if the blocker above is genuinely hit — report honestly rather than force a template into
existence with thin rows.

---

### PART 25D — SJT lessons, all 7 chapters

**Agent:** Sonnet / medium effort minimum, same risk class as PART 12 (VA lessons) — no structural
validator exists for lesson content, every check here is human judgment. Hallucinated statistics,
teaching a concept no template tests, and voice drift across seven files in one session are the
three specific failure modes that disqualify a lighter model. Haiku and Flash are not suitable.

**Read first:** `curriculum/chapters.js` (all seven `sjt-*` chapter entries), `curriculum/lessons.js`
(the import + map pattern), and two existing lessons as the voice/structure model:
`curriculum/chapters/va/ch01-method.md` and `curriculum/chapters/ps/ch01-astronomy.md` (once PART 22
lands; if not yet, use any existing `curriculum/chapters/*/ch01*.md`).

**Do:** create `curriculum/chapters/sjt/` and write seven lesson files, one per chapter id
(`ch01-method.md` through `ch07-mentoring.md`). `ch01-method.md` teaches the format itself: two
questions per situation (MOST then LEAST), no guessing penalty, and — the genuinely distinctive part
— that scoring is against **officer consensus, not a fixed answer key**, so the right frame for a
candidate is "what would a well-regarded officer actually do here," not "what is the textbook-correct
answer." The other six each teach their competency's specific judgment test (see the summaries in
`curriculum/chapters.js`'s `sjt-*` entries and PART 24's design record) with 2-3 worked examples —
written originally, never lifted from Barron's (see PART 25's "do not read or request Barron's SJT
text" note, which applies here too).

**Then register all seven** in `curriculum/lessons.js`: seven `?raw` imports and seven map entries
keyed by the exact chapter ids. That file is the one exception to "touch only the files your part
names."

**The binding rule applies in both directions (Doctrine rule 2):** every concept a chapter declares
must be taught in its lesson; the lesson must not teach anything no template tests. If PART
25/25B/25C have not fully landed by the time this part runs, a chapter's lesson can still be written
against its declared concepts — `afoqt:coverage` will keep reporting those concepts as orphans until
the scenario rows exist, which is expected, not a sign the lesson is wrong.

**Verify:** `npm run afoqt:coverage` — no orphan LESSON content (every concept the lessons teach is
declared by its chapter; coverage may still show concepts orphaned from the OTHER direction if
25/25B/25C haven't landed yet, which is fine). Confirm the markdown renders as plain markdown, no raw
HTML, consistent heading levels with the model lessons.

---

### PART 25E — SJT test suite

**Agent:** Sonnet / medium effort. Must write deterministic tests and bank invariants; the
`registerScenarios` guards need every one of them individually confirmed to actually reject bad
input (the anti-vacuity discipline section 3 rule 12 exists for), not just exercised.

**Read first:** `engine/__tests__/words.test.js` or `engine/analogy.js`'s eventual PART 13 test file
(once it exists) as the shape model, plus `engine/judgment.js` in full.

**Do:** create `engine/__tests__/judgment.test.js`. Vitest, `node` environment. Cover:

1. **Validator rejection** — one test per `throw` in `registerScenarios`: missing id, duplicate id,
   missing chapter, empty concepts, band out of range, short/placeholder situation, wrong action
   count, missing action text, invalid competency, missing rationale, duplicate action text,
   mostEffective/leastEffective out of range, mostEffective === leastEffective, missing tell. Use
   `_resetScenarios()` between cases — snapshot and restore the real bank around each test, per rule
   12 in section 3, so a test that registers a fake row cannot leave a later test running against it.
2. **Bank invariants** over the real registered rows (once PART 25/25B/25C exist): every scenario id
   unique across the whole bank; every scenario's `concepts` are declared by its chapter in
   `curriculum/chapters.js`; every action's `competency` is one of the six exported `COMPETENCIES`.
3. **The MOST/LEAST pairing mechanism** — this is the one thing genuinely novel to this engine and
   deserves its own dedicated tests, not just reuse of a generic pattern: for a chapter+band with a
   registered template, walk `composeSeed(sheetSeed, 0)` and `composeSeed(sheetSeed, 1)` across many
   sheet seeds and assert each pair (a) generates without error, (b) references the same underlying
   scenario, (c) the item-0 draw is tagged `most-effective` and item-1 is tagged `least-effective`.
4. **Determinism:** `generateInstance(id, seed)` twice gives a byte-identical question.
5. **Slate integrity:** every `sjt-*` template at a few hundred seeds produces exactly 5 choices, a
   valid `correctIndex`, and no two choices with identical text.

Do not weaken an assertion to make it pass. If a test finds a real defect in the bank, leave the test
failing and report it.

**Verify:**
```
npx vitest run src/pages/theknowledgebase/afoqt/engine/__tests__/judgment.test.js
```
One exception to the no-install rule: vitest needs `node_modules`. If the packet has none, run
`npm install` for this part only, and say so in your report.

---

### PART 27 — design record (done 2026-08-26, Claude-only autonomous session)

Not farmed. Engine work per section 4's not-farmable column, and the one real design question in
it (what does "composite score" even mean when the real one is unpublished) is not something to
farm out regardless. This is the record for whoever picks up PART 28/29/30.

**The blocker that shapes everything else here:** `docs/afoqt/RESEARCH.md` → "Scoring" already
established *"Composites are reported as percentiles 1 to 99 against a reference group - not
percent correct. Exact weightings and norming tables are unpublished."* That is Pearson/AFPC
proprietary IP, not a research gap — no further search closes it, and CLAUDE.md's rule against
declaring an external source unavailable from a sample of one does not apply here, because the
absence is already documented and confirmed, not assumed. A tool that fabricated a fake
percentile from practice accuracy would hand Trey false confidence (or a false alarm) on a test
with exactly one attempt that counts. So this file computes something different and says so
everywhere it surfaces.

**What was built:** `engine/scoring.js` — `subtestAccuracy()`, `compositeAccuracy()`,
`allCompositeAccuracy()`, all pure functions over the existing `templateStats` progress blob (no
new storage schema needed — `afoqtStorage.js` already tracked everything required per-template).
A composite's practice accuracy is the question-count-weighted average of its subtests' accuracy
(each subtest weighted by its real question count from `afoqtSpec.js` — closer to how a raw
composite is probably assembled than an unweighted average, but still a documented ASSUMPTION
about unpublished mechanics, not a citation — see the file's header). "No attempts yet" is
returned as `null`, never `0` — a composite nobody has touched must not read as "you are failing
this," and the UI (`AfoqtDashboard.jsx`) renders that distinction literally.

**Verified working end-to-end**, not just unit-level: a throwaway smoke script (registered fake
templates, hand-computed the expected weighted average, confirmed the engine matched exactly;
confirmed `null`-not-`0` on no data; confirmed the disputed SJT composite is excluded from the
default list) — deleted after, not committed, same convention as PART 24's engine verification.
Then wired into `AfoqtDashboard.jsx`'s existing (previously number-free) Composites section and
checked in a REAL BROWSER via a throwaway Playwright script (also deleted): the empty state
(screenshot: all six composites correctly read "no attempts yet"), and a populated state with real
MK/TR template ids seeded into `localStorage` directly (screenshot: PILOT/CSO/ABM/ACAD/QUANT all
showed the correct hand-verifiable weighted percentages and coverage fractions, zero console
errors). This is the UI-feature-contract discipline from the root CLAUDE.md ("a toggle must do the
thing it claims") applied to a number, not a toggle — a scoring engine nobody can see is exactly
as useless as `includeStretch` was before PART 33 wired it into `DrillConfig.jsx`.

**The one non-negotiable UI rule, for whoever touches this next:** never render a composite's
practice-accuracy percentage next to its official `min` (a PERCENTILE minimum) as though they are
on the same scale. The current dashboard render puts them in visually distinct lines with the
`min` line spelling out "Xth percentile — not the same scale as the accuracy above" explicitly,
every single time it appears, rather than trusting a reader to remember a rule stated once.
Collapsing that distinction is the single most dangerous mistake this feature could make.

**Explicitly NOT done, flagged for PART 28/29/30:** no full-length, properly-sequenced Form T exam
run (Part A → break → Part B, real administration order, the SJT/SDI slots included even though
SDI itself is not drillable per PART 26's decision); no trend-over-time view (only a snapshot of
current lifetime accuracy, no "accuracy this week vs last week"); no diagnostic mode seeded from
`realQuestions.json` (flagged as a good idea back in PLAN.md's "Recommended deviation" note from
Phase 0, never built). This session was scoped to "can a composite number exist at all, honestly,"
not the full exam-simulator experience.

---

### PART 31 — wire the TKB `*.selftest.mjs` scripts into vitest

`src/pages/theknowledgebase/engine/dedup.selftest.mjs` and `engine/engine.selftest.mjs` (note:
the **TKB** engine folder, not `afoqt/engine/`) are plain `node:assert` scripts that `npm test`
never runs, so they can rot without anyone noticing. Convert each into a vitest file under
`afoqt/engine/__tests__/`, or add a single test file that imports and executes each one and
asserts it does not throw. Do not change what they assert. Keep the vitest environment `node`.

**Verify:** `npx vitest run src/pages/theknowledgebase/` — every converted assertion runs and
passes, and the count of test files goes up.

---

### PART 32 — delete the dead `ingestion/` folder

`src/pages/theknowledgebase/ingestion/` (`mmluAdapter`, `openTdbAdapter`, `triviaApiAdapter`) is
the bulk-import code that put *"What are male cows called?"* into a Physical Science deck and
made the owner stop using the tool. It is slated for deletion.

**Before deleting anything**, grep the whole of `src/` for every symbol it exports and for the
folder path, and report what you find. If **anything** still imports it, delete nothing and
report that instead — the deletion is not the goal, the dead-code confirmation is.

**Verify:** `npx vitest run src/pages/theknowledgebase/` and `npm run afoqt:check` both
unchanged, plus the grep output proving nothing referenced it.

---

## 7. Receiving work back

1. Save the returned files to their stated paths. Nothing else moves.
2. Run `npm run afoqt:check` yourself. The agent's word is not the gate; the gate is the gate.
3. Run `npm run afoqt:sample -- --only=<one of the new template ids>` and **read three
   questions**. Structural checks cannot see a badly written question, and that is the defect
   class that actually reaches the study session.
4. Tick the box in section 5 above.
