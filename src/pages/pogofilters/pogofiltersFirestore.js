// PogoFilters Firestore layer — used only when signed in (see AuthContext).
// Mirrors pogofiltersStorage.js's API 1:1, just with a leading uid.
//
// Paths:
//   users/{uid}/pogofilters_filters/{filterId}
//   users/{uid}/pogofilters_labels/{labelId}
//   users/{uid}/pogofilters_species/{dex}
//   users/{uid}/pogofilters_groups/{groupId}
//   users/{uid}/pogofilters_log/{entryId}
//   users/{uid}/pogofilters_sessions/{sessionId}
//   users/{uid}/pogofilters_meta/settings
//   users/{uid}/pogofilters_meta/snapshots
//
// setDoc everywhere rather than updateDoc, so a write is idempotent and a
// missing doc self-heals instead of throwing. No try/catch here by design —
// errors propagate to the context, which owns the toast (see PogoAccsApp.jsx).
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  withFilterDefaults, withLabelDefaults, withSpeciesDefaults,
  withGroupDefaults, withSettingsDefaults, uid as newId,
} from './pogofiltersConfig';

const col = (u, name) => collection(db, 'users', u, `pogofilters_${name}`);
const rec = (u, name, id) => doc(db, 'users', u, `pogofilters_${name}`, String(id));
const settingsRef = (u) => doc(db, 'users', u, 'pogofilters_meta', 'settings');
const snapshotsRef = (u) => doc(db, 'users', u, 'pogofilters_meta', 'snapshots');

// Firestore caps a batch at 500 ops.
const BATCH_CHUNK = 450;

