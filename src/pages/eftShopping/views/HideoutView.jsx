import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useEft } from '../eftContext';
import {
  stationKey, maxLevelOf, currentLevelOf, targetLevelOf,
  stationProgress, upgradeCandidates, itemReqsOf, searchItemNeeds,
} from '../eftHideoutLogic';
import { buildCraftIndex } from '../eftCraftGraph';
import { Seg, Panel, Counter, fmtDuration } from '../EftBits';
import { itemIcon } from '../eftApi';

// What the grid is allowed to show. These are predicates over a station's
// derived state, not a text search — picking "ready to build" is a question
// about the hideout, which typing a name can never answer.
const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready to build' },
  { value: 'unbuilt', label: 'Not maxed' },
  { value: 'maxed', label: 'Maxed' },
  { value: 'included', label: 'In shopping list' },
  { value: 'excluded', label: 'Excluded' },
];

function matchesView(view, { progress, cand, off }) {
  if (view === 'ready') return !!cand?.ready && !progress.complete;
  if (view === 'unbuilt') return !progress.complete;
  if (view === 'maxed') return progress.complete;
  if (view === 'included') return !off;
  if (view === 'excluded') return off;
  return true;
}

/**
 * The station filter. Replaces a text box plus two bulk buttons: those could
 * only answer "which stations are named X", never "which ones am I actually
 * working on", and the bulk buttons were floating loose in the header.
 */
