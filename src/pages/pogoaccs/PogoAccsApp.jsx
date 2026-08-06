import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { PgoStorage } from '../pgotracker/pgoStorage';
import { PgoFirestore } from '../pgotracker/pgoFirestore';
import { PogoAccsStorage } from './pogoaccsStorage';
import { PogoAccsFirestore } from './pogoaccsFirestore';
import { PogoAccsContext } from './pogoaccsContext';
import OverviewPage from './OverviewPage';
import BoxView from './BoxView';
import MegaMatrix from './MegaMatrix';
import RaidList from './RaidList';
import RaidBossDetail from './RaidBossDetail';
import GroupsView from './GroupsView';
import ImportView from './ImportView';
import './PogoAccs.css';

const TABS = [
  { to: '/POGO-ACCS', label: 'Overview', match: (p) => p === '/POGO-ACCS' || p.startsWith('/POGO-ACCS/box') },
  { to: '/POGO-ACCS/megas', label: 'Megas', match: (p) => p.startsWith('/POGO-ACCS/megas') },
  { to: '/POGO-ACCS/raids', label: 'Raids', match: (p) => p.startsWith('/POGO-ACCS/raids') },
  { to: '/POGO-ACCS/groups', label: 'Groups', match: (p) => p.startsWith('/POGO-ACCS/groups') },
  { to: '/POGO-ACCS/import', label: 'Import', match: (p) => p.startsWith('/POGO-ACCS/import') },
];

