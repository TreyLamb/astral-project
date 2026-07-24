import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import './SettingsView.css';

// defaultView isn't wired into routing yet (that's OrbitApp.jsx's call, not
// this view's) — these values just match the route segments under /orbit/
// so whenever it IS read, the stored value is already the right shape.
const VIEW_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'areas', label: 'Areas' },
  { value: 'reference', label: 'Reference Vault' },
  { value: 'review', label: 'Weekly Review' },
  { value: 'trackers', label: 'Trackers' },
  { value: 'planner', label: 'Planner' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'history', label: 'History' },
  { value: 'carryover', label: 'Carryover' },
  { value: 'views', label: 'Views hub' },
];

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function slugifyLane(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Inline-edit numeric field — local draft + commit-on-blur/Enter, same
// pattern as TaskEditor's timeMin field. Deliberately NOT committing on
// every keystroke: updateSettings recomputes every task's priorityScore on
// each call (see orbitContext.js), so a per-digit commit would thrash that
// on something like typing "1.5" over three keystrokes.
function NumberField({ label, value, onCommit, min, step, suffix, hint }) {
  const [draft, setDraft] = useState(String(value));
  const [dirty, setDirty] = useState(false);
  const display = dirty ? draft : String(value);

  const commit = () => {
    setDirty(false);
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed) && parsed !== value) onCommit(parsed);
    else setDraft(String(value));
  };

  return (
    <label className="orb-set-field">
      <span className="orb-set-label">{label}</span>
      <div className="orb-set-field-row">
        <input
          className="orb-set-input"
          type="number"
          min={min}
          step={step}
          value={display}
          onFocus={() => { setDirty(true); setDraft(String(value)); }}
          onChange={(e) => { setDirty(true); setDraft(e.target.value); }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { setDirty(false); setDraft(String(value)); }
          }}
        />
        {suffix && <span className="orb-set-suffix">{suffix}</span>}
      </div>
      {hint && <span className="orb-set-hint">{hint}</span>}
    </label>
  );
}

// Chip-list + inline-add editor shared by Task types and Lanes — both are
// just user-managed string arrays on settings, differing only in how a new
// entry gets normalized (`sanitize`) and how existing entries are
// labeled/annotated (`labelFor`/`countFor`).
function ChipListEditor({ items, onChange, addPlaceholder, sanitize = (s) => s.trim(), labelFor = (s) => s, countFor }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const clean = sanitize(draft);
    if (clean && !items.includes(clean)) onChange([...items, clean]);
    setDraft('');
    setAdding(false);
  };

  const remove = (item) => onChange(items.filter((x) => x !== item));

  return (
    <div className="orb-set-chiplist">
      {items.length === 0 && !adding && <span className="orb-set-chiplist-empty">None yet</span>}
      {items.map((item) => {
        const count = countFor ? countFor(item) : null;
        return (
          <span key={item} className="orb-chip orb-set-chip">
            <span>{labelFor(item)}</span>
            {count != null && count > 0 && <span className="orb-set-chip-count" title={`${count} task${count === 1 ? '' : 's'} using this`}>{count}</span>}
            <button type="button" className="orb-set-chip-remove" onClick={() => remove(item)} aria-label={`Remove ${item}`}>×</button>
          </span>
        );
      })}
      {adding ? (
        <input
          className="orb-set-quickadd-input"
          autoFocus
          value={draft}
          placeholder={addPlaceholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setDraft(''); setAdding(false); }
          }}
          onBlur={() => { if (draft.trim()) submit(); else setAdding(false); }}
        />
      ) : (
        <button type="button" className="orb-set-quickadd-btn" onClick={() => setAdding(true)}>{addPlaceholder}</button>
      )}
    </div>
  );
}

