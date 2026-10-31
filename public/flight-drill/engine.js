/* Flight Drill Sim: simulation engine. Pure (no DOM). A classic script rather than a module so the tool
   opens straight from disk (file://) as well as from the site; the vitest suite loads it through node:vm.

   Units are inches. x grows east, y grows south (SVG). Headings are compass degrees: 0 = north (up the
   screen), clockwise. Time advances one COUNT at a time - one step of the cadence.

   Sources: DAFPAM 34-1203 (13 Sep 2022) as carried from AFMAN 36-2203 (2013/2016) ch. 3-4, whose paragraph
   numbers are the ones cited below; Det 855 "Open Ranks Inspection (ORI) Procedures", 10 Jul 2025; AFJROTC
   "Drill Pamphlet and 30-Step" (Aug 2022). */
(function (root) {
  'use strict';

  const C = {
    PACE: 24, HALF: 12, DOUBLE: 30, SIDE: 12, BACK: 12,
    NORMAL: 40,   // center-to-center at normal interval, and the 40-inch distance between ranks
    CLOSE: 22,    // center-to-center at close interval: 4 inches between shoulders
    OPEN: 64,     // between ranks once opened (Det ORI: "a 64 inch space between each element")
    WALK: 40,     // a cadet walking to a new spot (fall in, re-form) covers about this per count
    INSPECT: 30,  // the inspector stands this far in front of the cadet being inspected
  };
  const MOVING = { quick: 24, half: 12, double: 30, mark: 0, route: 24, atease: 24, rstep: 0, lstep: 0 };
  const SPACINGS = [C.CLOSE, C.NORMAL, C.OPEN];

  // ---------- geometry ----------
  const rad = (d) => (d * Math.PI) / 180;
  const nh = (h) => { let v = h % 360; if (v < 0) v += 360; v = Math.round(v * 1e6) / 1e6; return v >= 360 ? 0 : v; };
  const dir = (h) => ({ x: Math.sin(rad(h)), y: -Math.cos(rad(h)) });
  const hdg = (v) => nh((Math.atan2(v.x, -v.y) * 180) / Math.PI);
  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const len = (a) => Math.hypot(a.x, a.y);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const hdiff = (a, b) => { const d = nh(a - b); return d > 180 ? d - 360 : d; };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
  const NUMS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
  const numWord = (n) => NUMS[n - 1] || String(n);

  function rand(S) {
    let t = (S.seed = (S.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- state ----------
  function person(id, role, extra) {
    return Object.assign({
      id, role, el: -1, x: 0, y: 0, h: 0, posture: 'att', head: 0, arm: null, num: null,
      height: 70, prog: [], off: { x: 0, y: 0 }, hidden: false, marching: false, follow: false,
    }, extra || {});
  }

  function createState(o) {
    o = o || {};
    const S = {
      v: 1, t: 0, foot: null, seed: (o.seed == null ? 20251028 : o.seed) | 0,
      ppl: {}, order: [], flight: null, man: null, events: [], insp: null,
      name: o.flightName || 'Charlie',
      opts: Object.assign({ fcFollow: true, misalign: true, postPaces: 3 }, o.opts || {}),
    };
    S.ppl.fc = person('fc', 'fc', { x: 0, y: 0, h: 180, label: 'FC' });
    S.ppl.insp = person('insp', 'insp', { hidden: true, label: 'Inspector' });
    buildFlight(S, { elements: o.elements || 3, cadets: o.cadets || 15, guidon: o.guidon !== false, deputy: !!o.deputy });
    return S;
  }

  /** (Re)build the cadets around the commander's current pose and form them in line, instantly. */
  function buildFlight(S, cfg) {
    const E = clamp(cfg.elements | 0, 1, 6);
    const N = clamp(cfg.cadets | 0, E, 60);
    const keep = { fc: S.ppl.fc, insp: S.ppl.insp };
    S.ppl = keep;
    keep.insp.hidden = true; keep.insp.prog = [];
    // 4.3.1.4: the left flank is squared off with the extras filling the REAR elements first.
    const base = Math.floor(N / E), extra = N % E;
    const elements = [];
    let k = 0;
    for (let i = 0; i < E; i++) {
      const size = base + (i >= E - extra ? 1 : 0);
      const ids = [];
      for (let j = 0; j < size; j++) {
        const id = 'c' + (++k);
        S.ppl[id] = person(id, 'cadet', { el: i, height: Math.round(62 + rand(S) * 14) });
        ids.push(id);
      }
      elements.push(ids);
    }
    let guide = null;
    if (cfg.guidon) { guide = 'g'; S.ppl.g = person('g', 'guide', { label: 'Guidon' }); }
    const last = elements[E - 1];
    S.flight = {
      elements, guide, deputy: cfg.deputy && last.length ? last[last.length - 1] : null,
      grid: null, h: 0, mode: 'halted', posture: 'att', awaitForward: false, guideSide: 'R', phase: 0,
      cfg: { elements: E, cadets: N, guidon: !!cfg.guidon, deputy: !!cfg.deputy },
    };
    // Update order matters: the guide and commander track cadets ("ahead of", "beside"), and a shadowing
    // commander tracks the inspector, so each moves after whatever it reads from in the same count.
    S.order = [...elements.flat(), ...(guide ? ['g'] : []), 'insp', 'fc'];
    S.man = null; S.insp = null; S.events = []; S.foot = null;
    formLine(S, C.NORMAL, true);
  }

  const P = (S, id) => S.ppl[id];
  const cadets = (S) => S.flight.elements.flat().map((id) => S.ppl[id]);
  const members = (S) => (S.flight.guide ? [S.ppl[S.flight.guide], ...cadets(S)] : cadets(S));
  const maxLen = (S) => Math.max(...S.flight.elements.map((e) => e.length));

  function slotOf(g, i, j) { return add(g.O, add(mul(g.ur, j * g.su), mul(g.ud, i * g.sd))); }
  function slot(S, i, j) { return slotOf(S.flight.grid, i, j); }

  /** What the flight is doing, read off its grid and heading. */
  function analyze(S) {
    const F = S.flight, g = F.grid;
    const f = dir(F.h), right = dir(F.h + 90);
    if (!g) return { type: 'free', f, right };
    const a = dot(f, g.ud), b = dot(f, g.ur);
    let type = 'other';
    if (a < -0.99) type = 'line';
    else if (a > 0.99) type = 'invline';
    else if (b < -0.99) type = 'column';
    else if (b > 0.99) type = 'invcol';
    const lineish = type === 'line' || type === 'invline';
    const interval = lineish ? g.su : g.sd;
    return {
      type, f, right, g, lineish,
      columnish: type === 'column' || type === 'invcol',
      interval, close: interval < 30,
      open: lineish && g.sd > 50,
    };
  }

  // The file the FC centers on (Det ORI p.1): an even count across includes the guidon in the centering, odd does not.
  function centerFile(S) {
    const n = maxLen(S);
    return S.flight.guide && n % 2 === 0 ? n / 2 - 1 : (n - 1) / 2;
  }

  function lineGrid(S, su) {
    const fc = S.ppl.fc;
    const h = nh(fc.h + 180), f = dir(h), right = dir(h + 90);
    const c = centerFile(S);
    const center = add(fc, mul(dir(fc.h), postDist(S)));
    const ur = mul(right, -1);
    return { h, grid: { O: sub(center, mul(ur, c * su)), ur, ud: mul(f, -1), su, sd: C.NORMAL } };
  }
  const postDist = (S) => clamp(S.opts.postPaces || 3, 1, 10) * C.PACE;

  function guideSlot(S) {
    const F = S.flight;
    if (!F.guide || !F.grid) return null;
    const A = analyze(S), g = F.grid, E = F.elements.length;
    if (A.type === 'line' || A.type === 'invcol') return sub(slot(S, 0, 0), mul(g.ur, g.su));
    if (A.type === 'invline') return sub(slot(S, E - 1, 0), mul(g.ur, g.su));
    if (A.type === 'column') {
      const side = F.guideSide === 'L' ? -1 : 1;
      let best = 0, bp = -Infinity;
      for (let i = 0; i < E; i++) { const pr = dot(slot(S, i, 0), A.right) * side; if (pr > bp) { bp = pr; best = i; } }
      return add(slot(S, best, 0), mul(A.f, C.NORMAL));
    }
    return null;
  }

  /** The commander's regulation post for the current formation: {x, y, h} or null. */
  function fcPost(S) {
    const F = S.flight;
    if (!F.grid) return null;
    const A = analyze(S), E = F.elements.length, D = postDist(S);
    if (A.lineish) {
      const front = A.type === 'line' ? 0 : E - 1;
      const pt = add(slot(S, front, centerFile(S)), mul(A.f, D));
      return { x: pt.x, y: pt.y, h: nh(F.h + 180) };
    }
    if (A.columnish) {
      const side = F.guideSide === 'L' ? 1 : -1;
      let best = 0, bp = Infinity;
      for (let i = 0; i < E; i++) { const pr = dot(slot(S, i, 0), A.right) * side * -1; if (pr < bp) { bp = pr; best = i; } }
      const n = F.elements[best].length;
      const mid = mul(add(slot(S, best, 0), slot(S, best, n - 1)), 0.5);
      const pt = add(mid, mul(A.right, side * D));
      return { x: pt.x, y: pt.y, h: F.mode === 'halted' ? nh(F.h - side * 90) : F.h };
    }
    return null;
  }

  function center(S) {
    const cs = cadets(S);
    return { x: cs.reduce((s, p) => s + p.x, 0) / cs.length, y: cs.reduce((s, p) => s + p.y, 0) / cs.length };
  }

  /** Heading that squarely faces the flight from where the commander stands. */
  function faceFlightHeading(S, p) {
    const c = center(S), F = S.flight, f = dir(F.h), r = dir(F.h + 90);
    const v = sub(c, p);
    const a = dot(v, f), b = dot(v, r);
    if (Math.abs(a) >= Math.abs(b)) return a > 0 ? F.h : nh(F.h + 180);
    return b > 0 ? nh(F.h + 90) : nh(F.h - 90);
  }

  function formLine(S, su, instant) {
    const F = S.flight;
    const { h, grid } = lineGrid(S, su);
    F.grid = grid; F.h = h; F.mode = 'halted'; F.posture = 'att'; F.awaitForward = false; F.guideSide = 'R'; F.phase = 0;
    S.man = null; S.insp = null;
    const targets = [];
    F.elements.forEach((ids, i) => ids.forEach((id, j) => targets.push([S.ppl[id], slot(S, i, j)])));
    if (F.guide) targets.unshift([S.ppl[F.guide], guideSlot(S)]);
    for (const [p, t] of targets) {
      Object.assign(p, { posture: 'att', head: 0, arm: null, num: null, off: { x: 0, y: 0 }, marching: false, follow: false, hidden: false });
      if (instant) { p.x = t.x; p.y = t.y; p.h = h; p.prog = []; }
      else p.prog = [{ t: 'goto', x: t.x, y: t.y, sp: C.WALK, h }];
    }
    S.ppl.fc.marching = false;
  }

  // ---------- events ----------
  function say(S, id, text, kind) { S.events.push({ t: S.t, id, text, kind: kind || 'say' }); }

  // ---------- running a count ----------
  function busy(S) {
    if (S.man) return true;
    return members(S).some((p) => p.prog.length);
  }
  const actorsBusy = (S) => S.ppl.fc.prog.length > 0 || S.ppl.insp.prog.length > 0;

  function move(p, v, d) { p.x += v.x * d; p.y += v.y * d; }

  function tick(S) {
    const F = S.flight;
    S.t++;
    S.events = S.events.filter((e) => S.t - e.t < 4);
    const before = members(S).map((p) => p.x + ',' + p.y);
    const sideNow = F.phase % 2 === 0;
    if (S.man) manPre(S);
    for (const id of S.order) {
      const p = S.ppl[id];
      if (!p || p.hidden || p.follow) continue;
      runPerson(S, p, sideNow);
    }
    if (S.man) manPost(S);
    F.phase++;
    const moved = members(S).some((p, i) => before[i] !== p.x + ',' + p.y);
    const stepping = F.mode !== 'halted' || (moved && S.man);
    S.foot = stepping ? (S.foot === 'L' ? 'R' : 'L') : (moved ? S.foot : null);
    if (F.mode === 'halted' && !busy(S)) S.foot = null;
    if (!S.man && F.reform && !busy(S)) { F.reform = false; refit(S); }
    if (!S.man) settleGrid(S);
  }

  function runPerson(S, p, sideNow) {
    let guard = 0, consumed = false;
    while (!consumed && p.prog.length && guard++ < 60) {
      const a = p.prog[0];
      consumed = act(S, p, a);
      if (a.done) p.prog.shift();
    }
    if (!consumed && !p.prog.length) defaultMove(S, p, sideNow);
  }

  function defaultMove(S, p, sideNow) {
    const F = S.flight;
    const inFlight = p.role === 'cadet' || p.role === 'guide' || (p.role === 'fc' && p.marching);
    if (!inFlight || F.mode === 'halted') return;
    if (F.mode === 'rstep' || F.mode === 'lstep') {
      if (p.role !== 'fc' && sideNow) move(p, dir(p.h + (F.mode === 'rstep' ? 90 : -90)), C.SIDE);
      return;
    }
    const d = MOVING[F.mode] || 0;
    if (d) move(p, dir(p.h), d);
  }

  function act(S, p, a) {
    switch (a.t) {
      case 'step': move(p, dir(p.h + (a.side || 0)), a.d); a.done = true; return true;
      case 'pivot': {
        if (S.man && S.man.lead[p.id] != null) S.man.trains[S.man.lead[p.id]].lastPivotS = S.man.trains[S.man.lead[p.id]].s;
        p.h = nh(p.h + a.a); a.done = true; return !!a.full;
      }
      case 'face': p.h = nh(a.h); a.done = true; return false;
      case 'faceFlight': p.h = faceFlightHeading(S, p); a.done = true; return false;
      case 'set': Object.assign(p, clone(a.v)); a.done = true; return false;
      case 'flight': Object.assign(S.flight, clone(a.v)); a.done = true; return false;
      case 'nudge': p.x += a.x; p.y += a.y; a.done = true; return false;
      case 'wait': a.n = (a.n == null ? 1 : a.n) - 1; if (a.n <= 0) a.done = true; return true;
      case 'march': {
        const d = Math.min(a.sp, a.left);
        move(p, dir(p.h), d); a.left -= d;
        if (a.left <= 1e-6) a.done = true;
        return true;
      }
      case 'goto': return goTo(p, a, a.x, a.y, a.sp);
      case 'seek': {
        const tg = resolve(S, p, a.tgt);
        if (!tg) { a.done = true; return false; }
        return seek(S, p, a, tg);
      }
      case 'say': say(S, p.id, a.text, a.kind); a.done = true; return false;
      case 'abreast': return abreast(S, p, a);
      case 'merge': return merge(S, p, a);
      default: a.done = true; return false;
    }
  }

  function goTo(p, a, x, y, sp) {
    const dx = x - p.x, dy = y - p.y, L = Math.hypot(dx, dy);
    if (L < 1e-6) { p.x = x; p.y = y; if (a.h != null) p.h = nh(a.h); a.done = true; return false; }
    const d = Math.min(sp, L);
    if (a.face !== 'keep') p.h = hdg({ x: dx, y: dy });
    p.x += (dx / L) * d; p.y += (dy / L) * d;
    if (L - d < 1e-6) { p.x = x; p.y = y; if (a.h != null) p.h = nh(a.h); a.done = true; }
    return true;
  }

  function seek(S, p, a, tg) {
    const dx = tg.x - p.x, dy = tg.y - p.y, L = Math.hypot(dx, dy);
    const keep = a.until === 'man' && S.man;
    if (L < 0.5) {
      p.x = tg.x; p.y = tg.y;
      if (tg.h != null) p.h = nh(tg.h);
      if (!keep) { a.done = true; return false; }
      return true;
    }
    const d = Math.min(a.sp || C.PACE, L);
    if (a.face !== 'keep') p.h = d < 1 && tg.h != null ? nh(tg.h) : hdg({ x: dx, y: dy });
    p.x += (dx / L) * d; p.y += (dy / L) * d;
    if (L - d < 0.5 && tg.h != null) p.h = nh(tg.h);
    if (L - d < 0.5 && !keep) a.done = true;
    return true;
  }

  /** A seek target that moves with the flight. */
  function resolve(S, p, t) {
    if (!t) return null;
    if (t.k === 'pt') return t;
    if (t.k === 'ahead') {
      const L = S.ppl[t.of];
      const v = add(L, mul(dir(L.h), t.d));
      return { x: v.x, y: v.y, h: L.h };
    }
    if (t.k === 'guidePost') {
      const g = guideSlot(S);
      return g ? { x: g.x, y: g.y, h: S.flight.h } : null;
    }
    if (t.k === 'post') { return fcPost(S); }
    if (t.k === 'rel') {
      const R = S.ppl[t.ref];
      if (!R) return null;
      const f = dir(S.flight.h), r = dir(S.flight.h + 90);
      const v = add(R, add(mul(f, t.along), mul(r, t.side)));
      return { x: v.x, y: v.y, h: S.flight.mode === 'halted' ? undefined : S.flight.h };
    }
    if (t.k === 'fcRel') {
      if (!S.man) return null;
      const tr = S.man.trains[t.train];
      if (!tr) return null;
      const pt = pointAt(tr, tr.s - t.back);
      const v = add(pt, mul(dir(pt.h + 90), t.side));
      return { x: v.x, y: v.y, h: pt.h };
    }
    if (t.k === 'shadow') {
      const I = S.ppl.insp;
      const v = add(I, add(mul(dir(I.h + 90), C.PACE), mul(dir(I.h + 180), C.PACE)));
      return { x: v.x, y: v.y, h: I.h };
    }
    return null;
  }

  // ---------- maneuvers: files of cadets following their leader's trail ----------
  function pointAt(tr, s) {
    const { path, cum } = tr;
    if (path.length < 2) return { x: path[0].x, y: path[0].y, h: tr.h0 };
    if (s <= 0) {
      const h = hdg(sub(path[1], path[0]));
      return { ...add(path[0], mul(dir(h), s)), h };
    }
    const total = cum[cum.length - 1];
    if (s >= total) {
      const L = path.length;
      let i = L - 1;
      while (i > 0 && dist(path[i], path[i - 1]) < 1e-9) i--;
      const h = i > 0 ? hdg(sub(path[i], path[i - 1])) : tr.h0;
      return { ...add(path[L - 1], mul(dir(h), s - total)), h };
    }
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
    const seg = cum[hi] - cum[lo];
    const u = seg > 0 ? (s - cum[lo]) / seg : 0;
    const a = path[lo], b = path[hi];
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, h: hdg(sub(b, a)) };
  }

  /** Cadets grouped into files along the current heading: left file first, each file front to back. */
  function fileGroups(S) {
    const F = S.flight, f = dir(F.h), r = dir(F.h + 90);
    const cs = cadets(S).map((p) => ({ id: p.id, lat: dot(p, r), lon: dot(p, f) })).sort((a, b) => a.lat - b.lat);
    const files = [];
    for (const c of cs) {
      const last = files[files.length - 1];
      if (last && Math.abs(c.lat - last.lat) < 8) { last.m.push(c); last.lat = last.m.reduce((s, x) => s + x.lat, 0) / last.m.length; }
      else files.push({ lat: c.lat, m: [c] });
    }
    files.forEach((fl) => fl.m.sort((a, b) => b.lon - a.lon));
    return files.map((fl) => ({ lat: fl.lat, ids: fl.m.map((x) => x.id), front: fl.m[0].lon }));
  }

  function makeTrain(S, ids) {
    const F = S.flight, f = dir(F.h);
    const L = S.ppl[ids[0]];
    const gaps = ids.slice(1).map((id) => Math.max(1, dot(L, f) - dot(S.ppl[id], f)));
    const back = (gaps.length ? gaps[gaps.length - 1] : 0) + 400;
    const rear = sub(L, mul(f, back));
    for (const id of ids.slice(1)) S.ppl[id].follow = true;
    return { lead: ids[0], ids: ids.slice(1), gaps, path: [rear, { x: L.x, y: L.y }], cum: [0, back], s: back, lastPivotS: -Infinity, h0: F.h };
  }

  function startMan(S, files, progs, o) {
    const F = S.flight;
    const man = { kind: o.kind, trains: [], lead: {}, newH: nh(o.newH), frontSp: o.frontSp, catchSp: o.catchSp, after: o.after, await: !!o.await, F0: null };
    files.forEach((fl, i) => {
      const tr = makeTrain(S, fl.ids);
      man.trains.push(tr);
      man.lead[fl.ids[0]] = i;
      S.ppl[fl.ids[0]].prog = progs[i];
    });
    S.man = man;
    // The guide: in front of a file it performs that file's movement on its own; behind one it simply follows it.
    if (F.guide) {
      const g = S.ppl[F.guide], f = dir(F.h), r = dir(F.h + 90);
      let bi = 0;
      files.forEach((fl, i) => { if (Math.abs(fl.lat - dot(g, r)) < Math.abs(files[bi].lat - dot(g, r))) bi = i; });
      const fl = files[bi];
      const ahead = dot(g, f) - fl.front;
      if (ahead > 0) g.prog = [{ t: 'seek', tgt: { k: 'ahead', of: fl.ids[0], d: ahead }, sp: 30, until: 'man' }];
      else {
        const tr = man.trains[bi];
        tr.ids.push(g.id); tr.gaps.push(Math.max(1, fl.front - dot(g, f)));
        g.follow = true;
      }
    }
    const fc = S.ppl.fc;
    if (S.opts.fcFollow && fc.marching) {
      const f = dir(F.h), r = dir(F.h + 90);
      let bi = 0;
      files.forEach((fl, i) => { if (Math.abs(fl.lat - dot(fc, r)) < Math.abs(files[bi].lat - dot(fc, r))) bi = i; });
      const back = files[bi].front - dot(fc, f);
      const side = dot(fc, r) - files[bi].lat;
      fc.prog = [{ t: 'seek', tgt: { k: 'fcRel', train: bi, back, side }, sp: 40, until: 'man' }];
    }
  }

  function manPre(S) {
    const m = S.man, f = dir(m.newH);
    let F0 = null;
    m.trains.forEach((tr) => {
      const L = S.ppl[tr.lead];
      if (L.prog.length && L.prog[0].t === 'abreast') { const pr = dot(L, f); if (F0 == null || pr > F0) F0 = pr; }
    });
    m.F0 = F0;
  }

  function abreast(S, p) {
    const m = S.man;
    if (!m) return true;
    const f = dir(m.newH);
    p.h = m.newH;
    const my = dot(p, f);
    const front = m.F0 == null ? my : m.F0;
    const d = my >= front - 0.5 ? m.frontSp : Math.min(m.catchSp, front + m.frontSp - my);
    move(p, f, d);
    return true;
  }

  // Column of files: a cadet stands fast until its place in the single file comes by, then inclines in.
  function merge(S, p, a) {
    const m = S.man;
    if (!m) { a.done = true; return false; }
    const tr = m.trains[0];
    const target = pointAt(tr, tr.s - a.gap);
    const along = dot(sub(p, tr.path[1]), dir(tr.h0)) + (tr.cum[1]);
    if (!a.go && (tr.s - a.gap) < along - a.lead) return true;
    a.go = true;
    const L = dist(p, target);
    if (L <= 30) {
      p.x = target.x; p.y = target.y; p.h = target.h;
      tr.ids.push(p.id); tr.gaps.push(a.gap); p.follow = true;
      a.done = true;
      return true;
    }
    const v = sub(target, p);
    p.h = hdg(v);
    move(p, mul(v, 1 / L), 30);
    return true;
  }

  function manPost(S) {
    const m = S.man;
    for (const tr of m.trains) {
      const L = S.ppl[tr.lead];
      const last = tr.path[tr.path.length - 1];
      const d = dist(L, last);
      if (d > 1e-6) { tr.path.push({ x: L.x, y: L.y }); tr.cum.push(tr.cum[tr.cum.length - 1] + d); tr.s += d; }
      tr.ids.forEach((id, k) => {
        const q = S.ppl[id];
        if (!q.follow) return;
        const pt = pointAt(tr, tr.s - tr.gaps[k]);
        q.x = pt.x; q.y = pt.y; q.h = pt.h;
      });
    }
    if (m.kind === 'files') {
      const waiting = cadets(S).some((p) => p.prog.length && p.prog[0].t === 'merge');
      const gpend = S.flight.guide && S.ppl[S.flight.guide].prog.some((x) => x.t === 'goto');
      const tr = m.trains[0];
      const passed = tr.ids.every((id, k) => tr.s - tr.gaps[k] >= tr.lastPivotS + 0.25);
      if (!waiting && !gpend && passed && S.t - (m.t0 || 0) > 1) finishMan(S, false);
      return;
    }
    const leaders = m.trains.map((tr) => S.ppl[tr.lead]);
    if (!leaders.every((L) => L.prog.length === 1 && L.prog[0].t === 'abreast')) return;
    const f = dir(m.newH);
    const pr = leaders.map((L) => dot(L, f));
    if (Math.max(...pr) - Math.min(...pr) > 0.5) return;
    const passed = m.trains.every((tr) => tr.ids.every((id, k) => tr.s - tr.gaps[k] >= tr.lastPivotS + 0.25));
    if (!passed) return;
    finishMan(S, true);
  }

  function finishMan(S, fit) {
    const m = S.man, F = S.flight;
    for (const tr of m.trains) {
      S.ppl[tr.lead].prog = [];
      for (const id of tr.ids) { S.ppl[id].follow = false; S.ppl[id].prog = []; }
    }
    if (F.guide) { const g = S.ppl[F.guide]; g.follow = false; g.prog = g.prog.filter((x) => x.t !== 'seek'); }
    F.h = m.newH;
    F.mode = m.after;
    F.awaitForward = m.await;
    const fc = S.ppl.fc;
    let rel = null;
    if (fc.prog.length && fc.prog[0].tgt && fc.prog[0].tgt.k === 'fcRel') rel = resolve(S, fc, fc.prog[0].tgt);
    S.man = null;
    for (const p of members(S)) p.h = F.h;
    if (fit) refit(S); else { F.grid = null; settleGrid(S); }
    if (rel) {
      const R = S.ppl[F.elements[0][0]], f = dir(F.h), r = dir(F.h + 90);
      const v = sub(rel, R);
      fc.prog = [{ t: 'seek', tgt: { k: 'rel', ref: R.id, along: dot(v, f), side: dot(v, r) }, sp: 40 }];
    }
  }

  const snapSp = (v) => { for (const s of SPACINGS) if (Math.abs(v - s) < 7) return s; return Math.round(v); };

  /** Re-derive the grid from where the cadets ended up and square everyone onto it. False = not a grid (single file). */
  function refit(S) {
    const F = S.flight, E = F.elements.length, f = dir(F.h), r = dir(F.h + 90);
    const axes = [f, mul(f, -1), r, mul(r, -1)];
    const pick = (v) => axes.reduce((b, a) => (dot(a, v) > dot(b, v) ? a : b));
    const A0 = S.ppl[F.elements[0][0]];
    const long = F.elements.find((e) => e.length > 1);
    let ur = null, su = C.NORMAL, ud = null, sd = C.NORMAL;
    if (long) { const v = sub(S.ppl[long[1]], S.ppl[long[0]]); ur = pick(v); su = snapSp(Math.abs(dot(v, ur))); }
    if (E > 1) { const v = sub(S.ppl[F.elements[1][0]], A0); ud = pick(v); sd = snapSp(Math.abs(dot(v, ud))); }
    if (!ur) ur = ud ? dir(hdg(ud) + 90) : mul(r, -1);
    if (!ud) ud = dir(hdg(ur) + 90);
    if (Math.abs(dot(ur, ud)) > 0.01) { F.grid = null; return false; }
    const g = { O: { x: A0.x, y: A0.y }, ur, ud, su, sd };
    for (let i = 0; i < E; i++) {
      for (let j = 0; j < F.elements[i].length; j++) {
        if (dist(slotOf(g, i, j), S.ppl[F.elements[i][j]]) > 12) { F.grid = null; return false; }
      }
    }
    F.grid = g;
    F.elements.forEach((ids, i) => ids.forEach((id, j) => {
      const p = S.ppl[id], s = slotOf(g, i, j);
      p.x = s.x; p.y = s.y; p.h = F.h; p.off = { x: 0, y: 0 };
    }));
    if (F.guide) {
      const gs = guideSlot(S), gp = S.ppl[F.guide];
      if (gs) { gp.x = gs.x; gp.y = gs.y; }
      gp.h = F.h;
    }
    return true;
  }

  /** After rigid moves the grid just rides along with the first element leader. */
  function settleGrid(S) {
    const F = S.flight;
    if (!F.grid) return;
    const A0 = S.ppl[F.elements[0][0]];
    F.grid.O = sub(A0, A0.off || { x: 0, y: 0 });
  }

  // ---------- misalignment: what the FC fixes with "Cadet ___, move up/back" ----------
  function misalign(S) {
    const A = analyze(S);
    const out = [];
    if (!S.opts.misalign || !A.lineish) return out;
    for (const p of cadets(S)) {
      if (rand(S) > 0.3) continue;
      const o = [-6, -4, 4, 6][Math.floor(rand(S) * 4)];
      out.push([p, mul(A.f, o)]);
    }
    return out;
  }
  function misaligned(S, el) {
    return cadets(S).filter((p) => (el == null || p.el === el) && len(p.off || { x: 0, y: 0 }) > 0.5);
  }
  /** "Cadet ___, move up" (+1) or "move back" (-1): a 2-inch choppy step along the facing. */
  function adjust(S, id, sign) {
    const p = S.ppl[id], f = dir(S.flight.h);
    const v = mul(f, 2 * sign);
    p.x += v.x; p.y += v.y;
    p.off = add(p.off || { x: 0, y: 0 }, v);
    if (len(p.off) < 0.5) p.off = { x: 0, y: 0 };
    settleGrid(S);
  }

  root.DrillEngine = {
    C, MOVING, rad, nh, dir, hdg, add, sub, mul, dot, len, dist, hdiff, clamp, clone, ORD, numWord,
    rand, createState, buildFlight, analyze, slot, slotOf, guideSlot, fcPost, centerFile, formLine, lineGrid,
    faceFlightHeading, center, say, busy, actorsBusy, tick, fileGroups, startMan, refit, settleGrid,
    misalign, misaligned, adjust, members, cadets, pointAt, resolve, postDist,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
