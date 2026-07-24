import { useEffect, useRef, useState } from 'react';
import { useOrbit } from '../orbitContext';
import './CaptureBar.css';

// Global quick-capture: overlaid at the top (not a modal — no scrim), and
// stays open across submits so "add 5 things in a row" never needs to
// reinvoke it. Every Enter is a plain inbox item (rawText only) — this is
// capture-speed only, triage happens later in TriageView.
export default function CaptureBar({ open, onClose }) {
  const { addInboxItem } = useOrbit();
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);
  const inputRef = useRef(null);

  // Reset the session counter during render when `open` flips false->true —
  // same "compare-and-reset in render" pattern OrbitApp.jsx uses for its nav
  // drawer, so this doesn't cost an extra effect-triggered render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCount(0);
  }

  // Autofocus is a real DOM side effect (not state sync), so it stays a
  // genuine effect, separate from the counter reset above.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return; // never submit empty
    addInboxItem({ rawText: trimmed });
    setText('');
    setCount((c) => c + 1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="orb-capbar-wrap" role="dialog" aria-label="Quick capture">
      <form className="orb-capbar" onSubmit={submit}>
        <span className="orb-capbar-icon" aria-hidden="true">＋</span>
        <input
          ref={inputRef}
          type="text"
          className="orb-capbar-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Capture a thought… Enter to add, Esc to close"
          aria-label="Quick capture text"
        />
        <span className="orb-capbar-count">{count} captured</span>
        <button type="button" className="orb-capbar-close" onClick={onClose} aria-label="Close capture bar">✕</button>
      </form>
    </div>
  );
}
