import { useTimerTool } from './timerToolContext';

// Fired-alarm toast stack — mounted once in TimerToolApp's shell so it stays
// visible no matter which tab (Timers/Settings) is currently active.
export default function AlarmToastLayer() {
  const { activeAlarms, dismissAlarm } = useTimerTool();
  if (activeAlarms.length === 0) return null;

  return (
    <div className="tt-alarm-toast-container">
      {activeAlarms.map((alarm) => (
        <div key={alarm.id} className={`tt-alarm-toast ${alarm.milestone === 2 ? 'tt-alarm-stage2' : 'tt-alarm-stage1'}`}>
          <div className="tt-alarm-toast-content">
            <span className="tt-alarm-toast-icon">⚡</span>
            <div>
              <strong>{alarm.timerName}</strong>
              <p>{alarm.text}</p>
            </div>
          </div>
          <button className="tt-alarm-toast-dismiss" onClick={() => dismissAlarm(alarm.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
