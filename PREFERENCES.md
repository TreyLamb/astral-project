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
  **Every schedule view uses it, including the HTML week calendar** (`scripts/planCalendar.mjs` colours each block with
  `chipDotColor`). Trey, 2026-11-11, on a calendar drawn by block type: *"Color coordinate it, everything is white and gray."*

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
- (2026-11-17) **A test built from his study guides is organised by QUESTION STYLE, not by guide.** His exams are cumulative, so
  the same kind of question shows up on several guides. Each distinct style gets exactly 3 questions (his real one + 2 of the
  identical frame with new numbers/substances), no matter how many guides asked it. Trey: *"if 2 exams cover the same topic, just
  give me 3 questions for that, so 3 questions instead of 6."* Implemented in `courses/chem/practiceExam/` (one style = one
  generator; its test pins every style to 3 questions and the real question's answer).

## Air Force documents and how-to's (AFROTC)
- (2026-11-17) **Every Air Force publication lives in the /AFROTC Air Force Library, hosted and searchable, never as a bare link.**
  Trey: *"I want the real DAFPAM, DAFI, etc etc, to all be on there accessible through astral project."* A new one = one entry in
  `src/pages/afrotc/library/pubCatalog.js` + the PDF in Drive `SupplementalCourseDocs/AFROTC/Publications/` + `npm run afrotc:pubs`.
  e-Publishing blocks scripts: never work around it; list the publication with the exact filename to save and tell him.
- (2026-11-17) **How-to's cover simple AND complex procedures, split by role** (falling in; reveille or retreat as each detail
  member; the full ORI). Det 855's own document wins over the regulation, every step cites its source, and anything Det 855 has
  not published goes under "Not confirmed for Det 855", never guessed. `howTos.test.js` fails on a citation that does not resolve.

