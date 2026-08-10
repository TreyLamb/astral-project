import { useState, useMemo } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { newLabel, GAME_KEYWORDS, LABEL_PALETTE } from '../pogofiltersConfig';
import { terms, findUnusedLabels } from '../filterSyntax';

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export default function LabelsView() {
  const { labels, filters, saveLabel, removeLabel, showToast } = usePogoFilters();
  const [editing, setEditing] = useState(null);

  // Which filters mention each label, so a label's real reach is visible rather
  // than assumed.
  const usage = useMemo(() => {
    const map = new Map();
    for (const l of labels) map.set(l.id, []);
    for (const f of filters) {
      const t = terms(f.query).map((x) => norm(x.text));
      for (const l of labels) if (t.includes(norm(l.name))) map.get(l.id).push(f);
    }
    return map;
  }, [labels, filters]);

  const unused = useMemo(() => findUnusedLabels(filters, labels), [filters, labels]);
  const unusedIds = new Set(unused.map((l) => l.id));

  const add = async () => {
    const l = newLabel({ name: 'NewLabel', color: LABEL_PALETTE[labels.length % LABEL_PALETTE.length] });
    await saveLabel(l);
    setEditing({ ...l });
  };

  const commit = async () => {
    if (!editing) return;
    if (GAME_KEYWORDS.has(editing.name.toLowerCase())) {
      showToast(`"${editing.name}" is a built-in game keyword — the game's meaning wins, so this label would be unreachable by name. Rename it (xxlandxxs is the reference example).`, 'error');
      return;
    }
    await saveLabel(editing);
    setEditing(null);
    showToast('Label saved');
  };

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <span className="pgf-h" style={{ margin: 0 }}>{labels.length} labels</span>
        {unused.length > 0 && (
          <span className="pgf-chip warn on" title={unused.map((l) => l.name).join(', ')}>
            {unused.length} referenced by no filter
          </span>
        )}
        <span className="pgf-spacer" />
        <button className="pgf-btn pgf-btn-primary" onClick={add}>+ New label</button>
      </div>

      <div className="pgf-panel">
        <table className="pgf-table">
          <thead>
            <tr>
              <th style={{ width: 200 }}>Label</th>
              <th style={{ width: 70 }}>Colour</th>
              <th style={{ width: 80 }}>Filters</th>
              <th>Notes</th>
              <th style={{ width: 150 }}>Used in</th>
              <th style={{ width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {labels.map((l) => {
              const used = usage.get(l.id) || [];
              const isEditing = editing?.id === l.id;
              return (
                <tr key={l.id}>
                  <td>
                    {isEditing ? (
                      <input
                        className="pgf-input" style={{ width: '100%' }}
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      />
                    ) : (
                      <span className="pgf-lab" style={{ '--lc': l.color }}>{l.name}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="color" value={editing.color}
                        onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-block', width: 20, height: 20, borderRadius: 5,
                        background: l.color, border: '1px solid rgba(255,255,255,.2)',
                      }} />
                    )}
                  </td>
                  <td>
                    <span className={unusedIds.has(l.id) ? 'pgf-lint-badge pgf-lint-warning' : ''}>
                      {used.length}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="pgf-input" style={{ width: '100%' }}
                        value={editing.notes}
                        placeholder="What this label is for"
                        onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                      />
                    ) : (
                      <span className="pgf-muted">{l.notes || '—'}</span>
                    )}
                  </td>
                  <td className="pgf-muted" title={used.map((f) => f.name).join('\n')}>
                    {used.slice(0, 2).map((f) => f.name).join(', ')}
                    {used.length > 2 ? ` +${used.length - 2}` : ''}
                    {used.length === 0 ? '—' : ''}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isEditing ? (
                      <>
                        <button className="pgf-btn pgf-btn-sm" onClick={() => setEditing(null)}>Cancel</button>{' '}
                        <button className="pgf-btn pgf-btn-sm pgf-btn-primary" onClick={commit}>Save</button>
                      </>
                    ) : (
                      <>
                        <button className="pgf-btn pgf-btn-sm" onClick={() => setEditing({ ...l })}>Edit</button>{' '}
                        <button className="pgf-btn pgf-btn-sm pgf-btn-danger" onClick={() => removeLabel(l.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="pgf-sub" style={{ marginTop: 14 }}>
        A label must never be named after a built-in game keyword — the game's meaning always wins,
        so the label becomes unreachable by that name. Renaming <code>XxL</code> to
        <code> xxlandxxs</code> is the reference example. Saving a colliding name is blocked.
      </p>
    </div>
  );
}
