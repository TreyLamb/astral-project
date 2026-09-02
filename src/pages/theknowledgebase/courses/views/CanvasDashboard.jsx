// Canvas-style dashboard over the committed schedule snapshot.
//
// Data comes from data/canvasSchedule.json, written by `npm run canvas -- --from-capture ...`.
// The Drive folder the capture lands in is outside the repo, so the snapshot is the only thing
// the app can actually read at runtime - same call the worksheets feature makes.
//
// Deliberately minimal: three courses, one "what's coming" rail, and a needs-attention strip.
// It is a study planner, not a Canvas clone - no grades page, no submission UI, nothing that
// pretends to be authoritative over Canvas itself.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import SNAPSHOT from '../data/canvasSchedule.json';
import '../CanvasDash.css';

// Canvas assigns each course a colour; mirroring that is what makes the rail scannable.
const COURSE_COLOR = {
  'CHEM 1210': '#0374B5',
  'MICR 2060': '#0B874B',
  'MICR 2065': '#8F3E97',
};
const colorFor = (code) => COURSE_COLOR[code] ?? '#6B7780';

const DONE = new Set(['graded', 'submitted', 'excused']);
const LATE = new Set(['missing', 'overdue']);

const STATUS_LABEL = {
  graded: 'Graded', submitted: 'Submitted', excused: 'Excused',
  missing: 'Missing', overdue: 'Overdue', todo: 'To do', unknown: '—',
};

