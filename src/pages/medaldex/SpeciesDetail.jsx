import { Link, useParams } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import {
  getDexEntry, getSpeciesRecord, getAlternateFormIds, isMegaCapable, getMegaFormIds,
  isCategoryFeasible, feasibilityReason, computeTypeMatchups, getSpeciesFacts, getRelatedMedals,
} from './medaldexEngine';
import { CATEGORIES, typeColor } from './medaldexConfig';
import CategoryChip from './CategoryChip';
import Sprite from './Sprite';

function FormRow({ form, entry, flags, feasibleFor, onToggle }) {
  const formMegaCapable = isMegaCapable(form.id);
  const categories = CATEGORIES.filter((cat) => cat.key !== 'mega' || formMegaCapable);
  return (
    <div className="mdx-form-row">
      <div className="mdx-form-row-head">
        <Sprite dex={entry.dex} name={form.record?.name} className="mdx-form-row-sprite" size="2.5rem" />
        <span className="mdx-badge mdx-form-row-name">{form.record?.name || form.id}</span>
      </div>
      <div className="mdx-dex-categories mdx-species-categories">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.key}
            category={cat}
            feasible={feasibleFor(form.id, cat.key)}
            checked={!!flags[cat.key]}
            onToggle={() => onToggle(form.id, cat.key)}
          />
        ))}
      </div>
    </div>
  );
}

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
  const facts = getSpeciesFacts(entry.id);
  const relatedMedals = getRelatedMedals(entry);
  const shinyFeasible = isCategoryFeasible(entry.id, 'shiny');

  // Requirement #3: Mega chip removed entirely (not disabled) for
  // non-mega-capable species, in every chip row on this page.
  const statusCategories = CATEGORIES.filter((cat) => cat.key !== 'mega' || megaCapable);

  const toggle = (category) => activeAccountId && actions.toggleSpeciesCategory(activeAccountId, entry.id, category);
  // Requirement #4: alternate forms are trackable rows of their own -- same
  // toggle mechanism as the base species, just keyed by the form's own id.
  const toggleForm = (formId, category) => activeAccountId && actions.toggleSpeciesCategory(activeAccountId, formId, category);
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  return (
    <div className="mdx-view mdx-species-detail">
      <Link className="mdx-link mdx-back-link" to="/medaldex">&larr; Back to Dex</Link>

      <div className="mdx-panel mdx-panel-accent mdx-species-header">
        <div className="mdx-species-title-row">
          <Sprite dex={entry.dex} name={entry.name} className="mdx-species-sprite" size="5rem" />
          <div>
            <span className="mdx-dex-num mdx-species-num">#{String(entry.dex).padStart(4, '0')}</span>
            <h2 className="mdx-species-name">{entry.name}</h2>
          </div>
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
          {statusCategories.map((cat) => (
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

      {facts && (
        <div className="mdx-panel mdx-panel-accent mdx-species-facts">
          <div className="mdx-section-label">Fun to know</div>
          {facts.funFact && <p className="mdx-fun-fact">{facts.funFact}</p>}
          {facts.faq.length > 0 && (
            <div className="mdx-faq-list">
              {facts.faq.map((item, i) => (
                <details key={i} className="mdx-faq-item">
                  <summary className="mdx-faq-q">{item.q}</summary>
                  <p className="mdx-faq-a">{item.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

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
          <p className="mdx-form-list-hint">
            Each form tracks its own progress, separate from {entry.name}'s -- these roll up into the
            Summary's <Link className="mdx-link" to="/medaldex/summary">by-form breakdown</Link>.
          </p>
          <div className="mdx-form-rows">
            {altForms.map((f) => (
              <FormRow
                key={f.id}
                form={f}
                entry={entry}
                flags={dex[activeAccountId]?.species?.[f.id] || {}}
                feasibleFor={isCategoryFeasible}
                onToggle={toggleForm}
              />
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
        {shinyFeasible !== false && (
          <p className="mdx-shiny-odds-note">
            Shiny odds: Pokemon GO uses a flat base encounter rate (historically around 1-in-500 in the wild,
            occasionally boosted to roughly 1-in-25-64 during Community Day and select events) that applies
            uniformly across species -- unlike the mainline games, GO has no per-species shiny-rate variation
            on record, so no species-specific number is fabricated here.
          </p>
        )}
      </div>

      {relatedMedals.length > 0 && (
        <div className="mdx-panel">
          <div className="mdx-section-label">Related medals</div>
          <div className="mdx-form-list">
            {relatedMedals.map((m) => (
              <Link key={m.id} to="/medaldex/medals" className="mdx-badge mdx-hunt-pick">
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
