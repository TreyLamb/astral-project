import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMedalDex } from './medaldexContext';
import { DEX_LIST, isCategoryFeasible } from './medaldexEngine';
import { CATEGORIES, GENERATIONS, ALL_TYPES, typeColor } from './medaldexConfig';
import CategoryChip from './CategoryChip';

export default function DexView() {
  const { accounts, dex, activeAccountId, actions, loading } = useMedalDex();
  const [generationFilter, setGenerationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [missingOnly, setMissingOnly] = useState(false);
  const [search, setSearch] = useState('');

  const accountDoc = dex[activeAccountId];
  const accountSpecies = useMemo(() => accountDoc?.species || {}, [accountDoc]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return DEX_LIST.filter((s) => {
      if (generationFilter !== 'all' && s.generation !== Number(generationFilter)) return false;
      if (typeFilter !== 'all' && !s.types.includes(typeFilter)) return false;
      if (term && !s.name.toLowerCase().includes(term) && !String(s.dex).includes(term)) return false;

      if (missingOnly) {
        const flags = accountSpecies[s.id] || {};
        const categoriesToCheck = categoryFilter === 'all' ? CATEGORIES.map((c) => c.key) : [categoryFilter];
        const hasMissingFeasible = categoriesToCheck.some((cat) => {
          const feasible = isCategoryFeasible(s.id, cat);
          return feasible === true && !flags[cat];
        });
        if (!hasMissingFeasible) return false;
      }

      return true;
    });
  }, [generationFilter, typeFilter, categoryFilter, missingOnly, search, accountSpecies]);

  const visibleCategories = categoryFilter === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.key === categoryFilter);

  if (loading) return <div className="mdx-panel mdx-loading">Loading…</div>;

  if (!activeAccountId) {
    return <div className="mdx-panel mdx-empty">No active account selected.</div>;
  }

  const toggle = (speciesId, category) => actions.toggleSpeciesCategory(activeAccountId, speciesId, category);

  return (
    <div className="mdx-view">
      <div className="mdx-panel mdx-panel-accent mdx-filters">
        <div className="mdx-filter-row">
          <input
            className="mdx-input mdx-search"
            placeholder="Search name or dex #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          {filtered.length} of {DEX_LIST.length} species
          {accounts.length > 0 && ` — tracking ${accounts.find((a) => a.id === activeAccountId)?.name}`}
        </div>
      </div>

      <div className="mdx-dex-grid">
        {filtered.map((s) => {
          const flags = accountSpecies[s.id] || {};
          return (
            <div key={s.id} className="mdx-dex-card">
              <Link to={`/medaldex/species/${s.id}`} className="mdx-dex-card-head">
                <span className="mdx-dex-num">#{String(s.dex).padStart(4, '0')}</span>
                <span className="mdx-dex-name">{s.name}</span>
                <span className="mdx-dex-gen">{s.generationName}</span>
              </Link>
              <div className="mdx-dex-types">
                {s.types.map((t) => (
                  <span key={t} className="mdx-type-chip" style={{ '--mdx-type-color': typeColor(t) }}>{t}</span>
                ))}
              </div>
              <div className="mdx-dex-categories">
                {visibleCategories.map((cat) => (
                  <CategoryChip
                    key={cat.key}
                    category={cat}
                    feasible={isCategoryFeasible(s.id, cat.key)}
                    checked={!!flags[cat.key]}
                    onToggle={() => toggle(s.id, cat.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="mdx-empty">No species match these filters.</div>
        )}
      </div>
    </div>
  );
}
