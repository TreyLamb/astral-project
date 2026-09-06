import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAfoqt } from '../AfoqtApp';
import { RANKS, RANK_IDS, PRESETS, byId } from './rankData';
import { Plates, PlateOnly, Epaulet } from './RankInsignia';

/**
 * Cadet rank drill.
 *
 * Two modes, because recognition and recall are different skills and the recitation is graded on
 * both: FLASHCARD shows the insignia and asks for the name (untracked - it is a deck to cycle),
 * PICK INSIGNIA gives the name and asks for the picture (scored, and misses are re-dealt until
 * the round is clear).
 *
 * THE SETTINGS ARE THE POINT OF THIS VERSION. Trey, 2026-09-05: "Set the rank quiz with settings
 * so I can choose which ones I do or don't want to see - so I can hyper focus on some or see some
 * more broadly." A drill over all eight spends most of its cards on grades that were never in
 * doubt; the two confusable pairs are where a recitation is actually lost. So the deck is a
 * selection, it persists, and there is a preset for exactly that four-grade subset.
 *
 * The run lives in a child mounted under a key built from the selection, the mode and the option
 * pool. Changing any of those must start a fresh round - a queue built from the old selection
 * would keep dealing grades that were just switched off - and a remount is how you say that in
 * React without a reset effect that fires a cascading render on every settings change.
 */

const MAX_OPTS = 4;
const DEFAULTS = { ranks: RANK_IDS, scope: 'all', mode: 'flash', form: 'both' };

