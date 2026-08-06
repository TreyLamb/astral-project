import { useState } from 'react';
import { useFitness } from './fitnessContext';
import ClearableInput from './ClearableInput';
import useModalKeys from './useModalKeys';
import { weightToKg } from './units';

// Fast weigh-in entry — mirrors MealQuickAddModal's shape (fast-entry pattern
// for this sub-app), simpler since there's no macro breakdown: just a weight,
// optional body-fat % for trend context, and a note. A weigh-in logged close
// to a 'weight'-kind goal's scheduled checkpoint auto-satisfies it — see
// fitnessContext.js's addBodyWeightLog.
export default function WeighInModal({ date, onClose }) {
  const { addBodyWeightLog, settings } = useFitness();
  const weightUnit = settings.units.weight;

  const [weight, setWeight] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('');
  const [when, setWhen] = useState(date);
  const [saving, setSaving] = useState(false);

  const canSave = weight !== '';

  async function save() {
    if (saving || !canSave) return;
    setSaving(true);
    await addBodyWeightLog({
      date: when, time,
      weightKg: weightToKg(weight, weightUnit),
      bodyFatPct: bodyFatPct === '' ? null : Number(bodyFatPct),
      note,
    });
    onClose();
  }

  useModalKeys({ onClose, onSubmit: save, canSubmit: !saving && canSave });

  return (
    <div className="ft-modal-backdrop" onClick={onClose}>
      <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-modal-head">
          <h3>Log a weigh-in</h3>
          <button type="button" className="ft-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ft-two">
          <div className="ft-field">
            <label className="ft-field-label">Weight ({weightUnit})</label>
            <ClearableInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} onClear={() => setWeight('')} placeholder="e.g. 178.5" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Body fat % (optional)</label>
            <ClearableInput inputMode="decimal" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} onClear={() => setBodyFatPct('')} placeholder="optional" />
          </div>
        </div>

        <details className="ft-more">
          <summary>More (optional)</summary>
          <div className="ft-two">
            <div className="ft-field">
              <label className="ft-field-label">Date</label>
              <input className="ft-input" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="ft-field">
              <label className="ft-field-label">Time</label>
              <input className="ft-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Note</label>
            <ClearableInput value={note} onChange={(e) => setNote(e.target.value)} onClear={() => setNote('')} placeholder="anything else" />
          </div>
        </details>

        <div className="ft-modal-actions">
          <button type="button" className="ft-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ft-btn-primary" disabled={saving || !canSave} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
