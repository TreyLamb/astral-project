Personal Organization System — Technical Specification

Status: Draft v1 Purpose: Handoff document for implementation (human or agent). Written to be complete enough that no design decision needs to be inferred or assumed during build.

1. Purpose & Philosophy

A single-user personal organization system for tasks, projects, and priorities. Not a team tool, not a note-taking app, not a calendar replacement.

Three concerns are kept structurally separate and must not be conflated in implementation:

Capture — get something out of your head with zero friction, zero categorization required at capture time.
Organize — where a thing lives (Area/Project) and how important it is (priority score).
Execute — what to do right now (Today view).

Design mandate: the system must be usable with a single glance at one screen (Today view) for ~90% of interactions. Every other screen exists but is not part of the default loop.

Anti-goals (things this system explicitly must NOT become):

A wiki
A team collaboration tool
A calendar
A habit-gamification app
A place where "priorities" is a static list that goes stale
2. Core Principles (non-negotiable, must survive all future feature additions)
Today view is the home screen. App opens here by default, every time.
Priority is a property, not a page. No standalone "Priorities" list that requires manual maintenance. Priority is always derived/attached to a Task or Project.
Capture is decoupled from categorization. Inbox items require zero fields at creation beyond raw text.
Triage is a mandatory, separate step, not automatic. Untriaged items do not appear in Today view and do not get a priority score until triaged.
No tags-as-taxonomy. Areas and Projects are the only classification layers. (See §10 for rationale.)
Local-first performance. Every core interaction (open app, capture, mark done, view Today) must feel instant — target latencies in §6.
Stale detection is automatic, not user-maintained.
3. Data Model
3.1 Entities

Area

Top-level, stable category. Cardinality: 5–8 typical, hard cap at 12 (soft warning in UI past 10).
Fields: id, name, color (hex, used sparingly per §5.3), sortOrder, archived (bool), createdAt.
Areas are never deleted, only archived (tasks/projects reference them by id; hard delete would orphan history).

Project

Belongs to exactly one Area.
Has a defined "done" state (this is what distinguishes it from a bare Area-level task).
Fields: id, areaId, name, status (enum: active, paused, done, archived), notesMarkdown (freeform, persistent context — e.g. standing rules like "verify against source before changing"), dueDate (nullable), createdAt, updatedAt, lastTouchedAt (updated on any task change within project — drives stale detection).

Task

