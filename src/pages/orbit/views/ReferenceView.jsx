import { useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import './ReferenceView.css';

// Sentinel for the "Unfiled" filter chip/select option — distinct from
// `null` (which here means "no area filter, show everything"), same
// two-sentinel pattern as TaskTypeFilter.jsx's UNTYPED.
const UNFILED = '__ref_unfiled__';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text) {
  let out = text;
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (_m, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  // Bare URLs (not already wrapped into an href by the line above — the
  // lookbehind skips anything immediately following `href="`) get linkified
  // too, so pasting a raw link into a reference body doesn't require
  // wrapping it in markdown link syntax first.
  out = out.replace(/(?<!href=")https?:\/\/[^\s<]+/g, (m) => {
    const trailing = (m.match(/[).,!?;:]+$/) || [''])[0];
    const url = trailing ? m.slice(0, -trailing.length) : m;
    return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trailing}` : m;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
  return out;
}

// Copied locally rather than imported from ProjectView.jsx (per brief — each
// view owns its own copy). Same deliberately minimal, XSS-safe approach:
// escape everything first, only ever introduce tags from a fixed allow-list.
function renderMarkdownLite(md) {
  if (!md || !md.trim()) return '';
  const lines = escapeHtml(md).split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(listMatch[1])}</li>`);
      continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    if (line.trim() === '') { out.push('<br/>'); continue; }
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

// Plain-text preview for a collapsed card — strips the handful of markdown
// tokens this renderer understands rather than pulling in a real parser.
function snippet(bodyMarkdown, max = 140) {
  const plain = (bodyMarkdown || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

function ReferenceForm({ areas, initial, submitLabel, onSave, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [bodyMarkdown, setBodyMarkdown] = useState(initial.bodyMarkdown || '');
  const [url, setUrl] = useState(initial.url || '');
  const [areaId, setAreaId] = useState(initial.areaId || '');

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      title: trimmedTitle,
      bodyMarkdown,
      url: url.trim() || null,
      areaId: areaId || null,
    });
  };

  return (
    <div className="orb-ref-form">
      <label className="orb-ref-field">
        <span className="orb-ref-field-label">Title</span>
        <input
          className="orb-ref-input"
          value={title}
          autoFocus
          placeholder="Reference title…"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="orb-ref-form-row">
        <label className="orb-ref-field">
          <span className="orb-ref-field-label">Area</span>
          <select className="orb-ref-select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Unfiled</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="orb-ref-field orb-ref-field-grow">
          <span className="orb-ref-field-label">URL (optional)</span>
          <input
            className="orb-ref-input"
            type="url"
            value={url}
            placeholder="https://…"
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
      </div>

      <label className="orb-ref-field">
        <span className="orb-ref-field-label">Body (Markdown)</span>
        <textarea
          className="orb-ref-textarea"
          value={bodyMarkdown}
          placeholder="Notes… supports **bold**, *italic*, [links](https://…), bare URLs, and - lists"
          onChange={(e) => setBodyMarkdown(e.target.value)}
        />
      </label>

      {bodyMarkdown.trim() && (
        <div className="orb-ref-preview">
          <div className="orb-ref-preview-label">Preview</div>
          <div className="orb-ref-preview-body" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(bodyMarkdown) }} />
        </div>
      )}

      <div className="orb-ref-form-actions">
        <button type="button" className="orb-btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="orb-btn orb-btn-primary" disabled={!title.trim()} onClick={submit}>{submitLabel}</button>
      </div>
    </div>
  );
}

