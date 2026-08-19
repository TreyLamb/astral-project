import { useMemo } from 'react';
import { useFitness } from './fitnessContext';
import { currentFitness, classifyPace, suggestsRecalibration } from './calc/fitness';
import { trainingPaces, equivalentRaceTime, PACE_ZONE_LABELS } from './calc/vdot';
import { paceSecPerMeter } from './calc/pace';
import { acwrRolling, acwrStatus } from './calc/load';
import { fmtPace, fmtDist, paceUnitFor } from './format';
import { secToClock, M_PER_MILE } from './units';

// The PFRA cardio event and Trey's target — see
// runningworkouts/Guidelines_AF. Mirrors CalendarView's PFRA_EVENTS constant;
// kept as a literal here for the same reason it is there (static reference
// data, nothing in the app computes it).
const TARGET_DISTANCE_M = 2 * M_PER_MILE;
const TARGET_TIME_SEC = 13 * 60 + 56;
const TARGET_LABEL = '2-mile';

// How far off target still counts as "on track" rather than "behind".
const ON_TRACK_TOLERANCE_SEC = 20;

function VdotSource({ fit }) {
  if (fit.confidence === 'measured') {
    const w = fit.workout;
    return (
      <p className="ft-cf-source">
        Measured from your {fit.via === 'timeTrial' ? 'time trial' : 'max-effort run'} on{' '}
        <strong>{w.date}</strong> — {fmtDist(w.distanceM, 'mi')} in {secToClock(w.durationSec)}.
      </p>
    );
  }
  if (fit.confidence === 'inferred') {
    return (
      <p className="ft-cf-source">
        <strong>Inferred, not measured.</strong> No time trial or max-effort run is logged, so this
        is bounded from {fit.samples} easy {fit.samples === 1 ? 'run' : 'runs'} — an easy pace pins
        a range, it can't pin a number. <strong>Log a 2-mile time trial</strong> and every pace
        below sharpens.
      </p>
    );
  }
  return (
    <p className="ft-cf-source">
      Nothing to derive from yet. Log a run with a distance and a duration — and for a real
      number, a 2-mile time trial (note it "time trial" or log it at RPE 9+).
    </p>
  );
}