## Working with him
- **Reuse before build.** Find the existing component/engine first; extend it; never fork a parallel one.
- **Batch fixes and push ONCE, and only when he says "push".** Nothing is committed or pushed until then.
- **Verify before saying it works**: run it, look at the screenshot, say what you checked. Live-site check after a push.
- **He cannot open HTML files or Claude artifacts.** Send PNG images, or put text in chat; longer docs as .md/.docx in Drive.
- (2026-11-09) **No phone notifications for now.** He doesn't use them: never call PushNotification and never mention push in reports ("a waste of tokens"). About once a week, one line in a brief: phone notifications are an option if he wants them. Anything urgent goes at the top of the next message instead.
- (2026-11-11) **Research is saved once and reused: `G:\My Drive\SupplementalCourseDocs\_ResearchLibrary\`.** Before
  researching any paper or brief, read `INDEX.md` and the topic's `KEY_NUMBERS.md`, `SOURCES.md` and `SEARCH_LOG.md`.
  After researching, add every number (with source and read depth: FULL TEXT / ABSTRACT / PAGE / SECONDARY), every
  reference and every search (including ones that found nothing, plus a "NOT searched" list) the same day. The library is
  a head start, never "the complete literature": anything outside its search log gets searched. Trey: "so that in the
  future you don't have to RE-DO all this searching ... It's simply supposed to decrease research in the future not be
  the ultimate source of all knowledge."
- (2026-11-11) **ESMG 3200's main risk topic from now on is cardiovascular health and fitness** (A4 rewritten on it;
  reuse it for A6 and the final reflection when the prompt allows). A5 case analysis: a hazardous materials incident,
  never a fire one; EMS is the backup; wildland or disaster operations are acceptable.
- (2026-11-09) **Papers are planned as ONE ~2-hour sitting, not spread over 3 days.** Trey: "i always push them off and do them all at once anyways." Skeleton/brief ready beforehand, then my final edit, then he submits.
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

- **Skeletons: gray text ONLY where he writes, directly UNDER a section header** (Trey, 2026-11-10: "stop putting gray text ABOVE the header. I just want gray text in places i need to write. so nothing goes below or above the first header where nothing is written. It all begins at the explanation, under the header."). No gray NOTE above a header, nothing gray between a paper/initiative title and its first section header, nothing gray under References. The guidance for a section goes inside that section's one gray placeholder. Build skeletons with C:/Users/Trey/.claude/skills/paper-final-edit/scripts/skel.py (Skel.section(label, words, prompt)); its save() refuses a file that breaks this. (2026-11-10)
- **Paper briefs follow the paper's own skeleton, section by section** (Trey, 2026-11-10: "You are supposed to be doing the research and summing up things for me into sections using the same skeleton that i write with so i can choose how i want to write by section ... This brief is half useless"). For every heading of every part (ESFF: Explanation, Implementation, Impact, Reflection under EACH initiative), give that paragraph's own research (facts, quotes, numbers, sources) and 2-3 ways he could write it. No overview that explains each initiative once and then repeats it; nothing repeated between initiatives; the instructor's latest ask goes under the heading it belongs to. **DEPTH (Trey, 2026-11-10, on the short version: "this brief is worse. you are cutting corners and making it too short. How can i write 100 words if you only give me 50 words to learn about the topic? you are supposed to be giving me information based off sources so when i say things im at least referencing sources."):** each section gets several paragraphs of sourced material, roughly 3-6 times the paragraph's word target (a 80-word paragraph gets 250-500 words of research), written out from sources read IN FULL (download the page, not a fetch summary), with quotes and numbers and the source to cite at the end of each block. One-line bullets are not a brief. (2026-11-10)
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
  **Repeated 2026-11-12 for course folders in `G:\My Drive\SupplementalCourseDocs\`:** *"you keep making new 'microbiology'
  folders ... we already have micro 2065 folder."* Course folders are named by code and number (`MICR 2065`, `MICR 2060`,
  `CHEM 1210`, `ESMG 3200`, `AERO 1100`, `AEROS 210 (BYU Learning Suite)`). New files go in the existing one, in a subfolder
  only if one already fits. Never create `Microbiology/`, `Chem/` or any topic-named course folder. `INGEST-HOWTO.md` and
  `DATA-MODEL.md` used to tell agents to make one per course; they are corrected.
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

- **A real fitness result is recorded the turn he mentions it, with its date, and an estimate is always labelled as one.** His real
  2-mile results (9/29 18:11, 10/22 PFRA 16:42) were told to an earlier session and written nowhere, so the docs still carried a
  three-month-old estimate (14:54) that I quoted as his fitness and then built a pace answer on. Re-ask nothing he has already said:
  if a transcript or file has it, use it; if not, record what he says at once. Put every measured result (2-mile, PFRA, time trial) in `runningworkouts/training.md`
  and the memory facts file at once, and when quoting a derived number say what it was derived from and how old it is. (2026-11-09)

- **Words he will memorize or recite (jodies, songs, creeds) come from a published written version, never from my own transcription
  of a recording.** Search for the written text first and copy it word for word with the source named. If no written version exists,
  say so plainly and mark the result "from listening, unconfirmed", line by line where unsure; never fill a garbled line with the
  "usual wording" and present it as what the recording says. Trey, after a speech-to-text pass on a cadence video came out wrong:
  *"i dont like that method if it is inaccurate."* (2026-11-10)

- **FEASIBILITY FIRST, THEN A REALISTIC DAY (Trey, 2026-11-11: "This schedule is INSANELY packed, like unrealistically ... you are scheduling things within minutes of each other like I can simply go from one task to the next seamlessly, like i'm in a vacuum ... Like I shove food into my face in 15 minutes ... If i said definitively that i want to GET AHEAD by monday ... then it is YOUR JOB to come back and tell me what that looks like and it needs to be a conversation.")** Getting ahead is the STANDING goal, never a new request. Before building or changing a multi-day plan: (1) list every must-do with its deadline, its hours (TIME_AVERAGES.md medians, else estimate) and whether late work still counts; (2) compute each day's real capacity = waking window minus classes, ROTC, events and travel, minus meals (lunch and dinner 45 min, breakfast 15+), minus a break or transition before every work block (longer after LLAB, lab, PT, ODC and crowded events), minus 45+ min of downtime; (3) if a goal ("ahead by Sunday") does not fit, say so WITH THE NUMBERS and offer 2-3 options as a conversation before building; (4) state the plan's goal at the top of the plan. Caps count the WHOLE day: committed time (work + class + ROTC + travel) <= 11 h (a longer day needs a written reason), no work block over about 2 h, the must-do list ends by 9:30 PM before a 6 AM PT/ODC. All of it is enforced in src/pages/fitnesstracker/studyPlan.test.js ('is realistic from 11-12 on'). (2026-11-11)
- **One schedule file, obviously current.** The week calendar is published as `_ChiefOfStaff/Week Plan - CURRENT.html` (its header shows the
  date range and when it was built); every older plan file goes to `_ChiefOfStaff/_archive/`. Trey, 2026-11-11, on two dated plan files:
  *"there's no way to look and see which is which just by looking at them."* (2026-11-11)
- **Schedules are an EASY minimum plus 2-3 extras at the end of each day.** The minimum is what must get done plus a little more;
  the extras are real assignments he can pick up on a locked-in day to get ahead. Enforced by the studyPlan test 'ends every planned
  day from 11-10 with 2-3 extra blocks'. Trey: *"From now on always do the schedule that way."* (2026-11-10)

- 2026-11-18 (Trey: "I want a full schedule update. Planned out until the end of December. I want to see it organized on an html in calendar format ... Include everything not just school"): a long-range schedule is a CALENDAR (month view first, then week and day) built with `scripts/planCalendar.mjs` from studyPlan.js, never a text list. It covers everything: classes, ROTC, deadlines with points, workouts, holidays, personal errands, break-time study. On his PC, open the HTML in his browser; for his phone, a PDF copy in Drive (Drive cannot preview HTML, and HTML sent in chat errors for him).

## Where the other preference-style files are
- Root `CLAUDE.md` (project rules) and `src/pages/theknowledgebase/CLAUDE.md` (TKB/AFOQT/courses).
- `~/.claude/CLAUDE.md` (global) and the auto-memory folder `~/.claude/projects/c--Projects-astral-project/memory/`.
- `G:\My Drive\SupplementalCourseDocs\_ChiefOfStaff\STATE.md` (school/ROTC scheduling rules).

- 2026-11-12 (Trey, ESMG A4 intro): a skeleton or brief prompt must say exactly what each required element is, with the choices listed. "End with ONE sentence naming the program and its main parts" was not enough because it never said which parts. Under every such prompt, list the menu of parts or items (with where they are defined), and state the word target next to the section it belongs to; never leave a required element implied. Do not mix up section word targets (Introduction about 140, Evidence of Need about 220).
- 2026-11-12 (Trey, A4 brief): when he asks to update a brief or PDF, update the EXISTING file in place under its same name. Do not make a new file next to it (no _UPDATED or _v2 copies). If the file is locked, say so and retry, rather than saving a second copy.
- 2026-11-12 (Trey): briefs and study sheets are delivered as a PDF ONLY. Never also save a .docx (or .md/.html) copy in his folders; build any working file in the scratchpad and put only the PDF in Drive. Skeletons he writes in are the exception (those are .docx because he types in them).
- 2026-11-13 (Trey): a MICR 2065 Pre-Lab on its own is planned at 30 minutes; the 90-minute block is only for Pre-Lab + Case Study together (enforced in studyPlan.test.js).
- 2026-11-13 (Trey: "this should have been documented MONTHS AGO"): anything that happens every week is a STANDING block the first time it shows up twice: add it to classSchedule.js, the chief-of-staff profile's weekly table and a test the same turn. Never plan a recurring event one week at a time. When an event appears a second time, ask once whether it is weekly.
- 2026-11-13 (Trey, after MICR 2060 AIWP 1 + 2 were missed because no agent told him in time): every graded item in every course is surfaced the day it OPENS, not only near its due date. The morning check lists any open, unsubmitted Canvas/Learning Suite item that has no block in the plan.
- 2026-11-14 (Trey, Friday's 15-minute to-do list did not happen: "Scheduling was too tight for most of those things"): small no-deadline tasks (messages, emails, forms) go on the LIGHTEST day of the next three with buffer around them, never wedged into a day already full of deadlines, and a missed one moves forward the next morning instead of riding along as a reminder.
- 2026-11-16 (Trey: "I want to hyperfocus on my chem test tomorrow. Anything without a hard deadline tonight or tomorrow morning needs pushed"): the day before an exam holds only exam study plus items due that night or the next morning (and fixed events like PT). Everything else, including TBAS, Warrior Knowledge, late work and replies, moves past the exam. The TBAS test excuses such days through its written `EXAM_EVE` list.
- 2026-11-16 (Trey: "i definitely didnt wake up at 6am"): when he checks the plan mid-morning, re-plan the day from the current time. Never hand him a schedule whose first blocks are already in the past. The 4:30 AM morning check must not assume a 6 AM start on a day with no 6 AM fixed event; start his day after 7 AM unless he says otherwise.
- 2026-11-17 (Trey, ODC 11 impromptu briefings: "I initially asked for general briefs" / "This isn't enough ... DO better"): when an ODC, LLAB or class event comes with a topic list he could be handed any item from, the brief covers EVERY topic with a full ONE-PAGE researched brief each (enough real material to talk for the whole time limit: key facts with numbers and dates, three developed main points, likely questions, photo ideas, and sources with links), never a short card. Every fact comes from a source actually read that session; nothing from memory.
- 2026-11-17 (Trey: "it literally says a time on the page: 5-9 minutes"): read every page of the event's documents and state what they say. If the evaluation guide gives a time limit, that IS the time limit; never tell him "no time limit given, ask at form-up" when a page he has states one.
- 2026-11-17 (Trey): briefing slides follow HIS decks, closest to the Roma airship deck (`G:\My Drive\CadetLambRomaBrief.pptx`: white, many captioned photos, Montserrat headings + Inter body, navy #0F172A / slate #334155 / sky blue #0284C7, numbered blue circles, stat tiles), with the 14N Intel deck as the second reference. ODC 11's one-slide skeleton is `SupplementalCourseDocs/AFROTC/ODC11_Slide_Template.pptx`. Build a template first and let him approve it before filling slides.
- 2026-11-17 (Trey: "use my voice - but the formal voice ... the verbage and voice the claude agent used then was VERY VERY awkward and everything needed rephrased"): slide text and speaker notes for any briefing he gives are written in HIS formal speaking voice, the way a cadet briefs a room, using the voice profile in Drive `_ChiefOfStaff/voice/` (VOICE.md, SAMPLES.md, REVISIONS.md). No stiff, machine-like phrasing: no dropped words ("missing 'is'"), no clipped noun stacks, no context only the writer has, no invented labels. Read every line out loud before handing it over; if it sounds like a report rather than a person talking, rewrite it. His earlier 14N and Roma decks needed nearly every line rewritten for this reason.
- 2026-11-16 (Trey: "thats 3 questions in one"): one question per number, answerable in one word. Never bundle several questions into one numbered item.
- 2026-11-16 (Trey, after an agent told him to type his BYU NetID into the Teams sign-in and it offered to email a stranger a code): before any Teams sign-in (trey-ops `npm run login`), remind him up front: "sign in with your UVU email, then open BYU's Teams." Never tell him to type the NetID `tlamb3` into Microsoft's sign-in box.
- 2026-11-17 (Trey, ODC 11 decks): briefing slides have NO paragraphs (short bullets, big pictures); key facts are simplified and compared ("what is a small/medium/large payload, speed, size"), with a classification column; speaker notes = bullet points first, then exhaustive detail below (the brief lives in the notes); "who said X, when, why" goes in the notes, not on the slide; the brief is repeated as backup slides after the closing slide; style follows the Tongue and Quill; he is "Cadet Lamb" (or "Yankee Flight Flight Commander, Cadet Lamb" only if a job is needed). When he leaves overnight, schedule the work with CronCreate and keep the spec in memory so a resumed run needs nothing from the chat.
- 2026-11-18 (Trey, ODC 11 decks: point 3 "is clear ai writing weird stuff" / "everything is decided way too much on the '3 main points' ... That's just a minimum. Making it so obvious that I only am supplying the bare minimum is obvious and bad too. None of this sounds natural"): a briefing must not be built around the grading checklist. No slide titled "Three Main Points", no "Main point 1/2/3" labels, no numbered circles, and no "I will cover three main points" opening; the roadmap names the actual subjects in a sentence he would say ("I will start with ..., then move to ..., and finish with ..."). Never reuse one stock heading across decks ("Why it matters, and what is debated" appeared in 13 of 25); every heading names what that slide actually covers. No "Label:" bullets ("Debate:", "Spark:", "Successor:", "Lesson:") and no "X, and Y" title formula; bullets read as short spoken sentences. Before handing over any set of decks, list every deck's headings side by side and kill anything that repeats or reads like a template.
- 2026-11-18 (Trey, ODC 11 briefs: "60 years of gunships, from 'Spooky' to Ghostrider - this isn't a news article"; "Can a gunship survive the next war? ... sounds like i'm asking the audience"; "'which is a possibility rather than a decision' ... such ai slop ... even when you're briefing me it shouldn't feel like it's being written by haiku"): everything written for him, including research briefs meant only for him, reads like a knowledgeable person wrote it. Headings are plain informational statements: no question headings, no news-headline "from X to Y" titles, no high-school or corporate-presentation phrasing. A clarifying heading is fine when the audience needs it (Roma's three kinds of light airship). Never restate a word's own meaning as a contrast ("a possibility rather than a decision", "targets, not confirmed output", "more valuable, not less", "a set of questions rather than answers"); keep a "not X" only when X is a real, likely misreading with its own fact (friendly fire, not Iran). No filler such as "most importantly" or "this matters because".
- 2026-11-18 (Trey, ODC 11 briefs: "Losing an intact stealth aircraft to an adversary is exactly the risk that comes with flying it over hostile territory ... More nonsensical, common-sense lines ... a filler closer line that is a waste of time to read"; "'The Sentinel is not a relic' Ai-slop"): no filler sentences in anything written for him. Cut paragraph-ending "lesson" lines that restate the obvious, teaser and signpost sentences ("Defended airspace is a different story", "The fleet numbers behind that shrinkage are specific", "The administration's first message was absolute"), "X is not a relic"-style denials, and coaching asides ("A cadet should...", "The honest summary is...", "The most useful way to describe it in a briefing is..."). A sentence stays only if it carries a fact, a number, a source or an explanation he would not already know. Before handing over a brief, list every uncited, number-free sentence and justify or cut each one.
- 2026-11-18 (Trey: "'the Air Force's own policy' ... Ai slop ... if you just say 'air force's policy' then it's obvious ... if this shows up in any powerpoints, that power point is atrocious"): never write "X's own" / "its own" unless the contrast is the point (a drone that finds targets with its own sensors, a company spending its own money, a junta bombing its own people). Briefs may keep it; decks may not, and the deck builder enforces this (`deckbuild/noown.py` scrubs every slide, table and note before saving).
- 2026-11-18 (Trey: "so the f-47 is supposed to be the best air combat jet in the world? that is not clear. neither is it clear that the f-35 is an all-arounder. This type of info is what needs to be clear in these briefs, across the board"): every brief and deck states up front, in one plain line, what the thing IS FOR and where it sits next to its peers (multirole vs air superiority specialist, what it replaces, what replaces it, how big its role is). Put it right under the bottom line in the brief and as the title-slide subtitle in the deck, sourced. Slogan subtitles ("The hunter-killer and its hardest year") do not count.
- 2026-11-18 (Trey: "why did you not remind me to do my learning suite midterm that my professor re-opened for me? ... you are unreliable with my schedule"): every morning check and every "what else is due" answer covers Learning Suite (AEROS 110, AEROS 210) as well as Canvas; if it cannot be read, say so in the first line and ask. Anything we are waiting to hear back about (a professor's reply, a makeup, a reschedule) sits in STATE.md's "WAITING ON A REPLY" list and is asked about by name in every brief until closed.
- 2026-11-18 (Trey: "FORM 48 IS WAITING ON ME. are you not up to date? why would you say its waiting on captain malone"): never state who an open item is waiting on, or its status, from an old note. If the newest record is more than a couple of days old, ask him ("Where does Form 48 stand?") instead of asserting.
- 2026-11-18 (Trey: "you seriously have no sense of urgency or seriousness ... Everytime i miss a deadline you act as if i can just go to someone to ask if they can re-open it like its normal ... I keep missing deadlines because i rely on you to remind me"): a missed deadline is reported as LOST POINTS with the number and the grade weight ("AEROS 110 midterm: 0/33, 15% of the grade per the syllabus"), never softened. Asking an instructor to reopen something is not a plan; mention it only after the loss, as an unlikely extra. Every brief opens with everything due in the next 72 hours across Canvas, Learning Suite and the Det, each with its weight. Every hand-tracked deadline lives in manualCoursework.js and the plan; the studyPlan test "puts every open hand-tracked deadline ... in the plan on its date" fails if one is missing.
- 2026-11-18 (Trey): the second repo (TreyLamb/trey-ops, private) holds personal tooling and data that is neither website nor Drive. astral-project is the website; it is not a database. New capture scripts, form fillers and personal data go to the second repo; documents go to Drive. See that repo's README for the layout and the migration list.
- 2026-11-18 (Trey: "I posted nothing tuesday night. you know that. you didn't update me and i missed everything the past 2 days"): whenever he messages during a day that has open must-dos, my reply ends with the list of what is still open today and tomorrow, with due times and points, even if he asked about something else. Answering side questions (forms, contacts, uniforms) without that list is how two days of deadlines went by unmentioned. Never write 'if not posted Tuesday night' in a plan when the data already shows it was not posted.
- 2026-11-18 (Trey: "you know basically all my time before microlab goes to lab prep. stop trying to fill that time with other stuff. it's travel time and microlab time."): on a MICR 2065 lab day, the time between his last class/LLAB and the 4 PM lab is travel + lab prep (Lab Notebook, flow chart, fact sheet). Never schedule other coursework, calls or quizzes in it; move them to the night before or after lab.
- 2026-11-18 (Trey: "im not using my PT pass tomorrow, just because i ran doesnt mean i need to use my pass"): PT passes are his to spend. Do not recommend using one because he ran or is tired; plan PT as attended unless he says otherwise.
