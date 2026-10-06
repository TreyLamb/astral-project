// Trey's own coursework state — the part no LMS knows: what he has checked off, items he added
// himself, and the most recent school-feed pull (Canvas + Learning Suite, read through Google
// Calendar by MFT's calendar hub). One module-level store, so MFT's calendar, its School planner
// and TKB's chem pages all see the same state without a provider, and one sync serves all three.
//
// Persistence follows homeLayout.js: localStorage always (works signed out), mirrored to
// users/{uid}/prefs/coursework when signed in, so a check-off on the phone shows on the desktop.
// Merging is per key, last write wins — never "whole doc wins", which would let a stale tab
// resurrect an item he just ticked off on another device.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../../../../firebase';

const LS_KEY = 'astral_coursework_v1';
const CLOUD_DEBOUNCE_MS = 1500;

const empty = () => ({
  done: {},        // { [itemId]: { v: boolean, t: ms } }
  userItems: [],   // [{ id, code, name, kind, due, dueTime, opens, points, url, note, updatedAt, deleted? }]
  feeds: { canvas: [], ls: [], syncedAt: null, by: null },
});

function sanitize(s) {
  const e = empty();
  if (!s || typeof s !== 'object') return e;
  return {
    done: s.done && typeof s.done === 'object' ? s.done : e.done,
    userItems: Array.isArray(s.userItems) ? s.userItems : e.userItems,
    feeds: s.feeds && typeof s.feeds === 'object'
      ? { canvas: s.feeds.canvas ?? [], ls: s.feeds.ls ?? [], syncedAt: s.feeds.syncedAt ?? null, by: s.feeds.by ?? null }
      : e.feeds,
  };
}

/** Per-key merge: newer check-off wins, newer user item wins, newer feed pull wins. */
export function mergeStates(a, b) {
  const x = sanitize(a);
  const y = sanitize(b);
  const done = { ...x.done };
  for (const [id, m] of Object.entries(y.done)) {
    if (!done[id] || (m?.t ?? 0) > (done[id]?.t ?? 0)) done[id] = m;
  }
  const items = new Map(x.userItems.map((it) => [it.id, it]));
  for (const it of y.userItems) {
    const cur = items.get(it.id);
    if (!cur || (it.updatedAt ?? 0) > (cur.updatedAt ?? 0)) items.set(it.id, it);
  }
  const feeds = (y.feeds.syncedAt ?? 0) > (x.feeds.syncedAt ?? 0) ? y.feeds : x.feeds;
  return { done, userItems: [...items.values()], feeds };
}

function loadLocal() {
  try { return sanitize(JSON.parse(localStorage.getItem(LS_KEY))); } catch { return empty(); }
}

function saveLocal(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* private mode / quota */ }
}

let state = typeof localStorage === 'undefined' ? empty() : loadLocal();
let uid = null;
let cloudTimer = null;
const listeners = new Set();

const emit = () => { for (const fn of listeners) fn(); };

function cloudRef(u) { return doc(db, 'users', u, 'prefs', 'coursework'); }

function scheduleCloud() {
  if (!uid || !firebaseReady || !db) return;
  clearTimeout(cloudTimer);
  const who = uid;
  cloudTimer = setTimeout(() => {
    setDoc(cloudRef(who), state).catch((e) => console.error('coursework cloud save failed:', e));
  }, CLOUD_DEBOUNCE_MS);
}

function commit(next) {
  state = next;
  saveLocal(state);
  scheduleCloud();
  emit();
}

export const courseworkStore = {
  getState: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  /** Idempotent. Pulls the cloud copy once per user and merges it with whatever is local. */
  async attachUser(nextUid) {
    if (nextUid === uid) return;
    uid = nextUid || null;
    if (!uid || !firebaseReady || !db) return;
    try {
      const snap = await getDoc(cloudRef(uid));
      const merged = mergeStates(state, snap.exists() ? snap.data() : null);
      state = merged;
      saveLocal(state);
      emit();
      await setDoc(cloudRef(uid), state);
    } catch (e) {
      console.error('coursework cloud load failed:', e);
    }
  },

  setDone(id, v) {
    commit({ ...state, done: { ...state.done, [id]: { v: !!v, t: Date.now() } } });
  },

  /** Forget his override, falling back to whatever the LMS says. */
  clearDone(id) {
    // A tombstone, not a delete: deleting would let another device's older mark win the merge.
    commit({ ...state, done: { ...state.done, [id]: { v: null, t: Date.now() } } });
  },

  upsertUserItem(item) {
    const it = { ...item, id: item.id || `user:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, updatedAt: Date.now() };
    commit({ ...state, userItems: [...state.userItems.filter((x) => x.id !== it.id), it] });
    return it.id;
  },

  removeUserItem(id) {
    // Tombstoned for the same reason as clearDone.
    commit({ ...state, userItems: state.userItems.map((x) => (x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x)) });
  },

  /** A fresh school-feed pull from the calendar hub. */
  setFeeds({ canvas, ls, by }) {
    commit({ ...state, feeds: { canvas: canvas ?? [], ls: ls ?? [], syncedAt: Date.now(), by: by ?? null } });
  },
};
