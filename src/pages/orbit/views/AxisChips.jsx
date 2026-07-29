import { useState, useRef, useEffect } from 'react';
import './AxisChips.css';

// Order is also the auto-advance order.
const AXES = [
  { key: 'importance', letter: 'I', label: 'Importance' },
  { key: 'urgency',    letter: 'U', label: 'Urgency' },
  { key: 'difficulty', letter: 'D', label: 'Difficulty' },
  { key: 'energy',     letter: 'E', label: 'Energy' },
];

// Four one-letter squares on a single row. Tapping one opens a 1-5 column
// headed by the axis's full name; picking a number closes it and immediately
// opens the next axis that still has no value, cycling from wherever you
// started, until all four are set.
//
// Values are null until chosen (NOT pre-filled with 3) — otherwise "advance
// until all four have a value" has nothing to advance through, and a default
// is indistinguishable from a deliberate 3.
export default function AxisChips({ axes, onChange }) {
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
    </div>
  );
}
