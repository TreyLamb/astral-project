import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { allWords } from '../engine/words';
import { todayStr } from '../afoqtStorage';
import { TEST_LEVEL_BAND } from '../engine/afoqtSpec';
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
/** Same seeded shuffle engine/cards.js uses, so the speed deck is stable across re-renders too. */
function shuffleIds(ids, seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function CardsView() {
  const { progress, mutate } = useAfoqt();
  const pool = useMemo(() => allWords(), []);
  const today = todayStr();

  // Today's words are introduced on mount, once. `introduceDay` is idempotent per day, so a
  // re-mount or a second visit cannot hand out another thirty - see its own test.
  useEffect(() => {
    mutate((p) => introduceDay(p, pool, today));
  }, [mutate, pool, today]);

  // `?deck=speed` is how DrillConfig hands off the low-band speed run, and `?deck=bank` is the
  // whole-bank speed run. Read once on mount; anything unrecognised falls back to the daily drip.
  const [params] = useSearchParams();
  const [deck, setDeck] = useState(() => {
    const want = params.get('deck');
    return ['daily', 'bank', 'all', 'speed'].includes(want) ? want : 'daily';
  });
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);       // is the back of THIS card showing
  const [addCount, setAddCount] = useState(10);
  // Bank-deck band filter. 535 cards is a long walk in one direction, and Trey's own tier
  // ranking (docs/afoqt/WORD-BANK-EXPANSION.md) says bands 4-5 are the material worth learning
  // and bands 2-3 are speed practice - so "which bands" is the one cut that matters here.
  const [bands, setBands] = useState('all');

  const byId = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);
  const session = useMemo(() => buildSession(progress, today), [progress, today]);
  const full = useMemo(() => allDeck(progress, today), [progress, today]);
  // THE SPEED DECK. Trey, 2026-09-05: "the lower bands were supposed to have their own flash card
  // style speed run." Bands below test level, straight from the word registry rather than from
  // what has been introduced - the whole point is that he already knows these, so gating them
  // behind the daily drip would defeat the exercise. No scoring, same one-tap walk.
  const speedIds = useMemo(
    () => pool.filter((w) => w.band < TEST_LEVEL_BAND).map((w) => w.id),
    [pool],
  );
  const speedDeck = useMemo(() => shuffleIds(speedIds, `speed:${today}`), [speedIds, today]);

  // THE WHOLE BANK. Trey, 2026-09-09: "I want the CARDS drill to be full of the bank so i can
  // speed run through it." Every other deck here is gated on what the daily drip has handed out,
  // which at 30/day meant the 535-word registry would take eighteen days to become reachable.
  // This one ignores introduction entirely and shuffles the registry itself - the drip is a
  // learning schedule, and a speed run is not learning, so it should not have to wait on one.
  const bandCounts = useMemo(() => {
    const by = new Map();
    for (const w of pool) by.set(w.band, (by.get(w.band) ?? 0) + 1);
    return [...by.entries()].sort((a, b) => a[0] - b[0]);
  }, [pool]);
  const bankIds = useMemo(
    () => pool.filter((w) => bands === 'all' || w.band === bands).map((w) => w.id),
    [pool, bands],
  );
  const bankDeck = useMemo(() => shuffleIds(bankIds, `bank:${today}:${bands}`), [bankIds, today, bands]);

  const queue = deck === 'daily' ? session
    : deck === 'speed' ? speedDeck.map((id) => ({ id, phase: 'speed', pass: null }))
      : deck === 'bank' ? bankDeck.map((id) => ({ id, phase: 'bank', pass: null }))
        : full.map((id) => ({ id, phase: 'all', pass: null }));

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
        : card.phase === 'speed' ? 'Speed run — bands below test level'
          : card.phase === 'bank' ? `Whole bank${bands === 'all' ? '' : ` — band ${bands} only`}`
            : `Full deck — every word you have met`;

  if (!introduced && deck !== 'speed' && deck !== 'bank') {
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
            className={'afq-btn' + (deck === 'bank' ? ' afq-primary' : ' afq-ghost')}
            onClick={() => switchDeck('bank')}
            title="Every word in the bank, shuffled - not just the ones the daily drip has handed out"
          >
            Bank {pool.length}
          </button>
          <button
            className={'afq-btn' + (deck === 'all' ? ' afq-primary' : ' afq-ghost')}
            onClick={() => switchDeck('all')}
            title="Only the words you have already been introduced to, shuffled"
          >
            Met {introduced}
          </button>
          {speedIds.length > 0 && (
            <button
              className={'afq-btn' + (deck === 'speed' ? ' afq-primary' : ' afq-ghost')}
              onClick={() => switchDeck('speed')}
              title="Bands below the level the test asks - for pace, not for learning"
            >
              Speed {speedIds.length}
            </button>
          )}
        </div>
        <span className="afq-cards-phase">{phaseLabel}</span>
        <span className="afq-cards-count">{queue.length ? idx + 1 : 0} / {queue.length}</span>
      </header>

      {deck === 'bank' && (
        <div className="afq-cards-bands">
          <button
            className={'afq-cards-band' + (bands === 'all' ? ' afq-on' : '')}
            onClick={() => { setBands('all'); setIdx(0); setShown(false); }}
          >
            All {pool.length}
          </button>
          {bandCounts.map(([b, n]) => (
            <button
              key={b}
              className={'afq-cards-band' + (bands === b ? ' afq-on' : '')}
              onClick={() => { setBands(b); setIdx(0); setShown(false); }}
              title={b >= TEST_LEVEL_BAND ? 'At or above the level the test asks' : 'Below test level - speed practice'}
            >
              Band {b} · {n}
            </button>
          ))}
        </div>
      )}

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
              ? 'That is today’s review. Add more words below, or switch to the whole bank.'
              : deck === 'bank'
                ? 'That is every word in the bank. Switch bands, or come back tomorrow for a fresh shuffle.'
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
