import { Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { OrbitContext, useOrbitState } from './orbitContext';
import useKeyboardInset from '../../hooks/useKeyboardInset';
import TodayView from './views/TodayView';
import TriageView from './views/TriageView';
import CaptureScreen from './views/CaptureScreen';
import CaptureBar from './views/CaptureBar';
import SearchOverlay from './views/SearchOverlay';
import AreasView from './views/AreasView';
import ProjectView from './views/ProjectView';
import SettingsView from './views/SettingsView';
import MockGallery from './views/MockGallery';
import ReferenceView from './views/ReferenceView';
import ReviewView from './views/ReviewView';
import TrackersView from './views/TrackersView';
import PlannerView from './views/PlannerView';
import AutoScheduleView from './views/AutoScheduleView';
import RecurringView from './views/RecurringView';
import HistoryView from './views/HistoryView';
import CarryoverView from './views/CarryoverView';
import ViewsHub from './views/ViewsHub';
import './Orbit.css';
import HubLink from '../../components/HubLink';

// Nav entries shown in the secondary "more" disclosure group — Phase 2
// screens that don't need top-billing next to Today/Triage/Areas. Carryover
// is deliberately included here (not just surfaced via the nudge banner)
// so it's still reachable with zero carried-over tasks.
const MORE_NAV_ITEMS = [
  { to: '/orbit/views', label: 'Views' },
  { to: '/orbit/reference', label: 'Reference Vault' },
  { to: '/orbit/review', label: 'Weekly Review' },
  { to: '/orbit/trackers', label: 'Trackers' },
  { to: '/orbit/planner', label: 'Planner' },
  { to: '/orbit/recurring', label: 'Recurring' },
  { to: '/orbit/history', label: 'History' },
  { to: '/orbit/carryover', label: 'Carryover' },
];

// Installable-to-home-screen (PWA) is scoped to this sub-app only — same
// pattern as FitnessTrackerApp's useScopedManifest. The manifest file may not
// exist on disk yet; a 404 on the <link> is harmless.
function useScopedManifest() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/orbit/manifest.webmanifest';
    document.head.appendChild(link);
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#0e1116';
    document.head.appendChild(theme);
    return () => { document.head.removeChild(link); document.head.removeChild(theme); };
  }, []);
}

const navLinkClass = ({ isActive }) => `orb-nav-link${isActive ? ' active' : ''}`;

// g-then-key nav chord (OrbitApp's global keydown effect below) — vim-style
// quick jump between the main views. Plain lookup so the effect body stays a
// dumb dispatch instead of a growing if/else chain as more views land.
const G_NAV_KEYS = {
  t: '/orbit',
  i: '/orbit/triage',
  a: '/orbit/areas',
  r: '/orbit/reference',
  w: '/orbit/review',
  s: '/orbit/settings',
};

