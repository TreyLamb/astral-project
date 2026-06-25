import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSL } from './SignalLostApp';
import { deleteSave, DEFAULT_SAVE, writeSave } from './signalLostStorage';

const BOOT_LINES = [
  '> EREBUS-9 DEEP SPACE RELAY STATION',
  '> EMERGENCY POWER ONLINE',
  '> CRYO UNIT 01 — DEFROST SEQUENCE INITIATED...',
  '> OPERATOR-7 — VITAL SIGNS NOMINAL',
  '> STATION CLOCK: SYNCHRONIZED',
  '> WARNING: UPLINK ARRAY DEGRADED — 4% CAPACITY',
  '> MANUAL INPUT REQUIRED TO RESTORE SIGNAL',
  '> AWAITING OPERATOR...',
];

export default function SignalLostHome() {
  const navigate = useNavigate();
  const { save, setSave } = useSL();
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const isFirstPlay = !save;

  // Print boot lines one by one
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setBootDone(true);
        if (!save) setShowHowTo(true);
        return;
      }
      setBootLines(prev => [...prev, BOOT_LINES[i]]);
      i++;
    }, 220);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    navigate('/signal-lost/play');
  }

  function handleNewGame() {
    if (save && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    const fresh = {
      ...DEFAULT_SAVE,
      startedAt: Date.now(),
    };
    writeSave(fresh);
    setSave(fresh);
    navigate('/signal-lost/play');
  }

  return (
    <div className="sl-home">
      <div className="sl-boot-log">
        {bootLines.map((line, i) => (
          <span key={i} className="sl-boot-line">{line}</span>
        ))}
      </div>

      {bootDone && (
        <>
          <h1 className="sl-title">SIGNAL LOST</h1>
          <p className="sl-subtitle">EREBUS-9 RELAY STATION — SECTOR 7</p>

          <div className="sl-home-buttons">
            {save && (
              <button className="sl-btn sl-btn-primary" onClick={handleContinue}>
                CONTINUE — LV {save.level}
              </button>
            )}

            {confirmNew ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#ffaa00', textAlign: 'center' }}>
                  ERASE SAVE DATA?
                </span>
                <button className="sl-btn sl-btn-danger" onClick={handleNewGame}>
                  CONFIRM ERASE + NEW GAME
                </button>
                <button className="sl-btn sl-btn-secondary" onClick={() => setConfirmNew(false)}>
                  CANCEL
                </button>
              </div>
            ) : (
              <button className="sl-btn sl-btn-secondary" onClick={handleNewGame}>
                {save ? 'NEW GAME' : 'START GAME'}
              </button>
            )}

            <button className="sl-btn sl-btn-secondary" onClick={() => setShowHowTo(true)}>
              HOW TO PLAY
            </button>
          </div>
        </>
      )}

      {showHowTo && (
        <div className="sl-modal-overlay" onClick={() => setShowHowTo(false)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <h2>// HOW TO PLAY //</h2>

            <p>
              You are <span className="sl-modal-highlight">OPERATOR-7</span>, last human
              aboard EREBUS-9. Incoming data packets stream across your screen from right to left.
              Type each word or phrase before it hits the reactor core on the left edge.
            </p>

            <p><span className="sl-modal-highlight">BASIC CONTROLS</span></p>
            <ul>
              <li>Type words in the input at the bottom — no Enter needed for short matches</li>
              <li>Press Enter to manually submit if auto-match doesn&apos;t trigger</li>
              <li>Your typing auto-targets the closest matching word</li>
            </ul>

            <p><span className="sl-modal-highlight">SCORING</span></p>
            <ul>
              <li>Each word typed correctly earns <span className="sl-modal-highlight">SIGNAL</span> (XP)</li>
              <li>Fill the SIGNAL bar to level up and unlock station modules</li>
              <li>Combo: type 5+ words in a row for 2x, 3x, 4x, 5x multiplier</li>
              <li>Faster words + faster typing = more points</li>
            </ul>

            <p><span className="sl-modal-highlight">STATION HP</span></p>
            <ul>
              <li>Starts at 3 HP — a word hitting the reactor costs 1 HP</li>
              <li>Combo resets on every miss</li>
              <li>Reach 0 HP: game over</li>
            </ul>

            <p><span className="sl-modal-highlight">SKILLS (unlock as you level up)</span></p>
            <ul>
              <li><span className="sl-modal-highlight">[Q] SLOW BEAM</span> — freezes all packets for 2s (20 energy)</li>
              <li><span className="sl-modal-highlight">[W] CLEAR BURST</span> — destroys all packets (30 energy)</li>
              <li><span className="sl-modal-highlight">[E] SHIELD</span> — blocks next 3 reactor hits (25 energy)</li>
              <li><span className="sl-modal-highlight">[R] OVERDRIVE</span> — 2x score for 60s (40 energy)</li>
            </ul>

            <p>Energy recharges 1 per second. Max 100.</p>

            <p>
              <span className="sl-modal-highlight">LONG</span> and{' '}
              <span className="sl-modal-highlight">PHRASE</span> packets are worth more points
              but take longer to type. Prioritize them when they appear.
            </p>

            <button
              className="sl-btn sl-btn-primary sl-modal-close"
              onClick={() => setShowHowTo(false)}
            >
              ACKNOWLEDGED — CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
