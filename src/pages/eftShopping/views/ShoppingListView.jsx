import { useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import {
  stationKey, pendingLevels, buildShoppingList, filterRows, groupRows, traderBeatsFlea,
} from '../eftHideoutLogic';
import { Seg, Panel, Counter, ItemCell, useItemDetail, fmtRub, fmtShort } from '../EftBits';
import { itemIcon } from '../eftApi';
import { BuildOrderPanels } from './BuildOrderView';
import MyListPanels from './MyListPanels';

/**
 * The shopping list page.
 *
 * MY LIST is the default and the main event: a list the user builds by hand,
 * one item at a time, because that is the thing you actually carry into a raid.
 * The other three modes are all *derived* from the hideout targets — useful,
 * but nobody can add a row to them.
 *
 * RAID GRID is picture-and-quantity, for having open on a second screen
 * mid-raid: you get about a second to answer "do I grab this?", and a
 * seven-column table of costs and trader prices is unreadable in that second.
 *
 * FULL DETAIL keeps the old table — it is the only place costs,
 * trader-beats-flea and per-station attribution are visible. BUILD ORDER is
 * folded in as a mode so "what do I need NOW" and "what is coming up" live
 * behind one toggle instead of two tabs.
 */

const MODES = [
  { value: 'mine', label: 'My list', title: 'The list you build yourself — the main event' },
  { value: 'grid', label: 'Raid grid', title: 'Pictures and quantities — for glancing at mid-raid' },
  { value: 'table', label: 'Full detail', title: 'Costs, traders and which station wants what' },
  { value: 'order', label: 'Build order', title: 'What to build next, and in what order' },
];

const SIZES = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
];

export default function ShoppingListView() {
  const {
    stations, items, levels, targets, disabled, inventory, prefs,
    update, setPref, showToast,
  } = useEft();

  const [stationFilter, setStationFilter] = useState('');
  const { openItem, detailNode } = useItemDetail();

  const mode = prefs.listMode || 'mine';
  const size = prefs.tileSize || 'md';

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

  // In the grid, what you still owe comes first and anything already covered
  // sinks — the opposite of alphabetical, which buries the thing you need.
  const tiles = useMemo(
    () => [...filtered].sort((a, b) => Number(a.done) - Number(b.done)
      || b.short - a.short
      || a.name.localeCompare(b.name)),
    [filtered],
  );

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

  const outstanding = filtered.filter((r) => !r.done).length;

  return (
    <>
      {/* One bar, always visible, whatever the mode. In raid this is the only
          thing you interact with, so it stays short and never scrolls away. */}
      <div className="eft-listbar">
        <Seg value={mode} onChange={(v) => setPref('listMode', v)} options={MODES} />

        <Seg
          value={prefs.scope}
          onChange={(v) => setPref('scope', v)}
          options={[
            { value: 'next', label: 'Need now', title: 'Only what each station’s very next level wants' },
            { value: 'all', label: 'Everything', title: 'Every level up to each station’s target' },
          ]}
        />

        {mode === 'grid' ? (
          <>
            <input
              className="eft-input eft-listbar-search"
              placeholder="Filter items…"
              value={prefs.search}
              onChange={(e) => setPref('search', e.target.value)}
            />
            <label className="eft-checkline">
              <input type="checkbox" checked={prefs.hideOwned}
                onChange={(e) => setPref('hideOwned', e.target.checked)} />
              Hide done
            </label>
            <label className="eft-checkline">
              <input type="checkbox" checked={prefs.showFirOnly}
                onChange={(e) => setPref('showFirOnly', e.target.checked)} />
              FIR only
            </label>
            <Seg value={size} onChange={(v) => setPref('tileSize', v)} options={SIZES} />
            <span className="eft-listbar-count">
              <strong>{outstanding}</strong> still needed
            </span>
          </>
        ) : null}
      </div>

      {mode === 'mine' ? (
        <>
          <MyListPanels />
          <HideoutList rows={rows} setHave={setHave} openItem={openItem} />
        </>
      ) : null}

      {mode === 'order' ? <BuildOrderPanels /> : null}

      {mode === 'grid' ? (
        !tiles.length ? (
          <div className="eft-empty">
            {rows.length ? 'Nothing matches those filters.'
              : !inScope.length ? 'Every station is excluded — turn some back on from the Hideout tab.'
                : 'Nothing to buy — every included station is already at its target level.'}
          </div>
        ) : (
          <div className={`eft-tilegrid eft-size-${size}`}>
            {tiles.map((row) => (
              <Tile
                key={row.itemId}
                row={row}
                setHave={setHave}
                onOpen={row.item ? () => openItem(row.item) : undefined}
              />
            ))}
          </div>
        )
      ) : null}

      {mode === 'table' ? (
        <>
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
        </>
      ) : null}

      {detailNode}
    </>
  );
}

