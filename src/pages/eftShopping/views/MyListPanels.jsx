import { useMemo, useState } from 'react';

import { useEft } from '../eftContext';
import { itemIcon } from '../eftApi';
import { Counter } from '../EftBits';
import {
  buildItemPool, searchPool, addToList, updateEntry, removeEntry,
  setHave, setNeed, listTotals, listAsText,
} from '../eftListLogic';

/**
 * The hand-built list. Two sections that behave differently on purpose:
 *
 *   ONGOING — survives raids. The slow-burn stuff you are always half looking
 *             for, like the lighters you trade for fuel.
 *   THIS RAID — wiped whenever you want, in one click. A raid's worth of
 *             intent, not a permanent record.
 *
 * Row order is Item, count, notes with notes taking about half the width,
 * because the note is the part you actually read ("trade for fuel", "only the
 * blue one") and a 60px column would make it useless.
 */

/** Type-ahead over the whole item table. Falls through to a free-text add, so
 *  anything the snapshot has never heard of still gets on the list. */
function ItemPicker({ pool, onPick, placeholder }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const hits = useMemo(() => searchPool(pool, query, { limit: 10 }), [pool, query]);
  const free = query.trim().length >= 2 && !hits.some((h) => h.name.toLowerCase() === query.trim().toLowerCase());

  const options = free ? [...hits, { key: '__free', itemId: null, name: query.trim(), free: true }] : hits;
  // Clamped on render rather than reset from an effect: the option list shrinks
  // as you keep typing, and an out-of-range highlight would Enter into nothing.
  const cursor = Math.min(active, Math.max(0, options.length - 1));

  const pick = (entry) => {
    if (!entry) return;
    onPick({ itemId: entry.itemId, name: entry.name });
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(options.length - 1, cursor + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(options[cursor]); }
    else if (e.key === 'Escape') setQuery('');
  };

  return (
    <div className="eft-picker">
      <input
        className="eft-input eft-picker-input"
        value={query}
        placeholder={placeholder}
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
                {entry.kind === 'ammo' ? <span className="eft-chip eft-is-info">ammo</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ListRow({ row, onChange, onRemove }) {
  const short = Math.max(0, (row.need || 1) - (row.have || 0));
  const done = short === 0;

  return (
    <li className={`eft-lrow${done ? ' eft-is-done' : ''}`}>
      <div className="eft-lrow-item">
        {row.itemId ? (
          <img className="eft-lrow-icon" src={itemIcon(row.itemId)} alt="" loading="lazy"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        ) : <span className="eft-lrow-icon eft-picker-noicon" />}
        <span className="eft-lrow-name" title={row.name}>{row.name}</span>
      </div>

      <div className="eft-lrow-count">
        <span className={`eft-lrow-tally${done ? ' eft-is-met' : ''}`}>
          {row.have || 0}/{row.need || 1}
        </span>
        <Counter value={row.have || 0} onChange={(n) => onChange('have', n)} />
        {/* Two bare number boxes side by side is unreadable — the "of" is what
            says which one is how many you have and which is how many you want. */}
        <span className="eft-lrow-of">of</span>
        <input
          className="eft-input eft-lrow-need"
          type="number"
          min={1}
          value={row.need || 1}
          title="How many you want"
          onChange={(e) => onChange('need', e.target.value)}
        />
      </div>

      <input
        className="eft-input eft-lrow-note"
        value={row.note || ''}
        placeholder="note…"
        onChange={(e) => onChange('note', e.target.value)}
      />

      <button type="button" className="eft-iconbtn eft-lrow-x" title={`Remove ${row.name}`}
        onClick={onRemove}>×</button>
    </li>
  );
}

function ListSection({ title, hint, listKey, rows, pool, update, actions }) {
  const totals = listTotals(rows);

  const change = (id, field, value) => update(listKey, (prev) => {
    if (field === 'have') return setHave(prev, id, value);
    if (field === 'need') return setNeed(prev, id, value);
    return updateEntry(prev, id, { [field]: value });
  });

  return (
    <section className="eft-panel eft-listsec">
      <header className="eft-panel-head">
        <h2>{title}</h2>
        <div className="eft-spacer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="eft-chip eft-is-met">{totals.done}/{totals.rows} got</span>
          {actions}
        </div>
      </header>

      <div className="eft-panel-body">
        <ItemPicker
          pool={pool}
          placeholder="Type an item name…"
          onPick={(entry) => update(listKey, (prev) => addToList(prev, entry))}
        />

        {!rows.length ? (
          <div className="eft-empty">{hint}</div>
        ) : (
          <ul className="eft-llist">
            <li className="eft-lrow eft-lrow-head">
              <span className="eft-lrow-item">Item</span>
              <span className="eft-lrow-count">Count</span>
              <span className="eft-lrow-note">Notes</span>
              <span className="eft-lrow-x" />
            </li>
            {rows.map((row) => (
              <ListRow
                key={row.id}
                row={row}
                onChange={(field, value) => change(row.id, field, value)}
                onRemove={() => update(listKey, (prev) => removeEntry(prev, row.id))}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** The right-hand column. One row, item and what it's worth — deliberately not
 *  the same shape as the shopping list, because it answers a different question
 *  ("is this worth the slot?") and sharing a row layout would blur the two. */
function ValueList({ rows, pool, update }) {
  return (
    <section className="eft-panel eft-valuesec">
      <header className="eft-panel-head">
        <h2>Value list</h2>
        <div className="eft-spacer">
          <span className="eft-note">{rows.length} item{rows.length === 1 ? '' : 's'}</span>
        </div>
      </header>
      <div className="eft-panel-body">
        <ItemPicker
          pool={pool}
          placeholder="Add an item…"
          onPick={(entry) => update('value', (prev) => addToList(prev, entry))}
        />
        {!rows.length ? (
          <div className="eft-empty">Nothing here yet — add what you want to remember the value of.</div>
        ) : (
          <ul className="eft-llist">
            <li className="eft-vrow eft-lrow-head">
              <span className="eft-vrow-item">Item</span>
              <span className="eft-vrow-value">Value</span>
              <span className="eft-lrow-x" />
            </li>
            {rows.map((row) => (
              <li key={row.id} className="eft-vrow">
                <div className="eft-vrow-item">
                  {row.itemId ? (
                    <img className="eft-lrow-icon" src={itemIcon(row.itemId)} alt="" loading="lazy"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                  ) : <span className="eft-lrow-icon eft-picker-noicon" />}
                  <span className="eft-lrow-name" title={row.name}>{row.name}</span>
                </div>
                <input
                  className="eft-input eft-vrow-value"
                  value={row.value || ''}
                  placeholder="value…"
                  onChange={(e) => update('value', (prev) => updateEntry(prev, row.id, { value: e.target.value }))}
                />
                <button type="button" className="eft-iconbtn eft-lrow-x" title={`Remove ${row.name}`}
                  onClick={() => update('value', (prev) => removeEntry(prev, row.id))}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function MyListPanels() {
  const { items, myList, update, showToast } = useEft();

  const pool = useMemo(() => buildItemPool(items), [items]);

  const updateList = (which, fn) => update('myList', (prev) => ({
    ...prev,
    [which]: typeof fn === 'function' ? fn(prev?.[which] || []) : fn,
  }));

  const copy = async (title, rows) => {
    try {
      await navigator.clipboard.writeText(listAsText(title, rows));
      showToast('Copied');
    } catch {
      showToast('Clipboard blocked by the browser');
    }
  };

  const clearRaid = () => {
    if (!myList.raid?.length) return;
    if (!window.confirm(`Clear all ${myList.raid.length} items from this raid's list?`)) return;
    updateList('raid', []);
    showToast('Raid list cleared');
  };

  return (
    <div className="eft-listsplit">
      <div className="eft-listsplit-main">
        <ListSection
          title="Ongoing list"
          hint="Nothing on the ongoing list. Type an item above to start one — this list survives raids."
          listKey="ongoing"
          rows={myList.ongoing || []}
          pool={pool}
          update={updateList}
          actions={(
            <button type="button" className="eft-btn eft-btn-sm"
              onClick={() => copy('EFT ongoing list', myList.ongoing || [])}>Copy</button>
          )}
        />

        <ListSection
          title="This raid only"
          hint="Nothing packed for this raid yet."
          listKey="raid"
          rows={myList.raid || []}
          pool={pool}
          update={updateList}
          actions={(
            <>
              <button type="button" className="eft-btn eft-btn-sm"
                onClick={() => copy('EFT raid list', myList.raid || [])}>Copy</button>
              <button type="button" className="eft-btn eft-btn-sm eft-is-danger"
                onClick={clearRaid} title="Wipe this raid's list and start fresh">
                Clear all
              </button>
            </>
          )}
        />
      </div>

      <div className="eft-listsplit-side">
        <ValueList rows={myList.value || []} pool={pool} update={updateList} />
      </div>
    </div>
  );
}
