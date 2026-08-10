// PogoFilters shared state. Kept in a .js module with NO component export so
// Vite fast-refresh stays happy (react-refresh/only-export-components) — the
// PogoFiltersApp shell consumes usePogoFiltersState() and provides the context.
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { PogoFiltersStorage } from './pogofiltersStorage';
import { PogoFiltersFirestore } from './pogofiltersFirestore';
import { withFilterDefaults, withLabelDefaults, withGroupDefaults } from './pogofiltersConfig';
import seedData from './data/seed.json';

export const PogoFiltersContext = createContext(null);

export function usePogoFilters() {
  return useContext(PogoFiltersContext);
}

// One adapter over the two data layers. Cloud when signed in, localStorage
// otherwise — same method names either way, so nothing above this cares.
function makeBackend(user, firebaseReady) {
  if (user && firebaseReady) {
    const u = user.uid;
    const F = PogoFiltersFirestore;
    return {
      mode: 'cloud',
      ensure: () => F.ensureSettings(u),
      getFilters: () => F.getFilters(u),
      saveFilter: (f) => F.saveFilter(u, f),
      replaceFilters: (l) => F.replaceFilters(u, l),
      removeFilter: (id) => F.removeFilter(u, id),
      getLabels: () => F.getLabels(u),
      saveLabel: (l) => F.saveLabel(u, l),
      replaceLabels: (l) => F.replaceLabels(u, l),
      removeLabel: (id) => F.removeLabel(u, id),
      getSpecies: () => F.getSpecies(u),
      saveSpecies: (s) => F.saveSpecies(u, s),
      saveSpeciesBulk: (s) => F.saveSpeciesBulk(u, s),
      getGroups: () => F.getGroups(u),
      saveGroup: (g) => F.saveGroup(u, g),
      removeGroup: (id) => F.removeGroup(u, id),
      getSettings: () => F.getSettings(u),
      updateSettings: (x) => F.updateSettings(u, x),
      getLog: () => F.getLog(u),
      addLogEntry: (e) => F.addLogEntry(u, e),
      saveLogEntry: (e) => F.saveLogEntry(u, e),
      removeLogEntry: (id) => F.removeLogEntry(u, id),
      getSessions: () => F.getSessions(u),
      saveSession: (s) => F.saveSession(u, s),
      pushSnapshot: (s) => F.pushSnapshot(u, s),
      popSnapshot: () => F.popSnapshot(u),
      getSnapshots: () => F.getSnapshots(u),
    };
  }
  const S = PogoFiltersStorage;
  return {
    mode: 'local',
    ensure: async () => S.getSettings(),
    getFilters: async () => S.getFilters(),
    saveFilter: async (f) => S.saveFilter(f),
    replaceFilters: async (l) => S.replaceFilters(l),
    removeFilter: async (id) => S.removeFilter(id),
    getLabels: async () => S.getLabels(),
    saveLabel: async (l) => S.saveLabel(l),
    replaceLabels: async (l) => S.replaceLabels(l),
    removeLabel: async (id) => S.removeLabel(id),
    getSpecies: async () => S.getSpecies(),
    saveSpecies: async (s) => S.saveSpecies(s),
    saveSpeciesBulk: async (s) => S.saveSpeciesBulk(s),
    getGroups: async () => S.getGroups(),
    saveGroup: async (g) => S.saveGroup(g),
    removeGroup: async (id) => S.removeGroup(id),
    getSettings: async () => S.getSettings(),
    updateSettings: async (x) => S.updateSettings(x),
    getLog: async () => S.getLog(),
    addLogEntry: async (e) => S.addLogEntry(e),
    saveLogEntry: async (e) => S.saveLogEntry(e),
    removeLogEntry: async (id) => S.removeLogEntry(id),
    getSessions: async () => S.getSessions(),
    saveSession: async (s) => S.saveSession(s),
    pushSnapshot: async (s) => S.pushSnapshot(s),
    popSnapshot: async () => S.popSnapshot(),
    getSnapshots: async () => S.getSnapshots(),
  };
}