export default function PogoAccsApp() {
  const location = useLocation();
  const { user } = useAuth();
  const signedIn = !!user;

  const [accounts, setAccounts] = useState([]);
  const [boxes, setBoxes] = useState({});
  const [megas, setMegas] = useState({});
  const [groups, setGroups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSyncError = useCallback((err) => {
    if (err?.code === 'resource-exhausted') {
      showToast("Cloud sync paused — today's free Firebase limit was hit. Your data is safe; try again after midnight Pacific.", 'error');
    } else {
      showToast(`Cloud sync error: ${err?.message ?? 'unknown'}`, 'error');
    }
    console.error('POGO Accs Firestore error:', err);
  }, [showToast]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (signedIn) {
          await PgoFirestore.seedIfEmpty(user.uid);
          const [loadedAccounts, loadedBoxes, loadedMegas, loadedGroups, loadedSettings] = await Promise.all([
            PgoFirestore.getAccounts(user.uid),
            PogoAccsFirestore.getBoxes(user.uid),
            PogoAccsFirestore.getMegas(user.uid),
            PogoAccsFirestore.getGroups(user.uid),
            PogoAccsFirestore.ensureSettings(user.uid),
          ]);
          if (cancelled) return;
          setAccounts(loadedAccounts);
          setBoxes(loadedBoxes);
          setMegas(loadedMegas);
          setGroups(loadedGroups);
          setSettings(loadedSettings);
        } else {
          PgoStorage.seed();
          setAccounts(PgoStorage.getAccounts());
          setBoxes(PogoAccsStorage.getBoxes());
          setMegas(PogoAccsStorage.getMegas());
          setGroups(PogoAccsStorage.getGroups());
          setSettings(PogoAccsStorage.getSettings());
        }
      } catch (err) {
        if (!cancelled) handleSyncError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, signedIn, handleSyncError]);

  const setBoxEntries = useCallback(async (accountId, entries) => {
    if (signedIn) {
      try {
        const box = await PogoAccsFirestore.setBoxEntries(user.uid, accountId, entries);
        setBoxes((prev) => ({ ...prev, [accountId]: box }));
        return box;
      } catch (err) { handleSyncError(err); return null; }
    }
    const box = PogoAccsStorage.setBoxEntries(accountId, entries);
    setBoxes((prev) => ({ ...prev, [accountId]: box }));
    return box;
  }, [signedIn, user, handleSyncError]);

  const addEntries = useCallback(async (accountId, newEntries) => {
    if (signedIn) {
      try {
        const box = await PogoAccsFirestore.addEntries(user.uid, accountId, newEntries);
        setBoxes((prev) => ({ ...prev, [accountId]: box }));
        return box;
      } catch (err) { handleSyncError(err); return null; }
    }
    const box = PogoAccsStorage.addEntries(accountId, newEntries);
    setBoxes((prev) => ({ ...prev, [accountId]: box }));
    return box;
  }, [signedIn, user, handleSyncError]);

  const setMegaCell = useCallback(async (accountId, megaId, cell) => {
    if (signedIn) {
      try {
        const megaDoc = await PogoAccsFirestore.setMegaCell(user.uid, accountId, megaId, cell);
        setMegas((prev) => ({ ...prev, [accountId]: megaDoc }));
        return megaDoc;
      } catch (err) { handleSyncError(err); return null; }
    }
    const megaDoc = PogoAccsStorage.setMegaCell(accountId, megaId, cell);
    setMegas((prev) => ({ ...prev, [accountId]: megaDoc }));
    return megaDoc;
  }, [signedIn, user, handleSyncError]);

  const addGroup = useCallback(async (name) => {
    if (signedIn) {
      try {
        const group = await PogoAccsFirestore.addGroup(user.uid, name);
        setGroups((prev) => [...prev, group]);
        return group;
      } catch (err) { handleSyncError(err); return null; }
    }
    const group = PogoAccsStorage.addGroup(name);
    setGroups((prev) => [...prev, group]);
    return group;
  }, [signedIn, user, handleSyncError]);

  const renameGroup = useCallback(async (id, name) => {
    if (signedIn) {
      try {
        await PogoAccsFirestore.renameGroup(user.uid, id, name);
        setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    PogoAccsStorage.renameGroup(id, name);
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));
  }, [signedIn, user, handleSyncError]);

  const removeGroup = useCallback(async (id) => {
    if (signedIn) {
      try {
        await PogoAccsFirestore.removeGroup(user.uid, id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    PogoAccsStorage.removeGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, [signedIn, user, handleSyncError]);

  const setGroupMembers = useCallback(async (id, memberAccountIds) => {
    if (signedIn) {
      try {
        await PogoAccsFirestore.setGroupMembers(user.uid, id, memberAccountIds);
        setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, memberAccountIds } : g)));
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    PogoAccsStorage.setGroupMembers(id, memberAccountIds);
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, memberAccountIds } : g)));
  }, [signedIn, user, handleSyncError]);

  const updateSettings = useCallback(async (updates) => {
    if (signedIn) {
      try {
        const updated = await PogoAccsFirestore.updateSettings(user.uid, updates);
        setSettings(updated);
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = PogoAccsStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, [signedIn, user, handleSyncError]);

  if (user === undefined || loading || !settings) {
    return <div className="pgoa-loading">Loading…</div>;
  }

  const contextValue = {
    accounts,
    boxes,
    megas,
    groups,
    settings,
    signedIn,
    loading,
    toast,
    actions: {
      setBoxEntries,
      addEntries,
      setMegaCell,
      addGroup,
      renameGroup,
      removeGroup,
      setGroupMembers,
      updateSettings,
    },
  };

  return (
    <PogoAccsContext.Provider value={contextValue}>
      <div className="pgoa-app">
        <div className="pgoa-orbs">
          <div className="pgoa-orb" />
          <div className="pgoa-orb" />
          <div className="pgoa-orb" />
        </div>

        <header className="pgoa-header">
          <h1 className="pgoa-title">POGO ACCS</h1>
          <p className="pgoa-subtitle">multi-account raid & mega tracker</p>
          {/* div, not nav — Navbar.css styles the bare nav element globally */}
          <div className="pgoa-tabs">
            {TABS.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`pgoa-tab${tab.match(location.pathname) ? ' pgoa-tab-active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </header>

        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="box/:accountId" element={<BoxView />} />
          <Route path="megas" element={<MegaMatrix />} />
          <Route path="raids" element={<RaidList />} />
          <Route path="raids/:bossId" element={<RaidBossDetail />} />
          <Route path="groups" element={<GroupsView />} />
          <Route path="import" element={<ImportView />} />
          <Route path="*" element={<Navigate to="/POGO-ACCS" replace />} />
        </Routes>

        {toast && <div className={`pgoa-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </PogoAccsContext.Provider>
  );
}
