# Engine quality: handoff for the next agent

Written 2026-10-25. **Read this, then `.claude/skills/question-engine-quality/SKILL.md`, then `ENGINE-AUDIT.md` (the live scoreboard).**
Nothing in the "worklist" below has been started except what the "done" section lists. Trey asked for a handoff, not for every section to be fixed in one go.

## Why this exists

Trey has told agents "your generators are shallow" about a dozen times. On 2026-10-25, after the first cut of the coordinate-vertex questions:

> "I'm tired of agents building shallow flimsy templates. I should be able to say 'I want a 100 question test on ONLY this one thing' and get 100
> questions that never repeat and vary as much as possible. Questions that would be seen on a real test, not garbage worded weird to make '1 more'
> unique question." And: "This is a general comment for every single section of my AFOQT and/or future tests we build with engines."

So this is a standing standard for **every subtest and every future engine-built test**, not a vertices fix. The standard is the skill; this file is the state of play.

## What was built on 2026-10-25 (all local, nothing committed or pushed)

**Engine and screens**
- `engine/generator.js`: an instance may report a `variant` (the structural kind it drew). `buildDrill` now looks at up to 8 clean draws per slot and keeps the one whose
  variant has been dealt the fewest times this run (templates that report no variant behave exactly as before).
- Drill by TOPIC: `views/DrillConfig.jsx` has "Build by topic" (any concept, count 1-200); `views/DrillRunner.jsx` accepts `?concepts=a,b`. Verified in a browser at 100 questions.
- `npm run afoqt:concept-audit -- --concept=<id[,id]> --n=100 [--out=file.md] [--show]`: deals a topic run and reports distinct stems, variants, the most repeated variant, repeated number sets, and writes the run with answers so it can be READ.
- `npm run afoqt:audit-all [-- --write]`: scores every topic in every subtest; writes `ENGINE-AUDIT.md`.
- Skill: `.claude/skills/question-engine-quality/SKILL.md`; pointers added to the root `CLAUDE.md`, `src/pages/theknowledgebase/CLAUDE.md` and the memory folder.

**Question families**
- Coordinate shapes (MK ch12): `templates/mk/shapes.js` (figures as data) + `templates/mk/ch12b-coordinate-shapes.js`, **19 generators**: missing vertex of an axis rectangle / parallelogram-rectangle-rhombus-square
  (tilted or not) / square from a diagonal / symmetric figures (isosceles apex, trapezoid, kite) / right and right-isosceles triangle / "which could be the fourth vertex" / opposite vertex from the center / third vertex
  from a centroid / solve for k / diagonals meet / classify a triangle / perimeter / area of triangles and quadrilaterals / centroid / reflect-rotate-translate / name the move / collinear k / endpoint from a midpoint.
  Lesson sections 7-11 in `curriculum/chapters/mk/ch12-coordinate.md`. A 100-question run on `polygon-vertices`: 100/100 distinct, ~56 variants, no variant above ~4. Pinned by `ch12b-coordinate-shapes.test.js`.
- Work and rate (AR ch05): `templates/ar/ch07-work.js`, **10 generators** (three workers, missing solo time, "twice as fast", head start, fraction done, headcount x days, crew changes, machine output scale, output rates, fill and drain) +
  lesson sections in `curriculum/chapters/ar/ch05-averages.md`. Before this, AR had ONE work-rate generator (~64 stems) and a comment saying work-rate is in "NO official AFOQT material", which Trey's real test disproved.
- Also moved the AFROTC material out of TKB (separate task, see `src/pages/theknowledgebase/CLAUDE.md`).

**Checks at handoff:** 107 test files / 4,831 tests pass; `afoqt:coverage` holds; `afoqt:selftest` at 8,000 samples clean for every new generator; production build passes.

## The honest state of every subtest (from `npm run afoqt:audit-all`, 100-question runs; figure-based subtests judged at 25)

| Subtest | Topics | Topics that CANNOT deal a full run of distinct questions | Notes |
|---|---|---|---|
| AI (Aviation Information) | 50 | **50 of 50** | ~670 distinct questions across all 64 generators, 8 to 22 per topic. Almost all definition/recall ("The red line" -> a description). |
| PS (Physical Science) | 30 | **30 of 30** | unscored subtest |
| WK (Word Knowledge) | 28 | 26 | item-pool based; some topics have very few words |
| VA (Verbal Analogies) | 12 | 10 | |
| SJ (Situational Judgment) | 21 | 14 | scenarios are a finite authored set |
| MK (Math Knowledge) | 76 | 17 | e.g. `polygon-angle-sum` 14/100, `pythagorean-triples` 25/100; 57 topics have a generator with <= 3 sentence frames |
| RC (Reading Comprehension) | 7 | 4 | passages are a finite authored set |
| AR (Arithmetic Reasoning) | 34 | 2 | `ar-average-speed` 19/100 |
| IC, BC, TR | 4, 4, 5 | n/a (judged at 25) | figure based; IC is also broken, see below |
| **Variant reporting** | | | Only the MK shapes family and the AR work family report variants (29 generators of ~370). Everywhere else the spread of kinds cannot be measured yet. |

No topic yet passes every hard check (a full run, at least 3 generators, no capped item space, no generator with <= 3 sentence frames, no single variant filling the run).

