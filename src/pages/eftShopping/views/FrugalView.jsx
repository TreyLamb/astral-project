import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, ItemCell } from '../EftBits';

function matches(q, ...vals) {
  if (!q) return true;
  return vals.some((v) => (v || '').toString().toLowerCase().includes(q));
}

export default function FrugalView() {
  const {
    frugal, medNotes, stations, items, update, showToast,
  } = useEft();
  const [derivedQuery, setDerivedQuery] = useState('');

  const patchFrugal = (id, patch) => update('frugal', (prev) => prev.map((r) => (r.id !== id ? r : { ...r, ...patch })));
  const addFrugal = () => update('frugal', (prev) => [...prev, {
    id: `f-${Date.now()}`, item: '', makes: '', rule: '', extra: '',
  }]);
  const removeFrugal = (id) => update('frugal', (prev) => prev.filter((r) => r.id !== id));

  const patchMedNote = (id, patch) => update('medNotes', (prev) => prev.map((r) => (r.id !== id ? r : { ...r, ...patch })));
  const addMedNote = () => update('medNotes', (prev) => [...prev, { id: `m-${Date.now()}`, label: '', text: '' }]);
  const removeMedNote = (id) => update('medNotes', (prev) => prev.filter((r) => r.id !== id));

  // Reverse index: ingredient item -> which live crafts consume it and what
  // they produce. This is the always-current counterpart to the hand-written
  // `frugal` list above, not a replacement for it.
  const reverseIndex = useMemo(() => {
    const map = new Map();
    let anyCrafts = false;
    for (const st of stations) {
      for (const cr of st.crafts || []) {
        anyCrafts = true;
        const rewardNames = cr.rewardItems.map((rw) => rw.name);
        for (const req of cr.requiredItems) {
          if (!map.has(req.itemId)) map.set(req.itemId, { itemId: req.itemId, name: req.name, crafts: [] });
          map.get(req.itemId).crafts.push({ stationName: st.name, level: cr.level, rewardNames });
        }
      }
    }
    const rows = [...map.values()].sort((a, b) => b.crafts.length - a.crafts.length);
    return { anyCrafts, rows };
  }, [stations]);

  const dq = derivedQuery.trim().toLowerCase();
  const filteredDerived = useMemo(() => reverseIndex.rows.filter(
    (row) => matches(dq, items[row.itemId]?.name, row.name),
  ), [reverseIndex.rows, items, dq]);

  const promote = (row, makes) => {
    update('frugal', (prev) => [...prev, {
      id: `f-${Date.now()}`, item: items[row.itemId]?.name || row.name, makes: makes.join(', '), rule: '', extra: '',
    }]);
    showToast(`Added "${items[row.itemId]?.name || row.name}" to your frugal list — fill in the rule.`);
  };

  return (
    <>
      <Panel
        title="Being Frugal — keep / don't-use reference"
        actions={<button type="button" className="eft-btn eft-btn-sm" onClick={addFrugal}>+ Row</button>}
      >
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr>
                <th>Item</th>
                <th />
                <th>Makes</th>
                <th>Rule</th>
                <th>Extra</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {frugal.map((row) => {
                const flagged = /don'?t use/i.test(row.rule || '');
                return (
                  <tr key={row.id} style={flagged ? { background: 'rgba(224, 192, 122, 0.06)' } : undefined}>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: '100%' }}
                        value={row.item}
                        placeholder="Item"
                        onChange={(e) => patchFrugal(row.id, { item: e.target.value })}
                      />
                    </td>
                    <td style={{ color: 'var(--eft-text-faint)', fontSize: 11, whiteSpace: 'nowrap' }}>is an ingredient in</td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: '100%' }}
                        value={row.makes}
                        placeholder="Makes"
                        onChange={(e) => patchFrugal(row.id, { makes: e.target.value })}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="eft-input"
                          style={{ flex: 1, minWidth: 120 }}
                          value={row.rule}
                          placeholder="Rule"
                          onChange={(e) => patchFrugal(row.id, { rule: e.target.value })}
                        />
                        {flagged ? <span className="eft-chip eft-is-fir">don&apos;t burn</span> : null}
                      </div>
                    </td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: '100%' }}
                        value={row.extra}
                        placeholder="Extra"
                        onChange={(e) => patchFrugal(row.id, { extra: e.target.value })}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="eft-iconbtn"
                        onClick={() => removeFrugal(row.id)}
                        aria-label={`Remove ${row.item || 'row'}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!frugal.length ? <tr><td colSpan={6} className="eft-empty">Nothing yet — add a row.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Medstation Notes"
        actions={<button type="button" className="eft-btn eft-btn-sm" onClick={addMedNote}>+ Note</button>}
      >
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead><tr><th>Label</th><th>Note</th><th /></tr></thead>
            <tbody>
              {medNotes.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      className="eft-input"
                      style={{ width: '100%' }}
                      value={row.label}
                      placeholder="Label"
                      onChange={(e) => patchMedNote(row.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="eft-input"
                      style={{ width: '100%' }}
                      value={row.text}
                      placeholder="Note text"
                      onChange={(e) => patchMedNote(row.id, { text: e.target.value })}
                    />
                  </td>
                  <td>
                    <button type="button" className="eft-iconbtn" onClick={() => removeMedNote(row.id)} aria-label="Remove note">×</button>
                  </td>
                </tr>
              ))}
              {!medNotes.length ? <tr><td colSpan={3} className="eft-empty">Nothing yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="What is this used for? (auto, from live crafts)"
        actions={(
          <input
            className="eft-input"
            style={{ minWidth: 200 }}
            value={derivedQuery}
            placeholder="Filter ingredient…"
            onChange={(e) => setDerivedQuery(e.target.value)}
          />
        )}
      >
        {!reverseIndex.anyCrafts ? (
          <div className="eft-empty">
            No craft data available right now (the offline snapshot strips crafts) — this list needs the live tarkov.dev API.
          </div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead><tr><th>Ingredient</th><th># Crafts</th><th>Makes</th><th /></tr></thead>
              <tbody>
                {filteredDerived.map((row) => {
                  const makes = [...new Set(row.crafts.flatMap((c) => c.rewardNames))];
                  return (
                    <tr key={row.itemId}>
                      <td><ItemCell item={items[row.itemId]} itemId={row.itemId} /></td>
                      <td className="eft-num-cell">{row.crafts.length}</td>
                      <td>{makes.join(', ') || '—'}</td>
                      <td>
                        <button type="button" className="eft-btn eft-btn-sm" onClick={() => promote(row, makes)}>
                          + Frugal list
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!filteredDerived.length ? <tr><td colSpan={4} className="eft-empty">No matches.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
