import { useState, useMemo } from 'react';
import { SITE_LINKS } from '../../siteLinks';
import { readErrors, formatReport } from './errorLog';
import { allKeys, keysForRoute, removeKeys, fmtBytes, prefixesForRoute } from './toolStorage';
import './ErrorFallback.css';

// Reuses the registry that already exists rather than inventing a second one:
// SITE_LINKS carries name/icon/accent for every tool, so a crash in EFT
// Shopping can wear EFT Shopping's colours. /TT is deliberately absent from
// SITE_LINKS (it is URL-only, at Trey's request) so it falls through to the
// neutral default — which is correct, not a bug.
function toolFor(pathname) {
  const hit = SITE_LINKS
    .filter((l) => !l.ext && pathname.startsWith(l.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (hit) return { name: hit.name, icon: hit.icon, accent: hit.accent, rgb: hit.rgb };

  const { route } = prefixesForRoute(pathname);
  return { name: route ? route.replace(/^\//, '') : 'this page', icon: '⚠', accent: '#e2586a', rgb: '226,88,106' };
}

// window.location rather than useLocation: the root boundary sits OUTSIDE
// <Router>, so router hooks are unavailable exactly when things are worst.
function currentPath() {
  try { return window.location.pathname; } catch { return ''; }
}

function StoragePanel({ pathname, tool }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);

  const mine = useMemo(() => (open ? keysForRoute(pathname) : []), [open, pathname]);
  const every = useMemo(() => (open ? allKeys(pathname) : []), [open, pathname]);
  const rows = showAll ? every : mine;

  // Default selection is this tool's own keys. Site-wide keys (your home
  // layout, your sign-in state) are never pre-ticked, even in show-all.
  const selected = picked ?? new Set(mine.map((k) => k.key));
  const toggle = (key) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setPicked(next);
    setConfirming(false);
  };

  if (!open) {
    return (
      <button type="button" className="err-disclose" onClick={() => setOpen(true)}>
        ▸ Reset saved data for {tool.name}
      </button>
    );
  }

  return (
    <div className="err-storage">
      <button type="button" className="err-disclose open" onClick={() => setOpen(false)}>
        ▾ Reset saved data for {tool.name}
      </button>

      <p className="err-note">
        Only fixes one thing, but it is the thing a reload cannot: if a bad value got saved, the
        tool reads it, crashes, and reads the same value again on every reload. This clears it
        from <strong>this browser only</strong> — anything synced to your account is untouched.
      </p>

      {done ? (
        <p className="err-done">
          Removed {done.removed.length} key{done.removed.length === 1 ? '' : 's'}.
          {done.failed.length > 0 && ` ${done.failed.length} could not be removed.`}
          {' '}Reload to start clean.
        </p>
      ) : (
        <>
          {rows.length === 0 ? (
            <p className="err-note">
              {showAll ? 'Nothing is saved in this browser.' : `No saved keys are registered for ${tool.name}.`}
              {!showAll && ' Try the full list.'}
            </p>
          ) : (
            <ul className="err-keys">
              {rows.map((k) => (
                <li key={k.key}>
                  <label>
                    <input type="checkbox" checked={selected.has(k.key)} onChange={() => toggle(k.key)} />
                    <code>{k.key}</code>
                    {k.site && <span className="err-tag">site-wide</span>}
                    {showAll && k.mine && <span className="err-tag err-tag-mine">{tool.name}</span>}
                    <span className="err-size">{fmtBytes(k.bytes)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="err-storage-actions">
            {/* The registry is a shortcut, never load-bearing — this path
                needs no map and can never be out of date. */}
            <button type="button" className="err-btn err-btn-quiet" onClick={() => { setShowAll(!showAll); setConfirming(false); }}>
              {showAll ? `Just ${tool.name}` : `Show all ${every.length} keys`}
            </button>
            <div className="err-spacer" />
            {confirming ? (
              <>
                <button type="button" className="err-btn err-btn-quiet" onClick={() => setConfirming(false)}>Cancel</button>
                <button
                  type="button"
                  className="err-btn err-btn-danger"
                  onClick={() => setDone(removeKeys([...selected]))}
                >Yes, delete {selected.size}</button>
              </>
            ) : (
              <button
                type="button"
                className="err-btn err-btn-danger"
                disabled={selected.size === 0}
                onClick={() => setConfirming(true)}
              >Delete {selected.size} selected…</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ErrorFallback({
  error, componentStack, scope, compact, title, looping, stale, canRetry, onRetry,
}) {
  const [copied, setCopied] = useState(false);
  const pathname = currentPath();
  const tool = toolFor(pathname);

  function copy() {
    const text = formatReport(readErrors(), {
      now: Date.now(),
      route: pathname,
      buildId: typeof __BUILD_ID__ === 'undefined' ? 'dev' : __BUILD_ID__,
      userAgent: navigator.userAgent,
    });
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, done);
    else done();
  }

  const message = `${error?.name || 'Error'}: ${error?.message || String(error)}`;
  const style = { '--err-accent': tool.accent, '--err-rgb': tool.rgb };

  // A dead panel should not look like a dead site. One line, in place.
  if (compact) {
    return (
      <div className="err-panel" style={style} role="alert">
        <span className="err-panel-icon" aria-hidden="true">⚠</span>
        <div className="err-panel-body">
          <strong>{title || 'This panel stopped working.'}</strong>
          <span className="err-panel-msg">{stale ? 'The site was updated while this tab was open.' : message}</span>
        </div>
        {canRetry && <button type="button" className="err-btn" onClick={onRetry}>Try again</button>}
        <button type="button" className="err-btn err-btn-quiet" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div className="err-screen" style={style} role="alert">
      <div className="err-card">
        <div className="err-head">
          <span className="err-icon" aria-hidden="true">{tool.icon}</span>
          <div>
            <h1>{stale ? 'The site was updated' : `Something broke in ${tool.name}`}</h1>
            <p className="err-sub">
              {stale
                ? 'This tab was open across a deploy and asked for a file that no longer exists. Reloading fixes it.'
                : scope === 'root'
                  ? 'This one took the whole page down. Reloading is the fastest way out.'
                  : 'The rest of the site is still working.'}
            </p>
          </div>
        </div>

        {!stale && <p className="err-msg">{message}</p>}

        <p className="err-meta">
          {pathname} · {new Date().toLocaleString()} · build{' '}
          {typeof __BUILD_ID__ === 'undefined' ? 'dev' : __BUILD_ID__}
        </p>

        {looping && (
          <p className="err-loop">
            This kept crashing on retry, so retrying is switched off. It will fail again the moment
            it remounts — reload, or clear its saved data below.
          </p>
        )}

        <div className="err-actions">
          {canRetry && !stale && <button type="button" className="err-btn err-btn-primary" onClick={onRetry}>Try again</button>}
          <button
            type="button"
            className={`err-btn${stale || !canRetry ? ' err-btn-primary' : ''}`}
            onClick={() => window.location.reload()}
          >Reload</button>
          {/* The root boundary lives OUTSIDE <Router>, so a <Link> here would
              throw inside the error screen itself. A plain href always works. */}
          <a className="err-btn" href="/">← Astral Hub</a>
          <button type="button" className="err-btn" onClick={copy}>{copied ? 'Copied' : 'Copy report'}</button>
        </div>

        <details className="err-details">
          <summary>Technical details</summary>
          <pre>{error?.stack || message}</pre>
          {componentStack && (
            <>
              <p className="err-note">React component stack:</p>
              <pre>{componentStack.trim()}</pre>
            </>
          )}
        </details>

        <StoragePanel pathname={pathname} tool={tool} />
      </div>
    </div>
  );
}
