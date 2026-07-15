import { useState } from 'react';
import {
  AQ_COLOR_HEX, WILD, resolveWildBook, classifyBook, classifyBookLive, isMessageFresh,
} from '../aqCards';
import './AqGemini8v2Theme.css';

const BOOK_TAG_LABEL = {
  standard: 'Standard', mixed: 'Mixed', dirty: 'Dirty', perfectAntiquity: 'Perfect!', perfectTreasure: 'Perfect!',
};

// One accent color per seat, cycled if there are ever more seats than colors
// (shouldn't happen at the game's real 4-8 player range). Keyed by `skin`
// since Tavern's gold/gem palette reads oddly against the sci-fi neon set.
const SEAT_COLOR_PALETTES = {
  gemini8v2: ['#ffca28', '#ff9800', '#cddc39', '#10b981', '#ec4899', '#9c27b0', '#f43f5e', '#06b6d4'],
  tavern: ['#e0b400', '#10b981', '#2f6fd6', '#d6392f', '#8b5cf6', '#b87333', '#ec4899', '#c7cad1'],
};

function byScoreDescending(a, b) {
  return (b.totalScore || 0) - (a.totalScore || 0);
}

// Fallback when a session predates the "how many players?" step and has no
// `seatCount` of its own — the physical game's real max chair count. Seat
// *positions* are always computed against the declared total (see the angle
// math below) so a player placed at "seat 5" always renders at that same
// physical spot, matching how the host actually arranged the real table.
// Never renumbered/recentered just because fewer than `seatCount` are seated.
const MAX_SEATS = 8;

// Fewer occupied seats (relative to the table's own declared size) means
// more room per seat — the whole seat pod (cards, name, badges) scales up,
// so an under-filled test game still reads as deliberately framed rather
// than sparse. 1.15 is the flat "everything 15% bigger" baseline when the
// table is at its own declared capacity.
function seatScale(occupiedCount, totalSeats) {
  return Math.min(1.6, 1.15 + Math.max(0, totalSeats - occupiedCount) * 0.05);
}

function renderMiniCard(card, idx, resolved) {
  const isWild = card.type === 'antiquity' && card.number === WILD;
  const shown = isWild ? resolved[idx]?.resolvedNumber : card.number;
  return (
    <div
      key={idx}
      className="aq-g8-mini-card"
      style={{ backgroundColor: AQ_COLOR_HEX[card.color] || '#888' }}
    >
      {card.type === 'antiquity' ? (isWild ? `W${shown ?? ''}` : shown) : ''}
    </div>
  );
}

// A closed book (all slots filled) stops showing every card and instead
// shows a small, classification-specific preview — matching the physical
// game's own convention that a completed collection "locks in" as a single
// visual unit rather than staying spread out:
//  - Perfect Antiquity: the 1 and 5 cards (bookends of the full run)
//  - Perfect Treasure: two of its (up to 5) distinct colors
//  - Mixed: one antiquity number card + one treasure card
//  - Standard (single-suit antiquity, or a treasure set with a repeat color): one card
//  - Anything else (closed but not a valid collection shape): first card, as a fallback
function closedPreview(cards, resolved) {
  const classification = classifyBook(cards);
  const withIdx = cards.map((c, i) => (c ? { card: c, idx: i } : null)).filter(Boolean);
  const antiquities = withIdx.filter((x) => x.card.type === 'antiquity');
  const treasures = withIdx.filter((x) => x.card.type === 'treasure');

  if (classification === 'perfectAntiquity') {
    const one = antiquities.find((x) => resolved[x.idx]?.resolvedNumber === 1);
    const five = antiquities.find((x) => resolved[x.idx]?.resolvedNumber === 5);
    return [one, five].filter(Boolean);
  }
  if (classification === 'perfectTreasure') {
    const seen = new Set();
    const picks = [];
    treasures.forEach((x) => {
      if (!seen.has(x.card.color) && picks.length < 2) { seen.add(x.card.color); picks.push(x); }
    });
    return picks;
  }
  if (classification === 'mixed') {
    return [antiquities[0], treasures[0]].filter(Boolean);
  }
  if (classification === 'standard') {
    return [antiquities[0] || treasures[0]].filter(Boolean);
  }
  return withIdx.slice(0, 1);
}

