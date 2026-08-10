import { useState, useMemo } from 'react';
import { usePogoFilters } from '../pogofiltersContext';

const CONTEXT = 15; // characters either side, per the original request

// Ctrl-F across every saved query. Results are grouped by filter and show the
// match with 15 characters of surrounding query on each side, so you can see
// what a term sits next to without opening every filter.
function hits(text, needle, caseSensitive) {
  if (!needle) return [];
  const hay = caseSensitive ? text : text.toLowerCase();
  const nee = caseSensitive ? needle : needle.toLowerCase();
  const out = [];
  let i = hay.indexOf(nee);
  while (i !== -1) {
    out.push({
      before: text.slice(Math.max(0, i - CONTEXT), i),
      match: text.slice(i, i + needle.length),
      after: text.slice(i + needle.length, i + needle.length + CONTEXT),
      truncatedStart: i - CONTEXT > 0,
      truncatedEnd: i + needle.length + CONTEXT < text.length,
      index: i,
    });
    i = hay.indexOf(nee, i + Math.max(1, needle.length));
  }
  return out;
}

export default function FindView() {
  const { filters, commitFilters, showToast, undo, hasUndo } = usePogoFilters();
  const [needle, setNeedle] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [searchNotes, setSearchNotes] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const results = useMemo(() => {
    if (!needle) return [];
    return filters
      .map((f) => ({
        filter: f,
        query: hits(f.query, needle, caseSensitive),
        name: searchNotes ? hits(f.name, needle, caseSensitive) : [],
        notes: searchNotes ? hits(f.notes || '', needle, caseSensitive) : [],
      }))
      .filter((r) => r.query.length || r.name.length || r.notes.length);
  }, [filters, needle, caseSensitive, searchNotes]);

  const total = results.reduce((n, r) => n + r.query.length + r.name.length + r.notes.length, 0);

  const replaceAll = async () => {
    const next = filters.map((f) => {
      if (!hits(f.query, needle, caseSensitive).length) return f;
      const q = caseSensitive
        ? f.query.split(needle).join(replacement)
        : f.query.replace(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement);
      return { ...f, query: q };
    });
    await commitFilters(next, `Replace "${needle}" with "${replacement}"`);
    setConfirming(false);
    showToast(`Replaced in ${results.filter((r) => r.query.length).length} filters — undo is available`);
  };

  const affected = results.filter((r) => r.query.length);

  return (
    <div className="pgf-page">
      <div className="pgf-chipbar">
        <input
          className="pgf-input" style={{ width: 240 }} autoFocus
          placeholder="Find in all queries… e.g. !fire"
          value={needle} onChange={(e) => setNeedle(e.target.value)}
        />
        <input
          className="pgf-input" style={{ width: 240 }}
          placeholder="Replace with… (optional)"
          value={replacement} onChange={(e) => setReplacement(e.target.value)}
        />
        <label className="pgf-switch">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          <span className="pgf-switch-track" />
          Case sensitive
        </label>
        <label className="pgf-switch">
          <input type="checkbox" checked={searchNotes} onChange={(e) => setSearchNotes(e.target.checked)} />
          <span className="pgf-switch-track" />
          Names &amp; notes too
        </label>
        <span className="pgf-spacer" />
        {hasUndo && <button className="pgf-btn pgf-btn-sm" onClick={undo}>Undo last bulk change</button>}
        <button
          className="pgf-btn pgf-btn-primary"
          disabled={!needle || !affected.length}
          onClick={() => setConfirming(true)}
        >
          Replace in {affected.length} filters
        </button>
      </div>

      <p className="pgf-sub">
        Case sensitivity is on by default because in-game matching is case-sensitive — searching
        <code> Evolveme</code> and <code>evolve me</code> genuinely gives different answers.
      </p>

      {needle && (
        <p className="pgf-muted" style={{ marginBottom: 10 }}>
          {total} match{total === 1 ? '' : 'es'} across {results.length} filter{results.length === 1 ? '' : 's'}
        </p>
      )}

      <div className="pgf-panel">
        {results.map((r) => (
          <div key={r.filter.id} className="pgf-hit">
            <div className="pgf-hit-name">{r.filter.name}</div>
            {r.query.map((h, i) => (
              <div key={`q${i}`} className="pgf-hit-ctx">
                {h.truncatedStart && <span className="pgf-tok-op">…</span>}
                {h.before}<mark>{h.match}</mark>{h.after}
                {h.truncatedEnd && <span className="pgf-tok-op">…</span>}
              </div>
            ))}
            {r.name.map((h, i) => (
              <div key={`n${i}`} className="pgf-hit-ctx">
                <span className="pgf-tok-op">name: </span>{h.before}<mark>{h.match}</mark>{h.after}
              </div>
            ))}
            {r.notes.map((h, i) => (
              <div key={`t${i}`} className="pgf-hit-ctx">
                <span className="pgf-tok-op">notes: </span>{h.before}<mark>{h.match}</mark>{h.after}
              </div>
            ))}
          </div>
        ))}
        {needle && results.length === 0 && (
          <p className="pgf-muted" style={{ padding: 24, textAlign: 'center' }}>No matches.</p>
        )}
        {!needle && (
          <p className="pgf-muted" style={{ padding: 24, textAlign: 'center' }}>
            Type a term to search every saved query.
          </p>
        )}
      </div>

      {confirming && (
        <div className="pgf-modal-back" onClick={() => setConfirming(false)}>
          <div className="pgf-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="pgf-modal-title">Replace across {affected.length} filters</h3>
            <p className="pgf-sub">
              Replacing <code>{needle}</code> with <code>{replacement || '(nothing)'}</code>. Review
              every change below — this is undoable, but it is a bulk edit.
            </p>
            <div className="pgf-diff">
              {affected.map((r) => {
                const after = caseSensitive
                  ? r.filter.query.split(needle).join(replacement)
                  : r.filter.query.replace(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement);
                return (
                  <div key={r.filter.id}>
                    <div className="pgf-diff-file">{r.filter.name}</div>
                    <span className="pgf-diff-del">− {r.filter.query}</span>
                    <span className="pgf-diff-add">+ {after}</span>
                  </div>
                );
              })}
            </div>
            <div className="pgf-modal-actions">
              <button className="pgf-btn" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="pgf-btn pgf-btn-primary" onClick={replaceAll}>
                Apply to {affected.length} filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
