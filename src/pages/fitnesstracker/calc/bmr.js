// Basal Metabolic Rate — Mifflin-St Jeor equation.
//
// Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO (1990),
// "A new predictive equation for resting energy expenditure in healthy
// individuals," Am J Clin Nutr 51(2):241-247 — the most widely-validated
// resting-energy-expenditure formula for the general population (supersedes
// the older Harris-Benedict equation). Requires weight (kg), height (cm),
// age (years), and sex (formula constant only — see Settings.jsx hint).

// Never fabricate a default for any input — matches this codebase's existing
// convention (see calc/calories.js's latestBodyWeightKg comment).
export function mifflinStJeorBmr(weightKg, heightCm, age, sex) {
  if (weightKg == null || heightCm == null || age == null || !sex) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}
