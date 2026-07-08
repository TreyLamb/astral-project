import { CHECK_STAT_CONFIG, RAID_STAT } from './pgoConfig';

export default function AccountDashboard({ account, onBumpRaids, onToggleCheck, onResetDay }) {
  return (
    <div>
      <div className="pgo-active-account-banner">
        <div className="pgo-active-account-info">
          <div className="pgo-active-account-name">{account.name}</div>
          <div className="pgo-active-account-sub">Daily progress</div>
        </div>
        <button className="pgo-banner-reset" onClick={onResetDay}>
          Reset Day
        </button>
      </div>

      <div className="pgo-stat-card">
        <div className="pgo-stat-top">
          <div className="pgo-stat-icon">{RAID_STAT.icon}</div>
          <div className="pgo-stat-label">{RAID_STAT.label}</div>
          <div className="pgo-stat-value">{account.dashboard[RAID_STAT.key]}</div>
        </div>
        <div className="pgo-stat-actions">
          <button className="pgo-btn-step minus" onClick={() => onBumpRaids(-1)}>
            −1
          </button>
          <button className="pgo-btn-step primary" onClick={() => onBumpRaids(1)}>
            +1
          </button>
          <button className="pgo-btn-step" onClick={() => onBumpRaids(5)}>
            +5
          </button>
          <button className="pgo-btn-step" onClick={() => onBumpRaids(10)}>
            +10
          </button>
        </div>
      </div>

      {CHECK_STAT_CONFIG.map((s) => (
        <div
          key={s.key}
          className={`pgo-toggle-card${account.dashboard[s.key] ? ' on' : ''}`}
          onClick={() => onToggleCheck(s.key)}
        >
          <div className="pgo-stat-icon">{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div className="pgo-stat-label">{s.label}</div>
            <div className="pgo-toggle-sub">
              {account.dashboard[s.key] ? 'Done today ✓' : 'Not done today'}
            </div>
          </div>
          <div className="pgo-switch" />
        </div>
      ))}
    </div>
  );
}
