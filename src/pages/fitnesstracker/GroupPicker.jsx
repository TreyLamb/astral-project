import { useFitness } from './fitnessContext';
import { resolveGroups, nextGroupNumber, colorForGroupIndex } from './fitnessConfig';

// Pick an existing numbered group (colour shown on the calendar) or create a new
// one. Used both for a single workout's own group field and, with a controlled
// `value`/`onChange` pair, as the bulk-assign action in the calendar's selection bar.
export default function GroupPicker({ value, onChange, label = 'Group' }) {
  const { settings, updateSettings } = useFitness();
  const groups = resolveGroups(settings);

  function createGroup() {
    const number = nextGroupNumber(settings);
    const group = { id: String(number), number, color: colorForGroupIndex(groups.length) };
    updateSettings({ groups: [...groups, group] });
    onChange(group.id);
  }

  return (
    <div className="ft-field">
      {label && <label className="ft-field-label">{label}</label>}
      <div className="ft-group-row">
        <button type="button" className={`ft-group-chip ft-group-none${!value ? ' active' : ''}`} onClick={() => onChange(null)}>None</button>
        {groups.map((g) => {
          const active = value === g.id;
          return (
            <button
              key={g.id} type="button" className={`ft-group-chip${active ? ' active' : ''}`}
              style={{ borderColor: g.color, color: active ? '#0a0e12' : g.color, background: active ? g.color : 'transparent' }}
              onClick={() => onChange(active ? null : g.id)}
            >
              #{g.number}
            </button>
          );
        })}
        <button type="button" className="ft-group-chip ft-group-add" onClick={createGroup} aria-label="New group">+ New</button>
      </div>
    </div>
  );
}
