import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import TaskRow from './TaskRow';
import './ProjectView.css';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// resolveWikilink(rawTitle) -> ReferenceItem | undefined, or omitted entirely
// when the caller has no references to resolve against. rawTitle arrives
// already HTML-escaped (inline() runs after escapeHtml — see
// renderMarkdownLite below), so callers must key their lookup off
// escaped+lowercased titles too (see buildWikilinkResolver).
function inline(text, resolveWikilink) {
  let out = text;
  if (resolveWikilink) {
    out = out.replace(/\[\[([^\]]+)\]\]/g, (whole, rawTitle) => {
      const ref = resolveWikilink(rawTitle);
      return ref ? `<a href="/orbit/reference" class="orb-pv-wikilink">${rawTitle}</a>` : whole;
    });
  }
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (_m, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  // Bare URLs, not just markdown [label](url) links — the lookbehind skips
  // anything already sitting inside an href="..." from the replace above.
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

// No markdown dependency in package.json (checked) — this is a deliberately
// minimal, safe renderer: escape everything first, then only ever introduce
// tags from a fixed allow-list (a/strong/em/ul/li/p/br), so raw HTML typed
// into notes can never execute. Supports bold/italic/links/line-breaks/lists
// only, per the brief — not a general markdown implementation.
// resolveWikilink is optional and threaded straight through to inline() —
// omit it to render notes with [[...]] left as inert literal text.
function renderMarkdownLite(md, resolveWikilink) {
  if (!md || !md.trim()) return '';
  const lines = escapeHtml(md).split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(listMatch[1], resolveWikilink)}</li>`);
      continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    if (line.trim() === '') { out.push('<br/>'); continue; }
    out.push(`<p>${inline(line, resolveWikilink)}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

// Raw (unescaped) [[title]] tokens out of notesMarkdown, lowercased — used
// both to build the escaped-text resolver below and to decide which
// references count as "linked" in the sidebar list.
function extractWikilinkTitles(md) {
  const titles = new Set();
  if (!md) return titles;
  const re = /\[\[([^\]]+)\]\]/g;
  let m = re.exec(md);
  while (m) {
    titles.add(m[1].trim().toLowerCase());
    m = re.exec(md);
  }
  return titles;
}

// inline() sees already-escaped text (escapeHtml ran over the whole
// markdown first), so the resolver's lookup keys have to go through the
// same escapeHtml + lowercase + trim to match reliably — e.g. a title
// containing "&" would otherwise never resolve.
function buildWikilinkResolver(references) {
  const byEscapedTitle = new Map();
  references.forEach((r) => {
    if (r.title) byEscapedTitle.set(escapeHtml(r.title).trim().toLowerCase(), r);
  });
  return (rawTitle) => byEscapedTitle.get(rawTitle.trim().toLowerCase());
}

// No status *type* any more — a project is either open or done, nothing else.
// The field still exists on the record (old rows may hold 'paused'/'archived'
// and filters elsewhere read `status !== 'archived'`), it's just no longer
// something you classify.
const TASK_FILTERS = ['all', 'todo', 'doing', 'done', 'killed'];

