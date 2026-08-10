# Orbit — Personal Organization System

> **Source of truth for Orbit.** Rewritten 2026-07-23 from the original `organization_page.md` draft (which was
> AI-authored, had flaws, and had an accidental VS Code `settings.json` paste corrupting its Prisma block — all
> removed here). This reflects what was actually decided and built, and is the doc to keep current going forward.
> Route: `/orbit`. Sub-app folder: `src/pages/orbit/`. CSS prefix: `orb-`.

---

## 1. Purpose & philosophy

A single-user personal organization system for tasks, projects, and priorities — **Capture → Organize → Execute**.
Not a team tool, not a wiki, not a calendar replacement.

Three concerns are kept structurally separate:
- **Capture** — get something out of your head with zero friction, zero categorization required.
- **Organize** — where a thing lives (Area / Project), how important/urgent/costly it is, and what blocks it.
- **Execute** — what to do *right now* (Today view) and how to spread the rest across your days (Planner).

**Design mandate:** the app opens on **Today** every time; ~90% of interactions happen there in a single glance.

---

## 2. Core principles (must survive future changes)

- **Today is the home screen.** Opens there by default.
- **Priority is a property, not a page.** It's derived from a task's own axes, never a hand-maintained ranked list.
- **Capture is decoupled from categorization.** An inbox item needs only raw text. (Optional triage-as-you-type
  exists on the full-screen mobile add, but is never forced.)
- **Triage is a separate step.** Untriaged inbox items don't appear in Today and get no priority until triaged.
- **Local-first, instant.** Every core interaction is optimistic and works offline.
- **Stale/overdue/carryover detection is automatic**, not user-maintained.

---

## 3. Architecture (as built)

Orbit is a sub-app on this repo's proven FitnessTracker pattern (NOT the original draft's Next.js/Prisma/SQLite —
that can't run in this Vite SPA; it's superseded here).

- **Persistence: Firestore-primary when signed in, localStorage otherwise.** Signed in → Firestore is the source of
  truth and localStorage is an offline mirror; guest/offline → localStorage is the truth. All writes are **optimistic**.
  In cloud mode, writes are **coalesced**: a mutation marks a doc dirty (a `Map<id,version>`), and a single debounced
  `flush()` ships the whole batch (with a version guard so an edit made mid-flight is never dropped). Flush also fires
  on tab-hide/unload. Keeps Firestore write volume low.
- **State:** `orbitContext.js` (`useOrbitState()` hook, no component export). `orbitStorage.js` (localStorage) and
  `orbitFirestore.js` (per-user `users/{uid}/orbit_*`) are mirror APIs; `makeBackend(user)` picks one.
- **Pure logic + tests:** `calc/*` (priority, readiness, housekeeping, recurrence, carryover, trackers, review,
  planner) with vitest — **78 tests**.
- **UI:** `OrbitApp.jsx` shell (own topbar, left-nav, nested routes, global Ctrl+K capture bar + Ctrl+/ search overlay),
  screens under `views/`, one shared `TaskRow` (expand-in-place `TaskEditor`), scoped `Orbit.css`.
- **Housekeeping-on-open** (once/day, replaces server cron): unpin stale pins, purge discarded inbox items past
  retention, generate recurring-task instances, reset trackers, auto-generate the Monday weekly review.
- **Serverless (`api/`):** `orbit-capture` (iOS Shortcut/share-sheet → inbox, bearer-secret auth) and `orbit-ai-triage`
  (browser button, Firebase-ID-token auth) using a free AI provider rotation (`_lib/aiProviders.js`: Groq → GitHub
  Models → Gemini).

---

## 4. Data model

