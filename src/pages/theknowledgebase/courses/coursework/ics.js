// Minimal iCalendar (RFC 5545) reader for LMS calendar feeds — Canvas's per-user feed and BYU
// Learning Suite's per-course schedule feeds. Pure: no DOM, no fetch, so it runs under vitest's
// node environment and in the browser alike.
//
// Only what an LMS feed actually uses is supported: VEVENT blocks; SUMMARY / DESCRIPTION / URL /
// UID / LOCATION; and the three DTSTART shapes —
//   DTSTART;VALUE=DATE:20261007                  all-day (Learning Suite's assignments)
//   DTSTART:20261008T055959Z                     UTC (Canvas — an 11:59 PM MDT due date is the
//                                                NEXT day in UTC, which is why every time is
//                                                converted to the course's zone before its date
//                                                is read off)
//   DTSTART;TZID=America/Denver:20261007T123000  zoned local time
// Recurrence rules are ignored on purpose: LMS feeds emit one VEVENT per due date.

export const DEFAULT_TZ = 'America/Denver';

/** Undo RFC 5545 line folding: a line starting with a space or tab continues the previous one. */
export function unfold(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
}

/** TEXT-value escapes: \\ \; \, \n \N */
export function unescapeText(v) {
  return String(v ?? '').replace(/\\([\\;,nN])/g, (_, c) => (c === 'n' || c === 'N' ? '\n' : c));
}

/** `NAME;P1=a;P2="b:c":value` -> { name, params, value }. Colons inside quoted params are kept. */
export function parseLine(line) {
  let inQuote = false;
  let split = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ':' && !inQuote) { split = i; break; }
  }
  if (split < 0) return null;
  const head = line.slice(0, split);
  const value = line.slice(split + 1);
  const [rawName, ...rawParams] = head.split(';');
  const params = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: rawName.toUpperCase(), params, value };
}

const pad = (n) => String(n).padStart(2, '0');

/** Wall-clock parts of an instant in a zone. */
function partsIn(ms, tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const o = {};
  for (const { type, value } of fmt.formatToParts(new Date(ms))) o[type] = value;
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
}

/** The UTC instant at which the clock in `tz` reads the given wall time. */
export function zonedToUtc(y, mo, d, h, mi, s, tz) {
  const target = Date.UTC(y, mo - 1, d, h, mi, s);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(guess, tz);
    const shown = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
    const diff = target - shown;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

/** 'h:mm AM' from 24h parts, the same shape the Canvas snapshot uses for dueTime. */
export function clock12(h, mi) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(mi)} ${ampm}`;
}

/**
 * Decode one DTSTART/DTEND into the course's local frame.
 * @returns {{ date: string, time: string|null, at: string|null, allDay: boolean } | null}
 */
export function decodeDate(prop, tz = DEFAULT_TZ) {
  if (!prop) return null;
  const v = prop.value.trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (prop.params.VALUE === 'DATE' || h === undefined) {
    return { date: `${y}-${mo}-${d}`, time: null, at: null, allDay: true };
  }
  const zone = prop.params.TZID || tz;
  const ms = z
    ? Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0))
    : zonedToUtc(+y, +mo, +d, +h, +mi, +(s || 0), zone);
  const local = partsIn(ms, tz);
  return {
    date: `${local.y}-${pad(local.mo)}-${pad(local.d)}`,
    time: clock12(local.h, local.mi),
    at: new Date(ms).toISOString(),
    allDay: false,
  };
}

/**
 * Parse a whole feed into plain events.
 * @returns {{ calName: string|null, events: Array<{uid, summary, description, url, location, start, end}> }}
 */
export function parseIcs(text, tz = DEFAULT_TZ) {
  const lines = unfold(text).split('\n');
  const events = [];
  let calName = null;
  let cur = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur) {
        events.push({
          uid: cur.UID ? cur.UID.value : null,
          summary: cur.SUMMARY ? unescapeText(cur.SUMMARY.value) : '',
          description: cur.DESCRIPTION ? unescapeText(cur.DESCRIPTION.value) : '',
          url: cur.URL ? cur.URL.value.trim() : null,
          location: cur.LOCATION ? unescapeText(cur.LOCATION.value) : '',
          start: decodeDate(cur.DTSTART, tz),
          end: decodeDate(cur.DTEND, tz),
        });
      }
      cur = null;
      continue;
    }
    const p = parseLine(line);
    if (!p) continue;
    if (cur) {
      if (!(p.name in cur)) cur[p.name] = p;
    } else if (p.name === 'X-WR-CALNAME') {
      calName = unescapeText(p.value);
    }
  }
  return { calName, events };
}
