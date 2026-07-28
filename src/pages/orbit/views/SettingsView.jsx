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

// Auto-Scheduler config (Guidelines_Scheduler.md §4/§5/§6). Nested `scheduler`
// patches pass a FULL object, not a partial — updateSettings merges the patch
// against DEFAULTS (not current), so a partial would drop the user's other
// scheduler tweaks; spreading current `s`/`s.guardrails`/`s.fatigue` preserves them.
function SchedulerSection({ settings, updateSettings }) {
  const s = settings.scheduler;
  const [zip, setZip] = useState(settings.homeZip);

  const commitZip = () => {
    const v = zip.trim();
    if (v !== settings.homeZip) updateSettings({ homeZip: v, homeLat: null, homeLng: null }); // clear cached geocode → re-fetch
  };
  const setSched = (patch) => updateSettings({ scheduler: { ...s, ...patch } });
  const setGuard = (patch) => setSched({ guardrails: { ...s.guardrails, ...patch } });
  const setFatigue = (patch) => setSched({ fatigue: { ...s.fatigue, ...patch } });
  const setWeights = (patch) => setSched({ softWeights: { ...s.softWeights, ...patch } });

  return (
    <section className="orb-card orb-set-section">
      <h3 className="orb-set-h3">Auto-Scheduler</h3>
      <p className="orb-set-sub">
        Powers the ✨ Auto-Schedule preview — the energy tank, guardrail hours, and weather-avoidance. Weather is free
        (no account) and uses your home ZIP.
      </p>
      <div className="orb-set-grid">
        <label className="orb-set-field">
          <span className="orb-set-label">Home ZIP (weather)</span>
          <div className="orb-set-field-row">
            <input
              className="orb-set-input" type="text" inputMode="numeric" value={zip}
              placeholder="e.g. 19104"
              onChange={(e) => setZip(e.target.value)}
              onBlur={commitZip}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          </div>
          <span className="orb-set-hint">
            {settings.homeLat != null ? '✓ Located — forecast enabled.' : 'Enables rain-avoidance and midday-heat costs.'}
          </span>
        </label>

        <label className="orb-set-field">
          <span className="orb-set-label">Awake hours</span>
          <div className="orb-set-field-row">
            <input className="orb-set-input" type="time" value={s.guardrails.awake[0]} onChange={(e) => setGuard({ awake: [e.target.value, s.guardrails.awake[1]] })} />
            <span className="orb-set-suffix">to</span>
            <input className="orb-set-input" type="time" value={s.guardrails.awake[1]} onChange={(e) => setGuard({ awake: [s.guardrails.awake[0], e.target.value] })} />
          </div>
          <span className="orb-set-hint">Nothing is scheduled outside these hours.</span>
        </label>

        <NumberField
          label="Rain-avoid threshold" value={s.weatherAvoidPrecipPct} min={0} step={5} suffix="%"
          hint="Outdoor tasks avoid any hour at or over this precipitation chance."
          onCommit={(n) => setSched({ weatherAvoidPrecipPct: Math.max(0, Math.min(100, Math.round(n))) })}
        />
        <NumberField
          label="Default recovery buffer" value={s.defaultRecoveryMin} min={0} step={5} suffix="min"
          hint="Rest appended after a task, scaled by how draining it was."
          onCommit={(n) => setSched({ defaultRecoveryMin: Math.max(0, Math.round(n)) })}
        />
        <NumberField
          label="Fatigue starts above" value={Math.round(s.fatigue.thresholdPct * 100)} min={0} step={5} suffix="% of tank"
          hint="A day loaded past this fatigues tomorrow's starting tank."
          onCommit={(n) => setFatigue({ thresholdPct: Math.max(0, Math.min(1, n / 100)) })}
        />
        <NumberField
          label="Max fatigue carry" value={Math.round(s.fatigue.maxCarryPct * 100)} min={0} step={5} suffix="% of tank"
          hint="A fully-drained day cuts tomorrow's tank by at most this."
          onCommit={(n) => setFatigue({ maxCarryPct: Math.max(0, Math.min(1, n / 100)) })}
        />
      </div>

      <h4 className="orb-set-h4">Optimization weights</h4>
      <p className="orb-set-sub">
        Once every hard rule is satisfied, these decide how the planner picks among the legal slots. Higher leans harder.
      </p>
      <div className="orb-set-grid">
        <NumberField
          label="Batch errands (travel)" value={s.softWeights.travel} min={0} step={0.5}
          hint="Cluster located tasks near where the day already sends you."
          onCommit={(n) => setWeights({ travel: Math.max(0, n) })}
        />
        <NumberField
          label="Group like work" value={s.softWeights.contextSwitch} min={0} step={0.5}
          hint="Keep same-category tasks in contiguous runs."
          onCommit={(n) => setWeights({ contextSwitch: Math.max(0, n) })}
        />
        <NumberField
          label="Honor time-of-day" value={s.softWeights.idealWindow} min={0} step={0.5}
          hint="Respect a task's morning / midday / afternoon / evening preference."
          onCommit={(n) => setWeights({ idealWindow: Math.max(0, n) })}
        />
      </div>
    </section>
  );
}

