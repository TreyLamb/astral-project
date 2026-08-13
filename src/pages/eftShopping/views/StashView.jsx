import { useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import { maxLevelOf, currentLevelOf, unitCost } from '../eftHideoutLogic';
import { Stat, Panel, Counter, ItemCell, Seg, useItemDetail, fmtRub, fmtShort } from '../EftBits';

// The stash view deliberately ignores the shopping list's scope filters: you
// log what you own when you find it, which is often long before you have
// decided whether that station is in the plan.
export default function StashView() {
  const { stations, items, levels, inventory, update, showToast } = useEft();

  const [search, setSearch] = useState('');
  const [show, setShow] = useState('needed');
  const { openItem, detailNode } = useItemDetail();

  const rows = useMemo(() => {
    const byItem = new Map();

    for (const station of stations) {
      const current = currentLevelOf(station, levels);
      const max = maxLevelOf(station);
      for (const lv of station.levels) {
        for (const req of lv.itemRequirements) {
          if (!req.itemId) continue;
          let row = byItem.get(req.itemId);
          if (!row) {
            row = {
              itemId: req.itemId,
              item: items[req.itemId] || null,
              totalEver: 0,
              stillNeeded: 0,
              wantedBy: new Set(),
              fir: false,
            };
            byItem.set(req.itemId, row);
          }
          row.totalEver += req.count;
          if (lv.level > current && lv.level <= max) row.stillNeeded += req.count;
          row.wantedBy.add(station.name);
          row.fir = row.fir || !!req.foundInRaid;
        }
      }
    }

    // Anything logged that no station wants any more still deserves a row —
    // otherwise the count silently vanishes from the UI while staying in
    // storage, which looks like data loss.
    for (const itemId of Object.keys(inventory)) {
      if (byItem.has(itemId)) continue;
      byItem.set(itemId, {
        itemId, item: items[itemId] || null, totalEver: 0, stillNeeded: 0,
        wantedBy: new Set(), fir: false,
      });
    }

    return [...byItem.values()]
      .map((r) => {
        const have = Number(inventory[r.itemId] ?? 0);
        return {
          ...r,
          wantedBy: [...r.wantedBy],
          have,
          short: Math.max(0, r.stillNeeded - have),
          value: have * unitCost(r.item),
          name: r.item?.name || r.itemId,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stations, items, levels, inventory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (show === 'needed' && r.stillNeeded === 0) return false;
      if (show === 'owned' && r.have === 0) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, show]);

  const owned = rows.filter((r) => r.have > 0);
  const stashValue = owned.reduce((n, r) => n + r.value, 0);

  const setHave = (itemId, n) =>
    update('inventory', (prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[itemId];
      else next[itemId] = n;
      return next;
    });

  return (
    <>
      <div className="eft-stats">
        <Stat label="Item types logged" value={owned.length} />
        <Stat label="Units held" value={owned.reduce((n, r) => n + r.have, 0).toLocaleString('en-US')} />
        <Stat label="Stash value" value={fmtShort(stashValue)} tone="gold"
          sub="hideout materials only" />
        <Stat label="Types still short" value={rows.filter((r) => r.short > 0).length} />
      </div>

      <Panel
        title="Hideout materials on hand"
        actions={(
          <button
            type="button"
            className="eft-btn eft-btn-sm eft-is-danger"
            onClick={() => { update('inventory', {}); showToast('Stash counts cleared'); }}
          >
            Clear all counts
          </button>
        )}
      >
        <div className="eft-controls">
          <div className="eft-field">
            <span className="eft-label">Show</span>
            <Seg
              value={show}
              onChange={setShow}
              options={[
                { value: 'needed', label: 'Still needed' },
                { value: 'owned', label: 'I have some' },
                { value: 'all', label: 'Every material' },
              ]}
            />
          </div>
          <div className="eft-field">
            <span className="eft-label">Search</span>
            <input className="eft-input" placeholder="Item name…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </Panel>

      <Panel flush>
        {!filtered.length ? (
          <div className="eft-empty">Nothing matches.</div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="eft-num-cell">Have</th>
                  <th className="eft-num-cell">Still needed</th>
                  <th className="eft-num-cell">Short</th>
                  <th className="eft-num-cell">Each</th>
                  <th className="eft-num-cell">Held value</th>
                  <th>Used by</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.itemId} className={row.stillNeeded && !row.short ? 'eft-is-done' : ''}>
                    <td>
                      <ItemCell
                        item={row.item}
                        itemId={row.itemId}
                        onClick={row.item ? () => openItem(row.item) : undefined}
                        sub={row.fir ? <span className="eft-chip eft-is-fir">FIR</span> : null}
                      />
                    </td>
                    <td className="eft-num-cell">
                      <Counter value={row.have} onChange={(n) => setHave(row.itemId, n)} />
                    </td>
                    <td className="eft-num-cell">{row.stillNeeded || '—'}</td>
                    <td className="eft-num-cell"
                      style={{ color: row.short ? 'var(--eft-gold)' : 'var(--eft-green)' }}>
                      {row.stillNeeded ? row.short : '—'}
                    </td>
                    <td className="eft-num-cell">{unitCost(row.item) ? fmtRub(unitCost(row.item)) : '—'}</td>
                    <td className="eft-num-cell">{row.value ? fmtShort(row.value) : '—'}</td>
                    <td>
                      <div className="eft-blockchips">
                        {row.wantedBy.slice(0, 3).map((n) => (
                          <span key={n} className="eft-chip">{n}</span>
                        ))}
                        {row.wantedBy.length > 3 ? (
                          <span className="eft-chip">+{row.wantedBy.length - 3}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {detailNode}
    </>
  );
}
