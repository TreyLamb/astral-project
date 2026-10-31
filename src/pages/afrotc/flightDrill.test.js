// The Flight Drill Sim (public/flight-drill/) is a static tool: classic scripts, no build step, so it opens
// from disk. These tests load the same files the browser loads, through node:vm, and hold the drill
// geometry to the manual: DAFPAM 34-1203 / AFMAN 36-2203 ch. 4 and the Det 855 ORI procedure.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../../../public/flight-drill/', import.meta.url));
function load() {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['engine.js', 'commands.js', 'scripts.js']) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f });
  return { E: ctx.DrillEngine, K: ctx.DrillCommands, SC: ctx.DrillScripts };
}
const { E, K, SC } = load();

function fresh(o) { return E.createState({ seed: 7, opts: { misalign: false }, ...o }); }
function run(S, id, arg, { extra = 0 } = {}) {
  const res = K.give(S, id, arg);
  if (!res.ok) throw new Error(`${id}: ${res.reason}`);
  let n = 0;
  while ((E.busy(S) || E.actorsBusy(S)) && n++ < 400) E.tick(S);
  for (let i = 0; i < extra; i++) E.tick(S);
  return res;
}
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const EL = (S, i) => S.ppl[S.flight.elements[i][0]];
const lateral = (S, p) => E.dot(p, E.dir(S.flight.h + 90));
const along = (S, p) => E.dot(p, E.dir(S.flight.h));

describe('forming the flight', () => {
  it('defaults to three elements of five in line, centred three paces in front of you', () => {
    const S = fresh();
    expect(S.flight.elements.map((e) => e.length)).toEqual([5, 5, 5]);
    expect(E.analyze(S).type).toBe('line');
    const fc = S.ppl.fc, mid = S.ppl[S.flight.elements[0][2]];
    expect(near(E.dist(fc, mid), 72)).toBe(true);
    expect(near(mid.x, fc.x)).toBe(true);
    // guidon bearer on the flight's right of the first element leader, at the same interval
    const g = S.ppl.g, el = EL(S, 0);
    expect(near(g.y, el.y)).toBe(true);
    expect(near(g.x - el.x, 40)).toBe(true);
  });

  it('squares off the left flank by filling the rear elements first (4.3.1.4)', () => {
    expect(fresh({ cadets: 14 }).flight.elements.map((e) => e.length)).toEqual([4, 5, 5]);
    expect(fresh({ elements: 4, cadets: 15 }).flight.elements.map((e) => e.length)).toEqual([3, 4, 4, 4]);
  });

  it('counts the guidon bearer in the centring only when the files are even (Det ORI p.1)', () => {
    expect(E.centerFile(fresh({ cadets: 12 }))).toBe(1);   // 4 across + guidon = 5 positions
    expect(E.centerFile(fresh({ cadets: 15 }))).toBe(2);   // 5 across: centred on the middle cadet
    expect(E.centerFile(fresh({ cadets: 12, guidon: false }))).toBe(1.5);
  });
});

describe('facings and the guide', () => {
  it('Right FACE makes a column with the guide in front of the right file; Left FACE puts it back', () => {
    const S = fresh();
    run(S, 'rightFace');
    expect(E.analyze(S).type).toBe('column');
    expect(S.flight.h).toBe(90);
    const right = EL(S, 2);
    expect(near(S.ppl.g.x - right.x, 40)).toBe(true);
    expect(near(S.ppl.g.y, right.y)).toBe(true);
    run(S, 'leftFace');
    expect(E.analyze(S).type).toBe('line');
    expect(near(S.ppl.g.y, EL(S, 0).y)).toBe(true);
  });
});

describe('open and close ranks', () => {
  it('steps each element forward once per element behind it, leaving 64 inches between ranks', () => {
    const S = fresh();
    const before = [0, 1, 2].map((i) => EL(S, i).y);
    run(S, 'openRanks');
    const after = [0, 1, 2].map((i) => EL(S, i).y);
    expect(before.map((b, i) => Math.round((b - after[i]) / 24))).toEqual([2, 1, 0]);
    expect(near(after[1] - after[0], 64)).toBe(true);
    expect(near(after[2] - after[1], 64)).toBe(true);
    expect(E.analyze(S).open).toBe(true);
    expect(S.flight.posture).toBe('dress');
    run(S, 'readyFront');
    run(S, 'closeRanks');
    expect(near(EL(S, 1).y - EL(S, 0).y, 40)).toBe(true);
    expect(near(EL(S, 0).y, after[0])).toBe(true);   // the first element stands fast
  });

  it('leaves cadets out of line when asked, and "move up/back" squares them away', () => {
    const S = E.createState({ seed: 3, opts: { misalign: true } });
    run(S, 'openRanks');
    const off = E.misaligned(S);
    expect(off.length).toBeGreaterThan(0);
    for (const p of off) while (E.len(p.off) > 0.5) E.adjust(S, p.id, E.dot(p.off, E.dir(S.flight.h)) > 0 ? -1 : 1);
    expect(E.misaligned(S)).toHaveLength(0);
  });
});

