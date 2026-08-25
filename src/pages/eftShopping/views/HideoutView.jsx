import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useEft } from '../eftContext';
import {
  stationKey, maxLevelOf, currentLevelOf, targetLevelOf,
  stationProgress, upgradeCandidates, itemReqsOf, searchItemNeeds,
} from '../eftHideoutLogic';
import { resetAll } from '../eftStorage';
import { buildCraftIndex } from '../eftCraftGraph';
import { buildQuestIndex, toggleQuestDone } from '../eftQuestLogic';
import { Seg, Panel, Counter, fmtDuration } from '../EftBits';
import { itemIcon } from '../eftApi';
import { QuestChip, QuestList, QuestDetail } from './QuestLookup';

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
  if (view === 'ready') return !!cand?.ready && !progress.maxed;
  if (view === 'unbuilt') return !progress.maxed;
  if (view === 'maxed') return progress.maxed;
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
  onResetAll,
}) {
  const [open, setOpen] = useState(false);
  // 0 = idle, 1 = armed, 2 = asking for the second confirmation. Wiping every
  // level, target and item count is the one irreversible thing this tool can
  // do, so it takes two deliberate clicks and never sits under the cursor.
  const [resetStep, setResetStep] = useState(0);
  const boxRef = useRef(null);

  // Closing always disarms: an armed destructive button must never be sitting
  // there waiting the next time this menu is opened.
  const close = useCallback(() => { setOpen(false); setResetStep(0); }, []);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!boxRef.current?.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open, close]);

  const shown = rows.filter((r) => r.visible).length;

  return (
    <div className="eft-filter" ref={boxRef}>
      <button
        type="button"
        className={`eft-btn eft-btn-sm${hidden.length || view !== 'all' ? ' eft-is-on' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
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

          <div className="eft-filter-danger">
            {resetStep === 0 ? (
              <button
                type="button"
                className="eft-btn eft-btn-sm eft-is-danger"
                onClick={() => setResetStep(1)}
              >
                Reset all
              </button>
            ) : null}

            {resetStep === 1 ? (
              <div className="eft-filter-confirm">
                <p>
                  This erases <strong>everything</strong> — station levels, targets, every item
                  count, your quest ticks, kits and watchlists. It cannot be undone.
                </p>
                <div className="eft-filter-bulk">
                  <button type="button" className="eft-btn eft-btn-sm" onClick={() => setResetStep(0)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="eft-btn eft-btn-sm eft-is-danger"
                    onClick={() => setResetStep(2)}
                  >
                    Yes, reset it
                  </button>
                </div>
              </div>
            ) : null}

            {resetStep === 2 ? (
              <div className="eft-filter-confirm">
                <p><strong>Last chance.</strong> Really wipe all saved progress?</p>
                <div className="eft-filter-bulk">
                  <button type="button" className="eft-btn eft-btn-sm" onClick={() => setResetStep(0)}>
                    No, keep it
                  </button>
                  <button
                    type="button"
                    className="eft-btn eft-btn-sm eft-is-danger"
                    onClick={() => { onResetAll(); close(); }}
                  >
                    Wipe everything
                  </button>
                </div>
              </div>
            ) : null}
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
function ItemSearch({
  stations, items, levels, targets, inventory, craftIndex, questIndex,
  questsDone, setQuestsDone, setHave,
}) {
  const [query, setQuery] = useState('');
  // Which row has its quest drawer open, and which quest (if any) is being read
  // in full on top of it.
  const [openQuests, setOpenQuests] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const barRef = useRef(null);
  const modalRef = useRef(null);
  const wasOpen = useRef(false);

  const rows = useMemo(
    () => searchItemNeeds(stations, items, { levels, targets, inventory }, query, {
      craftIndex, questIndex, questsDone, limit: 40,
    }),
    [stations, items, levels, targets, inventory, query, craftIndex, questIndex, questsDone],
  );

  const short = query.trim().length === 1;
  const open = query.trim().length > 0;

  // A new search is a new question — leaving the previous item's quest drawer
  // hanging open over unrelated results is just confusing. Done on the way in
  // rather than in an effect on `query`, so it is one render instead of two.
  const changeQuery = useCallback((next) => {
    setQuery(next);
    setOpenQuests(null);
    setDetailId(null);
  }, []);

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
    const esc = (e) => { if (e.key === 'Escape') changeQuery(''); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, changeQuery]);

  // Accepts one id or a list, so "mark the 4 quests above this one done" is the
  // same call as ticking a single box.
  const toggleDone = (id, force) => setQuestsDone((prev) => {
    const ids = Array.isArray(id) ? id : [id];
    if (force) return [...new Set([...prev, ...ids])];
    return ids.reduce((acc, one) => toggleQuestDone(acc, one), prev);
  });

  const field = (ref, extra) => (
    <input
      ref={ref}
      className={`eft-input eft-needsearch-input${extra || ''}`}
      value={query}
      placeholder="Do I need this? Search any item…"
      onChange={(e) => changeQuery(e.target.value)}
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
          onMouseDown={(e) => { if (e.target === e.currentTarget) changeQuery(''); }}
        >
          <div className="eft-needmodal">
            <header className="eft-needmodal-head">
              {field(modalRef, ' eft-is-big')}
              <span className="eft-needmodal-count">
                {rows.length ? `${rows.length} match${rows.length === 1 ? '' : 'es'}` : ''}
              </span>
              <button type="button" className="eft-btn eft-btn-sm" onClick={() => changeQuery('')}>
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
                        <QuestChip
                          quests={row.quests}
                          open={openQuests === row.itemId}
                          onToggle={() => setOpenQuests(
                            openQuests === row.itemId ? null : row.itemId,
                          )}
                        />
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

                      {openQuests === row.itemId ? (
                        <QuestList
                          index={questIndex}
                          itemId={row.itemId}
                          items={items}
                          done={questsDone}
                          onToggleDone={toggleDone}
                          onOpen={setDetailId}
                        />
                      ) : null}
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

          {detailId ? (
            <QuestDetail
              index={questIndex}
              questId={detailId}
              items={items}
              done={questsDone}
              onToggleDone={toggleDone}
              onOpen={setDetailId}
              onClose={() => setDetailId(null)}
            />
          ) : null}
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
  // Open by default. What a station still needs is the actual content of the
  // card — hiding it behind a toggle meant 27 clicks to answer "what am I
  // short of?". The toggle stays so a card you are done thinking about can be
  // folded away individually.
  const [open, setOpen] = useState(true);

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

  // The list is the body of the card and the fold control is its footer, so a
  // card reads as a nameplate over a bill of materials rather than as a tile
  // with a disclosure widget stuck on it.
  return (
    <div className="eft-station-items">
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

      <button type="button" className="eft-station-itemstoggle" onClick={() => setOpen((o) => !o)}>
        {open
          ? '− Hide items'
          : `+ Show ${rows.length} item${rows.length === 1 ? '' : 's'} (${rows.length - short} ready)`}
      </button>
    </div>
  );
}

export default function HideoutView() {
  const {
    stations, items, levels, targets, disabled, inventory, profile, prefs,
    questsDone, update, setPref, status, data, reloadStore, showToast,
  } = useEft();

  const ctx = { stations, levels, targets, disabled, inventory, profile, items };

  // So the search can also answer "…or is it a crafting ingredient?" and
  // "…or does a quest still want it?"
  const craftIndex = useMemo(() => buildCraftIndex(data), [data]);
  const questIndex = useMemo(() => buildQuestIndex(), []);

  const candidates = useMemo(() => upgradeCandidates(stations, ctx), [stations, levels, targets, disabled, inventory, profile, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const candidateByKey = useMemo(
    () => new Map(candidates.map((c) => [stationKey(c.station), c])),
    [candidates],
  );

  // Memoised because the `|| []` fallback would otherwise be a fresh array on
  // every render and re-run the row derivation below for nothing.
  const hidden = useMemo(() => prefs.hiddenStations || [], [prefs.hiddenStations]);
  const view = prefs.stationView || 'all';

  // Completed stations that the user has re-opened by hand. Deliberately not
  // persisted: the point of the minimised strip is that a finished station
  // stays out of the way on every future visit.
  const [expanded, setExpanded] = useState([]);

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
      target: targetLevelOf(station, targets, levels),
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

  // A MAXED station has nothing left to decide, ever — not merely one that
  // reached the goal you happened to set. It sinks to the bottom and collapses
  // to a one-line strip, and comes straight back up the moment its level
  // changes. Emergency Wall is the one that made this obvious (it maxes at
  // level 1, so it is done almost immediately and then sat in the middle of
  // the grid forever), but the rule is worth having for every station.
  // Reaching a lower, deliberately-set goal does NOT hide the card — you still
  // want to see it, glance at its progress, and raise the target later.
  const visible = rows
    .filter((r) => r.visible)
    .sort((a, b) => Number(a.progress.maxed) - Number(b.progress.maxed));


  return (
    <div className="eft-hideout">
      <ItemSearch
        stations={stations}
        items={items}
        levels={levels}
        targets={targets}
        inventory={inventory}
        craftIndex={craftIndex}
        questIndex={questIndex}
        questsDone={questsDone}
        setQuestsDone={(next) => update('questsDone', next)}
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
              onResetAll={() => { resetAll(); reloadStore(); showToast('Everything reset.'); }}
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

          // Maxed: one line, at the bottom, until the level changes. Still
          // fully operable — the level picker is right there, so undoing a
          // mistaken level is one click and does not need un-minimising first.
          // Reaching a lower target does NOT minimise the card — only nothing
          // left to build at all does.
          if (progress.maxed && !expanded.includes(key)) {
            return (
              <div key={key} className="eft-station eft-is-complete eft-is-mini">
                <span className="eft-station-minicheck">✓</span>
                <Link to={`/EFTsh/station/${key}`} className="eft-station-name">{station.name}</Link>
                <span className="eft-chip eft-is-met">{current}/{max}</span>
                <div className="eft-levelpick eft-is-mini">
                  {Array.from({ length: max + 1 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === current ? 'eft-is-current' : ''}
                      onClick={() => setLevel(key, n)}
                      title={n === 0 ? 'Not built' : `Level ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="eft-iconbtn"
                  title="Expand this station"
                  onClick={() => setExpanded((e) => [...e, key])}
                >
                  ▾
                </button>
              </div>
            );
          }

          const classes = ['eft-station'];
          if (progress.complete) classes.push('eft-is-complete');
          else if (cand?.ready) classes.push('eft-is-ready');
          if (off && !solo) classes.push('eft-is-off');
          if (solo) classes.push('eft-is-solo');

          return (
            <div key={key} className={classes.join(' ')}>
              {/* Header band — the nameplate. Identity, level, target and
                  readiness all live here so the body below is nothing but the
                  bill of materials. */}
              <div className="eft-station-head">
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
                  {progress.maxed ? (
                    <button
                      type="button"
                      className="eft-iconbtn"
                      title="Minimise this finished station"
                      onClick={() => setExpanded((e) => e.filter((k) => k !== key))}
                    >
                      ▴
                    </button>
                  ) : null}
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

              <div className="eft-station-headrow">
                <span className="eft-label">Target</span>
                <select
                  className="eft-select"
                  value={targets[key] ?? ''}
                  onChange={(e) => setTarget(key, e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">Next ({Math.min(max, current + 1)})</option>
                  {Array.from({ length: max + 1 }, (_, n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="eft-chip">{cand ? fmtDuration(cand.constructionTime) : 'complete'}</span>
              </div>

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

              <StationItems
                station={station}
                current={current}
                target={target}
                items={items}
                inventory={inventory}
                setHave={setHave}
              />
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
