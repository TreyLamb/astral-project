import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAfoqt } from '../AfoqtApp';
import { allWords } from '../engine/words';
import { todayStr } from '../afoqtStorage';
import {
  WORDS_PER_DAY, NEW_PASSES, WINDOW_DAYS,
  introduceDay, addMore, buildSession, allDeck, introducedIds, idsForDay, remainingCount,
} from '../engine/cards';

/**
 * Fast vocabulary flashcards. Trey's spec, 2026-09-04: "This is all fast flash cards. No wrong or
 * right. Just next or back. One tap. No multiple tap to select and then confirm or whatever."
 *
 * So there is deliberately no grading control anywhere on this screen - no again/good/easy, no
 * self-rating, no confirm step. Tapping the card flips it; Next and Back move. That is the entire
 * interaction, and every temptation to add "how well did you know it?" has to be resisted: the
 * drill already measures him, and a deck that also judges him is a deck he stops opening. The
 * ASVAB deck died of exactly that.
 *
 * All the day/window logic is in engine/cards.js and tested there. This file only renders.
 */
export default function CardsView() {
  const { progress, mutate } = useAfoqt();
  const pool = useMemo(() => allWords(), []);
  const today = todayStr();

  // Today's words are introduced on mount, once. `introduceDay` is idempotent per day, so a
  // re-mount or a second visit cannot hand out another thirty - see its own test.
  useEffect(() => {
    mutate((p) => introduceDay(p, pool, today));
  }, [mutate, pool, today]);

  const [deck, setDeck] = useState('daily');       // 'daily' | 'all'
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);       // is the back of THIS card showing
  const [addCount, setAddCount] = useState(10);

  const byId = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);
  const session = useMemo(() => buildSession(progress, today), [progress, today]);
  const full = useMemo(() => allDeck(progress, today), [progress, today]);
  const queue = deck === 'daily' ? session : full.map((id) => ({ id, phase: 'all', pass: null }));

  const card = queue[idx] ?? null;
  const word = card ? byId.get(card.id) : null;

  // Reset to the front whenever the card changes - a flipped card carrying its state onto the
  // next word would show the answer before the question.
  const cardKey = card ? `${deck}:${idx}:${card.id}` : null;
  const lastKey = useRef(null);
  if (lastKey.current !== cardKey) { lastKey.current = cardKey; if (shown) setShown(false); }

  const go = useCallback((delta) => {
    setIdx((i) => Math.max(0, Math.min(queue.length - 1, i + delta)));
  }, [queue.length]);

  const switchDeck = (which) => { setDeck(which); setIdx(0); setShown(false); };

  // Keyboard on desktop, same one-action-per-key rule: nothing here needs a modifier or a confirm.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); setShown((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const introduced = introducedIds(progress).length;
  const todayCount = idsForDay(progress, today).length;
  const left = remainingCount(pool, progress);

  const phaseLabel = !card ? ''
    : card.phase === 'new' ? `New words — pass ${card.pass} of ${NEW_PASSES}`
      : card.phase === 'mixed' ? `Mixed review — last ${WINDOW_DAYS} days`
        : `Full deck — every word you have met`;

  if (!introduced) {
    return (
      <div className="afq-wrap">
        <h2>Word cards</h2>
        <p className="afq-note">No words yet. There is nothing in the pool to introduce.</p>
      </div>
    );
  }

  return (
    <div className="afq-cards">
      <header className="afq-cards-top">
        <div className="afq-cards-decks">
          <button
            className={'afq-btn' + (deck === 'daily' ? ' afq-primary' : ' afq-ghost')}
            onClick={() => switchDeck('daily')}
          >
            Today
          </button>
          <button
            className={'afq-btn' + (deck === 'all' ? ' afq-primary' : ' afq-ghost')}
            onClick={() => switchDeck('all')}
            title="Every word you have ever been introduced to, shuffled - for a mass review"
          >
            All {introduced}
          </button>
        </div>
        <span className="afq-cards-phase">{phaseLabel}</span>
        <span className="afq-cards-count">{queue.length ? idx + 1 : 0} / {queue.length}</span>
      </header>

      <div className="afq-cards-bar">
        <div className="afq-cards-bar-fill" style={{ width: queue.length ? `${((idx + 1) / queue.length) * 100}%` : '0%' }} />
      </div>

      {card && word ? (
        <>
          {/* The card itself is the flip control. One tap, whole surface, no confirm. */}
          <button className={'afq-card' + (shown ? ' afq-card-open' : '')} onClick={() => setShown((v) => !v)}>
            <span className="afq-card-word">{word.word.toUpperCase()}</span>
            {shown ? (
              <span className="afq-card-back">
                <span className="afq-card-pos">{word.pos}</span>
                <span className="afq-card-gloss">{word.gloss}</span>
                {word.sentence && <span className="afq-card-sentence">{word.sentence}</span>}
                {word.root && (
                  <span className="afq-card-root">
                    <strong>{word.root.form}</strong> — {word.root.sense}
                  </span>
                )}
                <span className="afq-card-confusable">
                  not <strong>{word.confusable.word}</strong>, which means {word.confusable.meaning}
                </span>
              </span>
            ) : (
              <span className="afq-card-hint">tap to show</span>
            )}
          </button>

          <div className="afq-cards-nav">
            <button className="afq-cards-move" onClick={() => go(-1)} disabled={idx === 0} aria-label="Back">‹ Back</button>
            <button
              className="afq-cards-move afq-cards-next"
              onClick={() => go(1)}
              disabled={idx >= queue.length - 1}
              aria-label="Next"
            >
              Next ›
            </button>
          </div>
        </>
      ) : (
        <div className="afq-card afq-card-done">
          <span className="afq-card-word">Done</span>
          <span className="afq-card-gloss">
            {deck === 'daily'
              ? 'That is today’s review. Add more words below, or switch to the full deck.'
              : 'That is every word you have met.'}
          </span>
        </div>
      )}

      <footer className="afq-cards-foot">
        <div className="afq-row afq-wrap-row">
          <span className="afq-cards-stat">{todayCount} new today</span>
          <span className="afq-cards-stat">{introduced} met</span>
          <span className="afq-cards-stat">{left} left in the pool</span>
        </div>
        {/* "On any day if I decide I need more words I want a button to add x new words." They join
            today's batch, so they get the three new-word passes too - and tomorrow is untouched. */}
        <div className="afq-row afq-wrap-row afq-cards-add">
          <label className="afq-cards-addlabel">
            Add
            <input
              type="number" min="1" max="100" value={addCount}
              onChange={(e) => setAddCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            />
            new words
          </label>
          <button
            className="afq-btn afq-primary"
            disabled={left === 0}
            onClick={() => { mutate((p) => addMore(p, pool, today, addCount)); setIdx(0); setShown(false); setDeck('daily'); }}
          >
            {left === 0 ? 'Pool exhausted' : `Add ${addCount}`}
          </button>
          <span className="afq-note afq-cards-addnote">
            Tomorrow still gets {WORDS_PER_DAY}. Adding now does not change that.
          </span>
        </div>
      </footer>
    </div>
  );
}