describe('count off and sizing', () => {
  it('numbers each element from its leader (4.3.3)', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'countOff');
    for (const ids of S.flight.elements) expect(ids.map((id) => S.ppl[id].num)).toEqual([1, 2, 3, 4, 5]);
  });

  it('in column, sizes each element tallest to the front with the element leaders standing fast', () => {
    const S = fresh();
    const leaders = S.flight.elements.map((e) => e[0]);
    run(S, 'rightFace');
    run(S, 'sizing');
    expect(S.flight.elements.map((e) => e[0])).toEqual(leaders);
    for (const ids of S.flight.elements) {
      const h = ids.slice(1).map((id) => S.ppl[id].height);
      expect(h).toEqual([...h].sort((a, b) => b - a));
    }
  });

  it('in inverted line, sorts each file across the elements with no exceptions', () => {
    const S = fresh({ seed: 11 });
    run(S, 'rightFace'); run(S, 'rightFace');
    expect(E.analyze(S).type).toBe('invline');
    run(S, 'sizing');
    const n = S.flight.elements[0].length;
    for (let j = 0; j < n; j++) {
      const front = S.flight.elements.map((e) => S.ppl[e[j]].height).reverse();   // element 3 is the front rank
      expect(front).toEqual([...front].sort((a, b) => b - a));
    }
    for (const [i, ids] of S.flight.elements.entries()) for (const id of ids) expect(S.ppl[id].el).toBe(i);
  });
});

describe('marching', () => {
  it('Column Right wheels the column 90° on the right file, then only Forward, MARCH is allowed (4.11)', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'forward', null, { extra: 3 });
    const res = run(S, 'columnRight');
    expect(res.waited).toBeLessThanOrEqual(1);
    expect(S.flight.h).toBe(180);
    expect(E.analyze(S).type).toBe('column');
    // lateral grows to the flight's right: the third element (the pivot file) is the right file
    const lat = [0, 1, 2].map((i) => lateral(S, EL(S, i)));
    expect(near(lat[1] - lat[0], 40)).toBe(true);
    expect(near(lat[2] - lat[1], 40)).toBe(true);
    const lon = [0, 1, 2].map((i) => along(S, EL(S, i)));
    expect(Math.max(...lon) - Math.min(...lon)).toBeLessThan(0.6);
    expect(S.flight.mode).toBe('half');
    expect(K.give(S, 'halt').ok).toBe(false);
    expect(K.give(S, 'halt').reason).toMatch(/Forward, MARCH/);
    run(S, 'forward');
    expect(S.flight.mode).toBe('quick');
    // the guide is still in front of the right file (now the westmost)
    expect(near(lateral(S, S.ppl.g), lateral(S, EL(S, 2)))).toBe(true);
  });

  it('Column Left from a halt, and the column half movements, keep 40-inch intervals', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'columnLeft');
    expect(S.flight.h).toBe(0);
    run(S, 'forward', null, { extra: 2 });
    run(S, 'columnHalfRight', null, { extra: 2 });
    expect(S.flight.h).toBe(45);
    const lat = [0, 1, 2].map((i) => lateral(S, EL(S, i)));
    expect(near(Math.abs(lat[0] - lat[1]), 40, 1)).toBe(true);
    expect(S.flight.mode).toBe('quick');
  });

  it('flanks turn everyone at once; to the rear reverses; halt takes two counts', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'forward', null, { extra: 2 });
    run(S, 'rightFlank');
    expect(S.flight.h).toBe(180);
    expect(E.analyze(S).type).toBe('invline');
    run(S, 'leftFlank');
    run(S, 'toTheRear');
    expect(S.flight.h).toBe(270);
    expect(E.analyze(S).type).toBe('invcol');
    const t = S.t;
    run(S, 'halt');
    expect(S.t - t).toBe(2);
    expect(S.flight.mode).toBe('halted');
  });

  it('the counter march reverses the column; the fourth file stays the right flank (4.16)', () => {
    const S = fresh({ elements: 4, cadets: 16 });
    run(S, 'rightFace');
    run(S, 'forward', null, { extra: 2 });
    const before = lateral(S, EL(S, 3));
    run(S, 'counterMarch');
    expect(S.flight.h).toBe(270);
    const lat = [0, 1, 2, 3].map((i) => lateral(S, EL(S, i)));
    expect(lat[3]).toBe(Math.max(...lat));
    for (let i = 0; i < 3; i++) expect(near(lat[i + 1] - lat[i], 40)).toBe(true);
    expect(Number.isFinite(before)).toBe(true);
    expect(S.flight.awaitForward).toBe(true);
  });

  it('close and extend march change the interval in column (4.10)', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'closeMarch');
    expect(E.analyze(S).close).toBe(true);
    expect(near(Math.abs(lateral(S, EL(S, 1)) - lateral(S, EL(S, 0))), 22)).toBe(true);
    run(S, 'extendMarch');
    expect(E.analyze(S).close).toBe(false);
    run(S, 'forward', null, { extra: 1 });
    run(S, 'closeMarch');
    run(S, 'forward', null, { extra: 1 });
    expect(E.analyze(S).close).toBe(true);
  });

  it('column of files strings the flight out right element first, and re-forms it', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'filesRight', null, { extra: 2 });
    expect(E.analyze(S).type).toBe('free');
    expect(E.fileGroups(S)).toHaveLength(1);
    const order = E.fileGroups(S)[0].ids.map((id) => S.ppl[id].el);
    expect(order[0]).toBe(2);
    expect(order[order.length - 1]).toBe(0);
    run(S, 'halt');
    run(S, 'reformLeft');
    expect(E.analyze(S).type).toBe('column');
  });

  it('a foot-specific command waits for its foot while marching', () => {
    const S = fresh();
    run(S, 'rightFace');
    run(S, 'forward');
    while (S.foot !== 'L') E.tick(S);
    const res = K.give(S, 'columnRight');
    expect(res.waited).toBe(1);
    expect(S.foot).toBe('R');
  });

  it('you keep your place on the flight through column movements when marching with it', () => {
    const S = fresh({ opts: { misalign: false, fcFollow: true } });
    run(S, 'leftFace'); run(S, 'aboutFace');
    const side = () => E.dot(E.sub(S.ppl.fc, E.center(S)), E.dir(S.flight.h + 90));
    const start = side();
    run(S, 'forward', null, { extra: 2 });
    for (const id of ['columnRight', 'forward', 'toTheRear', 'toTheRear', 'columnRight', 'forward']) run(S, id, null, { extra: 2 });
    expect(near(side(), start, 2)).toBe(true);
  });
});