export default function OrbitApp() {
  const orbit = useOrbitState();
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // "More" nav group starts expanded only if the current route is already
  // inside it, so a direct link/refresh lands with its own active item
  // visible instead of hidden behind a collapsed disclosure.
  const [moreOpen, setMoreOpen] = useState(
    () => MORE_NAV_ITEMS.some((item) => location.pathname.startsWith(item.to)),
  );
  // Carryover nudge dismissal is sessionStorage-backed (not plain state) so
  // it survives a page refresh mid-session but comes back next time the tab
  // is opened fresh — "dismissible-per-session", not "dismissed forever".
  const [carryoverDismissed, setCarryoverDismissed] = useState(
    () => sessionStorage.getItem('orbit-carryover-nudge-dismissed') === '1',
  );
  useScopedManifest();
  useKeyboardInset();

  // Close the mobile nav drawer on navigation. Reset-during-render (same
  // pattern as Navbar.jsx's menuOpenForPath) instead of an effect, to avoid
  // an extra cascading render.
  const [navOpenForPath, setNavOpenForPath] = useState(location.pathname);
  if (navOpenForPath !== location.pathname) {
    setNavOpenForPath(location.pathname);
    setNavOpen(false);
  }

  // pendingG tracks "a bare 'g' was just pressed, waiting on its follow-up
  // key" for the nav chord below. A ref, not state — a stray 'g' with no
  // second key should time out silently, not cost a re-render.
  const pendingGRef = useRef(false);
  const gTimeoutRef = useRef(null);

  // Global shortcuts — Ctrl/Cmd+K opens quick-capture (same as the
  // "＋ Capture" button), Ctrl/Cmd+/ opens search. Only 'k' and '/' are
  // intercepted, so Ctrl/Cmd+C/V/X/Z inside any input keep working normally.
  // Also a 'g'-then-key chord (g t/i/a/r/w/s) for quick nav between the main
  // views — ignored while typing and while any modifier is held so it can't
  // collide with the Ctrl/Cmd shortcuts above or browser/OS shortcuts.
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setCaptureOpen(true);
        } else if (e.key === '/') {
          e.preventDefault();
          setSearchOpen(true);
        }
        return;
      }

      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      if (pendingGRef.current) {
        pendingGRef.current = false;
        if (gTimeoutRef.current) {
          clearTimeout(gTimeoutRef.current);
          gTimeoutRef.current = null;
        }
        const dest = G_NAV_KEYS[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          navigate(dest);
        }
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        pendingGRef.current = true;
        gTimeoutRef.current = setTimeout(() => {
          pendingGRef.current = false;
          gTimeoutRef.current = null;
        }, 1000);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [navigate]);

  const untriagedCount = orbit.inbox.filter((i) => !i.triaged).length;
  const carryoverCount = orbit.carryoverCandidates.length;

  const dismissCarryoverNudge = () => {
    sessionStorage.setItem('orbit-carryover-nudge-dismissed', '1');
    setCarryoverDismissed(true);
  };

  return (
    <OrbitContext.Provider value={orbit}>
      <div className="orb-app">
        <header className="orb-topbar">
          <button
            type="button"
            className="orb-hamburger"
            onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
          >
            {navOpen ? '✕' : '☰'}
          </button>
          {/* The site nav is suppressed on this route (own topbar — see
              Navbar.jsx OWN_TOPBAR_ROUTES), so this is the only way back. */}
          <HubLink className="orb-site-home" />
          <div className="orb-brand"><span className="orb-brand-icon">🪐</span> Orbit</div>
          <div className="orb-topbar-right">
            <span className={`orb-sync orb-sync-${orbit.mode}`} title={orbit.mode === 'cloud' ? 'Syncing to your account' : 'Saved on this device'}>
              {orbit.mode === 'cloud' ? '☁ Synced' : '● Local'}
            </span>
            <button
              type="button"
              className="orb-btn orb-search-btn"
              onClick={() => setSearchOpen(true)}
              title="Search (Ctrl/Cmd+/)"
            >
              🔎 Search
            </button>
            <button type="button" className="orb-btn orb-capture-btn" onClick={() => setCaptureOpen((o) => !o)} title="Quick brain-dump to your triage queue (Ctrl/Cmd+K)">
              ＋ Capture
            </button>
            <Link to="/orbit/capture" className="orb-btn-primary orb-addtask-btn" title="Full add-task form — area, priority, schedule">
              ＋ Add Task
            </Link>
          </div>
        </header>

        <div className="orb-body">
          {navOpen && <div className="orb-nav-scrim" onClick={() => setNavOpen(false)} />}
          <nav className={`orb-nav${navOpen ? ' open' : ''}`}>
            <NavLink to="/orbit/capture" className={({ isActive }) => `orb-nav-link orb-nav-link-addtask${isActive ? ' active' : ''}`}>＋ Add Task</NavLink>
            <NavLink end to="/orbit" className={navLinkClass}>Today</NavLink>
            <NavLink to="/orbit/triage" className={navLinkClass}>
              Triage
              {untriagedCount > 0 && <span className="orb-nav-badge">{untriagedCount}</span>}
            </NavLink>
            <NavLink to="/orbit/auto-schedule" className={({ isActive }) => `orb-nav-link orb-nav-link-auto${isActive ? ' active' : ''}`}>✨ Auto-Schedule</NavLink>

            <button
              type="button"
              className="orb-nav-more-toggle"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
            >
              More
              {carryoverCount > 0 && <span className="orb-nav-badge">{carryoverCount}</span>}
              <span className="orb-nav-more-caret">{moreOpen ? '▾' : '▸'}</span>
            </button>
            {moreOpen && (
              <div className="orb-nav-more-group">
                {MORE_NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    {item.label}
                    {item.to === '/orbit/carryover' && carryoverCount > 0 && (
                      <span className="orb-nav-badge">{carryoverCount}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}

            <NavLink to="/orbit/settings" className={navLinkClass}>Settings</NavLink>
            <NavLink to="/orbit/mocks" className="orb-nav-link orb-nav-link-mocks">Mock gallery</NavLink>
          </nav>

          <main className="orb-main">
            {!orbit.loading && carryoverCount > 0 && !carryoverDismissed && (
              <div className="orb-carryover-nudge">
                <span className="orb-carryover-nudge-text">{carryoverCount} carried over</span>
                <Link to="/orbit/carryover" className="orb-carryover-nudge-link">Review</Link>
                <button
                  type="button"
                  className="orb-carryover-nudge-dismiss"
                  onClick={dismissCarryoverNudge}
                  aria-label="Dismiss carryover nudge"
                >
                  ✕
                </button>
              </div>
            )}

            {orbit.loading ? (
              <div className="orb-loading">Loading…</div>
            ) : (
              <Routes>
                <Route index element={<TodayView />} />
                <Route path="triage" element={<TriageView />} />
                {/* old path — keeps existing links/bookmarks working */}
                <Route path="inbox" element={<Navigate to="/orbit/triage" replace />} />
                <Route path="capture" element={<CaptureScreen />} />
                <Route path="areas" element={<AreasView />} />
                <Route path="project/:id" element={<ProjectView />} />
                <Route path="reference" element={<ReferenceView />} />
                <Route path="review" element={<ReviewView />} />
                <Route path="trackers" element={<TrackersView />} />
                <Route path="planner" element={<PlannerView />} />
                <Route path="auto-schedule" element={<AutoScheduleView />} />
                <Route path="recurring" element={<RecurringView />} />
                <Route path="history" element={<HistoryView />} />
                <Route path="carryover" element={<CarryoverView />} />
                <Route path="views" element={<ViewsHub />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="mocks" element={<MockGallery />} />
                <Route path="*" element={<TodayView />} />
              </Routes>
            )}
          </main>
        </div>

        <CaptureBar open={captureOpen} onClose={() => setCaptureOpen(false)} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </OrbitContext.Provider>
  );
}
