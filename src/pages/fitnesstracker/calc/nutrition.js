// Meal/nutrition rollups. Calorie-per-gram macro factors are the Atwater system
// (USDA standard general factors): protein 4 kcal/g, carbohydrate 4 kcal/g,
// fat 9 kcal/g — real conversion constants, not approximated.

export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

// Converts a macro goal between canonical grams and % of a daily calorie
// goal — settings.nutritionTarget.*G stays canonical grams either way (see
// fitnessConfig.js's canonical-storage rule); units.macros only picks which
// one Settings.jsx shows/accepts input as. Returns null rather than
// fabricating a number when the calorie goal isn't set yet — % has no
// meaning without it.
export function gramsToCalPct(grams, kcalPerG, calorieGoal) {
  if (grams == null || !calorieGoal) return null;
  return (grams * kcalPerG / calorieGoal) * 100;
}

export function calPctToGrams(pct, kcalPerG, calorieGoal) {
  if (pct == null || !calorieGoal) return null;
  return (pct / 100 * calorieGoal) / kcalPerG;
}

function sumField(meals, field) {
  let has = false;
  const total = meals.reduce((a, m) => {
    if (m[field] == null) return a;
    has = true;
    return a + Number(m[field]);
  }, 0);
  return has ? total : null;
}

// Totals for meals on one ISO date (status-agnostic — includes both planned and
// logged so a day's plan is visible before everything is actually eaten).
export function dailyTotals(meals, dateISO) {
  const dayMeals = meals.filter((m) => m.date === dateISO);
  return {
    date: dateISO,
    count: dayMeals.length,
    calories: sumField(dayMeals, 'calories'),
    proteinG: sumField(dayMeals, 'proteinG'),
    carbsG: sumField(dayMeals, 'carbsG'),
    fatG: sumField(dayMeals, 'fatG'),
  };
}

// Macro contribution to total calories, as % of calories (not % of grams) — the
// standard way macro splits are expressed (e.g. "40/30/30").
export function macroPercents(totals) {
  const pKcal = (totals.proteinG || 0) * KCAL_PER_G_PROTEIN;
  const cKcal = (totals.carbsG || 0) * KCAL_PER_G_CARB;
  const fKcal = (totals.fatG || 0) * KCAL_PER_G_FAT;
  const sum = pKcal + cKcal + fKcal;
  if (!sum) return null;
  return {
    proteinPct: Math.round((pKcal / sum) * 100),
    carbsPct: Math.round((cKcal / sum) * 100),
    fatPct: Math.round((fKcal / sum) * 100),
  };
}

// Average daily totals over [fromISO, fromISO + days). Days with zero logged
// meals are excluded from the average (rather than counted as a 0-calorie day),
// since a gap usually means "didn't log" not "ate nothing."
export function averageDaily(meals, fromISO, days) {
  const from = new Date(fromISO + 'T00:00:00');
  const perDay = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const t = dailyTotals(meals, iso);
    if (t.count > 0) perDay.push(t);
  }
  if (!perDay.length) return { days: 0, calories: null, proteinG: null, carbsG: null, fatG: null };
  const avg = (field) => {
    const vals = perDay.map((t) => t[field]).filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length) : null;
  };
  return { days: perDay.length, calories: avg('calories'), proteinG: avg('proteinG'), carbsG: avg('carbsG'), fatG: avg('fatG') };
}
