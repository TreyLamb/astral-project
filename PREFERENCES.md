# PREFERENCES.md — how Trey wants things done

Read this before any work, in every session. It is the list of things he has already told an agent and should never
have to say twice (Trey, 2026-11-03: *"sometimes you just do what i say and you don't learn HOW i want things done for
the future. i hate having to repeat myself"*).

## 🔴 The standing rule for agents: capture it the SAME TURN
When Trey corrects you, complains, or says "I want X" / "always" / "stop doing Y":
1. Fix the thing he asked about.
2. **Ask yourself what the general rule behind it is**, and write that rule here (one line, dated, with his words if
   short). A fix without the rule behind it means he will have to say it again next week.
3. If it is enforceable, **enforce it in code** (a test, a lint, a shared helper) so nobody has to remember it.
4. If it belongs to one subsystem, also put it in that subsystem's CLAUDE.md. This file is the index he can read.
Do not wait to be told to write it down. Mention in your reply, in one line, which rule you added.

## Writing on screen (chips, labels, titles, buttons)
- 🔴 **NO SHORTHAND, ANYWHERE** (chat replies, briefs, skeletons, plans, notes, labels). Write every line so it makes
  sense to someone reading it cold, with no context: full sentences, say what each thing IS, no slash-lists of
  half-phrases, no private labels. Trey has asked for this many times: *"its so annoying and its a waste of time the
  shorthand makes NO SENSE without context 99% of the time."* (2026-11-04)
- **Never use abbreviations he might not know or that are ambiguous.** "DB" for discussion board needed explaining;
  write "Discussion Board". Shorten only when it genuinely does not fit, and then only with a standard one. Spell out:
  Init → Initiative, DB → Discussion Board, Q21 → Quiz 21, A4 → Assignment 4, W3 → Week 3. (2026-11-03)
- **Name the course on every quiz/assignment**: "CHEM 1210 Quiz 21", never bare "Q21" or "1210 Quiz 21". (memory: name the course)
- **A label says what the thing IS, once.** Drop what the row already shows or what is fixed anyway:
  durations ("30 min") on a block that has a time, chapter/section refs in parentheses ("(Ch 11)", "(Sec 5-1, 5-2)"),
  textbook refs ("on MMAHP Ch 11"), the tool it is done in ("(Learning Suite)"), scores ("(63%)"), "this week".
  Full detail lives in the hover tooltip and the notes, never in the chip. (2026-11-03)
- **No SHOUTING.** All-caps words (INITIATIVE, SUBMIT, QUIZ) read as noise. Keep only real acronyms and course codes.
- **Cross-listed duplicates are one item**, not two ("3200 Week 4 Discussion" + "2026-XLIST Week 4 Discussion").
- The shared implementation is `src/pages/fitnesstracker/calendarText.js` (`tidyTitle`, `tidyCourseName`, `dedupeCrossListed`),
  and its test fails if a plan title regresses. Add a rule there, not a one-off string edit.

## Colour
- **Colour must mean one thing, everywhere, and he chose them (2026-11-03): green = CHEM 1210, purple = MICR 2065 (micro lab),
  fuchsia = MICR 2060, orange = ESFF 1120 and burnt orange = ESMG 3200 (the two fire classes), every AERO class AND every
  ROTC event = a shade of blue, red = something is due, white = a star important date.** A course keeps its colour on every
  surface (class, prep block, quiz, coursework chip, dot AND text). Non-course items are greys/white so they never read
  as a class. A new course gets a unique colour in `COURSE_COLORS` (`courses/coursework/courseworkModel.js`) and a line in
  `COLOR_LEGEND`; the colour key under the calendar shows them. Never assign colour by an incidental category such as "work block".
  Source of truth: `COURSE_COLORS` + `chipDotColor`/`chipTextColor` in `calendarText.js` (a test pins the hues).

## Lists and panels
- **The calendar To-do tab is NOT school.** It is the extra things he has to do (Orbit to-dos). School work lives in the
  Coursework chips and /MFT/school. (2026-11-03)
- **Every input must look like an input**: bordered, themed, with a visible placeholder. An unstyled box reads as a blank bar and he
  concludes the feature is missing (song looper B time, 2026-11-04). Screenshot new controls at phone width before saying done.
- **A button must do something in every view it appears in.** If it cannot, hide it or change its meaning for that view.
  Song page: every song tab (Air Force Song, Space Force Song, Airman's Creed) opens a player with a recording, never an empty one;
  give each a `videos` list in `SongMemorizer.jsx`. React keys must be unique across SIBLINGS (player vs editor shared `key="af"` and left a stale player behind). (2026-11-04)
- **The per-week side columns (To-do/Goals + Miles beside Saturday) were deleted, 2026-11-03**: "obviously a useless function". Do not bring them back. A feature he cannot explain the purpose of is a candidate for removal; ask rather than keep it.
- **Optional side panels (rails, stats columns) default OFF**; he turns them on. (2026-11-03)
- **Items stack from the top** of a cell/column, never pinned to the bottom. (2026-11-03)
- **Zooming a view must change the size and layout**, not just the container (Day view ≠ a taller Week view).

## Quizzes and tests (every one, without being asked)
Back/Next + change answers, 5-7 step hint ladder (no values, no answer), NO letter hotkeys, never fire on Ctrl/Cmd/Alt,
results screen with every question. Reuse the AFOQT `DrillRunner`/`ExamRunner` pattern. (Root CLAUDE.md rules 6-13.)

## Working with him
- **Reuse before build.** Find the existing component/engine first; extend it; never fork a parallel one.
- **Batch fixes and push ONCE, and only when he says "push".** Nothing is committed or pushed until then.
- **Verify before saying it works**: run it, look at the screenshot, say what you checked. Live-site check after a push.
- **He cannot open HTML files or Claude artifacts.** Send PNG images, or put text in chat; longer docs as .md/.docx in Drive.
- **Design suggestions are shown, not imposed**: captioned NOW-vs-PROPOSED PNG mockups in a folder, researched against
  real apps (Google/Apple Calendar). Outright bugs get fixed. He has made many deliberate layout choices; do not
  restyle them unasked.
- **Do the research** before touching anything where he is not the expert (running plans, design) and say what you
  looked at. Never say something "doesn't exist" from one search.
- **Max 2 subagents at once, default 1**, and they write to disk after every unit.
- **Be brief in replies**: lead with what changed and what you checked; no recap of the whole session.
- **Never ask him something the repo, STATE.md or his Drive already answers.**
- **State uncertainty plainly**; flag anything under 100% sure instead of presenting it as fact.
- **Sanity-check every time he gives against the clock before scheduling it.** If it can't be right ("back at 4" when
  it's 3:55 and he's about to run and get dinner), read it as the plausible time and say so in one line. (2026-11-03)
- **Anything that would overload tomorrow is "due today."** Before finalising a day, look at tomorrow's fixed load
  (ROTC events, lab, early starts); pull work forward until tomorrow is reasonable, up to today's cap. Trey: *"Whatever
  we need to do today to not make tomorrow too busy - consider it 'due today' and we will get it done."* (2026-11-04)

- **A recurring rule gets a recurring check, for EVERY week, never one hard-coded week.** The ESMG "reply on 3+ days for
  extra credit" test only checked Week 3, so Week 4 went out with no replies after Monday and no reminder. Trey: *"You
  didn't remind me at all this week to reply to the extra discussions."* Tests loop over every week in the plan, and every
  daily habit (ESMG replies, Warrior Knowledge) gets a line in the morning brief. (2026-11-04)

- **Briefs are never ambiguous about scope.** Each topic opens with one bold sentence saying what it IS focused on, then
  names what is only one part of it. If the sources or examples lean toward one subtopic, the brief says so outright
  ("cancer is one of four parts, not the focus"). Trey: *"Stop being ambiguous, we have talked about that for briefs like
  this."* (2026-11-04, ESFF Initiative 5 read as a cancer paper)
  **Skeleton prompts are full sentences he can read cold**: no shorthand lists like "(weekly wellness memo / 5-hour
  homework cap)". Say what the heading asks, what each example option IS, and why it fits. Trey on the 5+6 skeleton:
  *"I have no idea what any of this means."* (2026-11-04)

