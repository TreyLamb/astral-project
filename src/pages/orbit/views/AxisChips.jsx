import { useState, useRef, useEffect } from 'react';
import './AxisChips.css';

// Order is also the auto-advance order.
const AXES = [
  { key: 'importance', letter: 'I', label: 'Importance' },
  { key: 'urgency',    letter: 'U', label: 'Urgency' },
  { key: 'difficulty', letter: 'D', label: 'Difficulty' },
  { key: 'energy',     letter: 'E', label: 'Energy' },
];

// Optional trailing squares, same footprint as an axis chip but plain on/off
// (no 1-5 popup) — diagonal label so a one-word name fits a 39px square.
const TOGGLES = [
  { key: 'isThought', label: 'thought' },
  { key: 'isProject', label: 'project' },
];

// Four one-letter squares on a single row. Tapping one opens a 1-5 column
// headed by the axis's full name; picking a number closes it and immediately
// opens the next axis that still has no value, cycling from wherever you
// started, until all four are set.
//
// Values are null until chosen (NOT pre-filled with 3) — otherwise "advance
// until all four have a value" has nothing to advance through, and a default
// is indistinguishable from a deliberate 3.
//
// `toggles` is optional — pass { isThought, isProject, onToggle } to append
// the Thought/Project on-off squares after the four scoring chips. Callers
// that don't pass it (e.g. TriageView's existing-task rescoring flow) just
// get the original four.
//
// `variant="cards"` (Triage only — scoring is that screen's whole point, so
// the axes shouldn't look like a secondary row copied from Add Task) renders
// each axis as a full-width labeled row of 5 always-visible buttons instead
// of a small square that opens a popup. Thought/Project stay the small
// squares in both variants — only the 4 scoring axes get bigger.
export default function AxisChips({ axes, onChange, toggles, variant = 'chips' }) {
  const [openKey, setOpenKey] = useState(null);
  const wrapRef = useRef(null);

  // Click-out and Escape both just close, WITHOUT advancing — a misclick into
  // a chip must be escapable, not a commitment to walk all four popups.
  useEffect(() => {
    if (!openKey) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpenKey(null); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setOpenKey(null); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openKey]);

  const pick = (key, n) => {
    onChange(key, n);
    // Rotate the list so it starts just after the axis just set. That excludes
    // it, so reading the stale `axes` for the rest is still correct.
    const start = AXES.findIndex((a) => a.key === key);
    const rotated = [...AXES.slice(start + 1), ...AXES.slice(0, start)];
    const next = rotated.find((a) => axes[a.key] == null);
    setOpenKey(next ? next.key : null);
  };

  const toggleSquares = toggles && TOGGLES.map((t) => {
    const on = !!toggles[t.key];
    return (
      <button
        key={t.key}
        type="button"
        className={`orb-axc-chip orb-axc-toggle${on ? ' on' : ''}`}
        onClick={() => toggles.onToggle(t.key, !on)}
        aria-pressed={on}
        aria-label={`${t.label}${on ? ' — on' : ' — off'}`}
        title={t.label}
      >
        <span className="orb-axc-toggle-word">{t.label}</span>
      </button>
    );
  });

  if (variant === 'cards') {
    return (
      <div className="orb-axc-cards">
        {AXES.map((a) => {
          const val = axes[a.key];
          return (
            <div className="orb-axc-card" key={a.key}>
              <div className="orb-axc-card-label">{a.label}</div>
              <div className="orb-axc-card-row" role="radiogroup" aria-label={a.label}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={val === n}
                    className={`orb-axc-card-btn${val === n ? ' active' : ''}`}
                    onClick={() => onChange(a.key, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {toggleSquares && <div className="orb-axc-cards-toggles">{toggleSquares}</div>}
      </div>
    );
  }

  return (
    <div className="orb-axc" ref={wrapRef}>
      {AXES.map((a) => {
        const val = axes[a.key];
        const open = openKey === a.key;
        return (
          <div className="orb-axc-slot" key={a.key}>
            <button
              type="button"
              className={`orb-axc-chip${val == null ? ' unset' : ''}${open ? ' open' : ''}`}
              onClick={() => setOpenKey(open ? null : a.key)}
              aria-expanded={open}
              aria-label={val == null ? `${a.label} — not set` : `${a.label}: ${val} of 5`}
              title={a.label}
            >
              <span className="orb-axc-letter">{a.letter}</span>
              <span className="orb-axc-val">{val ?? '·'}</span>
            </button>

            {open && (
              <div className="orb-axc-pop" role="dialog" aria-label={a.label}>
                <div className="orb-axc-pop-title">{a.label}</div>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`orb-axc-num${val === n ? ' active' : ''}`}
                    onClick={() => pick(a.key, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {toggleSquares}
    </div>
  );
}
