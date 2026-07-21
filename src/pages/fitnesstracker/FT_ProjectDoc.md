Personal Workout & Training Tracker — Build Spec

Paste this whole file into Claude Code to kick off the build, or drop it into the repo as SPEC.md and point Claude Code at it.

Context

I currently track workouts by memory, on a whiteboard, or leave them stranded on my GPS watch — nothing survives long-term. I want a real tool: fast enough to log from my phone in seconds, rigorous enough that an Olympian could train off it. This will live as a page/section inside my existing personal website (Vite + React), running locally on my PC — no public deployment, single user (me), no login/auth needed.

Ground rules


Research before implementing anything with a physiological or statistical basis (pace equivalency, VDOT, CSS, 1RM, HR zones, grade-adjusted pace). Don't approximate constants from memory — verify against reputable sources and note the method/source in code comments.
Write unit tests for every calculator/conversion against known reference values (e.g., a 20:00 5K should land around VDOT 50).
Ask me before big architecture decisions instead of guessing. Specifically ask me: what GPS watch/app I actually use (for import format), where my existing site's repo lives and what its conventions are, and which Google account to wire up for calendar sync.
Confirm the phased plan below with me, then check in after each phase — don't build all of this in one uncontrolled pass.
Ship no placeholder data or stub calculators — every number in the final product should be real and correct.
Bias every UI decision toward fewer taps/keystrokes to log something. Depth and detail can live in an edit view opened afterward, not the entry flow.


Tech stack


Frontend: Vite + React (decided) — build this as a page/route inside my existing site. Inspect that repo first (ask me where it is) and match its existing routing, styling, and conventions rather than introducing a second style system.
Backend: Node.js + TypeScript API (Express or Fastify, your call) — needed even for a "local" app, because Google Calendar OAuth requires a confidential client, not just browser-side code.
Database: SQLite (Prisma or better-sqlite3) — zero-config, single file, trivial to back up by copying it.
Serve the built frontend from the same Node process as the API, bound to 0.0.0.0, so the whole thing is one process reachable at my PC's local IP from any device on my home network, including my phone.
Heads-up for me: since this only runs on my home network, my phone can only log from home Wi-Fi unless I add remote access. Flag Tailscale (free, ~10 min setup) as an option when we get there — don't build it now, just remind me.


Data model


Every workout: date/time, activity type, duration, free-text note, RPE (1–10).
Activity types aren't hardcoded — adding a new type with its own custom fields shouldn't require a code change (a type-definition table is enough; no need for a visual schema builder).
Running, swimming, and lifting ship with the rich built-in metric sets below. Everything else starts generic and is extendable.
Store all measurements in one canonical unit internally (e.g., meters, kilograms) and convert for display based on a units preference (miles/km, yards/meters, lb/kg). I'm US-based — default to miles and yards — but make it toggleable, since pools are sometimes long-course meters.


Fast entry (top priority)


One-tap "log a workout" from anywhere, mobile-first. Minimum required fields to save: activity type + one number (duration or distance). Everything else is optional and editable later.
Support shorthand parsing in a single text box — e.g. "5mi 38:20" or "1500m 22:10" — auto-filling distance, time, and pace.
"Repeat last workout" / recent-workout templates for recurring sessions.
Large touch targets, usable one-handed on a phone.
Make it installable to a phone home screen (a manifest + icon is enough) so it feels like an app, not a website.


Calendar-first UI


Primary view is a calendar (month/week/day), workouts shown on their date, color-coded by activity type.
Planned vs. completed workouts are visually distinct (e.g., outline vs. filled).
Click a day to add/edit; drag a planned workout to a new day.
Quick-add modal that doesn't force navigating away from the calendar.


Running

Build these in — don't make me reach for a separate calculator app:


Splits/segments: auto-split evenly by mile/km from total distance + time, or accept manually entered per-split times. Support structured workouts (e.g., "6×800m w/ 400m jog recovery"), each rep timed individually.
Universal pace/time/distance solver: give any two of pace, time, distance — in mi, km, m, or yd, including track distances (400/500/600/800/1000m), not just road-race distances — and solve the third. This is what covers "what mile pace does a 500m split represent."
Race-equivalency predictor using Riegel's formula: T2 = T1 × (D2/D1)^1.06 — "what would this 5K time translate to at a marathon," etc.
VDOT and derived training paces, using Daniels & Gilbert's published equations (I've checked these against current sources — re-verify before you ship them):

VO2 = -4.60 + 0.182258×v + 0.000104×v² (v = velocity, meters/min)
%VO2max = 0.8 + 0.1894393×e^(-0.012778×t) + 0.2989558×e^(-0.1932605×t) (t = time, minutes)
VDOT = VO2 / %VO2max
Derive Easy / Marathon / Threshold / Interval / Repetition training paces as percentages of VDOT's velocity — confirm the current published percentages before hardcoding them.



