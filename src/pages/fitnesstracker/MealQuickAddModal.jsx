import { useState, useMemo } from 'react';
import { useFitness } from './fitnessContext';
import ClearableInput from './ClearableInput';
import { estimateNutritionForMeal } from './nutritionApi';

// Fast meal entry — mirrors QuickAddModal's shape. mode: 'log' (default status
// logged — you're recording something you ate) | 'schedule' (default status
// planned — you're placing a future meal on the calendar).
export default function MealQuickAddModal({ date, mealType: initialType, mode = 'log', onClose }) {
  const { addMeal, mealTypes, meals } = useFitness();

  const [mealType, setMealType] = useState(initialType || mealTypes[0]?.id || 'breakfast');
  const [status, setStatus] = useState(mode === 'schedule' ? 'planned' : 'logged');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('');
  const [when, setWhen] = useState(date);
  const [saving, setSaving] = useState(false);
  // null | 'loading' | 'notfound' | { calories, proteinG, carbsG, fatG, source, basis }
  const [estimate, setEstimate] = useState(null);

  // Auto-fires when you leave the "What" field with calories still blank — an
  // estimate you didn't ask for by name, surfaced for a one-tap "Use" rather
  // than silently written in (USDA data is per-100g, not per-your-portion).
  async function tryEstimate() {
    if (!name.trim() || calories !== '') return;
    setEstimate('loading');
    const r = await estimateNutritionForMeal(name);
    setEstimate(r || 'notfound');
  }

  function applyEstimate() {
    if (!estimate || estimate === 'loading' || estimate === 'notfound') return;
    if (estimate.calories != null) setCalories(String(Math.round(estimate.calories)));
    if (estimate.proteinG != null) setProteinG(String(Math.round(estimate.proteinG)));
    if (estimate.carbsG != null) setCarbsG(String(Math.round(estimate.carbsG)));
    if (estimate.fatG != null) setFatG(String(Math.round(estimate.fatG)));
    setEstimate(null);
  }

  // recent distinct meals -> one-tap templates, same "repeat recent" pattern as workouts
  const templates = useMemo(() => {
    const sorted = [...meals].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || (b.createdAt || 0) - (a.createdAt || 0));
    const seen = new Set();
    const out = [];
    for (const m of sorted) {
      const key = `${m.mealType}|${(m.name || '').toLowerCase()}`;
      if (!m.name || seen.has(key)) continue;
      seen.add(key);
      out.push(m);
      if (out.length >= 4) break;
    }
    return out;
  }, [meals]);

  function applyTemplate(m) {
    setMealType(m.mealType);
    setName(m.name || '');
    setCalories(m.calories != null ? String(m.calories) : '');
    setProteinG(m.proteinG != null ? String(m.proteinG) : '');
    setCarbsG(m.carbsG != null ? String(m.carbsG) : '');
    setFatG(m.fatG != null ? String(m.fatG) : '');
  }

  const num = (v) => (v === '' ? null : Number(v));

  async function save() {
    if (saving) return;
    setSaving(true);
    await addMeal({
      date: when, time, mealType, status, name,
      calories: num(calories), proteinG: num(proteinG), carbsG: num(carbsG), fatG: num(fatG),
      note,
    });
    onClose();
  }

  const typeName = (id) => mealTypes.find((t) => t.id === id)?.name || id;

  return (
    <div className="ft-modal-backdrop" onClick={onClose}>
      <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-modal-head">
          <h3>{mode === 'schedule' ? 'Schedule a meal' : 'Log a meal'}</h3>
          <button type="button" className="ft-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {templates.length > 0 && (
          <div className="ft-templates">
            <span className="ft-field-label">Repeat recent</span>
            <div className="ft-template-row">
              {templates.map((m) => (
                <button key={m.id} type="button" className="ft-template-chip" onClick={() => applyTemplate(m)}>
                  <span>{typeName(m.mealType)}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="ft-field-label">Meal</label>
        <div className="ft-type-row">
          {mealTypes.map((t) => (
            <button
              key={t.id} type="button" className={`ft-type-btn${mealType === t.id ? ' active' : ''}`}
              style={mealType === t.id ? { borderColor: t.color, background: t.color + '22' } : undefined}
              onClick={() => setMealType(t.id)}
            >
              <span className="ft-type-icon">{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        <div className="ft-status-toggle">
          <button type="button" className={status === 'planned' ? 'active' : ''} onClick={() => setStatus('planned')}>◇ Planned</button>
          <button type="button" className={status === 'logged' ? 'active' : ''} onClick={() => setStatus('logged')}>✓ Logged</button>
        </div>

        <div className="ft-field">
          <label className="ft-field-label">What</label>
          <ClearableInput
            value={name} onChange={(e) => { setName(e.target.value); if (estimate) setEstimate(null); }}
            onClear={() => { setName(''); setEstimate(null); }} onBlur={tryEstimate}
            placeholder="e.g. Chicken + rice"
          />
          {estimate === 'loading' && <p className="ft-hint-sm">Estimating calories via USDA…</p>}
          {estimate === 'notfound' && <p className="ft-hint-sm">No USDA match for that — enter calories manually.</p>}
          {estimate && estimate !== 'loading' && estimate !== 'notfound' && (
            <div className="ft-nutri-suggest">
              <span>
                USDA est. for "{estimate.source}" — {Math.round(estimate.calories)} kcal /100g
                {estimate.proteinG != null ? ` · ${Math.round(estimate.proteinG)}g protein` : ''}
                {estimate.carbsG != null ? ` · ${Math.round(estimate.carbsG)}g carbs` : ''}
                {estimate.fatG != null ? ` · ${Math.round(estimate.fatG)}g fat` : ''}
              </span>
              <button type="button" className="ft-btn-ghost ft-nutri-use-btn" onClick={applyEstimate}>Use</button>
            </div>
          )}
        </div>

        <div className="ft-two">
          <div className="ft-field">
            <label className="ft-field-label">Calories</label>
            <ClearableInput inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} onClear={() => setCalories('')} placeholder="e.g. 600" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Protein (g)</label>
            <ClearableInput inputMode="numeric" value={proteinG} onChange={(e) => setProteinG(e.target.value)} onClear={() => setProteinG('')} placeholder="optional" />
          </div>
        </div>
        <div className="ft-two">
          <div className="ft-field">
            <label className="ft-field-label">Carbs (g)</label>
            <ClearableInput inputMode="numeric" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} onClear={() => setCarbsG('')} placeholder="optional" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Fat (g)</label>
            <ClearableInput inputMode="numeric" value={fatG} onChange={(e) => setFatG(e.target.value)} onClear={() => setFatG('')} placeholder="optional" />
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
          <button type="button" className="ft-btn-primary" disabled={saving} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
