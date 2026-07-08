import { useState } from 'react';
import { CHECK_STAT_CONFIG, RAID_PASS_CONFIG, typeColorFor } from './pgoConfig';

function RaidPassSection({ config, accounts, selected, onToggleSelect, onBulkInventory }) {
  const noneSelected = selected.length === 0;

  return (
    <div className="pgo-raid-section">
      <div className="pgo-raid-section-header">
        <span className="pgo-raid-section-icon" style={{ background: config.chipColor }}>
          {config.icon}
        </span>
        <span className="pgo-raid-section-label">{config.label}</span>
        <div className="pgo-raid-section-actions">
          <button
            className="pgo-btn-step minus"
            disabled={noneSelected}
            onClick={() => onBulkInventory(selected, config.key, -1)}
          >
            −1
          </button>
          <button
            className="pgo-btn-step primary"
            disabled={noneSelected}
            onClick={() => onBulkInventory(selected, config.key, 1)}
          >
            +1
          </button>
        </div>
      </div>
      <div className="pgo-raid-account-grid">
        {accounts.map((a) => (
          <label key={a.id} className="pgo-raid-account-cell">
            <input
              type="checkbox"
              checked={selected.includes(a.id)}
              onChange={() => onToggleSelect(a.id)}
            />
            <span className="pgo-raid-account-name">{a.name}</span>
            <span className="pgo-raid-account-count">
              {config.max !== undefined ? `${a.inventory[config.key]}/${config.max}` : a.inventory[config.key]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function MainDashboard({ accounts, onBulkInventory }) {
  const [selected, setSelected] = useState([]);

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <div className="pgo-section-heading">
        <h2>Raid Passes</h2>
        <span className="pgo-meta">
          {selected.length > 0 ? `${selected.length} selected` : `${accounts.length} trainer${accounts.length === 1 ? '' : 's'} — tap names to select`}
        </span>
      </div>
      <div className="pgo-raid-select-row">
        <button className="pgo-btn-step" onClick={() => setSelected(accounts.map((a) => a.id))}>Select All</button>
        <button className="pgo-btn-step" onClick={() => setSelected([])}>Select None</button>
      </div>
      {RAID_PASS_CONFIG.map((config) => (
        <RaidPassSection
          key={config.key}
          config={config}
          accounts={accounts}
          selected={selected}
          onToggleSelect={toggleSelect}
          onBulkInventory={onBulkInventory}
        />
      ))}

      <div className="pgo-section-heading">
        <h2>All Accounts</h2>
      </div>
      <div className="pgo-split-grid">
        {CHECK_STAT_CONFIG.map((s, i) => {
          const done = accounts.filter((a) => a.dashboard[s.key]);
          const shown = s.listRemaining ? accounts.filter((a) => !a.dashboard[s.key]) : done;
          const emptyText = s.listRemaining ? 'all done ✓' : 'none yet';
          return (
            <div key={s.key} className="pgo-split-card">
              <div className="pgo-split-card-inner">
                <div className="pgo-split-left" style={{ '--pgo-card-color': typeColorFor(i).bg }}>
                  <div className="pgo-split-icon">{s.icon}</div>
                  <div className="pgo-split-count">{done.length}</div>
                  <div className="pgo-split-label">{s.label}</div>
                </div>
                <div className="pgo-split-names">
                  {shown.length === 0 ? (
                    <span className="pgo-split-name-empty">{emptyText}</span>
                  ) : (
                    shown.map((a) => (
                      <span key={a.id} className="pgo-split-name">{a.name}</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
