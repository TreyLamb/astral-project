// Writes public/schedule.json from the plan file, for the Scriptable widget on Trey's iPhone
// (public/scriptable/ScheduleWidget.js fetches https://astral-project.vercel.app/schedule.json).
// Runs automatically before every build and dev server (npm prebuild / predev), so a pushed plan
// change reaches the phone with no extra step. The JSON is generated, so it is gitignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAN, IMPORTANT_DATES, KIND_COLORS } from '../src/pages/fitnesstracker/studyPlan.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const days = {};
for (const e of PLAN) {
  (days[e.date] ||= []).push({
    start: e.start, end: e.end, kind: e.kind, title: e.title,
    course: e.course ?? null, note: e.note ?? null, color: KIND_COLORS[e.kind] ?? '#94a3b8',
  });
}
for (const list of Object.values(days)) list.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));

const out = { generatedAt: new Date().toISOString(), timezone: 'America/Denver', days, important: IMPORTANT_DATES, colors: KIND_COLORS };
fs.writeFileSync(path.join(root, 'public', 'schedule.json'), JSON.stringify(out));
console.log(`schedule.json: ${Object.keys(days).length} days, ${PLAN.length} entries`);
