import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { SITE_LINKS } from '../siteLinks';
import './Navbar.css';

function AuthControl() {
  const { user, firebaseReady, signIn, signOut } = useAuth();

  if (!firebaseReady || user === undefined) return null;

  if (user) {
    return (
      <div className="nav-auth">
        {user.photoURL && <img className="nav-auth-avatar" src={user.photoURL} alt="" />}
        <span className="nav-auth-name">{user.displayName?.split(' ')[0] ?? 'Signed in'}</span>
        <button className="nav-auth-btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="nav-auth">
      <button className="nav-auth-btn nav-auth-btn-primary" onClick={signIn}>Sign in</button>
    </div>
  );
}

const GAME_ROUTES = ['/bashmon', '/gitmon', '/signal-lost', '/pokered', '/antiquityquest'];
// Sub-apps that render their own internal top bar (with their own nav/tabs and
// their own way back to Home) — the site nav would just double up and overlap
// with these, so they get the same minimal treatment as game routes.
const OWN_TOPBAR_ROUTES = ['/MFT', '/league-build', '/orbit', '/pogo-filters'];

function Navbar() {
  const location = useLocation();
  const isGame = GAME_ROUTES.some(r => location.pathname.startsWith(r));
  const hasOwnTopbar = OWN_TOPBAR_ROUTES.some(r => location.pathname.startsWith(r));
  const isMinimal = isGame || hasOwnTopbar;
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile panel on navigation so it doesn't stay open after a tap.
  // Reset during render (React's recommended pattern for "reset state when a
  // prop/route changes") rather than in an effect, which avoids an extra
  // cascading render.
  const [menuOpenForPath, setMenuOpenForPath] = useState(location.pathname);
  if (menuOpenForPath !== location.pathname) {
    setMenuOpenForPath(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (isMinimal) {
      document.documentElement.style.setProperty('--nav-h', '0px');
      document.body.style.paddingTop = '0';
    } else {
      document.documentElement.style.removeProperty('--nav-h');
      document.body.style.paddingTop = '';
    }
  }, [isMinimal]);

  if (isMinimal) {
    // Game routes get just the floating "⚡" escape hatch. Own-topbar sub-apps
    // (FitnessTracker etc.) render no fallback badge here — their own top bar
    // carries an "Astral Project" home link instead (see e.g. FitnessTrackerApp.jsx).
    return isGame ? (
      <nav className="nav-minimal">
        <Link to="/" className="nav-home-badge" title="Home">⚡</Link>
      </nav>
    ) : null;
  }

  return (
    <nav className="site-nav">
      <div className="nav-container">
        <Link to="/" className="logo">Astral Hub</Link>
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        <ul className={menuOpen ? 'nav-open' : ''}>
          <li className="has-dropdown">
            <Link to="/">Home</Link>
            {/* Always expanded on mobile (no tap-to-toggle) — the panel
                itself is already a deliberate tap to open, adding a second
                toggle just to see these was easy to miss and hid every item
                below. Desktop keeps the hover-flyout via CSS. */}
            {/* Driven off SITE_LINKS so this can never drift from the Home
                cards again — and, critically, so a tool hidden from Home stays
                reachable here. Every destination on the site is in this list. */}
            <ul className="dropdown">
              <li><Link to="/">Home</Link></li>
              {SITE_LINKS.map((l) => (
                <li key={l.to}>
                  {/* public/ tools need a plain <a> — <Link> would swallow it */}
                  {l.ext
                    ? <a href={l.to}>{l.icon} {l.name}</a>
                    : <Link to={l.to}>{l.icon} {l.name}</Link>}
                </li>
              ))}
            </ul>
          </li>
        </ul>
        <AuthControl />
      </div>
    </nav>
  );
}

export default Navbar;
