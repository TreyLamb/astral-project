const TABS = [
  { key: 'dashboard', label: 'Acc Dash' },
  { key: 'main', label: 'Overall' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'bulk', label: 'Bulk' },
];

export default function ViewTabs({ activeView, onChange }) {
  return (
    <div className="pgo-view-tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`pgo-view-tab${activeView === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
