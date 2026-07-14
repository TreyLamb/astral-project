import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AqFirestore } from './aqFirestore';

// Multi-step join flow:
// 'code'     -> enter + validate room code
// 'identity' -> pick an existing player to reclaim, or "I'm new"
// 'newName'  -> nickname entry for a brand-new player
// 'waiting'  -> reclaim request sent, watching for the host's decision
export default function AntiquityQuestJoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('code');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    if (step !== 'waiting' || !requestId) return undefined;
    const unsubscribe = AqFirestore.subscribeRejoinRequest(roomCode, requestId, async (request) => {
      if (!request || request.status === 'pending') return;

      await AqFirestore.deleteRejoinRequest(roomCode, requestId);

      if (request.status === 'approved') {
        localStorage.setItem('aq_player', JSON.stringify({
          roomCode,
          playerId: request.claimedPlayerId,
          name: request.claimedPlayerName,
        }));
        navigate('/antiquityquest/play/' + roomCode);
      } else {
        setError(`The host didn't approve rejoining as ${request.claimedPlayerName}. Pick another option below.`);
        setRequestId(null);
        setStep('identity');
      }
    });
    return unsubscribe;
  }, [step, requestId, roomCode, navigate]);

  async function handleCodeSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const code = roomCode.toUpperCase();

    let session;
    try {
      session = await new Promise((resolve) => {
        const unsub = AqFirestore.subscribeSession(code, (s) => { unsub(); resolve(s); });
      });
    } catch {
      setError('Something went wrong checking that room. Please try again.');
      setSubmitting(false);
      return;
    }

    if (!session || session.status === 'game_over') {
      setError("Room not found, or that game's already over. Double-check the code.");
      setSubmitting(false);
      return;
    }

    const existingPlayers = await new Promise((resolve) => {
      const unsub = AqFirestore.subscribePlayers(code, (p) => { unsub(); resolve(p); });
    });

    setRoomCode(code);
    setPlayers(existingPlayers);
    setSubmitting(false);
    setStep('identity');
  }

  async function reclaimPlayer(player) {
    setError('');
    setSubmitting(true);
    try {
      const id = await AqFirestore.requestRejoin(roomCode, player.id, player.name);
      setRequestId(id);
      setStep('waiting');
    } catch {
      setError('Could not send that request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewNameSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let result;
    try {
      result = await AqFirestore.joinSession(roomCode, nickname);
    } catch {
      setError('Something went wrong joining that room. Please try again.');
      setSubmitting(false);
      return;
    }

    if (!result) {
      setError("That game's already over.");
      setSubmitting(false);
      return;
    }

    localStorage.setItem('aq_player', JSON.stringify({
      roomCode: result.roomCode,
      playerId: result.playerId,
      name: nickname,
    }));
    navigate('/antiquityquest/play/' + result.roomCode);
  }

  if (step === 'identity') {
    return (
      <div className="aq-join">
        <div className="aq-join-card">
          <h1 className="aq-join-title">Room {roomCode}</h1>
          <p className="aq-join-label">Are you one of these players, or new?</p>

          {error && <div className="aq-join-error">{error}</div>}

          <div className="aq-join-identity-list">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                className="aq-btn aq-btn-join aq-join-identity-btn"
                disabled={submitting}
                onClick={() => reclaimPlayer(p)}
              >
                I&apos;m {p.name}
              </button>
            ))}
            <button
              type="button"
              className="aq-btn aq-btn-host aq-join-identity-btn"
              disabled={submitting}
              onClick={() => setStep('newName')}
            >
              + I&apos;m a new player
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="aq-join">
        <div className="aq-join-card">
          <h1 className="aq-join-title">Waiting for the host…</h1>
          <p className="aq-join-label">The host needs to confirm you before you can rejoin.</p>
        </div>
      </div>
    );
  }

  if (step === 'newName') {
    return (
      <div className="aq-join">
        <div className="aq-join-card">
          <h1 className="aq-join-title">Room {roomCode}</h1>
          <form className="aq-join-form" onSubmit={handleNewNameSubmit}>
            <label className="aq-join-label" htmlFor="aq-nickname">Nickname</label>
            <input
              id="aq-nickname"
              className="aq-join-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your name"
              required
              autoFocus
            />
            {error && <div className="aq-join-error">{error}</div>}
            <button className="aq-btn aq-btn-join" type="submit" disabled={submitting}>
              {submitting ? 'Joining…' : 'Join'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="aq-join">
      <div className="aq-join-card">
        <h1 className="aq-join-title">Join a Game</h1>
        <form className="aq-join-form" onSubmit={handleCodeSubmit}>
          <label className="aq-join-label" htmlFor="aq-room-code">Room Code</label>
          <input
            id="aq-room-code"
            className="aq-join-input aq-join-input-code"
            type="text"
            maxLength={4}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="ABCD"
            required
          />

          {error && <div className="aq-join-error">{error}</div>}

          <button className="aq-btn aq-btn-join" type="submit" disabled={submitting}>
            {submitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