export const PogoFiltersFirestore = {
  // Creates the settings doc if missing. Doubles as the security-rules write
  // probe on first signed-in load — if rules aren't open to this uid for
  // pogofilters_*, this throws before anything else runs.
  async ensureSettings(u) {
    const snap = await getDoc(settingsRef(u));
    if (snap.exists()) return withSettingsDefaults(snap.data());
    const settings = withSettingsDefaults({});
    await setDoc(settingsRef(u), settings);
    return settings;
  },

  // ---- filters ----
  async getFilters(u) {
    const snap = await getDocs(col(u, 'filters'));
    return snap.docs.map((d) => withFilterDefaults(d.data()));
  },
  async saveFilter(u, f) {
    const next = withFilterDefaults({ ...f, updatedAt: Date.now() });
    await setDoc(rec(u, 'filters', next.id), next);
    return next;
  },
  // Bulk write. Used by the apply engine, bulk edit and seeding, so a
  // many-filter change is one batched round trip rather than N writes.
  async replaceFilters(u, list) {
    const next = list.map(withFilterDefaults);
    const existing = await getDocs(col(u, 'filters'));
    const keep = new Set(next.map((f) => f.id));

    const ops = [
      ...existing.docs.filter((d) => !keep.has(d.id)).map((d) => ({ kind: 'del', ref: d.ref })),
      ...next.map((f) => ({ kind: 'set', ref: rec(u, 'filters', f.id), data: f })),
    ];
    for (let i = 0; i < ops.length; i += BATCH_CHUNK) {
      const batch = writeBatch(db);
      for (const op of ops.slice(i, i + BATCH_CHUNK)) {
        if (op.kind === 'del') batch.delete(op.ref); else batch.set(op.ref, op.data);
      }
      await batch.commit();
    }
    return next;
  },
  async removeFilter(u, id) {
    await deleteDoc(rec(u, 'filters', id));
  },

  // ---- labels ----
  async getLabels(u) {
    const snap = await getDocs(col(u, 'labels'));
    return snap.docs.map((d, i) => withLabelDefaults(d.data(), i));
  },
  async saveLabel(u, l) {
    const next = withLabelDefaults(l);
    await setDoc(rec(u, 'labels', next.id), next);
    return next;
  },
  async replaceLabels(u, list) {
    const next = list.map((l, i) => withLabelDefaults(l, i));
    const batch = writeBatch(db);
    next.forEach((l) => batch.set(rec(u, 'labels', l.id), l));
    await batch.commit();
    return next;
  },
  async removeLabel(u, id) {
    await deleteDoc(rec(u, 'labels', id));
  },

  // ---- species assignments (doc id = dex) ----
  async getSpecies(u) {
    const snap = await getDocs(col(u, 'species'));
    const out = {};
    snap.docs.forEach((d) => { out[d.id] = withSpeciesDefaults(d.data()); });
    return out;
  },
  async saveSpecies(u, entry) {
    const next = withSpeciesDefaults({ ...entry, updatedAt: Date.now() });
    await setDoc(rec(u, 'species', next.dex), next);
    return next;
  },
  async saveSpeciesBulk(u, entries) {
    const out = {};
    for (let i = 0; i < entries.length; i += BATCH_CHUNK) {
      const batch = writeBatch(db);
      for (const e of entries.slice(i, i + BATCH_CHUNK)) {
        const next = withSpeciesDefaults({ ...e, updatedAt: Date.now() });
        out[next.dex] = next;
        batch.set(rec(u, 'species', next.dex), next);
      }
      await batch.commit();
    }
    return out;
  },

  // ---- groups ----
  async getGroups(u) {
    const snap = await getDocs(col(u, 'groups'));
    return snap.docs.map((d) => withGroupDefaults(d.data()));
  },
  async saveGroup(u, g) {
    const next = withGroupDefaults(g);
    await setDoc(rec(u, 'groups', next.id), next);
    return next;
  },
  async removeGroup(u, id) {
    await deleteDoc(rec(u, 'groups', id));
  },

  // ---- settings ----
  async getSettings(u) {
    const snap = await getDoc(settingsRef(u));
    return withSettingsDefaults(snap.exists() ? snap.data() : {});
  },
  async updateSettings(u, updates) {
    const next = withSettingsDefaults({ ...(await this.getSettings(u)), ...updates });
    await setDoc(settingsRef(u), next);
    return next;
  },

  // ---- sort log ----
  async getLog(u) {
    const snap = await getDocs(col(u, 'log'));
    return snap.docs.map((d) => d.data()).sort((a, b) => b.ts - a.ts);
  },
  async addLogEntry(u, entry) {
    const e = { ...entry, id: entry.id || newId(), ts: entry.ts || Date.now() };
    await setDoc(rec(u, 'log', e.id), e);
    return e;
  },
  async saveLogEntry(u, entry) {
    await setDoc(rec(u, 'log', entry.id), entry);
    return entry;
  },
  async removeLogEntry(u, id) {
    await deleteDoc(rec(u, 'log', id));
  },
  async getSessions(u) {
    const snap = await getDocs(col(u, 'sessions'));
    return snap.docs.map((d) => d.data()).sort((a, b) => b.startedAt - a.startedAt);
  },
  async saveSession(u, s) {
    await setDoc(rec(u, 'sessions', s.id), s);
    return s;
  },

  // ---- undo snapshots ----
  // A single doc holding a capped stack, not a collection — snapshots are only
  // ever read as "the most recent one", and one doc keeps the write cheap.
  async getSnapshots(u) {
    const snap = await getDoc(snapshotsRef(u));
    return snap.exists() ? (snap.data().stack || []) : [];
  },
  async pushSnapshot(u, snapshot) {
    const stack = await this.getSnapshots(u);
    const entry = { ...snapshot, id: snapshot.id || newId(), ts: snapshot.ts || Date.now() };
    await setDoc(snapshotsRef(u), { stack: [entry, ...stack].slice(0, 10) });
    return entry;
  },
  async popSnapshot(u) {
    const stack = await this.getSnapshots(u);
    const top = stack[0] || null;
    await setDoc(snapshotsRef(u), { stack: stack.slice(1) });
    return top;
  },
};
