# Question selection and where words actually live

Written 2026-09-04, after a long and expensive session that should not need repeating. Read this
before touching `engine/drill.js`, `engine/generator.js`, `engine/bank.js`, `engine/words.js`, or
answering any question of the form *"how many words are in this thing"*.

Companion docs: `WORD-BANK-EXPANSION.md` (where new words come from and how to author them) and
`QUESTION-DOCTRINE.md` (the two content rules). This file is about **selection** — which of the
questions that already exist actually reach the screen.

---

## The complaint that produced this file

Trey, after weeks of testing:

> "I've seen the word 'belie' like 30x overall throughout all my testing so a lot of words are
> clearly repeating. I haven't seen a new word in a while."

> "Every word should be in the same database and they should all have the same chance of showing
> up. It should all be one bank. By band or something so if I want easier words I do an easier
> band."

Both were correct, and neither was a content problem. **Everything below was invisible to
`afoqt:selftest`, `afoqt:coverage` and 4,400 passing tests**, because a repeated question and an
under-served word are both perfectly well-formed. Structural checks cannot see a distribution.

---

## 1. Words live in FOUR places, not one

This is the single most misleading thing about the subtest. "The word bank" is not one table.

| Source | Where | Count (2026-09-04) | Shape |
|---|---|---|---|
| **Word registry** | `engine/words.js` `REGISTRY` | **252** | Full `WordRow`: band, pos, gloss, charge, and four NAMED distractors |
| **Morphology examples** | `engine/morphology.js` root/affix rows | part of 105 | `examples[]` on a root — `artist`, `subway`, `circumference`. Bare word + gloss |
| **Confusable pairs** | `engine/morphology.js` `pairsFor` | part of 105 | `a`/`b` halves with a `tell` |
| **Static question bank** | `data/realQuestions.json` + `data/migratedAsvab.json` via `engine/bank.js` | **35 WK items** | Whole pre-written questions, not words |

**357 distinct headwords are askable in Word Knowledge. Only 252 are registry rows.** The other
105 reach the screen through `vocab` on a morphology or pair question and are never
registry-banded.

Consequences worth knowing before you "fix" anything:

- A word can legitimately be asked at two bands. `loquacious` is a band-4 registry row (*what
  does it mean?*) and also an example on the band-3 `wk-root-loqu` (*which word is built on a
  root meaning "to speak"?*). Those are different skills. **Do not "resolve" this by forcing one
  band** — there is a regression test explaining why.
- `allWords()` returns the registry only. It is **not** the set of askable words. Counting with
  it under-reports by 105.
- The static bank holds *questions*, so its items have no `vocab` and never enter the word bank
  (`addToWordBank`) or the miss pool (`getTemplate('bank:…')` is `undefined` by design).

---

## 2. How to count — four different numbers, all correct

Most of the confusion in this project has been unit confusion. State the unit every time.

| Number | What it is | WK value |
|---|---|---|
| **Templates** | `templatesFor('WK').length` | 60 |
| **Registry headwords** | `allWords().length` | 252 |
| **Askable headwords** | distinct `vocab.word` over every template's whole item space | 357 |
| **Distinct questions** | sum of item spaces across frames | ~895 |

"60" is templates and has never been the word count. Saying it without the unit is how a
reasonable question ("is the list only 60 words?") becomes unanswerable.

**Never derive a word count by grepping `band:`** — the string appears on morphology rows and
nested data as well as templates. Use the engine, per §5.

---

## 3. How a drill is assembled

`assembleDrill()` in `engine/drill.js`, three sources in priority order:

1. **Miss pool** — ~10% of slots (`MISS_INJECTION_RATE`). Registry/template items only.
2. **Generated** — `buildDrill()` in `engine/generator.js`.
3. **Static bank** — `composeDrill()` in `engine/bank.js`.

### The bank share is NOT half

`composeDrill`'s share was a flat `bankRatio: 0.5` until 2026-09-04. On a built-out subtest that
is badly wrong: 35 WK bank items against 252 registry words meant a 25-question drill took ~12
items from the same 35 **every run**, and a bank item was **~13x more likely** to appear than a
generated one. That is the whole of the `belie` complaint.

