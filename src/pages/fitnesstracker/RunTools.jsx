import { useState, useMemo } from 'react';
import { useFitness } from './fitnessContext';
import { solve, evenSplits, paceIn, PACE_UNITS, parseStructuredWorkout } from './calc/pace';
import { riegelPredict } from './calc/riegel';
import { vdotFromRace, trainingPaces, equivalentRaceTime, PACE_ZONE_LABELS } from './calc/vdot';
import { gradeAdjustedPace, gapFactor } from './calc/gap';
import { hrZones } from './calc/hr';
import { css, cssZones } from './calc/swim';
import { oneRepMax } from './calc/lift';
import { distanceToMeters, metersToDistance, secToClock, clockToSec } from './units';
import { fmtPace, fmtDur, fmtDist } from './format';

// Curated distance presets for the solver / predictors (value + unit pairs).
const PRESETS = [
  ['400m', '400', 'm'], ['800m', '800', 'm'], ['1000m', '1000', 'm'], ['1500m', '1500', 'm'],
  ['1 mi', '1', 'mi'], ['5K', '5', 'km'], ['10K', '10', 'km'],
  ['Half', '21.0975', 'km'], ['Marathon', '42.195', 'km'],
];
const PREDICT_DISTS = [
  { id: '1mi', name: '1 mile', m: 1609.344 }, { id: '5k', name: '5K', m: 5000 },
  { id: '10k', name: '10K', m: 10000 }, { id: '15k', name: '15K', m: 15000 },
  { id: 'half', name: 'Half', m: 21097.5 }, { id: 'marathon', name: 'Marathon', m: 42195 },
];

function DistanceField({ value, unit, onValue, onUnit }) {
  return (
    <div className="ft-inline-two">
      <input className="ft-input" inputMode="decimal" value={value} onChange={(e) => onValue(e.target.value)} placeholder="distance" />
      <select className="ft-input ft-select" value={unit} onChange={(e) => onUnit(e.target.value)}>
        <option value="mi">mi</option><option value="km">km</option><option value="m">m</option><option value="yd">yd</option>
      </select>
    </div>
  );
}

function Presets({ onPick }) {
  return (
    <div className="ft-preset-row">
      {PRESETS.map(([label, v, u]) => (
        <button key={label} type="button" className="ft-preset-btn" onClick={() => onPick(v, u)}>{label}</button>
      ))}
    </div>
  );
}

