import { describe, it, expect } from 'vitest';
import {
  planSync, defaultRole, guessFeedKind, googleEventStart, toFeedEvent, toOverlay, isEmptyPlan,
} from './calendarHub.js';

const TR = 'training@group';
const EV = 'mft@group';
const isEvent = (w) => w.activityType === 'event';
const bodyFor = (w) => ({ summary: w.title || w.activityType });

const base = { isEvent, trainingCalId: TR, eventsCalId: EV, bodyFor, tz: 'America/Denver' };
const entry = (over) => ({ id: 'w1', date: '2026-10-10', time: '', activityType: 'run', title: '', updatedAt: Date.parse('2026-10-06T12:00:00Z'), metrics: {}, ...over });
const gEvent = (over) => ({
  id: 'g1', _calId: TR, status: 'confirmed', summary: 'Run', updated: '2026-10-06T12:00:00Z',
  start: { date: '2026-10-10' }, extendedProperties: { private: { ftWorkoutId: 'w1' } }, ...over,
});

describe('planSync — two-way, last write wins', () => {
  it('inserts an MFT entry Google has never seen, into the right calendar', () => {
    const p = planSync({ ...base, entries: [entry(), entry({ id: 'e1', activityType: 'event', title: 'Dentist' })], allEntryIds: new Set(['w1', 'e1']), ownEvents: [] });
    expect(p.inserts.map((i) => [i.entry.id, i.calId])).toEqual([['w1', TR], ['e1', EV]]);
  });

  it('does nothing when both sides agree', () => {
    const p = planSync({ ...base, entries: [entry({ metrics: { gcalEventId: 'g1' } })], allEntryIds: new Set(['w1']), ownEvents: [gEvent()] });
    expect(isEmptyPlan(p)).toBe(true);
  });

  it('copies a Google-side reschedule into MFT when Google is newer', () => {
    const ev = gEvent({ updated: '2026-10-06T13:00:00Z', start: { dateTime: '2026-10-11T07:30:00-06:00' } });
    const p = planSync({ ...base, entries: [entry({ metrics: { gcalEventId: 'g1' } })], allEntryIds: new Set(['w1']), ownEvents: [ev] });
    expect(p.mftUpdates).toEqual([{ id: 'w1', patch: { date: '2026-10-11', time: '07:30' } }]);
    expect(p.patches).toEqual([]);
  });

  it('pushes an MFT edit when MFT is newer', () => {
    const w = entry({ metrics: { gcalEventId: 'g1' }, updatedAt: Date.parse('2026-10-06T14:00:00Z') });
    const p = planSync({ ...base, entries: [w], allEntryIds: new Set(['w1']), ownEvents: [gEvent()] });
    expect(p.patches.map((x) => x.eventId)).toEqual(['g1']);
    expect(p.mftUpdates).toEqual([]);
  });

  it('carries an event title edited on the iPhone back into MFT', () => {
    const w = entry({ id: 'e1', activityType: 'event', title: 'Dentist', metrics: { gcalEventId: 'g9' } });
    const ev = gEvent({ id: 'g9', _calId: EV, summary: 'Dentist — moved to 3pm', updated: '2026-10-06T15:00:00Z', extendedProperties: { private: { ftWorkoutId: 'e1' } } });
    const p = planSync({ ...base, entries: [w], allEntryIds: new Set(['e1']), ownEvents: [ev] });
    expect(p.mftUpdates).toEqual([{ id: 'e1', patch: { title: 'Dentist — moved to 3pm' } }]);
  });

  it('moves an entry whose kind changed to the other calendar', () => {
    const w = entry({ activityType: 'event', title: 'Race day', metrics: { gcalEventId: 'g1' } });
    const p = planSync({ ...base, entries: [w], allEntryIds: new Set(['w1']), ownEvents: [gEvent()] });
    expect(p.moves).toMatchObject([{ from: TR, to: EV, eventId: 'g1' }]);
  });
});

