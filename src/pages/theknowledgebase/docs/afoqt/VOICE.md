# Voice — read-aloud and answer-out-loud

Built 2026-09-03 from Trey's request: *"I want to be able to hear the question read well and then
if possible reply with voice for my answer... it has to be super smooth."* Plus the fallback he
named himself: *"just voice for the question and make simple touch for the 4 buttons after the
question is read. the screen on mobile should be like 90% answers 10% question."*

**Both halves are built.** Speaking your answer is possible in Chrome, Edge and Safari, so the
fallback is not a fallback — it is the layout that ships alongside it.

---

## Where it lives

| File | What |
|---|---|
| `afoqt/engine/speech.js` | **Pure.** Text → speakable text, question → utterance list, utterance → action. All the judgement is here, so all of it is testable. |
| `afoqt/engine/__tests__/speech.test.js` | 40 tests. Every one is a real string the generator emits. |
| `afoqt/voice/useSpeaker.js` | `speechSynthesis` wrapper + voice ranking + the four browser bugs. |
| `afoqt/voice/useListener.js` | `SpeechRecognition` wrapper + the echo problem + auto-restart. |
| `afoqt/voice/useQuestionVoice.js` | Composes the two for one question. The only thing a runner imports. |
| `afoqt/voice/VoiceBar.jsx` | The control strip and the settings panel. |

Wired into **all three runners** — `DrillRunner`, `ExamRunner`, `DiagnosticRunner` — through the
same hook, so a fix lands in all three at once.

---

## "Read well" is a data problem, not an API problem

This is the part that took the work. Hand `11 + 7(12 - 8)^2 = ?` to a synthesiser and it says
*"eleven plus seven twelve eight two"* — it drops every operator silently. Hand it
`BENEVOLENT most nearly means:` and it spells **B-E-N-E-V-O-L-E-N-T**, because engines treat an
all-caps run as an initialism. A Word Knowledge item read that way is unanswerable.

So the transforms were built from an **inventory of the real bank** — every non-alphanumeric
character and every all-caps token the generator emits across all 354 templates — not from a guess
at what a math stem looks like. That inventory is why the rules are the shape they are:

| Subtest | Notation in the bank |
|---|---|
| MK | `- ( ) + ^ . / , = π : % √ $ ° ; \| ± < >` |
| AR | `. ? $ , % - + " / ( ) :` |
| VA | `:` (1,176 of them — the analogy pairs) |
| WK | `" : , . ? - ;` and a `\n\n` paragraph break |
| AI / PS / RC / SJ | prose only |

### Defects found by reading the output aloud

Every one of these passed structurally and was caught only by running the generator through the
normalizer and reading it. This is the same lesson the folder `CLAUDE.md` already records for
knowledge subtests, and it held again.

1. **`12 - 8` → "twelve NEGATIVE eight".** Signs originally ran last, after `<` had been spelled
   out as the word "than" — at which point "what character precedes this minus" is no longer
   answerable. Signs now run **before** the comparison operators. Every order-of-operations item
   in the bank was affected.
2. **`(7x^3)(8x^6)` came out with two opening brackets and no closing ones.** The exponent pattern
   ended in an optional `\)`, meant for `x^(-2)`, and it ate the closing bracket of the enclosing
   expression. The bracketed form is now matched as a pair.
3. **`14x^3(4x + 8)` → "14 x cubedTHE QUANTITY 4 x plus 8".** The implicit-multiply rule looks for
   an operand before the bracket, and the exponent rewrite had already turned that operand into the
   word "cubed". **Implicit multiplication now runs before exponents** — the ordering is the
   correctness, and there is a regression test on that exact string.
4. **`f(x)` → "fthe quantity x,".** Function application is not multiplication. Settled before
   either the multiply rule or the bracket rewrite sees it; `f(g(6))` unwinds to "f of g of 6".
5. **`x-coordinate` → "x minus coordinate"**, and `18-sided polygon` → "18 minus sided". A hyphen
   is arithmetic only when an operand stands on both sides of it.
6. **`Solve for x: 10x + 25` → "solve for x IS TO 10x plus 25".** The ratio-colon rule matched
   `\w:\w`; a ratio is digits on both sides.
7. **`(co-interior)` → "the quantity co-interior".** A bracket with no arithmetic in it is an
   English aside and keeps its pause instead of its brackets.
8. **`19√8` → "19the square root of 8"**, and `$580.00` → "five hundred eighty point zero zero
   dollars", and `75° and 68°` → "75 degree and 68 degrees", and the sequence `15, 5, -5, -15`
   → "5, minus 5, minus 15".

### The all-caps rule

Capitals do three different jobs in the bank and a synthesiser cannot tell them apart:

- the tested headword — `BENEVOLENT` → **benevolent**
- emphasis — `How much INTEREST is earned` → **interest**
- a real initialism — `the ILS glideslope` → **ILS**, kept

Acronyms are an explicit list, taken from generated Aviation Information output rather than
invented. Geometry labels (`AB`, `ABC`, `DEF`) are detected by a rule instead of a list:
**strictly ascending letters drawn from A–H**. That accepts every label the bank uses and rejects
every all-caps English word in it — OAK, ANT, CAT, ARM, ADD, BIG — because none of those ascend.

---

## Which subtests it helps

`SPEAKABILITY` in `speech.js` is the honest version of Trey's own caveat. The distinction is not
how hard something is to pronounce, it is **where the question lives**:

