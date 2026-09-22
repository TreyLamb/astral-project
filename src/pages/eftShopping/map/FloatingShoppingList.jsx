import { useEffect, useMemo, useRef, useState } from 'react';

import { useEft } from '../eftContext';
import { itemIcon } from '../eftApi';
import { Counter, Seg } from '../EftBits';
import {
  buildItemPool, searchPool, addToList, updateEntry, removeEntry,
  setHave, setNeed, listTotals,
} from '../eftListLogic';

/**
 * A minimalist, draggable, resizable window over the map, wired to the SAME
 * hand-built list as ShoppingListView's "My list" tab (`myList.raid` /
 * `myList.ongoing` in eftStorage). It is a stripped-down VIEW of that data,
 * not a separate list — add an item here and it's on the real Shopping List
 * page too, and vice versa.
 *
 * Deliberately dropped versus the full page: notes, the value list, "Copy" /
 * "Export". Kept: search-to-add, remove, and the have/need counters — the
 * loop you actually run mid-raid.
 *
 * Position/size are lifted to the caller (MapView -> MapStore prefs) so they
 * persist across map switches and reloads; this component only owns the
 * IN-PROGRESS drag/resize position so dragging feels immediate and doesn't
 * hammer localStorage on every pointermove.
 */

const MIN_W = 280;
const MIN_H = 220;

function clampPos(x, y, w) {
  const minX = 80 - w;
  const maxX = window.innerWidth - 80;
  const minY = 0;
  const maxY = window.innerHeight - 36;
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

function MiniPicker({ pool, onPick }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const hits = useMemo(() => searchPool(pool, query, { limit: 6 }), [pool, query]);
  const free = query.trim().length >= 2 && !hits.some((h) => h.name.toLowerCase() === query.trim().toLowerCase());
  const options = free ? [...hits, { key: '__free', itemId: null, name: query.trim(), free: true }] : hits;
  const cursor = Math.min(active, Math.max(0, options.length - 1));

  const pick = (entry) => {
    if (!entry) return;
    onPick({ itemId: entry.itemId, name: entry.name });
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(options.length - 1, cursor + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(options[cursor]); }
    else if (e.key === 'Escape') setQuery('');
  };

  return (
    <div className="eft-shoplist-picker eft-picker">
      <input
        className="eft-input eft-picker-input"
        value={query}
        placeholder="Add an item…"
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={onKeyDown}
      />
      {options.length ? (
        <ul className="eft-picker-list">
          {options.map((entry, i) => (
            <li key={entry.key || entry.name}>
              <button
                type="button"
                className={i === cursor ? 'eft-is-on' : ''}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(entry)}
              >
                {entry.itemId ? (
                  <img src={itemIcon(entry.itemId)} alt="" loading="lazy"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                ) : <span className="eft-picker-noicon" />}
                <span className="eft-picker-name">{entry.name}</span>
                {entry.free ? <span className="eft-chip">add as typed</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MiniRow({ row, onChange, onRemove }) {
  const short = Math.max(0, (row.need || 1) - (row.have || 0));
  const done = short === 0;

  return (
    <li className={`eft-shoplist-row${done ? ' eft-is-done' : ''}`}>
      {row.itemId ? (
        <img className="eft-shoplist-icon" src={itemIcon(row.itemId)} alt="" loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      ) : <span className="eft-shoplist-icon eft-picker-noicon" />}

      <span className="eft-shoplist-name" title={row.name}>{row.name}</span>

      <Counter value={row.have || 0} onChange={(n) => onChange('have', n)} />
      <span className="eft-shoplist-of">/</span>
      <input
        className="eft-input eft-shoplist-need"
        type="number"
        min={1}
        value={row.need || 1}
        title="How many you want"
        onChange={(e) => onChange('need', e.target.value)}
      />

      <button type="button" className="eft-iconbtn eft-shoplist-x" title={`Remove ${row.name}`}
        onClick={onRemove}>×</button>
    </li>
  );
}

export default function FloatingShoppingList({
  open, tab, onTabChange, initialPos, initialSize, onPosChange, onSizeChange, onClose,
}) {
  const { items, myList, update } = useEft();
  const pool = useMemo(() => buildItemPool(items), [items]);

  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize);
  const dragging = useRef(false);
  const resizing = useRef(false);

  // A prefs change from elsewhere (import/reset) should still take effect —
  // just not while the user has their hand on the window right now.
  useEffect(() => { if (!dragging.current) setPos(initialPos); }, [initialPos]);
  useEffect(() => { if (!resizing.current) setSize(initialSize); }, [initialSize]);

  if (!open) return null;

  const rows = myList?.[tab] || [];
  const totals = listTotals(rows);

  const updateList = (fn) => update('myList', (prev) => ({
    ...prev,
    [tab]: fn(prev?.[tab] || []),
  }));

  const change = (id, field, value) => updateList((list) => {
    if (field === 'have') return setHave(list, id, value);
    if (field === 'need') return setNeed(list, id, value);
    return updateEntry(list, id, { [field]: value });
  });

  const startDrag = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = pos;
    let latest = origin;
    const onMove = (ev) => {
      latest = clampPos(origin.x + (ev.clientX - startX), origin.y + (ev.clientY - startY), size.w);
      setPos(latest);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Committed to the persisted pref here, in the event handler — NOT via a
      // setState updater (setPos(p => {...})), which React runs during render
      // and which triggered "Cannot update a component while rendering a
      // different component" when it called MapView's setter from inside it.
      onPosChange(latest);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startResize = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = size;
    let latest = origin;
    const onMove = (ev) => {
      const w = Math.max(MIN_W, Math.min(origin.w + (ev.clientX - startX), window.innerWidth - pos.x - 8));
      const h = Math.max(MIN_H, Math.min(origin.h + (ev.clientY - startY), window.innerHeight - pos.y - 8));
      latest = { w, h };
      setSize(latest);
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      onSizeChange(latest);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className="eft-shoplist-float"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="eft-shoplist-head" onPointerDown={startDrag}>
        <Seg
          value={tab}
          onChange={onTabChange}
          options={[
            { value: 'raid', label: 'Raid', title: 'This raid only — wiped between raids' },
            { value: 'ongoing', label: 'Ongoing', title: 'Survives raids' },
          ]}
        />
        <span className="eft-shoplist-count">{totals.done}/{totals.rows}</span>
        <button type="button" className="eft-iconbtn eft-shoplist-close" title="Close" onClick={onClose}>×</button>
      </div>

      <div className="eft-shoplist-body">
        <MiniPicker pool={pool} onPick={(entry) => updateList((list) => addToList(list, entry))} />

        {!rows.length ? (
          <div className="eft-empty eft-shoplist-empty">
            {tab === 'raid' ? 'Nothing packed for this raid yet.' : 'Nothing on the ongoing list yet.'}
          </div>
        ) : (
          <ul className="eft-shoplist-list">
            {rows.map((row) => (
              <MiniRow
                key={row.id}
                row={row}
                onChange={(field, value) => change(row.id, field, value)}
                onRemove={() => updateList((list) => removeEntry(list, row.id))}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="eft-shoplist-resize" onPointerDown={startResize} title="Drag to resize" />
    </div>
  );
}
