import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { PgoStorage } from './pgoStorage';
import { PgoFirestore } from './pgoFirestore';
import AccountSwitcher from './AccountSwitcher';
import ViewTabs from './ViewTabs';
import MainDashboard from './MainDashboard';
import AccountDashboard from './AccountDashboard';
import InventoryView from './InventoryView';
import BulkView from './BulkView';
import './PgoTracker.css';

export default function PgoTracker() {
  const { user } = useAuth();
  const signedIn = !!user;

  const [accounts, setAccounts] = useState([]);
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
    console.error('PGO Tracker Firestore error:', err);
  }, [showToast]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        if (signedIn) {
          await PgoFirestore.seedIfEmpty(user.uid);
          const loadedAccounts = await PgoFirestore.getAccounts(user.uid);
          const homeSettings = await PgoFirestore.updateSettings(user.uid, {
            activeView: 'dashboard',
            activeAccountId: loadedAccounts[0]?.id ?? null,
          });
          if (cancelled) return;
          setAccounts(loadedAccounts);
          setSettings(homeSettings);
        } else {
          PgoStorage.seed();
          const loadedAccounts = PgoStorage.getAccounts();
          // Acc Dash on account 1 is always the landing screen — every fresh
          // load resets here regardless of whatever was open last session.
          const homeSettings = PgoStorage.updateSettings({
            activeView: 'dashboard',
            activeAccountId: loadedAccounts[0]?.id ?? null,
          });
          setAccounts(loadedAccounts);
          setSettings(homeSettings);
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

  if (loading || !settings) {
    return <div className="pgo-wrapper pgo-loading">Loading…</div>;
  }

  const activeAccount =
    accounts.find((a) => a.id === settings.activeAccountId) || accounts[0] || null;

  async function updateSettings(updates) {
    if (signedIn) {
      try {
        setSettings(await PgoFirestore.updateSettings(user.uid, updates));
      } catch (err) { handleSyncError(err); }
      return;
    }
    setSettings(PgoStorage.updateSettings(updates));
  }

  function handleSelectAccount(id) {
    updateSettings({ activeAccountId: id });
  }

  async function handleAddAccount() {
    if (signedIn) {
      try {
        const account = await PgoFirestore.addAccount(user.uid, undefined, accounts.length);
        setAccounts((prev) => [...prev, account]);
        updateSettings({ activeAccountId: account.id });
      } catch (err) { handleSyncError(err); }
      return;
    }
    const account = PgoStorage.addAccount();
    setAccounts(PgoStorage.getAccounts());
    updateSettings({ activeAccountId: account.id });
  }

  async function handleBumpStat(key, delta) {
    if (!activeAccount) return;
    const next = Math.max(0, activeAccount.dashboard[key] + delta);
    if (signedIn) {
      try {
        const dashboard = await PgoFirestore.updateDashboard(user.uid, activeAccount.id, activeAccount.dashboard, { [key]: next });
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, dashboard } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.updateDashboard(activeAccount.id, { [key]: next });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleToggleCheck(key) {
    if (!activeAccount) return;
    const nextVal = !activeAccount.dashboard[key];
    if (signedIn) {
      try {
        const dashboard = await PgoFirestore.updateDashboard(user.uid, activeAccount.id, activeAccount.dashboard, { [key]: nextVal });
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, dashboard } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.updateDashboard(activeAccount.id, { [key]: nextVal });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleResetDay() {
    if (!activeAccount) return;
    if (signedIn) {
      try {
        const dashboard = await PgoFirestore.resetDay(user.uid, activeAccount.id);
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, dashboard } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.resetDay(activeAccount.id);
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleBumpItem(key, delta) {
    if (!activeAccount) return;
    const next = Math.max(0, activeAccount.inventory[key] + delta);
    if (signedIn) {
      try {
        const inventory = await PgoFirestore.updateInventory(user.uid, activeAccount.id, activeAccount.inventory, { [key]: next });
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, inventory } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.updateInventory(activeAccount.id, { [key]: next });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleSetItem(key, value) {
    if (!activeAccount) return;
    if (signedIn) {
      try {
        const inventory = await PgoFirestore.updateInventory(user.uid, activeAccount.id, activeAccount.inventory, { [key]: value });
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, inventory } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.updateInventory(activeAccount.id, { [key]: value });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleBulkResearch(ids, value) {
    if (signedIn) {
      try {
        for (const id of ids) {
          const acc = accounts.find((a) => a.id === id);
          if (!acc) continue;
          const dashboard = await PgoFirestore.updateDashboard(user.uid, id, acc.dashboard, { research: value });
          setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, dashboard } : a)));
        }
      } catch (err) { handleSyncError(err); }
      return;
    }
    ids.forEach((id) => PgoStorage.updateDashboard(id, { research: value }));
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleBulkStat(ids, key, delta) {
    if (signedIn) {
      try {
        for (const id of ids) {
          const acc = accounts.find((a) => a.id === id);
          if (!acc) continue;
          const dashboard = await PgoFirestore.updateDashboard(user.uid, id, acc.dashboard, { [key]: Math.max(0, acc.dashboard[key] + delta) });
          setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, dashboard } : a)));
        }
      } catch (err) { handleSyncError(err); }
      return;
    }
    ids.forEach((id) => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;
      PgoStorage.updateDashboard(id, { [key]: Math.max(0, acc.dashboard[key] + delta) });
    });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleBulkInventory(ids, key, delta) {
    if (signedIn) {
      try {
        for (const id of ids) {
          const acc = accounts.find((a) => a.id === id);
          if (!acc) continue;
          const inventory = await PgoFirestore.updateInventory(user.uid, id, acc.inventory, { [key]: Math.max(0, acc.inventory[key] + delta) });
          setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, inventory } : a)));
        }
      } catch (err) { handleSyncError(err); }
      return;
    }
    ids.forEach((id) => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;
      PgoStorage.updateInventory(id, { [key]: Math.max(0, acc.inventory[key] + delta) });
    });
    setAccounts(PgoStorage.getAccounts());
  }

  return (
    <div className="pgo-wrapper">
      <div className="pgo-app">
        <header className="pgo-header">
          <div className="pgo-title-row">
            <div className="pgo-title-ball" />
            <h1>PGO Tracker</h1>
            <span className="pgo-sync-status" title={signedIn ? 'Synced to your account' : 'Only saved on this device — sign in (top nav) to sync'}>
              {signedIn ? '☁' : '📴'}
            </span>
          </div>
          <AccountSwitcher
            accounts={accounts}
            activeAccountId={activeAccount?.id}
            onSelect={handleSelectAccount}
            onAdd={handleAddAccount}
          />
          <ViewTabs activeView={settings.activeView} onChange={(v) => updateSettings({ activeView: v })} />
        </header>

        <main className="pgo-content">
          {settings.activeView === 'main' && <MainDashboard accounts={accounts} />}

          {settings.activeView === 'dashboard' && activeAccount && (
            <AccountDashboard
              account={activeAccount}
              onBumpRaids={(delta) => handleBumpStat('raids', delta)}
              onToggleCheck={handleToggleCheck}
              onResetDay={handleResetDay}
            />
          )}

          {settings.activeView === 'inventory' && activeAccount && (
            <InventoryView
              account={activeAccount}
              step={settings.incrementStep}
              onStepChange={(step) => updateSettings({ incrementStep: step })}
              onBump={handleBumpItem}
              onSet={handleSetItem}
            />
          )}

          {settings.activeView === 'bulk' && (
            <BulkView
              accounts={accounts}
              step={settings.incrementStep}
              onStepChange={(step) => updateSettings({ incrementStep: step })}
              onBulkResearch={handleBulkResearch}
              onBulkStat={handleBulkStat}
              onBulkInventory={handleBulkInventory}
            />
          )}
        </main>

        {toast && <div className={`pgo-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </div>
  );
}
