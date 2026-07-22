// Body-composition forecast math — the research basis for the 'weight' goal
// kind. Research Entry recorded in Guidelines_Forecast.md §3 (append 4).
//
// Wishnofsky (1958): 1 lb adipose tissue ~= 3500 kcal (454g x ~87% lipid x
// 9 kcal/g = ~3555, rounded). This is a SHORT-HORIZON, rough kcal<->weight
// conversion only — it overestimates long-horizon weight change because it
// ignores metabolic adaptation (calories-out drops as weight drops). Shown
// only as a secondary, caveated "implied deficit" display — never used to
// override the %-bodyweight rate cap below.
//
// ISSN Position Stand on diets and body composition (Aragon et al. 2017,
// J Int Soc Sports Nutr, reaffirmed 2022): recommends a maximum ~500 kcal/day
// deficit for lean/athletic populations, targeting 0.5-0.75% of bodyweight
// lost per week during a cut. This is the authoritative RATE CAP for
// weight-LOSS goals (the "conservative default rate" Guidelines_Forecast.md
// §2/§3 asks for).
//
// Natural-bodybuilding lean-bulk research (Helms et al.): recommends a slower
// 0.25-0.5% of bodyweight gained per week for lean mass gain — the rate cap
// for weight-GAIN goals.
//
// %-bodyweight/week is used as the authoritative unit (proportional, ISSN-
// native) rather than raw kcal, per both citations above.
import { KG_PER_LB } from '../units';

export const KCAL_PER_LB_ADIPOSE = 3500;
export const KCAL_PER_KG_ADIPOSE = KCAL_PER_LB_ADIPOSE / KG_PER_LB; // ~7716 kcal/kg

export const LOSS_RATE_PCT_PER_WEEK = { min: 0.005, max: 0.0075, default: 0.006 };
export const GAIN_RATE_PCT_PER_WEEK = { min: 0.0025, max: 0.005, default: 0.00375 };

export function rateCapPctPerWeek(direction) {
  return direction === 'gain' ? GAIN_RATE_PCT_PER_WEEK : LOSS_RATE_PCT_PER_WEEK;
}

// Average weekly %-bodyweight rate implied by baseline -> target over `weeks`.
// Deliberately NOT compounded (Guidelines_Forecast.md §4 asks for "roughly
// linear," matching bodyCompCurve's own linear-in-absolute-weight shape) —
// a compounding %-of-current-weight-each-week model would be more precise but
// is a documented simplification here, consistent with the curve it feeds.
export function requiredWeeklyRatePct(baselineKg, targetKg, weeks) {
  if (!baselineKg || !targetKg || !weeks) return null;
  return (Math.abs(targetKg - baselineKg) / baselineKg) / weeks;
}

// Secondary, clearly-caveated display only (see Wishnofsky caveat above) —
// never used to override the %-bodyweight rate cap.
export function impliedDailyKcalDeficit(weeklyRateKg) {
  if (weeklyRateKg == null) return null;
  return (weeklyRateKg * KCAL_PER_KG_ADIPOSE) / 7;
}
