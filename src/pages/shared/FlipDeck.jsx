import { useState, useEffect, useCallback, useRef } from 'react';
import './FlipDeck.css';

/**
 * One flashcard surface for every deck in TKB and AFROTC, modelled on Gemini Notebook's flashcards
 * (Trey, 2026-10-30: "a background, with a flashcard on foreground, that flips if i flip it").
 *
 * The deck is a list the parent owns; this component owns position, flip and the session tally.
 * Card shape: { id, front, back, note?, label?, frontImg?, frontImgAlt?, credit? }, or pass
 * renderFront / renderBack for faces that are not plain text (an insignia, a vocab entry).
 *
 * Remount it (key) when the deck changes: a position carried over from a different deck is wrong.
 */
export default function FlipDeck({
  cards,
  tally = true,
  isFlagged,
  onToggleFlag,
  onReshuffle,
  renderFront,
  renderBack,
  onIndexChange,
  doneExtra,
  emptyText = 'No cards to show.',
}) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState({});
  const [done, setDone] = useState(false);
  const touch = useRef(null);
  const card = cards[i];

  useEffect(() => { onIndexChange?.(i); }, [i, onIndexChange]);

  const go = useCallback((d) => {
    setFlipped(false);
    const n = i + d;
    if (n >= cards.length) setDone(true);
    else setI(Math.max(0, n));
  }, [i, cards.length]);

  const mark = useCallback((v) => {
    if (!card) return;
    setMarks((m) => ({ ...m, [card.id]: v }));
    go(1);
  }, [card, go]);

  const again = useCallback(() => {
    setI(0); setFlipped(false); setMarks({}); setDone(false);
    onReshuffle?.();
  }, [onReshuffle]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return;
      if (done) { if (e.key === 'r' || e.key === 'R') again(); return; }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (tally && (e.key === 'x' || e.key === 'X')) mark('wrong');
      else if (tally && (e.key === 'c' || e.key === 'C')) mark('right');
      else if (onToggleFlag && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); onToggleFlag(card); }
      else if (onReshuffle && (e.key === 'r' || e.key === 'R')) again();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, go, mark, again, tally, onToggleFlag, onReshuffle, card]);

  if (!cards.length) return <div className="fd-stage"><p className="fd-empty">{emptyText}</p></div>;

  const right = Object.values(marks).filter((v) => v === 'right').length;
  const wrong = Object.values(marks).filter((v) => v === 'wrong').length;

  if (done) {
    return (
      <div className="fd-stage">
        <div className="fd-card fd-done">
          <div className="fd-face fd-done-face">
            <h3>Deck complete</h3>
            <p>{cards.length} card{cards.length === 1 ? '' : 's'}{tally && (right || wrong) ? ` · ${right} ✓ · ${wrong} ✗` : ''}</p>
            {doneExtra}
            <button type="button" className="fd-again" onClick={again}>Run again <kbd>R</kbd></button>
          </div>
        </div>
      </div>
    );
  }

  const flagged = isFlagged?.(card.id);
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="fd-stage">
      <p className="fd-hint">Press “Space” to flip, “← / →” to navigate{tally ? ', X / C to mark' : ''}</p>
      <div
        className="fd-card"
        onClick={(e) => { if (!e.target.closest('button, a')) setFlipped((f) => !f); }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Card back. Tap to see the front.' : 'Card front. Tap to see the answer.'}
      >
        <div key={card.id + ':' + i} className={'fd-inner' + (flipped ? ' fd-flipped' : '')}>
          <div className="fd-face fd-front" aria-hidden={flipped}>
            <Top i={i} n={cards.length} label={card.label} flagged={flagged} onFlag={onToggleFlag && (() => onToggleFlag(card))} />
            <div className="fd-body">
              {renderFront ? renderFront(card) : (
                <>
                  {card.frontImg && (
                    <figure className="fd-img">
                      <img src={card.frontImg} alt={card.frontImgAlt || ''} />
                      {card.credit && <figcaption>{card.credit}</figcaption>}
                    </figure>
                  )}
                  <p className={'fd-text' + (card.frontImg ? ' fd-text-sm' : '')}>{card.front}</p>
                </>
              )}
            </div>
            <span className="fd-see">See answer</span>
          </div>
          <div className="fd-face fd-back" aria-hidden={!flipped}>
            <Top i={i} n={cards.length} label={card.label} flagged={flagged} onFlag={onToggleFlag && (() => onToggleFlag(card))} />
            <div className="fd-body">
              {renderBack ? renderBack(card) : (
                <>
                  <p className={'fd-text' + (String(card.back).length > 140 ? ' fd-text-sm' : '')}>{card.back}</p>
                  {card.note && <p className="fd-note">{card.note}</p>}
                </>
              )}
            </div>
            <span className="fd-see">See question</span>
          </div>
        </div>
      </div>

      <div className="fd-controls">
        <button type="button" className="fd-round" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous card">←</button>
        {tally && (
          <>
            <button type="button" className="fd-pill fd-wrong" onClick={() => mark('wrong')} aria-label={`Didn't know it (${wrong})`}>✗ <span>{wrong}</span></button>
            <button type="button" className="fd-pill fd-right" onClick={() => mark('right')} aria-label={`Knew it (${right})`}><span>{right}</span> ✓</button>
          </>
        )}
        <button type="button" className="fd-round fd-next" onClick={() => go(1)} aria-label="Next card">→</button>
      </div>
      <div className="fd-progress"><i style={{ width: `${((i + 1) / cards.length) * 100}%` }} /></div>
    </div>
  );
}

function Top({ i, n, label, flagged, onFlag }) {
  return (
    <div className="fd-top">
      <span>{i + 1} / {n}{label ? ` · ${label}` : ''}</span>
      {onFlag && (
        <button type="button" className={'fd-flag' + (flagged ? ' on' : '')} onClick={onFlag} aria-pressed={!!flagged} title={flagged ? 'Remove flag (F)' : 'Flag this card (F)'}>⚑</button>
      )}
    </div>
  );
}
