// The Planned/Done switch. One component so QuickAddModal and EntryEditor can't
// disagree about label wording or button order again — they previously rendered
// the same two buttons in opposite orders with different labels.
//
// Order is always Planned (left) → Done (right).
// Once Done is active its label drops entirely and a check pops in its place.
export default function StatusToggle({ value, onChange }) {
  const done = value === 'completed';
  return (
    <div className="ft-status-toggle">
      <button
        type="button"
        className={value === 'planned' ? 'active' : ''}
        onClick={() => onChange('planned')}
      >
        Planned
      </button>
      <button
        type="button"
        className={`ft-status-done${done ? ' active' : ''}`}
        onClick={() => onChange('completed')}
        aria-label="Done"
        title="Done"
      >
        {done ? <span className="ft-status-check" aria-hidden="true">✓</span> : 'Done'}
      </button>
    </div>
  );
}
