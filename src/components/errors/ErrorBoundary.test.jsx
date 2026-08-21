// @vitest-environment jsdom
//
// The only rendering tests in this repo. They have to be: a boundary can be
// verified in exactly one way, which is to make something throw and look at
// what ends up on screen. The `@vitest-environment` docblock above opts this
// FILE into jsdom — the project default stays `node`, so every other suite
// runs exactly as it did.
//
// Hand-rolled with react-dom/client + act rather than @testing-library/react:
// the assertions below are plain textContent checks and did not justify a
// second dependency.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { clearErrors, readErrors } from './errorLog';

let container;
let root;

// React logs caught errors to console.error by design. Silencing keeps the
// suite output readable; the assertions prove the error was handled.
let consoleError;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  sessionStorage.clear();
  localStorage.clear();
  clearErrors();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  document.querySelectorAll('[data-astral-notifier]').forEach((n) => n.remove());
  consoleError.mockRestore();
});

function render(ui) {
  root = createRoot(container);
  act(() => root.render(ui));
}

function rerender(ui) {
  act(() => root.render(ui));
}

function Bomb({ label = 'kaboom' }) {
  throw new Error(label);
}

const text = () => container.textContent;

describe('ErrorBoundary', () => {
  it('renders children when nothing is wrong', () => {
    render(<ErrorBoundary resetKey="/x"><p>all good</p></ErrorBoundary>);
    expect(text()).toContain('all good');
  });

  // The whole point. Before this existed, one throw emptied #root and left the
  // page blank — that was the blue screen.
  it('shows a fallback instead of unmounting the tree', () => {
    render(<ErrorBoundary resetKey="/x"><Bomb label="band2 is not a function" /></ErrorBoundary>);
    expect(container.innerHTML).not.toBe('');
    expect(text()).toContain('band2 is not a function');
    expect(text()).toMatch(/something broke/i);
  });

  it('leaves everything outside it alone', () => {
    render(
      <div>
        <p>sibling survives</p>
        <ErrorBoundary resetKey="/x"><Bomb /></ErrorBoundary>
      </div>,
    );
    expect(text()).toContain('sibling survives');
  });

  it('records the crash so Copy report has something to copy', () => {
    render(<ErrorBoundary resetKey="/x"><Bomb label="logged please" /></ErrorBoundary>);
    const logged = readErrors();
    expect(logged.some((e) => e.message === 'logged please')).toBe(true);
  });

  it('captures the React component stack, which a bare stack does not give you', () => {
    render(<ErrorBoundary resetKey="/x"><Bomb label="stacked" /></ErrorBoundary>);
    const entry = readErrors().find((e) => e.message === 'stacked');
    expect(entry.componentStack).toContain('Bomb');
  });
});

describe('resetting', () => {
  // React boundaries never clear themselves. Without this, a crash on /TT
  // would still be showing its error screen after navigating to /MFT.
  it('recovers when the route changes', () => {
    render(<ErrorBoundary resetKey="/TT"><Bomb label="tt crash" /></ErrorBoundary>);
    expect(text()).toContain('tt crash');

    rerender(<ErrorBoundary resetKey="/MFT"><p>fitness loaded</p></ErrorBoundary>);
    expect(text()).toContain('fitness loaded');
    expect(text()).not.toContain('tt crash');
  });

  // A `key` on the boundary would also reset it — and would remount the whole
  // subtree on every in-tool navigation, throwing away sub-app state. This
  // proves the children are NOT remounted while the boundary is healthy.
  it('does not remount healthy children when the resetKey changes', () => {
    let mounts = 0;
    function Counter() {
      const [n] = useState(() => { mounts += 1; return mounts; });
      return <p>mount #{n}</p>;
    }
    render(<ErrorBoundary resetKey="/MFT/dashboard"><Counter /></ErrorBoundary>);
    expect(text()).toContain('mount #1');

    rerender(<ErrorBoundary resetKey="/MFT/calendar"><Counter /></ErrorBoundary>);
    expect(text()).toContain('mount #1');
    expect(mounts).toBe(1);
  });

  it('retries when Try again is clicked', () => {
    let broken = true;
    function Flaky() {
      if (broken) throw new Error('transient');
      return <p>recovered</p>;
    }
    render(<ErrorBoundary resetKey="/x"><Flaky /></ErrorBoundary>);
    expect(text()).toContain('transient');

    broken = false;
    const btn = [...container.querySelectorAll('button')].find((b) => /try again/i.test(b.textContent));
    expect(btn).toBeTruthy();
    act(() => btn.click());
    expect(text()).toContain('recovered');
  });
});

describe('loop guard', () => {
  // A component that throws on mount throws again the instant it remounts.
  // Without a guard, Try again spins between broken and broken forever.
  it('stops offering a retry after repeated immediate failures', () => {
    render(<ErrorBoundary resetKey="/x"><Bomb label="always" /></ErrorBoundary>);

    for (let i = 0; i < 5; i += 1) {
      const btn = [...container.querySelectorAll('button')].find((b) => /try again/i.test(b.textContent));
      if (!btn) break;
      act(() => btn.click());
    }

    expect(text()).toMatch(/kept crashing/i);
    const retry = [...container.querySelectorAll('button')].find((b) => /try again/i.test(b.textContent));
    expect(retry).toBeUndefined();
  });
});

describe('compact panel mode', () => {
  it('fails small, with the given title', () => {
    render(
      <ErrorBoundary compact resetKey="p" title="The map stopped working.">
        <Bomb label="_leaflet_pos" />
      </ErrorBoundary>,
    );
    expect(text()).toContain('The map stopped working.');
    expect(text()).toContain('_leaflet_pos');
    // The full-screen wording belongs to the page-level fallback, not a panel.
    expect(text()).not.toMatch(/rest of the site/i);
  });
});

describe('stale chunk', () => {
  it('explains a deploy rather than showing a stack trace', () => {
    // The reload guard is pre-spent, so this reaches the boundary instead of
    // reloading — which is the second-occurrence path.
    sessionStorage.setItem('astral_chunk_reload_v1', String(Date.now()));
    render(
      <ErrorBoundary resetKey="/x">
        <Bomb label="Failed to fetch dynamically imported module: /assets/x-abc.js" />
      </ErrorBoundary>,
    );
    expect(text()).toMatch(/site was updated/i);
    expect(text()).toMatch(/reloading fixes it/i);
  });
});

describe('under StrictMode', () => {
  // StrictMode deliberately double-invokes render in dev. The boundary must
  // land on one fallback, not flicker or double-report.
  it('still shows exactly one fallback', () => {
    render(
      <StrictMode>
        <ErrorBoundary resetKey="/x"><Bomb label="strict" /></ErrorBoundary>
      </StrictMode>,
    );
    expect(text()).toContain('strict');
    expect(container.querySelectorAll('.err-screen')).toHaveLength(1);
  });
});