/**
 * One item, as a raid glance: picture, name, and the number that matters.
 *
 * The hero number is what you are still SHORT, not the total requirement —
 * standing over a loot pile, "4 more" is the answer; "4 of 12" is arithmetic.
 * The full have/need stays underneath as the aside.
 */
function Tile({ row, setHave, onOpen }) {
  const trader = traderBeatsFlea(row.item);

  return (
    <div className={`eft-tile${row.done ? ' eft-is-done' : ''}`}>
      <button
        type="button"
        className="eft-tile-pic"
        onClick={onOpen}
        title={onOpen ? `${row.name} — open details` : row.name}
      >
        <img
          src={itemIcon(row.itemId)}
          alt=""
          loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
        <span className="eft-tile-qty">{row.done ? '✓' : row.short}</span>
        {row.fir ? <span className="eft-tile-fir">FIR</span> : null}
      </button>

      <div className="eft-tile-name" title={row.name}>{row.name}</div>

      <div className="eft-tile-count">
        <span className="eft-tile-have">{row.have}/{row.needed}</span>
        <Counter value={row.have} max={row.needed * 4} onChange={(n) => setHave(row.itemId, n)} />
      </div>

      <button
        type="button"
        className="eft-tile-all"
        onClick={() => setHave(row.itemId, row.done ? 0 : row.needed)}
      >
        {row.done ? 'Clear' : 'Got it all'}
      </button>

      {/* Asides. Present, but visually subordinate to the picture and count. */}
      <div className="eft-tile-aside">
        {trader ? <span className="eft-chip eft-is-info">{trader.vendor} {fmtShort(trader.price)}</span> : null}
        {row.item && !row.item.fleaAvailable ? <span className="eft-chip eft-is-unmet">No flea</span> : null}
        {row.sources.slice(0, 3).map((s, i) => (
          <span key={`${s.stationKey}-${s.level}-${i}`} className="eft-chip" title={`${s.stationName} level ${s.level} wants ${s.count}`}>
            {s.stationName} {s.level}
          </span>
        ))}
        {row.sources.length > 3 ? <span className="eft-chip">+{row.sources.length - 3}</span> : null}
      </div>
    </div>
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

/**
 * The derived hideout list, as one flat run of rows at the bottom of the page.
 *
 * On the station question: showing every station that wants an item is what
 * made the old table's last column a wall of chips, and hiding it entirely
 * loses the one thing you'd want to know. So the middle ground — one station
 * gets named outright, several collapse to "3 stations" with the full list in
 * the tooltip. The common case reads at a glance and the messy case never
 * takes more than one chip's worth of room.
 */
function HideoutList({ rows, setHave, openItem }) {
  const [openOnly, setOpenOnly] = useState(true);

  const shown = useMemo(() => {
    const list = openOnly ? rows.filter((r) => !r.done) : rows;
    return [...list].sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name));
  }, [rows, openOnly]);

  return (
    <section className="eft-panel eft-hideoutlist">
      <header className="eft-panel-head">
        <h2>Hideout shopping list</h2>
        <div className="eft-spacer" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="eft-note">everything your station targets still need</span>
          <label className="eft-checkline">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
            Hide what I have
          </label>
          <span className="eft-chip eft-is-met">{rows.filter((r) => r.done).length}/{rows.length} got</span>
        </div>
      </header>

      <div className="eft-panel-body">
        {!shown.length ? (
          <div className="eft-empty">
            {rows.length ? 'Everything on the hideout list is covered.' : 'Nothing outstanding — set some station targets on the Hideout tab.'}
          </div>
        ) : (
          <ul className="eft-llist">
            <li className="eft-hrow eft-lrow-head">
              <span className="eft-lrow-item">Item</span>
              <span className="eft-hrow-need">Need</span>
              <span className="eft-lrow-count">Have</span>
              <span className="eft-hrow-for">For</span>
            </li>
            {shown.map((row) => {
              const stations = [...new Set(row.sources.map((s) => s.stationName))];
              return (
                <li key={row.itemId} className={`eft-hrow${row.done ? ' eft-is-done' : ''}`}>
                  <div className="eft-lrow-item">
                    <img className="eft-lrow-icon" src={itemIcon(row.itemId)} alt="" loading="lazy"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                    <button type="button" className="eft-hrow-name" title={row.name}
                      onClick={row.item ? () => openItem(row.item) : undefined}>
                      {row.name}
                    </button>
                    {row.fir ? <span className="eft-chip eft-is-fir">FIR</span> : null}
                  </div>

                  <span className="eft-hrow-need">{row.needed}</span>

                  <div className="eft-lrow-count">
                    <Counter value={row.have} max={row.needed * 4} onChange={(n) => setHave(row.itemId, n)} />
                  </div>

                  <span className="eft-hrow-for">
                    {stations.length === 1 ? (
                      <span className="eft-chip">{stations[0]}</span>
                    ) : (
                      <span className="eft-chip" title={row.sources.map((s) => `${s.stationName} level ${s.level} — ${s.count}`).join('\n')}>
                        {stations.length} stations
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
