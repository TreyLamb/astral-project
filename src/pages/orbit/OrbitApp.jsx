import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { OrbitContext, useOrbitState } from './orbitContext';
import TodayView from './views/TodayView';
import TriageView from './views/TriageView';
import CaptureScreen from './views/CaptureScreen';
import CaptureBar from './views/CaptureBar';
import AreasView from './views/AreasView';
import ProjectView from './views/ProjectView';
import SettingsView from './views/SettingsView';
import MockGallery from './views/MockGallery';
import './Orbit.css';

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

export default function OrbitApp() {
  const orbit = useOrbitState();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  useScopedManifest();

  // Close the mobile nav drawer on navigation. Reset-during-render (same
  // pattern as Navbar.jsx's menuOpenForPath) instead of an effect, to avoid
  // an extra cascading render.
  const [navOpenForPath, setNavOpenForPath] = useState(location.pathname);
  if (navOpenForPath !== location.pathname) {
    setNavOpenForPath(location.pathname);
    setNavOpen(false);
  }

  // Global capture shortcut — Ctrl/Cmd+K opens the quick-capture bar from
  // anywhere in the sub-app, same as the "＋ Capture" button.
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const untriagedCount = orbit.inbox.filter((i) => !i.triaged).length;

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
          <Link to="/" className="orb-site-home" title="Back to Astral Project home">Astral Project</Link>
          <div className="orb-brand"><span className="orb-brand-icon">🪐</span> Orbit</div>
          <div className="orb-topbar-right">
            <span className={`orb-sync orb-sync-${orbit.mode}`} title={orbit.mode === 'cloud' ? 'Syncing to your account' : 'Saved on this device'}>
              {orbit.mode === 'cloud' ? '☁ Synced' : '● Local'}
            </span>
            <button type="button" className="orb-btn-primary orb-capture-btn" onClick={() => setCaptureOpen((o) => !o)}>
              ＋ Capture
            </button>
          </div>
        </header>

        <div className="orb-body">
          {navOpen && <div className="orb-nav-scrim" onClick={() => setNavOpen(false)} />}
          <nav className={`orb-nav${navOpen ? ' open' : ''}`}>
            <NavLink end to="/orbit" className={navLinkClass}>Today</NavLink>
            <NavLink to="/orbit/inbox" className={navLinkClass}>
              Inbox
              {untriagedCount > 0 && <span className="orb-nav-badge">{untriagedCount}</span>}
            </NavLink>
            <NavLink to="/orbit/areas" className={navLinkClass}>Areas</NavLink>
            <NavLink to="/orbit/settings" className={navLinkClass}>Settings</NavLink>
            <NavLink to="/orbit/mocks" className="orb-nav-link orb-nav-link-mocks">Mock gallery</NavLink>
          </nav>

          <main className="orb-main">
            {orbit.loading ? (
              <div className="orb-loading">Loading…</div>
            ) : (
              <Routes>
                <Route index element={<TodayView />} />
                <Route path="inbox" element={<TriageView />} />
                <Route path="capture" element={<CaptureScreen />} />
                <Route path="areas" element={<AreasView />} />
                <Route path="project/:id" element={<ProjectView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="mocks" element={<MockGallery />} />
                <Route path="*" element={<TodayView />} />
              </Routes>
            )}
          </main>
        </div>

        <CaptureBar open={captureOpen} onClose={() => setCaptureOpen(false)} />
      </div>
    </OrbitContext.Provider>
  );
}
