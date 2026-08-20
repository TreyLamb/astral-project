# AFOQT Research Dossier — sourced facts

Every number here is sourced. Where sources disagree, **both are recorded** (repo policy,
root `CLAUDE.md`). Researched 2026-08-19.

---

## CURRENCY — read this before trusting any other AFOQT document

| Question | Answer |
|---|---|
| Is **Form T** still current in 2026? | **Yes.** Effective 1 Aug 2014. No Form U exists. |
| Sub-versions? | **T1 and T2** — psychometrically equated parallel forms. Does not affect your score. |
| Paper or computer? | **Computer, via Pearson VUE** (eAFOQT). The 2015 pamphlet paper/scantron description is **stale**. Some detachments may still run paper. |
| Subtests changed since 2014? | **No.** |

### Subtests DELETED in 2014 — build nothing for these
**Rotated Blocks / Hidden Figures / General Science** (narrowed to Physical Science) /
**Mechanical Comprehension / Electrical Maze / Scale Reading / Data Interpretation**

**ADDED in Form T:** Reading Comprehension, Situational Judgment.
**RENAMED:** Navigator-Technical composite to **CSO**. ABM composite added 2013.

### Contaminated sources — actively misleading

| Source | Problem |
|---|---|
| afoqtguide.com free full test | **It is the Form S test.** Their own disclaimer calls it the FORMER S VERSION. |
| test-guide.com | Sells Rotated Blocks and General Science quizzes for deleted subtests. |
| PracticeTestGeeks | Lists Spatial Apperception, which is the **Navy ASTB**. |
| gotestprep.com | 470 questions / 213 min and a **Navigator** composite — pre-2013 data. |
| AFPC own `/Form%20S/` pamphlet | An official-looking PDF for the **previous form**. Official does not mean current. |

> **Standing rule:** an official-looking PDF does not outrank a current source. Every
> number in `afoqtSpec.js` must be cross-checked against a second independent source and
> recorded here with its URL and the form it describes.

---

## STRUCTURE AND TIMING

Authoritative: AFPC Form T pamphlet Tables 1 and 2 —
<https://afrotc.rutgers.edu/sites/default/files/pdf/afpt-997_afoqt-practice-pamphlet_cao01aug15.pdf>
Variance from Pearson VUE <https://www.pearsonvue.com/us/en/afoqt.html> noted.

| # | Subtest | Qs | Min | **sec/Q** | Pearson variance |
|---|---|---|---|---|---|
| 1 | Verbal Analogies | 25 | 8 | 19.2 | — |
| 2 | Arithmetic Reasoning | 25 | 29 | 69.6 | — |
| 3 | Word Knowledge | 25 | 5 | **12.0** | — |
| 4 | Math Knowledge | 25 | 22 | 52.8 | — |
| 5 | Reading Comprehension | 25 | 38 | 91.2 | **24 min = 57.6** |
| 6 | Situational Judgment | **50** (16 scenarios) | 35 | 42.0 | 16 = 131 |
| 7 | Self-Description Inventory | 240 | 45 | 11.25 | — |
| 8 | Physical Science | 20 | 10 | 30.0 | — |
| 9 | **Table Reading** | 40 | 7 | **10.5** | — |
| 10 | Instrument Comprehension | 25 | 5 | **12.0** | — |
| 11 | **Block Counting** | 30 | **4.5** | **9.0** | 5 min = 10.0 |
| 12 | Aviation Information | 20 | 8 | 24.0 | — |
| | **TOTAL** | **550** | 216.5 min | | Pearson: **516** |

**The 550 vs 516 discrepancy is fully explained:** 550 - 516 = 34, and SJT 50 - 16 = 34.
**Pearson counts scenarios (16); AFPC counts questions (50)** — each scenario is answered
twice (MOST then LEAST effective). Build to AFPC numbers; make RC configurable 24/38.

**Order:** Part A = VA, AR, WK, MK, RC, then a 10-min break, then SJT, SDI, demographics.
**15-min break.** Part B = PS, TR, IC, BC, AI. Total **4 h 47.5 min**, about 5 hours.

**Mechanics:** No guessing penalty. AFPC verbatim: *You will not lose points or be
penalized for guessing.* Time cannot be banked between subtests; you cannot return to a
completed one. 5 options per question **except Instrument Comprehension (4)**. Scratch
paper provided; **no calculator**. Within-subtest back-navigation on computer is
**unconfirmed** — no published statement found.

AFPC on pacing: *On several subtests you may not finish... many people do not finish these
subtests. Just work as quickly and accurately as you can.*

