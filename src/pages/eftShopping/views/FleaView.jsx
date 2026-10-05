// Flea Prices — the in-app page for the price snapshot behind every other tab: how old it is,
// a Refresh button that pulls this economy's prices straight from the public upstream, and a
// lookup over every priced item. See PRICES.md for where the numbers come from.

import { useMemo, useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, Stat, ItemCell, fmtRub, fmtAgo } from '../EftBits';
import { GAME_MODES } from '../eftNormalize';
import itemNames from '../data/itemNames.json';

const RESULT_LIMIT = 60;

const nameRows = itemNames.rows || [];

export default function FleaView() {
  const {
    priceSnapshot, priceOf, status, gameMode, refreshFlea, resetFlea,
  } = useEft();
  const [query, setQuery] = useState('');

  const modeLabel = GAME_MODES.find((m) => m.id === gameMode)?.label || gameMode;
  const meta = priceSnapshot;
  const scanned = meta?.scannedAt?.flea ? meta.scannedAt.flea * 1000 : null;
  const pulled = meta?.generatedAt ? Date.parse(meta.generatedAt) : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const [id, name, short] of nameRows) {
      if (!name || /^\(off\)/i.test(name)) continue;
      if (!name.toLowerCase().includes(q) && !(short || '').toLowerCase().includes(q)) continue;
      const p = priceOf(id);
      if (!p || (p.avg24hPrice == null && p.bestTraderSell == null && p.bestTraderBuy == null)) continue;
      out.push({ id, name, p });
      if (out.length >= 400) break;
    }
    // Shortest name first so "bolts" finds Bolts before "Bolts and nuts mod kit".
    out.sort((a, b) => a.name.length - b.name.length);
    return out.slice(0, RESULT_LIMIT);
  }, [query, priceOf]);

  return (
    <div className="eft-page">
      <Panel title={`Flea prices · ${modeLabel}`}>
        <div className="eft-stats">
          <Stat
            label="Market scanned"
            value={scanned ? fmtAgo(scanned) : 'unknown'}
            sub="when the upstream last sampled the flea"
            tone={scanned && Date.now() - scanned > 24 * 3600 * 1000 ? 'warn' : undefined}
          />
          <Stat label="Pulled" value={pulled ? fmtAgo(pulled) : 'unknown'} sub={meta?.source ? 'public flea API' : ''} />
          <Stat label="Items priced" value={meta?.counts?.flea ?? '—'} sub={`${meta?.counts?.offers ?? 0} trader offers`} />
        </div>

        <div className="eft-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="eft-btn"
            onClick={refreshFlea}
            disabled={status.fleaLoading}
            title="Downloads about 15 MB from the public flea API and replaces the prices on every tab for this game mode."
          >
            {status.fleaLoading ? 'Refreshing…' : `Refresh ${modeLabel} prices`}
          </button>
          <button
            type="button"
            className="eft-btn eft-btn-sm"
            onClick={resetFlea}
            title="Forget the prices you refreshed and fall back to the snapshot shipped with the site."
          >
            Reset to built-in
          </button>
          {status.fleaError ? <span className="eft-note">Last attempt failed: {status.fleaError}</span> : null}
        </div>
        <p className="eft-note" style={{ marginTop: 10 }}>
          Averages are for the {modeLabel} market only. A weapon&rsquo;s flea number is the average of
          modded builds, not the bare gun. Switch PVP/PVE at the top; each keeps its own prices.
        </p>
      </Panel>

      <Panel title="Look up an item">
        <input
          type="search"
          className="eft-input"
          placeholder="Item name or short name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search priced items"
        />
        {!query.trim() ? (
          <div className="eft-empty">Type to search every item with a price.</div>
        ) : !results.length ? (
          <div className="eft-empty">No priced item matches &ldquo;{query}&rdquo;.</div>
        ) : (
          <div className="eft-tablewrap" style={{ marginTop: 10 }}>
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Flea avg</th>
                  <th>Cheapest</th>
                  <th>Listings</th>
                  <th>Sell to trader</th>
                  <th>Buy from trader</th>
                </tr>
              </thead>
              <tbody>
                {results.map(({ id, name, p }) => (
                  <tr key={id}>
                    <td><ItemCell itemId={id} item={{ id, name }} noAdd /></td>
                    <td>
                      {p.avg24hPrice != null ? fmtRub(p.avg24hPrice) : '—'}
                      {p.fleaBuildPriced ? <span className="eft-note" title="Average of modded builds"> *</span> : null}
                      {p.fleaStale ? <span className="eft-note" title="Upstream flags this sample as stale"> ⏱</span> : null}
                    </td>
                    <td>{p.lastLowPrice ? fmtRub(p.lastLowPrice) : '—'}</td>
                    <td>{p.fleaListings ?? '—'}</td>
                    <td>
                      {p.bestTraderSell ? `${fmtRub(p.bestTraderSell.price)} · ${p.bestTraderSell.vendor}` : '—'}
                    </td>
                    <td>
                      {p.bestTraderBuy ? `${fmtRub(p.bestTraderBuy.price)} · ${p.bestTraderBuy.vendor}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
