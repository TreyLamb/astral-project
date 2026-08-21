// The thing that tells you something broke, even when React is gone.
//
// WHY THIS IS NOT A REACT COMPONENT
// ---------------------------------
// When a component throws during render, React unmounts the entire tree from
// the root down. #root goes empty and you are left looking at body's gradient
// — the blank blue screen. A React toast cannot report that, because React is
// the thing that died.
//
// But React dying is not the PAGE dying. The JS runtime is untouched: window,
// document, listeners and timers all still work. So this file is plain DOM,
// with no imports that could themselves be broken, no external stylesheet (a
// CSS file that failed to load would take the warning with it), and it is
// installed before React ever renders.
//
// Everything visible here is built with createElement and inline styles for
// exactly that reason. It is the one place in this repo where that is correct.

import { CRASH, BACKGROUND, recordError, readErrors, formatReport, describeError } from './errorLog';
import { isChunkLoadError, tryChunkReload } from './chunkReload';

const ALERT_KEY = 'astral_error_alert';
const HOST_ID = 'astral-error-notifier';

// Past this many the banner stops counting and says so. A component throwing
// on every render can produce thousands; the warning must not become the
// performance problem.
const MAX_TRACKED = 25;
// Identical error inside this window is one event. Also absorbs StrictMode's
// deliberate double-render in dev, which would otherwise show every dev error
// twice.
const DEDUPE_MS = 500;
// An alert() cannot be dismissed by anything but a click, so a loop would trap
// you. Hard cap even in aggressive mode.
const MAX_ALERTS = 3;

const state = {
  installed: false,
  count: 0,
  alerts: 0,
  latest: null,
  lastKey: '',
  lastAt: 0,
  dismissed: false,
  host: null,
  els: {},
};

const buildId = typeof __BUILD_ID__ === 'undefined' ? 'dev' : __BUILD_ID__;

function route() {
  try { return window.location.pathname + window.location.hash; } catch { return ''; }
}

function meta() {
  return {
    now: Date.now(),
    route: route(),
    buildId,
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  };
}

const COLOURS = {
  [CRASH]: { edge: '#e2586a', tint: 'rgba(226,88,106,0.14)', label: 'Crash' },
  [BACKGROUND]: { edge: '#e8b24a', tint: 'rgba(232,178,74,0.14)', label: 'Background error' },
};

function el(tag, style, text) {
  const node = document.createElement(tag);
  if (style) Object.assign(node.style, style);
  if (text != null) node.textContent = text;
  return node;
}

