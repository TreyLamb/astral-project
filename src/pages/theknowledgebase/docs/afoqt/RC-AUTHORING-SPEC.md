# RC authoring spec — read this in full before writing a single passage

You are authoring Reading Comprehension passages for an **AFOQT (Air Force Officer Qualifying
Test) Form T** training tool. The candidate sits the real test in early October 2026 and gets
effectively one attempt. Content that is merely *plausible* is not good enough — a passage that
teaches a wrong reflex is worse than no passage at all.

Your batch prompt names your **passage ids, band, and topic domains**. Everything else is here.

---

## 1. The file you produce

One `.js` file, matching the existing files exactly in shape. Copy the structure of
`src/pages/theknowledgebase/afoqt/templates/rc/ch01-passages-set-A.js` — **read it first**, it is
the reference implementation.

```js
// Reading Comprehension, Set <X> — band <N>.
// <one line on what topic domains this set covers>

import { registerPassages } from '../../engine/passage.js';

const P25_LINES = [
  'First line of the passage, about 12-18 words long.',
  'Second line. Every entry in this array is ONE NUMBERED LINE on screen.',
  '',                                    // <- a blank line IS a numbered line. See §3.
  'First line of the second paragraph.',
];

registerPassages([
  {
    id: 'rc-025', wordCount: 487, band: 3, lineNumbered: true,
    text: P25_LINES.join('\n'),
    questions: [ /* exactly 6, see §4 */ ],
  },
  // ... the rest of your batch
]);
```

**Do NOT call `passageTemplates()` in your file.** Template registration is centralised and
already exists — a second call would register duplicate template ids and throw at import. Your
file registers passages only. Nothing else.

---

## 2. The passage

- **400–600 words, and the DECLARED `wordCount` must match the real count within 25.** Count it.
  Eleven of the first twenty-four passages declared a number that was wrong by up to 63 words.
  Target **470–540** so you are nowhere near either edge.
- **Register: PME / Joint-Force strategic prose.** The official AFOQT sample is a military
  strategic assessment, not a magazine article. Formal, expository, third person, no rhetorical
  questions, no direct address, no jokes, no scene-setting narrative. It should read like a war
  college reading, a service journal article, or a government analytic report.
- **5–7 paragraphs**, separated by a blank array entry.
- **Every line 12–20 words.** Over 22 words and a "line N" reference becomes hard to eyeball.
- **A real argument with real structure.** The passage must contain: a claim, at least two
  distinct kinds of support for it, at least one qualification or counter-consideration, and a
  close that does something other than restate the opening. Questions of type
  `function-of-paragraph` and `author-agreement` are unanswerable without this.
- **Use ASCII punctuation.** Hyphen `-` not en/em dashes, straight quotes. The codebase is
  consistent about this and a smart quote inside a JS string literal is an easy escaping bug.

### Sourcing — read this carefully

**Passages must be originally written or public domain. Never copy a published commercial
passage.** This is a standing project rule
(`docs/afoqt/CONTRIBUTING-QUESTIONS.md`, and constraint 2 in the folder `CLAUDE.md`): Barron's,
Trivium and the other prep books are **a ruler, not a corpus** — they calibrate difficulty, they
are not a source of text. They are third-party commercial products with no licence to
redistribute.

What you *should* do instead of inventing from nothing:

- **Ground every passage in real, verifiable subject matter.** Real doctrine, real campaigns, real
  technology, real institutions, real science. A passage about how airlift throughput is actually
  measured beats a vague one about "logistics" every time, and gives the detail questions
  something to bite on.
- **US federal government publications are public domain by statute (17 USC §105)** and are a
  legitimate basis: Air University Press, the Air Force Historical Support Division, NASA, NOAA,
  USGS, GAO, the Congressional Research Service, DoD doctrine publications. You may draw facts,
  framing and structure from material like this freely.
- Write the prose yourself in the register above. Do not reproduce long verbatim stretches of any
  single source, and do not attribute quotes to named living people.

---

## 3. LINE NUMBERING — the defect class that nothing else catches

The renderer numbers lines by splitting the joined text on `\n`. So:

- **Line numbers are 1-indexed.** `P_LINES[0]` is **line 1**.
- **A blank paragraph-separator entry `''` IS a numbered line.** If your first paragraph is 6
  lines and then a blank, the second paragraph starts at **line 8**, not line 7.
