import { useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, Bar, Stat, EditableLines } from '../EftBits';

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const allLinesFor = (kit, medBaseline) => [...kit.pouch, ...kit.food, ...medBaseline, ...kit.meds, ...kit.optional];

export default function RaidKitView() {
  const { raidKits, medBaseline, raidChecks, update, prefs, setPref } = useEft();

  const [newMapName, setNewMapName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const selectedId = raidKits.some((k) => k.id === prefs.raidMap) ? prefs.raidMap : raidKits[0]?.id;
  const kit = raidKits.find((k) => k.id === selectedId);

  const checksFor = (kitId) => raidChecks[kitId] || {};

  const toggleCheck = (kitId, line) => {
    update('raidChecks', (prev) => ({
      ...prev,
      [kitId]: { ...(prev[kitId] || {}), [line]: !prev[kitId]?.[line] },
    }));
  };

  const setKitField = (kitId, field, lines) => {
    update('raidKits', (prev) => prev.map((k) => (k.id === kitId ? { ...k, [field]: lines } : k)));
  };

  const progressFor = (k) => {
    const lines = allLinesFor(k, medBaseline);
    const checks = checksFor(k.id);
    return { done: lines.filter((line) => checks[line]).length, total: lines.length };
  };

  const resetChecks = (kitId) => update('raidChecks', (prev) => ({ ...prev, [kitId]: {} }));

  const addMap = () => {
    const name = newMapName.trim();
    if (!name) return;
    const base = slugify(name) || `map-${Date.now()}`;
    let id = base;
    let n = 2;
    while (raidKits.some((k) => k.id === id)) id = `${base}-${n++}`;
    update('raidKits', (prev) => [...prev, { id, map: name, pouch: [], food: [], meds: [], optional: [] }]);
    setPref('raidMap', id);
    setNewMapName('');
  };

  const startRename = (k) => { setEditingId(k.id); setEditName(k.map); };

  const saveRename = () => {
    const name = editName.trim();
    if (name) update('raidKits', (prev) => prev.map((k) => (k.id === editingId ? { ...k, map: name } : k)));
    setEditingId(null);
  };

  const deleteMap = (id) => {
    if (!window.confirm('Delete this map’s raid kit? This cannot be undone.')) return;
    const remaining = raidKits.filter((k) => k.id !== id);
    update('raidKits', remaining);
    update('raidChecks', (prev) => { const next = { ...prev }; delete next[id]; return next; });
    if (selectedId === id) setPref('raidMap', remaining[0]?.id || null);
  };

  const addForm = (
    <div className="eft-controls">
      <input
        className="eft-input"
        placeholder="New map name…"
        value={newMapName}
        onChange={(e) => setNewMapName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') addMap(); }}
      />
      <button type="button" className="eft-btn eft-btn-sm" onClick={addMap}>Add map</button>
    </div>
  );

  if (!kit) {
    return (
      <Panel title="Raid Kit — Maps" actions={addForm}>
        <div className="eft-empty">No maps yet. Add one above.</div>
      </Panel>
    );
  }

  const { done, total } = progressFor(kit);
  const pct = total ? (done / total) * 100 : 0;

  return (
    <>
      <Panel title="Map" actions={addForm}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {raidKits.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`eft-btn eft-btn-sm${k.id === selectedId ? ' eft-is-on' : ''}`}
              onClick={() => setPref('raidMap', k.id)}
            >
              {k.map}
              {k.added ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>SUGGESTED</span> : null}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="All Maps — Packing Progress">
        <div className="eft-cols">
          {raidKits.map((k) => {
            const p = progressFor(k);
            const kPct = p.total ? (p.done / p.total) * 100 : 0;
            return (
              <div
                key={k.id}
                className="eft-card"
                role="button"
                tabIndex={0}
                onClick={() => setPref('raidMap', k.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setPref('raidMap', k.id); }}
                style={{ cursor: 'pointer', borderColor: k.id === selectedId ? 'var(--eft-gold)' : undefined }}
              >
                <h4>
                  {k.map}
                  {k.added ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>SUGGESTED</span> : null}
                </h4>
                <Bar percent={kPct} />
                <div className="eft-stat-sub" style={{ marginTop: 6 }}>{p.done}/{p.total} packed</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title={(
          <>
            {kit.map}
            {kit.added ? <span className="eft-added-flag" style={{ marginLeft: 8 }}>SUGGESTED</span> : null}
          </>
        )}
        actions={editingId === kit.id ? (
          <>
            <input className="eft-input" value={editName} onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); }} autoFocus />
            <button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={saveRename}>Save</button>
            <button type="button" className="eft-btn eft-btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
          </>
        ) : (
          <>
            <button type="button" className="eft-btn eft-btn-sm" onClick={() => startRename(kit)}>Rename</button>
            <button type="button" className="eft-btn eft-btn-sm eft-is-danger" onClick={() => deleteMap(kit.id)}>Delete</button>
            <button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={() => resetChecks(kit.id)}>Reset checks</button>
          </>
        )}
      >
        <div className="eft-label">Packed {done}/{total}</div>
        <div style={{ marginTop: 8, marginBottom: 6 }}><Bar percent={pct} /></div>

        <div className="eft-cols" style={{ marginTop: 14 }}>
          <div className="eft-card">
            <h4>Pouch</h4>
            <EditableLines
              lines={kit.pouch}
              onChange={(lines) => setKitField(kit.id, 'pouch', lines)}
              checks={checksFor(kit.id)}
              onToggleCheck={(line) => toggleCheck(kit.id, line)}
              placeholder="Add a pouch item…"
            />
          </div>

          <div className="eft-card">
            <h4>Food</h4>
            <EditableLines
              lines={kit.food}
              onChange={(lines) => setKitField(kit.id, 'food', lines)}
              checks={checksFor(kit.id)}
              onToggleCheck={(line) => toggleCheck(kit.id, line)}
              placeholder="Add a food/water line…"
            />
          </div>

          <div className="eft-card">
            <h4>Meds</h4>
            <ul className="eft-linelist">
              {medBaseline.map((line, i) => (
                <li key={`base-${line}-${i}`} className={checksFor(kit.id)[line] ? 'eft-is-checked' : ''}>
                  <input
                    type="checkbox"
                    checked={!!checksFor(kit.id)[line]}
                    onChange={() => toggleCheck(kit.id, line)}
                    aria-label={line}
                  />
                  <span className="eft-line-text">{line}</span>
                  <span className="eft-chip eft-is-info">BASELINE</span>
                </li>
              ))}
              {!medBaseline.length ? <li style={{ color: 'var(--eft-text-faint)', fontSize: 12 }}>no shared baseline set</li> : null}
            </ul>
            <EditableLines
              lines={kit.meds}
              onChange={(lines) => setKitField(kit.id, 'meds', lines)}
              checks={checksFor(kit.id)}
              onToggleCheck={(line) => toggleCheck(kit.id, line)}
              placeholder="Add a map-specific med…"
            />
          </div>

          <div className="eft-card">
            <h4>Optional</h4>
            <EditableLines
              lines={kit.optional}
              onChange={(lines) => setKitField(kit.id, 'optional', lines)}
              checks={checksFor(kit.id)}
              onToggleCheck={(line) => toggleCheck(kit.id, line)}
              placeholder="Add an optional item…"
            />
          </div>
        </div>
      </Panel>

      <Panel title="Shared Med Baseline" actions={<span className="eft-note">Applies to every map&apos;s Meds section above.</span>}>
        <EditableLines
          lines={medBaseline}
          onChange={(lines) => update('medBaseline', lines)}
          placeholder="Add a baseline med line…"
        />
      </Panel>
    </>
  );
}
