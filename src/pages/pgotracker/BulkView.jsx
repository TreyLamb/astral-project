import { useState } from 'react';
import { ITEM_CONFIG, STEPS, RAID_STAT, typeColorFor } from './pgoConfig';

export default function BulkView({ accounts, step, onStepChange, onBulkResearch, onBulkStat, onBulkInventory }) {
  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAll() {
    setSelected(accounts.map((a) => a.id));
  }

  function selectNone() {
    setSelected([]);
  }

  const none = selected.length === 0;

  return (
    <div>
      <div className="pgo-section-heading">
        <h2>Bulk Actions</h2>
        <span className="pgo-meta">{selected.length} selected</span>
      </div>

      <div className="pgo-bulk-account-list">
        <div className="pgo-bulk-select-row">
          <button className="pgo-btn-step" onClick={selectAll}>Select All</button>
          <button className="pgo-btn-step" onClick={selectNone}>Select None</button>
        </div>
        {accounts.map((a, i) => (
          <label key={a.id} className="pgo-bulk-account-row" style={{ '--pgo-acc-color': typeColorFor(i).bg }}>
            <input
              type="checkbox"
              checked={selected.includes(a.id)}
              onChange={() => toggle(a.id)}
            />
            <span className="pgo-main-account-name">{a.name}</span>
            {a.dashboard.research && <span className="pgo-acc-research-dot" />}
          </label>
        ))}
      </div>

      <div className="pgo-section-heading">
        <h2>Daily Research</h2>
      </div>
      <div className="pgo-bulk-action-row">
        <button
          className="pgo-btn-step primary"
          disabled={none}
          onClick={() => onBulkResearch(selected, true)}
        >
          ✓ Mark Complete
        </button>
        <button
          className="pgo-btn-step"
          disabled={none}
          onClick={() => onBulkResearch(selected, false)}
        >
          ✗ Mark Incomplete
        </button>
      </div>

      <div className="pgo-section-heading">
        <h2>{RAID_STAT.label}</h2>
        <span className="pgo-meta">common one — used simultaneously by a group</span>
      </div>
      <div className="pgo-bulk-action-row">
        <button className="pgo-btn-step minus" disabled={none} onClick={() => onBulkStat(selected, 'raids', -1)}>
          −1
        </button>
        <button className="pgo-btn-step primary" disabled={none} onClick={() => onBulkStat(selected, 'raids', 1)}>
          +1
        </button>
        <button className="pgo-btn-step" disabled={none} onClick={() => onBulkStat(selected, 'raids', 5)}>
          +5
        </button>
      </div>

      <div className="pgo-section-heading">
        <h2>Bulk Inventory</h2>
      </div>
      <div className="pgo-step-toggle pgo-bulk-step-toggle">
        {STEPS.map((s) => (
          <button key={s} className={step === s ? 'active' : ''} onClick={() => onStepChange(s)}>
            +{s}
          </button>
        ))}
      </div>
      <div className="pgo-bulk-item-rows">
        {ITEM_CONFIG.map((item) => (
          <div key={item.key} className="pgo-bulk-item-row">
            <div className="pgo-inv-icon">{item.icon}</div>
            <div className="pgo-inv-label">{item.label}</div>
            <div className="pgo-inv-btns">
              <button disabled={none} onClick={() => onBulkInventory(selected, item.key, -step)}>
                −
              </button>
              <button className="plus" disabled={none} onClick={() => onBulkInventory(selected, item.key, step)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