- **Area** — `id, name, color, sortOrder, archived, createdAt`. Archive-first; hard-delete only when empty. Cap 12 (warn >10).
- **Project** — `id, areaId, name, status(active|paused|done|archived), notesMarkdown, dueDate, createdAt, updatedAt, lastTouchedAt`.
- **Task** — `id, areaId(req), projectId?, parentTaskId?(subtasks), title, status(todo|doing|done|killed),`
  **`importance(1–5), urgency(1–5), timeMin, difficulty(1–5), energy(1–5)`** `, priorityScore, taskType?, dueDate?,`
  `scheduledDate?, scheduledTime?, pinnedToday, pinnedOn, blockedBy[], lane(now|next|later|null), recurrenceId?,`
  `createdAt, completedAt?, lastTouchedAt`. **No `effort` field** — it was replaced by time + difficulty + energy.
- **InboxItem** — `id, rawText, createdAt, triaged, outcome(null|task|project|reference|discarded), discardedAt?,`
  `resultId?, aiCleanedAt?, aiCleanedFrom?` (+ `aiOriginal` written server-side for revert).
- **ReferenceItem** — `id, areaId?(unfiled ok), title, bodyMarkdown, url?, timestamps`.
- **RecurrenceRule** — `id, title, area/project/type + the 5 axes, freq(daily|weekly|monthly|interval), interval,`
  `weekdays[], dayOfMonth, anchorDate, active, lastGeneratedDate`. Materializes Task instances (`recurrenceId`) on open.
- **Tracker** — `id, areaId, name, type(counter|streak), currentValue, resetInterval(daily|weekly|none), lastResetAt, lastQualifiedDate`.
- **ReviewLog** — `id, weekOf, shippedTaskIds[], staleProjectIds[], overdueTaskIds[], generatedAt, aiNarrative?`.
- **DayPlan** — `date(=id), capacityTimeMin?, capacityEnergy?, note` (null capacity → `settings.capacityDefault`).
- **Settings** — `importanceWeight, urgencyWeight, costWeight, staleDays, discardRetentionDays, defaultView, lanes[], taskTypes[], capacityDefault{timeMin,energy}`.

---

## 5. Prioritization model

**Stored score:** `priorityScore = importanceWeight·importance + urgencyWeight·urgency − costWeight·((difficulty+energy)/2)`
(defaults 2 / 2 / 1; tunable in Settings). Recomputed on every write in one place — the UI never supplies a score.

**Today ordering:** overdue tasks float to the top (single reserved warm accent `--orb-warn`), then by score desc,
ties by dueDate asc (nulls last). **Blocked** tasks (any `blockedBy` not done/killed) are excluded from Today.

**Two matrices** (share the Importance axis) are the tactile triage surface: **Eisenhower** = Importance × Urgency;
**Action-Priority** = Importance × cost `(difficulty+energy)/2`. Drag a task in the grid to set its axes. (The
Phase-0 mock gallery at `/orbit/mocks` additionally compares three granularity models — weighted / due-urgency /
quadrant — for reference.)

**Time + difficulty + energy** feed the **capacity planner**, not the base rank: the Planner distributes chosen tasks
across future days until each day's Σtime / Σenergy hits its capacity (per-day override or the global default), overflow
bumping to the next day.

---

## 6. Screens & features

- **Today** — scheduled-today ∪ due-today ∪ pinned, unblocked, ranked; overdue floats; empty state shows only the
  untriaged count. One-click complete, pin from any row, expand any row to a full inline `TaskEditor`.
- **Capture** — Ctrl+K quick bar (rawText only, Enter re-arms for rapid multi-capture) + a full-screen mobile "Add
  task" screen (title-only valid; set the axes to pre-triage; set an Area to create an already-triaged task directly).
- **Triage** — one-at-a-time queue with single-key `t/p/r/d` + swipe + undo (TKB-style), plus a full task list with
  task-type + status filters. An **"✨ Tidy inbox with AI"** button (cloud only) cleans up typos/wording non-destructively.
- **Areas** — manage areas (rename, recolor, reorder, archive/restore, hard-delete when empty; delete-guard otherwise),
  each expanding to its projects, direct tasks, and tracker widgets.
