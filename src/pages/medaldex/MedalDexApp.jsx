import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { PgoStorage } from '../pgotracker/pgoStorage';
import { PgoFirestore } from '../pgotracker/pgoFirestore';
import { MedalDexStorage } from './medaldexStorage';
import { MedalDexFirestore } from './medaldexFirestore';
import { MedalDexContext } from './medaldexContext';
import MedalAccountSwitcher from './MedalAccountSwitcher';
import ProgressBackup from './ProgressBackup';
import DexView from './DexView';
import FormsView from './FormsView';
import SpeciesDetail from './SpeciesDetail';
import Summary from './Summary';
import Medals from './Medals';
import BulkUpdate from './BulkUpdate';
import './MedalDex.css';

// Requirement #1: two independent features, one page, behind a top-level
// switch. Each feature owns its own sub-nav below the switch -- Pokedex
// gets Dex/Forms/Summary, Medals gets Medals/Bulk Update. `match` decides
// which top-level button (and, for FEATURE_SUBTABS, which sub-tab) is
// highlighted for the current path; species detail counts as part of the
// Pokedex feature's "Dex" sub-tab since it's reached FROM the dex grid.
const FEATURES = [
  { key: 'dex', label: 'Pokédex', to: '/medaldex', match: (p) => !p.startsWith('/medaldex/medals') },
  { key: 'medals', label: 'Medals', to: '/medaldex/medals', match: (p) => p.startsWith('/medaldex/medals') },
];

const FEATURE_SUBTABS = {
  dex: [
    { to: '/medaldex', label: 'Dex', match: (p) => p === '/medaldex' || p.startsWith('/medaldex/species') },
    { to: '/medaldex/forms', label: 'Forms', match: (p) => p.startsWith('/medaldex/forms') },
    { to: '/medaldex/summary', label: 'Summary', match: (p) => p.startsWith('/medaldex/summary') },
  ],
  medals: [
    { to: '/medaldex/medals', label: 'Medals', match: (p) => p === '/medaldex/medals' },
    { to: '/medaldex/medals/bulk', label: 'Bulk Update', match: (p) => p.startsWith('/medaldex/medals/bulk') },
  ],
};