// Rulebook manager (Guidelines_Scheduler.md §12). The feedback→rules loop
// crystallizes corrections into policy rules the deterministic placer enforces;
// this is where you SEE and UNDO what it learned (B5), plus one-click install of
// the canonical "perishables never right after outdoor" policy.
const CANONICAL_RULE = {
  subject: 'perishable', relation: 'notAfter', object: 'category:outdoor', action: 'forbid', createdFrom: 'settings',
};

function ruleSentence(rule) {
  const subj = rule.subject === 'perishable' ? 'Perishables'
    : rule.subject === 'outdoor' ? 'Outdoor tasks'
      : rule.subject.startsWith('category:') ? `${cap(rule.subject.slice(9))} tasks` : rule.subject;
  const objTime = /^\d{1,2}:\d{2}(-\d{1,2}:\d{2})?$/.test(rule.object);
  const obj = objTime ? rule.object
    : rule.object === 'outdoor' ? 'an outdoor task'
      : rule.object.startsWith('category:') ? `a ${rule.object.slice(9)} task` : rule.object;
  if (rule.relation === 'notAfter' && !objTime) return `${subj} never right after ${obj}`;
  if (rule.relation === 'notBefore' && !objTime) return `${subj} never right before ${obj}`;
  if (rule.relation === 'notAfter') return `${subj} not scheduled after ${obj}`;
  if (rule.relation === 'notBefore') return `${subj} not scheduled before ${obj}`;
  if (rule.relation === 'window') return `${subj} only between ${obj}`;
  return `${subj} · ${rule.relation} · ${rule.object}`;
}

function RulesSection({ rules, addRule, updateRule, removeRule }) {
  const hasCanonical = rules.some((r) => r.subject === 'perishable' && r.relation === 'notAfter' && r.object === 'category:outdoor');

  return (
    <section className="orb-card orb-set-section">
      <h3 className="orb-set-h3">Scheduling rules</h3>
      <p className="orb-set-sub">
        Policies the auto-scheduler always honors. Most are learned from the “why?” chips when you remove a suggested
        task; you can toggle or delete any of them here.
      </p>

      {rules.length === 0 && <div className="orb-set-chiplist-empty">No rules yet — reject a suggestion and pick a reason to teach one.</div>}

      <div className="orb-set-rules">
        {rules.map((rule) => (
          <div key={rule.id} className={`orb-set-rule${rule.active === false ? ' inactive' : ''}`}>
            <label className="orb-set-rule-toggle" title={rule.active === false ? 'Disabled' : 'Active'}>
              <input
                type="checkbox"
                checked={rule.active !== false}
                onChange={() => updateRule(rule.id, { active: !(rule.active !== false) })}
              />
            </label>
            <span className="orb-set-rule-text">{ruleSentence(rule)}</span>
            <button type="button" className="orb-set-chip-remove" onClick={() => removeRule(rule.id)} aria-label="Delete rule">×</button>
          </div>
        ))}
      </div>

      {!hasCanonical && (
        <button type="button" className="orb-btn orb-set-rule-add" onClick={() => addRule(CANONICAL_RULE)}>
          + Never schedule perishables right after outdoor tasks
        </button>
      )}
    </section>
  );
}

