// Orbit shared state. Kept in a .js module with NO component export so Vite
// fast-refresh stays happy (react-refresh/only-export-components) — a later
// UI-phase OrbitApp shell consumes useOrbitState() and provides the context,
// same split as fitnessContext.js.
//
// KEY DIFFERENCE from FitnessTracker: Orbit is Firestore-PRIMARY, not
// localStorage-primary. Signed in, Firestore is truth and orbitStorage.js is
// an offline mirror; guest/offline, orbitStorage.js is truth. Every mutation
// still writes the mirror synchronously (so a refresh never loses data and
// guest mode needs nothing else) but in cloud mode the actual Firestore
// write is coalesced: mutations mark the touched doc "dirty" and a single
// debounced flush() ships the whole batch, instead of one write per edit.
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { OrbitStorage } from './orbitStorage';
import { OrbitFirestore } from './orbitFirestore';
import {
  newArea, newProject, withProjectDefaults, newTask, withTaskDefaults, newInboxItem,
  SEED_AREAS, defaultAreaId, withSettingsDefaults, todayISO,
  newRecurrenceRule, newReferenceItem, withReferenceDefaults,
  newTracker, newReviewLog, newDayPlan, withDayPlanDefaults,
  newPlace, newRule, newBase, nextBaseColor,
} from './orbitConfig';
import { computePriorityScore } from './calc/priority';
import { runHousekeepingPlan } from './calc/housekeeping';
import { datesToGenerate } from './calc/recurrence';
import { needsReset, applyReset } from './calc/trackers';
import { buildReview, mondayOf } from './calc/review';
import { carryoverCandidates as calcCarryoverCandidates } from './calc/carryover';
import { outdoorRescheduleFlags } from './calc/weather';
import { geocodeZip, geocodePlaceName, fetchForecast } from './orbitWeatherService';

export const OrbitContext = createContext(null);
export function useOrbit() { return useContext(OrbitContext); }

const FLUSH_DEBOUNCE_MS = 1500;

// Only the reads needed for initial load / backend swap fork by mode — all
// writes go through the mirror + (cloud-only) dirty/flush path below, which
// is exactly the point of write-coalescing: per-mutation Firestore calls
// would defeat it.
function makeBackend(user) {
  if (user && firebaseReady) {
    const uid = user.uid;
    return {
      mode: 'cloud',
      uid,
      getAreas: () => OrbitFirestore.getAreas(uid),
      getProjects: () => OrbitFirestore.getProjects(uid),
      getTasks: () => OrbitFirestore.getTasks(uid),
      getInbox: () => OrbitFirestore.getInbox(uid),
      getSettings: () => OrbitFirestore.getSettings(uid),
      getRecurrenceRules: () => OrbitFirestore.getRecurrenceRules(uid),
      getReferences: () => OrbitFirestore.getReferences(uid),
      getTrackers: () => OrbitFirestore.getTrackers(uid),
      getReviewLogs: () => OrbitFirestore.getReviewLogs(uid),
      getDayPlans: () => OrbitFirestore.getDayPlans(uid),
    };
  }
  return {
    mode: 'local',
    uid: null,
    getAreas: async () => OrbitStorage.getAreas(),
    getProjects: async () => OrbitStorage.getProjects(),
    getTasks: async () => OrbitStorage.getTasks(),
    getInbox: async () => OrbitStorage.getInbox(),
    getSettings: async () => OrbitStorage.getSettings(),
    getRecurrenceRules: async () => OrbitStorage.getRecurrenceRules(),
    getReferences: async () => OrbitStorage.getReferences(),
    getTrackers: async () => OrbitStorage.getTrackers(),
    getReviewLogs: async () => OrbitStorage.getReviewLogs(),
    getDayPlans: async () => OrbitStorage.getDayPlans(),
  };
}

// Dirty collections are Map<id, version> rather than Set<id> — versioning
// lets flush() tell "this id was re-edited while the batch I already sent
// was in flight" apart from "this id is untouched since that batch landed",
// which a plain Set can't distinguish (see flush()'s cleanup below).
function emptyDirty() {
  return {
    areas: new Map(), projects: new Map(), tasks: new Map(), inbox: new Map(),
    recurrenceRules: new Map(), references: new Map(), trackers: new Map(),
    reviewLogs: new Map(), dayPlans: new Map(),
    settingsDirty: false, settingsVersion: 0,
  };
}
function emptyDeletes() {
  return {
    areas: new Set(), projects: new Set(), tasks: new Set(), inbox: new Set(),
    recurrenceRules: new Set(), references: new Set(), trackers: new Set(),
    reviewLogs: new Set(), dayPlans: new Set(),
  };
}

