// Detects a newer deploy while this tab is still open, and says so.
//
// Added 2026-09-15. Trey has the site on his iPhone home screen (see index.html's manifest
// note), and a home-screen web app does not behave like a Safari tab that gets reloaded when you
// come back to it - iOS keeps that one page's process suspended and just resumes it, so a tab
// left open across a Vercel redeploy runs the OLD bundle forever with no error, nothing to catch.
// `components/errors/chunkReload.js` already recovers from a stale LAZY chunk 404ing, but that
// only fires once code-splitting actually goes to fetch something new - this app's main bundle,
// loaded once at boot, never triggers it. This is the other half: ask, don't wait to be told.
//
// The check is index.html itself, fetched with cache busted, because it carries a `build-id`
// meta tag (vite.config.js's htmlBuildIdPlugin) that changes on every deploy and costs nothing to
// read - no new JS is loaded just to check.

const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : null;

async function fetchLiveBuildId() {
  const res = await fetch(`/index.html?_=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const html = await res.text();
  return html.match(/name="build-id" content="([^"]*)"/)?.[1] ?? null;
}

/**
 * Starts watching for a newer deploy. Calls `onUpdateAvailable(liveId)` at most once - after
 * that this stops checking, since there is nothing more useful to say until the tab reloads
 * anyway. Returns a cleanup function.
 *
 * Checks: once now, every time the tab is foregrounded (visibilitychange/pageshow - the moment
 * that matters for a resumed home-screen app), and on a slow interval as a backstop for a tab
 * that is simply left open and visible for a long time.
 */
export function watchForUpdate(onUpdateAvailable, { intervalMs = 20 * 60 * 1000 } = {}) {
  if (!CURRENT) return () => {};
  let stopped = false;

  const check = async () => {
    if (stopped || document.visibilityState === 'hidden') return;
    let liveId;
    try {
      liveId = await fetchLiveBuildId();
    } catch {
      return; // offline, or the request was blocked - try again on the next trigger
    }
    if (stopped || !liveId || liveId === CURRENT) return;
    stopped = true;
    onUpdateAvailable(liveId);
  };

  check();
  const onVisible = () => { if (document.visibilityState === 'visible') check(); };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pageshow', check);
  const interval = setInterval(check, intervalMs);

  return () => {
    stopped = true;
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('pageshow', check);
    clearInterval(interval);
  };
}
