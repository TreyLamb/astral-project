import fs from 'node:fs';
import { chromium } from 'playwright';
const D = process.env.WIG_DIR;
const EVENTS = process.argv[2] ? JSON.parse(process.argv[2]) : [['zy93xgw', 'hxegihf'], ['5qi8qhk', 'kk3pz3i']];
const OUT = process.argv[3] || D + '/wig/events.json';
const b = await chromium.launch();
const ctx = await b.newContext({ storageState: D + '/wstate.json', viewport: { width: 1400, height: 1400 } });
const p = await ctx.newPage();
const out = [];
for (const [id, code] of EVENTS) {
  await p.goto(`https://whenisgood.net/${id}`, { waitUntil: 'networkidle' });
  const body = await p.innerText('body');
  const durM = body.match(/duration:\s*(\d+)\s*minutes?/i);
  await p.goto(`https://whenisgood.net/${id}/results/${code}`, { waitUntil: 'networkidle' });
  const data = await p.evaluate(() => {
    const resp = Object.values(window.respondents || {}).map((r) => ({ name: r.name, included: r.included, updated: r.updated, slots: (r.myCanDos || []).map(Number) }));
    const offered = [...document.querySelectorAll('td.slot')].map((td) => ({ t: Number(td.id), proposed: td.classList.contains('proposed') })).filter((x) => x.t);
    return { title: document.title.replace(/^WhenIsGood:\s*/, '').replace(/\s*Event Results$/, ''), resp, offered };
  });
  out.push({ id, duration: durM ? Number(durM[1]) : null, ...data });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const e of out) console.log(e.id, e.title, 'dur', e.duration, 'resp', e.resp.length, 'offered', e.offered.length, 'proposed', e.offered.filter(o => o.proposed).length, e.resp.map(r => `${r.name}:${r.slots.length}${r.included ? '' : '(excl)'}`).join(' | '));
await b.close();