- **Never ask him to send a file you can already read** (Drive, the repo, Downloads). Open it yourself. Trey: *"why am i
  sending you the file? You know where it is."* (2026-11-04)
- **"(citation)" in his draft is an instruction to me:** the final edit inserts the correct APA in-text citation there and
  adds the matching reference. The final edit of a paper is mine: citations, reference lists, formatting, typos and the
  word count, in a separate _FINAL copy, with his wording left as his. Don't flag his placeholders as mistakes. (2026-11-04)
  The whole workflow is the user-level **`paper-final-edit` skill** (`~/.claude/skills/paper-final-edit/`), made because "we always have this conversation".

- **A special event does not cancel his regular classes unless he or the event notice says so.** Keep the class blocks in the plan and ask once if it is unclear. The 11-5 Presidential Review plan dropped AERO 1100 and AERO 2100 and filled 8-9 AM with homework; both classes were still on. (2026-11-05)

- **Plan the change of clothes around a workout.** Every run or workout block gets about 15 minutes before it to change into PT
  gear and about 30 minutes after it to shower and change, unless nothing comes before or after it. On 11-5 the plan put a run right
  after homework ended and gave 20 minutes to get from the run to a lab, so the run did not happen. `studyPlan.test.js` enforces
  the gaps. (2026-11-05)