// ---- universal pace / time / distance solver ----
function PaceSolver() {
  const [dv, setDv] = useState('5');
  const [du, setDu] = useState('km');
  const [time, setTime] = useState('22:30');
  const [pace, setPace] = useState('');
  const [paceUnit, setPaceUnit] = useState('mi');

  const distanceM = dv.trim() ? distanceToMeters(dv, du) : null;
  const timeSec = time.trim() ? clockToSec(time) : null;
  const secPerMFromPace = pace.trim() ? clockToSec(pace) / PACE_UNITS[paceUnit].per : null;

  const provided = [distanceM != null, timeSec != null, secPerMFromPace != null].filter(Boolean).length;
  const result = provided >= 2 ? solve({ distanceM, timeSec, secPerM: secPerMFromPace }) : null;

  function fillBlank() {
    if (!result) return;
    if (distanceM == null && result.distanceM != null) setDv(String(Math.round(metersToDistance(result.distanceM, du) * 1000) / 1000));
    else if (timeSec == null && result.timeSec != null) setTime(secToClock(result.timeSec));
    else if (secPerMFromPace == null && result.secPerM != null) setPace(secToClock(result.secPerM * PACE_UNITS[paceUnit].per));
  }

  const splitsMi = result?.complete ? evenSplits(result.distanceM, result.timeSec, 'mi') : [];
  const splitsKm = result?.complete ? evenSplits(result.distanceM, result.timeSec, 'km') : [];

  return (
    <div className="ft-set-card">
      <h3>Pace / time / distance solver</h3>
      <p className="ft-hint-sm">Enter any two — get the third, plus pace in every unit and even splits. Works for track splits too (what mile pace a 500m rep represents).</p>
      <Presets onPick={(v, u) => { setDv(v); setDu(u); }} />
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Distance</label><DistanceField value={dv} unit={du} onValue={setDv} onUnit={setDu} /></div>
        <div className="ft-field"><label className="ft-field-label">Time</label><input className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="mm:ss" /></div>
        <div className="ft-field">
          <label className="ft-field-label">Pace</label>
          <div className="ft-inline-two">
            <input className="ft-input" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="mm:ss" />
            <select className="ft-input ft-select" value={paceUnit} onChange={(e) => setPaceUnit(e.target.value)}>
              <option value="mi">/mi</option><option value="km">/km</option><option value="400m">/400m</option><option value="100m">/100m</option>
            </select>
          </div>
        </div>
      </div>
      <button type="button" className="ft-btn-ghost" onClick={fillBlank} disabled={provided !== 2}>Solve →</button>

      {result?.complete && (
        <>
          <div className="ft-out-grid">
            <Out k="/mi" v={fmtDur(paceIn(result.secPerM, 'mi'))} />
            <Out k="/km" v={fmtDur(paceIn(result.secPerM, 'km'))} />
            <Out k="/400m" v={fmtDur(paceIn(result.secPerM, '400m'))} />
            <Out k="/100m" v={fmtDur(paceIn(result.secPerM, '100m'))} />
            <Out k="mph" v={(3600 / (result.secPerM * 1609.344)).toFixed(2)} />
            <Out k="km/h" v={(3600 / (result.secPerM * 1000)).toFixed(2)} />
          </div>
          {splitsMi.length > 1 && (
            <details className="ft-more"><summary>Even splits</summary>
              <div className="ft-splits-two">
                <SplitList title="per mile" splits={splitsMi} />
                <SplitList title="per km" splits={splitsKm} />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function SplitList({ title, splits }) {
  return (
    <div>
      <div className="ft-field-label">{title}</div>
      <ol className="ft-splits">
        {splits.map((s) => <li key={s.index}>{s.full ? '' : '·'} {fmtDur(s.timeSec)}</li>)}
      </ol>
    </div>
  );
}

function Out({ k, v }) { return <div className="ft-out"><span className="ft-out-k">{k}</span><span className="ft-out-v">{v}</span></div>; }

// ---- Riegel race predictor ----
function RiegelCard() {
  const [dv, setDv] = useState('5');
  const [du, setDu] = useState('km');
  const [time, setTime] = useState('20:00');
  const distanceM = distanceToMeters(dv, du);
  const timeSec = clockToSec(time);
  const rows = distanceM && timeSec ? PREDICT_DISTS.map((d) => ({ ...d, t: riegelPredict(distanceM, timeSec, d.m) })) : [];
  return (
    <div className="ft-set-card">
      <h3>Race predictor (Riegel)</h3>
      <p className="ft-hint-sm">T₂ = T₁·(D₂/D₁)^1.06 — Riegel (1981). Best from ~1500 m to the marathon.</p>
      <Presets onPick={(v, u) => { setDv(v); setDu(u); }} />
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Recent race</label><DistanceField value={dv} unit={du} onValue={setDv} onUnit={setDu} /></div>
        <div className="ft-field"><label className="ft-field-label">Time</label><input className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="mm:ss" /></div>
      </div>
      {rows.length > 0 && (
        <table className="ft-table">
          <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name}</td><td className="ft-num">{fmtDur(r.t)}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

// ---- VDOT + Daniels paces ----
function VdotCard() {
  const [dv, setDv] = useState('5');
  const [du, setDu] = useState('km');
  const [time, setTime] = useState('20:00');
  const distanceM = distanceToMeters(dv, du);
  const timeSec = clockToSec(time);
  const vdot = distanceM && timeSec ? vdotFromRace(distanceM, timeSec) : null;
  const paces = vdot ? trainingPaces(vdot) : null;
  const equiv = vdot ? PREDICT_DISTS.map((d) => ({ ...d, t: equivalentRaceTime(vdot, d.m) })) : [];
  return (
    <div className="ft-set-card">
      <h3>VDOT &amp; training paces (Daniels)</h3>
      <p className="ft-hint-sm">Daniels &amp; Gilbert equations. A 20:00 5K ≈ VDOT 50.</p>
      <Presets onPick={(v, u) => { setDv(v); setDu(u); }} />
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Race</label><DistanceField value={dv} unit={du} onValue={setDv} onUnit={setDu} /></div>
        <div className="ft-field"><label className="ft-field-label">Time</label><input className="ft-input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="mm:ss" /></div>
      </div>
      {vdot && (
        <>
          <div className="ft-vdot-big">VDOT <strong>{vdot.toFixed(1)}</strong></div>
          <div className="ft-out-grid">
            <Out k="Easy" v={`${fmtPace(paces.E[0], 'mi')} – ${fmtPace(paces.E[1], 'mi')}`} />
            <Out k="Marathon" v={fmtPace(paces.M, 'mi')} />
            <Out k="Threshold" v={fmtPace(paces.T, 'mi')} />
            <Out k="Interval" v={fmtPace(paces.I, 'mi')} />
            <Out k="Rep" v={fmtPace(paces.R, 'mi')} />
          </div>
          <details className="ft-more"><summary>Equivalent race times</summary>
            <table className="ft-table"><tbody>{equiv.map((r) => <tr key={r.id}><td>{r.name}</td><td className="ft-num">{fmtDur(r.t)}</td></tr>)}</tbody></table>
          </details>
        </>
      )}
    </div>
  );
}

// ---- grade-adjusted pace ----
function GapCard() {
  const [pace, setPace] = useState('8:00');
  const [grade, setGrade] = useState('5');
  const secPerM = clockToSec(pace) / 1609.344;
  const g = Number(grade) / 100;
  const gap = isFinite(secPerM) && !Number.isNaN(g) ? gradeAdjustedPace(secPerM, g) : null;
  return (
    <div className="ft-set-card">
      <h3>Grade-adjusted pace (Minetti)</h3>
      <p className="ft-hint-sm">Equivalent flat pace for a hill, from Minetti's metabolic cost model (2002).</p>
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Actual pace /mi</label><input className="ft-input" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="mm:ss" /></div>
        <div className="ft-field"><label className="ft-field-label">Grade %</label><input className="ft-input" inputMode="decimal" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 5 or -8" /></div>
      </div>
      {gap != null && (
        <div className="ft-out-grid">
          <Out k="Flat-equivalent" v={fmtPace(gap, 'mi')} />
          <Out k="Cost vs flat" v={`${gapFactor(g).toFixed(2)}×`} />
        </div>
      )}
    </div>
  );
}

// ---- HR zones ----
function HrCard() {
  const { settings } = useFitness();
  const profile = settings.profile || {};
  const [maxHr, setMaxHr] = useState(profile.maxHr ?? '');
  const [restHr, setRestHr] = useState(profile.restHr ?? '');
  const zones = hrZones(maxHr === '' ? null : Number(maxHr), restHr === '' ? null : Number(restHr));
  return (
    <div className="ft-set-card">
      <h3>HR zones (Karvonen)</h3>
      <p className="ft-hint-sm">Heart-rate reserve method — target = (max−rest)·%+rest. Defaults from your profile.</p>
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Max HR</label><input className="ft-input" inputMode="numeric" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} placeholder="190" /></div>
        <div className="ft-field"><label className="ft-field-label">Resting HR</label><input className="ft-input" inputMode="numeric" value={restHr} onChange={(e) => setRestHr(e.target.value)} placeholder="50" /></div>
      </div>
      {zones.length > 0 && (
        <div className="ft-zone-preview">
          {zones.map((z) => <div key={z.id} className="ft-zone-row"><span className="ft-zone-name">{z.name}</span><span className="ft-zone-bpm">{z.loBpm}–{z.hiBpm} bpm</span></div>)}
        </div>
      )}
    </div>
  );
}

// ---- structured workout parser ----
function StructuredCard() {
  const [txt, setTxt] = useState('6x800m w/ 400m jog');
  const parsed = useMemo(() => parseStructuredWorkout(txt), [txt]);
  return (
    <div className="ft-set-card">
      <h3>Structured workout</h3>
      <p className="ft-hint-sm">Type a rep set — e.g. "6×800m w/ 400m jog" or "10x100 @ 1:30".</p>
      <input className="ft-input" value={txt} onChange={(e) => setTxt(e.target.value)} />
      {parsed ? (
        <div className="ft-out-grid" style={{ marginTop: 12 }}>
          <Out k="Reps" v={parsed.reps} />
          <Out k="Work each" v={fmtDist(parsed.work.distanceM, 'm', 0)} />
          <Out k="Total work" v={fmtDist(parsed.totalWorkM, 'km', 2)} />
          {parsed.recovery && <Out k="Recovery" v={parsed.recovery.kind === 'distance' ? `${Math.round(parsed.recovery.distanceM)}m ${parsed.recovery.style}` : `${fmtDur(parsed.recovery.restSec)} rest`} />}
        </div>
      ) : <p className="ft-hint-sm">Couldn't parse a rep set from that.</p>}
    </div>
  );
}

// ---- Critical Swim Speed (two-trial) ----
function SwimCard() {
  const [d1, setD1] = useState('200'); const [t1, setT1] = useState('2:50');
  const [d2, setD2] = useState('400'); const [t2, setT2] = useState('6:00');
  const r = css(Number(d1), clockToSec(t1), Number(d2), clockToSec(t2));
  const zones = r ? cssZones(r.per100mSec) : [];
  return (
    <div className="ft-set-card">
      <h3>Critical Swim Speed</h3>
      <p className="ft-hint-sm">Two time-trials → CSS = (D₂−D₁)/(T₂−T₁). Sets your swim threshold &amp; zones.</p>
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Trial 1 (m)</label><input className="ft-input" inputMode="numeric" value={d1} onChange={(e) => setD1(e.target.value)} /></div>
        <div className="ft-field"><label className="ft-field-label">Time 1</label><input className="ft-input" value={t1} onChange={(e) => setT1(e.target.value)} placeholder="mm:ss" /></div>
        <div className="ft-field"><label className="ft-field-label">Trial 2 (m)</label><input className="ft-input" inputMode="numeric" value={d2} onChange={(e) => setD2(e.target.value)} /></div>
        <div className="ft-field"><label className="ft-field-label">Time 2</label><input className="ft-input" value={t2} onChange={(e) => setT2(e.target.value)} placeholder="mm:ss" /></div>
      </div>
      {r && (
        <>
          <div className="ft-vdot-big">CSS pace <strong>{fmtDur(r.per100mSec)}</strong> /100m</div>
          <div className="ft-zone-preview">
            {zones.map((z) => <div key={z.id} className="ft-zone-row"><span className="ft-zone-name">{z.name}</span><span className="ft-zone-bpm">{fmtDur(z.per100mSec)} /100m</span></div>)}
          </div>
        </>
      )}
    </div>
  );
}

// ---- estimated 1RM ----
function OneRmCard() {
  const { settings } = useFitness();
  const wu = settings.units.weight;
  const [weight, setWeight] = useState('100');
  const [reps, setReps] = useState('5');
  const r = Number(weight) && Number(reps) ? oneRepMax(Number(weight), Number(reps)) : null;
  return (
    <div className="ft-set-card">
      <h3>Estimated 1RM</h3>
      <p className="ft-hint-sm">Epley &amp; Brzycki from a submaximal set. Shown in your weight unit ({wu}).</p>
      <div className="ft-solver-grid">
        <div className="ft-field"><label className="ft-field-label">Weight ({wu})</label><input className="ft-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
        <div className="ft-field"><label className="ft-field-label">Reps</label><input className="ft-input" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} /></div>
      </div>
      {r && (
        <div className="ft-out-grid">
          <Out k="Epley" v={`${Math.round(r.epley)} ${wu}`} />
          <Out k="Brzycki" v={`${Math.round(r.brzycki)} ${wu}`} />
          <Out k="Mean" v={`${Math.round(r.avg)} ${wu}`} />
        </div>
      )}
    </div>
  );
}

export default function Tools() {
  return (
    <div className="ft-tools">
      <h2>Tools</h2>
      <p className="ft-hint-sm">Every constant here is researched &amp; unit-tested — no reaching for a separate calculator app.</p>

      <h3 className="ft-tools-section">Running</h3>
      <div className="ft-tools-grid">
        <PaceSolver />
        <VdotCard />
        <RiegelCard />
        <GapCard />
        <HrCard />
        <StructuredCard />
      </div>

      <h3 className="ft-tools-section">Swimming</h3>
      <div className="ft-tools-grid"><SwimCard /></div>

      <h3 className="ft-tools-section">Lifting</h3>
      <div className="ft-tools-grid"><OneRmCard /></div>
    </div>
  );
}
