import { useState } from 'react';
import { useEft } from '../eftContext';
import { Panel, Bar, Stat, Seg, fmtRub } from '../EftBits';

const REFERENCE_RATES = [5000, 8000, 10000, 13000, 15000, 18000, 20000, 25000];
const TONE_OPTIONS = [{ value: 'ok', label: 'OK' }, { value: 'warn', label: 'WARN' }, { value: 'danger', label: 'DANGER' }];

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const pickVerdict = (verdicts, total) => {
  const sorted = [...verdicts].sort((a, b) => a.at - b.at);
  return sorted.reduce((acc, v) => (total >= v.at ? v : acc), sorted[0] || { label: '—', tone: 'ok' });
};

export default function LootCalcView() {
  const { lootCalc, update, prefs, setPref } = useEft();
  const { containers, verdicts, bailThreshold } = lootCalc;
  const bag = lootCalc.bag ?? [];

  const containerId = containers.some((c) => c.id === prefs.lootContainerId) ? prefs.lootContainerId : (containers[0]?.id ?? 'custom');
  const selectedContainer = containers.find((c) => c.id === containerId) || null;
  const isCustom = !selectedContainer;

  const [customSlots, setCustomSlots] = useState(20);
  const [ratePerSlot, setRatePerSlot] = useState(selectedContainer?.avgCostPerSlot || 0);
  const [bagDraft, setBagDraft] = useState({ name: '', value: '', slots: '' });

  const selectContainer = (id) => {
    setPref('lootContainerId', id);
    const c = containers.find((x) => x.id === id);
    if (c) setRatePerSlot(c.avgCostPerSlot);
  };

  const slots = isCustom ? customSlots : selectedContainer.slots;
  const estimatedTotal = ratePerSlot * slots;

  const bagTotal = bag.reduce((s, i) => s + (Number(i.value) || 0), 0);
  const bagSlots = bag.reduce((s, i) => s + (Number(i.slots) || 0), 0);
  const bagRate = bagSlots ? bagTotal / bagSlots : 0;
  const usingBag = bag.length > 0;
  const effectiveTotal = usingBag ? bagTotal : estimatedTotal;

  const verdict = pickVerdict(verdicts, effectiveTotal);
  const bailPct = bailThreshold > 0 ? Math.min(100, (effectiveTotal / bailThreshold) * 100) : 0;

  const setBailThreshold = (v) => update('lootCalc', (prev) => ({ ...prev, bailThreshold: Math.max(0, Number(v) || 0) }));

  const addContainer = () => update('lootCalc', (prev) => ({
    ...prev,
    containers: [...prev.containers, { id: uid(), name: 'New container', slots: 10, avgCostPerSlot: 0, added: true }],
  }));
  const updateContainer = (id, patch) => update('lootCalc', (prev) => ({
    ...prev,
    containers: prev.containers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
  const removeContainer = (id) => {
    update('lootCalc', (prev) => ({ ...prev, containers: prev.containers.filter((c) => c.id !== id) }));
    if (containerId === id) setPref('lootContainerId', null);
  };

  const addVerdict = () => update('lootCalc', (prev) => ({
    ...prev, verdicts: [...prev.verdicts, { at: 0, label: 'New tier', tone: 'ok' }],
  }));
  const updateVerdict = (idx, patch) => update('lootCalc', (prev) => ({
    ...prev, verdicts: prev.verdicts.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
  }));
  const removeVerdict = (idx) => update('lootCalc', (prev) => ({
    ...prev, verdicts: prev.verdicts.filter((_, i) => i !== idx),
  }));

  const addBagItem = () => {
    const name = bagDraft.name.trim();
    if (!name) return;
    update('lootCalc', (prev) => ({
      ...prev,
      bag: [...(prev.bag ?? []), { id: uid(), name, value: Number(bagDraft.value) || 0, slots: Number(bagDraft.slots) || 0 }],
    }));
    setBagDraft({ name: '', value: '', slots: '' });
  };
  const updateBagItem = (id, patch) => update('lootCalc', (prev) => ({
    ...prev, bag: (prev.bag ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }));
  const removeBagItem = (id) => update('lootCalc', (prev) => ({ ...prev, bag: (prev.bag ?? []).filter((i) => i.id !== id) }));

  return (
    <>
      <Panel title="Container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {containers.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`eft-btn eft-btn-sm${c.id === containerId ? ' eft-is-on' : ''}`}
              onClick={() => selectContainer(c.id)}
            >
              {c.name}
              {c.added ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>ADDED</span> : null}
            </button>
          ))}
          <button
            type="button"
            className={`eft-btn eft-btn-sm${isCustom ? ' eft-is-on' : ''}`}
            onClick={() => selectContainer('custom')}
          >
            Custom
          </button>
        </div>

        <div className="eft-controls">
          {isCustom ? (
            <div className="eft-field">
              <label className="eft-label" htmlFor="loot-custom-slots">Custom slots</label>
              <input
                id="loot-custom-slots"
                type="number"
                className="eft-num"
                value={customSlots}
                min={0}
                onChange={(e) => setCustomSlots(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          ) : (
            <Stat label="Slots" value={selectedContainer.slots} />
          )}

          <div className="eft-field">
            <label className="eft-label" htmlFor="loot-rate">₽ per slot (estimate)</label>
            <input
              id="loot-rate"
              type="number"
              className="eft-num"
              value={ratePerSlot}
              min={0}
              onChange={(e) => setRatePerSlot(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="eft-field">
            <label className="eft-label" htmlFor="loot-total">Total value (estimate)</label>
            <input
              id="loot-total"
              type="number"
              className="eft-num"
              value={Math.round(estimatedTotal)}
              min={0}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value) || 0);
                setRatePerSlot(slots > 0 ? v / slots : 0);
              }}
            />
          </div>
        </div>

        <div className="eft-stats" style={{ marginTop: 14 }}>
          <Stat label="Estimated total" value={fmtRub(estimatedTotal)} />
          {usingBag ? <Stat label="Bag total (in use)" value={fmtRub(bagTotal)} tone="gold" /> : null}
          <Stat label="Bail threshold" value={fmtRub(bailThreshold)} />
          <Stat
            label="Verdict basis"
            value={usingBag ? 'Bag tally' : 'Estimate'}
            sub={usingBag ? `${bag.length} item${bag.length === 1 ? '' : 's'} logged` : 'no bag items logged'}
          />
        </div>

        <div style={{ margin: '14px 0 6px' }}>
          <Bar percent={bailPct} />
        </div>
        <div className="eft-note" style={{ marginBottom: 14 }}>
          {fmtRub(effectiveTotal)} of {fmtRub(bailThreshold)} bail threshold ({Math.round(bailPct)}%)
          {usingBag ? ' — using bag tally below.' : ' — using the estimate above (log bag items to use real values instead).'}
        </div>

        <div className={`eft-verdict eft-tone-${verdict.tone}`}>{verdict.label}</div>
      </Panel>

      <Panel title="What's in my bag" actions={<span className="eft-note">Logging items here overrides the estimate above for the verdict.</span>}>
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr><th>Item</th><th>Value</th><th>Slots</th><th /></tr>
            </thead>
            <tbody>
              {bag.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input className="eft-input" value={item.name} onChange={(e) => updateBagItem(item.id, { name: e.target.value })} />
                  </td>
                  <td className="eft-num-cell">
                    <input type="number" className="eft-num" value={item.value} min={0}
                      onChange={(e) => updateBagItem(item.id, { value: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td className="eft-num-cell">
                    <input type="number" className="eft-num-sm" value={item.slots} min={0}
                      onChange={(e) => updateBagItem(item.id, { slots: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <button type="button" className="eft-iconbtn" aria-label={`Remove ${item.name}`} onClick={() => removeBagItem(item.id)}>×</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <input className="eft-input" placeholder="Item name…" value={bagDraft.name}
                    onChange={(e) => setBagDraft((d) => ({ ...d, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBagItem(); }} />
                </td>
                <td className="eft-num-cell">
                  <input type="number" className="eft-num" placeholder="0" value={bagDraft.value}
                    onChange={(e) => setBagDraft((d) => ({ ...d, value: e.target.value }))} />
                </td>
                <td className="eft-num-cell">
                  <input type="number" className="eft-num-sm" placeholder="0" value={bagDraft.slots}
                    onChange={(e) => setBagDraft((d) => ({ ...d, slots: e.target.value }))} />
                </td>
                <td>
                  <button type="button" className="eft-btn eft-btn-sm" onClick={addBagItem}>Add</button>
                </td>
              </tr>
              {!bag.length ? <tr><td colSpan={4} className="eft-empty">Nothing logged yet — the estimate above is driving the verdict.</td></tr> : null}
            </tbody>
          </table>
        </div>

        {bag.length ? (
          <div className="eft-stats" style={{ marginTop: 14 }}>
            <Stat label="Actual total value" value={fmtRub(bagTotal)} />
            <Stat label="Actual slots used" value={bagSlots} />
            <Stat label="Actual ₽/slot" value={fmtRub(bagRate)} />
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Verdict ladder"
        actions={(
          <>
            <div className="eft-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <label className="eft-label" htmlFor="loot-bail">Bail threshold</label>
              <input id="loot-bail" type="number" className="eft-num" value={bailThreshold} min={0}
                onChange={(e) => setBailThreshold(e.target.value)} />
            </div>
            <button type="button" className="eft-btn eft-btn-sm" onClick={addVerdict}>Add tier</button>
          </>
        )}
      >
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr><th>Total value at/above</th><th>Label</th><th>Tone</th><th /></tr>
            </thead>
            <tbody>
              {verdicts.map((v, i) => (
                <tr key={i} className={v.at === verdict.at && v.label === verdict.label ? 'eft-is-done' : ''}>
                  <td className="eft-num-cell">
                    <input type="number" className="eft-num" value={v.at} min={0}
                      onChange={(e) => updateVerdict(i, { at: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <input className="eft-input" value={v.label} onChange={(e) => updateVerdict(i, { label: e.target.value })} />
                  </td>
                  <td>
                    <Seg options={TONE_OPTIONS} value={v.tone} onChange={(tone) => updateVerdict(i, { tone })} />
                  </td>
                  <td>
                    <button type="button" className="eft-iconbtn" aria-label={`Remove ${v.label}`} onClick={() => removeVerdict(i)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Containers" actions={<button type="button" className="eft-btn eft-btn-sm" onClick={addContainer}>Add container</button>}>
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr><th>Name</th><th>Slots</th><th>Avg ₽/slot</th><th /></tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <input className="eft-input" value={c.name} onChange={(e) => updateContainer(c.id, { name: e.target.value })} />
                    {c.added ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>ADDED</span> : null}
                  </td>
                  <td className="eft-num-cell">
                    <input type="number" className="eft-num-sm" value={c.slots} min={0}
                      onChange={(e) => updateContainer(c.id, { slots: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td className="eft-num-cell">
                    <input type="number" className="eft-num" value={c.avgCostPerSlot} min={0}
                      onChange={(e) => updateContainer(c.id, { avgCostPerSlot: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <button type="button" className="eft-iconbtn" aria-label={`Remove ${c.name}`} onClick={() => removeContainer(c.id)}>×</button>
                  </td>
                </tr>
              ))}
              {!containers.length ? <tr><td colSpan={4} className="eft-empty">No containers — add one above.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`₽/slot reference — ${isCustom ? 'custom' : selectedContainer.name} (${slots} slots)`}>
        <div className="eft-tablewrap">
          <table className="eft-table">
            <thead>
              <tr><th>₽ per slot</th><th>Total value</th><th>Verdict</th></tr>
            </thead>
            <tbody>
              {REFERENCE_RATES.map((rate) => {
                const total = rate * slots;
                const v = pickVerdict(verdicts, total);
                return (
                  <tr key={rate} className={rate === ratePerSlot ? 'eft-is-done' : ''}>
                    <td className="eft-num-cell">{fmtRub(rate)}</td>
                    <td className="eft-num-cell">{fmtRub(total)}</td>
                    <td><span className={`eft-chip eft-is-${v.tone === 'ok' ? 'met' : v.tone === 'danger' ? 'unmet' : 'fir'}`}>{v.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
