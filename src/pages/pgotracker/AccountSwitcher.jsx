import { typeColorFor } from './pgoConfig';

export default function AccountSwitcher({ accounts, activeAccountId, onSelect, onAdd }) {
  return (
    <div className="pgo-account-scroller">
      {accounts.map((a, i) => {
        const type = typeColorFor(i);
        const active = a.id === activeAccountId;
        return (
          <button
            key={a.id}
            className={`pgo-acc-pill${active ? ' active' : ''}`}
            style={{ '--pgo-acc-color': type.bg }}
            onClick={() => onSelect(a.id)}
          >
            {a.name}
            {a.dashboard.research && <span className="pgo-acc-research-dot" />}
          </button>
        );
      })}
      <button className="pgo-acc-add" onClick={onAdd} title="Add account" aria-label="Add account">
        +
      </button>
    </div>
  );
}
