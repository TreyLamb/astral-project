import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, ItemCell, fmtRub } from '../EftBits';

// Mirrors the game's own armour-class colour bands, not an arbitrary scale.
function penClass(p) {
  if (p == null) return 'eft-pen-2';
  if (p >= 50) return 'eft-pen-6';
  if (p >= 40) return 'eft-pen-5';
  if (p >= 30) return 'eft-pen-4';
  if (p >= 20) return 'eft-pen-3';
  return 'eft-pen-2';
}

function matchesText(q, ...vals) {
  if (!q) return true;
  return vals.some((v) => (v || '').toString().toLowerCase().includes(q));
}

function fleaPriceOf(round, items) {
  const item = items[round.itemId];
  return item?.fleaBuy?.price ?? item?.avg24hPrice ?? null;
}

function sortValue(round, key, items) {
  if (key === 'name') return items[round.itemId]?.name || '';
  if (key === 'flea') return fleaPriceOf(round, items) ?? -Infinity;
  return round[key] ?? -Infinity;
}

/** Free-text notes rendered with the game's starred-note look, editable inline. */
function NoteLines({ lines, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...(lines || []), text]);
    setDraft('');
  };
  return (
    <div>
      {(lines || []).map((line, i) => (
        <div key={`${line}-${i}`} className="eft-note" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
          <span className="eft-note-star">★</span>
          <span style={{ flex: 1 }}>{line}</span>
          <button
            type="button"
            className="eft-iconbtn"
            onClick={() => onChange(lines.filter((_, n) => n !== i))}
            aria-label="Remove note"
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
        <input
          className="eft-input"
          style={{ flex: 1, minWidth: 0 }}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button type="button" className="eft-btn eft-btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}

function SortTh({ label, sortKey, sort, setSort }) {
  const active = sort.key === sortKey;
  return (
    <th
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => setSort((s) => ({
        key: sortKey,
        dir: s.key === sortKey && s.dir === 'desc' ? 'asc' : 'desc',
      }))}
    >
      {label}{active ? (sort.dir === 'desc' ? ' ▼' : ' ▲') : ''}
    </th>
  );
}

function CaliberCard({
  caliber: c, rounds, hasLiveData, items, query, sort, setSort, onPatch, onRemove,
}) {
  const filteredRounds = query ? rounds.filter((r) => matchesText(query, items[r.itemId]?.name)) : rounds;

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filteredRounds].sort((a, b) => {
      const av = sortValue(a, sort.key, items);
      const bv = sortValue(b, sort.key, items);
      if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * dir;
      return (av - bv) * dir;
    });
  }, [filteredRounds, sort, items]);

  return (
    <div className="eft-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <input
          className="eft-input"
          style={{ flex: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          value={c.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <button type="button" className="eft-iconbtn" onClick={onRemove} aria-label={`Remove ${c.name}`}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
        <span className="eft-label" style={{ flex: 'none' }}>api caliber</span>
        <input
          className="eft-input eft-num-sm"
          style={{ width: 130 }}
          value={c.apiCaliber || ''}
          placeholder="e.g. 9x19PARA"
          onChange={(e) => onPatch({ apiCaliber: e.target.value })}
        />
        <input
          className="eft-input"
          style={{ flex: 1, minWidth: 0 }}
          value={c.role || ''}
          placeholder="Role (optional)"
          onChange={(e) => onPatch({ role: e.target.value })}
        />
      </div>

      <div className="eft-ammo-tier" style={{ marginTop: 10 }}>
        <span className="eft-tier-label eft-tier-best">Best</span>
        <input className="eft-input eft-tier-value" value={c.best || ''} onChange={(e) => onPatch({ best: e.target.value })} />
        <span className="eft-tier-label eft-tier-garbage">Garbage</span>
        <input className="eft-input eft-tier-value" value={c.garbage || ''} onChange={(e) => onPatch({ garbage: e.target.value })} />
        <span className="eft-tier-label eft-tier-else">Else</span>
        <input className="eft-input eft-tier-value" value={c.other || ''} onChange={(e) => onPatch({ other: e.target.value })} />
      </div>

      <textarea
        className="eft-textarea"
        style={{ marginTop: 8, minHeight: 40 }}
        value={c.note || ''}
        placeholder="Note…"
        onChange={(e) => onPatch({ note: e.target.value })}
      />

      <div style={{ marginTop: 10 }}>
        {!hasLiveData ? (
          <div className="eft-note">Live ballistics need the tarkov.dev API.</div>
        ) : !c.apiCaliber ? (
          <div className="eft-note">No API caliber set — add one above to pull live rounds.</div>
        ) : !rounds.length ? (
          <div className="eft-note">No live rounds found for &ldquo;{c.apiCaliber}&rdquo;.</div>
        ) : (
          <>
            <div className="eft-tablewrap">
              <table className="eft-table">
                <thead>
                  <tr>
                    <SortTh label="Round" sortKey="name" sort={sort} setSort={setSort} />
                    <SortTh label="Dmg" sortKey="damage" sort={sort} setSort={setSort} />
                    <SortTh label="Pen" sortKey="penetrationPower" sort={sort} setSort={setSort} />
                    <SortTh label="Armor" sortKey="armorDamage" sort={sort} setSort={setSort} />
                    <SortTh label="Flea" sortKey="flea" sort={sort} setSort={setSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.itemId}>
                      <td><ItemCell item={items[r.itemId]} itemId={r.itemId} /></td>
                      <td className="eft-num-cell">{r.damage ?? '—'}</td>
                      <td className="eft-num-cell">
                        <span className={`eft-pen ${penClass(r.penetrationPower)}`}>{r.penetrationPower ?? '—'}</span>
                      </td>
                      <td className="eft-num-cell">{r.armorDamage ?? '—'}</td>
                      <td className="eft-num-cell">{fmtRub(fleaPriceOf(r, items))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {query && !filteredRounds.length ? (
              <div className="eft-note" style={{ marginTop: 6 }}>No rounds match &ldquo;{query}&rdquo;.</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function AmmoView() {
  const {
    ammo, ammoNotes, ammoStats, items, update,
  } = useEft();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'penetrationPower', dir: 'desc' });

  const roundsByCaliber = useMemo(() => {
    const map = {};
    for (const s of ammoStats) {
      if (!s.caliber) continue;
      (map[s.caliber] ||= []).push(s);
    }
    return map;
  }, [ammoStats]);

  const q = query.trim().toLowerCase();
  const hasLiveData = !!ammoStats.length;

  const patchGroup = (groupId, patch) => update('ammo', (prev) => prev.map((g) => (g.id !== groupId ? g : { ...g, ...patch })));
  const patchCaliber = (groupId, caliberId, patch) => update('ammo', (prev) => prev.map((g) => (
    g.id !== groupId ? g : { ...g, calibers: g.calibers.map((c) => (c.id !== caliberId ? c : { ...c, ...patch })) }
  )));
  const addGroup = () => update('ammo', (prev) => [...prev, { id: `grp-${Date.now()}`, title: 'New group', calibers: [] }]);
  const removeGroup = (groupId) => update('ammo', (prev) => prev.filter((g) => g.id !== groupId));
  const addCaliber = (groupId) => update('ammo', (prev) => prev.map((g) => (g.id !== groupId ? g : {
    ...g,
    calibers: [...g.calibers, {
      id: `cal-${Date.now()}`, name: 'New caliber', apiCaliber: '', note: '', best: '', garbage: '', other: '',
    }],
  })));
  const removeCaliber = (groupId, caliberId) => update('ammo', (prev) => prev.map((g) => (g.id !== groupId ? g : {
    ...g, calibers: g.calibers.filter((c) => c.id !== caliberId),
  })));

  return (
    <>
      <Panel title="Ammo Notes">
        <NoteLines lines={ammoNotes} onChange={(lines) => update('ammoNotes', lines)} placeholder="Add a general note…" />
      </Panel>

      <div className="eft-controls" style={{ marginBottom: 12 }}>
        <div className="eft-field">
          <label htmlFor="ammo-search">Search</label>
          <input
            id="ammo-search"
            className="eft-input"
            style={{ minWidth: 220 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caliber, role, or round name…"
          />
        </div>
        <button type="button" className="eft-btn eft-btn-sm" onClick={addGroup}>+ Group</button>
      </div>

      {!hasLiveData ? (
        <div className="eft-banner">
          <strong>Live ballistics unavailable.</strong> Showing the game-file snapshot —
          only your written tiers are shown until the tarkov.dev API is reachable.
        </div>
      ) : null}

      {ammo.map((group) => {
        const calibers = group.calibers.filter((c) => {
          if (!q) return true;
          const rounds = roundsByCaliber[c.apiCaliber] || [];
          return matchesText(q, c.name, c.apiCaliber, c.role, c.note, c.best, c.garbage, c.other)
            || rounds.some((r) => matchesText(q, items[r.itemId]?.name));
        });
        if (q && !calibers.length) return null;
        return (
          <Panel
            key={group.id}
            title={(
              <input
                className="eft-input"
                style={{ minWidth: 160 }}
                value={group.title}
                onChange={(e) => patchGroup(group.id, { title: e.target.value })}
              />
            )}
            actions={(
              <>
                <button type="button" className="eft-btn eft-btn-sm" onClick={() => addCaliber(group.id)}>+ Caliber</button>
                <button type="button" className="eft-btn eft-btn-sm eft-is-danger" onClick={() => removeGroup(group.id)}>Remove group</button>
              </>
            )}
          >
            <NoteLines
              lines={group.notes || []}
              onChange={(lines) => patchGroup(group.id, { notes: lines })}
              placeholder="Add a group note…"
            />
            <div className="eft-ammo-grid" style={{ marginTop: 12 }}>
              {calibers.map((c) => (
                <CaliberCard
                  key={c.id}
                  caliber={c}
                  query={q}
                  rounds={roundsByCaliber[c.apiCaliber] || []}
                  hasLiveData={hasLiveData}
                  items={items}
                  sort={sort}
                  setSort={setSort}
                  onPatch={(patch) => patchCaliber(group.id, c.id, patch)}
                  onRemove={() => removeCaliber(group.id, c.id)}
                />
              ))}
              {!calibers.length ? <div className="eft-empty">No calibers yet.</div> : null}
            </div>
          </Panel>
        );
      })}

      {q && !ammo.some((g) => g.calibers.some((c) => matchesText(q, c.name, c.apiCaliber, c.role, c.note, c.best, c.garbage, c.other)
        || (roundsByCaliber[c.apiCaliber] || []).some((r) => matchesText(q, items[r.itemId]?.name)))) ? (
        <div className="eft-empty">Nothing matches &ldquo;{query}&rdquo;.</div>
      ) : null}
    </>
  );
}