- **ESFF 1120: Dr. L's Thursday "Welcome to Module N" post is the brief for the next initiative pair.** It is a Canvas
  announcement (for example /courses/657840/discussion_topics/4586769, 11-5) that says what he wants in the next two papers and gives
  feedback on the last pair. Read it before building a skeleton or writing, and fold it into the brief. **Write the pair early, but
  submit only after the previous pair is graded**, so his feedback can change the draft (one attempt per paper; Trey, 11-5). (2026-11-05)
- **Size blocks from what things really take, not a guess.** MICR 2065 Pre-Lab plus Case Study takes about 1.5 hours together
  ("as per usual"), so it is planned at 90 minutes; the plan test enforces it. Use `_ChiefOfStaff/time-log.csv` medians for the rest. (2026-11-05)
- **TBAS practice is 30 minutes every day until he takes the test.** Every planned day gets its own block; the plan test
  enforces it until `TBAS_TEST` in `studyPlan.test.js` is set to the test date (Capt Malone has not scheduled it yet). (2026-11-06)
- **Spell out every acronym in a brief the first time it appears**, in parentheses: "AMC (Air Mobility Command)". He asked for
  it on the MAJCOM brief; apply it to every brief, study sheet and plan note. (2026-11-06)

- **Photos or files that do not match the question I just asked are not a task.** Say what I see in one line and ask what he wants
  done with them before making anything. Never turn "organize them" into a PDF or any other file on a guess. On 11-6 he sent ten
  MICR 2065 lab notebook photos meant for another session, while I was waiting on handbook pages, and I started building a PDF of them.
  He was upset: *"why would you randomly put them in a pdf."* (2026-11-06)
- **Never create a second folder for something that already has one.** Before making a folder, list the parent and reuse the
  existing one even if its name differs (`Lab8_Pics` already existed when I made `LabNotebook8` for the same lab; he had to move
  the files himself). If two names fit, use the older one and say which. (2026-11-06)
- **A study document holds the CONTENT, not the working notes.** The Det 855 handbook page exists to be a virtual copy of his
  pocket handbook, and earlier agents filled it with "Trey's chain", "photo cut off", "Trey chose", source-hunting asides and a
  to-do list. Content docs under `src/pages/afrotc/docs/` and the study pages state the facts and, at most, one short line of
  status (✅ copied from the book, 📘 public sources, ⏳ not added). Process notes, who decided what, and next steps go in STATE.md
  or the chat, never in the document he reads. Never refer to him by name in app content. (2026-11-07)
- **Search every section, and let him preview before he navigates.** AFROTC search covers all pages (handbook, quizzes, briefs,
  lists, cards, roster, references, recitation); a result can be previewed in place and opened at the exact heading. A new AFROTC
  page or data file must be added to `getSearchIndex()` in `AfrotcApp.jsx`, or it is invisible to search. (2026-11-07)

- **A graded attempt is fact-check material: apply it to the practice worksheet the same day it lands.** Every question that scored
  becomes `graded`; every wrong pick becomes `knownWrong` and its answer is re-derived from the chapter (flagged unsure if not certain).
  The graded MICR 2060 OLQ 12 PDF sat in Drive from 11-3 while the Chapter 12 worksheet still said "derived" on all 66 questions,
  and 7 of those derived answers were the exact picks Canvas had marked wrong. Trey: *"everything still says its derived and not
  official when we have a whole quiz to fact check on."* (2026-11-07)

## Where the other preference-style files are
- Root `CLAUDE.md` (project rules) and `src/pages/theknowledgebase/CLAUDE.md` (TKB/AFOQT/courses).
- `~/.claude/CLAUDE.md` (global) and the auto-memory folder `~/.claude/projects/c--Projects-astral-project/memory/`.
- `G:\My Drive\SupplementalCourseDocs\_ChiefOfStaff\STATE.md` (school/ROTC scheduling rules).