// mode: 'collapsed' | 'expanded' | 'editing' — all in-place on the same
// card, no modal. Delete is a local two-click arm/confirm (no window.confirm
// precedent anywhere else in Orbit) that disarms on blur.
function ReferenceCard({ reference, area, areas, onUpdate, onRemove }) {
  const [mode, setMode] = useState('collapsed');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const toggleExpand = () => setMode((m) => (m === 'collapsed' ? 'expanded' : 'collapsed'));
  const startEdit = () => { setConfirmingDelete(false); setMode('editing'); };

  const handleSave = (updates) => {
    onUpdate(reference.id, updates);
    setMode('expanded');
  };

  const handleDeleteClick = () => {
    if (confirmingDelete) { onRemove(reference.id); return; }
    setConfirmingDelete(true);
  };

  return (
    <div className="orb-card orb-ref-card">
      <div className="orb-ref-card-head" onClick={mode === 'editing' ? undefined : toggleExpand}>
        <button
          type="button"
          className={`orb-ref-expand${mode !== 'collapsed' ? ' active' : ''}`}
          aria-label={mode === 'collapsed' ? `Expand "${reference.title}"` : `Collapse "${reference.title}"`}
          aria-expanded={mode !== 'collapsed'}
          onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
        >
          {mode === 'collapsed' ? '▸' : '▾'}
        </button>
        <span className="orb-ref-title">{reference.title || <em>untitled</em>}</span>
        {area ? (
          <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
            <span className="orb-chip-dot" />{area.name}
          </span>
        ) : (
          <span className="orb-chip orb-ref-unfiled-chip">Unfiled</span>
        )}
        {reference.url && <span className="orb-ref-url-badge" title={reference.url} aria-hidden="true">🔗</span>}
      </div>

      {mode === 'collapsed' && reference.bodyMarkdown && reference.bodyMarkdown.trim() && (
        <div className="orb-ref-snippet">{snippet(reference.bodyMarkdown)}</div>
      )}

      {mode === 'expanded' && (
        <div className="orb-ref-expanded">
          {reference.url && (
            <a className="orb-ref-link" href={reference.url} target="_blank" rel="noopener noreferrer">{reference.url}</a>
          )}
          {reference.bodyMarkdown && reference.bodyMarkdown.trim() ? (
            <div className="orb-ref-body" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(reference.bodyMarkdown) }} />
          ) : (
            <div className="orb-ref-body-empty">No notes.</div>
          )}
          <div className="orb-ref-card-actions">
            <button type="button" className="orb-btn" onClick={startEdit}>Edit</button>
            <button
              type="button"
              className={`orb-btn orb-ref-delete${confirmingDelete ? ' orb-flag-warn' : ''}`}
              onClick={handleDeleteClick}
              onBlur={() => setConfirmingDelete(false)}
            >
              {confirmingDelete ? 'Confirm delete?' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {mode === 'editing' && (
        <ReferenceForm
          areas={areas}
          initial={reference}
          submitLabel="Save"
          onSave={handleSave}
          onCancel={() => setMode('expanded')}
        />
      )}
    </div>
  );
}

// The read-later shelf (§4.7) — full-text search + area filter over a flat
// list, with inline create/edit/delete and no modals (spec constraint).
export default function ReferenceView() {
  const { areas, references, addReference, updateReference, removeReference } = useOrbit();
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState(null); // null='All' | UNFILED | areaId
  const [creating, setCreating] = useState(false);

  // Archived areas still surface here if a reference is actually filed
  // under one — same precedent as ProjectView's own area <select> — so
  // filtering/re-filing never silently strands a reference off-screen.
  const filterAreas = useMemo(() => {
    const usedArchivedIds = new Set(references.filter((r) => r.areaId).map((r) => r.areaId));
    return areas.filter((a) => !a.archived || usedArchivedIds.has(a.id));
  }, [areas, references]);
  const areasById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return references
      .filter((r) => {
        if (areaFilter === UNFILED) return !r.areaId;
        if (areaFilter) return r.areaId === areaFilter;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return (r.title || '').toLowerCase().includes(q) || (r.bodyMarkdown || '').toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [references, query, areaFilter]);

  const handleCreate = (partial) => {
    addReference(partial);
    setCreating(false);
  };

  return (
    <div className="orb-ref">
      <div className="orb-ref-head">
        <h2 className="orb-ref-h2">Reference Vault</h2>
        {!creating && (
          <button type="button" className="orb-btn orb-btn-primary" onClick={() => setCreating(true)}>+ Add reference</button>
        )}
      </div>

      {creating && (
        <div className="orb-card orb-ref-create-card">
          <ReferenceForm
            areas={filterAreas}
            initial={{ title: '', bodyMarkdown: '', url: '', areaId: '' }}
            submitLabel="Create"
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="orb-ref-controls">
        <input
          className="orb-ref-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or body…"
          aria-label="Search reference vault"
        />
        <div className="orb-ref-filter-chips" role="group" aria-label="Filter by area">
          <button
            type="button"
            className={`orb-chip orb-ref-filter-chip${areaFilter === null ? ' active' : ''}`}
            onClick={() => setAreaFilter(null)}
          >
            All
          </button>
          <button
            type="button"
            className={`orb-chip orb-ref-filter-chip${areaFilter === UNFILED ? ' active' : ''}`}
            onClick={() => setAreaFilter(UNFILED)}
          >
            Unfiled
          </button>
          {filterAreas.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`orb-chip orb-ref-filter-chip${areaFilter === a.id ? ' active' : ''}`}
              style={{ '--orb-chip-color': a.color }}
              onClick={() => setAreaFilter(a.id)}
            >
              <span className="orb-chip-dot" />{a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="orb-ref-list">
        {filtered.length === 0 ? (
          <div className="orb-area-empty">
            {references.length === 0 ? 'No references yet — add one to get started.' : 'No references match your search/filter.'}
          </div>
        ) : (
          filtered.map((r) => (
            <ReferenceCard
              key={r.id}
              reference={r}
              area={areasById.get(r.areaId)}
              areas={filterAreas}
              onUpdate={updateReference}
              onRemove={removeReference}
            />
          ))
        )}
      </div>
    </div>
  );
}
