import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAfoqt } from '../AfoqtApp';
import { allWords } from '../engine/words';
import { todayStr } from '../afoqtStorage';
import { TEST_LEVEL_BAND } from '../engine/afoqtSpec';
import {
  WORDS_PER_DAY, NEW_PASSES, WINDOW_DAYS,
  introduceDay, addMore, removeRecent, buildSession, allDeck, introducedIds, idsForDay, remainingCount,
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
  // re-mount or a second visit cannot hand out another batch - see its own test. The count comes
  // from his own setting, not the hardcoded default - see afoqtStorage.js `wordsPerDay`.
  useEffect(() => {
    mutate((p) => introduceDay(p, pool, today, p.settings.wordsPerDay ?? WORDS_PER_DAY));
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
  // The speed decks (By band, Speed) used to be seeded by the CALENDAR DAY, so every restart
  // within the same day re-dealt the identical order - Trey, 2026-09-15: "everytime i start from
  // the beggning like 7 of the first 10 words are always the same." A speed run is meant to be
  // shuffled every time you pick it back up, not once every 24 hours - so the seed now lives in
  // React state and is re-rolled on every restart (switching into the deck, or picking a band),
  // while `useMemo` below still keeps it from reshuffling mid-session on an unrelated re-render.
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.random().toString(36).slice(2));
  const reshuffle = () => setShuffleSeed(Math.random().toString(36).slice(2));

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
  const speedDeck = useMemo(() => shuffleIds(speedIds, `speed:${shuffleSeed}`), [speedIds, shuffleSeed]);

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
  const bankDeck = useMemo(
    () => shuffleIds(bankIds, `bank:${shuffleSeed}:${bands}`),
    [bankIds, shuffleSeed, bands],
  );

  const queue = deck === 'daily' ? session
    : deck === 'speed' ? speedDeck.map((id) => ({ id, phase: 'speed', pass: null }))
      : deck === 'bank' ? bankDeck.map((id) => ({ id, phase: 'bank', pass: null }))
        : full.map((id) => ({ id, phase: 'all', pass: null }));

  const card = queue[idx] ?? null;
  const word = card ? byId.get(card.id) : null;
  // By-band is a pure speed run, not a recall check - there is nothing to test yourself on before
  // looking, so hiding the definition behind a flip only adds a second tap. Trey, on this deck
  // specifically: "clicking the word then goes NEXT. One tap. move on. not 2 taps in 2 different
  // places." So this deck shows both sides at once and the card itself IS the Next control -
  // every other deck keeps the flip-then-Next flow, where showing your own recall first is the
  // point.
  const isBankDeck = deck === 'bank';
  const revealed = isBankDeck || shown;

  // Reset to the front whenever the card changes - a flipped card carrying its state onto the
  // next word would show the answer before the question.
  const cardKey = card ? `${deck}:${idx}:${card.id}` : null;
  const lastKey = useRef(null);
  if (lastKey.current !== cardKey) { lastKey.current = cardKey; if (shown) setShown(false); }

  const go = useCallback((delta) => {
    setIdx((i) => Math.max(0, Math.min(queue.length - 1, i + delta)));
  }, [queue.length]);

  const switchDeck = (which) => {
    setDeck(which); setIdx(0); setShown(false);
    if (which === 'bank' || which === 'speed') reshuffle();
  };

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
  const wordsPerDay = progress.settings.wordsPerDay ?? WORDS_PER_DAY;

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
            title="Filter by band and speed through it - this is also where bands 3-5 live, not just band 1-2's Speed tab"
          >
            By band {pool.length}
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
              title="Bands 1-2 only, below the level the test asks - for pace, not for learning. For bands 3-5, use By band instead."
            >
              Speed (bands 1-2)
            </button>
          )}
        </div>
        <span className="afq-cards-phase">{phaseLabel}</span>
        <span className="afq-cards-count">{queue.length ? idx + 1 : 0} / {queue.length}</span>
      </header>

      {deck === 'bank' && (
        <div className="afq-cards-bands">
          <span className="afq-cards-bands-label">Speed through one band:</span>
          <button
            className={'afq-cards-band' + (bands === 'all' ? ' afq-on' : '')}
            onClick={() => { setBands('all'); setIdx(0); setShown(false); reshuffle(); }}
          >
            All {pool.length}
          </button>
          {bandCounts.map(([b, n]) => (
            <button
              key={b}
              className={'afq-cards-band' + (bands === b ? ' afq-on' : '')}
              onClick={() => { setBands(b); setIdx(0); setShown(false); reshuffle(); }}
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
          {/* The card itself is the whole control. On every other deck it flips (recall check,
              then a separate Next). On the bank deck it IS Next - one tap, move on. */}
          <button
            className={'afq-card' + (revealed ? ' afq-card-open' : '')}
            onClick={() => (isBankDeck ? go(1) : setShown((v) => !v))}
          >
            <span className="afq-card-word">{word.word.toUpperCase()}</span>
            {revealed && (
              <span className="afq-card-back">
                <span className="afq-card-pos">{word.pos}</span>
                <span className="afq-card-gloss">{word.gloss}</span>
                {word.sentence && <span className="afq-card-sentence">{word.sentence}</span>}
                {word.root && (
                  <span className="afq-card-root">
                    <span>
                      <strong>{word.root.form}</strong>
                      {word.root.lang && <span className="afq-card-root-lang"> {word.root.lang}</span>}
                      {' '}— {word.root.sense}
                    </span>
                    {/* Trey, 2026-09-15: "give more examples with those [prefixes/suffixes]...
                        even if they don't have a definition seeing t[he] words can be helpful." */}
                    {word.root.examples?.length > 0 && (
                      <span className="afq-card-root-examples">
                        also in: {word.root.examples.join(', ')}
                      </span>
                    )}
                  </span>
                )}
                <span className="afq-card-confusable">
                  not <strong>{word.confusable.word}</strong>, which means {word.confusable.meaning}
                </span>
                {/* Unlike everything above, `note` is written ONLY for the flashcard - it is
                    never a drill option, so it is free to actually explain a distinction instead
                    of being squeezed to one word. Trey, 2026-09-15: "arrogate means to claim? how
                    general and ambiguous" and "multifarious still seems like myriad." */}
                {word.note && <span className="afq-card-note">{word.note}</span>}
                {/* Three of the row's own five slate options, surfaced rather than authored -
                    see engine/words.js. `related` is deliberately NOT a synonym (it is the option
                    that punishes "close enough"), so it reads as a genuine near-miss, not a
                    second correct answer. */}
                <span className="afq-card-relations">
                  <span className="afq-card-rel afq-card-rel-syn"><b>≈</b> {word.answer}</span>
                  <span className="afq-card-rel"><b>~</b> {word.related}</span>
                  <span className="afq-card-rel afq-card-rel-ant"><b>≠</b> {word.antonym}</span>
                </span>
              </span>
            )}
            <span className="afq-card-hintrow">
              <span className="afq-card-band">Band {word.band}</span>
              <span className="afq-card-hint">
                {revealed ? (isBankDeck ? 'tap for next' : '') : 'tap to show'}
              </span>
            </span>
          </button>

          {!isBankDeck && (
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
          )}
          {/* Still reachable for the bank deck - keyboard/mouse users get Back without it costing
              the one-tap-forward promise on the card itself. */}
          {isBankDeck && idx > 0 && (
            <div className="afq-cards-nav">
              <button className="afq-cards-move" onClick={() => go(-1)} aria-label="Back">‹ Back</button>
            </div>
          )}
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
        {/* "On any day if I decide I need more words I want a button to add x new words" - and,
            2026-09-17, "or minus the newest 5 etc. i just want more control over that feature."
            Add and Remove share one count field since they are the same knob run in opposite
            directions: today's pool, built up or walked back down by hand. Add joins today's
            batch (so it gets the three new-word passes too); Remove trims from the END of
            today's list - the words most recently added - and never touches an earlier day. */}
        <div className="afq-row afq-wrap-row afq-cards-add">
          <label className="afq-cards-addlabel">
            <input
              type="number" min="1" max="100" value={addCount}
              onChange={(e) => setAddCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            />
            words
          </label>
          <button
            className="afq-btn afq-ghost"
            disabled={todayCount === 0}
            title={`Remove the ${addCount} most recently added word${addCount === 1 ? '' : 's'} from today`}
            onClick={() => { mutate((p) => removeRecent(p, today, addCount)); setIdx(0); setShown(false); setDeck('daily'); }}
          >
            − Remove
          </button>
          <button
            className="afq-btn afq-primary"
            disabled={left === 0}
            onClick={() => { mutate((p) => addMore(p, pool, today, addCount)); setIdx(0); setShown(false); setDeck('daily'); }}
          >
            {left === 0 ? 'Pool exhausted' : `+ Add ${addCount}`}
          </button>
        </div>
        {/* The starting size itself - his other ask: "let me choose how many words i want to
            review... i want to start with like 10." This only changes what a FUTURE fresh day
            introduces (introduceDay is idempotent per day - see engine/cards.js), not today's
            already-introduced batch, which is what the Add/Remove row above is for. */}
        <div className="afq-row afq-wrap-row">
          <label className="afq-cards-addlabel">
            New words per day
            <input
              type="number" min="1" max="100" value={wordsPerDay}
              onChange={(e) => {
                const n = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                mutate((p) => ({ ...p, settings: { ...p.settings, wordsPerDay: n } }));
              }}
            />
          </label>
          <span className="afq-note afq-cards-addnote">
            Tomorrow gets {wordsPerDay} new words automatically. Add/Remove above only touch today.
          </span>
        </div>
      </footer>
    </div>
  );
}
