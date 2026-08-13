import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useEft } from '../eftContext';
import {
  stationKey, maxLevelOf, currentLevelOf, targetLevelOf,
  levelRequirements, unitCost,
} from '../eftHideoutLogic';
import { Stat, Panel, Bar, Counter, ItemCell, useItemDetail, fmtRub, fmtShort, fmtDuration } from '../EftBits';

export default function StationView() {
  const { stationKey: key } = useParams();
  const {
    stations, items, levels, targets, disabled, inventory, profile, update, setPref, prefs,
  } = useEft();

  const { openItem, detailNode } = useItemDetail();

  const station = useMemo(
    () => stations.find((s) => stationKey(s) === key),
    [stations, key],
  );

  if (!station) {
    return (
      <div className="eft-empty">
        No station called “{key}”. <Link to="/EFTsh" style={{ color: 'var(--eft-gold)' }}>Back to the hideout</Link>.
      </div>
    );
  }

  const ctx = { stations, levels, targets, disabled, inventory, profile, items };
  const max = maxLevelOf(station);
  const current = currentLevelOf(station, levels);
  const target = targetLevelOf(station, targets);
  const off = disabled.includes(key);

  const setLevel = (n) => update('levels', (prev) => ({ ...prev, [key]: n }));

  const setHave = (itemId, n) =>
    update('inventory', (prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[itemId];
      else next[itemId] = n;
      return next;
    });

  const remainingCost = station.levels
    .filter((lv) => lv.level > current && lv.level <= target)
    .reduce((sum, lv) => sum + lv.itemRequirements.reduce(
      (n, r) => n + unitCost(items[r.itemId]) * Math.max(0, r.count - (inventory[r.itemId] ?? 0)), 0,
    ), 0);

  const remainingTime = station.levels
    .filter((lv) => lv.level > current && lv.level <= target)
    .reduce((n, lv) => n + (lv.constructionTime || 0), 0);

  return (
    <>
      <div className="eft-controls" style={{ marginBottom: 14 }}>
        <Link to="/EFTsh" className="eft-btn eft-btn-sm" style={{ textDecoration: 'none' }}>← Hideout</Link>
        <button
          type="button"
          className={`eft-btn eft-btn-sm${prefs.soloStation === key ? ' eft-is-on' : ''}`}
          onClick={() => setPref('soloStation', prefs.soloStation === key ? null : key)}
        >
          {prefs.soloStation === key ? 'Soloed' : 'Solo this station'}
        </button>
        <button
          type="button"
          className="eft-btn eft-btn-sm"
          onClick={() => update('disabled', (prev) =>
            (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))}
        >
          {off ? 'Include in list' : 'Exclude from list'}
        </button>
      </div>

      <div className="eft-stats">
        <Stat label={station.name} value={`Lv ${current}`} sub={`of ${max}`} />
        <Stat label="Target" value={target === max ? `Max (${max})` : target} />
        <Stat label="Cost to target" value={fmtShort(remainingCost)} tone="gold" />
        <Stat label="Build time left" value={fmtDuration(remainingTime)} />
      </div>

      <Panel title="Set current level">
        <div className="eft-levelpick">
          {Array.from({ length: max + 1 }, (_, n) => (
            <button
              key={n}
              type="button"
              className={n === current ? 'eft-is-current' : (n <= target ? 'eft-is-planned' : 'eft-is-beyond')}
              onClick={() => setLevel(n)}
              style={{ minWidth: 34, padding: '5px 0' }}
            >
              {n}
            </button>
          ))}
        </div>
      </Panel>

      {station.levels.map((lv) => {
        const built = lv.level <= current;
        const reqs = levelRequirements(station, lv, ctx);
        const itemReqs = reqs.filter((r) => r.kind === 'item');
        const otherReqs = reqs.filter((r) => r.kind !== 'item');
        const met = itemReqs.filter((r) => r.met).length;
        const pct = itemReqs.length ? Math.round((met / itemReqs.length) * 100) : 100;
        const crafts = (station.crafts || []).filter((c) => c.level === lv.level);

        return (
          <Panel
            key={lv.level}
            title={`Level ${lv.level}${built ? ' — built' : ''}`}
            actions={(
              <>
                <span className="eft-chip">{fmtDuration(lv.constructionTime)}</span>
                {!built ? <span className="eft-chip eft-is-info">{met}/{itemReqs.length} items ready</span> : null}
              </>
            )}
          >
            {lv.description ? <p className="eft-note" style={{ marginTop: 0 }}>{lv.description}</p> : null}

            {otherReqs.length ? (
              <div className="eft-blockchips" style={{ marginBottom: 12 }}>
                {otherReqs.map((r, i) => (
                  <span key={`${r.kind}-${i}`} className={`eft-chip ${r.met ? 'eft-is-met' : 'eft-is-unmet'}`}>
                    {r.met ? '✓' : '✕'} {r.label}
                    {r.kind !== 'sequence' ? ` (have ${r.have})` : ''}
                  </span>
                ))}
              </div>
            ) : null}

            {itemReqs.length ? (
              <>
                {!built ? <div style={{ marginBottom: 10 }}><Bar percent={pct} /></div> : null}
                <div className="eft-tablewrap">
                  <table className="eft-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="eft-num-cell">Need</th>
                        <th className="eft-num-cell">Have</th>
                        <th className="eft-num-cell">Each</th>
                        <th className="eft-num-cell">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemReqs.map((r) => {
                        const item = items[r.itemId];
                        const each = unitCost(item);
                        return (
                          <tr key={r.itemId} className={r.met ? 'eft-is-done' : ''}>
                            <td>
                              <ItemCell
                                item={item}
                                itemId={r.itemId}
                                onClick={item ? () => openItem(item) : undefined}
                                sub={r.foundInRaid ? <span className="eft-chip eft-is-fir">FIR</span> : null}
                              />
                            </td>
                            <td className="eft-num-cell">{r.need}</td>
                            <td className="eft-num-cell">
                              <Counter value={r.have} onChange={(n) => setHave(r.itemId, n)} />
                            </td>
                            <td className="eft-num-cell">{each ? fmtRub(each) : '—'}</td>
                            <td className="eft-num-cell">
                              {each ? fmtShort(each * Math.max(0, r.need - r.have)) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="eft-note">No materials required.</div>
            )}

            {lv.bonuses?.length ? (
              <>
                <div className="eft-label" style={{ margin: '14px 0 6px' }}>What this level gives you</div>
                <div className="eft-blockchips">
                  {lv.bonuses.map((b, i) => (
                    <span key={`${b.type}-${i}`} className="eft-chip eft-is-info">
                      {b.name || b.type}
                      {b.value ? ` ${b.value > 0 && b.type !== 'StashSize' ? '+' : ''}${b.value}` : ''}
                      {b.skillName ? ` (${b.skillName})` : ''}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            {crafts.length ? (
              <>
                <div className="eft-label" style={{ margin: '14px 0 6px' }}>Crafts unlocked ({crafts.length})</div>
                <div className="eft-tablewrap">
                  <table className="eft-table">
                    <thead>
                      <tr>
                        <th>Makes</th>
                        <th>From</th>
                        <th className="eft-num-cell">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crafts.map((c) => (
                        <tr key={c.id}>
                          <td>{c.rewardItems.map((r) => `${r.count} x ${r.name}`).join(', ')}</td>
                          <td className="eft-note">
                            {c.requiredItems.map((r) => `${r.count} x ${r.name}`).join(', ')}
                          </td>
                          <td className="eft-num-cell">{fmtDuration(c.duration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </Panel>
        );
      })}

      {detailNode}
    </>
  );
}
