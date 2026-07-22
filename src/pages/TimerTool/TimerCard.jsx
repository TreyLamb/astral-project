import { useTimerTool } from './timerToolContext';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimerCard({ timer, onEdit }) {
  const { timerStates, startTimer, pauseTimer, resetTimer, removeTimer } = useTimerTool();
  const state = timerStates[timer.id] || { elapsed: 0, isRunning: false, alarmOneTriggered: false, alarmTwoTriggered: false };

  const p1Percent = Math.min(100, (state.elapsed / timer.phaseOne) * 100);
  const p2Percent = state.elapsed <= timer.phaseOne
    ? 0
    : Math.min(100, ((state.elapsed - timer.phaseOne) / (timer.phaseTwo - timer.phaseOne)) * 100);

  let cardStateClass = '';
  if (state.elapsed >= timer.phaseTwo) cardStateClass = 'tt-card-state-two';
  else if (state.elapsed >= timer.phaseOne) cardStateClass = 'tt-card-state-one';
  else if (state.isRunning) cardStateClass = 'tt-card-state-running';

  return (
    <div className={`tt-timer-card ${cardStateClass}`}>
      <div className="tt-card-header">
        <h3>{timer.name}</h3>
        <div className="tt-card-header-actions">
          <button className="tt-card-icon-btn" onClick={() => onEdit(timer)} title="Edit timer" aria-label="Edit timer">⚙</button>
          <button className="tt-card-icon-btn tt-card-delete-btn" onClick={() => removeTimer(timer.id)} title="Remove timer" aria-label="Remove timer">✕</button>
        </div>
      </div>

      <div className="tt-card-display">
        <span className="tt-elapsed-time">{formatTime(state.elapsed)}</span>
        <span className="tt-total-limit">/ {formatTime(timer.phaseTwo)}</span>
      </div>

      <div className="tt-card-milestones">
        <span className={`tt-milestone-tag ${state.elapsed >= timer.phaseOne ? 'active' : ''}`}>
          {timer.phaseOneLabel}: {timer.phaseOne}s
        </span>
        <span className={`tt-milestone-tag ${state.elapsed >= timer.phaseTwo ? 'active' : ''}`}>
          {timer.phaseTwoLabel}: {timer.phaseTwo}s
        </span>
      </div>

      <div className="tt-progress-wrapper">
        <div className="tt-progress-segment">
          <div className="tt-progress-label">Start → {timer.phaseOneLabel}</div>
          <div className="tt-progress-track">
            <div className="tt-progress-fill tt-fill-phase1" style={{ width: `${p1Percent}%` }} />
          </div>
        </div>
        <div className="tt-progress-segment">
          <div className="tt-progress-label">{timer.phaseOneLabel} → {timer.phaseTwoLabel}</div>
          <div className="tt-progress-track">
            <div className="tt-progress-fill tt-fill-phase2" style={{ width: `${p2Percent}%` }} />
          </div>
        </div>
      </div>

      <div className="tt-card-actions">
        {state.isRunning ? (
          <button className="tt-btn tt-btn-sm tt-btn-warning" onClick={() => pauseTimer(timer.id)}>Pause</button>
        ) : (
          <button className="tt-btn tt-btn-sm tt-btn-success" onClick={() => startTimer(timer.id)} disabled={state.elapsed >= timer.phaseTwo}>Start</button>
        )}
        <button className="tt-btn tt-btn-sm tt-btn-secondary" onClick={() => resetTimer(timer.id)}>Reset</button>
      </div>
    </div>
  );
}
