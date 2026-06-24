import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
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
              <li><Link to="/mymdb">MyMDB</Link></li>
              <li><Link to="/rs-market">RS Market</Link></li>
              <li><Link to="/sql-quest">SQL Quest</Link></li>
              <li><Link to="/python-game">Code Trials</Link></li>
              <li><a href="/rustioclone/index.html">Rustio Clone</a></li>
              <li><a href="/rustpunkio/index.html">RustPunkio</a></li>
            </ul>
          </li>
          <li><Link to="/techniques">Techniques</Link></li>
          <li><Link to="/experiences">Experiences</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
