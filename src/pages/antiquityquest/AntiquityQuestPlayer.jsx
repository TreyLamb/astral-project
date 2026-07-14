import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AqFirestore } from './aqFirestore';
import {
  AQ_NUMBERS, AQ_TYPES, AQ_COLOR_HEX, WILD, emptyBook, deriveRoundInputs, colorsForType,
  maybeGrowBook, resolveWildBook, sortAntiquityBook,
} from './aqCards';
import { calculateRoundScore, AQ_POINTS } from './aqScoring';
import './AntiquityQuestPlayer.css';

function swatchStyle(name) {
  return { backgroundColor: AQ_COLOR_HEX[name] || '#888' };
}

function CardPicker({
  draft, canClear, onColor, onType, onNumber, onConfirm, onClear, onCancel,
}) {
  return (
    <div className="aq-picker-backdrop" onClick={onCancel}>
      <div className="aq-picker" onClick={(e) => e.stopPropagation()}>
        <div className="aq-picker-section">
          <div className="aq-picker-section-label">Color</div>
          <div className="aq-picker-row">
            {colorsForType(draft.type).map((color) => (
              <button
                type="button"
                key={color}
                className={`aq-picker-swatch ${draft.color === color ? 'aq-picker-selected' : ''}`}
                style={swatchStyle(color)}
                onClick={() => onColor(color)}
              >
                {color[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="aq-picker-section">
          <div className="aq-picker-section-label">Type</div>
          <div className="aq-picker-row">
            {AQ_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                className={`aq-picker-type ${draft.type === type ? 'aq-picker-selected' : ''}`}
                onClick={() => onType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {draft.type === 'antiquity' && (
          <div className="aq-picker-section">
            <div className="aq-picker-section-label">Number</div>
            <div className="aq-picker-row">
              {AQ_NUMBERS.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`aq-picker-number ${draft.number === n ? 'aq-picker-selected' : ''}`}
                  onClick={() => onNumber(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className={`aq-picker-number aq-picker-wild ${draft.number === WILD ? 'aq-picker-selected' : ''}`}
                onClick={() => onNumber(WILD)}
                title="Wild — automatically stands in for whichever number is still missing in this book"
              >
                W
              </button>
            </div>
          </div>
        )}

        <div className="aq-picker-actions">
          {canClear && (
            <button type="button" className="aq-btn aq-picker-clear" onClick={onClear}>Clear</button>
          )}
          <button type="button" className="aq-btn aq-picker-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="aq-btn aq-picker-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

const RECAP_LABELS = [
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

// Read-only mirror of the host's TV dashboard, reachable from the player's own
// phone via the entry/dashboard tabs — no host controls (Start/Remove/Close/
// Accept/Deny) live here, just the same live status the TV shows.
function PlayerDashboardView({ roomCode, session, players }) {
  const sorted = [...players].sort(byScoreDescending);

  if (session.status === 'setup') {
    return (
      <div className="aq-player-dashboard">
        <div className="aq-player-dash-heading">Room {roomCode} · Waiting for host to start</div>
        <ul className="aq-player-dash-list">
          {sorted.map((p) => <li key={p.id}>{p.name}</li>)}
        </ul>
      </div>
    );
  }

  if (session.status === 'playing') {
    return (
      <div className="aq-player-dashboard">
        <div className="aq-player-dash-heading">Round {session.round} of {session.totalRounds}</div>
        <ul className="aq-player-dash-list">
          {sorted.map((p) => {
            const hasSubmitted = Boolean(p.rounds?.[session.round]);
            const wentOut = session.wentOutPlayerId === p.id;
            return (
              <li key={p.id} className="aq-player-dash-row">
                <span>{p.name}{wentOut ? ' ★' : ''}</span>
                <span>{p.totalScore || 0}</span>
                <span className={hasSubmitted ? 'aq-status-badge aq-status-submitted' : 'aq-status-badge aq-status-waiting'}>
                  {hasSubmitted ? 'Submitted' : 'Waiting'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (session.status === 'round_end') {
    return (
      <div className="aq-player-dashboard">
        <div className="aq-player-dash-heading">Round {session.round} Recap</div>
        {sorted.map((p) => {
          const roundData = p.rounds?.[session.round];
          return (
            <div key={p.id} className="aq-player-dash-recap-card">
              <div className="aq-player-dash-recap-name">{p.name}</div>
              {roundData ? (
                <>
                  <div className="aq-player-dash-recap-score">+{roundData.roundScore}</div>
                  <ul className="aq-player-dash-recap-breakdown">
                    {RECAP_LABELS.filter(([key]) => roundData.inputs?.[key]).map(([key, label]) => (
                      <li key={key}>{label}: {roundData.inputs[key]}</li>
                    ))}
                    {roundData.inputs?.wentOut && <li>Went Out</li>}
                  </ul>
                </>
              ) : (
                <div className="aq-player-dash-recap-score aq-player-dash-recap-none">Did not submit</div>
              )}
              <div className="aq-player-dash-recap-total">Total: {p.totalScore || 0}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="aq-player-dashboard">
      <div className="aq-player-dash-heading">Final Results</div>
      <ul className="aq-player-dash-list">
        {sorted.map((p, i) => (
          <li key={p.id} className={i === 0 ? 'aq-player-dash-row aq-player-dash-winner' : 'aq-player-dash-row'}>
            <span>{i + 1}. {p.name}</span>
            <span>{p.totalScore || 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stepper({
  label, hint, value, onChange, disabled,
}) {
  return (
    <div className="aq-stepper">
      <div className="aq-stepper-text">
        <span className="aq-stepper-label">{label}</span>
        {hint && <span className="aq-stepper-hint">{hint}</span>}
      </div>
      <div className="aq-stepper-controls">
        <button
          type="button"
          className="aq-stepper-btn"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
        >
          −
        </button>
        <span className="aq-stepper-value">{value}</span>
        <button
          type="button"
          className="aq-stepper-btn"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function AntiquityQuestPlayer() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  // === AQ REJOIN-VALIDATION GUARD — start (do not remove/relocate; owned by
  // the rejoin-validation task, see plan's "Player rejoin" section) ===
  useEffect(() => {
    const raw = localStorage.getItem('aq_player');
    const stored = raw ? JSON.parse(raw) : null;
    const matchesThisRoom = stored != null && stored.roomCode === roomCode;

    // Rooms are never deleted, so a weeks-old (or wrong-room) localStorage entry
    // is a real case, not hypothetical — always verify the room this URL points
    // at is still real and not game_over, even when the stored room code matches
    // (a matching code alone doesn't mean the room is still live).
    let unsubscribe = () => {};
    unsubscribe = AqFirestore.subscribeSession(roomCode, (session) => {
      unsubscribe();
      const sessionInvalid = !session || session.status === 'game_over';

      if (sessionInvalid || !matchesThisRoom) {
        if (stored) localStorage.removeItem('aq_player');
        navigate('/antiquityquest/join');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate]);
  // === AQ REJOIN-VALIDATION GUARD — end ===

  const [playerId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aq_player'))?.playerId ?? null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('entry');
  const [books, setBooks] = useState(() => Array.from({ length: 5 }, emptyBook));
  const [held, setHeld] = useState({ antiquities: 0, treasures: 0, remingtons: 0 });
  const [picker, setPicker] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastSubmittedRound, setLastSubmittedRound] = useState(null);
  const sortTimersRef = useRef({});

  useEffect(() => AqFirestore.subscribeSession(roomCode, setSession), [roomCode]);
  useEffect(() => AqFirestore.subscribePlayers(roomCode, setPlayers), [roomCode]);

  // Auto-sorts a book into 1-5 chronological order (e.g. moves a wild card once
  // it resolves to a new number) only after 5s of no further edits to that
  // specific book, so it never yanks a slot out from under a player mid-pick.
  useEffect(() => () => {
    Object.values(sortTimersRef.current).forEach(clearTimeout);
  }, []);

  function scheduleSort(bookIndex) {
    clearTimeout(sortTimersRef.current[bookIndex]);
    sortTimersRef.current[bookIndex] = setTimeout(() => {
      setBooks((prev) => prev.map((book, bi) => (bi === bookIndex ? sortAntiquityBook(book) : book)));
    }, 5000);
  }

  // Went Out is host-controlled now (one slot on the session, not a per-player
  // self-report toggle) — a player's own screen just reflects whatever the
  // host has currently marked, live.
  const wentOut = session?.wentOutPlayerId === playerId;
  const derivedInputs = useMemo(
    () => deriveRoundInputs(books, held, wentOut),
    [books, held, wentOut],
  );
  const scoreResult = useMemo(() => calculateRoundScore(derivedInputs), [derivedInputs]);

  // Card entry is always a local draft — nothing reaches the shared dashboard
  // until Submit is pressed, so editing is never blocked by round/session status
  // (players can freely plan/experiment). Only submitting a round that's no
  // longer open is guarded, and that's enforced server-side (see the catch in
  // handleSubmit below), not by disabling inputs here.
  const currentRound = session?.round ?? null;
  const isSubmittedForRound = lastSubmittedRound === currentRound;

  function openPicker(bookIndex, slotIndex) {
    const existing = books[bookIndex][slotIndex];
    const type = existing?.type ?? AQ_TYPES[0];
    setPicker({
      bookIndex,
      slotIndex,
      color: existing?.color ?? colorsForType(type)[0],
      type,
      number: existing?.number ?? AQ_NUMBERS[0],
      hasExisting: !!existing,
    });
  }

  // Antiquity/Treasure colors overlap on Blue/Red but aren't identical sets —
  // switching type must drop a color that no longer exists for the new type.
  function changePickerType(type) {
    setPicker((p) => ({
      ...p,
      type,
      color: colorsForType(type).includes(p.color) ? p.color : colorsForType(type)[0],
    }));
  }

  function confirmPicker() {
    setBooks((prev) => prev.map((book, bi) => {
      if (bi !== picker.bookIndex) return book;
      const filled = book.map((card, si) => (
        si !== picker.slotIndex
          ? card
          // Treasures have no number — identity is color alone.
          : { color: picker.color, type: picker.type, number: picker.type === 'antiquity' ? picker.number : null }
      ));
      return maybeGrowBook(filled);
    }));
    scheduleSort(picker.bookIndex);
    setPicker(null);
  }

  function clearPicker() {
    setBooks((prev) => prev.map((book, bi) => (
      bi !== picker.bookIndex
        ? book
        : book.map((card, si) => (si !== picker.slotIndex ? card : null))
    )));
    scheduleSort(picker.bookIndex);
    setPicker(null);
  }

  function addBook() {
    setBooks((prev) => [...prev, emptyBook()]);
  }

  async function handleSubmit() {
    if (!currentRound || !playerId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await AqFirestore.submitRound(roomCode, playerId, currentRound, derivedInputs, scoreResult.total);
      setLastSubmittedRound(currentRound);
    } catch (err) {
      setSubmitError(
        err.message === 'Round already closed'
          ? 'This round was already closed by the host.'
          : 'Could not submit your score. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="aq-player">
      <div className="aq-player-room">
        Room {roomCode}
        {currentRound ? ` · Round ${currentRound}` : ''}
      </div>

      <div className="aq-player-tabs">
        <button
          type="button"
          className={`aq-player-tab ${view === 'entry' ? 'aq-player-tab-active' : ''}`}
          onClick={() => setView('entry')}
        >
          My Cards
        </button>
        <button
          type="button"
          className={`aq-player-tab ${view === 'dashboard' ? 'aq-player-tab-active' : ''}`}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
      </div>

      {view === 'dashboard' ? (
        session && <PlayerDashboardView roomCode={roomCode} session={session} players={players} />
      ) : (
      <>
      {!playerId && (
        <div className="aq-player-locked">
          You&apos;re not recognized in this game. Please rejoin from the Join screen.
        </div>
      )}

      <div className="aq-player-score-preview">
        <div className="aq-score-total">{scoreResult.total >= 0 ? '+' : ''}{scoreResult.total}</div>
        <div className="aq-score-caption">Round score</div>
        {wentOut && <div className="aq-score-wentout">★ Host marked you as Went Out (+{AQ_POINTS.wentOut})</div>}
      </div>

      <div className="aq-player-books">
        {books.map((book, bi) => {
          const resolved = resolveWildBook(book);
          return (
            <div className="aq-book" key={bi}>
              <div className="aq-book-label">Book {bi + 1}</div>
              <div className="aq-book-slots">
                {book.map((card, si) => (
                  <button
                    type="button"
                    key={si}
                    className={card ? 'aq-slot aq-slot-filled' : 'aq-slot aq-slot-empty'}
                    style={card ? swatchStyle(card.color) : undefined}
                    onClick={() => openPicker(bi, si)}
                  >
                    {card ? (
                      <span className="aq-slot-content">
                        {card.number === WILD ? (
                          <span className="aq-slot-number">W({resolved[si].resolvedNumber})</span>
                        ) : card.number != null && (
                          <span className="aq-slot-number">{card.number}</span>
                        )}
                        <span className="aq-slot-type">{card.type[0].toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="aq-slot-plus">+</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <button type="button" className="aq-btn aq-add-book" onClick={addBook}>
          + Add Book
        </button>
      </div>

      <div className="aq-player-section">
        <div className="aq-section-title">Held / unplayed</div>
        <Stepper
          label="Antiquities held"
          hint={`−${AQ_POINTS.antiquity} each`}
          value={held.antiquities}
          onChange={(v) => setHeld((h) => ({ ...h, antiquities: v }))}
        />
        <Stepper
          label="Treasures held"
          hint={`−${AQ_POINTS.treasure} each`}
          value={held.treasures}
          onChange={(v) => setHeld((h) => ({ ...h, treasures: v }))}
        />
        <Stepper
          label="Remingtons held"
          hint={`−${AQ_POINTS.remington} each`}
          value={held.remingtons}
          onChange={(v) => setHeld((h) => ({ ...h, remingtons: v }))}
        />
      </div>

      {submitError && <div className="aq-player-error">{submitError}</div>}
      {isSubmittedForRound && !submitError && (
        <div className="aq-player-confirmed">
          Submitted! You can keep editing and resubmit anytime before the round closes.
        </div>
      )}

      <button
        type="button"
        className="aq-btn aq-submit"
        onClick={handleSubmit}
        disabled={submitting || !currentRound || !playerId}
      >
        {submitting ? 'Submitting…' : isSubmittedForRound ? 'Resubmit' : 'Submit'}
      </button>

      {picker && (
        <CardPicker
          draft={picker}
          canClear={picker.hasExisting}
          onColor={(color) => setPicker((p) => ({ ...p, color }))}
          onType={changePickerType}
          onNumber={(number) => setPicker((p) => ({ ...p, number }))}
          onConfirm={confirmPicker}
          onClear={clearPicker}
          onCancel={() => setPicker(null)}
        />
      )}
      </>
      )}
    </div>
  );
}
