import { useState } from 'react';
import { useTimerTool } from './timerToolContext';

// Unified create/edit modal — timer={null} means "create new" (editing = false),
// otherwise it's the timer object being edited. Same pattern as fitnesstracker's
// GoalEditorModal (`editing = !!goal`).
export default function TimerEditorModal({ timer, onClose }) {
  const { presets, addTimer, updateTimer } = useTimerTool();
  const editing = !!timer;

  const [name, setName] = useState(timer?.name || '');
  const [phaseOne, setPhaseOne] = useState(timer?.phaseOne ?? 65);
  const [phaseTwo, setPhaseTwo] = useState(timer?.phaseTwo ?? 120);
  const [phaseOneLabel, setPhaseOneLabel] = useState(timer?.phaseOneLabel || 'Milestone 1');
  const [phaseTwoLabel, setPhaseTwoLabel] = useState(timer?.phaseTwoLabel || 'Milestone 2');
  const [alarmOneId, setAlarmOneId] = useState(timer?.alarmOneId || presets[0]?.id || '');
  const [alarmTwoId, setAlarmTwoId] = useState(timer?.alarmTwoId || presets[0]?.id || '');

  function save(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      phaseOne: Number(phaseOne),
      phaseTwo: Number(phaseTwo),
      phaseOneLabel: phaseOneLabel.trim() || 'Milestone 1',
      phaseTwoLabel: phaseTwoLabel.trim() || 'Milestone 2',
      alarmOneId,
      alarmTwoId,
    };

    if (editing) updateTimer(timer.id, payload);
    else addTimer(payload);
    onClose();
  }

  return (
    <div className="tt-modal-overlay" onClick={onClose}>
      <div className="tt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tt-modal-header">
          <h3>{editing ? 'Edit timer' : 'Create custom timer'}</h3>
          <button className="tt-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save}>
          <div className="tt-form-group">
            <label>Timer name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Timer 5" required />
          </div>

          <div className="tt-form-row">
            <div className="tt-form-group">
              <label>Milestone 1 label</label>
              <input type="text" value={phaseOneLabel} onChange={(e) => setPhaseOneLabel(e.target.value)} placeholder="Milestone 1" />
            </div>
            <div className="tt-form-group">
              <label>Milestone 1 (seconds)</label>
              <input type="number" value={phaseOne} onChange={(e) => setPhaseOne(e.target.value)} min="1" required />
            </div>
          </div>

          <div className="tt-form-row">
            <div className="tt-form-group">
              <label>Milestone 2 label</label>
              <input type="text" value={phaseTwoLabel} onChange={(e) => setPhaseTwoLabel(e.target.value)} placeholder="Milestone 2" />
            </div>
            <div className="tt-form-group">
              <label>Milestone 2 (seconds)</label>
              <input type="number" value={phaseTwo} onChange={(e) => setPhaseTwo(e.target.value)} min={Number(phaseOne) + 1} required />
            </div>
          </div>

          <div className="tt-form-row">
            <div className="tt-form-group">
              <label>Milestone 1 alarm</label>
              <select value={alarmOneId} onChange={(e) => setAlarmOneId(e.target.value)}>
                {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="tt-form-group">
              <label>Milestone 2 alarm</label>
              <select value={alarmTwoId} onChange={(e) => setAlarmTwoId(e.target.value)}>
                {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="tt-modal-actions">
            <button type="button" className="tt-btn tt-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="tt-btn tt-btn-primary">{editing ? 'Save changes' : 'Add timer card'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