## What Trey told us about the real test (taken 2026-09-23; retake planned first week of January 2027; restart studying late Oct or 1st-2nd week of Nov)

Scores (percentiles): Verbal 81 (strong); Pilot 29, ABM 27, Quantitative 36, CSO 52, Academic Aptitude 57. **Pilot = MK + TR + IC + AI**, and he says he "did terrible on the pilot related sections" and wants general aviation knowledge up as "low hanging fruit".
- No unit conversions he would not already know in his head (maybe feet to miles).
- 2-3 Math Knowledge items gave x,y coordinates and asked for a missing vertex of a shape (5-7% of the math): never in prep.
- Work questions on worker speeds and headcount, which he still missed.
- **Still owed:** a subtest-by-subtest debrief of what else felt unfamiliar. A 5-7% miss means other gaps are likely.

## Worklist (do NOT start all of it at once; Trey wants it done in order, with him reviewing)

1. **Aviation Information (Pilot composite, his stated priority).** It is not "filled out as possible". Build breadth per topic (target: a 100-question run on any AI topic has no repeats) and
   add question KINDS beyond definition/recall: cause and effect ("what happens to the altimeter if the static port blocks"), scenarios, instrument interpretation, calculations (crosswind, runway heading,
   density altitude, fuel, weight and balance), compare, "which is NOT", regulations and numbers, airspace and chart symbols, weather, human factors. Source from the FAA Pilot's Handbook of Aeronautical Knowledge
   (public domain) and calibrate against the Barron's aviation chapters (G:\My Drive, OCR damage: eyeball any number). The fact engine is `engine/facts.js`; read its rules in `src/pages/theknowledgebase/CLAUDE.md` first.
2. **Instrument Comprehension (Pilot composite).** Flagged broken 2026-09-20 ("pictures wrong about half the time", memory `project-afoqt-ic-pictures-broken`, deferred). With Pilot at 29 it is time to revisit: render a contact sheet and LOOK
   before changing anything; do not assume the documented bank-pointer bug is the cause.
3. **PS, WK, VA, SJ, RC** topics that cannot deal a full run (table above). Item-pool and authored-set subtests need MORE facts/words/scenarios and more question forms per fact, not more templates.
4. **MK**: the 17 bounded topics, and make the older MK generators report `variant` (copy the pattern in `ch12b-coordinate-shapes.js`). Check every MK topic against the real AFOQT math domain with Trey's debrief.
5. **AR leftovers** and the number-pool issue below.
6. **Variant reporting everywhere** so `afoqt:audit-all` can measure spread, then re-run it and keep `ENGINE-AUDIT.md` current.

## Known issue left open: small whole-number pools repeat numbers in a long run

The work family needs whole-number answers, which limits the number sets: `PAIRS` (two workers) has 18 entries (52 with wider limits), `TRIPLES` 37, "twice as fast" 12. In a 100-question run on the four work topics, 3 to 6 number sets repeat
(same numbers, different names), mostly from `ar-work-relative-speed`, `ar-work-rate` and `ar-work-find-alone`. I tried a number-signature check in `buildDrill` (treat the same numbers under new wording as a repeat and redraw):
it did not help, because the pools themselves are too small, and it was reverted. Real fixes to try: allow answers that are terminating decimals or mixed numbers (all five choices in the same style), scale base pairs by 2-4 within sensible limits, widen
the "twice as fast" range, and give `ar-work-rate` (the old generator in `ch05-averages.js`, 16 pairs) the same wider pool.

## Traps found this session (read before you write a generator)

- A decimal among whole numbers gives the answer away. Filter to whole numbers or put every choice in the same style.
- Two "different" error modes can be the same number: `A + B - C` equals `A - (C - B)` in a parallelogram, so one distractor silently vanished. The 8,000-sample selftest finds these; run it.
- Figures bigger than anyone would sketch (coordinates to 40) read as fake. Cap them (`small()` in the shapes file).
- A single-frame wording ("A triangle has vertices ...") repeated 14 times reads as the same question. Give each kind 3 phrasings AND vary the structure.
- Awkward prose passes every structural check ("ABC and one more point are the vertices"). READ the written run.
- New error-mode ids need labels in `engine/errorModes.js` or `errorModes.test.js` fails; template counts are pinned in `engine/__tests__/arithmetic.test.js`; a seeded-drill test in `tableReading.test.js` asserted "no MK question has named errors", which was only true by luck (fixed).
- Do not write a backslash regex through a shell heredoc (this repo has lost days to it): use the Write/Edit tools.
- Call them "generators" or "question families" when you talk to Trey, and say where the engine is (`engine/generator.js`, `drill.js`, `bank.js`). Never report "N templates" as depth.
- Never write "this is not on the real test". The work-rate comment was wrong.

## How to verify any topic you touch

    npm run afoqt:selftest -- --samples=8000 --only=<generator-id>
    npm run afoqt:coverage
    npm run afoqt:concept-audit -- --concept=<concept-id> --n=100 --out=<scratch>/run.md    (then read the file)
    npx vitest run
    npm run afoqt:audit-all -- --write

If you touched the drill screen, drive it in a browser (Playwright is installed): `npm run dev -- --port 5199`, then script `/TKB/afoqt/drill?subtest=<code>` -> "Build by topic".
