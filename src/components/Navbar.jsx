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

// Every tool that renders its OWN top bar. The site nav is suppressed on these
// so the page has exactly one bar, in the tool's own styling — see
// webdesign.md "One top bar per tool".
//
// Each of these carries <HubLink /> as the first thing in its own bar, which is
// the only way back to the hub from inside the tool. Adding a route here
// WITHOUT adding that link strands the user, so the two go together.
const OWN_TOPBAR_ROUTES = [
  '/DLAB', '/EFTsh', '/MFT', '/POGO', '/RS', '/TKB', '/TT', '/VV',
  '/google-photos', '/league-build', '/lexicon', '/medaldex', '/mymdb',
  '/orbit', '/planning-tool', '/pogo-filters', '/python-game', '/stashmap',
  '/timer-tool',
];
// '/POGO' also covers '/POGO-ACCS' by prefix, which is what we want — both
// render their own bar.

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
    // Games are full-bleed with no bar of their own, so they get the floating
    // "⚡" escape hatch. Own-topbar tools render no badge here — their own bar
    // carries <HubLink /> as its first child instead.
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
