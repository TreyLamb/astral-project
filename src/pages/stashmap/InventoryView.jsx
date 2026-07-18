import { useState } from 'react';
import { useStashMap } from './stashmapContext';
import { buildBreadcrumb } from './stashmapConfig';

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

export default function InventoryView() {
  const { rooms, zones, items, settings, actions } = useStashMap();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [formItem, setFormItem] = useState(null);

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

  return (
    <div className="stash-inventory">
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
      ) : (
        <div className="stash-item-list">
          {filtered.map((item) => {
            const breadcrumb = buildBreadcrumb(item, rooms, zones);
            return (
              <div key={item.id} className="stash-item-row">
                <div className="stash-item-main">
                  <span className="stash-item-name">{item.name}</span>
                  <span className="stash-badge">{item.category}</span>
                  <span className="stash-item-qty">×{item.quantity}</span>
                </div>

                {item.roomId ? (
                  <button
                    type="button"
                    className="stash-link stash-item-location"
                    onClick={() => actions.focusItemOnMap(item.id)}
                  >
                    📍 {breadcrumb}
                  </button>
                ) : (
                  <span className="stash-item-location stash-item-unplaced">Unplaced</span>
                )}

                {item.description && <p className="stash-item-desc">{item.description}</p>}

                <div className="stash-item-actions">
                  <button className="stash-btn" onClick={() => setFormItem(item)}>Edit</button>
                  <button className="stash-btn stash-btn-danger" onClick={() => handleDelete(item)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
