// Forms dimension browser -- requirement #4. Same grid/filter/toggle
// interaction as DexView, just scoped to FORM_LIST (regional/alternate
// forms) instead of DEX_LIST (canonical species). Each form's progress is
// its own trackable row (see medaldexEngine.js's forms-dimension comment)
// and rolls up into Summary's "by form" breakdown. This view is what makes
// those rows reachable/toggleable without drilling into every base
// species' detail page one at a time.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import { FORM_LIST, FORM_GROUP_ORDER, isCategoryFeasible, isMegaCapable } from './medaldexEngine';
import { CATEGORIES, GENERATIONS, ALL_TYPES, FORM_GROUP_LABELS, typeColor } from './medaldexConfig';
import CategoryChip from './CategoryChip';
import Sprite from './Sprite';

export default function FormsView() {
  const { accounts, dex, activeAccountId, actions, loading } = useMedalDex();
  const [groupFilter, setGroupFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [missingOnly, setMissingOnly] = useState(false);
  const [search, setSearch] = useState('');

  const accountDoc = dex[activeAccountId];
  const accountSpecies = useMemo(() => accountDoc?.species || {}, [accountDoc]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return FORM_LIST.filter((f) => {
      if (groupFilter !== 'all' && f.group !== groupFilter) return false;
      if (generationFilter !== 'all' && f.generation !== Number(generationFilter)) return false;
      if (typeFilter !== 'all' && !f.types.includes(typeFilter)) return false;
      if (term && !f.name.toLowerCase().includes(term) && !String(f.dex).includes(term)) return false;

      if (missingOnly) {
        const flags = accountSpecies[f.id] || {};
        const categoriesToCheck = categoryFilter === 'all' ? CATEGORIES.map((c) => c.key) : [categoryFilter];
        const hasMissingFeasible = categoriesToCheck.some((cat) => {
          const feasible = isCategoryFeasible(f.id, cat);
          return feasible === true && !flags[cat];
        });
        if (!hasMissingFeasible) return false;
      }

      return true;
    });
  }, [groupFilter, generationFilter, typeFilter, categoryFilter, missingOnly, search, accountSpecies]);

  const visibleCategories = categoryFilter === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.key === categoryFilter);

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!activeAccountId) {
    return <div className="mdx-panel mdx-empty">No active account selected.</div>;
  }

  const toggle = (formId, category) => actions.toggleSpeciesCategory(activeAccountId, formId, category);

  return (
    <div className="mdx-view">
      <div className="mdx-panel mdx-panel-accent mdx-filters">
        <p className="mdx-forms-intro">
          Regional and alternate forms (Alolan, Galarian, Hisuian, Paldean, plus other formes like Rotom's
          appliances or Origin/Therian formes) tracked as their own rows, separate from their base species.
          Feeds the Summary's <Link className="mdx-link" to="/medaldex/summary">by-form breakdown</Link>.
        </p>
        <div className="mdx-filter-row">
          <input
            className="mdx-input mdx-search"
            placeholder="Search form name or dex #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="mdx-select" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="all">All form groups</option>
            {FORM_GROUP_ORDER.map((key) => (
              <option key={key} value={key}>{FORM_GROUP_LABELS[key]}</option>
            ))}
          </select>
          <select className="mdx-select" value={generationFilter} onChange={(e) => setGenerationFilter(e.target.value)}>
            <option value="all">All regions</option>
            {GENERATIONS.map((g) => (
              <option key={g.gen} value={g.gen}>{g.name} (Gen {g.gen})</option>
            ))}
          </select>
          <select className="mdx-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select className="mdx-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <label className="mdx-checkbox-label">
            <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            Missing only
          </label>
        </div>
        <div className="mdx-filter-summary">
          {filtered.length} of {FORM_LIST.length} forms
          {accounts.length > 0 && ` — tracking ${accounts.find((a) => a.id === activeAccountId)?.name}`}
        </div>
      </div>

      <div className="mdx-dex-grid">
        {filtered.map((f) => {
          const flags = accountSpecies[f.id] || {};
          const cardCategories = visibleCategories.filter((cat) => cat.key !== 'mega' || isMegaCapable(f.id));
          return (
            <div key={f.id} className="mdx-dex-card">
              <div className="mdx-dex-card-head">
                <Sprite dex={f.dex} name={f.name} className="mdx-dex-card-sprite" size="3.25rem" />
                <div className="mdx-dex-card-head-text">
                  <span className="mdx-dex-num">#{String(f.dex).padStart(4, '0')}</span>
                  <span className="mdx-dex-name">{f.name}</span>
                </div>
                <span className="mdx-dex-gen">{FORM_GROUP_LABELS[f.group]}</span>
              </div>
              {f.baseId && (
                <Link to={`/medaldex/species/${f.baseId}`} className="mdx-form-base-link">
                  View base species &rarr;
                </Link>
              )}
              <div className="mdx-dex-types">
                {f.types.map((t) => (
                  <span key={t} className="mdx-type-chip" style={{ '--mdx-type-color': typeColor(t) }}>{t}</span>
                ))}
              </div>
              <div className="mdx-dex-categories">
                {cardCategories.map((cat) => (
                  <CategoryChip
                    key={cat.key}
                    category={cat}
                    feasible={isCategoryFeasible(f.id, cat.key)}
                    checked={!!flags[cat.key]}
                    onToggle={() => toggle(f.id, cat.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="mdx-empty">No forms match these filters.</div>
        )}
      </div>
    </div>
  );
}