describe('planSync — deletions never lose logged data', () => {
  it('removes an MFT event deleted on the Google side', () => {
    const w = entry({ id: 'e1', activityType: 'event', metrics: { gcalEventId: 'g1' } });
    const p = planSync({ ...base, entries: [w], allEntryIds: new Set(['e1']), ownEvents: [gEvent({ status: 'cancelled', _calId: EV })] });
    expect(p.mftRemove).toEqual(['e1']);
  });

  it('only DETACHES a workout deleted on the Google side', () => {
    const p = planSync({ ...base, entries: [entry({ metrics: { gcalEventId: 'g1' } })], allEntryIds: new Set(['w1']), ownEvents: [gEvent({ status: 'cancelled' })] });
    expect(p.mftDetach).toEqual(['w1']);
    expect(p.mftRemove).toEqual([]);
  });

  it('deletes an MFT-made Google event once the MFT entry is gone', () => {
    const p = planSync({ ...base, entries: [], allEntryIds: new Set(), ownEvents: [gEvent()] });
    expect(p.deletes).toEqual([{ calId: TR, eventId: 'g1' }]);
  });

  it('keeps it when the MFT entry merely sits outside the sync window', () => {
    const p = planSync({ ...base, entries: [], allEntryIds: new Set(['w1']), ownEvents: [gEvent()] });
    expect(p.deletes).toEqual([]);
  });

  it('skips a detached workout entirely', () => {
    const p = planSync({ ...base, entries: [entry({ metrics: { gcalDetached: true } })], allEntryIds: new Set(['w1']), ownEvents: [] });
    expect(isEmptyPlan(p)).toBe(true);
  });
});

describe('planSync — events typed on the iPhone', () => {
  it('imports an event made directly in the MFT calendar as an MFT event', () => {
    const ev = { id: 'g7', _calId: EV, status: 'confirmed', summary: 'Advisor meeting', updated: '2026-10-06T12:00:00Z', start: { dateTime: '2026-10-08T10:00:00-06:00' } };
    const p = planSync({ ...base, entries: [], allEntryIds: new Set(), ownEvents: [ev] });
    expect(p.mftImports).toEqual([{ calId: EV, eventId: 'g7', date: '2026-10-08', time: '10:00', title: 'Advisor meeting', asEvent: true }]);
  });

  it('does not re-import an event it already imported', () => {
    const ev = { id: 'g7', _calId: EV, status: 'confirmed', summary: 'Advisor meeting', updated: '2026-10-06T12:00:00Z', start: { date: '2026-10-08' } };
    const w = entry({ id: 'e5', activityType: 'event', title: 'Advisor meeting', date: '2026-10-08', metrics: { gcalEventId: 'g7', gcalExternal: true } });
    const p = planSync({ ...base, entries: [w], allEntryIds: new Set(['e5']), ownEvents: [ev] });
    expect(p.mftImports).toEqual([]);
  });
});

describe('calendar roles and conversions', () => {
  it('assigns sensible default roles', () => {
    expect(defaultRole({ id: 'me@gmail.com', primary: true })).toBe('show');
    expect(defaultRole({ id: 'abc@import.calendar.google.com', summary: 'Canvas' })).toBe('feed');
    expect(defaultRole({ id: 'en.usa#holiday@group.v.calendar.google.com', summary: 'Holidays in United States' })).toBe('hide');
    expect(defaultRole({ id: TR }, [TR])).toBe('own');
  });

  it('tells a Canvas feed from a Learning Suite feed', () => {
    expect(guessFeedKind([{ iCalUID: 'event-assignment-9205020' }])).toBe('canvas');
    expect(guessFeedKind([{ summary: 'Quiz 14 [CHEM-1210-004 Fall 2026]' }])).toBe('canvas');
    expect(guessFeedKind([{ iCalUID: 'ls-123', summary: 'Reading quiz 4' }])).toBe('ls');
  });

  it('reads all-day and timed starts into local time', () => {
    expect(googleEventStart({ start: { date: '2026-10-07' } })).toEqual({ date: '2026-10-07', time: null, hhmm: '', at: null, allDay: true });
    expect(googleEventStart({ start: { dateTime: '2026-10-08T05:59:00Z' } })).toMatchObject({ date: '2026-10-07', time: '11:59 PM', hhmm: '23:59' });
  });

  it('turns a subscribed Canvas event back into a feed event the coursework model matches', () => {
    const fe = toFeedEvent({ iCalUID: 'event-assignment-9205020', summary: 'Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]', start: { dateTime: '2026-10-07T18:30:00Z' }, description: 'see https://uvu.instructure.com/courses/640153/assignments/9205020 now' });
    expect(fe).toMatchObject({ uid: 'event-assignment-9205020', url: 'https://uvu.instructure.com/courses/640153/assignments/9205020', start: { date: '2026-10-07', time: '12:30 PM' } });
  });

  it('builds overlay chips and drops cancelled events', () => {
    const cal = { id: 'me@gmail.com', summary: 'Trey', backgroundColor: '#123456' };
    expect(toOverlay({ id: 'x', summary: 'Lunch', start: { dateTime: '2026-10-07T18:00:00Z' }, htmlLink: 'L' }, cal)).toMatchObject({ date: '2026-10-07', time: '12:00 PM', title: 'Lunch', color: '#123456', link: 'L' });
    expect(toOverlay({ id: 'y', status: 'cancelled', start: { date: '2026-10-07' } }, cal)).toBeNull();
  });
});
