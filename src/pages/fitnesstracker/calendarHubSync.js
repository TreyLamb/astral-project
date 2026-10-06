// Calendar hub — the orchestrator: talk to Google, run calendarHub.planSync, apply the plan to
// both sides, then pull his other calendars (drawn on the MFT calendar) and the school feeds
// (fed to the coursework dashboard). Owner doc: theknowledgebase/courses/SCHOOL-OPS.md §6.
//
// Called from Settings → Calendars ("Sync now") and from the auto-sync hook in
// FitnessTrackerApp (on open, and a few seconds after an MFT edit, while a token is valid).

import * as gcal from './calc/googleCalendar';
import {
  planSync, defaultRole, guessFeedKind, toFeedEvent, toOverlay, TRAINING_CAL, EVENTS_CAL, WINDOW,
} from './calc/calendarHub';
import { courseworkStore } from '../theknowledgebase/courses/coursework/courseworkStore';
import { isoOf } from '../theknowledgebase/courses/coursework/courseworkModel';
import { setOverlay } from './googleOverlayStore';
import { activityType } from './fitnessConfig';
import { fmtDist, fmtPace, fmtDur, paceUnitFor } from './format';
import { paceSecPerMeter } from './calc/pace';

const DAY = 86_400_000;
const pad = (n) => String(n).padStart(2, '0');
const localISO = (d) => `${isoOf(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const browserTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver';

/** The Google event body for one MFT entry. Performance data rides in the description only. */
export function eventBodyFor(w, { activityTypes, units, tz }) {
  const t = activityType(activityTypes, w.activityType);
  const isEvent = t.kind === 'event';
  let times;
  if (w.time) {
    const start = new Date(`${w.date}T${w.time}:00`);
    const end = new Date(start.getTime() + (w.durationSec || 3600) * 1000);
    times = { start: { dateTime: localISO(start), timeZone: tz }, end: { dateTime: localISO(end), timeZone: tz } };
  } else {
    const next = new Date(`${w.date}T00:00:00`);
    next.setDate(next.getDate() + 1);
    times = { start: { date: w.date }, end: { date: isoOf(next) } };
  }
  const unit = units?.distance || 'mi';
  const lines = [];
  if (!isEvent) lines.push(`Status: ${w.status}`);
  if (w.distanceM) lines.push(`Distance: ${fmtDist(w.distanceM, unit)}`);
  if (w.durationSec && !isEvent) lines.push(`Time: ${fmtDur(w.durationSec)}`);
  if (w.distanceM && w.durationSec) lines.push(`Pace: ${fmtPace(paceSecPerMeter(w.distanceM, w.durationSec), paceUnitFor(unit))}`);
  if (w.rpe) lines.push(`RPE: ${w.rpe}/10`);
  if (w.note && !(isEvent && !w.title)) lines.push(w.note);
  if (w.metrics?.url) lines.push(w.metrics.url);
  lines.push('', '— from MyFitnessTracker (edit here or in MFT)');
  const label = w.distanceM ? ` ${fmtDist(w.distanceM, unit)}` : '';
  return {
    summary: isEvent ? (w.title?.trim() || w.note?.trim() || 'Event') : `${t.name}${label}`,
    description: lines.join('\n'),
    ...times,
    extendedProperties: { private: { ftWorkoutId: w.id, ftUpdated: String(w.updatedAt || 0), astral: 'mft' } },
  };
}

let running = null;

/** One sync at a time — the auto-sync and the button can't race each other. */
export function runSync(ctx) {
  if (!running) running = doSync(ctx).finally(() => { running = null; });
  return running;
}

async function doSync(ctx) {
  const { workouts, activityTypes, settings, updateSettings, updateWorkout, addWorkout, removeWorkout } = ctx;
  const tz = browserTz();
  const hub = settings.calendarHub || {};
  const now = Date.now();

  let cals = await gcal.listCalendars();
  const trainingCalId = await gcal.ensureCalendar(cals, TRAINING_CAL, 'Workouts from MyFitnessTracker.');
  const eventsCalId = await gcal.ensureCalendar(cals, EVENTS_CAL, 'Events from MyFitnessTracker. Add or edit events here (or on your iPhone) and MFT picks them up.');
  if (!cals.some((c) => c.id === eventsCalId) || !cals.some((c) => c.id === trainingCalId)) cals = await gcal.listCalendars();

  // ---- the two-way calendars ------------------------------------------------------------
  const min = new Date(now - WINDOW.back * DAY);
  const max = new Date(now + WINDOW.ahead * DAY);
  const ownEvents = [];
  for (const id of [trainingCalId, eventsCalId]) {
    const evs = await gcal.listEvents(id, min.toISOString(), max.toISOString(), { showDeleted: true });
    ownEvents.push(...evs.map((e) => ({ ...e, _calId: id })));
  }
  const kindOf = (w) => activityType(activityTypes, w.activityType).kind;
  const entries = workouts.filter((w) => kindOf(w) !== 'weight' && w.date >= isoOf(min) && w.date <= isoOf(max));
  const bodyFor = (w) => eventBodyFor(w, { activityTypes, units: settings.units, tz });
  const plan = planSync({
    entries,
    allEntryIds: new Set(workouts.map((w) => w.id)),
    ownEvents,
    isEvent: (w) => kindOf(w) === 'event',
    trainingCalId,
    eventsCalId,
    bodyFor,
    tz,
  });

  const result = { inserted: 0, patched: 0, moved: 0, deleted: 0, imported: 0, updatedInMft: 0, removedFromMft: 0, detached: 0, overlay: 0, canvas: 0, ls: 0, warnings: [] };
  const stamp = (w, ev, calId) => updateWorkout(w.id, { metrics: { ...(w.metrics || {}), gcalEventId: ev.id, gcalCalId: calId } });

  for (const ins of plan.inserts) {
    const ev = await gcal.insertEvent(ins.calId, ins.body);
    await stamp(ins.entry, ev, ins.calId);
    result.inserted += 1;
  }
  for (const p of plan.patches) {
    try {
      await gcal.patchEvent(p.calId, p.eventId, p.body);
    } catch (e) {
      if (!e.gone) throw e;
      await stamp(p.entry, await gcal.insertEvent(p.calId, p.body), p.calId); // vanished in between — MFT still has it
    }
    result.patched += 1;
  }
  for (const m of plan.moves) {
    try { await gcal.deleteEvent(m.from, m.eventId); } catch (e) { if (!e.gone) throw e; }
    await stamp(m.entry, await gcal.insertEvent(m.to, m.body), m.to);
    result.moved += 1;
  }
  for (const d of plan.deletes) {
    try { await gcal.deleteEvent(d.calId, d.eventId); } catch (e) { if (!e.gone) throw e; }
    result.deleted += 1;
  }
  for (const u of plan.mftUpdates) { await updateWorkout(u.id, u.patch); result.updatedInMft += 1; }
  for (const id of plan.mftDetach) {
    const w = workouts.find((x) => x.id === id);
    await updateWorkout(id, { metrics: { ...(w?.metrics || {}), gcalEventId: null, gcalCalId: null, gcalDetached: true } });
    result.detached += 1;
  }
  for (const id of plan.mftRemove) { await removeWorkout(id); result.removedFromMft += 1; }
  for (const im of plan.mftImports) {
    const metrics = { gcalEventId: im.eventId, gcalCalId: im.calId, gcalExternal: true };
    const w = await addWorkout(im.asEvent
      ? { date: im.date, time: im.time, activityType: 'event', title: im.title, status: 'planned', metrics }
      : { date: im.date, time: im.time, activityType: 'other', status: 'planned', note: im.title, metrics });
    // Tag it, so deleting it later in MFT deletes it in Google too instead of re-importing it.
    try {
      await gcal.patchEvent(im.calId, im.eventId, { extendedProperties: { private: { ftWorkoutId: w.id, ftUpdated: String(w.updatedAt || 0), astral: 'mft' } } });
    } catch { /* imported regardless; it just stays untagged until next sync */ }
    result.imported += 1;
  }

  // ---- read-only calendars + school feeds ------------------------------------------------
  const ownIds = [trainingCalId, eventsCalId];
  const roles = hub.roles || {};
  const rows = cals.filter((c) => !ownIds.includes(c.id)).map((c) => ({
    id: c.id,
    summary: c.summaryOverride || c.summary || c.id,
    color: c.backgroundColor || '#94a3b8',
    role: roles[c.id]?.role || defaultRole(c, ownIds),
    feedKind: roles[c.id]?.feedKind || null,
    course: roles[c.id]?.course || null,
  }));
  const overlay = [];
  const canvas = [];
  const ls = [];
  for (const c of rows) {
    if (c.role === 'hide') continue;
    try {
      if (c.role === 'show') {
        const evs = await gcal.listEvents(c.id, new Date(now - 14 * DAY).toISOString(), new Date(now + 90 * DAY).toISOString());
        overlay.push(...evs.map((e) => toOverlay(e, { id: c.id, summary: c.summary, backgroundColor: c.color }, tz)).filter(Boolean));
      } else if (c.role === 'feed') {
        const evs = (await gcal.listEvents(c.id, new Date(now - 45 * DAY).toISOString(), new Date(now + 200 * DAY).toISOString()))
          .filter((e) => e.status !== 'cancelled');
        c.feedKind = c.feedKind || guessFeedKind(evs);
        const fe = evs.map((e) => toFeedEvent(e, tz)).filter((e) => e.start);
        if (c.feedKind === 'canvas') canvas.push(...fe);
        else ls.push({ id: c.id, course: c.course, label: c.summary, events: fe });
      }
    } catch (e) {
      result.warnings.push(`${c.summary}: ${gcal.explainError(e)}`);
    }
  }
  setOverlay({ events: overlay, syncedAt: Date.now() });
  if (rows.some((c) => c.role === 'feed')) courseworkStore.setFeeds({ canvas, ls, by: 'google' });
  result.overlay = overlay.length;
  result.canvas = canvas.length;
  result.ls = ls.reduce((n, f) => n + f.events.length, 0);

  await updateSettings({
    calendarHub: {
      ...hub,
      connected: true,
      trainingCalId,
      eventsCalId,
      lastSync: Date.now(),
      lastResult: result,
      calendars: rows,
    },
  });
  return result;
}