Belongs to a Project OR directly to an Area (nullable projectId, required areaId if no project).
Fields: id, areaId, projectId (nullable), title (verb-first, enforced only as a UI placeholder hint, not validated), status (enum: todo, doing, done, killed), impact (int 1–5), effort (int 1–5), priorityScore (computed, see §4.4), dueDate (nullable), scheduledDate (nullable — distinct from due; see below), pinnedToday (bool), createdAt, completedAt (nullable), lastTouchedAt.
dueDate vs scheduledDate: due = hard deadline, scheduled = "I planned to work on this on X day" (soft, movable, doesn't imply a deadline). Today view pulls both.

InboxItem

Fields: id, rawText, createdAt, triaged (bool, default false).
No other fields permitted at creation. Triage converts an InboxItem into a Task (or Project, or ReferenceItem, or discards it) and marks triaged = true; the InboxItem row is kept for audit/undo but excluded from all views once triaged.

ReferenceItem

Fields: id, areaId (nullable — can be unfiled), title, bodyMarkdown, url (nullable), createdAt, updatedAt.
Not part of task flow. Pure searchable vault. Linked from Project pages by reference, not embedded.

Tracker (optional, minimal by design)

Fields: id, areaId, name, type (enum: counter, streak), currentValue, resetInterval (enum: daily, weekly, none), lastResetAt.
Deliberately no analytics/graphing in v1 — see §10.

ReviewLog

Fields: id, weekOf (date), shippedTaskIds (array), staleProjectIds (array), overdueTaskIds (array), generatedAt.
Auto-generated, read-only, never manually edited (see §4.6).
3.2 Relationships summary
Area 1---N Project
Area 1---N Task (direct, no project)
Project 1---N Task
Area 1---N ReferenceItem (optional)
Area 1---N Tracker
InboxItem -- (triage) --> Task | Project | ReferenceItem | discarded
3.3 Reference Prisma schema
prisma
model Area {
  id        String    @id @default(cuid())
  name      String
  color     String
  sortOrder Int
  archived  Boolean   @default(false)
  createdAt DateTime  @default(now())
  projects  Project[]
  tasks     Task[]
  refs      ReferenceItem[]
  trackers  Tracker[]
}

model Project {
  id             String    @id @default(cuid())
  areaId         String
  area           Area      @relation(fields: [areaId], references: [id])
  name           String
  status         ProjectStatus @default(active)
  notesMarkdown  String    @default("")
  dueDate        DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  lastTouchedAt  DateTime  @default(now())
  tasks          Task[]
}

enum ProjectStatus {
  active
  paused
  done
  archived
}

model Task {
  id             String    @id @default(cuid())
  areaId         String
  area           Area      @relation(fields: [areaId], references: [id])
  projectId      String?
  project        Project?  @relation(fields: [projectId], references: [id])
  title          String
  status         TaskStatus @default(todo)
  impact         Int       // 1-5
  effort         Int       // 1-5
  priorityScore  Float     // computed on write, see scoring formula
  dueDate        DateTime?
  scheduledDate  DateTime?
  pinnedToday    Boolean   @default(false)
  createdAt      DateTime  @default(now())
  completedAt    DateTime?
  lastTouchedAt  DateTime  @default(now())
}

enum TaskStatus {
  todo
  doing
  done
  killed
}

model InboxItem {
  id        String   @id @default(cuid())
  rawText   String
  createdAt DateTime @default(now())
  triaged   Boolean  @default(false)
}

model ReferenceItem {
  id            String   @id @default(cuid())
  areaId        String?
  area          Area?    @relation(fields: [areaId], references: [id])
  title         String
  bodyMarkdown  String
  url           String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Tracker {
  id             String   @id @default(cuid())
  areaId         String
  area           Area     @relation(fields: [areaId], references: [id])
  name           String
  type           TrackerType
  currentValue   Int      @default(0)
  resetInterval  ResetInterval @default(none)
  lastResetAt    DateTime @default(now())
}

enum TrackerType { counter streak }
enum ResetInterval { daily weekly none }

model ReviewLog {
  id               String   @id @default(cuid())
  weekOf           DateTime
  shippedTaskIds   String[]
  staleProjectIds  String[]
  overdueTaskIds   String[]
  generatedAt      DateTime @default(now())
}
4. Feature Specifications
4.1 Capture Inbox
Global keyboard shortcut (default Cmd/Ctrl+K or a dedicated always-on-top hotkey) opens a single-line text input from anywhere in the app.
Submitting creates an InboxItem with only rawText. No modal fields, no dropdowns, no required categorization. Enter submits and clears, input stays open for rapid multi-capture (does not close after one entry — must support capturing 5 items in a row without re-invoking the shortcut).
Escape closes without submitting empty text.
Inbox badge count visible persistently in nav (untriaged count only).
4.2 Triage / Review Flow
Dedicated screen, one InboxItem at a time (queue, not list — forces sequential decision-making).
For each item, exactly four possible actions, each bound to a single keypress:
Task → prompts for Area (required), Project (optional), impact (1–5), effort (1–5). Due/scheduled date optional at this step.
Project → prompts for Area (required), name, initial status = active.
Reference → prompts for optional Area, saves as ReferenceItem.
Discard → marks triaged = true, item excluded from all views, recoverable for 30 days in a hidden "recently discarded" log before hard delete.
Triage should be nudged (not forced/blocking) once daily if untriaged count > 0 — a dismissible prompt on app open, not a hard gate.
4.3 Today View (home screen)
Shows: all Tasks where scheduledDate == today OR dueDate == today OR pinnedToday == true, excluding status == done or killed.
Sort order: priorityScore descending, ties broken by dueDate ascending (nulls last).
Each row shows: title, Area color chip, Project name (if any), due/overdue indicator, impact/effort mini-display, one-click complete.
Overdue tasks (dueDate < today, status != done) always float to the top of the list regardless of score, visually marked with the single reserved accent color (see §5.3).
Empty state when no tasks: show count of untriaged inbox items as the only prompt, nothing else (no motivational filler content).
Manual "pin to today" action available from any Task in any other view — this is the escape hatch for ad-hoc reprioritization without editing dates.
4.4 Priority Scoring
Formula, computed and stored on every create/update of impact or effort:
  priorityScore = impact * 2 - effort

(Weighting impact 2x effort is a starting default — expose as a single config constant, not a per-task setting, so it can be tuned globally later without a schema change.)

No manual drag-to-reorder ranking in v1 — score-driven sort only. Manual override exists solely via pinnedToday (forces to top of Today regardless of score) and via editing impact/effort directly.
Overdue status always overrides score-based position in Today view (§4.3).
4.5 Project Pages
Header: name, Area, status selector, due date.
notesMarkdown block — persistent, freeform, rendered markdown, editable inline. This is where standing rules/context live (example use case: a pinned instruction like "always verify against source before recommending changes").
Task list scoped to this project, same row format as Today view, filterable by status.
Linked ReferenceItems shown as a list of links at the bottom (not embedded content).
"Mark project done" action requires confirming all open tasks are done/killed first (blocking check, not silent).
4.6 Weekly Review (auto-generated)
Generated on-demand (button) or auto-generated every Monday on first app open of the week, written to ReviewLog.
Contents:
Shipped: tasks with completedAt in the past 7 days.
Stale: projects (status = active) where lastTouchedAt > 14 days ago. (14 days is a config constant.)
Overdue: tasks with dueDate in the past, status != done.
Read-only summary view. No manual editing of the log itself — action items generated from it (e.g. "un-stale" a project) go through normal task/project editing, not the log.
4.7 Reference Vault
Simple list + full-text search (title + body). Filterable by Area.
No task-flow integration beyond being linkable from Project notes via [[reference title]]-style link or plain URL reference — kept intentionally simple in v1, no bidirectional link graph.
4.8 Lightweight Tracking
Minimal by design. A Tracker is either a counter (increment/decrement, optional daily/weekly auto-reset) or a streak (increments on a qualifying day, resets to 0 on a missed day).
No charts, no historical graphs, no analytics dashboard in v1 (see §10). Current value only, displayed as a small widget on the relevant Area page.
4.9 Search
Global search (separate shortcut, e.g. Cmd/Ctrl+/) across Task titles, Project names, ReferenceItem titles/bodies. Simple substring/fuzzy match, not full-text-indexed search engine in v1 — SQLite LIKE/FTS5 is sufficient at expected data volumes (hundreds to low thousands of rows).
4.10 Keyboard Shortcuts (must all be implemented, not aspirational)
Shortcut	Action

Basic ctrlV ctrlC ctrlx type of hot keys
Enter	Open focused item

Esc	Close any modal/input without saving
5. UI/UX Specification
5.1 Screens (exhaustive list — no other top-level screens in v1)
Today (home)
Inbox / Triage
Areas (list of all Areas, entry point to Projects)
Project detail
Reference Vault
Weekly Review
Search (overlay, not a full screen)
Settings (Areas management, priority weighting constant, data export)
5.2 Layout
Persistent left nav: Today, Inbox (with badge count), Areas, Reference, Review, Settings. Collapsible on mobile.
No nested modals — all editing happens inline in the row/page context (expand-in-place, not popup-on-popup).
Today view has zero visual chrome beyond the task list itself — no dashboard widgets, no charts, no "motivation" panel.
5.3 Color System
Muted, neutral base palette (grays/off-white or dark mode equivalent).
Each Area has one assigned color used only as a small chip/dot next to items — never as a full-row background.
Exactly one reserved accent color (e.g. red/orange) used only for overdue/urgent states. This color must not be reused for anything else in the system — its meaning must stay unambiguous.
Dark mode required from v1 (not a post-launch add-on).
5.4 Interaction Patterns
Every list row: single-click/tap to open, dedicated complete-checkbox that never requires opening the row.
Inline editing everywhere a field is shown — no "edit" button that opens a separate form for simple fields like title, due date, status.
Optimistic UI updates for all task state changes (done/pin/edit) — do not wait on network/DB round-trip to reflect a change visually.
6. Non-Functional Requirements
6.1 Performance targets
App cold open to interactive Today view: < 500ms.
Capture input open (from shortcut): < 100ms.
Mark-task-done visual update: instant (optimistic), no spinner.
These targets assume local-first data access — see §7.
6.2 Offline / Local-first
Core CRUD (capture, triage, task edit, complete) must function fully offline.
If a remote sync layer is added later, it must be additive to a local source of truth, not a dependency for basic operation.
6.3 Data ownership / export
Full data export to JSON must be available at any time from Settings (not gated, not requiring support contact).
No feature may be built in a way that makes the user's own data unexportable.
6.4 Scale assumptions
Single user. Expected volumes: tens of Areas (realistically <12), hundreds of Projects over the system's lifetime, low thousands of Tasks. Not designed for multi-user or high-volume data — do not over-engineer for scale that won't occur.
7. Tech Stack & Architecture (recommended, not mandatory if constraints change)
Framework: Next.js (App Router)
ORM: Prisma
Database: SQLite for local-first single-user use. (Do not default to Firestore/Firebase for this app — that tradeoff makes sense for explicitly multi-device-realtime tools, not a fast local capture-and-execute tool. See rationale in prior discussion.)
State/data layer: Server components + minimal client state (React state/context) for optimistic updates; no heavy global state library needed at this scale.
Styling: Tailwind, consistent with muted-palette requirement in §5.3.
PWA: optional in v1, not required (unlike the separate rapid-review app spec, this one has no stated cross-device requirement at launch).
8. Explicitly Out of Scope for v1 (do not build unless separately requested)
Tags as a second classification axis alongside Areas/Projects.
Built-in calendar (link out to external calendar instead of rebuilding one).
Gamification, streak-shaming, or motivational messaging.
Analytics/charting on trackers.
Multi-user/collaboration features of any kind.
Bidirectional link graph in Reference Vault.
Manual drag-to-rank task ordering (score-driven sort only, per §4.4).
Real-time multi-device sync (local-first only, per §6.2).
9. Edge Cases & Business Rules
A Task with no projectId must still have a required areaId — no orphaned/unfiled tasks outside triage.
Deleting an Area is disallowed if it has any non-archived Projects or Tasks; must archive instead (see §3.1).
Marking a Project done is blocked if it has open (todo/doing) tasks — user must resolve or kill them first (§4.5).
pinnedToday does not persist past the day automatically — it should reset (unpin) at local midnight rollover so it doesn't silently accumulate stale pins.
Discarded InboxItems are recoverable for 30 days, then hard-deleted (§4.2) — implement as a scheduled cleanup, not manual.
priorityScore is always recomputed server-side on write, never trusted from client input, to prevent drift from the formula in §4.4.
10. Phased Build Plan

Phase 1 (MVP): Area/Project/Task models, Capture Inbox, Triage flow, Today view, basic Project pages (no ReferenceItem linking yet), priority scoring. No Weekly Review, no Trackers, no Reference Vault yet.

Phase 2: Weekly Review auto-generation, Reference Vault + linking, Trackers, Search.

Phase 3: Settings-level configurability (priority weighting constant, stale-threshold constant), data export, dark mode polish, keyboard shortcut completeness pass.
