// Orbit Firestore layer — used when signed in (see orbitContext.js). Unlike
// fitnessFirestore.js (localStorage-primary, Firestore is the extra), Orbit
// is Firestore-PRIMARY: this is the source of truth, and orbitStorage.js is
// an offline mirror kept in sync via replaceAll() + the write-coalescing
// flush() below. Paths:
//   users/{uid}/orbit_areas/{id}
//   users/{uid}/orbit_projects/{id}
//   users/{uid}/orbit_tasks/{id}
//   users/{uid}/orbit_inbox/{id}
//   users/{uid}/orbit_meta/settings   (single doc)
import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { withSettingsDefaults } from './orbitConfig';

// Firestore write batches cap at 500 operations — chunk with headroom.
const BATCH_CHUNK_SIZE = 450;
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function areasRef(uid) { return collection(db, 'users', uid, 'orbit_areas'); }
function areaDocRef(uid, id) { return doc(db, 'users', uid, 'orbit_areas', id); }
function projectsRef(uid) { return collection(db, 'users', uid, 'orbit_projects'); }
function projectDocRef(uid, id) { return doc(db, 'users', uid, 'orbit_projects', id); }
function tasksRef(uid) { return collection(db, 'users', uid, 'orbit_tasks'); }
function taskDocRef(uid, id) { return doc(db, 'users', uid, 'orbit_tasks', id); }
function inboxRef(uid) { return collection(db, 'users', uid, 'orbit_inbox'); }
function inboxDocRef(uid, id) { return doc(db, 'users', uid, 'orbit_inbox', id); }
function settingsDocRef(uid) { return doc(db, 'users', uid, 'orbit_meta', 'settings'); }

export const OrbitFirestore = {
  async getAreas(uid) {
    const snap = await getDocs(areasRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveArea(uid, a) {
    await setDoc(areaDocRef(uid, a.id), a);
    return a;
  },

  async updateArea(uid, id, updates) {
    const snap = await getDoc(areaDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates };
    await setDoc(areaDocRef(uid, id), next);
    return next;
  },

  async removeArea(uid, id) {
    await deleteDoc(areaDocRef(uid, id));
  },

  // Raw docs — normalization via with*Defaults happens once, uniformly for
  // both backends, in orbitContext.js's load effect.
  async getProjects(uid) {
    const snap = await getDocs(projectsRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveProject(uid, p) {
    await setDoc(projectDocRef(uid, p.id), p);
    return p;
  },

  async updateProject(uid, id, updates) {
    const snap = await getDoc(projectDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates, updatedAt: Date.now() };
    await setDoc(projectDocRef(uid, id), next);
    return next;
  },

  async removeProject(uid, id) {
    await deleteDoc(projectDocRef(uid, id));
  },

  async getTasks(uid) {
    const snap = await getDocs(tasksRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveTask(uid, t) {
    await setDoc(taskDocRef(uid, t.id), t);
    return t;
  },

  async updateTask(uid, id, updates) {
    const snap = await getDoc(taskDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates };
    await setDoc(taskDocRef(uid, id), next);
    return next;
  },

  async removeTask(uid, id) {
    await deleteDoc(taskDocRef(uid, id));
  },

  async getInbox(uid) {
    const snap = await getDocs(inboxRef(uid));
    return snap.docs.map((d) => d.data());
  },

  async saveInboxItem(uid, i) {
    await setDoc(inboxDocRef(uid, i.id), i);
    return i;
  },

  async updateInboxItem(uid, id, updates) {
    const snap = await getDoc(inboxDocRef(uid, id));
    const current = snap.exists() ? snap.data() : { id };
    const next = { ...current, ...updates };
    await setDoc(inboxDocRef(uid, id), next);
    return next;
  },

  async removeInboxItem(uid, id) {
    await deleteDoc(inboxDocRef(uid, id));
  },

  async getSettings(uid) {
    const snap = await getDoc(settingsDocRef(uid));
    return withSettingsDefaults(snap.exists() ? snap.data() : null);
  },

  async updateSettings(uid, updates) {
    const cur = await this.getSettings(uid);
    const next = withSettingsDefaults({ ...cur, ...updates });
    await setDoc(settingsDocRef(uid), next);
    return next;
  },

  // Write-coalescing batch commit — the whole reason Orbit doesn't write to
  // Firestore per-mutation. `upserts`/`deletes` group ops by collection so
  // callers (orbitContext's scheduleFlush) can build them straight from
  // React state without per-doc round trips. Empty groups are skipped;
  // remaining ops are chunked (Firestore's 500-op batch cap) and committed
  // sequentially. setDoc is idempotent, so if a later chunk throws,
  // orbitContext just leaves everything dirty and resends the whole set
  // (including already-committed docs) on the next flush.
  async flush(uid, { upserts = {}, deletes = {} } = {}) {
    const refFns = {
      areas: areaDocRef, projects: projectDocRef, tasks: taskDocRef, inbox: inboxDocRef,
    };

    const ops = [];
    for (const [col, docs] of Object.entries(upserts)) {
      if (col === 'settings') continue;
      if (!Array.isArray(docs) || docs.length === 0) continue;
      const refFn = refFns[col];
      if (!refFn) continue;
      for (const d of docs) ops.push({ type: 'set', ref: refFn(uid, d.id), data: d });
    }
    if (upserts.settings) {
      ops.push({ type: 'set', ref: settingsDocRef(uid), data: withSettingsDefaults(upserts.settings) });
    }
    for (const [col, ids] of Object.entries(deletes)) {
      if (!Array.isArray(ids) || ids.length === 0) continue;
      const refFn = refFns[col];
      if (!refFn) continue;
      for (const id of ids) ops.push({ type: 'delete', ref: refFn(uid, id) });
    }

    for (const group of chunk(ops, BATCH_CHUNK_SIZE)) {
      const batch = writeBatch(db);
      group.forEach((op) => {
        if (op.type === 'delete') batch.delete(op.ref);
        else batch.set(op.ref, op.data);
      });
      await batch.commit();
    }
  },
};
