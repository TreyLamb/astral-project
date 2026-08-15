// "Buy Below" — Sheet6 / crafts-tab buy-below thresholds, with a live price
// verdict instead of a manually-checked number.

import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import {
  Panel, Stat, Seg, ItemCell, fmtRub,
} from '../EftBits';
import { itemImage } from '../eftApi';
import { traderBeatsFlea } from '../eftHideoutLogic';

// Shortest-name-containing-the-substring wins so "wires" binds to the actual
// "Wires" item rather than some unrelated item whose long name happens to
// mention wires in passing.
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

function resolveItem(row, items) {
  if (row.itemId && items[row.itemId]) return items[row.itemId];
  return bestMatch(items, row.match);
}

function computeVerdict(item, row, offline) {
  if (!item) return { kind: 'unbound' };
  const current = item.fleaBuy?.price ?? item.avg24hPrice ?? null;
  if (current == null) return { kind: 'unknown', offline };
  const kind = current <= row.maxPrice ? 'buy' : 'skip';
  const emphatic = kind === 'buy' && row.idealPrice != null && current < row.idealPrice;
  return { kind, current, emphatic };
}

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
            <div>
              Trader sell: {item.bestTraderSell
                ? `${fmtRub(item.bestTraderSell.price)} (${item.bestTraderSell.vendor})` : '—'}
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

