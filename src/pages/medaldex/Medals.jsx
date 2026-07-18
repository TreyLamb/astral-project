import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import { medalsByCategory, medalProgress, medalRegionGeneration, MEDALS_META } from './medaldexEngine';

function MedalCrossLink({ medal }) {
  if (medal.category === 'Type' && medal.type) {
    return (
      <Link to={`/medaldex?type=${medal.type}`} className="mdx-medal-crosslink">
        Browse {medal.type} species in the Dex &rarr;
      </Link>
    );
  }
  if (medal.category === 'Regional Dex') {
    const gen = medalRegionGeneration(medal);
    if (gen != null) {
      return (
        <Link to={`/medaldex?region=${gen}`} className="mdx-medal-crosslink">
          Browse {medal.name} species in the Dex &rarr;
        </Link>
      );
    }
  }
  return null;
}

// Requirement #6: delta to EVERY higher tier (not just next), plus min days
// per tier (daily-capped medals only) including the max tier explicitly.
function DeltaTable({ progress, medal }) {
  if (progress.maxed) return null;
  return (
    <div className="mdx-medal-deltas">
      <div className="mdx-medal-deltas-label">
        Delta to each remaining tier{medal.dailyCap ? ` (cap ${medal.dailyCap}/day)` : ''}
      </div>
      {progress.remainingTiers.map((t) => {
        const isMax = progress.maxTier && t.key === progress.maxTier.key;
        return (
          <div key={t.key} className={`mdx-medal-delta-row mdx-medal-tier-${t.key}`}>
            <span className="mdx-medal-delta-tier">
              {t.label}{isMax && <span className="mdx-medal-delta-max-tag"> (max)</span>}
            </span>
            <span className="mdx-medal-delta-value">{t.delta.toLocaleString()} to go</span>
            <span className="mdx-medal-delta-days">
              {t.minDays != null ? `~${t.minDays.toLocaleString()} day${t.minDays === 1 ? '' : 's'} min` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MedalRow({ medal, value, onChange }) {
  const progress = medalProgress(medal.id, value);
  const [draft, setDraft] = useState(String(value ?? 0));

  const commit = () => {
    const parsed = Math.max(0, parseInt(draft, 10) || 0);
    setDraft(String(parsed));
    if (parsed !== value) onChange(parsed);
  };

  return (
    <div className="mdx-medal-row">
      <div className="mdx-medal-row-head">
        <span className="mdx-medal-name">
          {medal.name}
          {!medal.confirmed && <span className="mdx-medal-unconfirmed" title="One or more tier thresholds for this medal could not be cross-confirmed across sources.">†</span>}
        </span>
        <input
          className="mdx-input mdx-medal-input"
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      </div>

      <div className="mdx-medal-tiers">
        {progress.tiers.map((t) => (
          <div key={t.key} className={`mdx-medal-tier${t.reached ? ' reached' : ''} mdx-medal-tier-${t.key}`}>
            <span className="mdx-medal-tier-label">{t.label}</span>
            <span className="mdx-medal-tier-threshold">{t.threshold.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="mdx-medal-status">
        {progress.maxed ? (
          <span className="mdx-feasible-note mdx-feasible-yes">Maxed — {progress.currentTier?.label} reached.</span>
        ) : (
          <span className="mdx-medal-next">
            {progress.currentTier ? `${progress.currentTier.label} reached — ` : 'Not yet Bronze — '}
            Next: <strong>{progress.nextTier.label}</strong> in {progress.nextTier.delta.toLocaleString()}
            {progress.minDaysToTier != null && (
              <span className="mdx-medal-days"> (~{progress.minDaysToTier} day{progress.minDaysToTier === 1 ? '' : 's'} min, at {medal.dailyCap}/day cap)</span>
            )}
          </span>
        )}
      </div>

      <DeltaTable progress={progress} medal={medal} />

      {medal.note && <div className="mdx-medal-note">{medal.note}</div>}
      <MedalCrossLink medal={medal} />
    </div>
  );
}

export default function Medals() {
  const { accounts, medals, activeAccountId, actions, loading } = useMedalDex();
  const groups = useMemo(() => medalsByCategory(), []);
  const [closedCategories, setClosedCategories] = useState(() => new Set());

  const toggleCategory = (category) => {
    setClosedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  const accountMedals = medals[activeAccountId]?.medals || {};

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!activeAccountId) {
    return <div className="mdx-panel mdx-empty">No active account selected.</div>;
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const setValue = (medalId, value) => actions.setMedalValue(activeAccountId, medalId, value);

  return (
    <div className="mdx-view mdx-medals-view">
      <div className="mdx-panel mdx-panel-accent">
        <div className="mdx-section-row">
          <div className="mdx-section-label">{activeAccount?.name || 'Trainer'}'s medals</div>
          <Link to="/medaldex/medals/bulk" className="mdx-link mdx-bulk-shortcut">Bulk update raw numbers &rarr;</Link>
        </div>
        <div className="mdx-medals-meta-note">
          Thresholds cross-referenced against Bulbapedia's Medal (GO) pages; entries marked <span className="mdx-medal-unconfirmed">†</span> below could not be fully cross-confirmed.
          {MEDALS_META?.onyxTier?.status === 'unconfirmed' && ' No medal currently ships an Onyx tier — see build notes: it could not be confirmed to exist in-game from any source checked.'}
        </div>
      </div>

      {Object.entries(groups).map(([category, categoryMedals]) => {
        const isOpen = !closedCategories.has(category);
        return (
          <div key={category} className="mdx-panel mdx-medal-category">
            <button
              type="button"
              className="mdx-medal-category-head"
              onClick={() => toggleCategory(category)}
            >
              <span className="mdx-section-label">{category}</span>
              <span className="mdx-medal-category-count">{categoryMedals.length} medals {isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="mdx-medal-list">
                {categoryMedals.map((medal) => (
                  <MedalRow
                    key={medal.id}
                    medal={medal}
                    value={accountMedals[medal.id] ?? 0}
                    onChange={(v) => setValue(medal.id, v)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
