import { useMemo } from 'react';
import { useFitness } from './fitnessContext';
import { currentFitness, classifyPace, suggestsRecalibration, isTimeTrial, MAX_EFFORT_RPE } from './calc/fitness';
import { equivalentRaceTime, PACE_ZONE_LABELS } from './calc/vdot';
import { slowdownPerDoubling, DEFAULT_EXPONENT } from './calc/performance';
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

const pct = (x) => `${(x * 100).toFixed(1)}%`;

// How this runner's pace holds up as distance grows, in words. The number is
// the pace cost of doubling distance: an average runner loses ~4-6%.
function EnduranceProfile({ profile, unit }) {
  const { exponent, anchor } = profile;
  const tested = exponent.points.map((p) => `${fmtDist(p.distanceM, unit)} ${secToClock(p.timeSec)} (${p.date})`).join(' · ');
  let body;
  if (exponent.source === 'default') {
    body = (
      <>
        Only one distance tested, so how your pace holds up over longer runs is <strong>not known yet</strong>.
        The prediction assumes a typical recreational runner (fatigue factor {DEFAULT_EXPONENT}, ~{pct(slowdownPerDoubling(DEFAULT_EXPONENT))} slower
        per doubling of distance) and shows a range. Run a test at a second distance, ideally within a week of this one, and it
        will use YOUR number.
      </>
    );
  } else {
    body = (
      <>
        Your pace drops <strong>{pct(profile.slowdownPerDoubling)}</strong> each time distance doubles (fatigue
        factor {exponent.k.toFixed(3)}; a typical runner loses ~4–6%). Fitted from: {tested}.
        {exponent.source === 'loose' && (
          <> These tests are {exponent.gapDays} days apart, so part of the gap is fitness changing in between. The
          prediction splits the difference and shows a range. Two tests within a week pin it down.</>
        )}
        {exponent.clamped && <> The raw fit ({exponent.raw.toFixed(3)}) was outside any real runner&apos;s range and was capped.</>}
      </>
    );
  }
  return (
    <p className="ft-cf-source">
      <strong>Endurance profile.</strong> {body}
      {profile.stale && <> <strong>Your newest test ({anchor.date}) is over six weeks old. Retest.</strong></>}
    </p>
  );
}

function VdotSource({ fit }) {
  if (fit.confidence === 'measured') {
    const w = fit.workout;
    return (
      <p className="ft-cf-source">
        Anchored on your most recent {fit.via === 'timeTrial' ? 'time trial' : 'max-effort run'},{' '}
        <strong>{w.date}</strong>: {fmtDist(w.distanceM, 'mi')} in {secToClock(w.durationSec)}. VDOT shown is for
        your predicted {TARGET_LABEL}, not that run.
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

  const fit = useMemo(() => currentFitness(workouts, { targetDistanceM: TARGET_DISTANCE_M }), [workouts]);
  const { paces, profile } = fit;

  const predicted = useMemo(() => {
    if (profile) return profile.predict(TARGET_DISTANCE_M).timeSec;
    return fit.vdot ? equivalentRaceTime(fit.vdot, TARGET_DISTANCE_M) : null;
  }, [fit.vdot, profile]);
  const predictedRange = useMemo(() => {
    if (profile) return profile.predict(TARGET_DISTANCE_M).range;
    if (!fit.range || fit.confidence !== 'inferred') return null;
    // Faster VDOT => faster time, so the range inverts.
    return [equivalentRaceTime(fit.range[1], TARGET_DISTANCE_M), equivalentRaceTime(fit.range[0], TARGET_DISTANCE_M)];
  }, [fit.range, fit.confidence, profile]);

  // acwrRolling returns { acute, chronic, ratio }. This panel used to treat it
  // as a bare number and crashed whenever any fitness was derivable.
  const acwr = useMemo(() => acwrRolling(workouts).ratio, [workouts]);
  const acwrState = acwr != null ? acwrStatus(acwr).label : null;

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
        // A max effort IS the model's input, so it can't be evidence the model
        // is stale. Checking it against the easy band flagged every time trial.
        const maxEffort = isTimeTrial(w) || (w.rpe ?? 0) >= MAX_EFFORT_RPE;
        return { w, secPerM, cls: classifyPace(secPerM, paces),
          recalibrate: !maxEffort && suggestsRecalibration(secPerM, paces, 'E') };
      });
  }, [workouts, fit.vdot, paces]);

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
          {profile && <EnduranceProfile profile={profile} unit={unit} />}

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
                  <td>
                    <span className={`ft-cf-zone ft-cf-zone-${zone}`}>{zone}</span> {PACE_ZONE_LABELS[zone]}
                    {profile?.zoneAnchors[zone]?.extrapolationCapped && (
                      <span className="ft-cf-flag" title="Your longest test is shorter than this zone's effort, so it reads off that test instead of extrapolating. A longer test sharpens it.">
                        {' '}from {fmtDist(profile.zoneAnchors[zone].distanceM, unit)} test
                      </span>
                    )}
                  </td>
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