export default function CurrentFitness() {
  const { workouts, settings } = useFitness();
  const unit = settings.units.distance;
  const paceUnit = paceUnitFor(unit);

  const fit = useMemo(() => currentFitness(workouts), [workouts]);
  const paces = useMemo(() => (fit.vdot ? trainingPaces(fit.vdot) : null), [fit.vdot]);

  const predicted = useMemo(
    () => (fit.vdot ? equivalentRaceTime(fit.vdot, TARGET_DISTANCE_M) : null),
    [fit.vdot],
  );
  const predictedRange = useMemo(() => {
    if (!fit.range || fit.confidence !== 'inferred') return null;
    // Faster VDOT => faster time, so the range inverts.
    return [equivalentRaceTime(fit.range[1], TARGET_DISTANCE_M), equivalentRaceTime(fit.range[0], TARGET_DISTANCE_M)];
  }, [fit.range, fit.confidence]);

  const acwr = useMemo(() => acwrRolling(workouts), [workouts]);
  const acwrState = acwr != null ? acwrStatus(acwr) : null;

  // Recent runs, classified against the current model. A run that lands well
  // outside its zone is the signal the model is stale (methodology.md rule 3).
  const recent = useMemo(() => {
    if (!fit.vdot) return [];
    return (workouts ?? [])
      .filter((w) => w.activityType === 'run' && w.status !== 'planned' && w.distanceM && w.durationSec)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 6)
      .map((w) => {
        const secPerM = paceSecPerMeter(w.distanceM, w.durationSec);
        return { w, secPerM, cls: classifyPace(secPerM, fit.vdot),
          recalibrate: suggestsRecalibration(secPerM, fit.vdot, 'E') };
      });
  }, [workouts, fit.vdot]);

  const gapSec = predicted != null ? predicted - TARGET_TIME_SEC : null;
  const onTrack = gapSec != null && gapSec <= ON_TRACK_TOLERANCE_SEC;

  return (
    <div className="ft-set-card ft-cf">
      <h3>Current fitness</h3>

      {fit.vdot == null ? (
        <VdotSource fit={fit} />
      ) : (
        <>
          <div className="ft-cf-head">
            <div className="ft-cf-vdot">
              <span className="ft-cf-vdot-num">{fit.vdot.toFixed(1)}</span>
              <span className="ft-cf-vdot-lbl">VDOT</span>
              <span className={`ft-cf-badge ft-cf-${fit.confidence}`}>
                {fit.confidence === 'measured' ? 'measured' : 'inferred'}
              </span>
            </div>
            <div className="ft-cf-predict">
              <div className="ft-cf-predict-row">
                <span>Predicted {TARGET_LABEL}</span>
                <strong>{secToClock(Math.round(predicted))}</strong>
              </div>
              {predictedRange && (
                <div className="ft-cf-predict-sub">
                  range {secToClock(Math.round(predictedRange[0]))}–{secToClock(Math.round(predictedRange[1]))}
                </div>
              )}
              <div className="ft-cf-predict-row">
                <span>Target</span>
                <strong>{secToClock(TARGET_TIME_SEC)}</strong>
              </div>
              <div className={`ft-cf-gap ${onTrack ? 'ok' : 'behind'}`}>
                {onTrack
                  ? 'On track'
                  : `${secToClock(Math.round(gapSec))} to find`}
              </div>
            </div>
          </div>

          <VdotSource fit={fit} />

          <table className="ft-cf-paces">
            <thead>
              <tr><th>Zone</th><th>Pace</th><th>400m</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              {[
                ['E', paces.E[0], 'Easy volume — the aerobic base. Most of the week lives here.'],
                ['M', paces.M, 'Marathon effort. Rarely used at this distance.'],
                ['T', paces.T, 'Threshold. The single biggest lever on a 2-mile.'],
                ['I', paces.I, 'Intervals at VO2max. Where 2-mile race pace gets built.'],
                ['R', paces.R, 'Reps — speed and economy, full recovery.'],
              ].map(([zone, secPerM, why]) => (
                <tr key={zone}>
                  <td><span className={`ft-cf-zone ft-cf-zone-${zone}`}>{zone}</span> {PACE_ZONE_LABELS[zone]}</td>
                  <td>
                    {zone === 'E'
                      ? `${fmtPace(paces.E[0], paceUnit)} – ${fmtPace(paces.E[1], paceUnit)}`
                      : fmtPace(secPerM, paceUnit)}
                  </td>
                  <td>{secToClock(Math.round((zone === 'E' ? paces.E[1] : secPerM) * 400))}</td>
                  <td className="ft-cf-why">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {acwrState && (
            <p className="ft-cf-acwr">
              Training load (ACWR) <strong>{acwr.toFixed(2)}</strong> — {acwrState}.
              {' '}Volume follows this, not a fixed percentage per cycle.
            </p>
          )}

          {recent.length > 0 && (
            <>
              <h4 className="ft-cf-sub">Recent runs vs. this model</h4>
              <ul className="ft-cf-recent">
                {recent.map(({ w, secPerM, cls, recalibrate }) => (
                  <li key={w.id ?? `${w.date}-${w.distanceM}`}>
                    <span className="ft-cf-recent-date">{w.date}</span>
                    <span>{fmtDist(w.distanceM, unit)} @ {fmtPace(secPerM, paceUnit)}</span>
                    {cls && <span className={`ft-cf-zone ft-cf-zone-${cls.zone}`}>{cls.zone}</span>}
                    {recalibrate && <span className="ft-cf-flag">faster than the model — re-derive</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
