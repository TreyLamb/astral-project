// POGO Accs Firestore data layer — used only when signed in (see
// AuthContext). Mirrors pogoaccsStorage.js's API shape 1:1, just persisted
// under users/{uid}/pogoaccs_boxes/{accountId}, users/{uid}/pogoaccs_megas/{accountId},
// users/{uid}/pogoaccs_groups/{groupId} and users/{uid}/pogoaccs_meta/settings.
// Accounts themselves live in POGO Tracker's own collections (pgoFirestore.js)
// — this module never reads or writes them.
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uid, withEntryDefaults, emptyBox, withMegasDefaults } from './pogoaccsConfig';

function boxesRef(uidStr) {
  return collection(db, 'users', uidStr, 'pogoaccs_boxes');
}
function boxDocRef(uidStr, accountId) {
  return doc(db, 'users', uidStr, 'pogoaccs_boxes', accountId);
}
function megasRef(uidStr) {
  return collection(db, 'users', uidStr, 'pogoaccs_megas');
}
function megasDocRef(uidStr, accountId) {
  return doc(db, 'users', uidStr, 'pogoaccs_megas', accountId);
}
function groupsRef(uidStr) {
  return collection(db, 'users', uidStr, 'pogoaccs_groups');
}
function groupDocRef(uidStr, groupId) {
  return doc(db, 'users', uidStr, 'pogoaccs_groups', groupId);
}
function settingsDocRef(uidStr) {
  return doc(db, 'users', uidStr, 'pogoaccs_meta', 'settings');
}

function defaultSettings() {
  return { activeAccountId: null };
}

export const PogoAccsFirestore = {
  // Creates the settings doc if missing. This doubles as the security-rules
  // write probe on first signed-in load — if rules aren't open to this uid
  // yet, this throws before anything else runs. No other seeding: empty
  // boxes/megas/groups are the valid zero state, nothing to create for them.
  async ensureSettings(uidStr) {
    const snap = await getDoc(settingsDocRef(uidStr));
    if (snap.exists()) return { ...defaultSettings(), ...snap.data() };
    const settings = defaultSettings();
    await setDoc(settingsDocRef(uidStr), settings);
    return settings;
  },

  async getBoxes(uidStr) {
    const snap = await getDocs(boxesRef(uidStr));
    const boxes = {};
    snap.docs.forEach((d) => { boxes[d.id] = d.data(); });
    return boxes;
  },

  async getBox(uidStr, accountId) {
    const snap = await getDoc(boxDocRef(uidStr, accountId));
    const box = snap.exists() ? snap.data() : emptyBox(accountId);
    return { ...box, entries: (box.entries || []).map(withEntryDefaults) };
  },

  async setBoxEntries(uidStr, accountId, entries) {
    const box = { accountId, entries: entries.map(withEntryDefaults) };
    await setDoc(boxDocRef(uidStr, accountId), box);
    return box;
  },

  async addEntries(uidStr, accountId, newEntries) {
    const current = await this.getBox(uidStr, accountId);
    const added = newEntries.map(withEntryDefaults);
    const box = { accountId, entries: [...current.entries, ...added] };
    await setDoc(boxDocRef(uidStr, accountId), box);
    return box;
  },

  async getMegas(uidStr) {
    const snap = await getDocs(megasRef(uidStr));
    const megas = {};
    snap.docs.forEach((d) => { megas[d.id] = d.data(); });
    return megas;
  },

  // cell = { count, megaLevel }. Passing count 0 (or no cell) removes the
  // key entirely rather than storing a zero — same rule as pogoaccsStorage.js.
  async setMegaCell(uidStr, accountId, megaId, cell) {
    const snap = await getDoc(megasDocRef(uidStr, accountId));
    const current = withMegasDefaults(snap.exists() ? snap.data() : undefined, accountId);
    const nextMegas = { ...current.megas };
    if (!cell || cell.count <= 0) {
      delete nextMegas[megaId];
    } else {
      nextMegas[megaId] = cell;
    }
    const next = { ...current, megas: nextMegas };
    await setDoc(megasDocRef(uidStr, accountId), next);
    return next;
  },

  async getGroups(uidStr) {
    const snap = await getDocs(groupsRef(uidStr));
    return snap.docs.map((d) => d.data());
  },

  async addGroup(uidStr, name) {
    const existing = await getDocs(groupsRef(uidStr));
    const group = { id: uid(), name: name || `Group ${existing.size + 1}`, memberAccountIds: [] };
    await setDoc(groupDocRef(uidStr, group.id), group);
    return group;
  },

  async renameGroup(uidStr, id, name) {
    await updateDoc(groupDocRef(uidStr, id), { name });
  },

  async removeGroup(uidStr, id) {
    await deleteDoc(groupDocRef(uidStr, id));
  },

  async setGroupMembers(uidStr, id, memberAccountIds) {
    await updateDoc(groupDocRef(uidStr, id), { memberAccountIds });
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