const shuffle = (a) => {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export default function RankDrill() {
  const { progress, updateSettings } = useAfoqt();

  // Stored under settings.afrotc as one object. settings shallow-merges over the defaults in
  // afoqtStorage, so a whole-object replace is the correct write and no migration is needed for
  // a profile saved before this tab existed.
  const saved = useMemo(() => progress?.settings?.afrotc ?? {}, [progress]);
  const cfg = useMemo(() => ({ ...DEFAULTS, ...saved }), [saved]);
  const setCfg = useCallback(
    (patch) => updateSettings({ afrotc: { ...DEFAULTS, ...saved, ...patch } }),
    [updateSettings, saved],
  );

  // A stored id that no longer exists (or an empty list from a bad write) must not produce an
  // undrawable deck, so the selection is filtered back onto the real roster on read.
  const selected = useMemo(() => {
    const ids = (cfg.ranks ?? []).filter((id) => RANK_IDS.includes(id));
    return ids.length >= 2 ? ids : RANK_IDS;
  }, [cfg.ranks]);

  const { mode, form, scope } = cfg;
  const [showSettings, setShowSettings] = useState(false);

  const deck = useMemo(() => RANKS.filter((r) => selected.includes(r.id)), [selected]);
  const optCount = Math.min(MAX_OPTS, scope === 'all' ? RANKS.length : deck.length);

  const toggleRank = (id) => {
    const has = selected.includes(id);
    const nextIds = has ? selected.filter((x) => x !== id) : [...selected, id];
    // Two is the floor: one grade is not a quiz, and a multiple-choice card needs something to
    // sit beside the answer. Same guard shape as the drill's band picker.
    if (nextIds.length < 2) return;
    setCfg({ ranks: RANK_IDS.filter((x) => nextIds.includes(x)) });
  };

  const activePreset = PRESETS.find((p) => sameSet(p.ids, selected));

  return (
    <div className="afq-rotc-drill">
      <div className="afq-rotc-bar">
        <div className="afq-rotc-seg" role="group" aria-label="Mode">
          <button className={mode === 'flash' ? 'on' : ''} onClick={() => setCfg({ mode: 'flash' })}>Flashcard</button>
          <button className={mode === 'mc' ? 'on' : ''} onClick={() => setCfg({ mode: 'mc' })}>Pick insignia</button>
        </div>
        <div className="afq-rotc-seg" role="group" aria-label="Insignia form">
          <button className={form === 'both' ? 'on' : ''} onClick={() => setCfg({ form: 'both' })}>Both</button>
          <button className={form === 'epaulet' ? 'on' : ''} onClick={() => setCfg({ form: 'epaulet' })}>Epaulet</button>
          <button className={form === 'pin' ? 'on' : ''} onClick={() => setCfg({ form: 'pin' })}>Pin</button>
        </div>
        <button
          className={'afq-btn afq-rotc-settings-btn' + (showSettings ? ' afq-primary' : '')}
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          Grades in deck: {selected.length} of {RANKS.length}
          {activePreset && activePreset.id !== 'all' ? ` · ${activePreset.label}` : ''}
        </button>
      </div>

      {showSettings && (
        <div className="afq-rotc-settings">
          <h4>Which grades do you want dealt?</h4>
          <div className="afq-rotc-presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={'afq-btn' + (activePreset?.id === p.id ? ' afq-primary' : '')}
                onClick={() => setCfg({ ranks: p.ids })}
                title={p.hint}
              >
                {p.label}
                <span className="afq-rotc-preset-hint">{p.hint}</span>
              </button>
            ))}
          </div>

          <div className="afq-rotc-checks">
            {RANKS.map((r) => {
              const on = selected.includes(r.id);
              return (
                <label key={r.id} className={'afq-rotc-check' + (on ? ' on' : '')}>
                  <input type="checkbox" checked={on} onChange={() => toggleRank(r.id)} />
                  <Epaulet rank={r} size={74} />
                  <span className="afq-rotc-check-txt">
                    <b>{r.abbr}</b>
                    <span>{r.name}</span>
                    <em>{r.tier}</em>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="afq-rotc-scope">
            <h4>Wrong options come from</h4>
            <div className="afq-rotc-seg" role="group" aria-label="Distractor pool">
              <button className={scope === 'all' ? 'on' : ''} onClick={() => setCfg({ scope: 'all' })}>All eight grades</button>
              <button className={scope === 'selected' ? 'on' : ''} onClick={() => setCfg({ scope: 'selected' })}>Only the ones I picked</button>
            </div>
            <p className="afq-note">
              {scope === 'all'
                ? 'A two-grade drill whose options are only those two grades is a coin flip. Wrong answers are drawn from the whole roster so a narrow deck still has to be recognised, not guessed.'
                : `Strict focus: nothing outside your selection is ever shown. With ${selected.length} picked, each card offers ${optCount} option${optCount === 1 ? '' : 's'}.`}
            </p>
          </div>

          <p className="afq-note">Two grades is the minimum — the last two cannot be switched off.</p>
        </div>
      )}

      <DrillRun key={`${selected.join(',')}|${mode}|${scope}`} deck={deck} mode={mode} form={form} scope={scope} />
    </div>
  );
}

/** Build a fresh round. Pure apart from the shuffle. */
function makeRun(deck, optionPool, optCount) {
  const queue = shuffle(deck);
  const opts = queue.length ? dealOpts(queue[0], optionPool, optCount) : [];
  return { queue, i: 0, revealed: false, answered: null, firstTry: {}, missed: [], right: 0, wrong: 0, done: false, opts };
}

function dealOpts(rank, optionPool, optCount) {
  const others = shuffle(optionPool.filter((r) => r.id !== rank.id)).slice(0, optCount - 1);
  return shuffle([rank, ...others]);
}

function DrillRun({ deck, mode, form, scope }) {
  // Drawing wrong answers from the whole roster keeps a small selection honest - a two-grade
  // drill whose options are only those two grades is a coin flip, which teaches the coin rather
  // than the insignia. Drawing them from the selection only is the stricter reading of "don't
  // want to see", so it is a choice in the settings, not a guess made here.
  const optionPool = scope === 'all' ? RANKS : deck;
  const optCount = Math.min(MAX_OPTS, optionPool.length);

  const [run, setRun] = useState(() => makeRun(deck, optionPool, optCount));
  const cur = run.done ? null : run.queue[run.i];

  const restart = useCallback(
    () => setRun(makeRun(deck, optionPool, optCount)),
    [deck, optionPool, optCount],
  );

  const next = useCallback(() => {
    setRun((s) => {
      const i = s.i + 1;
      if (i < s.queue.length) {
        return { ...s, i, revealed: false, answered: null, opts: dealOpts(s.queue[i], optionPool, optCount) };
      }
      // Flashcards are untracked, so a finished deck is simply finished. Only the scored mode
      // re-deals what was actually answered wrong - a round is not over until it is clear.
      if (mode === 'mc' && s.missed.length) {
        const queue = shuffle(s.missed);
        return { ...s, queue, missed: [], i: 0, revealed: false, answered: null, opts: dealOpts(queue[0], optionPool, optCount) };
      }
      return { ...s, done: true };
    });
  }, [mode, optionPool, optCount]);

  // Scored on the FIRST look at each grade. A re-dealt card still has to be cleared, but
  // answering it again must not move the counters or the tally runs past the deck size and the
  // percentage stops meaning anything.
  const answer = useCallback((id) => {
    setRun((s) => {
      if (s.answered !== null || s.done) return s;
      const r = s.queue[s.i];
      const ok = id === r.id;
      const firstTry = { ...s.firstTry };
      let { right, wrong } = s;
      if (!(r.id in firstTry)) {
        firstTry[r.id] = ok;
        if (ok) right++; else wrong++;
      }
      const missed = !ok && !s.missed.some((m) => m.id === r.id) ? [...s.missed, r] : s.missed;
      return { ...s, answered: id, firstTry, right, wrong, missed };
    });
  }, []);

  const reveal = useCallback(() => setRun((s) => ({ ...s, revealed: true })), []);

  // `run` is in the dependency list rather than read through a ref: re-binding one keydown
  // listener per card is free, and a ref written during render is exactly the stale-closure bug
  // this is avoiding.
  useEffect(() => {
    const onKey = (e) => {
      // A focused <button> already fires its own click on Space/Enter; without this the key
      // handler runs too and the card advances twice.
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return;
      if (e.key === 'r' || e.key === 'R') { restart(); return; }
      if (run.done) return;

      const n = parseInt(e.key, 10);
      if (mode === 'mc' && n >= 1 && n <= run.opts.length && run.answered === null) {
        e.preventDefault();
        answer(run.opts[n - 1].id);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'flash') { if (run.revealed) next(); else reveal(); }
        else if (run.answered !== null) next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, mode, answer, next, reveal, restart]);

  return (
    <>
      {mode === 'mc' && (
        <p className="afq-rotc-score">
          <b className="ok">{run.right}</b> right · <b className="no">{run.wrong}</b> missed
        </p>
      )}

      <div className="afq-rotc-prog">
        <i style={{ width: run.done ? '100%' : `${(run.i / run.queue.length) * 100}%` }} />
      </div>
      <div className="afq-rotc-prog-txt">
        <span>{run.done ? 'Deck complete' : `Card ${run.i + 1} of ${run.queue.length}`}</span>
        <span>{mode === 'flash' ? 'Insignia → name' : 'Name → insignia'}</span>
      </div>

      {run.done ? (
        <Done run={run} mode={mode} deck={deck} onAgain={restart} />
      ) : mode === 'flash' ? (
        <div className="afq-rotc-stage">
          <p className="afq-rotc-prompt">Which cadet grade is this?</p>
          <Plates rank={cur} form={form} />
          {run.revealed && (
            <div className="afq-rotc-answer">
              <p className="afq-rotc-rank">{cur.name}</p>
              <p className="afq-rotc-abbr">{cur.abbr}</p>
              <p className="afq-rotc-tier">{cur.tier}</p>
              <p className="afq-note">{cur.note}</p>
            </div>
          )}
          <div className="afq-rotc-actions">
            {run.revealed
              ? <button className="afq-btn afq-primary" onClick={next}>Next <kbd>Space</kbd></button>
              : <button className="afq-btn afq-primary" onClick={reveal}>Reveal <kbd>Space</kbd></button>}
          </div>
        </div>
      ) : (
        <div className="afq-rotc-stage">
          <p className="afq-rotc-prompt">Pick the matching insignia</p>
          <div className="afq-rotc-namecard">
            <p className="afq-rotc-rank">{cur.name}</p>
            <p className="afq-rotc-abbr">{cur.abbr}</p>
          </div>
          <div className={'afq-rotc-opts' + (form === 'pin' ? ' pins' : '')}>
            {run.opts.map((o, k) => {
              const settled = run.answered !== null;
              const cls = settled
                ? (o.id === cur.id ? ' correct' : o.id === run.answered ? ' wrong' : '')
                : '';
              return (
                <button key={o.id} className={'afq-rotc-opt' + cls} disabled={settled} onClick={() => answer(o.id)}>
                  <PlateOnly rank={o} form={form === 'pin' ? 'pin' : 'epaulet'} />
                  <span className="afq-rotc-key">{k + 1}</span>
                </button>
              );
            })}
          </div>
          {run.answered !== null && (
            <>
              <p className={'afq-rotc-verdict ' + (run.answered === cur.id ? 'ok' : 'no')}>
                {run.answered === cur.id
                  ? `Correct — ${cur.abbr}`
                  : `That was not ${cur.abbr} — the highlighted one is. ${byId(run.answered).abbr} is ${byId(run.answered).name}.`}
              </p>
              <div className="afq-rotc-actions">
                <button className="afq-btn afq-primary" onClick={next}>Next <kbd>Space</kbd></button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="afq-note afq-rotc-help">
        <kbd>Space</kbd> reveal, then next · <kbd>1</kbd>–<kbd>{optCount}</kbd> pick an option · <kbd>R</kbd> reshuffle.
        Officer stripes read <strong>outboard edge inward</strong>. Count widths, not stripes.
      </p>
    </>
  );
}

function Done({ run, mode, deck, onAgain }) {
  const fumbled = deck.filter((r) => run.firstTry[r.id] === false);
  const pct = deck.length ? Math.round((run.right / deck.length) * 100) : 0;
  return (
    <div className="afq-rotc-stage afq-rotc-done">
      <h3>{mode === 'flash' ? 'Deck done' : 'Round clear'}</h3>
      {mode === 'flash' ? (
        <p className="afq-note">All {deck.length} selected grade{deck.length === 1 ? '' : 's'} shown. Reshuffle and go again.</p>
      ) : (
        <>
          <p className="afq-rotc-big">{run.right}<span>/{deck.length}</span></p>
          <p className="afq-note">{pct}% first time. Every grade was cleared before the round ended.</p>
          {fumbled.length > 0 && (
            <div className="afq-rotc-missed">
              <strong>Missed first time</strong>
              <ul>{fumbled.map((r) => <li key={r.id}>{r.abbr} — {r.name}</li>)}</ul>
            </div>
          )}
        </>
      )}
      <div className="afq-rotc-actions">
        <button className="afq-btn afq-primary" onClick={onAgain}>Run again <kbd>R</kbd></button>
      </div>
    </div>
  );
}
