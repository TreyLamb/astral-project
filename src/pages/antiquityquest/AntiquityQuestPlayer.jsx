import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AqFirestore } from './aqFirestore';
import {
  AQ_NUMBERS, AQ_TYPES, AQ_COLOR_HEX, WILD, emptyBook, deriveRoundInputs, colorsForType,
  maybeGrowBook, resolveWildBook, sortAntiquityBook, classifyBookLive, isMessageFresh,
} from './aqCards';
import { calculateRoundScore, AQ_POINTS } from './aqScoring';
import AqLiveBooksPreview from './AqLiveBooksPreview';
import AqGemini8v2Theme from './themes/AqGemini8v2Theme';
import './AntiquityQuestPlayer.css';

const CHAT_PRESETS = [
  'Well played!',
  "You're going down!",
  'Nice one!',
  "I'm just getting started...",
  'Uh oh...',
  'GG!',
];

const BOOK_TAG_LABEL = {
  standard: 'Standard', mixed: 'Mixed', dirty: 'Dirty', perfectAntiquity: 'Perfect!', perfectTreasure: 'Perfect!',
};

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
  ['heldTess', 'Held Tess Wynter (unplayed)'],
];

function byScoreDescending(a, b) {
  return (b.totalScore || 0) - (a.totalScore || 0);
}

