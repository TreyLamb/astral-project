import { useState, useMemo, useCallback } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { newFilter, detectCpTier, detectStarBand, STAR_BANDS } from '../pogofiltersConfig';
import { buildVocabulary, lintFilter, terms, SEVERITY_RANK } from '../filterSyntax';
import speciesJson from '../../pogoaccs/data/species.json';
import QueryText from './QueryText';
import LintList from './LintList';

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export default function FiltersView() {
  const {
    filters, labels, saveFilter, removeFilter, showToast, mode, reseed,
  } = usePogoFilters();

  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [only, setOnly] = useState('all'); // all | managed | problems

  const vocab = useMemo(() => buildVocabulary(labels, speciesJson), [labels]);

  const lintByFilter = useMemo(() => {
    const map = new Map();
    for (const f of filters) map.set(f.id, lintFilter(f, vocab));
    return map;
  }, [filters, vocab]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filters.filter((f) => {
      if (only === 'managed' && !f.managed) return false;
      if (only === 'problems' && !(lintByFilter.get(f.id) || []).some((i) => i.severity !== 'info')) return false;
      if (q && !(f.name.toLowerCase().includes(q) || f.query.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [filters, search, only, lintByFilter]);

  const problemCount = useMemo(
    () => filters.filter((f) => (lintByFilter.get(f.id) || []).some((i) => i.severity !== 'info')).length,
    [filters, lintByFilter],
  );

  const open = useCallback((f) => {
    if (openId === f.id) { setOpenId(null); setDraft(null); return; }
    setOpenId(f.id);
    setDraft({ ...f });
  }, [openId]);

  const commitDraft = useCallback(async () => {
    if (!draft) return;
    await saveFilter({
      ...draft,
      cpTier: detectCpTier(draft.query),
      starBand: detectStarBand(draft.query),
    });
    showToast(`Saved "${draft.name}"`);
  }, [draft, saveFilter, showToast]);

  // Toggle a label in the open filter's query. Cycles absent -> negated, since
  // "!Label" is the form these trash filters actually use.
  const toggleLabel = useCallback((label) => {
    if (!draft) return;
    const present = terms(draft.query).find((t) => norm(t.text) === norm(label.name));
    let next;
    if (!present) {
      next = draft.query.trim() ? `${draft.query.trim()}&!${label.name}` : `!${label.name}`;
    } else {
      // Remove the whole term including its joining operator, without touching
      // anything else in the string.
      const esc = label.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      next = draft.query
        .replace(new RegExp(`&\\s*!?\\s*${esc}(?=[&,)]|$)`, 'i'), '')
        .replace(new RegExp(`^!?\\s*${esc}\\s*&`, 'i'), '')
        .replace(new RegExp(`^!?\\s*${esc}$`, 'i'), '');
    }
    setDraft({ ...draft, query: next });
  }, [draft]);

  const addFilter = useCallback(async () => {
    const f = newFilter({ name: 'New filter', query: '' });
    await saveFilter(f);
    setOpenId(f.id);
    setDraft({ ...f });
  }, [saveFilter]);

  const duplicate = useCallback(async (f) => {
    const copy = newFilter({ ...f, name: `${f.name} (copy)` });
    await saveFilter(copy);
    showToast(`Duplicated "${f.name}"`);
  }, [saveFilter, showToast]);

  const copyQuery = useCallback((f) => {
    navigator.clipboard?.writeText(f.query).then(
      () => showToast('Query copied — paste it into the game search bar'),
      () => showToast('Could not copy to clipboard', 'error'),
    );
  }, [showToast]);

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <button className={`pgf-chip${only === 'all' ? ' on' : ''}`} onClick={() => setOnly('all')}>
          All <span className="pgf-chip-n">{filters.length}</span>
        </button>
        <button className={`pgf-chip${only === 'managed' ? ' on' : ''}`} onClick={() => setOnly('managed')}>
          Managed <span className="pgf-chip-n">{filters.filter((f) => f.managed).length}</span>
        </button>
        <button
          className={`pgf-chip warn${only === 'problems' ? ' on' : ''}`}
          onClick={() => setOnly('problems')}
        >
          Needs attention <span className="pgf-chip-n">{problemCount}</span>
        </button>

        <input
          className="pgf-input"
          style={{ width: 230 }}
          placeholder="Search names and queries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <span className="pgf-spacer" />
        <button className="pgf-btn pgf-btn-primary" onClick={addFilter}>+ New filter</button>
        {filters.length === 0 && (
          <button className="pgf-btn" onClick={reseed}>Load from markdown</button>
        )}
      </div>

      {filters.length === 0 ? (
        <div className="pgf-panel" style={{ padding: 28, textAlign: 'center' }}>
          <p className="pgf-sub" style={{ margin: 0 }}>
            No filters yet. “Load from markdown” imports your real filters from
            <code> PogoFilters/Existingfilters.md</code>.
          </p>
        </div>
      ) : (
        <div className="pgf-filter-list">
          {visible.map((f) => {
            const isOpen = openId === f.id;
            const issues = (lintByFilter.get(f.id) || [])
              .slice()
              .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
            const worst = issues[0];
            const d = isOpen ? draft : null;

            return (
              <div key={f.id} className={`pgf-fcard${f.managed ? ' managed' : ''}${isOpen ? ' open' : ''}`}>
                <div className="pgf-fcard-head" onClick={() => open(f)} title={f.query}>
                  {/* Copy is the single most-used action — one tap, without
                      having to expand the card first. */}
                  <button
                    className="pgf-copybtn"
                    title="Copy this filter"
                    aria-label={`Copy the ${f.name} filter`}
                    onClick={(e) => { e.stopPropagation(); copyQuery(f); }}
                  >
                    ⧉
                  </button>
                  <span className="pgf-fcard-name">{f.name}</span>
                  <span className="pgf-fcard-preview">{f.query}</span>
                  <span className="pgf-fcard-meta">
                    {worst && (
                      <span className={`pgf-lint-badge pgf-lint-${worst.severity}`}>
                        {issues.filter((i) => i.severity !== 'info').length || issues.length}
                        {worst.severity === 'error' ? ' error' : worst.severity === 'warning' ? ' warn' : ' note'}
                      </span>
                    )}
                    {f.cpTier && <span className="pgf-fcard-chars">cp{f.cpTier}</span>}
                    <span className="pgf-fcard-chars">{STAR_BANDS[f.starBand]?.label}</span>
                    <span className="pgf-fcard-chars">{f.query.length} ch</span>
                  </span>
                </div>

                {isOpen && d && (
                  <div className="pgf-fcard-body">
                    <div className="pgf-fcard-row">
                      <input
                        className="pgf-input"
                        style={{ flex: '1 1 240px' }}
                        value={d.name}
                        onChange={(e) => setDraft({ ...d, name: e.target.value })}
                      />
                      <label className="pgf-switch" title="Let the species matrix add and remove species names in this filter">
                        <input
                          type="checkbox"
                          checked={d.managed}
                          onChange={(e) => setDraft({ ...d, managed: e.target.checked })}
                        />
                        <span className="pgf-switch-track" />
                        Managed
                      </label>
                    </div>

                    <QueryText query={d.query} vocab={vocab} />

                    <textarea
                      className="pgf-textarea"
                      style={{ marginTop: 10 }}
                      value={d.query}
                      spellCheck={false}
                      onChange={(e) => setDraft({ ...d, query: e.target.value })}
                    />

                    <div className="pgf-fcard-row">
                      <span className="pgf-muted">{d.query.length} characters · length is never a constraint</span>
                      <span className="pgf-spacer" />
                      <button className="pgf-btn pgf-btn-sm" onClick={() => copyQuery(d)}>Copy</button>
                      <button className="pgf-btn pgf-btn-sm" onClick={() => duplicate(f)}>Duplicate</button>
                      <button
                        className="pgf-btn pgf-btn-sm pgf-btn-danger"
                        onClick={() => { removeFilter(f.id); setOpenId(null); }}
                      >
                        Delete
                      </button>
                      <button className="pgf-btn pgf-btn-sm pgf-btn-primary" onClick={commitDraft}>Save</button>
                    </div>

                    <div className="pgf-fcard-row" style={{ marginTop: 12 }}>
                      <span className="pgf-h" style={{ margin: 0, width: '100%' }}>
                        Click a label to add or remove it from this query
                      </span>
                      {labels.map((l) => {
                        const t = terms(d.query).find((x) => norm(x.text) === norm(l.name));
                        return (
                          <button
                            key={l.id}
                            className={`pgf-lab${t ? (t.negated ? ' neg' : '') : ' off'}`}
                            style={{ '--lc': l.color }}
                            title={t ? `Present as ${t.negated ? '!' : ''}${t.text} — click to remove` : 'Click to add as an exclusion'}
                            onClick={() => toggleLabel(l)}
                          >
                            {t?.negated ? '!' : ''}{l.name}
                          </button>
                        );
                      })}
                    </div>

                    {issues.length > 0 && <LintList issues={issues} onFix={(fix) => {
                      const next = d.query.split(fix.find).join(fix.replace);
                      setDraft({ ...d, query: next });
                    }} />}

                    <div style={{ marginTop: 12 }}>
                      <span className="pgf-h">Notes</span>
                      <textarea
                        className="pgf-textarea"
                        style={{ minHeight: 60, fontFamily: 'inherit' }}
                        placeholder="Why this filter exists, what it misses, when you run it…"
                        value={d.notes}
                        onChange={(e) => setDraft({ ...d, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="pgf-muted" style={{ marginTop: 16 }}>
        {visible.length} of {filters.length} shown · {mode === 'cloud' ? 'synced to your account' : 'saved on this device'}
      </p>
    </div>
  );
}
