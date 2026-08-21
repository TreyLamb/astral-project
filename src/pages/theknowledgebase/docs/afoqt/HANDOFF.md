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
Copy-Item -Recurse src\pages\theknowledgebase "$dst\src\pages" -Exclude ResearchPics
Compress-Archive "$dst\*" "$env:USERPROFILE\Desktop\afoqt-packet.zip" -Force
```

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
`[P]` paused, waiting on Trey.

### Phase 9 — Word Knowledge

- [x] **PART 1** — `templates/wk/ch03-affixes.js` — 24 affix rows *(done 2026-08-21)*
- [x] **PART 2** — `templates/wk/ch06-change-degree.js` — 60 word rows *(done 2026-08-21)*
- [x] **PART 3** — `templates/wk/ch02-roots.js` — 30 roots *(done 2026-08-21)*
- [x] **PART 4** — `templates/wk/ch04-confusables.js` — 28 pairs *(done 2026-08-21)*
- [ ] **PART 5** — WK lessons, chapters 1-3  ← **next, and `npm test` is RED until PART 5 and PART 6 both land**
- [ ] **PART 6** — WK lessons, chapters 4-6
- [ ] **PART 7** — WK test suite

### Phase 10 — Verbal Analogies

- [L] **PART 8** — VA research + curriculum design *(Claude)*
- [L] **PART 9** — `engine/analogy.js` relation engine *(Claude)*
- [L] **PART 10** — VA relation rows, set A
- [L] **PART 11** — VA relation rows, set B
- [L] **PART 12** — VA lessons
- [L] **PART 13** — VA test suite

### Phase 11 — Reading Comprehension

- [L] **PART 14** — RC design + passage engine *(Claude)*
- [L] **PART 15** — RC passages, set A
- [L] **PART 16** — RC passages, set B
- [L] **PART 17** — RC lessons
- [L] **PART 18** — RC test suite

### Phase 12 — Physical Science

- [L] **PART 19** — PS curriculum design *(Claude)*
- [L] **PART 20** — PS fact rows: mechanics, forces, energy
- [L] **PART 21** — PS fact rows: matter, chemistry, earth and space
- [L] **PART 22** — PS lessons
- [L] **PART 23** — PS test suite

### Phase 13 — Situational Judgment + Self-Description Inventory

- [L] **PART 24** — SJT design *(Claude — see the disputed-composite note in CLAUDE.md; SJT may well be scored, do not deprioritise it)*
- [L] **PART 25** — SJT scenario rows
- [L] **PART 26** — SDI

### Phase 14 — Exam simulator, scoring, dashboard

- [L] **PART 27** — composite scoring engine *(Claude)*
- [L] **PART 28** — full-length Form T exam runner *(Claude)*
- [L] **PART 29** — diagnostic + dashboard
- [L] **PART 30** — results and analytics

### Standing chores

- [ ] **PART 31** — wire `afoqt/engine/*.selftest.mjs` into vitest
- [ ] **PART 32** — delete the dead `ingestion/` folder
- [P] **PART 33** — Math Knowledge band-5 `stretch` templates *(needs Trey's yes first)*

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
