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
  SEED_AREAS, withSettingsDefaults, todayISO,
} from './orbitConfig';
import { computePriorityScore } from './calc/priority';
import { runHousekeepingPlan } from './calc/housekeeping';

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
  };
}

// Dirty collections are Map<id, version> rather than Set<id> — versioning
// lets flush() tell "this id was re-edited while the batch I already sent
// was in flight" apart from "this id is untouched since that batch landed",
// which a plain Set can't distinguish (see flush()'s cleanup below).
function emptyDirty() {
  return {
    areas: new Map(), projects: new Map(), tasks: new Map(), inbox: new Map(),
    settingsDirty: false, settingsVersion: 0,
  };
}
function emptyDeletes() {
  return { areas: new Set(), projects: new Set(), tasks: new Set(), inbox: new Set() };
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

  // Write-coalescing bookkeeping. Refs, not state — mutated outside the
  // render cycle and never need to trigger a re-render themselves.
  const dirtyRef = useRef(emptyDirty());
  const deletesRef = useRef(emptyDeletes());
  const flushTimerRef = useRef(null);
  const stateRef = useRef({ areas, projects, tasks, inbox, settings });
  // Refs can't be written during render (React 19 rule) — sync it in an
  // effect that runs after every commit instead.
  useEffect(() => {
    stateRef.current = { areas, projects, tasks, inbox, settings };
  });

  const flush = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (backend.mode !== 'cloud') return;
    const dirty = dirtyRef.current;
    const deletes = deletesRef.current;
    const hasWork = dirty.areas.size || dirty.projects.size || dirty.tasks.size || dirty.inbox.size
      || dirty.settingsDirty
      || deletes.areas.size || deletes.projects.size || deletes.tasks.size || deletes.inbox.size;
    if (!hasWork) return;

    // Snapshot exactly what's about to be sent (ids + their version, and the
    // settings version) BEFORE the await. A markDirty()/markSettingsDirty()
    // call that lands while the batch below is in flight mutates the LIVE
    // dirtyRef/deletesRef, not these snapshots — so on success we only clear
    // what we snapshotted, and only if its version is unchanged. If it's
    // moved on (re-edited mid-flight, data we just sent is already stale),
    // it's left dirty for the next flush instead of being silently dropped.
    const sentVersions = {
      areas: new Map(dirty.areas), projects: new Map(dirty.projects),
      tasks: new Map(dirty.tasks), inbox: new Map(dirty.inbox),
    };
    const sentDeletes = {
      areas: new Set(deletes.areas), projects: new Set(deletes.projects),
      tasks: new Set(deletes.tasks), inbox: new Set(deletes.inbox),
    };
    const sentSettings = dirty.settingsDirty;
    const sentSettingsVersion = dirty.settingsVersion;

    const cur = stateRef.current;
    const byId = (arr) => new Map(arr.map((x) => [x.id, x]));
    const areasById = byId(cur.areas);
    const projectsById = byId(cur.projects);
    const tasksById = byId(cur.tasks);
    const inboxById = byId(cur.inbox);

    // Skip anything also queued for delete — no point upserting a doc we're
    // about to remove in the same batch.
    const buildUpserts = (col, docsById) => [...sentVersions[col].keys()]
      .filter((id) => !sentDeletes[col].has(id) && docsById.has(id))
      .map((id) => docsById.get(id));
    const upserts = {
      areas: buildUpserts('areas', areasById),
      projects: buildUpserts('projects', projectsById),
      tasks: buildUpserts('tasks', tasksById),
      inbox: buildUpserts('inbox', inboxById),
      settings: sentSettings ? cur.settings : undefined,
    };
    const deletesPayload = {
      areas: [...sentDeletes.areas],
      projects: [...sentDeletes.projects],
      tasks: [...sentDeletes.tasks],
      inbox: [...sentDeletes.inbox],
    };

    try {
      await OrbitFirestore.flush(backend.uid, { upserts, deletes: deletesPayload });
      ['areas', 'projects', 'tasks', 'inbox'].forEach((col) => {
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

    Promise.all([backend.getAreas(), backend.getProjects(), backend.getTasks(), backend.getInbox(), backend.getSettings()])
      .then(async ([a, p, t, i, s]) => {
        if (!alive) return;
        let nextAreas = Array.isArray(a) ? a : [];
        const nextProjects = (Array.isArray(p) ? p : []).map(withProjectDefaults);
        const nextTasks = (Array.isArray(t) ? t : []).map(withTaskDefaults);
        const nextInbox = Array.isArray(i) ? i : [];
        const nextSettings = withSettingsDefaults(s);

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
        }

        setAreas(nextAreas);
        setProjects(nextProjects);
        setTasks(nextTasks);
        setInbox(nextInbox);
        setSettings(nextSettings);
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
          OrbitStorage.setHousekeepingDate(today);
        }
      })
      .catch(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [backend, markDirty, markDeleted]);

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
    const t = newTask(partial, stateRef.current.settings); // newTask already computes priorityScore
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

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  return {
    areas, projects, tasks, inbox, settings, loading, mode: backend.mode,
    tasksById, today: todayISO(),
    addArea, updateArea, archiveArea, reorderAreas,
    addProject, updateProject, removeProject,
    addTask, updateTask, removeTask,
    addInboxItem, updateInboxItem, removeInboxItem,
    updateSettings,
  };
}
