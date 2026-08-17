// Storage for the editable Documents tab, following src/homeLayout.js.
//
// Always written to localStorage, so editing works fully signed-out and
// offline. When signed in it ALSO mirrors to users/{uid}/prefs/ttNotes so the
// document follows you between devices — that cross-device case is the whole
// point of making it editable rather than just rendering the committed file.
//
// notes.md stays in the repo as the SEED: it is what you get before you have
// ever edited, and what "Reset to the committed file" returns you to. Once a
// saved copy exists it wins, because the file only changes on a deploy.
//
// Shape: { text: string, updatedAt: number }
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../../firebase';

const LS_KEY = 'tt-notes-v1';

export function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.text !== 'string') return null;
  const updatedAt = Number(raw.updatedAt);
  return { text: raw.text, updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0 };
}

export function loadLocal() {
  try { return sanitize(JSON.parse(localStorage.getItem(LS_KEY))); }
  catch { return null; }
}

export function saveLocal(entry) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entry)); }
  catch { /* private mode / quota — local persistence just doesn't happen */ }
}

export function clearLocal() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

function cloudRef(uid) { return doc(db, 'users', uid, 'prefs', 'ttNotes'); }

export async function loadCloud(uid) {
  if (!firebaseReady || !db || !uid) return null;
  const snap = await getDoc(cloudRef(uid));
  return snap.exists() ? sanitize(snap.data()) : null;
}

export async function saveCloud(uid, entry) {
  if (!firebaseReady || !db || !uid) return false;
  await setDoc(cloudRef(uid), entry);
  return true;
}

// Last-write-wins by timestamp, same rule homeLayout uses. Two devices editing
// the same document while both offline is the one case this cannot resolve —
// the later save replaces the earlier, which is why the toolbar always shows
// where the copy you are looking at came from.
export function newer(a, b) {
  if (!a) return b;
  if (!b) return a;
  return b.updatedAt > a.updatedAt ? b : a;
}
