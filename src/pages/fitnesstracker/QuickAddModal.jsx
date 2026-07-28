import { useState, useMemo } from 'react';
import { useFitness } from './fitnessContext';
import { distanceToMeters, metersToDistance, clockToSec, secToClock } from './units';
import { RPE_MIN, RPE_MAX, RPE_LEGEND } from './fitnessConfig';
import { parseShorthand } from './calc/shorthand';
import GroupPicker from './GroupPicker';
import ClearableInput from './ClearableInput';
import BaseSelect from './BaseSelect';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { loadOrbitBridgeData, quickAddOrbitTask, setOrbitDayLocation } from './orbitTasksBridge';

// Pseudo activity id for the "To-do" mode — not a real activityType (it creates
// Orbit to-dos, not a workout), just a selectable button in the type row.
const TODO_TYPE_ID = '__todo';

function round2(n) { return Math.round(n * 100) / 100; }

// Fast entry: minimum to save is activity type + ONE number (distance or duration).
// Two accelerators sit on top of the manual form:
//   • a shorthand box ("5mi 38:20") that fills type/distance/duration in one line
//   • recent-workout chips ("repeat last") that prefill a whole session in one tap
//
// mode: 'log' (topbar "+ Log" button, no date passed) defaults to completed —
// you're recording something that already happened. 'schedule' (calendar-day
// click) defaults to planned — you're placing a future session.
export default function QuickAddModal({ date, mode = 'log', onClose }) {
  const { addWorkout, activityTypes, settings, updateSettings, workouts } = useFitness();
  const unit = settings.units.distance;

  const [type, setType] = useState(activityTypes[0]?.id || 'run');
  const [status, setStatus] = useState(mode === 'schedule' ? 'planned' : 'completed');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [rpe, setRpe] = useState(null);
  // sticky: a new entry starts in whatever group the last save used, until changed
  const [groupId, setGroupId] = useState(settings.lastGroupId ?? null);
  const [hoverRpe, setHoverRpe] = useState(null);
  const [time, setTime] = useState('');
  const [when, setWhen] = useState(date);
  const [saving, setSaving] = useState(false);

  const [shorthand, setShorthand] = useState('');
  const [title, setTitle] = useState('');
  // Event WHERE — defaults to the seeded OREM home base (id 'home'). Picking an
  // away base tags this event's day so Orbit travel/weather use that location.
  const [eventBaseId, setEventBaseId] = useState('home');
  const [todoDraft, setTodoDraft] = useState('');
  const [todoList, setTodoList] = useState([]);
  const [savingTodos, setSavingTodos] = useState(false);
  const { user } = useAuth();
  const parsed = useMemo(() => parseShorthand(shorthand), [shorthand]);
  // Events (kind:'event' — "POGO Raichu day") aren't distance/duration things,
  // so the shorthand parser is meaningless for them. Repurpose that same top
  // input as the event's name instead, and drop the workout-only fields below.
  const isEvent = activityTypes.find((t) => t.id === type)?.kind === 'event';
  // To-do mode drops one or more Orbit to-dos onto this day instead of a workout.
  const isTodo = type === TODO_TYPE_ID;
  const pendingTodoCount = todoList.length + (todoDraft.trim() ? 1 : 0);

  // recent distinct sessions -> one-tap templates (dedupe by type + rounded distance)
  const templates = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || (b.createdAt || 0) - (a.createdAt || 0));
    const seen = new Set();
    const out = [];
    for (const w of sorted) {
      const key = `${w.activityType}|${w.distanceM ? Math.round(w.distanceM / 100) : 'd' + (w.durationSec || 0)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(w);
      if (out.length >= 4) break;
    }
    return out;
  }, [workouts]);

  function applyShorthand() {
    if (!parsed) return;
    if (parsed.activityType && activityTypes.some((t) => t.id === parsed.activityType)) setType(parsed.activityType);
    if (parsed.distanceM != null) setDistance(String(round2(metersToDistance(parsed.distanceM, unit))));
    if (parsed.durationSec != null) setDuration(secToClock(parsed.durationSec));
    setShorthand('');
  }

  function applyTemplate(w) {
    setType(w.activityType);
    setStatus('completed');
    setDistance(w.distanceM != null ? String(round2(metersToDistance(w.distanceM, unit))) : '');
    setDuration(w.durationSec != null ? secToClock(w.durationSec) : '');
    setRpe(w.rpe ?? null);
    setGroupId(w.groupId ?? null);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    await addWorkout({
      date: when,
      time,
      activityType: type,
      status,
      title: isEvent ? title.trim() : '',
      distanceM: isEvent ? null : distanceToMeters(distance, unit),
      durationSec: isEvent ? null : clockToSec(duration),
      note,
      rpe,
      groupId,
      metrics: url.trim() ? { url: url.trim() } : undefined,
    });
    if (groupId !== settings.lastGroupId) updateSettings({ lastGroupId: groupId });
    if (isEvent) {
      // 'home' (OREM) is the default — leave the day untagged (it already
      // resolves to home). An away base gets written so the day's WHERE tag +
      // Orbit's travel/weather follow the event's location.
      await setOrbitDayLocation(user || null, firebaseReady, when, eventBaseId === 'home' ? null : eventBaseId);
      window.dispatchEvent(new CustomEvent('orbit-tasks-changed'));
    }
    onClose();
  }

  function addTodoDraft() {
    const v = todoDraft.trim();
    if (!v) return;
    setTodoList((list) => [...list, v]);
    setTodoDraft('');
  }
  function removeTodo(idx) {
    setTodoList((list) => list.filter((_, i) => i !== idx));
  }
  async function sendTodos() {
    if (savingTodos) return;
    const items = [...todoList];
    const draft = todoDraft.trim();
    if (draft) items.push(draft);
    if (items.length === 0) return;
    setSavingTodos(true);
    // Load Orbit's areas/settings once, then file each to-do onto this day via
    // the same bridge the calendar reads from. The window event tells the
    // calendar (which owns the Orbit chips) to re-read and show them.
    const bridge = await loadOrbitBridgeData(user || null, firebaseReady);
    for (const t of items) {
      await quickAddOrbitTask(user || null, firebaseReady, { title: t, scheduledDate: when, areas: bridge.areas, settings: bridge.settings });
    }
    window.dispatchEvent(new CustomEvent('orbit-tasks-changed'));
    setSavingTodos(false);
    onClose();
  }

  const typeName = (id) => activityTypes.find((t) => t.id === id)?.name || id;

  let modalTitle;
  if (isTodo) modalTitle = 'Add to-dos';
  else if (isEvent) modalTitle = 'Add an event';
  else modalTitle = mode === 'schedule' ? 'Add to your day' : 'Log a workout';

  return (
    <div className="ft-modal-backdrop" onClick={onClose}>
      <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-modal-head">
          <h3>{modalTitle}</h3>
          <button type="button" className="ft-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Event: this input is the event's name. Workout: shorthand fast path.
            To-do: has its own multi-add list further down. */}
        {!isTodo && (isEvent ? (
          <div className="ft-shorthand">
            <input
              className="ft-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
              placeholder='Event name — e.g. "POGO Raichu day"'
              aria-label="Event name"
            />
          </div>
        ) : (
          <>
            <div className="ft-shorthand">
              <input
                className="ft-input"
                value={shorthand}
                onChange={(e) => setShorthand(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyShorthand(); }}
                placeholder='Quick paste — e.g. "5mi 38:20" or "swim 2000yd 40:00"'
                aria-label="Shorthand entry"
              />
              <button type="button" className="ft-btn-ghost ft-shorthand-go" onClick={applyShorthand} disabled={!parsed} aria-label="Apply shorthand">→</button>
            </div>
            {parsed && (
              <p className="ft-hint-sm ft-shorthand-preview">
                Detected:
                {parsed.activityType ? ` ${typeName(parsed.activityType)}` : ''}
                {parsed.distanceM != null ? ` · ${round2(metersToDistance(parsed.distanceM, unit))} ${unit}` : ''}
                {parsed.durationSec != null ? ` · ${secToClock(parsed.durationSec)}` : ''}
              </p>
            )}
          </>
        ))}

        {isEvent && (
          <div className="ft-field ft-event-where">
            <label className="ft-field-label">Where</label>
            <BaseSelect value={eventBaseId} onChange={setEventBaseId} allowClear={false} />
            <p className="ft-hint-sm">Where this event is — tags the day so Orbit’s travel &amp; weather use that spot.</p>
          </div>
        )}

        {!isEvent && !isTodo && templates.length > 0 && (
          <div className="ft-templates">
            <span className="ft-field-label">Repeat recent</span>
            <div className="ft-template-row">
              {templates.map((w) => {
                const t = activityTypes.find((x) => x.id === w.activityType);
                return (
                  <button key={w.id} type="button" className="ft-template-chip" onClick={() => applyTemplate(w)} style={t ? { borderColor: t.color } : undefined}>
                    <span>{t?.icon || '•'}</span>
                    <span>{w.distanceM != null ? `${round2(metersToDistance(w.distanceM, unit))}${unit}` : secToClock(w.durationSec)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label className="ft-field-label">Activity</label>
        <div className="ft-type-row">
          {activityTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ft-type-btn${type === t.id ? ' active' : ''}`}
              style={type === t.id ? { borderColor: t.color, background: t.color + '22' } : undefined}
              onClick={() => setType(t.id)}
            >
              <span className="ft-type-icon">{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
          <button
            type="button"
            className={`ft-type-btn${isTodo ? ' active' : ''}`}
            style={isTodo ? { borderColor: '#7ec8e3', background: '#7ec8e322' } : undefined}
            onClick={() => setType(TODO_TYPE_ID)}
          >
            <span className="ft-type-icon">📋</span>
            <span>To-do</span>
          </button>
        </div>

        {!isTodo && (
          <div className="ft-status-toggle">
            <button type="button" className={status === 'planned' ? 'active' : ''} onClick={() => setStatus('planned')}>◇ Planned</button>
            <button type="button" className={status === 'completed' ? 'active' : ''} onClick={() => setStatus('completed')}>✓ Completed</button>
          </div>
        )}

        {!isEvent && !isTodo && (
          <>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Distance ({unit})</label>
                <ClearableInput inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} onClear={() => setDistance('')} placeholder="e.g. 5" />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Duration</label>
                <ClearableInput value={duration} onChange={(e) => setDuration(e.target.value)} onClear={() => setDuration('')} placeholder="mm:ss or min" />
              </div>
            </div>
            <p className="ft-hint-sm">Distance and duration are both optional — fill in what you know now.</p>
          </>
        )}

        {isTodo && (
          <div className="ft-todo-add">
            <p className="ft-hint-sm">Type an item and press Enter to add it to the list — Send when you're done. They drop onto {when} as Orbit to-dos.</p>
            <input
              className="ft-input"
              autoFocus
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTodoDraft(); } }}
              placeholder="e.g. Buy milk"
              aria-label="New to-do"
            />
            {todoList.length > 0 && (
              <ul className="ft-todo-list">
                {todoList.map((t, i) => (
                  <li key={i} className="ft-todo-item">
                    <span>{t}</span>
                    <button type="button" className="ft-todo-remove" onClick={() => removeTodo(i)} aria-label={`Remove ${t}`}>✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!isTodo && (
        <details className="ft-more">
          <summary>More (optional)</summary>
          <div className="ft-two">
            <div className="ft-field">
              <label className="ft-field-label">Date</label>
              <input className="ft-input" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="ft-field">
              <label className="ft-field-label">Time</label>
              <input className="ft-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Note</label>
            <ClearableInput value={note} onChange={(e) => setNote(e.target.value)} onClear={() => setNote('')} placeholder="how'd it feel? / event details" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Link (optional)</label>
            <ClearableInput value={url} onChange={(e) => setUrl(e.target.value)} onClear={() => setUrl('')} placeholder="https://… (for events)" />
          </div>
          <div className="ft-field">
            <label className="ft-field-label">RPE{rpe ? ` — ${rpe}/10` : ''}</label>
            <div className="ft-rpe">
              {Array.from({ length: RPE_MAX - RPE_MIN + 1 }, (_, i) => RPE_MIN + i).map((n) => (
                <button
                  key={n} type="button" className={`ft-rpe-btn${rpe === n ? ' active' : ''}`}
                  onClick={() => setRpe(rpe === n ? null : n)}
                  onMouseEnter={() => setHoverRpe(n)} onMouseLeave={() => setHoverRpe(null)}
                  onFocus={() => setHoverRpe(n)} onBlur={() => setHoverRpe(null)}
                >{n}</button>
              ))}
            </div>
            <p className="ft-rpe-caption">{RPE_LEGEND[hoverRpe ?? rpe] || ''}</p>
          </div>
        </details>
        )}

        <div className="ft-modal-actions">
          <button type="button" className="ft-btn-ghost" onClick={onClose}>Cancel</button>
          {isTodo ? (
            <button type="button" className="ft-btn-primary" disabled={savingTodos || pendingTodoCount === 0} onClick={sendTodos}>
              {savingTodos ? 'Sending…' : `Send ${pendingTodoCount} to-do${pendingTodoCount === 1 ? '' : 's'}`}
            </button>
          ) : (
            <button type="button" className="ft-btn-primary" disabled={saving} onClick={save}>Save</button>
          )}
        </div>
      </div>
    </div>
  );
}