---

## COMPOSITES

Reconstructed from AFPC Table 1 per-row counts (VA 3, AR 2, WK 3, **MK 5**, RC 2,
**TR 3**, IC 2, BC 2, AI 2, **PS 0, SJT 0, SDI 0**) and confirmed independently.

| Composite | Subtests |
|---|---|
| **Pilot** | MK + TR + IC + AI |
| **CSO** | WK + MK + TR + BC |
| **ABM** | VA + MK + TR + IC + BC + AI |
| **Verbal** | VA + WK + RC |
| **Quantitative** | AR + MK |
| **Academic Aptitude** | Verbal + Quantitative (VA+AR+WK+MK+RC) |

**Math Knowledge is in 5 of 6. Table Reading is in all three rated composites.**

### Composite count is DISPUTED - six or seven?

**CORRECTED 2026-08-19** after extracting Barron's 4th Ed. An earlier pass of this dossier
stated flatly that "Physical Science, SJT and SDI feed no composite." That was too
confident about SJT.

| Source | Composites |
|---|---|
| Current commercial sources (Mometrix, iPREP, afoqtguide) | **six** |
| **AFPC 2015 Form T pamphlet** | **seven** - the 7th is **Situational Judgment** |
| **Barron's Military Flight Aptitude Tests, 4th Ed (2018)**, p.217 verbatim | *"combined in different ways to generate **seven composite scores**"*, and its subtest table carries a **Situational Judgment** column alongside Pilot / CSO / ABM / Academic Aptitude / Verbal / Quantitative |

**What is actually settled:**

- **Physical Science feeds no composite** - consistent across every source.
- **Self-Description Inventory feeds no composite** - consistent; it is a personality
  inventory with no right answers.
- **Situational Judgment is DISPUTED.** Two official-lineage sources (AFPC 2015, Barron's
  2018) give it its own composite; current commercial sources omit it. It may be scored
  and simply not reported to the candidate, or reported to boards but not to you.

**Build consequence:** do **not** deprioritise SJT on the assumption it is worthless.

#### ⭐ Read directly off the Form T pamphlet's Table 1 (2026-08-20)

The pamphlet PDF renders now (see the tooling note below), so Table 1 was read rather than
reconstructed. It carries **seven** composite columns — *Pilot · CSO · ABM · Academic ·
Verbal · Quant · **Situational Judgment*** — and the per-row X marks reconcile **exactly**
with `afoqtSpec.js` as already built:

| Subtest | Items | X count | Composites |
|---|---|---|---|
| Verbal Analogies | 25 | 3 | ABM, Academic, Verbal |
| Arithmetic Reasoning | 25 | 2 | Academic, Quant |
| Word Knowledge | 25 | 3 | CSO, Academic, Verbal |
| **Math Knowledge** | 25 | **5** | Pilot, CSO, ABM, Academic, Quant |
| Reading Comprehension | 25 | 2 | Academic, Verbal |
| **Situational Judgment Test** | 50 | **1** | **Situational Judgment** |
| Self-Description Inventory | 240 | 0 | — |
| Physical Science | 20 | 0 | — |
| **Table Reading** | 40 | **3** | Pilot, CSO, ABM |
| Instrument Comprehension | 25 | 2 | Pilot, ABM |
| Block Counting | 30 | 2 | CSO, ABM |
| Aviation Information | 20 | 2 | Pilot, ABM |

So the seventh composite is **not** a Barron's misreading — it is in the AF's own Form T
table, with the SJT's single X sitting in it. PS and the SDI genuinely carry zero.

**Table 2 confirms every timing number too**, against the *correct form* this time:
VA 8 · AR 29 · WK 5 · MK 22 · RC **38** · SJT 35 · SDI 45 ‖ PS 10 · TR 7 · IC **5** ·
BC **4.5** · AI 8, split Part A / Part B exactly as `afoqtSpec.js` has it, totalling
**3 h 36.5 m** testing and **4 h 47.5 m** all-in. Two long-standing flags close here:
**IC is 5 minutes** (the Form S doc's "20 questions / 6 minutes" was the stale trap the plan
warned about), and **BC is 4.5** with Pearson's 5 the outside variance.
Physical Science and SDI can safely be built last and sized small. SJT should be treated
as probably-scored.

That is **65 minutes of test that never reaches the score report.**

