import { CHECK_STAT_CONFIG } from './pgoConfig';

export default function AccountDashboard({ account, onToggleCheck, onResetDay }) {
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