function ProjectName({ project, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== project.name) onCommit(trimmed);
    else setDraft(project.name);
  };

  if (editing) {
    return (
      <input
        className="orb-pv-name-input"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(project.name); setEditing(false); }
        }}
      />
    );
  }
  return (
    <h2 className="orb-pv-name" onClick={() => { setDraft(project.name); setEditing(true); }}>
      {project.name || <em>untitled project</em>}
    </h2>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const { areas, projects, tasks, references, updateProject, addTask } = useOrbit();
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [guardMsg, setGuardMsg] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="orb-pv-notfound">
        <p>Project not found.</p>
        <Link to="/orbit/areas" className="orb-btn">← Back to Areas</Link>
      </div>
    );
  }

  const area = areas.find((a) => a.id === project.areaId);
  const allProjectTasks = tasks.filter((t) => t.projectId === project.id);
  const topLevelTasks = allProjectTasks.filter((t) => !t.parentTaskId);
  const visibleTasks = statusFilter === 'all' ? topLevelTasks : topLevelTasks.filter((t) => t.status === statusFilter);
  const openCount = allProjectTasks.filter((t) => t.status === 'todo' || t.status === 'doing').length;

  // Linked references (§4.5 wrap-up) — one-way resolution only, no
  // backlink graph: a reference counts as "linked" if its title is
  // [[wikilinked]] from these notes, or it's filed under this project's
  // area. resolveWikilink (escaped-text lookup) drives the inline render
  // below; wikilinkTitles (raw lowercased titles) drives the sidebar list —
  // both read from the same notesMarkdown/references but via the string
  // form each call site actually has on hand.
  const resolveWikilink = buildWikilinkResolver(references);
  const wikilinkTitles = extractWikilinkTitles(project.notesMarkdown);
  const linkedReferences = references
    .map((r) => {
      const viaWikilink = !!r.title && wikilinkTitles.has(r.title.trim().toLowerCase());
      const viaArea = !!project.areaId && r.areaId === project.areaId;
      return (viaWikilink || viaArea) ? { ref: r, viaWikilink, viaArea } : null;
    })
    .filter(Boolean);

  const startEditNotes = () => {
    setNotesDraft(project.notesMarkdown || '');
    setEditingNotes(true);
  };
  const commitNotes = () => {
    setEditingNotes(false);
    if (notesDraft !== (project.notesMarkdown || '')) updateProject(project.id, { notesMarkdown: notesDraft });
  };

  const handleStatusChange = (nextStatus) => {
    if (nextStatus === 'done') {
      if (openCount > 0) {
        setGuardMsg(`Can't mark done — ${openCount} open task${openCount === 1 ? '' : 's'} still todo/doing. Finish or kill ${openCount === 1 ? 'it' : 'them'} first.`);
        return;
      }
    }
    setGuardMsg(null);
    updateProject(project.id, { status: nextStatus });
  };

  const submitAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) { setAddingTask(false); return; }
    addTask({ areaId: project.areaId, projectId: project.id, title });
    setNewTaskTitle('');
  };

  return (
    <div className="orb-pv">
      <div className="orb-pv-header orb-card">
        <div className="orb-pv-header-top">
          <ProjectName project={project} onCommit={(name) => updateProject(project.id, { name })} />
          {/* Toggles both ways — marking done by mistake shouldn't be a
              one-way door now that there's no status picker to undo it with. */}
          <button
            type="button"
            className="orb-btn orb-btn-primary orb-pv-done-btn"
            onClick={() => handleStatusChange(project.status === 'done' ? 'active' : 'done')}
          >
            {project.status === 'done' ? '✓ Done — reopen' : 'Mark project done'}
          </button>
        </div>

        <div className="orb-pv-header-fields">
          <label className="orb-pv-field">
            <span className="orb-pv-field-label">Area</span>
            <select
              className="orb-pv-select"
              value={project.areaId || ''}
              onChange={(e) => updateProject(project.id, { areaId: e.target.value })}
            >
              {areas.filter((a) => !a.archived || a.id === project.areaId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          <label className="orb-pv-field">
            <span className="orb-pv-field-label">Due date</span>
            <input
              className="orb-pv-input"
              type="date"
              value={project.dueDate || ''}
              onChange={(e) => updateProject(project.id, { dueDate: e.target.value || null })}
            />
          </label>

          {area && (
            <span className="orb-chip orb-pv-area-chip" style={{ '--orb-chip-color': area.color }}>
              <span className="orb-chip-dot" />{area.name}
            </span>
          )}
        </div>

        {guardMsg && <div className="orb-pv-guard-msg orb-flag-warn">{guardMsg}</div>}
      </div>

      <div className="orb-card orb-pv-notes">
        <div className="orb-pv-notes-head">
          <span className="orb-pv-section-title">Notes</span>
          {!editingNotes && <button type="button" className="orb-btn" onClick={startEditNotes}>Edit</button>}
        </div>
        {editingNotes ? (
          <div className="orb-pv-notes-edit">
            <textarea
              className="orb-pv-notes-textarea"
              autoFocus
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
              onKeyDown={(e) => { if (e.key === 'Escape') { setNotesDraft(project.notesMarkdown || ''); setEditingNotes(false); } }}
              placeholder="Standing context for this project… supports **bold**, *italic*, [links](https://…), and - lists"
            />
            <div className="orb-pv-notes-hint">Markdown: **bold**, *italic*, [text](url), - list items. Click outside to save.</div>
          </div>
        ) : project.notesMarkdown && project.notesMarkdown.trim() ? (
          <div
            className="orb-pv-notes-rendered"
            onClick={startEditNotes}
            dangerouslySetInnerHTML={{ __html: renderMarkdownLite(project.notesMarkdown, resolveWikilink) }}
          />
        ) : (
          <div className="orb-pv-notes-empty" onClick={startEditNotes}>Click to add notes…</div>
        )}
      </div>

      <div className="orb-card orb-pv-tasks">
        <div className="orb-pv-tasks-head">
          <span className="orb-pv-section-title">Tasks</span>
          <div className="orb-pv-filters">
            {TASK_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`orb-btn orb-pv-filter-btn${statusFilter === f ? ' active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="orb-pv-task-list">
          {visibleTasks.length === 0 && <div className="orb-area-empty">No tasks{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}</div>}
          {visibleTasks.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}
        </div>

        {addingTask ? (
          <input
            className="orb-area-quickadd-input"
            autoFocus
            value={newTaskTitle}
            placeholder="Task title…"
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitAddTask();
              if (e.key === 'Escape') { setNewTaskTitle(''); setAddingTask(false); }
            }}
            onBlur={() => { if (newTaskTitle.trim()) submitAddTask(); else setAddingTask(false); }}
          />
        ) : (
          <button type="button" className="orb-area-quickadd-btn" onClick={() => setAddingTask(true)}>+ Add task</button>
        )}
      </div>

      <div className="orb-card orb-pv-refs">
        <span className="orb-pv-section-title">Linked references</span>
        {linkedReferences.length === 0 ? (
          <div className="orb-area-empty">
            No linked references yet — write <code>[[reference title]]</code> in notes above, or file a reference under this project's area, to see it here.
          </div>
        ) : (
          <ul className="orb-pv-refs-list">
            {linkedReferences.map(({ ref, viaWikilink, viaArea }) => (
              <li key={ref.id} className="orb-pv-refs-item">
                <Link to="/orbit/reference" className="orb-pv-refs-link">{ref.title || <em>untitled</em>}</Link>
                {viaWikilink && <span className="orb-chip orb-pv-refs-reason">[[wikilink]]</span>}
                {viaArea && <span className="orb-chip orb-pv-refs-reason">same area</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
