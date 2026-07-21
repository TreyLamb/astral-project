// Calorie/macro estimation for a meal name, via USDA FoodData Central — the
// standard free (no-cost, US government) nutrition database. No paid tier, no
// user cost. Works out of the box with the public DEMO_KEY (rate-limited: 30
// req/hour, 50/day); set VITE_FDC_API_KEY to a personal free key (instant
// signup at https://fdc.nal.usda.gov/api-key-signup, 1000 req/hour) for
// heavier use. This is an ESTIMATE tool, not a data-entry replacement — results
// are per-100g (FDC's standard basis) and are surfaced to the user to review/
// apply, never silently written into a meal.
const FDC_API_KEY = import.meta.env.VITE_FDC_API_KEY || 'DEMO_KEY';
const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// USDA nutrient numbers (stable IDs, not names — names vary by dataset).
const NUTRIENT_IDS = { calories: 1008, proteinG: 1003, carbsG: 1005, fatG: 1004 };

// Foundation + SR Legacy are USDA's generic/raw-ingredient datasets (best fit
// for home-cooked meals like "chicken and rice"); branded/restaurant items are
// intentionally excluded here since their per-100g basis is less predictable.
export async function estimateNutritionForMeal(query) {
  const q = (query || '').trim();
  if (!q) return null;
  try {
    const url = `${FDC_SEARCH_URL}?api_key=${encodeURIComponent(FDC_API_KEY)}&query=${encodeURIComponent(q)}&pageSize=1&dataType=Foundation,SR%20Legacy`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const food = data.foods?.[0];
    if (!food) return null;
    const nutrient = (id) => food.foodNutrients?.find((n) => n.nutrientId === id)?.value ?? null;
    const calories = nutrient(NUTRIENT_IDS.calories);
    if (calories == null) return null;
    return {
      calories, proteinG: nutrient(NUTRIENT_IDS.proteinG), carbsG: nutrient(NUTRIENT_IDS.carbsG), fatG: nutrient(NUTRIENT_IDS.fatG),
      source: food.description,
      basis: '100g',
    };
  } catch {
    return null; // offline / network error / rate-limited — fail quiet, manual entry still works
  }
}