- **SDI** — personality inventory, no right or wrong answers, used for career matching.
- **SJT** — added 2014, still being validated. The **2015 pamphlet describes a seventh
  SJT composite** but every current source lists only six reported. May be
  scored-but-unreported. Treat zero-impact as *true today, not guaranteed*.
- **Physical Science** — legacy remnant of General Science, never wired into a composite.

### Scoring

Composites are reported as **percentiles 1 to 99** against a reference group — **not
percent correct**. Exact weightings and norming tables are unpublished.

**Minimums:** Verbal >= 15, Quantitative >= 10 (all officer candidates, non-waiverable).
**Pilot >= 25** (plus CSO >= 10); CSO >= 25 (plus Pilot >= 10); ABM >= 25.
DAFMAN 36-2664 (17 Jan 2025) **removed** the legacy Pilot+CSO >= 50 rule at
active-duty/AFRC level; many ANG/AFRC units still enforce it.
**Minimums are not competitive** — rated boards converge on **Pilot 80+ / PCSM 70-80+**.

### Retakes — decision-relevant

- **2 lifetime attempts**; a 3rd requires an AFPC waiver (documented catastrophic event).
- **150 days between attempts**, non-waiverable — **90 days for AFROTC cadets**
  (AFROTCI 36-2011V3). One outlier source says six months.
- Most sources: the **most recent** score is used. But AFPC states for PCSM that it is
  calculated using the **highest** AFOQT Pilot or EPQT score on file.

**PCSM trap:** the algorithm changed 2021-12-29 and now **caps credited flying hours at
60**. AFPC verbatim: *if you previously received credit for 200 flying hours and retake
the AFOQT, you will now only receive credit for 60 flying hours... your PCSM score may not
improve or may even go down.*

---

## OATTS — official, free, open source

<https://af-oatts.github.io/> — linked from
<https://access.afpc.af.mil/pcsmdmz/AFOQTPrepMaterials.html>, which states it is
*authorized and approved by the Air Force... provided as a public service by the AFPC and
AETC to promote fairness in testing.* Cleared for public release **AFRL 2025-4499,
08 Sep 2025**.

- Content repo: **<https://github.com/af-oatts/content>** (~830 MB, 201 SCORM zips + `manifest.yml`)
- App repo: <https://github.com/af-oatts/oatts>

Zips are **unencrypted standard SCORM**. Lesson slides are Adobe Captivate with text baked
into images (not scrapeable). **Answer Key modules are plain PDFs — about 100 official
questions with official worked explanations are extractable.** These are the only items
that may ship verbatim as `provenance.kind: 'real'`.

*Access note:* `access.afpc.af.mil` fails with a self-signed-certificate error. Use `curl -k`.

**Counterpoint, recorded honestly:** a Reddit test-taker calls OATTS *AI Slop,
non-user friendly, did not help.* We mine it as a **data source** (item bank + module
tree), not as a study program — but take the UX criticism at face value.

### Official OATTS module trees (the AF own syllabus)

- **Math Knowledge:** Math Terms / Order of Operations / Fractions / Exponents / Absolute
  Values / Proportions / Factoring / Graphing / Geometry / Pythagorean Theorem
- **Arithmetic Reasoning:** Basics / Formula Sheet / Strategies for Word Problems / Area of
  2D Shapes / Area of 3D Shapes
- **Word Knowledge:** Strategies for Studying / Parts of a Word (prefix, root, suffix)
- **Aviation Information:** Aircraft Functions / Aircraft Terminology / Aircraft Operations
  / Navigation / Strategies. Knowledge Check sections: Aircraft Function, **Aircraft
  Type**, Airfield Operation, Weather
- **Physical Science:** Astronomy / Chemistry / Atomic / Electrical / Light / Mechanical /
  Sound Physics / Thermodynamics
- **Instrument Comprehension:** Compass Dials, then Artificial Horizon, then Combination

**Math scope confirmed: NO calculus, NO trigonometry.** Arithmetic, algebra, geometry only,
comparable to GRE quant. Hardest official items are **AC-method factoring**
(6y^2 - 19y - 7, and 6a^2 + a - 12).

---

## SUBTEST CONVENTIONS THAT MUST BE REPRODUCED

### Instrument Comprehension (AFPC Form T verbatim)

- *a stationary indicator in the center represents the airplane*; the horizon line, black
  pointer and edge markings move.
- **Heavy black line = HORIZON LINE**, tilts with bank. **White pointer shows degree of
  BANK.** **Shaded portions = the ground.**
