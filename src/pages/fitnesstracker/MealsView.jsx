import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import { mealType, todayISO } from './fitnessConfig';
import { dailyTotals, macroPercents, averageDaily } from './calc/nutrition';
import MealQuickAddModal from './MealQuickAddModal';
import BodyWeightPanel from './BodyWeightPanel';

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The dedicated, more-verbose "Meals" tab — an agenda-style planner rather than
// the compact calendar toggles: weekly nutrition rollup, today's totals, an
// upcoming-planned list and a recently-logged list, and full CRUD.
export default function MealsView() {
  const { meals, mealTypes, removeMeal } = useFitness();
  const navigate = useNavigate();
  const [quickAdd, setQuickAdd] = useState(null);
  const today = todayISO();

  const todayTotals = useMemo(() => dailyTotals(meals, today), [meals, today]);
  const todayPct = useMemo(() => macroPercents(todayTotals), [todayTotals]);
  const weekAvg = useMemo(() => averageDaily(meals, addDaysISO(today, -6), 7), [meals, today]);

  const upcoming = useMemo(() => meals
    .filter((m) => m.status === 'planned' && m.date >= today && m.date <= addDaysISO(today, 7))
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))), [meals, today]);

  const recent = useMemo(() => meals
    .filter((m) => m.status === 'logged')
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
    .slice(0, 20), [meals]);

  const typeName = (id) => mealType(mealTypes, id).name;
  const typeIcon = (id) => mealType(mealTypes, id).icon;

  async function quickDelete(id, e) {
    e.stopPropagation();
    await removeMeal(id);
  }

  return (
    <div className="ft-meals-view">
      <div className="ft-meals-head">
        <h2>Meals</h2>
        <button type="button" className="ft-btn-primary" onClick={() => setQuickAdd({ date: today, mode: 'log' })}>+ Log a meal</button>
      </div>

      <div className="ft-dash-two">
        <div className="ft-set-card">
          <h3>Today</h3>
          <div className="ft-insights">
            <div className="ft-insight"><span className="ft-insight-k">Calories</span><span className="ft-insight-v">{todayTotals.calories ?? '—'}</span></div>
            <div className="ft-insight"><span className="ft-insight-k">Protein</span><span className="ft-insight-v">{todayTotals.proteinG != null ? `${todayTotals.proteinG}g` : '—'}</span></div>
            <div className="ft-insight"><span className="ft-insight-k">Carbs</span><span className="ft-insight-v">{todayTotals.carbsG != null ? `${todayTotals.carbsG}g` : '—'}</span></div>
            <div className="ft-insight"><span className="ft-insight-k">Fat</span><span className="ft-insight-v">{todayTotals.fatG != null ? `${todayTotals.fatG}g` : '—'}</span></div>
          </div>
          {todayPct && <p className="ft-hint-sm">Split: {todayPct.proteinPct}% protein / {todayPct.carbsPct}% carbs / {todayPct.fatPct}% fat</p>}
        </div>
        <div className="ft-set-card">
          <h3>7-day average</h3>
          {weekAvg.days === 0 ? <p className="ft-empty">No logged meals in the last 7 days.</p> : (
            <div className="ft-insights">
              <div className="ft-insight"><span className="ft-insight-k">Calories/day</span><span className="ft-insight-v">{weekAvg.calories ?? '—'}</span></div>
              <div className="ft-insight"><span className="ft-insight-k">Protein/day</span><span className="ft-insight-v">{weekAvg.proteinG != null ? `${weekAvg.proteinG}g` : '—'}</span></div>
              <div className="ft-insight"><span className="ft-insight-k">Days logged</span><span className="ft-insight-v">{weekAvg.days}/7</span></div>
            </div>
          )}
        </div>
      </div>

      <BodyWeightPanel />

      <div className="ft-set-card">
        <h3>Next 7 days (planned)</h3>
        {upcoming.length === 0 ? <p className="ft-hint-sm">Nothing scheduled. Add planned meals from here or the calendar.</p> : (
          <ul className="ft-sched-list">
            {upcoming.map((m) => (
              <li key={m.id}>
                <button type="button" className="ft-meal-list-row" onClick={() => navigate(`../meal/${m.id}`)}>
                  {m.date} · {typeIcon(m.mealType)} {typeName(m.mealType)}{m.name ? ` — ${m.name}` : ''}{m.calories != null ? ` · ${m.calories} kcal` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ft-set-card">
        <h3>Recently logged</h3>
        {recent.length === 0 ? <p className="ft-empty">Log a meal and it'll show up here.</p> : (
          <table className="ft-table">
            <thead><tr><th>Date</th><th>Meal</th><th>What</th><th className="ft-num">Calories</th><th /></tr></thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id} className="ft-meal-table-row" onClick={() => navigate(`../meal/${m.id}`)}>
                  <td>{m.date}</td>
                  <td>{typeIcon(m.mealType)} {typeName(m.mealType)}</td>
                  <td>{m.name || '—'}</td>
                  <td className="ft-num">{m.calories ?? '—'}</td>
                  <td><button type="button" className="ft-btn-ghost ft-meal-del-btn" onClick={(e) => quickDelete(m.id, e)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {quickAdd && <MealQuickAddModal date={quickAdd.date} mode={quickAdd.mode} onClose={() => setQuickAdd(null)} />}
    </div>
  );
}