// N6 — Export button always ungated: exportData() is a synchronous read of
// current state (see orbitContext.js), so there's nothing to await/confirm.
function ExportSection({ orbit }) {
  if (!orbit.exportData) {
    return (
      <div className="orb-set-io-row">
        <button type="button" className="orb-btn" disabled>Export all data (JSON)</button>
        <span className="orb-set-io-note">Updating… export isn't wired up yet on this build.</span>
      </div>
    );
  }

  const handleExport = () => {
    const data = orbit.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-export-${orbit.today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="orb-set-io-row">
      <button type="button" className="orb-btn orb-btn-primary" onClick={handleExport}>Export all data (JSON)</button>
      <span className="orb-set-io-note">Downloads everything — areas, projects, tasks, inbox, settings, and more — as one JSON file.</span>
    </div>
  );
}

// N7 — file input -> parse -> 2-step confirm -> importData(). Parsing
// happens as soon as a file is picked (so a malformed file surfaces an error
// immediately) but nothing is applied until the explicit confirm click.
function ImportSection({ orbit }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  if (!orbit.importData) {
    return (
      <div className="orb-set-io-row">
        <span className="orb-btn orb-set-io-disabled-btn">Import from file…</span>
        <span className="orb-set-io-note">Updating… import isn't wired up yet on this build.</span>
      </div>
    );
  }

  const reset = () => {
    setFileName(''); setPending(null); setError(''); setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setPending(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('not an export object');
      }
      setPending(parsed);
      setFileName(file.name);
    } catch {
      setError(`"${file.name}" isn't valid Orbit export JSON.`);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    const res = await orbit.importData(pending);
    setImporting(false);
    setPending(null);
    if (inputRef.current) inputRef.current.value = '';
    setResult(res);
  };

  return (
    <div className="orb-set-import">
      <div className="orb-set-io-row">
        <input
          ref={inputRef}
          id="orb-set-import-input"
          className="orb-set-file-input"
          type="file"
          accept=".json"
          onChange={onFileChange}
        />
        <label htmlFor="orb-set-import-input" className="orb-btn">Choose file…</label>
        <span className="orb-set-io-note">Replaces ALL Orbit data with the contents of the file.</span>
      </div>

      {error && <div className="orb-set-io-error">{error}</div>}

      {pending && (
        <div className="orb-set-import-confirm">
          <p className="orb-set-import-confirm-text">
            Import <strong>{fileName}</strong>? This <strong>REPLACES ALL Orbit data</strong> — areas, projects,
            tasks, inbox, settings, everything — with what's in this file. This can't be undone. Continue?
          </p>
          <div className="orb-set-import-actions">
            <button type="button" className="orb-btn" onClick={reset} disabled={importing}>Cancel</button>
            <button type="button" className="orb-btn orb-btn-primary" onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing…' : 'Yes, replace all data'}
            </button>
          </div>
        </div>
      )}

      {result && result.ok && (
        <div className="orb-set-io-result">
          Imported: {Object.entries(result.counts).map(([k, v]) => `${v} ${k}`).join(' · ')}
        </div>
      )}
      {result && !result.ok && <div className="orb-set-io-error">{result.error}</div>}
    </div>
  );
}

export default function SettingsView() {
  const orbit = useOrbit();
  const { settings, tasks, updateSettings } = orbit;

  const taskTypeCount = (type) => tasks.filter((t) => t.taskType === type).length;
  const laneCount = (lane) => tasks.filter((t) => t.lane === lane).length;

  return (
    <div className="orb-set">
      <h2 className="orb-set-h2">Settings</h2>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Priority weights</h3>
        <div className="orb-set-grid">
          <NumberField
            label="Importance weight"
            value={settings.importanceWeight}
            min={0}
            step={0.5}
            onCommit={(n) => updateSettings({ importanceWeight: Math.max(0, n) })}
          />
          <NumberField
            label="Urgency weight"
            value={settings.urgencyWeight}
            min={0}
            step={0.5}
            onCommit={(n) => updateSettings({ urgencyWeight: Math.max(0, n) })}
          />
          <NumberField
            label="Cost weight"
            value={settings.costWeight}
            min={0}
            step={0.5}
            onCommit={(n) => updateSettings({ costWeight: Math.max(0, n) })}
          />
        </div>
        <p className="orb-set-formula">
          Today score = importanceW·Imp + urgencyW·Urg − costW·((difficulty+energy)/2)
        </p>
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Constants</h3>
        <div className="orb-set-grid">
          <NumberField
            label="Stale project threshold"
            value={settings.staleDays}
            min={1}
            step={1}
            suffix="days"
            hint="Active projects untouched this long get flagged in Weekly Review."
            onCommit={(n) => updateSettings({ staleDays: Math.max(1, Math.round(n)) })}
          />
          <NumberField
            label="Discarded-inbox retention"
            value={settings.discardRetentionDays}
            min={0}
            step={1}
            suffix="days"
            hint="Discarded inbox items are purged automatically after this long."
            onCommit={(n) => updateSettings({ discardRetentionDays: Math.max(0, Math.round(n)) })}
          />
          <NumberField
            label="Default daily time budget"
            value={settings.capacityDefault.timeMin}
            min={0}
            step={15}
            suffix="min"
            hint="Planner default when a day has no capacity override."
            onCommit={(n) => updateSettings({ capacityDefault: { ...settings.capacityDefault, timeMin: Math.max(0, Math.round(n)) } })}
          />
          <NumberField
            label="Default daily energy budget"
            value={settings.capacityDefault.energy}
            min={0}
            step={1}
            hint="Sum of task energy (1–5 each) the planner will pack into a day by default."
            onCommit={(n) => updateSettings({ capacityDefault: { ...settings.capacityDefault, energy: Math.max(0, Math.round(n)) } })}
          />
          <label className="orb-set-field">
            <span className="orb-set-label">Default view</span>
            <select
              className="orb-set-select"
              value={settings.defaultView}
              onChange={(e) => updateSettings({ defaultView: e.target.value })}
            >
              {VIEW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Task types</h3>
        <p className="orb-set-sub">Kinds of work, used to filter and tag tasks (NS-1). Numbers show how many tasks currently use each type.</p>
        <ChipListEditor
          items={settings.taskTypes}
          addPlaceholder="+ Add type"
          countFor={taskTypeCount}
          onChange={(taskTypes) => updateSettings({ taskTypes })}
        />
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Lanes</h3>
        <p className="orb-set-sub">Kanban lane ids, shown capitalized wherever a task's lane is picked.</p>
        <ChipListEditor
          items={settings.lanes}
          addPlaceholder="+ Add lane"
          sanitize={slugifyLane}
          labelFor={cap}
          countFor={laneCount}
          onChange={(lanes) => updateSettings({ lanes })}
        />
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Areas</h3>
        <p className="orb-set-sub">Reorder, rename, recolor, archive, or delete Areas from their own manager.</p>
        <Link to="/orbit/areas" className="orb-btn orb-set-areas-link">Manage Areas →</Link>
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Export data</h3>
        <ExportSection orbit={orbit} />
      </section>

      <section className="orb-card orb-set-section">
        <h3 className="orb-set-h3">Import data</h3>
        <ImportSection orbit={orbit} />
      </section>
    </div>
  );
}