- `BANK_SHARE_WITH_TEMPLATES = 0.15` applies wherever generation can carry the run.
- `0.5` still applies where the bank is all there is — `composeDrill` returns early on empty
  `generated`, which is what the bank is actually for ("covers subtests whose template phase has
  not been built yet").
- The bank draw is **least-seen-first**, reading `progress.templateStats`. Lowering the share
  alone does not fix "I haven't seen a new word in a while": a uniform draw re-serves a seen item
  as happily as an unseen one. Shuffle *then* stable-sort, so equally-fresh items stay random
  instead of settling into a fixed rotation.

### Dealing is over ITEMS, not templates

`dealRounds()` in `engine/generator.js`. This is the part that was wrong twice.

- **Attempt 0 (original):** one slot per template. A WK template is a bag of words sized **7**
  (`wk-11-b4-syn`) to **40** (`wk-opposite-b2`), so a word in a small bag was **5.7x** more
  likely than one in a large bag — purely from how rows were filed, nothing to do with difficulty.
- **Attempt 1 (wrong):** one slot per `(template, word)` pair. Still unfair, because a word is
  askable by however many FRAMES accept it. A `sentence` enables the context frame, an `antonym`
  enables the opposite frame, a negative `charge` enables connotation. `indolent` got four
  tickets against `noisome`'s one.
- **Correct:** deal **distinct item keys**, then pick a frame from that word's own hosts.

Three pieces make it work, and all three are required:

| Piece | Where | Why |
|---|---|---|
| `itemPool: true` | word templates in `words.js` | "my items are independent and interchangeable" |
| `itemKeys: () => rows.map(w => w.id)` | same | groups the SAME word across frames into one ticket. Must be word **ids**, not headwords |
| word indexed by `h.item`, not `h.pick` | `generate` bodies | makes a word addressable by seed at all; the low 12 bits of the seed name the item |

A dealt entry can name an exact item, and `buildDrill` builds its seed as
`composeSeed(randomHigh, wantItem)` — high bits random so wording varies, low bits pinned so the
word cannot change. The dedup retry loop varies only the high bits.

**`varies: 'options'` templates keep ONE ticket regardless of item count.** The connotation frame
asks one fixed stem forever; dealing it per-item put three identical-looking questions into a
single 25-question run — the same repetition complaint arriving by a different route. Deal what a
person perceives as a question.

**Templates without `itemPool` keep exactly one slot per round, and must.** A Math Knowledge
template generates variants of ONE concept, so a second draw is a near-repeat. Weighting those by
item space brings back the original bug that `distinct` was built to fix: a 5-question gate
asking two isosceles-triangle questions and never mentioning the transversal.

---

## 4. The invariants, and what pins them

`engine/__tests__/wordFairness.test.js` and `engine/__tests__/bankMix.test.js`. These are the only
things standing between the fix and a silent regression — **nothing else can see a distribution.**

| Invariant | Test |
|---|---|
| Every registry word gets served | `serves every word in the registry` |
| Exposure spread is no wider than randomness alone | `spreads no wider than randomness alone would` |
| No band is favoured over another | `does not favour easy bands over hard ones` |
| `bands` restricts to templates of that band | `restricts a drill to templates of the requested band` |
| Every band can fill a full-length drill | `each band can actually fill a full-length drill` |
| Bank is a garnish, not half | `is a garnish, not half, once the subtest has templates` |
| Bank pool is covered before anything repeats | `serves every bank item before serving any of them a third time` |

**Fairness is asserted statistically, and must be.** A uniform draw is Poisson, so its spread is
`sqrt(mean)`, not zero. Asserting equal counts fails on randomness alone. Compare observed sd
against `sqrt(mean)` — the old selection sat at 6.4 against an expected 3.96.

### The measured before/after, so a regression is recognisable

Per 200 simulated 25-question WK drills:

| | before | after |
|---|---|---|
| band 2 mean exposure | 20.9 | 15.6 |
| band 3 | 22.3 | 15.9 |
| band 4 | 15.3 | 16.2 |
| band 5 | **11.7** | 14.8 |
| sd (uniform would be ~3.96) | 6.4 | 4.0 |

Per 30 drills, on the bank specifically: share 52% → 16%, distinct items 263 → 353, worst single
repeat x17 → x7, `belie` x13 → x4.

The band row is the one that mattered: **the harder half of the bank was being drilled at roughly
half the rate of the easy half** — the exact opposite of what a candidate aiming at band 4-5
needs.

---

## 5. How to measure any of this (do this instead of reasoning)

Plain `node` **cannot** import `engine/drill.js` — it reaches `engine/bank.js`, which imports JSON,
and Node ESM requires an import attribute Vite does not need. Symptom:
`ERR_IMPORT_ATTRIBUTE_MISSING`. This trap is also recorded in the root `CLAUDE.md` for PogoFilters.

**So: measure inside vitest, not with a scratch node script.** Write a temporary test under
`afoqt/engine/__tests__/`, run it with `--reporter=verbose` to see `console.log`, then delete it.

```js
import { it } from 'vitest';
import '../../templates/index.js';
import { assembleDrill } from '../drill.js';
import { allWords } from '../words.js';
import { mulberry32 } from '../../../engine/rng';

it('measure', () => {
  const progress = { templateStats: {}, missPool: {} };   // carry it forward between runs,
  const counts = new Map();                               // or least-seen-first cannot work
  for (let s = 0; s < 200; s++) {
    for (const q of assembleDrill({ subtest: 'WK', count: 25, rng: mulberry32(s * 2654435761 + 7), progress })) {
      const w = q.vocab?.word?.toLowerCase();
      if (w) counts.set(w, (counts.get(w) || 0) + 1);
      const p = progress.templateStats[q.templateId] ?? { seen: 0, correct: 0, totalMs: 0 };
      progress.templateStats[q.templateId] = { ...p, seen: p.seen + 1 };
    }
  }
  // Measure over the REGISTRY. A word that never appeared must count as a zero, and it cannot
  // if the population is "words that appeared" - that error hides the exact bug you are hunting.
  console.log(allWords().map((w) => counts.get(w.word.toLowerCase()) || 0));
});
```

Two mistakes that cost real time here, both worth avoiding:

- **Measuring over what turned up rather than over the registry.** Words never served vanish from
  the denominator and the distribution looks fine.
- **Counting `q.vocab.word` without checking it is a registry row.** 105 askable headwords are
  not, so the population is silently mixed and outliers (`artist x1`) look like bias when they are
  a different table entirely.

To enumerate a template's whole item space, walk `h.item` directly rather than sampling seeds:

```js
generateInstance(t.id, ((0x2ab3d & 0xfffff) << 12) | i)   // i = 0 .. t.stemSpace - 1
```

---

## 6. Still open

- **It is still not literally one bank.** 105 of 357 askable headwords live in `morphology.js`
  rather than the registry. Unifying them is a data migration, not a selection change.
- **~1,000 words are unauthored.** `data/wordCandidates.csv` holds 1,146 sourced candidates; 145
  are live. Now that selection is fair, **this is the dominant cause of seeing familiar words** —
  252 registry words against 25-question drills is simply a small pool. They cannot be bulk
  imported: every row needs a gloss and four named distractors, and bulk import with generic
  distractors is what polluted the ASVAB deck. See `WORD-BANK-EXPANSION.md`.
- The 25 migrated ASVAB WK bank items are all labelled `difficulty: 'basic'` → band 2, and are
  not basic (`ephemeral`, `garrulous`, `obstinate`, `candor`). That is the per-block difficulty
  labelling the folder `CLAUDE.md` names as the ASVAB deck's original defect, arriving through
  the migration. Re-band per item — **on the AFOQT-side copy only; the ASVAB deck is read-only.**

---

## 7. The general lesson

Every defect in this file passed every structural check and was found only by **measuring a
distribution**. `afoqt:selftest` proves a question is well-formed; `afoqt:coverage` proves it is
traceable. Neither can tell you that a well-formed, traceable question is being asked thirteen
times more often than it should be.

When a user says "I keep seeing the same thing", that is a measurement report. Reproduce the
number before forming a theory, and state the unit.
