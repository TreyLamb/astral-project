import { useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import {
  stationKey, pendingLevels, buildShoppingList, filterRows, groupRows, traderBeatsFlea,
} from '../eftHideoutLogic';
import { Stat, Seg, Panel, Counter, ItemCell, useItemDetail, fmtRub, fmtShort } from '../EftBits';

export default function ShoppingListView() {
  const {
    stations, items, levels, targets, disabled, inventory, prefs,
    update, setPref, showToast, status, hasPrices,
  } = useEft();

  const [stationFilter, setStationFilter] = useState('');
  const { openItem, detailNode } = useItemDetail();

  const pending = useMemo(
    () => pendingLevels(stations, {
      levels, targets, disabled, scope: prefs.scope, soloStation: prefs.soloStation,
    }),
    [stations, levels, targets, disabled, prefs.scope, prefs.soloStation],
  );

  const { rows, totals } = useMemo(
    () => buildShoppingList(pending, items, inventory),
    [pending, items, inventory],
  );

  const filtered = useMemo(
    () => filterRows(rows, {
      search: prefs.search,
      hideOwned: prefs.hideOwned,
      showFirOnly: prefs.showFirOnly,
      stationKey: stationFilter || null,
    }),
    [rows, prefs.search, prefs.hideOwned, prefs.showFirOnly, stationFilter],
  );

  const groups = useMemo(() => groupRows(filtered, prefs.groupBy), [filtered, prefs.groupBy]);

  const setHave = (itemId, n) =>
    update('inventory', (prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[itemId];
      else next[itemId] = n;
      return next;
    });

  const asText = () => {
    const lines = [`EFT hideout shopping list — ${prefs.scope === 'next' ? 'next level only' : 'everything remaining'}`, ''];
    for (const [title, groupRowsList] of groups) {
      if (groups.length > 1) lines.push(`== ${title} ==`);
      for (const r of groupRowsList) {
        if (r.short === 0) continue;
        lines.push(`${String(r.short).padStart(4)} x ${r.name}${r.fir ? '  (FIR)' : ''}`);
      }
      lines.push('');
    }
    lines.push(`Total: ${fmtRub(totals.cost)} across ${totals.unitsShort} items still needed.`);
    return lines.join('\n');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      showToast('Shopping list copied');
    } catch {
      showToast('Clipboard blocked by the browser');
    }
  };

  const download = () => {
    const blob = new Blob([asText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eft-shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const inScope = stations.filter((s) => {
    const key = stationKey(s);
    return prefs.soloStation ? key === prefs.soloStation : !disabled.includes(key);
  });

  return (
    <>
      <div className="eft-stats">
        <Stat label="Distinct items" value={totals.items} sub={`${totals.complete} fully stocked`} />
        <Stat label="Units still short" value={totals.unitsShort.toLocaleString('en-US')}
          sub={`of ${totals.unitsNeeded.toLocaleString('en-US')} needed`} />
        <Stat label="Cost remaining" value={fmtShort(totals.cost)} tone="gold"
          sub={hasPrices ? 'flea, minus what you own' : 'no prices loaded'} />
        <Stat label="Cost from scratch" value={fmtShort(totals.fullCost)} sub="ignoring your stash" />
        <Stat label="Stocked" value={`${totals.percent}%`}
          tone={totals.percent >= 100 ? 'green' : undefined} />
      </div>

      <Panel
        title="Filters"
        actions={(
          <>
            <button type="button" className="eft-btn eft-btn-sm" onClick={copy}>Copy</button>
            <button type="button" className="eft-btn eft-btn-sm" onClick={download}>Export .txt</button>
            <button type="button" className="eft-btn eft-btn-sm" onClick={() => window.print()}>Print</button>
          </>
        )}
      >
        <div className="eft-controls">
          <div className="eft-field">
            <span className="eft-label">Scope</span>
            <Seg
              value={prefs.scope}
              onChange={(v) => setPref('scope', v)}
              options={[
                { value: 'all', label: 'Everything' },
                { value: 'next', label: 'Next level' },
              ]}
            />
          </div>

          <div className="eft-field">
            <span className="eft-label">Group by</span>
            <Seg
              value={prefs.groupBy}
              onChange={(v) => setPref('groupBy', v)}
              options={[
                { value: 'item', label: 'Item' },
                { value: 'station', label: 'Station' },
                { value: 'category', label: 'Category' },
              ]}
            />
          </div>

          <div className="eft-field">
            <span className="eft-label">Search</span>
            <input
              className="eft-input"
              placeholder="Item name…"
              value={prefs.search}
              onChange={(e) => setPref('search', e.target.value)}
            />
          </div>

          <div className="eft-field">
            <span className="eft-label">Only station</span>
            <select className="eft-select" value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}>
              <option value="">All included</option>
              {inScope.map((s) => (
                <option key={stationKey(s)} value={stationKey(s)}>{s.name}</option>
              ))}
            </select>
          </div>

          <label className="eft-checkline">
            <input type="checkbox" checked={prefs.hideOwned}
              onChange={(e) => setPref('hideOwned', e.target.checked)} />
            Hide what I already have
          </label>

          <label className="eft-checkline">
            <input type="checkbox" checked={prefs.showFirOnly}
              onChange={(e) => setPref('showFirOnly', e.target.checked)} />
            Found-in-raid only
          </label>
        </div>
      </Panel>

      <Panel flush>
        {!filtered.length ? (
          <div className="eft-empty">
            {rows.length ? 'Nothing matches those filters.'
              : !inScope.length ? 'Every station is excluded — turn some back on from the Hideout tab.'
                : 'Nothing to buy — every included station is already at its target level.'}
          </div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="eft-num-cell">Need</th>
                  <th className="eft-num-cell">Have</th>
                  <th className="eft-num-cell">Short</th>
                  <th className="eft-num-cell">Each</th>
                  <th className="eft-num-cell">To buy</th>
                  <th>Wanted by</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([title, groupItems]) => (
                  <GroupBlock
                    key={title}
                    title={groups.length > 1 ? title : null}
                    rows={groupItems}
                    setHave={setHave}
                    openItem={openItem}
                  />
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

function GroupBlock({ title, rows, setHave, openItem }) {
  return (
    <>
      {title ? (
        <tr className="eft-group-row">
          <td colSpan={7}>{title} — {rows.length} item{rows.length === 1 ? '' : 's'}</td>
        </tr>
      ) : null}
      {rows.map((row) => (
        <Row key={`${title || 'all'}-${row.itemId}`} row={row} setHave={setHave} openItem={openItem} />
      ))}
    </>
  );
}

function Row({ row, setHave, openItem }) {
  const trader = traderBeatsFlea(row.item);
  const banned = row.item && !row.item.fleaAvailable;

  return (
    <tr className={row.done ? 'eft-is-done' : ''}>
      <td>
        <ItemCell
          item={row.item}
          itemId={row.itemId}
          onClick={row.item ? () => openItem(row.item) : undefined}
          sub={(
            <span style={{ display: 'inline-flex', gap: 5, flexWrap: 'wrap' }}>
              {row.fir ? <span className="eft-chip eft-is-fir">FIR</span> : null}
              {banned ? <span className="eft-chip eft-is-unmet">No flea</span> : null}
              {trader ? (
                <span className="eft-chip eft-is-info">
                  {trader.vendor} {fmtShort(trader.price)}
                </span>
              ) : null}
            </span>
          )}
        />
      </td>
      <td className="eft-num-cell">{row.needed}</td>
      <td className="eft-num-cell">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, alignItems: 'center' }}>
          <Counter value={row.have} max={row.needed * 4} onChange={(n) => setHave(row.itemId, n)} />
          <button
            type="button"
            className="eft-btn eft-btn-sm"
            title="Mark this item fully collected"
            onClick={() => setHave(row.itemId, row.done ? 0 : row.needed)}
          >
            {row.done ? 'Clear' : 'All'}
          </button>
        </div>
      </td>
      <td className="eft-num-cell" style={{ color: row.short ? 'var(--eft-gold)' : 'var(--eft-green)' }}>
        {row.short}
      </td>
      <td className="eft-num-cell">{row.unitCost ? fmtRub(row.unitCost) : '—'}</td>
      <td className="eft-num-cell">{row.remainingCost ? fmtShort(row.remainingCost) : '—'}</td>
      <td>
        <div className="eft-blockchips">
          {row.sources.map((s, i) => (
            <span key={`${s.stationKey}-${s.level}-${i}`} className="eft-chip">
              {s.stationName} {s.level} · {s.count}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}
