# MICR 2060 — how the professor's answers work, and why the study guide missed 5

Written 2026-10-13 after the instructor's **"MCI for OLQs 5-8 Answered & Explained.pdf"** was applied to the
`mmahp-ch5-8` worksheet. Read this before keying any future MICR 2060 quiz question, and before trusting an
"unsure" flag.

## 1. The key: where it is, when it opens, how to read it

- File: `G:\My Drive\SupplementalCourseDocs\MICR 2060\files\MCI for OLQs 5-8 Answered & Explained.pdf`
  (the 1-4 key is next to it). Applying it is one command:
  `node scripts/importMicrKey.mjs "<key.pdf>" --worksheet <worksheet.json> [--apply]` — dry run by default,
  refuses to write unless every question matches by number, stem and option text.
- **When it opens (syllabus, "Ans to OLQ ... opens"):** OLQs 1-4 on Sep 13 (Exam 1 starts Sep 13); OLQs 5-8
  on Oct 11 (Exam 2 starts Oct 11); **OLQs 9-12 on Nov 8** (Exam 3 starts Nov 8); **OLQs 13-16 on Dec 6**
  (Exam 4 starts Dec 7). So the key opens with the exam, not before it.
- **The date alone was not enough.** On Oct 12 at 5:38 PM, a day after Oct 11, the key's download returned a
  server error and Exam 2 still said "hasn't been unlocked yet", while OLQs 5-7 had not been submitted. The key
  was readable only after all four OLQs were done. This looks like a module prerequisite (the key and the exam
  share one module whose prerequisite is the OLQ module). **Likely, not proven** — the Canvas Modules page states
  the requirement. Practical meaning: being late on OLQs probably does not open the key early.
- **How to read it:** the correct option is marked with `*`. The line "Ans is X." can name the WRONG letter:
  in 5 of 267 questions it disagrees with the star (ch5 q8, q46, q48, q54; ch6 q16), because options were
  reshuffled after the explanation was written. **The star is the answer.** Graded Canvas attempts agreed with
  the star on q8 and q46; on q16 Canvas marked the explanation's option wrong. One question (ch6 q23) has two options sharing a letter, so match options by
  TEXT, never by letter. One question (ch6 q50) has no explanation at all.
- In the Ch 1-4 key the same things happen (ch4 q39 stale letter; ch2 q61 and ch4 q59 have no explanation).

## 2. Audit: how good was the study guide?

Applied the official key to all 267 questions (64 + 64 + 76 + 63).

| | Questions | Matched the key |
|---|---|---|
| Not flagged | 252 | 251 |
| Flagged amber ("unsure") | 15 | 11 |
| **Total** | **267** | **262 (98.1%)** |

The 5 misses: **ch5 q17, ch6 q16, ch7 q21, ch7 q42, ch7 q54.** The amber flags did their job: 4 of the 5 were
flagged. The one unflagged miss (ch5 q17) is a flag I removed too early (see section 5).

## 3. The five misses, and the professor's logic behind each

