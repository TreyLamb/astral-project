import { useState, useRef } from 'react';
import { useFitness } from './fitnessContext';
import { parseByFilename, workoutsToCSV, csvToWorkouts } from './calc/importParsers';
import { fmtDist, fmtDur, fmtPace, paceUnitFor } from './format';
import { paceSecPerMeter } from './calc/pace';
import { todayISO } from './fitnessConfig';

export default function ImportPage() {
  const { addWorkout, workouts, activityTypes, settings } = useFitness();
  const unit = settings.units.distance;
  const paceUnit = paceUnitFor(unit);
  const fileRef = useRef(null);
  const csvRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null); // { filename, summary, activityType, date }
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  async function handleGpsFile(file) {
    setError(null); setMsg(null);
    try {
      const text = await file.text();
      const parsed = parseByFilename(file.name, text);
      if (!parsed.summary) throw new Error('No track points found in that file.');
      const firstTime = parsed.points.find((p) => p.time)?.time;
      setPreview({
        filename: file.name,
        summary: parsed.summary,
        activityType: 'run',
        date: firstTime ? new Date(firstTime).toISOString().slice(0, 10) : todayISO(),
      });
    } catch (e) {
      setPreview(null);
      setError(e.message);
    }
  }

  async function confirmImport() {
    const s = preview.summary;
    await addWorkout({
      date: preview.date,
      activityType: preview.activityType,
      status: 'completed',
      distanceM: s.distanceM,
      durationSec: s.durationSec,
      metrics: { elevationGainM: s.elevationGainM, elevationLossM: s.elevationLossM, avgHr: s.avgHr, avgCad: s.avgCad, splits: s.splits, source: preview.filename },
    });
    setMsg(`Imported ${preview.filename}.`);
    setPreview(null);
  }

  async function handleCsv(file) {
    setError(null); setMsg(null);
    try {
      const rows = csvToWorkouts(await file.text());
      let n = 0;
      for (const r of rows) { if (r.date) { await addWorkout(r); n++; } }
      setMsg(`Imported ${n} workout${n === 1 ? '' : 's'} from CSV.`);
    } catch (e) {
      setError(e.message);
    }
  }

  function exportCsv() {
    const csv = workoutsToCSV(workouts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-export-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const s = preview?.summary;

  return (
    <div className="ft-import">
      <h2>Import &amp; export</h2>

      <div className="ft-set-card">
        <h3>GPS file (GPX / TCX)</h3>
        <p className="ft-hint-sm">Drop an exported run from your Apple Watch app (HealthFit, WorkOutDoors, RunGap…). Distance, splits, elevation &amp; HR fill in automatically.</p>
        <div
          className={`ft-drop${dragOver ? ' ft-drop-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleGpsFile(f); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".gpx,.tcx" hidden onChange={(e) => e.target.files[0] && handleGpsFile(e.target.files[0])} />
          <span>Drop a .gpx / .tcx file here, or click to choose</span>
        </div>
        {error && <p className="ft-import-err">{error}</p>}

        {preview && s && (
          <div className="ft-import-preview">
            <div className="ft-out-grid">
              <div className="ft-out"><span className="ft-out-k">Distance</span><span className="ft-out-v">{fmtDist(s.distanceM, unit)}</span></div>
              <div className="ft-out"><span className="ft-out-k">Time</span><span className="ft-out-v">{fmtDur(s.durationSec)}</span></div>
              {s.durationSec > 0 && <div className="ft-out"><span className="ft-out-k">Pace</span><span className="ft-out-v">{fmtPace(paceSecPerMeter(s.distanceM, s.durationSec), paceUnit)}</span></div>}
              <div className="ft-out"><span className="ft-out-k">Elev ↑/↓</span><span className="ft-out-v">{s.elevationGainM}/{s.elevationLossM} m</span></div>
              {s.avgHr && <div className="ft-out"><span className="ft-out-k">Avg HR</span><span className="ft-out-v">{s.avgHr} bpm</span></div>}
              {s.splits?.length > 0 && <div className="ft-out"><span className="ft-out-k">Splits</span><span className="ft-out-v">{s.splits.length}</span></div>}
            </div>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Activity</label>
                <select className="ft-input ft-select" value={preview.activityType} onChange={(e) => setPreview({ ...preview, activityType: e.target.value })}>
                  {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Date</label>
                <input className="ft-input" type="date" value={preview.date} onChange={(e) => setPreview({ ...preview, date: e.target.value })} />
              </div>
            </div>
            <div className="ft-modal-actions">
              <button type="button" className="ft-btn-ghost" onClick={() => setPreview(null)}>Discard</button>
              <button type="button" className="ft-btn-primary" onClick={confirmImport}>Add to calendar</button>
            </div>
          </div>
        )}
      </div>

      <div className="ft-set-card">
        <h3>CSV backup</h3>
        <p className="ft-hint-sm">Plain-text backup alongside your cloud data — and a way to backfill old paper logs.</p>
        <div className="ft-import-actions">
          <button type="button" className="ft-btn-ghost" onClick={() => csvRef.current?.click()}>Import CSV</button>
          <input ref={csvRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files[0] && handleCsv(e.target.files[0])} />
          <button type="button" className="ft-btn-primary" onClick={exportCsv} disabled={!workouts.length}>Export all ({workouts.length})</button>
        </div>
      </div>

      {msg && <p className="ft-import-msg">{msg}</p>}
    </div>
  );
}