- ⚠️ **POINTER COLOUR IS DISPUTED - verified against the pamphlet 2026-08-20.** This dossier
  originally said the **white** pointer shows bank with the black one as a fixed zero reference.
  The AFPC pamphlet extracted from airforce.com says the opposite, verbatim: *"The heavy black
  line represents the HORIZON LINE. **The black pointer shows the degree of BANK** to the right or
  left."* Only ONE pointer exists in that version, indexed against a printed zero.
  **Neither reading changes a single answer** - the geometry below is identical in both, and no
  question asks what colour anything is. Build to the GEOMETRY, never to the colour, and do not
  write a question that depends on naming a pointer.
- **Level:** horizon line sits directly on the stationary aircraft silhouette; pointer at zero.
- **Climbing:** the aircraft silhouette sits *between* the horizon line and the pointer. Greater separation = steeper climb.
- **Diving:** the horizon line sits *between* the silhouette and the pointer. Greater separation = steeper dive.
- **BANK IS INVERTED:** banked **right** puts the pointer **left** of zero; banked **left**
  puts it **right**. Horizon line is always at right angles to the pointer.
- **Viewing frame:** *YOU ARE ALWAYS LOOKING NORTH AT THE SAME ALTITUDE AS THE FOUR
  AIRPLANES. EAST IS ALWAYS TO YOUR RIGHT AS YOU LOOK AT THE PAGE.*
