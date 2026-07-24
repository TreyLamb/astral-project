import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import TaskRow from './TaskRow';
import './CarryoverView.css';

// Message + button copy both come from the same suggestedAction so the
// explanation text and the "Do today" button's promise never drift apart.
function suggestionText(candidate) {
  const { task, suggestedAction } = candidate;
  return suggestedAction === 'reschedule'
    ? `Scheduled for ${task.scheduledDate} — slipped past today`
    : `Due ${task.dueDate} — missed, urgency will be raised`;
}

function CarryoverRow({ candidate }) {
  const { rollTaskToToday, updateTask } = useOrbit();
  const [reschedulingOpen, setReschedulingOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState(candidate.task.scheduledDate || candidate.task.dueDate || '');

  const submitReschedule = () => {
    if (!dateDraft) return;
    updateTask(candidate.taskId, { scheduledDate: dateDraft });
    setReschedulingOpen(false);
  };

  return (
    <div className="orb-cv-row">
      <TaskRow task={candidate.task} showProject />
      <div className="orb-cv-actions-wrap">
        <span className={`orb-cv-suggestion orb-cv-suggestion-${candidate.suggestedAction}`}>
          {suggestionText(candidate)}
        </span>

        <button type="button" className="orb-btn orb-btn-primary" onClick={() => rollTaskToToday(candidate.taskId)}>
          {candidate.suggestedAction === 'raiseUrgency' ? 'Do today (+urgency)' : 'Do today'}
        </button>

        {reschedulingOpen ? (
          <span className="orb-cv-reschedule">
            <input
              type="date"
              autoFocus
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitReschedule(); if (e.key === 'Escape') setReschedulingOpen(false); }}
            />
            <button type="button" className="orb-btn orb-btn-primary" disabled={!dateDraft} onClick={submitReschedule}>Set</button>
            <button type="button" className="orb-btn" onClick={() => setReschedulingOpen(false)}>Cancel</button>
          </span>
        ) : (
          <button type="button" className="orb-btn" onClick={() => setReschedulingOpen(true)}>Reschedule</button>
        )}

        <button type="button" className="orb-btn orb-cv-kill" onClick={() => updateTask(candidate.taskId, { status: 'killed' })}>
          Kill
        </button>
      </div>
    </div>
  );
}

// The evening/morning rollover ritual: everything open whose scheduled/due
// date has already slipped past today, one triage pass. Candidates are
// derived (see orbitContext.js's carryoverCandidatesList), so any action
// here — reschedule, kill, mark done via TaskRow's checkbox — makes the row
// disappear on its own next render, no manual list bookkeeping needed.
export default function CarryoverView() {
  const { carryoverCandidates, rollTaskToToday } = useOrbit();

  if (carryoverCandidates.length === 0) {
    return (
      <div className="orb-cv-empty">
        <div className="orb-cv-empty-icon">✓</div>
        <div>Nothing carried over — you're on top of it.</div>
      </div>
    );
  }

  const doAllToday = () => { carryoverCandidates.forEach((c) => rollTaskToToday(c.taskId)); };

  return (
    <div className="orb-cv">
      <div className="orb-cv-head">
        <div>
          <h2 className="orb-cv-h2">Carryover</h2>
          <p className="orb-cv-sub">
            {carryoverCandidates.length} open task{carryoverCandidates.length === 1 ? '' : 's'} slipped past today.
            Do it today, push it out, or let it go — this is the rollover ritual.
          </p>
        </div>
        <button type="button" className="orb-btn orb-btn-primary" onClick={doAllToday}>Do all today</button>
      </div>

      <div className="orb-cv-list">
        {carryoverCandidates.map((c) => <CarryoverRow key={c.taskId} candidate={c} />)}
      </div>
    </div>
  );
}
