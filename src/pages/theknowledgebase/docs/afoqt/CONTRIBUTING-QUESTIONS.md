# Contributing Questions & Data — hand-off spec

For **Trey** dumping material from Quizlet/Reddit/books, and for **outside AI agents**
generating bulk content. Read `QUESTION-DOCTRINE.md` first — it is short and binding.

---

## Golden rule for Trey: DUMP RAW. DO NOT FORMAT.

Do **not** hand-write JSON. Do not clean up, reorder, or "fix" anything. Paste exactly
what the source gives you into `src/pages/theknowledgebase/afoqt/data/raw/`, one file per
source, with two header lines:

```
# source: https://quizlet.com/12345/afoqt-word-knowledge/
# subtest: WK
BENEVOLENT	generous, kind
ARDUOUS	tiring, difficult
...
```

That is it. A parser script converts raw → validated JSON.

**Why raw and not JSON:** the `/TT` transcript tool already proved this pattern — the raw
registrar text is the source of record and the JSON is generated. Hand-editing JSON wastes
your time, introduces typos, and means a parser bug is destructive instead of just
re-runnable. Raw files are the source of truth forever.

**Subtest codes:** `VA` `AR` `WK` `MK` `RC` `PS` `TR` `IC` `BC` `AI` `SJ`

Quizlet's native export is tab-separated `term<TAB>definition` — paste it verbatim.
For Reddit or prose sources, paste the whole post; the parser tolerates prose and a human
reviews what it could not parse. **A parse miss must degrade to "shown verbatim for
review", never to "silently dropped."**

---

## For outside AI agents: data row schemas

You are generating **data rows**, not questions. Templates (the actual question logic,
distractor design, and difficulty banding) are written by Claude and are not farmed out.

Every file ships with a validator. **Your output does not need to be trusted** —
`npm run afoqt:validate` mechanically rejects malformed or off-band rows before they reach
the app. Do not worry about being perfect; worry about being schema-correct.

### `data/words.json` — Word Knowledge (target 800–1500)

```json
{ "word": "ARDUOUS", "pos": "adj",
  "definition": "requiring great effort; difficult and tiring",
  "synonym": "tiring",
  "band": 3,
  "nearMisses": ["simple", "immediate", "fast", "joyful"] }
```

- `band` 1–5. Level is **GRE/SAT / high-school-to-college**.
- `nearMisses` are the whole point: **plausible-but-wrong** options. The official
  `REPLENISH` item offers *furnish / provide / refill / stock / refinish* — four are
  adjacent, only **refill** is a true synonym. Reproduce that pattern.
- ⚠ Word Knowledge allows **12 seconds per question**. These must be recognisable at a
  glance, not reasoned out.

### `data/analogyPairs.json` — Verbal Analogies (target 400–600)

```json
{ "relation": "Cause/Effect", "a": "burn", "b": "blister", "band": 2 }
```

Use **only the official AF relation taxonomy**, extracted from OATTS answer keys:
`Part/Part` · `Part/Whole` · `Member/Category` · `Cause/Effect` · `Sequence` ·
`Object/Attribute` · `Action/Object` · `Synonym` · `Antonym` · `Degree`

Two official discriminators to respect:
- **Level of association must match** — *"lemons are always sour, but the sky is not
  always clear."*
- **Degree of separation must match** — Fruit→Lemon→Sour vs Vegetable→Carrot→Nutritious.
- **Order matters.** A reversed pair is the standard trap; keep `a`/`b` in the stated order.

### `data/aviationFacts.json` — Aviation Information (target 400–600)

```json
{ "topic": "control-surfaces",
  "claim": "The elevator controls pitch about the lateral axis",
  "distractors": ["roll about the longitudinal axis",
                  "yaw about the vertical axis",
                  "roll about the lateral axis"],
  "why": "Elevators change pitch by altering the horizontal stabilizer's lift.",
  "band": 2 }
```

`topic` must be one of the chapter concept ids (see `curriculum/index.js`) — this is what
`afoqt:coverage` checks. **A fact with no matching chapter concept is rejected.**
Primary free source: the [FAA PHAK](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak).

### `data/scienceFacts.json` — Physical Science (target 300–500)

Same shape as aviation facts. **Only these eight areas** (official OATTS breakdown):
Astronomy · Chemistry · Atomic Physics · Electrical Physics · Light Physics ·
Mechanical Physics · Sound Physics · Thermodynamics.
⚠ **No biology, no earth science** — those were removed when General Science became
Physical Science in 2014. Conceptual, almost no computation.

