// POGO Tracker localStorage data layer. Mirrors mymdbStorage.js's API shape
// (see src/pages/mymdb/mymdbStorage.js) so this can swap to Firestore later
// without rewriting call sites.
import { emptyStats, emptyInventory } from './pgoConfig';

const ACCOUNTS_KEY = 'pgo_accounts_v1';
const SETTINGS_KEY = 'pgo_settings_v1';
const PARTIES_KEY = 'pgo_parties_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Backfills any dashboard/inventory keys added to pgoConfig after an account
// was first created (e.g. the raid pass items) — stored values always win,
// this only fills in what's genuinely missing so it never shows "undefined".
function withDefaults(account) {
  return {
    ...account,
    dashboard: { ...emptyStats(), ...account.dashboard },
    inventory: { ...emptyInventory(), ...account.inventory },
  };
}

function loadAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    return accounts.map(withDefaults);
  } catch {
    return [];
  }
}

function storeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function defaultSettings() {
  return { activeAccountId: null, activeView: 'dashboard', incrementStep: 1 };
}

function loadSettings() {
  try {
    return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return defaultSettings();
  }
}

function storeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadParties() {
  try {
    return JSON.parse(localStorage.getItem(PARTIES_KEY)) || [];
  } catch {
    return [];
  }
}

function storeParties(parties) {
  localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
}

// Guest numbering is per-group and assigned once at add time (based on how many guest
// slots already exist in THIS group) — it does not renumber when an earlier guest is
// removed, so "Guest 1, Guest 3" with a gap is expected if Guest 2 was removed, not a bug.
function nextGuestLabel(members) {
  const guestCount = members.filter((m) => m.guestLabel).length;
  return `Guest ${guestCount + 1}`;
}

export const PgoStorage = {
  seed() {
    if (!localStorage.getItem(ACCOUNTS_KEY)) {
      const first = {
        id: uid(),
        name: 'Trainer 1',
        dashboard: emptyStats(),
        inventory: emptyInventory(),
      };
      storeAccounts([first]);
      storeSettings({ ...defaultSettings(), activeAccountId: first.id });
    }
  },

  getAccounts() {
    return loadAccounts();
  },

  getAccount(id) {
    return loadAccounts().find((a) => a.id === id) || null;
  },

  addAccount(name) {
    const accounts = loadAccounts();
    const account = {
      id: uid(),
      name: name || `Trainer ${accounts.length + 1}`,
      dashboard: emptyStats(),
      inventory: emptyInventory(),
    };
    accounts.push(account);
    storeAccounts(accounts);
    return account;
  },

  renameAccount(id, name) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    accounts[idx] = { ...accounts[idx], name };
    storeAccounts(accounts);
    return accounts[idx];
  },

  removeAccount(id) {
    storeAccounts(loadAccounts().filter((a) => a.id !== id));
  },

  updateDashboard(id, updates) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    accounts[idx] = { ...accounts[idx], dashboard: { ...accounts[idx].dashboard, ...updates } };
    storeAccounts(accounts);
    return accounts[idx];
  },

  updateInventory(id, updates) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    accounts[idx] = { ...accounts[idx], inventory: { ...accounts[idx].inventory, ...updates } };
    storeAccounts(accounts);
    return accounts[idx];
  },

  resetDay(id) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    accounts[idx] = { ...accounts[idx], dashboard: emptyStats() };
    storeAccounts(accounts);
    return accounts[idx];
  },

  getSettings() {
    return loadSettings();
  },

  updateSettings(updates) {
    const settings = { ...loadSettings(), ...updates };
    storeSettings(settings);
    return settings;
  },

  // Parties (Raid Parties / Gym Parties) — a "party" is a named group of members, each
  // member either a real account (accountId, display name looked up live so a rename
  // propagates) or a guest (guestLabel, "Guest N"). Same shape/logic for both raid and
  // gym parties, distinguished only by the `type` field — filtered client-side.
  getParties() {
    return loadParties();
  },

  addParty(type, name) {
    const parties = loadParties();
    const countOfType = parties.filter((p) => p.type === type).length;
    const party = { id: uid(), type, name: name || `Group ${countOfType + 1}`, members: [] };
    parties.push(party);
    storeParties(parties);
    return party;
  },

  removeParty(id) {
    storeParties(loadParties().filter((p) => p.id !== id));
  },

  renameParty(id, name) {
    const parties = loadParties();
    const idx = parties.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    parties[idx] = { ...parties[idx], name };
    storeParties(parties);
    return parties[idx];
  },

  // member: { accountId } to add a real account, or {} / omitted to add a guest.
  addMember(partyId, member = {}) {
    const parties = loadParties();
    const idx = parties.findIndex((p) => p.id === partyId);
    if (idx === -1) return null;
    const newMember = member.accountId
      ? { id: uid(), accountId: member.accountId, guestLabel: null }
      : { id: uid(), accountId: null, guestLabel: nextGuestLabel(parties[idx].members) };
    parties[idx] = { ...parties[idx], members: [...parties[idx].members, newMember] };
    storeParties(parties);
    return parties[idx];
  },

  removeMember(partyId, memberId) {
    const parties = loadParties();
    const idx = parties.findIndex((p) => p.id === partyId);
    if (idx === -1) return null;
    parties[idx] = { ...parties[idx], members: parties[idx].members.filter((m) => m.id !== memberId) };
    storeParties(parties);
    return parties[idx];
  },
};
