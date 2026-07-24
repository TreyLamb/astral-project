import { DEFAULT_TASK_TYPES } from '../orbitConfig';

// Sentinel for "no taskType set" — distinct from `null` (which means "no
// filter, show everything") so callers can tell the three states apart.
// Hung off the component itself (not a named export) so this file keeps a
// single default export — see react-refresh/only-export-components, same
// reason orbitContext.js splits state out of the component file.
const UNTYPED = '__untyped__';

// Reusable task-type filter: renders taskTypes as selectable chips plus All
// and Untyped. Purely a controlled input (value/onChange live in the
// parent) — never touches useOrbit itself, so it can drop into any view
// that filters tasks by type. Falls back to DEFAULT_TASK_TYPES if the
// caller passes an empty list, so it never renders with nothing to pick.
function TaskTypeFilter({ taskTypes, value, onChange }) {
  const types = taskTypes && taskTypes.length ? taskTypes : DEFAULT_TASK_TYPES;

  return (
    <div className="orb-type-filter" role="group" aria-label="Filter by task type">
      <button
        type="button"
        className={`orb-chip orb-type-chip${value == null ? ' active' : ''}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      <button
        type="button"
        className={`orb-chip orb-type-chip${value === UNTYPED ? ' active' : ''}`}
        onClick={() => onChange(UNTYPED)}
      >
        Untyped
      </button>
      {types.map((t) => (
        <button
          key={t}
          type="button"
          className={`orb-chip orb-type-chip${value === t ? ' active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

TaskTypeFilter.UNTYPED = UNTYPED;

export default TaskTypeFilter;
