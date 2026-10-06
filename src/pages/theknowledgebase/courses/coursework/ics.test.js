import { describe, it, expect } from 'vitest';
import { parseIcs, unfold, parseLine, decodeDate, zonedToUtc, clock12 } from './ics.js';

const CANVAS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'X-WR-CALNAME:Trey Lamb Calendar (Canvas)',
  'BEGIN:VEVENT',
  'DTSTART:20261008T055900Z',
  'DTEND:20261008T055900Z',
  'SUMMARY:Take OLQ 7 on MMAHP Ch 7/ M2OS Ch 9 & 13 [MICR-2060-X01 Fall 2026]',
  'UID:event-assignment-9217711',
  'URL;VALUE=URI:https://uvu.instructure.com/courses/635327/assignments/9217711',
  'DESCRIPTION:Line one\\nLine two\\, with a comma',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261007T183000Z',
  'SUMMARY:Quiz 14\\, Sec 4-6 [CHEM-1210-004 Fall 2026]',
  'UID:event-assignment-9205020',
  'URL:https://uvu.instructure.com/courses/640153/assignme',
  ' nts/9205020',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

const LEARNING_SUITE = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261015',
  'DTEND;VALUE=DATE:20261016',
  'SUMMARY:Reading Quiz 4',
  'UID:ls-abc-123',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;TZID=America/Denver:20261016T090000',
  'SUMMARY:Leadership Lab',
  'UID:ls-abc-124',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n');

describe('ics', () => {
  it('unfolds continuation lines', () => {
    expect(unfold('URL:https://a/b\r\n c/d')).toBe('URL:https://a/bc/d');
  });

  it('keeps colons inside quoted params and in the value', () => {
    const p = parseLine('X-FOO;LABEL="a:b";X=1:https://x.y/z');
    expect(p).toEqual({ name: 'X-FOO', params: { LABEL: 'a:b', X: '1' }, value: 'https://x.y/z' });
  });

  it('reads a Canvas 11:59 PM due date back onto the right LOCAL day', () => {
    // 05:59Z on the 8th is 11:59 PM MDT on the 7th — reading the UTC date would be a day late.
    const { calName, events } = parseIcs(CANVAS);
    expect(calName).toBe('Trey Lamb Calendar (Canvas)');
    expect(events[0].start).toMatchObject({ date: '2026-10-07', time: '11:59 PM', allDay: false });
    expect(events[0].description).toBe('Line one\nLine two, with a comma');
    expect(events[0].url).toBe('https://uvu.instructure.com/courses/635327/assignments/9217711');
  });

  it('converts a UTC midday quiz deadline to Mountain time', () => {
    const { events } = parseIcs(CANVAS);
    expect(events[1].summary).toBe('Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]');
    expect(events[1].start).toMatchObject({ date: '2026-10-07', time: '12:30 PM' });
    expect(events[1].url).toBe('https://uvu.instructure.com/courses/640153/assignments/9205020');
  });

  it('reads Learning Suite all-day and zoned events', () => {
    const { events } = parseIcs(LEARNING_SUITE);
    expect(events[0].start).toEqual({ date: '2026-10-15', time: null, at: null, allDay: true });
    expect(events[1].start).toMatchObject({ date: '2026-10-16', time: '9:00 AM', at: '2026-10-16T15:00:00.000Z' });
  });

  it('handles the DST boundary (MST in December)', () => {
    const ms = zonedToUtc(2026, 12, 7, 13, 0, 0, 'America/Denver');
    expect(new Date(ms).toISOString()).toBe('2026-12-07T20:00:00.000Z');
    expect(decodeDate({ value: '20261207T200000Z', params: {} })).toMatchObject({ date: '2026-12-07', time: '1:00 PM' });
  });

  it('formats 12-hour clock edge cases', () => {
    expect(clock12(0, 5)).toBe('12:05 AM');
    expect(clock12(12, 0)).toBe('12:00 PM');
    expect(clock12(23, 59)).toBe('11:59 PM');
  });

  it('survives junk', () => {
    expect(parseIcs('').events).toEqual([]);
    expect(parseIcs('not a calendar').events).toEqual([]);
    expect(decodeDate({ value: 'garbage', params: {} })).toBeNull();
  });
});
