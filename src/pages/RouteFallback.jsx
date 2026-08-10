import { Link, Navigate, useLocation } from 'react-router-dom';
import { canonicalPathFor } from '../routeAliases';

// Catch-all for anything the Routes block didn't match. Two jobs:
//   • redirect old/mis-cased paths to their canonical one (see routeAliases.js)
//   • otherwise render a visible Not Found
//
// That second half matters more than it looks: vercel.json rewrites EVERY path
// to index.html, so before this existed an unrouted URL rendered a blank white
// page with no error anywhere. /planning-tool shipped in that state — the page
// files were committed but the <Route> wasn't, and the only symptom was
// nothing at all. A 404 screen makes that class of mistake self-reporting.
export default function RouteFallback() {
  const location = useLocation();
  const target = canonicalPathFor(location.pathname);
  if (target) return <Navigate to={target + location.search + location.hash} replace />;

  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: '#94a3b8' }}>
      <h1 style={{ fontSize: '3rem', margin: 0, color: '#e2e8f0' }}>404</h1>
      <p style={{ marginTop: 12 }}>
        Nothing is routed at <code style={{ color: '#f87171' }}>{location.pathname}</code>.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link to="/" style={{ color: '#a3e635' }}>← Back to Astral Hub</Link>
      </p>
    </div>
  );
}