export default function MedalDexApp() {
  const location = useLocation();
  const { user } = useAuth();
  const signedIn = !!user;

  const [accounts, setAccounts] = useState([]);
  const [dex, setDex] = useState({});
  const [medals, setMedals] = useState({});
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
    console.error('MedalDex Firestore error:', err);
  }, [showToast]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (signedIn) {
          // Accounts themselves come from PGO Tracker's own dual-mode load
          // path (see CLAUDE.md sub-app pattern + POGO Accs precedent) --
          // MedalDex never creates/renames/deletes accounts, only reads them.
          await PgoFirestore.seedIfEmpty(user.uid);
          const [loadedAccounts, loadedDex, loadedMedals, loadedSettings] = await Promise.all([
            PgoFirestore.getAccounts(user.uid),
            MedalDexFirestore.getDex(user.uid),
            MedalDexFirestore.getMedals(user.uid),
            MedalDexFirestore.ensureSettings(user.uid),
          ]);
          if (cancelled) return;
          setAccounts(loadedAccounts);
          setDex(loadedDex);
          setMedals(loadedMedals);
          setSettings(loadedSettings);
        } else {
          PgoStorage.seed();
          const loadedAccounts = PgoStorage.getAccounts();
          setAccounts(loadedAccounts);
          setDex(MedalDexStorage.getDex());
          setMedals(MedalDexStorage.getMedals());
          setSettings(MedalDexStorage.getSettings());
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

  const setSpeciesCategory = useCallback(async (accountId, speciesId, category, value) => {
    if (signedIn) {
      try {
        const flags = await MedalDexFirestore.setSpeciesCategory(user.uid, accountId, speciesId, category, value);
        setDex((prev) => ({
          ...prev,
          [accountId]: { accountId, species: { ...(prev[accountId]?.species || {}), [speciesId]: flags } },
        }));
        return flags;
      } catch (err) { handleSyncError(err); return null; }
    }
    const flags = MedalDexStorage.setSpeciesCategory(accountId, speciesId, category, value);
    setDex((prev) => ({
      ...prev,
      [accountId]: { accountId, species: { ...(prev[accountId]?.species || {}), [speciesId]: flags } },
    }));
    return flags;
  }, [signedIn, user, handleSyncError]);

  const toggleSpeciesCategory = useCallback(async (accountId, speciesId, category) => {
    const current = dex[accountId]?.species?.[speciesId]?.[category] || false;
    return setSpeciesCategory(accountId, speciesId, category, !current);
  }, [dex, setSpeciesCategory]);

  const setMedalValue = useCallback(async (accountId, medalId, value) => {
    if (signedIn) {
      try {
        const medalMap = await MedalDexFirestore.setMedalValue(user.uid, accountId, medalId, value);
        setMedals((prev) => ({ ...prev, [accountId]: { accountId, medals: medalMap } }));
        return medalMap;
      } catch (err) { handleSyncError(err); return null; }
    }
    const medalMap = MedalDexStorage.setMedalValue(accountId, medalId, value);
    setMedals((prev) => ({ ...prev, [accountId]: { accountId, medals: medalMap } }));
    return medalMap;
  }, [signedIn, user, handleSyncError]);

  // COULD #32 (export/import progress). Batches into a single storage/
  // Firestore write per data kind -- see importAccountData in
  // medaldexStorage.js / medaldexFirestore.js -- instead of one write per
  // species flag or medal value, which matters for a full-account import.
  const importProgress = useCallback(async (accountId, data) => {
    if (signedIn) {
      try {
        const result = await MedalDexFirestore.importAccountData(user.uid, accountId, data);
        if (result.species) setDex((prev) => ({ ...prev, [accountId]: { accountId, species: result.species } }));
        if (result.medals) setMedals((prev) => ({ ...prev, [accountId]: { accountId, medals: result.medals } }));
        return result;
      } catch (err) { handleSyncError(err); return null; }
    }
    const result = MedalDexStorage.importAccountData(accountId, data);
    if (result.species) setDex((prev) => ({ ...prev, [accountId]: { accountId, species: result.species } }));
    if (result.medals) setMedals((prev) => ({ ...prev, [accountId]: { accountId, medals: result.medals } }));
    return result;
  }, [signedIn, user, handleSyncError]);

  const updateSettings = useCallback(async (updates) => {
    if (signedIn) {
      try {
        const updated = await MedalDexFirestore.updateSettings(user.uid, updates);
        setSettings(updated);
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = MedalDexStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, [signedIn, user, handleSyncError]);

  if (user === undefined || loading || !settings) {
    return <div className="mdx-app"><div className="mdx-loading">Loading MedalDex…</div></div>;
  }

  const activeAccountId = settings.activeAccountId && accounts.some((a) => a.id === settings.activeAccountId)
    ? settings.activeAccountId
    : accounts[0]?.id ?? null;

  const setActiveAccountId = (accountId) => updateSettings({ activeAccountId: accountId });
  const activeFeature = FEATURES.find((f) => f.match(location.pathname)) || FEATURES[0];
  const subTabs = FEATURE_SUBTABS[activeFeature.key] || [];

  const contextValue = {
    accounts,
    dex,
    medals,
    settings,
    activeAccountId,
    signedIn,
    loading,
    toast,
    actions: {
      setSpeciesCategory,
      toggleSpeciesCategory,
      setMedalValue,
      updateSettings,
      setActiveAccountId,
      importProgress,
    },
  };

  return (
    <MedalDexContext.Provider value={contextValue}>
      <div className="mdx-app">
        <div className="mdx-grid-overlay" />
        <div className="mdx-orbs">
          <div className="mdx-orb" />
          <div className="mdx-orb" />
          <div className="mdx-orb" />
        </div>

        <header className="mdx-header">
          <h1 className="mdx-title">MedalDex</h1>
          <p className="mdx-subtitle">Pokédex &amp; Medal tracker</p>

          {accounts.length > 0 && (
            <div className="mdx-header-account">
              <MedalAccountSwitcher
                accounts={accounts}
                activeAccountId={activeAccountId}
                onSelect={setActiveAccountId}
              />
              <ProgressBackup />
            </div>
          )}

          {/* div, not nav — Navbar.css styles the bare nav element globally.
              Requirement #1: top-level Pokedex <-> Medals switch. These are
              two independent features presented side by side, not blended --
              each gets its own sub-nav row underneath (FEATURE_SUBTABS). */}
          <div className="mdx-feature-switch">
            {FEATURES.map((feature) => (
              <Link
                key={feature.key}
                to={feature.to}
                className={`mdx-feature-btn${feature.match(location.pathname) ? ' mdx-feature-btn-active' : ''}`}
              >
                {feature.label}
              </Link>
            ))}
          </div>

          <div className="mdx-tabs">
            {subTabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`mdx-tab${tab.match(location.pathname) ? ' mdx-tab-active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </header>

        {accounts.length === 0 ? (
          <div className="mdx-panel mdx-empty">
            No accounts yet — create one in <Link className="mdx-link" to="/pgo-tracker">PGO Tracker</Link>.
          </div>
        ) : (
          <Routes>
            <Route index element={<DexView />} />
            <Route path="forms" element={<FormsView />} />
            <Route path="species/:speciesId" element={<SpeciesDetail />} />
            <Route path="summary" element={<Summary />} />
            <Route path="medals" element={<Medals />} />
            <Route path="medals/bulk" element={<BulkUpdate />} />
            <Route path="*" element={<Navigate to="/medaldex" replace />} />
          </Routes>
        )}

        {toast && <div className={`mdx-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </MedalDexContext.Provider>
  );
}
