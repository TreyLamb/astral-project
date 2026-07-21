// A plain <input> with a one-tap "✕" to reset it — for optional fields that can
// get accidentally filled (shorthand parse, template apply, fat-fingering on
// mobile) with no easy way back to empty besides manually selecting the text.
export default function ClearableInput({ value, onChange, onClear, className = 'ft-input', ...props }) {
  return (
    <div className="ft-input-clearable">
      <input className={className} value={value} onChange={onChange} {...props} />
      {value !== '' && value != null && (
        <button type="button" className="ft-input-clear" onClick={onClear} aria-label="Clear field" tabIndex={-1}>✕</button>
      )}
    </div>
  );
}
