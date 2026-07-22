import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTimerTool } from './timerToolContext';
import { useDocumentPiP } from './useDocumentPiP';
import DashboardGrid from './DashboardGrid';
import TimerEditorModal from './TimerEditorModal';

export default function Dashboard() {
  const { startAllTimers, pauseAllTimers, resetAllTimers } = useTimerTool();
  const pip = useDocumentPiP();
  // null closed | 'new' create | timer object = edit — mirrors QuickAddModal's pattern elsewhere on this site.
  const [timerModal, setTimerModal] = useState(null);

  return (
    <>
      <div className="tt-toolbar">
        <div className="tt-global-controls">
          <button className="tt-btn tt-btn-primary" onClick={startAllTimers}>Start All</button>
          <button className="tt-btn tt-btn-secondary" onClick={pauseAllTimers}>Pause All</button>
          <button className="tt-btn tt-btn-danger" onClick={resetAllTimers}>Reset All</button>
        </div>
        <div className="tt-toolbar-right">
          <button className="tt-btn tt-btn-secondary" onClick={() => setTimerModal('new')}>+ New Timer</button>
          <button
            className="tt-btn tt-btn-secondary"
            onClick={pip.isOpen ? pip.close : pip.open}
            disabled={!pip.supported}
            title={pip.supported ? 'Pop the timer grid out into a floating window' : 'Not supported in this browser — try Chrome, Edge, or Firefox'}
          >
            {pip.isOpen ? '⧉ Bring back' : '⧉ Pop out'}
          </button>
        </div>
      </div>

      {pip.isOpen ? (
        <>
          <div className="tt-popped-out-placeholder">
            <p>Timers are popped out in a floating window ⧉</p>
            <button className="tt-btn tt-btn-secondary" onClick={pip.close}>Bring back</button>
          </div>
          {createPortal(<DashboardGrid onEdit={setTimerModal} />, pip.pipWindow.document.body)}
        </>
      ) : (
        <DashboardGrid onEdit={setTimerModal} />
      )}

      {timerModal && (
        <TimerEditorModal
          timer={timerModal === 'new' ? null : timerModal}
          onClose={() => setTimerModal(null)}
        />
      )}
    </>
  );
}
