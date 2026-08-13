// DLAB Trainer Firestore layer — used only when signed in (see dlabContext.js).
// Mirrors DlabStorage's API 1:1, persisted per-user under
//   users/{uid}/dlab_results/{resultId}     (one doc per test result)
//   users/{uid}/dlab_meta/settings          (single settings doc)
//   users/{uid}/dlab_meta/recentParams      (single doc, shape { vectors: [...] })
// Same per-user collection pattern as fitnessFirestore.js / pgoFirestore.js.
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { withSettingsDefaults, MAX_RESULTS, MAX_RECENT_PARAMS } from './dlabStorage';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function resultsRef(uidStr) { return collection(db, 'users', uidStr, 'dlab_results'); }
function resultDocRef(uidStr, id) { return doc(db, 'users', uidStr, 'dlab_results', id); }
function settingsDocRef(uidStr) { return doc(db, 'users', uidStr, 'dlab_meta', 'settings'); }
function recentParamsDocRef(uidStr) { return doc(db, 'users', uidStr, 'dlab_meta', 'recentParams'); }

export const DlabFirestore = {
  async getResults(uidStr) {
    const snap = await getDocs(resultsRef(uidStr));
    return snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt - a.createdAt);
  },

  async getResult(uidStr, id) {
    const snap = await getDoc(resultDocRef(uidStr, id));
    return snap.exists() ? snap.data() : null;
  },

  async saveResult(uidStr, result) {
    const record = { ...result, id: result.id ?? uid(), createdAt: result.createdAt ?? Date.now() };
    await setDoc(resultDocRef(uidStr, record.id), record);

    // Cloud copy can't rely on localStorage's array-truncate-on-write trick, so
    // enforce MAX_RESULTS here by deleting whatever's fallen off the newest-first end.
    const all = await this.getResults(uidStr);
    if (all.length > MAX_RESULTS) {
      const overflow = all.slice(MAX_RESULTS);
      await Promise.all(overflow.map((r) => deleteDoc(resultDocRef(uidStr, r.id))));
    }
    return record;
  },

  async updateResult(uidStr, id, updates) {
    const snap = await getDoc(resultDocRef(uidStr, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates, updatedAt: Date.now() };
    await setDoc(resultDocRef(uidStr, id), next);
    return next;
  },

  async removeResult(uidStr, id) {
    await deleteDoc(resultDocRef(uidStr, id));
  },

  async getSettings(uidStr) {
    const snap = await getDoc(settingsDocRef(uidStr));
    return withSettingsDefaults(snap.exists() ? snap.data() : null);
  },

  async updateSettings(uidStr, updates) {
    const cur = await this.getSettings(uidStr);
    const next = withSettingsDefaults({ ...cur, ...updates });
    await setDoc(settingsDocRef(uidStr), next);
    return next;
  },

  async getRecentParams(uidStr) {
    const snap = await getDoc(recentParamsDocRef(uidStr));
    return snap.exists() ? (snap.data().vectors ?? []) : [];
  },

  async pushRecentParams(uidStr, vector) {
    const current = await this.getRecentParams(uidStr);
    const next = [...current, vector];
    if (next.length > MAX_RECENT_PARAMS) next.splice(0, next.length - MAX_RECENT_PARAMS);
    await setDoc(recentParamsDocRef(uidStr), { vectors: next });
    return next;
  },

  // Loop deleteDoc rather than a writeBatch — MAX_RESULTS caps this collection at
  // 100 docs, well under the 500-op batch limit, so batching wouldn't earn its keep.
  async clearHistory(uidStr) {
    const snap = await getDocs(resultsRef(uidStr));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },
};
