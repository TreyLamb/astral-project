// Cross-device sync for the user's own map data — waypoints, and the saved
// route library.
//
//   users/{uid}/eft_waypoints/{id}
//   users/{uid}/eft_routes/{id}
//
// One flat collection rather than a doc per map, because a waypoint carries its
// own `mapKey` and the common read is "everything of mine" on sign-in.
//
// localStorage stays the primary copy (MapStore.getWaypoints), same as every
// other slice of this tool — the map has always worked signed out and still
// does. This is the extra that makes a point placed on the desktop show up on
// the laptop, so every call is a no-op without a signed-in user or Firebase.

import {
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase';

const ready = (uid) => !!db && !!uid;

/**
 * Both collections are the same shape — a flat list of id-bearing documents
 * under the user — so they share one set of operations rather than two
 * identical copies that can drift apart.
 */
function syncedCollection(name) {
  const ref = (uid) => collection(db, 'users', uid, name);
  const docRef = (uid, id) => doc(db, 'users', uid, name, id);

  return {
    /** @returns {Promise<object[]>} everything of the user's, or [] */
    fetchAll: async (uid) => {
      if (!ready(uid)) return [];
      const snap = await getDocs(ref(uid));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    save: async (uid, row) => {
      if (!ready(uid)) return;
      await setDoc(docRef(uid, row.id), row);
    },
    remove: async (uid, id) => {
      if (!ready(uid)) return;
      await deleteDoc(docRef(uid, id));
    },
    /**
     * Push a batch up at once — used the first time you sign in, so anything
     * made while signed out is not stranded on that one machine. Firestore
     * batches cap at 500 writes; nobody has that many, but chunking is a line.
     */
    pushAll: async (uid, rows) => {
      if (!ready(uid) || !rows.length) return;
      for (let i = 0; i < rows.length; i += 450) {
        const batch = writeBatch(db);
        for (const row of rows.slice(i, i + 450)) batch.set(docRef(uid, row.id), row);
        await batch.commit();
      }
    },
  };
}

const waypointSync = syncedCollection('eft_waypoints');
const routeSync = syncedCollection('eft_routes');

export const fetchWaypoints = waypointSync.fetchAll;
export const saveWaypoint = waypointSync.save;
export const deleteWaypoint = waypointSync.remove;
export const pushWaypoints = waypointSync.pushAll;

export const fetchSavedRoutes = routeSync.fetchAll;
export const saveSavedRoute = routeSync.save;
export const deleteSavedRoute = routeSync.remove;
export const pushSavedRoutes = routeSync.pushAll;

/**
 * Last edit wins, per waypoint id.
 *
 * Two devices editing the same pin is not a real scenario here (it is one
 * person), so a full CRDT would be ceremony. What IS real is a pin made offline
 * on one machine and a different pin made on another — a union keyed by id
 * keeps both, which a naive "server wins" would not.
 */
export function mergeWaypoints(local, remote) {
  const byId = new Map();
  for (const wp of [...(local || []), ...(remote || [])]) {
    const prev = byId.get(wp.id);
    if (!prev || (wp.updatedAt || 0) >= (prev.updatedAt || 0)) byId.set(wp.id, wp);
  }
  return [...byId.values()];
}
