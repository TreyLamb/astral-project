// Orbit config — entity factories, defaults, and constants. Phase-1 data
// model only (no storage/context/UI here — see calc/priority.js and
// calc/readiness.js for the pure logic these factories lean on).
//
// Ground rule copied from FitnessTracker: timestamps are ms epoch
// (Date.now()), dates are 'YYYY-MM-DD' strings, and every entity gets a
// with*Defaults(raw) reader so older stored rows normalize on read — no
// migration script (this app has none, see fitnessConfig.js precedent).

import { computePriorityScore } from './calc/priority';

let idCounter = 0;
export function newId() {
  return `o_${Date.now().toString(36)}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return isoDate(new Date());
}

// --- Area ---------------------------------------------------------------

export function newArea(partial = {}) {
  return {
    id: newId(),
    name: partial.name ?? '',
    color: partial.color ?? '#94a3b8',
    sortOrder: partial.sortOrder ?? 0,
    archived: partial.archived ?? false,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// Spec §3.1 hard cap. Lives here rather than in AreasView because Areas can
// now also be created inline from the task forms (AreaSelect) — a business
// rule enforced in two places must have one definition.
export const AREA_HARD_CAP = 12;

// Area is never something you have to choose. Anything created without one
// falls back to Home, so "which Area?" is a non-issue unless you actively want
// to change it. Matched by name (case-insensitive) rather than a stored id so
// it survives a reseed/import; falls back to the first area, then null, so a
// renamed or deleted Home can't break task creation.
export const DEFAULT_AREA_NAME = 'Home';

export function defaultAreaId(areas = []) {
  const open = (areas || []).filter((a) => a && !a.archived);
  const home = open.find((a) => a.name?.toLowerCase() === DEFAULT_AREA_NAME.toLowerCase());
  return (home || open[0])?.id ?? null;
}

// Muted starter palette, ready to seed a first run.
export const SEED_AREAS = [
  { name: 'Work', color: '#6e8fb0' },
  { name: 'Personal', color: '#b08a6e' },
  { name: 'Home', color: '#7c9473' },
  { name: 'Health', color: '#b0716e' },
  { name: 'Learning', color: '#9077ab' },
];

// --- Project --------------------------------------------------------------
// status: 'active' | 'paused' | 'done' | 'archived'

export function newProject(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    areaId: partial.areaId ?? null,
    name: partial.name ?? '',
    status: partial.status || 'active',
    notesMarkdown: partial.notesMarkdown ?? '',
    dueDate: partial.dueDate ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
    lastTouchedAt: partial.lastTouchedAt ?? now,
  };
}

export function withProjectDefaults(p) {
  return {
    ...p,
    status: p.status || 'active',
    notesMarkdown: p.notesMarkdown ?? '',
    dueDate: p.dueDate ?? null,
    updatedAt: p.updatedAt ?? p.createdAt ?? Date.now(),
    lastTouchedAt: p.lastTouchedAt ?? p.updatedAt ?? p.createdAt ?? Date.now(),
  };
}

// --- Task -------------------------------------------------------------
// status: 'todo' | 'doing' | 'done' | 'killed'
// importance/urgency/difficulty/energy: ints 1-5. timeMin: int minutes or
// null. lane: 'now' | 'next' | 'later' | null. parentTaskId enables nested
// subtasks (and sub-sub-tasks). NO `effort` field — intentionally replaced
// by timeMin+difficulty+energy (see calc/priority.js's taskCost).

export function newTask(partial = {}, settings) {
  const now = Date.now();
  const task = {
    id: newId(),
    title: partial.title ?? '',
    areaId: partial.areaId ?? null,
    projectId: partial.projectId ?? null,
    parentTaskId: partial.parentTaskId ?? null,
    status: partial.status || 'todo',
    // null = unscored, deliberately NOT 3. A fabricated 3 makes a task that was
    // never triaged look already-triaged; calc/priority.js substitutes a neutral
    // value for ranking without ever writing it back.
    importance: partial.importance ?? null,
    urgency: partial.urgency ?? null,
    timeMin: partial.timeMin ?? null,
    difficulty: partial.difficulty ?? null,
    energy: partial.energy ?? null,
    priorityScore: 0,
    taskType: partial.taskType ?? null,
    dueDate: partial.dueDate ?? null,
    scheduledDate: partial.scheduledDate ?? null,
    scheduledTime: partial.scheduledTime ?? null,
    pinnedToday: partial.pinnedToday ?? false,
    pinnedOn: partial.pinnedOn ?? null,
    blockedBy: partial.blockedBy ?? [],
    lane: partial.lane ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    // --- scheduler annotation fields (Guidelines_Scheduler.md §3.1) ----------
    // All optional. Filled by AI annotation (later phase) + learning, editable
    // by the user. Absence = "unknown, fall back to a default" — none are
    // required to save a task, so old stored rows just read null/false/[] via
    // withTaskDefaults below. `energyCost` is intentionally NOT stored (computed
    // at placement time from intensity × conditions — see §3.1/§4).
    category: partial.category ?? null,
    intensity: partial.intensity ?? null,
    indoorOutdoor: partial.indoorOutdoor ?? null,
    weatherSensitive: partial.weatherSensitive ?? false,
    perishable: partial.perishable ?? false,
    locationId: partial.locationId ?? null,
    estWorkMin: partial.estWorkMin ?? null,
    estRecoveryMin: partial.estRecoveryMin ?? null,
    idealWindow: partial.idealWindow ?? null,
    batchKey: partial.batchKey ?? null,
    constraints: Array.isArray(partial.constraints) ? partial.constraints : [],
    aiAnnotatedAt: partial.aiAnnotatedAt ?? null, // set once the AI has filled the fields above (don't re-annotate)
    createdAt: partial.createdAt ?? now,
    completedAt: partial.completedAt ?? null,
    lastTouchedAt: partial.lastTouchedAt ?? now,
  };
  task.priorityScore = computePriorityScore(task, settings);
  return task;
}

export function withTaskDefaults(t) {
  return {
    ...t,
    parentTaskId: t.parentTaskId ?? null,
    timeMin: t.timeMin ?? null,
    // ?? null, not ?? 3 — re-coercing on load would undo the unscored state
    // that newTask deliberately stores. Tasks written before this change already
    // hold real numbers, so only genuinely-absent fields read as unscored.
    difficulty: t.difficulty ?? null,
    energy: t.energy ?? null,
    priorityScore: t.priorityScore ?? computePriorityScore(t),
    taskType: t.taskType ?? null,
    pinnedToday: t.pinnedToday ?? false,
    pinnedOn: t.pinnedOn ?? null,
    blockedBy: Array.isArray(t.blockedBy) ? t.blockedBy : [],
    lane: t.lane ?? null,
    recurrenceId: t.recurrenceId ?? null,
    // scheduler fields (§3.1) — backfilled on read so pre-scheduler rows load
    category: t.category ?? null,
    intensity: t.intensity ?? null,
    indoorOutdoor: t.indoorOutdoor ?? null,
    weatherSensitive: t.weatherSensitive ?? false,
    perishable: t.perishable ?? false,
    locationId: t.locationId ?? null,
    estWorkMin: t.estWorkMin ?? null,
    estRecoveryMin: t.estRecoveryMin ?? null,
    idealWindow: t.idealWindow ?? null,
    batchKey: t.batchKey ?? null,
    constraints: Array.isArray(t.constraints) ? t.constraints : [],
    aiAnnotatedAt: t.aiAnnotatedAt ?? null,
    completedAt: t.completedAt ?? null,
    lastTouchedAt: t.lastTouchedAt ?? t.createdAt ?? Date.now(),
  };
}

// --- InboxItem -----------------------------------------------------------
// outcome: null | 'task' | 'project' | 'reference' | 'discarded'

export function newInboxItem(partial = {}) {
  return {
    id: newId(),
    rawText: partial.rawText ?? '',
    createdAt: partial.createdAt ?? Date.now(),
    triaged: partial.triaged ?? false,
    outcome: partial.outcome ?? null,
    discardedAt: partial.discardedAt ?? null,
    resultId: partial.resultId ?? null,
    aiCleanedAt: partial.aiCleanedAt ?? null,
    aiCleanedFrom: partial.aiCleanedFrom ?? null,
  };
}

// --- Settings --------------------------------------------------------------
// taskTypes are NS-1 task-kind filters, user-extendable later — data, not code.

export const DEFAULT_TASK_TYPES = ['Deep Work', 'Admin', 'Errand', 'Chore', 'Call', 'Quick Win', 'Health'];

// Seeded home base so untagged days default to OREM out of the box (single-owner
// site — this is the owner's actual home town). Pre-geocoded to Orem, Utah so it
// works offline immediately and feeds travel/weather without a lookup. id 'home'
// aligns with the home weather-cache locationId. See calc/baseLocation.js.
// Per-base outline colors so each location reads distinctly on the calendar.
// First three slots are fixed (owner's request: OREM cyan, PARIS magenta/pink,
// the next neon-orange); every base after that gets a pearlescent-easter pastel,
// picked once at creation and stored so it stays stable.
export const BASE_COLOR_SLOTS = ['#67e8f9', '#f472b6', '#ff9f1c'];
export const PEARL_EASTER_COLORS = [
  '#b5ead7', '#ffd6e0', '#c7ceea', '#ffdac1', '#e2f0cb',
  '#f6d6ff', '#a0e7e5', '#fbe7a1', '#d4a5ff', '#b5f5ec',
];
// Color for the base being created at 0-based position `index`: a fixed slot for
// the first three, then a random pastel (stored, so stable once assigned).
export function nextBaseColor(index) {
  if (index < BASE_COLOR_SLOTS.length) return BASE_COLOR_SLOTS[index];
  return PEARL_EASTER_COLORS[Math.floor(Math.random() * PEARL_EASTER_COLORS.length)];
}

export const DEFAULT_HOME_BASE = {
  id: 'home', tag: 'OREM', query: 'Orem, Utah', color: BASE_COLOR_SLOTS[0],
  lat: 40.2969, lng: -111.6946, zip: null, isHome: true, geocodedAt: 0, createdAt: 0,
};

// A second starter base the owner asked for — Paris, IDAHO (not France, not the
// Utah one). Pre-geocoded like home so it works offline + feeds travel/weather.
export const DEFAULT_PARIS_BASE = {
  id: 'paris-id', tag: 'PARIS', query: 'Paris, Idaho', color: BASE_COLOR_SLOTS[1],
  lat: 42.2255, lng: -111.4013, zip: null, isHome: false, geocodedAt: 0, createdAt: 0,
};

const STARTER_BASES = [DEFAULT_HOME_BASE, DEFAULT_PARIS_BASE];

// Guarantees usable bases without clobbering a curated list: a fresh/empty
// registry gets the full starter set (OREM home + PARIS); a registry that has
// bases but no home just gets OREM prepended.
function ensureHomeBase(bases) {
  if (bases.length === 0) return [...STARTER_BASES];
  return bases.some((b) => b.isHome) ? bases : [DEFAULT_HOME_BASE, ...bases];
}

export function defaultSettings() {
  return {
    importanceWeight: 2,
    urgencyWeight: 2,
    costWeight: 1,
    staleDays: 14,
    discardRetentionDays: 30,
    defaultView: 'today',
    lanes: ['now', 'next', 'later'],
    taskTypes: [...DEFAULT_TASK_TYPES],
    capacityDefault: { timeMin: 480, energy: 15 },
    // --- scheduler config (Guidelines_Scheduler.md §4/§5/§6) ------------------
    // homeZip powers weather + location inference (§9). The gas-tank energy
    // model (§4) reuses capacityDefault.energy as the day's tank capacity C —
    // it is NOT a separate 100-point scale (the doc's "e.g. 100" was
    // illustrative; keeping one energy scale stays consistent with existing
    // task energies 1-5). fatigue = cross-day carry (§4, TUNABLE). guardrails =
    // allowed windows per category + global awake hours (§5). weatherAvoid* is
    // the §6 rain threshold. All defaults; tune in Settings.
    homeZip: '',
    homeLat: null, // cached geocode of homeZip (§7 — geocode once, never re-hit)
    homeLng: null,
    // "Where I am" per-day base locations. `bases` is the small registry of
    // places the owner actually stays at (Orem, Paris UT, Hawaii); `dayLocations`
    // maps an ISO date → a base id, so the day the owner is in Hawaii, the whole
    // travel/weather/geo stack (the "googlemaps database and anything related")
    // reasons from Hawaii, not home. Both empty = behaves exactly like before
    // (everything falls back to the global home ZIP). Set from the fitness
    // calendar's WHERE tag or Orbit Settings → Bases.
    bases: [...STARTER_BASES],
    dayLocations: {},
    scheduler: {
      fatigue: { thresholdPct: 0.7, carryFactor: 0.5, maxCarryPct: 0.5 },
      guardrails: {
        awake: ['07:00', '22:00'],
        byCategory: {
          shopping: ['09:00', '20:00'],
          errand: ['09:00', '20:00'],
          call: ['09:00', '18:00'],
          outdoor: ['07:00', '19:00'],
        },
      },
      defaultRecoveryMin: 10,
      weatherAvoidPrecipPct: 50,
      // §7 soft-optimization weights — how hard the placer leans on each soft
      // preference once every HARD constraint is satisfied. Higher = stronger.
      // travel batches errands, contextSwitch keeps same-category runs together,
      // idealWindow honors morning/evening preferences. All tunable in Settings.
      softWeights: { travel: 1, contextSwitch: 0.5, idealWindow: 0.5 },
    },
    // §7 cost guard — verify current Google free-tier terms in the Cloud
    // Console before relying on the cap. Counts billable ELEMENTS, not requests.
    googleCostGuard: {
      monthlyElementCap: 8000,
      elementsUsedThisMonth: 0,
      monthKey: '',
      seedingEnabled: false,
      seedTargetPct: 0.9,
    },
  };
}

export function withSettingsDefaults(raw) {
  const d = defaultSettings();
  return {
    importanceWeight: raw?.importanceWeight ?? d.importanceWeight,
    urgencyWeight: raw?.urgencyWeight ?? d.urgencyWeight,
    costWeight: raw?.costWeight ?? d.costWeight,
    staleDays: raw?.staleDays ?? d.staleDays,
    discardRetentionDays: raw?.discardRetentionDays ?? d.discardRetentionDays,
    defaultView: raw?.defaultView ?? d.defaultView,
    lanes: Array.isArray(raw?.lanes) ? raw.lanes : d.lanes,
    taskTypes: Array.isArray(raw?.taskTypes) ? raw.taskTypes : d.taskTypes,
    capacityDefault: { ...d.capacityDefault, ...(raw?.capacityDefault || {}) },
    homeZip: raw?.homeZip ?? d.homeZip,
    homeLat: raw?.homeLat ?? d.homeLat,
    homeLng: raw?.homeLng ?? d.homeLng,
    // Reconstructed field-by-field like everything else here, so both MUST be
    // carried explicitly or a settings patch would silently drop them.
    // ensureHomeBase re-seeds OREM whenever no home base is stored (undefined,
    // [], or only away-bases) — so existing settings with no bases key show OREM
    // immediately, while a home the owner set is preserved untouched.
    bases: ensureHomeBase(Array.isArray(raw?.bases) ? raw.bases.map(withBaseDefaults) : []),
    dayLocations: (raw?.dayLocations && typeof raw.dayLocations === 'object') ? raw.dayLocations : d.dayLocations,
    scheduler: mergeSchedulerSettings(d.scheduler, raw?.scheduler),
    googleCostGuard: { ...d.googleCostGuard, ...(raw?.googleCostGuard || {}) },
  };
}

// Deep-merges stored scheduler settings over the defaults so a partial stored
// object (e.g. one that only overrode fatigue) keeps every default it didn't
// mention — including per-category guardrails the user never touched.
function mergeSchedulerSettings(def, raw) {
  const r = raw || {};
  const rg = r.guardrails || {};
  return {
    ...def,
    ...r,
    fatigue: { ...def.fatigue, ...(r.fatigue || {}) },
    guardrails: {
      ...def.guardrails,
      ...rg,
      awake: Array.isArray(rg.awake) ? rg.awake : def.guardrails.awake,
      byCategory: { ...def.guardrails.byCategory, ...(rg.byCategory || {}) },
    },
    softWeights: { ...def.softWeights, ...(r.softWeights || {}) },
  };
}

// --- RecurrenceRule ---------------------------------------------------------
// freq: 'daily' | 'weekly' | 'monthly' | 'interval'. weekdays are ints 0-6
// (Sun-Sat), read only for 'weekly'. dayOfMonth read only for 'monthly'
// (clamped to the month's actual length — see calc/recurrence.js). interval
// = every N days counting from anchorDate, read only for 'interval'. A
// generated Task instance carries recurrenceId = this rule's id.

export function newRecurrenceRule(partial = {}) {
  return {
    id: newId(),
    title: partial.title ?? '',
    areaId: partial.areaId ?? null,
    projectId: partial.projectId ?? null,
    taskType: partial.taskType ?? null,
    // null, same as newTask — a rule whose axes were never set generates
    // unscored tasks, which land in the triage queue instead of arriving
    // pre-scored with numbers nobody chose.
    importance: partial.importance ?? null,
    urgency: partial.urgency ?? null,
    timeMin: partial.timeMin ?? null,
    difficulty: partial.difficulty ?? null,
    energy: partial.energy ?? null,
    freq: partial.freq || 'daily',
    interval: partial.interval ?? 1,
    weekdays: partial.weekdays ?? [],
    dayOfMonth: partial.dayOfMonth ?? 1,
    anchorDate: partial.anchorDate ?? todayISO(),
    active: partial.active ?? true,
    lastGeneratedDate: partial.lastGeneratedDate ?? null,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// --- ReferenceItem -----------------------------------------------------------
// Freeform notes/links, not actionable (no status/dates) — the read-later
// shelf next to Areas/Projects/Tasks.

export function newReferenceItem(partial = {}) {
  const now = Date.now();
  return {
    id: newId(),
    areaId: partial.areaId ?? null,
    title: partial.title ?? '',
    bodyMarkdown: partial.bodyMarkdown ?? '',
    url: partial.url ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

export function withReferenceDefaults(r) {
  return {
    ...r,
    areaId: r.areaId ?? null,
    bodyMarkdown: r.bodyMarkdown ?? '',
    url: r.url ?? null,
    updatedAt: r.updatedAt ?? r.createdAt ?? Date.now(),
  };
}

// --- Tracker -----------------------------------------------------------
// type: 'counter' | 'streak'. resetInterval: 'daily' | 'weekly' | 'none' —
// when a periodic reset zeroes currentValue (see calc/trackers.js).

export function newTracker(partial = {}) {
  return {
    id: newId(),
    areaId: partial.areaId ?? null,
    name: partial.name ?? '',
    type: partial.type || 'counter',
    currentValue: partial.currentValue ?? 0,
    resetInterval: partial.resetInterval || 'none',
    lastResetAt: partial.lastResetAt ?? Date.now(),
    lastQualifiedDate: partial.lastQualifiedDate ?? null,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// --- ReviewLog -----------------------------------------------------------
// One snapshot per weekly review run (see calc/review.js's buildReview).
// aiNarrative stays null until a later phase fills it in via an AI summary.

export function newReviewLog(partial = {}) {
  return {
    id: newId(),
    weekOf: partial.weekOf ?? todayISO(),
    shippedTaskIds: partial.shippedTaskIds ?? [],
    staleProjectIds: partial.staleProjectIds ?? [],
    overdueTaskIds: partial.overdueTaskIds ?? [],
    generatedAt: partial.generatedAt ?? Date.now(),
    aiNarrative: partial.aiNarrative ?? null,
  };
}

// --- DayPlan -----------------------------------------------------------
// id === date ('YYYY-MM-DD') — one DayPlan per calendar day, created lazily.
// Null capacity means "use settings.capacityDefault" (see calc/planner.js).

export function newDayPlan(partial = {}) {
  return {
    date: partial.date ?? todayISO(),
    capacityTimeMin: partial.capacityTimeMin ?? null,
    capacityEnergy: partial.capacityEnergy ?? null,
    note: partial.note ?? '',
  };
}

export function withDayPlanDefaults(d) {
  return {
    ...d,
    capacityTimeMin: d.capacityTimeMin ?? null,
    capacityEnergy: d.capacityEnergy ?? null,
    note: d.note ?? '',
  };
}

// === Scheduler databases (Guidelines_Scheduler.md §3.2) =====================
// localStorage-only for now; §3.2 defers Firestore sync to a later phase, so
// none of these are wired into orbitContext's dirty/flush machinery yet.
// Privacy: places + travelLog together form a personal movement log — keep
// single-user, never export/share (§3.2 privacy note).

// --- Place (places DB) ---
// Geocoded ONCE (Nominatim, §7) then cached; every task with a location
// adds/reuses one. `source`: 'user' | 'nominatim' | 'inferred'.
export function newPlace(partial = {}) {
  return {
    id: newId(),
    name: partial.name ?? '',
    lat: partial.lat ?? null,
    lng: partial.lng ?? null,
    zip: partial.zip ?? null,
    source: partial.source ?? 'user',
    openHours: partial.openHours ?? null,
    geocodedAt: partial.geocodedAt ?? null,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

export function withPlaceDefaults(p) {
  return {
    ...p,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    zip: p.zip ?? null,
    source: p.source ?? 'user',
    openHours: p.openHours ?? null,
    geocodedAt: p.geocodedAt ?? null,
  };
}

// --- Base ("where I am" home-base locations) --------------------------------
// A place the owner stays/lives at, distinct from the task-errand places DB.
// `tag` is the short all-caps calendar label ("OREM"); `query` is the
// disambiguated geocoding string ("Orem, Utah" — critical since "Paris" could
// be Utah OR France). Geocoded ONCE (Nominatim) then cached. The base id
// doubles as the weather-cache locationId, so a base's forecast is stored and
// looked up under its own id. `isHome` marks the default base for untagged days.
export function newBase(partial = {}) {
  const tag = String(partial.tag ?? '').trim();
  return {
    id: partial.id ?? newId(),
    tag: tag.toUpperCase(),
    query: String(partial.query ?? tag).trim(),
    color: partial.color ?? BASE_COLOR_SLOTS[0],
    lat: partial.lat ?? null,
    lng: partial.lng ?? null,
    zip: partial.zip ?? null,
    isHome: !!partial.isHome,
    geocodedAt: partial.geocodedAt ?? null,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// Backfills an older base row. Missing color resolves by known id so a pre-color
// PARIS still reads magenta; anything else falls back to cyan.
export function withBaseDefaults(b) {
  return {
    ...b,
    tag: String(b?.tag ?? '').toUpperCase(),
    query: String(b?.query ?? b?.tag ?? '').trim(),
    color: b?.color ?? (b?.id === DEFAULT_PARIS_BASE.id ? BASE_COLOR_SLOTS[1] : BASE_COLOR_SLOTS[0]),
    lat: b?.lat ?? null,
    lng: b?.lng ?? null,
    zip: b?.zip ?? null,
    isHome: !!b?.isHome,
    geocodedAt: b?.geocodedAt ?? null,
  };
}

// --- DurationEntry (duration-learning DB, §8) ---
// One row per normalized task title (and/or category). `key` is the identity
// (id === key) so upserts are idempotent. medianMin is derived from samples.
export function newDurationEntry(partial = {}) {
  return {
    id: partial.key ?? newId(),
    key: partial.key ?? '',
    category: partial.category ?? null,
    samples: Array.isArray(partial.samples) ? partial.samples : [],
    lastActualMin: partial.lastActualMin ?? null,
    medianMin: partial.medianMin ?? null,
    updatedAt: partial.updatedAt ?? Date.now(),
  };
}

// --- WeatherEntry (weather cache, §6) ---
// Keyed by date (+ optional locationId). hourly is the cached Open-Meteo
// forecast the scheduler reads instead of hitting the API repeatedly.
export function newWeatherEntry(partial = {}) {
  return {
    date: partial.date ?? todayISO(),
    locationId: partial.locationId ?? null,
    hourly: Array.isArray(partial.hourly) ? partial.hourly : [],
    source: partial.source ?? 'open-meteo',
    fetchedAt: partial.fetchedAt ?? Date.now(),
  };
}

// --- Rule (rulebook, §12) ---
// Policy-level scheduling rule crystallized from feedback, e.g.
// {subject:'perishable', relation:'notAfter', object:'category:outdoor',
//  action:'forbid'}. Enforced by the deterministic placer.
export function newRule(partial = {}) {
  return {
    id: newId(),
    subject: partial.subject ?? '',
    relation: partial.relation ?? '',
    object: partial.object ?? '',
    action: partial.action ?? 'forbid',
    createdFrom: partial.createdFrom ?? null,
    active: partial.active ?? true,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// --- TravelLogEntry (passive archive, BACKUP ONLY — §3.2/§7) ---
// Logs every live Google result keyed by {origin,dest,weekday,hourBucket};
// read ONLY when Google is lost/over-cap. `key` is the identity for upserts.
// `source`: 'google' | 'observed' | 'seed'.
export function newTravelLogEntry(partial = {}) {
  return {
    id: partial.key ?? newId(),
    key: partial.key ?? '',
    origin: partial.origin ?? null,
    dest: partial.dest ?? null,
    weekday: partial.weekday ?? null,
    hourBucket: partial.hourBucket ?? null,
    durationSec: partial.durationSec ?? null,
    samples: Array.isArray(partial.samples) ? partial.samples : [],
    median: partial.median ?? null,
    source: partial.source ?? 'google',
    updatedAt: partial.updatedAt ?? Date.now(),
  };
}
