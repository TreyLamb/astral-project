// Settings → Calendars: the one place the calendar hub is set up and run.
// Replaces CalendarSync.jsx (2026-10-06), which only knew the Training calendar, imported Google
// events as fake workouts, and forced Google's consent screen on every reconnect.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import * as gcal from './calc/googleCalendar';
import { useCalendarSyncAction } from './useCalendarSync';
import { clearOverlay } from './googleOverlayStore';
import { SEED_COURSES } from '../theknowledgebase/courses/coursesSeed';

const ROLES = [
  { value: 'show', label: 'Show on the MFT calendar' },
  { value: 'feed', label: 'School feed (due dates)' },
  { value: 'hide', label: 'Ignore' },
];

function resultLine(r) {
  if (!r) return null;
  const parts = [];
  if (r.inserted) parts.push(`${r.inserted} sent to Google`);
  if (r.patched) parts.push(`${r.patched} updated in Google`);
  if (r.moved) parts.push(`${r.moved} moved between calendars`);
  if (r.deleted) parts.push(`${r.deleted} removed from Google`);
  if (r.imported) parts.push(`${r.imported} brought in from Google`);
  if (r.updatedInMft) parts.push(`${r.updatedInMft} rescheduled from Google`);
  if (r.removedFromMft) parts.push(`${r.removedFromMft} removed (deleted in Google)`);
  if (r.detached) parts.push(`${r.detached} workouts unlinked (deleted in Google, data kept)`);
  parts.push(`${r.overlay} events from your calendars`);
  if (r.canvas || r.ls) parts.push(`${r.canvas + r.ls} school-feed items`);
  return parts.join(' · ');
}

/** The button, usable anywhere in MFT (Settings, the School page). */
export function CalendarSyncButton({ compact = false }) {
  const fitness = useFitness();
  const { sync, busy, err, last } = useCalendarSyncAction(fitness);
  const hub = fitness.settings.calendarHub || {};
  const live = gcal.isConnected();
  const label = busy ? 'Syncing…' : live ? 'Sync now' : hub.connected ? 'Reconnect & sync' : 'Connect Google & sync';
  return (
    <div className={`ft-hub-sync${compact ? ' compact' : ''}`}>
      <button type="button" className="ft-btn-primary" onClick={sync} disabled={busy}>{label}</button>
      {!compact && hub.lastSync && <span className="ft-hint-sm">last sync {new Date(hub.lastSync).toLocaleString()}</span>}
      {last && <p className="ft-import-msg">{resultLine(last)}</p>}
      {last?.warnings?.length > 0 && <p className="ft-import-err">{last.warnings.join(' ')}</p>}
      {err && <p className="ft-import-err">{err}</p>}
    </div>
  );
}

export default function CalendarHub() {
  const { settings, updateSettings } = useFitness();
  const hub = settings.calendarHub || {};
  const [, force] = useState(0);
  const roster = SEED_COURSES.map((c) => c.code);
  const live = gcal.isConnected();

  const setRole = (id, patch) => {
    const roles = { ...(hub.roles || {}) };
    roles[id] = { ...(roles[id] || {}), ...patch };
    const calendars = (hub.calendars || []).map((c) => (c.id === id ? { ...c, ...patch } : c));
    updateSettings({ calendarHub: { ...hub, roles, calendars } });
  };

  const disconnect = () => {
    gcal.disconnect();
    clearOverlay();
    updateSettings({ calendarHub: { ...hub, connected: false } });
    force((n) => n + 1);
  };

  return (
    <div className="ft-set-card" id="calendars">
      <h3>Calendars</h3>
      <p className="ft-hint-sm">
        <strong>Google Calendar is the hub.</strong> Your iPhone syncs with Google by itself; MFT syncs with Google here.
        Workouts go to a Google calendar called <em>Training</em>, other MFT events to one called <em>MFT</em> — both
        two-way: move or rename something on your phone and MFT follows. Your other Google calendars show on the MFT
        calendar, and subscribed school feeds (Canvas, Learning Suite) refresh the <Link className="ft-hub-link" to="/MFT/school">School</Link> page.
      </p>

      <div className="ft-cal-status">
        <span className={`ft-sync ${live ? 'ft-sync-cloud' : 'ft-sync-local'}`}>
          {live ? `Connected · ${gcal.minutesLeft()} min left on this Google session` : hub.connected ? 'Set up — session expired (they last ~1 h)' : 'Not connected'}
        </span>
      </div>
      <div className="ft-import-actions">
        <CalendarSyncButton />
        {hub.connected && <button type="button" className="ft-btn-ghost" onClick={disconnect}>Disconnect</button>}
      </div>
      {hub.lastResult && (
        <p className="ft-hint-sm">Last sync: {resultLine(hub.lastResult)}</p>
      )}

      {hub.calendars?.length > 0 && (
        <table className="ft-hub-cals">
          <thead>
            <tr><th>Your Google calendars</th><th>Role</th><th>Details</th></tr>
          </thead>
          <tbody>
            {hub.calendars.map((c) => (
              <tr key={c.id}>
                <td><span className="ft-hub-dot" style={{ background: c.color }} />{c.summary}</td>
                <td>
                  <select className="ft-input" value={c.role} onChange={(e) => setRole(c.id, { role: e.target.value })}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td>
                  {c.role === 'feed' && (
                    <div className="ft-hub-feed">
                      <select className="ft-input" value={c.feedKind || ''} onChange={(e) => setRole(c.id, { feedKind: e.target.value || null })}>
                        <option value="">Detect automatically</option>
                        <option value="canvas">Canvas (all courses)</option>
                        <option value="ls">Learning Suite (one course)</option>
                      </select>
                      {c.feedKind === 'ls' && (
                        <select className="ft-input" value={c.course || ''} onChange={(e) => setRole(c.id, { course: e.target.value || null })}>
                          <option value="">Which course?</option>
                          {roster.map((code) => <option key={code} value={code}>{code}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <details className="ft-hub-setup">
        <summary>First-time setup (about 10 minutes, once)</summary>
        <ol>
          <li><strong>Canvas feed:</strong> Canvas → Calendar → right sidebar → <em>Calendar Feed</em> → copy the link.</li>
          <li><strong>Learning Suite feeds:</strong> each AERO course → <em>Schedule</em> tab → <em>Get iCalendar Feed</em> → copy.</li>
          <li><strong>Google:</strong> calendar.google.com → <em>Other calendars</em> <strong>+</strong> → <em>From URL</em> → paste each link.</li>
          <li><strong>iPhone:</strong> Settings → Calendar → Accounts → add your Google account, Calendars on. Then Settings → Calendar → <em>Default Calendar</em> → a Google calendar (otherwise new iPhone events stay in iCloud and never reach Google).</li>
          <li><strong>Here:</strong> Connect Google &amp; sync. Feeds show up in the table above as <em>School feed</em>; pick the course for each Learning Suite one.</li>
        </ol>
      </details>
    </div>
  );
}