describe('what may be given when', () => {
  const why = (S, id) => K.check(S, id);
  it('rejects the classic mistakes with the reason', () => {
    const S = fresh();
    expect(why(S, 'halfStep')).toMatch(/marching/);
    expect(why(S, 'columnRight')).toMatch(/column/);
    run(S, 'rightFace');
    expect(why(S, 'openRanks')).toMatch(/line/);
    run(S, 'leftFace');
    run(S, 'dressRight');
    expect(why(S, 'rightFace')).toMatch(/Ready, FRONT/);
    run(S, 'readyFront');
    run(S, 'paradeRest');
    expect(why(S, 'forward')).toMatch(/attention/);
  });

  it('every command has a description, a source and a valid group', () => {
    for (const c of K.CMDS) {
      expect(c.info.length).toBeGreaterThan(20);
      expect(c.ref.length).toBeGreaterThan(2);
      expect(c.group).toBeTruthy();
    }
    expect(new Set(K.CMDS.map((c) => c.id)).size).toBe(K.CMDS.length);
  });
});

describe('the ORI script', () => {
  it('covers every command in the Det 855 procedure, in order', () => {
    const S = fresh();
    const def = SC.SCRIPTS.find((d) => d.id === 'ori');
    const cmds = def.build(S).filter((s) => s.kind === 'cmd').map((s) => s.cmd);
    expect(cmds).toEqual([
      'fallIn', 'rightFace', 'sizing', 'rightFace', 'sizing', 'leftFace', 'sizing', 'countOff', 'countOff', 'leftFace',
      'openRanks', 'readyFront', 'reportIn', 'elemsParade', 'attention', 'reportOut', 'rest', 'attention', 'closeRanks', 'readyFront', 'fallOut',
    ]);
    for (const s of def.build(S)) if (s.cmd) expect(K.byId[s.cmd]).toBeTruthy();
  });

  it('runs end to end when each step is done the regulation way', () => {
    const S = E.createState({ seed: 5, opts: { misalign: true } });
    const steps = SC.SCRIPTS.find((d) => d.id === 'ori').build(S);
    for (const st of steps) {
      if (st.kind === 'cmd' || st.kind === 'insp') {
        for (let k = 0; k < (st.times || 1); k++) run(S, st.cmd);
      } else if (st.kind === 'fc') {
        const t = st.target(S);
        Object.assign(S.ppl.fc, { x: t.x, y: t.y, h: t.h, prog: [], marching: false });
        expect(SC.fcCheck(st, S).ok).toBe(true);
      } else if (st.kind === 'align') {
        for (const p of E.misaligned(S, st.el)) while (E.len(p.off) > 0.5) E.adjust(S, p.id, E.dot(p.off, E.dir(S.flight.h)) > 0 ? -1 : 1);
        expect(SC.alignDone(st, S)).toBe(true);
      }
    }
    expect(S.flight.posture).toBe('fallout');
  });
});
