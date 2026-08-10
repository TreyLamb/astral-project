import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePogoAccs } from './pogoaccsContext';
import { buildSpeciesIndex, displayName } from './parse/speciesIndex';
import { MEGA_LEVEL_MAX } from './pogoaccsConfig';
import megasJson from './data/megas.json';
import speciesData from './data/species.json';

// species/megas/raidBosses ship wrapped as { _meta, <key>: [...] } (see
// engine/stats.js's identical accessor pattern) — tolerate a bare array too
// in case a fixture ever ships unwrapped.
const megasData = megasJson.megas || megasJson;

function MegaCellEditor({ cell, onSave, onCancel }) {
  const [count, setCount] = useState(cell?.count ?? 0);
  const [megaLevel, setMegaLevel] = useState(cell?.megaLevel ?? 0);

  const save = () => {
    onSave({
      count: Math.max(0, parseInt(count, 10) || 0),
      megaLevel: Math.min(MEGA_LEVEL_MAX, Math.max(0, parseInt(megaLevel, 10) || 0)),
    });
  };

  return (
    <div className="pgoa-mega-editor">
      <label>
        Count
        <input
          className="pgoa-input"
          type="number"
          min="0"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        Mega Lv
        <input
          className="pgoa-input"
          type="number"
          min="0"
          max={MEGA_LEVEL_MAX}
          value={megaLevel}
          onChange={(e) => setMegaLevel(e.target.value)}
        />
      </label>
      <div className="pgoa-mega-editor-actions">
        <button className="pgoa-btn pgoa-btn-primary" onClick={save}>Save</button>
        <button className="pgoa-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function MegaMatrix() {
  const { accounts, megas, actions, loading } = usePogoAccs();
  const [editingCell, setEditingCell] = useState(null); // { accountId, megaId } | null

  const speciesIndex = useMemo(() => buildSpeciesIndex(speciesData.species), []);

  if (loading) {
    return <div className="pgoa-panel pgoa-loading">Loading…</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="pgoa-panel pgoa-empty">
        No accounts yet — create them in <Link className="pgoa-link" to="/POGO">POGO Tracker</Link>.
      </div>
    );
  }

  const saveCell = (accountId, megaId, nextCell) => {
    actions.setMegaCell(accountId, megaId, nextCell);
    setEditingCell(null);
  };

  return (
    <div className="pgoa-panel">
      <div className="pgoa-section-label">Mega Matrix</div>
      <div className="pgoa-table-wrap">
        <table className="pgoa-table">
          <thead>
            <tr>
              <th>Pokémon</th>
              {accounts.map((account) => (
                <th key={account.id}>{account.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {megasData.map((mega) => (
              <tr key={mega.id} className="pgoa-row">
                <td>{displayName(speciesIndex, mega.id)}</td>
                {accounts.map((account) => {
                  const cell = megas[account.id]?.megas?.[mega.id];
                  const hasValue = !!cell && cell.count > 0;
                  const isEditing = editingCell?.accountId === account.id && editingCell?.megaId === mega.id;

                  return (
                    <td key={account.id} className="pgoa-mega-td">
                      {isEditing ? (
                        <MegaCellEditor
                          cell={cell}
                          onSave={(nextCell) => saveCell(account.id, mega.id, nextCell)}
                          onCancel={() => setEditingCell(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          className={`pgoa-mega-cell${hasValue ? ' pgoa-mega-cell-filled' : ''}`}
                          onClick={() => setEditingCell({ accountId: account.id, megaId: mega.id })}
                        >
                          {hasValue ? `×${cell.count} · ML${cell.megaLevel}` : '—'}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
