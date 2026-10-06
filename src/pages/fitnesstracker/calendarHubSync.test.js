// End-to-end sync against a simulated Google account — the strongest check possible without
// Trey's login (the live first run is his one click; see courses/SCHOOL-OPS.md §5).

import { describe, it, expect, vi } from 'vitest';
import { resolveActivityTypes } from './fitnessConfig';
import { addDaysISO, isoOf } from '../theknowledgebase/courses/coursework/courseworkModel';

const google = vi.hoisted(() => ({ calendars: [], events: {}, nextId: 1 }));

vi.mock('./calc/googleCalendar', () => {
  const find = (calId, id) => (google.events[calId] || []).find((e) => e.id === id);
  return {
    isConnected: () => true,
    explainError: (e) => String(e?.message || e),
    listCalendars: async () => google.calendars.map((c) => ({ ...c })),
    ensureCalendar: async (cals, summary) => {
      const ex = google.calendars.find((c) => c.summary === summary);
      if (ex) return ex.id;
      const id = `${summary.toLowerCase()}@group.calendar.google.com`;
      google.calendars.push({ id, summary, accessRole: 'owner', backgroundColor: '#22c55e' });
      google.events[id] = [];
      return id;
    },
    listEvents: async (calId, min, max, opts = {}) => (google.events[calId] || [])
      .filter((e) => opts.showDeleted || e.status !== 'cancelled')
      .map((e) => JSON.parse(JSON.stringify(e))),
    insertEvent: async (calId, body) => {
      const ev = { id: `g${google.nextId++}`, status: 'confirmed', updated: new Date().toISOString(), ...JSON.parse(JSON.stringify(body)) };
      google.events[calId].push(ev);
      return ev;
    },
    patchEvent: async (calId, id, body) => {
      const ev = find(calId, id);
      if (!ev) { const err = new Error('gone'); err.gone = true; throw err; }
      Object.assign(ev, JSON.parse(JSON.stringify(body)), { updated: new Date().toISOString() });
      return ev;
    },
    deleteEvent: async (calId, id) => {
      const ev = find(calId, id);
      if (ev) Object.assign(ev, { status: 'cancelled', updated: new Date().toISOString() });
    },
  };
});

const { runSync } = await import('./calendarHubSync');
const { courseworkStore } = await import('../theknowledgebase/courses/coursework/courseworkStore');
const { overlaySnapshot } = await import('./googleOverlayStore');

const today = isoOf(new Date());
const d = (n) => addDaysISO(today, n);
const longAgo = Date.parse('2026-01-01T00:00:00Z');

function makeCtx(workouts) {
  const state = { workouts, settings: { units: { distance: 'mi' }, calendarHub: {} } };
  return {
    state,
    get workouts() { return state.workouts; },
    get settings() { return state.settings; },
    activityTypes: resolveActivityTypes({}),
    updateSettings: async (u) => { state.settings = { ...state.settings, ...u }; },
    updateWorkout: async (id, u) => { state.workouts = state.workouts.map((w) => (w.id === id ? { ...w, ...u, updatedAt: Date.now() } : w)); },
    addWorkout: async (p) => {
      const w = { id: `new${state.workouts.length}`, title: '', note: '', time: '', metrics: {}, status: 'planned', updatedAt: Date.now(), ...p };
      state.workouts = [...state.workouts, w];
      return w;
    },
    removeWorkout: async (id) => { state.workouts = state.workouts.filter((w) => w.id !== id); },
  };
}

const evIn = (calId) => google.events[calId].filter((e) => e.status !== 'cancelled');
const byFt = (calId, id) => evIn(calId).find((e) => e.extendedProperties?.private?.ftWorkoutId === id);

