// PGO Tracker localStorage data layer. Mirrors mymdbStorage.js's API shape
// (see src/pages/mymdb/mymdbStorage.js) so this can swap to Firestore later
// without rewriting call sites.
import { emptyStats, emptyInventory } from './pgoConfig';

const ACCOUNTS_KEY = 'pgo_accounts_v1';
const SETTINGS_KEY = 'pgo_settings_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
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
};
