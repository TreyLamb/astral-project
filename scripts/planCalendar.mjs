// Builds two phone-friendly views of the study plan (src/pages/fitnesstracker/studyPlan.js):
//   Week_Plan.html  a time-axis calendar (30-minute rows, day or week view)
//   Week_Plan.ics   the same blocks as real calendar events with alarms, importable into Apple/Google Calendar
// Usage: node scripts/planCalendar.mjs <outDir> [firstDate] [lastDate]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAN } from '../src/pages/fitnesstracker/studyPlan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
const first = process.argv[3] ?? '2026-10-25';
const last = process.argv[4] ?? '2026-10-31';
if (!outDir) { console.error('usage: node scripts/planCalendar.mjs <outDir> [firstDate] [lastDate]'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const rows = PLAN.filter((e) => e.date >= first && e.date <= last).map((e) => ({
  date: e.date, start: e.start, end: e.end, kind: e.kind, title: e.title, course: e.course ?? '', note: e.note ?? '',
}));

// ── HTML ──
const tpl = fs.readFileSync(path.join(here, 'planCalendar.template.html'), 'utf8');
const json = JSON.stringify(rows).split('<').join('\\u003c');
fs.writeFileSync(path.join(outDir, 'Week_Plan.html'), tpl.replace('__DATA__', json));

// ── ICS ──
const esc = (s) => String(s).split('\\').join('\\\\').split(';').join('\\;').split(',').join('\\,').split('\n').join('\\n');
const stamp = '20261025T200000Z';
const dt = (d, t) => `${d.split('-').join('')}T${t.split(':').join('')}00`;
const addMin = (t, m) => { const [h, mi] = t.split(':').map(Number); const x = Math.min(h * 60 + mi + m, 23 * 60 + 59); return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chief of Staff//Week plan//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Catch-up week'];
const alarm = (trigger, text) => ['BEGIN:VALARM', `TRIGGER:${trigger}`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, 'END:VALARM'];
let n = 0;
for (const e of rows) {
  n += 1;
  const uid = `plan-${e.date}-${n}@chief-of-staff`;
  const desc = [e.course, e.note].filter(Boolean).join('. ');
  const base = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `SUMMARY:${esc(e.title)}`];
  if (desc) base.push(`DESCRIPTION:${esc(desc)}`);
  if (!e.start) {
    const next = new Date(`${e.date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    lines.push(...base, `DTSTART;VALUE=DATE:${e.date.split('-').join('')}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).split('-').join('')}`, 'END:VEVENT');
    continue;
  }
  if (e.kind === 'due' || !e.end) {
    lines.push(...base, `DTSTART;TZID=America/Denver:${dt(e.date, e.start)}`, `DTEND;TZID=America/Denver:${dt(e.date, addMin(e.start, 15))}`,
      ...alarm('-PT2H', e.title), ...alarm('-PT30M', e.title), 'END:VEVENT');
    continue;
  }
  const al = [];
  if (e.kind === 'work') al.push(...alarm('PT0S', `${e.title}`));
  else if (e.kind === 'fixed' || e.kind === 'class') al.push(...alarm('-PT30M', `${e.title} in 30 minutes`));
  lines.push(...base, `DTSTART;TZID=America/Denver:${dt(e.date, e.start)}`, `DTEND;TZID=America/Denver:${dt(e.date, e.end)}`, ...al, 'END:VEVENT');
}
lines.push('END:VCALENDAR');
fs.writeFileSync(path.join(outDir, 'Week_Plan.ics'), lines.join('\r\n') + '\r\n');
console.log('wrote', rows.length, 'blocks to', outDir);
