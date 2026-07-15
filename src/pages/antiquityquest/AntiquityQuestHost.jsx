import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AqFirestore } from './aqFirestore';
import { isMessageFresh } from './aqCards';
import AqLiveBooksPreview from './AqLiveBooksPreview';
import AqGemini8v2Theme from './themes/AqGemini8v2Theme';
import { AQ_THEMES } from './themes';
import './AntiquityQuestHost.css';

const INPUT_LABELS = [
  ['perfectTreasures', 'Perfect Treasure Collections'],
  ['perfectAntiquities', 'Perfect Antiquity Collections'],
  ['standardCollections', 'Standard Collections'],
  ['mixedCollections', 'Mixed Collections'],
  ['individualAntiquities', 'Individual Antiquities'],
  ['individualTreasures', 'Individual Treasures'],
  ['heldAntiquities', 'Held Antiquities (unplayed)'],
  ['heldTreasures', 'Held Treasures (unplayed)'],
  ['heldRemingtons', 'Held Remingtons (unplayed)'],
];

function byScoreDescending(a, b) {
  return (b.totalScore || 0) - (a.totalScore || 0);
}

export default function AntiquityQuestHost() {
  const { roomCode } = useParams();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rejoinRequests, setRejoinRequests] = useState([]);

  // Host-tab reload must recover from the URL alone — never carry session
  // state via router location.state from wherever the room was created.
  useEffect(() => {
    const unsubSession = AqFirestore.subscribeSession(roomCode, setSession);
    const unsubPlayers = AqFirestore.subscribePlayers(roomCode, setPlayers);
    const unsubRequests = AqFirestore.subscribeRejoinRequests(roomCode, setRejoinRequests);
    return () => {
      unsubSession();
      unsubPlayers();
      unsubRequests();
    };
  }, [roomCode]);

  const sortedPlayers = [...players].sort(byScoreDescending);
  const pendingRequests = rejoinRequests.filter((r) => r.status === 'pending');

  if (!session) {
    return (
      <div className="aq-host">
        <div className="aq-host-status">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="aq-host">
      {pendingRequests.length > 0 && (
        <div className="aq-host-rejoin-queue">
          {pendingRequests.map((r) => (
            <div key={r.id} className="aq-host-rejoin-row">
              <span>{r.claimedPlayerName} wants to rejoin</span>
              <div className="aq-host-rejoin-actions">
                <button
                  type="button"
                  className="aq-btn aq-btn-remove"
                  onClick={() => AqFirestore.denyRejoin(roomCode, r.id)}
                >
                  Deny
                </button>
                <button
                  type="button"
                  className="aq-btn aq-btn-start"
                  onClick={() => AqFirestore.approveRejoin(roomCode, r.id)}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {session.status === 'setup' && (
        <SetupScreen roomCode={roomCode} players={sortedPlayers} session={session} />
      )}
      {session.status === 'playing' && (
        <PlayingScreen roomCode={roomCode} session={session} players={sortedPlayers} />
      )}
      {session.status === 'round_end' && (
        <RoundEndScreen roomCode={roomCode} session={session} players={sortedPlayers} />
      )}
      {session.status === 'game_over' && (
        <GameOverScreen players={sortedPlayers} />
      )}
    </div>
  );
}

function SetupScreen({ roomCode, players, session }) {
  const theme = session.dashboardTheme || 'tavern';
  const isSeatBased = theme !== 'classic';
  const seatAssignments = session.seatAssignments || {};
  const seatedIds = new Set(Object.values(seatAssignments));
  const unassignedCount = players.filter((p) => !seatedIds.has(p.id)).length;
  // No auto-seating — a seat-based theme requires the host to place every
  // joined player themselves before starting (see aqFirestore.js's startGame).
  const startBlocked = players.length === 0 || (isSeatBased && unassignedCount > 0);

  function handleSeatChange(seatIndex, playerId) {
    const next = { ...(session.seatAssignments || {}) };
    if (playerId == null) delete next[seatIndex];
    else next[seatIndex] = playerId;
    AqFirestore.setSeatAssignments(roomCode, next);
  }

  return (
    <>
      <div className="aq-host-code-label">Room Code</div>
      <div className="aq-host-code">{roomCode}</div>

      <div className="aq-host-status">Waiting for players...</div>

      <div className="aq-host-players">
        {players.length === 0 ? (
          <div className="aq-host-players-empty">No players yet</div>
        ) : (
          <ul className="aq-host-player-list">
            {players.map((player) => (
              <li key={player.id} className="aq-host-player-row">
                <span className="aq-host-player-name">{player.name}</span>
                <button
                  type="button"
                  className="aq-btn aq-btn-remove"
                  onClick={() => AqFirestore.removePlayer(roomCode, player.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="aq-host-settings">
        <div className="aq-host-settings-label">Dashboard View</div>
        <div className="aq-host-theme-picker">
          {AQ_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`aq-btn aq-theme-option ${theme === t.id ? 'aq-theme-option-active' : ''}`}
              onClick={() => AqFirestore.setDashboardTheme(roomCode, t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isSeatBased && players.length > 0 && (
          <>
            <div className="aq-host-settings-label">Seat Assignments (tap an empty seat)</div>
            <AqGemini8v2Theme
              mode="assign"
              skin={theme}
              seatCount={session.seatCount || 8}
              players={players}
              seatAssignments={session.seatAssignments || {}}
              onSeatChange={handleSeatChange}
            />
          </>
        )}
      </div>

      {isSeatBased && unassignedCount > 0 && players.length > 0 && (
        <div className="aq-host-status aq-host-wentout-hint">
          Assign {unassignedCount} more player{unassignedCount === 1 ? '' : 's'} to a seat to start
        </div>
      )}

      <button
        type="button"
        className="aq-btn aq-btn-start"
        disabled={startBlocked}
        onClick={() => AqFirestore.startGame(roomCode)}
      >
        Start Game
      </button>
    </>
  );
}

function PlayingScreen({ roomCode, session, players }) {
  const submittedCount = players.filter((p) => p.rounds?.[session.round]).length;
  const allSubmitted = players.length > 0 && submittedCount === players.length;
  // Re-render on a tick so chat bubbles expire live even with no new write.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="aq-host-code-label-small">Room {roomCode}</div>
      <div className="aq-host-round-heading">
        Round {session.round} of {session.totalRounds}
      </div>
      <div className="aq-host-status aq-host-wentout-hint">Click a player to mark them Went Out this round</div>

      {session.dashboardTheme !== 'classic' ? (
        <AqGemini8v2Theme
          mode="live"
          skin={session.dashboardTheme || 'tavern'}
          seatCount={session.seatCount || 8}
          players={players}
          seatAssignments={session.seatAssignments || {}}
          wentOutPlayerId={session.wentOutPlayerId}
          onWentOutClick={(playerId) => AqFirestore.setWentOut(roomCode, playerId)}
        />
      ) : (
        <div className="aq-host-players">
          <ul className="aq-host-player-list">
            {players.map((player) => {
              const hasSubmitted = Boolean(player.rounds?.[session.round]);
              const wentOut = session.wentOutPlayerId === player.id;
              const fresh = isMessageFresh(player.live?.chatMessage);
              return (
                <li
                  key={player.id}
                  className={wentOut ? 'aq-host-player-row aq-host-player-wentout' : 'aq-host-player-row'}
                >
                  <div className="aq-host-player-row-top" onClick={() => AqFirestore.setWentOut(roomCode, player.id)}>
                    <span className="aq-host-player-name">
                      {wentOut ? '★ ' : ''}{player.name}
                      {player.live?.handCache === 'cache' && <span className="aq-dash-handcache">Cache</span>}
                    </span>
                    <span className="aq-host-player-score">{player.totalScore || 0}</span>
                    <span className={hasSubmitted ? 'aq-status-badge aq-status-submitted' : 'aq-status-badge aq-status-waiting'}>
                      {hasSubmitted ? 'Active' : 'Not Started'}
                    </span>
                  </div>
                  {fresh && <div className="aq-chat-bubble">{player.live.chatMessage.text}</div>}
                  <AqLiveBooksPreview books={player.live?.books} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        className={allSubmitted ? 'aq-btn aq-btn-close aq-btn-close-ready' : 'aq-btn aq-btn-close'}
        onClick={() => AqFirestore.closeRound(roomCode)}
      >
        Close Round {allSubmitted ? '(All Active)' : `(${submittedCount}/${players.length} active)`}
      </button>
    </>
  );
}

function RoundEndScreen({ roomCode, session, players }) {
  const wentOutCount = players.filter(
    (p) => p.rounds?.[session.round]?.inputs?.wentOut === true,
  ).length;
  const isLastRound = session.round >= session.totalRounds;

  return (
    <>
      <div className="aq-host-code-label-small">Room {roomCode}</div>
      <div className="aq-host-round-heading">Round {session.round} Recap</div>

      {wentOutCount !== 1 && (
        <div className="aq-host-warning">
          Warning: {wentOutCount} player{wentOutCount === 1 ? '' : 's'} marked "Went Out" this round (expected exactly 1)
        </div>
      )}

      <div className="aq-host-recap">
        {players.map((player) => {
          const roundData = player.rounds?.[session.round];
          return (
            <div key={player.id} className="aq-host-recap-card">
              <div className="aq-host-recap-name">{player.name}</div>
              {roundData ? (
                <>
                  <div className="aq-host-recap-score">+{roundData.roundScore}</div>
                  <ul className="aq-host-recap-breakdown">
                    {INPUT_LABELS.filter(([key]) => roundData.inputs?.[key]).map(([key, label]) => (
                      <li key={key}>
                        {label}: {roundData.inputs[key]}
                      </li>
                    ))}
                    {roundData.inputs?.wentOut && <li>Went Out</li>}
                  </ul>
                </>
              ) : (
                <div className="aq-host-recap-score aq-host-recap-none">No cards played</div>
              )}
              <div className="aq-host-recap-total">Total: {player.totalScore || 0}</div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="aq-btn aq-btn-advance"
        onClick={() => AqFirestore.advanceRound(roomCode, session.round, session.totalRounds)}
      >
        {isLastRound ? 'Show Final Results' : 'Next Round'}
      </button>
    </>
  );
}

function GameOverScreen({ players }) {
  const winner = players[0];

  return (
    <>
      <div className="aq-host-round-heading">Final Results</div>

      <ul className="aq-host-final-list">
        {players.map((player, index) => (
          <li
            key={player.id}
            className={index === 0 ? 'aq-host-final-row aq-host-final-winner' : 'aq-host-final-row'}
          >
            <span className="aq-host-final-rank">{index + 1}</span>
            <span className="aq-host-final-name">{player.name}</span>
            <span className="aq-host-final-score">{player.totalScore || 0}</span>
          </li>
        ))}
      </ul>

      {winner && <div className="aq-host-winner-banner">{winner.name} wins!</div>}
    </>
  );
}