| Q | Guide said | Key | His logic (from his own explanation) |
|---|---|---|---|
| ch5 q17 (cell out of phosphorus, what can't it make?) | Nucleic acids | **E, "None of these molecules"** | "The cell needs ATP (which has PO4) for all biosynthetic reactions." A *challenge question*: the answer is a global dependency, not the obvious molecule. His option wording ("None of these") actually clashes with his own reasoning; follow the star. |
| ch6 q16 (gamma radiation EXCEPT) | Breaking the backbone | **B, "ionizing water to create reactive ions"** | His explanation text says "Ans is A. UV radiation does that" (the textbook logic: UV cross-links), but he starred B, and Canvas marked A wrong on a graded attempt. His explanation and his star contradict each other; the star is the live key. |
| ch7 q21 (medium with tap water) | Complex semisolid | **B, defined semisolid** | "Because the chemical formula of the components is known." He classifies by whether the components are known chemicals; "tap water" is just water. I read a trap into plain wording. |
| ch7 q42 (handwashing EXCEPT) | Waking up and using restrooms | **A, touching infants** | "It is not one of the listed items. However, one changing a baby should wash hands." His chapter lists food prep, examining patients, garbage/animals, and "using lavatories ... changing diapers". Likely reading: option C is a compound containing a listed item (restrooms), so it passes; "touching infants" is not on the list, so it is the exception, even though real hygiene says wash. |
| ch7 q54 (best practice with inoculation loops) | Disposable loops | **C, metal loop + loop incinerator** | "Option A creates plastic waste, option B creates aerosolized microbes." His best practice avoids BOTH named harms. His own Fig 7.4 shows disposable loops, so the chapter figure does not bind the quiz. |

## 4. What the 11 correct ambers tell us

Where my best pick (chapter text) matched the key: ch5 q14, ch6 q3, q37, q63, ch7 q41, q48, q49, q50, q60,
ch8 q48, q57, q63. What his explanations say about them:
- **ch6 q37:** "F factor plasmids may facilitate conjugation between unrelated bacteria", and DNA released by a
  dead cell makes transformation possible too (answer: conjugation OR transformation). An outside AI's
  real-world argument (F plasmids have a narrow host range) was wrong for his quiz.
- **ch7 q41:** "protozoan cysts are the most stable microbes of the five options", which also confirms the
  "bacterial or fungal spores" option was not the hardiest.
- **ch7 q60:** he keyed the physically correct mismatch: UV works by cross-linking, and only 100-120 nm UV "may
  ionize water". His Ch 6 and Ch 7 text says UVC (100-280 nm, mercury lamps) may ionize water, so he does not
  always follow his own chapter wording.
- **ch7 q48 and q50:** shoe covers belong to BSL-3 or an operating theater; for BSL levels the answer is what
  that level ADDS ("A BSL-2 has all those and option C in addition").
- **ch8 q57:** killing needs a higher concentration than stopping growth; he points to Fig 8.23, so the figure
  beats the chapter's contradictory sentence.
- **ch6 q63:** restoring extinct animals "so far, none of the efforts have succeeded"; the food-allergy and
  bowel-disease concerns are, in his words, reported often, so option E is a real concern, not far-fetched.

## 5. Why the remaining ambers could not be resolved from his text

1. **Two of the misses depend on reasoning that lives only in his explanations** (q42's list logic, q54's
   waste-and-aerosol logic). Nothing in the chapter, slides or OpenStax says it. No amount of chapter reading
   would have settled them, which is exactly what an amber flag means.
2. **ch7 q21 was my error:** "tricky on purpose" does not mean every odd phrase is a trap. One outside reviewer
   had it right; I overrode that on a guess.
3. **ch5 q17 was my error:** I removed its flag after a second pass confirmed the obvious answer, while that pass
   itself noted the alternative "everything needs ATP" reading. **Rule: do not unflag on text-only agreement when
   a plausible alternative reading is on the table.**
4. **ch6 q16's key contradicts his own explanation**, so even a perfect reading of his explanation fails.
5. **Outside AI reviewers were unanimous and wrong on q42, q54 and q60**, the three where his logic departs from
   general reasoning. Agreement between AIs is not evidence about his key.

## 6. Rules for future quizzes (OLQs 9-16)

1. **Ground truth order:** the official key's `*` > a graded Canvas attempt > his explanation text (the letter may
   be stale) > his chapter text > his slides > OpenStax > general reasoning or other AIs.
2. Until the key opens, mark anything resting only on text or reasoning amber; use graded attempts (Canvas shows
   the correct answer after an attempt) to settle what you can.
3. **Habits to expect from him:** a compound option counts if any part is on his list; he classifies by his
   definitions and ignores incidental wording; "best practice" means avoiding every harm he names; "challenge
   questions" may hinge on a global dependency; his key sometimes follows physics over his own chapter.
4. When the key opens (Nov 8, Dec 6), run the importer in dry-run first. It prints mismatches, stale letters and
   missing explanations before it writes anything. Keep the PDF in `MICR 2060/files/`.
5. If the key is still locked, finish the OLQs first (it appears to need them), then re-check.

## 7. Open items

- `mmahp-ch1-4`: a dry run against its own key shows **16 of 249 derived answers differ** from the official key,
  and the importer refuses to write until 6 questions (e.g. ch1 q39, where two options share text) are checked by
  hand. Not applied yet.
- Worksheet fields kept as a trail: `priorAnswer`, `priorSource`, `priorRationale` on every question whose answer
  changed or was flagged (16 questions), and `knownWrong` (red X) from graded attempts.
