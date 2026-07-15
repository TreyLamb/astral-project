import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AqFirestore } from './aqFirestore';
import AntiquityQuestJoin from './AntiquityQuestJoin';
import AntiquityQuestHost from './AntiquityQuestHost';
import AntiquityQuestPlayer from './AntiquityQuestPlayer';
import './AntiquityQuestApp.css';

const SEAT_COUNT_OPTIONS = [4, 5, 6, 7, 8];

function AntiquityQuestLanding() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [seatCount, setSeatCount] = useState(8);

  async function handleHost(totalRounds) {
    setCreating(true);
    setError(null);
    try {
      const session = await AqFirestore.createSession(totalRounds, seatCount);
      navigate(`/antiquityquest/host/${session.roomCode}`);
    } catch (err) {
      setError(err.message || 'Could not create a game, please try again.');
      setCreating(false);
    }
  }

  return (
    <div className="aq-landing">
      <div className="aq-landing-card">
        <h1 className="aq-landing-title">Antiquity Quest</h1>
        <p className="aq-landing-subtitle">Score tracker for the card game</p>
        <div className="aq-landing-actions">
          <div className="aq-landing-host-group">
            <span className="aq-landing-host-label">Host a Game</span>

            <span className="aq-landing-host-sublabel">How many players?</span>
            <div className="aq-landing-seat-count">
              {SEAT_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`aq-btn aq-btn-seatcount ${seatCount === n ? 'aq-btn-seatcount-active' : ''}`}
                  onClick={() => setSeatCount(n)}
                  disabled={creating}
                >
                  {n}
                </button>
              ))}
            </div>

            <span className="aq-landing-host-sublabel">Rounds</span>
            <div className="aq-landing-host-rounds">
              <button
                className="aq-btn aq-btn-host"
                onClick={() => handleHost(1)}
                disabled={creating}
              >
                1 Round
              </button>
              <button
                className="aq-btn aq-btn-host"
                onClick={() => handleHost(3)}
                disabled={creating}
              >
                3 Rounds
              </button>
            </div>
          </div>
          <button
            className="aq-btn aq-btn-join"
            onClick={() => navigate('/antiquityquest/join')}
            disabled={creating}
          >
            Join a Game
          </button>
        </div>
        {error && <div className="aq-landing-error">{error}</div>}
      </div>
    </div>
  );
}

export default function AntiquityQuestApp() {
  return (
    <div className="aq-wrapper">
      <Routes>
        <Route index element={<AntiquityQuestLanding />} />
        <Route path="join" element={<AntiquityQuestJoin />} />
        <Route path="host/:roomCode" element={<AntiquityQuestHost />} />
        <Route path="play/:roomCode" element={<AntiquityQuestPlayer />} />
      </Routes>
    </div>
  );
}