/** Local-midnight day key, so "today" means today here and not in UTC. */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(fromKey, toKey) {
  const a = new Date(fromKey + 'T00:00:00');
  const b = new Date(toKey + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function relativeDay(dueKey, today) {
  const n = daysBetween(today, dueKey);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `${-n}d ago`;
  if (n < 7) return new Date(dueKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' });
  return new Date(dueKey + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CanvasDashboard() {
  const [horizon, setHorizon] = useState(14);
  const today = todayKey();

  // No memoisation: this is ~100 rows from a static import, recomputed only when `horizon`
  // changes. Memoising it bought nothing and tripped the compiler's mutation check.
  const courses = Object.values(SNAPSHOT.courses ?? {});

  const all = courses
    .flatMap((c) => (c.schedule ?? []).filter((r) => r.due).map((r) => ({ ...r, code: c.code })))
    .sort((a, b) => String(a.dueAt ?? '').localeCompare(String(b.dueAt ?? '')));

  // Anything already past that was never handed in. `unknown` is excluded on purpose: before a
  // capture carrying submission data, EVERY past item would land here and the strip would be a
  // wall of false alarms.
  const needsAttention = all.filter((r) => r.due < today && LATE.has(r.status));
  const unknownPast = all.filter((r) => r.due < today && r.status === 'unknown');

  const upcoming = all.filter((r) => r.due >= today && daysBetween(today, r.due) <= horizon && !DONE.has(r.status));

  // Ranked by points, not by date: the study-time question is "what is worth the most, soonest".
  const heavyHitters = all
    .filter((r) => r.due >= today && !DONE.has(r.status) && (r.points ?? 0) > 0)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 6);

  const byDayMap = new Map();
  for (const r of upcoming) {
    if (!byDayMap.has(r.due)) byDayMap.set(r.due, []);
    byDayMap.get(r.due).push(r);
  }
  const byDay = [...byDayMap.entries()];

  const synced = SNAPSHOT.generatedAt ? new Date(SNAPSHOT.generatedAt).toLocaleString() : 'never';

  if (!courses.length) {
    return (
      <div className="cdash">
        <div className="cdash-empty">
          <h2>No Canvas data yet</h2>
          <p>
            Run the capture snippet in your Canvas tab, then{' '}
            <code>npm run canvas -- --from-capture canvas-capture.json</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cdash">
      <header className="cdash-head">
        <h1>Dashboard</h1>
        <div className="cdash-synced">
          Synced {synced}
          {SNAPSHOT.timezone ? ` · ${SNAPSHOT.timezone}` : ''}
        </div>
      </header>

      {needsAttention.length > 0 && (
        <section className="cdash-alert">
          <strong>{needsAttention.length} past due</strong>
          <ul>
            {needsAttention.map((r) => (
              <li key={`${r.code}-${r.id}`}>
                <span className="cdash-dot" style={{ background: colorFor(r.code) }} />
                <span className="cdash-alert-course">{r.code}</span>
                {r.name}
                <span className="cdash-alert-when">{relativeDay(r.due, today)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unknownPast.length > 0 && (
        <div className="cdash-note">
          {unknownPast.length} past item{unknownPast.length === 1 ? '' : 's'} have no submission
          status in this snapshot — re-run the capture snippet to see what is actually outstanding.
        </div>
      )}

      <div className="cdash-body">
        <div className="cdash-main">
          <div className="cdash-cards">
          {courses.map((c) => {
            const rows = (c.schedule ?? []).filter((r) => r.due);
            const next = rows.find((r) => r.due >= today && !DONE.has(r.status));
            const open = rows.filter((r) => r.due >= today && !DONE.has(r.status)).length;
            const pts = rows.reduce((n, r) => n + (r.points ?? 0), 0);
            return (
              <article className="cdash-card" key={c.code}>
                <div className="cdash-card-strip" style={{ background: colorFor(c.code) }} />
                <div className="cdash-card-body">
                  <h2 style={{ color: colorFor(c.code) }}>{c.code}</h2>
                  <div className="cdash-card-term">{rows.length} graded items · {pts.toFixed(0)} pts total</div>
                  {next ? (
                    <div className="cdash-next">
                      <div className="cdash-next-label">Next up</div>
                      <div className="cdash-next-name">{next.name}</div>
                      <div className="cdash-next-meta">
                        <span className={daysBetween(today, next.due) <= 1 ? 'cdash-soon' : ''}>
                          {relativeDay(next.due, today)}{next.dueTime ? ` · ${next.dueTime}` : ''}
                        </span>
                        {next.points != null && <span>{next.points} pts</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="cdash-next cdash-clear">Nothing outstanding</div>
                  )}
                  <div className="cdash-card-foot">{open} open</div>
                </div>
              </article>
            );
          })}
          </div>

          {/* The cards only fill one row, and a bare gap next to a tall rail is wasted space.
              This is the coach view: what is worth the most, soonest. Points, not count -
              five 8-point quizzes do not add up to one 135-point exam in study priority. */}
          {heavyHitters.length > 0 && (
            <section className="cdash-heavy">
              <h3>Biggest items ahead</h3>
              <ol>
                {heavyHitters.map((r) => (
                  <li key={`${r.code}-${r.id}`}>
                    <span className="cdash-dot" style={{ background: colorFor(r.code) }} />
                    <span className="cdash-heavy-pts">{r.points}</span>
                    <span className="cdash-heavy-name">
                      {r.name}
                      <span className="cdash-heavy-meta">
                        {r.code} · {relativeDay(r.due, today)}
                        {r.dueTime ? ` · ${r.dueTime}` : ''}
                        {' · '}{daysBetween(today, r.due)}d out
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="cdash-rail">
          <div className="cdash-rail-head">
            <h3>Coming Up</h3>
            <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {byDay.length === 0 && <div className="cdash-rail-empty">Nothing due in {horizon} days.</div>}

          {byDay.map(([day, rows]) => (
            <div className="cdash-day" key={day}>
              <div className={`cdash-day-head${day === today ? ' cdash-day-today' : ''}`}>
                {relativeDay(day, today)}
                {/* Past 7 days out relativeDay already IS the date, so printing it twice read
                    "Sep 9  Sep 9". Only show the calendar date when the label is a word. */}
                {daysBetween(today, day) < 7 && (
                  <span>{new Date(day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                )}
              </div>
              {rows.map((r) => (
                <a
                  className="cdash-item"
                  key={`${r.code}-${r.id}`}
                  href={r.url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  style={{ '--cdash-accent': colorFor(r.code) }}
                >
                  <div className="cdash-item-top">
                    <span className="cdash-item-course">{r.code}</span>
                    {r.dueTime && <span className="cdash-item-time">{r.dueTime}</span>}
                  </div>
                  <div className="cdash-item-name">{r.name}</div>
                  <div className="cdash-item-meta">
                    {r.points != null && <span>{r.points} pts</span>}
                    {r.questions != null && <span>{r.questions} q</span>}
                    {r.timeLimit != null && <span>{r.timeLimit} min</span>}
                    {r.status !== 'unknown' && r.status !== 'todo' && (
                      <span className={`cdash-pill cdash-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ))}
        </aside>
      </div>

      <footer className="cdash-foot">
        <Link to="/TKB/courses">All courses</Link>
        <span>
          Refresh: run the capture snippet, then <code>npm run canvas -- --from-capture canvas-capture.json</code>
        </span>
      </footer>
    </div>
  );
}
