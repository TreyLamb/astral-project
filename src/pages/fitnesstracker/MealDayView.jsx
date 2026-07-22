import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import { isoDate } from './fitnessConfig';
import { dailyTotals, macroPercents } from './calc/nutrition';
import { kgToWeight } from './units';

function round1(n) { return n == null ? null : Math.round(n * 10) / 10; }

// The "meal day view" toggle's destination: a day laid out by meal-type section
// (Breakfast/Lunch/Dinner/Snack + any custom types) instead of the plain workout
// day cell — daily nutrition totals up top, one add button per section.
export default function MealDayView({ date }) {
  const { meals, mealTypes, openMealQuickAdd, settings, bodyWeightLogs, openWeighIn } = useFitness();
  const navigate = useNavigate();
  const iso = isoDate(date);

  const dayMeals = useMemo(
    () => meals.filter((m) => m.date === iso).sort((a, b) => (a.time || '99').localeCompare(b.time || '99')),
    [meals, iso],
  );
  const totals = useMemo(() => dailyTotals(meals, iso), [meals, iso]);
  const pct = useMemo(() => macroPercents(totals), [totals]);
  const target = settings.nutritionTarget;
  const weightUnit = settings.units.weight;

  // Today's weigh-in if one exists for this exact day; otherwise the most
  // recent PRIOR one, so the tile is still useful before a fresh log lands —
  // never gated behind "log today first" (this app's zero-prior-data rule).
  const sortedWeightLogs = [...bodyWeightLogs].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const todayLog = sortedWeightLogs.find((l) => l.date === iso) || null;
  const priorLog = todayLog ? null : (sortedWeightLogs.find((l) => l.date < iso) || null);

  return (
    <div className="ft-meal-day">
      <div className="ft-meal-day-totals">
        <div className="ft-insight">
          <span className="ft-insight-k">Calories</span>
          <span className="ft-insight-v">{totals.calories != null ? totals.calories : '—'}{target?.calories ? <small> / {target.calories}</small> : ''}</span>
        </div>
        <div className="ft-insight">
          <span className="ft-insight-k">Weight</span>
          {todayLog ? (
            <span className="ft-insight-v">{round1(kgToWeight(todayLog.weightKg, weightUnit))} {weightUnit}</span>
          ) : priorLog ? (
            <span className="ft-insight-v">
              <small>{priorLog.date}: </small>{round1(kgToWeight(priorLog.weightKg, weightUnit))} {weightUnit}
              {' '}<button type="button" className="ft-btn-ghost ft-meal-add-btn" onClick={() => openWeighIn(iso)}>+ Log</button>
            </span>
          ) : (
            <span className="ft-insight-v">—{' '}<button type="button" className="ft-btn-ghost ft-meal-add-btn" onClick={() => openWeighIn(iso)}>+ Log</button></span>
          )}
        </div>
        <div className="ft-insight">
          <span className="ft-insight-k">Protein</span>
          <span className="ft-insight-v">{totals.proteinG != null ? `${totals.proteinG}g` : '—'}</span>
        </div>
        <div className="ft-insight">
          <span className="ft-insight-k">Carbs</span>
          <span className="ft-insight-v">{totals.carbsG != null ? `${totals.carbsG}g` : '—'}</span>
        </div>
        <div className="ft-insight">
          <span className="ft-insight-k">Fat</span>
          <span className="ft-insight-v">{totals.fatG != null ? `${totals.fatG}g` : '—'}</span>
        </div>
        {pct && (
          <div className="ft-insight">
            <span className="ft-insight-k">Split</span>
            <span className="ft-insight-v">{pct.proteinPct}/{pct.carbsPct}/{pct.fatPct}</span>
          </div>
        )}
      </div>

      <div className="ft-meal-sections">
        {mealTypes.map((t) => {
          const items = dayMeals.filter((m) => m.mealType === t.id);
          return (
            <div key={t.id} className="ft-meal-section">
              <div className="ft-meal-section-head">
                <span className="ft-meal-section-title" style={{ color: t.color }}>{t.icon} {t.name}</span>
                <button type="button" className="ft-btn-ghost ft-meal-add-btn" onClick={() => openMealQuickAdd(iso, t.id)}>+ Add</button>
              </div>
              <div className="ft-meal-section-items">
                {items.length === 0 && <p className="ft-hint-sm">Nothing planned.</p>}
                {items.map((m) => (
                  <button
                    key={m.id} type="button"
                    className={`ft-meal-entry${m.status === 'logged' ? ' ft-meal-entry-logged' : ' ft-meal-entry-planned'}`}
                    onClick={() => navigate(`meal/${m.id}`)}
                  >
                    <span className="ft-meal-entry-name">{m.name || t.name}</span>
                    {m.calories != null && <span className="ft-meal-entry-cal">{m.calories} kcal</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
