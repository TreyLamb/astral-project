import { useState } from 'react';
import { useStashMap } from './stashmapContext';
import { buildSubLabel, categoryColor } from './stashmapConfig';
import LocationHover from './LocationHover';

function ItemForm({ item, rooms, zones, categories, onSave, onCancel }) {
  const isNew = !item.id;
  const [name, setName] = useState(item.name ?? '');
  const [category, setCategory] = useState(item.category ?? categories[0] ?? 'Misc');
  const [quantity, setQuantity] = useState(item.quantity ?? 1);
  const [description, setDescription] = useState(item.description ?? '');
  const [roomId, setRoomId] = useState(item.roomId ?? '');
  const [zoneId, setZoneId] = useState(item.zoneId ?? '');
  const [cellRow, setCellRow] = useState(item.cell ? String(item.cell.row) : '');
  const [cellCol, setCellCol] = useState(item.cell ? String(item.cell.col) : '');

  const zonesInRoom = zones.filter((z) => z.roomId === roomId);
  const selectedZone = zonesInRoom.find((z) => z.id === zoneId) || null;
  const hasGrid = !!selectedZone?.grid;

  const handleRoomChange = (e) => {
    setRoomId(e.target.value);
    setZoneId('');
    setCellRow('');
    setCellCol('');
  };

  const handleZoneChange = (e) => {
    setZoneId(e.target.value);
    setCellRow('');
    setCellCol('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const cell = hasGrid && cellRow !== '' && cellCol !== ''
      ? { row: Number(cellRow), col: Number(cellCol) }
      : null;
    onSave({
      name: trimmedName,
      category,
      quantity: Math.max(1, Number(quantity) || 1),
      description: description.trim(),
      roomId: roomId || null,
      zoneId: zoneId || null,
      cell,
    });
  };

  return (
    <form className="stash-panel stash-form" onSubmit={handleSubmit}>
      <div className="stash-section-label">{isNew ? 'Add Item' : 'Edit Item'}</div>

      <label className="stash-field">
        <span>Name</span>
        <input className="stash-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </label>

      <div className="stash-field-row">
        <label className="stash-field">
          <span>Category</span>
          <select className="stash-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="stash-field stash-field-narrow">
          <span>Quantity</span>
          <input
            className="stash-input"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
      </div>

      <label className="stash-field">
        <span>Description</span>
        <textarea
          className="stash-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </label>

      <div className="stash-field-row">
        <label className="stash-field">
          <span>Room</span>
          <select className="stash-select" value={roomId} onChange={handleRoomChange}>
            <option value="">— None —</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>

        <label className="stash-field">
          <span>Zone</span>
          <select className="stash-select" value={zoneId} onChange={handleZoneChange} disabled={!roomId}>
            <option value="">— None —</option>
            {zonesInRoom.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </label>
      </div>

      {hasGrid && (
        <div className="stash-field-row">
          <label className="stash-field stash-field-narrow">
            <span>Row</span>
            <select className="stash-select" value={cellRow} onChange={(e) => setCellRow(e.target.value)}>
              <option value="">—</option>
              {Array.from({ length: selectedZone.grid.rows }, (_, i) => (
                <option key={i} value={i}>Row {i + 1}</option>
              ))}
            </select>
          </label>

          <label className="stash-field stash-field-narrow">
            <span>Column</span>
            <select className="stash-select" value={cellCol} onChange={(e) => setCellCol(e.target.value)}>
              <option value="">—</option>
              {Array.from({ length: selectedZone.grid.cols }, (_, i) => (
                <option key={i} value={i}>Col {i + 1}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="stash-form-actions">
        <button type="submit" className="stash-btn stash-btn-primary">Save</button>
        <button type="button" className="stash-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function groupItemsByRoom(items, rooms) {
  const byRoom = new Map();
  items.forEach((item) => {
    const key = item.roomId || 'unplaced';
    if (!byRoom.has(key)) byRoom.set(key, []);
    byRoom.get(key).push(item);
  });
  const ordered = rooms
    .filter((r) => byRoom.has(r.id))
    .map((r) => ({ room: r, items: byRoom.get(r.id) }));
  if (byRoom.has('unplaced')) ordered.push({ room: null, items: byRoom.get('unplaced') });
  return ordered;
}

export default function InventoryView() {
  const { rooms, zones, items, settings, actions } = useStashMap();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [formItem, setFormItem] = useState(null);
  const [viewMode, setViewMode] = useState(settings.viewMode || 'flat');

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || item.name.toLowerCase().includes(q)
      || item.description.toLowerCase().includes(q);
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesRoom = !filterRoom || item.roomId === filterRoom;
    return matchesSearch && matchesCategory && matchesRoom;
  });

  const handleSave = (data) => {
    if (formItem.id) {
      actions.updateItem(formItem.id, data);
    } else {
      actions.addItem(data);
    }
    setFormItem(null);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      actions.removeItem(item.id);
    }
  };

  const toggleViewMode = () => {
    const next = viewMode === 'flat' ? 'grouped' : 'flat';
    setViewMode(next);
    actions.updateSettings({ viewMode: next });
  };

  const rowActions = (item) => (
    <div className="stash-item-actions">
      <button className="stash-icon-btn" aria-label={`Edit ${item.name}`} onClick={() => setFormItem(item)}>✎</button>
      <button className="stash-icon-btn" aria-label={`Delete ${item.name}`} onClick={() => handleDelete(item)}>🗑</button>
    </div>
  );

  return (
    <div className="stash-inventory">
      <div className="stash-inventory-header-row">
        <span className="stash-inventory-count">{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
        <button
          type="button"
          className={`stash-groupby-toggle${viewMode === 'grouped' ? ' stash-groupby-toggle-active' : ''}`}
          onClick={toggleViewMode}
        >
          {viewMode === 'grouped' ? '☰ Grouped' : '▤ Group by Room'}
        </button>
      </div>

      <div className="stash-panel stash-panel-accent stash-toolbar">
        <input
          className="stash-input stash-search"
          placeholder="Search name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="stash-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {settings.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="stash-select" value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)}>
          <option value="">All rooms</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="stash-btn stash-btn-primary" onClick={() => setFormItem({})}>+ Add Item</button>
      </div>

      {formItem && (
        <ItemForm
          key={formItem.id || 'new'}
          item={formItem}
          rooms={rooms}
          zones={zones}
          categories={settings.categories}
          onSave={handleSave}
          onCancel={() => setFormItem(null)}
        />
      )}

      {filtered.length === 0 ? (
        <div className="stash-panel stash-empty">
          {items.length === 0 ? 'No items yet — add your first one above.' : 'No items match your search/filters.'}
        </div>
      ) : viewMode === 'flat' ? (
        <div className="stash-table-wrap">
          <table className="stash-inv-table">
            <thead>
              <tr>
                <th aria-hidden="true" className="stash-inv-th-dot" />
                <th>Item</th>
                <th>Qty</th>
                <th>Category</th>
                <th>Location</th>
                <th aria-hidden="true">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="stash-inv-row">
                  <td>
                    <span className="stash-color-dot" style={{ background: categoryColor(item.category) }} />
                  </td>
                  <td className="stash-inv-name">{item.name}</td>
                  <td className="stash-inv-qty">×{item.quantity}</td>
                  <td><span className="stash-badge">{item.category}</span></td>
                  <td>
                    <LocationHover
                      item={item} rooms={rooms} zones={zones} items={items}
                      onFocus={actions.focusItemOnMap}
                    />
                  </td>
                  <td className="stash-inv-actions-cell">{rowActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stash-grouped-list">
          {groupItemsByRoom(filtered, rooms).map(({ room, items: roomItems }) => (
            <details key={room ? room.id : 'unplaced'} className="stash-room-group" open>
              <summary className="stash-room-group-summary">
                <span
                  className="stash-room-group-dot"
                  style={{ background: room ? room.color : 'transparent' }}
                />
                <span className="stash-room-group-name">{room ? room.name : 'Unplaced'}</span>
                <span className="stash-room-group-count">{roomItems.length}</span>
              </summary>
              <div className="stash-room-group-items">
                {roomItems.map((item) => (
                  <div key={item.id} className="stash-grouped-row">
                    <span className="stash-color-dot" style={{ background: categoryColor(item.category) }} />
                    <span className="stash-item-name">{item.name}</span>
                    {item.roomId ? (
                      <LocationHover
                        item={item} rooms={rooms} zones={zones} items={items}
                        onFocus={actions.focusItemOnMap}
                        variant="sub"
                        label={buildSubLabel(item, zones) || '—'}
                      />
                    ) : <span className="stash-sub-location stash-item-unplaced">—</span>}
                    <span className="stash-item-qty">×{item.quantity}</span>
                    {rowActions(item)}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
