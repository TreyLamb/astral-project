import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
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
const OWN_TOPBAR_ROUTES = ['/fitness-tracker', '/league-build'];

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
        <Link to="/" className="logo">Astral Journey!!</Link>
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
            <ul className="dropdown">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/daily-idiom">Daily Chéngyǔ</Link></li>
              <li><Link to="/daily-idiom-widget">Chéngyǔ Widget</Link></li>
              <li><Link to="/lexicon">The Lexicon</Link></li>
              <li><a href="/birds/index.html">BIRDS!!</a></li> {/* plain <a> not <Link> — static file in public/, Link would break it */}
              <li><Link to="/qa-tracker">QA Tracker</Link></li>
              <li><Link to="/google-photos">Google Photos</Link></li>
              <li><Link to="/mymdb">MyMDB</Link></li>
              <li><Link to="/tkb">TheKnowledgeBase</Link></li>
              <li><Link to="/pgo-tracker">PGO Tracker</Link></li>
              <li><Link to="/pogo-accs">POGO Accs</Link></li>
              <li><Link to="/medaldex">MedalDex</Link></li>
              <li><Link to="/antiquityquest">Antiquity Quest</Link></li>
              <li><Link to="/stashmap">StashMap</Link></li>
              <li><Link to="/fitness-tracker">FitnessTracker</Link></li>
              <li><Link to="/timer-tool">Timer Tool</Link></li>
              <li><Link to="/league-build">League Build</Link></li>
              <li><Link to="/rs-market">RS Market</Link></li>
              <li><Link to="/gitmon">🔵 Gitmon Blue</Link></li>
              <li><Link to="/bashmon">🔴 Bashmon Red</Link></li>
              <li><Link to="/signal-lost">📡 Signal Lost</Link></li>
              <li><Link to="/pokered">🎮 Pokemon Red</Link></li>
              <li><Link to="/python-game">🐍 Code Trials</Link></li>
              <li><a href="/rustioclone/index.html">Rustio Clone</a></li>
              <li><a href="/rustpunkio/index.html">RustPunkio</a></li>
            </ul>
          </li>
        </ul>
        <AuthControl />
      </div>
    </nav>
  );
}

export default Navbar;
