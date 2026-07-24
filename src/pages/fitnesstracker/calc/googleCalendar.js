// Google Calendar REST client for two-way sync. Kept self-contained in the
// sub-app: it uses its OWN calendar-scoped GoogleAuthProvider to fetch an OAuth
// access token, so the site-wide sign-in (src/AuthContext.jsx) is never touched.
//
// PREREQUISITES to exercise this live (config, not code):
//   • the site's Google Cloud project must have the Calendar API enabled and the
//     calendar scope added to the OAuth consent screen;
//   • the user must grant the calendar permission on connect.
// LIMITATION (browser OAuth): the access token lasts ~1h and there is no refresh
// token client-side, so long sessions need an occasional reconnect. Both are
// surfaced in the Settings UI. The token lives only in memory.
//
// Ownership rules (see CalendarSync.jsx for the orchestration):
//   • scheduling fields (title/date/time) — editable either side, last-write-wins
//     by timestamp (we send workout.updatedAt as an extended property).
//   • performance data (splits/pace/HR) — tracker-only; written into the event
//     description as a summary, never read back from Google.

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, firebaseReady } from '../../../firebase';

const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
const API = 'https://www.googleapis.com/calendar/v3';
export const TRAINING_CAL_NAME = 'Training';

let accessToken = null;

export function isConnected() { return !!accessToken; }
export function disconnect() { accessToken = null; }

export async function connect() {
  if (!firebaseReady || !auth) throw new Error('Firebase auth is not configured in this environment.');
  // A dedicated provider (not the shared googleProvider) so we only ever request
  // the calendar scope from inside FitnessTracker. NB: this project normally uses
  // redirect sign-in (popup breaks under some COOP policies); popup is used here
  // because we need the returned OAuth credential in-page. If it fails, the error
  // is surfaced and the user can retry.
  const provider = new GoogleAuthProvider();
  provider.addScope(CAL_SCOPE);
  provider.setCustomParameters({ prompt: 'consent' });
  const result = await signInWithPopup(auth, provider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  accessToken = cred?.accessToken || null;
  if (!accessToken) throw new Error('Google did not return a Calendar access token.');
  return { email: result.user?.email || null };
}

async function api(path, opts = {}) {
  if (!accessToken) throw new Error('Not connected to Google Calendar.');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 401) { accessToken = null; throw new Error('Calendar session expired — reconnect.'); }
  if (!res.ok) throw new Error(`Calendar API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

// find-or-create the dedicated "Training" calendar so this never clutters the
// user's primary calendar (still shows fine in the Google Calendar phone app).
export async function ensureTrainingCalendar() {
  const list = await api('/users/me/calendarList');
  const existing = (list.items || []).find((c) => c.summary === TRAINING_CAL_NAME);
  if (existing) return existing.id;
  const created = await api('/calendars', { method: 'POST', body: JSON.stringify({ summary: TRAINING_CAL_NAME, description: 'Workouts synced from MyFitnessTracker.' }) });
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
export async function listEvents(calendarId, timeMinISO, timeMaxISO) {
  const q = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeMin: timeMinISO, timeMax: timeMaxISO });
  const data = await api(`/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
  return data.items || [];
}