function button(label, onClick) {
  const b = el('button', {
    font: 'inherit',
    fontSize: '11px',
    letterSpacing: '0.04em',
    color: '#dde5ef',
    background: '#1c2836',
    border: '1px solid #33475f',
    borderRadius: '5px',
    padding: '4px 9px',
    cursor: 'pointer',
  }, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  b.addEventListener('mouseenter', () => { b.style.borderColor = '#5d7ea6'; });
  b.addEventListener('mouseleave', () => { b.style.borderColor = '#33475f'; });
  return b;
}

// ---------------------------------------------------------------------------
// The pop-up window
// ---------------------------------------------------------------------------

// Browsers block window.open() outside a user gesture, so this is only ever
// called from a click handler. Auto-opening on error is silently blocked
// everywhere — that is a browser rule, not something worth fighting.
function openReportWindow() {
  const report = formatReport(readErrors(), meta());
  let win = null;
  try {
    win = window.open('', 'astral-error-report', 'width=880,height=760,scrollbars=yes,resizable=yes');
  } catch { win = null; }

  if (!win) {
    showOverlay(report, 'Your browser blocked the pop-up window, so here it is inline.');
    return;
  }

  const doc = win.document;
  doc.open();
  doc.write(reportHtml(report));
  doc.close();
  try { win.focus(); } catch { /* focus is best-effort */ }
}

function reportHtml(report) {
  // Self-contained: the popup is a blank document with no access to this
  // page's stylesheets, and inlining is also what makes it survivable when
  // the app's own assets are the thing that failed.
  const escaped = report
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Astral error report</title>
<style>
  body { margin:0; background:#0e141d; color:#dde5ef;
         font:13px/1.6 ui-monospace, Menlo, Consolas, monospace; }
  header { position:sticky; top:0; display:flex; gap:8px; align-items:center;
           padding:10px 14px; background:#16202d; border-bottom:1px solid #27384b; }
  h1 { font-size:13px; margin:0; margin-right:auto; letter-spacing:.08em;
       text-transform:uppercase; color:#8fa1b6; }
  button { font:inherit; color:#dde5ef; background:#1c2836; border:1px solid #33475f;
           border-radius:6px; padding:5px 12px; cursor:pointer; }
  button:hover { border-color:#5d7ea6; }
  pre { margin:0; padding:14px; white-space:pre-wrap; word-break:break-word; }
</style></head><body>
<header>
  <h1>Astral error report</h1>
  <button id="c">Copy</button>
  <button onclick="window.print()">Print</button>
</header>
<pre id="r">${escaped}</pre>
<script>
  document.getElementById('c').addEventListener('click', function () {
    var t = document.getElementById('r').textContent;
    var done = function () { var b = document.getElementById('c'); b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1400); };
    if (navigator.clipboard) { navigator.clipboard.writeText(t).then(done, fallback); } else { fallback(); }
    function fallback() {
      var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a);
      a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove();
    }
  });
</scr${''}ipt>
</body></html>`;
}

// Used only when the pop-up blocker refuses outright.
function showOverlay(report, why) {
  const back = el('div', {
    position: 'fixed', inset: '0', zIndex: '2147483647',
    background: 'rgba(4,8,13,0.88)', padding: '24px', overflow: 'auto',
  });
  const box = el('div', {
    maxWidth: '860px', margin: '0 auto', background: '#0e141d',
    border: '1px solid #27384b', borderRadius: '10px', padding: '16px',
    font: '12px/1.6 ui-monospace, Menlo, Consolas, monospace', color: '#dde5ef',
  });
  const note = el('p', { color: '#e8b24a', marginBottom: '10px', fontSize: '12px' }, why);
  const pre = el('pre', { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0' }, report);
  const close = button('Close', () => back.remove());
  close.style.marginTop = '12px';
  box.append(note, pre, close);
  back.append(box);
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
}

function copyReport(onDone) {
  const text = formatReport(readErrors(), meta());
  const fallback = () => {
    const ta = el('textarea', { position: 'fixed', top: '-1000px' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); onDone(true); } catch { onDone(false); }
    ta.remove();
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => onDone(true), fallback);
  } else {
    fallback();
  }
}

// ---------------------------------------------------------------------------
// The banner
// ---------------------------------------------------------------------------

function buildBanner() {
  const host = el('div', {
    position: 'fixed', right: '14px', bottom: '14px', zIndex: '2147483646',
    maxWidth: 'min(420px, calc(100vw - 28px))',
    font: '13px/1.45 "Segoe UI", Tahoma, sans-serif',
    color: '#dde5ef', background: '#111a24',
    border: '1px solid #e2586a', borderLeftWidth: '4px',
    borderRadius: '8px', boxShadow: '0 10px 34px rgba(0,0,0,0.5)',
    padding: '10px 12px',
  });
  host.id = HOST_ID;
  // Must never be styled or hidden by app CSS — this outlives the app.
  host.setAttribute('data-astral-notifier', '');
  host.setAttribute('role', 'alert');

  const top = el('div', { display: 'flex', alignItems: 'baseline', gap: '8px' });
  const kind = el('strong', { fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e2586a' }, 'Crash');
  const where = el('span', { fontSize: '11px', color: '#8fa1b6', marginRight: 'auto' }, '');
  const close = el('button', {
    font: 'inherit', fontSize: '15px', lineHeight: '1', color: '#8fa1b6',
    background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
  }, '×');
  close.type = 'button';
  close.title = 'Dismiss (the error stays in the report)';
  close.addEventListener('click', () => { state.dismissed = true; host.remove(); });
  top.append(kind, where, close);

  const msg = el('div', {
    fontSize: '12.5px', margin: '5px 0 2px', wordBreak: 'break-word',
    maxHeight: '4.4em', overflow: 'hidden',
  }, '');
  const sub = el('div', { fontSize: '11px', color: '#8fa1b6', marginBottom: '8px' }, '');

  const row = el('div', { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' });
  const openBtn = button('Open', openReportWindow);
  openBtn.title = 'Open the full report in a new window';
  const copyBtn = button('Copy', () => {
    copyReport((ok) => {
      copyBtn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });
  const consoleBtn = button('Console', () => {
    console.group('%cAstral error report', 'color:#e2586a;font-weight:700');
    for (const e of readErrors()) console.error(e);
    console.log(formatReport(readErrors(), meta()));
    console.groupEnd();
    consoleBtn.textContent = 'Sent ↗';
    setTimeout(() => { consoleBtn.textContent = 'Console'; }, 1500);
  });
  consoleBtn.title = 'Dump everything to the dev console (F12)';
  const count = el('span', { marginLeft: 'auto', fontSize: '11px', color: '#8fa1b6' }, '');
  row.append(openBtn, copyBtn, consoleBtn, count);

  host.append(top, msg, sub, row);
  state.els = { kind, where, msg, sub, count };
  return host;
}

function render() {
  if (state.dismissed || !state.latest) return;
  if (typeof document === 'undefined' || !document.body) return;

  if (!state.host || !state.host.isConnected) {
    state.host = buildBanner();
    document.body.appendChild(state.host);
  }

  const { latest } = state;
  const c = COLOURS[latest.kind] || COLOURS[CRASH];
  const { kind, where, msg, sub, count } = state.els;

  state.host.style.borderColor = c.edge;
  state.host.style.background = `linear-gradient(${c.tint}, ${c.tint}), #111a24`;
  kind.style.color = c.edge;
  kind.textContent = latest.chunk ? 'Site updated' : c.label;
  where.textContent = latest.route || '';
  msg.textContent = latest.chunk
    ? 'This tab was open across a deploy and asked for a file that no longer exists. Reloading fixes it.'
    : `${latest.name}: ${latest.message}`;

  const firstFrame = (latest.stack || '').split('\n')[1] || '';
  const time = new Date(latest.at).toLocaleTimeString();
  sub.textContent = [firstFrame.trim().replace(/^at\s+/, ''), time].filter(Boolean).join(' · ');

  count.textContent = state.count > MAX_TRACKED
    ? `${MAX_TRACKED}+ errors — stopped counting`
    : state.count > 1 ? `${state.count} errors` : '';
}

// A quieter form for "there were errors before this reload" — enough to notice,
// not enough to be in the way.
function renderEarlierPill(n) {
  if (typeof document === 'undefined' || !document.body) return;
  const pill = el('button', {
    position: 'fixed', right: '14px', bottom: '14px', zIndex: '2147483646',
    font: '11px/1 "Segoe UI", Tahoma, sans-serif', color: '#e8b24a',
    background: '#111a24', border: '1px solid rgba(232,178,74,0.5)',
    borderRadius: '999px', padding: '6px 11px', cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
  }, `⚠ ${n} error${n === 1 ? '' : 's'} earlier this session`);
  pill.type = 'button';
  pill.title = 'Open the report';
  pill.addEventListener('click', () => { pill.remove(); openReportWindow(); });
  document.body.appendChild(pill);
  // Long enough to notice on the way past, short enough not to sit on the UI.
  setTimeout(() => pill.remove(), 12000);
}

// ---------------------------------------------------------------------------
// Intake
// ---------------------------------------------------------------------------

/**
 * The single entry point. Boundaries call it, the global listeners call it,
 * React 19's createRoot callbacks call it.
 *
 * Deliberately try/catch'd end to end: a throw inside the error reporter would
 * be both invisible and infinitely recursive.
 */
export function notifyError({ kind = CRASH, error, componentStack = '', source = '' } = {}) {
  try {
    // A stale chunk after a deploy is not a bug and gets no scary banner —
    // one reload fixes it completely. tryChunkReload returns true only once
    // per session, so this can never loop.
    if (tryChunkReload(error)) return;

    const described = describeError(error);
    const now = Date.now();
    const key = `${kind}|${described.message}`;
    if (key === state.lastKey && now - state.lastAt < DEDUPE_MS) return;
    state.lastKey = key;
    state.lastAt = now;

    state.count += 1;
    if (state.count <= MAX_TRACKED) {
      recordError({ kind, error, componentStack, route: route(), source, buildId, at: now });
    }

    state.latest = { ...described, kind, route: route(), at: now, chunk: isChunkLoadError(error) };
    // A dismissed banner comes back for a NEW error — dismissing means "I have
    // seen this one", not "stop telling me things".
    state.dismissed = false;
    render();

    if (kind === CRASH && state.alerts < MAX_ALERTS && isAlertMode()) {
      state.alerts += 1;
      window.alert(`Astral crash\n\n${described.name}: ${described.message}\n\nat ${route()}`);
    }
  } catch {
    // Last resort: never let the reporter be the thing that breaks.
    try { console.error('[astral] notifier failed for', error); } catch { /* nothing left */ }
  }
}

function isAlertMode() {
  try { return localStorage.getItem(ALERT_KEY) === '1'; } catch { return false; }
}

/**
 * Install the global listeners. Call once, as early as possible — before React
 * renders, so an error during the very first render is still caught.
 */
export function installErrorNotifier() {
  if (state.installed || typeof window === 'undefined') return;
  state.installed = true;

  window.addEventListener('error', (e) => {
    // Failed <img>/<script>/<link> loads fire 'error' on the element and bubble
    // here with no `error` property. Not worth a banner.
    if (!e.error && !e.message) return;
    notifyError({ kind: BACKGROUND, error: e.error || e.message, source: 'window.error' });
  });

  window.addEventListener('unhandledrejection', (e) => {
    notifyError({ kind: BACKGROUND, error: e.reason, source: 'unhandledrejection' });
  });

  // One-click access from devtools without hunting for the banner.
  window.astralErrorReport = () => formatReport(readErrors(), meta());
  window.astralErrors = () => readErrors();

  const earlier = readErrors();
  if (earlier.length) {
    const n = earlier.reduce((sum, e) => sum + e.count, 0);
    // Wait for body — this runs before React and can beat the DOM.
    if (document.body) renderEarlierPill(n);
    else window.addEventListener('DOMContentLoaded', () => renderEarlierPill(n), { once: true });
  }
}

// Test seam. Not used by the app.
export function __resetNotifier() {
  state.host?.remove();
  Object.assign(state, {
    installed: false, count: 0, alerts: 0, latest: null,
    lastKey: '', lastAt: 0, dismissed: false, host: null, els: {},
  });
}
