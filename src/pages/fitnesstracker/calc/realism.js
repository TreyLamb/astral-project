// Realism index (guidelinesForecast.md §7): a computed, NON-BLOCKING flag
// scored against each domain's plausible-range bounds from the research
// library. Never a cap, never a refusal — purely informational, and doubles
// as a light injury/health-risk signal in rate-sensitive domains, since the
// same literature that defines "realistic" documents risk from too-fast a rate.
import { LOSS_RATE_PCT_PER_WEEK, GAIN_RATE_PCT_PER_WEEK } from './bodyComposition';

// Cardio/swim bound: guidelinesForecast.md §3 cites beginner runners gaining
// only ~5-15% pace across a WHOLE FIRST YEAR (~52 weeks), front-loaded into
// weeks 8-12. Flattened to a per-week bound for scoring any single checkpoint:
// 15%/52wk =~ 0.0029/wk (aggressive ceiling), half that as the conservative
// band. Swim has no separate citation in §3 (cardio is one taxonomy row) so it
// reuses the same bound — source-faithful, not a gap. Front-loaded curves will
// legitimately score "aggressive" in their early checkpoints even when the
// overall-year trajectory is realistic — expected and fine, since this is
// informational only, never blocking.
export const REALISM_BOUNDS = {
  run: { plausibleWeeklyPct: 0.0015, aggressiveWeeklyPct: 0.003 },
  swim: { plausibleWeeklyPct: 0.0015, aggressiveWeeklyPct: 0.003 },
  weight_loss: { plausibleWeeklyPct: LOSS_RATE_PCT_PER_WEEK.max, aggressiveWeeklyPct: LOSS_RATE_PCT_PER_WEEK.max * 1.5 },
  weight_gain: { plausibleWeeklyPct: GAIN_RATE_PCT_PER_WEEK.max, aggressiveWeeklyPct: GAIN_RATE_PCT_PER_WEEK.max * 1.5 },
  // No domain research exists for 'generic' by definition (it's the catch-all
  // for anything without a formula) — a conservative, informational-only band.
  generic: { plausibleWeeklyPct: 0.004, aggressiveWeeklyPct: 0.008 },
};

const BAND_NOTE = {
  conservative: 'Within documented typical-progress range.',
  plausible: 'Aggressive relative to documented typical progress, but within a stretch range.',
  implausible: 'Exceeds documented typical-progress bounds for this domain — the trajectory is computed exactly as asked, this is informational only.',
};

export function realismScore(kind, requiredWeeklyPct, direction) {
  if (requiredWeeklyPct == null) return null;
  const key = kind === 'weight' ? (direction === 'gain' ? 'weight_gain' : 'weight_loss') : kind;
  const b = REALISM_BOUNDS[key] || REALISM_BOUNDS.generic;
  const abs = Math.abs(requiredWeeklyPct);
  if (abs <= b.plausibleWeeklyPct) return { band: 'conservative', score: b.plausibleWeeklyPct ? abs / b.plausibleWeeklyPct : 0, note: BAND_NOTE.conservative };
  if (abs <= b.aggressiveWeeklyPct) return { band: 'plausible', score: abs / b.aggressiveWeeklyPct, note: BAND_NOTE.plausible };
  return { band: 'implausible', score: abs / b.aggressiveWeeklyPct, note: BAND_NOTE.implausible };
}

// Lift's cited rate (Starting-Strength weekly-add) is an ABSOLUTE kg/week
// figure, not a %/week one — forcing it into the same proportional shape as
// cardio/weight is exactly the mistake guidelinesForecast.md §2 warns
// against, so it gets its own function/unit.
// ✂️ Simplification: the cited bound differs by body region (~5lb/wk upper
// body vs ~10lb/wk lower body); there's no exercise->body-region classifier on
// the free-text exercise name field, so the stricter (upper-body) bound is
// applied to every lift goal — conservative, so it never under-warns a
// lower-body lift. A classifier is out of scope for this pass.
const LIFT_KG_PER_WEEK_BOUND = { plausible: 5 * 0.45359237, aggressive: 10 * 0.45359237 }; // ~2.27kg / ~4.54kg

export function realismScoreLift(requiredWeeklyKg) {
  if (requiredWeeklyKg == null) return null;
  const abs = Math.abs(requiredWeeklyKg);
  if (abs <= LIFT_KG_PER_WEEK_BOUND.plausible) return { band: 'conservative', score: abs / LIFT_KG_PER_WEEK_BOUND.plausible, note: BAND_NOTE.conservative };
  if (abs <= LIFT_KG_PER_WEEK_BOUND.aggressive) return { band: 'plausible', score: abs / LIFT_KG_PER_WEEK_BOUND.aggressive, note: BAND_NOTE.plausible };
  return { band: 'implausible', score: abs / LIFT_KG_PER_WEEK_BOUND.aggressive, note: BAND_NOTE.implausible };
}
