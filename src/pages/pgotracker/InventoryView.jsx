import { useState } from 'react';
import { ITEM_CONFIG, STEPS } from './pgoConfig';

function ItemRow({ item, count, step, onBump, onSet }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(count);

  function commit() {
    const n = Math.max(0, parseInt(draft, 10) || 0);
    onSet(n);
    setEditing(false);
  }

  return (
    <div className="pgo-inv-item">
      <div className="pgo-inv-icon">{item.icon}</div>
      <div className="pgo-inv-label">{item.label}</div>
      {editing ? (
        <input
          className="pgo-inv-value-input"
          type="number"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <span
          className="pgo-inv-value"
          onClick={() => {
            setDraft(count);
            setEditing(true);
          }}
        >
          {count}
        </span>
      )}
      <div className="pgo-inv-btns">
        <button onClick={() => onBump(-step)}>−</button>
        <button className="plus" onClick={() => onBump(step)}>
          +
        </button>
      </div>
    </div>
  );
}

export default function InventoryView({ account, step, onStepChange, onBump, onSet }) {
  return (
    <div className="pgo-inventory-bezel">
      <div className="pgo-inventory-screen">
        <div className="pgo-scanlines" />
        <div className="pgo-section-heading">
          <h2>Bag</h2>
          <span className="pgo-meta">{account.name}</span>
        </div>

        <div className="pgo-step-toggle">
          {STEPS.map((s) => (
            <button
              key={s}
              className={step === s ? 'active' : ''}
              onClick={() => onStepChange(s)}
            >
              +{s}
            </button>
          ))}
        </div>

        <div className="pgo-inv-rows">
          {ITEM_CONFIG.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              count={account.inventory[item.key]}
              step={step}
              onBump={(delta) => onBump(item.key, delta)}
              onSet={(n) => onSet(item.key, n)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