- **Project pages** — inline header (name/area/status/due), markdown notes with `[[reference]]` wiki-links, scoped task
  list with nested subtasks, blocking "mark done" guard, linked-references list.
- **Reference Vault** — full-text search + area filter, inline CRUD, one-way `[[title]]` linking from project notes.
- **Recurring** — manage repeat rules with a live "next occurrences" preview; "🔁 Make repeating" from any task editor.
- **Carryover** — triage yesterday's misses: Do-today (+urgency), reschedule, or kill; bulk "do all today."
- **Planner** — per-day capacity (time + energy, editable), auto-distribute ready/unscheduled tasks by priority within
  capacity, manual per-task day override, apply to set schedules.
- **History** — any date's list (scheduled-that-day ∪ completed-that-day), week strip, editable day note; past days stay intact.
- **Weekly Review** — read-only shipped / stale-projects / overdue, auto-generated each Monday or on demand, with jump-to links.
- **Trackers** — counters (± ) and streaks ("did it today", auto-reset on a missed day); no charts.
- **Views hub** (`/orbit/views`) — real Board (kanban lanes) / Schedule (time-block) / Tree (dependency+subtask) /
  Matrix (Eisenhower + Action-Priority), all persisting via the task's real fields.
- **Search** — Ctrl+/ overlay across task titles, project names, reference title/body.
- **Settings** — priority weights, stale/retention/capacity constants, default view, task-type management, JSON
  export + import; areas link.
- **MyFitnessTracker calendar** shows Orbit to-dos (scheduled/due) with click-through and per-day quick-add.

---

## 7. Keyboard

Ctrl/Cmd+K capture · Ctrl/Cmd+/ search · Esc close · Enter confirm/open · Triage `t/p/r/d` + `u` undo (+ swipe) ·
Today rows `↑↓`/`j k` focus, `x`/Space complete, `.` pin · `g` then `t/i/a/r/w/s` jump to Today/Inbox/Areas/Reference/Review/Settings.

---

## 8. Non-functional

Local-first & fully offline for core CRUD; optimistic everywhere; cloud sync additive (never a dependency); full JSON
export/import from Settings, ungated; no feature makes data unexportable. Single reserved accent for overdue/urgent
only. Dark mode only.

---

## 9. Edge cases / rules

Task always requires an areaId (no orphans outside the inbox). Area delete disallowed while it has non-archived
projects/tasks (archive instead). Project "done" blocked while it has open tasks. `pinnedToday` auto-unpins at local
midnight rollover. Discarded inbox items purge after `discardRetentionDays`. `priorityScore` always recomputed on
write, never trusted from the client. Dependency links are cycle-guarded.

---

## 10. Explicitly out of scope

Multi-user/collaboration; real-time multi-device sync (local-first + coalesced push only); tracker analytics/charting;
a bidirectional reference-link graph; rebuilding a full calendar (links to MFT's instead). (Note: the original draft's
"no tags" and "no drag-to-rank" anti-goals were intentionally lifted — task-type filters and matrix/board drag are built.)

---

## 11. Ops (owner sets in Vercel; features degrade gracefully without them)

`FIREBASE_SERVICE_ACCOUNT_KEY` (exists) · `ORBIT_CAPTURE_SECRET` · `ORBIT_UID` (falls back to `FITNESS_UID`) ·
one or more of `GROQ_API_KEY` / `GITHUB_TOKEN` / `GEMINI_API_KEY` (for AI triage-cleanup).

---

## 12. Known follow-ups (✂️ deferred, not silently dropped)

- AI-generated *narrative* for the weekly review (needs a serverless endpoint; script summary is live).
- A revert-UI button for AI-tidied inbox text (server already keeps `aiOriginal`).
- Guest→cloud data migration on first sign-in (cloud currently seeds fresh; use Settings export/import as the bridge).
- High-res PNG PWA icons (a valid manifest + icon ships; polish the artwork later).
- `reload()` could flush pending edits before re-fetching (tiny edge on the AI button within the 1.5s debounce window).
