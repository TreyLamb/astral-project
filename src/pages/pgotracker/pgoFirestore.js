// PGO Tracker Firestore data layer — used only when signed in (see
// AuthContext). Mirrors pgoStorage.js's API shape 1:1, just persisted under
// users/{uid}/pgo_accounts/{accountId} (one doc per account, dashboard +
// inventory embedded) and users/{uid}/pgo_meta/settings (one small doc).
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { emptyStats, emptyInventory } from './pgoConfig';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function accountsRef(uidStr) {
  return collection(db, 'users', uidStr, 'pgo_accounts');
}
function settingsDocRef(uidStr) {
  return doc(db, 'users', uidStr, 'pgo_meta', 'settings');
}

function defaultSettings() {
  return { activeAccountId: null, activeView: 'dashboard', incrementStep: 1 };
}

export const PgoFirestore = {
  // No migration of any prior localStorage data, by explicit request —
  // signed-in users start with a single fresh "Trainer 1", same as a new guest.
  async seedIfEmpty(uidStr) {
    const existing = await getDocs(accountsRef(uidStr));
    if (!existing.empty) return;
    const first = { id: uid(), name: 'Trainer 1', dashboard: emptyStats(), inventory: emptyInventory() };
    await setDoc(doc(db, 'users', uidStr, 'pgo_accounts', first.id), first);
    await setDoc(settingsDocRef(uidStr), { ...defaultSettings(), activeAccountId: first.id });
  },

  async getAccounts(uidStr) {
    const snap = await getDocs(accountsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },

  async addAccount(uidStr, name, accountCountForDefaultName) {
    const account = {
      id: uid(),
      name: name || `Trainer ${accountCountForDefaultName + 1}`,
      dashboard: emptyStats(),
      inventory: emptyInventory(),
    };
    await setDoc(doc(db, 'users', uidStr, 'pgo_accounts', account.id), account);
    return account;
  },

  async renameAccount(uidStr, id, name) {
    await updateDoc(doc(db, 'users', uidStr, 'pgo_accounts', id), { name });
  },

  async removeAccount(uidStr, id) {
    await deleteDoc(doc(db, 'users', uidStr, 'pgo_accounts', id));
  },

  async updateDashboard(uidStr, id, currentDashboard, updates) {
    const dashboard = { ...currentDashboard, ...updates };
    await updateDoc(doc(db, 'users', uidStr, 'pgo_accounts', id), { dashboard });
    return dashboard;
  },

  async updateInventory(uidStr, id, currentInventory, updates) {
    const inventory = { ...currentInventory, ...updates };
    await updateDoc(doc(db, 'users', uidStr, 'pgo_accounts', id), { inventory });
    return inventory;
  },

  async resetDay(uidStr, id) {
    const dashboard = emptyStats();
    await updateDoc(doc(db, 'users', uidStr, 'pgo_accounts', id), { dashboard });
    return dashboard;
  },

  async getSettings(uidStr) {
    const snap = await getDoc(settingsDocRef(uidStr));
    return snap.exists() ? { ...defaultSettings(), ...snap.data() } : defaultSettings();
  },

  async updateSettings(uidStr, updates) {
    const current = await this.getSettings(uidStr);
    const merged = { ...current, ...updates };
    await setDoc(settingsDocRef(uidStr), merged);
    return merged;
  },
};
