import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

/**
 * Wrap one panel so a dead widget does not take its page down.
 *
 *   <Boundary title="The map stopped working."><MapView /></Boundary>
 *
 * Renders an inline strip in place of the panel, leaving the rest of the page
 * usable. `resetId` is optional — pass something that changes when the panel's
 * inputs change (a map key, a tab id) and the panel gets a fresh attempt when
 * you switch to different data.
 */
export function Boundary({ children, title, resetId = 'panel', scope = 'panel' }) {
  return (
    <ErrorBoundary compact scope={scope} title={title} resetKey={resetId}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * The route-level boundary. Wraps the whole <Routes> block, so a page or
 * sub-app crash still leaves the Navbar and the URL bar working.
 *
 * `resetKey` is the pathname, which is what clears the error when you navigate
 * away — see the long note in ErrorBoundary.getDerivedStateFromProps for why
 * this is a prop rather than a `key`.
 */
export function RouteBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary scope="route" resetKey={pathname}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * The outermost net. Lives OUTSIDE <Router> in main.jsx, so it still catches a
 * crash in Router, AuthProvider or Firebase init — the cases where every other
 * layer is already gone. Nothing inside its fallback may touch router context.
 */
export function RootBoundary({ children }) {
  return (
    <ErrorBoundary scope="root" resetKey="root">
      {children}
    </ErrorBoundary>
  );
}

export default Boundary;