// Read-only mirror of the host's TV dashboard, reachable from the player's own
// phone via the entry/dashboard tabs — no host controls (Start/Remove/Close/
// Accept/Deny) live here, just the same live status the TV shows. Also owns
// the taunt/chat trigger (only for the viewer's own row — you can't send a
// message "as" someone else) and a 1s tick so chat bubbles expire live even
// without a new Firestore write arriving.
function PlayerDashboardView({
  roomCode, session, players, playerId, chatOpen, onToggleChat, onSendChat,
}) {
  const sorted = [...players].sort(byScoreDescending);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
    if (session.dashboardTheme !== 'classic') {
      return (
        <div className="aq-player-dashboard">
          <div className="aq-player-dash-heading">Round {session.round} of {session.totalRounds}</div>
          <AqGemini8v2Theme
            mode="live"
            skin={session.dashboardTheme || 'tavern'}
            seatCount={session.seatCount || 8}
            players={players}
            seatAssignments={session.seatAssignments || {}}
            wentOutPlayerId={session.wentOutPlayerId}
          />
        </div>
      );
    }
    return (
      <div className="aq-player-dashboard">
        <div className="aq-player-dash-heading">Round {session.round} of {session.totalRounds}</div>
        <ul className="aq-player-dash-list">
          {sorted.map((p) => {
            const hasSubmitted = Boolean(p.rounds?.[session.round]);
            const wentOut = session.wentOutPlayerId === p.id;
            const isMe = p.id === playerId;
            const fresh = isMessageFresh(p.live?.chatMessage);
            return (
              <li key={p.id} className="aq-player-dash-row aq-player-dash-row-tall">
                <div className="aq-player-dash-row-top">
                  <span>
                    {p.name}{wentOut ? ' ★' : ''}
                    {p.live?.handCache === 'cache' && <span className="aq-dash-handcache">Cache</span>}
                  </span>
                  <span>{p.totalScore || 0}</span>
                  <span className={hasSubmitted ? 'aq-status-badge aq-status-submitted' : 'aq-status-badge aq-status-waiting'}>
                    {hasSubmitted ? 'Active' : 'Not Started'}
                  </span>
                  {isMe && (
                    <button type="button" className="aq-chat-icon-btn" onClick={onToggleChat} title="Say something">
                      💬
                    </button>
                  )}
                </div>
                {fresh && <div className="aq-chat-bubble">{p.live.chatMessage.text}</div>}
                {isMe && chatOpen && (
                  <div className="aq-chat-picker">
                    {CHAT_PRESETS.map((line) => (
                      <button key={line} type="button" className="aq-chat-preset" onClick={() => onSendChat(line)}>
                        {line}
                      </button>
                    ))}
                  </div>
                )}
                <AqLiveBooksPreview books={p.live?.books} />
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
                <div className="aq-player-dash-recap-score aq-player-dash-recap-none">No cards played</div>
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
  const [scoreCollapsed, setScoreCollapsed] = useState(false);
  const [heldCollapsed, setHeldCollapsed] = useState(false);
  const [books, setBooks] = useState(() => Array.from({ length: 5 }, emptyBook));
  const [held, setHeld] = useState({
    antiquities: 0, treasures: 0, remingtons: 0, tess: 0,
  });
  const [picker, setPicker] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const sortTimersRef = useRef({});
  const autoSyncTimerRef = useRef(null);
  const lastResetRoundRef = useRef(null);

  useEffect(() => AqFirestore.subscribeSession(roomCode, setSession), [roomCode]);
  useEffect(() => AqFirestore.subscribePlayers(roomCode, setPlayers), [roomCode]);

  // My own player doc, as seen by everyone else — source of truth for
  // hand/cache and chat rather than separate local state, so a reload always
  // reflects whatever was last actually written.
  const myPlayer = players.find((p) => p.id === playerId) ?? null;
  const handCache = myPlayer?.live?.handCache ?? 'hand';

  const currentRound = session?.round ?? null;

  // A new round starting must clear last round's cards — otherwise the very
  // first auto-sync tick of round 2 would silently write round 1's leftover
  // layout as round 2's score with zero user action.
  useEffect(() => {
    if (currentRound == null || lastResetRoundRef.current === currentRound) return;
    lastResetRoundRef.current = currentRound;
    setBooks(Array.from({ length: 5 }, emptyBook));
    setHeld({
      antiquities: 0, treasures: 0, remingtons: 0, tess: 0,
    });
  }, [currentRound]);

  // Went Out is host-controlled now (one slot on the session, not a per-player
  // self-report toggle) — a player's own screen just reflects whatever the
  // host has currently marked, live.
  const wentOut = session?.wentOutPlayerId === playerId;
  const derivedInputs = useMemo(
    () => deriveRoundInputs(books, held, wentOut),
    [books, held, wentOut],
  );
  const scoreResult = useMemo(() => calculateRoundScore(derivedInputs), [derivedInputs]);

  // No Submit button — any change to books/held/wentOut auto-writes after a
  // short idle debounce, both the live dashboard preview and the actual
  // round score. If the round has moved on since this state was built for it,
  // submitRound throws — swallowed silently, there's no user action to
  // report an error against, it's just a stale write that no longer applies.
  useEffect(() => {
    if (!playerId || !currentRound) return undefined;
    clearTimeout(autoSyncTimerRef.current);
    autoSyncTimerRef.current = setTimeout(() => {
      AqFirestore.syncLiveBooks(roomCode, playerId, books);
      AqFirestore.submitRound(roomCode, playerId, currentRound, derivedInputs, scoreResult.total).catch(() => {});
    }, 800);
    return () => clearTimeout(autoSyncTimerRef.current);
  }, [books, held, derivedInputs, scoreResult, roomCode, playerId, currentRound]);

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

  // Colors shouldn't normally mix within an Antiquity book — a book already
  // carrying, say, blue antiquities should default a newly-opened empty slot
  // to blue too, so continuing the same suit is the path of least resistance
  // and picking a different color is always a deliberate tap, not an accident
  // of the picker resetting to the palette's first swatch. Treasures are the
  // opposite: a Perfect Treasure Collection needs 5 DISTINCT colors, so
  // copying a sibling's color here would make the default actively steer
  // toward an accidental duplicate — instead default to the first palette
  // color not already used elsewhere in the book.
  function bookColorFor(bookIndex, slotIndex, type) {
    const siblings = books[bookIndex].filter((c, i) => i !== slotIndex && c && c.type === type);
    if (siblings.length === 0) return undefined;
    if (type === 'treasure') {
      const used = new Set(siblings.map((c) => c.color));
      return colorsForType('treasure').find((c) => !used.has(c));
    }
    return siblings[0].color;
  }

  // A brand-new empty slot has no type of its own to inherit — without this,
  // it always defaulted to 'antiquity' regardless of what the book actually
  // holds, so a Treasure book's next slot would open as Antiquity/Yellow
  // (no antiquity siblings to color-match against) instead of continuing
  // the book's real type.
  function bookTypeFor(bookIndex, slotIndex) {
    const sibling = books[bookIndex].find((c, i) => i !== slotIndex && c);
    return sibling?.type;
  }

  function openPicker(bookIndex, slotIndex) {
    const existing = books[bookIndex][slotIndex];
    const type = existing?.type ?? bookTypeFor(bookIndex, slotIndex) ?? AQ_TYPES[0];
    setPicker({
      bookIndex,
      slotIndex,
      color: existing?.color ?? bookColorFor(bookIndex, slotIndex, type) ?? colorsForType(type)[0],
      type,
      number: existing?.number ?? AQ_NUMBERS[0],
      hasExisting: !!existing,
    });
  }

  // Antiquity/Treasure colors overlap on Blue/Red but aren't identical sets —
  // switching type must drop a color that no longer exists for the new type.
  function changePickerType(type) {
    setPicker((p) => {
      if (colorsForType(type).includes(p.color)) return { ...p, type };
      const match = bookColorFor(p.bookIndex, p.slotIndex, type);
      return { ...p, type, color: match ?? colorsForType(type)[0] };
    });
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

  return (
    <div className="aq-player">
      <div className="aq-player-room-corner">
        Room {roomCode}
        {currentRound ? ` · Round ${currentRound}` : ''}
      </div>

      <div className="aq-player-header-row">
        <div className={`aq-player-score-preview ${scoreCollapsed ? 'aq-score-collapsed' : ''}`}>
          <button
            type="button"
            className="aq-score-tab"
            onClick={() => setScoreCollapsed((c) => !c)}
          >
            {scoreCollapsed
              ? `${scoreResult.total >= 0 ? '+' : ''}${scoreResult.total} — show score`
              : 'Hide score ▲'}
          </button>
          {!scoreCollapsed && (
            <>
              <div className="aq-score-total">{scoreResult.total >= 0 ? '+' : ''}{scoreResult.total}</div>
              <div className="aq-score-caption">Round score</div>
              {wentOut && <div className="aq-score-wentout">★ Went Out (+{AQ_POINTS.wentOut})</div>}
            </>
          )}
        </div>

        {playerId && (
          <div className="aq-handcache-toggle">
            <button
              type="button"
              className={`aq-handcache-btn ${handCache === 'hand' ? 'aq-handcache-active' : ''}`}
              onClick={() => AqFirestore.setHandCache(roomCode, playerId, 'hand')}
            >
              In Hand
            </button>
            <button
              type="button"
              className={`aq-handcache-btn ${handCache === 'cache' ? 'aq-handcache-active' : ''}`}
              onClick={() => AqFirestore.setHandCache(roomCode, playerId, 'cache')}
            >
              In Cache
            </button>
          </div>
        )}
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
        session && (
          <PlayerDashboardView
            roomCode={roomCode}
            session={session}
            players={players}
            playerId={playerId}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((o) => !o)}
            onSendChat={(text) => {
              AqFirestore.sendChatMessage(roomCode, playerId, text);
              setChatOpen(false);
            }}
          />
        )
      ) : (
      <>
      {!playerId && (
        <div className="aq-player-locked">
          You&apos;re not recognized in this game. Please rejoin from the Join screen.
        </div>
      )}

      <div className="aq-player-books">
        {books.map((book, bi) => {
          const resolved = resolveWildBook(book);
          const liveTag = classifyBookLive(book);
          return (
            <div className="aq-book" key={bi}>
              <div className="aq-book-header">
                <div className="aq-book-label">Book {bi + 1}</div>
                {liveTag && (
                  <div className={`aq-book-tag aq-book-tag-${liveTag}`}>{BOOK_TAG_LABEL[liveTag]}</div>
                )}
              </div>
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

      <div className={`aq-player-section ${heldCollapsed ? 'aq-section-collapsed' : ''}`}>
        <button
          type="button"
          className="aq-score-tab"
          onClick={() => setHeldCollapsed((c) => !c)}
        >
          {heldCollapsed ? 'Held / unplayed — show ▼' : 'Held / unplayed — hide ▲'}
        </button>
        {!heldCollapsed && (
          <>
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
            <Stepper
              label="Tess Wynter held"
              hint={`−${AQ_POINTS.tess} each`}
              value={held.tess}
              onChange={(v) => setHeld((h) => ({ ...h, tess: v }))}
            />
          </>
        )}
      </div>

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
