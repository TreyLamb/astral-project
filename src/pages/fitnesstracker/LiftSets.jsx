// Exercise / set editor for lift workouts. Operates entirely in the display
// weight unit (lb or kg) — 1RM and volume formulas are unit-agnostic, so the
// numbers are correct either way; EntryEditor converts to canonical kg on save.
import { oneRepMax } from './calc/lift';

function exerciseVolume(sets) {
  return sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0);
}
function exerciseBest1RM(sets) {
  let best = null;
  for (const s of sets) {
    const orm = oneRepMax(Number(s.weight), Number(s.reps)).avg;
    if (orm != null && (!best || orm > best)) best = orm;
  }
  return best;
}

export default function LiftSets({ exercises, weightUnit, onChange }) {
  const list = exercises || [];
  const update = (next) => onChange(next);
  const setEx = (i, patch) => update(list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  return (
    <div className="ft-lift">
      {list.map((ex, i) => {
        const vol = exerciseVolume(ex.sets);
        const orm = exerciseBest1RM(ex.sets);
        return (
          <div key={i} className="ft-lift-ex">
            <div className="ft-lift-head">
              <input
                className="ft-input" value={ex.name} placeholder="Exercise (e.g. Squat)"
                onChange={(e) => setEx(i, { name: e.target.value })}
              />
              <button type="button" className="ft-x" onClick={() => update(list.filter((_, idx) => idx !== i))} aria-label="Remove exercise">✕</button>
            </div>
            <div className="ft-lift-sets">
              <div className="ft-lift-row ft-lift-row-head">
                <span>Set</span><span>Reps</span><span>Weight ({weightUnit})</span><span></span>
              </div>
              {ex.sets.map((s, j) => (
                <div key={j} className="ft-lift-row">
                  <span className="ft-lift-n">{j + 1}</span>
                  <input className="ft-input" inputMode="numeric" value={s.reps} placeholder="reps"
                    onChange={(e) => setEx(i, { sets: ex.sets.map((x, idx) => (idx === j ? { ...x, reps: e.target.value } : x)) })} />
                  <input className="ft-input" inputMode="decimal" value={s.weight} placeholder="wt"
                    onChange={(e) => setEx(i, { sets: ex.sets.map((x, idx) => (idx === j ? { ...x, weight: e.target.value } : x)) })} />
                  <button type="button" className="ft-x" onClick={() => setEx(i, { sets: ex.sets.filter((_, idx) => idx !== j) })} aria-label="Remove set">✕</button>
                </div>
              ))}
            </div>
            <div className="ft-lift-foot">
              <button type="button" className="ft-btn-ghost ft-lift-addset" onClick={() => setEx(i, { sets: [...ex.sets, { reps: '', weight: '' }] })}>+ Set</button>
              <span className="ft-hint-sm">Vol {Math.round(vol)} {weightUnit}{orm ? ` · est 1RM ${Math.round(orm)} ${weightUnit}` : ''}</span>
            </div>
          </div>
        );
      })}
      <button type="button" className="ft-btn-ghost" onClick={() => update([...list, { name: '', sets: [{ reps: '', weight: '' }] }])}>+ Exercise</button>
    </div>
  );
}
