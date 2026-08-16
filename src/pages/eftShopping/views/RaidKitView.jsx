import { useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, EditableLines } from '../EftBits';

/**
 * Raid kits — the spreadsheet, restored.
 *
 * This started life as an Excel sheet: one row per map, one column per category
 * (pouch / food / meds / optional). The first translation to the web threw that
 * away — it listed every map as a row of buttons, listed them AGAIN as a grid of
 * progress meters, and then showed exactly one map's four categories as four
 * loose cards. Three different shapes for one table, and no way to compare two
 * maps, which is the only reason a table existed in the first place.
 *
 * So there are two modes and they are honest about what they're for:
 *   SHEET — every map × every category, as a grid. What the spreadsheet was.
 *           This is for planning and comparing.
 *   PACK  — one map, big checkboxes, for ticking off while you actually load
 *           your rig. This is for the sixty seconds before you hit Ready.
 *
 * The duplicate map list and its progress meters are gone entirely.
 */

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const COLUMNS = [
  { key: 'pouch', label: 'Pouch', placeholder: 'Add a pouch item…' },
  { key: 'food', label: 'Food / Water', placeholder: 'Add a food or water line…' },
  { key: 'meds', label: 'Meds', placeholder: 'Add a map-specific med…' },
  { key: 'optional', label: 'Optional', placeholder: 'Add an optional item…' },
];

const allLinesFor = (kit, medBaseline) =>
  [...kit.pouch, ...kit.food, ...medBaseline, ...kit.meds, ...kit.optional];

export default function RaidKitView() {
  const { raidKits, medBaseline, raidChecks, update, prefs, setPref } = useEft();

  const [mode, setMode] = useState('sheet');
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

  if (!raidKits.length) {
    return (
      <Panel title="Raid kits">
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
        <div className="eft-empty">No maps yet. Add one above.</div>
      </Panel>
    );
  }

  return (
    <>
      <div className="eft-listbar">
        <div className="eft-seg" role="group" aria-label="View">
          <button
            type="button"
            className={mode === 'sheet' ? 'eft-is-on' : ''}
            onClick={() => setMode('sheet')}
            title="Every map and every category as one grid — the spreadsheet"
          >
            Sheet — all maps
          </button>
        </div>

        {/* Picking a map IS the switch into packing mode. The old pair — a
            "Pack one map" button that then revealed a separate map dropdown —
            made you say the same thing twice to get one screen. */}
        <select
          className="eft-select"
          value={mode === 'pack' ? (selectedId || '') : ''}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) { setMode('sheet'); return; }
            setPref('raidMap', id);
            setMode('pack');
          }}
          title="Pick a map to pack for"
        >
          <option value="">Pack a map…</option>
          {raidKits.map((k) => <option key={k.id} value={k.id}>{k.map}</option>)}
        </select>

        <input
          className="eft-input eft-listbar-search"
          placeholder="New map name…"
          value={newMapName}
          onChange={(e) => setNewMapName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addMap(); }}
        />
        <button type="button" className="eft-btn eft-btn-sm" onClick={addMap}>Add map</button>
      </div>

      {mode === 'sheet' ? (
        <div className="eft-sheetwrap">
          <table className="eft-sheet">
            <thead>
              <tr>
                <th className="eft-sheet-mapcol">Map</th>
                {COLUMNS.map((c) => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {raidKits.map((k) => {
                const p = progressFor(k);
                return (
                  <tr key={k.id} className={k.id === selectedId ? 'eft-is-current' : ''}>
                    <th scope="row" className="eft-sheet-mapcol">
                      <div className="eft-sheet-mapname">
                        {editingId === k.id ? (
                          <>
                            <input className="eft-input" value={editName} autoFocus
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); }} />
                            <button type="button" className="eft-btn eft-btn-sm" onClick={saveRename}>Save</button>
                            <button type="button" className="eft-btn eft-btn-sm" onClick={() => setEditingId(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <span>{k.map}</span>
                            {k.added ? <span className="eft-added-flag">SUGGESTED</span> : null}
                          </>
                        )}
                      </div>
                      {editingId === k.id ? null : (
                        <div className="eft-sheet-maptools">
                          <span className="eft-chip">{p.done}/{p.total} packed</span>
                          <button type="button" className="eft-iconbtn" title="Pack this map"
                            onClick={() => { setPref('raidMap', k.id); setMode('pack'); }}>☑</button>
                          <button type="button" className="eft-iconbtn" title="Rename"
                            onClick={() => startRename(k)}>✎</button>
                          <button type="button" className="eft-iconbtn" title="Delete this map"
                            onClick={() => deleteMap(k.id)}>×</button>
                        </div>
                      )}
                    </th>

                    {COLUMNS.map((c) => (
                      <td key={c.key}>
                        <EditableLines
                          lines={k[c.key]}
                          onChange={(lines) => setKitField(k.id, c.key, lines)}
                          placeholder={c.placeholder}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {mode === 'pack' && kit ? (
        <PackList
          kit={kit}
          medBaseline={medBaseline}
          checks={checksFor(kit.id)}
          onToggle={(line) => toggleCheck(kit.id, line)}
          onReset={() => resetChecks(kit.id)}
          progress={progressFor(kit)}
        />
      ) : null}

      <Panel
        title="Shared med baseline"
        actions={<span className="eft-note">Counts toward every map&apos;s packing list.</span>}
      >
        <EditableLines
          lines={medBaseline}
          onChange={(lines) => update('medBaseline', lines)}
          placeholder="Add a baseline med line…"
        />
      </Panel>
    </>
  );
}

/**
 * The pre-raid checklist. Deliberately not the sheet: here you want big hit
 * targets and one column you can run down, not a grid you have to read across.
 */
function PackList({ kit, medBaseline, checks, onToggle, onReset, progress }) {
  const sections = [
    { label: 'Pouch', lines: kit.pouch },
    { label: 'Food / Water', lines: kit.food },
    { label: 'Meds', lines: [...medBaseline.map((l) => ({ line: l, baseline: true })), ...kit.meds.map((l) => ({ line: l }))] },
    { label: 'Optional', lines: kit.optional },
  ].map((s) => ({
    ...s,
    lines: s.lines.map((l) => (typeof l === 'string' ? { line: l } : l)),
  }));

  const empty = sections.every((s) => !s.lines.length);

  return (
    <Panel
      title={`Packing — ${kit.map}`}
      actions={(
        <>
          <span className="eft-chip eft-is-met">{progress.done}/{progress.total} packed</span>
          <button type="button" className="eft-btn eft-btn-sm" onClick={onReset}>Reset checks</button>
        </>
      )}
    >
      {empty ? (
        <div className="eft-empty">
          Nothing listed for {kit.map} yet — add lines from the sheet view.
        </div>
      ) : (
        <div className="eft-packgrid">
          {sections.map((s) => (
            <section key={s.label} className="eft-packsec">
              <h4>{s.label}</h4>
              {!s.lines.length ? (
                <p className="eft-note">nothing listed</p>
              ) : (
                <ul className="eft-packlist">
                  {s.lines.map(({ line, baseline }, i) => (
                    <li key={`${line}-${i}`} className={checks[line] ? 'eft-is-checked' : ''}>
                      <label>
                        <input type="checkbox" checked={!!checks[line]} onChange={() => onToggle(line)} />
                        <span className="eft-line-text">{line}</span>
                        {baseline ? <span className="eft-chip eft-is-info">baseline</span> : null}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </Panel>
  );
}
