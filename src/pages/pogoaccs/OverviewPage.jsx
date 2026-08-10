import { Link } from 'react-router-dom';
import { usePogoAccs } from './pogoaccsContext';

export default function OverviewPage() {
  const { accounts, boxes, megas } = usePogoAccs();

  if (accounts.length === 0) {
    return (
      <div className="pgoa-panel pgoa-empty">
        No accounts yet — create them in <Link className="pgoa-link" to="/POGO">POGO Tracker</Link>.
      </div>
    );
  }

  return (
    <div className="pgoa-cards">
      {accounts.map((account) => {
        const entries = boxes[account.id]?.entries || [];
        const pokeboxCount = entries.reduce((sum, e) => sum + (e.count || 0), 0);
        const megaCount = Object.keys(megas[account.id]?.megas || {}).length;

        return (
          <div key={account.id} className="pgoa-account-card">
            <h3 className="pgoa-card-title">{account.name}</h3>
            <div className="pgoa-stat-row">
              <span className="pgoa-stat-label">Pokébox</span>
              <span className="pgoa-stat-value">{pokeboxCount}</span>
            </div>
            <div className="pgoa-stat-row">
              <span className="pgoa-stat-label">Megas</span>
              <span className="pgoa-stat-value">{megaCount}</span>
            </div>
            <div className="pgoa-card-links">
              <Link className="pgoa-link" to={`/POGO-ACCS/box/${account.id}`}>Open Box</Link>
              <Link className="pgoa-link" to="/POGO-ACCS/megas">Megas</Link>
              <Link className="pgoa-link" to="/POGO-ACCS/raids">Raids</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
