// Google Calendar REST client — the network half of the calendar hub (calendarHub.js is the pure
// half; calendarHubSync.js orchestrates). Owner doc: theknowledgebase/courses/SCHOOL-OPS.md §6.
//
// PREREQUISITES (config, not code) — the site's Google Cloud project must have the Calendar API
// enabled (Trey confirmed 2026-07-30) and the calendar scope on its OAuth consent screen, and he
// grants the permission once on Connect. Errors from either are translated into plain steps below.
//
// The token: a browser OAuth access token lasts ~1 hour and there is no refresh token client-side.
// It is kept in sessionStorage (not localStorage) with its expiry, so a reload inside the hour
// doesn't need another click, and closing the tab forgets it.
//
// Account safety: when someone is already signed in to the site, Connect RE-authenticates that
// same user instead of signing in afresh. signInWithPopup could quietly switch the whole site to
// whichever Google account got picked in the popup; reauthenticateWithPopup refuses a different
// account (auth/user-mismatch), which is surfaced as a readable error.

import { GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup } from 'firebase/auth';
import { auth, firebaseReady } from '../../../firebase';

const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
const API = 'https://www.googleapis.com/calendar/v3';
const TOKEN_KEY = 'astral_gcal_token_v1';
const TOKEN_LIFETIME_MS = 55 * 60 * 1000; // Google says 3600 s; leave margin

let accessToken = null;
let expiresAt = 0;

(function restore() {
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    if (t?.token && t.exp > Date.now() + 60_000) { accessToken = t.token; expiresAt = t.exp; }
  } catch { /* no sessionStorage (tests, private mode) — start disconnected */ }
}());

export function isConnected() { return !!accessToken && Date.now() < expiresAt - 30_000; }
export function minutesLeft() { return isConnected() ? Math.floor((expiresAt - Date.now()) / 60_000) : 0; }

export function disconnect() {
  accessToken = null;
  expiresAt = 0;
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* nothing to clear */ }
}

/** Translate the failures Trey could actually hit into something he can act on. */
export function explainError(e) {
  const code = e?.code || '';
  const msg = String(e?.message || e || '');
  if (code === 'auth/popup-blocked') return 'The browser blocked the Google window. Allow pop-ups for this site, then press Connect again.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'The Google window was closed before finishing. Press Connect to try again.';
  if (code === 'auth/user-mismatch') return 'That was a different Google account from the one you are signed in to this site with. Connect again and pick the same account.';
  if (/accessNotConfigured|has not been used in project|is disabled/i.test(msg)) return 'Google says the Calendar API is not enabled for this site\'s Google Cloud project. In console.cloud.google.com → APIs & Services → Library → Google Calendar API → Enable, then Connect again.';
  if (/insufficient|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i.test(msg)) return 'Google did not grant calendar access. Connect again and tick the calendar permission on Google\'s screen.';
  if (/expired|401/i.test(msg)) return 'The Google session ran out (they last about an hour). Press Sync now — it reconnects.';
  return msg || 'Something went wrong talking to Google Calendar.';
}

export async function connect() {
  if (!firebaseReady || !auth) throw new Error('Firebase auth is not configured in this environment.');
  const provider = new GoogleAuthProvider();
  provider.addScope(CAL_SCOPE);
  const current = auth.currentUser;
  if (current?.email) provider.setCustomParameters({ login_hint: current.email });
  const result = current ? await reauthenticateWithPopup(current, provider) : await signInWithPopup(auth, provider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  if (!cred?.accessToken) throw new Error('Google did not return a Calendar access token.');
  accessToken = cred.accessToken;
  expiresAt = Date.now() + TOKEN_LIFETIME_MS;
  try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: accessToken, exp: expiresAt })); } catch { /* memory only */ }
  return { email: result.user?.email || current?.email || null };
}

async function api(path, opts = {}) {
  if (!isConnected()) throw new Error('Not connected to Google Calendar (expired).');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 401) { disconnect(); throw new Error('Calendar session expired (401).'); }
  if (res.status === 404 || res.status === 410) {
    const err = new Error(`Calendar API ${res.status}`);
    err.gone = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Calendar API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

/** Every page of a list endpoint. */
async function listAll(path, params) {
  const items = [];
  let pageToken = null;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams({ ...params, ...(pageToken ? { pageToken } : {}) });
    const data = await api(`${path}?${q}`);
    items.push(...(data.items || []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return items;
}

export const listCalendars = () => listAll('/users/me/calendarList', { maxResults: '250' });

export function listEvents(calendarId, timeMinISO, timeMaxISO, { showDeleted = false } = {}) {
  return listAll(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    singleEvents: 'true',
    maxResults: '2500',
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    showDeleted: String(showDeleted),
  });
}

/** Find a calendar he owns by name, or create it — so MFT never writes into his primary one. */
export async function ensureCalendar(calendars, summary, description) {
  const existing = calendars.find((c) => c.summary === summary && (c.accessRole === 'owner' || c.accessRole === 'writer'));
  if (existing) return existing.id;
  const created = await api('/calendars', { method: 'POST', body: JSON.stringify({ summary, description }) });
  return created.id;
}

export function insertEvent(calendarId, body) {
  return api(`/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: JSON.stringify(body) });
}
export function patchEvent(calendarId, eventId, body) {
  return api(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export function deleteEvent(calendarId, eventId) {
  return api(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}