| Level | Subtests | Meaning |
|---|---|---|
| `full` | VA, AR, WK, RC, SJ, PS, AI | Entirely words. Voice loses nothing. |
| `math` | MK | Readable, but you are listening to *"the quantity x plus 7, times the quantity x plus 5"*. Offered, not pushed. |
| `figure` | TR, BC, IC | **The question is a picture.** The stem reads fine and tells you nothing. Never autoplays; the bar says why. |

A figure-bearing question of any kind opens with *"This question has a figure. Look at the
screen."* — said once, up front, so listening-only never silently becomes guessing. Instrument
Comprehension's four options are aircraft drawings and are never read as text.

Reading Comprehension's passage has its **own button**. It serves five questions, so re-reading it
with each one would be worse than useless, and it is split into one utterance per printed line.

---

## The four browser bugs (`useSpeaker`)

All four present the same way — the voice just stops, no error anywhere.

1. **`getVoices()` returns `[]` on the first call** in Chrome and Edge; the list arrives on
   `voiceschanged`. Not listening for it means always using the default voice, which on Windows is
   the flattest one installed.
2. **Speech dies after ~15 seconds in Chrome.** Alternating `pause()`/`resume()` on a 9-second
   timer is the accepted workaround; there is no API-level alternative. Short segments are the
   second half of the defence — a dropped one costs an option, not the rest of the question.
3. **`cancel()` immediately followed by `speak()` drops the new utterance.** Cancelling is async.
   One tick between them fixes it; without it, skipping quickly through questions goes silent.
4. **Autoplay is blocked until a user gesture**, and on iOS the *first* utterance must originate
   inside a handler. The "Voice" toggle is that gesture — it primes with a silent utterance.

We run **our own queue** rather than the browser's: the browser's cannot report which segment is
playing, which is what lets the UI highlight the option currently being read.

### Voice quality

There is no quality field in the API, so `rankVoices()` ranks on the naming conventions the
platforms use: "Natural"/"Neural" and the Google network voices to the top, the old SAPI voices
(David, Zira, "compact", eSpeak) pushed down. This is the difference between the feature sounding
like 2025 and sounding like 2005. The picker lists them best-first and the choice is saved.

---

## Answering out loud (`useListener`)

**The worst failure mode is the tool answering its own questions**: it reads "C. Gracious", the
mic hears "C", the question submits. Discarding results while speaking is not enough — the
recogniser buffers audio and hands it over afterwards. So the mic is **aborted** while the voice
is talking, which throws the buffer away, and restarted 300 ms after it stops.

Three more:

- **`continuous` still stops.** Chrome ends a session after silence and just fires `onend`. Without
  an auto-restart the mic dies a few questions in and nothing says so.
- **`start()` while running throws `InvalidStateError`**, and the browser owns that state.
- **One transcript is a bad bet on one-syllable words.** `maxAlternatives: 5`, and every
  alternative is tried best-first. That is the difference between a letter that works and one that
  needs three tries.

### What you can say

| | |
|---|---|
| Letters | "A" … "E", and the homophones a recogniser actually returns — *bee, be, see, sea, dee, eh* |
| **NATO** | **alpha, bravo, charlie, delta, echo** — not a novelty. This is an Air Force test, it is the set he already uses, and *bravo* and *delta* are far better recognised than *B* and *D*. |
| Ordinals | "one", "first", … |
| The answer itself | "abrupt" — the natural thing to do on Word Knowledge |
| Commands | repeat · options · passage · next · back · flag · finish · stop · **no / cancel / undo** |

Filler is stripped, so *"I'll go with option C"* reduces to `c`. A bare letter is accepted only
when it is **all** that is left — otherwise the leading "a" of any short answer would register as
choice A. **An ambiguous utterance returns nothing rather than guessing**: committing on a
coin-flip costs a scored question, asking again costs a second.

### The confirm delay is the most important number here

`commitMs`, default **1.2 s**. A heard answer highlights and waits before it submits, so a
mishearing can be killed by saying "no". Instant commit is available and is unforgiving — a
recogniser mishears, and on a scored question that turns one syllable into a wrong answer with no
chance to intervene. The transcript is shown verbatim throughout, because a voice interface that
silently ignores you is indistinguishable from a broken one.

---

## The answer-first layout (mobile)

`.afq-stage`, applied whenever voice is on, active only under 760 px. Trey's spec verbatim:
*"the screen on mobile should be like 90% answers 10% question."*

Once the question is being read to you the stem is a reminder, not something you read. So the stem
becomes a scrollable 12vh strip, the rail and the hint go, and the five options flex to fill
everything left — targets you can hit without looking. `100dvh`, not `100vh`: a mobile browser's
`vh` includes an address bar that is not there, which would put option E under the chrome on
exactly the screens this layout exists for.

**A figure subtest opts out.** Table Reading's grid *is* the question; squeezing it into 12vh to
make room for five buttons makes the item unanswerable.

Desktop is untouched.

---

## Known limits

- **Speech recognition is Chrome / Edge / Safari.** Firefox has synthesis but no recognition, so
  read-aloud works there and answering out loud does not. The panel says so and the buttons still
  work.
- **Recognition needs a network round-trip** in Chrome (it is a Google service, not on-device).
  Offline, read-aloud still works; answering out loud does not.
- ✂️ **`$725 jacket` reads as "725 dollars jacket".** Detecting attributive use needs a
  part-of-speech pass over the stem, which is more machinery than a grammatical wobble is worth.
  Never wrong, occasionally clumsy.
- ✂️ **No wake word and no hands-free start.** The first question still needs a tap, because
  browsers require a user gesture before any audio and there is no way around that.
