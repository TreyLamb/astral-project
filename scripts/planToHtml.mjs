// Prints the study plan (src/pages/fitnesstracker/studyPlan.js) as a phone-friendly list page.
// Usage: node scripts/planToHtml.mjs <output.html>
import fs from 'node:fs';
import { PLAN, KIND_COLORS, KIND_LABELS, clock, minutesOf, workHoursByDay } from '../src/pages/fitnesstracker/studyPlan.js';

const out = process.argv[2];
if (!out) { console.error('usage: node scripts/planToHtml.mjs <output.html>'); process.exit(1); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hours = workHoursByDay();
const days = [...new Set(PLAN.map((e) => e.date))].sort();
const dayName = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const dur = (m) => (m % 60 === 0 ? `${m / 60}h` : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

let body = '';
for (const d of days) {
  const items = PLAN.filter((e) => e.date === d).sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
  const h = hours[d];
  const heavy = h > 5;
  body += `<section><h2>${esc(dayName(d))}${h ? `<span class="hrs${heavy ? ' heavy' : ''}">${h.toFixed(1)} h work${heavy ? ' (long day, planned)' : ''}</span>` : ''}</h2><ul>`;
  for (const e of items) {
    const when = e.start ? `${clock(e.start)}${e.end ? ` – ${clock(e.end)}` : ''}` : 'All day';
    const len = e.start && e.end ? ` · ${dur(minutesOf(e))}` : '';
    body += `<li><span class="dot" style="background:${KIND_COLORS[e.kind]}"></span><div><b>${esc(e.title)}</b><div class="when">${when}${len} · ${KIND_LABELS[e.kind]}${e.course ? ` · ${esc(e.course)}` : ''}</div>${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}</div></li>`;
  }
  body += '</ul></section>';
}
const css = `:root{--bg:#fff;--ink:#1d2430;--soft:#5b6675;--line:#d9dee6;--acc:#14637a}
@media (prefers-color-scheme:dark){:root{--bg:#10151b;--ink:#e6ebf1;--soft:#9aa6b4;--line:#2b3440;--acc:#6cc3dc}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:44rem;margin:0 auto;padding:1rem 16px 4rem}h1{font-size:1.4rem;margin:.2rem 0 .1rem}.sub{color:var(--soft);margin:0 0 1rem}
section{border-top:1px solid var(--line);padding-top:.4rem;margin-top:1rem}h2{font-size:1.15rem;margin:.3rem 0;color:var(--acc);display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap;align-items:baseline}
.hrs{font-size:.82rem;font-weight:500;color:var(--soft)}.hrs.heavy{color:#d97706;font-weight:650}
ul{list-style:none;padding:0;margin:0}li{display:flex;gap:.65rem;padding:.45rem 0}.dot{flex:none;width:.7rem;height:.7rem;border-radius:50%;margin-top:.45rem}
.when{color:var(--soft);font-size:.88rem}.note{font-size:.88rem;margin-top:.1rem}`;
fs.writeFileSync(out, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Week plan, Oct 23 to 31</title><style>${css}</style></head><body><main><h1>Week plan, Oct 23 to Oct 31</h1><p class="sub">Same plan as the MFT calendar. Green = work block, blue = fixed, purple = class, gray = travel, red = deadline.</p>${body}</main></body></html>`);
console.log('wrote', out);
