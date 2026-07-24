import { useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { compareForToday } from '../calc/priority';
import TaskRow from './TaskRow';
import './HistoryView.css';

const WEEK_STRIP_RADIUS = 3; // 7-day strip centered on the selected date

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDaysISO = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d); };
const msToISO = (ms) => toISO(new Date(ms));

function formatDateHeading(iso, todayStr) {
  const label = new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  if (iso === todayStr) return `${label} · Today`;
  if (iso === addDaysISO(todayStr, 1)) return `${label} · Tomorrow`;
  if (iso === addDaysISO(todayStr, -1)) return `${label} · Yesterday`;
  return label;
}

function weekdayShort(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
}

// NS-4 — a dated daily list, reconstructed on the fly from live task state
// rather than stored as its own snapshot: "that day's list" = whatever is
// currently scheduledDate===day, plus whatever currently shows
// completedAt on that day. Nothing here is a frozen record, so a task
// edited/rescheduled after the fact is reflected everywhere it's looked up
// from — same as every other Orbit view, and why past days stay fully
// viewable (they're just a different filter over the same live tasks[]).
export default function HistoryView() {
  const { tasks, today, getDayPlan, setDayPlan } = useOrbit();
  const [selectedDate, setSelectedDate] = useState(today);

  const dayPlan = getDayPlan(selectedDate);
  const [noteEditing, setNoteEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(dayPlan.note);
  // Reset the note draft whenever navigation lands on a different date —
  // compare-and-reset-in-render, same pattern as TriageView's queue-item swap.
  const [noteResetForDate, setNoteResetForDate] = useState(selectedDate);
  if (noteResetForDate !== selectedDate) {
    setNoteResetForDate(selectedDate);
    setNoteEditing(false);
    setDraftNote(dayPlan.note);
  }

  const dayTasks = useMemo(() => {
    const scheduled = tasks.filter((t) => t.scheduledDate === selectedDate);
    const scheduledIds = new Set(scheduled.map((t) => t.id));
    const completedHere = tasks.filter(
      (t) => t.completedAt != null && !scheduledIds.has(t.id) && msToISO(t.completedAt) === selectedDate,
    );
    return [...scheduled, ...completedHere];
  }, [tasks, selectedDate]);

  const doneTasks = useMemo(
    () => dayTasks.filter((t) => t.status === 'done').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [dayTasks],
  );
  const openTasks = useMemo(
    () => dayTasks.filter((t) => t.status !== 'done').sort((a, b) => compareForToday(a, b, selectedDate)),
    [dayTasks, selectedDate],
  );

  const weekStrip = useMemo(() => {
    const offsets = Array.from({ length: WEEK_STRIP_RADIUS * 2 + 1 }, (_, i) => i - WEEK_STRIP_RADIUS);
    return offsets.map((o) => addDaysISO(selectedDate, o));
  }, [selectedDate]);

  const stripCounts = useMemo(() => {
    const counts = new Map(weekStrip.map((d) => [d, { open: 0, done: 0 }]));
    tasks.forEach((t) => {
      const scheduledHere = counts.has(t.scheduledDate) ? t.scheduledDate : null;
      const completedIso = t.completedAt != null ? msToISO(t.completedAt) : null;
      const completedHere = completedIso && counts.has(completedIso) ? completedIso : null;
      const bucket = t.status === 'done' ? 'done' : 'open';
      if (scheduledHere) counts.get(scheduledHere)[bucket] += 1;
      if (completedHere && completedHere !== scheduledHere) counts.get(completedHere)[bucket] += 1;
    });
    return counts;
  }, [tasks, weekStrip]);

  const capacityTimeMin = dayPlan.capacityTimeMin;
  const capacityEnergy = dayPlan.capacityEnergy;
  const capacityCustomized = capacityTimeMin != null || capacityEnergy != null;

  const goToday = () => setSelectedDate(today);
  const shiftDay = (n) => setSelectedDate((d) => addDaysISO(d, n));

  const commitNote = () => {
    setNoteEditing(false);
    const trimmed = draftNote.trim();
    if (trimmed !== dayPlan.note) setDayPlan(selectedDate, { note: trimmed });
  };

  return (
    <div className="orb-history">
      <div className="orb-history-head">
        <h2 className="orb-history-h2">History</h2>
        <p className="orb-history-sub">Every day's list, past or future — reconstructed live from your tasks, never frozen.</p>
      </div>

      <div className="orb-card orb-history-nav">
        <button type="button" className="orb-btn orb-history-step" onClick={() => shiftDay(-1)} aria-label="Previous day">←</button>
        <input
          type="date" className="orb-history-date-input" value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
        />
        <button type="button" className="orb-btn orb-history-step" onClick={() => shiftDay(1)} aria-label="Next day">→</button>
        <button type="button" className="orb-btn orb-history-today" onClick={goToday} disabled={selectedDate === today}>
          Today
        </button>
      </div>

      <div className="orb-history-strip">
        {weekStrip.map((d) => {
          const counts = stripCounts.get(d) || { open: 0, done: 0 };
          const active = d === selectedDate;
          const isToday = d === today;
          return (
            <button
              key={d}
              type="button"
              className={`orb-history-strip-day${active ? ' active' : ''}${isToday ? ' today' : ''}`}
              onClick={() => setSelectedDate(d)}
            >
              <span className="orb-history-strip-wd">{weekdayShort(d)}</span>
              <span className="orb-history-strip-num">{Number(d.slice(-2))}</span>
              {(counts.open > 0 || counts.done > 0) && (
                <span className="orb-history-strip-count">
                  {counts.open > 0 && <span className="orb-history-strip-dot open" />}
                  {counts.done > 0 && <span className="orb-history-strip-dot done" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="orb-history-date-heading">{formatDateHeading(selectedDate, today)}</div>

      <div className="orb-card orb-history-dayplan">
        <div className="orb-history-cap">
          <span className="orb-history-cap-label">Capacity</span>
          <span className="orb-history-cap-value">
            {capacityTimeMin ?? '—'}min · {capacityEnergy ?? '—'} energy
            <span className="orb-history-cap-tag">{capacityCustomized ? 'custom' : 'default'}</span>
          </span>
        </div>
        <div className="orb-history-note">
          {noteEditing ? (
            <textarea
              className="orb-history-note-input"
              value={draftNote}
              autoFocus
              placeholder="Add a note for this day…"
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={commitNote}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setDraftNote(dayPlan.note); setNoteEditing(false); }
              }}
            />
          ) : (
            <div
              className="orb-history-note-view"
              onClick={() => { setDraftNote(dayPlan.note); setNoteEditing(true); }}
            >
              {dayPlan.note || <em>Add a note for this day…</em>}
            </div>
          )}
        </div>
      </div>

      {dayTasks.length === 0 ? (
        <div className="orb-history-empty">Nothing scheduled or completed on this day.</div>
      ) : (
        <div className="orb-history-lists">
          <div className="orb-history-section">
            <div className="orb-history-section-head">
              Open <span className="orb-history-section-count">{openTasks.length}</span>
            </div>
            {openTasks.length === 0 ? (
              <div className="orb-history-section-empty">Nothing open.</div>
            ) : (
              <div className="orb-history-section-list">
                {openTasks.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>

          <div className="orb-history-section">
            <div className="orb-history-section-head">
              Done <span className="orb-history-section-count">{doneTasks.length}</span>
            </div>
            {doneTasks.length === 0 ? (
              <div className="orb-history-section-empty">Nothing completed.</div>
            ) : (
              <div className="orb-history-section-list">
                {doneTasks.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