function StationFilter({
  stations, rows, hidden, setHidden, view, setView, onIncludeAll, onExcludeAll, includedCount,
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const shown = rows.filter((r) => r.visible).length;

  return (
    <div className="eft-filter" ref={boxRef}>
      <button
        type="button"
        className={`eft-btn eft-btn-sm${hidden.length || view !== 'all' ? ' eft-is-on' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Filter ▾ <span className="eft-filter-count">{shown}/{stations.length}</span>
      </button>

      {open ? (
        <div className="eft-filter-menu">
          <div className="eft-filter-section">
            <div className="eft-label">Show</div>
            <div className="eft-filter-views">
              {VIEWS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  className={`eft-btn eft-btn-sm${view === v.value ? ' eft-is-on' : ''}`}
                  onClick={() => setView(v.value)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="eft-filter-section">
            <div className="eft-filter-head">
              <div className="eft-label">Stations</div>
              <div className="eft-filter-bulk">
                <button type="button" className="eft-btn eft-btn-sm" onClick={() => setHidden([])}>
                  Show all
                </button>
                <button
                  type="button"
                  className="eft-btn eft-btn-sm"
                  onClick={() => setHidden(stations.map(stationKey))}
                >
                  Hide all
                </button>
              </div>
            </div>
            <div className="eft-filter-list">
              {rows.map((r) => (
                <label key={r.key} className="eft-filter-row">
                  <input
                    type="checkbox"
                    checked={!hidden.includes(r.key)}
                    onChange={() => setHidden(hidden.includes(r.key)
                      ? hidden.filter((k) => k !== r.key)
                      : [...hidden, r.key])}
                  />
                  <span className="eft-filter-name">{r.station.name}</span>
                  <span className="eft-filter-lv">{r.current}/{r.target}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="eft-filter-section">
            <div className="eft-filter-head">
              <div className="eft-label">Shopping list — {includedCount} of {stations.length} counted</div>
            </div>
            <div className="eft-filter-bulk">
              <button type="button" className="eft-btn eft-btn-sm" onClick={onIncludeAll}>Include all</button>
              <button type="button" className="eft-btn eft-btn-sm" onClick={onExcludeAll}>Exclude all</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * "Is this needed for anything, now or later?" — the question you actually ask
 * standing in front of a full stash. Searches every station level in the
 * hideout, not just the ones inside the current scope, because an item wanted
 * by an excluded station is still an item you must not sell.
 */
function ItemSearch({ stations, items, levels, targets, inventory, craftIndex, setHave }) {
  const [query, setQuery] = useState('');
  const barRef = useRef(null);
  const modalRef = useRef(null);
  const wasOpen = useRef(false);

  const rows = useMemo(
    () => searchItemNeeds(stations, items, { levels, targets, inventory }, query, {
      craftIndex, limit: 40,
    }),
    [stations, items, levels, targets, inventory, query, craftIndex],
  );

  const short = query.trim().length === 1;
  const open = query.trim().length > 0;

  // Typing hands focus over to the modal's own field so the sentence you are
  // part-way through keeps going, and closing hands it back to the bar. Guarded
  // on the transition so it never steals focus mid-typing.
  useEffect(() => {
    if (open && !wasOpen.current && modalRef.current) {
      const el = modalRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    } else if (!open && wasOpen.current) {
      barRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setQuery(''); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const field = (ref, extra) => (
    <input
      ref={ref}
      className={`eft-input eft-needsearch-input${extra || ''}`}
      value={query}
      placeholder="Do I need this? Search any item…"
      onChange={(e) => setQuery(e.target.value)}
    />
  );

  return (
    <div className="eft-needsearch">
      {field(barRef)}

      {open ? (
        <div
          className="eft-modal-back eft-needmodal-back"
          role="dialog"
          aria-modal="true"
          aria-label="Item search"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setQuery(''); }}
        >
          <div className="eft-needmodal">
            <header className="eft-needmodal-head">
              {field(modalRef, ' eft-is-big')}
              <span className="eft-needmodal-count">
                {rows.length ? `${rows.length} match${rows.length === 1 ? '' : 'es'}` : ''}
              </span>
              <button type="button" className="eft-btn eft-btn-sm" onClick={() => setQuery('')}>
                Close
              </button>
            </header>

            {!rows.length ? (
              <div className="eft-needmodal-empty">
                {short ? 'Keep typing…' : `Nothing in the hideout data matches “${query.trim()}”.`}
              </div>
            ) : (
              <div className="eft-needsearch-results">
                {rows.map((row) => (
                  <div key={row.itemId} className={`eft-need${row.wanted ? '' : ' eft-is-safe'}`}>
                    <img
                      className="eft-station-itemicon"
                      src={itemIcon(row.itemId)}
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                    <div className="eft-need-body">
                      <div className="eft-need-head">
                        <span className="eft-need-name">{row.name}</span>
                        {row.totalOutstanding ? (
                          <span className="eft-chip eft-is-unmet">
                            need {row.totalOutstanding}
                            {row.needNow ? ` · ${row.needNow} for a next level` : ''}
                          </span>
                        ) : (
                          <span className="eft-chip eft-is-met">
                            {row.usedInCrafts ? 'not needed for a build' : 'safe to sell'}
                          </span>
                        )}
                        {row.usedInCrafts ? (
                          <Link className="eft-chip eft-is-info" to={`/EFTsh/crafts?item=${row.itemId}`}>
                            used in {row.usedInCrafts} recipe{row.usedInCrafts === 1 ? '' : 's'} ↗
                          </Link>
                        ) : null}
                        {row.madeByCrafts ? (
                          <Link className="eft-chip" to={`/EFTsh/crafts?item=${row.itemId}`}>craftable ↗</Link>
                        ) : null}
                      </div>

                      {row.outstanding.length ? (
                        <div className="eft-need-where">
                          {row.outstanding.map((n) => (
                            <Link
                              key={`${n.stationKey}-${n.level}`}
                              to={`/EFTsh/station/${n.stationKey}`}
                              className={`eft-need-chip eft-is-${n.when}`}
                              title={n.beyondTarget
                                ? `Past your current target for ${n.stationName}`
                                : `${n.stationName} level ${n.level}`}
                            >
                              <b>{n.count}×</b> {n.stationName} {n.level}
                              {n.when === 'now' ? <em>now</em> : null}
                              {n.beyondTarget ? <em className="eft-is-faint">past target</em> : null}
                              {n.foundInRaid ? <em className="eft-is-fir">FIR</em> : null}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="eft-note">
                          {row.spent
                            ? `Only wanted by levels you have already built (${row.spent} spent).`
                            : 'No hideout station wants this at any level.'}
                        </div>
                      )}
                    </div>

                    <div className="eft-need-count">
                      <span className="eft-station-itemneed">
                        {row.have}{row.totalOutstanding ? `/${row.totalOutstanding}` : ''}
                      </span>
                      <Counter value={row.have} onChange={(n) => setHave(row.itemId, n)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The have-counters for one station, folded away by default. This is where the
 * old Stash tab went: counting what you own only ever made sense next to the
 * station that wants it, not on a separate screen you had to go and find.
 */
function StationItems({ station, current, target, items, inventory, setHave }) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const byItem = new Map();
    for (const lv of station.levels) {
      if (lv.level <= current || lv.level > target) continue;
      for (const req of itemReqsOf(lv)) {
        const prev = byItem.get(req.itemId);
        if (prev) prev.need += req.count;
        else byItem.set(req.itemId, { itemId: req.itemId, need: req.count, fir: !!req.foundInRaid });
      }
    }
    return [...byItem.values()]
      .map((r) => ({ ...r, name: items[r.itemId]?.name || r.itemId }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [station, current, target, items]);

  if (!rows.length) return null;

  const short = rows.filter((r) => (inventory[r.itemId] ?? 0) < r.need).length;

  return (
    <div className="eft-station-items">
      <button type="button" className="eft-station-itemstoggle" onClick={() => setOpen((o) => !o)}>
        {open ? '−' : '+'} Items ({rows.length - short}/{rows.length} ready)
      </button>
      {open ? (
        <ul className="eft-station-itemlist">
          {rows.map((r) => {
            const have = Number(inventory[r.itemId] ?? 0);
            return (
              <li key={r.itemId} className={have >= r.need ? 'eft-is-done' : ''}>
                <img
                  className="eft-station-itemicon"
                  src={itemIcon(r.itemId)}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
                <span className="eft-station-itemname" title={r.name}>
                  {r.name}
                  {r.fir ? <span className="eft-chip eft-is-fir">FIR</span> : null}
                </span>
                <span className="eft-station-itemneed">{have}/{r.need}</span>
                <Counter value={have} onChange={(n) => setHave(r.itemId, n)} max={r.need} />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function HideoutView() {
  const {
    stations, items, levels, targets, disabled, inventory, profile, prefs,
    update, setPref, status, data,
  } = useEft();

  const ctx = { stations, levels, targets, disabled, inventory, profile, items };

  // Only so the search can also answer "…or is it a crafting ingredient?"
  const craftIndex = useMemo(() => buildCraftIndex(data), [data]);

  const candidates = useMemo(() => upgradeCandidates(stations, ctx), [stations, levels, targets, disabled, inventory, profile, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const candidateByKey = useMemo(
    () => new Map(candidates.map((c) => [stationKey(c.station), c])),
    [candidates],
  );

  // Memoised because the `|| []` fallback would otherwise be a fresh array on
  // every render and re-run the row derivation below for nothing.
  const hidden = useMemo(() => prefs.hiddenStations || [], [prefs.hiddenStations]);
  const view = prefs.stationView || 'all';

  const rows = useMemo(() => stations.map((station) => {
    const key = stationKey(station);
    const progress = stationProgress(station, { levels, targets, inventory });
    const cand = candidateByKey.get(key);
    const off = disabled.includes(key);
    return {
      key,
      station,
      progress,
      cand,
      off,
      current: currentLevelOf(station, levels),
      target: targetLevelOf(station, targets),
      max: maxLevelOf(station),
      visible: !hidden.includes(key) && matchesView(view, { progress, cand, off }),
    };
  }), [stations, levels, targets, inventory, disabled, candidateByKey, hidden, view]);

  const setLevel = (key, level) => update('levels', (prev) => ({ ...prev, [key]: level }));

  const setTarget = (key, level) =>
    update('targets', (prev) => {
      const next = { ...prev };
      if (level === null) delete next[key];
      else next[key] = level;
      return next;
    });

  const setHave = (itemId, n) =>
    update('inventory', (prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[itemId];
      else next[itemId] = n;
      return next;
    });

  const toggleDisabled = (key) =>
    update('disabled', (prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleSolo = (key) => setPref('soloStation', prefs.soloStation === key ? null : key);

  if (!stations.length) {
    return <div className="eft-empty">{status.loading ? 'Loading hideout data…' : 'No hideout data available.'}</div>;
  }

  const visible = rows.filter((r) => r.visible);

  return (
    <div className="eft-hideout">
      <ItemSearch
        stations={stations}
        items={items}
        levels={levels}
        targets={targets}
        inventory={inventory}
        craftIndex={craftIndex}
        setHave={setHave}
      />

      <Panel
        title="Scope"
        actions={(
          <>
            <StationFilter
              stations={stations}
              rows={rows}
              hidden={hidden}
              setHidden={(next) => setPref('hiddenStations', next)}
              view={view}
              setView={(v) => setPref('stationView', v)}
              includedCount={stations.length - disabled.length}
              onIncludeAll={() => update('disabled', [])}
              onExcludeAll={() => update('disabled', stations.map(stationKey))}
            />
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
          <div className="eft-note">
            {prefs.soloStation
              ? 'Soloed to one station — only that station counts toward the list.'
              : `${stations.length - disabled.length} of ${stations.length} stations included.`}
          </div>
        </div>
      </Panel>

      <div className="eft-station-grid">
        {visible.map(({ key, station, progress, cand, off, current, target, max }) => {
          const solo = prefs.soloStation === key;

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
                <span className="eft-chip">{cand ? fmtDuration(cand.constructionTime) : 'complete'}</span>
              </div>

              <StationItems
                station={station}
                current={current}
                target={target}
                items={items}
                inventory={inventory}
                setHave={setHave}
              />

              {cand && !progress.complete ? (
                <div className="eft-blockchips">
                  {cand.ready ? (
                    <span className="eft-chip eft-is-met">Ready to build</span>
                  ) : (
                    cand.blockers.filter((b) => b.kind !== 'item').slice(0, 4).map((b, i) => (
                      <span key={`${b.kind}-${b.label}-${i}`} className="eft-chip eft-is-unmet">
                        {b.label}
                      </span>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!visible.length ? (
        <div className="eft-empty">Nothing matches this filter.</div>
      ) : null}
    </div>
  );
}
