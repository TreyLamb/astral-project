import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import ClearableInput from './ClearableInput';
import { macroPercents } from './calc/nutrition';
import { estimateNutritionForMeal } from './nutritionApi';

// Full meal edit view (route: meal/:id) — mirrors EntryEditor's shape/actions
// (load-by-id, seed-once form state, save/delete) at meal-appropriate scope.
export default function MealEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMeal, updateMeal, removeMeal, mealTypes, loading } = useFitness();
  const m = getMeal(id);

  const [form, setForm] = useState(null);
  const [seededId, setSeededId] = useState(null);
  const [estimate, setEstimate] = useState(null); // null | 'loading' | 'notfound' | { calories, proteinG, carbsG, fatG, source }
  if (m && id !== seededId) {
    setSeededId(id);
    setForm({
      date: m.date, time: m.time || '', mealType: m.mealType, status: m.status,
      name: m.name || '',
      calories: m.calories != null ? String(m.calories) : '',
      proteinG: m.proteinG != null ? String(m.proteinG) : '',
      carbsG: m.carbsG != null ? String(m.carbsG) : '',
      fatG: m.fatG != null ? String(m.fatG) : '',
      note: m.note || '',
    });
  }

  if (!m) {
    return (
      <div className="ft-editor">
        {loading ? <p className="ft-empty">Loading…</p> : (
          <>
            <p className="ft-empty">Meal not found.</p>
            <button type="button" className="ft-btn-ghost" onClick={() => navigate('..')}>← Back to calendar</button>
          </>
        )}
      </div>
    );
  }
  if (!form) return <div className="ft-editor"><p className="ft-empty">Loading…</p></div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' ? null : Number(v));
  const pct = macroPercents({ proteinG: num(form.proteinG), carbsG: num(form.carbsG), fatG: num(form.fatG) });

  async function tryEstimate() {
    if (!form.name.trim() || form.calories !== '') return;
    setEstimate('loading');
    const r = await estimateNutritionForMeal(form.name);
    setEstimate(r || 'notfound');
  }

  function applyEstimate() {
    if (!estimate || estimate === 'loading' || estimate === 'notfound') return;
    if (estimate.calories != null) set('calories', String(Math.round(estimate.calories)));
    if (estimate.proteinG != null) set('proteinG', String(Math.round(estimate.proteinG)));
    if (estimate.carbsG != null) set('carbsG', String(Math.round(estimate.carbsG)));
    if (estimate.fatG != null) set('fatG', String(Math.round(estimate.fatG)));
    setEstimate(null);
  }

  async function save() {
    await updateMeal(id, {
      date: form.date, time: form.time, mealType: form.mealType, status: form.status,
      name: form.name, note: form.note,
      calories: num(form.calories), proteinG: num(form.proteinG), carbsG: num(form.carbsG), fatG: num(form.fatG),
    });
    navigate('..');
  }

  async function del() { await removeMeal(id); navigate('..'); }

  return (
    <div className="ft-editor">
      <div className="ft-editor-head">
        <button type="button" className="ft-btn-ghost" onClick={() => navigate('..')}>← Calendar</button>
        <h2>Edit meal</h2>
      </div>

      <label className="ft-field-label">Meal</label>
      <div className="ft-type-row">
        {mealTypes.map((t) => (
          <button
            key={t.id} type="button" className={`ft-type-btn${form.mealType === t.id ? ' active' : ''}`}
            style={form.mealType === t.id ? { borderColor: t.color, background: t.color + '22' } : undefined}
            onClick={() => set('mealType', t.id)}
          >
            <span className="ft-type-icon">{t.icon}</span><span>{t.name}</span>
          </button>
        ))}
      </div>

      <div className="ft-status-toggle">
        <button type="button" className={form.status === 'logged' ? 'active' : ''} onClick={() => set('status', 'logged')}>✓ Logged</button>
        <button type="button" className={form.status === 'planned' ? 'active' : ''} onClick={() => set('status', 'planned')}>◇ Planned</button>
      </div>

      <div className="ft-two">
        <div className="ft-field"><label className="ft-field-label">Date</label><input className="ft-input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
        <div className="ft-field"><label className="ft-field-label">Time</label><input className="ft-input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></div>
      </div>

      <div className="ft-field">
        <label className="ft-field-label">What</label>
        <ClearableInput
          value={form.name} onChange={(e) => { set('name', e.target.value); if (estimate) setEstimate(null); }}
          onClear={() => { set('name', ''); setEstimate(null); }} onBlur={tryEstimate}
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
        <div className="ft-field"><label className="ft-field-label">Calories</label><ClearableInput inputMode="numeric" value={form.calories} onChange={(e) => set('calories', e.target.value)} onClear={() => set('calories', '')} /></div>
        <div className="ft-field"><label className="ft-field-label">Protein (g)</label><ClearableInput inputMode="numeric" value={form.proteinG} onChange={(e) => set('proteinG', e.target.value)} onClear={() => set('proteinG', '')} /></div>
      </div>
      <div className="ft-two">
        <div className="ft-field"><label className="ft-field-label">Carbs (g)</label><ClearableInput inputMode="numeric" value={form.carbsG} onChange={(e) => set('carbsG', e.target.value)} onClear={() => set('carbsG', '')} /></div>
        <div className="ft-field"><label className="ft-field-label">Fat (g)</label><ClearableInput inputMode="numeric" value={form.fatG} onChange={(e) => set('fatG', e.target.value)} onClear={() => set('fatG', '')} /></div>
      </div>

      {pct && (
        <div className="ft-insights">
          <div className="ft-insight"><span className="ft-insight-k">Protein</span><span className="ft-insight-v">{pct.proteinPct}%</span></div>
          <div className="ft-insight"><span className="ft-insight-k">Carbs</span><span className="ft-insight-v">{pct.carbsPct}%</span></div>
          <div className="ft-insight"><span className="ft-insight-k">Fat</span><span className="ft-insight-v">{pct.fatPct}%</span></div>
        </div>
      )}

      <div className="ft-field">
        <label className="ft-field-label">Note</label>
        <ClearableInput value={form.note} onChange={(e) => set('note', e.target.value)} onClear={() => set('note', '')} placeholder="anything else" />
      </div>

      <div className="ft-editor-actions">
        <button type="button" className="ft-btn-danger" onClick={del}>Delete</button>
        <div className="ft-spacer" />
        <button type="button" className="ft-btn-ghost" onClick={() => navigate('..')}>Cancel</button>
        <button type="button" className="ft-btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}
