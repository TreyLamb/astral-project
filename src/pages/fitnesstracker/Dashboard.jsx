import { useMemo, useState } from 'react';
import { useFitness } from './fitnessContext';
import { activityType, todayISO as todayISOCfg, goalDeadline } from './fitnessConfig';
import { computePRs, bestPace, longestRun } from './calc/pr';
import { weeklyDistance, acwrRolling, acwrStatus, rollupByActivity } from './calc/load';
import { paceSecPerMeter } from './calc/pace';
import { BarChart, LineChart } from './MiniChart';
import { metersToDistance, metersToElev, elevUnitLabel } from './units';
import { fmtPace, fmtDist, fmtDur, paceUnitFor } from './format';
import { CORRELATIONS } from './calc/correlations';
import { detectConflicts, upcomingPlanned } from './calc/planning';
import GoalEditorModal from './GoalEditorModal';

const DAY = 86400000;
function isoAgo(days) { return new Date(Date.now() - days * DAY).toISOString().slice(0, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function mdLabel(iso) { const [, m, d] = iso.split('-'); return `${+m}/${+d}`; }

// Worst realism band across a goal's checkpoints — deliberately duplicated
// from CalendarView.jsx's identical goal-row rendering rather than extracted
// into a shared component (this project's convention: the two Goals panels
// stay independently duplicated, see CLAUDE.md's no-unnecessary-abstraction rule).
const REALISM_RANK = { conservative: 0, plausible: 1, implausible: 2 };
function worstRealismBand(g) {
  if (!g.checkpoints?.length) return null;
  let worst = null;
  for (const cp of g.checkpoints) {
    const band = cp.realism?.band;
    if (!band) continue;
    if (!worst || REALISM_RANK[band] > REALISM_RANK[worst]) worst = band;
  }
  return worst;
}

export default function Dashboard() {
  const { workouts, activityTypes, settings, goals, updateGoal, removeWorkout } = useFitness();
  const unit = settings.units.distance;
  const paceUnit = paceUnitFor(unit);
  const [goalEditor, setGoalEditor] = useState(null); // null | 'new' | goal object

  const activeGoals = useMemo(
    () => goals
      .filter((g) => g.status !== 'abandoned' && !g.status?.startsWith('closed'))
      .sort((a, b) => (goalDeadline(a) || '9999').localeCompare(goalDeadline(b) || '9999')),
    [goals],
  );

  async function abandonGoal(g) {
    await updateGoal(g.id, { status: 'abandoned' });
    const stale = workouts.filter((w) => w.goalId === g.id && w.status === 'planned' && w.date >= todayISOCfg());
    for (const w of stale) await removeWorkout(w.id);
  }

  const prRows = useMemo(() => computePRs(workouts), [workouts]);
  const longest = useMemo(() => longestRun(workouts), [workouts]);
  const fastest = useMemo(() => bestPace(workouts), [workouts]);

  const weekly = useMemo(() => weeklyDistance(workouts, 12, todayISO(), null), [workouts]);
  const weeklyData = weekly.map((w) => ({ label: mdLabel(w.weekEndISO), value: Math.round(metersToDistance(w.distanceM, unit) * 10) / 10 }));

  const acwr = useMemo(() => acwrRolling(workouts), [workouts]);
  const status = acwrStatus(acwr.ratio);

  const last30 = useMemo(() => rollupByActivity(workouts, isoAgo(30), todayISO()), [workouts]);

  // recent runs, oldest→newest, for the trend lines
  const recentRuns = useMemo(() => workouts
    .filter((w) => w.activityType === 'run' && w.status === 'completed' && w.distanceM && w.durationSec)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-15), [workouts]);

  const paceTrend = recentRuns.map((w) => ({ label: mdLabel(w.date), value: Math.round(paceSecPerMeter(w.distanceM, w.durationSec) * 1609.344) }));
  const elevRuns = useMemo(() => workouts
    .filter((w) => w.status === 'completed' && w.metrics?.elevationGainM)
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-15), [workouts]);
  const elevData = elevRuns.map((w) => ({ label: mdLabel(w.date), value: Math.round(metersToElev(w.metrics.elevationGainM, unit)) }));

  const correlations = useMemo(() => CORRELATIONS.map((c) => ({ def: c, result: c.compute(workouts) })).filter((c) => c.result), [workouts]);
  const conflicts = useMemo(() => detectConflicts(workouts), [workouts]);
  const upcoming = useMemo(() => upcomingPlanned(workouts, todayISO(), 7), [workouts]);

  const hasAny = workouts.some((w) => w.status === 'completed');

  return (
    <div className="ft-dash">
      <h2>Dashboard</h2>
      {!hasAny && <p className="ft-empty">Log a few workouts and your trends, PRs and training-load will appear here.</p>}

      {/* PR shelf */}
      <div className="ft-set-card">
        <h3>Personal records</h3>
        <div className="ft-pr-shelf">
          {prRows.map(({ bucket, pr }) => (
            <div key={bucket.id} className={`ft-pr${pr ? '' : ' ft-pr-empty'}`}>
              <span className="ft-pr-dist">{bucket.name}</span>
              <span className="ft-pr-time">{pr ? fmtDur(pr.timeSec) : '—'}</span>
              {pr && <span className="ft-pr-date">{pr.date}</span>}
            </div>
          ))}
        </div>
        <div className="ft-pr-extra">
          {longest && <span>Longest run <strong>{fmtDist(longest.distanceM, unit)}</strong></span>}
          {fastest && <span>Best pace <strong>{fmtPace(fastest.secPerM, paceUnit)}</strong></span>}
        </div>
      </div>

      {/* goals: forecast-then-accept training targets, tied into the calendar via goalId */}
      <div className="ft-set-card">
        <div className="ft-goals-head">
          <h3>Goals</h3>
          <button type="button" className="ft-btn-ghost ft-goal-new-btn" onClick={() => setGoalEditor('new')}>+ New goal</button>
        </div>
        {activeGoals.length === 0 ? (
          <p className="ft-empty">No goals yet — set one (e.g. "6:00 mile") and see a forecast + training plan on your calendar.</p>
        ) : (
          <div className="ft-goal-list">
            {activeGoals.map((g) => {
              const t = activityType(activityTypes, g.activityType);
              const worst = worstRealismBand(g);
              return (
                <div key={g.id} className="ft-goal-row" style={{ borderLeft: `4px solid ${t.color}` }}>
                  <div className="ft-goal-info">
                    <span className="ft-goal-label">{t.name} — {g.label || g.kind}</span>
                    <span className="ft-goal-meta">
                      <span className={`ft-goal-badge ft-goal-${g.status}`}>{g.status}</span>
                      {worst && <span className={`ft-realism-badge ft-realism-${worst}`}>{worst}</span>}
                      {g.taskFrequency?.value ?? g.daysPerWeek}x/wk
                      {g.forecastWeeks != null && ` · ~${g.forecastWeeks} wk${g.forecastWeeks === 1 ? '' : 's'}`}
                      {goalDeadline(g) && ` · by ${goalDeadline(g)}`}
                    </span>
                  </div>
                  <div className="ft-goal-actions">
                    <button type="button" className="ft-btn-ghost" onClick={() => setGoalEditor(g)}>Edit</button>
                    {g.status === 'paused'
                      ? <button type="button" className="ft-btn-ghost" onClick={() => updateGoal(g.id, { status: 'accepted', pausedAt: null })}>Resume</button>
                      : <button type="button" className="ft-btn-ghost" onClick={() => updateGoal(g.id, { status: 'paused', pausedAt: Date.now() })}>Pause</button>}
                    <button type="button" className="ft-btn-ghost" onClick={() => abandonGoal(g)}>Abandon</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* training load / ACWR */}
      <div className="ft-set-card">
        <h3>Training load — acute:chronic ratio</h3>
        <p className="ft-hint-sm">7-day load vs 28-day average (session-RPE). An early injury-risk signal — surfaced even though you didn't ask by name.</p>
        <div className="ft-acwr">
          <div className={`ft-acwr-num ft-acwr-${status.level}`}>{acwr.ratio != null ? acwr.ratio.toFixed(2) : '—'}</div>
          <div className="ft-acwr-side">
            <span className={`ft-acwr-badge ft-acwr-${status.level}`}>{status.label}</span>
            <span className="ft-hint-sm">acute {Math.round(acwr.acute)} · chronic {Math.round(acwr.chronic)} AU</span>
          </div>
        </div>
      </div>

      {/* weekly volume */}
      <div className="ft-set-card">
        <h3>Weekly distance ({unit}) — last 12 weeks</h3>
        <BarChart data={weeklyData} valueFmt={(v) => `${v} ${unit}`} />
      </div>

      {/* trends */}
      <div className="ft-dash-two">
        <div className="ft-set-card">
          <h3>Run pace trend</h3>
          <p className="ft-hint-sm">Avg pace /mi per run — higher on the chart = faster.</p>
          <LineChart data={paceTrend} invert={false} valueFmt={(v) => fmtDur(v)} />
        </div>
        <div className="ft-set-card">
          <h3>Elevation gain per run ({elevUnitLabel(unit)})</h3>
          <BarChart data={elevData} color="#f59e0b" valueFmt={(v) => `${v} ${elevUnitLabel(unit)}`} />
        </div>
      </div>

      {/* 30-day rollup */}
      <div className="ft-set-card">
        <h3>Last 30 days</h3>
        <table className="ft-table">
          <thead><tr><th>Activity</th><th className="ft-num">Sessions</th><th className="ft-num">Distance</th><th className="ft-num">Time</th></tr></thead>
          <tbody>
            {last30.length === 0 && <tr><td colSpan={4} className="ft-muted">No sessions in the last 30 days.</td></tr>}
            {last30.map((r) => {
              const t = activityType(activityTypes, r.activityType);
              return (
                <tr key={r.activityType}>
                  <td>{t.name}</td>
                  <td className="ft-num">{r.count}</td>
                  <td className="ft-num">{r.distanceM ? fmtDist(r.distanceM, unit) : '—'}</td>
                  <td className="ft-num">{r.durationSec ? fmtDur(r.durationSec) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* smart-calendar schedule watch */}
      {(conflicts.length > 0 || upcoming.length > 0) && (
        <div className="ft-set-card">
          <h3>Schedule watch</h3>
          {conflicts.length > 0 && (
            <div className="ft-sched-conflicts">
              {conflicts.map((c) => (
                <div key={c.date} className="ft-sched-conflict">
                  <span className="ft-sched-warn">{c.date}</span>
                  <span>{c.items.map((i) => activityType(activityTypes, i.activityType).name).join(' + ')} on one day — move or skip one (open it to cascade).</span>
                </div>
              ))}
            </div>
          )}
          <div className="ft-sched-up">
            <span className="ft-field-label">Next 7 days (planned)</span>
            {upcoming.length === 0
              ? <p className="ft-hint-sm">Nothing planned. Add planned sessions from the calendar.</p>
              : (
                <ul className="ft-sched-list">
                  {upcoming.map((w) => {
                    const t = activityType(activityTypes, w.activityType);
                    return <li key={w.id}>{w.date} · {t.name}{w.distanceM ? ` · ${fmtDist(w.distanceM, unit)}` : ''}</li>;
                  })}
                </ul>
              )}
          </div>
        </div>
      )}

      {/* proposed correlations (Phase 6 surfaces more) */}
      {correlations.length > 0 && (
        <div className="ft-set-card">
          <h3>Correlations worth watching</h3>
          <p className="ft-hint-sm">Proposed automatically — patterns in your own data.</p>
          <div className="ft-corr-list">
            {correlations.map(({ def, result }) => (
              <div key={def.id} className="ft-corr">
                <span className="ft-corr-name">{def.name}</span>
                <span className="ft-corr-val">{result.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {goalEditor && (
        <GoalEditorModal goal={goalEditor === 'new' ? null : goalEditor} onClose={() => setGoalEditor(null)} />
      )}
    </div>
  );
}