export function useOrbitState() {
  const { user } = useAuth(); // undefined (resolving) | null (guest) | object
  // Treat still-resolving auth as guest so the UI never blocks — a real
  // sign-in swaps the backend and reloads once it resolves (see fitnessContext).
  const backend = useMemo(() => makeBackend(user || null), [user]);

  const [areas, setAreas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [settings, setSettings] = useState(() => withSettingsDefaults(null));
  const [loading, setLoading] = useState(true);
  const [recurrenceRules, setRecurrenceRules] = useState([]);
  const [references, setReferences] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [dayPlans, setDayPlans] = useState([]);
  // Scheduler DBs (§3.2) — localStorage-only for now, so they live OUTSIDE the
  // backend/dirty/flush machinery above and hydrate straight from localStorage
  // at mount via a lazy initializer (no effect needed; they don't sync per backend).
  const [places, setPlaces] = useState(() => OrbitStorage.getPlaces());
  const [durations, setDurations] = useState(() => OrbitStorage.getDurations());
  const [weather, setWeather] = useState(() => OrbitStorage.getWeather());
  const [rules, setRules] = useState(() => OrbitStorage.getRules());
  const [travelLog, setTravelLog] = useState(() => OrbitStorage.getTravelLog());

  // Write-coalescing bookkeeping. Refs, not state — mutated outside the
  // render cycle and never need to trigger a re-render themselves.
  const dirtyRef = useRef(emptyDirty());
  const deletesRef = useRef(emptyDeletes());
  const flushTimerRef = useRef(null);
  const stateRef = useRef({
    areas, projects, tasks, inbox, settings,
    recurrenceRules, references, trackers, reviewLogs, dayPlans,
  });
  // Refs can't be written during render (React 19 rule) — sync it in an
  // effect that runs after every commit instead.
  useEffect(() => {
    stateRef.current = {
      areas, projects, tasks, inbox, settings,
      recurrenceRules, references, trackers, reviewLogs, dayPlans,
    };
  });

  const flush = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (backend.mode !== 'cloud') return;
    const dirty = dirtyRef.current;
    const deletes = deletesRef.current;
    // All 9 write-coalesced collections — kept as one list so hasWork/
    // snapshot/upsert-build/delete-payload/cleanup below can't drift apart
    // from each other as collections get added.
    const COLLECTIONS = [
      'areas', 'projects', 'tasks', 'inbox',
      'recurrenceRules', 'references', 'trackers', 'reviewLogs', 'dayPlans',
    ];
    const hasWork = COLLECTIONS.some((col) => dirty[col].size || deletes[col].size)
      || dirty.settingsDirty;
    if (!hasWork) return;

    // Snapshot exactly what's about to be sent (ids + their version, and the
    // settings version) BEFORE the await. A markDirty()/markSettingsDirty()
    // call that lands while the batch below is in flight mutates the LIVE
    // dirtyRef/deletesRef, not these snapshots — so on success we only clear
    // what we snapshotted, and only if its version is unchanged. If it's
    // moved on (re-edited mid-flight, data we just sent is already stale),
    // it's left dirty for the next flush instead of being silently dropped.
    const sentVersions = {};
    const sentDeletes = {};
    COLLECTIONS.forEach((col) => {
      sentVersions[col] = new Map(dirty[col]);
      sentDeletes[col] = new Set(deletes[col]);
    });
    const sentSettings = dirty.settingsDirty;
    const sentSettingsVersion = dirty.settingsVersion;

    const cur = stateRef.current;
    // Every collection is keyed by `.id` except dayPlans, keyed by `.date`
    // (see orbitConfig.js's newDayPlan) — keyFn lets the rest of this stay generic.
    const byId = (arr, keyFn = (x) => x.id) => new Map(arr.map((x) => [keyFn(x), x]));
    const docsByIdByCol = {
      areas: byId(cur.areas), projects: byId(cur.projects), tasks: byId(cur.tasks), inbox: byId(cur.inbox),
      recurrenceRules: byId(cur.recurrenceRules), references: byId(cur.references), trackers: byId(cur.trackers),
      reviewLogs: byId(cur.reviewLogs), dayPlans: byId(cur.dayPlans, (d) => d.date),
    };

    // Skip anything also queued for delete — no point upserting a doc we're
    // about to remove in the same batch.
    const buildUpserts = (col) => [...sentVersions[col].keys()]
      .filter((id) => !sentDeletes[col].has(id) && docsByIdByCol[col].has(id))
      .map((id) => docsByIdByCol[col].get(id));
    const upserts = { settings: sentSettings ? cur.settings : undefined };
    const deletesPayload = {};
    COLLECTIONS.forEach((col) => {
      upserts[col] = buildUpserts(col);
      deletesPayload[col] = [...sentDeletes[col]];
    });

    try {
      await OrbitFirestore.flush(backend.uid, { upserts, deletes: deletesPayload });
      COLLECTIONS.forEach((col) => {
        sentVersions[col].forEach((version, id) => {
          if (dirtyRef.current[col].get(id) === version) dirtyRef.current[col].delete(id);
        });
        sentDeletes[col].forEach((id) => deletesRef.current[col].delete(id));
      });
      if (sentSettings && dirtyRef.current.settingsVersion === sentSettingsVersion) {
        dirtyRef.current.settingsDirty = false;
      }
    } catch {
      // Leave everything dirty — localStorage mirror already holds the
      // truth, and the next scheduled/forced flush just resends it all.
    }
  }, [backend]);

  const scheduleFlush = useCallback(() => {
    if (backend.mode !== 'cloud') return;
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => { flush(); }, FLUSH_DEBOUNCE_MS);
  }, [backend, flush]);

  const markDirty = useCallback((col, id) => {
    const map = dirtyRef.current[col];
    map.set(id, (map.get(id) || 0) + 1); // bump version so a mid-flush re-edit isn't mistaken for the copy already sent
    deletesRef.current[col].delete(id);
    scheduleFlush();
  }, [scheduleFlush]);

  const markDeleted = useCallback((col, id) => {
    dirtyRef.current[col].delete(id);
    deletesRef.current[col].add(id);
    scheduleFlush();
  }, [scheduleFlush]);

  const markSettingsDirty = useCallback(() => {
    dirtyRef.current.settingsDirty = true;
    dirtyRef.current.settingsVersion += 1;
    scheduleFlush();
  }, [scheduleFlush]);

  // Flush immediately on tab-hide / unload so a burst of edits right before
  // navigating away isn't lost to the debounce window.
  useEffect(() => {
    if (backend.mode !== 'cloud') return undefined;
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    const onUnload = () => { flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onUnload);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flush(); // one last attempt on unmount/backend swap
    };
  }, [backend, flush]);

  // Initial load / backend swap. Keeps showing current data until the new
  // data resolves (the `alive` guard) so switching backends never flashes
  // empty — same pattern as fitnessContext.js.
  useEffect(() => {
    let alive = true;
    dirtyRef.current = emptyDirty();
    deletesRef.current = emptyDeletes();

    Promise.all([
      backend.getAreas(), backend.getProjects(), backend.getTasks(), backend.getInbox(), backend.getSettings(),
      backend.getRecurrenceRules(), backend.getReferences(), backend.getTrackers(),
      backend.getReviewLogs(), backend.getDayPlans(),
    ])
      .then(async ([a, p, t, i, s, rr, refs, trk, rev, dp]) => {
        if (!alive) return;
        let nextAreas = Array.isArray(a) ? a : [];
        const nextProjects = (Array.isArray(p) ? p : []).map(withProjectDefaults);
        const nextTasks = (Array.isArray(t) ? t : []).map(withTaskDefaults);
        const nextInbox = Array.isArray(i) ? i : [];
        const nextSettings = withSettingsDefaults(s);
        const nextRecurrenceRules = Array.isArray(rr) ? rr : [];
        const nextReferences = (Array.isArray(refs) ? refs : []).map(withReferenceDefaults);
        const nextTrackers = Array.isArray(trk) ? trk : [];
        const nextReviewLogs = Array.isArray(rev) ? rev : [];
        const nextDayPlans = (Array.isArray(dp) ? dp : []).map(withDayPlanDefaults);

        // First-run seed: no areas anywhere yet for this backend.
        if (nextAreas.length === 0) {
          const seeded = SEED_AREAS.map((partial, idx) => newArea({ ...partial, sortOrder: idx }));
          if (backend.mode === 'cloud') {
            await Promise.all(seeded.map((area) => OrbitFirestore.saveArea(backend.uid, area)));
          } else {
            seeded.forEach((area) => OrbitStorage.saveArea(area));
          }
          nextAreas = seeded;
        }

        if (!alive) return;

        if (backend.mode === 'cloud') {
          OrbitStorage.replaceAll('areas', nextAreas);
          OrbitStorage.replaceAll('projects', nextProjects);
          OrbitStorage.replaceAll('tasks', nextTasks);
          OrbitStorage.replaceAll('inbox', nextInbox);
          OrbitStorage.replaceAll('settings', nextSettings);
          OrbitStorage.replaceAll('recurrenceRules', nextRecurrenceRules);
          OrbitStorage.replaceAll('references', nextReferences);
          OrbitStorage.replaceAll('trackers', nextTrackers);
          OrbitStorage.replaceAll('reviewLogs', nextReviewLogs);
          OrbitStorage.replaceAll('dayPlans', nextDayPlans);
        }

        setAreas(nextAreas);
        setProjects(nextProjects);
        setTasks(nextTasks);
        setInbox(nextInbox);
        setSettings(nextSettings);
        setRecurrenceRules(nextRecurrenceRules);
        setReferences(nextReferences);
        setTrackers(nextTrackers);
        setReviewLogs(nextReviewLogs);
        setDayPlans(nextDayPlans);
        setLoading(false);

        // Housekeeping-on-open: once per calendar day, regardless of mode.
        const today = todayISO();
        if (OrbitStorage.getHousekeepingDate() !== today) {
          const plan = runHousekeepingPlan(nextTasks, nextInbox, today, Date.now(), nextSettings);
          plan.unpinIds.forEach((id) => {
            const patch = { pinnedToday: false, pinnedOn: null };
            setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
            OrbitStorage.updateTask(id, patch);
            if (backend.mode === 'cloud') markDirty('tasks', id);
          });
          plan.purgeInboxIds.forEach((id) => {
            setInbox((prev) => prev.filter((item) => item.id !== id));
            OrbitStorage.removeInboxItem(id);
            if (backend.mode === 'cloud') markDeleted('inbox', id);
          });

          // Recurring generation — apply directly against the freshly-loaded
          // arrays (not the addTask/updateRecurrenceRule action creators,
          // which would read stale stateRef from before this effect ran).
          let workingTasks = nextTasks;
          const generatedRuleIds = new Set();
          nextRecurrenceRules.filter((rule) => rule.active).forEach((rule) => {
            const existingDates = new Set(
              workingTasks.filter((task) => task.recurrenceId === rule.id).map((task) => task.scheduledDate),
            );
            const dates = datesToGenerate(rule, today, existingDates);
            if (dates.length === 0) return;
            // Bypasses addTask (see comment above), so it needs the same Area
            // default applied here.
            const generated = dates.map((date) => newTask({
              title: rule.title,
              areaId: rule.areaId || defaultAreaId(nextAreas),
              projectId: rule.projectId,
              taskType: rule.taskType,
              importance: rule.importance,
              urgency: rule.urgency,
              timeMin: rule.timeMin,
              difficulty: rule.difficulty,
              energy: rule.energy,
              scheduledDate: date,
              recurrenceId: rule.id,
            }, nextSettings));
            workingTasks = [...generated, ...workingTasks];
            generated.forEach((task) => {
              OrbitStorage.saveTask(task);
              if (backend.mode === 'cloud') markDirty('tasks', task.id);
            });
            generatedRuleIds.add(rule.id);
            OrbitStorage.updateRecurrenceRule(rule.id, { lastGeneratedDate: today });
            if (backend.mode === 'cloud') markDirty('recurrenceRules', rule.id);
          });
          if (workingTasks !== nextTasks) {
            setTasks(workingTasks);
            setRecurrenceRules((prev) => prev.map((rule) =>
              (generatedRuleIds.has(rule.id) ? { ...rule, lastGeneratedDate: today } : rule)));
          }

          // Tracker resets.
          if (nextTrackers.some((tracker) => needsReset(tracker, today))) {
            const resetTrackers = nextTrackers.map((tracker) => applyReset(tracker, today));
            setTrackers(resetTrackers);
            resetTrackers.forEach((tracker, idx) => {
              if (tracker === nextTrackers[idx]) return;
              OrbitStorage.updateTracker(tracker.id, {
                currentValue: tracker.currentValue, lastResetAt: tracker.lastResetAt,
              });
              if (backend.mode === 'cloud') markDirty('trackers', tracker.id);
            });
          }

          // Weekly review auto-gen — first open of a new week creates that
          // week's log; re-opening later the same week is a no-op.
          const weekOf = mondayOf(today);
          if (!nextReviewLogs.some((log) => log.weekOf === weekOf)) {
            const built = buildReview(workingTasks, nextProjects, today, nextSettings.staleDays);
            const log = newReviewLog(built);
            setReviewLogs((prev) => [log, ...prev]);
            OrbitStorage.saveReviewLog(log);
            if (backend.mode === 'cloud') markDirty('reviewLogs', log.id);
          }

          OrbitStorage.setHousekeepingDate(today);
        }
      })
      .catch(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [backend, markDirty, markDeleted]);

  // Manual refresh — re-fetches all 10 reads from the CURRENT backend and
  // resyncs state + (cloud mode) the localStorage mirror, WITHOUT the
  // initial-load effect's first-run area seeding or once-per-day
  // housekeeping (this is a plain refresh, not a first load). User-triggered
  // (e.g. the AI-cleanup button after api/orbit-ai-triage writes Firestore
  // out-of-band), so no `alive` guard — just swallow a failed fetch so it
  // never throws into the caller.
  const reload = useCallback(async () => {
    try {
      const [a, p, t, i, s, rr, refs, trk, rev, dp] = await Promise.all([
        backend.getAreas(), backend.getProjects(), backend.getTasks(), backend.getInbox(), backend.getSettings(),
        backend.getRecurrenceRules(), backend.getReferences(), backend.getTrackers(),
        backend.getReviewLogs(), backend.getDayPlans(),
      ]);
      const nextAreas = Array.isArray(a) ? a : [];
      const nextProjects = (Array.isArray(p) ? p : []).map(withProjectDefaults);
      const nextTasks = (Array.isArray(t) ? t : []).map(withTaskDefaults);
      const nextInbox = Array.isArray(i) ? i : [];
      const nextSettings = withSettingsDefaults(s);
      const nextRecurrenceRules = Array.isArray(rr) ? rr : [];
      const nextReferences = (Array.isArray(refs) ? refs : []).map(withReferenceDefaults);
      const nextTrackers = Array.isArray(trk) ? trk : [];
      const nextReviewLogs = Array.isArray(rev) ? rev : [];
      const nextDayPlans = (Array.isArray(dp) ? dp : []).map(withDayPlanDefaults);

      if (backend.mode === 'cloud') {
        OrbitStorage.replaceAll('areas', nextAreas);
        OrbitStorage.replaceAll('projects', nextProjects);
        OrbitStorage.replaceAll('tasks', nextTasks);
        OrbitStorage.replaceAll('inbox', nextInbox);
        OrbitStorage.replaceAll('settings', nextSettings);
        OrbitStorage.replaceAll('recurrenceRules', nextRecurrenceRules);
        OrbitStorage.replaceAll('references', nextReferences);
        OrbitStorage.replaceAll('trackers', nextTrackers);
        OrbitStorage.replaceAll('reviewLogs', nextReviewLogs);
        OrbitStorage.replaceAll('dayPlans', nextDayPlans);
      }

      setAreas(nextAreas);
      setProjects(nextProjects);
      setTasks(nextTasks);
      setInbox(nextInbox);
      setSettings(nextSettings);
      setRecurrenceRules(nextRecurrenceRules);
      setReferences(nextReferences);
      setTrackers(nextTrackers);
      setReviewLogs(nextReviewLogs);
      setDayPlans(nextDayPlans);
    } catch {
      // Leave current state as-is — localStorage mirror / Firestore are
      // unaffected by a failed read, so there's nothing to roll back.
    }
  }, [backend]);

  // ---- areas ----
  const addArea = useCallback(async (partial) => {
    const a = newArea({ ...partial, sortOrder: partial?.sortOrder ?? stateRef.current.areas.length });
    setAreas((prev) => [...prev, a]);
    OrbitStorage.saveArea(a);
    if (backend.mode === 'cloud') markDirty('areas', a.id);
    return a;
  }, [backend, markDirty]);

  const updateArea = useCallback(async (id, updates) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    OrbitStorage.updateArea(id, updates);
    if (backend.mode === 'cloud') markDirty('areas', id);
  }, [backend, markDirty]);

  const archiveArea = useCallback(async (id) => updateArea(id, { archived: true }), [updateArea]);

  const removeArea = useCallback(async (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
    OrbitStorage.removeArea(id);
    if (backend.mode === 'cloud') markDeleted('areas', id);
  }, [backend, markDeleted]);

  const reorderAreas = useCallback(async (orderedIds) => {
    setAreas((prev) => {
      const byId = new Map(prev.map((a) => [a.id, a]));
      return orderedIds.map((id, idx) => ({ ...byId.get(id), sortOrder: idx })).filter(Boolean);
    });
    orderedIds.forEach((id, idx) => {
      OrbitStorage.updateArea(id, { sortOrder: idx });
      if (backend.mode === 'cloud') markDirty('areas', id);
    });
  }, [backend, markDirty]);

  // ---- projects ----
  // A task touch bumps its parent project's lastTouchedAt (stale-project
  // detection, later phase) — shared by addTask/updateTask/removeTask below.
  const touchProject = useCallback((projectId) => {
    if (!projectId) return;
    const now = Date.now();
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, lastTouchedAt: now } : p)));
    OrbitStorage.updateProject(projectId, { lastTouchedAt: now });
    if (backend.mode === 'cloud') markDirty('projects', projectId);
  }, [backend, markDirty]);

  const addProject = useCallback(async (partial) => {
    const p = newProject(partial);
    setProjects((prev) => [p, ...prev]);
    OrbitStorage.saveProject(p);
    if (backend.mode === 'cloud') markDirty('projects', p.id);
    return p;
  }, [backend, markDirty]);

  const updateProject = useCallback(async (id, updates) => {
    const now = Date.now();
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)));
    OrbitStorage.updateProject(id, { ...updates, updatedAt: now });
    if (backend.mode === 'cloud') markDirty('projects', id);
  }, [backend, markDirty]);

  const removeProject = useCallback(async (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    OrbitStorage.removeProject(id);
    if (backend.mode === 'cloud') markDeleted('projects', id);
  }, [backend, markDeleted]);

  // ---- tasks ----
  // priorityScore is always server-computed here — never trust a caller-
  // supplied value (see orbitConfig.js / calc/priority.js header comments).
  const addTask = useCallback(async (partial) => {
    // Single choke point for the Area default — every UI path lands here, so
    // no caller has to remember it and none can produce an area-less task.
    const t = newTask({
      ...partial,
      areaId: partial?.areaId || defaultAreaId(stateRef.current.areas),
    }, stateRef.current.settings); // newTask already computes priorityScore
    setTasks((prev) => [t, ...prev]);
    OrbitStorage.saveTask(t);
    if (backend.mode === 'cloud') markDirty('tasks', t.id);
    if (t.projectId) touchProject(t.projectId);
    return t;
  }, [backend, markDirty, touchProject]);

  const updateTask = useCallback(async (id, updates) => {
    const current = stateRef.current.tasks.find((t) => t.id === id);
    const merged = { ...current, ...updates };
    merged.priorityScore = computePriorityScore(merged, stateRef.current.settings);
    // State composes off the ACTUAL previous item inside the updater (not
    // the `merged` snapshot above) so two synchronous edits to the same task
    // both land instead of the second clobbering the first. The mirror
    // write below can still use the stateRef-derived `merged` — it's just an
    // offline cache, not the source of truth (flush() reads live state).
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const m = { ...t, ...updates };
      m.priorityScore = computePriorityScore(m, stateRef.current.settings);
      return m;
    }));
    OrbitStorage.updateTask(id, merged);
    if (backend.mode === 'cloud') markDirty('tasks', id);
    const projectId = updates.projectId !== undefined ? updates.projectId : current?.projectId;
    if (projectId) touchProject(projectId);
    return merged;
  }, [backend, markDirty, touchProject]);

  const removeTask = useCallback(async (id) => {
    const current = stateRef.current.tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    OrbitStorage.removeTask(id);
    if (backend.mode === 'cloud') markDeleted('tasks', id);
    if (current?.projectId) touchProject(current.projectId);
  }, [backend, markDeleted, touchProject]);

  // ---- inbox ----
  const addInboxItem = useCallback(async (partial) => {
    const i = newInboxItem(partial);
    setInbox((prev) => [i, ...prev]);
    OrbitStorage.saveInboxItem(i);
    if (backend.mode === 'cloud') markDirty('inbox', i.id);
    return i;
  }, [backend, markDirty]);

  const updateInboxItem = useCallback(async (id, updates) => {
    setInbox((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    OrbitStorage.updateInboxItem(id, updates);
    if (backend.mode === 'cloud') markDirty('inbox', id);
  }, [backend, markDirty]);

  const removeInboxItem = useCallback(async (id) => {
    setInbox((prev) => prev.filter((i) => i.id !== id));
    OrbitStorage.removeInboxItem(id);
    if (backend.mode === 'cloud') markDeleted('inbox', id);
  }, [backend, markDeleted]);

  // ---- settings ----
  // Every task's priorityScore is a function of settings' weights, so a
  // weight change has to recompute every task's score, not just save the
  // new settings — otherwise scores silently drift stale until each task's
  // next unrelated edit.
  const updateSettings = useCallback(async (patch) => {
    const next = withSettingsDefaults({ ...stateRef.current.settings, ...patch });
    setSettings(next);
    OrbitStorage.updateSettings(patch);
    if (backend.mode === 'cloud') markSettingsDirty();

    // State updater functions must stay pure (React may invoke them more
    // than once) — compute the rescored list first, THEN setTasks, THEN run
    // the storage/dirty side effects against that same computed list.
    const rescored = stateRef.current.tasks.map((t) => ({ ...t, priorityScore: computePriorityScore(t, next) }));
    setTasks(rescored);
    rescored.forEach((t) => {
      OrbitStorage.updateTask(t.id, { priorityScore: t.priorityScore });
      if (backend.mode === 'cloud') markDirty('tasks', t.id);
    });
  }, [backend, markDirty, markSettingsDirty]);

  // ---- recurrence rules ----
  const addRecurrenceRule = useCallback(async (partial) => {
    const r = newRecurrenceRule(partial);
    setRecurrenceRules((prev) => [r, ...prev]);
    OrbitStorage.saveRecurrenceRule(r);
    if (backend.mode === 'cloud') markDirty('recurrenceRules', r.id);
    return r;
  }, [backend, markDirty]);

  const updateRecurrenceRule = useCallback(async (id, updates) => {
    setRecurrenceRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    OrbitStorage.updateRecurrenceRule(id, updates);
    if (backend.mode === 'cloud') markDirty('recurrenceRules', id);
  }, [backend, markDirty]);

  const removeRecurrenceRule = useCallback(async (id) => {
    setRecurrenceRules((prev) => prev.filter((r) => r.id !== id));
    OrbitStorage.removeRecurrenceRule(id);
    if (backend.mode === 'cloud') markDeleted('recurrenceRules', id);
  }, [backend, markDeleted]);

  // ---- references ----
  const addReference = useCallback(async (partial) => {
    const r = newReferenceItem(partial);
    setReferences((prev) => [r, ...prev]);
    OrbitStorage.saveReference(r);
    if (backend.mode === 'cloud') markDirty('references', r.id);
    return r;
  }, [backend, markDirty]);

  const updateReference = useCallback(async (id, updates) => {
    const now = Date.now();
    setReferences((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: now } : r)));
    OrbitStorage.updateReference(id, { ...updates, updatedAt: now });
    if (backend.mode === 'cloud') markDirty('references', id);
  }, [backend, markDirty]);

  const removeReference = useCallback(async (id) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
    OrbitStorage.removeReference(id);
    if (backend.mode === 'cloud') markDeleted('references', id);
  }, [backend, markDeleted]);

  // ---- trackers ----
  const addTracker = useCallback(async (partial) => {
    const t = newTracker(partial);
    setTrackers((prev) => [t, ...prev]);
    OrbitStorage.saveTracker(t);
    if (backend.mode === 'cloud') markDirty('trackers', t.id);
    return t;
  }, [backend, markDirty]);

  const updateTracker = useCallback(async (id, updates) => {
    setTrackers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    OrbitStorage.updateTracker(id, updates);
    if (backend.mode === 'cloud') markDirty('trackers', id);
  }, [backend, markDirty]);

  const removeTracker = useCallback(async (id) => {
    setTrackers((prev) => prev.filter((t) => t.id !== id));
    OrbitStorage.removeTracker(id);
    if (backend.mode === 'cloud') markDeleted('trackers', id);
  }, [backend, markDeleted]);

  // ---- day plans ----
  // Read-time getter (not a state value itself) — always returns a usable
  // plan, defaulting one that hasn't been created yet rather than null, so
  // the UI never has to null-check before reading capacity/note.
  const getDayPlan = useCallback((dateISO) => {
    const found = dayPlans.find((d) => d.date === dateISO);
    return found || newDayPlan({ date: dateISO });
  }, [dayPlans]);

  const setDayPlan = useCallback(async (dateISO, patch) => {
    const existing = stateRef.current.dayPlans.find((d) => d.date === dateISO);
    if (existing) {
      const updated = { ...existing, ...patch };
      setDayPlans((prev) => prev.map((d) => (d.date === dateISO ? updated : d)));
      OrbitStorage.updateDayPlan(dateISO, patch);
    } else {
      const created = newDayPlan({ date: dateISO, ...patch });
      setDayPlans((prev) => [created, ...prev]);
      OrbitStorage.saveDayPlan(created);
    }
    if (backend.mode === 'cloud') markDirty('dayPlans', dateISO);
  }, [backend, markDirty]);

  // ---- review logs ----
  const addReviewLog = useCallback(async (partial) => {
    const r = newReviewLog(partial);
    setReviewLogs((prev) => [r, ...prev]);
    OrbitStorage.saveReviewLog(r);
    if (backend.mode === 'cloud') markDirty('reviewLogs', r.id);
    return r;
  }, [backend, markDirty]);

  // Manual "run review now" — builds fresh off current state and replaces
  // any existing log for the same weekOf (factories always mint a new id,
  // so "replace" here means delete-old + add-new rather than an in-place id
  // reuse; see orbitConfig.js's newReviewLog).
  const generateReview = useCallback(async () => {
    const built = buildReview(
      stateRef.current.tasks, stateRef.current.projects, todayISO(), stateRef.current.settings.staleDays,
    );
    const log = newReviewLog(built);
    const stale = stateRef.current.reviewLogs.filter((r) => r.weekOf === built.weekOf);
    setReviewLogs((prev) => [log, ...prev.filter((r) => r.weekOf !== built.weekOf)]);
    stale.forEach((r) => {
      OrbitStorage.removeReviewLog(r.id);
      if (backend.mode === 'cloud') markDeleted('reviewLogs', r.id);
    });
    OrbitStorage.saveReviewLog(log);
    if (backend.mode === 'cloud') markDirty('reviewLogs', log.id);
    return log;
  }, [backend, markDirty, markDeleted]);

  // ---- scheduler databases (§3.2) ----
  // Local-only writes (no markDirty / Firestore flush yet) — mirror straight to
  // localStorage and update state. Places + rules use id; durations + travelLog
  // upsert by composite key; weather saves one row per date+location.
  const addPlace = useCallback(async (partial) => {
    const p = newPlace(partial);
    setPlaces((prev) => [p, ...prev]);
    OrbitStorage.savePlace(p);
    return p;
  }, []);

  const updatePlace = useCallback(async (id, updates) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    OrbitStorage.updatePlace(id, updates);
  }, []);

  const removePlace = useCallback(async (id) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    OrbitStorage.removePlace(id);
  }, []);

  const upsertDuration = useCallback(async (entry) => {
    setDurations((prev) => {
      const idx = prev.findIndex((d) => d.key === entry.key);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = entry; return copy; }
      return [entry, ...prev];
    });
    OrbitStorage.upsertDuration(entry);
    return entry;
  }, []);

  const saveWeather = useCallback(async (entry) => {
    setWeather((prev) => [
      entry,
      ...prev.filter((w) => !(w.date === entry.date && (w.locationId ?? null) === (entry.locationId ?? null))),
    ]);
    OrbitStorage.saveWeather(entry);
    return entry;
  }, []);

  const addRule = useCallback(async (partial) => {
    const r = newRule(partial);
    setRules((prev) => [r, ...prev]);
    OrbitStorage.saveRule(r);
    return r;
  }, []);

  const updateRule = useCallback(async (id, updates) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    OrbitStorage.updateRule(id, updates);
  }, []);

  const removeRule = useCallback(async (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    OrbitStorage.removeRule(id);
  }, []);

  const upsertTravelLogEntry = useCallback(async (entry) => {
    setTravelLog((prev) => {
      const idx = prev.findIndex((e) => e.key === entry.key);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = entry; return copy; }
      return [entry, ...prev];
    });
    OrbitStorage.upsertTravelLogEntry(entry);
    return entry;
  }, []);

  // ---- weather (§6) ----
  // Geocodes the home ZIP once (cached in settings), pulls the Open-Meteo
  // forecast (free, no key), and refreshes the local weather cache. Degrades
  // silently: no ZIP / network fail → the scheduler just runs without weather
  // constraints. Returns a small status so the UI can show what happened.
  const refreshWeather = useCallback(async () => {
    const s = stateRef.current.settings;
    if (!s.homeZip) return { ok: false, reason: 'no-home-zip' };

    let { homeLat, homeLng } = s;
    if (homeLat == null || homeLng == null) {
      const geo = await geocodeZip(s.homeZip);
      if (!geo) return { ok: false, reason: 'geocode-failed' };
      homeLat = geo.lat;
      homeLng = geo.lng;
      const next = withSettingsDefaults({ ...stateRef.current.settings, homeLat, homeLng });
      setSettings(next);
      OrbitStorage.updateSettings({ homeLat, homeLng });
      if (backend.mode === 'cloud') markSettingsDirty();
    }

    const entries = await fetchForecast(homeLat, homeLng, 'home');
    if (entries.length === 0) return { ok: false, reason: 'forecast-failed' };

    // Replace the home-location forecast wholesale with the fresh pull.
    const fresh = entries;
    setWeather((prev) => [
      ...fresh,
      ...prev.filter((w) => (w.locationId ?? null) !== 'home'),
    ]);
    fresh.forEach((e) => OrbitStorage.saveWeather(e));
    return { ok: true, days: fresh.length };
  }, [backend, markSettingsDirty]);

  // ---- "where I am" bases (§9) ----
  // Bases + dayLocations live in settings (so they sync with the rest of
  // settings and are readable by the fitness calendar's Orbit bridge). All go
  // through updateSettings, reusing its merge/persist/dirty machinery.
  const addBase = useCallback(async (partial) => {
    const existing = stateRef.current.settings.bases || [];
    const b = newBase({ color: nextBaseColor(existing.length), ...partial });
    // Geocode inline (best-effort) so the base is usable immediately — avoids a
    // stateRef-vs-render race if the caller geocoded as a separate step.
    const geo = await geocodePlaceName(b.query || b.tag);
    if (geo) { b.lat = geo.lat; b.lng = geo.lng; b.geocodedAt = Date.now(); }
    await updateSettings({ bases: [...(stateRef.current.settings.bases || []), b] });
    return b;
  }, [updateSettings]);

  const updateBase = useCallback(async (id, updates) => {
    const bases = (stateRef.current.settings.bases || []).map((b) => (b.id === id ? { ...b, ...updates } : b));
    await updateSettings({ bases });
  }, [updateSettings]);

  const removeBase = useCallback(async (id) => {
    const bases = (stateRef.current.settings.bases || []).filter((b) => b.id !== id);
    // Strip any day still pointing at the deleted base so nothing dangles.
    const dayLocations = { ...(stateRef.current.settings.dayLocations || {}) };
    for (const k of Object.keys(dayLocations)) if (dayLocations[k] === id) delete dayLocations[k];
    await updateSettings({ bases, dayLocations });
  }, [updateSettings]);

  const setDayLocation = useCallback(async (iso, baseId) => {
    const dayLocations = { ...(stateRef.current.settings.dayLocations || {}) };
    if (baseId) dayLocations[iso] = baseId; else delete dayLocations[iso];
    await updateSettings({ dayLocations });
  }, [updateSettings]);

  // Geocode a base ONCE (Nominatim) via its disambiguated query, caching coords.
  // Reads the base from storage (always current — updateSettings mirrors to
  // localStorage synchronously) rather than stateRef, which only syncs after a
  // commit and would go stale mid-handler (e.g. relocate's clear-then-geocode).
  const ensureBaseGeocoded = useCallback(async (id) => {
    const base = (OrbitStorage.getSettings().bases || []).find((b) => b.id === id);
    if (!base) return null;
    if (base.lat != null && base.lng != null) return base;
    const geo = await geocodePlaceName(base.query || base.tag);
    if (!geo) return null;
    await updateBase(id, { lat: geo.lat, lng: geo.lng, geocodedAt: Date.now() });
    return { ...base, lat: geo.lat, lng: geo.lng };
  }, [updateBase]);

  // Fetch + cache a base's own forecast under its id, so weather-avoid on days
  // tagged to it reasons from that base's real location, not home's.
  const refreshBaseWeather = useCallback(async (id) => {
    const base = await ensureBaseGeocoded(id);
    if (!base || base.lat == null || base.lng == null) return { ok: false, reason: 'no-coords' };
    const entries = await fetchForecast(base.lat, base.lng, base.id);
    if (entries.length === 0) return { ok: false, reason: 'forecast-failed' };
    setWeather((prev) => [...entries, ...prev.filter((w) => (w.locationId ?? null) !== base.id)]);
    entries.forEach((e) => OrbitStorage.saveWeather(e));
    return { ok: true, days: entries.length };
  }, [ensureBaseGeocoded]);

  // Once per session (and once per new day, since a fetched forecast covers
  // today): if a home ZIP is set and today isn't cached, pull the forecast.
  const weatherCheckedRef = useRef(false);
  useEffect(() => {
    if (loading || weatherCheckedRef.current) return;
    if (!stateRef.current.settings.homeZip) return; // no ZIP yet — retry once one is set
    const todayStr = todayISO();
    if (weather.some((w) => w.date === todayStr)) { weatherCheckedRef.current = true; return; }
    weatherCheckedRef.current = true;
    refreshWeather();
  }, [loading, weather, refreshWeather]);

  // Derived: scheduled outdoor tasks whose day has turned rainy (§6 re-check) —
  // the UI surfaces these as reschedule prompts.
  const weatherRainFlags = useMemo(
    () => outdoorRescheduleFlags(tasks, weather, settings.scheduler.weatherAvoidPrecipPct),
    [tasks, weather, settings.scheduler.weatherAvoidPrecipPct],
  );

  // ---- AI annotation (§1/§9/§15) ----
  // Signed-in only (the endpoint verifies a Firebase ID token, same as the
  // inbox tidy). For each un-annotated task: fetch a validated annotation,
  // fill the still-unknown scheduler fields (user edits are never overwritten),
  // stamp aiAnnotatedAt so it isn't re-annotated, and infer+geocode a location
  // into the places DB when one is implied. Degrades to a no-op offline.
  const annotateTasks = useCallback(async (taskIds, onProgress) => {
    if (backend.mode !== 'cloud' || !user) return { ok: false, reason: 'not-signed-in' };
    const ids = (taskIds || []).filter(Boolean);
    if (ids.length === 0) return { ok: true, annotated: 0, total: 0 };

    // Resolve a location name → placeId, reusing existing places and deduping
    // within this batch so the same store isn't geocoded twice.
    const placeByName = new Map(places.map((p) => [p.name.trim().toLowerCase(), p.id]));
    const resolvePlace = async (name) => {
      const key = name.trim().toLowerCase();
      if (placeByName.has(key)) return placeByName.get(key);
      const created = await addPlace({ name: name.trim(), source: 'inferred' });
      placeByName.set(key, created.id);
      const geo = await geocodePlaceName(name.trim());
      if (geo) await updatePlace(created.id, { lat: geo.lat, lng: geo.lng, geocodedAt: Date.now() });
      return created.id;
    };

    let done = 0;
    let annotated = 0;
    for (const id of ids) {
      const task = stateRef.current.tasks.find((t) => t.id === id);
      if (task) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/orbit-annotate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: task.title }),
          });
          if (res.ok) {
            const data = await res.json();
            const a = data.annotation;
            if (a) {
              const patch = { aiAnnotatedAt: Date.now(), weatherSensitive: a.weatherSensitive, perishable: a.perishable };
              if (task.category == null) patch.category = a.category;
              if (task.intensity == null) patch.intensity = a.intensity;
              if (task.indoorOutdoor == null) patch.indoorOutdoor = a.indoorOutdoor;
              if (task.estWorkMin == null) patch.estWorkMin = a.estWorkMin;
              if (task.estRecoveryMin == null) patch.estRecoveryMin = a.estRecoveryMin;
              if (task.idealWindow == null) patch.idealWindow = a.idealWindow;
              if (a.locationName && task.locationId == null) {
                const placeId = await resolvePlace(a.locationName);
                if (placeId) patch.locationId = placeId;
              }
              await updateTask(id, patch);
              annotated += 1;
            }
          }
        } catch { /* skip this task; the rest still annotate */ }
      }
      done += 1;
      if (onProgress) onProgress(done, ids.length);
    }
    return { ok: true, annotated, total: ids.length };
  }, [backend, user, places, addPlace, updatePlace, updateTask]);

  // ---- export / import (Phase 3) ----
  // Snapshot, not a live reference — read off stateRef.current the same way
  // generateReview/rollTaskToToday do, so a caller who awaits a slow download
  // dialog still gets the data as of the call, not whatever state drifts to
  // meanwhile.
  const exportData = useCallback(() => {
    const cur = stateRef.current;
    return {
      schemaVersion: 1,
      exportedAt: Date.now(),
      areas: cur.areas,
      projects: cur.projects,
      tasks: cur.tasks,
      inbox: cur.inbox,
      settings: cur.settings,
      recurrenceRules: cur.recurrenceRules,
      references: cur.references,
      trackers: cur.trackers,
      reviewLogs: cur.reviewLogs,
      dayPlans: cur.dayPlans,
    };
  }, []);

  // Full-replace restore from a prior exportData() snapshot (or anything
  // shaped like one). Defensive about the input's shape — a hand-edited or
  // partially-corrupted file shouldn't crash the app, it should just import
  // what it can (missing collections become empty, not a throw) — but a
  // non-object `data` altogether is rejected rather than silently wiping
  // everything the user already has.
  const importData = useCallback(async (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, error: 'Invalid import: expected an export object' };
    }

    const nextAreas = Array.isArray(data.areas) ? data.areas : [];
    const nextProjects = (Array.isArray(data.projects) ? data.projects : []).map(withProjectDefaults);
    const nextTasks = (Array.isArray(data.tasks) ? data.tasks : []).map(withTaskDefaults);
    const nextInbox = Array.isArray(data.inbox) ? data.inbox : [];
    const nextSettings = withSettingsDefaults(data.settings);
    const nextRecurrenceRules = Array.isArray(data.recurrenceRules) ? data.recurrenceRules : [];
    const nextReferences = (Array.isArray(data.references) ? data.references : []).map(withReferenceDefaults);
    const nextTrackers = Array.isArray(data.trackers) ? data.trackers : [];
    const nextReviewLogs = Array.isArray(data.reviewLogs) ? data.reviewLogs : [];
    const nextDayPlans = (Array.isArray(data.dayPlans) ? data.dayPlans : []).map(withDayPlanDefaults);

    setAreas(nextAreas);
    setProjects(nextProjects);
    setTasks(nextTasks);
    setInbox(nextInbox);
    setSettings(nextSettings);
    setRecurrenceRules(nextRecurrenceRules);
    setReferences(nextReferences);
    setTrackers(nextTrackers);
    setReviewLogs(nextReviewLogs);
    setDayPlans(nextDayPlans);

    OrbitStorage.replaceAll('areas', nextAreas);
    OrbitStorage.replaceAll('projects', nextProjects);
    OrbitStorage.replaceAll('tasks', nextTasks);
    OrbitStorage.replaceAll('inbox', nextInbox);
    OrbitStorage.replaceAll('settings', nextSettings);
    OrbitStorage.replaceAll('recurrenceRules', nextRecurrenceRules);
    OrbitStorage.replaceAll('references', nextReferences);
    OrbitStorage.replaceAll('trackers', nextTrackers);
    OrbitStorage.replaceAll('reviewLogs', nextReviewLogs);
    OrbitStorage.replaceAll('dayPlans', nextDayPlans);

    // Cloud mode: the whole imported set has to actually reach Firestore, not
    // just the local mirror — mark every doc dirty so the next coalesced
    // flush() ships it all (already-chunked batches handle the volume; see
    // OrbitFirestore.flush).
    if (backend.mode === 'cloud') {
      nextAreas.forEach((a) => markDirty('areas', a.id));
      nextProjects.forEach((p) => markDirty('projects', p.id));
      nextTasks.forEach((t) => markDirty('tasks', t.id));
      nextInbox.forEach((i) => markDirty('inbox', i.id));
      nextRecurrenceRules.forEach((r) => markDirty('recurrenceRules', r.id));
      nextReferences.forEach((r) => markDirty('references', r.id));
      nextTrackers.forEach((t) => markDirty('trackers', t.id));
      nextReviewLogs.forEach((r) => markDirty('reviewLogs', r.id));
      nextDayPlans.forEach((d) => markDirty('dayPlans', d.date));
      markSettingsDirty();
    }

    return {
      ok: true,
      counts: {
        areas: nextAreas.length,
        projects: nextProjects.length,
        tasks: nextTasks.length,
        inbox: nextInbox.length,
        recurrenceRules: nextRecurrenceRules.length,
        references: nextReferences.length,
        trackers: nextTrackers.length,
        reviewLogs: nextReviewLogs.length,
        dayPlans: nextDayPlans.length,
      },
    };
  }, [backend, markDirty, markSettingsDirty]);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const today = todayISO();

  // ---- carryover ----
  // Derived, not stored — recomputed from tasks whenever they (or the day)
  // change. Never auto-applied; rollTaskToToday is the opt-in per-task action
  // the carryover-triage UI calls once the user confirms.
  const carryoverCandidatesList = useMemo(() => calcCarryoverCandidates(tasks, today), [tasks, today]);

  const rollTaskToToday = useCallback(async (id) => {
    const candidate = carryoverCandidatesList.find((c) => c.taskId === id);
    const patch = { scheduledDate: today };
    if (candidate?.suggestedAction === 'raiseUrgency') {
      const current = stateRef.current.tasks.find((t) => t.id === id);
      patch.urgency = Math.min(5, (current?.urgency ?? 3) + 1);
    }
    return updateTask(id, patch);
  }, [today, updateTask, carryoverCandidatesList]);

  return {
    areas, projects, tasks, inbox, settings, loading, mode: backend.mode,
    tasksById, today,
    addArea, updateArea, archiveArea, removeArea, reorderAreas,
    addProject, updateProject, removeProject,
    addTask, updateTask, removeTask,
    addInboxItem, updateInboxItem, removeInboxItem,
    updateSettings,
    // ---- Phase 2 (new) ----
    recurrenceRules, references, trackers, reviewLogs, dayPlans,
    addRecurrenceRule, updateRecurrenceRule, removeRecurrenceRule,
    addReference, updateReference, removeReference,
    addTracker, updateTracker, removeTracker,
    getDayPlan, setDayPlan,
    addReviewLog, generateReview,
    carryoverCandidates: carryoverCandidatesList, rollTaskToToday,
    reload,
    // ---- Phase 3 (new) ----
    exportData, importData,
    // ---- scheduler databases (§3.2, local-only for now) ----
    places, durations, weather, rules, travelLog,
    addPlace, updatePlace, removePlace,
    upsertDuration, saveWeather,
    addRule, updateRule, removeRule,
    upsertTravelLogEntry,
    // ---- weather (§6) ----
    refreshWeather, weatherRainFlags,
    // ---- "where I am" bases (§9) ----
    bases: settings.bases, dayLocations: settings.dayLocations,
    addBase, updateBase, removeBase, setDayLocation, ensureBaseGeocoded, refreshBaseWeather,
    // ---- AI annotation (§1/§9/§15) ----
    annotateTasks,
  };
}