### `data/passages.json` — Reading Comprehension (target 60–100)

```json
{ "id": "rc-001", "wordCount": 480, "lineNumbered": true,
  "text": "...", "band": 3,
  "questions": [ { "type": "main-idea", "stem": "...", "choices": ["..."],
                   "correctIndex": 2, "why": "..." } ] }
```

- **400–600 words**, with line numbers referenced by questions.
- Register is deliberately **PME / Joint-Force strategic prose** — the official sample is a
  military strategic assessment, not a magazine article.
- 4–6 questions per passage, five choices each.
- Types: main-idea · vocabulary-in-context · detail-inference · function-of-paragraph ·
  author-agreement.
- Passages must be **originally written or public domain**. Do not copy published passages.

### `data/sjtScenarios.json` — Situational Judgment (target 60–100)

```json
{ "id": "sj-001", "scenario": "...",
  "actions": ["A...", "B...", "C...", "D...", "E..."],
  "mostEffective": 2, "leastEffective": 4,
  "competency": "Leadership" }
```

Each scenario is answered **twice** (MOST then LEAST effective). Competencies are the
official six: **Integrity and Professionalism · Leadership · Resource Management ·
Communication · Innovation · Mentoring**. Scenarios involve junior officers (O1–O3).
Consensus pattern: escalate appropriately, address people directly and privately first,
don't go over someone's head prematurely — and **"do nothing / avoid" is almost always the
LEAST effective option**.

---

## Rules that apply to ALL contributions

1. **Respect the difficulty band.** Iterations of a question stay at that question's level.
   `2+2` iterates to `3+4`, never to `2×354`. See Doctrine Rule 1.
2. **Distractors are error-modes**, never random noise.
3. **No trick wording, no double negatives**, no "Which of the following is NOT…" stems
   whose options got lost. That class of item is exactly what polluted the old ASVAB deck.
4. **One clear question.** Keep stems short; the old deck's 1,199-character import is the
   anti-pattern.
5. **No verbatim commercial content.** Books calibrate; they do not supply text.
6. **Every fact/topic must map to a chapter concept**, or `afoqt:coverage` rejects it.
7. **A WRONG OPTION MUST BE DEFENSIBLY WRONG, not merely weaker than the answer.** The test:
   *if a candidate who knows the word perfectly picked this option, would they have a legitimate
   grievance?* If yes, the item is broken. This is the hardest rule to satisfy and the only one
   NO check can enforce - `engine/words.js`'s own header says why: "English is full of
   near-synonyms, so a blind draw will eventually offer a second correct answer, and no
   structural check can catch it because both options are perfectly well-formed words."

   It bites the `related` field hardest, because "same semantic field" and "acceptable answer"
   are a hair apart. Found in an authoring pass on 2026-09-04, after 8,000-sample selftest,
   coverage and 4,475 tests all passed clean:

   | Word | answer | `related` shipped as | why it was broken |
   |---|---|---|---|
   | jingoism | nationalism | **patriotism** | the row's own gloss read "extreme, belligerent *patriotism*" |
   | chauvinism | bias | **nationalism** | aggressive nationalism is chauvinism's primary sense - and it was `jingoism`'s ANSWER two rows away |
   | renounce | relinquish | **reject** | to renounce a belief is to reject it |
   | polarize | divide | **antagonize** was needed; it shipped **separate** | gloss read "to *divide* into two..." |
   | undermine | weaken | **sabotage** | a straight synonym for covert weakening |

   Two habits that catch it: **read the gloss and the option list together** - if the gloss
   contains the distractor, stop; and **check the chapter against itself** - one word's
   distractor must not be another word's answer.

   🔴 **NARROWING THE GLOSS DOES NOT FIX AN AMBIGUOUS DISTRACTOR.** The candidate never sees the
   gloss. A Word Knowledge question is the headword in capitals and five options - nothing else;
   the gloss appears only in the explanation, AFTER the answer is locked in. So an author who
   finds `BLIGHT` offering both `scourge` and `disease` and "fixes" it by editing the gloss to
   drop the plant-disease sense has changed nothing a test-taker can see, and shipped an item
   with two defensible answers. (Real, caught in review 2026-09-04.) The fix is always to change
   the OPTION - there `disease` became `weed`: same field, unmistakably not the word.

## Validate before handing back

```
npm run afoqt:validate
```

Fix what it reports. Malformed rows are rejected, not silently repaired.