export function usePogoFiltersState() {
  const { user, firebaseReady } = useAuth();
  const signedIn = !!user;

  const [filters, setFilters] = useState([]);
  const [labels, setLabels] = useState([]);
  const [species, setSpecies] = useState({});
  const [groups, setGroups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [log, setLog] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [hasUndo, setHasUndo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const backend = useMemo(() => makeBackend(user, firebaseReady), [user, firebaseReady]);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSyncError = useCallback((err) => {
    if (err?.code === 'resource-exhausted') {
      showToast("Cloud sync paused — today's free Firebase limit was hit. Your data is safe; try again after midnight Pacific.", 'error');
    } else if (err?.code === 'permission-denied') {
      showToast('Firestore rules are not open to pogofilters_* for this account — nothing was saved to the cloud.', 'error');
    } else {
      showToast(`Cloud sync error: ${err?.message ?? 'unknown'}`, 'error');
    }
    console.error('PogoFilters Firestore error:', err);
  }, [showToast]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Load, seeding on a genuinely empty store. Seeding is only ever triggered by
  // "no filters AND no labels" — never by a filter count that merely looks low,
  // so deleting everything on purpose doesn't silently resurrect the seed.
  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        await backend.ensure();
        let [f, l, sp, g, st, lg, ss, snaps] = await Promise.all([
          backend.getFilters(), backend.getLabels(), backend.getSpecies(),
          backend.getGroups(), backend.getSettings(), backend.getLog(),
          backend.getSessions(), backend.getSnapshots(),
        ]);

        if (!f.length && !l.length && !st.seeded) {
          f = await backend.replaceFilters(seedData.filters.map(withFilterDefaults));
          l = await backend.replaceLabels(seedData.labels.map((x, i) => withLabelDefaults(x, i)));
          for (const grp of seedData.groups) await backend.saveGroup(withGroupDefaults(grp));
          g = await backend.getGroups();
          st = await backend.updateSettings({ seeded: true });
        }

        if (cancelled) return;
        setFilters(f); setLabels(l); setSpecies(sp); setGroups(g);
        setSettings(st); setLog(lg); setSessions(ss); setHasUndo((snaps || []).length > 0);
      } catch (err) {
        if (!cancelled) handleSyncError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, backend, handleSyncError]);

  // ---- filters ----
  const saveFilter = useCallback(async (f) => {
    const next = withFilterDefaults({ ...f, updatedAt: Date.now() });
    setFilters((prev) => {
      const i = prev.findIndex((x) => x.id === next.id);
      return i === -1 ? [...prev, next] : prev.map((x) => (x.id === next.id ? next : x));
    });
    try { await backend.saveFilter(next); } catch (err) { handleSyncError(err); }
    return next;
  }, [backend, handleSyncError]);

  const removeFilter = useCallback(async (id) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
    try { await backend.removeFilter(id); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  // The single commit path for every multi-filter change (bulk edit, apply
  // engine, normalisation). Snapshots first so undo always has something.
  const commitFilters = useCallback(async (nextList, description) => {
    try {
      await backend.pushSnapshot({ description, filters });
      const saved = await backend.replaceFilters(nextList);
      setFilters(saved);
      setHasUndo(true);
      return saved;
    } catch (err) {
      handleSyncError(err);
      return null;
    }
  }, [backend, filters, handleSyncError]);

  const undo = useCallback(async () => {
    try {
      const snap = await backend.popSnapshot();
      if (!snap) { showToast('Nothing to undo'); return null; }
      const restored = await backend.replaceFilters(snap.filters);
      setFilters(restored);
      setHasUndo((await backend.getSnapshots()).length > 0);
      showToast(`Undone: ${snap.description || 'bulk change'}`);
      return restored;
    } catch (err) {
      handleSyncError(err);
      return null;
    }
  }, [backend, handleSyncError, showToast]);

  // ---- labels ----
  const saveLabel = useCallback(async (l) => {
    const next = withLabelDefaults(l);
    setLabels((prev) => {
      const i = prev.findIndex((x) => x.id === next.id);
      return i === -1 ? [...prev, next] : prev.map((x) => (x.id === next.id ? next : x));
    });
    try { await backend.saveLabel(next); } catch (err) { handleSyncError(err); }
    return next;
  }, [backend, handleSyncError]);

  const removeLabel = useCallback(async (id) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
    try { await backend.removeLabel(id); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  // ---- species ----
  const saveSpecies = useCallback(async (entry) => {
    setSpecies((prev) => ({ ...prev, [entry.dex]: { ...prev[entry.dex], ...entry } }));
    try { await backend.saveSpecies(entry); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  const saveSpeciesBulk = useCallback(async (entries) => {
    setSpecies((prev) => {
      const next = { ...prev };
      for (const e of entries) next[e.dex] = { ...next[e.dex], ...e };
      return next;
    });
    try { await backend.saveSpeciesBulk(entries); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  // ---- groups ----
  const saveGroup = useCallback(async (g) => {
    const next = withGroupDefaults(g);
    setGroups((prev) => {
      const i = prev.findIndex((x) => x.id === next.id);
      return i === -1 ? [...prev, next] : prev.map((x) => (x.id === next.id ? next : x));
    });
    try { await backend.saveGroup(next); } catch (err) { handleSyncError(err); }
    return next;
  }, [backend, handleSyncError]);

  const removeGroup = useCallback(async (id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    try { await backend.removeGroup(id); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  // ---- settings ----
  const updateSettings = useCallback(async (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    try { await backend.updateSettings(updates); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  // ---- sort log ----
  const addLogEntry = useCallback(async (entry) => {
    const e = { ...entry, id: entry.id || Math.random().toString(36).slice(2), ts: entry.ts || Date.now() };
    setLog((prev) => [e, ...prev]);
    try { await backend.addLogEntry(e); } catch (err) { handleSyncError(err); }
    return e;
  }, [backend, handleSyncError]);

  const saveLogEntry = useCallback(async (entry) => {
    setLog((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    try { await backend.saveLogEntry(entry); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  const removeLogEntry = useCallback(async (id) => {
    setLog((prev) => prev.filter((e) => e.id !== id));
    try { await backend.removeLogEntry(id); } catch (err) { handleSyncError(err); }
  }, [backend, handleSyncError]);

  const saveSession = useCallback(async (s) => {
    setSessions((prev) => {
      const i = prev.findIndex((x) => x.id === s.id);
      return i === -1 ? [s, ...prev] : prev.map((x) => (x.id === s.id ? s : x));
    });
    try { await backend.saveSession(s); } catch (err) { handleSyncError(err); }
    return s;
  }, [backend, handleSyncError]);

  // Re-seed on demand from the markdown-derived seed, for a reset.
  const reseed = useCallback(async () => {
    const f = await backend.replaceFilters(seedData.filters.map(withFilterDefaults));
    const l = await backend.replaceLabels(seedData.labels.map((x, i) => withLabelDefaults(x, i)));
    setFilters(f); setLabels(l);
    showToast(`Reloaded ${f.length} filters and ${l.length} labels from the source markdown`);
  }, [backend, showToast]);

  return {
    mode: backend.mode, signedIn, loading,
    filters, labels, species, groups, settings, log, sessions,
    toast, showToast, hasUndo,
    saveFilter, removeFilter, commitFilters, undo,
    saveLabel, removeLabel,
    saveSpecies, saveSpeciesBulk,
    saveGroup, removeGroup,
    updateSettings,
    addLogEntry, saveLogEntry, removeLogEntry, saveSession,
    reseed,
  };
}
