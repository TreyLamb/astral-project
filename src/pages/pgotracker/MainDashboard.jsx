import { CHECK_STAT_CONFIG, RAID_STAT, typeColorFor } from './pgoConfig';

export default function MainDashboard({ accounts }) {
  return (
    <div>
      <div className="pgo-section-heading">
        <h2>{RAID_STAT.label}</h2>
        <span className="pgo-meta">{accounts.length} trainer{accounts.length === 1 ? '' : 's'}</span>
      </div>
      <div className="pgo-raid-list">
        <div className="pgo-raid-list-inner">
          {accounts.map((a, i) => (
            <div key={a.id} className="pgo-raid-list-row" style={{ '--pgo-acc-color': typeColorFor(i).bg }}>
              <span className="pgo-raid-list-name">{a.name}</span>
              <span className="pgo-raid-list-count">{a.dashboard[RAID_STAT.key]}</span>
            </div>
          ))}
        </div>
      </div>

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
