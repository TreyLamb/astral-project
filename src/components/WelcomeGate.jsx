import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './WelcomeGate.css';

// One-time — whichever choice you make gets remembered here and this never
// shows again, even across sign-out later. Only relevant to guest visitors;
// anyone already signed in (or if Firebase isn't configured at all) skips it.
const DISMISS_KEY = 'astral_welcome_choice_v1';

export default function WelcomeGate() {
  const { user, firebaseReady, signIn } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const [signingIn, setSigningIn] = useState(false);

  const visible = !dismissed && firebaseReady && user === null;

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
          Sign in once to sync TheKnowledgeBase and PGO Tracker across your devices,
          or continue as a guest — everything still works, it just stays on this device.
        </p>
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