describe('runSync against a simulated Google account', () => {
  google.calendars.push(
    { id: 'me@gmail.com', summary: 'Trey', primary: true, accessRole: 'owner', backgroundColor: '#3b82f6' },
    { id: 'abc@import.calendar.google.com', summary: 'Canvas', accessRole: 'reader', backgroundColor: '#ef4444' },
    { id: 'en.usa#holiday@group.v.calendar.google.com', summary: 'Holidays in United States', accessRole: 'reader' },
    { id: 'training@group.calendar.google.com', summary: 'Training', accessRole: 'owner' },
    { id: 'mft@group.calendar.google.com', summary: 'MFT', accessRole: 'owner' },
  );
  google.events['me@gmail.com'] = [{ id: 'p1', status: 'confirmed', summary: 'Lunch with Sam', start: { date: d(1) }, htmlLink: 'https://calendar.google.com/x' }];
  google.events['abc@import.calendar.google.com'] = [{ id: 'c1', status: 'confirmed', iCalUID: 'event-assignment-9205020', summary: 'Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]', start: { date: d(1) } }];
  google.events['en.usa#holiday@group.v.calendar.google.com'] = [{ id: 'h1', status: 'confirmed', summary: 'Columbus Day', start: { date: d(6) } }];
  google.events['training@group.calendar.google.com'] = [{
    id: 'g-old', status: 'confirmed', summary: 'Run', start: { date: d(5) }, end: { date: d(6) },
    updated: new Date(Date.now() - 60_000).toISOString(), extendedProperties: { private: { ftWorkoutId: 'w-linked' } },
  }];
  google.events['mft@group.calendar.google.com'] = [{ id: 'g-ext', status: 'confirmed', summary: 'Advisor meeting', start: { date: d(2) }, updated: new Date().toISOString() }];

  const ctx = makeCtx([
    { id: 'w-run', activityType: 'run', date: d(2), time: '', title: '', note: '', status: 'planned', distanceM: 5000, metrics: {}, updatedAt: Date.now() },
    { id: 'e-dent', activityType: 'event', date: d(3), time: '15:00', title: 'Dentist', note: '', status: 'planned', metrics: {}, updatedAt: Date.now() },
    { id: 'w-linked', activityType: 'run', date: d(4), time: '', title: '', note: '', status: 'planned', metrics: { gcalEventId: 'g-old' }, updatedAt: longAgo },
    { id: 'w-weigh', activityType: 'weighin', date: d(1), time: '', title: '', note: '', status: 'planned', metrics: {}, updatedAt: Date.now() },
  ]);

  it('first sync: pushes, pulls a phone reschedule, imports a phone event, reads feeds and overlays', async () => {
    const r = await runSync(ctx);
    const TR = 'training@group.calendar.google.com';
    const EV = 'mft@group.calendar.google.com';

    expect(byFt(TR, 'w-run')).toBeTruthy();                      // workout -> Training
    const dent = byFt(EV, 'e-dent');                             // event -> MFT calendar, timed
    expect(dent.summary).toBe('Dentist');
    expect(dent.start.dateTime.startsWith(`${d(3)}T15:00:00`)).toBe(true);
    expect(google.events[TR].concat(google.events[EV]).some((e) => e.extendedProperties?.private?.ftWorkoutId === 'w-weigh')).toBe(false);

    expect(ctx.state.workouts.find((w) => w.id === 'w-linked').date).toBe(d(5)); // moved on the phone

    const imported = ctx.state.workouts.find((w) => w.title === 'Advisor meeting');
    expect(imported).toMatchObject({ activityType: 'event', date: d(2) });
    expect(evIn(EV).find((e) => e.id === 'g-ext').extendedProperties.private.ftWorkoutId).toBe(imported.id);

    expect(courseworkStore.getState().feeds.canvas.map((e) => e.uid)).toEqual(['event-assignment-9205020']);
    expect(overlaySnapshot()[d(1)].map((e) => e.title)).toEqual(['Lunch with Sam']);
    expect(overlaySnapshot()[d(6)]).toBeUndefined();             // holidays default to hidden

    const hub = ctx.state.settings.calendarHub;
    expect(hub.calendars.find((c) => c.id === 'abc@import.calendar.google.com')).toMatchObject({ role: 'feed', feedKind: 'canvas' });
    expect(hub.calendars.find((c) => c.id === 'me@gmail.com').role).toBe('show');
    expect(r).toMatchObject({ inserted: 2, imported: 1, updatedInMft: 1, canvas: 1, overlay: 1 });
  });

  it('settles: repeated syncs stop changing anything (no echo loop, no duplicates)', async () => {
    await runSync(ctx);
    const third = await runSync(ctx);
    expect(third).toMatchObject({ inserted: 0, patched: 0, moved: 0, deleted: 0, imported: 0, updatedInMft: 0, removedFromMft: 0 });
    const ft = google.events['training@group.calendar.google.com'].concat(google.events['mft@group.calendar.google.com'])
      .filter((e) => e.status !== 'cancelled').map((e) => e.extendedProperties?.private?.ftWorkoutId);
    expect(new Set(ft).size).toBe(ft.length);
  });

  it('deleting in MFT deletes in Google; deleting in Google removes an MFT event', async () => {
    const EV = 'mft@group.calendar.google.com';
    ctx.state.workouts = ctx.state.workouts.filter((w) => w.id !== 'e-dent');
    const imported = ctx.state.workouts.find((w) => w.title === 'Advisor meeting');
    google.events[EV].find((e) => e.id === 'g-ext').status = 'cancelled';
    const r = await runSync(ctx);
    expect(byFt(EV, 'e-dent')).toBeUndefined();
    expect(ctx.state.workouts.find((w) => w.id === imported.id)).toBeUndefined();
    expect(r).toMatchObject({ deleted: 1, removedFromMft: 1 });
  });

  it('deleting a WORKOUT in Google keeps its data in MFT and unlinks it', async () => {
    const TR = 'training@group.calendar.google.com';
    byFt(TR, 'w-run').status = 'cancelled';
    const r = await runSync(ctx);
    const w = ctx.state.workouts.find((x) => x.id === 'w-run');
    expect(w).toBeTruthy();
    expect(w.metrics).toMatchObject({ gcalDetached: true, gcalEventId: null });
    expect(r.detached).toBe(1);
    const again = await runSync(ctx);
    expect(again.inserted).toBe(0); // not resurrected in Google
  });
});
