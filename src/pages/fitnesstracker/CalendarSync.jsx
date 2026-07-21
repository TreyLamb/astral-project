import { useState } from 'react';
import { useFitness } from './fitnessContext';
import { activityType } from './fitnessConfig';
import { fmtDist, fmtPace, fmtDur, paceUnitFor } from './format';
import { paceSecPerMeter } from './calc/pace';
import * as gcal from './calc/googleCalendar';

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
function localISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }

// Two-way sync UI + orchestration. Ownership: scheduling = last-write-wins by
// timestamp; performance data is tracker-only, summarised into the description.
export default function CalendarSync() {
  const { workouts, activityTypes, settings, updateSettings, updateWorkout, addWorkout } = useFitness();
  const cal = settings.calendar || {};
  const unit = settings.units.distance;
  const paceUnit = paceUnitFor(unit);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState(null);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function eventTimes(w) {
    if (w.time) {
      const start = `${w.date}T${w.time}:00`;
      const end = localISO(new Date(new Date(start).getTime() + (w.durationSec || 3600) * 1000));
      return { start: { dateTime: start, timeZone: tz }, end: { dateTime: end, timeZone: tz } };
    }
    const next = new Date(new Date(w.date + 'T00:00:00').getTime() + DAY);
    return { start: { date: w.date }, end: { date: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}` } };
  }

  function description(w) {
    const lines = [`Status: ${w.status}`];
    if (w.distanceM) lines.push(`Distance: ${fmtDist(w.distanceM, unit)}`);
    if (w.durationSec) lines.push(`Time: ${fmtDur(w.durationSec)}`);
    if (w.distanceM && w.durationSec) lines.push(`Pace: ${fmtPace(paceSecPerMeter(w.distanceM, w.durationSec), paceUnit)}`);
    const m = w.metrics || {};
    if (m.avgHr) lines.push(`Avg HR: ${m.avgHr} bpm`);
    if (m.elevationGainM) lines.push(`Elev gain: ${m.elevationGainM} m`);
    if (w.rpe) lines.push(`RPE: ${w.rpe}/10`);
    if (w.note) lines.push(`Note: ${w.note}`);
    lines.push('', '— synced from FitnessTracker');
    return lines.join('\n');
  }

  function eventBody(w) {
    const t = activityType(activityTypes, w.activityType);
    const label = w.distanceM ? ` ${fmtDist(w.distanceM, unit)}` : '';
    return {
      summary: `${t.icon} ${t.name}${label}`,
      description: description(w),
      ...eventTimes(w),
      extendedProperties: { private: { ftWorkoutId: w.id, ftUpdated: String(w.updatedAt || 0) } },
    };
  }

  async function handleConnect() {
    setErr(null); setBusy(true);
    try {
      const { email } = await gcal.connect();
      const calendarId = await gcal.ensureTrainingCalendar();
      await updateSettings({ calendar: { connected: true, calendarId, email, lastSync: null } });
      setStatus(`Connected as ${email || 'your Google account'}.`);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  function handleDisconnect() {
    gcal.disconnect();
    updateSettings({ calendar: { connected: false, calendarId: null, email: null, lastSync: null } });
    setStatus('Disconnected. Local data is untouched.');
  }

  async function handleSync() {
    setErr(null); setStatus(null); setBusy(true);
    let pushed = 0, pulled = 0, imported = 0;
    try {
      if (!gcal.isConnected()) throw new Error('Reconnect first — the Google session has expired (tokens last ~1h).');
      const calendarId = cal.calendarId;
      const now = Date.now();
      const winMin = new Date(now - 60 * DAY), winMax = new Date(now + 60 * DAY);

      // ---- push: our workouts -> events ----
      for (const w of workouts) {
        const inWindow = new Date(w.date).getTime() >= winMin.getTime() && new Date(w.date).getTime() <= winMax.getTime();
        if (!inWindow || (w.metrics && w.metrics.gcalExternal)) continue;
        const body = eventBody(w);
        const eventId = w.metrics?.gcalEventId;
        if (eventId) {
          await gcal.patchEvent(calendarId, eventId, body);
        } else {
          const ev = await gcal.insertEvent(calendarId, body);
          await updateWorkout(w.id, { metrics: { ...(w.metrics || {}), gcalEventId: ev.id } });
        }
        pushed++;
      }

      // ---- pull: events -> scheduling changes + external imports ----
      const events = await gcal.listEvents(calendarId, winMin.toISOString(), winMax.toISOString());
      const byEventId = new Map(workouts.map((w) => [w.metrics?.gcalEventId, w]).filter(([k]) => k));
      for (const ev of events) {
        if (ev.status === 'cancelled') continue;
        const ftId = ev.extendedProperties?.private?.ftWorkoutId;
        const evDate = ev.start?.date || (ev.start?.dateTime ? ev.start.dateTime.slice(0, 10) : null);
        const evTime = ev.start?.dateTime ? ev.start.dateTime.slice(11, 16) : '';
        if (ftId) {
          const w = workouts.find((x) => x.id === ftId) || byEventId.get(ev.id);
          if (!w) continue;
          // scheduling last-write-wins: only when the Google edit is newer
          if (Date.parse(ev.updated) > (w.updatedAt || 0) && evDate && (evDate !== w.date || evTime !== (w.time || ''))) {
            await updateWorkout(w.id, { date: evDate, time: evTime });
            pulled++;
          }
        } else if (!byEventId.has(ev.id) && evDate) {
          // an event created directly in Google -> bring it in as a planned item
          await addWorkout({ date: evDate, time: evTime, activityType: 'other', status: 'planned', note: ev.summary || 'Google event', metrics: { gcalEventId: ev.id, gcalExternal: true } });
          imported++;
        }
      }

      await updateSettings({ calendar: { ...cal, lastSync: Date.now() } });
      setStatus(`Synced — pushed ${pushed}, pulled ${pulled}, imported ${imported}.`);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="ft-set-card">
      <h3>Google Calendar</h3>
      <p className="ft-hint-sm">
        Two-way sync to a dedicated <strong>Training</strong> calendar (won't clutter your main one). Planned &amp; logged workouts
        become events; edits to date/time on either side reconcile by last-write-wins. Performance detail stays here and is summarised
        in the event description.
      </p>
      {!cal.connected ? (
        <button type="button" className="ft-btn-primary" onClick={handleConnect} disabled={busy}>{busy ? 'Connecting…' : 'Connect Google Calendar'}</button>
      ) : (
        <>
          <div className="ft-cal-status">
            <span className="ft-sync ft-sync-cloud">☁ Connected{cal.email ? ` · ${cal.email}` : ''}</span>
            {cal.lastSync && <span className="ft-hint-sm">last sync {new Date(cal.lastSync).toLocaleString()}</span>}
          </div>
          <div className="ft-import-actions">
            <button type="button" className="ft-btn-primary" onClick={handleSync} disabled={busy}>{busy ? 'Syncing…' : 'Sync now'}</button>
            <button type="button" className="ft-btn-ghost" onClick={handleDisconnect} disabled={busy}>Disconnect</button>
          </div>
        </>
      )}
      <p className="ft-hint-sm" style={{ marginTop: 10 }}>
        Needs the Calendar API + scope enabled on the site's Google project, and a browser OAuth token (≈1h — reconnect when it expires).
      </p>
      {status && <p className="ft-import-msg">{status}</p>}
      {err && <p className="ft-import-err">{err}</p>}
    </div>
  );
}
