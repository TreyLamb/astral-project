// Small presentational pieces shared across the views. Each is used in at
// least three places — anything used once stays inline in its view.

import { useState } from 'react';
import { itemIcon, itemImage } from './eftApi';

export const fmtRub = (n) => {
  if (n == null || Number.isNaN(n)) return '—';
  return `₽${Math.round(n).toLocaleString('en-US')}`;
};

export const fmtShort = (n) => {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `₽${(n / 1e9).toFixed(2)}b`;
  if (abs >= 1e6) return `₽${(n / 1e6).toFixed(2)}m`;
  if (abs >= 1e3) return `₽${Math.round(n / 1e3)}k`;
  return `₽${Math.round(n)}`;
};

export function fmtDuration(seconds) {
  if (!seconds) return 'instant';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

export function fmtAgo(ts) {
  if (!ts) return 'unknown';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ItemCell({ item, itemId, sub, onClick }) {
  const id = item?.id || itemId;
  const bg = `eft-bg-${item?.backgroundColor || 'default'}`;
  return (
    <div className="eft-item">
      <img
        className={`eft-item-icon ${bg}`}
        src={itemIcon(id)}
        alt=""
        loading="lazy"
        // A brand-new item can exist in the hideout data before its icon is on
        // the CDN. Hiding the broken glyph is kinder than a torn-page icon.
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      />
      <div>
        <div className="eft-item-name">
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
            >
              {item?.name || itemId}
            </button>
          ) : (item?.name || itemId)}
        </div>
        {sub ? <div className="eft-item-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

export function Counter({ value, onChange, max, step = 1 }) {
  const set = (n) => onChange(Math.max(0, max == null ? n : Math.min(max, n)));
  return (
    <div className="eft-counter">
      <button type="button" className="eft-iconbtn" onClick={() => set(value - step)} disabled={value <= 0} aria-label="less">−</button>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => set(Number(e.target.value) || 0)}
      />
      <button type="button" className="eft-iconbtn" onClick={() => set(value + step)} aria-label="more">+</button>
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="eft-stat">
      <div className="eft-stat-label">{label}</div>
      <div className={`eft-stat-value${tone ? ` eft-is-${tone}` : ''}`}>{value}</div>
      {sub ? <div className="eft-stat-sub">{sub}</div> : null}
    </div>
  );
}

export function Bar({ percent }) {
  const pct = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="eft-bar">
      <div className={`eft-bar-fill${pct >= 100 ? ' eft-is-full' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="eft-seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          title={o.title || o.label}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * `collapsible` turns the header into a toggle. Open state is controlled when
 * `open`/`onToggle` are supplied (so it can be persisted) and self-managed
 * otherwise — a panel should not need a store just to fold up.
 */
export function Panel({
  title, actions, children, flush, collapsible, open, onToggle, defaultOpen = true,
}) {
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const isOpen = !collapsible || (onToggle ? open : selfOpen);
  const toggle = () => (onToggle ? onToggle(!open) : setSelfOpen((v) => !v));

  return (
    <section className={`eft-panel${collapsible ? ' eft-is-collapsible' : ''}${isOpen ? '' : ' eft-is-closed'}`}>
      {(title || actions) && (
        <header className="eft-panel-head">
          {collapsible ? (
            <button type="button" className="eft-panel-toggle" onClick={toggle}
              aria-expanded={isOpen} title={isOpen ? 'Collapse' : 'Expand'}>
              <span className="eft-caret">{isOpen ? '▾' : '▸'}</span>
              {title ? <h2>{title}</h2> : null}
            </button>
          ) : (title ? <h2>{title}</h2> : null)}
          {actions && isOpen ? (
            <div className="eft-spacer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
          ) : null}
        </header>
      )}
      {isOpen ? <div className={`eft-panel-body${flush ? ' eft-flush' : ''}`}>{children}</div> : null}
    </section>
  );
}

function ItemDetailModal({ item, onClose }) {
  const rows = [
    ['Flea (buy order)', item.fleaBuy?.price],
    ['Flea 24h average', item.avg24hPrice],
    ['Flea last low', item.lastLowPrice],
    ['Best trader buy', item.bestTraderBuy && `${fmtRub(item.bestTraderBuy.price)} — ${item.bestTraderBuy.vendor}`],
    ['Best trader sell', item.bestTraderSell && `${fmtRub(item.bestTraderSell.price)} — ${item.bestTraderSell.vendor}`],
    ['Handbook base', item.basePrice],
  ];

  return (
    <div className="eft-modal-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="eft-modal" onClick={(e) => e.stopPropagation()}>
        <header className="eft-panel-head">
          <h2>{item.name}</h2>
          <div className="eft-spacer">
            <button type="button" className="eft-iconbtn" onClick={onClose} aria-label="Close">×</button>
          </div>
        </header>
        <div className="eft-panel-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <img
            src={itemImage(item.id)}
            alt=""
            style={{ width: 190, maxWidth: '100%', border: '1px solid var(--eft-line-bright)', background: '#24211d' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="eft-blockchips" style={{ marginBottom: 10 }}>
              <span className="eft-chip">{item.width}x{item.height} — {item.slots} slot{item.slots === 1 ? '' : 's'}</span>
              {item.category ? <span className="eft-chip eft-is-info">{item.category}</span> : null}
              {item.fleaAvailable ? null : <span className="eft-chip eft-is-unmet">Flea banned</span>}
            </div>
            <table className="eft-table">
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <td className="eft-label" style={{ letterSpacing: '0.1em' }}>{label}</td>
                    <td className="eft-num-cell">
                      {value == null || value === false ? '—'
                        : typeof value === 'number' ? fmtRub(value) : value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {item.wikiLink ? (
              <a
                className="eft-btn eft-btn-sm"
                href={item.wikiLink}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}
              >
                Open wiki page ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Item popover, as a hook so a table can wire `onClick` on every row and render
 * one modal instead of one per row.
 */
export function useItemDetail() {
  const [item, setItem] = useState(null);
  return {
    openItem: setItem,
    detailNode: item ? <ItemDetailModal item={item} onClose={() => setItem(null)} /> : null,
  };
}

/** An editable list of free-text lines. Used by every checklist-shaped view. */
export function EditableLines({ lines, onChange, placeholder = 'Add a line…', checks, onToggleCheck }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...lines, text]);
    setDraft('');
  };

  return (
    <>
      <ul className="eft-linelist">
        {lines.map((line, i) => (
          <li key={`${line}-${i}`} className={checks?.[line] ? 'eft-is-checked' : ''}>
            {onToggleCheck ? (
              <input
                type="checkbox"
                checked={!!checks?.[line]}
                onChange={() => onToggleCheck(line)}
                aria-label={line}
              />
            ) : null}
            <span className="eft-line-text">{line}</span>
            <button
              type="button"
              className="eft-iconbtn"
              onClick={() => onChange(lines.filter((_, n) => n !== i))}
              aria-label={`Remove ${line}`}
            >
              ×
            </button>
          </li>
        ))}
        {!lines.length ? <li style={{ color: 'var(--eft-text-faint)', fontSize: 12 }}>nothing yet</li> : null}
      </ul>
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
    </>
  );
}
