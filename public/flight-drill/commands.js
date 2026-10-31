/* Flight Drill Sim: the command catalog. Every command says when it may be given, on which foot, what the
   flight does, and where that comes from; valid() returns a reason string when it may NOT be given now.
   Paragraph numbers are AFMAN 36-2203 (2013, Ch 1), the text DAFPAM 34-1203 (2022) carried forward.
   "Det ORI" = Det 855 Open Ranks Inspection Procedures, 10 Jul 2025. */
(function (root) {
  'use strict';
  const E = root.DrillEngine;
  const { C, dir, add, sub, mul, dot, nh, analyze } = E;

  const P = (S, id) => S.ppl[id];
  const F = (S) => S.flight;
  const cadets = (S) => E.cadets(S);
  const members = (S) => E.members(S);
  const MARCHING = ['quick', 'half', 'mark', 'double', 'rstep', 'lstep', 'route', 'atease'];
  const rep = (n, a) => Array.from({ length: Math.max(0, n) }, () => E.clone(a));

  // ---------- shared checks ----------
  const BUSY = 'The flight is still carrying out the last command. Press Space (or ▶) to run its counts first.';
  function common(S) {
    if (E.busy(S)) return BUSY;
    const p = F(S).posture;
    if (p === 'dismissed') return 'The flight has been dismissed. Call FALL IN to form it again.';
    if (p === 'fallout') return 'The flight has fallen out. Call FALL IN to form it again.';
    return null;
  }
  function needHalted(S) {
    const c = common(S); if (c) return c;
    if (F(S).mode !== 'halted') return 'Give this while the flight is halted.';
    return null;
  }
  function needAtt(S) {
    const c = needHalted(S); if (c) return c;
    const p = F(S).posture;
    if (p === 'parade' || p === 'atease' || p === 'rest') return 'Bring the flight to attention first (Flight, ATTENTION).';
    if (p === 'dress') return 'The flight is still dressed. Give Ready, FRONT first.';
    if (p === 'eyes') return 'Heads are still turned. Give Ready, FRONT first.';
    if (p === 'salute') return 'The flight is saluting. Give Order, ARMS first.';
    return null;
  }
  function needMarching(S, modes) {
    const c = common(S); if (c) return c;
    const m = F(S).mode;
    if (m === 'halted') return 'Only given while marching.';
    if (F(S).awaitForward) return 'The column movement is complete and the flight is half stepping. The only command allowed now is Forward, MARCH (¶4.11.1.6).';
    if ((m === 'route' || m === 'atease') && !(modes || []).includes(m)) return 'At route step / at ease the only command allowed is Incline. Call Flight, ATTENTION first (¶3.19).';
    if (modes && !modes.includes(m)) {
      if (m === 'half') return 'No changes of direction or other movements from the half step. Give Forward, MARCH first (¶3.13.3).';
      if (m === 'double') return 'In double time only Incline, Quick Time, MARCH and Flight, HALT may be given (¶3.11.6).';
      if (m === 'mark') return 'Give Forward, MARCH out of mark time first.';
      if (m === 'rstep' || m === 'lstep') return 'The only command during a right or left step is Flight, HALT.';
      return 'Not from the current step.';
    }
    return null;
  }
  const needType = (S, types, what) => (types.includes(analyze(S).type) ? null : `Only given to a flight in ${what}.`);

  // ---------- helpers that build movement ----------
  function setAll(S, v, who) { for (const p of who || members(S)) p.prog.push({ t: 'set', v }); }
  function fcFollowStart(S) {
    const fc = P(S, 'fc');
    if (S.opts.fcFollow) { fc.marching = true; fc.prog = [{ t: 'face', h: F(S).h }]; }
  }
  function forMarchers(S, fn) {
    for (const p of members(S)) p.prog = fn(p);
    const fc = P(S, 'fc');
    if (fc.marching) fc.prog = fn(fc);
  }
  // ¶4.2.3: the guide keeps its relative place through flanks and to-the-rears; it only re-posts after a
  // facing, or when the flight halts in line with the guide not abreast of the front rank.
  function guideRepost(S, extraWait, types) {
    const g = F(S).guide && P(S, F(S).guide);
    if (!g) return;
    const t = analyze(S).type;
    if (!(types || ['line', 'invline', 'column', 'invcol']).includes(t)) return;
    g.prog.push(...rep(extraWait || 0, { t: 'wait' }), { t: 'seek', tgt: { k: 'guidePost' }, sp: C.PACE });
  }

  function haltSeq(mode) {
    if (mode === 'half') return [{ t: 'step', d: C.HALF }, { t: 'wait' }];
    if (mode === 'mark') return [{ t: 'wait' }, { t: 'wait' }];
    if (mode === 'double') return [{ t: 'step', d: C.DOUBLE }, { t: 'step', d: C.DOUBLE }, { t: 'step', d: C.PACE }, { t: 'wait' }];
    if (mode === 'rstep') return [{ t: 'step', d: C.SIDE, side: 90 }, { t: 'wait' }];
    if (mode === 'lstep') return [{ t: 'step', d: C.SIDE, side: -90 }, { t: 'wait' }];
    return [{ t: 'step', d: C.PACE }, { t: 'wait' }];
  }

  function dressProg(S, opt) {
    const A = analyze(S), Fl = F(S), mis = new Map(E.misalign(S).map(([p, v]) => [p.id, v]));
    const E1 = Fl.elements.length;
    Fl.elements.forEach((ids, i) => ids.forEach((id, j) => {
      const p = P(S, id), s = E.slot(S, i, j), off = (opt.misalign !== false && mis.get(id)) || { x: 0, y: 0 };
      const last = j === ids.length - 1;
      const baseEl = A.type === 'invline' ? E1 - 1 : 0;
      const head = j === 0 && i !== baseEl ? 0 : opt.head;
      p.prog = [
        { t: 'set', v: { posture: 'dress', arm: last ? null : opt.arm, head } },
        { t: 'goto', x: s.x + off.x, y: s.y + off.y, sp: 8, face: 'keep' },
        { t: 'set', v: { off } },
      ];
    }));
    if (Fl.guide) {
      const gs = E.guideSlot(S), g = P(S, Fl.guide);
      g.prog = [{ t: 'set', v: { posture: 'dress', arm: opt.arm, head: 0 } }, ...(gs ? [{ t: 'goto', x: gs.x, y: gs.y, sp: 8, face: 'keep' }] : [])];
    }
    Fl.posture = 'dress';
  }

  // ---------- column movements, inclines, close/extend march, counter march ----------
  function columnMove(S, turn, o) {
    const Fl = F(S), files = E.fileGroups(S);
    const sgn = Math.sign(turn), abs = Math.abs(turn);
    const base = sgn > 0 ? files.length - 1 : 0;
    const fromHalt = Fl.mode === 'halted';
    const step1 = !(fromHalt && sgn < 0);   // ¶4.11.3: from a halt, column left begins with a face in marching
    const progs = files.map((fl, idx) => {
      const k = Math.abs(fl.lat - files[base].lat);
      const pr = [];
      if (abs === 90) {
        if (step1) pr.push({ t: 'step', d: C.PACE });
        if (idx === base) pr.push({ t: 'pivot', a: turn }, { t: 'step', d: C.PACE });
        else pr.push({ t: 'pivot', a: sgn * 45 }, { t: 'march', sp: C.PACE, left: k * Math.SQRT2 }, { t: 'pivot', a: sgn * 45 });
      } else {
        // A 45° (or incline) turn: an outer file carries on k·tan(θ/2) further so it keeps its interval (¶4.12.1).
        if (step1) pr.push({ t: 'step', d: C.PACE });
        const ek = k * Math.tan(E.rad(abs) / 2);
        if (ek > 0.01) pr.push({ t: 'march', sp: C.PACE, left: ek });
        if (o.incline) pr.push({ t: 'pivot', a: turn / 2 }, { t: 'step', d: C.PACE }, { t: 'pivot', a: turn / 2 });
        else {
          pr.push({ t: 'pivot', a: turn });
          if (idx === base) pr.push({ t: 'step', d: C.PACE });
        }
      }
      pr.push({ t: 'abreast' });
      return pr;
    });
    if (fromHalt) fcFollowStart(S);
    E.startMan(S, files, progs, {
      kind: o.kind, newH: Fl.h + turn,
      frontSp: o.incline ? C.PACE : C.HALF, catchSp: o.incline ? 30 : C.PACE,
      after: o.after, await: o.await,
    });
    if (Fl.mode === 'halted') Fl.mode = 'quick';
  }

  function closeExtendMarching(S, close) {
    const Fl = F(S), files = E.fileGroups(S);
    const base = files.length - 1;
    const now = analyze(S).interval, want = close ? C.CLOSE : C.NORMAL;
    const delta = Math.abs(now - want);
    const sgn = close ? 1 : -1;   // close: toward the right (base) file; extend: away from it
    const progs = files.map((fl, idx) => {
      const k = base - idx;
      if (!k) return [{ t: 'abreast' }];
      return [{ t: 'pivot', a: sgn * 45 }, { t: 'march', sp: C.PACE, left: k * delta * Math.SQRT2 }, { t: 'pivot', a: -sgn * 45 }, { t: 'abreast' }];
    });
    E.startMan(S, files, progs, { kind: 'close', newH: Fl.h, frontSp: C.HALF, catchSp: C.PACE, after: 'half', await: false });
  }

  function counterMarch(S) {
    const Fl = F(S), files = E.fileGroups(S), n = files.length;
    const I = n > 1 ? Math.abs(files[1].lat - files[0].lat) : C.NORMAL;
    const fromHalt = Fl.mode === 'halted';
    // ¶4.16: the files mirror and shift half an interval right; the farther a file travels, the farther out its lane.
    const travel = files.map((fl, i) => files[0].lat + (n - 1 - i + 0.5) * I - fl.lat);
    const rank = travel.map((t, i) => [Math.abs(t), i]).sort((a, b) => b[0] - a[0]);
    const lane = new Array(n);
    rank.forEach(([, i], r) => { lane[i] = n - r; });
    const progs = files.map((fl, i) => {
      const s = Math.sign(travel[i]) || 1;
      return [
        { t: 'march', sp: C.PACE, left: (lane[i] + (fromHalt ? 1 : 0)) * C.PACE },
        { t: 'pivot', a: s * 90 },
        { t: 'march', sp: C.PACE, left: Math.abs(travel[i]) },
        { t: 'pivot', a: s * 90 },
        { t: 'abreast' },
      ];
    });
    if (fromHalt) fcFollowStart(S);
    E.startMan(S, files, progs, { kind: 'counter', newH: Fl.h + 180, frontSp: C.HALF, catchSp: C.PACE, after: 'half', await: true });
    if (Fl.mode === 'halted') Fl.mode = 'quick';
  }

  /** Column of files: one file steps off, the others stand fast and incline in behind it as it passes. */
  function columnOfFiles(S, fromRight, turn) {
    const Fl = F(S), files = E.fileGroups(S);
    const order = fromRight ? files.slice().reverse() : files.slice();
    const lead = order[0];
    const L = P(S, lead.ids[0]);
    const progs = [turn ? [{ t: 'pivot', a: turn }] : []];
    E.startMan(S, [lead], progs, { kind: 'files', newH: Fl.h + (turn || 0), frontSp: C.PACE, catchSp: C.PACE, after: 'quick', await: false });
    const m = S.man;
    m.t0 = S.t;
    const tr = m.trains[0];
    let gap = tr.gaps.length ? tr.gaps[tr.gaps.length - 1] : 0;
    const D = C.NORMAL;
    order.slice(1).forEach((fl, k) => {
      fl.ids.forEach((id, j) => {
        gap += j === 0 ? D * 1.5 : D;
        const p = P(S, id);
        p.prog = [{ t: 'merge', gap, lead: (k + 1) * 30 + 30 }];
      });
    });
    const g = Fl.guide && P(S, Fl.guide);
    if (g) {
      // ¶4.13.1: from the left, the guide first moves in front of the file that will move first.
      g.prog = [];
      const front = add(L, mul(dir(Fl.h), C.NORMAL));
      if (!fromRight) g.prog.push({ t: 'goto', x: front.x, y: front.y, sp: 30, h: Fl.h });
      g.prog.push({ t: 'seek', tgt: { k: 'ahead', of: L.id, d: C.NORMAL }, sp: 30, until: 'man' });
      g.follow = false;
      const gi = tr.ids.indexOf(g.id);
      if (gi >= 0) { tr.ids.splice(gi, 1); tr.gaps.splice(gi, 1); }
    }
    Fl.mode = 'quick';
    fcFollowStart(S);
    const fc = P(S, 'fc');
    if (fc.marching) {
      const r = dir(Fl.h + 90);
      fc.prog.push({ t: 'seek', tgt: { k: 'fcRel', train: 0, back: 2 * C.NORMAL, side: Math.sign(dot(sub(fc, L), r) || -1) * (2 * C.NORMAL) }, sp: 40, until: 'man' });
    }
  }

  function reformFromFile(S, toLeft) {
    const Fl = F(S), f = dir(Fl.h), r = dir(Fl.h + 90);
    const byFront = Fl.elements.map((ids, i) => ({ i, ids, front: Math.max(...ids.map((id) => dot(P(S, id), f))) })).sort((a, b) => b.front - a.front);
    const leadEl = byFront[0];
    const I = C.NORMAL;
    const leadPos = leadEl.ids.map((id) => ({ x: P(S, id).x, y: P(S, id).y }));
    const fallback = (j) => sub(leadPos[leadPos.length - 1], mul(f, (j - leadPos.length + 1) * C.NORMAL));
    byFront.slice(1).forEach((el, k) => {
      const side = mul(r, (toLeft ? -1 : 1) * (k + 1) * I);
      el.ids.forEach((id, j) => {
        const p = P(S, id);
        const dest = add(j < leadPos.length ? leadPos[j] : fallback(j), side);
        const lat = dot(sub(dest, p), r);
        const wp = add(p, add(mul(r, lat), mul(f, Math.abs(lat))));
        p.prog = [{ t: 'goto', x: wp.x, y: wp.y, sp: C.PACE }, { t: 'goto', x: dest.x, y: dest.y, sp: C.PACE }, { t: 'face', h: Fl.h }];
      });
    });
    Fl.reform = true;
  }

  // ---------- sizing: odd-even transposition, one pass per three counts (tap, step out, step in) ----------
  function sizingPasses(arr, taller) {
    const a = arr.slice(), passes = [];
    let quiet = 0, parity = 0, guard = 0;
    while (quiet < 2 && guard++ < 200) {
      const swaps = [];
      for (let i = parity; i + 1 < a.length; i += 2) {
        if (taller(a[i + 1], a[i])) { swaps.push(i); [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
      }
      passes.push(swaps);
      quiet = swaps.length ? 0 : quiet + 1;
      parity ^= 1;
    }
    while (passes.length && !passes[passes.length - 1].length) passes.pop();
    return { passes, final: a };
  }

  function sizing(S) {
    const Fl = F(S), A = analyze(S), right = dir(Fl.h + 90);
    const H = (id) => P(S, id).height;
    const groups = [];   // [{ cells: [{i, j}] ordered front -> back }]
    if (A.type === 'column') {
      Fl.elements.forEach((ids, i) => {
        const cells = [];
        for (let j = 1; j < ids.length; j++) if (ids[j] !== Fl.deputy) cells.push({ i, j });
        groups.push(cells);
      });
    } else {
      const n = Math.max(...Fl.elements.map((e) => e.length));
      for (let j = 0; j < n; j++) {
        const cells = [];
        for (let i = Fl.elements.length - 1; i >= 0; i--) if (j < Fl.elements[i].length && Fl.elements[i][j] !== Fl.deputy) cells.push({ i, j });
        groups.push(cells);
      }
    }
    const timeline = new Map();   // id -> program
    let maxPasses = 0;
    const plans = groups.map((cells) => {
      const ids = cells.map((c) => Fl.elements[c.i][c.j]);
      const plan = sizingPasses(ids, (a, b) => H(a) > H(b));
      maxPasses = Math.max(maxPasses, plan.passes.length);
      return { cells, ids, plan };
    });
    for (const p of cadets(S)) timeline.set(p.id, []);
    for (const { cells, ids, plan } of plans) {
      const cur = ids.slice();
      for (let k = 0; k < maxPasses; k++) {
        const swaps = plan.passes[k] || [];
        const moving = new Set();
        for (const s of swaps) {
          const front = cells[s], back = cells[s + 1];
          const tall = cur[s + 1], short = cur[s];
          const pf = E.slot(S, front.i, front.j), pb = E.slot(S, back.i, back.j);
          const mid = mul(add(pf, pb), 0.5);
          const mT = add(mid, mul(right, 12)), mS = sub(mid, mul(right, 12));
          timeline.get(tall).push({ t: 'say', text: 'tap' }, { t: 'wait' }, { t: 'goto', x: mT.x, y: mT.y, sp: 999, face: 'keep' }, { t: 'goto', x: pf.x, y: pf.y, sp: 999, face: 'keep' });
          timeline.get(short).push({ t: 'wait' }, { t: 'goto', x: mS.x, y: mS.y, sp: 999, face: 'keep' }, { t: 'goto', x: pb.x, y: pb.y, sp: 999, face: 'keep' });
          moving.add(tall); moving.add(short);
          [cur[s], cur[s + 1]] = [cur[s + 1], cur[s]];
        }
        for (const id of ids) if (!moving.has(id)) timeline.get(id).push({ t: 'wait', n: 3 });
      }
      cells.forEach((c, k) => { Fl.elements[c.i][c.j] = plan.final[k]; P(S, plan.final[k]).el = c.i; });
    }
    let moves = 0;
    for (const [id, prog] of timeline) { if (prog.some((x) => x.t === 'goto')) { P(S, id).prog = prog.concat([{ t: 'set', v: { off: { x: 0, y: 0 } } }]); moves++; } }
    return moves;
  }

  // ---------- inspection (ORI) helpers ----------
  function inspSpot(S, el, j) {
    const A = analyze(S);
    const s = j < 0 ? E.guideSlot(S) : E.slot(S, el, j);
    return add(s, mul(A.f, C.INSPECT));
  }
  function shadowFC(S, wait) {
    const fc = P(S, 'fc');
    fc.marching = false;
    fc.prog = [...rep(wait || 0, { t: 'wait' }), { t: 'seek', tgt: { k: 'shadow' }, sp: 40 }];
  }
  function fcShadowing(S) {
    const fc = P(S, 'fc'), I = P(S, 'insp');
    if (I.hidden) return false;
    const t = E.resolve(S, fc, { k: 'shadow' });
    return E.dist(fc, t) < 30;
  }
  const DISCREPANCIES = [
    'gig line off', 'scuffed shoes', 'loose thread on the right sleeve', 'name tape crooked',
    'hair out of regulation', 'ribbon rack not level', 'lint on the service coat', 'belt tip too long',
  ];

  // ---------- the catalog ----------
  const CMDS = [];
  const def = (c) => { CMDS.push(c); return c; };
  const T = (t, ...v) => (s) => (v.includes(analyze(s).type) ? null : t);

  // Forming & alignment
  def({
    id: 'fallIn', group: 'Forming & alignment', prep: '', exec: 'FALL IN',
    when: 'Any time the flight is not marching.',
    info: 'The guidon bearer posts facing you, on your left, so the first element falls in centered on you three paces away. Element leaders cover behind the first; everyone else fills in to the left at arm\'s length and dresses automatically. The flight forms facing wherever you are facing, so drag and turn yourself first.',
    ref: '¶4.3.1; Det ORI p.1',
    valid: (S) => (E.busy(S) ? BUSY : F(S).mode !== 'halted' ? 'Halt the flight first.' : null),
    run: (S) => { E.formLine(S, C.NORMAL, false); },
  });
  def({
    id: 'fallInClose', group: 'Forming & alignment', prep: 'At Close Interval', exec: 'FALL IN',
    when: 'Halted.',
    info: 'Forms the flight in line at close interval: 4 inches between shoulders, left hand on the hip. Only Dress Right (close interval), Ready Front, At Ease, Attention, Fall Out and Dismissed may follow.',
    ref: '¶4.3.4',
    valid: (S) => (E.busy(S) ? BUSY : F(S).mode !== 'halted' ? 'Halt the flight first.' : null),
    run: (S) => { E.formLine(S, C.CLOSE, false); },
  });
  def({
    id: 'dressRight', group: 'Forming & alignment', prep: 'Dress Right', exec: 'DRESS',
    when: 'Halted at attention, in line, normal interval.',
    info: 'Everyone but the last cadet in each element raises the left arm; everyone but the guidon bearer and the 2nd-4th element leaders turns head and eyes 45° right. The front rank takes interval off the base file; the ranks behind cover and take 40-inch distance. You then verify alignment from the flank and call "Cadet ___, move up/back". There is no command "steady".',
    ref: '¶4.4.1.1, ¶4.4.1.4; Det ORI p.4',
    valid: (S) => needAtt(S) || T('Dress Right is given to a flight in line formation.', 'line')(S) || (analyze(S).close ? 'At close interval the command is At Close Interval, Dress Right, DRESS.' : null),
    run: (S) => dressProg(S, { arm: 'L', head: 45 }),
  });
  def({
    id: 'dressRightClose', group: 'Forming & alignment', prep: 'At Close Interval, Dress Right', exec: 'DRESS',
    when: 'Halted at attention, in line, close interval.',
    info: 'Left hand on the hip, elbow in line with the body; heads right as for Dress Right. Not given to a flight at normal interval.',
    ref: '¶4.4.1.2',
    valid: (S) => needAtt(S) || T('Only given to a flight in line.', 'line')(S) || (!analyze(S).close ? 'At normal interval the command is Dress Right, DRESS.' : null),
    run: (S) => dressProg(S, { arm: 'hip', head: 45 }),
  });
  def({
    id: 'dressLeft', group: 'Forming & alignment', prep: 'Dress Left', exec: 'DRESS',
    when: 'Halted at attention, in inverted line.',
    info: 'Dress Right in a mirror: right arm up, heads turned left. Only given to a flight in inverted line formation.',
    ref: '¶4.4.1.3',
    valid: (S) => needAtt(S) || T('Dress Left is only given in inverted line formation.', 'invline')(S),
    run: (S) => dressProg(S, { arm: 'R', head: -45 }),
  });
  def({
    id: 'readyFront', group: 'Forming & alignment', prep: 'Ready', exec: 'FRONT',
    foot: 'L',
    when: 'After a dress, an Eyes Right/Left, or (Det ORI) after Close Ranks.',
    info: 'Arms come down with snap without slapping the leg, heads and eyes return to the front. Ends Eyes Right/Left as well; while marching it is given as the LEFT foot strikes.',
    ref: '¶4.4.1.1, ¶3.8',
    valid: (S) => common(S),
    run: (S) => {
      const Fl = F(S);
      const was = Fl.posture;
      for (const p of members(S)) p.prog.push({ t: 'set', v: { arm: null, head: 0, posture: 'att' } });
      const fc = P(S, 'fc');
      if (fc.posture === 'salute') fc.posture = 'att';
      Fl.posture = 'att'; Fl.eyes = null;
      if (was !== 'dress' && was !== 'eyes') return { note: 'Nothing to bring to the front; the flight was already at attention. (Det ORI calls Ready, FRONT after Close Ranks anyway.)' };
      return null;
    },
  });
  def({
    id: 'cover', group: 'Forming & alignment', prep: '', exec: 'COVER',
    when: 'Halted at attention, in column.',
    info: 'Column formation\'s version of dressing: everyone takes small choppy steps to re-establish dress, cover, interval and distance off the base file.',
    ref: '¶4.4.2',
    valid: (S) => needAtt(S) || T('COVER is given to a flight in column.', 'column', 'invcol')(S),
    run: (S) => {
      F(S).elements.forEach((ids, i) => ids.forEach((id, j) => { const s = E.slot(S, i, j); P(S, id).prog = [{ t: 'goto', x: s.x, y: s.y, sp: 8, face: 'keep' }, { t: 'set', v: { off: { x: 0, y: 0 } } }]; }));
    },
  });
  def({
    id: 'countOff', group: 'Forming & alignment', prep: 'Count', exec: 'OFF',
    when: 'Halted at attention, in line or column.',
    info: 'In column (the ORI way): element leaders turn their heads right and call ONE, then each rank in turn calls its number. In line: everyone but the element leaders turns heads right, the element leaders call ONE, and each file turns its head front as it calls. The guidon bearer never counts.',
    ref: '¶4.8; Det ORI p.3',
    valid: (S) => needAtt(S) || T('Count off in line or in column.', 'line', 'column')(S),
    run: (S) => {
      const t = analyze(S).type;
      F(S).elements.forEach((ids) => ids.forEach((id, j) => {
        const p = P(S, id), word = E.numWord(j + 1).toUpperCase();
        if (t === 'line') {
          p.prog = j === 0
            ? [{ t: 'set', v: { num: 1 } }, { t: 'say', text: 'ONE' }, { t: 'wait' }]
            : [{ t: 'set', v: { head: 45 } }, { t: 'wait', n: j }, { t: 'set', v: { head: 0, num: j + 1 } }, { t: 'say', text: word }, { t: 'wait' }];
        } else {
          p.prog = [...(j ? [{ t: 'wait', n: j }] : []), { t: 'set', v: { head: 45, num: j + 1 } }, { t: 'say', text: word }, { t: 'wait' }, { t: 'set', v: { head: 0 } }];
        }
      }));
    },
  });
  def({
    id: 'sizing', group: 'Forming & alignment', prep: 'If you are taller than the cadet in front of you', exec: 'TAP AND MOVE FORWARD',
    when: 'Halted at attention, in column or inverted line.',
    info: 'Taller cadets tap the cadet in front on the shoulder; the taller steps forward to the right at 45° and the shorter back to the left at 45°, swapping places, until no one is taller than the cadet in front. In column the guidon bearer and element leaders stand fast; in inverted line no one is excepted (your deputy, if shown, always stands fast). Sequence: Right FACE, size, Right FACE, size, Left FACE, size.',
    ref: '¶4.3.2; Det ORI p.2',
    valid: (S) => needAtt(S) || T('Size the flight in column (after Right, FACE) or inverted line.', 'column', 'invline')(S),
    run: (S) => (sizing(S) ? null : { note: 'Already sized: nobody is taller than the cadet in front of them.' }),
  });
  def({
    id: 'openRanks', group: 'Forming & alignment', prep: 'Open Ranks', exec: 'MARCH',
    when: 'Halted at attention, in line, normal interval, ranks closed.',
    info: 'Each element takes as many steps forward as there are elements behind it (with four: 3, 2, 1, stand fast), halts, and automatically dresses right; the guidon bearer goes with the first element. Ranks end 64 inches apart. Before giving it: march to the guidon bearer, take six paces forward and re-center.',
    ref: '¶4.5.1; Det ORI p.3-4',
    valid: (S) => needAtt(S) || T('Open Ranks is only given to a flight in line.', 'line')(S) || (analyze(S).close ? 'Only at normal interval.' : null) || (analyze(S).open ? 'The ranks are already open.' : null),
    run: (S) => {
      const Fl = F(S), En = Fl.elements.length, A = analyze(S), g = Fl.grid;
      const mis = new Map(E.misalign(S).map(([p, v]) => [p.id, v]));
      const newO = add(g.O, mul(A.f, (En - 1) * C.PACE));
      const ng = { ...g, O: newO, sd: C.OPEN };
      Fl.elements.forEach((ids, i) => ids.forEach((id, j) => {
        const p = P(S, id), s = E.slotOf(ng, i, j), off = mis.get(id) || { x: 0, y: 0 }, steps = En - 1 - i;
        p.prog = [
          ...rep(steps, { t: 'step', d: C.PACE }), ...(steps ? [{ t: 'wait' }] : []),
          { t: 'set', v: { posture: 'dress', arm: j === ids.length - 1 ? null : 'L', head: j === 0 && i ? 0 : 45 } },
          { t: 'goto', x: s.x + off.x, y: s.y + off.y, sp: 8, face: 'keep' }, { t: 'set', v: { off } },
        ];
      }));
      if (Fl.guide) {
        const gp = P(S, Fl.guide);
        gp.prog = [...rep(En - 1, { t: 'step', d: C.PACE }), ...(En > 1 ? [{ t: 'wait' }] : []), { t: 'set', v: { posture: 'dress', arm: 'L', head: 0 } }];
      }
      Fl.grid = { ...g, sd: C.OPEN };
      Fl.posture = 'dress';
    },
  });
  def({
    id: 'closeRanks', group: 'Forming & alignment', prep: 'Close Ranks', exec: 'MARCH',
    when: 'Halted at attention, ranks open.',
    info: 'The first element stands fast; the second takes one pace forward, the third two, the fourth three, and each halts at attention. (Det ORI then calls Ready, FRONT and FALL OUT.)',
    ref: '¶4.6; Det ORI p.7',
    valid: (S) => needAtt(S) || T('Only given to a flight in line.', 'line')(S) || (!analyze(S).open ? 'The ranks are not open.' : null),
    run: (S) => {
      const Fl = F(S), g = Fl.grid, ng = { ...g, sd: C.NORMAL };
      Fl.elements.forEach((ids, i) => ids.forEach((id, j) => {
        const s = E.slotOf(ng, i, j);
        P(S, id).prog = [...rep(i, { t: 'step', d: C.PACE }), ...(i ? [{ t: 'wait' }] : []), { t: 'goto', x: s.x, y: s.y, sp: 8, face: 'keep' }, { t: 'set', v: { off: { x: 0, y: 0 }, posture: 'att', arm: null, head: 0 } }];
      }));
      Fl.grid = ng;
    },
  });
  def({
    id: 'pacesForward', group: 'Forming & alignment', prep: '{n} Paces Forward', exec: 'MARCH', param: { min: 1, max: 4, def: 3, label: 'paces' },
    when: 'Halted at attention. Four paces or fewer.',
    info: 'Short repositioning: the flight steps off with the left foot, takes the number of 24-inch paces and halts.',
    ref: '¶5.3.2',
    valid: (S) => needAtt(S),
    run: (S, n) => { for (const p of members(S)) p.prog = [...rep(n, { t: 'step', d: C.PACE }), { t: 'wait' }]; },
  });
  def({
    id: 'stepsBackward', group: 'Forming & alignment', prep: '{n} Steps Backward', exec: 'MARCH', param: { min: 1, max: 4, def: 2, label: 'steps' },
    when: 'Halted at attention. Four steps or fewer.',
    info: '12-inch steps backward, left foot first, normal arm swing.',
    ref: '¶5.3.2',
    valid: (S) => needAtt(S),
    run: (S, n) => { for (const p of members(S)) p.prog = [...rep(n, { t: 'step', d: C.BACK, side: 180 }), { t: 'wait' }]; },
  });
  def({
    id: 'closeMarch', group: 'Forming & alignment', prep: 'Close', exec: 'MARCH',
    foot: 'R',
    when: 'In column at normal interval, halted or marching at quick time.',
    info: 'Halted: the right file stands fast and the others take right steps until 4 inches separate the shoulders. Marching (given on the right foot): the right file half steps, the others pivot 45° right, step across and pivot back, then everyone half steps until Forward, MARCH.',
    ref: '¶4.10.1-4.10.2',
    valid: (S) => (F(S).mode === 'halted' ? needAtt(S) : needMarching(S, ['quick'])) || T('Close March is given in column.', 'column')(S) || (analyze(S).close ? 'Already at close interval.' : null),
    run: (S) => {
      if (F(S).mode !== 'halted') { closeExtendMarching(S, true); return; }
      const files = E.fileGroups(S), base = files.length - 1, delta = C.NORMAL - C.CLOSE;
      files.forEach((fl, idx) => {
        const k = base - idx, total = k * delta;
        const full = Math.floor(total / C.SIDE), rem = total - full * C.SIDE;
        const pr = [];
        for (let s = 0; s < full; s++) pr.push({ t: 'step', d: C.SIDE, side: 90 }, { t: 'wait' });
        if (rem > 0.01) pr.push({ t: 'step', d: rem, side: 90 }, { t: 'wait' });
        for (const id of fl.ids) P(S, id).prog = E.clone(pr);
      });
      F(S).grid = { ...F(S).grid, sd: C.CLOSE };
      if (F(S).guide) guideRepost(S, Math.ceil((base * delta) / C.SIDE) * 2);
    },
  });
  def({
    id: 'extendMarch', group: 'Forming & alignment', prep: 'Extend', exec: 'MARCH',
    foot: 'L',
    when: 'In column at close interval, halted or marching at quick time.',
    info: 'Close March in reverse: back out to normal interval (marching: given on the left foot, pivots on the right foot).',
    ref: '¶4.10.3-4.10.4',
    valid: (S) => (F(S).mode === 'halted' ? needAtt(S) : needMarching(S, ['quick'])) || T('Extend March is given in column.', 'column')(S) || (!analyze(S).close ? 'Already at normal interval.' : null),
    run: (S) => {
      if (F(S).mode !== 'halted') { closeExtendMarching(S, false); return; }
      const files = E.fileGroups(S), base = files.length - 1, delta = C.NORMAL - C.CLOSE;
      files.forEach((fl, idx) => {
        const total = (base - idx) * delta;
        const full = Math.floor(total / C.SIDE), rem = total - full * C.SIDE;
        const pr = [];
        for (let s = 0; s < full; s++) pr.push({ t: 'step', d: C.SIDE, side: -90 }, { t: 'wait' });
        if (rem > 0.01) pr.push({ t: 'step', d: rem, side: -90 }, { t: 'wait' });
        for (const id of fl.ids) P(S, id).prog = E.clone(pr);
      });
      F(S).grid = { ...F(S).grid, sd: C.NORMAL };
    },
  });
  def({
    id: 'guideLeft', group: 'Forming & alignment', prep: 'Guide', exec: 'LEFT',
    when: 'In column, halted or marching.',
    info: 'The guide and the flight commander exchange places, passing right shoulder to right shoulder: the guide to the front of the left file, you to the right side.',
    ref: '¶4.2.5',
    valid: (S) => common(S) || T('GUIDE LEFT is given in column.', 'column')(S) || (!F(S).guide ? 'There is no guidon bearer in this flight.' : null) || (F(S).guideSide === 'L' ? 'The guide is already on the left.' : null),
    run: (S) => swapGuide(S, 'L'),
  });
  def({
    id: 'guideRight', group: 'Forming & alignment', prep: 'Guide', exec: 'RIGHT',
    when: 'In column with the guide on the left.',
    info: 'Puts the guide and the flight commander back in their normal places, again passing right shoulder to right shoulder.',
    ref: '¶4.2.5',
    valid: (S) => common(S) || T('GUIDE RIGHT is given in column.', 'column')(S) || (F(S).guideSide !== 'L' ? 'The guide is already on the right.' : null),
    run: (S) => swapGuide(S, 'R'),
  });
  function swapGuide(S, side) {
    const Fl = F(S);
    Fl.guideSide = side;
    const g = P(S, Fl.guide), gs = E.guideSlot(S);
    if (Fl.mode === 'halted') g.prog = [{ t: 'goto', x: gs.x, y: gs.y, sp: 30 }, { t: 'face', h: Fl.h }];
    else g.prog = [{ t: 'seek', tgt: { k: 'guidePost' }, sp: 30 }, { t: 'face', h: Fl.h }];
    const fc = P(S, 'fc'), post = E.fcPost(S);
    if (post) {
      const R = P(S, Fl.elements[0][0]), f = dir(Fl.h), r = dir(Fl.h + 90), v = sub(post, R);
      fc.prog = [{ t: 'seek', tgt: { k: 'rel', ref: R.id, along: dot(v, f), side: dot(v, r) }, sp: 36 }, ...(Fl.mode === 'halted' ? [{ t: 'face', h: post.h }] : [])];
    }
  }

  // Positions & courtesies
  def({
    id: 'attention', group: 'Positions & courtesies', prep: 'Flight', exec: 'ATTENTION',
    when: 'From parade rest, at ease, or rest; or marching at route step / at ease.',
    info: 'On "Flight" the cadets go to parade rest; on ATTENTION they come to attention. Marching at route step or at ease, it brings them back to marching at attention.',
    ref: '¶3.3.2, ¶3.19',
    valid: (S) => {
      const c = common(S); if (c) return c;
      const Fl = F(S);
      if (Fl.mode === 'route' || Fl.mode === 'atease') return null;
      if (Fl.mode !== 'halted') return 'The flight is already marching at attention.';
      if (!['parade', 'atease', 'rest'].includes(Fl.posture) && !cadets(S).some((p) => p.posture === 'parade')) return 'The flight is already at attention.';
      return null;
    },
    run: (S) => {
      const Fl = F(S);
      if (Fl.mode === 'route' || Fl.mode === 'atease') Fl.mode = 'quick';
      setAll(S, { posture: 'att', arm: null, head: 0 });
      Fl.posture = 'att';
    },
  });
  def({
    id: 'paradeRest', group: 'Positions & courtesies', prep: 'Parade', exec: 'REST',
    when: 'Halted at attention.',
    info: 'Left foot moves 12 inches left; hands form an X in the small of the back, right hand in the left palm. Silent and still.',
    ref: '¶3.3.1.1',
    valid: (S) => needAtt(S),
    run: (S) => { setAll(S, { posture: 'parade' }); F(S).posture = 'parade'; },
  });
  def({
    id: 'atEase', group: 'Positions & courtesies', prep: '', exec: 'AT EASE',
    when: 'Halted, at attention or parade rest.',
    info: 'Relax in place with the right foot still where it was. Silence.',
    ref: '¶3.3.1.2',
    valid: (S) => needHalted(S) || (['att', 'parade'].includes(F(S).posture) ? null : 'Give it from attention or parade rest.'),
    run: (S) => { setAll(S, { posture: 'atease' }); F(S).posture = 'atease'; },
  });
  def({
    id: 'rest', group: 'Positions & courtesies', prep: '', exec: 'REST',
    when: 'Halted, at attention or parade rest.',
    info: 'Physically the same as At Ease (right foot in place), but moderate speech is allowed. Det ORI uses it for the debrief.',
    ref: '¶3.3.1.3; Det ORI p.6',
    valid: (S) => needHalted(S) || (['att', 'parade', 'atease'].includes(F(S).posture) ? null : 'Give it from attention or parade rest.'),
    run: (S) => { setAll(S, { posture: 'rest' }); F(S).posture = 'rest'; },
  });
  def({
    id: 'fallOut', group: 'Positions & courtesies', prep: '', exec: 'FALL OUT',
    when: 'Halted.',
    info: 'Cadets may relax or break ranks but stay in the immediate area. FALL IN brings them back.',
    ref: '¶3.3.1.4',
    valid: (S) => needHalted(S),
    run: (S) => {
      for (const p of members(S)) {
        const v = { x: (E.rand(S) - 0.5) * 16, y: (E.rand(S) - 0.5) * 16 };
        p.prog = [{ t: 'nudge', ...v }, { t: 'set', v: { posture: 'fallout', arm: null, head: 0, h: nh(p.h + (E.rand(S) - 0.5) * 70) } }, { t: 'wait' }];
      }
      F(S).posture = 'fallout';
    },
  });
  def({
    id: 'dismissed', group: 'Positions & courtesies', prep: '', exec: 'DISMISSED',
    when: 'Halted at attention.',
    info: 'Cadets break ranks and leave the area. FALL IN forms a new flight on you.',
    ref: '¶4.3.5',
    valid: (S) => needAtt(S),
    run: (S) => {
      for (const p of members(S)) {
        const a = E.rand(S) * 360, d = 80 + E.rand(S) * 160, to = add(p, mul(dir(a), d));
        p.prog = [{ t: 'goto', x: to.x, y: to.y, sp: 40 }, { t: 'set', v: { posture: 'dismissed' } }];
      }
      F(S).posture = 'dismissed';
    },
  });
  def({
    id: 'presentArms', group: 'Positions & courtesies', prep: 'Present', exec: 'ARMS',
    when: 'Halted at attention.',
    info: 'The whole flight salutes in one count, and you salute too. Hold until Order, ARMS.',
    ref: '¶3.7',
    valid: (S) => needAtt(S),
    run: (S) => { setAll(S, { posture: 'salute' }); F(S).posture = 'salute'; P(S, 'fc').posture = 'salute'; },
  });
  def({
    id: 'orderArms', group: 'Positions & courtesies', prep: 'Order', exec: 'ARMS',
    when: 'While the flight is saluting.',
    info: 'The salute comes down the way it went up; cup the hand as it passes the waist.',
    ref: '¶3.7',
    valid: (S) => needHalted(S) || (F(S).posture !== 'salute' ? 'The flight is not saluting.' : null),
    run: (S) => { setAll(S, { posture: 'att' }); F(S).posture = 'att'; P(S, 'fc').posture = 'att'; },
  });
  for (const [id, label, sgn, foot] of [['eyesRight', 'RIGHT', 1, 'R'], ['eyesLeft', 'LEFT', -1, 'L']]) {
    def({
      id, group: 'Positions & courtesies', prep: 'Eyes', exec: label, foot,
      when: 'Halted or marching at quick time, at attention.',
      info: `Everyone except the ${sgn > 0 ? 'right' : 'left'} flank turns head and eyes 45° ${sgn > 0 ? 'right' : 'left'}; you salute and hold it. Ready, FRONT ends it (on the opposite foot).`,
      ref: '¶3.8; AFJROTC 30-Step #20',
      valid: (S) => (F(S).mode === 'halted' ? needAtt(S) : needMarching(S, ['quick'])),
      run: (S) => {
        const r = dir(F(S).h + 90);
        const lat = members(S).map((p) => dot(p, r) * sgn);
        const edge = Math.max(...lat);
        members(S).forEach((p, i) => p.prog.push({ t: 'set', v: { head: lat[i] > edge - 8 ? 0 : 45 * sgn } }));
        F(S).posture = 'eyes'; F(S).eyes = sgn;
        P(S, 'fc').posture = 'salute';
      },
    });
  }
  def({
    id: 'elemsParade', group: 'Positions & courtesies', prep: 'Second{rest} Elements, Parade', exec: 'REST',
    when: 'Halted at attention in line (ORI, after reporting to the inspector).',
    info: 'Every element except the first goes to parade rest; the first stays at attention for the inspector. From here on the element leaders call their own elements up and down as the inspector approaches and leaves.',
    ref: '¶4.5.3; Det ORI p.4-5',
    valid: (S) => needAtt(S) || T('Given to a flight in line.', 'line')(S) || (F(S).elements.length < 2 ? 'There is only one element.' : null),
    run: (S) => { for (const p of cadets(S)) if (p.el > 0) p.prog.push({ t: 'set', v: { posture: 'parade' } }); },
  });
  def({
    id: 'elemAtt', group: 'Positions & courtesies', prep: '{ord} Element', exec: 'ATTENTION', param: { min: 1, max: 6, def: 2, label: 'element' }, by: 'el',
    when: 'Called by an element leader during the inspection.',
    info: 'The element leader pins the head 45° down the line and calls the element to attention as the inspector approaches.',
    ref: '¶4.5.6; Det ORI p.6',
    valid: (S, n) => common(S) || (n > F(S).elements.length ? 'No such element.' : null),
    run: (S, n) => { const el = P(S, F(S).elements[n - 1][0]); el.prog.push({ t: 'set', v: { head: -45 } }, { t: 'say', text: `${E.ORD[n - 1]} Element, ATTENTION` }, { t: 'wait' }, { t: 'set', v: { head: 0 } }); for (const id of F(S).elements[n - 1]) P(S, id).prog.push({ t: 'set', v: { posture: 'att' } }); },
  });
  def({
    id: 'elemParade', group: 'Positions & courtesies', prep: '{ord} Element, Parade', exec: 'REST', param: { min: 1, max: 6, def: 1, label: 'element' }, by: 'el',
    when: 'Called by an element leader once the inspector has moved on.',
    info: 'When the leader sees the inspector leave the element out of the corner of the eye, head pinned 45° down the line: "First Element, Parade, REST."',
    ref: '¶4.5.6; Det ORI p.6',
    valid: (S, n) => common(S) || (n > F(S).elements.length ? 'No such element.' : null),
    run: (S, n) => { const el = P(S, F(S).elements[n - 1][0]); el.prog.push({ t: 'set', v: { head: -45 } }, { t: 'say', text: `${E.ORD[n - 1]} Element, Parade, REST` }, { t: 'wait' }, { t: 'set', v: { head: 0 } }); for (const id of F(S).elements[n - 1]) P(S, id).prog.push({ t: 'set', v: { posture: 'parade' } }); },
  });

  // Facings
  for (const [id, prep, a, info] of [
    ['rightFace', 'Right', 90, 'Pivot 90° right on the left heel and right ball, then bring the left foot up: two counts. From line this puts the flight in column (the guidon bearer moves to the front of the right file); from column, into inverted line.'],
    ['leftFace', 'Left', -90, 'Pivot 90° left, two counts. From column back to line; from line into inverted column.'],
    ['aboutFace', 'About', 180, 'Right toe half a shoe-length behind and left, then pivot 180° right: two counts.'],
    ['halfRightFace', 'Half Right', 45, 'Right Face, but 45°. Used when instructions call for 45° movements.'],
    ['halfLeftFace', 'Half Left', -45, 'Left Face, but 45°. Used when instructions call for 45° movements.'],
  ]) {
    def({
      id, group: 'Facings', prep, exec: 'FACE', when: 'Halted at attention.', info, ref: id.startsWith('half') ? '¶3.4.3' : '¶3.4.1-3.4.2, ¶4.2.2',
      valid: (S) => needAtt(S),
      run: (S) => {
        for (const p of members(S)) p.prog = [{ t: 'pivot', a, full: true }, { t: 'wait' }];
        F(S).h = nh(F(S).h + a);
        guideRepost(S);
      },
    });
  }

  // Marching
  def({
    id: 'forward', group: 'Marching', prep: 'Forward', exec: 'MARCH', foot: 'L',
    when: 'From a halt; or out of mark time or the half step (on the left foot); or to end a column movement.',
    info: 'From a halt: step off with the left foot, 24-inch steps, 100-120 a minute. Out of the half step: one more 12-inch step with the right foot, then the full step. Out of mark time: one more step in place, then step off.',
    ref: '¶3.10, ¶3.12.3, ¶3.13.2, ¶4.11.1.6',
    valid: (S) => {
      const c = common(S); if (c) return c;
      const Fl = F(S);
      if (Fl.mode === 'halted') return needAtt(S);
      if (Fl.mode === 'half' || Fl.mode === 'mark') return null;
      if (Fl.mode === 'route' || Fl.mode === 'atease') return 'Call Flight, ATTENTION first.';
      return 'The flight is already marching forward.';
    },
    run: (S) => {
      const Fl = F(S);
      if (Fl.mode === 'halted') { Fl.mode = 'quick'; fcFollowStart(S); return { march: 4 }; }
      const seq = Fl.mode === 'half' ? [{ t: 'step', d: C.HALF }] : [{ t: 'wait' }];
      forMarchers(S, () => E.clone(seq));
      Fl.mode = 'quick'; Fl.awaitForward = false;
      return { march: 3 };
    },
  });
  def({
    id: 'halt', group: 'Marching', prep: 'Flight', exec: 'HALT',
    when: 'Marching at attention (either foot).',
    info: 'One more step, then the trailing foot comes alongside: two counts. From double time: two more double-time steps, then halt in two counts. If the flight halts in line with the guide not abreast of the front rank, the guide moves up.',
    ref: '¶3.10.2, ¶3.11.5, ¶4.2.3',
    valid: (S) => needMarching(S, ['quick', 'half', 'mark', 'double', 'rstep', 'lstep']),
    run: (S) => {
      const Fl = F(S), seq = haltSeq(Fl.mode);
      for (const p of members(S)) p.prog = E.clone(seq);
      const fc = P(S, 'fc');
      // You halt with the flight and face it on the same count the heels come together.
      if (fc.marching) fc.prog = [...E.clone(seq.slice(0, -1)), { t: 'set', v: { marching: false } }, { t: 'faceFlight' }, { t: 'wait' }];
      Fl.mode = 'halted';
      guideRepost(S, seq.length, ['line', 'invline']);
    },
  });
  def({
    id: 'markTime', group: 'Marching', prep: 'Mark Time', exec: 'MARCH',
    when: 'Marching at quick time (either foot), or from a halt.',
    info: 'One more step, then march in place: balls of the feet 4 inches up, normal arm swing. Quick time only.',
    ref: '¶3.12',
    valid: (S) => (F(S).mode === 'halted' ? needAtt(S) : needMarching(S, ['quick', 'half'])),
    run: (S) => {
      const Fl = F(S);
      if (Fl.mode === 'halted') { Fl.mode = 'mark'; fcFollowStart(S); return { march: 2 }; }
      forMarchers(S, () => [{ t: 'step', d: Fl.mode === 'half' ? C.HALF : C.PACE }]);
      Fl.mode = 'mark';
      return { march: 2 };
    },
  });
  def({
    id: 'halfStep', group: 'Marching', prep: 'Half Step', exec: 'MARCH',
    when: 'Marching at quick time (either foot). Never from a halt.',
    info: 'One more 24-inch step, then 12-inch steps, heel first. No changes of direction from the half step.',
    ref: '¶3.13',
    valid: (S) => needMarching(S, ['quick']),
    run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.PACE }]); F(S).mode = 'half'; return { march: 3 }; },
  });
  def({
    id: 'changeStep', group: 'Marching', prep: 'Change Step', exec: 'MARCH', foot: 'R',
    when: 'Marching at quick time, given on the right foot.',
    info: 'One more step with the left foot; in one count the ball of the right foot comes up beside the left heel and the weight shifts; step off again with the left. Puts a cadet back in step.',
    ref: '¶3.15',
    valid: (S) => needMarching(S, ['quick']),
    run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.PACE }, { t: 'wait' }]); S.foot = S.foot === 'L' ? 'R' : 'L'; return { march: 2 }; },
  });
  def({
    id: 'doubleTime', group: 'Marching', prep: 'Double Time', exec: 'MARCH',
    when: 'From a halt or quick time.',
    info: '180 steps a minute, 30 inches, forearms horizontal. From quick time: one more quick-time step first. Only Incline, Quick Time and Halt may then be given.',
    ref: '¶3.11',
    valid: (S) => (F(S).mode === 'halted' ? needAtt(S) : needMarching(S, ['quick'])),
    run: (S) => {
      const Fl = F(S);
      if (Fl.mode === 'halted') { Fl.mode = 'double'; fcFollowStart(S); return { march: 4 }; }
      forMarchers(S, () => [{ t: 'step', d: C.PACE }]);
      Fl.mode = 'double';
      return { march: 4 };
    },
  });
  def({
    id: 'quickTime', group: 'Marching', prep: 'Quick Time', exec: 'MARCH',
    when: 'In double time (either foot).',
    info: 'Two more double-time steps, then quick time with arms back at the sides.',
    ref: '¶3.11.4',
    valid: (S) => needMarching(S, ['double']),
    run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.DOUBLE }, { t: 'step', d: C.DOUBLE }]); F(S).mode = 'quick'; return { march: 3 }; },
  });
  for (const [id, prep, mode] of [['rightStep', 'Right Step', 'rstep'], ['leftStep', 'Left Step', 'lstep']]) {
    def({
      id, group: 'Marching', prep, exec: 'MARCH',
      when: 'From a halt only, short distances.',
      info: `12-inch steps ${mode === 'rstep' ? 'right' : 'left'}, heels together between steps. The only command allowed until it stops is Flight, HALT (one more step, heels together).`,
      ref: '¶3.14; AFJROTC 30-Step #29',
      valid: (S) => needAtt(S),
      run: (S) => { F(S).mode = mode; F(S).phase = 0; return { march: 4 }; },
    });
  }
  for (const [id, prep, mode] of [['routeStep', 'Route Step', 'route'], ['atEaseMarch', 'At Ease', 'atease']]) {
    def({
      id, group: 'Marching', prep, exec: 'MARCH',
      when: 'Marching at quick time.',
      info: mode === 'route'
        ? 'One more step, then route step: no cadence, talking allowed, dress/cover/interval/distance kept.'
        : 'One more step, then at ease: no cadence, but silence; dress/cover/interval/distance kept.',
      ref: '¶3.19',
      valid: (S) => needMarching(S, ['quick']),
      run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.PACE }]); F(S).mode = mode; setAll(S, { posture: mode }); F(S).posture = mode; return { march: 3 }; },
    });
  }

  // Direction changes
  for (const [id, prep, a, foot] of [['rightFlank', 'Right Flank', 90, 'R'], ['leftFlank', 'Left Flank', -90, 'L']]) {
    def({
      id, group: 'Direction changes', prep, exec: 'MARCH', foot,
      when: `Marching at quick time, on the ${foot === 'R' ? 'right' : 'left'} foot.`,
      info: `Everyone at once: one more step, pivot 90° ${a > 0 ? 'right' : 'left'} and step off in the new direction in one count. A column becomes a line (or the reverse); for short distances.`,
      ref: '¶3.17, ¶4.2.3',
      valid: (S) => needMarching(S, ['quick']),
      run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.PACE }, { t: 'pivot', a }]); F(S).h = nh(F(S).h + a); return { march: 2 }; },
    });
  }
  def({
    id: 'toTheRear', group: 'Direction changes', prep: 'To the Rear', exec: 'MARCH', foot: 'R',
    when: 'Marching at quick time, on the right foot.',
    info: 'A 12-inch step with the left foot, pivot 180° right on the balls of both feet (a full count), a 12-inch step in the new direction, then the full step.',
    ref: '¶3.16',
    valid: (S) => needMarching(S, ['quick']),
    run: (S) => { forMarchers(S, () => [{ t: 'step', d: C.HALF }, { t: 'pivot', a: 180, full: true }, { t: 'step', d: C.HALF }]); F(S).h = nh(F(S).h + 180); return { march: 2 }; },
  });
  const columnOK = (S) => {
    const t = analyze(S).type;
    if (F(S).mode === 'halted') return needAtt(S) || (['column', 'invcol', 'free'].includes(t) ? null : 'Column movements are for a flight in column (Right, FACE from line first).');
    return needMarching(S, ['quick']) || (['line', 'invline'].includes(t) ? 'The flight is marching in line. Flank it back into column first.' : null);
  };
  for (const [id, prep, turn, foot, info] of [
    ['columnRight', 'Column Right', 90, 'R', 'The right file\'s leader takes one more step, pivots 90° right, steps once and half steps. Each other element leader pivots 45° right, crosses (2, 4, 6 steps), pivots 45° again and marches until even with the cadet on the right, then half steps. Everyone else pivots where the cadet in front did. When all have turned, the only command is Forward, MARCH.'],
    ['columnLeft', 'Column Left', -90, 'L', 'Column Right mirrored on the left file. From a halt, the element leaders start with a face in marching (no first step).'],
  ]) {
    def({
      id, group: 'Direction changes', prep, exec: 'MARCH', foot, when: 'In column, marching at quick time or halted.', info, ref: '¶4.11',
      valid: columnOK,
      run: (S) => { columnMove(S, turn, { kind: 'column', after: 'half', await: true }); },
    });
  }
  for (const [id, prep, turn, foot] of [['columnHalfRight', 'Column Half Right', 45, 'R'], ['columnHalfLeft', 'Column Half Left', -45, 'L']]) {
    def({
      id, group: 'Direction changes', prep, exec: 'MARCH', foot,
      when: 'In column, marching at quick time or halted.',
      info: 'A 45° change of direction. The flank leader steps, pivots 45°, steps again and half steps until the rank is abreast; the rest pivot 45° keeping their interval and march until abreast. Then everyone resumes the full step on their own.',
      ref: '¶4.12',
      valid: columnOK,
      run: (S) => { columnMove(S, turn, { kind: 'half', after: 'quick', await: false }); return { march: 2 }; },
    });
  }
  for (const [id, prep, turn] of [['inclineRight', 'Incline to the Right', 22.5], ['inclineLeft', 'Incline to the Left', -22.5]]) {
    def({
      id, group: 'Direction changes', prep, exec: '',
      when: 'Marching: quick time, double time, route step or at ease.',
      info: 'A slight change of direction with no pivot: the guide (guiding element) leans the way, the rest follow. Shown here as 22.5°.',
      ref: '¶4.12.4',
      valid: (S) => needMarching(S, ['quick', 'double', 'route', 'atease']) || (['line', 'invline'].includes(analyze(S).type) ? 'Incline is for a flight in column here.' : null),
      run: (S) => { const m = F(S).mode; columnMove(S, turn, { kind: 'incline', incline: true, after: m, await: false }); return { march: 2 }; },
    });
  }
  def({
    id: 'counterMarch', group: 'Direction changes', prep: 'Counter', exec: 'MARCH', foot: 'L',
    when: 'In column, marching (on the left foot) or halted.',
    info: 'Reverses the column in a small space. With four elements: 1st leader 4 steps, turns right across the front; 2nd leader 2 steps, right; 3rd leader 1 step, two lefts; 4th leader 3 steps, left across the front. Each file passes back between the others and half steps; then Forward, MARCH. From a halt the leaders first take 5/3/2/4 paces.',
    ref: '¶4.16',
    valid: (S) => columnOK(S) || (E.fileGroups(S).length < 2 ? 'Needs at least two files.' : null),
    run: (S) => { counterMarch(S); },
  });

  // Files
  for (const [id, prep, fromRight, turn] of [
    ['filesRight', 'Column of Files From the Right, Forward', true, 0],
    ['filesLeft', 'Column of Files From the Left, Forward', false, 0],
    ['filesRightCR', 'Column of Files From the Right, Column Right', true, 90],
    ['filesLeftCL', 'Column of Files From the Left, Column Left', false, -90],
  ]) {
    def({
      id, group: 'Files', prep, exec: 'MARCH',
      when: 'Halted at attention, in column of two or more elements.',
      info: turn
        ? 'As Column of Files, but the first element turns as it steps off and the others pivot where its leader did. Everyone half steps... here they keep 24-inch steps until you call the next command.'
        : `The ${fromRight ? 'right' : 'left'} element steps off; each other element stands fast until the last cadet of the element before it passes, then steps off and inclines in behind it. Not a precise movement.${fromRight ? '' : ' The guide first posts in front of the left file.'}`,
      ref: turn ? '¶4.13.2' : '¶4.13.1',
      valid: (S) => needAtt(S) || T('Column of Files is given to a flight in column.', 'column')(S) || (E.fileGroups(S).length < 2 ? 'Already a single file.' : null),
      run: (S) => { columnOfFiles(S, fromRight, turn); },
    });
  }
  for (const [id, toLeft] of [['reformLeft', true], ['reformRight', false]]) {
    def({
      id, group: 'Files', prep: `Column of {E}s to the ${toLeft ? 'Left' : 'Right'}`, exec: 'MARCH',
      when: 'Halted, in a single file of more than one element.',
      info: `Re-forms a single file into a column: the leading element stands fast, the others step off with a column half ${toLeft ? 'left' : 'right'}, incline up beside it and are halted abreast by their element leaders.`,
      ref: '¶4.13.3, ¶4.14',
      valid: (S) => needAtt(S) || (analyze(S).type !== 'free' || E.fileGroups(S).length !== 1 ? 'Only given to a flight in a single file.' : null),
      run: (S) => { reformFromFile(S, toLeft); },
    });
  }

  // Inspection (ORI)
  const insp = (S) => P(S, 'insp');
  def({
    id: 'inspApproach', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector', exec: 'APPROACHES',
    when: 'Flight in line, ranks open and fronted; you one pace forward of the guidon bearer, faced right toward the inspector.',
    info: 'The inspector walks up and halts in front of you. Then salute and report: "Good morning, Sir/Ma\'am, ___ Flight is prepared for inspection." Salute whatever the inspector\'s rank.',
    ref: 'Det ORI p.4; ¶4.5.3',
    valid: (S) => common(S) || T('The flight should be in line for an ORI.', 'line')(S),
    run: (S) => {
      const fc = P(S, 'fc'), I = insp(S);
      const start = add(fc, add(mul(dir(fc.h), 8 * C.PACE), mul(dir(fc.h - 90), 4 * C.PACE)));
      const stop = add(fc, mul(dir(fc.h), 2 * C.PACE));
      Object.assign(I, { hidden: false, x: start.x, y: start.y, h: nh(fc.h + 180), posture: 'att' });
      I.prog = [{ t: 'goto', x: stop.x, y: stop.y, sp: 30 }, { t: 'face', h: nh(fc.h + 180) }];
      S.insp = null;
    },
  });
  def({
    id: 'reportIn', group: 'Inspection (ORI)', actor: 'fc', prep: 'Salute and report', exec: '',
    when: 'The inspector has halted in front of you.',
    info: '"Good morning/afternoon/evening Sir/Ma\'am, ___ Flight is prepared for inspection." Inspector: "Good ___, accompany me on this inspection." You: "Accompany you on this inspection. Yes Sir/Ma\'am. Thank you Sir/Ma\'am." Then left face and put the 2nd-4th elements at parade rest.',
    ref: 'Det ORI p.4',
    valid: (S) => common(S) || (insp(S).hidden ? 'Bring the inspector in first.' : null),
    run: (S) => {
      const fc = P(S, 'fc'), I = insp(S), name = S.name;
      fc.prog = [{ t: 'set', v: { posture: 'salute' } }, { t: 'say', text: `Good morning Sir/Ma'am, ${name} Flight is prepared for inspection.`, kind: 'fc' }, { t: 'wait', n: 3 },
        { t: 'set', v: { posture: 'att' } }, { t: 'wait', n: 2 }, { t: 'say', text: 'Accompany you on this inspection. Yes Sir/Ma\'am. Thank you Sir/Ma\'am.', kind: 'fc' }, { t: 'wait', n: 2 }];
      I.prog = [{ t: 'wait', n: 2 }, { t: 'set', v: { posture: 'salute' } }, { t: 'wait' }, { t: 'set', v: { posture: 'att' } }, { t: 'say', text: 'Good morning, accompany me on this inspection.', kind: 'insp' }, { t: 'wait', n: 2 }];
    },
  });
  def({
    id: 'inspBegin', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector', exec: 'INSPECTS THE GUIDON BEARER',
    when: 'After the report and Parade, REST.',
    info: 'The inspector starts at the right of the line with the guidon bearer. Do the diagonal three step to end up in front of the first element leader, one pace to the inspector\'s right and one pace behind: the shadow position you hold for the whole inspection.',
    ref: 'Det ORI p.5; Fig 5.3',
    valid: (S) => common(S) || (insp(S).hidden ? 'Bring the inspector in first.' : null) || T('The flight should be in line.', 'line')(S),
    run: (S) => {
      const A = analyze(S), I = insp(S), to = F(S).guide ? inspSpot(S, 0, -1) : inspSpot(S, 0, 0);
      I.prog = [{ t: 'goto', x: to.x, y: to.y, sp: 30 }, { t: 'face', h: nh(A.f ? E.hdg(mul(A.f, -1)) : 180) }];
      S.insp = { el: 0, j: F(S).guide ? -1 : 0 };
    },
  });
  def({
    id: 'inspNext', group: 'Inspection (ORI)', actor: 'insp', prep: 'Duck walk to the next cadet', exec: '',
    when: 'During the inspection of an element.',
    info: 'On the inspector\'s cue both of you side-step to the next cadet down the element, keeping your shadow position: one pace right of and one pace behind the inspector, so you stand in front of the next cadet.',
    ref: 'Det ORI p.5; ¶4.5.3.1',
    valid: (S) => common(S) || (!S.insp ? 'Start the inspection first.' : null),
    run: (S) => {
      const st = S.insp, ids = F(S).elements[st.el];
      if (st.j + 1 >= ids.length) return { note: 'That was the last cadet of the element. Use "Next element" for the half duck walk, Left Flank, Left Flank.' };
      const carry = fcShadowing(S);
      st.j++;
      const I = insp(S), to = inspSpot(S, st.el, st.j);
      I.prog = [{ t: 'goto', x: to.x, y: to.y, sp: 30, face: 'keep' }];
      if (carry) P(S, 'fc').prog = [{ t: 'seek', tgt: { k: 'shadow' }, sp: 30, face: 'keep' }];
      return null;
    },
  });
  def({
    id: 'inspAbout', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector: "About', exec: 'FACE"',
    when: 'While a cadet is being inspected.',
    info: 'Some inspectors face the cadet about to inspect the back of the uniform. Give it again to face them front.',
    ref: 'Det ORI p.5',
    valid: (S) => common(S) || (!S.insp || S.insp.j < 0 ? 'No cadet is being inspected.' : null),
    run: (S) => { const p = P(S, F(S).elements[S.insp.el][S.insp.j]); p.prog = [{ t: 'pivot', a: 180, full: true }, { t: 'wait' }]; },
  });
  def({
    id: 'inspNextElement', group: 'Inspection (ORI)', actor: 'insp', prep: 'Next element: Left Flank, Left Flank', exec: '',
    when: 'After the last cadet of an element (or "Cursory / To the end").',
    info: 'Half duck walk into a forward march past the end of the element, Left Flank, MARCH, then an automatic second Left Flank down the next element, halting at its leader, and Right Face together. You trail the inspector, then end one step right and behind. The element leaders call their elements up and down as you pass.',
    ref: 'Det ORI p.6',
    valid: (S) => common(S) || (!S.insp ? 'Start the inspection first.' : null) || (S.insp.el + 1 >= F(S).elements.length ? 'That was the last element. The inspector moves off; you go three paces in front of the guidon bearer, Left Face, Flight, ATTENTION.' : null),
    run: (S) => {
      const st = S.insp, A = analyze(S), g = F(S).grid, I = insp(S);
      const n = Math.max(...F(S).elements.map((e) => e.length));
      const front = (el) => add(E.slot(S, el, 0), mul(A.f, C.INSPECT));
      const beyond = (el) => add(front(el), mul(g.ur, n * g.su));
      const p1 = beyond(st.el), p2 = beyond(st.el + 1), p3 = front(st.el + 1);
      const carry = fcShadowing(S);
      I.prog = [{ t: 'goto', x: p1.x, y: p1.y, sp: C.PACE }, { t: 'goto', x: p2.x, y: p2.y, sp: C.PACE }, { t: 'goto', x: p3.x, y: p3.y, sp: C.PACE }, { t: 'face', h: E.hdg(mul(A.f, -1)) }];
      // The commander trails the inspector around the end of the element, then takes the shadow again.
      if (carry) P(S, 'fc').prog = [{ t: 'wait' }, { t: 'goto', x: p1.x, y: p1.y, sp: C.PACE }, { t: 'goto', x: p2.x, y: p2.y, sp: C.PACE }, { t: 'seek', tgt: { k: 'shadow' }, sp: C.PACE }];
      const next = st.el + 1;
      const elNext = P(S, F(S).elements[next][0]), elCur = P(S, F(S).elements[st.el][0]);
      elNext.prog.push({ t: 'wait', n: 2 }, { t: 'set', v: { head: -45 } }, { t: 'say', text: `${E.ORD[next]} Element, ATTENTION` }, { t: 'wait' }, { t: 'set', v: { head: 0 } });
      for (const id of F(S).elements[next]) P(S, id).prog.push({ t: 'wait', n: 3 }, { t: 'set', v: { posture: 'att' } });
      elCur.prog.push({ t: 'wait', n: 4 }, { t: 'set', v: { head: -45 } }, { t: 'say', text: `${E.ORD[st.el]} Element, Parade, REST` }, { t: 'wait' }, { t: 'set', v: { head: 0 } });
      for (const id of F(S).elements[st.el]) P(S, id).prog.push({ t: 'wait', n: 5 }, { t: 'set', v: { posture: 'parade' } });
      S.insp = { el: next, j: 0 };
    },
  });
  def({
    id: 'fcShadow', group: 'Inspection (ORI)', actor: 'fc', prep: 'Take the shadow position', exec: '',
    when: 'During the inspection.',
    info: 'One pace to the inspector\'s right and one pace behind, facing the same way: in front of the next cadet to be inspected.',
    ref: 'Det ORI p.5; ¶4.5.3',
    valid: (S) => common(S) || (insp(S).hidden ? 'There is no inspector out.' : null),
    run: (S) => { shadowFC(S); },
  });
  def({
    id: 'inspDepart', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector', exec: 'MOVES OFF',
    when: 'After the whole flight has been inspected.',
    info: 'The inspector moves anywhere they like before the debrief. You go directly three paces in front of the guidon bearer, Left Face, and call Flight, ATTENTION.',
    ref: 'Det ORI p.6; ¶4.5.4',
    valid: (S) => common(S) || (insp(S).hidden ? 'There is no inspector out.' : null),
    run: (S) => {
      const A = analyze(S), I = insp(S), gs = E.guideSlot(S) || E.slot(S, 0, 0);
      const to = add(gs, add(mul(A.right, 4 * C.PACE), mul(A.f, 5 * C.PACE)));
      I.prog = [{ t: 'goto', x: to.x, y: to.y, sp: 30 }, { t: 'face', h: E.hdg(mul(A.right, -1)) }];
      S.insp = null;
    },
  });
  def({
    id: 'inspDebrief', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector', exec: 'RETURNS FOR THE DEBRIEF',
    when: 'After Flight, ATTENTION.',
    info: 'The inspector comes to you. Greet them: "Sir/Ma\'am, ___ Flight has completed the Open Ranks Inspection." They give the discrepancies. Then Left Face and REST, and debrief the flight from its center.',
    ref: 'Det ORI p.6',
    valid: (S) => common(S) || (insp(S).hidden ? 'There is no inspector out.' : null),
    run: (S) => {
      const fc = P(S, 'fc'), I = insp(S), to = add(fc, mul(dir(fc.h), 2 * C.PACE));
      I.prog = [{ t: 'goto', x: to.x, y: to.y, sp: 30 }, { t: 'face', h: nh(fc.h + 180) }];
    },
  });
  def({
    id: 'reportOut', group: 'Inspection (ORI)', actor: 'fc', prep: 'Report: inspection complete', exec: '',
    when: 'The inspector has come back to you for the debrief.',
    info: '"Sir/Ma\'am, ___ Flight has completed the Open Ranks Inspection." The inspector gives the discrepancies; salute when they leave.',
    ref: 'Det ORI p.6',
    valid: (S) => common(S) || (insp(S).hidden ? 'There is no inspector out.' : null),
    run: (S) => {
      const fc = P(S, 'fc'), I = insp(S);
      const pick = [Math.floor(E.rand(S) * DISCREPANCIES.length), Math.floor(E.rand(S) * DISCREPANCIES.length)];
      const cs = cadets(S), who = cs[Math.floor(E.rand(S) * cs.length)];
      fc.prog = [{ t: 'say', text: `Sir/Ma'am, ${S.name} Flight has completed the Open Ranks Inspection.`, kind: 'fc' }, { t: 'wait', n: 3 }];
      I.prog = [{ t: 'wait', n: 3 }, { t: 'say', text: `Discrepancies: ${E.ORD[who.el].toLowerCase()} element, cadet ${who.num || E.cadets(S).filter((p) => p.el === who.el).indexOf(who) + 1}: ${DISCREPANCIES[pick[0]]}. Another cadet: ${DISCREPANCIES[pick[1]]}.`, kind: 'insp' }, { t: 'wait', n: 3 }];
    },
  });
  for (const [id, text, when] of [
    ['report30In', 'Sir/Ma\'am, {name} Flight is prepared for the 30-step drill sequence. Request permission to use your drill area, Sir/Ma\'am!', 'After FALL IN, before the first command.'],
    ['report30Out', 'Sir/Ma\'am, {name} Flight requests permission to exit your drill area, Sir/Ma\'am!', 'After the final Flight, HALT.'],
  ]) {
    def({
      id, group: 'Reports', actor: 'fc', prep: id === 'report30In' ? 'Report in to the evaluator' : 'Report out to the evaluator', exec: '',
      when, info: `"${text.replace('{name}', '___')}" Salute while reporting and hold it until it is returned.`, ref: 'AFJROTC Drill Pamphlet, 30-Step',
      valid: (S) => common(S),
      run: (S) => { P(S, 'fc').prog = [{ t: 'set', v: { posture: 'salute' } }, { t: 'say', text: text.replace('{name}', S.name), kind: 'fc' }, { t: 'wait', n: 3 }, { t: 'set', v: { posture: 'att' } }]; },
    });
  }
  def({
    id: 'inspLeave', group: 'Inspection (ORI)', actor: 'insp', prep: 'Inspector', exec: 'DEPARTS',
    when: 'After the debrief.',
    info: 'Salute the inspector on departure; they leave and you carry on with the flight.',
    ref: '¶4.5.4',
    valid: (S) => common(S) || (insp(S).hidden ? 'There is no inspector out.' : null),
    run: (S) => {
      const I = insp(S), to = add(I, mul(dir(I.h + 90), 12 * C.PACE));
      const fc = P(S, 'fc');
      fc.prog = [{ t: 'set', v: { posture: 'salute' } }, { t: 'wait', n: 2 }, { t: 'set', v: { posture: 'att' } }];
      I.prog = [{ t: 'set', v: { posture: 'salute' } }, { t: 'wait' }, { t: 'set', v: { posture: 'att' } }, { t: 'goto', x: to.x, y: to.y, sp: 40 }, { t: 'set', v: { hidden: true } }];
      S.insp = null;
    },
  });

  // ---------- running a command ----------
  const byId = Object.fromEntries(CMDS.map((c) => [c.id, c]));

  function label(c, S, arg) {
    let prep = c.prep;
    if (prep.includes('{n}')) prep = prep.replace('{n}', E.numWord(arg ?? c.param.def));
    if (prep.includes('{ord}')) prep = prep.replace('{ord}', E.ORD[(arg ?? c.param.def) - 1]);
    if (prep.includes('{rest}')) {
      const n = S ? S.flight.elements.length : 4;
      if (n <= 2) prep = prep.replace('Second{rest} Elements', 'Second Element');
      const tail = E.ORD.slice(2, n).map((w) => w.toLowerCase());
      prep = prep.replace('{rest}', tail.length ? (tail.length > 1 ? ', ' + tail.slice(0, -1).join(', ') + ', and ' + tail[tail.length - 1] : ' and ' + tail[0]) : '');
    }
    if (prep.includes('{E}')) {
      const n = S ? S.flight.elements.length : 2;
      prep = prep.replace('{E}', ({ 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six' })[n] || String(n));
    }
    return { prep, exec: c.exec, text: c.exec ? (prep ? `${prep}, ${c.exec}` : c.exec) : prep };
  }

  function check(S, id, arg) {
    const c = byId[id];
    if (!c) return 'Unknown command.';
    return c.valid(S, arg ?? (c.param && c.param.def));
  }

  /**
   * Give a command. Returns { ok, reason?, note?, march?, waited? }. While marching, a command that must be
   * given on one foot waits a count for that foot, as the commander would.
   */
  function give(S, id, arg) {
    const c = byId[id];
    if (!c) return { ok: false, reason: 'Unknown command.' };
    const a = arg ?? (c.param && c.param.def);
    const why = c.valid(S, a);
    if (why) return { ok: false, reason: why };
    let waited = 0;
    if (c.foot && S.flight.mode !== 'halted') {
      while (S.foot !== c.foot && waited < 2) { E.tick(S); waited++; }
    }
    const res = c.run(S, a) || {};
    return { ok: true, waited, ...res };
  }

  root.DrillCommands = { CMDS, byId, give, check, label, needAtt, needHalted, needMarching, sizingPasses };
})(typeof globalThis !== 'undefined' ? globalThis : this);
