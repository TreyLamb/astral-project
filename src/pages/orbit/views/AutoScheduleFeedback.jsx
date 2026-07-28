import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import { normalizeTitle } from '../calc/energy';
import { newDurationEntry } from '../orbitConfig';
import {
  REASON_CODES, reasonToWrites, inferWindowFromMin,
} from '../calc/feedback';

// Feedback→rules capture (Guidelines_Scheduler.md §12, Phase 7 Milestone B).
// Shown when a suggested placement is rejected (or a moved item's "why?" is
// clicked). The removal/move ALREADY happened — this turns the one-off
// correction into a durable write (task tag, learned duration, or policy rule)
// the deterministic placer honors next time. Pure mapping lives in
// calc/feedback.js; this component only collects the tiny extra input a couple
// of reasons need and dispatches the returned writes to context.
const WINDOW_LABELS = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening' };

export default function AutoScheduleFeedback({ entry, onExclude, onDone }) {
  const {
    tasksById, durations, settings, updateTask, addRule, upsertDuration,
  } = useOrbit();
  const task = tasksById.get(entry.taskId);

  const [expanded, setExpanded] = useState(null); // reason code awaiting extra input
  const [minutes, setMinutes] = useState(String(task?.estWorkMin ?? task?.timeMin ?? ''));
  const [win, setWin] = useState(inferWindowFromMin(entry.movedToMin) || 'evening');
  const [status, setStatus] = useState(null);
  const [ruleOffer, setRuleOffer] = useState(false);

  if (!task) return null;

  const applyWrites = async (writes) => {
    if (writes.taskPatch) await updateTask(task.id, writes.taskPatch);
    if (writes.duration) await upsertDuration(newDurationEntry(writes.duration));
    if (writes.rule) await addRule(writes.rule);
    if (writes.sessionExclude && onExclude) onExclude(task.id);
  };

  const run = async (code, extra) => {
    const context = {
      defaultRecoveryMin: settings.scheduler.defaultRecoveryMin,
      movedToMin: entry.movedToMin ?? null,
      ...extra,
    };
    if (code === 'takes-longer') {
      const existing = durations.find((d) => d.key === normalizeTitle(task.title));
      context.prevSamples = existing?.samples ?? [];
    }
    await applyWrites(reasonToWrites(code, task, context));
  };

  const chipClick = async (rc) => {
    if (rc.needs) { setExpanded(rc.code); return; }
    await run(rc.code);
    if (rc.code === 'perishable') { setStatus('Marked perishable.'); setRuleOffer(true); }
    else if (rc.code === 'not-today') setStatus('Skipped for this planning session.');
    else if (rc.code === 'not-near-my-errands') setStatus("Noted — I'll batch it with your errands next time.");
    else setStatus("Got it — I'll remember that.");
  };

  const confirmMinutes = async () => {
    const n = Number(minutes);
    if (!n || n <= 0) { setExpanded(null); return; }
    await run('takes-longer', { estWorkMin: n });
    setStatus(`Learned: “${task.title}” takes about ${n} min.`);
    setExpanded(null);
  };

  const confirmWindow = async () => {
    await run('wrong-time-of-day', { idealWindow: win });
    setStatus(`Set preference to ${WINDOW_LABELS[win].toLowerCase()}.`);
    setExpanded(null);
  };

  const installRule = async () => {
    await applyWrites(reasonToWrites('perishable', task, { makeRule: true }));
    setStatus('Rule added: perishables never right after outdoor tasks.');
    setRuleOffer(false);
  };

  return (
    <div className="orb-auto-feedback">
      <div className="orb-auto-feedback-head">
        <span className="orb-auto-feedback-title">
          {entry.action === 'move' ? 'Moved' : 'Removed'} <strong>{task.title}</strong> — why? <span className="orb-auto-feedback-opt">(optional)</span>
        </span>
        <button type="button" className="orb-auto-iconbtn" onClick={onDone} aria-label="Dismiss">✕</button>
      </div>

      {status ? (
        <div className="orb-auto-feedback-status">
          {status}
          {ruleOffer && (
            <button type="button" className="orb-chip orb-auto-feedback-rulebtn" onClick={installRule}>
              + make it a rule for all tasks
            </button>
          )}
          <button type="button" className="orb-btn orb-auto-feedback-done" onClick={onDone}>Done</button>
        </div>
      ) : expanded === 'takes-longer' ? (
        <div className="orb-auto-feedback-expand">
          <span>Actually takes</span>
          <input
            className="orb-auto-num" type="number" min={1} step={5} autoFocus
            value={minutes} onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmMinutes(); }}
          />
          <span>min</span>
          <button type="button" className="orb-btn orb-btn-primary" onClick={confirmMinutes}>Save</button>
          <button type="button" className="orb-btn" onClick={() => setExpanded(null)}>Cancel</button>
        </div>
      ) : expanded === 'wrong-time-of-day' ? (
        <div className="orb-auto-feedback-expand">
          <span>Prefer</span>
          <select className="orb-auto-move" value={win} onChange={(e) => setWin(e.target.value)}>
            {Object.entries(WINDOW_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" className="orb-btn orb-btn-primary" onClick={confirmWindow}>Save</button>
          <button type="button" className="orb-btn" onClick={() => setExpanded(null)}>Cancel</button>
        </div>
      ) : (
        <div className="orb-auto-feedback-chips">
          {REASON_CODES.map((rc) => (
            <button key={rc.code} type="button" className="orb-chip orb-auto-feedback-chip" title={rc.hint} onClick={() => chipClick(rc)}>
              {rc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
