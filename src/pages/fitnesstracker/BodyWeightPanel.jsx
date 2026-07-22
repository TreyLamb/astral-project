import { useFitness } from './fitnessContext';
import { kgToWeight } from './units';
import { formatCheckpointValue } from './calc/checkpoints';
import { LineChart } from './MiniChart';

function round1(n) { return n == null ? null : Math.round(n * 10) / 10; }

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Latest log dated on/before `cutoffISO` — `sorted` must be ascending by date.
function onOrBefore(sorted, cutoffISO) {
  let best = null;
  for (const l of sorted) if (l.date <= cutoffISO) best = l;
  return best;
}

function deltaText(latest, prior, weightUnit) {
  const d = round1(kgToWeight(latest.weightKg, weightUnit) - kgToWeight(prior.weightKg, weightUnit));
  return `${d > 0 ? '+' : ''}${d} ${weightUnit}`;
}

// Body-weight tracking card — lives in the food-tracking area (MealsView) per
// Trey's framing ("since we are tracking food, I want weight goals"): latest
// weigh-in, 7/30-day deltas, a dependency-free trend chart (MiniChart, same
// as every other chart in this app — no CDN chart library), and — when a
// 'weight'-kind goal is active — the next checkpoint shown actual-vs-target
// using the same idiom already established in MealDayView.
export default function BodyWeightPanel() {
  const { bodyWeightLogs, goals, settings, openWeighIn } = useFitness();
  const weightUnit = settings.units.weight;

  const sorted = [...bodyWeightLogs].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const latest = sorted[sorted.length - 1] || null;
  const sevenAgo = latest ? onOrBefore(sorted, isoDaysAgo(7)) : null;
  const thirtyAgo = latest ? onOrBefore(sorted, isoDaysAgo(30)) : null;

  const trendData = sorted.slice(-30).map((l) => ({ label: l.date.slice(5), value: round1(kgToWeight(l.weightKg, weightUnit)) }));

  const activeWeightGoal = goals.find((g) => g.kind === 'weight' && g.status === 'accepted' && g.checkpoints?.length);
  const todayISOStr = new Date().toISOString().slice(0, 10);
  const nextCheckpoint = activeWeightGoal?.checkpoints.find((c) => c.status !== 'done' && c.date >= todayISOStr) || null;

  return (
    <div className="ft-set-card">
      <div className="ft-goals-head">
        <h3>Body weight</h3>
        <button type="button" className="ft-btn-ghost ft-goal-new-btn" onClick={() => openWeighIn()}>+ Log weigh-in</button>
      </div>
      {!latest ? (
        <p className="ft-empty">No weigh-ins logged yet — log one to start a trend, and it'll feed any weight goal you set.</p>
      ) : (
        <>
          <div className="ft-insights">
            <div className="ft-insight"><span className="ft-insight-k">Latest ({latest.date})</span><span className="ft-insight-v">{round1(kgToWeight(latest.weightKg, weightUnit))} {weightUnit}</span></div>
            {sevenAgo && sevenAgo.id !== latest.id && (
              <div className="ft-insight"><span className="ft-insight-k">7-day change</span><span className="ft-insight-v">{deltaText(latest, sevenAgo, weightUnit)}</span></div>
            )}
            {thirtyAgo && thirtyAgo.id !== latest.id && (
              <div className="ft-insight"><span className="ft-insight-k">30-day change</span><span className="ft-insight-v">{deltaText(latest, thirtyAgo, weightUnit)}</span></div>
            )}
            {nextCheckpoint && (
              <div className="ft-insight">
                <span className="ft-insight-k">Next checkpoint ({nextCheckpoint.date})</span>
                <span className="ft-insight-v">
                  {round1(kgToWeight(latest.weightKg, weightUnit))}<small> / {formatCheckpointValue(activeWeightGoal, nextCheckpoint.targetValue, settings.units)}</small>
                </span>
              </div>
            )}
          </div>
          <LineChart data={trendData} color="#fb923c" valueFmt={(v) => `${v} ${weightUnit}`} />
        </>
      )}
    </div>
  );
}