function SeatCards({ books }) {
  if (!books || books.length === 0) return null;
  const stacks = books
    .map((wrapped) => wrapped?.cards || [])
    .filter((cards) => cards.some(Boolean));
  if (stacks.length === 0) return null;

  return (
    <div className="aq-g8-cards-pool">
      {stacks.map((cards, si) => {
        // Mirrors classifyBook's own "complete" threshold (5+ filled cards) rather
        // than requiring every slot filled — a completed Mixed Collection keeps one
        // extra open slot appended for further additions (see maybeGrowBook in
        // aqCards.js), so `cards.every(Boolean)` would never be true for one and it
        // would never show the reduced closed-preview below.
        const closed = cards.filter(Boolean).length >= 5;
        const resolved = resolveWildBook(cards);
        const liveTag = classifyBookLive(cards);
        return (
          <div className="aq-g8-card-stack" key={si}>
            {closed ? (
              <>
                <div className="aq-g8-closed-label">CLOSED</div>
                {closedPreview(cards, resolved).map(({ card, idx }) => renderMiniCard(card, idx, resolved))}
              </>
            ) : (
              <>
                {liveTag && (
                  <div className={`aq-g8-book-tag aq-g8-book-tag-${liveTag}`}>{BOOK_TAG_LABEL[liveTag]}</div>
                )}
                {cards.map((card, ci) => card && renderMiniCard(card, ci, resolved))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeatPlayer({
  player, wentOut, interactive, onWentOutClick,
}) {
  const fresh = isMessageFresh(player.live?.chatMessage);
  return (
    <>
      <div
        className={`aq-g8-player-info ${wentOut ? 'aq-g8-wentout' : ''} ${interactive ? 'aq-g8-clickable' : ''}`}
        onClick={interactive ? () => onWentOutClick(player.id) : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {wentOut ? '★ ' : ''}{player.name}
        {player.live?.handCache === 'cache' && <span className="aq-g8-cache-badge">Cache</span>}
      </div>
      {fresh && <div className="aq-g8-chat-bubble">{player.live.chatMessage.text}</div>}
      <SeatCards books={player.live?.books} />
    </>
  );
}

// A live-data-bound port of dashboardchoices/gemini8v2.html — same round-
// table visual language, laid out over MAX_SEATS fixed physical chair
// positions (see above) rather than the mockup's hardcoded pixel positions.
// 'live' only draws the chairs that actually got someone seated, each still
// scaled up when fewer are occupied so a 1-2 player test session still reads
// as a deliberately-framed table rather than a mostly-empty 8-seat one. Two
// render modes share this one component (and its seat geometry) rather than
// duplicating it: 'live' shows the real in-progress game (host TV + the
// player's own mirrored Dashboard tab), 'assign' is the setup-time seat
// picker the host uses to arrange joined players around the table before
// Start Game.
export default function AqGemini8v2Theme({
  mode = 'live',
  skin = 'gemini8v2',
  seatCount = MAX_SEATS,
  players,
  seatAssignments = {},
  wentOutPlayerId,
  onWentOutClick,
  onSeatChange,
}) {
  const [openSeat, setOpenSeat] = useState(null);

  const seatColors = SEAT_COLOR_PALETTES[skin] || SEAT_COLOR_PALETTES.gemini8v2;

  // 'assign' always offers every chair the host declared when creating the
  // game (see AntiquityQuestApp.jsx's "how many players?" step) so they can
  // place people to match the actual room, regardless of join order or how
  // many have joined so far. 'live' only renders chairs that actually got
  // someone seated — each still drawn at its own fixed position (see the
  // angle math below), not renumbered/compacted, so a player placed at
  // "seat 5" during setup stays at that same physical spot on the table.
  const seatEntries = mode === 'assign'
    ? Array.from({ length: seatCount }, (_, i) => ({
      index: i,
      player: players.find((p) => p.id === seatAssignments[i]) || null,
    }))
    : Object.entries(seatAssignments)
      .map(([idx, pid]) => ({ index: Number(idx), player: players.find((p) => p.id === pid) || null }))
      .filter((s) => s.player);

  const scale = mode === 'assign' ? seatScale(seatCount, seatCount) : seatScale(Math.max(seatEntries.length, 1), seatCount);
  const seatedIds = new Set(Object.values(seatAssignments));
  const unassigned = players.filter((p) => !seatedIds.has(p.id));
  const sortedForBoard = [...players].sort(byScoreDescending);

  return (
    <div className={`aq-g8-table aq-g8-skin-${skin}`}>
      {mode === 'assign' && unassigned.length > 0 && (
        <div className="aq-g8-unassigned-banner">
          Unassigned: {unassigned.map((p) => p.name).join(', ')}
        </div>
      )}

      {mode === 'live' && (
        <div className="aq-g8-leaderboard">
          <table className="aq-g8-leaderboard-table">
            <thead><tr><th>Player</th><th>Score</th></tr></thead>
            <tbody>
              {sortedForBoard.map((p) => (
                <tr key={p.id} className={wentOutPlayerId === p.id ? 'aq-g8-lb-wentout' : ''}>
                  <td>{wentOutPlayerId === p.id ? '★ ' : ''}{p.name}</td>
                  <td>{p.totalScore || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seatEntries.map(({ index: seatIndex, player }) => {
        // Evenly spaced around an ellipse of `seatCount` fixed positions,
        // starting at the bottom-center seat (angle = 90°) and going
        // clockwise — a given seat index always lands at the same spot on
        // the table regardless of how many seats are actually occupied.
        const angle = (Math.PI / 2) + ((2 * Math.PI * seatIndex) / seatCount);
        const left = 50 + 38 * Math.cos(angle);
        const top = 50 + 36 * Math.sin(angle);
        const color = seatColors[seatIndex % seatColors.length];
        const style = {
          left: `${left}%`,
          top: `${top}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        };

        return (
          <div className="aq-g8-player-area" style={style} key={seatIndex}>
            {mode === 'assign' ? (
              player ? (
                <button
                  type="button"
                  className="aq-g8-seat-btn aq-g8-seat-filled"
                  onClick={() => onSeatChange(seatIndex, null)}
                  title="Tap to unassign"
                >
                  {player.name} ×
                </button>
              ) : (
                <div className="aq-g8-seat-wrap">
                  <button
                    type="button"
                    className="aq-g8-seat-btn aq-g8-seat-empty"
                    onClick={() => setOpenSeat((s) => (s === seatIndex ? null : seatIndex))}
                  >
                    + Empty seat
                  </button>
                  {openSeat === seatIndex && (
                    <div className="aq-g8-seat-picker">
                      {unassigned.length === 0 ? (
                        <div className="aq-g8-seat-picker-empty">No unassigned players</div>
                      ) : unassigned.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="aq-g8-seat-picker-option"
                          onClick={() => { onSeatChange(seatIndex, p.id); setOpenSeat(null); }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={{ color }}>
                <SeatPlayer
                  player={player}
                  wentOut={wentOutPlayerId === player.id}
                  interactive={!!onWentOutClick}
                  onWentOutClick={onWentOutClick}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
