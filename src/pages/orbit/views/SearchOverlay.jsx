import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import './SearchOverlay.css';

const RESULT_CAP = 8; // per group — keeps the list scannable, not a full data dump

// Case-insensitive substring match, doubling as a cheap "fuzziness": a match
// at the very start of the string outranks one buried in the middle, so
// typing a task's first few letters still surfaces it above a coincidental
// mid-string hit elsewhere.
function matchScore(haystack, needle) {
  if (!haystack) return -1;
  const idx = haystack.toLowerCase().indexOf(needle);
  return idx;
}

function bestOf(...scores) {
  const hits = scores.filter((s) => s >= 0);
  return hits.length ? Math.min(...hits) : -1;
}

export default function SearchOverlay({ open, onClose }) {
  const { tasks, projects, references } = useOrbit();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef(null);

  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Reset query on every open (compare-in-render, same pattern CaptureBar
  // uses for its capture counter) so a stale search never lingers into the
  // next time the overlay is summoned.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setQuery(''); setHighlightIndex(0); }
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { taskResults: [], projectResults: [], referenceResults: [] };

    const taskResults = tasks
      .map((t) => ({ item: t, score: matchScore(t.title, q) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, RESULT_CAP)
      .map((r) => r.item);

    const projectResults = projects
      .map((p) => ({ item: p, score: matchScore(p.name, q) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, RESULT_CAP)
      .map((r) => r.item);

    const referenceResults = references
      .map((r) => ({ item: r, score: bestOf(matchScore(r.title, q), matchScore(r.bodyMarkdown, q)) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, RESULT_CAP)
      .map((r) => r.item);

    return { taskResults, projectResults, referenceResults };
  }, [query, tasks, projects, references]);

  // Flattened in fixed group order (tasks, projects, references) purely so
  // arrow keys/Enter have one linear index to walk — the grouped JSX below
  // renders off the same three arrays independently.
  const flat = useMemo(() => [
    ...groups.taskResults.map((item) => ({ type: 'task', item })),
    ...groups.projectResults.map((item) => ({ type: 'project', item })),
    ...groups.referenceResults.map((item) => ({ type: 'reference', item })),
  ], [groups]);

  if (!open) return null;

  const safeIndex = flat.length ? Math.min(highlightIndex, flat.length - 1) : -1;

  const openResult = (result) => {
    if (!result) return;
    onClose();
    if (result.type === 'task') {
      navigate(result.item.projectId ? `/orbit/project/${result.item.projectId}` : '/orbit/areas');
    } else if (result.type === 'project') {
      navigate(`/orbit/project/${result.item.id}`);
    } else {
      navigate('/orbit/reference');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length) setHighlightIndex((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length) setHighlightIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openResult(flat[safeIndex]);
    }
  };

  const rowClass = (idx) => `orb-search-row${idx === safeIndex ? ' active' : ''}`;

  return (
    <div className="orb-search-wrap" role="dialog" aria-label="Search">
      <div className="orb-search-panel">
        <div className="orb-search-inputrow">
          <span className="orb-search-icon" aria-hidden="true">🔎</span>
          <input
            ref={inputRef}
            type="text"
            className="orb-search-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlightIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search tasks, projects, reference…"
            aria-label="Search Orbit"
          />
          <button type="button" className="orb-search-close" onClick={onClose} aria-label="Close search">✕</button>
        </div>

        <div className="orb-search-results">
          {!query.trim() && (
            <div className="orb-search-hint">Start typing to search tasks, projects, and reference items.</div>
          )}

          {query.trim() && flat.length === 0 && (
            <div className="orb-search-hint">No matches for "{query.trim()}".</div>
          )}

          {groups.taskResults.length > 0 && (
            <div className="orb-search-group">
              <div className="orb-search-group-label">Tasks</div>
              {groups.taskResults.map((t, i) => (
                <button
                  type="button"
                  key={t.id}
                  className={rowClass(i)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  onClick={() => openResult({ type: 'task', item: t })}
                >
                  <span className="orb-search-row-title">{t.title || '(untitled task)'}</span>
                  <span className="orb-search-row-sub">
                    {t.projectId ? (projectsById.get(t.projectId)?.name ?? 'Project') : 'No project'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {groups.projectResults.length > 0 && (
            <div className="orb-search-group">
              <div className="orb-search-group-label">Projects</div>
              {groups.projectResults.map((p, i) => {
                const idx = groups.taskResults.length + i;
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={rowClass(idx)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => openResult({ type: 'project', item: p })}
                  >
                    <span className="orb-search-row-title">{p.name || '(untitled project)'}</span>
                    <span className="orb-search-row-sub">{p.status}</span>
                  </button>
                );
              })}
            </div>
          )}

          {groups.referenceResults.length > 0 && (
            <div className="orb-search-group">
              <div className="orb-search-group-label">Reference</div>
              {groups.referenceResults.map((r, i) => {
                const idx = groups.taskResults.length + groups.projectResults.length + i;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={rowClass(idx)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => openResult({ type: 'reference', item: r })}
                  >
                    <span className="orb-search-row-title">{r.title || '(untitled reference)'}</span>
                    <span className="orb-search-row-sub">{(r.bodyMarkdown || '').slice(0, 60)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
