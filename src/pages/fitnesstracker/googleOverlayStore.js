// Events from his other Google calendars (primary etc.), drawn read-only on the MFT calendar.
// Written by calendarHubSync.js after every sync; kept in localStorage so the calendar shows the
// last pull even before the next one (and while signed out of Google). Device-local on purpose:
// the iPhone already shows these natively, so there is nothing to gain by copying his personal
// calendar into Firestore.

import { useSyncExternalStore } from 'react';

const KEY = 'astral_gcal_overlay_v1';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && Array.isArray(v.events) ? v : { events: [], syncedAt: null };
  } catch {
    return { events: [], syncedAt: null };
  }
}

let state = typeof localStorage === 'undefined' ? { events: [], syncedAt: null } : load();
let byDate = index(state.events);
const listeners = new Set();

function index(events) {
  const map = {};
  for (const e of events) (map[e.date] ||= []).push(e);
  for (const list of Object.values(map)) list.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return map;
}

export function setOverlay(next) {
  state = { events: next.events ?? [], syncedAt: next.syncedAt ?? Date.now() };
  byDate = index(state.events);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota — memory only */ }
  for (const fn of listeners) fn();
}

export function clearOverlay() { setOverlay({ events: [], syncedAt: null }); }

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => byDate;

/** { 'YYYY-MM-DD': OverlayEvent[] } — what the day cells index into. */
export function useGoogleOverlay() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export const overlaySyncedAt = () => state.syncedAt;

/** Plain read for non-React callers (tests, the sync summary). */
export const overlaySnapshot = () => byDate;
