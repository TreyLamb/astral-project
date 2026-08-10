// Which Home cards show, and in what order.
//
// Always written to localStorage, so this works fully signed-out. When signed
// in it ALSO mirrors to users/{uid}/prefs/homeLayout so the arrangement follows
// you between devices. Local is the read fallback whenever Firebase is absent,
// unconfigured, or offline — the page must never depend on the network to
// render its own cards.
//
// Shape: { order: string[] of `to` paths, hidden: string[] of `to` paths }
// A `to` that isn't in SITE_LINKS anymore is ignored on read (a tool can be
// removed without corrupting a saved layout), and a NEW tool that isn't in a
// saved `order` yet is appended visible — new things show up rather than
// silently never appearing.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from './firebase';
import { SITE_LINKS, LINK_BY_TO } from './siteLinks';

const LS_KEY = 'astral_home_layout_v1';

export const DEFAULT_LAYOUT = { order: SITE_LINKS.map((l) => l.to), hidden: [] };

function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAYOUT;
  const order = (Array.isArray(raw.order) ? raw.order : []).filter((t) => LINK_BY_TO.has(t));
  const seen = new Set(order);
  for (const l of SITE_LINKS) if (!seen.has(l.to)) order.push(l.to);
  const hidden = (Array.isArray(raw.hidden) ? raw.hidden : []).filter((t) => LINK_BY_TO.has(t));
  return { order, hidden };
}

export function loadLocal() {
  try { return sanitize(JSON.parse(localStorage.getItem(LS_KEY))); }
  catch { return DEFAULT_LAYOUT; }
}

export function saveLocal(layout) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); } catch { /* private mode / quota — local persistence just doesn't happen */ }
}

function cloudRef(uid) { return doc(db, 'users', uid, 'prefs', 'homeLayout'); }

export async function loadCloud(uid) {
  if (!firebaseReady || !db || !uid) return null;
  const snap = await getDoc(cloudRef(uid));
  return snap.exists() ? sanitize(snap.data()) : null;
}

export async function saveCloud(uid, layout) {
  if (!firebaseReady || !db || !uid) return;
  await setDoc(cloudRef(uid), layout);
}

// The visible cards, in order.
export function visibleLinks(layout) {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((t) => !hidden.has(t)).map((t) => LINK_BY_TO.get(t)).filter(Boolean);
}

// Move `to` so it lands at the position currently held by `beforeTo`
// (or the end when beforeTo is null). Operates on the FULL order array, which
// includes hidden entries — so hiding and re-showing a card doesn't lose where
// you had dragged it to.
export function reorder(order, to, beforeTo) {
  const next = order.filter((t) => t !== to);
  const i = beforeTo == null ? next.length : next.indexOf(beforeTo);
  next.splice(i < 0 ? next.length : i, 0, to);
  return next;
}
