import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useEft } from '../eftContext';
import {
  stationKey, maxLevelOf, currentLevelOf, targetLevelOf,
  pendingLevels, buildShoppingList, stationProgress, upgradeCandidates,
} from '../eftHideoutLogic';
import { Stat, Bar, Seg, Panel, fmtShort, fmtDuration } from '../EftBits';

export default function HideoutView() {
  const {
    stations, items, levels, targets, disabled, inventory, profile, prefs,
    update, setPref, status, hasPrices,
  } = useEft();

  const [search, setSearch] = useState('');

  const ctx = { stations, levels, targets, disabled, inventory, profile, items };

  const pending = useMemo(
    () => pendingLevels(stations, {
      levels, targets, disabled, scope: prefs.scope, soloStation: prefs.soloStation,
    }),
    [stations, levels, targets, disabled, prefs.scope, prefs.soloStation],
  );

  const { totals } = useMemo(
    () => buildShoppingList(pending, items, inventory),
    [pending, items, inventory],
  );

  const candidates = useMemo(() => upgradeCandidates(stations, ctx), [stations, levels, targets, disabled, inventory, profile, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const candidateByKey = useMemo(
    () => new Map(candidates.map((c) => [stationKey(c.station), c])),
    [candidates],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? stations.filter((s) => s.name.toLowerCase().includes(q)) : stations;
  }, [stations, search]);

  const setLevel = (key, level) => update('levels', (prev) => ({ ...prev, [key]: level }));

  const setTarget = (key, level) =>
    update('targets', (prev) => {
      const next = { ...prev };
      if (level === null) delete next[key];
      else next[key] = level;
      return next;
    });

  const toggleDisabled = (key) =>
    update('disabled', (prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleSolo = (key) => setPref('soloStation', prefs.soloStation === key ? null : key);

  const complete = stations.filter((s) => {
    const p = stationProgress(s, { levels, targets, inventory });
    return p.complete;
  }).length;

  const readyCount = candidates.filter((c) => c.ready).length;
  const totalTime = pending.reduce((n, p) => n + (p.level.constructionTime || 0), 0);

  if (!stations.length) {
    return <div className="eft-empty">{status.loading ? 'Loading hideout data…' : 'No hideout data available.'}</div>;
  }

  return (
    <>
      <div className="eft-stats">
        <Stat label="Stations maxed" value={`${complete}/${stations.length}`} />
        <Stat label="Buildable now" value={readyCount} tone={readyCount ? 'green' : undefined}
          sub="all requirements met" />
        <Stat label="Items short" value={totals.unitsShort.toLocaleString('en-US')}
          sub={`${totals.items} distinct`} />
        <Stat label="Still to buy" value={fmtShort(totals.cost)} tone="gold"
          sub={hasPrices ? 'at current flea prices' : 'no prices loaded'} />
        <Stat label="Build time" value={fmtDuration(totalTime)} sub="sum of pending upgrades" />
        <Stat label="Progress" value={`${totals.percent}%`}
          tone={totals.percent >= 100 ? 'green' : undefined} sub="of items in scope" />
      </div>

      <Panel
        title="Scope"
        actions={(
          <>
            <input
              className="eft-input"
              placeholder="Filter stations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 170 }}
            />
            <button type="button" className="eft-btn eft-btn-sm"
              onClick={() => update('disabled', [])}>
              Enable all
            </button>
            <button type="button" className="eft-btn eft-btn-sm"
              onClick={() => update('disabled', stations.map(stationKey))}>
              Disable all
            </button>
            {prefs.soloStation ? (
              <button type="button" className="eft-btn eft-btn-sm eft-is-on"
                onClick={() => setPref('soloStation', null)}>
                Clear solo
              </button>
            ) : null}
          </>
        )}
      >
        <div className="eft-controls">
          <div className="eft-field">
            <span className="eft-label">Shopping list covers</span>
            <Seg
              value={prefs.scope}
              onChange={(v) => setPref('scope', v)}
              options={[
                { value: 'all', label: 'Everything remaining', title: 'Every level up to each station’s target' },
                { value: 'next', label: 'Next level only', title: 'Only each station’s very next level' },
              ]}
            />
          </div>
          <div className="eft-note" style={{ maxWidth: 420 }}>
            {prefs.soloStation
              ? 'Soloed to one station — only that station counts toward the list.'
              : `${stations.length - disabled.length} of ${stations.length} stations included.`}
          </div>
        </div>
      </Panel>

      <div className="eft-station-grid">
        {visible.map((station) => {
          const key = stationKey(station);
          const max = maxLevelOf(station);
          const current = currentLevelOf(station, levels);
          const target = targetLevelOf(station, targets);
          const off = disabled.includes(key);
          const solo = prefs.soloStation === key;
          const progress = stationProgress(station, { levels, targets, inventory });
          const cand = candidateByKey.get(key);

          const classes = ['eft-station'];
          if (progress.complete) classes.push('eft-is-complete');
          else if (cand?.ready) classes.push('eft-is-ready');
          if (off && !solo) classes.push('eft-is-off');
          if (solo) classes.push('eft-is-solo');

          return (
            <div key={key} className={classes.join(' ')}>
              <div className="eft-station-top">
                {station.imageLink ? (
                  <img className="eft-station-img" src={station.imageLink} alt="" loading="lazy"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                ) : null}
                <Link to={`/EFTsh/station/${key}`} className="eft-station-name"
                  style={{ textDecoration: 'none' }}>
                  {station.name}
                </Link>
                <div className="eft-station-tools">
                  <button
                    type="button"
                    className="eft-iconbtn"
                    title={solo ? 'Stop soloing this station' : 'Show only this station'}
                    onClick={() => toggleSolo(key)}
                    style={solo ? { color: 'var(--eft-gold)', borderColor: 'var(--eft-gold)' } : undefined}
                  >
                    ◎
                  </button>
                  <button
                    type="button"
                    className="eft-iconbtn"
                    title={off ? 'Include in shopping list' : 'Exclude from shopping list'}
                    onClick={() => toggleDisabled(key)}
                  >
                    {off ? '☒' : '☑'}
                  </button>
                </div>
              </div>

              <div>
                <div className="eft-label" style={{ marginBottom: 3 }}>Current level</div>
                <div className="eft-levelpick">
                  {Array.from({ length: max + 1 }, (_, n) => {
                    const cls = [];
                    if (n === current) cls.push('eft-is-current');
                    else if (n > current && n <= target) cls.push('eft-is-planned');
                    else if (n > target) cls.push('eft-is-beyond');
                    return (
                      <button
                        key={n}
                        type="button"
                        className={cls.join(' ')}
                        onClick={() => setLevel(key, n)}
                        title={n === 0 ? 'Not built' : `Level ${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="eft-controls" style={{ gap: 8 }}>
                <div className="eft-field">
                  <span className="eft-label">Target</span>
                  <select
                    className="eft-select"
                    value={targets[key] ?? ''}
                    onChange={(e) => setTarget(key, e.target.value === '' ? null : Number(e.target.value))}
                    style={{ padding: '2px 6px' }}
                  >
                    <option value="">Max ({max})</option>
                    {Array.from({ length: max + 1 }, (_, n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 90 }}>
                  <div className="eft-station-meta" style={{ marginBottom: 3 }}>
                    <span>{progress.complete ? 'Target reached' : `${progress.percent}% stocked`}</span>
                    <span>{current}/{target}</span>
                  </div>
                  <Bar percent={progress.percent} />
                </div>
              </div>

              {cand && !progress.complete ? (
                <div className="eft-blockchips">
                  {cand.ready ? (
                    <span className="eft-chip eft-is-met">Ready to build</span>
                  ) : (
                    cand.blockers.slice(0, 4).map((b, i) => (
                      <span key={`${b.kind}-${b.label}-${i}`}
                        className={`eft-chip ${b.kind === 'item' ? '' : 'eft-is-unmet'}`}>
                        {b.kind === 'item' ? `${b.have}/${b.need} ${b.label}` : b.label}
                      </span>
                    ))
                  )}
                  {cand.blockers.length > 4 ? (
                    <span className="eft-chip">+{cand.blockers.length - 4} more</span>
                  ) : null}
                </div>
              ) : null}

              <div className="eft-station-meta">
                <span>{progress.complete ? '—' : fmtShort(cand?.remainingCost ?? 0)}</span>
                <span>{cand ? fmtDuration(cand.constructionTime) : 'complete'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