// "Where I am" bases — the places the owner stays at. A day tagged to one (on
// the fitness calendar or here) makes the whole travel/weather/geo stack reason
// from that base for that day. The home base is the default for untagged days.
function BasesSection({ bases, addBase, updateBase, removeBase, ensureBaseGeocoded, refreshBaseWeather }) {
  const [tag, setTag] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null); // id currently geocoding/fetching

  const add = async () => {
    const t = tag.trim();
    if (!t) return;
    setBusy('new'); // addBase geocodes inline, so no separate ensureBaseGeocoded step
    await addBase({ tag: t, query: query.trim() || t, isHome: bases.length === 0 });
    setTag(''); setQuery('');
    setBusy(null);
  };

  // One home base at a time — flip the others off first.
  const makeHome = async (id) => {
    for (const b of bases) if (b.isHome && b.id !== id) await updateBase(b.id, { isHome: false });
    await updateBase(id, { isHome: true });
  };

  // Clear the cached geocode and re-resolve + re-pull that base's forecast.
  const relocate = async (id) => {
    setBusy(id);
    await updateBase(id, { lat: null, lng: null, geocodedAt: null });
    await ensureBaseGeocoded(id);
    await refreshBaseWeather(id);
    setBusy(null);
  };

  return (
    <section className="orb-card orb-set-section">
      <h3 className="orb-set-h3">Where I am — bases</h3>
      <p className="orb-set-sub">
        Places you actually stay (Orem, Paris UT, Hawaii…). Tag a day with one — here or on the fitness calendar —
        and the scheduler routes travel + weather from there, not home. The ★ home base is the default for untagged days.
      </p>

      {bases.length === 0 && <div className="orb-set-chiplist-empty">No bases yet — add your home town below.</div>}

      <div className="orb-set-bases">
        {bases.map((b) => (
          <div key={b.id} className="orb-set-base">
            <button
              type="button" className={`orb-set-base-home${b.isHome ? ' active' : ''}`}
              onClick={() => makeHome(b.id)}
              title={b.isHome ? 'Home base (default for untagged days)' : 'Make this the home base'}
            >{b.isHome ? '★' : '☆'}</button>
            <span className="orb-set-base-swatch" style={{ background: b.color, color: b.color }} aria-hidden="true" />
            <span className="orb-set-base-tag" style={{ color: b.color }}>{b.tag}</span>
            <span className="orb-set-base-query">{b.query}</span>
            <span
              className={`orb-set-base-geo${b.lat != null ? ' ok' : ''}`}
              title={b.lat != null ? `Located: ${b.lat.toFixed(3)}, ${b.lng.toFixed(3)}` : 'Not located yet — Re-locate to geocode'}
            >{busy === b.id ? '…' : (b.lat != null ? '📍' : '⚠')}</span>
            <button type="button" className="orb-btn orb-set-base-btn" onClick={() => relocate(b.id)} disabled={busy === b.id}>Re-locate</button>
            <button type="button" className="orb-set-chip-remove" onClick={() => removeBase(b.id)} aria-label="Delete base">×</button>
          </div>
        ))}
      </div>

      <div className="orb-set-base-new">
        <input className="orb-set-input orb-set-base-tagin" placeholder="TAG (OREM)" maxLength={14} value={tag} onChange={(e) => setTag(e.target.value)} />
        <input className="orb-set-input" placeholder="City, State — e.g. Paris, Idaho" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="orb-btn" onClick={add} disabled={!tag.trim() || busy != null}>{busy === 'new' ? 'Locating…' : 'Add'}</button>
      </div>
    </section>
  );
}

export default function SettingsView() {
  const orbit = useOrbit();
  const {
    settings, tasks, updateSettings, rules, addRule, updateRule, removeRule,
    bases, addBase, updateBase, removeBase, ensureBaseGeocoded, refreshBaseWeather,
  } = orbit;

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

      <SchedulerSection settings={settings} updateSettings={updateSettings} />

      <RulesSection rules={rules} addRule={addRule} updateRule={updateRule} removeRule={removeRule} />

      <BasesSection
        bases={bases} addBase={addBase} updateBase={updateBase} removeBase={removeBase}
        ensureBaseGeocoded={ensureBaseGeocoded} refreshBaseWeather={refreshBaseWeather}
      />

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
