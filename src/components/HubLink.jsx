import { Link } from 'react-router-dom';

/**
 * The Astral Hub link that lives inside a tool's OWN top bar.
 *
 * Every sub-app with its own top bar suppresses the global site nav (see
 * Navbar.jsx OWN_TOPBAR_ROUTES), so this is the only way back to the rest of
 * the site from inside a tool. It is always the first child of that bar, so it
 * lands far-left where the site logo would have been.
 *
 * The base `.hub-link` class deliberately sets almost nothing — it inherits
 * font and colour from the bar it sits in, so the link takes on each tool's own
 * styling rather than dragging the hub's look into every tool. Pass `className`
 * when a tool wants to style it further; several already have a `*-site-home`
 * rule for exactly that.
 */
export default function HubLink({ className = '', label = 'Astral Hub' }) {
  return (
    <Link
      to="/"
      className={`hub-link${className ? ` ${className}` : ''}`}
      title="Back to Astral Hub"
    >
      <span className="hub-link-mark" aria-hidden="true">⚡</span>
      {label}
    </Link>
  );
}
