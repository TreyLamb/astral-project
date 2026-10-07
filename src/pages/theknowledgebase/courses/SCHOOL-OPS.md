# SCHOOL-OPS — quizzes, coursework dashboard, calendar sync

**Owner: the agent. Not Trey.** Trey, 2026-10-06, verbatim:

> *"I need you to TAKE POINT 100% … I want you to OWN THIS! IF you don't have something you need,
> i want to know. Just now when i asked where we stood, it doesn't sound like you're really owning
> it. … I don't want to have to think about it. I want you to build it and maintain it when i ask
> about it."*

This is the live state of three workstreams. Read it top to bottom before touching any of them,
and **update it at the end of every working block** (the "Log" at the bottom, plus any status
that changed). It sits next to `PLAN.md` (the courses module's handoff) and `AGENT-PROMPT.md`
(the ingestion manual); this file is about *running the semester*, not ingesting material.

---

## 0. How to answer "where do we stand?"

Trey's complaint that created this file: a status answer that *describes* instead of *owns*.
Every status answer, in this order:

1. **What is done and live** — with the URL he can tap.
2. **What is coming at him next** (next 7 days — open `/MFT/school`, or rebuild §4 from the
   data), ranked by points × urgency. Lead with the one he must act on first.
3. **What is broken or stale** — and what I am doing about it.
4. **What I need from him** — §5, only the open items, each with the exact steps and the time it
   takes. Never "let me know if…". If nothing is needed, say "nothing needed from you".

Never answer from memory. Re-read §2–§5 and re-check the data freshness (§3) first.

---

## 1. The three workstreams

| # | Workstream | Goal (his words) | Where it lives |
|---|---|---|---|
| 1 | **Chem quizzes** | "organizing and setting up my quizzes for chem … an all-inclusive quiz for chapters 1-4" | `/TKB/courses/chem` — exam prep, quiz center |
| 2 | **Coursework dashboard** | "a good dashboard to see what's coming up. WHEN i can start working on it and WHEN it is due. I NEED to get ahead of my homework" | `/MFT/school` + the MFT calendar's To-do rail |
| 2b | **Calendar sync** | "enter an event into ANY of my calendars, google, iphone, MFT … and have them all update each other automatically. (WORST case … once a day button press)" | Google Calendar as the hub; MFT → Settings → Calendars |

### Code map

| What | Where |
|---|---|
| Coursework model (pure, tested) | `courses/coursework/courseworkModel.js` (+ `.test.js`) |
| iCalendar parser (pure, tested) | `courses/coursework/ics.js` (+ `.test.js`) |
| Check-offs / own items / feed cache | `courses/coursework/courseworkStore.js` → localStorage + `users/{uid}/prefs/coursework` |
| The hook every surface uses | `courses/coursework/useCoursework.js` |
| Hand-maintained dates (sourced) | `courses/data/manualCoursework.js` |
| MFT planner page | `fitnesstracker/SchoolPlanner.jsx` → `/MFT/school` |
| MFT rail + calendar chips | `fitnesstracker/CalendarSideRail.jsx`, `courseTasks.js` (now a live hook), `CalendarView.jsx` |
| Chem exam/quiz practice | `courses/chem/views/ChemExamPrep.jsx`, `engine/drill.js` (`chapterWeights`) |

---

## 2. Status board

Legend: ✅ done & verified · 🟡 built, needs Trey to exercise live · 🔨 in progress · ⬜ not started · ✂️ agent-initiated cut/deferral

### Workstream 1 — Chem quizzes

| | Item | Status |
|---|---|---|
| MUST | All-inclusive Ch 1-4 practice (generated + book banks + his real graded items) | ✅ live 2026-10-06 (`f3b2302`): `/TKB/courses/chem/exam` → Exam 2 |
| MUST | Exam runs lean on new chapters (Exam 2: Ch3 ×7, Ch4 ×7, Ch1 ×3, Ch2 ×3 at 20 Qs), toggleable | ✅ |
| MUST | Every CHEM quiz has one-click practice scoped to its own sections | ✅ "Practice →" on every CHEM quiz row in `/MFT/school` |
| MUST | Quiz center in TKB: every quiz with due / sections / status / bank depth / practice | ✅ `/TKB/courses/chem/quizzes` (`4d2887b`) |
| MUST | Which quizzes have real captured items vs. need an export — explicit list | ✅ "Open items" on the quiz center (only quizzes actually TAKEN; a 0 "missing" has no attempt to export) |
| MUST | The professor's Exam 2 review sheet in the bank | ✅ all 34, worked (no key exists) — `examReview2Items.js`; "Work the whole sheet" on Exam prep (`d42e88b`) |
| SHOULD | "Explain further" go-deeper pages on missed questions | ✅ 1-2 → 4-6 (09-08 pages restored + 3-2…4-6 written); opens in a drawer so results survive |
| SHOULD | Build the bank AHEAD of each quiz: flag thin sections an upcoming quiz covers | 🟡 flagged on the quiz center; **next build: AcademiQ Ch 5 book banks (5-2…5-6) before Quiz 15 on 10-14** |
| COULD | Quiz-length/time-limit mode matching the real quiz | ⬜ |

### Workstream 2 — Coursework dashboard

| | Item | Status |
|---|---|---|
| MUST | One list of everything coming up, ALL courses: course · item · points · **opens** · **start** · **due** | ✅ `/MFT/school` (verified in browser 2026-10-06) |
| MUST | Accuracy test of the old MFT rail against its source | ✅ — **two bugs found and fixed**, see Log |
| MUST | "Start by" per item (lead time scales with stakes; exams = "study from") | ✅ `leadDays()` |
| MUST | All 10 registered courses covered | 🟡 CHEM/MICR ×2 ✅. **ESFF 1120, ESMG 3200, AERO ×5 have zero items** until the school feeds are connected (§5) — the planner names them |
| MUST | Freshness shown; refreshes itself from the Canvas + Learning Suite feeds | 🟡 built; needs §5 steps 1–5 once |
| SHOULD | Mark-done check-off, synced across devices | ✅ (local + `prefs/coursework`) |
| SHOULD | "Do next", ranked by points per day of runway, only items in their start window | ✅ |
| SHOULD | Past-due-but-unconfirmed items shown, not hidden | ✅ (19 of them right now) |
| SHOULD | Undated items listed | ✅ "No date yet" |
| SHOULD | Add an item by hand (for anything no feed carries) | ✅ form on `/MFT/school` |
| COULD | Points-due-per-day load chart | ✅ 14-day chart with hover/keyboard readout |

### Workstream 2b — Calendar sync

| | Item | Status |
|---|---|---|
| MUST | Architecture decided and written down (§6) | ✅ 2026-10-06 |
| MUST | Events entered on Google / iPhone appear in MFT | 🟡 built + tested against a simulated Google account (`e855095`); first live run = Trey's one click (§5.5) |
| MUST | Events entered in MFT appear in Google / iPhone | 🟡 same |
| MUST | Worst case one button: **Sync now** | ✅ Settings → Calendars and `/MFT/school`; auto-sync while a token is valid |
| MUST | Exact setup steps for the iPhone + Google side | ✅ §6 |
| SHOULD | Coursework due dates on the iPhone (Google subscribes to the Canvas/LS feeds) | 🟡 needs Trey: §5 |
| SHOULD | No duplicates / echo loops (every synced event carries its origin) | ✅ `ftWorkoutId` on every MFT-made event; convergence test passes |
| COULD | Zero-click background sync (Google Apps Script, hourly) | ⬜ ✂️ deferred until the one-button version is proven live |

---

## 3. Data sources and their freshness

| Source | What it gives | How it gets here | Freshness today |
|---|---|---|---|
| Canvas snapshot `data/canvasSchedule.json` | Every Canvas item: due, **opens (unlock)**, points, quiz limits, **status + score** | Trey runs `scripts/browser/canvasCapture.js` in a logged-in tab, then `npm run canvas -- --from-capture …` (UVU disables student API tokens) | 🔴 **2026-09-18** (18 days old on 10-06). Statuses are as of that day — the planner says so. |
| Canvas calendar feed (`.ics`) | Due dates for **every** Canvas course (incl. ESFF/ESMG), refreshed by Canvas. No status/points/unlock. | Google Calendar subscribes to the feed URL; MFT's calendar hub reads it back out of Google and hands it to the coursework store (`setFeeds`). Matched to snapshot items by assignment id (`event-assignment-<id>`). | ⬜ not connected (§5) |
| Learning Suite feeds (BYU, AFROTC) | Per-course schedule, assignments as all-day events. BYU regenerates the feed **once a day**. | Same path as Canvas: Google subscribes, MFT reads through Google. Each LS calendar is mapped to a course in MFT → Settings → Calendars. | ⬜ not connected (§5) |
| `data/syllabi.json` | Grade weights, policies, exam list (CHEM/MICR) | Agent-mined syllabi | CHEM midterm dates are **null** in the syllabus; only the final is dated (Dec 7, 1:00 PM). |
| Trey, in chat | Exam dates the LMS doesn't carry | `data/manualCoursework.js` with `source: 'Trey, <date>'` | CHEM Exam 2 = **2026-10-07 1:00 PM** (Trey, 2026-10-06) |

**Course roster → where its work lives** (from `coursesSeed.js`, the registrar sheet):

| Course | Credits | LMS | In the dashboard today? |
|---|---|---|---|
| CHEM 1210 | 4 | Canvas (+ AcademiQ for the book/quizzes) | ✅ snapshot |
| MICR 2060 | 3 | Canvas | ✅ snapshot |
| MICR 2065 | 1 | Canvas | ✅ snapshot |
| ESFF 1120 | 3 | Canvas (online) | 🔴 not in the 09-18 capture (unpublished then) — arrives with the Canvas feed |
| ESMG 3200 | 3 | Canvas (online) | 🔴 same |
| AERO 1100, 2100 | 1 each | BYU Learning Suite (AFROTC Det at BYU) | 🔴 arrives with the LS feeds |
| AERO 1430R, 1800R, 2000 | 0.5 each | BYU Learning Suite / none (PT, LLAB) | 🔴 same, if they publish a schedule |

---

## 4. What's coming (rebuild from `/MFT/school` — don't trust this list blindly)

_As of 2026-10-06, from the 09-18 Canvas snapshot + Trey. Statuses after 09-18 are unknown._

- **Wed 10-07 12:30 PM** · CHEM 1210 · **Quiz 14, Sec 4-6** (8 pts) — due 30 min before class, same day as Exam 2
- **Wed 10-07 1:00 PM** · CHEM 1210 · **Exam 2, Ch 1-4** (125 pts ≈11% of the grade, cumulative)
- **Wed 10-07 11:59 PM** · MICR 2060 · OLQ 7 (20 pts)
- **Thu 10-08 4:00 PM** · MICR 2065 · Module 5 Case Study (12) + Pre-Lab #5 (10)
- **Fri 10-09 11:59 PM** · MICR 2065 · Lab Notebook #5 (15) + Post-Lab #5 (15, remotely proctored)
- **Sat 10-10 11:59 PM** · MICR 2060 · OLQ 8 (20)
- **Opens Sun 10-11, due Wed 10-14 11:59 PM** · MICR 2060 · **Exam 2, MMAHP Ch 6-8 (135.84 pts ≈16%)** — study from 10-07
- **Wed 10-14 2:30 PM** · CHEM 1210 · Quiz 15, Sec 5-1 to 5-2 (6)

⚠ Coach flags:
- **8 items Canvas marked MISSING** on 09-18: CHEM Quizzes 5-8 (0/32), MICR 2060 OLQ 3, OLQ 4,
  AIWP 1, MICR 2065 "Introduction to Microbiology Lab" (0 pts). Syllabi state no late policy —
  worth asking each instructor whether missed work can be made up.
- **19 items were open on 09-18 and are now past due**, status unknown (CHEM Quizzes 9-13, MICR
  OLQ 5-6, AIWP 2, lab notebooks …). He should tick off the ones he did on `/MFT/school`.
- CHEM Exam 1 = 76/100.

---

## 5. What I need from Trey (open items only)

One-time actions, ordered by how much each unblocks. Total ≈ 10 minutes.

1. **Canvas calendar feed URL** (1 min). Canvas → **Calendar** (left nav) → right sidebar,
   bottom: **Calendar Feed** → copy the link.
2. **Learning Suite feed URLs** (2 min). learningsuite.byu.edu → each AERO course → **Schedule**
   tab → **Get iCalendar Feed** → copy. One per course that has a schedule.
3. **Subscribe Google to them** (2 min). calendar.google.com → left panel, *Other calendars* →
   **+** → **From URL** → paste each link → Add. (This alone puts every due date on the iPhone.)
4. **iPhone ↔ Google** (2 min, if not already): Settings → Calendar → Accounts → Add Account →
   Google → Calendars on. Then Settings → Calendar → **Default Calendar** → a Google calendar.
5. **One click in MFT:** MFT → Settings → Calendars → **Connect Google & sync** (pick the same Google
   account you use on the site). Then pick the course for each Learning Suite feed in the table.
6. **(Optional, for graded/missing status)** re-run the Canvas capture (2 min) — the feed carries
   due dates, not submission status. Steps: `INGEST-HOWTO.md` → "Canvas capture".
7. **Chem quiz attempt PDFs** for every quiz taken since Quiz 4 — the single best study source
   (exact wording + what he missed). Canvas → quiz → attempt review → Print → Save as PDF → drop
   in `SupplementalCourseDocs/CHEM 1210/`.

---

## 6. Calendar sync — the architecture (decided 2026-10-06)

**Google Calendar is the hub.** Everything talks to Google, never to each other, so there is
exactly one copy of every event and no app needs to know about any other.

```
 iPhone Calendar ⇄ Google Calendar ⇄ MFT (Settings → Calendars)
      (native)        ↑      ↑
                      │      └── Canvas feed (.ics)          ← Google subscribes ("From URL")
                      └───────── Learning Suite feeds (.ics) ← same
```

- **iPhone ⇄ Google: no code.** See §5.4. The Default Calendar setting is the #1 way this
  breaks: events typed on the iPhone into an iCloud calendar never reach Google.
- **Canvas / Learning Suite → Google: no code.** §5.3. Google refreshes subscribed feeds itself
  (hours to a day); BYU only regenerates its feed daily anyway.
- **Google → MFT (school feeds):** MFT reads the subscribed calendars back out of Google and
  feeds them to the coursework model, so `/MFT/school` refreshes from them — every course,
  including ones the capture never saw. ✂️ A direct `.ics` fetch was designed and dropped: it
  needs a server proxy (no CORS on either LMS), and root `CLAUDE.md` requires every `api/`
  endpoint to sit behind a Vercel secret Trey would have to configure. Going through Google needs
  neither, and Google has to subscribe anyway for the iPhone.
- **MFT ⇄ Google (events):** MFT reads the Google calendars Trey picks (so anything entered on
  the iPhone shows in MFT) and writes MFT's own events + workouts to dedicated Google calendars
  (so they show on the iPhone). Every event MFT writes carries a private `astralId` property —
  that is how a round trip is recognised instead of duplicated.
- **Why not fully automatic?** A browser holds a Google token for ~1 hour and there is no server
  holding a refresh token, so sync runs while MFT is open and connected, with **Sync now** as the
  one-button fallback Trey named as acceptable.

---

## 7. Decisions (with reasons — don't relitigate without new facts)

| Date | Decision | Why |
|---|---|---|
| 2026-10-06 | Learning Suite: use its per-course **iCalendar feed**, not scraping and not hand-typing | BYU documents the feed (Schedule tab → Get iCalendar Feed); zero maintenance. Hand-added items cover anything a feed misses. |
| 2026-10-06 | School feeds reach MFT **through Google**, not a direct `.ics` proxy | A proxy needs `api/` + a Vercel secret (root CLAUDE.md) that Trey would have to configure; Google must subscribe anyway for the iPhone. One setup step instead of two. |
| 2026-10-06 | Keep the Canvas capture snippet for status | The feed has due dates only; graded/missing/score/unlock come only from the capture. |
| 2026-10-06 | Google Calendar = sync hub | iPhone ⇄ Google is native and two-way; making MFT the hub would need a server the site deliberately doesn't run. |
| 2026-10-06 | Exam runs weight new chapters ×2 | Syllabus: every exam cumulative, no split stated. Uniform-over-templates made Exam 2 ≈⅔ Ch 1-2 review. Toggle exists. |
| 2026-10-06 | Real items keyed to the CORRECT answer even where AcademiQ's grader is wrong; explanation names what AcademiQ expects | Exam prep must not teach a wrong answer; he still needs to know what the quiz grader marks. |
| 2026-10-06 | Coursework check-off reintroduced (09-08 had ✂️ "no check-off") | A stale snapshot shows finished work as owed forever; "get ahead" needs a done state. Never written back to an LMS. |
| 2026-10-06 | Lead times: ≤10 pts 1 day, ≤20 2, ≤50 4, more 6; exams ≥100 pts 7 days (4 if smaller); exam study ignores the open date | A coaching rule in one function (`leadDays`), tunable in one place. |
| 2026-10-06 | "Do next" only ranks items whose start date is today or tomorrow | Raw points-per-day put a 275-pt final 62 days out above tomorrow's quiz. |

---

## 8. Maintenance routines

- **Whenever he asks, or weekly:** open `/MFT/school` (or rebuild §4) → check §3 freshness → if
  the snapshot is >7 days old and no feed is connected, re-ask §5.
- **When he tells you a date** (exam, deadline): add it to `data/manualCoursework.js` as a patch
  (if the LMS has the item undated) or an extra, with `source: 'Trey, <date>'`. Commit + push.
- **When a chem quiz PDF lands:** mine it (`theknowledgebase/CLAUDE.md` recipe — no text layer,
  questions start on page 3) into the real-item pool; update the quiz center's export list.
- **Before each chem quiz:** check coverage for its sections (`npm run chem:coverage`, the quiz
  center); build templates for a thin section *before* the due date, not after.
- **After an exam:** record the score in `manualCoursework.js` (patch `note`) and move
  `STUDIED_THROUGH_CHAPTER` in `chem/syllabusMap.js` when class moves on.

---

## Log

- **2026-10-06** — File created. Exam 2 prep shipped (`f3b2302`). Recovered the unpushed
  2026-09-08 chem pools from a git stash. Research: Canvas + Learning Suite both expose iCal
  feeds (BYU: per course, refreshed once daily). Architecture for 2b decided (§6).
- **2026-10-06** — Accuracy test of the old MFT coursework rail (Playwright against the real
  data): **(1)** every item past due whose captured status was `todo` vanished — 19 items,
  including CHEM Quizzes 9-13 — because only `missing`/`unknown` were shown; **(2)** undated
  items never appeared, so CHEM Exam 2 was absent the day before it. Both fixed by the new shared
  coursework model (regression tests in `courseworkModel.test.js`). Built `/MFT/school`, rebuilt
  the rail (Do next, Missing, past-due-unconfirmed, start hints, check-offs), exam chips bold on
  the calendar. 4,653 tests pass; build green.
- **2026-10-06/07** — Quiz center, "Explain further" pages through 4-6, combustion analysis (4-6
  does teach it — an earlier heading-only scan missed it), sig-fig-safe generated masses. Calendar
  hub: pure planner + 18 tests, end-to-end test against a simulated Google account (push, phone
  reschedule, phone event import, feeds, overlay, convergence, deletions both ways); verified in a
  browser up to Google's sign-in popup. A parallel session (`courses-b1`) transcribed the
  professor's Exam 2 review sheet; registered here as `examReview2Items.js` with worked answers.
  Coordination note sent to that session; its uncommitted TKB `CLAUDE.md` / `PLAN.md` edits were
  left alone. ⚠ The 09-08 "check slide-deck PDFs for Acrobat annotations" rule is still only in
  `git stash@{0}` — offered to `courses-b1`, fold it into TKB CLAUDE.md / AGENT-PROMPT §4.3 if it
  hasn't been.
