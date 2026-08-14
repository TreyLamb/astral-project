import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { PgoStorage } from './pgoStorage';
import { PgoFirestore } from './pgoFirestore';
import { clampInventoryValue } from './pgoConfig';
import AccountSwitcher from './AccountSwitcher';
import ViewTabs from './ViewTabs';
import MainDashboard from './MainDashboard';
import AccountDashboard from './AccountDashboard';
import InventoryView from './InventoryView';
import BulkView from './BulkView';
import PartiesView from './PartiesView';
import './PgoTracker.css';
import HubLink from '../../components/HubLink';

export default function PgoTracker() {
  const { user } = useAuth();
  const signedIn = !!user;

  const [accounts, setAccounts] = useState([]);
  const [parties, setParties] = useState([]);
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
    console.error('POGO Tracker Firestore error:', err);
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
          // Parties is newer/additive — a failure here (e.g. Firestore security rules not
          // yet covering the pgo_parties collection) must NOT block the rest of the app
          // from loading. Previously this was awaited inline with accounts/settings, so a
          // thrown error here jumped straight to the outer catch BEFORE setSettings ever
          // ran — loading flips to false but settings stays null forever, and the render
          // guard (`loading || !settings`) gets stuck showing "Loading…" permanently.
          try {
            setParties(await PgoFirestore.getParties(user.uid));
          } catch (err) {
            console.error('POGO Tracker: failed to load parties (non-fatal)', err);
          }
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
          try {
            setParties(PgoStorage.getParties());
          } catch (err) {
            console.error('POGO Tracker: failed to load parties (non-fatal)', err);
          }
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

  async function handleRenameAccount(id, name) {
    if (signedIn) {
      try {
        await PgoFirestore.renameAccount(user.uid, id, name);
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.renameAccount(id, name);
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
    const next = clampInventoryValue(key, activeAccount.inventory[key] + delta);
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
    const clamped = clampInventoryValue(key, value);
    if (signedIn) {
      try {
        const inventory = await PgoFirestore.updateInventory(user.uid, activeAccount.id, activeAccount.inventory, { [key]: clamped });
        setAccounts((prev) => prev.map((a) => (a.id === activeAccount.id ? { ...a, inventory } : a)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.updateInventory(activeAccount.id, { [key]: clamped });
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

  async function handleBulkInventory(ids, key, delta) {
    if (signedIn) {
      try {
        for (const id of ids) {
          const acc = accounts.find((a) => a.id === id);
          if (!acc) continue;
          const inventory = await PgoFirestore.updateInventory(user.uid, id, acc.inventory, { [key]: clampInventoryValue(key, acc.inventory[key] + delta) });
          setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, inventory } : a)));
        }
      } catch (err) { handleSyncError(err); }
      return;
    }
    ids.forEach((id) => {
      const acc = accounts.find((a) => a.id === id);
      if (!acc) return;
      PgoStorage.updateInventory(id, { [key]: clampInventoryValue(key, acc.inventory[key] + delta) });
    });
    setAccounts(PgoStorage.getAccounts());
  }

  async function handleAddParty(type) {
    const countOfType = parties.filter((p) => p.type === type).length;
    if (signedIn) {
      try {
        const party = await PgoFirestore.addParty(user.uid, type, undefined, countOfType);
        setParties((prev) => [...prev, party]);
      } catch (err) { handleSyncError(err); }
      return;
    }
    const party = PgoStorage.addParty(type);
    setParties(PgoStorage.getParties());
    return party;
  }

  async function handleRemoveParty(id) {
    if (signedIn) {
      try {
        await PgoFirestore.removeParty(user.uid, id);
        setParties((prev) => prev.filter((p) => p.id !== id));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.removeParty(id);
    setParties(PgoStorage.getParties());
  }

  async function handleRenameParty(id, name) {
    if (signedIn) {
      try {
        await PgoFirestore.renameParty(user.uid, id, name);
        setParties((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.renameParty(id, name);
    setParties(PgoStorage.getParties());
  }

  async function handleAddPartyMember(partyId, member) {
    if (signedIn) {
      try {
        const current = parties.find((p) => p.id === partyId);
        if (!current) return;
        const members = await PgoFirestore.addMember(user.uid, partyId, current.members, member);
        setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, members } : p)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.addMember(partyId, member);
    setParties(PgoStorage.getParties());
  }

  async function handleRemovePartyMember(partyId, memberId) {
    if (signedIn) {
      try {
        const current = parties.find((p) => p.id === partyId);
        if (!current) return;
        const members = await PgoFirestore.removeMember(user.uid, partyId, current.members, memberId);
        setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, members } : p)));
      } catch (err) { handleSyncError(err); }
      return;
    }
    PgoStorage.removeMember(partyId, memberId);
    setParties(PgoStorage.getParties());
  }

  return (
    <div className="pgo-wrapper">
      <div className="pgo-app">
        <header className="pgo-header">
          <div className="pgo-title-row">
            <HubLink className="pgo-site-home" />
            <div className="pgo-title-ball" />
            <h1>POGO Tracker</h1>
            <span className="pgo-sync-status" title={signedIn ? 'Synced to your account' : 'Only saved on this device — sign in (top nav) to sync'}>
              {signedIn ? '☁' : '📴'}
            </span>
          </div>
          <AccountSwitcher
            accounts={accounts}
            activeAccountId={activeAccount?.id}
            onSelect={handleSelectAccount}
            onAdd={handleAddAccount}
            onRename={handleRenameAccount}
          />
          <ViewTabs activeView={settings.activeView} onChange={(v) => updateSettings({ activeView: v })} />
        </header>

        <main className="pgo-content">
          {settings.activeView === 'main' && (
            <MainDashboard accounts={accounts} onBulkInventory={handleBulkInventory} />
          )}

          {settings.activeView === 'dashboard' && activeAccount && (
            <AccountDashboard
              account={activeAccount}
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
              onBulkInventory={handleBulkInventory}
            />
          )}

          {settings.activeView === 'parties' && (
            <PartiesView
              parties={parties}
              accounts={accounts}
              onAddParty={handleAddParty}
              onRemoveParty={handleRemoveParty}
              onRenameParty={handleRenameParty}
              onAddMember={handleAddPartyMember}
              onRemoveMember={handleRemovePartyMember}
            />
          )}
        </main>

        {toast && <div className={`pgo-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </div>
  );
}
