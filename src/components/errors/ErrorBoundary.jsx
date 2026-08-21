import { Component } from 'react';
import { notifyError } from './errorNotifier';
import { CRASH } from './errorLog';
import { isChunkLoadError } from './chunkReload';
import ErrorFallback from './ErrorFallback';

// The only class component in this repo, and it has to be: catching a render
// error requires componentDidCatch / getDerivedStateFromError, which have no
// hook equivalent. React has not shipped one and has said it does not intend to.
//
// All three layers of the system are this one component with different props:
//   root   — outside <Router>, survives a crash in Router/AuthProvider/Firebase
//   route  — inside <Router>, keeps the Navbar alive when a page dies
//   panel  — one widget, so a dead panel does not take its page down

// If the same boundary catches more than LOOP_MAX errors inside LOOP_MS, retrying
// is not going to help — a component that throws on mount will throw again the
// instant we remount it. Past that we stay in the fallback and say so, rather
// than spinning between broken and broken.
const LOOP_MAX = 3;
const LOOP_MS = 5000;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      componentStack: '',
      resetKey: props.resetKey,
      recent: [],
      looping: false,
    };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  /**
   * Reset when the route changes.
   *
   * Without this, a crash on /TT would still be showing its error screen after
   * you navigated to /MFT — React boundaries never clear themselves. Doing it
   * here rather than by keying the boundary is deliberate: a `key` change
   * remounts the children, so keying on the path would blow away sub-app state
   * on every in-tool navigation. This only remounts them when we were actually
   * broken.
   *
   * Same render-phase reset pattern Navbar.jsx uses for menuOpenForPath.
   */
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey === state.resetKey) return null;
    return { resetKey: props.resetKey, error: null, componentStack: '', looping: false };
  }

  componentDidCatch(error, info) {
    const now = Date.now();
    const recent = [...this.state.recent, now].filter((t) => now - t < LOOP_MS);

    this.setState({
      componentStack: info?.componentStack ?? '',
      recent,
      looping: recent.length > LOOP_MAX,
    });

    notifyError({
      kind: CRASH,
      error,
      componentStack: info?.componentStack ?? '',
      source: `boundary:${this.props.scope || 'route'}`,
    });

    this.props.onError?.(error, info);
  }

  retry() {
    if (this.state.looping) return;
    this.setState({ error: null, componentStack: '' });
  }

  render() {
    const { error, componentStack, looping } = this.state;
    if (!error) return this.props.children;

    // A panel is allowed to fail small. Passing `compact` renders an inline
    // strip instead of a full screen, so the rest of the page reads normally.
    return (
      <ErrorFallback
        error={error}
        componentStack={componentStack}
        scope={this.props.scope || 'route'}
        compact={!!this.props.compact}
        title={this.props.title}
        route={this.props.resetKey || ''}
        looping={looping}
        stale={isChunkLoadError(error)}
        canRetry={!looping}
        onRetry={this.retry}
      />
    );
  }
}
