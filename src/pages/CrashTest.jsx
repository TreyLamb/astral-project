import { useState } from 'react';
import { Link } from 'react-router-dom';
import Boundary from '../components/errors/Boundary';

// Dev-only harness for the error system. Routed behind import.meta.env.DEV in
// App.jsx, so this never reaches production.
//
// It exists because the four failure modes below are caught by DIFFERENT parts
// of the system, and the only honest way to know each one works is to fire it:
//
//   render throw      -> the nearest error boundary
//   event handler     -> NOT a boundary. window.onerror -> the notifier.
//   setTimeout        -> NOT a boundary. window.onerror -> the notifier.
//   rejected promise  -> NOT a boundary. unhandledrejection -> the notifier.
//
// "React does not catch the last three" is the single most misunderstood thing
// about error boundaries, and the reason the vanilla notifier exists at all.

function Bomb({ label }) {
  throw new Error(`CrashTest: ${label}`);
}

function Case({ title, note, children }) {
  return (
    <section style={S.case}>
      <h2 style={S.h2}>{title}</h2>
      <p style={S.note}>{note}</p>
      {children}
    </section>
  );
}

export default function CrashTest() {
  const [renderBomb, setRenderBomb] = useState(false);
  const [panelBomb, setPanelBomb] = useState(false);

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Crash test <span style={S.dev}>dev only</span></h1>
      <p style={S.lede}>
        Each button fails a different way. Watch which layer catches it — the banner appears
        bottom-right for every one of them, but only the first two replace any UI.
      </p>
      <p style={S.lede}><Link style={S.link} to="/">← Astral Hub</Link></p>

      <Case
        title="1 · Throw during render, inside a panel boundary"
        note="Caught by <Boundary>. Only the panel is replaced — this page keeps working."
      >
        <Boundary title="This test panel crashed." resetId={panelBomb ? 'bomb' : 'ok'}>
          {panelBomb ? <Bomb label="panel render" /> : <div style={S.ok}>Panel is fine.</div>}
        </Boundary>
        <button style={S.btn} onClick={() => setPanelBomb(true)}>Break the panel</button>
        <button style={S.btn} onClick={() => setPanelBomb(false)}>Reset</button>
      </Case>

      <Case
        title="2 · Throw during render, no panel boundary"
        note="Falls through to RouteBoundary. The whole page is replaced, the Navbar survives, and navigating away clears it."
      >
        {renderBomb && <Bomb label="route render" />}
        <button style={S.btn} onClick={() => setRenderBomb(true)}>Break the page</button>
      </Case>

      <Case
        title="3 · Throw in an event handler"
        note="Boundaries do NOT catch this — React is not on the stack. window.onerror feeds the notifier instead. The UI stays completely intact."
      >
        <button style={S.btn} onClick={() => { throw new Error('CrashTest: event handler'); }}>
          Throw in onClick
        </button>
      </Case>

      <Case
        title="4 · Throw in a timer"
        note="Same story — no boundary involved. Fires 400ms after the click, which also demonstrates the banner appearing with nothing else on screen changing."
      >
        <button style={S.btn} onClick={() => setTimeout(() => { throw new Error('CrashTest: setTimeout'); }, 400)}>
          Throw in setTimeout
        </button>
      </Case>

      <Case
        title="5 · Rejected promise"
        note="An unawaited failure — a fetch that 500s, a dynamic import that 404s. Caught by the unhandledrejection listener and logged as a Background error, not a Crash."
      >
        <button style={S.btn} onClick={() => { Promise.reject(new Error('CrashTest: unhandled rejection')); }}>
          Reject a promise
        </button>
        <button
          style={S.btn}
          onClick={() => { Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/x-abc123.js')); }}
        >
          Fake a stale chunk
        </button>
      </Case>

      <p style={S.note}>
        The stale-chunk button reloads the page exactly once, then stops — the guard lives in
        sessionStorage, so a second click in the same tab shows the error instead of looping.
      </p>
    </div>
  );
}

// Inline styles on purpose: a dev-only page is not worth a stylesheet, and
// CLAUDE.md's one-CSS-file-per-page rule is about shipped pages.
const S = {
  page: { maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px', color: '#dde5ef', fontFamily: "'Segoe UI', Tahoma, sans-serif" },
  h1: { fontSize: '1.5rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 },
  dev: { fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0b1017', background: '#e8b24a', borderRadius: 4, padding: '2px 7px' },
  lede: { fontSize: '0.85rem', color: '#8fa1b6', marginBottom: 10, lineHeight: 1.6 },
  link: { color: '#a3e635' },
  case: { marginTop: 22, padding: 14, background: '#111a24', border: '1px solid #27384b', borderRadius: 10 },
  h2: { fontSize: '0.95rem', marginBottom: 4 },
  note: { fontSize: '0.78rem', color: '#8fa1b6', marginBottom: 10, lineHeight: 1.6 },
  ok: { fontSize: '0.8rem', color: '#86e2ac', padding: '10px 12px' },
  btn: { font: 'inherit', fontSize: '0.8rem', color: '#dde5ef', background: '#1c2836', border: '1px solid #33475f', borderRadius: 6, padding: '7px 13px', cursor: 'pointer', marginRight: 8 },
};