Grade-adjusted pace for hilly/trail runs, based on an established metabolic-cost-of-grade model (Minetti's work is the standard reference) rather than a rough guess.
Heart-rate zones via the Karvonen method: target = ((HRmax − HRrest) × %intensity) + HRrest, using real entered max/resting HR rather than assuming 220-minus-age.
Automatic PR tracking per standard distance bucket (mile, 5K, 10K, half, marathon, etc.), plus best-effort tracking for odd logged distances.
Weekly/monthly mileage and rolling totals, plus an acute:chronic training-load ratio (short-term load vs. a longer rolling average) as an early-warning signal. This is exactly the kind of correlated metric I want you to keep surfacing even when I haven't asked for it by name.
Elevation gain/loss per run, charted over time.


Swimming

Simpler than running, but still real:


Pace per 100 (meters or yards, pool-length aware).
SWOLF (stroke count + time per length) as an efficiency trend.
Critical Swim Speed: support a two-time-trial CSS test (e.g., 400m and 200m) and compute CSS = (D2 − D1) / (T2 − T1), then use it to set swim training zones the way VDOT does for running.
Structured sets (e.g., "10×100 @ interval"), with rest tracked.


Lifting

Keep this lean — I don't need much depth here:


Sets × reps × weight per exercise, optional RPE.
Estimated 1RM — Epley (weight × (1 + reps/30)) or Brzycki (weight × 36/(37−reps)); pick one or show both.
Volume per session/exercise, and a simple progress chart over time. Nothing more elaborate needed.


Import / export


I have a GPS watch I don't currently pull data off. Support dragging in exported GPX/TCX/FIT files to auto-populate a run/swim entry (distance, splits, elevation, HR, cadence if present). Use a well-maintained parsing library rather than hand-rolling one, especially for FIT — it's a binary format.
Ask me what watch/app I actually use before building the parser, so you target the right export format — and check whether a personal Strava API key is realistic to add later as an automatic phase-2 import instead of manual file drops.
CSV import/export, both to backfill old paper logs and as a plain-text backup alongside the SQLite file.


Google Calendar (two-way)


OAuth2 via the official googleapis client, local redirect URI.
Create/use a dedicated secondary calendar in my Google account (e.g. "Training") so this doesn't clutter my main calendar — it'll still show up fine in the Google Calendar phone app.
Push: planned and logged workouts become events on that calendar.
Pull: since this is local-only, there's no public endpoint for Google's push webhooks — poll for changes instead (on a timer and/or a manual refresh button) and reflect edits/deletions back into the tracker.
Decide and document clear ownership rules so the two sides don't fight each other: e.g., scheduling fields (title/date/time) are editable from either side with last-write-wins by timestamp; performance data (actual splits/pace/results) lives only in the tracker and is just summarized in the event description.


Dashboard / correlations


Weekly/monthly rollups by activity: time, distance, session count.
Pace-over-time trends per distance bucket; volume-over-time; a PR shelf.
Actively propose other correlations worth surfacing (rest-day frequency vs. pace trends, lifting volume vs. running performance, consistency streaks, whatever else you'd want if this were yours) — I want you suggesting metrics I haven't thought to ask for, not just building the list above.


Suggested build phases

Confirm/adjust this with me before starting, then check in after each phase rather than building straight through:


Scaffold + data model + calendar shell (no calculators yet)
Fast manual entry + running calculators (pace/splits/Riegel/VDOT)
Swim + lift logging
GPX/TCX/FIT import
Google Calendar two-way sync
Analytics/correlations dashboard
Stretch: Strava API auto-import, Tailscale remote-access setup


Before writing any code: confirm this plan, then ask me directly what watch/app I use, where my existing site's repo is, and which Google account to configure. Don't guess on any of those three.

I want the calendar to connect to multiple non-related calendars.

Ie: if i have a pokemon go event i just want to quick drop 'x event' and possibly a url, or have a free api call try search the related even. final logic TBD.



the dream is to say  'POGO raichu day 7/18' and then extra event info is filled in. I would like to be as vague as i can for myself while giving enough info.

Or i just supply the URL and the calendar event is summarized.

we need a way to build smart logic into the calendar. 
if i have to skip arm day , push it back 1 day, that will affect all the otehr workouts for the next few days. the calendar should prompt me about moving things. We need to come up with good ways to see this logic instead of just prompting everytime i move something.
If i schedule 'pickelball' on leg day, leg dayh will need to be decided to be moved or skipped for the week.


under the personal reacords div add a similar div but 'goals'

i want the goals to tie somehow into the calendar so i canforecast whati t might take to achieve that goal.

if i say my goal is 6 minute 1 mile. i want the program to sort of estimate that and show it to me on my calendar what it would look like, let me select how many days a week i'll train, etc. have the numbers adjust accordingly.

i want this for all types of workouts.

i'm not sure what sort of information we have on the backend but doing this by formulaes or true logic/science would be most accurate if possible.

If i 'accept' a forecasted goal, i should be able to edit those goals. Those goals should live on each workout day on taht event with little 'pins/badges' that stand out on the event so i know the goal of that event day. etc.. Go crazy make it happen and address anything else i may not have thought of