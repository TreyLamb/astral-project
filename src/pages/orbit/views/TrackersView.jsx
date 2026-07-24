import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import { qualifyToday, increment } from '../calc/trackers';
import './TrackersView.css';

const TYPE_OPTIONS = [
  { value: 'counter', label: 'Counter' },
  { value: 'streak', label: 'Streak' },
];
const RESET_OPTIONS = [
  { value: 'daily', label: 'Resets daily' },
  { value: 'weekly', label: 'Resets weekly' },
  { value: 'none', label: 'Never resets' },
];

// Shared by the top "+ Add tracker" row and each tracker's inline Edit —
// same four fields either way (per spec, currentValue is never editable
// here, only via the +/-/qualify actions), just a different initial value.
function TrackerForm({ areas, initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [areaId, setAreaId] = useState(initial?.areaId ?? '');
  const [type, setType] = useState(initial?.type ?? 'counter');
  const [resetInterval, setResetInterval] = useState(initial?.resetInterval ?? 'none');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, areaId: areaId || null, type, resetInterval });
  };

  return (
    <div className="orb-trk-form">
      <input
        className="orb-trk-form-input"
        autoFocus
        value={name}
        placeholder="Tracker name…"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
      />
      <select className="orb-trk-form-select" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
        <option value="">No area</option>
        {/* keep the tracker's current area selectable even if it's since been archived (see ProjectView's area select) */}
        {areas.filter((a) => !a.archived || a.id === initial?.areaId).map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select className="orb-trk-form-select" value={type} onChange={(e) => setType(e.target.value)}>
        {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select className="orb-trk-form-select" value={resetInterval} onChange={(e) => setResetInterval(e.target.value)}>
        {RESET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="orb-trk-form-actions">
        <button type="button" className="orb-btn orb-btn-primary" onClick={submit}>{submitLabel}</button>
        <button type="button" className="orb-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function TrackerRow({ tracker, areas, today }) {
  const { updateTracker, removeTracker } = useOrbit();
  const [editing, setEditing] = useState(false);

  // Both increment() and qualifyToday() (calc/trackers.js) return a whole
  // updated tracker — apply() lifts just the three fields the contract says
  // to persist, so a stale/superseded field never sneaks into the write.
  const apply = (updated) => updateTracker(tracker.id, {
    currentValue: updated.currentValue,
    lastQualifiedDate: updated.lastQualifiedDate,
    lastResetAt: updated.lastResetAt,
  });

  if (editing) {
    return (
      <div className="orb-trk-row-editing">
        <TrackerForm
          areas={areas}
          initial={tracker}
          submitLabel="Save"
          onSubmit={(patch) => { updateTracker(tracker.id, patch); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const qualifiedToday = tracker.lastQualifiedDate === today;
  const resetLabel = RESET_OPTIONS.find((o) => o.value === tracker.resetInterval)?.label;

  return (
    <div className="orb-row orb-trk-row">
      <div className="orb-trk-main">
        <span className="orb-trk-name">{tracker.name || <em>untitled</em>}</span>
        {tracker.resetInterval !== 'none' && <span className="orb-trk-reset">{resetLabel}</span>}
      </div>

      {tracker.type === 'streak' ? (
        <div className="orb-trk-streak">
          <span className="orb-trk-streak-value">🔥 {tracker.currentValue} day{tracker.currentValue === 1 ? '' : 's'} streak</span>
          <button
            type="button"
            className={`orb-btn orb-trk-qualify${qualifiedToday ? ' active' : ''}`}
            disabled={qualifiedToday}
            onClick={() => apply(qualifyToday(tracker, today))}
          >
            {qualifiedToday ? '✓ Did it today' : 'Did it today'}
          </button>
        </div>
      ) : (
        <div className="orb-trk-counter">
          <button
            type="button"
            className="orb-trk-step"
            disabled={tracker.currentValue <= 0}
            onClick={() => apply(increment(tracker, -1))}
            aria-label={`Decrease ${tracker.name}`}
          >
            −
          </button>
          <span className="orb-trk-value">{tracker.currentValue}</span>
          <button
            type="button"
            className="orb-trk-step"
            onClick={() => apply(increment(tracker, 1))}
            aria-label={`Increase ${tracker.name}`}
          >
            +
          </button>
        </div>
      )}

      <div className="orb-trk-actions">
        <button type="button" className="orb-btn" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="orb-btn orb-trk-delete" onClick={() => removeTracker(tracker.id)}>Delete</button>
      </div>
    </div>
  );
}

// Deliberately minimal (spec §4.8) — current value + quick actions only, no
// history/charts. Grouped by Area so it doubles as an at-a-glance overview,
// same shape as the per-Area widget in AreasView.jsx.
export default function TrackersView() {
  const { areas, trackers, today, addTracker } = useOrbit();
  const [adding, setAdding] = useState(false);

  const sortedAreas = areas.slice().sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
  const areaIds = new Set(areas.map((a) => a.id));
  const unassigned = trackers.filter((t) => !t.areaId || !areaIds.has(t.areaId));

  return (
    <div className="orb-trk">
      <div className="orb-trk-head">
        <h2 className="orb-trk-h2">Trackers</h2>
        {!adding && <button type="button" className="orb-btn orb-btn-primary" onClick={() => setAdding(true)}>+ Add tracker</button>}
      </div>

      {adding && (
        <div className="orb-card orb-trk-add-card">
          <TrackerForm
            areas={areas}
            submitLabel="Add"
            onSubmit={(partial) => { addTracker(partial); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {trackers.length === 0 && !adding && (
        <div className="orb-stub orb-trk-empty">No trackers yet — add a counter or streak to start tracking.</div>
      )}

      {sortedAreas.map((area) => {
        const areaTrackers = trackers.filter((t) => t.areaId === area.id);
        if (areaTrackers.length === 0) return null;
        return (
          <div key={area.id} className="orb-trk-group">
            <div className="orb-trk-group-head">
              <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                <span className="orb-chip-dot" />{area.name}
              </span>
              {area.archived && <span className="orb-trk-archived-tag">archived area</span>}
            </div>
            <div className="orb-trk-list">
              {areaTrackers.map((t) => <TrackerRow key={t.id} tracker={t} areas={areas} today={today} />)}
            </div>
          </div>
        );
      })}

      {unassigned.length > 0 && (
        <div className="orb-trk-group">
          <div className="orb-trk-group-head">
            <span className="orb-trk-group-title">No area</span>
          </div>
          <div className="orb-trk-list">
            {unassigned.map((t) => <TrackerRow key={t.id} tracker={t} areas={areas} today={today} />)}
          </div>
        </div>
      )}
    </div>
  );
}
