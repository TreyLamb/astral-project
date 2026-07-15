import { AQ_COLOR_HEX, WILD, resolveWildBook } from './aqCards';

// Read-only summary of a player's in-progress books, shared by the host
// dashboard and a player's own "Dashboard" tab view of other players — a
// book with no empty slots left collapses to "CLOSED" instead of showing its
// cards (mirrors the physical rule that a completed collection locks in).
export default function AqLiveBooksPreview({ books }) {
  if (!books || books.length === 0) return null;

  return (
    <div className="aq-live-books">
      {books.map((wrapped, bi) => {
        const cards = wrapped?.cards || [];
        // Mirrors classifyBook's own "complete" threshold (5+ filled cards) rather
        // than requiring every slot filled — a completed Mixed Collection keeps one
        // extra open slot appended for further additions (see maybeGrowBook in
        // aqCards.js), so `cards.every(Boolean)` would never be true for one.
        const closed = cards.filter(Boolean).length >= 5;
        const resolved = resolveWildBook(cards);
        return (
          <div className="aq-live-book" key={bi}>
            {closed ? (
              <div className="aq-live-book-closed">CLOSED</div>
            ) : (
              <div className="aq-live-book-slots">
                {cards.map((card, si) => (card ? (
                  <div
                    key={si}
                    className="aq-live-mini-card"
                    style={{ backgroundColor: AQ_COLOR_HEX[card.color] || '#888' }}
                  >
                    {card.type === 'antiquity'
                      ? (card.number === WILD ? `W${resolved[si].resolvedNumber}` : card.number)
                      : ''}
                  </div>
                ) : null))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
