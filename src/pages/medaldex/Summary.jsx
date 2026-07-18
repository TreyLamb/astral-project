import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import {
  overallCompletion, breakdownByGeneration, breakdownByType, whatsLeft, unknownFeasibilityList, DEX_LIST,
} from './medaldexEngine';
import { CATEGORIES, typeColor } from './medaldexConfig';

function pct1(n) {
  return Math.round(n * 10) / 10;
}

function Meter({ pct }) {
  return (
    <div className="mdx-meter">
      <div className="mdx-meter-fill" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function CompactBar({ label, have, feasibleTotal, unknownTotal, pct, colorVar }) {
  return (
    <div className="mdx-compact-bar-row">
      <span className="mdx-compact-bar-label">{label}</span>
      <div className="mdx-compact-bar-track">
        <div
          className="mdx-compact-bar-fill"
          style={{ width: `${Math.min(100, pct)}%`, ...(colorVar ? { background: colorVar } : {}) }}
        />
      </div>
      <span className="mdx-compact-bar-value">
        {have}/{feasibleTotal}
        {unknownTotal > 0 && <span className="mdx-compact-bar-unknown"> (+{unknownTotal} unknown)</span>}
      </span>
    </div>
  );
}

export default function Summary() {
  const { accounts, dex, activeAccountId, loading } = useMedalDex();
  const [breakdownCategory, setBreakdownCategory] = useState('normal');

  const accountDoc = dex[activeAccountId];
  const dexProgress = useMemo(() => accountDoc?.species || {}, [accountDoc]);

  const overall = useMemo(() => overallCompletion(dexProgress), [dexProgress]);
  const byGen = useMemo(() => breakdownByGeneration(dexProgress, breakdownCategory), [dexProgress, breakdownCategory]);
  const byType = useMemo(() => breakdownByType(dexProgress, breakdownCategory), [dexProgress, breakdownCategory]);

  const huntLists = useMemo(() => (
    CATEGORIES.map((cat) => ({
      category: cat,
      missing: whatsLeft(dexProgress, cat.key, { limit: 6 }),
      unknown: unknownFeasibilityList(dexProgress, cat.key, { limit: 4 }),
      stats: overall.perCategory[cat.key],
    }))
  ), [dexProgress, overall]);

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!activeAccountId) {
    return <div className="mdx-panel mdx-empty">No active account selected.</div>;
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  return (
    <div className="mdx-view mdx-summary">
      <div className="mdx-panel mdx-panel-accent mdx-summary-hero">
        <div className="mdx-section-label">{activeAccount?.name || 'Trainer'} — Overall completion</div>
        <div className="mdx-hero-row">
          <div
            className="mdx-gauge"
            style={{ '--mdx-gauge-pct': `${Math.min(100, overall.pct) / 100}` }}
          >
            <span className="mdx-gauge-label">{pct1(overall.pct)}%</span>
          </div>
          <div className="mdx-hero-stats">
            <div className="mdx-stat-row"><span className="mdx-stat-label">Flags earned</span><span className="mdx-stat-value">{overall.have} / {overall.feasibleTotal}</span></div>
            <div className="mdx-stat-row"><span className="mdx-stat-label">Unknown-feasibility flags</span><span className="mdx-stat-value">{overall.unknownTotal}</span></div>
            <div className="mdx-stat-row"><span className="mdx-stat-label">Species tracked</span><span className="mdx-stat-value">{DEX_LIST.length}</span></div>
          </div>
        </div>
      </div>

      <div className="mdx-panel">
        <div className="mdx-section-label">Per-category completion</div>
        {CATEGORIES.map((cat) => {
          const s = overall.perCategory[cat.key];
          return (
            <div key={cat.key} className="mdx-summary-cat-row">
              <div className="mdx-summary-cat-head">
                <span>{cat.icon} {cat.label}</span>
                <span className="mdx-summary-cat-pct">{pct1(s.pct)}%</span>
              </div>
              <Meter pct={s.pct} />
              <div className="mdx-summary-cat-detail">
                {s.have} / {s.feasibleTotal} feasible
                {s.infeasibleTotal > 0 && ` · ${s.infeasibleTotal} not yet possible`}
                {s.unknownTotal > 0 && ` · ${s.unknownTotal} unknown — data pending`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mdx-panel">
        <div className="mdx-section-row">
          <div className="mdx-section-label">Breakdown by region &amp; type</div>
          <select
            className="mdx-select"
            value={breakdownCategory}
            onChange={(e) => setBreakdownCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="mdx-breakdown-subhead">By region</div>
        {byGen.map((g) => (
          <CompactBar
            key={g.gen}
            label={g.name}
            have={g.have}
            feasibleTotal={g.feasibleTotal}
            unknownTotal={g.unknownTotal}
            pct={g.pct}
          />
        ))}

        <div className="mdx-breakdown-subhead">By type</div>
        {byType.filter((t) => t.feasibleTotal > 0 || t.unknownTotal > 0).map((t) => (
          <CompactBar
            key={t.type}
            label={t.type}
            have={t.have}
            feasibleTotal={t.feasibleTotal}
            unknownTotal={t.unknownTotal}
            pct={t.pct}
            colorVar={typeColor(t.type)}
          />
        ))}
      </div>

      <div className="mdx-panel mdx-panel-accent">
        <div className="mdx-section-label">What to hunt next</div>
        {huntLists.map(({ category, missing, unknown, stats }) => {
          if (stats.feasibleTotal === 0 && unknown.length === 0) return null;
          return (
            <div key={category.key} className="mdx-hunt-block">
              <div className="mdx-hunt-head">
                <span>{category.icon} {category.label}</span>
                <span className="mdx-hunt-progress">{stats.have}/{stats.feasibleTotal}</span>
              </div>
              {missing.length > 0 ? (
                <div className="mdx-hunt-list">
                  {missing.map((s) => (
                    <Link key={s.id} to={`/medaldex/species/${s.id}`} className="mdx-badge mdx-hunt-pick">
                      #{s.dex} {s.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mdx-feasible-note mdx-feasible-yes">
                  {stats.feasibleTotal > 0 ? 'Nothing feasible left — fully caught up!' : 'Nothing currently feasible.'}
                </div>
              )}
              {unknown.length > 0 && (
                <div className="mdx-hunt-unknown">
                  Feasibility unknown for {stats.unknownTotal} species, e.g.{' '}
                  {unknown.map((s) => s.name).join(', ')} — data pending.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
