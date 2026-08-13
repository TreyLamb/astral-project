import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useEft } from '../eftContext';
import { stationKey, upgradeCandidates, suggestedBuildOrder } from '../eftHideoutLogic';
import { Stat, Panel, fmtShort, fmtDuration } from '../EftBits';

export default function BuildOrderView() {
  const { stations, items, levels, targets, disabled, inventory, profile } = useEft();

  const ctx = { stations, levels, targets, disabled, inventory, profile, items };

  const candidates = useMemo(
    () => upgradeCandidates(stations, ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stations, levels, targets, disabled, inventory, profile, items],
  );

  const { order, stranded } = useMemo(
    () => suggestedBuildOrder(stations, ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stations, levels, targets, disabled, inventory, profile, items],
  );

  const ready = candidates.filter((c) => c.ready);
  // Everything blocking these is buyable — they only need a shopping trip.
  const shoppingAway = candidates.filter((c) => !c.ready && !c.hardBlocked);
  const gated = candidates.filter((c) => c.hardBlocked);

  const cumulative = [];
  let runningCost = 0;
  let runningTime = 0;
  for (const step of order) {
    runningCost += step.cost;
    runningTime += step.constructionTime || 0;
    cumulative.push({ cost: runningCost, time: runningTime });
  }

  return (
    <>
      <div className="eft-stats">
        <Stat label="Ready now" value={ready.length} tone={ready.length ? 'green' : undefined}
          sub="every requirement met" />
        <Stat label="Just needs shopping" value={shoppingAway.length} tone="gold"
          sub="only items missing" />
        <Stat label="Hard gated" value={gated.length} tone={gated.length ? 'red' : undefined}
          sub="trader / skill / prereq" />
        <Stat label="Planned steps" value={order.length}
          sub={fmtDuration(runningTime)} />
        <Stat label="Plan cost" value={fmtShort(runningCost)} sub="from scratch, ignoring stash" />
      </div>

      <Panel title={`Buildable right now — ${ready.length}`}>
        {!ready.length ? (
          <div className="eft-empty">
            Nothing can be started this second. Check “Just needs shopping” below for what’s closest.
          </div>
        ) : (
          <div className="eft-cols">
            {ready.map((c) => (
              <div key={stationKey(c.station)} className="eft-card" style={{ borderColor: 'var(--eft-green)' }}>
                <h4>
                  <Link to={`/EFTsh/station/${stationKey(c.station)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {c.station.name} → level {c.level.level}
                  </Link>
                </h4>
                <div className="eft-note">
                  Build time {fmtDuration(c.constructionTime)}.
                  {c.level.bonuses?.length ? ` Grants ${c.level.bonuses.length} bonus${c.level.bonuses.length === 1 ? '' : 'es'}.` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={`Only missing items — ${shoppingAway.length}`}>
        {!shoppingAway.length ? (
          <div className="eft-empty">Nothing is waiting purely on loot.</div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Upgrade</th>
                  <th className="eft-num-cell">Still to buy</th>
                  <th>Missing</th>
                </tr>
              </thead>
              <tbody>
                {shoppingAway
                  .sort((a, b) => a.remainingCost - b.remainingCost)
                  .map((c) => (
                    <tr key={stationKey(c.station)}>
                      <td>
                        <Link to={`/EFTsh/station/${stationKey(c.station)}`} style={{ color: 'var(--eft-tan-bright)' }}>
                          {c.station.name} → {c.level.level}
                        </Link>
                      </td>
                      <td className="eft-num-cell">{fmtShort(c.remainingCost)}</td>
                      <td>
                        <div className="eft-blockchips">
                          {c.blockers.map((b, i) => (
                            <span key={`${b.itemId}-${i}`} className="eft-chip">
                              {b.have}/{b.need} {b.label}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={`Blocked by something you can’t buy — ${gated.length}`}>
        {!gated.length ? (
          <div className="eft-empty">No trader, skill or prerequisite gates outstanding.</div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th>Upgrade</th>
                  <th>Gate</th>
                </tr>
              </thead>
              <tbody>
                {gated.map((c) => (
                  <tr key={stationKey(c.station)}>
                    <td>
                      <Link to={`/EFTsh/station/${stationKey(c.station)}`} style={{ color: 'var(--eft-tan-bright)' }}>
                        {c.station.name} → {c.level.level}
                      </Link>
                    </td>
                    <td>
                      <div className="eft-blockchips">
                        {c.blockers
                          .filter((b) => b.kind !== 'item')
                          .map((b, i) => (
                            <span key={`${b.kind}-${i}`} className="eft-chip eft-is-unmet">
                              {b.label} (have {b.have})
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Suggested order">
        <div className="eft-note" style={{ marginBottom: 10 }}>
          Cheapest-first, but never ahead of a prerequisite. Trader and skill gates don’t
          change the order — you can’t reorder your way past them — so they show as warnings
          on the step instead.
        </div>
        {!order.length ? (
          <div className="eft-empty">Every included station is already at its target level.</div>
        ) : (
          <div className="eft-tablewrap">
            <table className="eft-table">
              <thead>
                <tr>
                  <th className="eft-num-cell">#</th>
                  <th>Upgrade</th>
                  <th className="eft-num-cell">Cost</th>
                  <th className="eft-num-cell">Cumulative</th>
                  <th className="eft-num-cell">Build</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {order.map((step, i) => (
                  <tr key={`${stationKey(step.station)}-${step.level.level}`}>
                    <td className="eft-num-cell">{i + 1}</td>
                    <td>
                      <Link to={`/EFTsh/station/${stationKey(step.station)}`} style={{ color: 'var(--eft-tan-bright)' }}>
                        {step.station.name} → {step.level.level}
                      </Link>
                    </td>
                    <td className="eft-num-cell">{fmtShort(step.cost)}</td>
                    <td className="eft-num-cell">{fmtShort(cumulative[i].cost)}</td>
                    <td className="eft-num-cell">{fmtDuration(step.constructionTime)}</td>
                    <td>
                      <div className="eft-blockchips">
                        {step.warnings.map((w, n) => (
                          <span key={`${w.kind}-${n}`} className="eft-chip eft-is-unmet">{w.label}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stranded.length ? (
          <div className="eft-banner" style={{ marginTop: 12 }}>
            <strong>Unreachable with the current plan:</strong>{' '}
            {stranded.map((s) => `${s.station.name} (lv ${s.levels.join(', ')})`).join('; ')}.
            Their prerequisite stations are excluded from the list or capped below the level they need.
          </div>
        ) : null}
      </Panel>
    </>
  );
}
