import { Link, useParams } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import {
  getDexEntry, getSpeciesRecord, getAlternateFormIds, isMegaCapable, getMegaFormIds,
  isCategoryFeasible, feasibilityReason, computeTypeMatchups,
} from './medaldexEngine';
import { CATEGORIES, typeColor } from './medaldexConfig';
import CategoryChip from './CategoryChip';

function MatchupRow({ label, entries, emptyText }) {
  if (entries.length === 0) {
    return (
      <div className="mdx-matchup-row">
        <span className="mdx-matchup-label">{label}</span>
        <span className="mdx-matchup-empty">{emptyText}</span>
      </div>
    );
  }
  return (
    <div className="mdx-matchup-row">
      <span className="mdx-matchup-label">{label}</span>
      <div className="mdx-matchup-list">
        {entries.map((e) => (
          <span
            key={e.type}
            className="mdx-type-chip mdx-matchup-chip"
            style={{ '--mdx-type-color': typeColor(e.type) }}
          >
            {e.type} ×{e.multiplier}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SpeciesDetail() {
  const { speciesId } = useParams();
  const { accounts, dex, activeAccountId, actions, loading } = useMedalDex();

  const entry = getDexEntry(speciesId);

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!entry) {
    return (
      <div className="mdx-panel mdx-empty">
        Unknown species "{speciesId}". <Link className="mdx-link" to="/medaldex">Back to Dex</Link>
      </div>
    );
  }

  const record = getSpeciesRecord(entry.id);
  const flags = dex[activeAccountId]?.species?.[entry.id] || {};
  const matchups = computeTypeMatchups(entry.types);
  const megaCapable = isMegaCapable(entry.id);
  const megaForms = getMegaFormIds(entry.id).map((id) => ({ id, record: getSpeciesRecord(id) }));
  const altForms = getAlternateFormIds(entry.id)
    .filter((id) => !id.startsWith('mega_') && !id.startsWith('primal_'))
    .map((id) => ({ id, record: getSpeciesRecord(id) }));

  const toggle = (category) => activeAccountId && actions.toggleSpeciesCategory(activeAccountId, entry.id, category);
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  return (
    <div className="mdx-view mdx-species-detail">
      <Link className="mdx-link mdx-back-link" to="/medaldex">&larr; Back to Dex</Link>

      <div className="mdx-panel mdx-panel-accent mdx-species-header">
        <div className="mdx-species-title-row">
          <span className="mdx-dex-num mdx-species-num">#{String(entry.dex).padStart(4, '0')}</span>
          <h2 className="mdx-species-name">{entry.name}</h2>
        </div>
        <div className="mdx-species-meta">
          <span className="mdx-badge">{entry.generationName} (Gen {entry.generation})</span>
          {entry.types.map((t) => (
            <span key={t} className="mdx-type-chip" style={{ '--mdx-type-color': typeColor(t) }}>{t}</span>
          ))}
        </div>

        <div className="mdx-section-label">
          {activeAccount ? `${activeAccount.name}'s status` : 'Status'}
        </div>
        <div className="mdx-dex-categories mdx-species-categories">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              category={cat}
              feasible={isCategoryFeasible(entry.id, cat.key)}
              checked={!!flags[cat.key]}
              onToggle={() => toggle(cat.key)}
            />
          ))}
        </div>
      </div>

      <div className="mdx-panel">
        <div className="mdx-section-label">Type matchups (defending)</div>
        <MatchupRow label="Weak to" entries={matchups.weaknesses} emptyText="No amplified weaknesses." />
        <MatchupRow label="Resists" entries={matchups.resistances} emptyText="No resistances." />
      </div>

      {record?.baseStats && (
        <div className="mdx-panel">
          <div className="mdx-section-label">Base stats (PvE)</div>
          <div className="mdx-stat-row"><span className="mdx-stat-label">Attack</span><span className="mdx-stat-value">{record.baseStats.atk}</span></div>
          <div className="mdx-stat-row"><span className="mdx-stat-label">Defense</span><span className="mdx-stat-value">{record.baseStats.def}</span></div>
          <div className="mdx-stat-row"><span className="mdx-stat-label">Stamina</span><span className="mdx-stat-value">{record.baseStats.sta}</span></div>
        </div>
      )}

      {record && (record.fastMoves?.length > 0 || record.chargedMoves?.length > 0) && (
        <div className="mdx-panel">
          <div className="mdx-section-label">Moveset</div>
          {record.fastMoves?.length > 0 && (
            <div className="mdx-stat-row"><span className="mdx-stat-label">Fast moves</span><span className="mdx-stat-value">{record.fastMoves.join(', ')}</span></div>
          )}
          {record.chargedMoves?.length > 0 && (
            <div className="mdx-stat-row"><span className="mdx-stat-label">Charged moves</span><span className="mdx-stat-value">{record.chargedMoves.join(', ')}</span></div>
          )}
          {record.eliteMoves?.length > 0 && (
            <div className="mdx-stat-row"><span className="mdx-stat-label">Elite TM moves</span><span className="mdx-stat-value">{record.eliteMoves.join(', ')}</span></div>
          )}
        </div>
      )}

      <div className="mdx-panel">
        <div className="mdx-section-label">Mega Evolution</div>
        {megaCapable ? (
          <>
            <div className="mdx-feasible-note mdx-feasible-yes">This species can Mega Evolve.</div>
            <div className="mdx-form-list">
              {megaForms.map((m) => (
                <span key={m.id} className="mdx-badge">{m.record?.name || m.id}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="mdx-feasible-note mdx-feasible-no">No Mega Evolution released for {entry.name}.</div>
        )}
      </div>

      {altForms.length > 0 && (
        <div className="mdx-panel">
          <div className="mdx-section-label">Regional / alternate forms</div>
          <div className="mdx-form-list">
            {altForms.map((f) => (
              <span key={f.id} className="mdx-badge">{f.record?.name || f.id}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mdx-panel">
        <div className="mdx-section-label">Feasibility notes</div>
        <ul className="mdx-notes-list">
          {CATEGORIES.map((cat) => {
            const feasible = isCategoryFeasible(entry.id, cat.key);
            const reason = feasibilityReason(cat.key, feasible);
            return (
              <li key={cat.key} className="mdx-notes-item">
                <strong>{cat.label}:</strong>{' '}
                {reason || 'Currently obtainable.'}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
