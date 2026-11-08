// Builds the WhenIsGood results PDF in the same layout as Downloads/WhenIsGood Results.pdf:
// one grid per day, one row per cadet, green bars for free hours, hatched = not offered,
// free-per-hour row, top-5 two-hour blocks shaded (#1 gold), check mark = free for the #1 block.
import fs from 'node:fs';
import { chromium } from 'playwright';

const [, , eventsFile, outPdf, heading] = process.argv;
const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
const HOUR = 3600000;
const BLOCK_HOURS = 2;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// WhenIsGood stores wall-clock times as if they were UTC, so UTC fields ARE the displayed time.
const hourLabel = (t) => { const h = new Date(t).getUTCHours(); return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`; };
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
const dayLabel = (t) => new Date(t).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

function analyse(ev) {
  const offered = new Set(ev.offered.map((o) => o.t));
  const people = ev.resp.filter((r) => r.included !== false).map((r) => ({ name: r.name, free: new Set(r.slots.filter((t) => offered.has(t))) }));
  const count = (t) => people.filter((p) => p.free.has(t)).length;
  // Every window of BLOCK_HOURS consecutive offered hours, scored by how many people are free for all of it.
  const windows = [];
  for (const t of [...offered].sort((a, b) => a - b)) {
    const hrs = Array.from({ length: BLOCK_HOURS }, (_, k) => t + k * HOUR);
    if (!hrs.every((h) => offered.has(h))) continue;
    windows.push({ start: t, end: t + BLOCK_HOURS * HOUR, score: people.filter((p) => hrs.every((h) => p.free.has(h))).length });
  }
  windows.sort((a, b) => b.score - a.score || a.start - b.start);
  const bands = [];
  for (const w of windows) {
    if (w.score === 0) break;
    const twin = bands.find((b) => b.score === w.score && w.start <= b.end && w.end >= b.start);
    if (twin && Math.max(twin.end, w.end) - Math.min(twin.start, w.start) <= (BLOCK_HOURS + 1) * HOUR) { twin.start = Math.min(twin.start, w.start); twin.end = Math.max(twin.end, w.end); continue; }
    if (bands.some((b) => w.start < b.end && w.end > b.start)) continue;
    if (bands.length < 5) bands.push({ ...w });
  }
  bands.sort((a, b) => b.score - a.score || a.start - b.start);
  bands.forEach((b, i) => { b.rank = i + 1; });
  const best = bands[0];
  const inBest = (p) => best && Array.from({ length: (best.end - best.start) / HOUR }, (_, k) => best.start + k * HOUR).every((h) => p.free.has(h));
  const days = [...new Set([...offered].map(dayKey))].sort();
  return { offered, people, count, bands, best, inBest, days };
}

function dayGrid(ev, a, day) {
  const hours = [...a.offered].filter((t) => dayKey(t) === day).sort((x, y) => x - y);
  const first = hours[0];
  const last = hours[hours.length - 1];
  const cols = Array.from({ length: (last - first) / HOUR + 1 }, (_, k) => first + k * HOUR);
  const N = cols.length;
  const dayBands = a.bands.filter((b) => b.start >= first && b.end <= last + HOUR);
  let h = `<div class="grid" style="grid-template-columns:150px repeat(${N},1fr)">`;
  h += `<div class="hd who">Who</div>` + cols.map((t, c) => `<div class="hd" style="grid-column:${c + 2}">${hourLabel(t)}</div>`).join('');
  a.people.forEach((p, r) => {
    const mark = a.inBest(p) && dayBands.some((b) => b.rank === 1) ? ' <span class="ck">&#10003;</span>' : '';
    h += `<div class="nm" style="grid-row:${r + 2}">${esc(p.name)}${mark}</div>`;
    cols.forEach((t, c) => { h += `<div class="cell${a.offered.has(t) ? '' : ' off'}" style="grid-row:${r + 2};grid-column:${c + 2}"></div>`; });
    for (let c = 0; c < N;) {
      if (!p.free.has(cols[c])) { c++; continue; }
      let e = c;
      while (e + 1 < N && p.free.has(cols[e + 1])) e++;
      h += `<div class="bar" style="grid-row:${r + 2};grid-column:${c + 2}/${e + 3}"></div>`;
      c = e + 1;
    }
  });
  const fr = a.people.length + 2;
  h += `<div class="ft who" style="grid-row:${fr}">Free per hour</div>` + cols.map((t, c) => `<div class="ft" style="grid-row:${fr};grid-column:${c + 2}">${a.count(t)}</div>`).join('');
  dayBands.forEach((b) => {
    const c0 = (b.start - first) / HOUR;
    const span = (b.end - b.start) / HOUR;
    h += `<div class="band${b.rank === 1 ? ' gold' : ''}" style="grid-row:1/${fr + 1};grid-column:${c0 + 2}/span ${span}"><span class="badge">#${b.rank}</span></div>`;
  });
  h += '</div><p class="cap">Bars = free for the whole hour. Grey = hour not offered in this poll. Shaded bands = top-5 blocks (#1 = best). &#10003; = free for the #1 block.</p>';
  return `<section class="day"><h3>${esc(ev.title)} &mdash; ${dayLabel(first)}</h3>${h}</section>`;
}

