// Shared "hidden until tapped" field wrapper — Area and Parent pickers are
// rarely changed once set, so they default to a compact button showing the
// live value; one tap swaps it for the real control in place. Caller owns
// the open/closed state (per-field, not shared across fields on a screen).
export default function CollapsedField({ label, valueLabel, open, onOpen, children }) {
  if (open) {
    return (
      <label className="orb-collapsed-field">
        <span>{label}</span>
        {children}
      </label>
    );
  }
  return (
    <button type="button" className="orb-collapsed-field-toggle" onClick={onOpen} aria-expanded={false}>
      <span>{label}</span>
      <strong>{valueLabel}</strong>
      <span aria-hidden="true">▾</span>
    </button>
  );
}
