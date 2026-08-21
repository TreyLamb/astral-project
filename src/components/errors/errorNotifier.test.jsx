// @vitest-environment jsdom
//
// These prove the premise the whole notifier rests on: React dying is not the
// PAGE dying. The banner is plain DOM appended to document.body, so it is
// still there — and still interactive — with the React tree completely gone.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { installErrorNotifier, notifyError, __resetNotifier } from './errorNotifier';
import { clearErrors, readErrors, CRASH, BACKGROUND } from './errorLog';
import ErrorBoundary from './ErrorBoundary';

let consoleError;

beforeEach(() => {
  document.body.innerHTML = '';
  sessionStorage.clear();
  localStorage.clear();
  clearErrors();
  __resetNotifier();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  __resetNotifier();
  document.body.innerHTML = '';
  consoleError.mockRestore();
});

const banner = () => document.querySelector('[data-astral-notifier]');
const bannerText = () => banner()?.textContent ?? '';
const buttonNamed = (re) => [...(banner()?.querySelectorAll('button') ?? [])].find((b) => re.test(b.textContent));

describe('the banner', () => {
  it('is not there until something breaks', () => {
    installErrorNotifier();
    expect(banner()).toBeNull();
  });

  it('appears on the first error', () => {
    notifyError({ error: new Error('first blood') });
    expect(banner()).not.toBeNull();
    expect(bannerText()).toContain('first blood');
  });

  it('names the two kinds differently', () => {
    notifyError({ kind: CRASH, error: new Error('a crash') });
    expect(bannerText()).toMatch(/crash/i);

    __resetNotifier();
    document.body.innerHTML = '';
    notifyError({ kind: BACKGROUND, error: new Error('a fetch') });
    expect(bannerText()).toMatch(/background error/i);
  });

  // A component throwing on every render can produce thousands. One banner
  // with a count; never a wall of them.
  it('counts repeats instead of stacking banners', () => {
    for (let i = 0; i < 6; i += 1) {
      notifyError({ error: new Error(`distinct ${i}`) });
    }
    expect(document.querySelectorAll('[data-astral-notifier]')).toHaveLength(1);
    expect(bannerText()).toContain('6 errors');
  });

  // StrictMode double-renders in dev, so the identical error arrives twice
  // within a frame. Showing every dev error twice would train you to ignore it.
  it('dedupes an identical error fired twice in a row', () => {
    notifyError({ error: new Error('doubled') });
    notifyError({ error: new Error('doubled') });
    expect(readErrors()).toHaveLength(1);
    expect(bannerText()).not.toContain('2 errors');
  });

  it('stops counting rather than melting the page in a render loop', () => {
    for (let i = 0; i < 60; i += 1) notifyError({ error: new Error(`loop ${i}`) });
    expect(bannerText()).toMatch(/stopped counting/i);
    // The log is capped too, so storage cannot run away.
    expect(readErrors().length).toBeLessThanOrEqual(25);
  });

  it('dismisses, but comes back for a NEW error', () => {
    notifyError({ error: new Error('one') });
    const close = [...banner().querySelectorAll('button')].find((b) => b.textContent === '×');
    close.click();
    expect(banner()).toBeNull();

    notifyError({ error: new Error('two') });
    expect(banner()).not.toBeNull();
    expect(bannerText()).toContain('two');
  });
});

describe('surviving React', () => {
  // The premise, stated as a test. If this fails, the notifier is pointless —
  // a React toast would have done.
  it('is still on screen and still interactive after React unmounts entirely', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<p>the app</p>));
    expect(host.textContent).toContain('the app');

    notifyError({ error: new Error('the site died') });
    expect(banner()).not.toBeNull();

    // Simulate what React does to itself on an uncaught render error.
    act(() => root.unmount());
    expect(host.textContent).toBe('');

    expect(banner()).not.toBeNull();
    expect(bannerText()).toContain('the site died');
    expect(buttonNamed(/open/i)).toBeTruthy();
    expect(buttonNamed(/copy/i)).toBeTruthy();
  });
});

describe('global listeners', () => {
  // Boundaries only catch render errors. These two paths are the ONLY thing
  // covering handlers, timers and promises, which is most async code.
  it('catches an unhandled rejection as a background error', () => {
    installErrorNotifier();
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), {
      reason: new Error('a promise gave up'),
    }));
    expect(bannerText()).toContain('a promise gave up');
    expect(readErrors()[0].kind).toBe(BACKGROUND);
  });

  it('catches a plain window error', () => {
    installErrorNotifier();
    window.dispatchEvent(Object.assign(new Event('error'), {
      error: new Error('thrown from a timer'),
      message: 'thrown from a timer',
    }));
    expect(bannerText()).toContain('thrown from a timer');
  });

  // A failed <img> fires 'error' on the element with no error property. A
  // banner for every broken image would be noise, not signal.
  it('ignores a bare asset load failure', () => {
    installErrorNotifier();
    window.dispatchEvent(new Event('error'));
    expect(banner()).toBeNull();
  });

  it('exposes a console helper for pasting a report', () => {
    installErrorNotifier();
    notifyError({ error: new Error('for the console') });
    expect(typeof window.astralErrorReport).toBe('function');
    expect(window.astralErrorReport()).toContain('for the console');
  });

  it('installs only once even if called twice', () => {
    installErrorNotifier();
    installErrorNotifier();
    window.dispatchEvent(Object.assign(new Event('error'), {
      error: new Error('once only'), message: 'once only',
    }));
    expect(readErrors()).toHaveLength(1);
  });
});

describe('stale chunks', () => {
  it('reloads once instead of showing a scary banner', () => {
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload, pathname: '/', hash: '' });

    notifyError({ error: new Error('Failed to fetch dynamically imported module: /assets/a.js') });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(banner()).toBeNull();

    // Guard is now spent, so the second one surfaces normally.
    notifyError({ error: new Error('Failed to fetch dynamically imported module: /assets/a.js') });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(banner()).not.toBeNull();
    expect(bannerText()).toMatch(/site updated/i);

    vi.restoreAllMocks();
  });
});

describe('boundaries feed the notifier', () => {
  it('a caught render error still raises the banner', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    function Bomb() { throw new Error('caught but still reported'); }

    act(() => root.render(<ErrorBoundary resetKey="/x"><Bomb /></ErrorBoundary>));

    expect(host.textContent).toContain('caught but still reported');
    expect(banner()).not.toBeNull();
    expect(readErrors()[0].source).toContain('boundary');
    act(() => root.unmount());
  });
});

describe('aggressive alert mode', () => {
  it('is off unless explicitly switched on', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    notifyError({ kind: CRASH, error: new Error('quiet') });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('alerts when switched on, but never more than three times', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('astral_error_alert', '1');
    for (let i = 0; i < 10; i += 1) notifyError({ kind: CRASH, error: new Error(`bang ${i}`) });
    // An alert() can only be dismissed by clicking it, so an uncapped loop
    // would trap you with no way out but killing the tab.
    expect(alertSpy).toHaveBeenCalledTimes(3);
    alertSpy.mockRestore();
  });

  it('never alerts for a background error', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('astral_error_alert', '1');
    notifyError({ kind: BACKGROUND, error: new Error('just a fetch') });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
