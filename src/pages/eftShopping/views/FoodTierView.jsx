// "Food/Slot" — rebuild of the sheet's hand-ranked food/drink price-per-slot
// tier list. Live mode recomputes the ranking from current flea prices;
// My Sheet keeps his original hand-entered rows as the offline record.

import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import {
  Panel, Stat, Seg, ItemCell, fmtRub,
} from '../EftBits';
import { itemImage } from '../eftApi';

function bestMatch(items, match) {
  const q = (match || '').trim().toLowerCase();
  if (!q) return null;
  let best = null;
  for (const it of Object.values(items)) {
    if (it.name && it.name.toLowerCase().includes(q)) {
      if (!best || it.name.length < best.name.length) best = it;
    }
  }
  return best;
}

const perSlot = (n, slots) => (n == null || !slots ? null : n / slots);
const fmtNum = (n) => (n == null ? '—' : n.toFixed(1));

function ItemDetailModal({ item, onClose }) {
  if (!item) return null;
  const slots = item.slots ?? (item.width || 1) * (item.height || 1);
  return (
    <div className="eft-modal-back" onClick={onClose}>
      <div className="eft-modal" onClick={(e) => e.stopPropagation()}>
        <header className="eft-panel-head">
          <h2>{item.name}</h2>
          <button type="button" className="eft-btn eft-btn-sm eft-spacer" onClick={onClose}>Close</button>
        </header>
        <div className="eft-panel-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <img
            src={itemImage(item.id)}
            alt=""
            style={{
              width: 128, height: 128, objectFit: 'contain', flex: 'none',
              background: '#24211d', border: '1px solid var(--eft-line-bright)',
            }}
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          />
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div>Flea buy: {fmtRub(item.fleaBuy?.price ?? item.avg24hPrice)}</div>
            <div>
              Trader buy: {item.bestTraderBuy
                ? `${fmtRub(item.bestTraderBuy.price)} (${item.bestTraderBuy.vendor})` : '—'}
            </div>
            <div>Slots: {item.width}×{item.height} ({slots})</div>
            {item.fleaAvailable === false ? (
              <div className="eft-chip eft-is-unmet" style={{ width: 'fit-content' }}>Flea-banned</div>
            ) : null}
            {item.wikiLink ? (
              <a className="eft-btn eft-btn-sm" href={item.wikiLink} target="_blank" rel="noreferrer" style={{ width: 'fit-content' }}>
                Wiki ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const SORTS = {
  price: { label: '₽ / Slot', key: (r) => r.pricePerSlot },
  energy: { label: 'Energy / Slot', key: (r) => r.energyPerSlot },
  hydration: { label: 'Hydration / Slot', key: (r) => r.hydrationPerSlot },
};

function sortByMetric(rows, sort) {
  const key = SORTS[sort]?.key || SORTS.price.key;
  return [...rows].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return bv - av;
  });
}

export default function FoodTierView() {
  const {
    provisions, items, foodTier, update, status, hasPrices,
  } = useEft();
  const [mode, setMode] = useState('live');
  const [sort, setSort] = useState('price');
  const [detailItem, setDetailItem] = useState(null);

  const liveRows = useMemo(() => provisions
    .map((p) => {
      const item = items[p.itemId];
      if (!item) return null;
      const price = item.fleaBuy?.price ?? item.avg24hPrice ?? item.lastLowPrice ?? null;
      const slots = item.slots || (item.width || 1) * (item.height || 1) || 1;
      return {
        item,
        energy: p.energy,
        hydration: p.hydration,
        slots,
        price,
        pricePerSlot: perSlot(price, slots),
        energyPerSlot: perSlot(p.energy, slots),
        hydrationPerSlot: perSlot(p.hydration, slots),
      };
    })
    .filter(Boolean), [provisions, items]);

  const sortedLive = useMemo(() => sortByMetric(liveRows, sort), [liveRows, sort]);

  const sheetRows = useMemo(() => foodTier.map((row, idx) => {
    const item = bestMatch(items, row.match);
    const pricePerSlot = perSlot(row.price, row.slots);
    return {
      idx, row, item, pricePerSlot,
    };
  }), [foodTier, items]);

  const sortedSheet = useMemo(() => [...sheetRows].sort((a, b) => {
    if (a.pricePerSlot == null && b.pricePerSlot == null) return 0;
    if (a.pricePerSlot == null) return 1;
    if (b.pricePerSlot == null) return -1;
    return b.pricePerSlot - a.pricePerSlot;
  }), [sheetRows]);

  const showSheet = mode === 'sheet' || liveRows.length === 0;

  const patchSheetRow = (idx, patch) => {
    update('foodTier', (list) => list.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const deleteSheetRow = (idx) => update('foodTier', (list) => list.filter((_, i) => i !== idx));
  const addSheetRow = () => update('foodTier', (list) => [...list, {
    name: 'New item', match: '', price: 0, slots: 1,
  }]);

  const best = sortedLive[0];

  return (
    <>
      <div className="eft-stats">
        <Stat label="Live foods/drinks" value={liveRows.length} sub={hasPrices ? undefined : 'needs live prices'} />
        <Stat label="Best ₽ / slot" value={best ? fmtRub(best.pricePerSlot) : '—'} sub={best?.item.shortName} tone="gold" />
        <Stat label="My sheet rows" value={foodTier.length} />
      </div>

      <Panel
        title="Food &amp; Hydration Tier"
        actions={(
          <>
            <Seg
              value={mode}
              onChange={setMode}
              options={[
                { value: 'live', label: 'Live' },
                { value: 'sheet', label: 'My Sheet' },
              ]}
            />
            {!showSheet ? (
              <Seg
                value={sort}
                onChange={setSort}
                options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))}
              />
            ) : null}
            {showSheet ? (
              <button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={addSheetRow}>+ Add row</button>
            ) : null}
          </>
        )}
        flush
      >
        {mode === 'live' && liveRows.length === 0 ? (
          <div className="eft-banner eft-is-error" style={{ margin: '10px 14px 0' }}>
            No live provisions data — provisions are only in the snapshot when it was generated with tarkov.dev reachable,
            {' '}so this falls back to your hand-entered sheet below.
          </div>
        ) : null}

        {!showSheet ? (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Slots</th>
                  <th>₽ / Slot</th>
                  <th>Energy</th>
                  <th>Energy / Slot</th>
                  <th>Hydration</th>
                  <th>Hydration / Slot</th>
                </tr>
              </thead>
              <tbody>
                {sortedLive.map((r) => (
                  <tr key={r.item.id}>
                    <td style={{ minWidth: 200 }}>
                      <ItemCell item={r.item} onClick={() => setDetailItem(r.item)} />
                    </td>
                    <td className="eft-num-cell">{r.slots}</td>
                    <td className="eft-num-cell">{fmtRub(r.pricePerSlot)}</td>
                    <td className="eft-num-cell">{r.energy ?? '—'}</td>
                    <td className="eft-num-cell">{fmtNum(r.energyPerSlot)}</td>
                    <td className="eft-num-cell">{r.hydration ?? '—'}</td>
                    <td className="eft-num-cell">{fmtNum(r.hydrationPerSlot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Name</th>
                  <th>Match text</th>
                  <th>Price ₽</th>
                  <th>Slots</th>
                  <th>₽ / Slot</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sortedSheet.map(({
                  idx, row, item, pricePerSlot,
                }) => (
                  <tr key={idx}>
                    <td style={{ minWidth: 60 }}>
                      {item ? (
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          style={{
                            background: 'none', border: 0, padding: 0, cursor: 'pointer',
                          }}
                        >
                          <img
                            className={`eft-item-icon eft-bg-${item.backgroundColor || 'default'}`}
                            src={itemImage(item.id)}
                            alt=""
                            style={{ width: 34, height: 34 }}
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                          />
                        </button>
                      ) : <span className="eft-chip eft-is-unmet">no match</span>}
                    </td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: 150 }}
                        value={row.name}
                        onChange={(e) => patchSheetRow(idx, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: 150 }}
                        value={row.match || ''}
                        placeholder="match text"
                        onChange={(e) => patchSheetRow(idx, { match: e.target.value })}
                      />
                    </td>
                    <td className="eft-num-cell">
                      <input
                        type="number"
                        className="eft-input eft-num"
                        value={row.price}
                        onChange={(e) => patchSheetRow(idx, { price: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="eft-num-cell">
                      <input
                        type="number"
                        className="eft-input eft-num-sm"
                        value={row.slots}
                        min={1}
                        onChange={(e) => patchSheetRow(idx, { slots: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </td>
                    <td className="eft-num-cell">{fmtRub(pricePerSlot)}</td>
                    <td>
                      <button type="button" className="eft-iconbtn" aria-label={`Remove ${row.name}`} onClick={() => deleteSheetRow(idx)}>×</button>
                    </td>
                  </tr>
                ))}
                {!sortedSheet.length ? (
                  <tr><td colSpan={7} className="eft-empty">No rows yet. Add one above.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {detailItem ? <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} /> : null}
    </>
  );
}
