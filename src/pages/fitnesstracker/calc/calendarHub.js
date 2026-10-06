// Calendar hub — the PURE half (owner doc: theknowledgebase/courses/SCHOOL-OPS.md §6).
//
// Google Calendar is the hub: the iPhone syncs with Google natively, Canvas / Learning Suite feeds
// are subscribed in Google, and MFT talks only to Google. This file decides WHAT one sync should
// do — which events to create, edit, move or delete on either side — so the rules are testable
// without a network. calendarHubSync.js performs the calls.
//
// Calendars and their roles:
//   own   'Training' (workouts) and 'MFT' (everything else MFT schedules) — fully two-way.
//   show  his other calendars (primary etc.) — drawn on the MFT calendar, read-only.
//   feed  calendars Google subscribed to by URL (@import.calendar.google.com) — Canvas and BYU
//         Learning Suite. Read into the coursework model, never drawn as plain events.
//   hide  ignored.

import { localParts, DEFAULT_TZ } from '../../theknowledgebase/courses/coursework/ics.js';

export const TRAINING_CAL = 'Training';
export const EVENTS_CAL = 'MFT';
export const WINDOW = { back: 60, ahead: 120 }; // days, for the two-way calendars

export const isImportedFeed = (cal) => /@import\.calendar\.google\.com$/.test(cal?.id || '');

/** Role a calendar gets before Trey picks one himself. */
export function defaultRole(cal, ownIds = []) {
  if (ownIds.includes(cal.id)) return 'own';
  if (isImportedFeed(cal)) return 'feed';
  if (cal.primary) return 'show';
  if (/#(holiday|contacts|weeknum)@/.test(cal.id || '') || /holiday|birthdays|week numbers/i.test(cal.summary || '')) return 'hide';
  return 'show';
}

/** A subscribed feed is Canvas if its events carry Canvas's UIDs or course tags; else Learning Suite. */
export function guessFeedKind(events) {
  for (const ev of (events || []).slice(0, 60)) {
    if (/^event-(assignment|calendar-event)-\d+/.test(ev.iCalUID || '')) return 'canvas';
    if (/\[[A-Z]{2,5}[\s-]?\d{3,4}[A-Z]?\b[^\]]*\]\s*$/.test(ev.summary || '')) return 'canvas';
  }
  return 'ls';
}

/** Local start of a Google event: all-day events carry `date`, timed ones an RFC 3339 dateTime. */
export function googleEventStart(ev, tz = DEFAULT_TZ) {
  if (ev?.start?.date) return { date: ev.start.date, time: null, hhmm: '', at: null, allDay: true };
  if (ev?.start?.dateTime) {
    const p = localParts(ev.start.dateTime, tz);
    return { date: p.date, time: p.time, hhmm: p.hhmm, at: p.at, allDay: false };
  }
  return null;
}

