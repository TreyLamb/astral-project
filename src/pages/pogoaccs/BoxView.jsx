import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePogoAccs } from './pogoaccsContext';
import { buildSpeciesIndex, displayName } from './parse/speciesIndex';
import { parsePokemonLine } from './parse/lineParser';
import speciesData from './data/species.json';

function summarize(entry) {
  const parts = [];
  if (entry.level != null) parts.push(`Lv ${entry.level}`);
  if (entry.cp != null) parts.push(`CP ${entry.cp}`);
  if (entry.ivs) parts.push(`${entry.ivs.atk}/${entry.ivs.def}/${entry.ivs.sta}`);
  if (entry.isShadow) parts.push('Shadow');
  if (entry.isPurified) parts.push('Purified');
  if (entry.isBestBuddy) parts.push('Best Buddy');
  if (entry.canMega) parts.push(entry.megaLevel > 0 ? `Mega Lv ${entry.megaLevel}` : 'Can Mega');
  if (entry.notes) parts.push(entry.notes);
  return parts.length ? parts.join(' · ') : '—';
}

function EditRow({ entry, speciesIndex, onSave, onCancel }) {
  const [count, setCount] = useState(entry.count);
  const [level, setLevel] = useState(entry.level ?? '');
  const [cp, setCp] = useState(entry.cp ?? '');
  const [notes, setNotes] = useState(entry.notes ?? '');

  const save = () => {
    onSave({
      ...entry,
      count: Math.max(1, parseInt(count, 10) || 1),
      level: level === '' ? null : parseFloat(level),
      cp: cp === '' ? null : parseInt(cp, 10),
      notes,
    });
  };

  return (
    <tr className="pgoa-row">
      <td>{displayName(speciesIndex, entry.speciesId)}</td>
      <td>
        <input className="pgoa-input" type="number" min="1" value={count}
          onChange={(e) => setCount(e.target.value)} style={{ width: '4rem' }} />
      </td>
      <td>
        <input className="pgoa-input" type="number" placeholder="level" value={level}
          onChange={(e) => setLevel(e.target.value)} style={{ width: '5rem', marginRight: '0.5rem' }} />
        <input className="pgoa-input" type="number" placeholder="CP" value={cp}
          onChange={(e) => setCp(e.target.value)} style={{ width: '5rem', marginRight: '0.5rem' }} />
        <input className="pgoa-input" placeholder="notes" value={notes}
          onChange={(e) => setNotes(e.target.value)} style={{ width: '8rem' }} />
      </td>
      <td>
        <button className="pgoa-btn pgoa-btn-primary" onClick={save}>Save</button>{' '}
        <button className="pgoa-btn" onClick={onCancel}>Cancel</button>
      </td>
    </tr>
  );
}

export default function BoxView() {
  const { accountId } = useParams();
  const { accounts, boxes, actions, loading } = usePogoAccs();
  const [quickAdd, setQuickAdd] = useState('');
  const [parseError, setParseError] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const speciesIndex = useMemo(() => buildSpeciesIndex(speciesData.species), []);

  if (loading) {
    return <div className="pgoa-panel pgoa-loading">Loading…</div>;
  }

  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    return (
      <div className="pgoa-panel pgoa-empty">
        Unknown account. <Link className="pgoa-link" to="/POGO-ACCS">Back to Overview</Link>
      </div>
    );
  }

  const entries = boxes[accountId]?.entries || [];

  const submitQuickAdd = () => {
    const line = quickAdd.trim();
    if (!line) return;
    const result = parsePokemonLine(line, speciesIndex);

    if (result.error) {
      setParseError(`Couldn't match a Pokémon in "${line}"`);
      return;
    }

    setParseError(null);
    const added = result.splitEntries || [result.entry];
    actions.addEntries(accountId, added);

    const name = displayName(speciesIndex, added[0].speciesId);
    const qty = added.reduce((sum, e) => sum + e.count, 0);
    setConfirmMsg(`Added ${qty}× ${name}${added[0].level != null ? ` (Lv ${added[0].level})` : ''}`);
    setQuickAdd('');
    setTimeout(() => setConfirmMsg(null), 2500);
  };

  const deleteEntry = (id) => {
    actions.setBoxEntries(accountId, entries.filter((e) => e.id !== id));
  };

  const saveEntry = (updated) => {
    actions.setBoxEntries(accountId, entries.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
  };

  return (
    <div className="pgoa-panel pgoa-panel-accent">
      <div className="pgoa-section-label">{account.name} — Pokébox</div>
      <Link className="pgoa-link" to="/POGO-ACCS">← Overview</Link>

      <div className="pgoa-quickadd" style={{ margin: '1.25rem 0' }}>
        <input
          className="pgoa-input"
          placeholder='e.g. "6 machamps around lvl 20" or "1 rayquaza 13/15/15 best buddy can mega mega lvl 2"'
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitQuickAdd()}
          style={{ width: '100%', maxWidth: '32rem' }}
        />{' '}
        <button className="pgoa-btn pgoa-btn-primary" onClick={submitQuickAdd}>Add</button>
        {parseError && <p className="pgoa-parse-error">{parseError}</p>}
        {confirmMsg && <p className="pgoa-confirm-flash">{confirmMsg}</p>}
      </div>

      {entries.length === 0 ? (
        <div className="pgoa-empty">No Pokémon yet — use quick-add above to get started.</div>
      ) : (
        <div className="pgoa-table-wrap">
          <table className="pgoa-table">
            <thead>
              <tr><th>Pokémon</th><th>Qty</th><th>Details</th><th /></tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                editingId === entry.id ? (
                  <EditRow key={entry.id} entry={entry} speciesIndex={speciesIndex} onSave={saveEntry} onCancel={() => setEditingId(null)} />
                ) : (
                  <tr key={entry.id} className="pgoa-row">
                    <td>{displayName(speciesIndex, entry.speciesId)}</td>
                    <td>×{entry.count}</td>
                    <td>{summarize(entry)}</td>
                    <td>
                      <button className="pgoa-btn" onClick={() => setEditingId(entry.id)}>Edit</button>{' '}
                      <button className="pgoa-btn" onClick={() => deleteEntry(entry.id)}>Delete</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
