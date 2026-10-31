/* Flight Drill Sim: everything on screen. The engine (engine.js), the command catalog (commands.js) and the
   practice scripts (scripts.js) are pure; this file draws them, animates the counts and takes input. */
(function () {
  'use strict';
  const E = window.DrillEngine, K = window.DrillCommands, SC = window.DrillScripts;
  const { C } = E;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(r));

  // ---------- storage: per-viewer conveniences only ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: keep it for this session */ } },
  };
  const DEF = {
    elements: 3, cadets: 15, guidon: true, deputy: false, name: 'Charlie', postPaces: 3,
    fcFollow: true, misalign: true, routeAround: true, snap: true, faceTravel: false,
    speed: 'normal', byNumbers: false, follow: true, marchCounts: 4,
    showGrid: true, showNumbers: true, showHeights: false, showTrails: true, showMarchTrail: true, colors: true,
    voice: false, theme: 'auto', scriptMode: 'walk', autoShadow: true,
  };
  const set = Object.assign({}, DEF, store.get('fd.settings', {}));
  const saveSettings = () => store.set('fd.settings', set);
  const DEFAULT_HOT = [
    { id: 'fallIn' }, { id: 'attention' }, { id: 'forward' }, { id: 'halt' },
    { id: 'rightFace' }, { id: 'leftFace' }, { id: 'columnRight' }, { id: 'columnLeft' },
  ];
  let hot = store.get('fd.hot', DEFAULT_HOT).filter((h) => K.byId[h.id]);
  const saveHot = () => store.set('fd.hot', hot);
  const SPEED = { slow: 650, normal: 320, fast: 130, instant: 0 };
  const WALK = { slow: 70, normal: 150, fast: 320, instant: 0 };

  // ---------- state ----------
  let S = E.createState(stateOpts());
  let trails = [];
  let marchTrail = [];
  let log = [];
  let script = null;
  let hist = [];
  let fut = [];
  let sel = null;
  let playing = false;
  let running = null;
  let stopFlag = false;
  let lastPrev = null;

  function stateOpts() {
    return {
      elements: set.elements, cadets: set.cadets, guidon: set.guidon, deputy: set.deputy, flightName: set.name,
      opts: { fcFollow: set.fcFollow, misalign: set.misalign, postPaces: set.postPaces },
    };
  }
  function syncOpts() {
    S.opts.fcFollow = set.fcFollow; S.opts.misalign = set.misalign; S.opts.postPaces = set.postPaces; S.name = set.name;
  }

  // ---------- svg + camera ----------
  const svg = $('svg');
  const L = {
    pad: $('padRect'), march: $('lyrMarch'), guides: $('lyrGuides'), trails: $('lyrTrails'),
    ghost: $('lyrGhost'), people: $('lyrPeople'), labels: $('lyrLabels'), bubbles: $('lyrBubbles'),
  };
  const cam = { cx: 0, cy: 120, s: 2.2 };
  let vw = 800, vh = 600;
  function applyCam() {
    const r = svg.getBoundingClientRect();
    vw = r.width || 800; vh = r.height || 600;
    const w = vw / cam.s, h = vh / cam.s, x = cam.cx - w / 2, y = cam.cy - h / 2;
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    L.pad.setAttribute('x', x - w); L.pad.setAttribute('y', y - h);
    L.pad.setAttribute('width', w * 3); L.pad.setAttribute('height', h * 3);
    L.pad.style.display = set.showGrid ? '' : 'none';
  }
  function toWorld(cx, cy) {
    const r = svg.getBoundingClientRect();
    return { x: cam.cx + (cx - r.left - r.width / 2) / cam.s, y: cam.cy + (cy - r.top - r.height / 2) / cam.s };
  }
  function toScreen(p) {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2 + (p.x - cam.cx) * cam.s, y: r.top + r.height / 2 + (p.y - cam.cy) * cam.s };
  }
  function visiblePeople() { return S.order.map((id) => S.ppl[id]).filter((p) => p && !p.hidden); }
  function bbox(list) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of list) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    return { x0, y0, x1, y1 };
  }
  // The floating chrome covers parts of the pad; framing keeps the flight in the part that is still visible.
  function insets() {
    const stage = $('stage').getBoundingClientRect();
    const card = $('scriptCard');
    let right = 16;
    if (!card.hidden && stage.width > 860) right = Math.max(right, stage.right - card.getBoundingClientRect().left + 12);
    let bottom = stage.width > 860 ? 84 : 170;
    // On a phone the panel is a bottom sheet over the pad.
    if (stage.width <= 860 && !app.classList.contains('panel-closed')) bottom = Math.max(bottom, stage.bottom - $('panel').getBoundingClientRect().top + 12);
    return { left: 16, right, top: 64, bottom };
  }
  function fit(extra) {
    applyCam();
    const b = bbox(visiblePeople().concat(extra || []));
    const pad = 40, ins = insets();
    const aw = Math.max(120, vw - ins.left - ins.right), ah = Math.max(120, vh - ins.top - ins.bottom);
    const w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2;
    cam.s = Math.max(0.35, Math.min(6, Math.min(aw / w, ah / h)));
    // center of the free area, in screen px from the stage center, converted to world units
    const ox = (ins.left - ins.right) / 2, oy = (ins.top - ins.bottom) / 2;
    cam.cx = (b.x0 + b.x1) / 2 - ox / cam.s; cam.cy = (b.y0 + b.y1) / 2 - oy / cam.s;
    applyCam();
  }
  /** Keep the flight, you, and anything the tool is pointing at (a ghost) on screen. */
  function follow(extra) {
    if (!set.follow && !extra) return;
    const list = E.members(S).concat([S.ppl.fc], extra || []);
    const b = bbox(list);
    const ins = insets();
    const w = vw / cam.s, h = vh / cam.s;
    const left = cam.cx - w / 2 + (ins.left + 24) / cam.s, right = cam.cx + w / 2 - (ins.right + 24) / cam.s;
    const top = cam.cy - h / 2 + (ins.top + 24) / cam.s, bottom = cam.cy + h / 2 - (ins.bottom + 24) / cam.s;
    if (b.x1 - b.x0 > right - left || b.y1 - b.y0 > bottom - top) { fit(extra); return; }
    let dx = 0, dy = 0;
    if (b.x0 < left) dx = b.x0 - left; else if (b.x1 > right) dx = b.x1 - right;
    if (b.y0 < top) dy = b.y0 - top; else if (b.y1 > bottom) dy = b.y1 - bottom;
    if (dx || dy) { cam.cx += dx; cam.cy += dy; applyCam(); }
  }
  new ResizeObserver(() => { applyCam(); drawAll(); }).observe(svg);

  // ---------- people ----------
  const glyphs = new Map();
  function glyphFor(p) {
    let G = glyphs.get(p.id);
    if (G) return G;
    const g = svgEl('g', { class: 'pp', 'data-id': p.id }, L.people);
    const b = svgEl('g', {}, g);
    svgEl('circle', { class: 'ring', r: 17 }, b);
    svgEl('path', { class: 'pp-limb arm-l', d: 'M -9 0 L -33 0' }, b);
    svgEl('path', { class: 'pp-limb arm-r', d: 'M 9 0 L 33 0' }, b);
    svgEl('path', { class: 'pp-limb hip', d: 'M -9 -1 L -15 3 L -9 6' }, b);
    svgEl('path', { class: 'pp-limb salute', d: 'M 9 -1 L 6 -8 L 2.5 -9' }, b);
    svgEl('path', { class: 'pp-limb parade', d: 'M -6 6.5 L 6 6.5' }, b);
    svgEl('rect', { class: 'pp-body', x: -10, y: -5.5, width: 20, height: 11, rx: 5.5 }, b);
    const head = svgEl('g', {}, b);
    svgEl('circle', { class: 'pp-head', r: 4.6 }, head);
    svgEl('path', { class: 'pp-bill', d: 'M -3.6 -2.6 Q 0 -8.6 3.6 -2.6 Z' }, head);
    if (p.role === 'guide') {
      svgEl('line', { class: 'flag-pole', x1: 10, y1: -1, x2: 13, y2: -20 }, b);
      svgEl('path', { class: 'flag', d: 'M 13 -20 L 25 -16 L 13.5 -12 Z' }, b);
    }
    G = { g, b, head, cls: '' };
    glyphs.set(p.id, G);
    return G;
  }
  function pruneGlyphs() {
    for (const [id, G] of glyphs) if (!S.ppl[id]) { G.g.remove(); glyphs.delete(id); }
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function lerpH(a, b, t) {
    let d = ((b - a) % 360 + 540) % 360 - 180;
    if (Math.abs(Math.abs(d) - 180) < 1e-6) d = 180;
    return a + d * t;
  }
  function classOf(p) {
    const F = S.flight;
    const c = ['pp'];
    if (p.role === 'cadet') {
      c.push(set.colors ? `el${p.el}` : 'el0');
      const ids = F.elements[p.el] || [];
      if (ids[0] === p.id) c.push('is-el');
      else if (ids.length > 2 && ids[ids.length - 1] === p.id) c.push('is-last');
    } else c.push(p.role);
    if (p.role === 'fc' || p.role === 'insp') c.push('actor');
    if (p.arm) c.push('arm-' + p.arm);
    c.push('pos-' + p.posture);
    if (sel === p.id) c.push('sel');
    if (drag && drag.id === p.id) c.push('dragging');
    return c.join(' ');
  }
  function elColor(i) { return `var(--e${i % 6})`; }
  function drawPeople(t) {
    const prev = lastPrev;
    for (const id of S.order) {
      const p = S.ppl[id];
      if (!p) continue;
      const G = glyphFor(p);
      G.g.style.display = p.hidden ? 'none' : '';
      if (p.hidden) continue;
      const q = prev && t < 1 && prev[id];
      const x = q ? lerp(q.x, p.x, t) : p.x, y = q ? lerp(q.y, p.y, t) : p.y;
      const h = q ? lerpH(q.h, p.h, t) : p.h;
      const s = p.role === 'cadet' ? 0.86 + ((p.height - 62) / 14) * 0.26 : p.role === 'fc' || p.role === 'insp' ? 1.12 : 1;
      G.b.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${h.toFixed(2)}) scale(${s.toFixed(3)})`);
      G.head.setAttribute('transform', `rotate(${p.head || 0})`);
      const cls = classOf(p);
      if (cls !== G.cls) { G.g.setAttribute('class', cls); G.cls = cls; }
      if (p.role === 'cadet') G.g.style.setProperty('--c', elColor(set.colors ? p.el : 0));
      G.pos = { x, y };
    }
  }

  // labels: count-off numbers, heights, tags, misalignment marks
  function drawLabels() {
    L.labels.textContent = '';
    for (const id of S.order) {
      const p = S.ppl[id], G = glyphs.get(id);
      if (!p || p.hidden || !G || !G.pos) continue;
      const { x, y } = G.pos;
      if (p.role === 'fc' || p.role === 'insp' || p.role === 'guide') {
        const t = svgEl('text', { class: `lbl lbl-tag ${p.role === 'guide' ? 'g' : p.role}`, x, y: p.role === 'insp' ? y + 20 : y - 19 }, L.labels);
        t.textContent = p.role === 'fc' ? 'YOU' : p.role === 'insp' ? 'INSPECTOR' : 'GUIDON';
        continue;
      }
      if (set.showNumbers && p.num) {
        svgEl('circle', { class: 'lbl-num-bg', cx: x, cy: y - 15, r: 5.6 }, L.labels);
        const t = svgEl('text', { class: 'lbl lbl-num', x, y: y - 15 }, L.labels);
        t.textContent = p.num;
      }
      if (set.showHeights) {
        const t = svgEl('text', { class: 'lbl lbl-h', x, y: y + 15 }, L.labels);
        t.textContent = `${Math.floor(p.height / 12)}'${p.height % 12}"`;
      }
      if (showAlignHints() && E.len(p.off || { x: 0, y: 0 }) > 0.5) {
        const f = E.dir(S.flight.h), o = E.dot(p.off, f);
        const tip = { x: x + f.x * (o > 0 ? 13 : -13), y: y + f.y * (o > 0 ? 13 : -13) };
        svgEl('circle', { class: 'bad-mark', cx: tip.x, cy: tip.y, r: 2.6 }, L.labels);
      }
    }
  }
  function showAlignHints() {
    if (!script) return false;
    const st = script.steps[script.idx];
    return st && st.kind === 'align' && script.mode === 'walk';
  }

  function wrap(text, n) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > n && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    return lines;
  }
  function drawBubbles() {
    L.bubbles.textContent = '';
    const seen = new Set();
    for (let i = S.events.length - 1; i >= 0; i--) {
      const e = S.events[i];
      if (S.t - e.t > 1 || seen.has(e.id)) continue;
      seen.add(e.id);
      const G = glyphs.get(e.id);
      if (!G || !G.pos) continue;
      const long = e.text.length > 14;
      const lines = long ? wrap(e.text, 34) : [e.text];
      const w = Math.max(...lines.map((l) => l.length)) * 4.7 + 10, h = lines.length * 10 + 6;
      const g = svgEl('g', { class: `bub ${e.kind || ''}`, transform: `translate(${G.pos.x} ${G.pos.y - 22 - h / 2})` }, L.bubbles);
      svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4 }, g);
      lines.forEach((ln, k) => { const t = svgEl('text', { x: 0, y: -h / 2 + 8 + k * 10 }, g); t.textContent = ln; });
    }
  }

  // ---------- trails and guides ----------
  function pathLen(pts) { let d = 0; for (let i = 1; i < pts.length; i++) d += E.dist(pts[i - 1], pts[i]); return d; }
  function paceText(d) { const p = Math.round((d / C.PACE) * 2) / 2; return `${p} pace${p === 1 ? '' : 's'}`; }
  function drawTrailInto(parent, tr, cls, marker, noLabel) {
    const d = tr.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    svgEl('path', { class: cls, d, 'marker-end': `url(#${marker})` }, parent);
    if (noLabel) return;
    let best = 1, bl = -1;
    for (let i = 1; i < tr.pts.length; i++) { const l = E.dist(tr.pts[i - 1], tr.pts[i]); if (l > bl) { bl = l; best = i; } }
    const a = tr.pts[best - 1], b = tr.pts[best];
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const txt = paceText(pathLen(tr.pts));
    const w = txt.length * 4.6 + 8;
    const g = svgEl('g', { class: 'trail-lbl', transform: `translate(${m.x} ${m.y})`, style: `color: var(--${tr.who === 'insp' ? 'insp' : cls.includes('preview') ? 'accent' : 'fc'})` }, parent);
    svgEl('rect', { x: -w / 2, y: -6, width: w, height: 12, rx: 6 }, g);
    const t = svgEl('text', { x: 0, y: 0 }, g); t.textContent = txt;
  }
  function drawTrails(preview) {
    L.trails.textContent = '';
    if (set.showTrails) {
      // Older paths fade and lose their pace labels, so a long session stays readable.
      trails.forEach((tr, i) => {
        const old = i < trails.length - 3;
        drawTrailInto(L.trails, tr, `trail ${tr.who === 'insp' ? 'insp' : ''} ${old ? 'old' : ''}`, tr.who === 'insp' ? 'arrInsp' : 'arrFc', old);
      });
    }
    if (preview) drawTrailInto(L.trails, preview, 'trail preview', 'arrPrev');
  }
  function drawMarch() {
    L.march.textContent = '';
    if (!set.showMarchTrail || marchTrail.length < 2) return;
    const d = marchTrail.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    svgEl('path', { class: 'mtrail', d }, L.march);
  }
  function drawGuides() {
    L.guides.textContent = '';
    if (!script) return;
    const st = script.steps[script.idx];
    if (!st || st.kind !== 'align' || !S.flight.grid) return;
    const ids = S.flight.elements[st.el];
    if (!ids) return;
    const a = E.slot(S, st.el, 0), b = E.slot(S, st.el, ids.length - 1);
    const u = E.mul(S.flight.grid.ur, 30);
    svgEl('line', { class: 'rankline', x1: a.x - u.x, y1: a.y - u.y, x2: b.x + u.x, y2: b.y + u.y }, L.guides);
  }
  function drawGhost() {
    L.ghost.textContent = '';
    if (!script) return;
    const st = script.steps[script.idx];
    if (!st || st.kind !== 'fc') return;
    if (script.mode === 'quiz' && !script.reveal) return;
    const t = st.target(S);
    if (st.route && script.mode === 'walk') {
      const pts = [S.ppl.fc, ...st.route(S)];
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      svgEl('path', { class: 'hint-route', d, 'marker-end': 'url(#arrHint)' }, L.ghost);
    }
    const g = svgEl('g', { class: 'ghost', transform: `translate(${t.x} ${t.y})` }, L.ghost);
    svgEl('circle', { class: 'gring', r: t.tol }, g);
    const b = svgEl('g', { transform: `rotate(${t.h})` }, g);
    svgEl('rect', { class: 'pp-body', x: -10, y: -5.5, width: 20, height: 11, rx: 5.5 }, b);
    svgEl('circle', { class: 'pp-head', r: 4.6 }, b);
    svgEl('path', { class: 'garrow', d: 'M -4 -9 L 0 -16 L 4 -9 Z' }, b);
    const tx = svgEl('text', { x: 0, y: t.tol + 10 }, g);
    tx.textContent = 'STAND HERE';
  }

  function drawAll(t = 1) {
    drawPeople(t);
    if (t >= 1) { drawLabels(); drawBubbles(); drawGuides(); drawGhost(); drawTrails(drag && drag.preview); drawMarch(); }
  }

  // ---------- status, caption, toast, voice ----------
  const TYPE = { line: 'Line', column: 'Column', invline: 'Inverted line', invcol: 'Inverted column', free: 'Single file', other: 'Faced 45°' };
  const MODE = { halted: 'Halted', quick: 'Quick time', half: 'Half step', mark: 'Mark time', double: 'Double time', rstep: 'Right step', lstep: 'Left step', route: 'Route step', atease: 'At ease, marching' };
  const POST = { att: 'Attention', parade: 'Parade rest', atease: 'At ease', rest: 'Rest', fallout: 'Fallen out', dismissed: 'Dismissed', dress: 'Dressed', salute: 'Present arms', eyes: 'Eyes turned', route: 'Route step', atease2: 'At ease' };
  function drawStatus() {
    const A = E.analyze(S), F = S.flight;
    const scattered = F.posture === 'fallout' || F.posture === 'dismissed';
    const parts = [`<b>${scattered ? 'Not formed' : TYPE[A.type] || A.type}</b>`, MODE[F.mode] || F.mode];
    if (F.mode === 'halted') parts.push(POST[F.posture] || F.posture);
    if (A.close) parts.push('close interval');
    if (A.open) parts.push('ranks open');
    if (F.awaitForward) parts.push('<span style="color:var(--warn)">waiting for Forward, MARCH</span>');
    if (E.busy(S)) parts.push('<span style="color:var(--accent)">executing…</span>');
    const foot = `<span class="foot" title="Foot that just struck"><i class="${S.foot === 'L' ? 'on' : ''}">L</i><i class="${S.foot === 'R' ? 'on' : ''}">R</i></span>`;
    $('status').innerHTML = parts.join(' · ') + foot;
    $('count').textContent = `count ${S.t}`;
    $('undo').disabled = !hist.length; $('redo').disabled = !fut.length;
    $('play').textContent = playing ? '⏸' : '▶';
    $('byNumbers').classList.toggle('on', set.byNumbers);
    $('zfollow').classList.toggle('on', set.follow);
  }
  let capTimer = 0;
  function caption(lb) {
    const el = $('caption');
    el.innerHTML = lb.exec ? `${lb.prep ? esc(lb.prep) + ', ' : ''}<b>${esc(lb.exec)}</b>` : `<b>${esc(lb.prep)}</b>`;
    el.classList.add('on');
    clearTimeout(capTimer);
    capTimer = setTimeout(() => el.classList.remove('on'), 2600);
  }
  let toastTimer = 0;
  function toast(msg, kind) {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'fd-toast on' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), Math.min(7000, 2200 + msg.length * 35));
  }
  function speak(lb) {
    if (!set.voice || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(lb.exec ? `${lb.prep ? lb.prep + '... ' : ''}${lb.exec}` : lb.prep);
      u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch { /* speech unavailable */ }
  }

  // ---------- history ----------
  // The log is a journal, not state: it stays out of snapshots (its entries hold snapshots themselves,
  // and nesting them would grow without bound).
  function snapshot() {
    return JSON.stringify({ S, trails, marchTrail, script: script && { id: script.id, idx: script.idx, mode: script.mode, score: script.score, misses: script.misses, reveal: script.reveal, result: script.result, checked: script.checked, done: script.done, revealAll: script.revealAll } });
  }
  function restore(snap) {
    const o = JSON.parse(snap);
    S = o.S; trails = o.trails; marchTrail = o.marchTrail;
    if (o.script) {
      const def = SC.SCRIPTS.find((d) => d.id === o.script.id);
      script = { ...o.script, def, steps: def.build(S) };
    } else script = null;
    syncOpts();
    pruneGlyphs();
    lastPrev = null;
    refresh();
  }
  function pushHistory() {
    hist.push(snapshot());
    if (hist.length > 150) hist.shift();
    fut = [];
  }
  async function undo() {
    await stopPlay();
    if (!hist.length) return;
    fut.push(snapshot());
    restore(hist.pop());
    toast('Undone');
  }
  async function redo() {
    await stopPlay();
    if (!fut.length) return;
    hist.push(snapshot());
    restore(fut.pop());
    toast('Redone');
  }

  // ---------- running counts ----------
  function capture() {
    const m = {};
    for (const id of S.order) { const p = S.ppl[id]; if (p) m[id] = { x: p.x, y: p.y, h: p.h }; }
    return m;
  }
  async function animate(prev) {
    const dur = SPEED[set.speed];
    lastPrev = prev;
    if (!dur || document.hidden) { lastPrev = null; drawAll(1); return; }
    const t0 = performance.now();
    for (;;) {
      await frame();
      const t = Math.min(1, (performance.now() - t0) / dur);
      drawPeople(t);
      if (t >= 1) break;
    }
    lastPrev = null;
    drawAll(1);
  }
  async function stepOnce() {
    const prev = capture();
    E.tick(S);
    afterTick();
    await animate(prev);
    follow();
  }
  function afterTick() {
    const F = S.flight;
    if (F.mode !== 'halted' || E.busy(S)) {
      const lead = F.guide ? S.ppl[F.guide] : S.ppl[F.elements[0][0]];
      const last = marchTrail[marchTrail.length - 1];
      if (!last || E.dist(last, lead) > 6) marchTrail.push({ x: lead.x, y: lead.y });
      if (marchTrail.length > 600) marchTrail.splice(0, marchTrail.length - 600);
    }
    drawStatus();
    refreshValidity();
    scriptAutoCheck();
  }
  async function runCounts(n, untilIdle) {
    stopFlag = false;
    const job = (async () => {
      let k = 0;
      while (!stopFlag && k < 600) {
        const work = E.busy(S) || E.actorsBusy(S);
        if (untilIdle && !work && n <= 0) break;
        if (!untilIdle && n <= 0) break;
        if (!work) n--;
        await stepOnce();
        k++;
      }
    })();
    running = job;
    await job;
    if (running === job) running = null;
  }
  async function stopPlay() {
    playing = false;
    stopFlag = true;
    if (running) await running;
    stopFlag = false;
    drawStatus();
  }
  async function play() {
    if (playing) { await stopPlay(); return; }
    playing = true; drawStatus();
    stopFlag = false;
    const job = (async () => {
      while (!stopFlag) {
        const work = E.busy(S) || E.actorsBusy(S) || S.flight.mode !== 'halted';
        if (!work) break;
        await stepOnce();
        if (SPEED[set.speed] === 0) await sleep(60);
      }
    })();
    running = job;
    await job;
    if (running === job) running = null;
    playing = false; drawStatus();
  }
  async function stepKey(n) {
    if (playing) { await stopPlay(); return; }
    if (running) return;
    const F = S.flight;
    if (F.mode === 'halted' && !E.busy(S) && !E.actorsBusy(S)) { toast('The flight is halted and still. Give it a command.'); return; }
    await runCounts(n, false);
  }

  // ---------- giving commands ----------
  async function giveCmd(id, arg) {
    const c = K.byId[id];
    if (!c) return;
    const a = arg ?? (c.param && c.param.def);
    const lb = K.label(c, S, a);
    if (scriptBlocks(id, a, lb)) return;
    await stopPlay();
    const why = K.check(S, id, a);
    if (why) {
      toast(why, 'bad');
      addLog({ t: S.t, text: lb.text, bad: why });
      return;
    }
    pushHistory();
    addLog({ t: S.t, text: lb.text, snap: hist[hist.length - 1] });
    if (c.foot && S.flight.mode !== 'halted') {
      let w = 0;
      while (S.foot !== c.foot && w < 2) { await stepOnce(); w++; }
      if (w) log[0].note = `waited for the ${c.foot === 'R' ? 'right' : 'left'} foot`;
    }
    caption(lb); speak(lb);
    const res = K.give(S, id, a);
    if (!res.ok) { toast(res.reason, 'bad'); return; }
    if (res.note) { toast(res.note); log[0].note = res.note; }
    if (c.actor === 'insp' || c.actor === 'fc') { /* actor commands: no march counts */ }
    if (id === 'fallIn' || id === 'fallInClose') { marchTrail = []; }
    scriptAfterCommand(id, a);
    refresh();
    if (!set.byNumbers) await runCounts(S.flight.mode !== 'halted' ? (res.march ?? set.marchCounts) : 0, true);
    scriptAfterRun();
    refresh();
  }

  // ---------- the commander: drag, facings, post ----------
  let drag = null;
  function flightFrame() {
    const F = S.flight;
    return { f: E.dir(F.h), r: E.dir(F.h + 90), O: F.grid ? F.grid.O : { x: 0, y: 0 } };
  }
  function snapPt(p, free) {
    if (!set.snap || free) return p;
    const { f, r, O } = flightFrame();
    const v = E.sub(p, O);
    const a = Math.round(E.dot(v, f) / 12) * 12, b = Math.round(E.dot(v, r) / 12) * 12;
    return E.add(O, E.add(E.mul(f, a), E.mul(r, b)));
  }
  function obstacle() {
    const ms = E.members(S).filter((p) => !p.hidden);
    if (!ms.length || S.flight.posture === 'dismissed') return null;
    const f = E.dir(S.flight.h), r = E.dir(S.flight.h + 90);
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const p of ms) { const a = E.dot(p, f), b = E.dot(p, r); a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const m = 22;
    const at = (a, b) => E.add(E.mul(f, a), E.mul(r, b));
    return [at(a0 - m, b0 - m), at(a1 + m, b0 - m), at(a1 + m, b1 + m), at(a0 - m, b1 + m)];
  }
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  function inside(poly, p) {
    let sgn = 0;
    for (let i = 0; i < poly.length; i++) {
      const c = cross(poly[i], poly[(i + 1) % poly.length], p);
      if (Math.abs(c) < 1e-6) return false;
      const s = Math.sign(c);
      if (!sgn) sgn = s; else if (s !== sgn) return false;
    }
    return true;
  }
  function properX(a, b, c, d) {
    const d1 = cross(a, b, c), d2 = cross(a, b, d), d3 = cross(c, d, a), d4 = cross(c, d, b);
    return ((d1 > 1e-6 && d2 < -1e-6) || (d1 < -1e-6 && d2 > 1e-6)) && ((d3 > 1e-6 && d4 < -1e-6) || (d3 < -1e-6 && d4 > 1e-6));
  }
  function blocked(poly, a, b) {
    if (inside(poly, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })) return true;
    for (let i = 0; i < poly.length; i++) if (properX(a, b, poly[i], poly[(i + 1) % poly.length])) return true;
    return false;
  }
  /** Shortest route from a to b that does not march through the flight (a straight line when nothing is in the way). */
  function route(a, b) {
    a = { x: a.x, y: a.y }; b = { x: b.x, y: b.y };
    if (!set.routeAround) return [a, b];
    const poly = obstacle();
    if (!poly || inside(poly, a) || inside(poly, b) || !blocked(poly, a, b)) return [a, b];
    const c = poly.reduce((s, p) => ({ x: s.x + p.x / 4, y: s.y + p.y / 4 }), { x: 0, y: 0 });
    const nodes = [a, b, ...poly.map((p) => E.add(p, E.mul(E.sub(p, c), 1 / Math.max(1, E.dist(p, c)))))];
    const n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
    dist[0] = 0;
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      done[u] = true;
      for (let v = 0; v < n; v++) {
        if (done[v] || v === u || blocked(poly, nodes[u], nodes[v])) continue;
        const d = dist[u] + E.dist(nodes[u], nodes[v]);
        if (d < dist[v]) { dist[v] = d; prev[v] = u; }
      }
    }
    if (dist[1] === Infinity) return [a, b];
    const out = [];
    for (let v = 1; v >= 0; v = prev[v]) { out.unshift(nodes[v]); if (v === 0) break; }
    return out;
  }
  function addTrail(who, pts) {
    if (pathLen(pts) < 4) return;
    trails.push({ who, pts: pts.map((p) => ({ x: p.x, y: p.y })) });
    const mine = trails.filter((t) => t.who === who);
    if (mine.length > 12) trails.splice(trails.indexOf(mine[0]), 1);
  }

  function moveActor(id, to, pts, opts) {
    const p = S.ppl[id];
    const path = pts || route(p, to);
    if (opts && opts.faceTravel && path.length > 1) p.h = E.hdg(E.sub(path[path.length - 1], path[path.length - 2]));
    p.x = to.x; p.y = to.y;
    p.prog = [];
    if (id === 'fc') p.marching = p.marching && S.flight.mode !== 'halted';
    addTrail(id === 'insp' ? 'insp' : 'fc', path);
  }
  async function walkActor(id, pts, h) {
    const p = S.ppl[id];
    const sp = WALK[set.speed];
    const full = [{ x: p.x, y: p.y }, ...pts.slice(1)];
    if (sp) {
      for (let i = 1; i < full.length; i++) {
        const a = full[i - 1], b = full[i], L0 = E.dist(a, b);
        if (L0 < 0.5) continue;
        p.h = E.hdg(E.sub(b, a));
        const t0 = performance.now();
        for (;;) {
          await frame();
          const u = Math.min(1, ((performance.now() - t0) / 1000) * sp / L0);
          p.x = a.x + (b.x - a.x) * u; p.y = a.y + (b.y - a.y) * u;
          drawPeople(1);
          if (u >= 1) break;
        }
      }
    }
    p.x = full[full.length - 1].x; p.y = full[full.length - 1].y;
    if (h != null) p.h = E.nh(h);
    addTrail(id === 'insp' ? 'insp' : 'fc', full);
    refresh();
  }

  async function fcAction(kind) {
    const fc = S.ppl.fc;
    if (kind === 'clear') { trails = []; refresh(); return; }
    if (kind === 'post') {
      const post = E.fcPost(S);
      if (!post) { toast('There is no regulation post for this formation.'); return; }
      await stopPlay();
      pushHistory();
      fc.prog = []; fc.marching = false;
      await walkActor('fc', route(fc, post), post.h);
      addLog({ t: S.t, text: 'You: marched to your post', fc: true });
      scriptAfterFC();
      return;
    }
    pushHistory();
    const turn = { left: -90, right: 90, about: 180, halfLeft: -45, halfRight: 45 }[kind];
    if (turn != null) fc.h = E.nh(fc.h + turn);
    if (kind === 'face') fc.h = E.faceFlightHeading(S, fc);
    if (kind === 'salute') fc.posture = fc.posture === 'salute' ? 'att' : 'salute';
    const names = { left: 'Left face', right: 'Right face', about: 'About face', halfLeft: 'Half left face', halfRight: 'Half right face', face: 'Faced the flight', salute: fc.posture === 'salute' ? 'Salute' : 'Dropped salute' };
    addLog({ t: S.t, text: `You: ${names[kind]}`, fc: true });
    refresh();
    scriptAfterFC();
  }

  // pointer: drag the commander or inspector, tap a cadet, pan and pinch the pad
  const pointers = new Map();
  let pan = null;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const target = e.target.closest && e.target.closest('.pp');
    const id = target && target.getAttribute('data-id');
    if (pointers.size === 2) { drag = null; pan = { pinch: true, d0: pinchDist(), s0: cam.s, mid: pinchMid() }; return; }
    if (id && (id === 'fc' || id === 'insp')) {
      const p = S.ppl[id];
      drag = { id, start: { x: p.x, y: p.y }, startH: p.h, snap: snapshot(), moved: false, pid: e.pointerId, off: E.sub(p, toWorld(e.clientX, e.clientY)) };
      svg.setPointerCapture(e.pointerId);
      closePop();
      return;
    }
    if (id) { pan = { tap: id, x: e.clientX, y: e.clientY, cx: cam.cx, cy: cam.cy }; svg.setPointerCapture(e.pointerId); return; }
    pan = { x: e.clientX, y: e.clientY, cx: cam.cx, cy: cam.cy };
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('panning');
  });
  function pinchDist() { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  function pinchMid() { const [a, b] = [...pointers.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  svg.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pan && pan.pinch && pointers.size === 2) {
      const before = toWorld(pan.mid.x, pan.mid.y);
      cam.s = Math.max(0.3, Math.min(8, pan.s0 * (pinchDist() / pan.d0)));
      applyCam();
      const after = toWorld(pan.mid.x, pan.mid.y);
      cam.cx += before.x - after.x; cam.cy += before.y - after.y;
      applyCam();
      return;
    }
    if (drag && e.pointerId === drag.pid) {
      const w = E.add(toWorld(e.clientX, e.clientY), drag.off);
      const to = snapPt(w, e.altKey);
      if (!drag.moved && E.dist(to, drag.start) < 3) return;
      drag.moved = true;
      const p = S.ppl[drag.id];
      p.x = to.x; p.y = to.y;
      drag.preview = { who: drag.id, pts: route(drag.start, to) };
      drawPeople(1); drawTrails(drag.preview); drawLabels();
      return;
    }
    if (pan && !pan.pinch) {
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.hypot(dx, dy) < 6) return;
      pan.tap = null; pan.moved = true;
      cam.cx = pan.cx - dx / cam.s; cam.cy = pan.cy - dy / cam.s;
      applyCam();
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    svg.classList.remove('panning');
    if (drag && e.pointerId === drag.pid) {
      const d = drag; drag = null;
      if (d.moved) {
        const p = S.ppl[d.id];
        const to = { x: p.x, y: p.y };
        const pts = route(d.start, to);
        p.x = d.start.x; p.y = d.start.y;
        hist.push(d.snap); if (hist.length > 150) hist.shift(); fut = [];
        moveActor(d.id, to, pts, { faceTravel: set.faceTravel });
        addLog({ t: S.t, text: `${d.id === 'fc' ? 'You' : 'Inspector'}: moved ${paceText(pathLen(pts))}`, fc: true });
        refresh();
        if (d.id === 'fc') scriptAfterFC();
      } else if (d.id === 'fc' || d.id === 'insp') {
        sel = sel === d.id ? null : d.id; refresh();
      }
      return;
    }
    if (pan && pan.tap && pointers.size === 0) { openPop(pan.tap); }
    else if (pan && !pan.pinch && !pan.tap && !pan.moved && !$('pop').hidden) closePop();
    if (pointers.size < 2 && pan && pan.pinch) pan = null;
    if (pointers.size === 0) pan = null;
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const before = toWorld(e.clientX, e.clientY);
    cam.s = Math.max(0.3, Math.min(8, cam.s * Math.exp(-e.deltaY * 0.0015)));
    applyCam();
    const after = toWorld(e.clientX, e.clientY);
    cam.cx += before.x - after.x; cam.cy += before.y - after.y;
    applyCam();
  }, { passive: false });

  // cadet popover
  function closePop() { $('pop').hidden = true; sel = null; refreshPeopleOnly(); }
  function openPop(id) {
    const p = S.ppl[id];
    if (!p || p.role === 'fc' || p.role === 'insp') return;
    sel = id;
    const F = S.flight, pop = $('pop');
    const A = E.analyze(S);
    const elName = p.role === 'guide' ? 'Guidon bearer' : `${E.ORD[p.el]} element`;
    const idx = p.role === 'cadet' ? F.elements[p.el].indexOf(p.id) + 1 : 0;
    const role = p.role === 'guide' ? '' : idx === 1 ? ' · element leader' : '';
    const canAdj = p.role === 'cadet' && F.mode === 'halted' && A.lineish && !E.busy(S);
    const off = E.dot(p.off || { x: 0, y: 0 }, E.dir(F.h));
    const offTxt = Math.abs(off) > 0.5 ? (script && script.mode === 'quiz' ? '' : `<p>Out of line: ${Math.abs(off)} in ${off > 0 ? 'ahead' : 'behind'}.</p>`) : '';
    pop.innerHTML = `<h4>${elName}${idx ? `, position ${idx}` : ''}${role}</h4>
      <p>${p.num ? `Counted off: <b>${p.num}</b> · ` : ''}${Math.floor(p.height / 12)}'${p.height % 12}"</p>${offTxt}
      ${canAdj ? `<div class="row"><button class="fd-btn" data-adj="1">"${p.num ? 'Cadet ' + p.num : 'Cadet'}, move up"</button><button class="fd-btn" data-adj="-1">"…move back"</button></div>` : ''}
      <div class="row"><button class="fd-btn" data-close>Close</button></div>`;
    const sc = toScreen(p), r = $('stage').getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.width - 260, sc.x - r.left + 18)) + 'px';
    pop.style.top = Math.max(8, Math.min(r.height - 200, sc.y - r.top - 30)) + 'px';
    pop.hidden = false;
    refreshPeopleOnly();
  }
  $('pop').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-close')) { closePop(); return; }
    const adj = b.getAttribute('data-adj');
    if (adj && sel) {
      pushHistory();
      E.adjust(S, sel, +adj);
      const p = S.ppl[sel];
      const lb = { prep: `Cadet ${p.num || ''}`.trim(), exec: adj > 0 ? 'move up' : 'move back' };
      caption({ prep: '', exec: `${lb.prep}, ${lb.exec}` });
      addLog({ t: S.t, text: `${lb.prep}, ${lb.exec}` });
      refresh();
      openPop(sel);
      scriptAutoCheck();
    }
  });

  // ---------- panel: commands ----------
  const GROUP_ORDER = ['Forming & alignment', 'Positions & courtesies', 'Facings', 'Marching', 'Direction changes', 'Files', 'Inspection (ORI)', 'Reports'];
  const openGroups = store.get('fd.groups', { 'Forming & alignment': true, 'Facings': true, 'Marching': true, 'Direction changes': true });
  const paramVal = {};
  function cmdLabelHTML(c, arg) {
    const lb = K.label(c, S, arg);
    const foot = c.foot ? `<span class="foot" title="While marching, given as the ${c.foot === 'R' ? 'right' : 'left'} foot strikes">${c.foot}</span>` : '';
    return (lb.exec ? `${lb.prep ? esc(lb.prep) + ', ' : ''}<b>${esc(lb.exec)}</b>` : `<b>${esc(lb.prep)}</b>`) + foot;
  }
  function renderCommands() {
    const q = $('search').value.trim().toLowerCase();
    const list = $('cmdList');
    list.textContent = '';
    for (const g of GROUP_ORDER) {
      const cmds = K.CMDS.filter((c) => c.group === g && (!q || (K.label(c, S).text + ' ' + c.info).toLowerCase().includes(q)));
      if (!cmds.length) continue;
      const det = document.createElement('details');
      det.className = 'fd-group';
      det.open = q ? true : !!openGroups[g];
      det.innerHTML = `<summary>${esc(g)} <span class="n">${cmds.length}</span></summary>`;
      det.addEventListener('toggle', () => { if (!q) { openGroups[g] = det.open; store.set('fd.groups', openGroups); } });
      for (const c of cmds) {
        const row = document.createElement('div');
        row.className = 'fd-cmd';
        row.dataset.id = c.id;
        const pinned = hot.some((h) => h.id === c.id);
        const arg = paramVal[c.id] ?? (c.param && c.param.def);
        row.innerHTML = `<span class="fd-grip" title="Drag onto the hot bar">⠿</span>
          <button class="fd-call" data-give>${cmdLabelHTML(c, arg)}</button>
          ${c.param ? `<span class="fd-param"><button data-dec aria-label="Fewer">−</button><span>${arg}</span><button data-inc aria-label="More">+</button></span>` : ''}
          <button class="fd-mini ${pinned ? 'on' : ''}" data-pin title="${pinned ? 'Unpin from' : 'Pin to'} the hot bar">${pinned ? '★' : '☆'}</button>
          <button class="fd-mini" data-info title="What it does">ⓘ</button>`;
        det.appendChild(row);
      }
      list.appendChild(det);
    }
    refreshValidity();
  }
  $('cmdList').addEventListener('click', (e) => {
    const row = e.target.closest('.fd-cmd');
    if (!row) return;
    const id = row.dataset.id, c = K.byId[id];
    const arg = paramVal[id] ?? (c.param && c.param.def);
    if (e.target.closest('[data-give]')) giveCmd(id, arg);
    else if (e.target.closest('[data-pin]')) togglePin(id, arg);
    else if (e.target.closest('[data-info]')) showInfo(id, arg);
    else if (e.target.closest('[data-inc]') || e.target.closest('[data-dec]')) {
      const d = e.target.closest('[data-inc]') ? 1 : -1;
      paramVal[id] = Math.max(c.param.min, Math.min(c.param.max, arg + d));
      renderCommands();
    }
  });
  $('search').addEventListener('input', renderCommands);
  function refreshValidity() {
    const st = script && script.steps[script.idx];
    const expect = st && (st.kind === 'cmd') && script.mode === 'walk' ? st.cmd : null;
    for (const row of document.querySelectorAll('.fd-cmd')) {
      const id = row.dataset.id, c = K.byId[id];
      const why = K.check(S, id, paramVal[id] ?? (c.param && c.param.def));
      row.classList.toggle('no', !!why);
      row.classList.toggle('expect', expect === id);
      row.title = why || '';
    }
    for (const chip of document.querySelectorAll('.fd-chip')) {
      const h = hot[+chip.dataset.i];
      if (!h) continue;
      chip.classList.toggle('dim', !!K.check(S, h.id, h.arg));
      chip.classList.toggle('expect', expect === h.id);
    }
  }
  function showInfo(id, arg) {
    const c = K.byId[id], lb = K.label(c, S, arg), why = K.check(S, id, arg);
    $('infoBox').innerHTML = `<h3>${cmdLabelHTML(c, arg)}</h3>
      <p class="meta">${esc(c.group)}${c.foot ? ` · while marching, given as the <b>${c.foot === 'R' ? 'right' : 'left'}</b> foot strikes` : ''}</p>
      <p><b>When:</b> ${esc(c.when)}</p>
      <p>${esc(c.info)}</p>
      <p class="meta">Source: ${esc(c.ref)}${c.ref.includes('¶') ? ' (AFMAN 36-2203 paragraph numbers, carried into DAFPAM 34-1203)' : ''}</p>
      ${why ? `<p style="color:var(--bad)"><b>Can't give it right now:</b> ${esc(why)}</p>` : ''}
      <div class="fd-row"><button class="fd-btn primary" data-go ${why ? 'disabled' : ''}>Give it: ${esc(lb.text)}</button>
      <button class="fd-btn" data-pin>${hot.some((h) => h.id === id) ? 'Unpin' : 'Pin to hot bar'}</button>
      <button class="fd-btn" data-x>Close</button></div>`;
    $('info').hidden = false;
    $('infoBox').onclick = (e) => {
      if (e.target.closest('[data-go]')) { $('info').hidden = true; giveCmd(id, arg); }
      else if (e.target.closest('[data-pin]')) { togglePin(id, arg); showInfo(id, arg); }
      else if (e.target.closest('[data-x]')) $('info').hidden = true;
    };
  }
  $('info').addEventListener('click', (e) => { if (e.target === $('info')) $('info').hidden = true; });

  // ---------- hot bar ----------
  function togglePin(id, arg) {
    const i = hot.findIndex((h) => h.id === id);
    if (i >= 0) hot.splice(i, 1); else hot.push({ id, arg: K.byId[id].param ? arg : undefined });
    saveHot(); renderHot(); renderCommands();
  }
  function renderHot(caretAt) {
    const bar = $('hot');
    bar.textContent = '';
    if (!hot.length && caretAt == null) {
      const s = document.createElement('span'); s.className = 'fd-hot-hint'; s.textContent = 'Drag commands here from the panel (⠿) to keep your common ones handy';
      bar.appendChild(s);
    }
    hot.forEach((h, i) => {
      if (caretAt === i) { const c = document.createElement('span'); c.className = 'fd-caret'; bar.appendChild(c); }
      const c = K.byId[h.id];
      const chip = document.createElement('div');
      chip.className = 'fd-chip';
      chip.dataset.i = i;
      chip.innerHTML = `${i < 9 ? `<span class="k">${i + 1}</span>` : ''}<span>${cmdLabelHTML(c, h.arg)}</span><button class="x" title="Remove" aria-label="Remove">×</button>`;
      bar.appendChild(chip);
    });
    if (caretAt != null && caretAt >= hot.length) { const c = document.createElement('span'); c.className = 'fd-caret'; bar.appendChild(c); }
    refreshValidity();
  }
  let dnd = null;
  function startDnd(e, item, fromIndex) {
    dnd = { item, fromIndex, x: e.clientX, y: e.clientY, pid: e.pointerId, active: false, el: null };
    document.body.classList.add('fd-dragging');
    window.getSelection && window.getSelection().removeAllRanges();
  }
  document.addEventListener('selectstart', (e) => { if (dnd) e.preventDefault(); });
  document.addEventListener('pointercancel', (e) => {
    if (!dnd || e.pointerId !== dnd.pid) return;
    if (dnd.el) dnd.el.remove();
    dnd = null;
    document.body.classList.remove('fd-dragging');
    $('hot').classList.remove('drop');
    renderHot();
  });
  function hotIndexAt(x) {
    const chips = [...$('hot').querySelectorAll('.fd-chip')];
    for (let i = 0; i < chips.length; i++) { const r = chips[i].getBoundingClientRect(); if (x < r.left + r.width / 2) return +chips[i].dataset.i; }
    return hot.length;
  }
  function overHot(x, y) { const r = $('hot').getBoundingClientRect(); return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 14 && y <= r.bottom + 14; }
  document.addEventListener('pointermove', (e) => {
    if (!dnd || e.pointerId !== dnd.pid) return;
    if (!dnd.active && Math.hypot(e.clientX - dnd.x, e.clientY - dnd.y) < 6) return;
    if (!dnd.active) {
      dnd.active = true;
      dnd.el = document.createElement('div');
      dnd.el.className = 'fd-chip fd-drag-ghost';
      dnd.el.innerHTML = cmdLabelHTML(K.byId[dnd.item.id], dnd.item.arg);
      document.body.appendChild(dnd.el);
    }
    dnd.el.style.left = e.clientX + 'px'; dnd.el.style.top = e.clientY + 'px';
    const over = overHot(e.clientX, e.clientY);
    $('hot').classList.toggle('drop', over);
    if (over) {
      let at = hotIndexAt(e.clientX);
      if (dnd.fromIndex != null && at > dnd.fromIndex) at--;
      if (dnd.lastAt !== at) { dnd.lastAt = at; renderHotPreview(at); }
    } else if (dnd.lastAt != null) { dnd.lastAt = null; renderHot(); }
  });
  function renderHotPreview(at) {
    const saved = hot;
    if (dnd.fromIndex != null) hot = hot.filter((_, i) => i !== dnd.fromIndex);
    renderHot(at);
    hot = saved;
  }
  document.addEventListener('pointerup', (e) => {
    if (!dnd || e.pointerId !== dnd.pid) return;
    const d = dnd; dnd = null;
    document.body.classList.remove('fd-dragging');
    $('hot').classList.remove('drop');
    if (d.el) d.el.remove();
    if (!d.active) {
      if (d.fromIndex != null && !e.target.closest('.x')) giveCmd(d.item.id, d.item.arg);
      return;
    }
    const over = overHot(e.clientX, e.clientY);
    if (d.fromIndex != null) hot.splice(d.fromIndex, 1);
    if (over) {
      let at = hotIndexAt(e.clientX);
      if (d.fromIndex != null && at > d.fromIndex) at--;
      const dup = hot.findIndex((h) => h.id === d.item.id && h.arg === d.item.arg);
      if (dup >= 0) { hot.splice(dup, 1); if (dup < at) at--; }
      hot.splice(Math.max(0, Math.min(hot.length, at)), 0, d.item);
    } else if (d.fromIndex != null) toast('Removed from the hot bar');
    saveHot(); renderHot(); renderCommands();
  });
  $('cmdList').addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.fd-grip');
    if (!grip) return;
    e.preventDefault();
    const id = grip.closest('.fd-cmd').dataset.id, c = K.byId[id];
    startDnd(e, { id, arg: c.param ? (paramVal[id] ?? c.param.def) : undefined }, null);
  });
  $('hot').addEventListener('pointerdown', (e) => {
    const chip = e.target.closest('.fd-chip');
    if (!chip) return;
    if (e.target.closest('.x')) { const i = +chip.dataset.i; hot.splice(i, 1); saveHot(); renderHot(); renderCommands(); return; }
    e.preventDefault();
    startDnd(e, hot[+chip.dataset.i], +chip.dataset.i);
  });

  // ---------- log ----------
  function addLog(entry) {
    log.unshift(entry);
    if (log.length > 400) log.length = 400;
    renderLog();
  }
  function renderLog() {
    const ul = $('log');
    ul.innerHTML = log.slice(0, 200).map((l, i) => l.sep
      ? `<li class="sep">${esc(l.sep)}</li>`
      : `<li class="${l.bad ? 'bad' : ''}"><span class="t">${l.t}</span><span class="c">${esc(l.text)}${l.bad ? `<small>Not given: ${esc(l.bad)}</small>` : ''}${l.note ? `<small>${esc(l.note)}</small>` : ''}</span>${l.snap && i < 120 ? `<button class="fd-mini" data-back="${i}" title="Go back to just before this">↺</button>` : ''}</li>`).join('');
  }
  $('log').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-back]');
    if (!b) return;
    const entry = log[+b.dataset.back];
    if (!entry || !entry.snap) return;
    await stopPlay();
    hist.push(snapshot());
    const keep = log.slice(+b.dataset.back + 1);
    restore(entry.snap);
    log = keep;
    renderLog();
    toast('Back to just before: ' + entry.text);
  });
  $('logClear').addEventListener('click', () => { log = []; renderLog(); });

  // ---------- practice scripts ----------
  function renderPractice() {
    const el = $('practice');
    const cards = SC.SCRIPTS.map((d) => `<div class="fd-card ${script && script.id === d.id ? 'on' : ''}"><h4>${esc(d.title)}</h4><p>${esc(d.source)}</p>
      <div class="fd-row" style="margin:8px 0 0"><button class="fd-btn ${script && script.id === d.id ? '' : 'primary'}" data-start="${d.id}">${script && script.id === d.id ? 'Restart' : 'Start'}</button></div></div>`).join('');
    let body = `<p class="fd-p">Run a whole procedure step by step. Each step tells you what to do and where it comes from; your moves and commands are checked as you go.</p>
      <div class="fd-row"><span class="fd-seg"><button data-mode="walk" class="${set.scriptMode === 'walk' ? 'on' : ''}">Walkthrough</button><button data-mode="quiz" class="${set.scriptMode === 'quiz' ? 'on' : ''}">Quiz</button></span></div>
      <p class="fd-p muted">${set.scriptMode === 'walk' ? 'Walkthrough shows the next command and a ghost where you should stand; it moves on as soon as you get each step right.' : 'Quiz hides the answers. Pick each command yourself and press “I\'m in position” (Enter) when you think you are standing in the right place. You are scored at the end.'}</p>
      <label class="fd-field">Move with the inspector automatically<input type="checkbox" data-opt="autoShadow" ${set.autoShadow ? 'checked' : ''}></label>
      ${cards}`;
    if (script) {
      const sc = script.score;
      body += `<div class="fd-row"><button class="fd-btn" data-stop>Stop the script</button></div>
        ${script.mode === 'quiz' ? `<div class="fd-score"><div><b>${sc.cmdOk}/${sc.cmdTotal}</b><span>commands right first time</span></div><div><b>${sc.posOk}/${sc.posTotal}</b><span>positions within a pace</span></div><div><b>${sc.posTotal ? (sc.errSum / sc.posTotal / C.PACE).toFixed(1) : '–'}</b><span>avg error (paces)</span></div></div>` : ''}
        <h4 class="fd-h">Steps</h4><ol class="fd-steps">${script.steps.map((s, i) => `<li class="${i < script.idx ? 'done' : i === script.idx ? 'cur' : ''}">${esc(stepTitle(s))}</li>`).join('')}</ol>`;
    }
    el.innerHTML = body;
  }
  function stepTitle(s) {
    if (s.kind === 'cmd') return script && script.mode === 'quiz' && !script.revealAll ? `${s.sec}: (a command)` : `${s.sec}: ${K.label(K.byId[s.cmd], S).text}`;
    if (s.kind === 'fc') return `${s.sec}: move yourself`;
    if (s.kind === 'align') return `${s.sec}: align the ${E.ORD[s.el].toLowerCase()} element`;
    return `${s.sec}: ${s.text.replace(/\.$/, '')}`;
  }
  $('practice').addEventListener('click', (e) => {
    const t = e.target;
    if (t.dataset.start) startScript(t.dataset.start);
    else if (t.dataset.mode) { set.scriptMode = t.dataset.mode; saveSettings(); if (script) script.mode = set.scriptMode; renderPractice(); renderScriptCard(); refresh(); }
    else if (t.hasAttribute('data-stop')) { script = null; addLog({ sep: 'Practice stopped' }); refresh(); }
  });
  $('practice').addEventListener('change', (e) => {
    const o = e.target.dataset.opt;
    if (o) { set[o] = e.target.checked; saveSettings(); }
  });

  function scatter() {
    for (const p of E.members(S)) {
      const a = E.rand(S) * 360, d = 30 + E.rand(S) * 90;
      p.x += Math.sin(a) * d; p.y += Math.cos(a) * d + 80;
      p.h = E.nh(E.rand(S) * 360);
      p.posture = 'fallout';
    }
    S.flight.posture = 'fallout';
    S.flight.grid = null;
  }
  async function startScript(id) {
    await stopPlay();
    const def = SC.SCRIPTS.find((d) => d.id === id);
    pushHistory();
    set.fcFollow = def.fcFollow; saveSettings();
    syncOpts();
    const fc = S.ppl.fc;
    fc.x = 0; fc.y = 0; fc.h = 180; fc.posture = 'att'; fc.marching = false; fc.prog = [];
    E.buildFlight(S, { elements: set.elements, cadets: set.cadets, guidon: set.guidon, deputy: set.deputy });
    if (def.setup === 'scatter') scatter();
    trails = []; marchTrail = [];
    script = { id, def, steps: def.build(S), idx: 0, mode: set.scriptMode, score: { cmdOk: 0, cmdTotal: 0, posOk: 0, posTotal: 0, errSum: 0 }, misses: 0, reveal: false, result: null, checked: false };
    addLog({ sep: `${def.title} (${script.mode === 'quiz' ? 'quiz' : 'walkthrough'})` });
    if (def.fcFollow) toast('Your commander now keeps its place on the flight as it marches, as the 30-step requires. Change it in Setup.');
    pruneGlyphs();
    refresh();
    fit();
    await enterStep();
  }
  function currentStep() { return script && script.steps[script.idx]; }
  async function advance() {
    if (!script) return;
    script.idx++;
    script.misses = 0; script.reveal = false; script.result = null; script.checked = false;
    refresh();
    await enterStep();
  }
  async function enterStep() {
    const st = currentStep();
    if (!st) { finishScript(); return; }
    if (st.kind === 'insp') {
      renderScriptCard();
      await sleep(SPEED[set.speed] ? 500 : 50);
      for (let k = 0; k < (st.times || 1); k++) {
        const res = K.give(S, st.cmd);
        if (!res.ok) { toast(res.reason || 'The inspector could not do that.', 'bad'); break; }
        if (set.autoShadow && (st.cmd === 'inspBegin')) {
          await runCounts(0, true);
          const fc = S.ppl.fc, t = SC.shadowSpot(S);
          if (script.mode === 'walk' && E.dist(fc, t) > 2) { /* the next fc step asks for the diagonal three step */ }
        }
        if (set.autoShadow && (st.cmd === 'inspNext' || st.cmd === 'inspNextElement')) {
          const fc = S.ppl.fc, t = SC.shadowSpot(S);
          if (E.dist(fc, t) < 40 && !fc.prog.length) fc.prog = [{ t: 'seek', tgt: { k: 'shadow' }, sp: 30, face: 'keep' }];
        }
        await runCounts(0, true);
        if (st.times > 1) await sleep(SPEED[set.speed] ? 260 : 20);
      }
      await advance();
      return;
    }
    if (st.kind === 'align' && !E.misaligned(S, st.el).length) {
      script.result = { ok: true, text: `The ${E.ORD[st.el].toLowerCase()} element is already in line.` };
      renderScriptCard();
      await sleep(SPEED[set.speed] ? 900 : 50);
      await advance();
      return;
    }
    renderScriptCard();
    if (st.kind === 'fc' && script.mode === 'walk') follow([st.target(S)]);
    scriptAutoCheck();
  }
  function finishScript() {
    script.done = true;
    script.revealAll = true;
    renderScriptCard();
    renderPractice();
    addLog({ sep: 'Practice complete' });
  }
  function scriptBlocks(id, arg, lb) {
    if (!script || script.done) return false;
    const st = currentStep();
    if (!st) return false;
    if (st.kind === 'cmd') {
      if (st.cmd === id) return false;
      if (script.mode === 'quiz') {
        if (!script.checked) { script.score.cmdTotal++; script.checked = true; }
        script.misses++;
        script.result = { ok: false, text: `Not "${lb.text}".${script.misses >= 2 ? ` The procedure calls for: ${K.label(K.byId[st.cmd], S).text}` : ' Try again.'}` };
        if (script.misses >= 2) script.reveal = true;
        addLog({ t: S.t, text: lb.text, bad: 'not the next step of the procedure' });
        renderScriptCard();
        renderPractice();
      } else toast(`The procedure calls for ${K.label(K.byId[st.cmd], S).text} next. (Stop the script to drill freely.)`, 'bad');
      return true;
    }
    if (st.kind === 'fc') toast('This step is a move: put yourself on the ghost (or press Show me).', 'bad');
    else if (st.kind === 'align') toast('Finish aligning this element first: click the cadets out of line.', 'bad');
    else toast('The inspector is moving; one moment.');
    return true;
  }
  function scriptAfterCommand(id) {
    if (!script || script.done) return;
    const st = currentStep();
    if (!st || st.kind !== 'cmd' || st.cmd !== id) return;
    if (script.mode === 'quiz' && !script.checked) { script.score.cmdTotal++; script.score.cmdOk++; script.checked = true; }
    script.result = { ok: true, text: 'Correct.' };
    script.pendingAdvance = true;
  }
  async function scriptAfterRun() {
    if (!script || !script.pendingAdvance) return;
    // By the numbers, the movement is still to come: move on once the flight has finished it.
    if (E.busy(S)) { script.waitIdle = true; script.pendingAdvance = false; return; }
    script.pendingAdvance = false;
    await advance();
  }
  function scriptAfterFC() {
    if (!script || script.done) return;
    const st = currentStep();
    if (!st || st.kind !== 'fc' || script.mode !== 'walk') { renderScriptCard(); return; }
    const r = SC.fcCheck(st, S);
    if (r.ok) {
      script.result = { ok: true, text: 'In position.' };
      renderScriptCard();
      setTimeout(() => { if (currentStep() === st) advance(); }, SPEED[set.speed] ? 500 : 10);
    } else renderScriptCard();
  }
  function quizCheckFC() {
    const st = currentStep();
    if (!st || st.kind !== 'fc') return;
    const r = SC.fcCheck(st, S);
    if (!script.checked) {
      script.checked = true;
      script.score.posTotal++;
      script.score.errSum += r.d;
      if (r.ok) script.score.posOk++;
    }
    if (r.ok) { script.result = { ok: true, text: `Right: ${paceText(r.d)} from the spot, facing correctly.` }; renderScriptCard(); setTimeout(() => advance(), 700); }
    else {
      const face = r.dh >= 1 ? ` You are facing ${compass(S.ppl.fc.h)}; you should face ${compass(r.t.h)}.` : '';
      script.result = { ok: false, text: `${paceText(r.d)} from the regulation spot.${face} The ghost shows it now.` };
      script.reveal = true;
      renderScriptCard(); drawGhost();
      follow([r.t]);
    }
    renderPractice();
  }
  function compass(h) {
    const names = ['north (up)', 'north-east', 'east (right)', 'south-east', 'south (down)', 'south-west', 'west (left)', 'north-west'];
    return names[Math.round(E.nh(h) / 45) % 8];
  }
  function scriptAutoCheck() {
    if (!script || script.done) return;
    if (script.waitIdle && !E.busy(S)) { script.waitIdle = false; setTimeout(() => advance(), 10); return; }
    const st = currentStep();
    if (st && st.kind === 'align' && SC.alignDone(st, S) && !script.advancing) {
      script.advancing = true;
      script.result = { ok: true, text: 'Element aligned.' };
      renderScriptCard();
      setTimeout(() => { script.advancing = false; if (currentStep() === st) advance(); }, SPEED[set.speed] ? 600 : 10);
    }
  }
  async function showMe() {
    const st = currentStep();
    if (!st) return;
    if (st.kind === 'fc') {
      await stopPlay();
      if (script.mode === 'quiz' && !script.checked) { script.checked = true; script.score.posTotal++; script.score.errSum += SC.fcCheck(st, S).d; }
      pushHistory();
      const t = st.target(S), fc = S.ppl.fc;
      fc.prog = []; fc.marching = false;
      // A scripted route ("next to the guidon, six paces forward, re-center") is walked leg by leg, each leg routed around the ranks.
      const way = st.route ? [{ x: fc.x, y: fc.y }, ...st.route(S)] : [{ x: fc.x, y: fc.y }, t];
      const pts = [way[0]];
      for (let i = 1; i < way.length; i++) pts.push(...route(way[i - 1], way[i]).slice(1));
      await walkActor('fc', pts, t.h);
      addLog({ t: S.t, text: 'You (shown): ' + st.text.split('.')[0] });
      script.result = { ok: true, text: 'Shown.' };
      renderScriptCard();
      setTimeout(() => { if (currentStep() === st) advance(); }, 500);
      return;
    }
    if (st.kind === 'align') {
      pushHistory();
      const f = E.dir(S.flight.h);
      for (const p of E.misaligned(S, st.el)) {
        const sign = E.dot(p.off, f) > 0 ? -1 : 1;
        caption({ prep: '', exec: `Cadet ${p.num || S.flight.elements[st.el].indexOf(p.id) + 1}, move ${sign > 0 ? 'up' : 'back'}` });
        while (E.len(p.off) > 0.5) { E.adjust(S, p.id, sign); drawAll(); await sleep(SPEED[set.speed] ? 160 : 5); }
        await sleep(SPEED[set.speed] ? 350 : 5);
      }
      refresh();
      scriptAutoCheck();
      return;
    }
    if (st.kind === 'cmd') { script.reveal = true; script.misses = 2; renderScriptCard(); }
  }
  function renderScriptCard() {
    const card = $('scriptCard');
    if (!script) { card.hidden = true; return; }
    card.hidden = false;
    const n = script.steps.length;
    if (script.done) {
      const sc = script.score;
      card.innerHTML = `<div class="sec"><span>${esc(script.def.title)}</span><span>done</span></div>
        <p class="txt"><b>Procedure complete.</b> ${script.mode === 'quiz' ? `Commands right first time: <b>${sc.cmdOk}/${sc.cmdTotal}</b>. Positions within a pace: <b>${sc.posOk}/${sc.posTotal}</b>${sc.posTotal ? ` (average ${(sc.errSum / sc.posTotal / C.PACE).toFixed(1)} paces off)` : ''}.` : 'Run it again in Quiz mode to test yourself.'}</p>
        <div class="acts"><button class="fd-btn primary" data-again>Run again</button><button class="fd-btn" data-close>Close</button></div>`;
      return;
    }
    const st = currentStep();
    if (!st) return;
    const quiz = script.mode === 'quiz';
    let expect = '';
    if (st.kind === 'cmd') {
      const lb = K.label(K.byId[st.cmd], S);
      expect = !quiz || script.reveal
        ? `<div class="expect">Give: <button class="fd-btn primary" data-give="${st.cmd}">${esc(lb.text)}</button></div>`
        : '<div class="expect">Choose the command from the panel or the hot bar.</div>';
    } else if (st.kind === 'fc') {
      expect = `<div class="acts">${quiz ? '<button class="fd-btn primary" data-check>I\'m in position <kbd>Enter</kbd></button>' : ''}<button class="fd-btn" data-show>Show me</button></div>`;
    } else if (st.kind === 'align') {
      const left = E.misaligned(S, st.el).length;
      expect = `<div class="acts"><span>${left} cadet${left === 1 ? '' : 's'} out of line${quiz ? '' : ' (red dots)'}</span><button class="fd-btn" data-show>Show me</button></div>`;
    }
    const showText = !quiz || st.kind !== 'cmd' || script.reveal;
    card.innerHTML = `<div class="sec"><span>${esc(st.sec)}</span><span>${script.idx + 1} / ${n}</span></div>
      <div class="bar"><i style="width:${(script.idx / n) * 100}%"></i></div>
      <p class="txt">${showText ? esc(st.text) : 'What is the next command?'}</p>
      ${st.quote && (!quiz || script.reveal || st.kind !== 'cmd') ? `<p class="quote">“${esc(st.quote.replace(/^["“]|["”]$/g, ''))}”</p>` : ''}
      ${st.note ? `<p class="note">${esc(st.note)}</p>` : ''}
      ${expect}
      ${script.result ? `<p class="res ${script.result.ok ? 'ok' : 'no'}">${script.result.ok ? '✓' : '✗'} ${esc(script.result.text)}</p>` : ''}
      <div class="acts"><button class="fd-btn" data-skip title="Do this step for me and move on">Skip step</button><button class="fd-btn" data-close>Stop</button></div>`;
  }
  $('scriptCard').addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.give) giveCmd(t.dataset.give);
    else if (t.hasAttribute('data-check')) quizCheckFC();
    else if (t.hasAttribute('data-show')) showMe();
    else if (t.hasAttribute('data-skip')) skipStep();
    else if (t.hasAttribute('data-again')) startScript(script.id);
    else if (t.hasAttribute('data-close')) { script = null; refresh(); }
  });
  async function skipStep() {
    const st = currentStep();
    if (!st) return;
    if (st.kind === 'cmd') {
      if (script.mode === 'quiz' && !script.checked) { script.checked = true; script.score.cmdTotal++; }
      const saveMode = script.mode;
      script.mode = 'walk';
      await giveCmd(st.cmd);
      if (script) script.mode = saveMode;
      return;
    }
    if (st.kind === 'fc' || st.kind === 'align') { await showMe(); return; }
    await advance();
  }

  // ---------- setup ----------
  function renderSetup() {
    const f = (label, key, type, extra, hint) => {
      const v = set[key];
      let input = '';
      if (type === 'check') input = `<input type="checkbox" data-set="${key}" ${v ? 'checked' : ''}>`;
      else if (type === 'num') input = `<input type="number" data-set="${key}" value="${v}" ${extra}>`;
      else if (type === 'text') input = `<input type="text" data-set="${key}" value="${esc(v)}">`;
      else if (type === 'select') input = `<select data-set="${key}">${extra.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
      return `<label class="fd-field"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span>${input}</label>`;
    };
    const E1 = set.elements;
    $('setup').innerHTML = `
      <h4 class="fd-h">The flight</h4>
      <div class="fd-field"><span>Elements (rows in line, files in column)<small>A flight has 2-4 by regulation.</small></span>
        <span class="fd-seg">${[1, 2, 3, 4, 5, 6].map((n) => `<button data-el="${n}" class="${n === E1 ? 'on' : ''}">${n}</button>`).join('')}</span></div>
      ${f('Cadets in ranks', 'cadets', 'num', 'min="1" max="60"', 'Not counting you or the guidon bearer. Extras fill the rear elements first.')}
      ${f('Guidon bearer', 'guidon', 'check')}
      ${f('Show a deputy (FLT/CD) in the last position', 'deputy', 'check', null, 'Stands fast during sizing.')}
      ${f('Flight name (for reports)', 'name', 'text')}
      <div class="fd-row" style="margin-top:8px"><button class="fd-btn primary" id="rebuild">Form a new flight</button><button class="fd-btn" id="reheight">New heights</button></div>
      <h4 class="fd-h">You, the flight commander</h4>
      ${f('Distance of your post', 'postPaces', 'select', [[2, '2 paces'], [3, '3 paces (regulation)'], [4, '4 paces'], [6, '6 paces']])}
      ${f('March with the flight', 'fcFollow', 'check', null, 'Keep your place on the flight while it marches, turns and halts.')}
      ${f('Route drags around the flight', 'routeAround', 'check', null, 'The dotted path takes the shortest way that does not walk through the ranks.')}
      ${f('Snap drags to half-pace spots', 'snap', 'check', null, 'Lined up with the flight. Hold Alt to place freely.')}
      ${f('Face the way you moved', 'faceTravel', 'check', null, 'Off: a drag keeps your facing, and you face with the buttons, like the real movements.')}
      <h4 class="fd-h">The flight's behavior</h4>
      ${f('Leave a few cadets out of line after a dress', 'misalign', 'check', null, 'So "Cadet ___, move up / move back" has something to fix.')}
      ${f('Counts to keep marching after a command', 'marchCounts', 'select', [[0, '0'], [2, '2'], [4, '4'], [8, '8']])}
      <h4 class="fd-h">Display</h4>
      ${f('Grid (1 pace squares)', 'showGrid', 'check')}
      ${f('Count-off numbers', 'showNumbers', 'check')}
      ${f('Heights', 'showHeights', 'check')}
      ${f('Your dotted paths', 'showTrails', 'check')}
      ${f('Line of march', 'showMarchTrail', 'check')}
      ${f('Color each element', 'colors', 'check')}
      ${f('Speak commands aloud', 'voice', 'check')}
      ${f('Theme', 'theme', 'select', [['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark']])}
      <h4 class="fd-h">Reset</h4>
      <div class="fd-row"><button class="fd-btn" id="resetHot">Reset the hot bar</button><button class="fd-btn" id="resetAll">Reset all settings</button></div>
      <h4 class="fd-h">Keys</h4>
      <p class="fd-p muted"><kbd>Space</kbd> next count · <kbd>Shift</kbd>+<kbd>Space</kbd> four · <kbd>1</kbd>–<kbd>9</kbd> hot bar · <kbd>Q</kbd>/<kbd>E</kbd>/<kbd>R</kbd> your left/right/about face · <kbd>F</kbd> face the flight · <kbd>P</kbd> post · <kbd>S</kbd> salute · arrows step yourself (½ pace, Shift 1 pace) · <kbd>0</kbd> fit · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>/</kbd> find a command.</p>
      <h4 class="fd-h">Sources</h4>
      <p class="fd-p muted">Movements: DAFPAM 34-1203 (13 Sep 2022), which carried forward AFMAN 36-2203 (2013); the ¶ numbers shown are AFMAN's. Open Ranks Inspection: Det 855 ORI Procedures, 10 Jul 2025. 30-step: AFJROTC Drill Pamphlet and 30-Step, Aug 2022. Distances: 24-inch pace, 40-inch distance, 64 inches between opened ranks, arm's length ≈ 40 inches center to center, close interval 4 inches between shoulders.</p>`;
  }
  $('setup').addEventListener('change', (e) => {
    const k = e.target.dataset.set;
    if (!k) return;
    const t = e.target;
    let v = t.type === 'checkbox' ? t.checked : t.type === 'number' ? Math.max(+t.min || 0, Math.min(+t.max || 99, Math.round(+t.value || 0))) : t.value;
    if (['postPaces', 'marchCounts'].includes(k)) v = +v;
    set[k] = v;
    saveSettings();
    if (k === 'theme') applyTheme();
    if (['fcFollow', 'misalign', 'postPaces', 'name'].includes(k)) syncOpts();
    if (['cadets', 'guidon', 'deputy'].includes(k)) toast('Press "Form a new flight" to apply.');
    applyCam();
    refresh();
  });
  $('setup').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.el) { set.elements = +t.dataset.el; saveSettings(); renderSetup(); toast(set.elements > 4 || set.elements < 2 ? 'Outside the regulation 2-4 elements, but the sim will run it. Press "Form a new flight".' : 'Press "Form a new flight" to apply.'); }
    else if (t.id === 'rebuild') rebuild();
    else if (t.id === 'reheight') { pushHistory(); for (const p of E.cadets(S)) p.height = Math.round(62 + E.rand(S) * 14); refresh(); toast('New heights. Size the flight to sort them.'); }
    else if (t.id === 'resetHot') { hot = DEFAULT_HOT.slice(); saveHot(); renderHot(); renderCommands(); }
    else if (t.id === 'resetAll') { Object.assign(set, DEF); saveSettings(); applyTheme(); renderSetup(); syncOpts(); refresh(); toast('Settings reset.'); }
  });
  async function rebuild() {
    await stopPlay();
    pushHistory();
    script = null;
    syncOpts();
    E.buildFlight(S, { elements: set.elements, cadets: set.cadets, guidon: set.guidon, deputy: set.deputy });
    trails = []; marchTrail = [];
    pruneGlyphs();
    addLog({ sep: `New flight: ${set.elements} element${set.elements > 1 ? 's' : ''}, ${set.cadets} cadets${set.guidon ? ' + guidon' : ''}` });
    refresh(); fit();
  }
  function applyTheme() {
    if (set.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', set.theme);
  }

  // ---------- chrome wiring ----------
  function refreshPeopleOnly() { drawAll(1); }
  function refresh() {
    drawAll(1);
    drawStatus();
    renderHot();
    refreshValidity();
    renderLog();
    renderPractice();
    renderScriptCard();
    if (!drag) follow();
  }
  $('play').addEventListener('click', play);
  $('step1').addEventListener('click', () => stepKey(1));
  $('step4').addEventListener('click', () => stepKey(4));
  $('speed').value = set.speed;
  $('speed').addEventListener('change', (e) => { set.speed = e.target.value; saveSettings(); });
  $('byNumbers').addEventListener('click', () => { set.byNumbers = !set.byNumbers; saveSettings(); drawStatus(); toast(set.byNumbers ? 'By the numbers: every count now waits for Space.' : 'Counts run on their own again.'); });
  $('zin').addEventListener('click', () => { cam.s = Math.min(8, cam.s * 1.25); applyCam(); });
  $('zout').addEventListener('click', () => { cam.s = Math.max(0.3, cam.s / 1.25); applyCam(); });
  $('zfit').addEventListener('click', fit);
  $('zfollow').addEventListener('click', () => { set.follow = !set.follow; saveSettings(); drawStatus(); if (set.follow) follow(); });
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  $('fcbar').addEventListener('click', (e) => { const b = e.target.closest('[data-fc]'); if (b) fcAction(b.dataset.fc); });
  const app = $('app');
  const narrow = matchMedia('(max-width: 860px)').matches;
  if (store.get('fd.panel', narrow ? 'closed' : 'open') === 'closed') app.classList.add('panel-closed');
  $('panelBtn').addEventListener('click', () => {
    app.classList.toggle('panel-closed');
    store.set('fd.panel', app.classList.contains('panel-closed') ? 'closed' : 'open');
    setTimeout(() => { applyCam(); drawAll(); follow(); }, 30);
  });
  document.querySelectorAll('.fd-tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.fd-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('.fd-tabpane').forEach((p) => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
    if (b.dataset.tab === 'setup') renderSetup();
  }));
  if (location.protocol === 'file:') $('hub').style.display = 'none';

  document.addEventListener('keydown', async (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { if (e.key === 'Escape') document.activeElement.blur(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { $('info').hidden = true; closePop(); return; }
    if (e.key === ' ') { e.preventDefault(); stepKey(e.shiftKey ? 4 : 1); return; }
    if (e.key === '/') { e.preventDefault(); if (app.classList.contains('panel-closed')) $('panelBtn').click(); document.querySelector('.fd-tabs [data-tab="commands"]').click(); $('search').focus(); return; }
    if (e.key === 'Enter') { const st = currentStep(); if (st && st.kind === 'fc' && script.mode === 'quiz') { e.preventDefault(); quizCheckFC(); } return; }
    if (/^[1-9]$/.test(e.key)) { const h = hot[+e.key - 1]; if (h) giveCmd(h.id, h.arg); return; }
    const k = e.key.toLowerCase();
    if (k === 'q') fcAction(e.shiftKey ? 'halfLeft' : 'left');
    else if (k === 'e') fcAction(e.shiftKey ? 'halfRight' : 'right');
    else if (k === 'r') fcAction('about');
    else if (k === 'f') fcAction('face');
    else if (k === 'p') fcAction('post');
    else if (k === 's') fcAction('salute');
    else if (k === '0') fit();
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? C.PACE : C.HALF;
      const v = { ArrowUp: { x: 0, y: -d }, ArrowDown: { x: 0, y: d }, ArrowLeft: { x: -d, y: 0 }, ArrowRight: { x: d, y: 0 } }[e.key];
      const fc = S.ppl.fc;
      const last = trails[trails.length - 1];
      const now = performance.now();
      if (!(last && last.nudge && now - last.at < 1500)) pushHistory();
      const from = { x: fc.x, y: fc.y };
      fc.x += v.x; fc.y += v.y;
      if (last && last.nudge && now - last.at < 1500 && E.dist(last.pts[last.pts.length - 1], from) < 0.5) { last.pts.push({ x: fc.x, y: fc.y }); last.at = now; }
      else { trails.push({ who: 'fc', pts: [from, { x: fc.x, y: fc.y }], nudge: true, at: now }); }
      refresh();
      scriptAfterFC();
    }
  });

  // ---------- start ----------
  applyTheme();
  renderCommands();
  renderSetup();
  applyCam();
  refresh();
  fit();
  requestAnimationFrame(() => { fit(); refresh(); });

  // A handle for the browser tests (Playwright) and for poking at it from the console.
  window.DrillSim = {
    get S() { return S; }, get script() { return script; }, settings: set, hot: () => hot,
    give: giveCmd, step: stepOnce, fc: fcAction, start: startScript, showMe, quizCheckFC, fit, route,
    moveFC: (x, y) => { pushHistory(); moveActor('fc', snapPt({ x, y }), null, {}); refresh(); scriptAfterFC(); },
  };
})();