/** A Google event from a subscribed school feed, in the shape the coursework model reads. */
export function toFeedEvent(ev, tz = DEFAULT_TZ) {
  const s = googleEventStart(ev, tz);
  const url = ev.source?.url || (/(https?:\/\/[^\s<>"]+)/.exec(ev.description || '') || [])[1] || null;
  return {
    uid: ev.iCalUID || ev.id,
    summary: ev.summary || '',
    description: ev.description || '',
    url,
    location: ev.location || '',
    start: s ? { date: s.date, time: s.time, at: s.at, allDay: s.allDay } : null,
    end: null,
  };
}

/** A Google event from one of his own calendars, as a read-only chip for the MFT calendar. */
export function toOverlay(ev, cal, tz = DEFAULT_TZ) {
  if (ev.status === 'cancelled') return null;
  const s = googleEventStart(ev, tz);
  if (!s) return null;
  return {
    id: `${cal.id}::${ev.id}`,
    calId: cal.id,
    calName: cal.summary || 'Google',
    color: cal.backgroundColor || '#94a3b8',
    title: ev.summary || '(no title)',
    date: s.date,
    time: s.allDay ? null : s.time,
    sortKey: s.allDay ? '' : s.hhmm,
    allDay: s.allDay,
    link: ev.htmlLink || null,
  };
}

const ms = (iso) => (iso ? Date.parse(iso) : 0);
const SKEW_MS = 2000; // clocks differ; within this, neither side counts as newer

/**
 * Decide every change for one sync of the two-way calendars. No network, no React.
 *
 * Rules (last write wins, per entry):
 *   - an MFT entry with no Google event          -> insert into its calendar (Training / MFT)
 *   - in the wrong calendar (an event became a workout, or the reverse) -> move it
 *   - Google edited it more recently             -> copy date/time (and an event's title) to MFT
 *   - MFT edited it more recently                -> patch the Google event
 *   - deleted in Google                          -> an MFT EVENT is removed; a WORKOUT keeps its
 *                                                   logged data and is only detached, never deleted
 *   - an MFT-made Google event whose MFT entry is gone everywhere -> delete it in Google
 *   - an event typed into Training / MFT on the iPhone -> import it into MFT
 *
 * @returns {{ inserts, patches, moves, deletes, mftUpdates, mftImports, mftDetach, mftRemove }}
 */
export function planSync({
  entries, allEntryIds, ownEvents, isEvent, trainingCalId, eventsCalId, bodyFor, tz = DEFAULT_TZ,
}) {
  const out = { inserts: [], patches: [], moves: [], deletes: [], mftUpdates: [], mftImports: [], mftDetach: [], mftRemove: [] };
  const byEventId = new Map();
  const byEntryId = new Map();
  for (const ev of ownEvents) {
    byEventId.set(ev.id, ev);
    const fid = ev.extendedProperties?.private?.ftWorkoutId;
    if (fid) byEntryId.set(fid, ev);
  }
  const matched = new Set();

  for (const w of entries) {
    if (w.metrics?.gcalDetached) continue;
    const targetCal = isEvent(w) ? eventsCalId : trainingCalId;
    const ev = (w.metrics?.gcalEventId && byEventId.get(w.metrics.gcalEventId)) || byEntryId.get(w.id) || null;
    if (!ev) {
      out.inserts.push({ entry: w, calId: targetCal, body: bodyFor(w) });
      continue;
    }
    matched.add(ev.id);
    if (ev.status === 'cancelled') {
      if (isEvent(w)) out.mftRemove.push(w.id);
      else out.mftDetach.push(w.id);
      continue;
    }
    if (ev._calId !== targetCal) {
      out.moves.push({ entry: w, from: ev._calId, eventId: ev.id, to: targetCal, body: bodyFor(w) });
      continue;
    }
    const g = googleEventStart(ev, tz);
    const googleTime = ms(ev.updated);
    const mftTime = w.updatedAt || 0;
    if (googleTime > mftTime + SKEW_MS) {
      const patch = {};
      if (g && (g.date !== w.date || (g.hhmm || '') !== (w.time || ''))) Object.assign(patch, { date: g.date, time: g.hhmm });
      if (isEvent(w) && (ev.summary || '') !== (w.title || '')) patch.title = ev.summary || '';
      if (Object.keys(patch).length) out.mftUpdates.push({ id: w.id, patch });
    } else if (mftTime > googleTime + SKEW_MS) {
      out.patches.push({ entry: w, calId: targetCal, eventId: ev.id, body: bodyFor(w) });
    }
  }

  const knownEventIds = new Set(entries.map((w) => w.metrics?.gcalEventId).filter(Boolean));
  for (const ev of ownEvents) {
    if (matched.has(ev.id) || knownEventIds.has(ev.id) || ev.status === 'cancelled') continue;
    const fid = ev.extendedProperties?.private?.ftWorkoutId;
    if (fid) {
      // MFT made this one. Only delete it when the MFT entry is gone from ALL of MFT — an entry
      // that merely sits outside the sync window still exists.
      if (!allEntryIds.has(fid)) out.deletes.push({ calId: ev._calId, eventId: ev.id });
      continue;
    }
    const g = googleEventStart(ev, tz);
    if (!g) continue;
    out.mftImports.push({
      calId: ev._calId,
      eventId: ev.id,
      date: g.date,
      time: g.hhmm,
      title: ev.summary || '',
      asEvent: ev._calId === eventsCalId,
    });
  }
  return out;
}

/** True when a plan would change nothing (the common case for a quiet auto-sync). */
export const isEmptyPlan = (p) => Object.values(p).every((list) => list.length === 0);
