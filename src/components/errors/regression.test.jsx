// @vitest-environment jsdom
//
// The two outages this system was built for, reproduced.
//
// Neither of these is testing the original bug — both are fixed, and each has
// its own regression test where it lives. What these assert is the thing that
// made them outages rather than annoyances: that ONE broken component took the
// entire site down. With a boundary in place the same throw has to cost only
// the component that threw.
//
// If someone later removes a <Boundary> or breaks the reset logic, these fail.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import Boundary from './Boundary';
import ErrorBoundary from './ErrorBoundary';
import { clearErrors, readErrors } from './errorLog';
import { __resetNotifier } from './errorNotifier';

let container;
let root;
let consoleError;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  sessionStorage.clear();
  clearErrors();
  __resetNotifier();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  document.querySelectorAll('[data-astral-notifier]').forEach((n) => n.remove());
  __resetNotifier();
  consoleError.mockRestore();
});

const render = (ui) => { root = createRoot(container); act(() => root.render(ui)); };

// The real one, from useMapDrawing.js: getUnitsPerPixel ran before Leaflet had
// positioned the map pane, so containerPointToLatLng reached into an undefined
// _leaflet_pos. Only happened in production, where the marker chunk arrived
// after L.map() but before the first setView().
function LeafletMap() {
  const pane = undefined;
  return <div>{pane._leaflet_pos.x}</div>;
}

// The real one, from CourseTable.jsx: a row-local `const band` shadowed the
// module-level band() helper, so the grade-colour call hit a string.
function CourseTableish() {
  const band = 'changed';
  return <span className={`tt-g-${band('B+')}`}>{band}</span>;
}

describe('2026-08-17 — the EFT map outage', () => {
  it('costs you the map, not the tool around it', () => {
    render(
      <div>
        <nav>EFT Shopping nav</nav>
        <main>
          <Boundary title="The map stopped working."><LeafletMap /></Boundary>
        </main>
        <footer>shopping list still here</footer>
      </div>,
    );

    // Before: #root emptied and you got body's blue gradient with nothing on it.
    expect(container.innerHTML).not.toBe('');
    expect(container.textContent).toContain('EFT Shopping nav');
    expect(container.textContent).toContain('shopping list still here');
    expect(container.textContent).toContain('The map stopped working.');
    expect(container.textContent).toContain('_leaflet_pos');
  });

  it('leaves a report behind rather than only a console line', () => {
    render(<Boundary title="The map stopped working."><LeafletMap /></Boundary>);
    expect(readErrors().some((e) => e.message.includes('_leaflet_pos'))).toBe(true);
  });
});

describe('2026-08-20 — the TranscriptTool crash', () => {
  it('costs you the table, not the page', () => {
    render(
      <div>
        <header>GPA Calculator · Actual 3.05</header>
        <Boundary title="The course table stopped working."><CourseTableish /></Boundary>
        <aside>side panel still here</aside>
      </div>,
    );

    expect(container.textContent).toContain('GPA Calculator · Actual 3.05');
    expect(container.textContent).toContain('side panel still here');
    expect(container.textContent).toContain('The course table stopped working.');
    expect(container.textContent).toMatch(/is not a function/);
  });

  // The route-level layer, which is what covers the other ~27 tools that have
  // no panel boundary of their own.
  it('keeps the navbar when a whole page dies', () => {
    render(
      <div>
        <nav>site nav</nav>
        <ErrorBoundary scope="route" resetKey="/TT"><CourseTableish /></ErrorBoundary>
      </div>,
    );
    expect(container.textContent).toContain('site nav');
    expect(container.textContent).toMatch(/something broke/i);
    // And an escape hatch that does not depend on the router still working.
    expect(container.querySelector('a[href="/"]')).not.toBeNull();
  });
});