- A stem that says `As used in line 14, "redundancy" most nearly means:` is **broken and
  unanswerable** unless `P_LINES[13]` actually contains the word `redundancy`.

**Count your array indices before writing any line reference, and count them again after.** This
is the single most common way to ship a broken RC item, and `registerPassages()` cannot see it.
`npm run afoqt:rc-lint` checks every reference against the line it names — run it (§7).

---

## 4. The questions — exactly 6 per passage

Five valid types, spelled exactly:

| type | asks |
|---|---|
| `main-idea` | the central claim of the whole passage |
| `vocabulary-in-context` | what a specific word means **at a cited line** |
| `detail-inference` | something the passage supports but does not state outright |
| `function-of-paragraph` | what a paragraph *does* in the argument (not what it says) |
| `author-agreement` | which statement the author would agree/disagree with |

**Per-passage spread: use at least 4 of the 5 types, doubling two of them to reach 6.** Rotate
which two you double across your batch. A passage carrying fewer than 3 distinct types breaks
sheet-mode drills — the engine has to abandon the on-screen passage and fetch a question from a
different one.

⚠️ **Double `detail-inference` or `vocabulary-in-context`, not `main-idea`.** A passage has many
details and many hard words, so two of those are genuinely two questions. It has exactly one main
idea, so "Which choice best states the main idea?" and "The primary purpose of the passage is to:"
are the same question wearing two hats — a candidate who answers one has answered both, and it
burns a slot that could have taught something. `author-agreement` and `function-of-paragraph`
double acceptably only if you aim them at genuinely different paragraphs or different claims.

Each question is:

```js
{
  type: 'detail-inference',
  stem: 'Based on the passage, why might a peacetime planner favor a single efficient route?',
  choices: [ /* exactly 5, all distinct */ ],
  correctIndex: 2,
  why: 'The passage says the single-route plan "looks better on a budget spreadsheet" in peacetime, while redundancy costs money against a risk that has not yet materialised.',
}
```

- **`why` must cite what in the passage settles it** — quote or paraphrase the deciding sentence.
  At least 15 words. "Option C is correct" is not an explanation.
- **No `all of the above` / `none of the above`.** Not an AFOQT option form.
- **No `Which of the following is NOT...`**, no double negatives, no trick wording.
- **Vary `correctIndex` across 0–4** roughly evenly within your batch. (The engine shuffles the
  slate at render, so this does not reach the candidate — but keep it clean anyway.)

### 🔴 4a. DISTRACTOR LENGTH PARITY — the rule most likely to be broken

**The correct answer must NOT be noticeably longer or more detailed than the distractors.**

This is the defect that got the linter written. In the first 24 passages, **86% of questions had
a correct answer far longer than every wrong option** — so "pick the longest choice" scored 86%
without reading the passage. It survives the choice shuffle, and it trains a reflex that scores
nothing on the real test.

Bad, and typical:

```
A. Fuel trucks are important.                                                  <- 4 words
B. Sustainment is an unglamorous but decisive part of military planning,
   because a force that cannot resupply itself eventually stops fighting
   regardless of the skill of its personnel.                                   <- 27 words  CORRECT
C. Armored advances outrun supply lines.                                       <- 5 words
```

Good:

```
A. Fuel resupply is the single hardest logistical problem a modern army faces.
B. Sustainment is unglamorous but decisive, because a force that cannot resupply stops fighting.   CORRECT
C. Armored advances inevitably outrun their supply lines once momentum builds.
D. Redundant supply routes are always worth their additional cost in wartime.
E. Real-time inventory tracking has replaced pre-positioned stock in modern planning.
```

Concretely: **keep all five choices within roughly ±40% of each other in word count.** Every
distractor should be a full, specific, confident-sounding statement — a plausible misreading, not
a stub.

### 4b. Distractors are error-modes, never noise

Each wrong option must be a **specific mistake a real reader would make**:

- a **true detail from the passage** offered as the main idea (the commonest and best distractor)
- an **overstatement** of something the passage says with a qualification ("always", "never")
- a claim the passage **mentions but attributes to someone else**
- a **plausible outside fact** the passage never actually supports
- the **opposite** of what a cited line says, phrased confidently
- for `vocabulary-in-context`: the word's **other common sense**, wrong in this context

Never write a filler option that is obviously irrelevant. Five real candidates or the item is a
four-option question wearing a five-option coat.

---

## 5. Bands

