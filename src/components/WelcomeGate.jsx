import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './WelcomeGate.css';

// One-time — whichever choice you make gets remembered here and this never
// shows again, even across sign-out later. Only relevant to guest visitors;
// anyone already signed in (or if Firebase isn't configured at all) skips it.
const DISMISS_KEY = 'astral_welcome_choice_v1';

export default function WelcomeGate() {
  const { user, authSettled, signInFailed, signInErrorDetail, diagLog, firebaseReady, signIn } = useAuth();
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [signingIn, setSigningIn] = useState(false);

  // authSettled, not just `user === null` — a bare null is also what you get
  // mid-redirect and from AuthContext's 6s bail-out, and showing this modal on
  // those made it flash up and vanish a moment later.
  const visible = !dismissed && firebaseReady && user === null && authSettled;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  async function handleSignIn() {
    setSigningIn(true);
    const result = await signIn();
    setSigningIn(false);
    if (result.ok) dismiss();
    // On failure, leave the modal open — they can retry or pick guest instead.
  }

  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="wg-overlay" onClick={dismiss}>
      <div className="wg-card" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome to Astral Journey</h2>
        <p>
          Sign in once to sync TheKnowledgeBase and POGO Tracker across your devices,
          or continue as a guest — everything still works, it just stays on this device.
        </p>
        {/* Without this, a failed round trip just drops you back on the same
            button with no explanation, so it reads as an infinite loop. */}
        {signInFailed && (
          <div className="wg-error">
            <strong>Sign-in didn&apos;t complete.</strong>{' '}
            {standalone
              ? 'Home Screen apps get their own storage, and this browser is blocking the step that carries the session back. Open the site in Safari instead for now.'
              : 'Your browser blocked the step that carries the session back from Google. In Safari: Settings → Safari → turn off "Prevent Cross-Site Tracking", then try again.'}{' '}
            Guest mode works fine in the meantime — nothing is lost, it just stays on this device.
            {signInErrorDetail && (
              <div style={{ marginTop: '0.5em', fontFamily: 'monospace', fontSize: '0.8em', opacity: 0.8 }}>
                {signInErrorDetail}
              </div>
            )}
          </div>
        )}
        {/* Temporary full step-by-step trace (2026-07-30) for the Safari/iOS
            redirect-loop bug — remove once that's confirmed fixed. Shown any
            time there's a trace at all, not just on signInFailed, since
            whether signInFailed itself fires correctly is part of what's
            being diagnosed. sessionStorage-backed in AuthContext so this
            survives the full-page navigation to Google and back. */}
        {diagLog.length > 0 && (
          <details className="wg-diag" open>
            <summary>Diagnostic trace ({diagLog.length} steps) — tap to copy/screenshot</summary>
            <pre className="wg-diag-log">{diagLog.join('\n')}</pre>
          </details>
        )}
        <div className="wg-actions">
          <button className="wg-btn wg-btn-primary" onClick={handleSignIn} disabled={signingIn}>
            {signingIn ? 'Signing in…' : 'Sign in with Google'}
          </button>
          <button className="wg-btn wg-btn-secondary" onClick={dismiss}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