- **Distractor formula (official, verbatim from the pamphlet's worked sample X):** the correct
  attitude, a **rear view**, a **front view**, and a **wrong-bank** version. *"Note that B is a
  rear view, whereas D is a front view. Note also that A is banked to the right and that B is
  banked to the left."* Since the viewer looks NORTH, a rear view is an aircraft heading north
  (flying away) and a front view one heading south (flying toward you). Bank magnitudes seen in official items: **45 and 90 degrees**.
- Item space is **finite: ~3 pitch x ~5 bank x 16 headings = about 240 attitudes.**

### Table Reading

- *X values appear at the top... Y values on the left. Find the block where the column and
  row intersect.*
- **X ascends left-to-right; Y DESCENDS top-to-bottom.** The number one misread.
- **Real grid is about 33x33** (official items use X -16 to +16, Y -17 to +15), not the
  7x7 teaching sample.
- **THE FIELD IS GRADUAL — corrected 2026-08-20.** Every step right and every step DOWN adds
  **one or two**. Nothing jumps. Transcribed verbatim from the AFPC pamphlet's own sample:

  |     | -3 | -2 | -1 |  0 | +1 | +2 | +3 |
  |-----|----|----|----|----|----|----|----|
  | **+3** | 25 | 26 | 28 | 30 | 31 | 32 | 33 |
  | **+2** | 26 | 28 | 30 | 32 | 33 | 34 | 35 |
  | **+1** | 27 | 29 | 31 | 33 | 35 | 36 | 37 |
  | **0**  | 29 | 30 | 32 | 34 | 36 | 37 | 38 |
  | **-1** | 30 | 32 | 33 | 35 | 37 | 38 | 40 |
  | **-2** | 31 | 33 | 34 | 36 | 38 | 39 | 41 |
  | **-3** | 32 | 34 | 35 | 37 | 39 | 40 | 42 |

  **Consequence, and it is the whole subtest:** the five options CLUSTER. The pamphlet's own
  first item is `X=+1, Y=+2` -> answer **33**, options **35 36 30 33 34**. A slipped row costs
  one point on the page, so the mistake cannot be felt. There is no sanity check available.
  Also note the table is **not separable** — row +3 deltas run 1,2,2,1,1,1 while row +1 runs
  2,2,2,2,1,1 — so there is no formula to shortcut a lookup with.
- ⚠️ **This corrects an unsourced claim in an earlier pass of this dossier**, which said values
  were *"non-monotone, 2-3 digits, with leading zeros (02, 090)"*. That line carried **no
  citation, no verbatim quote and no backing item**, and the generator was built to it: a
  uniform random field over 0-999, whose options were spread across the whole range instead of
  clustered. Two sources say otherwise and none support the original:

  | Source | Says |
  |---|---|
  | **AFPC Information Pamphlet**, Part 7 sample table (transcribed above) | Strictly +1/+2 in both directions; options clustered around the answer |
  | frontline-forge.com AFOQT Table Reading | *"table values often change gradually, so adjacent cells may differ by one or two points"*; warns of **"neighbor traps"** |

  ⚠️ The pamphlet is the **Form S** edition (its roster has Rotated Blocks, Hidden Figures and
  General Science, and it names five composites including Navigator-Technical). **Table Reading
  was not changed in the 2014 Form T transition** — same 40 questions in 7 minutes — so its
  table format carries over, but treat it as Form-S-sourced and corroborate where possible.
- **Leading zeros are real and now explained.** A 33x33 gradual field spans roughly 010 to 130,
  so a grid is printed at one fixed width and the small values pad. That is how both `02` and
  `090` end up in the record: a 7x7 teaching grid pads to two, a full-size one to three. The
  generator derives the width from the grid's own maximum.
- ⬜ **Still unconfirmed:** the exact increment distribution on a real FULL-SIZE grid (the
  evidence above is a 7x7 teaching sample). afoqtguide.com's Table Reading page reportedly
  publishes a full ~33x32 grid but **403s to automated access** — Trey can reach it. Also worth
  a look: table-reading.com, crackasvab.com/afoqt/table-reading, afoqtpracticetest.com.
- No straight edge permitted. Five near-miss options drawn from the same table.
- **The only genuinely unbounded subtest**, and it feeds all three rated composites.

### Block Counting

> ⭐ **PRIMARY SOURCE, obtained 2026-08-20: the FORM T pamphlet.** Everything in this section
> is now quoted from `Part B.4 - Block Counting` of
> `afrotc.rutgers.edu/sites/default/files/pdf/afpt-997_afoqt-practice-pamphlet_cao01aug15.pdf`,
> which is the **Form T** edition (Part A / Part B structure, Reading Comprehension and the
> Situational Judgment Test present, no Rotated Blocks / Hidden Figures / General Science).
> An earlier scratchpad extract of "the pamphlet" was the **Form S** edition and its Block
> Counting worked answers are DIFFERENT (S1=4, S2=3, S3=7, S4=5, S5=4). Do not mix them.

- **Verbatim, Form T:** *"Blocks are considered touching only if all or part of their faces
  touch. Blocks that only touch corners do not count. All of the blocks in each pile are the
  same size and shape."* Previously this dossier carried the sentence with no attribution; it
  is genuine, and it is official.
- **The corner exclusion is worked explicitly in the official text**, which is what makes it
  testable rather than folklore: S3 *"touches the faces of the two blocks above it, the two
  blocks below it, and the blocks directly to the right and left of it. **It does not touch the
  faces of the two blocks diagonally below it to the right or left. These blocks only touch the
  corners of S3 and do not count.**"* → **6, not 8.**
- **Official Form T worked answers:** S1 = 3, S2 = 4, S3 = 6, S4 = 3, S5 = 3. Also stated:
  **S4 and S5 do NOT touch each other** despite being adjacent in the picture — they meet at a
  corner. That single pair is the cheapest regression test available for the whole subtest.
- 🔴 **A block can touch MORE than six others, so the pile is NOT an aligned cube lattice.**
  The Form S sample keys S3 at **7** (*"three blocks above, three blocks below, and one block
  on the right"*) and afoqtguide's explanations use *"three above"*, *"two below"*, *"two to the
  left"* freely. In an axis-aligned lattice of cubes a block has at most one neighbour per
  direction and six in total, so a lattice generator **cannot even represent** the official
  worked example. The blocks are identical **cuboids** laid in offset courses (running bond)
  and in perpendicular layers — visible directly in the Form T figure and in
  crackasvab.com's pile art. This is the single most important property of the artifact and
  it is exactly the class of thing the Table Reading grid got wrong in Phase 4.
- **Answer options use a DIFFERENT numeric range per question.** The official Form T KEY for
  the five samples, verbatim: S1 `1 2 3 4 5` · S2 `3 4 5 6 7` · S3 `5 6 7 8 9` ·
  S4 `2 3 4 5 6` · S5 `2 3 4 5 6`. **You cannot memorise "4 = B".**
- **CORRECTION (2026-08-19, from Barron's Test #1 KEY table):** the key can also run
  **DESCENDING**. Observed in one 5-row key: block 16 `A3 B4 C5 D6 E7`, block 17
  `A2 B3 C4 D5 E6`, block 18 `A3 B4 C5 D6 E7`, block 19 `A3 B4 C5 D6 E7`, block 20
  `A1 B2 C3 D4 E5`; and in the next key, block 23 = **`A6 B5 C4 D3 E2`**. An earlier
  pass of this dossier said only that ranges *shift*. A generator built to that spec
  would train the wrong reflex. Randomise BOTH the range offset AND the direction.
- Barron's renders piles as **line-art wireframe blocks**; the OATTS/epub source uses
  **shaded 3-D colour renders**. Both conventions are authentic - support both.
- Typical answers are 3-6. One pile image serves 5-13 numbered questions.

### Verbal Analogies — official AF relation taxonomy

Part/Part, Part/Whole, Member/Category, Cause/Effect, Sequence, Object/Attribute,
Action/Object, Synonym, Antonym, Degree.

Two official discriminators: **level of association must match** (lemons are always sour,
but the sky is not always clear) and **degree of separation must match**.
Two formats: complete the 4th term, or pick a whole 2nd pair — **order matters**.

### Situational Judgment

50 questions / 16 scenarios / 35 min. Each scenario: pick **MOST** then **LEAST** effective
of five actions. Scored *relative to the consensus judgment across experienced U.S. Air
Force officers.* Six competencies: **Integrity and Professionalism, Leadership, Resource
Management, Communication, Innovation, Mentoring.** The official key accepts two different
answers on one item — consensus is a distribution, not a single truth.

---

## CALIBRATION — first-hand test-taker report (via Trey, Reddit)

| Reference | Verdict vs the real test |
|---|---|
| **Barron 4th Ed** (`Military Flight Aptitude Tests`) | *probably the most accurate all around.* Math/verbal **slightly harder**; reading a bit harder; **science, aviation, SJT about the same.** = **TARGET** |
| **Trivium 2021-2022** | *crazy difficult **considering the time constraint*** (esp. Math Knowledge) = **CEILING** |
| **Complete AFOQT Study Guide 2020-2021** | *way too easy* = **FLOOR** |

Reporter advice: *overshoot rather than undershoot.* Matches the AFPC warning that
*most items in the AFOQT will prove to be more difficult* than the pamphlet samples.

**Technique that became tool features:**

1. **Mid-subtest pace checkpoints** — *Math Knowledge, 22 mins total, 50 seconds per
   question, by half-way at 11 minutes remaining I need to be around question 13.*
2. **5-second abandon rule** — *Put down a guess within 5 seconds and do not leave it blank.*
3. **Study loop** — *Do not just keep taking a bunch of practice tests back to back. Take
   as many as you can, then write down all concepts you got wrong... review... take a
   break, and then take another batch.*

Also: **eAFOQT navigation is about 2-3 s/question faster than a paper scantron.**
Independent confirmation that **PS/SJT/SDI are unweighted** — *I personally did not study
or do any practice tests for them.* That is a third independent source agreeing.
Timeline caution: *the rest of us mere mortals need a good couple of months.*

---

## SOURCE MAP

**Free and open:** OATTS; the AFPC Form T pamphlet
(<https://afrotc.rutgers.edu/sites/default/files/pdf/afpt-997_afoqt-practice-pamphlet_cao01aug15.pdf>,
mirror <https://www.usf.edu/undergrad/documents/air-force-rotc/afoqt-information-pamphlet.pdf>);
afoqtguide.com **study guides** (~110 Qs across 10 of 12 subtests, static scrapeable HTML —
its Table Reading page publishes a full ~33x32 grid as text); the FAA PHAK
(<https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak>).

**Free via library card:** LearningExpress Library
(<https://onlinelibrary.utah.gov/resource-directory/>) lists AFOQT explicitly, with timed
tests and ebooks. Peterson Test Prep (39-49 USD/mo direct) is free through many systems via
Gale *Testing and Education Reference Center*. Entry is **per-library and authenticated** —
no universal URL exists.

**Paid, escalated rather than discarded:** Barron 15.69 USD; AFOQTGuide Colonel 49.99 USD
(*a huge rip off... however it is worth it and the only good game in town*); Mometrix course
40-60 USD/mo (**1,900+ questions**). The **online test platforms** of Trivium and AFOQTGuide
are called *trash* — the value is in the PDFs and books.

### Gaps — flagged, not dropped

- **DTIC reports** AD1203687 / AD1168029 / AD1157021 — best source for scoring methodology.
  `apps.dtic.mil` served an **Under Maintenance** page (genuinely down, not blocking us). **Retry.**
- **Union Test Prep, Quizlet, Docsity** — 403 to automated access. Trey supplies these.
- **Reddit first-hand reports** — web search returned **zero** results across multiple
  phrasings. Trey supplies these.
- **AFOQT-specific open word list** — none found. Substitute is a GRE/SAT high-frequency list.
- `access.afpc.af.mil` 2015 FAQ and `Form T.HTML` — connection reset while sibling pages
  returned 200. Retry; likely resolves the remaining unconfirmed flags.
