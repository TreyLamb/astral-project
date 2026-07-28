import { useCallback, useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { buildTimedPlan, minutesToHM, parseHM } from '../calc/scheduler';
import { weatherLookup, dateIsRainy } from '../calc/weather';
import { makeHomePlaceForDate, baseForDate, weatherLocationForDate } from '../calc/baseLocation';
import { isReady } from '../calc/readiness';
import { compareForToday } from '../calc/priority';
import AutoScheduleFeedback from './AutoScheduleFeedback';
import './AutoScheduleView.css';

const DEFAULT_HORIZON = 7;
const DEFAULT_BATCH_CAP = 20;
const HORIZON_PRESETS = [3, 7, 14];

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDaysISO = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d); };

function formatDayLabel(iso, todayStr) {
  if (iso === todayStr) return 'Today';
  if (iso === addDaysISO(todayStr, 1)) return 'Tomorrow';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const WEATHER_ERR = {
  'no-home-zip': 'Set a home ZIP in Settings to enable weather.',
  'geocode-failed': "Couldn't locate that ZIP — check it in Settings.",
  'forecast-failed': 'Weather service unavailable right now.',
};

// The timed auto-scheduler's staged preview (Guidelines_Scheduler.md §10/§11).
// Runs the deterministic solver over ready/unblocked/unscheduled tasks and lays
// them at real times of day. NOTHING is written until "Apply" — every row can
// be unchecked (skip), removed (re-solve without it), pinned, or moved first.
export default function AutoScheduleView() {
  const {
    tasks, tasksById, settings, today, getDayPlan, updateTask, mode,
    places, durations, weather, rules, refreshWeather, weatherRainFlags, annotateTasks,
    bases, dayLocations,
  } = useOrbit();

  const [startMode, setStartMode] = useState('today');
  const [horizonDays, setHorizonDays] = useState(DEFAULT_HORIZON);
  const [batchCap, setBatchCap] = useState(DEFAULT_BATCH_CAP);
  const [removed, setRemoved] = useState(() => new Set()); // dropped from the candidate set → re-solves
  const [skipped, setSkipped] = useState(() => new Set());  // kept in preview but not applied
  const [pinned, setPinned] = useState(() => new Set());
  const [moves, setMoves] = useState({}); // taskId → forced date
  const [applyMsg, setApplyMsg] = useState(null);
  const [feedbackFor, setFeedbackFor] = useState(null); // { taskId, action, movedToMin } after a reject/move
  const [weatherMsg, setWeatherMsg] = useState(null);
  const [weatherBusy, setWeatherBusy] = useState(false);
  const [annoMsg, setAnnoMsg] = useState(null);
  const [annoBusy, setAnnoBusy] = useState(false);

  const startISO = startMode === 'tomorrow' ? addDaysISO(today, 1) : today;
  const days = useMemo(
    () => Array.from({ length: horizonDays }, (_, i) => addDaysISO(startISO, i)),
    [startISO, horizonDays],
  );

  const placesById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  // Per-day weather reads the forecast for that day's base (Hawaii's rain, not
  // home's), falling back to the 'home' cache for untagged days — see §9.
  const weatherFor = useCallback(
    (date) => weatherLookup(weather, weatherLocationForDate(date, dayLocations, bases))(date),
    [weather, dayLocations, bases],
  );
  const homePlace = useMemo(
    () => (settings.homeLat != null && settings.homeLng != null ? { lat: settings.homeLat, lng: settings.homeLng } : null),
    [settings.homeLat, settings.homeLng],
  );
  // Per-day travel origin: the day's base overrides home as where trips start
  // and errands cluster — the "googlemaps DB checks OREM when I'm in Orem" wire.
  const homePlaceFor = useMemo(
    () => makeHomePlaceForDate(dayLocations, bases, homePlace),
    [dayLocations, bases, homePlace],
  );

  const candidates = useMemo(
    () => tasks
      .filter((t) => (t.status === 'todo' || t.status === 'doing') && !t.scheduledDate
        && isReady(t, tasksById) && !removed.has(t.id))
      .sort((a, b) => compareForToday(a, b, today))
      .slice(0, batchCap),
    [tasks, tasksById, today, removed, batchCap],
  );

  const capacityFor = useCallback((date) => {
    const plan = getDayPlan(date);
    return plan.capacityEnergy ?? settings.capacityDefault.energy;
  }, [getDayPlan, settings.capacityDefault.energy]);

  // Fixed events for a day = Orbit tasks already scheduled at a specific time.
  const busyFor = useCallback((date) => tasks
    .filter((t) => t.scheduledDate === date && t.scheduledTime)
    .map((t) => {
      const s = parseHM(t.scheduledTime);
      return { startMin: s, endMin: s + (t.timeMin ?? t.estWorkMin ?? 30), label: t.title };
    }), [tasks]);

  const plan = useMemo(() => buildTimedPlan({
    tasks: candidates,
    days,
    capacityFor,
    busyFor,
    guardrails: settings.scheduler.guardrails,
    weatherFor,
    placesById,
    durationDb: durations,
    fatigueCfg: settings.scheduler.fatigue,
    defaultRecoveryMin: settings.scheduler.defaultRecoveryMin,
    weatherAvoidPrecipPct: settings.scheduler.weatherAvoidPrecipPct,
    homePlace,
    homePlaceFor,
    rules,
    softWeights: settings.scheduler.softWeights,
  }), [candidates, days, capacityFor, busyFor, settings, weatherFor, placesById, durations, rules, homePlace, homePlaceFor]);

  const byDay = useMemo(() => {
    const map = new Map(days.map((d) => [d, []]));
    for (const p of plan.placements) {
      const effDate = moves[p.taskId] && map.has(moves[p.taskId]) ? moves[p.taskId] : p.date;
      if (map.has(effDate)) map.get(effDate).push({ ...p, effectiveDate: effDate, moved: effDate !== p.date });
    }
    for (const arr of map.values()) arr.sort((a, b) => a.startMin - b.startMin);
    return map;
  }, [plan, moves, days]);

  const dayStats = useCallback((date, items) => {
    const cap = capacityFor(date);
    const energy = items.reduce((s, p) => s + p.energyCost, 0);
    const travel = items.reduce((s, p) => s + p.travelMinBefore, 0);
    const w = weatherFor(date);
    const temps = (w?.hourly || []).map((h) => h.tempF).filter((v) => v != null);
    return {
      cap,
      energy: Math.round(energy * 10) / 10,
      travel,
      rainy: dateIsRainy(w, settings.scheduler.weatherAvoidPrecipPct),
      maxTemp: temps.length ? Math.round(Math.max(...temps)) : null,
      count: items.length,
    };
  }, [capacityFor, weatherFor, settings.scheduler.weatherAvoidPrecipPct]);

  const toggle = (setFn, id) => setFn((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const removeTask = (id) => { toggle(setRemoved, id); setApplyMsg(null); };
  const toggleSkip = (id) => { toggle(setSkipped, id); setApplyMsg(null); };
  const togglePin = (id) => { toggle(setPinned, id); setApplyMsg(null); };
  const moveTask = (id, date) => { setMoves((m) => ({ ...m, [id]: date || undefined })); setApplyMsg(null); };

  // Reject a suggestion AND capture why (§12 feedback loop): drop it from the
  // candidate set (re-solves) then open the reason chips. onExclude re-drops any
  // task the "not today" reason wants gone even when it came in via a Move.
  const rejectTask = (id) => {
    if (!removed.has(id)) toggle(setRemoved, id);
    setApplyMsg(null);
    setFeedbackFor({ taskId: id, action: 'remove', movedToMin: null });
  };
  const askWhyMoved = (p) => setFeedbackFor({ taskId: p.taskId, action: 'move', movedToMin: p.startMin });
  const excludeFromSession = (id) => { if (!removed.has(id)) toggle(setRemoved, id); };

  const resetAll = () => {
    setRemoved(new Set()); setSkipped(new Set()); setPinned(new Set()); setMoves({}); setApplyMsg(null);
    setFeedbackFor(null);
  };

  const applicable = plan.placements.filter((p) => !skipped.has(p.taskId));

  const applyPlan = async () => {
    if (applicable.length === 0) return;
    for (const p of applicable) {
      const date = (moves[p.taskId] && days.includes(moves[p.taskId])) ? moves[p.taskId] : p.date;
      const patch = { scheduledDate: date, scheduledTime: minutesToHM(p.startMin) };
      if (pinned.has(p.taskId)) {
        patch.pinnedToday = date === today;
        patch.pinnedOn = date === today ? today : null;
      }
      await updateTask(p.taskId, patch);
    }
    setApplyMsg(`Scheduled ${applicable.length} task${applicable.length === 1 ? '' : 's'}.`);
    resetAll();
  };

  const doRefreshWeather = async () => {
    setWeatherBusy(true);
    setWeatherMsg('Fetching forecast…');
    const r = await refreshWeather();
    setWeatherBusy(false);
    setWeatherMsg(r.ok ? `Forecast updated · ${r.days} days` : (WEATHER_ERR[r.reason] || 'Weather update failed.'));
  };

  const unannotated = useMemo(() => candidates.filter((t) => !t.aiAnnotatedAt), [candidates]);
  const doAnnotate = async () => {
    if (unannotated.length === 0) return;
    setAnnoBusy(true);
    setAnnoMsg('Annotating…');
    const r = await annotateTasks(unannotated.map((t) => t.id), (d, tot) => setAnnoMsg(`Annotating ${d}/${tot}…`));
    setAnnoBusy(false);
    if (!r.ok) setAnnoMsg(r.reason === 'not-signed-in' ? 'Sign in to use AI annotation.' : 'Annotation failed.');
    else setAnnoMsg(`Annotated ${r.annotated} task${r.annotated === 1 ? '' : 's'}.`);
  };

  return (
    <div className="orb-auto">
      <div className="orb-auto-head">
        <h2 className="orb-auto-h2">Auto-Schedule <span className="orb-auto-beta">preview</span></h2>
        <p className="orb-auto-sub">
          Lays your ready tasks onto real times of day — batched, weather-aware, inside your energy tank and daily
          guardrail hours. Review the plan below; <strong>nothing is scheduled until you Apply.</strong>
        </p>
      </div>

      {weatherRainFlags.length > 0 && (
        <div className="orb-auto-rainbanner">
          ☔ {weatherRainFlags.length} already-scheduled outdoor task{weatherRainFlags.length === 1 ? '' : 's'} now
          {' '}fall{weatherRainFlags.length === 1 ? 's' : ''} on a rainy day — consider rescheduling.
        </div>
      )}

      <div className="orb-card orb-auto-controls">
        <div className="orb-auto-ctrl">
          <span className="orb-auto-ctrl-label">Start</span>
          <div className="orb-auto-toggle" role="tablist">
            <button type="button" className={`orb-tab${startMode === 'today' ? ' active' : ''}`} onClick={() => setStartMode('today')}>Today</button>
            <button type="button" className={`orb-tab${startMode === 'tomorrow' ? ' active' : ''}`} onClick={() => setStartMode('tomorrow')}>Tomorrow</button>
          </div>
        </div>

        <div className="orb-auto-ctrl">
          <span className="orb-auto-ctrl-label">Horizon</span>
          <div className="orb-auto-horizon">
            {HORIZON_PRESETS.map((n) => (
              <button key={n} type="button" className={`orb-chip${horizonDays === n ? ' active' : ''}`} onClick={() => setHorizonDays(n)}>{n}d</button>
            ))}
            <input
              type="number" min={1} max={30} className="orb-auto-num"
              value={horizonDays}
              onChange={(e) => { const v = Math.round(Number(e.target.value)); setHorizonDays(v > 0 ? Math.min(30, v) : 1); }}
            />
          </div>
        </div>

        <div className="orb-auto-ctrl">
          <span className="orb-auto-ctrl-label" title="How many tasks to plan at once — a small batch is easy to review">Batch cap</span>
          <input
            type="number" min={1} max={100} className="orb-auto-num"
            value={batchCap}
            onChange={(e) => { const v = Math.round(Number(e.target.value)); setBatchCap(v > 0 ? Math.min(100, v) : 1); }}
          />
        </div>

        <div className="orb-auto-ctrl orb-auto-weather">
          <button type="button" className="orb-btn" onClick={doRefreshWeather} disabled={weatherBusy}>
            {weatherBusy ? '…' : '⛅ Refresh weather'}
          </button>
          {weatherMsg && <span className="orb-auto-weather-msg">{weatherMsg}</span>}
        </div>

        <div className="orb-auto-ctrl orb-auto-weather">
          <button
            type="button" className="orb-btn"
            onClick={doAnnotate}
            disabled={annoBusy || mode !== 'cloud' || unannotated.length === 0}
            title={mode !== 'cloud' ? 'Sign in to use AI annotation' : 'Fill task metadata (category, effort, location…) with AI'}
          >
            {annoBusy ? '…' : `✨ Annotate (${unannotated.length})`}
          </button>
          {annoMsg && <span className="orb-auto-weather-msg">{annoMsg}</span>}
        </div>

        <div className="orb-auto-ctrl orb-auto-actions">
          <button type="button" className="orb-btn" onClick={resetAll} disabled={removed.size === 0 && skipped.size === 0 && pinned.size === 0 && Object.keys(moves).length === 0}>
            Reset
          </button>
          <button type="button" className="orb-btn orb-btn-primary" onClick={applyPlan} disabled={applicable.length === 0}>
            Apply plan ({applicable.length})
          </button>
        </div>
      </div>

      {applyMsg && (
        <div className="orb-auto-applied">
          {applyMsg}
          <button type="button" className="orb-carryover-nudge-dismiss" onClick={() => setApplyMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {feedbackFor && (
        <AutoScheduleFeedback
          key={feedbackFor.taskId + feedbackFor.action}
          entry={feedbackFor}
          onExclude={excludeFromSession}
          onDone={() => setFeedbackFor(null)}
        />
      )}

      <div className="orb-auto-summary">
        {candidates.length} candidate{candidates.length === 1 ? '' : 's'} · {plan.placements.length} placed ·
        {' '}{plan.unplaced.length} couldn't fit
        {removed.size > 0 && ` · ${removed.size} removed`}
      </div>

      <div className="orb-auto-days">
        {days.map((date) => {
          const items = byDay.get(date) || [];
          const stats = dayStats(date, items);
          const over = stats.energy > stats.cap;
          return (
            <div key={date} className={`orb-card orb-auto-day${date === today ? ' today' : ''}`}>
              <div className="orb-auto-day-head">
                <span className="orb-auto-day-label">{formatDayLabel(date, today)}</span>
                {(() => {
                  const b = baseForDate(date, dayLocations, bases);
                  return b ? <span className="orb-auto-day-base" style={{ borderColor: b.color, color: b.color }} title={`Based in ${b.query || b.tag} — travel & weather use this location`}>📍 {b.tag}</span> : null;
                })()}
                <span className="orb-auto-day-date">{date}</span>
              </div>

              <div className="orb-auto-day-stats">
                <span className={`orb-auto-stat${over ? ' over' : ''}`} title="Energy used vs today's tank">
                  🔋 {stats.energy}/{stats.cap}
                </span>
                {stats.travel > 0 && <span className="orb-auto-stat" title="Total travel time">🚗 {stats.travel}m</span>}
                {stats.maxTemp != null && (
                  <span className={`orb-auto-stat${stats.rainy ? ' rain' : ''}`} title={stats.rainy ? 'Rain forecast' : 'Forecast high'}>
                    {stats.rainy ? '☔' : '☀️'} {stats.maxTemp}°
                  </span>
                )}
                <span className="orb-auto-stat">{stats.count} task{stats.count === 1 ? '' : 's'}</span>
              </div>

              <div className="orb-auto-day-list">
                {items.length === 0 ? (
                  <div className="orb-auto-day-empty">Nothing planned</div>
                ) : items.map((p) => {
                  const task = tasksById.get(p.taskId);
                  if (!task) return null;
                  const isSkipped = skipped.has(p.taskId);
                  const isPinned = pinned.has(p.taskId);
                  return (
                    <div key={p.taskId} className={`orb-auto-item${isSkipped ? ' skipped' : ''}`}>
                      <label className="orb-auto-item-check" title={isSkipped ? 'Skipped — won\'t be applied' : 'Will be applied'}>
                        <input type="checkbox" checked={!isSkipped} onChange={() => toggleSkip(p.taskId)} />
                      </label>
                      <div className="orb-auto-item-body">
                        <div className="orb-auto-item-top">
                          <span className="orb-auto-item-time">{p.startLabel}–{p.endLabel}</span>
                          <span className="orb-auto-item-title">{task.title}</span>
                          {p.moved && (
                            <>
                              <span className="orb-auto-item-tag">moved</span>
                              <button type="button" className="orb-auto-why" onClick={() => askWhyMoved(p)} title="Tell the scheduler why you moved this">why?</button>
                            </>
                          )}
                        </div>
                        <div className="orb-auto-item-reasons">
                          {p.reasons.map((r, i) => <span key={i} className="orb-auto-reason">{r}</span>)}
                        </div>
                      </div>
                      <div className="orb-auto-item-actions">
                        <select
                          className="orb-auto-move"
                          value={p.effectiveDate}
                          onChange={(e) => moveTask(p.taskId, e.target.value)}
                          title="Move to another day"
                        >
                          {days.map((d) => <option key={d} value={d}>{formatDayLabel(d, today)}</option>)}
                        </select>
                        <button type="button" className={`orb-auto-iconbtn${isPinned ? ' active' : ''}`} onClick={() => togglePin(p.taskId)} title="Pin to today">📌</button>
                        <button type="button" className="orb-auto-iconbtn" onClick={() => rejectTask(p.taskId)} title="Remove & tell the scheduler why (re-solves)">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {plan.unplaced.length > 0 && (
        <div className="orb-card orb-auto-unplaced">
          <div className="orb-auto-day-head">
            <span className="orb-auto-day-label">Couldn't fit ({plan.unplaced.length})</span>
            <span className="orb-auto-day-date">widen the horizon, free capacity, or check the weather</span>
          </div>
          <div className="orb-auto-day-list">
            {plan.unplaced.map((id) => {
              const task = tasksById.get(id);
              if (!task) return null;
              return (
                <div key={id} className="orb-auto-item orb-auto-item-unplaced">
                  <div className="orb-auto-item-body">
                    <span className="orb-auto-item-title">{task.title}</span>
                  </div>
                  <button type="button" className="orb-auto-iconbtn" onClick={() => removeTask(id)} title="Drop from candidates">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {candidates.length === 0 && (
        <div className="orb-auto-zero">No ready, unblocked, unscheduled tasks to plan. Capture or triage some first.</div>
      )}
    </div>
  );
}