Your batch is a single band. Difficulty is **vocabulary and syntactic load**, never trickery, and
never a shorter passage.

| band | prose | vocabulary | questions |
|---|---|---|---|
| **2** | short declarative sentences, direct argument | common | answer usually in one located sentence |
| **3** | longer sentences, layered argument, some subordination | standard test-prep level | one inferential step |
| **4** | long multi-clause sentences, argument spread across paragraphs | low-frequency, GRE-adjacent | two inferential steps, or synthesis across paragraphs |
| **5** | dense, heavily qualified, concessive structures | the lowest-frequency in the bank | the author's *position* must be separated from positions they describe |

Band 5 in particular should require the reader to distinguish what the author argues from what
the author reports others arguing. That is the skill the hardest real items test.

---

## 6. Topic domains

Your prompt assigns you specific domains. Stay in the PME register while varying subject —
**do not write six passages about supply lines.** Each passage in your batch must be on a clearly
distinct subject, and must not overlap the topics already used:

> sustainment/logistics · armored advance tempo · intelligence assessment · alliance
> burden-sharing · air superiority doctrine · deterrence theory · civil-military relations ·
> command and control · military innovation cycles · irregular warfare

---

## 7. Before you report done — self-check

1. **Word counts.** Actually count each passage. Declared within 25 of real, and inside 400–600.
2. **Every line reference.** For each `line N` in a stem, count to entry N in the array
   (1-indexed, blanks included) and confirm the quoted word is on it.
3. **Length parity.** Read each slate. Is the correct answer conspicuously the longest? Fix it by
   lengthening distractors, never by shortening the answer into something inaccurate.
4. **Types.** At least 4 distinct types per passage, 6 questions.
5. **Answer positions** spread across 0–4.
6. **Read three of your questions out loud.** Every RC defect this project has shipped was
   well-formed and was caught by reading, not by a checker.

Then run, from the repo root, pointing it at **your own file only**:

```
node scripts/afoqtRcLint.mjs --file=src/pages/theknowledgebase/afoqt/templates/rc/<your-file>.js --verbose
```

It checks line references, word counts, type spread, length tells and choice hygiene, and reports
on just the passages your file registers. **It must exit clean with zero errors and zero
warnings.** Fix what it reports and run it again until it does.

Do **not** add your file to `templates/index.js` — several batches are being authored at once and
that file is integrated centrally afterwards. `--file=` is exactly why it exists.

Report the final output verbatim in your summary.

---

## 7a. 🔴 Write your file after EVERY passage — never batch the write to the end

On 2026-09-11 ten agents authoring these passages were killed mid-flight by one session rate
limit. The three that had already written a file survived; the seven composing in context lost
everything. One died on the sentence "Now I'll assemble the full file with all six passages."

So: **write the file when passage 1 is done. Append passage 2 when it is done. And so on.**
Every save must leave the file syntactically valid — close the `registerPassages([...])` call each
time and re-open it to append — so that if you stop early, what exists is still usable. A
partial-but-valid file is recoverable; a half-written one is worth nothing.

Do not hold a finished passage in context waiting for its siblings.

---

## 7b. Vary your boilerplate stems — across passages, not just within one

`registerPassages()` rejects a duplicate stem **within** one passage, and `templateAudit` keys item
identity off the stem **across** the whole band. So six passages all asking *"Which choice best
states the main idea of the passage?"* count as **one** item, and `afoqt:selftest` fails the
template with "only 13 distinct stems, but stemSpace declares 24".

Define a pool of **six differently-worded variants** for each boilerplate type at the top of your
file (`ch02-passages-set-B.js` and `ch04-passages-set-D.js` both do this) and rotate through it.

Two traps:

- **Your variants must not duplicate wordings another set already uses.** Grep the other `rc/`
  files for your candidate stems before committing to them. Set D's pool collided with Set B's on
  three of six.
- **A stem and its choices form a grammatical unit.** `The primary purpose of the passage is to:`
  needs infinitive choices, `...would most likely agree that:` needs a lowercase clause, and a
  question-form stem needs full capitalised sentences. Swapping a stem across frames leaves an
  ungrammatical question that **no checker will catch**. Keep each variant pool inside one frame.

---

## 8. What to report back

- The file you wrote and the passage ids in it.
- The final `afoqtRcLint.mjs` output.
- Anything you could not do, and why. **Do not silently drop a passage or a question type** — if
  you cannot make one work, say so explicitly and say what you tried.
