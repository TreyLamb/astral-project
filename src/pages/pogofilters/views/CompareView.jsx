import { useState, useMemo } from 'react';
import { usePogoFilters } from '../pogofiltersContext';
import { terms } from '../filterSyntax';

// Twenty filters that are 95% identical are impossible to compare by eye — that
// is the whole reason this app exists. Pick two or more and this splits them
// into the block they all share and the parts where they actually differ.

const key = (t) => `${t.negated ? '!' : ''}${t.text.toLowerCase().replace(/\s+/g, '')}`;

export default function CompareView() {
  const { filters } = usePogoFilters();
  const [picked, setPicked] = useState([]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const analysis = useMemo(() => {
    const chosen = filters.filter((f) => picked.includes(f.id));
    if (chosen.length < 2) return null;

    const sets = chosen.map((f) => ({ filter: f, list: terms(f.query) }));
    const keySets = sets.map((s) => new Set(s.list.map(key)));

    // shared = present in every selected filter
    const shared = [...keySets[0]].filter((k) => keySets.every((s) => s.has(k)));
    const sharedDisplay = sets[0].list.filter((t) => shared.includes(key(t)));

    const unique = sets.map((s, i) => ({
      filter: s.filter,
      only: s.list.filter((t) => !shared.includes(key(t))),
      missing: [...new Set(sets.flatMap((o, j) => (j === i ? [] : o.list.map(key))))]
        .filter((k) => !keySets[i].has(k) && !shared.includes(k)),
    }));

    return { chosen, sharedDisplay, unique };
  }, [filters, picked]);

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <span className="pgf-h" style={{ margin: 0 }}>Pick two or more filters to compare</span>
        <span className="pgf-spacer" />
        {picked.length > 0 && (
          <button className="pgf-btn pgf-btn-sm" onClick={() => setPicked([])}>Clear ({picked.length})</button>
        )}
      </div>

      <div className="pgf-chipbar">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`pgf-chip${picked.includes(f.id) ? ' on' : ''}`}
            onClick={() => toggle(f.id)}
            title={f.query}
          >
            {f.name}
          </button>
        ))}
      </div>

      {!analysis && (
        <div className="pgf-panel" style={{ padding: 26, textAlign: 'center' }}>
          <p className="pgf-sub" style={{ margin: 0 }}>
            Select at least two filters above. Most of your trash tiers share a long identical
            tail — this pulls that out so the real differences are the only thing left on screen.
          </p>
        </div>
      )}

      {analysis && (
        <>
          <div className="pgf-panel" style={{ padding: 14, marginBottom: 12 }}>
            <div className="pgf-h">
              Shared by all {analysis.chosen.length} · {analysis.sharedDisplay.length} terms
            </div>
            <div className="pgf-query">
              {analysis.sharedDisplay.length === 0
                ? <span className="pgf-tok-op">nothing in common</span>
                : analysis.sharedDisplay.map((t, i) => (
                  <span key={i}>
                    {i > 0 && <span className="pgf-tok-op">&amp;</span>}
                    {t.negated && <span className="pgf-tok-neg">!</span>}
                    <span className="pgf-tok">{t.text}</span>
                  </span>
                ))}
            </div>
          </div>

          <div className="pgf-h">Where they differ</div>
          {analysis.unique.map(({ filter, only, missing }) => (
            <div key={filter.id} className="pgf-panel" style={{ padding: 14, marginBottom: 8 }}>
              <div className="pgf-fcard-name" style={{ marginBottom: 6 }}>{filter.name}</div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div className="pgf-muted" style={{ marginBottom: 4 }}>Only this one has</div>
                  {only.length === 0
                    ? <span className="pgf-muted">—</span>
                    : only.map((t, i) => (
                      <span key={i} className="pgf-lab" style={{ '--lc': '#3ddc97' }}>
                        {t.negated ? '!' : ''}{t.text}
                      </span>
                    ))}
                </div>
                <div style={{ flex: '1 1 240px' }}>
                  <div className="pgf-muted" style={{ marginBottom: 4 }}>Others have, this one doesn&apos;t</div>
                  {missing.length === 0
                    ? <span className="pgf-muted">—</span>
                    : missing.map((k, i) => (
                      <span key={i} className="pgf-lab" style={{ '--lc': '#ff6b7d' }}>{k}</span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
