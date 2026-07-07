# VSC / Claude Code Handoff Prompt

Paste this into Claude Code along with the attached `project-notes.md`. Read the notes file fully before writing any code — it's the full spec.

---

I'm building a personal rapid-review study app (full spec in `project-notes.md` — read it first). This is **Phase 1: UI and functionality with mock/stub data.** No real data ingestion yet — just enough sample questions to make every screen and interaction demonstrable.

## Before you start, ask me:
1. What my current hosting setup supports (static only, Node-capable, etc.) — this determines whether we go full Next.js with API routes + a real DB now, or a static frontend with local mock data for now and a backend added later.
2. Whether I want SQLite (simplest, file-based) or a hosted Postgres option (e.g. Supabase) for persistence — given mobile access is a priority, lean toward whichever is easier to reach from a phone browser.

## Stack defaults (use unless my answers above say otherwise)
- Next.js (React) — single deployable app, supports PWA setup, API routes for backend logic.
- Prisma + SQLite to start (swappable to Postgres later without rewriting query logic).
- Framer Motion for transitions/animations.
- Tailwind for styling.
- PWA manifest + service worker from the start (installable, offline-capable shell).

## Build in this order

### 1. Data model (from spec)
Implement these entities: `Subject`, `Subtopic`, `Question`, `StyleTag`, `Profile`, `WeightConfig` (subject/tag/question weights), `CycleState` (active/rest tracking per question), `SessionLog`. Seed with mock data: ~10 subjects, ~5 subtopics each, ~15–20 mock questions per subject, spanning basic/intermediate/advanced.

### 2. Weighting & selection engine
Implement exactly as specified: `effective_weight = subject_weight × style_tag_weight × question_weight`, largest-remainder allocation across subjects to hit session size N exactly, then weighted-random sampling within each subject's slice. Build the recall-support cycle (active_days/rest_days, randomized within configurable ranges, capped concurrent-cycling count) as a separate module — this should be testable independent of the UI.

### 3. Review flow (Main Recall pace)
- Keyboard-first: space/enter to reveal answer, dedicated keys for self-grade, flag, add-back-to-stack.
- Retry mechanic: wrong/unsure re-inserts the question at a randomized offset (10–40 questions) later in the *current* session queue.
- Fast, interruptible transition animation between questions — must not block input if the user is moving faster than the animation.
- Session progress indicator (question X of N, accounting for growth from retries).

### 4. Quick Facts flow
Same engine, slower pace class — always reveal full answer/explanation after grading, since content is new. Separate queue from Main Recall.

### 5. Subject bubble page
- Bubble size = mock question count.
- Toggle switch between two color/fill views: coverage % (per difficulty tier) and staleness (days since last shown) — use placeholder coverage numbers from mock subtopic checklists for now.
- Inline edit: rename, merge, delete subjects. Assign subject visibility to profiles.

### 6. Profiles
Implement the three-setting profile object (`subject_scope`, `adjustment_mode`, `pace_class`). Ship four presets: Main Recall, Quick Facts, Auto-Adjust (All), Auto-Adjust (Scoped) — auto-adjust weighting logic can be a stub (simple "lower weight after correct streak, raise after miss" heuristic) for now, not full FSRS-style modeling.

### 7. Color system
- Neutral canvas (warm light gray / cream / pale sage — not stark white).
- Weighted accent color pool for transitions/buttons/progress bar: sky blue + coral ~70–80% combined, green + yellow ~15–20%, other shades ~5%, with slight shade jitter within blue/red.
- Fixed feedback colors for correct/incorrect, kept visually distinct from the decorative accent pool.
- Build a toggleable experiment: fixed-color-per-subject tag vs. the rotating accent pool, so both can be compared live.

### 8. Settings screens
- Manual dial editors (subject weight, style tag weight, per-question weight) with persistence.
- Recall-support cycle config (active_days range, rest_days range, max concurrent cycling questions).
- Focus weeks: temporary override with auto-revert date, layered separately from baseline weights.
- Optional self-rating toggle (off by default).

### 9. Export
JSON export of the full question bank + weights + session history, from day one.

## Explicitly out of scope for this phase
- Real API ingestion adapters (OpenTDB, MMLU, Trivia API) — stub the adapter interface (`question, choices, answer, subject, tags, source, status`) so sources can plug in later, but don't wire real network calls yet.
- Full FSRS-style predictive auto-adjust — heuristic stub only.
- Native app wrapper.

## Deliverable
A running local dev build I can test in browser (desktop and mobile viewport), with all screens above navigable using mock data, before we talk about connecting real sources.
