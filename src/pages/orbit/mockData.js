// Phase 0 exploration mocks — fake data only, no persistence. Shared by every
// view mock in ./mocks/ so they all render the same tasks through different lenses.

export const TODAY = '2026-07-23';
export const todayISO = () => TODAY;

export const MOCK_AREAS = [
  { id: 'work',     name: 'Work',     color: '#6e8fb0' },
  { id: 'home',     name: 'Home',     color: '#7c9473' },
  { id: 'health',   name: 'Health',   color: '#b0716e' },
  { id: 'learning', name: 'Learning', color: '#9077ab' },
  { id: 'errands',  name: 'Errands',  color: '#b09a5e' },
];

export const MOCK_PROJECTS = [
  { id: 'proj-website',   areaId: 'work',   name: 'Q3 Website Redesign' },
  { id: 'proj-sprinkler', areaId: 'home',   name: 'Fix Sprinkler System' },
  { id: 'proj-marathon',  areaId: 'health', name: 'Half Marathon Training' },
  { id: 'proj-spanish',   areaId: 'learning', name: 'Learn Spanish' },
];

// t0-t4 form the sprinkler project's dependency chain (t0 is the umbrella
// parent; t1 -> t2 -> t3 -> t4 is the actual blockedBy chain) — this is what
// the Dependency Tree mock needs to demonstrate both parent/child AND blocks.
export const MOCK_TASKS = [
  {
    id: 't0', title: 'Get backyard sprinklers fully repaired', areaId: 'home', projectId: 'proj-sprinkler',
    status: 'todo', importance: 3, urgency: 2, effort: 3, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'later', estimateMin: null,
  },
  {
    id: 't1', title: 'Watch sprinkler repair video', areaId: 'home', projectId: 'proj-sprinkler',
    status: 'done', importance: 2, urgency: 2, effort: 1, dueDate: null,
    scheduledDate: '2026-07-20', scheduledTime: null, blockedBy: [], parentTaskId: 't0',
    lane: 'now', estimateMin: 20,
  },
  {
    id: 't2', title: 'Diagnose sprinkler issue', areaId: 'home', projectId: 'proj-sprinkler',
    status: 'doing', importance: 3, urgency: 3, effort: 2, dueDate: null,
    scheduledDate: TODAY, scheduledTime: '14:00', blockedBy: ['t1'], parentTaskId: 't0',
    lane: 'now', estimateMin: 30,
  },
  {
    id: 't3', title: 'Buy replacement sprinkler head', areaId: 'home', projectId: 'proj-sprinkler',
    status: 'todo', importance: 3, urgency: 3, effort: 2, dueDate: '2026-07-25',
    scheduledDate: null, scheduledTime: null, blockedBy: ['t2'], parentTaskId: 't0',
    lane: 'next', estimateMin: 15,
  },
  {
    id: 't4', title: 'Fix sprinkler', areaId: 'home', projectId: 'proj-sprinkler',
    status: 'todo', importance: 3, urgency: 2, effort: 3, dueDate: '2026-07-27',
    scheduledDate: null, scheduledTime: null, blockedBy: ['t3'], parentTaskId: 't0',
    lane: 'later', estimateMin: 45,
  },
  // quick wins — high importance, low effort
  {
    id: 't5', title: 'Unsubscribe from junk newsletters', areaId: 'errands', projectId: null,
    status: 'todo', importance: 4, urgency: 2, effort: 1, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'now', estimateMin: 10,
  },
  {
    id: 't6', title: 'Renew passport online', areaId: 'errands', projectId: null,
    status: 'todo', importance: 5, urgency: 3, effort: 2, dueDate: '2026-08-15',
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'next', estimateMin: 20,
  },
  // thankless — low importance, high effort
  {
    id: 't7', title: 'Reorganize garage shelving', areaId: 'home', projectId: null,
    status: 'todo', importance: 2, urgency: 1, effort: 5, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'later', estimateMin: 180,
  },
  {
    id: 't8', title: 'Migrate old photos to new cloud backup', areaId: 'home', projectId: null,
    status: 'todo', importance: 2, urgency: 2, effort: 4, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'later', estimateMin: 120,
  },
  // do-first — high importance AND high urgency
  {
    id: 't9', title: 'Submit Q3 website redesign proposal', areaId: 'work', projectId: 'proj-website',
    status: 'doing', importance: 5, urgency: 5, effort: 3, dueDate: '2026-07-24',
    scheduledDate: TODAY, scheduledTime: '09:00', blockedBy: [], parentTaskId: null,
    lane: 'now', estimateMin: 90,
  },
  {
    // deliberately overdue: dueDate before TODAY, status still open
    id: 't10', title: 'Respond to client contract redlines', areaId: 'work', projectId: 'proj-website',
    status: 'todo', importance: 5, urgency: 5, effort: 2, dueDate: '2026-07-20',
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'now', estimateMin: 30,
  },
  // low/low
  {
    id: 't11', title: 'Alphabetize bookshelf', areaId: 'home', projectId: null,
    status: 'todo', importance: 1, urgency: 1, effort: 2, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'later', estimateMin: 40,
  },
  {
    id: 't12', title: 'Try that new ramen place', areaId: 'errands', projectId: null,
    status: 'todo', importance: 1, urgency: 2, effort: 1, dueDate: null,
    scheduledDate: '2026-07-26', scheduledTime: '19:00', blockedBy: [], parentTaskId: null,
    lane: 'next', estimateMin: 60,
  },
  // learning + health, scheduled this week
  {
    id: 't13', title: 'Complete Spanish Duolingo streak lesson', areaId: 'learning', projectId: 'proj-spanish',
    status: 'todo', importance: 3, urgency: 2, effort: 1, dueDate: null,
    scheduledDate: TODAY, scheduledTime: '20:00', blockedBy: [], parentTaskId: null,
    lane: 'now', estimateMin: 15,
  },
  {
    id: 't14', title: 'Long run — 10 miles', areaId: 'health', projectId: 'proj-marathon',
    status: 'todo', importance: 4, urgency: 3, effort: 4, dueDate: null,
    scheduledDate: '2026-07-26', scheduledTime: '07:00', blockedBy: [], parentTaskId: null,
    lane: 'next', estimateMin: 90,
  },
  // done
  {
    id: 't15', title: 'Book physical therapy follow-up', areaId: 'health', projectId: null,
    status: 'done', importance: 3, urgency: 3, effort: 1, dueDate: null,
    scheduledDate: '2026-07-18', scheduledTime: '11:00', blockedBy: [], parentTaskId: null,
    lane: 'now', estimateMin: 10,
  },
  // killed
  {
    id: 't16', title: 'Build custom home automation dashboard', areaId: 'home', projectId: null,
    status: 'killed', importance: 2, urgency: 1, effort: 5, dueDate: null,
    scheduledDate: null, scheduledTime: null, blockedBy: [], parentTaskId: null,
    lane: 'later', estimateMin: null,
  },
];
