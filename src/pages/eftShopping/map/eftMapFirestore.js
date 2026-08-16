// Cross-device sync for the user's own map waypoints.
//
//   users/{uid}/eft_waypoints/{id}
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

const ref = (uid) => collection(db, 'users', uid, 'eft_waypoints');
const docRef = (uid, id) => doc(db, 'users', uid, 'eft_waypoints', id);

const ready = (uid) => !!db && !!uid;

/** @returns {Promise<object[]>} every waypoint across every map, or [] */
export async function fetchWaypoints(uid) {
  if (!ready(uid)) return [];
  const snap = await getDocs(ref(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveWaypoint(uid, waypoint) {
  if (!ready(uid)) return;
  await setDoc(docRef(uid, waypoint.id), waypoint);
}

export async function deleteWaypoint(uid, id) {
  if (!ready(uid)) return;
  await deleteDoc(docRef(uid, id));
}

/**
 * Push a whole map's worth up at once — used the first time you sign in, so
 * points made while signed out are not stranded on that one machine.
 * Firestore batches cap at 500 writes; nobody has that many pins on one map,
 * but chunking costs one line.
 */
export async function pushWaypoints(uid, waypoints) {
  if (!ready(uid) || !waypoints.length) return;
  for (let i = 0; i < waypoints.length; i += 450) {
    const batch = writeBatch(db);
    for (const wp of waypoints.slice(i, i + 450)) batch.set(docRef(uid, wp.id), wp);
    await batch.commit();
  }
}

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
