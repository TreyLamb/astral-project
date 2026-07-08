import { useEffect } from 'react';
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

const GAME_ROUTES = ['/bashmon', '/gitmon', '/signal-lost', '/pokered'];

function Navbar() {
  const location = useLocation();
  const isGame = GAME_ROUTES.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    if (isGame) {
      document.documentElement.style.setProperty('--nav-h', '0px');
      document.body.style.paddingTop = '0';
    } else {
      document.documentElement.style.removeProperty('--nav-h');
      document.body.style.paddingTop = '';
    }
  }, [isGame]);

  if (isGame) {
    return (
      <nav className="nav-minimal">
        <Link to="/" className="nav-home-badge" title="Home">⚡</Link>
      </nav>
    );
  }

  return (
    <nav>
      <div className="nav-container">
        <div className="logo">Astral Journey!!</div>
        <ul>
          <li className="has-dropdown">
            <Link to="/">Home</Link>
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
              <li><Link to="/rs-market">RS Market</Link></li>
              <li><Link to="/gitmon">🔵 Gitmon Blue</Link></li>
              <li><Link to="/bashmon">🔴 Bashmon Red</Link></li>
              <li><Link to="/signal-lost">📡 Signal Lost</Link></li>
              <li><Link to="/pokered">🎮 Pokemon Red</Link></li>
              <li><a href="/rustioclone/index.html">Rustio Clone</a></li>
              <li><a href="/rustpunkio/index.html">RustPunkio</a></li>
            </ul>
          </li>
          <li><Link to="/techniques">Techniques</Link></li>
          <li><Link to="/experiences">Experiences</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
        <AuthControl />
      </div>
    </nav>
  );
}

export default Navbar;