function ItemPicker({ items, onPick, onClose }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return Object.values(items)
      .filter((it) => it.name?.toLowerCase().includes(query))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 30);
  }, [items, q]);

  return (
    <div className="eft-modal-back" onClick={onClose}>
      <div className="eft-modal" onClick={(e) => e.stopPropagation()}>
        <header className="eft-panel-head">
          <h2>Bind to item</h2>
          <button type="button" className="eft-btn eft-btn-sm eft-spacer" onClick={onClose}>Close</button>
        </header>
        <div className="eft-panel-body">
          <input
            className="eft-input"
            style={{ width: '100%' }}
            placeholder="Search items…"
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="eft-linelist" style={{ marginTop: 10, maxHeight: 340, overflow: 'auto' }}>
            {list.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onPick(it)}
                  style={{
                    background: 'none', border: 0, padding: '4px 0', cursor: 'pointer', width: '100%', textAlign: 'left',
                  }}
                >
                  <ItemCell item={it} />
                </button>
              </li>
            ))}
            {q && !list.length ? <li style={{ color: 'var(--eft-text-faint)', fontSize: 12 }}>no matches</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function WatchlistView() {
  const { watchlist, items, update, hasPrices } = useEft();
  const [sort, setSort] = useState('best');
  const [pickerFor, setPickerFor] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const offline = !hasPrices;

  const rows = useMemo(() => watchlist.map((row) => {
    const item = resolveItem(row, items);
    const verdict = computeVerdict(item, row, offline);
    const beat = item ? traderBeatsFlea(item) : null;
    return { row, item, verdict, beat };
  }), [watchlist, items, offline]);

  const sorted = useMemo(() => {
    const list = [...rows];
    if (sort === 'alpha') {
      list.sort((a, b) => a.row.label.localeCompare(b.row.label));
    } else {
      list.sort((a, b) => {
        const margin = (r) => (r.verdict.current == null ? -Infinity : r.row.maxPrice - r.verdict.current);
        return margin(b) - margin(a);
      });
    }
    return list;
  }, [rows, sort]);

  const patchRow = (id, patch) => {
    update('watchlist', (list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const id = `w${Date.now()}`;
    update('watchlist', (list) => [...list, {
      id, label: 'New watch item', match: '', maxPrice: 0, note: '',
    }]);
  };

  const deleteRow = (id) => update('watchlist', (list) => list.filter((r) => r.id !== id));

  const rebind = (id, item) => {
    patchRow(id, { itemId: item.id });
    setPickerFor(null);
  };

  return (
    <>


      <Panel
        title="Buy-Below Watchlist"
        actions={(
          <>
            <Seg
              value={sort}
              onChange={setSort}
              options={[
                { value: 'best', label: 'Best Buys' },
                { value: 'alpha', label: 'A–Z' },
              ]}
            />
            <button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={addRow}>+ Add row</button>
          </>
        )}
        flush
      >
        {offline ? (
          <div className="eft-banner eft-is-error" style={{ margin: '10px 14px 0' }}>
            Offline snapshot — flea prices are unavailable, so every verdict below reads
            "no price data" until tarkov.dev is reachable again.
          </div>
        ) : null}
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Label</th>
                <th>Max ₽</th>
                <th>Ideal ₽</th>
                <th>Current ₽</th>
                <th>Delta</th>
                <th>Flags</th>
                <th>Verdict</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ row, item, verdict, beat }) => {
                const delta = verdict.current == null ? null : row.maxPrice - verdict.current;
                return (
                  <tr key={row.id}>
                    <td style={{ minWidth: 210 }}>
                      {item ? (
                        <ItemCell item={item} onClick={() => setDetailItem(item)} />
                      ) : (
                        <span className="eft-chip eft-is-unmet">Unbound — “{row.match || '(no match text)'}”</span>
                      )}
                      <div style={{ marginTop: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button type="button" className="eft-btn eft-btn-sm" onClick={() => setPickerFor(row.id)}>
                          {item ? 'Re-bind' : 'Bind item'}
                        </button>
                        <input
                          className="eft-input"
                          style={{ width: 110, fontSize: 11 }}
                          value={row.match || ''}
                          placeholder="match text"
                          onChange={(e) => patchRow(row.id, { match: e.target.value })}
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: 150 }}
                        value={row.label}
                        onChange={(e) => patchRow(row.id, { label: e.target.value })}
                      />
                    </td>
                    <td className="eft-num-cell">
                      <input
                        type="number"
                        className="eft-input eft-num"
                        value={row.maxPrice}
                        onChange={(e) => patchRow(row.id, { maxPrice: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="eft-num-cell">
                      <input
                        type="number"
                        className="eft-input eft-num"
                        value={row.idealPrice ?? ''}
                        placeholder="—"
                        onChange={(e) => patchRow(row.id, {
                          idealPrice: e.target.value === '' ? undefined : Number(e.target.value) || 0,
                        })}
                      />
                    </td>
                    <td className="eft-num-cell">{fmtRub(verdict.current)}</td>
                    <td className="eft-num-cell" style={{ color: delta == null ? undefined : (delta >= 0 ? 'var(--eft-green)' : 'var(--eft-red)') }}>
                      {delta == null ? '—' : fmtRub(delta)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {beat ? (
                          <span className="eft-chip eft-is-met">
                            {beat.vendor} {fmtRub(beat.price)} beats flea (save {fmtRub(beat.saving)})
                          </span>
                        ) : null}
                        {item?.fleaAvailable === false ? <span className="eft-chip eft-is-unmet">Flea-banned</span> : null}
                      </div>
                    </td>
                    <td>
                      {verdict.kind === 'unbound' ? <span className="eft-chip eft-is-unmet">No item bound</span>
                        : verdict.kind === 'unknown' ? <span className="eft-chip">No price data{offline ? ' (offline)' : ''}</span>
                          : verdict.kind === 'buy' ? (
                            <span className="eft-buy">{verdict.emphatic ? 'STRONG BUY' : 'BUY'}</span>
                          ) : <span className="eft-skip">SKIP</span>}
                    </td>
                    <td>
                      <input
                        className="eft-input"
                        style={{ width: 170 }}
                        value={row.note || ''}
                        placeholder="note"
                        onChange={(e) => patchRow(row.id, { note: e.target.value })}
                      />
                    </td>
                    <td>
                      <button type="button" className="eft-iconbtn" aria-label={`Remove ${row.label}`} onClick={() => deleteRow(row.id)}>×</button>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length ? (
                <tr><td colSpan={10} className="eft-empty">No watched items yet. Add one above.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      {pickerFor ? (
        <ItemPicker items={items} onClose={() => setPickerFor(null)} onPick={(it) => rebind(pickerFor, it)} />
      ) : null}
      {detailItem ? <ItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} /> : null}
    </>
  );
}
