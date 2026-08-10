// POGO Tracker Firestore data layer — used only when signed in (see
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
function partiesRef(uidStr) {
  return collection(db, 'users', uidStr, 'pgo_parties');
}

// Same rule as pgoStorage.js: guest numbers are assigned once at add time from the
// current guest count in that group, and don't renumber when an earlier guest is removed.
function nextGuestLabel(members) {
  const guestCount = members.filter((m) => m.guestLabel).length;
  return `Guest ${guestCount + 1}`;
}

function defaultSettings() {
  return { activeAccountId: null, activeView: 'dashboard', incrementStep: 1 };
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
    return snap.docs.map((d) => withDefaults(d.data()));
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

  // Parties — mirrors pgoStorage.js's API 1:1, one doc per party under pgo_parties/{id},
  // same shape (id, type, name, members[]) as the localStorage version.
  async getParties(uidStr) {
    const snap = await getDocs(partiesRef(uidStr));
    return snap.docs.map((d) => d.data());
  },

  async addParty(uidStr, type, name, countOfTypeForDefaultName) {
    const party = { id: uid(), type, name: name || `Group ${countOfTypeForDefaultName + 1}`, members: [] };
    await setDoc(doc(db, 'users', uidStr, 'pgo_parties', party.id), party);
    return party;
  },

  async removeParty(uidStr, id) {
    await deleteDoc(doc(db, 'users', uidStr, 'pgo_parties', id));
  },

  async renameParty(uidStr, id, name) {
    await updateDoc(doc(db, 'users', uidStr, 'pgo_parties', id), { name });
  },

  async addMember(uidStr, id, currentMembers, member = {}) {
    const newMember = member.accountId
      ? { id: uid(), accountId: member.accountId, guestLabel: null }
      : { id: uid(), accountId: null, guestLabel: nextGuestLabel(currentMembers) };
    const members = [...currentMembers, newMember];
    await updateDoc(doc(db, 'users', uidStr, 'pgo_parties', id), { members });
    return members;
  },

  async removeMember(uidStr, id, currentMembers, memberId) {
    const members = currentMembers.filter((m) => m.id !== memberId);
    await updateDoc(doc(db, 'users', uidStr, 'pgo_parties', id), { members });
    return members;
  },
};
