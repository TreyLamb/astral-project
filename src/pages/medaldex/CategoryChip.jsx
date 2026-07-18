// Shared by DexView (grid) and SpeciesDetail (detail header) -- a single
// category toggle chip that renders three distinct states: on/off (normal
// feasible category), disabled-with-reason (confirmed infeasible, e.g. no
// Mega released), and unknown (feasibility not yet known -- rendered
// distinctly per the build brief's "never fake data" rule rather than
// looking either checked-off or definitively unavailable).
import { feasibilityReason } from './medaldexEngine';

export default function CategoryChip({ category, feasible, checked, onToggle }) {
  const disabled = feasible === false;
  const unknown = feasible === null;
  const cls = [
    'mdx-chip',
    checked ? 'mdx-chip-on' : '',
    disabled ? 'mdx-chip-disabled' : '',
    unknown ? 'mdx-chip-unknown' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      title={feasibilityReason(category.key, feasible) || category.label}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
    >
      <span className="mdx-chip-icon">{category.icon}</span>
      <span className="mdx-chip-label">{category.label}</span>
      {unknown && <span className="mdx-chip-q">?</span>}
    </button>
  );
}