const css = `
@page { size: 11in 8.5in; margin: 0.45in; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Segoe UI", Inter, Arial, sans-serif; color: #1a2233; font-size: 11px; }
h1 { font-size: 22px; margin: 0 0 4px; } .sub { color: #5b6577; font-size: 12px; margin: 0 0 14px; }
h2 { font-size: 16px; margin: 0 0 2px; } .meta { color: #5b6577; margin: 0 0 12px; font-size: 11.5px; } .meta a { color: #1a56db; }
h3 { font-size: 12.5px; margin: 14px 0 6px; }
.event { break-before: page; } .event:first-of-type { break-before: auto; } .day { break-inside: avoid; }
.grid { display: grid; position: relative; border: 1px solid #e3e7ef; border-radius: 8px; overflow: hidden; background: #fff; }
.hd { background: #f6f8fc; color: #6b7487; font-size: 9px; text-align: center; padding: 5px 0; grid-row: 1; border-left: 1px solid #eef1f6; }
.hd.who, .ft.who { text-align: left; padding-left: 8px; font-weight: 600; color: #4a5468; border-left: 0; font-size: 10px; }
.nm { padding: 3px 8px; font-size: 10px; border-bottom: 1px solid #f0f2f7; grid-column: 1; display: flex; align-items: center; gap: 4px; }
.ck { color: #17803d; }
.cell { border-left: 1px solid #eef1f6; border-bottom: 1px solid #f6f7fb; }
.cell.off { background: #eceef3; }
.bar { background: #167a43; border-radius: 6px; margin: 4px 0; height: 8px; align-self: center; z-index: 1; }
.ft { background: #f6f8fc; text-align: center; font-weight: 700; padding: 5px 0; font-size: 10px; border-left: 1px solid #eef1f6; border-top: 1px solid #e3e7ef; }
.band { background: rgba(70, 110, 220, .10); border-left: 1.5px solid #4c6ef5; border-right: 1.5px solid #4c6ef5; z-index: 2; pointer-events: none; position: relative; }
.band.gold { background: rgba(240, 180, 41, .22); border-color: #b8860b; }
.badge { position: absolute; top: 24px; left: -2px; background: #2f5bea; color: #fff; font-weight: 700; font-size: 8px; padding: 1px 5px; border-radius: 9px; }
.band.gold .badge { background: #e8a710; color: #3d2a00; }
.cap { color: #7a8396; font-size: 9px; margin: 5px 0 0; }
`;

let body = `<h1>${esc(heading)}</h1><p class="sub">${events.length} event${events.length === 1 ? '' : 's'} &middot; one row per cadet, green bars where they are free, shaded bands on the top 5 blocks (#1 in gold)</p>`;
events.forEach((ev) => {
  const a = analyse(ev);
  const url = `https://whenisgood.net/${ev.id}`;
  body += `<div class="event"><h2>${esc(ev.title)}</h2><p class="meta">${ev.resp.length} response${ev.resp.length === 1 ? '' : 's'} &middot; <a href="${url}">${url}</a></p>`;
  body += a.days.map((d) => dayGrid(ev, a, d)).join('') + '</div>';
  console.log(ev.title, '| bands:', a.bands.map((b) => `#${b.rank} ${dayLabel(b.start)} ${hourLabel(b.start)}-${hourLabel(b.end)} (${b.score})`).join('; '));
});
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(heading)}</title><style>${css}</style></head><body>${body}</body></html>`;
const htmlPath = outPdf.replace(/\.pdf$/, '.html');
fs.writeFileSync(htmlPath, html);
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await p.pdf({ path: outPdf, preferCSSPageSize: true, printBackground: true });
await b.close();
console.log('wrote', outPdf);
