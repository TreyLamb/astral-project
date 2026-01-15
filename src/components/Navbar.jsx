import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav>
      <div className="nav-container">
        <div className="logo">Astral Journey</div>
        <ul>
          <li><Link to="/">Home</Link></li>
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
